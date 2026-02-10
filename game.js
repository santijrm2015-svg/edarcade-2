const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const resetBtn = document.getElementById('resetBtn');

let gameRunning = false;
let gamePaused = false;
let mouseX = 450;
let mouseY = 300;
let photosTaken = 0;
let stage = 0;
let angerLevel = 0;
let currentNews = null;
let newsTimer = 0;
let people = [];
let couples = [];
let events = [];
let lastEventTime = 0;
let animationId = null;

const MAX_COUPLES = 5;

// Mapa original del juego
const map = {
    tv: {
        x: 425,
        y: 275,
        width: 50,
        height: 50
    },
    buildings: [
        { x: 50, y: 50, width: 100, height: 80, color: '#8B4513' },
        { x: 750, y: 50, width: 100, height: 80, color: '#8B4513' },
        { x: 50, y: 470, width: 100, height: 80, color: '#8B4513' },
        { x: 750, y: 470, width: 100, height: 80, color: '#8B4513' },
        { x: 200, y: 100, width: 80, height: 100, color: '#A0522D' },
        { x: 620, y: 100, width: 80, height: 100, color: '#A0522D' },
        { x: 200, y: 400, width: 80, height: 100, color: '#A0522D' },
        { x: 620, y: 400, width: 80, height: 100, color: '#A0522D' }
    ]
};

class Character {
    constructor(x, y, shape) {
        this.x = x;
        this.y = y;
        this.shape = shape;
        this.color = shape === 'circle' ? '#4CAF50' : '#2196F3';
        this.size = 12;
        this.speed = 0.5 + Math.random() * 0.5;
        this.direction = Math.random() * Math.PI * 2;
        this.isAngry = false;
        this.isEmbarrassed = false;
        this.isInLove = false;
        this.hasHat = Math.random() < 0.2;
        this.hatType = Math.random() < 0.5 ? 'square' : 'triangle';
        this.partner = null;
        this.isLeaving = false;
        this.leaveTimer = 0;
        this.bouncePhase = Math.random() * Math.PI * 2;
    }
    
    update() {
        if (this.isLeaving) {
            this.leaveTimer--;
            if (this.leaveTimer <= 0) {
                return false;
            }
            this.x += (canvas.width / 2 - this.x) * 0.1;
            this.y += (canvas.height / 2 - this.y) * 0.1;
            this.size *= 0.95;
            return true;
        }
        
        this.bouncePhase += 0.05;
        
        if (this.partner && this.isInLove) {
            const dx = this.partner.x - this.x;
            const dy = this.partner.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 30) {
                this.x += (dx / distance) * this.speed * 2;
                this.y += (dy / distance) * this.speed * 2;
            } else {
                const circleAngle = Date.now() * 0.001;
                this.x += Math.cos(circleAngle + this.bouncePhase) * 0.5;
                this.y += Math.sin(circleAngle + this.bouncePhase) * 0.5;
            }
        } else {
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            
            if (Math.random() < 0.02) {
                this.direction += (Math.random() - 0.5) * 0.5;
            }
        }
        
        // Límites del mapa
        if (this.x < 20) { this.x = 20; this.direction = Math.PI - this.direction; }
        if (this.x > canvas.width - 20) { this.x = canvas.width - 20; this.direction = Math.PI - this.direction; }
        if (this.y < 20) { this.y = 20; this.direction = -this.direction; }
        if (this.y > canvas.height - 20) { this.y = canvas.height - 20; this.direction = -this.direction; }
        
        // Estados emocionales
        if (this.isEmbarrassed) {
            if (Math.random() < 0.02) {
                this.isEmbarrassed = false;
            }
        }
        
        if (this.isAngry) {
            if (Math.random() < 0.005) {
                this.isAngry = false;
            }
        }
        
        return true;
    }
    
    draw() {
        ctx.save();
        
        const bounce = Math.sin(this.bouncePhase) * 2;
        const drawY = this.y + bounce;
        
        // Cambiar color según estado
        let drawColor = this.color;
        if (this.isAngry) {
            drawColor = '#FF0000';
        } else if (this.isEmbarrassed) {
            drawColor = '#FFA500';
        } else if (this.isInLove) {
            drawColor = '#FF69B4';
        }
        
        // Dibujar personaje
        ctx.fillStyle = drawColor;
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillRect(this.x - this.size, drawY - this.size, this.size * 2, this.size * 2);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size, drawY - this.size, this.size * 2, this.size * 2);
        }
        
        // Ojos
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x - 4, drawY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 4, drawY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 4, drawY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 4, drawY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Boca
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.isAngry) {
            ctx.arc(this.x, drawY + 5, this.size * 0.4, 1.2 * Math.PI, 1.8 * Math.PI);
        } else if (this.isEmbarrassed) {
            ctx.moveTo(this.x - 3, drawY + 3);
            ctx.lineTo(this.x + 3, drawY + 3);
        } else if (this.isInLove) {
            ctx.arc(this.x, drawY + 1, this.size * 0.5, 0.1 * Math.PI, 0.9 * Math.PI);
        } else {
            ctx.arc(this.x, drawY + 2, this.size * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
        }
        ctx.stroke();
        
        // Sombrero
        if (this.hasHat) {
            const hatY = drawY - this.size - 4;
            ctx.fillStyle = '#8B4513';
            
            if (this.hatType === 'square') {
                ctx.fillRect(this.x - 6, hatY - 4, 12, 5);
                ctx.fillRect(this.x - 8, hatY + 1, 16, 3);
            } else {
                ctx.beginPath();
                ctx.moveTo(this.x, hatY - 6);
                ctx.lineTo(this.x - 6, hatY + 2);
                ctx.lineTo(this.x + 6, hatY + 2);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Corazón si está enamorado
        if (this.isInLove) {
            ctx.fillStyle = '#FF1493';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('❤', this.x - 6, drawY - this.size - 10);
        }
        
        ctx.restore();
    }
    
    leave() {
        this.isLeaving = true;
        this.leaveTimer = 60;
        if (this.partner) {
            this.partner.partner = null;
            this.partner = null;
        }
    }
}

function drawMap() {
    // Fondo gris
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calles (líneas blancas discontinuas)
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Calles horizontales
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(canvas.width, 180);
    ctx.moveTo(0, 360);
    ctx.lineTo(canvas.width, 360);
    ctx.stroke();
    
    // Calles verticales
    ctx.beginPath();
    ctx.moveTo(185, 0);
    ctx.lineTo(185, canvas.height);
    ctx.moveTo(385, 0);
    ctx.lineTo(385, canvas.height);
    ctx.moveTo(535, 0);
    ctx.lineTo(535, canvas.height);
    ctx.moveTo(705, 0);
    ctx.lineTo(705, canvas.height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Edificios
    for (let building of map.buildings) {
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(building.x + 5, building.y + 5, building.width, building.height);
        
        // Edificio
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Ventanas
        ctx.fillStyle = '#FFE082';
        const windowSize = 8;
        const windowGap = 15;
        for (let wx = building.x + 10; wx < building.x + building.width - 10; wx += windowGap) {
            for (let wy = building.y + 10; wy < building.y + building.height - 10; wy += windowGap) {
                if (Math.random() < 0.7) {
                    ctx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
        
        // Borde
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(building.x, building.y, building.width, building.height);
    }
    
    // Televisión en el centro
    drawTV();
}

function drawTV() {
    const tv = map.tv;
    
    // Base de la TV
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(tv.x - 10, tv.y - 10, tv.width + 20, tv.height + 30);
    
    // Soporte
    ctx.fillStyle = '#333';
    ctx.fillRect(tv.x + tv.width/2 - 3, tv.y + tv.height, 6, 10);
    
    // Pantalla
    ctx.fillStyle = '#000';
    ctx.fillRect(tv.x, tv.y, tv.width, tv.height);
    
    // Borde de la pantalla
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.strokeRect(tv.x, tv.y, tv.width, tv.height);
    
    // Contenido de la TV
    if (currentNews && currentNews.timer > 0) {
        // Fondo de noticia
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(tv.x + 2, tv.y + 2, tv.width - 4, tv.height - 4);
        
        // Miniatura del personaje
        const subject = currentNews.image;
        ctx.fillStyle = subject.color;
        if (subject.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(tv.x + tv.width/2, tv.y + 25, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(tv.x + tv.width/2 - 8, tv.y + 17, 16, 16);
        }
        
        // Barra de título
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(tv.x + 2, tv.y + tv.height - 20, tv.width - 4, 18);
        
        // Texto de la noticia
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentNews.title, tv.x + tv.width/2, tv.y + tv.height - 8);
        ctx.textAlign = 'left';
        
        // Indicador de transmisión
        ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
        ctx.fillRect(tv.x + 2, tv.y + 2, tv.width - 4, tv.height - 4);
        
    } else {
        // Pantalla apagada con "6"
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(tv.x + 2, tv.y + 2, tv.width - 4, tv.height - 4);
        
        // Número del canal
        const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('6', tv.x + tv.width/2, tv.y + tv.height/2 + 5);
        
        ctx.fillStyle = '#333';
        ctx.font = '6px Arial';
        ctx.fillText('CANAL 6', tv.x + tv.width/2, tv.y + tv.height/2 + 15);
        ctx.textAlign = 'left';
        
        // Efecto de estática
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            ctx.fillRect(
                tv.x + 2 + Math.random() * (tv.width - 4),
                tv.y + 2 + Math.random() * (tv.height - 4),
                1, 1
            );
        }
    }
    
    // Luz indicadora
    ctx.fillStyle = currentNews ? '#00FF00' : '#FF0000';
    ctx.beginPath();
    ctx.arc(tv.x + tv.width - 5, tv.y + tv.height - 5, 2, 0, Math.PI * 2);
    ctx.fill();
}

class RandomEvent {
    constructor(type, participants) {
        this.type = type;
        this.participants = participants;
        this.duration = 180;
        this.age = 0;
    }
    
    update() {
        this.age++;
        
        if (this.type === 'couple') {
            if (this.age === 1) {
                this.participants[0].isInLove = true;
                this.participants[1].isInLove = true;
                this.participants[0].partner = this.participants[1];
                this.participants[1].partner = this.participants[0];
            }
        } else if (this.type === 'argument') {
            if (this.age === 1) {
                this.participants[0].isAngry = true;
                this.participants[1].isAngry = true;
            }
        } else if (this.type === 'breakup') {
            if (this.age === 1) {
                this.participants[0].isInLove = false;
                this.participants[1].isInLove = false;
                this.participants[0].isAngry = true;
                this.participants[1].isAngry = true;
                this.participants[0].partner = null;
                this.participants[1].partner = null;
            }
        }
        
        return this.age < this.duration;
    }
}

function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    gameRunning = false;
    gamePaused = false;
    mouseX = 450;
    mouseY = 300;
    photosTaken = 0;
    stage = 0;
    angerLevel = 0;
    currentNews = null;
    newsTimer = 0;
    people = [];
    couples = [];
    events = [];
    lastEventTime = 0;
    
    updateStats();
    overlay.classList.remove('hidden');
}

function initGame() {
    // Crear personajes en las calles
    for (let i = 0; i < 25; i++) {
        const shape = Math.random() < 0.5 ? 'circle' : 'square';
        let x, y;
        
        // Posicionar en las calles
        const streetChoice = Math.random();
        if (streetChoice < 0.25) {
            // Calle horizontal superior
            x = Math.random() * canvas.width;
            y = 180;
        } else if (streetChoice < 0.5) {
            // Calle horizontal inferior
            x = Math.random() * canvas.width;
            y = 360;
        } else if (streetChoice < 0.75) {
            // Calles verticales
            const streets = [185, 385, 535, 705];
            x = streets[Math.floor(Math.random() * streets.length)];
            y = Math.random() * canvas.height;
        } else {
            // Intersecciones
            const intersections = [
                {x: 185, y: 180}, {x: 385, y: 180}, {x: 535, y: 180}, {x: 705, y: 180},
                {x: 185, y: 360}, {x: 385, y: 360}, {x: 535, y: 360}, {x: 705, y: 360}
            ];
            const intersection = intersections[Math.floor(Math.random() * intersections.length)];
            x = intersection.x + (Math.random() - 0.5) * 50;
            y = intersection.y + (Math.random() - 0.5) * 50;
        }
        
        people.push(new Character(x, y, shape));
    }
    
    // Dar sombreros a algunos personajes
    for (let i = 0; i < 4; i++) {
        const person = people[Math.floor(Math.random() * people.length)];
        person.hasHat = true;
    }
}

function generateRandomEvent() {
    const now = Date.now();
    if (now - lastEventTime < 3000) return;
    
    const availablePeople = people.filter(p => !p.partner && !p.isLeaving);
    if (availablePeople.length < 2) return;
    
    const eventType = Math.random();
    const person1 = availablePeople[Math.floor(Math.random() * availablePeople.length)];
    const person2 = availablePeople[Math.floor(Math.random() * availablePeople.length)];
    
    if (person1 === person2) return;
    
    if (eventType < 0.3 && couples.length < MAX_COUPLES) {
        events.push(new RandomEvent('couple', [person1, person2]));
        couples.push([person1, person2]);
    } else if (eventType < 0.5 && angerLevel > 2) {
        events.push(new RandomEvent('argument', [person1, person2]));
    } else if (eventType < 0.6 && couples.length > 0 && angerLevel > 5) {
        const couple = couples[Math.floor(Math.random() * couples.length)];
        events.push(new RandomEvent('breakup', couple));
        couples = couples.filter(c => c !== couple);
    }
    
    lastEventTime = now;
}

function takePhoto() {
    photosTaken++;
    
    // Efecto de flash
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Área de la cámara
    const cameraArea = 80;
    let photoSubjects = [];
    
    // Detectar personajes en el área de la cámara
    for (let person of people) {
        const distance = Math.sqrt(
            Math.pow(person.x - mouseX, 2) + 
            Math.pow(person.y - mouseY, 2)
        );
        
        if (distance < cameraArea) {
            photoSubjects.push(person);
        }
    }
    
    // Procesar la foto
    if (photoSubjects.length > 0) {
        const mainSubject = photoSubjects[0];
        let newsTitle = "";
        let newsDescription = "";
        
        if (mainSubject.hasHat) {
            newsTitle = "¡SOMBRERO MISTERIOSO!";
            newsDescription = "Accesorio inusual en la ciudad";
            stage = Math.max(stage, 1);
        } else if (mainSubject.isInLove && mainSubject.partner) {
            newsTitle = "¡ROMANCE PÚBLICO!";
            newsDescription = "Pareja muestra su amor";
            mainSubject.isEmbarrassed = true;
            mainSubject.partner.isEmbarrassed = true;
            
            // Posible ruptura por vergüenza
            if (Math.random() < 0.5) {
                setTimeout(() => {
                    mainSubject.leave();
                    mainSubject.partner.leave();
                    couples = couples.filter(c => c[0] !== mainSubject && c[1] !== mainSubject);
                }, 1000);
            }
        } else if (mainSubject.isAngry) {
            newsTitle = "¡CIUDADANO FURIOSO!";
            newsDescription = "La tensión aumenta";
            angerLevel++;
            
            // Contagio de ira
            for (let i = 0; i < Math.min(3, people.length); i++) {
                const randomPerson = people[Math.floor(Math.random() * people.length)];
                if (!randomPerson.isAngry && Math.random() < 0.3) {
                    randomPerson.isAngry = true;
                }
            }
        } else if (photoSubjects.length > 1) {
            newsTitle = "¡INTERACCIÓN!";
            newsDescription = "Ciudadanos juntos";
        } else {
            newsTitle = "CIUDADANO NORMAL";
            newsDescription = "Vida cotidiana";
        }
        
        // Crear noticia
        currentNews = {
            title: newsTitle,
            description: newsDescription,
            image: mainSubject,
            timer: 300
        };
        
        // Actualizar etapa según nivel de ira
        if (angerLevel >= 3 && stage < 2) {
            stage = 2;
        }
        
        if (angerLevel >= 7 && stage < 3) {
            stage = 3;
            // Más gente se enoja
            for (let i = 0; i < 5; i++) {
                if (Math.random() < 0.3) {
                    people[i].isAngry = true;
                }
            }
        }
        
        // Fin del juego si la ira es muy alta
        if (angerLevel >= 15) {
            endGame();
        }
    }
    
    updateStats();
}

function updateStats() {
    document.getElementById('photosCount').textContent = photosTaken;
    document.getElementById('angerLevel').textContent = angerLevel;
    document.getElementById('couplesCount').textContent = `${couples.length}/${MAX_COUPLES}`;
    document.getElementById('stageLevel').textContent = stage;
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    // Dibujar mapa
    drawMap();
    
    // Generar eventos aleatorios
    generateRandomEvent();
    
    // Actualizar eventos
    events = events.filter(event => event.update());
    
    // Actualizar y dibujar personajes
    people = people.filter(person => {
        const alive = person.update();
        if (alive) person.draw();
        return alive;
    });
    
    // Dibujar visor de la cámara
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(mouseX - 60, mouseY - 40, 120, 80);
    
    // Cruz del visor
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
    
    // Actualizar noticias
    if (currentNews) {
        currentNews.timer--;
        if (currentNews.timer <= 0) {
            currentNews = null;
        }
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    
    // Pantalla de fin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nos convertimos en lo que contemplamos', canvas.width/2, canvas.height/2 - 60);
    
    ctx.font = '24px Arial';
    ctx.fillText('El ciclo se completa', canvas.width/2, canvas.height/2 - 20);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Fotos toma
