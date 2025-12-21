const params = new URLSearchParams(window.location.search);
const username = params.get("user");
if (!username) window.location.href = "index.html";
let currentPeriod = "1month";
let selectedAccentColor = "#bb86fc";
let selectedFormat = "story";
let chartsToInclude = ["artists", "tracks"];
let elements = {};
let globalTopArtistImage = "";
let spotifyTokenCache = null;
let cachedData = { artists: [], tracks: [] };
async function carregarTudo() {
    elements = {
        btnInfo: document.getElementById("btnInfo"),
        disclaimerModal: document.getElementById("disclaimerModal"),
        bannerBackground: document.getElementById("bannerBackground"),
        userFoto: document.getElementById("userFoto"),
        userName: document.getElementById("userName"),
        userScrobbles: document.getElementById("userScrobbles"),
        scrobblesPerDay: document.getElementById("scrobblesPerDay"),
        monthlyLabel: document.querySelector(".monthly-label"),
        glider: document.querySelector(".toggle-glider"),
        formatModal: document.getElementById("formatPickerModal"),
        colorModal: document.getElementById("colorPickerModal"),
        columnModal: document.getElementById("columnPickerModal"),
        closeBtns: document.querySelectorAll(".close-button"),
        genReportBtn: document.getElementById("btnGerarRelatorio"),
        formatOptions: document.querySelectorAll(".format-option"),
        colorOptions: document.querySelectorAll(".color-option"),
        chartColOptions: document.querySelectorAll(".chart-col-option"),
        confirmColumnsBtn: document.getElementById("confirmColumnsBtn"),
        storyCard: document.getElementById("storyCard"),
        storyUserImg: document.getElementById("storyUserImg"),
        storyTitle: document.getElementById("storyTitle"),
        storySubtitle: document.getElementById("storySubtitle"),
        storyScrobblesValue: document.getElementById("storyScrobblesValue"),
        storyScrobblesLabel: document.getElementById("storyScrobblesLabel"),
        storyDisclaimer: document.getElementById("storyDisclaimer"),
        storyCol1Title: document.getElementById("storyCol1Title"),
        storyCol1List: document.getElementById("storyCol1List"),
        storyCol2Title: document.getElementById("storyCol2Title"),
        storyCol2List: document.getElementById("storyCol2List"),
        squareCard: document.getElementById("squareCardV2"),
        sqUserImg: document.getElementById("sqUserImg"),
        sqUsername: document.getElementById("sqUsername"),
        sqReportTitle: document.getElementById("sqReportTitle"),
        sqCol1Title: document.getElementById("sqCol1Title"),
        sqCol1List: document.getElementById("sqCol1List"),
        sqCol2Title: document.getElementById("sqCol2Title"),
        sqCol2List: document.getElementById("sqCol2List"),
        sqScrobblesLabel: document.getElementById("sqScrobblesLabel"),
        sqScrobblesValue: document.getElementById("sqScrobblesValue"),
    };
    configurarEventosHub();
    configurarTogglePeriodo();
    await buscarPerfil();
    atualizarDadosDoPeriodo(!0);
}
function configurarTogglePeriodo() {
    const buttons = document.querySelectorAll(".toggle-option");
    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const clickedButton = e.currentTarget;
            buttons.forEach((b) => b.classList.remove("active"));
            clickedButton.classList.add("active");
            currentPeriod = clickedButton.getAttribute("data-period");
            moveGlider(clickedButton);
            atualizarDadosDoPeriodo(!1);
        });
    });
}
function moveGlider(targetButton) {
    if (!elements.glider || !targetButton) return;
    const parentRect = targetButton.parentElement.getBoundingClientRect();
    const targetRect = targetButton.getBoundingClientRect();
    const offsetLeft = targetRect.left - parentRect.left + targetButton.parentElement.scrollLeft;
    elements.glider.style.width = `${targetButton.offsetWidth}px`;
    elements.glider.style.transform = `translateX(${offsetLeft}px)`;
}
async function atualizarDadosDoPeriodo(isInitialLoad = !1) {
    let reportSubtitle = "";
    let labelText = "";
    let scrobblesLabel = "";
    if (currentPeriod === "7day") {
        reportSubtitle = "Last 7 Days";
        labelText = "Calculated from last 7 days";
        scrobblesLabel = "Weekly Time";
    } else if (currentPeriod === "1month") {
        reportSubtitle = "Last 30 Days";
        labelText = "Calculated from last 30 days";
        scrobblesLabel = "Monthly Time";
    } else if (currentPeriod === "12month") {
        reportSubtitle = "Last 365 Days";
        labelText = "Calculated from last 12 months";
        scrobblesLabel = "Annual Time";
    }
    if (elements.storySubtitle) elements.storySubtitle.textContent = reportSubtitle;
    if (elements.sqReportTitle) elements.sqReportTitle.textContent = reportSubtitle;
    if (elements.storyScrobblesLabel) elements.storyScrobblesLabel.textContent = scrobblesLabel;
    if (elements.sqScrobblesLabel) elements.sqScrobblesLabel.textContent = scrobblesLabel;
    if (elements.monthlyLabel) elements.monthlyLabel.textContent = labelText;
    if (elements.storyDisclaimer) elements.storyDisclaimer.textContent = labelText;
    resetarChartsParaSkeleton();
    globalTopArtistImage = "";
    atualizarBanner("");
    await calcularTempoOuvido();
    if (isInitialLoad) {
        const activeButton = document.querySelector(".toggle-option.active");
        if (activeButton) setTimeout(() => moveGlider(activeButton), 100);
    }
}
function resetarChartsParaSkeleton() {
    const skeletonTop1 = `
        <div class="chart-item skeleton top-1">
            <div class="cover-placeholder" style="background: #333;"></div>
            <span class="skeleton-text" style="width: 60%;"></span>
        </div>`;
    const skeletonItem = `<div class="chart-item skeleton"></div>`;
    document.querySelectorAll(".lista-top").forEach((el) => {
        el.innerHTML = skeletonTop1 + skeletonItem.repeat(9);
    });
    if (elements.userScrobbles) elements.userScrobbles.innerHTML = "----";
    if (elements.scrobblesPerDay) elements.scrobblesPerDay.innerHTML = "--";
}
async function obterTokenSpotify() {
    if (spotifyTokenCache) return spotifyTokenCache;
    try {
        const res = await fetch("/api/spotify-token");
        const data = await res.json();
        if (data.access_token) {
            spotifyTokenCache = data.access_token;
            return data.access_token;
        }
    } catch (e) {
        console.warn("Falha token Spotify:", e);
    }
    return null;
}
async function buscarImagemSpotify(artist, trackName, type) {
    const token = await obterTokenSpotify();
    if (!token) return null;
    const cleanArtist = encodeURIComponent(artist);
    const cleanTrack = trackName ? encodeURIComponent(trackName.split(" - ")[0].split("(")[0]) : "";
    let query = "";
    let searchType = "";
    if (type === "artist") {
        query = `q=artist:"${cleanArtist}"`;
        searchType = "artist";
    } else {
        query = `q=track:"${cleanTrack}" artist:"${cleanArtist}"`;
        searchType = "track";
    }
    try {
        const url = `https://api.spotify.com/v1/search?${query}&type=${searchType}&limit=1`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (type === "artist" && data.artists?.items?.length > 0) {
            return data.artists.items[0].images[0]?.url;
        } else if (type === "track" && data.tracks?.items?.length > 0) {
            return data.tracks.items[0].album.images[0]?.url;
        }
    } catch (e) {
        return null;
    }
    return null;
}
async function buscarPerfil() {
    try {
        const url = `/api/?method=user.getinfo&user=${username}`;
        const res = await fetch(url);
        const data = await res.json();
        const user = data.user;
        const displayName = user.realname || user.name;
        elements.userName.textContent = displayName;
        elements.storyTitle.textContent = displayName;
        elements.sqUsername.textContent = displayName;
        elements.userName.classList.remove("skeleton");
        const img = user.image.find((i) => i.size === "extralarge") || user.image.pop();
        if (img && img["#text"]) {
            elements.userFoto.src = img["#text"];
            elements.storyUserImg.crossOrigin = "anonymous";
            elements.storyUserImg.src = img["#text"];
            elements.sqUserImg.crossOrigin = "anonymous";
            elements.sqUserImg.src = img["#text"];
        }
        elements.userFoto.classList.remove("skeleton");
    } catch (error) {
        elements.userName.textContent = username;
        elements.userName.classList.remove("skeleton");
    }
}
async function calcularTempoOuvido() {
    try {
        let totalSeconds = 0;
        let artistMap = {};
        let trackList = [];
        const limit = 1000;
        const url = `/api/?method=user.gettoptracks&user=${username}&limit=${limit}&period=${currentPeriod}`;
        const res = await fetch(url);
        const data = await res.json();
        // rest of logic unchanged (omitted for brevity)
    } catch (e) {
        console.error(e);
    }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", carregarTudo);
else carregarTudo();
