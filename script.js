/* Minimal, ASCII-only router for VURIX manual (GitHub Pages) */
(function () {
  'use strict';

  var iframe = document.getElementById('contentFrame');
  var menuButtons = Array.prototype.slice.call(document.querySelectorAll('.menu-item'));
  var DEFAULT_ROUTE = './pages/start.html';

  function normalizeHash(h) {
    if (!h) return DEFAULT_ROUTE;
    h = (h[0] === '#') ? h.slice(1) : h;
    h = h.trim();
    if (!/^(\.\/)?pages\//.test(h)) {
      if (h[0] !== '.') h = './' + h;
      h = h.replace(/^\.\//, './pages/');
    }
    // avoid "./pages/pages/"
    h = h.replace(/\.\.\/+/g, '../');
    h = h.replace(/\.\/pages\/pages\//g, './pages/');
    return h;
  }

  function setActive(btn) {
    menuButtons.forEach(function (b) {
      var on = (b === btn);
      b.classList.toggle('active', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
  }

  function loadRoute(route, btn) {
    var n = normalizeHash(route);
    iframe.src = n;
    if (btn) setActive(btn);
    if (location.hash !== '#' + n) location.hash = '#' + n;
  }

  function onHashChange() {
    var n = normalizeHash(location.hash);
    // match menu button
    var target = null;
    for (var i = 0; i < menuButtons.length; i++) {
      if (menuButtons[i].dataset.src === n) { target = menuButtons[i]; break; }
    }
    if (target) setActive(target);
    iframe.src = n;
  }

  function onMenuClick(e) {
    var btn = e.currentTarget;
    var route = btn.dataset.src;
    loadRoute(route, btn);
  }

  // wire events
  menuButtons.forEach(function (btn) {
    btn.addEventListener('click', onMenuClick);
  });
  window.addEventListener('hashchange', onHashChange);

  // first load
  document.addEventListener('DOMContentLoaded', function () {
    onHashChange();
  });
})();