/* DreamPlay shared motion FX — scroll reveal, ripple, cursor glow, nav state.
   Single source for both sites; loaded via <script src="assets/fx.js" defer>.
   Design: restrained B2B motion — entrance plays once per element, interactions
   are immediate, ambient loops are slow; everything yields to
   prefers-reduced-motion. Elements only get .reveal from JS, so a no-JS or
   reduced-motion visit renders the fully static page. */
(function () {
  "use strict";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RAF = window.requestAnimationFrame || function (f) { setTimeout(f, 16); };
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* —— 导航滚动态：与动效偏好无关的纯状态切换 —— */
  ready(function () {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("scrolled", (window.scrollY || 0) > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });

  if (REDUCE) return; // 无障碍：减少动效时不做任何运动类效果

  /* —— 1) 滚动入场：容器子项自动编排 stagger —— */
  ready(function () {
    var REVEAL = [
      ".section-head", ".help-note", ".coop-note", ".boundary-note",
      ".help-grid > *", ".focus-grid > *", ".proof-grid > *",
      ".modes > *", ".pipe > *", ".steps > *", ".rhythm-grid > *", ".demo-grid > *",
      ".world", ".gallery > *", ".contact-info > *", ".form-card", ".nuri-panel"
    ].join(",");
    var els = document.querySelectorAll(REVEAL);
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) {
      el.classList.add("reveal");
      var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = Math.min(Math.max(idx, 0) * 90, 360) + "ms";
      io.observe(el);
    });
  });

  /* —— 2) 点击涟漪：主/幽灵按钮与语言切换 —— */
  document.addEventListener("pointerdown", function (ev) {
    var b = ev.target.closest(".btn, .lang-switch button");
    if (!b) return;
    var r = b.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 1.15;
    var s = document.createElement("span");
    s.className = "fx-ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (ev.clientX - r.left - d / 2) + "px";
    s.style.top = (ev.clientY - r.top - d / 2) + "px";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 620);
  });

  /* —— 3) 光标跟随辉光：仅桌面精确指针，rAF 节流 —— */
  ready(function () {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var SIZE = 520, HALF = SIZE / 2;
    var glow = document.createElement("div");
    glow.className = "fx-cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    hero.appendChild(glow);
    var x = 0, y = 0, queued = false;
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      x = e.clientX - rect.left; y = e.clientY - rect.top;
      if (glow.style.opacity !== "1") glow.style.opacity = "1";
      if (queued) return;
      queued = true;
      RAF(function () {
        glow.style.transform = "translate3d(" + (x - HALF) + "px," + (y - HALF) + "px,0)";
        queued = false;
      });
    });
    hero.addEventListener("pointerleave", function () { glow.style.opacity = "0"; });
  });
})();
