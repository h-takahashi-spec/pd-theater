/* ============================================================
 * イラスト部品（すべてインラインSVG。外部画像なし）
 * ============================================================ */
(function () {
  var INK = '#2b2622';
  var SW = 3;

  function g(x, y, s, flip, inner) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')">' + inner + '</g>';
  }

  /* ---------- 目と口 ---------- */
  function eyes(expr) {
    var o = '';
    switch (expr) {
      case 'happy':
        o += '<path d="M-15 -2 q5 -7 10 0 M5 -2 q5 -7 10 0" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        break;
      case 'smug':
        o += '<path d="M-16 -3 h10 M6 -3 h10" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        o += '<path d="M-16 -10 l10 3 M16 -10 l-10 3" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
        break;
      case 'shock':
        o += '<circle cx="-10" cy="-3" r="7" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/><circle cx="10" cy="-3" r="7" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>';
        o += '<circle cx="-10" cy="-3" r="2" fill="' + INK + '"/><circle cx="10" cy="-3" r="2" fill="' + INK + '"/>';
        break;
      case 'angry':
        o += '<circle cx="-10" cy="-1" r="3.5" fill="' + INK + '"/><circle cx="10" cy="-1" r="3.5" fill="' + INK + '"/>';
        o += '<path d="M-17 -12 l11 5 M17 -12 l-11 5" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        break;
      case 'worried':
        o += '<circle cx="-10" cy="-1" r="3.5" fill="' + INK + '"/><circle cx="10" cy="-1" r="3.5" fill="' + INK + '"/>';
        o += '<path d="M-17 -8 l10 -4 M17 -8 l-10 -4" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
        o += '<path d="M24 -14 q4 7 0 10 q-4 -3 0 -10z" fill="#7cc6ff" stroke="' + INK + '" stroke-width="1.5"/>';
        break;
      case 'sad':
        o += '<path d="M-15 -4 q5 5 10 0 M5 -4 q5 5 10 0" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        o += '<path d="M-12 4 q-2 6 1 8" fill="none" stroke="#7cc6ff" stroke-width="3" stroke-linecap="round"/>';
        break;
      case 'think':
        o += '<circle cx="-10" cy="-1" r="3.5" fill="' + INK + '"/><path d="M5 -1 h10" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        o += '<path d="M-17 -10 l10 1 M17 -12 l-10 3" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
        break;
      case 'sleep':
        o += '<path d="M-15 -1 q5 4 10 0 M5 -1 q5 4 10 0" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
        break;
      default:
        o += '<circle cx="-10" cy="-2" r="3.8" fill="' + INK + '"/><circle cx="10" cy="-2" r="3.8" fill="' + INK + '"/>';
        o += '<circle cx="-8.8" cy="-3.3" r="1.2" fill="#fff"/><circle cx="11.2" cy="-3.3" r="1.2" fill="#fff"/>';
    }
    return o;
  }
  function mouth(expr, kind) {
    if (expr === 'shock') return '<ellipse cx="0" cy="13" rx="5" ry="6" fill="' + INK + '"/>';
    if (expr === 'happy') return '<path d="M-7 9 q7 9 14 0 z" fill="#e2564f" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
    if (expr === 'sad' || expr === 'worried') return '<path d="M-6 14 q6 -6 12 0" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
    if (expr === 'angry') return '<path d="M-7 13 h14" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
    if (expr === 'smug') return '<path d="M-6 10 q8 6 12 -3" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
    if (expr === 'sleep') return '<ellipse cx="0" cy="12" rx="3" ry="2" fill="' + INK + '"/>';
    if (kind === 'cat') return '<path d="M-7 8 q3.5 5 7 0 q3.5 5 7 0" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
    return '<path d="M-6 9 q6 6 12 0" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
  }

  /* ---------- 帽子・小物 ---------- */
  function hat(type) {
    switch (type) {
      case 'fedora':
        return '<path d="M-34 -22 q34 -10 68 0 q-34 8 -68 0z" fill="#5b4636" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<path d="M-20 -24 q2 -22 20 -22 q18 0 20 22z" fill="#6d5644" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<path d="M-19 -28 h38" stroke="#2f2a26" stroke-width="5"/>';
      case 'mask': // 怪盗のアイマスク
        return '<path d="M-27 -8 q13 -9 27 -2 q14 -7 27 2 q-2 12 -13 11 q-9 -1 -14 -6 q-5 5 -14 6 q-11 1 -13 -11z" fill="#2b2622"/>';
      case 'bandana':
        return '<path d="M-28 -14 q28 -26 56 0 q-28 -6 -56 0z" fill="#e2564f" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<circle cx="-6" cy="-21" r="2" fill="#fff"/><circle cx="8" cy="-22" r="2" fill="#fff"/>' +
          '<path d="M26 -14 l12 4 l-4 8z" fill="#e2564f" stroke="' + INK + '" stroke-width="2"/>';
      case 'hunter':
        return '<path d="M-26 -18 q26 -30 52 0z" fill="#3f7d4e" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<path d="M14 -30 q14 -14 22 -24" fill="none" stroke="#e2564f" stroke-width="4" stroke-linecap="round"/>';
      case 'chef':
        return '<path d="M-20 -22 q-14 -8 -6 -22 q6 -10 16 -4 q8 -12 20 -2 q12 -4 14 8 q4 12 -10 18z" fill="#fff" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<rect x="-19" y="-26" width="38" height="8" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>';
      case 'towel':
        return '<path d="M-29 -10 q29 -18 58 0 l-2 6 q-27 -14 -54 0z" fill="#f2c14e" stroke="' + INK + '" stroke-width="2.5"/>';
      case 'police':
        return '<path d="M-24 -20 q24 -26 48 0z" fill="#2f4b7c" stroke="' + INK + '" stroke-width="' + SW + '"/>' +
          '<path d="M-28 -20 h56" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-30" r="4" fill="#f2c14e" stroke="' + INK + '" stroke-width="1.5"/>';
      case 'ribbon':
        return '<path d="M14 -30 l12 -10 l2 14z M14 -30 l14 6 l-8 8z" fill="#e2564f" stroke="' + INK + '" stroke-width="2"/>';
      case 'nightcap':
        return '<path d="M-26 -16 q10 -30 40 -26 q14 2 22 22 q-30 -8 -62 4z" fill="#6c7ee1" stroke="' + INK + '" stroke-width="2.5"/><circle cx="38" cy="-20" r="6" fill="#fff" stroke="' + INK + '" stroke-width="2"/>';
    }
    return '';
  }

  /* ---------- キャラクター ----------
   * kind: cat / tanuki / goat / human / dog / rabbit / bear
   * (x,y) は頭の中心。体は下に描く。 */
  function critter(o) {
    o = o || {};
    var kind = o.kind || 'cat', color = o.color || '#f4a261', expr = o.expr || 'normal';
    var body = o.body !== false, s = o.s || 1;
    var c = '';
    if (body) {
      var bc = o.bodyColor || color;
      c += '<ellipse cx="0" cy="52" rx="25" ry="27" fill="' + bc + '" stroke="' + INK + '" stroke-width="' + SW + '"/>';
      if (kind !== 'human') c += '<ellipse cx="0" cy="58" rx="14" ry="16" fill="#fff6e6" opacity=".85"/>';
      if (o.arms === 'up') {
        c += '<path d="M-22 40 q-14 -14 -16 -30 M22 40 q14 -14 16 -30" fill="none" stroke="' + INK + '" stroke-width="' + SW + '" stroke-linecap="round"/>';
      } else if (o.arms === 'point') {
        c += '<path d="M22 44 q18 -2 30 -10" fill="none" stroke="' + INK + '" stroke-width="' + SW + '" stroke-linecap="round"/>';
      }
      if (kind === 'cat' || kind === 'tanuki') {
        var tc = kind === 'tanuki' ? '#7a5a3a' : bc;
        c = '<path d="M-20 64 q-30 6 -30 -20" fill="none" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/>' +
            '<path d="M-20 64 q-30 6 -30 -20" fill="none" stroke="' + tc + '" stroke-width="5" stroke-linecap="round"/>' + c;
      }
    }
    // 耳
    if (kind === 'cat') {
      c += '<path d="M-26 -12 L-22 -40 L-4 -26z M26 -12 L22 -40 L4 -26z" fill="' + color + '" stroke="' + INK + '" stroke-width="' + SW + '" stroke-linejoin="round"/>';
      c += '<path d="M-21 -20 L-19 -32 L-11 -25z M21 -20 L19 -32 L11 -25z" fill="#f7a8b8"/>';
    } else if (kind === 'tanuki' || kind === 'bear') {
      c += '<circle cx="-19" cy="-24" r="9" fill="' + color + '" stroke="' + INK + '" stroke-width="' + SW + '"/><circle cx="19" cy="-24" r="9" fill="' + color + '" stroke="' + INK + '" stroke-width="' + SW + '"/>';
    } else if (kind === 'goat') {
      c += '<path d="M-12 -24 q-18 -22 -30 -6 q10 -6 18 6z M12 -24 q18 -22 30 -6 q-10 -6 -18 6z" fill="#d9c7a3" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
      c += '<ellipse cx="-30" cy="-6" rx="12" ry="5" transform="rotate(20 -30 -6)" fill="' + color + '" stroke="' + INK + '" stroke-width="2.5"/>';
      c += '<ellipse cx="30" cy="-6" rx="12" ry="5" transform="rotate(-20 30 -6)" fill="' + color + '" stroke="' + INK + '" stroke-width="2.5"/>';
    } else if (kind === 'dog') {
      c += '<ellipse cx="-25" cy="-4" rx="9" ry="17" transform="rotate(18 -25 -4)" fill="#8a5a3b" stroke="' + INK + '" stroke-width="2.5"/>';
      c += '<ellipse cx="25" cy="-4" rx="9" ry="17" transform="rotate(-18 25 -4)" fill="#8a5a3b" stroke="' + INK + '" stroke-width="2.5"/>';
    } else if (kind === 'rabbit') {
      c += '<ellipse cx="-11" cy="-42" rx="8" ry="22" fill="' + color + '" stroke="' + INK + '" stroke-width="2.5"/><ellipse cx="11" cy="-42" rx="8" ry="22" fill="' + color + '" stroke="' + INK + '" stroke-width="2.5"/>';
      c += '<ellipse cx="-11" cy="-40" rx="3.5" ry="14" fill="#f7a8b8"/><ellipse cx="11" cy="-40" rx="3.5" ry="14" fill="#f7a8b8"/>';
    }
    // 頭
    var headColor = kind === 'human' ? (o.skin || '#f6d3b3') : color;
    c += '<circle cx="0" cy="0" r="28" fill="' + headColor + '" stroke="' + INK + '" stroke-width="' + SW + '"/>';
    if (kind === 'human') {
      var hc = o.hair || '#3a2e28';
      if (o.hairStyle === 'long') c += '<path d="M-28 4 q-4 -34 28 -34 q32 0 28 34 q-6 -18 -14 -22 q-12 10 -36 4 q-4 6 -6 18z" fill="' + hc + '" stroke="' + INK + '" stroke-width="2.5"/>';
      else c += '<path d="M-28 -2 q-2 -30 28 -30 q30 0 28 30 q-8 -14 -18 -16 q-10 8 -30 2 q-6 4 -8 14z" fill="' + hc + '" stroke="' + INK + '" stroke-width="2.5"/>';
    }
    if (kind === 'tanuki') {
      c += '<ellipse cx="-11" cy="-1" rx="10" ry="8" fill="#5b4330"/><ellipse cx="11" cy="-1" rx="10" ry="8" fill="#5b4330"/>';
      c += '<ellipse cx="0" cy="11" rx="9" ry="7" fill="#fff6e6"/>';
    }
    if (kind === 'goat') c += '<ellipse cx="0" cy="12" rx="11" ry="8" fill="#fff6e6"/>';
    var ex = (kind === 'tanuki' && (expr === 'normal')) ? 'normal' : expr;
    c += eyes(ex);
    // 鼻
    if (kind === 'cat' || kind === 'rabbit') c += '<path d="M-3 4 h6 l-3 3z" fill="#e2789a" stroke="' + INK + '" stroke-width="1.2"/>';
    else if (kind === 'dog' || kind === 'tanuki' || kind === 'bear') c += '<ellipse cx="0" cy="6" rx="4.5" ry="3.2" fill="' + INK + '"/>';
    else if (kind === 'goat') c += '<path d="M-3 6 q3 2 6 0" stroke="' + INK + '" stroke-width="2" fill="none"/>';
    c += mouth(expr, kind);
    if (kind === 'cat') c += '<path d="M-14 6 l-16 -3 M-14 10 l-16 3 M14 6 l16 -3 M14 10 l16 3" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round"/>';
    if (kind === 'goat') c += '<path d="M-6 24 q6 18 12 0z" fill="#efe5cf" stroke="' + INK + '" stroke-width="2"/>';
    if (expr !== 'angry' && expr !== 'sleep') c += '<ellipse cx="-17" cy="8" rx="5" ry="3" fill="#f59ab0" opacity=".6"/><ellipse cx="17" cy="8" rx="5" ry="3" fill="#f59ab0" opacity=".6"/>';
    if (o.hat) c += hat(o.hat);
    return g(o.x || 0, o.y || 0, s, o.flip, c);
  }

  /* ---------- 吹き出し ---------- */
  function bubble(x, y, text, o) {
    o = o || {};
    var lines = String(text).split('\n');
    var fs = o.fs || 15;
    var w = o.w || Math.max.apply(null, lines.map(function (l) { return l.length; })) * fs + 26;
    var h = lines.length * (fs + 5) + 18;
    var fill = o.fill || '#fff';
    var s = '<g class="bubble">';
    var by = y + h;
    // しっぽの付け根（吹き出しの下辺）と先端（話し手の頭の方向）
    var tx = o.to ? o.to[0] : (o.tail === 'right' ? x + w - 24 : o.tail === 'down' ? x + w / 2 : x + 24);
    var ty = o.to ? o.to[1] : by + 18;
    var bx = Math.min(Math.max(tx - 7, x + 14), x + w - 28);
    var tipx = Math.min(Math.max(tx, bx - 22), bx + 34);
    var tipy = Math.max(by + 10, Math.min(ty, by + 24));
    if (o.think) {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="2.5"/>';
      if (!o.noTail) {
        var cx = bx + 7;
        s += '<circle cx="' + (cx + (tipx - cx) * 0.35) + '" cy="' + (by + (tipy - by) * 0.45) + '" r="5" fill="' + fill + '" stroke="' + INK + '" stroke-width="2"/>';
        s += '<circle cx="' + (cx + (tipx - cx) * 0.8) + '" cy="' + (by + (tipy - by) * 1.0) + '" r="3" fill="' + fill + '" stroke="' + INK + '" stroke-width="2"/>';
      }
    } else {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + fill + '" stroke="' + INK + '" stroke-width="2.5"/>';
      if (!o.noTail) {
        s += '<path d="M' + bx + ' ' + (by - 1.5) + ' L' + tipx + ' ' + tipy + ' L' + (bx + 14) + ' ' + (by - 1.5) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
        s += '<path d="M' + (bx + 1.5) + ' ' + (by - 1.5) + ' h11" stroke="' + fill + '" stroke-width="4"/>';
      }
    }
    lines.forEach(function (l, i) {
      s += '<text x="' + (x + w / 2) + '" y="' + (y + 13 + fs + i * (fs + 5) - 2) + '" font-size="' + fs + '" text-anchor="middle" fill="' + INK + '" font-weight="700">' + esc(l) + '</text>';
    });
    return s + '</g>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function caption(x, y, text, o) {
    o = o || {};
    var fs = o.fs || 18;
    return '<text x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + (o.anchor || 'middle') + '" fill="' + (o.fill || INK) + '" font-family="\'Mochiy Pop One\', sans-serif" ' + (o.rotate ? 'transform="rotate(' + o.rotate + ' ' + x + ' ' + y + ')"' : '') + '>' + esc(text) + '</text>';
  }

  /* ---------- 小道具・背景 ---------- */
  var P = {
    sky: function (c1, c2) {
      var id = 'sk' + Math.random().toString(36).slice(2, 7);
      return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="400" height="240" fill="url(#' + id + ')"/>';
    },
    floor: function (y, c) { return '<rect x="0" y="' + y + '" width="400" height="' + (240 - y) + '" fill="' + c + '"/>'; },
    stars: function (n) {
      var s = '';
      for (var i = 0; i < n; i++) {
        var x = (i * 97) % 390 + 5, y = (i * 53) % 90 + 8;
        s += '<path d="M' + x + ' ' + (y - 4) + ' l1.2 3 3 1 -3 1 -1.2 3 -1.2 -3 -3 -1 3 -1z" fill="#fff6c7"/>';
      }
      return s;
    },
    moon: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="18" fill="#fff3b0"/><circle cx="' + (x + 8) + '" cy="' + (y - 5) + '" r="15" fill="#2c3466"/>'; },
    bars: function (x, y, w, h) {
      var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="#555" stroke-width="5"/>';
      for (var i = x + 14; i < x + w; i += 18) s += '<path d="M' + i + ' ' + y + ' v' + h + '" stroke="#666" stroke-width="5"/>';
      return s;
    },
    lamp: function (x, y) {
      return '<path d="M' + x + ' 0 v' + (y - 14) + '" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M' + (x - 22) + ' ' + y + ' q22 -26 44 0z" fill="#3b3b3b" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M' + (x - 22) + ' ' + y + ' L' + (x - 80) + ' 240 L' + (x + 80) + ' 240 L' + (x + 22) + ' ' + y + 'z" fill="#fff3b0" opacity=".35"/>';
    },
    table: function (x, y, w) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="12" rx="3" fill="#8a6446" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M' + (x + 10) + ' ' + (y + 12) + ' v40 M' + (x + w - 10) + ' ' + (y + 12) + ' v40" stroke="' + INK + '" stroke-width="5"/>';
    },
    chikuwa: function (x, y, s) {
      return g(x, y, s || 1, false, '<rect x="-30" y="-10" width="60" height="20" rx="10" fill="#f2c14e" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-20 -10 v20 M-6 -10 v20 M8 -10 v20" stroke="#c48a1c" stroke-width="3" opacity=".7"/>' +
        '<ellipse cx="30" cy="0" rx="5" ry="10" fill="#fff6e6" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M-36 -16 l-6 -6 M-36 16 l-6 6 M36 -16 l6 -6" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>');
    },
    siren: function (x, y) {
      return '<path d="M' + (x - 14) + ' ' + y + ' q14 -26 28 0z" fill="#e2564f" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="' + (x - 18) + '" y="' + y + '" width="36" height="7" fill="#555" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M' + (x - 26) + ' ' + (y - 16) + ' l-12 -8 M' + (x + 26) + ' ' + (y - 16) + ' l12 -8 M' + x + ' ' + (y - 30) + ' v-12" stroke="#e2564f" stroke-width="4" stroke-linecap="round"/>';
    },
    tree: function (x, y, s, c) {
      return g(x, y, s || 1, false, '<rect x="-6" y="0" width="12" height="40" fill="#7a5a3a" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M0 -60 L-34 4 L34 4z" fill="' + (c || '#3f7d4e') + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M0 -84 L-26 -30 L26 -30z" fill="' + (c || '#4b9460') + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>');
    },
    deer: function (x, y, s, flip) {
      return g(x, y, s || 1, flip, '<ellipse cx="0" cy="0" rx="36" ry="18" fill="#c9874c" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-26 12 v30 M-14 14 v28 M14 14 v28 M26 12 v30" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M28 -8 l12 -26" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M28 -8 l12 -26" stroke="#c9874c" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="46" cy="-38" rx="14" ry="10" fill="#c9874c" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<circle cx="50" cy="-40" r="2.5" fill="' + INK + '"/><circle cx="59" cy="-36" r="2.5" fill="' + INK + '"/>' +
        '<path d="M40 -46 q-6 -18 -16 -22 M40 -46 q2 -20 -4 -30 M48 -47 q4 -20 16 -24 M48 -47 q10 -10 8 -28" fill="none" stroke="#7a5a3a" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="-10" cy="-4" r="3" fill="#fff" opacity=".8"/><circle cx="4" cy="-8" r="3" fill="#fff" opacity=".8"/><circle cx="-20" cy="-8" r="2.5" fill="#fff" opacity=".8"/>');
    },
    hare: function (x, y, s, flip) {
      return g(x, y, s || 1, flip, '<ellipse cx="0" cy="0" rx="14" ry="10" fill="#e8dcc8" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="12" cy="-8" r="8" fill="#e8dcc8" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<ellipse cx="10" cy="-24" rx="3.5" ry="11" fill="#e8dcc8" stroke="' + INK + '" stroke-width="2"/><ellipse cx="16" cy="-23" rx="3.5" ry="11" fill="#e8dcc8" stroke="' + INK + '" stroke-width="2" transform="rotate(15 16 -23)"/>' +
        '<circle cx="15" cy="-9" r="1.8" fill="' + INK + '"/><circle cx="-14" cy="-2" r="4" fill="#fff" stroke="' + INK + '" stroke-width="1.5"/>');
    },
    cliff: function (side) {
      if (side === 'left') return '<path d="M0 150 L120 150 L135 240 L0 240z" fill="#8f7a5a" stroke="' + INK + '" stroke-width="2.5"/><path d="M0 150 L120 150 L118 160 L0 160z" fill="#7cb36a"/>';
      return '<path d="M400 150 L280 150 L265 240 L400 240z" fill="#8f7a5a" stroke="' + INK + '" stroke-width="2.5"/><path d="M400 150 L280 150 L282 160 L400 160z" fill="#7cb36a"/>';
    },
    plank: function () {
      return '<rect x="110" y="146" width="180" height="10" fill="#b5895a" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M130 146 v10 M160 146 v10 M190 146 v10 M220 146 v10 M250 146 v10" stroke="#8a6446" stroke-width="1.5"/>';
    },
    river: function (y) {
      return '<rect x="0" y="' + y + '" width="400" height="' + (240 - y) + '" fill="#6fb7e0"/>' +
        '<path d="M120 ' + (y + 15) + ' q15 -6 30 0 t30 0 M200 ' + (y + 35) + ' q15 -6 30 0 t30 0 M150 ' + (y + 55) + ' q15 -6 30 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/>';
    },
    splash: function (x, y) {
      return '<path d="M' + x + ' ' + y + ' l-20 -30 M' + x + ' ' + y + ' l-6 -38 M' + x + ' ' + y + ' l8 -36 M' + x + ' ' + y + ' l22 -26" stroke="#bfe6ff" stroke-width="5" stroke-linecap="round"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="34" ry="8" fill="#bfe6ff"/>';
    },
    phone: function (x, y, s, dead) {
      return g(x, y, s || 1, false, '<rect x="-16" y="-28" width="32" height="56" rx="6" fill="#333" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="-12" y="-22" width="24" height="42" rx="2" fill="' + (dead ? '#111' : '#9fd3ff') + '"/>' +
        (dead ? '<rect x="-8" y="-6" width="14" height="9" fill="none" stroke="#e2564f" stroke-width="2"/><rect x="6" y="-3" width="2" height="3" fill="#e2564f"/><rect x="-6" y="-4" width="2" height="5" fill="#e2564f"/>' : ''));
    },
    stage: function (x, y, s) {
      return g(x, y, s || 1, false, '<path d="M-60 0 L-40 -70 L40 -70 L60 0z" fill="#6c3fb1" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="-64" y="0" width="128" height="16" fill="#3b2a5c" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-30 -70 l-20 70 M30 -70 l20 70" stroke="#f2c14e" stroke-width="3" opacity=".7"/>' +
        '<path d="M-10 -40 v16 q-6 -2 -6 4 q0 6 6 4 q6 -2 0 -8 v-12 l12 -3 v12" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="0" y="-52" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">FES</text>');
    },
    museum: function (x, y, s) {
      return g(x, y, s || 1, false, '<path d="M-60 -48 L0 -78 L60 -48z" fill="#e8e1d1" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="-56" y="-48" width="112" height="8" fill="#d6ccb6" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M-44 -40 v38 M-22 -40 v38 M0 -40 v38 M22 -40 v38 M44 -40 v38" stroke="#cfc5ad" stroke-width="9"/>' +
        '<path d="M-44 -40 v38 M-22 -40 v38 M0 -40 v38 M22 -40 v38 M44 -40 v38" stroke="' + INK + '" stroke-width="1.2" opacity=".4"/>' +
        '<rect x="-62" y="-2" width="124" height="10" fill="#d6ccb6" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<text x="0" y="-55" text-anchor="middle" font-size="10" fill="' + INK + '" font-weight="700">ART</text>');
    },
    roach: function (x, y, s, flip) {
      return g(x, y, s || 1, flip, '<ellipse cx="0" cy="0" rx="22" ry="12" fill="#6b3b1f" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M0 -12 v24" stroke="#4a2814" stroke-width="2"/>' +
        '<ellipse cx="22" cy="0" rx="7" ry="8" fill="#4a2814" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M27 -4 q20 -16 32 -10 M27 4 q20 -6 34 -16" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M-8 10 l-8 12 M4 11 l0 14 M14 9 l8 12 M-8 -10 l-8 -12 M4 -11 l0 -14 M14 -9 l8 -12" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<ellipse cx="-4" cy="-4" rx="8" ry="3" fill="#fff" opacity=".35"/>');
    },
    fridge: function (x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="54" height="100" rx="6" fill="#e9eef2" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M' + x + ' ' + (y + 38) + ' h54" stroke="' + INK + '" stroke-width="2"/><rect x="' + (x + 42) + '" y="' + (y + 12) + '" width="4" height="16" rx="2" fill="#999"/>';
    },
    chest: function (x, y, s, open) {
      var lid = open
        ? '<path d="M-40 -18 L-46 -54 L46 -54 L40 -18z" fill="#a0612e" stroke="' + INK + '" stroke-width="2.5"/>'
        : '<path d="M-40 -18 q40 -26 80 0z" fill="#a0612e" stroke="' + INK + '" stroke-width="2.5"/>';
      var coins = open ? '<ellipse cx="0" cy="-18" rx="36" ry="10" fill="#f2c14e" stroke="' + INK + '" stroke-width="2"/><circle cx="-14" cy="-26" r="7" fill="#f7d36b" stroke="' + INK + '" stroke-width="2"/><circle cx="6" cy="-30" r="7" fill="#f7d36b" stroke="' + INK + '" stroke-width="2"/><circle cx="20" cy="-24" r="7" fill="#f7d36b" stroke="' + INK + '" stroke-width="2"/><path d="M-30 -60 l-6 -10 M0 -66 v-12 M30 -60 l6 -10" stroke="#f2c14e" stroke-width="4" stroke-linecap="round"/>' : '';
      return g(x, y, s || 1, false, lid + coins + '<rect x="-40" y="-18" width="80" height="44" fill="#b8733a" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-40 -2 h80" stroke="#6e4220" stroke-width="4"/><rect x="-6" y="-8" width="12" height="14" fill="#f2c14e" stroke="' + INK + '" stroke-width="2"/>');
    },
    coins: function (x, y, n) {
      var s = '';
      for (var i = 0; i < n; i++) s += '<ellipse cx="' + x + '" cy="' + (y - i * 5) + '" rx="13" ry="5" fill="#f2c14e" stroke="' + INK + '" stroke-width="1.8"/>';
      return s;
    },
    ship: function (x, y, s) {
      return g(x, y, s || 1, false, '<path d="M-70 0 L70 0 L52 30 L-52 30z" fill="#7a4a2a" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M0 0 v-80" stroke="' + INK + '" stroke-width="4"/><path d="M2 -78 q40 30 0 70z" fill="#fff6e6" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M0 -80 h-24 v14 h24" fill="#2b2622"/><circle cx="-12" cy="-73" r="3" fill="#fff"/>');
    },
    waves: function (y) {
      var s = '<rect x="0" y="' + y + '" width="400" height="' + (240 - y) + '" fill="#3f8fc4"/>';
      for (var i = 0; i < 9; i++) s += '<path d="M' + (i * 50 - 10) + ' ' + (y + 4) + ' q12 -10 25 0 t25 0" fill="none" stroke="#bfe6ff" stroke-width="3"/>';
      return s;
    },
    shop: function (x, y, name, color, o) {
      o = o || {};
      return g(x, y, o.s || 1, false,
        '<rect x="-70" y="-90" width="140" height="100" fill="#f3e3c3" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="-74" y="-110" width="148" height="26" fill="' + color + '" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<text x="0" y="-91" text-anchor="middle" font-size="15" fill="#fff" font-weight="900">' + esc(name) + '</text>' +
        '<path d="M-74 -84 h148 l-8 14 h-132z" fill="#fff" stroke="' + INK + '" stroke-width="2" opacity=".9"/>' +
        '<path d="M-60 -84 l-6 14 M-40 -84 l-4 14 M-20 -84 l-2 14 M0 -84 v14 M20 -84 l2 14 M40 -84 l4 14 M60 -84 l6 14" stroke="' + color + '" stroke-width="7" opacity=".55"/>' +
        '<rect x="-20" y="-58" width="40" height="68" fill="#a9d6f5" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M-14 -58 v40 M-4 -58 v44 M6 -58 v38 M14 -58 v42" stroke="#fff" stroke-width="5"/>' +
        '<rect x="-62" y="-60" width="34" height="28" fill="#fff" stroke="' + INK + '" stroke-width="2"/>' +
        '<text x="-45" y="-41" text-anchor="middle" font-size="11" fill="#e2564f" font-weight="900">' + esc(o.price || '800円') + '</text>' +
        (o.sale ? '<g transform="rotate(-12 45 -40)"><rect x="24" y="-56" width="46" height="26" fill="#e2564f" stroke="' + INK + '" stroke-width="2"/><text x="47" y="-38" text-anchor="middle" font-size="12" fill="#fff" font-weight="900">値下げ</text></g>' : '') +
        '<ellipse cx="45" cy="-20" rx="16" ry="8" fill="#fff" stroke="' + INK + '" stroke-width="2"/><path d="M30 -20 q15 14 30 0" fill="#f4a261" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M40 -30 q-4 -8 2 -14 M48 -30 q-4 -8 2 -14" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round"/>');
    },
    crane: function (x, y) {
      return '<path d="M' + x + ' ' + y + ' v-120 h90" fill="none" stroke="#f2c14e" stroke-width="8"/>' +
        '<path d="M' + x + ' ' + y + ' v-120 h90" fill="none" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<path d="M' + (x + 80) + ' ' + (y - 120) + ' v40" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="' + (x + 80) + '" cy="' + (y - 70) + '" r="12" fill="#555" stroke="' + INK + '" stroke-width="2"/>';
    },
    calendar: function (x, y, label, sub) {
      return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-34" y="-30" width="68" height="64" rx="6" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="-34" y="-30" width="68" height="18" rx="6" fill="#e2564f" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<text x="0" y="-16" text-anchor="middle" font-size="11" fill="#fff" font-weight="900">' + esc(sub || 'WEEK') + '</text>' +
        '<text x="0" y="22" text-anchor="middle" font-size="28" fill="' + INK + '" font-family="\'Mochiy Pop One\', sans-serif">' + esc(label) + '</text></g>';
    },
    house: function () {
      return '<rect width="400" height="240" fill="#2c3466"/><rect x="0" y="170" width="400" height="70" fill="#c7a17a"/>' +
        '<path d="M0 170 h400" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="300" y="30" width="70" height="56" fill="#1b2147" stroke="' + INK + '" stroke-width="3"/><path d="M335 30 v56 M300 58 h70" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="320" cy="48" r="7" fill="#fff3b0"/>';
    },
    question: function (x, y, s) {
      return g(x, y, s || 1, false, '<circle r="20" fill="#f2c14e" stroke="' + INK + '" stroke-width="2.5"/><text y="9" text-anchor="middle" font-size="26" font-weight="900" fill="' + INK + '">?</text>');
    },
    sparkle: function (x, y, s, c) {
      return g(x, y, s || 1, false, '<path d="M0 -14 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="' + (c || '#f2c14e') + '" stroke="' + INK + '" stroke-width="1.5"/>');
    },
    zzz: function (x, y) { return '<text x="' + x + '" y="' + y + '" font-size="18" fill="#fff" font-weight="900">Z<tspan dx="2" dy="-8" font-size="14">z</tspan><tspan dx="2" dy="-6" font-size="11">z</tspan></text>'; },
    wall: function (x) { return '<rect x="' + (x - 6) + '" y="0" width="12" height="240" fill="#6b6259" stroke="' + INK + '" stroke-width="2.5"/>'; },
    door: function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="50" height="90" fill="#8a6446" stroke="' + INK + '" stroke-width="2.5"/><circle cx="' + (x + 40) + '" cy="' + (y + 48) + '" r="3.5" fill="#f2c14e"/>'; }
  };

  function svg(inner, o) {
    o = o || {};
    return '<svg class="art ' + (o.cls || '') + '" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.label || 'イラスト') + '" font-family="\'Zen Maru Gothic\', sans-serif">' + inner + '</svg>';
  }

  window.ART = { critter: critter, bubble: bubble, caption: caption, P: P, svg: svg, INK: INK, esc: esc };
})();
