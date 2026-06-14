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
│       ├── hero.css                    # Landing Page (Hero Section)
│       ├── projects.css                # Archives (3D Portal Carousel)
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
        ├── carousel.js                 # Hero Carousel (Indikatoren-Klick)
        ├── generate-carousel-dots.js   # Auto-Generiert Carousel-Dots & Indicators
        ├── parallax.js                 # Parallax Layers + CSS-Partikel (Fische/Blasen)
        ├── modal.js                    # Popup-Modal (ESC/Overlay-Klick schließen)
        ├── portal.js                   # 3D Portal Carousel (Auto-Rotate + Bubbles Canvas)
        ├── nav-water.js                # Wasser-Animation für Nav-Link Splash-Effekte
        ├── underwater.js               # Anglerfisch-Leuchtköder (Timeline)
        ├── flood.js                    # Wasserflut-Effekt (Journey Section)
        ├── contact-rain.js             # Wassertropfen (Contact Section)
        ├── depth-experience.js         # Fullpage-Depth-Fog + Vignette + Bubbles Canvas
        └── language.js                 # EN/DE Sprachumschaltung (localStorage)
│
    └── utils/
        ├── helpers.js                  # Hilfsfunktionen (throttle, lerp, etc.)
        └── smooth.js                   # Smooth Scroll Utilities
```

---

## 📦 Abhängigkeiten (extern, via CDN)

| Quelle | Zweck |
|--------|-------|
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
| `projects.css` | 3D-Perspektive + Portal-Slides (pos-center/left/right) |
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
  2.  generateCarouselDots()      // Dots AUTOMATISCH generieren (NEW!)
  3.  initNavigation()            // Scroll-basierte Nav
  4.  initCarousel()              // Hero Indikatoren
  5.  initParallax()              // Hintergrund-Bewegung
  6.  updateParallaxHeight()
  7.  initModal(projects)         // Popup-System
  8.  initPortal(callback)        // 3D Carousel + Bubbles
  9.  renderHeroSkills()          // Skills (übersetzt) generieren
  10. renderAboutSkills()         // About Skills (übersetzt) generieren
  11. initUnderwater()            // Anglerfisch in Timeline
  12. initFlood()                 // Wasser in Journey
  13. initContactRain()           // Tropfen in Contact
  14. initDepthExperience()       // Fog + Vignette + Bubbles (ganze Seite)
  15. initTimelineAnimation()     // Scroll-Reveal
}
```

### Canvas-Performance (alle 60fps)

Alle Canvas-Module vermeiden `shadowBlur` (teuer!) und verwenden stattdessen:
- Große semi-transparente Kreise als Glow-Ersatz
- `6.2832` als vorkomputierte 2π-Konstante
- Vorberechnete RGB-Arrays statt String-Parsing

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
- Das `generate-carousel-dots.js` Modul läuft beim Seitenload
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

### Anglerfisch-Lure (underwater.js)
- Biolumineszenter Leuchtköder wandert Timeline entlang
- Mehrschichtiger Glow (außen → Mitte → Kern)
- Nodes leuchten auf (CSS `.timeline_item.show::before`)

### Flood-Effekt (flood.js)
- Canvas-Wasser steigt von unten in Journey-Section
- Wellenlinie + aufsteigende Blasen
- RAF nur aktiv wenn Section sichtbar

### Contact Rain (contact-rain.js)
- Fallende Wassertropfen + Splashes + Ripples
- RAF nur aktiv wenn Section sichtbar

### Depth Experience (depth-experience.js)
- **Fog Overlay**: Wird dunkler je tiefer gescrollt (max 0.7 opacity)
- **Vignette**: Ränder werden dunkler
- **Bubbles Canvas**: ~12 Blasen (3-10px) über ganzer Viewport
- **Particles**: ~30 kleine Punkte (Gold + Cyan) mit Scroll-Parallax

---

## 🚀 Performance-Tipps

- **Bilder**: `loading="lazy"` + `decoding="async"` auf allen `<img>`-Tags
- **Canvas**: Kein `shadowBlur`, `6.2832` statt `Math.PI*2`, vorberechnete Arrays
- **CSS**: `will-change` + `translateZ(0)` auf animierten Elementen
- **Scroll**: `passive: true`, `requestAnimationFrame`-Throttling
- **Sichtbarkeit**: IntersectionObserver stoppt Canvas-Animationen bei Unsichtbarkeit
- **Reduced Motion**: `prefers-reduced-motion` deaktiviert alles

---

## ✨ Navbar-Animationen (NEW)

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
- Simuliert einen Glow-Effekt wie die Social-Media Icons rechts
- Animationsdauer: **0.8s** ease-out

### Technische Details (navbar.css)

Die Animationen nutzen:
- **`::before` Pseudo-Element** für Splash-Effekte (bei non-active Links)
- **`::before` Pseudo-Element** für Splash bei Active Links
- **SVG-ähnliche Gradienten** mit `radial-gradient` für realistisches Wasser
- **Box-shadow** Techniken für Spritzwasser-Partikel

**Keyframe-Animationen:**
- `waterSplash` (Gold) – Active Links
- `waterSplashCyan` (Cyan) – Hover Links
- `navRippleRing` – Language Button & Sidebar Socials

**Modifizieren:**
- Splash-Größe: `width` / `height` Werte in den Keyframes ändern
- Farben: `rgba(201, 168, 97, ...)` → Gold / `rgba(73, 146, 154, ...)` → Cyan
- Geschwindigkeit: Animation-Dauer in `navbar.css` bei `.nav-link.active::after` und `.nav-link:hover::before` anpassen

---

## 🔧 Bekannte Issues / Todos

- [ ] **Bild-Assets fehlen**: `assets/Picture/` existiert nicht im Repo → 404 beim Laden
-- [ ] **Falco ICON*: 
-- [ ] **Nav-Bar right**: `change size Vertikal Line
-- [ ] **Responsive Desktop Size ...**: 
-- [ ] **Change All file clean Up**: 
-- [ ] **Hero Page change strukture*: 
-- [ ] **Hero Page Name Hover effekt*: 
-- [ ] **Work work on X button and everthing*: 
-- [ ] **Descent contact change size*: 
-- [ ] **Change timeline for Font size*: 
-- [ ] **Optomise Site*: 
-- [ ] **Bubles moving*: 
-- [ ] **Add Connten*: 

---

## 📝 Best Practices für Änderungen

### Animations-Performance
- **Canvas-Operationen**: Nur mit `requestAnimationFrame` durchführen
- **IntersectionObserver**: Nutzen, um Canvas zu pausieren wenn off-screen
- **CSS-Animationen**: Bevorzugen für einfache Transforms/Opacity
- **Avoid**: `shadowBlur` (GPU-intensive), häufige DOM-Manipulationen

### Responsive Design
- **Zentrale Datei**: `css/responsive.css` – alle Breakpoints an einem Ort
- **Breakpoints**: 1400px (Laptop), 1200px (Small Laptop), 1024px (Tablet), 768px (Mobile), 480px (Small Mobile), 550px (Portal)
- **Komponenten**: Responsive-Regeln leben in `responsive.css`, nicht in den Komponenten-Dateien
- **z-index**: Responsive anpassen bei kleineren Screens

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