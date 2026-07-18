(function() {
  try {
    var saved = localStorage.getItem('nexporta-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}
})();
