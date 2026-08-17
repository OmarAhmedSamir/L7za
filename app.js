/* =====================================================
   L7ZA — PHASE 3
   AUTH + CAMERA + REAL INSTANTS

   FIXED:
   - MY INSTANTS
   - ONE VIEW PER USER
   - VIEWED INSTANTS NEVER RETURN
   - CARD STACKING
   - USER NAMES
   - MOBILE / DESKTOP SCROLL
   - 24 HOUR EXPIRATION
===================================================== */


/* =====================================================
   SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
    "https://ogxbaalnebmmqxneypuy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_ksfgbcVqNa6P8GRahVhDYA_KLK30bt7";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   GLOBAL USER STATE
===================================================== */

let currentUser = null;
let currentProfile = null;


/* =====================================================
   AUTH ELEMENTS
===================================================== */

const authScreen =
    document.getElementById("authScreen");

const mainApp =
    document.getElementById("mainApp");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authSubmit =
    document.getElementById("authSubmit");

const authSwitch =
    document.getElementById("authSwitch");

const authMessage =
    document.getElementById("authMessage");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authDisplayName =
    document.getElementById("authDisplayName");

const authUsername =
    document.getElementById("authUsername");

const signupFields =
    document.querySelectorAll(".signup-only");

let authMode = "login";


/* =====================================================
   AUTH UI
===================================================== */

function setAuthMode(mode) {

    authMode = mode;

    clearAuthMessage();

    if (mode === "signup") {

        authTitle.textContent =
            "Create your account.";

        authSubtitle.textContent =
            "Join L7za and start sharing real moments.";

        authSubmit.textContent =
            "Create account";

        authSwitch.innerHTML =
            `
                Already have an account?
                <strong>Sign in</strong>
            `;

        signupFields.forEach(field => {
            field.style.display = "block";
        });

        authPassword.autocomplete =
            "new-password";

    } else {

        authTitle.textContent =
            "Welcome back.";

        authSubtitle.textContent =
            "Sign in to see what your friends are doing.";

        authSubmit.textContent =
            "Sign in";

        authSwitch.innerHTML =
            `
                Don't have an account?
                <strong>Sign up</strong>
            `;

        signupFields.forEach(field => {
            field.style.display = "none";
        });

        authPassword.autocomplete =
            "current-password";
    }
}


if (authSwitch) {

    authSwitch.addEventListener(
        "click",
        () => {

            setAuthMode(
                authMode === "login"
                    ? "signup"
                    : "login"
            );

        }
    );

}


/* =====================================================
   AUTH MESSAGE
===================================================== */

function showAuthMessage(
    message,
    type = ""
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

    authMessage.className =
        "auth-message";

    if (type) {
        authMessage.classList.add(type);
    }
}


function clearAuthMessage() {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        "";

    authMessage.className =
        "auth-message";
}


/* =====================================================
   AUTH VALIDATION
===================================================== */

function validateUsername(username) {

    return /^[a-zA-Z0-9_]{3,24}$/
        .test(username);

}


function validateSignup() {

    const displayName =
        authDisplayName.value.trim();

    const username =
        authUsername.value
            .trim()
            .toLowerCase();

    if (!displayName) {

        showAuthMessage(
            "Please enter your name.",
            "error"
        );

        return null;
    }

    if (!validateUsername(username)) {

        showAuthMessage(
            "Username must be 3–24 characters using letters, numbers, or _.",
            "error"
        );

        return null;
    }

    return {
        displayName,
        username
    };
}


/* =====================================================
   SIGN UP
===================================================== */

async function signUp() {

    clearAuthMessage();

    const signup =
        validateSignup();

    if (!signup) {
        return;
    }

    const email =
        authEmail.value
            .trim()
            .toLowerCase();

    const password =
        authPassword.value;

    if (!email) {

        showAuthMessage(
            "Please enter your email.",
            "error"
        );

        return;
    }

    if (password.length < 6) {

        showAuthMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    setAuthLoading(true);

    try {

        const {
            data: existingProfile,
            error: usernameError
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq(
                    "username",
                    signup.username
                )
                .maybeSingle();

        if (usernameError) {
            throw usernameError;
        }

        if (existingProfile) {

            showAuthMessage(
                "That username is already taken.",
                "error"
            );

            setAuthLoading(false);

            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email,
                password,

                options: {

                    data: {

                        username:
                            signup.username,

                        display_name:
                            signup.displayName
                    }

                }

            });

        if (error) {
            throw error;
        }

        if (!data.session) {

            showAuthMessage(
                "Account created. Check your email to confirm your account.",
                "success"
            );

            authPassword.value = "";

            setAuthLoading(false);

            return;
        }

        currentUser =
            data.user;

        await loadCurrentProfile();

        showMainApp();

    } catch (error) {

        console.error(
            "Sign up error:",
            error
        );

        showAuthMessage(
            getAuthErrorMessage(error),
            "error"
        );

    } finally {

        setAuthLoading(false);

    }

}


/* =====================================================
   SIGN IN
===================================================== */

async function signIn() {

    clearAuthMessage();

    const email =
        authEmail.value
            .trim()
            .toLowerCase();

    const password =
        authPassword.value;

    if (!email || !password) {

        showAuthMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    setAuthLoading(true);

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email,
                    password

                });

        if (error) {
            throw error;
        }

        currentUser =
            data.user;

        await loadCurrentProfile();

        showMainApp();

    } catch (error) {

        console.error(
            "Sign in error:",
            error
        );

        showAuthMessage(
            getAuthErrorMessage(error),
            "error"
        );

    } finally {

        setAuthLoading(false);

    }

}


/* =====================================================
   AUTH SUBMIT
===================================================== */

if (authSubmit) {

    authSubmit.addEventListener(
        "click",
        async () => {

            if (authMode === "signup") {

                await signUp();

            } else {

                await signIn();

            }

        }
    );

}


/* =====================================================
   ENTER KEY
===================================================== */

[
    authEmail,
    authPassword,
    authDisplayName,
    authUsername
]
.forEach(input => {

    if (!input) {
        return;
    }

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                authSubmit.click();
            }

        }
    );

});


/* =====================================================
   AUTH LOADING
===================================================== */

function setAuthLoading(loading) {

    if (!authSubmit) {
        return;
    }

    authSubmit.disabled =
        loading;

    if (loading) {

        authSubmit.textContent =
            authMode === "signup"
                ? "Creating account..."
                : "Signing in...";

    } else {

        authSubmit.textContent =
            authMode === "signup"
                ? "Create account"
                : "Sign in";

    }

}


/* =====================================================
   AUTH ERROR
===================================================== */

function getAuthErrorMessage(error) {

    const message =
        error?.message || "";

    const lower =
        message.toLowerCase();

    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }

    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email before signing in.";

    }

    if (
        lower.includes(
            "user already registered"
        )
    ) {

        return "An account with this email already exists.";

    }

    if (
        lower.includes(
            "password should be at least"
        )
    ) {

        return "Your password is too short.";

    }

    return (
        message ||
        "Something went wrong. Please try again."
    );

}


/* =====================================================
   LOAD CURRENT PROFILE
===================================================== */

async function loadCurrentProfile() {

    if (!currentUser) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();

    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return;
    }

    currentProfile =
        data;

    if (!currentProfile) {

        const metadata =
            currentUser.user_metadata || {};

        const username =
            metadata.username ||
            `user_${currentUser.id.slice(0, 8)}`;

        const displayName =
            metadata.display_name ||
            "New User";

        const {
            data: createdProfile,
            error: createError
        } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id:
                        currentUser.id,

                    username,

                    display_name:
                        displayName

                })
                .select()
                .single();

        if (createError) {

            console.error(
                "Create profile error:",
                createError
            );

            return;
        }

        currentProfile =
            createdProfile;
    }

    updateProfileUI();
}


/* =====================================================
   PROFILE UI
===================================================== */

function updateProfileUI() {

    if (!currentProfile) {
        return;
    }

    const name =
        currentProfile.display_name ||
        "User";

    const username =
        currentProfile.username ||
        "user";

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileUsername =
        document.getElementById(
            "profileUsername"
        );

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    if (profileName) {
        profileName.textContent = name;
    }

    if (profileUsername) {
        profileUsername.textContent =
            `@${username}`;
    }

    if (profileAvatar) {

        profileAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }
}


/* =====================================================
   SHOW APP
===================================================== */

function showMainApp() {

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (mainApp) {
        mainApp.classList.remove("hidden");
    }

    document.body.style.overflow = "";

    updateProfileUI();

    showScreen("homeScreen");

    loadInstants();

}


/* =====================================================
   SHOW AUTH
===================================================== */

function showAuth() {

    stopCamera();

    if (captureModal) {
        captureModal.classList.remove("show");
    }

    if (previewModal) {
        previewModal.classList.remove("show");
    }

    if (mainApp) {
        mainApp.classList.add("hidden");
    }

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }

    document.body.style.overflow = "";

    setAuthMode("login");

}


/* =====================================================
   LOGOUT
===================================================== */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth
                    .signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

            currentUser = null;
            currentProfile = null;

            instants = [];
            currentIndex = 0;

            showAuth();

        }
    );

}


/* =====================================================
   AUTH SESSION
===================================================== */

async function initializeAuth() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();

        if (error) {
            throw error;
        }

        const session =
            data.session;

        if (session?.user) {

            currentUser =
                session.user;

            await loadCurrentProfile();

            showMainApp();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        showAuth();

    }

}


/* =====================================================
   AUTH STATE
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (event === "SIGNED_OUT") {

            currentUser = null;
            currentProfile = null;

            instants = [];
            currentIndex = 0;

            showAuth();

            return;
        }

        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {

            currentUser =
                session.user;

            await loadCurrentProfile();

            showMainApp();

        }

    }
);


/* =====================================================
   SCREEN NAVIGATION
===================================================== */

const screens =
    document.querySelectorAll(
        ".screen"
    );

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


function showScreen(screenId) {

    screens.forEach(screen => {

        screen.classList.remove(
            "active"
        );

    });

    const target =
        document.getElementById(
            screenId
        );

    if (target) {

        target.classList.add(
            "active"
        );

    }

    navItems.forEach(item => {

        item.classList.remove(
            "active"
        );

        if (
            item.dataset.screen ===
            screenId
        ) {

            item.classList.add(
                "active"
            );

        }

    });

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

}


navItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            const screen =
                item.dataset.screen;

            if (screen) {
                showScreen(screen);
            }

        }
    );

});


/* =====================================================
   BACK BUTTONS
===================================================== */

document
    .querySelectorAll(".back-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showScreen(
                    button.dataset.back
                );

            }
        );

    });


/* =====================================================
   CAMERA ELEMENTS
===================================================== */

const captureButton =
    document.getElementById(
        "captureButton"
    );

const navCamera =
    document.getElementById(
        "navCamera"
    );

const captureModal =
    document.getElementById(
        "captureModal"
    );

const closeCapture =
    document.getElementById(
        "closeCapture"
    );

const cancelCamera =
    document.getElementById(
        "cancelCamera"
    );

const switchCamera =
    document.getElementById(
        "switchCamera"
    );

const retryCamera =
    document.getElementById(
        "retryCamera"
    );

const cameraVideo =
    document.getElementById(
        "cameraVideo"
    );

const cameraCanvas =
    document.getElementById(
        "cameraCanvas"
    );

const realCaptureButton =
    document.getElementById(
        "realCaptureButton"
    );

const cameraError =
    document.getElementById(
        "cameraError"
    );

const cameraErrorText =
    document.getElementById(
        "cameraErrorText"
    );


/* =====================================================
   CAMERA STATE
===================================================== */

let cameraStream = null;
let cameraFacingMode = "user";
let cameraOpening = false;


/* =====================================================
   OPEN CAMERA
===================================================== */

async function openCamera() {

    if (!currentUser) {

        showAuth();

        return;
    }

    if (cameraOpening) {
        return;
    }

    cameraOpening = true;

    captureModal.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    cameraError.classList.remove(
        "show"
    );

    try {

        await startCamera();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        showCameraError(error);

    } finally {

        cameraOpening = false;

    }

}


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    stopCamera();

    cameraError.classList.remove(
        "show"
    );

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        throw new Error(
            "Camera API is not supported in this browser."
        );

    }

    const constraints = {

        audio: false,

        video: {

            facingMode: {
                ideal: cameraFacingMode
            },

            width: {
                ideal: 1920
            },

            height: {
                ideal: 1080
            }

        }

    };

    cameraStream =
        await navigator.mediaDevices
            .getUserMedia(
                constraints
            );

    cameraVideo.srcObject =
        cameraStream;

    await cameraVideo.play();

}


/* =====================================================
   STOP CAMERA
===================================================== */

function stopCamera() {

    if (!cameraStream) {
        return;
    }

    cameraStream
        .getTracks()
        .forEach(track => {
            track.stop();
        });

    cameraStream = null;

    if (cameraVideo) {
        cameraVideo.srcObject = null;
    }

}


/* =====================================================
   CLOSE CAMERA
===================================================== */

function closeCamera() {

    stopCamera();

    captureModal.classList.remove(
        "show"
    );

    document.body.style.overflow = "";

}


if (closeCapture) {
    closeCapture.addEventListener(
        "click",
        closeCamera
    );
}

if (cancelCamera) {
    cancelCamera.addEventListener(
        "click",
        closeCamera
    );
}


/* =====================================================
   CAMERA BUTTONS
===================================================== */

if (captureButton) {

    captureButton.addEventListener(
        "click",
        openCamera
    );

}

if (navCamera) {

    navCamera.addEventListener(
        "click",
        openCamera
    );

}


/* =====================================================
   SWITCH CAMERA
===================================================== */

if (switchCamera) {

    switchCamera.addEventListener(
        "click",
        async () => {

            if (cameraOpening) {
                return;
            }

            cameraFacingMode =
                cameraFacingMode === "user"
                    ? "environment"
                    : "user";

            try {

                await startCamera();

            } catch (error) {

                console.error(error);

                cameraFacingMode =
                    cameraFacingMode === "user"
                        ? "environment"
                        : "user";

                try {

                    await startCamera();

                } catch (secondError) {

                    showCameraError(
                        secondError
                    );

                }

            }

        }
    );

}


/* =====================================================
   CAMERA ERROR
===================================================== */

function showCameraError(error) {

    cameraError.classList.add(
        "show"
    );

    if (
        error?.name ===
        "NotAllowedError"
    ) {

        cameraErrorText.textContent =
            "Camera permission was denied. Allow camera access in your browser settings, then try again.";

        return;
    }

    if (
        error?.name ===
        "NotFoundError"
    ) {

        cameraErrorText.textContent =
            "No camera was found on this device.";

        return;
    }

    if (
        error?.name ===
        "NotReadableError"
    ) {

        cameraErrorText.textContent =
            "The camera is being used by another application.";

        return;
    }

    cameraErrorText.textContent =
        error?.message ||
        "Please allow camera access to take an Instant.";

}


if (retryCamera) {

    retryCamera.addEventListener(
        "click",
        async () => {

            try {

                await startCamera();

            } catch (error) {

                showCameraError(
                    error
                );

            }

        }
    );

}


/* =====================================================
   PREVIEW
===================================================== */

const previewModal =
    document.getElementById(
        "previewModal"
    );

const capturedImage =
    document.getElementById(
        "capturedImage"
    );

const postInstantButton =
    document.getElementById(
        "postInstantButton"
    );

const discardButton =
    document.getElementById(
        "discardButton"
    );


/* =====================================================
   CAPTURE PHOTO
===================================================== */

if (realCaptureButton) {

    realCaptureButton.addEventListener(
        "click",
        capturePhoto
    );

}


function capturePhoto() {

    if (
        !cameraStream ||
        !cameraVideo.videoWidth
    ) {

        return;
    }

    const width =
        cameraVideo.videoWidth;

    const height =
        cameraVideo.videoHeight;

    cameraCanvas.width =
        width;

    cameraCanvas.height =
        height;

    const context =
        cameraCanvas.getContext("2d");

    if (
        cameraFacingMode === "user"
    ) {

        context.save();

        context.translate(
            width,
            0
        );

        context.scale(
            -1,
            1
        );

        context.drawImage(
            cameraVideo,
            0,
            0,
            width,
            height
        );

        context.restore();

    } else {

        context.drawImage(
            cameraVideo,
            0,
            0,
            width,
            height
        );

    }

    const imageData =
        cameraCanvas.toDataURL(
            "image/jpeg",
            .92
        );

    capturedImage.src =
        imageData;

    capturedImage.dataset.image =
        imageData;

    stopCamera();

    captureModal.classList.remove(
        "show"
    );

    previewModal.classList.add(
        "show"
    );

}


/* =====================================================
   DISCARD
===================================================== */

if (discardButton) {

    discardButton.addEventListener(
        "click",
        discardPhoto
    );

}


function discardPhoto() {

    capturedImage.src = "";
    capturedImage.dataset.image = "";

    previewModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

}


/* =====================================================
   POST INSTANT
===================================================== */

if (postInstantButton) {

    postInstantButton.addEventListener(
        "click",
        postInstant
    );

}


async function postInstant() {

    if (!currentUser) {

        showAuth();

        return;
    }

    const imageData =
        capturedImage.dataset.image;

    if (!imageData) {
        return;
    }

    postInstantButton.disabled =
        true;

    postInstantButton.textContent =
        "Posting...";

    try {

        const response =
            await fetch(imageData);

        const blob =
            await response.blob();

        const fileName =
            `${crypto.randomUUID()}.jpg`;

        const filePath =
            `${currentUser.id}/${fileName}`;

        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("instants")
                .upload(
                    filePath,
                    blob,
                    {
                        contentType:
                            "image/jpeg",

                        upsert:
                            false
                    }
                );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: insertedInstant,
            error: insertError
        } =
            await supabaseClient
                .from("instants")
                .insert({

                    user_id:
                        currentUser.id,

                    image_url:
                        filePath,

                    caption:
                        "",

                    expires_at:
                        new Date(
                            Date.now() +
                            24 * 60 * 60 * 1000
                        ).toISOString(),

                    is_active:
                        true

                })
                .select()
                .single();

        if (insertError) {

            await supabaseClient
                .storage
                .from("instants")
                .remove([
                    filePath
                ]);

            throw insertError;
        }


        capturedImage.src = "";
        capturedImage.dataset.image = "";

        previewModal.classList.remove(
            "show"
        );

        document.body.style.overflow = "";


        /*
         * Reload feed + My Instants.
         */

        await loadInstants();


        /*
         * Make sure My Instants updates.
         */

        await renderMyInstantsIfAvailable();

        await updateMyInstantCount();


        /*
         * Open profile.
         */

        showScreen(
            "profileScreen"
        );


    } catch (error) {

        console.error(
            "Post Instant error:",
            error
        );

        alert(
            error?.message ||
            "Failed to post Instant. Please try again."
        );

    } finally {

        postInstantButton.disabled =
            false;

        postInstantButton.textContent =
            "Post Instant";

    }

}


/* =====================================================
   REAL INSTANTS
===================================================== */

let instants = [];

let currentIndex = 0;


/* =====================================================
   LOAD INSTANTS
===================================================== */

async function loadInstants() {

    if (!currentUser) {

        instants = [];

        currentIndex = 0;

        renderInstantCards();

        updateHomeInstantCount();

        updateMyInstantCount();

        renderMyInstantsIfAvailable();

        return;
    }


    try {

        /*
         * =================================================
         * GET ACTIVE INSTANTS
         * =================================================
         */

        const {
            data: instantRows,
            error: instantError
        } =
            await supabaseClient
                .from("instants")
                .select(`
                    id,
                    user_id,
                    image_url,
                    caption,
                    created_at,
                    expires_at,
                    is_active
                `)
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (instantError) {
            throw instantError;
        }


        const now =
            new Date();


        /*
         * =================================================
         * REMOVE EXPIRED CLIENT-SIDE
         * =================================================
         */

        const validInstants =
            (instantRows || []).filter(
                instant => {

                    if (!instant.expires_at) {
                        return true;
                    }

                    return (
                        new Date(
                            instant.expires_at
                        ) > now
                    );

                }
            );


        /*
         * =================================================
         * GET CURRENT USER'S VIEW HISTORY
         * =================================================
         */

        const {
            data: viewedRows,
            error: viewedError
        } =
            await supabaseClient
                .from("instant_views")
                .select(
                    "instant_id"
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (viewedError) {
            throw viewedError;
        }


        const viewedInstantIds =
            new Set(
                (viewedRows || []).map(
                    row =>
                        row.instant_id
                )
            );


        /*
         * =================================================
         * FEED FILTER
         *
         * Own Instants:
         * NEVER appear in feed.
         *
         * Already viewed:
         * NEVER appear again.
         * =================================================
         */

        const feedInstants =
            validInstants.filter(
                instant => {

                    if (
                        instant.user_id ===
                        currentUser.id
                    ) {

                        return false;

                    }


                    if (
                        viewedInstantIds.has(
                            instant.id
                        )
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        /*
         * =================================================
         * PROFILE IDS
         * =================================================
         */

        const userIds =
            [
                ...new Set(
                    feedInstants.map(
                        instant =>
                            instant.user_id
                    )
                )
            ];


        let profiles = [];


        if (userIds.length) {

            const {
                data: profileData,
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select(
                        "id, username, display_name"
                    )
                    .in(
                        "id",
                        userIds
                    );


            if (profileError) {
                throw profileError;
            }


            profiles =
                profileData || [];

        }


        const profileMap =
            new Map(
                profiles.map(
                    profile => [
                        profile.id,
                        profile
                    ]
                )
            );


        /*
         * =================================================
         * PROCESS INSTANTS
         * =================================================
         */

        const processed = [];


        for (
            const instant of feedInstants
        ) {

            const profile =
                profileMap.get(
                    instant.user_id
                );


            const usableProfile =
                profile || {

                    username:
                        "user",

                    display_name:
                        "User"

                };


            const {
                data: signedData,
                error: signedError
            } =
                await supabaseClient
                    .storage
                    .from("instants")
                    .createSignedUrl(
                        instant.image_url,
                        60 * 60
                    );


            if (signedError) {

                console.error(
                    "Signed URL error:",
                    signedError
                );

                continue;

            }


            const displayName =
                usableProfile.display_name ||
                "User";


            const username =
                usableProfile.username ||
                "user";


            processed.push({

                id:
                    instant.id,

                userId:
                    instant.user_id,

                name:
                    displayName,

                username:
                    `@${username}`,

                avatar:
                    displayName
                        .charAt(0)
                        .toUpperCase(),

                time:
                    formatInstantTime(
                        instant.created_at
                    ),

                caption:
                    instant.caption || "",

                image:
                    signedData?.signedUrl || "",

                likes:
                    0,

                seen:
                    0,

                mine:
                    false,

                createdAt:
                    instant.created_at

            });

        }


        /*
         * =================================================
         * NEWEST FIRST
         * =================================================
         */

        processed.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );


        instants =
            processed;

        currentIndex = 0;


        /*
         * =================================================
         * RENDER EVERYTHING
         * =================================================
         */

        renderInstantCards();

        updateHomeInstantCount();

        updateMyInstantCount();

        await renderMyInstantsIfAvailable();


    } catch (error) {

        console.error(
            "Load Instants error:",
            error
        );


        renderInstantCards();

        updateHomeInstantCount();

        updateMyInstantCount();

        renderMyInstantsIfAvailable();

    }

}


/* =====================================================
   FORMAT TIME
===================================================== */

function formatInstantTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    const seconds =
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) / 1000
        );

    if (seconds < 60) {
        return "just now";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    return `${days}d ago`;

}


/* =====================================================
   MY INSTANT COUNT
===================================================== */

async function updateMyInstantCount() {

    const element =
        document.getElementById(
            "myInstantCount"
        );

    if (!element || !currentUser) {
        return;
    }

    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from("instants")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "is_active",
                    true
                );


        if (error) {
            throw error;
        }


        element.textContent =
            count || 0;


    } catch (error) {

        console.error(
            "My Instant count error:",
            error
        );

    }

}


/* =====================================================
   MY INSTANTS
   DIRECT DATABASE LOAD
===================================================== */

async function renderMyInstantsIfAvailable() {

    const container =
        document.getElementById(
            "myInstants"
        ) ||
        document.getElementById(
            "myInstantArea"
        ) ||
        document.getElementById(
            "myInstantsGrid"
        );


    if (!container || !currentUser) {
        return;
    }


    try {

        /*
         * IMPORTANT:
         *
         * My Instants are loaded separately.
         *
         * They are NOT taken from "instants",
         * because "instants" is now the feed only.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("instants")
                .select(`
                    id,
                    user_id,
                    image_url,
                    caption,
                    created_at,
                    expires_at,
                    is_active
                `)
                .eq(
                    "user_id",
                    currentUser.id
                )
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const now =
            new Date();


        const mine =
            (data || []).filter(
                instant => {

                    if (!instant.expires_at) {
                        return true;
                    }

                    return (
                        new Date(
                            instant.expires_at
                        ) > now
                    );

                }
            );


        if (!mine.length) {

            container.innerHTML = `

                <div class="my-instants-empty">

                    <div>
                        ✦
                    </div>

                    <strong>
                        No Instants yet
                    </strong>

                    <span>
                        Your posted Instants will appear here.
                    </span>

                </div>

            `;

            return;

        }


        const processedMine = [];


        for (
            const instant of mine
        ) {

            const {
                data: signedData,
                error: signedError
            } =
                await supabaseClient
                    .storage
                    .from("instants")
                    .createSignedUrl(
                        instant.image_url,
                        60 * 60
                    );


            if (signedError) {

                console.error(
                    "My Instant signed URL error:",
                    signedError
                );

                continue;

            }


            processedMine.push({

                ...instant,

                image:
                    signedData?.signedUrl ||
                    "",

                time:
                    formatInstantTime(
                        instant.created_at
                    )

            });

        }


        container.innerHTML =
            processedMine
                .map(
                    instant => {

                        return `

                            <article
                                class="my-instant-item"
                                data-instant-id="${escapeHTML(
                                    instant.id
                                )}"
                            >

                                <div
                                    class="my-instant-image"
                                    style="
                                        background-image:
                                        url('${escapeAttribute(
                                            instant.image
                                        )}');
                                    "
                                ></div>

                                <div
                                    class="my-instant-meta"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            currentProfile?.display_name ||
                                            "You"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            instant.time
                                        )}
                                    </span>

                                </div>

                            </article>

                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "My Instants error:",
            error
        );


        container.innerHTML = `

            <div class="my-instants-empty">
                Couldn't load your Instants.
            </div>

        `;

    }

}


/* =====================================================
   SAFE HTML
===================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );

}


/* =====================================================
   CARD AREA
===================================================== */

const cardArea =
    document.getElementById(
        "cardArea"
    );


/* =====================================================
   RENDER CARDS
===================================================== */

function renderInstantCards() {

    if (!cardArea) {
        return;
    }


    cardArea.innerHTML = "";


    /*
     * IMPORTANT:
     *
     * No "View again".
     *
     * Once currentIndex reaches the end,
     * the feed stays finished.
     */

    if (
        !instants.length ||
        currentIndex >= instants.length
    ) {

        showFinishedState();

        updateProgress();

        return;

    }


    const cardsToRender =
        instants.slice(
            currentIndex,
            Math.min(
                currentIndex + 3,
                instants.length
            )
        );


    cardsToRender.forEach(
        (instant, relativeIndex) => {

            const actualIndex =
                currentIndex +
                relativeIndex;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "instant-card";


            card.dataset.index =
                actualIndex;


            card.style.zIndex =
                String(
                    100 -
                    relativeIndex
                );


            if (
                relativeIndex === 1
            ) {

                card.style.transform =
                    "scale(.97) translateY(8px)";

                card.style.opacity =
                    "0.92";

            } else if (
                relativeIndex === 2
            ) {

                card.style.transform =
                    "scale(.94) translateY(16px)";

                card.style.opacity =
                    "0.75";

            }


            const safeName =
                escapeHTML(
                    instant.name
                );


            const safeUsername =
                escapeHTML(
                    instant.username
                );


            const safeCaption =
                escapeHTML(
                    instant.caption
                );


            const safeAvatar =
                escapeHTML(
                    instant.avatar
                );


            let photoHTML = "";


            if (instant.image) {

                photoHTML = `

                    <div
                        class="instant-photo"
                        style="
                            background-image:
                            url('${escapeAttribute(
                                instant.image
                            )}');
                        "
                    >

                        <div
                            class="instant-gradient"
                        ></div>

                        <div
                            class="instant-info"
                        >

                            <div
                                class="instant-user"
                            >

                                <div
                                    class="avatar"
                                >
                                    ${safeAvatar}
                                </div>

                                <div
                                    class="instant-user-text"
                                >

                                    <strong>
                                        ${safeName}
                                    </strong>

                                    <span>
                                        ${safeUsername}
                                        ·
                                        ${escapeHTML(
                                            instant.time
                                        )}
                                    </span>

                                </div>

                            </div>

                            ${
                                safeCaption
                                    ? `
                                        <p
                                            class="instant-caption"
                                        >
                                            ${safeCaption}
                                        </p>
                                    `
                                    : ""
                            }

                            <div
                                class="instant-actions"
                            >

                                <button
                                    class="like-button"
                                    data-index="${actualIndex}"
                                    type="button"
                                >

                                    <span>
                                        ♡
                                    </span>

                                    <strong>
                                        ${instant.likes}
                                    </strong>

                                </button>

                                <span
                                    class="seen-text"
                                >
                                    👀
                                    ${instant.seen}
                                    seen
                                </span>

                            </div>

                        </div>

                    </div>

                `;

            }


            card.innerHTML =
                photoHTML;


            cardArea.appendChild(
                card
            );

        }
    );


    setupCardInteractions();

    updateProgress();

}


/* =====================================================
   CARD INTERACTIONS
===================================================== */

function setupCardInteractions() {

    const cards =
        document.querySelectorAll(
            ".instant-card"
        );


    cards.forEach(card => {

        const cardIndex =
            Number(
                card.dataset.index
            );


        const isTopCard =
            cardIndex ===
            currentIndex;


        if (!isTopCard) {

            card.style.pointerEvents =
                "none";

            return;

        }


        card.style.touchAction =
            "pan-y";


        let startX = 0;
        let startY = 0;
        let currentX = 0;

        let dragging = false;
        let horizontalSwipe = false;


        card.addEventListener(
            "pointerdown",
            event => {

                if (
                    event.target.closest(
                        "button"
                    )
                ) {

                    return;

                }


                startX =
                    event.clientX;

                startY =
                    event.clientY;

                currentX = 0;

                dragging = true;

                horizontalSwipe =
                    false;

            }
        );


        card.addEventListener(
            "pointermove",
            event => {

                if (!dragging) {
                    return;
                }


                const deltaX =
                    event.clientX -
                    startX;


                const deltaY =
                    event.clientY -
                    startY;


                /*
                 * Vertical movement:
                 * allow normal page scrolling.
                 */

                if (
                    !horizontalSwipe &&
                    Math.abs(deltaY) >
                    Math.abs(deltaX) &&
                    Math.abs(deltaY) > 8
                ) {

                    dragging = false;

                    return;

                }


                /*
                 * Start horizontal swipe.
                 */

                if (
                    !horizontalSwipe &&
                    Math.abs(deltaX) > 10 &&
                    Math.abs(deltaX) >
                    Math.abs(deltaY)
                ) {

                    horizontalSwipe = true;


                    try {

                        card.setPointerCapture(
                            event.pointerId
                        );

                    } catch (error) {
                        // Ignore.
                    }

                }


                if (!horizontalSwipe) {
                    return;
                }


                /*
                 * Only allow swipe to the right.
                 */

                currentX =
                    Math.max(
                        0,
                        deltaX
                    );


                const rotation =
                    Math.min(
                        currentX / 12,
                        12
                    );


                card.style.transition =
                    "none";


                card.style.transform =
                    `
                    translateX(${currentX}px)
                    rotate(${rotation}deg)
                    `;

            }
        );


        card.addEventListener(
            "pointerup",
            event => {

                if (!dragging) {
                    return;
                }


                dragging = false;


                if (!horizontalSwipe) {

                    currentX = 0;

                    return;

                }


                try {

                    card.releasePointerCapture(
                        event.pointerId
                    );

                } catch (error) {
                    // Ignore.
                }


                card.style.transition =
                    "";


                if (currentX > 120) {

                    swipeCard(card);

                } else {

                    card.classList.add(
                        "return-card"
                    );


                    setTimeout(
                        () => {

                            card.classList.remove(
                                "return-card"
                            );

                            card.style.transform =
                                "";

                        },
                        350
                    );

                }


                currentX = 0;

            }
        );


        card.addEventListener(
            "pointercancel",
            () => {

                dragging = false;

                horizontalSwipe =
                    false;

                currentX = 0;

                card.style.transform =
                    "";

            }
        );

    });


    /*
     * LIKE BUTTON
     */

    document
        .querySelectorAll(
            ".like-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const index =
                        Number(
                            button.dataset.index
                        );


                    if (
                        !instants[index]
                    ) {

                        return;

                    }


                    if (
                        button.classList.contains(
                            "liked"
                        )
                    ) {

                        return;

                    }


                    instants[index].likes++;


                    button.classList.add(
                        "liked"
                    );


                    const icon =
                        button.querySelector(
                            "span"
                        );


                    const count =
                        button.querySelector(
                            "strong"
                        );


                    if (icon) {
                        icon.textContent =
                            "♥";
                    }


                    if (count) {

                        count.textContent =
                            instants[index].likes;

                    }

                }
            );

        });

}


/* =====================================================
   SWIPE CARD
===================================================== */

async function swipeCard(card) {

    const instant =
        instants[currentIndex];


    /*
     * IMPORTANT:
     *
     * Record the view BEFORE removing the card.
     *
     * The database becomes the source of truth.
     */

    if (
        instant &&
        currentUser &&
        instant.id
    ) {

        await markInstantAsViewed(
            instant.id
        );

    }


    card.style.transition =
        "transform .35s ease, opacity .35s ease";


    card.style.transform =
        "translateX(120%) rotate(12deg)";


    card.style.opacity =
        "0";


    setTimeout(
        () => {

            currentIndex++;


            if (
                currentIndex >=
                instants.length
            ) {

                currentIndex =
                    instants.length;

                showFinishedState();

                updateProgress();

                /*
                 * Refresh My Instants only.
                 * Feed is already finished.
                 */

                renderMyInstantsIfAvailable();

                return;

            }


            renderInstantCards();

        },
        350
    );

}


/* =====================================================
   MARK INSTANT AS VIEWED
===================================================== */

async function markInstantAsViewed(
    instantId
) {

    if (
        !currentUser ||
        !instantId
    ) {

        return false;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("instant_views")
                .insert({

                    instant_id:
                        instantId,

                    user_id:
                        currentUser.id

                });


        /*
         * 23505 = duplicate key.
         *
         * That means the user already viewed it.
         * This is NOT an actual error for our logic.
         */

        if (
            error &&
            error.code !== "23505"
        ) {

            console.error(
                "Mark Instant viewed error:",
                error
            );

            return false;

        }


        return true;


    } catch (error) {

        console.error(
            "Mark Instant viewed error:",
            error
        );

        return false;

    }

}


/* =====================================================
   PROGRESS
===================================================== */

const currentInstant =
    document.getElementById(
        "currentInstant"
    );

const totalInstants =
    document.getElementById(
        "totalInstants"
    );


function updateProgress() {

    const total =
        instants.length;


    if (totalInstants) {

        totalInstants.textContent =
            total;

    }


    if (!total) {

        if (currentInstant) {

            currentInstant.textContent =
                "0";

        }

        return;

    }


    const number =
        Math.min(
            currentIndex + 1,
            total
        );


    if (currentInstant) {

        currentInstant.textContent =
            number;

    }

}


/* =====================================================
   FINISHED
===================================================== */

function showFinishedState() {

    if (!cardArea) {
        return;
    }


    cardArea.innerHTML = `

        <div
            style="
                text-align:center;
                color:#777;
                padding:30px;
            "
        >

            <div
                style="
                    font-size:45px;
                    margin-bottom:18px;
                "
            >
                ✦
            </div>

            <h2
                style="
                    color:white;
                    margin-bottom:8px;
                "
            >
                You're all caught up
            </h2>

            <p
                style="
                    font-size:11px;
                    line-height:1.6;
                "
            >
                No more Instants from your friends.
            </p>

        </div>

    `;

}


/* =====================================================
   OPEN INSTANTS
===================================================== */

const openInstants =
    document.getElementById(
        "openInstants"
    );

const instantCount =
    document.getElementById(
        "instantCount"
    );


if (openInstants) {

    openInstants.addEventListener(
        "click",
        async () => {

            /*
             * Reload from database.
             *
             * This automatically excludes
             * everything already viewed.
             */

            await loadInstants();

            showScreen(
                "instantsScreen"
            );

        }
    );

}


if (instantCount) {

    instantCount.addEventListener(
        "click",
        async () => {

            await loadInstants();

            showScreen(
                "instantsScreen"
            );

        }
    );

}


/* =====================================================
   HOME COUNT
===================================================== */

const instantCountTitle =
    document.getElementById(
        "instantCountTitle"
    );


function updateHomeInstantCount() {

    if (!instantCountTitle) {
        return;
    }


    const count =
        instants.length;


    instantCountTitle.textContent =
        `${count} new Instant${count === 1 ? "" : "s"}`;

}


/* =====================================================
   REQUESTS
===================================================== */

const requestsButton =
    document.getElementById(
        "requestsButton"
    );


if (requestsButton) {

    requestsButton.addEventListener(
        "click",
        () => {

            showScreen(
                "requestsScreen"
            );

        }
    );

}


/* =====================================================
   FRIEND SEARCH
===================================================== */

const friendSearch =
    document.getElementById(
        "friendSearch"
    );


if (friendSearch) {

    friendSearch.addEventListener(
        "input",
        () => {

            const query =
                friendSearch.value
                    .toLowerCase()
                    .trim();


            const people =
                document.querySelectorAll(
                    ".person-row"
                );


            people.forEach(person => {

                const text =
                    person.textContent
                        .toLowerCase();


                person.style.display =
                    text.includes(query)
                        ? "flex"
                        : "none";

            });

        }
    );

}


/* =====================================================
   FRIEND TABS
===================================================== */

document
    .querySelectorAll(
        ".friend-tab"
    )
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".friend-tab"
                    )
                    .forEach(item =>
                        item.classList
                            .remove(
                                "active"
                            )
                    );


                tab.classList.add(
                    "active"
                );


                if (
                    tab.dataset.tab ===
                    "requests"
                ) {

                    showScreen(
                        "requestsScreen"
                    );

                }

            }
        );

    });


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        if (
            previewModal &&
            previewModal.classList.contains(
                "show"
            )
        ) {

            discardPhoto();

            return;

        }


        if (
            captureModal &&
            captureModal.classList.contains(
                "show"
            )
        ) {

            closeCamera();

        }

    }
);


/* =====================================================
   PAGE VISIBILITY
===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopCamera();

        }

    }
);


/* =====================================================
   REFRESH INSTANTS WHEN RETURNING
===================================================== */

window.addEventListener(
    "focus",
    () => {

        if (!currentUser) {
            return;
        }


        if (
            captureModal &&
            captureModal.classList.contains(
                "show"
            )
        ) {

            return;

        }


        loadInstants();

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

setAuthMode("login");

initializeAuth();
