/* ============================================================
 * プレイ画面（index.html?game=xxx）
 * ============================================================ */
(function () {
  var U = GT.U, API = GT.API, CFG = GT.CFG, G = window.GT_GAMES, ORDER = window.GT_ORDER;
  var app = U.$('app');
  var MIN = CFG.MIN_REASON || 15;
  var SESSION = U.uid();

  U.$('siteTitle').textContent = CFG.SITE_TITLE || 'ジレンマ劇場';
  U.$('siteSub').textContent = CFG.SITE_SUB || '';
  document.title = CFG.SITE_TITLE || 'ジレンマ劇場';
  if (API.demo) U.$('demoBanner').classList.remove('hidden');

  var gid = U.qs('game');
  var game = G[gid];
  var ctx = {};
  var autoIPD = gid === 'ipd';
  if (autoIPD) game = window.GT_IPD_SET;
  var MINPOOL = Math.max(1, +CFG.OPP_MIN_POOL || 1);

  /* 繰り返しPDの順番：学籍番号から半々に振り分け、終わった条件はこの端末に記録 */
  function ipdDone(sid) { try { return JSON.parse(localStorage.getItem('gt_ipd_done_' + sid) || '[]'); } catch (e) { return []; } }
  function ipdMarkDone(sid, id) { var d = ipdDone(sid); if (d.indexOf(id) < 0) d.push(id); try { localStorage.setItem('gt_ipd_done_' + sid, JSON.stringify(d)); } catch (e) { } }
  function ipdAssign(sid) {
    var first = CFG.IPD_ORDER === 'unknown_first' ? 'ipd_unknown' : CFG.IPD_ORDER === 'known_first' ? 'ipd_known'
      : (U.coin(sid + '|ipd') ? 'ipd_unknown' : 'ipd_known');
    var second = first === 'ipd_unknown' ? 'ipd_known' : 'ipd_unknown';
    var done = ipdDone(sid);
    if (done.indexOf(first) < 0) return first;
    if (done.indexOf(second) < 0) return second;
    return first;
  }
  /* 相手の手：先に参加した人がいなければ、コンピュータの代役が決める（ルールは画面に明示） */
  var BOT = {
    twoByTwo: function () { return { choice: U.pick(game.order), bot: true }; },             // コイン投げ（50%ずつ）
    volunteer: function () { return { choice: Math.random() < 0.5 ? 'V' : 'W', bot: true }; }, // 50%で名乗り出る
    amount: function () { return { choice: String(50 * Math.floor(Math.random() * 11)), bot: true }; }, // 0〜500G（円）を50刻みで一様に
    send: function () { return { choice: String(Math.floor(Math.random() * 11)), bot: true }; },           // 0〜10個を一様に
    ret: function () { return { choice: String(10 * Math.floor(Math.random() * 11)), bot: true }; }          // 0〜100%を10%刻みで一様に
  };

  function show(html) { app.innerHTML = html; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function sentences(html) {
    // 「。」で区切って順番にふわっと出す
    var parts = html.split(/(?<=。|」)/);
    return parts.map(function (p, i) { return '<span class="sent" style="animation-delay:' + (0.15 + i * 0.35) + 's">' + p + '</span>'; }).join('');
  }
  function reasonBox(id, prompt) {
    return '<label class="f" for="' + id + '">' + prompt + '</label>' +
      '<textarea id="' + id + '" placeholder="例：〜だと思ったので、〜を選んだ。（' + MIN + '文字以上）"></textarea>' +
      '<div class="counter" id="' + id + 'C">0 / ' + MIN + '文字以上</div>';
  }
  function bindCounter(id, onChange) {
    var ta = U.$(id), c = U.$(id + 'C');
    var f = function () {
      var n = ta.value.trim().length;
      c.textContent = n + ' / ' + MIN + '文字以上';
      c.classList.toggle('ok', n >= MIN);
      if (onChange) onChange();
    };
    ta.addEventListener('input', f); f();
  }
  function okReason(id) { var t = U.$(id); return t && t.value.trim().length >= MIN; }

  /* ---------- 課題の開放状態を確かめてから始める ---------- */
  var OPEN = [];
  function isOpen(id) { return OPEN.indexOf(GT.gateKey(id)) >= 0; }
  function loadStatus() { return API.get({ action: 'status' }).then(function (j) { OPEN = j.open || []; return OPEN; }); }
  function statusError(err) {
    show('<div class="panel"><h2 class="title-l">サーバーにつながりませんでした</h2><p>' + U.esc(err.message) + '</p><div class="btnrow end"><button class="btn primary" id="retry">もう一度</button></div></div>');
    U.$('retry').onclick = boot;
  }
  var watcher = null;
  function watch(o) { if (watcher) watcher.stop(); watcher = GT.watchOpen(o).start(OPEN); return watcher; }
  function nameOf(key) { var g = GT.GATES.filter(function (x) { return x[0] === key; })[0]; return g ? g[1].replace(/（.*?）/, '') : key; }
  function boot() {
    show('<div class="panel"><p class="center muted">読み込み中…</p></div>');
    loadStatus().then(function () {
      if (!game) return portal();
      document.documentElement.style.setProperty('--gc', game.color);
      U.$('resultsLink').href = 'results.html?game=' + (game.kind === 'ipd' || autoIPD ? 'ipd' : gid);
      document.title = game.title + '｜' + (CFG.SITE_TITLE || 'ジレンマ劇場');
      if (isOpen(gid)) entry(); else locked();
    }).catch(statusError);
  }
  /** 閉じている課題：待ち画面。先生が開くと、何もしなくても入口へ進む */
  function locked() {
    var art = window.ART.svg('<rect width="400" height="240" fill="#efe6d4"/>' +
      '<g opacity=".35">' + game.hero().replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>' +
      '<g transform="translate(200 128)"><path d="M-26 -18 v-18 a26 26 0 0 1 52 0 v18" fill="none" stroke="#2b2622" stroke-width="10" stroke-linecap="round"/>' +
      '<rect x="-40" y="-20" width="80" height="64" rx="10" fill="#f2c14e" stroke="#2b2622" stroke-width="4"/>' +
      '<circle cx="0" cy="6" r="8" fill="#2b2622"/><rect x="-3" y="8" width="6" height="18" fill="#2b2622"/></g>');
    show('<div class="panel" id="lockPanel">' + art +
      '<div style="margin-top:14px"><span class="kicker">GAME ' + game.no + '</span></div>' +
      '<h1 class="title-xl">' + U.esc(game.title) + '</h1>' +
      '<p><b>この課題は、まだ開いていません。</b><br>先生が開くと、<b>この画面のまま自動で</b>始まります。ページを更新する必要はありません。</p>' +
      '<p class="small muted" id="lockMsg"><span class="pulse"></span>先生の合図を待っています…</p>' +
      '<div class="btnrow"><a class="btn ghost" href="index.html">ゲーム一覧へ</a><button class="btn ghost" id="recheck">いま確認する</button></div></div>');
    var w = watch({
      needed: function () { return !!U.$('lockPanel'); },
      onTick: function (open, ok) { var m = U.$('lockMsg'); if (m) m.innerHTML = ok ? '<span class="pulse"></span>先生の合図を待っています…（最終確認 ' + new Date().toLocaleTimeString('ja-JP') + '）' : '確認できませんでした。通信状態を確かめてください（自動で再確認します）。'; },
      onChange: function (open) { OPEN = open; if (isOpen(gid)) { w.stop(); GT.toast('「' + game.title + '」が開きました！'); entry(); } }
    });
    U.$('recheck').onclick = function () { w.check(); };
  }
  boot();

  /* ======================== ポータル ======================== */
  function cardLock(a, op, justOpened) {
    a.classList.toggle('locked', !op);
    if (op) { a.removeAttribute('aria-disabled'); a.removeAttribute('tabindex'); } else { a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
    var b = a.querySelector('.lockbadge'); if (b) b.style.display = op ? 'none' : '';
    if (justOpened) { a.classList.remove('opened'); void a.offsetWidth; a.classList.add('opened'); }
  }
  function portal() {
    var h = '<h1 class="hero-title">' + U.esc(CFG.SITE_TITLE || 'ジレンマ劇場') + '</h1>' +
      '<p class="hero-sub">10の物語で、協力・信頼・駆け引きを体験しよう。先生に指定されたゲームを選んでください。<br><b id="noneMsg"' + (OPEN.length ? ' style="display:none"' : '') + '>いま開いている課題はありません。先生が開くと、ここに自動で表示されます。</b></p>' +
      '<div class="games">';
    ORDER.forEach(function (id) {
      if (id === 'ipd_known') return;
      var g = id === 'ipd_unknown' ? window.GT_IPD_SET : G[id];
      h += '<a class="gcard" data-gate="' + GT.gateKey(id) + '" href="?game=' + (id === 'ipd_unknown' ? 'ipd' : id) + '" style="--gc:' + g.color + '">' + g.hero() +
        '<div class="body"><span class="no" style="background:' + g.color + '">GAME ' + g.no + '</span><span class="lockbadge">🔒 まだ開いていません</span>' +
        '<h3>' + U.esc(g.title) + (g.subtitle ? '<br><span class="small">（' + U.esc(g.subtitle) + '）</span>' : '') + '</h3>' +
        '<div class="st">「' + U.esc(g.story_title) + '」</div><div class="tg">' + U.esc(g.tagline) + '</div></div></a>';
    });
    h += '</div>';
    h += '<h2 class="title-l" style="margin-top:28px">課題</h2><div class="games"><a class="gcard" data-gate="nashquiz" href="quiz.html" style="--gc:#2f6fb0">' +
      '<div class="body"><span class="no" style="background:#2f6fb0">課題</span><span class="lockbadge">🔒 まだ開いていません</span>' +
      '<h3>ナッシュ均衡の課題</h3><div class="st">純粋戦略 5問・混合戦略 3問</div><div class="tg">利得表からナッシュ均衡を求めよう。</div></div></a></div>';
    h += '<p class="center small muted" style="margin-top:22px">各ゲームのURL：<code>index.html?game=pd</code> のように <code>?game=</code> のあとにID（' + ORDER.join(' / ') + '）をつけます。繰り返しPDは <code>?game=ipd</code> にすると、2つの条件の順番を学籍番号で半々に振り分けます。</p>';
    show(h);
    var apply = function (prev) {
      var opened = [];
      app.querySelectorAll('a.gcard[data-gate]').forEach(function (a) {
        var k = a.dataset.gate, op = isOpen(k), was = prev ? prev.indexOf(k) >= 0 : op;
        if (op && !was) opened.push(k);
        cardLock(a, op, op && !was);
      });
      U.$('noneMsg').style.display = OPEN.length ? 'none' : '';
      opened.forEach(function (k) { GT.toast('🔓「' + nameOf(k) + '」が開きました！'); });
    };
    apply(null);
    // 鍵のかかったカードがある間だけ見張る（閉じたことも反映するため、全部開いていても間隔をあけて確認）
    watch({
      needed: function () { return !!app.querySelector('a.gcard[data-gate]'); },
      slow: function () { return !app.querySelector('a.gcard.locked'); }, // 全部開いたら間隔を延ばす
      onChange: function (open, prev) { OPEN = open; apply(prev); }
    });
  }

  /* ======================== 入口（学籍番号・ニックネーム） ======================== */
  function entry() {
    var sid = '', nick = '';
    try { sid = localStorage.getItem('gt_sid') || ''; nick = localStorage.getItem('gt_nick') || ''; } catch (e) { }
    show('<div class="panel">' + game.hero() +
      '<div style="margin-top:14px"><span class="kicker">GAME ' + game.no + '</span></div>' +
      '<h1 class="title-xl">' + U.esc(game.title) + (game.subtitle ? '<span class="small">（' + U.esc(game.subtitle) + '）</span>' : '') + '</h1>' +
      '<p class="muted" style="margin:0">「' + U.esc(game.story_title) + '」― ' + U.esc(game.tagline) + '</p>' +
      '<label class="f" for="sid">学籍番号</label><input type="text" id="sid" autocomplete="off" inputmode="latin" value="' + U.esc(sid) + '">' +
      '<label class="f" for="nick">ニックネーム <span class="small muted">（結果ページで表示されます。本名は避けてください）</span></label><input type="text" id="nick" maxlength="16" autocomplete="off" value="' + U.esc(nick) + '">' +
      '<div class="err" id="entryErr"></div>' +
      '<div class="btnrow end"><button class="btn primary big" id="startBtn">物語をはじめる ▶</button></div></div>');
    U.$('startBtn').onclick = function () {
      var s = U.$('sid').value.trim().toUpperCase(), n = U.$('nick').value.trim();
      var pat = CFG.STUDENT_ID_PATTERN ? new RegExp(CFG.STUDENT_ID_PATTERN) : null;
      if (!s) return (U.$('entryErr').textContent = '学籍番号を入れてください。');
      if (pat && !pat.test(s)) return (U.$('entryErr').textContent = '学籍番号の形式が正しくないようです（半角英数字）。');
      if (!n) return (U.$('entryErr').textContent = 'ニックネームを入れてください。');
      try { localStorage.setItem('gt_sid', s); localStorage.setItem('gt_nick', n); } catch (e) { }
      ctx = { sid: s, nick: n };
      if (autoIPD) {
        gid = ipdAssign(s); game = G[gid]; ctx.ipdAuto = true;
        document.documentElement.style.setProperty('--gc', game.color);
      }
      if (game.roles) ctx.role = U.pick(game.roles);
      if (game.kind === 'ipd') {
        ctx.bot = CFG.IPD_BOT === 'mix' ? U.pick(['tft', 'gtft']) : (CFG.IPD_BOT || 'tft');
        ctx.rounds = game.known ? (CFG.IPD_KNOWN_ROUNDS || 10)
          : (CFG.IPD_UNKNOWN_MIN || 8) + Math.floor(Math.random() * ((CFG.IPD_UNKNOWN_MAX || 12) - (CFG.IPD_UNKNOWN_MIN || 8) + 1));
      }
      story(0);
    };
  }

  /* ======================== 物語 ======================== */
  function story(i) {
    var panels = game.story;
    var p = panels[i].call(game, ctx);
    var dots = panels.map(function (_, k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('');
    show('<div class="panel comic">' + p.art +
      '<p class="narr">' + sentences(p.text) + '</p>' +
      '<div class="btnrow"><div class="dots">' + dots + '</div><div style="display:flex;gap:8px">' +
      (i > 0 ? '<button class="btn ghost" id="back">◀ もどる</button>' : '') +
      '<button class="btn primary" id="next">' + (i < panels.length - 1 ? 'つぎへ ▶' : 'ルールを確認 ▶') + '</button></div></div></div>' +
      (i === 0 ? '<p class="center small muted">物語を読み終えると、あなたの選択の番です。</p>' : ''));
    U.$('next').onclick = function () { i < panels.length - 1 ? story(i + 1) : rules(); };
    if (U.$('back')) U.$('back').onclick = function () { story(i - 1); };
  }

  /* ======================== ルール ======================== */
  function matrixHTML(hit) {
    var me = game.me || 'あなた', op = game.opp || '相手';
    var vals = [];
    game.order.forEach(function (m) { game.order.forEach(function (o) { vals.push(game.pay(m, o, ctx.role)[0]); }); });
    var best = game.better === 'low' ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    var worst = game.better === 'low' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
    var h = '<table class="matrix"><tr><th class="corner">あなた（' + U.esc(me) + '）↓　' + U.esc(op) + ' →</th>';
    game.order.forEach(function (o) { h += '<th>' + U.esc(op) + 'が<br>' + U.esc(game.actions[o].label) + '</th>'; });
    h += '</tr>';
    game.order.forEach(function (m) {
      h += '<tr><th>あなたが<br>' + U.esc(game.actions[m].label) + '</th>';
      game.order.forEach(function (o) {
        var p = game.pay(m, o, ctx.role);
        var cls = (p[0] === best ? 'best' : p[0] === worst ? 'worst' : '') + (hit && hit === m + o ? ' hit' : '');
        h += '<td class="' + cls + '"><span class="me">' + U.esc(game.fmt(p[0])) + '</span><span class="op">' + U.esc(op) + '：' + U.esc(game.fmt(p[1])) + '</span></td>';
      });
      h += '</tr>';
    });
    return h + '</table><p class="small muted" style="margin:6px 0 0">大きい字があなたの結果、小さい字が' + U.esc(op) + 'の結果。' + (game.better === 'low' ? '年数は短いほどよい。' : '数字は大きいほどうれしい。') + '</p>';
  }

  function rules() {
    var body = '';
    if (game.kind === '2x2') {
      body = (game.roleNote ? '<p class="note">' + game.roleNote(ctx) + '</p>' : '') + matrixHTML();
    } else if (game.kind === 'volunteer') {
      body = '<table class="matrix"><tr><th class="corner"></th><th>ほかの4人のうち<br>誰か1人でも名乗り出る</th><th>ほかの4人は<br>誰も名乗り出ない</th></tr>' +
        '<tr><th>あなたが<br>名乗り出る</th><td><span class="me">ぐっすり度 7</span><span class="op">退治はつかれる</span></td><td><span class="me">ぐっすり度 7</span><span class="op">あなたが救世主</span></td></tr>' +
        '<tr><th>あなたは<br>待つ</th><td class="best"><span class="me">ぐっすり度 10</span><span class="op">何もせず安眠</span></td><td class="worst"><span class="me">ぐっすり度 0</span><span class="op">全員、朝まで眠れない</span></td></tr></table>' +
        '<p class="small muted">5人が同時に、相談なしで決めます。誰か1人でも名乗り出ればゴキブリは退治されます。</p>';
    } else if (game.kind === 'ultimatum') {
      body = '<div class="note">宝は <b>1000ゴールド</b>。<br>① <b>分ける側</b>は、相手にいくら渡すかを提案する（' + game.step + 'G単位）。<br>② <b>受け取る側</b>は「乗る」か「断る」だけ。断ると宝は海へ（ふたりとも0G）。<br>あなたは<b>両方の役</b>について決めます。結果は、ほかの参加者とランダムに組み合わせて判定します。</div>';
    } else if (game.kind === 'dictator') {
      body = '<div class="note">賞品は <b>1000円分のお食事券</b>。<br>回したあなたが、ペアの相手に<b>いくら渡すか</b>を決める（' + game.step + '円単位、0円でもよい）。<br>相手は<b>断れません</b>。あなたが渡した額をそのまま受け取ります。<br>結果は、ほかの参加者とランダムにペアを作って判定します（あなたが「受け取る側」になる場合もあります）。</div>';
    } else if (game.kind === 'trust') {
      body = '<div class="note">あなたは<b>種かぶ10個</b>を持っている。<br>① <b>預ける側</b>：名人に何個預けるかを決める（0〜10個）。預けた分は畑で<b>3倍</b>になる。<br>② <b>名人の側</b>：育った収穫のうち<b>何%を返すか</b>を決める（0〜100%）。<br>あなたは<b>両方の役</b>について決めます。結果は、ほかの参加者とランダムに組み合わせて判定します。</div>' +
        '<table class="matrix" style="margin-top:10px"><tr><th class="corner">例</th><th>預ける側の最後の手もち</th><th>名人の手もち</th></tr>' +
        '<tr><th>10個預けて<br>50%返す</th><td class="best"><span class="me">15個</span></td><td><span class="me">15個</span></td></tr>' +
        '<tr><th>10個預けて<br>0%返す</th><td class="worst"><span class="me">0個</span></td><td><span class="me">30個</span></td></tr>' +
        '<tr><th>預けない</th><td><span class="me">10個</span></td><td><span class="me">0個</span></td></tr></table>';
    } else if (game.kind === 'ipd') {
      body = matrixHTMLipd() + '<p class="note" style="margin-top:10px">' +
        (game.known ? '勝負は<b>ちょうど' + ctx.rounds + '週</b>。最後の週がいつかは、あなたもゲンさんも知っています。'
          : '勝負が<b>何週続くかは知らされません</b>。毎週「来週もあるかもしれない」状態で決めます。') +
        '<br>毎週の結果はすぐにわかります。総売上を大きくするのが目標です。</p>';
    }
    show('<div class="panel"><span class="kicker">ルール</span><h2 class="title-l">' + U.esc(game.story_title) + '</h2>' + body +
      '<div class="btnrow"><button class="btn ghost" id="back">◀ 物語を読みなおす</button><button class="btn primary big" id="go">' + (game.kind === 'ipd' ? '開店する ▶' : '決める ▶') + '</button></div></div>');
    U.$('back').onclick = function () { story(0); };
    U.$('go').onclick = function () {
      if (game.kind === '2x2') decide2x2();
      else if (game.kind === 'volunteer') decideVolunteer();
      else if (game.kind === 'ultimatum') decideProposer();
      else if (game.kind === 'dictator') decideDictator();
      else if (game.kind === 'trust') decideInvestor();
      else if (game.kind === 'ipd') ipdStart();
    };
  }
  function matrixHTMLipd(hit) {
    var saved = { me: game.me, opp: game.opp };
    game.me = '麺屋あい'; game.opp = 'ゲンさん';
    var h = matrixHTML(hit);
    game.me = saved.me; game.opp = saved.opp;
    return h.replace('数字は大きいほどうれしい。', '1週間の利益。大きいほどよい。');
  }

  /* ======================== 2×2ゲームの決定 ======================== */
  function choiceCards(name) {
    return '<div class="choices" role="radiogroup">' + game.order.map(function (a) {
      var x = game.actions[a];
      return '<button type="button" class="choice" data-' + name + '="' + a + '" role="radio" aria-checked="false"><span class="ic">' + x.icon + '</span><span class="lb">' + U.esc(x.label) + '</span><span class="sb">' + U.esc(x.sub) + '</span></button>';
    }).join('') + '</div>';
  }
  function bindChoice(name, cb) {
    app.querySelectorAll('[data-' + name + ']').forEach(function (b) {
      b.onclick = function () {
        app.querySelectorAll('[data-' + name + ']').forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
        cb(b.getAttribute('data-' + name));
      };
    });
  }

  function decide2x2() {
    var st = { choice: '', expect: '' };
    show('<div class="panel"><span class="kicker">あなたの番</span><h2 class="title-l">' + U.esc(game.me || 'あなた') + '（あなた）は、どうする？</h2>' +
      (game.roleNote ? '<p class="note">' + game.roleNote(ctx) + '</p>' : '') +
      '<details><summary class="small">利得表をもう一度見る</summary>' + matrixHTML() + '</details>' +
      '<div class="qtitle"><span class="n">1</span>あなたの選択</div>' + choiceCards('act') +
      '<div class="qtitle"><span class="n">2</span>' + U.esc(game.expectQ) + '</div>' +
      '<div class="pills">' + game.order.map(function (a) { return '<button type="button" class="pill" data-exp="' + a + '">' + U.esc(game.actions[a].label) + '</button>'; }).join('') + '</div>' +
      '<div class="qtitle"><span class="n">3</span>理由</div>' + reasonBox('reason', game.reasonQ) +
      '<div class="err" id="err"></div><div class="btnrow end"><button class="btn primary big" id="submit" disabled>この選択で決定！</button></div></div>');
    var check = function () { U.$('submit').disabled = !(st.choice && st.expect && okReason('reason')); };
    bindChoice('act', function (a) { st.choice = a; check(); });
    app.querySelectorAll('[data-exp]').forEach(function (b) {
      b.onclick = function () { app.querySelectorAll('[data-exp]').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); st.expect = b.dataset.exp; check(); };
    });
    bindCounter('reason', check);
    U.$('submit').onclick = function () {
      var row = baseRow({
        role: ctx.role || '', choice: st.choice, choiceLabel: game.actions[st.choice].label,
        expect: st.expect, expectLabel: game.actions[st.expect].label, reason: U.$('reason').value.trim(),
        detail: ctx.role ? { role: ctx.role, favorite: game.actions[ctx.role === 'A' ? 'F' : 'M'].label } : (gid === 'stag' ? { stagValue: game.pay('S', 'S')[0] } : {}),
        match: { role: game.oppRole ? game.oppRole(ctx.role) : '', k: 1, min: MINPOOL }
      });
      send([row], function (res) { reveal2x2(st, (res.partners && res.partners[0]) || []); });
    };
  }

  function baseRow(o) {
    return Object.assign({ game: gid, studentId: ctx.sid, nickname: ctx.nick, sessionId: SESSION, ua: navigator.userAgent.slice(0, 120) }, o);
  }

  function send(rows, done) {
    show('<div class="panel"><div class="drum">' + (game.kind === 'ipd' ? '集計中…' : 'ドキドキ… 相手の選択をめくります') + '</div></div>');
    var t0 = Date.now();
    API.post({ action: 'submit', rows: rows }).then(function (res) {
      var wait = Math.max(0, 1300 - (Date.now() - t0));
      setTimeout(function () { done(res); }, wait);
    }).catch(function (err) {
      var gated = /受け付けていません/.test(err.message);
      show('<div class="panel"><h2 class="title-l">' + (gated ? 'いまは送信できません' : '送信できませんでした') + '</h2><p>' + U.esc(err.message) + '</p>' +
        '<p class="small muted">' + (gated ? '先生がこの課題を閉じたようです。あなたの選択と理由はこの画面に残っているので、再開されたら「もう一度送る」を押してください。' : '通信状態を確認して、もう一度ためしてください。') + '</p>' +
        '<div class="btnrow end"><button class="btn primary" id="retry">もう一度送る</button></div></div>');
      U.$('retry').onclick = function () { send(rows, done); };
    });
  }

  function afterLinks() {
    var rid = game.kind === 'ipd' ? 'ipd' : gid;
    return '<div class="btnrow"><a class="btn ghost" href="index.html">ほかのゲーム一覧</a><a class="btn primary" href="results.html?game=' + rid + '">みんなの結果を見る ▶</a></div>';
  }

  function reveal2x2(st, partners) {
    var p = partners[0];
    var me = game.me || 'あなた', op = game.opp || '相手';
    if (!p) p = BOT.twoByTwo();
    var oc = p.choice, pay = game.pay(st.choice, oc, ctx.role), out = game.outcome(st.choice, oc, ctx.role);
    show('<div class="panel"><span class="kicker">結果発表</span>' +
      '<p class="small muted" style="margin:6px 0 0">' + (p.bot
        ? 'まだ先に参加した人が' + (MINPOOL > 1 ? MINPOOL + '人そろっていない' : 'いない') + 'ので、今回の' + U.esc(op) + 'は<b>コンピュータの代役</b>です（コインを投げて決めました）。'
        : '先に参加した人の中からランダムに選んだ1人の選択を、' + U.esc(op) + 'の選択としてめくります。') + '</p>' +
      '<div class="reveal"><div class="rcard static"><div class="inner"><div class="face back"><span class="who">あなた（' + U.esc(me) + '）</span><span class="act">' + U.esc(game.actions[st.choice].label) + '</span></div></div></div>' +
      '<div class="vs">VS</div><div class="rcard" id="flip"><div class="inner"><div class="face front">？</div><div class="face back"><span class="who">' + U.esc(op) + (p.bot ? '（代役）' : '') + '</span><span class="act">' + U.esc(game.actions[oc].label) + '</span></div></div></div></div>' +
      '<div id="after" style="opacity:0;transition:opacity .6s">' + out.art +
      '<h2 class="title-l" style="margin-top:12px">' + U.esc(out.title) + '</h2><p>' + U.esc(out.text) + '</p>' +
      '<div class="scorebox"><div>あなた<b>' + U.esc(game.fmt(pay[0])) + '</b></div><div>' + U.esc(op) + '<b>' + U.esc(game.fmt(pay[1])) + '</b></div></div>' +
      '<details style="margin-top:10px"><summary class="small">利得表で確認</summary>' + matrixHTML(st.choice + oc) + '</details>' +
      afterLinks() + '</div></div>');
    setTimeout(function () { U.$('flip').classList.add('flipped'); }, 500);
    setTimeout(function () { U.$('after').style.opacity = 1; }, 1300);
  }

  /* ======================== ボランティアのジレンマ ======================== */
  function decideVolunteer() {
    var st = { choice: '', expect: '' };
    show('<div class="panel"><span class="kicker">あなたの番</span><h2 class="title-l">名乗り出る？ 待つ？</h2>' +
      '<div class="qtitle"><span class="n">1</span>あなたの選択</div>' + choiceCards('act') +
      '<div class="qtitle"><span class="n">2</span>' + U.esc(game.expectQ) + '</div>' +
      '<div class="pills">' + [0, 1, 2, 3, 4].map(function (k) { return '<button type="button" class="pill" data-exp="' + k + '">' + k + '人</button>'; }).join('') + '</div>' +
      '<div class="qtitle"><span class="n">3</span>理由</div>' + reasonBox('reason', game.reasonQ) +
      '<div class="err" id="err"></div><div class="btnrow end"><button class="btn primary big" id="submit" disabled>この選択で決定！</button></div></div>');
    var check = function () { U.$('submit').disabled = !(st.choice && st.expect !== '' && okReason('reason')); };
    bindChoice('act', function (a) { st.choice = a; check(); });
    app.querySelectorAll('[data-exp]').forEach(function (b) {
      b.onclick = function () { app.querySelectorAll('[data-exp]').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); st.expect = b.dataset.exp; check(); };
    });
    bindCounter('reason', check);
    U.$('submit').onclick = function () {
      var row = baseRow({ role: '', choice: st.choice, choiceLabel: game.actions[st.choice].label, expect: st.expect, expectLabel: st.expect + '人', reason: U.$('reason').value.trim(), detail: { groupSize: 5 }, match: { k: 4, min: MINPOOL } });
      send([row], function (res) { revealVolunteer(st, (res.partners && res.partners[0]) || []); });
    };
  }
  function revealVolunteer(st, partners) {
    var mates = partners.map(function (p) { return { choice: p.choice, bot: false }; });
    while (mates.length < 4) mates.push(BOT.volunteer());
    var others = mates.map(function (m) { return m.choice; });
    var nBot = mates.filter(function (m) { return m.bot; }).length;
    var anyOther = others.indexOf('V') >= 0;
    var pay = game.payV(st.choice, anyOther);
    var nV = others.filter(function (x) { return x === 'V'; }).length + (st.choice === 'V' ? 1 : 0);
    var title, text;
    if (nV === 0) { title = '誰も動かなかった…'; text = 'ゴキブリは台所を悠々と散歩。5人とも朝まで眠れなかった。'; }
    else if (st.choice === 'V' && nV === 1) { title = 'あなたが救世主！'; text = 'スリッパ一閃。名乗り出たのはあなただけ。みんな安心して眠りについた。'; }
    else if (st.choice === 'V') { title = '名乗り出たのは' + nV + '人'; text = 'スリッパを持った' + nV + '人が台所で鉢合わせ。誰かひとりでよかったのに…でも退治は成功。'; }
    else { title = '誰かがやってくれた'; text = nV + '人が名乗り出て退治成功。あなたは布団の中でそっと感謝した。'; }
    var cards = '<div class="history" style="justify-content:center">' + [{ choice: st.choice, me: true }].concat(mates).map(function (m, i) {
      var a = m.choice;
      return '<div class="h" style="width:64px;padding:4px"><div>' + (m.me ? 'あなた' : '住人' + (i + 1) + (m.bot ? '<br>(代役)' : '')) + '</div><div style="font-size:1.4rem">' + (a === 'V' ? '🩴' : '🛏️') + '</div><div class="' + (a === 'V' ? 'k' : 's') + '">' + (a === 'V' ? '出動' : '待機') + '</div></div>';
    }).join('') + '</div>';
    var note = nBot === 0 ? '先に参加した人の中からランダムに4人を、ルームメイトとして呼びました。'
      : nBot === 4 ? 'まだ先に参加した人がいないので、ルームメイト4人はみな<b>コンピュータの代役</b>です（それぞれ50%の確率で名乗り出ます）。'
      : 'ルームメイトのうち' + (4 - nBot) + '人は先に参加した人、残り' + nBot + '人は<b>コンピュータの代役</b>です（代役はそれぞれ50%の確率で名乗り出ます）。';
    show('<div class="panel"><span class="kicker">結果発表</span>' +
      '<p class="small muted" style="margin:6px 0 0">' + note + '</p>' +
      game.outcomeArt(st.choice, others) + cards +
      '<h2 class="title-l">' + U.esc(title) + '</h2><p>' + U.esc(text) + '</p>' +
      '<div class="scorebox"><div>あなた<b>' + game.fmt(pay) + '</b></div><div>名乗り出た人数<b>' + nV + ' / 5人</b></div></div>' +
      afterLinks() + '</div>');
  }

  /* ======================== 最後通牒ゲーム ======================== */
  var ult = {};
  function splitArt(give, mode) {
    var keep = game.total - give;
    var CH = window.GT_CHARS;
    return window.ART.svg(window.ART.P.sky('#ffd9a8', '#fff2d6') + window.ART.P.floor(180, '#f2deb0') +
      CH.PIRATE_ME({ x: 90, y: 92, s: 0.7, expr: keep > give ? 'smug' : keep === give ? 'happy' : 'normal' }) +
      CH.PIRATE_YOU({ x: 310, y: 92, s: 0.7, expr: give < 200 ? 'angry' : give >= 500 ? 'happy' : 'normal', flip: true }) +
      window.ART.P.coins(90, 218, Math.max(1, Math.round(keep / 100))) + window.ART.P.coins(310, 218, Math.max(give > 0 ? 1 : 0, Math.round(give / 100))) +
      window.ART.caption(200, 120, mode === 'resp' ? 'この額以上なら乗る' : '提案', { fs: 14 }));
  }
  function decideProposer() {
    ult.offer = 500;
    show('<div class="panel"><span class="kicker">役① 分ける側</span><h2 class="title-l">相棒に、いくら渡す？</h2>' +
      '<div id="sa">' + splitArt(500) + '</div>' +
      '<div class="split"><div>あなたの取り分<b id="keep">500G</b></div><div>相棒に渡す<b id="give">500G</b></div></div>' +
      '<input type="range" id="offer" min="0" max="' + game.total + '" step="' + game.step + '" value="500" aria-label="相棒に渡す金額">' +
      '<p class="small muted">相棒が断ると、ふたりとも0G。</p>' + reasonBox('reason', game.reasonQProposer) +
      '<div class="btnrow end"><button class="btn primary big" id="next" disabled>受け取る側の役へ ▶</button></div></div>');
    var touched = false;
    var check = function () { U.$('next').disabled = !(touched && okReason('reason')); };
    U.$('offer').oninput = function () {
      touched = true;
      var v = +this.value; ult.offer = v;
      U.$('keep').textContent = (game.total - v) + 'G'; U.$('give').textContent = v + 'G';
      U.$('sa').innerHTML = splitArt(v); check();
    };
    U.$('offer').onchange = U.$('offer').oninput;
    bindCounter('reason', check);
    U.$('next').onclick = function () { ult.reasonP = U.$('reason').value.trim(); decideResponder(); };
  }
  function decideResponder() {
    ult.mao = 300;
    show('<div class="panel"><span class="kicker">役② 受け取る側</span><h2 class="title-l">いくら以上なら「乗る」？</h2>' +
      '<div id="sa">' + splitArt(300, 'resp') + '</div>' +
      '<div class="split"><div>この額以上なら<b id="mao">300G</b>乗る</div><div>これ未満なら<b id="rej">300G未満</b>断る</div></div>' +
      '<input type="range" id="maoR" min="0" max="' + game.total + '" step="' + game.step + '" value="300" aria-label="受け入れる最低金額">' +
      '<p class="small muted">相手（分ける側）があなたに提案してくる金額が、この額以上ならあなたは「乗る」。未満なら「断る」（ふたりとも0G）。0Gにすると、どんな提案にも乗ります。</p>' +
      reasonBox('reason2', game.reasonQResponder) +
      '<div class="btnrow"><button class="btn ghost" id="back">◀ 分ける側にもどる</button><button class="btn primary big" id="submit" disabled>決定！</button></div></div>');
    var touched = false;
    var check = function () { U.$('submit').disabled = !(touched && okReason('reason2')); };
    U.$('maoR').oninput = function () {
      touched = true;
      var v = +this.value; ult.mao = v;
      U.$('mao').textContent = v + 'G'; U.$('rej').textContent = v === 0 ? 'なし' : v + 'G未満';
      U.$('sa').innerHTML = splitArt(v, 'resp'); check();
    };
    U.$('maoR').onchange = U.$('maoR').oninput;
    bindCounter('reason2', check);
    U.$('back').onclick = decideProposer;
    U.$('submit').onclick = function () {
      var r2 = U.$('reason2').value.trim();
      var rows = [
        baseRow({ role: 'proposer', choice: String(ult.offer), choiceLabel: '相手に' + ult.offer + 'G渡す', expect: '', expectLabel: '', reason: ult.reasonP, detail: { total: game.total, keep: game.total - ult.offer }, match: { role: 'responder', k: 1, min: MINPOOL } }),
        baseRow({ role: 'responder', choice: String(ult.mao), choiceLabel: ult.mao + 'G以上なら乗る', expect: '', expectLabel: '', reason: r2, detail: { total: game.total }, match: { role: 'proposer', k: 1, min: MINPOOL } })
      ];
      send(rows, function (res) { revealUlt((res.partners || [])[0] || [], (res.partners || [])[1] || []); });
    };
  }
  function revealUlt(respP, propP) {
    if (!respP[0]) respP = [BOT.amount()];
    if (!propP[0]) propP = [BOT.amount()];
    var anyBot = respP[0].bot || propP[0].bot;
    var h = '<div class="panel"><span class="kicker">結果発表</span><p class="small muted" style="margin:6px 0 0">' +
      (anyBot ? 'まだ反対の役の人が先に参加していない場合は、<b>コンピュータの代役</b>が相手です（代役は0〜500Gの中からランダムに金額を決めます）。' : '先に参加した人の中から、反対の役をランダムに組み合わせました。') + '</p>';
    // 分ける側として
    h += '<h3 class="title-l" style="margin-top:12px">① あなたが分ける側のとき</h3>';
    if (respP[0]) {
      var m = +respP[0].choice, acc = ult.offer >= m;
      h += '<p>あなたの提案：相棒に <b>' + ult.offer + 'G</b>。相棒' + (respP[0].bot ? '（代役）' : '') + 'の「乗る」ライン：<b>' + m + 'G以上</b>。</p>' +
        '<div class="scorebox"><div>判定<b style="color:' + (acc ? 'var(--good)' : 'var(--bad)') + '">' + (acc ? '乗った！' : '断られた…') + '</b></div><div>あなたの取り分<b>' + (acc ? game.total - ult.offer : 0) + 'G</b></div></div>' +
        (acc ? '' : '<p class="small">宝箱は、ブクブクと海の底へ。</p>');
    }
    h += '<h3 class="title-l" style="margin-top:16px">② あなたが受け取る側のとき</h3>';
    if (propP[0]) {
      var o = +propP[0].choice, acc2 = o >= ult.mao;
      h += '<p>相手' + (propP[0].bot ? '（代役）' : '') + 'の提案：あなたに <b>' + o + 'G</b>。あなたの「乗る」ライン：<b>' + ult.mao + 'G以上</b>。</p>' +
        '<div class="scorebox"><div>判定<b style="color:' + (acc2 ? 'var(--good)' : 'var(--bad)') + '">' + (acc2 ? '乗った' : '断った') + '</b></div><div>あなたの取り分<b>' + (acc2 ? o : 0) + 'G</b></div></div>';
    }
    show(h + afterLinks() + '</div>');
  }

  /* ======================== 独裁者ゲーム ======================== */
  function slider(id, min, max, step, val, label) {
    return '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" aria-label="' + label + '">';
  }
  function dictArt(give) {
    var CH = game.chars, keep = game.total - give, P = window.ART.P;
    return window.ART.svg(game.stall() +
      CH.ME({ x: 90, y: 112, s: 0.7, expr: keep >= give ? 'happy' : 'normal' }) +
      CH.YOU({ x: 310, y: 114, s: 0.7, expr: give === 0 ? 'sad' : give >= 500 ? 'happy' : 'normal', flip: true }) +
      P.coins(90, 222, Math.max(keep > 0 ? 1 : 0, Math.round(keep / 100))) + P.coins(310, 222, Math.max(give > 0 ? 1 : 0, Math.round(give / 100))));
  }
  function decideDictator() {
    var st = { give: 500, exp: 300, t1: false, t2: false };
    show('<div class="panel"><span class="kicker">あなたの番</span><h2 class="title-l">ペアの相手に、いくら渡す？</h2>' +
      '<div id="sa">' + dictArt(500) + '</div>' +
      '<div class="split"><div>あなたの分<b id="keep">500円</b></div><div>相手に渡す<b id="give">500円</b></div></div>' +
      slider('giveR', 0, game.total, game.step, 500, '相手に渡す金額') +
      '<p class="small muted">相手は断れません。この額がそのまま相手のものになります。</p>' +
      '<div class="qtitle"><span class="n">2</span>' + U.esc(game.expectQ) + '</div>' +
      '<div class="split" style="grid-template-columns:1fr"><div>ほかの人の平均は<b id="expV">300円</b>くらい</div></div>' + slider('expR', 0, game.total, game.step, 300, 'ほかの人の平均の予想') +
      '<div class="qtitle"><span class="n">3</span>理由</div>' + reasonBox('reason', game.reasonQ) +
      '<div class="btnrow end"><button class="btn primary big" id="submit" disabled>この額で決定！</button></div></div>');
    var check = function () { U.$('submit').disabled = !(st.t1 && st.t2 && okReason('reason')); };
    U.$('giveR').oninput = U.$('giveR').onchange = function () {
      st.t1 = true; st.give = +this.value;
      U.$('keep').textContent = (game.total - st.give) + '円'; U.$('give').textContent = st.give + '円'; U.$('sa').innerHTML = dictArt(st.give); check();
    };
    U.$('expR').oninput = U.$('expR').onchange = function () { st.t2 = true; st.exp = +this.value; U.$('expV').textContent = st.exp + '円'; check(); };
    bindCounter('reason', check);
    U.$('submit').onclick = function () {
      var row = baseRow({ role: 'dictator', choice: String(st.give), choiceLabel: '相手に' + st.give + '円渡す', expect: String(st.exp), expectLabel: 'ほかの人の平均は' + st.exp + '円', reason: U.$('reason').value.trim(), detail: { total: game.total, keep: game.total - st.give }, match: { k: 1, min: MINPOOL } });
      send([row], function (res) { revealDictator(st, (res.partners && res.partners[0]) || []); });
    };
  }
  function revealDictator(st, partners) {
    var p = partners[0] || BOT.amount();
    var got = +p.choice;
    show('<div class="panel"><span class="kicker">結果発表</span>' +
      '<p class="small muted" style="margin:6px 0 0">' + (p.bot ? 'まだ先に参加した人がいないので、あなたに渡す人は<b>コンピュータの代役</b>です（0〜500円からランダム）。' : '先に参加した人の中からランダムに選んだ1人を、もうひとつのペアの「回した人」として、あなたが受け取る額をめくります。') + '</p>' +
      '<h3 class="title-l" style="margin-top:12px">① あなたが回した人のとき</h3>' + dictArt(st.give) +
      '<div class="scorebox"><div>あなたの分<b>' + (game.total - st.give) + '円</b></div><div>相手が受け取った額<b>' + st.give + '円</b></div></div>' +
      '<h3 class="title-l" style="margin-top:16px">② あなたが受け取る側のとき</h3>' +
      '<div class="reveal"><div class="rcard static"><div class="inner"><div class="face back"><span class="who">回した人' + (p.bot ? '（代役）' : '') + 'があなたに渡した額</span><span class="act" id="gotTxt">？</span></div></div></div></div>' +
      '<p id="gotMsg" style="opacity:0;transition:opacity .5s"></p>' + afterLinks() + '</div>');
    setTimeout(function () {
      U.$('gotTxt').textContent = got + '円';
      U.$('gotMsg').textContent = got === 0 ? '何ももらえなかった。でも、文句は言えないきまりだ。' : got >= 500 ? '半分以上も！ 知らない人なのに、ずいぶん気前がいい。' : 'ちょっぴりおすそわけ。知らない人からの思いがけない贈り物。';
      U.$('gotMsg').style.opacity = 1;
    }, 900);
  }

  /* ======================== 信頼ゲーム ======================== */
  var tr = {};
  function trustArt(sent, retPct) {
    var CH = game.chars, P = window.ART.P, harvest = sent * game.mult;
    var back = retPct == null ? 0 : Math.round(harvest * retPct / 100);
    return window.ART.svg(P.sky('#cfe9ff', '#f1f8ff') + game.field(176) +
      CH.ME({ x: 80, y: 100, s: 0.65, expr: retPct == null ? 'think' : back > sent ? 'happy' : back < sent ? 'sad' : 'normal' }) +
      CH.YOU({ x: 320, y: 102, s: 0.65, expr: 'smug', flip: true }) +
      game.turnips(20, 186, Math.min(10, game.endow - sent + (retPct == null ? 0 : back)), 0.9) +
      game.turnips(230, 186, Math.min(10, retPct == null ? harvest : harvest - back), 0.9) +
      window.ART.caption(200, 60, sent + '個 → ' + harvest + '個', { fs: 18, fill: '#4f8a3a' }));
  }
  function decideInvestor() {
    var st = { sent: 5, exp: 50, t1: false, t2: false };
    show('<div class="panel"><span class="kicker">役① 預ける側</span><h2 class="title-l">名人に、種かぶを何個預ける？</h2>' +
      '<div id="sa">' + trustArt(5) + '</div>' +
      '<div class="split"><div>手もとに残す<b id="keep">5個</b></div><div>名人に預ける<b id="sent">5個</b><span class="small">畑で <b id="hv" style="display:inline;font-size:1rem">15個</b> に</span></div></div>' +
      slider('sentR', 0, game.endow, 1, 5, '預ける個数') +
      '<div class="qtitle"><span class="n">2</span>' + U.esc(game.expectQ) + '</div>' +
      '<div class="split" style="grid-template-columns:1fr"><div>収穫の<b id="expV">50%</b>くらい返してくれる</div></div>' + slider('expR', 0, 100, 10, 50, '返してくれる割合の予想') +
      '<div class="qtitle"><span class="n">3</span>理由</div>' + reasonBox('reason', game.reasonQInvestor) +
      '<div class="btnrow end"><button class="btn primary big" id="next" disabled>名人の役へ ▶</button></div></div>');
    var check = function () { U.$('next').disabled = !(st.t1 && st.t2 && okReason('reason')); };
    U.$('sentR').oninput = U.$('sentR').onchange = function () {
      st.t1 = true; st.sent = +this.value;
      U.$('keep').textContent = (game.endow - st.sent) + '個'; U.$('sent').textContent = st.sent + '個'; U.$('hv').textContent = (st.sent * game.mult) + '個';
      U.$('sa').innerHTML = trustArt(st.sent); check();
    };
    U.$('expR').oninput = U.$('expR').onchange = function () { st.t2 = true; st.exp = +this.value; U.$('expV').textContent = st.exp + '%'; check(); };
    bindCounter('reason', check);
    U.$('next').onclick = function () { tr = { sent: st.sent, exp: st.exp, reasonI: U.$('reason').value.trim() }; decideTrustee(); };
  }
  function decideTrustee() {
    var r = 50, touched = false;
    var table = function (pct) {
      return '<table class="matrix"><tr><th class="corner">預けられた数</th><th>収穫</th><th>返す</th><th>名人に残る</th></tr>' + [2, 5, 10].map(function (x) {
        var h = x * game.mult, b = Math.round(h * pct / 100);
        return '<tr><th>' + x + '個</th><td>' + h + '個</td><td><span class="me">' + b + '個</span></td><td>' + (h - b) + '個</td></tr>';
      }).join('') + '</table>';
    };
    show('<div class="panel"><span class="kicker">役② 名人の側</span><h2 class="title-l">収穫の何%を返す？</h2>' +
      '<div class="split" style="grid-template-columns:1fr"><div>収穫の<b id="retV">50%</b>を返す</div></div>' + slider('retR', 0, 100, 10, 50, '返す割合') +
      '<div id="tbl">' + table(50) + '</div>' +
      '<p class="small muted">相手が何個預けてきても、収穫のこの割合を返します（端数は四捨五入）。</p>' +
      reasonBox('reason2', game.reasonQTrustee) +
      '<div class="btnrow"><button class="btn ghost" id="back">◀ 預ける側にもどる</button><button class="btn primary big" id="submit" disabled>決定！</button></div></div>');
    var check = function () { U.$('submit').disabled = !(touched && okReason('reason2')); };
    U.$('retR').oninput = U.$('retR').onchange = function () { touched = true; r = +this.value; U.$('retV').textContent = r + '%'; U.$('tbl').innerHTML = table(r); check(); };
    bindCounter('reason2', check);
    U.$('back').onclick = decideInvestor;
    U.$('submit').onclick = function () {
      tr.ret = r;
      var rows = [
        baseRow({ role: 'investor', choice: String(tr.sent), choiceLabel: tr.sent + '個預ける', expect: String(tr.exp), expectLabel: '名人は' + tr.exp + '%返すと予想', reason: tr.reasonI, detail: { endow: game.endow, mult: game.mult }, match: { role: 'trustee', k: 1, min: MINPOOL } }),
        baseRow({ role: 'trustee', choice: String(r), choiceLabel: '収穫の' + r + '%を返す', expect: '', expectLabel: '', reason: U.$('reason2').value.trim(), detail: { endow: game.endow, mult: game.mult }, match: { role: 'investor', k: 1, min: MINPOOL } })
      ];
      send(rows, function (res) { revealTrust((res.partners || [])[0] || [], (res.partners || [])[1] || []); });
    };
  }
  function revealTrust(trP, invP) {
    var t = trP[0] || BOT.ret(), iv = invP[0] || BOT.send();
    var rp = +t.choice, h1 = tr.sent * game.mult, b1 = Math.round(h1 * rp / 100), mine1 = game.endow - tr.sent + b1;
    var x2 = +iv.choice, h2 = x2 * game.mult, b2 = Math.round(h2 * tr.ret / 100);
    var anyBot = t.bot || iv.bot;
    show('<div class="panel"><span class="kicker">結果発表</span><p class="small muted" style="margin:6px 0 0">' +
      (anyBot ? 'まだ反対の役の人が先に参加していない場合は、<b>コンピュータの代役</b>が相手です（代役の預ける数は0〜10個、返す割合は0〜100%からランダム）。' : '先に参加した人の中から、反対の役をランダムに組み合わせました。') + '</p>' +
      '<h3 class="title-l" style="margin-top:12px">① あなたが預ける側のとき</h3>' + trustArt(tr.sent, rp) +
      '<p>あなたは <b>' + tr.sent + '個</b> 預けた → 畑で <b>' + h1 + '個</b> に。名人' + (t.bot ? '（代役）' : '') + 'は収穫の <b>' + rp + '%</b>（' + b1 + '個）を返してくれた。' +
      (tr.sent === 0 ? '' : '（あなたの予想は ' + tr.exp + '%）') + '</p>' +
      '<div class="scorebox"><div>あなたの最後の手もち<b>' + mine1 + '個</b></div><div>預けなかった場合<b>' + game.endow + '個</b></div></div>' +
      '<p class="small">' + (tr.sent === 0 ? '預けなかったので、種かぶは10個のまま。' : mine1 > game.endow ? '信じて預けたぶん、得をした！' : mine1 === game.endow ? 'ちょうど元どおり。' : '信じたけれど、損をしてしまった…') + '</p>' +
      '<h3 class="title-l" style="margin-top:16px">② あなたが名人のとき</h3>' +
      '<p>' + (iv.bot ? '代役' : '相手') + 'は <b>' + x2 + '個</b> 預けてきた → 収穫 <b>' + h2 + '個</b>。あなたは <b>' + tr.ret + '%</b>（' + b2 + '個）を返した。</p>' +
      '<div class="scorebox"><div>あなたの手もと<b>' + (h2 - b2) + '個</b></div><div>相手の最後の手もち<b>' + (game.endow - x2 + b2) + '個</b></div></div>' +
      afterLinks() + '</div>');
  }

  /* ======================== 繰り返し囚人のジレンマ ======================== */
  var ipd;
  function ipdStart() {
    ipd = { r: 1, rounds: [], myTotal: 0, opTotal: 0, reasons: { first: '', switches: [], final: '' } };
    ipdRound();
  }
  function botMove() {
    if (ipd.r === 1) return 'K';
    var last = ipd.rounds[ipd.rounds.length - 1].me;
    if (last === 'K') return 'K';
    if (ctx.bot === 'gtft' && Math.random() < 1 / 3) return 'K';
    return 'S';
  }
  function historyHTML() {
    if (!ipd.rounds.length) return '<p class="small muted">まだ記録はありません。</p>';
    return '<div class="history">' + ipd.rounds.map(function (x) {
      return '<div class="h"><div>' + x.r + '週</div><div class="' + (x.me === 'K' ? 'k' : 's') + '">' + (x.me === 'K' ? '据' : '下') + '</div><div class="' + (x.opp === 'K' ? 'k' : 's') + '">' + (x.opp === 'K' ? '据' : '下') + '</div></div>';
    }).join('') + '</div><p class="small muted" style="margin:0">上段：あなた　下段：ゲンさん（据＝据え置き、下＝値下げ）</p>';
  }
  function ipdRound() {
    var prev = ipd.rounds.length ? ipd.rounds[ipd.rounds.length - 1].me : null;
    var st = { choice: '' };
    var wk = game.known ? '第' + ipd.r + '週 <span class="small muted">/ 全' + ctx.rounds + '週</span>' : '第' + ipd.r + '週 <span class="small muted">/ ？週</span>';
    var last = ipd.rounds[ipd.rounds.length - 1];
    var art = window.ART.svg(window.ART.P.sky('#ffe0b8', '#fff6e6') + window.ART.P.floor(196, '#b8a58a') +
      window.ART.P.shop(100, 186, '麺屋あい', '#e2564f', { s: 0.85, sale: last && last.me === 'S', price: last && last.me === 'S' ? '600円' : '800円' }) +
      window.ART.P.shop(300, 186, 'ゲン屋', '#2f4b7c', { s: 0.85, sale: last && last.opp === 'S', price: last && last.opp === 'S' ? '600円' : '800円' }) +
      (game.known ? window.ART.P.calendar(200, 60, String(ctx.rounds - ipd.r + 1), 'あと') : window.ART.P.calendar(200, 60, String(ipd.r), 'WEEK')) +
      (game.known && ipd.r === ctx.rounds ? window.ART.caption(200, 228, '最終週！', { fs: 18, fill: '#e2564f' }) : ''));
    show('<div class="panel"><div class="weekbar"><span class="wk">' + wk + '</span><span class="kicker">開店前の月曜日</span></div>' + art +
      '<div class="totals" style="margin-top:10px"><div><span>あなた（麺屋あい）</span><b>' + ipd.myTotal + '万円</b></div><div><span>ゲン屋</span><b>' + ipd.opTotal + '万円</b></div></div>' +
      historyHTML() +
      '<details><summary class="small">1週間の利益表</summary>' + matrixHTMLipd() + '</details>' +
      '<div class="qtitle"><span class="n">' + ipd.r + '</span>今週の値段は？</div>' + choiceCards('act') +
      '<div id="rbox"></div>' +
      '<div class="btnrow end"><button class="btn primary big" id="go" disabled>この値段で開店！</button></div></div>');
    var needReason = function () { return ipd.r === 1 || (prev && st.choice && st.choice !== prev); };
    var check = function () { U.$('go').disabled = !(st.choice && (!needReason() || okReason('reason'))); };
    bindChoice('act', function (a) {
      st.choice = a;
      var box = U.$('rbox');
      if (needReason()) {
        if (!U.$('reason')) { box.innerHTML = reasonBox('reason', ipd.r === 1 ? game.reasonQFirst : game.reasonQSwitch); bindCounter('reason', check); }
      } else box.innerHTML = '';
      check();
    });
    U.$('go').onclick = function () {
      var me = st.choice, op = botMove();
      if (needReason()) {
        var t = U.$('reason').value.trim();
        if (ipd.r === 1) ipd.reasons.first = t; else ipd.reasons.switches.push({ r: ipd.r, to: me, text: t });
      }
      var p = game.pay(me, op);
      ipd.rounds.push({ r: ipd.r, me: me, opp: op, my: p[0], op: p[1] });
      ipd.myTotal += p[0]; ipd.opTotal += p[1];
      ipdWeekResult();
    };
  }
  function ipdWeekResult() {
    var x = ipd.rounds[ipd.rounds.length - 1];
    var A = window.GT_GAMES[gid].actions;
    var msg = {
      KK: 'どちらも据え置き。お客さんはいつもどおり半分ずつ。', KS: 'ゲンさんが値下げ！ お客さんが向かいに流れてしまった。',
      SK: 'あなたの値下げが大当たり。お客さんがどっと押し寄せた！', SS: 'どちらも値下げ。お客さんは変わらず、利益だけが削れた。'
    }[x.me + x.opp];
    var finished = ipd.r >= ctx.rounds;
    show('<div class="panel"><div class="weekbar"><span class="wk">第' + x.r + '週の結果</span></div>' +
      '<div class="reveal"><div class="rcard static"><div class="inner"><div class="face back"><span class="who">あなた</span><span class="act">' + A[x.me].icon + ' ' + A[x.me].label + '</span></div></div></div>' +
      '<div class="vs">VS</div><div class="rcard" id="flip"><div class="inner"><div class="face front">？</div><div class="face back"><span class="who">ゲンさん</span><span class="act">' + A[x.opp].icon + ' ' + A[x.opp].label + '</span></div></div></div></div>' +
      '<div id="after" style="opacity:0;transition:opacity .5s"><p class="center">' + msg + '</p>' +
      '<div class="scorebox"><div>今週のあなた<b>+' + x.my + '万円</b></div><div>今週のゲンさん<b>+' + x.op + '万円</b></div></div>' +
      '<div class="btnrow end"><button class="btn primary big" id="next">' + (finished ? (game.known ? '最終週の営業終了 ▶' : '翌朝… ▶') : '次の週へ ▶') + '</button></div></div></div>');
    setTimeout(function () { U.$('flip').classList.add('flipped'); }, 350);
    setTimeout(function () { U.$('after').style.opacity = 1; }, 950);
    U.$('next').onclick = function () {
      if (finished) ipdEnd(); else { ipd.r++; ipdRound(); }
    };
  }
  function ipdEnd() {
    var P = window.ART.P, CH = window.GT_CHARS;
    var art = window.ART.svg(P.sky('#c9b8a4', '#efe3d2') + P.floor(196, '#b8a58a') + P.crane(250, 196) +
      CH.CHEF_ME({ x: 110, y: 120, s: 0.8, expr: ipd.myTotal >= ipd.opTotal ? 'happy' : 'sad' }) + CH.GEN({ x: 300, y: 124, s: 0.7, expr: ipd.opTotal > ipd.myTotal ? 'smug' : 'worried', flip: true }) +
      window.ART.caption(200, 36, game.known ? '閉店の日' : '突然の取り壊し通知', { fs: 20 }));
    show('<div class="panel"><span class="kicker">営業終了</span>' + art +
      '<p class="narr">' + sentences(game.known
        ? '予定どおり' + ctx.rounds + '週が終わり、商店街は取り壊されることになった。ゲンさんがのれんを下ろしながら、こちらを見ている。'
        : '第' + ctx.rounds + '週の営業を終えた夜、突然「<b>来週から取り壊し工事</b>」の通知が届いた。勝負は、ここで終わりだ。') + '</p>' +
      '<div class="totals"><div><span>あなたの総利益</span><b>' + ipd.myTotal + '万円</b></div><div><span>ゲンさんの総利益</span><b>' + ipd.opTotal + '万円</b></div></div>' +
      historyHTML() +
      '<div class="qtitle"><span class="n">!</span>ふりかえり</div>' + reasonBox('reason', game.reasonQFinal) +
      '<div class="btnrow end"><button class="btn primary big" id="submit" disabled>記録を提出する</button></div></div>');
    bindCounter('reason', function () { U.$('submit').disabled = !okReason('reason'); });
    U.$('submit').onclick = function () {
      ipd.reasons.final = U.$('reason').value.trim();
      var n = ipd.rounds.length, coop = ipd.rounds.filter(function (x) { return x.me === 'K'; }).length;
      var parts = ['【1週目の判断】' + ipd.reasons.first];
      ipd.reasons.switches.forEach(function (s) { parts.push('【' + s.r + '週目に「' + game.actions[s.to].label + '」へ変更】' + s.text); });
      parts.push('【全体のふりかえり】' + ipd.reasons.final);
      var row = baseRow({
        role: '', choice: (coop / n).toFixed(2), choiceLabel: '協力率 ' + Math.round(coop / n * 100) + '%（最終週：' + game.actions[ipd.rounds[n - 1].me].label + '）',
        expect: '', expectLabel: '', reason: parts.join('\n'),
        detail: { condition: game.known ? 'known' : 'unknown', totalRounds: n, bot: ctx.bot, rounds: ipd.rounds, total: ipd.myTotal, oppTotal: ipd.opTotal, reasons: ipd.reasons, assign: ctx.ipdAuto ? 'auto' : 'url' }
      });
      send([row], function () {
        ipdMarkDone(ctx.sid, gid);
        var other = gid === 'ipd_known' ? 'ipd_unknown' : 'ipd_known';
        var remain = ipdDone(ctx.sid).indexOf(other) < 0;
        show('<div class="panel"><span class="kicker">提出しました</span><h2 class="title-l">おつかれさまでした！</h2>' +
          '<p>あなたの協力率は <b>' + Math.round(coop / n * 100) + '%</b>、総利益は <b>' + ipd.myTotal + '万円</b>でした。' +
          '（ふたりがずっと据え置きなら、' + (30 * n) + '万円ずつでした）</p>' +
          (remain
            ? '<p class="note">繰り返しの勝負は、条件を変えて<b>もう1本</b>あります。ゲンさんの作戦は、2本とも終わってから明かします。</p>' +
              '<div class="btnrow end"><a class="btn primary big" href="?game=' + (ctx.ipdAuto ? 'ipd' : other) + '">つづけて、もう1本の勝負へ ▶</a></div>'
            : '<p class="small muted">ゲンさんの作戦：' + (ctx.bot === 'gtft' ? '寛容なしっぺ返し（あなたの前の週の手をまねる。値下げされても、ときどき許す）' : 'しっぺ返し（最初は据え置き、あとはあなたの前の週の手をまねる）') + '</p>' +
              afterLinks()) + '</div>');
      });
    };
  }
})();
