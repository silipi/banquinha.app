# Roadmap

Backlog do produto organizado em tickets. Cada ticket tem um ID (`P<fase>-<sequência>`), um status, uma descrição e critérios de aceite. Atualize o status quando o trabalho começar ou terminar; tickets novos entram no fim da fase.

**Status:** ✅ Feito · 🚧 Em andamento · ⬜ A fazer · 💤 Parado

**Endereços da plataforma:**

| Endereço                       | O que é                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `banquinha.app`                | Site: landing, blog, páginas legais                                                             |
| `banquinha.app/<nome-da-loja>` | Vitrine de cada loja, igual no plano grátis e no pago                                           |
| `app.banquinha.app`            | Área logada do lojista (SPA): `/login`, `/cadastro`, `/configuracoes`, `/produtos`, `/pedidos`… |
| `api.banquinha.app`            | API                                                                                             |

O nome da loja só aceita letras minúsculas, números e hífens, e não pode ser um caminho da plataforma (`blog`, `termos`, `cadastro`…). A lista fica em `apps/api/src/stores/store-handle.ts` e precisa ser atualizada sempre que o site ganhar uma rota nova na raiz.

**Ideia central:** a vitrine roda no modelo de dados real desde o primeiro dia. As lojas de exemplo (Paulo, Luluca, Clara) são dados de seed no Postgres servidos pela API, então a landing leva para lojas de verdade e o painel do lojista depois escreve nas mesmas tabelas.

## Visão geral

| Fase                                      | Objetivo                                            | Status |
| ----------------------------------------- | --------------------------------------------------- | ------ |
| [P0](#p0--base)                           | Base: monorepo, design system, client tipado da API | ✅     |
| [P1](#p1--vitrine-e-landing)              | Vitrine, pedido pelo WhatsApp e landing pronta      | ✅     |
| [P2](#p2--painel-do-lojista-beta-fechado) | Painel do lojista, beta fechado                     | ⬜     |
| [P3](#p3--lançamento-público)             | Deploy de produção e lançamento público             | 🚧     |
| [P4](#p4--pagamentos)                     | Pagamentos com Mercado Pago                         | ⬜     |
| [P5](#p5--crescimento)                    | Plano pago e recursos de crescimento                | ⬜     |

---

## P0 · Base

### P0-01 · Monorepo e ferramentas ✅

pnpm workspaces + Turborepo com `apps/web` (Next.js 16), `apps/api` (NestJS 12 + Fastify) e `packages/api-client`. ESM em tudo, Prettier, oxlint/ESLint, Vitest.

- [x] `pnpm dev` sobe API e web juntos
- [x] `pnpm check` roda lint, typecheck, testes e Prettier
- [x] O CI roda `pnpm check` e falha se o client da API estiver desatualizado

### P0-02 · Client tipado da API ✅

O contrato da API (controllers + DTOs) gera o `openapi.json`, que gera um client tipado com `@hey-api/openapi-ts`.

- [x] `pnpm generate` refaz o `openapi.json` e `packages/api-client/src/generated`
- [x] O web só chama a API por `@/lib/api`

### P0-03 · Design system e primeira landing ✅

Fundo papel quente, tinta quase preta, acento laranja, pastéis; Bricolage Grotesque + Geist. Landing com hero, público, como funciona, recursos, lojas de exemplo, preços, dúvidas e CTA final.

- [x] Tokens no `globals.css`, componentes base em `src/components/ui`
- [x] Landing funciona bem no celular e no desktop

---

## P1 · Vitrine e landing

### P1-01 · Modelo de dados da vitrine e seed ✅

Tabelas `stores`, `products` e `product_images` com migrations do Drizzle. Seed idempotente com as três lojas de exemplo.

- [x] `pnpm db:migrate` cria as tabelas
- [x] `pnpm db:seed` atualiza as lojas de exemplo e pode rodar várias vezes
- [x] Testes e2e rodam num banco separado `<db>_test`

### P1-02 · Rotas públicas da vitrine ✅

`GET /storefront/:handle` (loja, contatos, produtos ativos) e `GET /storefront/:handle/products/:slug` (produto, imagens, resumo da loja).

- [x] Loja ou produto inexistente responde 404 com mensagem em pt-BR
- [x] O endereço da loja não diferencia maiúsculas de minúsculas
- [x] Produtos inativos não aparecem

### P1-03 · Páginas da vitrine ✅

`/[handle]` e `/[handle]/produto/[slug]`: logo, nome, bio, botões de WhatsApp/Instagram/localização, grade de produtos, página de produto, cor de cada loja, selo "Feito com", telas de não encontrado.

- [x] Dados em cache por loja (`'use cache'`, tag `store:<handle>`)
- [x] Links da loja montados só em `src/lib/storefront-links.ts`
- [x] Funciona no celular e no desktop

### P1-04 · Sacola e pedido pelo WhatsApp ✅

Sacola por loja no localStorage, barra flutuante e botão de sacola no topo, página da sacola com formulário. `POST /storefront/:handle/orders` recalcula os preços, numera o pedido por loja, grava e devolve o link `wa.me` com a mensagem.

- [x] Preços sempre vêm do banco
- [x] Produtos indisponíveis são avisados e removidos da sacola
- [x] Entrega exige endereço; retirada não
- [x] Pedido gravado com cópia dos itens (nome e preço no momento da compra)

### P1-05 · Landing ligada às lojas reais ✅

Os cards das lojas de exemplo e o celular do topo abrem as vitrines de verdade.

- [x] Cada card de exemplo leva para `/<handle>`

### P1-06 · Páginas legais ✅

`/termos` e `/privacidade` escritos para o produto atual, com link no rodapé.

- [x] Páginas no ar e no sitemap
- [ ] Revisão por advogado, com identificação do responsável (CNPJ) e um canal de contato real → acompanhado no [P3-07](#p3-07--revisão-jurídica-)

### P1-07 · SEO, imagens de compartilhamento, sitemap e robots ✅

`metadataBase` e URLs canônicas a partir de `NEXT_PUBLIC_SITE_URL`, Open Graph em tudo, imagens 1200×630 geradas para landing, lojas e produtos, `sitemap.xml` vindo da API, `robots.txt`.

- [x] Toda página pública tem URL canônica e tags de Open Graph
- [x] Imagens de compartilhamento funcionam para lojas e produtos
- [x] O sitemap lista lojas e produtos e não quebra se a API cair

### P1-08 · Blog ✅

Posts em MDX com metadados em `src/lib/blog.ts`, páginas de listagem e de artigo, índice, tempo de leitura, posts relacionados, JSON-LD, RSS e imagem de compartilhamento por post. Seis artigos de lançamento. Últimos posts na landing.

- [x] Post novo = entrada de metadados + arquivo MDX; o resto é automático
- [x] Posts entram no sitemap e no RSS
- [x] A landing mostra os três posts mais recentes

### P1-09 · Endereço curto `banquinha.app/<nome-da-loja>` ✅

As lojas ficam na raiz do site (`banquinha.app/luluca`), no mesmo formato no plano grátis e no pago. Decidimos não usar subdomínio por loja: o formato com barra é o que o público já conhece (Instagram, Linktree), não muda quando a lojista assina ou cancela e soma autoridade ao domínio principal no Google.

- [x] `/luluca`, `/luluca/produto/<slug>` e `/luluca/sacola` funcionam
- [x] O nome da loja só aceita `a-z`, `0-9` e hífens simples (nada que quebre a URL)
- [x] Caminhos da plataforma (`blog`, `termos`, `privacidade`, `cadastro`, `login`, `app`, `api`…) são reservados na API, com teste para cada rota da raiz do site
- [x] Landing, blog, FAQ, preços e imagens de compartilhamento mostram `banquinha.app/sualoja`
- [x] Links de loja montados só em `src/lib/storefront-links.ts`

### P1-10 · Proteção contra pedidos abusivos ✅

Os pedidos são públicos e sem login. Cada cliente pode enviar até 5 pedidos por minuto (`ORDER_RATE_LIMIT`); passou disso, a API responde 429 com "Muitos pedidos em pouco tempo…" e registra a tentativa no log. Como os pedidos chegam à API pelo servidor do site, o site repassa o IP do cliente junto com uma chave interna (`INTERNAL_API_KEY`); sem a chave, a API usa o IP da própria conexão.

- [x] Limite por IP em `POST /storefront/:handle/orders` (`OrderThrottlerGuard`)
- [x] O IP repassado pelo site só é aceito com a chave interna válida
- [x] Tentativas bloqueadas aparecem no log da API
- [x] Teste e2e do limite, do IP repassado e da chave inválida

### P1-11 · Ajustes da landing no celular ✅

Revisão de todas as seções entre 360 e 414px de largura.

- [x] Sem rolagem horizontal
- [x] Áreas de toque com pelo menos 44px (logo, botão do topo, campo do endereço, links do rodapé)
- [x] Menu no celular com as seções e o blog
- [x] Tocar em `banquinha.app/` no campo do hero foca o campo

### P1-12 · Analytics ✅

Vercel Web Analytics em todas as páginas: sem cookies e sem identificar pessoas. Só envia dados quando o site está na Vercel.

- [x] `<Analytics />` no layout raiz
- [x] A política de privacidade menciona as estatísticas de acesso

---

## P2 · Painel do lojista (beta fechado)

### P2-01 · Escolher o nome novo ⬜

Definir a marca final antes de lojistas reais começarem a divulgar links.

- [ ] Nome escolhido e pesquisado no INPI (classes 35, 42 e 9)
- [ ] Domínios e @ das redes registrados
- [ ] Marca trocada no código, nos textos e no blog

### P2-02 · Contas de lojista e login ⬜

Área logada do lojista em `app.banquinha.app`, como um SPA com as rotas `/login`, `/cadastro`, `/configuracoes`, `/produtos`, `/pedidos` etc. Cadastro e login com Google e e-mail (link mágico ou senha). Sessões controladas pela API.

- [ ] A área do lojista roda em `app.banquinha.app` (em dev, `app.localhost:3000` ou uma porta própria)
- [ ] `banquinha.app/cadastro` passa a redirecionar para `app.banquinha.app/cadastro`, levando o nome escolhido na landing

- [ ] O lojista consegue se cadastrar, entrar e sair
- [ ] As rotas da API são protegidas por padrão; rotas públicas são marcadas explicitamente
- [ ] `stores` ganha um dono (migration)

### P2-03 · Criação da loja ⬜

Passo a passo: endereço → nome → WhatsApp → logo e cor. Fica em `app.banquinha.app/cadastro` e aproveita o endereço escolhido na landing.

- [ ] A disponibilidade do endereço consulta o banco
- [ ] A loja fica no ar ao fim do passo a passo
- [ ] Dá para concluir pelo celular em menos de 5 minutos

### P2-04 · Upload de imagens ⬜

Envio de fotos de produto e logos para o Cloudflare R2, redimensionadas e convertidas para webp.

- [ ] Upload direto com limite de tamanho e de tipo
- [ ] Imagens servidas pelo R2 e liberadas no `next/image`
- [ ] Imagens de compartilhamento continuam funcionando com URLs do R2

### P2-05 · Gestão de produtos ⬜

Criar, editar, reordenar, ativar/desativar e apagar produtos com várias fotos.

- [ ] Mudanças aparecem na vitrine na hora (`updateTag` em `store:<handle>`)
- [ ] Slugs gerados a partir do nome, únicos por loja

### P2-06 · Configurações da loja ⬜

Editar nome, bio, cidade, logo, cor, WhatsApp, Instagram, link de localização e quais formas de receber a loja oferece (retirada, entrega).

- [ ] A sacola só mostra as formas de receber que a loja oferece
- [ ] A cor da loja mantém contraste legível nos botões

### P2-07 · Lista de pedidos ⬜

Listar os pedidos recebidos pela vitrine com status (novo, confirmado, concluído, cancelado).

- [ ] Mais recentes primeiro, filtro por status
- [ ] Abrir um pedido mostra itens, totais e dados do cliente

### P2-08 · Limites do plano grátis ⬜

Aplicar na API os limites do plano grátis (número de produtos, fotos por produto).

- [ ] Limites aplicados na API, com mensagens claras em pt-BR
- [ ] O painel mostra o uso em relação ao limite

### P2-09 · Painel instalável (PWA) ⬜

Manifest, ícones e um shell que funciona offline para o lojista instalar o painel no celular.

- [ ] Instalável no Android e no iOS
- [ ] Abre direto no painel

---

## P3 · Lançamento público

### P3-01 · Infraestrutura de produção 🚧

Vercel (web), Google Cloud Run em `southamerica-east1` (API), Neon em `aws-sa-east-1` (Postgres) e R2, com os domínios `banquinha.app`, `app.banquinha.app` e `api.banquinha.app`.

- [ ] Ambientes de produção e de preview com bancos separados
- [ ] Migrations rodam no deploy
- [ ] DNS e TLS para o site, `app.` e `api.`
- [ ] `INTERNAL_API_KEY` configurada no site e na API
- [ ] Limite de pedidos com armazenamento compartilhado (Redis ou similar) se a API rodar em mais de uma instância; hoje o contador fica na memória
- [ ] API configurada para ler o IP real atrás do proxy do provedor (`trustProxy`)

### P3-02 · Cadastro aberto ⬜

Tirar a trava do beta; os botões da landing levam ao cadastro.

- [ ] Qualquer pessoa consegue criar uma loja a partir da landing

### P3-03 · E-mails transacionais ⬜

E-mails de boas-vindas, link de acesso e aviso de pedido novo.

- [ ] E-mails enviados de um domínio verificado
- [ ] O lojista pode ligar e desligar o aviso de pedidos

### P3-04 · Monitoramento de erros e logs ⬜

- [ ] Erros do web e da API registrados com contexto
- [ ] Alertas para picos de erros 5xx

### P3-05 · Backups e recuperação ⬜

- [ ] Backups automáticos do banco, com restauração testada

### P3-06 · Checklist de lançamento ⬜

- [ ] Desempenho no celular conferido (Core Web Vitals)
- [ ] Search Console configurado e sitemap enviado
- [ ] Páginas de 404 e 500 revisadas

### P3-07 · Revisão jurídica ⬜

- [ ] Termos e privacidade revisados por advogado
- [ ] Identificação do responsável (CNPJ) e contato de privacidade publicados

---

## P4 · Pagamentos

### P4-01 · Pix pelo Mercado Pago ⬜

O cliente paga com Pix no checkout; o dinheiro cai na conta Mercado Pago do lojista.

- [ ] O lojista conecta a conta do Mercado Pago
- [ ] O pedido é marcado como pago pelo webhook de pagamento
- [ ] O envio pelo WhatsApp continua disponível como opção

### P4-02 · Pagamento com cartão ⬜

- [ ] Checkout com cartão e parcelamento, quando disponível

### P4-03 · Status do pedido e avisos ⬜

- [ ] O cliente acompanha o status numa página pública do pedido
- [ ] O lojista é avisado quando o pagamento entra

### P4-04 · Controle de estoque ⬜

- [ ] Estoque opcional por produto, descontado nos pedidos pagos
- [ ] Produtos sem estoque aparecem como indisponíveis

---

## P5 · Crescimento

### P5-01 · Plano pago e cobrança ⬜

- [ ] Planos e limites definidos
- [ ] Assinatura com upgrade e downgrade

### P5-02 · Frete ⬜

- [ ] Cotação de frete no checkout (por exemplo, Melhor Envio)

### P5-03 · Produtos digitais ⬜

- [ ] Entrega por e-mail após o pagamento

### P5-04 · Analytics para o lojista ⬜

- [ ] Visitas, produtos mais vistos e conversão por loja

### P5-05 · Domínio próprio ⬜

- [ ] O lojista conecta o próprio domínio, com TLS automático

### P5-06 · Cupons e promoções ⬜

- [ ] Cupons percentuais e de valor fixo, com validade

### P5-07 · Assistente de IA para a loja ⬜

- [ ] Criação guiada da loja e descrições de produto escritas com IA

### P5-08 · Subdomínio da loja 💤

Possível extra do plano pago (`luluca.banquinha.app`), só se lojistas pedirem. Hoje o diferencial pago é o domínio próprio (P5-05).

- [ ] Avaliar demanda antes de construir
