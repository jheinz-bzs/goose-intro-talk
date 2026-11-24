(function () {
  var FLAG = 'canvas-presenter:reloaded';

  function fail(message) {
    var boot = document.getElementById('boot');
    if (boot) boot.textContent = message;
  }

  // A module that fails mid-optimization (dev 504) leaves the page blank; one reload fixes it.
  function reloadOnce(reason) {
    if (sessionStorage.getItem(FLAG)) return fail('Failed to load: ' + reason);
    sessionStorage.setItem(FLAG, '1');
    location.reload();
  }

  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target.tagName === 'SCRIPT') reloadOnce(target.src);
    else fail('Error: ' + (event.message || 'unknown'));
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    fail('Error: ' + (event.reason && event.reason.message ? event.reason.message : event.reason));
  });
  window.addEventListener('vite:preloadError', function () {
    reloadOnce('preload');
  });

  window.canvasPresenterBoot = {
    fail: fail,
    ready: function () {
      sessionStorage.removeItem(FLAG);
      var boot = document.getElementById('boot');
      if (boot) boot.remove();
    },
  };
})();
