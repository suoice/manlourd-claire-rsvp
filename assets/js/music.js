/* Manlourd & Claire — opening envelope + background music
 *
 * Home page: a sealed envelope covers the site on the first visit. Tapping the
 * wax seal opens it, the photo card rises and grows into the hero, and the song
 * fades in. Other pages: a small record button (bottom right) plays/pauses the
 * song, which carries on from the same spot as guests move between pages.
 *
 * Song file: assets/audio/intertwine.mp3 (change SONG below to use another).
 * Personal envelopes: add ?to=Name to the link, e.g. index.html?to=Tita+Marie
 */
(function () {
  "use strict";
  var SONG = "assets/audio/intertwine.mp3";
  var VOLUME = 0.6;                 // 0 to 1
  var KEY_STATE = "mc-music";       // "on" | "off"
  var KEY_TIME = "mc-music-time";
  var KEY_OPENED = "mc-opened";

  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- audio ---------- */
  var audio = new Audio();
  audio.src = SONG;
  audio.loop = true;
  audio.preload = store.get(KEY_STATE) === "on" ? "auto" : "none";
  var fadeTimer = null;

  var fadeTo = function (target, ms, done) {
    clearInterval(fadeTimer);
    var start = audio.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeTimer = setInterval(function () {
      i++;
      audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  };

  /* ---------- record button ---------- */
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "music-btn";
  btn.innerHTML = '<span class="music-disc" aria-hidden="true"><img src="assets/img/wax-seal.svg" alt=""></span>' +
                  '<span class="music-label">Intertwine · Over October</span>';
  document.body.appendChild(btn);

  var show = function (playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  };
  show(false);

  var play = function (fadeMs) {
    audio.preload = "auto";
    audio.volume = 0;
    var p = audio.play();
    var ok = function () { show(true); store.set(KEY_STATE, "on"); fadeTo(VOLUME, fadeMs || 1200); };
    if (p && p.then) return p.then(ok); // may reject if the browser blocks sound
    ok();
    return Promise.resolve();
  };
  var pause = function () {
    store.set(KEY_STATE, "off");
    show(false);
    fadeTo(0, 500, function () { audio.pause(); });
  };

  btn.addEventListener("click", function () {
    btn.classList.remove("is-waiting");
    if (audio.paused) play(800).catch(function () {}); else pause();
  });

  // Remember where the song was, so the next page continues from there.
  var saveTime = function () { if (!audio.paused) store.set(KEY_TIME, String(audio.currentTime)); };
  setInterval(saveTime, 1500);
  window.addEventListener("pagehide", saveTime);

  var resume = function () {
    var t = parseFloat(store.get(KEY_TIME) || "0");
    var seek = function () { try { if (t > 0) audio.currentTime = t; } catch (e) {} };
    if (audio.readyState >= 1) seek(); else audio.addEventListener("loadedmetadata", seek, { once: true });
    play(1500).catch(function () {
      // Browser blocked sound until the guest interacts: resume on their first tap or key.
      btn.classList.add("is-waiting");
      var go = function () {
        ["pointerdown", "keydown", "touchend"].forEach(function (ev) { document.removeEventListener(ev, go, true); });
        if (store.get(KEY_STATE) === "on" && audio.paused) { btn.classList.remove("is-waiting"); play(1500).catch(function () {}); }
      };
      ["pointerdown", "keydown", "touchend"].forEach(function (ev) { document.addEventListener(ev, go, true); });
    });
  };

  /* ---------- opening envelope (home page only) ---------- */
  var root = document.documentElement;
  var opener = document.getElementById("opener");
  window.__openerReady = true;

  if (!opener || !root.classList.contains("has-opener")) {
    if (opener) opener.remove();
    if (store.get(KEY_STATE) === "on") resume();
    return;
  }

  // Personal envelope: ?to=Name
  try {
    var to = new URLSearchParams(location.search).get("to");
    if (to) opener.querySelector(".env-name").textContent = to.replace(/\s+/g, " ").trim().slice(0, 40);
  } catch (e) {}

  var outside = document.querySelectorAll("body > :not(#opener):not(script)");
  outside.forEach(function (el) { el.inert = true; });
  window.scrollTo(0, 0);
  var seal = opener.querySelector(".env-seal");
  setTimeout(function () { seal.focus({ preventScroll: true }); }, 400);

  var finish = function () {
    store.set(KEY_OPENED, "1");
    outside.forEach(function (el) { el.inert = false; });
    root.classList.remove("has-opener");
    root.classList.add("opener-done");
    opener.classList.add("is-gone");
    setTimeout(function () { opener.remove(); }, 900);
  };

  var skip = function () {
    if (opener.classList.contains("is-opening")) return;
    opener.classList.add("is-skipping");
    finish();
  };
  opener.querySelector(".opener-skip").addEventListener("click", skip);
  opener.addEventListener("keydown", function (e) { if (e.key === "Escape") skip(); });

  var opened = false;
  seal.addEventListener("click", function () {
    if (opened) return;
    opened = true;
    play(3000).catch(function () {}); // started inside the tap, so browsers allow it

    if (reduce) { finish(); return; }

    opener.classList.add("is-opening");            // seal lifts, flap opens
    setTimeout(function () { opener.classList.add("is-rising"); }, 900);   // card slides up
    setTimeout(function () {                                               // card grows into the hero
      var card = opener.querySelector(".env-card");
      var r = card.getBoundingClientRect();
      var hero = document.querySelector(".hero");
      var h = hero ? hero.getBoundingClientRect() : { top: 0, left: 0, width: innerWidth, height: innerHeight };
      opener.appendChild(card);
      card.classList.add("is-free");
      card.style.cssText = "top:" + r.top + "px;left:" + r.left + "px;width:" + r.width + "px;height:" + r.height + "px;";
      card.getBoundingClientRect(); // lock in the start position
      opener.classList.add("is-expanding");
      card.style.cssText = "top:" + h.top + "px;left:" + h.left + "px;width:" + h.width + "px;height:" + h.height + "px;";
    }, 1900);
    setTimeout(finish, 2900);
  });
})();
