/* DreamPlay shared mail-draft generator — single source for both sites.
   Configured per page via window.DP_MAIL (must be defined before this script):

   window.DP_MAIL = {
     recipient: "contact@dreamplaylab.com",
     draft: "#mail-draft", openBtn: "#mail-open",
     fields: { company:"#f-company", email:"#f-email", intent:"#f-intent" },
     ja: { subjectPrefix:"【…】", defaultSubject:"…", salutation:[…], message:"…",
           closing:"…", labels:{company:"…", email:"…", intent:"…"} },
     en: { …same shape… }
   };

   Draft format is identical to the pre-migration game site:
   "To: <recipient>" / blank / salutation lines / blank / labeled fields / blank /
   message / blank / closing. Rebuilds on input/change and on dp:langchange. */
(function () {
  "use strict";
  var cfg = window.DP_MAIL;
  if (!cfg) return;
  var body = document.body;
  var $ = function (sel) { return document.querySelector(sel); };
  var fCompany = $(cfg.fields.company);
  var fEmail = $(cfg.fields.email);
  var fIntent = $(cfg.fields.intent);
  var draftEl = $(cfg.draft);
  var mailOpen = $(cfg.openBtn);

  function isEN() { return body.className.indexOf("lang-en") > -1; }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function intentLabel() {
    var opt = fIntent.options[fIntent.selectedIndex];
    if (!opt || !opt.value) return "";
    return opt.getAttribute(isEN() ? "data-en" : "data-ja") || "";
  }

  function buildDraft() {
    var t = cfg[isEN() ? "en" : "ja"];
    var company = fCompany.value.trim();
    var email = fEmail.value.trim();
    var intent = intentLabel();
    var lines = [];
    lines.push((isEN() ? "To: " : "宛先: ") + cfg.recipient);
    lines.push("");
    t.salutation.forEach(function (s) { lines.push(s); });
    lines.push("");
    if (company) lines.push(t.labels.company + (isEN() ? ": " : "：") + company);
    if (email) lines.push(t.labels.email + (isEN() ? ": " : "：") + email);
    if (intent) lines.push(t.labels.intent + (isEN() ? ": " : "：") + intent);
    lines.push("");
    lines.push(t.message);
    lines.push("");
    lines.push(t.closing);
    return {
      subject: t.subjectPrefix + (intent || t.defaultSubject),
      body: lines.join("\n")
    };
  }

  function refresh() {
    var d = buildDraft();
    draftEl.value = d.body;
    var href = "mailto:" + cfg.recipient + "?subject=" + encodeURIComponent(d.subject) + "&body=" + encodeURIComponent(d.body);
    mailOpen.setAttribute("href", href);
  }

  [fCompany, fEmail, fIntent].forEach(function (el) {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });
  /* 语言切换后刷新草稿 */
  document.documentElement.addEventListener("dp:langchange", refresh);
  refresh();
})();
