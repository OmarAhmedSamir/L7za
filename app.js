/* =====================================================
   L7ZA — COMPLETE APP.JS
===================================================== */

/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL = "https://ogxbaalnebmmqxneypuy.supabase.co"; //
const SUPABASE_KEY = "sb_publishable_ksfgbcVqNa6P8GRahVhDYA_KLK30bt7"; //[cite: 6]

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); //[cite: 6]

/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null; //[cite: 6]
let currentProfile = null; //[cite: 6]

let instants = []; //[cite: 6]
let myInstants = []; //[cite: 6]

let currentIndex = 0; //[cite: 6]

let friends = []; //[cite: 6]
let friendRequests = []; //[cite: 6]
let sentRequests = []; //[cite: 6]

let loadingInstants = false; //[cite: 6]
let loadingMyInstants = false; //[cite: 6]
let loadingFriends = false; //[cite: 6]
let loadingRequests = false; //[cite: 6]

/* =====================================================
   AUTH ELEMENTS
===================================================== */

const authScreen = document.getElementById("authScreen"); //[cite: 4, 6]
const mainApp = document.getElementById("mainApp"); //[cite: 4, 6]
const authTitle = document.getElementById("authTitle"); //[cite: 4, 6]
const authSubtitle = document.getElementById("authSubtitle"); //[cite: 4, 6]
const authSubmit = document.getElementById("authSubmit"); //[cite: 4, 6]
const authSwitch = document.getElementById("authSwitch"); //[cite: 4, 6]
const authMessage = document.getElementById("authMessage"); //[cite: 4, 6]
const authEmail = document.getElementById("authEmail"); //[cite: 4, 6]
const authPassword = document.getElementById("authPassword"); //[cite: 4, 6]
const authDisplayName = document.getElementById("authDisplayName"); //[cite: 4, 6]
const authUsername = document.getElementById("authUsername"); //[cite: 4, 6]
const signupFields = document.querySelectorAll(".signup-only"); //[cite: 4, 6]

let authMode = "login"; //[cite: 6]

/* =====================================================
   UTILITY HELPERS
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

function formatTimeAgo(dateString) {
    if (!dateString) return "";
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/* =====================================================
   AUTH UI & LOGIC
===================================================== */

function setAuthMode(mode) {
    authMode = mode; //[cite: 6]
    clearAuthMessage(); //[cite: 6]

    if (mode === "signup") { //[cite: 6]
        authTitle.textContent = "Create your account."; //[cite: 6]
        authSubtitle.textContent = "Join L7za and start sharing real moments."; //[cite: 6]
        authSubmit.textContent = "Create account"; //[cite: 6]
        authSwitch.innerHTML = `Already have an account? <strong>Sign in</strong>`; //[cite: 6]
        signupFields.forEach(field => field.style.display = "block"); //[cite: 6]
        authPassword.autocomplete = "new-password"; //[cite: 6]
    } else {
        authTitle.textContent = "Welcome back."; //[cite: 6]
        authSubtitle.textContent = "Sign in to see what your friends are doing."; //[cite: 6]
        authSubmit.textContent = "Sign in"; //[cite: 6]
        authSwitch.innerHTML = `Don't have an account? <strong>Sign up</strong>`; //[cite: 6]
        signupFields.forEach(field => field.style.display = "none"); //[cite: 6]
        authPassword.autocomplete = "current-password"; //[cite: 6]
    }
}

if (authSwitch) {
    authSwitch.addEventListener("click", () => {
        setAuthMode(authMode === "login" ? "signup" : "login"); //[cite: 6]
    });
}

function showAuthMessage(message, type = "") {
    if (!authMessage) return; //[cite: 6]
    authMessage.textContent = message; //[cite: 6]
    authMessage.className = "auth-message"; //[cite: 6]
    if (type) authMessage.classList.add(type); //[cite: 6]
}

function clearAuthMessage() {
    if (!authMessage) return; //[cite: 6]
    authMessage.textContent = ""; //[cite: 6]
    authMessage.className = "auth-message"; //[cite: 6]
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,24}$/.test(username); //[cite: 6]
}

function validateSignup() {
    const displayName = authDisplayName.value.trim(); //[cite: 6]
    const username = authUsername.value.trim().toLowerCase(); //[cite: 6]

    if (!displayName) {
        showAuthMessage("Please enter your name.", "error"); //[cite: 6]
        return null;
    }
    if (!validateUsername(username)) {
        showAuthMessage("Username must be 3–24 characters using letters, numbers, or _.", "error"); //[cite: 6]
        return null;
    }
    return { displayName, username }; //[cite: 6]
}

async function signUp() {
    clearAuthMessage(); //[cite: 6]
    const signup = validateSignup(); //[cite: 6]
    if (!signup) return;

    const email = authEmail.value.trim().toLowerCase(); //[cite: 6]
    const password = authPassword.value; //[cite: 6]

    if (!email) {
        showAuthMessage("Please enter your email.", "error"); //[cite: 6]
        return;
    }
    if (password.length < 6) {
        showAuthMessage("Password must be at least 6 characters.", "error"); //[cite: 6]
        return;
    }

    setAuthLoading(true); //[cite: 6]

    try {
        const { data: existingProfile, error: usernameError } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("username", signup.username)
            .maybeSingle(); //[cite: 6]

        if (usernameError) throw usernameError; //[cite: 6]
        if (existingProfile) {
            showAuthMessage("That username is already taken.", "error"); //[cite: 6]
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
        }); //[cite: 6]

        if (error) throw error; //[cite: 6]

        if (!data.session) {
            showAuthMessage("Account created. Check your email to confirm your account.", "success"); //[cite: 6]
            authPassword.value = ""; //[cite: 6]
            return;
        }

        currentUser = data.user; //[cite: 6]
        await loadCurrentProfile(); //[cite: 6]
        await showMainApp(); //[cite: 6]
    } catch (error) {
        console.error("Sign up error:", error); //[cite: 6]
        showAuthMessage(getAuthErrorMessage(error), "error"); //[cite: 6]
    } finally {
        setAuthLoading(false); //[cite: 6]
    }
}

async function signIn() {
    clearAuthMessage(); //[cite: 6]
    const email = authEmail.value.trim().toLowerCase(); //[cite: 6]
    const password = authPassword.value; //[cite: 6]

    if (!email || !password) {
        showAuthMessage("Please enter your email and password.", "error"); //[cite: 6]
        return;
    }

    setAuthLoading(true); //[cite: 6]

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        }); //[cite: 6]

        if (error) throw error; //[cite: 6]

        currentUser = data.user; //[cite: 6]
        await loadCurrentProfile(); //[cite: 6]
        await showMainApp(); //[cite: 6]
    } catch (error) {
        console.error("Sign in error:", error); //[cite: 6]
        showAuthMessage(getAuthErrorMessage(error), "error"); //[cite: 6]
    } finally {
        setAuthLoading(false); //[cite: 6]
    }
}

if (authSubmit) {
    authSubmit.addEventListener("click", async () => {
        if (authMode === "signup") {
            await signUp(); //[cite: 6]
        } else {
            await signIn(); //[cite: 6]
        }
    });
}

[authEmail, authPassword, authDisplayName, authUsername].forEach(input => {
    if (!input) return; //[cite: 6]
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") authSubmit.click(); //[cite: 6]
    });
});

function setAuthLoading(loading) {
    if (!authSubmit) return; //[cite: 6]
    authSubmit.disabled = loading; //[cite: 6]
    authSubmit.textContent = loading
        ? (authMode === "signup" ? "Creating account..." : "Signing in...")
        : (authMode === "signup" ? "Create account" : "Sign in"); //[cite: 6]
}

function getAuthErrorMessage(error) {
    const message = error?.message || ""; //[cite: 6]
    const lower = message.toLowerCase(); //[cite: 6]

    if (lower.includes("invalid login credentials")) return "Incorrect email or password."; //[cite: 6]
    if (lower.includes("email not confirmed")) return "Please confirm your email before signing in."; //[cite: 6]
    if (lower.includes("user already registered")) return "An account with this email already exists."; //[cite: 6]
    if (lower.includes("password should be at least")) return "Your password is too short."; //[cite: 6]

    return message || "Something went wrong. Please try again."; //[cite: 6]
}

/* =====================================================
   PROFILE MANAGEMENT
===================================================== */

async function loadCurrentProfile() {
    if (!currentUser) return; //[cite: 6]

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle(); //[cite: 6]

    if (error) {
        console.error("Profile error:", error); //[cite: 6]
        return;
    }

    currentProfile = data; //[cite: 6]

    if (!currentProfile) {
        const metadata = currentUser.user_metadata || {}; //[cite: 6]
        const username = metadata.username || `user_${currentUser.id.slice(0, 8)}`; //[cite: 6]
        const displayName = metadata.display_name || "New User"; //[cite: 6]

        const { data: createdProfile, error: createError } = await supabaseClient
            .from("profiles")
            .insert({
                id: currentUser.id,
                username,
                display_name: displayName
            })
            .select()
            .single(); //[cite: 6]

        if (createError) {
            console.error("Create profile error:", createError); //[cite: 6]
            return;
        }
        currentProfile = createdProfile; //[cite: 6]
    }

    updateProfileUI(); //[cite: 6]
}

function updateProfileUI() {
    if (!currentProfile) return; //[cite: 6]

    const name = currentProfile.display_name || "User"; //[cite: 6]
    const username = currentProfile.username || "user"; //[cite: 6]

    const profileName = document.getElementById("profileName"); //[cite: 4, 6]
    const profileUsername = document.getElementById("profileUsername"); //[cite: 4, 6]
    const profileAvatar = document.getElementById("profileAvatar"); //[cite: 4, 6]

    if (profileName) profileName.textContent = name; //[cite: 6]
    if (profileUsername) profileUsername.textContent = `@${username}`; //[cite: 6]
    if (profileAvatar) profileAvatar.textContent = name.charAt(0).toUpperCase(); //[cite: 6]
}

/* =====================================================
   APP LIFECYCLE & ROUTING
===================================================== */

async function showMainApp() {
    if (authScreen) authScreen.classList.add("hidden"); //[cite: 6]
    if (mainApp) mainApp.classList.remove("hidden"); //[cite: 6]

    document.body.style.overflow = ""; //[cite: 6]
    updateProfileUI(); //[cite: 6]
    showScreen("homeScreen"); //[cite: 6]

    await loadSocialData(); //[cite: 6]
    await Promise.allSettled([loadInstants(), loadMyInstants()]); //[cite: 6]
}

function showAuth() {
    stopCamera(); //[cite: 6]
    if (captureModal) captureModal.classList.remove("show"); //[cite: 6]
    if (previewModal) previewModal.classList.remove("show"); //[cite: 6]
    if (mainApp) mainApp.classList.add("hidden"); //[cite: 6]
    if (authScreen) authScreen.classList.remove("hidden"); //[cite: 6]

    document.body.style.overflow = ""; //[cite: 6]
    setAuthMode("login"); //[cite: 6]
}

const logoutButton = document.getElementById("logoutButton"); //[cite: 4, 6]
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await supabaseClient.auth.signOut(); //[cite: 6]
        } catch (error) {
            console.error("Logout error:", error); //[cite: 6]
        }
        resetState(); //[cite: 6]
        showAuth(); //[cite: 6]
    });
}

function resetState() {
    currentUser = null; //[cite: 6]
    currentProfile = null; //[cite: 6]
    instants = []; //[cite: 6]
    myInstants = []; //[cite: 6]
    friends = []; //[cite: 6]
    friendRequests = []; //[cite: 6]
    sentRequests = []; //[cite: 6]
    currentIndex = 0; //[cite: 6]
}

async function initializeAuth() {
    try {
        const { data, error } = await supabaseClient.auth.getSession(); //[cite: 6]
        if (error) throw error; //[cite: 6]

        if (data.session?.user) {
            currentUser = data.session.user; //[cite: 6]
            await loadCurrentProfile(); //[cite: 6]
            await showMainApp(); //[cite: 6]
        } else {
            showAuth(); //[cite: 6]
        }
    } catch (error) {
        console.error("Session error:", error); //[cite: 6]
        showAuth(); //[cite: 6]
    }
}

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
        resetState(); //[cite: 6]
        showAuth(); //[cite: 6]
        return;
    }
    if (event === "SIGNED_IN" && session?.user) {
        currentUser = session.user; //[cite: 6]
        await loadCurrentProfile(); //[cite: 6]
        await showMainApp(); //[cite: 6]
    }
});

const screens = document.querySelectorAll(".screen"); //[cite: 4, 6]
const navItems = document.querySelectorAll(".nav-item"); //[cite: 4, 6]

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove("active")); //[cite: 6]
    const target = document.getElementById(screenId); //[cite: 4, 6]
    if (target) target.classList.add("active"); //[cite: 6]

    navItems.forEach(item => {
        item.classList.remove("active"); //[cite: 6]
        if (item.dataset.screen === screenId) item.classList.add("active"); //[cite: 6]
    });

    window.scrollTo({ top: 0, behavior: "auto" }); //[cite: 6]

    if (screenId === "friendsScreen" || screenId === "requestsScreen") loadSocialData(); //[cite: 6]
    if (screenId === "profileScreen") loadMyInstants(); //[cite: 6]
}

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const screen = item.dataset.screen; //[cite: 4, 6]
        if (screen) showScreen(screen); //[cite: 6]
    });
});

document.querySelectorAll(".back-button").forEach(button => {
    button.addEventListener("click", () => {
        showScreen(button.dataset.back); //[cite: 4, 6]
    });
});

/* =====================================================
   FRIENDSHIPS & REQUESTS
===================================================== */

function friendshipStatusFor(userId) {
    if (!currentUser || !userId) return "none"; //[cite: 6]

    if (friends.some(item => item.userId === userId)) return "friends"; //[cite: 6]
    if (friendRequests.some(item => item.requester_id === userId)) return "incoming"; //[cite: 6]
    if (sentRequests.some(item => item.addressee_id === userId)) return "outgoing"; //[cite: 6]

    return "none"; //[cite: 6]
}

async function loadSocialData() {
    if (!currentUser || loadingFriends) return; //[cite: 6]
    loadingFriends = true; //[cite: 6]

    try {
        const { data, error } = await supabaseClient
            .from("friendships")
            .select("id, requester_id, addressee_id, status, created_at")
            .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`); //[cite: 6]

        if (error) throw error; //[cite: 6]

        friends = [];
        friendRequests = [];
        sentRequests = [];

        (data || []).forEach(row => {
            if (row.status === "accepted") {
                const otherUserId = row.requester_id === currentUser.id ? row.addressee_id : row.requester_id; //[cite: 6]
                friends.push({ id: row.id, userId: otherUserId, requesterId: row.requester_id, addresseeId: row.addressee_id }); //[cite: 6]
            } else if (row.status === "pending") {
                if (row.addressee_id === currentUser.id) friendRequests.push(row); //[cite: 6]
                else if (row.requester_id === currentUser.id) sentRequests.push(row); //[cite: 6]
            }
        });

        updateFriendCount(); //[cite: 6]
        updateRequestBadge(); //[cite: 6]
        await renderFriendsList(); //[cite: 6]
        await renderRequests(); //[cite: 6]
    } catch (error) {
        console.error("Load social data error:", error); //[cite: 6]
    } finally {
        loadingFriends = false; //[cite: 6]
    }
}

function updateFriendCount() {
    const element = document.getElementById("friendCount"); //[cite: 4, 6]
    if (element) element.textContent = friends.length; //[cite: 6]
}

function updateRequestBadge() {
    const badge = document.getElementById("requestBadge"); //[cite: 4, 6]
    if (badge) badge.textContent = friendRequests.length; //[cite: 6]

    const dot = document.getElementById("notificationDot"); //[cite: 4, 6]
    if (dot) dot.style.display = friendRequests.length ? "block" : "none"; //[cite: 6]
}

const friendSearch = document.getElementById("friendSearch"); //[cite: 4, 6]
if (friendSearch) {
    friendSearch.addEventListener("input", async () => {
        await renderFriendsList(friendSearch.value); //[cite: 6]
    });
}

async function renderFriendsList(searchValue = "") {
    const container = document.getElementById("friendsList"); //[cite: 4, 6]
    if (!container) return; //[cite: 6]

    const query = String(searchValue || "").trim().toLowerCase(); //[cite: 6]

    try {
        let profiles = [];

        if (query) {
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .neq("id", currentUser.id)
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(30); //[cite: 6]

            if (error) throw error; //[cite: 6]
            profiles = data || []; //[cite: 6]
        } else {
            const friendIds = friends.map(item => item.userId); //[cite: 6]
            if (!friendIds.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <strong>No friends yet</strong>
                        <span>Search for people to add them.</span>
                    </div>`; //[cite: 6]
                return;
            }

            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .in("id", friendIds); //[cite: 6]

            if (error) throw error; //[cite: 6]
            profiles = data || []; //[cite: 6]
        }

        if (!profiles.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <strong>No people found</strong>
                    <span>Try another username or name.</span>
                </div>`; //[cite: 6]
            return;
        }

        container.innerHTML = profiles.map(profile => renderPersonRow(profile)).join(""); //[cite: 6]
        attachFriendButtons(); //[cite: 6]
    } catch (error) {
        console.error("Render friends error:", error); //[cite: 6]
        container.innerHTML = `<div class="empty-state">Unable to load people.</div>`; //[cite: 6]
    }
}

function renderPersonRow(profile) {
    const status = friendshipStatusFor(profile.id); //[cite: 6]
    const name = escapeHTML(profile.display_name || "User"); //[cite: 6]
    const username = escapeHTML(`@${profile.username || "user"}`); //[cite: 6]
    const avatar = escapeHTML((profile.display_name || profile.username || "U").charAt(0).toUpperCase()); //[cite: 6]

    let buttonHTML = "";
    if (status === "friends") {
        buttonHTML = `<button class="friend-action-button friends" data-user-id="${escapeHTML(profile.id)}" data-action="remove" type="button">Friends</button>`; //[cite: 6]
    } else if (status === "outgoing") {
        buttonHTML = `<button class="friend-action-button pending" data-user-id="${escapeHTML(profile.id)}" data-action="cancel" type="button">Pending</button>`; //[cite: 6]
    } else if (status === "incoming") {
        buttonHTML = `<button class="friend-action-button accept" data-user-id="${escapeHTML(profile.id)}" data-action="accept" type="button">Accept</button>`; //[cite: 6]
    } else {
        buttonHTML = `<button class="friend-action-button add" data-user-id="${escapeHTML(profile.id)}" data-action="add" type="button">Add</button>`; //[cite: 6]
    }

    return `
        <article class="person-row" data-user-id="${escapeHTML(profile.id)}">
            <div class="avatar">${avatar}</div>
            <div class="person-info">
                <strong>${name}</strong>
                <span>${username}</span>
            </div>
            ${buttonHTML}
        </article>`; //[cite: 6]
}

function attachFriendButtons() {
    document.querySelectorAll(".friend-action-button").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            const action = btn.dataset.action;
            await handleFriendAction(userId, action);
        });
    });
}

async function handleFriendAction(userId, action) {
    if (!currentUser) return;

    try {
        if (action === "add") {
            await supabaseClient.from("friendships").insert({
                requester_id: currentUser.id,
                addressee_id: userId,
                status: "pending"
            });
        } else if (action === "accept") {
            await supabaseClient.from("friendships")
                .update({ status: "accepted" })
                .or(`and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id}),and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId})`);
        } else if (action === "cancel" || action === "remove") {
            await supabaseClient.from("friendships")
                .delete()
                .or(`and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id}),and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId})`);
        }
        await loadSocialData();
    } catch (err) {
        console.error("Friend action error:", err);
    }
}

async function renderRequests() {
    const container = document.getElementById("requestsList"); //[cite: 4]
    if (!container) return;

    if (!friendRequests.length) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>No friend requests</strong>
                <span>New requests will appear here.</span>
            </div>`;
        return;
    }

    const requesterIds = friendRequests.map(r => r.requester_id);
    const { data: profiles, error } = await supabaseClient
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", requesterIds);

    if (error || !profiles) {
        container.innerHTML = `<div class="empty-state">Error loading requests.</div>`;
        return;
    }

    container.innerHTML = profiles.map(p => `
        <article class="request-card" data-user-id="${escapeHTML(p.id)}">
            <div class="avatar">${escapeHTML((p.display_name || p.username || "U").charAt(0).toUpperCase())}</div>
            <div class="person-info">
                <strong>${escapeHTML(p.display_name || "User")}</strong>
                <span>@${escapeHTML(p.username || "user")}</span>
            </div>
            <div class="request-actions">
                <button class="accept-button" onclick="handleFriendAction('${escapeHTML(p.id)}', 'accept')">Accept</button>
                <button class="decline-button" onclick="handleFriendAction('${escapeHTML(p.id)}', 'cancel')">×</button>
            </div>
        </article>
    `).join("");
}

/* =====================================================
   REAL CAMERA ENGINE
===================================================== */

let mediaStream = null;
let currentFacingMode = "environment";
let selectedFilter = "original";

const captureModal = document.getElementById("captureModal"); //[cite: 4]
const previewModal = document.getElementById("previewModal"); //[cite: 4]
const cameraVideo = document.getElementById("cameraVideo"); //[cite: 4]
const cameraCanvas = document.getElementById("cameraCanvas"); //[cite: 4]
const cameraError = document.getElementById("cameraError"); //[cite: 4]
const capturedImage = document.getElementById("capturedImage"); //[cite: 4]

async function startCamera() {
    if (!captureModal) return;
    captureModal.classList.add("show");
    if (cameraError) cameraError.classList.remove("show");

    try {
        if (mediaStream) stopCamera();
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
            audio: false
        });
        if (cameraVideo) {
            cameraVideo.srcObject = mediaStream;
            await cameraVideo.play();
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
    if (cameraVideo) cameraVideo.srcObject = null;
}

document.getElementById("captureButton")?.addEventListener("click", startCamera); //[cite: 4]
document.getElementById("navCamera")?.addEventListener("click", startCamera); //[cite: 4]
document.getElementById("closeCapture")?.addEventListener("click", () => {
    stopCamera();
    captureModal.classList.remove("show");
}); //[cite: 4]
document.getElementById("cancelCamera")?.addEventListener("click", () => {
    stopCamera();
    captureModal.classList.remove("show");
}); //[cite: 4]
document.getElementById("switchCamera")?.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    startCamera();
}); //[cite: 4]
document.getElementById("retryCamera")?.addEventListener("click", startCamera); //[cite: 4]

document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedFilter = chip.dataset.filter || "original";
        applyFilterToVideo(selectedFilter);
    });
}); //[cite: 4]

function applyFilterToVideo(filter) {
    if (!cameraVideo) return;
    const filterStyles = {
        original: "none",
        mono: "grayscale(1)",
        fade: "contrast(0.8) brightness(1.1)",
        warm: "sepia(0.3) saturate(1.4) hue-rotate(-10deg)",
        cool: "hue-rotate(30deg) saturate(1.1)",
        noir: "grayscale(1) contrast(1.8) brightness(0.8)"
    };
    cameraVideo.style.filter = filterStyles[filter] || "none";
}

document.getElementById("realCaptureButton")?.addEventListener("click", takePhoto); //[cite: 4]

function takePhoto() {
    if (!cameraVideo || !cameraCanvas) return;
    const width = cameraVideo.videoWidth || 1080;
    const height = cameraVideo.videoHeight || 1440;

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const ctx = cameraCanvas.getContext("2d");
    const filterStyles = {
        original: "none",
        mono: "grayscale(100%)",
        fade: "contrast(80%) brightness(110%)",
        warm: "sepia(30%) saturate(140%) hue-rotate(-10deg)",
        cool: "hue-rotate(30deg) saturate(110%)",
        noir: "grayscale(100%) contrast(180%) brightness(80%)"
    };
    ctx.filter = filterStyles[selectedFilter] || "none";
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    const dataUrl = cameraCanvas.toDataURL("image/jpeg", 0.85);
    if (capturedImage) capturedImage.src = dataUrl;

    stopCamera();
    captureModal.classList.remove("show");
    if (previewModal) previewModal.classList.add("show");
}

document.getElementById("discardButton")?.addEventListener("click", () => {
    if (previewModal) previewModal.classList.remove("show");
    startCamera();
}); //[cite: 4]

document.getElementById("postInstantButton")?.addEventListener("click", postInstant); //[cite: 4]

async function postInstant() {
    if (!currentUser || !capturedImage?.src) return;

    const postBtn = document.getElementById("postInstantButton");
    if (postBtn) {
        postBtn.disabled = true;
        postBtn.textContent = "Posting...";
    }

    try {
        const response = await fetch(capturedImage.src);
        const blob = await response.blob();
        const fileName = `${currentUser.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from("instants")
            .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient
            .storage
            .from("instants")
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        const { error: insertError } = await supabaseClient
            .from("instants")
            .insert({
                user_id: currentUser.id,
                image_url: imageUrl,
                created_at: new Date().toISOString()
            });

        if (insertError) throw insertError;

        if (previewModal) previewModal.classList.remove("show");
        await loadInstants();
        await loadMyInstants();
        showScreen("homeScreen");

    } catch (err) {
        console.error("Post instant error:", err);
        alert("Failed to post Instant. Please check storage bucket permissions.");
    } finally {
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.textContent = "Post Instant";
        }
    }
}

/* =====================================================
   INSTANTS DISPLAY & SWIPE STACK
===================================================== */

async function loadInstants() {
    if (!currentUser || loadingInstants) return;
    loadingInstants = true;

    try {
        const friendIds = friends.map(f => f.userId);
        const allowedUserIds = [currentUser.id, ...friendIds];

        const { data, error } = await supabaseClient
            .from("instants")
            .select(`
                id,
                user_id,
                image_url,
                created_at,
                profiles:user_id (id, username, display_name, avatar_url)
            `)
            .in("user_id", allowedUserIds)
            .order("created_at", { ascending: false });

        if (error) throw error;

        instants = data || [];
        currentIndex = 0;

        renderFriendsStrip();
        renderInstantsStack();
        updateInstantCounts();

    } catch (err) {
        console.error("Load instants error:", err);
    } finally {
        loadingInstants = false;
    }
}

function renderFriendsStrip() {
    const strip = document.getElementById("friendsStrip"); //[cite: 4]
    if (!strip) return;

    if (!friends.length) {
        strip.innerHTML = `<div class="friend-empty">Add friends to see their Instants</div>`;
        return;
    }

    const friendIdsWithInstants = new Set(instants.map(i => i.user_id));

    strip.innerHTML = friends.map(f => {
        const hasInstant = friendIdsWithInstants.has(f.userId);
        return `
            <div class="friend-avatar ${hasInstant ? "has-instant" : ""}">
                <div class="avatar">${escapeHTML(f.userId.slice(0, 2).toUpperCase())}</div>
            </div>`;
    }).join("");
}

function updateInstantCounts() {
    const titleEl = document.getElementById("instantCountTitle"); //[cite: 4]
    if (titleEl) {
        titleEl.textContent = `${instants.length} new Instant${instants.length === 1 ? "" : "s"}`;
    }

    const currentEl = document.getElementById("currentInstant"); //[cite: 4]
    const totalEl = document.getElementById("totalInstants"); //[cite: 4]

    if (currentEl) currentEl.textContent = instants.length ? currentIndex + 1 : 0;
    if (totalEl) totalEl.textContent = instants.length;
}

function renderInstantsStack() {
    const container = document.getElementById("cardArea"); //[cite: 4]
    if (!container) return;

    if (!instants.length) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>No Instants yet</strong>
                <span>Be the first to take a moment today!</span>
            </div>`;
        return;
    }

    const visibleCards = instants.slice(currentIndex, currentIndex + 3);

    container.innerHTML = visibleCards.map((inst, idx) => {
        const profile = inst.profiles || {};
        const name = escapeHTML(profile.display_name || "User");
        const username = escapeHTML(`@${profile.username || "user"}`);
        const avatar = escapeHTML((profile.display_name || "U").charAt(0).toUpperCase());
        const timeAgo = formatTimeAgo(inst.created_at);

        return `
            <article class="instant-card" style="z-index: ${10 - idx};">
                <div class="instant-photo" style="background-image: url('${escapeHTML(inst.image_url)}');"></div>
                <div class="instant-gradient"></div>
                <div class="instant-info">
                    <div class="instant-user">
                        <div class="avatar">${avatar}</div>
                        <div>
                            <strong>${name}</strong>
                            <span>${username} • ${timeAgo}</span>
                        </div>
                    </div>
                </div>
            </article>`;
    }).join("");

    attachSwipeHandlers();
}

function attachSwipeHandlers() {
    const card = document.querySelector(".instant-card"); //[cite: 5]
    if (!card) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const onStart = (x) => {
        isDragging = true;
        startX = x;
    };

    const onMove = (x) => {
        if (!isDragging) return;
        currentX = x - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(currentX) > 100) {
            card.classList.add("swipe-right");
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % instants.length;
                renderInstantsStack();
                updateInstantCounts();
            }, 300);
        } else {
            card.style.transform = "";
        }
    };

    card.addEventListener("touchstart", (e) => onStart(e.touches[0].clientX));
    card.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX));
    card.addEventListener("touchend", onEnd);

    card.addEventListener("mousedown", (e) => onStart(e.clientX));
    window.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", onEnd);
}

/* =====================================================
   MY INSTANTS & PROFILE EDITING
===================================================== */

async function loadMyInstants() {
    if (!currentUser || loadingMyInstants) return;
    loadingMyInstants = true;

    try {
        const { data, error } = await supabaseClient
            .from("instants")
            .select("id, image_url, created_at")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        myInstants = data || [];

        const countEl = document.getElementById("myInstantCount"); //[cite: 4]
        if (countEl) countEl.textContent = myInstants.length;

        const grid = document.getElementById("myInstantPreview"); //[cite: 4]
        if (!grid) return;

        if (!myInstants.length) {
            grid.innerHTML = `<div class="friend-empty" style="grid-column: 1/-1;">No Instants captured yet.</div>`;
            return;
        }

        grid.innerHTML = myInstants.map(inst => `
            <div class="my-instant-item">
                <div class="my-instant-image" style="background-image: url('${escapeHTML(inst.image_url)}');"></div>
                <div class="my-instant-overlay">
                    <span>${formatTimeAgo(inst.created_at)}</span>
                </div>
            </div>`).join("");

    } catch (err) {
        console.error("Load my instants error:", err);
    } finally {
        loadingMyInstants = false;
    }
}

const editProfileModal = document.getElementById("editProfileModal"); //[cite: 4]
const editProfileButton = document.getElementById("editProfileButton"); //[cite: 4]
const closeEditProfile = document.getElementById("closeEditProfile"); //[cite: 4]
const saveProfileButton = document.getElementById("saveProfileButton"); //[cite: 4]
const editDisplayName = document.getElementById("editDisplayName"); //[cite: 4]
const editUsername = document.getElementById("editUsername"); //[cite: 4]
const editProfileMessage = document.getElementById("editProfileMessage"); //[cite: 4]

if (editProfileButton) {
    editProfileButton.addEventListener("click", () => {
        if (!currentProfile) return;
        if (editDisplayName) editDisplayName.value = currentProfile.display_name || "";
        if (editUsername) editUsername.value = currentProfile.username || "";
        if (editProfileMessage) editProfileMessage.textContent = "";
        if (editProfileModal) editProfileModal.classList.add("show");
    });
}

if (closeEditProfile) {
    closeEditProfile.addEventListener("click", () => {
        if (editProfileModal) editProfileModal.classList.remove("show");
    });
}

if (saveProfileButton) {
    saveProfileButton.addEventListener("click", async () => {
        const newName = editDisplayName?.value.trim();
        const newUsername = editUsername?.value.trim().toLowerCase();

        if (!newName || !newUsername) {
            if (editProfileMessage) editProfileMessage.textContent = "Please fill in all fields.";
            return;
        }

        saveProfileButton.disabled = true;
        saveProfileButton.textContent = "Saving...";

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
            if (editProfileModal) editProfileModal.classList.remove("show");

        } catch (err) {
            console.error("Save profile error:", err);
            if (editProfileMessage) editProfileMessage.textContent = err.message || "Failed to update profile.";
        } finally {
            saveProfileButton.disabled = false;
            saveProfileButton.textContent = "Save changes";
        }
    });
}

/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeAuth(); //[cite: 6]
});
