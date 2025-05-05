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

    const sectionToHighlight = currentHash || 'home';

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const [targetFileRaw, targetHash] = href.split('#');
        const targetFile = targetFileRaw.split('/').pop();

        const fileMatch = currentFile === targetFile || (!targetFile && currentFile === "portfolio.html");
        const hashMatch = sectionToHighlight === targetHash || (!sectionToHighlight && targetHash === "home");

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
// Sichtbare Sektion erkennen (verbessert)
// =====================
function detectVisibleSectionOnScroll() {
    const sections = document.querySelectorAll('section');
    let currentSection = '';
    const scrollY = window.scrollY + 150;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    if (currentSection) {
        updateActiveNavLink(currentSection);
    }
}

// =====================
// Sprachumschalter mit localStorage
// =====================
document.addEventListener('DOMContentLoaded', function () {
    const languageToggle = document.getElementById('language-toggle');
    const elementsToTranslate = document.querySelectorAll('[data-de], [data-en]');

    let isGerman = localStorage.getItem('preferredLanguage') !== 'en';

    function applyLanguage() {
        elementsToTranslate.forEach(el => {
            el.innerHTML = isGerman ? el.getAttribute('data-de') : el.getAttribute('data-en');
        });
        if (languageToggle) {
            languageToggle.innerHTML = isGerman ? languageToggle.getAttribute('data-de') : languageToggle.getAttribute('data-en');
        }
    }

    function switchLanguage() {
        isGerman = !isGerman;
        localStorage.setItem('preferredLanguage', isGerman ? 'de' : 'en');
        applyLanguage();
    }

    languageToggle?.addEventListener('click', switchLanguage);

    applyLanguage();
});

// =====================
// Bildvergrößerung und Overlay mit Navigation
// =====================
document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('.content_click img');
    const overlay = document.getElementById('image-overlay');
    const overlayImage = document.getElementById('overlay-image');
    const overlayClose = document.getElementById('overlay-close');
    let currentIndex = 0;  
    const imageArray = Array.from(images);  

    images.forEach((img, index) => {
        img.addEventListener('click', function () {
            currentIndex = index;  
            overlayImage.src = img.src; 
            overlay.classList.remove('hidden'); 
        });
    });

    overlayClose.addEventListener('click', function () {
        overlay.classList.add('hidden');
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });

    function showNextImage() {
        currentIndex = (currentIndex + 1) % imageArray.length; 
        overlayImage.src = imageArray[currentIndex].src;
    }

    function showPreviousImage() {
        currentIndex = (currentIndex - 1 + imageArray.length) % imageArray.length; 
        overlayImage.src = imageArray[currentIndex].src;
    }

    overlayImage.addEventListener('click', showNextImage);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
            showNextImage();  
        } else if (e.key === 'ArrowLeft') {
            showPreviousImage();  
        }
    });
});

// =====================
// Initialisierung
// =====================
window.addEventListener("DOMContentLoaded", () => {
    highlightNavLinkOnLoad();
    setupNavLinkClickListeners();
});

window.addEventListener("load", scrollToHashOnLoad);

let scrollTimeout;
window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(detectVisibleSectionOnScroll, 100);
});
