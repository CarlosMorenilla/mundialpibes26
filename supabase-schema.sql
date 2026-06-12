-- MundialPibes26 - Schema para Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Tabla de predicciones
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Jugador',
  match_id INTEGER NOT NULL,
  home_score INTEGER NOT NULL CHECK (home_score >= 0 AND home_score <= 20),
  away_score INTEGER NOT NULL CHECK (away_score >= 0 AND away_score <= 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);

-- Habilitar RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Politicas
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can delete own predictions" ON predictions;

CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own predictions"
  ON predictions FOR DELETE
  USING (auth.uid()::text = user_id);

-- updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS predictions_updated_at ON predictions;
CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tabla de maximo goleador
CREATE TABLE IF NOT EXISTS top_scorer_predictions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_id TEXT,
  team_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_topscorer_user_id ON top_scorer_predictions(user_id);

ALTER TABLE top_scorer_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read top scorer" ON top_scorer_predictions;
DROP POLICY IF EXISTS "Users can insert own top scorer" ON top_scorer_predictions;
DROP POLICY IF EXISTS "Users can update own top scorer" ON top_scorer_predictions;
DROP POLICY IF EXISTS "Users can delete own top scorer" ON top_scorer_predictions;

CREATE POLICY "Anyone can read top scorer"
  ON top_scorer_predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own top scorer"
  ON top_scorer_predictions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own top scorer"
  ON top_scorer_predictions FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own top scorer"
  ON top_scorer_predictions FOR DELETE
  USING (auth.uid()::text = user_id);
