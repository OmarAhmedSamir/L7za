/* =====================================================
   L7ZA — FIXED APP.JS
===================================================== */

const SUPABASE_URL = "https://ogxbaalnebmmqxneypuy.supabase.co";
const SUPABASE_KEY = "sb_publishable_ksfgbcVqNa6P8GRahVhDYA_KLK30bt7";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Variables
let currentUser = null;
let currentProfile = null;
let instants = [];
let myInstants = [];
let currentIndex = 0;
let friends = [];
let friendRequests = [];
let sentRequests = [];
let loadingInstants = false;
let authMode = "login";

// Elements Variables (To be bound on DOMContentLoaded)
let authScreen, mainApp, authTitle, authSubtitle, authSubmit, authSwitch, authMessage;
let authEmail, authPassword, authDisplayName, authUsername, signupFields;

/* =====================================================
   INITIALIZATION & EVENT BINDING
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. ربط جميع عناصر الواجهة بأمان بعد تحميل DOM
    authScreen = document.getElementById("authScreen");
    mainApp = document.getElementById("mainApp");
    authTitle = document.getElementById("authTitle");
    authSubtitle = document.getElementById("authSubtitle");
    authSubmit = document.getElementById("authSubmit");
    authSwitch = document.getElementById("authSwitch");
    authMessage = document.getElementById("authMessage");
    authEmail = document.getElementById("authEmail");
    authPassword = document.getElementById("authPassword");
    authDisplayName = document.getElementById("authDisplayName");
    authUsername = document.getElementById("authUsername");
    signupFields = document.querySelectorAll(".signup-only");

    // 2. ربط أزرار تسجيل الدخول والإنشاء
    if (authSwitch) {
        authSwitch.addEventListener("click", () => {
            setAuthMode(authMode === "login" ? "signup" : "login");
        });
    }

    if (authSubmit) {
        authSubmit.addEventListener("click", async () => {
            if (authMode === "signup") {
                await signUp();
            } else {
                await signIn();
            }
        });
    }

    // 3. ربط أزرار التنقل (Navigation)
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            const screen = item.dataset.screen;
            if (screen) showScreen(screen);
        });
    });

    document.querySelectorAll(".back-button").forEach(button => {
        button.addEventListener("click", () => {
            showScreen(button.dataset.back);
        });
    });

    // 4. زر الخروج
    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await supabaseClient.auth.signOut();
            resetState();
            showAuth();
        });
    }

    // 5. زر الكاميرا
    document.getElementById("captureButton")?.addEventListener("click", startCamera);
    document.getElementById("navCamera")?.addEventListener("click", startCamera);
    document.getElementById("closeCapture")?.addEventListener("click", () => {
        stopCamera();
        document.getElementById("captureModal")?.classList.remove("show");
    });
    document.getElementById("realCaptureButton")?.addEventListener("click", takePhoto);
    document.getElementById("postInstantButton")?.addEventListener("click", postInstant);

    // 6. بدء التحقق من تسجيل الدخول
    initializeAuth();
});

/* =====================================================
   AUTH FUNCTIONS
===================================================== */

function setAuthMode(mode) {
    authMode = mode;
    clearAuthMessage();

    if (mode === "signup") {
        authTitle.textContent = "Create your account.";
        authSubtitle.textContent = "Join L7za and start sharing real moments.";
        authSubmit.textContent = "Create account";
        authSwitch.innerHTML = `Already have an account? <strong>Sign in</strong>`;
        // إصلاح التداخل: إعادة العرض لوضعه الأصلي بدلاً من block
        signupFields.forEach(field => field.style.display = "");
        authPassword.autocomplete = "new-password";
    } else {
        authTitle.textContent = "Welcome back.";
        authSubtitle.textContent = "Sign in to see what your friends are doing.";
        authSubmit.textContent = "Sign in";
        authSwitch.innerHTML = `Don't have an account? <strong>Sign up</strong>`;
        signupFields.forEach(field => field.style.display = "none");
        authPassword.autocomplete = "current-password";
    }
}

function showAuthMessage(message, type = "") {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.className = "auth-message " + type;
}

function clearAuthMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.className = "auth-message";
}

async function signUp() {
    clearAuthMessage();
    const displayName = authDisplayName.value.trim();
    const username = authUsername.value.trim().toLowerCase();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!displayName || !username || !email || password.length < 6) {
        showAuthMessage("الرجاء إدخال جميع البيانات بشكل صحيح (كلمة السر 6 أحرف على الأقل).", "error");
        return;
    }

    setAuthLoading(true);
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username, display_name: displayName } }
        });

        if (error) throw error;

        currentUser = data.user;
        await loadCurrentProfile();
        await showMainApp();
    } catch (err) {
        showAuthMessage(err.message || "حدث خطأ أثناء إنشاء الحساب.", "error");
    } finally {
        setAuthLoading(false);
    }
}

async function signIn() {
    clearAuthMessage();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!email || !password) {
        showAuthMessage("برجاء أدخل البريد وكلمة السر.", "error");
        return;
    }

    setAuthLoading(true);
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        currentUser = data.user;
        await loadCurrentProfile();
        await showMainApp();
    } catch (err) {
        showAuthMessage("بيانات الدخول غير صحيحة.", "error");
    } finally {
        setAuthLoading(false);
    }
}

function setAuthLoading(loading) {
    if (!authSubmit) return;
    authSubmit.disabled = loading;
    authSubmit.textContent = loading ? "جاري التحميل..." : (authMode === "signup" ? "Create account" : "Sign in");
}

async function initializeAuth() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        if (data?.session?.user) {
            currentUser = data.session.user;
            await loadCurrentProfile();
            await showMainApp();
        } else {
            showAuth();
        }
    } catch (err) {
        showAuth();
    }
}

function showAuth() {
    stopCamera();
    if (mainApp) mainApp.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");
    setAuthMode("login");
}

async function showMainApp() {
    if (authScreen) authScreen.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");
    updateProfileUI();
    showScreen("homeScreen");
    await loadSocialData();
    await Promise.allSettled([loadInstants(), loadMyInstants()]);
}

function resetState() {
    currentUser = null;
    currentProfile = null;
    instants = [];
    myInstants = [];
    friends = [];
}

/* =====================================================
   PROFILE & SCREEN NAVIGATION
===================================================== */

async function loadCurrentProfile() {
    if (!currentUser) return;
    const { data } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    currentProfile = data;
    updateProfileUI();
}

function updateProfileUI() {
    if (!currentProfile) return;
    const nameEl = document.getElementById("profileName");
    const userEl = document.getElementById("profileUsername");
    const avatarEl = document.getElementById("profileAvatar");

    if (nameEl) nameEl.textContent = currentProfile.display_name || "User";
    if (userEl) userEl.textContent = `@${currentProfile.username || "user"}`;
    if (avatarEl) avatarEl.textContent = (currentProfile.display_name || "U").charAt(0).toUpperCase();
}

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");

    const activeNav = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
    if (activeNav) activeNav.classList.add("active");

    if (screenId === "friendsScreen" || screenId === "requestsScreen") loadSocialData();
    if (screenId === "profileScreen") loadMyInstants();
}

/* =====================================================
   FRIENDS & INSTANTS LOGIC
===================================================== */

async function loadSocialData() {
    if (!currentUser) return;
    try {
        const { data } = await supabaseClient
            .from("friendships")
            .select("*")
            .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);

        friends = (data || [])
            .filter(row => row.status === "accepted")
            .map(row => ({ userId: row.requester_id === currentUser.id ? row.addressee_id : row.requester_id }));

    } catch (err) {
        console.error("Social data error:", err);
    }
}

async function loadInstants() {
    if (!currentUser || loadingInstants) return;
    loadingInstants = true;

    try {
        const friendIds = friends.map(f => f.userId);
        if (!friendIds.length) {
            instants = [];
            renderInstantsStack();
            return;
        }

        const { data: viewedData } = await supabaseClient
            .from("instant_views")
            .select("instant_id")
            .eq("viewer_id", currentUser.id);

        const viewedIds = new Set((viewedData || []).map(v => v.instant_id));

        const { data, error } = await supabaseClient
            .from("instants")
            .select(`
                id, user_id, image_url, created_at,
                profiles:user_id (id, username, display_name, avatar_url)
            `)
            .in("user_id", friendIds)
            .order("created_at", { ascending: false });

        if (error) throw error;

        instants = (data || []).filter(inst => !viewedIds.has(inst.id));
        currentIndex = 0;

        renderInstantsStack();
        if (instants.length > 0) markInstantAsSeen(instants[0].id);

    } catch (err) {
        console.error("Load instants error:", err);
    } finally {
        loadingInstants = false;
    }
}

async function markInstantAsSeen(instantId) {
    if (!currentUser || !instantId) return;
    try {
        await supabaseClient.from("instant_views").upsert({
            instant_id: instantId,
            viewer_id: currentUser.id
        }, { onConflict: 'instant_id,viewer_id' });
    } catch (err) {
        console.error("Seen tracking error:", err);
    }
}

function renderInstantsStack() {
    const container = document.getElementById("cardArea");
    if (!container) return;

    if (!instants.length) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>لا توجد لقطات جديدة</strong>
                <span>لقد شاهدت كل الصور من أصدقائك!</span>
            </div>`;
        return;
    }

    const inst = instants[currentIndex];
    const profile = inst.profiles || {};

    container.innerHTML = `
        <article class="instant-card">
            <div class="instant-photo" style="background-image: url('${inst.image_url}');"></div>
            <div class="instant-gradient"></div>
            <div class="instant-info">
                <div class="instant-user">
                    <div class="avatar">${(profile.display_name || "U").charAt(0).toUpperCase()}</div>
                    <div>
                        <strong>${profile.display_name || "User"}</strong>
                        <span>@${profile.username || "user"}</span>
                    </div>
                </div>
            </div>
        </article>`;

    attachSwipeHandlers();
}

function attachSwipeHandlers() {
    const card = document.querySelector(".instant-card");
    if (!card) return;

    let startX = 0, currentX = 0, isDragging = false;

    const onStart = (x) => { isDragging = true; startX = x; };
    const onMove = (x) => {
        if (!isDragging) return;
        currentX = x - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
    };
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(currentX) > 100) {
            card.style.transition = "transform 0.3s ease";
            card.style.transform = `translateX(${currentX > 0 ? 500 : -500}px)`;
            setTimeout(() => {
                currentIndex++;
                if (currentIndex < instants.length) {
                    markInstantAsSeen(instants[currentIndex].id);
                } else {
                    instants = [];
                }
                renderInstantsStack();
            }, 300);
        } else {
            card.style.transform = "";
        }
    };

    card.addEventListener("touchstart", e => onStart(e.touches[0].clientX));
    card.addEventListener("touchmove", e => onMove(e.touches[0].clientX));
    card.addEventListener("touchend", onEnd);
    card.addEventListener("mousedown", e => onStart(e.clientX));
    window.addEventListener("mousemove", e => onMove(e.clientX));
    window.addEventListener("mouseup", onEnd);
}

/* =====================================================
   CAMERA & MY INSTANTS
===================================================== */

let mediaStream = null;

async function startCamera() {
    const captureModal = document.getElementById("captureModal");
    if (captureModal) captureModal.classList.add("show");

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const video = document.getElementById("cameraVideo");
        if (video) { video.srcObject = mediaStream; video.play(); }
    } catch (err) {
        alert("تعذر فتح الكاميرا، برجاء منح الصلاحيات.");
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
}

function takePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1440;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const capturedImage = document.getElementById("capturedImage");
    if (capturedImage) capturedImage.src = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    document.getElementById("captureModal")?.classList.remove("show");
    document.getElementById("previewModal")?.classList.add("show");
}

async function postInstant() {
    const capturedImage = document.getElementById("capturedImage");
    if (!currentUser || !capturedImage?.src) return;

    try {
        const response = await fetch(capturedImage.src);
        const blob = await response.blob();
        const fileName = `${currentUser.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabaseClient.storage.from("instants").upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage.from("instants").getPublicUrl(fileName);

        await supabaseClient.from("instants").insert({
            user_id: currentUser.id,
            image_url: data.publicUrl
        });

        document.getElementById("previewModal")?.classList.remove("show");
        await loadInstants();
        await loadMyInstants();
        showScreen("homeScreen");

    } catch (err) {
        alert("فشل رفع الصورة! تأكد أن ה-Bucket موصول كـ Public في Supabase.");
    }
}

async function loadMyInstants() {
    if (!currentUser) return;
    const { data } = await supabaseClient
        .from("instants")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    myInstants = data || [];
    const grid = document.getElementById("myInstantPreview");
    if (grid) {
        grid.innerHTML = myInstants.map(i => `<div class="my-instant-item" style="background-image:url('${i.image_url}')"></div>`).join("");
    }
}
