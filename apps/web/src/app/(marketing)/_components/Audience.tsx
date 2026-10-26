const audience = [
  'Pequenos vendedores',
  'Influenciadores',
  'Artesãs e artesãos',
  'Confeitarias caseiras',
  'Técnicos e consertos',
  'Brechós',
  'Diaristas',
  'Criadores de conteúdo',
  'Professores particulares',
  'Lojas de bairro',
  'Prestadores de serviço',
  'Pequenas empresas',
];

export function Audience() {
  return (
    <section aria-label="Para quem é" className="border-y bg-surface py-5">
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="flex w-max animate-marquee gap-10 pr-10">
          {[...audience, ...audience].map((item, index) => (
            <li
              key={index}
              aria-hidden={index >= audience.length}
              className="flex items-center gap-10 font-display text-xl font-semibold whitespace-nowrap text-muted-foreground"
            >
              {item}
              <span className="size-1.5 rounded-full bg-brand" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
