const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 700;

// --- GAME STATE ---
let gameState = "menu"; // menu | playing | gameover | customize | tutorial
let tutorialActive = false;
let tutorialShown = JSON.parse(localStorage.getItem("tutorialShown") || "false");

// --- PLAYER ---
let player = { x: 400, y: 300, size: 50, tulipIndex: 0 };

// --- COINS & SCORE ---
let coins = parseInt(localStorage.getItem("coins") || "0");
let highscore = parseInt(localStorage.getItem("tulipHighscore") || "0");
let purchasedTulips = JSON.parse(localStorage.getItem("purchasedTulips") || '["classic_purple"]');
let coinsArray = [];
let score = 0;
let timeLeft = 60;
let timerInterval;

// --- TULIP SKINS ---
const tulipSkins = [
    { style: "classic", color: "purple", cost: 0, name: "Classic Purple" },
    { style: "classic", color: "red", cost: 5, name: "Classic Red" },
    { style: "detailed", color: "golden", cost: 50, name: "Golden Tulip" },
    { style: "detailed", color: "pink", cost: 80, name: "Pink Beauty" }
];

// --- BUTTONS ---
const buttons = {
    startGame: { x: 300, y: 200, w: 200, h: 70 },
    customize: { x: 300, y: 300, w: 200, h: 70 },
    invest: { x: 300, y: 400, w: 200, h: 70 },
    back: { x: 10, y: 10, w: 120, h: 50 },
    leftArrow: { x: 200, y: 300, w: 50, h: 50 },
    rightArrow: { x: 550, y: 300, w: 50, h: 50 },
    buy: { x: 330, y: 460, w: 140, h: 50 },
    ok: { x: 325, y: 320, w: 150, h: 60 }
};

let hoverButton = null;
let clickButton = null;

// --- SPAWN COINS ---
function spawnCoin() {
    coinsArray.push({
        x: Math.floor(Math.random() * (canvas.width - 16)),
        y: Math.floor(Math.random() * (canvas.height - 16)),
        size: 16
    });
}

// --- INITIAL COINS ---
for (let i = 0; i < 10; i++) spawnCoin();

// --- START GAME ---
function startGame() {
    score = 0;
    timeLeft = 60;
    player.x = 400;
    player.y = 300;
    coinsArray = [];
    for (let i = 0; i < 10; i++) spawnCoin();

    if (!tutorialShown) {
        tutorialActive = true;
        gameState = "tutorial";
    } else {
        gameState = "playing";
        startTimer();
    }
}

// --- TIMER ---
function startTimer() {
    gameState = "playing";
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

// --- END GAME ---
function endGame() {
    clearInterval(timerInterval);
    gameState = "gameover";
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("tulipHighscore", highscore);
    }
    localStorage.setItem("coins", coins);
}

// --- CONTROLS (WASD) ---
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- MOUSE EVENTS ---
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hoverButton = null;

    function hover(btn) {
        return mx > btn.x && mx < btn.x + btn.w && my > btn.y && my < btn.y + btn.h;
    }

    if (tutorialActive) {
        if (hover(buttons.ok)) hoverButton = "ok";
        return;
    }

    if (gameState === "menu") {
        if (hover(buttons.startGame)) hoverButton = "startGame";
        else if (hover(buttons.customize)) hoverButton = "customize";
        else if (hover(buttons.invest)) hoverButton = "invest";
    } else if (gameState === "customize") {
        if (hover(buttons.back)) hoverButton = "back";
        else if (hover(buttons.leftArrow)) hoverButton = "leftArrow";
        else if (hover(buttons.rightArrow)) hoverButton = "rightArrow";
        else if (hover(buttons.buy)) hoverButton = "buy";
    } else if (gameState === "gameover") {
        if (hover(buttons.back)) hoverButton = "back";
        else if (hover(buttons.invest)) hoverButton = "invest";
    }
});

canvas.addEventListener("mousedown", () => clickButton = hoverButton);
canvas.addEventListener("mouseup", () => {
    if (tutorialActive) {
        if (clickButton === "ok" && hoverButton === "ok") {
            tutorialActive = false;
            tutorialShown = true;
            localStorage.setItem("tutorialShown", true);
            startTimer();
        }
        clickButton = null;
        return;
    }

    if (gameState === "menu") {
        if (clickButton === "startGame" && hoverButton === "startGame") startGame();
        if (clickButton === "customize" && hoverButton === "customize") gameState = "customize";
        if (clickButton === "invest" && hoverButton === "invest") {
            window.open("https://opensea.io/collection/brilliant-tulips", "_blank");
        }
    } else if (gameState === "customize") {
        const tulip = tulipSkins[player.tulipIndex];
        const key = tulip.style + "_" + tulip.color;

        if (clickButton === "back" && hoverButton === "back") gameState = "menu";
        if (clickButton === "leftArrow" && hoverButton === "leftArrow") player.tulipIndex = (player.tulipIndex - 1 + tulipSkins.length) % tulipSkins.length;
        if (clickButton === "rightArrow" && hoverButton === "rightArrow") player.tulipIndex = (player.tulipIndex + 1) % tulipSkins.length;
        if (clickButton === "buy" && hoverButton === "buy") {
            if (purchasedTulips.includes(key)) {
                player.tulipIndex = tulipSkins.findIndex(s => s.style + "_" + s.color === key);
            } else if (coins >= tulip.cost) {
                coins -= tulip.cost;
                purchasedTulips.push(key);
                localStorage.setItem("coins", coins);
                localStorage.setItem("purchasedTulips", JSON.stringify(purchasedTulips));
            }
        }
    } else if (gameState === "gameover") {
        if (clickButton === "back" && hoverButton === "back") gameState = "menu";
        if (clickButton === "invest" && hoverButton === "invest") {
            window.open("https://opensea.io/collection/brilliant-tulips", "_blank");
        }
    }
    clickButton = null;
});

// --- SPAWN & DRAW TULIP ---
function drawTulip(x, y, size, color, style) {
    const px = 6;
    ctx.fillStyle = "green";
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 * px, y + (i + 3) * px, px, px);

    ctx.fillStyle = color;
    const pattern = style === "classic"
        ? [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0]]
        : [[0,1,0,1,0],[1,1,2,1,1],[1,2,1,2,1],[0,1,1,1,0]];

    for (let r = 0; r < pattern.length; r++)
        for (let c = 0; c < pattern[r].length; c++)
            if (pattern[r][c] === 1 || pattern[r][c] === 2) ctx.fillRect(x + c * px, y + r * px, px, px);
}

function drawCoin(c) {
    ctx.fillStyle = "gold";
    ctx.fillRect(c.x, c.y, c.size, c.size);
    ctx.fillStyle = "orange";
    ctx.fillRect(c.x + 4, c.y + 4, c.size / 2, c.size / 2);
}

// --- UPDATE ---
function update() {
    if (gameState !== "playing") return;
    const speed = 6;
    if (keys["w"]) player.y -= speed;
    if (keys["s"]) player.y += speed;
    if (keys["a"]) player.x -= speed;
    if (keys["d"]) player.x += speed;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    for (let i = coinsArray.length - 1; i >= 0; i--) {
        const c = coinsArray[i];
        if (player.x < c.x + c.size && player.x + player.size > c.x &&
            player.y < c.y + c.size && player.y + player.size > c.y) {
            coinsArray.splice(i, 1);
            coins++;
            score++;
            localStorage.setItem("coins", coins);
            spawnCoin();
        }
    }
}

// --- DRAW ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (tutorialActive) drawTutorial();
    else if (gameState === "menu") drawMenu();
    else if (gameState === "playing") drawGame();
    else if (gameState === "customize") drawCustomize();
    else if (gameState === "gameover") drawGameOver();
}

// --- LOOP ---
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

// --- DRAW FUNCTIONS ---
function drawMenu() {
    ctx.fillStyle = "#f0f8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2e8b57";
    ctx.font = "60px Comic Sans MS";
    ctx.fillText("Tulip Collector NFT", 120, 100);

    ctx.fillStyle = hoverButton === "startGame" ? "#ffbf00" : "#ffa500";
    ctx.fillRect(buttons.startGame.x, buttons.startGame.y, buttons.startGame.w, buttons.startGame.h);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("START", buttons.startGame.x + 55, buttons.startGame.y + 45);

    ctx.fillStyle = hoverButton === "customize" ? "#7cfc00" : "#32cd32";
    ctx.fillRect(buttons.customize.x, buttons.customize.y, buttons.customize.w, buttons.customize.h);
    ctx.fillStyle = "white";
    ctx.fillText("CUSTOMIZE", buttons.customize.x + 15, buttons.customize.y + 45);

    ctx.fillStyle = hoverButton === "invest" ? "#3399ff" : "#007acc";
    ctx.fillRect(buttons.invest.x, buttons.invest.y, buttons.invest.w, buttons.invest.h);
    ctx.fillStyle = "white";
    ctx.fillText("Invest", buttons.invest.x + 50, buttons.invest.y + 45);

    ctx.fillStyle = "#333";
    ctx.font = "25px Arial";
    ctx.fillText("Highscore: " + highscore, 300, 580);
    ctx.fillText("Coins: " + coins, 300, 610);
}

function drawGame() {
    ctx.fillStyle = "#e6f2ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    coinsArray.forEach(c => drawCoin(c));

    const tulip = tulipSkins[player.tulipIndex];
    drawTulip(player.x, player.y, player.size, tulip.color, tulip.style);

    ctx.fillStyle = "#000";
    ctx.font = "25px Arial";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Coins: " + coins, 10, 60);
    ctx.fillText("Time: " + timeLeft, 10, 90);
}

function drawCustomize() {
    ctx.fillStyle = "#fce4ec";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tulip = tulipSkins[player.tulipIndex];
    drawTulip(350, 200, 100, tulip.color, tulip.style);

    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText(tulip.name, 300, 350);
    ctx.fillText("Price: " + tulip.cost + " coins", 300, 390);

    ctx.fillStyle = purchasedTulips.includes(tulip.style + "_" + tulip.color) ? "green" : "red";
    ctx.fillText(purchasedTulips.includes(tulip.style + "_" + tulip.color) ? "OWNED" : "NOT OWNED", 330, 430);

    drawButton(buttons.leftArrow, "<");
    drawButton(buttons.rightArrow, ">");
    const btnText = purchasedTulips.includes(tulip.style + "_" + tulip.color) ? "USE" : "BUY";
    drawButton(buttons.buy, btnText);
    drawButton(buttons.back, "BACK");
}

function drawGameOver() {
    ctx.fillStyle = "#fff3e0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "50px Arial";
    ctx.fillText("Game Over", 280, 200);
    ctx.font = "30px Arial";
    ctx.fillText("Score: " + score, 340, 280);
    ctx.fillText("Highscore: " + highscore, 320, 320);
    ctx.fillText("Coins: " + coins, 330, 360);

    drawButton(buttons.back, "BACK");
    drawButton(buttons.invest, "Invest");
}

function drawTutorial() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "#fff";
    ctx.fillRect(200, 150, 400, 300);

    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Use WASD to move your tulip!", 220, 250);

    drawButton(buttons.ok, "OK");
}

function drawButton(btn, text) {
    ctx.fillStyle = hoverButton === text.toLowerCase() ? "#3399ff" : "#007acc";
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = "#fff";
    ctx.font = "25px Arial";
    ctx.fillText(text, btn.x + btn.w/4, btn.y + btn.h/1.7);
}


