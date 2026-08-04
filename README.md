# Cerrô · Banho do Cerrado

Duas propostas de site para a Cerrô, saboaria artesanal do Cerrado.
Site de arquivos estáticos: HTML, CSS e JavaScript, sem framework e sem
processo de build. Abre em qualquer lugar.

```
.
├── index.html          página de entrada, escolhe entre as duas versões
├── v1/                 Versão 1 · Loja
├── v2/                 Versão 2 · Apresentação
└── docs/
    ├── DUAS-VERSOES.md   comparativo honesto das duas, com os custos de cada
    ├── COMO-PUBLICAR.md  passo a passo para colocar no ar
    └── ESTRUTURA.md      todo o conteúdo de produto consolidado
```

---

## Ver funcionando

### Pelo GitHub Pages (mais simples)

1. Suba este repositório para o GitHub
2. Vá em **Settings → Pages**
3. Em **Source**, escolha `Deploy from a branch`, branch `main`, pasta `/ (root)`
4. Aguarde um minuto e abra o endereço que aparece

Os endereços ficam assim:

| | Endereço |
|---|---|
| Escolha | `https://SEUUSUARIO.github.io/SEUREPO/` |
| Versão 1 | `https://SEUUSUARIO.github.io/SEUREPO/v1/` |
| Versão 2 | `https://SEUUSUARIO.github.io/SEUREPO/v2/` |

### No seu computador, sem subir nada

Dê um duplo clique em `index.html`.

Uma ressalva: aberto assim, direto do arquivo, alguns navegadores bloqueiam o
armazenamento local. A sacola e o cadastro podem não guardar nada. Para testar
esses dois, use o GitHub Pages ou rode um servidor local:

```bash
npx serve .
```

---

## As duas versões

**Versão 1 · Loja.** Vitrine direta: numa tela você já vê a foto, o slogan e o
botão de comprar. Tem o guia de três perguntas que recomenda o ritual, as
perguntas frequentes e a barra de compra fixa no celular.

**Versão 2 · Apresentação.** A home vira uma história em seis atos, cada um em
tela cheia. A rolagem move o produto: os rituais se abrem em leque, os
sabonetes se separam, as três peças sobem na ordem em que se usam no banho.

O miolo das duas é o mesmo. Mesmo catálogo, mesmo carrinho, mesmo cadastro,
mesmas páginas de ritual. **O que muda é só a home.**

Consequência prática: se mudar um preço, mude nas duas. Ou escolha uma e siga
só com ela. O comparativo completo, com os custos de cada uma, está em
[docs/DUAS-VERSOES.md](docs/DUAS-VERSOES.md).

---

## O que ainda não está ligado

Este repositório é para testar o visual e a navegação. Duas coisas não
funcionam de verdade ainda, e as duas são decisões suas, não pendências
técnicas escondidas:

**Pagamento.** O botão de finalizar abre o WhatsApp com o pedido escrito.
Para Pix, cartão e boleto é preciso um servidor, porque a chave secreta do
Mercado Pago não pode ficar no site. O código do servidor está pronto em
[docs/COMO-PUBLICAR.md](docs/COMO-PUBLICAR.md).

**Cadastro de clientes.** Hoje fica salvo no navegador de quem visita e
**não chega até a Cerrô**. Para receber os contatos de verdade é preciso
ligar o Supabase, que já está implementado: são duas chaves para colar em
`assets/js/config.js`.

---

## Antes de virar loja de verdade

- [ ] Preencher razão social, CNPJ, e-mail, WhatsApp e Instagram em `v1/assets/js/config.js` (e no v2)
- [ ] Preencher os trechos em `[colchetes]` em `politicas.html`
- [ ] **Revisão jurídica das políticas.** Elas valem como contrato com o cliente
- [ ] Trocar `SEUDOMINIO` em `sitemap.xml`, `robots.txt` e nos dados estruturados
- [ ] Trocar as fotos por outras com o rótulo legível (ver abaixo)
- [ ] Ligar o pagamento e o cadastro

### Sobre as fotos

As fotos atuais têm o **texto dos rótulos ilegível** ("DESPERTAD DA TERRA",
"CUREGE NATIVE", "SOL NO CVAHLAGO"). De longe ninguém nota, mas nas páginas de
ritual e na abertura elas aparecem grandes e o cliente lê.

Foto do produto real, com o rótulo final impresso, é a melhoria de maior
impacto disponível. Basta salvar por cima, com o mesmo nome. Os nomes e
tamanhos estão em `v1/assets/img/LEIA-ME.txt` e `v2/assets/img/LEIA-ME.txt`.

---

## Onde mexer em cada coisa

| Quero mudar | Arquivo |
|---|---|
| Preço, nome, descrição, ativos | `assets/js/catalogo.js` |
| CNPJ, contato, frete, pagamento, cadastro | `assets/js/config.js` |
| Cores, fontes, espaçamentos | `assets/css/estilo.css`, bloco `:root` no topo |
| Movimento da apresentação (só v2) | `assets/css/apresentacao.css` e `assets/js/cena.js` |
| Ritmo de cada ato (só v2) | `v2/index.html`, atributo `--altura` de cada cena |
| Perguntas do guia | `assets/js/guia.js` |

Mudou o preço em `catalogo.js`? Ele muda sozinho na home, na página do ritual
e no carrinho.

---

## Acessibilidade e navegadores

Funciona nos navegadores atuais: Chrome, Safari, Firefox e Edge, no computador
e no celular. A versão 2 não usa `animation-timeline` de propósito, porque ele
ainda não funciona no Safari, e boa parte das clientes usa iPhone.

Quem tiver **"reduzir movimento"** ligado no sistema recebe as duas versões
paradas, com o conteúdo inteiro. Nada se perde, só não se move.
