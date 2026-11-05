/* Manlourd & Claire — site behaviour. No libraries needed. */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu ---------- */
  var nav = document.querySelector(".nav");
  var menuBtn = document.querySelector(".menu-btn");
  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
    });
  }

  /* ---------- countdown ---------- */
  var cd = document.querySelector("[data-countdown]");
  if (cd && SITE.weddingDate) {
    var target = new Date(SITE.weddingDate).getTime();
    var cells = {};
    ["days", "hours", "mins", "secs"].forEach(function (k) { cells[k] = cd.querySelector('[data-unit="' + k + '"]'); });
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tick = function () {
      var d = Math.max(0, target - Date.now());
      var days = Math.floor(d / 864e5); d -= days * 864e5;
      var h = Math.floor(d / 36e5); d -= h * 36e5;
      var m = Math.floor(d / 6e4); d -= m * 6e4;
      var s = Math.floor(d / 1e3);
      if (cells.days) cells.days.textContent = days;
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.mins) cells.mins.textContent = pad(m);
      if (cells.secs) cells.secs.textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- photo lists (from content.js) ---------- */
  function lookup(path) {
    return path.split(".").reduce(function (o, k) { return o && o[k]; }, SITE);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  // useThumb: show the small "thumb" file when one exists (grids);
  // the photo viewer always uses the large "src" file.
  function picture(p, alt, useThumb) {
    if (p.src) {
      var img = el("img");
      img.src = useThumb && p.thumb ? p.thumb : p.src;
      img.alt = alt || p.caption || "";
      img.loading = "lazy";
      img.decoding = "async";
      if (p.w && p.h) { img.width = p.w; img.height = p.h; }
      if (p.pos) img.style.objectPosition = p.pos;
      return img;
    }
    var ph = el("div", "ph", "Photo to come");
    if (p.ar) ph.style.setProperty("--ar", p.ar);
    ph.setAttribute("role", "img");
    ph.setAttribute("aria-label", "Photo placeholder");
    return ph;
  }

  // Every album block on the page shares one running photo number,
  // so the viewer can step through the whole album in order.
  var albumList = [];
  document.querySelectorAll("[data-photos]").forEach(function (host) {
    var list = lookup(host.getAttribute("data-photos")) || [];
    var kind = host.getAttribute("data-kind") || "snapshot";
    list.forEach(function (p) {
      if (kind === "album") {
        var n = albumList.push(p) - 1;
        var fig = el("figure");
        var btn = el("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "Open photo " + (n + 1) + (p.caption ? ", " + p.caption : ""));
        btn.dataset.index = n;
        btn.appendChild(picture(p, (p.caption ? p.caption + " — " : "") + "Manlourd and Claire, prenup photo " + (n + 1), true));
        fig.appendChild(btn);
        host.appendChild(fig);
      } else {
        var s = el("figure", "snapshot" + (kind === "fav" ? " fav" : ""));
        s.appendChild(picture(p, null, true));
        if (p.caption) s.appendChild(el("figcaption", null, p.caption));
        host.appendChild(s);
      }
    });
  });

  /* ---------- carousels ---------- */
  document.querySelectorAll(".carousel").forEach(function (c) {
    var track = c.querySelector(".track");
    var prev = c.querySelector("[data-prev]");
    var next = c.querySelector("[data-next]");
    var counter = c.querySelector(".counter");
    if (!track) return;
    var items = function () { return Array.prototype.slice.call(track.children); };
    var current = function () {
      var left = track.scrollLeft;
      var best = 0, bestD = Infinity;
      items().forEach(function (it, i) {
        var d = Math.abs(it.offsetLeft - track.offsetLeft - left - parseFloat(getComputedStyle(track).paddingLeft || 0));
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };
    var update = function () {
      var n = items().length;
      var i = current();
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (counter) counter.textContent = (atEnd ? n : i + 1) + " / " + n;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = atEnd;
    };
    var go = function (dir) {
      var list = items();
      var i = Math.min(list.length - 1, Math.max(0, current() + dir));
      var pad = parseFloat(getComputedStyle(track).paddingLeft || 0);
      track.scrollTo({ left: list[i].offsetLeft - track.offsetLeft - pad, behavior: reduceMotion ? "auto" : "smooth" });
    };
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    update();
  });

  /* ---------- lightbox (gallery album) ---------- */
  var lb = document.querySelector(".lightbox");
  if (albumList.length && lb && typeof lb.showModal === "function") {
    var list = albumList;
    var stage = lb.querySelector(".lb-stage");
    var cap = lb.querySelector(".lb-cap");
    var idx = 0;
    var preload = function (i) {
      var p = list[(i + list.length) % list.length];
      if (p && p.src) { var im = new Image(); im.src = p.src; }
    };
    var show = function (i) {
      idx = (i + list.length) % list.length;
      var p = list[idx];
      stage.innerHTML = "";
      var node = picture(p);
      node.classList.add(p.src ? "lb-img" : "lb-ph");
      if (p.src) node.loading = "eager";
      stage.appendChild(node);
      cap.textContent = (p.caption ? p.caption + "  ·  " : "") + (idx + 1) + " / " + list.length;
      preload(idx + 1); preload(idx - 1);
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-kind='album'] button[data-index]");
      if (!b) return;
      show(parseInt(b.dataset.index, 10));
      lb.showModal();
    });
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { show(idx + 1); });
    lb.querySelector("[data-lb-close]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    // swipe left / right on phones
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-inner")) lb.close(); });
  }

  /* ---------- RSVP ---------- */
  // Talks to the Google Apps Script web app set in content.js (rsvpEndpoint).
  // The script answers with JSON, so the guest only sees "thank you" once the
  // reply is really saved in the sheet.
  var form = document.querySelector("#rsvp-form");
  if (form) {
    var endpoint = SITE.rsvpEndpoint || "";
    var msg = form.querySelector(".form-msg");
    var sendBtn = form.querySelector("button[type=submit]");
    var thanks = document.querySelector(".thanks");
    var closedBox = document.querySelector(".rsvp-closed");
    var deadlineLine = document.querySelector("#rsvp-deadline");
    var seatsSelect = form.querySelector("[name=seats]");
    var attendingOnly = form.querySelectorAll(".if-attending");
    var defaultMsg = msg.textContent;

    var setMsg = function (text, isError) {
      msg.textContent = text;
      msg.classList.toggle("error", !!isError);
    };
    var attendingValue = function () {
      var r = form.querySelector("[name=attending]:checked");
      return r ? r.value : "";
    };
    var showAttendingFields = function () {
      var yes = attendingValue() === "yes";
      attendingOnly.forEach(function (el) { el.hidden = !yes; });
    };
    var showClosed = function () {
      form.hidden = true;
      thanks.hidden = true;
      closedBox.hidden = false;
      if (deadlineLine) deadlineLine.textContent = "RSVPs are now closed";
    };
    var fillSeats = function (max) {
      if (!seatsSelect || !max || max < 1) return;
      var current = seatsSelect.value;
      seatsSelect.innerHTML = "";
      for (var n = 1; n <= max; n++) {
        var o = document.createElement("option");
        o.value = String(n);
        o.textContent = n === 1 ? "1 · just me" : String(n);
        seatsSelect.appendChild(o);
      }
      if (Number(current) <= max) seatsSelect.value = current;
    };

    form.querySelectorAll("[name=attending]").forEach(function (r) {
      r.addEventListener("change", function () { showAttendingFields(); setMsg(defaultMsg); });
    });
    showAttendingFields();

    // Ask the sheet whether RSVPs are open and what the deadline is.
    if (endpoint) {
      fetch(endpoint, { method: "GET" })
        .then(function (r) { return r.json(); })
        .then(function (info) {
          if (!info || !info.ok) return;
          if (info.maxSeats) fillSeats(info.maxSeats);
          if (info.open === false) { showClosed(); return; }
          if (info.deadline && deadlineLine) deadlineLine.textContent = "Please reply on or before " + info.deadline;
        })
        .catch(function () { /* the form still works; the POST will report problems */ });
    }

    var finish = function (name, attending, updated) {
      var first = name.split(" ")[0];
      var yes = attending === "yes";
      thanks.querySelector(".script").textContent = updated ? "Reply updated" : (yes ? "See you there!" : "You will be missed");
      thanks.querySelector("p:last-child").textContent = updated
        ? "Thank you, " + first + ". We've changed your reply to " + (yes ? "attending" : "not attending") + "."
        : yes
          ? "Your reply is sealed and on its way, " + first + ". We cannot wait to celebrate with you."
          : "Thank you for letting us know, " + first + ". We will be thinking of you on our day.";
      form.hidden = true;
      thanks.hidden = false;
      thanks.setAttribute("tabindex", "-1");
      thanks.focus();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector("[name=website]").value) return; // spam trap

      var nameInput = form.querySelector("[name=name]");
      var name = nameInput.value.replace(/\s+/g, " ").trim();
      var attending = attendingValue();
      if (!name) { setMsg("Please write your first and last name.", true); nameInput.focus(); return; }
      if (!attending) { setMsg("Please choose whether you can join us.", true); form.querySelector("#attend-yes").focus(); return; }

      var payload = {
        name: name,
        attending: attending,
        seats: attending === "yes" ? Number(seatsSelect.value || 1) : 0,
        contact: form.querySelector("[name=contact]").value.trim(),
        message: form.querySelector("[name=message]").value.trim(),
        website: ""
      };

      // No endpoint yet: preview mode, nothing is saved.
      if (!endpoint) { finish(name, attending, false); return; }

      sendBtn.disabled = true;
      setMsg("Sealing your reply…");
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          clearTimeout(timer);
          sendBtn.disabled = false;
          if (res && res.ok) { finish(name, attending, res.status === "updated"); return; }
          if (res && res.status === "closed") { showClosed(); return; }
          setMsg((res && res.message) || "We couldn't save your reply. Please try again.", true);
        })
        .catch(function () {
          clearTimeout(timer);
          sendBtn.disabled = false;
          setMsg("We couldn't reach the guest list. Check your connection and try again, or message us directly.", true);
        });
    });
  }

  /* ---------- gentle reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }

  /* ---------- attire guide (home page) ---------- */
  var attire = document.querySelector("dialog.attire");
  var attireBtn = document.querySelector("[data-attire-open]");
  if (attire && attireBtn) {
    if (typeof attire.showModal !== "function") {
      attireBtn.hidden = true; // very old browsers: keep the note, hide the button
    } else {
      attireBtn.addEventListener("click", function () { attire.showModal(); attire.querySelector(".attire-sheet").scrollTop = 0; });
      attire.querySelector("[data-attire-close]").addEventListener("click", function () { attire.close(); });
      // Click on the dark area outside the sheet closes it.
      attire.addEventListener("click", function (e) { if (e.target === attire) attire.close(); });
      attire.addEventListener("close", function () { attireBtn.focus(); });
    }
  }
})();
