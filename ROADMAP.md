# Roadmap

Backlog do produto organizado em tickets. Cada ticket tem um ID (`P<fase>-<sequência>`), um status, uma descrição e critérios de aceite. Atualize o status quando o trabalho começar ou terminar; tickets novos entram no fim da fase.

**Status:** ✅ Feito · 🚧 Em andamento · ⬜ A fazer · 💤 Parado

**Endereços da plataforma:**

| Endereço                       | O que é                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `banquinha.app`                | Site: landing, blog, páginas legais                                                             |
| `banquinha.app/<nome-da-loja>` | Vitrine de cada loja, igual no plano grátis e no pago                                           |
| `minha.banquinha.app`          | Área logada do lojista (SPA): `/login`, `/cadastro`, `/configuracoes`, `/produtos`, `/pedidos`… |

O nome da loja só aceita letras minúsculas, números e hífens, e não pode ser um caminho da plataforma (`blog`, `termos`, `cadastro`…). A lista fica em `apps/api/src/stores/store-handle.ts` e precisa ser atualizada sempre que o site ganhar uma rota nova na raiz.

**Ideia central:** a vitrine roda no modelo de dados real desde o primeiro dia. As lojas de exemplo (hoje Cozinha da Cida, Unhas da Jéssica, Neide Beleza & Casa e Zé Faz Tudo) são dados de seed no Postgres servidos pela API, então a landing leva para lojas de verdade e o painel do lojista depois escreve nas mesmas tabelas.

## Visão geral

| Fase                                      | Objetivo                                            | Status |
| ----------------------------------------- | --------------------------------------------------- | ------ |
| [P0](#p0--base)                           | Base: monorepo, design system, client tipado da API | ✅     |
| [P1](#p1--vitrine-e-landing)              | Vitrine, pedido pelo WhatsApp e landing pronta      | ✅     |
| [P2](#p2--painel-do-lojista-beta-fechado) | Painel do lojista, beta fechado                     | 🚧     |
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

### P2-01 · Escolher o nome novo 🚧

Definir a marca final antes de lojistas reais começarem a divulgar links. Escolhido: **banquinha.app**.

- [x] Nome escolhido
- [x] Marca trocada no código, nos textos e no blog
- [ ] Pesquisa no INPI (classes 35, 42 e 9)
- [x] Domínio `banquinha.app` registrado (Cloudflare, 2026-10-28)
- [ ] @ das redes registrados

### P2-02 · Contas de lojista e login 🚧

Área logada do lojista em `minha.banquinha.app`, com as rotas `/login`, `/cadastro`, `/recuperar-senha`, `/configuracoes`, `/produtos`, `/pedidos` etc. Sessões controladas pela API.

**Cadastro (decidido em 2026-10-23):** nome, e-mail, WhatsApp, senha e confirmação de senha (mínimo 8 caracteres), mais o botão do Google. É o formato que todo mundo conhece, inclusive o público mais velho. O WhatsApp é guardado na conta e reaproveitado como número da loja no P2-03. Login com e-mail e senha, ou Google. "Esqueci minha senha" envia um código de 6 números por e-mail.

- O Google **bloqueia login em navegador interno de app** (Instagram, TikTok: erro `disallowed_useragent`). Nesses navegadores o botão do Google não aparece; e-mail e senha funcionam em qualquer lugar.
- Cookie de sessão `httpOnly`. O site repassa `/api/*` para a API, então o painel chama a API no próprio domínio e o cookie é "de primeira parte": funciona no Safari mesmo antes do domínio próprio.
- Senhas com scrypt (nativo do Node). Depois de 10 senhas erradas em 15 minutos, o e-mail fica bloqueado por um tempo.
- Para "esqueci minha senha" funcionar em produção falta um provedor de e-mail (Resend) com o domínio verificado, que depende de comprar `banquinha.app` (P2-01).

- [x] A área do lojista roda em `minha.banquinha.app` (em dev, `minha.localhost:3000`; sem o domínio, em `/painel`)
- [x] `banquinha.app/cadastro` passa a redirecionar para `minha.banquinha.app/cadastro`, levando o nome escolhido na landing
- [x] Cadastro com nome, e-mail, WhatsApp, senha e confirmação; login e saída com e-mail e senha
- [x] Recuperar senha com código por e-mail (expira em 15 minutos, com limite de tentativas e de reenvio)
- [ ] Entrar com Google testado de ponta a ponta (falta criar o OAuth client no Google Cloud; adiado, o lançamento sai só com e-mail e senha)
- [x] Testado de verdade no navegador interno do Instagram e do TikTok
- [x] Envio de e-mail em produção (Resend + domínio verificado, 2026-10-28)
- [x] As rotas da API são protegidas por padrão; rotas públicas são marcadas explicitamente
- [x] `stores` ganha um dono (migration)

### P2-03 · Criação da loja (onboarding) 🚧

Logo depois de criar a conta (P2-02), a pessoa monta a loja em `/comecar`. A conta guarda a flag `onboardingCompleted` (verdadeira quando ela já tem uma loja): sem onboarding concluído, o painel manda para o `/comecar`; concluído, entra direto no painel.

**Obrigatório:** nome da loja e pelo menos um produto. O tema já vem escolhido (Clássico) e dá para trocar. Todo mundo começa no plano Grátis, e no onboarding a pessoa pode cadastrar quantos produtos o plano permitir (hoje 10, em `PLANS` na API). Assinar um plano pago fica fora do onboarding (P5-01).

**Fluxo (feito em 2026-10-23):**

1. **Sua loja:** nome (sugerido a partir do endereço da landing: `flores-da-maria` → "Flores da Maria"), endereço (verificado no banco ao sair do campo, com sugestões livres se estiver ocupado) e WhatsApp dos pedidos (já vem da conta).
2. **Tema:** três temas grátis (Clássico, Jardim, Docinho), com a prévia mudando na hora. Os temas são dados no banco (tokens de design), não CSS fixo: ver `docs/themes.md`.
3. **Produtos:** nome, preço e descrição opcional; "Adicionar outro produto" até o limite do plano ("2 de 10 produtos no plano Grátis"). As fotos entram depois, no painel (P2-04).
4. **Comemoração:** "Sua loja está no ar!", com o link, copiar, compartilhar no WhatsApp, ver a loja e uma dica de colocar na bio do Instagram.

**Princípios de UX aplicados:**

- **Progresso dado (endowed progress, Nunes & Drèze 2006):** o endereço escolhido na landing aparece no cadastro como etapa já feita, e a barra do onboarding já começa com a "Conta" preenchida.
- **Efeito IKEA (Norton, Mochon & Ariely 2012):** prévia ao vivo da vitrine ao lado de cada passo, mudando conforme a pessoa digita.
- **Pé na porta (Freedman & Fraser 1966):** o primeiro pedido é pequeno (só o endereço, na landing); cada passo seguinte é só um pouco maior.
- **Padrões inteligentes (Johnson & Goldstein 2003):** tema já escolhido, nome e WhatsApp já preenchidos.
- **Menos escolhas (lei de Hick):** três temas, nada de seletor de cor livre no onboarding.
- **Validação na hora certa (Wroblewski 2009):** ao sair do campo ou ao avançar, não a cada tecla.
- **Fim marcante (regra do pico-fim, Kahneman):** a tela final é uma comemoração com algo útil para fazer em seguida (compartilhar), não um painel vazio.

**Detalhes de interação:** botão principal fixo embaixo, ao alcance do polegar; rascunho salvo no aparelho a cada mudança (sair e voltar retoma do mesmo passo); o endereço é verificado de novo ao publicar e, se alguém pegou antes, volta para o passo 1 com sugestões.

**Critérios de aceite:**

- [x] A disponibilidade do endereço consulta o banco, com sugestões quando está ocupado
- [x] Nome da loja e pelo menos um produto são obrigatórios; tema padrão já escolhido
- [x] Mais de um produto no onboarding, até o limite do plano
- [x] A loja fica no ar ao fim do fluxo, com prévia ao vivo durante ele
- [x] Sair no meio e voltar retoma do mesmo passo
- [x] Flag de onboarding: sem loja vai para o onboarding; com loja, direto para o painel
- [x] Testado no navegador interno do Instagram e do TikTok
- [ ] Funil medido por passo (quantos chegam e quantos concluem cada tela)

### P2-04 · Upload de imagens ✅

Envio de fotos de produto e logos para o Cloudflare R2, redimensionadas e convertidas para webp.

**Como funciona (feito em 2026-10-26):** o painel diminui a foto no próprio celular antes de enviar (uma foto de 12 MP vira poucas centenas de KB, rápido no 4G). A API recebe o arquivo (até 10 MB), confere se é imagem de verdade, corrige a rotação das fotos de celular, tira os metadados (localização GPS incluída), redimensiona e grava em webp no R2 com um nome aleatório (cache de um ano). Ao trocar ou remover, o arquivo antigo é apagado. Sem as chaves do R2, em dev, as imagens ficam numa pasta local (`apps/api/.uploads`); em produção sem R2 o envio fica indisponível com uma mensagem clara.

- Logo: quadrado de 512 px (aparece num círculo). Banner: até 2048 px, sem cortar. Produto: até 1600 px.
- Endpoints: `PUT` e `DELETE /stores/:id/images/logo|banner`. As fotos de produto usam a mesma base e entram junto com a gestão de produtos (P2-05).

- [x] Upload direto com limite de tamanho e de tipo
- [x] Imagens servidas pelo R2 e liberadas no `next/image` (`R2_PUBLIC_URL` no site)
- [x] Imagens de compartilhamento continuam funcionando com as URLs novas
- [x] Logo e banner editáveis no checklist do painel; banner aparece no topo da vitrine
- [x] Criar o bucket no R2 com domínio público e configurar as chaves na API e no site (por enquanto no `r2.dev`)
- [x] Fotos de produto (com o P2-05), com limite de fotos por produto no plano

### P2-05 · Gestão de produtos ✅

Criar, editar, reordenar, ativar/desativar e apagar produtos com várias fotos.

**Como ficou (feito em 2026-10-26):** página **Produtos** no painel, com a lista na ordem da vitrine (arrastar pela alça para reordenar, no dedo, no mouse ou pelo teclado), foto de capa, preço e o selo "Escondido". Tocar num produto abre o editor (tela cheia no celular): fotos (até o limite do plano, a primeira é a capa e dá para escolher outra), nome, preço, descrição e "Mostrar na loja". Nada vai para a loja até tocar em **Salvar**; apagar pede confirmação e leva as fotos junto. Os pedidos antigos continuam com o nome e o preço da época.

- O endereço do produto (slug) nasce do nome e **não muda** quando o nome muda, para os links já compartilhados continuarem funcionando.
- Endpoints em `/stores/:storeId/products` (lista, criar, editar, apagar, `PUT order`, fotos em `/:productId/images`).

- [x] Mudanças aparecem na vitrine na hora (`updateTag` em `store:<handle>`)
- [x] Slugs gerados a partir do nome, únicos por loja

### P2-06 · Configurações da loja ✅

Editar nome, bio, cidade, logo, cor, WhatsApp, Instagram, link de localização e quais formas de receber a loja oferece (retirada, entrega).

**Como ficou (feito em 2026-10-26):** página **Configurações** com nome da loja, WhatsApp dos pedidos, Instagram (aceita `@nome` ou o link do perfil), link da localização, cidade e as formas de receber (retirada e entrega; pelo menos uma fica ligada). Salva tudo de uma vez. O endereço da loja aparece, mas não muda. Logo, banner, descrição, tema e **cor dos botões** ficam na vitrine editável do Início, com prévia. A cor vem de 8 sugestões ou de qualquer cor; a API escolhe texto branco ou escuro em cima dela pelo contraste (WCAG) e o painel avisa quando a cor é clara demais para textos.

- [x] A sacola só mostra as formas de receber que a loja oferece (e a API recusa pedido numa forma desligada)
- [x] A cor da loja mantém contraste legível nos botões

### P2-07 · Lista de pedidos ✅

Listar os pedidos recebidos pela vitrine com status (novo, confirmado, concluído, cancelado).

**Como ficou (feito em 2026-10-26):** página **Pedidos** com filtros por status (com a contagem de cada um), 30 por página ("Ver mais pedidos"), e o detalhe com itens, preços da época, total, retirada ou entrega (com link do endereço no mapa) e observação. O botão principal leva o pedido para o próximo passo (confirmar → concluir), com cancelar e reabrir. O menu mostra quantos pedidos novos existem.

- [x] Mais recentes primeiro, filtro por status
- [x] Abrir um pedido mostra itens, totais e dados do cliente

### P2-08 · Limites do plano grátis ✅

Aplicar na API os limites do plano grátis (número de produtos, fotos por produto).

- [x] Limites aplicados na API, com mensagens claras em pt-BR: lojas por conta, produtos por loja (no onboarding e depois) e fotos por produto (3 no Grátis)
- [x] O painel mostra o uso em relação ao limite ("2 de 10 produtos")

### P2-09 · Painel instalável (PWA) ✅

Manifest, ícones e um shell que funciona offline para o lojista instalar o painel no celular.

**Como ficou (feito em 2026-10-26):** manifest em `/painel/manifest.webmanifest` (o início e o escopo mudam conforme o host: `/` no `minha.`, `/painel/` no site), ícones "b." gerados com a fonte da marca (também como ícone adaptável do Android e da tela inicial do iPhone) e um service worker (`public/painel/sw.js`) que guarda os arquivos do app e mostra uma tela "Você está sem internet" em vez do erro do navegador. Na sidebar, "Instalar no celular": no Android abre o pedido de instalação; no iPhone explica Compartilhar → Adicionar à Tela de Início.

- [x] Instalável no Android e no iOS (testado num celular de verdade)
- [x] Abre direto no painel

### P2-10 · Ativação depois do cadastro 🚧

Fazer a loja recém-criada virar uma loja que vende. A pessoa já saiu do onboarding com a loja no ar; agora o painel puxa ela para os próximos passos.

**Layout do painel (feito em 2026-10-23):** sidebar + conteúdo. A sidebar tem o seletor de loja (uma loja por conta hoje; mais lojas podem vir com os planos pagos), o menu, o **mini wizard "Deixe sua loja completa"** e o usuário logado com o botão de sair. No celular, a sidebar vira um menu lateral.

- **Checklist "Deixe sua loja completa"** (calculado na API, em `setup`): por enquanto logo, banner e descrição. Aparece na sidebar e em detalhe na página inicial; some quando tudo estiver feito. Tarefas incompletas ficam na cabeça (efeito Zeigarnik).
- **Vitrine editável "Sua vitrine"** (feito em 2026-10-26): na página inicial, no lugar de um checklist, uma cópia da loja (banner, logo, nome, descrição, botão de WhatsApp e 3 produtos de exemplo) onde a pessoa toca no que quer mudar, mais a escolha de tema e da cor dos botões. As mudanças ficam num rascunho, com prévia na hora, até tocar em **Publicar** (ou Descartar); sair da página com rascunho pede confirmação. O que ainda falta aparece com um "!" discreto. Fica sempre disponível, para a primeira vez e para ajustes depois, e pode ser recolhida (lembrado no aparelho).
- **Momentos de comemoração:** primeira visita na loja, primeiro pedido. Mensagem curta no painel, com algo para fazer em seguida. O do primeiro pedido está feito (2026-10-26): um card "Seu primeiro pedido chegou!" no Início, até a pessoa fechar ou abrir os pedidos. O da primeira visita depende de contar visitas na loja, que ainda não existe.
- **E-mails de retorno** (depende do P3-03): "sua loja está quase pronta" para quem criou a conta e não publicou, e um resumo da primeira semana (visitas e pedidos).

- [x] Checklist com progresso na sidebar e no painel, que reflete o que já foi feito
- [x] Logo, banner, descrição e tema editáveis numa prévia da loja, publicados juntos
- [x] Logo e banner editáveis
- [x] Comemoração do primeiro pedido
- [ ] Comemoração da primeira visita (depende de contar visitas, [P2-16](#p2-16--contador-de-visitas-da-loja-))
- [ ] E-mail de lembrete para quem criou a conta e não publicou

### P2-11 · WhatsApp do cliente e mensagens prontas no pedido ✅

Hoje o pedido guarda só o nome do cliente. Se ele fecha o WhatsApp sem enviar a mensagem, o pedido fica no painel e o lojista não tem como falar com ele. A sacola passa a pedir o WhatsApp do cliente, e o detalhe do pedido ganha botões que abrem a conversa com uma mensagem pronta para cada passo.

**Como ficou (feito em 2026-10-26):** a sacola pede "Seu WhatsApp" logo depois do nome, com máscara e validação ao sair do campo; a API normaliza e grava em `orders.customer_whatsapp`. No detalhe do pedido aparecem o número, o botão "Falar com o cliente" e as mensagens prontas (pedido confirmado, pronto para retirada ou saiu para entrega, obrigado pela compra, pedido cancelado). Os textos ficam na API (`src/orders/customer-messages.ts`), que devolve os links `wa.me` já montados; o lojista revisa no WhatsApp antes de enviar. Ao confirmar, concluir ou cancelar, o painel sugere "Avisar Fulano no WhatsApp?". Pedidos antigos, sem o número, mostram um aviso no lugar.

- [x] WhatsApp do cliente obrigatório na sacola, normalizado com `toWhatsappNumber()` e gravado no pedido (migration)
- [x] Detalhe do pedido com o botão "Falar com o cliente" (`wa.me`)
- [x] Mensagens prontas por status, com o número do pedido e o nome da loja: confirmado, pronto para retirada, saiu para entrega, cancelado
- [x] Mudar o status no painel oferece enviar a mensagem daquele status
- [x] A política de privacidade menciona o telefone do cliente

### P2-12 · Chave Pix manual ⬜

Antes da integração com o Mercado Pago (P4), o lojista cadastra a própria chave Pix nas Configurações. Depois do pedido, a chave aparece para o cliente com o botão de copiar e vai junto na mensagem do WhatsApp. Conferir se o pagamento entrou continua com o lojista.

- [ ] Chave Pix opcional na loja (CPF, CNPJ, e-mail, telefone ou aleatória) e nome de quem recebe, validados na API
- [ ] A tela de pedido enviado mostra a chave, o valor e o botão de copiar
- [ ] A mensagem do WhatsApp inclui a chave e o valor
- [ ] Pix copia e cola com o valor já preenchido (BR Code estático, sem intermediário)
- [ ] Sem chave cadastrada, nada muda

### P2-13 · Itens de serviço e formas de preço ✅

A plataforma também é para quem vende serviço: técnico (formatar computador), faxineira (por dia), professor particular (por hora). Cada item da loja ganha um tipo (produto ou serviço) na própria tabela `products`, porque a mesma loja pode ter os dois (o técnico vende o serviço e a peça). O preço deixa de ser sempre fixo.

Formas de preço: **fixo** (R$ 120), **por hora** (R$ 35/hora), **por dia** (R$ 180/diária), **a partir de** (a partir de R$ 80) e **sob orçamento** (sem preço).

**Como ficou (feito em 2026-10-26):** `products` ganhou `kind` e `price_type`, e `price_cents` só fica vazio no "sob orçamento" (com um `CHECK` no banco). As regras ficam em `src/products/pricing.ts`: por hora e por dia são só para serviços, e o preço é obrigatório nas outras formas. No painel, o editor tem "É um: Produto | Serviço" e "Como cobrar", com o campo de preço mudando de nome ("Preço por hora", "/diária"); a lista mostra o selo "Serviço". Na vitrine, o botão vira "Quero esse serviço" ou "Pedir orçamento", e a sacola mostra "2 h" e "R$ 120,00 + a combinar". O pedido grava `price_to_confirm` e uma cópia do tipo e da forma de preço em cada item.

- [x] Tipo do item (`product` | `service`) e forma de preço no banco (migration); tudo que já existe vira produto com preço fixo
- [x] O editor de produto no painel escolhe o tipo e a forma de preço
- [x] A vitrine mostra o preço conforme a forma ("R$ 35/hora", "a partir de R$ 80", "Sob orçamento")
- [x] Por hora e por dia usam a quantidade da sacola como horas ou diárias ("4 horas")
- [x] "A partir de" e "sob orçamento" entram no pedido como "a combinar", sem somar no total ("R$ 150 + itens a combinar")
- [x] Item sob orçamento troca "Adicionar" por "Pedir orçamento"
- [x] A mensagem do WhatsApp e o detalhe do pedido mostram a unidade e a forma de preço (copiadas para `order_items`)

### P2-14 · Pedido de serviço: onde, quando e textos ✅

Para serviço, a pergunta não é "retirada ou entrega", é "onde e quando". Sem agenda por enquanto ([P5-21](#p5-21--agenda-com-horários-disponíveis-)): o cliente indica uma data e um período preferidos, e o lojista confirma pelo WhatsApp.

**Como ficou (feito em 2026-10-26):** as formas de receber continuam sendo retirada e entrega, com textos de serviço quando a sacola tem serviços ("Vou até a loja", "No meu endereço"), mais **online** (`stores.online_enabled`), que só aparece e só é aceita quando a sacola tem apenas serviços. Nas Configurações: "Retirada ou atendimento no seu endereço", "Entrega ou atendimento no cliente", "Atendimento online" e "Região de atendimento". A sacola com serviço pede "Quando você prefere?" (data a partir de hoje e manhã/tarde/noite); a API confere a data no fuso de Brasília e ignora esses campos em pedidos só de produtos. A mensagem vira "Quero solicitar um serviço…" com "Atendimento no meu endereço: …" e "Data preferida: sexta-feira, 30/10 (tarde)", e as mensagens prontas do P2-11 ganham versões de serviço ("Estou a caminho", "Tudo pronto para o seu atendimento").

- [x] Formas de atendimento para serviços: no endereço do lojista, no endereço do cliente (pede o endereço) e online. A loja escolhe quais oferece, como já faz com retirada e entrega, e a API recusa uma forma desligada
- [x] Sacola com serviço pede data preferida e período (manhã, tarde, noite), opcionais; os dois vão para o pedido e para a mensagem
- [x] Textos acompanham o conteúdo: sacola só com serviços vira "Solicitação", e "Fazer pedido" vira "Solicitar"
- [x] Região de atendimento na loja (texto livre: "Curitiba e região metropolitana"), mostrada na vitrine

### P2-15 · Onboarding e landing para serviços ✅

O onboarding pergunta "O que você oferece? Produtos, serviços ou os dois" e ajusta os padrões: exemplos e textos de ajuda no passo de produtos, forma de preço e formas de atendimento. A resposta só muda os padrões, nada fica travado.

**Como ficou (feito em 2026-10-26):** a pergunta fica no topo do passo de produtos, que muda de título ("Quais serviços você oferece?"), de exemplos e de rótulos ("Serviço 1"). Em "Os dois", cada item tem a escolha produto/serviço. Quem responde "Serviços" começa com retirada desligada e entrega/atendimento no cliente ligada. Loja de exemplo **Tech do Rafa** (`/techdorafa`, Porto Alegre) com serviço fixo, por hora, "a partir de", sob orçamento e um produto, com imagens ilustradas geradas; ela entra na landing ao lado das outras três. A faixa de público, o FAQ ("Funciona para quem presta serviço?") e o post "Como divulgar seus serviços pela internet" falam com prestadores de serviço.

- [x] Pergunta no onboarding, com padrões diferentes para cada resposta
- [x] Loja de exemplo de serviço no seed (por exemplo, um técnico de informática) e na landing
- [x] A landing fala também com prestadores de serviço; um post no blog sobre vender serviço pelo link

### P2-16 · Contador de visitas da loja ⬜

Base para a comemoração da primeira visita (P2-10), o resumo da semana por e-mail e o analytics do lojista (P5-04). Contagem simples por loja e por dia, sem cookie e sem identificar pessoas. Como a vitrine fica em cache, a visita é contada por uma chamada do navegador, não na renderização.

- [ ] Visitas por loja e por dia gravadas pela API; robôs e prefetch não contam
- [ ] O painel mostra as visitas de hoje e dos últimos 7 dias
- [ ] Comemoração da primeira visita no Início
- [ ] A política de privacidade continua correta

### P2-17 · Campos personalizados 🚧

Informações extras em cada item (Ano, Km e Câmbio de um carro; Quartos e m² de um imóvel; Tecido de uma roupa). A **loja** define os campos uma vez (nome, tipo, unidade, ordem, se aparece no card) e cada item só preenche os valores, todos opcionais. Assim ninguém redigita "Km" em 40 carros e os valores ficam consistentes para filtros depois ([P5-22](#p5-22--filtros-e-modelos-de-campos-)).

- Tipos: texto, número com unidade opcional ("45.000 km"), lista de opções e sim/não. Valores em `products.attributes` (jsonb), validados na API pelo tipo do campo.
- Não é estoque, preço nem variação: o cliente não escolhe nada num campo (escolha que vai para a sacola é o [P5-19](#p5-19--variações-de-produto-)).

**Como ficou (feito em 2026-10-26):** botão **Campos** na página Produtos abre a lista de campos da loja (criar, editar, subir/descer, apagar; salva na hora). O editor de produto ganha "Informações extras" com um campo por tipo (número aceita "45.000" e "1,5"). A API formata para a vitrine (`45.000 km`, `2019`, `Sim`) em `src/store-fields/field-values.ts`; endpoints em `/stores/:storeId/fields`.

- [x] Campos criados, editados, reordenados e apagados no painel; apagar um campo apaga os valores dele
- [x] O editor de produto mostra os campos da loja; valor inválido para o tipo é recusado pela API
- [x] A página do item mostra a ficha; o card mostra até 2 campos marcados
- [x] Limite por loja no plano (3 no Grátis); campos acima do limite, depois de um downgrade, ficam ocultos e não são apagados
- [ ] Conferido no navegador, no celular e no desktop

---

## P3 · Lançamento público

### P3-01 · Infraestrutura de produção 🚧

Vercel (web), Google Cloud Run em `southamerica-east1` (API), Neon em `aws-sa-east-1` (Postgres) e R2, com os domínios `banquinha.app` e `minha.banquinha.app` (área do lojista; escolhido em 2026-10-28 no lugar de `app.`). A API fica no endereço do Cloud Run, sem domínio próprio.

- [ ] Ambientes de produção e de staging separados (GitHub Flow: cada PR sobe a API de staging e ganha um preview protegido na Vercel; código pronto, falta a configuração nos painéis, ver `docs/deploy.md`)
- [x] Migrations rodam no deploy
- [x] DNS e TLS para o site e o `minha.` (passo a passo em `docs/deploy.md`, seção Domains). `api.` fica de fora por enquanto: o navegador só fala com a API por `/api/*` no próprio site, e o Cloud Run não mapeia domínio próprio em `southamerica-east1` sem um load balancer pago
- [x] Imagens em `img.banquinha.app` (domínio próprio no R2) em vez do `r2.dev`, com o `UPDATE` das URLs já gravadas; `r2.dev` desligado
- [ ] `INTERNAL_API_KEY` configurada no site e na API
- [ ] Limite de pedidos com armazenamento compartilhado (Redis ou similar) se a API rodar em mais de uma instância; hoje o contador fica na memória
- [x] API configurada para ler o IP real atrás do proxy do provedor (`trustProxy`)

### P3-02 · Cadastro aberto ⬜

Tirar a trava do beta; os botões da landing levam ao cadastro.

- [ ] Qualquer pessoa consegue criar uma loja a partir da landing

### P3-03 · E-mails transacionais 🚧

E-mails de boas-vindas, link de acesso e aviso de pedido novo.

- [x] E-mails enviados de um domínio verificado (Resend em `send.banquinha.app`, DMARC publicado; `oi@banquinha.app` recebe pelo Cloudflare Email Routing)
- [ ] O lojista pode ligar e desligar o aviso de pedidos

### P3-04 · Monitoramento de erros e logs 🚧

**PostHog (2026-10-28)**, uma ferramenta só para analytics de produto e erros: páginas, cliques, gravações de sessão e erros do navegador na landing, no blog e no painel (nunca nas vitrines), mais os erros 5xx do servidor do site e da API. O lojista logado é identificado (id, nome e e-mail). Desligado até a chave estar configurada: ver `docs/deploy.md`.

- [ ] Erros do web e da API registrados com contexto (código pronto; falta a chave do PostHog em produção)
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

### P3-08 · SEO local das lojas ⬜

Quem procura "formatar computador curitiba" ou "doces para festa londrina" no Google deveria poder cair numa vitrine. Hoje as vitrines têm Open Graph, mas não dados estruturados (o componente `JsonLd` só é usado no blog).

- [ ] Título e descrição da vitrine com o que a loja oferece e a cidade
- [ ] JSON-LD na vitrine (`LocalBusiness`, com cidade, região de atendimento e contato) e nos itens (`Product` com `Offer`; `Service` para serviços), com os campos personalizados (P2-17) como `additionalProperty`
- [ ] Validado no Teste de pesquisa aprimorada do Google (Rich Results Test)

### P3-09 · Painel admin da plataforma 🚧

Painel interno do dono em `admin.banquinha.app` (em preview e local, em `/admin`). Cada ambiente tem o próprio admin, com credenciais próprias e lendo só o próprio banco; um selo mostra se é produção ou staging. Um único admin, separado das contas de lojista: usuário, senha (hash scrypt) e código de 6 dígitos do app autenticador (TOTP), tudo no Secret Manager.

- [x] Login com usuário + senha + TOTP; cada código vale uma vez; 5 erros em 15 minutos travam o login por 15 minutos
- [x] Sessão própria (`admin_sessions`), cookie `SameSite=Strict` só em `/api/admin`, até 12h e encerrada após 1h parada
- [x] Toda alteração e todo login (certo ou errado) no log de auditoria (`admin_audit_log`), que sobrevive à loja apagada
- [x] Visão geral: cadastros, lojas e pedidos por semana, funil do cadastro ao 5º pedido, conclusão do onboarding por semana, planos, cidades, tipo de item e de preço, temas, itens e fotos por loja, pedidos por loja, status e entrega
- [x] Lojas e contas com busca, detalhe, itens e pedidos recentes
- [x] Cortesia de plano por conta (plano, prazo opcional e motivo), que vence sozinha; plano Pro criado com limites provisórios
- [x] Suspender e reativar loja: a vitrine sai do ar, pedidos são recusados, some do sitemap e o lojista vê um aviso no painel
- [x] Apagar loja de vez (itens, fotos no R2, campos e pedidos) digitando o endereço; em produção também pede um código novo do autenticador
- [ ] Criar os segredos e ligar `ADMIN_ENABLED` (ver `docs/deploy.md`), apontar `admin.banquinha.app` para o Vercel e definir `NEXT_PUBLIC_ADMIN_URL`

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

### P4-05 · Sinal para confirmar horário ⬜

Para serviços: o cliente paga um sinal pelo Pix para garantir o horário, o que diminui quem marca e não aparece.

- [ ] O lojista define o sinal por serviço (valor fixo ou porcentagem)
- [ ] O pedido só fica confirmado quando o sinal é pago (webhook)
- [ ] A regra de cancelamento e devolução do sinal aparece antes de pagar

---

## P5 · Crescimento

### P5-01 · Plano pago e cobrança ⬜

O plano Pro já existe (`PLANS` na API, limites provisórios) e pode ser dado de cortesia pelo admin (P3-09). `users.plan` fica para o plano pago; a cortesia mora em `users.plan_override*`, e vale o melhor dos dois (`effectivePlan()`).

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

### P5-09 · Cadastro e login por código ⬜

Alternativa à senha: entrar com um código de 6 números enviado por WhatsApp ou por e-mail, sem senha para lembrar. Considerado no P2-02 e deixado para depois; pelo WhatsApp depende da API oficial da Meta (verificação da empresa, modelo de mensagem aprovado, custo por mensagem).

- [ ] Código por WhatsApp ou e-mail como opção no cadastro e no login

### P5-10 · Construtor de temas ⬜

Temas são dados desde o P2-03 (tabela `themes`, tokens de cor e cantos, ajustes por loja), justamente para isso. O lojista de um plano pago cria e edita os próprios temas com uma prévia ao vivo, e aplica na loja. Caminho técnico em `docs/themes.md`.

- [ ] Criar, editar e apagar temas próprios (só planos pagos, com limite por conta)
- [ ] Prévia ao vivo usando a mesma vitrine
- [ ] Contraste mínimo garantido entre texto e fundo, e entre botão e texto do botão
- [ ] Mais tokens conforme a demanda (fontes, estilo dos botões, banner)

### P5-11 · QR code da loja para imprimir ⬜

Pequeno vendedor vende muito no presencial (balcão, feira, cartão de visita, adesivo). O painel gera um cartão com logo, nome, endereço da loja e QR code.

- [ ] Download em PNG e em PDF pronto para imprimir
- [ ] O link do QR leva uma origem (`?origem=qr`) para contar à parte quando houver o contador de visitas (P2-16)

### P5-12 · Item esgotado ⬜

Mais simples que o estoque do P4-04: o item continua na vitrine com o selo "Esgotado", mas não dá para pedir.

- [ ] "Esgotado" no editor de produto e na lista do painel
- [ ] A vitrine mostra o selo e desliga o botão; a API recusa o pedido

### P5-13 · Taxa de entrega fixa e pedido mínimo ⬜

Antes da cotação de frete (P5-02): uma taxa fixa de entrega e, se a loja quiser, um valor mínimo de pedido.

- [ ] Taxa de entrega e pedido mínimo nas Configurações, opcionais
- [ ] A sacola mostra a taxa no total quando o cliente escolhe entrega e avisa quanto falta para o mínimo
- [ ] A API calcula o total com a taxa e recusa pedido abaixo do mínimo

### P5-14 · Preço promocional "de/por" ⬜

Promoção sem precisar de cupom (P5-06): o item ganha um preço antigo opcional, mostrado riscado.

- [ ] Preço "de" opcional no editor, maior que o preço atual (validado na API)
- [ ] A vitrine mostra o preço riscado e a porcentagem de desconto

### P5-15 · Aviso, horário de funcionamento e modo férias ⬜

- [ ] Aviso no topo da vitrine definido pelo lojista ("Entregas só às sextas")
- [ ] Horário de funcionamento por dia da semana, com "Aberto agora" ou "Fechado" na vitrine
- [ ] Modo férias: a vitrine continua no ar, mostra "Voltamos dia X" e não aceita pedidos até a data

### P5-16 · Compartilhar item ⬜

- [ ] Botão de compartilhar na página do item da vitrine (Web Share API; no desktop, copiar link e WhatsApp)
- [ ] O mesmo botão em cada item da lista do painel

### P5-17 · Duplicar item ⬜

- [ ] "Duplicar" no editor de produto cria uma cópia (com fotos) escondida da loja, respeitando o limite do plano

### P5-18 · Depoimentos e portfólio ⬜

Confiança pesa ainda mais para serviço (um desconhecido entrando na casa do cliente).

- [ ] Depoimentos cadastrados pelo lojista (nome, texto, foto opcional), mostrados na vitrine
- [ ] "Desde quando atende" na loja ("Atendendo desde 2018")
- [ ] Galeria de trabalhos feitos (antes e depois) na loja
- [ ] Depois: avaliação de verdade pedida ao cliente quando o pedido é concluído (depende do P2-11)

### P5-19 · Variações de produto ⬜

Tamanho, cor e sabor, essenciais para roupa e comida.

- [ ] Opções por produto (até 2 tipos, por exemplo tamanho e cor), com preço próprio opcional por variação
- [ ] A vitrine pede a escolha antes de pôr na sacola; o pedido guarda a variação escolhida

### P5-20 · Categorias na vitrine ⬜

Faz sentido quando a loja passa de uns 15 itens, ou seja, junto com o plano pago.

- [ ] Categorias criadas e ordenadas no painel; cada item numa categoria
- [ ] A vitrine agrupa os itens por categoria, com atalhos no topo

### P5-21 · Agenda com horários disponíveis ⬜

Para serviços: o lojista define os horários livres e o cliente escolhe um na hora do pedido, no lugar da data preferida do P2-14. É grande e concorre com ferramentas de agendamento que já existem, então só se os lojistas de serviço pedirem.

- [ ] Avaliar demanda antes de construir
- [ ] Disponibilidade por dia da semana, duração por serviço e bloqueio de horários já ocupados

### P5-22 · Filtros e modelos de campos ⬜

Continuação dos campos personalizados (P2-17).

- [ ] Filtros na vitrine pelos campos de número (faixa) e de lista de opções
- [ ] Modelos prontos ao criar os campos: Veículo (Ano, Km, Câmbio, Combustível), Imóvel (Quartos, m², Vagas), Roupa (Tecido, Medidas)
