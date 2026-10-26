import type { ItemKind, PriceType } from '../../products/pricing.js';
import type { ThemeOverrides } from '../../themes/theme-tokens.js';

// Fictional stores shown on the landing page. Images are served by the web app from /public/lojas.
// Demo orders go to the owner's WhatsApp so they can be tried end to end.
const DEMO_WHATSAPP = '5545999158412';
const DEMO_INSTAGRAM = 'banquinhaapp';

export type ExampleProduct = {
  slug: string;
  name: string;
  /** A product with a fixed price when omitted. */
  kind?: ItemKind;
  priceType?: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
  description: string;
};

export type ExampleStore = {
  handle: string;
  name: string;
  bio: string;
  city: string;
  /** Slug of a platform theme (src/themes/system-themes.ts). */
  themeSlug: string;
  themeOverrides: ThemeOverrides | null;
  whatsapp: string;
  instagram: string;
  serviceArea?: string;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  onlineEnabled?: boolean;
  products: ExampleProduct[];
};

export const exampleStores: ExampleStore[] = [
  {
    handle: 'pauloplantas',
    name: 'Plantinhas do Paulo',
    bio: 'Sou o Paulo, seu plant lover de Curitiba! Minhas plantas são cultivadas e cuidadas com muito carinho, prontas pra deixar seu lar mais verde.',
    city: 'Curitiba, PR',
    themeSlug: 'jardim',
    themeOverrides: { colors: { accent: '#4f7a3a' } },
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
    themeSlug: 'docinho',
    themeOverrides: { colors: { accent: '#7c5cbf' } },
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
    themeSlug: 'classico',
    themeOverrides: { colors: { accent: '#b0892f' } },
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
  {
    handle: 'techdorafa',
    name: 'Tech do Rafa',
    bio: 'Técnico de informática há 12 anos. Formato, limpo, monto e conserto computadores e notebooks, na sua casa, na minha oficina ou por acesso remoto.',
    city: 'Porto Alegre, RS',
    themeSlug: 'classico',
    themeOverrides: { colors: { accent: '#2f5fd0' } },
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    serviceArea: 'Porto Alegre e região metropolitana',
    pickupEnabled: true,
    deliveryEnabled: true,
    onlineEnabled: true,
    products: [
      {
        slug: 'formatacao-de-computador',
        name: 'Formatação de computador',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 12000,
        description:
          'Backup dos seus arquivos, Windows atualizado, drivers e os programas do dia a dia instalados. Computador rápido de novo em até 24 horas.',
      },
      {
        slug: 'suporte-remoto',
        name: 'Suporte remoto',
        kind: 'service',
        priceType: 'hourly',
        priceCents: 6000,
        description:
          'Resolvo problemas de programas, e-mail, impressora e lentidão pela internet, sem você sair de casa. Cobrado por hora de atendimento.',
      },
      {
        slug: 'limpeza-de-notebook',
        name: 'Limpeza interna de notebook',
        kind: 'service',
        priceType: 'from',
        priceCents: 9000,
        description:
          'Limpeza do cooler e troca da pasta térmica para o notebook parar de esquentar e de fazer barulho. O valor final depende do modelo.',
      },
      {
        slug: 'montagem-de-pc-gamer',
        name: 'Montagem de PC gamer',
        kind: 'service',
        priceType: 'quote',
        priceCents: null,
        description:
          'Ajudo a escolher as peças pelo seu orçamento, monto, organizo os cabos e entrego testado. Me conta o que você quer jogar.',
      },
      {
        slug: 'instalacao-de-rede-wi-fi',
        name: 'Instalação de rede Wi-Fi',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 15000,
        description:
          'Configuração do roteador, senha segura e sinal na casa toda, com repetidor se precisar (o equipamento é cobrado à parte).',
      },
      {
        slug: 'pen-drive-64-gb',
        name: 'Pen drive 64 GB',
        priceCents: 4500,
        description:
          'Pen drive USB 3.0 de 64 GB, ótimo para backup. Posso levar junto no atendimento.',
      },
    ],
  },
];
