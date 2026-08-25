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

/* ---- Bilingual-Helper: liefert den Wert eines { en, de }-Feldes in der
   gewuenschten Sprache (Fallback: 'en'). Skalare werden durchgereicht. ---- */
function pickLang(value, lang) {
    if (value && typeof value === 'object') {
        return value[lang] !== undefined ? value[lang] : value.en;
    }
    return value !== undefined && value !== null ? value : '';
}

/* ---- Exporte für das Modal ---- */
export { CATEGORY_LABELS };
export function getProjectTitle(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.title, lang);
}
export function getProjectSubtitle(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.subtitle, lang);
}
export function getProjectDescription(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.description, lang);
}
export function getProjectContribution(index, lang = 'en') {
    const p = projects[index];
    if (!p) return [];
    return pickLang(p.contribution, lang) || [];
}
export function getProjectGameConcept(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.gameConcept, lang);
}
export function getProjectDuration(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.duration, lang);
}
export function getProjectTeam(index, lang = 'en') {
    const p = projects[index];
    if (!p) return '';
    return pickLang(p.team, lang);
}
export function getProjectTools(index, lang = 'en') {
    const p = projects[index];
    if (!p || !Array.isArray(p.tools)) return [];
    return p.tools.map(t => ({ name: pickLang(t.name, lang), icon: t.icon || '' }));
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
    concept: [1, 8, 9],
    coding:  [3],
    sound:   [4],
    other:   [5, 7]
};
export {
    categoryProjects
};

/* ---- Projekt-Daten ---- */
/* Hinweis: cover/image -> assets/Picture/ProjectX.png ist die Konvention aus STRUKTUR.md */
const projects = [

    /* Index 0 - Game Dev */ {
        category: 'gamedev',
        title: { en: 'Unreal Tower Defense', de: 'Unreal Tower Defense' },
        subtitle: { en: 'Tower Defense & Strategy in UE5', de: 'Tower Defense & Strategie in UE5' },
        description: { en: 'A tower defense game built in Unreal Engine 5. Combine strategic thinking with fast-paced action in a dark fantasy world. Build defenses, manage resources and survive waves of enemies.', de: 'Ein Tower-Defense-Spiel entwickelt in Unreal Engine 5. Kombiniere strategisches Denken mit actionreichem Gameplay in einer düsteren Fantasy-Welt. Baue Verteidigungsanlagen, verwalte Ressourcen und überlebe Wellen von Gegnern.' },
        cover: 'assets/Picture/Project1.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project1.png', thumb: 'assets/Picture/Project1.png' }
        ],
        contribution: {
            en: [
                'Designed and implemented the core tower-defense gameplay loop',
                'Programmed enemy waves, resource economy and balancing',
                'Built level layouts and tower placement mechanics'
            ],
            de: [
                'Design & Implementierung des Tower-Defense-Gameplay-Loops',
                'Programmierung der Gegnerwellen, Ressourcenwirtschaft und des Balancings',
                'Erstellung der Level-Layouts und Turm-Platzierungs-Mechaniken'
            ]
        },
        tools: [
            { name: { en: 'Unreal Engine 5', de: 'Unreal Engine 5' }, icon: 'bx-code-alt' },
            { name: { en: 'Blueprints', de: 'Blueprints' }, icon: 'bx-edit' },
            { name: { en: 'C++', de: 'C++' }, icon: 'bx-code' }
        ]
    },

    /* Index 1 - Concept */ {
        category: 'concept',
        title: { en: 'Digital Art', de: 'Digital Art' },
        subtitle: { en: 'Digital Illustrations & Artworks', de: 'Digitale Illustrationen & Artworks' },
        description: { en: 'A collection of sketches created for game projects — logo concepts and character art developed during early design phases, exploring mood, silhouette and visual identity before moving into digital or physical prototyping.', de: 'Eine Sammlung von Skizzen für Spieleprojekte – Logo-Konzepte und Charakter-Artworks aus frühen Designphasen, die Stimmung, Silhouette und visuelle Identität erkunden, bevor es in das digitale oder physische Prototyping geht.' },
        cover: 'assets/2D_Art/2D_Digital/2D_IMG_1.png',
        media: [
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_1.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_2.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_2.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_3.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_3.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_4.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_4.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_5.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_5.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_6.jpg', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_6.jpg' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_7.png', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_7.png' }
        ],
        contribution: {
            en: [
                'Character and creature concept design',
                'Logo concept exploration',
                'Visual direction & style exploration'
            ],
            de: [
                'Charakter- & Kreaturen-Concept-Design',
                'Logo-Konzept-Erkundung',
                'Visuelle Richtung & Stilexploration'
            ]
        },
        tools: [
            { name: { en: 'Krita', de: 'Krita' }, icon: 'bx-edit' },
            { name: { en: 'Figma', de: 'Figma' }, icon: 'bx-layout' },
            { name: { en: 'Character Design', de: 'Charakterdesign' }, icon: 'bx-user' },
            { name: { en: 'Concept Art', de: 'Konzeptkunst' }, icon: 'bx-palette' },
            { name: { en: 'Logo Design', de: 'Logodesign' }, icon: 'bx-shape-square' }
        ]
    },

    /* Index 2 - 3D */ {
        category: '3d',
        title: { en: 'Space Station', de: 'Space Station' },
        subtitle: { en: 'Blender Animation & Modeling', de: 'Blender-Animation & Modeling' },
        description: { en: 'An atmospheric 3D space scene capturing the solitude and beauty of deep space. Complex shader networks, volumetric fog and dynamic lighting create an immersive experience.', de: 'Eine atmosphärische 3D-Weltraum-Szene, die die Einsamkeit und Schönheit des Weltraums einfängt. Komplexe Shader-Netzwerke, volumetrischer Nebel und dynamische Beleuchtung schaffen ein immersives Erlebnis.' },
        cover: 'assets/Picture/Project3.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project3.png', thumb: 'assets/Picture/Project3.png' }
        ],
        contribution: {
            en: [
                'Modeled the space station and the asteroids',
                'Built the shader networks and lighting',
                'Animated the camera and volumetric effects'
            ],
            de: [
                'Modeling der Raumstation und der Planetoiden',
                'Aufbau der Shader-Netzwerke und Beleuchtung',
                'Animation der Kamera und der volumetrischen Effekte'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'OctaneRender', de: 'OctaneRender' }, icon: 'bx-palette' },
            { name: { en: 'After Effects', de: 'After Effects' }, icon: 'bx-video' }
                ]
    },

    /* Index 3 - Coding (PLACEHOLDER -> echtes Projekt einsetzen) */
    {
        category: 'coding',
        title: { en: 'Coding Project', de: 'Coding Project' },
        subtitle: { en: 'Web & Interactive Development', de: 'Web & Interactive Development' },
        description: { en: 'TODO: Replace this placeholder with your real coding/interactive project. It is scaffolded so all 6 categories appear in the carousel, portal and modal tabs.', de: 'TODO: Replace this placeholder with your real coding/interactive project. It is scaffolded so all 6 categories appear in the carousel, portal and modal tabs.' },
        cover: 'assets/Picture/Project4.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project4.png', thumb: 'assets/Picture/Project4.png' }
        ],
        contribution: {
            en: [],
            de: []
        },
        tools: []
    },

    /* Index 4 - Sound (PLACEHOLDER -> echtes Projekt einsetzen) */
    {
        category: 'sound',
        title: { en: 'Sound Project', de: 'Sound Project' },
        subtitle: { en: 'Audio & Sound Design', de: 'Audio & Sound Design' },
        description: { en: 'TODO: Replace this placeholder with your real sound/audio project.', de: 'TODO: Replace this placeholder with your real sound/audio project.' },
        cover: 'assets/Picture/Project5.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project5.png', thumb: 'assets/Picture/Project5.png' }
        ],
        contribution: {
            en: [],
            de: []
        },
        tools: []
    },

    /* Index 5 - Other (Projekt 1 - Other_PJ_1) */
    {
        category: 'other',
        title: { en: 'Sea Team', de: 'Sea Team' },
        subtitle: { en: 'Asymmetric Cooperative Board Game', de: 'Asymmetrisches Kooperativ-Brettspiel' },
        description: { en: 'A five-week board game design project exploring asymmetric cooperation through deliberately limited information. Our team designed a physical tabletop game in which two players jointly navigate a submarine through a modular deep-sea labyrinth. Using color filter glasses, each player perceives different hazards on the same map, and only through careful communication can they interpret the environment correctly and survive. The project combined game mechanics design, dice-placement systems, and physical prototyping into one cohesive tabletop experience, packaged in a hand-engraved wooden box.', de: 'Ein fünfwöchiges Brettspiel-Designprojekt über asymmetrische Kooperation durch bewusst begrenzte Informationen. Unser Team entwarf ein physisches Tischspiel, bei dem zwei Spieler gemeinsam ein U-Boot durch ein modulares Tiefsee-Labyrinth navigieren. Mit Farbfilterbrillen nimmt jeder Spieler unterschiedliche Gefahren auf derselben Karte wahr, und nur durch sorgfältige Kommunikation können sie die Umgebung richtig deuten und überleben. Das Projekt kombinierte Spielmechanik-Design, Würfelplatzierungssysteme und physisches Prototyping zu einem kohärenten Tabletop-Erlebnis, verpackt in eine handgravierte Holzkiste.' },
        gameConcept: { en: 'The game explores deep-sea exploration through the lens of trust and incomplete knowledge. Two players share a submarine but see different obstacles (corals vs. pillars) on the same board due to their colored filters. Through dice-placement mechanics, they must coordinate movement, resource management (oxygen and fuel) and sonar scanning without revealing their exact dice values, retrieving three artifacts to reach the final level, Atlantis.', de: 'Das Spiel erkundet Tiefseeforschung durch die Brille von Vertrauen und unvollständigem Wissen. Zwei Spieler teilen sich ein U-Boot, sehen aufgrund ihrer Farbfilter jedoch unterschiedliche Hindernisse (Korallen vs. Säulen) auf demselben Spielfeld. Über Würfelplatzierungs-Mechaniken müssen sie Bewegung, Ressourcenmanagement (Sauerstoff und Treibstoff) und Sonar-Abtastung koordinieren, ohne ihre exakten Würfelwerte preiszugeben, und drei Artefakte bergen, um die letzte Ebene, Atlantis, zu erreichen.' },
        duration: { en: '5 weeks', de: '5 Wochen' },
        team: { en: '4 members', de: '4 Personen' },
        cover: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.jpg',
        media: [
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.jpg', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.jpg' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG2.png', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG2.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG3.png', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG3.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG4.png', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG4.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG5.png', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG5.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG6.jpeg', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG6.jpeg' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG8.png', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG8.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG9.jpeg', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG9.jpeg' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG1.jpeg', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG1.jpeg' }
        ],
        contribution: {
            en: [
                'Game mechanics & systems design',
                'Rulebook writing & iteration',
                'Playtesting & balancing',
                'Physical prototype development',
                'Wood engraving (box design)',
                'Concept & narrative development'
            ],
            de: [
                'Spielmechanik- & Systemdesign',
                'Regelbuch schreiben & Iteration',
                'Playtesting & Balancing',
                'Physische Prototypentwicklung',
                'Holzgravur (Boxdesign)',
                'Konzept- & Narrative-Entwicklung'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'Krita', de: 'Krita' }, icon: 'bx-edit' },
            { name: { en: 'Board Game Design', de: 'Brettspiel-Design' }, icon: 'bx-game' },
            { name: { en: 'Map & Tile Design', de: 'Karten- & Tile-Design' }, icon: 'bx-map' },
            { name: { en: 'Rulebook Writing', de: 'Regelbuch schreiben' }, icon: 'bx-book-open' },
            { name: { en: 'Playtesting', de: 'Playtesting' }, icon: 'bx-play-circle' }
        ]
    },

    /* Index 6 - Game Dev (second project) */ {
        category: 'gamedev',
        title: { en: 'Puzzle Prototype', de: 'Puzzle Prototype' },
        subtitle: { en: 'UE5 Puzzle Mechanics Prototype', de: 'UE5 Puzzle-Mechanik-Prototyp' },
        description: { en: 'A prototype exploring grid-based puzzle mechanics and player affordances in Unreal Engine 5. Built with Blueprints and C++, focusing on tight interaction feedback and clean rule systems.', de: 'Ein Prototyp zur Erkundung rasterbasierter Puzzle-Mechaniken und Player-Affordanzen in Unreal Engine 5. Mit Blueprints und C++ entwickelt, Fokus auf präzise Interaktions-Feedbacks und saubere Regelsysteme.' },
        cover: 'assets/Picture/Project7.png',
        media: [
            { type: 'image', src: 'assets/Picture/Project7.png', thumb: 'assets/Picture/Project7.png' }
        ],
        contribution: {
            en: [
                'Prototyped the core grid-locking and rule system in Blueprints',
                'Implemented player interaction and visual feedback (C++)',
                'Balanced puzzle pacing and difficulty progression'
            ],
            de: [
                'Prototypisierung des Kern-Gitter- und Regelsystems in Blueprints',
                'Implementierung der Spielerinteraktion und visueller Feedbacks (C++)',
                'Balancing von Puzzle-Pacing und Schwierigkeitskurve'
            ]
        },
        tools: [
            { name: { en: 'Unreal Engine 5', de: 'Unreal Engine 5' }, icon: 'bx-code-alt' },
            { name: { en: 'Blueprints', de: 'Blueprints' }, icon: 'bx-edit' },
            { name: { en: 'C++', de: 'C++' }, icon: 'bx-code' }
        ]
    },

    /* Index 7 - Other (Projekt 2 - Other_PJ_2) */
    {
        category: 'other',
        title: { en: "Sir Aric's Souls", de: "Sir Aric's Souls" },
        subtitle: { en: '', de: '' },
        description: { en: 'A seven-week UX project exploring the theme of contrast through a hybrid jump-and-run game. Our team designed both a digital and physical game experience, using black and white as the central visual and gameplay concept.\n\nThe digital prototype was created in Figma, while the physical version was built as an interactive paper prototype with custom controls, a ball and a projected game environment. The project focused on combining game mechanics, interaction design and physical interaction into one cohesive experience.', de: 'Ein siebenwöchiges UX-Projekt, das das Thema Kontrast durch ein hybrides Jump-and-Run-Spiel erkundet. Unser Team entwarf sowohl ein digitales als auch ein physisches Spielerlebnis, wobei Schwarz und Weiß das zentrale visuelle und gameplayliche Konzept bilden.\n\nDer digitale Prototyp entstand in Figma, die physische Version wurde als interaktiver Papier-Prototyp mit eigenen Steuerungen, einem Ball und einer projizierten Spielumgebung gebaut. Das Projekt fokussierte auf die Verbindung von Spielmechanik, Interaktionsdesign und physischer Interaktion zu einem kohärenten Erlebnis.' },
        gameConcept: { en: 'The game explores a world built around the contrast between black and white. The player must navigate through changing environments, using movement, timing and the interaction between both sides to overcome obstacles and reach the end of the level.', de: 'Das Spiel erkundet eine Welt, die um den Kontrast zwischen Schwarz und Weiß gebaut ist. Der Spieler muss sich durch wechselnde Umgebungen navigieren und dabei Bewegung, Timing und die Wechselwirkung beider Seiten nutzen, um Hindernisse zu überwinden und das Ende des Levels zu erreichen.' },
        duration: { en: '7 weeks', de: '7 Wochen' },
        team: { en: '5 members', de: '5 Mitglieder' },
        cover: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.png',
        media: [
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.png', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG2.png', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG2.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG3.png', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG3.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG4.jpg', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG4.jpg' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG5.jpg', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG5.jpg' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG6.jpg', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG6.jpg' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG7.jpg', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG7.jpg' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG8.png', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG8.png' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG9.png', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG9.png' },
            { type: 'video', src: 'assets/Other/Other_PJ_2/Other_Projekt2_V1.mp4', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.png' }
        ],
        contribution: {
            en: [
                'Game mechanics & interaction design',
                'Digital implementation in Figma',
                'Character design',
                'Physical prototype development',
                'Story & concept development'
            ],
            de: [
                'Spielmechanik- & Interaktionsdesign',
                'Digitale Umsetzung in Figma',
                'Charakterdesign',
                'Physische Prototypentwicklung',
                'Story- & Konzeptentwicklung'
            ]
        },
        tools: [
            { name: { en: 'Krita', de: 'Krita' }, icon: 'bx-edit' },
            { name: { en: 'Figma', de: 'Figma' }, icon: 'bx-layout' },
            { name: { en: 'DaVinci Resolve', de: 'DaVinci Resolve' }, icon: 'bx-video' }
        ]
    },

    /* Index 8 - Concept (2D_Draw) */
    {
        category: 'concept',
        title: { en: 'Drawing', de: 'Drawing' },
        subtitle: { en: 'Traditional Pencil Sketches', de: 'Traditionelle Bleistiftskizzen' },
        description: { en: "A collection of traditional pencil sketches exploring creature and character design through different poses and anatomy. Each drawing focuses on form, proportion and dynamic posing.", de: "Eine Sammlung traditioneller Bleistiftskizzen, die Kreatur- und Charakterdesign durch verschiedene Posen und Anatomie erkunden. Jede Zeichnung konzentriert sich auf Form, Proportion und dynamische Haltung." },
        cover: 'assets/2D_Art/2D_Draw/2D_Draw_1.png',
        media: [
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_1.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_1.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_2.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_2.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_3.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_3.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_4.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_4.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_5.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_5.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_6.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_6.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_7.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_7.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_8.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_8.png' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_9.png', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_9.png' }
        ],
        contribution: {
            en: [
                'Character and creature pose studies',
                'Anatomy and proportion exploration',
                'Shading and line work'
            ],
            de: [
                'Posenstudien von Charakteren und Kreaturen',
                'Erkundung von Anatomie und Proportion',
                'Schattierung und Linienführung'
            ]
        },
        tools: [
            { name: { en: 'Pencil & Paper', de: 'Bleistift & Papier' }, icon: 'bx-pencil' },
            { name: { en: 'Character Design', de: 'Charakterdesign' }, icon: 'bx-user' },
            { name: { en: 'Anatomy Studies', de: 'Anatomiestudien' }, icon: 'bx-brush' }
        ]
    },

    /* Index 9 - Concept (2D_VID) */
    {
        category: 'concept',
        title: { en: '2D Animation', de: '2D Animation' },
        subtitle: { en: 'Hand-drawn 2D Animation Sequences', de: 'Handgezeichnete 2D-Animationen' },
        description: { en: "A collection of hand-drawn 2D animation sequences. Frame-by-frame loops and short scenes exploring movement, timing and character acting in a stylized look.", de: "Eine Sammlung handgezeichneter 2D-Animationssequenzen. Frame-by-Frame-Loops und kurze Szenen, die Bewegung, Timing und Character Acting in einem stilisierten Look erkunden." },
        cover: 'assets/2D_Art/2D_Digital/2D_IMG_1.png',
        media: [
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_1.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_2.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_3.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_4.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_5.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_6.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_7.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.png' }
        ],
        contribution: {
            en: [
                'Frame-by-frame animation',
                'Walk cycle & the 12 principles of animation',
                'Keyframe & inbetween workflow',
                'Export & compositing of the final loops'
            ],
            de: [
                'Frame-by-Frame-Animation',
                'Walk Cycle & die 12 Prinzipien der Animation',
                'Keyframe- & Inbetween-Workflow',
                'Export & Compositing der finalen Loops'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' }
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

