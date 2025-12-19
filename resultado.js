const params = new URLSearchParams(window.location.search);
const username = params.get("user");
if (!username) window.location.href = "index.html";
let currentPeriod = "1month";
let selectedAccentColor = "#bb86fc";
let selectedFormat = "story";
let chartsToInclude = ["artists", "tracks"];
let elements = {};
let globalTopArtistImage = "";
let cachedData = { artists: [], tracks: [], albums: [] };
let spotifyTokenCache = null;
async function carregarTudo() {
    elements = {
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
    const date = new Date();
    let reportSubtitle = "";
    let labelText = "";
    let scrobblesLabel = "";
    if (currentPeriod === "7day") {
        reportSubtitle = "Last 7 Days";
        labelText = "In the last 7 days";
        scrobblesLabel = "Weekly Scrobbles";
    } else if (currentPeriod === "1month") {
        reportSubtitle = `Last 30 Days`;
        labelText = "In the last 30 days";
        scrobblesLabel = "Monthly Scrobbles";
    } else if (currentPeriod === "12month") {
        reportSubtitle = `Last 12 Months`;
        labelText = "In the last 12 months";
        scrobblesLabel = "Annual Scrobbles";
    }
    elements.storySubtitle.textContent = reportSubtitle;
    elements.sqReportTitle.textContent = reportSubtitle;
    elements.storyScrobblesLabel.textContent = scrobblesLabel;
    elements.sqScrobblesLabel.textContent = scrobblesLabel;
    if (elements.monthlyLabel) elements.monthlyLabel.textContent = labelText;
    if (elements.storyDisclaimer) elements.storyDisclaimer.textContent = labelText;
    resetarChartsParaSkeleton();
    globalTopArtistImage = "";
    atualizarBanner("");
    await Promise.all([
        buscarScrobblesDoPeriodo(),
        buscarCharts("user.gettopartists", "artist", "cardArtists"),
        buscarCharts("user.gettoptracks", "track", "cardTracks"),
        buscarCharts("user.gettopalbums", "album", "cardAlbums"),
    ]);
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
async function buscarImagemSpotify(artist, albumOrTrackName, type) {
    const token = await obterTokenSpotify();
    if (!token) return null;
    const cleanArtist = encodeURIComponent(artist);
    const cleanTrack = encodeURIComponent(albumOrTrackName.split(" - ")[0].split("(")[0]);
    let query = "";
    let searchType = "";
    if (type === "artist") {
        query = `q=artist:"${cleanArtist}"`;
        searchType = "artist";
    } else if (type === "album") {
        query = `q=album:"${cleanTrack}" artist:"${cleanArtist}"`;
        searchType = "album";
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
        } else if (type === "album" && data.albums?.items?.length > 0) {
            return data.albums.items[0].images[0]?.url;
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
async function buscarScrobblesDoPeriodo() {
    try {
        let fromDate = 0;
        let daysDivisor = 1;
        if (currentPeriod === "7day") {
            fromDate = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
            daysDivisor = 7;
        } else if (currentPeriod === "1month") {
            fromDate = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
            daysDivisor = 30;
        } else if (currentPeriod === "12month") {
            fromDate = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
            daysDivisor = 365;
        }
        const url = `/api/?method=user.getrecenttracks&user=${username}&limit=1&from=${fromDate}`;
        const res = await fetch(url);
        const data = await res.json();
        let total = "0";
        if (data.recenttracks && data.recenttracks["@attr"]) total = data.recenttracks["@attr"].total;
        const totalInt = parseInt(total);
        const totalBR = totalInt.toLocaleString("pt-BR");
        const totalUS = totalInt.toLocaleString("en-US");
        elements.userScrobbles.textContent = totalBR;
        if (elements.storyScrobblesValue) elements.storyScrobblesValue.textContent = totalUS;
        if (elements.sqScrobblesValue) elements.sqScrobblesValue.textContent = totalUS;
        const dailyAvg = daysDivisor > 0 ? Math.round(totalInt / daysDivisor) : 0;
        if (elements.scrobblesPerDay) elements.scrobblesPerDay.textContent = dailyAvg.toLocaleString("pt-BR");
    } catch (error) {
        elements.userScrobbles.textContent = "-";
    } finally {
        elements.userScrobbles.classList.remove("skeleton");
        if (elements.scrobblesPerDay) elements.scrobblesPerDay.classList.remove("skeleton");
    }
}
async function buscarCharts(method, type, mainId) {
    try {
        const url = `/api/?method=${method}&user=${username}&limit=10&period=${currentPeriod}`;
        const res = await fetch(url);
        const data = await res.json();
        const rootKey = "top" + type + "s";
        const items = data[rootKey]
            ? Array.isArray(data[rootKey][type])
                ? data[rootKey][type]
                : [data[rootKey][type]]
            : [];
        cachedData[type + "s"] = items;
        const container = document.querySelector(`#${mainId} .lista-top`);
        if (!container) return;
        let htmlMain = "";
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const item = items[i];
            const isTop1 = i === 0;
            let text = item.name;
            let artistName = item.artist ? item.artist.name : "";
            const imgId = `img-${type}-${i}`;
            if (isTop1) {
                let subtitle = "";
                if (type !== "artist")
                    subtitle = `<span style="display:block; font-size: 0.85em; opacity: 0.7; font-weight: normal;">${artistName}</span>`;
                htmlMain += `
                <div class="chart-item top-1">
                    <div id="${imgId}" class="cover-placeholder"></div>
                    <div class="text-content">
                        <span class="rank-number">#1</span>
                        <div>
                            <span>${text}</span>
                            ${subtitle}
                        </div>
                    </div>
                </div>`;
                buscarImagemSpotify(type === "artist" ? text : artistName, type === "artist" ? "" : text, type).then(
                    (spotifyUrl) => {
                        if (spotifyUrl) {
                            const el = document.getElementById(imgId);
                            if (el) el.style.backgroundImage = `url('${spotifyUrl}')`;
                            if (type === "artist") {
                                atualizarBanner(spotifyUrl);
                                globalTopArtistImage = spotifyUrl;
                            }
                        }
                    }
                );
            } else {
                if (type !== "artist") text += ` <span style="opacity:0.6"> - ${artistName}</span>`;
                htmlMain += `<div class="chart-item">#${i + 1} - ${text}</div>`;
            }
        }
        container.innerHTML = htmlMain || "No data.";
    } catch (error) {
        document.querySelector(`#${mainId} .lista-top`).innerHTML = "Error loading.";
    }
}
function atualizarBanner(imgUrl) {
    if (!elements.bannerBackground) return;
    if (imgUrl && imgUrl.length > 0) {
        elements.bannerBackground.style.backgroundImage = `url('${imgUrl}')`;
    } else {
        elements.bannerBackground.style.backgroundImage = "none";
    }
}
function configurarEventosHub() {
    if (!elements.genReportBtn) return;
    elements.genReportBtn.addEventListener("click", () => {
        elements.formatModal.style.display = "flex";
    });
    elements.closeBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const modalId = e.currentTarget.getAttribute("data-modal");
            document.getElementById(modalId).style.display = "none";
        });
    });
    window.addEventListener("click", (e) => {
        if (e.target === elements.colorModal) elements.colorModal.style.display = "none";
        if (e.target === elements.formatModal) elements.formatModal.style.display = "none";
        if (e.target === elements.columnModal) elements.columnModal.style.display = "none";
    });
    elements.formatOptions.forEach((btn) => {
        btn.onclick = (e) => {
            selectedFormat = e.currentTarget.getAttribute("data-format");
            elements.formatModal.style.display = "none";
            elements.columnModal.style.display = "flex";
            setupColumnPicker();
        };
    });
    function setupColumnPicker() {
        const updateSelection = () => {
            chartsToInclude = [];
            elements.chartColOptions.forEach((checkbox) => {
                if (checkbox.checked) chartsToInclude.push(checkbox.getAttribute("data-list"));
            });
            elements.confirmColumnsBtn.disabled = chartsToInclude.length === 0 || chartsToInclude.length > 2;
        };
        elements.chartColOptions.forEach((checkbox) => {
            checkbox.onchange = () => {
                updateSelection();
                if (chartsToInclude.length > 2) {
                    checkbox.checked = !1;
                    updateSelection();
                }
            };
        });
        updateSelection();
    }
    elements.confirmColumnsBtn.onclick = () => {
        if (chartsToInclude.length < 1 || chartsToInclude.length > 2) return;
        elements.columnModal.style.display = "none";
        elements.colorModal.style.display = "flex";
    };
    elements.colorOptions.forEach((btn) => {
        btn.onclick = (e) => {
            elements.colorOptions.forEach((b) => b.classList.remove("selected"));
            e.currentTarget.classList.add("selected");
            selectedAccentColor = e.currentTarget.getAttribute("data-color");
            elements.colorModal.style.display = "none";
            setTimeout(() => gerarImagemFinal(selectedFormat, selectedAccentColor, chartsToInclude), 50);
        };
    });
}
async function gerarImagemFinal(format, accentColor, selectedCharts) {
    const btn = elements.genReportBtn;
    const originalText = btn.textContent;
    btn.textContent = "Generating...";
    btn.disabled = !0;
    let cardElement, cardWidth, cardHeight, col1, col1Title, col1List, col2, col2Title, col2List;
    if (format === "story") {
        cardElement = elements.storyCard;
        cardWidth = 1080;
        cardHeight = 1920;
        col1 = cardElement.querySelector(".story-column:nth-child(1)");
        col1Title = elements.storyCol1Title;
        col1List = elements.storyCol1List;
        col2 = cardElement.querySelector(".story-column:nth-child(2)");
        col2Title = elements.storyCol2Title;
        col2List = elements.storyCol2List;
    } else {
        cardElement = elements.squareCard;
        cardWidth = 1080;
        cardHeight = 1080;
        col1 = cardElement.querySelector(".sq-v2-column:nth-child(1)");
        col1Title = elements.sqCol1Title;
        col1List = elements.sqCol1List;
        col2 = cardElement.querySelector(".sq-v2-column:nth-child(2)");
        col2Title = elements.sqCol2Title;
        col2List = elements.sqCol2List;
    }
    if (selectedCharts.length === 1) {
        const type = selectedCharts[0];
        const data = cachedData[type] || [];
        const title = document.querySelector(`.chart-col-option[data-list="${type}"]`).getAttribute("data-title");
        col1.style.display = "flex";
        col2.style.display = "none";
        if (format === "square") col1.style.width = "100%";
        const limit = format === "story" ? 10 : 5;
        col1Title.textContent = title;
        col1List.innerHTML = formatarListaHTML(data, limit, type, format);
    } else {
        const [type1, type2] = selectedCharts;
        const data1 = cachedData[type1] || [];
        const data2 = cachedData[type2] || [];
        const title1 = document.querySelector(`.chart-col-option[data-list="${type1}"]`).getAttribute("data-title");
        const title2 = document.querySelector(`.chart-col-option[data-list="${type2}"]`).getAttribute("data-title");
        col1.style.display = "flex";
        col2.style.display = "flex";
        if (format === "square") col1.style.width = "50%";
        const limit = format === "story" ? 5 : 6;
        col1Title.textContent = title1;
        col1List.innerHTML = formatarListaHTML(data1, limit, type1, format);
        col2Title.textContent = title2;
        col2List.innerHTML = formatarListaHTML(data2, limit, type2, format);
    }
    try {
        aplicarCoresDinamicas(cardElement, accentColor, format);
        await new Promise((r) => setTimeout(r, 600));
        const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: !0,
            allowTaint: !0,
            backgroundColor: "#0f0f0f",
            width: cardWidth,
            height: cardHeight,
            windowWidth: cardWidth,
            windowHeight: cardHeight,
            logging: !1,
        });
        const link = document.createElement("a");
        link.download = `TuneCharts-${username}-${currentPeriod}-${format}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.textContent = "Done!";
    } catch (err) {
        console.error(err);
        alert("Error generating image: " + err.message);
    } finally {
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = !1;
        }, 2000);
    }
}
function formatarListaHTML(items, limit, type, format) {
    let html = "";
    const list = items || [];
    const itemsToShow = list.slice(0, limit);
    itemsToShow.forEach((item, i) => {
        let artistName = item.artist ? item.artist.name : "";
        let text = item.name;
        if (format === "story") {
            html += `
                <div class="story-item ${i === 0 ? "top-1" : ""}">
                    <span class="story-rank">#${i + 1}</span>
                    <span class="story-text">${text}</span>
                </div>
            `;
        } else {
            if (type !== "artists" && type !== "artist" && artistName) {
                text = `${item.name} - ${artistName}`;
            }
            html += `
                <li class="${i === 0 ? "top-1" : ""}">
                    <span class="sq-v2-rank">#${i + 1}</span>
                    <span class="sq-v2-text">${text}</span>
                </li>
            `;
        }
    });
    return html || "No data.";
}
function aplicarCoresDinamicas(card, accentColor, format) {
    if (format === "story") {
        card.querySelectorAll(".story-subtitle, .story-rank, .stat-label, .stat-disclaimer").forEach(
            (el) => (el.style.color = accentColor)
        );
        card.querySelectorAll(".story-column h3").forEach((el) => (el.style.borderLeftColor = accentColor));
        card.querySelectorAll(".story-stat, .story-item.top-1").forEach((el) => {
            el.style.borderColor = accentColor;
            el.style.backgroundColor = accentColor + "33";
        });
        card.style.background = `
            radial-gradient(circle 700px at top right, ${accentColor}66, transparent),
            #0f0f0f
        `;
        const headerElement = card.querySelector(".story-header");
        if (headerElement) {
            if (globalTopArtistImage) {
                headerElement.style.background = `
                    /* 1. BLUR COLORIDO (INTACTO) */
                    radial-gradient(circle 700px at top right, ${accentColor}66, transparent),

                    /* 2. GRADIENTE PRETO (CORRIGIDO) */
                    /* Começa transparente no topo (0%) e só fica preto sólido no final (100%) */
                    linear-gradient(to bottom, transparent 30%, rgba(15,15,15,0.2) 50%, rgba(15,15,15,0.8) 80%, #0f0f0f 100%),
                    
                    /* 3. OVERLAY ESCURO */
                    linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),

                    /* 4. IMAGEM */
                    url('${globalTopArtistImage}') no-repeat center center / cover
                `;
            } else {
                headerElement.style.background = `radial-gradient(circle 700px at top right, ${accentColor}66, transparent)`;
            }
        }
    } else {
        card.querySelectorAll(".sq-v2-report-title, .sq-v2-list li.top-1 span, .sq-v2-stat-label").forEach(
            (el) => (el.style.color = accentColor)
        );
        card.querySelectorAll(".sq-v2-column h3").forEach((el) => (el.style.borderLeftColor = accentColor));
        card.querySelectorAll(".sq-v2-avatar").forEach((el) => (el.style.borderColor = accentColor));
        card.querySelectorAll(".sq-v2-stat, .sq-v2-list li.top-1").forEach((el) => {
            el.style.borderColor = accentColor;
            el.style.backgroundColor = accentColor + "33";
        });
        card.style.background = `radial-gradient(circle at top right, ${accentColor}66, #0f0f0f 65%)`;
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", carregarTudo);
} else {
    carregarTudo();
}
