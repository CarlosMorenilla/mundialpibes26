// MundialPibes26 - Clasificacion de grupos

function calculateGroupStandings() {
  if (!matchesData) return {};

  var standings = {};
  var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];
    var teams = matchesData.groups[g];
    var groupTable = {};

    for (var ti = 0; ti < teams.length; ti++) {
      groupTable[teams[ti]] = {
        code: teams[ti],
        name: getTeamShortName(teams[ti]),
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    }

    var groupMatches = getGroupMatches(g);
    for (var mi = 0; mi < groupMatches.length; mi++) {
      var match = groupMatches[mi];
      var result = getResult(match.id);
      if (!result || result.status !== 'finished') continue;

      var home = groupTable[match.home];
      var away = groupTable[match.away];
      if (!home || !away) continue;

      var hg = parseInt(result.home_score) || 0;
      var ag = parseInt(result.away_score) || 0;

      home.played++;
      away.played++;
      home.goalsFor += hg;
      home.goalsAgainst += ag;
      away.goalsFor += ag;
      away.goalsAgainst += hg;

      if (hg > ag) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (hg < ag) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    }

    var rows = [];
    var keys = Object.keys(groupTable);
    for (var ki = 0; ki < keys.length; ki++) {
      rows.push(groupTable[keys[ki]]);
    }

    rows.sort(function(a, b) {
      if (b.points !== a.points) return b.points - a.points;
      var gdA = a.goalsFor - a.goalsAgainst;
      var gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });

    for (var ri = 0; ri < rows.length; ri++) {
      rows[ri].position = ri + 1;
      rows[ri].goalDiff = rows[ri].goalsFor - rows[ri].goalsAgainst;
    }

    standings[g] = rows;
  }

  return standings;
}

function renderStandings() {
  var container = document.getElementById('standingsContainer');
  if (!container || !matchesData) return;

  var standings = calculateGroupStandings();
  var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  var html = '';

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];
    var rows = standings[g] || [];

    html += '<div class="standing-group">';
    html += '<div class="standing-group-header">';
    html += '<span class="standing-group-letter">Grupo ' + g + '</span>';
    html += '<div class="standing-group-flags">';
    for (var fi = 0; fi < matchesData.groups[g].length; fi++) {
      html += getFlagImg(matchesData.groups[g][fi], 20);
    }
    html += '</div></div>';

    html += '<div class="standing-table">';
    html += '<div class="standing-row standing-header">';
    html += '<div class="standing-col standing-pos">#</div>';
    html += '<div class="standing-col standing-team">Equipo</div>';
    html += '<div class="standing-col standing-stat">PJ</div>';
    html += '<div class="standing-col standing-stat">PG</div>';
    html += '<div class="standing-col standing-stat">PE</div>';
    html += '<div class="standing-col standing-stat">PP</div>';
    html += '<div class="standing-col standing-stat">GF</div>';
    html += '<div class="standing-col standing-stat">GC</div>';
    html += '<div class="standing-col standing-stat standing-dg">DG</div>';
    html += '<div class="standing-col standing-stat standing-pts">Pts</div>';
    html += '</div>';

    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      var posClass = '';
      if (row.position <= 2) posClass = 'standing-qualified';

      html += '<div class="standing-row ' + posClass + '">';
      html += '<div class="standing-col standing-pos">' + row.position + '</div>';
      html += '<div class="standing-col standing-team">';
      html += getFlagImg(row.code, 20) + ' ';
      html += '<span>' + row.name + '</span>';
      html += '</div>';
      html += '<div class="standing-col standing-stat">' + row.played + '</div>';
      html += '<div class="standing-col standing-stat">' + row.won + '</div>';
      html += '<div class="standing-col standing-stat">' + row.drawn + '</div>';
      html += '<div class="standing-col standing-stat">' + row.lost + '</div>';
      html += '<div class="standing-col standing-stat">' + row.goalsFor + '</div>';
      html += '<div class="standing-col standing-stat">' + row.goalsAgainst + '</div>';
      html += '<div class="standing-col standing-stat standing-dg">' + (row.goalDiff >= 0 ? '+' : '') + row.goalDiff + '</div>';
      html += '<div class="standing-col standing-stat standing-pts">' + row.points + '</div>';
      html += '</div>';
    }

    html += '</div></div>';
  }

  container.innerHTML = html;
}
