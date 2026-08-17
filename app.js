/* =====================================================
   NOW APP — PHASE 1
===================================================== */


/* =====================================================
   SCREEN NAVIGATION
===================================================== */

const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");


function showScreen(screenId) {

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }


    navItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.screen === screenId) {
            item.classList.add("active");
        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


navItems.forEach(item => {

    item.addEventListener("click", () => {

        const screen = item.dataset.screen;

        if (screen) {
            showScreen(screen);
        }

    });

});


/* =====================================================
   BACK BUTTONS
===================================================== */

document.querySelectorAll(".back-button").forEach(button => {

    button.addEventListener("click", () => {

        showScreen(button.dataset.back);

    });

});


/* =====================================================
   CAMERA MODAL
===================================================== */

const captureButton =
    document.getElementById("captureButton");

const navCamera =
    document.getElementById("navCamera");

const captureModal =
    document.getElementById("captureModal");

const closeCapture =
    document.getElementById("closeCapture");


function openCamera() {

    captureModal.classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeCamera() {

    captureModal.classList.remove("show");

    document.body.style.overflow = "";

}


captureButton.addEventListener(
    "click",
    openCamera
);


navCamera.addEventListener(
    "click",
    openCamera
);


closeCapture.addEventListener(
    "click",
    closeCamera
);


captureModal.addEventListener(
    "click",
    event => {

        if (event.target === captureModal) {
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
        caption: "This place is actually crazy.",
        photo: "photo-two",
        likes: 4,
        seen: 7
    },

    {
        name: "Youssef",
        username: "@youssef",
        avatar: "Y",
        time: "17 min ago",
        caption: "Trying something new 👀",
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


let currentIndex = 0;


/* =====================================================
   RENDER INSTANT CARDS
===================================================== */

const cardArea =
    document.getElementById("cardArea");


function renderInstantCards() {

    cardArea.innerHTML = "";


    /*
        Reverse order so the first card
        is visually on top.
    */

    for (
        let i = instants.length - 1;
        i >= 0;
        i--
    ) {

        const instant = instants[i];


        const card =
            document.createElement("article");


        card.className =
            "instant-card";


        card.dataset.index = i;


        card.innerHTML = `

            <div class="instant-photo ${instant.photo}">

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
                            data-index="${i}"
                        >
                            <span>♡</span>
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


        cardArea.appendChild(card);

    }


    setupCardInteractions();

    updateProgress();

}


/* =====================================================
   CARD SWIPE
===================================================== */

function setupCardInteractions() {

    const cards =
        document.querySelectorAll(".instant-card");


    cards.forEach(card => {

        let startX = 0;
        let startY = 0;

        let currentX = 0;

        let dragging = false;


        card.addEventListener(
            "pointerdown",
            event => {

                /*
                    Only the top card should respond.
                */

                const topCard =
                    document.querySelector(
                        ".instant-card"
                    );


                if (card !== topCard) {
                    return;
                }


                dragging = true;

                startX = event.clientX;
                startY = event.clientY;

                card.style.transition = "none";

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
                    event.clientX - startX;


                /*
                    Only allow movement
                    toward the right.
                */

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

                        card.style.transform = "";

                    }, 350);

                }


                currentX = 0;

            }
        );


        card.addEventListener(
            "pointercancel",
            () => {

                dragging = false;

                card.style.transform = "";

            }
        );

    });


    /*
        Like buttons
    */

    document
        .querySelectorAll(".like-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const index =
                        Number(
                            button.dataset.index
                        );


                    instants[index].likes++;


                    button.classList.add(
                        "liked"
                    );


                    button.querySelector(
                        "span"
                    ).textContent = "♥";


                    button.querySelector(
                        "strong"
                    ).textContent =
                        instants[index].likes;

                }
            );

        });

}


/* =====================================================
   SWIPE CARD
===================================================== */

function swipeCard(card) {

    card.classList.add("swipe-right");


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
    document.getElementById(
        "currentInstant"
    );


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


openInstants.addEventListener(
    "click",
    () => {

        showScreen("instantsScreen");

    }
);


instantCount.addEventListener(
    "click",
    () => {

        showScreen("instantsScreen");

    }
);


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

        showScreen("requestsScreen");

    }
);


/* =====================================================
   ACCEPT / DECLINE REQUEST
===================================================== */

document
    .querySelectorAll(".accept-button")
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


                setTimeout(() => {

                    card.style.opacity = "0";

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


document
    .querySelectorAll(".decline-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const card =
                    button.closest(
                        ".request-card"
                    );


                card.style.opacity = "0";

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


        people.forEach(person => {

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

        });

    }
);


/* =====================================================
   FRIEND TABS
===================================================== */

document
    .querySelectorAll(".friend-tab")
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
                                .remove("active")
                    );


                tab.classList.add("active");


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
   INITIALIZE
===================================================== */

renderInstantCards();

showScreen("homeScreen");
