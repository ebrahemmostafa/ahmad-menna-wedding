// RSVP form: attending toggle, companions list, and submit to Supabase.
(function () {
  var form = document.getElementById("rsvp-form");
  if (!form) return;
  var cfg = window.RSVP_SUPABASE;
  var list = document.getElementById("rsvp-companions");
  var companionsBlock = document.getElementById("rsvp-companions-block");
  var status = document.getElementById("rsvp-status");
  var submit = document.getElementById("rsvp-submit");
  var radios = form.querySelectorAll('input[name="attending"]');

  // Radio visuals: the styled circle is the first span inside each label.
  function paintRadios() {
    radios.forEach(function (r) {
      var ring = r.parentNode.querySelector("span");
      ring.innerHTML = r.checked ? '<span class="h-2.5 w-2.5 rounded-full bg-olive"></span>' : "";
      ring.classList.toggle("border-olive", r.checked);
      ring.classList.toggle("border-muted-foreground/50", !r.checked);
    });
    companionsBlock.style.display = attending() ? "" : "none";
  }

  function attending() {
    return form.querySelector('input[name="attending"]:checked').value === "yes";
  }

  radios.forEach(function (r) {
    r.addEventListener("change", paintRadios);
  });

  function addCompanion(type) {
    var row = document.createElement("div");
    row.className = "rsvp-companion";
    row.dataset.type = type;

    var tag = document.createElement("span");
    tag.className = "rsvp-companion__tag";
    tag.textContent = type === "child" ? "Child" : "Adult";

    var input = document.createElement("input");
    input.className =
      "w-full rounded-md border border-input bg-card/60 px-4 py-3 text-base text-foreground outline-none transition focus:border-olive";
    input.placeholder = type === "child" ? "Child's name" : "Full name";
    input.maxLength = 120;

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "rsvp-companion__remove";
    remove.setAttribute("aria-label", "Remove");
    remove.textContent = "×";
    remove.addEventListener("click", function () {
      row.remove();
    });

    row.append(tag, input, remove);
    list.appendChild(row);
    input.focus();
  }

  form.querySelectorAll("[data-add-companion]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (list.children.length >= 20) return;
      addCompanion(btn.dataset.addCompanion);
    });
  });

  function setStatus(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fullname").value.trim();
    if (!name) {
      setStatus("Please enter your full name.", "error");
      document.getElementById("fullname").focus();
      return;
    }

    var yes = attending();
    var companions = [];
    if (yes) {
      list.querySelectorAll(".rsvp-companion").forEach(function (row) {
        var n = row.querySelector("input").value.trim();
        if (n) companions.push({ type: row.dataset.type, name: n });
      });
    }

    var body = {
      attending: yes,
      full_name: name,
      companions: companions,
      song: document.getElementById("song").value.trim() || null,
      message: document.getElementById("message").value.trim() || null,
    };

    submit.disabled = true;
    setStatus("Sending…");
    fetch(cfg.url + "/rest/v1/rsvps", {
      method: "POST",
      headers: { apikey: cfg.key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        list.innerHTML = "";
        paintRadios();
        setStatus(
          yes ? "Thank you! We can't wait to celebrate with you." : "Thank you for letting us know. You'll be missed!",
          "ok"
        );
      })
      .catch(function () {
        setStatus("Sorry, something went wrong. Please try again.", "error");
      })
      .then(function () {
        submit.disabled = false;
      });
  });

  paintRadios();
})();
