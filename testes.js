// Testes de validação da seção 6 do enunciado.
// Rodam na página (botão "Executar testes") e no Node (node run-tests.js).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./colonia.js'));
  else root.Testes = factory(root.Colonia);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  const TOL = 0.000001;
  const perto = (a, b) => Math.abs(a - b) <= TOL;
  const VERT = [{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 3, y: 0 }, { id: 'C', x: 3, y: 4 }, { id: 'D', x: 0, y: 4 }];
  const ID = { A: 0, B: 1, C: 2, D: 3 };
  const rota = (s) => s.split('').map((c) => ID[c]);
  const nome = (r) => r.map((i) => VERT[i].id).join(' → ');
  const f = (x, d = 6) => Number(x.toFixed(d)).toLocaleString('pt-BR', { maximumFractionDigits: d });
  const BASE = { vertices: VERT, deposito: 0, numeroFormigas: 10, numeroIteracoes: 30, alfa: 1, beta: 2, rho: 0.5, tau0: 1, Q: 14, semente: 42 };
  const sistema = (extra) => new C.AntSystem(Object.assign({}, BASE, extra || {}));
  const aresta = (arestas, a, b) => arestas.find((x) => x.i === ID[a] && x.j === ID[b]);
  const logAresta = (x) => `anterior ${f(x.anterior)}; após evaporação ${f(x.aposEvaporacao)}; depósito ${f(x.deposito)}; final ${f(x.final)}`;

  function executarTestes() {
    const testes = [];
    const add = (t) => testes.push(t);

    // ---------- 6.1 ----------
    const d = C.matrizDistancias(VERT);
    const esperadoD = { AB: 3, AC: 5, AD: 4, BC: 4, BD: 5, CD: 3 };
    add({
      id: '6.1', titulo: 'Distâncias euclidianas',
      entrada: 'A = (0,0), B = (3,0), C = (3,4), D = (0,4)',
      esperado: 'A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3; d(i,i) = 0; matriz simétrica',
      obtido: Object.keys(esperadoD).map((k) => `${k[0]}-${k[1]} = ${f(d[ID[k[0]]][ID[k[1]]])}`).join(', ') + `; diagonal ${[0, 1, 2, 3].every((i) => d[i][i] === 0) ? '0' : 'diferente de 0'}`,
      ok: Object.keys(esperadoD).every((k) => perto(d[ID[k[0]]][ID[k[1]]], esperadoD[k]) && perto(d[ID[k[1]]][ID[k[0]]], esperadoD[k])) && [0, 1, 2, 3].every((i) => d[i][i] === 0),
    });

    const rotas6 = { ABCDA: 14, ABDCA: 16, ACBDA: 18, ACDBA: 16, ADBCA: 18, ADCBA: 14 };
    add({
      id: '6.1', titulo: 'Comprimento das seis rotas a partir de A',
      entrada: 'as seis permutações de B, C e D, saindo e voltando a A',
      esperado: 'ABCDA 14, ABDCA 16, ACBDA 18, ACDBA 16, ADBCA 18, ADCBA 14',
      obtido: Object.keys(rotas6).map((r) => `${r} ${f(C.calcularComprimentoRota(rota(r), d))}`).join(', '),
      ok: Object.keys(rotas6).every((r) => perto(C.calcularComprimentoRota(rota(r), d), rotas6[r])),
    });

    const invalidas = { 'ABCA (incompleta)': 'ABCA', 'ABBDA (repete B)': 'ABBDA', 'BACDB (não começa no depósito)': 'BACDB', 'ABCDB (não volta ao depósito)': 'ABCDB' };
    add({
      id: '6.1', titulo: 'Rotas inválidas são rejeitadas',
      entrada: Object.keys(invalidas).join('; '),
      esperado: 'todas inválidas; ABCDA válida',
      obtido: Object.keys(invalidas).map((k) => `${invalidas[k]} ${C.rotaValida(rota(invalidas[k]), 4, 0) ? 'válida' : 'inválida'}`).join('; ') + `; ABCDA ${C.rotaValida(rota('ABCDA'), 4, 0) ? 'válida' : 'inválida'}`,
      ok: Object.values(invalidas).every((r) => !C.rotaValida(rota(r), 4, 0)) && C.rotaValida(rota('ABCDA'), 4, 0),
    });

    // ---------- 6.2 ----------
    const tau1 = C.matrizFeromonios(4, 1);
    let p = C.calcularProbabilidades(tau1, d, 0, [1, 2, 3], 1, 2);
    const soma = p.reduce((s, x) => s + x.probabilidade, 0);
    add({
      id: '6.2', titulo: 'Probabilidades a partir de A',
      entrada: 'formiga em A; τ = 1; α = 1; β = 2; candidatos B, C, D',
      esperado: 'w = 1/9, 1/25, 1/16; p(A,B) = 400/769 ≈ 0,520156; p(A,C) = 144/769 ≈ 0,187256; p(A,D) = 225/769 ≈ 0,292588; soma 1',
      obtido: `w = ${p.map((x) => f(x.peso)).join(', ')}; p = ${p.map((x) => f(x.probabilidade)).join(', ')}; soma ${f(soma)}`,
      ok: perto(p[0].peso, 1 / 9) && perto(p[1].peso, 1 / 25) && perto(p[2].peso, 1 / 16) &&
        perto(p[0].probabilidade, 400 / 769) && perto(p[1].probabilidade, 144 / 769) && perto(p[2].probabilidade, 225 / 769) && perto(soma, 1),
    });

    p = C.calcularProbabilidades(tau1, d, 1, [2, 3], 1, 2);
    add({
      id: '6.2', titulo: 'Probabilidades depois de visitar B',
      entrada: 'formiga em B; A e B visitados; candidatos C, D',
      esperado: 'p(B,C) = 25/41 ≈ 0,609756; p(B,D) = 16/41 ≈ 0,390244; A e B fora do sorteio',
      obtido: `candidatos ${p.map((x) => VERT[x.vertice].id).join(', ')}; p(B,C) = ${f(p[0].probabilidade)}; p(B,D) = ${f(p[1].probabilidade)}`,
      ok: p.length === 2 && p[0].vertice === 2 && p[1].vertice === 3 && perto(p[0].probabilidade, 25 / 41) && perto(p[1].probabilidade, 16 / 41),
    });

    const tauVar = C.matrizFeromonios(4, 1);
    tauVar[0][1] = tauVar[1][0] = 7; tauVar[0][3] = tauVar[3][0] = 0.2;
    p = C.calcularProbabilidades(tauVar, d, 0, [1, 2, 3], 0, 0);
    const p1 = C.calcularProbabilidades(tau1, d, 2, [3], 1, 2);
    add({
      id: '6.2', titulo: 'α = 0 e β = 0; um único candidato',
      entrada: 'formiga em A com feromônios diferentes (AB = 7, AD = 0,2); depois, formiga em C com só D restante',
      esperado: 'com α = β = 0, p = 1/3 para cada candidato; com um candidato, p = 1',
      obtido: `p = ${p.map((x) => f(x.probabilidade)).join(', ')}; candidato único p = ${f(p1[0].probabilidade)}`,
      ok: p.every((x) => perto(x.probabilidade, 1 / 3)) && p1.length === 1 && perto(p1[0].probabilidade, 1),
    });

    // Sorteio proporcional: com 30 mil sorteios a frequência se aproxima das probabilidades
    const g = C.criarGerador(7);
    const conta = [0, 0, 0];
    p = C.calcularProbabilidades(tau1, d, 0, [1, 2, 3], 1, 2);
    for (let k = 0; k < 30000; k++) conta[C.sortearProximoVertice(p, g).vertice - 1]++;
    const freq = conta.map((c) => c / 30000);
    add({
      id: '6.2', titulo: 'Sorteio proporcional (não escolhe sempre o maior peso)',
      entrada: '30.000 sorteios a partir de A com as probabilidades acima, semente 7',
      esperado: 'B, C e D escolhidos com frequências próximas de 52%, 19% e 29%',
      obtido: `B ${f(freq[0] * 100, 1)}%, C ${f(freq[1] * 100, 1)}%, D ${f(freq[2] * 100, 1)}%`,
      ok: conta.every((c) => c > 0) && Math.abs(freq[0] - 400 / 769) < 0.02 && Math.abs(freq[1] - 144 / 769) < 0.02 && Math.abs(freq[2] - 225 / 769) < 0.02,
    });

    // ---------- 6.3 ----------
    let s = sistema({ numeroFormigas: 1, numeroIteracoes: 2 });
    s.executarIteracao([rota('ABCDA')]);
    let arestas = s.registros[0].arestas;
    const perim = ['AB', 'BC', 'CD', 'AD'], diag = ['AC', 'BD'];
    const val = (sis, k) => sis.feromonios[ID[k[0]]][ID[k[1]]];
    add({
      id: '6.3', titulo: 'Evaporação e depósito, 1ª iteração',
      entrada: 'τ₀ = 1; ρ = 50%; Q = 14; 1 formiga com rota forçada A → B → C → D → A (L = 14)',
      esperado: 'após evaporação todas 0,5; depósito 1 em AB, BC, CD, AD; final AB = BC = CD = AD = 1,5 e AC = BD = 0,5',
      obtido: `após evaporação ${[...new Set(arestas.map((x) => f(x.aposEvaporacao)))].join(', ')}; final ${perim.concat(diag).map((k) => `${k} = ${f(val(s, k))}`).join(', ')}`,
      ok: arestas.every((x) => perto(x.aposEvaporacao, 0.5)) && perim.every((k) => perto(val(s, k), 1.5)) && diag.every((k) => perto(val(s, k), 0.5)),
    });
    add({
      id: '6.3', titulo: 'Log das arestas AB e AC',
      entrada: 'mesma iteração do teste anterior',
      esperado: 'AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5. AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5',
      obtido: `AB: ${logAresta(aresta(arestas, 'A', 'B'))}. AC: ${logAresta(aresta(arestas, 'A', 'C'))}`,
      ok: logAresta(aresta(arestas, 'A', 'B')) === 'anterior 1; após evaporação 0,5; depósito 1; final 1,5' &&
        logAresta(aresta(arestas, 'A', 'C')) === 'anterior 1; após evaporação 0,5; depósito 0; final 0,5',
    });
    s.executarIteracao([rota('ABCDA')]);
    add({
      id: '6.3', titulo: 'Evaporação e depósito, 2ª iteração',
      entrada: 'continuação, com a mesma rota forçada',
      esperado: 'perímetro 1,75; diagonais 0,25',
      obtido: perim.concat(diag).map((k) => `${k} = ${f(val(s, k))}`).join(', '),
      ok: perim.every((k) => perto(val(s, k), 1.75)) && diag.every((k) => perto(val(s, k), 0.25)),
    });
    s = sistema({ numeroFormigas: 2, numeroIteracoes: 1 });
    s.executarIteracao([rota('ABCDA'), rota('ABCDA')]);
    add({
      id: '6.3', titulo: 'Duas formigas na mesma rota',
      entrada: 'τ₀ = 1; ρ = 50%; Q = 14; 2 formigas com a rota A → B → C → D → A',
      esperado: 'perímetro 2,5; diagonais 0,5 (depósitos somados, sem atualizar durante a construção)',
      obtido: perim.concat(diag).map((k) => `${k} = ${f(val(s, k))}`).join(', '),
      ok: perim.every((k) => perto(val(s, k), 2.5)) && diag.every((k) => perto(val(s, k), 0.5)),
    });
    s = sistema({ numeroFormigas: 1, numeroIteracoes: 1 });
    s.executarIteracao([rota('ABCDA')]);
    const sim = [0, 1, 2, 3].every((i) => [0, 1, 2, 3].every((j) => s.feromonios[i][j] === s.feromonios[j][i]));
    add({
      id: '6.3', titulo: 'Simetria e diagonal',
      entrada: 'matriz de feromônios após a 1ª iteração',
      esperado: 'τ(i,j) = τ(j,i) e diagonal sem feromônio (0)',
      obtido: `${sim ? 'simétrica' : 'não simétrica'}; diagonal ${[0, 1, 2, 3].map((i) => s.feromonios[i][i]).join(', ')}`,
      ok: sim && [0, 1, 2, 3].every((i) => s.feromonios[i][i] === 0),
    });

    // ---------- 6.4 ----------
    const a = sistema();
    const inicial = { tau: [0, 1, 2, 3].every((i) => [0, 1, 2, 3].every((j) => i === j || a.feromonios[i][j] === 1)), rota: a.melhorRota, dist: a.melhorDistancia };
    a.executarAteOFim();
    const b = sistema().executarAteOFim();
    const passo = sistema();
    for (let k = 0; k < 12; k++) passo.executarIteracao();
    passo.executarAteOFim();
    const hist = JSON.stringify(a.historico);
    let rotasOk = true;
    a.registros.forEach((r) => r.formigas.forEach((fm) => {
      if (!C.rotaValida(fm.rota, 4, 0) || ![14, 16, 18].some((L) => perto(fm.comprimento, L))) rotasOk = false;
    }));
    const naoAumenta = a.historico.every((h, i) => i === 0 || h.melhorDistancia <= a.historico[i - 1].melhorDistancia);
    add({
      id: '6.4', titulo: 'Execução completa (semente 42)',
      entrada: 'instância 6.1; depósito A; 10 formigas; 30 iterações; α = 1; β = 2; ρ = 50%; τ₀ = 1; Q = 14; semente 42',
      esperado: 'rota válida de comprimento 14, 16 ou 18 (ótimo 14); 30 registros; melhor acumulada nunca aumenta; todas as rotas das formigas válidas',
      obtido: `melhor rota ${nome(a.melhorRota)}, comprimento ${f(a.melhorDistancia)}; ${a.historico.length} registros; melhor acumulada ${naoAumenta ? 'nunca aumenta' : 'AUMENTA'}; ${rotasOk ? 'as 300 rotas são válidas e medem 14, 16 ou 18' : 'há rota inválida'}`,
      ok: a.historico.length === 30 && naoAumenta && rotasOk && C.rotaValida(a.melhorRota, 4, 0) && perto(a.melhorDistancia, 14),
    });
    add({
      id: '6.4', titulo: 'Estado inicial (iteração 0)',
      entrada: 'mesma configuração, antes de executar',
      esperado: 'τ = 1 em todas as arestas; sem rota; melhor distância ainda não calculada',
      obtido: `${inicial.tau ? 'τ = 1 em todas as arestas' : 'τ diferente de 1'}; rota ${inicial.rota === null ? 'nenhuma' : 'existe'}; melhor distância ${inicial.dist === Infinity ? 'ainda não calculada' : inicial.dist}`,
      ok: inicial.tau && inicial.rota === null && inicial.dist === Infinity,
    });
    add({
      id: '6.4', titulo: 'Reprodutibilidade e pausa',
      entrada: 'a mesma configuração executada de novo; e outra execução feita em 12 iterações, pausada e retomada até o fim',
      esperado: 'históricos idênticos nas três execuções',
      obtido: `${hist === JSON.stringify(b.historico) ? 'repetição idêntica' : 'repetição diferente'}; ${hist === JSON.stringify(passo.historico) ? 'pausar e retomar idêntico' : 'pausar e retomar diferente'}`,
      ok: hist === JSON.stringify(b.historico) && hist === JSON.stringify(passo.historico),
    });

    // ---------- 6.5 ----------
    s = sistema({ numeroFormigas: 1, numeroIteracoes: 1, rho: 0 });
    s.executarIteracao([rota('ABCDA')]);
    arestas = s.registros[0].arestas;
    add({
      id: '6.5', titulo: 'ρ = 0%',
      entrada: 'τ₀ = 1; ρ = 0%; Q = 14; 1 formiga com rota forçada A → B → C → D → A',
      esperado: 'evaporação não reduz: após evaporação 1 em todas; perímetro 2 (1 + depósito 1); diagonais 1',
      obtido: `após evaporação ${[...new Set(arestas.map((x) => f(x.aposEvaporacao)))].join(', ')}; ${perim.concat(diag).map((k) => `${k} = ${f(val(s, k))}`).join(', ')}`,
      ok: arestas.every((x) => perto(x.aposEvaporacao, 1)) && perim.every((k) => perto(val(s, k), 2)) && diag.every((k) => perto(val(s, k), 1)),
    });

    const texto = { vertices: VERT.map((v) => ({ id: v.id, x: String(v.x), y: String(v.y) })), deposito: 'A', numeroFormigas: '10', numeroIteracoes: '30', alfa: '1', beta: '2', rho: '50', tau0: '1', Q: '14', semente: '42' };
    const caso = (mudar) => { const e = JSON.parse(JSON.stringify(texto)); mudar(e); return C.validarEntrada(e); };
    const casos = [
      ['dados válidos da seção 6.1', () => {}, true],
      ['coordenadas duplicadas (D em 3; 4)', (e) => { e.vertices[3].x = '3'; }, false],
      ['identificador repetido (dois "B")', (e) => { e.vertices[2].id = 'B'; }, false],
      ['três vértices', (e) => { e.vertices.pop(); }, false],
      ['campo vazio (α)', (e) => { e.alfa = ''; }, false],
      ['0 formigas', (e) => { e.numeroFormigas = '0'; }, false],
      ['201 iterações', (e) => { e.numeroIteracoes = '201'; }, false],
      ['ρ = 95%', (e) => { e.rho = '95'; }, false],
      ['τ₀ = 0', (e) => { e.tau0 = '0'; }, false],
      ['Q = 20.000', (e) => { e.Q = '20000'; }, false],
      ['coordenada 1001', (e) => { e.vertices[1].x = '1001'; }, false],
      ['coordenada com três casas (3,125)', (e) => { e.vertices[1].x = '3,125'; }, false],
      ['semente 4,5', (e) => { e.semente = '4,5'; }, false],
    ];
    const res = casos.map(([n, m, esperado]) => { const r = caso(m); return { n, ok: r.ok === esperado, msg: r.lista[0] || 'aceito' }; });
    add({
      id: '6.5', titulo: 'Entradas inválidas',
      entrada: casos.map((c) => c[0]).join('; '),
      esperado: 'só os dados válidos são aceitos; cada caso inválido é bloqueado com mensagem clara',
      obtido: res.map((r) => `${r.n}: ${r.msg}`).join(' | '),
      ok: res.every((r) => r.ok),
    });

    return testes;
  }

  // Comparação de β = 0 e β = 2, sementes 1 a 5 (seção 6.5)
  function compararBeta() {
    return [0, 2].map((beta) => {
      const execucoes = [1, 2, 3, 4, 5].map((semente) => {
        const s = sistema({ beta: beta, semente: semente }).executarAteOFim();
        const iter14 = s.historico.findIndex((h) => perto(h.melhorDistancia, 14));
        const mediaFinal = s.historico[s.historico.length - 1].mediaDistancias;
        return { semente, melhorDistancia: s.melhorDistancia, rota: nome(s.melhorRota), iteracao14: iter14 >= 0 ? iter14 + 1 : null, mediaFinal };
      });
      const media = execucoes.reduce((t, e) => t + e.melhorDistancia, 0) / 5;
      return { beta, execucoes, media, atingiram14: execucoes.filter((e) => perto(e.melhorDistancia, 14)).length, mediaUltima: execucoes.reduce((t, e) => t + e.mediaFinal, 0) / 5 };
    });
  }

  return { executarTestes, compararBeta, VERT };
});
