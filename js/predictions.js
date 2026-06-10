// MundialPibes26 - Predicciones (Supabase DB + localStorage fallback)

var userPredictions = {};

function loadPredictions() {
  if (!currentUser) return Promise.resolve();

  if (supabase && !isDemoUser()) {
    return supabase.from('predictions')
      .select('*')
      .eq('user_id', currentUser.id)
      .then(function(result) {
        userPredictions = {};
        if (result.data) {
          for (var i = 0; i < result.data.length; i++) {
            var pred = result.data[i];
            userPredictions[pred.match_id] = pred;
          }
        }
      }).catch(function() {
        loadPredictionsLocal();
      });
  }

  loadPredictionsLocal();
  return Promise.resolve();
}

function loadPredictionsLocal() {
  if (!currentUser) return;
  var stored = localStorage.getItem('predictions_' + currentUser.id);
  if (stored) {
    try { userPredictions = JSON.parse(stored); } catch(e) { userPredictions = {}; }
  }
}

function savePrediction(matchId) {
  var homeInput = document.getElementById('pred-home-' + matchId);
  var awayInput = document.getElementById('pred-away-' + matchId);

  if (!homeInput || !awayInput) return;

  var homeScore = homeInput.value === '' ? 0 : parseInt(homeInput.value, 10);
  var awayScore = awayInput.value === '' ? 0 : parseInt(awayInput.value, 10);

  if (isNaN(homeScore)) homeScore = 0;
  if (isNaN(awayScore)) awayScore = 0;

  if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    showToast('Goles no validos (0-20)', 'error');
    return;
  }

  var match = getMatchById(matchId);
  if (match && isMatchStarted(match)) {
    showToast('Este partido ya ha comenzado', 'error');
    return;
  }

  var prediction = {
    user_id: currentUser.id,
    match_id: matchId,
    home_score: homeScore,
    away_score: awayScore,
    user_name: currentUser.user_metadata && currentUser.user_metadata.full_name
      ? currentUser.user_metadata.full_name
      : (currentUser.email || 'Jugador')
  };

  userPredictions[matchId] = prediction;

  if (supabase && !isDemoUser()) {
    supabase.from('predictions').upsert(prediction, {
      onConflict: 'user_id,match_id'
    }).then(function() {
      showToast('Prediccion guardada', 'success');
    }).catch(function() {
      showToast('Error guardando en servidor', 'error');
    });
  } else {
    localStorage.setItem('predictions_' + currentUser.id, JSON.stringify(userPredictions));
    showToast('Prediccion guardada', 'success');
  }

  renderCurrentSection();
}

function getUserPrediction(matchId) {
  return userPredictions[matchId] || null;
}

function getPredictionCount() {
  return Object.keys(userPredictions).length;
}
