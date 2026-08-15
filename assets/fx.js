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
      ".world", ".gallery > *", ".contact-info > *", ".form-card", ".nuri-panel",
      ".chuk-points > *", ".chuk-note", ".chuk-panel"
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

  /* —— 7) 主导航子菜单（2026-08-16）：点击父项展开下拉/再点子项跳转；
        桌面 hover 预展开；Esc/外部点击收起；≤720px 生成汉堡+抽屉。
        no-JS：nav-links 是普通锚点，直达区块（渐进增强）。 —— */
  ready(function () {
    var navLinks = document.querySelector(".nav-links");
    if (!navLinks) return;
    var items = [].slice.call(navLinks.querySelectorAll(":scope > .nav-item"));
    var openItem = null, closeTimer = null;

    function setOpen(item, open) {
      item.classList.toggle("open", open);
      var a = item.querySelector(":scope > .nav-parent");
      if (a) a.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function closeAll() { items.forEach(function (it) { setOpen(it, false); }); openItem = null; }
    function show(item) {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      if (openItem && openItem !== item) setOpen(openItem, false);
      setOpen(item, true); openItem = item;
    }
    function hideSoon() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { closeAll(); }, 160);
    }

    items.forEach(function (item) {
      var parent = item.querySelector(":scope > .nav-parent");
      var drop = item.querySelector(":scope > .nav-drop");
      if (!parent || !drop) return;
      parent.setAttribute("aria-haspopup", "true");
      parent.setAttribute("aria-expanded", "false");
      item.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover: hover)").matches) show(item);
      });
      item.addEventListener("mouseleave", hideSoon);
      drop.addEventListener("mouseenter", function () {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      });
      drop.addEventListener("mouseleave", hideSoon);
      parent.addEventListener("click", function (e) {
        e.preventDefault();
        /* hover-capable pointers: an already-open panel stays open on click
           (hover-opened); touch/keyboard toggles open<->closed */
        var canHover = window.matchMedia("(hover: hover)").matches;
        if (openItem === item && canHover) return;
        (openItem === item) ? closeAll() : show(item);
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav-item")) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeAll(); closeDrawer(); }
    });
    document.addEventListener("focusin", function (e) {
      if (!e.target.closest(".nav-item")) closeAll();
    });

    /* —— 移动端汉堡 + 抽屉（由 nav-links 数据即时克隆，≤720px 可见）—— */
    var burger = document.createElement("button");
    burger.className = "nav-burger";
    burger.type = "button";
    burger.setAttribute("aria-label", "Menu");
    burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = "<span></span><span></span><span></span>";

    var drawer = document.createElement("nav");
    drawer.className = "nav-drawer";
    drawer.setAttribute("aria-label", "Mobile menu");

    [].slice.call(navLinks.children).forEach(function (child) {
      if (child.classList && child.classList.contains("nav-item")) {
        var parent = child.querySelector(":scope > .nav-parent");
        var dropLinks = [].slice.call(child.querySelectorAll(":scope > .nav-drop > .drop-link"));
        if (!parent || !dropLinks.length) return;
        var row = document.createElement("div");
        row.className = "drawer-row";
        var head = document.createElement("button");
        head.type = "button";
        head.className = "drawer-parent";
        [].slice.call(parent.childNodes).forEach(function (n) {
          if (n.nodeType === 1 && n.tagName === "svg".toUpperCase()) return; /* caret 重新生成 */
          head.appendChild(n.cloneNode(true));
        });
        var caret = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        caret.setAttribute("class", "nav-caret");
        caret.setAttribute("viewBox", "0 0 12 12");
        caret.setAttribute("fill", "none");
        caret.setAttribute("stroke", "currentColor");
        caret.setAttribute("stroke-width", "1.6");
        caret.setAttribute("aria-hidden", "true");
        caret.innerHTML = '<path d="m2.5 4.5 3.5 3.5 3.5-3.5"/>';
        head.appendChild(caret);
        var sub = document.createElement("div");
        sub.className = "drawer-sub";
        dropLinks.forEach(function (dl) {
          var a = document.createElement("a");
          a.href = dl.getAttribute("href") || "#";
          if (dl.getAttribute("target")) a.setAttribute("target", dl.getAttribute("target"));
          if (dl.getAttribute("rel")) a.setAttribute("rel", dl.getAttribute("rel"));
          var num = dl.querySelector(":scope .dl-num");
          if (num) { var n2 = document.createElement("span"); n2.className = "dl-num"; n2.textContent = num.textContent; a.appendChild(n2); }
          var label = dl.querySelector(":scope b");
          if (label) { [].slice.call(label.childNodes).forEach(function (n) { a.appendChild(n.cloneNode(true)); }); }
          if (dl.classList.contains("is-external")) {
            var ext = document.createElement("span"); ext.className = "dl-ext"; ext.textContent = "↗";
            a.appendChild(ext); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
          }
          sub.appendChild(a);
        });
        head.addEventListener("click", function () {
          var willOpen = !row.classList.contains("open");
          [].slice.call(drawer.querySelectorAll(".drawer-row.open")).forEach(function (r) {
            r.classList.remove("open");
            var s = r.querySelector(":scope .drawer-sub"); if (s) s.style.maxHeight = "0px";
          });
          row.classList.toggle("open", willOpen);
          sub.style.maxHeight = willOpen ? sub.scrollHeight + "px" : "0px";
        });
        sub.addEventListener("click", function (e) {
          if (e.target.closest("a")) closeDrawer();
        });
        row.appendChild(head); row.appendChild(sub); drawer.appendChild(row);
      } else if (child.tagName === "A" || child.tagName === "a") {
        var plain = document.createElement("a");
        plain.className = "drawer-plain";
        plain.href = child.getAttribute("href") || "#";
        [].slice.call(child.childNodes).forEach(function (n) { plain.appendChild(n.cloneNode(true)); });
        plain.addEventListener("click", closeDrawer);
        drawer.appendChild(plain);
      }
    });

    function closeDrawer() {
      if (!document.body.contains(drawer)) return;
      drawer.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
    }
    burger.addEventListener("click", function () {
      var willOpen = !drawer.classList.contains("open");
      if (willOpen) {
        drawer.classList.add("open");
        burger.setAttribute("aria-expanded", "true");
        document.documentElement.style.overflow = "hidden";
      } else closeDrawer();
    });

    var inner = document.querySelector(".nav-inner");
    var langSwitch = document.querySelector(".lang-switch");
    if (inner) {
      if (langSwitch) inner.insertBefore(burger, langSwitch);
      else inner.appendChild(burger);
      inner.parentElement.parentElement.insertBefore(drawer, inner.parentElement.nextSibling);
    }
  });
})();
