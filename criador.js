/* Hollow Table — assistente de criação de personagem (D&D 5e, regras de 2014).
   Usa window.DND5 (dnd5e-dados.js). HTCriador.open({ state, name, hasItems, onApply, onClose }) */
(function () {
  'use strict';
  const AT = [['for', 'FOR', 'Força'], ['des', 'DES', 'Destreza'], ['con', 'CON', 'Constituição'], ['int', 'INT', 'Inteligência'], ['sab', 'SAB', 'Sabedoria'], ['car', 'CAR', 'Carisma']];
  const ATN = {}; AT.forEach(function (a) { ATN[a[0]] = a[2]; });
  const SKL = [['acrobacia', 'Acrobacia', 'des'], ['adestrar', 'Adestrar Animais', 'sab'], ['arcanismo', 'Arcanismo', 'int'], ['atletismo', 'Atletismo', 'for'], ['atuacao', 'Atuação', 'car'], ['enganacao', 'Enganação', 'car'], ['furtividade', 'Furtividade', 'des'], ['historia', 'História', 'int'], ['intimidacao', 'Intimidação', 'car'], ['intuicao', 'Intuição', 'sab'], ['investigacao', 'Investigação', 'int'], ['medicina', 'Medicina', 'sab'], ['natureza', 'Natureza', 'int'], ['percepcao', 'Percepção', 'sab'], ['persuasao', 'Persuasão', 'car'], ['prestidigitacao', 'Prestidigitação', 'des'], ['religiao', 'Religião', 'int'], ['sobrevivencia', 'Sobrevivência', 'sab']];
  const SKN = {}; SKL.forEach(function (s) { SKN[s[0]] = s[1]; });
  const ALL_SK = SKL.map(function (s) { return s[0]; });
  const PB = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const ARR = [15, 14, 13, 12, 10, 8];
  const FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
  const PACT_N = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
  const PACT_L = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  const ALIGN = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'];
  const LISTN = { brd: 'Bardo', clr: 'Clérigo', drd: 'Druida', pal: 'Paladino', pat: 'Patrulheiro', fei: 'Feiticeiro', bru: 'Bruxo', mag: 'Mago', art: 'Artífice' };
  const SRCN = { PHB: 'Livro do Jogador', XGtE: 'Guia de Xanathar', TCoE: 'Caldeirão de Tasha', SCAG: 'Guia do Aventureiro da Costa da Espada', Volo: 'Guia de Volo', MToF: 'Tomo dos Inimigos de Mordenkainen', EEPC: 'Elemental Evil', DMG: 'Guia do Mestre', Tortle: 'Tortle Package', Locathah: 'Locathah Rising', WBtW: 'Wild Beyond the Witchlight', VRGtR: 'Guia de Van Richten', FToD: 'Tesouro dos Dragões de Fizban', SRD: 'SRD' };
  const STEPS = [['cls', 'Classe'], ['race', 'Espécie'], ['at', 'Atributos'], ['bg', 'Antecedente'], ['sk', 'Perícias'], ['feat', 'Habilidades'], ['eq', 'Equipamento'], ['sp', 'Magias'], ['fim', 'Revisão']];

  let D = null, IX = null, S = null, OPT = null, root = null, prevOverflow = '';
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const md = function (v) { return Math.floor((v - 10) / 2); };
  const sgn = function (n) { return n >= 0 ? '+' + n : String(n); };
  const fold = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  const mfmt = function (v) { return String(Math.round(v * 10) / 10).replace('.', ',') + ' m'; };
  const uniq = function (a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); };
  const d6 = function () { return 1 + Math.floor(Math.random() * 6); };

  function index() {
    if (IX) return;
    D = window.DND5;
    IX = { cls: {}, race: {}, bg: {}, feat: {}, sp: {}, w: {}, a: {}, g: {} };
    D.classes.forEach(function (c) { IX.cls[c.k] = c; });
    D.races.forEach(function (r) { IX.race[r.k] = r; });
    D.bgs.forEach(function (b) { IX.bg[b.k] = b; });
    D.feats.forEach(function (f) { IX.feat[f[0]] = f; });
    D.spells.forEach(function (s) { IX.sp[s[0]] = s; });
    D.weapons.forEach(function (w) { IX.w[w[0]] = w; });
    D.armors.forEach(function (a) { IX.a[a[0]] = a; });
    D.gear.forEach(function (g) { IX.g[g[0]] = g; });
    OPT = D.opts;
  }
  function fresh() {
    return { v: 1, step: 0, lvl: 1, cls: '', sub: '', race: '', sr: '', custom: false, m: 'pb', base: { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 }, arr: {}, rolls: [], ra: [], asi: {}, rfeat: { f: '', fa: '' }, lin: 'dv', rspat: 'car', bg: '', sk: {}, exp: [], lang: [], tool: {}, ch: {}, eq: { mode: 'kit', pick: [], w: {}, gold: null }, sp: { c: [], k: [], arc: {}, x: [], rc: [], sc: [] }, name: '', align: '', hpm: 'avg', hpr: [], add: true, q: '', spl: 0, spAll: false };
  }

  /* ---------- derivados ---------- */
  const C = function () { return IX.cls[S.cls] || null; };
  const SUB = function () { const c = C(); return c && S.lvl >= c.subLv ? (c.subs.filter(function (s) { return s.k === S.sub; })[0] || null) : null; };
  const R = function () { return IX.race[S.race] || null; };
  const SR = function () { const r = R(); if (!r || !r.subs.length) return null; if (r.subs.length === 1) return r.subs[0]; return r.subs.filter(function (s) { return s.k === S.sr; })[0] || null; };
  const BG = function () { return IX.bg[S.bg] || null; };
  const prof = function () { return 2 + Math.floor((S.lvl - 1) / 4); };
  function rget(k) { const r = R(), s = SR(); if (s && s[k] !== undefined) return s[k]; return r ? r[k] : undefined; }
  function rpair(k) { const r = R(), s = SR(); return [r && r[k], s && s[k]].filter(Boolean); }
  function rboth(k) { const r = R(), s = SR(); return [].concat((r && r[k]) || [], (s && s[k]) || []); }
  function asiLevels() { const c = C(); return c ? c.asi.filter(function (l) { return l <= S.lvl; }) : []; }
  /* bônus fixos e "vagas" de bônus livre da espécie */
  function raceFixed() {
    const r = R(), s = SR(), o = {};
    if (!r) return o;
    [r.asi, s && s.asi].forEach(function (a) { if (a) Object.keys(a).forEach(function (k) { o[k] = (o[k] || 0) + a[k]; }); });
    return o;
  }
  function raceSlots() {
    const r = R();
    if (!r) return [];
    const fx = raceFixed(), any = rboth('any');
    if (r.flex || S.custom) {
      if (r.flex || r.k === 'linhagem') return S.ra3 ? [1, 1, 1] : (r.k === 'linhagem' ? [2] : [2, 1]);
      const pos = Object.keys(fx).filter(function (k) { return fx[k] > 0; }).map(function (k) { return fx[k]; });
      return pos.concat(any).sort(function (a, b) { return b - a; });
    }
    return any;
  }
  function raceBonus() {
    const r = R(), o = {};
    if (!r) return o;
    const fx = raceFixed();
    const flexAll = r.flex || (S.custom && r.k !== 'linhagem');
    Object.keys(fx).forEach(function (k) { if (!flexAll || fx[k] < 0) o[k] = (o[k] || 0) + fx[k]; });
    raceSlots().forEach(function (v, i) { const k = S.ra[i]; if (k) o[k] = (o[k] || 0) + v; });
    return o;
  }
  function featsTaken() {
    const L = [];
    if (rget('feat') && S.rfeat.f) L.push(S.rfeat);
    asiLevels().forEach(function (l) { const a = S.asi[l]; if (a && a.t === 'feat' && a.f) L.push(a); });
    return L;
  }
  function hasFeat(k) { return featsTaken().some(function (f) { return f.f === k; }); }
  function baseScores() {
    if (S.m === 'arr') { const o = {}; AT.forEach(function (a) { o[a[0]] = S.arr[a[0]] || 8; }); return o; }
    if (S.m === 'roll') { const o = {}; AT.forEach(function (a) { const i = S.arr[a[0]]; o[a[0]] = i != null && S.rolls[i] ? S.rolls[i].t : 8; }); return o; }
    return Object.assign({}, S.base);
  }
  function scores() {
    const o = baseScores(), rb = raceBonus();
    Object.keys(rb).forEach(function (k) { o[k] += rb[k]; });
    asiLevels().forEach(function (l) {
      const a = S.asi[l];
      if (!a) return;
      if (a.t === 'feat') { if (a.fa) o[a.fa] += 1; }
      else { if (a.a) o[a.a] += a.a === a.b || !a.b ? 2 : 1; if (a.b && a.b !== a.a) o[a.b] += 1; }
    });
    if (rget('feat') && S.rfeat.f && S.rfeat.fa) o[S.rfeat.fa] += 1;
    AT.forEach(function (a) { o[a[0]] = Math.min(20, o[a[0]]); });
    if (S.cls === 'barbaro' && S.lvl >= 20) { o.for = Math.min(24, o.for + 4); o.con = Math.min(24, o.con + 4); }
    return o;
  }
  function cast() {
    const c = C(), s = SUB();
    if (c && c.cast) return c.cast.t === 'half' && S.lvl < 2 ? null : c.cast;
    if (s && s.cast && S.lvl >= 3) return s.cast;
    return null;
  }
  function slots() {
    const k = cast(), L = S.lvl;
    if (!k) return [];
    let eff = 0;
    if (k.t === 'full') eff = L;
    else if (k.t === 'half') eff = L >= 2 ? Math.ceil(L / 2) : 0;
    else if (k.t === 'art') eff = Math.ceil(L / 2);
    else if (k.t === 'third') eff = L >= 3 ? Math.ceil(L / 3) : 0;
    else if (k.t === 'pact') { const a = []; for (let i = 1; i <= 9; i++) a.push(i === PACT_L[L - 1] ? PACT_N[L - 1] : 0); return a; }
    const row = eff ? FULL[eff - 1] : [];
    const a = []; for (let i = 0; i < 9; i++) a.push(row[i] || 0);
    return a;
  }
  function maxSpLvl() { const sl = slots(); let m = 0; sl.forEach(function (n, i) { if (n) m = i + 1; }); return m; }
  function spCounts() {
    const k = cast();
    if (!k) return null;
    const sc = scores(), mod = md(sc[k.at]), L = S.lvl, o = { cant: k.cant ? k.cant[L - 1] : 0, n: 0, mode: k.m };
    if (k.m === 'known') o.n = k.known[L - 1];
    else if (k.m === 'book') { o.n = 6 + 2 * (L - 1); o.prep = Math.max(1, mod + L); }
    else if (k.t === 'full') o.n = Math.max(1, mod + L);
    else o.n = Math.max(1, mod + Math.floor(L / 2));
    if (S.cls === 'bardo') { o.secrets = (L >= 10 ? 2 : 0) + (L >= 14 ? 2 : 0) + (L >= 18 ? 2 : 0) + (S.sub === 'conhecimento' && L >= 6 ? 2 : 0); }
    return o;
  }
  /* magias que vêm "de graça" (domínio, juramento, patrono celestial, terreno…) */
  function freeSpells() {
    const out = [], s = SUB(), L = S.lvl;
    const add = function (arr, why) { (arr || []).forEach(function (e) { if (e[0] <= L) e[1].forEach(function (k) { out.push([k, why]); }); }); };
    if (s && s.sp) add(s.sp, s.n);
    Object.keys(S.ch).forEach(function (li) {
      if (li === 'genio') return;
      (S.ch[li] || []).forEach(function (k) { const o = optGet(li, k); if (o && o[4]) add(o[4], o[1]); });
    });
    return out;
  }
  function raceSpells() { const L = S.lvl; return rboth('sp').filter(function (x) { return x[1] <= L; }); }
  function spList() {
    const k = cast();
    if (!k) return {};
    const s = SUB(), lists = [k.l].concat((s && s.lists) || []), out = {};
    D.spells.forEach(function (x) { if (x[9].some(function (c) { return lists.indexOf(c) >= 0; })) out[x[0]] = 1; });
    const xs = [].concat((s && s.xsp) || []);
    (S.ch.genio || []).forEach(function (g) { const o = optGet('genio', g); if (o && o[4]) xs.push.apply(xs, o[4]); });
    xs.forEach(function (e) { e[1].forEach(function (key) { out[key] = 2; }); });
    return out;
  }
  function optGet(li, k) { const L = OPT[li]; return L ? L.o.filter(function (o) { return o[0] === k; })[0] : null; }
  function choiceDefs() {
    const c = C(), s = SUB(), byList = {}, order = [];
    if (!c) return [];
    [].concat(c.ch, (s && s.ch) || []).forEach(function (x) {
      if (x[0] > S.lvl) return;
      if (!byList[x[1]]) { byList[x[1]] = { li: x[1], label: x[2] || OPT[x[1]].t, n: 0 }; order.push(x[1]); }
      if (x[2] && !byList[x[1]].label) byList[x[1]].label = x[2];
      byList[x[1]].n += x[3];
    });
    if (hasFeat('adepto-marcial')) { if (!byList.manobra) { byList.manobra = { li: 'manobra', label: 'Manobras', n: 0 }; order.push('manobra'); } byList.manobra.n += 2; }
    if (hasFeat('adepto-mistico')) { if (!byList.inv) { byList.inv = { li: 'inv', label: 'Invocações Místicas', n: 0 }; order.push('inv'); } byList.inv.n += 1; }
    if (hasFeat('adepto-metamagia')) { if (!byList.meta) { byList.meta = { li: 'meta', label: 'Metamagia', n: 0 }; order.push('meta'); } byList.meta.n += 2; }
    if (hasFeat('iniciado-luta') && !byList.estg) { byList.estg = { li: 'estg', label: 'Estilo de Luta (talento)', n: 1 }; order.push('estg'); }
    return order.map(function (k) { return byList[k]; });
  }
  function reqOk(req) {
    if (!req) return true;
    return req.split(',').every(function (r) {
      r = r.trim();
      let m = r.match(/^nv(\d+)$/);
      if (m) return S.lvl >= +m[1];
      m = r.match(/^pacto:(\w+)$/);
      if (m) return (S.ch.pacto || []).indexOf(m[1]) >= 0;
      if (r === 'Rajada Mística') return true;
      return true;
    });
  }
  function reqTxt(req) {
    return req.split(',').map(function (r) {
      r = r.trim();
      let m = r.match(/^nv(\d+)$/); if (m) return m[1] + 'º nível';
      m = r.match(/^pacto:(\w+)$/); if (m) { const o = optGet('pacto', m[1]); return o ? o[1] : r; }
      if (r === 'Rajada Mística') return 'o truque Rajada Mística';
      return SRCN[r] ? '' : r;
    }).filter(Boolean).join(', ');
  }
  /* ---------- perícias ---------- */
  function skSources() {
    const c = C(), s = SUB(), b = BG(), L = [];
    if (c) L.push({ id: 'cls', label: 'Classe (' + c.n + ')', n: c.sk[0], from: c.sk[1].length ? c.sk[1] : ALL_SK });
    const rc = rget('skch');
    const rcs = rpair('skch');
    rcs.forEach(function (x, i) { L.push({ id: 'race' + i, label: 'Espécie', n: x[0], from: x[1].length ? x[1] : ALL_SK }); });
    if (R() && R().lineage && S.lin === 'sk') L.push({ id: 'lin', label: 'Traço variável', n: 1, from: ALL_SK });
    if (b && b.skch) L.push({ id: 'bg', label: 'Antecedente', n: b.skch[0], from: b.skch[1] });
    if (s && s.skx) s.skx.forEach(function (x, i) { if (x[0] <= S.lvl && x[1]) L.push({ id: 'sub' + i, label: s.n, n: x[1], from: x[2].length ? x[2] : ALL_SK, exp: x[3] }); });
    featsTaken().forEach(function (f, i) {
      const ef = (IX.feat[f.f] || [])[6];
      if (ef === 'sk3') L.push({ id: 'ft' + f.f, label: 'Talento ' + IX.feat[f.f][1], n: 3, from: ALL_SK });
      if (ef === 'exp1') L.push({ id: 'ft' + f.f, label: 'Talento ' + IX.feat[f.f][1], n: 1, from: ALL_SK });
    });
    const dup = skFixed().dup;
    if (dup) L.push({ id: 'dup', label: 'Perícias repetidas (escolha outras)', n: dup, from: ALL_SK });
    void rc;
    return L;
  }
  function skFixed() {
    const b = BG(), s = SUB(), list = [], exp = [];
    rboth('sk').forEach(function (k) { list.push(k); });
    if (b) b.sk.forEach(function (k) { list.push(k); });
    if (s && s.skf) { s.skf[0].forEach(function (k) { list.push(k); if (s.skf[1]) exp.push(k); }); }
    const seen = {}, out = []; let dup = 0;
    list.forEach(function (k) { if (seen[k]) dup++; else { seen[k] = 1; out.push(k); } });
    return { list: out, dup: dup, exp: exp };
  }
  function skAll() {
    const fx = skFixed(), set = {}, exp = {};
    fx.list.forEach(function (k) { set[k] = 1; });
    fx.exp.forEach(function (k) { exp[k] = 1; });
    skSources().forEach(function (src) { (S.sk[src.id] || []).forEach(function (k) { set[k] = 1; if (src.exp) exp[k] = 1; }); });
    S.exp.forEach(function (k) { if (set[k]) exp[k] = 1; });
    return { set: set, exp: exp };
  }
  function expCount() {
    const c = C(); let n = 0;
    if (c) c.exp.forEach(function (e) { if (e[0] <= S.lvl) n += e[1]; });
    featsTaken().forEach(function (f) { if ((IX.feat[f.f] || [])[6] === 'exp1') n += 1; });
    return n;
  }
  /* ---------- idiomas e ferramentas ---------- */
  function langFixed() { return uniq(rboth('lang')); }
  function langCount() {
    let n = 0;
    const r = R(), s = SR(), b = BG(), sb = SUB();
    if (r && r.langch) n += r.langch;
    if (s && s.langch) n += s.langch;
    if (b) n += b.lang;
    if (sb && sb.langx) n += sb.langx;
    featsTaken().forEach(function (f) { if ((IX.feat[f.f] || [])[6] === 'lang3') n += 3; });
    return n;
  }
  function toolDefs() {
    const c = C(), b = BG(), s = SUB(), out = { fixed: [], ch: [] };
    const addCh = function (id, label, n, cats) { for (let i = 0; i < n; i++) out.ch.push({ id: id + i, label: label, cats: cats }); };
    if (c) { (c.tool || []).forEach(function (t) { out.fixed.push(t); }); if (c.toolch) addCh('cls', 'Classe', c.toolch[0], c.toolch[1]); }
    const rt = rget('tool'); if (rt) rt.split(',').forEach(function (t) { out.fixed.push(t.trim()); });
    const rtc = rpair('toolch'); rtc.forEach(function (x, i) { addCh('race' + i + '_', 'Espécie', x[0], x[1]); });
    if (b) b.tool.forEach(function (t, i) { if (t.indexOf('ch:') === 0) addCh('bg' + i + '_', 'Antecedente', 1, [t.slice(3)]); else out.fixed.push(t); });
    if (s && S.lvl >= 1) { (s.tool || []).forEach(function (t) { out.fixed.push(t); }); if (s.toolch) addCh('sub', s.n, s.toolch[0], s.toolch[1]); }
    out.fixed = uniq(out.fixed);
    return out;
  }
  function toolOpts(cats) { let L = []; cats.forEach(function (c) { L = L.concat(D.tools[c] || []); }); return uniq(L); }
  function toolsAll() { const td = toolDefs(), L = td.fixed.slice(); td.ch.forEach(function (x) { if (S.tool[x.id]) L.push(S.tool[x.id]); }); return uniq(L); }

  /* ---------- PV, CA, deslocamento ---------- */
  function hpMax() {
    const c = C();
    if (!c) return 0;
    const con = md(scores().con), avg = c.hd / 2 + 1;
    let hp = c.hd + con;
    for (let l = 2; l <= S.lvl; l++) { const r = S.hpm === 'roll' && S.hpr[l] ? S.hpr[l] : avg; hp += Math.max(1, r + con); }
    const extra = (rget('hp') || 0) + ((SUB() && SUB().hp) || 0) + (hasFeat('robusto') ? 2 : 0);
    hp += extra * S.lvl;
    return Math.max(1, hp);
  }
  function eqItems() {
    const c = C(), b = BG(), out = [];
    if (!c) return out;
    const push = function (tok, key) {
      const m = tok.match(/^(.+?)\*(\d+)$/), nm = m ? m[1] : tok, q = m ? +m[2] : 1;
      if (nm.charAt(0) === '#') { const p = D.packs[nm.slice(1)]; if (p) p[1].forEach(function (t, i) { push(t, key + 'p' + i); }); return; }
      if (nm.charAt(0) === '@') {
        if (nm === '@ferramenta' || nm === '@instrumento' && b && key.indexOf('bg') === 0) {
          const tl = toolsAll(), want = nm === '@ferramenta' ? D.tools.artesao.concat(D.tools.instrumento) : D.tools.instrumento;
          const got = tl.filter(function (t) { return want.indexOf(t) >= 0; })[0];
          out.push({ n: got || (nm === '@ferramenta' ? 'Ferramentas de artesão' : 'Instrumento musical'), q: 1 });
          return;
        }
        for (let i = 0; i < q; i++) { const w = S.eq.w[key + '_' + i]; out.push({ n: w || wpnCat(nm)[0], q: 1, pick: key + '_' + i, cat: nm }); }
        return;
      }
      out.push({ n: nm, q: q });
    };
    if (S.eq.mode === 'kit') {
      c.eq.forEach(function (line, li) { const ai = line.length === 1 ? 0 : (S.eq.pick[li] || 0); (line[ai] || []).forEach(function (tok, ii) { push(tok, 'c' + li + 'a' + ai + 'i' + ii); }); });
      if (b) b.eq.forEach(function (tok, ii) { push(tok, 'bg' + ii); });
    }
    const m = {}, L = [];
    out.forEach(function (x) { if (x.pick) { L.push(x); return; } if (m[x.n]) m[x.n].q += x.q; else { m[x.n] = x; L.push(x); } });
    return L;
  }
  function wpnCat(tok) {
    const cat = tok.slice(1);
    if (cat === 'instrumento') return D.tools.instrumento;
    return D.weapons.filter(function (w) {
      if (cat === 'simples') return w[1][0] === 's';
      if (cat === 'simplesCaC') return w[1] === 'sc';
      if (cat === 'marcial') return w[1][0] === 'm';
      if (cat === 'marcialCaC') return w[1] === 'mc';
      return false;
    }).map(function (w) { return w[0]; });
  }
  function profArmor() {
    const c = C(), s = SUB(), L = [].concat((c && c.arm) || [], (s && s.arm) || []);
    const ra = rget('arm'); if (ra) { if (/leves/.test(ra)) L.push('leve'); if (/médias/.test(ra)) L.push('media'); }
    featsTaken().forEach(function (f) { const e = (IX.feat[f.f] || [])[6]; if (e === 'arml') L.push('leve'); if (e === 'armm') L.push('media', 'escudo'); if (e === 'armp') L.push('pesada'); });
    return uniq(L);
  }
  function acInfo() {
    const sc = scores(), des = md(sc.des), opts = [];
    const formula = function (f) { const m = String(f).match(/^(\d+)(?:\+(\w+))?(?:\+(\w+))?$/); if (!m) return 10; return +m[1] + (m[2] ? md(sc[m[2]]) : 0) + (m[3] ? md(sc[m[3]]) : 0); };
    let shield = 0, armor = null;
    if (S.eq.mode === 'kit') eqItems().forEach(function (it) { const a = IX.a[it.n]; if (!a) return; if (a[1] === 'escudo') shield = 2; else if (!armor || a[2] > armor[2]) armor = a; });
    const pa = profArmor();
    const fs = [].concat(S.ch.estg || [], S.ch.estp || [], S.ch.estr || []);
    if (armor && pa.indexOf(armor[1]) >= 0) {
      let v = armor[1] === 'leve' ? armor[2] + des : armor[1] === 'media' ? armor[2] + Math.min(2, des) : armor[2];
      if (fs.indexOf('defesa') >= 0) v += 1;
      opts.push({ v: v + shield, t: armor[0] + (shield ? ' + escudo' : '') });
    }
    const un = [{ f: '10+des', t: 'sem armadura' }];
    const c = C(), s = SUB();
    if (c && c.ac) un.push({ f: c.ac, t: 'Defesa sem Armadura', noShield: S.cls === 'monge' });
    if (s && s.ac) un.push({ f: s.ac, t: s.n });
    const rac = rget('ac'); if (rac) un.push({ f: rac, t: 'armadura natural' });
    if (hasFeat('pele-draconica')) un.push({ f: '13+des', t: 'Pele Dracônica' });
    un.forEach(function (u) { opts.push({ v: formula(u.f) + (u.noShield ? 0 : shield), t: u.t + (shield && !u.noShield ? ' + escudo' : '') }); });
    opts.sort(function (a, b) { return b.v - a.v; });
    return opts[0] || { v: 10, t: '' };
  }
  function speed() {
    const r = R();
    if (!r) return 9;
    let v = rget('spd') || r.spd;
    const c = C();
    const armorHeavy = S.eq.mode === 'kit' && eqItems().some(function (it) { const a = IX.a[it.n]; return a && a[1] === 'pesada'; });
    const anyArmor = S.eq.mode === 'kit' && eqItems().some(function (it) { const a = IX.a[it.n]; return a && a[1] !== 'escudo'; });
    if (S.cls === 'barbaro' && S.lvl >= 5 && !armorHeavy) v += 3;
    if (S.cls === 'monge' && S.lvl >= 2 && !anyArmor) { const col = c.col.filter(function (x) { return /Movimento/.test(x[0]); })[0]; if (col) { const m = String(col[1][S.lvl - 1]).match(/([\d,]+)/); if (m) v += parseFloat(m[1].replace(',', '.')); } }
    featsTaken().forEach(function (f) { const e = (IX.feat[f.f] || [])[6] || ''; const m = e.match(/^spd([\d.]+)/); if (m) v += +m[1]; });
    return v;
  }

  /* ---------- validação por etapa ---------- */
  function stepIssues(id) {
    const L = [];
    const c = C(), r = R();
    if (id === 'cls') { if (!c) L.push('Escolha uma classe.'); else if (S.lvl >= c.subLv && !SUB()) L.push('Escolha: ' + c.subN + '.'); }
    if (id === 'race') { if (!r) L.push('Escolha uma espécie.'); else if (r.subs.length > 1 && !SR()) L.push('Escolha a variação da espécie.'); }
    if (id === 'at') {
      if (S.m === 'pb') { const sp = pbSpent(); if (sp > 27) L.push('A compra passou de 27 pontos.'); else if (sp < 27) L.push('Ainda sobram ' + (27 - sp) + ' pontos.'); }
      if (S.m === 'arr' || S.m === 'roll') { if (AT.some(function (a) { return S.arr[a[0]] == null; })) L.push('Distribua todos os valores.'); }
      if (S.m === 'roll' && S.rolls.length < 6) L.push('Role os dados.');
      raceSlots().forEach(function (v, i) { if (!S.ra[i]) L.push('Escolha onde vai o +' + v + ' da espécie.'); });
      asiLevels().forEach(function (l) { const a = S.asi[l]; if (!a || (a.t === 'feat' ? !a.f || (IX.feat[a.f] && IX.feat[a.f][4].length && !a.fa) : !a.a)) L.push('Complete o aumento do ' + l + 'º nível.'); });
      if (rget('feat') && !S.rfeat.f) L.push('Escolha o talento da espécie.');
    }
    if (id === 'bg') { if (!BG()) L.push('Escolha um antecedente.'); }
    if (id === 'sk') {
      const all = skAll();
      skSources().forEach(function (s) { const n = (S.sk[s.id] || []).length; if (n < s.n) L.push(s.label + ': faltam ' + (s.n - n) + '.'); });
      const ec = expCount(); if (S.exp.filter(function (k) { return all.set[k]; }).length < ec) L.push('Especialização: escolha ' + ec + '.');
      if (S.lang.length < langCount()) L.push('Idiomas: faltam ' + (langCount() - S.lang.length) + '.');
      toolDefs().ch.forEach(function (x) { if (!S.tool[x.id]) L.push('Ferramenta (' + x.label + ') sem escolha.'); });
    }
    if (id === 'feat') { choiceDefs().forEach(function (d) { const n = (S.ch[d.li] || []).length; if (n < d.n) L.push(d.label + ': faltam ' + (d.n - n) + '.'); }); if (R() && /esc/.test(rget('spat') || '') && !S.rspat) L.push('Escolha o atributo das magias da espécie.'); }
    if (id === 'eq') { if (S.eq.mode === 'gold' && S.eq.gold == null) L.push('Role o ouro inicial.'); }
    if (id === 'sp') {
      const k = spCounts();
      if (k) {
        if (S.sp.c.length < k.cant) L.push('Truques: faltam ' + (k.cant - S.sp.c.length) + '.');
        if (S.sp.k.length < k.n) L.push((k.mode === 'book' ? 'Grimório' : k.mode === 'known' ? 'Magias conhecidas' : 'Magias preparadas') + ': faltam ' + (k.n - S.sp.k.length) + '.');
        arcLevels().forEach(function (l) { if (!S.sp.arc[l]) L.push('Arcana Mística de ' + l + 'º círculo sem escolha.'); });
      }
      if ((S.ch.inv || []).some(function (x) { const o = optGet('inv', x); return o && /Rajada Mística/.test(o[3]); }) && S.sp.c.indexOf('eldritch-blast') < 0) L.push('Suas invocações pedem o truque Rajada Mística.');
      const rs = rget('spch'), ss = SUB() && SUB().spch;
      if (rs && S.sp.rc.length < rs[2]) L.push('Truque da espécie sem escolha.');
      if (ss && S.sp.sc.length < ss[2]) L.push('Truque da subclasse sem escolha.');
    }
    if (id === 'fim') { if (!S.name.trim()) L.push('Dê um nome ao personagem.'); }
    return L;
  }
  function pbSpent() { let t = 0; AT.forEach(function (a) { t += PB[S.base[a[0]]] || 0; }); return t; }
  function arcLevels() { const k = cast(); if (!k || !k.arc) return []; return k.arc.filter(function (x) { return x[0] <= S.lvl; }).map(function (x) { return x[1]; }); }
  function stepsVisible() { return STEPS.filter(function (s) { return s[0] !== 'sp' || cast() || rget('spch') || (SUB() && SUB().spch) || raceSpells().length; }); }

  /* ---------- HTML ---------- */
  function chip(attr, label, on, dis, extra) { return '<button type="button" class="cr-chip" ' + attr + ' aria-pressed="' + !!on + '"' + (dis ? ' disabled' : '') + '>' + label + (extra || '') + '</button>'; }
  function src(k) { return k && k !== 'PHB' ? '<span class="cr-src" title="' + esc(SRCN[k] || k) + '">' + esc(k) + '</span>' : ''; }
  function feats(list, upTo) {
    return '<ul class="cr-fl">' + list.filter(function (f) { return f[0] <= upTo; }).map(function (f) { return '<li><span class="cr-lv">' + f[0] + '</span><div><b>' + esc(f[1]) + '</b> ' + esc(f[2]) + '</div></li>'; }).join('') + '</ul>';
  }
  function hStep() {
    const id = stepsVisible()[S.step][0];
    return ({ cls: hCls, race: hRace, at: hAt, bg: hBg, sk: hSk, feat: hFeat, eq: hEq, sp: hSp, fim: hFim })[id]();
  }
  function hCls() {
    const c = C();
    let h = '<section class="cr-sec"><h3>Nível</h3><div class="cr-lvl"><button type="button" class="cr-btn q" data-ca="lvl" data-d="-1" aria-label="Diminuir nível">−</button><b class="cr-big">' + S.lvl + '</b><button type="button" class="cr-btn q" data-ca="lvl" data-d="1" aria-label="Aumentar nível">+</button><span class="cr-mut">Bônus de proficiência ' + sgn(prof()) + '</span></div>' +
      '<div class="cr-chips cr-wrap">' + [1, 3, 5, 10, 15, 20].map(function (n) { return chip('data-ca="lvlset" data-v="' + n + '"', String(n), S.lvl === n); }).join('') + '</div></section>';
    if (c) {
      h += '<section class="cr-sec cr-pick"><div class="cr-row"><h3>' + esc(c.n) + src(c.src) + '</h3><button type="button" class="cr-btn q sm" data-ca="clr" data-k="cls">Trocar</button></div><p class="cr-mut">' + esc(c.desc) + '</p>' +
        '<p class="cr-tags"><span>d' + c.hd + ' de vida</span><span>Principal: ' + ATN[c.pa] + '</span><span>Salvaguardas: ' + c.sv.map(function (x) { return ATN[x]; }).join(' e ') + '</span>' + (c.cast ? '<span>Conjurador</span>' : '') + '</p>' +
        '<p class="cr-mut sm">' + esc(c.prof) + '</p>' +
        '<details class="cr-det" open><summary>Características até o ' + S.lvl + 'º nível</summary>' + feats(c.f, S.lvl) + '</details></section>';
      if (S.lvl >= c.subLv) {
        const s = SUB();
        h += '<section class="cr-sec"><h3>' + esc(c.subN) + '</h3>';
        if (s) h += '<div class="cr-pick"><div class="cr-row"><b>' + esc(s.n) + src(s.src) + '</b><button type="button" class="cr-btn q sm" data-ca="clr" data-k="sub">Trocar</button></div>' + (s.hint ? '<p class="cr-mut sm">' + esc(s.hint) + '</p>' : '') + feats(s.f, S.lvl) + '</div>';
        else h += '<div class="cr-grid">' + c.subs.map(function (x) { return '<button type="button" class="cr-card" data-ca="sub" data-k="' + x.k + '"><b>' + esc(x.n) + src(x.src) + '</b><span>' + esc((x.f[0] || [0, '', ''])[1]) + '</span></button>'; }).join('') + '</div>';
        h += '</section>';
      } else h += '<p class="cr-mut sm">' + esc(c.subN) + ' é escolhido no ' + c.subLv + 'º nível.</p>';
    } else {
      h += '<section class="cr-sec"><h3>Classe</h3><div class="cr-grid">' + D.classes.map(function (x) { return '<button type="button" class="cr-card" data-ca="cls" data-k="' + x.k + '"><b>' + esc(x.n) + src(x.src) + '</b><span>' + esc(x.desc) + '</span><small>d' + x.hd + ' · ' + ATN[x.pa] + '</small></button>'; }).join('') + '</div></section>';
    }
    return h;
  }
  function traitList(o) { return (o.tr || []).map(function (t) { return '<li><div><b>' + esc(t[0]) + '</b> ' + esc(t[1]) + '</div></li>'; }).join(''); }
  function raceMeta() {
    const r = R(), sz = { P: 'Pequeno', M: 'Médio' }[r.sz] || r.sz, sp = rget('spd') || r.spd, dv = rget('dv');
    const t = ['Tamanho ' + sz, 'Deslocamento ' + mfmt(sp)];
    if (dv) t.push('Visão no escuro ' + dv + ' m');
    const sw = rget('swim'), fl = rget('fly'), cl = rget('climb');
    if (sw) t.push('Natação ' + mfmt(sw)); if (fl) t.push('Voo ' + mfmt(fl)); if (cl) t.push('Escalada ' + mfmt(cl));
    const lg = langFixed(); if (lg.length) t.push('Idiomas: ' + lg.join(', '));
    return '<p class="cr-tags">' + t.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>';
  }
  function asiTxt(o) { return o ? Object.keys(o).map(function (k) { return ATN[k].slice(0, 3) + ' ' + sgn(o[k]); }).join(', ') : ''; }
  function hRace() {
    const r = R();
    if (!r) {
      const q = fold(S.q);
      const L = D.races.filter(function (x) { return !q || fold(x.n + ' ' + x.subs.map(function (s) { return s.n; }).join(' ')).indexOf(q) >= 0; });
      return '<section class="cr-sec"><h3>Espécie</h3><input type="search" class="cr-in" data-cf="q" placeholder="Buscar: elfo, anão, tiferino…" value="' + esc(S.q) + '" autocomplete="off"><div class="cr-grid">' + L.map(function (x) {
        const a = x.flex ? '+2/+1 livres' : asiTxt(x.asi);
        return '<button type="button" class="cr-card" data-ca="race" data-k="' + x.k + '"><b>' + esc(x.n) + src(x.src) + '</b><span>' + esc(a) + (x.subs.length > 1 ? ' · ' + x.subs.length + ' variações' : '') + '</span></button>';
      }).join('') + '</div></section>';
    }
    const s = SR();
    let h = '<section class="cr-sec cr-pick"><div class="cr-row"><h3>' + esc(r.n) + src(r.src) + '</h3><button type="button" class="cr-btn q sm" data-ca="clr" data-k="race">Trocar</button></div>';
    if (r.subs.length > 1) h += '<div class="cr-chips cr-wrap">' + r.subs.map(function (x) { return chip('data-ca="sr" data-k="' + x.k + '"', esc(x.n) + src(x.src), s && s.k === x.k); }).join('') + '</div>';
    h += raceMeta();
    const fx = raceFixed();
    h += '<p class="cr-mut sm">Atributos: ' + (r.flex ? '+2 em um e +1 em outro (ou +1 em três), à sua escolha.' : esc(asiTxt(fx)) + (rboth('any').length ? ' e +' + rboth('any').join(', +') + ' à sua escolha' : '')) + '</p>';
    h += '<ul class="cr-fl">' + traitList(r) + (s ? traitList(s) : '') + '</ul>';
    if (s && s.dmg) h += '<p class="cr-mut sm">Sopro: ' + esc(s.dmg) + ', ' + esc(s.br) + '. Resistência a ' + esc(s.dmg) + '.</p>';
    if (r.lineage) h += '<div class="cr-chips">' + chip('data-ca="lin" data-v="dv"', 'Visão no escuro 18 m', S.lin === 'dv') + chip('data-ca="lin" data-v="sk"', 'Uma perícia', S.lin === 'sk') + '</div>';
    if (!r.flex && r.k !== 'linhagem') h += '<label class="cr-chk"><input type="checkbox" data-cc="custom"' + (S.custom ? ' checked' : '') + '> Personalizar a origem (Caldeirão de Tasha): mover os bônus de atributo para onde quiser</label>';
    h += '</section>';
    return h;
  }
  function selAt(attr, val, excl, ph) {
    return '<select class="cr-in sm" ' + attr + '><option value="">' + (ph || '—') + '</option>' + AT.map(function (a) { return '<option value="' + a[0] + '"' + (val === a[0] ? ' selected' : '') + ((excl || []).indexOf(a[0]) >= 0 && val !== a[0] ? ' disabled' : '') + '>' + a[2] + '</option>'; }).join('') + '</select>';
  }
  function hAt() {
    const sc = scores(), base = baseScores(), rb = raceBonus();
    let h = '<section class="cr-sec"><h3>Como gerar os atributos</h3><div class="cr-seg">' + [['pb', 'Compra de pontos'], ['arr', 'Conjunto padrão'], ['roll', 'Rolar 4d6'], ['man', 'Manual']].map(function (m) { return '<button type="button" data-ca="m" data-v="' + m[0] + '" aria-pressed="' + (S.m === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div>';
    if (S.m === 'pb') h += '<p class="cr-mut sm">27 pontos. Cada atributo vai de 8 a 15; 14 custa 7 e 15 custa 9. <b class="' + (pbSpent() > 27 ? 'cr-bad' : '') + '">Gastos: ' + pbSpent() + '/27</b></p>';
    if (S.m === 'arr') h += '<p class="cr-mut sm">Distribua 15, 14, 13, 12, 10 e 8.</p>';
    if (S.m === 'roll') h += '<div class="cr-row"><p class="cr-mut sm">Role 4d6 seis vezes e descarte o menor dado de cada.</p><button type="button" class="cr-btn sm" data-ca="roll">' + (S.rolls.length ? 'Rolar de novo' : 'Rolar') + '</button></div>' + (S.rolls.length ? '<p class="cr-rolls">' + S.rolls.map(function (r, i) { return '<span title="' + r.d.join(', ') + '"><b>' + r.t + '</b><small>' + r.d.join(' ') + '</small></span>'; }).join('') + '</p>' : '');
    if (S.m === 'man') h += '<p class="cr-mut sm">Digite os valores combinados com o Mestre (antes dos bônus).</p>';
    h += '<div class="cr-ats">' + AT.map(function (a) {
      const k = a[0];
      let ctl = '';
      if (S.m === 'pb') ctl = '<div class="cr-step"><button type="button" class="cr-btn q xs" data-ca="pb" data-k="' + k + '" data-d="-1"' + (S.base[k] <= 8 ? ' disabled' : '') + ' aria-label="Diminuir ' + a[2] + '">−</button><b>' + S.base[k] + '</b><button type="button" class="cr-btn q xs" data-ca="pb" data-k="' + k + '" data-d="1"' + (S.base[k] >= 15 ? ' disabled' : '') + ' aria-label="Aumentar ' + a[2] + '">+</button></div>';
      else if (S.m === 'arr') { const used = Object.keys(S.arr).filter(function (x) { return x !== k; }).map(function (x) { return S.arr[x]; }); ctl = '<select class="cr-in sm" data-cs="arr" data-k="' + k + '"><option value="">—</option>' + ARR.map(function (v) { const left = ARR.filter(function (x) { return x === v; }).length - used.filter(function (x) { return x === v; }).length; return '<option value="' + v + '"' + (S.arr[k] === v ? ' selected' : '') + (left <= 0 && S.arr[k] !== v ? ' disabled' : '') + '>' + v + '</option>'; }).join('') + '</select>'; }
      else if (S.m === 'roll') { const used = Object.keys(S.arr).filter(function (x) { return x !== k; }).map(function (x) { return S.arr[x]; }); ctl = '<select class="cr-in sm" data-cs="rollp" data-k="' + k + '"' + (S.rolls.length ? '' : ' disabled') + '><option value="">—</option>' + S.rolls.map(function (r, i) { return '<option value="' + i + '"' + (S.arr[k] === i ? ' selected' : '') + (used.indexOf(i) >= 0 ? ' disabled' : '') + '>' + r.t + '</option>'; }).join('') + '</select>'; }
      else ctl = '<input class="cr-in sm" type="number" inputmode="numeric" min="3" max="20" data-cn="base" data-k="' + k + '" value="' + S.base[k] + '">';
      const bonus = sc[k] - base[k];
      return '<div class="cr-at"><span class="cr-ak">' + a[1] + '</span>' + ctl + '<span class="cr-mut xs">' + (bonus ? 'bônus ' + sgn(bonus) : '&nbsp;') + '</span><b class="cr-av">' + sc[k] + '</b><span class="cr-am">' + sgn(md(sc[k])) + '</span></div>';
    }).join('') + '</div></section>';
    const slotsR = raceSlots();
    if (slotsR.length) {
      const r = R();
      h += '<section class="cr-sec"><h3>Bônus da espécie</h3>' + (r.flex ? '<div class="cr-chips">' + chip('data-ca="ra3" data-v="0"', '+2 e +1', !S.ra3) + chip('data-ca="ra3" data-v="1"', '+1, +1 e +1', !!S.ra3) + '</div>' : '') + '<div class="cr-row cr-wrap">' + slotsR.map(function (v, i) {
        const fx = raceFixed(), excl = S.ra.filter(function (x, j) { return j !== i && x; });
        if (!r.flex && !S.custom) Object.keys(fx).forEach(function (k) { if (fx[k] > 0) excl.push(k); });
        return '<label class="cr-lab">+' + v + ' ' + selAt('data-cs="ra" data-i="' + i + '"', S.ra[i], excl) + '</label>';
      }).join('') + '</div>' + (Object.keys(rb).length ? '<p class="cr-mut sm">Total da espécie: ' + esc(asiTxt(rb)) + '</p>' : '') + '</section>';
    }
    if (rget('feat')) h += '<section class="cr-sec"><h3>Talento da espécie</h3>' + featPicker('rf', S.rfeat) + '</section>';
    const lv = asiLevels();
    if (lv.length) {
      h += '<section class="cr-sec"><h3>Aumentos de atributo</h3><p class="cr-mut sm">Em cada um: +2 em um atributo, +1 em dois, ou um talento. Máximo 20.</p>';
      lv.forEach(function (l) {
        const a = S.asi[l] || { t: 'asi' };
        h += '<div class="cr-asi"><div class="cr-row"><b>' + l + 'º nível</b><div class="cr-seg sm">' + chip('data-ca="asit" data-l="' + l + '" data-v="asi"', 'Atributos', a.t !== 'feat') + chip('data-ca="asit" data-l="' + l + '" data-v="feat"', 'Talento', a.t === 'feat') + '</div></div>';
        if (a.t === 'feat') h += featPicker('l' + l, a);
        else h += '<div class="cr-row cr-wrap"><label class="cr-lab">+1 ' + selAt('data-cs="asia" data-l="' + l + '"', a.a) + '</label><label class="cr-lab">+1 ' + selAt('data-cs="asib" data-l="' + l + '"', a.b, [], 'mesmo (+2)') + '</label></div>';
        h += '</div>';
      });
      h += '</section>';
    }
    return h;
  }
  function featPicker(id, cur) {
    const taken = featsTaken().map(function (f) { return f.f; });
    let h = '<select class="cr-in" data-cs="feat" data-id="' + id + '"><option value="">Escolha um talento…</option>' + D.feats.map(function (f) { return '<option value="' + f[0] + '"' + (cur.f === f[0] ? ' selected' : '') + (taken.indexOf(f[0]) >= 0 && cur.f !== f[0] ? ' disabled' : '') + '>' + esc(f[1]) + (f[3] ? ' — ' + esc(f[3]) : '') + (f[2] !== 'PHB' ? ' (' + f[2] + ')' : '') + '</option>'; }).join('') + '</select>';
    const f = IX.feat[cur.f];
    if (f) {
      h += '<p class="cr-mut sm">' + esc(f[5]) + '</p>';
      if (f[4].length) { const opts = f[4][0] === '*' ? AT.map(function (a) { return a[0]; }) : f[4]; h += '<label class="cr-lab">+1 em <select class="cr-in sm" data-cs="fa" data-id="' + id + '"><option value="">—</option>' + opts.map(function (k) { return '<option value="' + k + '"' + (cur.fa === k ? ' selected' : '') + '>' + ATN[k] + '</option>'; }).join('') + '</select></label>'; }
    }
    return h;
  }
  function hBg() {
    const b = BG();
    if (!b) return '<section class="cr-sec"><h3>Antecedente</h3><p class="cr-mut sm">De onde o personagem vem. Dá duas perícias, ferramentas ou idiomas, equipamento e uma característica.</p><div class="cr-grid">' + D.bgs.map(function (x) { return '<button type="button" class="cr-card" data-ca="bg" data-k="' + x.k + '"><b>' + esc(x.n) + src(x.src) + '</b><span>' + esc(x.sk.map(function (k) { return SKN[k]; }).concat(x.skch ? ['+' + x.skch[0] + ' à escolha'] : []).join(', ')) + '</span></button>'; }).join('') + '</div></section>';
    const tl = b.tool.map(function (t) { return t.indexOf('ch:') === 0 ? { artesao: 'uma ferramenta de artesão', instrumento: 'um instrumento musical', jogo: 'um jogo' }[t.slice(3)] : t; });
    return '<section class="cr-sec cr-pick"><div class="cr-row"><h3>' + esc(b.n) + src(b.src) + '</h3><button type="button" class="cr-btn q sm" data-ca="clr" data-k="bg">Trocar</button></div>' +
      '<p class="cr-tags"><span>Perícias: ' + esc(b.sk.map(function (k) { return SKN[k]; }).join(', ') + (b.skch ? (b.sk.length ? ' + ' : '') + b.skch[0] + ' à escolha' : '')) + '</span>' + (tl.length ? '<span>Ferramentas: ' + esc(tl.join(', ')) + '</span>' : '') + (b.lang ? '<span>' + b.lang + ' idioma' + (b.lang > 1 ? 's' : '') + '</span>' : '') + '</p>' +
      '<ul class="cr-fl"><li><div><b>' + esc(b.fn) + '</b> ' + esc(b.fd) + '</div></li></ul><p class="cr-mut sm">Equipamento: ' + esc(b.eq.map(function (e) { return e.replace(/^@ferramenta$/, 'ferramenta escolhida').replace(/^@instrumento$/, 'instrumento escolhido').replace(/\*(\d+)$/, ' ×$1'); }).join(', ')) + ' e ' + b.po + ' po.</p>' +
      '<label class="cr-lab">Tendência <select class="cr-in" data-cs="align"><option value="">—</option>' + ALIGN.map(function (a) { return '<option' + (S.align === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label></section>';
  }
  function hSk() {
    const fx = skFixed(), all = skAll();
    let h = '<section class="cr-sec"><h3>Perícias</h3>' + (fx.list.length ? '<p class="cr-mut sm">Já vêm da espécie e do antecedente: ' + esc(fx.list.map(function (k) { return SKN[k]; }).join(', ')) + '.</p>' : '');
    skSources().forEach(function (s) {
      const mine = S.sk[s.id] || [], full = mine.length >= s.n;
      h += '<div class="cr-blk"><div class="cr-row"><b>' + esc(s.label) + '</b><span class="cr-cnt' + (full ? ' ok' : '') + '">' + mine.length + '/' + s.n + '</span></div><div class="cr-chips cr-wrap">' + s.from.map(function (k) {
        const on = mine.indexOf(k) >= 0, other = !on && all.set[k];
        return chip('data-ca="sk" data-s="' + s.id + '" data-k="' + k + '"', esc(SKN[k]), on, other || (!on && full));
      }).join('') + '</div></div>';
    });
    const ec = expCount();
    if (ec) {
      const sel = S.exp.filter(function (k) { return all.set[k]; });
      h += '<div class="cr-blk"><div class="cr-row"><b>Especialização (dobra a proficiência)</b><span class="cr-cnt' + (sel.length >= ec ? ' ok' : '') + '">' + sel.length + '/' + ec + '</span></div><div class="cr-chips cr-wrap">' + Object.keys(all.set).map(function (k) { const on = sel.indexOf(k) >= 0; return chip('data-ca="exp" data-k="' + k + '"', esc(SKN[k]), on, !on && sel.length >= ec); }).join('') + (S.cls === 'ladino' ? chip('data-ca="exp" data-k="ladrao"', 'Ferramentas de ladrão', S.exp.indexOf('ladrao') >= 0, S.exp.indexOf('ladrao') < 0 && sel.length >= ec) : '') + '</div></div>';
    }
    h += '</section>';
    const lc = langCount(), lf = langFixed();
    h += '<section class="cr-sec"><h3>Idiomas</h3><p class="cr-mut sm">Você fala ' + esc(lf.join(', ') || 'Comum') + '.' + (lc ? ' Escolha mais ' + lc + '.' : '') + '</p>';
    if (lc) h += '<div class="cr-chips cr-wrap">' + D.langs.filter(function (l) { return lf.indexOf(l[0]) < 0; }).map(function (l) { const on = S.lang.indexOf(l[0]) >= 0; return chip('data-ca="lang" data-k="' + esc(l[0]) + '"', esc(l[0]) + (l[1] ? ' <small>exótico</small>' : ''), on, !on && S.lang.length >= lc); }).join('') + '</div>';
    h += '</section>';
    const td = toolDefs();
    if (td.fixed.length || td.ch.length) {
      h += '<section class="cr-sec"><h3>Ferramentas e instrumentos</h3>' + (td.fixed.length ? '<p class="cr-mut sm">Proficiente: ' + esc(td.fixed.join(', ')) + '.</p>' : '');
      td.ch.forEach(function (x) {
        const taken = td.ch.filter(function (y) { return y.id !== x.id; }).map(function (y) { return S.tool[y.id]; }).concat(td.fixed);
        h += '<label class="cr-lab">' + esc(x.label) + ' <select class="cr-in" data-cs="tool" data-id="' + x.id + '"><option value="">—</option>' + toolOpts(x.cats).map(function (t) { return '<option' + (S.tool[x.id] === t ? ' selected' : '') + (taken.indexOf(t) >= 0 && S.tool[x.id] !== t ? ' disabled' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></label>';
      });
      h += '</section>';
    }
    return h;
  }
  function hFeat() {
    let h = '';
    const defs = choiceDefs();
    defs.forEach(function (d) {
      const mine = S.ch[d.li] || [], full = mine.length >= d.n, multi = d.n > 1;
      h += '<section class="cr-sec"><div class="cr-row"><h3>' + esc(d.label) + '</h3><span class="cr-cnt' + (full ? ' ok' : '') + '">' + mine.length + '/' + d.n + '</span></div><div class="cr-opts">' + OPT[d.li].o.map(function (o) {
        const on = mine.indexOf(o[0]) >= 0, ok = reqOk(o[3]), rt = o[3] ? reqTxt(o[3]) : '';
        return '<button type="button" class="cr-opt" data-ca="ch" data-li="' + d.li + '" data-k="' + o[0] + '" data-multi="' + (multi ? 1 : 0) + '" aria-pressed="' + on + '"' + ((!on && (!ok || (full && multi))) ? ' disabled' : '') + '><b>' + esc(o[1]) + src(SRCN[o[3]] ? o[3] : '') + '</b>' + (o[2] ? '<span>' + esc(o[2]) + '</span>' : '') + (rt ? '<small>Requer: ' + esc(rt) + '</small>' : '') + '</button>';
      }).join('') + '</div></section>';
    });
    const sp = rget('spat');
    if (sp === 'esc') h += '<section class="cr-sec"><h3>Atributo das magias da espécie</h3><div class="cr-chips">' + ['int', 'sab', 'car'].map(function (k) { return chip('data-ca="rspat" data-v="' + k + '"', ATN[k], S.rspat === k); }).join('') + '</div></section>';
    const c = C(), s = SUB();
    if (c) {
      h += '<section class="cr-sec"><h3>Tudo o que o personagem sabe fazer</h3>';
      if (c.col.length || (s && s.col.length)) h += '<p class="cr-tags">' + c.col.concat((s && s.col) || []).map(function (x) { return '<span>' + esc(x[0]) + ': <b>' + esc(x[1][S.lvl - 1]) + '</b></span>'; }).join('') + '</p>';
      h += '<details class="cr-det" open><summary>' + esc(c.n) + ' ' + S.lvl + '</summary>' + feats(c.f, S.lvl) + '</details>' + (s ? '<details class="cr-det" open><summary>' + esc(s.n) + '</summary>' + feats(s.f, S.lvl) + '</details>' : '');
      const r = R(), sr = SR();
      if (r) h += '<details class="cr-det"><summary>' + esc(sr && r.subs.length > 1 ? sr.n : r.n) + '</summary><ul class="cr-fl">' + traitList(r) + (sr ? traitList(sr) : '') + '</ul></details>';
      h += '</section>';
    }
    if (!defs.length && !c) h += '<p class="cr-mut">Escolha a classe primeiro.</p>';
    return h;
  }
  function itemLabel(it) { return esc(it.n) + (it.q > 1 ? ' ×' + it.q : ''); }
  function hEq() {
    const c = C(), b = BG();
    if (!c) return '<p class="cr-mut">Escolha a classe primeiro.</p>';
    let h = '<section class="cr-sec"><div class="cr-seg">' + chip('data-ca="eqm" data-v="kit"', 'Equipamento inicial', S.eq.mode === 'kit') + chip('data-ca="eqm" data-v="gold"', 'Comprar com ouro', S.eq.mode === 'gold') + '</div>';
    if (S.eq.mode === 'gold') {
      h += '<p class="cr-mut sm">Em vez do equipamento da classe e do antecedente, receba ' + esc(c.gold.replace('*', ' × ')) + ' po e compre os itens depois na Mochila.</p><div class="cr-row"><button type="button" class="cr-btn sm" data-ca="gold">' + (S.eq.gold == null ? 'Rolar ouro' : 'Rolar de novo') + '</button>' + (S.eq.gold != null ? '<b class="cr-big">' + S.eq.gold + ' po</b>' : '') + '</div></section>';
      return h;
    }
    h += '<p class="cr-mut sm">Escolha uma opção em cada linha. Tudo vai para a sua Mochila.</p>';
    c.eq.forEach(function (line, li) {
      const ai = S.eq.pick[li] || 0;
      if (line.length === 1) { h += '<div class="cr-blk"><span class="cr-mut xs">Sempre</span><p>' + esc(line[0].map(tokTxt).join(', ')) + '</p>' + packTxt(line[0]).replace(/<span>/g, '<span class="cr-mut sm">') + pickers(line[0], 'c' + li + 'a0') + '</div>'; return; }
      h += '<div class="cr-blk"><div class="cr-opts sm">' + line.map(function (alt, i) { return '<button type="button" class="cr-opt" data-ca="eqp" data-l="' + li + '" data-v="' + i + '" aria-pressed="' + (ai === i) + '"><b>' + esc(alt.map(tokTxt).join(' + ')) + '</b>' + packTxt(alt) + '</button>'; }).join('') + '</div>' + pickers(line[ai], 'c' + li + 'a' + ai) + '</div>';
    });
    if (b) h += '<div class="cr-blk"><span class="cr-mut xs">Do antecedente (' + esc(b.n) + ')</span><p>' + esc(b.eq.map(tokTxt).join(', ')) + ' e ' + b.po + ' po.</p></div>';
    const ac = acInfo();
    h += '<p class="cr-tags"><span>CA ' + ac.v + (ac.t ? ' (' + esc(ac.t) + ')' : '') + '</span><span>' + eqItems().length + ' itens</span></p></section>';
    return h;
  }
  function packTxt(alt) {
    return alt.filter(function (t) { return t.charAt(0) === '#'; }).map(function (t) { const p = D.packs[t.slice(1)]; return p ? '<span>' + esc(p[1].map(function (x) { return x.replace(/\*(\d+)$/, ' ×$1'); }).join(', ')) + '</span>' : ''; }).join('');
  }
  function tokTxt(t) {
    const m = t.match(/^(.+?)\*(\d+)$/), nm = m ? m[1] : t, q = m ? ' ×' + m[2] : '';
    if (nm.charAt(0) === '#') return (D.packs[nm.slice(1)] || [nm])[0] + q;
    const cat = { '@simples': 'uma arma simples', '@simplesCaC': 'uma arma simples corpo a corpo', '@marcial': 'uma arma marcial', '@marcialCaC': 'uma arma marcial corpo a corpo', '@instrumento': 'um instrumento musical', '@ferramenta': 'a ferramenta escolhida' }[nm];
    if (cat) return m ? cat.replace(/^uma? /, m[2] + ' ').replace('arma', 'armas').replace('instrumento musical', 'instrumentos') : cat;
    return nm + q;
  }
  function pickers(alt, key) {
    let h = '';
    alt.forEach(function (tok, ii) {
      const m = tok.match(/^(@\w+)(?:\*(\d+))?$/);
      if (!m || m[1] === '@ferramenta') return;
      const n = m[2] ? +m[2] : 1, L = wpnCat(m[1]);
      for (let i = 0; i < n; i++) { const k = key + 'i' + ii + '_' + i, v = S.eq.w[k] || L[0]; h += '<label class="cr-lab">' + esc(tokTxt(m[1])) + ' <select class="cr-in" data-cs="eqw" data-id="' + k + '">' + L.map(function (w) { const x = IX.w[w]; return '<option value="' + esc(w) + '"' + (v === w ? ' selected' : '') + '>' + esc(w) + (x ? ' — ' + x[2] + ' ' + x[3] : '') + '</option>'; }).join('') + '</select></label>'; }
    });
    return h;
  }
  function spRow(x, on, dis, why) {
    const tags = [D.schools[x[3]], x[4], x[5]];
    if (x[8].indexOf('C') >= 0) tags.push('concentração');
    if (x[8].indexOf('R') >= 0) tags.push('ritual');
    return '<li class="cr-sp' + (on ? ' on' : '') + '"><button type="button" class="cr-spb" data-ca="spt" data-k="' + x[0] + '" aria-pressed="' + !!on + '"' + (dis ? ' disabled' : '') + ' aria-label="' + (on ? 'Remover ' : 'Escolher ') + esc(x[1]) + '">' + (on ? '✓' : '+') + '</button><details><summary><span class="cr-spn"><b>' + esc(x[1]) + '</b>' + src(x[11] === 'SRD' ? '' : x[11]) + (why ? ' <small class="cr-tag2">' + esc(why) + '</small>' : '') + '</span><span class="cr-mut xs">' + esc(tags.join(' · ')) + ' · ' + esc(x[6]) + ' · ' + esc(x[7]) + '</span></summary><p>' + esc(x[10]) + '</p></details></li>';
  }
  function hSp() {
    const k = cast(), cn = spCounts(), mx = maxSpLvl();
    let h = '';
    const rs = raceSpells(), fr = freeSpells();
    if (rs.length || fr.length) {
      h += '<section class="cr-sec"><h3>Magias que já vêm prontas</h3><p class="cr-mut sm">Não contam no limite.</p><ul class="cr-spl">' + rs.map(function (x) { return IX.sp[x[0]] ? spRow(IX.sp[x[0]], true, true, 'espécie') : ''; }).join('') + fr.map(function (x) { return IX.sp[x[0]] ? spRow(IX.sp[x[0]], true, true, x[1]) : ''; }).join('') + '</ul></section>';
    }
    const rch = rget('spch'), sch = SUB() && SUB().spch;
    [[rch, 'rc', 'Truque da espécie'], [sch, 'sc', 'Truque da subclasse']].forEach(function (z) {
      if (!z[0]) return;
      const li = z[0][1], n = z[0][2], mine = S.sp[z[1]];
      const done = mine.length >= n, rows = D.spells.filter(function (x) { return x[2] === 0 && x[9].indexOf(li) >= 0 && (!done || mine.indexOf(x[0]) >= 0); });
      h += '<section class="cr-sec"><div class="cr-row"><h3>' + z[2] + ' (' + LISTN[li] + ')</h3><span class="cr-cnt' + (done ? ' ok' : '') + '">' + mine.length + '/' + n + '</span></div><ul class="cr-spl">' + rows.map(function (x) { const on = mine.indexOf(x[0]) >= 0; return spRow(x, on, false).replace('data-ca="spt"', 'data-ca="spx" data-g="' + z[1] + '" data-n="' + n + '"'); }).join('') + '</ul>' + (done ? '<p class="cr-mut xs">Para trocar, toque no ✓ e escolha outro.</p>' : '') + '</section>';
    });
    if (!k) return h || '<p class="cr-mut">Este personagem não conjura magias.</p>';
    const list = spList(), freeK = fr.map(function (x) { return x[0]; });
    const sl = slots();
    h += '<section class="cr-sec"><h3>Magias de ' + esc(LISTN[k.l]) + '</h3><p class="cr-tags"><span>Atributo: ' + ATN[k.at] + '</span><span>CD ' + (8 + prof() + md(scores()[k.at])) + '</span><span>Ataque ' + sgn(prof() + md(scores()[k.at])) + '</span><span>Espaços: ' + sl.map(function (n, i) { return n ? (i + 1) + 'º×' + n : ''; }).filter(Boolean).join(' ') + '</span></p>';
    const note = cn.mode === 'book' ? 'O grimório começa com ' + cn.n + ' magias. Você prepara ' + cn.prep + ' por dia dentre elas.' : cn.mode === 'known' ? 'Você conhece ' + cn.n + ' magias; troca uma a cada nível.' : 'Você prepara ' + cn.n + ' magias por dia da lista inteira (pode trocar após um descanso longo).';
    h += '<p class="cr-mut sm">' + esc(note) + (cn.secrets ? ' Segredos Mágicos: até ' + cn.secrets + ' delas podem vir de qualquer lista.' : '') + (SUB() && SUB().hint ? ' ' + esc(SUB().hint) : '') + '</p>';
    const tabs = [[0, 'Truques ' + S.sp.c.length + '/' + cn.cant]];
    for (let i = 1; i <= mx; i++) tabs.push([i, i + 'º']);
    if (S.spl > mx) S.spl = 0;
    if (!cn.cant && S.spl === 0) S.spl = 1;
    h += '<p class="cr-tags"><span class="cr-cnt' + (S.sp.k.length >= cn.n ? ' ok' : '') + '">' + (cn.mode === 'book' ? 'Grimório' : cn.mode === 'known' ? 'Conhecidas' : 'Preparadas') + ' ' + S.sp.k.length + '/' + cn.n + '</span></p>';
    h += '<div class="cr-chips">' + tabs.filter(function (t) { return t[0] > 0 || cn.cant; }).map(function (t) { return chip('data-ca="spl" data-v="' + t[0] + '"', t[1], S.spl === t[0]); }).join('') + '</div>';
    h += '<div class="cr-row"><input type="search" class="cr-in" data-cf="spq" placeholder="Buscar magia…" value="' + esc(S.spq || '') + '" autocomplete="off">' + (cn.secrets ? '<label class="cr-chk"><input type="checkbox" data-cc="spAll"' + (S.spAll ? ' checked' : '') + '> Todas as listas</label>' : '') + '</div>';
    const q = fold(S.spq), lvl = S.spl;
    const pool = D.spells.filter(function (x) { return x[2] === lvl && (list[x[0]] || (S.spAll && cn.secrets && lvl > 0) || S.sp.k.indexOf(x[0]) >= 0 || S.sp.c.indexOf(x[0]) >= 0) && (!q || fold(x[1] + ' ' + x[10]).indexOf(q) >= 0); });
    const offList = S.sp.k.filter(function (key) { return !list[key]; }).length;
    h += '<ul class="cr-spl">' + pool.map(function (x) {
      const isC = lvl === 0, arr = isC ? S.sp.c : S.sp.k, on = arr.indexOf(x[0]) >= 0, free = freeK.indexOf(x[0]) >= 0;
      const full = isC ? S.sp.c.length >= cn.cant : S.sp.k.length >= cn.n;
      const offFull = !list[x[0]] && offList >= (cn.secrets || 0);
      return spRow(x, on || free, free || (!on && (full || offFull)), free ? 'já incluída' : list[x[0]] === 2 ? 'lista expandida' : !list[x[0]] ? 'outra lista' : '');
    }).join('') + (pool.length ? '' : '<li class="cr-mut sm">Nada encontrado.</li>') + '</ul></section>';
    const arc = arcLevels();
    if (arc.length) {
      h += '<section class="cr-sec"><h3>Arcana Mística</h3><p class="cr-mut sm">Uma magia de cada círculo, 1×/descanso longo.</p>' + arc.map(function (l) { return '<label class="cr-lab">' + l + 'º círculo <select class="cr-in" data-cs="arc" data-l="' + l + '"><option value="">—</option>' + D.spells.filter(function (x) { return x[2] === l && x[9].indexOf('bru') >= 0; }).map(function (x) { return '<option value="' + x[0] + '"' + (S.sp.arc[l] === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>'; }).join('') + '</section>';
    }
    h += '<section class="cr-sec"><h3>Outras magias</h3><p class="cr-mut sm">De talentos (Iniciado em Magia, Tocado pelas Fadas…) ou combinadas com o Mestre. Não contam no limite.</p>' + (S.sp.x.length ? '<ul class="cr-spl">' + S.sp.x.map(function (key) { return IX.sp[key] ? spRow(IX.sp[key], true, false).replace('data-ca="spt"', 'data-ca="spxr"') : ''; }).join('') + '</ul>' : '') + '<select class="cr-in" data-cs="spxadd"><option value="">+ Adicionar magia…</option>' + D.spells.map(function (x) { return '<option value="' + x[0] + '">' + (x[2] ? x[2] + 'º' : 'Truque') + ' · ' + esc(x[1]) + '</option>'; }).join('') + '</select></section>';
    return h;
  }
  function hFim() {
    const c = C(), r = R(), sc = scores(), ac = acInfo();
    const all = steps2Issues();
    let h = '<section class="cr-sec"><label class="cr-lab cr-full">Nome do personagem <input class="cr-in" data-cf="name" value="' + esc(S.name) + '" placeholder="Como o personagem se chama?" maxlength="80" autocomplete="off"></label></section>';
    if (c) {
      const avg = c.hd / 2 + 1;
      h += '<section class="cr-sec"><h3>Pontos de vida</h3><p class="cr-big">' + hpMax() + ' PV</p><p class="cr-mut sm">1º nível: ' + c.hd + ' + Constituição.' + (S.lvl > 1 ? ' Depois, ' + avg + ' (média) + Constituição por nível.' : '') + '</p>' +
        (S.lvl > 1 ? '<div class="cr-chips">' + chip('data-ca="hpm" data-v="avg"', 'Usar a média', S.hpm !== 'roll') + chip('data-ca="hpm" data-v="roll"', 'Rolar os dados', S.hpm === 'roll') + '</div>' + (S.hpm === 'roll' ? '<p class="cr-rolls">' + S.hpr.slice(2, S.lvl + 1).map(function (v, i) { return '<span><b>' + v + '</b><small>' + (i + 2) + 'º</small></span>'; }).join('') + '</p><button type="button" class="cr-btn q sm" data-ca="hproll">Rolar de novo</button>' : '') : '') + '</section>';
    }
    h += '<section class="cr-sec"><h3>Resumo</h3><div class="cr-sum">' +
      '<div><span>Personagem</span><b>' + esc([r ? (SR() && r.subs.length > 1 ? SR().n : r.n) : '', c ? c.n + ' ' + S.lvl : '', SUB() ? SUB().n : ''].filter(Boolean).join(' · ') || '—') + '</b></div>' +
      '<div><span>Antecedente</span><b>' + esc(BG() ? BG().n : '—') + '</b></div>' +
      '<div><span>CA</span><b>' + ac.v + '</b></div><div><span>Deslocamento</span><b>' + mfmt(speed()) + '</b></div><div><span>Proficiência</span><b>' + sgn(prof()) + '</b></div><div><span>Iniciativa</span><b>' + sgn(md(sc.des) + (hasFeat('alerta') ? 5 : 0) + (S.race === 'leporino' ? prof() : 0)) + '</b></div>' +
      '</div><div class="cr-ats sm">' + AT.map(function (a) { return '<div class="cr-at"><span class="cr-ak">' + a[1] + '</span><b class="cr-av">' + sc[a[0]] + '</b><span class="cr-am">' + sgn(md(sc[a[0]])) + '</span></div>'; }).join('') + '</div></section>';
    if (all.length) h += '<section class="cr-sec cr-warn"><h3>Ainda falta</h3><ul>' + all.map(function (x) { return '<li><button type="button" class="cr-link" data-ca="go" data-v="' + x[0] + '">' + esc(x[1]) + ':</button> ' + esc(x[2]) + '</li>'; }).join('') + '</ul><p class="cr-mut sm">Dá para aplicar assim mesmo e completar a ficha à mão.</p></section>';
    h += '<section class="cr-sec">' + (window.HTCriador.hasItems ? '<label class="cr-chk"><input type="checkbox" data-cc="add"' + (S.add ? ' checked' : '') + '> Colocar o equipamento ' + (S.eq.mode === 'gold' ? 'e o ouro ' : '') + 'na Mochila (você já tem itens lá)</label>' : '') + '<p class="cr-mut sm">Aplicar preenche a ficha inteira: atributos, perícias, salvaguardas, PV, CA, magias e características. A história e o retrato ficam como estão.</p><button type="button" class="cr-btn cr-full" data-ca="apply">Aplicar na ficha</button></section>';
    return h;
  }
  function steps2Issues() { const out = []; stepsVisible().forEach(function (s, i) { if (s[0] === 'fim') return; stepIssues(s[0]).forEach(function (t) { out.push([i, s[1], t]); }); }); return out; }

  /* ---------- montar ---------- */
  function paint(keepScroll) {
    if (!root) return;
    const st = stepsVisible();
    if (S.step >= st.length) S.step = st.length - 1;
    const body = root.querySelector('.cr-body'), y = body ? body.scrollTop : 0;
    S.seen = S.seen || {}; S.seen[st[S.step][0]] = 1;
    root.querySelector('.cr-steps').innerHTML = st.map(function (s, i) { const done = s[0] !== 'fim' && (S.seen || {})[s[0]] && !stepIssues(s[0]).length; return '<button type="button" data-ca="go" data-v="' + i + '" aria-current="' + (i === S.step ? 'step' : 'false') + '" class="' + (done ? 'ok' : '') + '"><span>' + (done && i !== S.step ? '✓' : i + 1) + '</span>' + s[1] + '</button>'; }).join('');
    body.innerHTML = hStep();
    const iss = st[S.step][0] === 'fim' ? [] : stepIssues(st[S.step][0]);
    root.querySelector('.cr-foot').innerHTML = '<button type="button" class="cr-btn q" data-ca="prev"' + (S.step === 0 ? ' disabled' : '') + '>Voltar</button><span class="cr-mut sm cr-iss">' + esc(iss[0] || '') + '</span>' + (S.step < st.length - 1 ? '<button type="button" class="cr-btn" data-ca="next">Próximo</button>' : '');
    if (keepScroll) body.scrollTop = y; else body.scrollTop = 0;
    const cur = root.querySelector('.cr-steps [aria-current="step"]');
    if (cur && cur.scrollIntoView) { const p = cur.parentNode; p.scrollLeft = Math.max(0, cur.offsetLeft - p.clientWidth / 2 + cur.clientWidth / 2); }
    draft();
  }
  function draft() { try { localStorage.setItem('ht-cr-draft', JSON.stringify(S)); } catch (e) { /* ok */ } }
  function toggle(arr, k, max) { const i = arr.indexOf(k); if (i >= 0) arr.splice(i, 1); else if (max == null || arr.length < max) arr.push(k); }
  function onClick(e) {
    const b = e.target.closest('[data-ca]');
    if (!b || !root.contains(b) || b.disabled) return;
    const a = b.dataset.ca, k = b.dataset.k, v = b.dataset.v;
    let keep = true;
    if (a === 'close') { close(); return; }
    if (a === 'go') { S.step = +v; keep = false; }
    else if (a === 'next') { S.step++; keep = false; }
    else if (a === 'prev') { S.step--; keep = false; }
    else if (a === 'lvl') S.lvl = Math.max(1, Math.min(20, S.lvl + +b.dataset.d));
    else if (a === 'lvlset') S.lvl = +v;
    else if (a === 'cls') { S.cls = k; S.sub = ''; S.ch = {}; S.sp = { c: [], k: [], arc: {}, x: S.sp.x, rc: S.sp.rc, sc: [] }; S.sk.cls = []; S.eq.pick = []; S.eq.w = {}; keep = false; }
    else if (a === 'sub') { S.sub = k; Object.keys(S.ch).forEach(function (li) { if (!C().ch.some(function (x) { return x[1] === li; })) delete S.ch[li]; }); S.sp.sc = []; }
    else if (a === 'clr') { if (k === 'cls') { S.cls = ''; S.sub = ''; } else if (k === 'sub') S.sub = ''; else if (k === 'race') { S.race = ''; S.sr = ''; S.ra = []; S.q = ''; } else if (k === 'bg') S.bg = ''; keep = false; }
    else if (a === 'race') { S.race = k; S.sr = ''; S.ra = []; S.ra3 = false; S.sp.rc = []; keep = false; }
    else if (a === 'sr') { S.sr = k; S.sp.rc = []; }
    else if (a === 'lin') S.lin = v;
    else if (a === 'm') { S.m = v; S.arr = {}; if (v === 'pb') AT.forEach(function (x) { S.base[x[0]] = Math.max(8, Math.min(15, S.base[x[0]])); }); }
    else if (a === 'pb') { const n = S.base[k] + +b.dataset.d; if (n >= 8 && n <= 15) S.base[k] = n; }
    else if (a === 'roll') { S.rolls = []; for (let i = 0; i < 6; i++) { const d = [d6(), d6(), d6(), d6()].sort(function (x, y) { return y - x; }); S.rolls.push({ d: d, t: d[0] + d[1] + d[2] }); } S.arr = {}; }
    else if (a === 'ra3') { S.ra3 = v === '1'; S.ra = []; }
    else if (a === 'asit') { const l = b.dataset.l; S.asi[l] = { t: v }; }
    else if (a === 'bg') { S.bg = k; S.sk.bg = []; keep = false; }
    else if (a === 'sk') { S.sk[b.dataset.s] = S.sk[b.dataset.s] || []; const src = skSources().filter(function (x) { return x.id === b.dataset.s; })[0]; toggle(S.sk[b.dataset.s], k, src ? src.n : 0); }
    else if (a === 'exp') toggle(S.exp, k, null);
    else if (a === 'lang') toggle(S.lang, k, langCount());
    else if (a === 'ch') { const li = b.dataset.li; S.ch[li] = S.ch[li] || []; if (b.dataset.multi === '1') toggle(S.ch[li], k, null); else S.ch[li] = S.ch[li][0] === k ? [] : [k]; }
    else if (a === 'rspat') S.rspat = v;
    else if (a === 'eqm') S.eq.mode = v;
    else if (a === 'eqp') S.eq.pick[+b.dataset.l] = +v;
    else if (a === 'gold') { const m = C().gold.match(/^(\d+)d(\d+)(?:\*(\d+))?$/); let t = 0; for (let i = 0; i < +m[1]; i++) t += 1 + Math.floor(Math.random() * +m[2]); S.eq.gold = t * (m[3] ? +m[3] : 1); }
    else if (a === 'spl') S.spl = +v;
    else if (a === 'spt') { const x = IX.sp[k], cn = spCounts(); if (x[2] === 0) toggle(S.sp.c, k, cn.cant); else toggle(S.sp.k, k, cn.n); }
    else if (a === 'spx') toggle(S.sp[b.dataset.g], k, +b.dataset.n);
    else if (a === 'spxr') toggle(S.sp.x, k, null);
    else if (a === 'hpm') { S.hpm = v; if (v === 'roll' && !S.hpr.length) rollHp(); }
    else if (a === 'hproll') rollHp();
    else if (a === 'apply') { apply(); return; }
    paint(keep);
  }
  function rollHp() { const c = C(); S.hpr = [0, 0]; for (let l = 2; l <= 20; l++) S.hpr.push(1 + Math.floor(Math.random() * c.hd)); }
  function onChange(e) {
    const t = e.target;
    if (!root.contains(t)) return;
    const d = t.dataset;
    if (d.cs) {
      const v = t.value;
      if (d.cs === 'arr') { if (v) S.arr[d.k] = +v; else delete S.arr[d.k]; }
      else if (d.cs === 'rollp') { if (v !== '') S.arr[d.k] = +v; else delete S.arr[d.k]; }
      else if (d.cs === 'ra') S.ra[+d.i] = v;
      else if (d.cs === 'asia') { const l = d.l; S.asi[l] = Object.assign({ t: 'asi' }, S.asi[l]); S.asi[l].a = v; }
      else if (d.cs === 'asib') { const l = d.l; S.asi[l] = Object.assign({ t: 'asi' }, S.asi[l]); S.asi[l].b = v; }
      else if (d.cs === 'feat' || d.cs === 'fa') {
        const o = d.id === 'rf' ? S.rfeat : (S.asi[d.id.slice(1)] = S.asi[d.id.slice(1)] || { t: 'feat' });
        if (d.cs === 'feat') { o.f = v; o.fa = ''; const f = IX.feat[v]; if (f && f[4].length === 1 && f[4][0] !== '*') o.fa = f[4][0]; } else o.fa = v;
      }
      else if (d.cs === 'align') S.align = v;
      else if (d.cs === 'tool') S.tool[d.id] = v;
      else if (d.cs === 'eqw') S.eq.w[d.id] = v;
      else if (d.cs === 'arc') S.sp.arc[d.l] = v;
      else if (d.cs === 'spxadd') { if (v && S.sp.x.indexOf(v) < 0) S.sp.x.push(v); }
      paint(true);
    } else if (d.cc) { S[d.cc] = t.checked; if (d.cc === 'custom') S.ra = []; paint(true); }
    else if (d.cn) { S.base[d.k] = Math.max(1, Math.min(30, +t.value || 10)); paint(true); }
  }
  function onInput(e) {
    const t = e.target;
    if (!t.dataset || !t.dataset.cf) return;
    const f = t.dataset.cf;
    S[f] = t.value;
    if (f === 'name') { draft(); return; }
    const pos = t.selectionStart;
    paint(true);
    const n = root.querySelector('[data-cf="' + f + '"]');
    if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* ok */ } }
  }

  /* ---------- aplicar ---------- */
  function itemRow(n, q) {
    const w = IX.w[n], a = IX.a[n], g = IX.g[n];
    const dd = function (o) { const r = { src: n }; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null && o[k] !== 0 && o[k] !== false) r[k] = o[k]; }); return r; };
    if (w) return { name: n, qty: q, kind: 'arma', weight: w[5], value: w[6], notes: '', data: dd({ dmg: w[2], dt: w[3], at: w[4], prop: w[7], v2: w[8] }) };
    if (a) return { name: n, qty: q, kind: 'armadura', weight: a[5], value: a[6], notes: '', data: dd({ ct: a[1], ac: a[2], st: a[3], fur: !!a[4] }) };
    if (g) return { name: n, qty: q * (g[5] || 1), kind: g[1] === 'arma' ? 'outro' : g[1], weight: g[2], value: g[3], notes: g[4], data: dd({}) };
    return { name: n, qty: q, kind: 'equipamento', weight: 1, value: '', notes: '', data: dd({}) };
  }
  function spName(k) { return (IX.sp[k] || [k, k])[1]; }
  function apply() {
    const c = C(), s = SUB(), r = R(), sr = SR(), b = BG(), sc = scores(), all = skAll(), k = cast();
    const sh = {};
    sh.race = r ? (sr && r.subs.length > 1 ? sr.n : r.n) : '';
    sh.cls = c ? c.n : ''; sh.sub = s ? s.n : ''; sh.level = S.lvl; sh.bg = b ? b.n : ''; sh.align = S.align || '';
    sh.at = {}; AT.forEach(function (a) { sh.at[a[0]] = sc[a[0]]; });
    sh.sv = {}; AT.forEach(function (a) { sh.sv[a[0]] = !!(c && c.sv.indexOf(a[0]) >= 0); });
    featsTaken().forEach(function (f) { if ((IX.feat[f.f] || [])[6] === 'save' && f.fa) sh.sv[f.fa] = true; });
    if (S.cls === 'ladino' && S.lvl >= 15) sh.sv.sab = true;
    if (S.cls === 'monge' && S.lvl >= 14) AT.forEach(function (a) { sh.sv[a[0]] = true; });
    if (S.sub === 'samurai' && S.lvl >= 7) sh.sv.sab = true;
    sh.sk = {}; ALL_SK.forEach(function (x) { sh.sk[x] = all.exp[x] ? 2 : all.set[x] ? 1 : 0; });
    const ac = acInfo();
    sh.ac = ac.v; sh.speed = mfmt(speed());
    const hp = hpMax(); sh.hp = { max: hp, cur: hp, tmp: 0 };
    sh.hd = c ? S.lvl + 'd' + c.hd : '1d8';
    const sl = slots();
    sh.slots = sl.map(function (n) { return { max: n, v: 0 }; });
    if (k) sh.spAt = k.at; else { const rs = rget('spat'); if (rs) sh.spAt = rs === 'esc' ? S.rspat : rs; }
    /* magias */
    const spl = [], lines = [];
    const byLvl = {};
    const addSp = function (key, tag) { if (!IX.sp[key] || spl.indexOf(key) >= 0) return; spl.push(key); const l = IX.sp[key][2]; (byLvl[l] = byLvl[l] || []).push(spName(key) + (tag ? ' (' + tag + ')' : '')); };
    S.sp.c.forEach(function (x) { addSp(x); });
    S.sp.rc.forEach(function (x) { addSp(x, 'espécie'); });
    S.sp.sc.forEach(function (x) { addSp(x, s ? s.n : ''); });
    freeSpells().forEach(function (x) { addSp(x[0], 'sempre preparada'); });
    raceSpells().forEach(function (x) { addSp(x[0], 'espécie'); });
    S.sp.k.forEach(function (x) { addSp(x, k && k.m === 'book' ? 'grimório' : ''); });
    Object.keys(S.sp.arc).forEach(function (l) { if (S.sp.arc[l]) addSp(S.sp.arc[l], 'Arcana Mística'); });
    S.sp.x.forEach(function (x) { addSp(x, 'extra'); });
    Object.keys(byLvl).sort().forEach(function (l) { lines.push((+l ? l + 'º círculo' : 'Truques') + ': ' + byLvl[l].join(', ')); });
    if (k && k.m === 'book') lines.push('Prepare ' + spCounts().prep + ' por dia dentre as do grimório.');
    sh.spells = lines.join('\n');
    sh.spl = spl;
    /* características */
    const F = [];
    if (r) {
      F.push('— ' + sh.race.toUpperCase() + ' —');
      const dv = rget('dv') || (r.lineage && S.lin === 'dv' ? 18 : 0); if (dv) F.push('• Visão no escuro ' + dv + ' m.');
      r.tr.concat(sr ? sr.tr : []).forEach(function (t) { F.push('• ' + t[0] + ': ' + t[1]); });
      if (sr && sr.dmg) F.push('• Sopro e resistência: ' + sr.dmg + ', ' + sr.br + '.');
    }
    if (c) {
      F.push('', '— ' + (c.n + ' ' + S.lvl).toUpperCase() + (s ? ' · ' + s.n.toUpperCase() : '') + ' —');
      c.col.concat((s && s.col) || []).forEach(function (x) { F.push('• ' + x[0] + ': ' + x[1][S.lvl - 1]); });
      c.f.concat(s ? s.f : []).filter(function (f) { return f[0] <= S.lvl; }).sort(function (x, y) { return x[0] - y[0]; }).forEach(function (f) { F.push('• ' + f[1] + ' (' + f[0] + 'º): ' + f[2]); });
      choiceDefs().forEach(function (d) { (S.ch[d.li] || []).forEach(function (key) { const o = optGet(d.li, key); if (o) F.push('• ' + d.label + ' — ' + o[1] + (o[2] ? ': ' + o[2] : '')); }); });
    }
    const ft = featsTaken();
    if (ft.length) { F.push('', '— TALENTOS —'); ft.forEach(function (f) { const x = IX.feat[f.f]; if (x) F.push('• ' + x[1] + ': ' + x[5]); }); }
    if (b) F.push('', '— ' + b.n.toUpperCase() + ' —', '• ' + b.fn + ': ' + b.fd);
    const pa = profArmor(), arn = { leve: 'leves', media: 'médias', pesada: 'pesadas', escudo: 'escudos' };
    const wp = uniq([].concat((c && c.wpn) || [], (s && s.wpn) || []).map(function (w) { return w === 'simples' ? 'armas simples' : w === 'marcial' ? 'armas marciais' : w.toLowerCase(); }));
    const rw = rget('wpn'); if (rw) wp.push(rw.toLowerCase());
    F.push('', '— PROFICIÊNCIAS —');
    if (pa.length) F.push('• Armaduras: ' + pa.map(function (x) { return arn[x]; }).join(', '));
    if (wp.length) F.push('• Armas: ' + uniq(wp).join(', '));
    const tl = toolsAll(); if (tl.length) F.push('• Ferramentas: ' + tl.join(', ') + (S.exp.indexOf('ladrao') >= 0 ? ' (especialista em ferramentas de ladrão)' : ''));
    F.push('• Idiomas: ' + uniq(langFixed().concat(S.lang)).join(', '));
    sh.feats = F.join('\n');
    sh.atks = [];
    if (S.cls === 'monge') { const die = c.col[0][1][S.lvl - 1], m = Math.max(md(sc.des), md(sc.for)); sh.atks.push({ n: 'Golpe desarmado', b: prof() + m, dmg: die + (m ? sgn(m) : '') }); }
    const items = [];
    let gold = 0;
    if (S.eq.mode === 'kit') { eqItems().forEach(function (it) { items.push(itemRow(it.n, it.q)); }); if (b) gold = b.po; }
    else gold = S.eq.gold || 0;
    sh.cr = JSON.parse(JSON.stringify(S));
    const res = { name: S.name.trim(), sheet: sh, items: items, gold: gold, addItems: !window.HTCriador.hasItems || S.add };
    try { localStorage.removeItem('ht-cr-draft'); } catch (e) { /* ok */ }
    const cb = window.HTCriador._apply;
    close();
    if (cb) cb(res);
  }

  /* ---------- abrir/fechar ---------- */
  const CSS = '.cr-ov{position:fixed;inset:0;z-index:40;background:var(--bg);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
    '.cr-top{display:flex;align-items:center;gap:12px;padding:12px max(16px,env(safe-area-inset-right,0px)) 8px max(16px,env(safe-area-inset-left,0px));max-width:920px;width:100%;margin:0 auto}' +
    '.cr-top h2{flex:1;font-size:19px}.cr-top h2 small{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}' +
    '.cr-steps{display:flex;gap:6px;overflow-x:auto;padding:4px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));max-width:920px;width:100%;margin:0 auto;scrollbar-width:none}' +
    '.cr-steps button{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line);color:var(--muted);border-radius:999px;font:inherit;font-size:14px;min-height:38px;padding:0 12px 0 6px;cursor:pointer}' +
    '.cr-steps button span{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--surface-2);font-family:var(--mono);font-size:12px}' +
    '.cr-steps button.ok span{color:var(--ok)}.cr-steps button[aria-current="step"]{color:var(--accent);border-color:var(--accent);background:var(--accent-soft);box-shadow:0 0 14px rgba(94,225,245,.18)}' +
    '.cr-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}' +
    '.cr-body>*{max-width:888px;margin-left:auto;margin-right:auto}' +
    '.cr-foot{display:flex;align-items:center;gap:10px;padding:10px max(16px,env(safe-area-inset-right,0px)) 12px max(16px,env(safe-area-inset-left,0px));border-top:1px solid var(--line);background:var(--surface);max-width:none}' +
    '.cr-foot .cr-iss{flex:1;text-align:center;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cr-sec{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;display:grid;gap:12px;margin-bottom:12px;min-width:0}' +
    '.cr-sec h3{font-family:var(--serif);font-size:17px;margin:0;letter-spacing:.03em}.cr-pick{border-color:rgba(167,139,250,.55);box-shadow:0 0 22px rgba(167,139,250,.12)}' +
    '.cr-row{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}.cr-wrap{flex-wrap:wrap}' +
    '.cr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}' +
    '.cr-card,.cr-opt{text-align:left;background:var(--bg);border:1px solid var(--line);color:var(--fg);border-radius:12px;padding:12px;font:inherit;cursor:pointer;display:grid;gap:4px;align-content:start;min-width:0}' +
    '.cr-card span,.cr-opt span{font-size:14px;color:var(--muted);line-height:1.4}.cr-card small,.cr-opt small{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.04em}' +
    '.cr-card:hover,.cr-opt:hover{border-color:#5a5390}.cr-opt[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft)}.cr-opt[aria-pressed="true"] b{color:var(--accent)}.cr-opt:disabled{opacity:.42;cursor:default}' +
    '.cr-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.cr-opts.sm{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}' +
    '.cr-chips{display:flex;gap:6px;overflow-x:auto}.cr-chips.cr-wrap{flex-wrap:wrap;overflow:visible}' +
    '.cr-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--line);color:var(--muted);border-radius:999px;font:inherit;font-size:14px;min-height:40px;padding:0 14px;cursor:pointer}' +
    '.cr-chip[aria-pressed="true"]{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}.cr-chip:disabled{opacity:.4;cursor:default}.cr-chip small{font-size:11px;opacity:.7}' +
    '.cr-seg{display:flex;gap:6px;flex-wrap:wrap}.cr-seg>button{flex:1 1 auto;background:var(--bg);border:1px solid var(--line);color:var(--muted);border-radius:10px;font:inherit;font-size:15px;min-height:42px;padding:0 12px;cursor:pointer}.cr-seg>button[aria-pressed="true"]{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}' +
    '.cr-btn{background:var(--accent);color:var(--accent-ink);border:0;border-radius:12px;font:inherit;font-weight:700;min-height:46px;padding:0 18px;cursor:pointer}.cr-btn.q{background:var(--surface-2);color:var(--fg);border:1px solid var(--line);font-weight:400}.cr-btn.sm{min-height:38px;padding:0 12px;font-size:15px}.cr-btn.xs{min-height:34px;min-width:34px;padding:0;font-size:18px}.cr-btn:disabled{opacity:.45;cursor:default}.cr-full{width:100%}' +
    '.cr-x{background:none;border:1px solid var(--line);color:var(--fg);border-radius:10px;width:42px;height:42px;font-size:20px;cursor:pointer}' +
    '.cr-mut{color:var(--muted)}.sm{font-size:14px}.xs{font-size:12px}.cr-bad{color:var(--bad)}.cr-big{font-family:var(--mono);font-size:26px;font-weight:700}' +
    '.cr-tags{display:flex;flex-wrap:wrap;gap:6px;margin:0}.cr-tags span{font-size:13px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;color:var(--muted)}.cr-tags b{color:var(--fg)}' +
    '.cr-src{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:#b9a6ff;border:1px solid rgba(167,139,250,.45);border-radius:6px;padding:0 5px;margin-left:6px;vertical-align:2px;font-weight:400}' +
    '.cr-fl{list-style:none;margin:0;padding:0;display:grid;gap:8px}.cr-fl li{display:flex;gap:10px;font-size:15px;line-height:1.45}.cr-fl b{color:var(--fg)}.cr-fl div{color:var(--muted)}' +
    '.cr-lv{flex:0 0 auto;font-family:var(--mono);font-size:12px;width:28px;height:24px;border-radius:7px;display:grid;place-items:center;background:var(--surface-2);color:var(--accent)}' +
    '.cr-det summary{cursor:pointer;font-weight:700;padding:4px 0}.cr-det[open] summary{margin-bottom:8px}' +
    '.cr-lvl{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.cr-lvl .cr-big{min-width:44px;text-align:center}' +
    '.cr-in{background:var(--bg);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:10px 12px;min-height:46px;width:100%;min-width:0}.cr-in.sm{min-height:38px;padding:6px 8px;font-size:15px;width:auto}' +
    '.cr-lab{display:grid;gap:6px;font-size:14px;color:var(--muted);min-width:0}.cr-row .cr-lab{flex:1 1 160px}.cr-chk{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:var(--fg)}.cr-chk input{width:20px;height:20px;min-height:0;margin-top:2px;flex:0 0 auto}' +
    '.cr-ats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.cr-at{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px 6px;display:grid;justify-items:center;gap:4px;min-width:0}' +
    '.cr-ak{font-family:var(--mono);font-size:12px;letter-spacing:.1em;color:var(--muted)}.cr-av{font-family:var(--mono);font-size:24px;line-height:1}.cr-am{font-family:var(--mono);font-size:14px;color:var(--accent)}' +
    '.cr-step{display:flex;align-items:center;gap:6px}.cr-step b{font-family:var(--mono);min-width:22px;text-align:center}' +
    '@media(max-width:620px){.cr-ats{grid-template-columns:repeat(3,minmax(0,1fr))}.cr-top h2{font-size:16px}.cr-top h2 small{font-size:10px}}' +
    '.cr-rolls{display:flex;gap:8px;flex-wrap:wrap;margin:0}.cr-rolls span{display:grid;justify-items:center;border:1px solid var(--line);border-radius:10px;padding:6px 10px}.cr-rolls b{font-family:var(--mono);font-size:18px}.cr-rolls small{font-family:var(--mono);font-size:11px;color:var(--muted)}' +
    '.cr-asi{border-top:1px solid var(--line);padding-top:10px;display:grid;gap:8px}.cr-blk{display:grid;gap:8px;border-top:1px solid var(--line);padding-top:10px}.cr-blk p{margin:0;font-size:15px}' +
    '.cr-cnt{font-family:var(--mono);font-size:13px;color:var(--hot);border:1px solid currentColor;border-radius:999px;padding:1px 9px}.cr-cnt.ok{color:var(--ok)}' +
    '.cr-spl{list-style:none;margin:0;padding:0;display:grid;gap:6px}.cr-sp{display:flex;gap:10px;align-items:flex-start;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:8px 10px}.cr-sp.on{border-color:rgba(94,225,245,.55)}' +
    '.cr-spb{flex:0 0 auto;width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--fg);font-size:18px;cursor:pointer}.cr-spb[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.cr-spb:disabled{opacity:.45;cursor:default}' +
    '.cr-sp details{flex:1;min-width:0}.cr-sp summary{cursor:pointer;list-style:none;display:grid;gap:2px}.cr-sp summary::-webkit-details-marker{display:none}.cr-sp p{margin:6px 0 2px;font-size:15px;color:var(--fg);line-height:1.45}' +
    '.cr-tag2{font-family:var(--mono);font-size:10px;color:var(--ok);letter-spacing:.04em}.cr-spn{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 6px}.cr-spn .cr-src{margin-left:0}' +
    '.cr-sum{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.cr-sum div{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px;display:grid;gap:2px}.cr-sum div:first-child{grid-column:span 2}.cr-sum div{align-content:start}.cr-sum span{font-size:12px;color:var(--muted);font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}' +
    '.cr-warn{border-color:rgba(255,184,107,.5)}.cr-warn ul{margin:0;padding-left:18px;display:grid;gap:4px;font-size:15px}.cr-link{background:none;border:0;color:var(--accent);font:inherit;padding:0;cursor:pointer;text-decoration:underline}';
  function open(o) {
    index();
    o = o || {};
    let st = o.state;
    if (!st) { try { st = JSON.parse(localStorage.getItem('ht-cr-draft') || 'null'); } catch (e) { st = null; } }
    S = Object.assign(fresh(), st || {});
    S.eq = Object.assign(fresh().eq, S.eq || {}); S.sp = Object.assign(fresh().sp, S.sp || {});
    if (o.name && !S.name) S.name = o.name;
    if (o.state) S.step = 0;
    window.HTCriador.hasItems = !!o.hasItems;
    window.HTCriador._apply = o.onApply || null;
    window.HTCriador._close = o.onClose || null;
    if (!S.add && !o.hasItems) S.add = true;
    if (!document.getElementById('cr-css')) { const s = document.createElement('style'); s.id = 'cr-css'; s.textContent = CSS; document.head.appendChild(s); }
    root = document.createElement('div');
    root.className = 'cr-ov'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Criar personagem');
    root.innerHTML = '<div class="cr-top"><h2><small>D&D 5e · regras de 2014</small>Criar personagem</h2><button type="button" class="cr-btn q sm" data-ca="reset">Recomeçar</button><button type="button" class="cr-x" data-ca="close" aria-label="Fechar">✕</button></div><nav class="cr-steps" aria-label="Etapas"></nav><div class="cr-body"></div><div class="cr-foot"></div>';
    document.body.appendChild(root);
    prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    root.addEventListener('click', function (e) { const b = e.target.closest('[data-ca="reset"]'); if (b) { if (b.dataset.sure) { const nm = S.name; S = fresh(); S.name = nm; paint(false); } else { b.dataset.sure = '1'; b.textContent = 'Tem certeza?'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Recomeçar'; } }, 3000); } return; } onClick(e); });
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    paint(false);
  }
  function close() {
    if (!root) return;
    root.remove(); root = null;
    document.body.style.overflow = prevOverflow;
    const cb = window.HTCriador._close; if (cb) cb();
  }
  window.HTCriador = { open: open, close: close, hasItems: false, _apply: null, _close: null, _state: function () { return S; } };
})();
