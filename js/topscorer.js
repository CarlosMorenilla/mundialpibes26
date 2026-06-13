// MundialPibes26 - Maximo goleador (sin API, lista popular + input libre)

var myTopScorer = null;

var POPULAR_PLAYERS = [
  { name: 'Kylian Mbappe', team: 'FRA' },
  { name: 'Jude Bellingham', team: 'ENG' },
  { name: 'Harry Kane', team: 'ENG' },
  { name: 'Bukayo Saka', team: 'ENG' },
  { name: 'Phil Foden', team: 'ENG' },
  { name: 'Lamine Yamal', team: 'ESP' },
  { name: 'Alvaro Morata', team: 'ESP' },
  { name: 'Pedri', team: 'ESP' },
  { name: 'Jamal Musiala', team: 'GER' },
  { name: 'Florian Wirtz', team: 'GER' },
  { name: 'Kai Havertz', team: 'GER' },
  { name: 'Lautaro Martinez', team: 'ARG' },
  { name: 'Julian Alvarez', team: 'ARG' },
  { name: 'Lionel Messi', team: 'ARG' },
  { name: 'Vinicius Junior', team: 'BRA' },
  { name: 'Rodrygo', team: 'BRA' },
  { name: 'Raphinha', team: 'BRA' },
  { name: 'Ousmane Dembele', team: 'FRA' },
  { name: 'Marcus Thuram', team: 'FRA' },
  { name: 'Federico Valverde', team: 'URU' },
  { name: 'Darwin Nunez', team: 'URU' },
  { name: 'Bruno Fernandes', team: 'POR' },
  { name: 'Cristiano Ronaldo', team: 'POR' },
  { name: 'Rafael Leao', team: 'POR' },
  { name: 'Memphis Depay', team: 'NED' },
  { name: 'Cody Gakpo', team: 'NED' },
  { name: 'Dusan Vlahovic', team: 'NED' },
  { name: 'Romelu Lukaku', team: 'BEL' },
  { name: 'Kevin De Bruyne', team: 'BEL' },
  { name: 'Luka Modric', team: 'CRO' },
  { name: 'Ante Budimir', team: 'CRO' },
  { name: 'Niclas Fullkrug', team: 'GER' },
  { name: 'Nicolo Barella', team: 'ITA' },
  { name: 'Randal Kolo Muani', team: 'FRA' },
  { name: 'Jonathan David', team: 'CAN' },
  { name: 'Alvaro Vega', team: 'MEX' },
  { name: 'Santiago Gimenez', team: 'MEX' },
  { name: 'Edinson Cavani', team: 'URU' },
  { name: 'Neymar', team: 'BRA' },
  { name: 'Youssef En-Nesyri', team: 'MAR' },
  { name: 'Achraf Hakimi', team: 'MAR' },
  { name: 'Alessandro Del Piero', team: 'ITA' }
];

function loadMyTopScorer() {
  if (!supabase || !currentUser) return Promise.resolve();

  return supabase.from('top_scorer_predictions')
    .select('player_name, team_code')
    .eq('user_id', currentUser.id)
    .single()
    .then(function(result) {
      if (result.data) {
        myTopScorer = {
          name: result.data.player_name,
          team: result.data.team_code || ''
        };
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
  html += '<input type="text" id="topscorer-input" placeholder="Escribe el nombre del jugador..." autocomplete="off">';
  html += '<button class="btn btn-primary" onclick="submitTopScorer()" style="margin-top:8px;width:100%;">Guardar</button>';
  html += '</div>';

  html += '<div class="topscorer-popular">';
  html += '<div class="topscorer-section-title">Jugadores populares</div>';
  html += '<div class="topscorer-grid">';

  for (var i = 0; i < POPULAR_PLAYERS.length; i++) {
    var p = POPULAR_PLAYERS[i];
    var pFlag = getFlagImg(p.team, 24);
    var isSelected = myTopScorer && myTopScorer.name === p.name;

    html += '<div class="topscorer-card' + (isSelected ? ' topscorer-card-selected' : '') + '" onclick="quickSelectScorer(\'' + p.name.replace(/'/g, "\\'") + '\', \'' + p.team + '\')">';
    html += '<div class="topscorer-card-img topscorer-card-placeholder">' + p.name.charAt(0) + '</div>';
    html += '<div class="topscorer-card-name">' + p.name + '</div>';
    html += '<div class="topscorer-card-meta">' + pFlag + ' ' + getTeamShortName(p.team) + '</div>';
    html += '</div>';
  }

  html += '</div></div>';

  container.innerHTML = html;
}

function submitTopScorer() {
  var input = document.getElementById('topscorer-input');
  if (!input) return;
  var name = input.value.trim();
  if (name.length < 2) {
    showToast('Escribe un nombre', 'error');
    return;
  }
  saveTopScorer(name, null);
}

function quickSelectScorer(name, team) {
  saveTopScorer(name, team);
}
