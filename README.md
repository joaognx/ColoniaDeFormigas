# Simulador de Colônia de Formigas

Atividade prática da disciplina de Inteligência Artificial, Universidade Federal do Piauí (UFPI), período 2026.2.

- **Simulador online:** https://joaognx.github.io/ColoniaDeFormigas/
- **Repositório:** https://github.com/joaognx/ColoniaDeFormigas

## Autores

- João Gabriel Nunes Oliveira Lima
- Mayra Gabriela Sousa da Silva
- Arthur Sobreira Alexandrino

## 1. Sobre o projeto

Simulador de otimização por colônia de formigas, na variante **Ant System**, para planejar uma rota de entregas. Um veículo sai do depósito, visita cada ponto de entrega exatamente uma vez e volta ao depósito, e o objetivo é minimizar a distância total. É o Problema do Caixeiro-Viajante.

Os locais formam um grafo completo e não direcionado, com coordenadas no plano. A distância de cada aresta é euclidiana: d(i, j) = √((x(i) − x(j))² + (y(i) − y(j))²).

## 2. Descrição da solução

**Rota.** Uma solução é uma sequência que começa no depósito, visita todos os outros vértices sem repetição e termina no depósito, como A → B → C → D → A. O comprimento L é a soma das distâncias de todas as arestas percorridas, incluindo o retorno.

**Feromônio inicial.** Todas as arestas começam com o mesmo feromônio τ₀. A diagonal da matriz não recebe feromônio.

**Construção das rotas.** Em cada iteração, cada formiga parte do depósito. Estando no vértice i, para cada vértice j ainda não visitado ela calcula:

- o peso de escolha w(i, j) = τ(i, j)^α × (1/d(i, j))^β;
- a probabilidade p(i, j) = w(i, j) / Σ w(i, u), somando só os vértices u ainda não visitados.

O próximo vértice é sorteado proporcionalmente a essas probabilidades, por roleta. Não se escolhe sempre o maior peso. Depois de visitar todos os vértices, a formiga volta obrigatoriamente ao depósito.

**Atualização do feromônio.** Todas as formigas de uma iteração usam os mesmos feromônios, os da iteração anterior. Só depois que todas terminam:

τ_novo(i, j) = (1 − ρ) × τ_antigo(i, j) + Σ Δτk(i, j)

Cada formiga k deposita Δτk = Q / Lk em cada aresta da sua rota, inclusive na aresta de volta ao depósito. Cada formiga conta cada aresta uma única vez, e τ(i, j) = τ(j, i). Depois da atualização, cada aresta fica com no mínimo 10⁻¹² de feromônio, só como proteção numérica.

**Melhor solução.** O simulador registra a melhor rota de cada iteração e a melhor de toda a execução. Ele para depois do número configurado de iterações e mostra a melhor rota acumulada.

**Semente e reprodutibilidade.** Todos os sorteios usam um gerador pseudoaleatório congruencial linear, com semente, implementado no próprio projeto. A ordem dos sorteios é fixa: formiga por formiga, um sorteio a cada escolha de vértice. Por isso, a mesma semente com os mesmos dados repete a execução, mesmo com pausas ou com outra velocidade de exibição. Os cálculos guardam a precisão total; os números só são arredondados na tela.

## 3. Como usar

Abra o simulador online; não há login nem instalação. Para rodar no computador, baixe o repositório e abra o `index.html` no navegador.

1. **Vértices.** A tela abre com um cenário de 6 vértices (A a F), com depósito em A.
   - Edite o identificador e as coordenadas direto na tabela, adicione vértices com **Adicionar vértice** e remova com o **×**.
   - O grafo precisa ter de 4 a 12 vértices.
   - Escolha o depósito no campo **Depósito**.
   - **Carregar instância de teste (6.1)** coloca os vértices A = (0,0), B = (3,0), C = (3,4) e D = (0,4) com os parâmetros da seção 6.4.
   - **Restaurar cenário inicial** volta aos 6 vértices.
2. **Parâmetros.** Ajuste os valores (seção 4). Qualquer alteração nos vértices ou nos parâmetros exige clicar em **Reiniciar** antes de executar; até lá, Executar e Avançar ficam bloqueados.
3. **Controles:**
   - **Executar** roda as iterações em sequência. Depois de uma pausa, retoma de onde parou.
   - **Pausar** interrompe e preserva o estado.
   - **Avançar uma iteração** completa uma iteração e fica pausado.
   - **Reiniciar** limpa o histórico, restaura τ₀ em todas as arestas e restabelece a semente.
   - **Velocidade da execução** muda só o ritmo da tela, não os resultados.
4. **Resultados.** Os cartões mostram a iteração atual, a menor distância da iteração, a média das distâncias das formigas, a melhor distância acumulada e a melhor rota. Antes da primeira iteração, a melhor distância aparece como "ainda não calculada".
5. **Grafo.**
   - O depósito aparece em laranja, e a melhor rota acumulada em azul.
   - A espessura e o brilho de cada aresta representam o feromônio, e o valor numérico aparece sobre a aresta (dá para ocultar).
   - Passar o cursor ou clicar numa aresta mostra a distância, o feromônio, o peso de escolha e a última atualização dela.
   - "Distância, feromônio e peso de todas as arestas" abre uma tabela completa.
   - A escala de espessura só aumenta durante a execução, e o simulador avisa quando ela muda. Assim, uma redução de feromônio nunca aparece como aumento.
6. **Histórico.** Uma linha por iteração: menor distância, média, melhor rota da iteração e melhor distância acumulada.
7. **Logs de execução.** Para cada iteração:
   - a rota e o comprimento de todas as formigas;
   - o passo a passo das 5 primeiras: vértice atual, candidatos com τ, d, w e probabilidade, valor sorteado, vértice escolhido e retorno ao depósito;
   - uma tabela com, para cada aresta, o feromônio anterior, o valor após evaporação, o depósito total e o valor final.
8. **Testes de validação.** O botão **Executar testes**, no fim da página, roda os testes da seção 6 na própria página. No terminal, com Node.js: `node run-tests.js`.

Dados inválidos não deixam executar. Uma lista explica cada problema, como "Vértice D está nas mesmas coordenadas (3; 4) que o vértice C" ou "Taxa de evaporação (ρ): o valor deve estar entre 0 e 90%".

## 4. Parâmetros

| Campo | Valor inicial | Valores aceitos |
|---|---|---|
| Vértices | 6 (A a F) | de 4 a 12; identificador único; x e y entre 0 e 1.000, com até duas casas decimais; dois vértices não podem ter as mesmas coordenadas |
| Depósito | A | um dos vértices cadastrados |
| Número de formigas | 10 | inteiro de 1 a 100 |
| Número de iterações | 30 | inteiro de 1 a 200 |
| Influência do feromônio (α) | 1 | de 0 a 5; com 0, o feromônio não influencia a escolha |
| Influência da distância (β) | 2 | de 0 a 5; com 0, a distância não influencia a escolha |
| Taxa de evaporação (ρ) | 50% | de 0% a 90%; usada como fração na fórmula (50% = 0,5) |
| Feromônio inicial (τ₀) | 1 | de 0,01 a 100 |
| Constante de depósito (Q) | 14 | de 0,01 a 10.000 |
| Semente aleatória | 42 | inteiro |

Os números aceitam vírgula ou ponto como separador decimal.

## 5. Tecnologias e bibliotecas

HTML, CSS e JavaScript puros, executados no navegador, sem servidor de aplicação. **Nenhuma biblioteca foi usada**: o algoritmo, o gerador com semente, o desenho do grafo em SVG e os testes foram escritos para este trabalho. A página carrega apenas as fontes Geist e Geist Mono do Google Fonts, só para a aparência; sem conexão, o navegador usa as fontes do sistema.

## 6. Estrutura dos arquivos

```
index.html      estrutura da página
style.css       estilos (tema claro e escuro)
colonia.js      algoritmo Ant System: distâncias, probabilidades, sorteio, rotas, feromônio, validação dos dados
interface.js    campos, controles, grafo, histórico e logs
testes.js       testes de validação da seção 6 (usados pela página e pelo Node)
run-tests.js    executa os testes no terminal
README.md       documentação
```

## 7. Resultados dos testes

Os testes foram executados com `node run-tests.js`; os mesmos resultados aparecem no botão "Executar testes" da página. Os testes controlados fornecem rotas e escolhas diretamente às funções, sem campos extras na interface. Os decimais são comparados com tolerância absoluta de 0,000001.

Instância usada: A = (0,0), B = (3,0), C = (3,4), D = (0,4), com depósito em A.

| Seção | Teste | Entradas e parâmetros | Esperado | Obtido | Resultado |
|---|---|---|---|---|---|
| 6.1 | Distâncias euclidianas | A = (0,0), B = (3,0), C = (3,4), D = (0,4) | A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3; d(i,i) = 0; matriz simétrica | A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3; diagonal 0 | ✅ passou |
| 6.1 | Comprimento das seis rotas a partir de A | as seis permutações de B, C e D, saindo e voltando a A | ABCDA 14, ABDCA 16, ACBDA 18, ACDBA 16, ADBCA 18, ADCBA 14 | ABCDA 14, ABDCA 16, ACBDA 18, ACDBA 16, ADBCA 18, ADCBA 14 | ✅ passou |
| 6.1 | Rotas inválidas são rejeitadas | ABCA (incompleta); ABBDA (repete B); BACDB (não começa no depósito); ABCDB (não volta ao depósito) | todas inválidas; ABCDA válida | ABCA inválida; ABBDA inválida; BACDB inválida; ABCDB inválida; ABCDA válida | ✅ passou |
| 6.2 | Probabilidades a partir de A | formiga em A; τ = 1; α = 1; β = 2; candidatos B, C, D | w = 1/9, 1/25, 1/16; p(A,B) = 400/769 ≈ 0,520156; p(A,C) = 144/769 ≈ 0,187256; p(A,D) = 225/769 ≈ 0,292588; soma 1 | w = 0,111111, 0,04, 0,0625; p = 0,520156, 0,187256, 0,292588; soma 1 | ✅ passou |
| 6.2 | Probabilidades depois de visitar B | formiga em B; A e B visitados; candidatos C, D | p(B,C) = 25/41 ≈ 0,609756; p(B,D) = 16/41 ≈ 0,390244; A e B fora do sorteio | candidatos C, D; p(B,C) = 0,609756; p(B,D) = 0,390244 | ✅ passou |
| 6.2 | α = 0 e β = 0; um único candidato | formiga em A com feromônios diferentes (AB = 7, AD = 0,2); depois, formiga em C com só D restante | com α = β = 0, p = 1/3 para cada candidato; com um candidato, p = 1 | p = 0,333333, 0,333333, 0,333333; candidato único p = 1 | ✅ passou |
| 6.2 | Sorteio proporcional (não escolhe sempre o maior peso) | 30.000 sorteios a partir de A com as probabilidades acima, semente 7 | B, C e D escolhidos com frequências próximas de 52%, 19% e 29% | B 52,2%, C 18,7%, D 29,1% | ✅ passou |
| 6.3 | Evaporação e depósito, 1ª iteração | τ₀ = 1; ρ = 50%; Q = 14; 1 formiga com rota forçada A → B → C → D → A (L = 14) | após evaporação todas 0,5; depósito 1 em AB, BC, CD, AD; final AB = BC = CD = AD = 1,5 e AC = BD = 0,5 | após evaporação 0,5; final AB = 1,5, BC = 1,5, CD = 1,5, AD = 1,5, AC = 0,5, BD = 0,5 | ✅ passou |
| 6.3 | Log das arestas AB e AC | mesma iteração do teste anterior | AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5. AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5 | AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5. AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5 | ✅ passou |
| 6.3 | Evaporação e depósito, 2ª iteração | continuação, com a mesma rota forçada | perímetro 1,75; diagonais 0,25 | AB = 1,75, BC = 1,75, CD = 1,75, AD = 1,75, AC = 0,25, BD = 0,25 | ✅ passou |
| 6.3 | Duas formigas na mesma rota | τ₀ = 1; ρ = 50%; Q = 14; 2 formigas com a rota A → B → C → D → A | perímetro 2,5; diagonais 0,5 (depósitos somados, sem atualizar durante a construção) | AB = 2,5, BC = 2,5, CD = 2,5, AD = 2,5, AC = 0,5, BD = 0,5 | ✅ passou |
| 6.3 | Simetria e diagonal | matriz de feromônios após a 1ª iteração | τ(i,j) = τ(j,i) e diagonal sem feromônio (0) | simétrica; diagonal 0, 0, 0, 0 | ✅ passou |
| 6.4 | Execução completa (semente 42) | instância 6.1; depósito A; 10 formigas; 30 iterações; α = 1; β = 2; ρ = 50%; τ₀ = 1; Q = 14; semente 42 | rota válida de comprimento 14, 16 ou 18 (ótimo 14); 30 registros; melhor acumulada nunca aumenta; todas as rotas das formigas válidas | melhor rota A → D → C → B → A, comprimento 14; 30 registros; melhor acumulada nunca aumenta; as 300 rotas são válidas e medem 14, 16 ou 18 | ✅ passou |
| 6.4 | Estado inicial (iteração 0) | mesma configuração, antes de executar | τ = 1 em todas as arestas; sem rota; melhor distância ainda não calculada | τ = 1 em todas as arestas; rota nenhuma; melhor distância ainda não calculada | ✅ passou |
| 6.4 | Reprodutibilidade e pausa | a mesma configuração executada de novo; e outra execução feita em 12 iterações, pausada e retomada até o fim | históricos idênticos nas três execuções | repetição idêntica; pausar e retomar idêntico | ✅ passou |
| 6.5 | ρ = 0% | τ₀ = 1; ρ = 0%; Q = 14; 1 formiga com rota forçada A → B → C → D → A | evaporação não reduz: após evaporação 1 em todas; perímetro 2 (1 + depósito 1); diagonais 1 | após evaporação 1; AB = 2, BC = 2, CD = 2, AD = 2, AC = 1, BD = 1 | ✅ passou |
| 6.5 | Entradas inválidas | dados válidos da seção 6.1; coordenadas duplicadas (D em 3; 4); identificador repetido (dois "B"); três vértices; campo vazio (α); 0 formigas; 201 iterações; ρ = 95%; τ₀ = 0; Q = 20.000; coordenada 1001; coordenada com três casas (3,125); semente 4,5 | só os dados válidos são aceitos; cada caso inválido é bloqueado com mensagem clara | dados válidos da seção 6.1: aceito <br> coordenadas duplicadas (D em 3; 4): Vértice D está nas mesmas coordenadas (3; 4) que o vértice C; isso daria distância zero. <br> identificador repetido (dois "B"): Vértice B: o identificador "B" já existe; use um nome único. <br> três vértices: O grafo precisa ter entre 4 e 12 vértices (agora tem 3). <br> campo vazio (α): Influência do feromônio (α): preencha com um número entre 0 e 5. <br> 0 formigas: Número de formigas: o valor deve estar entre 1 e 100. <br> 201 iterações: Número de iterações: o valor deve estar entre 1 e 200. <br> ρ = 95%: Taxa de evaporação (ρ): o valor deve estar entre 0 e 90%. <br> τ₀ = 0: Feromônio inicial (τ₀): o valor deve estar entre 0,01 e 100. <br> Q = 20.000: Constante de depósito (Q): o valor deve estar entre 0,01 e 10.000. <br> coordenada 1001: Vértice B: a coordenada X deve estar entre 0 e 1.000. <br> coordenada com três casas (3,125): Vértice B: use no máximo duas casas decimais na coordenada X. <br> semente 4,5: Semente aleatória: use um número inteiro. | ✅ passou |

**Conclusão dos testes controlados.** Os 17 testes passaram, e todos os valores coincidem com os de referência do enunciado:
- as distâncias e os seis comprimentos de rota (14, 16 e 18);
- as probabilidades 400/769, 144/769 e 225/769 a partir de A, e 25/41 e 16/41 a partir de B;
- a probabilidade igual entre os candidatos com α = β = 0, e 1 com um candidato só;
- o feromônio 1,5 e 0,5 depois da primeira iteração, 1,75 e 0,25 na segunda, e 2,5 e 0,5 com duas formigas;
- os logs de AB e AC exatamente no formato pedido.

O sorteio respeita as probabilidades: em 30.000 sorteios, B, C e D apareceram cerca de 52%, 19% e 29% das vezes. Os dados inválidos são todos bloqueados, com mensagens que dizem qual é o problema.

### 7.1 Execução completa (seção 6.4)

Parâmetros: instância 6.1; depósito A; 10 formigas; 30 iterações; α = 1; β = 2; ρ = 50%; τ₀ = 1; Q = 14; semente 42.

Resultado:
- melhor rota **A → D → C → B → A**, com comprimento **14**, o ótimo, encontrada já na iteração 1;
- 30 registros, um por iteração;
- a melhor distância acumulada nunca aumenta;
- as 300 rotas construídas são válidas e medem 14, 16 ou 18;
- a execução repetida, e a execução pausada na iteração 12 e retomada, produzem exatamente o mesmo histórico.

<details>
<summary>Histórico das 30 iterações</summary>

| Iteração | Menor distância | Média | Melhor rota da iteração | Melhor acumulada |
|---|---|---|---|---|
| 1 | 14 | 15,40 | A → D → C → B → A | 14 |
| 2 | 14 | 15,00 | A → B → C → D → A | 14 |
| 3 | 14 | 14,60 | A → B → C → D → A | 14 |
| 4 | 14 | 14,40 | A → B → C → D → A | 14 |
| 5 | 14 | 14,40 | A → D → C → B → A | 14 |
| 6 | 14 | 14,20 | A → D → C → B → A | 14 |
| 7 | 14 | 14,00 | A → D → C → B → A | 14 |
| 8 | 14 | 14,00 | A → B → C → D → A | 14 |
| 9 | 14 | 14,00 | A → B → C → D → A | 14 |
| 10 | 14 | 14,00 | A → D → C → B → A | 14 |
| 11 | 14 | 14,00 | A → D → C → B → A | 14 |
| 12 | 14 | 14,00 | A → B → C → D → A | 14 |
| 13 | 14 | 14,00 | A → B → C → D → A | 14 |
| 14 | 14 | 14,00 | A → B → C → D → A | 14 |
| 15 | 14 | 14,00 | A → B → C → D → A | 14 |
| 16 | 14 | 14,00 | A → B → C → D → A | 14 |
| 17 | 14 | 14,00 | A → B → C → D → A | 14 |
| 18 | 14 | 14,00 | A → B → C → D → A | 14 |
| 19 | 14 | 14,00 | A → D → C → B → A | 14 |
| 20 | 14 | 14,00 | A → D → C → B → A | 14 |
| 21 | 14 | 14,00 | A → B → C → D → A | 14 |
| 22 | 14 | 14,00 | A → B → C → D → A | 14 |
| 23 | 14 | 14,00 | A → D → C → B → A | 14 |
| 24 | 14 | 14,00 | A → D → C → B → A | 14 |
| 25 | 14 | 14,00 | A → D → C → B → A | 14 |
| 26 | 14 | 14,00 | A → D → C → B → A | 14 |
| 27 | 14 | 14,00 | A → B → C → D → A | 14 |
| 28 | 14 | 14,00 | A → D → C → B → A | 14 |
| 29 | 14 | 14,00 | A → D → C → B → A | 14 |
| 30 | 14 | 14,00 | A → B → C → D → A | 14 |

</details>

A média das distâncias das formigas cai de 15,4 na iteração 1 para 14 a partir da iteração 7. O feromônio se concentra nas arestas do perímetro, e todas as formigas passam a seguir a rota ótima, numa das duas orientações.

### 7.2 Efeito de β (seção 6.5)

Mesmos parâmetros da seção 7.1, com β = 0 e β = 2, sementes 1 a 5.

| β | Semente | Melhor distância final | Rota | Iteração em que chegou a 14 | Média das formigas na iteração 30 |
|---|---|---|---|---|---|
| 0 | 1 | 14,00 | A → D → C → B → A | 1 | 15,00 |
| 0 | 2 | 14,00 | A → B → C → D → A | 1 | 15,40 |
| 0 | 3 | 14,00 | A → B → C → D → A | 1 | 14,60 |
| 0 | 4 | 14,00 | A → D → C → B → A | 1 | 16,40 |
| 0 | 5 | 14,00 | A → D → C → B → A | 1 | 17,60 |
| 2 | 1 | 14,00 | A → B → C → D → A | 1 | 14,00 |
| 2 | 2 | 14,00 | A → B → C → D → A | 1 | 14,00 |
| 2 | 3 | 14,00 | A → B → C → D → A | 1 | 14,00 |
| 2 | 4 | 14,00 | A → B → C → D → A | 1 | 14,00 |
| 2 | 5 | 14,00 | A → D → C → B → A | 1 | 14,00 |

| β | Média da melhor distância final | Execuções que atingiram 14 | Média das formigas na iteração 30 (5 sementes) |
|---|---|---|---|
| 0 | 14,00 | 5 de 5 | 15,80 |
| 2 | 14,00 | 5 de 5 | 14,00 |

**Análise.** Com as duas configurações, as 5 execuções chegaram à distância 14, já na primeira iteração, e a média da melhor distância final foi 14 nos dois casos. A instância é pequena demais para separar as configurações por esse critério: só existem três comprimentos possíveis (14, 16 e 18). Com 10 formigas por iteração, alguma quase sempre sorteia uma das duas rotas ótimas logo no início, mesmo sem usar a distância.

A diferença aparece no comportamento da colônia:
- **Com β = 2**, a distância favorece desde o começo as arestas curtas do perímetro. O depósito de feromônio reforça essa escolha, e na iteração 30 todas as formigas seguem a rota ótima (média 14,00 nas cinco sementes).
- **Com β = 0**, a escolha depende só do feromônio. Ele também se concentra no perímetro, mas mais devagar, e as formigas continuam explorando rotas de 16 e 18 (média de 15,80 na iteração 30).

Ou seja, β acelera a convergência e reduz a exploração, sem mudar o melhor resultado encontrado nesta instância. Em grafos maiores, com muito mais rotas possíveis, a diferença no melhor resultado tende a aparecer.

### 7.3 Evaporação zero (seção 6.5)

Com ρ = 0% e uma formiga na rota forçada A → B → C → D → A, a evaporação não reduz nenhuma aresta: o valor após evaporação continua 1. O perímetro chega a 2, que é 1 mais o depósito de 1, e as diagonais ficam em 1. Esse caso também está na tabela da seção 7.
