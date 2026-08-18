# Recorta as quatro pecas do fundo preto, gerando PNG com transparencia.
#
# Nao uso limiar global de luminancia: partes escuras do proprio produto
# (a sombra lateral do pote, a base do sabonete) cairiam junto e abririam
# buracos na peca. Uso preenchimento a partir das bordas: so e fundo o que
# for escuro E estiver ligado a borda da imagem. Assim o preto de dentro do
# produto fica.
#
# O reflexo tambem sai. Ele esta abaixo da peca, era util na foto sobre
# preto e atrapalha sobre fundo claro. Sombra, se precisar, o CSS faz.

Add-Type -AssemblyName PresentationCore, WindowsBase

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
public static class Recortador {

  // true = fundo. Preenchimento a partir das quatro bordas.
  public static bool[] Fundo(byte[] px, int w, int h, int stride, double limiar) {
    bool[] fundo = new bool[w*h];
    bool[] visto = new bool[w*h];
    Queue<int> fila = new Queue<int>();

    for (int x = 0; x < w; x++) { Semeia(px,w,h,stride,limiar,fundo,visto,fila,x,0); Semeia(px,w,h,stride,limiar,fundo,visto,fila,x,h-1); }
    for (int y = 0; y < h; y++) { Semeia(px,w,h,stride,limiar,fundo,visto,fila,0,y); Semeia(px,w,h,stride,limiar,fundo,visto,fila,w-1,y); }

    while (fila.Count > 0) {
      int i = fila.Dequeue();
      int x = i % w, y = i / w;
      Semeia(px,w,h,stride,limiar,fundo,visto,fila,x-1,y);
      Semeia(px,w,h,stride,limiar,fundo,visto,fila,x+1,y);
      Semeia(px,w,h,stride,limiar,fundo,visto,fila,x,y-1);
      Semeia(px,w,h,stride,limiar,fundo,visto,fila,x,y+1);
    }
    return fundo;
  }

  static void Semeia(byte[] px,int w,int h,int stride,double limiar,bool[] fundo,bool[] visto,Queue<int> fila,int x,int y){
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    int i = y*w + x;
    if (visto[i]) return;
    visto[i] = true;
    int o = y*stride + x*4;
    double lum = 0.299*px[o+2] + 0.587*px[o+1] + 0.114*px[o];
    if (lum > limiar) return;
    fundo[i] = true;
    fila.Enqueue(i);
  }

  // Alfa suavizado: 0 no fundo, 255 na peca, com transicao de 'raio' px.
  public static byte[] Alfa(bool[] fundo, int w, int h, int raio) {
    // distancia aproximada ate o fundo, em duas passadas
    int[] d = new int[w*h];
    int GRANDE = 1 << 20;
    for (int i = 0; i < w*h; i++) d[i] = fundo[i] ? 0 : GRANDE;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int i = y*w+x;
      if (x > 0 && d[i-1]+1 < d[i]) d[i] = d[i-1]+1;
      if (y > 0 && d[i-w]+1 < d[i]) d[i] = d[i-w]+1;
    }
    for (int y = h-1; y >= 0; y--) for (int x = w-1; x >= 0; x--) {
      int i = y*w+x;
      if (x < w-1 && d[i+1]+1 < d[i]) d[i] = d[i+1]+1;
      if (y < h-1 && d[i+w]+1 < d[i]) d[i] = d[i+w]+1;
    }
    byte[] a = new byte[w*h];
    for (int i = 0; i < w*h; i++) {
      double v = (double)d[i] / raio;
      if (v > 1) v = 1;
      a[i] = (byte)Math.Round(v*255);
    }
    return a;
  }
}
"@

$pasta = Join-Path $env:USERPROFILE 'cerro-site-v2\assets\img'
$LIMIAR = 34.0
$RAIO   = 2

foreach ($n in @('florescer-coracao','florescer-esfoliante','florescer-geleia','florescer-mil-flores')) {
  $fs = [System.IO.File]::OpenRead((Join-Path $pasta "$n.jpg"))
  $fr = ([System.Windows.Media.Imaging.BitmapDecoder]::Create($fs,'PreservePixelFormat','OnLoad')).Frames[0]
  $w=$fr.PixelWidth; $h=$fr.PixelHeight
  $c = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($fr,[System.Windows.Media.PixelFormats]::Bgra32,$null,0)
  $s=$w*4; $b=New-Object byte[] ($s*$h); $c.CopyPixels($b,$s,0); $fs.Close()

  $fundo = [Recortador]::Fundo($b, $w, $h, $s, $LIMIAR)
  $alfa  = [Recortador]::Alfa($fundo, $w, $h, $RAIO)

  # ------------------------------------------------------------------
  # Onde termina a peca e comeca o reflexo
  #
  # A primeira versao usava a caixa do produto: pegava o maior y com pixel
  # claro. Nos sabonetes funcionou, nos potes nao: o reflexo deles e claro
  # o bastante para entrar na caixa, entao a base caia embaixo do reflexo e
  # ele sobrevivia. Sobre fundo preto ninguem via. Sobre bege virou mancha.
  #
  # O reflexo e uma copia espelhada e mais fraca. Entao o que separa os dois
  # e uma queda de brilho: percorro o perfil de brilho medio por linha,
  # acho o pico, e desco procurando a primeira linha que cai abaixo de 55%
  # dele. Ali esta a superficie.
  # ------------------------------------------------------------------
  # Uso a LARGURA da silhueta, nao o brilho.
  #
  # A regra por brilho errava em peca abaulada: o coracao e uma cupula, a
  # parte de baixo dele ja esta na sombra, entao o brilho cai dentro do
  # proprio produto e o corte comia a peca. Medido: cortava em 441 quando a
  # ponta do coracao esta em 670.
  #
  # A largura nao mente. A peca afunila ate tocar a superficie, e nesse
  # ponto a silhueta tem um minimo agudo. Depois dele vem o reflexo, que
  # volta a alargar. Medido nas quatro: coracao colapsa em 670 (78px de
  # 571), esfoliante em 600 (41 de 560), geleia em 630 (86 de 588),
  # mil-flores em 650 (23 de 590). Em todas, o colapso fica bem abaixo de
  # um quarto da largura maxima, e nenhuma outra linha do produto chega
  # perto disso.
  $largura = New-Object int[] $h
  for($y=0;$y -lt $h;$y++){
    $cont=0
    for($x=0;$x -lt $w;$x++){ if($alfa[$y*$w+$x] -gt 128){ $cont++ } }
    $largura[$y] = $cont
  }
  $maior=0; $yMaior=0
  for($y=0;$y -lt $h;$y++){ if($largura[$y] -gt $maior){$maior=$largura[$y];$yMaior=$y} }

  # A peca afunila ate tocar a superficie; dali para baixo comeca o reflexo,
  # que VOLTA a alargar. Entao o ponto de contato e o ultimo antes da largura
  # crescer de novo.
  #
  # A versao anterior cortava na primeira linha abaixo de 25% da largura
  # maxima. Funcionou nos potes, que tem base reta e despencam de uma vez, e
  # decepou a ponta do coracao, que afunila devagar e cruza os 25% muito
  # antes de terminar. Medido: cortava em 649 quando a ponta esta em 690.
  #
  # Procurar a virada de sentido nao depende da forma da peca. Exijo que o
  # crescimento seja claro, senao ruido de uma ou duas linhas pararia o
  # laco cedo, e que a largura ja esteja bem abaixo do maximo, para nao
  # confundir uma reentrancia do produto com o comeco do reflexo.
  $base = $h-1
  $anterior = $maior
  for($y=$yMaior+1;$y -lt $h;$y++){
    $atual = $largura[$y]
    if($atual -eq 0){ $base = $y-1; break }
    if($atual -gt ($anterior*1.15 + 3) -and $anterior -lt ($maior*0.5)){
      $base = $y-1; break
    }
    if($atual -lt $anterior){ $anterior = $atual }
  }

  # caixa da peca, agora limitada a base encontrada
  $minX=$w;$maxX=-1;$minY=$h;$maxY=-1
  for($y=0;$y -le $base;$y++){ for($x=0;$x -lt $w;$x++){
    if($alfa[$y*$w+$x] -gt 128){
      $o=$y*$s+$x*4
      if((0.299*$b[$o+2]+0.587*$b[$o+1]+0.114*$b[$o]) -gt 45){
        if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
        if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y} } } } }
  if($maxY -gt $base){ $maxY = $base }

  # abaixo da base, transparente
  for($y=$maxY+1;$y -lt $h;$y++){ for($x=0;$x -lt $w;$x++){ $alfa[$y*$w+$x]=0 } }
  "   $n : linha mais larga em $yMaior, colapso em $base, base da peca em $maxY"

  $m = 8
  $x0=[Math]::Max(0,$minX-$m); $y0=[Math]::Max(0,$minY-$m)
  $x1=[Math]::Min($w-1,$maxX+$m); $y1=[Math]::Min($h-1,$maxY+$m)
  $nw=$x1-$x0+1; $nh=$y1-$y0+1
  $ns=$nw*4; $saida=New-Object byte[] ($ns*$nh)
  for($y=0;$y -lt $nh;$y++){ for($x=0;$x -lt $nw;$x++){
    $so=($y+$y0)*$s+($x+$x0)*4; $do=$y*$ns+$x*4
    $saida[$do]=$b[$so]; $saida[$do+1]=$b[$so+1]; $saida[$do+2]=$b[$so+2]
    $saida[$do+3]=$alfa[($y+$y0)*$w+($x+$x0)] } }

  $bmp=[System.Windows.Media.Imaging.BitmapSource]::Create($nw,$nh,96,96,
        [System.Windows.Media.PixelFormats]::Bgra32,$null,$saida,$ns)
  $enc=New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bmp))
  $out=[System.IO.File]::Create((Join-Path $pasta "$n-recorte.png"))
  try { $enc.Save($out) } finally { $out.Close() }

  # quao escura ficou a peca? media da luminancia dos pixels opacos
  $soma=0.0;$cont=0
  for($i=0;$i -lt $nw*$nh;$i++){ if($saida[$i*4+3] -gt 200){
    $soma += 0.299*$saida[$i*4+2]+0.587*$saida[$i*4+1]+0.114*$saida[$i*4]; $cont++ } }
  "{0}-recorte.png  {1}x{2}  {3} KB  brilho medio da peca: {4}" -f $n,$nw,$nh,[int]((Get-Item (Join-Path $pasta "$n-recorte.png")).Length/1KB),[int]($soma/$cont)
}
