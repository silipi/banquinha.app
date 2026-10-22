// Fictional stores used on the landing page to show what a storefront looks like.
export type ExampleStore = {
  handle: string;
  name: string;
  tagline: string;
  city: string;
  accent: string;
  products: { name: string; price: number; image: string }[];
};

export const exampleStores: ExampleStore[] = [
  {
    handle: 'pauloplantas',
    name: 'Plantinhas do Paulo',
    tagline:
      'Plantas cuidadas com carinho, prontas pra deixar seu lar mais verde.',
    city: 'Curitiba, PR',
    accent: 'bg-sage',
    products: [
      {
        name: 'Costela-de-Adão',
        price: 45,
        image: '/lojas/pauloplantas/costela-de-adao.webp',
      },
      {
        name: 'Samambaia',
        price: 25,
        image: '/lojas/pauloplantas/samambaia.webp',
      },
      { name: 'Jiboia', price: 28, image: '/lojas/pauloplantas/jiboia.webp' },
      {
        name: 'Lírio da Paz',
        price: 35,
        image: '/lojas/pauloplantas/lirio-da-paz.webp',
      },
      {
        name: 'Espada de São Jorge',
        price: 30,
        image: '/lojas/pauloplantas/espada-sao-jorge.webp',
      },
      {
        name: 'Suculenta Mix',
        price: 15,
        image: '/lojas/pauloplantas/suculenta-mix.webp',
      },
    ],
  },
  {
    handle: 'luluca',
    name: 'Mimos da Luluca',
    tagline: 'Brinquedos e mimos feitos à mão, com amor e segurança.',
    city: 'Belo Horizonte, MG',
    accent: 'bg-lilac',
    products: [
      {
        name: 'Coelhinho de Pano',
        price: 55,
        image: '/lojas/luluca/coelhinho-de-pano.webp',
      },
      {
        name: 'Móbile de Nuvens',
        price: 65,
        image: '/lojas/luluca/mobile-nuvens.webp',
      },
      {
        name: 'Naninha Urso Azul',
        price: 48,
        image: '/lojas/luluca/naninha-urso-azul.webp',
      },
      {
        name: 'Almofada Estrelinha',
        price: 40,
        image: '/lojas/luluca/almofada-estrelinha.webp',
      },
    ],
  },
  {
    handle: 'clarajoias',
    name: 'Clara Joias',
    tagline: 'Semijoias delicadas para usar todo dia.',
    city: 'São Paulo, SP',
    accent: 'bg-butter',
    products: [
      {
        name: 'Colar Aurora',
        price: 219,
        image: '/lojas/clarajoias/colar-aurora.webp',
      },
      {
        name: 'Anel Horizonte',
        price: 189,
        image: '/lojas/clarajoias/anel-horizonte.webp',
      },
      {
        name: 'Brinco Semente',
        price: 149,
        image: '/lojas/clarajoias/brinco-semente.webp',
      },
      {
        name: 'Pulseira Encanto',
        price: 129,
        image: '/lojas/clarajoias/pulseira-encanto.webp',
      },
    ],
  },
];
