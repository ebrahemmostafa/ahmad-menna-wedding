// Gently auto-scroll the page after 4 seconds without the guest scrolling.
// Any touch, wheel, key or click pauses it; it resumes after another 4 idle seconds.
(function () {
  var IDLE_MS = 4000;
  var SPEED = 45; // pixels per second
  var idleTimer = null;
  var frame = null;
  var last = 0;
  var pos = 0;
  var ready = false;

  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }

  function typing() {
    var el = document.activeElement;
    return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  }

  function step(now) {
    if (atBottom()) return stop();
    pos += (SPEED * (now - last)) / 1000;
    last = now;
    window.scrollTo(0, Math.round(pos));
    frame = requestAnimationFrame(step);
  }

  function start() {
    if (frame || typing() || atBottom()) return;
    pos = window.scrollY;
    last = performance.now();
    frame = requestAnimationFrame(step);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  function wait() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(start, IDLE_MS);
  }

  function onUserInput() {
    if (!ready) return;
    stop();
    wait();
  }

  ["wheel", "touchstart", "pointerdown", "keydown", "focusin"].forEach(function (type) {
    window.addEventListener(type, onUserInput, { passive: true });
  });

  function begin() {
    if (ready) return;
    ready = true;
    wait();
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Start counting once the envelope intro has been opened and removed.
  var check = setInterval(function () {
    if (document.getElementById("envelope-intro")) return;
    clearInterval(check);
    begin();
  }, 250);
})();
