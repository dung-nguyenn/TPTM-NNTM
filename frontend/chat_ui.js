// ===== STATE =====
const API_BASE = "http://localhost:5000";
let sessionId = localStorage.getItem("agribot_session") || "";
let pendingImage = null;
let messageCount = 0;
let sessionStart = Date.now();
let isLoading = false;

// ===== DOM ELEMENTS =====
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messagesList = document.getElementById("messagesList");
const welcomeScreen = document.getElementById("welcomeScreen");
const messagesContainer = document.getElementById("messagesContainer");
const imageInput = document.getElementById("imageInput");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const suggestionsRow = document.getElementById("suggestionsRow");
const suggestionsScroll = document.getElementById("suggestionsScroll");
const charCount = document.getElementById("charCount");
const msgCountEl = document.getElementById("msgCount");
const sessionTimeEl = document.getElementById("sessionTime");
const newChatBtn = document.getElementById("newChatBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const plantInfoSection = document.getElementById("plantInfoSection");
const plantDetails = document.getElementById("plantDetails");
const plantIcon = document.getElementById("plantIcon");
const toast = document.getElementById("toast");

// ===== INIT =====
async function init() {
    await ensureSession();
    setupEventListeners();
    startSessionTimer();
    loadInitialSuggestions();
}

async function ensureSession() {
    if (!sessionId) {
        try {
            const res = await fetch(`${API_BASE}/api/session`, { method: "POST" });
            const data = await res.json();
            sessionId = data.session_id;
            localStorage.setItem("agribot_session", sessionId);
            if (data.suggestions) renderSuggestions(data.suggestions);
        } catch (e) {
            console.warn("Could not create session:", e);
        }
    }
}

function loadInitialSuggestions() {
    const defaults = [
        "🌱 Cách trồng cà chua tại nhà?",
        "💧 Lúa bị vàng lá phải làm sao?",
        "🐛 Cây bị sâu ăn lá - cách xử lý?",
        "🌿 Cách bón phân cho rau cải?",
        "☀️ Mùa nào trồng dưa hấu?",
    ];
    renderSuggestions(defaults);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Send on Enter
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener("input", () => {
        // Auto-resize
        messageInput.style.height = "auto";
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + "px";
        // Char count
        const len = messageInput.value.length;
        charCount.textContent = `${len}/2000`;
        // Enable/disable send
        sendBtn.disabled = len === 0 && !pendingImage;
    });

    sendBtn.addEventListener("click", sendMessage);

    // Image upload
    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("⚠️ Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
            return;
        }
        pendingImage = file;
        const url = URL.createObjectURL(file);
        imagePreview.src = url;
        imagePreviewContainer.style.display = "block";
        sendBtn.disabled = false;
        showToast("📸 Ảnh đã sẵn sàng — nhập mô tả hoặc gửi ngay");
    });

    removeImageBtn.addEventListener("click", clearImage);

    newChatBtn.addEventListener("click", startNewChat);

    // Sidebar toggle
    sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
    mobileMenuBtn.addEventListener("click", () => sidebar.classList.toggle("mobile-open"));

    // Quick topic buttons
    document.querySelectorAll(".topic-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const query = btn.dataset.query;
            messageInput.value = query;
            messageInput.dispatchEvent(new Event("input"));
            sidebar.classList.remove("mobile-open");
            sendMessage();
        });
    });

    // Close sidebar on outside click (mobile)
    messagesContainer.addEventListener("click", () => {
        if (window.innerWidth <= 768) sidebar.classList.remove("mobile-open");
    });
}

// ===== SEND MESSAGE =====
async function sendMessage() {
    if (isLoading) return;
    const text = messageInput.value.trim();
    if (!text && !pendingImage) return;

    // Show welcome → chat view
    if (welcomeScreen.style.display !== "none") {
        welcomeScreen.style.display = "none";
    }

    // Display user message
    addMessage("user", text || "📸 [Gửi ảnh để phân tích bệnh]");
    messageInput.value = "";
    messageInput.style.height = "auto";
    charCount.textContent = "0/2000";
    sendBtn.disabled = true;
    messageCount++;
    msgCountEl.textContent = messageCount;
    suggestionsRow.style.display = "none";

    // Show typing indicator
    const typingId = showTyping();
    isLoading = true;

    try {
        let responseData;
        if (pendingImage) {
            responseData = await sendImageMessage(text, pendingImage);
            clearImage();
        } else {
            responseData = await sendTextMessage(text);
        }

        removeTyping(typingId);
        addMessage("bot", responseData.response);
        messageCount++;
        msgCountEl.textContent = messageCount;

        // Update crop context in sidebar
        if (responseData.detected_crop) {
            updatePlantSidebar(responseData.detected_crop);
        }

        // Show suggestions
        if (responseData.suggestions && responseData.suggestions.length) {
            renderSuggestions(responseData.suggestions);
        }

    } catch (err) {
        removeTyping(typingId);
        addMessage("bot", "⚠️ **Lỗi kết nối**: Không thể kết nối đến server. Hãy đảm bảo backend đang chạy tại `localhost:5000`.\n\nChạy lệnh: `python backend/app.py`");
        console.error("Send error:", err);
    } finally {
        isLoading = false;
        sendBtn.disabled = messageInput.value.length === 0;
    }
}

async function sendTextMessage(text) {
    await ensureSession();
    const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem("agribot_session", sessionId);
    }
    return data;
}

async function sendImageMessage(text, imageFile) {
    await ensureSession();
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("message", text);
    formData.append("image", imageFile);

    const res = await fetch(`${API_BASE}/api/chat/image`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.session_id) {
        sessionId = data.session_id;
        localStorage.setItem("agribot_session", sessionId);
    }
    return data;
}

// ===== UI HELPERS =====
function addMessage(role, content) {
    const div = document.createElement("div");
    div.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = role === "bot" ? "🌿" : "👤";

    const msgContent = document.createElement("div");
    msgContent.className = "msg-content";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = renderMarkdown(content);

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = formatTime(new Date());

    msgContent.appendChild(bubble);
    msgContent.appendChild(time);
    div.appendChild(avatar);
    div.appendChild(msgContent);
    messagesList.appendChild(div);
    scrollToBottom();
}

function showTyping() {
    const id = "typing-" + Date.now();
    const div = document.createElement("div");
    div.className = "message bot typing-indicator";
    div.id = id;
    div.innerHTML = `
        <div class="msg-avatar">🌿</div>
        <div class="msg-content">
            <div class="msg-bubble">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
        </div>`;
    messagesList.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function renderSuggestions(suggestions) {
    suggestionsScroll.innerHTML = "";
    suggestions.forEach(s => {
        const chip = document.createElement("button");
        chip.className = "suggestion-chip";
        chip.textContent = s;
        chip.addEventListener("click", () => {
            messageInput.value = s.replace(/^[^\w\s]+\s/, "");
            messageInput.dispatchEvent(new Event("input"));
            sendMessage();
        });
        suggestionsScroll.appendChild(chip);
    });
    suggestionsRow.style.display = "block";
}

function updatePlantSidebar(cropId) {
    const cropMap = {
        "lua": { icon: "🌾", name: "Lúa", desc: "Cây ngũ cốc chủ lực của VN" },
        "ca_chua": { icon: "🍅", name: "Cà chua", desc: "Rau ăn quả phổ biến" },
        "bap": { icon: "🌽", name: "Bắp (Ngô)", desc: "Cây lương thực quan trọng" },
        "rau_muong": { icon: "🥬", name: "Rau muống", desc: "Rau ăn lá phổ biến" },
        "dua_hau": { icon: "🍉", name: "Dưa hấu", desc: "Cây ăn quả nhiệt đới" },
        "ca_phe": { icon: "☕", name: "Cà phê", desc: "Cây công nghiệp xuất khẩu" },
        "tieu": { icon: "🌶️", name: "Hồ tiêu", desc: "Gia vị quý của VN" },
        "xoai": { icon: "🥭", name: "Xoài", desc: "Cây ăn quả nhiều dinh dưỡng" },
        "rau_cai": { icon: "🥦", name: "Rau cải", desc: "Nhóm rau ăn lá đa dạng" },
        "khoai_lang": { icon: "🍠", name: "Khoai lang", desc: "Cây củ dễ trồng" },
    };

    const info = cropMap[cropId];
    if (!info) return;

    plantIcon.textContent = info.icon;
    plantDetails.innerHTML = `<strong>${info.name}</strong>${info.desc}`;
    plantInfoSection.style.display = "block";
}

function clearImage() {
    pendingImage = null;
    imageInput.value = "";
    imagePreviewContainer.style.display = "none";
    if (imagePreview.src) URL.revokeObjectURL(imagePreview.src);
    imagePreview.src = "";
    sendBtn.disabled = messageInput.value.length === 0;
}

async function startNewChat() {
    if (!confirm("Bắt đầu cuộc trò chuyện mới? Lịch sử sẽ bị xóa.")) return;

    try {
        if (sessionId) {
            await fetch(`${API_BASE}/api/session`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId })
            });
        }
    } catch (e) { /* ignore */ }

    localStorage.removeItem("agribot_session");
    sessionId = "";
    messagesList.innerHTML = "";
    welcomeScreen.style.display = "flex";
    clearImage();
    messageCount = 0;
    msgCountEl.textContent = "0";
    sessionStart = Date.now();
    plantInfoSection.style.display = "none";
    suggestionsRow.style.display = "none";

    await ensureSession();
    loadInitialSuggestions();
    showToast("🌱 Cuộc trò chuyện mới đã bắt đầu!");
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(date) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function startSessionTimer() {
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        sessionTimeEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }, 1000);
}

// ===== MARKDOWN RENDERER =====
function renderMarkdown(text) {
    if (!text) return "";
    let html = text
        // Headers
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Code inline
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // Horizontal rule
        .replace(/^---$/gm, "<hr>")
        // Blockquote
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        // Unordered list items
        .replace(/^[\*\-] (.+)$/gm, "<li>$1</li>")
        // Ordered list items
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
        // Paragraphs (double newline)
        .replace(/\n\n/g, "</p><p>")
        // Single newline
        .replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
}

// ===== START =====
init();
