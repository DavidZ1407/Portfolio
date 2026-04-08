function renderPortfolio() {
    // Projekte laden
    const projectGrid = document.getElementById('project-grid');
    if (projectGrid && typeof projects !== 'undefined') {
        projectGrid.innerHTML = projects.map(p => `
            <div class="col_box">
                <a href="${p.link}">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="layer"><h3>${p.name}</h3><p>${p.description}</p></div>
                </a>
            </div>
        `).join('');
    }

    // Timeline laden
    const timelineContainer = document.getElementById('timeline-list');
    if (timelineContainer && typeof timelineData !== 'undefined') {
        timelineContainer.innerHTML = timelineData.map((item, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            return `
                <div class="timeline_item ${side}">
                    <div class="water_dot"></div>
                    <div class="timeline_content">
                        <span class="year">${item.year}</span>
                        <h4>${item.icon} ${item.title}</h4>
                        <p>${item.text}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderPortfolio();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.timeline_item').forEach(item => observer.observe(item));
});