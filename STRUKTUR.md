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
        ├── parallax.js                 # Parallax Layers + CSS-Partikel (Fische/Blasen)
        ├── modal.js                    # Popup-Modal (ESC/Overlay-Klick schließen)
        ├── portal.js                   # 3D Portal Carousel (Auto-Rotate + Bubbles Canvas)
        ├── underwater.js               # Anglerfisch-Leuchtköder (Timeline)
        ├── flood.js                    # Wasserflut-Effekt (Journey Section)
        ├── contact-rain.js             # Wassertropfen (Contact Section)
        ├── depth-experience.js         # Fullpage-Depth-Fog + Vignette + Bubbles Canvas
        └── language.js                 # EN/DE Sprachumschaltung (localStorage)
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
  1.  initLanguage()        // EN/DE Umschaltung (MUSS ERSTER SEIN!)
  2.  initNavigation()      // Scroll-basierte Nav
  3.  initCarousel()        // Hero Indikatoren
  4.  initParallax()        // Hintergrund-Bewegung
  5.  updateParallaxHeight()
  6.  initModal(projects)   // Popup-System
  7.  initPortal(callback)  // 3D Carousel + Bubbles
  8.  renderHeroSkills()    // Skills (übersetzt) generieren
  9.  renderAboutSkills()   // About Skills (übersetzt) generieren
  10. initUnderwater()      // Anglerfisch in Timeline
  11. initFlood()           // Wasser in Journey
  12. initContactRain()     // Tropfen in Contact
  13. initDepthExperience() // Fog + Vignette + Bubbles (ganze Seite)
  14. initTimelineAnimation() // Scroll-Reveal
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
3. Carousel-Dots + Indicators aktualisieren

> ⚠️ `TOTAL_SLIDES` in `portal.js` (Zeile 12) muss erhöht werden!

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

## 🔧 Bekannte Issues / Todos

- [ ] **Bild-Assets fehlen**: `assets/Picture/` existiert nicht im Repo → 404 beim Laden
- [ ] HTML-Carousel-Dots + Indicators müssen manuell aktualisiert werden bei neuen Projekten
- [ ] Linkedin-Link in Contact + Sidebar jetzt korrekt
- [ ] Footer hinzugefügt mit "ASCEND"-Button
- [x] Sprachumschaltung EN/DE implementiert (Button im Header)
- [x] `translations.js` + `language.js` Modul
- [x] Skills werden sprachbewusst gerendert (Hero + About)
- [x] Hero hat leeres `.arsenal_grid` → Skills per JS
- [x] About hat leeres `.skills_grid` → Skills per JS