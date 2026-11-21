// Usage : node outils/valider.js  — vérifie liens cassés et passages inaccessibles
const fs = require('fs'), vm = require('vm'), path = require('path');
const code = ['story.js','story2.js'].map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join(String.fromCharCode(10));
const STORY = vm.runInNewContext(code + '\n;STORY', { window: {} });
const { P } = STORY;
const liens = new Map();
const add = (de, vers) => { if (vers) { if (!liens.has(de)) liens.set(de, new Set()); liens.get(de).add(vers); } };
let erreurs = 0;
for (const [id, p] of Object.entries(P)) {
  (p.choix || []).forEach(c => add(id, c.vers));
  ['victoire', 'fuite', 'defaite'].forEach(k => add(id, p[k]));
  if (p.combat && !p.victoire) { console.log('✗ combat sans victoire :', id); erreurs++; }
  if (!p.texte && !p.route) { console.log('✗ passage sans texte :', id); erreurs++; }
  if (!p.fin && !p.route && !p.combat && !(p.choix && p.choix.length)) { console.log('✗ impasse :', id); erreurs++; }
}
const cibles = new Set([...liens.values()].flatMap(s => [...s]));
cibles.forEach(c => { if (!P[c]) { console.log('✗ lien cassé vers', c); erreurs++; } });
// Cibles de route() : on les déduit du code
const routes = ['clairiere', 'lisiere', 'carrefour', 'ev_gobelins', 'ev_orc', 'ev_ronces', 'ev_sorciere', 'ev_fee', 'ev_follet', 'ev_cerf', 'ev_pont', 'ev_colporteur', 'ev_pont_menti_ok', 'ev_pont_menti_ko', 'ev_colporteur_gagne', 'ev_colporteur_perd', 'colline_bras_ok', 'colline_bras_ko'];
const vus = new Set(['intro', ...routes]); const pile = ['intro', ...routes];
while (pile.length) { const x = pile.pop(); for (const y of (liens.get(x) || [])) if (!vus.has(y)) { vus.add(y); pile.push(y); } }
Object.keys(P).forEach(id => { if (!vus.has(id)) { console.log('⚠ inaccessible :', id); } });
console.log(`${Object.keys(P).length} passages, ${erreurs} erreur(s).`);
process.exit(erreurs ? 1 : 0);
