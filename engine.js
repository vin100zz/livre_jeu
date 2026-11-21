/* Moteur générique : aucune histoire ici, tout est dans story.js */
(() => {
  const SAVE_KEY = 'brumeval_save_v1';
  const META_KEY = 'brumeval_meta_v1';
  const $ = id => document.getElementById(id);
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[rnd(0, arr.length - 1)];
  const { ITEMS, P, DONS, FINS_TOTAL, nouveauMonde } = STORY;

  let S = null; // état de la partie

  /* ---------- stockage ---------- */
  const lire = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const effacer = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const meta = () => lire(META_KEY) || { fins: [] };
  const sauver = () => { if (S) ecrire(SAVE_KEY, S); };

  /* ---------- statistiques dérivées ---------- */
  const bonus = type => Math.max(0, ...S.inv.filter(i => ITEMS[i].type === type).map(i => ITEMS[i].bonus));
  const atkTot = () => S.atk + bonus('arme');
  const defTot = () => S.def + bonus('armure');

  /* ---------- API donnée à l'histoire ---------- */
  const g = {
    get world() { return S.world; },
    get argent() { return S.or; },
    get atkTot() { return atkTot(); },
    get defTot() { return defTot(); },
    pick, rnd,
    has: id => S.inv.includes(id),
    f: k => S.flags[k],
    flag: (k, v = true) => { S.flags[k] = v; },
    vu: id => S.vus.includes(id),
    repOf: f => S.rep[f] || 0,
    rep(f, n) { S.rep[f] = (S.rep[f] || 0) + n; this.note(`Réputation ${f} ${n > 0 ? '+' : ''}${n}`); },
    indices: () => Object.keys(S.flags).filter(k => k.startsWith('indice_')).length,
    note: t => S.notes.push(t),
    pv(n) {
      const avant = S.pv;
      S.pv = Math.max(0, Math.min(S.pvMax, S.pv + n));
      const d = S.pv - avant;
      if (d) this.note(`${d > 0 ? '+' : ''}${d} point${Math.abs(d) > 1 ? 's' : ''} de vie`);
    },
    or(n) { S.or = Math.max(0, S.or + n); this.note(`${n > 0 ? '+' : ''}${n} pièces d'or`); },
    atk(n) { S.atk += n; this.note(`Attaque ${n > 0 ? '+' : ''}${n}`); },
    def(n) { S.def += n; this.note(`Défense ${n > 0 ? '+' : ''}${n}`); },
    pvMax(n) { S.pvMax += n; S.pv += n; this.note(`Vie maximale +${n}`); },
    give(id) { if (!S.inv.includes(id) || ITEMS[id].type === 'conso' || ITEMS[id].type === 'sort') { S.inv.push(id); this.note(`Obtenu : ${ITEMS[id].nom}`); } },
    take(id) { const i = S.inv.indexOf(id); if (i >= 0) { S.inv.splice(i, 1); this.note(`Perdu : ${ITEMS[id].nom}`); } },
  };

  /* ---------- texte ---------- */
  const texteDe = p => {
    let t = typeof p.texte === 'function' ? p.texte(g) : p.texte;
    return t.replace(/\{\{(\w+)\}\}/g, (_, k) => S.world[k] ?? '');
  };
  const paragraphes = t => t.trim().split(/\n\s*\n/).map((x, i) => {
    x = x.trim().replace(/\n/g, ' ');
    if (x === 'Ce qu\'il advint ensuite.') return `<h3 class="epilogue">${x}</h3>`;
    return /^[—«"]/.test(x) ? `<p class="sans-lettrine">${x}</p>` : `<p>${x}</p>`;
  }).join('');

  /* ---------- navigation ---------- */
  function allerA(id) {
    const p = P[id];
    if (!p) { console.error('Passage inconnu :', id); return; }
    if (p.route) { S.vus.push(id); return allerA(p.route(g)); }
    S.passage = id;
    S.vus.push(id);
    if (p.entree) p.entree(g);
    if (p.combat) S.combat = { ...p.combat, pvMax: p.combat.pv, sleep: 0, log: [] };
    if (p.fin) enregistrerFin(p);
    if (S.pv <= 0 && !p.fin) return allerA('mort');
    S.entered = id;
    rendre();
  }

  function enregistrerFin(p) {
    if (!p.echec) {
      const m = meta();
      if (!m.fins.includes(p.fin)) { m.fins.push(p.fin); ecrire(META_KEY, m); }
    }
    effacer(SAVE_KEY);
  }

  function choisir(c) {
    if (c.fx) c.fx(g);
    if (S.pv <= 0) return allerA('mort');
    if (c.vers) allerA(c.vers); else { sauver(); rendre(); }
  }

  /* ---------- objets utilisables ---------- */
  function utiliser(id) {
    const it = ITEMS[id];
    if (!it.usage || (S.combat && it.type !== 'conso')) return;
    it.usage(g);
    g.take(id);
    if (S.pv <= 0) return allerA('mort');
    sauver(); rendre();
  }

  /* ---------- combat ---------- */
  function actionCombat(a) {
    const c = S.combat, p = P[S.passage], log = [];
    if (a === 'attaquer') {
      const d = Math.max(1, rnd(1, 4) + atkTot() - c.def);
      c.pv -= d; log.push(`Vous frappez ${c.nom} : −${d}.`);
    } else if (a === 'potion') {
      const av = S.pv; g.take('potion'); ITEMS.potion.usage(g); S.notes = [];
      log.push(`Vous buvez une potion : +${S.pv - av} PV.`);
    } else if (a === 'sommeil') {
      g.take('sort_sommeil'); S.notes = []; c.sleep = 2;
      log.push(`Un fil de brume enveloppe ${c.nom}, qui vacille.`);
    } else if (a === 'fuir') {
      if (Math.random() < 0.5) { S.combat = null; return allerA(p.fuite); }
      log.push('Vous trébuchez : la fuite échoue.');
    }
    if (c.pv <= 0) { S.combat = null; return allerA(p.victoire); }
    if (c.sleep > 0) { c.sleep--; log.push(`${c.nom} somnole, sans réagir.`); }
    else {
      const d = Math.max(0, rnd(1, 4) + c.atk - defTot());
      S.pv = Math.max(0, S.pv - d);
      log.push(d ? `${c.nom} vous blesse : −${d} PV.` : `Vous parez le coup de ${c.nom}.`);
    }
    if (S.pv <= 0) { S.combat = null; return allerA(p.defaite || 'mort'); }
    c.log = log; sauver(); rendre();
  }

  /* ---------- rendu ---------- */
  const bouton = (txt, cls, fn, off, raison) => {
    const b = document.createElement('button');
    b.innerHTML = txt; if (cls) b.className = cls;
    if (off) { b.disabled = true; if (raison) b.title = raison; } else b.onclick = fn;
    return b;
  };

  function rendreHud() {
    $('pv-fill').style.width = (100 * S.pv / S.pvMax) + '%';
    $('pv-txt').textContent = `${S.pv} / ${S.pvMax}`;
    $('st-atk').textContent = atkTot();
    $('st-def').textContent = defTot();
    $('st-or').textContent = S.or;
    const inv = $('inventaire'); inv.innerHTML = '';
    if (!S.inv.length) inv.innerHTML = '<span class="vide">Sac vide</span>';
    const nb = {};
    S.inv.forEach(id => { nb[id] = (nb[id] || 0) + 1; });
    Object.keys(nb).forEach(id => {
      const it = ITEMS[id];
      const peut = it.usage && !(S.combat && it.type !== 'conso');
      const chip = document.createElement(peut ? 'button' : 'span');
      chip.className = 'chip ' + it.type; chip.textContent = it.nom + (nb[id] > 1 ? ` ×${nb[id]}` : '');
      chip.title = it.desc + (peut ? ' (cliquer pour utiliser)' : '');
      if (peut) chip.onclick = () => utiliser(id);
      inv.appendChild(chip);
    });
  }

  function rendre() {
    const p = P[S.passage];
    rendreHud();
    const notes = $('notes'); notes.innerHTML = '';
    S.notes.forEach(n => { const s = document.createElement('span'); s.textContent = n; notes.appendChild(s); });
    S.notes = [];
    const tx = $('texte');
    tx.className = 'texte';
    void tx.offsetWidth; tx.classList.add('apparait');
    let html = '';
    if (p.fin) html += `<h2 class="fin-titre">${p.echec ? '☠' : '✦'} ${p.fin}</h2>`;
    tx.innerHTML = html + paragraphes(texteDe(p));
    const ch = $('choix'); ch.innerHTML = '';
    const cb = $('combat'); cb.hidden = !S.combat;

    if (S.combat) {
      const c = S.combat;
      cb.innerHTML = `<h3>${c.nom} <small>${Math.max(0, c.pv)} / ${c.pvMax}</small></h3><div class="barre ennemi"><div style="width:${Math.max(0, 100 * c.pv / c.pvMax)}%"></div></div>` +
        `<p class="log">${c.log.join('<br>') || 'Le combat commence.'}</p>`;
      ch.appendChild(bouton('⚔ Attaquer', 'principal', () => actionCombat('attaquer')));
      if (g.has('potion')) ch.appendChild(bouton('Boire une potion', '', () => actionCombat('potion')));
      if (g.has('sort_sommeil')) ch.appendChild(bouton('Lancer le Fil de sommeil', '', () => actionCombat('sommeil')));
      if (p.fuite) ch.appendChild(bouton('Fuir (une chance sur deux)', '', () => actionCombat('fuir')));
    } else if (p.fin) {
      const m = meta();
      const info = document.createElement('p'); info.className = 'discret';
      info.textContent = p.echec ? 'Votre histoire s\'arrête ici. La forêt, elle, continue.' : `Fins découvertes : ${m.fins.length} / ${FINS_TOTAL}`;
      ch.appendChild(info);
      ch.appendChild(bouton('Rejouer — le monde sera différent', 'principal', ecranDon));
    } else {
      (p.choix || []).forEach(c => {
        const ok = !c.si || c.si(g);
        if (!ok && !c.montrer) return;
        ch.appendChild(bouton(c.t, '', () => choisir(c), !ok, c.raison));
      });
    }
    sauver();
    window.scrollTo({ top: 0 });
  }

  /* ---------- écrans ---------- */
  function montrer(id) {
    ['ecran-titre', 'ecran-don', 'ecran-jeu'].forEach(e => { $(e).hidden = e !== id; });
  }

  function ecranTitre() {
    montrer('ecran-titre');
    $('btn-continuer').hidden = !lire(SAVE_KEY);
    const m = meta();
    $('meta-info').textContent = m.fins.length ? `Fins découvertes : ${m.fins.length} / ${FINS_TOTAL}` : '';
  }

  function ecranDon() {
    montrer('ecran-don');
    const m = meta(), l = $('liste-dons'); l.innerHTML = '';
    DONS.forEach(d => {
      const verrou = d.requiert && m.fins.length < d.requiert;
      const b = document.createElement('button');
      b.className = 'don'; b.disabled = !!verrou;
      b.innerHTML = `<b>${verrou ? '???' : d.nom}</b><span>${verrou ? `Se débloque après ${d.requiert} fin${d.requiert > 1 ? 's' : ''} découverte${d.requiert > 1 ? 's' : ''}.` : d.desc}</span>`;
      if (!verrou) b.onclick = () => demarrer(d);
      l.appendChild(b);
    });
  }

  function demarrer(don) {
    S = {
      pv: 20, pvMax: 20, atk: 2, def: 1, or: 10, inv: [], flags: {}, rep: {},
      passage: 'intro', world: nouveauMonde(g), vus: [], notes: [], combat: null, entered: null,
    };
    don.effet(g); S.notes = [];
    montrer('ecran-jeu');
    allerA('intro');
  }

  function continuer() {
    S = lire(SAVE_KEY);
    if (!S) return ecranTitre();
    montrer('ecran-jeu'); rendre();
  }

  $('btn-nouvelle').onclick = () => {
    if (lire(SAVE_KEY) && !confirm('Une partie est en cours. La remplacer par une nouvelle ?')) return;
    ecranDon();
  };

  // Raccourcis clavier : 1 à 9 pour choisir
  document.addEventListener('keydown', e => {
    if ($('ecran-jeu').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (!n) return;
    const b = $('choix').querySelectorAll('button')[n - 1];
    if (b && !b.disabled) b.click();
  });
  $('btn-continuer').onclick = continuer;
  $('btn-accueil').onclick = () => { sauver(); ecranTitre(); };
  ecranTitre();

  window.GAME = { get S() { return S; }, g, allerA, choisir, actionCombat, demarrer, P, DONS };
})();
