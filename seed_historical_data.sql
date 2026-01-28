-- ============================================
-- SEED HISTORICAL DATA - WordPress Migration
-- ============================================
-- Run this AFTER running complete_migration.sql
-- This populates champions and awards with historical data

-- First, let's get the team IDs we'll need
-- We'll use a temporary table to store team references

DO $$
DECLARE
  team_hornets UUID;
  team_tune_squad UUID;
  team_veneno UUID;
  team_okc_third UUID;
  team_nola_kings UUID;
  team_jung UUID;
  team_heat UUID;
BEGIN
  -- Get team IDs
  SELECT id INTO team_hornets FROM teams WHERE name = 'New Orleans Hornets';
  SELECT id INTO team_tune_squad FROM teams WHERE name = 'Tune Squad';
  SELECT id INTO team_veneno FROM teams WHERE name = 'Veneno da Jararaca';
  SELECT id INTO team_okc_third FROM teams WHERE name = 'Oklahoma City Third';
  SELECT id INTO team_nola_kings FROM teams WHERE name = 'New Orleans Kings';
  SELECT id INTO team_jung FROM teams WHERE name = 'Jung Vai Te Aniquilar';
  SELECT id INTO team_heat FROM teams WHERE name = 'Miami Heat';

  -- Update existing champions with team references (if they exist)
  -- If champions don't exist, we'll insert them
  
  -- 2017/18 - New Orleans Hornets (Heriberto)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2017/18') THEN
    UPDATE champions SET team_id = team_hornets WHERE year = '2017/18';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2017/18', 'New Orleans Hornets', 'Heriberto', 'Primeiro Campeão', team_hornets);
  END IF;

  -- 2019 - Tune Squad (Gabriel Fernandes)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2019') THEN
    UPDATE champions SET team_id = team_tune_squad WHERE year = '2019';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2019', 'Tune Squad', 'Gabriel Fernandes', 'Estratégia e Destreza', team_tune_squad);
  END IF;

  -- 2021 - Veneno da Jararaca (Pedro Família)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2021') THEN
    UPDATE champions SET team_id = team_veneno WHERE year = '2021';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2021', 'Veneno da Jararaca', 'Pedro Família', 'Astúcia e Coragem', team_veneno);
  END IF;

  -- 2022 - Oklahoma City Third (Samuel)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2022') THEN
    UPDATE champions SET team_id = team_okc_third WHERE year = '2022';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2022', 'Oklahoma City Third', 'Samuel', 'Abordagem Inovadora', team_okc_third);
  END IF;

  -- 2023 - New Orleans Kings (Abner Melo)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2023') THEN
    UPDATE champions SET team_id = team_nola_kings WHERE year = '2023';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2023', 'New Orleans Kings', 'Abner Melo', 'Preparação Crucial', team_nola_kings);
  END IF;

  -- 2024 - Jung Vai Te Aniquilar (Matheus Psico)
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2024') THEN
    UPDATE champions SET team_id = team_jung WHERE year = '2024';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2024', 'Jung Vai Te Aniquilar', 'Matheus Psico', 'Estratégia Imbatível', team_jung);
  END IF;

  -- 2025 - Miami Heat (Samuel) - Primeiro Triênio
  IF EXISTS (SELECT 1 FROM champions WHERE year = '2025') THEN
    UPDATE champions SET team_id = team_heat WHERE year = '2025';
  ELSE
    INSERT INTO champions (year, team, mvp, score, team_id)
    VALUES ('2025', 'Miami Heat', 'Samuel', 'Primeiro Triênio', team_heat);
  END IF;

  -- Insert some sample awards (you can add more later via the UI)
  -- Awards for 2024/25 season
  INSERT INTO awards (year, category, winner_name, team_id) VALUES
    ('2024/25', 'MVP', 'Samuel', team_heat),
    ('2024/25', 'GM do Ano', 'Samuel', team_heat)
  ON CONFLICT DO NOTHING;

  -- Awards for 2023/24 season (add more as needed)
  INSERT INTO awards (year, category, winner_name, team_id) VALUES
    ('2023/24', 'MVP', 'Abner Melo', team_nola_kings),
    ('2023/24', 'GM do Ano', 'Abner Melo', team_nola_kings)
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- HISTORICAL DATA SEEDED!
-- Champions from 2017-2025 are now linked to teams
-- Sample awards have been added
-- You can add more awards and trades via the admin UI
-- ============================================
