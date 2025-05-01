function updateActiveNavLink(currentSection) {
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === currentSection) {
            link.classList.add('active');
        }
    });
}

// Funktion zum Anzeigen der Lightbox und Abspielen des Videos
function showLightboxVideo(videoSrc, description, index) {
    const lightbox = document.getElementById("lightboxsection");
    const videoPlayer = document.getElementById("video-player");
    const descriptionText = document.getElementById("description-text");

    videoPlayer.src = videoSrc;
    descriptionText.textContent = description;
    lightbox.style.display = "flex";

    // Setze die Lautstärke und starte das Video
    videoPlayer.addEventListener("loadedmetadata", function onLoaded() {
        videoPlayer.volume = 0.5;
        videoPlayer.play();
        videoPlayer.removeEventListener("loadedmetadata", onLoaded);
    });

    // Speichern des aktuellen Index
    lightbox.dataset.index = index;
}

// Funktion zum Schließen der Lightbox
function closeLightbox() {
    const lightbox = document.getElementById("lightboxsection");
    const videoPlayer = document.getElementById("video-player");

    lightbox.style.display = "none";
    videoPlayer.pause();
    videoPlayer.src = "";
}

// Funktion zum Handhaben des Klicks auf ein Bild
function handleImageClick() {
    const videoSrc = this.dataset.video;
    const description = this.dataset.description;
    const index = this.dataset.index;

    showLightboxVideo(videoSrc, description, index);
}

// Funktion zum Navigieren zu vorherigem/folgendem Video in der Lightbox
function navigateLightbox(direction) {
    const lightbox = document.getElementById("lightboxsection");
    const videoPlayer = document.getElementById("video-player");
    const images = document.querySelectorAll(".gallery-item");
    let currentIndex = parseInt(lightbox.dataset.index);

    // Berechne den neuen Index
    if (direction === "prev") {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
    } else if (direction === "next") {
        currentIndex = (currentIndex + 1) % images.length;
    }

    const newImage = images[currentIndex];
    videoPlayer.src = newImage.dataset.video;
    document.getElementById("description-text").textContent = newImage.dataset.description;

    // Update den Index
    lightbox.dataset.index = currentIndex;
}

// Event-Listener für DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll('.navbar a');
    const images = document.querySelectorAll(".gallery-item");
    const closeBtn = document.getElementById("close-btn");

    // Setze Event-Listener für Navigationslinks
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Setze Event-Listener für Bilder, um die Lightbox anzuzeigen
    images.forEach((img, index) => {
        img.dataset.index = index;  // Füge einen Index für jedes Bild hinzu
        img.addEventListener("click", handleImageClick);
    });

    // Event-Listener für das Schließen der Lightbox
    closeBtn.addEventListener("click", closeLightbox);

    // Event-Listener für das Navigieren zu vorherigem/nächstem Bild
    document.getElementById("prev-btn").addEventListener("click", () => navigateLightbox("prev"));
    document.getElementById("next-btn").addEventListener("click", () => navigateLightbox("next"));
});

// Event-Listener für das Scrollen und die Navigation im Header
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute('id');
        }
    });

    updateActiveNavLink(currentSection);
});
