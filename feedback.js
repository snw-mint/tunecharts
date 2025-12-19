function openFeedback(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById("feedbackModal");
    const form = document.getElementById("feedbackForm");
    const btn = document.getElementById("btnSendFeedback");
    const boxForm = document.getElementById("formContainer");
    const boxSuccess = document.getElementById("successContainer");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => modal.classList.add("feedback-active"), 10);
        if (boxForm) boxForm.style.display = "block";
        if (boxSuccess) boxSuccess.style.display = "none";
        if (form) form.reset();
        if (btn) {
            btn.disabled = !1;
            btn.textContent = "Send Feedback";
        }
    }
}
function closeFeedback() {
    const modal = document.getElementById("feedbackModal");
    if (modal) {
        modal.classList.remove("feedback-active");
        setTimeout(() => (modal.style.display = "none"), 300);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("feedbackModal");
    const form = document.getElementById("feedbackForm");
    if (window && modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) closeFeedback();
        });
    }
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("btnSendFeedback");
            if (btn) {
                btn.disabled = !0;
                btn.textContent = "Sending...";
            }
            try {
                const res = await fetch(e.target.action, {
                    method: form.method,
                    body: new FormData(e.target),
                    headers: { Accept: "application/json" },
                });
                if (res.ok) {
                    document.getElementById("formContainer").style.display = "none";
                    document.getElementById("successContainer").style.display = "flex";
                    setTimeout(closeFeedback, 2500);
                } else {
                    throw new Error("Erro");
                }
            } catch (err) {
                alert("Erro ao enviar. Tente novamente.");
                if (btn) {
                    btn.disabled = !1;
                    btn.textContent = "Send Feedback";
                }
            }
        });
    }
});
