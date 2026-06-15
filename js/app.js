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
      startScorePolling();
      loadAllPlayers().then(function() {
        loadScorersFromAPI().then(function() {
          loadMyTopScorer().then(function() {
            allLoaded = true;
            renderCurrentSection();
          });
        });
      });
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
        startScorePolling();
        loadLeaderboard();
        loadAllPlayers().then(function() {
          loadScorersFromAPI().then(function() {
            loadMyTopScorer().then(function() {
              allLoaded = true;
              renderCurrentSection();
            });
          });
        });
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
      tabs[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToSection(section) {
  if (section === currentSection) return;
  slideToSection(section);
}

function renderCurrentSection() {
  if (currentSection === 'matches') {
    renderMatches();
  } else if (currentSection === 'predictions') {
    renderPredictionsView();
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

// Swipe gestures - real-time sliding
var swipeStartX = 0;
var swipeStartY = 0;
var swipeDeltaX = 0;
var swipeDragging = false;
var swipeLocked = false;
var tabOrder = ['matches', 'predictions', 'leaderboard', 'standings', 'bracket', 'topscorer'];

function getSectionIndex(section) {
  for (var i = 0; i < tabOrder.length; i++) {
    if (tabOrder[i] === section) return i;
  }
  return -1;
}

function getSlider() {
  return document.getElementById('sectionsSlider');
}

function setSliderOffset(offsetPx) {
  var slider = getSlider();
  if (!slider) return;
  var sections = slider.querySelectorAll('.section');
  var idx = getSectionIndex(currentSection);
  for (var i = 0; i < sections.length; i++) {
    var diff = i - idx;
    sections[i].style.transform = 'translateX(' + (offsetPx + diff * 100) + '%)';
  }
}

document.addEventListener('touchstart', function(e) {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
  swipeDeltaX = 0;
  swipeDragging = false;
  swipeLocked = false;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  var dx = e.touches[0].clientX - swipeStartX;
  var dy = e.touches[0].clientY - swipeStartY;

  if (!swipeLocked && !swipeDragging) {
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipeLocked = true;
      swipeDragging = true;
      var slider = getSlider();
      if (slider) slider.classList.add('sliding');
    } else if (Math.abs(dy) > 8) {
      swipeLocked = false;
      return;
    }
  }

  if (!swipeDragging) return;

  swipeDeltaX = dx;
  var pct = (dx / window.innerWidth) * 100;
  var idx = getSectionIndex(currentSection);
  if ((idx === 0 && dx > 0) || (idx === tabOrder.length - 1 && dx < 0)) {
    pct = pct * 0.3;
  }
  setSliderOffset(pct);
}, { passive: true });

document.addEventListener('touchend', function() {
  if (!swipeDragging) return;
  swipeDragging = false;

  var slider = getSlider();
  if (slider) slider.classList.remove('sliding');

  var idx = getSectionIndex(currentSection);
  var pct = (swipeDeltaX / window.innerWidth) * 100;

  if (pct < -15 && idx < tabOrder.length - 1) {
    slideToSection(tabOrder[idx + 1]);
  } else if (pct > 15 && idx > 0) {
    slideToSection(tabOrder[idx - 1]);
  } else {
    slideToSection(currentSection);
  }
}, { passive: true });

function slideToSection(section) {
  var slider = getSlider();
  if (!slider) { switchSection(section); return; }

  var targetIdx = getSectionIndex(section);
  var currentIdx = getSectionIndex(currentSection);
  var diff = targetIdx - currentIdx;

  if (diff === 0) {
    setSliderOffset(0);
    return;
  }

  slider.classList.add('animating');
  var sections = slider.querySelectorAll('.section');
  for (var i = 0; i < sections.length; i++) {
    var sdiff = i - currentIdx;
    sections[i].style.transform = 'translateX(' + ((diff - sdiff) * -100 + (diff * 100)) + '%)';
  }
  setSliderOffset(-diff * 100);

  setTimeout(function() {
    slider.classList.remove('animating', 'sliding');
    var allSections = slider.querySelectorAll('.section');
    for (var j = 0; j < allSections.length; j++) {
      allSections[j].style.transform = '';
      allSections[j].style.position = '';
    }
    switchSection(section);
  }, 260);
}
