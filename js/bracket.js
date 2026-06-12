// MundialPibes26 - Cuadro de eliminatorias (Bracket)

var bracketResolved = {};

function resolveBracketTeam(match, roundIndex) {
  if (!match) return null;

  var homeCode = match.home;
  var awayCode = match.away;

  var isHomePlaceholder = homeCode.length > 3 || !FLAG_ISO[homeCode];
  var isAwayPlaceholder = awayCode.length > 3 || !FLAG_ISO[awayCode];

  var result = getResult(match.id);
  var winner = null;
  var loser = null;

  if (result && result.status === 'finished') {
    var hg = parseInt(result.home_score) || 0;
    var ag = parseInt(result.away_score) || 0;
    if (hg > ag) {
      winner = homeCode;
      loser = awayCode;
    } else if (ag > hg) {
      winner = awayCode;
      loser = homeCode;
    } else {
      winner = homeCode;
      loser = awayCode;
    }
  }

  return {
    home: homeCode,
    away: awayCode,
    homeName: getTeamShortName(homeCode),
    awayName: getTeamShortName(awayCode),
    homeFlag: getFlagImg(homeCode, 22),
    awayFlag: getFlagImg(awayCode, 22),
    homeIsPlaceholder: isHomePlaceholder,
    awayIsPlaceholder: isAwayPlaceholder,
    result: result,
    winner: winner,
    loser: loser,
    homeScore: result ? result.home_score : null,
    awayScore: result ? result.away_score : null
  };
}

function getTeamNameForBracket(code) {
  if (!code) return 'TBD';
  if (code.length > 3) return code;
  return getTeamShortName(code) || code;
}

function renderBracketNode(team, score, isWinner) {
  var name = getTeamNameForBracket(team);
  var flag = getFlagImg(team, 22);
  var isPlaceholder = team.length > 3 || !FLAG_ISO[team];
  var scoreDisplay = score !== null && score !== undefined ? score : '';
  var cls = 'bracket-team';
  if (isWinner) cls += ' bracket-winner';
  if (isPlaceholder) cls += ' bracket-placeholder';

  return '<div class="' + cls + '">' +
    '<span class="bracket-flag">' + flag + '</span>' +
    '<span class="bracket-name">' + name + '</span>' +
    '<span class="bracket-score">' + scoreDisplay + '</span>' +
    '</div>';
}

function renderBracket() {
  var container = document.getElementById('bracketContainer');
  if (!container || !matchesData) return;

  var rounds = [
    { key: 'r32', label: 'Ronda de 32', matches: [] },
    { key: 'r16', label: 'Octavos', matches: [] },
    { key: 'qf', label: 'Cuartos', matches: [] },
    { key: 'sf', label: 'Semifinal', matches: [] },
    { key: 'final', label: 'Final', matches: [] }
  ];

  var thirdMatch = null;

  for (var i = 0; i < matchesData.matches.length; i++) {
    var m = matchesData.matches[i];
    if (m.stage === 'r32') rounds[0].matches.push(m);
    else if (m.stage === 'r16') rounds[1].matches.push(m);
    else if (m.stage === 'qf') rounds[2].matches.push(m);
    else if (m.stage === 'sf') rounds[3].matches.push(m);
    else if (m.stage === 'final') rounds[4].matches.push(m);
    else if (m.stage === 'third') thirdMatch = m;
  }

  var html = '';

  html += '<div class="bracket-scroll">';
  html += '<div class="bracket-grid">';

  for (var ri = 0; ri < rounds.length; ri++) {
    var round = rounds[ri];
    html += '<div class="bracket-round">';
    html += '<div class="bracket-round-title">' + round.label + '</div>';
    html += '<div class="bracket-matches">';

    for (var mi = 0; mi < round.matches.length; mi++) {
      var match = round.matches[mi];
      var node = resolveBracketTeam(match, ri);

      var homeWin = node.winner === node.home;
      var awayWin = node.winner === node.away;

      var homeWinClass = homeWin ? 'bracket-winner' : '';
      var awayWinClass = awayWin ? 'bracket-winner' : '';

      var homeName = getTeamNameForBracket(node.home);
      var awayName = getTeamNameForBracket(node.away);
      var homeFlag = getFlagImg(node.home, 20);
      var awayFlag = getFlagImg(node.away, 20);
      var homeScore = node.homeScore !== null ? node.homeScore : '';
      var awayScore = node.awayScore !== null ? node.awayScore : '';

      var isHomePlaceholder = node.home.length > 3 || !FLAG_ISO[node.home];
      var isAwayPlaceholder = node.away.length > 3 || !FLAG_ISO[node.away];

      html += '<div class="bracket-node">';
      html += '<div class="bracket-team-row ' + homeWinClass + '">';
      html += '<span class="bracket-flag">' + homeFlag + '</span>';
      html += '<span class="bracket-name">' + homeName + '</span>';
      html += '<span class="bracket-score-val">' + homeScore + '</span>';
      html += '</div>';
      html += '<div class="bracket-team-row ' + awayWinClass + '">';
      html += '<span class="bracket-flag">' + awayFlag + '</span>';
      html += '<span class="bracket-name">' + awayName + '</span>';
      html += '<span class="bracket-score-val">' + awayScore + '</span>';
      html += '</div>';
      html += '</div>';
    }

    html += '</div></div>';
  }

  html += '</div></div>';

  if (thirdMatch) {
    var thirdNode = resolveBracketTeam(thirdMatch, 0);
    var thirdHomeWin = thirdNode.winner === thirdNode.home;
    var thirdAwayWin = thirdNode.winner === thirdNode.away;

    html += '<div class="bracket-third">';
    html += '<div class="bracket-third-title">Tercer Puesto</div>';
    html += '<div class="bracket-node bracket-node-third">';
    html += '<div class="bracket-team-row ' + (thirdHomeWin ? 'bracket-winner' : '') + '">';
    html += '<span class="bracket-flag">' + getFlagImg(thirdNode.home, 20) + '</span>';
    html += '<span class="bracket-name">' + getTeamNameForBracket(thirdNode.home) + '</span>';
    html += '<span class="bracket-score-val">' + (thirdNode.homeScore !== null ? thirdNode.homeScore : '') + '</span>';
    html += '</div>';
    html += '<div class="bracket-team-row ' + (thirdAwayWin ? 'bracket-winner' : '') + '">';
    html += '<span class="bracket-flag">' + getFlagImg(thirdNode.away, 20) + '</span>';
    html += '<span class="bracket-name">' + getTeamNameForBracket(thirdNode.away) + '</span>';
    html += '<span class="bracket-score-val">' + (thirdNode.awayScore !== null ? thirdNode.awayScore : '') + '</span>';
    html += '</div>';
    html += '</div></div>';
  }

  container.innerHTML = html;
}
