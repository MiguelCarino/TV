/* =====================================================================
   catalog.js — seed channel catalog for the Carino TV
   ---------------------------------------------------------------------
   This is the built-in list. Users can add, edit, hide or delete entries
   from the UI; their changes live in localStorage and are merged on top
   of this seed (see app.js -> loadChannels()).

   Channel shape:
   {
     id:       unique string (stable — used in shareable URLs)
     name:     display title
     desc:     subtitle / network / owner
     category: category id (see CATEGORIES below)
     logo:     image url (local or remote). Empty -> initials avatar.
     provider: 'yt-channel' | 'yt-video' | 'vk' | 'rutube' | 'odysee'
               | 'twitch' | 'iframe'
     source:   meaning depends on provider:
                 yt-channel -> UC… channel id (embeds its live stream)
                 yt-video   -> 11-char video id
                 twitch     -> channel login name
                 vk/rutube/odysee/iframe -> full embeddable URL
     note:     optional small badge text (e.g. "Not 24/7")
   }
   ===================================================================== */

window.MV_CATALOG = {
  categories: [
    { id: 'international', name: 'International', flag: '🌐' },
    { id: 'usa',           name: 'United States', flag: '🇺🇸' },
    { id: 'uk',            name: 'United Kingdom', flag: '🇬🇧' },
    { id: 'argentina',     name: 'Argentina',     flag: '🇦🇷' },
    { id: 'colombia',      name: 'Colombia',      flag: '🇨🇴' },
    { id: 'mexico',        name: 'Mexico',        flag: '🇲🇽' },
    { id: 'japan',         name: 'Japan',         flag: '🇯🇵' },
    { id: 'korea',         name: 'South Korea',   flag: '🇰🇷' },
    { id: 'france',        name: 'France',        flag: '🇫🇷' },
    { id: 'spain',         name: 'Spain',         flag: '🇪🇸' },
    { id: 'italy',         name: 'Italy',         flag: '🇮🇹' },
    { id: 'brazil',        name: 'Brazil',        flag: '🇧🇷' },
    { id: 'canada',        name: 'Canada',        flag: '🇨🇦' },
    { id: 'india',         name: 'India',         flag: '🇮🇳' },
    { id: 'turkey',        name: 'Türkiye',       flag: '🇹🇷' },
    { id: 'china',         name: 'China / Taiwan', flag: '🇨🇳' },
    { id: 'germany',       name: 'Germany',       flag: '🇩🇪' },
    { id: 'ukraine',       name: 'Ukraine',       flag: '🇺🇦' },
    { id: 'israel',        name: 'Israel',        flag: '🇮🇱' },
    { id: 'portugal',      name: 'Portugal',      flag: '🇵🇹' },
    { id: 'poland',        name: 'Poland',        flag: '🇵🇱' },
    { id: 'netherlands',   name: 'Netherlands',   flag: '🇳🇱' },
    { id: 'greece',        name: 'Greece',        flag: '🇬🇷' },
    { id: 'philippines',   name: 'Philippines',   flag: '🇵🇭' },
    { id: 'australia',     name: 'Australia',     flag: '🇦🇺' },
    { id: 'russia',        name: 'Russia',        flag: '🇷🇺' },
    { id: 'africa',        name: 'Africa',        flag: '🌍' },
    { id: 'weather',       name: 'Weather',       flag: '🌦️' },
    { id: 'earthquake',    name: 'Earthquakes',   flag: '📈' },
    { id: 'livecams',      name: 'Live Cams',     flag: '📷' },
    { id: 'airtraffic',    name: 'Air Traffic',   flag: '✈️' },
    { id: 'space',         name: 'Space',         flag: '🛰️' },
  ],

  channels: [
    /* ---- International ---- */
    { id: 'int01', name: 'Sky News',              desc: 'Sky Group',                  category: 'international', logo: 'logos/int01.webp', provider: 'yt-channel', source: 'UCoMdktPbSTixAyNGwb-UYkQ' },
    { id: 'int02', name: 'Euronews English',      desc: 'Euronews',                   category: 'international', logo: 'logos/int02.webp', provider: 'yt-channel', source: 'UCSrZ3UV4jOidv8ppoVuvW9Q' },
    { id: 'int03', name: 'Euronews Spanish',      desc: 'Euronews',                   category: 'international', logo: 'logos/int02.webp', provider: 'yt-channel', source: 'UCyoGb3SMlTlB8CLGVH4c8Rw' },
    { id: 'int04', name: 'CNA',                   desc: 'Mediacorp — Channel NewsAsia',category: 'international', logo: 'logos/int04.webp', provider: 'yt-channel', source: 'UC83jt4dlz1Gjl58fzQrrKZg' },
    { id: 'int05', name: 'DW English',            desc: 'Deutsche Welle — Germany',   category: 'international', logo: 'logos/int05.webp', provider: 'yt-channel', source: 'UCknLrEdhRCp1aegoMqRaCZg' },
    { id: 'int06', name: 'DW Español',            desc: 'Deutsche Welle — Germany',   category: 'international', logo: 'logos/int05.webp', provider: 'yt-channel', source: 'UCT4Jg8h03dD0iN3Pb5L0PMA' },
    { id: 'int09', name: 'Al Jazeera English',    desc: 'Al Jazeera Media Network',   category: 'international', logo: 'logos/int09.webp', provider: 'yt-channel', source: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
    { id: 'int10', name: 'Agenda-Free TV',        desc: 'Independent',                category: 'international', logo: 'logos/int10.webp', provider: 'yt-channel', source: 'UCshCsg1YVKli8yBai-wa78w', note: 'Breaking news only' },
    { id: 'int11', name: 'WION',                  desc: 'Essel Group — India',        category: 'international', logo: 'logos/int11.webp', provider: 'yt-channel', source: 'UC_gUM8rL-Lrg6O3adPW9K1g' },
    { id: 'int12', name: 'NHK World-Japan',       desc: 'NHK — Japan',                category: 'international', logo: '', provider: 'yt-channel', source: 'UCSPEjw8F2nQDtmUKPFNF7_A' },
    { id: 'int13', name: 'CNBC International',     desc: 'CNBC — business',            category: 'international', logo: '', provider: 'yt-channel', source: 'UCo7a6riBFJ3tkeHjvkXPn1g', note: 'Not 24/7' },
    { id: 'int14', name: 'Al Jazeera Arabic',     desc: 'الجزيرة — Al Jazeera',        category: 'international', logo: '', provider: 'yt-channel', source: 'UCfiwzLy-8yKzIbsmZTzxDgw' },
    { id: 'hls01', name: 'DW English (HLS)',      desc: 'Deutsche Welle — direct HLS', category: 'international', logo: '', provider: 'hls', source: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
    { id: 'hls04', name: 'TRT World (HLS)',       desc: 'TRT — direct HLS',           category: 'international', logo: '', provider: 'hls', source: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8' },
    { id: 'hls05', name: 'Red Bull TV (HLS)',     desc: 'Red Bull Media House',       category: 'international', logo: '', provider: 'hls', source: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' },
    { id: 'hls08', name: 'Euronews (HLS)',        desc: 'Euronews English — direct HLS', category: 'international', logo: '', provider: 'hls', source: 'https://cdn-euronews.akamaized.net/live/eds/euronews-en/25080/index.m3u8' },

    /* ---- United States ---- */
    { id: 'usa01', name: 'NBC News',              desc: 'NBCUniversal',               category: 'usa', logo: 'logos/usa01.webp', provider: 'yt-channel', source: 'UCeY0bbntWzzVIaj2z3QigXg' },
    { id: 'usa02', name: 'NBC News NOW',          desc: 'NBCUniversal',               category: 'usa', logo: 'logos/usa02.webp', provider: 'yt-channel', source: 'UCIYVU7fPs_n6gJIBso3ryeg' },
    { id: 'usa03', name: 'LiveNOW from FOX',      desc: 'FOX Television Stations',    category: 'usa', logo: 'logos/usa03.webp', provider: 'yt-channel', source: 'UCJg9wBPyKMNA5sRDnvzmkdg' },
    { id: 'usa04', name: 'WPLG Local 10',         desc: 'Miami, FL — ABC affiliate',  category: 'usa', logo: 'logos/usa04.webp', provider: 'yt-channel', source: 'UCgVZ0mrM3liHNhRYC5Mchgg' },

    /* ---- United Kingdom ---- */
    { id: 'uk01',  name: 'GB News',               desc: "Britain's News Channel",     category: 'uk',  logo: 'logos/uk01.webp',  provider: 'yt-channel', source: 'UC0vn8ISa4LKMunLbzaXLnOQ' },
    { id: 'uk02',  name: 'Channel 4 News',        desc: 'ITN — Channel 4',            category: 'uk',  logo: '', provider: 'yt-channel', source: 'UCTrQ7HXWRRxr7OsOtodr2_w', note: 'Not 24/7' },

    /* ---- Argentina ---- */
    { id: 'arg01', name: 'A24',                   desc: 'Grupo América',              category: 'argentina', logo: 'logos/arg01.webp', provider: 'yt-channel', source: 'UCR9120YBAqMfntqgRTKmkjQ' },
    { id: 'arg02', name: 'Todo Noticias',         desc: 'Artear',                     category: 'argentina', logo: 'logos/arg02.webp', provider: 'yt-channel', source: 'UCj6PcyLvpnIRT_2W_mwa9Aw' },
    { id: 'arg03', name: 'LA NACION',             desc: 'La Nación',                  category: 'argentina', logo: 'logos/arg03.webp', provider: 'yt-channel', source: 'UCba3hpU7EFBSk817y9qZkiA' },
    { id: 'arg04', name: 'TV Pública',            desc: 'Buenos Aires',               category: 'argentina', logo: 'logos/arg04.webp', provider: 'yt-channel', source: 'UCs231K71Bnu5295_x0MB5Pg' },
    { id: 'arg05', name: 'C5N',                   desc: 'Telepiú S.A.',               category: 'argentina', logo: 'logos/arg05.webp', provider: 'yt-channel', source: 'UCFgk2Q2mVO1BklRQhSv6p0w' },
    { id: 'arg06', name: 'Crónica TV',            desc: 'Grupo Crónica',              category: 'argentina', logo: 'logos/arg06.webp', provider: 'yt-channel', source: 'UCT7KFGv6s2a-rh2Jq8ZdM1g' },
    { id: 'arg07', name: 'El Doce',               desc: 'Telecor SACI — Córdoba',     category: 'argentina', logo: 'logos/arg07.webp', provider: 'yt-channel', source: 'UCiaePeoCqpU8hBHiNrgkzrA' },
    { id: 'arg08', name: 'IP Noticias',           desc: 'Grupo Octubre',              category: 'argentina', logo: 'logos/arg08.webp', provider: 'yt-channel', source: 'UC1bBjOZieJWHbsFA0LwjjJA' },
    { id: 'arg09', name: 'Canal 26',              desc: 'Canal 26',                   category: 'argentina', logo: 'logos/arg09.webp', provider: 'yt-channel', source: 'UCrpMfcQNog595v5gAS-oUsQ' },
    { id: 'arg10', name: 'Telefe Córdoba',        desc: 'Televisión Federal S.A.',    category: 'argentina', logo: 'logos/arg10.webp', provider: 'yt-channel', source: 'UC3OQ66wEJaOPHK25IBdWR_g' },
    { id: 'arg11', name: 'ELONCE',                desc: 'Canal Once — Entre Ríos',    category: 'argentina', logo: 'logos/arg11.webp', provider: 'yt-channel', source: 'UCWzsoIEZLGLinhYrm66VD4Q' },

    /* ---- Colombia ---- */
    { id: 'col01', name: 'Noticias Caracol',      desc: 'Caracol Televisión S.A.',    category: 'colombia', logo: 'logos/col01.webp', provider: 'yt-channel', source: 'UC2Xq2PK-got3Rtz9ZJ32hLQ' },

    /* ---- Mexico ---- */
    { id: 'mex01', name: 'N+',                    desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex01.webp', provider: 'yt-channel', source: 'UCUsm-fannqOY02PNN67C0KA' },
    { id: 'mex02', name: 'ADN 40',                desc: 'TV Azteca',                  category: 'mexico', logo: 'logos/mex02.webp', provider: 'yt-channel', source: 'UC7k--FhnJzhPTrbtldMSoQQ' },
    { id: 'mex03', name: 'Milenio TV',            desc: 'Grupo Milenio',              category: 'mexico', logo: 'logos/mex03.webp', provider: 'yt-channel', source: 'UCFxHplbcoJK9m70c4VyTIxg' },
    { id: 'mex04', name: 'Imagen Televisión',     desc: 'Grupo Imagen',               category: 'mexico', logo: 'logos/mex04.webp', provider: 'yt-channel', source: 'UCl5JKSQsl-_WSU1rz7_BCJA', note: 'Not 24/7' },
    { id: 'mex05', name: 'N+ Estado de México',   desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex01.webp', provider: 'yt-channel', source: 'UC9DH82HVSf4katwMeUpY80w' },
    { id: 'mex06', name: 'N+ Yucatán',            desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex06.webp', provider: 'yt-channel', source: 'UCMIYaH2cLoPS8Hcb-9AA2ZA' },
    { id: 'mex13', name: 'Canal 13 Yucatán',      desc: 'Trecevisión',                category: 'mexico', logo: 'logos/mex13.webp', provider: 'vk',         source: 'https://vk.com/video_ext.php?oid=723317256&id=456239017&hash=0875c873a02d1196&hd=2' },
    { id: 'mex14', name: 'TELE Yucatán',          desc: 'Gobierno del Estado de Yucatán', category: 'mexico', logo: 'logos/mex14.webp', provider: 'yt-channel', source: 'UC1hQKqlwdU1R1ITqWtk-tMg', note: 'Not 24/7' },
    { id: 'mex07', name: 'N+ Morelos',            desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex01.webp', provider: 'yt-channel', source: 'UCcC9ykApQrgl4UxbKg2U4zw' },
    { id: 'mex08', name: 'N+ Durango',            desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex01.webp', provider: 'yt-channel', source: 'UCON7DvLd5N8tXivc9WqILxQ', note: 'Not 24/7' },
    { id: 'mex09', name: 'N+ Del Golfo',          desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex01.webp', provider: 'yt-channel', source: 'UCQ08tNTPiBn44c975S81ftg' },
    { id: 'mex10', name: 'Televisa Sonora',       desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex10.webp', provider: 'yt-channel', source: 'UCyzWMHGS7bs0sot6KZk5EZg', note: 'Not 24/7' },
    { id: 'mex11', name: 'Televisa Noreste',      desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex11.webp', provider: 'yt-channel', source: 'UC752DYv5vPlTSMrvEjfZXcw', note: 'Not 24/7' },
    { id: 'mex12', name: 'Televisa Cd. Juárez',   desc: 'Televisa',                   category: 'mexico', logo: 'logos/mex12.webp', provider: 'yt-channel', source: 'UCot4t8PVKz8TT5xVM8Eb00w' },

    /* ---- Japan ---- */
    { id: 'jap01', name: 'TBS News',              desc: 'Tokyo Broadcasting System',  category: 'japan', logo: 'logos/jap01.webp', provider: 'yt-channel', source: 'UC6AG81pAkf6Lbi_1VC5NmPA' },
    { id: 'jap02', name: 'FNN',                   desc: 'Fuji Television Network',    category: 'japan', logo: 'logos/jap02.webp', provider: 'yt-channel', source: 'UCoQBJMzcwmXrRSHBFAlTsIw' },
    { id: 'jap03', name: 'ANN News',              desc: 'TV Asahi',                   category: 'japan', logo: 'logos/jap03.webp', provider: 'yt-channel', source: 'UCGCZAYq5Xxojl_tSXcVJhiQ' },
    { id: 'jap04', name: 'Kansai News',           desc: 'Asahi Broadcasting',         category: 'japan', logo: 'logos/jap04.webp', provider: 'yt-channel', source: 'UCPW-5qfYGNR8XYrvESrqJKA' },
    { id: 'jap05', name: 'Hokkaido News UHB',     desc: 'UHB Hokkaido Bunka',         category: 'japan', logo: 'logos/jap05.webp', provider: 'yt-channel', source: 'UCpQs_warGhUzJhBdwLfF34g' },
    { id: 'jap10', name: 'Me-tele News',          desc: 'Nagoya TV',                  category: 'japan', logo: 'logos/jap10.webp', provider: 'yt-channel', source: 'UCRnFGOp_mjaCYEhMzsE2iHA' },
    { id: 'jap06', name: 'HOME 広島ニュース',       desc: 'Hiroshima Home TV',          category: 'japan', logo: 'logos/jap06.webp', provider: 'yt-channel', source: 'UCuTAXTexrhetbOe3zgskJBQ' },
    { id: 'jap07', name: '日テレ NEWS',            desc: 'Nippon TV',                  category: 'japan', logo: 'logos/jap07.webp', provider: 'yt-channel', source: 'UCkKJhKO73xF1pK5h9R82ZGQ' },
    { id: 'jap08', name: 'MBS NEWS',              desc: 'Mainichi Broadcasting',      category: 'japan', logo: 'logos/jap08.webp', provider: 'yt-channel', source: 'UCUVWoy_rGPdZeUp7jjRHOaQ' },
    { id: 'jap11', name: 'Weathernews',           desc: 'Weathernews Inc.',           category: 'japan', logo: 'logos/jap11.webp', provider: 'yt-channel', source: 'UCWnOKASPkCBEL-_O8odMvtg' },
    { id: 'jap09', name: 'Earthquake Alert',      desc: 'Live seismic monitor',       category: 'japan', logo: 'logos/jap09.webp', provider: 'yt-channel', source: 'UCNsidkYpIAQ4QaufptQBPHQ' },
    { id: 'hls03', name: 'NHK World-Japan (HLS)', desc: 'NHK — direct HLS',           category: 'japan', logo: '', provider: 'hls', source: 'https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8' },

    /* ---- South Korea ---- */
    { id: 'kor01', name: 'YTN',                   desc: 'YTN — Korean news',          category: 'korea', logo: '', provider: 'yt-channel', source: 'UCizGMtU0Lt-O9X0tLJzyZ2Q' },

    /* ---- Russia ---- */
    { id: 'rus01', name: 'Rutube Live',           desc: 'Rutube stream',              category: 'russia', logo: '', provider: 'rutube', source: 'https://rutube.ru/play/embed/c58f502c7bb34a8fcdd976b221fca292' },

    /* ---- Africa ---- */
    { id: 'afr01', name: 'naWetin',               desc: 'Pidgin news',                category: 'africa', logo: 'logos/91.jpg', provider: 'yt-channel', source: 'UCTS7X2PNadaMNFrHDLjc3tQ', note: 'Not 24/7' },

    /* ---- United States (more) ---- */
    { id: 'usa05', name: 'ABC News',              desc: 'Disney / ABC',               category: 'usa', logo: '', provider: 'yt-channel', source: 'UCBi2mrWuNuyYy4gbM6fU18Q' },
    { id: 'usa06', name: 'CBS News',              desc: 'Paramount',                  category: 'usa', logo: '', provider: 'yt-channel', source: 'UC8p1vwvWtl6T73JiExfWs1g' },
    { id: 'usa07', name: 'Bloomberg Television',  desc: 'Bloomberg L.P. — finance',   category: 'usa', logo: '', provider: 'yt-channel', source: 'UCIALMKvObZNtJ6AmdCLP7Lg' },
    { id: 'usa08', name: 'FOX Weather',           desc: 'Fox Corporation',            category: 'usa', logo: '', provider: 'yt-channel', source: 'UC1FbPiXx59_ltnFVx7IxWow' },
    { id: 'usa09', name: 'Newsmax',               desc: 'Newsmax Media',              category: 'usa', logo: '', provider: 'yt-channel', source: 'UCx6h-dWzJ5NpAlja1YsApdg' },
    { id: 'usa10', name: 'PBS NewsHour',          desc: 'PBS — public broadcaster',   category: 'usa', logo: '', provider: 'yt-channel', source: 'UC6ZFN9Tx6xh-skXCuRHCDpQ', note: 'Not 24/7' },
    { id: 'usa11', name: 'C-SPAN',                desc: 'US Congress — live',         category: 'usa', logo: '', provider: 'yt-channel', source: 'UCb--64Gl51jIEVE-GLDAVTg', note: 'Not 24/7' },
    { id: 'usa12', name: 'CNBC Television',       desc: 'CNBC — US markets',          category: 'usa', logo: '', provider: 'yt-channel', source: 'UCrp_UI8XtuYfpiqluWLD7Lw', note: 'Not 24/7' },
    { id: 'usa13', name: 'Scripps News',          desc: 'The E.W. Scripps Company',   category: 'usa', logo: '', provider: 'yt-channel', source: 'UCTln5ss6h6L_xNfMeujfPbg' },
    { id: 'usa14', name: 'Cheddar',               desc: 'Cheddar — business',         category: 'usa', logo: '', provider: 'yt-channel', source: 'UC04KsGq3npibMCE9Td3mVDg', note: 'Not 24/7' },
    { id: 'hls06', name: 'Bloomberg TV (HLS)',    desc: 'Bloomberg — direct HLS',     category: 'usa', logo: '', provider: 'hls', source: 'https://www.bloomberg.com/media-manifest/streams/us.m3u8' },

    /* ---- South Korea (more) ---- */
    { id: 'kor02', name: 'Arirang News',          desc: 'Arirang TV — Korea',         category: 'korea', logo: '', provider: 'yt-channel', source: 'UCzznO4xSV8BKnUBPyswtCUw' },
    { id: 'kor03', name: 'KBS News',              desc: 'KBS 뉴스24 — 24/7',           category: 'korea', logo: '', provider: 'yt-channel', source: 'UCcQTRi69dsVYHN3exePtZ1A' },
    { id: 'kor04', name: 'SBS News',              desc: 'Seoul Broadcasting System',  category: 'korea', logo: '', provider: 'yt-channel', source: 'UCkinYTS9IHqOEwR1Sze2JTw' },

    /* ---- France ---- */
    { id: 'fr01', name: 'FRANCE 24 English',      desc: 'France Médias Monde',        category: 'france', logo: '', provider: 'yt-channel', source: 'UCQfwfsi5VrQ8yKZ-UWmAEFg' },
    { id: 'fr02', name: 'FRANCE 24 Français',     desc: 'France Médias Monde',        category: 'france', logo: '', provider: 'yt-channel', source: 'UCCCPCZNChQdGa9EkATeye4g' },
    { id: 'fr03', name: 'FRANCE 24 Español',      desc: 'France Médias Monde',        category: 'france', logo: '', provider: 'yt-channel', source: 'UCUdOoVWuWmgo1wByzcsyKDQ' },
    { id: 'fr04', name: 'franceinfo',             desc: 'France Télévisions',         category: 'france', logo: '', provider: 'yt-channel', source: 'UCO6K_kkdP-lnSCiO3tPx7WA' },
    { id: 'fr05', name: 'BFMTV',                  desc: 'Altice / RMC BFM',           category: 'france', logo: '', provider: 'yt-channel', source: 'UCXwDLMDV86ldKoFVc_g8P0g' },
    { id: 'hls09', name: 'Euronews Français (HLS)', desc: 'Euronews — direct HLS',     category: 'france', logo: '', provider: 'hls', source: 'https://cdn-euronews.akamaized.net/live/eds/euronews-fr/25026/index.m3u8' },

    /* ---- Spain ---- */
    { id: 'es01', name: 'RTVE 24h',               desc: 'RTVE — Canal 24 Horas',      category: 'spain', logo: '', provider: 'yt-channel', source: 'UC7QZIf0dta-XPXsp9Hv4dTw' },
    { id: 'es02', name: 'laSexta Noticias',       desc: 'Atresmedia',                 category: 'spain', logo: '', provider: 'yt-channel', source: 'UCCJs5mITIqxqJGeFjt9N1Mg' },
    { id: 'es03', name: 'Antena 3 Noticias',      desc: 'Atresmedia',                 category: 'spain', logo: '', provider: 'yt-channel', source: 'UC_Oni82GyYcabEr3rd-eJkg' },
    { id: 'es04', name: 'EL PAÍS',                desc: 'Grupo PRISA',                category: 'spain', logo: '', provider: 'yt-channel', source: 'UCnsvJeZO4RigQ898WdDNoBw' },

    /* ---- Italy ---- */
    { id: 'it01', name: 'Sky TG24',               desc: 'Sky Italia',                 category: 'italy', logo: '', provider: 'yt-channel', source: 'UCz6E3lF72mb6uoJ-mOlNo2A' },
    { id: 'it02', name: 'Rai News 24',            desc: 'RAI',                        category: 'italy', logo: '', provider: 'yt-channel', source: 'UCxqR9g_1XlnfrqwHK9viwCw' },
    { id: 'it03', name: 'La7',                    desc: 'Cairo Communication',        category: 'italy', logo: '', provider: 'yt-channel', source: 'UCXi-7dpQ1mnf8kxIVCe9mCA' },
    { id: 'it04', name: 'TG La7',                 desc: 'La7 — news',                 category: 'italy', logo: '', provider: 'yt-channel', source: 'UCYj2t05uU65UrlI1f0OGhlg' },

    /* ---- Brazil ---- */
    { id: 'br01', name: 'Jovem Pan News',         desc: 'Grupo Jovem Pan',            category: 'brazil', logo: '', provider: 'yt-channel', source: 'UCP391YRAjSOdM_bwievgaZA' },
    { id: 'br02', name: 'CNN Brasil',             desc: 'Novus Mídia',                category: 'brazil', logo: '', provider: 'yt-channel', source: 'UCvdwhh_fDyWccR42-rReZLw' },
    { id: 'br03', name: 'Band Jornalismo',        desc: 'Grupo Bandeirantes',         category: 'brazil', logo: '', provider: 'yt-channel', source: 'UCoa-D_VfMkFrCYodrOC9-mA' },
    { id: 'br04', name: 'GloboNews',              desc: 'Grupo Globo',                category: 'brazil', logo: '', provider: 'yt-channel', source: 'UCsy3NgoRKzYBXxHBCrtefzQ' },

    /* ---- Canada ---- */
    { id: 'ca01', name: 'CBC News',               desc: 'CBC — public broadcaster',   category: 'canada', logo: '', provider: 'yt-channel', source: 'UCuFFtHWoLl5fauMMD5Ww2jA' },
    { id: 'ca02', name: 'CTV News',               desc: 'Bell Media',                 category: 'canada', logo: '', provider: 'yt-channel', source: 'UCi7Zk9baY1tvdlgxIML8MXg' },
    { id: 'ca03', name: 'Global News',            desc: 'Corus Entertainment',        category: 'canada', logo: '', provider: 'yt-channel', source: 'UChLtXXpo4Ge1ReTEboVvTDg' },

    /* ---- India ---- */
    { id: 'in01', name: 'NDTV',                   desc: 'New Delhi Television',       category: 'india', logo: '', provider: 'yt-channel', source: 'UCZFMm1mMw0F81Z37aaEzTUA' },
    { id: 'in02', name: 'India Today',            desc: 'TV Today Network',           category: 'india', logo: '', provider: 'yt-channel', source: 'UCYPvAwZP8pZhSMW8qs7cVCw' },
    { id: 'in03', name: 'Republic World',         desc: 'Republic Media Network',     category: 'india', logo: '', provider: 'yt-channel', source: 'UCwqusr8YDwM-3mEYTDeJHzw' },
    { id: 'in04', name: 'Times Now',              desc: 'The Times Group',            category: 'india', logo: '', provider: 'yt-channel', source: 'UC6RJ7-PaXg6TIH2BzZfTV7w' },
    { id: 'in05', name: 'NDTV India',             desc: 'NDTV — Hindi',               category: 'india', logo: '', provider: 'yt-channel', source: 'UC9CYT9gSNLevX5ey2_6CK0Q' },

    /* ---- Türkiye ---- */
    { id: 'tr01', name: 'TRT World',              desc: 'TRT — English',              category: 'turkey', logo: '', provider: 'yt-channel', source: 'UC7fWeaHhqgM4Ry-RMpM2YYw' },
    { id: 'tr02', name: 'TRT Haber',              desc: 'TRT — Türkçe',               category: 'turkey', logo: '', provider: 'yt-channel', source: 'UCBgTP2LOFVPmq15W-RH-WXA' },
    { id: 'tr03', name: 'Anadolu Ajansı',         desc: 'Anadolu Agency',             category: 'turkey', logo: '', provider: 'yt-channel', source: 'UCVbZYhcirOke2vipxs4lT2w' },

    /* ---- China / Taiwan / HK ---- */
    { id: 'cn01', name: 'CGTN',                   desc: 'China Global Television',    category: 'china', logo: '', provider: 'yt-channel', source: 'UCgrNz-aDmcr2uuto8_DL2jg' },
    { id: 'cn02', name: 'CGTN America',           desc: 'CGTN — Americas',            category: 'china', logo: '', provider: 'yt-channel', source: 'UCj7wKsOBhRD9Jy4yahkMRMw' },
    { id: 'cn03', name: 'TaiwanPlus News',        desc: 'TaiwanPlus',                 category: 'china', logo: '', provider: 'yt-channel', source: 'UCCJBSLNtozkO-NqjpPZujiQ' },
    { id: 'cn04', name: 'TaiwanPlus Live',        desc: 'TaiwanPlus — 24/7',          category: 'china', logo: '', provider: 'yt-channel', source: 'UC7c6rvyAZLpKGk8ttVnpnLA' },
    { id: 'cn05', name: 'South China Morning Post', desc: 'SCMP — Hong Kong',         category: 'china', logo: '', provider: 'yt-channel', source: 'UC4SUWizzKc1tptprBkWjX2Q' },

    /* ---- Germany ---- */
    { id: 'de01', name: 'euronews (deutsch)',     desc: 'Euronews — German',          category: 'germany', logo: '', provider: 'yt-channel', source: 'UCACdxU3VrJIJc7ujxtHWs1w' },
    { id: 'de02', name: 'ZDFheute',               desc: 'ZDF',                        category: 'germany', logo: '', provider: 'yt-channel', source: 'UCeqKIgPQfNInOswGRWt48kQ', note: 'Not 24/7' },
    { id: 'de03', name: 'phoenix',                desc: 'ARD / ZDF',                  category: 'germany', logo: '', provider: 'yt-channel', source: 'UCwyiPnNlT8UABRmGmU0T9jg', note: 'Not 24/7' },
    { id: 'de04', name: 'WELT',                   desc: 'Axel Springer — 24/7',       category: 'germany', logo: '', provider: 'yt-channel', source: 'UCYLksysPyWbObO2GKlqtKpA' },
    { id: 'hls02', name: 'DW Deutsch (HLS)',      desc: 'Deutsche Welle — direct HLS', category: 'germany', logo: '', provider: 'hls', source: 'https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8' },

    /* ---- Ukraine ---- */
    { id: 'ua01', name: 'FREEDOM. LIVE',          desc: 'FREEDOM — intl. Ukrainian',  category: 'ukraine', logo: '', provider: 'yt-channel', source: 'UCOqFkpNwNLPGOb8EC-mwZYg' },
    { id: 'ua02', name: 'UATV English',           desc: 'Ukrinform',                  category: 'ukraine', logo: '', provider: 'yt-channel', source: 'UCOmfcmDrWs7iJrXx7V5Cnwg' },
    { id: 'ua03', name: 'Suspilne News',          desc: 'Suspilne — public',          category: 'ukraine', logo: '', provider: 'yt-channel', source: 'UCPY6gj8G7dqwPxg9KwHrj5Q' },
    { id: 'ua04', name: 'Kyiv Independent',       desc: 'Independent newsroom',       category: 'ukraine', logo: '', provider: 'yt-channel', source: 'UCGAC5yzlYgjKoJABDZ7zEyw', note: 'Not 24/7' },

    /* ---- Israel ---- */
    { id: 'il01', name: 'i24NEWS English',        desc: 'Tel Aviv',                   category: 'israel', logo: '', provider: 'yt-channel', source: 'UCvHDpsWKADrDia0c99X37vg' },

    /* ---- Portugal ---- */
    { id: 'pt01', name: 'SIC Notícias',           desc: 'SIC',                        category: 'portugal', logo: '', provider: 'yt-channel', source: 'UCimBp0frQrASSsIFERs8vsw', note: 'Not 24/7' },
    { id: 'pt02', name: 'RTP',                     desc: 'Rádio e TV de Portugal',     category: 'portugal', logo: '', provider: 'yt-channel', source: 'UCWPpeeDOykyH5ducPITCDPw', note: 'Not 24/7' },
    { id: 'pt03', name: 'CNN Portugal',           desc: 'Media Capital',              category: 'portugal', logo: '', provider: 'yt-channel', source: 'UCbiirstEB3KnKhm7i91dKYg', note: 'Not 24/7' },

    /* ---- Poland ---- */
    { id: 'pl01',  name: 'TVP World',             desc: 'TVP — English',              category: 'poland', logo: '', provider: 'yt-channel', source: 'UCBjUPsHj7bXt24SUWNoZ0zA' },

    /* ---- Netherlands ---- */
    { id: 'nl01', name: 'NOS',                    desc: 'Dutch public broadcaster',   category: 'netherlands', logo: '', provider: 'yt-channel', source: 'UC5xziMuoFAOpX9mwUVhe2Jw', note: 'Not 24/7' },
    { id: 'nl02', name: 'RTL Nieuws',             desc: 'RTL Nederland',              category: 'netherlands', logo: '', provider: 'yt-channel', source: 'UCv4NUJ5BGSpJz_leIfayDzQ', note: 'Not 24/7' },

    /* ---- Greece ---- */
    { id: 'gr01', name: 'SKAI',                   desc: 'SKAI TV — live',             category: 'greece', logo: '', provider: 'yt-channel', source: 'UCw82qUC8McNKHiuPIiFmxCQ' },

    /* ---- Philippines ---- */
    { id: 'ph01', name: 'PTV News',               desc: "People's Television",        category: 'philippines', logo: '', provider: 'yt-channel', source: 'UC5RvV_LtR1dxPCVFGw6dxXA' },
    { id: 'ph02', name: 'Kapamilya Online Live',  desc: 'ABS-CBN — 24/7',             category: 'philippines', logo: '', provider: 'yt-channel', source: 'UCaLzUKBv5iIAHKYP8hL2zFw' },
    { id: 'ph03', name: 'GMA News',               desc: 'GMA Network',                category: 'philippines', logo: '', provider: 'yt-channel', source: 'UCqYw-CTd1dU2yGI71sEyqNw', note: 'Not 24/7' },
    { id: 'ph04', name: 'ABS-CBN News',           desc: 'ABS-CBN',                    category: 'philippines', logo: '', provider: 'yt-channel', source: 'UCE2606prvXQc_noEqKxVJXA', note: 'Not 24/7' },

    /* ---- Australia ---- */
    { id: 'au01', name: 'ABC News (Australia)',   desc: 'ABC — public broadcaster',   category: 'australia', logo: '', provider: 'yt-channel', source: 'UCVgO39Bk5sMo66-6o6Spn6Q' },
    { id: 'au02', name: 'Sky News Australia',     desc: 'Sky News Australia',         category: 'australia', logo: '', provider: 'yt-channel', source: 'UCO0akufu9MOzyz3nvGIXAAw' },
    { id: 'hls07', name: 'ABC News AU (HLS)',     desc: 'ABC Australia — direct HLS',  category: 'australia', logo: '', provider: 'hls', source: 'https://abc-news-dmd-streams-1.akamaized.net/out/v1/abc83881886746b0802dc3e7ca2bc792/index.m3u8' },

    /* ---- Africa (more) ---- */
    { id: 'afr02', name: 'Channels Television',   desc: 'Nigeria',                    category: 'africa', logo: '', provider: 'yt-channel', source: 'UCEXGDNclvmg6RW0vipJYsTQ' },
    { id: 'afr03', name: 'TVC News',              desc: 'Nigeria',                    category: 'africa', logo: '', provider: 'yt-channel', source: 'UCgp4A6I8LCWrhUzn-5SbKvA' },
    { id: 'afr04', name: 'Arise News',            desc: 'Nigeria / global',           category: 'africa', logo: '', provider: 'yt-channel', source: 'UCyEJX-kSj0kOOCS7Qlq2G7g' },
    { id: 'afr05', name: 'SABC News',             desc: 'South Africa',               category: 'africa', logo: '', provider: 'yt-channel', source: 'UC8yH-uI81UUtEMDsowQyx1g' },
    { id: 'afr06', name: 'eNCA',                  desc: 'South Africa — 24/7',        category: 'africa', logo: '', provider: 'yt-channel', source: 'UCI3RT5PGmdi1KVp9FG_CneA' },

    /* ---- Weather ---- */
    { id: 'we01', name: "Ryan Hall, Y'all",       desc: 'US weather radar & alerts',  category: 'weather', logo: '', provider: 'yt-channel', source: 'UCJHAT3Uvv-g3I8H3GhHWV7w' },
    { id: 'we02', name: 'Texas Storm Chasers',    desc: 'Texas weather live',         category: 'weather', logo: '', provider: 'yt-channel', source: 'UCNPvoDpoOWevcdTHr8GyTyA' },
    { id: 'we03', name: 'Max Velocity',           desc: 'Severe weather center',      category: 'weather', logo: '', provider: 'yt-channel', source: 'UCvBVK2ymNzPLRJrgip2GeQQ', note: 'Not 24/7' },
    { id: 'we04', name: 'Met Office',             desc: 'UK national weather',        category: 'weather', logo: '', provider: 'yt-channel', source: 'UC40Tw2tFuMzK305mi7nj8rg', note: 'Not 24/7' },

    /* ---- Earthquakes ---- */
    { id: 'eq01', name: 'GlobalQuake',            desc: 'Worldwide seismic monitor',  category: 'earthquake', logo: '', provider: 'yt-channel', source: 'UCZmcd4cQ2H_ELWAuUdOMgRQ' },
    { id: 'eq02', name: 'Real-Time Earthquakes',  desc: 'CISN worldwide monitor',     category: 'earthquake', logo: '', provider: 'yt-channel', source: 'UCQPh1dyzNbVmhAx6_qeGpiQ' },
    { id: 'eq03', name: 'California Seismograph',  desc: 'Live seismograph drums',     category: 'earthquake', logo: '', provider: 'yt-channel', source: 'UCBsPEHBugPQbNzX6fbQBHgw' },
    { id: 'eq04', name: '3D Globe Quake Monitor', desc: 'WorldCam — live 3D globe',   category: 'earthquake', logo: '', provider: 'yt-video',   source: 'U8x51eUfFTI' },
    { id: 'eq05', name: 'Mediterranean Seismograph', desc: 'Meteo Ariccia',           category: 'earthquake', logo: '', provider: 'yt-video',   source: 'mW6YvnrF8pE' },

    /* ---- Live Cams ---- */
    { id: 'lc01', name: 'Explore Live Nature Cams', desc: 'Explore.org',              category: 'livecams', logo: '', provider: 'yt-channel', source: 'UC-2KSeUU5SMCX6XLRD-AEvw' },
    { id: 'lc02', name: 'Times Square 4K',        desc: 'EarthCam — NYC',             category: 'livecams', logo: '', provider: 'yt-video',   source: 'VjSIXFwB_WQ' },
    { id: 'lc03', name: 'SkylineWebcams',         desc: '1200 webcams worldwide',     category: 'livecams', logo: '', provider: 'yt-video',   source: 'EFum1rGUdkk' },
    { id: 'lc04', name: 'Jelly Cam',              desc: 'Monterey Bay Aquarium',      category: 'livecams', logo: '', provider: 'yt-video',   source: 'm1XcdxjVGos' },

    /* ---- Air Traffic ---- */
    { id: 'at01', name: 'Schiphol (AMS)',         desc: 'Amsterdam — plane spotting', category: 'airtraffic', logo: '', provider: 'yt-channel', source: 'UCDRT7uomQAQFfFzGT4T7Ekg' },
    { id: 'at02', name: 'LAX',                    desc: 'Los Angeles — Airline Videos', category: 'airtraffic', logo: '', provider: 'yt-channel', source: 'UCZpB0MKAHs4k_TTpHllCLSQ' },
    { id: 'at03', name: 'Las Vegas (LAS)',        desc: 'Harry Reid Intl — live',     category: 'airtraffic', logo: '', provider: 'yt-channel', source: 'UCYDCnc3YBEqxfuhvQ4rxqSA' },
    { id: 'at04', name: 'Flightradar24',          desc: 'Automated airport cams',     category: 'airtraffic', logo: '', provider: 'yt-channel', source: 'UCcGI_kXwKl_QhyW9jK_8gIA', note: 'Not 24/7' },
    { id: 'at05', name: 'Lanzarote (ACE)',        desc: 'Canary Islands — runway',    category: 'airtraffic', logo: '', provider: 'yt-video',   source: 'AAlo3eCPVbk' },

    /* ---- Space ---- */
    { id: 'sp01', name: 'ISS Earth 4K (Sen)',     desc: 'Earth & space from the ISS', category: 'space', logo: '', provider: 'yt-channel', source: 'UCkvW_7kp9LJrztmgA4q4bJQ' },
    { id: 'sp02', name: 'ISS Live (Launch Pad)',  desc: '4K ISS + ground comms',      category: 'space', logo: '', provider: 'yt-channel', source: 'UCGCndz0n0NHmLHfd64FRjIA' },
    { id: 'sp03', name: 'NASA ISS Earth View',    desc: 'afarTV',                     category: 'space', logo: '', provider: 'yt-video',   source: 'vytmBNhc9ig' },
  ],
};
