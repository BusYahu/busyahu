"""
Datos iniciales y semillas (11 Países, Terminales y Catálogo de Trenes)
Garantiza coherencia total con database/mongo-init.js y el contrato OpenAPI
"""

SEED_DESTINATIONS = [
    {
        "id": "es",
        "country": "España",
        "countryCode": "ES",
        "flagEmoji": "🇪🇸",
        "currency": "EUR",
        "currencySymbol": "€",
        "cities": [
            {"name": "Madrid", "station": "Madrid-Puerta de Atocha"},
            {"name": "Barcelona", "station": "Barcelona-Sants"},
            {"name": "Sevilla", "station": "Sevilla-Santa Justa"},
            {"name": "Valencia", "station": "València-Joaquín Sorolla"}
        ]
    },
    {
        "id": "fr",
        "country": "Francia",
        "countryCode": "FR",
        "flagEmoji": "🇫🇷",
        "currency": "EUR",
        "currencySymbol": "€",
        "cities": [
            {"name": "París", "station": "Paris-Gare de Lyon"},
            {"name": "Lyon", "station": "Lyon-Part-Dieu"},
            {"name": "Marsella", "station": "Marseille-Saint-Charles"},
            {"name": "Burdeos", "station": "Bordeaux-Saint-Jean"}
        ]
    },
    {
        "id": "de",
        "country": "Alemania",
        "countryCode": "DE",
        "flagEmoji": "🇩🇪",
        "currency": "EUR",
        "currencySymbol": "€",
        "cities": [
            {"name": "Berlín", "station": "Berlin Hauptbahnhof"},
            {"name": "Múnich", "station": "München Hbf"},
            {"name": "Fráncfort", "station": "Frankfurt (Main) Hbf"},
            {"name": "Hamburgo", "station": "Hamburg Hbf"}
        ]
    },
    {
        "id": "be",
        "country": "Bélgica",
        "countryCode": "BE",
        "flagEmoji": "🇧🇪",
        "currency": "EUR",
        "currencySymbol": "€",
        "cities": [
            {"name": "Bruselas", "station": "Bruxelles-Midi / Brussel-Zuid"},
            {"name": "Brujas", "station": "Station Brugge"},
            {"name": "Gante", "station": "Gent-Sint-Pieters"},
            {"name": "Amberes", "station": "Antwerpen-Centraal"}
        ]
    },
    {
        "id": "uk",
        "country": "Reino Unido",
        "countryCode": "GB",
        "flagEmoji": "🇬🇧",
        "currency": "GBP",
        "currencySymbol": "£",
        "cities": [
            {"name": "Londres", "station": "London King's Cross"},
            {"name": "Edimburgo", "station": "Edinburgh Waverley"},
            {"name": "Manchester", "station": "Manchester Piccadilly"},
            {"name": "Birmingham", "station": "Birmingham New Street"}
        ]
    },
    {
        "id": "us",
        "country": "Estados Unidos",
        "countryCode": "US",
        "flagEmoji": "🇺🇸",
        "currency": "USD",
        "currencySymbol": "$",
        "cities": [
            {"name": "Nueva York", "station": "New York Penn Station"},
            {"name": "Washington D.C.", "station": "Washington Union Station"},
            {"name": "Boston", "station": "Boston South Station"},
            {"name": "Filadelfia", "station": "30th Street Station"}
        ]
    },
    {
        "id": "ca",
        "country": "Canadá",
        "countryCode": "CA",
        "flagEmoji": "🇨🇦",
        "currency": "CAD",
        "currencySymbol": "CA$",
        "cities": [
            {"name": "Toronto", "station": "Toronto Union Station"},
            {"name": "Montreal", "station": "Gare Centrale de Montréal"},
            {"name": "Ottawa", "station": "Ottawa Train Station"},
            {"name": "Quebec", "station": "Gare du Palais"}
        ]
    },
    {
        "id": "ru",
        "country": "Rusia",
        "countryCode": "RU",
        "flagEmoji": "🇷🇺",
        "currency": "RUB",
        "currencySymbol": "₽",
        "cities": [
            {"name": "Moscú", "station": "Leningradsky Station"},
            {"name": "San Petersburgo", "station": "Moskovsky Glavny Station"},
            {"name": "Kazán", "station": "Kazan-Passazhirskaya"},
            {"name": "Nizhny Novgorod", "station": "Nizhny Novgorod Station"}
        ]
    },
    {
        "id": "cn",
        "country": "China",
        "countryCode": "CN",
        "flagEmoji": "🇨🇳",
        "currency": "CNY",
        "currencySymbol": "¥",
        "cities": [
            {"name": "Pekín", "station": "Beijing South Railway Station"},
            {"name": "Shanghái", "station": "Shanghai Hongqiao"},
            {"name": "Guangzhou", "station": "Guangzhou South"}
        ]
    },
    {
        "id": "in",
        "country": "India",
        "countryCode": "IN",
        "flagEmoji": "🇮🇳",
        "currency": "INR",
        "currencySymbol": "₹",
        "cities": [
            {"name": "Nueva Delhi", "station": "New Delhi Railway Station"},
            {"name": "Varanasi", "station": "Varanasi Junction"},
            {"name": "Mumbai", "station": "Chhatrapati Shivaji Maharaj Terminus"},
            {"name": "Jaipur", "station": "Jaipur Junction"}
        ]
    },
    {
        "id": "jp",
        "country": "Japón",
        "countryCode": "JP",
        "flagEmoji": "🇯🇵",
        "currency": "JPY",
        "currencySymbol": "¥",
        "cities": [
            {"name": "Tokio", "station": "Tokyo Station (東京駅)"},
            {"name": "Kioto", "station": "Kyoto Station (京都駅)"},
            {"name": "Osaka", "station": "Shin-Osaka Station (新大阪駅)"},
            {"name": "Hiroshima", "station": "Hiroshima Station (広島駅)"}
        ]
    }
]

SEED_TRAINS = [
    # España
    {
        "id": "es-01",
        "trainNumber": "AVE 03102",
        "operator": "Renfe AVE",
        "country": "España",
        "fromCity": "Madrid",
        "fromStation": "Madrid-Puerta de Atocha",
        "toCity": "Barcelona",
        "toStation": "Barcelona-Sants",
        "departureTime": "08:30",
        "arrivalTime": "11:00",
        "duration": "2h 30m",
        "basePrice": 65,
        "currency": "EUR",
        "trainModel": "Talgo S-103 Alta Velocidad",
        "availableSeatsCount": 42,
        "amenities": ["Wi-Fi Gratuito", "Toma de corriente", "Coche cafetería", "Silencio", "Pantallas de entretenimiento"]
    },
    {
        "id": "es-02",
        "trainNumber": "OUIGO 06720",
        "operator": "Ouigo España",
        "country": "España",
        "fromCity": "Madrid",
        "fromStation": "Madrid-Puerta de Atocha",
        "toCity": "Barcelona",
        "toStation": "Barcelona-Sants",
        "departureTime": "13:15",
        "arrivalTime": "15:45",
        "duration": "2h 30m",
        "basePrice": 39,
        "currency": "EUR",
        "trainModel": "Alstom Euroduplex Doble Piso",
        "availableSeatsCount": 58,
        "amenities": ["Wi-Fi Ouigo Plus", "Toma eléctrica", "Cafetería a bordo"]
    },
    {
        "id": "es-03",
        "trainNumber": "ALVIA 02143",
        "operator": "Renfe Alvia",
        "country": "España",
        "fromCity": "Madrid",
        "fromStation": "Madrid-Puerta de Atocha",
        "toCity": "Sevilla",
        "toStation": "Sevilla-Santa Justa",
        "departureTime": "10:00",
        "arrivalTime": "12:35",
        "duration": "2h 35m",
        "basePrice": 52,
        "currency": "EUR",
        "trainModel": "Talgo Serie 130",
        "availableSeatsCount": 38,
        "amenities": ["Wi-Fi PlayRenfe", "Cafetería", "Asientos Confort"]
    },
    # Francia
    {
        "id": "fr-01",
        "trainNumber": "TGV 6605",
        "operator": "SNCF TGV inOui",
        "country": "Francia",
        "fromCity": "París",
        "fromStation": "Paris-Gare de Lyon",
        "toCity": "Lyon",
        "toStation": "Lyon-Part-Dieu",
        "departureTime": "09:00",
        "arrivalTime": "10:57",
        "duration": "1h 57m",
        "basePrice": 72,
        "currency": "EUR",
        "trainModel": "TGV Duplex 320 km/h",
        "availableSeatsCount": 35,
        "amenities": ["Wi-Fi TGV", "Le Bar TGV", "Asientos reclinables", "Espacio equipaje"]
    },
    {
        "id": "fr-02",
        "trainNumber": "TGV 6121",
        "operator": "SNCF TGV inOui",
        "country": "Francia",
        "fromCity": "París",
        "fromStation": "Paris-Gare de Lyon",
        "toCity": "Marsella",
        "toStation": "Marseille-Saint-Charles",
        "departureTime": "11:30",
        "arrivalTime": "14:45",
        "duration": "3h 15m",
        "basePrice": 88,
        "currency": "EUR",
        "trainModel": "TGV Océane",
        "availableSeatsCount": 40,
        "amenities": ["Wi-Fi TGV", "Le Bar TGV", "Enchufes USB"]
    },
    # Alemania
    {
        "id": "de-01",
        "trainNumber": "ICE 705",
        "operator": "Deutsche Bahn ICE",
        "country": "Alemania",
        "fromCity": "Berlín",
        "fromStation": "Berlin Hauptbahnhof",
        "toCity": "Múnich",
        "toStation": "München Hbf",
        "departureTime": "07:05",
        "arrivalTime": "11:15",
        "duration": "4h 10m",
        "basePrice": 85,
        "currency": "EUR",
        "trainModel": "ICE 4 Hochgeschwindigkeitszug",
        "availableSeatsCount": 28,
        "amenities": ["Bordrestaurant", "WLAN gratis", "Enchufes USB/220V", "Zona Ruhebereich"]
    },
    {
        "id": "de-02",
        "trainNumber": "ICE 573",
        "operator": "Deutsche Bahn ICE",
        "country": "Alemania",
        "fromCity": "Fráncfort",
        "fromStation": "Frankfurt (Main) Hbf",
        "toCity": "Berlín",
        "toStation": "Berlin Hauptbahnhof",
        "departureTime": "14:15",
        "arrivalTime": "18:25",
        "duration": "4h 10m",
        "basePrice": 78,
        "currency": "EUR",
        "trainModel": "ICE 3 Neo",
        "availableSeatsCount": 44,
        "amenities": ["Bordbistro", "Wi-Fi rápido", "Asientos ergonómicos"]
    },
    # Bélgica
    {
        "id": "be-01",
        "trainNumber": "IC 1508",
        "operator": "SNCB InterCity",
        "country": "Bélgica",
        "fromCity": "Bruselas",
        "fromStation": "Bruxelles-Midi / Brussel-Zuid",
        "toCity": "Brujas",
        "toStation": "Station Brugge",
        "departureTime": "10:23",
        "arrivalTime": "11:18",
        "duration": "0h 55m",
        "basePrice": 16,
        "currency": "EUR",
        "trainModel": "SNCB Desiro ML",
        "availableSeatsCount": 60,
        "amenities": ["Climatización", "Piso bajo accesible", "Bicicletero"]
    },
    {
        "id": "be-02",
        "trainNumber": "IC 1820",
        "operator": "SNCB InterCity",
        "country": "Bélgica",
        "fromCity": "Bruselas",
        "fromStation": "Bruxelles-Midi / Brussel-Zuid",
        "toCity": "Gante",
        "toStation": "Gent-Sint-Pieters",
        "departureTime": "12:10",
        "arrivalTime": "12:45",
        "duration": "0h 35m",
        "basePrice": 12,
        "currency": "EUR",
        "trainModel": "SNCB M7 Double Decker",
        "availableSeatsCount": 55,
        "amenities": ["Wi-Fi", "Aire acondicionado", "Tomas eléctricas"]
    },
    # Reino Unido
    {
        "id": "uk-01",
        "trainNumber": "AZUMA 1E09",
        "operator": "LNER Azuma",
        "country": "Reino Unido",
        "fromCity": "Londres",
        "fromStation": "London King's Cross",
        "toCity": "Edimburgo",
        "toStation": "Edinburgh Waverley",
        "departureTime": "11:00",
        "arrivalTime": "15:20",
        "duration": "4h 20m",
        "basePrice": 78,
        "currency": "GBP",
        "trainModel": "Hitachi Class 800 Azuma",
        "availableSeatsCount": 31,
        "amenities": ["LNER Wi-Fi", "Café Bar", "Tomas en cada asiento", "Vistas panorámicas"]
    },
    {
        "id": "uk-02",
        "trainNumber": "AVANTI 390",
        "operator": "Avanti West Coast",
        "country": "Reino Unido",
        "fromCity": "Londres",
        "fromStation": "London Euston",
        "toCity": "Manchester",
        "toStation": "Manchester Piccadilly",
        "departureTime": "13:40",
        "arrivalTime": "15:46",
        "duration": "2h 06m",
        "basePrice": 65,
        "currency": "GBP",
        "trainModel": "Class 390 Pendolino",
        "availableSeatsCount": 42,
        "amenities": ["Avanti Wi-Fi", "Tienda a bordo", "Primera clase lounge"]
    },
    # Estados Unidos
    {
        "id": "us-01",
        "trainNumber": "Acela 2150",
        "operator": "Amtrak Acela Express",
        "country": "Estados Unidos",
        "fromCity": "Nueva York",
        "fromStation": "New York Penn Station",
        "toCity": "Washington D.C.",
        "toStation": "Washington Union Station",
        "departureTime": "06:45",
        "arrivalTime": "09:40",
        "duration": "2h 55m",
        "basePrice": 120,
        "currency": "USD",
        "trainModel": "Amtrak Acela II High Speed",
        "availableSeatsCount": 22,
        "amenities": ["AmtrakConnect Wi-Fi", "Café Car", "Quiet Car", "Asientos de cuero anchos"]
    },
    {
        "id": "us-02",
        "trainNumber": "NE Regional 172",
        "operator": "Amtrak",
        "country": "Estados Unidos",
        "fromCity": "Nueva York",
        "fromStation": "New York Penn Station",
        "toCity": "Boston",
        "toStation": "Boston South Station",
        "departureTime": "10:15",
        "arrivalTime": "14:30",
        "duration": "4h 15m",
        "basePrice": 85,
        "currency": "USD",
        "trainModel": "Airo Trainset",
        "availableSeatsCount": 48,
        "amenities": ["Wi-Fi", "Café Car", "Equipaje gratuito"]
    },
    # Canadá
    {
        "id": "ca-01",
        "trainNumber": "VIA 64",
        "operator": "VIA Rail Canada",
        "country": "Canadá",
        "fromCity": "Toronto",
        "fromStation": "Toronto Union Station",
        "toCity": "Montreal",
        "toStation": "Gare Centrale de Montréal",
        "departureTime": "09:20",
        "arrivalTime": "14:25",
        "duration": "5h 05m",
        "basePrice": 94,
        "currency": "CAD",
        "trainModel": "Siemens Venture Trainset",
        "availableSeatsCount": 39,
        "amenities": ["Wi-Fi Onboard", "Servicio de comida a bordo", "Espacio para bicicletas"]
    },
    {
        "id": "ca-02",
        "trainNumber": "VIA 52",
        "operator": "VIA Rail Canada",
        "country": "Canadá",
        "fromCity": "Toronto",
        "fromStation": "Toronto Union Station",
        "toCity": "Ottawa",
        "toStation": "Ottawa Train Station",
        "departureTime": "11:45",
        "arrivalTime": "16:15",
        "duration": "4h 30m",
        "basePrice": 76,
        "currency": "CAD",
        "trainModel": "Corridor Express",
        "availableSeatsCount": 35,
        "amenities": ["Wi-Fi", "Snack Bar", "Asientos reclinables"]
    },
    # Rusia
    {
        "id": "ru-01",
        "trainNumber": "Sapsan 758A",
        "operator": "RZD Sapsan Express",
        "country": "Rusia",
        "fromCity": "Moscú",
        "fromStation": "Leningradsky Station",
        "toCity": "San Petersburgo",
        "toStation": "Moskovsky Glavny Station",
        "departureTime": "07:00",
        "arrivalTime": "10:50",
        "duration": "3h 50m",
        "basePrice": 3400,
        "currency": "RUB",
        "trainModel": "Siemens Velaro RUS",
        "availableSeatsCount": 45,
        "amenities": ["Vagón Bistro", "Mediacenter Wi-Fi", "Tomas de 220V", "Servicio de té"]
    },
    # China
    {
        "id": "cn-01",
        "trainNumber": "G1 Fuxing",
        "operator": "China Railway High-Speed",
        "country": "China",
        "fromCity": "Pekín",
        "fromStation": "Beijing South Railway Station",
        "toCity": "Shanghái",
        "toStation": "Shanghai Hongqiao",
        "departureTime": "09:00",
        "arrivalTime": "13:28",
        "duration": "4h 28m",
        "basePrice": 553,
        "currency": "CNY",
        "trainModel": "CR400AF Fuxing Hao 350 km/h",
        "availableSeatsCount": 75,
        "amenities": ["Wi-Fi 5G alta velocidad", "Coche comedor", "Tomas de carga rápida", "Servicio de té caliente"]
    },
    # India
    {
        "id": "in-01",
        "trainNumber": "22436 Vande Bharat",
        "operator": "Indian Railways",
        "country": "India",
        "fromCity": "Nueva Delhi",
        "fromStation": "New Delhi Railway Station",
        "toCity": "Varanasi",
        "toStation": "Varanasi Junction",
        "departureTime": "06:00",
        "arrivalTime": "14:00",
        "duration": "8h 00m",
        "basePrice": 1750,
        "currency": "INR",
        "trainModel": "Train 18 Vande Bharat Semi-High Speed",
        "availableSeatsCount": 68,
        "amenities": ["Comida incluida", "Pantallas de info", "Asientos giratorios 180°", "Puertas automáticas"]
    },
    # Japón
    {
        "id": "jp-01",
        "trainNumber": "Nozomi 213",
        "operator": "JR Central Shinkansen",
        "country": "Japón",
        "fromCity": "Tokio",
        "fromStation": "Tokyo Station (東京駅)",
        "toCity": "Osaka",
        "toStation": "Shin-Osaka Station (新大阪駅)",
        "departureTime": "08:00",
        "arrivalTime": "10:25",
        "duration": "2h 25m",
        "basePrice": 14720,
        "currency": "JPY",
        "trainModel": "Shinkansen N700S Supreme 285 km/h",
        "availableSeatsCount": 54,
        "amenities": ["Shinkansen Free Wi-Fi", "Enchufe individual", "Servicio de carrito de bento", "Extrema puntualidad"]
    }
]
