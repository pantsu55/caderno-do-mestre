/* Mapa da mesa: imagem + grade, miniaturas, objetos e régua.
   Usado na página dos jogadores (jogar.html). O Mestre edita; cada jogador move só o próprio token.
   Uso: HTMap.mount(elemento, { api, cid, uid, owner, party, imgUrl, toast, full }) -> { destroy() } */
(function () {
  'use strict';
  var COLORS = ['#5EE1F5', '#B08CFF', '#6EE0A8', '#FFB86B', '#FF8F8F', '#F5E27A', '#8FB8FF', '#E9E6F7'];
  var PRESETS = [
    { n: 'Barricada', sh: 'rect', w: 2, h: 1, col: '#B07A45', pat: 'wood' },
    { n: 'Parede de gelo', sh: 'rect', w: 4, h: 1, col: '#8FE3FF', pat: 'ice', op: 0.8 },
    { n: 'Pedra', sh: 'ellipse', w: 1, h: 1, col: '#8A8AA0', pat: 'stone' },
    { n: 'Fogo', sh: 'circle', r: 1, col: '#FF8A3D', pat: 'fire', op: 0.85 },
    { n: 'Água', sh: 'rect', w: 3, h: 3, col: '#4C8DFF', pat: 'water', op: 0.6 },
    { n: 'Escuridão', sh: 'circle', r: 2, col: '#05040A', pat: 'solid', op: 0.6 },
    { n: 'Círculo', sh: 'circle', r: 2, col: '#B08CFF', pat: 'solid', op: 0.4 },
    { n: 'Cone', sh: 'cone', r: 3, col: '#FFB86B', pat: 'solid', op: 0.45 },
    { n: 'Linha', sh: 'rect', w: 6, h: 1, col: '#5EE1F5', pat: 'solid', op: 0.4 },
    { n: 'Porta', sh: 'rect', w: 1, h: 0.25, col: '#C48A52', pat: 'wood' },
    { n: 'Marcador', sh: 'ellipse', w: 0.6, h: 0.6, col: '#FF8F8F', pat: 'solid', op: 0.9 }
  ];
  var PATS = [['solid', 'Liso'], ['wood', 'Madeira'], ['ice', 'Gelo'], ['stone', 'Pedra'], ['water', 'Água'], ['fire', 'Fogo']];
  var SHAPES = { rect: 'Retângulo', ellipse: 'Elipse', circle: 'Círculo (raio)', cone: 'Cone' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function plain(n) { return String(Math.round(n * 100) / 100); }
  function fmt(n) { return (Math.round(n * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
  function uuid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function () { return (Math.random() * 16 | 0).toString(16); }); }
  function initials(s) { return String(s || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || '?'; }

  var CSS = [
    '.mp { position: relative; display: grid; grid-template-rows: auto 1fr; height: calc(100dvh - 215px); min-height: 360px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--bg); }',
    '.mp.full { height: 100dvh; border: 0; border-radius: 0; }',
    '.mp-bar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 8px; background: var(--surface); border-bottom: 1px solid var(--line); }',
    '.mp-bar .sp { flex: 1; }',
    '.mp-b { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); color: var(--fg); font: inherit; font-size: 14px; cursor: pointer; }',
    '.mp-b:hover { border-color: var(--muted); }',
    '.mp-b[aria-pressed="true"] { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }',
    '.mp-b svg { width: 17px; height: 17px; }',
    '.mp-b.sq { padding: 0; width: 38px; justify-content: center; }',
    '.mp-b.pri { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); font-weight: 700; }',
    '.mp-b.bad { color: var(--bad); }',
    '.mp-b:disabled { opacity: 0.5; cursor: default; }',
    '.mp-stage { position: relative; min-height: 0; overflow: hidden; background: #07060d; }',
    '.mp-svg { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; display: block; }',
    '.mp-svg.ruler, .mp-svg.grid { cursor: crosshair; }',
    '.mp-svg.dragging { cursor: grabbing; }',
    '.mp-svg text { font-family: var(--font); pointer-events: none; }',
    '.mp-read { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); padding: 8px 14px; border-radius: 99px; background: rgba(10, 9, 18, 0.92); border: 1px solid var(--accent); color: var(--fg); font: 600 14px var(--mono); box-shadow: 0 0 18px -6px var(--accent); pointer-events: none; white-space: nowrap; }',
    '.mp-read[hidden] { display: none; }',
    '.mp-name { position: absolute; left: 50%; transform: translateX(-50%); top: 10px; white-space: nowrap; max-width: 60%; overflow: hidden; text-overflow: ellipsis; padding: 5px 11px; border-radius: 99px; background: rgba(10, 9, 18, 0.82); border: 1px solid var(--line); font: 600 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); pointer-events: none; }',
    '.mp-empty { position: absolute; inset: 0; display: grid; place-content: center; gap: 6px; text-align: center; padding: 24px; color: var(--muted); }',
    '.mp-empty b { font-family: var(--serif); font-size: 20px; color: var(--fg); letter-spacing: 0.04em; }',
    '.mp-side { position: absolute; top: 0; left: 0; bottom: 0; width: min(350px, 94%); overflow-y: auto; overscroll-behavior: contain; padding: 12px; background: rgba(19, 17, 34, 0.97); border-right: 1px solid var(--line); box-shadow: 14px 0 40px rgba(0, 0, 0, 0.5); display: grid; gap: 14px; align-content: start; z-index: 5; }',
    '.mp-side[hidden] { display: none; }',
    '.mp-side h3 { font: 600 11px var(--mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }',
    '.mp-sec { display: grid; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }',
    '.mp-sec:last-child { border-bottom: 0; }',
    '.mp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }',
    '.mp-row > label { flex: 1 1 120px; display: grid; gap: 3px; font-size: 12px; color: var(--muted); min-width: 0; }',
    '.mp-row input[type="number"], .mp-row input[type="text"], .mp-row select { width: 100%; min-height: 38px; padding: 0 9px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); color: var(--fg); font: inherit; font-size: 14px; }',
    '.mp-row input[type="color"] { width: 100%; height: 38px; padding: 2px; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); }',
    '.mp-row input[type="range"] { width: 100%; accent-color: var(--accent); }',
    '.mp-row > label.mp-chk { display: flex; flex: 1 1 100%; gap: 10px; align-items: center; font-size: 14px; color: var(--fg); }',
    '.mp input[type="checkbox"] { width: 22px; height: 22px; min-height: 0; padding: 0; flex: none; accent-color: var(--accent); }',
    '.mp-row > label.mp-b { display: inline-flex; flex: none; gap: 6px; font-size: 14px; color: var(--fg); }',
    '.mp-row > label.mp-b.pri { color: var(--accent-ink); }',
    '.mp-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 6px; }',
    '.mp-chips .mp-b { justify-content: flex-start; font-size: 13px; padding: 0 9px; }',
    '.mp-sw { width: 14px; height: 14px; border-radius: 4px; flex: none; border: 1px solid rgba(255,255,255,0.3); }',
    '.mp-cols { display: flex; gap: 6px; flex-wrap: wrap; }',
    '.mp-cols button { width: 28px; height: 28px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; }',
    '.mp-cols button[aria-pressed="true"] { border-color: var(--fg); }',
    '.mp-hint { font-size: 12.5px; color: var(--muted); line-height: 1.45; margin: 0; }',
    '.mp-nudge { display: grid; grid-template-columns: repeat(3, 38px); gap: 4px; }',
    '.mp-tk.mine .mp-ring { animation: mp-pulse 2.4s ease-in-out infinite; }',
    '@keyframes mp-pulse { 50% { stroke-opacity: 0.35; } }',
    '@media (prefers-reduced-motion: reduce) { .mp-tk.mine .mp-ring { animation: none !important; } }'
  ].join('\n');

  var ICON = {
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.8-2.4L4 14.5a1.6 1.6 0 0 1 2.5-2L8 14"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5" transform="rotate(-30 12 12)"/><path d="M8 13.2 9.2 11M11.4 11.3l1.2-2.1M14.8 9.4l1.2-2.1"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3.5 3.5h17v17h-17zM9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>'
  };

  function injectCss() {
    if (document.getElementById('mp-css')) return;
    var s = document.createElement('style'); s.id = 'mp-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------- medidas ---------- */
  function segSq(a, b, rule) {
    var dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]), mx = Math.max(dx, dy), mn = Math.min(dx, dy);
    if (rule === 'r') return Math.sqrt(dx * dx + dy * dy);
    if (rule === 'a') return mx + Math.floor(mn / 2);
    return mx;
  }
  function pathSq(pts, rule) { var t = 0; for (var i = 1; i < pts.length; i++) t += segSq(pts[i - 1], pts[i], rule); return t; }

  function mount(host, ctx) {
    injectCss();
    var api = ctx.api, cid = ctx.cid, uid = ctx.uid, owner = !!ctx.owner;
    var maps = [], map = null, objs = {}, seq = 0, urls = {}, loading = {};
    var tool = 'move', sel = null, panelOpen = owner && window.innerWidth >= 900, ruler = null, drag = null, lastFull = 0, msgText = '';
    var view = { x: 0, y: 0, k: 1 }, views = {}, pend = {}, busy = {};
    var pts = {}, mode = null, gest = null, rdown = null, timers = [], dead = false, saveT = null, drawQ = 0;

    host.innerHTML = '<div class="mp' + (ctx.full ? ' full' : '') + '"><div class="mp-bar" id="mp-bar"></div><div class="mp-stage" id="mp-stage"><svg class="mp-svg" id="mp-svg" xmlns="http://www.w3.org/2000/svg"><defs id="mp-defs"></defs><g id="mp-w"><g id="mp-img"></g><g id="mp-grid"></g><g id="mp-obj"></g><g id="mp-tok"></g><g id="mp-rul"></g></g></svg><div class="mp-name" id="mp-name" hidden></div><div class="mp-read" id="mp-read" hidden></div><div class="mp-empty" id="mp-empty" hidden></div>' + (owner ? '<aside class="mp-side" id="mp-side" aria-label="Ferramentas do mapa"></aside>' : '') + '</div></div>';
    var $ = function (s) { return host.querySelector(s); };
    function size() {
      if (ctx.full) return;
      var el = $('.mp'); if (!el) return;
      var top = el.getBoundingClientRect().top, h = Math.max(360, window.innerHeight - top - (ctx.reserve ? ctx.reserve() : 0) - 12);
      if (Math.abs(parseFloat(el.style.height) - h) > 1 || !el.style.height) el.style.height = h + 'px';
    }
    window.addEventListener('resize', size);
    var svg = $('#mp-svg'), stage = $('#mp-stage');

    /* ---------- rede ---------- */
    async function j(path, opt) { var r = await api(path, opt); if (!r.ok) { var e = new Error('http ' + r.status); e.status = r.status; throw e; } return r.status === 204 ? null : r.json().catch(function () { return null; }); }
    var JH = { 'Content-Type': 'application/json' };
    function post(path, body, extra) { return j(path, { method: 'POST', headers: Object.assign({}, JH, extra || {}), body: JSON.stringify(body) }); }
    function patch(path, body) { return j(path, { method: 'PATCH', headers: JH, body: JSON.stringify(body) }); }

    async function urlOf(img) {
      if (!img) return '';
      if (urls[img]) return urls[img];
      if (loading[img]) return '';
      loading[img] = true;
      try {
        var i = img.indexOf('/'), u = await ctx.imgUrl(img.slice(0, i), img.slice(i + 1));
        urls[img] = u;
        if (!dead) { if (map && img === 'mapas/' + map.img) drawBase(); drawQ = drawQ || setTimeout(function () { drawQ = 0; drawObjs(); }, 30); }
        return u;
      } catch (e) { delete loading[img]; return ''; }
    }

    /* ---------- configuração do mapa ---------- */
    function cfg() { return (map && map.cfg) || {}; }
    function cell() { return Math.max(4, num(cfg().cell, 70)); }
    function ox() { return num(cfg().ox, 0); }
    function oy() { return num(cfg().oy, 0); }
    function dist(sq) { var c = cfg(), u = c.unit || 'm', per = num(c.per, 1.5); return fmt(sq) + (sq === 1 ? ' quadrado' : ' quadrados') + (u === 'q' ? '' : ' · ' + fmt(sq * per) + ' ' + u); }
    function toWorld(px, py) { return [(px - view.x) / view.k, (py - view.y) / view.k]; }
    function toCell(px, py) { var w = toWorld(px, py); return [(w[0] - ox()) / cell(), (w[1] - oy()) / cell()]; }
    function rel(e) { var r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function canMove(o) { return !!o && !o.gone && (owner || (o.kind === 'tok' && o.owner === uid && !o.hidden)); }

    /* ---------- desenho ---------- */
    function defsHtml() {
      var c = cell();
      return '<pattern id="p-wood" width="' + c * 0.25 + '" height="' + c + '" patternUnits="userSpaceOnUse"><path d="M0 0V' + c + '" stroke="#000" stroke-opacity="0.3" stroke-width="' + c * 0.03 + '"/></pattern>' +
        '<pattern id="p-ice" width="' + c * 0.5 + '" height="' + c * 0.5 + '" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V' + c * 0.5 + '" stroke="#fff" stroke-opacity="0.5" stroke-width="' + c * 0.04 + '"/></pattern>' +
        '<pattern id="p-stone" width="' + c * 0.3 + '" height="' + c * 0.3 + '" patternUnits="userSpaceOnUse"><circle cx="' + c * 0.08 + '" cy="' + c * 0.08 + '" r="' + c * 0.035 + '" fill="#000" fill-opacity="0.35"/><circle cx="' + c * 0.21 + '" cy="' + c * 0.19 + '" r="' + c * 0.025 + '" fill="#fff" fill-opacity="0.25"/></pattern>' +
        '<pattern id="p-water" width="' + c * 0.5 + '" height="' + c * 0.25 + '" patternUnits="userSpaceOnUse"><path d="M0 ' + c * 0.125 + 'Q' + c * 0.125 + ' 0 ' + c * 0.25 + ' ' + c * 0.125 + 'T' + c * 0.5 + ' ' + c * 0.125 + '" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="' + c * 0.03 + '"/></pattern>' +
        '<radialGradient id="p-fire"><stop offset="0" stop-color="#FFF3A0" stop-opacity="0.95"/><stop offset="0.55" stop-color="#FF9A3D" stop-opacity="0.6"/><stop offset="1" stop-color="#FF3D1F" stop-opacity="0.15"/></radialGradient>';
    }
    function drawBase() {
      if (!map) { $('#mp-img').innerHTML = ''; $('#mp-grid').innerHTML = ''; return; }
      var c = cfg(), W = num(c.w, 1000), H = num(c.h, 1000), u = map.img ? urls['mapas/' + map.img] : '';
      $('#mp-defs').innerHTML = defsHtml();
      $('#mp-img').innerHTML = '<rect width="' + W + '" height="' + H + '" fill="#0d0b18"/>' + (u ? '<image href="' + esc(u) + '" width="' + W + '" height="' + H + '" preserveAspectRatio="none"/>' : '');
      var g = '';
      if (c.grid !== false) {
        var cs = cell(), d = '', x = ox() % cs, y = oy() % cs;
        if (x < 0) x += cs; if (y < 0) y += cs;
        for (; x <= W; x += cs) d += 'M' + x.toFixed(2) + ' 0V' + H;
        for (; y <= H; y += cs) d += 'M0 ' + y.toFixed(2) + 'H' + W;
        g = '<path d="' + d + '" fill="none" stroke="' + esc(c.gcol || '#ffffff') + '" stroke-opacity="' + clamp(num(c.gop, 0.35), 0.05, 1) + '" stroke-width="1" vector-effect="non-scaling-stroke"/>';
      }
      $('#mp-grid').innerHTML = g;
    }
    function objSvg(o) {
      var d = o.data || {}, c = cell(), sh = d.sh || 'rect', col = esc(d.col || '#B07A45'), op = clamp(num(d.op, 1), 0.1, 1), pat = d.pat || 'solid', rot = num(d.rot, 0);
      var x = ox() + num(d.x, 0) * c, y = oy() + num(d.y, 0) * c, w = Math.max(0.1, num(d.w, 1)) * c, h = Math.max(0.05, num(d.h, 1)) * c, r = Math.max(0.5, num(d.r, 1)) * c;
      var body = '', over = pat === 'fire' ? 'url(#p-fire)' : (pat !== 'solid' ? 'url(#p-' + pat + ')' : ''), tf, hit = '';
      if (sh === 'circle') {
        tf = 'translate(' + x + ' ' + y + ')';
        body = '<circle r="' + r + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-width="' + c * 0.04 + '"/>' + (over ? '<circle r="' + r + '" fill="' + over + '"/>' : '');
      } else if (sh === 'cone') {
        var a = 26.565 * Math.PI / 180, px = r * Math.cos(a), py = r * Math.sin(a), p = 'M0 0L' + px + ' ' + (-py) + 'A' + r + ' ' + r + ' 0 0 1 ' + px + ' ' + py + 'Z';
        tf = 'translate(' + x + ' ' + y + ') rotate(' + rot + ')';
        body = '<path d="' + p + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-width="' + c * 0.04 + '"/>' + (over ? '<path d="' + p + '" fill="' + over + '"/>' : '');
      } else if (sh === 'ellipse') {
        tf = 'translate(' + (x + w / 2) + ' ' + (y + h / 2) + ') rotate(' + rot + ')';
        body = '<ellipse rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + col + '" fill-opacity="' + op + '" stroke="#000" stroke-opacity="0.45" stroke-width="' + c * 0.03 + '"/>' + (over ? '<ellipse rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + over + '"/>' : '');
      } else {
        tf = 'translate(' + (x + w / 2) + ' ' + (y + h / 2) + ') rotate(' + rot + ')';
        body = '<rect x="' + -w / 2 + '" y="' + -h / 2 + '" width="' + w + '" height="' + h + '" rx="' + Math.min(c * 0.05, h / 3) + '" fill="' + col + '" fill-opacity="' + op + '" stroke="#000" stroke-opacity="0.45" stroke-width="' + c * 0.03 + '"/>' + (over ? '<rect x="' + -w / 2 + '" y="' + -h / 2 + '" width="' + w + '" height="' + h + '" rx="' + Math.min(c * 0.05, h / 3) + '" fill="' + over + '"/>' : '');
      }
      var lab = d.n && d.lab !== false ? '<text transform="rotate(' + -rot + ')" y="' + c * 0.1 + '" text-anchor="middle" font-size="' + c * 0.26 + '" fill="#fff" stroke="#000" stroke-width="' + c * 0.07 + '" paint-order="stroke" stroke-linejoin="round">' + esc(d.n) + '</text>' : '';
      var selEl = '';
      if (owner && sel === o.id) {
        var bb = sh === 'circle' ? '<circle r="' + (r + c * 0.06) + '" fill="none"' : (sh === 'cone' ? '<circle r="' + (r + c * 0.06) + '" fill="none"' : (sh === 'ellipse' ? '<ellipse rx="' + (w / 2 + c * 0.06) + '" ry="' + (h / 2 + c * 0.06) + '" fill="none"' : '<rect x="' + (-w / 2 - c * 0.06) + '" y="' + (-h / 2 - c * 0.06) + '" width="' + (w + c * 0.12) + '" height="' + (h + c * 0.12) + '" fill="none"'));
        selEl = bb + ' stroke="#5EE1F5" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>';
      }
      return '<g data-id="' + o.id + '" class="mp-ob" transform="' + tf + '"' + (o.hidden ? ' opacity="0.45"' : '') + '>' + body + lab + selEl + '</g>';
    }
    function tokSvg(o, k) {
      var d = o.data || {}, c = cell(), s = Math.max(0.5, num(d.s, 1)), size = s * c, r = size / 2, col = esc(d.col || '#5EE1F5');
      var x = ox() + num(d.x, 0) * c, y = oy() + num(d.y, 0) * c, u = d.img ? urls[d.img] : '', mine = o.owner === uid && !owner;
      if (d.img && !u) urlOf(d.img);
      var face = u ? '<clipPath id="cp' + k + '"><circle cx="' + r + '" cy="' + r + '" r="' + (r - c * 0.05) + '"/></clipPath><image href="' + esc(u) + '" x="' + c * 0.05 + '" y="' + c * 0.05 + '" width="' + (size - c * 0.1) + '" height="' + (size - c * 0.1) + '" clip-path="url(#cp' + k + ')" preserveAspectRatio="xMidYMid slice"/>'
        : '<text x="' + r + '" y="' + (r + c * 0.1 * s) + '" text-anchor="middle" font-size="' + c * 0.36 * Math.min(s, 2) + '" font-weight="700" fill="' + col + '">' + esc(initials(d.n)) + '</text>';
      var x2 = d.dead ? '<path d="M' + r * 0.45 + ' ' + r * 0.45 + 'L' + r * 1.55 + ' ' + r * 1.55 + 'M' + r * 1.55 + ' ' + r * 0.45 + 'L' + r * 0.45 + ' ' + r * 1.55 + '" stroke="#FF5A5A" stroke-width="' + c * 0.09 + '" stroke-linecap="round"/>' : '';
      var hp = '';
      if (d.hp && num(d.hp.m, 0) > 0 && (owner || d.hs)) {
        var f = clamp(num(d.hp.v, 0) / num(d.hp.m, 1), 0, 1);
        hp = '<rect x="' + size * 0.1 + '" y="' + (size - c * 0.02) + '" width="' + size * 0.8 + '" height="' + c * 0.11 + '" rx="' + c * 0.05 + '" fill="#000" fill-opacity="0.7"/><rect x="' + size * 0.1 + '" y="' + (size - c * 0.02) + '" width="' + size * 0.8 * f + '" height="' + c * 0.11 + '" rx="' + c * 0.05 + '" fill="' + (f <= 0.25 ? '#FF6B6B' : (f <= 0.5 ? '#FFB86B' : '#6EE0A8')) + '"/>';
      }
      var nm = d.n && d.lab !== false ? '<text x="' + r + '" y="' + (size + c * (hp ? 0.4 : 0.3)) + '" text-anchor="middle" font-size="' + c * 0.26 + '" fill="#fff" stroke="#000" stroke-width="' + c * 0.07 + '" paint-order="stroke" stroke-linejoin="round">' + esc(d.n) + '</text>' : '';
      var seld = owner && sel === o.id ? '<circle cx="' + r + '" cy="' + r + '" r="' + (r + c * 0.08) + '" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>' : '';
      return '<g data-id="' + o.id + '" class="mp-tk' + (mine ? ' mine' : '') + '" transform="translate(' + x + ' ' + y + ')"' + (o.hidden ? ' opacity="0.45"' : '') + '>' +
        '<circle cx="' + r + '" cy="' + r + '" r="' + (r - c * 0.02) + '" fill="#131122"/>' + face + x2 +
        '<circle class="mp-ring" cx="' + r + '" cy="' + r + '" r="' + (r - c * 0.03) + '" fill="none" stroke="' + col + '" stroke-width="' + Math.max(2, c * 0.07) + '"' + (o.hidden ? ' stroke-dasharray="6 4"' : '') + '/>' + hp + nm + seld + '</g>';
    }
    function drawObjs() {
      if (dead) return;
      var list = Object.keys(objs).map(function (k) { return objs[k]; }).filter(function (o) { return !o.gone && (owner || !o.hidden); }).sort(function (a, b) { return a.seq - b.seq; });
      var skip = drag && drag.id;
      $('#mp-obj').innerHTML = list.filter(function (o) { return o.kind === 'obj'; }).map(objSvg).join('');
      var k = 0;
      $('#mp-tok').innerHTML = list.filter(function (o) { return o.kind === 'tok'; }).map(function (o) { return tokSvg(o, k++); }).join('');
      if (skip) { var g = svg.querySelector('[data-id="' + skip + '"]'); if (g) g.setAttribute('opacity', '0.35'); }
    }
    function drawRuler() {
      var g = $('#mp-rul'), rd = $('#mp-read');
      if (!ruler || ruler.pts.length < 1) { g.innerHTML = ''; rd.hidden = !msgText; rd.textContent = msgText; return; }
      var c = cell(), P = ruler.pts.map(function (p) { return [ox() + p[0] * c, oy() + p[1] * c]; });
      var h = '<polyline points="' + P.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#5EE1F5" stroke-width="3" stroke-dasharray="9 6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
      P.forEach(function (p, i) { h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i ? 5 : 7) + '" fill="' + (i ? '#0A0912' : '#5EE1F5') + '" stroke="#5EE1F5" stroke-width="2" vector-effect="non-scaling-stroke"/>'; });
      g.innerHTML = h;
      var t = dist(pathSq(ruler.pts, cfg().diag || 's'));
      rd.hidden = false; rd.textContent = t;
    }
    function applyView() { $('#mp-w').setAttribute('transform', 'translate(' + view.x + ' ' + view.y + ') scale(' + view.k + ')'); }
    function fit() {
      if (!map) return;
      var W = num(cfg().w, 1000), H = num(cfg().h, 1000), r = svg.getBoundingClientRect();
      if (!r.width) return;
      var left = owner && panelOpen && r.width > 700 ? Math.min(350, r.width * 0.94) : 0, aw = r.width - left;
      var k = Math.min((aw - 16) / W, (r.height - 16) / H);
      view = { k: k, x: left + (aw - W * k) / 2, y: (r.height - H * k) / 2 };
      applyView();
    }
    function zoomAt(f, px, py) {
      var k = clamp(view.k * f, 0.05, 8), w = toWorld(px, py);
      view.k = k; view.x = px - w[0] * k; view.y = py - w[1] * k; applyView();
    }

    /* ---------- barra e painel ---------- */
    function bar() {
      var b = $('#mp-bar');
      var h = '<button type="button" class="mp-b" data-t="move" aria-pressed="' + (tool === 'move') + '" title="Mover e arrastar">' + ICON.hand + '<span>Mover</span></button>' +
        '<button type="button" class="mp-b" data-t="ruler" aria-pressed="' + (tool === 'ruler') + '" title="Medir distância. Arraste, ou toque para criar curvas">' + ICON.ruler + '<span>Régua</span></button>';
      if (owner) h += '<button type="button" class="mp-b" data-t="grid" aria-pressed="' + (tool === 'grid') + '" title="Arraste para alinhar a grade com o mapa">' + ICON.grid + '<span>Alinhar grade</span></button>';
      h += '<span class="sp"></span>';
      if (!owner) h += '<button type="button" class="mp-b" data-a="me" title="Ir até o meu personagem">' + ICON.me + '<span>Meu personagem</span></button>';
      h += '<button type="button" class="mp-b sq" data-a="zout" aria-label="Menos zoom">' + ICON.minus + '</button><button type="button" class="mp-b sq" data-a="zin" aria-label="Mais zoom">' + ICON.plus + '</button><button type="button" class="mp-b sq" data-a="fit" aria-label="Ajustar à tela">' + ICON.fit + '</button>';
      if (owner) h += '<button type="button" class="mp-b" data-a="panel" aria-pressed="' + panelOpen + '">' + ICON.tools + '<span>Ferramentas</span></button>';
      b.innerHTML = h;
    }
    function empty() {
      var e = $('#mp-empty'), nm = $('#mp-name');
      if (map) { e.hidden = true; nm.hidden = false; nm.textContent = map.name; return; }
      nm.hidden = true; e.hidden = false;
      e.innerHTML = owner ? '<b>Nenhum mapa ainda</b><span>Abra as Ferramentas e envie a imagem de um mapa. A grade é desenhada por cima.</span>' : '<b>Sem mapa na mesa</b><span>O Mestre ainda não mostrou um mapa.</span>';
    }
    function selObj() { return sel && objs[sel] && !objs[sel].gone ? objs[sel] : null; }
    function panel() {
      if (!owner) return;
      var p = $('#mp-side'); p.hidden = !panelOpen;
      if (!panelOpen) return;
      var c = cfg(), h = '';
      h += '<div class="mp-sec"><h3>Mapas</h3><div class="mp-row"><label>Mapa<select data-f="map">' + (maps.length ? maps.map(function (m) { return '<option value="' + m.id + '"' + (map && map.id === m.id ? ' selected' : '') + '>' + esc(m.name) + (m.shown ? ' (na mesa)' : '') + '</option>'; }).join('') : '<option value="">Nenhum</option>') + '</select></label></div>' +
        '<div class="mp-row"><label class="mp-b pri" style="flex:none;cursor:pointer">' + ICON.plus + '<span>Novo mapa</span><input type="file" accept="image/*" data-f="newmap" hidden></label>' +
        (map ? '<button type="button" class="mp-b" data-a="shown" aria-pressed="' + !!map.shown + '">' + (map.shown ? 'Esconder dos jogadores' : 'Mostrar aos jogadores') + '</button>' : '') + '</div>' +
        (map ? '<div class="mp-row"><label>Nome<input type="text" data-f="mname" maxlength="80" value="' + esc(map.name) + '"></label></div><div class="mp-row"><button type="button" class="mp-b bad" data-a="delmap">Apagar este mapa</button></div>' : '') +
        '<p class="mp-hint">' + (map && map.shown ? 'Os jogadores estão vendo este mapa.' : 'Só você vê este mapa até mostrá-lo aos jogadores.') + '</p></div>';
      if (map) {
        h += '<div class="mp-sec"><h3>Grade</h3><div class="mp-row"><label>Quadrados na largura<input type="number" min="3" max="400" step="1" data-f="cols" value="' + plain(num(c.w, 1000) / cell()) + '"></label><label>Quadrado (px)<input type="number" min="4" max="1000" step="0.5" data-f="cell" value="' + plain(cell()) + '"></label></div>' +
          '<div class="mp-row"><div class="mp-nudge"><span></span><button type="button" class="mp-b sq" data-n="0,-1" aria-label="Grade para cima">▲</button><span></span><button type="button" class="mp-b sq" data-n="-1,0" aria-label="Grade para a esquerda">◀</button><button type="button" class="mp-b sq" data-n="0,1" aria-label="Grade para baixo">▼</button><button type="button" class="mp-b sq" data-n="1,0" aria-label="Grade para a direita">▶</button></div><p class="mp-hint" style="flex:1 1 140px">Ajuste fino da grade, 1 px por toque. Ou use “Alinhar grade” e arraste.</p></div>' +
          '<div class="mp-row"><label>Cada quadrado vale<input type="number" min="0.1" step="0.5" data-f="per" value="' + num(c.per, 1.5) + '"></label><label>Unidade<select data-f="unit"><option value="m"' + (c.unit !== 'ft' && c.unit !== 'q' ? ' selected' : '') + '>metros</option><option value="ft"' + (c.unit === 'ft' ? ' selected' : '') + '>pés</option><option value="q"' + (c.unit === 'q' ? ' selected' : '') + '>só quadrados</option></select></label></div>' +
          '<div class="mp-row"><label>Diagonais<select data-f="diag"><option value="s"' + (c.diag !== 'a' && c.diag !== 'r' ? ' selected' : '') + '>contam 1 quadrado</option><option value="a"' + (c.diag === 'a' ? ' selected' : '') + '>alternadas (1, 2, 1…)</option><option value="r"' + (c.diag === 'r' ? ' selected' : '') + '>reais (em linha reta)</option></select></label></div>' +
          '<div class="mp-row"><label class="mp-chk"><input type="checkbox" data-f="gshow"' + (c.grid !== false ? ' checked' : '') + '> Mostrar a grade</label></div>' +
          '<div class="mp-row"><label>Cor da grade<input type="color" data-f="gcol" value="' + esc(c.gcol || '#ffffff') + '"></label><label>Força<input type="range" min="0.05" max="1" step="0.05" data-f="gop" value="' + clamp(num(c.gop, 0.35), 0.05, 1) + '"></label></div></div>';
        h += '<div class="mp-sec"><h3>Adicionar ao mapa</h3><div class="mp-chips">' + PRESETS.map(function (pr, i) { return '<button type="button" class="mp-b" data-pre="' + i + '"><i class="mp-sw" style="background:' + pr.col + '"></i>' + esc(pr.n) + '</button>'; }).join('') + '</div>' +
          '<div class="mp-row"><button type="button" class="mp-b" data-a="addtok">' + ICON.plus + 'Token novo</button><button type="button" class="mp-b" data-a="addpl">Jogadores no mapa</button></div></div>';
        h += selPanel();
      }
      p.innerHTML = h;
    }
    function colRow(cur, f) { return '<div class="mp-cols">' + COLORS.map(function (cl) { return '<button type="button" style="background:' + cl + '" data-col="' + cl + '" data-cf="' + f + '" aria-pressed="' + (String(cur).toLowerCase() === cl.toLowerCase()) + '" aria-label="Cor ' + cl + '"></button>'; }).join('') + '</div>'; }
    function selPanel() {
      var o = selObj();
      if (!o) return '<div class="mp-sec"><h3>Selecionado</h3><p class="mp-hint">Toque num token ou objeto do mapa para editar. Arraste para mover.</p></div>';
      var d = o.data || {}, h = '<div class="mp-sec"><h3>' + (o.kind === 'tok' ? 'Token' : 'Objeto') + ' selecionado</h3>';
      h += '<div class="mp-row"><label>Nome<input type="text" data-d="n" maxlength="40" value="' + esc(d.n || '') + '"></label></div>';
      if (o.kind === 'tok') {
        var mem = (ctx.party ? ctx.party() : []).filter(function (m) { return !m.mestre; });
        h += '<div class="mp-row"><label>Tamanho<select data-d="s">' + [0.5, 1, 2, 3, 4].map(function (s) { return '<option value="' + s + '"' + (num(d.s, 1) === s ? ' selected' : '') + '>' + (s === 0.5 ? 'minúsculo' : (s === 1 ? '1 quadrado' : s + ' × ' + s)) + '</option>'; }).join('') + '</select></label>' +
          '<label>Quem move<select data-o="1"><option value="">Só o Mestre</option>' + mem.map(function (m) { return '<option value="' + m.user_id + '"' + (o.owner === m.user_id ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select></label></div>' + colRow(d.col || COLORS[0], 'col') +
          '<div class="mp-row"><label class="mp-b" style="cursor:pointer">Miniatura<input type="file" accept="image/*" data-f="tokimg" hidden></label>' + (d.img ? '<button type="button" class="mp-b" data-a="tokimgx">Tirar a imagem</button>' : '') + '</div>' +
          '<div class="mp-row"><label>Vida<input type="number" min="0" step="1" data-hp="v" value="' + (d.hp ? num(d.hp.v, 0) : '') + '"></label><label>Máx.<input type="number" min="0" step="1" data-hp="m" value="' + (d.hp ? num(d.hp.m, 0) : '') + '"></label></div>' +
          '<div class="mp-row"><label class="mp-chk"><input type="checkbox" data-dc="hs"' + (d.hs ? ' checked' : '') + '> Jogadores veem a vida</label></div><div class="mp-row"><label class="mp-chk"><input type="checkbox" data-dc="dead"' + (d.dead ? ' checked' : '') + '> Derrotado</label></div>';
      } else {
        var sh = d.sh || 'rect';
        h += '<div class="mp-row"><label>Forma<select data-d="sh">' + Object.keys(SHAPES).map(function (k) { return '<option value="' + k + '"' + (sh === k ? ' selected' : '') + '>' + SHAPES[k] + '</option>'; }).join('') + '</select></label><label>Textura<select data-d="pat">' + PATS.map(function (x) { return '<option value="' + x[0] + '"' + ((d.pat || 'solid') === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label></div>';
        if (sh === 'circle' || sh === 'cone') h += '<div class="mp-row"><label>Raio (quadrados)<input type="number" min="0.5" step="0.5" data-d="r" value="' + num(d.r, 1) + '"></label></div>';
        else h += '<div class="mp-row"><label>Largura<input type="number" min="0.25" step="0.25" data-d="w" value="' + num(d.w, 1) + '"></label><label>Altura<input type="number" min="0.25" step="0.25" data-d="h" value="' + num(d.h, 1) + '"></label></div>';
        if (sh !== 'circle') h += '<div class="mp-row"><label>Giro: ' + Math.round(num(d.rot, 0)) + '°<input type="range" min="0" max="345" step="15" data-d="rot" value="' + num(d.rot, 0) + '"></label></div>';
        h += colRow(d.col || '#B07A45', 'col') + '<div class="mp-row"><label>Opacidade<input type="range" min="0.1" max="1" step="0.05" data-d="op" value="' + clamp(num(d.op, 1), 0.1, 1) + '"></label></div>' +
          '<div class="mp-row"><label class="mp-chk"><input type="checkbox" data-dc="lk"' + (d.lk ? ' checked' : '') + '> Travar (não arrasta sem querer)</label></div>';
      }
      h += '<div class="mp-row"><button type="button" class="mp-b" data-a="hide" aria-pressed="' + !!o.hidden + '">' + (o.hidden ? 'Escondido dos jogadores' : 'Esconder dos jogadores') + '</button><button type="button" class="mp-b" data-a="dup">Duplicar</button><button type="button" class="mp-b bad" data-a="del">Apagar</button></div></div>';
      return h;
    }
    function refresh() { bar(); empty(); panel(); }

    /* ---------- dados ---------- */
    function ingest(rows) {
      var ch = false;
      rows.forEach(function (r) {
        var old = objs[r.id], hold = (pend[r.id] || (busy[r.id] && busy[r.id] > Date.now())) && old;
        if (r.seq > seq) seq = r.seq;
        if (hold) return;
        if (r.gone) { if (old) { delete objs[r.id]; ch = true; if (sel === r.id) sel = null; } return; }
        objs[r.id] = { id: r.id, kind: r.kind, data: r.data || {}, owner: r.owner, hidden: !!r.hidden, gone: false, seq: r.seq };
        ch = true;
      });
      return ch;
    }
    async function pollObjs() {
      if (!map || dead) return;
      var mid = map.id, q = '/rest/v1/map_objs?map_id=eq.' + mid + '&select=id,kind,data,owner,hidden,gone,seq&order=seq.asc&limit=1000' + (seq ? '&seq=gt.' + seq : '&gone=eq.false');
      try {
        var rows = await j(q);
        if (!map || map.id !== mid || dead) return;
        var ch = ingest(rows || []);
        if (Date.now() - lastFull > 20000) {
          lastFull = Date.now();
          var ids = await j('/rest/v1/map_objs?map_id=eq.' + mid + '&select=id&gone=eq.false&limit=1000');
          if (map && map.id === mid && ids) { var keep = {}; ids.forEach(function (x) { keep[x.id] = 1; }); Object.keys(objs).forEach(function (k) { if (!keep[k] && !pend[k]) { delete objs[k]; ch = true; } }); }
        }
        if (ch) { drawObjs(); if (owner && sel && !objs[sel]) { sel = null; panel(); } }
      } catch (e) { /* tenta no próximo ciclo */ }
    }
    async function loadMaps() {
      try {
        var rows = await j('/rest/v1/maps?campaign_id=eq.' + cid + '&select=id,name,img,cfg,shown,updated_at&order=created_at.asc');
        maps = rows || [];
        var want = map && maps.filter(function (m) { return m.id === map.id; })[0];
        if (!want) want = owner ? (maps.filter(function (m) { return m.shown; })[0] || maps[0]) : maps.filter(function (m) { return m.shown; })[0];
        if (want && (!map || want.id !== map.id)) setMap(want);
        else if (want && map && want.id === map.id) { var changed = JSON.stringify(want.cfg) !== JSON.stringify(map.cfg) || want.img !== map.img || want.name !== map.name; map = want; if (changed && !owner) { drawBase(); drawObjs(); } }
        else if (!want) { setMap(null); }
        refresh();
      } catch (e) { /* tenta no próximo ciclo */ }
    }
    function setMap(m) {
      if (map) views[map.id] = view;
      map = m; objs = {}; seq = 0; sel = null; ruler = null; lastFull = 0; pend = {};
      drawBase(); drawObjs(); drawRuler();
      if (m) { if (m.img) urlOf('mapas/' + m.img); if (views[m.id]) { view = views[m.id]; applyView(); } else setTimeout(fit, 0); pollObjs(); }
      refresh();
    }

    /* ---------- escrita ---------- */
    var sendT = {};
    function queue(id, p) {
      var o = objs[id]; if (!o) return;
      o.data = Object.assign({}, o.data, p);
      pend[id] = Object.assign(pend[id] || {}, p);
      busy[id] = Date.now() + 2500;
      clearTimeout(sendT[id]);
      sendT[id] = setTimeout(function () { flush(id); }, 350);
      drawObjs();
    }
    async function flush(id) {
      var p = pend[id]; if (!p) return;
      delete pend[id];
      try { await post('/rest/v1/rpc/patch_obj', { oid: id, p: p }); } catch (e) { ctx.toast('Não consegui salvar a mudança no mapa.', 'bad'); }
      busy[id] = Date.now() + 2500;
    }
    function viewCenterCell() { var r = svg.getBoundingClientRect(), c = toCell(r.width / 2, r.height / 2), w = num(cfg().w, 1000) / cell(), h = num(cfg().h, 1000) / cell(); return [clamp(Math.round(c[0]), 0, Math.max(0, Math.floor(w) - 1)), clamp(Math.round(c[1]), 0, Math.max(0, Math.floor(h) - 1))]; }
    function free(x, y, s) { var t = Object.keys(objs).map(function (k) { return objs[k]; }).filter(function (o) { return o.kind === 'tok' && !o.gone; }); for (var n = 0; n < 40; n++) { var ring = Math.ceil(n / 4), px = x + (n % 4 === 1 ? ring : (n % 4 === 3 ? -ring : 0)), py = y + (n % 4 === 0 ? ring : (n % 4 === 2 ? -ring : 0)); if (!t.some(function (o) { return Math.abs(num(o.data.x, 0) - px) < 1 && Math.abs(num(o.data.y, 0) - py) < 1; })) return [px, py]; } return [x, y]; }
    async function create(kind, data, ownerId, hidden) {
      if (!map) return null;
      var o = { id: uuid(), kind: kind, data: data, owner: ownerId || null, hidden: !!hidden, gone: false, seq: 1e15 };
      objs[o.id] = o; busy[o.id] = Date.now() + 2500; sel = o.id; drawObjs(); panel();
      try { await post('/rest/v1/map_objs', { id: o.id, map_id: map.id, campaign_id: cid, kind: kind, data: data, owner: o.owner, hidden: o.hidden }); }
      catch (e) { delete objs[o.id]; if (sel === o.id) sel = null; drawObjs(); panel(); ctx.toast('Não consegui adicionar ao mapa.', 'bad'); return null; }
      return o;
    }
    function addPreset(i) {
      var pr = PRESETS[i], c = viewCenterCell(), d = { n: pr.n, sh: pr.sh, col: pr.col, pat: pr.pat, op: pr.op || 1, rot: 0, lab: true };
      if (pr.sh === 'circle' || pr.sh === 'cone') { d.r = pr.r; d.x = c[0]; d.y = c[1]; } else { d.w = pr.w; d.h = pr.h; d.x = c[0]; d.y = c[1]; }
      create('obj', d, null, false);
    }
    function addToken() {
      var c = viewCenterCell(), p = free(c[0], c[1], 1);
      create('tok', { n: 'Token', x: p[0], y: p[1], s: 1, col: COLORS[4] }, null, false);
    }
    function addPlayers() {
      var have = {}; Object.keys(objs).forEach(function (k) { if (objs[k].kind === 'tok' && objs[k].owner) have[objs[k].owner] = 1; });
      var members = (ctx.party ? ctx.party() : []).filter(function (m) { return !m.mestre && !have[m.user_id]; });
      if (!members.length) { ctx.toast('Todos os jogadores já estão no mapa.', ''); return; }
      var c = viewCenterCell(), i = 0;
      members.forEach(function (m, n) {
        var inf = m.info || {}, p = free(c[0] + n, c[1], 1), col = COLORS[(Object.keys(have).length + n) % COLORS.length];
        create('tok', { n: (inf.c || m.name || 'Jogador').slice(0, 40), x: p[0], y: p[1], s: 1, col: col, hs: true, img: inf.p ? 'players/' + inf.p : '' }, m.user_id, false);
      });
    }
    async function setCfg(p, soft) {
      if (!map) return;
      map.cfg = Object.assign({}, map.cfg, p);
      var m = maps.filter(function (x) { return x.id === map.id; })[0]; if (m) m.cfg = map.cfg;
      drawBase(); drawObjs(); drawRuler();
      clearTimeout(saveT);
      var id = map.id, body = map.cfg;
      saveT = setTimeout(function () { patch('/rest/v1/maps?id=eq.' + id, { cfg: body }).catch(function () { ctx.toast('Não consegui salvar a grade.', 'bad'); }); }, soft ? 500 : 150);
    }
    function shrink(file, max, q) {
      return new Promise(function (res, rej) {
        var u = URL.createObjectURL(file), im = new Image();
        im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) { URL.revokeObjectURL(u); b ? res({ blob: b, w: c.width, h: c.height }) : rej(new Error('img')); }, 'image/jpeg', q);
        };
        im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('img')); };
        im.src = u;
      });
    }
    async function upload(path, blob) {
      var r = await api('/storage/v1/object/mapas/' + path, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob });
      if (!r.ok) throw new Error('upload');
    }
    async function newMap(file) {
      ctx.toast('Enviando o mapa…', '');
      try {
        var s = await shrink(file, 4096, 0.86), id = uuid(), path = cid + '/m-' + id + '.jpg';
        await upload(path, s.blob);
        var name = String(file.name || 'Mapa').replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'Mapa';
        var c = { w: s.w, h: s.h, cell: Math.max(8, Math.round(s.w / 30)), ox: 0, oy: 0, per: 1.5, unit: 'm', diag: 's', grid: true, gcol: '#ffffff', gop: 0.35 };
        var rows = await post('/rest/v1/maps', { id: id, campaign_id: cid, name: name, img: path, cfg: c }, { Prefer: 'return=representation' });
        var m = rows && rows[0] ? rows[0] : { id: id, name: name, img: path, cfg: c, shown: false };
        urls['mapas/' + path] = URL.createObjectURL(s.blob);
        maps.push(m); setMap(m);
        ctx.toast('Mapa enviado. Ajuste a grade nas Ferramentas.', 'good');
      } catch (e) { ctx.toast('Não consegui enviar o mapa.', 'bad'); }
    }
    async function tokImage(file) {
      var o = selObj(); if (!o) return;
      try {
        var s = await shrink(file, 256, 0.85), path = cid + '/t-' + uuid().slice(0, 8) + '.jpg';
        await upload(path, s.blob);
        urls['mapas/' + path] = URL.createObjectURL(s.blob);
        queue(o.id, { img: 'mapas/' + path }); panel();
      } catch (e) { ctx.toast('Não consegui usar esta imagem.', 'bad'); }
    }
    async function setShown() {
      if (!map) return;
      var on = !map.shown;
      try {
        await post('/rest/v1/rpc/set_map', { cid: cid, mid: on ? map.id : null });
        maps.forEach(function (m) { m.shown = on && m.id === map.id; }); map.shown = on;
        ctx.toast(on ? 'Os jogadores agora veem este mapa.' : 'Mapa escondido dos jogadores.', on ? 'good' : '');
        panel();
      } catch (e) { ctx.toast('Não consegui mudar o mapa da mesa.', 'bad'); }
    }
    async function delMap() {
      if (!map) return;
      if (!delMap.arm) { delMap.arm = true; ctx.toast('Toque em “Apagar este mapa” de novo para confirmar.', ''); setTimeout(function () { delMap.arm = false; }, 4000); return; }
      delMap.arm = false;
      var m = map;
      try {
        await j('/rest/v1/maps?id=eq.' + m.id, { method: 'DELETE' });
        if (m.img) api('/storage/v1/object/mapas/' + m.img, { method: 'DELETE' }).catch(function () { /* ok */ });
        maps = maps.filter(function (x) { return x.id !== m.id; }); map = null;
        setMap(maps[0] || null);
      } catch (e) { ctx.toast('Não consegui apagar o mapa.', 'bad'); }
    }
    async function delObj() {
      var o = selObj(); if (!o) return;
      o.gone = true; delete objs[o.id]; sel = null; drawObjs(); panel();
      try { await patch('/rest/v1/map_objs?id=eq.' + o.id, { gone: true }); } catch (e) { ctx.toast('Não consegui apagar.', 'bad'); pollObjs(); }
    }
    async function setHidden() {
      var o = selObj(); if (!o) return;
      o.hidden = !o.hidden; busy[o.id] = Date.now() + 2500; drawObjs(); panel();
      try { await patch('/rest/v1/map_objs?id=eq.' + o.id, { hidden: o.hidden }); } catch (e) { ctx.toast('Não consegui mudar a visibilidade.', 'bad'); }
    }
    async function setOwner(v) {
      var o = selObj(); if (!o) return;
      o.owner = v || null; busy[o.id] = Date.now() + 2500; drawObjs();
      try { await patch('/rest/v1/map_objs?id=eq.' + o.id, { owner: o.owner }); } catch (e) { ctx.toast('Não consegui mudar quem move.', 'bad'); }
    }
    function dup() {
      var o = selObj(); if (!o) return;
      var d = JSON.parse(JSON.stringify(o.data)); d.x = num(d.x, 0) + 1; d.y = num(d.y, 0) + 1;
      var m = /^(.*?)(?: (\d+))?$/.exec(d.n || ''); if (o.kind === 'tok' && m && m[1]) d.n = m[1] + ' ' + ((parseInt(m[2], 10) || 1) + 1);
      create(o.kind, d, o.kind === 'tok' ? null : o.owner, o.hidden);
    }
    async function moveTo(o, x, y) {
      var from = [num(o.data.x, 0), num(o.data.y, 0)];
      o.data = Object.assign({}, o.data, { x: x, y: y }); busy[o.id] = Date.now() + 2500; drawObjs();
      try { await post('/rest/v1/rpc/move_obj', { oid: o.id, nx: x, ny: y }); }
      catch (e) { o.data = Object.assign({}, o.data, { x: from[0], y: from[1] }); drawObjs(); ctx.toast(e.status === 403 ? 'Você só pode mover o seu personagem.' : 'Não consegui mover agora.', 'bad'); }
    }

    /* ---------- ponteiro ---------- */
    function snapPt(px, py, center) { var c = toCell(px, py); return center ? [Math.floor(c[0]) + 0.5, Math.floor(c[1]) + 0.5] : [Math.round(c[0]), Math.round(c[1])]; }
    function pinchStart() {
      var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]];
      gest = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k: view.k, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, vx: view.x, vy: view.y };
      mode = 'pinch'; drag = null; svg.classList.remove('dragging'); drawObjs();
    }
    svg.addEventListener('pointerdown', function (e) {
      if (!map) return;
      var p = rel(e); pts[e.pointerId] = p;
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      if (Object.keys(pts).length === 2) { pinchStart(); return; }
      if (Object.keys(pts).length > 2) return;
      var hit = e.target.closest ? e.target.closest('[data-id]') : null, o = hit ? objs[hit.getAttribute('data-id')] : null;
      if (e.button === 1) { mode = 'pan'; gest = { sx: p[0], sy: p[1], vx: view.x, vy: view.y }; return; }
      if (tool === 'ruler') {
        var s = snapPt(p[0], p[1], true);
        mode = 'ruler'; msgText = '';
        rdown = { x: p[0], y: p[1], s: s, moved: false, had: !!(ruler && ruler.keep) };
        if (!rdown.had) ruler = { pts: [s, s], keep: false };
        drawRuler(); return;
      }
      if (tool === 'grid' && owner) { mode = 'gridmove'; gest = { sx: p[0], sy: p[1], ox: ox(), oy: oy() }; svg.classList.add('dragging'); return; }
      if (o) {
        if (owner && sel !== o.id) { sel = o.id; drawObjs(); panel(); }
        if (canMove(o) && !(o.data && o.data.lk)) {
          var c = toCell(p[0], p[1]);
          mode = 'drag'; drag = { id: o.id, kind: o.kind, sx: p[0], sy: p[1], x0: num(o.data.x, 0), y0: num(o.data.y, 0), go: c, started: false, sz: o.kind === 'tok' ? Math.max(0.5, num(o.data.s, 1)) : 1 };
          return;
        }
        mode = 'tap'; return;
      }
      mode = 'pan'; gest = { sx: p[0], sy: p[1], vx: view.x, vy: view.y, moved: false };
    });
    svg.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      var p = rel(e); pts[e.pointerId] = p;
      if (mode === 'pinch') {
        var k = Object.keys(pts); if (k.length < 2) return;
        var a = pts[k[0]], b = pts[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        var nk = clamp(gest.k * d / gest.d, 0.05, 8), w = [(gest.mx - gest.vx) / gest.k, (gest.my - gest.vy) / gest.k];
        view.k = nk; view.x = mx - w[0] * nk; view.y = my - w[1] * nk; applyView(); return;
      }
      if (mode === 'pan') {
        if (Math.abs(p[0] - gest.sx) + Math.abs(p[1] - gest.sy) > 4) gest.moved = true;
        view.x = gest.vx + p[0] - gest.sx; view.y = gest.vy + p[1] - gest.sy; applyView(); return;
      }
      if (mode === 'gridmove') {
        var dx = (p[0] - gest.sx) / view.k, dy = (p[1] - gest.sy) / view.k;
        map.cfg = Object.assign({}, map.cfg, { ox: Math.round(gest.ox + dx), oy: Math.round(gest.oy + dy) }); drawBase(); drawObjs(); return;
      }
      if (mode === 'ruler' && ruler && rdown) {
        var s = snapPt(p[0], p[1], true);
        if (!rdown.moved && Math.abs(p[0] - rdown.x) + Math.abs(p[1] - rdown.y) > 6) { rdown.moved = true; if (rdown.had) { ruler = { pts: [rdown.s, s], keep: false }; } }
        if (rdown.moved) { ruler.pts[ruler.pts.length - 1] = s; drawRuler(); }
        return;
      }
      if (mode === 'drag' && drag) {
        if (!drag.started && Math.abs(p[0] - drag.sx) + Math.abs(p[1] - drag.sy) < 5) return;
        var o = objs[drag.id]; if (!o) return;
        if (!drag.started) { drag.started = true; svg.classList.add('dragging'); }
        var c = toCell(p[0], p[1]), nx = drag.x0 + (c[0] - drag.go[0]), ny = drag.y0 + (c[1] - drag.go[1]), st = o.kind === 'tok' ? 1 : 0.5;
        nx = Math.round(nx / st) * st; ny = Math.round(ny / st) * st;
        o.data = Object.assign({}, o.data, { x: nx, y: ny });
        if (o.kind === 'tok') { var h = drag.sz / 2; ruler = { pts: [[drag.x0 + h, drag.y0 + h], [nx + h, ny + h]], keep: false }; }
        var g = svg.querySelector('[data-id="' + o.id + '"]');
        if (g) { drawObjs(); g = svg.querySelector('[data-id="' + o.id + '"]'); if (g) g.setAttribute('opacity', '0.75'); }
        drawRuler();
      }
    });
    function endPtr(e) {
      if (!pts[e.pointerId]) return;
      var p = rel(e); delete pts[e.pointerId];
      try { svg.releasePointerCapture(e.pointerId); } catch (x) { /* ok */ }
      if (mode === 'pinch') { if (Object.keys(pts).length < 2) { mode = null; gest = null; } return; }
      svg.classList.remove('dragging');
      if (mode === 'gridmove') { setCfg({ ox: ox(), oy: oy() }); panel(); }
      else if (mode === 'ruler' && ruler && rdown) {
        if (!rdown.moved && rdown.had) {
          var a0 = ruler.pts[0], a1 = ruler.pts[1];
          if (ruler.pts.length === 2 && a0[0] === a1[0] && a0[1] === a1[1]) ruler.pts[1] = rdown.s; else ruler.pts.push(rdown.s);
        }
        ruler.keep = true; rdown = null; drawRuler();
      }
      else if (mode === 'drag' && drag) {
        var o = objs[drag.id], d = drag; drag = null;
        if (o && d.started) {
          var nx = num(o.data.x, 0), ny = num(o.data.y, 0); o.data = Object.assign({}, o.data, { x: d.x0, y: d.y0 });
          moveTo(o, nx, ny);
          var keepR = ruler; setTimeout(function () { if (ruler === keepR) { ruler = null; drawRuler(); } }, 1400);
        } else if (o) drawObjs();
      }
      else if (mode === 'pan' && gest && !gest.moved) { if (owner && sel) { sel = null; drawObjs(); panel(); } if (ruler) { ruler = null; drawRuler(); } }
      mode = null; gest = null;
    }
    svg.addEventListener('pointerup', endPtr);
    svg.addEventListener('pointercancel', endPtr);
    svg.addEventListener('wheel', function (e) { e.preventDefault(); var p = rel(e); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), p[0], p[1]); }, { passive: false });
    svg.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- cliques e campos ---------- */
    host.addEventListener('click', function (e) {
      var t = e.target.closest('[data-t],[data-a],[data-pre],[data-n],[data-col]');
      if (!t || !host.contains(t)) return;
      if (t.dataset.t) { tool = tool === t.dataset.t ? 'move' : t.dataset.t; ruler = null; msgText = tool === 'ruler' ? 'Arraste para medir. Toque em vários pontos para fazer curvas.' : ''; drawRuler(); svg.setAttribute('class', 'mp-svg' + (tool === 'ruler' ? ' ruler' : (tool === 'grid' ? ' grid' : ''))); bar(); return; }
      if (t.dataset.pre != null) { addPreset(parseInt(t.dataset.pre, 10)); return; }
      if (t.dataset.n) { var v = t.dataset.n.split(',').map(Number); setCfg({ ox: ox() + v[0], oy: oy() + v[1] }, true); return; }
      if (t.dataset.col) { var o = selObj(); if (o) { queue(o.id, { col: t.dataset.col }); panel(); } return; }
      var a = t.dataset.a, r = svg.getBoundingClientRect();
      if (a === 'zin') zoomAt(1.3, r.width / 2, r.height / 2);
      else if (a === 'zout') zoomAt(1 / 1.3, r.width / 2, r.height / 2);
      else if (a === 'fit') fit();
      else if (a === 'panel') { panelOpen = !panelOpen; bar(); panel(); }
      else if (a === 'me') {
        var mine = Object.keys(objs).map(function (k) { return objs[k]; }).filter(function (o) { return o.kind === 'tok' && o.owner === uid && !o.gone; })[0];
        if (!mine) { ctx.toast('O Mestre ainda não colocou o seu personagem no mapa.', ''); return; }
        var c = cell(), s = num(mine.data.s, 1); view.k = Math.max(view.k, 0.6); view.x = r.width / 2 - (ox() + (num(mine.data.x, 0) + s / 2) * c) * view.k; view.y = r.height / 2 - (oy() + (num(mine.data.y, 0) + s / 2) * c) * view.k; applyView();
      }
      else if (a === 'shown') setShown();
      else if (a === 'delmap') delMap();
      else if (a === 'addtok') addToken();
      else if (a === 'addpl') addPlayers();
      else if (a === 'del') delObj();
      else if (a === 'hide') setHidden();
      else if (a === 'dup') dup();
      else if (a === 'tokimgx') { var o2 = selObj(); if (o2) { queue(o2.id, { img: '' }); panel(); } }
    });
    function onField(e, final) {
      var t = e.target;
      if (t.dataset.f === 'newmap' || t.dataset.f === 'tokimg') { if (!final) return; var f = t.files && t.files[0]; t.value = ''; if (f) (t.dataset.f === 'newmap' ? newMap(f) : tokImage(f)); return; }
      if (t.dataset.f === 'map') { if (!final) return; var m = maps.filter(function (x) { return x.id === t.value; })[0]; if (m) setMap(m); return; }
      if (t.dataset.f === 'mname') { if (!map) return; map.name = t.value.trim().slice(0, 80) || 'Mapa'; $('#mp-name').textContent = map.name; clearTimeout(saveT); var id = map.id, nm = map.name; saveT = setTimeout(function () { patch('/rest/v1/maps?id=eq.' + id, { name: nm }).catch(function () { /* ok */ }); }, 600); return; }
      var cfgMap = { cols: function (v) { var n = clamp(num(v, 30), 3, 400); return { cell: Math.max(4, num(cfg().w, 1000) / n) }; }, cell: function (v) { return { cell: clamp(num(v, 70), 4, 1000) }; }, per: function (v) { return { per: Math.max(0.1, num(v, 1.5)) }; }, unit: function (v) { return { unit: v }; }, diag: function (v) { return { diag: v }; }, gcol: function (v) { return { gcol: v }; }, gop: function (v) { return { gop: num(v, 0.35) }; } };
      if (cfgMap[t.dataset.f]) {
        if (!isFinite(parseFloat(t.value)) && t.type === 'number') return;
        setCfg(cfgMap[t.dataset.f](t.value), true);
        var oc = host.querySelector('[data-f="cols"]'), ol = host.querySelector('[data-f="cell"]');
        if (t.dataset.f === 'cols' && ol && ol !== document.activeElement) ol.value = plain(cell());
        if (t.dataset.f === 'cell' && oc && oc !== document.activeElement) oc.value = plain(num(cfg().w, 1000) / cell());
        return;
      }
      if (t.dataset.f === 'gshow') { setCfg({ grid: t.checked }); return; }
      var o = selObj(); if (!o) return;
      if (t.dataset.d) {
        var k = t.dataset.d, v = t.value, p = {};
        if (k === 'n') p.n = v.slice(0, 40);
        else if (k === 'sh' || k === 'pat') p[k] = v;
        else { if (!isFinite(parseFloat(v))) return; p[k] = num(v, 1); if (k === 'rot') { var lb = t.parentNode; if (lb) lb.firstChild.nodeValue = 'Giro: ' + Math.round(p.rot) + '°'; } }
        queue(o.id, p); if (final && (k === 'sh')) panel(); return;
      }
      if (t.dataset.dc) { var q = {}; q[t.dataset.dc] = t.checked; queue(o.id, q); return; }
      if (t.dataset.hp) { var hp = Object.assign({ v: 0, m: 0 }, o.data.hp || {}); hp[t.dataset.hp] = Math.max(0, num(t.value, 0)); if (t.dataset.hp === 'm' && !hp.v) hp.v = hp.m; queue(o.id, { hp: hp }); return; }
      if (t.dataset.o) { if (final) setOwner(t.value); }
    }
    host.addEventListener('input', function (e) { onField(e, false); });
    host.addEventListener('change', function (e) { onField(e, true); });
    function onKey(e) {
      if (dead || !host.isConnected) return;
      var tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
      if (e.key === 'Escape') { if (ruler) { ruler = null; drawRuler(); } else if (sel) { sel = null; drawObjs(); panel(); } else if (ctx.onEsc) ctx.onEsc(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && owner && selObj()) { e.preventDefault(); delObj(); }
    }
    document.addEventListener('keydown', onKey);
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () { if (map && !views[map.id] && view.k === 1 && !view.x && !view.y) fit(); }) : null;
    if (ro) ro.observe(stage);

    /* ---------- partida ---------- */
    refresh();
    size();
    loadMaps();
    timers.push(setInterval(function () { size(); if (!document.hidden) pollObjs(); }, 2000));
    timers.push(setInterval(function () { if (!document.hidden && !owner) loadMaps(); }, 4000));
    function onVis() { if (!document.hidden) { pollObjs(); if (!owner) loadMaps(); } }
    document.addEventListener('visibilitychange', onVis);

    return {
      destroy: function () { dead = true; window.removeEventListener('resize', size); timers.forEach(clearInterval); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); if (ro) ro.disconnect(); Object.keys(sendT).forEach(function (id) { clearTimeout(sendT[id]); flush(id); }); },
      reload: function () { loadMaps(); },
      state: function () { return { map: map, objs: objs, view: view, tool: tool, sel: sel }; }
    };
  }

  window.HTMap = { mount: mount, segSq: segSq, pathSq: pathSq };
})();
