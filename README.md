# Simulador de Colônia de Formigas

Trabalho da disciplina de Inteligência Artificial, Universidade Federal do Piauí (UFPI), curso de Ciência da Computação.

- **Simulador online:** https://joaognx.github.io/ColoniaDeFormigas/
- **Repositório:** https://github.com/joaognx/ColoniaDeFormigas

## Autores

- Mayra Gabriela Sousa da Silva
- João Gabriel Nunes Oliveira Lima
- Arthur Sobreira Alexandrino

## 1. Sobre o projeto

Implementação do algoritmo de Colônia de Formigas (Ant System) aplicado ao Problema do Caixeiro-Viajante. O simulador reproduz o comportamento de formigas em busca da rota de menor distância num grafo: cada formiga parte do vértice definido como depósito, visita todos os outros vértices uma única vez e volta ao ponto de partida.

A melhor rota surge da interação entre as formigas e da atualização dos feromônios ao longo das iterações.

## 2. Como funciona

O grafo é completo e não direcionado, com 4 a 12 vértices. Cada vértice tem um identificador e coordenadas X e Y, usadas para calcular a distância euclidiana entre os pontos.

**Construção das rotas.** Em cada iteração, cada formiga:

1. começa no depósito;
2. calcula, para cada vértice ainda não visitado *j*, o peso τ(i,j)^α · (1/d(i,j))^β, em que τ é o feromônio da aresta e *d* a distância;
3. sorteia o próximo vértice com probabilidade proporcional a esse peso;
4. repete até visitar todos os vértices e então volta ao depósito.

**Atualização dos feromônios.** Depois que todas as formigas constroem suas rotas:

1. **Evaporação:** o feromônio de cada aresta é multiplicado por (1 − ρ);
2. **Depósito:** cada formiga soma Q / L em cada aresta da sua rota, em que L é o comprimento total da rota.

O feromônio nunca fica abaixo de 10⁻¹² (piso), para que nenhuma aresta seja descartada de vez. O processo se repete pelo número de iterações definido, e o simulador guarda a melhor rota encontrada em toda a execução.

**Semente.** Os sorteios usam um gerador pseudoaleatório com semente, implementado no próprio projeto. A mesma semente, com os mesmos vértices e parâmetros, repete exatamente a execução.

## 3. Como usar

Abra o simulador online; não há login nem instalação. Para rodar no computador, baixe ou clone o repositório e abra o `index.html` no navegador.

A tela é dividida em duas colunas: à esquerda ficam **Configurações**, **Execução** e **Gerenciar vértices**; à direita, os resultados, o grafo, o histórico e os logs.

1. **Configurações:** ajuste os parâmetros do algoritmo (seção 4).
2. **Execução:**
   - **Executar algoritmo** lê os parâmetros, reinicia e roda todas as iterações de uma vez;
   - **Avançar iteração** roda uma única iteração por clique;
   - **Reiniciar** lê os parâmetros e volta à iteração 0, limpando a melhor rota e o histórico.

   Para avançar iteração por iteração com parâmetros novos, clique em Reiniciar antes.
3. **Gerenciar vértices:**
   - para **adicionar**, preencha ID, Coordenada X e Coordenada Y e clique em **Adicionar vértice**;
   - para **editar**, escolha o vértice em **Selecionar vértice**, informe as novas coordenadas e clique em **Editar vértice**;
   - **Remover vértice** e **Definir como depósito** agem sobre o vértice escolhido em Selecionar vértice.

   Qualquer alteração nos vértices reinicia o algoritmo. Depois de cada alteração, a seleção volta para o primeiro vértice, então confira a escolha antes de editar, remover ou definir o depósito.
4. **Resultados:** os cartões do topo mostram a iteração atual, a menor distância e a melhor rota encontradas.
5. **Grafo:** mostra os vértices, as arestas e o valor de feromônio de cada aresta. A melhor rota aparece destacada em azul, o depósito em laranja e os demais vértices em verde.
6. **Histórico:** lista, para cada iteração, a melhor distância até ali e a média das distâncias das rotas das formigas.
7. **Logs de execução:** mostram, para cada formiga, de qual vértice saiu, as probabilidades calculadas e o vértice escolhido. Também registram a evaporação e o depósito de feromônio em cada aresta.

A interface tem tema claro e escuro, que segue o do sistema, e se adapta ao celular.

## 4. Parâmetros

| Parâmetro | Descrição | Valor inicial | Valores aceitos |
|---|---|---|---|
| Número de formigas | Quantidade de formigas em cada iteração | 10 | inteiro de 1 a 100 |
| Número de iterações | Quantidade de ciclos do algoritmo | 30 | inteiro de 1 a 200 |
| Alfa (α) | Influência do feromônio na escolha | 1 | de 0 a 5 |
| Beta (β) | Influência da distância na escolha | 2 | de 0 a 5 |
| Rho (ρ) | Taxa de evaporação do feromônio | 0,5 | de 0 a 0,9 |
| Tau inicial (τ₀) | Feromônio inicial de cada aresta | 1 | de 0,01 a 100 |
| Q | Constante do depósito de feromônio | 14 | de 0,01 a 10.000 |
| Semente | Controla a geração dos números aleatórios | 42 | inteiro |

**Vértices:**
- O grafo deve ter de 4 a 12 vértices.
- Os identificadores não podem se repetir.
- As coordenadas X e Y vão de 0 a 1000, e dois vértices não podem ocupar o mesmo ponto.
- O depósito precisa ser um dos vértices.

Com valores fora desses limites, o simulador mostra um aviso e não executa.

## 5. Exemplo de execução

Grafo inicial: A (0, 0), B (3, 0), C (3, 4) e D (0, 4), com depósito em A. Os parâmetros são os valores iniciais da tabela, com semente 42.

Resultado: melhor rota **A → D → C → B → A**, com distância **14,00**, após 30 iterações. É o contorno do retângulo de lados 3 e 4, a menor rota possível para esses quatro pontos.

## 6. Tecnologias

HTML5, CSS3 e JavaScript puros, executados no navegador, sem servidor e sem bibliotecas: o algoritmo, o gerador com semente e o desenho do grafo (em SVG) foram escritos para este trabalho. A página carrega apenas as fontes Geist e Geist Mono do Google Fonts; sem conexão, o navegador usa as fontes do sistema.

## 7. Estrutura dos arquivos

```
index.html    estrutura da página
style.css     estilização da interface (tema claro e escuro)
script.js     algoritmo de colônia de formigas e funcionalidades da página
README.md     documentação do projeto
```
