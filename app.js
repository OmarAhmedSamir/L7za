// Supabase Configuration
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let mediaStream = null;
let capturedBlob = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupEventListeners();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        showMainView();
    } else {
        showAuthView();
    }
});

// View Routing & Viewports
function showAuthView() {
    document.getElementById("authView").classList.remove("hidden");
    document.getElementById("mainView").classList.add("hidden");
}

async function showMainView() {
    document.getElementById("authView").classList.add("hidden");
    document.getElementById("mainView").classList.remove("hidden");
    
    await loadUserProfile();
    loadInstantsFeed();
    loadPendingRequests();
}

function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetSectionId = item.getAttribute("data-target");
            
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");

            document.querySelectorAll(".section-view").forEach(s => s.classList.remove("active"));
            document.getElementById(targetSectionId).classList.add("active");

            if (targetSectionId === "cameraSection") {
                startCamera();
            } else {
                stopCamera();
            }

            if (targetSectionId === "feedSection") {
                loadInstantsFeed();
            }
        });
    });

    document.getElementById("openProfileBtn").addEventListener("click", () => {
        document.querySelectorAll(".section-view").forEach(s => s.classList.remove("active"));
        document.getElementById("profileSection").classList.add("active");
    });
}

// User Authentication
function setupEventListeners() {
    document.getElementById("loginBtn").addEventListener("click", async () => {
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else {
            currentUser = data.user;
            showMainView();
        }
    });

    document.getElementById("signupBtn").addEventListener("click", async () => {
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        const username = document.getElementById("authUsername").value.trim();

        if (!username) return alert("Please specify a username.");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (error) return alert(error.message);

        if (data.user) {
            await supabase.from("profiles").insert([{ id: data.user.id, username }]);
            currentUser = data.user;
            showMainView();
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await supabase.auth.signOut();
        currentUser = null;
        showAuthView();
    });

    // Search and Requests Tabs
    document.getElementById("searchUsersBtn").addEventListener("click", () => {
        const query = document.getElementById("userSearchInput").value;
        searchUsers(query);
    });

    document.getElementById("tabSearchResults").addEventListener("click", (e) => {
        e.target.classList.add("active");
        document.getElementById("tabPendingRequests").classList.remove("active");
        document.getElementById("searchResultsList").classList.remove("hidden");
        document.getElementById("pendingRequestsList").classList.add("hidden");
    });

    document.getElementById("tabPendingRequests").addEventListener("click", (e) => {
        e.target.classList.add("active");
        document.getElementById("tabSearchResults").classList.remove("active");
        document.getElementById("pendingRequestsList").classList.remove("hidden");
        document.getElementById("searchResultsList").classList.add("hidden");
        loadPendingRequests();
    });

    // Profile Avatar Upload
    document.getElementById("avatarInput").addEventListener("change", uploadAvatar);

    // Camera Handlers
    document.getElementById("captureBtn").addEventListener("click", capturePhoto);
    document.getElementById("retakeBtn").addEventListener("click", resetCameraUI);
    document.getElementById("postInstantBtn").addEventListener("click", uploadInstant);
}

// User Profile Data
async function loadUserProfile() {
    const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", currentUser.id)
        .single();

    if (data) {
        document.getElementById("profileUsername").innerText = `@${data.username || 'user'}`;
        const avatar = data.avatar_url || "https://via.placeholder.com/100";
        document.getElementById("profileAvatar").src = avatar;
        document.getElementById("navAvatar").src = avatar;
    }
}

async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${currentUser.id}_${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadErr) return alert("Avatar upload failed: " + uploadErr.message);

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", currentUser.id);
    loadUserProfile();
}

// Fixed Search Function (Excludes current user, requires non-empty query)
async function searchUsers(searchQuery) {
    const query = searchQuery.trim();
    const list = document.getElementById("searchResultsList");
    list.innerHTML = "";

    if (!query) {
        list.innerHTML = `<p class="placeholder-text">Search for people to add them.</p>`;
        return;
    }

    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("id", currentUser.id);

    if (error || !users || users.length === 0) {
        list.innerHTML = `<p class="placeholder-text">No users found.</p>`;
        return;
    }

    users.forEach(u => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
            <div class="user-info">
                <img src="${u.avatar_url || 'https://via.placeholder.com/40'}" class="avatar-sm" />
                <span>@${u.username}</span>
            </div>
            <button class="glass-btn primary" onclick="sendFriendRequest('${u.id}')">Add</button>
        `;
        list.appendChild(card);
    });
}

// Fixed Send Request (Guards against adding self)
async function sendFriendRequest(targetUserId) {
    if (targetUserId === currentUser.id) {
        alert("You cannot add yourself.");
        return;
    }

    const { error } = await supabase.from("friendships").insert([
        { requester_id: currentUser.id, addressee_id: targetUserId, status: "pending" }
    ]);

    if (error) alert("Request already sent or pending.");
    else alert("Friend request sent!");
}

// Load Pending Incoming Requests
async function loadPendingRequests() {
    const list = document.getElementById("pendingRequestsList");

    const { data: requests } = await supabase
        .from("friendships")
        .select("id, requester_id, profiles!friendships_requester_id_fkey(username, avatar_url)")
        .eq("addressee_id", currentUser.id)
        .eq("status", "pending");

    const reqCountEl = document.getElementById("reqCount");
    reqCountEl.innerText = requests ? requests.length : 0;

    if (!requests || requests.length === 0) {
        list.innerHTML = `<p class="placeholder-text">No pending friend requests.</p>`;
        return;
    }

    list.innerHTML = "";
    requests.forEach(r => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
            <div class="user-info">
                <img src="${r.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="avatar-sm" />
                <span>@${r.profiles?.username}</span>
            </div>
            <button class="glass-btn primary" onclick="acceptRequest('${r.id}')">Accept</button>
        `;
        list.appendChild(card);
    });
}

async function acceptRequest(friendshipId) {
    const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

    if (!error) {
        loadPendingRequests();
        loadInstantsFeed();
    }
}

// Fixed Instants Feed (Displays own posts AND accepted friends' posts)
async function loadInstantsFeed() {
    const container = document.getElementById("instantsContainer");

    const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);

    const friendIds = friendships ? friendships.map(f => 
        f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
    ) : [];

    const allowedUserIds = [currentUser.id, ...friendIds];

    const { data: instants, error } = await supabase
        .from("instants")
        .select("*, profiles(username, avatar_url)")
        .in("user_id", allowedUserIds)
        .order("created_at", { ascending: false });

    if (error || !instants || instants.length === 0) {
        container.innerHTML = `<p class="placeholder-text">No Instants yet. Take one on the camera tab!</p>`;
        return;
    }

    container.innerHTML = "";
    instants.forEach(item => {
        const card = document.createElement("div");
        card.className = "instant-card";
        card.innerHTML = `
            <div class="instant-header">
                <img src="${item.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="avatar-sm" />
                <span>@${item.profiles?.username || 'user'}</span>
            </div>
            <img src="${item.media_url}" class="instant-media" />
        `;
        container.appendChild(card);
    });
}

// Camera Engine
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        document.getElementById("cameraVideo").srcObject = mediaStream;
    } catch (err) {
        alert("Camera permission denied or unavailable.");
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
        capturedBlob = blob;
        document.getElementById("capturedPreview").src = URL.createObjectURL(blob);
        document.getElementById("capturedPreview").classList.remove("hidden");
        video.classList.add("hidden");

        document.getElementById("captureBtn").classList.add("hidden");
        document.getElementById("retakeBtn").classList.remove("hidden");
        document.getElementById("postInstantBtn").classList.remove("hidden");
    }, "image/jpeg");
}

function resetCameraUI() {
    capturedBlob = null;
    document.getElementById("capturedPreview").classList.add("hidden");
    document.getElementById("cameraVideo").classList.remove("hidden");

    document.getElementById("captureBtn").classList.remove("hidden");
    document.getElementById("retakeBtn").classList.add("hidden");
    document.getElementById("postInstantBtn").classList.add("hidden");
}

async function uploadInstant() {
    if (!capturedBlob) return;

    const filePath = `instants/${currentUser.id}_${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage.from("instants").upload(filePath, capturedBlob);

    if (uploadErr) return alert("Upload error: " + uploadErr.message);

    const { data: { publicUrl } } = supabase.storage.from("instants").getPublicUrl(filePath);

    await supabase.from("instants").insert([{ user_id: currentUser.id, media_url: publicUrl }]);

    resetCameraUI();
    document.querySelector('.nav-item[data-target="feedSection"]').click();
}
