// Interface do simulador (o algoritmo fica em colonia.js)
(function () {
  'use strict';

  const C = window.Colonia;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Números: precisão total nos cálculos, arredondamento só na exibição
  const fmt = (x, d = 4) => {
    if (x === Infinity || x === null || x === undefined || Number.isNaN(x)) return '—';
    if (x !== 0 && Math.abs(x) < 0.0001) return x.toExponential(2).replace('.', ',');
    return Number(x.toFixed(d)).toLocaleString('pt-BR', { maximumFractionDigits: d });
  };
  const pct = (x) => (x * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

  // Cenário inicial (6 vértices) e instância de teste da seção 6.1
  const CENARIO_INICIAL = [
    { id: 'A', x: '1', y: '1' }, { id: 'B', x: '4', y: '0,5' }, { id: 'C', x: '7', y: '2,5' },
    { id: 'D', x: '6', y: '6' }, { id: 'E', x: '2,5', y: '5,5' }, { id: 'F', x: '0,5', y: '3,5' },
  ];
  const INSTANCIA_TESTE = [
    { id: 'A', x: '0', y: '0' }, { id: 'B', x: '3', y: '0' }, { id: 'C', x: '3', y: '4' }, { id: 'D', x: '0', y: '4' },
  ];
  const PARAMETROS = { numeroFormigas: '10', numeroIteracoes: '30', alfa: '1', beta: '2', rho: '50', tau0: '1', Q: '14', semente: '42' };
  const CAMPOS = Object.keys(PARAMETROS);

  let vertices = [];
  let depositoEscolhido = 'A';
  let sistema = null;
  let cfg = null;
  let modo = 'parado'; // parado, executando, pausado, concluido
  let alterado = false;
  let ultimaValidacao = null;
  let execucao = 0;
  let iteracaoLog = 0;
  let arestaSelecionada = null;

  const nomeV = (i) => cfg.vertices[i].id;
  const nomeRota = (r) => r.map(nomeV).join(' → ');

  // ---------- Entrada e validação ----------
  function lerEntrada() {
    const e = { vertices: vertices.map((v) => ({ id: v.id, x: v.x, y: v.y })), deposito: depositoEscolhido };
    CAMPOS.forEach((c) => { e[c] = $('#' + c).value; });
    return e;
  }

  function mostrarErros(res) {
    document.querySelectorAll('.err').forEach((s) => {
      const id = s.dataset.for;
      s.textContent = res.erros[id] || '';
      const campo = document.getElementById(id);
      if (campo) campo.setAttribute('aria-invalid', res.erros[id] ? 'true' : 'false');
    });
    const lista = $('#lista-erros');
    lista.innerHTML = '';
    res.lista.forEach((m) => lista.appendChild(el('li', null, esc(m))));
    lista.hidden = res.lista.length === 0;
  }

  function validar() {
    ultimaValidacao = C.validarEntrada(lerEntrada());
    mostrarErros(ultimaValidacao);
    return ultimaValidacao;
  }

  // ---------- Tabela de vértices ----------
  function desenharVertices() {
    const corpo = $('#corpo-vertices');
    corpo.innerHTML = '';
    vertices.forEach((v, k) => {
      const tr = el('tr');
      const celula = (campo, rotulo, modo) => {
        const td = el('td', 'c-' + campo);
        const id = `v-${k}-${campo}`;
        const inp = el('input');
        inp.id = id;
        inp.name = id;
        inp.value = v[campo];
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        if (modo) inp.inputMode = modo;
        inp.setAttribute('aria-label', `${rotulo} do vértice ${k + 1}`);
        inp.addEventListener('input', () => {
          vertices[k][campo] = inp.value;
          if (campo === 'id') atualizarDeposito();
          aoAlterar();
        });
        const err = el('small', 'err');
        err.dataset.for = id;
        td.append(inp, err);
        return td;
      };
      const tdId = celula('id', 'Identificador');
      const tdX = celula('x', 'Coordenada X', 'decimal');
      const tdY = celula('y', 'Coordenada Y', 'decimal');
      tdX.dataset.label = 'X';
      tdY.dataset.label = 'Y';
      tr.append(tdId, tdX, tdY);
      const td = el('td');
      const rm = el('button', 'icon-btn', '×');
      rm.type = 'button';
      rm.setAttribute('aria-label', `Remover o vértice ${v.id || k + 1}`);
      rm.title = 'Remover vértice';
      rm.disabled = vertices.length <= 4;
      rm.addEventListener('click', () => {
        vertices.splice(k, 1);
        desenharVertices();
        atualizarDeposito();
        aoAlterar();
      });
      td.appendChild(rm);
      tr.appendChild(td);
      corpo.appendChild(tr);
    });
    $('#contagem').textContent = `${vertices.length} de 12 (mínimo 4)`;
    $('#adicionar-vertice').disabled = vertices.length >= 12;
  }

  function atualizarDeposito() {
    const sel = $('#deposito');
    const ids = [...new Set(vertices.map((v) => v.id.trim()).filter(Boolean))];
    if (!ids.includes(depositoEscolhido)) depositoEscolhido = ids[0] || '';
    sel.innerHTML = '';
    ids.forEach((id) => {
      const o = el('option', null, esc(id));
      o.value = id;
      sel.appendChild(o);
    });
    sel.value = depositoEscolhido;
  }

  function proximoId() {
    const usados = new Set(vertices.map((v) => v.id.trim()));
    for (let c = 65; c <= 90; c++) if (!usados.has(String.fromCharCode(c))) return String.fromCharCode(c);
    return 'V' + (vertices.length + 1);
  }

  // ---------- Estado e controles ----------
  function aoAlterar() {
    validar();
    if (sistema) {
      alterado = true;
      if (modo === 'executando') pausar();
    }
    atualizarControles();
  }

  function atualizarControles() {
    const valido = ultimaValidacao ? ultimaValidacao.ok : true;
    const pronto = sistema && !alterado && !sistema.finalizado;
    $('#executar').disabled = !(pronto && modo !== 'executando');
    $('#pausar').disabled = modo !== 'executando';
    $('#avancar').disabled = !(pronto && modo !== 'executando');
    $('#executar').classList.toggle('primary', !alterado && valido);
    $('#reiniciar').classList.toggle('primary', alterado || !valido);
    $('#executar').textContent = modo === 'pausado' ? 'Executar (continuar)' : 'Executar';

    const st = $('#status');
    st.classList.remove('warn');
    if (!valido) {
      st.textContent = 'Há dados inválidos. Corrija os itens abaixo e clique em Reiniciar.';
      st.classList.add('warn');
    } else if (alterado) {
      st.textContent = 'Dados ou parâmetros alterados. Clique em Reiniciar para aplicá-los.';
      st.classList.add('warn');
    } else if (!sistema) {
      st.textContent = '';
    } else if (modo === 'parado') {
      st.textContent = 'Iteração 0 pronta: τ₀ em todas as arestas, nenhuma rota calculada.';
    } else if (modo === 'executando') {
      st.textContent = `Executando: iteração ${sistema.iteracaoAtual} de ${cfg.numeroIteracoes}.`;
    } else if (modo === 'pausado') {
      st.textContent = `Pausado na iteração ${sistema.iteracaoAtual} de ${cfg.numeroIteracoes}. O estado foi preservado.`;
    } else {
      st.textContent = `Execução concluída: ${cfg.numeroIteracoes} ${cfg.numeroIteracoes === 1 ? 'iteração' : 'iterações'}.`;
    }
  }

  function reiniciar() {
    const res = validar();
    if (!res.ok) {
      atualizarControles();
      const primeiro = document.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      return;
    }
    execucao++;
    cfg = res.cfg;
    sistema = new C.AntSystem(cfg);
    modo = 'parado';
    alterado = false;
    iteracaoLog = 0;
    arestaSelecionada = null;
    $('#logs-iteracao').innerHTML = '';
    desenharTudo();
    atualizarControles();
  }

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  async function executar() {
    if (!sistema || alterado || sistema.finalizado || modo === 'executando') return;
    modo = 'executando';
    atualizarControles();
    const minha = ++execucao;
    while (modo === 'executando' && minha === execucao && !sistema.finalizado) {
      sistema.executarIteracao();
      iteracaoLog = sistema.iteracaoAtual;
      desenharTudo();
      atualizarControles();
      const atraso = Number($('#velocidade').value);
      await esperar(atraso || 0);
    }
    if (minha !== execucao) return;
    if (sistema.finalizado) concluir();
  }

  function pausar() {
    if (modo !== 'executando') return;
    modo = 'pausado';
    execucao++;
    atualizarControles();
  }

  function avancar() {
    if (!sistema || alterado || sistema.finalizado || modo === 'executando') return;
    modo = 'pausado';
    sistema.executarIteracao();
    iteracaoLog = sistema.iteracaoAtual;
    desenharTudo();
    if (sistema.finalizado) concluir(); else atualizarControles();
  }

  function concluir() {
    modo = 'concluido';
    execucao++;
    desenharTudo();
    atualizarControles();
  }

  // ---------- Exibição ----------
  function desenharTudo() {
    if (!sistema) return;
    const h = sistema.historico[sistema.historico.length - 1];
    $('#m-iteracao').textContent = `${sistema.iteracaoAtual} de ${cfg.numeroIteracoes}`;
    $('#m-menor').textContent = h ? fmt(h.menorDistancia) : '—';
    $('#m-media').textContent = h ? fmt(h.mediaDistancias) : '—';
    $('#m-melhor').textContent = sistema.melhorRota ? fmt(sistema.melhorDistancia) : 'ainda não calculada';
    $('#m-melhor').classList.toggle('pending', !sistema.melhorRota);
    if (sistema.melhorRota) {
      const encontrada = sistema.historico.findIndex((x) => x.melhorDistancia === sistema.melhorDistancia) + 1;
      $('#m-rota').textContent = nomeRota(sistema.melhorRota);
      $('#m-rota-sub').textContent = `comprimento ${fmt(sistema.melhorDistancia)}; encontrada na iteração ${encontrada}`;
    } else {
      $('#m-rota').textContent = 'ainda não calculada';
      $('#m-rota-sub').textContent = `depósito ${nomeV(cfg.deposito)}; ${cfg.vertices.length} vértices`;
    }
    desenharGrafo();
    desenharInfoAresta();
    desenharTabelaArestas();
    desenharHistorico();
    desenharSeletorLogs();
    desenharLogs();
  }

  // Grafo em SVG, com escala uniforme para manter as proporções reais
  function desenharGrafo() {
    const W = 760, H = 460, M = 56;
    const vs = cfg.vertices;
    const xs = vs.map((v) => v.x), ys = vs.map((v) => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const larg = maxX - minX || 1, alt = maxY - minY || 1;
    const k = Math.min((W - 2 * M) / larg, (H - 2 * M) / alt);
    const ox = (W - larg * k) / 2, oy = (H - alt * k) / 2;
    const P = (v) => ({ x: ox + (v.x - minX) * k, y: H - (oy + (v.y - minY) * k) }); // y para cima

    const tau = sistema.feromonios;
    const escala = sistema.maiorFeromonio;
    const mostrarValores = $('#mostrar-valores').checked;
    const naRota = new Set();
    if (sistema.melhorRota) {
      for (let i = 0; i < sistema.melhorRota.length - 1; i++) {
        const a = Math.min(sistema.melhorRota[i], sistema.melhorRota[i + 1]);
        const b = Math.max(sistema.melhorRota[i], sistema.melhorRota[i + 1]);
        naRota.add(a + '-' + b);
      }
    }

    let arestas = '', rotulos = '', rota = '', alvos = '';
    for (let i = 0; i < vs.length; i++) {
      for (let j = i + 1; j < vs.length; j++) {
        const a = P(vs[i]), b = P(vs[j]);
        const r = tau[i][j] / escala;
        const largura = (1 + 9 * r).toFixed(2);
        const opac = (0.18 + 0.82 * r).toFixed(3);
        const sel = arestaSelecionada && arestaSelecionada[0] === i && arestaSelecionada[1] === j;
        arestas += `<line class="aresta${sel ? ' sel' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="stroke-width:${largura};stroke-opacity:${opac}"/>`;
        if (naRota.has(i + '-' + j)) rota += `<line class="rota" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
        if (mostrarValores) {
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          rotulos += `<text class="rotulo-aresta" x="${mx}" y="${my - 6}" text-anchor="middle">${fmt(tau[i][j], 3)}</text>`;
        }
        const dica = `Aresta ${vs[i].id}–${vs[j].id}: distância ${fmt(sistema.distancias[i][j])}; feromônio ${fmt(tau[i][j], 6)}`;
        alvos += `<line class="alvo" data-i="${i}" data-j="${j}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" tabindex="0" role="button" aria-label="${esc(dica)}"><title>${esc(dica)}</title></line>`;
      }
    }

    let nos = '';
    vs.forEach((v, i) => {
      const p = P(v);
      const dep = i === cfg.deposito;
      nos += `<circle class="no${dep ? ' deposito' : ''}" cx="${p.x}" cy="${p.y}" r="${dep ? 15 : 12}"/>`;
      nos += `<text class="rotulo-no" x="${p.x}" y="${p.y - 22}" text-anchor="middle">${esc(v.id)}${dep ? ' (depósito)' : ''}</text>`;
    });

    $('#grafo').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafo com ${vs.length} vértices e o feromônio de cada aresta">${arestas}${rota}${rotulos}${nos}${alvos}</svg>`;
    $('#grafo').querySelectorAll('.alvo').forEach((ln) => {
      const escolher = () => {
        const i = Number(ln.dataset.i), j = Number(ln.dataset.j);
        arestaSelecionada = arestaSelecionada && arestaSelecionada[0] === i && arestaSelecionada[1] === j ? null : [i, j];
        desenharGrafo();
        desenharInfoAresta();
      };
      ln.addEventListener('click', escolher);
      ln.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(); } });
    });

    // Aviso da escala visual
    const reg = sistema.registros[sistema.registros.length - 1];
    const ref = fmt(escala, 4);
    $('#escala').innerHTML = reg && reg.escalaAjustada
      ? `<strong>Escala ajustada na iteração ${reg.iteracao}:</strong> a espessura máxima agora representa τ = ${ref}. Uma aresta pode ficar mais fina sem ter perdido feromônio; confira os valores numéricos.`
      : `Escala da espessura: a aresta mais grossa possível representa τ = ${ref}. A escala só aumenta durante a execução, então uma redução de feromônio nunca aparece como aumento.`;
  }

  function ultimoRegistroAresta(i, j) {
    const reg = sistema.registros[sistema.registros.length - 1];
    return reg ? reg.arestas.find((a) => a.i === i && a.j === j) : null;
  }

  function desenharInfoAresta() {
    const box = $('#aresta-info');
    if (!arestaSelecionada) {
      box.innerHTML = '<p class="muted">Nenhuma aresta selecionada.</p>';
      return;
    }
    const [i, j] = arestaSelecionada;
    const d = sistema.distancias[i][j], t = sistema.feromonios[i][j];
    const w = C.calcularPeso(sistema.feromonios, sistema.distancias, i, j, cfg.alfa, cfg.beta);
    const u = ultimoRegistroAresta(i, j);
    box.innerHTML =
      `<p><strong>Aresta ${esc(nomeV(i))}–${esc(nomeV(j))}</strong></p>` +
      `<p>Distância: <b>${fmt(d, 6)}</b> (custo fixo durante a execução). Feromônio: <b>${fmt(t, 6)}</b> (atualizado a cada iteração). Peso de escolha w = τ^α × (1/d)^β = ${fmt(w, 6)}.</p>` +
      (u ? `<p>Iteração ${sistema.iteracaoAtual}: anterior ${fmt(u.anterior, 6)}; após evaporação ${fmt(u.aposEvaporacao, 6)}; depósito ${fmt(u.deposito, 6)}; final ${fmt(u.final, 6)}.</p>` : '<p>Iteração 0: ainda sem atualização; τ = τ₀.</p>');
  }

  function desenharTabelaArestas() {
    const t = $('#tabela-arestas');
    let html = '<thead><tr><th>Aresta</th><th>Distância</th><th>Feromônio</th><th>Peso w</th><th>Última atualização</th></tr></thead><tbody>';
    for (let i = 0; i < cfg.vertices.length; i++) {
      for (let j = i + 1; j < cfg.vertices.length; j++) {
        const u = ultimoRegistroAresta(i, j);
        const w = C.calcularPeso(sistema.feromonios, sistema.distancias, i, j, cfg.alfa, cfg.beta);
        html += `<tr><td>${esc(nomeV(i))}–${esc(nomeV(j))}</td><td>${fmt(sistema.distancias[i][j], 6)}</td><td>${fmt(sistema.feromonios[i][j], 6)}</td><td>${fmt(w, 6)}</td>` +
          `<td>${u ? `${fmt(u.anterior, 4)} → ${fmt(u.aposEvaporacao, 4)} + ${fmt(u.deposito, 4)} = ${fmt(u.final, 4)}` : 'τ₀ (iteração 0)'}</td></tr>`;
      }
    }
    t.innerHTML = html + '</tbody>';
  }

  function desenharHistorico() {
    const corpo = $('#historico');
    corpo.innerHTML = '';
    if (!sistema.historico.length) {
      corpo.innerHTML = '<tr><td colspan="5" class="muted">Iteração 0: nenhuma rota calculada; melhor distância ainda não calculada.</td></tr>';
      return;
    }
    sistema.historico.forEach((h) => {
      const tr = el('tr', h.iteracao === iteracaoLog ? 'sel' : '',
        `<td><button type="button" aria-label="Abrir os logs da iteração ${h.iteracao}">${h.iteracao}</button></td>` +
        `<td>${fmt(h.menorDistancia)}</td><td>${fmt(h.mediaDistancias)}</td><td class="mono">${esc(nomeRota(h.melhorRotaIteracao))}</td><td>${fmt(h.melhorDistancia)}</td>`);
      tr.querySelector('button').addEventListener('click', () => {
        iteracaoLog = h.iteracao;
        desenharSeletorLogs();
        desenharLogs();
        desenharHistorico();
        $('#logs-titulo').scrollIntoView({ block: 'start' });
      });
      corpo.appendChild(tr);
    });
    if (modo === 'executando') corpo.closest('.table-scroll').scrollTop = 1e9;
  }

  function desenharSeletorLogs() {
    const sel = $('#logs-iteracao');
    for (let k = sel.options.length; k <= sistema.iteracaoAtual; k++) {
      const o = el('option', null, String(k));
      o.value = k;
      sel.appendChild(o);
    }
    sel.value = String(iteracaoLog);
  }

  function desenharLogs() {
    const box = $('#logs');
    box.innerHTML = '';
    if (iteracaoLog === 0) {
      box.appendChild(el('div', 'entry', `<p><b>Iteração 0 (estado inicial).</b> Todas as arestas com τ = ${fmt(cfg.tau0, 6)}; nenhuma rota calculada; melhor distância ainda não calculada. Depósito: ${esc(nomeV(cfg.deposito))}.</p>`));
      return;
    }
    const reg = sistema.registros[iteracaoLog - 1];
    const h = sistema.historico[iteracaoLog - 1];
    box.appendChild(el('div', 'entry',
      `<p><b>Iteração ${reg.iteracao}.</b> ${reg.formigas.length} ${reg.formigas.length === 1 ? 'formiga' : 'formigas'} construíram suas rotas com os mesmos feromônios, obtidos ao fim da iteração anterior. ` +
      `Menor distância da iteração ${fmt(h.menorDistancia, 6)} (${esc(nomeRota(h.melhorRotaIteracao))}); média ${fmt(h.mediaDistancias, 6)}; melhor acumulada ${fmt(h.melhorDistancia, 6)}.</p>`));

    reg.formigas.forEach((f, idx) => {
      const det = el('details', 'entry ant');
      if (idx === 0) det.open = true;
      det.appendChild(el('summary', null, `Formiga ${f.formiga}: ${esc(nomeRota(f.rota))}; comprimento L = ${fmt(f.comprimento, 6)}`));
      if (f.passos) {
        const ol = el('ol', 'steps');
        f.passos.forEach((p) => {
          const cand = p.candidatos.map((c) =>
            `<span class="cand${c.vertice === p.escolhido ? ' chosen' : ''}">${esc(nomeV(c.vertice))} (τ ${fmt(c.feromonio, 6)}; d ${fmt(c.distancia, 6)}; w ${fmt(c.peso, 6)}; p ${pct(c.probabilidade)})</span>`).join(' ');
          ol.appendChild(el('li', null, `Em <b>${esc(nomeV(p.atual))}</b>. Candidatos: ${cand}. Sorteio ${fmt(p.sorteio, 6)} → escolhe <b>${esc(nomeV(p.escolhido))}</b>.`));
        });
        ol.appendChild(el('li', null, `Todos os vértices visitados: retorna de <b>${esc(nomeV(f.retorno.de))}</b> ao depósito <b>${esc(nomeV(f.retorno.para))}</b> (d ${fmt(f.retorno.distancia, 6)}).`));
        det.appendChild(ol);
        det.appendChild(el('p', null, `Comprimento L = ${fmt(f.comprimento, 6)} (soma de todas as arestas, incluindo o retorno). Depósito desta formiga em cada aresta da rota: Q/L = ${fmt(cfg.Q / f.comprimento, 6)}.`));
      } else {
        det.appendChild(el('p', 'muted', `Depósito desta formiga em cada aresta da rota: Q/L = ${fmt(cfg.Q / f.comprimento, 6)}. O passo a passo é guardado para as ${sistema.cfg.formigasDetalhadas} primeiras formigas de cada iteração.`));
      }
      box.appendChild(det);
    });

    const tab = el('details', 'entry pher');
    tab.open = true;
    tab.appendChild(el('summary', null, 'Atualização do feromônio em cada aresta'));
    let html = '<div class="table-scroll"><table class="history"><thead><tr><th>Aresta</th><th>Anterior</th><th>Após evaporação</th><th>Depósito total</th><th>Final</th></tr></thead><tbody>';
    reg.arestas.forEach((a) => {
      html += `<tr><td>${esc(nomeV(a.i))}–${esc(nomeV(a.j))}</td><td>${fmt(a.anterior, 6)}</td><td>${fmt(a.aposEvaporacao, 6)}</td><td>${fmt(a.deposito, 6)}</td><td>${fmt(a.final, 6)}</td></tr>`;
    });
    tab.insertAdjacentHTML('beforeend', html + '</tbody></table></div>' +
      `<p class="muted small">τ_novo = (1 − ρ) × τ_antigo + Σ Q/Lk, com ρ = ${pct(cfg.rho)} e Q = ${fmt(cfg.Q, 6)}; mínimo de 10⁻¹² por aresta.</p>`);
    box.appendChild(tab);
  }

  // ---------- Testes na página ----------
  function executarTestesNaPagina() {
    const T = window.Testes;
    const out = $('#testes-saida');
    out.innerHTML = '<p class="muted">Executando…</p>';
    setTimeout(() => {
      const testes = T.executarTestes();
      const ok = testes.filter((t) => t.ok).length;
      out.innerHTML = '';
      out.appendChild(el('p', 'tests-sum', `${ok} de ${testes.length} testes aprovados.`));
      const lista = el('div', 'tests');
      testes.forEach((t) => {
        lista.appendChild(el('div', 'test',
          `<h3><span class="verdict ${t.ok ? 'ok' : 'bad'}">${t.ok ? '✓ passou' : '✗ falhou'}</span> ${t.id} ${esc(t.titulo)}</h3>` +
          `<dl><dt>Entrada</dt><dd>${esc(t.entrada)}</dd><dt>Esperado</dt><dd>${esc(t.esperado)}</dd><dt>Obtido</dt><dd>${esc(t.obtido)}</dd></dl>`));
      });
      out.appendChild(lista);
      out.appendChild(el('h3', 'sub', 'Comparação de β = 0 e β = 2 (seção 6.5), sementes 1 a 5'));
      let linhas = '';
      const comp = T.compararBeta();
      comp.forEach((c) => c.execucoes.forEach((e) => {
        linhas += `<tr><td>${c.beta}</td><td>${e.semente}</td><td>${fmt(e.melhorDistancia)}</td><td class="mono">${esc(e.rota)}</td><td>${e.iteracao14 || '—'}</td><td>${fmt(e.mediaFinal)}</td></tr>`;
      }));
      const wrap = el('div', 'table-scroll');
      wrap.innerHTML = `<table class="exp"><thead><tr><th>β</th><th>Semente</th><th>Melhor distância final</th><th>Rota</th><th>Iteração em que chegou a 14</th><th>Média das formigas na iteração 30</th></tr></thead><tbody>${linhas}</tbody></table>`;
      out.appendChild(wrap);
      out.appendChild(el('p', null, comp.map((c) => `β = ${c.beta}: média da melhor distância final ${fmt(c.media, 2)}; ${c.atingiram14} de 5 execuções atingiram 14.`).join(' ')));
    }, 20);
  }

  // ---------- Inicialização ----------
  function carregar(lista, reiniciarDepois) {
    vertices = lista.map((v) => Object.assign({}, v));
    depositoEscolhido = 'A';
    CAMPOS.forEach((c) => { $('#' + c).value = PARAMETROS[c]; });
    desenharVertices();
    atualizarDeposito();
    validar();
    if (reiniciarDepois) reiniciar();
  }

  function iniciar() {
    carregar(CENARIO_INICIAL, false);
    CAMPOS.forEach((c) => $('#' + c).addEventListener('input', aoAlterar));
    $('#deposito').addEventListener('change', (e) => { depositoEscolhido = e.target.value; aoAlterar(); });
    $('#adicionar-vertice').addEventListener('click', () => {
      if (vertices.length >= 12) return;
      vertices.push({ id: proximoId(), x: '', y: '' });
      desenharVertices();
      atualizarDeposito();
      aoAlterar();
      document.getElementById(`v-${vertices.length - 1}-x`).focus();
    });
    $('#carregar-teste').addEventListener('click', () => carregar(INSTANCIA_TESTE, true));
    $('#carregar-inicial').addEventListener('click', () => carregar(CENARIO_INICIAL, true));
    $('#executar').addEventListener('click', executar);
    $('#pausar').addEventListener('click', pausar);
    $('#avancar').addEventListener('click', avancar);
    $('#reiniciar').addEventListener('click', reiniciar);
    $('#mostrar-valores').addEventListener('change', () => { if (sistema) desenharGrafo(); });
    $('#logs-iteracao').addEventListener('change', (e) => { iteracaoLog = Number(e.target.value); desenharLogs(); desenharHistorico(); });
    $('#executar-testes').addEventListener('click', executarTestesNaPagina);
    reiniciar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
