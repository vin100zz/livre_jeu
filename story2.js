/* Extension : nouvelles rencontres, carrefour à trois régions, confrontation d'Orsel, deux fins.
   Chargé après story.js : ajoute des passages et modifie quelques passages existants. */

ITEMS.sifflet_gobelin = { nom: 'Sifflet de Brisque', type: 'relique', desc: 'Un sifflet d\'os. Les gobelins du marais viendront quand vous soufflerez dedans.' };
ITEMS.cor_orque       = { nom: 'Cor de la Cendre',   type: 'relique', desc: 'Un cor de corne. Le clan de la Cendre répondra à son appel.' };

const trouve = (p, debut) => p.choix.find(c => c.t.startsWith(debut));

/* ---------- Modifications des passages existants ---------- */

// La forêt : 2 rencontres au hasard parmi 9, puis le carrefour, puis la clairière
P.foret.route = g => {
  g.world.pas = (g.world.pas || 0) + 1;
  if (g.world.pas > 3) return 'lisiere';
  if (g.world.pas === 3) return 'carrefour';
  const pool = ['ev_gobelins', 'ev_orc', 'ev_ronces', 'ev_sorciere', 'ev_fee', 'ev_follet', 'ev_cerf', 'ev_pont', 'ev_colporteur']
    .filter(id => !g.vu(id));
  return g.pick(pool);
};

// Le village : confronter Orsel (si on a écouté les deux témoins)
P.village.choix.splice(3, 0, {
  t: 'Confronter maître Orsel', vers: 'orsel_confronte',
  si: g => g.f('indice_taverne') && g.f('indice_chapelle') && !g.f('orsel_confronte'),
});

// La clairière : plus d'indices requis, deux nouvelles options
trouve(P.clairiere, 'Négocier').si = g => g.indices() >= 3 || g.f('promesse_fee');
P.clair_combat.combat.pv = 20; // équilibrage : le chevalier était trop coriace
trouve(P.clairiere, 'Retourner au village').si = g => g.indices() >= 4;
P.clairiere.choix.splice(2, 0,
  { t: 'Appeler vos alliés (le sifflet, le cor, la promesse de la fée)', vers: 'fin_allies',
    si: g => ['allie_gobelins', 'allie_orcs', 'promesse_fee'].filter(k => g.f(k)).length >= 2 },
  { t: 'Invoquer le droit de l\'hôte : vous avez mangé à la table de la Reine', vers: 'fin_hote',
    si: g => g.f('mange_fee') },
);
trouve(P.clair_negocier, 'Leur proposer de revenir').si = g => g.indices() >= 5;

/* ---------- Village : Orsel ---------- */

P.orsel_confronte = {
  entree: g => { g.flag('orsel_confronte'); g.flag('indice_orsel'); },
  texte: g => {
    const v = {
      reine: `Orsel vous reçoit dans sa maison, un bol de lait tiède devant lui. Quand vous prononcez le mot « dîme », il ne nie pas.\n\n— Je l'ai appris à ma prise de charge. Un coffre, une page, un nom. Je ne choisis personne : la fée vient, et je tiens la lanterne. Que voulais-tu que je fasse ? Un village contre une forêt ? Je protège ceux que je peux protéger. Le reste, je le porte.\n\nIl ouvre un tiroir et pose devant vous la page du vieux registre. Elle est déchirée au mauvais endroit.`,
      sorciere: `Orsel vous reçoit debout, les mains dans le dos. Quand vous parlez de la sorcière, il sourit trop vite.\n\n— Aldine ? Oh, elle les prend. Tout le monde le sait. Elle les garde au chaud dans son grenier, six lits bien faits… Il s'arrête une seconde de trop. — Enfin. C'est ce qu'on dit.\n\nSix lits. Vous ne lui avez jamais dit combien il y avait d'enfants chez elle.`,
      ancien: `Orsel pâlit à mesure que vous parlez. Il ne s'assoit pas. Il s'adosse au mur, comme si le mur pouvait répondre à votre place.\n\n— Dix-sept hivers, murmure-t-il. Dix-sept hivers de gel sur les récoltes, avant le premier pacte. Les gens mouraient, tu comprends ? Les enfants les premiers. J'ai fait un calcul. Un contre vingt. Un calcul, voilà tout.\n\nIl sort une bourse. Elle est pleine. « Pour ton silence. Ou ton aide : ce que tu voudras. »`,
    }[g.world.coupable];
    return v;
  },
  choix: [
    { t: 'Prendre la bourse (+20 pièces, la réputation du village −1)', si: g => g.world.coupable !== 'sorciere', vers: 'village', fx: g => { g.or(20); g.rep('village', -1); } },
    { t: 'Refuser tout, et promettre de revenir avec la vérité', vers: 'village', fx: g => g.rep('village', 1) },
    { t: 'Sortir sans un mot', vers: 'village' },
  ],
};

/* ---------- Nouvelles rencontres ---------- */

/* --- Le cerf blanc --- */
P.ev_cerf = {
  texte: `Un cerf blanc se tient au milieu du sentier, immobile, la ramure couverte de rosée. Il ne fuit pas. Ses yeux sont d'un bleu qui n'existe pas chez les bêtes.

Il vous regarde. Puis il se détourne, fait trois pas, et se retourne encore, comme quelqu'un qui vous invite.`,
  choix: [
    { t: 'Le suivre', vers: 'ev_cerf_suivre' },
    { t: 'Le chasser (il ferait un excellent repas)', vers: 'ev_cerf_chasser' },
    { t: 'Le laisser filer', vers: 'foret' },
  ],
};
P.ev_cerf_suivre = {
  entree: g => { g.flag('indice_cerf'); g.rep('fees', 1); },
  texte: g => `Le cerf vous conduit à travers des broussailles que vous n'auriez pas franchies seul, jusqu'à un ruisseau d'eau claire. Il s'arrête, boit, vous regarde boire.

Sur l'autre rive, des empreintes d'enfants dans la boue. Légères. Nombreuses. Elles descendent toutes dans la même direction, vers la grande clairière, et aucune ne remonte.

Quand vous relevez la tête, le cerf a disparu. L'eau a le goût de la pierre claire et de la neige.`,
  choix: [{ t: 'Continuer (+4 vie)', vers: 'foret', fx: g => g.pv(4) }],
};
P.ev_cerf_chasser = {
  entree: g => { g.flag('cerf_tue'); g.rep('fees', -2); },
  texte: `Il ne bouge pas quand vous tirez. Il vous regarde jusqu'au bout, sans reproche, ce qui est pire.

La viande est rouge et chaude, et vous mangez sans plaisir. Quelque part, dans les branches, des clochettes très fines tintent une note triste, puis se taisent.`,
  choix: [{ t: 'Continuer (+8 vie)', vers: 'foret', fx: g => g.pv(8) }],
};

/* --- Le troll du pont --- */
P.ev_pont = {
  texte: `Un pont de pierre moussue enjambe un torrent noir. Sous l'arche, une masse grise se déplie lentement : un troll, couvert de lichen, avec des yeux fatigués et une voix qui ressemble à un éboulement.

— Je suis Grobail. Je garde ce pont. Je ne veux ni or ni sang. Je veux une histoire. Une vraie. Racontez-moi quelque chose que vous n'avez jamais dit.`,
  choix: [
    { t: 'Raconter le jour où vous avez eu vraiment peur', vers: 'ev_pont_vrai' },
    { t: 'Inventer une histoire héroïque', vers: 'ev_pont_mentir' },
    { t: 'Le combattre', vers: 'ev_pont_combat' },
  ],
};
P.ev_pont_vrai = {
  entree: g => { g.flag('indice_pont'); g.pvMax(2); },
  texte: `Vous racontez. Le cri dans la nuit, l'attente, ce que vous avez cru devoir faire, ce que vous n'avez pas fait. Votre voix trébuche. Grobail écoute, immense, immobile, les yeux fermés.

— Merci, dit-il enfin. Les gens mentent, d'habitude. Ça gâche le pain. Il y a sept nuits, des enfants sont passés sur mon pont, tous ensemble, les yeux ouverts mais dormant. Ils tenaient des lanternes qui ne brûlaient pas. Je n'ai pas osé les arrêter. J'y pense chaque jour.`,
  choix: [{ t: 'Passer le pont', vers: 'foret' }],
};
P.ev_pont_mentir = {
  route: g => (g.rnd(1, 6) + g.atkTot >= 5 ? 'ev_pont_menti_ok' : 'ev_pont_menti_ko'),
};
P.ev_pont_menti_ok = {
  texte: `Vous brodez, vous ornez, vous rugissez presque. Grobail hoche la tête avec lassitude.

— Faux, dit-il. Mais bien raconté. Passez.`,
  choix: [{ t: 'Passer le pont', vers: 'foret' }],
};
P.ev_pont_menti_ko = {
  texte: `Grobail vous écoute jusqu'à la fin, puis vous soulève d'une main et vous fait faire un petit tour au-dessus du torrent.

— Je ne mange pas les menteurs, explique-t-il. Je les rince.`,
  choix: [{ t: 'Ressortir de l\'eau glacée (−6 vie)', vers: 'foret', fx: g => g.pv(-6) }],
};
P.ev_pont_combat = {
  texte: `Grobail soupire, déplie ses poings de pierre.

— J'espérais que non.`,
  combat: { nom: 'Grobail, le troll', pv: 18, atk: 2, def: 2 },
  victoire: 'ev_pont_butin', fuite: 'foret',
};
P.ev_pont_butin = {
  entree: g => { g.or(14); g.rep('fees', -1); },
  texte: `Il tombe à genoux, et ne meurt pas : il se tasse, simplement, devient un rocher avec des yeux. Sous le pont, dans la vase, quelqu'un a laissé des pièces. Des offrandes. Pour lui.`,
  choix: [{ t: 'Prendre les pièces et passer', vers: 'foret' }],
};

/* --- Le colporteur sans ombre --- */
P.ev_colporteur = {
  texte: `Un homme maigre, chapeau de feutre, marche à reculons sur le sentier en tirant une charrette bâchée. Quand il se retourne, vous remarquez qu'il n'a pas d'ombre. Il ne semble pas s'en soucier.

— Beau voyageur ! Je vends, j'achète, je prédis, je joue. Rien de tout cela n'est dangereux. Rien de tout cela n'est gratuit.`,
  choix: [
    { t: 'Acheter une potion (4 pièces)', montrer: true, si: g => g.argent >= 4, raison: 'Pas assez d\'or.', fx: g => { g.or(-4); g.give('potion'); } },
    { t: 'Faire lire votre avenir (2 pièces)', montrer: true, si: g => g.argent >= 2 && !g.f('colporteur_lu'), raison: 'Pas assez d\'or.', vers: 'ev_colporteur_lire', fx: g => g.or(-2) },
    { t: 'Jouer aux dés (5 pièces, une chance sur deux)', montrer: true, si: g => g.argent >= 5, raison: 'Pas assez d\'or.', vers: 'ev_colporteur_pari', fx: g => g.or(-5) },
    { t: 'Passer votre chemin', vers: 'foret' },
  ],
};
P.ev_colporteur_lire = {
  entree: g => { g.flag('colporteur_lu'); g.flag('indice_colporteur'); },
  texte: g => {
    const v = {
      reine: `— Je vois un trône de racines. Je vois une dette plus vieille que vous, plus vieille que lui — il désigne le village au loin. Rien n'a été volé, tout a été donné. Cela ne rend pas les choses plus simples.`,
      sorciere: `— Je vois une femme qui cache ce que tout le monde voudrait lui prendre. Je vois une peur, et quelqu'un qui l'entretient. Ce n'est pas toujours la bête qu'il faut craindre. C'est celui qui la montre du doigt.`,
      ancien: `— Je vois un vieil homme qui compte des enfants comme on compte des brebis. Je vois un puits qui donne de l'eau claire parce qu'on lui a offert quelque chose en échange. Quelqu'un a signé en vous.`,
    }[g.world.coupable];
    return `${v}\n\nIl range ses cartes. — Voilà. Vous ne pourrez pas dire que je ne vous ai rien dit.`;
  },
  choix: [{ t: 'Retourner à ses affaires', vers: 'ev_colporteur' }],
};
P.ev_colporteur_pari = {
  route: g => (g.rnd(1, 2) === 1 ? 'ev_colporteur_gagne' : 'ev_colporteur_perd'),
};
P.ev_colporteur_gagne = {
  entree: g => g.or(15),
  texte: `Les dés roulent sur la bâche, et s'arrêtent. Le colporteur siffle, admiratif, et vous pousse une pile de pièces.

— Bien joué. Vous êtes de ceux qui ont de la chance. Ne la gaspillez pas.`,
  choix: [{ t: 'Retourner à ses affaires', vers: 'ev_colporteur' }],
};
P.ev_colporteur_perd = {
  texte: `Les dés roulent, et s'arrêtent. Le colporteur compte les points, secoue la tête avec une pitié presque sincère.

— Dommage. La chance, c'est comme les fées : on ne s'y attache pas.`,
  choix: [{ t: 'Retourner à ses affaires', vers: 'ev_colporteur' }],
};

/* ---------- Le carrefour : trois régions ---------- */

P.carrefour = {
  texte: `Le sentier se divise en trois, au pied d'un vieux chêne couvert d'ex-voto : rubans, osselets, petits jouets de bois, mèches de cheveux. Trois poteaux de bois indiquent trois chemins.

Le premier descend vers un marais où brillent des lueurs. Le deuxième monte vers une colline aux fumées lourdes. Le troisième s'enfonce dans un bois trop beau, où la lumière semble attendre.

Tous mènent à la clairière. Pas de la même façon.`,
  choix: [
    { t: 'Le marais des Lanternes (le pays des gobelins)', vers: 'marais' },
    { t: 'La colline de la Cendre (le pays des orcs)', vers: 'colline' },
    { t: 'Le verger des mille voix (le pays des fées)', vers: 'verger' },
  ],
};

/* --- Le marais --- */
P.marais = {
  texte: `Le marais clapote, brille, murmure. Des lanternes de verre pendent à des perches enfoncées dans la vase. Chaque lanterne est un petit fanal gobelin, qui marque un chemin sûr.

Des yeux jaunes vous observent derrière les roseaux.`,
  choix: [
    { t: 'Appeler les gobelins, bras levés, sans arme', si: g => !g.f('gobelins_tues') && g.repOf('gobelins') >= 1, vers: 'marais_terrier' },
    { t: 'Vous avancer, la main sur le pommeau, sans oser parler', si: g => !g.f('gobelins_tues') && g.repOf('gobelins') < 1, vers: 'marais_passer' },
    { t: 'Entrer dans le marais, tête haute', si: g => g.f('gobelins_tues'), vers: 'marais_embuscade' },
  ],
};
P.marais_terrier = {
  entree: g => { g.flag('allie_gobelins'); g.flag('indice_marais'); g.give('sifflet_gobelin'); g.pv(8); },
  texte: `Le gobelin au chapeau de chaudron sort des roseaux, suivi de dix autres. Ils vous reconnaissent. Ils vous conduisent à un terrier sous une racine géante, où brûle un feu de tourbe.

On vous donne de la galette, de la soupe de grenouilles, un rire sans moquerie. Brisque, le chef, vous parle à voix basse : « Les traces du petit s'arrêtent au cercle de la clairière. Tu y vas ? Alors prends ça. »

Il vous tend un sifflet d'os. « Si ça tourne mal, souffle. On viendra. Pas par bonté : par dette. »`,
  choix: [{ t: 'Prendre congé (+8 vie)', vers: 'foret' }],
};
P.marais_passer = {
  texte: `Les gobelins ne vous attaquent pas. Ils vous observent, vous suivent de loin, silencieux, comme on suit un animal dont on ignore les intentions. Vous traversez le marais sans incident, un peu mouillé, un peu humilié.

Vous auriez peut-être pu leur parler.`,
  choix: [{ t: 'Continuer (−3 vie)', vers: 'foret', fx: g => g.pv(-3) }],
};
P.marais_embuscade = {
  texte: `Les lanternes s'éteignent, l'une après l'autre. Les roseaux s'ouvrent. Des gobelins en armes vous entourent, silencieux, le visage dur. Ils ont retrouvé le camp du péage. Ils savent.

— Meurtrier, dit simplement Brisque.`,
  combat: { nom: 'Chasseurs gobelins', pv: 16, atk: 2, def: 1 },
  victoire: 'marais_embuscade_fin', fuite: 'foret',
};
P.marais_embuscade_fin = {
  entree: g => { g.rep('gobelins', -1); g.pv(-2); },
  texte: `Ceux qui ont survécu s'enfuient dans les roseaux. Le marais se referme. Il y aura des vengeances, plus tard. Il y en a toujours.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};

/* --- La colline --- */
P.colline = {
  texte: `Un campement de pierre grise et de peaux tendues, sur une colline pelée. Des tambours bas battent quelque part, une cadence qui ressemble à un cœur patient. Des orcs affûtent des armes, sans hâte.

Quand vous arrivez, tous lèvent la tête.`,
  choix: [
    { t: 'Vous présenter : « Je suis celui qui a aidé Urghal. »', si: g => g.repOf('orcs') >= 1 && !g.f('orc_vole'), vers: 'colline_festin' },
    { t: 'Annoncer que vous cherchez les enfants disparus', si: g => g.repOf('orcs') < 1 && !g.f('orc_vole'), vers: 'colline_epreuve' },
    { t: 'Monter sans cacher votre visage', si: g => g.f('orc_vole'), vers: 'colline_duel' },
  ],
};
P.colline_festin = {
  entree: g => { g.flag('allie_orcs'); g.flag('indice_colline'); g.give('cor_orque'); g.pv(10); },
  texte: `Urghal vous accueille sur sa jambe encore raide, une main sur votre épaule, la voix grondante. Il vous conduit au grand feu, sert la viande, le vin lourd, les histoires de clan. On vous chante une chanson dans une langue que vous ne comprenez pas ; vous comprenez quand même.

— Les petits sont dans la clairière, dit-il sans détour. J'y suis allé une fois. La Reine m'a demandé de partir. Je suis parti. Je le regrette chaque nuit.

Il détache de sa ceinture un cor de corne gravé. — Souffle dedans, et la Cendre viendra.`,
  choix: [{ t: 'Prendre congé (+10 vie)', vers: 'foret' }],
};
P.colline_epreuve = {
  texte: `Les orcs vous regardent avec une neutralité méfiante. Un colosse tatoué se lève, plante son coude sur une souche.

— Les humains disent beaucoup. Montre ta force, ensuite on parlera.`,
  choix: [
    { t: 'Relever le défi du bras de fer', vers: 'colline_bras' },
    { t: 'Décliner poliment', vers: 'foret' },
  ],
};
P.colline_bras = { route: g => (g.rnd(1, 6) + g.atkTot >= 6 ? 'colline_bras_ok' : 'colline_bras_ko') };
P.colline_bras_ok = {
  entree: g => { g.flag('allie_orcs'); g.flag('indice_colline'); g.give('cor_orque'); g.rep('orcs', 2); },
  texte: `Votre bras tremble, tient, tient encore. Le colosse sourit, d'un seul côté, et finit par lâcher. Les orcs rugissent d'approbation.

— Les petits sont dans la clairière, dit-il en vous tendant un cor de corne. Si tu as besoin de nous, souffle. La Cendre répond à ceux qui l'honorent.`,
  choix: [{ t: 'Prendre congé', vers: 'foret' }],
};
P.colline_bras_ko = {
  entree: g => { g.flag('indice_colline'); },
  texte: `Votre bras plie. Le colosse vous relâche avec une étrange délicatesse.

— Pas mal, pour un humain. On ne t'aidera pas, mais on ne t'a pas ri au nez. Les petits sont dans la clairière, au centre. Va.`,
  choix: [{ t: 'Prendre congé (−4 vie)', vers: 'foret', fx: g => g.pv(-4) }],
};
P.colline_duel = {
  texte: `Le silence tombe comme un couperet. Urghal est là, sa jambe soignée, les yeux froids. Il ne dit rien. C'est son champion qui s'avance, un colosse couvert de cicatrices, armé d'une masse de pierre.

— Tu as pris ce qui n'était pas à toi, dit Urghal. Ici, ça se règle devant le clan.`,
  combat: { nom: 'Champion de la Cendre', pv: 20, atk: 3, def: 2 },
  victoire: 'colline_honneur', defaite: 'mort',
};
P.colline_honneur = {
  entree: g => { g.flag('allie_orcs'); g.flag('indice_colline'); g.flag('orc_vole', false); g.give('cor_orque'); g.rep('orcs', 3); },
  texte: `Le champion s'incline, genou à terre, et vous tend la main. Urghal s'approche, longtemps, sans un mot. Puis il pose la sienne sur votre épaule.

— La dette est payée. Mon clan n'oublie pas : il pardonne aussi, parfois. Les petits sont dans la clairière. Prends ce cor. Je ne le donne qu'une fois.`,
  choix: [{ t: 'Prendre congé', vers: 'foret' }],
};

/* --- Le verger des fées --- */
P.verger = {
  texte: `Les arbres sont chargés de fruits d'or, de pommes rouges, de cerises, en toute saison. L'air sent la miel et la cire chaude. Des voix, légères et nombreuses, chuchotent derrière chaque tronc.

Une jeune fille aux cheveux de ronces, pieds nus, vous barre le sentier.`,
  choix: [
    { t: 'Montrer le fil d\'argent noué à votre doigt', si: g => g.has('fil_argent') || g.f('promesse_fee') || g.repOf('fees') >= 1, vers: 'verger_accueil' },
    { t: 'Demander poliment le passage', si: g => !(g.has('fil_argent') || g.f('promesse_fee') || g.repOf('fees') >= 1), vers: 'verger_enigme' },
  ],
};
P.verger_enigme = {
  texte: `— Aucun étranger n'entre sans répondre, dit la jeune fille. Voici : « Qu'est-ce qui vous appartient, mais que les autres utilisent plus que vous ? »`,
  choix: [
    { t: '« Mon nom. »', vers: 'verger_accueil' },
    { t: '« Mon épée. »', vers: 'verger_rate' },
    { t: '« Mon argent. »', vers: 'verger_rate' },
  ],
};
P.verger_rate = {
  texte: `La jeune fille sourit tristement. Les ronces de ses cheveux se resserrent d'un coup autour de votre cheville, puis relâchent.

— Dommage. Allez, passez. Mais pas par ici.`,
  choix: [{ t: 'Rebrousser chemin (−5 vie)', vers: 'foret', fx: g => g.pv(-5) }],
};
P.verger_accueil = {
  texte: `La jeune fille s'efface, soudain souriante. Au bout de l'allée, une longue table est dressée sous les branches : pains dorés, fruits de miel, vin clair. Des convives légers, translucides, s'écartent pour vous faire place.

— Vous êtes attendu, dit la jeune fille. Asseyez-vous. Mangez, buvez : c'est la coutume.

Vous vous rappelez les mots d'Orsel : ne mange rien de ce qu'on t'offre.`,
  choix: [
    { t: 'Manger et boire à la table des fées', vers: 'verger_festin' },
    { t: 'Refuser poliment, et leur dire pourquoi', vers: 'verger_refus' },
  ],
};
P.verger_festin = {
  entree: g => { g.flag('mange_fee'); g.flag('indice_verger'); g.pvMax(5); g.pv(99); g.rep('fees', 1); },
  texte: `Le pain a le goût de tout ce que vous avez aimé. Le vin éclaire vos veines. Vous riez avec des inconnus dont vous oubliez immédiatement le nom. Quand vous vous levez enfin, vous vous sentez plus fort que jamais.

La jeune fille se penche à votre oreille : — Nous ne mentons pas, vous savez. Vous êtes notre hôte maintenant. La Reine vous doit quelque chose. Ne l'oubliez pas.

Vous ne savez pas combien de temps a passé. Peut-être une heure. Peut-être une saison.`,
  choix: [{ t: 'Reprendre la route, léger et inquiet', vers: 'foret' }],
};
P.verger_refus = {
  entree: g => { g.flag('indice_verger'); g.rep('fees', 1); g.pv(4); },
  texte: `Vous dites merci, vous dites non, vous dites pourquoi. Un murmure parcourt la table. La jeune fille vous regarde longuement.

— Il est sage, dit-elle enfin. Les sages vivent plus longtemps, et sont plus tristes. Prenez au moins ceci, sans condition : un renseignement. Les enfants ne sont pas malheureux. C'est cela le plus cruel.`,
  choix: [{ t: 'Reprendre la route (+4 vie)', vers: 'foret' }],
};

/* ---------- La veillée à la lisière ---------- */

P.lisiere = {
  texte: g => `Le soir tombe. Entre les troncs, à une centaine de pas, la clairière brille d'une lumière trop douce, comme une pièce où l'on a oublié d'éteindre une bougie. On entend des rires d'enfants, très loin.

${g.indices() >= 4 ? 'Vous croyez comprendre ce qui se joue là-bas. Ce n\'est pas tout à fait rassurant.' : g.indices() >= 2 ? 'Vous avez quelques pièces du puzzle, mais pas toutes.' : 'Vous ne savez presque rien. Il est encore temps de faire demi-tour, ou de vous préparer.'}

Vous pourriez vous reposer un peu avant d'entrer.`,
  choix: [
    { t: 'Dormir quelques heures à l\'abri d\'un chêne (+10 vie, une seule fois)', si: g => !g.f('veillee'), montrer: true, raison: 'Vous avez déjà dormi ici.', vers: 'lisiere', fx: g => { g.flag('veillee'); g.pv(10); } },
    { t: 'Boire une potion avant d\'avancer', si: g => g.has('potion'), montrer: true, raison: 'Vous n\'avez pas de potion.', vers: 'lisiere', fx: g => { g.take('potion'); g.pv(8); } },
    { t: 'Entrer dans la clairière', vers: 'clairiere' },
  ],
};

/* ---------- Deux nouvelles fins ---------- */

P.fin_allies = {
  fin: 'Le cor, le sifflet et la promesse',
  texte: g => {
    const al = [g.f('allie_gobelins') && 'les gobelins du marais', g.f('allie_orcs') && 'le clan de la Cendre', g.f('promesse_fee') && 'la fée à qui vous avez promis'].filter(Boolean);
    return `Vous soufflez. Le monde se tait une seconde, puis répond. Du marais, des collines, des arbres, ils arrivent : ${al.join(', ')}. Une armée hétéroclite, vacillante, mal alignée, à la lisière de la clairière.

La Reine se lève. Les enfants cessent de jouer. Un long moment, personne ne bouge. Puis la Reine éclate d'un rire clair, presque soulagé.

— Voilà ce que je n'avais jamais vu : un humain qui ne vient pas seul. Soit. Il y aura une trêve entre la forêt et le village, et cette fois, ce seront des gens de la forêt qui la garderont.

Les enfants rentrent, escortés par des orcs maladroits et des gobelins fiers. Hautgué n'a jamais vu un cortège pareil. Il faudra du temps pour s'y habituer. Mais la forêt n'est plus un secret, et ceux qui y vivent ont maintenant un nom pour vous.`;
  },
};

P.fin_hote = {
  fin: 'Le droit de l\'hôte',
  texte: g => `— Vous avez mangé à ma table, dit la Reine lentement. Je vous dois une chose. Une seule. C'est la règle.

Vous demandez les enfants. Elle ferme les yeux. Le silence dure longtemps.

— Soit. Mais ce que je donne, je le reprends d'une autre manière. Vous me devrez un an et un jour de service, quand je vous appellerai. Pas avant. Pas après. Et vous ne choisirez pas quand.

Les enfants repartent. Au village, on vous accueille comme un héros. Chaque nuit de lune pleine, vous rêvez d'une table dressée sous les branches, et d'un siège vide à votre nom. Vous savez que vous le prendrez un jour.`,
};

STORY.FINS_TOTAL = 7;

/* =====================================================================
   FINS COMPLÈTES : chaque fin existe en trois versions (selon le vrai
   coupable) et se termine par un épilogue qui rappelle vos choix.
   ===================================================================== */

const epilogue = (g, sauves, idFin) => {
  const l = [];
  if (sauves) {
    l.push(`La petite {{enfant}} se souviendra de la clairière comme d'un rêve dont on ne sait pas s'il était beau. Elle ne dira rien. Les autres non plus.`);
    if (g.f('indice_gobelins') && !g.f('gobelins_tues')) l.push(`Parmi les enfants se trouvait un tout petit gobelin, que personne n'avait su compter. Brisque est venu le chercher à la lisière du village, chapeau-chaudron sous le bras, et vous a salué d'une inclinaison de tête que Hautgué n'a jamais comprise.`);
    if (g.f('gobelins_tues')) l.push(`Au marais, on allume chaque soir une lanterne de plus. Vous ne saurez jamais si l'un d'eux cherchait un enfant ou un fils.`);
  } else {
    l.push(`Au village, la petite {{enfant}} reste une chaise vide autour d'une table. Sa mère met encore son couvert, certains soirs.`);
  }
  if (g.f('allie_orcs')) l.push(`Chaque printemps, Urghal descend de la colline pour troquer des peaux contre du sel. Il vous cherche toujours dans la foule, et vous serre l'avant-bras un peu trop fort.`);
  else if (g.f('orc_vole')) l.push(`Un matin, vous trouvez une hache plantée dans le seuil de votre porte. Pas la vôtre. Pas une menace non plus : un rappel.`);
  if (g.f('brunehaut_ami')) l.push(`La vieille Brunehaut brode, dans la chapelle, un nom nouveau sur une nappe d'autel. Le vôtre. Elle ne dit pas pourquoi.`);
  if (g.repOf('village') >= 1) l.push(`À Hautgué, on vous garde une place à la table du Chaudron fendu, et Mathis ne vous fait plus payer la soupe.`);
  else if (g.repOf('village') <= -1) l.push(`À Hautgué, on vous salue du bout des lèvres. On n'oublie pas qu'un jour vous avez demandé de l'or pour des enfants.`);
  if (g.f('mange_fee') && idFin !== 'fin_hote') l.push(`Parfois, une pomme trop belle attend sur votre rebord de fenêtre. Vous n'osez pas la manger. Vous n'osez pas la jeter non plus.`);
  if (g.f('cerf_tue')) l.push(`Le cerf blanc ne reparaît plus. Les pommiers du village ne fleurissent plus, et personne ne fait le lien, sauf vous.`);
  else if (g.repOf('fees') >= 2) l.push(`Certains soirs, une petite lumière danse un moment à votre fenêtre, comme quelqu'un qui vérifie que vous êtes là.`);
  if (g.f('souvenir_donne')) l.push(`Il vous arrive de chercher un souvenir sans savoir lequel. Cela ressemble à un mot sur le bout de la langue. Vous n'avez jamais su ce que vous avez donné à Aldine, et vous continuez à vous demander si c'était cher.`);
  return `Ce qu'il advint ensuite.\n\n${l.slice(0, 5).join('\n\n')}`;
};

const CORPS = {
  fin_force: {
    reine: `Le chevalier d'épines s'effondre en un tas de brindilles, et la Reine d'Aubépine se lève, très droite, sans un cri. Elle ne vous maudit pas. Elle regarde ses fleurs de pommier perdre leurs pétales l'une après l'autre.

— Voilà, dit-elle. Vous avez pris ce qui était dû. Mais le prix, vous ne l'avez pas lu.

Vous ramenez les sept enfants à l'aube. Dès le premier gel, les puits se couvrent de glace ; au deuxième, le blé ne lève plus. Le pacte tenait l'hiver à distance. Vous l'avez rompu, et Hautgué en paiera le reste.`,
    sorciere: `Le chevalier d'épines s'effondre, et vous vous rendez compte trop tard qu'Aldine était derrière vous, bâton en main, prête à protéger les enfants de vous. Elle vous regarde, épuisée, sans haine.

— Vous aviez raison de les chercher, dit-elle. Vous aviez tort de croire que la force suffisait.

Vous ramenez les enfants au village à l'aube. Orsel saisit sa chance : il hurle, pointe Aldine du doigt, et la foule, soulagée d'avoir une réponse, la chasse à coups de pierres jusqu'à la lisière. Elle n'a pas dit un mot pour se défendre. Vous avez sauvé sept enfants et livré une innocente. On vous dira merci.`,
    ancien: `Le chevalier d'épines s'effondre. La Reine ne s'y oppose pas. Elle semble presque soulagée.

— Je ne voulais pas d'eux, dit-elle. Reprenez-les. Mais n'oubliez pas qui me les a offerts.

Vous ramenez les enfants au village. Orsel les regarde descendre un à un, et pour la première fois ne peut plus soutenir votre regard. Mais personne ne l'accuse, faute de preuve. Il retrouvera sa chaise au conseil et sa lanterne à la Toussaint. Les enfants sont rentrés. Le coupable aussi, d'une certaine manière.`,
  },
  fin_negocie: {
    reine: `Votre offre pèse quelque chose dans l'air. La Reine d'Aubépine hésite, ferme les yeux, puis hoche la tête.

— Soit. Les enfants repartent avec vous. En échange, la dîme cesse, et le village se souviendra de moi autrement que comme d'une ogresse. Je suis fatiguée d'être un monstre pour des gens qui m'ont inventée.

Vous reprenez la route, les sept enfants à vos côtés, hésitants, les yeux un peu trop brillants. Ce sera un autre genre de vie, à Hautgué : celui où l'on sait ce qu'on doit à la forêt, et où l'on apprend, doucement, à le payer autrement.`,
    sorciere: `Vous parlez, et Aldine écoute, appuyée sur son bâton. Quand vous avez fini, elle baisse enfin les yeux sur les six enfants serrés contre elle.

— Je ne les garde pas par plaisir, dit-elle. Mais je ne peux pas les rendre à un village qui a décidé de les sacrifier. Prouvez-moi qu'il a changé.

Vous restez trois jours avec elle. Au quatrième, vous redescendez avec des preuves, des témoins, la vieille Brunehaut. Orsel perd sa charge sans qu'une main se lève sur lui. Aldine ramène elle-même les enfants, au crépuscule. On ne lui jette pas de pierres. On se tait, c'est mieux.`,
    ancien: `La Reine vous écoute, longuement, puis soupire.

— Une promesse faite par un seul homme ne devrait pas pouvoir lier une forêt entière. Mais telle est la règle. Je ne puis rompre ce qu'on m'offre. Je puis seulement accepter autre chose, plus grand.

Elle prend votre offre, et la pèse, et la trouve juste. Les enfants repartent avec vous. Orsel, à votre retour, comprend en vous voyant que son temps est fini. Il ne dit rien. Il va s'asseoir sur la margelle du puits, et on ne le revoit plus de la journée. On ne le revoit plus du tout.`,
  },
  fin_pacte: {
    reine: `Vous ne savez pas pourquoi vous dites cela. Les mots viennent seuls, comme une promesse qu'on a déjà prononcée dans un autre rêve.

— Prenez-moi à leur place.

Un silence s'étire. Puis un rire doux, ou peut-être un sanglot.

— Voilà ce que personne n'avait offert depuis trois cents ans, dit la Reine d'Aubépine.

Les enfants repartent. Vous restez. Chaque nuit, quand les lanternes se mettent à marcher, vous marchez avec elles. On vous appellera un jour le Gardien. Au village, on racontera votre histoire, et personne ne saura jamais qu'elle a fini plus calmement qu'elle n'a commencé.`,
    sorciere: `— Prenez-moi à leur place.

Aldine vous regarde, abasourdie. Elle n'a pas de pouvoir qui puisse accepter un tel marché. Pourtant, ce qu'elle protège est plus ancien que sa magie : une promesse de forêt qui exige un gardien. Les pierres du cercle se mettent à luire doucement.

— Alors vous ne pourrez plus partir, murmure-t-elle. Pas tant que les enfants du village auront besoin de quelqu'un pour se tenir entre eux et Orsel.

Aldine redescend avec les six enfants. Vous restez. Vous apprenez la forêt, les noms des fougères, les pas des orcs, les ruses des fées. On vous appellera un jour le Gardien. Cela ne vous déplaît pas.`,
    ancien: `— Prenez-moi à leur place.

La Reine d'Aubépine vous regarde longtemps. Ce qu'elle voit ne ressemble pas à ce qu'Orsel lui a offert, autrefois.

— Voilà, dit-elle, la première fois qu'on me donne quelqu'un qui a choisi de venir.

Elle rend les enfants. Dans sa voix, il y a un soulagement qu'elle ne cache pas. Vous restez. On vous donne une lanterne, un nom, un rôle : le Gardien de la dette. Vous êtes là pour que le pacte soit tenu autrement, par vous, sans que personne d'autre n'ait à payer. Orsel, lui, n'a pas besoin de punition. Il a la vôtre sous les yeux chaque Toussaint.`,
  },
  fin_fuite: {
    reine: `Vous reculez. Personne ne vous retient. Les arbres se referment derrière vous, sans un bruit, comme on referme un livre.

Au village, vous direz que vous n'avez rien trouvé. On vous croira, parce que c'est ce que l'on veut entendre. Il y aura un huitième enfant l'an prochain, puis un neuvième. La Reine d'Aubépine tient ses comptes avec soin, et personne n'ira lui réclamer ce qui lui est dû.

Chaque soir, quand le brouillard monte, vous saurez très exactement ce qu'il cache.`,
    sorciere: `Vous reculez. Aldine ne vous retient pas. Elle vous regarde partir, avec la patience de ceux qui ont déjà tout perdu.

Au village, vous direz que vous n'avez rien trouvé. Orsel hochera la tête avec un sourire mince. Dans un mois, on brûlera la chaumière d'Aldine, sans preuve, parce qu'il faut bien un coupable. Elle disparaîtra avec les six enfants avant, ou bien pas.

Vous ne saurez jamais lequel. Cela vous suivra plus longtemps que la peur.`,
    ancien: `Vous reculez. La Reine d'Aubépine ne bouge pas. Elle a l'habitude qu'on la laisse seule.

Au village, vous direz que vous n'avez rien trouvé. Orsel posera une main sur votre épaule, trop longtemps, avec une reconnaissance que vous ne voulez pas comprendre. À la Toussaint, il montera dans la forêt avec deux autres, sans lanterne.

Vous aurez vu, et vous aurez laissé faire. C'est un genre de complicité qui ne s'efface pas.`,
  },
  fin_allies: {
    reine: `Vous soufflez. Le monde se tait une seconde, puis répond. Du marais, des collines, des arbres, ils arrivent, une armée hétéroclite, vacillante, mal alignée, à la lisière de la clairière.

La Reine d'Aubépine se lève. Les enfants cessent de jouer. Un long moment, personne ne bouge. Puis elle éclate d'un rire clair, presque soulagé.

— Voilà ce que je n'avais jamais vu : un humain qui ne vient pas seul. Soit. Une trêve, entre la forêt et le village, et cette fois ce seront des gens de la forêt qui la garderont.

Les enfants rentrent, escortés par des orcs maladroits et des gobelins fiers. Hautgué n'a jamais vu un cortège pareil.`,
    sorciere: `Vous soufflez. Le monde se tait une seconde, puis répond. Du marais, des collines, des arbres, ils arrivent à la lisière de la clairière, armes baissées, curieux.

Aldine recule d'un pas, déconcertée de voir tant de gens pour des enfants qu'elle avait cru protéger seule. Elle regarde les gobelins, les orcs, les fées. Elle regarde les enfants.

— Je n'ai jamais eu d'alliés, dit-elle. Je n'y avais pas pensé.

Vous descendez ensemble vers Hautgué, la sorcière, les enfants, une garde d'honneur qui fait rentrer les volets. Orsel n'ose pas s'approcher. On ne peut pas accuser quelqu'un qui arrive avec une armée. On peut seulement, plus tard, lui poser des questions.`,
    ancien: `Vous soufflez. Le monde se tait une seconde, puis répond. Du marais, des collines, des arbres, ils arrivent à la lisière de la clairière, hétéroclites, graves.

La Reine d'Aubépine les regarde tous, puis vous.

— Je n'aurais pas tenu cet engagement, dit-elle. Les forces qui me liaient étaient celles d'un homme seul, et voici d'autres forces qui se lèvent. Je suis libre de refuser.

Les enfants repartent, escortés. À Hautgué, Orsel regarde le cortège approcher depuis sa fenêtre, et on ne voit plus son visage. Quand le cortège s'arrête sur la place, il n'a plus d'arguments, seulement un règlement de comptes qui commence.`,
  },
  fin_hote: {
    reine: `— Vous avez mangé à ma table, dit la Reine d'Aubépine lentement. Je vous dois une chose. Une seule. C'est la règle.

Vous demandez les enfants. Elle ferme les yeux. Le silence dure longtemps.

— Soit. Mais ce que je donne, je le reprends d'une autre manière. Vous me devrez un an et un jour de service, quand je vous appellerai. Pas avant. Pas après. Et vous ne choisirez pas quand.

Les enfants repartent. Au village, on vous accueille comme un héros. Chaque nuit de pleine lune, vous rêvez d'une table dressée sous les branches, et d'un siège vide à votre nom.`,
    sorciere: `Aldine reste en retrait, et c'est une autre voix qui répond depuis les branches : la jeune fille aux cheveux de ronces, apparue sans bruit.

— Vous avez mangé à notre table. Notre Reine vous doit une chose, et elle la tiendra, même si ce n'est pas elle qui a pris les enfants.

Elle ordonne : les enfants de la clairière sont libres, tous, sans condition. Aldine, bouleversée, serre les six enfants contre elle. Vous avez gagné sans rien perdre, sauf cette dette légère d'un an et un jour que vous ne choisirez pas.

Au village, Orsel comprendra que la forêt vous protège. Il n'osera plus parler.`,
    ancien: `— Vous avez mangé à ma table, dit la Reine d'Aubépine. Je vous dois une chose. Une seule. Et je sais déjà laquelle.

Elle se lève, ce qu'elle ne fait jamais.

— Je rends les enfants. Je rends aussi le pacte, que je n'aurais jamais dû accepter. Le droit de l'hôte pèse plus lourd que celui du suppliant. Mais vous me devez un an et un jour de service, quand je vous appellerai.

Les enfants repartent. La dîme s'arrête. Orsel ne comprendra jamais pourquoi, ni pourquoi, ce premier hiver sans pacte, le gel est resté à la lisière des champs, comme un animal qui hésite à entrer.`,
  },
};

['fin_force', 'fin_negocie', 'fin_pacte', 'fin_fuite', 'fin_allies', 'fin_hote'].forEach(id => {
  const sauves = id !== 'fin_fuite';
  P[id].texte = g => `${CORPS[id][g.world.coupable]}\n\n${epilogue(g, sauves, id)}`;
});

const verite = P.fin_verite.texte;
P.fin_verite.texte = g => `${verite(g)}\n\n${epilogue(g, true, 'fin_verite')}`;

const mort = P.mort.texte;
P.mort.texte = g => {
  const fin = {
    reine: `On dira à Hautgué que vous êtes parti pour une dîme de plus. La Reine d'Aubépine ajoutera un nom à son registre, sans plaisir, sans colère.`,
    sorciere: `Aldine retrouvera votre corps à l'aube et le ramènera au village, pour qu'on ait au moins une sépulture à pleurer. Orsel dira que la sorcière l'a tué. Il sera cru.`,
    ancien: `Orsel dira que la forêt vous a pris, comme les autres. Il le dira avec sa voix de doyen, et on le croira, parce que c'est la voix qui a toujours dit la vérité à Hautgué.`,
  }[g.world.coupable];
  return `${mort}\n\n${fin}`;
};
