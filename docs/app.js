// れんさ道場 — 落ちものパズルの連鎖を、お手本どおりに置きながら覚える。
// 盤面は g[x][y](x=0..5 左から、y=0..12 下から。y=12 は見えない置き場)。色は 1〜4、空は 0。
'use strict';

// 「もどる」「やめる」を押したら、本当にもどるか確かめる(スマホの「戻る」操作も)。
// 画面のボタンは id="back" / id="quit"。もともと確認があるボタンは data-noconfirm をつけて除く
(() => {
  let bypass = false, ignorePop = false;
  const pass = fn => { bypass = true; fn(); setTimeout(() => { bypass = false; }, 500); };
  const ask = onYes => {
    if (document.getElementById('leave-confirm')) return;
    const d = document.createElement('div');
    d.id = 'leave-confirm'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px';
    d.innerHTML = '<div style="background:#fff;color:#222;border-radius:16px;padding:20px 18px;max-width:320px;width:100%;display:grid;gap:14px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.25)">'
      + '<b style="font-size:18px">本当にもどりますか？</b><span style="font-size:14px;color:#555">いまの続きは消えることがあります。</span>'
      + '<div style="display:flex;gap:10px"><button type="button" data-a="no" style="flex:1;padding:12px;border-radius:12px;border:1px solid #ccc;background:#fff;color:#222;font:inherit;font-weight:700">つづける</button>'
      + '<button type="button" data-a="yes" style="flex:1;padding:12px;border-radius:12px;border:0;background:#2f6fd0;color:#fff;font:inherit;font-weight:700">もどる</button></div></div>';
    d.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (!a && e.target !== d) return;
      d.remove();
      if (a && a.dataset.a === 'yes') onYes();
    });
    document.body.appendChild(d);
    d.querySelector('[data-a="no"]').focus();
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('#back, #quit');
    if (!b || bypass || b.hasAttribute('data-noconfirm')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ask(() => pass(() => b.click()));
  }, true);
  // ROUTED: このアプリが画面ごとに履歴を積むか。積まないアプリは、戻る操作を受け止める「しおり」を1つ積んでおく
  const ROUTED = false;
  const guard = () => history.pushState({ leaveGuard: 1 }, '');
  if (!ROUTED) guard();
  window.addEventListener('popstate', e => {
    if (ignorePop) { ignorePop = false; e.stopImmediatePropagation(); return; }
    if (bypass) return;
    e.stopImmediatePropagation();
    if (!ROUTED) {
      const b = document.querySelector('#back, #quit');
      if (!b) { history.back(); return; }                 // メニュー画面ではそのままアプリを閉じる
      guard();
      if (b.hasAttribute('data-noconfirm')) { b.click(); return; }
      ask(() => pass(() => b.click()));
      return;
    }
    ignorePop = true; history.go(1); // いったん元の画面にとどまる
    ask(() => pass(() => history.back()));
  }, true);
})();

// ---------- ふりがな(ちりパズルと同じく、漢字の上に小さく読みを出す)
// 辞書 window.FURI は furi.js(onze.ltd/tools/furigana/make-furi.js が自動生成)。
// 画面に出た文字を自動で包むので、各画面のコードは変えなくてよい。答え合わせに使う textContent は変わらない(読みは CSS で表示)。
// 切りかえボタンは、data-furi-slot を付けた場所に自動で入る。設定はアプリごとに保存
(() => {
  const D = window.FURI || {};
  // 先頭の1文字ごとに、長い順に並べておく(文まるごと → 単語の順に当てはめる)
  const byHead = {};
  Object.keys(D).sort((a, b) => b.length - a.length).forEach(k => (byHead[k[0]] = byHead[k[0]] || []).push(k));
  const KEY = 'furi:' + location.pathname;
  let on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { /* 保存できなくても動く */ }
  const css = document.createElement('style');
  // アプリ側の「span に〜」という指定が効かないように、ルビの span は !important で固める
  css.textContent = '.rbw,.rb{margin:0!important;border:0!important;background:none!important;min-width:0!important;font:inherit!important;color:inherit!important;letter-spacing:inherit!important;text-indent:0!important}'
    + '.rbw{display:inline!important;padding:0!important}'
    + '.rb{display:inline-block!important;position:relative!important;padding:0!important}'
    // ふりがなありの時は行の高さを広げ、読みは行間(漢字の上のすき間)に置く。行ごとに高さがばらつかない
    + 'html.furi body{line-height:2.2}'
    + 'html.furi .rb{line-height:max(2.2em, 1em + 17px)!important}'
    + 'html.furi .rb::before{content:attr(data-rt);position:absolute;bottom:calc(50% + 1.02em);left:50%;transform:translateX(-50%);font-size:max(.5em,7.5px);font-weight:700;line-height:1.1;white-space:nowrap;letter-spacing:0;pointer-events:none}'
    + '.furi-tools{display:inline-flex;flex-wrap:wrap;gap:6px;justify-self:start;align-self:center;width:auto;flex:none;line-height:1.4}'
    + '.furi-toggle{width:auto;flex:none;line-height:1.4;border:1.5px solid rgba(127,127,127,.4);background:transparent;color:inherit;border-radius:999px;padding:4px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}'
    + '.furi-toggle[aria-pressed="true"]{border-color:currentColor}';
  document.head.appendChild(css);
  const apply = () => document.documentElement.classList.toggle('furi', on);
  apply();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TITLE']);
  const ok = el => {
    for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (e.namespaceURI === 'http://www.w3.org/2000/svg') return false;
      if (e.classList.contains('rb') || e.classList.contains('rbw') || e.hasAttribute('data-nofuri')) return false;
      if (e.lang && !/^ja/i.test(e.lang)) return false; // 外国語の文字(中国語の漢字など)には付けない
      if (SKIP.has(e.tagName)) return false;
    }
    return true;
  };
  function wrapText(node) {
    const t = node.nodeValue;
    if (!/[一-鿿々]/.test(t)) return;
    const frag = document.createDocumentFragment();
    let last = 0, hit = false;
    for (let i = 0; i < t.length;) {
      const k = (byHead[t[i]] || []).find(x => t.startsWith(x, i));
      if (!k) { i++; continue; }
      hit = true;
      if (i > last) frag.appendChild(document.createTextNode(t.slice(last, i)));
      for (const seg of D[k]) {
        if (typeof seg === 'string') { frag.appendChild(document.createTextNode(seg)); continue; }
        const s = document.createElement('span'); s.className = 'rb'; s.dataset.rt = seg[1]; s.textContent = seg[0];
        frag.appendChild(s);
      }
      i = last = i + k.length;
    }
    if (!hit) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    // 1つの span にまとめて入れる(flex や grid の中で、ルビごとに改行されないように)
    const w = document.createElement('span'); w.className = 'rbw'; w.appendChild(frag);
    node.replaceWith(w);
  }
  // 切りかえボタンを入れる箱(効果音ボタンもここに入る)
  function tools(slot) {
    let box = slot.querySelector(':scope > .furi-tools');
    if (!box) { box = document.createElement('span'); box.className = 'furi-tools'; box.setAttribute('data-nofuri', ''); slot.appendChild(box); }
    return box;
  }
  function toggleHtml() { return `<button type="button" class="furi-toggle" data-furi-toggle aria-pressed="${on}">ふりがな ${on ? 'あり' : 'なし'}</button>`; }
  function scan(root) {
    if (root.nodeType === 3) { if (ok(root.parentNode)) wrapText(root); return; }
    if (root.nodeType !== 1 || !ok(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    let n; while ((n = w.nextNode())) if (ok(n.parentNode)) list.push(n);
    list.forEach(wrapText);
    const slots = root.querySelectorAll ? [...root.querySelectorAll('[data-furi-slot]')] : [];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-furi-toggle]')) tools(s).insertAdjacentHTML('afterbegin', toggleHtml()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) scan(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-furi-toggle]'); if (!b) return;
    on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    apply();
    document.querySelectorAll('[data-furi-toggle]').forEach(x => { x.setAttribute('aria-pressed', on); x.textContent = 'ふりがな ' + (on ? 'あり' : 'なし'); });
  });
  window.furiTools = tools;
  if (document.body) scan(document.body);
})();

// ---------- 効果音(Web Audio で合成。音声ファイルは使わない)
// SE.play('ok') のように呼ぶ。音の名前: start / select / ok / ng / star / result / perfect / land / clear / over
// SE.chain(n) は連鎖の n 段目(段ごとに高くなる)。
// 「音あり/なし」ボタンは data-furi-slot の場所に自動で入る(ふりがなボタンのとなり)。設定はアプリごとに保存
const SE = (() => {
  const KEY = 'se-muted:' + location.pathname;
  let muted = false, ctx = null;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* 保存できなくても動く */ }
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // 1音: 周波数・開始(秒)・長さ・波形・音量・(最後の周波数)
  function tone(freq, at, dur, type = 'sine', vol = 0.18, slideTo = null) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    start: () => { tone(523, 0, 0.09, 'triangle'); tone(784, 0.08, 0.14, 'triangle'); },
    select: () => tone(660, 0, 0.06, 'triangle', 0.12),
    ok: () => { tone(880, 0, 0.12, 'sine', 0.2); tone(1319, 0.1, 0.28, 'sine', 0.2); },
    ng: () => tone(220, 0, 0.32, 'square', 0.07, 150),
    star: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.14)),
    result: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.18, 'triangle')),
    perfect: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.16, 'triangle')); [1047, 1319, 1568].forEach(f => tone(f, 0.42, 0.6, 'sine', 0.1)); },
    land: () => tone(180, 0, 0.08, 'triangle', 0.16, 110),
    clear: () => { [659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.14, 'triangle')); tone(1319, 0.3, 0.45, 'sine', 0.12); },
    over: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.26, 'triangle', 0.14)),
  };
  function play(name) { if (muted || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* 音が出せない環境でも遊べる */ } }
  function chain(n) {
    if (muted) return;
    try { const f = 440 * Math.pow(2, Math.min(n - 1, 9) * 2 / 12); tone(f, 0, 0.1, 'triangle', 0.16); tone(f * 1.5, 0.07, 0.18, 'sine', 0.12); } catch (e) { /* 同上 */ }
  }
  const btn = () => `<button type="button" class="furi-toggle" data-se-toggle aria-pressed="${!muted}">${muted ? '🔇 音なし' : '🔊 音あり'}</button>`;
  function addButtons(root) {
    if (!root.querySelectorAll) return;
    const slots = [...root.querySelectorAll('[data-furi-slot]')];
    if (root.hasAttribute && root.hasAttribute('data-furi-slot')) slots.push(root);
    slots.forEach(s => { if (!s.querySelector('[data-se-toggle]')) (window.furiTools ? window.furiTools(s) : s).insertAdjacentHTML('beforeend', btn()); });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) addButtons(n); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-se-toggle]'); if (!b) return;
    muted = !muted; try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (err) { /* 保存できなくても切りかわる */ }
    document.querySelectorAll('[data-se-toggle]').forEach(x => { x.setAttribute('aria-pressed', !muted); x.textContent = muted ? '🔇 音なし' : '🔊 音あり'; });
    play('select');
  });
  if (document.body) addButtons(document.body);
  return { play, chain, get muted() { return muted; } };
})();


const $app = document.getElementById('app');
const W = 6, H = 13, VIS = 12;
const STORE = 'rd:';
const load = (k, d) => { try { const v = localStorage.getItem(STORE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const COLOR_NAME = ['', '赤', '緑', '青', '黄'];

// ---------- 盤面のしくみ ----------
const newGrid = () => Array.from({ length: W }, () => Array(H).fill(0));
const clone = g => g.map(c => c.slice());
const cellsOf = p => {
  const d = [[0, 1], [1, 0], [0, -1], [-1, 0]][p.rot];
  return [[p.x, p.y, p.a], [p.x + d[0], p.y + d[1], p.c]];
};
const free = (g, x, y) => x >= 0 && x < W && y >= 0 && y < H && !g[x][y];
const canPut = (g, p) => cellsOf(p).every(([x, y]) => free(g, x, y));
function settle(g) { for (let x = 0; x < W; x++) { const col = g[x].filter(v => v); g[x] = col.concat(Array(H - col.length).fill(0)); } }
function lockPair(g, p) { for (const [x, y, v] of cellsOf(p)) g[x][y] = v; settle(g); }
function dropTo(g, p) { const q = { ...p }; while (canPut(g, { ...q, y: q.y - 1 })) q.y--; return q; }
function groups(g) {
  const seen = new Set(), out = [];
  for (let x = 0; x < W; x++) for (let y = 0; y < VIS; y++) {
    if (!g[x][y] || seen.has(x * H + y)) continue;
    const col = g[x][y], st = [[x, y]], grp = []; seen.add(x * H + y);
    while (st.length) {
      const [cx, cy] = st.pop(); grp.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= VIS || seen.has(nx * H + ny) || g[nx][ny] !== col) continue;
        seen.add(nx * H + ny); st.push([nx, ny]);
      }
    }
    if (grp.length >= 4) out.push(grp);
  }
  return out;
}

// ---------- 描画 ----------
let ui = null;
function boardHtml() { return `<div class="board" id="board"><div class="grid"></div></div>`; }
function sizeBoard() {
  const b = document.getElementById('board'); if (!b) return;
  const mid = b.parentElement, side = mid.querySelector('.side');
  const availW = mid.clientWidth - (side ? side.offsetWidth + 10 : 0) - 20, availH = mid.clientHeight - 4;
  const cell = Math.max(18, Math.floor(Math.min(availW / W, availH / VIS)));
  ui.cell = cell; b.style.width = cell * W + 4 + 'px'; b.style.height = cell * VIS + 4 + 'px';
  b.querySelector('.grid').style.backgroundSize = `${cell}px ${cell}px`;
  // 説明文の行数やふりがなで上の枠の高さが変わったら、盤の大きさを合わせ直す
  if (!mid._ro && window.ResizeObserver) { let h = mid.clientHeight; mid._ro = new ResizeObserver(() => { if (mid.clientHeight !== h && document.body.contains(b)) { h = mid.clientHeight; sizeBoard(); render(); } }); mid._ro.observe(mid); }
}
function tb(x, y, v, extra = '') {
  const c = ui.cell, s = c - 4;
  return `<div class="tb c${v} ${extra}" style="width:${s}px;height:${s}px;left:${x * c + 2}px;top:${(VIS - 1 - y) * c + 2}px"></div>`;
}
function draw(g, pair, ghost, popping) {
  const b = document.getElementById('board'); if (!b) return;
  let s = '<div class="grid" style="background-size:' + ui.cell + 'px ' + ui.cell + 'px"></div>';
  // 落ちてくる列に薄いレーンを引き、着地する場所に小さな印を出す
  if (pair) {
    const c = ui.cell, cols = [...new Set(cellsOf(pair).map(([x]) => x))];
    for (const x of cols) s += `<div class="lane" style="left:${x * c + 2}px;width:${c}px"></div>`;
    const land = dropTo(g, pair), tmp = clone(g); lockPair(tmp, land);
    for (let x = 0; x < W; x++) for (let y = 0; y < VIS; y++) if (tmp[x][y] && !g[x][y]) s += `<div class="landmark c${tmp[x][y]}" style="width:${c - 4}px;height:${c - 4}px;left:${x * c + 2}px;top:${(VIS - 1 - y) * c + 2}px"></div>`;
  }
  if (ghost) for (const [x, y, v] of ghost) s += tb(x, y, v, 'ghost');
  for (let x = 0; x < W; x++) for (let y = 0; y < VIS; y++) if (g[x][y]) s += tb(x, y, g[x][y], popping && popping.has(x * H + y) ? 'pop' : '');
  if (pair) for (const [x, y, v] of cellsOf(pair)) if (y < VIS) s += tb(x, y, v);
  b.innerHTML = s;
}
function nextHtml(p) { return p ? `<div style="display:grid;gap:3px;justify-items:center"><div class="tb c${p.c}" style="position:relative;width:26px;height:26px"></div><div class="tb c${p.a}" style="position:relative;width:26px;height:26px"></div></div>` : ''; }
function chainMsg(n) {
  const b = document.getElementById('board'); if (!b) return;
  const m = document.createElement('div'); m.className = 'chainmsg'; m.textContent = n + 'れんさ!'; b.appendChild(m);
  setTimeout(() => m.remove(), 900);
}
// 消える→落ちる を順に見せる。連鎖数を返す
async function resolveAnimated(g, onChain) {
  let chain = 0;
  for (;;) {
    const gs = groups(g); if (!gs.length) return chain;
    chain++;
    const pop = new Set(); gs.forEach(gr => gr.forEach(([x, y]) => pop.add(x * H + y)));
    draw(g, null, null, pop); chainMsg(chain); SE.chain(chain); onChain && onChain(chain);
    await sleep(420);
    pop.forEach(k => { g[Math.floor(k / H)][k % H] = 0; });
    settle(g); draw(g); await sleep(260);
  }
}

// ---------- 操作 ----------
function move(dx) { const p = ui.pair; if (!p || ui.busy) return; const q = { ...p, x: p.x + dx }; if (canPut(ui.g, q)) { ui.pair = q; render(); } }
function rotate(dir) {
  const p = ui.pair; if (!p || ui.busy) return;
  const r = (p.rot + dir + 4) % 4;
  const tries = [{ ...p, rot: r }, { ...p, rot: r, x: p.x - 1 }, { ...p, rot: r, x: p.x + 1 }, { ...p, rot: r, y: p.y + 1 }, { ...p, rot: (p.rot + 2) % 4 }];
  const ok = tries.find(q => canPut(ui.g, q)); if (ok) { ui.pair = ok; render(); }
}
function soft() { const p = ui.pair; if (!p || ui.busy) return; const q = { ...p, y: p.y - 1 }; if (canPut(ui.g, q)) { ui.pair = q; render(); } else ui.onLand(); }
function hard() { if (!ui.pair || ui.busy) return; ui.pair = dropTo(ui.g, ui.pair); ui.onLand(); }
function render() { draw(ui.g, ui.pair, ui.ghost); }
function controlsHtml() {
  return `<div class="ctrl">
    <button data-k="left" aria-label="左へ">◀</button><button data-k="right" aria-label="右へ">▶</button>
    <button data-k="rl" aria-label="左回転">⟲</button><button data-k="rr" aria-label="右回転">⟳</button>
    <button data-k="soft" aria-label="少し下へ">▼</button><button data-k="hard" class="drop" aria-label="落とす">⤓</button></div>`;
}
function bindControls() {
  const act = { left: () => move(-1), right: () => move(1), rl: () => rotate(-1), rr: () => rotate(1), soft, hard };
  $app.querySelectorAll('.ctrl [data-k]').forEach(b => {
    let timer = null;
    const go = e => { e.preventDefault(); act[b.dataset.k](); if (['left', 'right', 'soft'].includes(b.dataset.k)) timer = setTimeout(function rep() { act[b.dataset.k](); timer = setTimeout(rep, 70); }, 260); };
    const stop = () => clearTimeout(timer);
    b.addEventListener('pointerdown', go); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  });
}
const keymap = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowDown: soft, ArrowUp: () => rotate(1), z: () => rotate(-1), x: () => rotate(1), ' ': hard };
window.addEventListener('keydown', e => { if (!ui || !(e.key in keymap)) return; e.preventDefault(); keymap[e.key](); });
window.addEventListener('resize', () => { if (ui) { sizeBoard(); render(); } });

// ---------- レッスン ----------
// 手順: [x, 回転, 軸の色, 子の色, 説明]。回転 0=子が上 1=子が右。色は 1〜4 の「役」で、毎回ちがう実際の色に入れかえる
const LESSONS = [
  { id: 'l1', title: '4つで消える', sub: '消え方の基本', steps: [
    [2, 0, 1, 1, '同じ色が<b>4つつながると消えます</b>。まず、うすく光っている場所に置こう。<br>◀▶で動かして、<b>⤓</b>で落とします。'],
    [2, 0, 1, 1, 'その上にもう2つ。縦に4つそろうと……'],
    [1, 1, 2, 2, '消えた! <b>横につながっても</b>消えます。<b>⟳</b>で横向きにして置こう。'],
    [3, 1, 2, 2, 'となりに並べて、横に4つ。'],
  ], end: '縦でも横でも、4つつながれば消える。これが基本です。次はいよいよ「連鎖」。' },
  { id: 'l2', title: '2連鎖のしくみ', sub: '3つ並べて、上に1つ', steps: [
    [0, 0, 1, 1, '連鎖とは、消えたあとに<b>落ちてきたつぶが、また4つそろう</b>こと。まず左はしに縦2つ。'],
    [0, 1, 1, 2, '左の列に3つ目。となりの列には別の色を置きます(横向き)。'],
    [1, 0, 2, 2, '2列目に同じ色を重ねて<b>3つ</b>にする。まだ消さないのがコツ。'],
    [1, 0, 1, 3, '<b>ここがポイント</b>。2列目の上に、<b>1列目と同じ色</b>を乗せます。2列目が消えたら、これが落ちて1列目とくっつく役です。'],
    [2, 1, 2, 3, '3列目に置いて<b>発火</b>! 2列目が4つで消える → 上のつぶが落ちる → 1列目と4つ → また消える!'],
  ], end: '<b>2連鎖!</b> 「同じ色を3つ並べて、その上に次の色を1つ」が連鎖の基本形です。' },
  { id: 'l3', title: '3連鎖', sub: '基本形をもう1段', steps: [
    [0, 0, 1, 1, '2連鎖の形を、右にもう1列のばします。左はしに縦2つ。'],
    [0, 1, 1, 2, '1列目を3つに。となりの列に次の色。'],
    [1, 0, 2, 2, '2列目も3つに。'],
    [1, 1, 1, 3, '2列目の上に<b>1列目の色</b>。となりの3列目に、また次の色。'],
    [2, 0, 3, 3, '3列目も3つに。'],
    [2, 0, 2, 4, '3列目の上に<b>2列目の色</b>。上に乗るもう1つは、どこともつながらない色なので気にしなくてOK。'],
    [3, 1, 3, 4, '4列目で<b>発火</b>! 右の列から順に、1つずつ落ちて次の列とくっついていきます。'],
  ], end: '<b>3連鎖!</b> 列ごとに「3つ+上に1つ」をずらして並べると、その列の数だけ連鎖します。' },
  { id: 'l4', title: '4連鎖', sub: '4色ぜんぶを使う', steps: [
    [0, 0, 1, 1, '同じ考え方で4連鎖。左はしから順に組んでいきます。'],
    [0, 1, 1, 2, '1列目を3つ、となりに次の色。'],
    [1, 0, 2, 2, '2列目を3つ。'],
    [1, 1, 1, 3, '2列目の上に1列目の色、3列目に次の色。'],
    [2, 0, 3, 3, '3列目を3つ。'],
    [2, 1, 2, 4, '3列目の上に2列目の色、4列目に次の色。'],
    [3, 0, 4, 4, '4列目を3つ。'],
    [3, 0, 3, 1, '4列目の上に3列目の色。'],
    [4, 1, 4, 1, '5列目で<b>発火</b>! 4つの列が順番にくずれます。'],
  ], end: '<b>4連鎖!</b> 実戦では、この上にもう1段積む「折り返し」などで、もっと長くつなげます。' },
  { id: 'l5', title: '折り返し', sub: '上の段で次の連鎖を待たせる', steps: [
    [0, 0, 1, 1, '「折り返し」は、連鎖を<b>上の段へ返して</b>長くする形。まず2連鎖と同じように、左はしに縦2つ。'],
    [0, 1, 1, 2, '1列目を3つに、2列目に次の色。'],
    [1, 0, 2, 2, '2列目も3つに。'],
    [0, 1, 3, 1, '1列目の上に<b>新しい色</b>、2列目の上に<b>1列目の色</b>(2連鎖の「上に1つ」)。'],
    [0, 1, 3, 3, 'さらに上に、新しい色を横に2つ。ここが<b>折り返し</b>部分。下が2回消えたあと、落ちてきて1つにまとまります。'],
    [2, 0, 2, 3, '3列目に置いて<b>発火</b>! 2列目→1列目と消えたあと、上の段が落ちてきて3つ目の連鎖に。'],
  ], end: '<b>3連鎖!</b> 下が消えると上が落ちてくる。「上の段で次の連鎖を待たせる」のが折り返しです。下の階段を長くして、上で折り返すと5連鎖、6連鎖…と伸ばせます。' },
  { id: 'l6', title: 'GTR', sub: '上級者の定番の土台', steps: [
    [0, 1, 2, 2, '<b>GTR</b>は、上級者がよく使う連鎖の「土台」。まず左はしの1段目に、同じ色を横に2つ。'],
    [0, 1, 1, 1, '2段目に、別の色を横に2つ。'],
    [0, 1, 1, 2, '3段目: 左に2段目と同じ色、右に<b>1段目と同じ色</b>(フタ)。L字の上にフタが乗った形です。'],
    [2, 1, 3, 3, '3列目と4列目の1段目に、次の色を横に2つ。'],
    [2, 0, 2, 3, '3列目の2段目に<b>1段目の色</b>、その上に3列目と同じ色。'],
    [3, 0, 3, 4, '4列目に3つ目の色。上の1つはつながらない色なので気にしなくてOK。'],
    [0, 0, 1, 4, '左はしの上に置いて<b>発火</b>! L字が消える→フタが落ちて1段目とつながる→3列目の上が落ちて…'],
  ], end: '<b>3連鎖!</b> GTRは「L字+フタ」の土台。右側に階段や折り返しをつないでいけば、10連鎖以上も組めます。' },
];
const done = load('done', {});
const record = load('record', { max: 0 });

function shuffledColors() { const a = [1, 2, 3, 4]; for (let i = 3; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return [0, ...a]; }
function lesson(id, demo = false) {
  SE.play('start');
  const L = LESSONS.find(l => l.id === id), map = shuffledColors();
  let step = 0, history = [];
  ui = { g: newGrid(), pair: null, ghost: null, busy: false, cell: 30 };
  $app.innerHTML = `<div class="play">
    <div class="top"><button class="pill" id="quit">✕</button><span class="t">${L.title}</span><span class="pill" id="prog"></span></div>
    <div class="say" id="say"></div>
    <div class="mid">${boardHtml()}<div class="side"><div class="next"><span class="lab">つぎ</span><div id="nx"></div></div><div class="stat">連鎖<b id="ch">0</b></div></div></div>
    <div><div class="subctrl"><button class="btn" id="demo">おてほん</button><button class="btn" id="undo">1手もどす</button><button class="btn" id="redo">はじめから</button></div>${controlsHtml()}</div>
  </div>`;
  $app.querySelector('#quit').onclick = home;
  $app.querySelector('#redo').onclick = () => lesson(id);
  $app.querySelector('#demo').onclick = () => lesson(id, true);
  $app.querySelector('#undo').onclick = () => { if (ui.busy || !history.length) return; ui.g = history.pop(); step--; spawn(); };
  bindControls(); sizeBoard();
  const say = (html, cls = '') => { const s = document.getElementById('say'); s.className = 'say ' + cls; s.innerHTML = html; };
  function target() { const [x, rot, a, c] = L.steps[step]; return { x, y: 10, rot, a: map[a], c: map[c] }; }
  function spawn() {
    if (step >= L.steps.length) return;
    const t = target();
    ui.pair = { x: 2, y: 10, rot: 0, a: t.a, c: t.c };
    const landed = dropTo(ui.g, t), tmp = clone(ui.g); lockPair(tmp, landed);
    ui.ghost = [];
    for (let x = 0; x < W; x++) for (let y = 0; y < VIS; y++) if (tmp[x][y] && !ui.g[x][y]) ui.ghost.push([x, y, tmp[x][y]]);
    const nt = L.steps[step + 1];
    document.getElementById('nx').innerHTML = nt ? nextHtml({ a: map[nt[2]], c: map[nt[3]] }) : '';
    document.getElementById('prog').textContent = `${step + 1} / ${L.steps.length}`;
    say(L.steps[step][4]); render();
    if (demo) autoPlace(t);
  }
  async function autoPlace(t) {
    ui.busy = true; await sleep(700);
    if (t.rot !== ui.pair.rot) { ui.pair = { ...ui.pair, rot: t.rot }; render(); await sleep(300); }
    while (ui.pair.x !== t.x) { ui.pair = { ...ui.pair, x: ui.pair.x + Math.sign(t.x - ui.pair.x) }; render(); await sleep(180); }
    await sleep(250); ui.busy = false; hard();
  }
  ui.onLand = async () => {
    const before = clone(ui.g), p = dropTo(ui.g, ui.pair);
    const test = clone(ui.g); lockPair(test, p);
    const want = clone(ui.g); lockPair(want, dropTo(ui.g, target()));
    if (JSON.stringify(test) !== JSON.stringify(want)) {
      ui.pair = { x: 2, y: 10, rot: 0, a: ui.pair.a, c: ui.pair.c }; render();
      SE.play('ng');
      say('<b>そこじゃないよ。</b>うすく光っている場所に、同じ色の向きで置いてみよう。(⟳で回転)', 'ng');
      return;
    }
    ui.busy = true; ui.pair = null; ui.ghost = null; ui.g = test; render(); SE.play('land');
    history.push(before);
    const n = await resolveAnimated(ui.g, c => document.getElementById('ch').textContent = c);
    ui.busy = false; step++;
    if (step >= L.steps.length) {
      done[id] = true; save('done', done);
      if (n > record.max) { record.max = n; save('record', record); }
      say(L.end, 'ok');
      setTimeout(() => SE.play('clear'), 500);
      const i = LESSONS.indexOf(L), next = LESSONS[i + 1];
      const b = document.getElementById('board');
      const ov = document.createElement('div'); ov.className = 'overlay';
      ov.innerHTML = `<div style="display:grid;gap:10px"><div class="big">${n ? n + 'れんさ!' : 'できた!'}</div><div class="subctrl"><button class="btn" id="again">もう一度(色が変わる)</button>${next ? `<button class="btn main" id="nextL">次: ${next.title}</button>` : `<button class="btn main" id="toFree">かるくプレイへ</button>`}</div></div>`;
      setTimeout(() => { b.appendChild(ov); ov.querySelector('#again').onclick = () => lesson(id); const nl = ov.querySelector('#nextL'); if (nl) nl.onclick = () => lesson(next.id); const tf = ov.querySelector('#toFree'); if (tf) tf.onclick = freePlay; }, 900);
      return;
    }
    spawn();
  };
  spawn();
}

// ---------- かるくプレイ ----------
function freePlay() {
  SE.play('start');
  const randPair = () => ({ a: 1 + rnd(4), c: 1 + rnd(4) });
  let queue = [randPair(), randPair(), randPair()], score = 0, maxChain = 0, timer = null, over = false;
  ui = { g: newGrid(), pair: null, ghost: null, busy: false, cell: 30 };
  $app.innerHTML = `<div class="play">
    <div class="top"><button class="pill" id="quit">✕</button><span class="t">かるくプレイ</span><span class="pill">最高 ${record.max}れんさ</span></div>
    <div class="say" id="say">「3つ並べて、上に次の色」を思い出しながら積んでみよう。<b>⤓</b>ですぐ落とせます。</div>
    <div class="mid">${boardHtml()}<div class="side"><div class="next"><span class="lab">つぎ</span><div id="nx"></div><div id="nx2" style="transform:scale(.75)"></div></div><div class="stat">連鎖<b id="ch">0</b></div><div class="stat">最大<b id="mx">0</b></div><div class="stat">点<b id="sc">0</b></div></div></div>
    <div><div class="subctrl"><button class="btn" id="tips">コツを見る</button><button class="btn" id="restart">はじめから</button></div>${controlsHtml()}</div>
  </div>`;
  $app.querySelector('#quit').onclick = () => { clearInterval(timer); home(); };
  $app.querySelector('#restart').onclick = () => { clearInterval(timer); freePlay(); };
  $app.querySelector('#tips').onclick = () => { document.getElementById('say').innerHTML = TIPS[rnd(TIPS.length)]; };
  bindControls(); sizeBoard();
  function spawn() {
    const n = queue.shift(); queue.push(randPair());
    const p = { x: 2, y: 10, rot: 0, a: n.a, c: n.c };
    if (!canPut(ui.g, p)) return gameOver();
    ui.pair = p;
    document.getElementById('nx').innerHTML = nextHtml(queue[0]); document.getElementById('nx2').innerHTML = nextHtml(queue[1]);
    render();
  }
  function gameOver() {
    over = true; clearInterval(timer); ui.pair = null; SE.play('over');
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div style="display:grid;gap:10px"><div class="big">おしまい</div><p>最大 ${maxChain}れんさ ・ ${score}点</p><div class="subctrl"><button class="btn main" id="again">もう一度</button><button class="btn" id="back" data-noconfirm>メニュー</button></div></div>`;
    document.getElementById('board').appendChild(ov);
    ov.querySelector('#again').onclick = freePlay; ov.querySelector('#back').onclick = home;
  }
  ui.onLand = async () => {
    if (ui.busy || over) return;
    ui.busy = true; lockPair(ui.g, ui.pair); ui.pair = null; render(); SE.play('land');
    const n = await resolveAnimated(ui.g, c => document.getElementById('ch').textContent = c);
    if (n) {
      score += [0, 40, 120, 320, 640, 1100, 1700, 2500][Math.min(n, 7)] + n * 40;
      if (n > maxChain) maxChain = n;
      if (n > record.max) { record.max = n; save('record', record); }
      document.getElementById('mx').textContent = maxChain; document.getElementById('sc').textContent = score;
      if (n >= 2) document.getElementById('say').innerHTML = `<b>${n}れんさ!</b> ${n >= 3 ? 'すごい、ちゃんと組めています。' : 'いいね。次は3連鎖を狙おう。'}`;
    }
    ui.busy = false; spawn();
  };
  timer = setInterval(() => { if (!ui.busy && ui.pair && !over && document.getElementById('board')) soft(); else if (!document.getElementById('board')) clearInterval(timer); }, 900);
  spawn();
}
const TIPS = [
  '<b>コツ1</b>: 同じ色を<b>3つ</b>まで集めて、すぐには消さない。4つ目は「発火」用にとっておく。',
  '<b>コツ2</b>: 3つ集めた色の<b>上に、別の色を1つ</b>乗せる。下が消えたら落ちて、次の色とくっつく。',
  '<b>コツ3</b>: 左はしから右へ、列ごとに「3つ+上に1つ」をずらす(レッスンの形)。',
  '<b>コツ4</b>: いらない色は、右はしの列にまとめて置いておくと、じゃまになりにくい。',
  '<b>コツ5</b>: 真ん中(左から3列目)の上まで積むと終わり。高く積みすぎないように。',
];

// ---------- ホーム ----------
function home() {
  ui = null;
  const items = LESSONS.map((l, i) => `<button class="item" data-l="${l.id}"><span class="n">${i + 1}</span><span><b>${l.title}</b><span class="small muted">${l.sub}</span></span><span class="ok">${done[l.id] ? '✓' : ''}</span></button>`).join('');
  $app.innerHTML = `<div class="home" data-furi-slot>
    <h1>れんさ<span>道場</span></h1>
    <p class="muted">落ちものパズルの「連鎖」を、お手本どおりに置きながら覚えよう。置く場所がうすく光り、そのとおりに置けるつぶが送られてきます。</p>
    <div class="list">${items}
      <button class="item free" id="free"><span class="n">▶</span><span><b>かるくプレイ</b><span class="small muted">自由に積んで連鎖をねらう(最高 ${record.max}れんさ)</span></span><span></span></button></div>
    <div class="card"><b>連鎖のコツ</b>${TIPS.map(t => `<p class="tip small">${t}</p>`).join('')}</div>
    <p class="small muted">操作: ◀▶ 移動 / ⟲⟳ 回転 / ▼ 少し下 / ⤓ 落とす。パソコンは ←→ 移動、↑・X・Z 回転、↓、スペースで落とす。</p>
  </div>`;
  $app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => lesson(b.dataset.l));
  $app.querySelector('#free').onclick = freePlay;
}
home();
