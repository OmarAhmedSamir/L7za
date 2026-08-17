/* =====================================================
   L7ZA — PHASE 3
   AUTH + PHASE 2 CAMERA
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
    document.getElementById(
        "authScreen"
    );

const mainApp =
    document.getElementById(
        "mainApp"
    );

const authTitle =
    document.getElementById(
        "authTitle"
    );

const authSubtitle =
    document.getElementById(
        "authSubtitle"
    );

const authSubmit =
    document.getElementById(
        "authSubmit"
    );

const authSwitch =
    document.getElementById(
        "authSwitch"
    );

const authMessage =
    document.getElementById(
        "authMessage"
    );

const authEmail =
    document.getElementById(
        "authEmail"
    );

const authPassword =
    document.getElementById(
        "authPassword"
    );

const authDisplayName =
    document.getElementById(
        "authDisplayName"
    );

const authUsername =
    document.getElementById(
        "authUsername"
    );

const signupFields =
    document.querySelectorAll(
        ".signup-only"
    );


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


        signupFields.forEach(
            field => {

                field.style.display =
                    "block";

            }
        );


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


        signupFields.forEach(
            field => {

                field.style.display =
                    "none";

            }
        );


        authPassword.autocomplete =
            "current-password";

    }

}


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


/* =====================================================
   AUTH MESSAGE
===================================================== */

function showAuthMessage(
    message,
    type = ""
) {

    authMessage.textContent =
        message;

    authMessage.className =
        "auth-message";


    if (type) {

        authMessage.classList.add(
            type
        );

    }

}


function clearAuthMessage() {

    authMessage.textContent =
        "";

    authMessage.className =
        "auth-message";

}


/* =====================================================
   AUTH VALIDATION
===================================================== */

function validateUsername(
    username
) {

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


    if (
        !validateUsername(
            username
        )
    ) {

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


    if (
        password.length < 6
    ) {

        showAuthMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;

    }


    setAuthLoading(true);


    try {

        /*
            Check username first.
        */

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


        /*
            Create Auth account.
        */

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signUp({

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


        /*
            If email confirmation is enabled,
            session may be null.
        */

        if (!data.session) {

            showAuthMessage(
                "Account created. Check your email to confirm your account.",
                "success"
            );


            authPassword.value =
                "";


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

authSubmit.addEventListener(
    "click",
    async () => {

        if (
            authMode === "signup"
        ) {

            await signUp();

        } else {

            await signIn();

        }

    }
);


/* =====================================================
   ENTER KEY
===================================================== */

[
    authEmail,
    authPassword,
    authDisplayName,
    authUsername
].forEach(
    input => {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    authSubmit.click();

                }

            }
        );

    }
);


/* =====================================================
   AUTH LOADING
===================================================== */

function setAuthLoading(
    loading
) {

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
   AUTH ERROR MESSAGE
===================================================== */

function getAuthErrorMessage(
    error
) {

    const message =
        error?.message ||
        "";


    if (
        message
            .toLowerCase()
            .includes(
                "invalid login credentials"
            )
    ) {

        return "Incorrect email or password.";

    }


    if (
        message
            .toLowerCase()
            .includes(
                "email not confirmed"
            )
    ) {

        return "Please confirm your email before signing in.";

    }


    if (
        message
            .toLowerCase()
            .includes(
                "user already registered"
            )
    ) {

        return "An account with this email already exists.";

    }


    if (
        message
            .toLowerCase()
            .includes(
                "password should be at least"
            )
    ) {

        return "Your password is too short.";

    }


    return message ||
        "Something went wrong. Please try again.";

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


    /*
        In the unlikely event the trigger
        didn't create the profile yet,
        create it manually.
    */

    if (!currentProfile) {

        const metadata =
            currentUser.user_metadata ||
            {};


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

        profileName.textContent =
            name;

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

    authScreen.classList.add(
        "hidden"
    );

    mainApp.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "";


    updateProfileUI();


    showScreen(
        "homeScreen"
    );


    /*
     * Load real Instants from Supabase.
     */

    loadInstants();

}


/* =====================================================
   SHOW AUTH
===================================================== */

function showAuth() {

    stopCamera();


    captureModal.classList.remove(
        "show"
    );

    previewModal.classList.remove(
        "show"
    );


    mainApp.classList.add(
        "hidden"
    );

    authScreen.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "";


    setAuthMode(
        "login"
    );

}


/* =====================================================
   LOGOUT
===================================================== */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


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


        showAuth();

    }
);


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
   AUTH STATE CHANGES
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (
            event === "SIGNED_OUT"
        ) {

            currentUser = null;

            currentProfile = null;

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

    screens.forEach(
        screen => {

            screen.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            screenId
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    navItems.forEach(
        item => {

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

        }
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                const screen =
                    item.dataset.screen;


                if (screen) {

                    showScreen(
                        screen
                    );

                }

            }
        );

    }
);


/* =====================================================
   BACK BUTTONS
===================================================== */

document
    .querySelectorAll(
        ".back-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showScreen(
                        button.dataset.back
                    );

                }
            );

        }
    );


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

    /*
        Safety:
        camera can only open while authenticated.
    */

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

        showCameraError(
            error
        );

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

                ideal:
                    cameraFacingMode

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
        .forEach(
            track => {

                track.stop();

            }
        );


    cameraStream = null;

    cameraVideo.srcObject =
        null;

}


/* =====================================================
   CLOSE CAMERA
===================================================== */

function closeCamera() {

    stopCamera();


    captureModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


closeCapture.addEventListener(
    "click",
    closeCamera
);


cancelCamera.addEventListener(
    "click",
    closeCamera
);


/* =====================================================
   OPEN CAMERA BUTTONS
===================================================== */

captureButton.addEventListener(
    "click",
    openCamera
);


navCamera.addEventListener(
    "click",
    openCamera
);


/* =====================================================
   SWITCH CAMERA
===================================================== */

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

            console.error(
                error
            );


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


/* =====================================================
   CAMERA ERROR
===================================================== */

function showCameraError(
    error
) {

    cameraError.classList.add(
        "show"
    );


    if (
        error &&
        error.name ===
        "NotAllowedError"
    ) {

        cameraErrorText.textContent =
            "Camera permission was denied. Allow camera access in your browser settings, then try again.";

        return;

    }


    if (
        error &&
        error.name ===
        "NotFoundError"
    ) {

        cameraErrorText.textContent =
            "No camera was found on this device.";

        return;

    }


    if (
        error &&
        error.name ===
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


/* =====================================================
   PREVIEW ELEMENTS
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

realCaptureButton.addEventListener(
    "click",
    capturePhoto
);


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
        cameraCanvas.getContext(
            "2d"
        );


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

discardButton.addEventListener(
    "click",
    discardPhoto
);


function discardPhoto() {

    capturedImage.src =
        "";

    capturedImage.dataset.image =
        "";


    previewModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}

/* =====================================================
   POST INSTANT
===================================================== */

postInstantButton.addEventListener(
    "click",
    postInstant
);


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

        /*
         * Convert Base64 → Blob
         */

        const response =
            await fetch(
                imageData
            );


        const blob =
            await response.blob();


        /*
         * Unique storage path
         */

        const fileName =
            `${crypto.randomUUID()}.jpg`;


        const filePath =
            `${currentUser.id}/${fileName}`;


        /*
         * Upload to PRIVATE bucket
         */

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


        /*
         * Create database row
         */

        const {
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

                    /*
                     * 24 hours
                     */

                    expires_at:
                        new Date(
                            Date.now() +
                            24 * 60 * 60 * 1000
                        ).toISOString(),

                    is_active:
                        true

                });


        if (insertError) {

            /*
             * If DB insert fails,
             * remove uploaded image.
             */

            await supabaseClient
                .storage
                .from("instants")
                .remove([
                    filePath
                ]);


            throw insertError;

        }


        /*
         * Close preview
         */

        capturedImage.src =
            "";

        capturedImage.dataset.image =
            "";

        previewModal.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";


        /*
         * Reload Instants
         */

        await loadInstants();


        /*
         * Go to profile
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
   REAL INSTANTS — SUPABASE
===================================================== */

let instants = [];

let currentIndex = 0;


/* =====================================================
   LOAD MY INSTANTS + FRIEND INSTANTS
===================================================== */

async function loadInstants() {

    if (!currentUser) {
        instants = [];
        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient
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
            .eq("is_active", true)
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        if (!data) {
            instants = [];
            return;
        }


        /*
         * Only show active, non-expired Instants.
         */

        const now = new Date();

        const validInstants =
            data.filter(instant => {

                if (!instant.expires_at) {
                    return true;
                }

                return new Date(
                    instant.expires_at
                ) > now;

            });


        /*
         * Get profiles for the users
         */

        const userIds =
            [
                ...new Set(
                    validInstants.map(
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


        /*
         * Convert profile list into a quick lookup
         */

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
         * Create signed URLs
         *
         * IMPORTANT:
         * image_url contains the Storage path,
         * not a public URL.
         */

        const processed = [];


        for (
            const instant of validInstants
        ) {

            const profile =
                profileMap.get(
                    instant.user_id
                );


            if (!profile) {
                continue;
            }


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


            processed.push({

                id:
                    instant.id,

                userId:
                    instant.user_id,

                name:
                    profile.display_name ||
                    "User",

                username:
                    `@${profile.username || "user"}`,

                avatar:
                    (
                        profile.display_name ||
                        "U"
                    )
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
                    instant.user_id ===
                    currentUser.id

            });

        }


        instants =
            processed;


        currentIndex = 0;


        renderInstantCards();

        updateHomeInstantCount();

        updateMyInstantCount();


    } catch (error) {

        console.error(
            "Load Instants error:",
            error
        );

        instants = [];

        renderInstantCards();

        updateHomeInstantCount();

    }

}


/* =====================================================
   FORMAT TIME
===================================================== */

function formatInstantTime(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString
        );


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

function updateMyInstantCount() {

    const element =
        document.getElementById(
            "myInstantCount"
        );


    if (!element) {
        return;
    }


    const count =
        instants.filter(
            instant =>
                instant.mine
        ).length;


    element.textContent =
        count;

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

    cardArea.innerHTML =
        "";


    if (
        instants.length === 0
    ) {

        showFinishedState();

        return;

    }


    const visibleInstants =
        instants.slice(
            currentIndex
        );


    for (
        let i =
            visibleInstants.length - 1;

        i >= 0;

        i--
    ) {

        const instant =
            visibleInstants[i];


        const actualIndex =
            currentIndex + i;


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "instant-card";


        card.dataset.index =
            actualIndex;


        let photoHTML =
            "";


        if (instant.image) {

            photoHTML = `

                <div
                    class="instant-photo"
                    style="
                        background-image:
                        url('${instant.image}');
                    "
                >

                    <div class="instant-gradient"></div>

                    <div class="instant-info">

                        <div class="instant-user">

                            <div class="avatar">
                                ${instant.avatar}
                            </div>

                            <div>

                                <strong>
                                    ${instant.name}
                                </strong>

                                <span>
                                    ${instant.username}
                                    ·
                                    ${instant.time}
                                </span>

                            </div>

                        </div>

                        <p class="instant-caption">
                            ${instant.caption}
                        </p>

                        <div class="instant-actions">

                            <button
                                class="like-button"
                                data-index="${actualIndex}"
                            >

                                <span>
                                    ♡
                                </span>

                                <strong>
                                    ${instant.likes}
                                </strong>

                            </button>

                            <span class="seen-text">
                                👀 ${instant.seen} seen
                            </span>

                        </div>

                    </div>

                </div>

            `;

        } else {

            photoHTML = `

                <div
                    class="
                        instant-photo
                        ${instant.photo}
                    "
                >

                    <div class="photo-placeholder">
                        ✦
                    </div>

                    <div class="instant-gradient"></div>

                    <div class="instant-info">

                        <div class="instant-user">

                            <div class="avatar">
                                ${instant.avatar}
                            </div>

                            <div>

                                <strong>
                                    ${instant.name}
                                </strong>

                                <span>
                                    ${instant.username}
                                    ·
                                    ${instant.time}
                                </span>

                            </div>

                        </div>

                        <p class="instant-caption">
                            ${instant.caption}
                        </p>

                        <div class="instant-actions">

                            <button
                                class="like-button"
                                data-index="${actualIndex}"
                            >

                                <span>
                                    ♡
                                </span>

                                <strong>
                                    ${instant.likes}
                                </strong>

                            </button>

                            <span class="seen-text">
                                👀 ${instant.seen} seen
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


    setupCardInteractions();

    updateProgress();

    markCurrentInstantSeen();

}


/* =====================================================
   CARD INTERACTIONS
===================================================== */

function setupCardInteractions() {

    const cards =
        document.querySelectorAll(
            ".instant-card"
        );


    cards.forEach(
        card => {

            let startX = 0;

            let currentX = 0;

            let dragging = false;


            card.addEventListener(
                "pointerdown",
                event => {

                    const topCard =
                        document.querySelector(
                            ".instant-card"
                        );


                    if (
                        card !== topCard
                    ) {

                        return;

                    }


                    dragging = true;

                    startX =
                        event.clientX;


                    card.style.transition =
                        "none";


                    card.setPointerCapture(
                        event.pointerId
                    );

                }
            );


            card.addEventListener(
                "pointermove",
                event => {

                    if (!dragging) {

                        return;

                    }


                    currentX =
                        event.clientX -
                        startX;


                    if (
                        currentX < 0
                    ) {

                        currentX = 0;

                    }


                    const rotation =
                        Math.min(
                            currentX / 12,
                            12
                        );


                    card.style.transform =
                        `
                        translateX(${currentX}px)
                        rotate(${rotation}deg)
                        `;

                }
            );


            card.addEventListener(
                "pointerup",
                () => {

                    if (!dragging) {

                        return;

                    }


                    dragging = false;


                    card.style.transition =
                        "";


                    if (
                        currentX > 120
                    ) {

                        swipeCard(
                            card
                        );

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

                    card.style.transform =
                        "";

                }
            );

        }
    );


    document
        .querySelectorAll(
            ".like-button"
        )
        .forEach(
            button => {

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


                        button.querySelector(
                            "span"
                        ).textContent =
                            "♥";


                        button.querySelector(
                            "strong"
                        ).textContent =
                            instants[index].likes;

                    }
                );

            }
        );

}


/* =====================================================
   SWIPE
===================================================== */

function swipeCard(card) {

    card.classList.add(
        "swipe-right"
    );


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

                return;

            }


            renderInstantCards();

        },
        350
    );

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


    totalInstants.textContent =
        total;


    if (
        total === 0
    ) {

        currentInstant.textContent =
            "0";

        return;

    }


    const number =
        Math.min(
            currentIndex + 1,
            total
        );


    currentInstant.textContent =
        number;

}


/* =====================================================
   SEEN
===================================================== */

function markCurrentInstantSeen() {

    if (
        !instants[currentIndex]
    ) {

        return;

    }


    if (
        instants[currentIndex].mine
    ) {

        return;

    }


    instants[currentIndex].seen++;

}


/* =====================================================
   FINISHED
===================================================== */

function showFinishedState() {

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

            <button
                id="resetInstants"
                style="
                    margin-top:20px;
                    height:40px;
                    padding:0 18px;
                    border:none;
                    border-radius:12px;
                    background:white;
                    color:black;
                    font-family:inherit;
                    font-size:10px;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                View again
            </button>

        </div>

    `;


    const reset =
        document.getElementById(
            "resetInstants"
        );


    if (reset) {

        reset.addEventListener(
            "click",
            () => {

                currentIndex = 0;

                renderInstantCards();

            }
        );

    }

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


openInstants.addEventListener(
    "click",
    () => {

        currentIndex = 0;

        renderInstantCards();

        showScreen(
            "instantsScreen"
        );

    }
);


instantCount.addEventListener(
    "click",
    () => {

        currentIndex = 0;

        renderInstantCards();

        showScreen(
            "instantsScreen"
        );

    }
);


/* =====================================================
   HOME COUNT
===================================================== */

const instantCountTitle =
    document.getElementById(
        "instantCountTitle"
    );


function updateHomeInstantCount() {

    instantCountTitle.textContent =
        `${instants.length} new Instants`;

}


/* =====================================================
   REQUESTS
===================================================== */

const requestsButton =
    document.getElementById(
        "requestsButton"
    );


requestsButton.addEventListener(
    "click",
    () => {

        showScreen(
            "requestsScreen"
        );

    }
);


/* =====================================================
   FRIEND SEARCH
===================================================== */

const friendSearch =
    document.getElementById(
        "friendSearch"
    );


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


        people.forEach(
            person => {

                const text =
                    person.textContent
                        .toLowerCase();


                person.style.display =
                    text.includes(query)
                        ? "flex"
                        : "none";

            }
        );

    }
);


/* =====================================================
   FRIEND TABS
===================================================== */

document
    .querySelectorAll(
        ".friend-tab"
    )
    .forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".friend-tab"
                        )
                        .forEach(
                            item =>
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

        }
    );


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
            previewModal.classList.contains(
                "show"
            )
        ) {

            discardPhoto();

            return;

        }


        if (
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

        if (
            document.hidden
        ) {

            stopCamera();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

setAuthMode(
    "login"
);


initializeAuth();
