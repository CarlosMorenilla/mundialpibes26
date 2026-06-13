# Plan: Bracket + Goleadores

## Feature 1: Cuadro de Eliminatorias (Bracket visual)

### Estructura del bracket:
- R32 (16 partidos): equipos por posiciones de grupo (1A vs 2B, etc.)
- R16 (8 partidos): winners de R32
- QF (4 partidos): winners de R16
- SF (2 partidos): winners de QF
- Final (1 partido): winners de SF
- Third place (1 partido): losers de SF

### Implementacion:
1. **`js/bracket.js`**:
   - `renderBracket()` — genera HTML del bracket
   - `resolveTeam(match)` — resuelve equipo de un partido (real o placeholder)
   - CSS Grid horizontal con 6 columnas (R32 → Final)
   - Cada nodo: bandera + nombre + goles

2. **Resolucion automatica**:
   - Lee `matchResults` para partidos terminados
   - Para placeholders (1A, W89, etc.), busca el equipo ganador del partido correspondiente
   - Se actualiza cuando `processAPIEvents()` detecta un partido terminado

3. **CSS**:
   - Bracket horizontal con scroll en movil
   - Conectores entre rondas
   - Colores por ronda (mismos que match-stage badges)
   - Animacion de "relleno" cuando entra un equipo

---

## Feature 2: Goleadores (Maximo goleador = 5 puntos)

### Implementacion:
1. **`js/topscorer.js`**:
   - `renderTopScorer()` — grid de jugadores + buscador
   - `searchPlayers(query)` — filtra por nombre
   - `saveTopScorer(playerName)` — guarda en Supabase
   - `loadTopScorer()` — carga prediccion del usuario

2. **Supabase** — Nueva tabla:
   ```sql
   CREATE TABLE top_scorer_predictions (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     player_name TEXT NOT NULL,
     team_code TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(user_id)
   );
   ```

3. **Datos de jugadores**:
   - Cargar jugadores de los 48 equipos via `lookup_all_players.php?id=TEAM_ID`
   - Cache en localStorage para no repetir llamadas
   - ~25 jugadores por equipo = ~1200 jugadores total

4. **UI**:
   - Buscador con autocompletado
   - Grid de jugadores populares (estrellas)
   - Tu prediccion fijada arriba
   - Indicador de goles si el jugador anota

5. **Puntuacion**: 5 puntos si tu jugador es el maximo goleador al final

---

## Archivos a crear:
- `js/bracket.js`
- `js/topscorer.js`

## Archivos a modificar:
- `app.html` — tabs + secciones + scripts + tabla Supabase
- `css/style.css` — estilos bracket + top scorer
- `js/app.js` — switchSection + renderCurrentSection
- `supabase-schema.sql` — tabla top_scorer_predictions

## Orden: Bracket primero (mas visual), luego Goleadores.
