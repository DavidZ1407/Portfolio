/* ========================================= */
/* CONSTANTS - PROJECTS */
/* ========================================= */

/* Project data with English defaults + German translations */
const PROJECT_TRANSLATIONS = {
    de: {
        0: {
            description: "Action Gameplay & Strategie in UE5",
            fullDescription: "Ein tower defense Spiel entwickelt in Unreal Engine 5. Kombiniere strategisches Denken mit actionreichem Gameplay in einer düsteren Fantasy-Welt. Baue Verteidigungsanlagen, verwalte Ressourcen und besiege Wellen von Gegnern in diesem atmosphärischen Erlebnis.",
        },
        1: {
            description: "Konzeptkunst in Krita",
            fullDescription: "Eine Sammlung von Character Designs im Dark Fantasy Stil. Von düsteren Rittern bis hin zu mystischen Kreaturen - jedes Design erzählt seine eigene Geschichte. Entwickelt mit Fokus auf Atmosphäre und narrative Tiefe.",
        },
        2: {
            description: "Blender Animation & Modeling",
            fullDescription: "Eine atmosphärische 3D-Weltraum-Szene, die die Einsamkeit und Schönheit des Weltraums einfängt. Mit komplexen Shader-Netzwerken, volumetrischem Nebel und dynamischer Beleuchtung entsteht ein immersives Erlebnis.",
        },
    }
};

export const projects = [
    {
        name: "Unreal Tower Defense",
        description: "Action Gameplay & Strategy in UE5",
        fullDescription: "A tower defense game developed in Unreal Engine 5. Combine strategic thinking with action-packed gameplay in a dark fantasy world. Build defenses, manage resources, and defeat waves of enemies in this atmospheric experience.",
        image: "assets/Picture/Project1.png",
        link: "#",
        skills: [
            { name: "Unreal Engine 5", icon: "bx-code-block" },
            { name: "Blueprint", icon: "bx-file" },
            { name: "C++", icon: "bx-terminal" },
            { name: "Game Design", icon: "bx-game" },
            { name: "Level Design", icon: "bx-layout" }
        ]
    },
    {
        name: "Character Design",
        description: "Concept Art in Krita",
        fullDescription: "A collection of character designs in Dark Fantasy style. From grim knights to mystical creatures - each design tells its own story. Developed with a focus on atmosphere and narrative depth.",
        image: "assets/Picture/Project2.png",
        link: "#",
        skills: [
            { name: "Krita", icon: "bx-palette" },
            { name: "Digital Painting", icon: "bx-brush" },
            { name: "Concept Art", icon: "bx-pencil" },
            { name: "Character Design", icon: "bx-user" },
            { name: "Anatomy", icon: "bx-body" }
        ]
    },
    {
        name: "3D Space Scene",
        description: "Blender Animation & Modeling",
        fullDescription: "An atmospheric 3D space scene capturing the solitude and beauty of outer space. With complex shader networks, volumetric fog, and dynamic lighting creating an immersive experience.",
        image: "assets/Picture/Project3.png",
        link: "#",
        skills: [
            { name: "Blender", icon: "bx-cube" },
            { name: "3D Modeling", icon: "bx-box" },
            { name: "Shader", icon: "bx-color" },
            { name: "Lighting", icon: "bx-lightbulb" },
            { name: "Animation", icon: "bx-movie-play" }
        ]
    }
];

/**
 * Get project description in the current language
 */
export function getProjectDescription(projectIndex, lang = 'en') {
    const p = projects[projectIndex];
    if (!p) return '';
    if (lang === 'de' && PROJECT_TRANSLATIONS.de[projectIndex]) {
        return PROJECT_TRANSLATIONS.de[projectIndex].description;
    }
    return p.description;
}

/**
 * Get project full description in the current language
 */
export function getProjectFullDescription(projectIndex, lang = 'en') {
    const p = projects[projectIndex];
    if (!p) return '';
    if (lang === 'de' && PROJECT_TRANSLATIONS.de[projectIndex]) {
        return PROJECT_TRANSLATIONS.de[projectIndex].fullDescription;
    }
    return p.fullDescription;
}
