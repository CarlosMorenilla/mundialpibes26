// MundialPibes26 - Testing / Debug utilities
// Abre la consola (F12) y ejecuta estas funciones

function testScoring() {
  console.log('=== TEST DE PUNTUACION ===');

  var testMatches = [
    { id: 1, home: 'MEX', away: 'RSA', home_score: 2, away_score: 0, status: 'finished' },
    { id: 2, home: 'ESP', away: 'CPV', home_score: 3, away_score: 1, status: 'finished' },
    { id: 3, home: 'BRA', away: 'MAR', home_score: 1, away_score: 1, status: 'finished' },
    { id: 4, home: 'ARG', away: 'FRA', home_score: 2, away_score: 1, status: 'finished' },
    { id: 5, home: 'GER', away: 'JPN', home_score: 0, away_score: 0, status: 'finished' }
  ];

  for (var i = 0; i < testMatches.length; i++) {
    var m = testMatches[i];
    matchResults[m.id] = {
      match_id: m.id,
      home_score: m.home_score,
      away_score: m.away_score,
      status: m.status
    };
  }

  var testPredictions = [
    { match_id: 1, home_score: 2, away_score: 0 },
    { match_id: 2, home_score: 2, away_score: 1 },
    { match_id: 3, home_score: 2, away_score: 1 },
    { match_id: 4, home_score: 2, away_score: 1 },
    { match_id: 5, home_score: 1, away_score: 0 }
  ];

  for (var j = 0; j < testPredictions.length; j++) {
    var p = testPredictions[j];
    matchResults[p.match_id] = matchResults[p.match_id] || {};
    matchResults[p.match_id].status = 'finished';

    userPredictions[p.match_id] = {
      user_id: currentUser.id,
      match_id: p.match_id,
      home_score: p.home_score,
      away_score: p.away_score
    };
  }

  var totalPts = 0;
  testPredictions.forEach(function(p) {
    var result = matchResults[p.match_id];
    var pts = calculatePoints(p, result);
    totalPts += pts;
    var match = getMatchById(p.match_id);
    var label = match ? (match.home + ' vs ' + match.away) : ('Match ' + p.match_id);
    console.log('  ' + label + ': ' + p.home_score + '-' + p.away_score + ' -> ' + result.home_score + '-' + result.away_score + ' = ' + pts + ' pts');
  });

  console.log('TOTAL: ' + totalPts + ' puntos');
  console.log('========================');

  renderCurrentSection();
  buildLeaderboard();
}

function clearTestData() {
  matchResults = {};
  userPredictions = {};
  renderCurrentSection();
  buildLeaderboard();
  console.log('Datos de prueba eliminados');
}

function showDebugInfo() {
  console.log('=== DEBUG INFO ===');
  console.log('Usuario:', currentUser ? currentUser.email : 'ninguno');
  console.log('Predicciones locales:', Object.keys(userPredictions).length);
  console.log('Resultados:', Object.keys(matchResults).length);
  console.log('Ranking entradas:', leaderboardData.length);
  leaderboardData.forEach(function(u) {
    console.log('  ' + u.name + ': ' + u.totalPoints + ' pts, ' + u.totalPredictions + ' pred');
  });
  console.log('==================');
}
