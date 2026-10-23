import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '../_components/LegalPage';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'As regras para usar a banquinha.app, para lojistas e clientes.',
  alternates: { canonical: '/termos' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      updatedAt="22 de outubro de 2026"
      intro={
        <p>
          A banquinha.app é uma plataforma para criar uma loja online simples e
          receber pedidos pelo WhatsApp. Estes termos valem para quem cria uma
          loja (<strong>lojista</strong>) e para quem compra nelas (
          <strong>cliente</strong>). Ao usar a plataforma, você concorda com
          eles.
        </p>
      }
      sections={[
        {
          title: 'O que a banquinha.app faz',
          body: (
            <p>
              Oferecemos a vitrine, a sacola e o envio do pedido para o WhatsApp
              do lojista. A venda é feita diretamente entre lojista e cliente: a
              banquinha.app não é parte da compra, não recebe pagamentos em nome
              do lojista e não faz a entrega dos produtos.
            </p>
          ),
        },
        {
          title: 'Conta do lojista',
          body: (
            <p>
              Para criar uma loja, você precisa informar dados verdadeiros e
              mantê-los atualizados. Você é responsável pelo acesso à sua conta
              e por tudo que acontece nela.
            </p>
          ),
        },
        {
          title: 'Responsabilidades do lojista',
          body: (
            <>
              <p>Ao vender pela banquinha.app, o lojista se compromete a:</p>
              <ul>
                <li>
                  publicar só produtos que pode vender legalmente, com fotos,
                  descrições e preços corretos;
                </li>
                <li>
                  combinar pagamento, entrega, trocas e devoluções diretamente
                  com o cliente, respeitando o Código de Defesa do Consumidor;
                </li>
                <li>
                  usar os dados dos clientes só para atender os pedidos, como
                  explicado na{' '}
                  <Link href="/privacidade" className="underline">
                    Política de Privacidade
                  </Link>
                  .
                </li>
              </ul>
            </>
          ),
        },
        {
          title: 'Uso proibido',
          body: (
            <p>
              É proibido usar a plataforma para vender produtos ilegais,
              falsificados ou que exijam autorização que o lojista não tem, para
              enganar clientes, enviar pedidos falsos ou tentar prejudicar o
              funcionamento do serviço.
            </p>
          ),
        },
        {
          title: 'Conteúdo da loja',
          body: (
            <p>
              O lojista continua dono das fotos, textos e marcas que publica, e
              nos autoriza a exibi-los na loja e na divulgação da plataforma
              enquanto a loja estiver ativa. O lojista garante que tem o direito
              de usar esse conteúdo.
            </p>
          ),
        },
        {
          title: 'Planos e preços',
          body: (
            <p>
              A banquinha.app tem um plano grátis com limites e poderá oferecer
              planos pagos. Antes de qualquer cobrança, os valores e condições
              serão informados com clareza, e nada será cobrado sem a sua
              confirmação.
            </p>
          ),
        },
        {
          title: 'Suspensão e encerramento',
          body: (
            <p>
              Podemos suspender ou encerrar lojas que descumpram estes termos ou
              a lei. O lojista pode encerrar a própria loja quando quiser.
            </p>
          ),
        },
        {
          title: 'Limitação de responsabilidade',
          body: (
            <p>
              Trabalhamos para manter a plataforma no ar e funcionando bem, mas
              ela pode ficar indisponível por manutenção ou falhas. A
              banquinha.app não responde pelos produtos vendidos nem pelos
              acordos entre lojista e cliente.
            </p>
          ),
        },
        {
          title: 'Mudanças nestes termos',
          body: (
            <p>
              Podemos atualizar estes termos. Quando a mudança for importante,
              avisaremos os lojistas antes de ela valer. A data no topo da
              página mostra a versão em vigor.
            </p>
          ),
        },
        {
          title: 'Lei aplicável',
          body: (
            <p>
              Estes termos seguem as leis da República Federativa do Brasil.
            </p>
          ),
        },
      ]}
    />
  );
}
