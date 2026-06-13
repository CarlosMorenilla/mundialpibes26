// MundialPibes26 - Ranking / Leaderboard

var leaderboardData = [];
var leaderboardLoading = false;

function loadLeaderboard() {
  buildLeaderboard();
}

function buildLeaderboard() {
  if (leaderboardLoading) return;
  leaderboardLoading = true;
  leaderboardData = [];

  if (!supabase || !currentUser) {
    leaderboardLoading = false;
    renderLeaderboard('leaderboardContainer');
    return;
  }

  Promise.all([
    supabase.from('predictions').select('user_id, user_name, match_id, home_score, away_score'),
    supabase.from('top_scorer_predictions').select('user_id, player_name')
  ]).then(function(results) {
    var predictions = results[0].data || [];
    var topScorerPreds = results[1].data || [];
    aggregateFromDB(predictions, topScorerPreds);
    leaderboardLoading = false;
    renderLeaderboard('leaderboardContainer');
  }).catch(function() {
    leaderboardLoading = false;
    renderLeaderboard('leaderboardContainer');
  });
}

function getRealTopScorer() {
  var sorted = allPlayers.slice().sort(function(a, b) {
    return b.goals - a.goals;
  });
  if (sorted.length > 0 && sorted[0].goals > 0) {
    return sorted[0];
  }
  return null;
}

function aggregateFromDB(predictions, topScorerPreds) {
  var byName = {};
  var idToKey = {};
  var realTopScorer = getRealTopScorer();

  for (var i = 0; i < predictions.length; i++) {
    var pred = predictions[i];
    var name = (pred.user_name || 'Jugador').trim();
    if (!name) continue;

    var key = name.toLowerCase();
    if (!byName[key]) {
      byName[key] = {
        name: name,
        totalPoints: 0,
        correctWinners: 0,
        exactScores: 0,
        totalPredictions: 0,
        topScorerPoints: 0,
        topScorerName: '',
        isMe: false
      };
    }

    byName[key].totalPredictions++;

    if (pred.user_id) idToKey[pred.user_id] = key;

    var result = getResult(pred.match_id);
    if (result && result.status === 'finished') {
      var pts = calculatePoints(pred, result);
      byName[key].totalPoints += pts;
      if (pts > 0) byName[key].correctWinners++;
      if (pts === APP_CONFIG.points.exactScore) byName[key].exactScores++;
    }

    if (pred.user_id === currentUser.id) {
      byName[key].isMe = true;
    }
  }

  // Process top scorer predictions
  for (var j = 0; j < topScorerPreds.length; j++) {
    var tsp = topScorerPreds[j];
    var foundKey = idToKey[tsp.user_id];
    if (!foundKey || !byName[foundKey]) continue;

    byName[foundKey].topScorerName = tsp.player_name;

    var finalMatch = getMatchByStage('final');
    if (finalMatch) {
      var finalResult = getResult(finalMatch.id);
      if (finalResult && finalResult.status === 'finished' && realTopScorer) {
        if (tsp.player_name.toLowerCase() === realTopScorer.name.toLowerCase()) {
          byName[foundKey].topScorerPoints = APP_CONFIG.points.topScorer;
          byName[foundKey].totalPoints += APP_CONFIG.points.topScorer;
        }
      }
    }
  }

  var keys = Object.keys(byName);
  for (var k = 0; k < keys.length; k++) {
    leaderboardData.push(byName[keys[k]]);
  }

  leaderboardData.sort(function(a, b) {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
    return b.totalPredictions - a.totalPredictions;
  });
}

function getMatchByStage(stage) {
  if (!matchesData) return null;
  for (var i = 0; i < matchesData.matches.length; i++) {
    if (matchesData.matches[i].stage === stage) return matchesData.matches[i];
  }
  return null;
}

function renderLeaderboard(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (leaderboardData.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">Aun no hay predicciones en el ranking</div></div>';
    return;
  }

  var html = '';

  html += '<div class="ranking-legend">';
  html += '<div class="ranking-legend-title">Como se puntua:</div>';
  html += '<div class="ranking-legend-items">';
  html += '<span class="ranking-legend-item"><span class="ranking-legend-dot" style="background:var(--success);"></span>Ganador = 1 punto</span>';
  html += '<span class="ranking-legend-item"><span class="ranking-legend-dot" style="background:var(--gold);"></span>Resultado exacto = 3 puntos</span>';
  html += '<span class="ranking-legend-item"><span class="ranking-legend-dot" style="background:var(--orange);"></span>Max. goleador = 5 puntos *</span>';
  html += '</div></div>';

  html += '<div class="leaderboard-table">';

  html += '<div class="leaderboard-row header">';
  html += '<div class="leaderboard-pos">#</div>';
  html += '<div class="leaderboard-user">Jugador</div>';
  html += '<div class="leaderboard-stats">';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">Pts</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">Gan.</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">Exc.</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">Pred.</div></div>';
  html += '</div></div>';

  for (var i = 0; i < leaderboardData.length; i++) {
    var user = leaderboardData[i];
    var pos = i + 1;
    var posClass = pos <= 3 ? 'top-' + pos : '';
    var isMe = user.isMe;

    var rowClass = 'leaderboard-row';
    if (isMe) rowClass += ' current-user';
    if (pos <= 3) rowClass += ' top-three';

    var topScorerBadge = '';
    if (user.topScorerPoints > 0) {
      topScorerBadge = ' <span class="topscorer-badge" title="Acerto el maximo goleador: ' + user.topScorerName + '">⚽+5</span>';
    } else if (user.topScorerName) {
      topScorerBadge = ' <span class="topscorer-badge pending" title="Goleador: ' + user.topScorerName + '">⚽?</span>';
    }

    html += '<div class="' + rowClass + '">';
    html += '<div class="leaderboard-pos ' + posClass + '">' + pos + '</div>';
    html += '<div class="leaderboard-user">';
    html += '<div class="leaderboard-avatar" style="background:' + (isMe ? 'var(--orange)' : 'var(--gradient-gold)') + ';display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;">' + user.name.charAt(0).toUpperCase() + '</div>';
    html += '<span class="leaderboard-name">' + user.name + (isMe ? ' (tu)' : '') + topScorerBadge + '</span>';
    html += '</div>';
    html += '<div class="leaderboard-stats">';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.totalPoints + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.correctWinners + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.exactScores + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.totalPredictions + '</div></div>';
    html += '</div></div>';
  }

  html += '</div>';
  html += '<div class="ranking-note">* Los puntos del maximo goleador (+5) se suman automaticamente cuando finaliza la final.</div>';
  container.innerHTML = html;
}
