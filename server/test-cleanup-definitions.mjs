import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const catalogue = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'anivault-catalogue.json'), 'utf8'));

// ---------------------------------------------------------------------------
// 1. NON-ANIME RECORDS TO QUARANTINE / REMOVE (TASK 2)
// Every single candidate below has been individually inspected and verified
// as non-anime (Western cartoon / Disney / Cartoon Network / Nickelodeon /
// Warner Bros / Marvel US animation / live-action tokusatsu / Indian/Malaysian/Chinese kids cartoon).
// Legitimate Japanese anime (including Marvel Anime by Madhouse/Toei: Iron Man 2010,
// Wolverine 2011, X-Men 2011, Blade 2011, Marvel Disk Wars, Marvel Future Avengers,
// and classic anime like Perman, Kiteretsu, Kochikame, Dokonjou Gaeru, Luckyman,
// Ultra B, Dinosaur King, Ghosts at School, Idaten Jump, Mighty Cat Masked Niyander,
// Ninja Hattori, Zatch Bell, Yo-kai Watch, Obocchama-kun) are strictly PRESERVED.
// ---------------------------------------------------------------------------
export const NON_ANIME_QUARANTINE_REASONS = {
  'anivault_rt_miraculous_tales_of_ladybug_cat_noir': 'French CGI animated series (Zagtoon / Method Animation), not Japanese anime',
  'anivault_rt_stranger_things_tales_from_85': 'American Netflix animated series spin-off, not Japanese anime',
  'anivault_rt_hindi_stranger_things_tales_from_85_season_2_hindi_dubbed_episodes_download_hd': 'American Netflix animated series spin-off (Season 2), not Japanese anime',
  'anivault_rt_hindi_mickey_mouse_clubhouse_season_1_hindi_episodes_download_hd': 'American Disney Television Animation preschool series, not anime',
  'anivault_rt_hindi_ghostforce_season_1_hindi_episodes_download_hd': 'French-South Korean Zagtoon CGI animated series, not Japanese anime',
  'anivault_rt_hindi_the_ghost_and_molly_mcgee_season_1_hindi_episodes_download': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_kim_possible_season_1_hindi_tamil_telugu_episodes_download_hd': 'American Disney Channel animated series, not anime',
  'anivault_rt_hindi_big_hero_6_the_series_season_1_hindi_episodes_download_0hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_phineas_and_ferb_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_tron_uprising_season_1_hindi_episodes_download_360p_480p_720p_hd_1080p_fhd': 'American Disney XD CGI animated series, not anime',
  'anivault_rt_hindi_the_little_mermaid_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_ryukendo_all_hindi_episodes_download': 'Live-action tokusatsu television drama (Magic Bullet Chronicles Ryukendo), not animated anime',
  'anivault_rt_hindi_tangled_the_series_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_star_vs_the_forces_of_evil_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_milo_murphys_law_season_1_hindi_dubbed_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_gravity_falls_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_timon_and_pumbaa_season_1_episodes_hindi_tamil_telugu_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_the_new_adventures_of_winnie_the_pooh_season_1_hindi_episodes_download_01': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_lilo_stitch_season_1_hindi_dubbed_episodes_download_hd': 'American Disney Television Animation series (Lilo & Stitch: The Series), not anime',
  'anivault_rt_hindi_ducktales_season_1_hindi_tamil_telugu_episodes_download': 'American Disney Television Animation series (2017), not anime',
  'anivault_rt_hindi_talespin_season_1_hindi_episodes_download_hd': 'American Disney Television Animation series, not anime',
  'anivault_rt_hindi_avengers_assemble_season_2_hindi_tamil_telugu_episodes_download_hd': 'American Marvel Animation series, not anime',
  'anivault_rt_hindi_guardians_of_the_galaxy_season_1_hindi_tamil_telugu_episodes_download_hd': 'American Marvel Animation series, not anime',
  'anivault_rt_hindi_hulk_and_the_agent_of_smash_season_1_hindi_tamil_telugu_episodes_download_hd': 'American Marvel Animation series, not anime',
  'anivault_rt_hindi_iron_man_armored_adventures_season_1_hindi_episodes_download_in_hd': 'French-American Method Animation / Marvel CGI series, not anime',
  'anivault_rt_hindi_iron_man_1994_all_hindi_episodes_download': 'American Marvel Entertainment animated series (1994), not anime',
  'anivault_rt_hindi_ultimate_spider_man_season_1_hindi_episodes_download_hd': 'American Marvel Animation series, not anime',
  'anivault_rt_hindi_marvels_spider_man_2017_season_2_hindi_dubbed_episodes_download_hd': 'American Marvel Animation series (2017), not anime',
  'anivault_rt_hindi_spider_man_the_animated_series_1994_all_season_hindi_episodes_download_hd': 'American Marvel Films Animation series (1994), not anime',
  'anivault_rt_hindi_the_spectacular_spider_man_season_1_hindi_episodes_720p_hd': 'American Culver Entertainment / Marvel animated series, not anime',
  'anivault_rt_hindi_star_wars_resistance_season_1_episodes_hindi_download_hd': 'American Lucasfilm Animation series, not anime',
  'anivault_rt_hindi_star_wars_rebels_season_1_hindi_episodes_download_hd': 'American Lucasfilm Animation CGI series, not anime',
  'anivault_rt_hindi_the_avengers_earths_mightiest_heroes_season_1_hindi_episode_download_in_01': 'American Marvel Animation series, not anime',
  'anivault_rt_hindi_avatar_the_last_airbender_season_1_hindi_tamil_telugu_malayalam_episodes_download': 'American Nickelodeon Animation Studio series, not Japanese anime',
  'anivault_rt_hindi_avatar_the_legend_of_korra_season_1_hindi_episodes_download_hd': 'American Nickelodeon Animation Studio series, not Japanese anime',
  'anivault_rt_hindi_jing_ju_cats_season_1_hindi_tamil_telugu_episodes_download_hd': 'Chinese Beijing璀璨星空 children cartoon series, not Japanese anime',
  'anivault_rt_hindi_power_rangers_zeo_season_4_1996_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_turbo_season_5_1997_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_in_space_season_6_1998_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_lost_galaxy_season_7_1999_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_lightspeed_rescue_season_8_2000_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_time_force_season_9_2001_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_wild_force_season_10_2002_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_ninja_storm_season_11_2003_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_dino_thunder_season_12_2004_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_mystic_force_season_14_2006_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_operation_overdrive_season_15_2007_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_jungle_fury_season_16_2008_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_rpm_season_17_2009_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_samurai_season_18_2011_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_super_samurai_season_19_2012_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_megaforce_season_20_2013_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_super_megaforce_season_21_2014_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_dino_charge_season_22_2015_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_dino_super_charge_season_23_2016_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_ninja_steel_season_24_2017_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_beast_morphers_1_season_26_2019_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_dino_fury_1_season_28_2021_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_dino_fury_2_season_29_2022_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_cosmic_fury_season_30_2023_hindi_download_hd': 'American live-action tokusatsu TV series (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_samurai_clash_of_the_red_rangers_2011_hindi_dubbed_download_hd': 'American live-action tokusatsu TV special (Power Rangers), not anime',
  'anivault_rt_hindi_mighty_morphin_power_rangers_once_always_2023_hindi_dubbed_download_hd': 'American live-action tokusatsu special (Power Rangers), not anime',
  'anivault_rt_hindi_power_rangers_2017_hindi_dubbed_download_hd': 'American live-action feature film (Power Rangers 2017) listed as TV, not anime',
  'anivault_rt_hindi_teenage_mutant_ninja_turtles_season_1_hindi_dubbed_download_01': 'American Nickelodeon CGI animated series (2012), not anime',
  'anivault_rt_hindi_thomas_friends_all_hindi_episodes_download_fhd': 'British children television series (Thomas & Friends), not anime',
  'anivault_rt_hindi_winx_club_season_1_hindi_tamil_telugu_episodes_download_hd': 'Italian Rainbow S.p.A. animated series (Winx Club), not Japanese anime',
  'anivault_rt_hindi_zinba_all_hindi_episodes_download_hd': 'Chinese Alpha Group children cartoon series (Zinba), not Japanese anime',
  'anivault_rt_hindi_adventure_time_season_1_hindi_episodes_download_hd': 'American Cartoon Network animated series, not anime',
  'anivault_rt_hindi_ben_10_destroy_all_aliens_hindi_dubbed_download_hd': 'American Cartoon Network CGI film/special (Ben 10), not anime',
  'anivault_rt_hindi_ben_10_classic_season_1_hindi_episodes_download_hd': 'American Cartoon Network animated series (Ben 10), not anime',
  'anivault_rt_hindi_ben_10_alien_force_season_2_hindi_episodes_download_hd': 'American Cartoon Network animated series (Ben 10: Alien Force), not anime',
  'anivault_rt_hindi_ben_10_ultimate_alien_season_1_hindi_episodes_download_hd': 'American Cartoon Network animated series (Ben 10: Ultimate Alien), not anime',
  'anivault_rt_hindi_ben_10_reboot_2016_season_3_hindi_episodes_download_hd': 'American Cartoon Network animated series (Ben 10 Reboot), not anime',
  'anivault_rt_hindi_ben_10_omniverse_all_episodes_hindi_tamil_telugu_download_hd': 'American Cartoon Network animated series (Ben 10: Omniverse), not anime',
  'anivault_rt_hindi_baby_looney_tunes_season_1_hindi_episodes_download_hd': 'American Warner Bros. Animation series, not anime',
  'anivault_rt_hindi_bob_the_builder_all_episodes_hindi_dubbed_download_hd': 'British children animated series (Bob the Builder), not anime',
  'anivault_rt_hindi_courage_the_cowardly_dog_season_2_hindi_episodes_download_hd': 'American Cartoon Network animated series, not anime',
  'anivault_rt_hindi_dc_super_hero_girls_season_1_hindi_episodes_watch_download_hd': 'American Warner Bros. Animation series, not anime',
  'anivault_rt_hindi_dexters_laboratory_season_1_hindi_episodes_download': 'American Cartoon Network animated series, not anime',
  'anivault_rt_hindi_generator_rex_season_1_hindi_episodes_download_hd': 'American Cartoon Network animated series, not anime',
  'anivault_rt_hindi_horrid_henry_season_3_episodes_hindi_download_hd': 'British Novel Entertainment animated series, not anime',
  'anivault_rt_hindi_johnny_test_2021_season_1_hindi_episodes_download_hd': 'Canadian-American WildBrain animated series, not anime',
  'anivault_rt_hindi_jackie_chan_adventures_season_1_hindi_episodes_hd': 'American Sony Pictures Television Animation series, not anime',
  'anivault_rt_hindi_oggy_and_the_cockroaches_season_3_hindi_episodes_download_hd': 'French Xilam Animation slapstick cartoon series, not anime',
  'anivault_rt_hindi_redakai_conquer_the_kairu_season_1_hindi_episodes_download_hd': 'Canadian-French Spin Master / Marathon Media cartoon, not anime',
  'anivault_rt_hindi_samurai_jack_all_season_hindi_dubbed_episodes_download_hd': 'American Cartoon Network Studios series, not Japanese anime',
  'anivault_rt_hindi_supa_strikas_season_2_hindi_episodes_download_hd': 'South African-Malaysian Strika Entertainment cartoon series, not anime',
  'anivault_rt_hindi_teen_titans_go_season_1_hindi_episodes_download_hd': 'American Warner Bros. Animation / Cartoon Network series, not anime',
  'anivault_rt_hindi_the_powerpuff_girls_season_1_6_hindi_tamil_telugu_episodes_download_hd': 'American Cartoon Network Studios animated series, not anime',
  'anivault_rt_hindi_looney_tunes_cartoons_season_1_hindi_dubbed_episodes_download_hd': 'American Warner Bros. Animation series, not anime',
  'anivault_rt_hindi_jungle_tales_with_mowgli_season_1_hindi_dubbed_episodes_download_hd': 'Western/Indian 3D CGI children series, not Japanese anime',
  'anivault_rt_hindi_boboiboy_galaxy_sori_season_2_hindi_episodes_download_hd': 'Malaysian Animonsta Studios CGI animated series, not Japanese anime',
  'anivault_rt_hindi_bandbudh_aur_budbak_complete_all_episodes_hindi_dubbed_download_hd': 'Indian Paperboat Design Studios cartoon series, not anime',
  'anivault_rt_hindi_bandbudh_aur_budbak_2_0_season_1_hindi_dubbed_episodes_download_hd': 'Indian cartoon series (Bandbudh aur Budbak 2.0), not anime',
  'anivault_rt_hindi_tom_and_jerry_all_season_episodes_hindi_download_hd': 'American MGM / Warner Bros. cartoon series, not anime',
  'anivault_rt_hindi_tom_jerry_kids_show_hindi_episodes_download_hd': 'American Hanna-Barbera cartoon series, not anime',
  'anivault_rt_hindi_tom_and_jerry_tales_season_2_hindi_episodes_download_hd': 'American Warner Bros. Animation series, not anime',
  'anivault_rt_hindi_the_tom_and_jerry_show_season_4_hindi_episodes_download_hd': 'American Warner Bros. Animation series, not anime',
  'anivault_rt_hindi_tom_and_jerry_special_shorts_english_episodes_download_hd': 'American Warner Bros. Animation shorts, not anime',
  'anivault_rt_hindi_scooby_doo_where_are_you_now_2021_hindi_download_hd': 'American Warner Bros. / CW television special, not anime',
  'anivault_rt_hindi_kamen_rider_gavv_season_1_hindi_dubbed_episodes_download_hd': 'Live-action tokusatsu television drama (Kamen Rider Gavv), not animated anime',
  'anivault_rt_hindi_sabrina_the_animated_series_season_1_hindi_dubbed_download_hd': 'American DIC Entertainment cartoon series, not anime'
};

// ---------------------------------------------------------------------------
// 2. INVALID / BUNDLE / PLACEHOLDER / DUPLICATE PROVIDER LISTING RECORDS (TASK 3)
// ---------------------------------------------------------------------------
export const INVALID_OR_BUNDLE_QUARANTINE_REASONS = {
  'anivault_rt_hindi_official_android_app': {
    reason: 'Website announcement/download page for the RareAnimes Official Android App, not an anime title'
  },
  'anivault_rt_hindi_haikyu_ova_episodes_hindi_dubbed_download_hd': {
    reason: 'Unstructured "Haikyu!! OVA Episodes" bundle page duplicating Haikyu!! / Haikyu!! Land vs. Air',
    canonicalId: 'anivault_rt_haikyu'
  },
  'anivault_rt_hindi_kaiju_no_8_narumis_week_at_work_shorts_episodes_download_hd': {
    reason: 'Bonus shorts bundle page ("Narumi\'s Week at Work Shorts Episodes") belonging to Kaiju No. 8',
    canonicalId: 'anivault_rt_kaiju_no_8'
  },
  'anivault_rt_hindi_pokemon_xy_mega_evolution_special_episodes_hindi_tamil_telugu_watch_download_hd': {
    reason: 'Special episodes bundle page ("Pokemon XY Mega Evolution Special Episodes") belonging to Pokémon',
    canonicalId: 'anivault_rt_pokemon'
  },
  'anivault_rt_hindi_pokemon_pikachus_winter_vacation_special_hindi_episodes_download_hd': {
    reason: 'Special episodes bundle page ("Pokemon Pikachu\'s Winter Vacation Special Hindi Episodes") belonging to Pokémon',
    canonicalId: 'anivault_rt_pokemon'
  },
  'mal_263': {
    reason: 'Duplicate provider listing for Hajime no Ippo (2000), already represented by canonical entry anivault_rt_hajime_no_ippo_the_fighting',
    canonicalId: 'anivault_rt_hajime_no_ippo_the_fighting'
  }
};

console.log('Non-anime count:', Object.keys(NON_ANIME_QUARANTINE_REASONS).length);
console.log('Invalid/bundle count:', Object.keys(INVALID_OR_BUNDLE_QUARANTINE_REASONS).length);
for (const id of [...Object.keys(NON_ANIME_QUARANTINE_REASONS), ...Object.keys(INVALID_OR_BUNDLE_QUARANTINE_REASONS)]) {
  if (!catalogue.some(a => a.id === id)) {
    console.error('MISSING ID:', id);
  }
}
