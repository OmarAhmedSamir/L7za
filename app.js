/* =====================================================
   L7ZA — PHASE 2
   REAL CAMERA + INSTANTS
===================================================== */


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


    cameraVideo.srcObject = null;

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

            /*
                Some desktop browsers
                don't support camera switching.
            */

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

function showCameraError(error) {

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

            showCameraError(error);

        }

    }
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


    /*
        Mirror front camera so
        selfie preview feels natural.
    */

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
   DISCARD
===================================================== */

discardButton.addEventListener(
    "click",
    discardPhoto
);


function discardPhoto() {

    capturedImage.src = "";

    capturedImage.dataset.image =
        "";

    previewModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* =====================================================
   POST REAL INSTANT
===================================================== */

postInstantButton.addEventListener(
    "click",
    postInstant
);


function postInstant() {

    const image =
        capturedImage.dataset.image;


    if (!image) {

        return;

    }


    const newInstant = {

        id:
            "local-" +
            Date.now(),

        name:
            "Omar",

        username:
            "@omar",

        avatar:
            "O",

        time:
            "Just now",

        caption:
            "Just captured this moment.",

        image:
            image,

        likes:
            0,

        seen:
            0,

        mine:
            true

    };


    /*
        Add newest Instant to the beginning.
    */

    instants.unshift(
        newInstant
    );


    currentIndex = 0;


    previewModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";


    renderInstantCards();


    updateHomeInstantCount();


    updateMyInstantPreview();


    showScreen(
        "instantsScreen"
    );


    capturedImage.src = "";

    capturedImage.dataset.image =
        "";

}


/* =====================================================
   INSTANT DATA
===================================================== */

const instants = [

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


let currentIndex = 0;


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

    cardArea.innerHTML = "";


    if (
        instants.length === 0
    ) {

        showFinishedState();

        return;

    }


    /*
        Only render cards starting
        from current index.
    */

    const visibleInstants =
        instants.slice(
            currentIndex
        );


    /*
        Reverse for stacking.
    */

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


        let photoHTML = "";


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
                        !instants[index]
                    ) {

                        return;

                    }


                    /*
                        Prevent double-like.
                    */

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

        });

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

    if (!currentInstant) {

        return;

    }


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


    /*
        Demo only.
        Supabase will handle this
        in Phase 3.
    */

    instants[currentIndex].seen++;

}


/* =====================================================
   FINISHED STATE
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

    const count =
        instants.length;


    instantCountTitle.textContent =
        `${count} new Instants`;

}


/* =====================================================
   MY PROFILE PREVIEW
===================================================== */

const myInstantPreview =
    document.getElementById(
        "myInstantPreview"
    );

const myInstantCount =
    document.getElementById(
        "myInstantCount"
    );


function updateMyInstantPreview() {

    const mine =
        instants.filter(
            instant =>
                instant.mine
        );


    if (
        mine.length === 0
    ) {

        return;

    }


    mine.forEach(
        instant => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "mini-instant";


            wrapper.innerHTML = `

                <img
                    src="${instant.image}"
                    alt="My Instant"
                >

                <small>
                    Just now
                </small>

            `;


            myInstantPreview.prepend(
                wrapper
            );

        }
    );


    const current =
        Number(
            myInstantCount.textContent
        );


    myInstantCount.textContent =
        current + mine.length;

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


                button.textContent =
                    "Accepted ✓";


                button.style.background =
                    "#202020";


                button.style.color =
                    "white";


                setTimeout(
                    () => {

                        card.style.opacity =
                            "0";

                        card.style.transform =
                            "translateX(20px)";

                        card.style.transition =
                            ".3s ease";


                        setTimeout(
                            () => {

                                card.remove();

                            },
                            300
                        );

                    },
                    400
                );

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


                card.style.opacity =
                    "0";


                card.style.transform =
                    "translateX(-20px)";


                card.style.transition =
                    ".3s ease";


                setTimeout(
                    () => {

                        card.remove();

                    },
                    300
                );

            }
        );

    });


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


                if (
                    text.includes(query)
                ) {

                    person.style.display =
                        "flex";

                } else {

                    person.style.display =
                        "none";

                }

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
    .forEach(tab => {

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

    });


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

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

renderInstantCards();

updateHomeInstantCount();

showScreen(
    "homeScreen"
);
