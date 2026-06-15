// MundialPibes26 - Ver predicciones de todos los usuarios

var allPredictions = {};
var predStageFilter = 'all';
var predGroupFilter = 'all';

function loadAllPredictions() {
  if (!supabase) return Promise.resolve();

  return supabase.from('predictions').select('user_id, user_name, match_id, home_score, away_score')
    .then(function(result) {
      allPredictions = {};
      if (result.data) {
        for (var i = 0; i < result.data.length; i++) {
          var pred = result.data[i];
          if (!allPredictions[pred.match_id]) allPredictions[pred.match_id] = [];
          allPredictions[pred.match_id].push(pred);
        }
      }
    }).catch(function() {
      allPredictions = {};
    });
}

function filterPredStage(stage) {
  predStageFilter = stage;
  if (stage !== 'group' && stage !== 'all') {
    predGroupFilter = 'all';
  }
  renderPredictionsView();
}

function filterPredGroup(group) {
  predGroupFilter = group;
  if (group === 'knockout') {
    predStageFilter = 'all';
  }
  renderPredictionsView();
}

function renderPredictionsView() {
  var container = document.getElementById('predictionsContainer');
  if (!container || !matchesData) return;

  loadAllPredictions().then(function() {
    var html = '';

    html += '<div class="predictions-legend">';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--success);"></span>Acerto</span>';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--danger);"></span>Fallo</span>';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--text-light);"></span>Sin resultado</span>';
    html += '</div>';

    // Stage filter
    html += '<div class="stage-filter">';
    var stages = [
      { key: 'all', label: 'Todos' },
      { key: 'group', label: 'Grupos' },
      { key: 'r32', label: 'R32' },
      { key: 'r16', label: 'Octavos' },
      { key: 'qf', label: 'Cuartos' },
      { key: 'sf', label: 'Semi' },
      { key: 'final', label: 'Final' }
    ];
    for (var si = 0; si < stages.length; si++) {
      var s = stages[si];
      html += '<button class="stage-filter-btn ' + (predStageFilter === s.key ? 'active' : '') + '" onclick="filterPredStage(\'' + s.key + '\')">' + s.label + '</button>';
    }
    html += '</div>';

    // Group filter (only when stage is group or all)
    if (predStageFilter === 'group' || predStageFilter === 'all') {
      html += '<div class="group-filter">';
      html += '<button class="group-filter-btn ' + (predGroupFilter === 'all' ? 'active' : '') + '" onclick="filterPredGroup(\'all\')">Todos</button>';

      var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      for (var gi = 0; gi < groups.length; gi++) {
        html += '<button class="group-filter-btn ' + (predGroupFilter === groups[gi] ? 'active' : '') + '" onclick="filterPredGroup(\'' + groups[gi] + '\')">' + groups[gi] + '</button>';
      }

      if (predStageFilter === 'all') {
        html += '<button class="group-filter-btn ' + (predGroupFilter === 'knockout' ? 'active' : '') + '" onclick="filterPredGroup(\'knockout\')">Elim.</button>';
      }

      html += '</div>';
    }

    // Filter matches
    var matches = matchesData.matches;

    if (predStageFilter !== 'all') {
      matches = matches.filter(function(m) { return m.stage === predStageFilter; });
    }

    if (predGroupFilter !== 'all') {
      if (predStageFilter === 'all' || predStageFilter === 'group') {
        matches = matches.filter(function(m) { return m.group === predGroupFilter; });
      }
    }

    if (predStageFilter === 'all' && predGroupFilter === 'knockout') {
      matches = matchesData.matches.filter(function(m) { return m.stage !== 'group'; });
    }

    if (matches.length === 0) {
      html += '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No hay partidos en esta vista</div></div>';
      container.innerHTML = html;
      return;
    }

    // Group by date for display
    var grouped = {};
    for (var mi = 0; mi < matches.length; mi++) {
      var match = matches[mi];
      var dateKey = match.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(match);
    }

    var sortedDates = Object.keys(grouped).sort();

    for (var di = 0; di < sortedDates.length; di++) {
      var date = sortedDates[di];
      var dateObj = new Date(date + 'T12:00:00+01:00');
      var dateLabel = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
      html += '<div class="day-header">' + dateLabel + '</div>';

      var dayMatches = grouped[date];
      for (var dj = 0; dj < dayMatches.length; dj++) {
        var match = dayMatches[dj];
        var result = getResult(match.id);
        var preds = allPredictions[match.id] || [];
        var display = getMatchDisplay(match);

        var scoreStr = '';
        if (result && result.status === 'finished') {
          scoreStr = result.home_score + ' - ' + result.away_score;
        } else if (result && result.status === 'live') {
          scoreStr = result.home_score + ' - ' + result.away_score + ' (en vivo)';
        } else {
          scoreStr = 'Sin jugar';
        }

        html += '<div class="predictions-match">';
        html += '<div class="predictions-match-header">';
        html += '<div class="predictions-match-teams">' + display.homeFlag + ' ' + display.homeName + ' vs ' + display.awayName + ' ' + display.awayFlag + '</div>';
        html += '<div class="predictions-match-score">' + scoreStr + '</div>';
        html += '<div class="predictions-match-date">' + formatMatchDate(match) + ' ' + formatMatchTime(match) + '</div>';
        html += '</div>';

        if (preds.length === 0) {
          html += '<div class="predictions-match-empty">Nadie ha predecido este partido</div>';
        } else {
          html += '<div class="predictions-match-list">';
          for (var pi = 0; pi < preds.length; pi++) {
            var pred = preds[pi];
            var pts = 0;
            var correct = false;
            if (result && result.status === 'finished') {
              pts = calculatePoints(pred, result);
              correct = pts > 0;
            }
            var name = pred.user_name || 'Jugador';
            var isMe = pred.user_id === currentUser.id;

            html += '<div class="predictions-user' + (isMe ? ' predictions-user-me' : '') + '">';
            html += '<span class="predictions-user-name">' + name + (isMe ? ' (tu)' : '') + '</span>';
            html += '<span class="predictions-user-score ' + (result && result.status === 'finished' ? (correct ? 'predictions-correct' : 'predictions-wrong') : '') + '">';
            html += pred.home_score + ' - ' + pred.away_score;
            if (result && result.status === 'finished') {
              html += ' <span class="predictions-pts">(' + pts + ' pts)</span>';
            }
            html += '</span>';
            html += '</div>';
          }
          html += '</div>';
        }

        html += '</div>';
      }
    }

    container.innerHTML = html;
  });
}
