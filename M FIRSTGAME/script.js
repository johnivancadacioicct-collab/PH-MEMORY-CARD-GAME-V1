
// ==========================================
// MEMORY CARD GAME V3 PH
// DEVELOPED BY JOHN IVAN CADACIO
// ==========================================

// IMAGE COLLECTIONS

const imageCollections = {
    president: [
        "President/PRESIDENT1.jpg",
        "President/PRESIDENT2.jpg",
        "President/PRESIDENT3.jpg",
        "President/PRESIDENT4.jpg",
        "President/PRESIDENT5.jpg",
        "President/PRESIDENT6.jpg",
        "President/PRESIDENT7.jpg",
        "President/PRESIDENT8.jpg"
    ],

    animals: [
        "animals/ANIMALS1.jpg",
        "animals/ANIMALS2.jpg",
        "animals/ANIMALS3.jpg",
        "animals/ANIMALS4.jpg",
        "animals/ANIMALS5.jpg",
        "animals/ANIMALS6.jpg",
        "animals/ANIMALS7.jpg",
        "animals/ANIMALS8.jpg"
    ],

    flags: [
        "Flags/FLAG1.png",
        "Flags/FLAG2.png",
        "Flags/FLAG3.png",
        "Flags/FLAG4.png",
        "Flags/FLAG5.png",
        "Flags/FLAG6.png",
        "Flags/FLAG7.jpg",
        "Flags/FLAG8.png"
    ]
};

// DIFFICULTY

const difficulties = {
    easy: {
        cards: 8,
        time: 15,
        winPoints: 20,
        losePoints: 50,
        coins: 100
    },
    medium: {
        cards: 12,
        time: 35,
        winPoints: 120,
        losePoints: 200,
        coins: 500
    },
    hard: {
        cards: 16,
        time: 49,
        winPoints: 105,
        losePoints: 200,
        coins: 600
    }
};

// RANKS

const ranks = [
    "Bronze",
    "Warrior",
    "Master",
    "Grand Master",
    "Epic",
    "Devine",
    "Aurlux",
    "Imperials",
    "XaoMemory",
    "Coca Cola",
    "DB Ranked",
    "Legendary",
    "Mythical Memory",
    "Mythical Immoratlity",
    "The Legendary",
];

const POINTS_PER_RANK = 300;
const MAX_RANK_POINTS = 1500;

// PLAYER SAVE

function loadPlayer() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("flippersHarushuPlayer")
        ) || {};

        return {
            coins: Math.max(0, Number(saved.coins) || 0),
            diamonds: Math.max(0, Number(saved.diamonds) || 0),
            rankPoints: Math.max(
                0,
                Math.min(MAX_RANK_POINTS, Number(saved.rankPoints) || 0)
            ),
            hints: Math.max(0, Number(saved.hints) || 0),
            lastDiamondClaim: Math.max(0, Number(saved.lastDiamondClaim) || 0),
            volume: Math.max(0, Math.min(100, Number(saved.volume ?? 35))),
            musicEnabled: saved.musicEnabled !== false
        };
    } catch {
        return {
            coins: 500,
            diamonds: 150,
            rankPoints: 20,
            hints: 10,
            lastDiamondClaim: 10,
            volume: 35,
            musicEnabled: true
        };
    }
}

let player = loadPlayer();

function savePlayer() {
    localStorage.setItem(
        "flippersHarushuPlayer",
        JSON.stringify(player)
    );
}

// GAME VARIABLES

let selectedCategory = "";
let selectedMode = "rank";
let currentDifficulty = "";

let cards = [];
let selectedCards = [];

let matchedPairs = 0;
let totalPairs = 0;
let timeLeft = 0;

let timerInterval = null;
let countdownInterval = null;
let mismatchTimeout = null;
let hintTimeout = null;
let shuffleTimeouts = [];

let lockBoard = false;
let gameActive = false;
let gameToken = 0;
let shuffleComplete = false;

// AUDIO ELEMENTS

const backgroundMusic = document.getElementById("backgroundMusic");
const victoryMusic = document.getElementById("victoryMusic");
const defeatMusic = document.getElementById("defeatMusic");

// CARD FLIP SOUND - GENERATED WITH JAVASCRIPT

let audioContext = null;

function playFlipSound() {
    if (!player.musicEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        const now = audioContext.currentTime;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(620, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.07);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.1);

    } catch (error) {
        console.warn("Flip sound unavailable:", error);
    }
}

// PLAYER DISPLAY

function getRankIndex() {
    return Math.min(
        Math.floor(player.rankPoints / POINTS_PER_RANK),
        ranks.length - 1
    );
}

function getRank() {
    return ranks[getRankIndex()];
}

function updatePlayerDisplay() {
    document.getElementById("rank").textContent = getRank();

    document.getElementById("coins").textContent =
        player.coins.toLocaleString();

    document.getElementById("diamonds").textContent =
        player.diamonds.toLocaleString();

    document.getElementById("hintCount").textContent = player.hints;

    document.getElementById("shopDiamonds").textContent =
        player.diamonds.toLocaleString();
}

function updateRankResult() {
    const rankIndex = getRankIndex();
    const points = player.rankPoints % POINTS_PER_RANK;

    document.getElementById("resultRank").textContent =
        getRank().toUpperCase();

    document.getElementById("rankProgress").textContent =
        rankIndex === ranks.length - 1
            ? "MAXIMUM RANK REACHED!"
            : `${points} / ${POINTS_PER_RANK} POINTS`;

    document.getElementById("rankProgressBar").style.width =
        (rankIndex === ranks.length - 1 ? 100 : points / 2) + "%";

    document.getElementById("nextRankMessage").textContent =
        rankIndex === ranks.length - 1
            ? "You reached the highest rank!"
            : `${POINTS_PER_RANK - points} points to ${ranks[rankIndex + 1]}`;
}

updatePlayerDisplay();

// SCREEN NAVIGATION

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
}

function enterGame() {
    document.getElementById("splashScreen").classList.add("hidden");
    showScreen("mainMenu");
    playBackgroundMusic();
}
function playBackgroundMusic() {
    // Existing code mo dito
}

// PALIT MUSIC DEPENDING ON DIFFICULTY
function changeDifficultyMusic(difficulty) {

    const musicTracks = {
        easy: "music/easy.mp3",
        medium: "music/medium.mp3",
        hard: "music/MusicHard.mp3"
    };

    backgroundMusic.pause();

    backgroundMusic.src = musicTracks[difficulty];
    backgroundMusic.currentTime = 0;
    backgroundMusic.load();

    if (player.musicEnabled) {
        backgroundMusic.play().catch(error => {
            console.log("Music playback failed:", error);
        });
    }
}
// MUSIC

function applyMusicSettings() {
    backgroundMusic.volume = player.volume / 100;
    backgroundMusic.muted = !player.musicEnabled;
    victoryMusic.muted = !player.musicEnabled;
    defeatMusic.muted = !player.musicEnabled;

    document.getElementById("volumeSlider").value = player.volume;
    document.getElementById("volumeValue").textContent =
        player.volume + "%";

    document.getElementById("musicToggleText").textContent =
        player.musicEnabled ? "🔊 MUSIC ON" : "🔇 MUSIC OFF";
}

function playBackgroundMusic() {
    victoryMusic.pause();
    defeatMusic.pause();

    victoryMusic.currentTime = 0;
    defeatMusic.currentTime = 0;

    if (player.musicEnabled) {
        backgroundMusic.play().catch(() => {});
    }
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
}

function playResultMusic(type) {
    stopBackgroundMusic();

    victoryMusic.pause();
    defeatMusic.pause();

    victoryMusic.currentTime = 0;
    defeatMusic.currentTime = 0;

    if (!player.musicEnabled) return;

    const audio = type === "win" ? victoryMusic : defeatMusic;

    audio.play().catch(() => {});
}

function toggleMusic() {
    player.musicEnabled = !player.musicEnabled;

    applyMusicSettings();
    savePlayer();

    if (player.musicEnabled) {
        playBackgroundMusic();
    } else {
        backgroundMusic.pause();
        victoryMusic.pause();
        defeatMusic.pause();
    }
}

function updateVolume() {
    player.volume = Number(
        document.getElementById("volumeSlider").value
    );

    applyMusicSettings();
    savePlayer();
}

function openSettings() {
    applyMusicSettings();
    showScreen("settingsScreen");
}

// MODE SELECTION

function selectMode(mode) {
    selectedMode = mode;

    document.getElementById("modeLabel").textContent =
        mode === "rank" ? "🏆 RANK GAME" : "🎮 CLASSIC GAME";

    showScreen("categoryMenu");
}

// SHOP

function openShop() {
    updatePlayerDisplay();
    document.getElementById("shopMessage").textContent = "";
    showScreen("shopScreen");
}

function buyHints() {
    const message = document.getElementById("shopMessage");

    if (player.diamonds < 20 ) {
        message.textContent = "Not enough diamonds! You need 25.";
        return;
    }

    player.diamonds -= 25;
    player.hints += 5;

    savePlayer();
    updatePlayerDisplay();

    message.textContent = "SUCCESS! You received 5 hints.";
}

// HOURLY DIAMONDS

function claimDiamonds() {
    // WIN REWARD
function giveWinDiamonds() {
    const reward = 50;

    player.diamonds += reward;

    savePlayer();
    updatePlayerDisplay();

    const message = document.getElementById("claimMessage");
    message.textContent = `You won! +${reward} Diamonds! 💎`;
}
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const message = document.getElementById("claimMessage");

    if (now - player.lastDiamondClaim < oneHour) {
        const remaining = oneHour - (now - player.lastDiamondClaim);

        message.textContent =
            `Next diamond available in ${Math.ceil(remaining / 6000000)} minute(s).`;

        return;
    }

    player.diamonds += 50;
    player.lastDiamondClaim = now;

    savePlayer();
    updatePlayerDisplay();

    message.textContent = "Congratulations! You claimed 50 Diamonds!";
}

// CATEGORY

function selectCategory(category) {
    selectedCategory = category;

    const names = {
        president: "PRESIDENTS",
        animals: "ANIMALS",
        flags: "FLAGS"
    };

    document.getElementById("selectedCategory").textContent =
        "SELECTED: " + names[category];

    showScreen("difficultyMenu");
}

// SHUFFLE ARRAY

function shuffleArray(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// CANCEL TIMERS

function clearGameTimers() {
    clearInterval(timerInterval);
    clearInterval(countdownInterval);
    clearTimeout(mismatchTimeout);
    clearTimeout(hintTimeout);

    shuffleTimeouts.forEach(clearTimeout);
    shuffleTimeouts = [];
}

// START GAME

function startGame(difficulty) {
    const collection = imageCollections[selectedCategory];
    const settings = difficulties[difficulty];

    if (!collection || collection.length < settings.cards / 2) {
        alert("Not enough pictures in this category.");
        return;
    }

    cancelGame();

    currentDifficulty = difficulty;
    matchedPairs = 0;
    totalPairs = settings.cards / 2;
    timeLeft = settings.time;

    selectedCards = [];
    lockBoard = true;
    gameActive = false;
    shuffleComplete = false;

    const chosenImages = shuffleArray(collection).slice(0, totalPairs);

    const deck = [
        ...chosenImages.map((image, index) => ({
            id: index,
            image,
            matched: false
        })),
        ...chosenImages.map((image, index) => ({
            id: index,
            image,
            matched: false
        }))
    ];

    // RANDOMIZED ONCE BEFORE GAME
    cards = shuffleArray(deck);

    document.getElementById("gameMode").textContent =
        selectedMode === "rank" ? "🏆 RANK GAME" : "🎮 CLASSIC GAME";

    document.getElementById("gameCategory").textContent =
        selectedCategory.toUpperCase();

    document.getElementById("gameDifficulty").textContent =
        difficulty.toUpperCase();

    document.getElementById("timer").textContent = settings.time;
    document.getElementById("matches").textContent = "0";
    document.getElementById("totalPairs").textContent = totalPairs;
    document.getElementById("gameStatus").textContent =
        "Get ready! Cards are shuffling...";

    document.getElementById("useHintBtn").disabled = false;

    updatePlayerDisplay();
    showScreen("gameScreen");

    renderCards();
    startCountdown();
}

// RENDER CARDS

function renderCards() {
    const board = document.getElementById("gameBoard");
    board.innerHTML = "";

    cards.forEach((card, index) => {
        const button = document.createElement("button");

        button.className = "card";
        button.dataset.index = index;

        if (card.matched) {
            button.classList.add("matched");
            button.disabled = true;
            showCardImage(button, card);
        } else {
            button.textContent = "?";

            button.addEventListener("click", () => {
                flipCard(index);
            });
        }

        board.appendChild(button);
    });
}

function showCardImage(button, card) {
    button.innerHTML = "";

    const image = document.createElement("img");

    image.src = card.image;
    image.alt = "Matching picture";
    image.draggable = false;

    image.onerror = function() {
        button.textContent = "⚠";
        console.error("Missing image:", card.image);
    };

    button.appendChild(image);
}

function revealCard(index) {
    const button = document.querySelector(
        `.card[data-index="${index}"]`
    );

    if (button) {
        showCardImage(button, cards[index]);
    }
}

function hideCard(index) {
    const button = document.querySelector(
        `.card[data-index="${index}"]`
    );

    if (button && !cards[index].matched) {
        button.innerHTML = "?";
    }
}

// COUNTDOWN + VISUAL SHUFFLE

function startCountdown() {
    let countdown = 3;
    const token = gameToken;

    document.getElementById("gameStatus").textContent =
        "GET READY!";

    document.getElementById("timer").textContent = countdown;

    countdownInterval = setInterval(() => {
        if (token !== gameToken) return;

        countdown--;

        if (countdown > 0) {
            document.getElementById("timer").textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            document.getElementById("gameStatus").textContent =
                "SHUFFLING CARDS...";
            animateCardShuffle(token);
        }
    }, 1000);
}

function animateCardShuffle(token) {
    const cardElements = [...document.querySelectorAll(".card")];

    const board = document.getElementById("gameBoard");
    const boardRect = board.getBoundingClientRect();

    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;

    // GATHER ALL CARDS AT CENTER

    cardElements.forEach(card => {
        const rect = card.getBoundingClientRect();

        const x = centerX - (rect.left - boardRect.left) - rect.width / 2;
        const y = centerY - (rect.top - boardRect.top) - rect.height / 2;

        card.style.setProperty("--move-x", x + "px");
        card.style.setProperty("--move-y", y + "px");
        card.style.setProperty(
            "--rotate",
            (Math.random() * 50 - 25) + "deg"
        );

        card.classList.add("shuffling");
    });

    requestAnimationFrame(() => {
        cardElements.forEach(card => card.classList.add("gathered"));
    });

    // SHUFFLE IN THE CENTER

    const scatterTimer = setTimeout(() => {
        if (token !== gameToken) return;

        cardElements.forEach(card => {
            card.classList.remove("gathered");
            card.classList.add("scattered");

            card.style.setProperty(
                "--scatter-x",
                (Math.random() * 45 - 22) + "px"
            );

            card.style.setProperty(
                "--scatter-y",
                (Math.random() * 45 - 22) + "px"
            );

            card.style.setProperty(
                "--scatter-rotate",
                (Math.random() * 100 - 50) + "deg"
            );
        });
    }, 650);

    // RETURN TO GRID AND START GAME

    const returnTimer = setTimeout(() => {
        if (token !== gameToken) return;

        cardElements.forEach(card => {
            card.classList.remove("gathered", "scattered");
            card.classList.add("returning");
        });

    }, 1450);

    const startTimer = setTimeout(() => {
        if (token !== gameToken) return;

        cardElements.forEach(card => {
            card.classList.remove(
                "shuffling",
                "returning",
                "gathered",
                "scattered"
            );

            card.style.removeProperty("--move-x");
            card.style.removeProperty("--move-y");
            card.style.removeProperty("--rotate");
            card.style.removeProperty("--scatter-x");
            card.style.removeProperty("--scatter-y");
            card.style.removeProperty("--scatter-rotate");
        });

        shuffleComplete = true;
        document.getElementById("gameStatus").textContent =
            "Find two identical pictures!";

        beginTimer();

    }, 2150);

    shuffleTimeouts.push(scatterTimer, returnTimer, startTimer);
}

// FLIP CARD

function flipCard(index) {
    if (!gameActive || lockBoard || !shuffleComplete) return;

    const card = cards[index];

    if (!card || card.matched) return;

    if (selectedCards.some(item => item.index === index)) return;

    playFlipSound();
    revealCard(index);

    selectedCards.push({
        index,
        id: card.id
    });

    if (selectedCards.length === 2) {
        lockBoard = true;
        checkMatch();
    }
}

// MATCH CHECK - NO RESHUFFLING

function checkMatch() {
    const first = selectedCards[0];
    const second = selectedCards[1];

    if (first.id === second.id) {
        // CORRECT MATCH

        cards[first.index].matched = true;
        cards[second.index].matched = true;

        const firstButton = document.querySelector(
            `.card[data-index="${first.index}"]`
        );

        const secondButton = document.querySelector(
            `.card[data-index="${second.index}"]`
        );

        firstButton.classList.add("matched");
        secondButton.classList.add("matched");

        firstButton.disabled = true;
        secondButton.disabled = true;

        matchedPairs++;

        document.getElementById("matches").textContent = matchedPairs;

        selectedCards = [];
        lockBoard = false;

        if (matchedPairs === totalPairs) {
            finishGame(true);
        }

    } else {
        // WRONG MATCH
        // FLIP BACK ONLY. POSITIONS NEVER CHANGE.

        const firstIndex = first.index;
        const secondIndex = second.index;

        mismatchTimeout = setTimeout(() => {
            if (!gameActive) return;

            hideCard(firstIndex);
            hideCard(secondIndex);

            selectedCards = [];
            lockBoard = false;

        }, 1000);
    }
}

// HINT SYSTEM

function useHint() {
    if (!gameActive || lockBoard) return;

    if (player.hints <= 0) {
        alert("No hints available! Visit the Shop.");
        return;
    }

    if (selectedCards.length > 0) {
        alert("Finish your current card selection first.");
        return;
    }

    clearTimeout(hintTimeout);

    const unmatched = [];

    cards.forEach((card, index) => {
        if (!card.matched) unmatched.push({card, index});
    });

    const pair = unmatched.find((item, index) =>
        unmatched.some((other, otherIndex) =>
            otherIndex > index && other.card.id === item.card.id
        )
    );

    if (!pair) return;

    const second = unmatched.find(item =>
        item.index !== pair.index &&
        item.card.id === pair.card.id
    );

    if (!second) return;

    player.hints--;

    savePlayer();
    updatePlayerDisplay();

    revealCard(pair.index);
    revealCard(second.index);

    const button = document.getElementById("useHintBtn");
    button.disabled = true;

    hintTimeout = setTimeout(() => {
        if (gameActive) {
            hideCard(pair.index);
            hideCard(second.index);
        }

        button.disabled = false;
    }, 1200);
}

// GAME TIMER

function beginTimer() {
    if (!document.getElementById("gameScreen").classList.contains("active")) {
        return;
    }

    gameActive = true;
    lockBoard = false;

    timeLeft = difficulties[currentDifficulty].time;

    document.getElementById("timer").textContent = timeLeft;

    timerInterval = setInterval(() => {
        if (!gameActive) return;

        timeLeft--;

        document.getElementById("timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            finishGame(false);
        }
    }, 1000);
}

// RESULTS

function finishGame(won) {
    if (!gameActive) return;

    gameActive = false;
    lockBoard = true;

    clearGameTimers();

    selectedCards = [];

    document.getElementById("useHintBtn").disabled = false;

    const settings = difficulties[currentDifficulty];

    const oldRank = getRank();
    let pointsChange = 0;
    let coinsEarned = 0;

    if (won) {
        coinsEarned = settings.coins;
        player.coins += coinsEarned;

        if (selectedMode === "rank") {
            pointsChange = settings.winPoints;

            player.rankPoints = Math.min(
                MAX_RANK_POINTS,
                player.rankPoints + pointsChange
            );
        }

        document.getElementById("resultIcon").textContent = "🏆";
        document.getElementById("resultTitle").textContent =
            "MAGALING KA KUPAL";

        document.getElementById("resultMessage").textContent =
            "YOU WIN! ALL PAIRS MATCHED!";

        const rewards = [
            `<div class="reward-item">+${coinsEarned} 🪙<small>GOLD COINS</small></div>`
        ];

        rewards.unshift(
            selectedMode === "rank"
                ? `<div class="reward-item">+${pointsChange} ⭐<small>RANK POINTS</small></div>`
                : `<div class="reward-item">CLASSIC<small>NO RANK CHANGE</small></div>`
        );

        document.getElementById("resultRewards").innerHTML =
            rewards.join("");

        playResultMusic("win");

    } else {
        if (selectedMode === "rank") {
            pointsChange = -settings.losePoints;

            player.rankPoints = Math.max(
                0,
                player.rankPoints + pointsChange
            );
        }

        document.getElementById("resultIcon").textContent = "⏰";
        document.getElementById("resultTitle").textContent = "MAHINA KA BOY!";
        document.getElementById("resultMessage").textContent =
            "TIME'S UP! BETTER LUCK NEXT TIME!";

        const rewards = [
            selectedMode === "rank"
                ? `<div class="reward-item">${pointsChange} ⭐<small>RANK POINTS</small></div>`
                : `<div class="reward-item">CLASSIC<small>NO RANK CHANGE</small></div>`,
            `<div class="reward-item">0 🪙<small>GOLD COINS</small></div>`
        ];

        document.getElementById("resultRewards").innerHTML =
            rewards.join("");

        playResultMusic("lose");
    }

    const newRank = getRank();

    if (selectedMode === "rank" && oldRank !== newRank) {
        document.getElementById("nextRankMessage").textContent =
            won
                ? `PROMOTED TO ${newRank.toUpperCase()}!`
                : `RANK CHANGED TO ${newRank.toUpperCase()}!`;
    }

    savePlayer();
    updatePlayerDisplay();
    updateRankResult();

    showScreen("resultScreen");
}

// QUIT / CANCEL

function cancelGame() {
    gameToken++;

    gameActive = false;
    lockBoard = true;
    shuffleComplete = false;

    clearGameTimers();

    timerInterval = null;
    countdownInterval = null;
    mismatchTimeout = null;
    hintTimeout = null;

    selectedCards = [];
}

function quitGame() {
    if (confirm("Are you sure you want to quit? No rank rewards will be given.")) {
        cancelGame();
        playBackgroundMusic();
        showScreen("mainMenu");
    }
}

// RETURN NAVIGATION

function showCategories() {
    cancelGame();
    playBackgroundMusic();
    showScreen("categoryMenu");
}

function goMainMenu() {
    cancelGame();
    playBackgroundMusic();
    showScreen("mainMenu");
}

// INITIALIZE

document.getElementById("enterGameBtn").addEventListener(
    "click",
    enterGame
);

document.getElementById("volumeSlider").addEventListener(
    "input",
    updateVolume
);

applyMusicSettings();
updatePlayerDisplay();
// PLAYER NAME SYSTEM

const startButton = document.querySelector('#startBtn');
const playerNameScreen = document.querySelector('#playerNameScreen');
const playerNameInput = document.querySelector('#playerName');
const continueButton = document.querySelector('#continueBtn');

let playerName = "";

// When START TO PLAY is clicked
startButton.addEventListener('click', function() {

    playerNameScreen.style.display = 'flex';

});

// When CONTINUE is clicked
continueButton.addEventListener('click', function() {

    const name = playerNameInput.value.trim();

    if (name === "") {
        alert("Please enter your name first!");
        return;
    }

    playerName = name;

    alert("Welcome to the game, " + playerName + "!");

    playerNameScreen.style.display = 'none';

    // Start your actual memory game here
    startGame();

});