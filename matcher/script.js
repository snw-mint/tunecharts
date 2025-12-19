const inputUser1 = document.getElementById("userInput1");
const inputUser2 = document.getElementById("userInput2");
const btnMatch = document.getElementById("btnMatch");
const msgErro = document.getElementById("mensagemErro");
function startMatch() {
    const user1 = inputUser1.value.trim();
    const user2 = inputUser2.value.trim();
    if (user1 === "" || user2 === "") {
        if (msgErro) {
            msgErro.textContent = "Please enter both usernames.";
            msgErro.style.display = "block";
        }
        return;
    }
    if (msgErro) msgErro.textContent = "";
    const originalText = btnMatch.textContent;
    btnMatch.textContent = "Matching...";
    btnMatch.disabled = !0;
    if (typeof gtag === "function") {
        gtag("event", "generate_match", {
            event_category: "Matcher",
            event_label: "Match Submit (Success)",
            match_source: "homepage",
        });
    }
    window.location.href = `result.html?user1=${user1}&user2=${user2}`;
}
if (btnMatch) {
    btnMatch.addEventListener("click", startMatch);
}
function handleEnterKey(evento) {
    if (evento.key === "Enter") {
        startMatch();
    }
}
if (inputUser1) inputUser1.addEventListener("keypress", handleEnterKey);
if (inputUser2) inputUser2.addEventListener("keypress", handleEnterKey);
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
