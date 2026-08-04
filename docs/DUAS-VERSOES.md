# Cerrô · duas versões do site

Duas pastas, nenhuma sobrescreve a outra. A versão 2 é um **clone da versão 1**
com a home refeita como apresentação de produto.

| | Pasta | Para ver |
|---|---|---|
| **Versão 1 · Loja** | `cerro-site` | `http://localhost:4321` |
| **Versão 2 · Apresentação** | `cerro-site-v2` | `http://localhost:4322` |

Se os endereços não abrirem, dê um duplo clique no `index.html` da pasta.

---

## O que as duas têm em comum

Como a 2 nasceu da 1, o miolo é literalmente o mesmo:

- Mesmo catálogo (`assets/js/catalogo.js`): preços, nomes, ativos, textos
- Mesma configuração (`assets/js/config.js`): CNPJ, frete, pagamento, cadastro
- Mesmo carrinho, mesmo cadastro de cliente, mesma validação de LGPD
- Mesmas fotos, mesma paleta, mesmas fontes
- Mesmas páginas de ritual, trio, sacola, conta, história, contato e políticas
- Mesmo guia "Encontre o seu ritual" e mesmo FAQ

**O que muda é só a home.** E, com ela, a primeira impressão.

> Consequência prática: mudou o preço numa versão, mude na outra. Ou escolha
> uma e siga só com ela. As pendências (CNPJ, Supabase para os cadastros,
> backend do Mercado Pago) valem igual para as duas.

---

## Versão 1 · Loja

A home é uma vitrine. Em uma tela você já vê a foto, o slogan e o botão de
comprar. Depois vêm os três rituais, o guia, a botânica, o trio, o FAQ.

**Ganha quando** a pessoa já sabe o que quer, ou chegou por anúncio e precisa
comprar rápido. É a mais direta e a mais leve.

---

## Versão 2 · Apresentação

A home vira uma história em seis atos. Cada ato ocupa a tela inteira e prende
enquanto você rola: a rolagem não empurra a página, **move o produto**.

**Ato 1 · Abertura.** A foto do conjunto ocupa tudo. Conforme você desce, ela
recua, escurece e desfoca, entregando a cena para a marca, que se aproxima.

**Ato 2 · A separação.** Os três rituais chegam empilhados como um baralho e
se abrem em leque, cada um para o seu lado. Só depois de abertos os nomes
aparecem embaixo. É a resposta ao "quantos são" antes de "qual é o meu".

**Ato 3 · O sabonete gira.** O disco vira no próprio eixo. Como é redondo e
visto de frente, o giro o achata numa elipse e abre de novo, lendo como
rotação real. A cada meia volta, a peça que aparece é de outro ritual: o
mesmo formato em três cores. Embaixo, os números: 80 g, 3 argilas, R$ 28.

**Ato 4 · As três peças.** Sais, sabonete e geleia sobem uma depois da outra,
na ordem em que se usam no banho. Começam apagadas e entram em foco.

**Ato 5 · Os ativos.** Sem foto. Doze nomes grandes que acendem em ondas.
Aqui o assunto é a fórmula.

**Ato 6 · Escolha.** A apresentação vira loja: três painéis grandes com nome,
subtítulo, essências e preço.

Depois disso a página continua igual à versão 1: guia, FAQ, newsletter, rodapé.

**Ganha quando** a marca precisa ser desejada antes de ser comprada. Serve para
quem chegou pelo Instagram sem conhecer a Cerrô, e para presente.

### Custos honestos desta versão

- **A home fica muito mais longa.** São cerca de 16 telas de rolagem até o
  primeiro botão de compra. Quem já sabe o que quer vai achar demorado. Por
  isso existe o menu no topo: "Os Rituais" pula direto para a escolha.
- Consome mais processamento que a versão 1, embora bem menos que animações
  em vídeo. Em aparelho antigo pode ficar menos fluido.
- Quem configurou "reduzir movimento" no sistema recebe tudo **empilhado e
  parado**, com o conteúdo inteiro. Nada se perde, só não se move.

---

## Um detalhe técnico que vale saber

O movimento não usa `animation-timeline`, que é o recurso novo do CSS para
animar com a rolagem. Motivo: ele ainda não funciona no Safari, e boa parte
das suas clientes usa iPhone.

Em vez disso, o `assets/js/cena.js` calcula, a cada quadro, quanto de cada
cena já passou (um número de 0 a 1) e entrega esse número ao CSS. Todo o
movimento é calculado a partir dele. Funciona em qualquer navegador atual.

Para ajustar o ritmo de um ato, mude a altura dele no `index.html`:
`style="--altura:340vh"`. Mais alto, mais devagar.

---

## Imagens novas da versão 2

Além das fotos que a versão 1 já usava, a versão 2 tem **nove recortes**, um
para cada peça de cada ritual:

```
peca-despertar-da-terra-sabonete.jpg   peca-despertar-da-terra-sais.jpg   peca-despertar-da-terra-geleia.jpg
peca-pureza-nativa-sabonete.jpg        peca-pureza-nativa-sais.jpg        peca-pureza-nativa-geleia.jpg
peca-sol-do-cerrado-sabonete.jpg       peca-sol-do-cerrado-sais.jpg       peca-sol-do-cerrado-geleia.jpg
```

Foram recortados das três fotos dos rituais, aproveitando que as três têm a
mesma composição: geleia à esquerda, sabonete ao centro, sais à direita.

Quando existirem fotos individuais de produto, basta salvar por cima com o
mesmo nome. É a melhoria de maior impacto disponível, porque nesses recortes
os rótulos aparecem grandes, e o texto deles ainda está ilegível.

---

## Como eu decidiria

Se a maior parte das vendas vier de quem já conhece a marca, versão 1.
Se vier de descoberta, Instagram, presente, versão 2.

Dá para ter as duas: a versão 2 como página de campanha e a versão 1 como
loja do dia a dia. Como o miolo é o mesmo, elas convivem sem duplicar
trabalho de manutenção.
