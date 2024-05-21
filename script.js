function updateActiveNavLink(currentSection) {
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === currentSection) {
            link.classList.add('active');
        }
    });
}

function showLightboxVideo(videoSrc, description) {
    const lightbox = document.getElementById("lightbox");
    const videoPlayer = document.getElementById("video-player");
    const descriptionText = document.getElementById("description-text");

    videoPlayer.src = videoSrc;
    descriptionText.textContent = description;
    lightbox.style.display = "block";
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    const videoPlayer = document.getElementById("video-player");

    lightbox.style.display = "none";
    videoPlayer.pause();
    videoPlayer.src = "";
}

function handleImageClick() {
    const videoSrc = this.dataset.video;
    const description = this.dataset.description;
    showLightboxVideo(videoSrc, description);
}

document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll('.navbar a');
    const images = document.querySelectorAll(".col_box img");
    const closeBtn = document.getElementById("close-btn");

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    images.forEach(img => {
        img.addEventListener("click", handleImageClick);
    });

    closeBtn.addEventListener("click", closeLightbox);
});

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