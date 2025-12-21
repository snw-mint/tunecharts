const inputUsuario = document.getElementById("userInput");
const botaoIr = document.getElementById("btnIr");
const msgErro = document.getElementById("mensagemErro");
function irParaPerfil() {
    const usuario = inputUsuario.value.trim();
    if (usuario === "") {
        if (msgErro) msgErro.textContent = "Please enter a lastfm username.";
        return;
    }
    if (msgErro) msgErro.textContent = "";
    if (typeof gtag === "function") {
        gtag("event", "generate_charts", {
            event_category: "Charts",
            event_label: "Counter Submit (Success)",
            lastfm_user: usuario,
        });
    }
    window.location.href = "result.html?user=" + usuario;
}
if (botaoIr) {
    botaoIr.addEventListener("click", irParaPerfil);
}
if (inputUsuario) {
    inputUsuario.addEventListener("keypress", function (evento) {
        if (evento.key === "Enter") {
            irParaPerfil();
        }
    });
}
if (document.getElementById("currentYear")) {
    document.getElementById("currentYear").textContent = new Date().getFullYear();
}
const menuBtn = document.querySelector(".mobile-menu-btn");
const navOverlay = document.querySelector(".mobile-nav-overlay");
const mobileLinks = document.querySelectorAll(".mobile-link");
if (menuBtn && navOverlay) {
    menuBtn.addEventListener("click", () => {
        menuBtn.classList.toggle("active");
        navOverlay.classList.toggle("active");
        if (navOverlay.classList.contains("active")) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    });
    mobileLinks.forEach((link) => {
        link.addEventListener("click", () => {
            menuBtn.classList.remove("active");
            navOverlay.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
}
