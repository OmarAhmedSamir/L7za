/* =====================================================
   L7ZA — PHASE 2
===================================================== */


/* =====================================================
   STORAGE
===================================================== */

const STORAGE_KEY = "l7za_phase2_instants";

let localInstants = [];

try {
    localInstants =
        JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];
} catch {
    localInstants = [];
}


/* =====================================================
   HELPERS
===================================================== */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function saveLocalInstants() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(localInstants)
    );

}


function showToast(message) {

    let toast =
        document.querySelector(
            ".l7za-toast"
        );

    if (!toast) {

        toast =
            document.createElement("div");

        toast.className =
            "l7za-toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        window.__l7zaToastTimer
    );

    window.__l7zaToastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);

}


/* =====================================================
   SCREEN NAVIGATION
===================================================== */

const screens =
    document.querySelectorAll(".screen");

const navItems =
    document.querySelectorAll(".nav-item");


function showScreen(screenId) {

    screens.forEach(screen => {

        screen.classList.remove("active");

    });


    const target =
        document.getElementById(screenId);


    if (target) {

        target.classList.add("active");

    }


    navItems.forEach(item => {

        item.classList.remove("active");


        if (
            item.dataset.screen ===
            screenId
        ) {

            item.classList.add("active");

        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
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
   CAMERA SYSTEM
===================================================== */

const captureButton =
    $("captureButton");

const navCamera =
    $("navCamera");

const captureModal =
    $("captureModal");

const closeCapture =
    $("closeCapture");


let cameraStream = null;

let currentFacingMode = "environment";

let capturedImageData = null;

let cameraReady = false;


/* =====================================================
   BUILD PHASE 2 CAMERA
===================================================== */

function buildCameraUI() {

    if (!captureModal) {
        return;
    }


    const content =
        captureModal.querySelector(
            ".modal-content"
        );


    if (!content) {
        return;
    }


    content.innerHTML = `

        <button
            class="modal-close"
            id="phase2CloseCamera"
            aria-label="Close camera"
        >
            ×
        </button>


        <div class="phase2-camera">


            <video
                id="cameraVideo"
                class="camera-video"
                autoplay
                muted
                playsinline
            ></video>


            <div class="camera-top-controls">

                <button
                    class="camera-control-button"
                    id="switchCamera"
                    type="button"
                    aria-label="Switch camera"
                >
                    ↻
                </button>

            </div>


            <div
                class="camera-status"
                id="cameraStatus"
            >
                Camera
            </div>


            <div
                class="camera-bottom-controls"
            >

                <button
                    class="camera-capture"
                    id="phase2Capture"
                    type="button"
                    aria-label="Capture"
                ></button>

            </div>


            <div
                class="camera-error"
                id="cameraError"
                style="display:none;"
            >

                <div class="camera-error-inner">

                    <div
                        class="camera-error-icon"
                    >
                        📷
                    </div>

                    <h2>
                        Camera unavailable
                    </h2>

                    <p id="cameraErrorText">
                        Camera access is required
                        to create an Instant.
                    </p>

                    <button
                        id="retryCamera"
                        type="button"
                    >
                        Try again
                    </button>

                </div>

            </div>


            <div
                class="capture-preview"
                id="capturePreview"
            >

                <img
                    id="previewImage"
                    class="preview-image"
                    alt="Captured instant"
                >


                <div class="preview-bottom">

                    <textarea
                        id="captionInput"
                        class="caption-input"
                        maxlength="180"
                        placeholder="Add a caption... (optional)"
                    ></textarea>


                    <div class="preview-actions">

                        <button
                            class="preview-action preview-send"
                            id="sendInstant"
                            type="button"
                        >
                            Send
                        </button>

                    </div>

                </div>

            </div>


            <div
                class="send-success"
                id="sendSuccess"
            >

                <div>

                    <div
                        class="send-success-icon"
                    >
                        ✓
                    </div>

                    <h2>
                        Sent
                    </h2>

                    <p>
                        Your Instant was saved.
                    </p>

                </div>

            </div>

        </div>
    `;


    document
        .getElementById(
            "phase2CloseCamera"
        )
        .addEventListener(
            "click",
            closeCamera
        );


    document
        .getElementById(
            "switchCamera"
        )
        .addEventListener(
            "click",
            switchCamera
        );


    document
        .getElementById(
            "phase2Capture"
        )
        .addEventListener(
            "click",
            capturePhoto
        );


    document
        .getElementById(
            "retryCamera"
        )
        .addEventListener(
            "click",
            startCamera
        );


    document
        .getElementById(
            "sendInstant"
        )
        .addEventListener(
            "click",
            sendInstant
        );

}


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    const video =
        $("cameraVideo");

    const error =
        $("cameraError");

    const errorText =
        $("cameraErrorText");

    const status =
        $("cameraStatus");


    if (!video) {
        return;
    }


    cameraReady = false;


    if (error) {
        error.style.display = "none";
    }


    if (status) {
        status.textContent =
            "Starting camera...";
    }


    stopCamera();


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showCameraError(
            "Your browser does not support camera access."
        );

        return;

    }


    try {

        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        facingMode:
                            currentFacingMode,

                        width: {
                            ideal: 1080
                        },

                        height: {
                            ideal: 1920
                        }
                    },

                    audio: false

                });


        video.srcObject =
            cameraStream;


        await video.play();


        cameraReady = true;


        if (currentFacingMode === "user") {

            video.classList.add(
                "mirrored"
            );

            status.textContent =
                "Front camera";

        } else {

            video.classList.remove(
                "mirrored"
            );

            status.textContent =
                "Back camera";

        }


    } catch (errorObject) {

        console.error(
            "Camera error:",
            errorObject
        );


        showCameraError(
            getCameraErrorMessage(
                errorObject
            )
        );

    }

}


/* =====================================================
   CAMERA ERROR
===================================================== */

function getCameraErrorMessage(error) {

    if (
        error &&
        error.name ===
        "NotAllowedError"
    ) {

        return (
            "Camera permission was denied. " +
            "Allow camera access in your browser settings."
        );

    }


    if (
        error &&
        error.name ===
        "NotFoundError"
    ) {

        return (
            "No camera was found on this device."
        );

    }


    if (
        error &&
        error.name ===
        "NotReadableError"
    ) {

        return (
            "The camera is currently being used by another app."
        );

    }


    return (
        "We couldn't start the camera. " +
        "Please try again."
    );

}


function showCameraError(message) {

    const error =
        $("cameraError");

    const errorText =
        $("cameraErrorText");

    const status =
        $("cameraStatus");


    if (errorText) {

        errorText.textContent =
            message;

    }


    if (error) {

        error.style.display =
            "flex";

    }


    if (status) {

        status.textContent =
            "Camera unavailable";

    }

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

    cameraReady = false;

}


/* =====================================================
   SWITCH CAMERA
===================================================== */

async function switchCamera() {

    if (!cameraReady) {
        return;
    }


    currentFacingMode =
        currentFacingMode === "environment"
            ? "user"
            : "environment";


    await startCamera();

}


/* =====================================================
   CAPTURE PHOTO
===================================================== */

function capturePhoto() {

    if (!cameraReady) {
        return;
    }


    const video =
        $("cameraVideo");

    const preview =
        $("capturePreview");

    const image =
        $("previewImage");

    const capture =
        $("phase2Capture");


    if (
        !video ||
        !preview ||
        !image
    ) {
        return;
    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext("2d");


    if (!context) {
        return;
    }


    if (
        currentFacingMode ===
        "user"
    ) {

        context.translate(
            canvas.width,
            0
        );

        context.scale(
            -1,
            1
        );

    }


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    capturedImageData =
        canvas.toDataURL(
            "image/jpeg",
            .82
        );


    image.src =
        capturedImageData;


    preview.classList.add(
        "show"
    );


    /*
        Important:
        No Retake button.
        The user can only Send.
    */

    if (capture) {

        capture.disabled =
            true;

    }

    stopCamera();

}


/* =====================================================
   SEND INSTANT
===================================================== */

function sendInstant() {

    if (!capturedImageData) {
        return;
    }


    const captionInput =
        $("captionInput");


    const caption =
        captionInput
            ? captionInput.value.trim()
            : "";


    const newInstant = {

        id:
            "local-" +
            Date.now(),

        name: "You",

        username: "@you",

        avatar: "Y",

        time: "Just now",

        caption: caption,

        image: capturedImageData,

        likes: 0,

        seen: 0,

        local: true

    };


    localInstants.unshift(
        newInstant
    );


    saveLocalInstants();


    renderLocalProfile();


    updateHomeInstantCount();


    const success =
        $("sendSuccess");

    const preview =
        $("capturePreview");


    if (preview) {

        preview.classList.remove(
            "show"
        );

    }


    if (success) {

        success.classList.add(
            "show"
        );

    }


    showToast(
        "Instant sent ✓"
    );


    setTimeout(() => {

        closeCamera();

    }, 1000);

}


/* =====================================================
   OPEN CAMERA
===================================================== */

function openCamera() {

    if (!captureModal) {
        return;
    }


    captureModal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    resetCameraState();

    startCamera();

}


/* =====================================================
   RESET CAMERA STATE
===================================================== */

function resetCameraState() {

    capturedImageData = null;


    const preview =
        $("capturePreview");

    const success =
        $("sendSuccess");

    const image =
        $("previewImage");

    const caption =
        $("captionInput");

    const capture =
        $("phase2Capture");


    if (preview) {

        preview.classList.remove(
            "show"
        );

    }


    if (success) {

        success.classList.remove(
            "show"
        );

    }


    if (image) {

        image.removeAttribute(
            "src"
        );

    }


    if (caption) {

        caption.value = "";

    }


    if (capture) {

        capture.disabled = false;

    }

}


/* =====================================================
   CLOSE CAMERA
===================================================== */

function closeCamera() {

    stopCamera();


    if (captureModal) {

        captureModal.classList.remove(
            "show"
        );

    }


    document.body.style.overflow =
        "";


    capturedImageData = null;

}


/* =====================================================
   CAMERA EVENTS
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


if (closeCapture) {

    closeCapture.addEventListener(
        "click",
        closeCamera
    );

}


if (captureModal) {

    captureModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                captureModal
            ) {

                closeCamera();

            }

        }
    );

}


/* =====================================================
   ESC CLOSE
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
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
   INSTANT DATA
===================================================== */

const defaultInstants = [

    {
        id: "demo-1",

        name: "Ahmed",
        username: "@ahmed",
        avatar: "A",
        time: "2 min ago",

        caption:
            "Just got here 😂",

        photo:
            "photo-one",

        likes: 2,
        seen: 5
    },

    {
        id: "demo-2",

        name: "Mohamed",
        username: "@mohamed",
        avatar: "M",
        time: "8 min ago",

        caption:
            "This place is actually crazy.",

        photo:
            "photo-two",

        likes: 4,
        seen: 7
    },

    {
        id: "demo-3",

        name: "Youssef",
        username: "@youssef",
        avatar: "Y",
        time: "17 min ago",

        caption:
            "Trying something new 👀",

        photo:
            "photo-three",

        likes: 1,
        seen: 3
    },

    {
        id: "demo-4",

        name: "Omar",
        username: "@omarh",
        avatar: "O",
        time: "24 min ago",

        caption:
            "No context.",

        photo:
            "photo-four",

        likes: 6,
        seen: 9
    }

];


/*
    Local Instants appear first.
*/

const instants = [
    ...localInstants,
    ...defaultInstants
];


let currentIndex = 0;


/* =====================================================
   CARD AREA
===================================================== */

const cardArea =
    $("cardArea");


/* =====================================================
   RENDER CARDS
===================================================== */

function renderInstantCards() {

    if (!cardArea) {
        return;
    }


    cardArea.innerHTML = "";


    /*
        Important:
        index 0 is now physically the top card.
    */

    instants.forEach(
        (instant, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "instant-card";


            card.dataset.index =
                index;


            const media =
                instant.image

                    ? `
                        <img
                            src="${instant.image}"
                            alt=""
                        >

                        ${
                            instant.local
                                ? `
                                    <span
                                        class="local-instant-badge"
                                    >
                                        Your Instant
                                    </span>
                                `
                                : ""
                        }
                    `

                    : `
                        <div
                            class="photo-placeholder"
                        >
                            ✦
                        </div>
                    `;


            const photoClass =
                instant.photo ||
                "";


            card.innerHTML = `

                <div
                    class="
                        instant-photo
                        ${photoClass}
                    "
                >

                    ${media}

                    <div
                        class="instant-gradient"
                    ></div>


                    <div
                        class="instant-info"
                    >

                        <div
                            class="instant-user"
                        >

                            <div class="avatar">
                                ${escapeHTML(
                                    instant.avatar
                                )}
                            </div>


                            <div>

                                <strong>
                                    ${escapeHTML(
                                        instant.name
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        instant.username
                                    )}
                                    ·
                                    ${escapeHTML(
                                        instant.time
                                    )}
                                </span>

                            </div>

                        </div>


                        ${
                            instant.caption
                                ? `
                                    <p
                                        class="instant-caption"
                                    >
                                        ${escapeHTML(
                                            instant.caption
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        <div
                            class="instant-actions"
                        >

                            <button
                                class="like-button"
                                data-index="${index}"
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

        let startX = 0;

        let startY = 0;

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

                startY =
                    event.clientY;

                currentX = 0;


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
            event => {

                if (!dragging) {
                    return;
                }


                dragging = false;


                try {

                    card.releasePointerCapture(
                        event.pointerId
                    );

                } catch {}


                card.style.transition =
                    "";


                if (
                    currentX > 120
                ) {

                    swipeCard(card);

                } else {

                    card.classList.add(
                        "return-card"
                    );


                    setTimeout(() => {

                        card.classList.remove(
                            "return-card"
                        );

                        card.style.transform =
                            "";

                    }, 350);

                }


                currentX = 0;

            }
        );


        card.addEventListener(
            "pointercancel",
            () => {

                dragging = false;

                card.style.transition =
                    "";

                card.style.transform =
                    "";

            }
        );

    });


    /*
        Like buttons
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
                        !Number.isInteger(
                            index
                        ) ||
                        !instants[index]
                    ) {
                        return;
                    }


                    /*
                        Toggle like
                    */

                    if (
                        button.classList.contains(
                            "liked"
                        )
                    ) {

                        instants[index]
                            .likes--;

                        button.classList.remove(
                            "liked"
                        );

                        button.querySelector(
                            "span"
                        ).textContent =
                            "♡";

                    } else {

                        instants[index]
                            .likes++;

                        button.classList.add(
                            "liked"
                        );

                        button.querySelector(
                            "span"
                        ).textContent =
                            "♥";

                    }


                    button.querySelector(
                        "strong"
                    ).textContent =
                        instants[index]
                            .likes;


                    /*
                        Save local likes
                        for local Instants.
                    */

                    const instant =
                        instants[index];


                    if (
                        instant.local
                    ) {

                        const stored =
                            localInstants.find(
                                item =>
                                    item.id ===
                                    instant.id
                            );


                        if (stored) {

                            stored.likes =
                                instant.likes;

                            saveLocalInstants();

                        }

                    }

                }
            );

        });

}


/* =====================================================
   SWIPE
===================================================== */

function swipeCard(card) {

    card.classList.add(
        "swipe-right"
    );


    setTimeout(() => {

        currentIndex++;


        if (
            currentIndex >=
            instants.length
        ) {

            currentIndex =
                instants.length;

            showFinishedState();

            return;

        }


        card.remove();

        updateProgress();

    }, 350);

}


/* =====================================================
   PROGRESS
===================================================== */

const currentInstant =
    $("currentInstant");


function updateProgress() {

    if (!currentInstant) {
        return;
    }


    const number =
        Math.min(
            currentIndex + 1,
            instants.length
        );


    currentInstant.textContent =
        number;

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
    $("openInstants");

const instantCount =
    $("instantCount");


if (openInstants) {

    openInstants.addEventListener(
        "click",
        () => {

            showScreen(
                "instantsScreen"
            );

        }
    );

}


if (instantCount) {

    instantCount.addEventListener(
        "click",
        () => {

            showScreen(
                "instantsScreen"
            );

        }
    );

}


/* =====================================================
   HOME INSTANT COUNT
===================================================== */

function updateHomeInstantCount() {

    if (!instantCount) {
        return;
    }


    const count =
        instants.length;


    const countSpan =
        instantCount.querySelector(
            ".count-text span"
        );


    if (countSpan) {

        countSpan.textContent =
            `${count} Instants waiting`;

    }

}


/* =====================================================
   REQUESTS
===================================================== */

const requestsButton =
    $("requestsButton");


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
   ACCEPT REQUEST
===================================================== */

document
    .querySelectorAll(
        ".accept-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const card =
                    button.closest(
                        ".request-card"
                    );


                if (!card) {
                    return;
                }


                button.textContent =
                    "Accepted ✓";


                button.style.background =
                    "#202020";


                button.style.color =
                    "white";


                setTimeout(() => {

                    card.style.opacity =
                        "0";

                    card.style.transform =
                        "translateX(20px)";

                    card.style.transition =
                        ".3s ease";


                    setTimeout(() => {

                        card.remove();

                    }, 300);

                }, 400);

            }
        );

    });


/* =====================================================
   DECLINE REQUEST
===================================================== */

document
    .querySelectorAll(
        ".decline-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const card =
                    button.closest(
                        ".request-card"
                    );


                if (!card) {
                    return;
                }


                card.style.opacity =
                    "0";

                card.style.transform =
                    "translateX(-20px)";

                card.style.transition =
                    ".3s ease";


                setTimeout(() => {

                    card.remove();

                }, 300);

            }
        );

    });


/* =====================================================
   FRIEND SEARCH
===================================================== */

const friendSearch =
    $("friendSearch");


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
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


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
   PROFILE — LOCAL INSTANTS
===================================================== */

function renderLocalProfile() {

    const container =
        document.querySelector(
            ".my-instant-preview"
        );


    if (!container) {
        return;
    }


    /*
        Keep the existing demo
        placeholders if no local
        Instants exist.
    */

    if (
        localInstants.length === 0
    ) {
        return;
    }


    container.innerHTML = "";


    localInstants.forEach(
        instant => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "mini-instant";


            item.innerHTML = `

                <img
                    src="${instant.image}"
                    alt="Your Instant"
                >

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   CAMERA UI INITIALIZATION
===================================================== */

buildCameraUI();


/* =====================================================
   INITIALIZE
===================================================== */

renderInstantCards();

renderLocalProfile();

updateHomeInstantCount();

showScreen(
    "homeScreen"
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
   BEFORE UNLOAD
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();

    }
);
