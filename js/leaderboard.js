// MundialPibes26 - Ranking / Leaderboard (Supabase compartido)

var leaderboardData = [];

function loadLeaderboard() {
  buildLeaderboard();
  return Promise.resolve();
}

function buildLeaderboard() {
  leaderboardData = [];

  if (supabase && !isDemoUser()) {
    return supabase.from('predictions').select('user_id, user_name, match_id, home_score, away_score')
      .then(function(result) {
        if (result.data) aggregateLeaderboard(result.data);
        addCurrentUser();
        sortLeaderboard();
        renderLeaderboard('leaderboardContainer');
      }).catch(function() {
        addCurrentUser();
        sortLeaderboard();
        renderLeaderboard('leaderboardContainer');
      });
  }

  addCurrentUser();
  sortLeaderboard();
}

function aggregateLeaderboard(predictions) {
  var users = {};

  for (var i = 0; i < predictions.length; i++) {
    var pred = predictions[i];
    if (!users[pred.user_id]) {
      users[pred.user_id] = {
        user_id: pred.user_id,
        name: pred.user_name || 'Jugador',
        totalPoints: 0,
        correctWinners: 0,
        exactScores: 0,
        totalPredictions: 0
      };
    }

    var result = getResult(pred.match_id);
    if (result && result.status === 'finished') {
      var pts = calculatePoints(pred, result);
      users[pred.user_id].totalPoints += pts;
      users[pred.user_id].totalPredictions++;
      if (pts > 0) users[pred.user_id].correctWinners++;
      if (pts === APP_CONFIG.points.exactScore) users[pred.user_id].exactScores++;
    }
  }

  var keys = Object.keys(users);
  for (var j = 0; j < keys.length; j++) {
    leaderboardData.push(users[keys[j]]);
  }
}

function addCurrentUser() {
  if (!currentUser) return;

  var myPoints = 0;
  var myWinners = 0;
  var myExacts = 0;
  var myPreds = Object.keys(userPredictions);

  for (var j = 0; j < myPreds.length; j++) {
    var pred = userPredictions[myPreds[j]];
    var result = getResult(pred.match_id);
    if (result && result.status === 'finished') {
      var pts = calculatePoints(pred, result);
      myPoints += pts;
      if (pts > 0) myWinners++;
      if (pts === APP_CONFIG.points.exactScore) myExacts++;
    }
  }

  var userName = currentUser.user_metadata && currentUser.user_metadata.full_name
    ? currentUser.user_metadata.full_name
    : 'Tu';

  leaderboardData.push({
    user_id: currentUser.id,
    name: userName,
    totalPoints: myPoints,
    correctWinners: myWinners,
    exactScores: myExacts,
    totalPredictions: myPreds.length,
    isMe: true
  });
}

function sortLeaderboard() {
  leaderboardData.sort(function(a, b) { return b.totalPoints - a.totalPoints; });
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
  html += '</div></div>';

  html += '<div class="leaderboard-table">';

  html += '<div class="leaderboard-row header">';
  html += '<div class="leaderboard-pos">#</div>';
  html += '<div class="leaderboard-user">Jugador</div>';
  html += '<div class="leaderboard-stats">';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value" title="Puntos totales">Pts</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value" title="Veces que acertaste el ganador">Ganador</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value" title="Veces que acertaste el resultado exacto">Exacto</div></div>';
  html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value" title="Total de predicciones hechas">Pred.</div></div>';
  html += '</div></div>';

  for (var i = 0; i < leaderboardData.length; i++) {
    var user = leaderboardData[i];
    var pos = i + 1;
    var posClass = pos <= 3 ? 'top-' + pos : '';
    var isMe = user.isMe === true;

    var rowClass = 'leaderboard-row';
    if (isMe) rowClass += ' current-user';
    if (pos <= 3) rowClass += ' top-three';

    html += '<div class="' + rowClass + '">';
    html += '<div class="leaderboard-pos ' + posClass + '">' + pos + '</div>';
    html += '<div class="leaderboard-user">';
    html += '<div class="leaderboard-avatar" style="background:' + (isMe ? 'var(--orange)' : 'var(--gradient-gold)') + ';display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;">' + user.name.charAt(0).toUpperCase() + '</div>';
    html += '<span class="leaderboard-name">' + user.name + (isMe ? ' (tu)' : '') + '</span>';
    html += '</div>';
    html += '<div class="leaderboard-stats">';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.totalPoints + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.correctWinners + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.exactScores + '</div></div>';
    html += '<div class="leaderboard-stat"><div class="leaderboard-stat-value">' + user.totalPredictions + '</div></div>';
    html += '</div></div>';
  }

  html += '</div>';

  if (leaderboardData.length === 1) {
    html += '<div class="ranking-demo-note">Tu eres el unico jugador. Invita a otros para competir en el ranking.</div>';
  }

  container.innerHTML = html;
}
