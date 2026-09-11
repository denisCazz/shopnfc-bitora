-- Seed stoves batch 6: 34 new models + 1 potenza update
-- Excluding duplicates: Heidi, Andrea, Tommy (already in seed_stoves_3.sql)

INSERT INTO stoves (name_it, name_en, name_fr, name_es, slug, active, sort_order, categoria, potenza, dimensioni, peso) VALUES
  ('Adele 9 kW', 'Adele 9 kW', NULL, NULL, 'adele-9-kw', true, 0, 'Stufa a Pellet Maiolica', 'max 9 kW', 'N/D', 'N/D'),
  ('Diana 13 kW', 'Diana 13 kW', NULL, NULL, 'diana-13-kw', true, 0, 'Stufa a Pellet Maiolica', '13 kW', 'N/D', 'N/D'),
  ('Rosy 13 kW', 'Rosy 13 kW', NULL, NULL, 'rosy-13-kw', true, 0, 'Stufa a Pellet Maiolica', '13 kW', 'N/D', 'N/D'),
  ('Lucia 13 kW', 'Lucia 13 kW', NULL, NULL, 'lucia-13-kw', true, 0, 'Stufa a Pellet Maiolica', '13 kW', 'N/D', 'N/D'),
  ('Enrica 9 kW', 'Enrica 9 kW', NULL, NULL, 'enrica-9-kw', true, 0, 'Cucine e Forni a Pellet', '9 kW', 'N/D', 'N/D'),
  ('Biscotto 8,5 kW', 'Biscotto 8.5 kW', NULL, NULL, 'biscotto-85-kw', true, 0, 'Cucine e Forni a Pellet', '8,5 kW', 'N/D', 'N/D'),
  ('Michelangelo 12 kW', 'Michelangelo 12 kW', NULL, NULL, 'michelangelo-12-kw', true, 0, 'Stufa a Pellet', 'max 12 kW – min 3,7 kW', 'N/D', 'N/D'),
  ('Raffaello 12 kW', 'Raffaello 12 kW', NULL, NULL, 'raffaello-12-kw', true, 0, 'Stufa a Pellet', 'max 12 kW – min 3,7 kW', 'N/D', 'N/D'),
  ('Giotto 12 kW', 'Giotto 12 kW', NULL, NULL, 'giotto-12-kw', true, 0, 'Stufa a Pellet', '12 kW', 'N/D', 'N/D'),
  ('Cloe 15 kW', 'Cloe 15 kW', NULL, NULL, 'cloe-15-kw', true, 0, 'Stufa a Pellet', '15 kW', 'N/D', 'N/D'),
  ('Sonia 9 kW', 'Sonia 9 kW', NULL, NULL, 'sonia-9-kw', true, 0, 'Stufa a Pellet', '9 kW', 'N/D', 'N/D'),
  ('Ines 15 kW', 'Ines 15 kW', NULL, NULL, 'ines-15-kw', true, 0, 'Stufa a Pellet', '15 kW', 'N/D', 'N/D'),
  ('Milly 13 kW', 'Milly 13 kW', NULL, NULL, 'milly-13-kw', true, 0, 'Stufa a Pellet', '13 kW', 'N/D', 'N/D'),
  ('Betty 9 kW', 'Betty 9 kW', NULL, NULL, 'betty-9-kw', true, 0, 'Stufa a Pellet', '9 kW', 'N/D', 'N/D'),
  ('Rita 9 kW', 'Rita 9 kW', NULL, NULL, 'rita-9-kw', true, 0, 'Stufa a Pellet', '9 kW', 'N/D', 'N/D'),
  ('Heidi 6 kW', 'Heidi 6 kW', NULL, NULL, 'heidi-6-kw', true, 0, 'Stufa a Pellet', '6 kW', 'N/D', 'N/D'),
  ('Flora 4,5 kW', 'Flora 4.5 kW', NULL, NULL, 'flora-45-kw', true, 0, 'Stufe a Pellet Slim', 'max 5,6 kW – min 2,3 kW', 'L 74,1 x P 30 x H 93,1 cm', '65 kg'),
  ('Gaia 4,5 kW', 'Gaia 4.5 kW', NULL, NULL, 'gaia-45-kw', true, 0, 'Stufe a Pellet Slim', 'max 5,6 kW – min 2,3 kW', 'N/D', 'N/D'),
  ('Matilde 4,5 kW', 'Matilde 4.5 kW', NULL, NULL, 'matilde-45-kw', true, 0, 'Stufe a Pellet Slim', '4,5 kW', 'N/D', 'N/D'),
  ('Elena 7,5 kW', 'Elena 7.5 kW', NULL, NULL, 'elena-75-kw', true, 0, 'Stufe a Pellet Slim', '7,5 kW', 'N/D', 'N/D'),
  ('Asia 7,5 kW', 'Asia 7.5 kW', NULL, NULL, 'asia-75-kw', true, 0, 'Stufe a Pellet Slim', '7,5 kW', 'N/D', 'N/D'),
  ('Cerino 7,5 kW', 'Cerino 7.5 kW', NULL, NULL, 'cerino-75-kw', true, 0, 'Inserti a Pellet', 'max 7,5 kW – min 3,7 kW', 'N/D', 'N/D'),
  ('Andrea 11 kW', 'Andrea 11 kW', NULL, NULL, 'andrea-11-kw', true, 0, 'Inserti a Pellet', '11 kW', 'N/D', 'N/D'),
  ('Tommy 11 kW', 'Tommy 11 kW', NULL, NULL, 'tommy-11-kw', true, 0, 'Inserti a Pellet', '11 kW', 'N/D', 'N/D'),
  ('Marcus 18 kW', 'Marcus 18 kW', NULL, NULL, 'marcus-18-kw', true, 0, 'Stufe Hydro a Pellet', '18 kW', 'N/D', 'N/D'),
  ('Tosca 15-27 kW', 'Tosca 15-27 kW', NULL, NULL, 'tosca-15-27-kw', true, 0, 'Stufe Hydro a Pellet', '15-27 kW', 'N/D', 'N/D'),
  ('Hydro 15-27 kW', 'Hydro 15-27 kW', NULL, NULL, 'hydro-15-27-kw', true, 0, 'Stufe Hydro a Pellet', '15-27 kW', 'N/D', 'N/D'),
  ('Ev 20 kW', 'Ev 20 kW', NULL, NULL, 'ev-20-kw', true, 0, 'Stufe Hydro a Pellet', 'max 20,1 kW – min 5,7 kW', 'L 63,2 x P 66,8 x H 131,9 cm', 'N/D'),
  ('Ev 24 kW', 'Ev 24 kW', NULL, NULL, 'ev-24-kw', true, 0, 'Stufe Hydro a Pellet', 'max 24,4 kW – min 5,7 kW', 'L 63,2 x P 66,8 x H 131,9 cm', 'N/D'),
  ('Hydro Kantina New 20-24 kW', 'Hydro Kantina New 20-24 kW', NULL, NULL, 'hydro-kantina-new-20-24-kw', true, 0, 'Stufe Hydro a Pellet', '20-24 kW', 'N/D', 'N/D'),
  ('Hydro Kantina 15-34 kW', 'Hydro Kantina 15-34 kW', NULL, NULL, 'hydro-kantina-15-34-kw', true, 0, 'Stufe Hydro a Pellet', '15-34 kW', 'N/D', 'N/D'),
  ('Hydro Slim 16 kW', 'Hydro Slim 16 kW', NULL, NULL, 'hydro-slim-16-kw', true, 0, 'Stufe Hydro a Pellet', '16 kW', 'N/D', 'N/D'),
  ('Hydro Slim Kantina 16 kW', 'Hydro Slim Kantina 16 kW', NULL, NULL, 'hydro-slim-kantina-16-kw', true, 0, 'Stufe Hydro a Pellet', '16 kW', 'N/D', 'N/D'),
  ('Vittoria 29 kW', 'Vittoria 29 kW', NULL, NULL, 'vittoria-29-kw', true, 0, 'Termocucine a Legna', '29 kW', 'N/D', 'N/D'),
  ('Angelica 26 kW', 'Angelica 26 kW', NULL, NULL, 'angelica-26-kw', true, 0, 'Termocucine a Legna', '26 kW', 'N/D', 'N/D'),
  ('Alberta Ermetica', 'Alberta Ermetica', NULL, NULL, 'alberta-ermetica', true, 0, 'Stufa a Legna', 'N/D', 'N/D', 'N/D'),
  ('Rosa', 'Rosa', NULL, NULL, 'rosa', true, 0, 'Stufa a Pellet', 'max 9,9 kW – min 4,5 kW', 'N/D', 'N/D')
ON CONFLICT (slug) DO NOTHING;

-- Update potenza for Evelyn (already seeded in batch 3 without potenza details)
UPDATE stoves SET potenza = 'max 10,0 kW – min 3,2 kW' WHERE slug = 'evelyn' AND (potenza IS NULL OR potenza = 'N/D');
