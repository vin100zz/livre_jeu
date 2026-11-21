/* Les Enfants de Brumeval — contenu du jeu (chapitre 1)
   Chaque passage : texte, choix[{t, vers, si, raison, montrer, fx}], et éventuellement
   entree(g), combat{}, victoire/fuite/defaite, route(g), fin. */

const ITEMS = {
  lame_terne:    { nom: 'Lame de fer terni',     type: 'arme',   bonus: 1, desc: 'Attaque +1. Elle a vu des jours meilleurs.' },
  epee_garde:    { nom: 'Épée de garde',         type: 'arme',   bonus: 2, desc: 'Attaque +2. Bien équilibrée.' },
  coutelas:      { nom: 'Coutelas gobelin',      type: 'arme',   bonus: 2, desc: 'Attaque +2. Court, vicieux, efficace.' },
  hache_orque:   { nom: 'Hache d\'Urghal',       type: 'arme',   bonus: 3, desc: 'Attaque +3. Lourde comme une dette.' },
  cape_laine:    { nom: 'Cape de laine épaisse', type: 'armure', bonus: 1, desc: 'Défense +1.' },
  pourpoint:     { nom: 'Pourpoint clouté',      type: 'armure', bonus: 2, desc: 'Défense +2.' },
  potion:        { nom: 'Potion de soin',        type: 'conso',  desc: 'Rend 8 points de vie.', usage: g => g.pv(8) },
  champignon:    { nom: 'Chapeau-de-lune',       type: 'conso',  desc: 'Un champignon pâle. La sorcière dit qu\'il soigne. Elle a dit « généralement ».',
                   usage: g => { if (g.rnd(1, 3) === 1) { g.note('Votre estomac proteste.'); g.pv(-3); } else g.pv(6); } },
  sort_sommeil:  { nom: 'Fil de sommeil',        type: 'sort',   desc: 'Sort à usage unique : endort un adversaire pendant deux tours.' },
  jouet:         { nom: 'Petit cheval de bois',  type: 'relique',desc: 'Un jouet d\'enfant, taché de boue. Il pèse plus lourd qu\'il n\'en a l\'air.' },
  fil_argent:    { nom: 'Fil d\'argent de fée',  type: 'relique',desc: 'Un fil qui ne se casse pas. Une promesse y est nouée.' },
};

const DONS = [
  { nom: 'La lame de votre père',  desc: 'Une épée de fer terni. Attaque +1.',           effet: g => g.give('lame_terne') },
  { nom: 'La cape de votre mère',  desc: 'Épaisse, chaude, reprisée. Défense +1.',        effet: g => g.give('cape_laine') },
  { nom: 'La bourse du village',   desc: 'Quinze pièces de plus, et deux potions.',       effet: g => { g.or(15); g.give('potion'); g.give('potion'); } },
  { nom: 'Une fiole de brume',     desc: 'Un Fil de sommeil, offert par une inconnue.',   effet: g => g.give('sort_sommeil'), requiert: 1 },
];

/* Le monde est tiré au sort à chaque partie : qui a vraiment pris les enfants ? */
const nouveauMonde = g => {
  const coupable = g.pick(['reine', 'sorciere', 'ancien']);
  return {
    coupable,
    enfant: g.pick(['Isaure', 'Mélisende', 'Aveline', 'Oriane']),
    pas: 0,
  };
};

const P = {};
const R = {}; // petits raccourcis de texte

/* ===================== VILLAGE ===================== */

P.intro = {
  texte: `Le brouillard monte chaque soir de la forêt de Brumeval, et chaque soir le village de Hautgué ferme ses volets un peu plus tôt.

Cette nuit, c'est la petite {{enfant}} qui n'est pas revenue. La septième. Sa mère a cessé de crier ; c'est pire.

Maître Orsel, le doyen, vous attend devant la chapelle, la lanterne à la main. Il a le regard de ceux qui ont déjà décidé de ce qu'ils vont vous dire.

— Les fées les prennent, dit-il. Ça a toujours été les fées. Va dans la forêt et ramène-nous nos enfants. Prends ce qu'il faut. Mais ne promets rien aux Gens-de-l'ombre, et ne mange rien de ce qu'on t'offre.`,
  choix: [
    { t: '« J\'irai. Mais je veux d\'abord comprendre. »', vers: 'village', fx: g => g.rep('village', 1) },
    { t: '« Pourquoi les fées, et pas quelqu\'un d\'autre ? »', vers: 'intro_doute' },
    { t: '« Ce sera cent pièces d\'or. »', vers: 'village', fx: g => { g.or(10); g.rep('village', -1); } },
  ],
};

P.intro_doute = {
  texte: `Orsel ne cligne pas des yeux. Un peu trop longtemps, peut-être.

— Parce que c'est la forêt qui les garde, dit-il. Et la forêt, c'est elles. Ne cherche pas de coupable là où il n'y a que de la coutume, petit. Pars.

Il vous remet une bourse un peu trop vite, comme on se débarrasse d'une question.`,
  choix: [{ t: 'Prendre la bourse (+8 pièces) et aller dans le village', vers: 'village', fx: g => g.or(8) }],
};

P.village = {
  texte: g => `Hautgué se serre autour de son puits, toits bas, fumées droites. On vous regarde passer derrière les rideaux. Tout le monde a une théorie, personne ne propose de vous accompagner.

${g.f('indice_taverne') || g.f('indice_chapelle') ? 'Ce que vous avez entendu ne colle pas avec ce que dit Orsel.' : 'Avant de vous enfoncer dans les arbres, vous pourriez écouter le village.'}`,
  choix: [
    { t: 'Entrer à la taverne du Chaudron fendu', vers: 'taverne' },
    { t: 'Passer au marché', vers: 'marche' },
    { t: 'Rendre visite à la vieille Brunehaut, à la chapelle', vers: 'chapelle' },
    { t: 'Entrer dans la forêt', vers: 'foret', fx: g => { g.world.pas = 0; } },
  ],
};

P.taverne = {
  texte: `Le Chaudron fendu sent la soupe de navets et la peur rance. Quand vous entrez, les conversations s'éteignent puis repartent, plus bas. Mathis, le tavernier, essuie deux fois le même verre.

— Un bol chaud ? Trois pièces. Pour les bavardages, c'est gratuit, mais ça vaut ce que ça coûte.`,
  choix: [
    { t: 'Manger un bol de soupe (−3 pièces, +6 vie)', vers: 'taverne_manger', fx: g => { g.or(-3); g.pv(6); } },
    { t: 'Écouter les rumeurs', vers: 'taverne_rumeurs' },
    { t: 'Retour sur la place', vers: 'village' },
  ],
};
// Manger nécessite 3 pièces : on filtre proprement après la définition
P.taverne.choix[0].si = g => g.argent >= 3;
P.taverne.choix[0].montrer = true;
P.taverne.choix[0].raison = 'Il vous faut 3 pièces.';
P.taverne_manger = {
  texte: `La soupe est mauvaise, et vous la finissez jusqu'à la dernière goutte. Mathis vous regarde manger comme on regarde un homme qui part pour un long voyage.`,
  choix: [{ t: 'Écouter les rumeurs', vers: 'taverne_rumeurs' }, { t: 'Retour sur la place', vers: 'village' }],
};

P.taverne_rumeurs = {
  entree: g => { g.flag('indice_taverne'); },
  texte: g => {
    const base = `Un colporteur ivre, un vieux bûcheron, la femme du meunier : chacun apporte sa pierre.`;
    const v = {
      reine: `« Les enfants disparaissent aux nuits sans lune, dit le bûcheron, et l'on retrouve parfois un cercle de champignons à l'endroit où ils dormaient. Pas des cercles de sorcière, non. Des cercles de cour. » Il crache dans le feu. « Mon grand-père disait que le village avait signé quelque chose, jadis. »`,
      sorciere: `« Aucun enfant n'a été retrouvé mort, souffle la meunière. Ni blessé. Ni même griffé. Quelqu'un les prend, mais quelqu'un les soigne. » Elle jette un regard vers la porte. « Vous voulez mon avis ? La vieille Aldine, dans la forêt, ne ferait pas ça pour de mauvaises raisons. »`,
      ancien: `« Chaque automne, dit le colporteur, Orsel et deux autres montent seuls dans la forêt la veille de la Toussaint. Ils reviennent sans lanterne. Et chaque hiver, curieux, le blé de Hautgué est le seul à pousser. » Un silence. Mathis lui verse un verre pour qu'il se taise.`,
    }[g.world.coupable];
    return `${base}\n\n${v}`;
  },
  choix: [{ t: 'Remercier et sortir', vers: 'village' }],
};

P.marche = {
  texte: `Le marché de Hautgué se résume à trois étals et une chèvre. Le marchand Gaspard vous sourit comme on sourit à un client qui a peur.

— J'ai de quoi vous garder en vie, mon brave. Pas gratuitement, bien sûr.`,
  choix: [
    { t: 'Potion de soin (6 pièces)', montrer: true, si: g => g.argent >= 6, raison: 'Pas assez d\'or.', fx: g => { g.or(-6); g.give('potion'); } },
    { t: 'Pourpoint clouté (18 pièces)', montrer: true, si: g => !g.has('pourpoint') && g.argent >= 18, raison: 'Déjà acheté ou trop cher.', fx: g => { g.or(-18); g.give('pourpoint'); } },
    { t: 'Épée de garde (22 pièces)', montrer: true, si: g => !g.has('epee_garde') && g.argent >= 22, raison: 'Déjà achetée ou trop chère.', fx: g => { g.or(-22); g.give('epee_garde'); } },
    { t: 'Retour sur la place', vers: 'village' },
  ],
};

P.chapelle = {
  texte: `La chapelle sent la cire et la poussière. Brunehaut, quatre-vingt-dix ans et une langue de vipère, brode dans l'ombre d'un pilier. Elle ne lève pas les yeux.

— Tu viens pour les enfants. Tout le monde vient pour les enfants, une fois qu'il est trop tard pour les autres choses. Que veux-tu savoir ?`,
  choix: [
    { t: 'Lui demander ce qu\'elle sait', vers: 'chapelle_savoir' },
    { t: 'Lui laisser une pièce pour les cierges (−1 pièce)', si: g => g.argent >= 1, montrer: true, raison: 'Aucune pièce.', vers: 'chapelle_savoir', fx: g => { g.or(-1); g.flag('brunehaut_ami'); g.rep('village', 1); } },
    { t: 'Retour sur la place', vers: 'village' },
  ],
};

P.chapelle_savoir = {
  entree: g => { g.flag('indice_chapelle'); if (g.f('brunehaut_ami') && g.world.coupable === 'reine' && !g.has('fil_argent')) g.give('fil_argent'); },
  texte: g => {
    const v = {
      reine: `— Les fées ne prennent jamais sans qu'on leur donne, dit-elle. Il y a un registre, dans cette chapelle. Une page arrachée. Trois siècles de dîme, et un nom au bas : celui de mon aïeul. Il a vendu quelque chose qui n'était pas à lui. ${g.f('brunehaut_ami') ? 'Tiens, prends ce fil : une fée me l\'a donné pour que je pleure en paix.' : ''}`,
      sorciere: `— On dit que la sorcière vole les petits. Moi, je dis qu'une femme seule dans la forêt est un bouc émissaire tout trouvé. Va la voir avant de la juger. Et méfie-toi de ceux qui crient le plus fort : ils s'écoutent mieux que les autres.`,
      ancien: `— Orsel sait, dit-elle simplement. Il sait depuis le premier hiver où il a été doyen. Je ne l'ai jamais dénoncé : j'ai une petite-fille, et il est bien vu à la table des puissants. Voilà ce que vaut mon silence, petit : une petite-fille.`,
    }[g.world.coupable];
    return `${v}\n\nElle reprend son aiguille. L'audience est terminée.`;
  },
  choix: [{ t: 'Sortir', vers: 'village' }],
};

/* ===================== FORÊT ===================== */

P.foret = {
  route: g => {
    g.world.pas = (g.world.pas || 0) + 1;
    if (g.world.pas > 3) return 'clairiere';
    const pool = ['ev_gobelins', 'ev_orc', 'ev_ronces', 'ev_sorciere', 'ev_fee', 'ev_follet'].filter(id => !g.vu(id));
    return g.pick(pool);
  },
};

/* --- Les gobelins du péage --- */
P.ev_gobelins = {
  texte: `Une corde tendue entre deux chênes, des clochettes en os, et trois gobelins accroupis dans les fougères, à peine plus hauts que votre genou. Celui du milieu porte un chapeau fait d'un chaudron.

— Péage ! Cinq pièces, ou un souvenir précieux. La forêt coûte cher à entretenir.

Leurs yeux jaunes brillent. Ils n'ont pas l'air méchants. Ils ont l'air fatigués, et affamés.`,
  choix: [
    { t: 'Payer le péage (−5 pièces)', montrer: true, si: g => g.argent >= 5, raison: 'Pas assez d\'or.', vers: 'ev_gobelins_payer', fx: g => g.or(-5) },
    { t: 'Leur parler : « Avez-vous vu des enfants ? »', vers: 'ev_gobelins_parler' },
    { t: 'Dégainer', vers: 'ev_gobelins_combat' },
  ],
};
P.ev_gobelins_payer = {
  entree: g => { g.flag('indice_gobelins'); g.rep('gobelins', 1); },
  texte: `Le gobelin au chaudron mord la pièce, puis vous regarde avec un respect inattendu.

— Honnête, murmure-t-il. Alors écoute : nous aussi, on cherche. Un de nos petits a disparu au dernier croissant. On a suivi des traces jusqu'à la grande clairière, là où l'herbe est trop verte. On n'est pas retournés. Les Gens-de-la-clairière ne parlent pas aux gobelins.

Il vous donne une tape sur le mollet, la seule marque d'amitié à sa hauteur.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};
P.ev_gobelins_parler = {
  entree: g => { g.flag('indice_gobelins'); g.rep('gobelins', 1); },
  texte: `Vous vous accroupissez à leur hauteur. Les trois gobelins échangent un regard. On ne leur parle pas souvent comme à des gens.

— Un des nôtres a disparu, avoue le chef. Un des petits. On a suivi des traces jusqu'à la grande clairière. Les pas s'arrêtaient dans l'herbe trop verte, au pied d'un cercle de champignons. On n'a pas osé aller plus loin.

Il vous offre un morceau de galette dure comme une pierre. Vous le mangez, par politesse.`,
  choix: [{ t: 'Continuer', vers: 'foret', fx: g => g.pv(2) }],
};
P.ev_gobelins_combat = {
  texte: `Les gobelins poussent un cri aigu et se jettent sur vous, couteaux de cuisine en avant.`,
  combat: { nom: 'Gobelins du péage', pv: 10, atk: 1, def: 0 },
  victoire: 'ev_gobelins_butin', fuite: 'foret',
};
P.ev_gobelins_butin = {
  entree: g => { g.rep('gobelins', -2); g.flag('gobelins_tues'); g.flag('indice_gobelins'); g.give('coutelas'); g.give('jouet'); g.or(7); },
  texte: `Le silence retombe. Dans leur cachette, sous une racine, vous trouvez un coutelas, quelques pièces… et un petit cheval de bois, taché de boue.

Il est exactement semblable à celui que vous avez vu sur le rebord de la fenêtre de la petite {{enfant}}.

Les gobelins n'étaient peut-être pas des voleurs. Ils cherchaient, eux aussi. Vous n'aurez pas la réponse à cette question.`,
  choix: [{ t: 'Continuer, la gorge nouée', vers: 'foret' }],
};

/* --- L'orc blessé --- */
P.ev_orc = {
  texte: `Un orc est assis contre un tronc, une jambe prise dans un piège à loups. Deux fois votre taille, des tatouages de clan sur l'épaule, une hache posée près de lui. Il vous regarde sans bouger.

— Si tu t'approches, je te tue, dit-il calmement. Si tu pars, je me vide de mon sang. Je n'aime pas ces deux options, mais je les connais.`,
  choix: [
    { t: 'L\'aider (utiliser une potion)', montrer: true, si: g => g.has('potion'), raison: 'Vous n\'avez pas de potion.', vers: 'ev_orc_aider', fx: g => g.take('potion') },
    { t: 'Ouvrir le piège sans potion (−3 vie)', vers: 'ev_orc_aider2', fx: g => g.pv(-3) },
    { t: 'Prendre sa hache et sa bourse', vers: 'ev_orc_voler' },
    { t: 'S\'éloigner', vers: 'foret' },
  ],
};
P.ev_orc_aider = {
  entree: g => { g.flag('indice_orc'); g.rep('orcs', 2); g.give('hache_orque'); },
  texte: `Vous desserrez les mâchoires de fer et versez la potion sur la plaie. L'orc se laisse faire, les yeux mi-clos.

— Urghal, dit-il enfin. Fils du clan de la Cendre. Tu es le premier humain qui ne m'a pas volé.

Il hésite, puis vous tend sa hache. « Garde-la. Et écoute : il y a sept soirs, j'ai vu des lanternes dans la clairière. Pas des lanternes d'homme. Elles marchaient seules, en file, et des petits pas les suivaient. Les petits riaient. »`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};
P.ev_orc_aider2 = {
  entree: g => { g.flag('indice_orc'); g.rep('orcs', 1); },
  texte: `Les mâchoires vous mordent le poignet avant de céder. L'orc sourit, d'un seul côté.

— Brave. Stupide, mais brave. J'ai vu des lanternes dans la clairière, il y a sept soirs. Elles marchaient seules, et des petits pas les suivaient. Les petits riaient.

Il ne vous donne pas sa hache. On ne donne pas sa hache à quelqu'un qui n'a pas su la mériter.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};
P.ev_orc_voler = {
  entree: g => { g.rep('orcs', -3); g.give('hache_orque'); g.or(12); g.flag('orc_vole'); },
  texte: `Il ne résiste pas. Il vous regarde faire, les yeux froids, la mâchoire serrée, et ce regard vous accompagnera plus loin que vous ne le voudriez.

— Les orcs n'oublient pas, dit-il quand vous partez. Pas plus que la forêt.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};

/* --- Les ronces --- */
P.ev_ronces = {
  texte: `Le chemin disparaît sous un fouillis de ronces lisses, noires, trop régulières pour être naturelles. Elles frémissent quand vous approchez. À travers elles, vous apercevez un raccourci vers une trouée de lumière.`,
  choix: [
    { t: 'Les trancher d\'un coup d\'épée', montrer: true, si: g => g.has('lame_terne') || g.has('epee_garde') || g.has('coutelas') || g.has('hache_orque'), raison: 'Il vous faut une lame.', vers: 'ev_ronces_trancher' },
    { t: 'Passer au travers en serrant les dents', vers: 'foret', fx: g => g.pv(-5) },
    { t: 'Contourner par le marais', vers: 'foret', fx: g => { g.pv(-2); g.or(g.rnd(0, 6)); } },
  ],
};
P.ev_ronces_trancher = {
  texte: `Les ronces glapissent. Oui : glapissent. De la sève rouge perle sur votre lame, et derrière elles, sous une pierre plate, quelqu'un a laissé une petite bourse. Un ancien péage, sans doute.`,
  choix: [{ t: 'Prendre la bourse (+9 pièces) et continuer', vers: 'foret', fx: g => g.or(9) }],
};

/* --- Aldine, la sorcière --- */
P.ev_sorciere = {
  texte: g => `Une chaumière tordue, un toit de mousse, une marmite qui chante toute seule. Sur le seuil, une femme sans âge, les mains pleines de terre, vous regarde arriver.

— Tiens, le messager d'Orsel. Entre ou passe ton chemin, mais ne reste pas planté devant ma porte : les corbeaux se font des idées.

${g.world.coupable === 'sorciere' ? 'Elle a beaucoup de bols sur la table. Beaucoup trop pour une seule personne.' : 'Elle a l\'air de quelqu\'un qui n\'a pas dormi depuis des semaines.'}`,
  choix: [
    { t: 'Entrer et commercer', vers: 'ev_sorciere_boutique' },
    { t: 'L\'interroger sur les enfants', vers: 'ev_sorciere_parler' },
    { t: 'Passer votre chemin', vers: 'foret' },
  ],
};
P.ev_sorciere_boutique = {
  texte: `Elle étale sur la table de petits flacons, des herbes séchées, des champignons pâles.

— Mon prix est simple : de l'or, ou un souvenir. Je préfère l'or, les souvenirs me donnent des cauchemars.`,
  choix: [
    { t: 'Potion de soin (5 pièces)', montrer: true, si: g => g.argent >= 5, raison: 'Pas assez d\'or.', fx: g => { g.or(-5); g.give('potion'); } },
    { t: 'Fil de sommeil (10 pièces)', montrer: true, si: g => g.argent >= 10, raison: 'Pas assez d\'or.', fx: g => { g.or(-10); g.give('sort_sommeil'); } },
    { t: 'Chapeau-de-lune (3 pièces)', montrer: true, si: g => g.argent >= 3, raison: 'Pas assez d\'or.', fx: g => { g.or(-3); g.give('champignon'); } },
    { t: 'Échanger un souvenir contre un Fil de sommeil', si: g => !g.f('souvenir_donne'), vers: 'ev_sorciere_souvenir' },
    { t: 'Partir', vers: 'foret' },
  ],
};
P.ev_sorciere_souvenir = {
  entree: g => { g.flag('souvenir_donne'); g.give('sort_sommeil'); g.pvMax(-2); },
  texte: `Elle vous prend la main, ferme les yeux, et tire quelque chose de vous, comme un fil sur une étoffe. Vous cherchez le visage de votre premier chien, le prénom de votre mère quand elle riait. C'est parti. Vous ne saurez jamais quoi.

— Merci, dit Aldine doucement. C'était beau.`,
  choix: [{ t: 'Sortir, un peu plus léger et un peu plus fragile', vers: 'foret' }],
};
P.ev_sorciere_parler = {
  entree: g => { g.flag('indice_sorciere'); },
  texte: g => {
    const v = {
      reine: `— Ce n'est pas moi, dit Aldine, et elle ne ment pas : je la sens. Je ne leur ferais pas de mal. Mais je sais qui. Les fées de la clairière ne prennent que ce qu'on leur a donné. Remonte jusqu'au premier nom, messager. Tu verras que le village est endetté depuis longtemps.`,
      sorciere: `Elle soupire, et laisse la marmite chanter un moment.\n\n— Oui, dit-elle. Je les prends. Et je les cache, parce qu'Orsel prépare une dîme, et ces petits étaient désignés. Tu me crois ? Non. Moi non plus, à ta place. Mais il y a des bols sur la table, et six lits dans mon grenier. Va voir. Ou pas.`,
      ancien: `— Demande à Orsel combien d'enfants il a vus naître à Hautgué ces trente dernières années, et combien il en a vus grandir. Compte. Tu es soldat, tu sais compter.`,
    }[g.world.coupable];
    return v;
  },
  choix: [{ t: 'La remercier et partir', vers: 'foret' }],
};

/* --- La fée Pimprenelle --- */
P.ev_fee = {
  texte: `Une lumière danse au bout d'une branche : une fée, de la taille d'une main, vêtue d'une feuille de chêne. Elle vous observe, la tête penchée, comme on observe un jouet inattendu.

— Une promesse, voyageur ? dit-elle de sa voix de clochette. Je ne vends rien, je n'achète rien. Je ne fais que lier. Promets-moi quelque chose, et je te donnerai quelque chose. Les fées ne mentent jamais, tu sais. Nous disons seulement la vérité de travers.`,
  choix: [
    { t: 'Promettre de lui rapporter la première chose que vous trouverez dans la clairière', vers: 'ev_fee_promesse' },
    { t: 'La questionner sur les enfants', vers: 'ev_fee_parler' },
    { t: 'Refuser poliment', vers: 'foret', fx: g => g.rep('fees', 1) },
    { t: 'Attraper la fée dans votre main', vers: 'ev_fee_attraper' },
  ],
};
P.ev_fee_promesse = {
  entree: g => { g.flag('promesse_fee'); g.flag('indice_fee'); g.give('fil_argent'); g.pvMax(4); g.rep('fees', 1); },
  texte: g => `Elle noue un fil d'argent autour de votre petit doigt. Il se resserre, doucement, puis disparaît sous la peau. Vous vous sentez plus fort, et un peu moins libre.

— Ce n'était pas si difficile, n'est-ce pas ? Un conseil gratuit, parce que nous sommes en bons termes : ${g.world.coupable === 'reine' ? 'ne sous-estime pas notre Reine. Elle est plus triste qu\'elle n\'en a l\'air, et plus entêtée que tu ne le crois.' : g.world.coupable === 'sorciere' ? 'tout ce que tu as entendu sur la sorcière est vrai. Et faux. Comme tout.' : 'ce ne sont pas toujours ceux qui prennent qui ont appris à demander.'}`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};
P.ev_fee_parler = {
  entree: g => { g.flag('indice_fee'); },
  texte: g => `La fée rit : un son de verre fêlé.

— Des enfants ? Il y en a de très nombreux dans la forêt, voyageur. ${g.world.coupable === 'reine' ? 'Certains sont très heureux. D\'autres ne savent pas qu\'ils pourraient l\'être moins.' : g.world.coupable === 'sorciere' ? 'Certains dorment bien au chaud, loin de ceux qui voudraient les éteindre.' : 'Certains ont été offerts. Les fées ne refusent pas un présent : c\'est une règle plus ancienne que nous.'}

Elle s'envole dans un éclat de poudre, avant que vous ne puissiez demander à qui.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};
P.ev_fee_attraper = {
  texte: `Votre main se referme. La fée hurle une note qui vous fait saigner du nez, et vous mord jusqu'à l'os. Vous la relâchez ; elle disparaît sans un mot, laissant dans l'air un long frisson.

Quelque part dans la forêt, quelque chose a pris note.`,
  choix: [{ t: 'Continuer, la main douloureuse', vers: 'foret', fx: g => { g.pv(-4); g.rep('fees', -3); } }],
};

/* --- Le feu follet --- */
P.ev_follet = {
  texte: `Une petite flamme bleue flotte entre les arbres, et vous entendez une voix d'enfant qui rit, très loin. Le feu follet recule quand vous avancez, vous attirant hors du sentier vers un marais.

La voix ressemble à celle de la petite {{enfant}}. Ou bien c'est ce que vous voulez entendre.`,
  choix: [
    { t: 'Le suivre dans le marais', vers: 'ev_follet_suivre' },
    { t: 'Ignorer la voix', vers: 'foret', fx: g => g.pv(-1) },
    { t: 'Éteindre la flamme d\'un coup d\'épée', vers: 'ev_follet_combat' },
  ],
};
P.ev_follet_suivre = {
  texte: `L'eau vous monte aux genoux, puis aux cuisses. Le rire s'éloigne sans cesse. Quand vous renoncez enfin, vous êtes trempé et gelé, mais sous une racine noire, brillant doucement, vous trouvez de quoi vous consoler : une vieille bourse de marchand noyé.`,
  choix: [{ t: 'Rebrousser chemin (+11 pièces, −5 vie)', vers: 'foret', fx: g => { g.or(11); g.pv(-5); } }],
};
P.ev_follet_combat = {
  texte: `La flamme siffle, se gonfle, prend la forme d'une petite silhouette furieuse, et vous attaque.`,
  combat: { nom: 'Feu follet', pv: 8, atk: 2, def: 1 },
  victoire: 'ev_follet_fin', fuite: 'foret',
};
P.ev_follet_fin = {
  entree: g => g.or(4),
  texte: `La flamme s'éteint dans un petit soupir presque humain. Il reste, dans la vase, quelques pièces fondues. Ni la voix ni le rire ne reviendront.`,
  choix: [{ t: 'Continuer', vers: 'foret' }],
};

/* ===================== LA CLAIRIÈRE ===================== */

P.clairiere = {
  texte: g => {
    const verite = {
      reine: `Au centre de la clairière, sous un dais de fleurs de pommier hors saison, une femme trop belle est assise sur un trône de racines. La Reine d'Aubépine. À ses pieds, sept enfants jouent avec des cerceaux de lumière. Ils vous voient, vous sourient, et reprennent leur jeu comme si vous n'existiez pas.\n\n— Tu viens pour eux, dit-elle sans colère. Ton village me les a donnés, il y a trois cents ans. Chaque année, une dîme. Je n'ai jamais rien volé.`,
      sorciere: `Au centre de la clairière, un cercle de pierres couvertes de lierre. Aldine y est déjà, essoufflée, un bâton à la main, les yeux rouges. Autour d'elle, six enfants, serrés comme des oisillons. Elle vous a devancé par un chemin que vous ne connaissiez pas.\n\n— Je savais que tu viendrais. Orsel m'a désignée comme coupable depuis longtemps. Il a besoin d'une sorcière pour que personne ne regarde ses mains.`,
      ancien: `Au centre de la clairière, sous un dais de fleurs de pommier hors saison, une femme trop belle est assise sur un trône de racines : la Reine d'Aubépine. Sept enfants dorment à ses pieds, l'air serein et un peu pâle.\n\n— Ton doyen est venu me les offrir, dit-elle. J'ai refusé la première année. Il a insisté la deuxième. La troisième, j'ai fini par accepter. Ce que les hommes offrent, les fées ne peuvent pas ne pas le prendre. Ce n'est pas une excuse. C'est une règle.`,
    }[g.world.coupable];
    return `Les arbres s'écartent. L'herbe est trop verte, l'air sent la pomme et la cire chaude.\n\n${verite}\n\nVous avez rassemblé ${g.indices()} indice${g.indices() > 1 ? 's' : ''} depuis votre départ. Maintenant, il faut décider.`;
  },
  choix: [
    { t: 'Réclamer les enfants par la force', vers: 'clair_combat' },
    { t: 'Négocier, en vous appuyant sur ce que vous avez appris', montrer: true, si: g => g.indices() >= 3 || g.f('promesse_fee'), raison: 'Vous n\'en savez pas assez pour parler d\'égal à égal.', vers: 'clair_negocier' },
    { t: 'Retourner au village avec la vérité', montrer: true, si: g => g.indices() >= 3, raison: 'Il vous manque des preuves.', vers: 'fin_verite' },
    { t: 'Prendre la place des enfants', vers: 'fin_pacte' },
    { t: 'Repartir sans rien faire', vers: 'fin_fuite' },
  ],
};

P.clair_combat = {
  texte: g => `Le sol tremble. D'entre les troncs surgit un chevalier d'épines, fait d'écorce et de ronces, armé d'une lance de bois noir. Il garde les enfants depuis des siècles, et il n'a pas été fait pour négocier.`,
  combat: { nom: 'Chevalier d\'épines', pv: 22, atk: 3, def: 2 },
  victoire: 'fin_force', defaite: 'mort',
};

P.clair_negocier = {
  texte: g => {
    const v = {
      reine: `— Je t'écoute, dit la Reine, et il y a de l'amusement dans sa voix. Voyons si tu es le premier humain à comprendre ce que tu demandes.`,
      sorciere: `Aldine baisse son bâton. — Dis-moi ce que tu proposes. Je veux bien croire qu'un messager sache aussi parler.`,
      ancien: `— Une chose est promise, dit la Reine, mais une promesse peut être déliée si on offre davantage. Que m'offres-tu ?`,
    }[g.world.coupable];
    return v;
  },
  choix: [
    { t: 'Offrir toutes vos pièces (30 minimum)', montrer: true, si: g => g.argent >= 30, raison: 'Il vous faudrait 30 pièces.', vers: 'fin_negocie' },
    { t: 'Dénouer le fil d\'argent de la promesse faite à la fée', montrer: true, si: g => g.has('fil_argent'), raison: 'Vous n\'avez pas de fil de fée.', vers: 'fin_negocie' },
    { t: 'Leur proposer de revenir une fois par saison au village, librement', montrer: true, si: g => g.indices() >= 4, raison: 'Vous ne connaissez pas assez la forêt pour oser cette offre.', vers: 'fin_negocie' },
    { t: 'Renoncer à négocier', vers: 'clairiere' },
  ],
};

/* ===================== FINS ===================== */

P.fin_force = {
  fin: 'Le fracas des épines',
  texte: g => `Le chevalier s'effondre en un tas de brindilles. Les enfants se réveillent, se pressent contre vous, pleurent, rient. Vous les ramenez au village à l'aube.

Mais au premier gel, les puits se couvrent de glace. Au deuxième, les blés ne poussent plus. La forêt s'est tue : elle n'avait pas prévu qu'on lui réclame quelque chose. Hautgué ne pourra pas rester ici l'hiver prochain.

Vous avez sauvé sept vies. On ne vous dira jamais merci pour les autres.`,
};

P.fin_negocie = {
  fin: 'Le prix de la parole',
  texte: g => `Votre offre pèse quelque chose dans l'air. La Reine hésite, ferme les yeux, puis hoche la tête.

— Soit. Les enfants repartent avec toi. En échange, les dîmes cessent, et le village se souviendra de moi autrement que comme d'une ogresse. Je suis fatiguée d'être un monstre pour des gens qui m'ont inventée.

Vous reprenez la route. Les enfants marchent à vos côtés, hésitants, les yeux un peu trop brillants. Ce sera un autre genre de vie, au village : celui où l'on sait ce qu'on doit à la forêt.`,
};

P.fin_pacte = {
  fin: 'Le pacte des lanternes',
  texte: g => `Vous ne savez pas pourquoi vous dites cela. Les mots viennent seuls, comme une promesse qu'on a déjà prononcée dans un autre rêve.

— Prenez-moi à leur place.

Un silence s'étire. Puis un rire doux, ou peut-être un sanglot.

— Voilà, dit la Reine, ce que personne n'avait offert depuis trois cents ans.

Les enfants repartent. Vous restez. Chaque nuit, quand les lanternes se mettent à marcher, vous marchez avec elles. On vous appellera un jour le Gardien. Ce n'est pas le pire des noms.`,
};

P.fin_verite = {
  fin: 'La vérité de Hautgué',
  texte: g => {
    const v = {
      reine: `Vous ramenez au village le registre qui manquait, une page arrachée retrouvée sous le trône de la Reine. Orsel pâlit. La place se tait. On vote, pour la première fois depuis trois siècles : on décide de rompre le pacte, ou de le renouveler en connaissance de cause. Les enfants rentrent. Certains pleurent de joie, d'autres de nostalgie.`,
      sorciere: `Vous ramenez Aldine et les six enfants, et l'on voit d'abord l'effroi, puis la honte sur les visages. Orsel nie, crie, accuse. Brunehaut se lève, la première depuis trente ans, et dit simplement : « Il ment. » La place bascule. Les enfants sont rendus à leurs mères. Aldine reste à la lisière : on n'abat pas si vite une peur qu'on a nourrie pendant des années.`,
      ancien: `Vous ramenez les trois nuits de lanternes, le blé qui ne meurt jamais, le registre, la voix de Brunehaut. Orsel nie, puis s'effondre, puis regarde ses propres mains comme si elles ne lui appartenaient pas. On l'enferme dans sa maison, la clef tourne de l'extérieur. Les enfants rentrent au village avec une blessure que nul ne soignera.`,
    }[g.world.coupable];
    return `${v}\n\nVous aviez demandé ce qu'était la vérité. On ne vous avait pas dit qu'elle se partagerait si mal.`;
  },
};

P.fin_fuite = {
  fin: 'Les arbres se referment',
  texte: g => `Vous reculez. Personne ne vous retient. Les arbres se referment derrière vous, sans un bruit, comme on referme un livre.

Au village, vous direz que vous n'avez rien trouvé. On vous croira, parce que c'est ce que l'on veut entendre. Il y aura un huitième enfant, l'an prochain, puis un neuvième. Et chaque soir, quand le brouillard montera, vous saurez très exactement ce qu'il cache.`,
};

P.mort = {
  fin: 'Les ronces vous gardent',
  echec: true,
  texte: `Vos jambes cèdent. L'herbe est douce, étrangement douce. Quelque part, une clochette tinte.

La forêt de Brumeval vous accueille comme elle accueille tous ceux qui sont venus chercher quelque chose qu'ils n'auraient pas dû trouver. Vous deviendrez un nom dans une chanson, un cercle de champignons, une mise en garde pour les enfants.`,
};

const STORY = {
  ITEMS, P, DONS, nouveauMonde,
  FINS_TOTAL: 5, // fin_force, fin_negocie, fin_pacte, fin_verite, fin_fuite
};
