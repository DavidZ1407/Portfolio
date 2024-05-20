window.onscroll = () => {
    const sections = document.querySelectorAll('section');

    sections.forEach(sec => {
        const top = window.scrollY;
        const offset = sec.offsetTop - 150;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');


    });
};

const navLinks = document.querySelectorAll('.navbar a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
    });
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

    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === currentSection) {
            link.classList.add('active');
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const images = document.querySelectorAll(".col_box img");
    const lightbox = document.getElementById("lightbox");
    const videoPlayer = document.getElementById("video-player");
    const closeBtn = document.getElementById("close-btn");
    const descriptionText = document.getElementById("description-text");

    images.forEach((img) => {
        img.addEventListener("click", function () {
            const videoSrc = this.dataset.video;
            const description = this.dataset.description;

            videoPlayer.src = videoSrc;
            descriptionText.textContent = description;
            lightbox.style.display = "block";
        });
    });

    closeBtn.addEventListener("click", function () {
        lightbox.style.display = "none";
        videoPlayer.pause();
        videoPlayer.src = "";
    });
});