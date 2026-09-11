-- Fix mojibake UTF-8 causato da testo UTF-8 interpretato come Windows-1252.
-- Esempi: PuÃ² -> Può, â€“ -> –, Ã˜ -> Ø, RELÃˆ -> RELÈ.

CREATE OR REPLACE FUNCTION has_mojibake(s text) RETURNS boolean AS $$
DECLARE
  hex_value text;
BEGIN
  IF s IS NULL OR s = '' THEN
    RETURN false;
  END IF;

  hex_value := encode(convert_to(s, 'UTF8'), 'hex');

  RETURN hex_value LIKE '%c383c2%'
    OR hex_value LIKE '%c382c2%'
    OR hex_value LIKE '%c3a2e282ac%'
    OR hex_value LIKE '%c383cb%';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fix_encoding(s text) RETURNS text AS $$
DECLARE
  latin1_safe text;
BEGIN
  IF s IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN convert_from(convert_to(s, 'WIN1252'), 'UTF8');
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        latin1_safe := s;
        latin1_safe := replace(latin1_safe, chr(8364), chr(128));
        latin1_safe := replace(latin1_safe, chr(8218), chr(130));
        latin1_safe := replace(latin1_safe, chr(402), chr(131));
        latin1_safe := replace(latin1_safe, chr(8222), chr(132));
        latin1_safe := replace(latin1_safe, chr(8230), chr(133));
        latin1_safe := replace(latin1_safe, chr(8224), chr(134));
        latin1_safe := replace(latin1_safe, chr(8225), chr(135));
        latin1_safe := replace(latin1_safe, chr(710), chr(136));
        latin1_safe := replace(latin1_safe, chr(8240), chr(137));
        latin1_safe := replace(latin1_safe, chr(352), chr(138));
        latin1_safe := replace(latin1_safe, chr(8249), chr(139));
        latin1_safe := replace(latin1_safe, chr(338), chr(140));
        latin1_safe := replace(latin1_safe, chr(381), chr(142));
        latin1_safe := replace(latin1_safe, chr(8216), chr(145));
        latin1_safe := replace(latin1_safe, chr(8217), chr(146));
        latin1_safe := replace(latin1_safe, chr(8220), chr(147));
        latin1_safe := replace(latin1_safe, chr(8221), chr(148));
        latin1_safe := replace(latin1_safe, chr(8226), chr(149));
        latin1_safe := replace(latin1_safe, chr(8211), chr(150));
        latin1_safe := replace(latin1_safe, chr(8212), chr(151));
        latin1_safe := replace(latin1_safe, chr(732), chr(152));
        latin1_safe := replace(latin1_safe, chr(8482), chr(153));
        latin1_safe := replace(latin1_safe, chr(353), chr(154));
        latin1_safe := replace(latin1_safe, chr(8250), chr(155));
        latin1_safe := replace(latin1_safe, chr(339), chr(156));
        latin1_safe := replace(latin1_safe, chr(382), chr(158));
        latin1_safe := replace(latin1_safe, chr(376), chr(159));

        RETURN convert_from(convert_to(latin1_safe, 'LATIN1'), 'UTF8');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN s;
      END;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RETURN s;
END;
$$ LANGUAGE plpgsql;

UPDATE products SET
  name_it              = fix_encoding(name_it),
  name_en              = fix_encoding(name_en),
  name_fr              = fix_encoding(name_fr),
  name_es              = fix_encoding(name_es),
  description_it       = fix_encoding(description_it),
  description_short_it = fix_encoding(description_short_it),
  description_en       = fix_encoding(description_en),
  description_short_en = fix_encoding(description_short_en),
  description_fr       = fix_encoding(description_fr),
  description_short_fr = fix_encoding(description_short_fr),
  description_es       = fix_encoding(description_es),
  description_short_es = fix_encoding(description_short_es),
  meta_title           = fix_encoding(meta_title),
  meta_description     = fix_encoding(meta_description),
  brand                = fix_encoding(brand)
WHERE
  has_mojibake(name_it)
  OR has_mojibake(name_en)
  OR has_mojibake(name_fr)
  OR has_mojibake(name_es)
  OR has_mojibake(description_it)
  OR has_mojibake(description_short_it)
  OR has_mojibake(description_en)
  OR has_mojibake(description_short_en)
  OR has_mojibake(description_fr)
  OR has_mojibake(description_short_fr)
  OR has_mojibake(description_es)
  OR has_mojibake(description_short_es)
  OR has_mojibake(meta_title)
  OR has_mojibake(meta_description)
  OR has_mojibake(brand);

-- Categories: run unconditionally because has_mojibake misses uppercase accents
-- (e.g. É = 0xC3 0x89 → Ã‰, not covered by the c383c2/c383cb patterns).
-- fix_encoding is safe on already-correct text: it fails the WIN1252 roundtrip
-- for valid UTF-8 sequences and returns the original string unchanged.
UPDATE categories SET
  name_it = fix_encoding(name_it),
  name_en = fix_encoding(name_en),
  name_fr = fix_encoding(name_fr),
  name_es = fix_encoding(name_es);

DROP FUNCTION has_mojibake(text);
DROP FUNCTION fix_encoding(text);
