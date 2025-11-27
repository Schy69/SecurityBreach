class Projectile {
    constructor(x, y, width, height, targetX, targetY, damage, homing, homing_range, vel = 400, color = '#FFFFFF') {
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;
        this.homing = homing;
        this.homing_range = homing_range;

        this.damage = damage;

        const dx = targetX - x;
        const dy = targetY - y;

        const len = Math.hypot(dx, dy) || 1;

        this.vx = (dx / len) * vel;
        this.vy = (dy / len) * vel;


        this.color = color;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < -10 || this.x > 1010 || this.y < -10 || this.y > 1290) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }

    colide(other, tol = 0) {
        drawRect(other.x , other.y, other,this.width + 10, other.height + 10, "#FFFFFF")
        return (
            this.x               - tol < other.x + other.width  &&
            this.x + this.width  + tol > other.x                &&
            this.y               - tol < other.y + other.height &&
            this.y + this.height + tol > other.y
        );
        
    }

    pjHoming(other) {
        const tol   = this.homing_range;
        const force = this.homing;

        const isNear = (
            this.x - tol < other.x + other.width &&
            this.x + this.width + tol > other.x &&
            this.y - tol < other.y + other.height &&
            this.y + this.height + tol > other.y
        );
        
        if (!isNear) {
            return { x: this.x, y: this.y };
        }
        
        const projectileCenterX = this.x + this.width / 2;
        const projectileCenterY = this.y + this.height / 2;
        
        const targetCenterX = other.x + other.width / 2;
        const targetCenterY = other.y + other.height / 2;
        
        const dx = targetCenterX - projectileCenterX;
        const dy = targetCenterY - projectileCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: this.x, y: this.y };
        
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        const newX = this.x + directionX * force;
        const newY = this.y + directionY * force;
        
        this.x = newX
    }
}

class Enemy {
    constructor(x, y, width, height, targetX, targetY, health, max_health, cadency, defense, projectile, score, speed = 100) {
        this.x = x;
        this.y = y;

        this.score      = score
        this.width      = width;
        this.height     = height;
        this.cadency    = cadency;
        this.max_health = max_health;
        this.defense    = defense;
        this.pj         = projectile;
        this.health     = max_health;
        this.speed      = speed;

        this.targetX = targetX;
        this.targetY = targetY;

        const dx = targetX - x;
        const dy = targetY - y;

        this.lastProjectile = 0;
        const len = Math.hypot(dx, dy) || 1;

        this.vx = (dx / len) * speed;
        this.vy = (dy / len) * speed;

        this.color  = colors.enemies.default;
        this.active = true;
    }

    update(dt, time, projectiles) {
        if (!this.active) return;

        const x = this.x + this.vx * dt;
        const y = this.y + this.vy * dt;

        this.x = (x < this.targetX) ? x : this.targetX;
        this.y = (y < this.targetY) ? y : this.targetY;

        if (this.x < -10 || this.x > 1010 || this.y < -10 || this.y > 1290 || this.health <= 0) {
            this.active = false;
        }

        if (time - this.lastProjectile > this.cadency) {
            this.lastProjectile = time;
            const pjCount = Math.max(1, this.pj.count);

            for (let i = 0; i < pjCount; i++) {
                if (i >= 50) break;

                const totalWidth  = (pjCount - 1) * this.pj.spacing;
                const startX      = (this.width / 2 + this.x) - totalWidth / 2;
                const projectileX = startX + i * this.pj.spacing;
                const spread = Math.floor(Math.random() * this.pj.spread) * (Math.random() > 0.5 ? -1 : 1);

                projectiles.push(new Projectile(
                    projectileX, this.y + this.height,
                    this.pj.width, this.pj.height,
                    projectileX + spread, 1200,
                    this.pj.damage,
                    this.pj.homing, this.pj.homing_range,
                    this.pj.speed,
                    colors.enemies.projectile
            ));
        }}
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    colide(other, tol = 0) {
        return (
            this.x - tol < other.x + other.width &&
            this.x + this.width + tol > other.x &&
            this.y - tol < other.y + other.height &&
            this.y + this.height + tol > other.y
        );
    }
}

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function gameover() {
    stopTimer();
    stopShooting();
    stopEnemies();

    const finalStats = [
        {
            title: "Pontos",
            value: score
        },
        {
            title: "Nivel",
            value: level
        },
        {
            title: "Inimigos",
            value: totalEnemies
        },
        {
            title: "Cartas",
            value: totalCards
        },
        {
            title: "Dificuldade",
            value: difficulty
        },
        {
            title: "Tempo",
            value: `${formatNum(time.hours)}:${formatNum(time.minutes)}:${formatNum(time.seconds)}`
        }
    ]

    const leftFatherComponent = document.getElementById('leftStatsDisplay');
    const rightFatherComponent = document.getElementById('rightStatsDisplay');

    leftFatherComponent.replaceChildren();
    rightFatherComponent.replaceChildren();

    for (let i = 0; i < finalStats.length; i++) {
        const title = finalStats[i].title;
        const value = finalStats[i].value;
        
        const leftComponent = document.createElement('h2');
        const rightComponent = document.createElement('h2');

        leftComponent.className = 'finalStats';
        leftComponent.textContent = title

        rightComponent.className = 'finalStats';
        rightComponent.textContent = value

        leftFatherComponent.appendChild(leftComponent);
        rightFatherComponent.appendChild(rightComponent);
        }

    updateUI('GAMEOVER');
}

function nextPhase() {
    level ++;
    rerolls += (level % 3 === 0) ? 1 : 0;
    enemyRange += (level % 3 === 0) ? 1 : 0;

    selectBuff();
    stopTimer();
    updateLevel();

    maxEnemies   += Math.max(1, parseInt(maxEnemies * 0.08));
    spawnRate    = parseInt(spawnRate * 0.95);
    canComplete  = false;
    enemiesCount = 0;

    enemies      = [];
    eProjectiles = [];
    fProjectiles = [];

    stats.follower.health = Math.min(stats.follower.health + stats.follower.max_health * 0.2, stats.follower.max_health);

    updateUI('BUFFS');
}

function takeDamage(projectile) {
    const now = performance.now();

    if (now - stats.follower.lastHit > stats.follower.immunity) {
        const damage = Math.max(1, projectile.damage * stats.follower.defense);

        const absorbed = Math.min(damage, stats.follower.extra_health);
        stats.follower.extra_health -= absorbed;

        const healthDamage = damage - absorbed;
        stats.follower.health -= healthDamage;

        stats.follower.lastHit = now;
    }

    projectile.active = false;
    followerStats();
}

function doDamage(projectile, enemy) {
    const damage = Math.max(1, projectile.damage * enemy.defense);

    enemy.health -= damage;
    projectile.active = false;

    if (stats.cards.spyware > 0) {
        const heal = stats.projectile.damage * stats.cards.spyware * 0.03
        stats.follower.health = Math.min(stats.follower.health + heal, stats.follower.max_health);
        followerStats();
    }
    
    if (enemy.health <= 0) {
        enemy.active = false;
        score += enemy.score;
        totalEnemies ++;
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (state === 'MENU') {
        drawRect(WIDTH / 2 - follower.width / 2, HEIGHT * 0.7, follower.width, follower.height, follower.color);
    }

    if (state === 'PLAYING') {
        drawRect(follower.x, follower.y, follower.width, follower.height, follower.color);
    }
}

function gameLoop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    draw();
    
    if (state === 'PLAYING') {
        updateScore();

        if (enemiesCount >= maxEnemies) {
            stopEnemies();
            canComplete = true;
        }

        if (canComplete && enemies.length === 0) {
            nextPhase();
        }

        fProjectiles.forEach(t => t.update(dt));
        fProjectiles.forEach(t => t.draw(ctx));

        eProjectiles.forEach(t => t.update(dt));
        eProjectiles.forEach(t => t.draw(ctx));

        const now = performance.now();
        enemies.forEach(e => e.update(dt, now, eProjectiles));
        enemies.forEach(t => t.draw(ctx));

        if (now - stats.follower.lastHit > stats.follower.immunity) {
            follower.color = colors.follower.default;
        } else {
            follower.color = colors.follower.damage;
        }
        
        for (let i = fProjectiles.length - 1; i >= 0; i--) {
            const p = fProjectiles[i];

            if (!p.active) {
                fProjectiles.splice(i, 1);
                continue;
            }

            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                p.pjHoming(e);

                if (!e.active) {
                    enemies.splice(j, 1);
                    continue;
                }

                if (p.colide(e)) {
                    doDamage(p, e);
                    break;
                }
                }
            }

        for (let i = eProjectiles.length - 1; i >= 0; i--) {
            const p = eProjectiles[i];
            p.pjHoming(follower);

            if (!p.active) {
                eProjectiles.splice(i, 1);
                continue;
            }
            
            if (p.colide(follower)) {
                takeDamage(p);

                if (stats.follower.health <= 0) {
                    gameover();
                    break;
                }
            }
        }
    }

    requestAnimationFrame(gameLoop);

}

function startShooting() {
    if (shootingInterval) return;
    const fCadency = stats.follower.cadency;

    shootingInterval = setInterval(() => {
    if (state === 'PLAYING') {
     
        const pjWidth   = stats.projectile.width;
        const pjHeight  = stats.projectile.height;
        const pjSpacing = pjWidth * stats.projectile.spacing;
        const pjDamage  = stats.projectile.damage;
        const pjHoming  = stats.projectile.homing;
        const pjHRange  = stats.projectile.homing_range;
        const pjSpeed   = stats.projectile.speed;

        const totalWidth = (stats.projectile.count - 1) * pjSpacing;
        
    
        const startX = (follower.width / 2 + follower.x) - totalWidth / 2;

        for (let i = 0; i < stats.projectile.count; i++) {
            if (i >= 50) break;

            const projectileX = startX + i * pjSpacing;
            const spread = Math.floor(Math.random() * stats.projectile.spread) * (Math.random() > 0.5 ? -1 : 1);

            fProjectiles.push(new Projectile(
                projectileX,
                follower.y,
                pjWidth,
                pjHeight,
                projectileX + spread,
                0,
                pjDamage,
                pjHoming,
                pjHRange,
                pjSpeed,
                colors.follower.projectile
            ));
        }
      
    }
    }, fCadency); 
}

function enemyTarget(e, type) {
    let targetX;
    let targetY;

    switch (type) {
        case 'a':
            targetX = null;
            targetY = HEIGHT;
            break;
        case 'b': {
            targetX = null;
            targetY = 500;
            break
        }
    }

    return [targetX, targetY];
}

function spawnEnemies() {
  if (enemiesInterval) return;

  enemiesInterval = setInterval(() => {
    if (state === 'PLAYING') {
        enemiesCount ++;

        sortedEnemy = randomKey(enemyTypes, enemyRange);

        const e  = enemyTypes[sortedEnemy].enemy;
        const pj = enemyTypes[sortedEnemy].projectile;
  
        const eWidth     = e.width      * stats.enemies.width;
        const eHeight    = e.height     * stats.enemies.height;
        const eHealth    = e.health     * stats.enemies.health;
        const eMaxHealth = e.max_health * stats.enemies.max_health;
        const eDefense   = e.defense    * stats.enemies.defense;
        const eCadency   = e.cadency    * stats.enemies.cadency;
        const eScore     = e.score

        const enemyTargets = enemyTarget(e, sortedEnemy);

        const projectile = {
            "damage"      : pj.damage       * stats.eProjectile.damage,
            "speed"       : pj.speed        * stats.eProjectile.speed,
            "width"       : pj.width        * stats.eProjectile.width,
            "height"      : pj.height       * stats.eProjectile.height,
            "count"       : pj.count        + stats.eProjectile.count,
            "spacing"     : pj.spacing      * stats.eProjectile.spacing,
            "spread"      : pj.spread       * stats.eProjectile.spread,
            "homing"      : pj.homing       * stats.eProjectile.homing,
            "homing_range": pj.homing_range * stats.eProjectile.homing_range,
            "targetX"     : enemyTargets[0],
            "targetY"     : enemyTargets[1]
        }
        
        const areaDivision = maxEnemies < 24 ? maxEnemies : 24;
        const enemyArea = canvas.width - eWidth;
        const positionX = (enemyArea / areaDivision) * (enemiesCount % areaDivision) + 15;
        console.log(positionX < enemyArea);
     
        enemies.push(new Enemy(
            positionX, 
            10 + eHeight / 2, 
            eWidth, 
            eHeight, 
            positionX, 
            60, 
            eHealth, 
            eMaxHealth,
            eCadency,
            eDefense,
            projectile,
            eScore
        ));
    }
  }, spawnRate); 
}

function stopShooting() {
  clearInterval(shootingInterval);
  shootingInterval = null;
}

function stopEnemies() {
  clearInterval(enemiesInterval);
  enemiesInterval = null;
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function show(id, on = true) {
  const el = document.getElementById(id);
  if (!el) return;

  // Ensure the element has the animation base class
  el.classList.add('fade-slide');

  // Preserve the element's default display so we can restore it on show
  if (!el.dataset._defaultDisplay) {
    const cs = getComputedStyle(el).display;
    el.dataset._defaultDisplay = (cs === 'none') ? 'flex' : cs;
  }

  // Remove any previously attached hide-listener to avoid it firing after we show
  if (el._hideListener) {
    el.removeEventListener('transitionend', el._hideListener);
    delete el._hideListener;
  }

  if (on) {
    // Make visible first, then trigger the "show" state so transition runs
    el.style.display = el.dataset._defaultDisplay;
    // Force reflow so adding the class triggers the transition
    void el.offsetWidth;
    el.classList.remove('fade-slide-hide');
    el.classList.add('fade-slide-show');
  } else {
    // Trigger hide animation, then set display:none after the opacity transition ends
    el.classList.remove('fade-slide-show');
    el.classList.add('fade-slide-hide');

    const onEnd = function(e) {
      // only react to the opacity transition on the element itself
      if (e.target !== el) return;
      if (e.propertyName !== 'opacity') return;

      el.style.display = 'none';
      el.removeEventListener('transitionend', onEnd);
      delete el._hideListener;
    };

    // store the listener so we can remove it if a show happens before it fires
    el._hideListener = onEnd;
    el.addEventListener('transitionend', onEnd);
  }
}

function updateLevel() {
    const levelComponent = document.getElementById('level');
    levelComponent.textContent = level;
}

function updateUI(newState) {
    state = newState;
    switch (state) {
        case 'MENU':
            show('surface', true)
            show('buffCardsBox', false)
            show('menu', true)
            show('playerstats', false)
            show('gameover', false)
            break;

        case 'PLAYING':
            show('menu', false)
            show('surface', false)
            show('buffCardsBox', false);
            show('playerstats', true)
            show('gameover', false)
            break;

        case 'BUFFS':
            show('surface', true)
            show('buffCardsBox', true)
            show('playerstats', false)
            break;

        case 'GAMEOVER':
            show('surface', true)
            show('gameover', true)
            show('playerstats', false)
    }
}

function followerStats() {
    const extraHealthBar = document.getElementById('extrahealthbar');
    const healthBar = document.getElementById('healthbar');

    const extraBarWidth = parseInt(stats.follower.extra_health / stats.follower.max_health * WIDTH);
    extraHealthBar.style.width = extraBarWidth + 'px';

    const barWidth = parseInt(stats.follower.health / stats.follower.max_health * WIDTH);
    healthBar.style.width = barWidth + 'px';

}

function applyBuff(buff, times) {
    stats.cards[buff] += times;
    totalCards += times;
    userBuffCards();

    for (let i = 0; i < times; i++) {
        switch (buff) {
            case 'vulnerabilidade':
                stats.enemies.defense *= 1.12;
                break;
            
            case 'exploit':
                stats.enemies.damage *= 0.88;
                break;

            case 'firewall':
                stats.enemies.max_health *= 0.9;
                break;

            case 'ips':
                stats.eProjectile.count --;
                break;

            case 'criptografia':
                stats.follower.immunity *= 1.12;
                break;

            case 'vpn':
                stats.projectile.speed *= 1.12;
                break;
            
            case 'segmentacao':
                stats.projectile.count ++;
                stats.projectile.damage *= 0.7;
                break;

            case 'backup':
                stats.follower.max_health = parseInt(stats.follower.max_health * 1.12)
                stats.follower.extra_health = Math.min(stats.follower.extra_health + stats.follower.max_health * 0.6, stats.follower.max_health);
                break;

            case 'botnet':
                if (stats.projectile.homing === 0) {
                    stats.projectile.homing = 0.3;
                    stats.projectile.homing_range = 25;
                } else {
                    stats.projectile.homing *= 1.15;
                    stats.projectile.homing_range *= 1.12;
                }
                break;

            case 'pentest':
                stats.projectile.damage *= 1.1;
                break;

            case '5g':
                stats.follower.cadency *= 0.92;
                break;

            case 'iso':
                stats.follower.max_health *= 1.03;
                stats.follower.defense    *= 0.97;
                stats.follower.immunity   *= 1.03;
                stats.follower.cadency    *= 0.97;

                stats.projectile.damage  *= 1.03;
                stats.projectile.speed   *= 1.03;
                stats.projectile.width   *= 1.03;
                stats.projectile.height  *= 1.03;
                break;

            case 'soar':
                stats.eProjectile.homing *= 0.9;
                stats.eProjectile.homing_range *= 0.9;
                break;

            case 'mitre':
                stats.enemies.max_health *= 0.97;
                stats.enemies.defense    *= 1.03;
                stats.enemies.immunity   *= 0.97;
                stats.enemies.cadency    *= 1.03;

                stats.eProjectile.damage  *= 0.97;
                stats.eProjectile.speed   *= 0.97;
                stats.eProjectile.width   *= 0.97;
                stats.eProjectile.height  *= 0.97;
                break;

            case 'resgate':
                stats.projectile.damage *= 0.6;
                stats.projectile.count += 2;
                stats.projectile.spacing *= 0.5
                
                if (stats.projectile.spread === 0) {
                    stats.projectile.spread = 30;
                } else {
                    stats.projectile.spread *- 1.15;
                }
                break;
        }
    }

    startShooting();
    spawnEnemies();
    followerStats();
    startTimer();
    updateUI('PLAYING');
    userBuffCards();
}

function sortBuffs() {
    let selectedBuffs = [];

    while (selectedBuffs.length < 3) {
        const sortedBuff = randomKey(buffs);
        
        if (selectedBuffs.includes(sortedBuff)) continue;
        else selectedBuffs.push(sortedBuff);
    }

    return selectedBuffs;
}

function selectBuff() {
    const selectedBuffs = sortBuffs();
    const isSpecial  = level % 5 === 0;

    for (let i = selectedBuffs.length - 1; i >= 0; i--) {
        const buffData   = buffs[selectedBuffs[i]];
        const buffCard   = document.getElementById(`buffCard${i + 1}`);

        buffCard.className = isSpecial ? 'buffCardSpecial' : 'buffCardCommon';

        requestAnimationFrame(() => {
        buffCard.children[0].textContent = `x${stats.cards[selectedBuffs[i]]}`;
        buffCard.children[1].src = buffData.path;
        buffCard.children[2].textContent = buffData.title;
        buffCard.children[3].textContent = buffData.description;
        buffCard.children[4].textContent = buffData.effect;
        

        const triggers = isSpecial ? 3 : 1;
        buffCard.onclick = () => applyBuff(selectedBuffs[i], triggers);
        });
    }

    const rerollButton = document.getElementById('reroll');
    rerollButton.textContent = rerolls ? 'Embaralhar x' + rerolls : 'Sem Cargas';

    const cardsTitle = document.getElementById('cardsTitle');
    if (isSpecial) {
        cardsTitle.className = 'cardsTitleSpecial';
        cardsTitle.textContent = 'Escolha sua Carta x3!';
    } else {
        cardsTitle.className = 'cardsTitleCommon';
        cardsTitle.textContent = 'Escolha sua Carta!';
    }
}

async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    return res.json();          // já retorna objeto JS
}

function randomKey(obj, range = null) {
    const keys = Object.keys(obj);
    const len  = range == null ? keys.length
                                : Math.min(range, keys.length);
    return keys[Math.floor(Math.random() * len)];
}

function updateScore() {
    if (displayScore === score) return;

    const diff = score - displayScore;
    const step = Math.sign(diff) * Math.ceil(Math.abs(diff) * 0.08);
    displayScore += step;

    if (Math.sign(diff) !== Math.sign(score - displayScore)) {
    displayScore = score;
    }

    document.getElementById('score').textContent = Math.round(displayScore);

}

function userBuffCards() {
    const userSelectedBuffs = document.getElementById('userSelectedBuffs');
    userSelectedBuffs.replaceChildren();

    for (const [key, value] of Object.entries(stats.cards)) {
        if (value === 0) continue;

        const cardImg = document.createElement('img');
        const cardStack = document.createElement('p');

        cardImg.src = `./img/${key}.png`;
        cardStack.textContent = 'x' + value;

        userSelectedBuffs.appendChild(cardImg);
        userSelectedBuffs.appendChild(cardStack);
    }
}

document.getElementById('buttonPlay').onclick = () => {
    startShooting();
    spawnEnemies();
    followerStats();
    startTimer();
    updateUI('PLAYING');
}

document.getElementById('reroll').onclick = () => {
    if (rerolls <= 0) return;
    rerolls --; 
    selectBuff();
    updateUI('BUFFS');
}

document.getElementById('retry').onclick = () => {
    score        = 0;
    displayScore = 0;
    enemiesCount = 0;
    timer        = 0;
    maxEnemies   = 5;
    spawnRate    = 3000;
    canComplete  = false;
    enemyRange   = 0;
    level        = 1;
    difficulty   = 0;

    loadJSON('./stats.json')
    .then(obj => {
        stats = obj;
    })
    .catch(err => console.error(err));

    eProjectiles = [];
    fProjectiles = [];
    enemies      = [];

    startShooting();
    spawnEnemies();
    startTimer();
    updateUI('PLAYING');
    followerStats();
    updateScore();
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function formatNum(num) {
    return String(num).padStart(2, '0');
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer += 1

        if (timer - lastEnemyBuff > 45) {
            lastEnemyBuff = timer;
            
            stats.enemies.max_health *= 1.02;
            stats.enemies.defense    *= 0.98;
            stats.enemies.immunity   *= 1.02;
            stats.enemies.cadency    *= 0.98;

            stats.eProjectile.damage  *= 1.02;
            stats.eProjectile.speed   *= 1.02;
            stats.eProjectile.width   *= 1.02;
            stats.eProjectile.height  *= 1.02;

            difficulty ++;
        }

        const timerComponent = document.getElementById('timer');

        const hours   = Math.floor(timer / 3600);
        const minutes = Math.floor((timer % 3600) / 60);
        const seconds = timer % 60;

        time = {
            seconds: seconds,
            minutes: minutes,
            hours: hours
        }

        timerComponent.textContent = `${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`
    }, 1000)
}

function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

const canvas = document.querySelector('canvas');
const ctx    = canvas.getContext('2d');
const WIDTH  = canvas.width = 1000;
const HEIGHT = canvas.height = 1000;



let time   = {
    seconds: 0,
    minutes: 0,
    hours: 0
}

let mouseX = 0;
let mouseY = 0;

let fProjectiles = [];
let eProjectiles = [];
let enemies      = [];

let state        = 'MENU';
let score        = 0;
let displayScore = 0;
let canComplete  = false;
let maxEnemies   = 0;
let enemiesCount = 0;
let spawnRate    = 2500;
let lastTime     = 0
let enemyRange   = 1;
let timer        = 0;
let level        = 1;
let rerolls      = 1;
let totalCards   = 0;
let totalEnemies = 0;
let difficulty   = 0;

let lastEnemyBuff = 0;

let shootingInterval      = null;
let enemiesInterval       = null;
let enemyShootingInterval = null;
let timerInterval         = null;

const colors = {
    follower: {
        default: "#4152ba",
        damage: "#be2c5d",
        projectile: "#1cb3c4"
    },
    enemies: {
        default: "#be2c5d",
        projectile: "#ffcf6b"
    },
    game: {
        playarea: "#170f2cff",
        background: "#0a0614"
    }
}

canvas.style.backgroundColor = colors.game.playarea
document.body.style.backgroundColor = colors.game.background

const follower = {
    x: 100, 
    y: 100, 
    width: 40, 
    height: 40, 
    vx: 0, vy: 0,
    color: colors.follower.default
};

let stats;
let buffs;

loadJSON('./stats.json')
  .then(obj => {
    stats = obj;
  })
  .catch(err => console.error(err));

loadJSON('./buffs.json')
  .then(obj => {
    buffs = obj;
  })
  .catch(err => console.error(err));

  loadJSON('./enemies.json')
  .then(obj => {
    enemyTypes = obj;
  })
  .catch(err => console.error(err));

requestAnimationFrame(gameLoop);

updateUI('MENU');

document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top - (isMobile() ? 200 : 0);

    maxX = canvas.width - follower.width;
    maxY = canvas.height - follower.height;

    follower.x = Math.min(Math.max(0, mouseX - follower.width / 2), maxX);
    follower.y = Math.min(Math.max(150, mouseY - follower.height / 2), maxY);
});
