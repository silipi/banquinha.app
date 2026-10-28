import type { Metadata } from 'next';
import { LegalPage } from '../_components/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como a banquinha.app coleta, usa e protege dados pessoais, de acordo com a LGPD.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      updatedAt="28 de outubro de 2026"
      intro={
        <p>
          Esta política explica quais dados pessoais a banquinha.app trata, para
          quê e quais são os seus direitos, de acordo com a Lei Geral de
          Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>
      }
      sections={[
        {
          title: 'Dados de lojistas',
          body: (
            <p>
              Para criar e manter uma loja, tratamos nome, e-mail, número de
              WhatsApp, dados da loja (nome, endereço da loja, logo, cidade,
              redes sociais) e os produtos cadastrados. Usamos esses dados para
              prestar o serviço, falar com você sobre a sua conta e cumprir
              obrigações legais.
            </p>
          ),
        },
        {
          title: 'Dados de clientes das lojas',
          body: (
            <>
              <p>
                Quando você faz um pedido em uma loja, registramos o seu nome, o
                seu número de WhatsApp, os produtos, a forma de receber
                (retirada ou entrega), o endereço de entrega, se informado, e a
                observação que você escrever. Esses dados:
              </p>
              <ul>
                <li>
                  são enviados ao lojista para que ele atenda o pedido e fale
                  com você sobre ele pelo WhatsApp;
                </li>
                <li>
                  aparecem na mensagem que você mesmo envia pelo WhatsApp. A
                  conversa no WhatsApp segue as regras do próprio WhatsApp.
                </li>
              </ul>
              <p>
                Para esses dados, o lojista decide como atender o pedido e
                responde pelo uso que faz deles. A banquinha.app os guarda e
                processa em nome do lojista.
              </p>
            </>
          ),
        },
        {
          title: 'Dados guardados no seu navegador',
          body: (
            <p>
              A sacola de compras fica salva no seu próprio navegador, para que
              os produtos não se percam se você fechar a página. Ela não é
              enviada para nós até você finalizar o pedido, e você pode apagá-la
              limpando os dados do site.
            </p>
          ),
        },
        {
          title: 'Estatísticas de acesso',
          body: (
            <>
              <p>
                Medimos visitas ao site e às lojas de forma agregada, para saber
                quais páginas são mais vistas e melhorar o serviço. Usamos o
                Vercel Web Analytics, que não usa cookies e não identifica quem
                você é: os dados são contagens de visitas, páginas, país e tipo
                de dispositivo.
              </p>
              <p>
                Nas páginas da banquinha.app (a página inicial, o blog e o
                painel do lojista), usamos também o PostHog para entender como a
                plataforma é usada: páginas visitadas, cliques, erros e
                gravações da navegação na tela, com os campos de texto
                mascarados. Ele guarda um identificador no seu navegador e,
                quando o lojista entra na conta, associa o uso ao nome e ao
                e-mail dele. As lojas não usam o PostHog: quem compra numa loja
                não é acompanhado.
              </p>
            </>
          ),
        },
        {
          title: 'Com quem compartilhamos',
          body: (
            <p>
              Não vendemos dados pessoais. Compartilhamos dados só com
              fornecedores que nos ajudam a operar a plataforma (hospedagem,
              banco de dados, armazenamento de imagens e estatísticas de
              acesso), com o lojista no caso dos pedidos, e com autoridades
              quando a lei exigir.
            </p>
          ),
        },
        {
          title: 'Por quanto tempo guardamos',
          body: (
            <p>
              Guardamos os dados enquanto a loja estiver ativa ou pelo tempo
              necessário para cumprir obrigações legais. Depois disso, eles são
              apagados ou anonimizados.
            </p>
          ),
        },
        {
          title: 'Segurança',
          body: (
            <p>
              Usamos conexões criptografadas e acesso restrito aos dados. Nenhum
              sistema é 100% seguro, mas trabalhamos para proteger as
              informações e avisaremos os afetados se houver um incidente
              relevante.
            </p>
          ),
        },
        {
          title: 'Seus direitos',
          body: (
            <p>
              Você pode pedir para confirmar se tratamos seus dados, acessá-los,
              corrigi-los, apagá-los, levá-los para outro serviço ou revogar um
              consentimento. Se você comprou em uma loja, também pode fazer
              esses pedidos diretamente ao lojista.
            </p>
          ),
        },
        {
          title: 'Mudanças nesta política',
          body: (
            <p>
              Podemos atualizar esta política. A data no topo da página mostra a
              versão em vigor, e mudanças importantes serão avisadas nos nossos
              canais oficiais.
            </p>
          ),
        },
        {
          title: 'Contato',
          body: (
            <p>
              Para dúvidas ou para exercer seus direitos, fale com a
              banquinha.app pelos nossos canais oficiais.
            </p>
          ),
        },
      ]}
    />
  );
}
