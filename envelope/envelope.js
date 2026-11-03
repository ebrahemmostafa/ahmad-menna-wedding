// Envelope intro overlay + background music (ported from new_prem3)
(function () {
  var root = document.getElementById("envelope-intro");
  var video = root.querySelector("video");
  var hint = root.querySelector(".envelope-intro__hint");
  var fade = root.querySelector(".envelope-intro__fade");
  var audio = document.getElementById("envelope-music");
  var muteBtn = document.getElementById("envelope-mute");
  var state = "idle";
  var muted = false;

  var ICON_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/></svg>';
  var ICON_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>';

  function setState(next) {
    root.classList.remove("is-" + state);
    state = next;
    root.classList.add("is-" + state);
    if (state === "loading") hint.textContent = "Loading…";
    if (state === "idle") hint.textContent = "Tap to open";
  }

  function playMusic() {
    if (!audio.paused) return;
    audio.volume = 0;
    audio
      .play()
      .then(function () {
        var v = 0;
        var t = setInterval(function () {
          v += 0.017;
          if (v >= 0.5) {
            audio.volume = 0.5;
            clearInterval(t);
          } else {
            audio.volume = v;
          }
        }, 100);
      })
      .catch(function () {});
  }

  document.documentElement.classList.add("envelope-open-lock");
  video.preload = "auto";
  video.load();

  root.addEventListener("click", function () {
    if (state !== "idle") return;
    playMusic();
    setState("loading");
    video
      .play()
      .then(function () {
        setState("playing");
      })
      .catch(function () {
        setState("idle");
      });
  });
  video.addEventListener("playing", function () {
    setState("playing");
  });
  video.addEventListener("error", function () {
    setState("idle");
  });
  video.addEventListener("ended", function () {
    setState("fading");
  });
  fade.addEventListener("transitionend", function () {
    if (state !== "fading") return;
    root.remove();
    document.documentElement.classList.remove("envelope-open-lock");
  });

  muteBtn.innerHTML = ICON_ON;
  muteBtn.addEventListener("click", function () {
    muted = !muted;
    audio.muted = muted;
    muteBtn.innerHTML = muted ? ICON_OFF : ICON_ON;
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) audio.pause();
    else if (!muted && state !== "idle") audio.play().catch(function () {});
  });
})();
