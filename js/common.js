/* ============================================================
 * 共通：通信（Apps Script / デモ）、ユーティリティ
 * ============================================================ */
(function () {
  var CFG = window.GT_CONFIG || {};

  var U = {
    $: function (id) { return document.getElementById(id); },
    qs: function (k) { return new URLSearchParams(location.search).get(k); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    sleep: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
    uid: function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
    hash: function (s) {
      var h = 0x811c9dc5;
      s = String(s);
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
      return ('0000000' + h.toString(16)).slice(-8);
    },
    /** 文字列から決まる0/1（学籍番号での振り分け用）。上位ビットまでよく混ぜてから使う */
    coin: function (s) {
      var h = parseInt(U.hash(s), 16);
      h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
      return (h >>> 31) === 0;
    },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
    pct: function (x) { return isFinite(x) ? Math.round(x * 100) + '%' : '—'; },
    fmtTime: function (ts) { var d = new Date(ts); return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); },
    /** 同じ人・同じゲーム・同じ役の回答は最新の1件だけ残す */
    latest: function (rows) {
      var m = {};
      rows.forEach(function (r) {
        var k = r.game + '|' + (r.role || '') + '|' + r.pid;
        if (!m[k] || String(r.ts) > String(m[k].ts)) m[k] = r;
      });
      return Object.keys(m).map(function (k) { return m[k]; });
    },
    labelOf: function (r) { return r.teacherLabel || r.aiPrimary || ''; }
  };

  /* ---------------- 課題の開放 ---------------- */
  var GATES = [['pd', '囚人のジレンマ'], ['bos', '男女の争い'], ['stag', '鹿狩りゲーム'], ['chicken', 'チキンゲーム'],
    ['volunteer', 'ボランティアのジレンマ'], ['ultimatum', '最後通牒ゲーム'], ['dictator', '独裁者ゲーム'], ['trust', '信頼ゲーム'], ['ipd', '繰り返し囚人のジレンマ（2条件とも）'], ['nashquiz', 'ナッシュ均衡の課題（quiz.html）']];
  function gateKey(game) { return /^ipd/.test(String(game)) ? 'ipd' : String(game); }

  /* ---------------- 通信 ---------------- */
  var API = {
    demo: !CFG.GAS_URL,
    demoCall: function (body) {
      return new Promise(function (ok, ng) {
        var j = Demo.handle(body);
        if (j && j.ok === false) ng(new Error(j.error || 'エラー')); else ok(j);
      });
    },
    post: function (body) {
      if (API.demo) return API.demoCall(body);
      return fetch(CFG.GAS_URL, { method: 'POST', body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || 'サーバーエラー'); return j; });
    },
    get: function (params) {
      if (API.demo) return API.demoCall(params);
      var q = new URLSearchParams(params).toString();
      return fetch(CFG.GAS_URL + '?' + q)
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || 'サーバーエラー'); return j; });
    }
  };

  /* ---------------- デモ（このブラウザ内だけで動く擬似サーバー） ---------------- */
  var DEMO_KEY = 'gt_demo_rows_v3';
  var OPEN_KEY = 'gt_demo_open_v1';
  var Demo = {
    password: 'demo',
    /** デモでは最初は全部開放（先生モードで閉じて動きを確かめられる） */
    open: function () {
      try { var v = localStorage.getItem(OPEN_KEY); if (v) return JSON.parse(v); } catch (e) { }
      return GATES.map(function (g) { return g[0]; });
    },
    load: function () {
      var rows = null;
      try { rows = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { rows = null; }
      if (!rows) { if (!window.GT_GAMES) return []; rows = Demo.sample(); Demo.save(rows); } // ゲーム定義のないページ（課題）ではサンプルを作らない
      return rows;
    },
    save: function (rows) {
      // サンプル未作成のまま課題ページで保存する場合は、サンプルを後で足せるように印をつけない
      try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); } catch (e) { }
    },
    reset: function () { try { localStorage.removeItem(DEMO_KEY); } catch (e) { } },
    pub: function (r, teacher) {
      var o = Object.assign({}, r);
      if (!teacher) delete o.studentId;
      return o;
    },
    handle: function (b) {
      var action = b.action;
      if (action === 'status') return { ok: true, open: Demo.open() };
      var rows = Demo.load();
      if (action === 'status') return { ok: true, open: Demo.open() };
      if (action === 'submit') {
        var op = Demo.open();
        var closed = (b.rows || []).filter(function (r) { return op.indexOf(gateKey(r.game)) < 0; });
        if (closed.length) return { ok: false, error: 'この課題はいま受け付けていません（先生が開放するまで待ってください）' };
        var out = [], partners = [];
        (b.rows || []).forEach(function (r) {
          var nr = Object.assign({}, r, { id: U.uid(), ts: new Date().toISOString(), pid: U.hash(r.studentId) });
          nr.detail = Object.assign({}, r.detail || {});
          if (r.game === 'nashquiz') nr.detail.attempt = rows.filter(function (x) { return x.pid === nr.pid && x.game === 'nashquiz'; }).length + 1;
          if (/^ipd_/.test(r.game)) {
            var prev = rows.filter(function (x) { return x.pid === nr.pid && /^ipd_/.test(x.game); });
            nr.detail.priorIPD = prev.length > 0;
            nr.detail.priorOther = prev.some(function (x) { return x.game !== r.game; });
          }
          delete nr.match;
          partners.push(Demo.match(rows, nr, r.match));
          out.push(nr);
        });
        rows = rows.concat(out); Demo.save(rows);
        return { ok: true, ids: out.map(function (r) { return r.id; }), partners: partners };
      }
      if (action === 'results') {
        return { ok: true, rows: rows.filter(function (r) { return !b.game || r.game === b.game || (b.game === 'ipd' && /^ipd/.test(r.game)); }).map(function (r) { return Demo.pub(r); }) };
      }
      if (b.password !== Demo.password) return { ok: false, error: 'パスワードが違います（デモでは demo）' };
      if (action === 'teacherRows') return { ok: true, rows: rows.map(function (r) { return Demo.pub(r, true); }) };
      if (action === 'classify') {
        var todo = rows.filter(function (r) { return !r.aiPrimary && (!b.game || r.game === b.game); });
        var n = Math.min(todo.length, b.limit || 10);
        for (var i = 0; i < n; i++) Object.assign(todo[i], Demo.fakeClassify(todo[i]));
        Demo.save(rows);
        return { ok: true, done: n, remaining: todo.length - n, errors: [] };
      }
      if (action === 'relabel') {
        rows.forEach(function (r) { if (r.id === b.id) { r.teacherLabel = b.label || ''; } });
        Demo.save(rows);
        return { ok: true };
      }
      if (action === 'reset') { Demo.reset(); try { localStorage.removeItem(OPEN_KEY); } catch (e) { } return { ok: true }; }
      if (action === 'setOpen') {
        var cur = Demo.open();
        if (b.all === true) cur = GATES.map(function (g) { return g[0]; });
        else if (b.all === false) cur = [];
        else { cur = cur.filter(function (k) { return k !== gateKey(b.key); }); if (b.open) cur.push(gateKey(b.key)); }
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(cur)); } catch (e) { }
        return { ok: true, open: cur };
      }
      return { ok: false, error: 'unknown action' };
    },
    match: function (rows, me, m) {
      if (!m) return [];
      var pool = rows.filter(function (r) { return r.game === me.game && r.pid !== me.pid && (!m.role || r.role === m.role); });
      pool = U.latest(pool);
      if (pool.length < Math.max(1, +m.min || 1)) return [];
      return U.shuffle(pool).slice(0, m.k || 1).map(function (r) { return { choice: r.choice, detail: r.detail, role: r.role }; });
    },
    fakeClassify: function (r) {
      var t = r.reason || '';
      var f = {
        rational: /得|点|年|確率|最大|期待|合理|損|計算|どちらを選んでも|戦略|利益|万円|ゴールド|安全|確実|リスク/.test(t),
        emotional: /怖|こわ|不安|嫌|いや|好き|かわいそう|怒|気分|ムカ|悲|楽しい|寂し|さみし|気持ち/.test(t),
        normative: /信じ|信頼|裏切りたくない|裏切れない|公平|平等|半分|約束|道徳|正直|友|仲間|相棒|ずるい/.test(t),
        bias: /みんな結局|普通は|自分なら|絶対|なんとなく|いつも|今まで/.test(t) || (/誰か/.test(t) && /だろう|はず/.test(t) && !/確率|可能性|リスク/.test(t))
      };
      var prim = t.length < 8 ? 'unclear' : (f.normative ? 'normative' : f.rational ? 'rational' : f.emotional ? 'emotional' : f.bias ? 'bias' : 'unclear');
      if (f.bias && !f.rational && !f.normative) prim = 'bias';
      var why = {
        rational: '利得や相手の出方を比べて判断している（デモ用の簡易判定）。',
        emotional: '感情的な言葉が判断の根拠になっている（デモ用の簡易判定）。',
        normative: '信頼や公平さなどの規範を根拠にしている（デモ用の簡易判定）。',
        bias: '「誰かがやる」「みんなそうする」などの思い込みが見られる（デモ用の簡易判定）。',
        unclear: '理由が短く判断できない（デモ用の簡易判定）。'
      };
      var flags = Object.keys(f).filter(function (k) { return f[k]; });
      var detail = {};
      ['rational', 'emotional', 'normative'].forEach(function (k) { detail[k] = { yes: f[k], why: f[k] ? why[k] : '' }; });
      detail.bias = { yes: f.bias, name: f.bias ? (/誰か/.test(t) ? '責任の分散' : 'フォールス・コンセンサス') : '', why: f.bias ? why.bias : '' };
      return { aiPrimary: prim, aiFlags: flags.join(','), aiBias: detail.bias.name, aiReason: why[prim], aiDetail: detail, aiModel: 'demo-keyword', aiAt: new Date().toISOString() };
    },
    /** サンプルデータ（デモで結果ページが空にならないように） */
    sample: function () {
      var rows = [], seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      function pickr(a) { return a[Math.floor(rnd() * a.length)]; }
      var NICK = ['もち', 'たこやき', 'ねこ丸', 'ソラ', 'ぽん', 'みかん', 'かぼす', 'ユウ', 'くろまめ', 'しずく', 'てんてん', 'あんず', 'ハチ', 'こむぎ', 'リク', 'うに', 'さくら', 'ジン', 'なぎ', 'ちくわ', 'ゆず', 'モモ', 'たま', 'レオ'];
      var R = {
        pd: {
          C: ['相棒を信じたい。ポン太が裏切るとは思えないし、裏切ったら一生後悔しそう。', 'ふたりとも黙れば合計2年で一番得。相棒も同じように考えるはず。', '裏切るのはずるいと思った。仲間なので。'],
          D: ['相手がどちらを選んでも、自白したほうが刑期が短いから。', '10年はこわすぎる。ポン太が自白するリスクがあるなら先に言う。', 'みんな結局自分がかわいいので、相手もきっと自白すると思った。']
        },
        bos: {
          F: ['自分の好きなフェスに行けば、ハルも合わせてくれる気がした。', 'ハルは優しいので、きっとこっちに来てくれると思う。', '好きな方に行くほうが、会えなかったときのダメージが少ない。'],
          M: ['ハルの好きな方に行けば確実に会えると思った。', '相手に合わせるのが友情だと思う。', 'ひとりぼっちが一番いやなので、相手に寄せた。']
        },
        stag: {
          S: ['ふたりで鹿を獲れば一番大きい。ゴンも同じことを考えると思う。', '相棒を裏切りたくない。約束した持ち場は守る。', 'ゴンを信じた。ウサギで妥協するのは楽しくない。'],
          H: ['ウサギなら確実に3点。0点になるリスクを取りたくなかった。', 'ゴンがウサギに目移りしそうで不安だった。', 'みんな目の前のものを取ると思うので。']
        },
        chicken: {
          G: ['相手がゆずると読んだ。引いたら負けな気がする。', '弱虫と言われるのは嫌だから突き進む。', '最初に強気に出たほうが得だと思う。'],
          Y: ['ふたりとも落ちるのが最悪なので、安全な方を選んだ。', '争うのは好きじゃない。ゆずって損することはあまりない。', '相手はきっと突き進んでくるので、ゆずるしかない。']
        },
        volunteer: {
          V: ['誰も行かなかったら全員0点。自分が行けば確実に7点。', '待っていてもイライラするので自分でやる。', 'みんなのためにやるべきだと思った。'],
          W: ['5人もいれば誰かがやるだろうと思った。', 'ゴキブリが本当にこわい。', '他の人がやる確率が高いので、待つほうが期待値が高い。']
        }
      };
      ['pd', 'bos', 'stag', 'chicken', 'volunteer'].forEach(function (gid) {
        var g = window.GT_GAMES[gid];
        var probs = { pd: 0.55, bos: 0.6, stag: 0.62, chicken: 0.4, volunteer: 0.35 };
        for (var i = 0; i < 22; i++) {
          var a = rnd() < probs[gid] ? g.order[0] : g.order[1];
          var role = g.roles ? (i % 2 ? 'B' : 'A') : '';
          if (gid === 'bos') a = rnd() < 0.6 ? (role === 'A' ? 'F' : 'M') : (role === 'A' ? 'M' : 'F');
          var ex = gid === 'volunteer' ? String(Math.floor(rnd() * 4)) : pickr(g.order);
          rows.push({
            id: 's' + gid + i, ts: new Date(Date.now() - 3600e3 + i * 60e3).toISOString(), game: gid, role: role,
            pid: U.hash('S' + gid + i), studentId: 'S' + (1000 + i), nickname: NICK[i % NICK.length], sample: true,
            choice: a, choiceLabel: g.actions[a].label,
            expect: ex, expectLabel: gid === 'volunteer' ? ex + '人' : g.actions[ex].label,
            reason: pickr(R[gid][a]), detail: {}
          });
        }
      });
      var UR = ['半々がいちばん公平だと思う。', '少なすぎると断られそうなので多めに渡す。', '相手は0より何かもらえる方がいいはずなので少なめでいい。', 'あまり低いとむかつくので断ると思う。'];
      for (var j = 0; j < 22; j++) {
        var off = [500, 500, 500, 400, 400, 300, 200, 100, 450, 350][Math.floor(rnd() * 10)];
        var mao = [0, 100, 200, 300, 300, 400, 500, 100, 250][Math.floor(rnd() * 9)];
        var pidU = U.hash('Sult' + j);
        rows.push({ id: 'sup' + j, ts: new Date(Date.now() - 3000e3 + j * 60e3).toISOString(), game: 'ultimatum', role: 'proposer', pid: pidU, studentId: 'S' + (2000 + j), nickname: NICK[j % NICK.length], sample: true, choice: String(off), choiceLabel: '相手に' + off + 'G渡す', expect: '', expectLabel: '', reason: pickr(UR.slice(0, 3)), detail: {} });
        rows.push({ id: 'sur' + j, ts: new Date(Date.now() - 3000e3 + j * 60e3).toISOString(), game: 'ultimatum', role: 'responder', pid: pidU, studentId: 'S' + (2000 + j), nickname: NICK[j % NICK.length], sample: true, choice: String(mao), choiceLabel: mao + 'G以上なら乗る', expect: '', expectLabel: '', reason: pickr([UR[3], '0よりはましなので、少しでももらえれば乗る。', '不公平な提案はおかしいので、それなりにないと断る。']), detail: {} });
      }
      // 独裁者・信頼（デモ用の架空のサンプル）
      var DR = ['断られる心配がないので、自分が多めにもらう。', '半分ずつが公平だと思う。', '知らない人だけど、0円はさすがに気が引ける。', 'たまたま回したのが自分なだけなので、相手にも少しは渡したい。'];
      var TI = ['名人は半分くらい返してくれると思うので、預けたほうが得。', '返ってこないリスクがあるので、少しだけ預ける。', '人を信じたいので全部預けた。'];
      var TT = ['預けてくれた信頼に応えたいので半分返す。', '返しても自分の得にならないので少なめ。', '相手が損をしないように、預けた分より多く返したい。'];
      var ex;
      for (var q = 0; q < 22; q++) {
        var give = [0, 0, 100, 200, 200, 300, 300, 400, 500, 500, 500][Math.floor(rnd() * 11)];
        var pidD = U.hash('Sult' + q); // 最後通牒のサンプルと同じ人にして、両方の比較ができるように
        rows.push({ id: 'sdi' + q, ts: new Date(Date.now() - 1800e3 + q * 60e3).toISOString(), game: 'dictator', role: 'dictator', pid: pidD, studentId: 'S' + (2000 + q), nickname: NICK[q % NICK.length], sample: true, choice: String(give), choiceLabel: '相手に' + give + '円渡す', expect: (ex = String([100, 200, 300, 300, 400][Math.floor(rnd() * 5)])), expectLabel: 'ほかの人の平均は' + ex + '円', reason: give === 0 ? DR[0] : give === 500 ? DR[1] : pickr(DR.slice(2)), detail: { total: 1000 } });
        var sent = [0, 2, 3, 5, 5, 6, 8, 10, 10][Math.floor(rnd() * 9)], ret = [0, 10, 20, 30, 40, 50, 50, 60][Math.floor(rnd() * 8)];
        rows.push({ id: 'sti' + q, ts: new Date(Date.now() - 1700e3 + q * 60e3).toISOString(), game: 'trust', role: 'investor', pid: pidD, studentId: 'S' + (2000 + q), nickname: NICK[q % NICK.length], sample: true, choice: String(sent), choiceLabel: sent + '個預ける', expect: (ex = String([20, 30, 40, 50, 50][Math.floor(rnd() * 5)])), expectLabel: '名人は' + ex + '%返すと予想', reason: sent >= 8 ? TI[2] : sent >= 5 ? TI[0] : TI[1], detail: { endow: 10, mult: 3 } });
        rows.push({ id: 'stt' + q, ts: new Date(Date.now() - 1700e3 + q * 60e3).toISOString(), game: 'trust', role: 'trustee', pid: pidD, studentId: 'S' + (2000 + q), nickname: NICK[q % NICK.length], sample: true, choice: String(ret), choiceLabel: '収穫の' + ret + '%を返す', expect: '', expectLabel: '', reason: ret >= 50 ? TT[0] : ret <= 20 ? TT[1] : TT[2], detail: { endow: 10, mult: 3 } });
      }
      [['ipd_known', 10], ['ipd_unknown', 0]].forEach(function (pair) {
        var gid = pair[0];
        for (var k = 0; k < 16; k++) {
          var n = pair[1] || (8 + Math.floor(rnd() * 5));
          var rounds = [], prev = 'K', coop = 0, total = 0;
          var endDefect = gid === 'ipd_known' ? (rnd() < 0.55 ? (rnd() < 0.5 ? 1 : 2) : 0) : (rnd() < 0.12 ? 1 : 0);
          for (var r = 1; r <= n; r++) {
            var me = r > n - endDefect ? 'S' : (rnd() < 0.12 ? 'S' : 'K');
            var opp = r === 1 ? 'K' : prev;
            var p = window.GT_GAMES[gid].pay(me, opp);
            rounds.push({ r: r, me: me, opp: opp, my: p[0], op: p[1] });
            if (me === 'K') coop++;
            total += p[0]; prev = me;
          }
          rows.push({
            id: 's' + gid + k, ts: new Date(Date.now() - 2000e3 + k * 60e3).toISOString(), game: gid, role: '',
            pid: U.hash('S' + gid + k), studentId: 'S' + (3000 + k), nickname: NICK[k % NICK.length], sample: true,
            choice: (coop / n).toFixed(2), choiceLabel: '協力率 ' + Math.round(coop / n * 100) + '%', expect: '', expectLabel: '',
            reason: endDefect ? '基本は据え置きでゲンさんと協力。でも最後の週はもう仕返しされないので値下げした。' : pickr(['ずっと据え置けばお互い30万円ずつで一番いいと思った。', 'ゲンさんはまねしてくるので、裏切るとこっちも損をする。', 'いつ終わるかわからないので、協力を続けたほうが得だと思った。']),
            detail: { condition: gid === 'ipd_known' ? 'known' : 'unknown', totalRounds: n, bot: 'tft', rounds: rounds, total: total, priorIPD: k % 2 === 1, priorOther: k % 2 === 1 }
          });
        }
      });
      rows.forEach(function (r) { Object.assign(r, Demo.fakeClassify(r)); });
      return rows;
    }
  };

  /** 課題の開閉を見張る。
   *  needed() が true の間だけ一定間隔で問い合わせ、状態が変わったら onChange(open, prev) を呼ぶ。
   *  画面が隠れている間は止め、戻ってきたらすぐ確認する（サーバーの負担を抑えるため）。 */
  function watchOpen(o) {
    var sec = Math.max(5, +CFG.STATUS_POLL_SEC || 10), last = null, timer = null, busy = false, stopped = false;
    function needed() { return !stopped && (!o.needed || o.needed()); }
    function schedule() { clearTimeout(timer); if (needed()) timer = setTimeout(function () { tick(false); }, sec * 1000 * (o.slow && o.slow() ? 4 : 1) * (0.85 + Math.random() * 0.3)); }
    function tick(force) {
      if (busy || !needed()) return;
      if (document.hidden && !force) return schedule();
      busy = true;
      API.get({ action: 'status' }).then(function (j) {
        var open = (j.open || []).slice(), key = open.slice().sort().join(',');
        if (o.onTick) o.onTick(open, true);
        if (key !== last) { var prev = last === null ? null : last.split(',').filter(Boolean); last = key; if (prev !== null || o.fireFirst) o.onChange(open, prev || []); }
      }).catch(function () { if (o.onTick) o.onTick(null, false); }).then(function () { busy = false; schedule(); });
    }
    function wake() { if (!document.hidden) tick(true); }
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);
    return {
      start: function (initial) { if (initial) last = initial.slice().sort().join(','); schedule(); return this; },
      check: function () { tick(true); },
      stop: function () { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake); window.removeEventListener('online', wake); }
    };
  }
  /** 画面下に出る短いお知らせ */
  function toast(msg) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 4200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4800);
  }

  /** ヘッダーに授業名を入れる（全ページ共通） */
  function course() {
    var el = document.getElementById('course');
    if (el && CFG.COURSE_LABEL) {
      // 全角スペースで区切った単位では改行しない（スマホで「授／業課題」のように割れないように）
      el.innerHTML = String(CFG.COURSE_LABEL).split('　').map(function (t) { return '<span>' + U.esc(t) + '</span>'; }).join(' ');
      el.classList.remove('hidden');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', course); else course();

  window.GT = { U: U, API: API, Demo: Demo, CFG: CFG, GATES: GATES, gateKey: gateKey, watchOpen: watchOpen, toast: toast };
})();
