import { formatItemPrice, type PriceType } from './item-price';

// Fictional stores used on the landing page to show what a storefront looks like.
export type ExampleProduct = {
  name: string;
  /** In reais; null for "quote". */
  price: number | null;
  /** Fixed when omitted. */
  priceType?: PriceType;
  image: string;
};

export type ExampleStore = {
  handle: string;
  name: string;
  tagline: string;
  city: string;
  accent: string;
  products: ExampleProduct[];
};

/** "R$ 45,00", "R$ 60,00/hora", "Sob orçamento"... */
export const examplePrice = (product: ExampleProduct) =>
  formatItemPrice({
    priceType: product.priceType ?? 'fixed',
    priceCents: product.price === null ? null : product.price * 100,
  });

export const exampleStores: ExampleStore[] = [
  {
    handle: 'cozinhadacida',
    name: 'Cozinha da Cida',
    tagline: 'Marmitas caseiras, bolo de pote e encomendas pro fim de semana.',
    city: 'Recife, PE',
    accent: 'bg-sage',
    products: [
      {
        name: 'Marmita Frango com Legumes',
        price: 22,
        image: '/lojas/cozinhadacida/marmita-frango-legumes.webp',
      },
      {
        name: 'Marmita Carne de Sol com Macaxeira',
        price: 26,
        image: '/lojas/cozinhadacida/marmita-carne-de-sol.webp',
      },
      {
        name: 'Bolo de Pote',
        price: 12,
        image: '/lojas/cozinhadacida/bolo-de-pote.webp',
      },
      {
        name: 'Cuscuz Recheado',
        price: 18,
        image: '/lojas/cozinhadacida/cuscuz-recheado.webp',
      },
    ],
  },
  {
    handle: 'unhasdajessica',
    name: 'Unhas da Jéssica',
    tagline: 'Manicure e nail design no meu espacinho ou na sua casa.',
    city: 'Florianópolis, SC',
    accent: 'bg-sky',
    products: [
      {
        name: 'Manicure tradicional',
        price: 35,
        image: '/lojas/unhasdajessica/manicure-tradicional.webp',
      },
      {
        name: 'Alongamento em gel',
        price: 150,
        image: '/lojas/unhasdajessica/alongamento-em-gel.webp',
      },
      {
        name: 'Nail art',
        price: 10,
        priceType: 'from',
        image: '/lojas/unhasdajessica/nail-art.webp',
      },
      {
        name: 'Noivas e eventos',
        price: null,
        priceType: 'quote',
        image: '/lojas/unhasdajessica/noivas-e-eventos.webp',
      },
    ],
  },
  {
    handle: 'neidebeleza',
    name: 'Neide Beleza & Casa',
    tagline: 'Cosméticos e utilidades pra casa, com entrega no bairro.',
    city: 'Goiânia, GO',
    accent: 'bg-lilac',
    products: [
      {
        name: 'Perfume Floral 75 ml',
        price: 89.9,
        image: '/lojas/neidebeleza/perfume-floral-75ml.webp',
      },
      {
        name: 'Kit 3 Batons Matte',
        price: 49.9,
        image: '/lojas/neidebeleza/kit-batons.webp',
      },
      {
        name: 'Kit 5 Potes Herméticos',
        price: 69.9,
        image: '/lojas/neidebeleza/kit-potes-hermeticos.webp',
      },
      {
        name: 'Kit Presente Autocuidado',
        price: 119.9,
        image: '/lojas/neidebeleza/kit-presente.webp',
      },
    ],
  },
  {
    handle: 'zefaztudo',
    name: 'Zé Faz Tudo',
    tagline: 'Marido de aluguel: instalo, monto, conserto e pinto.',
    city: 'Campinas, SP',
    accent: 'bg-butter',
    products: [
      {
        name: 'Instalação de chuveiro',
        price: 80,
        image: '/lojas/zefaztudo/instalacao-de-chuveiro.webp',
      },
      {
        name: 'Montagem de móveis',
        price: 100,
        priceType: 'from',
        image: '/lojas/zefaztudo/montagem-de-moveis.webp',
      },
      {
        name: 'Pequenos reparos',
        price: 70,
        priceType: 'hourly',
        image: '/lojas/zefaztudo/pequenos-reparos.webp',
      },
      {
        name: 'Pintura de parede',
        price: 280,
        priceType: 'daily',
        image: '/lojas/zefaztudo/pintura-de-parede.webp',
      },
    ],
  },
];
