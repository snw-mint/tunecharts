const params = new URLSearchParams(window.location.search);
const user1 = params.get("user1");
const user2 = params.get("user2");
if (!user1 || !user2) window.location.href = "index.html";
let exportData = null;
let selectedFormat = "story";
let selectedColor = "#bb86fc";
const elements = {
    loadingState: document.getElementById("loadingState"),
    u1Img: document.getElementById("u1Img"),
    u1Name: document.getElementById("u1Name"),
    u1Scrobbles: document.getElementById("u1Scrobbles"),
    u1List: document.getElementById("u1List"),
    u1ListTitle: document.getElementById("u1ListTitle"),
    u2Img: document.getElementById("u2Img"),
    u2Name: document.getElementById("u2Name"),
    u2Scrobbles: document.getElementById("u2Scrobbles"),
    u2List: document.getElementById("u2List"),
    u2ListTitle: document.getElementById("u2ListTitle"),
    scoreRing: document.getElementById("scoreRing"),
    scoreVal: document.getElementById("scoreVal"),
    matchTitle: document.getElementById("matchTitle"),
    commonList: document.getElementById("commonList"),
    btnDownload: document.getElementById("btnDownload"),
    formatModal: document.getElementById("formatModal"),
    colorPickerModal: document.getElementById("colorPickerModal"),
    exportContainer:
        document.querySelector(".hidden-export-container") || document.getElementById("hidden-export-container"),
};
function getMatchInfo(score) {
    let title = "VERY LOW";
    let rankClass = "rank-very-low";
    if (score >= 10) {
        title = "LOW";
        rankClass = "rank-low";
    }
    if (score >= 30) {
        title = "MEDIUM";
        rankClass = "rank-medium";
    }
    if (score >= 50) {
        title = "HIGH";
        rankClass = "rank-high";
    }
    if (score >= 70) {
        title = "VERY HIGH";
        rankClass = "rank-very-high";
    }
    if (score >= 90) {
        title = "SUPER";
        rankClass = "rank-super";
    }
    if (score === 100) {
        title = "PERFECT!";
        rankClass = "rank-perfect";
    }
    return { title, rankClass };
}
async function startMatcher() {
    try {
        const limit = 100;
        const period = "overall";
        const [info1, info2, top1, top2] = await Promise.all([
            fetch(`/api/?method=user.getinfo&user=${user1}`)
                .then((r) => r.json())
                .catch((e) => ({ error: !0 })),
            fetch(`/api/?method=user.getinfo&user=${user2}`)
                .then((r) => r.json())
                .catch((e) => ({ error: !0 })),
            fetch(`/api/?method=user.gettopartists&user=${user1}&limit=${limit}&period=${period}`)
                .then((r) => r.json())
                .catch((e) => ({ topartists: { artist: [] } })),
            fetch(`/api/?method=user.gettopartists&user=${user2}&limit=${limit}&period=${period}`)
                .then((r) => r.json())
                .catch((e) => ({ topartists: { artist: [] } })),
        ]);
        if (info1.error || !info1.user) throw new Error("User 1 not found.");
        if (info2.error || !info2.user) throw new Error("User 2 not found.");
        const profile1 = processProfile(info1, user1);
        const profile2 = processProfile(info2, user2);
        const list1 = top1.topartists?.artist || [];
        const list2 = top2.topartists?.artist || [];
        const analysis = analyzeTaste(list1, list2);
        exportData = { p1: profile1, p2: profile2, match: analysis };
        if (elements.loadingState) elements.loadingState.style.display = "none";
        updateDashboard(profile1, profile2, analysis);
    } catch (err) {
        console.error(err);
        if (elements.loadingState)
            elements.loadingState.innerHTML = `<div style="padding:20px; text-align:center;">Error: ${err.message}<br><a href="index.html">Try again</a></div>`;
    }
}
function processProfile(data, fallbackName) {
    const u = data.user;
    const count = parseInt(u.playcount || 0);
    let formattedCount = count > 10000 ? (count / 1000).toFixed(1) + "k" : count.toLocaleString();
    let imgUrl = "https://lastfm.freetls.fastly.net/i/u/avatar170s/818148bf682d429dc215c1705eb27b48";
    if (u.image && u.image.length > 2 && u.image[3]["#text"]) imgUrl = u.image[3]["#text"];
    return { name: u.realname || u.name || fallbackName, username: u.name, scrobbles: formattedCount, image: imgUrl };
}
function analyzeTaste(list1, list2) {
    if (!Array.isArray(list1)) list1 = [];
    if (!Array.isArray(list2)) list2 = [];
    const map1 = new Map();
    const map2 = new Map();
    list1.forEach((a, i) => {
        if (a && a.name) map1.set(a.name.toLowerCase(), { rank: i + 1, name: a.name });
    });
    list2.forEach((a, i) => {
        if (a && a.name) map2.set(a.name.toLowerCase(), { rank: i + 1, name: a.name });
    });
    let common = [];
    let unique1 = [];
    let unique2 = [];
    let points = 0;
    map1.forEach((val, key) => {
        if (map2.has(key)) {
            const val2 = map2.get(key);
            const strength = (101 - val.rank + (101 - val2.rank)) / 2;
            points += strength;
            common.push({ name: val.name, strength: strength });
        } else {
            unique1.push(val);
        }
    });
    map2.forEach((val, key) => {
        if (!map1.has(key)) unique2.push(val);
    });
    let pct = (points / 1500) * 100;
    if (common.length > 20) pct += 10;
    else if (common.length > 10) pct += 5;
    pct = Math.min(100, Math.max(0, Math.round(pct)));
    if (common.length === 0) pct = 0;
    common.sort((a, b) => b.strength - a.strength);
    unique1.sort((a, b) => a.rank - b.rank);
    unique2.sort((a, b) => a.rank - b.rank);
    return { score: pct, common: common.slice(0, 5), unique1: unique1.slice(0, 7), unique2: unique2.slice(0, 7) };
}
function updateDashboard(p1, p2, data) {
    fillProfileDOM(elements.u1Img, elements.u1Name, elements.u1Scrobbles, p1);
    fillProfileDOM(elements.u2Img, elements.u2Name, elements.u2Scrobbles, p2);
    elements.u1ListTitle.textContent = `${p1.username}'s Vibe`;
    elements.u2ListTitle.textContent = `${p2.username}'s Vibe`;
    renderList(elements.u1List, data.unique1, "Unique");
    renderList(elements.u2List, data.unique2, "Unique");
    renderList(elements.commonList, data.common, "Shared");
    const info = getMatchInfo(data.score);
    elements.matchTitle.textContent = info.title;
    elements.matchTitle.classList.remove("skeleton-text");
    elements.scoreRing.classList.remove("skeleton");
    elements.scoreRing.classList.add(info.rankClass);
    if (elements.btnDownload) {
        elements.btnDownload.textContent = "Share Result";
        elements.btnDownload.disabled = !1;
    }
    animateValue(elements.scoreVal, 0, data.score, 1500);
}
function fillProfileDOM(imgEl, nameEl, statEl, data) {
    imgEl.crossOrigin = "Anonymous";
    imgEl.src = data.image;
    imgEl.classList.remove("skeleton");
    nameEl.textContent = data.name;
    nameEl.classList.remove("skeleton-text");
    statEl.textContent = `${data.scrobbles} scrobbles`;
    statEl.classList.remove("skeleton-text-sm");
}
function renderList(container, items, type) {
    let html = "";
    if (!items || items.length === 0) {
        html = `<div style="text-align:center; padding:15px; color:#666; font-size:0.9em;">Nothing here.</div>`;
    } else {
        items.forEach((item) => {
            const badgeHtml =
                type === "Shared"
                    ? `<span class="t-badge">SHARED</span>`
                    : `<span class="t-badge-unique">#${item.rank}</span>`;
            html += `<div class="t-row"><span class="t-name">${item.name}</span>${badgeHtml}</div>`;
        });
    }
    container.innerHTML = html;
}
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
if (elements.btnDownload) {
    elements.btnDownload.addEventListener("click", () => {
        if (!exportData) return;
        if (elements.formatModal) elements.formatModal.style.display = "flex";
    });
}
function selectFormat(fmt) {
    selectedFormat = fmt;
    if (elements.formatModal) elements.formatModal.style.display = "none";
    const colorModal = document.getElementById("colorPickerModal");
    if (colorModal) colorModal.style.display = "flex";
    else generateFinalImage();
}
function selectColor(color) {
    selectedColor = color;
    const colorModal = document.getElementById("colorPickerModal");
    if (colorModal) colorModal.style.display = "none";
    generateFinalImage();
}
window.generateExport = function (format) {
    selectFormat(format);
};
async function generateFinalImage() {
    const btn = elements.btnDownload;
    const originalText = btn.textContent;
    btn.textContent = "Creating...";
    btn.disabled = !0;
    try {
        const { p1, p2, match } = exportData;
        const info = getMatchInfo(match.score);
        const pre = selectedFormat === "square" ? "sq-" : "st-";
        const cardId = selectedFormat === "square" ? "exportSquare" : "exportStory";
        const cardElement = document.getElementById(cardId);
        if (!cardElement) throw new Error("Export card not found");
        const mask = document.createElement("div");
        mask.id = "export-mask";
        mask.style.position = "fixed";
        mask.style.inset = "0";
        mask.style.width = "100%";
        mask.style.height = "100%";
        mask.style.background = "radial-gradient(circle at top right, #2a0040, #0f0f0f 60%)";
        mask.style.zIndex = "-50";
        document.body.appendChild(mask);
        const container = elements.exportContainer;
        if (container) {
            container.style.display = "block";
            container.style.visibility = "visible";
            container.style.position = "fixed";
            container.style.top = "0";
            container.style.left = "0";
            container.style.zIndex = "-9999";
        }
        const img1 = document.getElementById(`${pre}p1-img`);
        const img2 = document.getElementById(`${pre}p2-img`);
        img1.crossOrigin = "Anonymous";
        img2.crossOrigin = "Anonymous";
        const ts = new Date().getTime();
        img1.src = p1.image + (p1.image.includes("?") ? "&" : "?") + "t=" + ts;
        img2.src = p2.image + (p2.image.includes("?") ? "&" : "?") + "t=" + ts;
        await Promise.all([
            new Promise((r) => {
                if (img1.complete) r();
                else img1.onload = r;
                img1.onerror = r;
            }),
            new Promise((r) => {
                if (img2.complete) r();
                else img2.onload = r;
                img2.onerror = r;
            }),
        ]);
        document.getElementById(`${pre}p1-name`).textContent = p1.name;
        document.getElementById(`${pre}p2-name`).textContent = p2.name;
        document.getElementById(`${pre}stat-user1`).textContent = p1.username;
        document.getElementById(`${pre}stat-val1`).textContent = `${p1.scrobbles}`;
        document.getElementById(`${pre}stat-user2`).textContent = p2.username;
        document.getElementById(`${pre}stat-val2`).textContent = `${p2.scrobbles}`;
        document.getElementById(`${pre}score-val`).textContent = match.score;
        const crown = document.getElementById(`${pre}crown`);
        if (crown) crown.style.display = match.score === 100 ? "block" : "none";
        document.getElementById(`${pre}match-title`).textContent = info.title;
        if (selectedFormat === "square") {
            const sqTextEl = document.getElementById("sq-shared-text");
            if (sqTextEl) {
                if (match.common.length > 0) {
                    const topArtists = match.common
                        .slice(0, 3)
                        .map((a) => `<span>${a.name}</span>`)
                        .join(", ");
                    sqTextEl.innerHTML = `You both vibe to ${topArtists}.`;
                } else {
                    sqTextEl.innerHTML = `You both have distinct musical tastes.`;
                }
            }
        }
        if (selectedFormat === "story") {
            const listCont = document.getElementById("st-common-list-container");
            let listHtml = `<div class="list-header">SHARED ARTISTS</div>`;
            if (match.common.length === 0)
                listHtml +=
                    "<div style='text-align:center; padding:30px; font-size:1.5rem; color:#666'>No shared artists found.</div>";
            else
                match.common.slice(0, 5).forEach((m, i) => {
                    listHtml += `<div class="list-row ${i === 0 ? "top-1" : ""}"><strong>${m.name}</strong><span class="badge-shared">SHARED</span></div>`;
                });
            listCont.innerHTML = listHtml;
        }
        aplicarCoresMatch(cardElement, selectedColor, selectedFormat, info.rankClass);
        await new Promise((r) => setTimeout(r, 500));
        const canvas = await html2canvas(cardElement, {
            scale: 1.5,
            useCORS: !0,
            allowTaint: !0,
            backgroundColor: "#0f0f0f",
            logging: !1,
            width: 1080,
            height: selectedFormat === "square" ? 1080 : 1920,
        });
        const link = document.createElement("a");
        link.download = `TuneCharts-Match-${user1}-vs-${user2}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        btn.textContent = "Saved!";
    } catch (e) {
        console.error("Export Error:", e);
        alert("Error generating image.");
    } finally {
        if (elements.exportContainer) {
            elements.exportContainer.style.display = "none";
            elements.exportContainer.style.left = "-10000px";
        }
        const mask = document.getElementById("export-mask");
        if (mask) mask.remove();
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = !1;
        }, 2000);
    }
}
function aplicarCoresMatch(card, color, format, rankClass) {
    card.style.background = `radial-gradient(circle at top right, ${color}66, #0f0f0f 60%)`;
    const title = card.querySelector(".match-title");
    if (title) title.style.textShadow = `0 0 40px ${color}66`;
    const ring = card.querySelector(".score-circle");
    if (ring) {
        ring.style.borderColor = "#fff";
        ring.style.boxShadow = `0 0 100px ${color}44`;
    }
    card.querySelectorAll(".p-img").forEach((img) => {
        img.style.borderColor = color;
    });
    card.querySelectorAll(".stat-pill").forEach((el) => {
        el.style.color = color;
        el.style.borderColor = color + "44";
        el.style.backgroundColor = color + "22";
    });
    if (format === "story") {
        card.querySelectorAll(".list-row.top-1").forEach((el) => {
            el.style.borderColor = color;
            el.style.backgroundColor = color + "33";
        });
        card.querySelectorAll(".list-row").forEach((el) => {
            if (!el.classList.contains("top-1")) {
                el.style.borderColor = color + "33";
            }
        });
        card.querySelectorAll(".badge-shared").forEach((el) => {
            el.style.color = color;
        });
    }
    if (format === "square") {
        const sub = card.querySelector(".match-subtitle");
        if (sub) {
            sub.querySelectorAll("span").forEach((s) => (s.style.color = color));
        }
    }
}
window.onclick = function (event) {
    if (event.target == elements.formatModal) elements.formatModal.style.display = "none";
    if (event.target == elements.colorPickerModal) elements.colorPickerModal.style.display = "none";
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startMatcher);
else startMatcher();
