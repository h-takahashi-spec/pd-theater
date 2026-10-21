/* ============================================================
 * ナッシュ均衡の課題（quiz.html）
 * ============================================================ */
(function () {
  var U = GT.U, API = GT.API, CFG = GT.CFG, Q = NQ.questions, app = U.$('app');
  var KEY = 'nashquiz', TOL = 0.006;
  if (API.demo) U.$('demoBanner').classList.remove('hidden');
  function show(h) { app.innerHTML = h; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /* 解答の読み取り：「2/3」「0.67」「.5」「1」など */
  function parseNum(s) {
    s = String(s || '').trim().replace(/[０-９．／]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/\s/g, '');
    if (!s) return null;
    var m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return +m[2] === 0 ? null : +m[1] / +m[2];
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return +s;
    return null;
  }

  /* 利得表 */
  function matrix(q, o) {
    o = o || {};
    var h = '<table class="qm"><tr><th></th><th></th><th colspan="' + q.cols.length + '"><span class="tagB">プレイヤー B</span></th></tr>' +
      '<tr><th></th><th></th>' + q.cols.map(function (c) { return '<th class="vb">' + c + '</th>'; }).join('') + '</tr>';
    q.rows.forEach(function (r, i) {
      h += '<tr>' + (i === 0 ? '<th rowspan="' + q.rows.length + '" class="tag-row"><span class="tagA">プレイヤー A</span></th>' : '') + '<th class="r va">' + r + '</th>';
      q.cols.forEach(function (c, j) {
        var k = i + ',' + j, p = q.M[i][j];
        var a = '<span class="va' + (o.marks && q.br.brA.indexOf(k) >= 0 ? ' ring' : '') + '">' + p[0] + '</span>';
        var b = '<span class="vb' + (o.marks && q.br.brB.indexOf(k) >= 0 ? ' ring' : '') + '">' + p[1] + '</span>';
        var cls = (o.pick ? 'pick' : '') + (o.sel && o.sel.indexOf(k) >= 0 ? ' sel' : '') + (o.marks && q.br.ne.indexOf(k) >= 0 ? ' ne' : '');
        h += '<td class="' + cls + '" data-k="' + k + '" ' + (o.pick ? 'role="checkbox" tabindex="0" aria-checked="false" aria-label="A ' + r + '・B ' + c + '"' : '') + '>' + a + ', ' + b + '</td>';
      });
      h += '</tr>';
    });
    return h + '</table>';
  }
  function cellName(q, k) { var a = k.split(','); return '（A ' + q.rows[+a[0]] + ', B ' + q.cols[+a[1]] + '）'; }

  /* ---------- 入口 ---------- */
  var ctx = {}, answers = {};
  function boot() {
    show('<div class="panel"><p class="center muted">読み込み中…</p></div>');
    API.get({ action: 'status' }).then(function (j) {
      if ((j.open || []).indexOf(KEY) < 0) return locked();
      entry();
    }).catch(function (e) { show('<div class="panel"><h2 class="title-l">サーバーにつながりませんでした</h2><p>' + U.esc(e.message) + '</p></div>'); });
  }
  function locked() {
    show('<div class="panel" id="lockPanel"><span class="kicker" style="background:#2f6fb0">課題</span><h1 class="title-xl">ナッシュ均衡の課題</h1><p><b>この課題は、まだ開いていません。</b><br>先生が開くと、<b>この画面のまま自動で</b>始まります。ページを更新する必要はありません。</p><p class="small muted" id="lk"><span class="pulse"></span>先生の合図を待っています…</p></div>');
    var w = GT.watchOpen({
      needed: function () { return !!U.$('lockPanel'); },
      onTick: function (open, ok) { if (U.$('lk')) U.$('lk').innerHTML = ok ? '<span class="pulse"></span>先生の合図を待っています…（最終確認 ' + new Date().toLocaleTimeString('ja-JP') + '）' : '確認できませんでした（自動で再確認します）。'; },
      onChange: function (open) { if (open.indexOf(KEY) >= 0) { w.stop(); GT.toast('「ナッシュ均衡の課題」が開きました！'); entry(); } }
    }).start([]);
  }
  function entry() {
    var sid = '', nick = '';
    try { sid = localStorage.getItem('gt_sid') || ''; nick = localStorage.getItem('gt_nick') || ''; } catch (e) { }
    show('<div class="panel"><span class="kicker" style="background:#2f6fb0">課題</span><h1 class="title-xl">ナッシュ均衡の課題</h1>' +
      '<p>純粋戦略 <b>5問</b>・混合戦略 <b>3問</b>。利得表は（Aの利得, Bの利得）の順です。最後にまとめて提出します。</p>' +
      '<label class="f" for="sid">学籍番号</label><input type="text" id="sid" autocomplete="off" value="' + U.esc(sid) + '">' +
      '<label class="f" for="nick">ニックネーム</label><input type="text" id="nick" maxlength="16" autocomplete="off" value="' + U.esc(nick) + '">' +
      '<div class="err" id="err"></div><div class="btnrow end"><button class="btn primary big" id="go">課題をはじめる ▶</button></div></div>');
    U.$('go').onclick = function () {
      var s = U.$('sid').value.trim().toUpperCase(), n = U.$('nick').value.trim();
      var pat = CFG.STUDENT_ID_PATTERN ? new RegExp(CFG.STUDENT_ID_PATTERN) : null;
      if (!s || (pat && !pat.test(s))) return (U.$('err').textContent = '学籍番号を正しく入れてください（半角英数字）。');
      if (!n) return (U.$('err').textContent = 'ニックネームを入れてください。');
      try { localStorage.setItem('gt_sid', s); localStorage.setItem('gt_nick', n); } catch (e) { }
      ctx = { sid: s, nick: n }; answers = {}; quiz();
    };
  }

  /* ---------- 問題 ---------- */
  function quiz() {
    var h = '<div class="panel tight"><b>答え方</b><br>' +
      '・純粋戦略：ナッシュ均衡になるマスを<b>すべて</b>クリックして★をつける。ない場合は「ない」にチェック。<br>' +
      '・混合戦略：<b>p＝A が「上」を選ぶ確率、q＝B が「左」を選ぶ確率</b>を、分数（例 2/5）か小数（例 0.4）で入れる。</div>';
    h += '<div class="sec">第1部　純粋戦略（5問）</div>';
    Q.forEach(function (q) {
      if (q.kind === 'pure') {
        h += '<section class="panel qcard" id="' + q.id + '"><div class="qhead"><span class="qno">問' + q.no + '</span><span class="small muted">ナッシュ均衡（純粋戦略）をすべて選ぶ</span></div>' +
          matrix(q, { pick: true, sel: [] }) +
          '<label class="none"><input type="checkbox" data-none="' + q.id + '"> 純粋戦略のナッシュ均衡は ない</label></section>';
      }
    });
    h += '<div class="sec">第2部　混合戦略（3問）</div>';
    Q.forEach(function (q) {
      if (q.kind === 'mixed') {
        h += '<section class="panel qcard" id="' + q.id + '"><div class="qhead"><span class="qno">問' + q.no + '</span><span class="small muted">' +
          (q.br.ne.length ? '純粋戦略の均衡のほかにある、混合戦略のナッシュ均衡を求める' : '混合戦略のナッシュ均衡を求める') + '</span></div>' +
          matrix(q) + '<div class="ans">' + q.ask.map(function (a) {
            return '<label for="' + q.id + '_' + a + '">' + NQ.LABELS[a] + ' ＝</label><input id="' + q.id + '_' + a + '" data-in="' + q.id + '" data-part="' + a + '" inputmode="decimal" placeholder="例 2/5">';
          }).join('') + '</div></section>';
      }
    });
    h += '<div class="err" id="err"></div><div class="btnrow end"><button class="btn primary big" id="submit">提出する</button></div>';
    show(h);
    Q.forEach(function (q) { answers[q.id] = q.kind === 'pure' ? { cells: [], none: false } : {}; });
    app.querySelectorAll('td.pick').forEach(function (td) {
      var toggle = function () {
        var qid = td.closest('section').id, k = td.dataset.k, a = answers[qid];
        var i = a.cells.indexOf(k);
        if (i >= 0) a.cells.splice(i, 1); else { a.cells.push(k); a.none = false; app.querySelector('[data-none="' + qid + '"]').checked = false; }
        td.classList.toggle('sel', i < 0); td.setAttribute('aria-checked', i < 0 ? 'true' : 'false');
      };
      td.onclick = toggle;
      td.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
    });
    app.querySelectorAll('[data-none]').forEach(function (cb) {
      cb.onchange = function () {
        var qid = cb.dataset.none, a = answers[qid]; a.none = cb.checked;
        if (cb.checked) { a.cells = []; U.$(qid).querySelectorAll('td.sel').forEach(function (td) { td.classList.remove('sel'); td.setAttribute('aria-checked', 'false'); }); }
      };
    });
    app.querySelectorAll('[data-in]').forEach(function (inp) { inp.oninput = function () { answers[inp.dataset.in][inp.dataset.part] = inp.value; }; });
    U.$('submit').onclick = submit;
  }

  /* ---------- 採点 ---------- */
  function grade() {
    var res = {}, score = 0;
    Q.forEach(function (q) {
      var a = answers[q.id], ok;
      if (q.kind === 'pure') {
        var want = q.br.ne.slice().sort().join('|'), got = a.none ? '' : a.cells.slice().sort().join('|');
        ok = (a.none || a.cells.length) ? want === got : false;
        res[q.id] = { ok: ok, answered: a.none || a.cells.length > 0, got: a.none ? 'none' : a.cells.slice().sort() };
      } else {
        var parts = {}; ok = true; var answered = false;
        q.ask.forEach(function (k) {
          var v = parseNum(a[k]); if (a[k] && String(a[k]).trim()) answered = true;
          var good = v != null && Math.abs(v - q.mx[k].v) <= TOL;
          parts[k] = { raw: a[k] || '', ok: good }; if (!good) ok = false;
        });
        res[q.id] = { ok: ok, answered: answered, parts: parts };
      }
      if (ok) score++;
    });
    return { res: res, score: score };
  }

  function submit() {
    var g = grade(), blank = Q.filter(function (q) { return !g.res[q.id].answered; }).map(function (q) { return '問' + q.no; });
    if (blank.length && !confirm('まだ答えていない問題があります（' + blank.join('・') + '）。このまま提出しますか？')) return;
    var btn = U.$('submit'); btn.disabled = true; btn.textContent = '送信中…';
    var row = {
      game: KEY, role: '', studentId: ctx.sid, nickname: ctx.nick, sessionId: U.uid(), ua: navigator.userAgent.slice(0, 120),
      choice: String(g.score), choiceLabel: g.score + ' / ' + Q.length + ' 点', expect: '', expectLabel: '', reason: '',
      detail: { answers: answers, correct: Q.map(function (q) { return g.res[q.id].ok ? 1 : 0; }), total: Q.length }
    };
    API.post({ action: 'submit', rows: [row] }).then(function () { result(g); })
      .catch(function (e) { btn.disabled = false; btn.textContent = '提出する'; U.$('err').textContent = '送信できませんでした：' + e.message; });
  }

  /* ---------- 結果と解説 ---------- */
  function result(g) {
    var showAns = CFG.QUIZ_SHOW_ANSWERS !== false;
    var h = '<div class="panel"><span class="kicker" style="background:#2f6fb0">提出しました</span><div class="score">' + g.score + ' <span style="font-size:1.4rem">/ ' + Q.length + ' 点</span></div>' +
      '<p class="center small muted">純粋戦略 ' + Q.filter(function (q) { return q.kind === 'pure' && g.res[q.id].ok; }).length + ' / 5　混合戦略 ' + Q.filter(function (q) { return q.kind === 'mixed' && g.res[q.id].ok; }).length + ' / 3</p></div>';
    if (!showAns) {
      h += '<div class="panel">解答と解説は、先生が授業で説明します。</div>';
      return show(h + '<div class="btnrow"><a class="btn ghost" href="index.html">ゲーム一覧へ</a></div>');
    }
    Q.forEach(function (q) {
      var r = g.res[q.id];
      h += '<section class="panel qcard"><div class="qhead"><span class="qno">問' + q.no + '</span><span class="' + (r.ok ? 'ok' : 'ng') + '">' + (r.ok ? '正解' : '不正解') + '</span></div>';
      if (q.kind === 'pure') {
        h += matrix(q, { marks: true }) + '<p class="legend2"><span class="va">○＝A の最適反応（各列でいちばん大きい A の利得）</span>　<span class="vb">○＝B の最適反応（各行でいちばん大きい B の利得）</span></p>';
        var your = r.got === 'none' ? '「ない」' : (r.got.length ? r.got.map(function (k) { return cellName(q, k); }).join('、') : '（未回答）');
        var right = q.br.ne.length ? q.br.ne.map(function (k) { return cellName(q, k); }).join('、') : '純粋戦略のナッシュ均衡はない';
        h += '<div class="expl">あなたの答え：' + your + '<br><b>正解：' + right + '</b><br>' +
          (q.br.ne.length ? '両方の ○ がそろったマスがナッシュ均衡です。' + (q.br.ne.length > 1 ? '均衡は ' + q.br.ne.length + ' つあります。' : '')
            : '両方の ○ がそろうマスがありません。最適反応をたどるとぐるぐる回り続けます（この場合も混合戦略の均衡はあります）。') + '</div>';
      } else {
        var M = q.M, mx = q.mx;
        h += matrix(q) + '<div class="expl">' + q.ask.map(function (k) {
          var pt = r.parts[k]; return NQ.LABELS[k] + '：あなた「' + U.esc(pt.raw || '未回答') + '」 → <span class="' + (pt.ok ? 'ok' : 'ng') + '">' + (pt.ok ? '○' : '×') + '</span>　<b>正解 ' + mx[k].s + '</b>';
        }).join('<br>') + '<hr style="border:none;border-top:1.5px dashed #c9bfae">' +
          '<b>q の求め方</b>（A が「上」でも「下」でも同じくらい得になる q）<br>' +
          '上：' + M[0][0][0] + 'q ＋ ' + M[0][1][0] + '(1−q)　＝　下：' + M[1][0][0] + 'q ＋ ' + M[1][1][0] + '(1−q)　→　q ＝ ' + mx.q.s + '<br>' +
          '<b>p の求め方</b>（B が「左」でも「右」でも同じくらい得になる p）<br>' +
          '左：' + M[0][0][1] + 'p ＋ ' + M[1][0][1] + '(1−p)　＝　右：' + M[0][1][1] + 'p ＋ ' + M[1][1][1] + '(1−p)　→　p ＝ ' + mx.p.s +
          (q.ask.indexOf('ea') >= 0 ? '<br><b>A の期待利得</b>：上を選んだときの値に q を入れる → ' + M[0][0][0] + '×' + mx.q.s + ' ＋ ' + M[0][1][0] + '×(1−' + mx.q.s + ') ＝ ' + mx.ea.s : '') +
          '<br><span class="small muted">p は B の利得、q は A の利得から決まることに注意（相手を迷わせる確率）。</span></div>';
      }
      h += '</section>';
    });
    show(h + '<div class="btnrow"><a class="btn ghost" href="index.html">ゲーム一覧へ</a>' + (CFG.QUIZ_RETRY ? '<button class="btn primary" id="again">もう一度挑戦する</button>' : '') + '</div>');
    if (U.$('again')) U.$('again').onclick = function () { answers = {}; quiz(); };
  }

  boot();
})();
