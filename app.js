/* =====================================================
   L7ZA — PHASE 4
   COMPLETE APP.JS
===================================================== */

/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL = "https://ogxbaalnebmmqxneypuy.supabase.co";
const SUPABASE_KEY = "sb_publishable_ksfgbcVqNa6P8GRahVhDYA_KLK30bt7";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;
let currentProfile = null;

let instants = [];
let myInstants = [];

let currentIndex = 0;

let friends = [];
let friendRequests = [];
let sentRequests = [];

let loadingInstants = false;
let loadingMyInstants = false;
let loadingFriends = false;
let loadingRequests = false;

let mediaStream = null;
let facingMode = "user";
let currentFilter = "none";
let capturedDataUrl = null;

/* =====================================================
   AUTH ELEMENTS
===================================================== */

const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authMessage = document.getElementById("authMessage");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authDisplayName = document.getElementById("authDisplayName");
const authUsername = document.getElementById("authUsername");
const signupFields = document.querySelectorAll(".signup-only");

let authMode = "login";

/* =====================================================
   AUTH UI
===================================================== */

function setAuthMode(mode) {
    authMode = mode;
    clearAuthMessage();

    if (mode === "signup") {
        authTitle.textContent = "Create your account.";
        authSubtitle.textContent = "Join L7za and start sharing real moments.";
        authSubmit.textContent = "Create account";
        authSwitch.innerHTML = `Already have an account? <strong>Sign in</strong>`;
        signupFields.forEach(field => field.style.display = "block");
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

if (authSwitch) {
    authSwitch.addEventListener("click", () => {
        setAuthMode(authMode === "login" ? "signup" : "login");
    });
}

function showAuthMessage(message, type = "") {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.className = "auth-message";
    if (type) authMessage.classList.add(type);
}

function clearAuthMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.className = "auth-message";
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

function validateSignup() {
    const displayName = authDisplayName.value.trim();
    const username = authUsername.value.trim().toLowerCase();

    if (!displayName) {
        showAuthMessage("Please enter your name.", "error");
        return null;
    }

    if (!validateUsername(username)) {
        showAuthMessage("Username must be 3–24 characters using letters, numbers, or _.", "error");
        return null;
    }

    return { displayName, username };
}

async function signUp() {
    clearAuthMessage();
    const signup = validateSignup();
    if (!signup) return;

    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!email) {
        showAuthMessage("Please enter your email.", "error");
        return;
    }

    if (password.length < 6) {
        showAuthMessage("Password must be at least 6 characters.", "error");
        return;
    }

    setAuthLoading(true);

    try {
        const { data: existingProfile, error: usernameError } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("username", signup.username)
            .maybeSingle();

        if (usernameError) throw usernameError;

        if (existingProfile) {
            showAuthMessage("That username is already taken.", "error");
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: signup.username,
                    display_name: signup.displayName
                }
            }
        });

        if (error) throw error;

        if (!data.session) {
            showAuthMessage("Account created. Check your email to confirm your account.", "success");
            authPassword.value = "";
            return;
        }

        currentUser = data.user;
        await loadCurrentProfile();
        await showMainApp();

    } catch (error) {
        console.error("Sign up error:", error);
        showAuthMessage(getAuthErrorMessage(error), "error");
    } finally {
        setAuthLoading(false);
    }
}

async function signIn() {
    clearAuthMessage();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!email || !password) {
        showAuthMessage("Please enter your email and password.", "error");
        return;
    }

    setAuthLoading(true);

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        await loadCurrentProfile();
        await showMainApp();

    } catch (error) {
        console.error("Sign in error:", error);
        showAuthMessage(getAuthErrorMessage(error), "error");
    } finally {
        setAuthLoading(false);
    }
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

[authEmail, authPassword, authDisplayName, authUsername].forEach(input => {
    if (!input) return;
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") authSubmit.click();
    });
});

function setAuthLoading(loading) {
    if (!authSubmit) return;
    authSubmit.disabled = loading;
    authSubmit.textContent = loading
        ? (authMode === "signup" ? "Creating account..." : "Signing in...")
        : (authMode === "signup" ? "Create account" : "Sign in");
}

function getAuthErrorMessage(error) {
    const message = error?.message || "";
    const lower = message.toLowerCase();

    if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
    if (lower.includes("email not confirmed")) return "Please confirm your email before signing in.";
    if (lower.includes("user already registered")) return "An account with this email already exists.";
    if (lower.includes("password should be at least")) return "Your password is too short.";

    return message || "Something went wrong. Please try again.";
}

/* =====================================================
   PROFILE FUNCTIONS
===================================================== */

async function loadCurrentProfile() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return;
    }

    currentProfile = data;

    if (!currentProfile) {
        const metadata = currentUser.user_metadata || {};
        const username = metadata.username || `user_${currentUser.id.slice(0, 8)}`;
        const displayName = metadata.display_name || "New User";

        const { data: createdProfile, error: createError } = await supabaseClient
            .from("profiles")
            .insert({
                id: currentUser.id,
                username,
                display_name: displayName
            })
            .select()
            .single();

        if (createError) {
            console.error("Create profile error:", createError);
            return;
        }

        currentProfile = createdProfile;
    }

    updateProfileUI();
}

function updateProfileUI() {
    if (!currentProfile) return;

    const name = currentProfile.display_name || "User";
    const username = currentProfile.username || "user";

    const profileName = document.getElementById("profileName");
    const profileUsername = document.getElementById("profileUsername");
    const profileAvatar = document.getElementById("profileAvatar");

    if (profileName) profileName.textContent = name;
    if (profileUsername) profileUsername.textContent = `@${username}`;
    if (profileAvatar) profileAvatar.textContent = name.charAt(0).toUpperCase();
}

/* =====================================================
   NAVIGATION & APPLICATION LIFECYCLE
===================================================== */

async function showMainApp() {
    if (authScreen) authScreen.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");

    document.body.style.overflow = "";

    updateProfileUI();
    showScreen("homeScreen");

    await loadSocialData();
    await Promise.allSettled([loadInstants(), loadMyInstants()]);
}

function showAuth() {
    stopCamera();
    const captureModal = document.getElementById("captureModal");
    const previewModal = document.getElementById("previewModal");

    if (captureModal) captureModal.classList.remove("show");
    if (previewModal) previewModal.classList.remove("show");
    if (mainApp) mainApp.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");

    document.body.style.overflow = "";
    setAuthMode("login");
}

const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await supabaseClient.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }
        resetState();
        showAuth();
    });
}

function resetState() {
    currentUser = null;
    currentProfile = null;
    instants = [];
    myInstants = [];
    friends = [];
    friendRequests = [];
    sentRequests = [];
    currentIndex = 0;
}

async function initializeAuth() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
            currentUser = data.session.user;
            await loadCurrentProfile();
            await showMainApp();
        } else {
            showAuth();
        }
    } catch (error) {
        console.error("Session error:", error);
        showAuth();
    }
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
        resetState();
        showAuth();
        return;
    }

    if (event === "SIGNED_IN" && session?.user) {
        currentUser = session.user;
        await loadCurrentProfile();
        await showMainApp();
    }
});

const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");

    navItems.forEach(item => {
        item.classList.remove("active");
        if (item.dataset.screen === screenId) item.classList.add("active");
    });

    window.scrollTo({ top: 0, behavior: "auto" });

    if (screenId === "friendsScreen" || screenId === "requestsScreen") {
        loadSocialData();
    } else if (screenId === "profileScreen") {
        loadMyInstants();
    }
}

navItems.forEach(item => {
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

/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
   FRIENDSHIP & SOCIAL DATA
===================================================== */

function friendshipStatusFor(userId) {
    if (!currentUser || !userId) return "none";

    if (friends.some(item => item.userId === userId)) return "friends";
    if (friendRequests.some(item => item.requester_id === userId)) return "incoming";
    if (sentRequests.some(item => item.addressee_id === userId)) return "outgoing";

    return "none";
}

async function loadSocialData() {
    if (!currentUser || loadingFriends) return;
    loadingFriends = true;

    try {
        const { data, error } = await supabaseClient
            .from("friendships")
            .select(`id, requester_id, addressee_id, status, created_at`)
            .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);

        if (error) throw error;

        friends = [];
        friendRequests = [];
        sentRequests = [];

        (data || []).forEach(row => {
            if (row.status === "accepted") {
                const otherUserId = row.requester_id === currentUser.id ? row.addressee_id : row.requester_id;
                friends.push({ id: row.id, userId: otherUserId });
            } else if (row.status === "pending") {
                if (row.addressee_id === currentUser.id) {
                    friendRequests.push(row);
                } else if (row.requester_id === currentUser.id) {
                    sentRequests.push(row);
                }
            }
        });

        updateFriendCount();
        updateRequestBadge();
        await renderFriendsList();
        await renderRequests();

    } catch (error) {
        console.error("Load social data error:", error);
    } finally {
        loadingFriends = false;
    }
}

function updateFriendCount() {
    const element = document.getElementById("friendCount");
    if (element) element.textContent = friends.length;
}

function updateRequestBadge() {
    const badge = document.getElementById("requestBadge");
    if (badge) badge.textContent = friendRequests.length;

    const dot = document.getElementById("notificationDot");
    if (dot) dot.style.display = friendRequests.length ? "block" : "none";
}

const friendSearch = document.getElementById("friendSearch");
if (friendSearch) {
    friendSearch.addEventListener("input", async () => {
        await renderFriendsList(friendSearch.value);
    });
}

async function renderFriendsList(searchValue = "") {
    const container = document.getElementById("friendsList");
    if (!container) return;

    const query = String(searchValue || "").trim().toLowerCase();

    try {
        let profiles = [];
        if (query) {
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .neq("id", currentUser.id)
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(30);

            if (error) throw error;
            profiles = data || [];
        } else {
            const friendIds = friends.map(item => item.userId);
            if (!friendIds.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <strong>No friends yet</strong>
                        <span>Search for people to add them.</span>
                    </div>`;
                return;
            }

            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .in("id", friendIds);

            if (error) throw error;
            profiles = data || [];
        }

        if (!profiles.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <strong>No people found</strong>
                    <span>Try another username or name.</span>
                </div>`;
            return;
        }

        container.innerHTML = profiles.map(profile => renderPersonRow(profile)).join("");
        attachFriendButtons();

    } catch (error) {
        console.error("Render friends error:", error);
        container.innerHTML = `<div class="empty-state">Unable to load people.</div>`;
    }
}

function renderPersonRow(profile) {
    const status = friendshipStatusFor(profile.id);
    const name = escapeHTML(profile.display_name || "User");
    const username = escapeHTML(`@${profile.username || "user"}`);
    const avatar = escapeHTML((profile.display_name || profile.username || "U").charAt(0).toUpperCase());

    let buttonHTML = "";
    if (status === "friends") {
        buttonHTML = `<button class="friend-action-button friends" data-user-id="${escapeHTML(profile.id)}" data-action="remove" type="button">Friends</button>`;
    } else if (status === "outgoing") {
        buttonHTML = `<button class="friend-action-button pending" data-user-id="${escapeHTML(profile.id)}" data-action="cancel" type="button">Pending</button>`;
    } else if (status === "incoming") {
        buttonHTML = `<button class="friend-action-button accept" data-user-id="${escapeHTML(profile.id)}" data-action="accept" type="button">Accept</button>`;
    } else {
        buttonHTML = `<button class="friend-action-button add" data-user-id="${escapeHTML(profile.id)}" data-action="add" type="button">Add</button>`;
    }

    return `
        <article class="person-row" data-user-id="${escapeHTML(profile.id)}">
            <div class="avatar">${avatar}</div>
            <div class="person-info">
                <strong>${name}</strong>
                <span>${username}</span>
            </div>
            ${buttonHTML}
        </article>
    `;
}

function attachFriendButtons() {
    document.querySelectorAll(".friend-action-button").forEach(button => {
        button.addEventListener("click", async (e) => {
            const userId = e.target.dataset.userId;
            const action = e.target.dataset.action;

            if (action === "add") {
                await supabaseClient.from("friendships").insert({
                    requester_id: currentUser.id,
                    addressee_id: userId,
                    status: "pending"
                });
            } else if (action === "accept") {
                await supabaseClient.from("friendships").update({ status: "accepted" }).match({
                    requester_id: userId,
                    addressee_id: currentUser.id
                });
            } else if (action === "cancel" || action === "remove") {
                await supabaseClient.from("friendships").delete().or(
                    `and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`
                );
            }

            await loadSocialData();
        });
    });
}

async function renderRequests() {
    const container = document.getElementById("requestsList");
    if (!container) return;

    if (!friendRequests.length) {
        container.innerHTML = `<div class="friend-empty">No friend requests pending.</div>`;
        return;
    }

    const requesterIds = friendRequests.map(r => r.requester_id);
    const { data: profiles } = await supabaseClient.from("profiles").select("*").in("id", requesterIds);

    container.innerHTML = (profiles || []).map(p => `
        <div class="request-card">
            <div class="avatar">${escapeHTML(p.display_name?.charAt(0) || "U")}</div>
            <div class="person-info">
                <strong>${escapeHTML(p.display_name)}</strong>
                <span>@${escapeHTML(p.username)}</span>
            </div>
            <div class="request-actions">
                <button class="accept-button" onclick="handleAccept('${p.id}')">Accept</button>
            </div>
        </div>
    `).join("");
}

window.handleAccept = async (userId) => {
    await supabaseClient.from("friendships").update({ status: "accepted" }).match({
        requester_id: userId,
        addressee_id: currentUser.id
    });
    await loadSocialData();
};

/* =====================================================
   CAMERA SYSTEM
===================================================== */

const captureModal = document.getElementById("captureModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const cameraError = document.getElementById("cameraError");

async function startCamera() {
    if (captureModal) captureModal.classList.add("show");
    if (cameraError) cameraError.classList.remove("show");

    try {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
        });

        if (cameraVideo) {
            cameraVideo.srcObject = mediaStream;
        }
    } catch (err) {
        console.error("Camera access error:", err);
        if (cameraError) cameraError.classList.add("show");
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (captureModal) captureModal.classList.remove("show");
}

document.getElementById("captureButton")?.addEventListener("click", startCamera);
document.getElementById("navCamera")?.addEventListener("click", startCamera);
document.getElementById("closeCapture")?.addEventListener("click", stopCamera);
document.getElementById("cancelCamera")?.addEventListener("click", stopCamera);

document.getElementById("switchCamera")?.addEventListener("click", () => {
    facingMode = facingMode === "user" ? "environment" : "user";
    startCamera();
});

// Filters
document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");

        const filter = chip.dataset.filter;
        currentFilter = filter;

        if (cameraVideo) {
            if (filter === "mono") cameraVideo.style.filter = "grayscale(1)";
            else if (filter === "fade") cameraVideo.style.filter = "opacity(0.7)";
            else if (filter === "warm") cameraVideo.style.filter = "sepia(0.4)";
            else if (filter === "cool") cameraVideo.style.filter = "hue-rotate(180deg)";
            else if (filter === "noir") cameraVideo.style.filter = "contrast(1.5) grayscale(1)";
            else cameraVideo.style.filter = "none";
        }
    });
});

// Capture Photo
document.getElementById("realCaptureButton")?.addEventListener("click", () => {
    if (!cameraVideo || !cameraCanvas) return;

    const context = cameraCanvas.getContext("2d");
    cameraCanvas.width = cameraVideo.videoWidth || 640;
    cameraCanvas.height = cameraVideo.videoHeight || 480;

    context.filter = cameraVideo.style.filter || "none";
    context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

    capturedDataUrl = cameraCanvas.toDataURL("image/jpeg", 0.85);

    stopCamera();

    const previewModal = document.getElementById("previewModal");
    const capturedImage = document.getElementById("capturedImage");

    if (capturedImage) capturedImage.src = capturedDataUrl;
    if (previewModal) previewModal.classList.add("show");
});

document.getElementById("discardButton")?.addEventListener("click", () => {
    document.getElementById("previewModal")?.classList.remove("show");
    capturedDataUrl = null;
});

// Post Instant
document.getElementById("postInstantButton")?.addEventListener("click", async () => {
    if (!capturedDataUrl || !currentUser) return;

    const postBtn = document.getElementById("postInstantButton");
    postBtn.disabled = true;
    postBtn.textContent = "Posting...";

    try {
        const response = await fetch(capturedDataUrl);
        const blob = await response.blob();
        const fileName = `${currentUser.id}/${Date.now()}.jpg`;

        const { data: storageData, error: storageError } = await supabaseClient.storage
            .from("instants")
            .upload(fileName, blob, { contentType: "image/jpeg" });

        if (storageError) throw storageError;

        const { error: dbError } = await supabaseClient
            .from("instants")
            .insert({
                user_id: currentUser.id,
                image_path: storageData.path,
                created_at: new Date().toISOString()
            });

        if (dbError) throw dbError;

        document.getElementById("previewModal")?.classList.remove("show");
        capturedDataUrl = null;

        await loadInstants();
        await loadMyInstants();
        showScreen("homeScreen");

    } catch (err) {
        console.error("Error posting instant:", err);
        alert("Failed to post Instant. Please try again.");
    } finally {
        postBtn.disabled = false;
        postBtn.textContent = "Post Instant";
    }
});

/* =====================================================
   INSTANTS & FEED
===================================================== */

async function loadInstants() {
    if (!currentUser || loadingInstants) return;
    loadingInstants = true;

    try {
        const friendIds = friends.map(f => f.userId);
        friendIds.push(currentUser.id);

        const { data, error } = await supabaseClient
            .from("instants")
            .select("*, profiles:user_id(display_name, username)")
            .in("user_id", friendIds)
            .order("created_at", { ascending: false });

        if (error) throw error;

        instants = data || [];
        currentIndex = 0;

        renderCardStack();
        updateHomeFeedUI();

    } catch (err) {
        console.error("Load instants error:", err);
    } finally {
        loadingInstants = false;
    }
}

function updateHomeFeedUI() {
    const instantCountTitle = document.getElementById("instantCountTitle");
    if (instantCountTitle) {
        instantCountTitle.textContent = `${instants.length} new Instants`;
    }

    const friendsStrip = document.getElementById("friendsStrip");
    if (friendsStrip) {
        if (!friends.length) {
            friendsStrip.innerHTML = `<div class="friend-empty">No friends added yet.</div>`;
        } else {
            friendsStrip.innerHTML = friends.map(f => `
                <div class="friend-avatar">
                    <div class="avatar">${f.userId.charAt(0).toUpperCase()}</div>
                    <span>Friend</span>
                </div>
            `).join("");
        }
    }
}

function renderCardStack() {
    const cardArea = document.getElementById("cardArea");
    if (!cardArea) return;

    cardArea.innerHTML = "";

    const currentElem = document.getElementById("currentInstant");
    const totalElem = document.getElementById("totalInstants");

    if (currentElem) currentElem.textContent = instants.length ? currentIndex + 1 : 0;
    if (totalElem) totalElem.textContent = instants.length;

    if (!instants.length || currentIndex >= instants.length) {
        cardArea.innerHTML = `
            <div class="empty-state">
                <strong>All caught up!</strong>
                <span>No more Instants to view right now.</span>
            </div>`;
        return;
    }

    const visible = instants.slice(currentIndex, currentIndex + 3);

    visible.forEach((inst, idx) => {
        const card = document.createElement("div");
        card.className = "instant-card";

        const { data } = supabaseClient.storage.from("instants").getPublicUrl(inst.image_path);
        const imageUrl = data?.publicUrl || "";

        card.innerHTML = `
            <div class="instant-photo" style="background-image: url('${imageUrl}');"></div>
            <div class="instant-gradient"></div>
            <div class="instant-info">
                <div class="instant-user">
                    <div class="avatar">${escapeHTML(inst.profiles?.display_name?.charAt(0) || "U")}</div>
                    <div>
                        <strong>${escapeHTML(inst.profiles?.display_name || "User")}</strong>
                        <span>@${escapeHTML(inst.profiles?.username || "user")}</span>
                    </div>
                </div>
            </div>
        `;

        if (idx === 0) {
            setupSwipe(card);
        }

        cardArea.appendChild(card);
    });
}

function setupSwipe(card) {
    let startX = 0;
    let currentX = 0;

    const onTouchStart = (e) => {
        startX = e.touches[0].clientX;
    };

    const onTouchMove = (e) => {
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        if (diffX > 0) {
            card.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
        }
    };

    const onTouchEnd = () => {
        const diffX = currentX - startX;
        if (diffX > 100) {
            card.classList.add("swipe-right");
            setTimeout(() => {
                currentIndex++;
                renderCardStack();
            }, 300);
        } else {
            card.style.transform = "";
        }
    };

    card.addEventListener("touchstart", onTouchStart);
    card.addEventListener("touchmove", onTouchMove);
    card.addEventListener("touchend", onTouchEnd);
}

document.getElementById("openInstants")?.addEventListener("click", () => {
    showScreen("instantsScreen");
});

document.getElementById("instantCount")?.addEventListener("click", () => {
    showScreen("instantsScreen");
});

/* =====================================================
   MY INSTANTS
===================================================== */

async function loadMyInstants() {
    if (!currentUser || loadingMyInstants) return;
    loadingMyInstants = true;

    try {
        const { data, error } = await supabaseClient
            .from("instants")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        myInstants = data || [];

        const myInstantCount = document.getElementById("myInstantCount");
        if (myInstantCount) myInstantCount.textContent = myInstants.length;

        const container = document.getElementById("myInstantPreview");
        if (container) {
            if (!myInstants.length) {
                container.innerHTML = `<div class="friend-empty" style="grid-column: 1/-1;">No Instants captured yet.</div>`;
            } else {
                container.innerHTML = myInstants.map(inst => {
                    const { data } = supabaseClient.storage.from("instants").getPublicUrl(inst.image_path);
                    return `
                        <div class="my-instant-item">
                            <div class="my-instant-image" style="background-image: url('${data?.publicUrl}');"></div>
                        </div>
                    `;
                }).join("");
            }
        }
    } catch (err) {
        console.error("Load my instants error:", err);
    } finally {
        loadingMyInstants = false;
    }
}

/* =====================================================
   EDIT PROFILE MODAL
===================================================== */

const editProfileModal = document.getElementById("editProfileModal");
const editProfileButton = document.getElementById("editProfileButton");
const closeEditProfile = document.getElementById("closeEditProfile");
const saveProfileButton = document.getElementById("saveProfileButton");
const editDisplayName = document.getElementById("editDisplayName");
const editUsername = document.getElementById("editUsername");
const editProfileMessage = document.getElementById("editProfileMessage");

if (editProfileButton) {
    editProfileButton.addEventListener("click", () => {
        if (!currentProfile) return;
        editDisplayName.value = currentProfile.display_name || "";
        editUsername.value = currentProfile.username || "";
        if (editProfileMessage) editProfileMessage.textContent = "";
        editProfileModal.classList.add("show");
    });
}

if (closeEditProfile) {
    closeEditProfile.addEventListener("click", () => {
        editProfileModal.classList.remove("show");
    });
}

if (saveProfileButton) {
    saveProfileButton.addEventListener("click", async () => {
        const newName = editDisplayName.value.trim();
        const newUsername = editUsername.value.trim().toLowerCase();

        if (!newName || !validateUsername(newUsername)) {
            if (editProfileMessage) editProfileMessage.textContent = "Please provide a valid name and username.";
            return;
        }

        saveProfileButton.disabled = true;

        try {
            const { error } = await supabaseClient
                .from("profiles")
                .update({
                    display_name: newName,
                    username: newUsername
                })
                .eq("id", currentUser.id);

            if (error) throw error;

            await loadCurrentProfile();
            editProfileModal.classList.remove("show");
        } catch (err) {
            console.error("Update profile error:", err);
            if (editProfileMessage) editProfileMessage.textContent = "Error updating profile. Username might be taken.";
        } finally {
            saveProfileButton.disabled = false;
        }
    });
}

/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeAuth();
});
