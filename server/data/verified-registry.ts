/**
 * Canonical metadata verification table for AniVault.
 * Provides exact, factual anime metadata:
 * - Precise season-by-season episode counts
 * - Exact real-world airing status (Completed, Ongoing, Upcoming)
 * - Exact type (TV, Movie, Collection)
 * - Official verified artwork
 */
export const VERIFIED_ANIME_REGISTRY: Record<string, {
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  type: 'TV' | 'Movie' | 'Collection';
  releaseYear?: number;
  alternateTitle?: string;
  artworkUrl?: string;
  seasonEpisodes: Record<number, number | null>; // seasonNumber -> episodeCount
  synopsis?: string;
}> = {
  // 1. Vinland Saga
  'anivault_rt_vinland_saga': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2019,
    alternateTitle: 'Vinland Saga',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
    seasonEpisodes: { 1: 24, 2: 24 }
  },

  // 2. Attack on Titan
  'anivault_rt_attack_on_titan': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2013,
    alternateTitle: 'Shingeki no Kyojin',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
    seasonEpisodes: { 1: 25, 2: 12, 3: 22, 4: 28 }
  },

  // 3. Death Note
  'anivault_rt_death_note': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2006,
    alternateTitle: 'Death Note',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg',
    seasonEpisodes: { 1: 37 }
  },

  // 4. Assassination Classroom
  'anivault_rt_assassination_classroom': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2015,
    alternateTitle: 'Ansatsu Kyoushitsu',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/5/75810.jpg',
    seasonEpisodes: { 1: 22, 2: 25 }
  },

  // 5. Jujutsu Kaisen
  'anivault_rt_jujutsu_kaisen': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2020,
    alternateTitle: 'Jujutsu Kaisen',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
    seasonEpisodes: { 1: 24, 2: 23 }
  },

  // 6. Demon Slayer: Kimetsu no Yaiba
  'anivault_rt_demon_slayer': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2019,
    alternateTitle: 'Kimetsu no Yaiba',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    seasonEpisodes: { 1: 26, 2: 18, 3: 11, 4: 8 }
  },

  // 7. Solo Leveling
  'anivault_rt_solo_leveling': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2024,
    alternateTitle: 'Na Honjaman Rebeleop',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1844/141757.jpg',
    seasonEpisodes: { 1: 12, 2: 13 }
  },

  // 8. Frieren: Beyond Journey's End
  'anivault_rt_frieren_beyond_journeys_end': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Sousou no Frieren',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1015/138075.jpg',
    seasonEpisodes: { 1: 28 }
  },

  // 9. Dan Da Dan
  'anivault_rt_dan_da_dan': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2024,
    alternateTitle: 'Dandadan',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1966/143577.jpg',
    seasonEpisodes: { 1: 12 }
  },

  // 10. Kaiju No. 8
  'anivault_rt_kaiju_no_8': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2024,
    alternateTitle: 'Kaijuu 8-gou',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1758/141285.jpg',
    seasonEpisodes: { 1: 12 }
  },

  // 11. Dr. STONE
  'anivault_rt_dr_stone': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2019,
    alternateTitle: 'Dr. STONE',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1613/102576.jpg',
    seasonEpisodes: { 1: 24, 2: 11, 3: 22, 4: 12 }
  },

  // 12. My Hero Academia
  'anivault_rt_my_hero_academia': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2016,
    alternateTitle: 'Boku no Hero Academia',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg',
    seasonEpisodes: { 1: 13, 2: 25, 3: 25, 4: 25, 5: 25, 6: 25, 7: 21 }
  },

  // 13. Classroom of the Elite
  'anivault_rt_classroom_of_the_elite': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2017,
    alternateTitle: 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/4/86835.jpg',
    seasonEpisodes: { 1: 12, 2: 13, 3: 13 }
  },

  // 14. Tokyo Revengers
  'anivault_rt_tokyo_revengers': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2021,
    alternateTitle: 'Tokyo Revengers',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1830/117906.jpg',
    seasonEpisodes: { 1: 24, 2: 13, 3: 13 }
  },

  // 15. Baki
  'anivault_rt_baki': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2018,
    alternateTitle: 'Baki (2018)',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1169/93126.jpg',
    seasonEpisodes: { 1: 26 }
  },

  // 16. Baki Hanma
  'anivault_rt_baki_hanma': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2021,
    alternateTitle: 'Hanma Baki: Son of Ogre',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1370/118332.jpg',
    seasonEpisodes: { 1: 12, 2: 27 }
  },

  // 17. Haikyu!!
  'anivault_rt_haikyu': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2014,
    alternateTitle: 'Haikyuu!!',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/7/76014.jpg',
    seasonEpisodes: { 1: 25, 2: 25, 3: 10, 4: 25 }
  },

  // 18. Black Clover
  'anivault_rt_black_clover': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2017,
    alternateTitle: 'Black Clover',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/2/88336.jpg',
    seasonEpisodes: { 1: 51, 2: 51, 3: 52, 4: 16 }
  },

  // 19. Gintama
  'anivault_rt_gintama': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2006,
    alternateTitle: 'Gintama',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/10/73249.jpg',
    seasonEpisodes: { 1: 201 }
  },

  // 20. Horimiya: The Missing Pieces & Horimiya
  'anivault_rt_horimiya_the_missing_pieces': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2021,
    alternateTitle: 'Horimiya',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1695/111486.jpg',
    seasonEpisodes: { 1: 13, 2: 13 }
  },

  // 21. Bleach: Thousand-Year Blood War
  'anivault_rt_bleach_thousand_year_blood_war': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2022,
    alternateTitle: 'Bleach: Sennen Kessen-hen',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg',
    seasonEpisodes: { 1: 13, 2: 13, 3: 13 }
  },

  // 22. High School DxD
  'anivault_rt_high_school_dxd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2012,
    alternateTitle: 'High School DxD',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/11/35921.jpg',
    seasonEpisodes: { 1: 12 }
  },

  // 23. The Daily Life of the Immortal King
  'anivault_rt_the_daily_life_of_the_immortal_king': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2020,
    alternateTitle: 'Xian Wang de Richang Shenghuo',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1614/105436.jpg',
    seasonEpisodes: { 1: 15, 2: 12, 3: 12, 4: 12 }
  },

  // 24. Mushoku Tensei: Jobless Reincarnation
  'anivault_rt_mushoku_tensei': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2021,
    alternateTitle: 'Mushoku Tensei: Isekai Ittara Honki Dasu',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1530/117776.jpg',
    seasonEpisodes: { 1: 23, 2: 36 }
  },

  // 25. That Time I Got Reincarnated as a Slime
  'anivault_rt_that_time_i_got_reincarnated_as_a_slime': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2018,
    alternateTitle: 'Tensei shitara Slime Datta Ken',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1092/95535.jpg',
    seasonEpisodes: { 1: 24, 2: 36, 3: 24 }
  },

  // 26. Blue Lock
  'anivault_rt_blue_lock': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2022,
    alternateTitle: 'Blue Lock',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1258/126929.jpg',
    seasonEpisodes: { 1: 24, 2: 14 }
  },

  // 27. Re:Zero - Starting Life in Another World
  'anivault_rt_rezero': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2016,
    alternateTitle: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1522/128039.jpg',
    seasonEpisodes: { 1: 25, 2: 37, 3: 16 }
  },

  // 28. Wistoria: Wand and Sword
  'anivault_rt_wistoria_wand_and_sword': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2024,
    alternateTitle: 'Tsue to Tsurugi no Wistoria',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1260/143522.jpg',
    seasonEpisodes: { 1: 12 }
  },

  // 29. Sakamoto Days
  'anivault_rt_sakamoto_days': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2025,
    alternateTitle: 'Sakamoto Days',
    seasonEpisodes: { 1: 12 }
  },

  // 30. Zenshu
  'anivault_rt_zenshu': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2025,
    alternateTitle: 'Zenshu.',
    seasonEpisodes: { 1: 12 }
  },

  // 31. Devil May Cry
  'anivault_rt_devil_may_cry': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2007,
    alternateTitle: 'Devil May Cry',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/13/20040.jpg',
    seasonEpisodes: { 1: 12 }
  },

  // 32. Naruto (Original)
  'anivault_rt_naruto': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2002,
    alternateTitle: 'Naruto',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
    seasonEpisodes: { 1: 35, 2: 48, 3: 48, 4: 26, 5: 28, 6: 26, 7: 26, 8: 26, 9: 7 }
  },

  // 33. Naruto Shippuden
  'anivault_rt_naruto_shippuden': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2007,
    alternateTitle: 'Naruto: Shippuuden',
    artworkUrl: 'https://cdn.myanimelist.net/images/anime/1565/111305.jpg',
    seasonEpisodes: {
      1: 32, 2: 21, 3: 18, 4: 17, 5: 24, 6: 31, 7: 8, 8: 24,
      9: 21, 10: 25, 11: 21, 12: 33, 13: 20, 14: 25, 15: 28, 16: 212
    }
  },

  // 34. Doraemon TV Series
  'anivault_rt_doraemon_tv_series': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2005,
    alternateTitle: 'Doraemon (2005)',
    seasonEpisodes: { 1: 52, 2: 52, 3: 52, 4: 52, 5: 52, 6: 52, 7: 52, 8: 52, 14: 52 }
  },

  // 35. Pokemon
  'anivault_rt_pokemon': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2016,
    alternateTitle: 'Pokemon Sun & Moon',
    seasonEpisodes: { 1: 82, 20: 43 }
  },

  // 36. Miraculous Tales of Ladybug & Cat Noir
  'anivault_rt_miraculous_tales_of_ladybug_cat_noir': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 2015,
    alternateTitle: 'Miraculous: Tales of Ladybug & Cat Noir',
    seasonEpisodes: { 5: 27 }
  },

  // 37. Stranger Things
  'anivault_rt_stranger_things_tales_from_85': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2022,
    seasonEpisodes: { 1: 6 }
  },

  // 38. Liar Game
  'anivault_rt_liar_game': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2022,
    seasonEpisodes: { 1: 12 }
  },

  // 39. Konosuba (Consolidated)
  'anivault_rt_hindi_konosuba_gods_blessing_on_this_wonderful_world_season_2_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2016,
    alternateTitle: 'Kono Subarashii Sekai ni Shukufuku wo!',
    seasonEpisodes: { 1: 10, 2: 10, 3: 11 }
  },

  // 40. Grand Blue Dreaming
  'anivault_rt_grand_blue_dreaming': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2018,
    alternateTitle: 'Grand Blue',
    seasonEpisodes: { 1: 12, 2: 13 }
  },

  // 41. Dragon Ball Z
  'anivault_rt_dragon_ball_z': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1989,
    alternateTitle: 'Dragon Ball Z',
    seasonEpisodes: { 1: 39, 2: 35, 3: 33, 4: 32, 5: 26, 6: 29, 7: 25, 8: 34, 9: 38 }
  },

  // 42. Dragon Ball Super
  'anivault_rt_dragon_ball_super': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2015,
    alternateTitle: 'Dragon Ball Super',
    seasonEpisodes: { 1: 25, 2: 13, 3: 19, 4: 30, 5: 55 }
  },

  // 43. Beyblade (Original)
  'anivault_rt_hindi_beyblade_season_1_remastered_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2001,
    alternateTitle: 'Bakuten Shoot Beyblade',
    seasonEpisodes: { 1: 51, 2: 51, 3: 52 }
  },

  // 44. Beyblade: Metal Series
  'anivault_rt_hindi_beyblade_metal_fusion_season_1_hindi_episodes_watch_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2009,
    alternateTitle: 'Metal Fight Beyblade',
    seasonEpisodes: { 1: 51, 2: 51, 3: 39, 4: 45 }
  },

  // 45. Beyblade Burst
  'anivault_rt_hindi_beyblade_burst_season_1_hindi_episodes_download_in_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2016,
    alternateTitle: 'Beyblade Burst',
    seasonEpisodes: { 1: 51, 2: 51, 3: 51, 4: 52, 5: 24, 6: 26 }
  },

  // 46. BeyWheelz & BeyWarriors
  'anivault_rt_hindi_beywheelz_season_1_hindi_episodes_download_720p_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2012,
    alternateTitle: 'BeyWheelz',
    seasonEpisodes: { 1: 13, 2: 13, 3: 26 }
  },

  // 47. Shinchan
  'anivault_rt_hindi_shinchan_season_1_hindi_episodes_download_in_hd': {
    status: 'Ongoing',
    type: 'TV',
    releaseYear: 1992,
    alternateTitle: 'Crayon Shin-chan',
    seasonEpisodes: { 1: 52, 2: 52, 3: 52, 4: 52, 5: 52, 6: 52, 7: 52, 8: 52, 9: 52, 10: 52, 11: 52 }
  },

  // 48. Perman
  'anivault_rt_hindi_perman_all_hindi_dubbed_episodes_download_watch_online': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1983,
    alternateTitle: 'Perman (1983)',
    seasonEpisodes: { 1: 526 }
  },

  // 49. Kochikame
  'anivault_rt_hindi_kochikame_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1996,
    alternateTitle: 'Kochira Katsushikaku Kameari Kouenmae Hashutsujo',
    seasonEpisodes: { 1: 373 }
  },

  // 50. Kiteretsu
  'anivault_rt_hindi_kiteretsu_all_season_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1988,
    alternateTitle: 'Kiteretsu Daihyakka',
    seasonEpisodes: { 1: 331 }
  },

  // 51. The Gutsy Frog
  'anivault_rt_hindi_the_gutsy_frog_dokonjou_gaeru_hindi_episodes_download_fhd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1972,
    alternateTitle: 'Dokonjou Gaeru',
    seasonEpisodes: { 1: 103 }
  },

  // 52. Luckyman
  'anivault_rt_hindi_luckyman_1994_complete_all_episodes_hindi_dubbed_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1994,
    alternateTitle: 'Tottemo! Luckyman',
    seasonEpisodes: { 1: 50 }
  },

  // 53. Digimon Xros Wars
  'anivault_rt_hindi_digimon_xros_wars_season_1_hindi_episodes_download_720p_hd_1080p_fhd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2010,
    alternateTitle: 'Digimon Fusion',
    seasonEpisodes: { 1: 30, 2: 24, 3: 25 }
  },

  // 54. Ultra B
  'anivault_rt_hindi_ultra_b_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1987,
    alternateTitle: 'Ultra B',
    seasonEpisodes: { 1: 118 }
  },

  // 55. Yu-Gi-Oh! Duel Monsters
  'anivault_rt_hindi_yu_gi_oh_duel_monsters_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2000,
    alternateTitle: 'Yu-Gi-Oh! Duel Monsters',
    seasonEpisodes: { 1: 224 }
  },

  // 56. Bakugan Battle Brawlers
  'anivault_rt_hindi_bakugan_battle_brawlers_season_1_hindi_episodes_download_in_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2007,
    alternateTitle: 'Bakugan Battle Brawlers',
    seasonEpisodes: { 1: 52 }
  },

  // 57. Marvel Anime: Iron Man
  'anivault_rt_hindi_iron_man_2010_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2010,
    alternateTitle: 'Iron Man (2010)',
    seasonEpisodes: { 1: 12 }
  },

  // 58. Wolverine
  'anivault_rt_hindi_wolverine_2011_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2011,
    alternateTitle: 'Wolverine (2011)',
    seasonEpisodes: { 1: 12 }
  },

  // 59. X-Men
  'anivault_rt_hindi_x_men_2011_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2011,
    alternateTitle: 'X-Men (2011)',
    seasonEpisodes: { 1: 12 }
  },

  // 60. Blade
  'anivault_rt_hindi_blade_2011_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2011,
    alternateTitle: 'Blade (2011)',
    seasonEpisodes: { 1: 12 }
  },

  // 61. Marvel Disk Wars: The Avengers
  'anivault_rt_hindi_marvel_disk_wars_the_avengers_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2014,
    alternateTitle: 'Disk Wars Avengers',
    seasonEpisodes: { 1: 51 }
  },

  // 62. Marvel Future Avengers
  'anivault_rt_hindi_marvel_future_avengers_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2017,
    alternateTitle: 'Marvel Future Avengers',
    seasonEpisodes: { 1: 39 }
  },

  // 63. Ghosts at School
  'anivault_rt_hindi_ghosts_at_school_hindi_episodes_download_ghost_at_school': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2000,
    alternateTitle: 'Gakkou no Kaidan',
    seasonEpisodes: { 1: 20 }
  },

  // 64. Idaten Jump
  'anivault_rt_hindi_idaten_jump_season_1_all_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2005,
    alternateTitle: 'Idaten Jump',
    seasonEpisodes: { 1: 52 }
  },

  // 65. Mighty Cat Masked Niyander
  'anivault_rt_hindi_mighty_cat_masked_niyander_hindi_tamil_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2000,
    alternateTitle: 'Nyani ga Nyandaa Nyandaa Kamen',
    seasonEpisodes: { 1: 83 }
  },

  // 66. Ninja Hattori (1981)
  'anivault_rt_hindi_ninja_hattori_1981_season_1_hindi_tamil_telugu_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 1981,
    alternateTitle: 'Ninja Hattori-kun',
    seasonEpisodes: { 1: 156, 2: 156, 3: 156, 4: 226 }
  },

  // 67. Ninja Hattori Returns
  'anivault_rt_hindi_ninja_hattori_returns_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2012,
    alternateTitle: 'Ninja Hattori-kun (2012)',
    seasonEpisodes: { 1: 52, 2: 52 }
  },

  // 68. Zatch Bell
  'anivault_rt_hindi_zatch_bell_season_1_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2003,
    alternateTitle: 'Konjiki no Gash Bell!!',
    seasonEpisodes: { 1: 50, 2: 50, 3: 50 }
  },

  // 69. Yo-kai Watch
  'anivault_rt_hindi_yo_kai_watch_season_1_hindi_tamil_telugu_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2014,
    alternateTitle: 'Youkai Watch',
    seasonEpisodes: { 1: 214 }
  },

  // 70. Boruto: Naruto Next Generations
  'anivault_rt_hindi_boruto_naruto_next_generations_hindi_subbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2017,
    alternateTitle: 'Boruto: Naruto Next Generations',
    seasonEpisodes: { 1: 35, 2: 35, 3: 35, 4: 35, 5: 35, 6: 35, 7: 35, 8: 48 }
  },

  // 71. Trapped in a Dating Sim
  'anivault_rt_hindi_trapped_in_a_dating_sim_the_world_of_otome_games_is_tough_for_mobs_season_2_hindi_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2022,
    alternateTitle: 'Otome Game Sekai wa Mob ni Kibishii Sekai desu',
    seasonEpisodes: { 1: 12 }
  },

  // 72. KONOSUBA – An Explosion on This Wonderful World!
  'anivault_rt_hindi_konosuba_an_explosion_on_this_wonderful_world_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Kono Subarashii Sekai ni Bakuen wo!',
    seasonEpisodes: { 1: 12 }
  },

  // 73. Captain Tsubasa: Junior Youth Arc
  'anivault_rt_hindi_captain_tsubasa_junior_youth_arc_season_2_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Captain Tsubasa: Season 2 - Junior Youth-hen',
    seasonEpisodes: { 1: 39 }
  },

  // 74. Welcome to Demon School! Iruma-kun
  'anivault_rt_hindi_welcome_to_demon_school_iruma_kun_season_3_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2019,
    alternateTitle: 'Mairimashita! Iruma-kun',
    seasonEpisodes: { 1: 23, 2: 21, 3: 21 }
  },

  // 75. Heaven Official's Blessing
  'anivault_rt_hindi_heaven_officials_blessing_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2020,
    alternateTitle: 'Tian Guan Ci Fu',
    seasonEpisodes: { 1: 11, 2: 12 }
  },

  // 76. The 100 Girlfriends
  'anivault_rt_hindi_the_100_girlfriends_who_really_really_really_really_really_love_you_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo',
    seasonEpisodes: { 1: 12 }
  },

  // 77. The Elusive Samurai
  'anivault_rt_hindi_the_elusive_samurai_season_2_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2024,
    alternateTitle: 'Nige Jouzu no Wakagimi',
    seasonEpisodes: { 1: 12 }
  },

  // 78. Legend of Exorcism
  'anivault_rt_hindi_legend_of_exorcism_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2020,
    alternateTitle: 'Tian Bao Fuyao Lu',
    seasonEpisodes: { 1: 12, 2: 12 }
  },

  // 79. Cinderella Chef
  'anivault_rt_hindi_cinderella_chef_season_3_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2018,
    alternateTitle: 'Meng Qi Shi Shen',
    seasonEpisodes: { 1: 12, 2: 12, 3: 12 }
  },

  // 80. Campfire Cooking in Another World
  'anivault_rt_hindi_campfire_cooking_in_another_world_with_my_absurd_skill_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Tondemo Skill de Isekai Hourou Meshi',
    seasonEpisodes: { 1: 12 }
  },

  // 81. The First Order
  'anivault_rt_hindi_the_first_order_season_1_hindi_dubbed_episodes_download_hd': {
    status: 'Completed',
    type: 'TV',
    releaseYear: 2023,
    alternateTitle: 'Di Yi Xulie',
    seasonEpisodes: { 1: 16 }
  }
};
