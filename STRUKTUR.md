# Portfolio Struktur

## 📁 Projektaufbau

```
Portfolio/
├── index.html
├── assets/
│
├── css/
│   ├── main.css (importiert alle Components)
│   └── components/
│       ├── navbar.css      (Header & Sidebar)
│       ├── hero.css        (Landing Page)
│       ├── projects.css    (Archives)
│       ├── about.css       (About Me)
│       ├── journey.css     (Timeline)
│       └── contact.css     (Contact)
│
└── js/
    ├── main.js (initialisiert alles)
    │
    ├── constants/
    │   ├── projects.js     (Projektdaten)
    │   ├── skills.js       (Skills)
    │   └── timeline.js     (Timeline-Daten)
    │
    └── modules/
        ├── navigation.js   (Nav-Links aktiv)
        └── carousel.js     (Carousel/Slider)
```

## 🎯 Wie man Sachen hinzufügt

### Neues Projekt hinzufügen
1. Öffne `js/constants/projects.js`
2. Füge ein neues Objekt im `projects` Array hinzu:
```javascript
{ 
    name: "Neues Projekt", 
    description: "Beschreibung", 
    image: "assets/Picture/ProjectX.png", 
    link: "projectX.html" 
}
```

### Neue Skill hinzufügen
1. Öffne `js/constants/skills.js`
2. Füge ein neues Objekt im `skills` Array hinzu:
```javascript
{ name: "Skill Name", icon: "bx-ikonname" }
```
> Icons von [Boxicons](https://boxicons.com/) verfügbar

### Timeline-Eintrag hinzufügen
1. Öffne `js/constants/timeline.js`
2. Füge ein neues Objekt im `timelineData` Array hinzu:
```javascript
{ 
    year: "02/2024 - 05/2024", 
    title: "Titel", 
    text: "Organisation", 
    icon: "🎮" 
}
```

## 🎨 CSS anpassen

- **Farben**: In `css/main.css` unter `:root { }`
- **Komponenten**: Jede Section hat eine eigene CSS-Datei in `css/components/`
- **Globale Styles**: Am Anfang von `css/main.css`

## 📝 Notes

- ✅ Alles ist modular organisiert
- ✅ Neue Inhalte einfach in Constants hinzufügen
- ✅ Keine HTML-Bearbeitung nötig für neue Projekte/Skills
- ✅ about.js nicht nötig (noch nicht implementiert)

