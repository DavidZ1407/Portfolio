/**
 * File: skill_link.js
 * Description: Links hero skill items to related project slides, applying highlight/dim effects on hover.
 */
import { getProjectSkillIds } from '../constants/projects.js?v=9';

let activeSkillId = null;

/**
 * Apply highlight/dim to all project cards
 * @param {string} skillId - Skill id from the registry (data-skill in the arsenal)
 */
function applySkillHighlight(skillId) {
    activeSkillId = skillId;

    const cards = document.querySelectorAll('.carousel_slide, .portal-slide');
    let anyMatch = false;

    cards.forEach(card => {
        const projectIdx = parseInt(card.dataset.project);
        const skillIds = getProjectSkillIds(projectIdx);
        const isMatch = skillIds.includes(skillId);
        if (isMatch) anyMatch = true;
        card.classList.toggle('skill-highlight', isMatch);
        card.classList.toggle('skill-dim', !isMatch);
    });

    // If NO visible project uses this skill (e.g. a skill that only
    // appears in non-displayed projects), nothing gets dimmed -
    // all cards stay in their normal state instead of going completely dark.
    if (!anyMatch) clearSkillHighlight();
}

/**
 * Remove all highlight/dim classes (restore the normal state)
 */
export function clearSkillHighlight() {
    activeSkillId = null;
    document.querySelectorAll('.skill-highlight, .skill-dim').forEach(card => {
        card.classList.remove('skill-highlight', 'skill-dim');
    });
}

/**
 * Initializes the skill hover in the hero arsenal (event delegation).
 * Call once - also works after the skill items are re-rendered.
 */
export function initSkillProjectLink() {
    const arsenalGrid = document.querySelector('.arsenal_grid');
    if (!arsenalGrid) return;

    arsenalGrid.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.skill_item');
        if (!item || !arsenalGrid.contains(item)) return;
        const skillId = item.getAttribute('data-skill');
        if (skillId && skillId !== activeSkillId) applySkillHighlight(skillId);
    });

    arsenalGrid.addEventListener('mouseleave', () => {
        if (activeSkillId !== null) clearSkillHighlight();
    });
}