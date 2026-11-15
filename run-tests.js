// Executa os testes no terminal: node run-tests.js
const T = require('./testes.js');
const testes = T.executarTestes();
let ok = 0;
for (const t of testes) {
  if (t.ok) ok++;
  console.log(`[${t.ok ? 'OK' : 'FALHOU'}] ${t.id} ${t.titulo}`);
  console.log(`   entrada:  ${t.entrada}`);
  console.log(`   esperado: ${t.esperado}`);
  console.log(`   obtido:   ${t.obtido}`);
}
console.log(`\n${ok}/${testes.length} testes aprovados\n`);
for (const c of T.compararBeta()) {
  console.log(`β = ${c.beta}: média da melhor distância final ${c.media.toFixed(2)}; atingiram 14: ${c.atingiram14}/5; média das formigas na última iteração ${c.mediaUltima.toFixed(2)}`);
  for (const e of c.execucoes) console.log(`   semente ${e.semente}: ${e.rota} = ${e.melhorDistancia.toFixed(2)}; 14 alcançado na iteração ${e.iteracao14}; média das formigas na iteração 30 = ${e.mediaFinal.toFixed(2)}`);
}
process.exit(ok === testes.length ? 0 : 1);
