
/**
 * ULTIMATE ELEVEN - BETA VERSION
 * Captain Tsubasa Football Strategy Game
 * 
 * ENHANCEMENTS IN THIS VERSION:
 * ✓ Improved error handling and validation
 * ✓ Fixed audio management issues  
 * ✓ Better screen transition handling
 * ✓ Performance optimizations
 * ✓ Professional code structure
 * ✓ Memory leak fixes
 */

'use strict';

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});

// Audio cleanup on page unload
window.addEventListener('beforeunload', function() {
  try {
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    for (let i = 1; i <= 3; i++) {
      const m = document.getElementById('matchMusic' + i);
      if (m) { m.pause(); m.currentTime = 0; }
    }
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
});

const T={
  germany:{name:'Germany',flag:'🇩🇪',p:[
    {id:101,name:'K.Muller',pos:'GK',spd:66,pwr:74,tec:72,def:93,rar:2,jersey:1,sav:88,ref:80},
    {id:102,name:'H.Kaltz',pos:'LB',spd:78,pwr:74,tec:72,def:80,rar:1,jersey:7},
    {id:103,name:'K.Schmidt',pos:'CB1',spd:68,pwr:82,tec:66,def:86,rar:2},
    {id:104,name:'E.Schmidt',pos:'CB2',spd:66,pwr:84,tec:64,def:88,rar:2},
    {id:105,name:'Teigerbran',pos:'RB',spd:76,pwr:80,tec:78,def:80,rar:2,jersey:23},
    {id:106,name:'C.Haine',pos:'CM1',spd:82,pwr:78,tec:86,def:62,rar:2},
    {id:107,name:'Shester',pos:'CM2',spd:80,pwr:82,tec:88,def:64,rar:2,jersey:10},
    {id:108,name:'M.Goethe',pos:'LW',spd:84,pwr:80,tec:82,def:56,rar:2},
    {id:109,name:'K.H.Schneider',pos:'ST',spd:86,pwr:96,tec:84,def:50,rar:2,jersey:11},
    {id:110,name:'Margus',pos:'RW',spd:84,pwr:82,tec:80,def:54,rar:1,jersey:9},
    {id:111,name:'Meyer',pos:'CB1',spd:68,pwr:78,tec:66,def:82,rar:1,jersey:4},
  ],reserves:[111]},
  brazil:{name:'Brazil',flag:'🇧🇷',p:[
    {id:1101,name:'Salinas',pos:'GK',spd:68,pwr:74,tec:72,def:94,rar:2,jersey:1,sav:90,ref:82},
    {id:1102,name:'R.Carolus',pos:'LB',spd:78,pwr:72,tec:74,def:80,rar:1,jersey:2},
    {id:1103,name:'Alberto',pos:'CB1',spd:70,pwr:82,tec:70,def:88,rar:2,jersey:3},
    {id:1104,name:'Senardo',pos:'CB2',spd:68,pwr:84,tec:68,def:90,rar:2,jersey:4},
    {id:1105,name:'Casagrande',pos:'RB',spd:76,pwr:74,tec:72,def:82,rar:1,jersey:5},
    {id:1106,name:'Radunga',pos:'CM1',spd:78,pwr:86,tec:80,def:78,rar:2,jersey:6},
    {id:1107,name:'L.Leo',pos:'CM2',spd:82,pwr:80,tec:86,def:62,rar:2,jersey:7},
    {id:1108,name:'Rivaul',pos:'CM3',spd:80,pwr:84,tec:92,def:60,rar:2,jersey:10},
    {id:1109,name:'Natureza',pos:'LW',spd:90,pwr:96,tec:94,def:52,rar:2,jersey:0},
    {id:1110,name:'C.Santana',pos:'ST',spd:84,pwr:88,tec:90,def:54,rar:2,jersey:11},
    {id:1111,name:'Neymar',pos:'RW',spd:94,pwr:82,tec:92,def:50,rar:2,jersey:9},
    {id:1112,name:'Pepe',pos:'RW',spd:82,pwr:80,tec:82,def:52,rar:1,jersey:8},
  ],reserves:[1112]},
  spain:{name:'Spain',flag:'🇪🇸',p:[
    {id:1201,name:'Casillas',pos:'GK',spd:70,pwr:74,tec:76,def:94,rar:3,jersey:1,sav:94,ref:88},
    {id:1202,name:'Puyol',pos:'LB',spd:76,pwr:80,tec:72,def:88,rar:2,jersey:5},
    {id:1203,name:'Pique',pos:'CB1',spd:72,pwr:84,tec:74,def:90,rar:2,jersey:3},
    {id:1204,name:'Ramos',pos:'CB2',spd:78,pwr:86,tec:78,def:92,rar:3,jersey:4},
    {id:1205,name:'Carvajal',pos:'RB',spd:82,pwr:72,tec:76,def:82,rar:2,jersey:2},
    {id:1206,name:'Xavi',pos:'CM1',spd:80,pwr:76,tec:96,def:70,rar:3,jersey:8},
    {id:1207,name:'Hernandez',pos:'CM2',spd:86,pwr:78,tec:90,def:68,rar:2,jersey:14},
    {id:1208,name:'Raphael',pos:'CM3',spd:84,pwr:80,tec:88,def:64,rar:2,jersey:11},
    {id:1209,name:'Michael',pos:'LW',spd:88,pwr:82,tec:92,def:58,rar:2,jersey:7},
    {id:1210,name:'Raul',pos:'RW',spd:84,pwr:86,tec:88,def:54,rar:3,jersey:7},
    {id:1211,name:'Torres',pos:'ST',spd:90,pwr:88,tec:86,def:52,rar:3,jersey:9},
  ]},
  france:{name:'France',flag:'🇫🇷',p:[
    {id:1301,name:'Rechard',pos:'GK',spd:66,pwr:72,tec:72,def:90,rar:2,jersey:1,sav:86,ref:78},
    {id:1302,name:'Lizarazu',pos:'LB',spd:80,pwr:72,tec:78,def:80,rar:2,jersey:3},
    {id:1303,name:'Thuram',pos:'CB1',spd:70,pwr:82,tec:70,def:88,rar:2,jersey:5},
    {id:1304,name:'Desailly',pos:'CB2',spd:68,pwr:84,tec:68,def:90,rar:2,jersey:6},
    {id:1305,name:'Makelolo',pos:'RB',spd:76,pwr:78,tec:74,def:84,rar:2,jersey:2},
    {id:1306,name:'Zedane',pos:'CM1',spd:82,pwr:84,tec:94,def:70,rar:2,jersey:5},
    {id:1307,name:'Pierre',pos:'CM2',spd:80,pwr:80,tec:88,def:62,rar:2,jersey:10},
    {id:1308,name:'Mbappe',pos:'CM3',spd:96,pwr:82,tec:86,def:54,rar:2,jersey:7},
    {id:1309,name:'Ribery',pos:'LW',spd:88,pwr:80,tec:86,def:56,rar:2,jersey:11},
    {id:1310,name:'Napoleon',pos:'ST',spd:84,pwr:90,tec:82,def:52,rar:2,jersey:9},
    {id:1311,name:'Trezaga',pos:'RW',spd:82,pwr:86,tec:84,def:54,rar:1,jersey:18},
  ]},
  ireland:{name:'Ireland',flag:'🇮🇪',p:[
    {id:1401,name:'O.Brien',pos:'GK',spd:64,pwr:70,tec:68,def:84,rar:1,jersey:1,sav:78,ref:72},
    {id:1402,name:'Dunne',pos:'LB',spd:74,pwr:72,tec:68,def:78,rar:1,jersey:3},
    {id:1403,name:'Keane',pos:'CB1',spd:68,pwr:80,tec:66,def:84,rar:1,jersey:5},
    {id:1404,name:'O.Shea',pos:'CB2',spd:66,pwr:78,tec:64,def:82,rar:1,jersey:6},
    {id:1405,name:'Kelly',pos:'RB',spd:72,pwr:70,tec:68,def:76,rar:1,jersey:2},
    {id:1406,name:'McCarthy',pos:'CM1',spd:76,pwr:78,tec:74,def:72,rar:1,jersey:8},
    {id:1407,name:'Whelan',pos:'CM2',spd:74,pwr:76,tec:76,def:70,rar:1,jersey:4},
    {id:1408,name:'Kilbane',pos:'CM3',spd:72,pwr:74,tec:72,def:68,rar:1,jersey:7},
    {id:1409,name:'Duff',pos:'LW',spd:82,pwr:76,tec:78,def:54,rar:1,jersey:11},
    {id:1410,name:'R.Keane',pos:'ST',spd:80,pwr:82,tec:78,def:52,rar:2,jersey:9},
    {id:1411,name:'Staunton',pos:'RW',spd:76,pwr:74,tec:76,def:58,rar:1,jersey:10},
  ]},
  scotland:{name:'Scotland',flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',p:[
    {id:1501,name:'Marshall',pos:'GK',spd:64,pwr:68,tec:68,def:82,rar:1,jersey:1,sav:76,ref:70},
    {id:1502,name:'Robertson',pos:'LB',spd:82,pwr:72,tec:80,def:76,rar:2,jersey:3},
    {id:1503,name:'Hanley',pos:'CB1',spd:66,pwr:80,tec:64,def:84,rar:1,jersey:5},
    {id:1504,name:'Maguire',pos:'CB2',spd:64,pwr:78,tec:62,def:82,rar:1,jersey:6},
    {id:1505,name:'Hutton',pos:'RB',spd:72,pwr:70,tec:68,def:76,rar:1,jersey:2},
    {id:1506,name:'Brown',pos:'CM1',spd:76,pwr:80,tec:74,def:76,rar:1,jersey:8},
    {id:1507,name:'Fergusson',pos:'CM2',spd:74,pwr:76,tec:78,def:68,rar:1,jersey:4},
    {id:1508,name:'McGregor',pos:'CM3',spd:76,pwr:74,tec:80,def:64,rar:1,jersey:7},
    {id:1509,name:'Tierney',pos:'LW',spd:80,pwr:74,tec:78,def:58,rar:1,jersey:11},
    {id:1510,name:'Fletcher',pos:'ST',spd:78,pwr:80,tec:76,def:54,rar:1,jersey:9},
    {id:1511,name:'McGinn',pos:'RW',spd:80,pwr:76,tec:82,def:52,rar:2,jersey:10},
  ]},
  belgium:{name:'Belgium',flag:'🇧🇪',p:[
    {id:1601,name:'Courtois',pos:'GK',spd:68,pwr:76,tec:74,def:92,rar:2,jersey:1,sav:88,ref:82},
    {id:1602,name:'Vertonghen',pos:'LB',spd:76,pwr:78,tec:76,def:84,rar:2,jersey:3},
    {id:1603,name:'Kompany',pos:'CB1',spd:70,pwr:86,tec:72,def:90,rar:2,jersey:5},
    {id:1604,name:'Alderweireld',pos:'CB2',spd:68,pwr:82,tec:74,def:88,rar:2,jersey:6},
    {id:1605,name:'Meunier',pos:'RB',spd:78,pwr:74,tec:76,def:78,rar:1,jersey:2},
    {id:1606,name:'Witsel',pos:'CM1',spd:78,pwr:82,tec:80,def:76,rar:2,jersey:8},
    {id:1607,name:'Fellaini',pos:'CM2',spd:76,pwr:86,tec:74,def:72,rar:1,jersey:4},
    {id:1608,name:'De.Bruyne',pos:'CM3',spd:84,pwr:84,tec:92,def:62,rar:2,jersey:7},
    {id:1609,name:'Mertens',pos:'LW',spd:82,pwr:78,tec:86,def:54,rar:2,jersey:11},
    {id:1610,name:'Lukaku',pos:'ST',spd:82,pwr:90,tec:80,def:52,rar:2,jersey:9},
    {id:1611,name:'Hazard',pos:'RW',spd:86,pwr:82,tec:92,def:50,rar:2,jersey:10},
  ]},
  austria:{name:'Austria',flag:'🇦🇹',p:[
    {id:1701,name:'Lindner',pos:'GK',spd:64,pwr:68,tec:68,def:82,rar:1,jersey:1,sav:76,ref:70},
    {id:1702,name:'Alaba',pos:'LB',spd:82,pwr:78,tec:82,def:80,rar:2,jersey:3},
    {id:1703,name:'Hinteregger',pos:'CB1',spd:68,pwr:82,tec:68,def:86,rar:1,jersey:5},
    {id:1704,name:'Dragovic',pos:'CB2',spd:66,pwr:80,tec:66,def:84,rar:1,jersey:6},
    {id:1705,name:'Lainer',pos:'RB',spd:74,pwr:72,tec:72,def:76,rar:1,jersey:2},
    {id:1706,name:'Baumgartner',pos:'CM1',spd:76,pwr:76,tec:80,def:68,rar:1,jersey:8},
    {id:1707,name:'Grillitsch',pos:'CM2',spd:74,pwr:78,tec:76,def:72,rar:1,jersey:4},
    {id:1708,name:'Laimer',pos:'CM3',spd:78,pwr:76,tec:78,def:68,rar:1,jersey:7},
    {id:1709,name:'Sabitzer',pos:'LW',spd:80,pwr:78,tec:82,def:58,rar:2,jersey:11},
    {id:1710,name:'Arnautovic',pos:'ST',spd:80,pwr:86,tec:80,def:54,rar:2,jersey:9},
    {id:1711,name:'Schopf',pos:'RW',spd:78,pwr:76,tec:80,def:56,rar:1,jersey:10},
  ]},
  croatia:{name:'Croatia',flag:'🇭🇷',p:[
    {id:1801,name:'Subasic',pos:'GK',spd:66,pwr:72,tec:70,def:88,rar:2,jersey:1,sav:84,ref:78},
    {id:1802,name:'Strinic',pos:'LB',spd:76,pwr:72,tec:74,def:78,rar:1,jersey:3},
    {id:1803,name:'Lovren',pos:'CB1',spd:68,pwr:82,tec:68,def:86,rar:2,jersey:5},
    {id:1804,name:'Vida',pos:'CB2',spd:66,pwr:80,tec:66,def:84,rar:1,jersey:6},
    {id:1805,name:'Vrsaljko',pos:'RB',spd:78,pwr:74,tec:74,def:78,rar:1,jersey:2},
    {id:1806,name:'Rakitic',pos:'CM1',spd:80,pwr:80,tec:86,def:72,rar:2,jersey:8},
    {id:1807,name:'Brozovic',pos:'CM2',spd:78,pwr:78,tec:84,def:74,rar:2,jersey:4},
    {id:1808,name:'Modric',pos:'CM3',spd:82,pwr:78,tec:92,def:66,rar:2,jersey:10},
    {id:1809,name:'Rebic',pos:'LW',spd:82,pwr:82,tec:80,def:56,rar:1,jersey:11},
    {id:1810,name:'Mandzukic',pos:'ST',spd:80,pwr:88,tec:78,def:54,rar:2,jersey:9},
    {id:1811,name:'Perisic',pos:'RW',spd:82,pwr:80,tec:82,def:56,rar:2,jersey:7},
  ]},
  wales:{name:'Wales',flag:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',p:[
    {id:1901,name:'Hennessey',pos:'GK',spd:64,pwr:68,tec:66,def:82,rar:1,jersey:1,sav:76,ref:68},
    {id:1902,name:'Davies',pos:'LB',spd:78,pwr:70,tec:76,def:76,rar:1,jersey:3},
    {id:1903,name:'Williams',pos:'CB1',spd:66,pwr:78,tec:66,def:84,rar:1,jersey:5},
    {id:1904,name:'Mepham',pos:'CB2',spd:64,pwr:76,tec:64,def:82,rar:1,jersey:6},
    {id:1905,name:'Roberts',pos:'RB',spd:74,pwr:70,tec:72,def:74,rar:1,jersey:2},
    {id:1906,name:'Allen',pos:'CM1',spd:74,pwr:74,tec:78,def:72,rar:1,jersey:8},
    {id:1907,name:'Ramsey',pos:'CM2',spd:78,pwr:78,tec:84,def:66,rar:2,jersey:4},
    {id:1908,name:'Wilson',pos:'CM3',spd:76,pwr:76,tec:78,def:64,rar:1,jersey:7},
    {id:1909,name:'James',pos:'LW',spd:86,pwr:74,tec:80,def:54,rar:2,jersey:11},
    {id:1910,name:'Bale',pos:'ST',spd:88,pwr:88,tec:84,def:52,rar:2,jersey:9},
    {id:1911,name:'Vokes',pos:'RW',spd:76,pwr:80,tec:74,def:56,rar:1,jersey:10},
  ]},
  switzerland:{name:'Switzerland',flag:'🇨🇭',p:[
    {id:2001,name:'Sommer',pos:'GK',spd:66,pwr:70,tec:72,def:88,rar:2,jersey:1,sav:84,ref:78},
    {id:2002,name:'Rodriguez',pos:'LB',spd:78,pwr:74,tec:76,def:78,rar:1,jersey:3},
    {id:2003,name:'Schar',pos:'CB1',spd:68,pwr:80,tec:70,def:86,rar:1,jersey:5},
    {id:2004,name:'Akanji',pos:'CB2',spd:70,pwr:78,tec:70,def:84,rar:1,jersey:6},
    {id:2005,name:'Lichtsteiner',pos:'RB',spd:76,pwr:74,tec:74,def:78,rar:1,jersey:2},
    {id:2006,name:'Freuler',pos:'CM1',spd:76,pwr:78,tec:78,def:74,rar:1,jersey:8},
    {id:2007,name:'Zakaria',pos:'CM2',spd:78,pwr:82,tec:76,def:76,rar:1,jersey:4},
    {id:2008,name:'Xhaka',pos:'CM3',spd:76,pwr:80,tec:82,def:70,rar:2,jersey:7},
    {id:2009,name:'Embolo',pos:'LW',spd:80,pwr:82,tec:78,def:56,rar:1,jersey:11},
    {id:2010,name:'Seferovic',pos:'ST',spd:78,pwr:80,tec:76,def:54,rar:1,jersey:9},
    {id:2011,name:'Shaqiri',pos:'RW',spd:80,pwr:80,tec:84,def:54,rar:2,jersey:10},
  ]},
  uruguay:{name:'Uruguay',flag:'🇺🇾',p:[
    {id:2101,name:'Muslera',pos:'GK',spd:66,pwr:70,tec:70,def:86,rar:2,jersey:1,sav:82,ref:76},
    {id:2102,name:'Caceres',pos:'LB',spd:74,pwr:74,tec:72,def:80,rar:1,jersey:3},
    {id:2103,name:'Godin',pos:'CB1',spd:68,pwr:84,tec:70,def:90,rar:2,jersey:5},
    {id:2104,name:'Gimenez',pos:'CB2',spd:70,pwr:82,tec:68,def:88,rar:2,jersey:6},
    {id:2105,name:'Laxalt',pos:'RB',spd:76,pwr:72,tec:72,def:76,rar:1,jersey:2},
    {id:2106,name:'Torreira',pos:'CM1',spd:76,pwr:78,tec:80,def:76,rar:1,jersey:8},
    {id:2107,name:'Bentancur',pos:'CM2',spd:78,pwr:78,tec:82,def:72,rar:2,jersey:4},
    {id:2108,name:'Nandez',pos:'CM3',spd:80,pwr:78,tec:78,def:70,rar:1,jersey:7},
    {id:2109,name:'Victorino',pos:'LW',spd:88,pwr:92,tec:86,def:54,rar:2,jersey:10},
    {id:2110,name:'Hino',pos:'ST',spd:86,pwr:88,tec:84,def:52,rar:2,jersey:9},
    {id:2111,name:'Suarez',pos:'RW',spd:84,pwr:86,tec:84,def:54,rar:2,jersey:11},
  ]},
  china:{name:'China',flag:'🇨🇳',p:[
    {id:2201,name:'Zhang',pos:'GK',spd:64,pwr:68,tec:68,def:84,rar:1,jersey:1,sav:78,ref:72},
    {id:2202,name:'Li',pos:'LB',spd:74,pwr:72,tec:70,def:78,rar:1,jersey:3},
    {id:2203,name:'Wang',pos:'CB1',spd:68,pwr:80,tec:66,def:86,rar:1,jersey:5},
    {id:2204,name:'Chen',pos:'CB2',spd:66,pwr:78,tec:64,def:84,rar:1,jersey:6},
    {id:2205,name:'Liu',pos:'RB',spd:72,pwr:70,tec:68,def:76,rar:1,jersey:2},
    {id:2206,name:'Xiao',pos:'CM1',spd:86,pwr:94,tec:88,def:70,rar:2,jersey:16},
    {id:2207,name:'Wei',pos:'CM2',spd:76,pwr:76,tec:78,def:68,rar:1,jersey:8},
    {id:2208,name:'Huang',pos:'CM3',spd:74,pwr:74,tec:76,def:66,rar:1,jersey:7},
    {id:2209,name:'Yang',pos:'LW',spd:80,pwr:76,tec:78,def:56,rar:1,jersey:11},
    {id:2210,name:'Sun',pos:'ST',spd:78,pwr:80,tec:76,def:54,rar:1,jersey:9},
    {id:2211,name:'Zhou',pos:'RW',spd:76,pwr:78,tec:78,def:54,rar:1,jersey:10},
  ]},
  sweden:{name:'Sweden',flag:'🇸🇪',p:[
    {id:2301,name:'Olsen',pos:'GK',spd:66,pwr:70,tec:70,def:86,rar:1,jersey:1,sav:82,ref:76},
    {id:2302,name:'Augustinsson',pos:'LB',spd:78,pwr:72,tec:76,def:78,rar:1,jersey:3},
    {id:2303,name:'Lindelof',pos:'CB1',spd:70,pwr:80,tec:72,def:86,rar:2,jersey:5},
    {id:2304,name:'Granqvist',pos:'CB2',spd:68,pwr:82,tec:68,def:88,rar:1,jersey:6},
    {id:2305,name:'Lustig',pos:'RB',spd:74,pwr:72,tec:72,def:78,rar:1,jersey:2},
    {id:2306,name:'Ekdal',pos:'CM1',spd:76,pwr:78,tec:78,def:74,rar:1,jersey:8},
    {id:2307,name:'Levi',pos:'CM2',spd:84,pwr:86,tec:88,def:68,rar:2,jersey:12},
    {id:2308,name:'Forsberg',pos:'CM3',spd:82,pwr:80,tec:86,def:62,rar:2,jersey:7},
    {id:2309,name:'Claesson',pos:'LW',spd:80,pwr:76,tec:78,def:56,rar:1,jersey:11},
    {id:2310,name:'Berg',pos:'ST',spd:78,pwr:82,tec:76,def:54,rar:1,jersey:9},
    {id:2311,name:'Ibrahimovic',pos:'RW',spd:84,pwr:90,tec:86,def:52,rar:2,jersey:10},
  ]},
  northkorea:{name:'North Korea',flag:'🇰🇵',p:[
    {id:2401,name:'Ri.Myong',pos:'GK',spd:64,pwr:68,tec:66,def:84,rar:1,jersey:1,sav:78,ref:70},
    {id:2402,name:'Pak.Chol',pos:'LB',spd:74,pwr:74,tec:70,def:80,rar:1,jersey:3},
    {id:2403,name:'Ri.Jun',pos:'CB1',spd:68,pwr:82,tec:66,def:88,rar:1,jersey:5},
    {id:2404,name:'Kim.Song',pos:'CB2',spd:66,pwr:80,tec:64,def:86,rar:1,jersey:6},
    {id:2405,name:'Choe.Kum',pos:'RB',spd:72,pwr:72,tec:68,def:78,rar:1,jersey:2},
    {id:2406,name:'An.Yong',pos:'CM1',spd:78,pwr:80,tec:78,def:76,rar:1,jersey:8},
    {id:2407,name:'Jong.Tae',pos:'CM2',spd:76,pwr:78,tec:80,def:72,rar:1,jersey:4},
    {id:2408,name:'Nam.Il',pos:'CM3',spd:80,pwr:76,tec:82,def:66,rar:1,jersey:7},
    {id:2409,name:'Pak.Nam',pos:'LW',spd:82,pwr:78,tec:80,def:58,rar:1,jersey:11},
    {id:2410,name:'Jong.Il',pos:'ST',spd:80,pwr:84,tec:78,def:54,rar:2,jersey:9},
    {id:2411,name:'Chol.Man',pos:'RW',spd:78,pwr:80,tec:80,def:56,rar:1,jersey:10},
  ]},
  usa:{name:'USA',flag:'🇺🇸',p:[
    {id:2501,name:'Turner',pos:'GK',spd:64,pwr:68,tec:68,def:82,rar:1,jersey:1,sav:76,ref:70},
    {id:2502,name:'Robinson',pos:'LB',spd:80,pwr:72,tec:76,def:76,rar:1,jersey:3},
    {id:2503,name:'Zimmerman',pos:'CB1',spd:68,pwr:78,tec:68,def:84,rar:1,jersey:5},
    {id:2504,name:'Long',pos:'CB2',spd:66,pwr:76,tec:66,def:82,rar:1,jersey:6},
    {id:2505,name:'Dest',pos:'RB',spd:82,pwr:72,tec:78,def:72,rar:1,jersey:2},
    {id:2506,name:'Adams',pos:'CM1',spd:78,pwr:80,tec:78,def:76,rar:1,jersey:8},
    {id:2507,name:'McKennie',pos:'CM2',spd:80,pwr:82,tec:80,def:70,rar:1,jersey:4},
    {id:2508,name:'Musah',pos:'CM3',spd:80,pwr:78,tec:82,def:64,rar:1,jersey:7},
    {id:2509,name:'Weah',pos:'LW',spd:84,pwr:76,tec:80,def:56,rar:1,jersey:11},
    {id:2510,name:'Altidore',pos:'ST',spd:78,pwr:84,tec:76,def:54,rar:1,jersey:9},
    {id:2511,name:'Pulisic',pos:'RW',spd:86,pwr:80,tec:86,def:54,rar:2,jersey:10},
  ]},
  morocco:{name:'Morocco',flag:'🇲🇦',p:[
    {id:2601,name:'Bono',pos:'GK',spd:66,pwr:70,tec:72,def:90,rar:2,jersey:1,sav:86,ref:80},
    {id:2602,name:'Mazraoui',pos:'LB',spd:80,pwr:74,tec:78,def:78,rar:2,jersey:3},
    {id:2603,name:'Aguerd',pos:'CB1',spd:70,pwr:82,tec:70,def:88,rar:1,jersey:5},
    {id:2604,name:'Saiss',pos:'CB2',spd:68,pwr:84,tec:70,def:90,rar:2,jersey:6},
    {id:2605,name:'Hakimi',pos:'RB',spd:88,pwr:76,tec:82,def:76,rar:2,jersey:2},
    {id:2606,name:'Amrabat',pos:'CM1',spd:80,pwr:82,tec:80,def:82,rar:2,jersey:8},
    {id:2607,name:'Ounahi',pos:'CM2',spd:78,pwr:78,tec:82,def:70,rar:1,jersey:4},
    {id:2608,name:'Ziyech',pos:'CM3',spd:82,pwr:78,tec:88,def:60,rar:2,jersey:7},
    {id:2609,name:'Boufal',pos:'LW',spd:84,pwr:76,tec:84,def:56,rar:2,jersey:11},
    {id:2610,name:'En.Nesyri',pos:'ST',spd:82,pwr:86,tec:80,def:54,rar:2,jersey:9},
    {id:2611,name:'Hamdallah',pos:'RW',spd:80,pwr:84,tec:82,def:54,rar:2,jersey:10},
  ]},
  japan:{name:'Japan',flag:'🇯🇵',p:[
    {id:201,name:'G.Wakabayashi',pos:'GK',spd:68,pwr:72,tec:74,def:92,rar:2,jersey:1,sav:92,ref:86},
    {id:202,name:'S.Akai',pos:'LB',spd:74,pwr:70,tec:68,def:78,rar:1,jersey:23},
    {id:203,name:'R.Ishizaki',pos:'CB1',spd:72,pwr:74,tec:70,def:80,rar:2,jersey:4},
    {id:204,name:'J.Misugi',pos:'CB2',spd:70,pwr:68,tec:80,def:76,rar:2,jersey:6},
    {id:205,name:'M.Soda',pos:'RB',spd:76,pwr:68,tec:72,def:74,rar:1,jersey:7},
    {id:206,name:'H.Matsuyama',pos:'CM1',spd:66,pwr:80,tec:66,def:82,rar:2,jersey:12},
    {id:207,name:'S.Aoi',pos:'CM2',spd:78,pwr:72,tec:82,def:68,rar:2,jersey:20},
    {id:208,name:'T.Misaki',pos:'CM3',spd:84,pwr:68,tec:90,def:66,rar:2,jersey:11},
    {id:209,name:'S.Nitta',pos:'LW',spd:82,pwr:76,tec:80,def:54,rar:1,jersey:18},
    {id:210,name:'T.Ozora',pos:'CM2',spd:86,pwr:82,tec:92,def:54,rar:2,jersey:10},
    {id:211,name:'K.Hyuga',pos:'ST',spd:84,pwr:90,tec:82,def:52,rar:2,jersey:9},
    // Reserves
    {id:212,name:'K.Wakashimazu',pos:'GK',spd:66,pwr:70,tec:72,def:84,rar:1,jersey:17,sav:82,ref:78},
    {id:213,name:'K.Jito',pos:'RB',spd:76,pwr:68,tec:70,def:76,rar:1,jersey:5},
    {id:214,name:'M.Tachibana',pos:'LB',spd:78,pwr:66,tec:74,def:72,rar:1,jersey:2},
    {id:215,name:'K.Tachibana',pos:'CB1',spd:74,pwr:70,tec:72,def:74,rar:1,jersey:3},
    {id:216,name:'S.Sawada',pos:'CM1',spd:74,pwr:72,tec:76,def:64,rar:1,jersey:15},
    {id:217,name:'Y.Isagi',pos:'LW',spd:86,pwr:76,tec:82,def:56,rar:2,jersey:19},
  ],reserves:[212,213,214,215,216,217]},
  italy:{name:'Italy',flag:'🇮🇹',formation:'4-1-3-2',p:[
    {id:301,name:'G.Buffon',   pos:'GK', spd:66,pwr:74,tec:72,def:92,rar:2,jersey:1, sav:90,ref:82},
    {id:302,name:'S.Gentile',  pos:'LB', spd:74,pwr:72,tec:70,def:84,rar:2,jersey:3},
    {id:303,name:'F.Feo',      pos:'CB1',spd:68,pwr:80,tec:66,def:86,rar:1,jersey:5},
    {id:304,name:'F.Cannavaro',pos:'CB2',spd:70,pwr:82,tec:72,def:90,rar:2,jersey:4},
    {id:312,name:'A.Ferlora',  pos:'RB', spd:78,pwr:74,tec:76,def:78,rar:1,jersey:17},
    {id:305,name:'T.Frisina',  pos:'CM1',spd:76,pwr:90,tec:84,def:82,rar:2,jersey:6, pas:83,sho:96},
    {id:306,name:'F.Totti',    pos:'CM2',spd:78,pwr:84,tec:90,def:66,rar:2,jersey:10},
    {id:307,name:'A.Delpiero', pos:'CM3',spd:80,pwr:82,tec:88,def:62,rar:2,jersey:2},
    {id:311,name:'R.Baggio',   pos:'LW', spd:84,pwr:80,tec:90,def:50,rar:2,jersey:7},
    {id:309,name:'M.Mancuso',  pos:'ST', spd:84,pwr:87,tec:86,def:54,rar:1,jersey:9, sho:91},
    {id:310,name:'E.Vella',    pos:'RW', spd:96,pwr:86,tec:80,def:52,rar:1,jersey:11},
    // Reserves
    {id:308,name:'A.Pirlo',    pos:'CM3',spd:74,pwr:76,tec:92,def:68,rar:2,jersey:8},
    {id:313,name:'C.Impero',   pos:'CM1',spd:76,pwr:76,tec:80,def:70,rar:1,jersey:18},
    {id:314,name:'G.Gino',     pos:'GK', spd:64,pwr:68,tec:66,def:82,rar:1,jersey:24,sav:78,ref:70}],
  reserves:[308,313,314]},
  argentina:{name:'Argentina',flag:'🇦🇷',p:[
    {id:701,name:'S.Goyco',pos:'GK',spd:66,pwr:72,tec:70,def:88,rar:2,sav:86,ref:80},
    {id:702,name:'J.Zanetti',pos:'LB',spd:82,pwr:72,tec:78,def:80,rar:2},
    {id:703,name:'R.Ayala',pos:'CB1',spd:70,pwr:80,tec:72,def:88,rar:2},
    {id:704,name:'W.Samuel',pos:'CB2',spd:66,pwr:82,tec:68,def:88,rar:2},
    {id:705,name:'P.Sorin',pos:'RB',spd:80,pwr:70,tec:76,def:78,rar:1},
    {id:706,name:'J.Riquelme',pos:'CM1',spd:74,pwr:78,tec:92,def:62,rar:2},
    {id:707,name:'P.Aimar',pos:'CM2',spd:82,pwr:76,tec:90,def:60,rar:2},
    {id:708,name:'D.Simeone',pos:'CM3',spd:72,pwr:80,tec:78,def:80,rar:1},
    {id:709,name:'C.Tevez',pos:'LW',spd:86,pwr:84,tec:82,def:56,rar:2},
    {id:710,name:'G.Batistuta',pos:'ST',spd:80,pwr:92,tec:78,def:48,rar:2},
    {id:711,name:'L.Messi',pos:'RW',spd:92,pwr:84,tec:96,def:52,rar:2}]},
  holland:{name:'Holland',flag:'🇳🇱',p:[
    {id:801,name:'E.vanDerSar',pos:'GK',spd:66,pwr:72,tec:74,def:90,rar:2,sav:88,ref:82},
    {id:802,name:'G.vBronck',pos:'LB',spd:80,pwr:72,tec:78,def:78,rar:1},
    {id:803,name:'J.Stam',pos:'CB1',spd:68,pwr:86,tec:68,def:90,rar:2},
    {id:804,name:'F.deBoer',pos:'CB2',spd:66,pwr:78,tec:80,def:86,rar:2},
    {id:805,name:'M.Reiziger',pos:'RB',spd:78,pwr:70,tec:76,def:78,rar:1},
    {id:806,name:'E.Davids',pos:'CM1',spd:82,pwr:78,tec:84,def:78,rar:2},
    {id:807,name:'W.Sneijder',pos:'CM2',spd:78,pwr:82,tec:90,def:64,rar:2},
    {id:808,name:'C.Seedorf',pos:'CM3',spd:80,pwr:84,tec:86,def:72,rar:2},
    {id:809,name:'A.Robben',pos:'LW',spd:92,pwr:82,tec:90,def:50,rar:2},
    {id:810,name:'R.vNistelrooy',pos:'ST',spd:80,pwr:90,tec:82,def:48,rar:2},
    {id:811,name:'M.Overmars',pos:'RW',spd:90,pwr:78,tec:86,def:48,rar:1}]},
  england:{name:'England',flag:'🏴',p:[
    {id:901,name:'D.Seaman',pos:'GK',spd:64,pwr:70,tec:72,def:88,rar:2,sav:86,ref:80},
    {id:902,name:'A.Cole',pos:'LB',spd:82,pwr:70,tec:78,def:80,rar:1},
    {id:903,name:'J.Terry',pos:'CB1',spd:64,pwr:84,tec:70,def:90,rar:2},
    {id:904,name:'R.Ferdinand',pos:'CB2',spd:72,pwr:82,tec:76,def:88,rar:2},
    {id:905,name:'G.Neville',pos:'RB',spd:76,pwr:70,tec:74,def:80,rar:1},
    {id:906,name:'S.Gerrard',pos:'CM1',spd:82,pwr:88,tec:84,def:76,rar:2},
    {id:907,name:'F.Lampard',pos:'CM2',spd:78,pwr:84,tec:84,def:72,rar:2},
    {id:908,name:'D.Beckham',pos:'CM3',spd:76,pwr:80,tec:92,def:64,rar:2},
    {id:909,name:'M.Owen',pos:'LW',spd:90,pwr:82,tec:84,def:50,rar:2},
    {id:910,name:'W.Rooney',pos:'ST',spd:84,pwr:88,tec:84,def:58,rar:2},
    {id:911,name:'R.Sterling',pos:'RW',spd:92,pwr:76,tec:86,def:48,rar:1}]},
  portugal:{name:'Portugal',flag:'🇵🇹',p:[
    {id:1001,name:'R.Patricio',pos:'GK',spd:66,pwr:72,tec:72,def:88,rar:2,sav:86,ref:80},
    {id:1002,name:'P.Ferreira',pos:'LB',spd:78,pwr:70,tec:76,def:78,rar:1},
    {id:1003,name:'P.Pepe',pos:'CB1',spd:70,pwr:84,tec:72,def:88,rar:2},
    {id:1004,name:'R.Carvalho',pos:'CB2',spd:66,pwr:80,tec:78,def:86,rar:2},
    {id:1005,name:'J.Cancelo',pos:'RB',spd:84,pwr:72,tec:84,def:76,rar:1},
    {id:1006,name:'L.Figo',pos:'CM1',spd:84,pwr:80,tec:90,def:62,rar:2},
    {id:1007,name:'B.Fernandes',pos:'CM2',spd:80,pwr:84,tec:90,def:66,rar:2},
    {id:1008,name:'R.Costa',pos:'CM3',spd:78,pwr:78,tec:92,def:64,rar:2},
    {id:1009,name:'N.Nani',pos:'LW',spd:88,pwr:80,tec:86,def:50,rar:1},
    {id:1010,name:'C.Ronaldo',pos:'ST',spd:90,pwr:94,tec:88,def:52,rar:2},
    {id:1011,name:'R.Leao',pos:'RW',spd:90,pwr:84,tec:84,def:46,rar:1}]},
  allstar:{name:'All Stars',flag:'⭐',p:[
    {id:101, name:'K.Muller',      pos:'GK', spd:66,pwr:74,tec:72,def:93,rar:3,jersey:1,sav:88,ref:80},
    {id:102, name:'H.Kaltz',       pos:'RB', spd:78,pwr:74,tec:72,def:80,rar:2,jersey:2},
    {id:9901,name:'R.Carlos',      pos:'LB', spd:90,pwr:82,tec:82,def:78,rar:3,jersey:3},
    {id:1202,name:'Puyol',         pos:'CB1',spd:76,pwr:80,tec:72,def:88,rar:3,jersey:5},
    {id:1203,name:'Pique',         pos:'CB2',spd:72,pwr:84,tec:74,def:90,rar:3,jersey:4},
    {id:1209,name:'Michael',       pos:'CM1',spd:88,pwr:82,tec:92,def:58,rar:3,jersey:6},
    {id:711, name:'L.Messi',       pos:'CM2',spd:92,pwr:84,tec:96,def:52,rar:3,jersey:10},
    {id:9902,name:'Z.Zidane',      pos:'CM3',spd:78,pwr:82,tec:96,def:64,rar:3,jersey:5},
    {id:1208,name:'Raphael',       pos:'LW', spd:84,pwr:80,tec:88,def:64,rar:2,jersey:11},
    {id:109, name:'K.H.Schneider', pos:'ST', spd:86,pwr:96,tec:84,def:50,rar:3,jersey:9},
    {id:1010,name:'C.Ronaldo',     pos:'RW', spd:90,pwr:94,tec:88,def:52,rar:3,jersey:7},
  ]}
};
const TEAM_KEYS=Object.keys(T);
// All teams available — Japan and All Stars are featured first
const DEMO_TEAMS=TEAM_KEYS;
const GRID={
  bands:{buildUp:0.30,advance:0.50,threat:0.70,final:0.85},
  encounterWidth:0.08,
};

const ENGINE_CONFIG={
  ai:{
    passProgressWeight:1.8,
    passOpenLaneWeight:1.0,
    attackerZoneBonus:{def:0.2,mid:0.55,att:0.95},
    pressureRadius:0.16,
    duelPressureRadius:0.12,
    shotWindowBase:0.55,
    specialWindowBase:0.58,
    supportRunnerSpacingWeight:1.4
  },
  duel:{
    rngMin:0.93,
    rngMax:1.07,
    centralShotBonus:0.18,
    progressShotBonus:0.72,
    pressureAttackPenalty:0.16,
    coverDefenceBonus:0.1,
    blockerDefenceBonus:0.12,
    reboundBandLow:0.92,
    reboundBandHigh:1.08,
    // Zone thresholds (progress = 0→1, goal line = 1)
    zones:{
      longRange:  0.72,   // < this: long shot territory
      midRange:   0.82,   // 0.72–0.82: midrange
      boxEdge:    0.91,   // 0.82–0.91: box edge
      pointBlank: 0.91,   // > this: point blank
    }
  },
  stages:{
    buildUp:0.28,
    advance:0.58,
    threat:0.8
  }
};

const PLAYER_ARCHETYPES={
  'T.Ozora':      {passBias:1.30,dribbleBias:1.20,shootBias:1.00,oneTwoBias:1.25,longShotBias:0.95,pressResistance:1.20,wideRunBias:0.90,specialBias:1.05,defensiveAggression:0.90},
  'T.Misaki':     {passBias:1.28,dribbleBias:0.95,shootBias:0.86,oneTwoBias:1.35,longShotBias:0.80,pressResistance:1.10,wideRunBias:0.95,specialBias:0.95,defensiveAggression:0.85},
  'K.Hyuga':      {passBias:0.78,dribbleBias:1.00,shootBias:1.35,oneTwoBias:0.80,longShotBias:1.20,pressResistance:1.08,wideRunBias:0.85,specialBias:1.25,defensiveAggression:1.05},
  'J.Misugi':     {passBias:1.20,dribbleBias:0.90,shootBias:1.15,oneTwoBias:1.10,longShotBias:1.05,pressResistance:1.15,wideRunBias:0.90,specialBias:1.10,defensiveAggression:0.80},
  'H.Matsuyama':  {passBias:0.85,dribbleBias:1.05,shootBias:1.20,oneTwoBias:0.88,longShotBias:1.15,pressResistance:1.05,wideRunBias:0.88,specialBias:1.15,defensiveAggression:1.10},
  'S.Nitta':      {passBias:1.00,dribbleBias:1.10,shootBias:1.15,oneTwoBias:1.00,longShotBias:1.00,pressResistance:1.05,wideRunBias:1.10,specialBias:1.10,defensiveAggression:0.90},
  'M.Soda':       {passBias:0.90,dribbleBias:1.05,shootBias:1.10,oneTwoBias:0.90,longShotBias:1.08,pressResistance:1.00,wideRunBias:1.05,specialBias:1.05,defensiveAggression:1.05},
  'S.Aoi':        {passBias:1.15,dribbleBias:1.15,shootBias:1.10,oneTwoBias:1.10,longShotBias:0.95,pressResistance:1.10,wideRunBias:1.05,specialBias:1.10,defensiveAggression:0.88},
  'K.H.Schneider':{passBias:0.82,dribbleBias:1.05,shootBias:1.35,oneTwoBias:0.82,longShotBias:1.20,pressResistance:1.10,wideRunBias:0.92,specialBias:1.18,defensiveAggression:1.02},
  'Natureza':     {passBias:1.00,dribbleBias:1.35,shootBias:1.20,oneTwoBias:1.00,longShotBias:1.08,pressResistance:1.25,wideRunBias:1.08,specialBias:1.15,defensiveAggression:0.92},
  'Rivaul':       {passBias:1.18,dribbleBias:1.10,shootBias:1.08,oneTwoBias:1.12,longShotBias:1.10,pressResistance:1.14,wideRunBias:0.94,specialBias:1.08,defensiveAggression:0.95},
  'C.Santana':    {passBias:0.92,dribbleBias:1.08,shootBias:1.22,oneTwoBias:0.94,longShotBias:1.08,pressResistance:1.10,wideRunBias:0.96,specialBias:1.10,defensiveAggression:1.00},
  'Michael':      {passBias:1.20,dribbleBias:1.10,shootBias:1.18,oneTwoBias:1.05,longShotBias:1.08,pressResistance:1.14,wideRunBias:0.92,specialBias:1.12,defensiveAggression:0.98},
  'A.Pirlo':      {passBias:1.28,dribbleBias:0.82,shootBias:0.88,oneTwoBias:1.10,longShotBias:1.12,pressResistance:1.00,wideRunBias:0.90,specialBias:0.95,defensiveAggression:0.82},
  'F.Totti':      {passBias:1.12,dribbleBias:1.00,shootBias:1.15,oneTwoBias:1.02,longShotBias:1.10,pressResistance:1.04,wideRunBias:0.90,specialBias:1.08,defensiveAggression:0.90},
  'R.Baggio':     {passBias:1.15,dribbleBias:1.15,shootBias:1.05,oneTwoBias:1.10,longShotBias:0.98,pressResistance:1.12,wideRunBias:0.94,specialBias:1.05,defensiveAggression:0.82},
  'L.Messi':      {passBias:1.18,dribbleBias:1.35,shootBias:1.18,oneTwoBias:1.12,longShotBias:1.00,pressResistance:1.26,wideRunBias:0.92,specialBias:1.08,defensiveAggression:0.80},
  'R.Carlos':     {passBias:1.00,dribbleBias:1.10,shootBias:1.20,oneTwoBias:0.95,longShotBias:1.25,pressResistance:1.15,wideRunBias:1.30,specialBias:1.00,defensiveAggression:1.10},
  'Z.Zidane':     {passBias:1.25,dribbleBias:1.20,shootBias:1.10,oneTwoBias:1.15,longShotBias:1.05,pressResistance:1.30,wideRunBias:0.88,specialBias:1.05,defensiveAggression:0.85},
  'C.Ronaldo':    {passBias:0.90,dribbleBias:1.05,shootBias:1.34,oneTwoBias:0.88,longShotBias:1.15,pressResistance:1.10,wideRunBias:1.05,specialBias:1.20,defensiveAggression:0.92}
};


const DEFAULT_BEHAVIOR_PROFILE={passBias:1.0,dribbleBias:1.0,shootBias:1.0,oneTwoBias:1.0,longShotBias:1.0,pressResistance:1.0,wideRunBias:1.0,specialBias:1.0,defensiveAggression:1.0};

const STAR_STAT_OVERRIDES={
  'T.Ozora':       {spd:86,dri:95,pas:96,sho:87,def:58,pow:84},
  'T.Misaki':      {spd:84,dri:91,pas:94,sho:78,def:68,pow:66},
  'K.Hyuga':       {spd:84,dri:83,pas:72,sho:95,def:54,pow:94},
  'J.Misugi':      {spd:70,dri:82,pas:86,sho:88,def:76,pow:70},
  'H.Matsuyama':   {spd:66,dri:76,pas:70,sho:86,def:82,pow:82},
  'S.Nitta':       {spd:82,dri:80,pas:76,sho:84,def:54,pow:78},
  'M.Soda':        {spd:76,dri:74,pas:72,sho:82,def:74,pow:70},
  'S.Aoi':         {spd:78,dri:84,pas:80,sho:84,def:68,pow:74},
  'K.H.Schneider': {spd:87,dri:84,pas:76,sho:96,def:52,pow:95},
  'Natureza':      {spd:94,dri:98,pas:90,sho:96,def:52,pow:93},
  'Rivaul':        {spd:84,dri:94,pas:95,sho:90,def:60,pow:86},
  'C.Santana':     {spd:85,dri:89,pas:80,sho:92,def:54,pow:90},
  'Michael':       {spd:89,dri:95,pas:94,sho:97,def:72,pow:94},
  'A.Pirlo':       {spd:70,dri:84,pas:98,sho:84,def:70,pow:74},
  'F.Totti':       {spd:79,dri:88,pas:91,sho:92,def:68,pow:86},
  'R.Baggio':      {spd:84,dri:94,pas:93,sho:88,def:52,pow:80},
  'T.Frisina':     {spd:76,dri:82,pas:83,sho:96,def:82,pow:90},
  'M.Mancuso':     {spd:84,dri:86,pas:78,sho:91,def:54,pow:87},
  'E.Vella':       {spd:96,dri:84,pas:74,sho:86,def:52,pow:86},
  'A.Ferlora':     {spd:78,dri:78,pas:76,sho:72,def:78,pow:74},
  'C.Impero':      {spd:76,dri:80,pas:82,sho:74,def:70,pow:76},
  'G.Hernandez':   {spd:64,dri:62,pas:60,sho:58,def:82,pow:68}, // Spain
  'G.Gino':        {spd:64,dri:62,pas:60,sho:58,def:82,pow:68}, // Italy bench GK
  'Y.Isagi':       {spd:86,dri:84,pas:80,sho:88,def:56,pow:78},
  'L.Messi':       {spd:93,dri:99,pas:94,sho:92,def:54,pow:80},
  'C.Ronaldo':     {spd:92,dri:90,pas:82,sho:97,def:54,pow:96},
  'R.Carlos':      {spd:90,dri:82,pas:80,sho:84,def:78,pow:86},
  'Z.Zidane':      {spd:78,dri:94,pas:96,sho:82,def:66,pow:82},
  'J.Riquelme':    {spd:72,dri:89,pas:96,sho:84,def:64,pow:78},
  'P.Aimar':       {spd:84,dri:93,pas:92,sho:82,def:60,pow:76},
  'D.Beckham':     {spd:78,dri:84,pas:97,sho:86,def:66,pow:82},
  'W.Sneijder':    {spd:79,dri:86,pas:94,sho:90,def:66,pow:84},
  'A.Robben':      {spd:96,dri:95,pas:84,sho:88,def:50,pow:80},
  'R.vNistelrooy': {spd:81,dri:84,pas:74,sho:94,def:48,pow:92},
  'F.Lampard':     {spd:79,dri:82,pas:90,sho:90,def:74,pow:86},
  'S.Gerrard':     {spd:84,dri:84,pas:91,sho:91,def:78,pow:90}
};

function applyTeamBehaviorProfiles(){
  Object.values(T).forEach(team=>{
    (team.p||[]).forEach(pl=>{
      const named=PLAYER_ARCHETYPES[pl.name]||{};
      const statOverride=STAR_STAT_OVERRIDES[pl.name]||{};
      pl.behavior={...DEFAULT_BEHAVIOR_PROFILE,...named};
      Object.assign(pl,statOverride);
    });
  });
}
applyTeamBehaviorProfiles();

const POS=[{k:'GK',z:'gk',o:0},{k:'LB',z:'def',o:1},{k:'CB1',z:'def',o:2},{k:'CB2',z:'def',o:3},{k:'RB',z:'def',o:4},{k:'CM1',z:'mid',o:5},{k:'CM2',z:'mid',o:6},{k:'CM3',z:'mid',o:7},{k:'LW',z:'att',o:8},{k:'ST',z:'att',o:9},{k:'RW',z:'att',o:10}];
const BF={
  GK: {x:.05,y:.50},
  LB: {x:.18,y:.20},CB1:{x:.22,y:.38},CB2:{x:.22,y:.62},RB: {x:.18,y:.80},
  CM1:{x:.38,y:.26},CM2:{x:.42,y:.50},CM3:{x:.38,y:.74},
  LW: {x:.46,y:.14},ST: {x:.47,y:.50},RW: {x:.46,y:.86}
};

const FORMATIONS={
  '4-3-3':{
    labels:{LB:'LB',CB1:'CB',CB2:'CB',RB:'RB',CM1:'LCM',CM2:'CM',CM3:'RCM',LW:'LW',ST:'ST',RW:'RW'},
    coords:{GK:{x:.05,y:.50},LB:{x:.18,y:.18},CB1:{x:.22,y:.38},CB2:{x:.22,y:.62},RB:{x:.18,y:.82},CM1:{x:.38,y:.26},CM2:{x:.42,y:.50},CM3:{x:.38,y:.74},LW:{x:.52,y:.16},ST:{x:.56,y:.50},RW:{x:.52,y:.84}}
  },
  '4-4-2':{
    labels:{LB:'LB',CB1:'CB',CB2:'CB',RB:'RB',CM1:'LM',CM2:'LCM',CM3:'RCM',LW:'RM',ST:'ST1',RW:'ST2'},
    coords:{GK:{x:.05,y:.50},LB:{x:.18,y:.18},CB1:{x:.22,y:.38},CB2:{x:.22,y:.62},RB:{x:.18,y:.82},CM1:{x:.38,y:.18},CM2:{x:.42,y:.38},CM3:{x:.42,y:.62},LW:{x:.38,y:.82},ST:{x:.56,y:.40},RW:{x:.56,y:.60}}
  },
  '4-1-3-2':{
    labels:{LB:'LB',CB1:'CB',CB2:'CB',RB:'RB',CM1:'DM',CM2:'LAM',CM3:'CAM',LW:'RAM',ST:'ST1',RW:'ST2'},
    coords:{GK:{x:.05,y:.50},LB:{x:.18,y:.18},CB1:{x:.22,y:.38},CB2:{x:.22,y:.62},RB:{x:.18,y:.82},CM1:{x:.34,y:.50},CM2:{x:.46,y:.24},CM3:{x:.48,y:.50},LW:{x:.46,y:.76},ST:{x:.58,y:.40},RW:{x:.58,y:.60}}
  },
  '3-5-2':{
    labels:{LB:'LCB',CB1:'CB',CB2:'RCB',RB:'LWB',CM1:'LCM',CM2:'CM',CM3:'RCM',LW:'RWB',ST:'ST1',RW:'ST2'},
    coords:{GK:{x:.05,y:.50},LB:{x:.20,y:.24},CB1:{x:.20,y:.50},CB2:{x:.20,y:.76},RB:{x:.34,y:.12},CM1:{x:.38,y:.30},CM2:{x:.42,y:.50},CM3:{x:.38,y:.70},LW:{x:.34,y:.88},ST:{x:.56,y:.40},RW:{x:.56,y:.60}}
  }
};
let activeHomeFormation='4-3-3';
let FORMATION_COORDS=JSON.parse(JSON.stringify(FORMATIONS['4-3-3'].coords));
let HOME_SLOT_ASSIGN={};
function formationCoordsFor(side,key){
  const fm=(side==='h'?FORMATIONS[activeHomeFormation].coords:FORMATIONS['4-3-3'].coords);
  return fm[key]||BF[key];
}
function fp(k,s,h){let p={...(formationCoordsFor(s==='home'?'h':'a',k)||BF[k])};if(s==='away'){p.x=1-p.x;p.y=1-p.y;}if(h===2){p.x=1-p.x;}return{x:Math.max(.03,Math.min(.97,p.x)),y:Math.max(.04,Math.min(.96,p.y))};}
function zo(k){return(POS.find(p=>p.k===k)||{z:'mid'}).z;}
function pf(n){return n.split('.')[0]||n.slice(0,2);}
function rl(r){return['R','SR','SSR'][r||0];}
function rc(r){return['#5a9898','#c8a018','#e03818'][r||0];}

function gs(p,s){
  if(!p) return 44;
  const key=(s||'').toLowerCase();
  const direct=p[key];
  if(typeof direct==='number') return direct;
  if(key==='dri') return Math.round(((p.tec||50)*0.65)+((p.spd||50)*0.35));
  if(key==='pas') return p.pas||p.tec||50;
  if(key==='sho') return p.sho||p.pwr||50;
  if(key==='pow') return p.pow||p.pwr||50;
  if(key==='spd') return p.spd||50;
  if(key==='def') return p.def||50;
  if(key==='tec') return p.tec||p.pas||50;
  if(key==='pwr') return p.pwr||p.pow||50;
  if(key==='sav') return p.sav||p.def||50;
  if(key==='ref') return p.ref||p.pwr||50;
  return 50;
}
function calcOvr(pl){
  if(!pl)return '—';
  const pos=pl.pos||'';let v;
  if(pos==='GK') v=(gs(pl,'sav')*0.40)+(gs(pl,'ref')*0.25)+(gs(pl,'def')*0.20)+(gs(pl,'pwr')*0.15);
  else if(pos==='LB'||pos==='RB') v=(gs(pl,'def')*0.35)+(gs(pl,'spd')*0.25)+(gs(pl,'pwr')*0.20)+(gs(pl,'tec')*0.20);
  else if(pos==='CB1'||pos==='CB2') v=(gs(pl,'def')*0.45)+(gs(pl,'pwr')*0.30)+(gs(pl,'spd')*0.15)+(gs(pl,'tec')*0.10);
  else if(pos==='CM1'||pos==='CM2'||pos==='CM3') v=(gs(pl,'tec')*0.35)+(gs(pl,'spd')*0.25)+(gs(pl,'pwr')*0.20)+(gs(pl,'def')*0.20);
  else v=(gs(pl,'pwr')*0.35)+(gs(pl,'tec')*0.30)+(gs(pl,'spd')*0.25)+(gs(pl,'def')*0.10);
  return Math.round(v);
}

// Set team emblem in any element — emoji shows instantly, img replaces it if PNG loads
function setTeamEmblem(el, teamKey, flagEmoji){
  if(!el)return;
  el.style.display='';
  // Paint emoji fallback synchronously first so we always see something
  el.innerHTML='';
  el.textContent=flagEmoji||'🏳';
  if(!teamKey)return;
  const src='assets/team/'+(teamKey||'').toLowerCase()+'.png';
  const img=new Image();
  img.onload=()=>{
    el.innerHTML='';
    const i=document.createElement('img');
    i.src=src;i.alt='';
    i.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';
    el.appendChild(i);
  };
  // onerror: do nothing — the emoji is already shown
  img.src=src;
}
function showSc(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='s-home'){hmHover('friendly');returnToMenuMusic();}
  if(id==='s-career-clubs'){crBuildClubList();}
  if(id==='s-ts'){if(typeof syncTeamSelections==='function')syncTeamSelections();}
}
function cs(){say('Coming soon!');}

// Home menu image switcher
let _hmCurrent='friendly';
function hmHover(mode){
  if(_hmCurrent===mode)return;
  const prev=document.getElementById('hm-img-'+_hmCurrent);
  const next=document.getElementById('hm-img-'+mode);
  if(prev)prev.classList.remove('active');
  if(next)next.classList.add('active');
  // Update active ladder item
  document.querySelectorAll('.hm-item').forEach(el=>{
    el.classList.toggle('active',el.dataset.img===mode);
  });
  _hmCurrent=mode;
}

// ══════════════════════════════════════════════════════════
// IMPACT SYSTEM — screen shake, zoom, floating text
// ══════════════════════════════════════════════════════════
function shakeScreen(intensity=5, duration=80){
  const vp=document.getElementById('viewport')||document.body;
  const isVP=!!document.getElementById('viewport');
  let start=null;
  function step(ts){
    if(!start)start=ts;
    const p=(ts-start)/(duration);
    if(p>=1){vp.style.transform=isVP?'translate(-50%,-50%)':'';return;}
    const fade=1-p;
    const dx=(Math.random()*2-1)*intensity*fade;
    const dy=(Math.random()*2-1)*intensity*fade;
    vp.style.transform=isVP?`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`:`translate(${dx}px,${dy}px)`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function goalZoom(){
  const vp=document.getElementById('viewport')||document.body;
  const isVP=!!document.getElementById('viewport');
  const base=isVP?'translate(-50%,-50%) ':'';
  vp.style.transition='transform .18s ease-out';
  vp.style.transform=base+'scale(1.045)';
  setTimeout(()=>{
    vp.style.transition='transform .32s ease-in';
    vp.style.transform=base+'scale(1)';
    setTimeout(()=>{vp.style.transition='';vp.style.transform=isVP?'translate(-50%,-50%)':'';},320);
  },220);
}

function impactText(msg, color='#f0c040', size='clamp(18px,3vw,28px)'){
  const el=document.createElement('div');
  el.textContent=msg;
  el.style.cssText=`
    position:fixed;left:50%;top:38%;transform:translateX(-50%) scale(0.6);
    font-family:'Bebas Neue',sans-serif;font-size:${size};
    color:${color};letter-spacing:.1em;
    text-shadow:0 0 24px ${color},0 2px 8px rgba(0,0,0,.8);
    pointer-events:none;z-index:9999;
    transition:transform .15s cubic-bezier(.2,1.6,.4,1), opacity .4s ease .3s;
    opacity:1;white-space:nowrap;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      el.style.transform='translateX(-50%) scale(1)';
    });
  });
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),400);},700);
}

function btnPop(btn){
  if(!btn)return;
  btn.style.transform='scale(0.88)';
  btn.style.transition='transform .1s';
  setTimeout(()=>{btn.style.transform='scale(1)';setTimeout(()=>{btn.style.transition='';},100);},100);
}
let _menuMusicOn=false;
let _matchMusicEl=null;

function startMusic(){
  const a=document.getElementById('bgMusic');
  if(!a)return;
  a.volume=0.40;
  a.play().then(()=>{_menuMusicOn=true;}).catch(()=>{});
}
function stopMenuMusic(){
  const a=document.getElementById('bgMusic');
  if(a){a.pause();a.currentTime=0;}
  _menuMusicOn=false;
}
function startMatchMusic(){
  stopMenuMusic();
  stopMatchMusic();
  const track=Math.floor(Math.random()*3)+1;
  const a=document.getElementById('matchMusic'+track);
  if(!a)return;
  _matchMusicEl=a;
  a.volume=0.30;
  a.currentTime=0;
  a.play().catch(()=>{});
}
function stopMatchMusic(){
  if(_matchMusicEl){_matchMusicEl.pause();_matchMusicEl.currentTime=0;_matchMusicEl=null;}
  // Stop all just in case
  [1,2,3].forEach(i=>{const a=document.getElementById('matchMusic'+i);if(a){a.pause();a.currentTime=0;}});
}
function returnToMenuMusic(){
  stopMatchMusic();
  startMusic();
}
function toggleMusic(){
  // kept for Settings screen future use — no button visible
  const a=document.getElementById('bgMusic');
  if(!a)return;
  if(_menuMusicOn){a.pause();_menuMusicOn=false;}
  else{a.play().then(()=>{_menuMusicOn=true;}).catch(()=>{});}
}
function updateMusicBtn(){}
function say(t){const e=document.getElementById('comm');if(e)e.textContent=t;}
function showSpecialCutscene(pl,special,callback){
  const sc=document.getElementById('special-cutscene');
  if(!sc){if(callback)callback();return;}
  const faceEl=document.getElementById('sc-face');
  const lastName=pl?pl.name.split('.').pop().toLowerCase().trim():null;
  faceEl.innerHTML=lastName?`<img src="assets/cutscene/${lastName}.png" alt="" draggable="false">`:'';
  sc.classList.remove('show');void sc.offsetWidth;sc.classList.add('show');
  say((pl?pl.name.split('.').pop():'')+'— '+(special.l||'Special')+'!');
  shakeScreen(7,100);
  impactText('⚡ '+(special.l||'SPECIAL SHOT')+'!','#f0c040','clamp(18px,3vw,26px)');
  setTimeout(()=>{sc.classList.remove('show');if(callback)callback();},2200);
}
let _refTimer=null;
function showReferee(msg,duration=1200){
  const pop=document.getElementById('referee-popup');
  const lbl=document.getElementById('ref-msg');
  if(!pop||!lbl)return;
  if(_refTimer){clearTimeout(_refTimer);_refTimer=null;}
  lbl.textContent=msg;
  pop.classList.remove('show');
  void pop.offsetWidth;
  pop.classList.add('show');
  _refTimer=setTimeout(()=>{pop.classList.remove('show');_refTimer=null;},duration);
}

let selHome=null,selAway=null,HT=null,AT=null;
let hSq={},aSq={};
// Default: Japan (home) vs All Stars (away)
const _japanIdx=DEMO_TEAMS.indexOf('japan');
const _allstarIdx=DEMO_TEAMS.indexOf('allstar');
let homeIdx=_japanIdx>=0?_japanIdx:0;
let awayIdx=_allstarIdx>=0?_allstarIdx:1;
function calcTeamOvr(team){
  if(!team||!team.p)return 0;
  const reserveIds=new Set(team.reserves||[]);
  const starters=team.p.filter(p=>!reserveIds.has(p.id));
  if(!starters.length)return 0;
  const total=starters.reduce((sum,pl)=>sum+calcOvr(pl),0);
  return Math.round(total/starters.length);
}
function syncTeamSelections(){
  if(awayIdx===homeIdx)awayIdx=(awayIdx+1)%DEMO_TEAMS.length;
  selHome=DEMO_TEAMS[homeIdx]; selAway=DEMO_TEAMS[awayIdx]; HT=T[selHome]; AT=T[selAway];
  document.getElementById('hflag').textContent=HT.flag; document.getElementById('hname').textContent=HT.name.toUpperCase();
  document.getElementById('aflag').textContent=AT.flag; document.getElementById('aname').textContent=AT.name.toUpperCase();
  // Team emblems in shields — replace flag content with image
  setTeamEmblem(document.getElementById('hflag'), selHome, HT.flag);
  setTeamEmblem(document.getElementById('aflag'), selAway, AT.flag);
  const hOvr=calcTeamOvr(HT);
  const aOvr=calcTeamOvr(AT);
  document.getElementById('hsubhint').textContent='OVR '+hOvr;
  document.getElementById('asubhint').textContent='OVR '+aOvr;
  document.getElementById('kickbtn').classList.toggle('rdy',!!(selHome&&selAway&&selHome!==selAway));
}
function cycleTeam(side,dir){
  if(side==='home'){
    homeIdx=(homeIdx+dir+DEMO_TEAMS.length)%DEMO_TEAMS.length;
    if(homeIdx===awayIdx)homeIdx=(homeIdx+dir+DEMO_TEAMS.length)%DEMO_TEAMS.length;
  }else{
    awayIdx=(awayIdx+dir+DEMO_TEAMS.length)%DEMO_TEAMS.length;
    if(awayIdx===homeIdx)awayIdx=(awayIdx+dir+DEMO_TEAMS.length)%DEMO_TEAMS.length;
  }
  syncTeamSelections();
}
function buildCards(){syncTeamSelections();}
buildCards();

function getHomeRosterOrdered(){
  if(!HT) return [];
  const reserveIds=new Set(HT.reserves||[]);
  // Starters first (non-reserve), then reserves at end
  return HT.p.slice().sort((a,b)=>{
    const aRes=reserveIds.has(a.id)?1:0, bRes=reserveIds.has(b.id)?1:0;
    return aRes-bRes;
  });
}
function posFamily(pos){
  const p=(pos||'').toUpperCase();
  if(p==='GK')return 'GK';
  if(['LB','RB','CB','CB1','CB2','DF','LIB','SW','LWB','RWB'].includes(p))return 'DEF';
  if(['DM','CM','CM1','CM2','CM3','AM','MF','CDM','CAM','LM','RM'].includes(p))return 'MID';
  if(['FW','ST','CF','SS','LW','RW'].includes(p))return 'ATT';
  return 'ANY';
}
function slotFamily(slot){
  if(slot==='GK')return 'GK';
  if(['LB','CB1','CB2','RB'].includes(slot))return 'DEF';
  if(['CM1','CM2','CM3'].includes(slot))return 'MID';
  return 'ATT';
}
function displayPosLabel(slot){
  const labels=FORMATIONS[activeHomeFormation].labels||{};
  return labels[slot]||slot;
}
function playerSurname(name){
  if(!name) return '—';
  const parts=name.split('.');
  return (parts[1]||parts[0]).trim();
}
function preferredPositionsForSlot(slot){
  if(slot==='GK') return ['GK'];
  if(slot==='LB') return ['LB','LWB','DF','LIB'];
  if(slot==='RB') return ['RB','RWB','DF','LIB'];
  if(slot==='CB1'||slot==='CB2') return ['CB','CB1','CB2','DF','LIB','SW'];
  if(slot==='CM1') return ['DM','CM','CM1','MF','AM'];
  if(slot==='CM2') return ['CM','CM2','AM','MF','DM'];
  if(slot==='CM3') return ['CM','CM3','AM','MF','DM'];
  if(slot==='LW') return ['LW','LM','FW','AM','RW'];
  if(slot==='RW') return ['RW','RM','FW','AM','LW'];
  if(slot==='ST') return ['ST','FW','CF','SS'];
  return [];
}
function buildSlotPriorityMap(){
  return Object.keys(FORMATIONS[activeHomeFormation].coords).reduce((acc,slot)=>{acc[slot]=preferredPositionsForSlot(slot); return acc;},{});
}
function pickRosterPlayer(roster, used, slot){
  const pref=preferredPositionsForSlot(slot);
  const reserveIds=new Set(HT&&HT.reserves?HT.reserves:[]);
  const nonRes=roster.filter(r=>!reserveIds.has(r.id));
  let p = nonRes.find(r=>!used.has(r.id) && pref.includes((r.pos||'').toUpperCase()));
  if(!p) p = nonRes.find(r=>!used.has(r.id) && posFamily(r.pos)===slotFamily(slot));
  if(!p) p = nonRes.find(r=>!used.has(r.id));
  if(!p) p = roster.find(r=>!used.has(r.id)); // fallback to any player
  if(p) used.add(p.id);
  return p;
}
let SELECTED_HOME_SLOT='ST';
function initHomeSlots(preserveExisting=false){
  if(!HT) return;
  const roster=getHomeRosterOrdered();
  const slots=Object.keys(FORMATIONS[activeHomeFormation].coords);
  const prev = preserveExisting ? {...HOME_SLOT_ASSIGN} : {};
  const newAssign={};
  const used=new Set();

  // 1) keep exact preferred fits from previous formation
  slots.forEach(slot=>{
    const pid=prev[slot];
    const pl=roster.find(r=>r.id===pid);
    if(pl && !used.has(pid) && (preferredPositionsForSlot(slot).includes((pl.pos||'').toUpperCase()) || posFamily(pl.pos)===slotFamily(slot))){
      newAssign[slot]=pid; used.add(pid);
    }
  });
  // 2) fill remaining slots from same family players in previous assignment
  slots.forEach(slot=>{
    if(newAssign[slot]) return;
    const candidate = Object.values(prev).map(pid=>roster.find(r=>r.id===pid)).find(pl=>pl && !used.has(pl.id) && posFamily(pl.pos)===slotFamily(slot));
    if(candidate){ newAssign[slot]=candidate.id; used.add(candidate.id); }
  });
  // 3) fill all remaining by roster order and slot prefs
  slots.forEach(slot=>{
    if(newAssign[slot]) return;
    const pl=pickRosterPlayer(roster,used,slot);
    newAssign[slot]=pl?pl.id:null;
  });
  HOME_SLOT_ASSIGN=newAssign;
  if(!slots.includes(SELECTED_HOME_SLOT)) SELECTED_HOME_SLOT=slots.includes('ST')?'ST':slots[0];
}
function assignPlayerToSlot(slot,pid){
  if(!HT || !slot) return;
  const pl=getHomeRosterOrdered().find(r=>r.id===pid);
  // GK can only go in GK slot; non-GK cannot go in GK slot
  if(slot==='GK' && pl && pl.pos!=='GK') return;
  if(slot!=='GK' && pl && pl.pos==='GK') return;
  // Remove from any other starter slot
  const otherSlot=Object.keys(HOME_SLOT_ASSIGN).find(s=>s!==slot && HOME_SLOT_ASSIGN[s]===pid);
  const prev=HOME_SLOT_ASSIGN[slot];
  if(otherSlot) HOME_SLOT_ASSIGN[otherSlot]=prev||null;
  // Remove from reserves too — no clones
  const resIdx=HOME_RESERVES.indexOf(pid);
  if(resIdx!==-1){ HOME_RESERVES[resIdx]=prev||null; }
  HOME_SLOT_ASSIGN[slot]=pid;
  buildFormationMenu();
  if(CAR.active)crSave();
}
function autoPickHomeTeam(){ initHomeSlots(false); buildFormationMenu(); }
function resetHomeTeamMenu(){ activeHomeFormation='4-3-3'; HOME_RESERVES=[null,null,null,null,null,null]; initHomeSlots(false); SELECTED_HOME_SLOT='ST'; buildFormationMenu(); }
function buildBenchList(){
  const bench=document.getElementById('benchList');
  const benchTitle=document.getElementById('benchTitle');
  if(!bench || !HT) return;
  const roster=getHomeRosterOrdered();
  bench.innerHTML='';
  if(!SELECTED_HOME_SLOT){
    benchTitle.textContent='Select a slot on the pitch';
    return;
  }
  benchTitle.textContent=displayPosLabel(SELECTED_HOME_SLOT)+' · '+HT.name.toUpperCase();
  const currentId=HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT];
  const pref=preferredPositionsForSlot(SELECTED_HOME_SLOT);
  const scored=roster.map(pl=>{
    let score=0;
    if(pl.id===currentId) score+=500;
    if(pref.includes((pl.pos||'').toUpperCase())) score+=200;
    if(posFamily(pl.pos)===slotFamily(SELECTED_HOME_SLOT)) score+=120;
    score += (pl.tec||0)+(pl.def||0)+(pl.pwr||0)+(pl.spd||0)/10;
    return {pl,score};
  }).sort((a,b)=>b.score-a.score);
  scored.forEach(({pl})=>{
    const assignedSlot = Object.keys(HOME_SLOT_ASSIGN).find(s=>HOME_SLOT_ASSIGN[s]===pl.id);
    const inReserve=HOME_RESERVES.includes(pl.id);
    const item=document.createElement('div');
    item.className='tm-bench-item'+(pl.id===currentId?' active':'');
    const face=buildFaceEl(pl,'tm-bench-jersey');
    const main=document.createElement('div'); main.className='tm-bench-main';
    const nm=document.createElement('div'); nm.className='tm-bench-name'; nm.textContent=pl.name;
    const meta=document.createElement('div'); meta.className='tm-bench-meta';
    let metaTxt=(assignedSlot?('IN '+displayPosLabel(assignedSlot)):inReserve?'IN RESERVES':'AVAILABLE')+' · '+posFamily(pl.pos);
    if(pl.morale!==undefined){
      const m=pl.morale||70;
      const emoji=m>=85?'😄':m>=70?'🙂':m>=50?'😐':m>=30?'😕':'😠';
      metaTxt+=' · '+emoji+(pl.injured?' INJ':pl.suspended?' SUS':'');
    }
    meta.textContent=metaTxt;
    main.appendChild(nm); main.appendChild(meta);
    const stats=document.createElement('div'); stats.className='tm-bench-stats';
    stats.innerHTML='SPD '+gs(pl,'spd')+'<br>PAS '+gs(pl,'pas');
    item.appendChild(face); item.appendChild(main); item.appendChild(stats);
    item.onclick=()=>assignPlayerToSlot(SELECTED_HOME_SLOT, pl.id);
    bench.appendChild(item);
  });
}
function updateSelectedSlotPanel(){
  const selectedLabel=document.getElementById('selectedSlotLabel');
  const selectedRole=document.getElementById('selectedSlotRole');
  const selectedPlayer=document.getElementById('selectedSlotPlayer');
  if(!selectedLabel)return;
  const selPlayerObj=getHomeRosterOrdered().find(r=>r.id===HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT]);
  selectedLabel.textContent=displayPosLabel(SELECTED_HOME_SLOT);
  selectedRole.textContent=slotFamily(SELECTED_HOME_SLOT);
  selectedPlayer.textContent=selPlayerObj?selPlayerObj.name+' ('+selPlayerObj.pos+')':'Select player';
  // Update card highlight without rebuilding
  document.querySelectorAll('#teamPreviewField .tm-card.v6').forEach(c=>{
    c.classList.toggle('selected', c.dataset.slot===SELECTED_HOME_SLOT);
  });
  buildBenchList();
}

// Full teardown when leaving mid-match / returning to main menu.
// Kills timers, clears squads, clears pending career match, stops animations.
function exitToMenu(){
  try{clearInterval(G.mt);clearInterval(G.di);cancelAnimationFrame(raf);}catch(e){}
  if(G){G.phase='idle';G.paused=false;G.mt=null;G.di=null;G.pm=false;G.kickoffUntil=0;G.goalGen=(G.goalGen||0)+1;}
  if(typeof closeDuel==='function')closeDuel();
  hSq={};aSq={};PP={h:{},a:{}};PT={h:{},a:{}};
  if(typeof trail!=='undefined')trail=[];
  // Reset pause overlay if visible
  const po=document.getElementById('pause-overlay');if(po)po.style.display='none';
  const pb=document.getElementById('pauseBtn');if(pb){pb.textContent='⏸';pb.classList.remove('paused');}
  const ph=document.getElementById('passhint');if(ph)ph.style.display='none';
  // Abandon career match without saving the score (counts as not played)
  if(CAR.pendingMatch){CAR.pendingMatch=null;}
  // Clear roster/team-editor state so a fresh friendly match doesn't inherit career squads
  HOME_SLOT_ASSIGN={};HOME_RESERVES=[null,null,null,null,null,null];
  G_teamEditorOrigin=null;
  stopMatchMusic&&stopMatchMusic();
  showSc('s-home');
}

// Dynamic back from the team editor — route to career hub if in career mode.
function teamEditorBack(){
  // Only route to career hub when this team-editor session was opened from career.
  if(G_teamEditorOrigin==='career'){
    CAR.formation=activeHomeFormation;
    if(T[CAR.myClub])T[CAR.myClub].formation=activeHomeFormation;
    crSave();
    CAR.pendingMatch=null;
    G_teamEditorOrigin=null;
    showSc('s-career-hub');
    if(typeof crRenderHub==='function')crRenderHub();
    return;
  }
  G_teamEditorOrigin=null;
  showSc('s-ts');
}
let G_teamEditorOrigin=null;

function openTeamMenu(){
  if(!selHome||!selAway||selHome===selAway)return;
  // Use team's preferred formation if defined
  if(HT&&HT.formation&&FORMATIONS[HT.formation]) activeHomeFormation=HT.formation;
  // Reset reserves
  HOME_RESERVES=[null,null,null,null,null,null];
  if(HT&&HT.reserves&&HT.reserves.length){
    const roster=HT.p;
    const gkReserves=HT.reserves.filter(pid=>{const pl=roster.find(r=>r.id===pid);return pl&&pl.pos==='GK';});
    const fieldReserves=HT.reserves.filter(pid=>{const pl=roster.find(r=>r.id===pid);return !pl||pl.pos!=='GK';});
    if(gkReserves.length) HOME_RESERVES[0]=gkReserves[0];
    fieldReserves.forEach((pid,i)=>{ if(i<5) HOME_RESERVES[i+1]=pid; });
  }
  initHomeSlots(true);
  buildFormationMenu();
  // Show loading screen while portraits preload, then show team editor
  showSc('s-loading');
  // Kick off image loading for all roster players (both teams)
  const allPlayers=[];
  [HT,AT].forEach(t=>{if(t&&t.p)t.p.forEach(pl=>allPlayers.push(pl));});
  allPlayers.forEach(pl=>playerImg(pl));
  // Poll for completion: check IMG_CACHE entries for each player
  const cacheKeyFor=(pl)=>{
    if(!pl)return null;
    if(pl.clubKey){const ln=playerLastName(pl)||'';return'cr_'+ln+'_'+pl.clubKey;}
    return playerLastName(pl);
  };
  const keys=allPlayers.map(cacheKeyFor).filter(Boolean);
  const allResolved=()=>keys.every(k=>{const c=IMG_CACHE[k];return c&&c!=='loading'&&c!=='loading2';});
  if(!keys.length||allResolved()){showSc('s-team');[200,600].forEach(t=>setTimeout(buildFormationMenu,t));}
  else{
    let done=false;
    const finish=()=>{if(done)return;done=true;showSc('s-team');[200,600].forEach(t=>setTimeout(buildFormationMenu,t));};
    const poll=setInterval(()=>{if(allResolved()){clearInterval(poll);finish();}},120);
    setTimeout(()=>{clearInterval(poll);finish();},4000); // 4s safety
  }
  [200,600].forEach(t=>setTimeout(buildFormationMenu,t));
}
function startGame(){
  if(!selHome||!selAway||!HT||!AT||selHome===selAway)return;
  // If we started this flow outside career mode (or pending match is stale), clear it
  if(!CAR.active||!CAR.pendingMatch||(CAR.pendingMatch.home!==selHome&&CAR.pendingMatch.home!==selAway&&CAR.pendingMatch.away!==selHome&&CAR.pendingMatch.away!==selAway)){
    CAR.pendingMatch=null;
  }
  hSq={};aSq={};
  const roster=HT.p.slice();
  const used=new Set();
  Object.keys(FORMATIONS[activeHomeFormation].coords).forEach(slot=>{
    const pid=HOME_SLOT_ASSIGN[slot];
    let pl=roster.find(r=>r.id===pid && !used.has(r.id));
    if(!pl) pl=roster.find(r=>!used.has(r.id));
    if(pl){ used.add(pl.id); hSq[slot]={...pl,spirit:(pl.pos==="GK"?2000:1500),cooldownUntil:0,slot:slot}; }
  });
  // Build away squad — exclude reserves, avoid overwriting slots
  const awayReserveIds=new Set(AT.reserves||[]);
  const awayStarters=AT.p.filter(p=>!awayReserveIds.has(p.id));
  const awayUsed=new Set();
  ['GK','LB','CB1','CB2','RB','CM1','CM2','CM3','LW','ST','RW'].forEach(slot=>{
    let pl=awayStarters.find(p=>!awayUsed.has(p.id)&&(p.pos===slot||(slot==='CB1'&&p.pos==='CB')||(slot==='CB2'&&p.pos==='CB')));
    if(!pl)pl=awayStarters.find(p=>!awayUsed.has(p.id)&&posFamily(p.pos)===slotFamily(slot));
    if(!pl)pl=awayStarters.find(p=>!awayUsed.has(p.id));
    if(pl){awayUsed.add(pl.id);aSq[slot]={...pl,spirit:(pl.pos==='GK'?2000:1500),cooldownUntil:0,slot};}
  });
  document.getElementById('htn').textContent=HT.name;
  document.getElementById('atn').textContent=AT.name;
  setTeamEmblem(document.getElementById('h-flag-hud'), selHome, HT.flag);
  setTeamEmblem(document.getElementById('a-flag-hud'), selAway, AT.flag);
  showSc('s-loading');
  setTimeout(initMatch, 1200);
}

const CV=document.getElementById('C');const cx=CV.getContext('2d');
let W=0,H=0,PP={h:{},a:{}},PT={h:{},a:{}},ball={x:0,y:0,tx:0,ty:0},trail=[];
const CR=17,CDms=2500,CS=()=>W*.00023,DS=()=>W*.00030,IR=()=>W*.022,PC=()=>W*.08;
const MAX_CARRIER_STEP=()=>Math.max(0.25,W*.00048); // carrier — slow deliberate movement
const MAX_DEF_STEP=()=>Math.max(0.35,W*.00072);     // engager — slightly faster than carrier
const MAX_OFFBALL_STEP=()=>Math.max(0.3,W*.0007);  // off-ball
function moveTowards(cur,targetX,targetY,ease,maxStep){
  const dx=targetX-cur.x,dy=targetY-cur.y;
  const d=Math.hypot(dx,dy);
  if(d<0.5){cur.x=targetX;cur.y=targetY;return;}
  // Constant speed — no acceleration ramp
  const step=Math.min(maxStep,d);
  cur.x+=(dx/d)*step;
  cur.y+=(dy/d)*step;
}

// Elite movement using player SPD stat — natural speed variation
// Robben (SPD 92) visibly faster than a CB (SPD 64) off-ball
// moveElite replaced by glide() inside moveOffBall

// rsz defined below in fullscreen block
function sq(s){return s==='h'?hSq:aSq;}
function ocd(s,k){const p=sq(s)[k];return p&&Date.now()<(p.cooldownUntil||0);}
function cdf(s,k){const p=sq(s)[k];if(!p||!p.cooldownUntil)return 0;return Math.max(0,(p.cooldownUntil-Date.now())/CDms);}
function scd(s,k){const p=sq(s)[k];if(p)p.cooldownUntil=Date.now()+CDms;}
function iPos(){
  ['h','a'].forEach(s=>{const q=sq(s);PP[s]={};PT[s]={};
    POS.forEach(({k})=>{if(!q[k])return;const p=fp(k,s==='h'?'home':'away',G.half);PP[s][k]={x:p.x*W,y:p.y*H};PT[s][k]={x:p.x*W,y:p.y*H};});
  });ball={x:W/2,y:H/2,tx:W/2,ty:H/2};trail=[];
}
let G={half:1,tL:2400,hG:0,aG:0,poss:'h',ck:null,chk:null,mom:50,duels:0,shots:0,hP:0,tP:0,phase:'idle',mt:null,di:null,D:{},pm:false,kickoffUntil:0,goalGen:0};
function setC(k,s){G.poss=s;G.ck=k;G.tP++;if(s==='h')G.hP++;updP();updH();}
// ═══════════════════════════════════════════════════════════════
// MOVEMENT ENGINE v2 — Possession State Machine
// Based on CT Dream Team reverse spec:
// - Ball carrier is the ONLY real actor
// - Roles assigned each possession change: primary engager, cover, support runners, shape holders
// - Only 4 players move dynamically; rest lerp slowly to formation
// - Lane-based progression, not free coordinate simulation
// ═══════════════════════════════════════════════════════════════


// Tactical lanes (normalized Y positions)
const LANES={FAR_LEFT:.12,LEFT:.28,CENTER_LEFT:.38,CENTER:.50,CENTER_RIGHT:.62,RIGHT:.72,FAR_RIGHT:.88};
const LANE_KEYS=['FAR_LEFT','LEFT','CENTER_LEFT','CENTER','CENTER_RIGHT','RIGHT','FAR_RIGHT'];
const ZONES={DEF:0.22,MID:0.5,ATT:0.78};

let ROLES={engager:null,cover:null,blocker:null,runner1:null,runner2:null};

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function dirFor(side){return ((side==='h')===(G.half===1))?1:-1;}
function goalXFor(side){return dirFor(side)>0?W*.93:W*.07;}
function ownGoalXFor(side){return dirFor(side)>0?W*.07:W*.93;}
function progressFor(side,p){return dirFor(side)>0?(p.x/W):(1-p.x/W);}
function getBehaviorProfile(pl){return {...DEFAULT_BEHAVIOR_PROFILE,...((pl&&pl.behavior)||{})};}
function possessionStage(side,cp){
  const prog=cp?progressFor(side,cp):0;
  if(prog<ENGINE_CONFIG.stages.buildUp)return 'buildUp';
  if(prog<ENGINE_CONFIG.stages.advance)return 'advance';
  if(prog<ENGINE_CONFIG.stages.threat)return 'threat';
  return 'finish';
}
function laneValueByKey(k){return LANES[k]??LANES.CENTER;}
function laneKeyForY(y){
  const n=clamp(y/H,0,1);
  let best='CENTER',bestD=Infinity;
  for(const key of LANE_KEYS){
    const d=Math.abs(laneValueByKey(key)-n);
    if(d<bestD){bestD=d;best=key;}
  }
  return best;
}
function zoneForX(side,x){
  const prog=dirFor(side)>0?(x/W):(1-x/W);
  if(prog<.28)return 'def';
  if(prog<.62)return 'mid';
  return 'att';
}
function validOutfieldKeys(side){
  return Object.keys(sq(side)).filter(k=>sq(side)[k]&&k!=='GK'&&PP[side][k]);
}
function nearestDefenderDistance(side,p,ignoreGK=true){
  const other=side==='h'?'a':'h';
  let best=Infinity;
  Object.keys(sq(other)).forEach(k=>{
    if(!sq(other)[k]||!PP[other][k])return;
    if(ignoreGK&&k==='GK')return;
    const d=Math.hypot(PP[other][k].x-p.x,PP[other][k].y-p.y);
    if(d<best)best=d;
  });
  return best===Infinity?W*.4:best;
}
function openPassLaneScore(side,fromKey,toKey){
  const from=PP[side][fromKey],to=PP[side][toKey];
  if(!from||!to)return -999;
  const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
  if(len<W*.05)return -999;
  const nx=dx/len,ny=dy/len;
  const other=side==='h'?'a':'h';
  let pressure=0;
  Object.keys(sq(other)).forEach(k=>{
    if(!sq(other)[k]||k==='GK'||!PP[other][k])return;
    const op=PP[other][k];
    const t=((op.x-from.x)*nx+(op.y-from.y)*ny)/len;
    if(t<=0||t>=1)return;
    const cx=from.x+dx*t,cy=from.y+dy*t;
    const d=Math.hypot(op.x-cx,op.y-cy);
    pressure+=clamp(1-d/(W*.09),0,1);
  });
  const progBoost=(progressFor(side,to)-progressFor(side,from))*2.2;
  const spacing=clamp(nearestDefenderDistance(side,to)/(W*.18),0,2);
  return progBoost+spacing-pressure;
}

function bestTeammateFor(side,carrierKey,mode='pass'){
  const ks=validOutfieldKeys(side).filter(k=>k!==carrierKey&&!ocd(side,k));
  if(!ks.length)return null;
  let best=null,bestScore=-Infinity;
  const carrier=PP[side][carrierKey];
  const carrierPl=sq(side)[carrierKey];
  const carrierBh=getBehaviorProfile(carrierPl);
  const riskTolerance=clamp(0.92 + ((carrierBh.passBias||1)-1)*0.55 + ((carrierBh.pressResistance||1)-1)*0.25,0.75,1.25);
  ks.forEach(k=>{
    const p=PP[side][k];if(!p)return;
    const pl=sq(side)[k];
    const bh=getBehaviorProfile(pl);
    let score=openPassLaneScore(side,carrierKey,k)*riskTolerance;
    const prog=progressFor(side,p);
    score+=prog*2.6;
    score+=zo(k)==='att'?1.2:zo(k)==='mid'?.7:.25;
    const d=Math.hypot(carrier.x-p.x,carrier.y-p.y);
    if(mode==='one-two'){
      score-=Math.abs(d-W*.16)/(W*.08);
      score*= (carrierBh.oneTwoBias||1)*0.55 + (bh.oneTwoBias||1)*0.45;
    }else{
      score-=Math.abs(d-W*.22)/(W*.16)*.5;
      score*= 0.9 + ((carrierBh.passBias||1)-1)*0.35;
    }
    if(zo(k)==='att') score*= 0.96 + ((bh.shootBias||1)-1)*0.22;
    if(k==='LW'||k==='RW') score*= 0.96 + ((bh.wideRunBias||1)-1)*0.35;
    if(isOffside(side,k))score-=5;
    if(score>bestScore){bestScore=score;best=k;}
  });
  return best;
}
function roleScoreDefender(side,key,cp,type){
  const p=PP[side][key];if(!p)return -1e9;
  const dir=dirFor(side==='h'?'a':'h');
  const goalX=ownGoalXFor(side);
  const goalside = dir>0 ? (p.x<=cp.x?1:0) : (p.x>=cp.x?1:0);
  const laneDiff=Math.abs(laneValueByKey(laneKeyForY(p.y))-laneValueByKey(laneKeyForY(cp.y)));
  const d=dist(p,cp);
  const centralBias=1-Math.abs(p.y/H-.5);
  const shotDanger=1-Math.abs(cp.y/H-.5);
  if(type==='engager')return 4.2-(d/(W*.12))+goalside*1.6-laneDiff*2.4-(ocd(side,key)?5:0);
  if(type==='cover')return 3.8-goalside*-.8-(Math.abs((goalX+p.x)/2-cp.x)/(W*.18))+centralBias*.8-laneDiff*1.4-(d/(W*.24));
  return 3.5+shotDanger*1.3+centralBias*1.1-(Math.abs(p.x-goalX)/(W*.20))-laneDiff*1.6-(d/(W*.35));
}

function roleScoreRunner(side,key,cp,slot){
  const p=PP[side][key];if(!p)return -1e9;
  const prog=progressFor(side,p);
  const carrierProg=progressFor(side,cp);
  const spacing=nearestDefenderDistance(side,p)/(W*.12);
  const width=1-Math.abs((p.y/H)-.5);
  const bh=getBehaviorProfile(sq(side)[key]);
  let score=prog*3.2+spacing*1.4;
  if(slot===1){
    score-=Math.abs(prog-(carrierProg+.18))*3.4;
    score+=zo(key)==='att'?1.2:.4;
    score*=0.95 + ((bh.shootBias||1)-1)*0.25;
    score*=0.96 + ((bh.dribbleBias||1)-1)*0.15;
  }else{
    score-=Math.abs(prog-(carrierProg+.08))*2.1;
    score+=(width<.55?1.1:.3);
    score*=0.94 + ((bh.wideRunBias||1)-1)*0.45;
    score*=0.98 + ((bh.passBias||1)-1)*0.18;
  }
  return score-(ocd(side,key)?4:0);
}

let _lastPoss=null; // track possession side for full role reset
function assignRoles(){
  const s=G.poss,ds=s==='h'?'a':'h';
  const cp=PP[s][G.ck];
  if(!cp){ROLES={engager:null,cover:null,blocker:null,runner1:null,runner2:null};_lastPoss=null;return;}

  const possChanged = _lastPoss!==s;
  _lastPoss=s;

  // ── ALWAYS reassign engager — must chase current carrier ──────
  const defKeys=validOutfieldKeys(ds).filter(k=>!ocd(ds,k));
  const used=new Set();
  const pickDef=(type)=>{
    let best=null,bestScore=-Infinity;
    defKeys.forEach(k=>{
      if(used.has(k))return;
      const score=roleScoreDefender(ds,k,cp,type);
      if(score>bestScore){bestScore=score;best=k;}
    });
    if(best)used.add(best);
    return best;
  };
  ROLES.engager=pickDef('engager');
  used.add(ROLES.engager);

  // ── Only reassign cover/blocker/runners if possession changed ─
  // Between passes on the same team, keep roles stable — no chaos
  if(possChanged){
    ROLES.cover=pickDef('cover');
    ROLES.blocker=pickDef('blocker');
    const atkKeys=validOutfieldKeys(s).filter(k=>k!==G.ck&&!ocd(s,k));
    let r1=null,r2=null,b1=-Infinity,b2=-Infinity;
    atkKeys.forEach(k=>{const sc=roleScoreRunner(s,k,cp,1);if(sc>b1){b1=sc;r1=k;}});
    atkKeys.forEach(k=>{if(k===r1)return;const sc=roleScoreRunner(s,k,cp,2);if(sc>b2){b2=sc;r2=k;}});
    ROLES.runner1=r1;ROLES.runner2=r2;
  } else {
    // Validate existing roles — if player is on cooldown, reassign just that role
    if(ROLES.cover&&ocd(ds,ROLES.cover)) ROLES.cover=pickDef('cover');
    else if(ROLES.cover) used.add(ROLES.cover);
    if(ROLES.blocker&&ocd(ds,ROLES.blocker)) ROLES.blocker=pickDef('blocker');

    // Keep same runners unless they're the new carrier or on cooldown
    const atkKeys=validOutfieldKeys(s).filter(k=>k!==G.ck&&!ocd(s,k));
    if(!ROLES.runner1||ROLES.runner1===G.ck||ocd(s,ROLES.runner1)||!atkKeys.includes(ROLES.runner1)){
      let best=null,bestS=-Infinity;
      atkKeys.forEach(k=>{if(k===ROLES.runner2)return;const sc=roleScoreRunner(s,k,cp,1);if(sc>bestS){bestS=sc;best=k;}});
      ROLES.runner1=best;
    }
    if(!ROLES.runner2||ROLES.runner2===G.ck||ocd(s,ROLES.runner2)||!atkKeys.includes(ROLES.runner2)){
      let best=null,bestS=-Infinity;
      atkKeys.forEach(k=>{if(k===ROLES.runner1)return;const sc=roleScoreRunner(s,k,cp,2);if(sc>bestS){bestS=sc;best=k;}});
      ROLES.runner2=best;
    }
  }
  G.chk=ROLES.engager;
}

function carrierAdvanceVector(side,cp){
  const dir=dirFor(side);
  const goalX=goalXFor(side);
  let tx=goalX,ty=cp.y;
  const carrier=sq(side)[G.ck];
  const bh=getBehaviorProfile(carrier);
  const stage=possessionStage(side,cp);
  if(G_moveTarget&&side==='h'){
    // Manual target: go exactly where player clicked, no lane correction
    tx=clamp(G_moveTarget.x,W*.01,W*.99);
    ty=clamp(G_moveTarget.y,H*.03,H*.97);
  }else{
    const defDist=nearestDefenderDistance(side,cp);
    const pressure=clamp(1-defDist/(W*(ENGINE_CONFIG.ai.pressureRadius)),0,1);
    const lanY=(side==='h'&&G_laneTarget!==null)?G_laneTarget:cp.y;
    const stageLaneBlend=stage==='buildUp'?0.04:stage==='advance'?0.08:0.10;
    ty=lerp(cp.y,lanY,stageLaneBlend);
    const widthLean=(bh.wideRunBias||1)-1;
    if(side!=='h'&&Math.abs(widthLean)>0.05){
      const targetWidth=cp.y<H/2?H*.15:H*.85;
      ty=lerp(ty,targetWidth,Math.min(Math.abs(widthLean)*0.25,0.18));
    }
    const forwardFactor=stage==='buildUp'?0.35:stage==='advance'?0.50:stage==='threat'?0.65:0.80;
    const _prog=progressFor(side,cp);
    const _nearBand=Object.values(GRID.bands).some(b=>Math.abs(b-_prog)<GRID.encounterWidth);
    const _bandSlow=_nearBand?0.55:1.0;
    tx=cp.x+dir*(W*.032*forwardFactor*_bandSlow)*(1-pressure*0.45*(2-(bh.pressResistance||1)));
  }
  const clampedTx=clamp(tx,W*.01,W*.99);
  const clampedTy=clamp(ty,H*.03,H*.97);
  return {x:clampedTx-cp.x, y:clampedTy-cp.y};
}

function tick(dt=1){
  const s=G.poss,ds=s==='h'?'a':'h';
  const cp=PP[s][G.ck];if(!cp)return;
  const dir=dirFor(s);

  const mv=carrierAdvanceVector(s,cp);
  const cs=MAX_CARRIER_STEP()*dt;
  cp.x=clamp(cp.x+clamp(mv.x*dt,-cs,cs),W*.01,W*.99);
  cp.y=clamp(cp.y+clamp(mv.y*dt,-cs,cs),H*.03,H*.97);
  if(G_moveTarget&&Math.hypot(cp.x-G_moveTarget.x,cp.y-G_moveTarget.y)<W*.03)G_moveTarget=null;
  ball.tx=cp.x;ball.ty=cp.y;

  // Passive stamina drain while carrying + regen for everyone else
  if(G.phase==='moving'){
    const carrier2=sq(s)[G.ck];
    if(carrier2&&carrier2.pos!=='GK'){
      const engClose=ROLES.engager&&PP[ds][ROLES.engager]&&dist(cp,PP[ds][ROLES.engager])<IR()*2.2;
      carrier2.spirit=Math.max(0,(carrier2.spirit||1500)-(engClose?0.55:0.18));
    }
    ['h','a'].forEach(side=>{
      Object.entries(sq(side)).forEach(([k,pl])=>{
        if(!pl||pl.pos==='GK')return;
        if(side===s&&k===G.ck)return;
        const maxSp=1500;
        if((pl.spirit||maxSp)<maxSp) pl.spirit=Math.min(maxSp,(pl.spirit||0)+0.12);
      });
    });
  }

  // Looming defender alert
  updateLoomingAlert();

  // Canvas zoom
  updateZoom();

  // Action input window check (0.6s grace before duel)
  checkDuelGrace();

  const progress=progressFor(s,cp);
  const centrality=1-Math.abs(cp.y/H-.5);
  const shotGate=progress>.88 && centrality>.35;
  if(shotGate&&G.phase==='moving'&&Date.now()>=(G.kickoffUntil||0)&&!G._scoringGoal){
    G.phase='pass_anim';
    clearInterval(G.di);
    const _gkPos2=PP[ds]&&PP[ds]['GK']?PP[ds]['GK']:{x:goalXFor(s),y:H*.5};
    G._shotTrail=true;
    animateBallTo(cp.x,cp.y,_gkPos2.x,_gkPos2.y,()=>{G._shotTrail=false;G.phase='idle';opDuel(true);},45);
    return;
  }

  if(ROLES.engager&&!ocd(ds,ROLES.engager)){
    const dp=PP[ds][ROLES.engager];
    if(dp){
      // Reassign engager if current one is too far and a closer defender is available
      const currentDist=Math.hypot(dp.x-cp.x,dp.y-cp.y);
      if(currentDist>W*0.18){
        let closestK=null,closestD=currentDist*0.75; // must be notably closer
        Object.keys(sq(ds)).forEach(k=>{
          if(!sq(ds)[k]||k==='GK'||k===ROLES.engager||ocd(ds,k)||!PP[ds][k])return;
          const d=Math.hypot(PP[ds][k].x-cp.x,PP[ds][k].y-cp.y);
          if(d<closestD){closestD=d;closestK=k;}
        });
        if(closestK){ROLES.engager=closestK;G.chk=closestK;}
      }
    }
    const dp2=PP[ds][ROLES.engager];
    if(dp2){
      const targetX=cp.x-dir*W*.01;
      const targetY=cp.y;
      const dx=targetX-dp2.x,dy=targetY-dp2.y;
      const dd=Math.hypot(dx,dy)||1;
      const pressMult=(G.pressing&&ds==='h')?1.5:1.0;
      const step=MAX_DEF_STEP()*pressMult*dt;
      dp2.x=clamp(dp2.x+(dx/dd)*step,W*.01,W*.99);
      dp2.y=clamp(dp2.y+(dy/dd)*step,H*.03,H*.97);
      if(Date.now()>=(G.kickoffUntil||0) && dist(dp2,cp)<IR()){G.chk=ROLES.engager;opDuel(false);return;}
    }
  }
  // PRESS: second player (cover) also sprints toward carrier
  if(G.pressing&&ds==='h'&&ROLES.cover&&!ocd('h',ROLES.cover)){
    const dp2=PP.h[ROLES.cover];
    if(dp2){
      const dx=cp.x-dp2.x,dy=cp.y-dp2.y;
      const dd=Math.hypot(dx,dy)||1;
      const step=MAX_DEF_STEP()*0.80*dt;
      dp2.x=clamp(dp2.x+(dx/dd)*step,W*.01,W*.99);
      dp2.y=clamp(dp2.y+(dy/dd)*step,H*.03,H*.97);
    }
  }

  // Any defender within tackle range also triggers duel — prevents carrier running through defenders
  if(Date.now()>=(G.kickoffUntil||0)){
    const defQ=sq(ds);
    for(const k of Object.keys(defQ)){
      if(!defQ[k]||k===ROLES.engager||k==='GK'||ocd(ds,k))continue;
      const dp=PP[ds][k];if(!dp)continue;
      if(dist(dp,cp)<IR()*1.05){
        ROLES.engager=k;G.chk=k;
        opDuel(false);return;
      }
    }
  }

  moveOffBall(s,ds,dt);
  applyRepulsion();
}

function moveOffBall(s,ds,dt=1){
  const cp=PP[s][G.ck]; if(!cp)return;
  const dir=dirFor(s);
  const carrierProg=progressFor(s,cp);
  const threatLevel=clamp((carrierProg-.30)/.45,0,1);

  // Speeds
  const DRIFT_SPEED   = W * 0.00020 * dt;
  const ROLE_SPEED    = W * 0.00034 * dt;
  const SUPPORT_SPEED = W * 0.00042 * dt;
  const STRIKER_SPEED = W * 0.00058 * dt;
  const TRACK_SPEED   = W * 0.00048 * dt;
  function spdMult(pl){return pl?clamp(0.60+(gs(pl,'spd')-60)*0.010,0.70,1.30):1.0;}
  function glide(cur,tx,ty,spd,pl){
    const dx=tx-cur.x,dy=ty-cur.y;
    const d=Math.hypot(dx,dy);
    if(d<1)return;
    const step=Math.min(spd*(pl?spdMult(pl):1.0),d);
    cur.x+=(dx/d)*step;cur.y+=(dy/d)*step;
  }
  // Helper: "ahead of carrier" means further toward opponent's goal than carrier.
  // dir>0 means attacking to the right (higher X), dir<0 to the left.
  function aheadOf(carrierX, offset){return carrierX + dir*offset;}

  const attGoalX = goalXFor(s);
  const ownGoalX = ownGoalXFor(s);
  const halfwayX = W*0.5;

  // ── ATTACKING TEAM ────────────────────────────────────────────
  Object.keys(sq(s)).forEach(k=>{
    if(!sq(s)[k]||k===G.ck||!PP[s][k])return;
    const cur=PP[s][k];
    const p=fp(k,s==='h'?'home':'away',G.half);
    const pl=sq(s)[k];

    // GK — pinned to own goal line
    if(k==='GK'){
      const gkPinX=dir>0?Math.min(p.x*W,W*.072):Math.max(p.x*W,W*.928);
      const gkPinY=clamp(p.y*H+(cp.y-H*.5)*0.04,H*.15,H*.85);
      cur.x=lerp(cur.x,gkPinX,0.08); cur.y=lerp(cur.y,gkPinY,0.06);
      if(dir>0&&cur.x>W*.09)cur.x=W*.072;
      if(dir<0&&cur.x<W*.91)cur.x=W*.928;
      return;
    }

    // Cooling down — return to formation position
    if(ocd(s,k)){glide(cur,p.x*W,p.y*H,DRIFT_SPEED*0.6,pl);return;}

    const zone=zo(k);
    const isStriker=k==='ST';
    const isWinger=k==='LW'||k==='RW';
    const isForward=isStriker||isWinger;
    const isMid=zone==='mid';
    const isDef=zone==='def';

    // ── FORWARDS: stay AHEAD of the carrier, stretching the defensive line
    if(isForward){
      let tx,ty=p.y*H; // keep horizontal lane from formation
      if(isStriker){
        // Striker leads the line — pushes high when carrier advances
        const offset = carrierProg<0.4 ? W*0.14 : carrierProg<0.7 ? W*0.22 : W*0.28;
        tx = aheadOf(cp.x, offset);
        tx = dir>0 ? clamp(tx, halfwayX, W*0.92) : clamp(tx, W*0.08, halfwayX);
        // When carrier is in final third, make a diagonal run into the box
        if(carrierProg>0.65){
          ty = lerp(p.y*H, H*0.5, 0.25);
          tx = dir>0 ? clamp(tx, W*0.70, W*0.90) : clamp(tx, W*0.10, W*0.30);
        }
      } else {
        // Wingers stay wide, run parallel to carrier or slightly ahead
        const offset = carrierProg<0.4 ? W*0.06 : W*0.14;
        tx = aheadOf(cp.x, offset);
        tx = dir>0 ? clamp(tx, W*0.35, W*0.93) : clamp(tx, W*0.07, W*0.65);
        // Hold the wide lane — don't drift to center
        ty = p.y*H;
      }
      const spd = k===ROLES.runner1||k===ROLES.runner2 ? STRIKER_SPEED : SUPPORT_SPEED*0.9;
      glide(cur,tx,ty,spd,pl);
      return;
    }

    // ── MIDFIELDERS: support lanes, one drops deep as outlet
    if(isMid){
      // Runner roles: supporting run ahead of carrier
      if(k===ROLES.runner1||k===ROLES.runner2){
        const offset = k===ROLES.runner1 ? W*0.12 : W*0.08;
        const tx = aheadOf(cp.x, offset);
        const ty = lerp(p.y*H, cp.y, 0.25);
        glide(cur, dir>0?clamp(tx,W*.15,W*.85):clamp(tx,W*.15,W*.85), ty, SUPPORT_SPEED, pl);
        return;
      }
      // Holding mid — stay slightly behind carrier as an outlet (e.g. CM1)
      if(k==='CM1'){
        const tx = cp.x - dir*W*0.10;
        const ty = lerp(p.y*H, H*0.5, 0.15);
        glide(cur, dir>0?clamp(tx,W*.10,W*.75):clamp(tx,W*.25,W*.90), ty, DRIFT_SPEED*1.4, pl);
        return;
      }
      // Other mids: hold shape, drift slightly with play
      const baseProgress = clamp(carrierProg - 0.15, 0.30, 0.60);
      const tx = (dir>0 ? baseProgress : 1-baseProgress) * W;
      const ty = p.y*H;
      glide(cur,clamp(tx,W*.20,W*.80),ty,DRIFT_SPEED,pl);
      return;
    }

    // ── DEFENDERS: hold the line, don't push beyond halfway
    if(isDef){
      // Fullback overlap ONLY if carrier is on same side in final third
      const isLB=k==='LB', isRB=k==='RB';
      const sameSide = (isLB && cp.y<H*0.45) || (isRB && cp.y>H*0.55);
      if((isLB||isRB) && carrierProg>0.70 && sameSide && Math.random()<0.3){
        // Overlap run
        const tx = aheadOf(cp.x, W*0.06);
        const ty = p.y*H;
        glide(cur,dir>0?clamp(tx,W*.40,W*.85):clamp(tx,W*.15,W*.60),ty,SUPPORT_SPEED*0.85,pl);
        return;
      }
      // Normal: hold defensive line based on carrier progress, never past halfway
      const lineProg = clamp(carrierProg - 0.35, 0.08, 0.42);
      const tx = (dir>0 ? lineProg : 1-lineProg) * W;
      const cap = dir>0 ? W*0.48 : W*0.52;
      const final = dir>0 ? Math.min(tx, cap) : Math.max(tx, cap);
      const ty = p.y*H;
      glide(cur,final,ty,DRIFT_SPEED*1.2,pl);
      return;
    }
  });

  // ── DEFENDING TEAM ────────────────────────────────────────────
  const ddir = dirFor(ds); // defenders attack the OTHER way
  const assignedDefs=new Set([ROLES.engager,ROLES.cover,ROLES.blocker]);
  const freeAtk=validOutfieldKeys(s).filter(k=>k!==G.ck);

  // Build marker map — each free defender marks nearest free attacker
  const markerMap={};
  const usedAtk=new Set();
  Object.keys(sq(ds)).forEach(k=>{
    if(!sq(ds)[k]||assignedDefs.has(k)||k==='GK'||!PP[ds][k])return;
    let bestA=null,bestD=Infinity;
    freeAtk.forEach(ak=>{
      if(!PP[s][ak]||usedAtk.has(ak))return;
      const d=dist(PP[ds][k],PP[s][ak]);
      if(d<bestD){bestD=d;bestA=ak;}
    });
    if(bestA){markerMap[k]=bestA;usedAtk.add(bestA);}
  });

  Object.keys(sq(ds)).forEach(k=>{
    if(!sq(ds)[k]||!PP[ds][k])return;
    if(k===ROLES.engager)return; // handled in tick()
    const cur=PP[ds][k];
    const p=fp(k,ds==='h'?'home':'away',G.half);
    const pl=sq(ds)[k];

    // GK
    if(k==='GK'){
      const gkBase=ddir>0?Math.min(p.x*W,W*.072):Math.max(p.x*W,W*.928);
      const gkY=clamp(p.y*H+(cp.y-H*.5)*0.06,H*.12,H*.88);
      cur.x=lerp(cur.x,gkBase,0.08); cur.y=lerp(cur.y,gkY,0.06);
      if(ddir>0&&cur.x>W*.09)cur.x=W*.072;
      if(ddir<0&&cur.x<W*.91)cur.x=W*.928;
      return;
    }

    if(ocd(ds,k)){glide(cur,p.x*W,p.y*H,DRIFT_SPEED*0.6,pl);return;}

    // Cover — sits between carrier and own goal, second line of defense
    if(k===ROLES.cover){
      const dgx=ownGoalXFor(ds);
      const tx=clamp(lerp(cp.x,dgx,0.35),W*.04,W*.96);
      const ty=lerp(p.y*H,cp.y,0.35);
      glide(cur,tx,ty,ROLE_SPEED*1.1,pl);
      return;
    }

    // Blocker — cuts passing lane to the most dangerous attacker
    if(k===ROLES.blocker){
      const dgx=ownGoalXFor(ds);
      // Find most dangerous attacker (closest to defensive goal)
      let threat=null, bestProg=-1;
      freeAtk.forEach(ak=>{
        if(!PP[s][ak])return;
        const prog=progressFor(s,PP[s][ak]);
        if(prog>bestProg){bestProg=prog;threat=ak;}
      });
      if(threat&&PP[s][threat]){
        const tp=PP[s][threat];
        // Position between ball and threat
        const tx = lerp(cp.x, tp.x, 0.55);
        const ty = lerp(cp.y, tp.y, 0.55);
        glide(cur,tx,ty,ROLE_SPEED*1.0,pl);
      } else {
        const tx=clamp(lerp(cp.x,dgx,0.55),W*.04,W*.96);
        const ty=lerp(H*.5,cp.y,0.25);
        glide(cur,tx,ty,ROLE_SPEED*0.9,pl);
      }
      return;
    }

    // Markers — goal-side of their man, BUT if carrier is nearby and dangerous, track carrier instead
    if(markerMap[k]){
      const tgt=PP[s][markerMap[k]];
      if(tgt){
        const dgx=ownGoalXFor(ds);
        // Swap to carrier tracking if: (a) carrier is progress>0.55 AND (b) I'm closer to carrier than my marker
        const distToCarrier=Math.hypot(cur.x-cp.x,cur.y-cp.y);
        const distToMarker=Math.hypot(cur.x-tgt.x,cur.y-tgt.y);
        const threatClose = carrierProg>0.55 && distToCarrier<distToMarker*1.15;
        if(threatClose){
          // Track the carrier's projected forward path
          const ahead = dir>0 ? 1 : -1; // attacker direction
          const predictX = cp.x + ahead*W*0.03;
          const tx = lerp(predictX,dgx,0.15);
          const ty = lerp(cp.y,H*0.5,0.10);
          glide(cur,tx,ty,TRACK_SPEED*1.15,pl);
          return;
        }
        // Stay goal-side of the attacker
        const goalSideBias = 0.18 + threatLevel*0.12;
        const tx=lerp(tgt.x,dgx,goalSideBias);
        const ty=lerp(tgt.y,H*0.5,0.08);
        glide(cur,tx,ty,TRACK_SPEED*0.9,pl);
        return;
      }
    }

    // Unmarked — shift with play into defensive shape
    const zone=zo(k);
    let tx=p.x*W, ty=p.y*H;
    if(zone==='def'){
      // Defensive line compacts toward carrier side, never past halfway
      const lineProg = clamp(carrierProg - 0.20, 0.08, 0.38);
      tx = (ddir>0 ? lineProg : 1-lineProg) * W;
      // Ball-side shift
      ty = lerp(p.y*H, cp.y, 0.18);
      const cap = ddir>0 ? W*0.48 : W*0.52;
      tx = ddir>0 ? Math.min(tx,cap) : Math.max(tx,cap);
    } else if(zone==='mid'){
      // Midfield line drops if carrier in their half
      const lineProg = clamp(carrierProg - 0.05, 0.28, 0.62);
      tx = (ddir>0 ? lineProg : 1-lineProg) * W;
      ty = lerp(p.y*H, cp.y, 0.12);
    } else {
      // Forwards press-check: drop to mid if carrier is in their own half
      if(carrierProg<0.35){
        const pressProg = 0.35;
        tx = (ddir>0 ? pressProg : 1-pressProg) * W;
      } else {
        tx = p.x*W;
      }
    }
    glide(cur,clamp(tx,W*.06,W*.94),clamp(ty,H*.05,H*.95),DRIFT_SPEED*1.3,pl);
  });
}


// ── REPULSION — prevent teammates bunching into clumps ────────────────────
function applyRepulsion(){
  const REPEL_DIST=W*.055;
  const REPEL_FORCE=0.28;
  ['h','a'].forEach(side=>{
    const keys=Object.keys(sq(side)).filter(k=>sq(side)[k]&&PP[side][k]);
    for(let i=0;i<keys.length;i++){
      for(let j=i+1;j<keys.length;j++){
        const a=PP[side][keys[i]],b=PP[side][keys[j]];
        const dx=b.x-a.x,dy=b.y-a.y;
        const d=Math.hypot(dx,dy)||0.1;
        if(d<REPEL_DIST){
          const force=(REPEL_DIST-d)/REPEL_DIST*REPEL_FORCE;
          const nx=dx/d,ny=dy/d;
          if(keys[i]!==G.ck){a.x-=nx*force;a.y-=ny*force;}
          if(keys[j]!==G.ck){b.x+=nx*force;b.y+=ny*force;}
        }
      }
    }
  });
}

function pickCarrierAfterWin(side,winnerKey){
  const q=sq(side);
  if(winnerKey&&q[winnerKey]&&!ocd(side,winnerKey))return winnerKey;
  const ks=validOutfieldKeys(side).filter(k=>!ocd(side,k));
  if(!ks.length)return Object.keys(q).find(k=>q[k]&&k!=='GK')||'CM2';
  let best=ks[0],bestScore=-Infinity;
  ks.forEach(k=>{
    const p=PP[side][k];if(!p)return;
    const score=progressFor(side,p)*3 + nearestDefenderDistance(side,p)/(W*.15) + (zo(k)==='mid'?0.5:zo(k)==='att'?1:0);
    if(score>bestScore){bestScore=score;best=k;}
  });
  return best;
}

function asnC(){assignRoles();}

let raf=null;
let _lastFrameTs=0;
function startAnim(){
  cancelAnimationFrame(raf);
  _lastFrameTs=0;
  (function loop(ts){
    const dt=_lastFrameTs?Math.min((ts-_lastFrameTs)/16.667,3):1;
    _lastFrameTs=ts;
    if(G.paused){draw();raf=requestAnimationFrame(loop);return;}
    if(G.phase==='moving')tick(dt);
    if(G.phase==='pass_anim'){tickBallTravel(dt);tickPassMotion();}
    if(G.phase==='moving'&&G.ck&&PP[G.poss]&&PP[G.poss][G.ck]){
      const _cp=PP[G.poss][G.ck];
      const _dir=dirFor(G.poss);
      const _off=IR()*0.55;
      ball.x=_cp.x+_dir*_off;ball.y=_cp.y;
      ball.tx=ball.x;ball.ty=ball.y;
    }else{
      ball.x+=(ball.tx-ball.x)*Math.min(.18*dt,1);
      ball.y+=(ball.ty-ball.y)*Math.min(.18*dt,1);
    }
    trail.push({x:ball.x,y:ball.y,a:.6});
    if(trail.length>24)trail.shift();
    trail.forEach(t=>t.a*=.88);
    draw();raf=requestAnimationFrame(loop);
  })(0);
}

// ── PERSPECTIVE TRANSFORMS (module scope — used by draw + drawT) ──
// ── PITCH BOUNDS within the field image ───────────────────────
// Measured from white line detection on field.png
// Players are remapped from normalized 0..1 coords into these bounds
// Pitch boundaries measured precisely from field.png (2000×1120px)
// Green area: x=113..1880, y=268..1005
const PB={
  x0: 0.060,
  x1: 0.940,
  y0: 0.120,
  y1: 0.850,
};
// Map a flat canvas coord (0..W, 0..H) into the pitch image area
function pitchX(x){ return (PB.x0 + (x/W)*(PB.x1-PB.x0))*W; }
function pitchY(y){ return (PB.y0 + (y/H)*(PB.y1-PB.y0))*H; }

// ── PERSPECTIVE (subtle tilt matching field.png) ──────────────
const PERSP=0.06;
function perspY(y){
  const py=pitchY(y);
  const t=py/H;
  return H*(t+PERSP*t*(1-t)*0.5)/(1+PERSP*0.5*0.25);
}
function perspX(x,y){
  const px=pitchX(x), py=pitchY(y);
  const t=py/H;
  return W/2+(px-W/2)*(0.96+t*0.04);
}
function perspScale(y){
  const t=pitchY(y)/H;
  return 0.82+t*0.18;
}
function pLine(x1,y1,x2,y2){
  cx.beginPath();
  cx.moveTo(perspX(x1,y1),perspY(y1));
  cx.lineTo(perspX(x2,y2),perspY(y2));
  cx.stroke();
}

// Preload field image
const FIELD_IMG=new Image();
FIELD_IMG.src='assets/pitch/field.png';

function drawTacticalOverlays(){
  if(!G.ck||!PP[G.poss]||!PP[G.poss][G.ck])return;
  const cp=PP[G.poss][G.ck];
  const dir=dirFor(G.poss);
  const prog=progressFor(G.poss,cp);
  const bandNames=['buildUp','advance','threat','final'];
  const bandLabels=['BUILD-UP','ADVANCE','THREAT ZONE','FINAL THIRD'];
  const bandColors=['rgba(40,180,255,','rgba(255,200,40,','rgba(255,120,30,','rgba(255,40,40,'];
  for(let i=0;i<bandNames.length;i++){
    const bProg=GRID.bands[bandNames[i]];
    const distToBand=bProg-prog;
    if(distToBand>0&&distToBand<GRID.encounterWidth*2.0){
      const bandX=dir>0?bProg*W:(1-bProg)*W;
      const ew=GRID.encounterWidth*W*0.9;
      const col=bandColors[i];
      const grad=cx.createLinearGradient(bandX-ew,0,bandX+ew,0);
      grad.addColorStop(0,col+'0)');
      grad.addColorStop(0.4,col+'0.15)');
      grad.addColorStop(0.5,col+'0.25)');
      grad.addColorStop(0.6,col+'0.15)');
      grad.addColorStop(1,col+'0)');
      cx.fillStyle=grad;
      cx.fillRect(bandX-ew,0,ew*2,H);
      cx.save();
      cx.setLineDash([5,5]);
      cx.strokeStyle=col+'0.50)';
      cx.lineWidth=1.5;
      cx.beginPath();cx.moveTo(bandX,H*.08);cx.lineTo(bandX,H*.92);cx.stroke();
      cx.setLineDash([]);
      cx.font='bold 9px Orbitron,monospace';
      cx.textAlign='center';
      cx.fillStyle=col+'0.75)';
      cx.fillText(bandLabels[i],bandX,H*.07);
      cx.restore();
      break;
    }
  }
}

function draw(){
  cx.clearRect(0,0,W,H);
  // Draw field image — all markings baked in
  if(FIELD_IMG.complete&&FIELD_IMG.naturalWidth>0){
    cx.drawImage(FIELD_IMG,0,0,W,H);
  }else{
    cx.fillStyle='#1a4020';cx.fillRect(0,0,W,H);
  }
  // Zoom in on carrier when defender closes — cinematic CT feel
  const _zcp=G.ck&&PP[G.poss]?PP[G.poss][G.ck]:null;
  const _zx=_zcp?perspX(_zcp.x,_zcp.y):W/2, _zy=_zcp?perspY(_zcp.y):H/2;
  if(G_zoom>1.005){cx.save();cx.translate(_zx,_zy);cx.scale(G_zoom,G_zoom);cx.translate(-_zx,-_zy);}

    if(G_zoom>1.005){cx.restore();}
  // ── MOVE TARGET INDICATOR ──────────────────────────────────
  if(G_moveTarget&&G.poss==='h'&&G.phase==='moving'){
    const tx=perspX(G_moveTarget.x,G_moveTarget.y),ty=perspY(G_moveTarget.y);
    cx.beginPath();cx.arc(tx,ty,10,0,Math.PI*2);
    cx.strokeStyle='rgba(40,130,240,.7)';cx.lineWidth=2;cx.setLineDash([4,3]);cx.stroke();cx.setLineDash([]);
    cx.beginPath();cx.arc(tx,ty,3,0,Math.PI*2);cx.fillStyle='rgba(40,130,240,.9)';cx.fill();
  }

  drawTacticalOverlays();

  // ── PLAYERS & BALL use perspective coords ─────────────────
  drawT('a');drawT('h');

  // Ball shadow
  const bpx=perspX(ball.x,ball.y),bpy=perspY(ball.y);
  const bsc=perspScale(ball.y);
  cx.beginPath();cx.ellipse(bpx,bpy+6*bsc,11*bsc,6*bsc,0,0,Math.PI*2);
  cx.fillStyle='rgba(0,0,0,.35)';cx.fill();

  // Shot glow — energy trail behind ball during shot animation
  if(G._shotTrail){
    // Expanding speed lines radiating behind ball direction
    const trailLen=trail.length;
    trail.forEach((t,i)=>{
      const tsc=perspScale(t.y);
      const age=i/Math.max(trailLen,1);
      // Outer glow ring
      cx.beginPath();cx.arc(perspX(t.x,t.y),perspY(t.y),14*tsc*(1-age*.4),0,Math.PI*2);
      cx.fillStyle=`rgba(255,120,30,${t.a*.55*(1-age*.5)})`;cx.fill();
      // Inner hot core
      cx.beginPath();cx.arc(perspX(t.x,t.y),perspY(t.y),6*tsc,0,Math.PI*2);
      cx.fillStyle=`rgba(255,240,80,${t.a*.9})`;cx.fill();
    });
    // Ball itself glows hot during shot
    cx.shadowColor='rgba(255,100,0,1)';cx.shadowBlur=40;
    cx.beginPath();cx.arc(bpx,bpy,13*bsc,0,Math.PI*2);
    cx.fillStyle='#fff';cx.fill();
    cx.strokeStyle='rgba(255,140,0,1)';cx.lineWidth=3;cx.stroke();cx.shadowBlur=0;
    cx.beginPath();cx.arc(bpx,bpy,4*bsc,0,Math.PI*2);cx.fillStyle='#ff6010';cx.fill();
  } else {
    // Normal ball
    cx.shadowColor='rgba(255,215,60,1)';cx.shadowBlur=22;
    cx.beginPath();cx.arc(bpx,bpy,12*bsc,0,Math.PI*2);
    cx.fillStyle='#fff';cx.fill();
    cx.strokeStyle='rgba(240,192,64,.95)';cx.lineWidth=2.5;cx.stroke();cx.shadowBlur=0;
    cx.beginPath();cx.arc(bpx,bpy,3*bsc,0,Math.PI*2);cx.fillStyle='#444';cx.fill();
  }

  // Trail (always drawn)
  trail.forEach(t=>{
    const tsc=perspScale(t.y);
    cx.beginPath();cx.arc(perspX(t.x,t.y),perspY(t.y),4*tsc,0,Math.PI*2);
    cx.fillStyle=`rgba(255,215,60,${t.a*.5})`;cx.fill();
  });
}

// ── PLAYER IMAGE CACHE ────────────────────────────────────────────
// Images live in assets/players/{lastname}.png
// Call playerImg(pl) to get cached Image object (or null if not loaded yet)
// Add a PNG to assets/players/ and it auto-appears — no code changes needed.
const IMG_CACHE={};  // key: lastname → Image | 'err'

// Career portrait cache: tries assets/career/clubs/{lastname}{clubkey}.png
// then falls back to assets/career/clubs/{clubkey}.png
const CR_IMG_CACHE={};

function crPortraitUrl(pl,clubKey){
  if(!pl||!clubKey)return null;
  const lastName=pl.name?pl.name.split('.').pop().toLowerCase().trim().replace(/[^a-z0-9]/g,''):'';
  const specific=`assets/career/clubs/${lastName}${clubKey}.png`;
  const fallback=`assets/career/clubs/${clubKey}.png`;
  return{specific,fallback};
}

function crLoadPortrait(pl,clubKey,onLoad){
  const cacheKey=(clubKey||'')+'_'+(pl?.id||'');
  if(CR_IMG_CACHE[cacheKey]){if(onLoad&&CR_IMG_CACHE[cacheKey]!=='loading')onLoad(CR_IMG_CACHE[cacheKey]);return CR_IMG_CACHE[cacheKey]==='loading'?null:CR_IMG_CACHE[cacheKey];}
  const urls=crPortraitUrl(pl,clubKey);
  if(!urls)return null;
  CR_IMG_CACHE[cacheKey]='loading';
  const img=new Image();
  img.onload=()=>{CR_IMG_CACHE[cacheKey]=img;if(onLoad)onLoad(img);};
  img.onerror=()=>{
    // try club fallback
    const fb=new Image();
    fb.onload=()=>{CR_IMG_CACHE[cacheKey]=fb;if(onLoad)onLoad(fb);};
    fb.onerror=()=>{CR_IMG_CACHE[cacheKey]='err';if(onLoad)onLoad(null);};
    fb.src=urls.fallback;
  };
  img.src=urls.specific;
  return null;
}

// Minimal SVG placeholder for career player portraits (used as final fallback).
function crPlayerSvg(pl,clubKey,size=38){
  const club=(clubKey&&CR_CLUBS[clubKey])||{colors:['#1a2a4a','#2a4a7a']};
  const c1=club.colors[0]||'#1a2a4a',c2=club.colors[1]||'#2a4a7a';
  return `<svg width="${size}" height="${size}" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="38" rx="5" fill="${c1}"/><rect y="24" width="38" height="14" fill="${c2}"/><circle cx="19" cy="18" r="7" fill="#e8a87c"/></svg>`;
}

// Returns an <img> tag with src=specific, onerror fallback to club, then SVG
function crPortraitHtml(pl,clubKey,size=38){
  if(!pl||!clubKey)return crPlayerSvg(pl,clubKey,size);
  const lastName=pl.name?pl.name.split('.').pop().toLowerCase().trim().replace(/[^a-z0-9]/g,''):'';
  const specific=`assets/career/clubs/${lastName}${clubKey}.png`;
  const fallback=`assets/career/clubs/${clubKey}.png`;
  const svgFallback=crPlayerSvg(pl,clubKey,size).replace(/'/g,"\\'").replace(/"/g,'&quot;');
  return `<img src="${specific}" width="${size}" height="${size}" style="object-fit:cover;object-position:top center;border-radius:inherit;" `+
    `onerror="if(this.src.includes('${lastName}${clubKey}')){this.src='${fallback}';}else{this.outerHTML='${svgFallback}';}">`;
}

function playerLastName(pl){
  if(!pl||!pl.name)return null;
  return pl.name.split('.').pop().toLowerCase().trim();
}

function playerImg(pl){
  if(!pl)return null;
  // Career players: try assets/career/clubs/{lastname}{clubkey}.png → {clubkey}.png → gk.png (GK only)
  if(pl.clubKey){
    const ln=playerLastName(pl)||'';
    const ck=pl.clubKey;
    const key='cr_'+ln+'_'+ck;
    const cached=IMG_CACHE[key];
    if(cached && cached!=='err' && cached!=='loading' && cached!=='loading2')return cached;
    if(cached==='err'){
      // exhausted specific+club, try generic GK
      if(pl.pos==='GK'){
        const gk='career_gk';
        const gkC=IMG_CACHE[gk];
        if(gkC && gkC!=='err' && gkC!=='loading')return gkC;
        if(!gkC){
          IMG_CACHE[gk]='loading';
          const gi=new Image();
          gi.onload=()=>{IMG_CACHE[gk]=gi;};
          gi.onerror=()=>{IMG_CACHE[gk]='err';};
          gi.src='assets/career/clubs/gk.png';
        }
      }
      return null;
    }
    if(!cached){
      // Start loading specific; onerror → try club fallback; onerror of that → 'err'
      IMG_CACHE[key]='loading';
      const img=new Image();
      img.onload=()=>{IMG_CACHE[key]=img;};
      img.onerror=()=>{
        IMG_CACHE[key]='loading2';
        const fb=new Image();
        fb.onload=()=>{IMG_CACHE[key]=fb;};
        fb.onerror=()=>{IMG_CACHE[key]='err';};
        fb.src=`assets/career/clubs/${ck}.png`;
      };
      img.src=`assets/career/clubs/${ln}${ck}.png`;
    }
    return null;
  }
  // Friendly/national players: assets/players/{lastname}.png
  const key=playerLastName(pl);
  if(!key)return null;
  if(IMG_CACHE[key]==='err')return null;
  if(IMG_CACHE[key])return IMG_CACHE[key]==='loading'?null:IMG_CACHE[key];
  IMG_CACHE[key]='loading';
  const img=new Image();
  img.onload=()=>{IMG_CACHE[key]=img;};
  img.onerror=()=>{IMG_CACHE[key]='err';};
  img.src=`assets/players/${key}.png`;
  return null;
}

// Pre-warm cache for all players in both squads so images are ready before duel
function preloadSquadImages(){
  [...Object.values(hSq),...Object.values(aSq)].forEach(pl=>playerImg(pl));
}

const JERSEY={GK:1,LB:3,CB1:5,CB2:6,RB:2,CM1:8,CM2:4,CM3:6,LW:11,ST:9,RW:7};
function jerseyNum(k,s){const pl=sq(s||'h')[k];return (pl&&pl.jersey)||JERSEY[k]||'?';}

function drawT(s){
  const fill=s==='h'?'#1258b0':'#b81616';const brd=s==='h'?'#2882f0':'#f03030';
  const q=sq(s);
  Object.entries(q).forEach(([k,pl])=>{
    if(!pl)return;const p=PP[s][k];if(!p)return;
    const iC=G.poss===s&&G.ck===k;const iCh=G.poss!==s&&G.chk===k;
    const px=perspX(p.x,p.y), py=perspY(p.y);
    const sc=perspScale(p.y);
    const r=(CR+(iC?4:0))*sc;
    const isGK=pl.pos==='GK';

    if(isGK){
      // GK: rounded square icon — distinct from field players
      const hw=r*1.05; // half-width of square
      const rnd=r*0.28; // corner radius
      cx.beginPath();
      cx.roundRect(px-hw,py-hw,hw*2,hw*2,rnd);
      cx.fillStyle=fill;
      if(iC){cx.fill();cx.lineWidth=3*sc;cx.strokeStyle='#ffd54a';}
      else{cx.globalAlpha=iCh?.7:1;cx.fill();cx.lineWidth=2.5*sc;cx.strokeStyle='#ffdd00';}
      cx.stroke();cx.globalAlpha=1;
      // GK label
      const img=playerImg(pl);
      if(img&&img.complete&&img.naturalWidth>0){
        cx.save();
        cx.beginPath();cx.roundRect(px-hw+sc,py-hw+sc,hw*2-sc*2,hw*2-sc*2,rnd*0.8);cx.clip();
        cx.drawImage(img,px-hw,py-hw,hw*2,hw*2);
        cx.restore();
        cx.beginPath();cx.roundRect(px-hw,py-hw,hw*2,hw*2,rnd);
        cx.lineWidth=iC?3*sc:2.5*sc;cx.strokeStyle=iC?'#ffd54a':'#ffdd00';cx.stroke();
      }else{
        cx.fillStyle='#fff';
        cx.font=`bold ${Math.round(10*sc)}px Orbitron,sans-serif`;
        cx.textAlign='center';cx.textBaseline='middle';
        cx.fillText('GK',px,py+sc);
      }
    }else{
      // Field player: circle
      cx.beginPath();cx.arc(px,py,r,0,Math.PI*2);
      cx.fillStyle=fill;
      if(iC){cx.globalAlpha=1;cx.fill();cx.lineWidth=3*sc;cx.strokeStyle='#ffd54a';}
      else{cx.globalAlpha=iCh?.7:1;cx.fill();cx.lineWidth=2*sc;cx.strokeStyle=brd;}
      cx.stroke();cx.globalAlpha=1;

      // Role rings
      if(k===ROLES.runner1||k===ROLES.runner2){
        cx.beginPath();cx.arc(px,py,r+7*sc,0,Math.PI*2);
        cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=1.2*sc;cx.stroke();
      }
      if(k===ROLES.cover||k===ROLES.blocker){
        cx.beginPath();cx.arc(px,py,r+5*sc,0,Math.PI*2);
        cx.strokeStyle='rgba(255,255,255,.12)';cx.lineWidth=sc;cx.stroke();
      }

      // Face image or jersey number
      const img=playerImg(pl);
      if(img&&img.complete&&img.naturalWidth>0){
        cx.save();
        cx.beginPath();cx.arc(px,py,r-sc,0,Math.PI*2);cx.clip();
        const d=r*2;
        cx.drawImage(img,px-r,py-r,d,d);
        cx.restore();
        cx.beginPath();cx.arc(px,py,r,0,Math.PI*2);
        cx.lineWidth=iC?3*sc:2*sc;cx.strokeStyle=iC?'#ffd54a':brd;cx.stroke();
      } else if(pl.clubKey){
        // Career mode: try club badge image
        const badgeKey='badge_'+pl.clubKey;
        if(!IMG_CACHE[badgeKey]){
          IMG_CACHE[badgeKey]='loading';
          const bi=new Image();
          bi.onload=()=>{IMG_CACHE[badgeKey]=bi;};
          bi.onerror=()=>{IMG_CACHE[badgeKey]='err';};
          bi.src=`assets/career/clubs/${pl.clubKey}.png`;
        }
        const badge=IMG_CACHE[badgeKey];
        if(badge&&badge!=='err'&&badge!=='loading'&&badge.complete&&badge.naturalWidth>0){
          cx.save();
          cx.beginPath();cx.arc(px,py,r-sc,0,Math.PI*2);cx.clip();
          cx.drawImage(badge,px-r,py-r,r*2,r*2);
          cx.restore();
          cx.beginPath();cx.arc(px,py,r,0,Math.PI*2);
          cx.lineWidth=iC?3*sc:2*sc;cx.strokeStyle=iC?'#ffd54a':brd;cx.stroke();
        } else {
          cx.fillStyle=iC?'#06080e':'#fff';
          cx.font=`bold ${Math.round((iC?13:12)*sc)}px Orbitron,sans-serif`;
          cx.textAlign='center';cx.textBaseline='middle';
          cx.fillText(jerseyNum(k,s),px,py+sc);
        }
      } else {
        cx.fillStyle=iC?'#06080e':'#fff';
        cx.font=`bold ${Math.round((iC?13:12)*sc)}px Orbitron,sans-serif`;
        cx.textAlign='center';cx.textBaseline='middle';
        cx.fillText(jerseyNum(k,s),px,py+sc);
      }
    }

    // Spirit arc — always shown for both GK and field players
    const _maxSp=pl.pos==='GK'?2000:1500;
    const _spArc=Math.max(0,Math.min(1,(pl.spirit||_maxSp)/_maxSp));
    if(_spArc<0.98){
      cx.beginPath();
      cx.arc(px,py,r+(isGK?5:3.5)*sc,-Math.PI/2,-Math.PI/2+_spArc*Math.PI*2);
      cx.strokeStyle=_spArc>0.5?'rgba(68,200,255,0.9)':_spArc>0.25?'rgba(240,192,64,0.9)':'rgba(220,32,32,0.9)';
      cx.lineWidth=2.5*sc;cx.stroke();
    }
  });
}

let G_moveTarget=null;
let G_laneTarget=null;
function manualShot(){
  if(G.poss!=='h'||G.phase!=='moving'||!G.ck||G._scoringGoal)return;
  G_moveTarget=null;
  const _cpM=PP.h[G.ck]; if(!_cpM)return;
  const _gkPosM=PP.a&&PP.a['GK']?PP.a['GK']:{x:goalXFor('h'),y:H*.5};
  G.phase='pass_anim'; clearInterval(G.di);
  G._shotTrail=true;
  shakeScreen(4,60);
  animateBallTo(_cpM.x,_cpM.y,_gkPosM.x,_gkPosM.y,()=>{
    G._shotTrail=false; G.phase='idle'; opDuel(true);
  },45);
}
function togglePress(){
  if(G.poss==='h'){say('Win the ball first to press!');return;}
  G.pressing=!G.pressing;
  const btn=document.getElementById('pressBtn');
  if(btn){btn.classList.toggle('active',G.pressing);btn.textContent=G.pressing?'PRESS ⚡':'PRESS';}
  say(G.pressing?'High press ON — closing down!':'Press off.');
}
function togglePassMode(){ if(G.poss!=='h'||G.phase!=='moving'||!G.ck) return; G.pm=!G.pm; document.getElementById('pass-banner').style.display=G.pm?'block':'none'; document.getElementById('pass-banner').textContent='PASS MODE — CLICK A PLAYER'; if(G.pm) say('Pass mode enabled.'); }

// Unified canvas input — handles both mouse click and touch tap
function handleCanvasInput(clientX, clientY){
  if(G.poss!=='h')return;
  const rect=CV.getBoundingClientRect();
  const mx=(clientX-rect.left)*(W/rect.width);
  const my=(clientY-rect.top)*(H/rect.height);

  if(G.pm){
    for(const k of Object.keys(hSq)){
      if(k===G.ck||!hSq[k])continue;const p=PP.h[k];if(!p)continue;
      const sx=perspX(p.x,p.y),sy=perspY(p.y);
      const sc=perspScale(p.y);
      if(Math.hypot(sx-mx,sy-my)<(CR+16)*sc){
        G.D.pk=k;G.pm=false;
        document.getElementById('pass-banner').style.display='none';
        document.getElementById('duel-ov').classList.add('show');
        chkRdy();say((G.D.ak==='one-two'?'Wall pass':'Pass')+' to '+hSq[k].name+' — GO!');return;
      }
    }
    return;
  }

  if(G.phase!=='moving')return;

  for(const k of Object.keys(hSq)){
    if(k===G.ck||!hSq[k])continue;const p=PP.h[k];if(!p)continue;
    const sx=perspX(p.x,p.y),sy=perspY(p.y);
    const sc=perspScale(p.y);
    if(Math.hypot(sx-mx,sy-my)<(CR+14)*sc){
      if(isOffside('h',k)){say('OFFSIDE! '+hSq[k].name+' is beyond the line.');return;}
      iPas(k);return;
    }
  }

  // Redirect carrier
  const gx=clamp((mx/W-PB.x0)/(PB.x1-PB.x0),0,1)*W;
  const gy=clamp((my/H-PB.y0)/(PB.y1-PB.y0),0,1)*H;
  G_moveTarget={x:gx,y:gy};G_laneTarget=gy;
  say('Carrier redirected.');
}

CV.addEventListener('click',e=>handleCanvasInput(e.clientX,e.clientY));
CV.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(e.touches.length===1){
    const t=e.touches[0];
    handleCanvasInput(t.clientX,t.clientY);
  }
},{passive:false});

function isOffside(side,receiverKey){
  const defSide=side==='h'?'a':'h';
  const receiver=PP[side][receiverKey], carrier=PP[side][G.ck]; if(!receiver||!carrier) return false;
  const dir=dirFor(side);
  const inOpponentHalf=dir>0?(receiver.x>W*.5):(receiver.x<W*.5);
  if(!inOpponentHalf) return false;
  const aheadOfBall = dir>0 ? receiver.x > carrier.x + W*.015 : receiver.x < carrier.x - W*.015;
  if(!aheadOfBall) return false;
  const defXs=Object.keys(sq(defSide)).filter(k=>sq(defSide)[k]&&PP[defSide][k]&&k!=='GK').map(k=>PP[defSide][k].x);
  if(defXs.length<2) return false;
  defXs.sort((a,b)=>a-b);
  const secondLast = dir>0 ? defXs[defXs.length-2] : defXs[1];
  const line = dir>0 ? Math.max(secondLast, carrier.x) : Math.min(secondLast, carrier.x);
  const buffer = W*0.012;
  return dir>0 ? receiver.x > line + buffer : receiver.x < line - buffer;
}

// Ball travel duration scales with distance so short passes feel snappy, long ones take time
function passDuration(fx,fy,tx,ty,base){
  const d=Math.hypot(tx-fx,ty-fy);
  return Math.round(clamp(base + (d/W)*90, base, base*3.5));
}
let ballTravel={active:false,fx:0,fy:0,tx:0,ty:0,progress:0,duration:60,onArrive:null};
function animateBallTo(fromX,fromY,toX,toY,onArrive,duration){ballTravel={active:true,fx:fromX,fy:fromY,tx:toX,ty:toY,progress:0,duration:duration||50,onArrive};G.phase='pass_anim';}
// Keep players moving during a pass — only ball travel is locked, not players
function tickPassMotion(){
  if(!G.poss)return;
  const s=G.poss,ds=s==='h'?'a':'h';
  // During pass: all players hold their current positions gently
  // They will reposition naturally once movement resumes
  Object.keys(sq(s)).forEach(k=>{
    if(!sq(s)[k]||k===G.ck||!PP[s][k])return;
    const cur=PP[s][k];const p=fp(k,s==='h'?'home':'away',G.half);
    if(k==='GK'){cur.x+=(p.x*W-cur.x)*.02;cur.y+=(p.y*H-cur.y)*.02;return;}
  });
  Object.keys(sq(ds)).forEach(k=>{
    if(!sq(ds)[k]||!PP[ds][k])return;
    const cur=PP[ds][k];const p=fp(k,ds==='h'?'home':'away',G.half);
    if(k==='GK'){cur.x+=(p.x*W-cur.x)*.02;cur.y+=(p.y*H-cur.y)*.02;return;}
  });
}

function tickBallTravel(dt=1){
  ballTravel.progress+=dt;
  const t=Math.min(1,ballTravel.progress/ballTravel.duration);
  const ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  ball.x=ballTravel.fx+(ballTravel.tx-ballTravel.fx)*ease;
  ball.y=ballTravel.fy+(ballTravel.ty-ballTravel.fy)*ease;
  ball.tx=ball.x;ball.ty=ball.y;
  if(t>=1){ballTravel.active=false;if(ballTravel.onArrive)ballTravel.onArrive();}
}

function iPas(tk){
  const side='h';
  const fr=hSq[G.ck],fp2=PP.h[G.ck],tp=PP.h[tk];if(!fp2||!tp)return;
  const intResult=chkIntOutcome(fp2,tp,'h');
  const ic=intResult.interceptor;
  if(ic){
    const outcome=intResult.outcome;
    const iPos=PP.a[ic]||tp;
    if(outcome==='deflect'){
      // Deflection — ball bounces to loose position between passer and interceptor
      const lx=lerp(fp2.x,iPos.x,0.5)+(Math.random()-.5)*W*.06;
      const ly=lerp(fp2.y,iPos.y,0.5)+(Math.random()-.5)*H*.06;
      say((fr?fr.name:'—')+' pass deflected by '+sq('a')[ic].name+'!');
      animateBallTo(fp2.x,fp2.y,lx,ly,()=>{
        let closestSide='h',closestKey=G.ck,closestDist=Infinity;
        ['h','a'].forEach(side=>{Object.keys(sq(side)).forEach(k=>{
          if(!sq(side)[k]||!PP[side][k])return;
          const d2=Math.hypot(PP[side][k].x-lx,PP[side][k].y-ly);
          if(d2<closestDist){closestDist=d2;closestSide=side;closestKey=k;}
        });});
        G.poss=closestSide;G.ck=closestKey;G.tP++;if(closestSide==='h')G.hP++;
        ball.x=lx;ball.y=ly;ball.tx=lx;ball.ty=ly;
        updP();G.phase='idle';
        setTimeout(()=>{asnC();G.phase='moving';if(closestSide==='h')document.getElementById('passhint').style.display='block';},200);
      },passDuration(fp2.x,fp2.y,lx,ly,24));
    }else{
      // Clean steal
      say((fr?fr.name:'—')+' pass cut by '+sq('a')[ic].name+'!');
      animateBallTo(fp2.x,fp2.y,iPos.x,iPos.y,()=>{
        G.poss='a';G.ck=ic;G.tP++;if(PP.a[ic]){ball.x=PP.a[ic].x;ball.y=PP.a[ic].y;ball.tx=ball.x;ball.ty=ball.y;}
        updP();G.phase='idle';
        setTimeout(()=>{asnC();G.phase='moving';},200);
      },passDuration(fp2.x,fp2.y,iPos.x,iPos.y,26));
    }
  } else {
    say((fr?fr.name:'—')+' → '+(hSq[tk]?hSq[tk].name:'—'));
    animateBallTo(fp2.x,fp2.y,tp.x,tp.y,()=>{
      setC(tk,'h'); ball.x=tp.x;ball.y=tp.y;ball.tx=tp.x;ball.ty=tp.y;
      G.phase='idle';
      setTimeout(()=>{asnC();G.phase='moving';if(G.poss==='h')document.getElementById('passhint').style.display='block';},120);
    },passDuration(fp2.x,fp2.y,tp.x,tp.y,28));
  }
}

// ── PASSIVE HELPERS ───────────────────────────────────────────

let G_loomingDef=null;
let G_duelGrace=null;
let G_zoom=1.0;

function updateLoomingAlert(){
  const ds=G.poss==='h'?'a':'h';
  if(G.phase!=='moving'||!ROLES.engager||!PP[ds][ROLES.engager]||!PP[G.poss][G.ck]){
    hideLoomingAlert();return;
  }
  const d=dist(PP[G.poss][G.ck],PP[ds][ROLES.engager]);
  if(d<IR()*2.2){
    const def=sq(ds)[ROLES.engager];
    if(def&&ROLES.engager!==G_loomingDef){
      G_loomingDef=ROLES.engager;
      const el=document.getElementById('looming-alert');
      if(el){
        const nm=def.name.split('.').pop();
        const lastName=playerLastName(def);
        const img=playerImg(def);
        el.innerHTML=(img&&img.complete&&img.naturalWidth>0)
          ?'<img src="assets/players/'+lastName+'.png" class="looming-face"><span>'+nm+'</span>'
          :'<span class="looming-icon">⚠</span><span>'+nm+'</span>';
        el.classList.add('show');
      }
    }
  }else{
    hideLoomingAlert();
  }
}
function hideLoomingAlert(){
  if(!G_loomingDef)return;
  G_loomingDef=null;
  const el=document.getElementById('looming-alert');
  if(el)el.classList.remove('show');
}

function checkDuelGrace(){
  if(G.phase!=='moving'||!ROLES.engager)return;
  const ds=G.poss==='h'?'a':'h';
  if(ocd(ds,ROLES.engager))return;
  const dp=PP[ds][ROLES.engager],cp=PP[G.poss][G.ck];
  if(!dp||!cp)return;
  const d=dist(dp,cp);
  if(d<IR()*1.6&&d>=IR()*1.0&&!G_duelGrace&&Date.now()>=(G.kickoffUntil||0)){
    G_duelGrace=setTimeout(()=>{
      G_duelGrace=null;
      if(G.phase==='moving'&&ROLES.engager&&PP[ds][ROLES.engager]){
        const d2=dist(PP[ds][ROLES.engager],PP[G.poss][G.ck]||{x:-9999,y:-9999});
        if(d2<IR()*1.8){G.chk=ROLES.engager;opDuel(false);}
      }
    },600);
  }else if(d>=IR()*1.8&&G_duelGrace){
    clearTimeout(G_duelGrace);G_duelGrace=null;
  }
}

function updateZoom(){
  if(G.phase!=='moving'||!G.ck||!PP[G.poss][G.ck]){G_zoom+=(1.0-G_zoom)*.08;return;}
  const d=nearestOpponentDist(G.poss,G.ck);
  const targetZoom=d<IR()*1.8?1.13:d<IR()*3?1.06:1.0;
  G_zoom+=(targetZoom-G_zoom)*.05;
}


function nearestOpponentDist(poss,carrierKey){
  const defSide=poss==='h'?'a':'h';
  const cp=PP[poss][carrierKey];if(!cp)return W*.3;
  let minD=Infinity;
  Object.keys(sq(defSide)).forEach(k=>{
    if(!sq(defSide)[k]||k==='GK'||ocd(defSide,k)||!PP[defSide][k])return;
    minD=Math.min(minD,Math.hypot(PP[defSide][k].x-cp.x,PP[defSide][k].y-cp.y));
  });
  return minD===Infinity?W*.3:minD;
}

// Three-outcome interception: steal | deflect | through
// Returns {interceptor: key|null, outcome: string}
function chkIntOutcome(fp2,tp,side){
  const defSide=side==='h'?'a':'h';
  const dx=tp.x-fp2.x,dy=tp.y-fp2.y,len=Math.hypot(dx,dy);
  if(len<W*0.07)return {interceptor:null,outcome:'through'};
  const nx=dx/len,ny=dy/len;
  const dir=dirFor(side);
  const isBackward=dir>0?(dx<-W*0.04):(dx>W*0.04);
  if(isBackward)return {interceptor:null,outcome:'through'};
  const cor=W*0.028;
  let best=null,bestDefPow=-1;
  Object.entries(sq(defSide)).forEach(([k,pl])=>{
    if(!pl||k==='GK'||ocd(defSide,k)||!PP[defSide][k])return;
    const ap=PP[defSide][k];
    const t2=((ap.x-fp2.x)*nx+(ap.y-fp2.y)*ny)/len;
    if(t2<0.10||t2>0.92)return;
    const cx2=fp2.x+t2*dx,cy2=fp2.y+t2*dy;
    const d=Math.hypot(ap.x-cx2,ap.y-cy2);
    if(d<cor){
      const defPow=gs(pl,'pas')*spiritMult(pl)*(1-d/cor);
      if(defPow>bestDefPow){bestDefPow=defPow;best=k;}
    }
  });
  if(!best)return {interceptor:null,outcome:'through'};
  const passer=sq(side)[G.ck];
  const atkPow=gs(passer,'pas')*spiritMult(passer)*(0.9+Math.random()*.2);
  const defPow=bestDefPow*(0.9+Math.random()*.2);
  const ratio=atkPow/(defPow||1);
  if(ratio>1.35)return {interceptor:null,outcome:'through'};   // Blow Away
  if(ratio<0.75)return {interceptor:best,outcome:'steal'};     // Clean Cut
  return {interceptor:best,outcome:'deflect'};                 // Deflection
}
// Legacy wrapper for backward compatibility
function chkInt(fp2,tp,pt){
  const r=chkIntOutcome(fp2,tp,G.poss);
  return r.interceptor;
}

function opDuel(isShot, committedAk){
  if(!isShot&&(G.phase==='duel'||G.phase==='duel_result'||G.phase==='pass_anim'))return;
  if(isShot){clearInterval(G.di);closeDuel();}
  G.phase='duel';G.pm=false;document.getElementById('passhint').style.display='none';document.getElementById('pass-banner').style.display='none';
  const as=G.poss,ds=as==='h'?'a':'h';
  const carrier=sq(as)[G.ck];const dk=isShot?'GK':(G.chk||Object.keys(sq(ds)).find(k=>sq(ds)[k]));
  const def=sq(ds)[dk];
  if(isShot&&!def){say('Shot blocked — no goalkeeper!');G.phase='moving';return;}
  // 2v1 detection — carrier faced by two defenders within tackle range (not for shots vs GK)
  let dk2=null;
  if(!isShot&&carrier&&PP[as][G.ck]){
    const cp=PP[as][G.ck];
    const defQ=sq(ds);
    const candidates=[];
    Object.keys(defQ).forEach(k=>{
      if(!defQ[k]||k===dk||k==='GK'||ocd(ds,k)||!PP[ds][k])return;
      const d=dist(PP[ds][k],cp);
      if(d<IR()*1.35) candidates.push({k,d});
    });
    candidates.sort((a,b)=>a.d-b.d);
    if(candidates.length){
      dk2=candidates[0].k;
      // Flag the second defender as engaged — blocks them from cooldown, shows the context
      const d2=defQ[dk2];if(d2)d2._pending2v1=true;
    }
  }
  // committedAk: shot already decided in field duel — attacker gets no second choice, no extra stamina cost
  G.D={carrier,def,dk,dk2,as,ds,isShot,ak:committedAk||null,pk:null,defA:null,is2v1:!!dk2,duelStage:1};
  const zL={gk:'BUILD-UP',def:'DEFENSIVE THIRD',mid:'MIDFIELD',att:'ATTACKING THIRD'};
  const z=isShot?'att':zo(G.ck);
  let zoneTxt=isShot?'GOAL ATTEMPT':(zL[z]||'DUEL');
  if(G.D.is2v1) zoneTxt='⚠ 2 vs 1 — '+zoneTxt;
  if(G.D.duelStage===2) zoneTxt='⚠ 2 vs 1 — SECOND DEFENDER';
  document.getElementById('dzone').textContent=zoneTxt;
  const homeLeft=(G.half===1),leftSide=homeLeft?'h':'a';
  const leftPl=leftSide===as?carrier:def,rightPl=leftSide===as?def:carrier;
  const leftRole=leftSide===as?'ATTACKER':'DEFENDER',rightRole=leftSide===as?'DEFENDER':'ATTACKER';
  fCard('a',leftPl,leftSide,leftRole); fCard('d',rightPl,leftSide==='h'?'a':'h',rightRole);
  const ballEl=document.getElementById('dp-ball');
  if(ballEl){
    // show on attacker side; left/right class positions it next to the correct card
    const hasBall=(as===leftSide);
    ballEl.className='dp-ball'+(hasBall?' show ball-left':' show ball-right');
  }
  bldA(carrier,isShot); bldD(def,ds,isShot);
  // ── 2v1 visual: show a second mini defender card stacked next to the main defender ──
  renderSecondDefender(G.D.is2v1?G.D.dk2:null, ds);
  // 2v1 attacker: hint that 2 moves are needed
  const albl=document.getElementById('albl');
  if(albl) albl.textContent = (G.D.is2v1 && as==='h' && !isShot) ? 'ATTACK (vs 1ST)' : 'ATTACK';
  document.getElementById('di').textContent=as==='h'?(G.D.is2v1?'PICK 2 MOVES (30s)':'CHOOSE ATTACK (30s)'):ds==='h'?'CHOOSE DEFENCE (30s)':'AI DUEL';
  document.getElementById('dcfm').classList.remove('rdy'); document.getElementById('duel-res').classList.remove('show');
  document.getElementById('duel-ov').classList.add('show');
  const vs=document.getElementById('dvs');vs.classList.remove('show');void vs.offsetWidth;vs.classList.add('show');
  startCD();
  // Stagger: aiAtk fires first, aiDef fires 200ms later so it can read G.D.ak for RPS counter-pick
  if(as==='a'&&!G.D.ak) setTimeout(aiAtk, 280);
  if(as==='a'&&G.D.ak)  setTimeout(()=>{ if(G.D.as==='a'&&G.D.ds==='a') tryRes(); }, 280);
  if(ds==='a') setTimeout(aiDef, as==='a' ? 490 : 260);
}

// ── 2v1 SECOND DEFENDER MINI-CARD ─────────────────────────────────
// Renders a bigger portrait of the second defender, positioned BEHIND the main defender
// for a perspective layered feel. Side mirrors the main defender's side.
function renderSecondDefender(dk2, ds){
  const existing=document.getElementById('dpd2-wrap');
  if(!dk2||!sq(ds)[dk2]){if(existing)existing.remove();return;}
  const pl=sq(ds)[dk2];
  const dpwrap=document.querySelector('.dpwrap');
  if(!dpwrap)return;
  // Determine which VISUAL side the defender is on.
  // fCard('a', leftPl, ...) puts whoever is on the left into the .atk card slot.
  // leftSide = home in 1st half, away in 2nd half. Defender is on the visual left when leftSide===ds.
  const homeLeft = (G.half===1);
  const leftSide = homeLeft ? 'h' : 'a';
  const defOnLeft = (leftSide === ds);
  let el=existing;
  if(!el){
    el=document.createElement('div');
    el.id='dpd2-wrap';
    el.className='dpd2-wrap';
    dpwrap.appendChild(el);
  }
  el.classList.toggle('on-left',defOnLeft);
  el.classList.toggle('on-right',!defOnLeft);
  const lastName=playerLastName(pl)||'';
  let bg='';
  if(pl.clubKey){
    const ln=lastName.replace(/[^a-z0-9]/g,'');
    const isGK=pl.pos==='GK';
    bg=isGK?`assets/career/clubs/gk.png`:`assets/career/clubs/${ln}${pl.clubKey}.png`;
  } else {
    bg=`assets/players/${lastName}.png`;
  }
  const tl=ds==='h'?'#2882f0':'#f03030';
  const spMax=pl.pos==='GK'?2000:1500;
  const spPct=Math.round(((pl.spirit||spMax)/spMax)*100);
  el.innerHTML=`
    <div class="dpd2-badge">2ND DEFENDER</div>
    <div class="dpd2-av" style="background-image:url('${bg}')"></div>
    <div class="dpd2-info">
      <div class="dpd2-nm">${pl.name}</div>
      <div class="dpd2-ps">${pl.pos}</div>
      <div class="dpd2-energy"><div class="dpd2-energy-fill" style="width:${spPct}%"></div></div>
    </div>`;
  el.style.setProperty('--tl',tl);
}

function fCard(role,pl,s,displayRole){
  const p=role==='a'?'dpa-':'dpd-';
  const tf=s==='h'?'#1258b0':'#b81616',tl=s==='h'?'#2882f0':'#f03030',rcol=rc(pl?.rar||1);
  // Card border = team colour, subtle team tint background
  const cardEl=document.getElementById(p+'c');
  cardEl.style.border=`2px solid ${tl}`;
  cardEl.style.boxShadow=`0 0 28px ${tl}44, 0 8px 40px rgba(0,0,0,.8)`;
  cardEl.style.background=`linear-gradient(160deg,${tf}28 0%,rgba(4,6,14,.97) 45%)`;
  // Portrait — no mirroring, images always shown as supplied
  const avEl=document.getElementById(p+'av');
  const lastName=playerLastName(pl);
  const img=playerImg(pl);
  // Team flag emblem watermark
  cardEl.querySelector('.dp-card-emblem')?.remove();
  const emblemEl=document.createElement('div');
  emblemEl.className='dp-card-emblem';
  emblemEl.textContent=s==='h'?(HT?.flag||''):(AT?.flag||'');
  cardEl.appendChild(emblemEl);
  avEl.classList.remove('mirrored');
  // Career club portrait: direct path, no waiting for playerImg
  if(pl&&pl.clubKey){
    const ln=(lastName||'').replace(/[^a-z0-9]/g,'');
    const isGK=pl.pos==='GK';
    const specific=isGK?`assets/career/clubs/gk.png`:`assets/career/clubs/${ln}${pl.clubKey}.png`;
    const fallback=isGK?`assets/career/clubs/gk.png`:`assets/career/clubs/${pl.clubKey}.png`;
    const ci=new Image();
    ci.onload=()=>{avEl.style.cssText=`background:url(${specific}) center bottom/contain no-repeat;color:transparent`;avEl.textContent='';};
    ci.onerror=()=>{
      const fb=new Image();
      fb.onload=()=>{avEl.style.cssText=`background:url(${fallback}) center bottom/contain no-repeat;color:transparent`;avEl.textContent='';};
      fb.onerror=()=>{avEl.style.cssText=`background:transparent;color:${tf};display:flex;align-items:center;justify-content:center;font-size:clamp(56px,10vw,110px);font-family:'Bebas Neue',sans-serif;opacity:.18`;avEl.textContent=pl.name.split('.').pop()[0];};
      fb.src=fallback;
    };
    ci.src=specific;
    avEl.style.cssText=`background:transparent;color:${tf};display:flex;align-items:center;justify-content:center;font-size:clamp(56px,10vw,110px);font-family:'Bebas Neue',sans-serif;opacity:.18`;
    avEl.textContent=pl.name.split('.').pop()[0];
  } else if(img&&img.complete&&img.naturalWidth>0){
    const _pi=new Image();_pi.src=`assets/profile/${lastName}.png`;
    _pi.onload=()=>{avEl.style.cssText=`background:url(assets/profile/${lastName}.png) center bottom/contain no-repeat;color:transparent`;};
    _pi.onerror=()=>{avEl.style.cssText=`background:url(assets/players/${lastName}.png) center bottom/contain no-repeat;color:transparent`;};
    avEl.textContent='';
  } else {
    avEl.style.cssText=`background:transparent;color:${tf};display:flex;align-items:center;justify-content:center;font-size:clamp(56px,10vw,110px);font-family:'Bebas Neue',sans-serif;opacity:.18`;
    avEl.textContent=pl?pl.name.split('.').pop()[0]:'?';
    const rawImg=pl?IMG_CACHE[lastName]:null;
    if(rawImg&&rawImg!=='err'&&!rawImg.complete){rawImg.onload=()=>fCard(role,pl,s,displayRole);}
  }
  document.getElementById(p+'nm').textContent=pl?pl.name.split('.').pop():'—';
  document.getElementById(p+'ps').textContent=pl?pl.pos:'—';document.getElementById(p+'ps').style.color=tl;
  document.getElementById(p+'r').textContent=rl(pl?.rar||1);document.getElementById(p+'r').style.color=rcol;
  const maxSp2=pl&&pl.pos==='GK'?2000:1500;
  const spRaw=pl?Math.round(pl.spirit||maxSp2):maxSp2;
  const spPct=Math.round(spRaw/maxSp2*100);
  const efEl=document.getElementById(p+'ef'),evEl=document.getElementById(p+'ev');
  if(efEl){efEl.style.width=spPct+'%';efEl.style.background=spPct>50?'#44c8ff':spPct>25?'#f0c040':'#dc2020';}
  if(evEl){evEl.textContent=spRaw;evEl.style.color=spPct>50?'#44c8ff':spPct>25?'#f0c040':'#dc2020';}
  const rn=document.getElementById(role==='a'?'dpa-role':'dpd-role');
  if(rn){rn.textContent=(displayRole||'PLAYER')+' · '+(s==='h'?HT?.name||'HOME':AT?.name||'AWAY');rn.style.color=tl;}
  const se=document.getElementById(p+'st');se.innerHTML='';
  if(pl)[['SPD',gs(pl,'spd')],['DRI',gs(pl,'dri')],['PAS',gs(pl,'pas')],['SHO',gs(pl,'sho')],['DEF',gs(pl,'def')],['POW',gs(pl,'pow')]].forEach(([l,v])=>{const d=document.createElement('div');d.className='dst';d.innerHTML=`<div class="dst-v" style="color:${tl}">${v}</div><div class="dst-l">${l}</div>`;se.appendChild(d);});
}

const SPECIALS={
  // ── JAPAN ─────────────────────────────────────────────────────
  'Ozora':      {l:'Drive Shot',       i:'⚡',c:400},
  'Tsubasa':    {l:'Drive Shot',       i:'⚡',c:400},
  'Hyuga':      {l:'Tiger Shot',       i:'🔥',c:400},
  'Matsuyama':  {l:'Wild Eagle Shot',  i:'🦅',c:400},
  'Misugi':     {l:'Sky Rocket Volley',i:'🚀',c:400},
  'Nitta':      {l:'Super Falcon Shot',i:'🦅',c:400},
  'Soda':       {l:'Razor Shot',       i:'⚔️',c:400},
  'Misaki':     {l:'Slider Shot',      i:'🌊',c:400},
  'Aoi':        {l:'Fantasista Shot',  i:'✨',c:400},
  // ── EUROPE / WORLD ────────────────────────────────────────────
  'Schneider':  {l:'Fire Shot',        i:'🔥',c:400},
  'Deuter':     {l:'Death Ball',       i:'💀',c:400},
  'Espadas':    {l:'El Tornado',       i:'🌪',c:400},
  'Napoleon':   {l:'Cannon Shot',      i:'💥',c:400},
  'Santana':    {l:'Overhead',         i:'🌀',c:400},
  'Frisina':    {l:'Riser Shot',       i:'🚀',c:400},
  'Natureza':   {l:'Atomic Shot',      i:'☢️',c:400},
  'Michael':    {l:'Miracle Shot',     i:'✨',c:400},
  'Pierre':     {l:'Eiffel Shot',      i:'🗼',c:400},
  'Victorino':  {l:'Panther Shot',     i:'🐆',c:400},
  'Hino':       {l:'Tornado Shot',     i:'🌪',c:400},
  'Xiao':       {l:'Dragon Shot',      i:'🐉',c:400},
  'Levi':       {l:'Bullet Shot',      i:'💥',c:400},
  'Mancuso':    {l:'Fury Shot',        i:'🔴',c:400},
  'Vella':      {l:'Emerald Shot',     i:'💚',c:400},
};
function getSpecial(pl){if(!pl)return null;const n=pl.name||'';for(const key of Object.keys(SPECIALS)){if(n.includes(key))return SPECIALS[key];}return null;}

// GK Super Save registry — every GK can attempt one, named per player
const GK_SUPERS={
  'Wakabayashi': {l:'SSGK',         i:'🌟'},
  'Wakashimazu': {l:'God Hand',     i:'🤚'},
  'Muller':      {l:'Iron Wall',    i:'🧱'},
  'Buffon':      {l:'Colossus',     i:'🏛'},
  'Casillas':    {l:'San Iker',     i:'🛡'},
  'Salinas':     {l:'El Muro',      i:'⚔️'},
  'Morisaki':    {l:'Miracle Hand', i:'✋'},
  'Hernandez':   {l:'Reflex Save',  i:'💫'},
  'Gino':        {l:'Gino Save',    i:'🧤'},
  'Olsen':       {l:'Viking Wall',  i:'❄️'},
};
// Fallback for any GK not in registry
function getGKSuper(pl){
  if(!pl)return null;
  const n=pl.name||'';
  for(const key of Object.keys(GK_SUPERS)){if(n.includes(key))return GK_SUPERS[key];}
  return {l:'Super Save',i:'🧤'}; // every GK gets one
}


function bldA(carrier,isShot){
  const sp=carrier?Math.round(carrier.spirit||1500):1500;
  const el=document.getElementById('abtns'),ih=G.D.as==='h';
  el.innerHTML='';
  const atkSection=document.getElementById('atk-section');
  if(atkSection)atkSection.style.display=ih?'':'none';
  if(!ih)return;
  if(G.D.ak){
    const lbl=document.createElement('div');
    lbl.style.cssText='color:var(--gold);font-size:11px;font-family:Orbitron,sans-serif;font-weight:700;letter-spacing:1px;opacity:.8;align-self:center;border:1px solid rgba(240,192,64,.2);border-radius:6px;padding:7px 12px;';
    lbl.textContent=(G.D.ak==='special'?'⚡ SPECIAL SHOT':'⚽ SHOT')+' — COMMITTED';
    el.appendChild(lbl);chkRdy();return;
  }
  let acts;
  if(isShot){
    acts=[{id:'shoot',l:'Shoot',i:'⚽'}];
    const spec=getSpecial(carrier);
    if(spec)acts.push({id:'special',l:spec.l,i:spec.i,sp:true});
  }else{
    acts=[{id:'pass',l:'Pass',i:'↑'},{id:'dribble',l:'Dribble',i:'▶'}];
    const cp=PP[G.D.as][G.ck],prog=cp?progressFor(G.D.as,cp):0;
    if(prog>.50)acts.push({id:'shoot',l:'Shoot',i:'⚽'});
    if(bestTeammateFor(G.D.as,G.ck,'one-two'))acts.push({id:'one-two',l:'1-2',i:'↑↑',ot:true});
  }
  acts.forEach(a=>{
    const cost=(ATK_ACTIONS[a.id]||{}).cost||0;
    const ok=sp>=cost;
    const costTxt=cost>0?(ok?'−'+cost+' SP':'⚡ LOW'):'FREE';
    const btn=document.createElement('button');
    const tc=a.sp||a.ot?'dact-sp':'dact-atk';
    btn.className='dact3d '+tc+(ok?'':' dact-dis');
    btn.innerHTML='<div class="dact3d-face"><span class="dact3d-i">'+a.i+'</span><span class="dact3d-l">'+a.l+'</span><span class="dact3d-c">'+costTxt+'</span></div><div class="dact3d-bot"></div>';
    if(ok)btn.onclick=()=>selA(a,btn);
    el.appendChild(btn);
  });
}

function bldD(def,ds,isShot){
  const el=document.getElementById('dbtns');el.innerHTML='';
  const ih=ds==='h';
  const defSection=document.getElementById('def-section');
  if(defSection)defSection.style.display=ih?'':'none';
  if(!ih)return;
  const defIsGK=def&&def.pos==='GK';
  const sp=def?Math.round(def.spirit||(defIsGK?2000:1500)):(defIsGK?2000:1500);

  const makeDBtn=(a)=>{
    const cost=(DEF_ACTIONS[a.id]||{}).cost||0;
    const ok=!a.locked&&sp>=cost;
    const costTxt=cost>0?(ok?'−'+cost+' SP':'⚡ LOW'):'FREE';
    const btn=document.createElement('button');
    const tc=a.id==='supersave'?'dact-ss':'dact-def';
    btn.className='dact3d '+tc+(ok?'':' dact-dis');
    btn.innerHTML='<div class="dact3d-face"><span class="dact3d-i">'+a.i+'</span><span class="dact3d-l">'+a.l+'</span><span class="dact3d-c">'+costTxt+'</span></div><div class="dact3d-bot"></div>';
    if(ok)btn.onclick=()=>selD(a,btn);
    else btn.disabled=true;
    el.appendChild(btn);
  };

  if(isShot&&defIsGK){
    const gkSuper=getGKSuper(def);
    [
      {id:'save',     l:'Save',  i:'🧤',stat:'SAV'},
      {id:'punch',    l:'Punch', i:'👊',stat:'POW'},
      {id:'supersave',l:gkSuper.l,i:gkSuper.i,stat:'SAV★',locked:sp<320},
    ].forEach(makeDBtn);
  } else {
    [
      {id:'tackle',   l:'Tackle',    i:'🦵',stat:'DEF'},
      {id:'intercept',l:'Intercept', i:'✋',stat:'PAS'},
      {id:'block',    l:'Block',     i:'🛡',stat:'DEF'},
    ].forEach(makeDBtn);
  }
}

function selA(a,btn){
  btnPop(btn);
  // 2v1 attacker flow: first selection is action vs defender 1, second is action vs defender 2.
  // When the match is 2v1 and user has already chosen ak, this click becomes ak2.
  if(G.D.is2v1 && G.D.as==='h' && G.D.ak && !G.D.ak2 && a.id!=='pass' && a.id!=='one-two'){
    G.D.ak2=a.id;
    document.querySelectorAll('#abtns .dact3d').forEach(b=>b.classList.remove('dact-sel2'));
    btn.classList.add('dact-sel2');
    // Highlight stage 2 label
    const albl=document.getElementById('albl');if(albl)albl.textContent='ATTACK (vs 2ND)';
    chkRdy();
    return;
  }
  G.D.ak=a.id;G.D.pk=null;G.D.ak2=null;
  document.querySelectorAll('#abtns .dact3d').forEach(b=>{b.classList.remove('dact-sel');b.classList.remove('dact-sel2');});
  btn.classList.add('dact-sel');
  if(a.id==='pass'||a.id==='one-two'){
    document.getElementById('duel-ov').classList.remove('show'); G.pm=true; document.getElementById('pass-banner').style.display='block';
    document.getElementById('pass-banner').textContent=a.id==='one-two'?'ONE-TWO — PICK TEAMMATE':'PASS MODE — CLICK A PLAYER';
    document.getElementById('dcfm').classList.remove('rdy');
  } else {
    // In 2v1 prompt the user for a second move
    if(G.D.is2v1 && G.D.as==='h'){
      const albl=document.getElementById('albl');if(albl)albl.textContent='ATTACK (vs 2ND)';
    }
    chkRdy();
  }
}
function selD(a,btn){btnPop(btn);G.D.defA=a.id;document.querySelectorAll('#dbtns .dact3d').forEach(b=>b.classList.remove('dact-sel'));btn.classList.add('dact-sel');chkRdy();}
function chkRdy(){
  const needsPk=G.D.ak==='pass'||G.D.ak==='one-two';
  // In 2v1 with human attacker: both ak AND ak2 must be chosen (unless it's a pass variant)
  const needsAk2 = G.D.is2v1 && G.D.as==='h' && G.D.ak && !needsPk;
  const ao = G.D.as!=='h' || (G.D.ak && (!needsPk || G.D.pk) && (!needsAk2 || G.D.ak2));
  const do2 = G.D.ds!=='h' || G.D.defA;
  document.getElementById('dcfm').classList.toggle('rdy',!!(ao&&do2));
}

function weightedPick(items){
  const total=items.reduce((s,i)=>s+Math.max(0,i.w),0); if(total<=0)return items[0]?.id||null;
  let r=Math.random()*total; for(const it of items){r-=Math.max(0,it.w); if(r<=0)return it.id;} return items[0]?.id||null;
}

function aiAtk(){
  const side=G.D.as,carrier=G.D.carrier,cp=PP[side][G.ck];
  const prog=cp?progressFor(side,cp):.5;
  const pressure=cp?clamp(1-nearestDefenderDistance(side,cp)/(W*(ENGINE_CONFIG.ai.duelPressureRadius)),0,1):0;
  const space=cp?clamp(nearestDefenderDistance(side,cp)/(W*.18),0,1.5):0.5;
  const stage=possessionStage(side,cp);
  const bh=getBehaviorProfile(carrier);
  const options=[];
  const canAfford=(id)=> (carrier?.spirit||1500) >= (ATK_ACTIONS[id]?.cost||0);

  const bestPass=bestTeammateFor(side,G.ck,'pass');
  if(bestPass){
    let passW=1.6 + space*1.8 + (1-pressure)*1.1;
    if(stage==='buildUp') passW += 1.0;
    if(stage==='advance') passW += 0.4;
    passW *= (bh.passBias||1);
    options.push({id:'pass',w:passW});
  }

  if(canAfford('dribble')){
    const spdBonus=carrier?((carrier.spd||70)-70)/30:0;
    let dribbleW=1.4+space*2.8+spdBonus*1.2+prog*0.8;
    if(stage==='advance') dribbleW += 0.5;
    dribbleW *= (bh.dribbleBias||1) * (1 + Math.max(0, (bh.pressResistance||1)-1)*pressure*0.35);
    options.push({id:'dribble',w:dribbleW});
  }

  const Z=ENGINE_CONFIG.duel.zones;
  const shotWindow = ENGINE_CONFIG.ai.shotWindowBase - Math.max(0, (bh.longShotBias||1)-1)*0.06;
  if((G.D.isShot||prog>shotWindow)&&canAfford('shoot')){
    let shootW=(G.D.isShot?5.0:0.8)+prog*4.5-pressure*1.2;
    shootW *= (bh.shootBias||1);
    // Zone modifier: heavily discourage long shots unless specialist
    if(prog < Z.longRange){
      shootW *= (bh.longShotBias||1) * 0.45; // discourage unless longShotBias > 1
    } else if(prog < Z.midRange){
      shootW *= 0.80; // slightly hesitant in midrange
    } else if(prog >= Z.boxEdge){
      shootW *= 1.35; // AI likes to shoot at close range
    }
    options.push({id:'shoot',w:shootW});
  }
  const spec=getSpecial(carrier);
  const specialWindow = ENGINE_CONFIG.ai.specialWindowBase - Math.max(0, (bh.specialBias||1)-1)*0.05;
  if(spec&&canAfford('special')&&(G.D.isShot||prog>specialWindow)){
    let specW=(G.D.isShot?6.0:1.6)+prog*5.0-pressure*0.6;
    specW *= (bh.specialBias||1);
    // Specials are worth using from any range — they're powerful enough
    if(prog < Z.longRange) specW *= 0.70; // still slightly discouraged
    options.push({id:'special',w:specW});
  }

  const ot=bestTeammateFor(side,G.ck,'one-two');
  if(ot&&canAfford('one-two')&&!G.D.isShot){
    let oneTwoW=1.6+pressure*2.2+prog*1.0;
    if(stage==='advance') oneTwoW += 0.45;
    oneTwoW *= (bh.oneTwoBias||1);
    options.push({id:'one-two',w:oneTwoW});
  }

  G.D.ak=weightedPick(options.filter(o=>o.w>0))||'pass';
  if(G.D.ak==='pass')G.D.pk=bestPass;
  if(G.D.ak==='one-two')G.D.pk=ot||bestPass;
  if(G.D.ak==='special'){
    const spec=getSpecial(G.D.carrier);
    if(spec){
      if(G.D.as==='a'&&G.D.ds==='a'){setTimeout(()=>{if(!G.D.defA)aiDef();showSpecialCutscene(G.D.carrier,spec,()=>resDuel());},200);return;}
      else{showSpecialCutscene(G.D.carrier,spec,()=>{});}
    }
  }
  if(G.D.as==='a'&&G.D.ds==='a')tryRes();
}

function aiDef(){
  const def=G.D.def,ds=G.D.ds,as=G.D.as,cp=PP[as][G.ck];
  const prog=cp?progressFor(as,cp):.5;
  const centrality=cp?1-Math.abs(cp.y/H-.5):.5;
  const defIsGK=def&&def.pos==='GK';
  const ak=G.D.ak;
  const bh=getBehaviorProfile(def);

  if(G.D.isShot&&defIsGK){
    const punchBias=prog>.88?(1.8):((1-centrality)*1.4);
    const gkSp=def?(def.spirit||2000):2000;
    const canAffordSuper=gkSp>=320;
    // Use Super Save vs special shots or when attacker is elite and stamina allows
    const attackerIsElite=G.D.carrier&&gs(G.D.carrier,'sho')>=88;
    const isSpecialShot=ak==='special';
    const superW=canAffordSuper?(isSpecialShot?5.0:attackerIsElite?2.5:0.5):0;
    const opts=[
      {id:'save',w:3.0+centrality*1.2},
      {id:'punch',w:1.2+punchBias},
      {id:'supersave',w:superW},
    ];
    G.D.defA=weightedPick(opts.filter(o=>o.w>0));
  } else {
    let tackleW=2.0, interceptW=1.8, blockW=1.6;

    if(ak==='pass'||ak==='one-two'){
      interceptW+=3.0;
      tackleW-=0.4;
    } else if(ak==='dribble'){
      tackleW+=3.0;
      interceptW-=0.6;
    } else if(ak==='shoot'||ak==='special'){
      blockW+=3.2;
      tackleW-=0.2;
    } else {
      tackleW+=(prog<.55?1.4:0.2);
      interceptW+=(prog>.40?1.0:0.2);
      blockW+=(prog>.65?1.4:0.4)+centrality*0.8;
    }

    tackleW+=(centrality<.35?0.8:0);
    blockW+=centrality*1.0;
    interceptW+=(prog>.45?0.6:0);

    const aggr=(bh.defensiveAggression||1);
    tackleW*=aggr;
    blockW*=0.95 + (aggr-1)*0.35;
    interceptW*=1.05 - (aggr-1)*0.2;

    if(def){
      const sp=def.spirit||1500,maxSp=1500;
      if(sp<maxSp*.4){tackleW+=0.8;blockW-=0.4;interceptW-=0.2;}
    }

    const opts=[{id:'tackle',w:tackleW},{id:'intercept',w:interceptW},{id:'block',w:blockW}];
    G.D.defA=weightedPick(opts.filter(o=>o.w>0));
  }
  if(G.D.as==='a'&&G.D.ds==='a')tryRes();
}

function tryRes(){
  // Don't auto-resolve if human still needs to choose attack or defence
  if(G.D.as==='h' && !G.D.ak) return;
  if(G.D.ds==='h' && !G.D.defA) return;
  if(G.D.ak && G.D.defA) resDuel();
}
function confirmDuel(){
  if(!G.D.ak && G.D.as==='a') aiAtk();
  if(!G.D.defA && G.D.ds==='a') aiDef();
  if(G.D.ak && G.D.defA){
    if(G.D.ak==='special'){const spec=getSpecial(G.D.carrier);if(spec){clearInterval(G.di);showSpecialCutscene(G.D.carrier,spec,()=>resDuel());return;}}
    resDuel();
  }
}

function startCD(){
  clearInterval(G.di);
  // GK shot duel: human is the attacker, GK (AI) is defender — no human choice needed, resolve quickly
  const isGKDuel = G.D.isShot && G.D.ds==='a' && G.D.def && G.D.def.pos==='GK';
  let s = isGKDuel ? 3 : 30;
  const arc=document.getElementById('dta'),ne=document.getElementById('dtn'),c2=100.53;
  arc.style.strokeDashoffset='0';ne.textContent=isGKDuel?'':String(s);ne.classList.remove('urg');
  G.di=setInterval(()=>{
    s--;
    if(!isGKDuel){ne.textContent=s;arc.style.strokeDashoffset=String(c2*(1-s/30));if(s<=8)ne.classList.add('urg');}
    if(s<=0){
      clearInterval(G.di);
      if(!G.D.ak){
        if(G.D.as==='a') aiAtk();
        else { G.D.ak='pass'; G.D.pk=bestTeammateFor('h',G.ck,'pass')||validOutfieldKeys('h').find(k=>k!==G.ck)||null; }
      }
      if(!G.D.defA){
        if(G.D.ds==='a') aiDef();
        else if(G.D.isShot && G.D.def && G.D.def.pos==='GK') { G.D.defA='save'; }
        else { G.D.defA='tackle'; }
      }
      resDuel();
    }
  },1000);
}


// ═══════════════════════════════════════════════════════════════
// COMBAT ENGINE v2 — CT spec formula:
// FinalPower = (S_base + S_phys/2) × M_action × B_RPS × RNG(0.9,1.1)
// ═══════════════════════════════════════════════════════════════

const ATK_ACTIONS={
  pass:     {base:'pas', phys:'dri', mult:1.00, cost:0  },
  dribble:  {base:'dri', phys:'spd', mult:1.12, cost:80 },
  'one-two':{base:'pas', phys:'dri', mult:1.20, cost:60 },
  shoot:    {base:'sho', phys:'pow', mult:1.30, cost:120},
  special:  {base:'sho', phys:'pow', mult:2.50, cost:400},
};
const DEF_ACTIONS={
  tackle:    {base:'def', phys:'pow', mult:1.00, cost:60},
  intercept: {base:'pas', phys:'def', mult:1.15, cost:50},
  block:     {base:'def', phys:'pow', mult:1.10, cost:70},
  save:      {base:'sav', phys:'ref', mult:1.80, cost:90},
  punch:     {base:'ref', phys:'pow', mult:1.40, cost:70},
  supersave: {base:'sav', phys:'ref', mult:3.20, cost:320},
};
// B_RPS: attacker's multiplier based on matchup
// 1.35 = read correctly (was 1.5), 0.78 = read wrong (was 0.6), 1.0 = neutral
// Softened so wrong reads still punish but don't completely collapse.
const RPS={
  pass:     {tackle:0.78, intercept:1.35, block:1.0,  save:1.0,  punch:1.0, supersave:1.0},
  dribble:  {tackle:1.35, intercept:0.82, block:1.0,  save:1.0,  punch:1.0, supersave:1.0},
  'one-two':{tackle:1.35, intercept:0.82, block:1.0,  save:1.0,  punch:1.0, supersave:1.0},
  shoot:    {tackle:1.0,  intercept:1.0,  block:0.68, save:0.70, punch:1.0, supersave:0.45},
  special:  {tackle:1.0,  intercept:1.0,  block:0.68, save:0.48, punch:1.15,supersave:0.35},
};

function spiritMult(pl){
  const maxSp=pl && pl.pos==='GK'?2000:1500;
  const ratio=pl?(pl.spirit||maxSp)/maxSp:1.0;
  // 0.82 (exhausted) → 1.05 (fresh) — 23% swing, not 54%
  return clamp(0.82 + ratio*0.23, 0.82, 1.05);
}

function calcAttackPower(carrier,ak,side){
  const act=ATK_ACTIONS[ak]||ATK_ACTIONS.pass;
  const sBase=gs(carrier,act.base);
  const sPhys=gs(carrier,act.phys);
  const bh=getBehaviorProfile(carrier);
  let mAction=act.mult;
  if(ak==='shoot'||ak==='special'){
    const cp=PP[side][G.ck];
    const prog=cp?progressFor(side,cp):0.5;
    const centrality=cp?1-Math.abs(cp.y/H-0.5):0.5; // 0=corner, 1=centre
    const pressure=cp?clamp(1-nearestDefenderDistance(side,cp)/(W*(ENGINE_CONFIG.ai.duelPressureRadius)),0,1):0;
    const Z=ENGINE_CONFIG.duel.zones;

    // ── ZONE-BASED POWER MULTIPLIER ──────────────────────────────────
    // Each zone has a base power and a centrality sensitivity
    // Centrality penalty: wide angle shots lose significant power
    let zoneMult, zoneLabel;

    if(prog < Z.longRange){
      // LONG RANGE — weak, high variance, specialist territory
      // prog 0.50 → 0.60mult, prog 0.71 → 0.88mult (before centrality)
      zoneMult = 0.42 + prog * 0.65;
      zoneLabel = 'LONG RANGE';
    } else if(prog < Z.midRange){
      // MID RANGE — 0.72–0.82, meaningful but not dominant
      zoneMult = 0.88 + (prog - Z.longRange) * 1.8;
      zoneLabel = 'MID RANGE';
    } else if(prog < Z.boxEdge){
      // BOX EDGE — 0.82–0.91, prime territory, central angle crucial
      zoneMult = 1.12 + (prog - Z.midRange) * 2.8;
      zoneLabel = 'BOX EDGE';
    } else {
      // POINT BLANK — > 0.91, devastating, close range finishes
      zoneMult = 1.45 + (prog - Z.boxEdge) * 3.5;
      zoneLabel = 'POINT BLANK';
    }

    // Centrality modifier — corner shots punished, central shots rewarded
    // Long range: centrality matters less (shoot from distance = angle matters less)
    // Point blank: centrality matters most (side angle at close range = harder finish)
    const centralityWeight = prog < Z.longRange ? 0.20 : prog < Z.midRange ? 0.32 : prog < Z.boxEdge ? 0.45 : 0.55;
    const centralityMult = 0.55 + centrality * centralityWeight * 2.0;
    // Cap: full centrality bonus capped to avoid overpowered centre shots
    const finalZoneMult = clamp(zoneMult * centralityMult, 0.28, 2.20);

    mAction *= finalZoneMult;

    // Pressure penalty — harder to shoot under pressure at all ranges
    mAction *= (1 - pressure * ENGINE_CONFIG.duel.pressureAttackPenalty * (2-(bh.pressResistance||1)));

    // Long shot specialist bonus (Hyuga, Schneider etc have longShotBias > 1)
    if(prog < Z.longRange) mAction *= (bh.longShotBias||1) * 1.15; // extra reward for specialists
    else if(prog < Z.midRange) mAction *= (bh.longShotBias||1);

    // Store zone label for HUD display
    G._shotZone = zoneLabel;
  }
  if(ak==='dribble') mAction*=(bh.dribbleBias||1);
  if(ak==='pass'||ak==='one-two') mAction*=(bh.passBias||1);
  if(ak==='shoot') mAction*=(bh.shootBias||1);
  if(ak==='special') mAction*=(bh.specialBias||1);
  if(ak==='special'&&!getSpecial(carrier))mAction=1.30;
  {
    const _cp2=PP[side]&&PP[side][G.ck]?PP[side][G.ck]:null;
    const _stage=possessionStage(side,_cp2);
    if((ak==='pass'||ak==='one-two')&&_stage==='buildUp')mAction*=1.15;
    if((ak==='shoot'||ak==='chip')&&_stage==='final')mAction*=0.92;
    if((ak==='shoot'||ak==='special')&&_stage==='threat')mAction*=1.10;
    if(ak==='dribble'&&_stage==='advance')mAction*=1.08;
  }
  const rng=ENGINE_CONFIG.duel.rngMin+Math.random()*(ENGINE_CONFIG.duel.rngMax-ENGINE_CONFIG.duel.rngMin);
  return (sBase+sPhys/2)*mAction*spiritMult(carrier)*rng;
}

function calcDefencePower(def,defA,attackAction){
  const act=DEF_ACTIONS[defA]||DEF_ACTIONS.tackle;
  const sBase=gs(def,act.base);
  const sPhys=gs(def,act.phys);
  const bh=getBehaviorProfile(def);
  const rng=ENGINE_CONFIG.duel.rngMin+Math.random()*(ENGINE_CONFIG.duel.rngMax-ENGINE_CONFIG.duel.rngMin);
  // GK saves/punches/supersave: dedicated stat formula, no RPS penalty — they're specialists
  const isGKAction = defA==='save'||defA==='punch'||defA==='supersave';
  const bRPS = isGKAction ? 1.0 : ((RPS[attackAction]&&RPS[attackAction][defA])||1.0);
  let mult=act.mult*bRPS;
  if(defA==='tackle') mult*=(bh.defensiveAggression||1);
  if(defA==='intercept') mult*=1.02;
  if(defA==='block') mult*=1.04;
  if(ROLES.cover && sq(G.D.ds||'a')[ROLES.cover]===def) mult*=(1+ENGINE_CONFIG.duel.coverDefenceBonus);
  if(ROLES.blocker && sq(G.D.ds||'a')[ROLES.blocker]===def) mult*=(1+ENGINE_CONFIG.duel.blockerDefenceBonus);
  // BOX-DEFENDER BOOST — defending inside own penalty box = +22% power.
  // Defensive zone is last 22% of pitch from defender's own goal.
  // Defender's own goal: home defends bottom (high Y), away defends top (low Y).
  const ds=G.D.ds, dk=G.D.dk;
  if(ds&&dk&&PP[ds]&&PP[ds][dk]&&defA!=='save'&&defA!=='supersave'&&defA!=='punch'){
    const dp=PP[ds][dk];
    // Box: center third on X (0.30-0.70), last 22% of pitch on Y from own goal
    const inBoxX = dp.x>W*0.30 && dp.x<W*0.70;
    const inBoxY = ds==='h' ? dp.y>H*0.78 : dp.y<H*0.22;
    if(inBoxX&&inBoxY) mult*=1.22;
  }
  return (sBase+sPhys/2)*mult*spiritMult(def)*rng;
}

function resDuel(){
  if(!G.D.ak&&G.D.as==='h')return;
  if(!G.D.defA&&G.D.ds==='h')return;
  clearInterval(G.di);
  G.phase='duel_result';G.pm=false;
  document.getElementById('pass-banner').style.display='none';
  document.getElementById('duel-ov').classList.add('show');
  document.querySelectorAll('.dact3d').forEach(b=>b.classList.add('dact-dis'));
  document.getElementById('dcfm').classList.remove('rdy');
  const {carrier,def,dk,as,ds,isShot,ak,pk,defA}=G.D;
  let atkPow=calcAttackPower(carrier,ak,as);
  let defPow=calcDefencePower(def,defA,ak);
  G.D.lastShotPow=(['shoot','special'].includes(ak))?atkPow:0;
  // 2v1: second defender contributes 55% of their own defence power using the same action.
  // If the attacker is human and chose a second attack action (ak2), use it against def2's counter.
  if(G.D.is2v1 && G.D.dk2 && sq(ds)[G.D.dk2] && !isShot){
    const def2=sq(ds)[G.D.dk2];
    const ak2 = G.D.ak2 || ak; // fallback: same as primary
    const atkPow2=calcAttackPower(carrier,ak2,as);
    const def2Pow=calcDefencePower(def2,defA,ak2)*0.55;
    // Attacker's effective power is the weighted average of both attack rolls
    atkPow = atkPow*0.65 + atkPow2*0.35;
    defPow+=def2Pow;
    G.D.lastDef2Pow=def2Pow;
    // Drain stamina on attacker for second action + on 2nd defender
    const atkCost2=(ATK_ACTIONS[ak2]||{}).cost||0;
    if(carrier && atkCost2>0 && G.D.ak2) carrier.spirit=Math.max(0,(carrier.spirit||1500)-Math.round(atkCost2*0.5));
    const defCost2=(DEF_ACTIONS[defA]||{}).cost||0;
    if(defCost2>0){const maxSp=def2.pos==='GK'?2000:1500;def2.spirit=Math.max(0,(def2.spirit||maxSp)-Math.round(defCost2*0.6));}
  }
  // Wall duel — extra defenders nearby add power bonus
  if(!isShot&&def&&PP[ds][dk]){
    const defPos=PP[ds][dk];
    let wallBonus=0,wallCount=0;
    Object.keys(sq(ds)).forEach(k=>{
      if(k===dk||!sq(ds)[k]||!PP[ds][k])return;
      const d=dist(PP[ds][k],defPos);
      if(d<IR()*2.2){
        const helper=sq(ds)[k];
        wallBonus+=gs(helper,'def')*0.18*spiritMult(helper);
        wallCount++;
      }
    });
    if(wallCount>0){
      defPow+=wallBonus;
      if(wallCount>=2)say('WALL! '+wallCount+' defenders close!');
    }
  }
  const win=atkPow>defPow;
  const atkCost=(ATK_ACTIONS[ak]||{}).cost||0;
  const defCost=(DEF_ACTIONS[defA]||{}).cost||0;
  if(carrier&&atkCost>0)carrier.spirit=Math.max(0,(carrier.spirit||1500)-atkCost);
  if(def&&defCost>0){
    const defMax=def.pos==='GK'?2000:1500;
    def.spirit=Math.max(0,(def.spirit||defMax)-defCost);
  }
  G.duels++;
  if(['shoot','special'].includes(ak))G.shots++;
  updH();
  if(win&&dk)scd(ds,dk);        // loser: full cooldown
  if(!win)scd(as,G.ck);         // loser: full cooldown
  // 2v1: second defender also gets cooldown on defender-team loss
  if(win && G.D.is2v1 && G.D.dk2) scd(ds,G.D.dk2);
  // Only the loser gets cooldown — winner is free to act immediately
  const hW=(as==='h'&&win)||(as==='a'&&!win);
  const rc2=hW?'#20c878':'#dc2020';
  let badge='SUCCESS!',det='';
  if(['shoot','special'].includes(ak)){
    if(win){badge=G.D.isShot?'⚽ GOAL!':'🎯 SHOT ON TARGET!';det=carrier?carrier.name+(G.D.isShot?' scores!':' shoots!'):'';}
    else if(defA==='punch'){badge='PUNCHED!';det=def?def.name+' punches clear!':'';}
    else{badge='SAVED!';det=def?def.name+' keeps it out!':'';}
  }else if(ak==='pass'||ak==='one-two'){
    if(win){badge=ak==='one-two'?'ONE-TWO!':'PASS COMPLETE!';det=pk&&sq(as)[pk]?'→ '+sq(as)[pk].name:'';}
    else{badge=defA==='intercept'?'INTERCEPTED!':'PASS CUT!';det=def?def.name+' steps in!':'';}
  }else if(ak==='dribble'){
    if(win){badge='DRIBBLE!';det=carrier?carrier.name+' beats the press!':'';}
    else{badge=defA==='block'?'BLOCKED!':'TACKLED!';det=def?def.name+' wins it!':'';}
  }
  const al={pass:'PASS',dribble:'DRIBBLE',shoot:'SHOOT',special:'SPECIAL','one-two':'ONE-TWO'};
  const dl={tackle:'TACKLE',intercept:'INTERCEPT',block:'BLOCK',save:'SAVE',punch:'PUNCH'};
  const _bRPS=(RPS[ak]&&RPS[ak][defA])||1.0;
  if(_bRPS>1.2&&win) badge='⚡ COUNTER! '+badge;
  else if(_bRPS<0.85&&!win) badge='🛡 COUNTERED! '+badge;
  document.getElementById('rbadge').textContent=badge;
  document.getElementById('rbadge').style.color=rc2;
  document.getElementById('rdet').textContent=det;
  document.getElementById('rdet').style.color=rc2;
  document.getElementById('ract').textContent=
    (al[ak]||ak.toUpperCase())+' '+Math.round(atkPow)+' vs '+(dl[defA]||defA.toUpperCase())+' '+Math.round(defPow);
  const ro=document.getElementById('duel-res');
  ro.classList.add('show');say(badge+(det?' — '+det:''));

  // ── IMPACT FEEDBACK ─────────────────────────────────────
  if(['shoot','special'].includes(ak)){
    if(win&&G.D.isShot){
      // Goal — handled in afGoal with full zoom
      shakeScreen(8,120);
    } else if(win){
      shakeScreen(5,80);
      impactText('🎯 SHOT ON TARGET!','#f0c040');
    } else if(defA==='supersave'){
      shakeScreen(6,100);
      impactText('⭐ SUPER SAVE!','#44b4ff','clamp(20px,3.5vw,32px)');
    } else if(defA==='punch'){
      shakeScreen(4,70);
      impactText('👊 PUNCHED CLEAR!','#aaa');
    } else {
      shakeScreen(3,60);
      impactText('🧤 SAVED!','#44b4ff');
    }
  } else if(ak==='special'&&!['shoot','special'].includes(ak)){
    // shouldn't happen but guard
  } else {
    if(win&&ak==='dribble'){impactText('✨ DRIBBLE!','#f0c040');}
    else if(win&&ak==='one-two'){impactText('⚡ ONE-TWO!','#f0c040');}
    else if(!win&&defA==='intercept'){impactText('✋ INTERCEPTED!','#dc2020');}
    else if(!win&&defA==='tackle'){impactText('🦵 TACKLED!','#dc2020');}
  }
  const powerDiff=Math.abs(atkPow-defPow);
  if(powerDiff>40){
    const loserKey=win?dk:G.ck;
    const loserSide=win?ds:as;
    const loserPos=PP[loserSide]&&PP[loserSide][loserKey]?PP[loserSide][loserKey]:null;
    if(loserPos){
      const blowDir=(win&&loserSide===ds)?1:-1;
      const blowDist=clamp(powerDiff*0.7,40,130);
      let _bStep=0;
      const _bTimer=setInterval(()=>{
        _bStep++;
        loserPos.x=clamp(loserPos.x+blowDir*(blowDist/10),W*.03,W*.97);
        if(_bStep>=10)clearInterval(_bTimer);
      },40);
      if(powerDiff>70)say('💥 BLOWN AWAY!');
    }
  }
  const _gen=G.goalGen;
  setTimeout(()=>{
    ro.classList.remove('show');
    if(['shoot','special'].includes(ak)&&win){
      if(G.D.isShot){
        // Was already a shot duel (vs GK) — score directly
        afGoal(carrier,as,_gen);
      } else {
        // Won a field duel with a shot — animate to GK then open shot duel
        const _ds=as==='h'?'a':'h';
        const _gkPos=PP[_ds]&&PP[_ds]['GK']?PP[_ds]['GK']:{x:goalXFor(as),y:H*.5};
        const _cp=PP[as][G.ck]||_gkPos;
        G._shotTrail=true;
        animateBallTo(_cp.x,_cp.y,_gkPos.x,_gkPos.y,()=>{G._shotTrail=false;G.phase='idle';opDuel(true,ak);},40);
      }
    }
    else if(['shoot','special'].includes(ak)&&!win)afSave(ds);
    else if(ak==='pass'&&win)afPass(as,pk);
    else if(ak==='one-two'&&win)afOneTwo(as,pk,carrier);
    else if(win)afSucc(as,carrier);
    else afTurn(ds);
  },950);
}

function closeDuel(){document.getElementById('duel-ov').classList.remove('show');document.getElementById('duel-res').classList.remove('show');G.pm=false;document.getElementById('pass-banner').style.display='none';const d2=document.getElementById('dpd2-wrap');if(d2)d2.remove();}
function resume(s,msg){
  closeDuel(); if(msg)say(msg); G.phase='idle'; document.getElementById('passhint').style.display='none';
  // Grace period after duel — no new duel or shot gate can fire for 2.5s
  G.kickoffUntil=Date.now()+2500;
  setTimeout(()=>{G.phase='moving'; asnC(); if(s==='h')document.getElementById('passhint').style.display='block';},180);
}

function afGoal(scorer,s,gen){
  // Ghost goal guard: generation must match current, and no goal already in flight
  if(gen!==undefined && gen!==G.goalGen)return;
  if(G._scoringGoal)return;
  G._scoringGoal=true;
  G.goalGen++; // invalidate any other queued afGoal for this sequence
  closeDuel(); G.phase='idle'; G.pressing=false;
  const pb=document.getElementById('pressBtn');if(pb){pb.classList.remove('active');pb.textContent='PRESS';} if(s==='h')G.hG++; else G.aG++; if(s==='h')G.mom=Math.min(100,G.mom+16); else G.mom=Math.max(0,G.mom-16); updH();
  const tn=(s==='h'?HT:AT)?.name||''; document.getElementById('gscr').textContent=(scorer?scorer.name.toUpperCase():'')+' — '+tn;
  const gf=document.getElementById('gfl'); gf.classList.remove('show'); void gf.offsetWidth; gf.classList.add('show'); G_moveTarget=null;G_laneTarget=null;
  showReferee('GOAL!');
  goalZoom();
  shakeScreen(12, 200);
  impactText('⚽ GOAL!!!', '#f0c040', 'clamp(28px,5vw,52px)');
  setTimeout(()=>{
    Object.values(hSq).forEach(p=>{if(p)p.cooldownUntil=0;}); Object.values(aSq).forEach(p=>{if(p)p.cooldownUntil=0;});
    iPos(); const ns=s==='h'?'a':'h',q=sq(ns),kk=['CM2','CM1','ST'].find(k=>q[k])||Object.keys(q).find(k=>q[k]);
    G.poss=ns; G.ck=kk; G.tP++; if(ns==='h')G.hP++; if(PP[ns][kk]){PP[ns][kk].x=W/2;PP[ns][kk].y=H/2;PT[ns][kk]={x:W/2,y:H/2};}
    ball.x=W/2;ball.y=H/2;ball.tx=W/2;ball.ty=W/2; ball.ty=H/2; updP(); say(((ns==='h'?HT:AT)?.name||'Team')+' kick off.');
    showReferee('KICK OFF');
    setTimeout(()=>{G._scoringGoal=false; asnC();G.phase='moving';if(ns==='h')document.getElementById('passhint').style.display='block';},1000);
  },2100);
}

function afSave(ds){
  G.goalGen++;
  const q=sq(ds);
  const gk=q['GK'];
  const p2=fp('GK',ds==='h'?'home':'away',G.half);
  const gkX=p2.x*W,gkY=p2.y*H;
  const ak=G.D.ak||'shoot';
  const shotPow=G.D.lastShotPow||80;
  // Use actual chosen defence action — includes supersave
  const gkDefA=G.D.defA&&['save','punch','supersave'].includes(G.D.defA)?G.D.defA:(ak==='special'?'punch':'save');
  const isSuper=gkDefA==='supersave';
  const gkPow=gk?calcDefencePower(gk,gkDefA,ak):80;
  // Deduct GK stamina — GK max is 2000
  if(gk){
    const gkCost=(DEF_ACTIONS[gkDefA]||{}).cost||0;
    if(gkCost>0) gk.spirit=Math.max(0,(gk.spirit||2000)-gkCost);
  }
  const diff=(shotPow-gkPow)+(Math.random()-0.5)*18;
  let outcome;
  // Supersave shifts thresholds heavily in GK's favour
  if(isSuper){
    if(diff<-10)outcome='catch';
    else if(diff<15)outcome='parry';
    else if(diff<35)outcome='spill';
    else outcome='goal';
  } else {
    if(diff<-30)outcome='catch';
    else if(diff<0)outcome='parry';
    else if(diff<25)outcome='spill';
    else outcome='goal';
  }
  const superName=isSuper&&gk?getGKSuper(gk).l:'';
  const outcomeText={catch:'CAUGHT!',parry:'PARRIED!',spill:'REBOUND!',goal:'GOAL!'};
  const outcomeDetail={
    catch:gk?(isSuper?gk.name.split('.').pop()+' — '+superName+'!':gk.name+' catches it cleanly!'):'Clean catch!',
    parry:gk?(isSuper?gk.name.split('.').pop()+' — '+superName+'!':gk.name+' parries it away!'):'Parried away!',
    spill:gk?gk.name+' spills it — loose!':'Loose ball!',
    goal:'Unstoppable — GOAL!'
  };

  const doResolve=()=>{
    closeDuel();
    document.getElementById('rbadge').textContent=outcomeText[outcome];
    document.getElementById('rbadge').style.color=outcome==='goal'?'#f0c040':'#4db8ff';
    document.getElementById('rdet').textContent=outcomeDetail[outcome];
    document.getElementById('rdet').style.color='#cce8ff';
    document.getElementById('ract').textContent=(isSuper?'⭐ SUPER SAVE — ':'')+(G._shotZone?G._shotZone+' · ':'')+' SHOT '+Math.round(shotPow)+' vs GK '+Math.round(gkPow);
    const ro=document.getElementById('duel-res');
    ro.classList.add('show');
    say(outcomeText[outcome]+' — '+outcomeDetail[outcome]);
    if(outcome==='goal'){
      const as=ds==='h'?'a':'h';
      const _gen=G.goalGen-1;
      setTimeout(()=>{ro.classList.remove('show');afGoal(G.D.carrier,as,_gen);},600);
      return;
    }
    if(outcome==='catch'){
      G.poss=ds;G.ck='GK';G.tP++;if(ds==='h')G.hP++;
      PP[ds]['GK']={x:gkX,y:gkY};PT[ds]['GK']={x:gkX,y:gkY};
      ball.x=gkX;ball.y=gkY;ball.tx=gkX;ball.ty=gkY;updP();
      G.phase='idle';
      setTimeout(()=>{
        ro.classList.remove('show');
        const outlet=bestTeammateFor(ds,'GK','pass')||['CB1','CB2','LB','RB','CM2'].find(k=>q[k]);
        if(outlet){G.ck=outlet;G.tP++;if(ds==='h')G.hP++;if(PP[ds][outlet]){ball.tx=PP[ds][outlet].x;ball.ty=PP[ds][outlet].y;}}
        updP();G.kickoffUntil=Date.now()+1800;
        setTimeout(()=>{asnC();G.phase='moving';if(ds==='h')document.getElementById('passhint').style.display='block';},500);
      },900);
      return;
    }
    if(outcome==='parry'){
      const ddir=dirFor(ds);
      const clearX=ddir>0?clamp(gkX+W*0.12,W*0.10,W*0.35):clamp(gkX-W*0.12,W*0.65,W*0.90);
      const safeY=clamp(gkY+(Math.random()-.5)*H*0.28,H*0.15,H*0.85);
      let bestKey=null,bestDist=Infinity;
      Object.keys(q).forEach(k=>{
        if(k==='GK'||!q[k]||!PP[ds][k])return;
        const d=Math.hypot(PP[ds][k].x-clearX,PP[ds][k].y-safeY);
        if(d<bestDist){bestDist=d;bestKey=k;}
      });
      G.phase='pass_anim';
      animateBallTo(gkX,gkY,clearX,safeY,()=>{
        ro.classList.remove('show');
        ball.x=clearX;ball.y=safeY;ball.tx=clearX;ball.ty=safeY;
        G.poss=ds;G.ck=bestKey||'CB1';G.tP++;if(ds==='h')G.hP++;
        if(PP[ds][G.ck]){PP[ds][G.ck].x=clearX;PP[ds][G.ck].y=safeY;}
        updP();G.kickoffUntil=Date.now()+1800;
        setTimeout(()=>{asnC();G.phase='moving';if(ds==='h')document.getElementById('passhint').style.display='block';},500);
      },30);
      return;
    }
    // spill
    const spillX=clamp(gkX+(dirFor(ds)>0?W*0.07:-W*0.07)+(Math.random()-.5)*W*0.08,W*0.04,W*0.96);
    const spillY=clamp(gkY+(Math.random()-.5)*H*0.22,H*0.12,H*0.88);
    let bSide=ds,bKey='CB1',bDist=Infinity;
    ['h','a'].forEach(side=>Object.keys(sq(side)).forEach(k=>{
      if(!sq(side)[k]||!PP[side][k]||(k==='GK'&&side===ds))return;
      const d=Math.hypot(PP[side][k].x-spillX,PP[side][k].y-spillY);
      if(d<bDist){bDist=d;bSide=side;bKey=k;}
    }));
    G.phase='pass_anim';
    animateBallTo(gkX,gkY,spillX,spillY,()=>{
      ro.classList.remove('show');
      ball.x=spillX;ball.y=spillY;ball.tx=spillX;ball.ty=spillY;
      G.poss=bSide;G.ck=bKey;G.tP++;if(bSide==='h')G.hP++;
      if(PP[bSide][bKey]){PP[bSide][bKey].x=spillX;PP[bSide][bKey].y=spillY;}
      updP();
      const winner=sq(bSide)[bKey];
      say((winner?winner.name:'—')+' wins the rebound!');
      G.kickoffUntil=Date.now()+1800;
      setTimeout(()=>{asnC();G.phase='moving';},500);
    },30);
  }; // end doResolve

  // Supersave: show GK cutscene first, then resolve
  if(isSuper&&gk){
    showSpecialCutscene(gk,getGKSuper(gk),doResolve);
  } else {
    doResolve();
  }
}
function afPass(s,tk){
  if(s==='h')G.mom=Math.min(100,G.mom+3); else G.mom=Math.max(0,G.mom-3);
  const q=sq(s); if(!tk||!q[tk]){resume(s,(q[G.ck]?q[G.ck].name:'Player')+' keeps the ball!');return;}
  // CPU passes also subject to three-outcome interception
  if(s==='a'){
    const fp2=PP[s][G.ck],tp=PP[s][tk];
    if(fp2&&tp){
      const ir=chkIntOutcome(fp2,tp,s);
      if(ir.interceptor){
        const ikey=ir.interceptor,ipos=PP.h[ikey]||tp,ipl=sq('h')[ikey];
        say((q[G.ck]?q[G.ck].name:'—')+(ir.outcome==='deflect'?' pass deflected!':(ipl?' pass cut by '+ipl.name+'!':' intercepted!')));
        animateBallTo(fp2.x,fp2.y,ipos.x,ipos.y,()=>{
          if(ir.outcome==='deflect'){
            const lx=lerp(fp2.x,ipos.x,0.5)+(Math.random()-.5)*W*.06;
            const ly=lerp(fp2.y,ipos.y,0.5)+(Math.random()-.5)*H*.06;
            ball.x=lx;ball.y=ly;ball.tx=lx;ball.ty=ly;
            let bS='h',bK=ikey,bD=Infinity;
            ['h','a'].forEach(side=>Object.keys(sq(side)).forEach(k=>{
              if(!sq(side)[k]||!PP[side][k])return;
              const d=Math.hypot(PP[side][k].x-lx,PP[side][k].y-ly);
              if(d<bD){bD=d;bS=side;bK=k;}
            }));
            G.poss=bS;G.ck=bK;G.tP++;if(bS==='h')G.hP++;
          }else{
            G.poss='h';G.ck=ikey;G.tP++;G.hP++;
            if(ipos){ball.x=ipos.x;ball.y=ipos.y;ball.tx=ipos.x;ball.ty=ipos.y;}
          }
          updP();G.phase='idle';
          setTimeout(()=>{asnC();G.phase='moving';document.getElementById('passhint').style.display='block';},950);
        },passDuration(fp2.x,fp2.y,ipos.x,ipos.y,26));
        return;
      }
    }
  }
  const receiverName=q[tk]?q[tk].name:'Teammate';
  // Offside check before completing pass
  if(checkOffside(s,tk))return;
  setC(tk,s); if(PP[s][tk]){ball.tx=PP[s][tk].x;ball.ty=PP[s][tk].y;} G_moveTarget=null;G_laneTarget=null; resume(s,receiverName+' receives!');
}

function afOneTwo(s,tk,oldCarrier){
  // 1-2 (wall pass) — teammate touches the ball back, original carrier receives
  // and has already advanced forward. Ball must return to the carrier.
  if(s==='h')G.mom=Math.min(100,G.mom+6); else G.mom=Math.max(0,G.mom-6);
  const q=sq(s), carrKey=oldCarrier?Object.keys(q).find(k=>q[k]===oldCarrier):null;
  if(!carrKey||!PP[s][carrKey]){
    // Fallback — original carrier not found, treat as pass
    if(tk&&q[tk]){setC(tk,s); if(PP[s][tk]){ball.tx=PP[s][tk].x;ball.ty=PP[s][tk].y;}}
    G_moveTarget=null;G_laneTarget=null;
    resume(s,'Give-and-go');
    return;
  }
  // Advance the original carrier forward — wall pass beats the press
  const dir=dirFor(s), cp=PP[s][carrKey];
  const gx=goalXFor(s);
  // Target advance: 12% pitch, but don't overshoot shot-gate zone or goal line
  let newX = cp.x + dir*W*.12;
  // Clamp to just inside shot zone — roughly 88% of pitch distance from own goal
  const maxX = dir>0 ? W*0.88 : W*0.12;
  newX = dir>0 ? Math.min(newX, maxX) : Math.max(newX, maxX);
  newX = clamp(newX, W*.05, W*.95);
  cp.x=newX;
  cp.y=lerp(cp.y,H*.5,0.15);
  PT[s][carrKey]={x:cp.x,y:cp.y};
  // Short grace — just enough for visual transition, then play resumes and shot gate can fire
  G.kickoffUntil=Math.max(G.kickoffUntil||0,Date.now()+800);
  // Keep carrier on the ball (ball returns after teammate's touch)
  setC(carrKey,s);
  ball.x=cp.x;ball.y=cp.y;ball.tx=cp.x;ball.ty=cp.y;
  // Stop auto-advance so the carrier stands at the shot-ready position instead of running past the goal
  G_moveTarget={x:cp.x,y:cp.y};
  G_laneTarget=cp.y;
  const wallName=tk&&q[tk]?q[tk].name:'teammate';
  resume(s,(oldCarrier?oldCarrier.name:'Carrier')+' gets it back from '+wallName+' — through on goal!');
}

function afSucc(s,c){
  // After dribble win — 1.5s before shot gate can fire (prevents ghost instant shot)
  G.kickoffUntil=Math.max(G.kickoffUntil||0,Date.now()+1200);
  if(s==='h')G.mom=Math.min(100,G.mom+4); else G.mom=Math.max(0,G.mom-4);
  const cp=PP[s][G.ck];
  if(cp){
    const dir=dirFor(s);
    let newX = cp.x + dir*W*.08;
    const maxX = dir>0 ? W*0.88 : W*0.12;
    newX = dir>0 ? Math.min(newX, maxX) : Math.max(newX, maxX);
    newX = clamp(newX, W*.05, W*.95);
    cp.x=newX;
    if(PT[s][G.ck])PT[s][G.ck]={x:cp.x,y:cp.y};
    ball.x=cp.x;ball.y=cp.y;ball.tx=cp.x;ball.ty=cp.y;
    G_moveTarget={x:cp.x,y:cp.y};G_laneTarget=cp.y;
  }
  resume(s,c?c.name+' beats the press — takes it forward!':'Through!');
}

function afTurn(ns){
  G.goalGen++;
  if(ns==='h')G.mom=Math.min(100,G.mom+6); else G.mom=Math.max(0,G.mom-6);
  // Foul check — defender won via tackle/block (not intercept)
  const defA=G.D.defA,attSide=G.D.as,dk=G.D.dk;
  if((defA==='tackle'||defA==='block')&&rollFoul(ns===attSide?G.D.ds:attSide, dk, attSide))return;
  G_moveTarget=null;G_laneTarget=null; const winnerKey=G.D.dk||null, pk=pickCarrierAfterWin(ns,winnerKey); G.poss=ns; G.ck=pk; G.tP++; if(ns==='h')G.hP++; if(PP[ns][pk]){ball.tx=PP[ns][pk].x;ball.ty=PP[ns][pk].y;} updP();
  const q=sq(ns); resume(ns,(q[pk]?q[pk].name:'Player')+' wins the ball!');
}
function updP(){
  const iH=G.poss==='h';
  document.getElementById('pdot').style.background=iH?'var(--blue)':'var(--red)';
  const t=iH?HT:AT;const c=sq(G.poss)[G.ck];
  document.getElementById('pname').textContent=(t?t.name.toUpperCase():'—')+' POSSESSION'+(c?' · '+c.name:'');
  const shotBtn=document.getElementById('fieldShotBtn');
  const pressBtn=document.getElementById('pressBtn');
  if(shotBtn){
    shotBtn.style.display=iH?'flex':'none';
    if(iH&&c){
      const cp=PP.h[G.ck];
      if(cp){
        const prog=progressFor('h',cp);
        const Z=ENGINE_CONFIG.duel.zones;
        let zone,col;
        if(prog<Z.longRange){zone='LONG';col='#aaa';}
        else if(prog<Z.midRange){zone='MID';col='#f0c040';}
        else if(prog<Z.boxEdge){zone='BOX';col='#ff9020';}
        else{zone='DEADLY';col='#ff3030';}
        shotBtn.textContent='SHOT · '+zone;
        shotBtn.style.background=col==='#aaa'?'rgba(100,100,100,.85)':`rgba(30,10,10,.85)`;
        shotBtn.style.borderColor=col;
        shotBtn.style.color=col;
      } else { shotBtn.textContent='SHOT'; }
    }
  }
  if(pressBtn)pressBtn.style.display=iH?'none':'flex';
  // Auto-cancel press the moment we regain the ball
  if(iH&&G.pressing){
    G.pressing=false;
    if(pressBtn){pressBtn.classList.remove('active');pressBtn.textContent='PRESS';}
  }
}

// Clock runs during duel — only pauses during idle transitions
function startMT(){
  clearInterval(G.mt);
  G.mt=setInterval(()=>{
    if(G.paused)return;
    if(G.phase==='idle')return;
    const inDuel=G.phase==='duel_result'||G.phase==='duel'||document.getElementById('duel-ov').classList.contains('show');
    if(inDuel&&Math.random()<0.55)return;
    if(G.tL<=0){clearInterval(G.mt);G.half===1?goHalf():goFull();return;}
    G.tL--;updH();
  },56);
}

// ── PAUSE ────────────────────────────────────────────────────────
function togglePause(){
  if(!G.mt)return;
  G.paused=!G.paused;
  const btn=document.getElementById('pauseBtn');
  const overlay=document.getElementById('pause-overlay');
  if(G.paused){
    btn.textContent='▶';btn.classList.add('paused');
    if(overlay)overlay.style.display='flex';
  } else {
    btn.textContent='⏸';btn.classList.remove('paused');
    if(overlay)overlay.style.display='none';
  }
}

// ── EVENT BANNER (offside / foul) ────────────────────────────────
function showEventBanner(text,type,duration=2200){
  const el=document.getElementById('event-banner');if(!el)return;
  el.textContent=text;
  el.className='event-banner '+(type||'');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),duration);
}

// ── OFFSIDE CHECK ─────────────────────────────────────────────────
// Call when attacker receives the ball — checks if they were behind last defender
function checkOffside(attackSide,slot){
  if(!G||G.phase!=='moving')return false;
  const defSide=attackSide==='h'?'a':'h';
  const attPos=PP[attackSide]?.[slot];
  if(!attPos)return false;
  // Find second-last defender (last outfield defender, GK excluded)
  const defenders=Object.entries(PP[defSide]||{})
    .filter(([k])=>k!=='GK')
    .map(([,p])=>p.y)
    .sort((a,b)=>attackSide==='h'?a-b:b-a); // sort toward attacking goal
  const lastDef=defenders[0]; // nearest defender to their own goal
  if(lastDef===undefined)return false;
  // Attacker offside if ahead of last defender (in direction of attack)
  const offside=attackSide==='h'?(attPos.y<lastDef):(attPos.y>lastDef);
  // Only flag in attacking half
  const inAttHalf=attackSide==='h'?(attPos.y<H/2):(attPos.y>H/2);
  if(offside&&inAttHalf){
    showEventBanner('⛳ OFFSIDE','offside');
    say('Offside! Free kick to '+(defSide==='h'?HT?.name:AT?.name)+'.');
    // Reset possession to defending team
    setTimeout(()=>{
      G.poss=defSide;
      const dk=Object.keys(sq(defSide)).find(k=>sq(defSide)[k]&&k!=='GK')||Object.keys(sq(defSide))[0];
      G.ck=dk;G.chk=null;
      if(PP[defSide]&&PP[defSide][dk]){PP[defSide][dk].x=attPos.x;PP[defSide][dk].y=attPos.y;}
      ball.x=attPos.x;ball.y=attPos.y;
      G.kickoffUntil=Date.now()+2000;
    },800);
    return true;
  }
  return false;
}

// ── FOUL SYSTEM ───────────────────────────────────────────────────
function rollFoul(defSide,defSlot,attSide){
  // 8% chance of foul on tackle
  if(Math.random()>0.08)return false;
  const defPl=sq(defSide)[defSlot];
  const defPos=PP[defSide]?.[defSlot];
  if(!defPos)return false;
  const inBox=defSide==='h'?(defPos.x>W*.35&&defPos.x<W*.65&&defPos.y>H*.75):(defPos.x>W*.35&&defPos.x<W*.65&&defPos.y<H*.25);
  const isPK=inBox&&Math.random()<0.4;
  const foulName=defPl?defPl.name.split('.').pop():'Defender';
  if(isPK){
    showEventBanner('🟥 PENALTY!','foul',3500);
    say(foulName+' brings them down — PENALTY KICK!');
    showReferee('PENALTY!');
  } else {
    showEventBanner('🟨 FOUL — FREE KICK','foul',3000);
    say(foulName+' — foul! Free kick awarded.');
    showReferee('FOUL');
  }
  // Close the duel overlay right away and lock the match into an idle grace.
  closeDuel();
  G.phase='idle';
  const ph=document.getElementById('passhint');if(ph)ph.style.display='none';
  // Freeze everyone visually during the foul pause — no movement at all
  G.kickoffUntil=Date.now()+(isPK?4000:3700);
  // Show a visible "FREE KICK" overlay banner for the full pause duration
  showFreeKickPause(isPK?'PENALTY!':'FREE KICK',foulName, isPK?3500:3200);
  // Award possession to attacking team at foul position after the pause
  setTimeout(()=>{
    G.poss=attSide;
    // Find the nearest attacking field player (not GK) to take the free kick
    const attQ=sq(attSide);
    const candidates=Object.keys(attQ).filter(k=>attQ[k]&&k!=='GK');
    let ak=candidates[0]||Object.keys(attQ)[0];
    if(candidates.length){
      let best=Infinity;
      candidates.forEach(k=>{
        const pp=PP[attSide]?.[k];
        if(!pp)return;
        const d=Math.hypot(pp.x-defPos.x,pp.y-defPos.y);
        if(d<best){best=d;ak=k;}
      });
    }
    G.ck=ak;G.chk=null;G_moveTarget=null;G_laneTarget=null;
    if(PP[attSide]&&PP[attSide][ak]){PP[attSide][ak].x=defPos.x;PP[attSide][ak].y=defPos.y;}
    ball.x=defPos.x;ball.y=defPos.y;ball.tx=defPos.x;ball.ty=defPos.y;
    // Penalty: place ball at penalty spot
    if(isPK){
      const pSpotY=attSide==='h'?H*.12:H*.88;
      ball.x=W/2;ball.y=pSpotY;ball.tx=W/2;ball.ty=pSpotY;
      if(PP[attSide][ak]){PP[attSide][ak].x=W/2;PP[attSide][ak].y=pSpotY;}
    }
    updP();
    // Resume play
    G.phase='moving';
    asnC();
    if(attSide==='h'){const ph2=document.getElementById('passhint');if(ph2)ph2.style.display='block';}
    G.kickoffUntil=Date.now()+1500;
  },isPK?3500:3200);
  return true;
}

// ── FREE KICK PAUSE OVERLAY ──────────────────────────────────────
// A prominent banner that makes fouls feel like a real stoppage.
function showFreeKickPause(title,foulName,duration){
  let el=document.getElementById('fk-overlay');
  if(!el){
    el=document.createElement('div');
    el.id='fk-overlay';
    el.className='fk-overlay';
    (document.getElementById('viewport')||document.body).appendChild(el);
  }
  el.innerHTML=`
    <div class="fk-card">
      <div class="fk-title">${title}</div>
      <div class="fk-sub">${foulName} fouled the attacker</div>
      <div class="fk-ref">REFEREE HAS WHISTLED</div>
    </div>`;
  el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  setTimeout(()=>{el.classList.remove('show');},duration);
}

function updH(){
  // tL counts DOWN from 2700→0. Convert to minutes counting UP.
  const elapsed=2400-G.tL; // seconds elapsed this half
  const matchSec=(G.half===1?0:45*60)+Math.round((elapsed/2400)*45*60);
  const m=Math.floor(matchSec/60),s=matchSec%60;
  document.getElementById('htime').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  document.getElementById('hhalf').textContent=G.half===1?'FIRST HALF':'SECOND HALF';
  const sch=document.getElementById('sc-h');const sca=document.getElementById('sc-a');
  sch.textContent=G.hG;sca.textContent=G.aG;
  // Winner score glows brighter
  sch.style.textShadow=G.hG>G.aG?'0 0 24px rgba(30,114,220,.9)':'0 0 12px rgba(30,114,220,.3)';
  sca.style.textShadow=G.aG>G.hG?'0 0 24px rgba(220,32,32,.9)':'0 0 12px rgba(220,32,32,.3)';
  // Possession strip
  const hp=Math.round(G.mom);
  const ps=document.getElementById('posstrip-h');if(ps)ps.style.width=hp+'%';
}

function goHalf(){
  clearInterval(G.mt);clearInterval(G.di);G.phase='idle';closeDuel();
  document.getElementById('passhint').style.display='none';
  document.getElementById('hth').textContent=G.hG;document.getElementById('ata').textContent=G.aG;
  document.getElementById('htd').textContent=G.duels;document.getElementById('hts').textContent=G.shots;
  const pp=G.tP>0?Math.round(G.hP/G.tP*100):50;document.getElementById('htp').textContent=pp+'%';
  document.getElementById('hht').textContent=HT?.name||'HOME';document.getElementById('aht').textContent=AT?.name||'AWAY';
  setTeamEmblem(document.getElementById('hht-flag'),selHome,HT?.flag||'🏳');setTeamEmblem(document.getElementById('aht-flag'),selAway,AT?.flag||'🏳');
  G.subsUsed=G.subsUsed||0;
  buildSubPanel();
  showSc('s-half');
  stopMatchMusic();
}

// ── HALFTIME SUBSTITUTIONS ────────────────────────────────────────
let HT_SUB_OUT=null; // slot key of player being subbed out

function buildSubPanel(){
  const subsLeft=3-(G.subsUsed||0);
  const el=document.getElementById('ht-subs-left');
  if(el)el.textContent=subsLeft+' remaining';
  buildSubPitchList();
  buildSubBenchList();
}

function buildSubPitchList(){
  const el=document.getElementById('ht-pitch-list');if(!el)return;el.innerHTML='';
  Object.entries(hSq).forEach(([slot,pl])=>{
    if(!pl)return;
    const row=document.createElement('div');
    row.className='ht-sub-row'+(HT_SUB_OUT===slot?' selected':'')+(pl._subOut?' out':'');
    const spPct=Math.round((pl.spirit||1500)/1500*100);
    const spEmoji=spPct>70?'💪':spPct>40?'😤':'😓';
    row.innerHTML=`<span class="ht-sub-pos">${slot}</span><span>${pl.name.split('.').pop()}</span><span class="ht-sub-spirit">${spEmoji}${spPct}%</span>`;
    if(!pl._subOut&&(G.subsUsed||0)<3){
      row.onclick=()=>{HT_SUB_OUT=HT_SUB_OUT===slot?null:slot;buildSubPanel();};
    }
    el.appendChild(row);
  });
}

function buildSubBenchList(){
  const el=document.getElementById('ht-bench-list');if(!el)return;el.innerHTML='';
  const benchIds=HOME_RESERVES||[];
  const allPlayers=HT?.p||[];
  benchIds.forEach(pid=>{
    const pl=allPlayers.find(p=>p.id===pid);if(!pl)return;
    const row=document.createElement('div');
    row.className='ht-sub-row';
    row.innerHTML=`<span class="ht-sub-pos">${pl.pos}</span><span>${pl.name.split('.').pop()}</span>`;
    if(HT_SUB_OUT&&(G.subsUsed||0)<3){
      row.onclick=()=>doSub(HT_SUB_OUT,pl);
    }
    el.appendChild(row);
  });
  if(!benchIds.length){el.innerHTML='<div style="font-size:11px;color:#48586a;padding:8px;">No bench players</div>';}
}

function doSub(outSlot,inPl){
  if(!outSlot||!inPl)return;
  const outPl=hSq[outSlot];if(!outPl)return;
  // Replace in hSq
  hSq[outSlot]={...inPl,slot:outSlot,spirit:Math.min(inPl.spirit||1500,1500),cooldownUntil:0,clubKey:outPl.clubKey};
  outPl._subOut=true;
  G.subsUsed=(G.subsUsed||0)+1;
  HT_SUB_OUT=null;
  say(outPl.name.split('.').pop()+' off → '+inPl.name.split('.').pop()+' on.');
  buildSubPanel();
}
function goFull(){
  clearInterval(G.mt);clearInterval(G.di);G.phase='idle';closeDuel();
  document.getElementById('passhint').style.display='none';
  stopMatchMusic();
  if(CAR.active&&CAR.pendingMatch){
    const pm=CAR.pendingMatch;
    // Engine ran user as "home" regardless of fixture. Map G.hG/aG back to real home/away.
    const realHg=pm.isHome?G.hG:G.aG, realAg=pm.isHome?G.aG:G.hG;
    crApply(crMyTable(),pm.home,pm.away,realHg,realAg);
    const r={md:pm.md,home:pm.home,away:pm.away,hg:realHg,ag:realAg,isHome:pm.isHome};
    CAR.myResults.push(r);
    crMyFix()[pm.md].forEach(m=>{
      if(m.home===CAR.myClub||m.away===CAR.myClub)return;
      const{hg,ag}=crSimMatch(m.home,m.away);
      crApply(crMyTable(),m.home,m.away,hg,ag);
    });
    crSimOtherDiv();CAR.matchday++;crSave();CAR.pendingMatch=null;
    crShowResult(r);returnToMenuMusic();return;
  }
  document.getElementById('fth').textContent=G.hG;document.getElementById('fta').textContent=G.aG;
  document.getElementById('ftd').textContent=G.duels;document.getElementById('fts').textContent=G.shots;
  document.getElementById('hft').textContent=HT?.name||'HOME';document.getElementById('aft').textContent=AT?.name||'AWAY';
  setTeamEmblem(document.getElementById('hft-flag'),selHome,HT?.flag||'🏳');setTeamEmblem(document.getElementById('aft-flag'),selAway,AT?.flag||'🏳');
  let wt='DRAW';
  if(G.hG>G.aG)wt=(HT?.name||'HOME').toUpperCase()+' WIN 🏆';
  else if(G.aG>G.hG)wt=(AT?.name||'AWAY').toUpperCase()+' WIN 🏆';
  document.getElementById('wtag').textContent=wt;showSc('s-end');
  returnToMenuMusic();
}
function secondHalf(){G.half=2;G.tL=2400;iPos();const q=sq('a');const kk=['CM2','CM1','ST'].find(k=>q[k])||Object.keys(q).find(k=>q[k]);G.poss='a';G.ck=kk;G.tP++;if(PP.a[kk]){PP.a[kk].x=W/2;PP.a[kk].y=H/2;}ball.x=W/2;ball.y=H/2;ball.tx=W/2;ball.ty=H/2;showSc('s-match');updH();updP();startMT();startAnim();startMatchMusic();say((AT?.name||'Away')+' kick off — 2nd half!');showReferee('2ND HALF');G.kickoffUntil=Date.now()+3000;G.phase='idle';setTimeout(()=>{asnC();G.phase='moving';},1200);}

function initMatch(){
  Object.values(hSq).forEach(p=>{if(p){p.spirit=(p.pos==="GK"?2000:1500);p.cooldownUntil=0;}});Object.values(aSq).forEach(p=>{if(p){p.spirit=(p.pos==="GK"?2000:1500);p.cooldownUntil=0;}});
  G={half:1,tL:2400,hG:0,aG:0,poss:'h',ck:null,chk:null,mom:50,duels:0,shots:0,hP:0,tP:0,phase:'idle',mt:null,di:null,D:{},pm:false,kickoffUntil:0,pressing:false,goalGen:0,paused:false,subsUsed:0};
  preloadSquadImages(); // start loading all player face images
  showSc('s-match');rsz();iPos();
  startMatchMusic();
  const sk=hSq['CM2']?'CM2':(hSq['CM1']?'CM1':'ST');G.poss='h';G.ck=sk;G.tP++;G.hP++;
  if(PP.h[sk]){PP.h[sk].x=W/2;PP.h[sk].y=H/2;}ball.x=W/2;ball.y=H/2;ball.tx=W/2;ball.ty=H/2;
  asnC();updP();updH();startMT();startAnim();
  document.getElementById('passhint').style.display='none';
  say('Kick off! '+HT.name+' vs '+AT.name+' — build from midfield.');
  showReferee('KICK OFF');
  G.kickoffUntil=Date.now()+3500;
  G.phase='idle';setTimeout(()=>{G.phase='moving';document.getElementById('passhint').style.display='block';},1200);
}
// ── FORMATION POPUP ──────────────────────────────────────────────
function openFormationPicker(){
  const grid=document.getElementById('formationGrid');
  grid.innerHTML='';
  Object.keys(FORMATIONS).forEach(name=>{
    const b=document.createElement('button');
    b.className='tm-fopt'+(name===activeHomeFormation?' active':'');
    b.innerHTML=`<span class="tm-fopt-name">${name}</span>`;
    b.onclick=()=>{
      activeHomeFormation=name;
      if(CAR.active){CAR.formation=name;if(T[CAR.myClub])T[CAR.myClub].formation=name;}
      // Remap existing slot assignments to new formation without re-running initHomeSlots
      // This prevents reserve players from being pulled into starter slots
      const newSlots=Object.keys(FORMATIONS[name].coords);
      const oldSlots=Object.keys(HOME_SLOT_ASSIGN);
      const newAssign={};
      const used=new Set();
      // Keep players that fit positionally in the new formation
      newSlots.forEach(slot=>{
        const pref=preferredPositionsForSlot(slot);
        const candidate=oldSlots.find(s=>{
          const pid=HOME_SLOT_ASSIGN[s];
          if(!pid||used.has(pid))return false;
          const pl=getHomeRosterOrdered().find(r=>r.id===pid);
          return pl&&pref.includes((pl.pos||'').toUpperCase());
        });
        if(candidate){const pid=HOME_SLOT_ASSIGN[candidate];newAssign[slot]=pid;used.add(pid);}
      });
      // Fill remaining slots with leftover starters
      newSlots.forEach(slot=>{
        if(newAssign[slot])return;
        const pid=oldSlots.map(s=>HOME_SLOT_ASSIGN[s]).find(pid=>pid&&!used.has(pid)&&!HOME_RESERVES.includes(pid));
        if(pid){newAssign[slot]=pid;used.add(pid);}
        else newAssign[slot]=null;
      });
      HOME_SLOT_ASSIGN=newAssign;
      buildFormationMenu();
      closeFormationPicker();
      if(CAR.active)crSave();
    };
    grid.appendChild(b);
  });
  document.getElementById('formationPopup').style.display='flex';
}
function closeFormationPicker(){
  document.getElementById('formationPopup').style.display='none';
}

// ── RESERVES ─────────────────────────────────────────────────────
let HOME_RESERVES=[null,null,null,null,null,null]; // 6 slots: index 0 = GK reserve, 1-5 = field
let dragSrc=null; // {type:'starter'|'reserve', slot/idx}

function buildReserves(){
  const container=document.getElementById('reserveSlots');
  if(!container)return;
  container.innerHTML='';
  const roster=getHomeRosterOrdered();
  HOME_RESERVES.forEach((pid,i)=>{
    const pl=pid?roster.find(r=>r.id===pid):null;
    const slot=document.createElement('div');
    slot.className='tm-res-slot'+(i===0?' gk':'');
    slot.dataset.idx=i;
    slot.title=i===0?'GK Reserve':'Reserve '+(i);

    // Face or placeholder
    const face=document.createElement('div');
    face.className='tm-res-face';
    if(pl){
      const img=playerImg(pl);
      const lastName=playerLastName(pl);
      if(img&&img.complete&&img.naturalWidth>0){
        face.style.backgroundImage=`url(assets/players/${lastName}.png)`;
        face.style.backgroundSize='130%';
        face.style.backgroundPosition='center 35%';
      } else {
        face.textContent=pl.name.split('.').pop()[0];
        face.classList.add('placeholder');
      }
    } else {
      face.textContent=i===0?'GK':'+';
      face.classList.add('empty');
    }
    slot.appendChild(face);

    if(pl){
      const nm=document.createElement('div');
      nm.className='tm-res-name';
      nm.textContent=playerSurname(pl.name);
      slot.appendChild(nm);
    }

    // Click to assign/remove — same two-tap logic as pitch cards
    slot.onclick=()=>handleReserveClick(i);
    slot.addEventListener('touchend',e=>{e.preventDefault();handleReserveClick(i);},{passive:false});

    container.appendChild(slot);
  });
}

function handleReserveClick(idx){
  const roster=getHomeRosterOrdered();
  const pid=HOME_RESERVES[idx];

  if(SELECTED_HOME_SLOT){
    // A pitch slot is selected — swap if GK rules allow
    if(pid){
      const pl=roster.find(r=>r.id===pid);
      if(SELECTED_HOME_SLOT==='GK' && pl && pl.pos!=='GK') return;
      if(SELECTED_HOME_SLOT!=='GK' && pl && pl.pos==='GK') return;
    }
    const prev=HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT];
    HOME_RESERVES[idx]=prev||null;
    HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT]=pid||null;
    SELECTED_HOME_SLOT=null;
    buildFormationMenu();
  } else {
    // No pitch slot selected — just select this reserve slot visually (highlight it)
    // Mark it so next pitch tap swaps with it
    // For now: just deselect everything cleanly
    document.querySelectorAll('.tm-res-slot.selected-res').forEach(s=>s.classList.remove('selected-res'));
    const el=document.querySelector(`.tm-res-slot[data-idx="${idx}"]`);
    if(el) el.classList.add('selected-res');
    // Hide inline roster — not needed
    const ir=document.getElementById('inlineRoster');
    if(ir) ir.style.display='none';
  }
}

function buildReserveRosterList(reserveIdx){
  const bench=document.getElementById('benchList');
  const benchTitle=document.getElementById('benchTitle');
  const inlineRoster=document.getElementById('inlineRoster');
  if(inlineRoster) inlineRoster.style.display='block';
  benchTitle.textContent='RESERVE '+(reserveIdx===0?'GK':reserveIdx)+' — TAP TO ASSIGN';
  const roster=getHomeRosterOrdered();
  const usedStarters=new Set(Object.values(HOME_SLOT_ASSIGN).filter(Boolean));
  bench.innerHTML='';
  // Clear button
  const clr=document.createElement('div');
  clr.className='tm-bench-item';
  clr.innerHTML='<div class="tm-bench-jersey" style="background:#2a0a0a;border-color:#f03030">✕</div><div class="tm-bench-main"><div class="tm-bench-name">Clear Slot</div></div>';
  clr.onclick=()=>{HOME_RESERVES[reserveIdx]=null;buildFormationMenu();};
  bench.appendChild(clr);

  roster.forEach(pl=>{
    // GK enforcement: slot 0 = GK only, others = no GK
    if(reserveIdx===0 && pl.pos!=='GK') return;
    if(reserveIdx!==0 && pl.pos==='GK') return;
    const inReserve=HOME_RESERVES.includes(pl.id);
    const inStarter=usedStarters.has(pl.id);
    const item=document.createElement('div');
    item.className='tm-bench-item'+(inReserve||inStarter?' active':'');
    const face=buildFaceEl(pl,'tm-bench-jersey');
    const main=document.createElement('div'); main.className='tm-bench-main';
    const nm=document.createElement('div'); nm.className='tm-bench-name'; nm.textContent=pl.name;
    const meta=document.createElement('div'); meta.className='tm-bench-meta';
    meta.textContent=(inStarter?'IN STARTING XI':inReserve?'IN RESERVES':'AVAILABLE')+' · '+pl.pos;
    main.appendChild(nm); main.appendChild(meta);
    const stats=document.createElement('div'); stats.className='tm-bench-stats';
    stats.innerHTML='SPD '+gs(pl,'spd')+'<br>PAS '+gs(pl,'pas');
    item.appendChild(face); item.appendChild(main); item.appendChild(stats);
    item.onclick=()=>{
      // Remove this player from wherever they currently are
      const inStarter=Object.keys(HOME_SLOT_ASSIGN).find(s=>HOME_SLOT_ASSIGN[s]===pl.id);
      const inRes=HOME_RESERVES.indexOf(pl.id);
      const prev=HOME_RESERVES[reserveIdx];
      if(inStarter) HOME_SLOT_ASSIGN[inStarter]=prev||null;
      else if(inRes!==-1 && inRes!==reserveIdx) HOME_RESERVES[inRes]=prev||null;
      HOME_RESERVES[reserveIdx]=pl.id;
      buildFormationMenu();
    };
    bench.appendChild(item);
  });
}

function handleDrop(targetType, targetId){
  if(!dragSrc)return;
  const roster=getHomeRosterOrdered();

  // GK enforcement helper
  const isGK=(pid)=>{ const pl=roster.find(r=>r.id===pid); return pl&&pl.pos==='GK'; };
  const targetIsGKSlot=(targetType==='starter'&&targetId==='GK')||(targetType==='reserve'&&targetId===0);
  const srcPid=dragSrc.type==='starter'?HOME_SLOT_ASSIGN[dragSrc.slot]:HOME_RESERVES[dragSrc.idx];
  if(targetIsGKSlot && srcPid && !isGK(srcPid)){ dragSrc=null; return; } // non-GK can't go to GK slot
  const targetPid=targetType==='starter'?HOME_SLOT_ASSIGN[targetId]:HOME_RESERVES[targetId];
  const srcIsGKSlot=(dragSrc.type==='starter'&&dragSrc.slot==='GK')||(dragSrc.type==='reserve'&&dragSrc.idx===0);
  if(srcIsGKSlot && targetPid && !isGK(targetPid)){ dragSrc=null; return; } // non-GK can't come back to GK slot

  if(dragSrc.type==='starter' && targetType==='starter'){
    if(dragSrc.slot===targetId){dragSrc=null;return;}
    const tmp=HOME_SLOT_ASSIGN[dragSrc.slot];
    HOME_SLOT_ASSIGN[dragSrc.slot]=HOME_SLOT_ASSIGN[targetId]||null;
    HOME_SLOT_ASSIGN[targetId]=tmp||null;
  } else if(dragSrc.type==='starter' && targetType==='reserve'){
    const pid=HOME_SLOT_ASSIGN[dragSrc.slot];
    const reservePid=HOME_RESERVES[targetId];
    HOME_SLOT_ASSIGN[dragSrc.slot]=reservePid||null;
    HOME_RESERVES[targetId]=pid||null;
  } else if(dragSrc.type==='reserve' && targetType==='starter'){
    const pid=HOME_RESERVES[dragSrc.idx];
    const starterPid=HOME_SLOT_ASSIGN[targetId];
    HOME_RESERVES[dragSrc.idx]=starterPid||null;
    HOME_SLOT_ASSIGN[targetId]=pid||null;
  } else if(dragSrc.type==='reserve' && targetType==='reserve'){
    if(dragSrc.idx===targetId){dragSrc=null;return;}
    const tmp=HOME_RESERVES[dragSrc.idx];
    HOME_RESERVES[dragSrc.idx]=HOME_RESERVES[targetId];
    HOME_RESERVES[targetId]=tmp;
  }
  dragSrc=null;
  buildFormationMenu();
}

// Helper: build a face element (for bench list items)
function buildFaceEl(pl, cls){
  const el=document.createElement('div');
  el.className=cls;
  const img=playerImg(pl);
  const lastName=playerLastName(pl);
  if(img&&img.complete&&img.naturalWidth>0){
    el.style.backgroundImage=`url(assets/players/${lastName}.png)`;
    el.style.backgroundSize='130%';
    el.style.backgroundPosition='center 35%';
    el.style.backgroundRepeat='no-repeat';
    el.style.borderRadius='8px';
  } else {
    el.textContent=pl.pos;
    el.style.display='flex';
    el.style.alignItems='center';
    el.style.justifyContent='center';
  }
  return el;
}

function buildFormationMenu(){
  if(!HT) return;
  const pf=document.getElementById('teamPreviewField');
  const titleEl=document.getElementById('teamMenuTitle');
  const badgeEl=document.getElementById('teamMenuBadge');
  const flagEl=document.getElementById('tmFlag');
  const formationVal=document.getElementById('formationVal');
  titleEl.textContent=HT.name.toUpperCase();
  badgeEl.textContent='FORMATION · '+activeHomeFormation;
  if(formationVal)formationVal.textContent=activeHomeFormation;
  if(flagEl) setTeamEmblem(flagEl, selHome, HT.flag);

  pf.innerHTML='';
  // Click on empty pitch area deselects current slot
  pf.onclick=(e)=>{ if(e.target===pf){ SELECTED_HOME_SLOT=null; updateSelectedSlotPanel(); } };
  const boxL=document.createElement("div"); boxL.className="tm-box"; pf.appendChild(boxL);
  const arc=document.createElement("div"); arc.className="tm-penalty-arc"; pf.appendChild(arc);





  const roster=getHomeRosterOrdered();
  // Remap x: formation x spans ~0.05 (GK) to ~0.58 (ST). Map that range to 0.05→0.93 of the half-pitch display
  const remapX=(x)=> 0.05 + (x - 0.05) / (0.60 - 0.05) * 0.88;
  Object.entries(FORMATIONS[activeHomeFormation].coords).forEach(([slot,coord])=>{
    const pid=HOME_SLOT_ASSIGN[slot];
    const pl=roster.find(r=>r.id===pid)||null;
    const card=document.createElement('button');
    card.type='button';
    const isGKSlot=slot==='GK';
    card.className='tm-card v6'+(slot===SELECTED_HOME_SLOT?' selected':'')+(isGKSlot?' gk-card':'');
    card.style.left=(remapX(coord.x)*100)+'%';
    card.style.top=(coord.y*100)+'%';
    card.dataset.slot=slot;
    if(pl){
      const lastName=playerLastName(pl);
      const img=playerImg(pl);
      const applyFace=(i)=>{
        card.style.backgroundImage=`url(assets/players/${lastName}.png)`;
        card.style.backgroundSize='160%';
        card.style.backgroundPosition='center 30%';
        card.style.backgroundRepeat='no-repeat';
      };
      if(img&&img.complete&&img.naturalWidth>0){
        applyFace();
      } else if(img&&img.src){
        // Image still loading — apply when ready, no full rebuild needed
        img.addEventListener('load',applyFace,{once:true});
      }
    }

    // Jersey number top-left
    const jerseyEl=document.createElement('div');
    jerseyEl.className='tm-card-jersey';
    jerseyEl.textContent=pl?(pl.jersey!=null?pl.jersey:''):(JERSEY[slot]||'?');
    card.appendChild(jerseyEl);

    // Name bottom
    const nm=document.createElement('div');
    nm.className='tm-card-name';
    nm.textContent=pl?playerSurname(pl.name):slot;
    card.appendChild(nm);
    if(pl){const ovrEl=document.createElement('div');ovrEl.className='tm-card-ovr';ovrEl.textContent=calcOvr(pl);card.appendChild(ovrEl);}

    // Simple reliable interaction:
    // First tap = select slot (highlighted in gold)
    // Second tap on another card = SWAP the two players
    // Works identically with mouse click and touch tap
    // Tap to select / second tap to swap
    card.onclick=function(e){
      e.stopPropagation();
      if(SELECTED_HOME_SLOT && SELECTED_HOME_SLOT!==slot){
        // GK enforcement: GK slot can only swap with another GK slot or empty
        const srcPid=HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT];
        const tgtPid=HOME_SLOT_ASSIGN[slot];
        const srcPl=srcPid?getHomeRosterOrdered().find(r=>r.id===srcPid):null;
        const tgtPl=tgtPid?getHomeRosterOrdered().find(r=>r.id===tgtPid):null;
        const srcIsGK=srcPl&&srcPl.pos==='GK';
        const tgtIsGK=tgtPl&&tgtPl.pos==='GK';
        // Block: GK going to non-GK slot, or non-GK going to GK slot
        if(srcIsGK && slot!=='GK'){ SELECTED_HOME_SLOT=null; updateSelectedSlotPanel(); return; }
        if(tgtIsGK && SELECTED_HOME_SLOT!=='GK'){ SELECTED_HOME_SLOT=null; updateSelectedSlotPanel(); return; }
        if(slot==='GK' && srcPl && !srcIsGK){ SELECTED_HOME_SLOT=null; updateSelectedSlotPanel(); return; }
        if(SELECTED_HOME_SLOT==='GK' && tgtPl && !tgtIsGK){ SELECTED_HOME_SLOT=null; updateSelectedSlotPanel(); return; }
        // Swap
        const tmp=HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT];
        HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT]=HOME_SLOT_ASSIGN[slot]||null;
        HOME_SLOT_ASSIGN[slot]=tmp||null;
        SELECTED_HOME_SLOT=slot;
        buildFormationMenu();
      } else {
        SELECTED_HOME_SLOT=slot;
        updateSelectedSlotPanel();
      }
    };

    pf.appendChild(card);
  });

  buildReserves();
  updateSelectedSlotPanel();
}

function updateSelectedSlotPanel(){
  const inlineRoster=document.getElementById('inlineRoster');
  if(inlineRoster) inlineRoster.style.display='none';
  const roster=getHomeRosterOrdered();
  const pl=SELECTED_HOME_SLOT?roster.find(r=>r.id===HOME_SLOT_ASSIGN[SELECTED_HOME_SLOT]):null;

  // Update pitch card highlights
  document.querySelectorAll('#teamPreviewField .tm-card.v6').forEach(c=>{
    c.classList.toggle('selected', c.dataset.slot===SELECTED_HOME_SLOT);
  });

  // Player info panel
  const slotLbl=document.getElementById('playerSlotLbl');
  const nameBig=document.getElementById('playerNameBig');
  const statsRow=document.getElementById('playerStatsRow');

  if(SELECTED_HOME_SLOT){
    if(slotLbl)slotLbl.textContent=displayPosLabel(SELECTED_HOME_SLOT)+' · '+slotFamily(SELECTED_HOME_SLOT);
    if(nameBig)nameBig.textContent=pl?pl.name:'Empty Slot';
    if(statsRow&&pl){
      statsRow.innerHTML=[['SPD',gs(pl,'spd')],['DRI',gs(pl,'dri')],['PAS',gs(pl,'pas')],['SHO',gs(pl,'sho')],['DEF',gs(pl,'def')],['POW',gs(pl,'pow')]].map(([l,v])=>
        `<div class="tm-pstat"><div class="tm-pstat-v">${v}</div><div class="tm-pstat-l">${l}</div></div>`
      ).join('');
      const special=getSpecial(pl);
      const gkSuper=pl.pos==='GK'?getGKSuper(pl):null;
      let skillHtml='';
      if(special){
        skillHtml=`<div class="tm-skill-badge"><span class="tm-skill-icon">${special.i}</span><div class="tm-skill-info"><div class="tm-skill-name">${special.l}</div><div class="tm-skill-type">SPECIAL SHOT</div></div><div class="tm-skill-cost">⚡${special.c||400}</div></div>`;
      } else if(gkSuper){
        skillHtml=`<div class="tm-skill-badge gk"><span class="tm-skill-icon">${gkSuper.i}</span><div class="tm-skill-info"><div class="tm-skill-name">${gkSuper.l}</div><div class="tm-skill-type">SUPER SAVE</div></div><div class="tm-skill-cost">⚡320</div></div>`;
      } else {
        skillHtml=`<div class="tm-skill-none">No special skill</div>`;
      }
      let skillEl=statsRow.parentNode.querySelector('.tm-skill-wrap');
      if(!skillEl){skillEl=document.createElement('div');skillEl.className='tm-skill-wrap';statsRow.parentNode.appendChild(skillEl);}
      skillEl.innerHTML=skillHtml;
      // Career-only: morale / status badge
      let moraleEl=statsRow.parentNode.querySelector('.tm-morale-wrap');
      if(pl.clubKey||pl.morale!==undefined){
        if(!moraleEl){moraleEl=document.createElement('div');moraleEl.className='tm-morale-wrap';statsRow.parentNode.appendChild(moraleEl);}
        const m=pl.morale||70;
        const emoji=m>=85?'😄':m>=70?'🙂':m>=50?'😐':m>=30?'😕':'😠';
        const status=pl.injured?`<span style="color:#ff5c5c">INJ ${pl.injuredGames||1}g</span>`:pl.suspended?`<span style="color:#ffb84a">SUS</span>`:`<span style="color:#6be37a">FIT</span>`;
        moraleEl.innerHTML=`<div class="tm-morale-row"><span class="tm-morale-lbl">MORALE</span><span class="tm-morale-val">${emoji} ${m}</span><span class="tm-morale-sep">·</span><span class="tm-morale-status">${status}</span></div>`;
      } else if(moraleEl){moraleEl.innerHTML='';}
    } else if(statsRow){
      statsRow.innerHTML='';
      const skillEl=statsRow.parentNode?.querySelector('.tm-skill-wrap');
      if(skillEl)skillEl.innerHTML='';
    }
  } else {
    if(slotLbl)slotLbl.textContent='SELECT A SLOT';
    if(nameBig)nameBig.textContent='Tap a player on the pitch';
    if(statsRow)statsRow.innerHTML='';
    const skillEl=statsRow?.parentNode?.querySelector('.tm-skill-wrap');
    if(skillEl)skillEl.innerHTML='';
  }

  buildBenchList();
}
function enterGame(){
  showSc('s-home');
  // Init first menu image
  const firstImg=document.getElementById('hm-img-friendly');
  if(firstImg)firstImg.classList.add('active');
  document.querySelectorAll('.hm-item').forEach(el=>{
    el.classList.toggle('active',el.dataset.img==='friendly');
  });
  _hmCurrent='friendly';
  // Start music (needs user gesture — splash button click qualifies)
  startMusic();
  try{
    const el=document.documentElement;
    const req=el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen;
    if(req){const p=req.call(el);if(p&&p.catch)p.catch(()=>{});}
  }catch(e){}
}

function checkOrientation(){
  const pw=document.getElementById('portrait-warn');
  if(!pw)return;
  const isPortrait=window.innerHeight>window.innerWidth;
  // Only show portrait warning during actual gameplay, not on splash/menus
  const activeScreen=document.querySelector('.screen.active');
  const inMatch=activeScreen&&activeScreen.id==='s-match';
  pw.classList.toggle('show',isPortrait&&inMatch);
}
window.addEventListener('resize',checkOrientation);
window.addEventListener('orientationchange',()=>setTimeout(checkOrientation,200));
document.addEventListener('fullscreenchange',()=>setTimeout(checkOrientation,100));
document.addEventListener('webkitfullscreenchange',()=>setTimeout(checkOrientation,100));
checkOrientation();
syncTeamSelections();
initHomeSlots();

// Canvas resize — handles mobile orientation changes and iOS Safari visual viewport
function rsz(){
  const pw=document.querySelector('.mviews');
  if(!pw)return;
  CV.width=pw.clientWidth;CV.height=pw.clientHeight;W=CV.width;H=CV.height;
}
window.addEventListener('resize',()=>{rsz();checkOrientation();});
window.addEventListener('orientationchange',()=>setTimeout(()=>{rsz();checkOrientation();},200));
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',()=>{rsz();checkOrientation();});
}
// ═══════════════════════════════════════════════════════
// CAREER MODE ENGINE
// ═══════════════════════════════════════════════════════
const CR_CLUBS={
  barcelona:{name:'FC Barcelona',div:1,ovr:91,star:'Ronaldinho',special:'Miracle Shot',colors:['#a50044','#004d98'],abbr:'FCB'},
  madrid:{name:'Real Madrid',div:1,ovr:92,star:'Zidane',special:null,colors:['#ffffff','#00529f'],abbr:'RMA'},
  manutd:{name:'Man United',div:1,ovr:88,star:'Beckham',special:null,colors:['#da291c','#fbe122'],abbr:'MUN'},
  mancity:{name:'Man City',div:1,ovr:87,star:'De Bruyne',special:null,colors:['#6cabdd','#1c2c5b'],abbr:'MCI'},
  juventus:{name:'Juventus',div:1,ovr:86,star:'Del Piero',special:'Drive Shot',colors:['#000000','#ffffff'],abbr:'JUV'},
  inter:{name:'Inter Milan',div:1,ovr:85,star:'Ronaldo',special:'Tiger Shot',colors:['#003f8a','#000000'],abbr:'INT'},
  chelsea:{name:'Chelsea FC',div:1,ovr:84,star:'Lampard',special:null,colors:['#034694','#ffffff'],abbr:'CHE'},
  napoli:{name:'Napoli',div:1,ovr:83,star:'Maradona',special:'Sky Rocket',colors:['#12a0c7','#ffffff'],abbr:'NAP'},
  psg:{name:'Paris SG',div:1,ovr:84,star:'Pierre',special:'Eiffel Shot',colors:['#004170','#da291c'],abbr:'PSG'},
  bayern:{name:'Bayern Munich',div:1,ovr:90,star:'Kahn',special:'Fire Shot',colors:['#dc052d','#0066b2'],abbr:'BAY'},
  ajax:{name:'Ajax',div:2,ovr:78,star:'Robben',special:null,colors:['#d2122e','#ffffff'],abbr:'AJX'},
  feyenoord:{name:'Feyenoord',div:2,ovr:75,star:'Kuyt',special:null,colors:['#cc0000','#000000'],abbr:'FEY'},
  atletico:{name:'Atletico Madrid',div:2,ovr:77,star:'Torres',special:null,colors:['#ce3524','#272e61'],abbr:'ATM'},
  genoa:{name:'Genoa CFC',div:2,ovr:72,star:'Skuhravy',special:null,colors:['#cc0000','#003087'],abbr:'GEN'},
  hamburg:{name:'SV Hamburg',div:2,ovr:74,star:'K.H.Schneider',special:'Fire Shot',colors:['#0033a0','#ffffff'],abbr:'HSV'},
  tokyo:{name:'FC Tokyo',div:2,ovr:71,star:'T.Ozora',special:'Drive Shot',colors:['#003087','#e60012'],abbr:'FCT'},
  marseille:{name:'Olympique Marseille',div:2,ovr:76,star:'Cantona',special:null,colors:['#2faee0','#ffffff'],abbr:'OM'},
  bremen:{name:'Werder Bremen',div:2,ovr:73,star:'Klose',special:null,colors:['#1d9053','#ffffff'],abbr:'WER'},
};
function crBadgeSvg(club,size=44){
  const c=club.colors||["#333","#666"],a=club.abbr||"??",s=size;
  return `<svg width="${s}" height="${s}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="sh"><path d="M22 2 L38 8 L38 30 Q38 40 22 42 Q6 40 6 30 L6 8 Z"/></clipPath></defs><path d="M22 2 L38 8 L38 30 Q38 40 22 42 Q6 40 6 30 L6 8 Z" fill="${c[0]}"/><rect x="6" y="22" width="32" height="20" fill="${c[1]}" clip-path="url(#sh)"/><path d="M22 2 L38 8 L38 30 Q38 40 22 42 Q6 40 6 30 L6 8 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><text x="22" y="26" text-anchor="middle" dominant-baseline="middle" font-family="Bebas Neue,sans-serif" font-size="${a.length>3?8:a.length===3?9:11}" fill="white" font-weight="bold" letter-spacing="0.5">${a}</text></svg>`;
}

const CR_D1=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===1);
const CR_D2=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===2);
const CR_REP=['UNKNOWN','PROMISING','RESPECTED','ESTABLISHED','ELITE','LEGENDARY'];
const CR_NAMES={
  barcelona:['Xavi','Puyol','Pique','Abidal','Alves','Busquets','Iniesta','Keita','Messi','Eto\'o','Henry'],
  madrid:['Casillas','Ramos','Pepe','Metzelder','Marcelo','Alonso','Gago','Sneijder','Robben','Higuain','Raul'],
  manutd:['VanderSar','G.Neville','Ferdinand','Vidic','Evra','Carrick','Scholes','Anderson','Nani','Rooney','Giggs'],
  mancity:['Hart','Richards','Lescott','Kompany','Clichy','Barry','De Bruyne','Silva','Milner','Tevez','Dzeko'],
  juventus:['Buffon','Barzagli','Bonucci','Chiellini','Grosso','Marchisio','Pirlo','Nedved','Del Piero','Trezeguet','Camoranesi'],
  inter:['Julio Cesar','Maicon','Lucio','Samuel','Zanetti','Cambiasso','Vieira','Sneijder','Stankovic','Milito','Pandev'],
  chelsea:['Cech','Bosingwa','Terry','Carvalho','Cole','Ballack','Lampard','Mikel','Drogba','Anelka','Malouda'],
  napoli:['De Sanctis','Maggio','Cannavaro','Campagnaro','Contini','Gargano','Hamsik','Inler','Lavezzi','Cavani','Callejon'],
  psg:['Sirigu','Camara','Sakho','Kombouare','Cissse','Makelele','Pastore','Menez','Gameiro','Hoarau','Erdinc'],
  bayern:['Kahn','Lahm','Demichelis','Van Buyten','Lizarazu','Schweinsteiger','Ballack','Ze Roberto','Ribery','Klose','Makaay'],
  ajax:['Stekelenburg','Vertonghen','Heitinga','Vermaelen','Van der Wiel','Van der Vaart','Sneijder','Bojan','Babel','Huntelaar','Suarez'],
  feyenoord:['Timmer','Mathijsen','Loovens','De Guzman','Bosvelt','Kuyt','Kalou','Van Persie','Castelen','Tomasson','Emnes'],
  atletico:['Aranzubia','Perea','Ujfalusi','Juanito','Filipe Luis','Tiago','Garcia','Seitaridis','Simao','Torres','Forlan'],
  genoa:['Rubinho','Juric','Moretti','Criscito','Bocchetti','Mesto','Milanetto','Rossi','Palacio','Milito','Sculli'],
  hamburg:['Rost','Aogo','De Jong','Mathijsen','Boateng','Demel','Jarolim','Van der Vaart','Guerrero','Olic','Petric'],
  tokyo:['Harakawa','Baba','Enomoto','Naotaka','Hayashi','Fujimoto','Tokita','Miyazawa','Hasebe','Nishizawa','Amano'],
  marseille:['Mandanda','Taiwo','Bonnart','Cesar','Heinze','Diawara','Valbuena','Koite','Niang','Cisse','Brandao'],
  bremen:['Wiese','Pasanen','Naldo','Mertesacker','Borowski','Diego','Hunt','Jensen','Almeida','Klose','Hugo'],
};
let CAR={active:false,myClub:null,season:1,d1:[...CR_D1],d2:[...CR_D2],d1Fix:[],d2Fix:[],d1Tab:{},d2Tab:{},matchday:0,myResults:[],pendingMatch:null,budget:2000000,reputation:1,trophies:[],formation:'4-3-3'};
function crMyDiv(){return CR_CLUBS[CAR.myClub]?.div||1;}
function crMyTable(){return crMyDiv()===1?CAR.d1Tab:CAR.d2Tab;}
function crMyFix(){return crMyDiv()===1?CAR.d1Fix:CAR.d2Fix;}
function crMyTeams(){return crMyDiv()===1?CAR.d1:CAR.d2;}
function crPts(t){return t.w*3+t.d;}
function crGD(t){return t.gf-t.ga;}
function crPlayed(t){return t.w+t.d+t.l;}
function crFmtMoney(n){return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?Math.round(n/1000)+'K':String(n);}
function crSort(table,keys){return[...keys].sort((a,b)=>{const ta=table[a],tb=table[b];if(crPts(tb)!==crPts(ta))return crPts(tb)-crPts(ta);if(crGD(tb)!==crGD(ta))return crGD(tb)-crGD(ta);return tb.gf-ta.gf;});}
function crCalcOvr(pl){if(!pl)return 60;const s=pl.spd||70,p=pl.pwr||70,t=pl.tec||70,d=pl.def||70;if(pl.pos==='GK')return Math.round(((pl.sav||d)*.45)+(p*.2)+(d*.2)+((pl.ref||p)*.15));if(['CB1','CB2'].includes(pl.pos))return Math.round(d*.45+p*.3+s*.15+t*.1);if(['LB','RB'].includes(pl.pos))return Math.round(d*.35+s*.25+p*.2+t*.2);if(['CM1','CM2','CM3'].includes(pl.pos))return Math.round(t*.35+s*.25+p*.2+d*.2);return Math.round(p*.35+t*.3+s*.25+d*.1);}
// ── BUILD CAREER CLUB AS A FULL TEAM OBJECT IN T[] ─────────────────
// Creates a team in the exact same shape as T.germany etc: {name, flag, p:[18 players], reserves:[7 ids]}
// Uses the star's name to hit the SPECIALS registry when applicable.
function crBuildClubTeam(clubKey){
  if(T[clubKey]&&T[clubKey]._career)return T[clubKey]; // already built
  const club=CR_CLUBS[clubKey];if(!club)return null;
  const tier=club.div,base=tier===1?74:64,range=tier===1?12:12;
  const names=[...(CR_NAMES[clubKey]||CR_NAMES.madrid)];
  const hash=clubKey.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0);
  const idBase=(hash*100)%90000+1000;
  // 11 starters + 7 reserves = 18 players. Slot assignments match friendly teams.
  const LINEUP=[
    {slot:'GK', pos:'GK', jersey:1},
    {slot:'LB', pos:'LB', jersey:3},
    {slot:'CB1',pos:'CB1',jersey:5},
    {slot:'CB2',pos:'CB2',jersey:4},
    {slot:'RB', pos:'RB', jersey:2},
    {slot:'CM1',pos:'CM1',jersey:6},
    {slot:'CM2',pos:'CM2',jersey:8},
    {slot:'CM3',pos:'CM3',jersey:10},
    {slot:'LW', pos:'LW', jersey:11},
    {slot:'ST', pos:'ST', jersey:9},
    {slot:'RW', pos:'RW', jersey:7},
    // reserves
    {slot:null, pos:'GK', jersey:12,reserve:true},
    {slot:null, pos:'CB1',jersey:13,reserve:true},
    {slot:null, pos:'LB', jersey:14,reserve:true},
    {slot:null, pos:'CM2',jersey:15,reserve:true},
    {slot:null, pos:'CM1',jersey:16,reserve:true},
    {slot:null, pos:'LW', jersey:17,reserve:true},
    {slot:null, pos:'ST', jersey:18,reserve:true},
  ];
  const rng=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
  const players=[];
  const reserveIds=[];
  LINEUP.forEach((row,i)=>{
    const isStar=row.slot==='ST',isGK=row.pos==='GK';
    const ovr=Math.max(50,base+rng(0,range));
    const sb=isStar?(tier===1?88:80):ovr;
    const name=isStar?club.star:(names[i]||'P.'+clubKey.slice(0,3)+(i+1));
    const pl={
      id:idBase+i,
      name,
      pos:row.pos,
      spd:Math.max(45,sb-rng(0,8)),
      pwr:Math.max(45,sb-rng(0,8)),
      tec:Math.max(45,sb-rng(0,8)),
      def:isGK?sb:(['LW','ST','RW'].includes(row.pos)?Math.max(40,sb-rng(12,20)):sb-rng(0,10)),
      rar:isStar?2:(sb>=80?2:1),
      jersey:row.jersey,
      clubKey,
      morale:70+rng(0,20),
      injured:false,
      injuredGames:0,
      suspended:false
    };
    if(isGK){pl.sav=Math.min(98,sb+rng(4,8));pl.ref=Math.min(98,sb+rng(0,5));}
    players.push(pl);
    if(row.reserve)reserveIds.push(pl.id);
  });
  // Pick a formation; default 4-3-3
  const formation='4-3-3';
  T[clubKey]={name:club.name,flag:club.abbr||'?',p:players,reserves:reserveIds,formation,_career:true};
  return T[clubKey];
}

// ── BACKWARDS-COMPAT STUBS (old career squad UI removed) ─────────
function crBuildSquad(clubKey){const t=crBuildClubTeam(clubKey);return t?t.p.slice(0,11).map((p,i)=>({...p,slot:p.pos,spirit:p.pos==='GK'?2000:1500,cooldownUntil:0})):[];}
function crMakeFixtures(teams){
  const ts=[...teams];if(ts.length%2!==0)ts.push('BYE');
  const half=ts.length/2,rds=ts.length-1,rounds=[];let list=[...ts];
  for(let r=0;r<rds;r++){const rd=[];for(let i=0;i<half;i++){const h=list[i],a=list[list.length-1-i];if(h!=='BYE'&&a!=='BYE')rd.push({home:h,away:a});}rounds.push(rd);list=[list[0],...list.slice(2),list[1]];}
  const leg1=[...rounds];leg1.forEach(rd=>rounds.push(rd.map(m=>({home:m.away,away:m.home}))));
  return rounds;
}
function crSimMatch(hk,ak){const h=CR_CLUBS[hk],a=CR_CLUBS[ak],diff=(h.ovr+3)-a.ovr;const hxg=Math.max(0,1.2+(diff/20)+(Math.random()-.3)*.8),axg=Math.max(0,1.2-(diff/20)+(Math.random()-.3)*.8);return{hg:Math.round(hxg+Math.random()*.6),ag:Math.round(axg+Math.random()*.6)};}
function crInitTable(keys){return Object.fromEntries(keys.map(k=>[k,{w:0,d:0,l:0,gf:0,ga:0,form:[]}]));}
function crApply(table,home,away,hg,ag){
  if(!table[home]||!table[away])return;
  table[home].gf+=hg;table[home].ga+=ag;table[away].gf+=ag;table[away].ga+=hg;
  if(hg>ag){table[home].w++;table[away].l++;table[home].form.push('W');table[away].form.push('L');}
  else if(hg<ag){table[away].w++;table[home].l++;table[away].form.push('W');table[home].form.push('L');}
  else{table[home].d++;table[away].d++;table[home].form.push('D');table[away].form.push('D');}
  [home,away].forEach(k=>{if(table[k].form.length>5)table[k].form.shift();});
}
function crInitSeason(){CAR.d1Fix=crMakeFixtures([...CAR.d1]);CAR.d2Fix=crMakeFixtures([...CAR.d2]);CAR.d1Tab=crInitTable(CAR.d1);CAR.d2Tab=crInitTable(CAR.d2);CAR.matchday=0;CAR.myResults=[];CAR.pendingMatch=null;}
function crSimOtherDiv(){const oFix=crMyDiv()===1?CAR.d2Fix:CAR.d1Fix,oTab=crMyDiv()===1?CAR.d2Tab:CAR.d1Tab,md=CAR.matchday;if(md<oFix.length)oFix[md].forEach(m=>{const{hg,ag}=crSimMatch(m.home,m.away);crApply(oTab,m.home,m.away,hg,ag);});}
const CR_KEY='ult11_career_v1';
function crSave(){if(!CAR.active)return;try{
  const myTeam=T[CAR.myClub];
  const rosterSnap=myTeam?{p:myTeam.p,reserves:myTeam.reserves,formation:myTeam.formation||activeHomeFormation}:null;
  localStorage.setItem(CR_KEY,JSON.stringify({
    myClub:CAR.myClub,season:CAR.season,matchday:CAR.matchday,myResults:CAR.myResults,
    d1Tab:CAR.d1Tab,d2Tab:CAR.d2Tab,d1:CAR.d1,d2:CAR.d2,
    budget:CAR.budget,reputation:CAR.reputation,trophies:CAR.trophies||[],
    roster:rosterSnap,slotAssign:HOME_SLOT_ASSIGN||{},reservesAssign:HOME_RESERVES||[],
    formation:activeHomeFormation||'4-3-3',
    divs:Object.fromEntries(Object.keys(CR_CLUBS).map(k=>[k,CR_CLUBS[k].div])),
    ovrs:Object.fromEntries(Object.keys(CR_CLUBS).map(k=>[k,CR_CLUBS[k].ovr]))
  }));
}catch(e){}}

// ── SQUAD MANAGEMENT — routes to friendly team editor (s-team) ─────
// Opened from career hub. Loads the user's club into HT and opens the existing team editor.
function crOpenSquad(){
  if(!CAR.active||!CAR.myClub)return;
  // Build the user's club as a T[] team if not done
  crBuildClubTeam(CAR.myClub);
  // Need an opponent in T as well so the team editor has a valid away side.
  // Use the next fixture opponent — if none, fall back to any other club.
  const fix=crMyFix();let oppKey=null;
  if(CAR.matchday<fix.length){
    const myMatch=fix[CAR.matchday].find(m=>m.home===CAR.myClub||m.away===CAR.myClub);
    if(myMatch)oppKey=myMatch.home===CAR.myClub?myMatch.away:myMatch.home;
  }
  if(!oppKey)oppKey=Object.keys(CR_CLUBS).find(k=>k!==CAR.myClub);
  crBuildClubTeam(oppKey);
  selHome=CAR.myClub;selAway=oppKey;HT=T[CAR.myClub];AT=T[oppKey];
  // Restore formation if persisted
  if(CAR.formation&&FORMATIONS[CAR.formation])activeHomeFormation=CAR.formation;
  G_teamEditorOrigin='career';
  openTeamMenu();
}

// Morale emoji helper (still used in hub / result popup if referenced)
function crMoraleEmoji(m){if(m>=85)return'😄';if(m>=70)return'🙂';if(m>=50)return'😐';if(m>=30)return'😕';return'😠';}

// Apply match effects after career match: morale shifts, injury/suspension rolls
function crApplyMatchEffects(won,drew){
  if(!T[CAR.myClub])return;
  T[CAR.myClub].p.forEach(pl=>{
    if(pl.morale===undefined)pl.morale=75;
    if(won)pl.morale=Math.min(100,pl.morale+Math.floor(Math.random()*8)+3);
    else if(drew)pl.morale=Math.max(20,pl.morale+Math.floor(Math.random()*4)-2);
    else pl.morale=Math.max(20,pl.morale-Math.floor(Math.random()*10)-3);
    if(pl.injured){pl.injuredGames=Math.max(0,(pl.injuredGames||1)-1);if(pl.injuredGames<=0)pl.injured=false;}
    if(pl.suspended)pl.suspended=false;
    if(!pl.injured&&Math.random()<0.03){pl.injured=true;pl.injuredGames=1+Math.floor(Math.random()*4);}
    if(!pl.suspended&&Math.random()<0.01)pl.suspended=true;
  });
  crSave();
}

function crLoad(){try{
  const d=JSON.parse(localStorage.getItem(CR_KEY)||'null');if(!d)return false;
  Object.assign(CAR,{
    myClub:d.myClub,season:d.season,matchday:d.matchday,myResults:d.myResults||[],
    d1Tab:d.d1Tab||{},d2Tab:d.d2Tab||{},d1:d.d1||[...CR_D1],d2:d.d2||[...CR_D2],
    budget:d.budget||2000000,reputation:d.reputation||1,trophies:d.trophies||[],
    formation:d.formation||'4-3-3',active:true,pendingMatch:null
  });
  if(d.divs)Object.entries(d.divs).forEach(([k,v])=>{if(CR_CLUBS[k])CR_CLUBS[k].div=v;});
  if(d.ovrs)Object.entries(d.ovrs).forEach(([k,v])=>{if(CR_CLUBS[k])CR_CLUBS[k].ovr=v;});
  // Restore user-club roster (morale, injuries, player state)
  if(d.roster&&d.roster.p&&CAR.myClub){
    const club=CR_CLUBS[CAR.myClub];
    T[CAR.myClub]={name:club.name,flag:club.abbr||'?',p:d.roster.p,reserves:d.roster.reserves||[],formation:d.roster.formation||'4-3-3',_career:true};
  }
  if(d.slotAssign)HOME_SLOT_ASSIGN=d.slotAssign;
  if(d.reservesAssign)HOME_RESERVES=d.reservesAssign;
  if(d.formation&&typeof activeHomeFormation!=='undefined')activeHomeFormation=d.formation;
  CAR.d1Fix=crMakeFixtures([...CAR.d1]);CAR.d2Fix=crMakeFixtures([...CAR.d2]);
  return true;
}catch(e){return false;}}
function crHasSave(){try{return!!localStorage.getItem(CR_KEY);}catch(e){return false;}}
function crDeleteSave(){try{localStorage.removeItem(CR_KEY);}catch(e){}CAR.active=false;CAR.myClub=null;}
function crBuildClubList(){
  const el=document.getElementById('cr-clubs-list');if(!el)return;el.innerHTML='';
  if(crHasSave()){
    const w=document.createElement('div');w.className='cr-save-row';
    const cb=document.createElement('button');cb.className='cr-continue-btn';cb.textContent='▶ CONTINUE CAREER';cb.onclick=()=>{if(crLoad()){showSc('s-career-hub');crRenderHub();}};
    const nb=document.createElement('button');nb.className='cr-newgame-btn';nb.textContent='NEW';nb.onclick=()=>{if(window.confirm('Delete saved career?')){crDeleteSave();crBuildClubList();}};
    w.appendChild(cb);w.appendChild(nb);el.appendChild(w);
  }
  [[1,'DIVISION 1 — ELITE'],[2,'DIVISION 2 — CHALLENGERS']].forEach(([div,label])=>{
    const hdr=document.createElement('div');hdr.className='cr-div-hdr';hdr.textContent=label;el.appendChild(hdr);
    Object.entries(CR_CLUBS).filter(([,c])=>c.div===div).forEach(([key,club])=>{
      const card=document.createElement('div');card.className='cr-club-card '+(div===1?'cr-d1':'cr-d2');
      card.innerHTML='<div class="cr-club-emoji">'+crBadgeSvg(club)+'</div><div class="cr-club-info"><div class="cr-club-name">'+club.name+'</div><div class="cr-club-meta">DIV '+div+' · OVR '+club.ovr+'</div>'+(club.star?'<div class="cr-club-star">⭐ '+club.star+(club.special?' · '+club.special:'')+'</div>':'')+'</div><div class="cr-club-ovr '+(div===1?'cr-d1':'cr-d2')+'">'+club.ovr+'<span>OVR</span></div>';
      card.onclick=()=>crStart(key);el.appendChild(card);
    });
  });
}
function crStart(clubKey){CAR.myClub=clubKey;CAR.season=1;CAR.active=true;CAR.budget=2000000;CAR.reputation=1;CAR.trophies=[];CAR.d1=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===1);CAR.d2=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===2);delete T[clubKey];crBuildClubTeam(clubKey);HOME_SLOT_ASSIGN={};HOME_RESERVES=[null,null,null,null,null,null];crInitSeason();showSc('s-career-hub');crRenderHub();}
function crRenderHub(){
  const club=CR_CLUBS[CAR.myClub];if(!club)return;
  document.getElementById('cr-emblem').innerHTML=crBadgeSvg(club,40);
  document.getElementById('cr-clubname').textContent=club.name;
  document.getElementById('cr-divlbl').textContent='DIV '+crMyDiv()+' · '+(CR_REP[CAR.reputation||1]||'UNKNOWN');
  document.getElementById('cr-season').textContent='SEASON '+CAR.season;
  document.getElementById('cr-md').textContent='MATCHDAY '+(CAR.matchday+1)+' / '+crMyFix().length;
  const budEl=document.getElementById('cr-budget');if(budEl)budEl.textContent='$'+crFmtMoney(CAR.budget||0);
  crRenderTable();crRenderFixture();crRenderRecent();crRenderStats();
}
function crRenderTable(){
  const div=crMyDiv(),teams=crMyTeams(),table=crMyTable(),sorted=crSort(table,teams);
  const el=document.getElementById('cr-table-body');if(!el)return;el.innerHTML='';
  const hdr=document.createElement('div');hdr.className='cr-trow cr-thdr';
  hdr.innerHTML='<span>#</span><span>CLUB</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>PTS</span>';el.appendChild(hdr);
  sorted.forEach((key,i)=>{
    const t=table[key],club=CR_CLUBS[key],isMe=key===CAR.myClub;
    if(div===1&&i===sorted.length-2){const ln=document.createElement('div');ln.className='cr-rline cr-rline-rel';el.appendChild(ln);}
    if(div===2&&i===2){const ln=document.createElement('div');ln.className='cr-rline cr-rline-pro';el.appendChild(ln);}
    const row=document.createElement('div');row.className='cr-trow'+(isMe?' cr-me':'');
    const gd=crGD(t);
    row.innerHTML='<span class="cr-tpos">'+(i+1)+'</span><span class="cr-tname">'+(isMe?'▶ ':'')+club.name+'</span><span>'+crPlayed(t)+'</span><span>'+t.w+'</span><span>'+t.d+'</span><span>'+t.l+'</span><span class="'+(gd>=0?'cr-pos':'cr-neg')+'">'+(gd>0?'+':'')+gd+'</span><span class="cr-tpts">'+crPts(t)+'</span>';
    el.appendChild(row);
    if(isMe){const pos=i+1;document.getElementById('cr-position').textContent=pos+(['ST','ND','RD'][pos-1]||'TH');document.getElementById('cr-pts-line').textContent=crPts(t)+' PTS · GD '+(gd>0?'+':'')+gd;}
  });
}
function crRenderFixture(){
  const fix=crMyFix(),el=document.getElementById('cr-fixture-area');if(!el)return;
  document.getElementById('cr-fix-md').textContent='MD'+(CAR.matchday+1);
  if(CAR.matchday>=fix.length){el.innerHTML='<div class="cr-bye">SEASON COMPLETE</div>';return;}
  const rd=fix[CAR.matchday],myMatch=rd.find(m=>m.home===CAR.myClub||m.away===CAR.myClub);
  if(!myMatch){el.innerHTML='<div class="cr-bye">BYE WEEK</div>';return;}
  const hc=CR_CLUBS[myMatch.home],ac=CR_CLUBS[myMatch.away],isH=myMatch.home===CAR.myClub;
  el.innerHTML='<div class="cr-fix-inner"><div class="cr-fix-label">'+(isH?'HOME':'AWAY')+'</div><div class="cr-fix-teams"><div class="cr-fix-team"><div class="cr-fix-emoji">'+hc.emoji+'</div><div class="cr-fix-name">'+hc.name+'</div><div class="cr-fix-ovr">OVR '+hc.ovr+'</div></div><div class="cr-fix-vs">VS</div><div class="cr-fix-team"><div class="cr-fix-emoji">'+ac.emoji+'</div><div class="cr-fix-name">'+ac.name+'</div><div class="cr-fix-ovr">OVR '+ac.ovr+'</div></div></div></div>';
}
function crRenderRecent(){
  const el=document.getElementById('cr-results-body');if(!el)return;el.innerHTML='';
  const recent=[...CAR.myResults].reverse().slice(0,5);
  if(!recent.length){el.innerHTML='<div class="cr-empty">No matches yet</div>';return;}
  recent.forEach(r=>{
    const isH=r.isHome,myG=isH?r.hg:r.ag,oppG=isH?r.ag:r.hg;
    const outcome=myG>oppG?'win':myG<oppG?'loss':'draw';
    const row=document.createElement('div');row.className='cr-result-row';
    row.innerHTML='<span class="cr-rmd">MD'+(r.md+1)+'</span><span class="cr-rhome">'+CR_CLUBS[r.home].name+'</span><span class="cr-rscore '+outcome+'">'+r.hg+'–'+r.ag+'</span><span class="cr-raway">'+CR_CLUBS[r.away].name+'</span>';
    el.appendChild(row);
  });
}
function crRenderStats(){
  const el=document.getElementById('cr-stats-body');if(!el)return;
  const t=crMyTable()[CAR.myClub]||{w:0,d:0,l:0,gf:0,ga:0};
  el.innerHTML='<div class="cr-stats-grid"><div class="cr-stat"><span>PLAYED</span><strong>'+crPlayed(t)+'</strong></div><div class="cr-stat"><span>POINTS</span><strong>'+crPts(t)+'</strong></div><div class="cr-stat"><span>WINS</span><strong>'+t.w+'</strong></div><div class="cr-stat"><span>DRAWS</span><strong>'+t.d+'</strong></div><div class="cr-stat"><span>FOR</span><strong>'+t.gf+'</strong></div><div class="cr-stat"><span>AGAINST</span><strong>'+t.ga+'</strong></div></div>';
}
function crSimAll(){
  const fix=crMyFix();if(CAR.matchday>=fix.length){crEndSeason();return;}
  const rd=fix[CAR.matchday],table=crMyTable();let myR=null;
  rd.forEach(m=>{const{hg,ag}=crSimMatch(m.home,m.away);crApply(table,m.home,m.away,hg,ag);if(m.home===CAR.myClub||m.away===CAR.myClub){const isHome=m.home===CAR.myClub;myR={md:CAR.matchday,home:m.home,away:m.away,hg,ag,isHome};CAR.myResults.push(myR);}});
  crSimOtherDiv();CAR.matchday++;crSave();
  if(myR)crShowResult(myR);else{crRenderHub();if(CAR.matchday>=fix.length)setTimeout(crEndSeason,400);}
}
function crSimNext(){crSimAll();}
function crPlay(){
  const fix=crMyFix();if(CAR.matchday>=fix.length){crEndSeason();return;}
  const rd=fix[CAR.matchday],myMatch=rd.find(m=>m.home===CAR.myClub||m.away===CAR.myClub);
  if(!myMatch){crSimAll();return;}
  const isHome=myMatch.home===CAR.myClub,oppKey=isHome?myMatch.away:myMatch.home;
  CAR.pendingMatch={home:myMatch.home,away:myMatch.away,isHome,md:CAR.matchday,oppKey};
  // Build both clubs as real T[] teams and route through the friendly team editor.
  crBuildClubTeam(CAR.myClub);
  crBuildClubTeam(oppKey);
  // Always put user's club as the "home" side in the editor (HT) so they edit their own squad.
  // Real home/away is preserved in CAR.pendingMatch.isHome and applied at match end.
  selHome=CAR.myClub;selAway=oppKey;
  HT=T[selHome];AT=T[selAway];
  if(CAR.formation&&FORMATIONS[CAR.formation])activeHomeFormation=CAR.formation;
  G_teamEditorOrigin='career';
  openTeamMenu();
}
function crShowResult(r){
  const isH=r.isHome,myG=isH?r.hg:r.ag,oppG=isH?r.ag:r.hg;
  const outcome=myG>oppG?'win':myG<oppG?'loss':'draw';
  crApplyMatchEffects(outcome==='win',outcome==='draw');
  const oppKey=isH?r.away:r.home,pos=crSort(crMyTable(),crMyTeams()).indexOf(CAR.myClub)+1;
  document.getElementById('cr-res-md').textContent='MATCHDAY '+(r.md+1)+' · SEASON '+CAR.season;
  document.getElementById('cr-res-home').textContent=CR_CLUBS[r.home].name;
  document.getElementById('cr-res-away').textContent=CR_CLUBS[r.away].name;
  document.getElementById('cr-res-score').textContent=r.hg+'–'+r.ag;
  document.getElementById('cr-res-score').className='cr-res-score '+outcome;
  const out=document.getElementById('cr-res-outcome');out.textContent=outcome==='win'?'VICTORY!':outcome==='loss'?'DEFEAT':'DRAW';out.className='cr-res-outcome '+outcome;
  document.getElementById('cr-res-box').className='cr-res-box '+outcome;
  document.getElementById('cr-res-detail').textContent=(isH?'HOME':'AWAY')+' · VS '+CR_CLUBS[oppKey].name.toUpperCase()+' · POSITION: '+pos+(['ST','ND','RD'][pos-1]||'TH');
  showSc('s-career-result');
}
function crCloseResult(){showSc('s-career-hub');crRenderHub();if(CAR.matchday>=crMyFix().length)setTimeout(crEndSeason,500);}
function crEndSeason(){
  const d1s=crSort(CAR.d1Tab,CAR.d1),d2s=crSort(CAR.d2Tab,CAR.d2);
  const relegated=[d1s[d1s.length-2],d1s[d1s.length-1]],promoted=[d2s[0],d2s[1]];
  const myPos=(crMyDiv()===1?d1s:d2s).indexOf(CAR.myClub)+1;
  const isPromoted=promoted.includes(CAR.myClub),isRelegated=relegated.includes(CAR.myClub);
  const isChampion=(crMyDiv()===1&&d1s[0]===CAR.myClub)||(crMyDiv()===2&&d2s[0]===CAR.myClub);
  const club=CR_CLUBS[CAR.myClub];
  if(isChampion){if(!CAR.trophies)CAR.trophies=[];CAR.trophies.push((crMyDiv()===1?'D1':'D2')+' S'+CAR.season);}
  let repGain=0;if(isChampion&&crMyDiv()===1)repGain=2;else if(isChampion)repGain=1;else if(myPos<=3&&crMyDiv()===1)repGain=1;else if(myPos>=9&&crMyDiv()===1)repGain=-1;
  CAR.reputation=Math.max(1,Math.min(5,(CAR.reputation||1)+repGain));
  const prizes=[500000,350000,250000,150000,100000,80000,60000,50000,40000,30000];
  CAR.budget=(CAR.budget||0)+prizes[Math.min(myPos-1,prizes.length-1)];
  relegated.forEach(k=>{if(CR_CLUBS[k])CR_CLUBS[k].div=2;});promoted.forEach(k=>{if(CR_CLUBS[k])CR_CLUBS[k].div=1;});
  if(isPromoted)CR_CLUBS[CAR.myClub].div=1;if(isRelegated)CR_CLUBS[CAR.myClub].div=2;
  Object.keys(CR_CLUBS).forEach(k=>{const cl=CR_CLUBS[k];let d=d1s[0]===k||d2s[0]===k?2:promoted.includes(k)?1:relegated.includes(k)?-1:Math.random()>.6?1:0;cl.ovr=Math.max(60,Math.min(95,cl.ovr+d));});
  crSave();
  document.getElementById('cr-se-title').textContent=isChampion?'CHAMPIONS!':'SEASON COMPLETE';
  document.getElementById('cr-se-sub').textContent=club.name+' · SEASON '+CAR.season;
  const body=document.getElementById('cr-season-body');body.innerHTML='';
  const hero=document.createElement('div');hero.className='cr-season-hero';
  const headCol=isChampion?'var(--gold)':isPromoted?'var(--sp)':isRelegated?'var(--red)':'var(--w)';
  hero.innerHTML='<div class="cr-trophy">'+(isChampion?'🏆':isPromoted?'⬆️':isRelegated?'⬇️':'📋')+'</div><div class="cr-season-headline" style="color:'+headCol+'">'+(isChampion?'CHAMPIONS!':isPromoted?'PROMOTED!':isRelegated?'RELEGATED':'SEASON DONE')+'</div><div class="cr-season-sub">'+club.name+' · DIV '+crMyDiv()+' · '+myPos+(['ST','ND','RD'][myPos-1]||'TH')+' PLACE</div>';
  body.appendChild(hero);
  const t=crMyTable()[CAR.myClub]||{w:0,d:0,l:0,gf:0,ga:0};
  const si=document.createElement('div');si.className='cr-panel cr-season-stats';
  si.innerHTML='<div class="cr-panel-hdr">YOUR SEASON</div><div class="cr-stats-grid"><div class="cr-stat"><span>PLAYED</span><strong>'+crPlayed(t)+'</strong></div><div class="cr-stat"><span>WINS</span><strong>'+t.w+'</strong></div><div class="cr-stat"><span>DRAWN</span><strong>'+t.d+'</strong></div><div class="cr-stat"><span>LOST</span><strong>'+t.l+'</strong></div><div class="cr-stat"><span>FOR</span><strong>'+t.gf+'</strong></div><div class="cr-stat"><span>AGAINST</span><strong>'+t.ga+'</strong></div></div>';
  body.appendChild(si);
  [[promoted,'PROMOTED ↑','var(--sp)','→ D1'],[relegated,'RELEGATED ↓','var(--red)','→ D2']].forEach(([teams,label,col,suffix])=>{
    const mv=document.createElement('div');mv.className='cr-panel';
    mv.innerHTML='<div class="cr-panel-hdr" style="color:'+col+'">'+label+'</div><div class="cr-panel-body">'+teams.map(k=>'<div class="cr-move-row"><span>'+crBadgeSvg(CR_CLUBS[k],20)+'</span><span>'+CR_CLUBS[k].name+'</span><span style="color:'+col+'">'+suffix+'</span></div>').join('')+'</div>';
    body.appendChild(mv);
  });
  const btn=document.createElement('button');btn.className='cr-next-season';btn.textContent='▶ BEGIN SEASON '+(CAR.season+1);
  btn.onclick=()=>{CAR.season++;CAR.d1=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===1);CAR.d2=Object.keys(CR_CLUBS).filter(k=>CR_CLUBS[k].div===2);crInitSeason();crSave();showSc('s-career-hub');crRenderHub();};
  body.appendChild(btn);
  showSc('s-career-season');
}
