/* ========================================= */
/* CONSTANTS - PROJECTS                        */
/*                                           */
/* Struktur:                                   */
/*   projects[] -> Array von Projekt-Objekten   */
/*   Jedes Projekt hat: category, title,       */
/*   subtitle, description, media[],           */
/*   contribution[], tools[]                  */
/*                                           */
/* Zusätzlich:                                 */
/*   categoryProjects -> Objekt, pro Kategorie */
/*   die Indices der projekte in projects[]    */
/*   erlaeht "mehrere Projekte pro Kategorie"  */
/* ========================================= */

/* ---- Kategorien (Label) ---- */
const CATEGORY_LABELS = {
    gamedev: { en: 'Game Dev', de: 'Game Development' },
    '3d':    { en: '3D', de: '3D & Visual Art' },
    concept: { en: '2D & Concept Art', de: '2D & Concept Art' },
    coding:  { en: 'Coding Web', de: 'Web & Interactive' },
    sound:   { en: 'Sound', de: 'Audio & Sound Design' },
    other:   { en: 'Other Projects', de: 'Other Projects' }
};

/* ---- Deutsche Uebersetzungen (pro Index) ---- */
const PROJECT_TRANSLATIONS = {
    de: {
        0: {
            subtitle: 'Tower Defense & Strategie in UE5',
            description: 'Ein tower defense Spiel entwickelt in Unreal Engine 5. Kombiniere strategisches Denken mit actionreichem Gameplay in einer dusteren Fantasy-Welt. Baue Verteidigungsanlagen, verwalte Ressourcen und besiege Wellen von Gegnern.',
            contribution: [
                'Design & Implementierung des Tower-Defense-Gameplays',
                'Programmierung der Gegnerwellen, Ressourcen und Balancing',
                'Bau der Level-Layouts und Turm-Platzierungssysteme'
            ]
        },
        1: {
            subtitle: 'Konzeptkunst & Charakterdesign',
            description: 'Eine Sammlung von Character Designs im Dark Fantasy Stil. Von dusteren Rittern bis hin zu mystischen Kreaturen erzaehlt jedes Design seine eigene Geschichte. Entwickelt mit Fokus auf Atmosphaere und narrative Tiefe.',
            contribution: [
                'Entwurf der kompletten Charakter-Linien von Skizze bis Render',
                'Entwicklung des Dark-Fantasy-Stils und der Farbwelten',
                'Erstellung der Anatomie- und Pose-Studien'
            ]
        },
        2: {
            subtitle: 'Blender Animation & Modeling',
            description: 'Eine atmospaerische 3D-Weltraum-Szene, die die Einsamkeit und Schoenheit des Weltraums einfaengt. Mit komplexen Shader-Netzwerken, volumetrischem Nebel und dynamischer Beleuchtung entsteht ein immersives Erlebnis.',
            contribution: [
                'Modeling der Raumstation und der Planetoiden',
                'Aufbau der Shader-Netzwerke und Beleuchtung',
                'Animation der Kamera und der volumetrischen Effekte'
            ]
        },
        6: {
            subtitle: 'UE5 Puzzle-Mechanik-Prototyp',
            description: 'Ein Prototyp zur Erkundung rasterbasierter Puzzle-Mechanismen und Player-Affordanzen in Unreal Engine 5. Mit Blueprints und C++ entwickelt, Fokus auf praezise Interaktions-Feedbacks und saubere Regelsysteme.',
            contribution: [
                'Prototypisierung des Kern-Gitter- und Regelsystems in Blueprints',
                'Implementierung der Spielerinteraktion und visueller Feedbacks (C++)',
                'Pacing und Schwierigkeitskurve der Puzzles balanciert'
            ]
        }
    }
};
/* ---- Exporte für das Modal ---- */
export { CATEGORY_LABELS, PROJECT_TRANSLATIONS };
export function getProjectSubtitle(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    if (lang === 'de' && PROJECT_TRANSLATIONS.de[index] && PROJECT_TRANSLATIONS.de[index].subtitle) {
        return PROJECT_TRANSLATIONS.de[index].subtitle;
    }
    return p && p.subtitle ? p.subtitle : '';
}
export function getProjectDescription(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    if (lang === 'de' && PROJECT_TRANSLATIONS.de[index] && PROJECT_TRANSLATIONS.de[index].description) {
        return PROJECT_TRANSLATIONS.de[index].description;
    }
    return p && p.description ? p.description : '';
}
export function getProjectContribution(index, lang = 'en') {
    const p = projects[index];
    if (!p) return [];
    if (lang === 'de' && PROJECT_TRANSLATIONS.de[index] && PROJECT_TRANSLATIONS.de[index].contribution) {
        return PROJECT_TRANSLATIONS.de[index].contribution;
    }
    return p && p.contribution ? p.contribution : [];
}
export function getCategoryLabel(category, lang = 'en') {
    const c = CATEGORY_LABELS[category];
    if (!c) return category;
    return c[lang] || c.en;
}
export function getProjectCountInCategory(category) {
    const indices = categoryProjects[category] || [];
    return indices.length;
}

/* ---- Kategories-Ordnung (Definition des Shader-Color-Schemes) ---- */
/* Reihenfolge bestimmt die Register-Tabs, das Portal und das Hero-Carousel. */
const CATEGORY_ORDER = ['gamedev', 'coding', '3d', 'concept', 'sound', 'other'];
export {
    CATEGORY_ORDER
};

/* ---- Mapping Kategorie -> Indizes in projects[] (mehrere Projekte pro Kategorie moeglich) ---- */
const categoryProjects = {
    gamedev: [0, 6],
    '3d':    [2],
    concept: [1],
    coding:  [3],
    sound:   [4],
    other:   [5]
};
export {
    categoryProjects
};

/* ---- Projekt-Daten ---- */
/* Hinweis: cover/image -> assets/Picture/ProjectX.png ist die Konvention aus STRUKTUR.md */
const projects = [

    /* Index 0 - Game Dev */ {
        category: 'gamedev',
        title: 'Unreal Tower Defense',
        subtitle: 'Tower Defense & Strategy in UE5',
        description: 'A tower defense game built in Unreal Engine 5. Combine strategic thinking with fast-paced action in a dark fantasy world. Build defenses, manage resources and survive waves of enemies.',
        cover: 'assets/Picture/Project1.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project1.png', thumb: 'assets/Picture/Project1.png' }
        ],
        contribution: [
            'Designed and implemented the core tower-defense gameplay loop',
            'Programmed enemy waves, resource economy and balancing',
            'Built level layouts and tower placement mechanics'
        ],
        tools: [
            { name: 'Unreal Engine 5', icon: 'bx-code-alt' },
            { name: 'Blueprints', icon: 'bx-edit' },
            { name: 'C++', icon: 'bx-code' }
        ]
    },

    /* Index 1 - Concept */ {
        category: 'concept',
        title: 'Dark Fantasy Character Design',
        subtitle: 'Concept Art & Character Design',
        description: 'A collection of dark fantasy character designs. From grim knights to mystical creatures, each piece tells its own story. Focused on atmosphere and narrative depth.',
        cover: 'assets/Picture/Project2.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project2.png', thumb: 'assets/Picture/Project2.png' }
        ],
        contribution: [
            'Full character design pipeline from rough sketch to final render',
            'Developed the dark-fantasy style and color palettes',
            'Produced anatomy and pose studies'
        ],
        tools: [
            { name: 'Photoshop', icon: 'bx-edit' },
            { name: 'Procreate', icon: 'bx-tablet' },
            { name: 'Clip Studio Paint', icon: 'bx-brush' }
        ]
    },

    /* Index 2 - 3D */ {
        category: '3d',
        title: 'Space Station',
        subtitle: 'Blender Animation & Modeling',
        description: 'An atmospheric 3D space scene capturing the solitude and beauty of deep space. Complex shader networks, volumetric fog and dynamic lighting create an immersive experience.',
        cover: 'assets/Picture/Project3.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project3.png', thumb: 'assets/Picture/Project3.png' }
        ],
        contribution: [
            'Modeled the space station and the asteroids',
            'Built the shader networks and lighting',
            'Animated the camera and volumetric effects'
        ],
        tools: [
            { name: 'Blender', icon: 'bx-cube' },
            { name: 'OctaneRender', icon: 'bx-palette' },
            { name: 'After Effects', icon: 'bx-video' }
                ]
    },

    /* Index 3 - Coding (PLACEHOLDER -> echtes Projekt einsetzen) */
    {
        category: 'coding',
        title: 'Coding Project',
        subtitle: 'Web & Interactive Development',
        description: 'TODO: Replace this placeholder with your real coding/interactive project. It is scaffolded so all 6 categories appear in the carousel, portal and modal tabs.',
        cover: 'assets/Picture/Project4.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project4.png', thumb: 'assets/Picture/Project4.png' }
        ],
        contribution: [],
        tools: []
    },

    /* Index 4 - Sound (PLACEHOLDER -> echtes Projekt einsetzen) */
    {
        category: 'sound',
        title: 'Sound Project',
        subtitle: 'Audio & Sound Design',
        description: 'TODO: Replace this placeholder with your real sound/audio project.',
        cover: 'assets/Picture/Project5.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project5.png', thumb: 'assets/Picture/Project5.png' }
        ],
        contribution: [],
        tools: []
    },

    /* Index 5 - Other (PLACEHOLDER -> echtes Projekt einsetzen) */
    {
        category: 'other',
        title: 'Other Project',
        subtitle: 'Other Projects',
        description: 'TODO: Replace this placeholder with your real other project.',
        cover: 'assets/Picture/Project6.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project6.png', thumb: 'assets/Picture/Project6.png' }
        ],
        contribution: [],
        tools: []
    },

    /* Index 6 - Game Dev (second project) */ {
        category: 'gamedev',
        title: 'Puzzle Prototype',
        subtitle: 'UE5 Puzzle Mechanics Prototype',
        description: 'A prototype exploring grid-based puzzle mechanics and player affordances in Unreal Engine 5. Built with Blueprints and C++, focusing on tight interaction feedback and clean rule systems.',
        cover: 'assets/Picture/Project7.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project7.png', thumb: 'assets/Picture/Project7.png' }
        ],
        contribution: [
            'Prototyped the core grid-locking and rule system in Blueprints',
            'Implemented player interaction and visual feedback (C++)',
            'Balanced puzzle pacing and difficulty progression'
        ],
        tools: [
            { name: 'Unreal Engine 5', icon: 'bx-code-alt' },
            { name: 'Blueprints', icon: 'bx-edit' },
            { name: 'C++', icon: 'bx-code' }
        ]
    }

    /*
     * Weitere Projekte nach diesem Muster anhaengen.
     * Dann den zugehoerigen Index in categoryProjects Kategorie-Array eintragen.
     */
];
export {
    projects
};

/* ---- Helper-Funktionen (werden vom Modal + Portal-Carousel verwendet) ---- */

/**
 * Liefert das Cover-/Titelbild eines Projekts (fuer Hero-Carousel + Portal).
 */
export function getProjectCover(index) {
    const p = projects[index];
    return (p && p.cover) ? p.cover : '';
}

/**
 * Liefert den thematischen Platzhalter-Pfad einer Kategorie.
 * Wird verwendet, wenn ein echtes Cover/Medium fehlt, damit alle
 * Blasen/Slides auf der Hauptseite und im Modal sichtbar bleiben.
 *
 * ACHTUNG: Es wird absichtlich EIN gemeinsamer, neutraler Platzhalter
 * fuer ALLE Kategorien zurueckgegeben (nicht ein kategorie-spezifisches
 * Icon/Text-Bild). So erscheinen alle 6 Karten im Hero-Carousel und im
 * Portal konsistent - bis echte Projekt-Screenshots vorhanden sind.
 */
export function getCategoryPlaceholder(category) {
    return 'assets/Picture/placeholders/project.svg';
}

/**
 * Haengt einen Bild-Fallback an ein <img>: Wenn das Laden fehlschlaegt
 * (z.B. fehlende Datei), wird das Kategorie-Platzhalter-Bild gesetzt.
 */
export function applyImageFallback(img, category) {
    if (!img) return;
    const placeholder = getCategoryPlaceholder(category);
    img.onerror = function () {
        if (this && this.src) {
            this.onerror = null;
            if (!this.src.endsWith(placeholder)) {
                this.src = placeholder;
            }
        }
    };
}


/**
 * Liefert die Indizes aller Projekte einer Kategorie (aus categoryProjects).
 */
export function getProjectIndicesByCategory(category) {
    return categoryProjects[category] || [];
}

/**
 * Liefert die Liste der Kategorien, die mindestens ein Projekt enthalten.
 * (Reihenfolge = canonicaler Color-Scheme-Index aus CATEGORY_ORDER)
 */
export function getCategories() {
    return CATEGORY_ORDER.filter(cat => getProjectCountInCategory(cat) > 0);
}

/**
 * Liefert den ersten Projekt-Index einer Kategorie (oder null).
 */
export function getFirstProjectOfCategory(category) {
    const indices = categoryProjects[category];
    if (!indices || !indices.length) return null;
    return indices[0];
}

/**
 * Liefert die Projekt-Indizes aller Kategorien in CATEGORY_ORDER-Reihenfolge,
 * pro Kategorie nur das ERSTE Projekt. Wird vom Portal- und Hero-Carousel genutzt,
 * damit beide die gleiche (eine) Karte je Bereich in identischer Reihenfolge zeigen.
 */
export function getOrderedProjectIndices() {
    return getCategories()
        .map(cat => getFirstProjectOfCategory(cat))
        .filter(idx => idx !== null && idx !== undefined);
}

/**
 * Wechsel zwischen Projekten DERS SELBEN Kategorie.
 * direction: 'prev' | 'next'  (wrap-around)
 * Gibt null zurueck, wenn die Kategorie nur ein Projekt hat.
 */
export function getSiblingProjectIndex(currentIndex, direction) {
    const project = projects[currentIndex];
    if (!project) return null;
    const indices = categoryProjects[project.category] || [];
    if (indices.length <= 1) return null;
    const pos = indices.indexOf(currentIndex);
    if (pos === -1) return null;
    const step = direction === 'next' ? 1 : -1;
    const next = (pos + step + indices.length) % indices.length;
    return indices[next];
}

/**
 * Wechsel zwischen Kategorien (wrap-around).
 * Wird zum ersten Projekt der angrenzenden Kategorie gewechselt.
 * direction: 'prev' | 'next'
 */
export function getAdjacentCategoryProject(currentIndex, direction) {
    const categories = getCategories();
    if (!categories.length) return null;
    const project = projects[currentIndex];
    let catIndex = project ? categories.indexOf(project.category) : -1;
    if (catIndex === -1) catIndex = 0;
    const step = direction === 'next' ? 1 : -1;
    const nextCatIndex = (catIndex + step + categories.length) % categories.length;
    const nextCat = categories[nextCatIndex];
    const indices = categoryProjects[nextCat] || [];
    if (!indices.length) return null;
    return indices[0];
}

/**
 * Farb-Schema-Index einer Kategorie fuer den Voronoi-Shadert.
 * Reihenfolge entspricht CATEGORY_ORDER (0=gamedev, 1=coding, 2=3d, 3=concept, 4=sound, 5=other).
 */
export function getCategorySchemeIndex(category) {
    return CATEGORY_ORDER.indexOf(category);
}
