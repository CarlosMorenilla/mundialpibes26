// MundialPibes26 - Autenticacion con Supabase + Google

var currentUser = null;

function initAuth() {
  if (!supabase) return Promise.resolve(false);

  var hasHashTokens = window.location.hash && window.location.hash.indexOf('access_token') !== -1;

  var checkSession = function() {
    return supabase.auth.getSession().then(function(result) {
      if (result.data.session && result.data.session.user) {
        currentUser = result.data.session.user;
        return true;
      }
      return false;
    }).catch(function() {
      return false;
    });
  };

  if (hasHashTokens) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        checkSession().then(function(ok) {
          if (ok) {
            window.location.hash = '';
            window.history.replaceState(null, '', window.location.pathname);
          }
          resolve(ok);
        });
      }, 1500);
    });
  }

  return checkSession();
}

function signOut() {
  localStorage.clear();
  currentUser = null;
  if (supabase && supabase.auth) {
    supabase.auth.signOut().then(function() {
      window.location.href = '/index.html';
    }).catch(function() {
      window.location.href = '/index.html';
    });
  } else {
    window.location.href = '/index.html';
  }
}

function updateUIForUser(user) {
  var avatarEl = document.getElementById('userAvatar');
  var nameEl = document.getElementById('userName');

  if (user && nameEl) {
    var name = user.user_metadata && user.user_metadata.full_name
      ? user.user_metadata.full_name
      : (user.email || 'Jugador');
    nameEl.textContent = name;

    if (avatarEl) {
      var photo = user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture);
      if (photo) {
        avatarEl.src = photo;
        avatarEl.style.display = 'block';
      }
    }
  }
}

function requireAuth() {
  if (!currentUser) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}
