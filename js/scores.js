// MundialPibes26 - Actualizacion de resultados via worldcup26.ir API

var matchResults = {};
var liveMatches = {};
var scoresInterval = null;

function loadSavedResults() {
  try {
    var saved = localStorage.getItem('mundialpibes26_results');
    if (saved) {
      var parsed = JSON.parse(saved);
      var keys = Object.keys(parsed);
      var cleaned = 0;
      for (var i = 0; i < keys.length; i++) {
        var r = parsed[keys[i]];
        if (r.status === 'live' || r.status === 'finished') {
          matchResults[keys[i]] = r;
        } else {
          cleaned++;
        }
      }
      console.log('[Scores] Loaded', Object.keys(matchResults).length, 'results, cleaned', cleaned, 'stale');
      saveResults();
    }
  } catch(e) {}
}

function saveResults() {
  try {
    localStorage.setItem('mundialpibes26_results', JSON.stringify(matchResults));
  } catch(e) {}
}

function fetchScores() {
  console.log('[Scores] Fetching from worldcup26.ir...');
  fetch(WORLDCUP_API + '/get/games')
    .then(function(r) { return r.ok ? r.json() : {games:[]}; })
    .then(function(data) {
      var games = data.games || [];
      console.log('[Scores] Found', games.length, 'games');
      processAPIGames(games);
    })
    .catch(function(e) {
      console.log('[Scores] API error:', e);
    });
}

function parseScorers(scorersStr) {
  if (!scorersStr || scorersStr === 'null') return [];
  try {
    if (typeof scorersStr === 'object') return scorersStr;
    var cleaned = scorersStr.replace(/[{}]/g, '');
    if (!cleaned) return [];
    return cleaned.split(',').map(function(s) { return s.trim(); });
  } catch(e) { return []; }
}

function processAPIGames(games) {
  var changed = false;
  for (var i = 0; i < games.length; i++) {
    var game = games[i];
    var homeCode = findTeamCodeByName(game.home_team_name_en);
    var awayCode = findTeamCodeByName(game.away_team_name_en);
    if (!homeCode || !awayCode) continue;

    var match = findMatchByTeams(homeCode, awayCode);
    if (!match) continue;

    var newStatus = mapStatus(game.time_elapsed, game.finished);
    if (newStatus !== 'live' && newStatus !== 'finished') continue;

    var oldResult = matchResults[match.id];
    var oldStatus = oldResult ? oldResult.status : null;

    var homeScorers = parseScorers(game.home_scorers);
    var awayScorers = parseScorers(game.away_scorers);

    var result = {
      match_id: match.id,
      home_score: parseInt(game.home_score) || 0,
      away_score: parseInt(game.away_score) || 0,
      status: newStatus,
      minute: game.time_elapsed || null,
      home_scorers: homeScorers,
      away_scorers: awayScorers
    };

    matchResults[match.id] = result;
    if (newStatus === 'live') { liveMatches[match.id] = result; }
    else if (newStatus === 'finished') { delete liveMatches[match.id]; }

    console.log('[Scores] Match', match.id, homeCode, 'vs', awayCode, ':', result.home_score, '-', result.away_score, '(' + newStatus + ')', 'Scorers:', homeScorers, awayScorers);

    if (oldStatus !== 'finished' && newStatus === 'finished') {
      changed = true;
    }
  }

  if (changed) {
    console.log('[Scores] Match finished, refreshing...');
    saveResults();
    renderCurrentSection();
    buildLeaderboard();
  } else {
    saveResults();
    if (Object.keys(liveMatches).length > 0) {
      renderCurrentSection();
    }
  }
}

function findTeamCodeByName(teamName) {
  if (!teamName || !matchesData) return null;
  var lower = teamName.toLowerCase();
  var teams = matchesData.teams;
  var codes = Object.keys(teams);
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    var name = teams[code].name.toLowerCase();
    if (name === lower) return code;
    var vars = getCodeVariations(code);
    for (var j = 0; j < vars.length; j++) {
      if (lower.indexOf(vars[j]) !== -1) return code;
    }
  }
  return null;
}

function getCodeVariations(code) {
  var v = {
    'MEX': ['mexico'], 'RSA': ['south africa', 'sudafrica'], 'KOR': ['south korea', 'corea del sur', 'korea'],
    'CZE': ['czechia', 'czech republic', 'chequia'], 'CAN': ['canada'], 'BIH': ['bosnia'],
    'QAT': ['qatar', 'catar'], 'SUI': ['switzerland', 'suiza'], 'BRA': ['brazil', 'brasil'],
    'MAR': ['morocco', 'marruecos'], 'HAI': ['haiti'], 'SCO': ['scotland', 'escocia'],
    'USA': ['united states', 'estados unidos', 'ee.uu.', 'usa'], 'PAR': ['paraguay'],
    'AUS': ['australia'], 'TUR': ['turkey', 'turquia', 'turkiye'], 'GER': ['germany', 'alemania'],
    'CUW': ['curacao', 'curazao'], 'CIV': ['ivory coast', 'costa de marfil'],
    'ECU': ['ecuador'], 'NED': ['netherlands', 'paises bajos', 'holanda'],
    'JPN': ['japan', 'japon'], 'SWE': ['sweden', 'suecia'], 'TUN': ['tunisia', 'tunez'],
    'BEL': ['belgium', 'belgica'], 'EGY': ['egypt', 'egipto'], 'IRN': ['iran'],
    'NZL': ['new zealand', 'nueva zelanda'], 'ESP': ['spain', 'espana'],
    'CPV': ['cape verde', 'cabo verde'], 'KSA': ['saudi arabia', 'arabia saudita'],
    'URU': ['uruguay'], 'FRA': ['france', 'francia'], 'SEN': ['senegal'],
    'IRQ': ['iraq', 'irak'], 'NOR': ['norway', 'noruega'], 'ARG': ['argentina'],
    'ALG': ['algeria', 'argelia'], 'AUT': ['austria'], 'JOR': ['jordan', 'jordania'],
    'POR': ['portugal'], 'COD': ['dr congo', 'rd congo', 'congo'], 'UZB': ['uzbekistan'],
    'COL': ['colombia'], 'ENG': ['england', 'inglaterra'], 'CRO': ['croatia', 'croacia'],
    'GHA': ['ghana'], 'PAN': ['panama', 'panama']
  };
  return v[code] || [];
}

function findMatchByTeams(homeCode, awayCode) {
  if (!matchesData) return null;
  for (var i = 0; i < matchesData.matches.length; i++) {
    var m = matchesData.matches[i];
    if ((m.home === homeCode && m.away === awayCode) || (m.home === awayCode && m.away === homeCode)) return m;
  }
  return null;
}

function mapStatus(timeElapsed, finished) {
  if (finished === 'TRUE' || finished === true) return 'finished';
  if (!timeElapsed) return 'scheduled';
  var s = timeElapsed.toLowerCase();
  if (s === 'notstarted' || s === 'scheduled') return 'scheduled';
  if (s === 'finished' || s === 'ft') return 'finished';
  return 'live';
}

function getResult(matchId) {
  return matchResults[matchId] || null;
}

function startScorePolling() {
  fetchScores();
  scoresInterval = setInterval(fetchScores, APP_CONFIG.refreshInterval);
}

function stopScorePolling() {
  if (scoresInterval) { clearInterval(scoresInterval); scoresInterval = null; }
}
