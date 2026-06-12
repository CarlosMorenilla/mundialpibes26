// MundialPibes26 - Maximo goleador

var allPlayers = [];
var playersLoaded = false;
var myTopScorer = null;

function loadPlayersCache() {
  try {
    var cached = localStorage.getItem('mundialpibes26_players');
    if (cached) {
      allPlayers = JSON.parse(cached);
      playersLoaded = true;
      console.log('[TopScorer] Loaded', allPlayers.length, 'players from cache');
      return true;
    }
  } catch(e) {}
  return false;
}

function savePlayersCache() {
  try {
    localStorage.setItem('mundialpibes26_players', JSON.stringify(allPlayers));
  } catch(e) {}
}

function loadAllPlayers() {
  if (playersLoaded) return Promise.resolve();

  if (loadPlayersCache()) return Promise.resolve();

  if (!matchesData) return Promise.resolve();

  var codes = Object.keys(matchesData.teams);
  var loaded = 0;
  var total = codes.length;

  console.log('[TopScorer] Loading players from', total, 'teams...');

  var promises = [];
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    var teamId = getTeamApiId(code);
    if (!teamId) { loaded++; continue; }

    var p = fetch(THESPORTSDB_API + '/lookup_all_players.php?id=' + teamId)
      .then(function(r) { return r.ok ? r.json() : {player:null}; })
      .catch(function() { return {player:null}; })
      .then(function(data) {
        if (data && data.player) {
          for (var j = 0; j < data.player.length; j++) {
            var pl = data.player[j];
            allPlayers.push({
              id: pl.idPlayer,
              name: pl.strPlayer || pl.strPlayerAlternate || 'Unknown',
              position: pl.strPosition || '',
              number: pl.strNumber || '',
              nationality: pl.strNationality || '',
              team: pl.strTeam2 || pl.strTeam || '',
              thumb: pl.strThumb || '',
              cutout: pl.strCutout || ''
            });
          }
        }
        loaded++;
        if (loaded >= total) {
          playersLoaded = true;
          savePlayersCache();
          console.log('[TopScorer] Total players loaded:', allPlayers.length);
        }
      });

    promises.push(p);
  }

  return Promise.all(promises).then(function() {
    playersLoaded = true;
    savePlayersCache();
    console.log('[TopScorer] Final count:', allPlayers.length);
  });
}

function getTeamApiId(code) {
  var teamIds = {
    'MEX': 134497, 'RSA': 136482, 'KOR': 136467, 'CZE': 136453,
    'CAN': 136472, 'BIH': 136448, 'QAT': 136460, 'SUI': 136455,
    'BRA': 136425, 'MAR': 136436, 'HAI': 136484, 'SCO': 136431,
    'USA': 136478, 'PAR': 136465, 'AUS': 136469, 'TUR': 136443,
    'GER': 136428, 'CUW': 136496, 'CIV': 136438, 'ECU': 136463,
    'NED': 136434, 'JPN': 136470, 'SWE': 136440, 'TUN': 136441,
    'BEL': 136430, 'EGY': 136437, 'IRN': 136461, 'NZL': 136492,
    'ESP': 136427, 'CPV': 136498, 'KSA': 136459, 'URU': 136426,
    'FRA': 136429, 'SEN': 136439, 'IRQ': 136462, 'NOR': 136435,
    'ARG': 136424, 'ALG': 136433, 'AUT': 136445, 'JOR': 136468,
    'POR': 136432, 'COD': 136449, 'UZB': 136471, 'COL': 136464,
    'ENG': 136423, 'CRO': 136446, 'GHA': 136442, 'PAN': 136483
  };
  return teamIds[code] || null;
}

function searchPlayers(query) {
  if (!query || query.length < 2) return [];
  var lower = query.toLowerCase();
  var results = [];
  for (var i = 0; i < allPlayers.length; i++) {
    if (allPlayers[i].name.toLowerCase().indexOf(lower) !== -1) {
      results.push(allPlayers[i]);
      if (results.length >= 20) break;
    }
  }
  return results;
}

function saveTopScorer(player) {
  if (!supabase || !currentUser) return;

  myTopScorer = player;

  var prediction = {
    user_id: currentUser.id,
    player_name: player.name,
    team_code: null,
    player_id: player.id
  };

  for (var code in matchesData.teams) {
    if (matchesData.teams[code].name === player.team) {
      prediction.team_code = code;
      break;
    }
  }

  supabase.from('top_scorer_predictions').upsert(prediction, {
    onConflict: 'user_id'
  }).then(function() {
    showToast('Maximo goleador guardado: ' + player.name, 'success');
    renderTopScorer();
  }).catch(function() {
    showToast('Error guardando', 'error');
  });
}

function loadMyTopScorer() {
  if (!supabase || !currentUser) return Promise.resolve();

  return supabase.from('top_scorer_predictions')
    .select('player_name, team_code, player_id')
    .eq('user_id', currentUser.id)
    .single()
    .then(function(result) {
      if (result.data) {
        myTopScorer = {
          name: result.data.player_name,
          id: result.data.player_id,
          team: result.data.team_code ? (matchesData.teams[result.data.team_code] ? matchesData.teams[result.data.team_code].name : '') : '',
          position: '',
          number: '',
          nationality: '',
          thumb: '',
          cutout: ''
        };
      }
    }).catch(function() {
      myTopScorer = null;
    });
}

function renderTopScorer() {
  var container = document.getElementById('topscorerContainer');
  if (!container) return;

  var html = '';

  if (myTopScorer) {
    var flag = myTopScorer.team_code ? getFlagImg(myTopScorer.team_code, 28) : '';
    html += '<div class="topscorer-current">';
    html += '<div class="topscorer-current-label">Tu prediccion (maximo goleador = 5 pts)</div>';
    html += '<div class="topscorer-current-card">';
    if (myTopScorer.thumb) {
      html += '<img src="' + myTopScorer.thumb + '" class="topscorer-avatar" alt="">';
    } else {
      html += '<div class="topscorer-avatar topscorer-avatar-placeholder">' + myTopScorer.name.charAt(0) + '</div>';
    }
    html += '<div class="topscorer-info">';
    html += '<div class="topscorer-name">' + myTopScorer.name + '</div>';
    html += '<div class="topscorer-meta">' + flag + ' ' + (myTopScorer.team || 'Desconocido') + (myTopScorer.position ? ' · ' + myTopScorer.position : '') + '</div>';
    html += '</div>';
    html += '<button class="btn btn-sm" onclick="clearTopScorer()" style="margin-left:auto;">Cambiar</button>';
    html += '</div></div>';
  }

  html += '<div class="topscorer-search">';
  html += '<input type="text" id="topscorer-input" placeholder="Busca un jugador..." oninput="onTopScorerSearch()" autocomplete="off">';
  html += '<div id="topscorer-results" class="topscorer-results"></div>';
  html += '</div>';

  if (!myTopScorer) {
    html += '<div class="topscorer-popular">';
    html += '<div class="topscorer-section-title">Jugadores populares</div>';
    html += '<div class="topscorer-grid">';

    var popular = getPopularPlayers();
    for (var i = 0; i < popular.length; i++) {
      var p = popular[i];
      var pFlag = '';
      for (var code in matchesData.teams) {
        if (matchesData.teams[code].name === p.team) {
          pFlag = getFlagImg(code, 24);
          break;
        }
      }
      html += '<div class="topscorer-card" onclick="selectTopScorer(\'' + escapeHtml(p.name) + '\')">';
      if (p.thumb) {
        html += '<img src="' + p.thumb + '" class="topscorer-card-img" alt="">';
      } else {
        html += '<div class="topscorer-card-img topscorer-card-placeholder">' + p.name.charAt(0) + '</div>';
      }
      html += '<div class="topscorer-card-name">' + p.name + '</div>';
      html += '<div class="topscorer-card-meta">' + pFlag + ' ' + (p.team || '') + '</div>';
      html += '</div>';
    }

    html += '</div></div>';
  }

  container.innerHTML = html;
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function onTopScorerSearch() {
  var input = document.getElementById('topscorer-input');
  var results = document.getElementById('topscorer-results');
  if (!input || !results) return;

  var query = input.value.trim();
  if (query.length < 2) {
    results.innerHTML = '';
    results.style.display = 'none';
    return;
  }

  var matches = searchPlayers(query);
  if (matches.length === 0) {
    results.innerHTML = '<div class="topscorer-result-empty">No se encontraron jugadores</div>';
    results.style.display = 'block';
    return;
  }

  var html = '';
  for (var i = 0; i < matches.length; i++) {
    var p = matches[i];
    var pFlag = '';
    for (var code in matchesData.teams) {
      if (matchesData.teams[code].name === p.team) {
        pFlag = getFlagImg(code, 20);
        break;
      }
    }
    html += '<div class="topscorer-result-item" onclick="selectTopScorer(\'' + escapeHtml(p.name) + '\')">';
    if (p.thumb) {
      html += '<img src="' + p.thumb + '" class="topscorer-result-img" alt="">';
    } else {
      html += '<div class="topscorer-result-img topscorer-result-placeholder">' + p.name.charAt(0) + '</div>';
    }
    html += '<div class="topscorer-result-info">';
    html += '<div class="topscorer-result-name">' + p.name + '</div>';
    html += '<div class="topscorer-result-meta">' + pFlag + ' ' + (p.team || '') + (p.position ? ' · ' + p.position : '') + '</div>';
    html += '</div></div>';
  }

  results.innerHTML = html;
  results.style.display = 'block';
}

function selectTopScorer(name) {
  for (var i = 0; i < allPlayers.length; i++) {
    if (allPlayers[i].name === name) {
      saveTopScorer(allPlayers[i]);
      return;
    }
  }
}

function clearTopScorer() {
  myTopScorer = null;
  if (supabase && currentUser) {
    supabase.from('top_scorer_predictions')
      .delete()
      .eq('user_id', currentUser.id)
      .then(function() {
        renderTopScorer();
      });
  } else {
    renderTopScorer();
  }
}

function getPopularPlayers() {
  var names = [
    'Kylian Mbappe', 'Erling Haaland', 'Jude Bellingham', 'Vinicius Junior',
    'Lautaro Martinez', 'Bukayo Saka', 'Phil Foden', 'Florian Wirtz',
    'Jamal Musiala', 'Federico Valverde', 'Rodri', 'Harry Kane',
    'Lionel Messi', 'Neymar', 'Vinicius Junior', 'Rafael Leao',
    'Bruno Fernandes', 'Bernardo Silva', 'Olivier Giroud', 'Alvaro Morata'
  ];

  var found = [];
  var seen = {};
  for (var i = 0; i < allPlayers.length && found.length < 12; i++) {
    for (var j = 0; j < names.length; j++) {
      if (allPlayers[i].name === names[j] && !seen[allPlayers[i].name]) {
        found.push(allPlayers[i]);
        seen[allPlayers[i].name] = true;
        break;
      }
    }
  }

  if (found.length < 12) {
    for (var i = 0; i < allPlayers.length && found.length < 12; i++) {
      if (!seen[allPlayers[i].name] && allPlayers[i].position === 'Attacker') {
        found.push(allPlayers[i]);
        seen[allPlayers[i].name] = true;
      }
    }
  }

  return found;
}
