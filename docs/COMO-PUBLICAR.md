# Cerrô · como publicar

> **Sobre os caminhos deste documento.** Onde estiver escrito
> `assets/js/config.js`, leia `v1/assets/js/config.js` **ou**
> `v2/assets/js/config.js`, conforme a versão que você for usar.
> As duas têm a mesma estrutura interna, e cada uma tem a sua própria cópia
> desses arquivos: mexer numa não muda a outra.

Site pronto para navegar. Abra o `index.html` da raiz com um duplo clique.

---

## O que já funciona

- **Guia "Encontre o seu ritual"** na home: três perguntas (pele, objetivo,
  aroma) e o site recomenda um dos rituais. Pele e objetivo valem 2 pontos,
  aroma vale 1: necessidade decide, gosto desempata. Editável em
  `assets/js/guia.js`.
- **Perguntas frequentes** na home, em sanfona, com as seis dúvidas que mais
  travam uma compra (duração, banheira, pele sensível, ordem de uso, prazo, troca).
- **Barra de compra fixa no celular** nas páginas de ritual: aparece só depois
  que a pessoa passa do seletor, com a opção que ela escolheu.
- **Dados estruturados para o Google** (loja, produtos, preços, FAQ, trilha de
  navegação): permite aparecer na busca com preço e disponibilidade.
- Favicon, página 404, `robots.txt` e `sitemap.xml`.

- Home completa, com slogan, manifesto, os três rituais, botânica, trio e newsletter
- Uma página para cada ritual, com o seletor de compra (avulso ou kit completo)
- Página do Trio de Sabonetes
- Sacola de compras que guarda os itens entre as páginas
- Cadastro e login de cliente, com WhatsApp, e-mail e consentimento LGPD
- Páginas de história, contato e políticas
- Funciona no celular
- Ritual Florescer Eterno aparece como "em breve", com captura de interesse

---

## Antes de colocar no ar: 3 passos

### 1. Preencher seus dados

Abra `assets/js/config.js` e troque tudo que está marcado como `PREENCHER`:

- razão social e CNPJ (obrigatório no rodapé de qualquer loja online)
- e-mail, WhatsApp e Instagram
- cidade

Depois abra `politicas.html` e preencha os trechos em `[colchetes]`.

> As políticas foram escritas com base no Código de Defesa do Consumidor e na LGPD,
> mas **precisam de revisão jurídica**. Elas valem como contrato com o cliente.

### 2. Fotos: já feito, com uma ressalva

As três fotos dos rituais já estão no site, tratadas para web (nenhuma passa de
225 KB). Detalhes de como cada uma é usada em `assets/img/LEIA-ME.txt`.

**A ressalva:** nas fotos atuais o texto dos rótulos está ilegível
("DESPERTAD DA TERRA", "CUREGE NATIVE"). Em plano aberto passa; na página do
ritual a foto aparece grande e o cliente lê. Trocar por foto do produto real é
a melhoria de maior impacto que o site pode receber, basta salvar por cima,
com o mesmo nome de arquivo.

### 3. Escolher como receber o pagamento

Em `assets/js/config.js`, campo `pagamento.modo`:

| Modo | O que acontece | Precisa de |
|---|---|---|
| `'whatsapp'` *(atual)* | O cliente monta a sacola e o botão abre o WhatsApp com o pedido escrito. Você combina o pagamento. | Nada. Funciona hoje. |
| `'mercadopago'` | O cliente paga por Pix, cartão ou boleto sem sair do fluxo. | Conta de vendedor + um backend (abaixo). |

---

## Ativando o Mercado Pago

O Checkout Pro exige um servidor. Motivo: a chave secreta (`ACCESS_TOKEN`) **não pode
ficar no site**: qualquer visitante conseguiria ler o código-fonte e usá-la.

O site já está pronto do lado do cliente: ele envia o pedido para o endereço
configurado em `pagamento.mercadoPago.endpointPreferencia` e redireciona para o
checkout. Falta só o servidor que responde nesse endereço.

O caminho mais simples é publicar o site na **Vercel** (gratuito) e criar um
arquivo `api/criar-preferencia.js`:

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { itens, frete } = req.body;

  const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: itens,
      shipments: { cost: frete, mode: 'not_specified' },
      back_urls: {
        success: 'https://SEUDOMINIO.com.br/obrigado.html',
        failure: 'https://SEUDOMINIO.com.br/carrinho.html',
      },
      auto_return: 'approved',
    }),
  });

  const dados = await resposta.json();
  res.status(200).json({ init_point: dados.init_point });
}
```

`MP_ACCESS_TOKEN` é cadastrado como variável de ambiente na Vercel, nunca no código.
Depois, mude `pagamento.modo` para `'mercadopago'`.

---

## Cadastro de clientes: importante

Hoje o site está em `contas.backend: 'local'`. Isso significa que **os cadastros ficam
salvos no navegador do próprio cliente e não chegam até você**. Serve só para testar
o fluxo.

Para receber os contatos de verdade, que é o objetivo já que você quer disparar
novidades por e-mail e WhatsApp, é preciso um banco de dados. O site já vem com o
**Supabase** implementado (plano gratuito atende bem no começo):

1. Crie uma conta em supabase.com e um projeto novo.
2. Em **Project Settings → API**, copie a `Project URL` e a chave `anon public`.
3. Cole as duas em `assets/js/config.js`, em `contas.supabase`.
4. Mude `contas.backend` para `'supabase'`.

Pronto: cada cadastro vira uma linha em **Authentication → Users**, com nome,
WhatsApp, data de nascimento e se a pessoa autorizou receber novidades.
Dá para exportar em CSV e subir direto numa ferramenta de disparo.

**Sobre a LGPD:** o campo de autorização para receber mensagens já está separado do
aceite da política, desmarcado por padrão, como a lei exige. Só dispare para quem
marcou. E mantenha o descadastro funcionando: é obrigação, não cortesia.

---

## Onde mexer em cada coisa

| Quero mudar… | Arquivo |
|---|---|
| Preço, nome de produto, descrição, ativos | `assets/js/catalogo.js` |
| CNPJ, contato, frete, pagamento, cadastro | `assets/js/config.js` |
| Cores, fontes, espaçamentos, velocidade das animações | `assets/css/estilo.css` (bloco `:root`, no topo) |
| Enquadramento dos closes de produto | `assets/js/loja.js`, constante `ENQUADRAMENTO` |
| Perguntas e respostas do guia | `assets/js/guia.js` |
| Perguntas frequentes | `index.html`, seção "Perguntas frequentes" |

| Textos da home | `index.html` |
| Texto de cada ritual | `ritual-<nome>.html` |
| Políticas | `politicas.html` |

> Ao publicar, troque **SEUDOMINIO** pelo endereço real em `sitemap.xml`,
> `robots.txt` e nos blocos de dados estruturados das páginas. Depois envie o
> sitemap no Google Search Console.

Mudou o preço em `catalogo.js`? Ele muda sozinho na home, na página do ritual
e no carrinho. Não precisa procurar em lugar nenhum.

---

## Publicar

Como é um site de arquivos estáticos, sobe em qualquer lugar. Do mais simples ao mais
completo:

1. **Netlify Drop**: arraste a pasta para netlify.com/drop e está no ar. Grátis.
2. **Vercel**: necessário se for usar Mercado Pago (por causa do backend). Grátis.
3. **Hospedagem tradicional**: jogue os arquivos na pasta `public_html` por FTP.

Domínio próprio (`cerro.com.br`) se registra no registro.br, custa cerca de R$ 40/ano
e é apontado para o serviço escolhido.

---

## O que ainda não existe

Coisas que uma loja completa vai querer, mas que ficaram fora desta primeira versão:

- Cálculo de frete por CEP (hoje é valor fixo)
- Painel administrativo de pedidos
- Histórico de pedidos dentro da conta do cliente
- Cupom de desconto
- Nota fiscal automática
- Páginas individuais por produto (hoje a página do ritual resolve a compra)

Se a loja começar a vender bem, esses itens entram na fase 2.
