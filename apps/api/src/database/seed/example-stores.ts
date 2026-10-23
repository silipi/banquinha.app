// Fictional stores shown on the landing page. Images are served by the web app from /public/lojas.
// Demo orders go to the owner's WhatsApp so they can be tried end to end.
const DEMO_WHATSAPP = '5545999158412';
const DEMO_INSTAGRAM = 'banquinhaapp';

export type ExampleProduct = {
  slug: string;
  name: string;
  priceCents: number;
  description: string;
};

export type ExampleStore = {
  handle: string;
  name: string;
  bio: string;
  city: string;
  accentColor: string;
  whatsapp: string;
  instagram: string;
  products: ExampleProduct[];
};

export const exampleStores: ExampleStore[] = [
  {
    handle: 'pauloplantas',
    name: 'Plantinhas do Paulo',
    bio: 'Sou o Paulo, seu plant lover de Curitiba! Minhas plantas são cultivadas e cuidadas com muito carinho, prontas pra deixar seu lar mais verde.',
    city: 'Curitiba, PR',
    accentColor: '#4f7a3a',
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    products: [
      {
        slug: 'costela-de-adao',
        name: 'Costela-de-Adão',
        priceCents: 4500,
        description:
          'A Costela-de-Adão é a diva da decoração botânica. Folhas amplas e recortadas dão ao seu espaço um ar sofisticado e tropical. Fácil de cuidar e de grande impacto visual, ela transforma salas e varandas em pequenos refúgios de selva urbana.',
      },
      {
        slug: 'samambaia',
        name: 'Samambaia',
        priceCents: 2500,
        description:
          'Nossa Samambaia é pura poesia em verde. Suas delicadas frondes criam um efeito “cortina de vida” em qualquer cantinho, trazendo frescor e aconchego. Ideal para vasos suspensos ou estantes, ela exige cuidados simples e recompensa com uma atmosfera naturalmente relaxante.',
      },
      {
        slug: 'jiboia',
        name: 'Jiboia',
        priceCents: 2800,
        description:
          'Nossa Jiboia é especialista em driblar a monotonia: suas folhas em cascata criam movimentos suaves que empoderam qualquer prateleira ou suporte. Cresce rápido, adora sombra e se integra a ambientes internos, trazendo uma vibração acolhedora e cheia de vida.',
      },
      {
        slug: 'lirio-da-paz',
        name: 'Lírio da Paz',
        priceCents: 3500,
        description:
          'O Lírio da Paz une elegância e tranquilidade. Com suas flores brancas que parecem flutuar, ele ilumina cantos mais escuros e transmite serenidade. Prefere ambientes com luz indireta e um pouquinho de atenção, retribuindo com charme e ar puro.',
      },
      {
        slug: 'espada-sao-jorge',
        name: 'Espada de São Jorge',
        priceCents: 3000,
        description:
          'A Espada de São Jorge é o escudo verde do seu espaço. Com folhas firmes e eretas, ela purifica o ar e adiciona personalidade a ambientes urbanos. Baixa manutenção e alta presença: perfeita para quem busca estilo prático e um toque de proteção natural.',
      },
      {
        slug: 'suculenta-mix',
        name: 'Suculenta Mix',
        priceCents: 1500,
        description:
          'Este Mix de Suculentas é uma pequena coleção de guerreiros resilientes. Cada espécie traz uma forma e um verde únicos, ideal para composições em mini-jardins, terrários ou vasinhos charmosos. Prontas para encantar com mínimo esforço de rega e muita personalidade.',
      },
    ],
  },
  {
    handle: 'luluca',
    name: 'Mimos da Luluca',
    bio: 'Oi! Eu sou a Luluca 💕 Mamãe e artesã, crio brinquedos e mimos com muito amor para deixar o mundo das crianças ainda mais encantado. Tudo feito à mão, com carinho e segurança.',
    city: 'Belo Horizonte, MG',
    accentColor: '#7c5cbf',
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    products: [
      {
        slug: 'coelhinho-de-pano',
        name: 'Coelhinho de Pano',
        priceCents: 5500,
        description:
          'Um coelhinho fofinho feito à mão com tecido de algodão, perfeito para abraçar na hora de dormir. Ideal para crianças pequenas e cheio de personalidade!',
      },
      {
        slug: 'mobile-nuvens',
        name: 'Móbile de Nuvens',
        priceCents: 6500,
        description:
          'Um móbile delicado com nuvens e gotinhas coloridas, ideal para pendurar no berço ou no cantinho de leitura das crianças.',
      },
      {
        slug: 'naninha-urso-azul',
        name: 'Naninha Urso Azul',
        priceCents: 4800,
        description:
          'A clássica naninha em formato de urso azul, feita com tecido antialérgico e pronta para ser o melhor amigo do seu bebê.',
      },
      {
        slug: 'almofada-estrelinha',
        name: 'Almofada Estrelinha',
        priceCents: 4000,
        description:
          'Almofada em forma de estrela, super macia e com cheirinho suave de lavanda. Decora o quarto e acalma nos momentos de descanso.',
      },
      {
        slug: 'livrinhos-tecido',
        name: 'Kit Mini Livrinhos de Tecido',
        priceCents: 5000,
        description:
          'Conjunto com 3 livrinhos de tecido lavável, com ilustrações simples e coloridas para estimular a imaginação desde cedo.',
      },
      {
        slug: 'cestinha-croche',
        name: 'Cestinha de Brinquedos de Crochê',
        priceCents: 7000,
        description:
          'Cestinha recheada com frutinhas e bichinhos feitos em crochê. Estimula o faz-de-conta e a coordenação motora.',
      },
    ],
  },
  {
    handle: 'clarajoias',
    name: 'Clara Joias',
    bio: 'Joias feitas à mão com metais nobres e pedras naturais brasileiras. Design delicado, elegante e atemporal. Produzido no Brasil, com carinho e autenticidade.',
    city: 'São Paulo, SP',
    accentColor: '#b0892f',
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    products: [
      {
        slug: 'colar-aurora',
        name: 'Colar Aurora',
        priceCents: 21900,
        description:
          'Corrente delicada de ouro 18k com pingente de pedra da lua natural. Feminino, suave e cheio de luz.',
      },
      {
        slug: 'anel-horizonte',
        name: 'Anel Horizonte',
        priceCents: 18900,
        description:
          'Anel aberto em prata 950 com acabamento martelado e detalhe em quartzo rosa. Inspirado em formas orgânicas.',
      },
      {
        slug: 'brinco-semente',
        name: 'Brinco Semente',
        priceCents: 14900,
        description:
          'Par de brincos pequenos em formato de gota, banhados a ouro, com pedra de citrino. Minimalismo com energia.',
      },
      {
        slug: 'pulseira-encanto',
        name: 'Pulseira Encanto',
        priceCents: 12900,
        description:
          'Pulseira fina com elos retorcidos em prata polida. Um toque sutil de brilho no pulso.',
      },
      {
        slug: 'brinco-lua-crescente',
        name: 'Brinco Lua Crescente',
        priceCents: 16900,
        description:
          'Argolinhas com pingente de meia-lua em ouro fosco. Elegância discreta para todos os dias.',
      },
      {
        slug: 'anel-duo-cristal',
        name: 'Anel Duo Cristal',
        priceCents: 19900,
        description:
          'Anel duplo com duas pedras de cristal incolor em base de prata texturizada. Versátil e cheio de charme.',
      },
    ],
  },
];
