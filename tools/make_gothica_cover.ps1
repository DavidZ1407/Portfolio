# Erstellt ein hochformatiges Cover (1040x1300, Ratio 0.8) aus G_D_GS_1.png:
# - Crop auf die Logo-Breite (Titel bleibt komplett erhalten)
# - Oben/unten wird der Hintergrund mit sauberen, weich gestreckten
#   Randstreifen fortgesetzt (keine Geister von Emblem/Button)
# - Dezente Vignette an den Raendern der Ergaenzer
Add-Type -AssemblyName System.Drawing

$srcPath = 'c:\Users\David\Desktop\GitHub\Portfolio\assets\Game_Dev\Gothica_Solaris\G_D_GS_1.png'
$outPath = 'c:\Users\David\Desktop\GitHub\Portfolio\assets\Game_Dev\Gothica_Solaris\G_D_GS_1_cover.png'

$src = [System.Drawing.Image]::FromFile($srcPath)
Write-Output ("Source: " + $src.Width + "x" + $src.Height)

# Crop-Fenster: volle Hoehe, 1040px breit, zentriert auf das Logo (Titel ~x195-x1118)
$cropX = 136
$cropW = 1040
$srcH  = $src.Height

# Ziel-Canvas: Ratio 0.8 wie die Desktop-Portal-Karte (320x400)
$canvasW = 1040
$canvasH = 1300
$extTop    = [int](($canvasH - $srcH) / 2)   # 185
$extBottom = $canvasH - $srcH - $extTop      # 185

$canvas = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

# 1) Hauptinhalt: Crop 185px von oben eingesetzt
$srcRect  = New-Object System.Drawing.Rectangle($cropX, 0, $cropW, $srcH)
$destRect = New-Object System.Drawing.Rectangle(0, $extTop, $cropW, $srcH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 2+3) Obere/untere Ergaenzung: glatter Verlauf, berechnet aus der
#      Durchschnittsfarbe der aeussersten Original-Zeile (nahtloser Uebergang,
#      da die Randbereiche des Originals nahezu schwarz sind)

function Get-RowAverageColor($graphics, $rowY) {
    # Zeile auf 1x1 herunterrechnen = Durchschnittsfarbe der Zeile
    $one = New-Object System.Drawing.Bitmap(1, 1)
    $g1 = [System.Drawing.Graphics]::FromImage($one)
    $g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g1.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $sr = New-Object System.Drawing.Rectangle($cropX, $rowY, $cropW, 1)
    $dr = New-Object System.Drawing.Rectangle(0, 0, 1, 1)
    $g1.DrawImage($src, $dr, $sr, [System.Drawing.GraphicsUnit]::Pixel)
    $g1.Dispose()
    $c = $one.GetPixel(0, 0)
    $one.Dispose()
    return $c
}

function New-EdgeFill($graphics, $avgColor, $height, $darkAtTop) {
    # Vertikaler Verlauf: an der Naht exakt die Randfarbe, nach aussen dunkler
    $cSeam  = [System.Drawing.Color]::FromArgb(255, $avgColor.R, $avgColor.G, $avgColor.B)
    $cOuter = [System.Drawing.Color]::FromArgb(255, [int]($avgColor.R * 0.45), [int]($avgColor.G * 0.5), [int]($avgColor.B * 0.55))
    $fill = New-Object System.Drawing.Bitmap($cropW, $height)
    $gf = [System.Drawing.Graphics]::FromImage($fill)
    $p1 = New-Object System.Drawing.Point(0, 0)
    $p2 = New-Object System.Drawing.Point(0, $height)
    if ($darkAtTop) {
        # oben dunkel -> unten (Naht) Randfarbe
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($p1, $p2, $cOuter, $cSeam)
    } else {
        # oben (Naht) Randfarbe -> unten dunkel
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($p1, $p2, $cSeam, $cOuter)
    }
    $gf.FillRectangle($brush, 0, 0, $cropW, $height)
    $gf.Dispose()
    $brush.Dispose()
    return $fill
}

$cTop = Get-RowAverageColor $g 0
$cBot = Get-RowAverageColor $g ($srcH - 1)
Write-Output ("Edge colors top: R=" + $cTop.R + " G=" + $cTop.G + " B=" + $cTop.B + " | bottom: R=" + $cBot.R + " G=" + $cBot.G + " B=" + $cBot.B)

$topFill = New-EdgeFill $g $cTop $extTop $true
$g.DrawImage($topFill, 0, 0)
$topFill.Dispose()

$botFillY = $canvasH - $extBottom
$botFill = New-EdgeFill $g $cBot $extBottom $false
$g.DrawImage($botFill, 0, $botFillY)
$botFill.Dispose()

# 4) Dezente Vignette ueber die Ergaenzungen (Textur laeuft weich ins Dunkel aus)
$fade = 120
$fadeTop = $canvasH - $fade
$pt1 = New-Object System.Drawing.Point(0, 0)
$pt2 = New-Object System.Drawing.Point(0, $fade)
$cDark = [System.Drawing.Color]::FromArgb(90, 3, 6, 12)
$cClear = [System.Drawing.Color]::FromArgb(0, 3, 6, 12)
$brushTop = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt1, $pt2, $cDark, $cClear)
$g.FillRectangle($brushTop, 0, 0, $canvasW, $fade)
$pt3 = New-Object System.Drawing.Point(0, $fadeTop)
$pt4 = New-Object System.Drawing.Point(0, $canvasH)
$brushBot = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pt3, $pt4, $cClear, $cDark)
$g.FillRectangle($brushBot, 0, $fadeTop, $canvasW, $fade)

$g.Dispose()
$canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Vorschau in echter Anzeigegroesse der Portal-Karte (320x400)
$prevPath = 'c:\Users\David\Desktop\GitHub\Portfolio\tools\_preview_320x400.png'
$prev = New-Object System.Drawing.Bitmap(320, 400)
$gp = [System.Drawing.Graphics]::FromImage($prev)
$gp.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gp.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gp.DrawImage($canvas, (New-Object System.Drawing.Rectangle(0, 0, 320, 400)), (New-Object System.Drawing.Rectangle(0, 0, $canvasW, $canvasH)), [System.Drawing.GraphicsUnit]::Pixel)
$gp.Dispose()
$prev.Save($prevPath, [System.Drawing.Imaging.ImageFormat]::Png)
$prev.Dispose()

$canvas.Dispose(); $src.Dispose()
Write-Output ("Saved: " + $outPath + " (" + $canvasW + "x" + $canvasH + ", Ratio " + [math]::Round($canvasW / $canvasH, 3) + ")")
Write-Output ("Preview: " + $prevPath)