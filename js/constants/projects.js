/**
 * File: projects.js
 * Description: Project data: bilingual titles/descriptions, categories, media lists, and project-skill relations.
 */
import { skills } from './skills.js?v=4';

/* ---- Category labels ---- */
const CATEGORY_LABELS = {
    gamedev: { en: 'Game Dev', de: 'Game Development' },
    '3d':    { en: '3D', de: '3D & Visual Art' },
    concept: { en: '2D & Concept Art', de: '2D & Concept Art' },
    coding:  { en: 'Coding', de: 'Coding & Web' },
    sound:   { en: 'Sound', de: 'Audio & Sound Design' },
    other:   { en: 'Other Projects', de: 'Other Projects' }
};

/* ---- Bilingual helper: returns the value of an { en, de } field in the
   requested language (fallback: 'en'). Scalars are passed through. ---- */
function pickLang(value, lang) {
    if (value && typeof value === 'object') {
        return value[lang] !== undefined ? value[lang] : value.en;
    }
    return value !== undefined && value !== null ? value : '';
}

/* ---- Accessors used by the modal ---- */
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

/* ---- Skill registry helpers (project <-> skill relation) ---- */
const SKILL_BY_ID = {};
skills.forEach(s => { SKILL_BY_ID[s.id] = s; });

/** Ids of the skills the project actually used */
export function getProjectSkillIds(index) {
    const p = projects[index];
    if (!p || !Array.isArray(p.skills)) return [];
    return p.skills;
}

/** Project skills resolved from the registry: [{ id, name, icon, logo }] */
export function getProjectSkills(index) {
    return getProjectSkillIds(index)
        .map(id => SKILL_BY_ID[id])
        .filter(Boolean)
        .map(s => ({ id: s.id, name: s.name, icon: s.icon || '', logo: s.logo || '' }));
}

/** (Lowercase) tool names already covered by the project's skills -
    prevents showing skills + tools twice in the modal. */
export function getProjectCoveredToolNames(index) {
    const covered = new Set();
    getProjectSkillIds(index).forEach(id => {
        const s = SKILL_BY_ID[id];
        if (s && Array.isArray(s.toolAliases)) {
            s.toolAliases.forEach(a => covered.add(a));
        }
    });
    return covered;
}
export function getProjectLinks(index, lang = 'en') {
    const p = projects[index];
    if (!p || !Array.isArray(p.links)) return [];
    return p.links
        .map(l => ({ label: l.label ? pickLang(l.label, lang) : '', url: l.url || '' }))
        .filter(l => l.url);
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

/* ---- Category order (defines the shader color scheme) ---- */
/* The order determines the category tabs, the portal, and the hero carousel. */
const CATEGORY_ORDER = ['gamedev', 'coding', '3d', 'concept', 'sound', 'other'];
export {
    CATEGORY_ORDER
};

/* ---- Mapping category -> indices in projects[] (multiple projects per category possible) ---- */
const categoryProjects = {
    gamedev: [0, 6, 16, 17],
    '3d':    [2, 10, 11],
    concept: [1, 8, 9],
    coding:  [3, 14, 15],
    sound:   [4, 12, 13],
    other:   [5, 7]
};
export {
    categoryProjects
};

/* ---- Project data ---- */
/* Note: cover/image -> assets/Picture/ProjectX.png is the convention from STRUKTUR.md */
const projects = [

    /* Index 0 - Game Dev */ {
        category: 'gamedev',
        title: { en: 'Gothica Solaris', de: 'Gothica Solaris' },
        subtitle: { en: 'First-Person Roguelite Dungeon Crawler', de: 'First-Person-Roguelite-Dungeon-Crawler' },
        description: {
            en: 'Gothica Solaris is a first-person roguelite dungeon crawler set in a dark Victorian world where reality is slowly collapsing under the influence of a mysterious forbidden Book.\n\nPlayers take on the role of Victor, a bounty hunter searching for a missing loved one while exploring corrupted realms connected to the Book.\n\nThe game combines challenging first-person combat, exploration and permanent progression through a Risk-versus-Reward system centered around the Insanity Meter. As Insanity increases, enemies become more dangerous and the dungeon becomes increasingly unstable, while also revealing hidden paths, events and valuable rewards.\n\nPlayers must decide how far they are willing to push their run before extracting and potentially losing unsecured resources.',
            de: 'Gothica Solaris ist ein First-Person-Roguelite-Dungeon-Crawler in einer düsteren viktorianischen Welt, in der die Realität unter dem Einfluss eines mysteriösen, verbotenen Buchs langsam zerfällt.\n\nDie Spieler schlüpfen in die Rolle von Victor, einem Kopfgeldjäger, der eine vermisste geliebte Person sucht und dabei korrupte Bereiche erkundet, die mit dem Buch verbunden sind.\n\nDas Spiel kombiniert anspruchsvollen First-Person-Combat, Erkundung und permanente Progression durch ein Risk-versus-Reward-System rund um die Insanity-Anzeige. Mit steigender Insanity werden Gegner gefährlicher und der Dungeon zunehmend instabiler – es öffnen sich dabei auch versteckte Pfade, Events und wertvolle Belohnungen.\n\nDie Spieler entscheiden selbst, wie weit sie ihren Run treiben, bevor sie sich zurückziehen und möglicherweise nicht gesicherte Ressourcen verlieren.'
        },
        gameConcept: {
            en: 'A dark first-person dungeon crawler built around exploration, risk-versus-reward decisions and player-driven build creation.\n\nPlayers collect Pages, currencies and upgrades while combining weapons, abilities and Socket upgrades to create different playstyles across multiple runs.\n\nThe core gameplay is built around the Insanity System. Increasing Insanity makes the dungeon more dangerous, but also provides access to greater rewards, hidden areas and special events.',
            de: 'Ein düsterer First-Person-Dungeon-Crawler rund um Erkundung, Risiko-versus-Belohnung-Entscheidungen und spielergetriebene Build-Erstellung.\n\nSpieler sammeln Pages, Währungen und Upgrades und kombinieren Waffen, Fähigkeiten und Socket-Upgrades zu unterschiedlichen Spielstilen über mehrere Runs hinweg.\n\nDas Kern-Gameplay basiert auf dem Insanity-System: Steigende Insanity macht den Dungeon gefährlicher, eröffnet aber zugleich Zugang zu größeren Belohnungen, versteckten Bereichen und besonderen Events.'
        },
        duration: { en: '6 weeks', de: '6 Wochen' },
        team: { en: '4 members', de: '4 Mitglieder' },
        cover: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_1.webp',
        /* Show the full cover uncropped -> the gothica-solaris wordmark in the
           original screenshot stays fully readable. The card's image layout
           (91% x 72.5%, nearly landscape) matches the original. */
        coverFit: 'contain',
        media: [
            { type: 'youtube', id: 'Ck4srNe2HZo', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_1.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_1.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_1.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_2.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_3.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_3.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_4.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_4.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_5.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_5.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_6.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_6.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_7.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_7.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_8.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_8.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_9.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_9.webp' },
            { type: 'image', src: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_10.webp', thumb: 'assets/Game_Dev/Gothica_Solaris/G_D_GS_10.webp' }
        ],
        contribution: {
            en: [
                { group: 'Gameplay & Systems', items: [
                    'Component-based gameplay systems',
                    'Inventory, Loot, Insanity and Currency systems',
                    'AI and combat implementation'
                ] },
                { group: 'Level Design', items: [
                    'Dungeon layout, exploration paths and secret areas',
                    'Gameplay triggers and environment integration'
                ] },
                { group: '3D Art', items: [
                    'Weapons, enemies and environmental props',
                    'Textures, materials, rigging and animation'
                ] },
                { group: 'Game Design & Documentation', items: [
                    'Core gameplay loop and Insanity System',
                    'Story, world and enemy concepts',
                    'GDD and development documentation'
                ] }
            ],
            de: [
                { group: 'Gameplay & Systeme', items: [
                    'Komponentenbasierte Gameplay-Systeme',
                    'Inventar-, Loot-, Insanity- und Währungssystem',
                    'KI- und Kampf-Implementierung'
                ] },
                { group: 'Level Design', items: [
                    'Dungeon-Layout, Erkundungspfade und Geheimbereiche',
                    'Gameplay-Trigger und Umgebungsintegration'
                ] },
                { group: '3D Art', items: [
                    'Waffen, Gegner und Umgebungsprops',
                    'Texturen, Materialien, Rigging und Animation'
                ] },
                { group: 'Game Design & Dokumentation', items: [
                    'Kern-Gameplay-Loop und Insanity-System',
                    'Story-, Welt- und Gegnerkonzepte',
                    'GDD und Entwicklerdokumentation'
                ] }
            ]
        },
        tools: [
            { name: { en: 'Godot', de: 'Godot' }, icon: 'bx-game' },
            { name: { en: 'C#', de: 'C#' }, icon: 'bx-code' },
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'Ableton Live', de: 'Ableton Live' }, icon: 'bx-music' },
            { name: { en: 'FMOD', de: 'FMOD' }, icon: 'bx-headphone' }
        ],
        skills: ['godot', 'csharp', 'blender', 'fmod'],
        links: [
            { label: { en: 'GitHub Repository', de: 'GitHub-Repository' }, url: 'https://github.com/PascalHaegele/Project3' }
        ]
    },

    /* Index 1 - Concept */ {
        category: 'concept',
        title: { en: 'Digital Art', de: 'Digital Art' },
        subtitle: { en: 'Digital Illustrations & Artworks', de: 'Digitale Illustrationen & Artworks' },
        description: { en: 'A collection of sketches created for game projects — logo concepts and character art developed during early design phases, exploring mood, silhouette and visual identity before moving into digital or physical prototyping.', de: 'Eine Sammlung von Skizzen für Spieleprojekte – Logo-Konzepte und Charakter-Artworks aus frühen Designphasen, die Stimmung, Silhouette und visuelle Identität erkunden, bevor es in das digitale oder physische Prototyping geht.' },
        cover: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp',
        media: [
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_2.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_2.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_3.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_3.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_4.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_4.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_5.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_5.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_6.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_6.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Digital/2D_IMG_7.webp', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_7.webp' }
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
        ],
        skills: ['krita']
    },

    /* Index 2 - 3D (3D Modeling) */ {
        category: '3d',
        title: { en: '3D Modeling', de: '3D Modeling' },
        subtitle: { en: 'Comprehensive 3D Work in Blender', de: 'Umfassende 3D-Arbeiten in Blender' },
        description: { en: 'Comprehensive 3D work done in Blender, covering everything from high-to-low poly modeling and digital sculpting to detailed texturing and normal map workflows. Focused on creating clean, efficient assets.', de: 'Umfassende 3D-Arbeiten in Blender – von High- zu Low-Poly-Modellierung und digitalem Sculpting bis hin zu detaillierter Texturierung und Normal-Map-Workflows. Der Fokus liegt auf sauberen, effizienten Assets.' },
        cover: 'assets/3D/3D_IMG/3D_IMG_1.webp',
        media: [
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_1.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_2.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_2.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_3.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_3.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_4.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_4.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_5.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_5.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_6.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_6.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_7.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_7.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_8.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_8.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_9.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_9.webp' },
            { type: 'image', src: 'assets/3D/3D_IMG/3D_IMG_10.webp', thumb: 'assets/3D/3D_IMG/3D_IMG_10.webp' }
        ],
        contribution: {
            en: [
                'Hard-surface / organic modeling & sculpting',
                'UV unwrapping and layout optimization',
                'Texturing, shading, and normal map baking',
                'Preparing clean, game-ready assets'
            ],
            de: [
                'Hard-Surface-/Organic-Modeling & Sculpting',
                'UV-Unwrapping und Layout-Optimierung',
                'Texturierung, Shading und Normal-Map-Baking',
                'Aufbereitung sauberer, game-ready Assets'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' }
        ],
        skills: ['blender']
    },

    /* Index 3 - Coding (project 1 - Physics & Shader) */
    {
        category: 'coding',
        title: { en: 'Coding: Physics & Shader', de: 'Coding: Physik & Shader' },
        subtitle: { en: 'Playable Physics Games & WebGL Water Shader', de: 'Spielbare Physik-Spiele & WebGL-Wasser-Shader' },
        description: { en: 'A playable collection of browser-based physics experiments plus a WebGL 2.0 water shader. Includes Cannonball (aim & power a shot, tune ball size and bounciness, gravity flip and slow motion), Spring (a procedurally-physics-driven tentacle game with targets, mutations and a neural-link lives system), Billiard (drag-to-aim shots with a red power meter and pocket scoring) and Pinball (flippers, multi-ball green zones and locally saved high-scores).', de: 'Eine spielbare Sammlung browserbasierter Physik-Experimente plus ein WebGL-2.0-Wasser-Shader. Darunter Cannonball (Ausrichten & Kraft einstellen, Ballgröße und Federung, Schwerkraft-Umkehr und Zeitlupe), Spring (ein physikgetriebenes Tentakel-Spiel mit Zielen, Mutationen und einem Neural-Link-Lebenssystem), Billiard (Ziel-Ziehen & Abfeuern mit Kraft-Messer und Pocket-Scoring) und Pinball (Flipper, Multi-Ball-Zonen und lokal gespeicherte Highscores).' },
        links: [
            { label: { en: 'Cannonball – Play', de: 'Cannonball – Spielen' }, url: 'https://davidz1407.github.io/Stem2_Code/Cannonball/index.html' },
            { label: { en: 'Spring Game – Play', de: 'Spring Game – Spielen' }, url: 'https://davidz1407.github.io/Stem2_Code/Spring/index.html' },
            { label: { en: 'Billiard – Play', de: 'Billiard – Spielen' }, url: 'https://davidz1407.github.io/Stem2_Code/Billiard/index.html' },
            { label: { en: 'Pinball – Play', de: 'Pinball – Spielen' }, url: 'https://davidz1407.github.io/Stem2_Code/Pinball/index.html' },
            { label: { en: 'WebGL Water Shader – Play', de: 'WebGL-Wasser-Shader – Ansehen' }, url: 'https://davidz1407.github.io/Stem2_Code/Shader_OpenGL/index.html' },
            { label: { en: 'GitHub Repository', de: 'GitHub Repository' }, url: 'https://github.com/DavidZ1407/Stem2_Code' }
        ],
        cover: 'assets/Coding_Web/Coding_Physics/C_W_Physics_3.webp',
        media: [
            { type: 'image', src: 'assets/Coding_Web/Coding_Physics/C_W_Physics_1.webp', thumb: 'assets/Coding_Web/Coding_Physics/C_W_Physics_1.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Physics/C_W_Physics_2.webp', thumb: 'assets/Coding_Web/Coding_Physics/C_W_Physics_2.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Physics/C_W_Physics_3.webp', thumb: 'assets/Coding_Web/Coding_Physics/C_W_Physics_3.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Physics/C_W_Physics_4.webp', thumb: 'assets/Coding_Web/Coding_Physics/C_W_Physics_4.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Physics/C_W_Physics_5.webp', thumb: 'assets/Coding_Web/Coding_Physics/C_W_Physics_5.webp' }
        ],
        contribution: {
            en: [
                'WebGL & shader programming',
                'Physics simulation logic',
                'Interactive UI controls'
            ],
            de: [
                'WebGL- & Shader-Programmierung',
                'Physik-Simulationslogik',
                'Interaktive UI-Steuerungselemente'
            ]
        },
        tools: [
            { name: { en: 'JavaScript', de: 'JavaScript' }, icon: 'bxl-javascript' },
            { name: { en: 'WebGL', de: 'WebGL' }, icon: 'bx-code-block' },
            { name: { en: 'HTML/CSS', de: 'HTML/CSS' }, icon: 'bxl-html5' }
        ],
        skills: ['web', 'webgl']
    },

    /* Index 4 - Sound (project 1 - Space_Balls) */
    {
        category: 'sound',
        title: { en: 'Space Balls', de: 'Space Balls' },
        subtitle: { en: 'Sci-Fi Rhythm Game – Sound Design & Audio Integration', de: 'Sci-Fi-Rhythmusspiel – Sounddesign & Audio-Integration' },
        description: { en: 'An exciting sci-fi rhythm game developed in the Godot Engine (C#). The project focused entirely on sound design: all sound effects were created from scratch in Ableton Live — from futuristic sci-fi weapons, drives and UI elements to crisp rhythm cues — and independently integrated into Godot via C#, perfectly synchronized with the gameplay and the rhythm of the game. Final video editing & sync realized with DaVinci Resolve.', de: 'Ein aufregendes Sci-Fi-Rhythmusspiel, entwickelt in der Godot Engine (C#). Das Projekt legte den Fokus komplett auf Sounddesign: Alle Soundeffekte entstanden von Grund auf in Ableton Live – von futuristischen Sci-Fi-Waffen, Antrieben und UI-Elementen bis hin zu knackigen Rhythmus-Cues – und wurden eigenständig per C# in Godot integriert, perfekt synchron zu Gameplay und Rhythmus des Spiels. Videoschnitt & Sync final umgesetzt mit DaVinci Resolve.' },
        gameConcept: { en: 'Two players each control a ball ("Odd Balls"), charging a power meter to the beat by rhythmically shaking their controller. Once the meter is full, players can shoot and destroy UFOs.', de: 'Zwei Spieler steuern jeweils einen Ball ("Odd Balls") und laden einen Energie-Balken im Takt auf, indem sie ihren Controller rhythmisch schütteln. Ist der Balken voll, können die Spieler UFOs abschießen und zerstören.' },
        duration: { en: '2 weeks', de: '2 Wochen' },
        cover: 'assets/Sound/Space_Balls/Sound_2.webp',
        media: [
            { type: 'video', src: 'assets/Sound/Space_Balls/Sound_1.mp4', thumb: 'assets/Sound/Space_Balls/Sound_2.webp' },
            { type: 'image', src: 'assets/Sound/Space_Balls/Sound_2.webp', thumb: 'assets/Sound/Space_Balls/Sound_2.webp' },
            { type: 'image', src: 'assets/Sound/Space_Balls/Sound_3.webp', thumb: 'assets/Sound/Space_Balls/Sound_3.webp' }
        ],
        contribution: {
            en: [
                'Complete sound design & creation of all audio assets from scratch in Ableton Live',
                'Programming & integration of sounds in Godot via C#',
                'Rhythm & timing coordination for the special two-player gameplay',
                'Video editing & sync (realized with DaVinci Resolve)'
            ],
            de: [
                'Komplettes Sounddesign & Erstellung aller Audio-Assets von Grund auf in Ableton Live',
                'Programmierung & Integration der Sounds in Godot per C#',
                'Rhythmus- & Timing-Koordination für das besondere Zwei-Spieler-Gameplay',
                'Videoschnitt & Sync (umgesetzt mit DaVinci Resolve)'
            ]
        },
        tools: [
            { name: { en: 'Sound Design', de: 'Sounddesign' }, icon: 'bx-volume-full' },
            { name: { en: 'Godot Engine (C#)', de: 'Godot Engine (C#)' }, icon: 'bx-code-alt' },
            { name: { en: 'Ableton Live', de: 'Ableton Live' }, icon: 'bx-music' },
            { name: { en: 'FMOD', de: 'FMOD' }, icon: 'bx-headphone' }
        ],
        skills: ['godot', 'csharp', 'fmod']
    },

    /* Index 5 - Other (project 1 - Other_PJ_1) */
    {
        category: 'other',
        title: { en: 'Sea Team', de: 'Sea Team' },
        subtitle: { en: 'Asymmetric Cooperative Board Game', de: 'Asymmetrisches Kooperativ-Brettspiel' },
        description: { en: 'A five-week board game design project exploring asymmetric cooperation through deliberately limited information. Our team designed a physical tabletop game in which two players jointly navigate a submarine through a modular deep-sea labyrinth. Using color filter glasses, each player perceives different hazards on the same map, and only through careful communication can they interpret the environment correctly and survive. The project combined game mechanics design, dice-placement systems, and physical prototyping into one cohesive tabletop experience, packaged in a hand-engraved wooden box.', de: 'Ein fünfwöchiges Brettspiel-Designprojekt über asymmetrische Kooperation durch bewusst begrenzte Informationen. Unser Team entwarf ein physisches Tischspiel, bei dem zwei Spieler gemeinsam ein U-Boot durch ein modulares Tiefsee-Labyrinth navigieren. Mit Farbfilterbrillen nimmt jeder Spieler unterschiedliche Gefahren auf derselben Karte wahr, und nur durch sorgfältige Kommunikation können sie die Umgebung richtig deuten und überleben. Das Projekt kombinierte Spielmechanik-Design, Würfelplatzierungssysteme und physisches Prototyping zu einem kohärenten Tabletop-Erlebnis, verpackt in eine handgravierte Holzkiste.' },
        gameConcept: { en: 'The game explores deep-sea exploration through the lens of trust and incomplete knowledge. Two players share a submarine but see different obstacles (corals vs. pillars) on the same board due to their colored filters. Through dice-placement mechanics, they must coordinate movement, resource management (oxygen and fuel) and sonar scanning without revealing their exact dice values, retrieving three artifacts to reach the final level, Atlantis.', de: 'Das Spiel erkundet Tiefseeforschung durch die Brille von Vertrauen und unvollständigem Wissen. Zwei Spieler teilen sich ein U-Boot, sehen aufgrund ihrer Farbfilter jedoch unterschiedliche Hindernisse (Korallen vs. Säulen) auf demselben Spielfeld. Über Würfelplatzierungs-Mechaniken müssen sie Bewegung, Ressourcenmanagement (Sauerstoff und Treibstoff) und Sonar-Abtastung koordinieren, ohne ihre exakten Würfelwerte preiszugeben, und drei Artefakte bergen, um die letzte Ebene, Atlantis, zu erreichen.' },
        duration: { en: '5 weeks', de: '5 Wochen' },
        team: { en: '4 members', de: '4 Personen' },
        cover: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.webp',
        media: [
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG7.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG2.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG2.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG3.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG3.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG4.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG4.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG5.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG5.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG6.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG6.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG8.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG8.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG9.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG9.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG1.webp', thumb: 'assets/Other/Other_PJ_1/Other_ProjektT_IMG1.webp' }
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
        ],
        skills: ['blender', 'krita']
    },

    /* Index 6 - Game Dev (second project) */ {
        category: 'gamedev',
        title: { en: 'Average Goblin Game', de: 'Average Goblin Game' },
        subtitle: { en: 'Third-Person Tower Defense Action (UE5)', de: 'Third-Person-Tower-Defense-Action (UE5)' },
        description: {
            en: 'A third-person tower defense action game developed in Unreal Engine 5. The story follows Manni Meh, a knight whose legendary party is attacked by the furious Goblin King Goober after being denied an invitation.\n\nPlayers must control Manni, defeat invading goblins to earn gold, build archer towers with the help of Manni\'s friends, and successfully defend the fortress gate across 10 intense waves.',
            de: 'Ein Third-Person-Tower-Defense-Actionspiel, entwickelt in der Unreal Engine 5. Die Geschichte folgt Manni Meh, einem Ritter, dessen legendäre Party vom wütenden Goblinkönig Goober angegriffen wird, nachdem man ihm eine Einladung verweigert hat.\n\nDie Spieler steuern Manni, besiegen einfallende Goblins, um Gold zu verdienen, bauen mit Hilfe von Mannis Freunden Bogentürme und verteidigen das Festungstor über 10 intensive Wellen hinweg.'
        },
        gameConcept: {
            en: 'A balanced mix of action gameplay and strategic tower defense, designed around a self-created Game Design Document (GDD). Instead of passively watching defenses, players actively fight alongside their archer towers, combining direct combat with smart resource management.\n\nDefeated goblins drop gold that is used to build and place new defensive towers — each one costs 100 gold, making every kill and every investment a meaningful decision. With each successfully defended wave, more and stronger goblins attack, resulting in a steady rise in difficulty that keeps the action intense from start to finish.',
            de: 'Eine ausgewogene Mischung aus Action-Gameplay und strategischem Tower Defense, entworfen rund um ein selbst erstelltes Game Design Document (GDD). Statt passiv zuzusehen, kämpfen die Spieler aktiv Seite an Seite mit ihren Bogentürmen und verbinden direkten Kampf mit klugem Ressourcenmanagement.\n\nBesiegte Goblins lassen Gold fallen, mit dem neue Abwehrtürme gebaut und platziert werden – jeder Turm kostet 100 Gold, wodurch jeder Kill und jede Investition zu einer bedeutsamen Entscheidung wird. Mit jeder erfolgreich verteidigten Welle greifen mehr und stärkere Goblins an, was für einen stetigen Schwierigkeitsanstieg sorgt, der die Action von Anfang bis Ende intensiv hält.'
        },
        duration: { en: '2 weeks', de: '2 Wochen' },
        team: { en: '5 members', de: '5 Mitglieder' },
        cover: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_1.webp',
        media: [
            { type: 'youtube', id: 'eomk8vSr40o', start: 95, thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_1.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_1.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_1.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_2.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_3.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_3.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_4.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_4.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_5.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_5.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_6.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_6.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_7.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_7.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_8.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_8.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_9.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_9.webp' },
            { type: 'image', src: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_10.webp', thumb: 'assets/Game_Dev/Another_Goblin_Game/G_D_AGG_10.webp' }
        ],
        contribution: {
            en: [
                'Concept development and game design',
                'Enemy AI & Animation implementation',
                'Tower mechanics and balancing',
                'Core game mechanics & overall balancing',
                'Sound design and audio integration'
            ],
            de: [
                'Konzeptentwicklung und Game Design',
                'Gegner-KI & Animations-Umsetzung',
                'Turm-Mechaniken und Balancing',
                'Kern-Spielmechaniken und Gesamt-Balancing',
                'Sounddesign und Audio-Integration'
            ]
        },
        tools: [
            { name: { en: 'Unreal Engine 5', de: 'Unreal Engine 5' }, icon: 'bx-game' }
        ],
        skills: ['unreal']
    },

    /* Index 7 - Other (project 2 - Other_PJ_2) */
    {
        category: 'other',
        title: { en: "Sir Aric's Souls", de: "Sir Aric's Souls" },
        subtitle: { en: '', de: '' },
        description: { en: 'A seven-week UX project exploring the theme of contrast through a hybrid jump-and-run game. Our team designed both a digital and physical game experience, using black and white as the central visual and gameplay concept.\n\nThe digital prototype was created in Figma, while the physical version was built as an interactive paper prototype with custom controls, a ball and a projected game environment. The project focused on combining game mechanics, interaction design and physical interaction into one cohesive experience.', de: 'Ein siebenwöchiges UX-Projekt, das das Thema Kontrast durch ein hybrides Jump-and-Run-Spiel erkundet. Unser Team entwarf sowohl ein digitales als auch ein physisches Spielerlebnis, wobei Schwarz und Weiß das zentrale visuelle und gameplayliche Konzept bilden.\n\nDer digitale Prototyp entstand in Figma, die physische Version wurde als interaktiver Papier-Prototyp mit eigenen Steuerungen, einem Ball und einer projizierten Spielumgebung gebaut. Das Projekt fokussierte auf die Verbindung von Spielmechanik, Interaktionsdesign und physischer Interaktion zu einem kohärenten Erlebnis.' },
        gameConcept: { en: 'The game explores a world built around the contrast between black and white. The player must navigate through changing environments, using movement, timing and the interaction between both sides to overcome obstacles and reach the end of the level.', de: 'Das Spiel erkundet eine Welt, die um den Kontrast zwischen Schwarz und Weiß gebaut ist. Der Spieler muss sich durch wechselnde Umgebungen navigieren und dabei Bewegung, Timing und die Wechselwirkung beider Seiten nutzen, um Hindernisse zu überwinden und das Ende des Levels zu erreichen.' },
        duration: { en: '7 weeks', de: '7 Wochen' },
        team: { en: '5 members', de: '5 Mitglieder' },
        cover: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.webp',
        media: [
            { type: 'video', src: 'assets/Other/Other_PJ_2/Other_Projekt2_V1.mp4', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG1.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG2.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG2.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG3.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG3.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG4.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG4.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG5.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG5.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG6.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG6.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG7.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG7.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG8.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG8.webp' },
            { type: 'image', src: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG9.webp', thumb: 'assets/Other/Other_PJ_2/Other_Projekt2_IMG9.webp' }
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
        ],
        skills: ['krita']
    },

    /* Index 8 - Concept (2D_Draw) */
    {
        category: 'concept',
        title: { en: 'Drawing', de: 'Drawing' },
        subtitle: { en: 'Traditional Pencil Sketches', de: 'Traditionelle Bleistiftskizzen' },
        description: { en: "A collection of traditional pencil sketches exploring creature and character design through different poses and anatomy. Each drawing focuses on form, proportion and dynamic posing.", de: "Eine Sammlung traditioneller Bleistiftskizzen, die Kreatur- und Charakterdesign durch verschiedene Posen und Anatomie erkunden. Jede Zeichnung konzentriert sich auf Form, Proportion und dynamische Haltung." },
        cover: 'assets/2D_Art/2D_Draw/2D_Draw_1.webp',
        media: [
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_1.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_1.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_2.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_2.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_3.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_3.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_4.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_4.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_5.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_5.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_6.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_6.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_7.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_7.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_8.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_8.webp' },
            { type: 'image', src: 'assets/2D_Art/2D_Draw/2D_Draw_9.webp', thumb: 'assets/2D_Art/2D_Draw/2D_Draw_9.webp' }
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
        ],
        /* No registry skill: traditional pencil sketches */
        skills: []
    },

    /* Index 9 - Concept (2D_VID) */
    {
        category: 'concept',
        title: { en: '2D Animation', de: '2D Animation' },
        subtitle: { en: 'Hand-drawn 2D Animation Sequences', de: 'Handgezeichnete 2D-Animationen' },
        description: { en: "A collection of hand-drawn 2D animation sequences. Frame-by-frame loops and short scenes exploring movement, timing and character acting in a stylized look.", de: "Eine Sammlung handgezeichneter 2D-Animationssequenzen. Frame-by-Frame-Loops und kurze Szenen, die Bewegung, Timing und Character Acting in einem stilisierten Look erkunden." },
        cover: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp',
        media: [
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_1.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_2.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_3.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_4.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_5.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_6.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' },
            { type: 'video', src: 'assets/2D_Art/2D_VID/2D_VID_7.mp4', thumb: 'assets/2D_Art/2D_Digital/2D_IMG_1.webp' }
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
        ],
        skills: ['blender']
    },

    /* Index 10 - 3D (3D_VID) */
    {
        category: '3d',
        title: { en: '3D Animation', de: '3D Animation' },
        subtitle: { en: 'In-engine 3D Animation & Mechanics', de: '3D-Animationen & Gameplay-Mechaniken' },
        description: { en: '3D animations developed in Blender and implemented within the Godot game engine to drive interactive gameplay mechanics, including character actions and facial animations.', de: 'In Blender entwickelte 3D-Animationen, die in der Godot-Spielengine umgesetzt wurden, um interaktive Gameplay-Mechaniken anzutreiben – einschließlich Charakteraktionen und Gesichtsanimationen.' },
        cover: 'assets/3D/3D_IMG/3D_IMG_1.webp',
        media: [
            { type: 'video', src: 'assets/3D/3D_VID/3D_VID_1.mp4', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' },
            { type: 'video', src: 'assets/3D/3D_VID/3D_VID_2.mp4', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' },
            { type: 'video', src: 'assets/3D/3D_VID/3D_VID_3.mp4', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' },
            { type: 'video', src: 'assets/3D/3D_VID/3D_VID_4.mp4', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' },
            { type: 'video', src: 'assets/3D/3D_VID/3D_VID_5.mp4', thumb: 'assets/3D/3D_IMG/3D_IMG_1.webp' }
        ],
        contribution: {
            en: [
                'Rigging and animating character/object assets in Blender',
                'Setting up animation trees and systems inside Godot',
                'Scripting and integrating gameplay mechanics tied to the animations',
                'Designing expressive facial animations for character interactions'
            ],
            de: [
                'Rigging und Animation von Charakter-/Objekt-Assets in Blender',
                'Einrichtung von Animations-Bäumen und -Systemen in Godot',
                'Skripting und Integration von an die Animationen gekoppelter Gameplay-Mechaniken',
                'Entwicklung ausdrucksstarker Gesichtsanimationen für Charakter-Interaktionen'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'Godot', de: 'Godot' }, icon: 'bx-code-alt' }
        ],
        skills: ['blender', 'godot']
    },

    /* Index 11 - 3D (3D_Pj) */
    {
        category: '3d',
        title: { en: 'Battle for the Stars', de: 'Battle for the Stars' },
        subtitle: { en: 'Four-Week Group Animation Production', de: 'Vierwöchige Gruppen-Animation' },
        description: { en: 'A 4-week team project taking an animation from initial concept and storyboard to final production in Blender. The project features a high-speed chase sequence traveling from outer space down into a canyon. To bridge the gap between virtual and real worlds, we seamlessly combined recorded live-action video footage with 3D animation.', de: 'Ein vierwöchiges Teamprojekt, das eine Animation vom ersten Konzept und Storyboard bis zur finalen Produktion in Blender entwickelte. Das Projekt zeigt eine Hochgeschwindigkeits-Verfolgungsjagd vom Weltraum hinunter in einen Canyon. Um die Brücke zwischen virtueller und realer Welt zu schlagen, kombinierten wir aufgenommenes Realfilm-Material nahtlos mit 3D-Animation.' },
        gameConcept: { en: "A chased spaceship navigates through outer space, featuring a real-life actor integrated directly into the animated scene.", de: "Ein gejagtes Raumschiff navigiert durch den Weltraum, mit einem echten Schauspieler, der direkt in die animierte Szene integriert ist." },
        duration: { en: '4 weeks', de: '4 Wochen' },
        team: { en: '4 members', de: '4 Mitglieder' },
        cover: 'assets/3D/3D_Pj/3D_PJ_2.webp',
        media: [
            { type: 'video', src: 'assets/3D/3D_Pj/3D_PJ_1.mp4', thumb: 'assets/3D/3D_Pj/3D_PJ_2.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_2.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_2.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_3.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_3.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_4.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_4.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_5.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_5.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_6.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_6.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_7.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_7.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_8.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_8.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_9.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_9.webp' },
            { type: 'image', src: 'assets/3D/3D_Pj/3D_PJ_10.webp', thumb: 'assets/3D/3D_Pj/3D_PJ_10.webp' }
        ],
        contribution: {
            en: [
                'Spaceship modeling and asset creation',
                'Animation scene design and layout',
                'Concept development and storyboard',
                'Acting / live-action integration'
            ],
            de: [
                'Raumschiff-Modellierung und Asset-Erstellung',
                'Animations-Design und Layout',
                'Konzeptentwicklung und Storyboard',
                'Schauspielerei / Live-Action-Integration'
            ]
        },
        tools: [
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'DaVinci Resolve', de: 'DaVinci Resolve' }, icon: 'bx-video' }
        ],
        skills: ['blender']
    },

    /* Index 12 - Sound (project 2 - Glow_Pods) */
    {
        category: 'sound',
        title: { en: 'Glow Pods', de: 'Glow Pods' },
        subtitle: { en: 'Atmospheric 3D Game – Environmental Audio & Immersion', de: 'Atmosphärisches 3D-Spiel – Umgebungsaudio & Immersion' },
        description: { en: 'An atmospheric 3D game set in a dark, icy world where players must collect glowing pods to illuminate and navigate their path. The goal was to give this small 3D world a distinct, immersive acoustic identity using Godot and Ableton Live: dynamic ambient soundscapes and realistic environmental audio tailored to each environment, organic effects, foley and echoing orb interactions that reinforce distance, scale and mystery.', de: 'Ein atmosphärisches 3D-Spiel in einer dunklen, eisigen Welt, in der Spieler leuchtende Pods einsammeln müssen, um ihren Weg zu beleuchten und zu finden. Das Ziel war es, dieser kleinen 3D-Welt mit Godot und Ableton Live eine eigenständige, immersive akustische Identität zu geben: dynamische Ambient-Klanglandschaften und realistisches Umgebungsaudio, zugeschnitten auf jede Umgebung, dazu organische Effekte, Foley und hallende Orb-Interaktionen, die Distanz, Größe und Geheimnis verstärken.' },
        gameConcept: { en: 'The world is divided into two contrasting environments: The Snow Field — vast, cold and isolated, shaped by ice crackling, wind and wide reverb — and The Cave — dark, enigmatic and enclosed, defined by water drips, abstract tones and deep hall reverb.', de: 'Die Welt ist in zwei kontrastierende Umgebungen geteilt: Das Schneefeld – weit, kalt und isoliert, geprägt von knisterndem Eis, Wind und weitem Hall – und Die Höhle – dunkel, rätselhaft und eng, definiert durch Wassertropfen, abstrakte Töne und tiefen Hallenklang.' },
        duration: { en: '2 weeks', de: '2 Wochen' },
        cover: 'assets/Sound/Glow_Pods/Sound_5.webp',
        media: [
            { type: 'video', src: 'assets/Sound/Glow_Pods/Sound_4.mp4', thumb: 'assets/Sound/Glow_Pods/Sound_5.webp' },
            { type: 'image', src: 'assets/Sound/Glow_Pods/Sound_5.webp', thumb: 'assets/Sound/Glow_Pods/Sound_5.webp' }
        ],
        contribution: {
            en: [
                'Concept & creation of ambient soundscapes for snow and cave environments',
                'Organic sound effects & foley art (ice crackling, wind, water drips)',
                'Acoustic finishing & deep reverb/spatial design for all visual elements',
                'Final audio mixing & game integration (Godot & Ableton Live)'
            ],
            de: [
                'Konzeption & Erstellung von Ambient-Klanglandschaften für Schneefeld und Höhle',
                'Organische Soundeffekte & Foley-Arbeit (knisterndes Eis, Wind, Wassertropfen)',
                'Akustischer Feinschliff & tiefe Raum-/Klangraum-Gestaltung für alle visuellen Elemente',
                'Abschließendes Audio-Mixing & Spiel-Integration (Godot & Ableton Live)'
            ]
        },
        tools: [
            { name: { en: 'Godot Engine', de: 'Godot Engine' }, icon: 'bx-code-alt' },
            { name: { en: 'Ableton Live', de: 'Ableton Live' }, icon: 'bx-music' }
        ],
        skills: ['godot']
    },

    /* Index 13 - Sound (project 3 - Lifted) */
    {
        category: 'sound',
        title: { en: 'Lifted', de: 'Lifted' },
        subtitle: { en: 'Complete Sound Redesign & Synchronization', de: 'Komplettes Sound-Redesign & Synchronisation' },
        description: { en: 'A dedicated sound redesign project in which an existing scene was fully re-scored and synchronized from scratch. The main focus was on breathing acoustic life into the visuals using a hybrid approach of custom-made sounds and professionally edited library assets.', de: 'Ein dediziertes Sound-Redesign-Projekt, bei dem eine bestehende Szene von Grund auf neu vertont und synchronisiert wurde. Der Hauptfokus lag darauf, den Bildern akustisches Leben einzuhauchen – mit einem hybriden Ansatz aus selbst erstellten Sounds und professionell bearbeiteten Bibliotheks-Sounds.' },
        duration: { en: '1 week', de: '1 Woche' },
        cover: 'assets/Picture/placeholders/sound.svg',
        media: [
            { type: 'video', src: 'assets/Sound/Lifted/Sound_6.mp4', thumb: 'assets/Picture/placeholders/sound.svg' }
        ],
        contribution: {
            en: [
                'Complete sound redesign for the scene',
                'Sourcing, editing & custom-adapting sound effects from libraries',
                'Precise audio-to-video synchronization & timing',
                'Video editing & final audio mix (realized with DaVinci Resolve)'
            ],
            de: [
                'Komplettes Sound-Redesign der Szene',
                'Recherche, Editing & individuelle Anpassung von Soundeffekten aus Bibliotheken',
                'Präzise Audio-zu-Video-Synchronisation & Timing',
                'Videoschnitt & finaler Audio-Mix (umgesetzt mit DaVinci Resolve)'
            ]
        },
        tools: [
            { name: { en: 'DaVinci Resolve', de: 'DaVinci Resolve' }, icon: 'bx-video' }
        ],
        /* No registry skill: pure video editing project */
        skills: []
    },

    /* Index 14 - Coding (project 2 - Website) */
    {
        category: 'coding',
        title: { en: 'Coding: Website', de: 'Coding: Website' },
        subtitle: { en: 'Web Development – Interactive Websites & Experiments', de: 'Webentwicklung – interaktive Websites & Experimente' },
        description: { en: 'A collection of web development projects built with HTML, CSS, JavaScript and TypeScript — from an interactive markdown page and an older portfolio website to browser-based canvas games with animations. Focus on clean front-end structure, interactive elements and a smooth user experience.', de: 'Eine Sammlung von Webentwicklungsprojekten mit HTML, CSS, JavaScript und TypeScript – von einer interaktiven Markdown-Seite und einer älteren Portfolio-Website bis zu browserbasierten Canvas-Spielen und Animationen. Fokus auf saubere Frontend-Struktur, interaktive Elemente und eine flüssige User Experience.' },
        links: [
            { label: { en: 'Markdown Page – Live Website', de: 'Markdown-Seite – Live-Website' }, url: 'https://davidz1407.github.io/Code1/Markdown_page/' },
            { label: { en: 'GitHub – Markdown Page', de: 'GitHub – Markdown-Seite' }, url: 'https://github.com/DavidZ1407/Code1' },
            { label: { en: 'Old Portfolio – Live Website', de: 'Old Portfolio – Live-Website' }, url: 'https://davidz1407.github.io/Portfolio_Old/portfolio.html' },
            { label: { en: 'GitHub – Portfolio_Old', de: 'GitHub – Portfolio_Old' }, url: 'https://github.com/DavidZ1407/Portfolio_Old' },
            { label: { en: 'Canvas – Old Live Server', de: 'Canvas – Alter Live-Server' }, url: 'https://davidz1407.github.io/Code2/canvas/canvas.html' },
            { label: { en: 'GitHub – Canvas', de: 'GitHub – Canvas' }, url: 'https://github.com/DavidZ1407/Code2/blob/main/canvas/canvas.html' },
            { label: { en: 'Ball Animation – Live Website', de: 'Ball-Animation – Live-Website' }, url: 'https://davidz1407.github.io/Code1/Task_4_Coding/ball_animation/ball.html' },
            { label: { en: 'Games of Games – Live Website', de: 'Games of Games – Live-Website' }, url: 'https://davidz1407.github.io/Code1/Task_4_Coding/games_of_games/games_of_games.html' }
        ],
        cover: 'assets/Coding_Web/Coding_Web/C_W_1.webp',
        media: [
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_1.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_1.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_2.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_2.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_3.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_3.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_4.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_4.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_5.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_5.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Web/C_W_6.webp', thumb: 'assets/Coding_Web/Coding_Web/C_W_6.webp' }
        ],
        contribution: {
            en: [
                'Frontend development with HTML & CSS',
                'Interactive logic & UI implementation with TypeScript & JavaScript',
                'Responsive layouts & clean web structure'
            ],
            de: [
                'Frontend-Entwicklung mit HTML & CSS',
                'Interaktive Logik & UI-Umsetzung mit TypeScript & JavaScript',
                'Responsive Layouts & saubere Web-Struktur'
            ]
        },
        tools: [
            { name: { en: 'HTML', de: 'HTML' }, icon: 'bxl-html5' },
            { name: { en: 'CSS', de: 'CSS' }, icon: 'bxl-css3' },
            { name: { en: 'JavaScript', de: 'JavaScript' }, icon: 'bxl-javascript' },
            { name: { en: 'TypeScript', de: 'TypeScript' }, icon: 'bxl-typescript' }
        ],
        skills: ['web', 'typescript']
    },

    /* Index 15 - Coding (project 3 - Jump) */
    {
        category: 'coding',
        title: { en: 'Coding: Jump', de: 'Coding: Jump' },
        subtitle: { en: 'Physical UI & Browser Interface (ESP Microcontroller)', de: 'Physisches UI & Browser-Interface (ESP-Mikrocontroller)' },
        description: { en: 'An interactive application developed with HTML, CSS and JavaScript in combination with an ESP microcontroller. The goal was to design a physical user interface that captures input through pins and visually represents it in the browser. A paper prototype was created as part of the design process.', de: 'Eine interaktive Anwendung, entwickelt mit HTML, CSS und JavaScript in Kombination mit einem ESP-Mikrocontroller. Das Ziel war es, ein physisches User Interface zu gestalten, das Eingaben über Pins erfasst und sie im Browser visuell darstellt. Als Teil des Designprozesses wurde zusätzlich ein Papier-Prototyp erstellt.' },
        links: [
            { label: { en: 'Live Website', de: 'Live-Website' }, url: 'https://davidz1407.github.io/Abgabe1/Game/' },
            { label: { en: 'GitHub Repository', de: 'GitHub repository' }, url: 'https://github.com/DavidZ1407/Abgabe1' }
        ],
        duration: { en: '1 week', de: '1 Woche' },
        team: { en: 'Worked alone', de: 'Allein gearbeitet' },
        cover: 'assets/Coding_Web/Coding_Jump/C_W_Jump_2.webp',
        media: [
            { type: 'image', src: 'assets/Coding_Web/Coding_Jump/C_W_Jump_2.webp', thumb: 'assets/Coding_Web/Coding_Jump/C_W_Jump_2.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Jump/C_W_Jump_3.webp', thumb: 'assets/Coding_Web/Coding_Jump/C_W_Jump_3.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Jump/C_W_Jump_4.webp', thumb: 'assets/Coding_Web/Coding_Jump/C_W_Jump_4.webp' },
            { type: 'image', src: 'assets/Coding_Web/Coding_Jump/C_W_Jump_5.webp', thumb: 'assets/Coding_Web/Coding_Jump/C_W_Jump_5.webp' }
        ],
        contribution: {
            en: [
                'Programming the web interface with HTML, CSS & JavaScript',
                'Physical user interface reading input through microcontroller pins',
                'Construction of the paper prototype'
            ],
            de: [
                'Programmierung des Web-Interfaces mit HTML, CSS & JavaScript',
                'Physisches User Interface zur Eingabeerfassung über Mikrocontroller-Pins',
                'Bau des Papier-Prototyps'
            ]
        },
        tools: [
            { name: { en: 'HTML', de: 'HTML' }, icon: 'bxl-html5' },
            { name: { en: 'CSS', de: 'CSS' }, icon: 'bxl-css3' },
            { name: { en: 'JavaScript', de: 'JavaScript' }, icon: 'bxl-javascript' }
        ],
        skills: ['web']
    },

    /* Index 16 - Game Dev (project 3 - Godot Island Generator) */
    {
        category: 'gamedev',
        title: { en: 'Godot Island Generator', de: 'Godot Island Generator' },
        subtitle: { en: 'Procedural Island Generation in Godot', de: 'Prozedurale Insel-Generierung in Godot' },
        description: {
            en: 'A procedural island generation project built in Godot, featuring dynamically generated terrain, biome-based texturing, animated water and stylized toon shading.\n\nThe project focuses on procedural environment generation and real-time customization, allowing terrain dimensions, height, noise, biome colors and water properties to be adjusted directly through the Godot Inspector.',
            de: 'Ein prozedurales Insel-Generierungsprojekt in Godot mit dynamisch generiertem Terrain, biome-basiertem Texturing, animiertem Wasser und stilisiertem Toon-Shading.\n\nDer Fokus liegt auf prozeduraler Umgebungs-Generierung und Echtzeit-Anpassung: Terrainedimensionen, Höhe, Noise, Biomfarben und Wassereigenschaften lassen sich direkt über den Godot-Inspector anpassen.'
        },
        gameConcept: {
            en: 'The goal of the project was to create a fully procedural island environment that combines generated terrain with dynamic water and a stylized visual approach.\n\nTerrain geometry is generated procedurally and automatically receives different biome textures based on height and slope. A custom water shader adds animated waves, depth-based coloring and Fresnel reflections, while a toon outline creates the stylized low-poly look.',
            de: 'Ziel des Projekts war eine vollständig prozedurale Insel-Umgebung, die generiertes Terrain mit dynamischem Wasser und einem stilisierten visuellen Ansatz verbindet.\n\nDie Terrain-Geometrie wird prozedural erzeugt und erhält automatisch verschiedene Biome-Texturen basierend auf Höhe und Neigung. Ein eigener Water-Shader sorgt für animierte Wellen, tiefenbasierte Färbung und Fresnel-Reflexionen, während ein Toon-Outline den stilisierten Low-Poly-Look erzeugt.'
        },
        duration: { en: '1 week', de: '1 Woche' },
        team: { en: 'Worked alone', de: 'Allein gearbeitet' },
        links: [
            { label: { en: 'GitHub Repository', de: 'GitHub-Repository' }, url: 'https://github.com/DavidZ1407/Terrain-Generator' }
        ],
        cover: 'assets/Game_Dev/Terrain/G_D_Terrain_2.webp',
        media: [
            { type: 'video', src: 'assets/Game_Dev/Terrain/G_D_Terrain_1.mp4', thumb: 'assets/Game_Dev/Terrain/G_D_Terrain_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Terrain/G_D_Terrain_2.webp', thumb: 'assets/Game_Dev/Terrain/G_D_Terrain_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Terrain/G_D_Terrain_3.webp', thumb: 'assets/Game_Dev/Terrain/G_D_Terrain_3.webp' },
            { type: 'image', src: 'assets/Game_Dev/Terrain/G_D_Terrain_4.webp', thumb: 'assets/Game_Dev/Terrain/G_D_Terrain_4.webp' },
            { type: 'image', src: 'assets/Game_Dev/Terrain/G_D_Terrain_5.webp', thumb: 'assets/Game_Dev/Terrain/G_D_Terrain_5.webp' }
        ],
        contribution: {
            en: [
                { group: 'Procedural Generation', items: [
                    'Procedural island mesh generation',
                    'Noise-based terrain shaping',
                    'Automatic biome mapping based on height and slope',
                    'Configurable terrain generation parameters'
                ] },
                { group: 'Shaders & Visuals', items: [
                    'Custom terrain shader',
                    'Biome-based terrain texturing',
                    'Dynamic water shader',
                    'Animated waves and depth-based water coloring',
                    'Fresnel reflections',
                    'Stylized toon shading and outlines'
                ] }
            ],
            de: [
                { group: 'Prozedurale Generierung', items: [
                    'Prozedurale Insel-Mesh-Generierung',
                    'Noise-basierte Terrain-Formung',
                    'Automatisches Biome-Mapping nach Höhe und Neigung',
                    'Konfigurierbare Generierungsparameter'
                ] },
                { group: 'Shaders & Visuals', items: [
                    'Eigener Terrain-Shader',
                    'Biome-basiertes Terrain-Texturing',
                    'Dynamischer Water-Shader',
                    'Animierte Wellen und tiefenbasierte Wasserfärbung',
                    'Fresnel-Reflexionen',
                    'Stilisiertes Toon-Shading und Outlines'
                ] }
            ]
        },
        tools: [
            { name: { en: 'Godot', de: 'Godot' }, icon: 'bx-game' },
            { name: { en: 'GDScript', de: 'GDScript' }, icon: 'bx-code' },
            { name: { en: 'Shader Programming', de: 'Shader-Programmierung' }, icon: 'bx-code-block' }
        ],
        skills: ['godot']
    },

    /* Index 17 - Game Dev (project 4 - Fartnite, 48h Game Jam) */
    {
        category: 'gamedev',
        title: { en: 'Fartnite', de: 'Fartnite' },
        subtitle: { en: 'Chaotic 48-Hour Game Jam FPS', de: 'Chaotischer 48-Stunden-Game-Jam-Egoshooter' },
        description: {
            en: 'Fartnite is a fast-paced first-person shooter developed during a 48-hour game jam by a 3-member team.\n\nThe game takes place in a satirical world where an evil milk factory has conspired to make all of humanity lactose intolerant, causing everyone to constantly flatulate. Players take on the role of a hero fighting back against this dairy tyranny by vacuuming up farts from the environment and shooting them back as projectiles.',
            de: 'Fartnite ist ein schneller First-Person-Shooter, der während eines 48-Stunden-Game-Jams in einem 3-köpfigen Team entwickelt wurde.\n\nDas Spiel spielt in einer satirischen Welt, in der eine böse Milchfabrik sich verschworen hat, die gesamte Menschheit laktoseintolerant zu machen, sodass alle ständig flatulieren. Die Spieler schlüpfen in die Rolle eines Helden, der sich gegen diese Milch-Tyrannei zur Wehr setzt, indem er Furze aus der Umgebung einsaugt und sie als Projektile zurückschießt.'
        },
        gameConcept: {
            en: 'A chaotic and humorous first-person shooter centered around unique mechanics, fast-paced action, and arcade-style gameplay.\n\nPlayers explore a compact, custom-built level, utilizing a vacuum-style mechanic to absorb farts and turn them into weaponized ammunition against the factory\'s minions.',
            de: 'Ein chaotischer, humorvoller First-Person-Shooter rund um einzigartige Mechaniken, schnelle Action und Arcade-Gameplay.\n\nDie Spieler erkunden ein kompaktes, selbst gebautes Level und nutzen eine Vakuum-Mechanik, um Furze einzusaugen und sie als waffengerichtete Munition gegen die Lakaien der Fabrik einzusetzen.'
        },
        duration: { en: '48 hours (Game Jam)', de: '48 Stunden (Game Jam)' },
        team: { en: '3 members', de: '3 Mitglieder' },
        cover: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_2.webp',
        media: [
            { type: 'video', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_1.mp4', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_2.webp', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_2.webp' },
            { type: 'image', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_3.webp', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_3.webp' },
            { type: 'image', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_4.webp', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_4.webp' },
            { type: 'image', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_5.webp', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_5.webp' },
            { type: 'image', src: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_6.webp', thumb: 'assets/Game_Dev/Game_Jam_26/G_D_GJ_6.webp' }
        ],
        contribution: {
            en: [
                { group: '3D Art & Animation', items: [
                    'Creation of 3D assets and environment props for the level in Blender',
                    'Character and creature modeling, rigging, and custom animations'
                ] },
                { group: 'Game Integration', items: [
                    'Importing and setting up all 3D assets and animations within the Godot Engine',
                    'Assembling and polishing the compact game level'
                ] }
            ],
            de: [
                { group: '3D-Art & Animation', items: [
                    'Erstellung von 3D-Assets und Umgebungsprops für das Level in Blender',
                    'Charakter- und Kreatur-Modeling, Rigging und eigene Animationen'
                ] },
                { group: 'Game-Integration', items: [
                    'Import und Setup aller 3D-Assets und Animationen in der Godot Engine',
                    'Zusammenbau und Feinschliff des kompakten Levels'
                ] }
            ]
        },
        tools: [
            { name: { en: 'Godot', de: 'Godot' }, icon: 'bx-game' },
            { name: { en: 'Blender', de: 'Blender' }, icon: 'bx-cube' },
            { name: { en: 'Ableton Live', de: 'Ableton Live' }, icon: 'bx-music' }
        ],
        skills: ['godot', 'blender']
    }

    /*
     * Append further projects following this pattern.
     * Then add the corresponding index to the category array in categoryProjects.
     */
];
export {
    projects
};

/* ---- Helper functions (used by the modal + portal carousel) ---- */

/**
 * Returns the cover/title image of a project (for the hero carousel + portal).
 */
export function getProjectCover(index) {
    const p = projects[index];
    return (p && p.cover) ? p.cover : '';
}

/**
 * Returns the themed placeholder path of a category.
 * Used when a real cover/media item is missing so all bubbles/slides
 * on the main page and in the modal stay visible.
 *
 * Caution: intentionally returns ONE shared, neutral placeholder for
 * ALL categories (not a category-specific icon/text image). This way all
 * 6 cards in the hero carousel and the portal appear consistently -
 * until real project screenshots are available.
 */
export function getCategoryPlaceholder(category) {
    return 'assets/Picture/placeholders/project.svg';
}

/**
 * Attaches an image fallback to an <img>: if loading fails
 * (e.g. missing file), the category placeholder image is set.
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
 * Returns the indices of all projects in a category (from categoryProjects).
 */
export function getProjectIndicesByCategory(category) {
    return categoryProjects[category] || [];
}

/**
 * Returns the list of categories that contain at least one project.
 * (Order = canonical color scheme index from CATEGORY_ORDER)
 */
export function getCategories() {
    return CATEGORY_ORDER.filter(cat => getProjectCountInCategory(cat) > 0);
}

/**
 * Returns the first project index of a category (or null).
 */
export function getFirstProjectOfCategory(category) {
    const indices = categoryProjects[category];
    if (!indices || !indices.length) return null;
    return indices[0];
}

/**
 * Returns the project indices of all categories in CATEGORY_ORDER order,
 * only the FIRST project per category. Used by the portal and the hero
 * carousel so both show the same (one) card per area in identical order.
 */
export function getOrderedProjectIndices() {
    return getCategories()
        .map(cat => getFirstProjectOfCategory(cat))
        .filter(idx => idx !== null && idx !== undefined);
}

/**
 * Switch between projects of the SAME category.
 * direction: 'prev' | 'next'  (wrap-around)
 * Returns null when the category has only one project.
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
 * Switch between categories (wrap-around).
 * Moves to the first project of the adjacent category.
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
 * Color scheme index of a category for the Voronoi shader.
 * Order matches CATEGORY_ORDER (0=gamedev, 1=coding, 2=3d, 3=concept, 4=sound, 5=other).
 */
export function getCategorySchemeIndex(category) {
    return CATEGORY_ORDER.indexOf(category);
}

