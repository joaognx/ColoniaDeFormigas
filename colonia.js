// Núcleo do algoritmo de Colônia de Formigas (Ant System).
// Não depende da página: é usado pela interface e pelos testes no Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Colonia = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PISO_FEROMONIO = 1e-12;

  // Gerador pseudoaleatório com semente (congruencial linear)
  function criarGerador(semente) {
    let estado = ((Math.trunc(semente) % 233280) + 233280) % 233280;
    return function () {
      estado = (estado * 9301 + 49297) % 233280;
      return estado / 233280;
    };
  }

  // ---------- Grafo ----------

  function calcularDistancia(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function matrizDistancias(vertices) {
    const distancias = [];
    for (let i = 0; i < vertices.length; i++) {
      distancias[i] = [];
      for (let j = 0; j < vertices.length; j++) {
        distancias[i][j] = calcularDistancia(vertices[i], vertices[j]);
      }
    }
    return distancias;
  }

  function matrizFeromonios(n, tau0) {
    const feromonios = [];
    for (let i = 0; i < n; i++) {
      feromonios[i] = [];
      for (let j = 0; j < n; j++) {
        feromonios[i][j] = i === j ? 0 : tau0; // sem feromônio na diagonal
      }
    }
    return feromonios;
  }

  // ---------- Construção das rotas ----------

  // w(i,j) = τ(i,j)^α × (1/d(i,j))^β
  function calcularPeso(feromonios, distancias, i, j, alfa, beta) {
    return Math.pow(feromonios[i][j], alfa) * Math.pow(1 / distancias[i][j], beta);
  }

  // p(i,j) = w(i,j) / Σ w(i,u), só entre os não visitados
  function calcularProbabilidades(feromonios, distancias, atual, naoVisitados, alfa, beta) {
    const pesos = [];
    let somaDosPesos = 0;
    for (const j of naoVisitados) {
      const peso = calcularPeso(feromonios, distancias, atual, j, alfa, beta);
      pesos.push({ vertice: j, peso: peso });
      somaDosPesos += peso;
    }
    return pesos.map((item) => ({ vertice: item.vertice, peso: item.peso, probabilidade: item.peso / somaDosPesos }));
  }

  // Sorteio proporcional (roleta)
  function sortearProximoVertice(probabilidades, aleatorio) {
    const sorteio = aleatorio();
    let acumulado = 0;
    for (const item of probabilidades) {
      acumulado += item.probabilidade;
      if (sorteio < acumulado) return { vertice: item.vertice, sorteio: sorteio };
    }
    return { vertice: probabilidades[probabilidades.length - 1].vertice, sorteio: sorteio };
  }

  function calcularComprimentoRota(rota, distancias) {
    let comprimento = 0;
    for (let i = 0; i < rota.length - 1; i++) comprimento += distancias[rota[i]][rota[i + 1]];
    return comprimento;
  }

  // Rota válida: começa e termina no depósito e visita cada outro vértice uma única vez
  function rotaValida(rota, n, inicio) {
    if (!Array.isArray(rota) || rota.length !== n + 1) return false;
    if (rota[0] !== inicio || rota[n] !== inicio) return false;
    const meio = rota.slice(0, n);
    return new Set(meio).size === n && meio.every((v) => Number.isInteger(v) && v >= 0 && v < n);
  }

  // Constrói a rota de uma formiga. Com detalhar = true, guarda cada escolha para os logs.
  function construirRota(ctx, numeroFormiga, detalhar) {
    const { feromonios, distancias, inicio, n, alfa, beta, aleatorio } = ctx;
    const visitados = new Array(n).fill(false);
    const rota = [inicio];
    const passos = detalhar ? [] : null;
    visitados[inicio] = true;
    let atual = inicio;

    while (rota.length < n) {
      const naoVisitados = [];
      for (let i = 0; i < n; i++) if (!visitados[i]) naoVisitados.push(i);

      const probabilidades = calcularProbabilidades(feromonios, distancias, atual, naoVisitados, alfa, beta);
      const escolha = sortearProximoVertice(probabilidades, aleatorio);

      if (detalhar) {
        passos.push({
          atual: atual,
          candidatos: probabilidades.map((p) => ({
            vertice: p.vertice,
            feromonio: feromonios[atual][p.vertice],
            distancia: distancias[atual][p.vertice],
            peso: p.peso,
            probabilidade: p.probabilidade,
          })),
          sorteio: escolha.sorteio,
          escolhido: escolha.vertice,
        });
      }
      rota.push(escolha.vertice);
      visitados[escolha.vertice] = true;
      atual = escolha.vertice;
    }

    rota.push(inicio); // retorno obrigatório ao depósito
    return {
      formiga: numeroFormiga,
      rota: rota,
      comprimento: calcularComprimentoRota(rota, distancias),
      passos: passos,
      retorno: { de: atual, para: inicio, distancia: distancias[atual][inicio] },
    };
  }

  // ---------- Atualização dos feromônios ----------
  // τ_novo = (1 − ρ) × τ_antigo + Σ Δτk, com Δτk = Q / Lk nas arestas da rota da formiga k.
  // Cada formiga conta cada aresta uma vez; τ(i,j) = τ(j,i); piso de 1e-12 após a atualização.
  function atualizarFeromonios(feromonios, rotas, rho, Q) {
    const n = feromonios.length;
    const deposito = [];
    for (let i = 0; i < n; i++) deposito.push(new Array(n).fill(0));

    for (const formiga of rotas) {
      const depositoFormiga = Q / formiga.comprimento;
      const arestasPercorridas = new Set();
      for (let k = 0; k < formiga.rota.length - 1; k++) {
        const a = Math.min(formiga.rota[k], formiga.rota[k + 1]);
        const b = Math.max(formiga.rota[k], formiga.rota[k + 1]);
        const chave = a + '-' + b;
        if (!arestasPercorridas.has(chave)) {
          deposito[a][b] += depositoFormiga;
          arestasPercorridas.add(chave);
        }
      }
    }

    const arestas = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const anterior = feromonios[i][j];
        const aposEvaporacao = anterior * (1 - rho);
        const final = Math.max(PISO_FEROMONIO, aposEvaporacao + deposito[i][j]);
        feromonios[i][j] = final;
        feromonios[j][i] = final;
        arestas.push({ i: i, j: j, anterior: anterior, aposEvaporacao: aposEvaporacao, deposito: deposito[i][j], final: final });
      }
    }
    return arestas;
  }

  // ---------- Execução ----------

  class AntSystem {
    // cfg: { vertices:[{id,x,y}], deposito: índice, numeroFormigas, numeroIteracoes,
    //        alfa, beta, rho (fração), tau0, Q, semente, formigasDetalhadas }
    constructor(cfg) {
      this.cfg = Object.assign({ formigasDetalhadas: 5 }, cfg);
      this.n = cfg.vertices.length;
      this.reiniciar();
    }

    reiniciar() {
      const c = this.cfg;
      this.aleatorio = criarGerador(c.semente);
      this.distancias = matrizDistancias(c.vertices);
      this.feromonios = matrizFeromonios(this.n, c.tau0);
      this.iteracaoAtual = 0;
      this.melhorRota = null;
      this.melhorDistancia = Infinity;
      this.historico = [];
      this.registros = [];
      this.maiorFeromonio = c.tau0; // referência da escala visual
    }

    get finalizado() { return this.iteracaoAtual >= this.cfg.numeroIteracoes; }

    // Executa uma iteração. rotasForcadas (opcional, usado nos testes): lista de rotas em índices.
    executarIteracao(rotasForcadas) {
      if (this.finalizado) return null;
      const c = this.cfg;
      const ctx = {
        feromonios: this.feromonios, distancias: this.distancias, inicio: c.deposito, n: this.n,
        alfa: c.alfa, beta: c.beta, aleatorio: this.aleatorio,
      };

      const rotas = [];
      if (rotasForcadas) {
        rotasForcadas.forEach((r, k) => rotas.push({
          formiga: k + 1, rota: r.slice(), comprimento: calcularComprimentoRota(r, this.distancias),
          passos: null, retorno: { de: r[r.length - 2], para: r[r.length - 1], distancia: this.distancias[r[r.length - 2]][r[r.length - 1]] },
          forcada: true,
        }));
      } else {
        for (let k = 1; k <= c.numeroFormigas; k++) rotas.push(construirRota(ctx, k, k <= c.formigasDetalhadas));
      }

      this.iteracaoAtual++;

      let melhorDaIteracao = rotas[0];
      let soma = 0;
      for (const formiga of rotas) {
        soma += formiga.comprimento;
        if (formiga.comprimento < melhorDaIteracao.comprimento) melhorDaIteracao = formiga;
        if (formiga.comprimento < this.melhorDistancia) {
          this.melhorDistancia = formiga.comprimento;
          this.melhorRota = formiga.rota.slice();
        }
      }

      const arestas = atualizarFeromonios(this.feromonios, rotas, c.rho, c.Q);

      let escalaAjustada = false;
      for (const a of arestas) {
        if (a.final > this.maiorFeromonio) { this.maiorFeromonio = a.final; escalaAjustada = true; }
      }

      const resultado = {
        iteracao: this.iteracaoAtual,
        menorDistancia: melhorDaIteracao.comprimento,
        melhorRotaIteracao: melhorDaIteracao.rota.slice(),
        mediaDistancias: soma / rotas.length,
        melhorDistancia: this.melhorDistancia,
        melhorRota: this.melhorRota.slice(),
      };
      this.historico.push(resultado);
      this.registros.push({ iteracao: this.iteracaoAtual, formigas: rotas, arestas: arestas, escalaAjustada: escalaAjustada, maiorFeromonio: this.maiorFeromonio });
      return resultado;
    }

    executarAteOFim() {
      while (!this.finalizado) this.executarIteracao();
      return this;
    }
  }

  // ---------- Validação dos dados digitados ----------
  // entrada: { vertices:[{id,x,y}] (textos), deposito (id), numeroFormigas, numeroIteracoes,
  //            alfa, beta, rho (percentual), tau0, Q, semente } — todos como texto
  // Retorna { ok, erros: {campo: mensagem}, lista: [mensagens], cfg }
  function validarEntrada(entrada) {
    const erros = {};
    const lista = [];
    const erro = (campo, msg) => { if (!erros[campo]) { erros[campo] = msg; lista.push(msg); } };
    const txt = (v) => String(v === undefined || v === null ? '' : v).trim();
    const RE_NUM = /^-?\d+([.,]\d+)?$/;
    const RE_INT = /^-?\d+$/;
    const num = (s) => Number(s.replace(',', '.'));

    const vertices = [];
    const lidos = entrada.vertices || [];
    if (lidos.length < 4 || lidos.length > 12) erro('vertices', `O grafo precisa ter entre 4 e 12 vértices (agora tem ${lidos.length}).`);

    const ids = new Map();
    const pontos = new Map();
    lidos.forEach((v, k) => {
      const id = txt(v.id);
      const rotulo = id ? `Vértice ${id}` : `Vértice da linha ${k + 1}`;
      if (!id) erro(`v-${k}-id`, `${rotulo}: preencha o identificador.`);
      else if (ids.has(id)) erro(`v-${k}-id`, `${rotulo}: o identificador "${id}" já existe; use um nome único.`);
      else ids.set(id, k);

      const coord = (campo, nome) => {
        const s = txt(v[campo]);
        if (!s) { erro(`v-${k}-${campo}`, `${rotulo}: preencha a coordenada ${nome}.`); return NaN; }
        if (!RE_NUM.test(s)) { erro(`v-${k}-${campo}`, `${rotulo}: a coordenada ${nome} deve ser um número.`); return NaN; }
        if (!/^-?\d+([.,]\d{1,2})?$/.test(s)) { erro(`v-${k}-${campo}`, `${rotulo}: use no máximo duas casas decimais na coordenada ${nome}.`); return NaN; }
        const x = num(s);
        if (!Number.isFinite(x) || x < 0 || x > 1000) { erro(`v-${k}-${campo}`, `${rotulo}: a coordenada ${nome} deve estar entre 0 e 1.000.`); return NaN; }
        return x;
      };
      const x = coord('x', 'X');
      const y = coord('y', 'Y');
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const chave = x + ';' + y;
        if (pontos.has(chave)) {
          const outro = pontos.get(chave);
          erro(`v-${k}-x`, `${rotulo} está nas mesmas coordenadas (${x}; ${y}) que o vértice ${txt(lidos[outro].id) || 'da linha ' + (outro + 1)}; isso daria distância zero.`);
        } else pontos.set(chave, k);
      }
      vertices.push({ id: id, x: x, y: y });
    });

    const dep = txt(entrada.deposito);
    let deposito = -1;
    if (!dep) erro('deposito', 'Depósito: escolha um dos vértices.');
    else {
      deposito = vertices.findIndex((v) => v.id === dep);
      if (deposito < 0) erro('deposito', 'Depósito: escolha um dos vértices cadastrados.');
    }

    const numero = (campo, nome, min, max, inteiro, sufixo) => {
      const s = txt(entrada[campo]);
      const faixa = `entre ${String(min).replace('.', ',')} e ${max.toLocaleString('pt-BR')}${sufixo || ''}`;
      if (!s) { erro(campo, `${nome}: preencha com um ${inteiro ? 'inteiro' : 'número'} ${faixa}.`); return NaN; }
      if (inteiro ? !RE_INT.test(s) : !RE_NUM.test(s)) { erro(campo, `${nome}: use um ${inteiro ? 'número inteiro' : 'número'} ${faixa}.`); return NaN; }
      const x = num(s);
      if (x < min || x > max) { erro(campo, `${nome}: o valor deve estar ${faixa}.`); return NaN; }
      return x;
    };

    const cfg = {
      numeroFormigas: numero('numeroFormigas', 'Número de formigas', 1, 100, true),
      numeroIteracoes: numero('numeroIteracoes', 'Número de iterações', 1, 200, true),
      alfa: numero('alfa', 'Influência do feromônio (α)', 0, 5, false),
      beta: numero('beta', 'Influência da distância (β)', 0, 5, false),
      rho: numero('rho', 'Taxa de evaporação (ρ)', 0, 90, false, '%') / 100,
      tau0: numero('tau0', 'Feromônio inicial (τ₀)', 0.01, 100, false),
      Q: numero('Q', 'Constante de depósito (Q)', 0.01, 10000, false),
    };
    const s = txt(entrada.semente);
    if (!s) erro('semente', 'Semente aleatória: preencha com um número inteiro.');
    else if (!RE_INT.test(s) || !Number.isSafeInteger(Number(s))) erro('semente', 'Semente aleatória: use um número inteiro.');
    else cfg.semente = Number(s);

    cfg.vertices = vertices;
    cfg.deposito = deposito;
    const ok = lista.length === 0;
    return { ok: ok, erros: erros, lista: lista, cfg: ok ? cfg : null };
  }

  return {
    PISO_FEROMONIO,
    criarGerador, calcularDistancia, matrizDistancias, matrizFeromonios,
    calcularPeso, calcularProbabilidades, sortearProximoVertice, calcularComprimentoRota,
    rotaValida, construirRota, atualizarFeromonios, AntSystem, validarEntrada,
  };
});
