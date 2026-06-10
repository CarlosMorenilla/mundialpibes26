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

-- Index para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Politica: cualquier usuario autenticado puede leer todas las predicciones
CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT
  USING (true);

-- Politica: cada usuario solo puede insertar sus propias predicciones
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'demo_%');

-- Politica: cada usuario solo puede actualizar sus propias predicciones
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id LIKE 'demo_%');

-- Politica: cada usuario solo puede eliminar sus propias predicciones
CREATE POLICY "Users can delete own predictions"
  ON predictions FOR DELETE
  USING (auth.uid()::text = user_id OR user_id LIKE 'demo_%');

-- Function para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
