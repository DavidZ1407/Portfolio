# Portfolio Struktur & Dokumentation

> **David Zahn | Games & Immersive Media Creator**  
> Gothic Underwater Theme â€“ Parallax, Canvas-Effekte, 3D Portal Carousel

---

## ðŸ“ Projektstruktur (vollstÃ¤ndig)

```
Portfolio/
â”‚
â”œâ”€â”€ index.html                          # Hauptdatei (data-i18n Attribute)
â”‚
â”œâ”€â”€ STRUKTUR.md                         # Diese Datei
â”‚
â”œâ”€â”€ assets/
â”‚   â””â”€â”€ Picture/
â”‚       â”œâ”€â”€ Project1.png                # Unreal Tower Defense
â”‚       â”œâ”€â”€ Project2.png                # Character Design
â”‚       â”œâ”€â”€ Project3.png                # 3D Space Scene
â”‚       â””â”€â”€ Profile.png                 # Profilbild
â”‚
â”œâ”€â”€ css/
â”‚   â”œâ”€â”€ main.css                        # Root-Variablen + Globals + Footer
â”‚   â”œâ”€â”€ responsive.css                  # Zentrales Responsive-System (alle Breakpoints)
â”‚   â”‚
â”‚   â””â”€â”€ components/
â”‚       â”œâ”€â”€ navbar.css                  # Header + Sidebar Socials + Lang-Button
â”‚       â”œâ”€â”€ landing.css                 # Startseite (Hero Section)
â”‚       â”œâ”€â”€ archives.css                # Archives (3D Portal Carousel)
â”‚       â”œâ”€â”€ about.css                   # About Me
â”‚       â”œâ”€â”€ journey.css                 # Timeline (Anglerfisch-Lure Nodes)
â”‚       â”œâ”€â”€ contact.css                 # Contact Icons
â”‚       â”œâ”€â”€ parallax.css                # Fixed Parallax Background (Sky/Castle/Water)
â”‚       â”œâ”€â”€ modal.css                   # Project Detail Popup
â”‚       â””â”€â”€ depth-experience.css        # Scroll-Fog + Vignette + Partikel-Canvas
â”‚
â””â”€â”€ js/
    â”œâ”€â”€ main.js                         # Entry Point â€“ initialisiert ALLES
    â”‚
    â”œâ”€â”€ constants/
    â”‚   â”œâ”€â”€ projects.js                 # Projektdaten-Array
    â”‚   â”œâ”€â”€ skills.js                   # Skills-Array (Hero + About)
    â”‚   â”œâ”€â”€ timeline.js                 # Timeline-EintrÃ¤ge
    â”‚   â””â”€â”€ translations.js             # EN/DE Ãœbersetzungen (alle Texte)
    â”‚
    â””â”€â”€ modules/
        â”œâ”€â”€ navigation.js               # Aktiver Nav-Link (scroll-basiert, rAF-getthrottelt)
        â”œâ”€â”€ hero_carousel.js            # Startseiten-Carousel (Indikatoren-Klick)
        â”œâ”€â”€ carousel_dots.js            # Auto-Generiert Carousel-Dots & Indicators
        â”œâ”€â”€ parallax.js                 # Parallax Scroll-Layers (Transform bei Scroll)
        â”œâ”€â”€ unified_particles.js        # Ein gemeinsames Vollbild-Partikelsystem (back z3 + front z7)
        â”œâ”€â”€ modal.js                    # Popup-Modal (ESC/Overlay-Klick schlieÃŸen)
        â”œâ”€â”€ portal.js                   # 3D Portal Carousel (Auto-Rotate + Bubbles Canvas)
        â”œâ”€â”€ ocean_shader.js             # Ozean-Shader (Three.js) fÃ¼r Hero-Hintergrund
        â”œâ”€â”€ underwater.js               # Anglerfisch-LeuchtkÃ¶der (Timeline)
        â”œâ”€â”€ flood.js                    # Wasserflut-Effekt (Journey Section)
        â”œâ”€â”€ particle_rain.js            # Lichtstrahlen + biolumineszente Partikel (Contact)
        â”œâ”€â”€ depth_experience.js         # Fullpage-Depth-Fog + Vignette + Scroll (ruft unified-particles)
        â”œâ”€â”€ fish_swarm.js               # Fischschwarm-Transition (Section-Wechsel)
        â”œâ”€â”€ bioluminescent_swarm.js     # Tiefsee-Kreaturen (Timeline Hintergrund)
        â”œâ”€â”€ water_logo.js               # "DAVID ZAHN" Wasser-Shader (WebGL)
        â”œâ”€â”€ water_subtitle.js           # Text-Cycler mit Wasser-Shader (WebGL)
        â”œâ”€â”€ language.js                 # EN/DE Sprachumschaltung (localStorage)
        â””â”€â”€ modal_shader.js             # Voronoi-Shader (Three.js) fÃ¼r Modal-Hintergrund
    â”‚
    â””â”€â”€ utils/
        â”œâ”€â”€ helpers.js                  # Hilfsfunktionen (debounce, cleanupRegistry etc.)
        â””â”€â”€ smooth.js                   # Smooth Lerp Utilities
```

---

## ðŸ“¦ AbhÃ¤ngigkeiten (extern, via CDN)

| Quelle | Zweck |
|--------|-------|
| `cdnjs.cloudflare.com/three.js/r128` | 3D Shader (Hero, Modal) |
| `unpkg.com/boxicons` | Icons (Social Media, Skills) |
| `fonts.googleapis.com` | Fonts: Cinzel (Titel), Crimson Text (Text), UnifrakturMaguntia |

---

## ðŸŽ¨ CSS-Architektur

### `main.css` â€“ Globale Basis

- **`:root` Variablen** â€“ Alle Farben an einer Stelle:
  ```
  --abyss-deep: #030809   (Hintergrund)
  --cyan-glow: #49929a    (Unterwasser-Akzente)
  --gold-accent: #c9a861  (Goldene Elemente)
  --text-light: #cdcfd0   (Textfarbe)
  ```
- **`prefers-reduced-motion`** â€“ Deaktiviert Animationen bei Bedarf (Barrierefreiheit)
- **`contain: layout style`** auf Sections â€“ Performance-Optimierung
- **Footer** â€“ `.site_footer` mit Copyright + "ASCEND"-Button

### Wichtige CSS-Komponenten

| Datei | EnthÃ¤lt |
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
| 6 | Depth Fog + Vignette (Ã¼ber Content) |
| 7 | Partikel-Canvas |
| 100 | Header |
| 150 | Sidebar Socials |
| 1000-1001 | Modal Overlay + Container |

---

## âš™ï¸ JS-Module im Detail

### `main.js` â€“ Initialisierungsreihenfolge

```javascript
DOMContentLoaded â†’ {
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
  12. renderHeroSkills()          // Skills (Ã¼bersetzt) generieren
  13. renderAboutSkills()         // About Skills (Ã¼bersetzt) generieren
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
- GroÃŸe semi-transparente Kreise als Glow-Ersatz
- `6.2832` als vorkomputierte 2Ï€-Konstante
- Vorberechnete RGB-Arrays statt String-Parsing
- Low-Resolution Buffering auf groÃŸen Viewports (2056px+)

---

## ðŸŒ Sprachumschaltung (EN/DE)

### Wie es funktioniert
- **Default: Englisch** â€“ beim ersten Besuch wird Englisch angezeigt
- **Button im Header** (rechts neben den Nav-Links): zeigt die **nÃ¤chste** Sprache an
- **localStorage** â€“ die Wahl wird gespeichert (`portfolio-lang`)
- **`data-i18n` Attribute** im HTML â€“ jedes Ã¼bersetzbare Element hat `data-i18n="key-name"`
- **`translations.js`** â€“ alle Texte als Key/Value in EN und DE
- **Skills werden dynamisch gerendert** → i18n-Keys passen automatisch
- **CV-Download ist sprachabhängig** → `assets/CV/David_Zahn_CV.pdf` (EN), `assets/CV/David_Zahn_CV_de.pdf` (DE)

### Neue Texte hinzufÃ¼gen
1. Key in `translations.js` bei EN + DE eintragen
2. `data-i18n="dein-key"` im HTML-Element hinzufÃ¼gen

### Sprache wechseln
- Klick auf den `[DE]` oder `[EN]` Button im Header
- Seite muss nicht neu geladen werden (kein Server nÃ¶tig)

---

## ðŸ§© Inhalt hinzufÃ¼gen

### Neues Projekt (Archives + Modal)

`js/constants/projects.js` â€“ Array-Eintrag hinzufÃ¼gen:

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

âœ… **Carousel-Dots & Indicators werden AUTOMATISCH generiert!**
- Das `carousel_dots.js` Modul lÃ¤uft beim Seitenload
- Buttons werden basierend auf der Anzahl der Projekte in `projects.js` generiert
- **Kein manuelles HinzufÃ¼gen von Buttons mehr nÃ¶tig!**

> âš ï¸ Wenn du die Anzahl der Slides erhÃ¶hst, muss `data-index` und `data-project` aktualisiert werden!

### Neue Skills

`js/constants/skills.js`:

```javascript
{ name: "Skill Name", icon: "bx-ikonname" }
```

Icons von [Boxicons](https://boxicons.com/).  
Skills erscheinen automatisch im Hero-Arsenal + About-Grid (Ã¼bersetzt).

### Timeline-Eintrag

`js/constants/timeline.js`:

```javascript
{
    year: "SEPT 2025 - approx. 2028",
    title: "Titel",
    org: "Organisation",
    icon: "ðŸŽ®"
}
```

Dann in `index.html` neuen `.timeline_item`-Block im `.water_timeline`-Container hinzufÃ¼gen + `data-i18n` Attribute.

### Neues CSS-Modul

1. Datei in `css/components/` erstellen
2. In `index.html` als `<link rel="stylesheet">` einbinden (vor `</head>`)

### Neues JS-Modul

1. Datei in `js/modules/` erstellen mit `export function initModulName() { ... }`
2. In `js/main.js` importieren: `import { initModulName } from './modules/modul_name.js';`
3. Im `DOMContentLoaded`-Event aufrufen

---

## ðŸŽ® Visuelle Effekte & Themes

### Parallax (parallax.js + parallax.css)
- 3 Ebenen: BG (Himmel/Burg), Mid (Castle Walls), FG (Partikel/Fische)
- Scroll-gesteuert mit Lerp-Interpolation
- RAF stoppt bei InaktivitÃ¤t

### Ocean Shader (ocean_shader.js)
- Three.js WebGL Shader: animierte WasseroberflÃ¤che von unten gesehen
- God Rays, Caustics, Blasen
- Fallback wenn Three.js fehlt â†’ Seite lÃ¤uft ohne

### Anglerfisch-Lure (underwater.js)
- Biolumineszenter LeuchtkÃ¶der wandert Timeline entlang
- Mehrschichtiger Glow (auÃŸen â†’ Mitte â†’ Kern)
- Nodes leuchten auf (CSS `.timeline_item.show::before`)

### Flood-Effekt (flood.js)
- Canvas-Wasser steigt von unten in Journey-Section
- Wellenlinie + aufsteigende Blasen
- RAF nur aktiv wenn Section sichtbar

### Particle Rain (particle_rain.js)
- Lichtstrahlen + biolumineszente Partikel mit Lifecycle (Birth â†’ Float â†’ Die)
- Low-Res Buffering auf 2056px+ fÃ¼r 60fps
- RAF nur aktiv wenn Section sichtbar

### Depth Experience (depth_experience.js)
- **Fog Overlay**: Wird dunkler je tiefer gescrollt (max 0.7 opacity)
- **Vignette**: RÃ¤nder werden dunkler
- **Bubbles Canvas**: ~12 Blasen (3-10px) Ã¼ber ganzer Viewport
- **Particles**: ~30 kleine Punkte (Gold + Cyan) mit Scroll-Parallax

### Fish Swarm (fish_swarm.js)
- Fischschwarm + Blasen beim Section-Wechsel
- Auf 2056px+ Low-Res Rendering (SCALE 0.5/0.35) statt Deaktivierung â†’ Fische bleiben sichtbar

### Bioluminescent Swarm (bioluminescent_swarm.js)
- Tiefsee-Kreaturen im Timeline-Hintergrund
- 3 Typen: Qualle, Tintenfisch, Anglerfisch-Schatten

---

## ðŸš€ Performance-Tipps

- **Bilder**: `loading="lazy"` + `decoding="async"` auf allen `<img>`-Tags
- **Canvas**: Kein `shadowBlur`, `6.2832` statt `Math.PI*2`, vorberechnete Arrays
- **CSS**: `will-change` + `translateZ(0)` auf animierten Elementen
- **Scroll**: `passive: true`, `requestAnimationFrame`-Throttling
- **Sichtbarkeit**: IntersectionObserver stoppt Canvas-Animationen bei Unsichtbarkeit
- **Reduced Motion**: `prefers-reduced-motion` deaktiviert alles
- **Large Viewports (2056px+)**: Low-Res Buffering, reduzierte Segmente, Fish-Swarm via Low-Res Rendering

---

## âœ¨ Navbar-Animationen

### Navigation Links â€“ Active & Hover Effekte

**Active State (aktueller Seite)**
- ðŸ’§ **Goldengelb Splash-Animation** â€“ kontinuierliche Wasser-Platsch-Effekte unterhalb des Links
- Animationsdauer: **5.5s** smooth ease-in-out
- Farbe: `--gold-accent` (#c9a861)

**Hover State (Ã¼ber Link fahren)**
- ðŸ’§ **Cyan Splash-Animation** â€“ Wasser-Platsch-Effekt in Cyan-Farbe
- Gleiche Animationsdauer und Sanftheit wie Active
- Farbe: `--cyan-glow` (#49929a)

### Language Toggle Button â€“ Ripple Ring Effekt

- **Ripple Ring**: Expandierender Kreis beim Hovern (Cyan-Farbe)
- Animationsdauer: **0.8s** ease-out

### Technische Details (navbar.css)

Die Animationen nutzen:
- **`::before` Pseudo-Element** fÃ¼r Splash-Effekte
- **SVG-Ã¤hnliche Gradienten** mit `radial-gradient` fÃ¼r realistisches Wasser
- **Box-shadow** Techniken fÃ¼r Spritzwasser-Partikel

**Keyframe-Animationen:**
- `waterSplash` (Gold) â€“ Active Links
- `waterSplashCyan` (Cyan) â€“ Hover Links
- `navRippleRing` â€“ Language Button & Sidebar Socials

---

## ðŸ”§ Bekannte Issues / Todos

### WICHTIG - Noch zu erledigen
- [x] Responsive Large Viewports (2056px-4000px): Frames auf 60fps gebracht, Fische per Low-Res Rendering aktiviert statt deaktiviert
- [ ] **Bild-Assets ablegen**: Projekt-Bilder (`Project1.png`, `Project2.png`, `Project3.png`, `Profile.png`) in `assets/Picture/` kopieren â†’ sonst 404 im Modal/Portal
- [ ] **Eigene Projektdaten anpassen**: `js/constants/projects.js` mit echten Projekten fÃ¼llen (Name, Beschreibung, Skills, Bildpfade)


### OPTIONAL - Nice to have
- [ ] **Accessibility**: `:focus-visible` Stati auf allen interaktiven Elementen testen

---

## ðŸ“ Best Practices fÃ¼r Ã„nderungen

### Animations-Performance
- **Canvas-Operationen**: Nur mit `requestAnimationFrame` durchfÃ¼hren
- **IntersectionObserver**: Nutzen, um Canvas zu pausieren wenn off-screen
- **CSS-Animationen**: Bevorzugen fÃ¼r einfache Transforms/Opacity
- **Avoid**: `shadowBlur` (GPU-intensive), hÃ¤ufige DOM-Manipulationen

### Responsive Design
- **Zentrale Datei**: `css/responsive.css` â€“ alle Breakpoints an einem Ort
- **Breakpoints**: 1980px, 2056px, 2560px, 3840px (groÃŸ), 1400px, 1200px, 1024px, 768px, 480px, 425px (klein)
- **Komponenten**: Responsive-Regeln leben in `responsive.css`, nicht in den Komponenten-Dateien

### Barrierefreiheit
- **Alle interaktiven Elemente** mÃ¼ssen `:focus-visible` haben
- **`aria-labels`** auf Buttons (Language Toggle, Modal Close)
- **`prefers-reduced-motion`** wird beachtet â€“ keine Animationen
- **Color Contrast**: Text muss genug Kontrast haben (WCAG AA)

### Internationalisierung (i18n)
- Alle sichtbaren Texte mÃ¼ssen `data-i18n="key"` haben
- Key-Namen: kebab-case (z.B. `hero-title`, `about-description`)
- Neue Keys IMMER in beide Sprachen (EN + DE) in `translations.js` eintragen

---

## ðŸŽ¨ Farb-Palette Referenz

```css
--abyss-deep: #030809      /* Haupt-Hintergrund (dunkelste) */
--depth-bg: #051214        /* Hover-Dunkel im Portal */
--cyan-glow: #49929a       /* Unterwasser-Leucht (Cyan) */
--gold-accent: #c9a861     /* Gold-Highlight */
--text-light: #cdcfd0      /* PrimÃ¤rer Text */
```

Alle Farben sind als CSS-Custom-Properties in `css/main.css` definiert.

---

## ðŸ“ž Kontakt & Wartung

**Fragen zur Struktur?** â†’ Siehe `STRUKTUR.md` (diese Datei)  
**Bugs melden?** â†’ ÃœberprÃ¼fe die Issues/Todos (oben)

---

## 🧹 Code-Cleanup & Konventionen

> Gültig seit dem Refactoring. Ziel: keine sichtbaren Änderungen – nur Struktur,
> Benennung und Wiederverwendbarkeit verbessern.

### ⚙️ Magic Numbers → Konstanten / CSS-Variablen

Hart kodierte Zahlenwerte werden durch benannte Konstanten bzw. CSS-Custom-Properties
ersetzt und an zentralen Stellen gepflegt:

| Wo | Was | Ort |
|----|-----|-----|
| **CSS-Variablen** | Layout-Paddings, Line-Heights, Transition-Dauern | `css/main.css` → `:root` |
| **Shared JS-Konstanten** | Canvas-Cap (2560), Mobile-Breakpoint (768), Debounce/Throttle | `js/constants/ui.js` |
| **Modul-Konstanten** | Modulspezifische Timing-/Größenwerte (z.B. `WATER_ANIMATION_MS`, `AUTO_INTERVAL`, `TILT_MAX_ANGLE`) | am Anfang jeder Modul-Datei |

Beispiele:
- `delay = 150` → `debounce(fn, DEBOUNCE_DELAY_MS)` aus `ui.js`
- `padding: 140px 10%` → `padding: var(--section-pad-y) var(--section-pad-x)`
- `setTimeout(..., 1000)` → `setTimeout(..., WATER_ANIMATION_MS)`

### 🔁 Duplikation vermeiden

- **Media-Render-Logik** im Modal (Bild/Video) liegt jetzt zentral in
  `renderMediaItem()` – wird von `showMedia()` und `syncLightbox()` genutzt.
- **Modal-Größen-Presets** (2056/2560/3840px) sind in `MODAL_SIZE_PRESETS` zusammengefasst
  statt dreier if-Block-Kopien.
- Canvas-Sizing, Debounce, Throttle & Cleanup-Registry sind gebündelt in `js/utils/`.

### ✍️ Namenskonventionen

- **JavaScript**: `camelCase` für Variablen & Funktionen (z.B. `currentProjectIndex`),
  `UPPER_SNAKE_CASE` für Konstanten.
- **CSS-Klassen/IDs & Dateinamen**: Unterstriche statt Bindestriche, einheitlich über
  HTML, CSS und JS-Referenzen (z.B. `modal_close_btn` statt `modal-close-btn`).
- Beim Umbenennen einer Klasse werden **alle** Vorkommen in HTML, CSS und JS angepasst
  (`querySelector`, `classList`, `className`), damit nichts bricht.

### 📱 Responsive-Datei (bewusst getrennt)

- `css/responsive.css` bleibt **eigene, dedizierte Datei** – alle Breakpoints an einem Ort.
- Media-Query-Blöcke werden **nicht** in andere CSS-Dateien verschoben/zusammengeführt.
- Innerhalb der Datei gelten dieselben Cleanup-Regeln (Variablen, Namenskonventionen),
  aber die Trennung bleibt erhalten.
- Die numerischen **Breakpoint-Grenzen** (768/1024/1200/1400/1980/2056/2560/3840px)
  stehen zentral im Kopf-Kommentar der Datei; `@media`-Bedingungen können technisch
  kein `var()` verwenden, daher leben die Werte dort direkt.

### 🔀 Umbenennungen (Cleanup)

> Falls du Code-Stellen außerhalb dieses Repos referenzierst (z.B. externe Tools oder
> Deployment-Skripte), prüfe folgende Namen:

**Neu erstellt**
- `js/constants/ui.js` – Shared-Konstanten (vorher verstreute Magic Numbers).

**Umbenannte CSS-Klassen / IDs (Bindestrich → Unterstrich, konsistent in HTML+CSS+JS)**
- Modal-System: `modal-close-btn` → `modal_close_btn`, `modal-content` → `modal_content`,
  `modal-media-*` → `modal_media_*`, `modal-project-*` → `modal_project_*`,
  `modal-cat-tab(s)` → `modal_cat_tab(s)`, `modal-thumb-*` → `modal_thumb_*`,
  `modal-lightbox-*` → `modal_lightbox_*`, `modal-skills-*`, `modal-contribution-*`,
  `project-modal(-overlay)` → `project_modal(_overlay)`.
- Navigation: `nav-link` → `nav_link`.
- SVG-Filter-IDs: `water-emerge` → `water_emerge`, `water-close` → `water_close`,
  `water-effect` → `water_effect`, `water-distort-hover/-close/-modal-hover` → `water_distort_*`.
- Aktiv-Klasse: `fade-complete` → `fade_complete`.
- Animation-/Keyframe-Namen im Modal (`modal-emerge-water`, `modal-close-water`,
  `modal-content-appear`, `modal-*`) wurden mit umbenannt.

**Noch nicht umbenannt (bewusst ausgelassen – separate Folge-Pässe, um nichts Unverifiziertes zu brechen)**
- Portal-Carousel: `portal-carousel`, `portal-slide`, `carousel-arrow/-prev/-next/-controls/-dots`,
  `c-dot`, `main-cat-*`, `slide-*`, `tilt-*`, `fc-*`, `pos-*`, `portal-bubbles-canvas`, ...
- Parallax/Atmosphäre: `parallax-*`, `sky-layer`, `castle-*`, `water-surface`,
  `underwater-layer/-caustics`, `particles-layer`, `light-ray`, `lr-*`, ...
- Canvas-Effekte: `*canvas` (hero-shader-, rain-, underwater-, flood-, swarm-, fish-swarm-,
  unified-particles-canvas-*), `swarm-canvas`, `depth-fog-overlay`, `depth-vignette`,
  `sphere-near`, `lang-toggle-btn`, `water-text-*`, `water-subtitle-*`.

Falls du diese weiter vereinheitlichen möchtest, können sie in einem zweiten Durchgang
analog zum Modal-System (längster Token zuerst, alle drei Sprachen konsistent) umbenannt werden.

**Konstanten (neu)**
- **Modal:** `WATER_ANIMATION_MS`, `MODAL_SIZE_PRESETS`, `MODAL_DEFAULT_SIZE`,
  `MODAL_VIEWPORT_MARGIN_X/Y`; Helper `renderMediaItem()` neu.
- **Portal:** `AUTO_RESUME_DELAY_MS`, `RESIZE_BOOT_DELAY_MS`, `BUBBLE_COUNT`, `PARTICLE_COUNT`.
- **Parallax:** `BG_SPEED`, `MID_SPEED`, `UNDERWATER_THRESHOLD`, `WATER_SURFACE_WINDOW/LEAD`,
  `CASTLE_THRESHOLD`, `LERP_SMOOTHING`, `SNAP_EPSILON`.
- **Depth-Experience:** `FOG_*`, `VIGNETTE_*`, `BODY_BLUE_BASE/RANGE`.
- **Navigation:** `SCROLL_ACTIVE_OFFSET`, `BOTTOM_DETECT_OFFSET`.
- **AnimationManager:** `MAX_FRAME_DELTA_SECONDS`.
- **CSS-Variablen (in `:root`):** `--section-pad-y/-x`, `--footer-pad-y/-x`,
  `--base-line-height`, `--text-line-height`, `--transition-fast`, `--transition-med`.


