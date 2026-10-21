/**
 * ジレンマ劇場（ゲーム理論8本）— 回答の保存・相手の抽選・AIによる理由の分類
 * Google スプレッドシートにバインドした Apps Script として使います。
 *
 * ■ スクリプト プロパティ（プロジェクトの設定 → スクリプト プロパティ）
 *   TEACHER_PASSWORD  : 必須。結果ページの「先生モード」のパスワード
 *   OPENAI_API_KEY    : OpenAI を使う場合に必須
 *   OPENAI_MODEL      : 任意。既定は gpt-4.1-mini
 *   AI_PROVIDER       : 任意。openai（既定）または anthropic
 *   ANTHROPIC_API_KEY : AI_PROVIDER=anthropic のときに必須
 *   ANTHROPIC_MODEL   : 任意。既定は claude-haiku-5-5
 *   PID_SALT          : 任意。学籍番号を匿名IDに変換するときの塩（適当な文字列）
 *
 * ■ デプロイ：デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *   実行ユーザー：自分 ／ アクセスできるユーザー：全員
 *   発行された …/exec の URL を js/config.js の GAS_URL に貼ります。
 */

var SHEET_NAME = 'responses';
var HEAD = ['id', 'timestamp', 'game', 'role', 'studentId', 'pid', 'nickname', 'sessionId',
  'choice', 'choiceLabel', 'expect', 'expectLabel', 'reason', 'detail', 'userAgent',
  'aiPrimary', 'aiFlags', 'aiBias', 'aiReason', 'aiDetail', 'aiModel', 'aiAt',
  'teacherLabel', 'teacherAt'];
var GAMES = ['pd', 'bos', 'stag', 'chicken', 'volunteer', 'ultimatum', 'dictator', 'trust', 'ipd_known', 'ipd_unknown', 'nashquiz'];
var LABELS = ['rational', 'emotional', 'normative', 'bias', 'unclear'];
var MAX_REASON = 2000;

/* ---------- ゲームの説明（AIに渡す文脈） ----------
 * 判定の「合理的」の基準は、このルール説明に書いた相手の性質と最適解に従う。
 * 回答ごとの設定（鹿の価値、ゲンさんの作戦、繰り返しの週数）は detail から読む。 */
var PAY_IPD = '毎週、両方据え置きなら30万円ずつ、自分だけ値下げなら自分50万円・相手0、自分だけ据え置きなら自分0・相手50万円、両方値下げなら10万円ずつ。';
var VOL_EQ = (function () { var p = 1 - Math.pow(1 - 7 / 10, 1 / 4); return { p: p, none: Math.pow(1 - p, 5) }; })();

function gameInfo_(r) {
  var d = safeParse_(r.detail);
  switch (r.game) {
    case 'pd': return { name: '囚人のジレンマ（一回限り・同時手番）', rules: '怪盗の相棒と別々に取り調べを受ける。二人とも黙秘なら懲役1年ずつ、二人とも自白なら5年ずつ、片方だけ自白すれば自白した側は無罪・黙秘した側は10年。相談はできず、一度きり。自白は相手が何を選んでも自分の刑期を短くする（支配戦略）が、二人とも自白すると二人とも黙秘より悪くなる。一回限りの同時手番なので、自分の選択が相手の選択を変えることはない。' };
    case 'bos': return { name: '男女の争い（一回限りの調整ゲーム）', rules: '友だちと出かけるが連絡がとれない。行き先はフェス会場か美術館。同じ場所に行けば会える（自分の好きな場所なら3点、相手の好きな場所なら2点）、別々なら二人とも0点。学生は自分の好きな場所をランダムに割り当てられている。純粋戦略の均衡が二つあり、どちらに合わせるかの調整が課題。' };
    case 'stag':
      var v = +d.stagValue || 6, q = Math.round(3 / v * 100);
      var risk = v < 6 ? 'この設定ではリスクの面でウサギがはっきり有利（ウサギがリスク支配均衡）。' : v === 6 ? 'この設定では、利得の大きさ（鹿）とリスクの小ささ（ウサギ）がちょうど拮抗している。' : 'この設定では鹿がリスクの面でも有利（鹿がリスク支配均衡）。';
      return { name: '鹿狩りゲーム（一回限り）', rules: '二人の狩人。二人とも持ち場を守れば鹿が獲れて' + v + '点ずつ。ウサギは相手と無関係に一人で確実に3点。自分だけ鹿を待って相手がウサギに行くと自分は0点。均衡は（鹿,鹿）と（ウサギ,ウサギ）の二つ。相手が鹿を待つ確率が' + q + '%以上なら鹿を待つほうが期待値が高い。' + risk + '相手が鹿を待つ見込みとリスクを比べてどちらを選んでも、その比較が書かれていれば合理的な推論である。' };
    case 'chicken': return { name: 'チキンゲーム（一回限り）', rules: '一本橋でヤギ同士が鉢合わせ。両方ゆずれば3点ずつ、自分だけ突き進めば5点（相手1点）、自分だけゆずれば1点、両方突き進むと川に落ちて0点ずつ。相手と逆の手を取るのが得になる（純粋戦略の均衡は二つ）。' };
    case 'volunteer': return { name: 'ボランティアのジレンマ（5人・一回限り）', rules: '5人のシェアハウスにゴキブリ。誰か1人でも名乗り出て退治すれば、待った人は10点、名乗り出た人は7点。誰も名乗り出なければ全員0点。同時に相談なしで決める。この利得の対称な混合戦略均衡では、各人が名乗り出る確率は約' + Math.round(VOL_EQ.p * 100) + '%、誰も名乗り出ない確率は約' + Math.round(VOL_EQ.none * 100) + '%で、人数が増えるほど各人は名乗り出にくくなる（Diekmann 1985）。つまり「ほかの人が出る可能性が高いので自分は待つ」は均衡でも起きる合理的な推論である。ほかの人が出る見込みや誰も出ないリスクを考えたうえで待つ・出るのは rational。「誰かが必ずやる」と根拠なく確信し、誰も出ないリスクをまったく考えていない場合に限って bias（責任の分散）とする。' };
    case 'ultimatum': return { name: '最後通牒ゲーム（一回限り）', rules: '1000ゴールドを二人で分ける。分ける側が相手に渡す額を提案し、受け取る側は乗るか断るかだけ選ぶ。断ると二人とも0。学生は分ける側（提案額）と受け取る側（受け入れる最低額）の両方を決めた（この回答は' + (r.role === 'proposer' ? '分ける側' : '受け取る側') + 'の理由）。お金だけを考える相手を想定すると、受け取る側は1でも乗るのが合理的で、それを見越した分ける側は最小額を提案する。ただし実際の人は不公平な提案を断ることが多いので、「低すぎると断られそうだから多めに渡す」は相手の予測にもとづく合理的な推論である。' };
    case 'dictator': return { name: '独裁者ゲーム（一回限り）', rules: '商店街の福引きで当たった1000円分の券を、列でたまたま隣になった見知らぬ相手と分ける。分け方は学生（回した人）が一人で決め、相手は断ることも文句を言うこともできない。匿名で、二度と会わない。お金だけを考えると0円渡すのが自己利益の最大化。最後通牒ゲームと違って断られる心配がないので、ここで渡す額は戦略ではなく、利他性・公平の規範・罪悪感・相手への共感などを反映する。「断られないので少なめ（または0円）」は自己利益にもとづく合理的な推論。「半分が公平」は規範的。学生はあわせて「ほかの人は平均いくら渡すと思うか」も答えた。' };
    case 'trust':
      return { name: '信頼ゲーム（一回限り）', rules: '預ける側は種かぶを10個持つ。名人（相手）に預けた分は畑で3倍になり、名人は収穫のうち何%を返すかを自由に決める（約束も契約もない）。学生は両方の役を決めた（この回答は' + (r.role === 'investor' ? '預ける側（何個預けるか）' : '名人の側（収穫の何%を返すか）') + 'の理由）。自己利益だけを考えると、名人は0%返し、それを見越した預ける側は0個預けるのが均衡。名人が収穫の1/3より多く返せば、預ける側は預けたほうが得をする。二人の合計は全部預けたとき最大（30個）。' +
        (r.role === 'investor' ? '「名人は○%くらい返すだろうから預けても得」「返ってこないリスクがあるので少しだけ」は相手の予測とリスクにもとづく合理的な推論。「人を信じたい」は規範的。' : '「預けてくれた信頼に応えたい」「恩返し」は規範的（互恵性）。「返しても自分の得にならないので0%」は自己利益にもとづく合理的な推論。') };
    case 'ipd_known':
    case 'ipd_unknown':
      var n = +d.totalRounds || 10;
      var bot = d.bot === 'gtft' ? '寛容なしっぺ返し（1週目は据え置き。以降はあなたの前の週の手をまねるが、値下げされても1/3の確率で許して据え置く）' : 'しっぺ返し（1週目は据え置き。以降はあなたの前の週の手をそのまままねる）';
      var base = '向かいのラーメン屋（ゲンさん）と毎週「据え置き（協力）」か「値下げ（裏切り）」を同時に選ぶ。' + PAY_IPD + 'ゲンさんは人間ではなくプログラムで、作戦は' + bot + 'に固定。学生には「ゲンさんは前の週のあなたを見て値段を決めているようだ」とだけ伝えている。相手が自分の前の週の手に反応するので、「自分が据え置けば相手も据え置く」「値下げすると次の週に仕返しされる」はこの相手については事実として正しい推論であり、魔術的思考などのバイアスではない。';
      if (r.game === 'ipd_known') {
        return { name: '繰り返し囚人のジレンマ（回数が既知・' + n + '週）', rules: base + '終わりが' + n + '週目だと学生もゲンさんも知っている。この相手に対する最適は、' + (n - 1) + '週目まで据え置いて最終週だけ値下げすること（' + ((n - 1) * 30 + 50) + '万円）。全週据え置きは' + (n * 30) + '万円、初週から値下げし続けると' + (50 + (n - 1) * 10) + '万円。' +
          '後ろ向き帰納法で「初週から裏切るのが合理的」になるのは、相手も合理的に後ろ向き帰納法で考える場合の話で、この相手（前の週をまねるだけ）には当てはまらない。判定では次を区別する：' +
          '(a)「最終週は仕返しされないので値下げ」＝この相手に対する最適な推論で rational。' +
          '(b)「相手はまねするので協力を続ける」＝この相手について正しい推論で rational。' +
          '(c)「後ろ向き帰納法により最初から値下げ」＝ゲーム理論にもとづく推論なので rational とするが、相手が合理的だという前提をおいている点を why か comment で短く指摘してよい。' };
      }
      return { name: '繰り返し囚人のジレンマ（回数が未知）', rules: base + '何週続くかは学生に知らされていない（学生は知らないが、実際の週数は8〜12週でランダム。今回は' + n + '週で終了）。終わりがわからない限り、この相手には据え置きを続けるのが最適に近い。「いつ終わるかわからないので協力を続ける」は rational。「そろそろ終わりそう」と推測して値下げするのも、終わりの推測にもとづく推論として扱う。' };
  }
  return { name: r.game, rules: '' };
}

var SYSTEM_PROMPT = [
  'あなたは社会心理学・行動経済学の授業の補助者です。',
  '大学生がゲーム理論の課題（物語つきのゲーム）で選択をし、その理由を書きました。',
  '理由の記述を、次の4つの観点から独立に評価してください。1つの理由に複数の観点が含まれてもかまいません。',
  '',
  '- rational（合理的）: 利得・確率・期待値・相手の出方の予測、支配戦略、リスクの比較、繰り返しでの評判や仕返しの計算など、',
  '  結果（自分または二人の合計）をよくするための計算や推論が根拠になっている。',
  '  例「相手がどちらを選んでも自白したほうが刑期が短い」「0点のリスクを避けて確実な3点をとる」「最後の週は仕返しされないので値下げ」',
  '- emotional（感情的）: 恐れ・不安・怒り・罪悪感・後悔の予期・好き嫌い・気分・相手への情など、感情や情動が根拠になっている。',
  '  例「10年はこわい」「低い金額を出されたらむかつくので断る」「ゴキブリが本当に無理」',
  '- normative（規範的）: 公平・平等・信頼・約束・正直・仲間を裏切らない・恩返しなど、「こうあるべき」という道徳や社会規範が根拠になっている。',
  '  例「半分ずつが公平」「相棒を裏切るのはずるい」「みんなのためにやるべき」',
  '- bias（認知バイアス）: 判断に既知の認知バイアスやヒューリスティックの影響がはっきり読み取れる。',
  '  例：フォールス・コンセンサス（相手も自分と同じに考えると根拠なく思い込む）、',
  '  責任の分散・傍観者効果（「誰かが必ずやる」と根拠なく確信し、誰もやらないリスクを考えていない。確率やリスクを考えたうえで待つのは合理的でありバイアスではない）、',
  '  楽観バイアス、損失回避、確実性効果、ゼロリスク志向、',
  '  魔術的思考（一回限りの同時手番ゲームに限る：自分が協力すれば相手も協力するはず、と考える。繰り返しゲームで相手が自分の過去の手に反応する場合は正しい推論なのでバイアスではない）、',
  '  アンカリング（50:50などの区切りに引っぱられる）、',
  '  現状維持バイアス、ギャンブラーの誤謬、後知恵・結果バイアス、自己奉仕バイアスなど。',
  '  bias が true のときは、最も当てはまるバイアス名を1つ、日本語で name に書く。',
  '  ゲーム理論の均衡と違う選択をしたこと自体はバイアスではない。思い込みや推論のゆがみが記述から読み取れるときだけ true にする。',
  '',
  '「合理的かどうか」「推論が正しいかどうか」は、一般論ではなく、ユーザーメッセージのルール説明に書かれた相手の性質・均衡・最適解を基準に判断する。',
  '',
  'primary には、理由の中心を担っている観点を1つだけ選ぶ（rational / emotional / normative / bias）。',
  '理由が空・短すぎる・ゲームと無関係・「なんとなく」だけで判断できない場合は primary を unclear にする。',
  '各観点の why は、学生の言葉を短く引きながら、なぜそう判断したかを日本語1文（60字以内）で書く。yes が false の観点の why は空文字。',
  'comment には、学生がふりかえりに使える一言（40字以内、やさしい口調、評価や説教はしない）を書く。',
  '',
  '出力は次の形のJSONだけ。前後に文章を書かない。',
  '{"primary":"rational|emotional|normative|bias|unclear",',
  ' "rational":{"yes":true,"why":""},"emotional":{"yes":false,"why":""},"normative":{"yes":false,"why":""},',
  ' "bias":{"yes":false,"name":"","why":""},"comment":""}'
].join('\n');

/* ================= エントリポイント ================= */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'results') return json_({ ok: true, rows: publicRows_(readAll_(), false) });
    if (p.action === 'status') return json_({ ok: true, open: openGames_() });
    return json_({ ok: true, message: 'dilemma api is running' });
  } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
}

function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'JSONを読めませんでした' }); }
  try {
    switch (b.action) {
      case 'submit': return json_(submit_(b));
      case 'results': return json_({ ok: true, rows: publicRows_(readAll_(), false) });
      case 'teacherRows': auth_(b); return json_({ ok: true, rows: publicRows_(readAll_(), true) });
      case 'classify': auth_(b); return json_(classify_(b));
      case 'relabel': auth_(b); return json_(relabel_(b));
      case 'status': return json_({ ok: true, open: openGames_() });
      case 'setOpen': auth_(b); return json_(setOpen_(b));
    }
    return json_({ ok: false, error: '不明な操作です' });
  } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); }
}

/* ================= 保存と相手の抽選 ================= */
function submit_(b) {
  var rows = b.rows || [];
  if (!rows.length || rows.length > 4) throw new Error('送信データがありません');
  var open = openGames_();
  rows.forEach(function (r) {
    if (open.indexOf(gateKey_(r.game)) < 0) throw new Error('この課題はいま受け付けていません（先生が開放するまで待ってください）');
  });
  rows.forEach(function (r) {
    if (GAMES.indexOf(r.game) < 0) throw new Error('ゲームIDが不正です');
    if (!String(r.studentId || '').trim()) throw new Error('学籍番号がありません');
    if (!String(r.nickname || '').trim()) throw new Error('ニックネームがありません');
    if (r.game !== 'nashquiz' && String(r.reason || '').trim().length < 5) throw new Error('理由が短すぎます');
  });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var existing = readAll_();
    var sh = sheet_();
    var out = [], ids = [], partners = [];
    rows.forEach(function (r) {
      var sid = clean_(r.studentId, 32).toUpperCase();
      var pidv = pid_(sid);
      var det = (r.detail && typeof r.detail === 'object') ? r.detail : {};
      if (/^ipd_/.test(r.game)) {
        // 繰り返しPDを前にやったことがあるか（順序効果の分析用。「初回プレイのみ」の絞り込みに使う）
        var prev = existing.filter(function (x) { return x.pid === pidv && /^ipd_/.test(x.game); });
        det.priorIPD = prev.length > 0;
        det.priorOther = prev.some(function (x) { return x.game !== r.game; });
      }
      if (r.game === 'stag' && !det.stagValue) det.stagValue = 6;
      if (r.game === 'nashquiz') det.attempt = existing.filter(function (x) { return x.pid === pidv && x.game === 'nashquiz'; }).length + 1;
      var row = {
        id: Utilities.getUuid(), timestamp: new Date(), game: r.game, role: clean_(r.role, 20),
        studentId: sid, pid: pidv, nickname: clean_(r.nickname, 24), sessionId: clean_(r.sessionId, 40),
        choice: clean_(r.choice, 40), choiceLabel: clean_(r.choiceLabel, 80), expect: clean_(r.expect, 40), expectLabel: clean_(r.expectLabel, 80),
        reason: clean_(r.reason, MAX_REASON), detail: JSON.stringify(det).slice(0, 45000), userAgent: clean_(r.ua, 200)
      };
      partners.push(match_(existing, row, r.match));
      ids.push(row.id);
      out.push(HEAD.map(function (h) { return row[h] != null ? row[h] : ''; }));
    });
    sh.getRange(sh.getLastRow() + 1, 1, out.length, HEAD.length).setValues(out);
    return { ok: true, ids: ids, partners: partners };
  } finally { lock.releaseLock(); }
}

function match_(all, me, m) {
  if (!m) return [];
  var pool = all.filter(function (r) { return r.game === me.game && r.pid !== me.pid && (!m.role || r.role === m.role); });
  pool = latest_(pool);
  if (pool.length < Math.max(1, +m.min || 1)) return []; // 足りなければ空 → 画面側でコンピュータの代役
  shuffle_(pool);
  return pool.slice(0, Math.min(m.k || 1, 4)).map(function (r) { return { choice: String(r.choice), role: r.role }; });
}

/* ================= AI分類 ================= */
function classify_(b) {
  var limit = Math.max(1, Math.min(+b.limit || 10, 20));
  var all = readAll_();
  var todo = all.filter(function (r) { return !r.aiPrimary && String(r.reason || '').trim() && (!b.game || r.game === b.game); });
  var batch = todo.slice(0, limit);
  if (!batch.length) return { ok: true, done: 0, remaining: 0, errors: [] };

  var props = PropertiesService.getScriptProperties();
  var provider = (props.getProperty('AI_PROVIDER') || 'openai').toLowerCase();
  var reqs = batch.map(function (r) { return buildRequest_(provider, props, r); });
  var resps = UrlFetchApp.fetchAll(reqs);
  var sh = sheet_(), errors = [], done = 0;
  var col = HEAD.indexOf('aiPrimary') + 1;
  var model = provider === 'anthropic' ? (props.getProperty('ANTHROPIC_MODEL') || 'claude-haiku-5-5') : (props.getProperty('OPENAI_MODEL') || 'gpt-4.1-mini');

  resps.forEach(function (res, i) {
    var r = batch[i];
    try {
      if (res.getResponseCode() >= 300) throw new Error('API ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 160));
      var body = JSON.parse(res.getContentText());
      var text = provider === 'anthropic'
        ? (body.content || []).map(function (c) { return c.text || ''; }).join('')
        : body.choices[0].message.content;
      var j = parseJson_(text);
      var prim = LABELS.indexOf(j.primary) >= 0 ? j.primary : 'unclear';
      var flags = ['rational', 'emotional', 'normative', 'bias'].filter(function (k) { return j[k] && j[k].yes; });
      var why = prim === 'unclear' ? (j.comment || '理由から判断できませんでした。') : ((j[prim] && j[prim].why) || '');
      var vals = [prim, flags.join(','), (j.bias && j.bias.yes && j.bias.name) || '', why, JSON.stringify(j), model, new Date()];
      sh.getRange(r._row, col, 1, vals.length).setValues([vals]);
      done++;
    } catch (err) { errors.push(String(err.message || err)); }
  });
  return { ok: true, done: done, remaining: todo.length - done, errors: errors };
}

function buildRequest_(provider, props, r) {
  var info = gameInfo_(r);
  var role = r.game === 'ultimatum' ? (r.role === 'proposer' ? '分ける側（提案者）' : '受け取る側（応答者）')
    : r.game === 'bos' ? (r.role === 'A' ? 'フェスが好きな側' : '美術館が好きな側') : '';
  var user = [
    'ゲーム: ' + info.name,
    'ルール: ' + info.rules,
    role ? '学生の役割: ' + role : '',
    '学生の選択: ' + (r.choiceLabel || r.choice),
    r.expectLabel ? '相手（ほかの人）についての予想: ' + r.expectLabel : '',
    '学生が書いた理由:',
    '"""', String(r.reason).slice(0, MAX_REASON), '"""'
  ].filter(String).join('\n');

  if (provider === 'anthropic') {
    var key = props.getProperty('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY が設定されていません');
    return {
      url: 'https://api.anthropic.com/v1/messages', method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: props.getProperty('ANTHROPIC_MODEL') || 'claude-haiku-5-5', max_tokens: 900, temperature: 0, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: user }] })
    };
  }
  var okey = props.getProperty('OPENAI_API_KEY');
  if (!okey) throw new Error('OPENAI_API_KEY が設定されていません');
  return {
    url: 'https://api.openai.com/v1/chat/completions', method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + okey },
    payload: JSON.stringify({
      model: props.getProperty('OPENAI_MODEL') || 'gpt-4.1-mini', temperature: 0, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: user }]
    })
  };
}

function parseJson_(text) {
  var m = String(text).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AIの出力がJSONではありません');
  return JSON.parse(m[0]);
}

function relabel_(b) {
  if (b.label && LABELS.indexOf(b.label) < 0) throw new Error('分類名が不正です');
  var all = readAll_();
  var r = all.filter(function (x) { return x.id === b.id; })[0];
  if (!r) throw new Error('回答が見つかりません');
  var c = HEAD.indexOf('teacherLabel') + 1;
  sheet_().getRange(r._row, c, 1, 2).setValues([[b.label || '', b.label ? new Date() : '']]);
  return { ok: true };
}

/* ================= 共通 ================= */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function readAll_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var v = sh.getRange(1, 1, last, HEAD.length).getValues();
  var head = v[0];
  return v.slice(1).map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, j) { o[h] = r[j]; });
    return o;
  }).filter(function (o) { return o.id; });
}
function publicRows_(rows, teacher) {
  return rows.map(function (r) {
    var o = {
      id: r.id, ts: iso_(r.timestamp), game: r.game, role: r.role, pid: r.pid, nickname: r.nickname,
      choice: String(r.choice), choiceLabel: r.choiceLabel, expect: String(r.expect), expectLabel: r.expectLabel,
      reason: r.reason, detail: safeParse_(r.detail),
      aiPrimary: r.aiPrimary, aiFlags: r.aiFlags, aiBias: r.aiBias, aiReason: r.aiReason, aiDetail: safeParse_(r.aiDetail),
      teacherLabel: r.teacherLabel
    };
    if (teacher) { o.studentId = r.studentId; o.aiModel = r.aiModel; }
    return o;
  });
}
function latest_(rows) {
  var m = {};
  rows.forEach(function (r) {
    var k = r.game + '|' + r.role + '|' + r.pid;
    if (!m[k] || new Date(r.timestamp) > new Date(m[k].timestamp)) m[k] = r;
  });
  return Object.keys(m).map(function (k) { return m[k]; });
}
/* ================= 課題の開放（先生が開けたものだけ遊べる） =================
 * スクリプト プロパティ OPEN_GAMES に開放中のキーを JSON 配列で保存する。
 * 繰り返しPDは2条件まとめて 'ipd' で開閉する。 */
var GATE_KEYS = ['pd', 'bos', 'stag', 'chicken', 'volunteer', 'ultimatum', 'dictator', 'trust', 'ipd', 'nashquiz'];
function gateKey_(game) { return /^ipd/.test(String(game)) ? 'ipd' : String(game); }
function openGames_() {
  // 学生の画面が数秒おきに問い合わせるので、キャッシュから返す（開閉したときに更新）
  var cache = CacheService.getScriptCache(), v = cache.get('OPEN_GAMES');
  if (v == null) { v = PropertiesService.getScriptProperties().getProperty('OPEN_GAMES') || '[]'; cache.put('OPEN_GAMES', v, 60); }
  try { var a = v ? JSON.parse(v) : []; return a.filter(function (k) { return GATE_KEYS.indexOf(k) >= 0; }); } catch (e) { return []; }
}
function setOpen_(b) {
  var cur = openGames_();
  if (b.all === true) cur = GATE_KEYS.slice();
  else if (b.all === false) cur = [];
  else {
    var k = gateKey_(b.key);
    if (GATE_KEYS.indexOf(k) < 0) throw new Error('課題IDが不正です');
    cur = cur.filter(function (x) { return x !== k; });
    if (b.open) cur.push(k);
  }
  PropertiesService.getScriptProperties().setProperty('OPEN_GAMES', JSON.stringify(cur));
  CacheService.getScriptCache().put('OPEN_GAMES', JSON.stringify(cur), 60);
  return { ok: true, open: cur };
}

function auth_(b) {
  var pw = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
  if (!pw) throw new Error('TEACHER_PASSWORD が設定されていません');
  if (String(b.password || '') !== pw) throw new Error('パスワードが違います');
}
function pid_(sid) {
  var salt = PropertiesService.getScriptProperties().getProperty('PID_SALT') || 'dilemma';
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + sid, Utilities.Charset.UTF_8);
  return d.slice(0, 5).map(function (x) { return ('0' + (x & 0xff).toString(16)).slice(-2); }).join('');
}
function clean_(s, n) {
  var t = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
  return /^[=+\-@]/.test(t) ? "'" + t : t; // 数式として解釈されないように
}
function iso_(d) { return d instanceof Date ? d.toISOString() : String(d || ''); }
function safeParse_(s) { if (!s) return {}; if (typeof s === 'object') return s; try { return JSON.parse(s); } catch (e) { return {}; } }
function shuffle_(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ================= 手動実行用 ================= */
/** 初回に一度実行：シートを作り、権限を承認する */
function setup() {
  sheet_();
  Logger.log('シート「' + SHEET_NAME + '」を用意しました。');
}
/** API キーの動作確認：ダミーの理由を1件だけ分類してログに出す（シートには書きません） */
function testClassify() {
  var props = PropertiesService.getScriptProperties();
  var provider = (props.getProperty('AI_PROVIDER') || 'openai').toLowerCase();
  var req = buildRequest_(provider, props, { game: 'pd', role: '', choiceLabel: '自白する', expectLabel: '自白する', reason: '相手がどっちを選んでも自白したほうが短くなる。それにポン太はきっと裏切ると思う。' });
  var url = req.url; delete req.url;
  var res = UrlFetchApp.fetch(url, req);
  Logger.log(res.getResponseCode() + ' ' + res.getContentText().slice(0, 1500));
}
