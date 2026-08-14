/* DreamPlay shared language switcher — single source for both sites.
   Requires: <html lang="ja" data-title-ja="..." data-title-en="..."
             data-desc-ja="..." data-desc-en="...">  (desc optional)
             <body class="lang-ja"> with .lang-switch button[data-lang]
             [data-ja]/[data-en] spans, [data-ja-ph]/[data-en-ph] inputs,
             option[data-ja]/option[data-en] selects.
   Persists via localStorage "dp-lang" (shared key, consistent across sites).
   Served HTML is always the JA default — crawlers never see EN state, and no
   hreflang/alternate-URL is emitted (EN is a client-side view of one URL). */
(function () {
  "use strict";
  var root = document.documentElement;
  var body = document.body;
  var buttons = document.querySelectorAll(".lang-switch button");
  var TITLE_JA = root.getAttribute("data-title-ja") || document.title;
  var TITLE_EN = root.getAttribute("data-title-en") || document.title;
  var DESC_JA = root.getAttribute("data-desc-ja") || "";
  var DESC_EN = root.getAttribute("data-desc-en") || "";
  var descMeta = document.querySelector('meta[name="description"]');
  var STORAGE_KEY = "dp-lang";

  function applyLang(lang) {
    body.className = "lang-" + lang;
    root.lang = lang === "en" ? "en" : "ja";
    var en = lang === "en";
    document.title = en ? TITLE_EN : TITLE_JA;
    if (descMeta) {
      var d = en ? DESC_EN : DESC_JA;
      if (d) descMeta.setAttribute("content", d);
    }
    buttons.forEach(function (b) {
      var on = b.getAttribute("data-lang") === lang;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    /* 动态切换 placeholder（input 用 data-ja-ph/data-en-ph） */
    document.querySelectorAll("[data-ja-ph]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute(en ? "data-en-ph" : "data-ja-ph") || "");
    });
    /* 动态切换 select option 文本（option 用 data-ja/data-en 属性） */
    document.querySelectorAll("option[data-ja]").forEach(function (opt) {
      opt.textContent = opt.getAttribute(en ? "data-en" : "data-ja") || "";
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    root.dispatchEvent(new CustomEvent("dp:langchange", { detail: { lang: lang } }));
  }

  window.DP = window.DP || {};
  window.DP.applyLang = applyLang;

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ja" || saved === "en") applyLang(saved);
  } catch (e) { /* private mode */ }
})();
