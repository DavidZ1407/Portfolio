// =====================
// Navigation aktualisieren
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

function highlightNavLinkOnLoad() {
    const navLinks = document.querySelectorAll('.navbar a');
    const currentHash = window.location.hash.replace('#', '');
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop(); 

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const [targetFileRaw, targetHash] = href.split('#');
        const targetFile = targetFileRaw.split('/').pop(); 

        const fileMatch = currentFile === targetFile || (!targetFile && currentFile === "portfolio.html");
        const hashMatch = currentHash === targetHash || (!currentHash && targetHash === "home");

        if (fileMatch && hashMatch) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function setupNavLinkClickListeners() {
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// =====================
// Scroll zu Anker beim Laden
// =====================
function scrollToHashOnLoad() {
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth" });
            }, 100); 
        }
    }
}

// =====================
// Overlay-Galerie
// =====================
function setupImageOverlay() {
    const overlay = document.getElementById("image-overlay");
    if (!overlay) return;

    const overlayImage = document.getElementById("overlay-image");
    const overlayClose = document.getElementById("overlay-close");
    const images = document.querySelectorAll(".content_click img");
    let currentIndex = 0;

    images.forEach((img, index) => {
        img.addEventListener("click", () => {
            currentIndex = index;
            overlayImage.src = img.src;
            overlay.classList.remove("hidden");
        });
    });

    overlayImage.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % images.length;
        overlayImage.src = images[currentIndex].src;
    });

    overlayClose.addEventListener("click", () => {
        overlay.classList.add("hidden");
        overlayImage.src = "";
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.add("hidden");
            overlayImage.src = "";
        }
    });
}

// =====================
// Sichtbare Sektion erkennen (für Scroll-Navigation)
// =====================
function detectVisibleSectionOnScroll() {
    const sections = document.querySelectorAll('section');
    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute('id');
        }
    });

    if (currentSection) {
        updateActiveNavLink(currentSection);
    }
}

// =====================
// Initialisierung
// =====================
window.addEventListener("DOMContentLoaded", () => {
    highlightNavLinkOnLoad();
    setupNavLinkClickListeners();
    setupImageOverlay();
});

window.addEventListener("load", scrollToHashOnLoad);
window.addEventListener("scroll", detectVisibleSectionOnScroll);
