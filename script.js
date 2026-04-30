// =====================
// Navigation: Active Link Logik
// =====================
function updateActiveNavLink(currentSection) {
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const hrefSection = link.getAttribute('href').split('#')[1];
        if (hrefSection === currentSection) {
            link.classList.add('active');
        }
    });
}

function detectVisibleSectionOnScroll() {
    const sections = document.querySelectorAll('section');
    let currentSection = '';
    const scrollY = window.scrollY + 200;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    if (currentSection) updateActiveNavLink(currentSection);
}

// =====================
// Portfolio Rendering
// =====================
function renderPortfolio() {
    // Projekte
    const projectGrid = document.getElementById('project-grid');
    if (projectGrid && typeof projects !== 'undefined') {
        projectGrid.innerHTML = projects.map(p => `
            <div class="col_box">
                <a href="project-detail.html?id=${p.id}">
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
            return c.isLink ? `<a href="${c.link}" target="_blank">${content}</a>` : `<div class="contact_item">${content}</div>`;
        }).join('');
    }
}

// =====================
// Initialisierung
// =====================
document.addEventListener("DOMContentLoaded", () => {
    renderPortfolio();

    // Scroll Animation Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('show');
            else entry.target.classList.remove('show');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.timeline_item').forEach(item => observer.observe(item));

    // Nav-Click Feedback
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });
});

let scrollTimeout;
window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(detectVisibleSectionOnScroll, 50);
});