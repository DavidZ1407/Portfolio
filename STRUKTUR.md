# Portfolio Struktur & Dokumentation

> **David Zahn | Games & Immersive Media Creator**  
> Gothic Underwater Theme – Parallax, Canvas-Effekte, 3D Portal Carousel

---

## 📁 Projektstruktur (vollständig)

```
Portfolio/
│
├── index.html                          # Hauptdatei (data-i18n Attribute)
│
├── STRUKTUR.md                         # Diese Datei
│
├── assets/
│   └── Picture/
│       ├── Project1.png                # Unreal Tower Defense
│       ├── Project2.png                # Character Design
│       ├── Project3.png                # 3D Space Scene
│       └── Profile.png                 # Profilbild
│
├── css/
│   ├── main.css                        # Root-Variablen + Globals + Footer
│   ├── responsive.css                  # Zentrales Responsive-System (alle Breakpoints)
│   │
│   └── components/
│       ├── navbar.css                  # Header + Sidebar Socials + Lang-Button
│       ├── landing.css                 # Startseite (Hero Section)
│       ├── archives.css                # Archives (3D Portal Carousel)
│       ├── about.css                   # About Me
│       ├── journey.css                 # Timeline (Anglerfisch-Lure Nodes)
│       ├── contact.css                 # Contact Icons
│       ├── parallax.css                # Fixed Parallax Background (Sky/Castle/Water)
│       ├── modal.css                   # Project Detail Popup
│       └── depth-experience.css        # Scroll-Fog + Vignette + Partikel-Canvas
│
└── js/
    ├── main.js                         # Entry Point – initialisiert ALLES
    │
    ├── constants/
    │   ├── projects.js                 # Projektdaten-Array
    │   ├── skills.js                   # Skills-Array (Hero + About)
    │   ├── timeline.js                 # Timeline-Einträge
    │   └── translations.js             # EN/DE Übersetzungen (alle Texte)
    │
    └── modules/
        ├── navigation.js               # Aktiver Nav-Link (scroll-basiert, rAF-getthrottelt)
        ├── hero-carousel.js            # Startseiten-Carousel (Indikatoren-Klick)
        ├── carousel-dots.js            # Auto-Generiert Carousel-Dots & Indicators
        ├── parallax.js                 # Parallax Layers + CSS-Partikel (Fische/Blasen)
        ├── modal.js                    # Popup-Modal (ESC/Overlay-Klick schließen)
        ├── portal.js                   # 3D Portal Carousel (Auto-Rotate + Bubbles Canvas)
        ├── nav-water.js                # Wasser-Animation für Nav-Link Splash-Effekte
        ├── ocean-shader.js             # Ozean-Shader (Three.js) für Hero-Hintergrund
        ├── underwater.js               # Anglerfisch-Leuchtköder (Timeline)
        ├── flood.js                    # Wasserflut-Effekt (Journey Section)
        ├── particle-rain.js            # Lichtstrahlen + biolumineszente Partikel (Contact)
        ├── depth-experience.js         # Fullpage-Depth-Fog + Vignette + Bubbles Canvas
        ├── fish-swarm.js               # Fischschwarm-Transition (Section-Wechsel)
        ├── bioluminescent-swarm.js     # Tiefsee-Kreaturen (Timeline Hintergrund)
        ├── water-logo.js               # "DAVID ZAHN" Wasser-Shader (WebGL)
        ├── water-subtitle.js           # Text-Cycler mit Wasser-Shader (WebGL)
        ├── language.js                 # EN/DE Sprachumschaltung (localStorage)
        └── modal-shader.js             # Voronoi-Shader (Three.js) für Modal-Hintergrund
    │
    └── utils/
        ├── helpers.js                  # Hilfsfunktionen (debounce, cleanupRegistry etc.)
        └── smooth.js                   # Smooth Lerp Utilities
```

---

## 📦 Abhängigkeiten (extern, via CDN)

| Quelle | Zweck |
|--------|-------|
| `cdnjs.cloudflare.com/three.js/r128` | 3D Shader (Hero, Modal) |
| `unpkg.com/boxicons` | Icons (Social Media, Skills) |
| `fonts.googleapis.com` | Fonts: Cinzel (Titel), Crimson Text (Text), UnifrakturMaguntia |

---

## 🎨 CSS-Architektur

### `main.css` – Globale Basis

- **`:root` Variablen** – Alle Farben an einer Stelle:
  ```
  --abyss-deep: #030809   (Hintergrund)
  --cyan-glow: #49929a    (Unterwasser-Akzente)
  --gold-accent: #c9a861  (Goldene Elemente)
  --text-light: #cdcfd0   (Textfarbe)
  ```
- **`prefers-reduced-motion`** – Deaktiviert Animationen bei Bedarf (Barrierefreiheit)
- **`contain: layout style`** auf Sections – Performance-Optimierung
- **Footer** – `.site_footer` mit Copyright + "ASCEND"-Button

### Wichtige CSS-Komponenten

| Datei | Enthält |
|-------|---------|
| `navbar.css` | Fixed Header + Sidebar (rechts) + Language Toggle Button |
| `parallax.css` | Fixed Hintergrund mit Sky/Castle/Unterwasser-Layer |
| `archives.css` | 3D-Perspektive + Portal-Slides (pos-center/left/right) |
| `journey.css` | Timeline-Nodes (leuchten bei `.show` auf) |
| `depth-experience.css` | Fullpage-Fog-Overlay + Vignette + Canvas |

### Z-Index-Hierarchie

| Wert | Element |
|------|---------|
| 0 | Parallax Background |
| 1-2 | Parallax Mid/Foreground |
| 3 | Parallax FG Particles |
| 5 | Sections (Content) |
| 6 | Depth Fog + Vignette (über Content) |
| 7 | Partikel-Canvas |
| 100 | Header |
| 150 | Sidebar Socials |
| 1000-1001 | Modal Overlay + Container |

---

## ⚙️ JS-Module im Detail

### `main.js` – Initialisierungsreihenfolge

```javascript
DOMContentLoaded → {
  1.  initLanguage()              // EN/DE Umschaltung (MUSS ERSTER SEIN!)
  2.  generateCarouselDots()      // Dots AUTOMATISCH generieren
  3.  initNavigation()            // Scroll-basierte Nav
  4.  initCarousel()              // Hero Indikatoren
  5.  initParallax()              // Hintergrund-Bewegung
  6.  updateParallaxHeight()
  7.  initOceanShader()           // Three.js Ozean-Hintergrund (Hero)
  8.  initWaterLogo()             // "DAVID ZAHN" Wasser-Effekt
  9.  initWaterSubtitle()         // Text-Cycler
  10. initModal(projects)         // Popup-System
  11. initPortal(callback)        // 3D Carousel + Bubbles
  12. renderHeroSkills()          // Skills (übersetzt) generieren
  13. renderAboutSkills()         // About Skills (übersetzt) generieren
  14. initUnderwater()            // Anglerfisch in Timeline
  15. initFlood()                 // Wasser in Journey
  16. initParticleRain()          // Licht + Partikel in Contact
  17. initDepthExperience()       // Fog + Vignette + Bubbles (ganze Seite)
  18. initFishSwarm()             // Fischschwarm (Section-Wechsel)
  19. initBioluminescentSwarm()   // Tiefsee-Kreaturen (Timeline)
  20. initTimelineAnimation()     // Scroll-Reveal
}
```

### Canvas-Performance (alle 60fps)

Alle Canvas-Module vermeiden `shadowBlur` (teuer!) und verwenden stattdessen:
- Große semi-transparente Kreise als Glow-Ersatz
- `6.2832` als vorkomputierte 2π-Konstante
- Vorberechnete RGB-Arrays statt String-Parsing
- Low-Resolution Buffering auf großen Viewports (2056px+)

---

## 🌐 Sprachumschaltung (EN/DE)

### Wie es funktioniert
- **Default: Englisch** – beim ersten Besuch wird Englisch angezeigt
- **Button im Header** (rechts neben den Nav-Links): zeigt die **nächste** Sprache an
- **localStorage** – die Wahl wird gespeichert (`portfolio-lang`)
- **`data-i18n` Attribute** im HTML – jedes übersetzbare Element hat `data-i18n="key-name"`
- **`translations.js`** – alle Texte als Key/Value in EN und DE
- **Skills werden dynamisch gerendert** → i18n-Keys passen automatisch

### Neue Texte hinzufügen
1. Key in `translations.js` bei EN + DE eintragen
2. `data-i18n="dein-key"` im HTML-Element hinzufügen

### Sprache wechseln
- Klick auf den `[DE]` oder `[EN]` Button im Header
- Seite muss nicht neu geladen werden (kein Server nötig)

---

## 🧩 Inhalt hinzufügen

### Neues Projekt (Archives + Modal)

`js/constants/projects.js` – Array-Eintrag hinzufügen:

```javascript
{
    name: "Projektname",
    description: "Kurzbeschreibung (Portal-Slide)",
    fullDescription: "Langer Text (im Modal)",
    image: "assets/Picture/ProjektX.png",
    link: "#",
    skills: [
        { name: "Skill", icon: "bx-code-block" },
        { name: "Tool", icon: "bx-cube" }
    ]
}
```

Dann in `index.html`:
1. Neues `<div class="portal-slide" data-index="X" data-project="X">` im `.portal-carousel`
2. Neues `<div class="carousel_slide">` im `.carousel_track` (Hero)

✅ **Carousel-Dots & Indicators werden AUTOMATISCH generiert!**
- Das `carousel-dots.js` Modul läuft beim Seitenload
- Buttons werden basierend auf der Anzahl der Projekte in `projects.js` generiert
- **Kein manuelles Hinzufügen von Buttons mehr nötig!**

> ⚠️ Wenn du die Anzahl der Slides erhöhst, muss `data-index` und `data-project` aktualisiert werden!

### Neue Skills

`js/constants/skills.js`:

```javascript
{ name: "Skill Name", icon: "bx-ikonname" }
```

Icons von [Boxicons](https://boxicons.com/).  
Skills erscheinen automatisch im Hero-Arsenal + About-Grid (übersetzt).

### Timeline-Eintrag

`js/constants/timeline.js`:

```javascript
{
    year: "SEPT 2025 - approx. 2028",
    title: "Titel",
    org: "Organisation",
    icon: "🎮"
}
```

Dann in `index.html` neuen `.timeline_item`-Block im `.water_timeline`-Container hinzufügen + `data-i18n` Attribute.

### Neues CSS-Modul

1. Datei in `css/components/` erstellen
2. In `index.html` als `<link rel="stylesheet">` einbinden (vor `</head>`)

### Neues JS-Modul

1. Datei in `js/modules/` erstellen mit `export function initModulName() { ... }`
2. In `js/main.js` importieren: `import { initModulName } from './modules/modul-name.js';`
3. Im `DOMContentLoaded`-Event aufrufen

---

## 🎮 Visuelle Effekte & Themes

### Parallax (parallax.js + parallax.css)
- 3 Ebenen: BG (Himmel/Burg), Mid (Castle Walls), FG (Partikel/Fische)
- Scroll-gesteuert mit Lerp-Interpolation
- RAF stoppt bei Inaktivität

### Ocean Shader (ocean-shader.js)
- Three.js WebGL Shader: animierte Wasseroberfläche von unten gesehen
- God Rays, Caustics, Blasen
- Fallback wenn Three.js fehlt → Seite läuft ohne

### Anglerfisch-Lure (underwater.js)
- Biolumineszenter Leuchtköder wandert Timeline entlang
- Mehrschichtiger Glow (außen → Mitte → Kern)
- Nodes leuchten auf (CSS `.timeline_item.show::before`)

### Flood-Effekt (flood.js)
- Canvas-Wasser steigt von unten in Journey-Section
- Wellenlinie + aufsteigende Blasen
- RAF nur aktiv wenn Section sichtbar

### Particle Rain (particle-rain.js)
- Lichtstrahlen + biolumineszente Partikel mit Lifecycle (Birth → Float → Die)
- Low-Res Buffering auf 2056px+ für 60fps
- RAF nur aktiv wenn Section sichtbar

### Depth Experience (depth-experience.js)
- **Fog Overlay**: Wird dunkler je tiefer gescrollt (max 0.7 opacity)
- **Vignette**: Ränder werden dunkler
- **Bubbles Canvas**: ~12 Blasen (3-10px) über ganzer Viewport
- **Particles**: ~30 kleine Punkte (Gold + Cyan) mit Scroll-Parallax

### Fish Swarm (fish-swarm.js)
- Fischschwarm + Blasen beim Section-Wechsel
- Auf 2056px+ Low-Res Rendering (SCALE 0.5/0.35) statt Deaktivierung → Fische bleiben sichtbar

### Bioluminescent Swarm (bioluminescent-swarm.js)
- Tiefsee-Kreaturen im Timeline-Hintergrund
- 3 Typen: Qualle, Tintenfisch, Anglerfisch-Schatten

---

## 🚀 Performance-Tipps

- **Bilder**: `loading="lazy"` + `decoding="async"` auf allen `<img>`-Tags
- **Canvas**: Kein `shadowBlur`, `6.2832` statt `Math.PI*2`, vorberechnete Arrays
- **CSS**: `will-change` + `translateZ(0)` auf animierten Elementen
- **Scroll**: `passive: true`, `requestAnimationFrame`-Throttling
- **Sichtbarkeit**: IntersectionObserver stoppt Canvas-Animationen bei Unsichtbarkeit
- **Reduced Motion**: `prefers-reduced-motion` deaktiviert alles
- **Large Viewports (2056px+)**: Low-Res Buffering, reduzierte Segmente, Fish-Swarm via Low-Res Rendering

---

## ✨ Navbar-Animationen

### Navigation Links – Active & Hover Effekte

**Active State (aktueller Seite)**
- 💧 **Goldengelb Splash-Animation** – kontinuierliche Wasser-Platsch-Effekte unterhalb des Links
- Animationsdauer: **5.5s** smooth ease-in-out
- Farbe: `--gold-accent` (#c9a861)

**Hover State (über Link fahren)**
- 💧 **Cyan Splash-Animation** – Wasser-Platsch-Effekt in Cyan-Farbe
- Gleiche Animationsdauer und Sanftheit wie Active
- Farbe: `--cyan-glow` (#49929a)

### Language Toggle Button – Ripple Ring Effekt

- **Ripple Ring**: Expandierender Kreis beim Hovern (Cyan-Farbe)
- Animationsdauer: **0.8s** ease-out

### Technische Details (navbar.css)

Die Animationen nutzen:
- **`::before` Pseudo-Element** für Splash-Effekte
- **SVG-ähnliche Gradienten** mit `radial-gradient` für realistisches Wasser
- **Box-shadow** Techniken für Spritzwasser-Partikel

**Keyframe-Animationen:**
- `waterSplash` (Gold) – Active Links
- `waterSplashCyan` (Cyan) – Hover Links
- `navRippleRing` – Language Button & Sidebar Socials

---

## 🔧 Bekannte Issues / Todos

### WICHTIG - Noch zu erledigen
- [] Responsive Large Viewports (2056px-4000px): Frames auf 60fps gebracht, Fische per Low-Res Rendering aktiviert statt deaktiviert
- [ ] **Bild-Assets ablegen**: Projekt-Bilder (`Project1.png`, `Project2.png`, `Project3.png`, `Profile.png`) in `assets/Picture/` kopieren → sonst 404 im Modal/Portal
- [ ] **Eigene Projektdaten anpassen**: `js/constants/projects.js` mit echten Projekten füllen (Name, Beschreibung, Skills, Bildpfade)


### OPTIONAL - Nice to have
- [ ] **Clean up**: Eventuell verbleibende alte Referenzen auf umbenannte Dateien prüfen (hero.css, projects.css, etc.)
- [ ] **Accessibility**: `:focus-visible` Stati auf allen interaktiven Elementen testen

---

## 📝 Best Practices für Änderungen

### Animations-Performance
- **Canvas-Operationen**: Nur mit `requestAnimationFrame` durchführen
- **IntersectionObserver**: Nutzen, um Canvas zu pausieren wenn off-screen
- **CSS-Animationen**: Bevorzugen für einfache Transforms/Opacity
- **Avoid**: `shadowBlur` (GPU-intensive), häufige DOM-Manipulationen

### Responsive Design
- **Zentrale Datei**: `css/responsive.css` – alle Breakpoints an einem Ort
- **Breakpoints**: 1980px, 2056px, 2560px, 3840px (groß), 1400px, 1200px, 1024px, 768px, 480px, 425px (klein)
- **Komponenten**: Responsive-Regeln leben in `responsive.css`, nicht in den Komponenten-Dateien

### Barrierefreiheit
- **Alle interaktiven Elemente** müssen `:focus-visible` haben
- **`aria-labels`** auf Buttons (Language Toggle, Modal Close)
- **`prefers-reduced-motion`** wird beachtet – keine Animationen
- **Color Contrast**: Text muss genug Kontrast haben (WCAG AA)

### Internationalisierung (i18n)
- Alle sichtbaren Texte müssen `data-i18n="key"` haben
- Key-Namen: kebab-case (z.B. `hero-title`, `about-description`)
- Neue Keys IMMER in beide Sprachen (EN + DE) in `translations.js` eintragen

---

## 🎨 Farb-Palette Referenz

```css
--abyss-deep: #030809      /* Haupt-Hintergrund (dunkelste) */
--depth-bg: #051214        /* Hover-Dunkel im Portal */
--cyan-glow: #49929a       /* Unterwasser-Leucht (Cyan) */
--gold-accent: #c9a861     /* Gold-Highlight */
--text-light: #cdcfd0      /* Primärer Text */
```

Alle Farben sind als CSS-Custom-Properties in `css/main.css` definiert.

---

## 📞 Kontakt & Wartung

**Fragen zur Struktur?** → Siehe `STRUKTUR.md` (diese Datei)  
**Bugs melden?** → Überprüfe die Issues/Todos (oben)