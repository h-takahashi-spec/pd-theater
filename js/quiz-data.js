/* ============================================================
 * ナッシュ均衡の課題（純粋戦略5問・混合戦略3問）
 * 利得は [Aの利得, Bの利得]。A＝行（上・中・下）、B＝列（左・中・右）。
 * 正解は下の関数で利得表から自動計算する（手入力の答えとの食い違いを防ぐ）。
 * ============================================================ */
(function () {
  var R3 = ['上', '中', '下'], C3 = ['左', '中', '右'], R2 = ['上', '下'], C2 = ['左', '右'];
  var Q = [
    { id: 'p1', kind: 'pure', rows: R2, cols: C2, M: [[[3, 2], [1, 1]], [[2, 1], [0, 3]]] },
    { id: 'p2', kind: 'pure', rows: R2, cols: C2, M: [[[2, 0], [0, 1]], [[0, 3], [1, 0]]] },
    { id: 'p3', kind: 'pure', rows: R3, cols: C3, M: [[[0, 4], [4, 0], [5, 3]], [[4, 0], [0, 4], [5, 3]], [[3, 5], [3, 5], [6, 6]]] },
    { id: 'p4', kind: 'pure', rows: R3, cols: C3, M: [[[5, 4], [1, 1], [2, 0]], [[3, 2], [4, 5], [0, 3]], [[1, 3], [2, 1], [3, 2]]] },
    { id: 'p5', kind: 'pure', rows: R3, cols: C3, M: [[[4, 3], [1, 4], [2, 2]], [[3, 1], [2, 5], [5, 0]], [[2, 2], [3, 3], [1, 1]]] },
    { id: 'm1', kind: 'mixed', rows: R2, cols: C2, M: [[[4, 1], [1, 3]], [[2, 2], [3, 1]]], ask: ['p', 'q'] },
    { id: 'm2', kind: 'mixed', rows: R2, cols: C2, M: [[[2, 1], [0, 0]], [[0, 0], [1, 3]]], ask: ['p', 'q'] },
    { id: 'm3', kind: 'mixed', rows: R2, cols: C2, M: [[[0, 0], [4, 1]], [[1, 3], [2, 2]]], ask: ['p', 'q', 'ea'] }
  ];

  /* 分数 */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function frac(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g, v: n / d, s: (d / g === 1 ? String(n / g) : (n / g) + '/' + (d / g)) }; }

  /* 最適反応と純粋戦略の均衡 */
  function bestResponses(M) {
    var R = M.length, C = M[0].length, brA = [], brB = [];
    for (var j = 0; j < C; j++) { var m = -1e9; for (var i = 0; i < R; i++) m = Math.max(m, M[i][j][0]); for (i = 0; i < R; i++) if (M[i][j][0] === m) brA.push(i + ',' + j); }
    for (var i2 = 0; i2 < R; i2++) { var m2 = -1e9; for (var j2 = 0; j2 < C; j2++) m2 = Math.max(m2, M[i2][j2][1]); for (j2 = 0; j2 < C; j2++) if (M[i2][j2][1] === m2) brB.push(i2 + ',' + j2); }
    var ne = brA.filter(function (k) { return brB.indexOf(k) >= 0; });
    return { brA: brA, brB: brB, ne: ne };
  }
  /* 2×2 の混合戦略の均衡：p＝Aが上の確率、q＝Bが左の確率 */
  function mixed(M) {
    var a11 = M[0][0][0], a12 = M[0][1][0], a21 = M[1][0][0], a22 = M[1][1][0];
    var b11 = M[0][0][1], b12 = M[0][1][1], b21 = M[1][0][1], b22 = M[1][1][1];
    var q = frac(a22 - a12, (a11 - a12) - (a21 - a22));
    var p = frac(b22 - b21, (b11 - b21) - (b12 - b22));
    var ea = frac(a11 * q.n + a12 * (q.d - q.n), q.d);
    var eb = frac(b11 * p.n + b21 * (p.d - p.n), p.d);
    return { p: p, q: q, ea: ea, eb: eb };
  }
  Q.forEach(function (q, i) {
    q.no = i + 1;
    q.br = bestResponses(q.M);
    if (q.kind === 'mixed') q.mx = mixed(q.M);
  });
  // 想定した答えと一致するかの自己点検（開発用）
  var expect = { p1: ['0,0'], p2: [], p3: ['2,2'], p4: ['0,0', '1,1'], p5: ['2,1'] };
  Q.forEach(function (q) { if (expect[q.id] && expect[q.id].join('|') !== q.br.ne.join('|')) console.error('answer mismatch', q.id); });

  window.NQ = { questions: Q, frac: frac, LABELS: { p: 'p（A が「上」を選ぶ確率）', q: 'q（B が「左」を選ぶ確率）', ea: 'このときの A の期待利得' } };
})();
