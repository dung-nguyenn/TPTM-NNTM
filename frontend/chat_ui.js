// ===== STATE =====
const API_BASE = window.location.origin.startsWith("file://") ? "http://localhost:5000" : window.location.origin;
let sessionId = localStorage.getItem("agribot_session") || "";
let pendingImage = null;
let messageCount = 0;
let sessionStart = Date.now();
let isLoading = false;
let currentLanguage = localStorage.getItem("agribot_lang") || "vi";

// ===== WEATHER DATA =====
const WEATHER_PROFILES = {
    "Đồng bằng sông Cửu Long": { temp: "32°C", status: "🌧️ Mưa ẩm kéo dài", desc: "Nhiệt độ 32 độ C, Độ ẩm 92%, Mưa rào rải rác mùa vụ Hè Thu" },
    "Tây Nguyên": { temp: "27°C", status: "⛅ Nhiều mây ẩm cao", desc: "Nhiệt độ 27 độ C, Độ ẩm 85%, Thích hợp bón thúc cà phê" },
    "Đồng bằng sông Hồng": { temp: "34°C", status: "☀️ Nắng nóng oi bức", desc: "Nhiệt độ 34 độ C, Độ ẩm 60%, Cảnh báo bốc hơi nước nhanh trên ruộng" },
    "Bắc Trung Bộ": { temp: "36°C", status: "🔥 Gió Lào khô nóng", desc: "Nhiệt độ 36 độ C, Độ ẩm 45%, Đất bốc hơi mạnh, cần tưới giữ ẩm" },
    "Tây Bắc Bộ": { temp: "24°C", status: "🌧️ Sương mù mưa ẩm", desc: "Nhiệt độ 24 độ C, Độ ẩm 95%, Đề phòng nấm bệnh rỉ sắt rau màu" }
};

// ===== CROPPING CALENDAR DATA =====
const CALENDAR_DATA = {
    "nam": [
        { month: "Tháng 5-6", desc: "🌾 Gieo sạ lúa vụ Hè Thu. Chú ý bón lót lân và cải tạo chua phèn bằng vôi nông nghiệp trước sạ." },
        { month: "Tháng 7-8", desc: "🍉 Thời vụ dưa hấu thu đông. Lót rơm khô kỹ và đề phòng bệnh thối quả do mưa kéo dài." },
        { month: "Tháng 9-10", desc: "🥦 Trồng rau ăn lá (rau cải, xà lách). Tưới nước thường xuyên sáng chiều và bón phân hữu cơ hoai mục." }
    ],
    "trung": [
        { month: "Tháng 5-6", desc: "☕ Bón phân đợt 1 mùa mưa cho cà phê. Sử dụng NPK chuyên dùng kết hợp vi lượng bo và kẽm." },
        { month: "Tháng 7-8", desc: "🌶️ Trồng hồ tiêu đầu mùa mưa. Đảm bảo rãnh thoát nước vườn tiêu thông thoáng để tránh thối cổ rễ." },
        { month: "Tháng 9-10", desc: "🌽 Trồng ngô (bắp) xuân hè trên đất đồi. Làm đất kỹ, bón lót phân chuồng đầy đủ để giữ nước." }
    ],
    "bac": [
        { month: "Tháng 5-6", desc: "🥬 Thu hoạch rau cải vụ chiêm. Tiến hành cải tạo đất, bón phân hữu cơ vi sinh để chuẩn bị vụ mới." },
        { month: "Tháng 7-8", desc: "🍅 Ươm hạt giống cà chua vụ thu đông. Làm giàn kiên cố và cắm cọc chống đổ khi bắt đầu ra hoa." },
        { month: "Tháng 9-10", desc: "🌾 Chăm sóc lúa vụ mùa giai đoạn làm đòng và trỗ. Duy trì mực nước ruộng 5cm." }
    ]
};

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

// New premium elements
const recentChatsList = document.getElementById("recentChatsList");
const historySearch = document.getElementById("historySearch");
const farmerNameInput = document.getElementById("farmerName");
const farmerCropInput = document.getElementById("farmerCrop");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const weatherRegionSelect = document.getElementById("weatherRegion");
const weatherTempEl = document.getElementById("weatherTemp");
const weatherStatusEl = document.getElementById("weatherStatus");
const exportChatBtn = document.getElementById("exportChatBtn");
const langSelector = document.getElementById("langSelector");

// Advanced tool elements
const btnOpenCalendar = document.getElementById("btnOpenCalendar");
const btnOpenMap = document.getElementById("btnOpenMap");
const btnOpenDashboard = document.getElementById("btnOpenDashboard");
const btnOpenExpert = document.getElementById("btnOpenExpert");

const calendarModal = document.getElementById("calendarModal");
const mapModal = document.getElementById("mapModal");
const dashboardModal = document.getElementById("dashboardModal");
const expertModal = document.getElementById("expertModal");
const calendarGrid = document.getElementById("calendarGrid");
const mapAlertDetails = document.getElementById("mapAlertDetails");

// ===== INIT =====
async function init() {
    setupProfile();
    setupWeather();
    setupLanguage();
    await ensureSession();
    await fetchRecentSessions();
    setupEventListeners();
    startSessionTimer();
    loadInitialSuggestions();
    
    // Switch to active session in sidebar if exists
    if (sessionId) {
        loadHistory();
    }
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
    const defaults = {
        vi: [
            "🌱 Cách trồng cà chua tại nhà?",
            "💧 Lúa bị vàng lá phải làm sao?",
            "🐛 Cây bị sâu ăn lá - cách xử lý?",
            "🌿 Cách bón phân cho rau cải?",
            "☀️ Mùa nào trồng dưa hấu?",
        ],
        en: [
            "🌱 How to grow tomatoes at home?",
            "💧 What to do if rice leaves turn yellow?",
            "🐛 Treatment for leaf-eating caterpillars?",
            "🌿 Fertilization guide for mustard greens?",
            "☀️ When is the best season for watermelon?",
        ],
        ede: [
            "🌱 Mtih arăng mjing hăl dâo kdông?",
            "💧 Êsâi mnăm đung dâo hdah bhăn leh?",
            "🐛 Hăl kdông kčâo - mjing čuôm?",
            "🌿 Mjing phnăm kăn băt hăl dâo?",
            "☀️ Hriăng êčam mjing dưa hấu leh?"
        ]
    };
    renderSuggestions(defaults[currentLanguage] || defaults.vi);
}

// ===== PREMIUM LOGIC SETUP =====

function setupProfile() {
    farmerNameInput.value = localStorage.getItem("agribot_farmer_name") || "";
    farmerCropInput.value = localStorage.getItem("agribot_farmer_crop") || "";
}

function saveFarmerProfile() {
    localStorage.setItem("agribot_farmer_name", farmerNameInput.value.trim());
    localStorage.setItem("agribot_farmer_crop", farmerCropInput.value.trim());
    showToast(currentLanguage === 'en' ? "👤 Profile saved successfully!" : "👤 Đã lưu hồ sơ nông gia!");
}

function setupWeather() {
    const savedRegion = localStorage.getItem("agribot_weather_region") || "Đồng bằng sông Cửu Long";
    weatherRegionSelect.value = savedRegion;
    updateWeatherUI(savedRegion);
}

function updateWeatherUI(region) {
    const data = WEATHER_PROFILES[region];
    if (data) {
        weatherTempEl.textContent = data.temp;
        weatherStatusEl.textContent = data.status;
        localStorage.setItem("agribot_weather_region", region);
    }
}

function setupLanguage() {
    langSelector.value = currentLanguage;
    translateUI();
}

function translateUI() {
    const translations = {
        vi: {
            title: "DungNguyen Green AI",
            subtitle: "Sẵn sàng tư vấn",
            searchPlaceholder: "🔍 Tìm lịch sử...",
            newChat: "Cuộc trò chuyện mới",
            exportBtn: "📥 Xuất cuộc gọi",
            welcomeTitle: "Xin chào! Tôi là DungNguyen Green AI",
            welcomeDesc: "Chuyên gia AI hỗ trợ chăm sóc cây trồng, chẩn đoán bệnh và tư vấn nông nghiệp cho bạn bằng tiếng Việt.",
            waterDesc: "Tưới nước, bón phân đúng kỹ thuật",
            diagnoseDesc: "Nhận biết sâu bệnh hại, nấm",
            analyzeDesc: "Chẩn đoán qua hình ảnh",
            calendarDesc: "Thời gian mùa vụ lý tưởng",
            welcomeHint: "💬 Gõ câu hỏi hoặc chọn chủ đề ở bên trái để bắt đầu",
            sidebarCrops: "🌱 Cây đang tư vấn",
            sidebarQuick: "⚡ Câu hỏi nhanh",
            sidebarProfile: "👤 Hồ sơ nông hộ",
            sidebarWeather: "🌦️ Thời tiết nông nghiệp",
            sidebarTools: "⚙️ Tiện ích nâng cao",
            sidebarSession: "📊 Phiên làm việc",
            sidebarHistory: "💬 Lịch sử trò chuyện",
            farmerNameLabel: "Tên anh/chị",
            farmerCropLabel: "Cây trồng chính",
            btnSaveProfile: "💾 Lưu hồ sơ",
            btnCalendar: "📅 Lịch mùa vụ 2026",
            btnMap: "🗺️ Bản đồ dịch bệnh",
            btnDashboard: "📊 Báo cáo & Thống kê",
            btnExpert: "🤝 Liên hệ Chuyên gia",
            hintFooter: "DungNguyen Green AI có thể mắc lỗi. Hãy tham khảo thêm chuyên gia địa phương."
        },
        en: {
            title: "DungNguyen Green AI",
            subtitle: "Ready to consult",
            searchPlaceholder: "🔍 Search history...",
            newChat: "New Conversation",
            exportBtn: "📥 Export Chat",
            welcomeTitle: "Hello! I'm DungNguyen Green AI",
            welcomeDesc: "Your agricultural AI expert for plant care, crop diseases diagnosis, and sustainable farming.",
            waterDesc: "Watering, fertilization techniques",
            diagnoseDesc: "Pest, fungus, virus diagnosis",
            analyzeDesc: "Instant image plant diagnosis",
            calendarDesc: "Ideal harvest & sowing times",
            welcomeHint: "💬 Ask a question or select a topic to begin",
            sidebarCrops: "🌱 Active Consultation",
            sidebarQuick: "⚡ Quick Actions",
            sidebarProfile: "👤 Farmer Profile",
            sidebarWeather: "🌦️ Agro Climate",
            sidebarTools: "⚙️ Advanced Tools",
            sidebarSession: "📊 Session Stats",
            sidebarHistory: "💬 Chat History",
            farmerNameLabel: "Farmer Name",
            farmerCropLabel: "Primary Crop",
            btnSaveProfile: "💾 Save Profile",
            btnCalendar: "📅 Sowing Calendar 2026",
            btnMap: "🗺️ Disease Alert Map",
            btnDashboard: "📊 Session Analytics",
            btnExpert: "🤝 Consult Expert",
            hintFooter: "DungNguyen Green AI may make mistakes. Double-check with local specialists."
        },
        ede: {
            title: "DungNguyen Green AI",
            subtitle: "Hđăp pơng gưr",
            searchPlaceholder: "🔍 Čih čuôm...",
            newChat: "Čuôm hdah bar",
            exportBtn: "📥 Xuất čuôm",
            welcomeTitle: "Yâo! Kâo DungNguyen Green AI",
            welcomeDesc: "Mnăm AI pơng gưr mjing čăm sôk hăl dâo, hmâo ngui hăl dâo čuôm mnăm kăn.",
            waterDesc: "Êa tưới phnăm hăl dâo",
            diagnoseDesc: "Kdông čuôm hăl dâo",
            analyzeDesc: "Dưn ảnh čuôm bệnh",
            calendarDesc: "Mùa gieo sạ lúa hăl dâo",
            welcomeHint: "💬 Čih đung pơng gưr bơ̆ kčă",
            sidebarCrops: "🌱 Hăl dâo gưr",
            sidebarQuick: "⚡ Pơng gưr nhanh",
            sidebarProfile: "👤 Anôk lông nông",
            sidebarWeather: "🌦️ Thời tiết hdah",
            sidebarTools: "⚙️ Tiện ích cao",
            sidebarSession: "📊 Thời gian",
            sidebarHistory: "💬 Lịch sử čih",
            farmerNameLabel: "Anăn diê",
            farmerCropLabel: "Mjing kdông",
            btnSaveProfile: "💾 Lưu anôk",
            btnCalendar: "📅 Lịch mùa vụ 2026",
            btnMap: "🗺️ Bản đồ dịch",
            btnDashboard: "📊 Thống kê",
            btnExpert: "🤝 Chuyên gia",
            hintFooter: "DungNguyen Green AI dưn sa kơn. Lông pơng gưr kăn."
        }
    };

    const t = translations[currentLanguage];
    document.querySelector(".header-title").textContent = t.title;
    document.getElementById("headerSubtitle").textContent = t.subtitle;
    newChatBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> ${t.newChat}`;
    exportChatBtn.innerHTML = t.exportBtn;
    historySearch.placeholder = t.searchPlaceholder;
    
    // Sidebar titles
    const sections = document.querySelectorAll(".sidebar-section .section-title");
    if (sections.length >= 6) {
        sections[0].textContent = t.sidebarHistory;
        sections[1].textContent = t.sidebarProfile;
        sections[2].textContent = t.sidebarWeather;
        sections[3].textContent = t.sidebarTools;
        sections[4].textContent = t.sidebarQuick;
        sections[5].textContent = t.sidebarCrops;
    }
    
    farmerNameInput.placeholder = t.farmerNameLabel;
    farmerCropInput.placeholder = t.farmerCropLabel;
    saveProfileBtn.textContent = t.btnSaveProfile;
    
    btnOpenCalendar.textContent = t.btnCalendar;
    btnOpenMap.textContent = t.btnMap;
    btnOpenDashboard.textContent = t.btnDashboard;
    btnOpenExpert.textContent = t.btnExpert;
    
    document.querySelector(".input-footer .input-hint").textContent = t.hintFooter;
}

// ===== API SESSIONS LOGIC =====

async function fetchRecentSessions() {
    try {
        const res = await fetch(`${API_BASE}/api/sessions`);
        const data = await res.json();
        renderRecentSessions(data.sessions || []);
    } catch (e) {
        console.warn("Could not load recent sessions:", e);
    }
}

function renderRecentSessions(sessions) {
    recentChatsList.innerHTML = "";
    if (sessions.length === 0) {
        recentChatsList.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:10px;">Chưa có lịch sử hội thoại</div>`;
        return;
    }
    
    sessions.forEach(s => {
        const item = document.createElement("div");
        item.className = `recent-chat-item ${s.id === sessionId ? 'active' : ''}`;
        
        const title = document.createElement("span");
        title.className = "recent-chat-title";
        
        // Format creation time beautifully
        const date = new Date(s.last_active);
        const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const dateStr = date.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
        title.textContent = `🌱 Phiên ${dateStr} - ${timeStr}`;
        
        const delBtn = document.createElement("button");
        delBtn.className = "delete-chat-btn";
        delBtn.innerHTML = "✕";
        delBtn.title = "Xóa hội thoại này";
        delBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm("Bạn có chắc chắn muốn xóa hội thoại này khỏi bộ nhớ?")) {
                await deleteRecentSession(s.id);
            }
        });
        
        item.appendChild(title);
        item.appendChild(delBtn);
        
        item.addEventListener("click", () => {
            if (s.id !== sessionId) {
                sessionId = s.id;
                localStorage.setItem("agribot_session", sessionId);
                loadHistory();
                document.querySelectorAll(".recent-chat-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
            }
        });
        
        recentChatsList.appendChild(item);
    });
}

async function deleteRecentSession(id) {
    try {
        await fetch(`${API_BASE}/api/session`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: id })
        });
        showToast("🗑️ Đã xóa cuộc hội thoại!");
        if (id === sessionId) {
            sessionId = "";
            localStorage.removeItem("agribot_session");
            welcomeScreen.style.display = "flex";
            messagesList.innerHTML = "";
            plantInfoSection.style.display = "none";
            suggestionsRow.style.display = "none";
            messageCount = 0;
            msgCountEl.textContent = "0";
            sessionStart = Date.now();
            await ensureSession();
        }
        await fetchRecentSessions();
    } catch (e) {
        showToast("⚠️ Lỗi không thể xóa!");
    }
}

async function loadHistory() {
    if (!sessionId) return;
    try {
        const res = await fetch(`${API_BASE}/api/history?session_id=${sessionId}`);
        const data = await res.json();
        
        messagesList.innerHTML = "";
        const history = data.messages || [];
        messageCount = history.length;
        msgCountEl.textContent = messageCount;
        
        if (history.length > 0) {
            welcomeScreen.style.display = "none";
            history.forEach(msg => {
                addMessageToUI(msg.role, msg.content, msg.id, msg.rating);
            });
            scrollToBottom();
        } else {
            welcomeScreen.style.display = "flex";
        }
        
        // Restore active crop from context
        const context = data.context || {};
        if (context.current_crop) {
            updatePlantSidebar(context.current_crop);
        } else {
            plantInfoSection.style.display = "none";
        }
    } catch (e) {
        console.warn("Could not restore session history:", e);
    }
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
    
    // Search history input
    historySearch.addEventListener("input", () => {
        const term = historySearch.value.toLowerCase().trim();
        const items = document.querySelectorAll(".recent-chat-item");
        items.forEach(item => {
            const txt = item.querySelector(".recent-chat-title").textContent.toLowerCase();
            if (txt.includes(term)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });
    
    // Farmer profile save
    saveProfileBtn.addEventListener("click", saveFarmerProfile);
    
    // Weather select
    weatherRegionSelect.addEventListener("change", () => {
        updateWeatherUI(weatherRegionSelect.value);
        showToast("🌦️ Đã thích ứng thời tiết nông nghiệp!");
    });
    
    // Export button
    exportChatBtn.addEventListener("click", exportConversation);
    
    // Language Selector
    langSelector.addEventListener("change", () => {
        currentLanguage = langSelector.value;
        localStorage.setItem("agribot_lang", currentLanguage);
        translateUI();
        loadInitialSuggestions();
        showToast(currentLanguage === 'en' ? "🌐 Language updated!" : "🌐 Đã thay đổi ngôn ngữ!");
    });
    
    // Advanced UI Openers
    btnOpenCalendar.addEventListener("click", () => {
        switchCalendarTab("nam");
        calendarModal.classList.add("active");
    });
    btnOpenMap.addEventListener("click", () => {
        mapModal.classList.add("active");
    });
    btnOpenDashboard.addEventListener("click", () => {
        openDashboardModal();
    });
    btnOpenExpert.addEventListener("click", () => {
        expertModal.classList.add("active");
    });
    
    // Close modals on clicking outside content
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("active");
            }
        });
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
    addMessageToUI("user", text || "📸 [Gửi ảnh để phân tích bệnh]", "temp-user-" + Date.now());
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
        const weatherProfile = WEATHER_PROFILES[weatherRegionSelect.value] || {};
        const weatherStr = `Thời tiết vùng ${weatherRegionSelect.value}: ${weatherProfile.desc || ''}`;
        const farmerProfile = {
            name: farmerNameInput.value.trim(),
            region: weatherRegionSelect.value,
            primary_crop: farmerCropInput.value.trim()
        };
        
        if (pendingImage) {
            // FormData for image upload
            await ensureSession();
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("message", text);
            formData.append("image", pendingImage);
            
            const res = await fetch(`${API_BASE}/api/chat/image`, {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            responseData = await res.json();
            
            clearImage();
        } else {
            // Text JSON send with weather & profile
            await ensureSession();
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: text,
                    weather: weatherStr,
                    profile: farmerProfile
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            responseData = await res.json();
        }

        removeTyping(typingId);
        
        // Add real bot response to UI
        addMessageToUI("bot", responseData.response, responseData.assistant_message_id, 0);
        messageCount++;
        msgCountEl.textContent = messageCount;

        // Refetch sessions to keep sidebar timestamps updated
        await fetchRecentSessions();

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
        addMessageToUI("bot", "⚠️ **Lỗi kết nối**: Không thể kết nối đến server. Hãy đảm bảo backend đang chạy tại `localhost:5000`.\n\nChạy lệnh: `python backend/app.py`", null, 0);
        console.error("Send error:", err);
    } finally {
        isLoading = false;
        sendBtn.disabled = messageInput.value.length === 0;
    }
}

// ===== UI HELPERS =====
function addMessageToUI(role, content, msgId, rating = 0) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    if (msgId) div.dataset.msgId = msgId;

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = role === "bot" ? "🌿" : "👤";

    const msgContent = document.createElement("div");
    msgContent.className = "msg-content";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = renderMarkdown(content);
    msgContent.appendChild(bubble);

    // Add Premium actions under Bot messages
    if (role === "bot" && msgId && !String(msgId).startsWith("temp")) {
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "msg-actions";
        
        // TTS Play
        const ttsBtn = document.createElement("button");
        ttsBtn.className = "msg-action-btn tts-btn";
        ttsBtn.innerHTML = "🔊 Đọc";
        ttsBtn.title = "Đọc câu trả lời bằng giọng nói";
        ttsBtn.addEventListener("click", () => speakText(content, ttsBtn));
        
        // Copy
        const copyBtn = document.createElement("button");
        copyBtn.className = "msg-action-btn";
        copyBtn.innerHTML = "📋 Copy";
        copyBtn.title = "Sao chép tin nhắn";
        copyBtn.addEventListener("click", () => copyToClipboard(content));
        
        // Feedback Up
        const upBtn = document.createElement("button");
        upBtn.className = `msg-action-btn ${rating === 1 ? 'active' : ''}`;
        upBtn.innerHTML = "👍 Hài lòng";
        upBtn.addEventListener("click", () => rateMessage(msgId, 1, upBtn, actionsDiv));
        
        // Feedback Down
        const downBtn = document.createElement("button");
        downBtn.className = `msg-action-btn ${rating === -1 ? 'active-down' : ''}`;
        downBtn.innerHTML = "👎 Không hài lòng";
        downBtn.addEventListener("click", () => rateMessage(msgId, -1, downBtn, actionsDiv));
        
        actionsDiv.appendChild(ttsBtn);
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(upBtn);
        actionsDiv.appendChild(downBtn);
        msgContent.appendChild(actionsDiv);
    }

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = formatTime(new Date());

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
            // Remove emojis at start of suggestion if needed
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
    if (!confirm(currentLanguage === 'en' ? "Start a new conversation?" : "Bắt đầu cuộc trò chuyện mới?")) return;

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
    await fetchRecentSessions();
    loadInitialSuggestions();
    showToast(currentLanguage === 'en' ? "🌱 New chat started!" : "🌱 Cuộc trò chuyện mới đã bắt đầu!");
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

// ===== TTS LOGIC =====
function speakText(text, btn) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.querySelectorAll(".tts-btn").forEach(b => {
            b.innerHTML = "🔊 Đọc";
            b.classList.remove("speaking");
        });
        if (btn.classList.contains("speaking")) {
            btn.classList.remove("speaking");
            return;
        }
    }
    
    // Clean markdown tag formatting before reading
    const cleanText = text
        .replace(/[*#`>_\-]/g, "")
        .replace(/\[Ảnh được gửi\].*?$/g, "")
        .trim();
        
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    
    btn.innerHTML = "⏹️ Dừng";
    btn.classList.add("speaking");
    
    utterance.onend = () => {
        btn.innerHTML = "🔊 Đọc";
        btn.classList.remove("speaking");
    };
    
    utterance.onerror = () => {
        btn.innerHTML = "🔊 Đọc";
        btn.classList.remove("speaking");
    };
    
    window.speechSynthesis.speak(utterance);
}

// ===== COPY LOGIC =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast(currentLanguage === 'en' ? "📋 Copied to clipboard!" : "📋 Đã sao chép nội dung!");
}

// ===== FEEDBACK RATING LOGIC =====
async function rateMessage(msgId, rating, clickedBtn, parentContainer) {
    try {
        const res = await fetch(`${API_BASE}/api/message/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: msgId, rating: rating })
        });
        const data = await res.json();
        if (data.status === "success") {
            showToast("⭐ Cảm ơn bạn đã đánh giá phản hồi!");
            
            // Highlight matching button
            const btns = parentContainer.querySelectorAll(".msg-action-btn");
            btns[2].classList.remove("active");
            btns[3].classList.remove("active-down");
            
            if (rating === 1) clickedBtn.classList.add("active");
            if (rating === -1) clickedBtn.classList.add("active-down");
        }
    } catch (e) {
        showToast("⚠️ Không thể gửi đánh giá!");
    }
}

// ===== EXPORT LOGIC =====
function exportConversation() {
    const bubbles = document.querySelectorAll(".message");
    if (bubbles.length === 0) {
        showToast("⚠️ Chưa có nội dung để xuất!");
        return;
    }
    
    let md = `# Nhật Ký Tư Vấn Nông Nghiệp AgriBot\n`;
    md += `*Thời gian lưu: ${new Date().toLocaleString('vi-VN')}*\n`;
    md += `*Vùng miền: ${weatherRegionSelect.value}*\n\n---\n\n`;
    
    bubbles.forEach(bubble => {
        const role = bubble.classList.contains("user") ? "Nông dân (User)" : "AgriBot (AI)";
        const bubbleTxt = bubble.querySelector(".msg-bubble").innerText;
        const timeTxt = bubble.querySelector(".msg-time").textContent;
        
        md += `### 💬 ${role} - *${timeTxt}*\n${bubbleTxt}\n\n`;
    });
    
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NhatKy_AgriBot_${new Date().toISOString().slice(0,10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📥 Đã tải xuống file Nhật Ký Hội Thoại!");
}

// ===== ADVANCED MODALS FUNCTIONALITY =====

// 1. Cropping Calendar switcher
window.switchCalendarTab = function(region, btn) {
    if (btn) {
        document.querySelectorAll(".cal-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }
    
    calendarGrid.innerHTML = "";
    const list = CALENDAR_DATA[region] || [];
    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "calendar-card";
        card.innerHTML = `
            <div class="cal-month">${item.month}</div>
            <div class="cal-desc">${item.desc}</div>
        `;
        calendarGrid.appendChild(card);
    });
};

// 2. Vietnam Map alert displayer
window.showMapAlert = function(region) {
    const alerts = {
        bac: {
            title: "🔴 Cảnh báo dịch Bắc Bộ",
            desc: "Thời tiết ẩm độ cao, mưa phùn dồi dào kích thích dịch nấm bệnh đạo ôn lá phát triển mạnh mẽ trên các ruộng lúa xuân muộn. Khuyến nghị bà con phun Tricyclazole phòng ngừa và ngừng bón đạm."
        },
        trung: {
            title: "🟡 Cảnh báo dịch Trung Bộ & Tây Nguyên",
            desc: "Báo động rệp sáp và bệnh rỉ sắt hại cành lá trên các vườn cà phê do nhiệt độ ngày nóng ẩm độ đêm cao. Khuyến cáo tỉa tán rộng thông thoáng và phun phòng Hexaconazole."
        },
        nam: {
            title: "🔴 Cảnh báo dịch Nam Bộ & ĐBSCL",
            desc: "Phát hiện rầy nâu mật độ cao trên các trà lúa hè thu giai đoạn đẻ nhánh làm đòng tại Đồng Tháp, An Giang. Khuyến nghị bơm nước giữ mực nước ruộng 7cm để diệt rầy, hoặc phun Imidacloprid."
        }
    };
    
    const info = alerts[region];
    if (info) {
        mapAlertDetails.innerHTML = `
            <h3>${info.title}</h3>
            <p>${info.desc}</p>
        `;
    }
};

// 3. Stats Dashboard loader
function openDashboardModal() {
    document.getElementById("dashTotalMsgs").textContent = messageCount;
    
    // Elapsed time calculation
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById("dashAvgTime").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    
    // Draw crop consult charts dynamically
    const chartContainer = document.getElementById("dashCropsChart");
    chartContainer.innerHTML = "";
    
    // Mock statistical data
    const cropStats = [
        { name: "Lúa nước", val: 75 },
        { name: "Cà chua", val: 50 },
        { name: "Cà phê", val: 35 }
    ];
    
    cropStats.forEach(stat => {
        const row = document.createElement("div");
        row.className = "bar-chart-row";
        row.innerHTML = `
            <span class="bar-chart-label">${stat.name}</span>
            <div class="bar-chart-track">
                <div class="bar-chart-fill" style="width: ${stat.val}%"></div>
            </div>
            <span class="bar-chart-value">${stat.val}%</span>
        `;
        chartContainer.appendChild(row);
    });
    
    dashboardModal.classList.add("active");
}

// 4. Submit Expert Form simulator
window.submitExpertForm = function(e) {
    e.preventDefault();
    showToast("🚀 Đã gửi thắc mắc của bạn thành công!");
    setTimeout(() => {
        alert("🌱 Kính chào bà con! Hồ sơ tư vấn đã được gửi lên cổng Thông tin Khuyến nông Quốc gia. Chuyên gia địa phương sẽ gọi điện thoại hỗ trợ bà con trong 24 giờ tới.");
        expertModal.classList.remove("active");
        document.getElementById("expertConsultForm").reset();
    }, 500);
};

// ===== MARKDOWN RENDERER =====
function renderMarkdown(text) {
    if (!text) return "";
    let html = text
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
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
        .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
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
