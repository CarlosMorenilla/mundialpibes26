-- Quitar politicas viejas
DROP POLICY IF EXISTS "Anyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can delete own predictions" ON predictions;

-- Politica: todos pueden LEER todas las predicciones (para el ranking)
CREATE POLICY "Anyone can read predictions"
  ON predictions FOR SELECT
  USING (true);

-- Politica: cada usuario solo puede INSERTAR sus propias predicciones
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Politica: cada usuario solo puede ACTUALIZAR sus propias predicciones
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Politica: cada usuario solo puede ELIMINAR sus propias predicciones
CREATE POLICY "Users can delete own predictions"
  ON predictions FOR DELETE
  USING (auth.uid()::text = user_id);
