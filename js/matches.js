// MundialPibes26 - Gestion de partidos

var matchesData = null;

function loadMatches() {
  return fetch('/data/matches.json')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      matchesData = data;
      return data;
    })
    .catch(function(e) {
      console.error('Error cargando partidos:', e);
      return null;
    });
}

function getMatchById(id) {
  if (!matchesData) return null;
  for (var i = 0; i < matchesData.matches.length; i++) {
    if (matchesData.matches[i].id === id) return matchesData.matches[i];
  }
  return null;
}

function getGroupMatches(group) {
  if (!matchesData) return [];
  return matchesData.matches.filter(function(m) { return m.stage === 'group' && m.group === group; });
}

function getMatchesByStage(stage) {
  if (!matchesData) return [];
  return matchesData.matches.filter(function(m) { return m.stage === stage; });
}

function getMatchDate(match) {
  return new Date(match.date + 'T' + match.time + ':00+02:00');
}

function formatMatchDate(match) {
  var date = getMatchDate(match);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
}

function formatMatchTime(match) {
  var date = getMatchDate(match);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}

function isMatchStarted(match) {
  return new Date() > getMatchDate(match);
}

function getMatchDisplay(match) {
  var homeCode = match.home;
  var awayCode = match.away;
  var isHomePlaceholder = homeCode.length <= 3 && !FLAG_ISO[homeCode];
  var isAwayPlaceholder = awayCode.length <= 3 && !FLAG_ISO[awayCode];

  return {
    homeFlag: getFlagImg(homeCode, 40),
    homeName: getTeamShortName(homeCode),
    homePlaceholder: isHomePlaceholder,
    awayFlag: getFlagImg(awayCode, 40),
    awayName: getTeamShortName(awayCode),
    awayPlaceholder: isAwayPlaceholder,
    stageLabel: getStageLabel(match.stage),
    groupLabel: match.group ? 'Grupo ' + match.group : ''
  };
}

function getStageLabel(stage) {
  var labels = {
    'group': 'Fase de Grupos',
    'r32': 'Ronda de 32',
    'r16': 'Octavos',
    'qf': 'Cuartos',
    'sf': 'Semifinal',
    'final': 'FINAL',
    'third': '3er Puesto'
  };
  return labels[stage] || stage;
}

function renderMatchCard(match, result, prediction) {
  var display = getMatchDisplay(match);
  var started = isMatchStarted(match);
  var finished = result && result.status === 'finished';
  var live = result && result.status === 'live';
  var predicted = prediction && prediction.home_score !== null && prediction.home_score !== undefined;

  var statusClass = '';
  if (live) statusClass = 'live';
  else if (finished) statusClass = 'finished';
  else if (predicted) statusClass = 'predicted';

  var scoreHome = result ? result.home_score : (prediction ? prediction.home_score : null);
  var scoreAway = result ? result.away_score : (prediction ? prediction.away_score : null);

  var actionsHTML = '';

  if (live) {
    actionsHTML = '<div class="match-actions">' +
      '<div style="text-align:center;color:var(--danger);font-weight:600;font-size:0.85rem;">EN VIVO ' + (result.minute ? result.minute + "'" : '') + '</div>' +
      (predicted ? '<div class="prediction-saved">Tu prediccion: ' + prediction.home_score + ' - ' + prediction.away_score + '</div>' : '') +
      '</div>';
  } else if (finished) {
    var pts = prediction ? calculatePoints(prediction, result) : 0;
    var ptsLabel = '';
    if (predicted) {
      if (pts === APP_CONFIG.points.exactScore) ptsLabel = 'Resultado exacto! +3 pts';
      else if (pts === APP_CONFIG.points.winner) ptsLabel = 'Acertaste el ganador! +1 pt';
      else ptsLabel = 'No acertaste';
    }
    actionsHTML = '<div class="match-actions">' +
      '<div style="text-align:center;color:var(--success);font-weight:600;font-size:0.85rem;">FINALIZADO</div>' +
      (predicted ? '<div class="prediction-result">' +
        '<span class="prediction-result-label">Tu prediccion:</span> ' +
        '<span class="prediction-result-score">' + prediction.home_score + ' - ' + prediction.away_score + '</span>' +
        '</div>' +
        '<div class="prediction-points ' + (pts > 0 ? 'prediction-points-win' : 'prediction-points-lose') + '">' + ptsLabel + '</div>' : '') +
      '</div>';
  } else if (!started && !predicted) {
    actionsHTML = '<div class="match-actions">' +
      '<div class="prediction-inputs">' +
      '<input type="number" min="0" max="20" id="pred-home-' + match.id + '" placeholder="0">' +
      '<span class="vs-separator">-</span>' +
      '<input type="number" min="0" max="20" id="pred-away-' + match.id + '" placeholder="0">' +
      '</div>' +
      '<button class="btn btn-primary btn-block save-prediction" onclick="savePrediction(' + match.id + ')">Guardar</button>' +
      '</div>';
  } else if (!started && predicted) {
    actionsHTML = '<div class="match-actions">' +
      '<div class="prediction-inputs">' +
      '<input type="number" min="0" max="20" id="pred-home-' + match.id + '" value="' + prediction.home_score + '">' +
      '<span class="vs-separator">-</span>' +
      '<input type="number" min="0" max="20" id="pred-away-' + match.id + '" value="' + prediction.away_score + '">' +
      '</div>' +
      '<button class="btn btn-primary btn-block save-prediction" onclick="savePrediction(' + match.id + ')">Actualizar</button>' +
      '<div class="prediction-saved">Prediccion guardada</div>' +
      '</div>';
  }

  var venueName = '';
  if (match.venue && matchesData && matchesData.venues && matchesData.venues[match.venue]) {
    venueName = matchesData.venues[match.venue].name || '';
  }

  return '<div class="match-card ' + statusClass + '" id="match-' + match.id + '">' +
    '<div class="match-info">' +
    '<span class="match-stage ' + match.stage + '">' + display.stageLabel + '</span>' +
    '<span>' + display.groupLabel + '</span>' +
    '<span>' + formatMatchDate(match) + ' · ' + formatMatchTime(match) + '</span>' +
    '</div>' +
    '<div class="match-teams">' +
    '<div class="team">' +
    '<div class="team-flag">' + display.homeFlag + '</div>' +
    '<div class="team-name ' + (display.homePlaceholder ? 'team-name-placeholder' : '') + '">' + display.homeName + '</div>' +
    '</div>' +
    '<div class="match-score">' +
    (scoreHome !== null ? '<span>' + scoreHome + '</span>' : '<span>-</span>') +
    '<span style="font-size:0.8rem;color:var(--text-light);">:</span>' +
    (scoreAway !== null ? '<span>' + scoreAway + '</span>' : '<span>-</span>') +
    '</div>' +
    '<div class="team">' +
    '<div class="team-flag">' + display.awayFlag + '</div>' +
    '<div class="team-name ' + (display.awayPlaceholder ? 'team-name-placeholder' : '') + '">' + display.awayName + '</div>' +
    '</div>' +
    '</div>' +
    (venueName ? '<div class="match-venue">' + venueName + '</div>' : '') +
    actionsHTML +
    '</div>';
}

function calculatePoints(prediction, result) {
  if (!prediction || !result) return 0;
  if (result.status !== 'finished') return 0;

  var predHome = parseInt(prediction.home_score);
  var predAway = parseInt(prediction.away_score);
  var resHome = parseInt(result.home_score);
  var resAway = parseInt(result.away_score);

  if (isNaN(predHome) || isNaN(predAway) || isNaN(resHome) || isNaN(resAway)) return 0;

  if (predHome === resHome && predAway === resAway) {
    return APP_CONFIG.points.exactScore;
  }

  var predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  var resWinner = resHome > resAway ? 'home' : resHome < resAway ? 'away' : 'draw';

  if (predWinner === resWinner) {
    return APP_CONFIG.points.winner;
  }

  return 0;
}
