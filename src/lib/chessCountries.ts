/**
 * Comprehensive list of major chess-playing nations
 * Based on FIDE member federations and countries with strong chess traditions
 * Focused on countries with active chess communities and tournament participation
 */
export const MAJOR_CHESS_COUNTRIES = [
  // Top Chess Nations (by FIDE rating, grandmasters, and tournament activity)
  'Russia',
  'United States',
  'USA', // Also include USA for compatibility
  'China',
  'India',
  'Ukraine',
  'France',
  'Germany',
  'Spain',
  'Poland',
  'Netherlands',
  'England',
  'Italy',
  'Hungary',
  'Azerbaijan',
  'Armenia',
  'Israel',
  'Croatia',
  'Serbia',
  'Bulgaria',
  'Romania',
  'Czech Republic',
  'Slovakia',
  'Greece',
  'Turkey',
  'Georgia',
  'Kazakhstan',
  'Uzbekistan',
  'Belarus',
  'Moldova',
  'Lithuania',
  'Latvia',
  'Estonia',
  'Sweden',
  'Norway',
  'Denmark',
  'Iceland',
  'Finland',
  'Switzerland',
  'Austria',
  'Belgium',
  'Portugal',
  'Ireland',
  'Scotland',
  'Wales',
  'United Kingdom',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'Venezuela',
  'Cuba',
  'Australia',
  'New Zealand',
  'Philippines',
  'Indonesia',
  'Vietnam',
  'Thailand',
  'Malaysia',
  'Singapore',
  'Bangladesh',
  'Pakistan',
  'Sri Lanka',
  'Iran',
  'Iraq',
  'Egypt',
  'Algeria',
  'Morocco',
  'Tunisia',
  'South Africa',
  'Nigeria',
  'Japan',
  'South Korea',
  'Mongolia',
  'Qatar',
  'United Arab Emirates',
  'Saudi Arabia',
  'Lebanon',
  'Jordan',
  'Syria',
  'Yemen',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Cyprus',
  'Malta',
  'Luxembourg',
  'Bosnia and Herzegovina',
  'North Macedonia',
  'Albania',
  'Montenegro',
  'Slovenia',
  'Kosovo',
  // Additional countries with active chess communities
  'Ecuador',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Panama',
  'Costa Rica',
  'Guatemala',
  'Honduras',
  'El Salvador',
  'Nicaragua',
  'Dominican Republic',
  'Jamaica',
  'Trinidad and Tobago',
  'Barbados',
  'Guyana',
  'Suriname',
  'Belize',
  'Bahamas',
  'Haiti',
  'Puerto Rico',
  'Zimbabwe',
  'Kenya',
  'Tanzania',
  'Uganda',
  'Ghana',
  'Ethiopia',
  'Libya',
  'Sudan',
  'Zambia',
  'Botswana',
  'Namibia',
  'Mauritius',
  'Madagascar',
  'Senegal',
  'Ivory Coast',
  'Cameroon',
  'Gabon',
  'Congo',
  'DR Congo',
  'Rwanda',
  'Afghanistan',
  'Nepal',
  'Myanmar',
  'Cambodia',
  'Laos',
  'Brunei',
  'Papua New Guinea',
  'Fiji',
].filter((country, index, self) => self.indexOf(country) === index) // Remove duplicates
  .sort(); // Sort alphabetically

/**
 * Comprehensive list of major cities for each chess-playing country
 * Organized by country for easy lookup and filtering
 */
export const MAJOR_CHESS_CITIES_BY_COUNTRY: Record<string, string[]> = {
  'USA': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
    'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
    'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs',
    'Raleigh', 'Virginia Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Cleveland', 'Wichita', 'Arlington', 'Tampa',
    'New Orleans', 'Honolulu', 'Orlando', 'St. Louis', 'Cincinnati', 'Pittsburgh', 'Buffalo', 'Riverside', 'St. Paul', 'Corpus Christi'
  ],
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
    'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
    'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs',
    'Raleigh', 'Virginia Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Cleveland', 'Wichita', 'Arlington', 'Tampa',
    'New Orleans', 'Honolulu', 'Orlando', 'St. Louis', 'Cincinnati', 'Pittsburgh', 'Buffalo', 'Riverside', 'St. Paul', 'Corpus Christi'
  ],
  'Russia': [
    'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don',
    'Ufa', 'Krasnoyarsk', 'Voronezh', 'Perm', 'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen', 'Izhevsk', 'Barnaul',
    'Irkutsk', 'Ulyanovsk', 'Khabarovsk', 'Yaroslavl', 'Vladivostok', 'Makhachkala', 'Tomsk', 'Orenburg', 'Kemerovo', 'Novokuznetsk'
  ],
  'China': [
    'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin',
    'Suzhou', 'Chongqing', 'Changsha', 'Zhengzhou', 'Dongguan', 'Shenyang', 'Ningbo', 'Qingdao', 'Kunming', 'Dalian',
    'Xiamen', 'Jinan', 'Fuzhou', 'Harbin', 'Changchun', 'Shijiazhuang', 'Taiyuan', 'Nanchang', 'Hefei', 'Nanning'
  ],
  'India': [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
    'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Navi Mumbai'
  ],
  'Ukraine': [
    'Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol',
    'Luhansk', 'Vinnytsia', 'Sevastopol', 'Simferopol', 'Kherson', 'Poltava', 'Chernihiv', 'Cherkasy', 'Sumy', 'Zhytomyr'
  ],
  'France': [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
    'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne',
    'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Limoges', 'Tours', 'Amiens', 'Perpignan', 'Metz'
  ],
  'Germany': [
    'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
    'Bremen', 'Dresden', 'Hannover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
    'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen'
  ],
  'Spain': [
    'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
    'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', 'Granada', 'Vitoria-Gasteiz', 'Elche', 'Santa Cruz de Tenerife',
    'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera', 'Sabadell', 'Móstoles', 'Santa Coloma de Gramenet', 'Pamplona', 'Almería'
  ],
  'Poland': [
    'Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice',
    'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec', 'Toruń', 'Kielce', 'Gliwice', 'Zabrze', 'Bytom',
    'Olsztyn', 'Rzeszów', 'Ruda Śląska', 'Rybnik', 'Tychy', 'Dąbrowa Górnicza', 'Płock', 'Elbląg', 'Opole', 'Gorzów Wielkopolski'
  ],
  'Netherlands': [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen',
    'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Hoofddorp', 'Maastricht', 'Leiden', 'Dordrecht'
  ],
  'England': [
    'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Sheffield', 'Edinburgh', 'Liverpool', 'Bristol', 'Cardiff',
    'Coventry', 'Leicester', 'Sunderland', 'Belfast', 'Newcastle upon Tyne', 'Nottingham', 'Kingston upon Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton'
  ],
  'United Kingdom': [
    'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Sheffield', 'Edinburgh', 'Liverpool', 'Bristol', 'Cardiff',
    'Coventry', 'Leicester', 'Sunderland', 'Belfast', 'Newcastle upon Tyne', 'Nottingham', 'Kingston upon Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton'
  ],
  'Italy': [
    'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania',
    'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Brescia', 'Parma', 'Taranto', 'Prato', 'Modena',
    'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara'
  ],
  'Hungary': [
    'Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely',
    'Szolnok', 'Érd', 'Tatabánya', 'Sopron', 'Kaposvár', 'Veszprém', 'Békéscsaba', 'Zalaegerszeg', 'Eger', 'Nagykanizsa'
  ],
  'Azerbaijan': [
    'Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Lankaran', 'Saatli', 'Qabala', 'Shaki', 'Yevlakh', 'Khankendi'
  ],
  'Armenia': [
    'Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Abovyan', 'Kapan', 'Hrazdan', 'Armavir', 'Artashat', 'Goris'
  ],
  'Israel': [
    'Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Holon', 'Bnei Brak',
    'Ramat Gan', 'Rehovot', 'Bat Yam', 'Ashkelon', 'Herzliya', 'Kfar Saba', 'Hadera', 'Modiin', 'Lod', 'Nazareth'
  ],
  'Croatia': [
    'Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Sesvete', 'Karlovac', 'Varaždin'
  ],
  'Serbia': [
    'Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Novi Pazar', 'Kraljevo'
  ],
  'Bulgaria': [
    'Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen'
  ],
  'Romania': [
    'Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea'
  ],
  'Czech Republic': [
    'Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Ústí nad Labem', 'České Budějovice', 'Hradec Králové', 'Pardubice'
  ],
  'Slovakia': [
    'Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Trenčín', 'Martin', 'Poprad'
  ],
  'Greece': [
    'Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Kavala'
  ],
  'Turkey': [
    'Istanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Kayseri', 'Mersin',
    'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa', 'Adapazarı', 'Malatya', 'Erzurum', 'Van', 'Batman'
  ],
  'Georgia': [
    'Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori', 'Zugdidi', 'Poti', 'Khashuri', 'Senaki', 'Zestafoni'
  ],
  'Kazakhstan': [
    'Almaty', 'Nur-Sultan', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau'
  ],
  'Uzbekistan': [
    'Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan', 'Nukus', 'Qarshi', 'Fergana', 'Kokand', 'Margilan'
  ],
  'Belarus': [
    'Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Grodno', 'Brest', 'Bobruisk', 'Baranavichy', 'Borisov', 'Pinsk'
  ],
  'Moldova': [
    'Chișinău', 'Tiraspol', 'Bălți', 'Bender', 'Rîbnița', 'Cahul', 'Ungheni', 'Soroca', 'Orhei', 'Dubăsari'
  ],
  'Lithuania': [
    'Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena'
  ],
  'Latvia': [
    'Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala', 'Ventspils', 'Rēzekne', 'Valmiera', 'Jēkabpils', 'Ogre'
  ],
  'Estonia': [
    'Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Maardu', 'Rakvere', 'Kuressaare', 'Sillamäe'
  ],
  'Sweden': [
    'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'
  ],
  'Norway': [
    'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Fredrikstad', 'Sandnes', 'Tromsø', 'Sarpsborg'
  ],
  'Denmark': [
    'Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'
  ],
  'Iceland': [
    'Reykjavík', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Reykjanesbær', 'Garðabær', 'Mosfellsbær', 'Árborg', 'Akranes', 'Fjarðabyggð'
  ],
  'Finland': [
    'Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'
  ],
  'Switzerland': [
    'Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel'
  ],
  'Austria': [
    'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'
  ],
  'Belgium': [
    'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'
  ],
  'Portugal': [
    'Lisbon', 'Porto', 'Amadora', 'Braga', 'Setúbal', 'Coimbra', 'Queluz', 'Funchal', 'Cacém', 'Vila Nova de Gaia'
  ],
  'Ireland': [
    'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan'
  ],
  'Scotland': [
    'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Perth', 'Stirling', 'Ayr', 'Kilmarnock', 'Paisley'
  ],
  'Wales': [
    'Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Rhondda', 'Caerphilly', 'Bridgend', 'Port Talbot', 'Llanelli'
  ],
  'Canada': [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
    'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke', 'St. John\'s', 'Barrie'
  ],
  'Mexico': [
    'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí',
    'Mérida', 'Mexicali', 'Aguascalientes', 'Tlalnepantla', 'Chihuahua', 'Naucalpan', 'Cancún', 'Saltillo', 'Hermosillo', 'Culiacán'
  ],
  'Brazil': [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre',
    'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'
  ],
  'Argentina': [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan',
    'Resistencia', 'Santiago del Estero', 'Corrientes', 'Bahía Blanca', 'Posadas', 'Paraná', 'Neuquén', 'Formosa', 'San Salvador de Jujuy', 'La Rioja'
  ],
  'Chile': [
    'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Iquique'
  ],
  'Colombia': [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué'
  ],
  'Peru': [
    'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Huancayo', 'Pucallpa'
  ],
  'Venezuela': [
    'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'Ciudad Bolívar', 'San Cristóbal'
  ],
  'Cuba': [
    'Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo', 'Bayamo', 'Las Tunas', 'Cienfuegos', 'Pinar del Río'
  ],
  'Australia': [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong',
    'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Toowoomba', 'Darwin', 'Ballarat', 'Bendigo', 'Albury', 'Launceston'
  ],
  'New Zealand': [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua'
  ],
  'Philippines': [
    'Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City', 'Zamboanga City', 'Antipolo', 'Pasig', 'Taguig', 'Cagayan de Oro',
    'Parañaque', 'Dasmariñas', 'Valenzuela', 'Bacoor', 'Las Piñas', 'Makati', 'San Jose del Monte', 'Muntinlupa', 'Marikina', 'Mandaue'
  ],
  'Indonesia': [
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar', 'Tangerang', 'Depok', 'Batam',
    'Pekanbaru', 'Padang', 'Denpasar', 'Malang', 'Bandar Lampung', 'Bogor', 'Jambi', 'Cimahi', 'Pontianak', 'Manado'
  ],
  'Vietnam': [
    'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Can Tho', 'Bien Hoa', 'Hue', 'Nha Trang', 'Vung Tau', 'Quy Nhon'
  ],
  'Thailand': [
    'Bangkok', 'Nonthaburi', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai', 'Udon Thani', 'Pak Kret', 'Khon Kaen', 'Chaophraya Surasak', 'Ubon Ratchathani'
  ],
  'Malaysia': [
    'Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Melaka', 'Kota Kinabalu', 'Kuching', 'Kota Bharu'
  ],
  'Singapore': [
    'Singapore'
  ],
  'Bangladesh': [
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Comilla', 'Narayanganj', 'Mymensingh'
  ],
  'Pakistan': [
    'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Peshawar', 'Quetta', 'Islamabad', 'Sargodha',
    'Sialkot', 'Bahawalpur', 'Sukkur', 'Larkana', 'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur', 'Mardan'
  ],
  'Sri Lanka': [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Ratnapura', 'Matara', 'Batticaloa', 'Trincomalee'
  ],
  'Iran': [
    'Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia',
    'Rasht', 'Zahedan', 'Hamadan', 'Kerman', 'Yazd', 'Ardabil', 'Bandar Abbas', 'Arak', 'Eslamshahr', 'Zanjan'
  ],
  'Iraq': [
    'Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Nasiriyah', 'Amarah', 'Ramadi', 'Fallujah'
  ],
  'Egypt': [
    'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Asyut', 'Ismailia', 'Faiyum',
    'Zagazig', 'Aswan', 'Damietta', 'Mansoura', 'Damanhur', 'Minya', 'Beni Suef', 'Qena', 'Sohag', 'Hurghada'
  ],
  'Algeria': [
    'Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra'
  ],
  'Morocco': [
    'Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'
  ],
  'Tunisia': [
    'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous'
  ],
  'South Africa': [
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Kimberley', 'Polokwane', 'Nelspruit'
  ],
  'Nigeria': [
    'Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Kaduna', 'Maiduguri', 'Zaria', 'Aba',
    'Jos', 'Ilorin', 'Onitsha', 'Warri', 'Abeokuta', 'Enugu', 'Akure', 'Owerri', 'Calabar', 'Uyo'
  ],
  'Japan': [
    'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama',
    'Hiroshima', 'Sendai', 'Chiba', 'Kitakyushu', 'Sakai', 'Niigata', 'Hamamatsu', 'Kumamoto', 'Sagamihara', 'Shizuoka'
  ],
  'South Korea': [
    'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang',
    'Seongnam', 'Gimhae', 'Bucheon', 'Ansan', 'Anyang', 'Jeonju', 'Cheonan', 'Namyangju', 'Hwaseong', 'Pohang'
  ],
  'Mongolia': [
    'Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan', 'Mörön', 'Nalaikh', 'Bayankhongor', 'Ölgii', 'Khovd', 'Ulaangom'
  ],
  'Qatar': [
    'Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Dukhan', 'Mesaieed', 'Al Shamal', 'Madinat ash Shamal', 'Umm Salal', 'Al Daayen'
  ],
  'United Arab Emirates': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Fujairah'
  ],
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Abha', 'Tabuk', 'Buraydah',
    'Khamis Mushait', 'Hail', 'Najran', 'Al Jubail', 'Jizan', 'Yanbu', 'Al Kharj', 'Arar', 'Sakaka', 'Jazan'
  ],
  'Lebanon': [
    'Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos', 'Batroun'
  ],
  'Jordan': [
    'Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Wadi as-Sir', 'Aqaba', 'Madaba', 'Salt', 'Mafraq', 'Karak'
  ],
  'Syria': [
    'Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Raqqa', 'Deir ez-Zor', 'Al-Hasakah', 'Qamishli', 'Tartus'
  ],
  'Yemen': [
    'Sana\'a', 'Aden', 'Ta\'izz', 'Al Hudaydah', 'Ibb', 'Dhamar', 'Al Mukalla', 'Zinjibar', 'Say\'un', 'Ash Shihr'
  ],
  'Kuwait': [
    'Kuwait City', 'Al Ahmadi', 'Hawalli', 'Al Jahra', 'Al Farwaniyah', 'Mubarak Al-Kabeer', 'Al Asimah', 'Salmiya', 'Mahboula', 'Fahaheel'
  ],
  'Bahrain': [
    'Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Sanabis'
  ],
  'Oman': [
    'Muscat', 'Seeb', 'Salalah', 'Bawshar', 'Sohar', 'Sur', 'Nizwa', 'Ibri', 'Barka', 'Rustaq'
  ],
  'Cyprus': [
    'Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia', 'Protaras', 'Ayia Napa', 'Paralimni', 'Polis'
  ],
  'Malta': [
    'Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Żabbar', 'St. Paul\'s Bay', 'Sliema', 'Hamrun', 'Marsa', 'Floriana'
  ],
  'Luxembourg': [
    'Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Pétange', 'Sanem', 'Hesperange', 'Bertrange', 'Mamer', 'Strassen'
  ],
  'Bosnia and Herzegovina': [
    'Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina', 'Prijedor', 'Brčko', 'Doboj', 'Cazin'
  ],
  'North Macedonia': [
    'Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles', 'Ohrid', 'Gostivar', 'Strumica', 'Kavadarci'
  ],
  'Albania': [
    'Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Fier', 'Korçë', 'Elbasan', 'Kavajë', 'Gjirokastër', 'Sarandë'
  ],
  'Montenegro': [
    'Podgorica', 'Nikšić', 'Pljevlja', 'Bijelo Polje', 'Cetinje', 'Bar', 'Herceg Novi', 'Berane', 'Budva', 'Ulcinj'
  ],
  'Slovenia': [
    'Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik'
  ],
  'Kosovo': [
    'Pristina', 'Prizren', 'Mitrovica', 'Peja', 'Gjakova', 'Gjilan', 'Ferizaj', 'Podujeva', 'Rahovec', 'Suhareka'
  ],
  'Ecuador': [
    'Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato'
  ],
  'Uruguay': [
    'Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes'
  ],
  'Paraguay': [
    'Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Ñemby', 'Encarnación'
  ],
  'Bolivia': [
    'La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'El Alto', 'Sucre', 'Oruro', 'Tarija', 'Potosí', 'Sacaba', 'Montero'
  ],
  'Panama': [
    'Panama City', 'San Miguelito', 'Tocumen', 'David', 'Arraiján', 'Colón', 'Las Cumbres', 'La Chorrera', 'Pacora', 'Santiago'
  ],
  'Costa Rica': [
    'San José', 'Limón', 'San Francisco', 'Alajuela', 'Liberia', 'Paraíso', 'Desamparados', 'San Isidro', 'Puntarenas', 'Cartago'
  ],
  'Guatemala': [
    'Guatemala City', 'Mixco', 'Villa Nueva', 'Quetzaltenango', 'Escuintla', 'Villa Canales', 'San Juan Sacatepéquez', 'Chinautla', 'Chimaltenango', 'Huehuetenango'
  ],
  'Honduras': [
    'Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Puerto Cortés', 'La Lima', 'Danlí'
  ],
  'El Salvador': [
    'San Salvador', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Soyapango', 'Santa Tecla', 'Apopa', 'Delgado', 'Sonsonate', 'San Marcos'
  ],
  'Nicaragua': [
    'Managua', 'León', 'Masaya', 'Tipitapa', 'Chinandega', 'Matagalpa', 'Estelí', 'Granada', 'Juigalpa', 'Jinotepe'
  ],
  'Dominican Republic': [
    'Santo Domingo', 'Santiago', 'Santo Domingo Este', 'Santo Domingo Oeste', 'San Pedro de Macorís', 'La Romana', 'Los Alcarrizos', 'San Cristóbal', 'Puerto Plata', 'San Francisco de Macorís'
  ],
  'Jamaica': [
    'Kingston', 'Spanish Town', 'Portmore', 'Montego Bay', 'Mandeville', 'May Pen', 'Old Harbour', 'Savanna-la-Mar', 'Port Antonio', 'Ocho Rios'
  ],
  'Trinidad and Tobago': [
    'Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Marabella', 'Point Fortin', 'Tunapuna', 'Scarborough', 'Sangre Grande', 'Princes Town'
  ],
  'Barbados': [
    'Bridgetown', 'Speightstown', 'Oistins', 'Holetown', 'The Crane', 'Bathsheba', 'Rockley', 'Worthing', 'Hastings', 'St. Lawrence'
  ],
  'Guyana': [
    'Georgetown', 'Linden', 'New Amsterdam', 'Corriverton', 'Rose Hall', 'Skeldon', 'Anna Regina', 'Bartica', 'Lethem', 'Mahaica'
  ],
  'Suriname': [
    'Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo', 'Albina', 'Brokopondo', 'Totness', 'Groningen', 'Onverwacht', 'Mariënburg'
  ],
  'Belize': [
    'Belize City', 'San Ignacio', 'Orange Walk', 'Belmopan', 'Dangriga', 'Corozal', 'San Pedro', 'Punta Gorda', 'Benque Viejo del Carmen', 'Ladyville'
  ],
  'Bahamas': [
    'Nassau', 'Freeport', 'West End', 'Coopers Town', 'Marsh Harbour', 'High Rock', 'Andros Town', 'Spanish Wells', 'Clarence Town', 'Duncan Town'
  ],
  'Haiti': [
    'Port-au-Prince', 'Carrefour', 'Delmas', 'Pétion-Ville', 'Port-de-Paix', 'Gonaïves', 'Cap-Haïtien', 'Saint-Marc', 'Les Cayes', 'Jérémie'
  ],
  'Puerto Rico': [
    'San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas', 'Guaynabo', 'Mayagüez', 'Trujillo Alto', 'Arecibo', 'Fajardo'
  ],
  'Zimbabwe': [
    'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Epworth', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi'
  ],
  'Kenya': [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'
  ],
  'Tanzania': [
    'Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Zanzibar City', 'Kigoma', 'Mtwara'
  ],
  'Uganda': [
    'Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Mukono', 'Masaka', 'Entebbe', 'Arua'
  ],
  'Ghana': [
    'Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Ashaiman', 'Sunyani', 'Obuasi', 'Teshie', 'Tema', 'Cape Coast'
  ],
  'Ethiopia': [
    'Addis Ababa', 'Dire Dawa', 'Mekele', 'Gondar', 'Awassa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane'
  ],
  'Libya': [
    'Tripoli', 'Benghazi', 'Misrata', 'Bayda', 'Zawiya', 'Ajdabiya', 'Sabha', 'Sirte', 'Tobruk', 'Sabratha'
  ],
  'Sudan': [
    'Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'El Gedaref', 'Nyala', 'Wad Madani', 'El Fasher', 'Kosti', 'El Obeid'
  ],
  'Zambia': [
    'Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone', 'Luanshya', 'Kasama', 'Chipata'
  ],
  'Botswana': [
    'Gaborone', 'Francistown', 'Molepolole', 'Selebi-Phikwe', 'Maun', 'Serowe', 'Kanye', 'Mochudi', 'Mogoditshane', 'Palapye'
  ],
  'Namibia': [
    'Windhoek', 'Rundu', 'Walvis Bay', 'Oshakati', 'Swakopmund', 'Katima Mulilo', 'Grootfontein', 'Rehoboth', 'Otjiwarongo', 'Okahandja'
  ],
  'Mauritius': [
    'Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes', 'Triolet', 'Goodlands', 'Centre de Flacq', 'Bel Air', 'Mahébourg'
  ],
  'Madagascar': [
    'Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana', 'Antalaha', 'Ambanja', 'Ambovombe'
  ],
  'Senegal': [
    'Dakar', 'Thiès', 'Rufisque', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Touba', 'Mbour', 'Louga', 'Tambacounda'
  ],
  'Ivory Coast': [
    'Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Abengourou'
  ],
  'Cameroon': [
    'Douala', 'Yaoundé', 'Garoua', 'Kousséri', 'Bamenda', 'Maroua', 'Bafoussam', 'Bafang', 'Limbé', 'Ebolowa'
  ],
  'Gabon': [
    'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Mitzic', 'Tchibanga', 'Koulamoutou', 'Lastoursville'
  ],
  'Congo': [
    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Kayes', 'Owando', 'Ouesso', 'Loandjili', 'Madingou', 'Gamboma', 'Impfondo'
  ],
  'DR Congo': [
    'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Bukavu', 'Kananga', 'Kikwit', 'Mbandaka', 'Matadi', 'Goma'
  ],
  'Rwanda': [
    'Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Kibuye', 'Rwamagana'
  ],
  'Afghanistan': [
    'Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz', 'Jalalabad', 'Lashkar Gah', 'Taloqan', 'Pul-e Khumri', 'Charikar'
  ],
  'Nepal': [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur', 'Birgunj', 'Dharan', 'Janakpur', 'Butwal', 'Hetauda'
  ],
  'Myanmar': [
    'Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Sittwe', 'Meiktila', 'Myaungmya'
  ],
  'Cambodia': [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Kampong Cham', 'Kampong Thom', 'Takeo', 'Kandal', 'Pursat', 'Kampot'
  ],
  'Laos': [
    'Vientiane', 'Pakse', 'Savannakhet', 'Luang Prabang', 'Xam Neua', 'Phonsavan', 'Thakhek', 'Muang Xay', 'Saravan', 'Attapeu'
  ],
  'Brunei': [
    'Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong', 'Bangar', 'Sengkurong', 'Jerudong', 'Muara', 'Kampong Ayer', 'Kampong Rimba'
  ],
  'Papua New Guinea': [
    'Port Moresby', 'Lae', 'Arawa', 'Mount Hagen', 'Popondetta', 'Madang', 'Kokopo', 'Mendi', 'Kimbe', 'Goroka'
  ],
  'Fiji': [
    'Suva', 'Lautoka', 'Nadi', 'Labasa', 'Ba', 'Sigatoka', 'Nausori', 'Savusavu', 'Rakiraki', 'Levuka'
  ]
};

/**
 * Get all major cities for all chess-playing countries
 * Returns a flat, sorted list of all cities
 */
export function getAllChessCities(): string[] {
  const allCities = new Set<string>();
  Object.values(MAJOR_CHESS_CITIES_BY_COUNTRY).forEach(cities => {
    cities.forEach(city => allCities.add(city));
  });
  return Array.from(allCities).sort();
}

/**
 * Get cities for a specific country
 */
export function getCitiesByCountry(country: string): string[] {
  // Handle both 'USA' and 'United States'
  if (country === 'United States' || country === 'USA') {
    return MAJOR_CHESS_CITIES_BY_COUNTRY['USA'] || MAJOR_CHESS_CITIES_BY_COUNTRY['United States'] || [];
  }
  return MAJOR_CHESS_CITIES_BY_COUNTRY[country] || [];
}

/**
 * Get all major chess-playing countries
 * This is a comprehensive list that should be shown in filters
 * regardless of whether tournaments exist for those countries
 */
export function getAllChessCountries(): string[] {
  return MAJOR_CHESS_COUNTRIES;
}

