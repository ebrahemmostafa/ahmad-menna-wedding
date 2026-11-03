// Live countdown to Friday, December 4, 2026 at 7:00 PM Cairo time (UTC+2)
(function () {
  var target = new Date("2026-12-04T19:00:00+02:00").getTime();
  var els = {};
  ["days", "hours", "minutes", "seconds"].forEach(function (k) {
    els[k] = document.querySelector('[data-countdown="' + k + '"]');
  });

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function tick() {
    var diff = Math.max(0, target - Date.now());
    var s = Math.floor(diff / 1000);
    els.days.textContent = Math.floor(s / 86400);
    els.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    els.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    els.seconds.textContent = pad(s % 60);
  }

  tick();
  setInterval(tick, 1000);
})();
