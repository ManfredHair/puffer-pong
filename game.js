// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 20;
const BALL_SPEED = 5;
const PADDLE_SPEED = 8;

// Game variables
let score = 0;
let gameRunning = false;
let muted = false;

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');
const muteButton = document.getElementById('muteButton');

// Set canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Load game assets
const pufferfishImage = new Image();
pufferfishImage.src = 'assets/pufferfish.svg';

const paddleImage = new Image();
paddleImage.src = 'assets/coral.svg';

// Sounds
const sounds = {
    hit: () => {
        if (!muted && window.gameSounds) {
            window.gameSounds.createHitSound();
        }
    },
    score: () => {
        if (!muted && window.gameSounds) {
            window.gameSounds.createScoreSound();
        }
    },
    gameOver: () => {
        if (!muted && window.gameSounds) {
            window.gameSounds.createGameOverSound();
        }
    }
};

// Game objects
const paddle = {
    x: CANVAS_WIDTH - PADDLE_WIDTH - 20,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
    dy: 0
};

const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: BALL_SIZE,
    dx: -BALL_SPEED,
    dy: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    speed: BALL_SPEED
};

// Bubble particles
const bubbles = [];
const MAX_BUBBLES = 30;

// Create initial bubbles
for (let i = 0; i < MAX_BUBBLES; i++) {
    bubbles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: Math.random() * 5 + 2,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
    });
}

// Game functions
function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    
    // Rotate the pufferfish based on its direction
    const angle = Math.atan2(ball.dy, ball.dx);
    ctx.rotate(angle);
    
    // Draw the pufferfish image
    if (pufferfishImage.complete) {
        ctx.drawImage(
            pufferfishImage, 
            -ball.size, 
            -ball.size, 
            ball.size * 2, 
            ball.size * 2
        );
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#ffde59';
        ctx.beginPath();
        ctx.arc(0, 0, ball.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPaddle() {
    if (paddleImage.complete) {
        ctx.drawImage(
            paddleImage, 
            paddle.x, 
            paddle.y, 
            paddle.width, 
            paddle.height
        );
    } else {
        ctx.fillStyle = '#ff914d';
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
}

function drawBubbles() {
    bubbles.forEach(bubble => {
        ctx.globalAlpha = bubble.opacity;
        ctx.fillStyle = '#a8e0ff';
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function updateBubbles() {
    bubbles.forEach(bubble => {
        bubble.y -= bubble.speed;
        
        // Reset bubble when it goes off top
        if (bubble.y < -bubble.radius * 2) {
            bubble.y = CANVAS_HEIGHT + bubble.radius;
            bubble.x = Math.random() * CANVAS_WIDTH;
        }
    });
}

function movePaddle() {
    paddle.y += paddle.dy;
    
    // Keep paddle within canvas
    if (paddle.y < 0) {
        paddle.y = 0;
    } else if (paddle.y + paddle.height > CANVAS_HEIGHT) {
        paddle.y = CANVAS_HEIGHT - paddle.height;
    }
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision (top and bottom)
    if (ball.y < ball.size || ball.y > CANVAS_HEIGHT - ball.size) {
        ball.dy = -ball.dy;
        sounds.hit();
    }
    
    // Paddle collision
    if (
        ball.x + ball.size > paddle.x &&
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.y + ball.size > paddle.y &&
        ball.y - ball.size < paddle.y + paddle.height
    ) {
        // Calculate bounce angle based on where ball hits paddle
        const hitPosition = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        const bounceAngle = hitPosition * (Math.PI / 4);
        
        ball.dx = -ball.speed * Math.cos(bounceAngle);
        ball.dy = ball.speed * Math.sin(bounceAngle);
        
        // Increase ball speed slightly
        ball.speed += 0.2;
        
        // Add score
        score++;
        scoreElement.textContent = score;
        sounds.score();
    }
    
    // Left wall collision (game over)
    if (ball.x < ball.size) {
        ball.dx = -ball.dx;
        sounds.hit();
    }
    
    // Game over - right wall
    if (ball.x > CANVAS_WIDTH + ball.size) {
        gameOver();
    }
}

function gameOver() {
    gameRunning = false;
    sounds.gameOver();
    startButton.textContent = 'Play Again';
}

function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    
    // Reset ball
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = BALL_SPEED;
    ball.dx = -BALL_SPEED;
    ball.dy = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    
    // Reset paddle
    paddle.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    
    gameRunning = true;
}

function playSound(sound) {
    if (!muted) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log("Error playing sound:", err));
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw game elements
    drawBubbles();
    drawPaddle();
    drawBall();
}

function update() {
    if (gameRunning) {
        movePaddle();
        moveBall();
        updateBubbles();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
        paddle.dy = -paddle.speed;
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        paddle.dy = paddle.speed;
    }
});

document.addEventListener('keyup', e => {
    if (
        (e.key === 'ArrowUp' || e.key === 'w') && paddle.dy < 0 ||
        (e.key === 'ArrowDown' || e.key === 's') && paddle.dy > 0
    ) {
        paddle.dy = 0;
    }
});

// Mouse/touch controls
canvas.addEventListener('mousemove', e => {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - canvasRect.top;
    
    // Set paddle position to follow mouse
    paddle.y = mouseY - paddle.height / 2;
    
    // Keep paddle within canvas
    if (paddle.y < 0) {
        paddle.y = 0;
    } else if (paddle.y + paddle.height > CANVAS_HEIGHT) {
        paddle.y = CANVAS_HEIGHT - paddle.height;
    }
});

startButton.addEventListener('click', () => {
    if (!gameRunning) {
        resetGame();
        startButton.textContent = 'Restart';
    }
});

muteButton.addEventListener('click', () => {
    muted = !muted;
    muteButton.textContent = muted ? 'Unmute Sound' : 'Mute Sound';
});

// Start game loop
gameLoop(); 