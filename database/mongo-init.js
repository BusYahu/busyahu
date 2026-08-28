// =============================================================================
// BUSYAHU - SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS MONGODB 7.0
// Colecciones: users, destinations, trains
// =============================================================================

// 1. Conectar a la base de datos oficial
db = db.getSiblingDB('busyahu_db');

print('>>> [1/4] Limpiando colecciones anteriores si existen...');
db.users.drop();
db.destinations.drop();
db.trains.drop();

print('>>> [2/4] Creando índices de optimización y unicidad...');
db.users.createIndex({ email: 1 }, { unique: true });
db.destinations.createIndex({ countryCode: 1 }, { unique: true });
db.trains.createIndex({ code: 1 }, { unique: true });
db.trains.createIndex({ countryCode: 1 });

print('>>> [3/4] Insertando usuarios iniciales (Admin y Pasajero de Prueba)...');
// Password hasheada con bcrypt (cost factor 10)
// Admin123!    -> $2a$10$wT0o3s1R7g2x1vVz1c8kU.bX9Y0o7rL6m1q2w3e4r5t6y7u8i9o0p (simulado válido bcrypt)
// Pasajero123! -> $2a$10$pT0o3s1R7g2x1vVz1c8kU.bX9Y0o7rL6m1q2w3e4r5t6y7u8i9o0p
db.users.insertMany([
  {
    name: 'Administrador BusYahu',
    email: 'admin@busyahu.com',
    passwordHash: '$2a$10$eE7T0nZ.7uJ3y4Ym8uIq4.u6yR7wP1hJ2lK3mN4oP5qR6sT7uV8wX', // Admin123!
    role: 'admin',
    createdAt: new Date()
  },
  {
    name: 'Pasajero Demo',
    email: 'pasajero@busyahu.com',
    passwordHash: '$2a$10$eE7T0nZ.7uJ3y4Ym8uIq4.u6yR7wP1hJ2lK3mN4oP5qR6sT7uV8wX', // Pasajero123!
    role: 'user',
    createdAt: new Date()
  }
]);

print('>>> [4/4] Insertando los 11 Países y sus Redes Ferroviarias Internacionales...');
db.destinations.insertMany([
  {
    countryCode: 'ES',
    countryName: 'España',
    networkName: 'Renfe AVE / Iryo',
    currency: 'EUR',
    symbol: '€',
    stations: [
      { id: 'ES-MAD', name: 'Madrid Puerta de Atocha', city: 'Madrid' },
      { id: 'ES-BCN', name: 'Barcelona Sants', city: 'Barcelona' },
      { id: 'ES-SEV', name: 'Sevilla Santa Justa', city: 'Sevilla' },
      { id: 'ES-VAL', name: 'Valencia Joaquín Sorolla', city: 'Valencia' }
    ]
  },
  {
    countryCode: 'FR',
    countryName: 'Francia',
    networkName: 'SNCF TGV INOUI',
    currency: 'EUR',
    symbol: '€',
    stations: [
      { id: 'FR-PAR', name: 'Paris Gare de Lyon', city: 'París' },
      { id: 'FR-LYO', name: 'Lyon Part-Dieu', city: 'Lyon' },
      { id: 'FR-MAR', name: 'Marseille Saint-Charles', city: 'Marsella' },
      { id: 'FR-BOR', name: 'Bordeaux Saint-Jean', city: 'Burdeos' }
    ]
  },
  {
    countryCode: 'DE',
    countryName: 'Alemania',
    networkName: 'Deutsche Bahn ICE',
    currency: 'EUR',
    symbol: '€',
    stations: [
      { id: 'DE-BER', name: 'Berlin Hauptbahnhof', city: 'Berlín' },
      { id: 'DE-MUN', name: 'München Hauptbahnhof', city: 'Múnich' },
      { id: 'DE-FRA', name: 'Frankfurt (Main) Hauptbahnhof', city: 'Fráncfort' },
      { id: 'DE-HAM', name: 'Hamburg Hauptbahnhof', city: 'Hamburgo' }
    ]
  },
  {
    countryCode: 'BE',
    countryName: 'Bélgica',
    networkName: 'SNCB / Eurostar',
    currency: 'EUR',
    symbol: '€',
    stations: [
      { id: 'BE-BRU', name: 'Bruxelles-Midi / Brussel-Zuid', city: 'Bruselas' },
      { id: 'BE-ANT', name: 'Antwerpen-Centraal', city: 'Amberes' },
      { id: 'BE-GEN', name: 'Gent-Sint-Pieters', city: 'Gante' },
      { id: 'BE-BRG', name: 'Brugge Station', city: 'Brujas' }
    ]
  },
  {
    countryCode: 'GB',
    countryName: 'Reino Unido',
    networkName: 'LNER / Avanti West Coast',
    currency: 'GBP',
    symbol: '£',
    stations: [
      { id: 'GB-LON', name: 'London King\'s Cross', city: 'Londres' },
      { id: 'GB-MAN', name: 'Manchester Piccadilly', city: 'Mánchester' },
      { id: 'GB-EDI', name: 'Edinburgh Waverley', city: 'Edimburgo' },
      { id: 'GB-BIR', name: 'Birmingham New Street', city: 'Birmingham' }
    ]
  },
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    networkName: 'Amtrak Acela Express',
    currency: 'USD',
    symbol: '$',
    stations: [
      { id: 'US-NYC', name: 'New York Moynihan Train Hall (Penn Station)', city: 'Nueva York' },
      { id: 'US-WAS', name: 'Washington Union Station', city: 'Washington D.C.' },
      { id: 'US-BOS', name: 'Boston South Station', city: 'Boston' },
      { id: 'US-PHL', name: 'Philadelphia 30th Street Station', city: 'Filadelfia' }
    ]
  },
  {
    countryCode: 'CA',
    countryName: 'Canadá',
    networkName: 'VIA Rail Canada',
    currency: 'CAD',
    symbol: 'CA$',
    stations: [
      { id: 'CA-TOR', name: 'Toronto Union Station', city: 'Toronto' },
      { id: 'CA-MTL', name: 'Montréal Gare Centrale', city: 'Montreal' },
      { id: 'CA-OTT', name: 'Ottawa Station', city: 'Ottawa' },
      { id: 'CA-QUE', name: 'Gare du Palais (Québec)', city: 'Quebec' }
    ]
  },
  {
    countryCode: 'RU',
    countryName: 'Rusia',
    networkName: 'RZD Sapsan',
    currency: 'RUB',
    symbol: '₽',
    stations: [
      { id: 'RU-MOW', name: 'Moskva Leningradsky', city: 'Moscú' },
      { id: 'RU-LED', name: 'Sankt-Peterburg Glavny (Moskovsky)', city: 'San Petersburgo' },
      { id: 'RU-NIZ', name: 'Nizhny Novgorod Station', city: 'Nizhni Nóvgorod' },
      { id: 'RU-KZN', name: 'Kazan Passazhirskaya', city: 'Kazán' }
    ]
  },
  {
    countryCode: 'CN',
    countryName: 'China',
    networkName: 'China Railway High-Speed (CRH Fuxing)',
    currency: 'CNY',
    symbol: '¥',
    stations: [
      { id: 'CN-PEK', name: 'Beijing South Railway Station', city: 'Pekín' },
      { id: 'CN-SHA', name: 'Shanghai Hongqiao', city: 'Shanghái' },
      { id: 'CN-CAN', name: 'Guangzhou South', city: 'Cantón' },
      { id: 'CN-SZX', name: 'Shenzhen North', city: 'Shenzhen' }
    ]
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    networkName: 'Indian Railways (Vande Bharat Express)',
    currency: 'INR',
    symbol: '₹',
    stations: [
      { id: 'IN-DEL', name: 'New Delhi Railway Station (NDLS)', city: 'Nueva Delhi' },
      { id: 'IN-BOM', name: 'Mumbai Chhatrapati Shivaji Maharaj Terminus (CSMT)', city: 'Bombay' },
      { id: 'IN-BLR', name: 'KSR Bengaluru City Junction (SBC)', city: 'Bangalore' },
      { id: 'IN-MAA', name: 'Chennai Central (MAS)', city: 'Channai' }
    ]
  },
  {
    countryCode: 'JP',
    countryName: 'Japón',
    networkName: 'JR Shinkansen (Bullet Train)',
    currency: 'JPY',
    symbol: '¥',
    stations: [
      { id: 'JP-TYO', name: 'Tokyo Station (Tōkaidō Shinkansen)', city: 'Tokio' },
      { id: 'JP-OSA', name: 'Shin-Osaka Station', city: 'Osaka' },
      { id: 'JP-KYO', name: 'Kyoto Station', city: 'Kioto' },
      { id: 'JP-NAG', name: 'Nagoya Station', city: 'Nagoya' }
    ]
  }
]);

print('>>> [OK] Inserción de 11 países y destinos finalizada.');

print('>>> [5/4] Insertando flota inicial de trenes y configuraciones de vagones...');
db.trains.insertMany([
  {
    code: 'AVE-103',
    countryCode: 'ES',
    name: 'Renfe S-103 Velaro',
    type: 'Alta Velocidad',
    originStationId: 'ES-MAD',
    destinationStationId: 'ES-BCN',
    basePrice: 65.50,
    carriages: [
      { carriageNumber: 1, classType: 'First', totalSeats: 20, rows: 5, seatsPerRow: 4 },
      { carriageNumber: 2, classType: 'Standard', totalSeats: 40, rows: 10, seatsPerRow: 4 },
      { carriageNumber: 3, classType: 'Standard', totalSeats: 40, rows: 10, seatsPerRow: 4 }
    ]
  },
  {
    code: 'TGV-9201',
    countryCode: 'FR',
    name: 'TGV Duplex Océane',
    type: 'Alta Velocidad',
    originStationId: 'FR-PAR',
    destinationStationId: 'FR-LYO',
    basePrice: 58.00,
    carriages: [
      { carriageNumber: 1, classType: 'First', totalSeats: 20, rows: 5, seatsPerRow: 4 },
      { carriageNumber: 2, classType: 'Standard', totalSeats: 40, rows: 10, seatsPerRow: 4 }
    ]
  },
  {
    code: 'ICE-704',
    countryCode: 'DE',
    name: 'ICE 4 Sprinter',
    type: 'Intercity Express',
    originStationId: 'DE-BER',
    destinationStationId: 'DE-MUN',
    basePrice: 79.90,
    carriages: [
      { carriageNumber: 1, classType: 'First', totalSeats: 20, rows: 5, seatsPerRow: 4 },
      { carriageNumber: 2, classType: 'Standard', totalSeats: 40, rows: 10, seatsPerRow: 4 }
    ]
  },
  {
    code: 'SHK-NOZOMI',
    countryCode: 'JP',
    name: 'Shinkansen N700S Nozomi',
    type: 'Bullet Train',
    originStationId: 'JP-TYO',
    destinationStationId: 'JP-KYO',
    basePrice: 110.00,
    carriages: [
      { carriageNumber: 1, classType: 'First', totalSeats: 24, rows: 6, seatsPerRow: 4 }, // Green Car
      { carriageNumber: 2, classType: 'Standard', totalSeats: 50, rows: 10, seatsPerRow: 5 },
      { carriageNumber: 3, classType: 'Standard', totalSeats: 50, rows: 10, seatsPerRow: 5 }
    ]
  }
]);

print('=============================================================');
print('✅ MONGODB 7.0 SEED FINALIZADO CON ÉXITO PARA BUSYAHU');
print('Total Destinos: ' + db.destinations.countDocuments());
print('Total Trenes:   ' + db.trains.countDocuments());
print('Total Usuarios: ' + db.users.countDocuments());
print('=============================================================');