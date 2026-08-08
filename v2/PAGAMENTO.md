# Ligar o pagamento pelo Mercado Pago

Passo a passo para a hospedagem da HostGator. Do começo ao fim leva cerca de
40 minutos, e dá para parar no meio sem quebrar nada: enquanto o modo de
pagamento continuar em `whatsapp`, o site funciona como funciona hoje.

A ordem importa. Fazer o teste antes de ligar a produção é o que evita
descobrir um problema com dinheiro real de cliente no meio.

---

## Antes de começar

Você vai precisar de:

- acesso ao **cPanel da HostGator** (usuário e senha do painel);
- acesso à conta do **Mercado Pago** da loja;
- o **domínio final** do site já apontado e com https funcionando.

---

## 1. Ative o https

No cPanel, procure **SSL/TLS Status**. Marque o domínio e clique em
**Run AutoSSL**. É gratuito e leva alguns minutos.

Isso não é opcional: o Mercado Pago recusa endereços de retorno em http.
E, mais importante, sem https os dados do cliente trafegam abertos.

---

## 2. Suba os arquivos

No **Gerenciador de Arquivos**, dentro de `public_html`, envie:

- a pasta `api/` inteira, com o `.htaccess` que está dentro dela;
- o arquivo `retorno.html`.

Se o Gerenciador de Arquivos esconder arquivos que começam com ponto, ative
**Settings → Show Hidden Files**. O `.htaccess` precisa subir junto.

---

## 3. Crie o arquivo de segredo, FORA da pasta pública

Ainda no Gerenciador de Arquivos, suba um nível. Você vai ver `public_html`
como uma pasta, ao lado de outras. É aí, **fora** dela, que o segredo mora.

Crie o arquivo `cerro-secreto.php` nesse nível e cole dentro o conteúdo de
`api/SEGREDO-EXEMPLO.php`, trocando os valores.

Depois, botão direito no arquivo → **Change Permissions** → deixe **600**.

**Por que fora de `public_html`:** tudo que está dentro dela é servido na
internet. O Access Token é a chave da conta de pagamento, e quem tem ele
cria cobranças no nome da loja. Fora da pasta pública, não existe endereço
que chegue nele.

---

## 4. Pegue a credencial de TESTE

No Mercado Pago: **Seu negócio → Configurações → Gestão e administração →
Credenciais**.

Comece pelas **credenciais de teste**. Copie o **Access Token** (começa com
`TEST-`) e cole no `cerro-secreto.php`.

Cuidado ao copiar: espaço sobrando no começo ou no fim é o erro mais comum,
e a mensagem que o Mercado Pago devolve não ajuda a descobrir isso.

---

## 5. Rode o diagnóstico

Abra no navegador:

```
https://SEUDOMINIO.com.br/api/diagnostico.php
```

A página lista item por item o que está pronto e o que falta, e diz o que
fazer em cada caso. Resolva até ficar tudo verde.

Ela não mostra o token, só os quatro últimos caracteres, o suficiente para
você conferir que colou o certo.

---

## 6. Configure o aviso de pagamento

No Mercado Pago, em **Webhooks** ou **Notificações**, cadastre a URL:

```
https://SEUDOMINIO.com.br/api/webhook.php
```

Marque o evento **Pagamentos**. Copie a **chave secreta** que aparece e cole
no campo `webhook_secret` do `cerro-secreto.php`.

**Para que serve:** é assim que a loja fica sabendo da venda mesmo se o
cliente fechar o navegador logo depois de pagar. Sem isso, uma compra
aprovada pode passar despercebida.

---

## 7. Faça uma compra de teste

Em `assets/js/config.js`, troque:

```js
modo: 'whatsapp',
```

por

```js
modo: 'mercadopago',
```

Suba o arquivo alterado e faça uma compra completa no site. Use os
**cartões de teste** do Mercado Pago (a documentação deles lista os números;
tem um que aprova e um que recusa, para você ver os dois caminhos).

Confira que:

- o valor cobrado bate com o da sacola;
- a página de retorno aparece com a mensagem certa;
- o pedido apareceu em `cerro-pedidos/pedidos.jsonl`, com estado `approved`;
- o e-mail de aviso chegou, se você configurou.

---

## 8. Vire para produção

Só depois que o teste passou inteiro:

1. Troque o Access Token pelo de **produção** (começa com `APP_USR-`).
2. Troque também a chave secreta do webhook pela de produção.
3. Rode o diagnóstico de novo. Ele deve dizer **credencial de PRODUÇÃO**.
4. **Apague `api/diagnostico.php` do servidor.**
5. Faça uma compra real de valor baixo, com seu próprio cartão, e confirme
   que o dinheiro entrou na conta do Mercado Pago.

---

## O que fica onde

| Arquivo | Para que serve |
|---|---|
| `cerro-secreto.php` | Token e chaves. Fora de `public_html`. Nunca no GitHub. |
| `api/catalogo.php` | **Os preços que o servidor cobra.** É esta a autoridade. |
| `api/comum.php` | Frete, parcelas, funções compartilhadas. |
| `api/criar-preferencia.php` | Monta a cobrança e devolve o endereço do checkout. |
| `api/webhook.php` | Recebe o aviso de pagamento e registra o pedido. |
| `api/diagnostico.php` | Confere a configuração. Apagar depois de usar. |
| `retorno.html` | Página que o cliente vê ao voltar do pagamento. |

---

## Mudou um preço?

Mude nos **dois** lugares:

- `assets/js/catalogo.js`, que é o que o cliente vê;
- `api/catalogo.php`, que é o que o servidor cobra.

O `diagnostico.php` compara os dois e avisa se ficarem diferentes. Se você
mudar só o do site, o cliente vê um preço e paga outro.

---

## Por que o preço não vem do navegador

Vale entender, porque é o ponto que separa uma loja que funciona de uma que
vaza dinheiro.

A sacola fica guardada no navegador do visitante. Tudo que fica no navegador
do visitante pode ser alterado por ele: são três cliques no console para
mudar o preço do kit de R$ 120,00 para R$ 0,01.

Se o servidor aceitasse esse valor, o Mercado Pago cobraria um centavo e
estaria certo do ponto de vista dele, porque o valor legítimo é o que o
servidor da loja informou. Não teria como contestar depois.

Por isso o site manda apenas **o que** e **quantos**. Quanto custa sai de
`api/catalogo.php`, que o visitante não alcança.

---

## Sobre a segurança do token

Ele não passa por WhatsApp, não passa por e-mail e não vai para o GitHub.
Você copia do painel do Mercado Pago e cola direto no cPanel.

Se alguém pedir esse token, desconfie. Nem eu preciso dele: o código lê o
arquivo, e o arquivo é você quem cria.
