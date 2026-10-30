# Lojas de exemplo novas + prompts de imagem

> Histórico (2026-10-28): plano usado para trocar as lojas de exemplo e os prompts que geraram as fotos no Gemini. As fotos finais estão em `apps/web/public/lojas/`; os dados atuais ficam em `apps/api/src/database/seed/example-stores.ts`. Útil para gerar fotos novas no mesmo estilo.

Lineup final (4 lojas):

| Loja                                     | Tipo                        | Cidade            | Tema                         | Card na landing |
| ---------------------------------------- | --------------------------- | ----------------- | ---------------------------- | --------------- |
| **Unhas da Jéssica** (`/unhasdajessica`) | serviço (manicure)          | Florianópolis, SC | `docinho` (rosa, sem ajuste) | `bg-sky`        |
| **Zé Faz Tudo** (`/zefaztudo`)           | serviço (marido de aluguel) | Campinas, SP      | novo `oficina`               | `bg-butter`     |
| **Neide Beleza & Casa** (`/neidebeleza`) | lojinha (revendedora)       | Goiânia, GO       | novo `perfumaria`            | `bg-lilac`      |
| **Cozinha da Cida** (`/cozinhadacida`)   | lojinha (marmitas caseiras) | Recife, PE        | novo `tempero`               | `bg-sage`       |

Paulo, Luluca, Clara e Tech do Rafa saem (seed, landing, `public/lojas/*` e as menções a `techdorafa` em `store-handle.spec.ts`, `CLAUDE.md` e `ROADMAP.md`).

---

## Temas novos (`system-themes.ts`)

| slug         | nome       | descrição                                              | background | surface   | foreground | muted     | mutedFg   | border    | accent    | accentFg  | radius   |
| ------------ | ---------- | ------------------------------------------------------ | ---------- | --------- | ---------- | --------- | --------- | --------- | --------- | --------- | -------- |
| `oficina`    | Oficina    | Amarelo e firme, para serviços, reparos e ferramentas. | `#f5f2ea`  | `#ffffff` | `#1c1a16`  | `#ebe6da` | `#66604f` | `#dcd5c4` | `#f2b705` | `#1c1a16` | `small`  |
| `perfumaria` | Perfumaria | Lilás e elegante, para beleza, cosméticos e revenda.   | `#f7f3fa`  | `#ffffff` | `#231a2b`  | `#ece3f3` | `#6d6079` | `#e0d4ea` | `#7a3e9d` | `#ffffff` | `large`  |
| `tempero`    | Tempero    | Quente e caseiro, para comida, doces e delivery.       | `#fbf4ea`  | `#ffffff` | `#24170f`  | `#f3e6d4` | `#74604c` | `#e9d8c1` | `#c4421a` | `#ffffff` | `medium` |

(Os três antigos continuam existindo como temas da plataforma, só deixam de ser usados nas lojas de exemplo.)

---

## Dados das lojas

### Unhas da Jéssica — `unhasdajessica`

Bio: "Manicure e nail designer há 6 anos 💅 Atendo no meu espacinho no Campeche ou vou até você. Unhas bem feitas, material esterilizado e aquele papo bom."
Área: Florianópolis · atende no endereço da loja e no da cliente.

| slug                        | nome                      | preço             |
| --------------------------- | ------------------------- | ----------------- |
| `manicure-tradicional`      | Manicure tradicional      | R$ 35 fixo        |
| `pe-e-mao`                  | Pé e mão                  | R$ 60 fixo        |
| `alongamento-em-gel`        | Alongamento em gel        | R$ 150 fixo       |
| `manutencao-do-alongamento` | Manutenção do alongamento | a partir de R$ 90 |
| `nail-art`                  | Nail art                  | a partir de R$ 10 |
| `noivas-e-eventos`          | Noivas e eventos          | sob orçamento     |

### Zé Faz Tudo — `zefaztudo`

Bio: "Sou o Zé, marido de aluguel há 15 anos. Instalo, monto, conserto e pinto. Chego no horário, deixo tudo limpo e cobro o combinado."
Área: Campinas e região · atende no endereço do cliente.

| slug                        | nome                                 | preço              |
| --------------------------- | ------------------------------------ | ------------------ |
| `instalacao-de-chuveiro`    | Instalação de chuveiro               | R$ 80 fixo         |
| `montagem-de-moveis`        | Montagem de móveis                   | a partir de R$ 100 |
| `pequenos-reparos`          | Pequenos reparos                     | R$ 70/hora         |
| `pintura-de-parede`         | Pintura de parede                    | R$ 280/dia         |
| `instalacao-de-prateleiras` | Instalação de prateleiras e suportes | R$ 60 fixo         |
| `reforma-de-banheiro`       | Reparos no banheiro                  | sob orçamento      |

### Neide Beleza & Casa — `neidebeleza`

Bio: "Oi, eu sou a Neide! Revendo cosméticos e utilidades pra casa há 8 anos. Faço entrega no bairro, aceito encomenda e sempre tem um mimo no pacote 💜"
Retirada + entrega local.

| slug                   | nome                       | preço     |
| ---------------------- | -------------------------- | --------- |
| `perfume-floral-75ml`  | Perfume Floral 75 ml       | R$ 89,90  |
| `hidratante-corporal`  | Hidratante Corporal 400 ml | R$ 34,90  |
| `kit-batons`           | Kit 3 Batons Matte         | R$ 49,90  |
| `kit-potes-hermeticos` | Kit 5 Potes Herméticos     | R$ 69,90  |
| `garrafa-termica`      | Garrafa Térmica 1 L        | R$ 54,90  |
| `kit-presente`         | Kit Presente Autocuidado   | R$ 119,90 |

### Cozinha da Cida — `cozinhadacida`

Bio: "Comida caseira de verdade, feita por mim na minha cozinha. Marmitas congeladas, bolo de pote e encomendas pro fim de semana. Pedidos até quinta!"
Retirada + entrega.

| slug                     | nome                               | preço |
| ------------------------ | ---------------------------------- | ----- |
| `marmita-frango-legumes` | Marmita Frango com Legumes         | R$ 22 |
| `marmita-carne-de-sol`   | Marmita Carne de Sol com Macaxeira | R$ 26 |
| `kit-semana`             | Kit Semana (5 marmitas)            | R$ 99 |
| `bolo-de-pote`           | Bolo de Pote                       | R$ 12 |
| `bolo-de-rolo`           | Bolo de Rolo (inteiro)             | R$ 55 |
| `cuscuz-recheado`        | Cuscuz Recheado                    | R$ 18 |

---

## Prompts (Gemini)

Dicas:

- Gere em **1:1 (quadrado)**. Se o Gemini não respeitar, comece com "Square image, 1:1."
- Todos os prompts já pedem **sem texto, sem logo, sem marca**. Se aparecer marca ou letras na embalagem, peça "remove all text and logos".
- Mantive a mesma "cara" dentro de cada loja (luz, fundo, enquadramento) pra vitrine ficar coesa. Se uma imagem sair muito diferente, gere de novo na mesma conversa dizendo "same style as the previous image".
- Logos: não precisa de IA. Faço no estilo atual (ícone simples branco sobre a cor da loja): esmalte para a Jéssica, chave inglesa/martelo para o Zé, gota/flor para a Neide, panela para a Cida.

### Unhas da Jéssica (close-ups de mãos e unhas, fundo rosa claro, luz suave)

1. **manicure-tradicional**

> Square 1:1 realistic beauty photo. Close-up of a woman's hand resting on a soft pink towel, short natural nails freshly done with a glossy classic red polish, an open unlabeled bottle of red polish and a cuticle pusher beside it. Soft diffused daylight, clean pastel pink background, warm and delicate mood. No text, no logos, no brand names, no face visible.

2. **pe-e-mao**

> Square 1:1 realistic beauty photo. A woman's hand and bare feet side by side on a fluffy white towel over a light pink surface, fingernails and toenails painted in the same soft nude-pink glossy polish, a small bowl with water and rose petals nearby. Soft diffused daylight, relaxing spa mood. No text, no logos, no brand names, no face visible.

3. **alongamento-em-gel**

> Square 1:1 realistic beauty photo. Close-up of an elegant hand with long almond-shaped gel nail extensions in a milky pink finish with a high shine, fingers gently touching a small glass vase with a pink flower, soft pink background. Soft studio light, polished and feminine. No text, no logos, no brand names, no face visible.

4. **manutencao-do-alongamento**

> Square 1:1 realistic photo. A manicurist's gloved hands filing a client's long gel nail with a nail file at a tidy manicure table with a pink towel, a small UV nail lamp and neatly arranged tools in the background, slightly out of focus. Soft natural light, clean professional home studio. No text, no logos, no brand names, no faces visible.

5. **nail-art**

> Square 1:1 realistic beauty photo. Close-up of a hand with medium-length nails, each nail with delicate hand-painted nail art: tiny flowers, thin gold lines and small dots over a soft pink base, a fine nail art brush resting beside the hand on a pastel pink surface. Soft diffused light, playful and detailed. No text, no logos, no brand names, no face visible.

6. **noivas-e-eventos**

> Square 1:1 realistic beauty photo. A bride's hand with elegant French manicure nails holding a small bouquet of white and blush roses, a delicate wedding ring visible, soft white lace fabric in the background. Soft dreamy natural light, romantic mood. No text, no logos, no brand names, no face visible.

### Zé Faz Tudo (fotos de trabalho, estilo realista de celular, luz natural)

7. **instalacao-de-chuveiro**

> Square 1:1 realistic photo. Close-up of a modern white electric shower head freshly installed on a clean white-tiled bathroom wall in a Brazilian home, a hand in a work glove tightening the connection with an adjustable wrench. Soft natural daylight, shallow depth of field, warm and trustworthy mood. No text, no logos, no brand names, no face visible.

8. **montagem-de-moveis**

> Square 1:1 realistic photo. A half-assembled light wood wardrobe on the floor of a bright apartment bedroom, a cordless drill, an open box of screws and an Allen key in the foreground. A man's forearms in a mustard-yellow t-shirt holding a panel in place. Natural window light, tidy scene. No text, no logos, no brand names, no face visible.

9. **pequenos-reparos**

> Square 1:1 realistic photo, top-down flat lay. A worn canvas tool bag open on a light concrete floor with a hammer, screwdrivers, pliers, a tape measure, a roll of insulating tape and a small level neatly arranged around it. Soft even daylight, warm tones with a touch of mustard yellow. No text, no logos, no brand names.

10. **pintura-de-parede**

> Square 1:1 realistic photo. A paint roller mid-stroke on a living room wall, half the wall freshly painted in soft warm off-white over an older beige, floor covered with protective plastic, a paint tray on a small ladder step. Bright natural daylight, clean and satisfying before/after feel. No text, no logos, no brand names, no face visible.

11. **instalacao-de-prateleiras**

> Square 1:1 realistic photo. Two floating wooden shelves just installed on a white wall, decorated with a small potted plant, a few books and a ceramic mug; a bubble level still resting on the top shelf and a drill on the floor below. Soft natural light, cozy Brazilian apartment. No text, no logos, no brand names.

12. **reforma-de-banheiro**

> Square 1:1 realistic photo. Close-up of hands in work gloves applying fresh white grout between small white bathroom tiles with a rubber float, a bucket and a sponge nearby, a sink faucet partially visible. Natural light, clean and professional mood. No text, no logos, no brand names, no face visible.

### Neide Beleza & Casa (fotos de produto em estúdio caseiro, fundo lilás claro, luz suave)

13. **perfume-floral-75ml**

> Square 1:1 product photo. An elegant unbranded glass perfume bottle with a pale pink liquid and a gold cap on a soft lilac background, a few fresh pink flower petals scattered around it. Soft diffused light, gentle shadow, clean and feminine. Plain bottle with no label, no text, no logos.

14. **hidratante-corporal**

> Square 1:1 product photo. A plain white pump bottle of body lotion with a small swirl of cream on a lilac surface beside it, a sprig of lavender and a folded white towel in the background. Soft diffused light, fresh and clean. Bottle with no label, no text, no logos.

15. **kit-batons**

> Square 1:1 product photo, top-down. Three open matte lipsticks in nude, rose and berry shades lying side by side with their gold caps on a soft lilac background, small smudges of each color swatched next to them. Soft diffused studio light. No text, no logos, no brand names.

16. **kit-potes-hermeticos**

> Square 1:1 product photo. A neat stack of five clear plastic airtight food containers with lilac snap-lock lids in graduated sizes on a light kitchen counter, one open with colorful cut fruit inside. Bright soft light, organized and practical mood, soft lilac background. No text, no logos, no brand names.

17. **garrafa-termica**

> Square 1:1 product photo. A matte lilac stainless steel 1-liter thermal bottle standing on a light wooden surface next to a cup of steaming coffee, soft lilac background. Soft diffused light, cozy morning mood. Plain bottle, no text, no logos, no brand names.

18. **kit-presente**

> Square 1:1 product photo. A gift basket made of a kraft paper box with lilac tissue paper holding a small unlabeled perfume bottle, a lotion tube, a lip balm, a bath sponge and a sprig of dried flowers, tied with a satin lilac ribbon. Soft lilac background, soft diffused light, warm and caring mood. No text, no logos, no brand names, no labels.

### Cozinha da Cida (fotos de comida caseira, luz de janela, superfície de madeira, tons quentes)

19. **marmita-frango-legumes**

> Square 1:1 realistic food photo, 45-degree angle. An open aluminum takeaway container (marmita) with grilled chicken breast slices, white rice, black beans and steamed broccoli and carrots, on a rustic wooden table with a cotton napkin. Warm natural window light, homemade Brazilian food, appetizing. No text, no logos.

20. **marmita-carne-de-sol**

> Square 1:1 realistic food photo, 45-degree angle. An open aluminum takeaway container with shredded carne de sol sautéed with onions, golden fried cassava (macaxeira) chunks, white rice and a little green salad, on a rustic wooden table. Warm natural window light, Northeastern Brazilian home cooking, appetizing. No text, no logos.

21. **kit-semana**

> Square 1:1 realistic food photo, top-down. Five closed aluminum takeaway containers with clear lids neatly arranged on a wooden table, each showing a different homemade Brazilian meal (chicken and rice, beef stew, fish with pirão, pasta, beans and vegetables), a sprig of parsley and a kitchen towel nearby. Warm natural light, organized meal-prep mood. No text, no logos, no labels.

22. **bolo-de-pote**

> Square 1:1 realistic food photo. Two clear plastic dessert cups (bolo de pote) with layers of chocolate cake, brigadeiro cream and chocolate sprinkles, small spoons beside them, on a wooden table with a terracotta-colored cloth. Warm natural light, homemade and indulgent. No text, no logos, no labels.

23. **bolo-de-rolo**

> Square 1:1 realistic food photo. A traditional Pernambuco bolo de rolo, a thin rolled cake with many tight spiral layers of guava filling, with two slices cut showing the spiral, on a white ceramic plate over a wooden table, light dusting of sugar. Warm natural window light, homemade. No text, no logos.

24. **cuscuz-recheado**

> Square 1:1 realistic food photo. A round Brazilian northeastern corn couscous (cuscuz) on a ceramic plate, filled with melted coalho cheese, scrambled egg and sun-dried beef, steam rising, a small bowl of butter and a cup of coffee beside it on a wooden table. Warm morning window light, homemade. No text, no logos.

---

Salvar como `.webp` (ou mandar em PNG/JPG que eu converto) em:

- `banquinha/apps/web/public/lojas/unhasdajessica/<slug>.webp`
- `banquinha/apps/web/public/lojas/zefaztudo/<slug>.webp`
- `banquinha/apps/web/public/lojas/neidebeleza/<slug>.webp`
- `banquinha/apps/web/public/lojas/cozinhadacida/<slug>.webp`
