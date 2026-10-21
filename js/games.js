/* ============================================================
 * ゲームの定義（物語・利得・選択肢）
 * 文言や利得を変えたいときはこのファイルを編集します。
 * ============================================================ */
(function () {
  var A = window.ART, C = A.critter, B = A.bubble, P = A.P, S = A.svg, T = A.caption;

  /* ---------- 共通のキャラクター ---------- */
  var MIKE = function (o) { return C(Object.assign({ kind: 'cat', color: '#f4a261', hat: 'mask' }, o)); };
  var PONTA = function (o) { return C(Object.assign({ kind: 'tanuki', color: '#a9825a', hat: 'mask' }, o)); };
  var DETECTIVE = function (o) { return C(Object.assign({ kind: 'human', hat: 'fedora', bodyColor: '#8c7b6b', hair: '#2b2622' }, o)); };
  var KORO = function (o) { return C(Object.assign({ kind: 'dog', color: '#f0d6a8' }, o)); };
  var HARU = function (o) { return C(Object.assign({ kind: 'rabbit', color: '#fbe3ea', hat: 'ribbon' }, o)); };
  var KUMAKICHI = function (o) { return C(Object.assign({ kind: 'bear', color: '#a8774f', hat: 'hunter' }, o)); };
  var GON = function (o) { return C(Object.assign({ kind: 'dog', color: '#d9a066', hat: 'hunter' }, o)); };
  var YUKI = function (o) { return C(Object.assign({ kind: 'goat', color: '#ffffff' }, o)); };
  var MEETA = function (o) { return C(Object.assign({ kind: 'goat', color: '#c9b79a' }, o)); };
  var PIRATE_ME = function (o) { return C(Object.assign({ kind: 'cat', color: '#9aa7b5', hat: 'bandana' }, o)); };
  var PIRATE_YOU = function (o) { return C(Object.assign({ kind: 'tanuki', color: '#a9825a', hat: 'bandana' }, o)); };
  var CHEF_ME = function (o) { return C(Object.assign({ kind: 'human', hat: 'chef', bodyColor: '#ffffff', hair: '#3a2e28' }, o)); };
  var GEN = function (o) { return C(Object.assign({ kind: 'bear', color: '#7a5a3a', hat: 'towel', bodyColor: '#3b4a6b' }, o)); };

  var GAMES = {};
  /* 鹿の価値（config.js の STAG_VALUE）。ウサギは常に3。6でリスクの比較がちょうど拮抗、6未満はウサギ寄り */
  function stagV() { var v = +((window.GT_CONFIG || {}).STAG_VALUE); return v > 3 ? v : 6; }

  /* ========================================================
   * 1. 囚人のジレンマ（一回限り）
   * ======================================================== */
  GAMES.pd = {
    id: 'pd', kind: '2x2', no: 1,
    title: '囚人のジレンマ', story_title: '怪盗ミケ、取調室にて',
    tagline: '相棒を信じて黙るか、先に口を割るか。',
    color: '#e2564f',
    me: 'ミケ', opp: 'ポン太',
    hero: function () {
      return S(P.sky('#2c3466', '#4a3f6b') + P.stars(12) + P.moon(340, 40) + P.floor(190, '#3b3550') +
        PONTA({ x: 140, y: 130, s: 0.9, expr: 'smug' }) + MIKE({ x: 250, y: 120, s: 1, expr: 'happy', flip: true }) +
        P.chikuwa(200, 205, 0.9) + T(200, 36, '怪盗ミケ、取調室にて', { fs: 22, fill: '#fff6c7' }));
    },
    story: [
      function () {
        return {
          art: S(P.sky('#2c3466', '#4a3f6b') + P.stars(14) + P.moon(60, 40) + P.floor(196, '#3b3550') +
            MIKE({ x: 150, y: 120, expr: 'happy', arms: 'up' }) + PONTA({ x: 260, y: 128, s: 0.95, expr: 'smug', flip: true }) +
            P.chikuwa(205, 70, 1.1) + T(205, 30, 'ねらうは「黄金のちくわ」！', { fs: 17, fill: '#fff6c7' })),
          text: '真夜中の美術館。怪盗コンビの<b>ネコのミケ</b>（あなた）と<b>タヌキのポン太</b>は、展示品「黄金のちくわ」に手をのばした――そのとき。'
        };
      },
      function () {
        return {
          art: S(P.sky('#3b3550', '#2c2840') + P.siren(80, 60) + P.siren(320, 60) +
            MIKE({ x: 150, y: 130, expr: 'shock' }) + PONTA({ x: 250, y: 134, s: 0.95, expr: 'shock', flip: true }) +
            P.bars(40, 20, 320, 210) + T(200, 30, 'ウゥゥ〜〜！', { fs: 24, fill: '#ffd166', rotate: -4 })),
          text: 'サイレンが鳴りひびき、ふたりはあっさり御用。証拠は「ちくわのにおい」だけ。警察は<b>自白</b>がほしい。'
        };
      },
      function () {
        return {
          art: S('<rect width="200" height="240" fill="#4b4560"/><rect x="200" width="200" height="240" fill="#55506b"/>' + P.wall(200) +
            P.lamp(100, 50) + P.lamp(300, 50) + P.table(40, 170, 120) + P.table(240, 170, 120) +
            MIKE({ x: 100, y: 120, s: 0.85, expr: 'worried' }) + PONTA({ x: 300, y: 124, s: 0.85, expr: 'worried' }) +
            B(14, 12, '取調室A', { fs: 12, w: 70, noTail: true }) + B(316, 12, '取調室B', { fs: 12, w: 70, noTail: true })),
          text: 'ふたりは<b>別々の取調室</b>へ。壁の向こうで相棒がどうしているかは、まったくわからない。相談もできない。'
        };
      },
      function () {
        return {
          art: S('<rect width="400" height="240" fill="#4b4560"/>' + P.lamp(200, 40) + P.table(110, 175, 180) +
            DETECTIVE({ x: 270, y: 118, expr: 'smug', flip: true }) + MIKE({ x: 130, y: 128, s: 0.9, expr: 'think' }) +
            B(170, 12, 'ポン太より先にしゃべれば\nおまえだけは無罪にしてやる', { fs: 13, to: [255, 90] })),
          text: '刑事がささやく。「相棒より先に<b>自白</b>すれば、おまえは<b>無罪</b>。相棒は懲役10年だ。…ただし、ふたりとも自白したら仲よく5年だがな」'
        };
      },
      function () {
        return {
          art: S('<rect width="400" height="240" fill="#4b4560"/>' + P.wall(200) +
            MIKE({ x: 100, y: 120, s: 0.9, expr: 'think' }) + PONTA({ x: 300, y: 120, s: 0.9, expr: 'think' }) +
            B(30, 14, '黙ってれば\nふたりとも1年…', { fs: 13, think: true, to: [100, 92] }) + B(232, 14, 'ミケは\nしゃべるかな…？', { fs: 13, think: true, to: [300, 92] })),
          text: 'ふたりとも<b>黙秘</b>すれば、証拠不十分で懲役<b>1年</b>ずつ。ポン太にも同じ取引が持ちかけられている。さあ、ミケ（あなた）はどうする？'
        };
      }
    ],
    actions: {
      C: { label: '黙秘する', sub: '相棒を信じて口を閉ざす', icon: '🤐' },
      D: { label: '自白する', sub: '先にしゃべって助かりにいく', icon: '🗣️' }
    },
    order: ['C', 'D'],
    pay: function (m, o) { var t = { CC: [1, 1], CD: [10, 0], DC: [0, 10], DD: [5, 5] }; return t[m + o]; },
    better: 'low', unit: '年', fmt: function (v) { return v === 0 ? '無罪' : '懲役' + v + '年'; },
    expectQ: '相棒のポン太は、どうすると思いますか？',
    reasonQ: 'なぜその選択をしましたか？ 迷ったこと、相棒について考えたことも書いてください。',
    outcome: function (m, o) {
      var t = {
        CC: ['ふたりとも黙秘！', '証拠不十分で、ふたりとも懲役1年。出所の日、ふたりはちくわで乾杯した。', 'happy', 'happy'],
        CD: ['ポン太が裏切った…', 'ポン太は無罪放免、ミケは懲役10年。面会室のポン太は目をそらした。', 'sad', 'smug'],
        DC: ['先にしゃべった！', 'ミケは無罪、ポン太は懲役10年。自由の空気は、ちょっぴりちくわの味がした。', 'smug', 'sad'],
        DD: ['ふたりとも自白…', 'ふたりとも懲役5年。同じ房で「おまえもか」と顔を見合わせた。', 'worried', 'worried']
      }[m + o];
      return {
        title: t[0], text: t[1],
        art: S('<rect width="400" height="240" fill="#4b4560"/>' + (m === 'D' && o === 'C' ? P.sky('#bfe6ff', '#fff6e6') : '') +
          MIKE({ x: 130, y: 120, expr: t[2] }) + PONTA({ x: 270, y: 124, s: 0.95, expr: t[3], flip: true }) +
          (m + o === 'DD' || (m === 'C' && o === 'D') ? P.bars(70, 40, 120, 190) : '') +
          (m + o === 'DD' || (m === 'D' && o === 'C') ? P.bars(210, 40, 120, 190) : ''))
      };
    }
  };

  /* ========================================================
   * 2. 男女の争い（バトル・オブ・ザ・セクシーズ）
   * ======================================================== */
  function bosFav(role) { return role === 'A' ? 'F' : 'M'; }
  GAMES.bos = {
    id: 'bos', kind: '2x2', no: 2, roles: ['A', 'B'],
    title: '男女の争い', story_title: 'スマホの充電、0%',
    tagline: '行きたい場所はちがう。でも、ひとりぼっちはもっといや。',
    color: '#6c3fb1',
    me: 'コロ', opp: 'ハル',
    hero: function () {
      return S(P.sky('#ffd9a8', '#ffeccf') + P.floor(196, '#cbb894') + P.stage(90, 196, 0.9) + P.museum(310, 196, 0.9) +
        KORO({ x: 170, y: 140, s: 0.75, expr: 'worried' }) + HARU({ x: 232, y: 142, s: 0.75, expr: 'worried', flip: true }) +
        T(200, 34, 'スマホの充電、0%', { fs: 22 }));
    },
    roleNote: function (ctx) {
      return ctx.role === 'A'
        ? 'あなた（コロ）は<b>フェス</b>が大好き。ハルは<b>美術館</b>の特別展に行きたがっている。'
        : 'あなた（コロ）は<b>美術館</b>の特別展が大好き。ハルは<b>フェス</b>に行きたがっている。';
    },
    story: [
      function (ctx) {
        var like = ctx.role === 'A' ? 'フェス' : '美術館', other = ctx.role === 'A' ? '美術館' : 'フェス';
        return {
          art: S(P.sky('#bfe6ff', '#fff6e6') + P.floor(190, '#cbb894') +
            KORO({ x: 130, y: 120, expr: 'happy' }) + HARU({ x: 270, y: 124, expr: 'happy', flip: true }) +
            B(24, 10, like + 'いこうよ！', { fs: 14, to: [130, 92] }) + B(206, 10, other + 'がいい〜', { fs: 14, to: [262, 100] })),
          text: '土曜の午後、イヌの<b>コロ</b>（あなた）とウサギの<b>ハル</b>は一緒に出かける約束をした。' + this.roleNote(ctx)
        };
      },
      function () {
        return {
          art: S(P.sky('#ffe0b8', '#fff6e6') + P.floor(190, '#cbb894') +
            KORO({ x: 140, y: 124, expr: 'shock' }) + P.phone(260, 120, 1.4, true) +
            T(260, 56, '0%', { fs: 26, fill: '#e2564f' }) + T(120, 40, 'えっ', { fs: 22, rotate: -8 })),
          text: '「あとで連絡するね！」――そう言って別れた直後、<b>ふたりのスマホの充電が同時に切れた</b>。もう連絡はとれない。'
        };
      },
      function (ctx) {
        var left = P.stage(100, 190, 1), right = P.museum(300, 190, 1);
        return {
          art: S(P.sky('#ffd9a8', '#ffeccf') + P.floor(190, '#cbb894') + left + right +
            C({ kind: 'dog', color: '#f0d6a8', x: 200, y: 120, s: 0.85, expr: 'think' }) +
            P.question(200, 40, 1)),
          text: '行き先の候補は、駅の<b>東口のフェス会場</b>か、<b>西口の美術館</b>。どちらか一方へ行くしかない。'
        };
      },
      function (ctx) {
        return {
          art: S('<rect width="400" height="240" fill="#2c3466"/>' + P.stars(10) +
            KORO({ x: 120, y: 120, expr: 'sad' }) + HARU({ x: 290, y: 120, expr: 'sad', flip: true }) +
            '<path d="M200 0 v240" stroke="#fff" stroke-width="3" stroke-dasharray="8 8"/>' +
            T(200, 220, 'ちがう場所で、ひとりぼっち…', { fs: 15, fill: '#fff6c7' })),
          text: 'いちばんいやなのは、<b>別々の場所でひとりぼっち</b>になること。ハルも同じように、あなたがどちらに来るかを考えている。'
        };
      }
    ],
    actions: {
      F: { label: 'フェス会場へ行く', sub: '東口の野外ステージ', icon: '🎸' },
      M: { label: '美術館へ行く', sub: '西口の特別展', icon: '🖼️' }
    },
    order: ['F', 'M'],
    oppRole: function (role) { return role === 'A' ? 'B' : 'A'; },
    pay: function (m, o, role) {
      if (m !== o) return [0, 0];
      return m === bosFav(role) ? [3, 2] : [2, 3];
    },
    better: 'high', unit: '点', fmt: function (v) { return 'うれしさ ' + v; },
    expectQ: 'ハルは、どちらに行くと思いますか？',
    reasonQ: 'なぜその場所を選びましたか？ ハルがどう考えると思ったかも書いてください。',
    outcome: function (m, o, role) {
      var fav = bosFav(role), place = m === 'F' ? 'フェス会場' : '美術館';
      var same = m === o;
      var title = same ? (m === fav ? '会えた！しかも行きたかった場所！' : '会えた！（ハルの行きたい場所だけど）') : 'すれちがい…';
      var text = same
        ? place + 'でばったり再会。' + (m === fav ? 'あなたは大満足、ハルもまあ楽しそう。' : 'ハルは大はしゃぎ。あなたも、ひとりよりずっといい。')
        : 'あなたは' + place + '、ハルは' + (o === 'F' ? 'フェス会場' : '美術館') + '。それぞれ、ひとりで夕方まで過ごした。';
      return {
        title: title, text: text,
        art: S(P.sky(same ? '#bfe6ff' : '#2c3466', same ? '#fff6e6' : '#4a3f6b') + P.floor(190, '#cbb894') +
          (m === 'F' ? P.stage(same ? 200 : 100, 190, 0.9) : P.museum(same ? 200 : 100, 190, 0.9)) +
          (same ? '' : (o === 'F' ? P.stage(300, 190, 0.9) : P.museum(300, 190, 0.9))) +
          (same
            ? KORO({ x: 90, y: 128, s: 0.8, expr: 'happy', arms: 'up' }) + HARU({ x: 310, y: 130, s: 0.8, expr: 'happy', flip: true, arms: 'up' }) + P.sparkle(150, 70, 1) + P.sparkle(255, 60, 1.2)
            : KORO({ x: 100, y: 140, s: 0.7, expr: 'sad' }) + HARU({ x: 300, y: 142, s: 0.7, expr: 'sad', flip: true })))
      };
    }
  };

  /* ========================================================
   * 3. 鹿狩りゲーム（スタグハント）
   * ======================================================== */
  GAMES.stag = {
    id: 'stag', kind: '2x2', no: 3,
    title: '鹿狩りゲーム', story_title: '収穫祭前夜の森',
    tagline: '大物は二人でしか獲れない。目の前にはウサギ。',
    color: '#3f7d4e',
    me: 'クマ吉', opp: 'ゴン',
    hero: function () {
      return S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(190, '#7cb36a') + P.tree(40, 150, 1) + P.tree(360, 150, 1.1) +
        P.deer(200, 150, 0.9) + KUMAKICHI({ x: 90, y: 140, s: 0.65 }) + GON({ x: 310, y: 142, s: 0.65, flip: true }) +
        T(200, 34, '収穫祭前夜の森', { fs: 22 }));
    },
    story: [
      function () {
        return {
          art: S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(186, '#c7a17a') +
            '<path d="M60 186 L60 110 L200 60 L340 110 L340 186z" fill="#e8c9a0" stroke="' + A.INK + '" stroke-width="2.5"/>' +
            '<path d="M120 80 l160 0" stroke="#e2564f" stroke-width="4" stroke-dasharray="10 6"/>' +
            KUMAKICHI({ x: 150, y: 130, s: 0.8, expr: 'happy' }) + GON({ x: 250, y: 132, s: 0.8, expr: 'happy', flip: true }) +
            T(200, 40, 'あしたは収穫祭！', { fs: 20 })),
          text: '森の村では、あしたは年に一度の<b>収穫祭</b>。猟師のクマ・<b>クマ吉</b>（あなた）と、イヌの<b>ゴン</b>は、ごちそうを獲りに夜明けの森へ向かった。'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(190, '#7cb36a') + P.tree(60, 150, 1) + P.tree(330, 150, 1) +
            P.deer(200, 150, 1.1) + T(200, 40, '大きな鹿！', { fs: 22 }) +
            KUMAKICHI({ x: 60, y: 170, s: 0.5, expr: 'shock' }) + GON({ x: 340, y: 172, s: 0.5, expr: 'shock', flip: true })),
          text: '森の奥に、立派な<b>鹿</b>を見つけた。鹿は足が速く、<b>ふたりで両側から挟みうち</b>しないと絶対に獲れない。獲れれば村じゅうが大喜びのごちそうだ。'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(190, '#7cb36a') + P.tree(330, 150, 1) +
            P.hare(200, 196, 1.4) + KUMAKICHI({ x: 100, y: 120, s: 0.9, expr: 'think' }) +
            B(170, 30, 'ウサギなら\nひとりで確実に獲れる…', { fs: 13, think: true, to: [110, 92] })),
          text: 'ところが、持ち場で待つクマ吉の足もとを<b>ウサギ</b>がぴょこぴょこ。ウサギなら<b>ひとりで確実に</b>獲れる。ただし、持ち場を離れたら鹿は逃げてしまう。'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(190, '#7cb36a') + P.tree(200, 150, 1.2) +
            KUMAKICHI({ x: 80, y: 130, s: 0.8, expr: 'think' }) + GON({ x: 320, y: 130, s: 0.8, expr: 'think', flip: true }) +
            P.hare(320, 200, 0.9) + P.hare(80, 200, 0.9, true)),
          text: 'ゴンの持ち場は木の向こう側。姿は見えない。ゴンの足もとにも、たぶんウサギがいる。<b>ゴンは持ち場を守るだろうか？</b>'
        };
      }
    ],
    actions: {
      S: { label: '鹿を待つ', sub: '持ち場を守ってゴンを信じる', icon: '🦌' },
      H: { label: 'ウサギを獲る', sub: '確実なごちそうを手に入れる', icon: '🐇' }
    },
    order: ['S', 'H'],
    pay: function (m, o) { var v = stagV(); var t = { SS: [v, v], SH: [0, 3], HS: [3, 0], HH: [3, 3] }; return t[m + o]; },
    better: 'high', unit: '点', fmt: function (v) { return 'ごちそう ' + v; },
    expectQ: 'ゴンは、どうすると思いますか？',
    reasonQ: 'なぜその選択をしましたか？ ゴンをどのくらい信じられたかも書いてください。',
    outcome: function (m, o) {
      var t = {
        SS: ['鹿を仕留めた！', 'ふたりの挟みうちが決まった！ 収穫祭は鹿のローストで大盛り上がり。', 'happy', 'happy'],
        SH: ['ゴン、ウサギに走る', 'ゴンがウサギを追った瞬間、鹿は逃げた。クマ吉は手ぶらで村に帰った。', 'sad', 'happy'],
        HS: ['ウサギを確保', 'クマ吉はウサギをゲット。でもゴンは鹿に逃げられて手ぶら。「待ってたのに…」', 'happy', 'sad'],
        HH: ['ウサギ2羽', 'ふたりともウサギを1羽ずつ。鹿は森の奥へ。まあ、悪くない収穫祭。', 'normal', 'normal']
      }[m + o];
      return {
        title: t[0], text: t[1],
        art: S(P.sky('#ffcf8a', '#ffe8c4') + P.floor(190, '#7cb36a') +
          (m + o === 'SS' ? P.deer(200, 160, 0.9) + P.sparkle(140, 60, 1.2) + P.sparkle(270, 50, 1) : P.deer(360, 120, 0.4, true)) +
          KUMAKICHI({ x: 90, y: 130, s: 0.8, expr: t[2] }) + GON({ x: 310, y: 130, s: 0.8, expr: t[3], flip: true }) +
          (m === 'H' ? P.hare(140, 206, 0.9) : '') + (o === 'H' ? P.hare(260, 206, 0.9, true) : ''))
      };
    }
  };

  /* ========================================================
   * 4. チキンゲーム
   * ======================================================== */
  GAMES.chicken = {
    id: 'chicken', kind: '2x2', no: 4,
    title: 'チキンゲーム', story_title: '一本橋のヤギ',
    tagline: '先にゆずった方が負け？ それとも、ふたりで落ちる？',
    color: '#f08a24',
    me: 'ユキ', opp: 'メェ太',
    hero: function () {
      return S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
        YUKI({ x: 150, y: 96, s: 0.7, expr: 'angry' }) + MEETA({ x: 250, y: 96, s: 0.7, expr: 'angry', flip: true }) +
        T(200, 34, '一本橋のヤギ', { fs: 22 }));
    },
    story: [
      function () {
        return {
          art: S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
            YUKI({ x: 70, y: 94, s: 0.7, expr: 'happy' }) + '<path d="M300 110 q20 -30 60 -10" fill="none" stroke="#7cb36a" stroke-width="16" stroke-linecap="round"/>' +
            B(40, 6, '向こう岸の草、おいしそう！', { fs: 13, to: [72, 66] })),
          text: '白ヤギの<b>ユキ</b>（あなた）は、谷にかかる<b>一本橋</b>を渡ろうとしている。向こう岸には、朝つゆでぴかぴかの<b>ごちそうの草</b>。'
        };
      },
      function () {
        return {
          art: S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
            YUKI({ x: 160, y: 96, s: 0.7, expr: 'shock' }) + MEETA({ x: 240, y: 96, s: 0.7, expr: 'shock', flip: true }) +
            T(200, 36, 'ばったり！', { fs: 24, fill: '#e2564f', rotate: -5 })),
          text: '橋のまんなかで、反対側から来た茶ヤギの<b>メェ太</b>と鉢合わせ！ 橋はヤギ一匹ぶんの幅しかない。'
        };
      },
      function () {
        return {
          art: S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
            YUKI({ x: 150, y: 96, s: 0.7, expr: 'angry' }) + MEETA({ x: 250, y: 96, s: 0.7, expr: 'angry', flip: true }) +
            B(20, 6, 'そっちがどけよ', { fs: 13, to: [150, 70] }) + B(250, 6, 'いやだね', { fs: 13, to: [250, 70] }) + P.splash(200, 214)),
          text: '<b>突き進めば</b>、相手がゆずったとき堂々と先に渡れて、谷じゅうに「強いヤギ」と評判が立つ。でも<b>ふたりとも突き進んだら</b>、仲よく川へドボン。'
        };
      },
      function () {
        return {
          art: S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
            YUKI({ x: 140, y: 96, s: 0.7, expr: 'think' }) + MEETA({ x: 260, y: 96, s: 0.7, expr: 'think', flip: true }) +
            B(20, 8, 'ゆずったら\n弱虫って言われる…？', { fs: 12, think: true, to: [140, 72] })),
          text: '<b>ゆずれば</b>確実に安全。ふたりともゆずれば、少し下がって順番に渡れる。でも自分だけゆずると「弱虫ヤギ」と笑われるかも。さあ、どうする？'
        };
      }
    ],
    actions: {
      G: { label: '突き進む', sub: 'ここで引くわけにはいかない', icon: '🐐💨' },
      Y: { label: 'ゆずる', sub: '一歩下がって道をあける', icon: '🙇' }
    },
    order: ['G', 'Y'],
    pay: function (m, o) { var t = { YY: [3, 3], YG: [1, 5], GY: [5, 1], GG: [0, 0] }; return t[m + o]; },
    better: 'high', unit: '点', fmt: function (v) { return 'まんぞく ' + v; },
    expectQ: 'メェ太は、どうすると思いますか？',
    reasonQ: 'なぜその選択をしましたか？ メェ太の出方をどう読んだかも書いてください。',
    outcome: function (m, o) {
      var t = {
        YY: ['ゆずりあい', 'ふたりとも一歩下がり、順番に渡った。草はちょっとしおれていたけど、平和な朝。', 'happy', 'happy'],
        YG: ['メェ太が先に渡った', 'メェ太は胸を張って先に渡った。ユキは安全だけど、「弱虫ユキ」とからかわれた。', 'sad', 'smug'],
        GY: ['ユキの勝ち！', 'メェ太がしぶしぶ後ずさり。ユキは堂々と渡り、ごちそうを独り占め！', 'smug', 'sad'],
        GG: ['ドッボーーン！', 'ゴツン！ ふたりとも川へまっさかさま。ずぶぬれで岸に上がり、くしゃみをした。', 'shock', 'shock']
      }[m + o];
      var gg = m + o === 'GG';
      return {
        title: t[0], text: t[1],
        art: S(P.sky('#bfe6ff', '#e8f6ff') + P.river(190) + P.cliff('left') + P.cliff('right') + P.plank() +
          (gg ? P.splash(170, 214) + P.splash(240, 220) + YUKI({ x: 170, y: 200, s: 0.55, expr: 'shock', body: false }) + MEETA({ x: 240, y: 204, s: 0.55, expr: 'shock', flip: true, body: false })
            : YUKI({ x: m === 'Y' ? 70 : 220, y: 96, s: 0.7, expr: t[2] }) + MEETA({ x: o === 'Y' ? 330 : 180, y: 96, s: 0.7, expr: t[3], flip: true })))
      };
    }
  };

  /* ========================================================
   * 5. ボランティアのジレンマ（5人）
   * ======================================================== */
  var ROOMIES = [
    function (o) { return C(Object.assign({ kind: 'cat', color: '#9aa7b5', hat: 'nightcap' }, o)); },
    function (o) { return C(Object.assign({ kind: 'tanuki', color: '#a9825a' }, o)); },
    function (o) { return C(Object.assign({ kind: 'rabbit', color: '#fbe3ea' }, o)); },
    function (o) { return C(Object.assign({ kind: 'dog', color: '#f0d6a8' }, o)); },
    function (o) { return C(Object.assign({ kind: 'bear', color: '#a8774f' }, o)); }
  ];
  GAMES.volunteer = {
    id: 'volunteer', kind: 'volunteer', no: 5, groupSize: 5,
    title: 'ボランティアのジレンマ', story_title: 'シェアハウスの夜、ヤツが出た',
    tagline: '誰かひとりが動けば、みんな助かる。その「誰か」は？',
    color: '#2f6fb0',
    hero: function () {
      return S(P.house() + P.roach(200, 196, 1.2) +
        ROOMIES[0]({ x: 60, y: 110, s: 0.55, expr: 'shock' }) + ROOMIES[1]({ x: 130, y: 104, s: 0.55, expr: 'shock' }) +
        ROOMIES[2]({ x: 270, y: 108, s: 0.55, expr: 'shock' }) + ROOMIES[3]({ x: 340, y: 110, s: 0.55, expr: 'shock' }) +
        T(200, 34, 'シェアハウスの夜、ヤツが出た', { fs: 19, fill: '#fff6c7' }));
    },
    story: [
      function () {
        return {
          art: S(P.house() + P.stars(6) + P.zzz(80, 70) + P.zzz(300, 120) +
            ROOMIES[0]({ x: 70, y: 120, s: 0.6, expr: 'sleep' }) + ROOMIES[1]({ x: 150, y: 124, s: 0.6, expr: 'sleep' }) +
            ROOMIES[2]({ x: 230, y: 120, s: 0.6, expr: 'sleep' }) + ROOMIES[3]({ x: 300, y: 124, s: 0.6, expr: 'sleep' }) + ROOMIES[4]({ x: 360, y: 128, s: 0.55, expr: 'sleep' })),
          text: '5人で暮らすシェアハウス「どうぶつ荘」。深夜2時、あなた（ネコ）を含む住人たちがそろそろ眠ろうとしていた、そのとき――'
        };
      },
      function () {
        return {
          art: S(P.house() + P.fridge(40, 74) + P.roach(220, 196, 1.5) +
            T(220, 120, 'カサカサ…', { fs: 22, fill: '#fff6c7', rotate: -6 }) + P.sparkle(300, 160, 0.8, '#fff')),
          text: '台所に、<b>巨大なゴキブリ</b>が出現した。しかも、ものすごく速い。全員がその姿を見てしまった。'
        };
      },
      function () {
        return {
          art: S(P.house() + P.roach(330, 210, 0.7) +
            ROOMIES[0]({ x: 60, y: 120, s: 0.6, expr: 'worried' }) + ROOMIES[1]({ x: 140, y: 124, s: 0.6, expr: 'worried' }) +
            ROOMIES[2]({ x: 220, y: 120, s: 0.6, expr: 'worried' }) + ROOMIES[3]({ x: 300, y: 124, s: 0.6, expr: 'worried' }) +
            B(100, 10, '誰か…やってくれないかな…', { fs: 13, think: true })),
          text: '<b>誰かひとりでも</b>退治すれば、全員ぐっすり眠れる。でも退治役は、こわいし、疲れるし、ちょっと気持ち悪い。全員がそう思っている。'
        };
      },
      function () {
        return {
          art: S(P.house() + ROOMIES[0]({ x: 200, y: 120, s: 1, expr: 'think' }) + P.roach(320, 200, 0.6) +
            B(20, 12, '名乗り出る？', { fs: 15, think: true, to: [180, 90] }) + B(280, 12, '待つ？', { fs: 15, think: true, to: [220, 90] })),
          text: '相談している時間はない。住人それぞれが同時に決める。あなたは<b>「私がやる！」と名乗り出る</b>？ それとも<b>誰かが動くのを待つ</b>？'
        };
      }
    ],
    actions: {
      V: { label: '名乗り出る', sub: '「私がやる！」スリッパを手に取る', icon: '🩴' },
      W: { label: '待つ', sub: '誰かが動いてくれるはず…', icon: '🛏️' }
    },
    order: ['V', 'W'],
    // 1人でも名乗り出れば：名乗り出た人 7、待った人 10。誰も出なければ全員 0。
    payV: function (myAct, anyOtherV) {
      if (myAct === 'V') return 7;
      return anyOtherV ? 10 : 0;
    },
    better: 'high', unit: '点', fmt: function (v) { return 'ぐっすり度 ' + v; },
    expectQ: 'ほかの4人のうち、何人が名乗り出ると思いますか？',
    reasonQ: 'なぜその選択をしましたか？ ほかの住人がどう動くと思ったかも書いてください。',
    outcomeArt: function (myAct, others) {
      var anyV = myAct === 'V' || others.some(function (x) { return x === 'V'; });
      var acts = [myAct].concat(others);
      var s = P.house() + (anyV ? '' : P.roach(200, 212, 1.2));
      var xs = [60, 130, 200, 270, 340];
      acts.forEach(function (a, i) {
        var hero = a === 'V';
        s += ROOMIES[i]({ x: xs[i], y: hero ? 108 : 124, s: 0.55, expr: anyV ? (hero ? 'happy' : 'sleep') : 'worried', arms: hero ? 'up' : undefined });
        if (i === 0) s += '<text x="' + xs[i] + '" y="200" text-anchor="middle" font-size="12" fill="#fff6c7" font-weight="900">あなた</text>';
        if (hero) s += '<text x="' + xs[i] + '" y="72" text-anchor="middle" font-size="18">🩴</text>';
      });
      return S(s);
    }
  };

  /* ========================================================
   * 6. 最後通牒ゲーム（両方の役をやる：戦略法）
   * ======================================================== */
  GAMES.ultimatum = {
    id: 'ultimatum', kind: 'ultimatum', no: 6, total: 1000, step: 50,
    title: '最後通牒ゲーム', story_title: '宝箱の山分け',
    tagline: '分け方を決めるのは一人。拒否されたら、宝は海の底。',
    color: '#c48a1c',
    hero: function () {
      return S(P.sky('#ffd9a8', '#fff2d6') + P.waves(180) + P.ship(200, 168, 0.9) + P.chest(200, 148, 0.7, true) +
        PIRATE_ME({ x: 110, y: 110, s: 0.7, expr: 'happy' }) + PIRATE_YOU({ x: 290, y: 112, s: 0.7, expr: 'happy', flip: true }) +
        T(200, 34, '宝箱の山分け', { fs: 22 }));
    },
    story: [
      function () {
        return {
          art: S(P.sky('#ffd9a8', '#fff2d6') + P.floor(170, '#f2deb0') + P.waves(200) + P.chest(200, 170, 1.1, true) +
            PIRATE_ME({ x: 90, y: 110, s: 0.8, expr: 'happy', arms: 'up' }) + PIRATE_YOU({ x: 310, y: 112, s: 0.8, expr: 'happy', flip: true, arms: 'up' }) +
            T(200, 36, '1000ゴールド！', { fs: 22, fill: '#a0612e' })),
          text: '海賊見習いのふたりが、無人島で<b>1000ゴールド</b>の入った宝箱を掘り当てた！ さあ、どう分けよう？'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffd9a8', '#fff2d6') + P.waves(180) + P.ship(200, 168, 0.8) +
            C({ kind: 'bear', color: '#7a5a3a', hat: 'bandana', x: 200, y: 92, s: 0.75, expr: 'smug' }) +
            B(30, 10, '海賊のおきて第3条！', { fs: 14, to: [190, 68] })),
          text: '海賊船には古い<b>おきて</b>がある。「<b>分け方を決める者</b>がひとつだけ提案し、<b>受け取る者</b>は『乗る』か『断る』かだけ言える。交渉は一切なし」'
        };
      },
      function () {
        return {
          art: S(P.sky('#9fb6c9', '#cfdbe4') + P.waves(150) + P.chest(200, 210, 0.8) +
            '<path d="M200 150 v40" stroke="#fff" stroke-width="3" stroke-dasharray="4 6"/>' +
            PIRATE_ME({ x: 90, y: 90, s: 0.7, expr: 'shock' }) + PIRATE_YOU({ x: 310, y: 90, s: 0.7, expr: 'shock', flip: true }) +
            T(200, 36, 'ボチャン…', { fs: 22, fill: '#2f4b7c' })),
          text: 'もし受け取る者が<b>断ったら</b>、宝箱は<b>海に沈められ</b>、ふたりとも<b>0ゴールド</b>。乗れば、提案どおりに分けられる。'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffd9a8', '#fff2d6') + P.floor(170, '#f2deb0') + P.chest(200, 170, 0.9, true) +
            PIRATE_ME({ x: 90, y: 110, s: 0.75, expr: 'think' }) + PIRATE_YOU({ x: 310, y: 112, s: 0.75, expr: 'think', flip: true }) +
            B(30, 8, '分ける側？', { fs: 14, think: true, to: [90, 80] }) + B(240, 8, '受け取る側？', { fs: 14, think: true, to: [310, 80] })),
          text: 'どちらの役になるかは、まだわからない。そこであなたには<b>両方の役</b>を決めてもらう。①分ける側なら<b>いくら渡すか</b>、②受け取る側なら<b>いくら以上なら乗るか</b>。'
        };
      }
    ],
    reasonQProposer: 'なぜその金額を提案しましたか？ 相手がどう反応すると思ったかも書いてください。',
    reasonQResponder: 'なぜその金額を「乗るかどうかの境目」にしましたか？'
  };

  /* ========================================================
   * 7・8. 繰り返し囚人のジレンマ（回数が既知 / 未知）
   * ======================================================== */
  function ipdBase(id, known) {
    return {
      id: id, kind: 'ipd', no: known ? 10 : 9, known: known,
      title: '繰り返し囚人のジレンマ', subtitle: known ? '回数を知っている' : '回数を知らない',
      story_title: known ? 'ラーメン激戦区・最後の10週' : 'ラーメン激戦区・終わりの見えない勝負',
      tagline: known ? '10週後、商店街はなくなる。最後の週、あなたは？' : 'いつ終わるかは誰も知らない。',
      color: known ? '#b23a48' : '#5a4fcf',
      hero: function () {
        return S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') +
          P.shop(100, 186, '麺屋あい', '#e2564f', { s: 0.85 }) + P.shop(300, 186, 'ゲン屋', '#2f4b7c', { s: 0.85 }) +
          (known ? P.calendar(200, 90, '10', 'WEEKS') : P.question(200, 90, 1.4)) +
          T(200, 30, known ? 'ラーメン激戦区・最後の10週' : '終わりの見えない勝負', { fs: 18 }));
      },
      story: [
        function () {
          return {
            art: S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') +
              P.shop(100, 186, '麺屋あい', '#e2564f', { s: 0.85 }) + P.shop(300, 186, 'ゲン屋', '#2f4b7c', { s: 0.85 }) +
              CHEF_ME({ x: 100, y: 200, s: 0.45, expr: 'happy' }) + GEN({ x: 300, y: 200, s: 0.45, expr: 'angry', flip: true })),
            text: 'あなたは商店街のラーメン屋<b>「麺屋あい」</b>の店主。道をはさんだ向かいには、頑固おやじ<b>ゲンさん</b>の<b>「ゲン屋」</b>。お客さんはこの2軒を行ったり来たりしている。'
          };
        },
        function () {
          return {
            art: S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') +
              P.shop(100, 186, '麺屋あい', '#e2564f', { s: 0.85, price: '800円' }) + P.shop(300, 186, 'ゲン屋', '#2f4b7c', { s: 0.85, price: '600円', sale: true }) +
              C({ kind: 'rabbit', color: '#fbe3ea', x: 230, y: 180, s: 0.4, expr: 'happy' }) + C({ kind: 'dog', color: '#f0d6a8', x: 260, y: 186, s: 0.4, expr: 'happy' })),
            text: '毎週月曜、それぞれの店は値段を<b>据え置く</b>か<b>値下げする</b>かを決める。片方だけが値下げすれば、お客さんはそっちに流れる。ふたりとも値下げすれば、客は変わらず利益だけが減る。'
          };
        },
        known
          ? function () {
            return {
              art: S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') + P.crane(300, 190) +
                P.shop(110, 186, '麺屋あい', '#e2564f', { s: 0.8 }) + P.calendar(260, 120, '10', 'WEEKS') +
                T(200, 30, '再開発のお知らせ', { fs: 20, fill: '#e2564f' })),
              text: 'そして商店街に貼り紙が。「<b>10週間後</b>、再開発のため商店街は取り壊されます」。両方の店は<b>ちょうど10週</b>で閉店する。ゲンさんもこの貼り紙を見ている。'
            };
          }
          : function () {
            return {
              art: S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') +
                P.shop(110, 186, '麺屋あい', '#e2564f', { s: 0.8 }) + P.question(270, 110, 1.6) +
                T(200, 30, '再開発のうわさ…', { fs: 20, fill: '#5a4fcf' })),
              text: '商店街には「そのうち<b>再開発</b>で取り壊されるらしい」といううわさがある。でも、<b>それがいつなのかは誰も知らない</b>。来週かもしれないし、ずっと先かもしれない。'
            };
          },
        function () {
          return {
            art: S('<rect width="400" height="240" fill="#fff6e6"/>' +
              CHEF_ME({ x: 110, y: 110, s: 0.9, expr: 'think' }) + GEN({ x: 290, y: 110, s: 0.9, expr: 'think', flip: true }) +
              B(140, 10, 'ゲンさんは\n先週の私を見てる…', { fs: 13, think: true, to: [125, 64] })),
            text: 'ゲンさんは、<b>あなたが前の週にどうしたか</b>を見て値段を決めているようだ。毎週の利益が積み重なって、最後の総売上で勝負が決まる。さあ、開店だ。'
          };
        }
      ],
      actions: {
        K: { label: '据え置く', sub: '値段はそのまま（協力）', icon: '🍜' },
        S: { label: '値下げする', sub: 'お客をうばいにいく（裏切り）', icon: '💥' }
      },
      order: ['K', 'S'],
      pay: function (m, o) { var t = { KK: [30, 30], KS: [0, 50], SK: [50, 0], SS: [10, 10] }; return t[m + o]; },
      better: 'high', unit: '万円', fmt: function (v) { return v + '万円'; },
      reasonQFirst: '最初の週、なぜその判断をしましたか？',
      reasonQSwitch: '先週と判断を変えました。なぜですか？',
      reasonQFinal: known
        ? '全体を通して、どんな方針で判断しましたか？ 特に最後の週（10週目）とその直前に、なぜその判断をしたのかも書いてください。'
        : '全体を通して、どんな方針で判断しましたか？ 「いつ終わるかわからない」ことが判断にどう影響したかも書いてください。',
      chefMe: CHEF_ME, gen: GEN
    };
  }
  GAMES.ipd_known = ipdBase('ipd_known', true);
  GAMES.ipd_unknown = ipdBase('ipd_unknown', false);

  /* 2本セットの入口（?game=ipd）。条件がわからないように、カレンダーも「？」も出さない */
  window.GT_IPD_SET = {
    id: 'ipd', kind: 'ipdset', no: '9・10', color: '#7a4a9e',
    title: '繰り返し囚人のジレンマ', subtitle: '2本セット',
    story_title: 'ラーメン激戦区', tagline: '向かいの店と、毎週の値段の駆け引き。条件を変えて2回勝負します。',
    hero: function () {
      return S(P.sky('#ffe0b8', '#fff6e6') + P.floor(196, '#b8a58a') +
        P.shop(100, 186, '麺屋あい', '#e2564f', { s: 0.85 }) + P.shop(300, 186, 'ゲン屋', '#2f4b7c', { s: 0.85 }) +
        T(200, 30, 'ラーメン激戦区', { fs: 20 }) + T(200, 70, 'VS', { fs: 26, fill: '#e2564f' }));
    }
  };

  /* ========================================================
   * 7. 独裁者ゲーム（一回限り）
   * ======================================================== */
  var ME_D = function (o) { return C(Object.assign({ kind: 'cat', color: '#b9c7d6' }, o)); };
  var STRANGER = function (o) { return C(Object.assign({ kind: 'dog', color: '#e8d2b0' }, o)); };
  var SHOPKEEPER = function (o) { return C(Object.assign({ kind: 'human', hat: 'towel', bodyColor: '#e2564f', hair: '#3a2e28' }, o)); };
  var INK2 = A.INK;
  function drum(x, y, s, spin) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')">' +
      '<path d="M-34 40 L0 -4 L34 40" fill="none" stroke="' + INK2 + '" stroke-width="5"/><rect x="-44" y="38" width="88" height="10" rx="3" fill="#8a6446" stroke="' + INK2 + '" stroke-width="2.5"/>' +
      '<g' + (spin ? ' transform="rotate(18)"' : '') + '><path d="M0 -38 L33 -19 L33 19 L0 38 L-33 19 L-33 -19z" fill="#e2564f" stroke="' + INK2 + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M0 -38 L0 38 M33 -19 L-33 19 M-33 -19 L33 19" stroke="#b33b35" stroke-width="2"/></g>' +
      '<circle r="6" fill="#f2c14e" stroke="' + INK2 + '" stroke-width="2.5"/><path d="M0 0 L46 -10" stroke="' + INK2 + '" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="-10" r="6" fill="#8a6446" stroke="' + INK2 + '" stroke-width="2"/></g>';
  }
  function ticket(x, y, s, text) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ') rotate(-8)"><rect x="-44" y="-20" width="88" height="40" rx="6" fill="#fff3b0" stroke="' + INK2 + '" stroke-width="2.5"/>' +
      '<path d="M-28 -20 v40" stroke="' + INK2 + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<text x="8" y="6" text-anchor="middle" font-size="14" font-weight="900" fill="#e2564f">' + (text || '1000円') + '</text></g>';
  }
  function stall() {
    return '<rect x="0" y="0" width="400" height="240" fill="#ffe9c7"/>' +
      '<path d="M0 0 h400 v34 h-400z" fill="#e2564f"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<path d="M' + (i * 50) + ' 34 q25 22 50 0" fill="' + (i % 2 ? '#fff' : '#e2564f') + '" stroke="' + INK2 + '" stroke-width="2"/>'; }).join('') +
      '<text x="200" y="24" text-anchor="middle" font-size="16" fill="#fff" font-weight="900">ふたり1組の大福引き</text>' +
      P.floor(196, '#cbb894') + '<rect x="120" y="150" width="160" height="50" fill="#fff" stroke="' + INK2 + '" stroke-width="2.5"/>';
  }
  GAMES.dictator = {
    id: 'dictator', kind: 'dictator', no: 7, total: 1000, step: 50,
    title: '独裁者ゲーム', story_title: 'ふたり1組の福引き',
    tagline: '分け方を決めるのはあなただけ。相手は断れない。',
    color: '#d0517e',
    hero: function () {
      return S(stall() + drum(200, 110, 0.9, false) + ME_D({ x: 90, y: 116, s: 0.7, expr: 'happy' }) + STRANGER({ x: 312, y: 118, s: 0.7, expr: 'normal', flip: true }) +
        T(200, 226, 'ふたり1組の福引き', { fs: 18 }));
    },
    story: [
      function () {
        return {
          art: S(stall() + drum(200, 110, 0.95, true) + SHOPKEEPER({ x: 320, y: 104, s: 0.75, expr: 'happy', flip: true }) +
            ME_D({ x: 90, y: 118, s: 0.75, expr: 'happy', arms: 'up' }) + T(140, 70, 'ガラガラ…', { fs: 18, rotate: -8 })),
          text: '商店街の夏祭り。名物の<b>「ふたり1組の大福引き」</b>に、あなたも並んだ。この福引きは、列で<b>たまたま隣になった人</b>と2人1組で引くきまりだ。'
        };
      },
      function () {
        return {
          art: S(stall() + drum(140, 110, 0.85, false) + '<circle cx="200" cy="160" r="9" fill="#f2c14e" stroke="' + INK2 + '" stroke-width="2.5"/>' +
            P.sparkle(230, 120, 1.4) + P.sparkle(180, 90, 1) + SHOPKEEPER({ x: 320, y: 104, s: 0.75, expr: 'shock', flip: true }) +
            ticket(250, 90, 1.1) + T(200, 186, '大当たり〜！', { fs: 22, fill: '#e2564f' })),
          text: 'ガラガラを回したのは、あなた。出てきたのは<b>金色の玉</b>！ 賞品は<b>1000円分のお食事券</b>。'
        };
      },
      function () {
        return {
          art: S(stall() + ME_D({ x: 90, y: 132, s: 0.75, expr: 'think' }) + STRANGER({ x: 310, y: 134, s: 0.75, expr: 'normal', flip: true }) +
            ticket(200, 172, 0.9) + B(120, 66, '分け方は…私が決める？', { fs: 13, think: true, to: [100, 100] })),
          text: '店主いわく「<b>回した人が、ペアの相手との分け方を自由に決める</b>のがこの福引きのきまり」。いくら渡しても、<b>0円</b>でもいい。'
        };
      },
      function () {
        return {
          art: S(stall() + ME_D({ x: 90, y: 132, s: 0.75, expr: 'think' }) + STRANGER({ x: 310, y: 134, s: 0.75, expr: 'normal', flip: true }) +
            '<path d="M200 70 v120" stroke="' + INK2 + '" stroke-width="3" stroke-dasharray="6 6"/>' +
            B(214, 66, '（何も言えない）', { fs: 13, think: true, to: [300, 100] })),
          text: 'ペアの相手は<b>知らない人</b>で、もう会うこともない。相手は<b>断ることも文句を言うこともできず</b>、あなたが決めた額をそのまま受け取るだけ。さあ、いくら渡す？'
        };
      }
    ],
    reasonQ: 'なぜその金額にしましたか？ 相手のことをどう考えたかも書いてください。',
    expectQ: 'ほかの参加者は、平均でいくら相手に渡すと思いますか？',
    chars: { ME: ME_D, YOU: STRANGER },
    stall: stall, ticket: ticket
  };

  /* ========================================================
   * 8. 信頼ゲーム（一回限り）
   * ======================================================== */
  var FARMER = function (o) { return C(Object.assign({ kind: 'rabbit', color: '#efe7da' }, o)); };
  var MEIJIN = function (o) { return C(Object.assign({ kind: 'tanuki', color: '#a9825a', hat: 'towel' }, o)); };
  function turnip(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><path d="M-2 -12 q-14 -18 -6 -26 q8 6 6 24 M2 -12 q12 -20 4 -28 q-8 8 -4 26" fill="#5fae5a" stroke="' + INK2 + '" stroke-width="1.6"/>' +
      '<path d="M0 8 q2 6 -1 11" fill="none" stroke="' + INK2 + '" stroke-width="1.8" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-2" rx="11" ry="10" fill="#fff" stroke="' + INK2 + '" stroke-width="2"/>' +
      '<path d="M-10 -6 a11 10 0 0 1 20 0 q-10 -3 -20 0z" fill="#b86bd0"/></g>';
  }
  function field(y) {
    var s = '<rect x="0" y="' + y + '" width="400" height="' + (240 - y) + '" fill="#9b6b43"/>';
    for (var i = 0; i < 4; i++) s += '<path d="M0 ' + (y + 12 + i * 14) + ' h400" stroke="#7a5233" stroke-width="5"/>';
    return s;
  }
  function turnips(x0, y0, n, s) { var o = ''; for (var i = 0; i < n; i++) o += turnip(x0 + (i % 5) * 18 * (s || 1), y0 + Math.floor(i / 5) * 22 * (s || 1), (s || 1) * 0.8); return o; }
  GAMES.trust = {
    id: 'trust', kind: 'trust', no: 8, endow: 10, mult: 3,
    title: '信頼ゲーム', story_title: '名人の畑',
    tagline: '預ければ3倍に育つ。でも、返すかどうかは名人しだい。',
    color: '#4f8a3a',
    hero: function () {
      return S(P.sky('#cfe9ff', '#f1f8ff') + field(170) + FARMER({ x: 100, y: 108, s: 0.75, expr: 'think' }) + MEIJIN({ x: 300, y: 110, s: 0.75, expr: 'smug', flip: true }) +
        turnips(160, 190, 5, 1) + T(200, 34, '名人の畑', { fs: 22 }));
    },
    story: [
      function () {
        return {
          art: S(P.sky('#cfe9ff', '#f1f8ff') + P.floor(176, '#c7a17a') + FARMER({ x: 130, y: 110, s: 0.85, expr: 'happy' }) + turnips(200, 120, 10, 1.1) +
            T(200, 36, '種かぶ 10個', { fs: 20 })),
          text: 'あなた（ウサギ）は、春に<b>種かぶを10個</b>持っている。そのまま持っていれば、秋には10個ぶんの価値のまま。'
        };
      },
      function () {
        return {
          art: S(P.sky('#cfe9ff', '#f1f8ff') + field(160) + MEIJIN({ x: 110, y: 100, s: 0.85, expr: 'smug', arms: 'up' }) + turnips(200, 170, 15, 1) +
            T(300, 60, '×3！', { fs: 30, fill: '#4f8a3a' })),
          text: '隣村の<b>畑の名人・タヌキのゲンゾウ</b>に預けると、名人の畑で<b>3倍</b>に育つ。1個預ければ、秋には3個になる。'
        };
      },
      function () {
        return {
          art: S(P.sky('#ffd9a8', '#fff2d6') + field(170) + MEIJIN({ x: 200, y: 108, s: 0.85, expr: 'think' }) +
            B(40, 8, '返すかどうかは、ワシが決める', { fs: 14, to: [200, 74] }) + turnips(60, 186, 5, 1) + turnips(260, 186, 5, 1)),
          text: 'ただし、収穫のうち<b>いくつ返すかは名人が自由に決める</b>。半分返すかもしれないし、<b>ひとつも返さない</b>かもしれない。約束も契約書もない。'
        };
      },
      function () {
        return {
          art: S(P.sky('#cfe9ff', '#f1f8ff') + field(170) + FARMER({ x: 100, y: 108, s: 0.75, expr: 'think' }) + MEIJIN({ x: 300, y: 110, s: 0.75, expr: 'think', flip: true }) +
            B(20, 8, '預ける側？', { fs: 14, think: true, to: [100, 72] }) + B(260, 8, '名人の側？', { fs: 14, think: true, to: [300, 74] })),
          text: 'あなたがどちらの役になるかは、まだわからない。そこで<b>両方の役</b>を決めてもらう。①預ける側なら<b>何個預けるか</b>、②名人なら収穫の<b>何%を返すか</b>。'
        };
      }
    ],
    reasonQInvestor: 'なぜその個数を預けましたか？ 名人がどう返してくると思ったかも書いてください。',
    reasonQTrustee: 'なぜその割合を返すことにしましたか？',
    expectQ: '名人（ほかの参加者）は、収穫の何%を返してくれると思いますか？',
    chars: { ME: FARMER, YOU: MEIJIN }, turnips: turnips, field: field
  };

  /* ---------- 結果の観点ラベル（AI分類） ---------- */
  var LABELS = {
    rational: { ja: '合理的', color: '#2f6fb0', desc: '利得・確率・相手の出方の予測にもとづく計算や推論' },
    emotional: { ja: '感情的', color: '#e2564f', desc: '恐れ・不安・怒り・友情・罪悪感・気分などの感情が根拠' },
    normative: { ja: '規範的', color: '#3f7d4e', desc: '公平・信頼・約束・道徳など「こうあるべき」が根拠' },
    bias: { ja: '認知バイアス', color: '#9b4fb0', desc: '既知の認知バイアス・ヒューリスティックの影響が読み取れる' },
    unclear: { ja: '判定不能', color: '#8a8378', desc: '理由が短い・無関係などで判断できない' }
  };

  window.GT_GAMES = GAMES;
  window.GT_ORDER = ['pd', 'bos', 'stag', 'chicken', 'volunteer', 'ultimatum', 'dictator', 'trust', 'ipd_unknown', 'ipd_known'];
  window.GT_LABELS = LABELS;
  window.GT_CHARS = { ROOMIES: ROOMIES, CHEF_ME: CHEF_ME, GEN: GEN, PIRATE_ME: PIRATE_ME, PIRATE_YOU: PIRATE_YOU };
})();
