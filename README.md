# Mundial26

Predicciones del Mundial 2026. App web mobile-first para predecir resultados del Mundial y competir con amigos.
Link a la pagina web: https://mundial2026pibes.netlify.app/index.html

## Funcionalidades

- **Google Sign-In** con Supabase
- **Predicciones**: 1 punto por acertar ganador, 3 por acertar resultado exacto
- **Ranking compartido** entre todos los usuarios
- **Vista de predicciones** de todos los usuarios por partido
- **Actualizacion automatica** de resultados via TheSportsDB API
- **Calendario** con vista por grupos y fase de knockout
- **Responsive** mobile-first con colores del Mundial 2026

## Tecnologias

- HTML/CSS/JS vanilla (sin frameworks)
- Supabase (auth + base de datos)
- TheSportsDB API (resultados en vivo)
- Netlify (hosting)
- flagcdn.com (banderas)

## Despliegue

```
git push origin master
```

Netlify despliega automaticamente desde el repositorio.

## Estructura

```
mundialpibes26/
  index.html          # Login con Google
  app.html            # Dashboard principal
  css/style.css       # Estilos
  js/
    config.js         # Configuracion Supabase
    auth.js           # Autenticacion Google
    flags.js          # Banderas de paises
    matches.js        # Renderizado de partidos
    predictions.js    # Guardar/cargar predicciones
    scores.js         # Actualizacion automatica
    leaderboard.js    # Ranking global
    predictions-view.js  # Ver predicciones de otros
    app.js            # Controlador principal
  data/matches.json   # Fixture completo (104 partidos)
  supabase-schema.sql # Esquema de base de datos
```

## Licencia

Uso personal. MundialPibes26 2026.
