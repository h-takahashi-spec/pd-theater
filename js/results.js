/* ============================================================
 * 結果ページ（results.html?game=xxx）
 * ============================================================ */
(function () {
  var U = GT.U, API = GT.API, CFG = GT.CFG, G = window.GT_GAMES, L = window.GT_LABELS;
  var TABS = [['all', '全体'], ['pd', '囚人のジレンマ'], ['bos', '男女の争い'], ['stag', '鹿狩り'], ['chicken', 'チキン'], ['volunteer', 'ボランティア'], ['ultimatum', '最後通牒'], ['ipd', '繰り返しPD']];
  var LKEYS = ['rational', 'emotional', 'normative', 'bias', 'unclear'];
  var S = { tab: U.qs('game') || 'all', rows: [], pw: '', teacher: false, busy: false, filt: { choice: '', label: '', q: '', role: '' }, firstOnly: false };
  try { S.pw = sessionStorage.getItem('gt_pw') || ''; } catch (e) { }

  U.$('siteTitle').textContent = CFG.SITE_TITLE || 'ジレンマ劇場';
  if (API.demo) { U.$('demoBanner').classList.remove('hidden'); U.$('resetBtn').classList.remove('hidden'); }
  if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = 'all';

  function tabs() {
    U.$('tabs').innerHTML = TABS.map(function (t) {
      return '<a class="tab' + (t[0] === S.tab ? ' on' : '') + '" href="?game=' + t[0] + '">' + t[1] + '</a>';
    }).join('');
    var col = S.tab === 'all' ? '#2b2622' : S.tab === 'ipd' ? G.ipd_known.color : G[S.tab].color;
    document.documentElement.style.setProperty('--gc', col);
  }

  /* ---------------- データ ---------------- */
  function load() {
    var p = S.teacher ? API.post({ action: 'teacherRows', password: S.pw }) : API.get({ action: 'results' });
    return p.then(function (j) { S.rows = j.rows || []; render(); }).catch(function (e) {
      U.$('view').innerHTML = '<div class="panel">読み込めませんでした：' + U.esc(e.message) + '</div>';
      if (S.teacher) { S.teacher = false; teacherUI(); }
    });
  }
  function detOf(r) { var d = r.detail; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } } return d || {}; }
  function rowsOf(game, role) {
    var r = S.rows.filter(function (x) { return game === 'ipd' ? /^ipd_/.test(x.game) : x.game === game; });
    if (role) r = r.filter(function (x) { return x.role === role; });
    if (game === 'ipd' && S.firstOnly) r = r.filter(function (x) { return !detOf(x).priorIPD; });
    return U.$('latestOnly').checked ? U.latest(r) : r;
  }

  /* ---------------- 部品 ---------------- */
  function bars(items, total, o) {
    o = o || {};
    total = total || items.reduce(function (a, b) { return a + b.n; }, 0);
    return '<div class="bars">' + items.map(function (it) {
      var w = total ? it.n / total * 100 : 0;
      return '<div class="bar"><span>' + it.label + '</span><div class="track"><div class="fill" style="width:' + w.toFixed(1) + '%;' + (it.color ? 'background:' + it.color : '') + '"></div></div>' +
        '<span class="num">' + (o.raw ? it.n : (it.n + '人 ' + (total ? Math.round(w) + '%' : ''))) + '</span></div>';
    }).join('') + '</div>';
  }
  function stat(v, k) { return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>'; }
  function labelCounts(rows) {
    var c = {}; LKEYS.forEach(function (k) { c[k] = 0; }); var none = 0;
    rows.forEach(function (r) { var l = U.labelOf(r); if (c[l] != null) c[l]++; else none++; });
    c._none = none; return c;
  }
  function labelStack(rows, title) {
    var c = labelCounts(rows), n = rows.length || 1;
    var seg = LKEYS.map(function (k) { return '<span title="' + L[k].ja + ' ' + c[k] + '" style="width:' + (c[k] / n * 100) + '%;background:' + L[k].color + '"></span>'; }).join('') +
      '<span title="未分類 ' + c._none + '" style="width:' + (c._none / n * 100) + '%;background:#e7dfd0"></span>';
    return '<div class="bar"><span>' + title + '</span><div class="track"><div class="stack">' + seg + '</div></div><span class="num">' + rows.length + '人</span></div>';
  }
  function legend() {
    return '<div class="legend">' + LKEYS.map(function (k) { return '<span title="' + U.esc(L[k].desc) + '"><i style="background:' + L[k].color + '"></i>' + L[k].ja + '</span>'; }).join('') + '<span><i style="background:#e7dfd0"></i>未分類</span></div>';
  }
  function flagSummary(rows) {
    var f = { rational: 0, emotional: 0, normative: 0, bias: 0 }, biasNames = {};
    rows.forEach(function (r) {
      (r.aiFlags || '').split(',').forEach(function (k) { if (f[k] != null) f[k]++; });
      if (r.aiBias) biasNames[r.aiBias] = (biasNames[r.aiBias] || 0) + 1;
    });
    var classified = rows.filter(function (r) { return r.aiPrimary; }).length;
    var top = Object.keys(biasNames).sort(function (a, b) { return biasNames[b] - biasNames[a]; }).slice(0, 6);
    return '<p class="small muted" style="margin:10px 0 4px">各観点が「含まれる」と判定された割合（1つの理由に複数の観点が含まれることがあります。AI分類済み ' + classified + '人中）</p>' +
      bars(['rational', 'emotional', 'normative', 'bias'].map(function (k) { return { label: L[k].ja, n: f[k], color: L[k].color }; }), classified) +
      (top.length ? '<p class="small" style="margin:10px 0 0"><b>見つかった認知バイアス：</b>' + top.map(function (b) { return '<span class="tag" style="background:' + L.bias.color + '">' + U.esc(b) + ' ' + biasNames[b] + '</span>'; }).join('') + '</p>' : '');
  }
  function lineChart(series, o) {
    o = o || {};
    var W = 560, H = 240, l = 44, r = 14, t = 14, b = 38;
    var xs = []; series.forEach(function (s) { s.points.forEach(function (p) { xs.push(p[0]); }); });
    if (!xs.length) return '<p class="muted small">まだデータがありません。</p>';
    var x0 = o.xmin != null ? o.xmin : Math.min.apply(null, xs), x1 = o.xmax != null ? o.xmax : Math.max.apply(null, xs);
    if (x1 === x0) x1 = x0 + 1;
    var X = function (v) { return l + (v - x0) / (x1 - x0) * (W - l - r); };
    var Y = function (v) { return t + (1 - v) * (H - t - b); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(o.label || 'グラフ') + '">';
    [0, .25, .5, .75, 1].forEach(function (v) {
      s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#d8cdb8" stroke-width="1"/>' +
        '<text x="' + (l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="11" fill="#5c534a">' + Math.round(v * 100) + '%</text>';
    });
    for (var v = x0; v <= x1; v++) s += '<text x="' + X(v) + '" y="' + (H - b + 16) + '" text-anchor="middle" font-size="11" fill="#5c534a">' + (o.xfmt ? o.xfmt(v) : v) + '</text>';
    if (o.xLabel) s += '<text x="' + ((l + W - r) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" fill="#5c534a">' + U.esc(o.xLabel) + '</text>';
    series.forEach(function (se) {
      var pts = se.points.slice().sort(function (a, b) { return a[0] - b[0]; });
      s += '<polyline fill="none" stroke="' + se.color + '" stroke-width="3" stroke-linejoin="round" points="' + pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '"/>';
      pts.forEach(function (p) { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4.5" fill="#fff" stroke="' + se.color + '" stroke-width="2.5"><title>' + U.esc(se.name) + '：' + Math.round(p[1] * 100) + '%（' + (p[2] || 0) + '人）</title></circle>'; });
    });
    s += '</svg>';
    return '<div class="chart">' + s + '</div><div class="legend">' + series.map(function (se) { return '<span><i style="background:' + se.color + '"></i>' + U.esc(se.name) + '</span>'; }).join('') + '</div>';
  }

  /* ---------------- 理由カード ---------------- */
  function reasonsSection(rows, choiceOpts, o) {
    o = o || {};
    var id = 'rs' + Math.random().toString(36).slice(2, 6);
    var h = '<section class="panel"><h2 class="title-l">' + (o.title || 'みんなの理由') + '</h2>' + legend() +
      '<div class="filters"><select data-f="choice"><option value="">すべての選択</option>' +
      choiceOpts.map(function (c) { return '<option value="' + U.esc(c[0]) + '"' + (S.filt.choice === c[0] ? ' selected' : '') + '>' + U.esc(c[1]) + '</option>'; }).join('') + '</select>' +
      '<select data-f="label"><option value="">すべての分類</option>' + LKEYS.map(function (k) { return '<option value="' + k + '"' + (S.filt.label === k ? ' selected' : '') + '>' + L[k].ja + '</option>'; }).join('') +
      '<option value="_none"' + (S.filt.label === '_none' ? ' selected' : '') + '>未分類</option></select>' +
      '<input type="text" data-f="q" placeholder="キーワード" value="' + U.esc(S.filt.q) + '" style="width:10em;padding:2px 8px;border-width:2px"></div>' +
      '<div class="reasons" id="' + id + '"></div></section>';
    setTimeout(function () {
      var box = U.$(id); if (!box) return;
      var sec = box.parentNode;
      var draw = function () {
        var list = rows.filter(function (r) {
          if (S.filt.choice && (o.choiceKey ? o.choiceKey(r) : r.choice) !== S.filt.choice) return false;
          var lb = U.labelOf(r);
          if (S.filt.label === '_none' && lb) return false;
          if (S.filt.label && S.filt.label !== '_none' && lb !== S.filt.label) return false;
          if (S.filt.q && (r.reason || '').indexOf(S.filt.q) < 0 && (r.nickname || '').indexOf(S.filt.q) < 0) return false;
          return true;
        }).sort(function (a, b) { return String(b.ts).localeCompare(String(a.ts)); });
        box.innerHTML = list.length ? list.map(card).join('') : '<p class="muted">該当する理由はありません。</p>';
        box.querySelectorAll('select[data-relabel]').forEach(function (sel) { sel.onchange = function () { relabel(sel.dataset.relabel, sel.value, sel); }; });
      };
      sec.querySelectorAll('[data-f]').forEach(function (el) {
        el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', function () { S.filt[el.dataset.f] = el.value; draw(); });
      });
      draw();
    }, 0);
    return h;
  }
  function card(r) {
    var lb = U.labelOf(r), d = r.aiDetail || {};
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
    var tags = '';
    if (lb) tags += '<span class="tag" style="background:' + L[lb].color + '">' + L[lb].ja + (r.teacherLabel ? '（先生）' : '') + '</span>';
    (r.aiFlags || '').split(',').filter(function (k) { return k && k !== lb && L[k]; }).forEach(function (k) { tags += '<span class="tag outline">+' + L[k].ja + '</span>'; });
    if (r.aiBias) tags += '<span class="tag outline">' + U.esc(r.aiBias) + '</span>';
    var ai = '';
    if (r.aiPrimary) {
      ai = '<div class="ai">' + tags + '<div>' + U.esc(r.aiReason || '') + '</div>';
      var extra = ['rational', 'emotional', 'normative', 'bias'].filter(function (k) { return d[k] && d[k].yes && d[k].why && k !== r.aiPrimary; });
      if (extra.length) ai += '<details><summary>ほかの観点</summary>' + extra.map(function (k) { return '<div><b>' + L[k].ja + '</b>：' + U.esc(d[k].why) + '</div>'; }).join('') + '</details>';
      if (d.comment) ai += '<div>💬 ' + U.esc(d.comment) + '</div>';
      ai += '</div>';
    } else if (r.teacherLabel) ai = '<div class="ai">' + tags + '</div>';
    else ai = '<div class="ai muted">AI分類はまだです</div>';
    var tsel = S.teacher ? '<select data-relabel="' + U.esc(r.id) + '" class="small" style="font:inherit;font-size:.8rem;border:1.5px solid var(--ink);border-radius:6px"><option value="">先生の修正なし</option>' +
      LKEYS.map(function (k) { return '<option value="' + k + '"' + (r.teacherLabel === k ? ' selected' : '') + '>' + L[k].ja + '</option>'; }).join('') + '</select>' : '';
    var who = U.esc(r.nickname || '名無し') + (S.teacher && r.studentId ? ' <span class="muted">' + U.esc(r.studentId) + '</span>' : '') + (r.sample ? ' <span class="muted">(サンプル)</span>' : '');
    var roleTxt = r.game === 'ultimatum' ? (r.role === 'proposer' ? '分ける側：' : '受け取る側：') : r.game === 'bos' ? (r.role === 'A' ? '[フェス派] ' : '[美術館派] ') : r.game === 'ipd_known' ? '[回数既知] ' : r.game === 'ipd_unknown' ? '[回数未知] ' : '';
    return '<article class="rc"><div class="hd"><span>' + who + '</span><span>' + U.fmtTime(r.ts) + '</span></div>' +
      '<div class="ch">' + roleTxt + U.esc(r.choiceLabel || r.choice) + (r.expectLabel ? '<span class="muted small">（予想：' + U.esc(r.expectLabel) + '）</span>' : '') + '</div>' +
      '<div class="tx">' + U.esc(r.reason) + '</div>' + ai + tsel + '</article>';
  }

  /* ---------------- 2×2ゲーム ---------------- */
  function view2x2(gid) {
    var g = G[gid], rows = rowsOf(gid), n = rows.length;
    var a0 = g.order[0], a1 = g.order[1];
    var h = '<section class="panel"><span class="kicker">GAME ' + g.no + '</span><h1 class="title-xl">' + g.title + '<span class="small">「' + g.story_title + '」</span></h1>';
    if (!n) return h + '<p>まだ回答がありません。</p></section>';
    var cnt = function (rs, key, v) { return rs.filter(function (r) { return r[key] === v; }).length; };
    var p0 = cnt(rows, 'choice', a0) / n;
    var cons = rows.filter(function (r) { return r.expect === r.choice; }).length / n;
    h += '<div class="stats">' + stat(n + '人', '回答者') + stat(U.pct(p0), '「' + g.actions[a0].label + '」を選んだ') + stat(U.pct(1 - p0), '「' + g.actions[a1].label + '」を選んだ') +
      stat(U.pct(cons), '相手も自分と同じ手を選ぶと予想した人') + '</div>';
    h += '<div class="grid2" style="margin-top:14px"><div><h3 class="title-l">みんなの選択</h3>' +
      bars(g.order.map(function (a) { return { label: g.actions[a].icon + ' ' + g.actions[a].label, n: cnt(rows, 'choice', a) }; }), n) +
      '<h3 class="title-l" style="margin-top:14px">相手の予想</h3>' +
      bars(g.order.map(function (a) { return { label: g.actions[a].label + 'と予想', n: cnt(rows, 'expect', a), color: '#8a8378' }; }), n) + '</div>';
    // 予想×選択
    h += '<div><h3 class="title-l">予想した相手の手 × 自分の手</h3><div class="heat" style="grid-template-columns:7em 1fr 1fr">' +
      '<div></div>' + g.order.map(function (a) { return '<div class="h">自分：' + g.actions[a].label + '</div>'; }).join('');
    g.order.forEach(function (e) {
      var re = rows.filter(function (r) { return r.expect === e; });
      h += '<div class="h" style="text-align:right;align-self:center">相手は' + g.actions[e].label + 'と予想</div>';
      g.order.forEach(function (a) {
        var k = re.filter(function (r) { return r.choice === a; }).length, f = re.length ? k / re.length : 0;
        h += '<div class="c" style="background:color-mix(in srgb, var(--gc) ' + Math.round(f * 70) + '%, #fff)"><b>' + k + '人</b>' + (re.length ? Math.round(f * 100) + '%' : '') + '</div>';
      });
    });
    h += '</div><p class="small muted">相手の出方の予想によって、自分の選択がどう変わるかを見られます。</p></div></div>';

    // ランダムに組んだら
    var pr = function (rs, a) { return rs.length ? cnt(rs, 'choice', a) / rs.length : 0; };
    var meRows = rows, opRows = rows;
    if (g.roles) { meRows = rows.filter(function (r) { return r.role === 'A'; }); opRows = rows.filter(function (r) { return r.role === 'B'; }); }
    h += '<h3 class="title-l" style="margin-top:16px">' + (g.roles ? 'フェス派×美術館派をランダムに組んだら' : 'ランダムに2人ずつ組んだら') + '</h3>';
    h += '<div class="heat" style="grid-template-columns:8em 1fr 1fr"><div></div>' + g.order.map(function (o) { return '<div class="h">' + (g.roles ? '美術館派が' : '相手が') + g.actions[o].label + '</div>'; }).join('');
    g.order.forEach(function (m) {
      h += '<div class="h" style="text-align:right;align-self:center">' + (g.roles ? 'フェス派が' : '自分が') + g.actions[m].label + '</div>';
      g.order.forEach(function (o) {
        var f = pr(meRows, m) * pr(opRows, o), pay = g.pay(m, o, 'A');
        h += '<div class="c" style="background:color-mix(in srgb, var(--gc) ' + Math.round(f * 90) + '%, #fff)"><b>' + Math.round(f * 100) + '%</b>' + U.esc(g.fmt(pay[0])) + ' / ' + U.esc(g.fmt(pay[1])) + '</div>';
      });
    });
    h += '</div>';
    if (!g.roles) {
      var ev = g.order.map(function (m) {
        var e = 0; g.order.forEach(function (o) { e += pr(rows, o) * g.pay(m, o)[0]; });
        return { a: m, e: e };
      });
      h += '<p class="small">このクラスの相手とランダムに組んだときの平均の結果：' + ev.map(function (x) { return '「' + g.actions[x.a].label + '」なら <b>' + (g.better === 'low' ? '懲役' + x.e.toFixed(1) + '年' : x.e.toFixed(2) + '点') + '</b>'; }).join('、') + '</p>';
      if (gid === 'stag') {
        var sv = g.pay('S', 'S')[0], qStar = 3 / sv;
        var expS = rows.filter(function (r) { return r.expect === 'S'; }).length / n;
        h += '<h3 class="title-l" style="margin-top:16px">鹿を待つのが得になるのは？</h3><div class="stats">' +
          stat(U.pct(qStar), '相手が鹿を待つ確率がこれ以上なら、鹿を待つほうが期待値が高い（鹿 ' + sv + '点・ウサギ 3点）') +
          stat(U.pct(expS), 'ゴンは鹿を待つ、と予想した人') + stat(U.pct(pr(rows, 'S')), '実際に鹿を待った人') + '</div>' +
          '<p class="small muted">' + (sv < 6 ? 'この設定ではウサギがリスクの面でかなり有利です（逸脱したときの損失の積が ' + Math.pow(3, 2) + ' 対 ' + Math.pow(sv - 3, 2) + '）。'
            : sv === 6 ? 'この設定では、利得の大きい鹿と、リスクの小さいウサギがちょうど拮抗します。「相手をどのくらい信じられるか」だけで決まる設定です。'
            : 'この設定では、鹿が利得でもリスクの面でも有利です。') + '</p>';
      }
    } else {
      var favRate = rows.filter(function (r) { return r.choice === (r.role === 'A' ? 'F' : 'M'); }).length / n;
      h += '<p class="small">自分の好きな場所を選んだ人：<b>' + U.pct(favRate) + '</b>（フェス派 ' + meRows.length + '人・美術館派 ' + opRows.length + '人）</p>';
    }
    h += '</section>';
    h += aiSection(rows, g.order.map(function (a) { return { label: g.actions[a].label, rows: rows.filter(function (r) { return r.choice === a; }) }; }));
    h += reasonsSection(rows, g.order.map(function (a) { return [a, g.actions[a].label]; }));
    return h;
  }
  function aiSection(rows, groups) {
    return '<section class="panel"><h2 class="title-l">AIによる理由の分類</h2>' + legend() +
      '<div class="bars" style="margin-top:8px">' + labelStack(rows, '全体') + groups.map(function (gr) { return labelStack(gr.rows, U.esc(gr.label)); }).join('') + '</div>' +
      flagSummary(rows) + '</section>';
  }

  /* ---------------- ボランティア ---------------- */
  function viewVolunteer() {
    var g = G.volunteer, rows = rowsOf('volunteer'), n = rows.length;
    var h = '<section class="panel"><span class="kicker">GAME ' + g.no + '</span><h1 class="title-xl">' + g.title + '<span class="small">「' + g.story_title + '」</span></h1>';
    if (!n) return h + '<p>まだ回答がありません。</p></section>';
    var p = rows.filter(function (r) { return r.choice === 'V'; }).length / n;
    var expMean = rows.reduce(function (a, r) { return a + (+r.expect || 0); }, 0) / n;
    var atLeast = 1 - Math.pow(1 - p, 5);
    h += '<div class="stats">' + stat(n + '人', '回答者') + stat(U.pct(p), '名乗り出た人') + stat(expMean.toFixed(1) + '人', 'ほかの4人のうち名乗り出ると予想した人数（平均）') +
      stat((4 * p).toFixed(1) + '人', '実際の割合から見た「ほかの4人」の期待人数') + stat(U.pct(atLeast), 'ランダムな5人組で誰か1人でも名乗り出る確率') + '</div>';
    h += '<div class="grid2" style="margin-top:14px"><div><h3 class="title-l">みんなの選択</h3>' +
      bars(g.order.map(function (a) { return { label: g.actions[a].icon + ' ' + g.actions[a].label, n: rows.filter(function (r) { return r.choice === a; }).length }; }), n) + '</div>' +
      '<div><h3 class="title-l">ほかの4人のうち何人が名乗り出ると思った？</h3>' +
      bars([0, 1, 2, 3, 4].map(function (k) { return { label: k + '人', n: rows.filter(function (r) { return +r.expect === k; }).length, color: '#8a8378' }; }), n) + '</div></div>';
    h += '<h3 class="title-l" style="margin-top:14px">予想人数ごとの「名乗り出た」割合</h3>' +
      bars([0, 1, 2, 3, 4].map(function (k) {
        var rs = rows.filter(function (r) { return +r.expect === k; });
        return { label: k + '人と予想（' + rs.length + '）', n: rs.filter(function (r) { return r.choice === 'V'; }).length, total: rs.length };
      }).map(function (x) { return { label: x.label, n: x.total ? Math.round(x.n / x.total * 100) : 0 }; }), 100, { raw: true }).replace(/<span class="num">(\d+)<\/span>/g, '<span class="num">$1%</span>');
    h += '<p class="small muted">「誰かがやってくれる」と思うほど、自分は待ちやすくなるかを見られます。</p>';
    // 対称な混合戦略均衡：待つ人の利得 = 名乗り出る人の利得 → (1-p)^(N-1) = 1 - 7/10
    var eq = function (N) { var q = 1 - Math.pow(0.3, 1 / (N - 1)); return { p: q, none: Math.pow(1 - q, N) }; };
    var e5 = eq(5), noneClass = Math.pow(1 - p, 5);
    h += '<h3 class="title-l" style="margin-top:16px">ゲーム理論の予測（混合戦略均衡）と比べると</h3><div class="stats">' +
      stat(U.pct(e5.p), '均衡での、各人が名乗り出る確率') + stat(U.pct(p), 'このクラスで名乗り出た割合') +
      stat(U.pct(e5.none), '均衡での、誰も名乗り出ない確率') + stat(U.pct(noneClass), 'このクラスからランダムに5人組を作ったとき、誰も名乗り出ない確率') + '</div>' +
      '<p class="small" style="margin-top:8px">均衡では、全員が「自分が出ても出なくても同じくらい得」になるように、ある確率で名乗り出ます。「誰かがやるだろう」と待つ人がいるのは、思い込みだけでなく<b>合理的にも起きる責任の分散</b>です。そして人数が増えるほど、1人ひとりは出にくくなり、誰も出ない確率はむしろ上がります（Diekmann, 1985）。</p>' +
      '<div class="heat" style="grid-template-columns:repeat(8,1fr);margin-top:6px"><div class="h">人数</div>' + [2, 3, 4, 5, 6, 8, 10].map(function (N) { return '<div class="h">' + N + '人</div>'; }).join('') +
      '<div class="h" style="align-self:center">各人が出る</div>' + [2, 3, 4, 5, 6, 8, 10].map(function (N) { return '<div class="c"' + (N === 5 ? ' style="background:color-mix(in srgb, var(--gc) 25%, #fff)"' : '') + '><b>' + Math.round(eq(N).p * 100) + '%</b></div>'; }).join('') +
      '<div class="h" style="align-self:center">誰も出ない</div>' + [2, 3, 4, 5, 6, 8, 10].map(function (N) { return '<div class="c"' + (N === 5 ? ' style="background:color-mix(in srgb, var(--gc) 25%, #fff)"' : '') + '><b>' + Math.round(eq(N).none * 100) + '%</b></div>'; }).join('') +
      '</div><p class="small muted">利得はこのゲームと同じ（名乗り出た人 7、待った人 10、誰も出なければ 0）。今回は5人です。</p></section>';
    h += aiSection(rows, g.order.map(function (a) { return { label: g.actions[a].label, rows: rows.filter(function (r) { return r.choice === a; }) }; }));
    h += reasonsSection(rows, g.order.map(function (a) { return [a, g.actions[a].label]; }));
    return h;
  }

  /* ---------------- 最後通牒 ---------------- */
  function viewUltimatum() {
    var g = G.ultimatum, P = rowsOf('ultimatum', 'proposer'), R = rowsOf('ultimatum', 'responder');
    var h = '<section class="panel"><span class="kicker">GAME ' + g.no + '</span><h1 class="title-xl">' + g.title + '<span class="small">「' + g.story_title + '」</span></h1>';
    if (!P.length && !R.length) return h + '<p>まだ回答がありません。</p></section>';
    var offers = P.map(function (r) { return +r.choice; }), maos = R.map(function (r) { return +r.choice; });
    var mean = function (a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : NaN; };
    var acc = function (x) { return maos.length ? maos.filter(function (m) { return m <= x; }).length / maos.length : NaN; };
    var best = null;
    for (var x = 0; x <= g.total; x += g.step) { var e = (g.total - x) * acc(x); if (!best || e > best.e) best = { x: x, e: e }; }
    var pairAcc = 0, pairs = 0;
    offers.forEach(function (o) { maos.forEach(function (m) { pairs++; if (o >= m) pairAcc++; }); });
    h += '<div class="stats">' + stat(P.length + '人', '回答者') + stat(Math.round(mean(offers)) + 'G', '分ける側が渡した平均') +
      stat(Math.round(mean(maos)) + 'G', '受け取る側の「乗る」ラインの平均') + stat(U.pct(pairs ? pairAcc / pairs : NaN), 'ランダムに組んだとき成立する割合') +
      stat(best ? best.x + 'G' : '—', 'このクラス相手に分ける側の取り分の期待値が最大になる提案額') + '</div>';
    var bins = []; for (var b = 0; b <= g.total; b += 100) bins.push(b);
    var binLabel = function (b) { return b === g.total ? b + 'G' : b + '〜' + (b + 50) + 'G'; };
    h += '<div class="grid2" style="margin-top:14px"><div><h3 class="title-l">相手に渡した額</h3>' +
      bars(bins.map(function (b) { return { label: binLabel(b), n: offers.filter(function (o) { return o >= b && o < b + 100 || (b === g.total && o === b); }).length }; }), offers.length) + '</div>' +
      '<div><h3 class="title-l">「乗る」ライン</h3>' +
      bars(bins.map(function (b) { return { label: binLabel(b), n: maos.filter(function (o) { return o >= b && o < b + 100 || (b === g.total && o === b); }).length, color: '#8a8378' }; }), maos.length) + '</div></div>';
    var pts = []; for (var y = 0; y <= g.total; y += 100) pts.push([y / 100, acc(y), maos.length]);
    h += '<h3 class="title-l" style="margin-top:14px">提案額ごとの「乗ってもらえる」割合</h3>' +
      lineChart([{ name: '受け入れ率', color: g.color, points: pts }], { xfmt: function (v) { return v * 100; }, xLabel: '相手に渡す額（G）', label: '提案額ごとの受け入れ率' }) +
      '<p class="small muted">合理的に考えると、受け取る側は1Gでも「乗る」はず。でも実際には、少なすぎる提案は断られがちです。</p></section>';
    var all = P.concat(R);
    h += aiSection(all, [{ label: '分ける側', rows: P }, { label: '受け取る側', rows: R }]);
    h += reasonsSection(all, [['proposer', '分ける側の理由'], ['responder', '受け取る側の理由']], { choiceKey: function (r) { return r.role; } });
    return h;
  }

  /* ---------------- 繰り返しPD ---------------- */
  function viewIPD() {
    var K = rowsOf('ipd').filter(function (r) { return r.game === 'ipd_known'; }), N = rowsOf('ipd').filter(function (r) { return r.game === 'ipd_unknown'; });
    var gk = G.ipd_known, gu = G.ipd_unknown;
    var h = '<section class="panel"><span class="kicker">GAME 7・8</span><h1 class="title-xl">繰り返し囚人のジレンマ<span class="small">「ラーメン激戦区」</span></h1>';
    var allI = S.rows.filter(function (r) { return /^ipd_/.test(r.game); });
    var ordUK = allI.filter(function (r) { return r.game === 'ipd_known' && detOf(r).priorOther; }).length;
    var ordKU = allI.filter(function (r) { return r.game === 'ipd_unknown' && detOf(r).priorOther; }).length;
    h += '<div class="filters"><label class="small"><input type="checkbox" id="firstOnly"' + (S.firstOnly ? ' checked' : '') + '> 初回プレイのみで比べる（もう一方の条件を先にやった回答を除く）</label>' +
      '<span class="small muted">2本目として遊んだ人：「知らない→知っている」' + ordUK + '件、「知っている→知らない」' + ordKU + '件</span></div>';
    setTimeout(function () { var c = U.$('firstOnly'); if (c) c.onchange = function () { S.firstOnly = c.checked; render(); }; }, 0);
    if (!K.length && !N.length) return h + '<p>まだ回答がありません。</p></section>';
    var det = detOf;
    var coopRate = function (rs) { return rs.length ? rs.reduce(function (a, r) { return a + (+r.choice || 0); }, 0) / rs.length : NaN; };
    var lastCoop = function (rs) { var v = rs.map(function (r) { var d = det(r).rounds || []; return d.length ? (d[d.length - 1].me === 'K' ? 1 : 0) : null; }).filter(function (x) { return x != null; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : NaN; };
    var avgTotal = function (rs) { return rs.length ? rs.reduce(function (a, r) { return a + (det(r).total || 0); }, 0) / rs.length : NaN; };
    h += '<div class="grid2"><div class="stats">' + stat(N.length + '人', '回数を<b>知らない</b>条件') + stat(U.pct(coopRate(N)), '協力（据え置き）率') + stat(U.pct(lastCoop(N)), '最終週の協力率') + stat(isNaN(avgTotal(N)) ? '—' : Math.round(avgTotal(N)) + '万円', '平均の総利益') + '</div>' +
      '<div class="stats">' + stat(K.length + '人', '回数を<b>知っている</b>条件') + stat(U.pct(coopRate(K)), '協力（据え置き）率') + stat(U.pct(lastCoop(K)), '最終週の協力率') + stat(isNaN(avgTotal(K)) ? '—' : Math.round(avgTotal(K)) + '万円', '平均の総利益') + '</div></div>';
    // しっぺ返し相手の基準値（回数既知）
    var nK = +GT.CFG.IPD_KNOWN_ROUNDS || 10;
    var Kt = K.filter(function (r) { return (det(r).bot || 'tft') === 'tft'; });
    var pat = function (r) { return (det(r).rounds || []).map(function (x) { return x.me; }).join(''); };
    var optN = Kt.filter(function (r) { var q = pat(r); return q.length === nK && /^K+S$/.test(q); }).length;
    var firstD = Kt.filter(function (r) { return pat(r).charAt(0) === 'S'; }).length;
    var allK = Kt.filter(function (r) { return /^K+$/.test(pat(r)); }).length;
    h += '<h3 class="title-l" style="margin-top:16px">回数を知っている条件：しっぺ返しのゲンさんに対する「正解」は？</h3><div class="stats">' +
      stat(((nK - 1) * 30 + 50) + '万円', (nK - 1) + '週目まで据え置き、最終週だけ値下げ（この相手への最適）') +
      stat((nK * 30) + '万円', '全週据え置き') + stat((50 + (nK - 1) * 10) + '万円', '後ろ向き帰納法どおり、初週から値下げし続ける') + '</div>' +
      '<div class="stats" style="margin-top:8px">' + stat(optN + '人', '最適どおり（最終週だけ値下げ）に打った人') + stat(allK + '人', '全週据え置きの人') + stat(firstD + '人', '初週から値下げした人') + '</div>' +
      '<p class="small muted">後ろ向き帰納法で「最初から裏切る」が合理的になるのは、<b>相手も合理的に</b>そう考える場合です。ゲンさんは前の週をまねるだけなので、最終週だけ裏切るのがいちばん得になります。（相手がしっぺ返しだった回答 ' + Kt.length + '件で集計）</p>';
    var byRound = function (rs, fromEnd) {
      var m = {};
      rs.forEach(function (r) {
        var d = det(r).rounds || [], L2 = d.length;
        d.forEach(function (x, i) {
          var k = fromEnd ? -(L2 - i - 1) : x.r;
          if (fromEnd && L2 - i > 6) return;
          m[k] = m[k] || [0, 0]; m[k][1]++; if (x.me === 'K') m[k][0]++;
        });
      });
      return Object.keys(m).map(function (k) { return [+k, m[k][0] / m[k][1], m[k][1]]; });
    };
    h += '<h3 class="title-l" style="margin-top:16px">終わりから数えた週ごとの協力率</h3>' +
      lineChart([{ name: '回数を知らない', color: gu.color, points: byRound(N, true) }, { name: '回数を知っている', color: gk.color, points: byRound(K, true) }],
        { xmin: -5, xmax: 0, xfmt: function (v) { return v === 0 ? '最終週' : (-v) + '週前'; }, xLabel: '最終週に向かって', label: '終わりから数えた協力率' }) +
      '<p class="small muted">「最後がわかっている」と、最後の週（と、その前）に裏切りが増える――終盤効果（後ろ向き帰納法）が出ているかを見られます。</p>';
    h += '<h3 class="title-l" style="margin-top:16px">週ごとの協力率</h3>' +
      lineChart([{ name: '回数を知らない', color: gu.color, points: byRound(N) }, { name: '回数を知っている', color: gk.color, points: byRound(K) }], { xmin: 1, xLabel: '週', label: '週ごとの協力率' }) + '</section>';
    var all = K.concat(N);
    h += aiSection(all, [{ label: '回数を知っている', rows: K }, { label: '回数を知らない', rows: N }]);
    h += reasonsSection(all, [['ipd_known', '回数を知っている'], ['ipd_unknown', '回数を知らない']], { choiceKey: function (r) { return r.game; } });
    return h;
  }

  /* ---------------- 全体 ---------------- */
  function viewAll() {
    var h = '<section class="panel"><h1 class="title-xl">みんなの結果</h1><p class="muted" style="margin:0">ゲームを選ぶと、選択の分布・予想・ランダムに組んだときの結果・AIによる理由の分類が見られます。</p></section>';
    h += '<div class="overview">';
    window.GT_ORDER.forEach(function (gid) {
      if (gid === 'ipd_unknown') return;
      var g = G[gid], key = gid === 'ipd_known' ? 'ipd' : gid;
      var rows = rowsOf(key), head = '', n = U.latest(rows).length;
      if (g.kind === '2x2' || g.kind === 'volunteer') {
        var a0 = g.order[0];
        head = U.pct(rows.filter(function (r) { return r.choice === a0; }).length / (rows.length || 1)) + '<span class="small"> が「' + g.actions[a0].label + '」</span>';
      } else if (g.kind === 'ultimatum') {
        var P = rows.filter(function (r) { return r.role === 'proposer'; });
        head = (P.length ? Math.round(P.reduce(function (a, r) { return a + (+r.choice); }, 0) / P.length) : '—') + 'G<span class="small"> 平均の提案額</span>';
        n = P.length;
      } else {
        head = U.pct(rows.reduce(function (a, r) { return a + (+r.choice || 0); }, 0) / (rows.length || 1)) + '<span class="small"> 平均の協力率</span>';
      }
      h += '<a class="ov" href="?game=' + key + '" style="--gc:' + g.color + '"><span class="kicker">GAME ' + (key === 'ipd' ? '7・8' : g.no) + '</span><h3>' + (key === 'ipd' ? '繰り返し囚人のジレンマ' : g.title) + '</h3>' +
        '<div class="big">' + (rows.length ? head : '—') + '</div><div class="small muted">' + n + '人が回答</div>' +
        '<div class="bars" style="margin-top:6px">' + labelStack(rows, '理由の分類') + '</div></a>';
    });
    h += '</div>';
    var all = S.rows.length ? (U.$('latestOnly').checked ? U.latest(S.rows) : S.rows) : [];
    h += '<section class="panel"><h2 class="title-l">ゲーム別：理由の分類の比べっこ</h2>' + legend() + '<div class="bars" style="margin-top:8px">' +
      window.GT_ORDER.map(function (gid) { return labelStack(all.filter(function (r) { return r.game === gid; }), U.esc(G[gid].title.replace('繰り返し囚人のジレンマ', '繰り返しPD') + (G[gid].subtitle ? '（' + G[gid].subtitle.replace('回数を', '') + '）' : ''))); }).join('') +
      '</div>' + flagSummary(all) + '</section>';
    return h;
  }

  /* ---------------- 描画 ---------------- */
  function render() {
    if (S.busy) return;
    var y = window.scrollY;
    var h;
    if (S.tab === 'all') h = viewAll();
    else if (S.tab === 'volunteer') h = viewVolunteer();
    else if (S.tab === 'ultimatum') h = viewUltimatum();
    else if (S.tab === 'ipd') h = viewIPD();
    else h = view2x2(S.tab);
    U.$('view').innerHTML = h;
    window.scrollTo(0, y);
    var un = S.rows.filter(function (r) { return !r.aiPrimary && r.reason; }).length;
    U.$('classifyBtn').textContent = 'AIで理由を分類（未分類 ' + un + '件）';
  }

  /* ---------------- 先生モード ---------------- */
  function teacherUI() {
    U.$('tLogin').classList.toggle('hidden', S.teacher);
    U.$('tTools').classList.toggle('hidden', !S.teacher);
  }
  function msg(t, err) { var m = U.$('tMsg'); m.textContent = t; m.style.color = err ? 'var(--bad)' : ''; }
  U.$('pwBtn').onclick = function () {
    S.pw = U.$('pw').value;
    API.post({ action: 'teacherRows', password: S.pw }).then(function (j) {
      S.teacher = true; try { sessionStorage.setItem('gt_pw', S.pw); } catch (e) { }
      S.rows = j.rows || []; teacherUI(); msg('先生モード：学籍番号の表示、分類の修正、AI分類、CSV出力ができます。'); render();
    }).catch(function (e) { msg(e.message, true); });
  };
  U.$('pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') U.$('pwBtn').click(); });
  U.$('logoutBtn').onclick = function () { S.teacher = false; S.pw = ''; try { sessionStorage.removeItem('gt_pw'); } catch (e) { } teacherUI(); msg(''); load(); };
  U.$('classifyBtn').onclick = function () {
    var btn = this; btn.disabled = true; S.busy = true;
    var total = 0, guard = 0;
    var game = S.tab === 'all' ? '' : S.tab;
    (function step() {
      msg('AIが理由を読んでいます…（ここまで ' + total + '件）');
      API.post({ action: 'classify', password: S.pw, limit: 10, game: game === 'ipd' ? '' : game }).then(function (r) {
        total += r.done;
        if (r.errors && r.errors.length && !r.done) throw new Error(r.errors[0]);
        if (r.remaining > 0 && r.done > 0 && ++guard < 60) return step();
        msg(total + '件を分類しました。' + (r.errors && r.errors.length ? '（一部エラー：' + r.errors[0] + '）' : ''));
        S.busy = false; btn.disabled = false; load();
      }).catch(function (e) { msg('途中で止まりました（' + total + '件は分類済み）：' + e.message, true); S.busy = false; btn.disabled = false; load(); });
    })();
  };
  function relabel(id, label, sel) {
    sel.disabled = true;
    API.post({ action: 'relabel', password: S.pw, id: id, label: label }).then(function () {
      S.rows.forEach(function (r) { if (r.id === id) r.teacherLabel = label; });
      msg('分類を修正しました。'); render();
    }).catch(function (e) { sel.disabled = false; msg('保存できませんでした：' + e.message, true); });
  }
  U.$('csvBtn').onclick = function () {
    var cols = ['id', 'ts', 'game', 'role', 'studentId', 'nickname', 'choice', 'choiceLabel', 'expect', 'expectLabel', 'reason', 'aiPrimary', 'aiFlags', 'aiBias', 'aiReason', 'teacherLabel', 'detail'];
    var q = function (v) { v = v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); return '"' + v.replace(/"/g, '""') + '"'; };
    var csv = '﻿' + cols.join(',') + '\n' + S.rows.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'dilemma_results_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  };
  U.$('resetBtn').onclick = function () { if (confirm('デモデータを初期状態（サンプルのみ）に戻しますか？')) { GT.Demo.reset(); load(); } };
  U.$('latestOnly').onchange = render;
  U.$('reload').onclick = load;

  tabs();
  if (S.pw) {
    API.post({ action: 'teacherRows', password: S.pw }).then(function (j) { S.teacher = true; S.rows = j.rows || []; teacherUI(); render(); }).catch(function () { S.pw = ''; load(); });
  } else load();
  teacherUI();
  var sec = CFG.RESULTS_REFRESH_SEC || 0;
  if (sec > 0) setInterval(function () { if (U.$('auto').checked && !S.busy && !document.querySelector('.rc select:focus, [data-f]:focus')) load(); }, sec * 1000);
})();
