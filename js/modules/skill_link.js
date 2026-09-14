/* ==========================================================================
   FILE: js/modules/skill_link.js
   DESCRIPTION: Links hero skill items to related project slides, applying highlight/dim effects on hover.
   ========================================================================== */

import { getProjectSkillIds } from '../constants/projects.js?v=11';

let activeSkillId = null;


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




    if (!anyMatch) clearSkillHighlight();
}


export function clearSkillHighlight() {
    activeSkillId = null;
    document.querySelectorAll('.skill-highlight, .skill-dim').forEach(card => {
        card.classList.remove('skill-highlight', 'skill-dim');
    });
}


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