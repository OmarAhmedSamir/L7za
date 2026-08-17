/* =====================================================
   NOW APP — PHASE 2
   Real Camera Experience
===================================================== */


/* =====================================================
   GLOBAL ELEMENTS
===================================================== */

const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");

const captureButton =
    document.getElementById("captureButton");

const navCamera =
    document.getElementById("navCamera");

const captureModal =
    document.getElementById("captureModal");

const closeCapture =
    document.getElementById("closeCapture");

const openInstants =
    document.getElementById("openInstants");

const instantCount =
    document.getElementById("instantCount");

const requestsButton =
    document.getElementById("requestsButton");

const cardArea =
    document.getElementById("cardArea");

const currentInstant =
    document.getElementById("currentInstant");

const friendSearch =
    document.getElementById("friendSearch");


/* =====================================================
   STATE
===================================================== */

let currentIndex = 0;

let cameraStream = null;

let capturedPhoto = null;

let cameraFacingMode = "environment";

let cameraOpen = false;


/* =====================================================
   SCREEN NAVIGATION
===================================================== */

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


/* =====================================================
   NAVIGATION BUTTONS
===================================================== */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        const screen =
            item.dataset.screen;


        if (screen) {
            showScreen(screen);
        }

    });

});


/* =====================================================
   BACK BUTTONS
===================================================== */

document
    .querySelectorAll(".back-button")
    .forEach(button => {

        button.addEventListener("click", () => {

            showScreen(
                button.dataset.back
            );

        });

    });


/* =====================================================
   CAMERA HTML
===================================================== */

function createCameraInterface() {

    const fakeCamera =
        document.querySelector(".fake-camera");


    if (!fakeCamera) {
        return;
    }


    fakeCamera.innerHTML = `

        <video
            id="cameraVideo"
            autoplay
            playsinline
            muted
        ></video>


        <canvas
            id="cameraCanvas"
        ></canvas>


        <div class="camera-ui">

            <div class="camera-top">

                <div class="camera-status">
                    <span class="camera-status-dot"></span>
                    <span>NOW</span>
                </div>

                <button
                    class="camera-switch"
                    id="switchCamera"
                    type="button"
                    aria-label="Switch camera"
                >
                    ↻
                </button>

            </div>


            <div
                class="camera-error"
                id="cameraError"
            >
                <div class="camera-error-icon">
                    📷
                </div>

                <h3>
                    Camera unavailable
                </h3>

                <p>
                    Please allow camera access
                    to take an Instant.
                </p>

                <button
                    class="camera-retry"
                    id="retryCamera"
                    type="button"
                >
                    Try again
                </button>
            </div>


            <div class="camera-bottom">

                <p class="camera-rule">
                    One moment.
                    <br>
                    No filters. No retakes.
                </p>


                <button
                    class="real-capture-button"
                    id="realCaptureButton"
                    type="button"
                    aria-label="Take photo"
                >
                    <span></span>
                </button>


                <small>
                    Tap to capture
                </small>

            </div>

        </div>


        <div
            class="capture-result"
            id="captureResult"
        >

            <img
                id="capturedImage"
                alt="Captured Instant"
            />


            <div class="result-overlay">

                <div class="result-top">

                    <span>
                        INSTANT
                    </span>

                </div>


                <div class="result-bottom">

                    <div>
                        <strong>
                            Your Instant
                        </strong>

                        <p>
                            Captured just now
                        </p>
                    </div>


                    <button
                        id="postInstantButton"
                        type="button"
                    >
                        Post Instant
                    </button>

                </div>

            </div>

        </div>

    `;


    setupCameraControls();

}


/* =====================================================
   CAMERA CONTROLS
===================================================== */

function setupCameraControls() {

    const switchCamera =
        document.getElementById(
            "switchCamera"
        );


    const retryCamera =
        document.getElementById(
            "retryCamera"
        );


    const realCaptureButton =
        document.getElementById(
            "realCaptureButton"
        );


    const postInstantButton =
        document.getElementById(
            "postInstantButton"
        );


    if (switchCamera) {

        switchCamera.addEventListener(
            "click",
            async () => {

                cameraFacingMode =
                    cameraFacingMode ===
                    "environment"
                        ? "user"
                        : "environment";


                await startCamera();

            }
        );

    }


    if (retryCamera) {

        retryCamera.addEventListener(
            "click",
            async () => {

                await startCamera();

            }
        );

    }


    if (realCaptureButton) {

        realCaptureButton.addEventListener(
            "click",
            capturePhoto
        );

    }


    if (postInstantButton) {

        postInstantButton.addEventListener(
            "click",
            postInstant
        );

    }

}


/* =====================================================
   OPEN CAMERA
===================================================== */

async function openCamera() {

    if (!captureModal) {
        return;
    }


    cameraOpen = true;

    capturedPhoto = null;


    captureModal.classList.add("show");

    document.body.style.overflow = "hidden";


    createCameraInterface();


    await startCamera();

}


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    const video =
        document.getElementById(
            "cameraVideo"
        );


    const errorBox =
        document.getElementById(
            "cameraError"
        );


    const captureControls =
        document.querySelector(
            ".camera-bottom"
        );


    if (!video) {
        return;
    }


    stopCamera();


    try {

        const constraints = {

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
            },

            audio: false

        };


        cameraStream =
            await navigator.mediaDevices
                .getUserMedia(
                    constraints
                );


        video.srcObject =
            cameraStream;


        await video.play();


        if (errorBox) {
            errorBox.classList.remove(
                "show"
            );
        }


        if (captureControls) {
            captureControls.style.display =
                "flex";
        }


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        if (errorBox) {
            errorBox.classList.add(
                "show"
            );
        }


        if (captureControls) {
            captureControls.style.display =
                "none";
        }

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

}


/* =====================================================
   CAPTURE PHOTO
===================================================== */

function capturePhoto() {

    const video =
        document.getElementById(
            "cameraVideo"
        );


    const canvas =
        document.getElementById(
            "cameraCanvas"
        );


    const result =
        document.getElementById(
            "captureResult"
        );


    const capturedImage =
        document.getElementById(
            "capturedImage"
        );


    if (
        !video ||
        !canvas ||
        !video.videoWidth
    ) {
        return;
    }


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext("2d");


    /*
        Mirror the front camera
        correctly.
    */

    if (
        cameraFacingMode ===
        "user"
    ) {

        context.translate(
            canvas.width,
            0
        );

        context.scale(-1, 1);

    }


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    capturedPhoto =
        canvas.toDataURL(
            "image/jpeg",
            0.92
        );


    if (capturedImage) {

        capturedImage.src =
            capturedPhoto;

    }


    stopCamera();


    if (result) {

        result.classList.add(
            "show"
        );

    }


    const cameraBottom =
        document.querySelector(
            ".camera-bottom"
        );


    if (cameraBottom) {
        cameraBottom.style.display =
            "none";
    }

}


/* =====================================================
   POST INSTANT
===================================================== */

function postInstant() {

    if (!capturedPhoto) {
        return;
    }


    /*
        For Phase 2 we store the captured
        Instant locally.

        Supabase storage/database can be
        connected in the next phase.
    */

    const instant = {

        name: "Omar",

        username: "@omar",

        avatar: "O",

        time: "just now",

        caption: "My Instant",

        photoData:
            capturedPhoto,

        likes: 0,

        seen: 0

    };


    const saved =
        JSON.parse(
            localStorage.getItem(
                "now_my_instants"
            ) || "[]"
        );


    saved.unshift(instant);


    localStorage.setItem(
        "now_my_instants",
        JSON.stringify(saved)
    );


    closeCamera();


    /*
        Update profile preview
        immediately.
    */

    addMyInstantPreview();


    showToast(
        "Instant posted ✓"
    );

}


/* =====================================================
   ADD PROFILE INSTANT
===================================================== */

function addMyInstantPreview() {

    const preview =
        document.querySelector(
            ".my-instant-preview"
        );


    if (!preview) {
        return;
    }


    const first =
        preview.firstElementChild;


    const newInstant =
        document.createElement("div");


    newInstant.className =
        "mini-instant";


    newInstant.innerHTML = `

        <span>📸</span>

        <small>
            Just now
        </small>

    `;


    preview.insertBefore(
        newInstant,
        first
    );


    /*
        Keep the preview clean.
    */

    while (
        preview.children.length > 3
    ) {

        preview.lastElementChild
            .remove();

    }

}


/* =====================================================
   CLOSE CAMERA
===================================================== */

function closeCamera() {

    stopCamera();


    cameraOpen = false;

    capturedPhoto = null;


    if (captureModal) {

        captureModal.classList.remove(
            "show"
        );

    }


    document.body.style.overflow = "";

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
   ESCAPE TO CLOSE CAMERA
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            cameraOpen
        ) {

            closeCamera();

        }

    }
);


/* =====================================================
   INSTANT DATA
===================================================== */

const instants = [

    {
        name: "Ahmed",
        username: "@ahmed",
        avatar: "A",
        time: "2 min ago",
        caption: "Just got here 😂",
        photo: "photo-one",
        likes: 2,
        seen: 5
    },

    {
        name: "Mohamed",
        username: "@mohamed",
        avatar: "M",
        time: "8 min ago",
        caption:
            "This place is actually crazy.",
        photo: "photo-two",
        likes: 4,
        seen: 7
    },

    {
        name: "Youssef",
        username: "@youssef",
        avatar: "Y",
        time: "17 min ago",
        caption:
            "Trying something new 👀",
        photo: "photo-three",
        likes: 1,
        seen: 3
    },

    {
        name: "Omar",
        username: "@omarh",
        avatar: "O",
        time: "24 min ago",
        caption: "No context.",
        photo: "photo-four",
        likes: 6,
        seen: 9
    }

];


/* =====================================================
   RENDER INSTANT CARDS
===================================================== */

function renderInstantCards() {

    if (!cardArea) {
        return;
    }


    cardArea.innerHTML = "";


    /*
        Reverse order so the first
        Instant appears on top.
    */

    for (
        let i = instants.length - 1;
        i >= 0;
        i--
    ) {

        const instant =
            instants[i];


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "instant-card";


        card.dataset.index =
            i;


        card.innerHTML = `

            <div
                class="
                    instant-photo
                    ${instant.photo}
                "
            >

                <div
                    class="photo-placeholder"
                >
                    ✦
                </div>


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
                            class="
                                avatar
                                avatar-${getAvatarClass(
                                    instant.avatar
                                )}
                            "
                        >
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


                    <p
                        class="instant-caption"
                    >
                        ${instant.caption}
                    </p>


                    <div
                        class="instant-actions"
                    >

                        <button
                            class="like-button"
                            data-index="${i}"
                            type="button"
                        >

                            <span>♡</span>

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


        cardArea.appendChild(card);

    }


    setupCardInteractions();

    updateProgress();

}


/* =====================================================
   AVATAR CLASS HELPER
===================================================== */

function getAvatarClass(letter) {

    const map = {

        A: "one",
        M: "two",
        Y: "three",
        O: "four"

    };


    return map[letter] || "five";

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


                if (currentX < 0) {
                    currentX = 0;
                }


                const rotation =
                    Math.min(
                        currentX / 12,
                        12
                    );


                card.style.transform =
                    `
                    translateX(
                        ${currentX}px
                    )
                    rotate(
                        ${rotation}deg
                    )
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


                if (currentX > 120) {

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
                            button.dataset
                                .index
                        );


                    if (
                        button.classList
                            .contains("liked")
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
                        instants[index]
                            .likes;

                }
            );

        });

}


/* =====================================================
   SWIPE CARD
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
   FINISHED VIEW
===================================================== */

function showFinishedState() {

    if (!cardArea) {
        return;
    }


    cardArea.innerHTML = `

        <div
            class="finished-state"
        >

            <div
                class="finished-icon"
            >
                ✦
            </div>


            <h2>
                You're all caught up
            </h2>


            <p>
                No more Instants
                from your friends.
            </p>

        </div>

    `;

}


/* =====================================================
   OPEN INSTANTS
===================================================== */

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
   REQUESTS
===================================================== */

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

                        item.classList
                            .remove(
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
   TOAST
===================================================== */

function showToast(message) {

    let toast =
        document.getElementById(
            "nowToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "nowToast";


        toast.className =
            "now-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast.hideTimer
    );


    toast.hideTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2200);

}


/* =====================================================
   CLEANUP
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

renderInstantCards();

showScreen("homeScreen");
