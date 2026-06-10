// MundialPibes26 - Ver predicciones de todos los usuarios

var allPredictions = {};

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

function renderPredictionsView() {
  var container = document.getElementById('predictionsContainer');
  if (!container || !matchesData) return;

  loadAllPredictions().then(function() {
    var html = '';
    var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    html += '<div class="predictions-legend">';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--success);"></span>Acerto</span>';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--danger);"></span>Fallo</span>';
    html += '<span class="predictions-legend-item"><span class="predictions-legend-dot" style="background:var(--text-light);"></span>Sin resultado</span>';
    html += '</div>';

    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      var groupMatches = getGroupMatches(g);

      html += '<div class="predictions-group">';
      html += '<div class="predictions-group-title">Grupo ' + g + '</div>';

      for (var mi = 0; mi < groupMatches.length; mi++) {
        var match = groupMatches[mi];
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

      html += '</div>';
    }

    container.innerHTML = html;
  });
}
