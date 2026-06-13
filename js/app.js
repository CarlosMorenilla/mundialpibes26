// MundialPibes26 - App principal

var currentSection = 'matches';
var currentStageFilter = 'all';
var currentGroupFilter = 'all';
var allLoaded = false;

function initApp() {
  var isTest = window.location.search.indexOf('test') !== -1;

  if (isTest) {
    currentUser = { id: 'test-user', user_metadata: { full_name: 'Test User' }, email: 'test@test.com' };
    loadMatches().then(function() {
      loadSavedResults();
      renderCurrentSection();
      startScorePolling();
      allLoaded = true;
    });
    return;
  }

  initAuth().then(function(hasSession) {
    if (!hasSession) {
      window.location.href = '/index.html';
      return;
    }

    updateUIForUser(currentUser);

    loadMatches().then(function() {
      loadSavedResults();
      loadPredictions().then(function() {
        renderCurrentSection();
        startScorePolling();
        loadLeaderboard();
        loadMyTopScorer();
        allLoaded = true;
      });
    });
  });
}

function switchSection(section) {
  currentSection = section;

  var tabs = document.querySelectorAll('.nav-tab');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute('data-section') === section) {
      tabs[i].classList.add('active');
    } else {
      tabs[i].classList.remove('active');
    }
  }

  var secs = document.querySelectorAll('.section');
  for (var j = 0; j < secs.length; j++) {
    if (secs[j].id === 'section-' + section) {
      secs[j].classList.add('active');
    } else {
      secs[j].classList.remove('active');
    }
  }

  renderCurrentSection();
}

function renderCurrentSection() {
  if (currentSection === 'matches') {
    renderMatches();
  } else if (currentSection === 'bracket') {
    renderBracket();
  } else if (currentSection === 'standings') {
    renderStandings();
  } else if (currentSection === 'topscorer') {
    renderTopScorer();
  } else if (currentSection === 'leaderboard') {
    renderLeaderboard('leaderboardContainer');
  }
}

function renderMatches() {
  var container = document.getElementById('matchesContainer');
  if (!container || !matchesData) return;

  var matches = matchesData.matches;

  // Filtro por stage
  if (currentStageFilter !== 'all') {
    matches = matches.filter(function(m) { return m.stage === currentStageFilter; });
  }

  // Filtro por grupo (solo aplica si stage es group o all)
  if (currentGroupFilter !== 'all') {
    if (currentStageFilter === 'all' || currentStageFilter === 'group') {
      matches = matches.filter(function(m) { return m.group === currentGroupFilter; });
    }
  }

  // Filtro eliminacion rapida
  if (currentStageFilter === 'all' && currentGroupFilter === 'knockout') {
    matches = matchesData.matches.filter(function(m) { return m.stage !== 'group'; });
  }

  // Agrupar por fecha
  var grouped = {};
  matches.forEach(function(match) {
    var dateKey = match.date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(match);
  });

  var html = '';

  // Filtro de fase
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
    html += '<button class="stage-filter-btn ' + (currentStageFilter === s.key ? 'active' : '') + '" onclick="filterStage(\'' + s.key + '\')">' + s.label + '</button>';
  }
  html += '</div>';

  // Filtro de grupo (solo visible cuando stage es group o all)
  if (currentStageFilter === 'group' || currentStageFilter === 'all') {
    html += '<div class="group-filter">';
    html += '<button class="group-filter-btn ' + (currentGroupFilter === 'all' ? 'active' : '') + '" onclick="filterGroup(\'all\')">Todos</button>';

    var groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    groups.forEach(function(g) {
      html += '<button class="group-filter-btn ' + (currentGroupFilter === g ? 'active' : '') + '" onclick="filterGroup(\'' + g + '\')">' + g + '</button>';
    });

    if (currentStageFilter === 'all') {
      html += '<button class="group-filter-btn ' + (currentGroupFilter === 'knockout' ? 'active' : '') + '" onclick="filterGroup(\'knockout\')">Elim.</button>';
    }

    html += '</div>';
  }

  // Renderizar partidos por fecha
  var sortedDates = Object.keys(grouped).sort();

  if (sortedDates.length === 0) {
    html += '<div class="empty-state"><div class="empty-state-icon">⚽</div><div class="empty-state-text">No hay partidos en esta vista</div></div>';
  }

  sortedDates.forEach(function(date) {
    var dateObj = new Date(date + 'T12:00:00+01:00');
    var dateLabel = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
    html += '<div class="day-header">' + dateLabel + '</div>';

    grouped[date].forEach(function(match) {
      var result = getResult(match.id);
      var prediction = getUserPrediction(match.id);
      html += renderMatchCard(match, result, prediction);
    });
  });

  container.innerHTML = html;
}

function filterStage(stage) {
  currentStageFilter = stage;
  if (stage !== 'group' && stage !== 'all') {
    currentGroupFilter = 'all';
  }
  renderMatches();
}

function filterGroup(group) {
  currentGroupFilter = group;
  if (group === 'knockout') {
    currentStageFilter = 'all';
  }
  renderMatches();
}

function showToast(message, type) {
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initApp);
