// MundialPibes26 - Testing / Debug utilities
// Abre la consola del navegador (F12) y usa estas funciones para probar

function testScoring() {
  console.log('=== TEST DE PUNTUACION ===');

  // Simular resultados de partidos
  var testMatches = [
    { id: 1, home: 'MEX', away: 'RSA', home_score: 2, away_score: 0, status: 'finished' },
    { id: 2, home: 'ESP', away: 'CPV', home_score: 3, away_score: 1, status: 'finished' },
    { id: 3, home: 'BRA', away: 'MAR', home_score: 1, away_score: 1, status: 'finished' },
    { id: 4, home: 'ARG', away: 'FRA', home_score: 2, away_score: 1, status: 'finished' },
    { id: 5, home: 'GER', away: 'JPN', home_score: 0, away_score: 0, status: 'finished' }
  ];

  // Guardar como "resultados" en localStorage
  for (var i = 0; i < testMatches.length; i++) {
    var m = testMatches[i];
    matchResults[m.id] = {
      match_id: m.id,
      home_score: m.home_score,
      away_score: m.away_score,
      status: m.status
    };
  }

  console.log('Resultados de prueba injectados:');
  testMatches.forEach(function(m) {
    console.log('  ' + m.home + ' ' + m.home_score + ' - ' + m.away_score + ' ' + m.away);
  });

  // Crear predicciones de prueba para el usuario actual
  var testPredictions = [
    { match_id: 1, home_score: 2, away_score: 0 },  // Exacto = 3 pts
    { match_id: 2, home_score: 2, away_score: 1 },  // Ganador = 1 pt
    { match_id: 3, home_score: 2, away_score: 1 },  // Fallo = 0 pts
    { match_id: 4, home_score: 2, away_score: 1 },  // Exacto = 3 pts
    { match_id: 5, home_score: 1, away_score: 0 }   // Fallo = 0 pts
  ];

  for (var j = 0; j < testPredictions.length; j++) {
    var p = testPredictions[j];
    userPredictions[p.match_id] = {
      user_id: currentUser ? currentUser.id : 'test',
      match_id: p.match_id,
      home_score: p.home_score,
      away_score: p.away_score
    };
  }

  console.log('Predicciones de prueba creadas:');

  // Calcular puntos
  var totalPts = 0;
  testPredictions.forEach(function(p) {
    var result = matchResults[p.match_id];
    var pts = calculatePoints(p, result);
    totalPts += pts;
    var match = getMatchById(p.match_id);
    var label = match ? (match.home + ' vs ' + match.away) : ('Match ' + p.match_id);
    console.log('  ' + label + ': ' + p.home_score + '-' + p.away_score + ' -> ' + result.home_score + '-' + result.away_score + ' = ' + pts + ' pts');
  });

  console.log('TOTAL PUNTOS: ' + totalPts);
  console.log('========================');

  // Refrescar vistas
  renderCurrentSection();
  buildLeaderboard();
  renderLeaderboard('leaderboardContainer');

  return totalPts;
}

function clearTestData() {
  matchResults = {};
  userPredictions = {};
  if (currentUser) {
    localStorage.removeItem('predictions_' + currentUser.id);
  }
  renderCurrentSection();
  buildLeaderboard();
  renderLeaderboard('leaderboardContainer');
  console.log('Datos de prueba eliminados');
}

function showDebugInfo() {
  console.log('=== DEBUG INFO ===');
  console.log('Usuario:', currentUser ? currentUser.email : 'ninguno');
  console.log('Predicciones guardadas:', Object.keys(userPredictions).length);
  console.log('Resultados cargados:', Object.keys(matchResults).length);
  console.log('Partidos totales:', matchesData ? matchesData.matches.length : 0);

  Object.keys(userPredictions).forEach(function(id) {
    var pred = userPredictions[id];
    var result = matchResults[id];
    var pts = result ? calculatePoints(pred, result) : 'sin resultado';
    console.log('  Match ' + id + ': pred=' + pred.home_score + '-' + pred.away_score + (result ? ' res=' + result.home_score + '-' + result.away_score : '') + ' pts=' + pts);
  });

  console.log('==================');
}
