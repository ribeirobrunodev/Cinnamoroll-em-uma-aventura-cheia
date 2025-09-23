// Elementos do DOM
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const muteButton = document.getElementById('muteButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const backgroundMusic = document.getElementById('backgroundMusic');

// Variáveis do jogo
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let gameSpeed = 2;
let isMuted = false;
let isInvincible = false;
let invincibilityTimer = 0;
const invincibilityDuration = 300; // 5 segundos a 60fps

// Power-ups
let powerUps = [];
const powerUpSize = 30;
const powerUpSpawnRate = 0.01; // 1% de chance por frame para spawnar um power-up

// Configurações do Cinnamoroll
const player = {
    x: 100,
    y: 200,
    width: 70,
    height: 50,
    velocity: 0,
    gravity: 0.3,
    jumpPower: -5,
    image: new Image(),
    isLoaded: false
};
player.image.src = 'cinnamoroll.gif';
player.image.onload = () => {
    player.isLoaded = true;
};

// Array de obstáculos
let obstacles = [];
const obstacleWidth = 60;
const obstacleGap = 220;
const obstacleSpeed = 2;

// Partículas para efeitos visuais
let particles = [];

// Nuvens de fundo
let clouds = [];

// Inicialização
function init() {
    canvas.width = 800;
    canvas.height = 400;
    
    // Criar nuvens iniciais
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100 + 50,
            size: Math.random() * 30 + 20,
            speed: Math.random() * 0.5 + 0.2
        });
    }
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    muteButton.addEventListener('click', toggleMute);
    
    // Controles do jogo
    document.addEventListener('keydown', handleInput);
    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput);
    
    // Prevenir scroll em dispositivos móveis
    document.addEventListener('touchstart', e => e.preventDefault());
    document.addEventListener('touchend', e => e.preventDefault());
    document.addEventListener('touchmove', e => e.preventDefault());
}

function startGame() {
    gameState = 'playing';
    score = 0;
    gameSpeed = 2;
    player.y = 200;
    player.velocity = 0;
    obstacles = [];
    particles = [];
    powerUps = [];
    isInvincible = false;
    invincibilityTimer = 0;
    
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    if (!isMuted) {
        backgroundMusic.play().catch(e => console.log('Erro ao reproduzir música:', e));
    }
    
    gameLoop();
}

function restartGame() {
    startGame();
}

function toggleMute() {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? '🔇' : '🔊';
    
    if (isMuted) {
        backgroundMusic.pause();
    } else if (gameState === 'playing') {
        backgroundMusic.play().catch(e => console.log('Erro ao reproduzir música:', e));
    }
}

function handleInput(e) {
    if (gameState === 'playing') {
        if (e.type === 'keydown' && e.code === 'Space') {
            e.preventDefault();
        }
        
        if (e.type === 'keydown' && e.code === 'Space' || 
            e.type === 'click' || 
            e.type === 'touchstart') {
            
            player.velocity = player.jumpPower;
            
            // Adicionar partículas de voo
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: Math.random() * 4 - 2,
                    vy: Math.random() * 4 - 2,
                    life: 30,
                    color: `hsl(${Math.random() * 60 + 300}, 70%, 80%)`
                });
            }
        }
    }
}

function updatePlayer() {
    player.velocity += player.gravity;
    player.y += player.velocity;
    
    // Limites da tela
    if (player.y < 0) {
        player.y = 0;
        player.velocity = 0;
    }
    
    if (player.y + player.height > canvas.height) {
        gameOver();
    }
}

function updateObstacles() {
    // Adicionar novos obstáculos
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        const gapY = Math.random() * (canvas.height - obstacleGap - 100) + 50;
        
        obstacles.push({
            x: canvas.width,
            topHeight: gapY,
            bottomY: gapY + obstacleGap,
            bottomHeight: canvas.height - (gapY + obstacleGap),
            passed: false
        });
    }
    
    // Atualizar posição dos obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        
        // Verificar pontuação
        if (!obstacles[i].passed && obstacles[i].x + obstacleWidth < player.x) {
            obstacles[i].passed = true;
            score++;
            scoreElement.textContent = `Pontuação: ${score}`;
            
            // Aumentar velocidade gradualmente
            if (score % 5 === 0) {
                gameSpeed += 0.2;
            }
            
            // Efeito de pontuação
            for (let j = 0; j < 10; j++) {
                particles.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: Math.random() * 6 - 3,
                    vy: Math.random() * 6 - 3,
                    life: 40,
                    color: '#FFD700'
                });
            }
        }
        
        // Remover obstáculos que saíram da tela
        if (obstacles[i].x + obstacleWidth < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (isInvincible) return;
    for (let obstacle of obstacles) {
        // Colisão com obstáculo superior
        if (player.x < obstacle.x + obstacleWidth &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.topHeight) {
            gameOver();
            return;
        }
        
        // Colisão com obstáculo inferior
        if (player.x < obstacle.x + obstacleWidth &&
            player.x + player.width > obstacle.x &&
            player.y + player.height > obstacle.bottomY) {
            gameOver();
            return;
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    // Mover e remover power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= obstacleSpeed;

        // Colisão com power-up
        if (player.x < powerUps[i].x + powerUpSize &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUpSize &&
            player.y + player.height > powerUps[i].y) {
            
            activateInvincibility();
            powerUps.splice(i, 1);
            continue;
        }

        if (powerUps[i].x + powerUpSize < 0) {
            powerUps.splice(i, 1);
        }
    }

    // Spawnar novos power-ups
    if (Math.random() < powerUpSpawnRate) {
        const lastObstacleX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : canvas.width;
        const spawnX = Math.max(canvas.width + 50, lastObstacleX + 200); // Spawnar depois do último obstáculo
        const spawnY = Math.random() * (canvas.height - powerUpSize - 100) + 50;
        powerUps.push({
            x: spawnX,
            y: spawnY,
            type: 'invincibility' // Apenas um tipo por enquanto
        });
    }
}

function activateInvincibility() {
    isInvincible = true;
    invincibilityTimer = invincibilityDuration;
    // Adicionar um efeito visual ao Cinnamoroll quando invencível (ex: mudar cor, brilho)
    player.color = '#FFD700'; // Dourado
    player.ears = '#FFC0CB'; // Rosa claro
    
    setTimeout(() => {
        isInvincible = false;
        player.color = '#FFFFFF'; // Voltar à cor original
        player.ears = '#E6E6FA'; // Voltar à cor original
    }, invincibilityDuration * (1000/60)); // Converter frames para milissegundos
}

function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * 100 + 50;
        }
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let cloud of clouds) {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer() {
    ctx.save();

    if (isInvincible && Math.floor(invincibilityTimer / 10) % 2 === 0) {
        ctx.globalAlpha = 0.5; // Efeito de piscar
    }
    
    if (player.isLoaded) {
        // Rotação baseada na velocidade
        const rotation = player.velocity * 0.05;
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(rotation);
        ctx.drawImage(player.image, -player.width / 2, -player.height / 2, player.width, player.height);
    }
    
    ctx.restore();
}

function drawObstacles() {
    ctx.fillStyle = '#FFB6C1';
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 3;
    
    for (let obstacle of obstacles) {
        // Obstáculo superior
        ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        ctx.strokeRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        
        // Obstáculo inferior
        ctx.fillRect(obstacle.x, obstacle.bottomY, obstacleWidth, obstacle.bottomHeight);
        ctx.strokeRect(obstacle.x, obstacle.bottomY, obstacleWidth, obstacle.bottomHeight);
        
        // Decoração nos obstáculos
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacleWidth / 2, 20 + i * 30, 5, 0, Math.PI * 2);
            ctx.fill();
            
            if (obstacle.bottomHeight > 60) {
                ctx.beginPath();
                ctx.arc(obstacle.x + obstacleWidth / 2, obstacle.bottomY + 20 + i * 30, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#FFB6C1';
    }
}

function drawParticles() {
    for (let particle of particles) {
        const alpha = particle.life / 40;
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBackground() {
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 50 + Date.now() * 0.01) % canvas.width;
        const y = 30 + Math.sin(i + Date.now() * 0.001) * 20;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Date.now() * 0.002);
        
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
            const angle = (j * Math.PI * 2) / 5;
            const radius = j % 2 === 0 ? 4 : 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function drawPowerUps() {
    for (let powerUp of powerUps) {
        ctx.fillStyle = '#FFD700'; // Cor dourada para o power-up
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUpSize / 2, powerUp.y + powerUpSize / 2, powerUpSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Desenhar uma estrela no centro do power-up
        ctx.fillStyle = '#FFFFFF';
        drawStar(ctx, powerUp.x + powerUpSize / 2, powerUp.y + powerUpSize / 2, 5, powerUpSize * 0.3, powerUpSize * 0.15);
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.closePath();
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawClouds();
    drawObstacles();
    drawPlayer();
    drawPowerUps();
    drawParticles();
}

function gameLoop() {
    if (gameState === 'playing') {
        updatePlayer();
        updateObstacles();
        updateParticles();
        updateClouds();
        updatePowerUps();
        if (isInvincible) {
            invincibilityTimer--;
            if (invincibilityTimer <= 0) {
                isInvincible = false;
                player.color = '#FFFFFF'; // Voltar à cor original
                player.ears = '#E6E6FA'; // Voltar à cor original
            }
        }
        checkCollisions();
        render();
        
        requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameState = 'gameOver';
    backgroundMusic.pause();
    
    finalScoreElement.textContent = `Sua pontuação: ${score}`;
    
    // Mensagem de encorajamento baseada na pontuação
    let encouragement = "O Cinnamoroll está orgulhoso de você! ✨";
    if (score >= 20) {
        encouragement = "Incrível! Você é um piloto excepcional! 🌟";
    } else if (score >= 10) {
        encouragement = "Muito bem! O Cinnamoroll adorou voar com você! 💫";
    } else if (score >= 5) {
        encouragement = "Bom trabalho! Continue praticando! 🎈";
    }
    
    document.getElementById('encouragement').textContent = encouragement;
    
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Inicializar o jogo
init();

