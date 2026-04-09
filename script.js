function renderPortfolio() {
    // Projekte
    const projectGrid = document.getElementById('project-grid');
    if (projectGrid) {
        projectGrid.innerHTML = projects.map(p => `
            <div class="col_box">
                <a href="${p.link}">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="col_overlay">
                        <div class="overlay_title">${p.name}</div>
                        <div class="overlay_subtext">${p.description}</div>
                    </div>
                </a>
            </div>
        `).join('');
    }

    // Timeline
    const timelineContainer = document.getElementById('timeline-list');
    if (timelineContainer && typeof timelineData !== 'undefined') {
        timelineContainer.innerHTML = timelineData.map((item, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            return `
                <div class="timeline_item ${side}">
                    <div class="water_dot"></div>
                    <div class="timeline_content_wrapper">
                        <div class="timeline_content">
                            <span class="year">${item.year}</span>
                            <h4>${item.icon} ${item.title}</h4>
                            <p>${item.text}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Kontakt
    const contactContainer = document.querySelector('.icons');
    if (contactContainer && typeof contactData !== 'undefined') {
        contactContainer.innerHTML = contactData.map(c => {
            const content = `<i class='bx ${c.icon}'></i><p>${c.text}</p>`;
            return c.isLink ? `<a href="${c.link}">${content}</a>` : `<div class="contact_item">${content}</div>`;
        }).join('');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderPortfolio();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('show');
            else entry.target.classList.remove('show');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.timeline_item').forEach(item => observer.observe(item));
});