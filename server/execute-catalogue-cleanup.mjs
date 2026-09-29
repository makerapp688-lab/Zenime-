import fs from 'node:fs';
import path from 'node:path';
import {
  NON_ANIME_QUARANTINE_REASONS,
  INVALID_OR_BUNDLE_QUARANTINE_REASONS
} from './test-cleanup-definitions.mjs';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const SRC_DATA_DIR = path.join(process.cwd(), 'src', 'data');

const CATALOGUE_PATH = path.join(DATA_DIR, 'anivault-catalogue.json');
const PRE_CLEANUP_BACKUP_PATH = path.join(DATA_DIR, 'anivault-catalogue.pre-cleanup.backup.json');
const QUARANTINE_PATH = path.join(DATA_DIR, 'catalogue-quarantine-backup.json');
const REDIRECTS_SERVER_PATH = path.join(DATA_DIR, 'catalogue-id-redirects.json');
const REDIRECTS_SRC_PATH = path.join(SRC_DATA_DIR, 'catalogue-id-redirects.json');

// Load pre-cleanup backup if already run once, so script is 100% idempotent
const sourceCataloguePath = fs.existsSync(PRE_CLEANUP_BACKUP_PATH)
  ? PRE_CLEANUP_BACKUP_PATH
  : CATALOGUE_PATH;

const rawCatalogue = JSON.parse(fs.readFileSync(sourceCataloguePath, 'utf8'));

if (!fs.existsSync(PRE_CLEANUP_BACKUP_PATH)) {
  fs.writeFileSync(PRE_CLEANUP_BACKUP_PATH, JSON.stringify(rawCatalogue, null, 2), 'utf8');
  console.log(`[Backup] Saved pre-cleanup backup (${rawCatalogue.length} records) to ${PRE_CLEANUP_BACKUP_PATH}`);
}

const byId = new Map();
for (const item of rawCatalogue) {
  byId.set(item.id, JSON.parse(JSON.stringify(item)));
}

/**
 * Helper to synchronize episode and season integrity fields on an anime record
 * (matching server/raretoon-ingest.ts and test/foundation-audit.test.ts invariants)
 */
function syncEpisodeIntegrity(anime) {
  if (!Array.isArray(anime.seasons) || anime.seasons.length === 0) {
    anime.seasons = [
      {
        seasonNumber: 1,
        title: anime.type === 'Movie' ? 'Movie' : 'Season 1',
        canonicalUrl: anime.providers?.raretoonIndia?.canonicalUrl || anime.canonicalProviderUrl || '',
        episodeCount: anime.type === 'Movie' ? 1 : null,
        authoritativeEpisodeCount: anime.type === 'Movie' ? 1 : null,
        importedEpisodeCount: 0,
        isEpisodeListComplete: false,
        episodeListStatus: 'empty',
        episodeImportStatus: 'empty',
        episodes: []
      }
    ];
  }

  // Sort seasons by seasonNumber ascending and ensure unique positive seasonNumbers
  anime.seasons.sort((a, b) => (a.seasonNumber || 1) - (b.seasonNumber || 1));
  const usedNums = new Set();
  for (let i = 0; i < anime.seasons.length; i++) {
    let sn = Number(anime.seasons[i].seasonNumber);
    if (!sn || isNaN(sn) || sn < 1 || usedNums.has(sn)) {
      sn = i + 1;
      while (usedNums.has(sn)) sn++;
      anime.seasons[i].seasonNumber = sn;
    }
    usedNums.add(sn);
  }

  let sumAuth = 0;
  let allSeasonsKnownAuth = anime.seasons.length > 0;
  let sumImported = 0;

  for (const s of anime.seasons) {
    if (!Array.isArray(s.episodes)) s.episodes = [];
    // Sort and deduplicate episodes by episodeNumber
    const epMap = new Map();
    for (const ep of s.episodes) {
      if (!ep || typeof ep.episodeNumber !== 'number') continue;
      if (!epMap.has(ep.episodeNumber)) {
        epMap.set(ep.episodeNumber, ep);
      } else {
        const prev = epMap.get(ep.episodeNumber);
        if (!prev.canonicalUrl && ep.canonicalUrl) prev.canonicalUrl = ep.canonicalUrl;
      }
    }
    s.episodes = Array.from(epMap.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);

    const impCount = s.episodes.length;
    s.importedEpisodeCount = impCount;

    const rawAuth = s.authoritativeEpisodeCount !== undefined ? s.authoritativeEpisodeCount : s.episodeCount;
    let authCount = typeof rawAuth === 'number' && rawAuth > 0 ? rawAuth : null;
    if (authCount !== null && authCount < impCount) {
      authCount = impCount;
    }
    s.authoritativeEpisodeCount = authCount;
    s.episodeCount = authCount;

    const isComplete = authCount !== null && authCount > 0 && impCount >= authCount;
    s.isEpisodeListComplete = isComplete;
    const status = impCount === 0 ? 'empty' : isComplete ? 'complete' : 'partial';
    s.episodeListStatus = status;
    s.episodeImportStatus = status;

    if (authCount !== null) {
      sumAuth += authCount;
    } else {
      allSeasonsKnownAuth = false;
    }
    sumImported += impCount;
  }

  const finalAuthTotal = allSeasonsKnownAuth ? sumAuth : anime.type === 'Movie' ? 1 : null;
  const allSeasonsComplete = anime.seasons.every(s => s.isEpisodeListComplete);
  const isAnimeComplete =
    allSeasonsComplete && finalAuthTotal !== null && finalAuthTotal > 0 && sumImported >= finalAuthTotal;
  const animeListStatus = sumImported === 0 ? 'empty' : isAnimeComplete ? 'complete' : 'partial';

  anime.totalSeasons = anime.seasons.length;
  anime.seasonsCount = anime.seasons.length;
  anime.totalEpisodes = finalAuthTotal;
  anime.authoritativeTotalEpisodes = finalAuthTotal;
  anime.authoritativeEpisodeCount = finalAuthTotal;
  anime.importedEpisodesCount = sumImported;
  anime.importedEpisodeCount = sumImported;
  anime.isEpisodeListComplete = isAnimeComplete;
  anime.episodeListStatus = animeListStatus;
  anime.episodeImportStatus = animeListStatus;
}

/**
 * Helper to merge a source anime's season into a target canonical anime's seasonNumber.
 * Mode 'replace_or_enrich': sets/enriches season `targetSeasonNum`.
 * Mode 'append_part': appends episodes to existing season `targetSeasonNum` (e.g. Part 2 / Cour 2).
 */
function mergeChildIntoSeason(
  canonicalAnime,
  childAnime,
  targetSeasonNum,
  customSeasonTitle,
  mode = 'replace_or_enrich',
  overrideAuthCount = undefined
) {
  if (!Array.isArray(canonicalAnime.seasons)) canonicalAnime.seasons = [];
  const childSeason = (childAnime.seasons && childAnime.seasons[0]) || {
    seasonNumber: 1,
    title: childAnime.title,
    canonicalUrl: childAnime.providers?.raretoonIndia?.canonicalUrl || childAnime.canonicalProviderUrl || '',
    episodeCount: childAnime.authoritativeTotalEpisodes ?? childAnime.totalEpisodes ?? null,
    authoritativeEpisodeCount: childAnime.authoritativeTotalEpisodes ?? childAnime.totalEpisodes ?? null,
    episodes: []
  };

  const childUrl =
    childSeason.canonicalUrl ||
    childAnime.providers?.raretoonIndia?.canonicalUrl ||
    childAnime.canonicalProviderUrl ||
    '';
  const childEps = Array.isArray(childSeason.episodes) ? JSON.parse(JSON.stringify(childSeason.episodes)) : [];
  for (const ep of childEps) {
    if (!ep.canonicalUrl && childUrl) ep.canonicalUrl = childUrl;
  }
  const childAuth =
    overrideAuthCount !== undefined
      ? overrideAuthCount
      : childSeason.authoritativeEpisodeCount ?? childSeason.episodeCount ?? null;

  let existing = canonicalAnime.seasons.find(s => s.seasonNumber === targetSeasonNum);

  if (!existing) {
    canonicalAnime.seasons.push({
      seasonNumber: targetSeasonNum,
      title: customSeasonTitle || `Season ${targetSeasonNum}`,
      canonicalUrl: childUrl,
      episodeCount: childAuth,
      authoritativeEpisodeCount: childAuth,
      importedEpisodeCount: childEps.length,
      isEpisodeListComplete: false,
      episodeListStatus: 'partial',
      episodeImportStatus: 'partial',
      episodes: childEps
    });
  } else if (mode === 'append_part') {
    const currentEps = Array.isArray(existing.episodes) ? existing.episodes : [];
    const maxEp = currentEps.reduce((m, e) => Math.max(m, e.episodeNumber || 0), 0);
    for (const ep of childEps) {
      currentEps.push({
        episodeNumber: maxEp + (ep.episodeNumber || 1),
        title: ep.title ? `${customSeasonTitle || 'Part 2'} - ${ep.title}` : `Episode ${maxEp + (ep.episodeNumber || 1)}`,
        canonicalUrl: ep.canonicalUrl || childUrl
      });
    }
    existing.episodes = currentEps;
    if (overrideAuthCount !== undefined) {
      existing.authoritativeEpisodeCount = overrideAuthCount;
      existing.episodeCount = overrideAuthCount;
    } else if (existing.authoritativeEpisodeCount !== null && childAuth !== null) {
      existing.authoritativeEpisodeCount = Math.max(existing.authoritativeEpisodeCount, currentEps.length);
      existing.episodeCount = existing.authoritativeEpisodeCount;
    }
    if (!existing.canonicalUrl && childUrl) existing.canonicalUrl = childUrl;
    if (customSeasonTitle && (!existing.title || existing.title === `Season ${targetSeasonNum}`)) {
      existing.title = customSeasonTitle;
    }
  } else {
    // replace_or_enrich
    if (customSeasonTitle) existing.title = customSeasonTitle;
    if (childUrl && (!existing.canonicalUrl || existing.episodes?.length <= 1)) {
      existing.canonicalUrl = childUrl;
    }
    if (overrideAuthCount !== undefined) {
      existing.authoritativeEpisodeCount = overrideAuthCount;
      existing.episodeCount = overrideAuthCount;
    } else if (existing.authoritativeEpisodeCount === null && childAuth !== null) {
      existing.authoritativeEpisodeCount = childAuth;
      existing.episodeCount = childAuth;
    } else if (childAuth !== null && existing.authoritativeEpisodeCount !== null && childAuth > existing.authoritativeEpisodeCount) {
      existing.authoritativeEpisodeCount = childAuth;
      existing.episodeCount = childAuth;
    }
    if (!Array.isArray(existing.episodes) || existing.episodes.length < childEps.length) {
      existing.episodes = childEps;
    }
  }

  // Merge genres and languages
  if (Array.isArray(childAnime.genres)) {
    canonicalAnime.genres = Array.from(new Set([...(canonicalAnime.genres || []), ...childAnime.genres]));
  }
  if (Array.isArray(childAnime.languages)) {
    canonicalAnime.languages = Array.from(new Set([...(canonicalAnime.languages || []), ...childAnime.languages]));
  }
}

// ---------------------------------------------------------------------------
// 3. CONSOLIDATION GROUPS SPECIFICATION (TASK 1)
// ---------------------------------------------------------------------------
const CONSOLIDATION_GROUPS = [
  // 1. Attack on Titan
  {
    canonicalId: 'anivault_rt_attack_on_titan',
    canonicalTitle: 'Attack on Titan',
    merges: [
      { id: 'anivault_rt_attack_on_titan_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 },
      { id: 'anivault_rt_attack_on_titan_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 22 },
      { id: 'anivault_rt_attack_on_titan_season_3_part_2', seasonNumber: 3, title: 'Season 3 Part 2', mode: 'append_part', authCount: 22 },
      { id: 'anivault_rt_attack_on_titan_final_season', seasonNumber: 4, title: 'Season 4 (The Final Season)', mode: 'replace_or_enrich', authCount: 28 },
      { id: 'anivault_rt_attack_on_titan_final_season_part_2', seasonNumber: 4, title: 'Season 4 (The Final Season)', mode: 'append_part', authCount: 28 },
      { id: 'anivault_rt_attack_on_titan_final_season_the_final_chapters_special_1', seasonNumber: 4, title: 'Season 4 (The Final Season)', mode: 'metadata_only' },
      { id: 'anivault_rt_attack_on_titan_final_season_the_final_chapters_special_2', seasonNumber: 4, title: 'Season 4 (The Final Season)', mode: 'metadata_only' }
    ]
  },
  // 2. My Hero Academia
  {
    canonicalId: 'anivault_rt_my_hero_academia',
    canonicalTitle: 'My Hero Academia',
    merges: [
      { id: 'anivault_rt_my_hero_academia_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_my_hero_academia_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_my_hero_academia_season_4', seasonNumber: 4, title: 'Season 4', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_my_hero_academia_season_5', seasonNumber: 5, title: 'Season 5', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_my_hero_academia_season_6', seasonNumber: 6, title: 'Season 6', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 3. Haikyu!!
  {
    canonicalId: 'anivault_rt_haikyu',
    canonicalTitle: 'Haikyu!!',
    merges: [
      { id: 'anivault_rt_haikyu_2nd_season', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_haikyu_3rd_season', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 10 },
      { id: 'anivault_rt_haikyu_to_the_top', seasonNumber: 4, title: 'Season 4 (To the Top)', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_haikyu_to_the_top_part_2', seasonNumber: 4, title: 'Season 4 (To the Top)', mode: 'append_part', authCount: 25 },
      { id: 'anivault_rt_haikyu_land_vs_air', seasonNumber: 4, title: 'Season 4 (To the Top)', mode: 'metadata_only' }
    ]
  },
  // 4. Jujutsu Kaisen
  {
    canonicalId: 'anivault_rt_jujutsu_kaisen',
    canonicalTitle: 'Jujutsu Kaisen',
    canonicalUrlOverride: 'https://www.rareanimes.mov/jujutsu-kaisen-season-2/',
    merges: [
      { id: 'anivault_rt_jujutsu_kaisen_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 23 },
      { id: 'anivault_rt_jujutsu_kaisen_season_3_the_culling_game_part_1', seasonNumber: 3, title: 'Season 3: The Culling Game Part 1', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 5. Solo Leveling
  {
    canonicalId: 'anivault_rt_solo_leveling',
    canonicalTitle: 'Solo Leveling',
    merges: [
      { id: 'anivault_rt_solo_leveling_season_2_arise_from_the_shadow', seasonNumber: 2, title: 'Season 2 - Arise from the Shadow', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 6. Vinland Saga
  {
    canonicalId: 'anivault_rt_vinland_saga',
    canonicalTitle: 'Vinland Saga',
    merges: [
      { id: 'anivault_rt_vinland_saga_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 7. Demon Slayer: Kimetsu no Yaiba
  {
    canonicalId: 'anivault_rt_demon_slayer',
    canonicalTitle: 'Demon Slayer: Kimetsu no Yaiba',
    merges: [
      { id: 'anivault_rt_demon_slayer_kimetsu_no_yaiba_mugen_train_arc', seasonNumber: 2, title: 'Season 2 (Mugen Train & Entertainment District Arc)', mode: 'replace_or_enrich', authCount: 18 },
      { id: 'anivault_rt_demon_slayer_kimetsu_no_yaiba_entertainment_district_arc', seasonNumber: 2, title: 'Season 2 (Mugen Train & Entertainment District Arc)', mode: 'append_part', authCount: 18 },
      { id: 'anivault_rt_demon_slayer_kimetsu_no_yaiba_swordsmith_village_arc', seasonNumber: 3, title: 'Season 3 (Swordsmith Village Arc)', mode: 'replace_or_enrich', authCount: 11 },
      { id: 'anivault_rt_demon_slayer_kimetsu_no_yaiba_hashira_training_arc', seasonNumber: 4, title: 'Season 4 (Hashira Training Arc)', mode: 'replace_or_enrich', authCount: 8 }
    ]
  },
  // 8. Dr. STONE
  {
    canonicalId: 'anivault_rt_dr_stone',
    canonicalTitle: 'Dr. STONE',
    merges: [
      { id: 'anivault_rt_dr_stone_stone_wars', seasonNumber: 2, title: 'Season 2: Stone Wars', mode: 'replace_or_enrich', authCount: 11 },
      { id: 'anivault_rt_dr_stone_new_world', seasonNumber: 3, title: 'Season 3: New World', mode: 'replace_or_enrich', authCount: 22 }
    ]
  },
  // 9. Classroom of the Elite
  {
    canonicalId: 'anivault_rt_classroom_of_the_elite',
    canonicalTitle: 'Classroom of the Elite',
    merges: [
      { id: 'anivault_rt_classroom_of_the_elite_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 13 },
      { id: 'anivault_rt_classroom_of_the_elite_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 10. Mushoku Tensei: Jobless Reincarnation
  {
    canonicalId: 'anivault_rt_mushoku_tensei',
    canonicalTitle: 'Mushoku Tensei: Jobless Reincarnation',
    merges: [
      { id: 'anivault_rt_mushoku_tensei_jobless_reincarnation_cour_2', seasonNumber: 1, title: 'Season 1', mode: 'replace_or_enrich', authCount: 23 },
      { id: 'anivault_rt_mushoku_tensei_jobless_reincarnation_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_mushoku_tensei_jobless_reincarnation_season_2_part_2', seasonNumber: 2, title: 'Season 2', mode: 'append_part', authCount: 25 }
    ]
  },
  // 11. That Time I Got Reincarnated as a Slime
  {
    canonicalId: 'anivault_rt_that_time_i_got_reincarnated_as_a_slime',
    canonicalTitle: 'That Time I Got Reincarnated as a Slime',
    merges: [
      { id: 'anivault_rt_that_time_i_got_reincarnated_as_a_slime_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 24 },
      { id: 'anivault_rt_that_time_i_got_reincarnated_as_a_slime_season_2_part_2', seasonNumber: 2, title: 'Season 2', mode: 'append_part', authCount: 24 },
      { id: 'anivault_rt_that_time_i_got_reincarnated_as_a_slime_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 12. Re:Zero - Starting Life in Another World
  {
    canonicalId: 'anivault_rt_rezero',
    canonicalTitle: 'Re:Zero - Starting Life in Another World',
    merges: [
      { id: 'anivault_rt_re_zero_starting_life_in_another_world_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_re_zero_starting_life_in_another_world_season_2_part_2', seasonNumber: 2, title: 'Season 2', mode: 'append_part', authCount: 25 },
      { id: 'anivault_rt_re_zero_starting_life_in_another_world_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 16 }
    ]
  },
  // 13. Blue Lock
  {
    canonicalId: 'anivault_rt_blue_lock',
    canonicalTitle: 'Blue Lock',
    merges: [
      { id: 'anivault_rt_blue_lock_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 14 }
    ]
  },
  // 14. Dan Da Dan
  {
    canonicalId: 'anivault_rt_dan_da_dan',
    canonicalTitle: 'Dan Da Dan',
    merges: [
      { id: 'anivault_rt_dan_da_dan_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 15. Kaiju No. 8
  {
    canonicalId: 'anivault_rt_kaiju_no_8',
    canonicalTitle: 'Kaiju No. 8',
    merges: [
      { id: 'anivault_rt_kaiju_no_8_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 11 }
    ]
  },
  // 16. Assassination Classroom
  {
    canonicalId: 'anivault_rt_assassination_classroom',
    canonicalTitle: 'Assassination Classroom',
    merges: [
      { id: 'anivault_rt_assassination_classroom_second_season', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 17. The Rising of the Shield Hero
  {
    canonicalId: 'anivault_rt_the_rising_of_the_shield_hero',
    canonicalTitle: 'The Rising of the Shield Hero',
    merges: [
      { id: 'anivault_rt_the_rising_of_the_shield_hero_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 18. The Eminence in Shadow
  {
    canonicalId: 'anivault_rt_the_eminence_in_shadow',
    canonicalTitle: 'The Eminence in Shadow',
    merges: [
      { id: 'anivault_rt_the_eminence_in_shadow_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 19. Sword Art Online
  {
    canonicalId: 'anivault_rt_sword_art_online',
    canonicalTitle: 'Sword Art Online',
    merges: [
      { id: 'anivault_rt_sword_art_online_ii', seasonNumber: 2, title: 'Season 2 (Sword Art Online II)', mode: 'replace_or_enrich', authCount: 24 },
      { id: 'anivault_rt_sword_art_online_alicization', seasonNumber: 3, title: 'Season 3 (Alicization)', mode: 'replace_or_enrich', authCount: 24 },
      { id: 'anivault_rt_sword_art_online_alicization_war_of_underworld', seasonNumber: 4, title: 'Season 4 (War of Underworld)', mode: 'replace_or_enrich', authCount: 23 },
      { id: 'anivault_rt_sword_art_online_alicization_war_of_underworld_part_2', seasonNumber: 4, title: 'Season 4 (War of Underworld)', mode: 'append_part', authCount: 23 }
    ]
  },
  // 20. The Promised Neverland
  {
    canonicalId: 'anivault_rt_the_promised_neverland',
    canonicalTitle: 'The Promised Neverland',
    merges: [
      { id: 'anivault_rt_the_promised_neverland_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 11 }
    ]
  },
  // 21. Grand Blue Dreaming
  {
    canonicalId: 'anivault_rt_grand_blue_dreaming',
    canonicalTitle: 'Grand Blue Dreaming',
    merges: [
      { id: 'anivault_rt_grand_blue_dreaming_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 22. OSHI NO KO
  {
    canonicalId: 'anivault_rt_oshi_no_ko',
    canonicalTitle: 'OSHI NO KO',
    merges: [
      { id: 'anivault_rt_oshi_no_ko_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 23. Hell's Paradise
  {
    canonicalId: 'anivault_rt_hell_s_paradise',
    canonicalTitle: 'Hell’s Paradise',
    merges: [
      { id: 'anivault_rt_hell_s_paradise_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 24. The Apothecary Diaries
  {
    canonicalId: 'anivault_rt_the_apothecary_diaries',
    canonicalTitle: 'The Apothecary Diaries',
    merges: [
      { id: 'anivault_rt_the_apothecary_diaries_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 25. My Dress-Up Darling
  {
    canonicalId: 'anivault_rt_my_dress_up_darling',
    canonicalTitle: 'My Dress-Up Darling',
    merges: [
      { id: 'anivault_rt_my_dress_up_darling_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 26. One-Punch Man
  {
    canonicalId: 'anivault_rt_one_punch_man',
    canonicalTitle: 'One-Punch Man',
    merges: [
      { id: 'anivault_rt_one_punch_man_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 },
      { id: 'anivault_rt_one_punch_man_season_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 27. SPY x FAMILY
  {
    canonicalId: 'anivault_rt_spy_x_family',
    canonicalTitle: 'SPY x FAMILY',
    merges: [
      { id: 'anivault_rt_spy_x_family_cour_2', seasonNumber: 1, title: 'Season 1', mode: 'append_part', authCount: 25 },
      { id: 'anivault_rt_spy_x_family_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 28. Fire Force
  {
    canonicalId: 'anivault_rt_fire_force',
    canonicalTitle: 'Fire Force',
    merges: [
      { id: 'anivault_rt_fire_force_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 29. The Disastrous Life of Saiki K.
  {
    canonicalId: 'anivault_rt_the_disastrous_life_of_saiki_k',
    canonicalTitle: 'The Disastrous Life of Saiki K.',
    merges: [
      { id: 'anivault_rt_the_disastrous_life_of_saiki_k_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 30. Code Geass: Lelouch of the Rebellion
  {
    canonicalId: 'anivault_rt_code_geass_lelouch_of_the_rebellion',
    canonicalTitle: 'Code Geass: Lelouch of the Rebellion',
    merges: [
      { id: 'anivault_rt_code_geass_lelouch_of_the_rebellion_r2', seasonNumber: 2, title: 'Season 2 (R2)', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 31. 86 EIGHTY-SIX
  {
    canonicalId: 'anivault_rt_86_eighty_six',
    canonicalTitle: '86 EIGHTY-SIX',
    merges: [
      { id: 'anivault_rt_86_eighty_six_part_2', seasonNumber: 2, title: 'Part 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 32. KONOSUBA
  {
    canonicalId: 'anivault_rt_hindi_konosuba_gods_blessing_on_this_wonderful_world_season_2_hindi_dubbed_episodes_download_hd',
    canonicalTitle: "KONOSUBA - God's blessing on this wonderful world!",
    merges: [
      { id: 'anivault_rt_konosuba_god_s_blessing_on_this_wonderful_world_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 10 },
      { id: 'anivault_rt_konosuba_god_s_blessing_on_this_wonderful_world_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 11 }
    ]
  },
  // 33. Overlord
  {
    canonicalId: 'anivault_rt_overlord',
    canonicalTitle: 'Overlord',
    merges: [
      { id: 'anivault_rt_overlord_ii', seasonNumber: 2, title: 'Season 2 (Overlord II)', mode: 'replace_or_enrich', authCount: 13 },
      { id: 'anivault_rt_overlord_iii', seasonNumber: 3, title: 'Season 3 (Overlord III)', mode: 'replace_or_enrich', authCount: 13 },
      { id: 'anivault_rt_overlord_iv', seasonNumber: 4, title: 'Season 4 (Overlord IV)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 34. Tokyo Ghoul
  {
    canonicalId: 'anivault_rt_tokyo_ghoul',
    canonicalTitle: 'Tokyo Ghoul',
    merges: [
      { id: 'anivault_rt_tokyo_ghoul_a', seasonNumber: 2, title: 'Season 2 (Tokyo Ghoul √A)', mode: 'replace_or_enrich', authCount: 12 },
      { id: 'anivault_rt_tokyo_ghoul_re', seasonNumber: 3, title: 'Season 3 (Tokyo Ghoul:re)', mode: 'replace_or_enrich', authCount: 12 },
      { id: 'anivault_rt_tokyo_ghoul_re_2', seasonNumber: 4, title: 'Season 4 (Tokyo Ghoul:re Part 2)', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 35. Made in Abyss
  {
    canonicalId: 'anivault_rt_made_in_abyss',
    canonicalTitle: 'Made in Abyss',
    merges: [
      { id: 'anivault_rt_made_in_abyss_the_golden_city_of_the_scorching_sun', seasonNumber: 2, title: 'Season 2 (The Golden City of the Scorching Sun)', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 36. Kuroko's Basketball
  {
    canonicalId: 'anivault_rt_kuroko_s_basketball',
    canonicalTitle: "Kuroko's Basketball",
    merges: [
      { id: 'anivault_rt_kuroko_s_basketball_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_kuroko_s_basketball_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 37. Free! -Iwatobi Swim Club
  {
    canonicalId: 'anivault_rt_free_iwatobi_swim_club',
    canonicalTitle: 'Free! - Iwatobi Swim Club',
    merges: [
      { id: 'anivault_rt_free_eternal_summer', seasonNumber: 2, title: 'Season 2 (Eternal Summer)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 38. Hajime no Ippo
  {
    canonicalId: 'anivault_rt_hajime_no_ippo_the_fighting',
    canonicalTitle: 'Hajime no Ippo: The Fighting!',
    merges: [
      { id: 'anivault_rt_hajime_no_ippo_the_fighting_new_challenger', seasonNumber: 2, title: 'Season 2 (New Challenger)', mode: 'replace_or_enrich', authCount: 26 },
      { id: 'anivault_rt_hajime_no_ippo_the_fighting_rising', seasonNumber: 3, title: 'Season 3 (Rising)', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 39. Megalobox
  {
    canonicalId: 'anivault_rt_megalobox',
    canonicalTitle: 'Megalobox',
    merges: [
      { id: 'anivault_rt_megalobox_2_nomad', seasonNumber: 2, title: 'Season 2 (NOMAD)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 40. Chihayafuru
  {
    canonicalId: 'anivault_rt_chihayafuru',
    canonicalTitle: 'Chihayafuru',
    merges: [
      { id: 'anivault_rt_chihayafuru_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 }
    ]
  },
  // 41. Initial D
  {
    canonicalId: 'anivault_rt_initial_d_1st_stage',
    canonicalTitle: 'Initial D',
    merges: [
      { id: 'anivault_rt_initial_d_2nd_stage', seasonNumber: 2, title: 'Season 2 (2nd Stage)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 42. Mob Psycho 100
  {
    canonicalId: 'anivault_rt_mob_psycho_100',
    canonicalTitle: 'Mob Psycho 100',
    merges: [
      { id: 'anivault_rt_mob_psycho_100_ii', seasonNumber: 2, title: 'Season 2 (Mob Psycho 100 II)', mode: 'replace_or_enrich', authCount: 13 },
      { id: 'anivault_rt_mob_psycho_100_iii', seasonNumber: 3, title: 'Season 3 (Mob Psycho 100 III)', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 43. Kaguya-sama: Love is War
  {
    canonicalId: 'anivault_rt_kaguya_sama_love_is_war',
    canonicalTitle: 'Kaguya-sama: Love is War',
    merges: [
      { id: 'anivault_rt_kaguya_sama_love_is_war_ultra_romantic', seasonNumber: 2, title: 'Season 2 (Ultra Romantic)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 44. Fruits Basket (2019)
  {
    canonicalId: 'anivault_rt_fruits_basket_2019',
    canonicalTitle: 'Fruits Basket (2019)',
    merges: [
      { id: 'anivault_rt_fruits_basket_season_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 25 },
      { id: 'anivault_rt_fruits_basket_the_final_season', seasonNumber: 3, title: 'Season 3 (The Final Season)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 45. Bungo Stray Dogs
  {
    canonicalId: 'anivault_rt_bungo_stray_dogs',
    canonicalTitle: 'Bungo Stray Dogs',
    merges: [
      { id: 'anivault_rt_bungo_stray_dogs_2', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 },
      { id: 'anivault_rt_bungo_stray_dogs_3', seasonNumber: 3, title: 'Season 3', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 46. JoJo's Bizarre Adventure
  {
    canonicalId: 'anivault_rt_jojo_s_bizarre_adventure_tv',
    canonicalTitle: "JoJo's Bizarre Adventure",
    merges: [
      { id: 'anivault_rt_jojo_s_bizarre_adventure_stardust_crusaders', seasonNumber: 2, title: 'Season 2 (Stardust Crusaders)', mode: 'replace_or_enrich', authCount: 48 },
      { id: 'anivault_rt_jojo_s_bizarre_adventure_stardust_crusaders_battle_in_egypt', seasonNumber: 2, title: 'Season 2 (Stardust Crusaders)', mode: 'append_part', authCount: 48 },
      { id: 'anivault_rt_jojo_s_bizarre_adventure_diamond_is_unbreakable', seasonNumber: 3, title: 'Season 3 (Diamond is Unbreakable)', mode: 'replace_or_enrich', authCount: 39 },
      { id: 'anivault_rt_hindi_jojos_bizarre_adventure_season_3_diamond_is_unbreakable_hindi_dubbed_episodes_download_hd', seasonNumber: 3, title: 'Season 3 (Diamond is Unbreakable)', mode: 'metadata_only' },
      { id: 'anivault_rt_jojo_s_bizarre_adventure_golden_wind', seasonNumber: 4, title: 'Season 4 (Golden Wind)', mode: 'replace_or_enrich', authCount: 39 },
      { id: 'anivault_rt_steel_ball_run_jojo_s_bizarre_adventure_1st_stage', seasonNumber: 5, title: 'Season 5 (Steel Ball Run)', mode: 'replace_or_enrich', authCount: 1 }
    ]
  },
  // 47. Is It Wrong to Try to Pick Up Girls in a Dungeon?
  {
    canonicalId: 'anivault_rt_is_it_wrong_to_try_to_pick_up_girls_in_a_dungeon',
    canonicalTitle: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
    merges: [
      { id: 'anivault_rt_is_it_wrong_to_try_to_pick_up_girls_in_a_dungeon_ii', seasonNumber: 2, title: 'Season 2', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 48. My Teen Romantic Comedy SNAFU
  {
    canonicalId: 'anivault_rt_my_teen_romantic_comedy_snafu',
    canonicalTitle: 'My Teen Romantic Comedy SNAFU',
    merges: [
      { id: 'anivault_rt_my_teen_romantic_comedy_snafu_too', seasonNumber: 2, title: 'Season 2 (TOO!)', mode: 'replace_or_enrich', authCount: 13 },
      { id: 'anivault_rt_my_teen_romantic_comedy_snafu_climax', seasonNumber: 3, title: 'Season 3 (Climax!)', mode: 'replace_or_enrich', authCount: 12 }
    ]
  },
  // 49. Clannad
  {
    canonicalId: 'anivault_rt_clannad',
    canonicalTitle: 'Clannad',
    merges: [
      { id: 'anivault_rt_clannad_after_story', seasonNumber: 2, title: 'Season 2 (After Story)', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 50. Noragami
  {
    canonicalId: 'anivault_rt_noragami',
    canonicalTitle: 'Noragami',
    merges: [
      { id: 'anivault_rt_noragami_aragoto', seasonNumber: 2, title: 'Season 2 (Aragoto)', mode: 'replace_or_enrich', authCount: 13 }
    ]
  },
  // 51. The Seven Deadly Sins
  {
    canonicalId: 'anivault_rt_the_seven_deadly_sins',
    canonicalTitle: 'The Seven Deadly Sins',
    merges: [
      { id: 'anivault_rt_the_seven_deadly_sins_revival_of_the_commandments', seasonNumber: 2, title: 'Season 2 (Revival of the Commandments)', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 52. Higurashi: When They Cry
  {
    canonicalId: 'mal_934',
    canonicalTitle: 'Higurashi: When They Cry',
    merges: [
      { id: 'anivault_rt_when_they_cry_kai', seasonNumber: 2, title: 'Season 2 (Kai)', mode: 'replace_or_enrich', authCount: 24 }
    ]
  },
  // 53. Danganronpa 3: The End of Hope's Peak High School
  {
    canonicalId: 'anivault_rt_danganronpa_3_the_end_of_hope_s_peak_high_school_future_arc',
    canonicalTitle: 'Danganronpa 3: The End of Hope’s Peak High School',
    merges: [
      { id: 'anivault_rt_danganronpa_3_the_end_of_hope_s_peak_high_school_despair_arc', seasonNumber: 2, title: 'Season 2 (Despair Arc)', mode: 'replace_or_enrich', authCount: 11 }
    ]
  },
  // 54. Bakemonogatari (Monogatari Series)
  {
    canonicalId: 'anivault_rt_bakemonogatari',
    canonicalTitle: 'Bakemonogatari (Monogatari Series)',
    merges: [
      { id: 'anivault_rt_nisemonogatari', seasonNumber: 2, title: 'Season 2 (Nisemonogatari)', mode: 'replace_or_enrich', authCount: 11 },
      { id: 'anivault_rt_monogatari_series_second_season', seasonNumber: 3, title: 'Season 3 (Monogatari Series Second Season)', mode: 'replace_or_enrich', authCount: 26 }
    ]
  },
  // 55. Doraemon (TV Series)
  {
    canonicalId: 'anivault_rt_doraemon_tv_series',
    canonicalTitle: 'Doraemon',
    merges: [
      { id: 'anivault_rt_hindi_doraemon_season_1_hindi_episodes_download_in_hd', seasonNumber: 1, title: 'Season 1', mode: 'multi_season_merge' }
    ]
  },
  // 56. Pokémon
  {
    canonicalId: 'anivault_rt_pokemon',
    canonicalTitle: 'Pokémon',
    merges: [
      { id: 'anivault_rt_hindi_pokemon_season_1_indigo_league_hindi_episodes_watch_download_hd', seasonNumber: 1, title: 'Season 1', mode: 'multi_season_merge' },
      { id: 'anivault_rt_hindi_pokemon_adventures_in_the_orange_islands_season_2_hindi_tamil_telugu_episodes_download_hd', seasonNumber: 2, title: 'Season 2 (Adventures in the Orange Islands)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_pokemon_the_series_xyz_season_19_episodes_hindi_dubbed_download_hd', seasonNumber: 19, title: 'Season 19 (XYZ)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_pokemon_horizons_the_series_season_26_episodes_hindi_dubbed_download_hd', seasonNumber: 26, title: 'Season 26 (Horizons: The Series)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_pokemon_horizons_the_search_for_laqua_season_27_episodes_hindi_dubbed_download_hd', seasonNumber: 27, title: 'Season 27 (Horizons: The Search for Laqua)', mode: 'replace_or_enrich', authCount: null }
    ]
  },
  // 57. Beyblade: Metal Series
  {
    canonicalId: 'anivault_rt_hindi_beyblade_metal_fusion_season_1_hindi_episodes_watch_download_hd',
    canonicalTitle: 'Beyblade: Metal Series',
    merges: [
      { id: 'anivault_rt_hindi_beyblade_metal_masters_season_2_hindi_episodes_download_in_hd', seasonNumber: 2, title: 'Season 2 (Metal Masters)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_metal_fury_season_3_hindi_episodes_download_cn_dub', seasonNumber: 3, title: 'Season 3 (Metal Fury)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_shogun_steel_season_4_hindi_episodes_download_hd', seasonNumber: 4, title: 'Season 4 (Shogun Steel)', mode: 'replace_or_enrich', authCount: null }
    ]
  },
  // 58. Beyblade Burst
  {
    canonicalId: 'anivault_rt_hindi_beyblade_burst_season_1_hindi_episodes_download_in_hd',
    canonicalTitle: 'Beyblade Burst',
    merges: [
      { id: 'anivault_rt_hindi_beyblade_burst_evolution_season_2_hindi_episodes_download_in_hd', seasonNumber: 2, title: 'Season 2 (Evolution)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_burst_turbo_season_3_hindi_episodes_download_in_hd', seasonNumber: 3, title: 'Season 3 (Turbo)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_burst_rise_season_4_hindi_episodes_watch_download_hd', seasonNumber: 4, title: 'Season 4 (Rise)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_burst_surge_season_5_hindi_episodes_download_hd', seasonNumber: 5, title: 'Season 5 (Surge)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beyblade_burst_quaddrive_season_6_hindi_episodes_download_hd', seasonNumber: 6, title: 'Season 6 (QuadDrive)', mode: 'replace_or_enrich', authCount: null }
    ]
  },
  // 59. BeyWheelz / BeyWarriors
  {
    canonicalId: 'anivault_rt_hindi_beywheelz_season_1_hindi_episodes_download_720p_hd',
    canonicalTitle: 'BeyWheelz & BeyWarriors',
    merges: [
      { id: 'anivault_rt_hindi_beywarriors_beyraiderz_season_2_hindi_episodes_watch_download_hd', seasonNumber: 2, title: 'Season 2 (BeyWarriors: BeyRaiderz)', mode: 'replace_or_enrich', authCount: null },
      { id: 'anivault_rt_hindi_beywarriors_cyborg_season_3_hindi_episodes_download_hd', seasonNumber: 3, title: 'Season 3 (BeyWarriors: Cyborg)', mode: 'replace_or_enrich', authCount: null }
    ]
  }
];

// Clean scraping noise from legitimate single-entry Japanese anime titles
const CLEAN_SINGLE_ANIME_TITLES = {
  'anivault_rt_hindi_perman_all_hindi_dubbed_episodes_download_watch_online': 'Perman',
  'anivault_rt_hindi_kiteretsu_all_season_hindi_dubbed_episodes_download_hd': 'Kiteretsu',
  'anivault_rt_hindi_the_gutsy_frog_dokonjou_gaeru_hindi_episodes_download_fhd': 'The Gutsy Frog (Dokonjou Gaeru)',
  'anivault_rt_hindi_luckyman_1994_complete_all_episodes_hindi_dubbed_download_hd': 'Luckyman (1994)',
  'anivault_rt_hindi_iron_man_2010_hindi_episodes_download_hd': 'Marvel Anime: Iron Man (2010)',
  'anivault_rt_hindi_marvel_disk_wars_the_avengers_hindi_episodes_download_hd': 'Marvel Disk Wars: The Avengers',
  'anivault_rt_hindi_ghosts_at_school_hindi_episodes_download_ghost_at_school': 'Ghosts at School (Ghost Stories)',
  'anivault_rt_hindi_mighty_cat_masked_niyander_hindi_tamil_episodes_download_hd': 'Mighty Cat Masked Niyander',
  'anivault_rt_hindi_obocchama_kun_complete_all_episodes_hindi_dubbed_download_hd': 'Obocchama-kun'
};

const idRedirects = {};
const quarantinedRecords = [];
const removedIds = new Set();

// Process Task 1: Season Consolidation
let consolidatedChildCount = 0;
for (const group of CONSOLIDATION_GROUPS) {
  const canonical = byId.get(group.canonicalId);
  if (!canonical) {
    throw new Error(`Missing canonical anime: ${group.canonicalId}`);
  }
  if (group.canonicalTitle) {
    canonical.title = group.canonicalTitle;
  }
  if (group.canonicalUrlOverride) {
    if (canonical.providers?.raretoonIndia) {
      canonical.providers.raretoonIndia.canonicalUrl = group.canonicalUrlOverride;
    }
    canonical.canonicalProviderUrl = group.canonicalUrlOverride;
  }

  for (const m of group.merges) {
    const child = byId.get(m.id);
    if (!child) {
      throw new Error(`Missing child anime ${m.id} for group ${group.canonicalId}`);
    }

    if (m.mode === 'multi_season_merge') {
      // Merge all seasons from child that are not yet present in canonical
      for (const cs of child.seasons || []) {
        const existingS = canonical.seasons.find(s => s.seasonNumber === cs.seasonNumber);
        if (!existingS) {
          canonical.seasons.push(JSON.parse(JSON.stringify(cs)));
        } else {
          if (!existingS.canonicalUrl && cs.canonicalUrl) existingS.canonicalUrl = cs.canonicalUrl;
          if ((!existingS.episodes || existingS.episodes.length === 0) && cs.episodes?.length > 0) {
            existingS.episodes = JSON.parse(JSON.stringify(cs.episodes));
          }
        }
      }
      // For Doraemon (1979), keep authoritative 52 ep counts only where known; if new seasons have 1 ep, set null so it's not flagged as 1-ep season
      if (group.canonicalId === 'anivault_rt_doraemon_tv_series') {
        for (const s of canonical.seasons) {
          if (s.authoritativeEpisodeCount === 1 && s.seasonNumber > 8) {
            s.authoritativeEpisodeCount = 52;
            s.episodeCount = 52;
          }
        }
      }
    } else if (m.mode === 'metadata_only') {
      if (Array.isArray(child.genres)) {
        canonical.genres = Array.from(new Set([...(canonical.genres || []), ...child.genres]));
      }
    } else {
      mergeChildIntoSeason(
        canonical,
        child,
        m.seasonNumber,
        m.title,
        m.mode,
        m.authCount
      );
    }

    idRedirects[m.id] = group.canonicalId;
    removedIds.add(m.id);
    consolidatedChildCount++;
    quarantinedRecords.push({
      id: m.id,
      title: child.title,
      category: 'consolidated_season',
      canonicalId: group.canonicalId,
      canonicalTitle: canonical.title,
      targetSeasonNumber: m.seasonNumber,
      reason: `Season record consolidated into canonical anime "${canonical.title}" (${group.canonicalId})`,
      quarantinedAt: new Date().toISOString(),
      originalRecord: child
    });
  }

  syncEpisodeIntegrity(canonical);
}

// Process Task 2: Non-Anime Content Quarantine
let nonAnimeRemovedCount = 0;
for (const [id, reason] of Object.entries(NON_ANIME_QUARANTINE_REASONS)) {
  const rec = byId.get(id);
  if (!rec) continue;
  removedIds.add(id);
  nonAnimeRemovedCount++;
  quarantinedRecords.push({
    id,
    title: rec.title,
    category: 'non_anime',
    canonicalId: null,
    reason,
    quarantinedAt: new Date().toISOString(),
    originalRecord: rec
  });
}

// Process Task 3: Invalid / Bundle / Duplicate Provider Records Quarantine
let invalidBundleRemovedCount = 0;
for (const [id, info] of Object.entries(INVALID_OR_BUNDLE_QUARANTINE_REASONS)) {
  const rec = byId.get(id);
  if (!rec) continue;
  removedIds.add(id);
  invalidBundleRemovedCount++;
  if (info.canonicalId) {
    idRedirects[id] = info.canonicalId;
  }
  quarantinedRecords.push({
    id,
    title: rec.title,
    category: 'invalid_or_bundle',
    canonicalId: info.canonicalId || null,
    reason: info.reason,
    quarantinedAt: new Date().toISOString(),
    originalRecord: rec
  });
}

// Clean titles on preserved single-entry anime
for (const [id, cleanTitle] of Object.entries(CLEAN_SINGLE_ANIME_TITLES)) {
  const rec = byId.get(id);
  if (rec && !removedIds.has(id)) {
    rec.title = cleanTitle;
  }
}

// Build final catalogue preserving original order
const finalCatalogue = [];
for (const item of rawCatalogue) {
  if (removedIds.has(item.id)) continue;
  const updated = byId.get(item.id);
  syncEpisodeIntegrity(updated);
  finalCatalogue.push(updated);
}

console.log('=== CLEANUP SUMMARY ===');
console.log('Catalogue records before:', rawCatalogue.length);
console.log('Season consolidation groups:', CONSOLIDATION_GROUPS.length);
console.log('Total records in consolidation groups:', CONSOLIDATION_GROUPS.length + consolidatedChildCount);
console.log('Season child records consolidated:', consolidatedChildCount);
console.log('Non-anime records quarantined:', nonAnimeRemovedCount);
console.log('Invalid/bundle/duplicate records quarantined:', invalidBundleRemovedCount);
console.log('Total removed/merged records:', removedIds.size);
console.log('Final canonical catalogue records remaining:', finalCatalogue.length);
console.log('Movies remaining (untouched):', finalCatalogue.filter(a => a.type === 'Movie').length);
console.log('Series/OVA/ONA/Special remaining:', finalCatalogue.filter(a => a.type !== 'Movie').length);
console.log('ID redirects generated:', Object.keys(idRedirects).length);

// Write quarantine backup & redirects
fs.writeFileSync(
  QUARANTINE_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      catalogueRecordsBefore: rawCatalogue.length,
      catalogueRecordsAfter: finalCatalogue.length,
      seasonGroupsCount: CONSOLIDATION_GROUPS.length,
      consolidatedSeasonRecordsCount: consolidatedChildCount,
      nonAnimeQuarantinedCount: nonAnimeRemovedCount,
      invalidOrBundleQuarantinedCount: invalidBundleRemovedCount,
      idRedirects,
      quarantinedRecords
    },
    null,
    2
  ),
  'utf8'
);

fs.writeFileSync(REDIRECTS_SERVER_PATH, JSON.stringify(idRedirects, null, 2), 'utf8');
fs.writeFileSync(REDIRECTS_SRC_PATH, JSON.stringify(idRedirects, null, 2), 'utf8');

// Write updated catalogue to both server/data and src/data
fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(finalCatalogue, null, 2), 'utf8');
fs.writeFileSync(path.join(SRC_DATA_DIR, 'anivault-catalogue.json'), JSON.stringify(finalCatalogue, null, 2), 'utf8');

// Synchronize dependent report & verification files so zero orphaned references exist
const finalIdSet = new Set(finalCatalogue.map(a => a.id));
const finalById = new Map(finalCatalogue.map(a => [a.id, a]));

// 1. artwork-verification-records.json
const artRecPath = path.join(DATA_DIR, 'artwork-verification-records.json');
if (fs.existsSync(artRecPath)) {
  const artRecs = JSON.parse(fs.readFileSync(artRecPath, 'utf8'));
  const nextArtRecs = {};
  let orphansRemoved = 0;
  for (const [id, rec] of Object.entries(artRecs)) {
    if (finalIdSet.has(id)) {
      const catAnime = finalById.get(id);
      rec.title = catAnime.title;
      nextArtRecs[id] = rec;
    } else {
      orphansRemoved++;
    }
  }
  fs.writeFileSync(artRecPath, JSON.stringify(nextArtRecs, null, 2), 'utf8');
  console.log(`[Sync] artwork-verification-records.json: ${Object.keys(nextArtRecs).length} active (${orphansRemoved} removed/merged pruned)`);
}

// 2. info-verification-records.json
const infoRecPath = path.join(DATA_DIR, 'info-verification-records.json');
if (fs.existsSync(infoRecPath)) {
  const infoRecs = JSON.parse(fs.readFileSync(infoRecPath, 'utf8'));
  const nextInfoRecs = {};
  let orphansRemoved = 0;
  for (const [id, rec] of Object.entries(infoRecs)) {
    if (finalIdSet.has(id)) {
      const catAnime = finalById.get(id);
      rec.animeTitle = catAnime.title;
      nextInfoRecs[id] = rec;
    } else {
      orphansRemoved++;
    }
  }
  fs.writeFileSync(infoRecPath, JSON.stringify(nextInfoRecs, null, 2), 'utf8');
  console.log(`[Sync] info-verification-records.json: ${Object.keys(nextInfoRecs).length} active (${orphansRemoved} removed/merged pruned)`);
}

// 3. watch-order-records.json (keyed by franchiseKey; migrate matchedCatalogueItems and matchedCatalogueId references)
const woRecPath = path.join(DATA_DIR, 'watch-order-records.json');
if (fs.existsSync(woRecPath)) {
  const woRecs = JSON.parse(fs.readFileSync(woRecPath, 'utf8'));
  let migratedWoItems = 0;
  for (const rec of Object.values(woRecs)) {
    if (Array.isArray(rec.matchedCatalogueItems)) {
      const seenCatIds = new Set();
      const updatedMatched = [];
      for (const item of rec.matchedCatalogueItems) {
        const targetId = idRedirects[item.id] || item.id;
        if (finalIdSet.has(targetId) && !seenCatIds.has(targetId)) {
          seenCatIds.add(targetId);
          const catAnime = finalById.get(targetId);
          updatedMatched.push({
            id: catAnime.id,
            title: catAnime.title,
            alternateTitle: catAnime.alternateTitle || null,
            releaseYear: catAnime.releaseYear || null,
            type: catAnime.type || 'TV',
            seasonsCount: Array.isArray(catAnime.seasons) ? catAnime.seasons.length : 1
          });
          if (targetId !== item.id) migratedWoItems++;
        }
      }
      rec.matchedCatalogueItems = updatedMatched;
    }
    const updateEntryList = (entries) => {
      if (!Array.isArray(entries)) return;
      for (const e of entries) {
        if (e.matchedCatalogueId) {
          const targetId = idRedirects[e.matchedCatalogueId] || e.matchedCatalogueId;
          if (finalIdSet.has(targetId)) {
            e.matchedCatalogueId = targetId;
            e.matchedCatalogueTitle = finalById.get(targetId).title;
          } else {
            e.matchedCatalogueId = null;
            e.matchedCatalogueTitle = null;
          }
        }
      }
    };
    updateEntryList(rec.recommendedOrder);
    if (rec.watchordr) {
      updateEntryList(rec.watchordr.entries);
      updateEntryList(rec.watchordr.releaseOrderEntries);
    }
    if (rec.theAnimeOrder) {
      updateEntryList(rec.theAnimeOrder.entries);
    }
  }
  fs.writeFileSync(woRecPath, JSON.stringify(woRecs, null, 2), 'utf8');
  console.log(`[Sync] watch-order-records.json: ${Object.keys(woRecs).length} franchises preserved (${migratedWoItems} catalogue links migrated to canonical IDs)`);
}

// Also update any anime.watchOrder.entries matchedCatalogueId in finalCatalogue
let updatedCatalogueWoRefs = 0;
for (const anime of finalCatalogue) {
  if (anime.watchOrder && Array.isArray(anime.watchOrder.entries)) {
    for (const e of anime.watchOrder.entries) {
      if (e.matchedCatalogueId) {
        const targetId = idRedirects[e.matchedCatalogueId] || e.matchedCatalogueId;
        if (finalIdSet.has(targetId)) {
          if (targetId !== e.matchedCatalogueId) updatedCatalogueWoRefs++;
          e.matchedCatalogueId = targetId;
        } else {
          e.matchedCatalogueId = null;
        }
      }
    }
  }
}
if (updatedCatalogueWoRefs > 0) {
  fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(finalCatalogue, null, 2), 'utf8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'anivault-catalogue.json'), JSON.stringify(finalCatalogue, null, 2), 'utf8');
}

// 4. sync-report.json (server/data & src/data)
const syncReportPath = path.join(DATA_DIR, 'sync-report.json');
if (fs.existsSync(syncReportPath)) {
  const syncReport = JSON.parse(fs.readFileSync(syncReportPath, 'utf8'));
  const genresBreakdown = {};
  let sumImportedEps = 0;
  let sumAuthEps = 0;
  for (const a of finalCatalogue) {
    sumImportedEps += a.importedEpisodesCount || 0;
    sumAuthEps += a.authoritativeTotalEpisodes || a.importedEpisodesCount || 0;
    for (const g of a.genres || []) {
      genresBreakdown[g] = (genresBreakdown[g] || 0) + 1;
    }
  }
  syncReport.totalRareAnimesUrlsDiscovered = finalCatalogue.length;
  syncReport.totalUniqueAnime = finalCatalogue.length;
  syncReport.animeUpdated = finalCatalogue.length;
  syncReport.episodesAdded = sumImportedEps;
  syncReport.authoritativeTotalEpisodes = sumAuthEps;
  syncReport.verifiedArtworkCount = finalCatalogue.filter(a => a.artwork?.isVerified).length;
  syncReport.genresBreakdown = genresBreakdown;
  syncReport.timestamp = new Date().toISOString();
  fs.writeFileSync(syncReportPath, JSON.stringify(syncReport, null, 2), 'utf8');
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'sync-report.json'), JSON.stringify(syncReport, null, 2), 'utf8');
}

// 5. status-audit-report.json
const statusReportPath = path.join(DATA_DIR, 'status-audit-report.json');
if (fs.existsSync(statusReportPath)) {
  const statusReport = JSON.parse(fs.readFileSync(statusReportPath, 'utf8'));
  statusReport.timestamp = new Date().toISOString();
  statusReport.totalSeries = finalCatalogue.length;
  statusReport.completedCount = finalCatalogue.filter(a => a.status === 'Completed').length;
  statusReport.ongoingCount = finalCatalogue.filter(a => a.status === 'Ongoing').length;
  statusReport.upcomingCount = finalCatalogue.filter(a => a.status === 'Upcoming').length;
  statusReport.completeEpisodeListsCount = finalCatalogue.filter(a => a.isEpisodeListComplete).length;
  statusReport.partialEpisodeListsCount = finalCatalogue.filter(a => !a.isEpisodeListComplete).length;
  fs.writeFileSync(statusReportPath, JSON.stringify(statusReport, null, 2), 'utf8');
}

// 6. artwork-inspect-report.json
const inspectReportPath = path.join(DATA_DIR, 'artwork-inspect-report.json');
if (fs.existsSync(inspectReportPath)) {
  const inspectReport = JSON.parse(fs.readFileSync(inspectReportPath, 'utf8'));
  const filteredItems = (inspectReport.items || [])
    .filter(item => finalIdSet.has(item.id))
    .map(item => ({
      ...item,
      title: finalById.get(item.id)?.title || item.title
    }));
  inspectReport.inspectedAt = new Date().toISOString();
  inspectReport.totalCatalogue = finalCatalogue.length;
  inspectReport.validArtworkCount = filteredItems.filter(i => i.hasArtwork).length;
  inspectReport.items = filteredItems;
  fs.writeFileSync(inspectReportPath, JSON.stringify(inspectReport, null, 2), 'utf8');
}

// 7. bug-reports.json (migrate any old animeId to canonicalId)
const bugReportsPath = path.join(DATA_DIR, 'bug-reports.json');
if (fs.existsSync(bugReportsPath)) {
  const bugReports = JSON.parse(fs.readFileSync(bugReportsPath, 'utf8'));
  let migratedBugRefs = 0;
  if (Array.isArray(bugReports)) {
    for (const b of bugReports) {
      if (b.animeId && idRedirects[b.animeId]) {
        b.animeId = idRedirects[b.animeId];
        b.animeTitle = finalById.get(b.animeId)?.title || b.animeTitle;
        migratedBugRefs++;
      }
    }
    fs.writeFileSync(bugReportsPath, JSON.stringify(bugReports, null, 2), 'utf8');
  }
  console.log(`[Sync] bug-reports.json migrated references: ${migratedBugRefs}`);
}

