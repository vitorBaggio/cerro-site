<?php
/* ==========================================================================
   Cerrô · Catálogo do servidor
   --------------------------------------------------------------------------
   ESTE ARQUIVO É A AUTORIDADE DE PREÇO. Nada mais.

   Por que ele existe, sendo que já tem um catálogo em assets/js/catalogo.js:
   aquele roda no navegador da pessoa, e tudo que roda no navegador da pessoa
   pode ser alterado por ela. Qualquer visitante abre o console, muda o preço
   do kit para R$ 1,00 e finaliza a compra. Se o servidor confiasse no preço
   que chega junto com o pedido, a loja venderia por um centavo e o Mercado
   Pago cobraria um centavo, porque para ele o valor está correto.

   Então o navegador manda só o QUE e QUANTOS. O preço sai daqui.

   IMPORTANTE: mudou preço em assets/js/catalogo.js, mude aqui também.
   O api/diagnostico.php compara os dois e avisa se ficarem diferentes.
   ========================================================================== */

return array(

  /* --- Peças avulsas --------------------------------------------------- */
  'despertar-sabonete' => array('nome' => 'Sabonete Brisa Rosada · Despertar da Terra',      'preco' => 28.00),
  'despertar-sais'     => array('nome' => 'Sais Pétalas do Deserto · Despertar da Terra',    'preco' => 45.00),
  'despertar-geleia'   => array('nome' => 'Geleia Néctar Suave · Despertar da Terra',        'preco' => 60.00),

  'pureza-sabonete'    => array('nome' => 'Sabonete Toque de Algodão · Pureza Nativa',       'preco' => 28.00),
  'pureza-sais'        => array('nome' => 'Sais Nuvem de Areia · Pureza Nativa',             'preco' => 45.00),
  'pureza-geleia'      => array('nome' => 'Geleia Orvalho da Alvorada · Pureza Nativa',      'preco' => 60.00),

  'sol-sabonete'       => array('nome' => 'Sabonete Frescor do Amanhecer · Sol do Cerrado',  'preco' => 28.00),
  'sol-sais'           => array('nome' => 'Sais Pôr do Sol · Sol do Cerrado',                'preco' => 45.00),
  'sol-geleia'         => array('nome' => 'Geleia Gotas de Ouro · Sol do Cerrado',           'preco' => 60.00),

  /* --- Rituais completos ----------------------------------------------- */
  'despertar-da-terra-kit' => array('nome' => 'Ritual Despertar da Terra completo, 3 peças', 'preco' => 120.00),
  'pureza-nativa-kit'      => array('nome' => 'Ritual Pureza Nativa completo, 3 peças',      'preco' => 120.00),
  'sol-do-cerrado-kit'     => array('nome' => 'Ritual Sol do Cerrado completo, 3 peças',     'preco' => 120.00),

  /* --- Edição de presente ------------------------------------------------
     Fora da trinca. Quatro peças, vendido como conjunto. Os preços das peças
     avulsas ainda não foram definidos: enquanto não estiverem aqui, elas não
     podem ser vendidas separadas, e é assim que tem que ser. Produto sem
     preço no servidor é produto que não existe. */
  'florescer-coracao'       => array('nome' => 'Sabonete Coração Entrelaçado · Florescer Eterno', 'preco' => 45.00),
  'florescer-mil-flores'    => array('nome' => 'Sabonete Mil Flores · Florescer Eterno', 'preco' => 35.00),
  'florescer-esfoliante'    => array('nome' => 'Esfoliante Corporal Cristais Mágicos · Florescer Eterno', 'preco' => 80.00),
  'florescer-geleia'        => array('nome' => 'Geleia de Banho Chuva de Brilho · Florescer Eterno', 'preco' => 80.00),
  'florescer-eterno-kit' => array('nome' => 'Ritual Florescer Eterno completo, 4 peças', 'preco' => 220.00),

  /* --- Combos ----------------------------------------------------------- */
  'trio-sabonetes'     => array('nome' => 'Trio de Sabonetes, um de cada ritual',            'preco' => 84.00),
);
