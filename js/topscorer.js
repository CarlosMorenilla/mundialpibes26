// MundialPibes26 - Maximo goleador (convocatorias reales + goles de API)

var myTopScorer = null;
var allPlayers = [];
var tournamentScorers = {};

function loadAllPlayers() {
  return fetch('/data/players.json')
    .then(function(r) { return r.ok ? r.json() : {}; })
    .then(function(data) {
      allPlayers = [];
      var codes = Object.keys(data);
      for (var i = 0; i < codes.length; i++) {
        var code = codes[i];
        var team = data[code];
        var players = team.players || [];
        for (var j = 0; j < players.length; j++) {
          var name = players[j].replace(/\s*\(captain\)/i, '').trim();
          allPlayers.push({ name: name, team: code, goals: 0 });
        }
      }
      console.log('[TopScorer] Loaded', allPlayers.length, 'real players');
    })
    .catch(function(e) {
      console.log('[TopScorer] Error loading players:', e);
    });
}

function loadScorersFromAPI() {
  return fetch(WORLDCUP_API + '/get/games')
    .then(function(r) { return r.ok ? r.json() : {games:[]}; })
    .then(function(data) {
      var games = data.games || [];
      tournamentScorers = {};
      for (var i = 0; i < games.length; i++) {
        var g = games[i];
        parseScorerField(g.home_scorers, g.home_team_name_en);
        parseScorerField(g.away_scorers, g.away_team_name_en);
      }
      // Update goals in allPlayers
      var names = Object.keys(tournamentScorers);
      for (var j = 0; j < allPlayers.length; j++) {
        var p = allPlayers[j];
        if (tournamentScorers[p.name]) {
          p.goals = tournamentScorers[p.name].goals;
        }
      }
      console.log('[TopScorer] Found', names.length, 'scorers from API');
    })
    .catch(function(e) {
      console.log('[TopScorer] API error:', e);
    });
}

function parseScorerField(field) {
  if (!field || field === 'null') return;
  var items;
  if (typeof field === 'string') {
    var cleaned = field.replace(/[{}]/g, '');
    if (!cleaned) return;
    items = cleaned.split(',');
  } else if (Array.isArray(field)) {
    items = field;
  } else {
    return;
  }
  for (var i = 0; i < items.length; i++) {
    var item = items[i].trim().replace(/^"|"$/g, '');
    if (!item) continue;
    var match = item.match(/^(.+?)\s+(\d+[\'+]*)$/);
    if (match) {
      var name = match[1].trim();
      if (!tournamentScorers[name]) {
        tournamentScorers[name] = { goals: 0 };
      }
      tournamentScorers[name].goals++;
    }
  }
}

function loadMyTopScorer() {
  if (!supabase || !currentUser) return Promise.resolve();
  return supabase.from('top_scorer_predictions')
    .select('player_name, team_code')
    .eq('user_id', currentUser.id)
    .single()
    .then(function(result) {
      if (result.data) {
        myTopScorer = { name: result.data.player_name, team: result.data.team_code || '' };
      }
    }).catch(function() {
      myTopScorer = null;
    });
}

function saveTopScorer(name, teamCode) {
  if (!supabase || !currentUser || !name) return;
  myTopScorer = { name: name, team: teamCode || '' };
  var prediction = {
    user_id: currentUser.id,
    player_name: name,
    team_code: teamCode || null
  };
  supabase.from('top_scorer_predictions').upsert(prediction, {
    onConflict: 'user_id'
  }).then(function() {
    showToast('Maximo goleador: ' + name, 'success');
    renderTopScorer();
  }).catch(function() {
    showToast('Error guardando', 'error');
  });
}

function clearTopScorer() {
  myTopScorer = null;
  if (supabase && currentUser) {
    supabase.from('top_scorer_predictions')
      .delete()
      .eq('user_id', currentUser.id)
      .then(function() { renderTopScorer(); });
  } else {
    renderTopScorer();
  }
}

function renderTopScorer() {
  var container = document.getElementById('topscorerContainer');
  if (!container) return;

  var html = '';

  if (myTopScorer) {
    var flag = myTopScorer.team ? getFlagImg(myTopScorer.team, 28) : '';
    html += '<div class="topscorer-current">';
    html += '<div class="topscorer-current-label">Tu prediccion (maximo goleador = 5 pts)</div>';
    html += '<div class="topscorer-current-card">';
    html += '<div class="topscorer-avatar topscorer-avatar-placeholder">' + myTopScorer.name.charAt(0).toUpperCase() + '</div>';
    html += '<div class="topscorer-info">';
    html += '<div class="topscorer-name">' + myTopScorer.name + '</div>';
    html += '<div class="topscorer-meta">' + flag + (myTopScorer.team ? ' ' + getTeamShortName(myTopScorer.team) : '') + '</div>';
    html += '</div>';
    html += '<button class="btn btn-sm" onclick="clearTopScorer()" style="margin-left:auto;">Cambiar</button>';
    html += '</div></div>';
  }

  html += '<div class="topscorer-search">';
  html += '<div class="topscorer-search-row">';
  html += '<span class="topscorer-search-icon">🔍</span>';
  html += '<input type="text" id="topscorer-input" placeholder="Buscar jugador..." autocomplete="off" oninput="filterScorers()">';
  html += '</div>';
  html += '<div id="topscorer-results" class="topscorer-results" style="display:none;"></div>';
  html += '<button class="btn btn-primary" onclick="submitTopScorer()" style="margin-top:8px;width:100%;">Guardar</button>';
  html += '</div>';

  html += '<div class="topscorer-section-title">Clasificacion de goleadores</div>';
  html += '<div id="topscorer-list" class="topscorer-leaderboard">';
  html += renderScorerLeaderboard('');
  html += '</div>';

  container.innerHTML = html;
}

function renderScorerLeaderboard(filter) {
  var lower = filter.toLowerCase();
  var sorted = allPlayers.slice().sort(function(a, b) {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.name.localeCompare(b.name);
  });

  var html = '';
  var count = 0;

  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    if (lower && p.name.toLowerCase().indexOf(lower) === -1) continue;
    count++;
    if (count > 50) break;
    var flag = getFlagImg(p.team, 20);
    var isSelected = myTopScorer && myTopScorer.name === p.name;
    var goalsClass = p.goals > 0 ? ' has-goals' : '';
    html += '<div class="topscorer-rank-item' + (isSelected ? ' selected' : '') + goalsClass + '" onclick="quickSelectScorer(\'' + p.name.replace(/'/g, "\\'") + '\', \'' + p.team + '\')">';
    html += '<div class="topscorer-rank-pos">' + count + '</div>';
    html += '<div class="topscorer-rank-info">';
    html += '<div class="topscorer-rank-name">' + p.name + '</div>';
    html += '<div class="topscorer-rank-meta">' + flag + ' ' + getTeamShortName(p.team) + '</div>';
    html += '</div>';
    html += '<div class="topscorer-rank-goals">' + (p.goals > 0 ? p.goals + ' ⚽' : '0') + '</div>';
    html += '</div>';
  }

  if (count === 0) {
    html += '<div class="topscorer-rank-empty">No se encontraron jugadores</div>';
  } else if (filter && count > 0) {
    html += '<div class="topscorer-rank-empty">Mostrando ' + count + ' resultados</div>';
  }

  return html;
}

function filterScorers() {
  var input = document.getElementById('topscorer-input');
  var resultsDiv = document.getElementById('topscorer-results');
  var listDiv = document.getElementById('topscorer-list');
  if (!input || !resultsDiv || !listDiv) return;

  var val = input.value.trim();
  if (val.length < 1) {
    resultsDiv.style.display = 'none';
    listDiv.innerHTML = renderScorerLeaderboard('');
    return;
  }

  var lower = val.toLowerCase();
  var matches = [];
  for (var i = 0; i < allPlayers.length; i++) {
    if (allPlayers[i].name.toLowerCase().indexOf(lower) !== -1) {
      matches.push(allPlayers[i]);
    }
  }

  if (matches.length > 0) {
    var html = '';
    var shown = Math.min(matches.length, 6);
    for (var j = 0; j < shown; j++) {
      var p = matches[j];
      var flag = getFlagImg(p.team, 18);
      var goalsText = p.goals > 0 ? ' (' + p.goals + ' ⚽)' : '';
      html += '<div class="topscorer-result-item" onclick="selectFromSearch(\'' + p.name.replace(/'/g, "\\'") + '\', \'' + p.team + '\')">';
      html += '<div class="topscorer-result-info">';
      html += '<div class="topscorer-result-name">' + flag + ' ' + p.name + goalsText + '</div>';
      html += '</div></div>';
    }
    if (matches.length > 6) {
      html += '<div class="topscorer-result-item" style="justify-content:center;color:var(--text-light);font-size:0.8rem;">+' + (matches.length - 6) + ' mas...</div>';
    }
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  } else {
    resultsDiv.innerHTML = '<div class="topscorer-result-item" onclick="submitTopScorer()">Añadir "' + val + '" como goleador</div>';
    resultsDiv.style.display = 'block';
  }

  listDiv.innerHTML = renderScorerLeaderboard(val);
}

function selectFromSearch(name, team) {
  var input = document.getElementById('topscorer-input');
  var resultsDiv = document.getElementById('topscorer-results');
  if (input) input.value = name;
  if (resultsDiv) resultsDiv.style.display = 'none';
  saveTopScorer(name, team);
}

function submitTopScorer() {
  var input = document.getElementById('topscorer-input');
  if (!input) return;
  var name = input.value.trim();
  if (name.length < 2) {
    showToast('Escribe un nombre', 'error');
    return;
  }
  var found = null;
  for (var i = 0; i < allPlayers.length; i++) {
    if (allPlayers[i].name.toLowerCase() === name.toLowerCase()) {
      found = allPlayers[i];
      break;
    }
  }
  saveTopScorer(name, found ? found.team : null);
}

function quickSelectScorer(name, team) {
  saveTopScorer(name, team);
}
