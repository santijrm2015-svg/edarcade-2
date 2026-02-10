const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const resetBtn = document.getElementById('resetBtn');

// Variables del juego
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

// Mapa de la ciudad
const map = {
    buildings: [
        { x: 10, y: 10, width: 150, height: 150, color: '#8B4513' },
        { x: 210, y: 10, width: 150, height: 150, color: '#A0522D' },
        { x: 410, y: 10, width: 100, height: 150, color: '#8B4513' },
        { x: 540, y: 10, width: 140, height: 150, color: '#A0522D' },
        { x: 710, y: 10, width: 170, height: 150, color: '#8B4513' },
        { x: 10, y: 210, width: 150, height: 120, color: '#A0522D' },
        { x: 210, y: 210, width: 150, height: 120, color: '#8B4513' },
        { x: 410, y: 210, width: 100, height: 120, color: '#A0522D' },
        { x: 540, y: 210, width: 140, height: 120, color: '#8B4513' },
        { x: 710, y: 210, width: 170, height: 120, color: '#8B4513' },
        { x: 10, y: 390, width: 150, height: 190, color: '#8B4513' },
        { x: 210, y: 390, width: 150, height: 190, color: '#A0522D' },
        { x: 410, y: 390, width: 100, height: 190, color: '#8B4513' },
        { x: 540, y: 390, width: 140, height: 190, color: '#A0522D' },
        { x: 710, y: 390, width: 170, height: 190, color: '#8B4513' }
    ],
    tv: {
        x: 440,
        y: 240,
        width: 120,
        height: 90
    }
};

// Clase Character
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
        this.walkPhase = 0;
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
        this.walkPhase += 0.1;
        
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
        
        if (this.x < 20) { this.x = 20; this.direction = Math.PI - this.direction; }
        if (this.x > canvas.width - 20) { this.x = canvas.width - 20; this.direction = Math.PI - this.direction; }
        if (this.y < 20) { this.y = 20; this.direction = -this.direction; }
        if (this.y > canvas.height - 20) { this.y = canvas.height - 20; this.direction = -this.direction; }
        
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
        
        if (this.shape === 'circle') {
            const gradient = ctx.createRadialGradient(
                this.x - this.size/3, drawY - this.size/3, 0,
                this.x, drawY, this.size
            );
            
            let lightColor, darkColor;
            if (this.isAngry) {
                lightColor = '#FF6B6B';
                darkColor = '#C62828';
            } else if (this.isEmbarrassed) {
                lightColor = '#FFB74D';
                darkColor = '#E65100';
            } else if (this.isInLove) {
                lightColor = '#F48FB1';
                darkColor = '#880E4F';
            } else {
                lightColor = '#81C784';
                darkColor = '#2E7D32';
            }
            
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.7, this.color);
            gradient.addColorStop(1, darkColor);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x - this.size/3, drawY - this.size/3, this.size/3, this.size/4, -Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            const gradient = ctx.createLinearGradient(
                this.x - this.size, drawY - this.size,
                this.x + this.size, drawY + this.size
            );
            
            let lightColor, darkColor;
            if (this.isAngry) {
                lightColor = '#FF6B6B';
                darkColor = '#C62828';
            } else if (this.isEmbarrassed) {
                lightColor = '#FFB74D';
                darkColor = '#E65100';
            } else if (this.isInLove) {
                lightColor = '#F48FB1';
                darkColor = '#880E4F';
            } else {
                lightColor = '#64B5F6';
                darkColor = '#0D47A1';
            }
            
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, darkColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - this.size, drawY - this.size, this.size * 2, this.size * 2);
            
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.size, drawY - this.size, this.size * 2, this.size * 2);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(this.x - this.size + 2, drawY - this.size + 2, this.size/2, this.size/2);
        }
        
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.ellipse(this.x - 4, drawY - 2, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(this.x + 4, drawY - 2, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 4, drawY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 4, drawY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 4.5, drawY - 2.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 3.5, drawY - 2.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
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
        
        if (this.hasHat) {
            const hatY = drawY - this.size - 4;
            
            if (this.hatType === 'square') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(this.x - 7, hatY - 2, 14, 5);
                ctx.fillRect(this.x - 9, hatY + 2, 18, 3);
                
                const hatGradient = ctx.createLinearGradient(
                    this.x - 6, hatY - 4,
                    this.x + 6, hatY + 2
                );
                hatGradient.addColorStop(0, '#A0522D');
                hatGradient.addColorStop(1, '#654321');
                
                ctx.fillStyle = hatGradient;
                ctx.fillRect(this.x - 6, hatY - 4, 12, 5);
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x - 8, hatY + 1, 16, 3);
                
                ctx.strokeStyle = '#4A2C17';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x - 6, hatY - 4, 12, 5);
                ctx.strokeRect(this.x - 8, hatY + 1, 16, 3);
                
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x + 2, hatY - 4);
                ctx.lineTo(this.x - 7, hatY + 2);
                ctx.lineTo(this.x + 7, hatY + 2);
                ctx.closePath();
                ctx.fill();
                
                const hatGradient = ctx.createLinearGradient(
                    this.x, hatY - 6,
                    this.x, hatY + 2
                );
                hatGradient.addColorStop(0, '#A0522D');
                hatGradient.addColorStop(1, '#654321');
                
                ctx.fillStyle = hatGradient;
                ctx.beginPath();
                ctx.moveTo(this.x, hatY - 6);
                ctx.lineTo(this.x - 6, hatY + 2);
                ctx.lineTo(this.x + 6, hatY + 2);
                ctx.closePath();
                ctx.fill();
                
                ctx.strokeStyle = '#4A2C17';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        if (this.isInLove) {
            const heartBounce = Math.sin(this.bouncePhase * 2) * 3;
            ctx.fillStyle = '#FF1493';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('❤', this.x - 6, drawY - this.size - 10 + heartBounce);
            
            ctx.font = '8px Arial';
            ctx.fillText('❤', this.x + 8, drawY - this.size - 5 + heartBounce/2);
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
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(canvas.width, 180);
    ctx.moveTo(0, 360);
    ctx.lineTo(canvas.width, 360);
    ctx.stroke();
    
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
    
    for (let building of map.buildings) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(building.x + 5, building.y + 5, building.width, building.height);
        
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
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
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(building.x, building.y, building.width, building.height);
    }
    
    drawTVOnMap();
}

function drawTVOnMap() {
    const tv = map.tv;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(tv.x - 10, tv.y - 10, tv.width + 20, tv.height + 30);
    
    const baseGradient = ctx.createLinearGradient(
        tv.x + tv.width/2 - 20, tv.y + tv.height + 5,
        tv.x + tv.width/2 + 20, tv.y + tv.height + 25
    );
    baseGradient.addColorStop(0, '#444');
    baseGradient.addColorStop(0.5, '#222');
    baseGradient.addColorStop(1, '#111');
    
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.moveTo(tv.x + tv.width/2 - 25, tv.y + tv.height + 5);
    ctx.lineTo(tv.x + tv.width/2 + 25, tv.y + tv.height + 5);
    ctx.lineTo(tv.x + tv.width/2 + 15, tv.y + tv.height + 25);
    ctx.lineTo(tv.x + tv.width/2 - 15, tv.y + tv.height + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.fillRect(tv.x + tv.width/2 - 3, tv.y + tv.height, 6, 10);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(tv.x + 3, tv.y + 3, tv.width, tv.height);
    
    const frameGradient = ctx.createLinearGradient(
        tv.x, tv.y,
        tv.x + tv.width, tv.y + tv.height
    );
    frameGradient.addColorStop(0, '#2a2a2a');
    frameGradient.addColorStop(0.5, '#1a1a1a');
    frameGradient.addColorStop(1, '#0a0a0a');
    
    ctx.fillStyle = frameGradient;
    ctx.fillRect(tv.x, tv.y, tv.width, tv.height);
    
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(tv.x + 2, tv.y + 2, tv.width - 4, tv.height - 4);
    
    const screenGradient = ctx.createRadialGradient(
        tv.x + tv.width/2, tv.y + tv.height/2, 0,
        tv.x + tv.width/2, tv.y + tv.height/2, tv.width/2
    );
    screenGradient.addColorStop(0, '#111');
    screenGradient.addColorStop(1, '#000');
    
    ctx.fillStyle = screenGradient;
    ctx.fillRect(tv.x + 5, tv.y + 5, tv.width - 10, tv.height - 10);
    
    if (currentNews && currentNews.timer > 0) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(tv.x + 5, tv.y + 5, tv.width - 10, tv.height - 10);
        
        ctx.save();
        ctx.translate(tv.x + tv.width/2, tv.y + 25);
        ctx.scale(0.35, 0.35);
        
        const subject = currentNews.image;
        ctx.fillStyle = subject.color;
        if (subject.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, subject.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-subject.size, -subject.size, subject.size * 2, subject.size * 2);
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(tv.x + 5, tv.y + tv.height - 20, tv.width - 10, 15);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentNews.title, tv.x + tv.width/2, tv.y + tv.height - 10);
        ctx.textAlign = 'left';
        
        ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
        ctx.fillRect(tv.x + 5, tv.y + 5, tv.width - 10, tv.height - 10);
        
    } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(tv.x + 5, tv.y + 5, tv.width - 10, tv.height - 10);
        
        const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('6', tv.x + tv.width/2, tv.y + tv.height/2);
        
        ctx.fillStyle = '#333';
        ctx.font = '6px Arial';
        ctx.fillText('CANAL 6', tv.x + tv.width/2, tv.y + tv.height/2 + 10);
        ctx.textAlign = 'left';
        
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            ctx.fillRect(
                tv.x + 5 + Math.random() * (tv.width - 10),
                tv.y + 5 + Math.random() * (tv.height - 10),
                1, 1
            );
        }
        
        const reflectionGradient = ctx.createLinearGradient(
            tv.x + 5, tv.y + 5,
            tv.x + 5, tv.y + tv.height/2
        );
        reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(tv.x + 5, tv.y + 5, tv.width - 10, tv.height/2);
    }
    
    ctx.fillStyle = currentNews ? '#00FF00' : '#FF0000';
    ctx.beginPath();
    ctx.arc(tv.x + tv.width - 8, tv.y + tv.height - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#555';
    ctx.font = '4px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SMART TV', tv.x + tv.width/2, tv.y + tv.height + 3);
    ctx.textAlign = 'left';
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
    
    people.length = 0;
    couples.length = 0;
    events.length = 0;
    
    updateStats();
    overlay.classList.remove('hidden');
}

function initGame() {
    for (let i = 0; i < 25; i++) {
        const shape = Math.random() < 0.5 ? 'circle' : 'square';
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 180 : 360;
        } else {
            x = [185, 385, 535, 705][Math.floor(Math.random() * 4)];
            y = Math.random() * canvas.height;
        }
        
        people.push(new Character(x, y, shape));
    }
    
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
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cameraArea = 80;
    let photoSubjects = [];
    
    for (let person of people) {
        const distance = Math.sqrt(
            Math.pow(person.x - mouseX, 2) + 
            Math.pow(person.y - mouseY, 2)
        );
        
        if (distance < cameraArea) {
            photoSubjects.push(person);
        }
    }
    
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
            
            if (Math.random() < 0.5) {
                setTimeout(() => {
                    mainSubject.leave();
                    mainSubject.partner.leave();
                }, 1000);
            }
        } else if (mainSubject.isAngry) {
            newsTitle = "¡CIUDADANO FURIOSO!";
            newsDescription = "La tensión aumenta";
            angerLevel++;
            
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
        
        currentNews = {
            title: newsTitle,
            description: newsDescription,
            image: mainSubject,
            timer: 300
        };
        
        if (angerLevel >= 3 && stage < 2) {
            stage = 2;
        }
        
        if (angerLevel >= 7 && stage < 3) {
            stage = 3;
            for (let i = 0; i < 5; i++) {
                if (Math.random() < 0.3) {
                    people[i].isAngry = true;
                }
            }
        }
        
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
    
    drawMap();
    generateRandomEvent();
    events = events.filter(event => event.update());
    people = people.filter(person => {
        const alive = person.update();
        if (alive) person.draw();
        return alive;
    });
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(mouseX - 60, mouseY - 40, 120, 80);
    
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
    
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
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nos convertimos en lo que contemplamos', canvas.width/2, canvas.height/2 - 60);
    
    ctx.font = '24px Arial';
    ctx.fillText('El ciclo se completa', canvas.width/2, canvas.height/2 - 20);
    
    ctx.font = '18px Arial';
    ctx.fillText(`Fotos tomadas: ${photosTaken}`, canvas.width/2, canvas.height/2 + 20);
    ctx.fillText(`Nivel de ira alcanzado: ${angerLevel}`, canvas.width/2, canvas.height/2 + 50);
    ctx.fillText('La violencia solo genera más violencia', canvas.width/2, canvas.height/2 + 80);
    
    ctx.font = '16px Arial';
    ctx.fillText('Reflexiona sobre lo que consumes', canvas.width/2, canvas.height/2 + 120);
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(canvas.width/2 - 80, canvas.height/2 + 150, 160, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('REINICIAR', canvas.width/2, canvas.height/2 + 175);
    
    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        if (x > canvas.width/2 - 80 && x < canvas.width/2 + 80 && 
            y > canvas.height/2 + 150 && y < canvas.height/2 + 190) {
            resetGame();
            canvas.onclick = function() {
                if (gameRunning && !gamePaused) {
                    takePhoto();
                }
            };
        }
    };
    
    ctx.textAlign = 'left';
}

function startGame() {
    resetGame();
    overlay.classList.add('hidden');
    gameRunning = true;
    initGame();
    updateStats();
    gameLoop();
}

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    pauseBtn.innerHTML = gamePaused ? '▶️ Reanudar' : '⏸️ Pausar';
    if (!gamePaused) {
        gameLoop();
    }
}

function toggleFullscreen() {
    const container = document.getElementById('gameContainer');
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            fullscreenBtn.innerHTML = '🔻 Salir Pantalla Completa';
        }).catch(err => {
            console.log('Error al entrar en pantalla completa:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            canvas.width = 900;
            canvas.height = 600;
            fullscreenBtn.innerHTML = '🖥️ Pantalla Completa';
        }).catch(err => {
            console.log('Error al salir de pantalla completa:', err);
        });
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
fullscreenBtn.addEventListener('click', toggleFullscreen);
resetBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
        resetGame();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        takePhoto();
    }
});

// Manejar redimensionamiento en pantalla completa
window.addEventListener('resize', () => {
    if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 900;
        canvas.height = 600;
    }
});

// Prevenir scroll en pantalla completa
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
        canvas.width = 900;
        canvas.height = 600;
        fullscreenBtn.innerHTML = '🖥️ Pantalla Completa';
    }
});