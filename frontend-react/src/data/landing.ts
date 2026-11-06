export interface HeroSlide {
  id: string;
  countryId: string;
  country: string;
  city: string;
  landmark: string;
  image: string;
  alt: string;
}

const wiki = (path: string, file: string, width = 1920) =>
  `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/${width}px-${file}`;

/**
 * Tres fotografías de alta resolución por cada uno de los 11 países de la red.
 * Las imágenes de Wikimedia Commons se sirven en 1920px y la de la Torre Eiffel
 * se mantiene en Unsplash para conservar una composición vertical icónica.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'es-plaza-espana',
    countryId: 'es',
    country: 'España',
    city: 'Sevilla',
    landmark: 'Plaza de España',
    image: wiki('b/b6', 'Plaza_de_Espa%C3%B1a_%28Sevilla%29_-_01.jpg'),
    alt: 'Plaza de España de Sevilla al atardecer',
  },
  {
    id: 'es-sagrada-familia',
    countryId: 'es',
    country: 'España',
    city: 'Barcelona',
    landmark: 'Sagrada Família',
    image: wiki('e/ef', 'SF_maig_2_cropped.jpg'),
    alt: 'Basílica de la Sagrada Família en Barcelona',
  },
  {
    id: 'es-palacio-real',
    countryId: 'es',
    country: 'España',
    city: 'Madrid',
    landmark: 'Palacio Real',
    image: wiki('9/9b', 'Palacio_Real_de_Madrid_Julio_2016_%28cropped%29.jpg'),
    alt: 'Palacio Real de Madrid',
  },
  {
    id: 'fr-torre-eiffel',
    countryId: 'fr',
    country: 'Francia',
    city: 'París',
    landmark: 'Torre Eiffel',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80&auto=format&fit=crop',
    alt: 'Torre Eiffel de París entre los edificios de la ciudad',
  },
  {
    id: 'fr-notre-dame',
    countryId: 'fr',
    country: 'Francia',
    city: 'París',
    landmark: 'Notre-Dame',
    image: wiki('f/f7', 'Notre-Dame_de_Paris%2C_4_October_2017.jpg'),
    alt: 'Catedral de Notre-Dame de París',
  },
  {
    id: 'fr-mont-saint-michel',
    countryId: 'fr',
    country: 'Francia',
    city: 'Normandía',
    landmark: 'Mont Saint-Michel',
    image: wiki('7/78', 'Mont-Saint-Michel_vu_du_ciel.jpg'),
    alt: 'Vista aérea del Mont Saint-Michel en Normandía',
  },
  {
    id: 'de-brandenburgo',
    countryId: 'de',
    country: 'Alemania',
    city: 'Berlín',
    landmark: 'Puerta de Brandeburgo',
    image: wiki('a/a6', 'Brandenburger_Tor_abends.jpg'),
    alt: 'Puerta de Brandeburgo iluminada por la noche en Berlín',
  },
  {
    id: 'de-neuschwanstein',
    countryId: 'de',
    country: 'Alemania',
    city: 'Baviera',
    landmark: 'Castillo de Neuschwanstein',
    image: wiki('f/f8', 'Schloss_Neuschwanstein_2013.jpg'),
    alt: 'Castillo de Neuschwanstein entre montañas de Baviera',
  },
  {
    id: 'de-catedral-colonia',
    countryId: 'de',
    country: 'Alemania',
    city: 'Colonia',
    landmark: 'Catedral de Colonia',
    image: wiki('0/04', 'K%C3%B6lner_Dom_-_Westfassade_2022_ohne_Ger%C3%BCst-0968_b.jpg'),
    alt: 'Fachada oeste de la Catedral de Colonia',
  },
  {
    id: 'be-grand-place',
    countryId: 'be',
    country: 'Bélgica',
    city: 'Bruselas',
    landmark: 'Grand-Place',
    image: wiki('2/26', 'Grand-Place%2C_Brussels_-_panorama%2C_June_2018.jpg'),
    alt: 'Panorámica de la Grand-Place de Bruselas',
  },
  {
    id: 'be-campanario-brujas',
    countryId: 'be',
    country: 'Bélgica',
    city: 'Brujas',
    landmark: 'Campanario de Brujas',
    image: wiki('3/37', 'Brugge_Belfort_HDR.jpg'),
    alt: 'Campanario de Brujas sobre la plaza histórica',
  },
  {
    id: 'be-catedral-amberes',
    countryId: 'be',
    country: 'Bélgica',
    city: 'Amberes',
    landmark: 'Catedral de Amberes',
    image: wiki('c/c3', 'Exterior_of_Onze-Lieve-Vrouwekathedraal_%28Antwerp%29-.jpg'),
    alt: 'Catedral de Nuestra Señora de Amberes',
  },
  {
    id: 'gb-big-ben',
    countryId: 'uk',
    country: 'Reino Unido',
    city: 'Londres',
    landmark: 'Big Ben',
    image: wiki('0/05', 'Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster%2C_London.jpg'),
    alt: 'Big Ben y el Palacio de Westminster en Londres',
  },
  {
    id: 'gb-tower-bridge',
    countryId: 'uk',
    country: 'Reino Unido',
    city: 'Londres',
    landmark: 'Tower Bridge',
    image: wiki('5/59', 'Tower_Bridge_at_Dawn.jpg'),
    alt: 'Tower Bridge al amanecer sobre el río Támesis',
  },
  {
    id: 'gb-edinburgh-castle',
    countryId: 'uk',
    country: 'Reino Unido',
    city: 'Edimburgo',
    landmark: 'Castillo de Edimburgo',
    image: wiki('b/bb', 'Edinburgh_Castle_from_Esplanade_20211019.jpg'),
    alt: 'Castillo de Edimburgo visto desde la explanada',
  },
  {
    id: 'us-statue-liberty',
    countryId: 'us',
    country: 'Estados Unidos',
    city: 'Nueva York',
    landmark: 'Estatua de la Libertad',
    image: wiki('8/89', 'Front_view_of_Statue_of_Liberty_%28cropped%29.jpg'),
    alt: 'Estatua de la Libertad en la bahía de Nueva York',
  },
  {
    id: 'us-capitol',
    countryId: 'us',
    country: 'Estados Unidos',
    city: 'Washington D.C.',
    landmark: 'Capitolio',
    image: wiki('a/a5', 'Capitol%2C_Washington%2C_D.C._USA12.jpg'),
    alt: 'Capitolio de los Estados Unidos en Washington D.C.',
  },
  {
    id: 'us-golden-gate',
    countryId: 'us',
    country: 'Estados Unidos',
    city: 'San Francisco',
    landmark: 'Golden Gate',
    image: wiki('b/bf', 'Golden_Gate_Bridge_as_seen_from_Battery_East.jpg'),
    alt: 'Puente Golden Gate desde Battery East',
  },
  {
    id: 'ca-cn-tower',
    countryId: 'ca',
    country: 'Canadá',
    city: 'Toronto',
    landmark: 'Torre CN',
    image: wiki('9/96', 'Toronto_-_ON_-_Toronto_Harbourfront7.jpg'),
    alt: 'Torre CN y el frente costero de Toronto',
  },
  {
    id: 'ca-notre-dame-montreal',
    countryId: 'ca',
    country: 'Canadá',
    city: 'Montreal',
    landmark: 'Basílica de Notre-Dame',
    image: wiki(
      '1/1e',
      'Bas%C3%ADlica_de_Notre-Dame%2C_Montreal%2C_Canad%C3%A1%2C_2017-08-11%2C_DD_20-22_HDR_alt.jpg',
    ),
    alt: 'Basílica de Notre-Dame de Montreal',
  },
  {
    id: 'ca-parliament-hill',
    countryId: 'ca',
    country: 'Canadá',
    city: 'Ottawa',
    landmark: 'Colina del Parlamento',
    image: wiki('b/b5', 'Ottawa_-_ON_-_Stadtansicht.jpg'),
    alt: 'Vista del Parlamento y la ciudad de Ottawa',
  },
  {
    id: 'ru-san-basilio',
    countryId: 'ru',
    country: 'Rusia',
    city: 'Moscú',
    landmark: 'Catedral de San Basilio',
    image: wiki('d/df', '00_0568_Saint_Basil%27s_Cathedral_-_Moscow.jpg'),
    alt: 'Catedral de San Basilio en la Plaza Roja de Moscú',
  },
  {
    id: 'ru-palacio-invierno',
    countryId: 'ru',
    country: 'Rusia',
    city: 'San Petersburgo',
    landmark: 'Palacio de Invierno',
    image: wiki('7/74', 'RUS-2016-Aerial-SPB-Winter_Palace_%28crop%29.jpg'),
    alt: 'Vista aérea del Palacio de Invierno de San Petersburgo',
  },
  {
    id: 'ru-kul-sharif',
    countryId: 'ru',
    country: 'Rusia',
    city: 'Kazán',
    landmark: 'Mezquita Kul Sharif',
    image: wiki('8/84', 'Kazan_Kremlin_Qolsharif_Mosque_08-2016_img1.jpg'),
    alt: 'Mezquita Kul Sharif en el Kremlin de Kazán',
  },
  {
    id: 'cn-gran-muralla',
    countryId: 'cn',
    country: 'China',
    city: 'Pekín',
    landmark: 'Gran Muralla',
    image: wiki('2/23', 'The_Great_Wall_of_China_at_Jinshanling-edit.jpg'),
    alt: 'Gran Muralla China en el tramo de Jinshanling',
  },
  {
    id: 'cn-ciudad-prohibida',
    countryId: 'cn',
    country: 'China',
    city: 'Pekín',
    landmark: 'Ciudad Prohibida',
    image: wiki('e/ef', 'The_Forbidden_City_-_View_from_Coal_Hill.jpg'),
    alt: 'Ciudad Prohibida vista desde la colina de carbón',
  },
  {
    id: 'cn-the-bund',
    countryId: 'cn',
    country: 'China',
    city: 'Shanghái',
    landmark: 'El Bund',
    image: wiki('5/5a', 'The_Bund_2.jpg'),
    alt: 'Skyline de Shanghái desde El Bund',
  },
  {
    id: 'in-taj-mahal',
    countryId: 'in',
    country: 'India',
    city: 'Agra',
    landmark: 'Taj Mahal',
    image: wiki('1/1d', 'Taj_Mahal_%28Edited%29.jpeg'),
    alt: 'Taj Mahal de Agra reflejado en el agua',
  },
  {
    id: 'in-india-gate',
    countryId: 'in',
    country: 'India',
    city: 'Nueva Delhi',
    landmark: 'Puerta de la India',
    image: wiki('0/09', 'India_Gate_in_New_Delhi_03-2016.jpg'),
    alt: 'Puerta de la India en Nueva Delhi',
  },
  {
    id: 'in-hawa-mahal',
    countryId: 'in',
    country: 'India',
    city: 'Jaipur',
    landmark: 'Hawa Mahal',
    image: wiki('4/41', 'East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg'),
    alt: 'Fachada este del palacio Hawa Mahal en Jaipur',
  },
  {
    id: 'jp-monte-fuji',
    countryId: 'jp',
    country: 'Japón',
    city: 'Tokio',
    landmark: 'Monte Fuji',
    image: wiki('f/f8', 'View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg'),
    alt: 'Monte Fuji visto desde Owakudani',
  },
  {
    id: 'jp-tokyo-tower',
    countryId: 'jp',
    country: 'Japón',
    city: 'Tokio',
    landmark: 'Torre de Tokio',
    image: wiki('3/37', 'TaroTokyo20110213-TokyoTower-01.jpg'),
    alt: 'Torre de Tokio con cielo despejado',
  },
  {
    id: 'jp-fushimi-inari',
    countryId: 'jp',
    country: 'Japón',
    city: 'Kioto',
    landmark: 'Fushimi Inari',
    image: wiki('1/16', 'KyotoFushimiInariLarge.jpg'),
    alt: 'Camino de torii rojos en el santuario Fushimi Inari de Kioto',
  },
];

export interface RailwayBrand {
  id: string;
  name: string;
  region: string;
  color: string;
  softColor: string;
}

export const RAILWAY_BRANDS: RailwayBrand[] = [
  { id: 'renfe', name: 'Renfe AVE', region: 'España', color: '#8A1A63', softColor: '#fbeaf4' },
  { id: 'ouigo', name: 'Ouigo', region: 'España', color: '#e5007d', softColor: '#fdeaf5' },
  { id: 'iryo', name: 'iryo', region: 'España', color: '#111827', softColor: '#ecfdf5' },
  { id: 'sncf', name: 'SNCF TGV inOui', region: 'Francia', color: '#0b2a5b', softColor: '#e8eef9' },
  { id: 'db', name: 'Deutsche Bahn ICE', region: 'Alemania', color: '#c8102e', softColor: '#fdecef' },
  { id: 'eurostar', name: 'Eurostar', region: 'Europa', color: '#0b1f3a', softColor: '#e8edf5' },
  { id: 'amtrak', name: 'Amtrak', region: 'Estados Unidos', color: '#004b87', softColor: '#e6f0f8' },
  { id: 'via', name: 'VIA Rail', region: 'Canadá', color: '#f2b705', softColor: '#fef7dc' },
  { id: 'jr', name: 'JR Shinkansen', region: 'Japón', color: '#007a3d', softColor: '#e6f5ed' },
  { id: 'crh', name: 'CRH China', region: 'China', color: '#b91c1c', softColor: '#fdeaea' },
  { id: 'ir', name: 'Indian Railways', region: 'India', color: '#1d4ed8', softColor: '#e8eefc' },
  { id: 'rzd', name: 'RZD Sapsan', region: 'Rusia', color: '#d21f2c', softColor: '#fdecee' },
];

export const COUNTRY_NETWORKS: Record<string, string> = {
  es: 'Renfe AVE · Ouigo · iryo',
  fr: 'SNCF TGV inOui',
  de: 'Deutsche Bahn ICE',
  be: 'SNCB · Eurostar',
  uk: 'LNER · Avanti West Coast',
  us: 'Amtrak Acela',
  ca: 'VIA Rail Canada',
  ru: 'RZD Sapsan',
  cn: 'CRH Fuxing',
  in: 'Indian Railways',
  jp: 'JR Shinkansen',
};

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'documentacion',
    category: 'Antes de viajar',
    question: '¿Qué documentación necesito llevar antes de salir?',
    answer:
      'Para viajes internacionales necesitas un pasaporte o documento de identidad válido y el billete digital con su código QR. Te recomendamos guardar una copia del billete en tu teléfono y revisar que el nombre coincida exactamente con el documento de identidad. En rutas transfronterizas, consulta también los requisitos migratorios del país de destino.',
  },
  {
    id: 'anticipacion',
    category: 'En la estación',
    question: '¿Con cuánta anticipación debo llegar a la estación?',
    answer:
      'Llega al menos 30 minutos antes de la salida para rutas nacionales y 45–60 minutos para rutas internacionales. Las estaciones con controles de seguridad o migración pueden requerir más tiempo. El andén suele publicarse entre 15 y 20 minutos antes de la partida, y el embarque cierra unos minutos antes de la hora indicada.',
  },
  {
    id: 'equipaje',
    category: 'Equipaje y seguridad',
    question: '¿Cómo funcionan los controles de equipaje y seguridad?',
    answer:
      'Puedes llevar una maleta grande y un bulto de mano por pasajero como equipaje incluido en la mayoría de tarifas. Los artículos prohibidos, como líquidos inflamables o objetos cortantes, deben facturarse o dejarse en casa. En determinadas rutas el equipaje se escanea en el control de acceso; mantén las etiquetas de identificación visibles y conserva tus objetos de valor contigo.',
  },
  {
    id: 'qr',
    category: 'Billetes digitales',
    question: '¿Cómo valido mi QR en el andén?',
    answer:
      'Abre tu billete desde “Mis Billetes” y presenta el código QR en el lector del torniquete o al personal de embarque. Mantén el brillo de la pantalla alto y evita capturas de pantalla borrosas. Si el lector no funciona, muestra el localizador PNR al equipo de la estación para que validen tu reserva manualmente.',
  },
  {
    id: 'cancelaciones',
    category: 'Cambios y reembolsos',
    question: '¿Puedo cancelar o cambiar mi billete?',
    answer:
      'Sí. Las tarifas flexibles permiten cambios y cancelaciones con reembolso completo hasta 24 horas antes de la salida. Las tarifas promocionales pueden tener gastos de gestión o no ser reembolsables. Puedes gestionar el cambio desde “Mis Billetes”; si tu billete ya fue validado en el andén, contacta con atención al cliente para revisar el caso.',
  },
  {
    id: 'mascotas',
    category: 'Viajar con mascotas',
    question: '¿Puedo viajar con mascotas?',
    answer:
      'Las mascotas de hasta 8 kg pueden viajar en un transportín homologado por un máximo de dos por pasajero, normalmente con un suplemento. Los perros de asistencia viajan sin coste y deben acreditarse antes del embarque. En rutas internacionales, verifica las normas sanitarias y la documentación veterinaria exigida por el país de destino.',
  },
];
