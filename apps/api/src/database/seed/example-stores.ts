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

/** Former example stores. The seed deletes them unless a merchant owns the handle. */
export const retiredExampleHandles = [
  'pauloplantas',
  'luluca',
  'clarajoias',
  'techdorafa',
];

export const exampleStores: ExampleStore[] = [
  {
    handle: 'cozinhadacida',
    name: 'Cozinha da Cida',
    bio: 'Comida caseira de verdade, feita por mim na minha cozinha. Marmitas congeladas, bolo de pote e encomendas pro fim de semana. Pedidos até quinta!',
    city: 'Recife, PE',
    themeSlug: 'tempero',
    themeOverrides: null,
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    products: [
      {
        slug: 'marmita-frango-legumes',
        name: 'Marmita Frango com Legumes',
        priceCents: 2200,
        description:
          'Peito de frango grelhado, arroz branco, feijão preto, brócolis e cenoura no vapor. Leve, temperada na medida e pronta em 5 minutos no micro-ondas.',
      },
      {
        slug: 'marmita-carne-de-sol',
        name: 'Marmita Carne de Sol com Macaxeira',
        priceCents: 2600,
        description:
          'Carne de sol desfiada na manteiga com cebola, macaxeira frita, arroz e saladinha. O sabor de almoço de domingo em qualquer dia da semana.',
      },
      {
        slug: 'kit-semana',
        name: 'Kit Semana (5 marmitas)',
        priceCents: 9900,
        description:
          'Cinco marmitas diferentes para a semana toda: frango, carne de panela, peixe com pirão, macarrão e feijão com legumes. Congeladas e etiquetadas.',
      },
      {
        slug: 'bolo-de-pote',
        name: 'Bolo de Pote',
        priceCents: 1200,
        description:
          'Camadas de bolo de chocolate molhadinho com creme de brigadeiro e granulado. Aquele docinho depois do almoço.',
      },
      {
        slug: 'bolo-de-rolo',
        name: 'Bolo de Rolo (inteiro)',
        priceCents: 5500,
        description:
          'Bolo de rolo pernambucano com massa fininha e muitas camadas de goiabada. Feito sob encomenda, com dois dias de antecedência.',
      },
      {
        slug: 'cuscuz-recheado',
        name: 'Cuscuz Recheado',
        priceCents: 1800,
        description:
          'Cuscuz de milho quentinho recheado com queijo coalho, ovo mexido e carne de sol. Café da manhã nordestino completo.',
      },
    ],
  },
  {
    handle: 'unhasdajessica',
    name: 'Unhas da Jéssica',
    bio: 'Manicure e nail designer há 6 anos 💅 Atendo no meu espacinho no Campeche ou vou até você. Unhas bem feitas, material esterilizado e aquele papo bom.',
    city: 'Florianópolis, SC',
    themeSlug: 'docinho',
    themeOverrides: { colors: { accent: '#d6336c' } },
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    serviceArea: 'Florianópolis e São José',
    pickupEnabled: true,
    deliveryEnabled: true,
    products: [
      {
        slug: 'manicure-tradicional',
        name: 'Manicure tradicional',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 3500,
        description:
          'Cutilagem, lixamento e esmaltação com a cor que você escolher. Material esterilizado e lixa descartável.',
      },
      {
        slug: 'pe-e-mao',
        name: 'Pé e mão',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 6000,
        description:
          'Manicure e pedicure completas, com hidratação nos pés. Dá pra fazer as duas com a mesma cor ou combinar.',
      },
      {
        slug: 'alongamento-em-gel',
        name: 'Alongamento em gel',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 15000,
        description:
          'Unhas alongadas em gel no formato que você preferir (amendoada, quadrada, bailarina), com acabamento brilhante. Dura de 3 a 4 semanas.',
      },
      {
        slug: 'manutencao-do-alongamento',
        name: 'Manutenção do alongamento',
        kind: 'service',
        priceType: 'from',
        priceCents: 9000,
        description:
          'Preenchimento do crescimento e reparo de unhas quebradas. O valor final depende de quantas unhas precisam de reparo.',
      },
      {
        slug: 'nail-art',
        name: 'Nail art',
        kind: 'service',
        priceType: 'from',
        priceCents: 1000,
        description:
          'Desenhos feitos à mão: florzinhas, linhas, francesinha colorida, pedrarias. Me manda a referência e eu passo o valor.',
      },
      {
        slug: 'noivas-e-eventos',
        name: 'Noivas e eventos',
        kind: 'service',
        priceType: 'quote',
        priceCents: null,
        description:
          'Atendimento para noiva, madrinhas e convidadas no local do evento. Me conta a data e quantas pessoas que eu monto o orçamento.',
      },
    ],
  },
  {
    handle: 'neidebeleza',
    name: 'Neide Beleza & Casa',
    bio: 'Oi, eu sou a Neide! Revendo cosméticos e utilidades pra casa há 8 anos. Faço entrega no bairro, aceito encomenda e sempre tem um mimo no pacote 💜',
    city: 'Goiânia, GO',
    themeSlug: 'perfumaria',
    themeOverrides: null,
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    products: [
      {
        slug: 'perfume-floral-75ml',
        name: 'Perfume Floral 75 ml',
        priceCents: 8990,
        description:
          'Fragrância floral suave, com notas de rosa e flor de laranjeira. Fixa bem e é ótima para o dia a dia.',
      },
      {
        slug: 'hidratante-corporal',
        name: 'Hidratante Corporal 400 ml',
        priceCents: 3490,
        description:
          'Hidratante de lavanda que absorve rápido e não deixa a pele grudando. Embalagem com válvula pump.',
      },
      {
        slug: 'kit-batons',
        name: 'Kit 3 Batons Matte',
        priceCents: 4990,
        description:
          'Três batons matte de longa duração nos tons nude, rosa e vinho. Um pra cada ocasião.',
      },
      {
        slug: 'kit-potes-hermeticos',
        name: 'Kit 5 Potes Herméticos',
        priceCents: 6990,
        description:
          'Cinco potes com tampa de trava, do pequeno ao grande. Vão ao micro-ondas, ao freezer e à lava-louças.',
      },
      {
        slug: 'garrafa-termica',
        name: 'Garrafa Térmica 1 L',
        priceCents: 5490,
        description:
          'Garrafa de inox que mantém o café quente por 12 horas e a água gelada por 24. Acabamento fosco lilás.',
      },
      {
        slug: 'kit-presente',
        name: 'Kit Presente Autocuidado',
        priceCents: 11990,
        description:
          'Caixa presente com perfume, hidratante, protetor labial e esponja de banho, embalada com laço. Pronta pra entregar.',
      },
    ],
  },
  {
    handle: 'zefaztudo',
    name: 'Zé Faz Tudo',
    bio: 'Sou o Zé, marido de aluguel há 15 anos. Instalo, monto, conserto e pinto. Chego no horário, deixo tudo limpo e cobro o combinado.',
    city: 'Campinas, SP',
    themeSlug: 'oficina',
    themeOverrides: null,
    whatsapp: DEMO_WHATSAPP,
    instagram: DEMO_INSTAGRAM,
    serviceArea: 'Campinas e região',
    pickupEnabled: false,
    deliveryEnabled: true,
    products: [
      {
        slug: 'instalacao-de-chuveiro',
        name: 'Instalação de chuveiro',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 8000,
        description:
          'Instalo ou troco o chuveiro elétrico, confiro a fiação e o disjuntor. O chuveiro fica por sua conta.',
      },
      {
        slug: 'montagem-de-moveis',
        name: 'Montagem de móveis',
        kind: 'service',
        priceType: 'from',
        priceCents: 10000,
        description:
          'Monto guarda-roupa, cômoda, rack, cama e escrivaninha. O valor final depende do tamanho do móvel.',
      },
      {
        slug: 'pequenos-reparos',
        name: 'Pequenos reparos',
        kind: 'service',
        priceType: 'hourly',
        priceCents: 7000,
        description:
          'Aquela lista de coisinhas: torneira pingando, porta rangendo, tomada solta, puxador quebrado. Cobro por hora de serviço.',
      },
      {
        slug: 'pintura-de-parede',
        name: 'Pintura de parede',
        kind: 'service',
        priceType: 'daily',
        priceCents: 28000,
        description:
          'Pinto quartos, salas e áreas externas, com proteção do piso e dos móveis. Diária de 8 horas; a tinta é à parte.',
      },
      {
        slug: 'instalacao-de-prateleiras',
        name: 'Instalação de prateleiras e suportes',
        kind: 'service',
        priceType: 'fixed',
        priceCents: 6000,
        description:
          'Instalo prateleiras, suporte de TV, varão de cortina e quadros, tudo no nível. Até 3 peças no mesmo atendimento.',
      },
      {
        slug: 'reforma-de-banheiro',
        name: 'Reparos no banheiro',
        kind: 'service',
        priceType: 'quote',
        priceCents: null,
        description:
          'Troca de rejunte, vaso, pia e azulejos soltos. Me manda fotos pelo WhatsApp que eu passo o orçamento.',
      },
    ],
  },
];
