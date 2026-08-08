# Monta o conjunto do Florescer Eterno a partir das quatro fotos individuais.
# Sem IA: os pixels do produto e do rotulo sao os originais da sua foto.
#
# O que este arquivo resolve, em ordem de importancia:
#
# 1. BASE COMUM. Quatro fotos lado a lado, cada uma com o produto centralizado
#    na sua altura, leem como quatro fotos. Alinhando o fundo de todas na
#    mesma linha, como se estivessem na mesma prateleira, leem como um grupo.
#    E o que mais muda a percepcao, e nao custa nada.
#
# 2. ESPACAMENTO IGUAL. Celulas de largura fixa dao folga diferente para cada
#    peca: o coracao ficava com 41px de sobra e o redondo com 126px. Medindo
#    a caixa de cada produto e distribuindo o vao igualmente, o ritmo fecha.
#
# 3. ESCALA REAL. O Coracao tem 120 g e o Mil Flores 80 g. A diferenca linear
#    entre eles e de cerca de 1,25, nao mais que isso. Uma tentativa anterior
#    usou 1,65 e exagerou.
#
# 4. FUNDO IGUALADO. As quatro tem preto ligeiramente diferente, de (13,6,1)
#    a (23,2,1), o que criaria faixa visivel entre elas. A correcao entra com
#    peso pela escuridao do pixel: o fundo e corrigido por inteiro, o produto
#    iluminado nao e tocado.
#
# O miolo e C# compilado. A primeira versao fazia o laco em PowerShell puro e
# levava horas para 2,3 milhoes de pixels.

Add-Type -AssemblyName PresentationCore, WindowsBase

Add-Type -TypeDefinition @"
using System;
public static class Montador {

  // Caixa do produto, ignorando o reflexo (que vive na parte de baixo e e
  // sempre mais escuro que a peca).
  public static int[] Caixa(byte[] px, int w, int h, int stride, double limiar, double ateFracao) {
    int minX=w, maxX=-1, minY=h, maxY=-1;
    int limiteY = (int)(h * ateFracao);
    for (int y = 0; y < limiteY; y++) {
      for (int x = 0; x < w; x++) {
        int o = y*stride + x*4;
        double lum = 0.299*px[o+2] + 0.587*px[o+1] + 0.114*px[o];
        if (lum > limiar) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    return new int[]{ minX, minY, maxX, maxY };
  }

  public static double[] Fundo(byte[] px, int w, int h, int stride) {
    double r=0,g=0,b=0; int n=0;
    for (int y = (int)(h*0.1); y < (int)(h*0.9); y += 3)
      for (int k = 0; k < 20; k++) {
        int x = k < 10 ? k : w - 20 + k;
        int o = y*stride + x*4;
        b += px[o]; g += px[o+1]; r += px[o+2]; n++;
      }
    return new double[]{ r/n, g/n, b/n };
  }

  // Desenha a foto inteira na tela, escalada por 'escala' e posicionada de
  // modo que o ponto (ancoraX, ancoraY) da origem caia em (destX, destY).
  // Como tudo fora do produto e preto igualado, sobreposicao entre vizinhos
  // e inofensiva: preto sobre preto.
  public static void Desenha(
      byte[] tela, int telaW, int telaH, int telaStride,
      byte[] fonte, int fonteW, int fonteH, int fonteStride,
      double escala, double ancoraX, double ancoraY, double destX, double destY,
      double dR, double dG, double dB, double limiar, double esfuma)
  {
    // area da tela que esta foto pode tocar
    double x0 = destX - ancoraX*escala, y0 = destY - ancoraY*escala;
    int px0 = (int)Math.Floor(x0), py0 = (int)Math.Floor(y0);
    int px1 = (int)Math.Ceiling(x0 + fonteW*escala), py1 = (int)Math.Ceiling(y0 + fonteH*escala);
    if (px0 < 0) px0 = 0; if (py0 < 0) py0 = 0;
    if (px1 > telaW) px1 = telaW; if (py1 > telaH) py1 = telaH;

    double larg = fonteW*escala, alt = fonteH*escala;

    for (int y = py0; y < py1; y++) {
      for (int x = px0; x < px1; x++) {
        double u = (x - x0) / escala, v = (y - y0) / escala;
        int sx = (int)u, sy = (int)v;
        if (sx < 0 || sy < 0 || sx >= fonteW || sy >= fonteH) continue;

        int o = sy*fonteStride + sx*4;
        double b = fonte[o], g = fonte[o+1], r = fonte[o+2];

        double lum = 0.299*r + 0.587*g + 0.114*b;
        double peso = 1.0 - (lum / limiar);
        if (peso < 0) peso = 0; if (peso > 1) peso = 1;
        r += dR*peso; g += dG*peso; b += dB*peso;

        // esfuma as quatro bordas da foto para nao deixar retangulo
        double dx = Math.Min(x - x0, x0 + larg - x);
        double dy = Math.Min(y - y0, y0 + alt  - y);
        double a = Math.Min(1.0, Math.Min(dx, dy) / esfuma);
        if (a <= 0) continue;

        int d = y*telaStride + x*4;
        tela[d]   = Sat(tela[d]   * (1-a) + b * a);
        tela[d+1] = Sat(tela[d+1] * (1-a) + g * a);
        tela[d+2] = Sat(tela[d+2] * (1-a) + r * a);
        tela[d+3] = 255;
      }
    }
  }
  static byte Sat(double v) { return v < 0 ? (byte)0 : v > 255 ? (byte)255 : (byte)Math.Round(v); }
}
"@

$pasta  = Join-Path $env:USERPROFILE 'cerro-site-v2\assets\img'
$ALVO   = @(17.0, 7.0, 2.0)
$LIMIAR = 46.0

# Largura que cada peca deve ter na tira, em px. Sai da proporcao real:
# coracao 120 g e a maior; potes de 200 g logo atras; redondo de 80 g menor.
$pecas = @(
  @{ arq='florescer-coracao';    largura=380 },
  @{ arq='florescer-esfoliante'; largura=345 },
  @{ arq='florescer-geleia';     largura=345 },
  @{ arq='florescer-mil-flores'; largura=300 }
)

function Carrega($caminho) {
  $fs = [System.IO.File]::OpenRead($caminho)
  $fr = ([System.Windows.Media.Imaging.BitmapDecoder]::Create($fs,'PreservePixelFormat','OnLoad')).Frames[0]
  $w = $fr.PixelWidth; $h = $fr.PixelHeight
  $c = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($fr,[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
  $s = $w*4; $b = New-Object byte[] ($s*$h); $c.CopyPixels($b,$s,0); $fs.Close()
  $cx = [Montador]::Caixa($b, $w, $h, $s, 55.0, 0.74)
  return @{ px=$b; w=$w; h=$h; stride=$s; caixa=$cx }
}

$fotos = $pecas | ForEach-Object { Carrega (Join-Path $pasta "$($_.arq).jpg") }

function Monta($linhas, $W, $H, $baseFracao, $saida) {
  $stride = $W*4
  $tela = New-Object byte[] ($stride*$H)
  for ($i=0; $i -lt $stride*$H; $i+=4) {
    $tela[$i]=[byte]$ALVO[2]; $tela[$i+1]=[byte]$ALVO[1]; $tela[$i+2]=[byte]$ALVO[0]; $tela[$i+3]=255
  }

  $porLinha = [int]($pecas.Count / $linhas)

  for ($lin=0; $lin -lt $linhas; $lin++) {
    $ini = $lin*$porLinha
    $idxs = $ini..($ini+$porLinha-1)

    # espacamento igual: sobra dividida entre margens e vaos
    $somaLarg = 0
    foreach ($i in $idxs) { $somaLarg += $pecas[$i].largura }
    $vaos = $porLinha + 1
    $vao = ($W - $somaLarg) / $vaos
    if ($vao -lt 20) { $vao = 20 }

    # base comum da linha
    $alturaLinha = $H / $linhas
    $base = $lin*$alturaLinha + $alturaLinha*$baseFracao

    $x = $vao
    foreach ($i in $idxs) {
      $f = $fotos[$i]
      $cx = $f.caixa
      $largProduto = $cx[2] - $cx[0]
      $escala = $pecas[$i].largura / $largProduto

      # ancora: centro horizontal e base do produto na origem
      $ancoraX = ($cx[0] + $cx[2]) / 2.0
      $ancoraY = $cx[3]

      [Montador]::Desenha(
        $tela, $W, $H, $stride,
        $f.px, $f.w, $f.h, $f.stride,
        $escala, $ancoraX, $ancoraY,
        ($x + $pecas[$i].largura/2.0), $base,
        ($ALVO[0]-([Montador]::Fundo($f.px,$f.w,$f.h,$f.stride))[0]),
        ($ALVO[1]-([Montador]::Fundo($f.px,$f.w,$f.h,$f.stride))[1]),
        ($ALVO[2]-([Montador]::Fundo($f.px,$f.w,$f.h,$f.stride))[2]),
        $LIMIAR, 50.0
      )
      $x += $pecas[$i].largura + $vao
    }
  }

  $bmp = [System.Windows.Media.Imaging.BitmapSource]::Create($W,$H,96,96,
          [System.Windows.Media.PixelFormats]::Bgra32,$null,$tela,$stride)
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 88
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bmp))
  $out = [System.IO.File]::Create($saida)
  try { $enc.Save($out) } finally { $out.Close() }
  "{0}  {1}x{2}  {3} KB" -f (Split-Path $saida -Leaf), $W, $H, [int]((Get-Item $saida).Length/1KB)
}

$t = [Diagnostics.Stopwatch]::StartNew()
Monta 1 1800 620 0.72 (Join-Path $pasta 'florescer-conjunto.jpg')
Monta 2 1100 1100 0.74 (Join-Path $pasta 'florescer-conjunto-movel.jpg')
"tempo: {0} ms" -f $t.ElapsedMilliseconds
