// MundialPibes26 - Actualizacion de resultados via API

var matchResults = {};
var liveMatches = {};
var scoresInterval = null;

function fetchScores() {
  var today = new Date().toISOString().split('T')[0];
  fetch(THESPORTSDB_API + '/eventsday.php?d=' + today + '&l=' + THESPORTSDB_LEAGUE_ID)
    .then(function(response) {
      if (!response.ok) throw new Error('API no disponible');
      return response.json();
    })
    .then(function(data) {
      if (data && data.events) processAPIEvents(data.events);
    })
    .catch(function() {
      // Silenciar errores de API - el Mundial aun no empieza
    });
}

function processAPIEvents(events) {
  var changed = false;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var homeCode = findTeamCode(event.strHomeTeam);
    var awayCode = findTeamCode(event.strAwayTeam);
    if (!homeCode || !awayCode) continue;

    var match = findMatchByTeams(homeCode, awayCode);
    if (!match) continue;

    var newStatus = mapStatus(event.strStatus || event.strProgress);
    var oldResult = matchResults[match.id];
    var oldStatus = oldResult ? oldResult.status : null;

    var result = {
      match_id: match.id,
      home_score: parseInt(event.intHomeScore) || 0,
      away_score: parseInt(event.intAwayScore) || 0,
      status: newStatus,
      minute: event.strProgress || null
    };

    matchResults[match.id] = result;
    if (newStatus === 'live') { liveMatches[match.id] = result; }
    else if (newStatus === 'finished') { delete liveMatches[match.id]; }

    if (oldStatus !== 'finished' && newStatus === 'finished') {
      changed = true;
    }
  }

  if (changed) {
    renderCurrentSection();
    buildLeaderboard();
  }
}

function findTeamCode(teamName) {
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

function mapStatus(apiStatus) {
  if (!apiStatus) return 'scheduled';
  var s = apiStatus.toLowerCase();
  if (s.indexOf('live') !== -1 || s.indexOf('1h') !== -1 || s.indexOf('2h') !== -1 || s.indexOf('ht') !== -1) return 'live';
  if (s.indexOf('ft') !== -1 || s.indexOf('finished') !== -1 || s.indexOf('final') !== -1) return 'finished';
  return 'scheduled';
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
