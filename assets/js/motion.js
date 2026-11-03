
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;
  root.classList.add("motion-ready");
  if (reduce) return;

  /* ---------- 1. parallax ---------- */
 
  var items = [];
  var add = function (sel, speed, mode, opts) {
    document.querySelectorAll(sel).forEach(function (el) { items.push({ el: el, speed: speed, mode: mode || "y", opts: opts || {} }); });
  };
  var wide = window.matchMedia("(min-width: 761px)");

  add(".hero > picture img", 0.28, "y");          
  add(".hero-copy", 0.12, "fade");                
  add(".story-hero .snapshot img", 0.06, "inner"); 
  if (finePointer) {
  
    add(".save-date", 0.08, "bg");
    add(".party", 0.08, "bg");
    add(".ent-hero", 0.12, "bg");
  }
  if (wide.matches) {
    add(".pinboard .one", -0.05, "y");
    add(".pinboard .two", 0.05, "y");
    add(".pinboard .three", -0.025, "y");
  }
  if (!items.length && !document.querySelector(".stagger")) return;

  items.forEach(function (it) {
   
    it.measure = it.el.closest(".hero") || it.el.closest(".pinboard") || it.el;
    if (it.mode === "inner") {
      var clip = document.createElement("span");
      clip.className = "parallax-clip";
      it.el.parentNode.insertBefore(clip, it.el);
      clip.appendChild(it.el);
      it.measure = clip;
      it.el.style.scale = "1.14";
    }
    if (it.mode === "bg") {
      it.base = getComputedStyle(it.el).backgroundPositionY || "50%";
      // Enlarge the background just enough that its drift never shows an edge.
      var m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(it.el).backgroundImage);
      if (m) {
        var img = new Image();
        img.onload = function () { it.img = img; sizeBg(it); };
        img.src = m[1];
      }
    }
    if (it.mode === "y" && it.el.closest(".hero")) it.el.style.scale = "1.06";
    it.el.style.willChange = it.mode === "bg" ? "background-position" : "translate, opacity";
  });

  var vh = window.innerHeight;
  var ticking = false;
  function sizeBg(it) {
    if (!it.img) return;
    var w = it.el.offsetWidth, h = it.el.offsetHeight;
    var drift = it.speed * ((vh + h) / 2 + 220);
    var scale = Math.max(w / it.img.naturalWidth, (h + drift * 2) / it.img.naturalHeight);
    it.el.style.backgroundSize = Math.ceil(it.img.naturalWidth * scale) + "px auto";
    update();
  }
  var update = function () {
    ticking = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], r = it.measure.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var fromCentre = (r.top + r.height / 2) - vh / 2;
      if (it.mode === "y" && it.measure.classList.contains("hero")) {
        it.el.style.translate = "0 " + (Math.max(0, -r.top) * it.speed).toFixed(1) + "px";
      } else if (it.mode === "y" || it.mode === "inner") {
        it.el.style.translate = "0 " + (-fromCentre * it.speed).toFixed(1) + "px";
      } else if (it.mode === "fade") {
        var scrolled = Math.max(0, -r.top);
        var p = Math.min(1, scrolled / (r.height * 0.7));
        it.el.style.translate = "0 " + (-scrolled * it.speed).toFixed(1) + "px";
        it.el.style.opacity = (1 - p * 0.85).toFixed(3);
      } else if (it.mode === "bg") {
        it.el.style.backgroundPositionY = "calc(" + it.base + " + " + (fromCentre * it.speed).toFixed(1) + "px)";
      }
    }
  };
  var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; items.forEach(function (it) { if (it.mode === "bg") sizeBg(it); }); request(); });
  update();
})();

(function () {
  document.querySelectorAll(".stagger").forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.style.setProperty("--i", Math.min(i, 14));
    });
  });
})();
