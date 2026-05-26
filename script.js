// =====================
// Navigation Active Link Logic
// =====================
function updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Set active based on current section
        if (current === 'home') {
            document.querySelector('a[href="#home"]')?.classList.add('active');
        } else if (current === 'work') {
            document.querySelector('a[href="#work"]')?.classList.add('active');
        } else if (current === 'journey') {
            document.querySelector('a[href="#journey"]')?.classList.add('active');
        } else if (current === 'contact') {
            document.querySelector('a[href="#contact"]')?.classList.add('active');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateActiveNavLink);

// =====================
// Globale Variablen & State
// =====================
let currentProjectIndex = 0;

// =====================
// Navigation & Active Link Logik
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
// Portfolio Slider Logik
// =====================
function renderSlider() {
    const track = document.getElementById('project-grid');
    if (!track || typeof projects === 'undefined') return;

    const p = projects[currentProjectIndex];

    track.innerHTML = `
        <button class="nav-btn" onclick="changeProject(-1)">❮</button>
        <div class="portal_arch" onclick="window.location.href='${p.link}'">
            <img src="${p.image}" alt="${p.name}">
            <div class="col_overlay">
                <div class="overlay_title">${p.name}</div>
                <div class="overlay_subtext">${p.description}</div>
            </div>
        </div>
        <button class="nav-btn" onclick="changeProject(1)">❯</button>
    `;
}

function changeProject(direction) {
    currentProjectIndex = (currentProjectIndex + direction + projects.length) % projects.length;
    renderSlider();
}

// =====================
// Skills, Timeline & Kontakt Rendering
// =====================
function renderStaticContent() {
    // 1. Skills rendern
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && typeof skills !== 'undefined') {
        skillsGrid.innerHTML = skills.map(s => `
            <div class="skill_item">
                <i class='bx ${s.icon}'></i>
                <span>${s.name}</span>
            </div>
        `).join('');
    }

    // 2. Timeline rendern
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

    // 3. Kontakt-Icons rendern
    const contactContainer = document.querySelector('.icons');
    if (contactContainer && typeof contactData !== 'undefined') {
        contactContainer.innerHTML = contactData.map(c => {
            const content = `<i class='bx ${c.icon}'></i><p>${c.text}</p>`;
            return c.isLink ? `<a href="${c.link}" target="_blank">${content}</a>` : `<div class="contact_item">${content}</div>`;
        }).join('');
    }
}

// =====================
// Carousel Logik (Works Auto-Play)
// =====================
function initCarousel() {
    const indicators = document.querySelectorAll('.indicator');
    const carouselTrack = document.querySelector('.carousel_track');
    let currentSlide = 0;
    
    if (!indicators.length || !carouselTrack) return;

    // Funktion zum Update der Indikatoren
    function updateIndicators(slideIndex) {
        indicators.forEach((ind, index) => {
            if (index === slideIndex) {
                ind.classList.add('active');
            } else {
                ind.classList.remove('active');
            }
        });
    }

    // Click-Handler für Indikatoren
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            carouselTrack.style.animation = 'none';
            carouselTrack.style.transform = `translateX(-${index * 100}%)`;
            updateIndicators(index);
            
            // Restart animation after 2 seconds
            setTimeout(() => {
                carouselTrack.style.animation = 'carouselAutoPlay 12s ease-in-out infinite';
            }, 2000);
        });
    });

    // Sync indikatoren mit auto-play animation
    const updateSlideIndex = () => {
        const scrollPosition = window.scrollY;
        // Kalkuliere welcher Slide aktiv ist basierend auf Animation
        // Alle 4 Sekunden wechselt ein Slide (12s Animation / 3 Slides = 4s pro Slide)
        const timeInCycle = (Date.now() % 12000) / 1000; // 0-12 Sekunden
        
        if (timeInCycle < 4) {
            currentSlide = 0;
        } else if (timeInCycle < 8) {
            currentSlide = 1;
        } else {
            currentSlide = 2;
        }
        
        updateIndicators(currentSlide);
    };

    // Update indicators every 1 second
    setInterval(updateSlideIndex, 1000);

    // Mouse hover - pause animation
    const carouselContainer = document.querySelector('.carousel_container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            carouselTrack.style.animationPlayState = 'paused';
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            carouselTrack.style.animationPlayState = 'running';
        });
    }
}

// =====================
// Initialisierung
// =====================
document.addEventListener("DOMContentLoaded", () => {
    initCarousel();
    renderSlider();
    renderStaticContent();
    
    // Initial navigation update
    updateActiveNavLink('home');

    // Scroll Animation Observer für Timeline
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

// Scroll Event für Active-Link Erkennung
let scrollTimeout;
window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(detectVisibleSectionOnScroll, 50);
});