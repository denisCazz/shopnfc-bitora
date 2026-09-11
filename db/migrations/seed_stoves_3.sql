INSERT INTO stoves (name_it, slug, active, sort_order, categoria, potenza, dimensioni, peso) VALUES
('Diego 11',               'diego-11',               true, 960,  'Stufa a Legna',       '11,0 kW',            'L 63,0 x P 39,2 x H 50,0 cm', '88 kg'),
('Giorgio 11',             'giorgio-11',             true, 970,  'Stufa a Legna',       '11,0 kW',            'L 73,0 x P 43,9 x H 50,0 cm', '91 kg'),
('Termocucina Eva Calòr',  'termocucina-eva-calor',  true, 980,  'Termocucina a Legna', NULL,                 'L 90,0 x P 60,0 x H 85,0 cm', '145 kg'),
('Enrica Plus',            'enrica-plus',            true, 990,  'Stufa a Pellet',      '8,0 kW',             NULL,                           NULL),
('Silence Plus 11-9',      'silence-plus-11-9',      true, 1000, 'Stufa a Pellet',      '11,4 - 9,6 kW',     NULL,                           NULL),
('Trinity Plus',           'trinity-plus',           true, 1010, 'Stufa a Pellet',      '10,0 kW',            NULL,                           NULL),
('Heidi',                  'heidi',                  true, 1020, 'Stufa a Pellet',      '6,3 kW',             NULL,                           NULL),
('Evelyn',                 'evelyn',                 true, 1030, 'Stufa a Pellet',      '11,0 kW',            NULL,                           NULL),
('Tommy',                  'tommy',                  true, 1040, 'Stufa a Pellet',      '9,5 kW',             NULL,                           NULL),
('Andrea',                 'andrea',                 true, 1050, 'Stufa a Pellet',      '9,5 kW',             NULL,                           NULL),
('Leonardo',               'leonardo',               true, 1060, 'Stufa a Pellet',      '9,5 kW',             NULL,                           NULL),
('Hydro Kantina 24-20',    'hydro-kantina-24-20',    true, 1070, 'Caldaia a Pellet',    '26 - 20 kW',         NULL,                           NULL)
ON CONFLICT (slug) DO NOTHING;
