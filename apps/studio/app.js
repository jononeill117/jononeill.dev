/* Muse Character Studio. Gallery, prompt copy, share links. No dependencies. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Data                                                               */
  /* ------------------------------------------------------------------ */

  var CHARACTERS = [
    { id: "master-chief",   name: "Master Chief",   theme: "Halo",                 file: "gallery/master-chief.webp" },
    { id: "iron-man",       name: "Iron Man",       theme: "Marvel",               file: "gallery/iron-man.webp" },
    { id: "mario",          name: "Mario",          theme: "Super Mario",          file: "gallery/mario.webp" },
    { id: "pikachu",        name: "Pikachu",        theme: "Pokemon",              file: "gallery/pikachu.webp" },
    { id: "goku",           name: "Goku",           theme: "Dragon Ball",          file: "gallery/goku.webp" },
    { id: "captain-america",name: "Captain America",theme: "Marvel",               file: "gallery/captain-america.webp" },
    { id: "thor",           name: "Thor",           theme: "Marvel",               file: "gallery/thor.webp" },
    { id: "link",           name: "Link",           theme: "The Legend of Zelda",  file: "gallery/link.webp" },
    { id: "stitch",         name: "Stitch",         theme: "Lilo and Stitch",      file: "gallery/stitch.webp" },
    { id: "stormtrooper",   name: "Stormtrooper",   theme: "Star Wars",            file: "gallery/stormtrooper.webp" },
    { id: "totoro",         name: "Totoro",         theme: "My Neighbor Totoro",   file: "gallery/totoro.webp" },
    { id: "dwight-schrute", name: "Dwight Schrute", theme: "The Office",           file: "gallery/dwight-schrute.webp" },
    { id: "woody",          name: "Woody",          theme: "Toy Story",            file: "gallery/woody.webp" }
  ];

  var SHORT_PROMPT =
    "Attach your Muse reference photo, then send this text:\n" +
    "\n" +
    "Using the attached photo as the exact base character (a small egg-shaped cream and ivory fuzzy blob, short even plush fuzz, smooth matte cream oval face patch, two small round solid-black dot eyes, one small thin curved smile, soft pink oval blush on each cheek, stubby fuzzy arms and feet, no nose), render this exact character dressed as [THEME] in a FULL BODY shot, the whole body from head to feet in frame with breathing room, slight tilt. Keep the face patch, eyes, smile, blush, fuzz, body shape, and proportions exactly as the photo. Never cover the eyes or the smile. Add only the theme's 2 to 3 most recognizable features and signature colors, simplified to bold shapes, with cream fuzz visible between them. Solid near-black charcoal background. Soft minimal shading. No text, no logos, no watermarks, no sparkles.";

  var FULL_PROMPT =
    "[GOAL]\n" +
    "\n" +
    "Reinterpret the attached Muse reference photo as the named theme, one full-body image. The result must read instantly as \"Muse dressed as [THEME].\"\n" +
    "\n" +
    "[REFERENCE PHOTO - ATTACH FIRST]\n" +
    "\n" +
    "Attach a clear photo of the Muse character before sending the prompt. Every body and face detail below is matched to that photo. If no photo is attached, ask the user to attach one instead of guessing.\n" +
    "\n" +
    "[THE BASE CHARACTER - NEVER CHANGE THESE]\n" +
    "\n" +
    "- Egg-shaped blob body, wider at the bottom, covered head to toe in short, even, cream and ivory plush fuzz. Handmade feel, like a well-made plush toy. Fuzz is subtle and uniform, never scraggly.\n" +
    "- Face: a smooth, flat, matte cream oval patch set into the fuzz, with the fuzz forming a soft rim around the whole oval.\n" +
    "- Eyes: exactly two small round solid-black dot eyes, equal size, on the upper half of the face patch. No pupils, iris, whites, lashes, lids, brows, highlights, or outlines.\n" +
    "- Mouth: one small thin curved smile line, a single shallow stroke centered below the eyes. Never open, never toothed, never frowning.\n" +
    "- Blush: one soft pink oval on each cheek, low saturation, softly blended edges.\n" +
    "- Limbs: two short stubby fuzzy arms at the sides, two short stubby fuzzy feet. Rounded, no fingers or toes.\n" +
    "- No nose.\n" +
    "\n" +
    "[THEME]\n" +
    "\n" +
    "Add only the theme's 2 to 3 most recognizable features: signature headwear, helmet, colors, or accessory shapes. Silhouette first, small details second. Simplify complex armor and costumes down to their boldest shapes. Apply the theme's signature colors to the simplified features, flat and soft. Do not copy the theme's realistic face, eyes, mouth, or proportions. The face is always Muse's. Do not invent features the theme does not have.\n" +
    "\n" +
    "[FACE DISCIPLINE]\n" +
    "\n" +
    "The face patch, eyes, smile, and blush keep their relative positions and proportions from the base character in every render. Both eyes and the smile stay fully visible, never covered by hair, hats, helmets, or accessories. If headwear or a helmet would cover the face, shrink or shift it so the full face patch shows. The face always wins over the costume. If a visor or glasses are core identifying features, keep them minimal and place them above or around the face patch, never over the eyes. Keep plenty of empty face area around the eyes and smile.\n" +
    "\n" +
    "[COMPOSITION]\n" +
    "\n" +
    "1:1 square canvas. FULL BODY: the camera is stood back so the whole character from head to feet fills the frame with small breathing room. Slight tilt or a playful pose is welcome. The stubby arms and feet stay visible. Avoid centered, symmetrical ID-photo framing.\n" +
    "\n" +
    "[BACKGROUND AND EXCLUSIONS]\n" +
    "\n" +
    "Solid near-black charcoal across the whole canvas. No objects, no patterns. Exclude: circular frames, badge borders, text, numbers, logos, watermarks, speech bubbles, sparkles, particles, light blooms, lens flares. Avoid: photorealism, 3D render look, oil-paint texture, rough sketch lines, heavy gloss, busy detail, dense decoration.\n" +
    "\n" +
    "[CONFLICT PRIORITY]\n" +
    "\n" +
    "When rules collide, follow this order.\n" +
    "1. Muse identity: cream fuzzy blob body, smooth face patch, two black dot eyes, small smile, pink blush, stubby limbs.\n" +
    "2. Face (eyes and smile) fully visible.\n" +
    "3. The theme's signature colors and 2 to 3 identifying features.\n" +
    "4. Everything else.\n" +
    "\n" +
    "If a helmet brim or hat would cover the eyes, shorten or shift it while keeping the recognizable shape. Never invent features the theme does not have.\n" +
    "\n" +
    "[FOLLOW-UP EDITS]\n" +
    "\n" +
    "Change only the requested part of the image. Keep the base character and every unmentioned feature unchanged. When the user asks to generate, reply with only the finished image and no explanation text. Share this written spec only when asked for it.";

  var HASHTAG = "#MuseCharacterStudio";
  var PAGE_URL = "https://musecharacters.jononeill.dev";

  /* ------------------------------------------------------------------ */
  /* Prompt rendering: plain text in, readable HTML out                 */
  /* ------------------------------------------------------------------ */

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderPrompt(text) {
    var lines = text.split("\n");
    var html = "";
    var inList = false;
    lines.forEach(function (line) {
      var t = line.trim();
      if (/^\[.+\]$/.test(t)) {
        if (inList) { html += "</ul>"; inList = false; }
        html += "<h4>" + escapeHtml(t.replace(/^\[|\]$/g, "")) + "</h4>";
      } else if (/^- /.test(t)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + escapeHtml(t.replace(/^- /, "")) + "</li>";
      } else if (t === "") {
        if (inList) { html += "</ul>"; inList = false; }
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += "<p>" + escapeHtml(t) + "</p>";
      }
    });
    if (inList) { html += "</ul>"; }
    return html;
  }

  /* ------------------------------------------------------------------ */
  /* Clipboard                                                          */
  /* ------------------------------------------------------------------ */

  function flashNote(noteEl, msg, ms) {
    if (!noteEl) return;
    noteEl.hidden = false;
    noteEl.textContent = msg;
    window.clearTimeout(noteEl._t);
    noteEl._t = window.setTimeout(function () {
      noteEl.hidden = true;
      noteEl.textContent = "";
    }, ms || 2600);
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      if (!btn._label) btn._label = btn.textContent;
      btn.textContent = "Copying...";
      btn.disabled = true;
    } else {
      btn.textContent = label || btn._label || "Copy";
      btn.disabled = false;
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, opts) {
    opts = opts || {};
    var btn = opts.button;
    var noteEl = opts.note;
    setBusy(btn, true);
    if (noteEl) { noteEl.hidden = false; noteEl.textContent = "Copying..."; }

    function done(ok) {
      if (ok) {
        setBusy(btn, false, "Copied!");
        flashNote(noteEl, "Copied to clipboard.");
        window.setTimeout(function () { setBusy(btn, false); }, 2000);
      } else {
        setBusy(btn, false);
        flashNote(noteEl, "Copy failed. Select the text in the box and copy it by hand.", 6000);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
    } else {
      done(fallbackCopy(text));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Gallery                                                            */
  /* ------------------------------------------------------------------ */

  var current = CHARACTERS[0];

  function shareUrl(character) {
    var text = "Muse as " + character.name + ". Make your own:";
    return "https://x.com/intent/post?text=" + encodeURIComponent(text) +
      "&url=" + encodeURIComponent(PAGE_URL);
  }

  function selectCharacter(character, focusThumb) {
    current = character;
    var img = document.getElementById("featured-img");
    img.src = character.file;
    img.alt = "Muse character dressed as " + character.name + ", full body";
    document.getElementById("featured-name").textContent = character.name;
    document.getElementById("featured-theme").textContent = character.theme;

    var dl = document.getElementById("featured-download");
    dl.href = character.file;
    dl.setAttribute("download", "muse-" + character.id + ".webp");

    document.getElementById("featured-share").href = shareUrl(character);

    document.querySelectorAll(".thumb").forEach(function (el) {
      var active = el.getAttribute("data-id") === character.id;
      el.setAttribute("aria-pressed", active ? "true" : "false");
      if (active && focusThumb) el.focus();
    });
  }

  function buildThumbs() {
    var wrap = document.getElementById("thumbs");
    CHARACTERS.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.setAttribute("data-id", c.id);
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.setAttribute("aria-label", "Show " + c.name + " (" + c.theme + ")");

      var img = document.createElement("img");
      img.src = c.file;
      img.alt = "";
      img.loading = "lazy";
      img.width = 240;
      img.height = 240;

      var label = document.createElement("span");
      label.className = "thumb-name";
      label.textContent = c.name;

      b.appendChild(img);
      b.appendChild(label);
      b.addEventListener("click", function () { selectCharacter(c, false); });
      wrap.appendChild(b);
    });

    wrap.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var idx = CHARACTERS.indexOf(current);
      idx = e.key === "ArrowRight"
        ? (idx + 1) % CHARACTERS.length
        : (idx - 1 + CHARACTERS.length) % CHARACTERS.length;
      e.preventDefault();
      selectCharacter(CHARACTERS[idx], true);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                             */
  /* ------------------------------------------------------------------ */

  function promptForTheme(character) {
    return SHORT_PROMPT.replace("[THEME]", character.name + " (" + character.theme + ")");
  }

  function init() {
    document.getElementById("short-box").innerHTML = renderPrompt(SHORT_PROMPT);
    document.getElementById("full-box").innerHTML = renderPrompt(FULL_PROMPT);

    buildThumbs();
    selectCharacter(CHARACTERS[0], false);

    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var which = btn.getAttribute("data-copy");
        var text = which === "full" ? FULL_PROMPT : SHORT_PROMPT;
        var note = document.querySelector('[data-note="' + which + '"]');
        copyText(text, { button: btn, note: note });
      });
    });

    document.getElementById("featured-copy").addEventListener("click", function () {
      copyText(promptForTheme(current), {
        button: this,
        note: document.getElementById("featured-copy-note")
      });
    });

    document.getElementById("hashtag-copy").addEventListener("click", function () {
      copyText(HASHTAG, {
        button: this,
        note: document.getElementById("hashtag-note")
      });
    });

    fetch("version.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (!v) return;
        var el = document.getElementById("app-version");
        el.textContent = "v" + v.version;
        el.title = "commit " + v.commit + ", built " + v.builtAt;
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
