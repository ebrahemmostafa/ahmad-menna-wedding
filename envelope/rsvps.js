// Passcode-protected list of RSVPs. The passcode is checked inside Supabase (get_rsvps function);
// it is kept only in this tab's sessionStorage so a refresh doesn't ask again.
(function () {
  var cfg = window.RSVP_SUPABASE;
  var KEY = "rsvps-passcode";
  var gate = document.getElementById("gate");
  var input = document.getElementById("passcode");
  var gateError = document.getElementById("gate-error");
  var board = document.getElementById("board");
  var list = document.getElementById("list");
  var search = document.getElementById("search");
  var boardStatus = document.getElementById("board-status");
  var rows = [];
  var passcode = null;

  function load(code) {
    return fetch(cfg.url + "/rest/v1/rpc/get_rsvps", {
      method: "POST",
      headers: { apikey: cfg.key, "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    }).then(function (res) {
      if (res.ok) return res.json();
      return res.json().then(function (err) {
        var e = new Error(err.message || "HTTP " + res.status);
        e.badPasscode = err.code === "28P01";
        throw e;
      });
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Cairo",
    });
  }

  function guestsFor(r) {
    return r.attending ? 1 + (r.companions || []).length : 0;
  }

  function render() {
    var q = search.value.trim().toLowerCase();
    var yes = rows.filter(function (r) {
      return r.attending;
    });
    document.getElementById("stat-responses").textContent = rows.length;
    document.getElementById("stat-yes").textContent = yes.length;
    document.getElementById("stat-no").textContent = rows.length - yes.length;
    document.getElementById("stat-guests").textContent = rows.reduce(function (n, r) {
      return n + guestsFor(r);
    }, 0);

    list.textContent = "";
    var shown = rows.filter(function (r) {
      if (!q) return true;
      var names = [r.full_name].concat((r.companions || []).map(function (c) {
        return c.name;
      }));
      return names.join(" ").toLowerCase().indexOf(q) !== -1;
    });
    boardStatus.textContent = rows.length ? "" : "No responses yet.";
    if (rows.length && !shown.length) boardStatus.textContent = "No matches.";

    shown.forEach(function (r) {
      var card = el("article", "card");
      var head = el("div", "card__head");
      head.append(el("h2", "card__name", r.full_name));
      head.append(el("span", "badge " + (r.attending ? "badge--yes" : "badge--no"), r.attending ? "Attending" : "Declined"));
      card.append(head);
      card.append(el("p", "card__meta", fmtDate(r.created_at) + (r.attending ? " · " + guestsFor(r) + " guest(s)" : "")));

      if ((r.companions || []).length) {
        var ul = el("ul", "card__companions");
        r.companions.forEach(function (c) {
          ul.append(el("li", null, c.name + (c.type === "child" ? " (child)" : "")));
        });
        card.append(ul);
      }
      if (r.song) card.append(el("p", "card__line", "♫ " + r.song));
      if (r.message) card.append(el("p", "card__message", r.message));
      list.append(card);
    });
  }

  function refresh() {
    boardStatus.textContent = "Loading…";
    return load(passcode)
      .then(function (data) {
        rows = data;
        render();
      })
      .catch(function () {
        boardStatus.textContent = "Couldn't load responses. Try Refresh.";
      });
  }

  function open(code) {
    gateError.textContent = "";
    return load(code)
      .then(function (data) {
        passcode = code;
        try {
          sessionStorage.setItem(KEY, code);
        } catch (e) {}
        rows = data;
        gate.hidden = true;
        board.hidden = false;
        render();
      })
      .catch(function (e) {
        try {
          sessionStorage.removeItem(KEY);
        } catch (err) {}
        gateError.textContent = e.badPasscode ? "Wrong passcode." : "Couldn't connect. Please try again.";
      });
  }

  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  document.getElementById("csv").addEventListener("click", function () {
    var lines = [["Submitted", "Name", "Attending", "Guests", "Companions", "Song", "Message"]];
    rows.forEach(function (r) {
      lines.push([
        r.created_at,
        r.full_name,
        r.attending ? "Yes" : "No",
        guestsFor(r),
        (r.companions || []).map(function (c) {
          return c.name + (c.type === "child" ? " (child)" : "");
        }).join("; "),
        r.song,
        r.message,
      ]);
    });
    var csv = "﻿" + lines.map(function (l) {
      return l.map(csvCell).join(",");
    }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "ahmad-menna-rsvps.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  gate.addEventListener("submit", function (e) {
    e.preventDefault();
    var code = input.value.trim();
    if (code) open(code);
  });
  search.addEventListener("input", render);
  document.getElementById("refresh").addEventListener("click", refresh);

  var saved = null;
  try {
    saved = sessionStorage.getItem(KEY);
  } catch (e) {}
  if (saved) open(saved);
  else input.focus();
})();
