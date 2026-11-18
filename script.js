const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mensagemEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

// TRAVA DE 60 FPS (Velocidade estável em qualquer tela)
let ultimoTempo = 0;
const fpsIntervalo = 1000 / 60;

// VARIÁVEIS DO JOGO
let pontos = 0;
let vidas = 3;
let mana = 100;
let faseAtual = 0;
let gameOver = false;
let vitoria = false;
const gravidade = 0.5;
let frameAnimacao = 0;
let tempoGlobal = 0;

// ESTRELAS DE FUNDO E VAGA-LUMES
let estrelasFundo = [];
for (let i = 0; i < 45; i++) {
    estrelasFundo.push({
        x: Math.random() * 800,
        y: Math.random() * 320,
        tamanho: Math.random() * 2.5 + 1,
        brilho: Math.random() * Math.PI
    });
}

// CONTROLES
const teclas = {};
window.addEventListener("keydown", function(e) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    // Pulo e Pulo Duplo ao pressionar
    if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !teclas[e.code]) {
        if (!gameOver && !vitoria && jogador.pulosRestantes > 0) {
            jogador.velY = jogador.forcaPulo;
            jogador.noChao = false;
            jogador.pulosRestantes--;
            criarParticulas(jogador.x + 14, jogador.y + 40, "#ffd700", 10);
        }
    }

    teclas[e.code] = true;

    if (gameOver || vitoria) return;

    // TECLA F: RAIO ESTELAR
    if (e.code === "KeyF" && podeAtirar) {
        magias.push({
            x: jogador.x + (jogador.direcao === 1 ? 26 : -6),
            y: jogador.y + 20,
            velX: 8 * jogador.direcao,
            velY: 0,
            raio: 7,
            super: false
        });
        podeAtirar = false;
        setTimeout(function() { podeAtirar = true; }, 350);
    }

    // TECLA R: SUPERNOVA (Rajada tripla poderosa)
    if (e.code === "KeyR" && mana >= 50) {
        mana -= 50;
        let angulos = [-1.5, 0, 1.5];
        angulos.forEach(function(vy) {
            magias.push({
                x: jogador.x + (jogador.direcao === 1 ? 28 : -8),
                y: jogador.y + 20,
                velX: 7.5 * jogador.direcao,
                velY: vy,
                raio: 11,
                super: true
            });
        });
        criarParticulas(jogador.x + 14, jogador.y + 20, "#ff7eb3", 18);
    }
});

window.addEventListener("keyup", function(e) {
    teclas[e.code] = false;
});

// PERSONAGEM PRINCIPAL: LUNA
const jogador = {
    x: 50,
    y: 300,
    largura: 28,
    altura: 42,
    velX: 0,
    velY: 0,
    velocidade: 3.0,
    forcaPulo: -10.5,
    noChao: false,
    pulosRestantes: 2,
    direcao: 1,
    invulneravel: false
};

let magias = [];
let ataquesChefe = [];
let particulas = [];
let podeAtirar = true;

// FASES DO JOGO
const fases = [
    {
        nome: "1. Jardim do Pôr do Sol",
        corTopo: "#3a1c71",
        corMeio: "#d76d77",
        corBase: "#ffaf7b",
        corGrama: "#ff7eb3",
        corTerra: "#4a2545",
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 160, y: 300, largura: 120, altura: 18 },
            { x: 350, y: 230, largura: 120, altura: 18 },
            { x: 540, y: 290, largura: 110, altura: 18 }
        ],
        estrelas: [
            { x: 210, y: 265, coletada: false },
            { x: 400, y: 195, coletada: false },
            { x: 585, y: 255, coletada: false },
            { x: 450, y: 345, coletada: false }
        ],
        inimigos: [
            { x: 380, y: 350, largura: 28, altura: 30, vel: 1.3, dir: 1, minX: 250, maxX: 560, tipo: "slime", hp: 2, maxHp: 2 }
        ],
        portal: { x: 720, y: 310, largura: 46, altura: 70 }
    },
    {
        nome: "2. Floresta de Cristal",
        corTopo: "#09203f",
        corMeio: "#1d4350",
        corBase: "#2b5876",
        corGrama: "#00f2fe",
        corTerra: "#1b263b",
        plataformas: [
            { x: 0, y: 380, largura: 250, altura: 20 },
            { x: 340, y: 380, largura: 460, altura: 20 },
            { x: 140, y: 285, largura: 100, altura: 18 },
            { x: 310, y: 215, largura: 100, altura: 18 },
            { x: 490, y: 155, largura: 110, altura: 18 }
        ],
        estrelas: [
            { x: 180, y: 250, coletada: false },
            { x: 350, y: 180, coletada: false },
            { x: 535, y: 120, coletada: false },
            { x: 650, y: 345, coletada: false }
        ],
        inimigos: [
            { x: 440, y: 340, largura: 28, altura: 36, vel: 1.7, dir: -1, minX: 350, maxX: 680, tipo: "fantasma", hp: 2, maxHp: 2 },
            { x: 500, y: 125, largura: 28, altura: 30, vel: 1.0, dir: 1, minX: 490, maxX: 570, tipo: "slime", hp: 2, maxHp: 2 }
        ],
        portal: { x: 730, y: 310, largura: 46, altura: 70 }
    },
    {
        nome: "3. Castelo da Lua - CHEFE",
        corTopo: "#0f051d",
        corMeio: "#240b36",
        corBase: "#511845",
        corGrama: "#ffd700",
        corTerra: "#2c1654",
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 120, y: 285, largura: 130, altura: 18 },
            { x: 550, y: 285, largura: 130, altura: 18 },
            { x: 335, y: 205, largura: 130, altura: 18 }
        ],
        estrelas: [
            { x: 175, y: 250, coletada: false },
            { x: 390, y: 170, coletada: false },
            { x: 605, y: 250, coletada: false }
        ],
        inimigos: [
            { x: 520, y: 332, largura: 34, altura: 48, vel: 1.8, dir: -1, minX: 240, maxX: 720, tipo: "chefe", hp: 8, maxHp: 8, cooldownTiro: 120 },
            { x: 140, y: 249, largura: 28, altura: 36, vel: 1.1, dir: 1, minX: 120, maxX: 220, tipo: "fantasma", hp: 2, maxHp: 2 }
        ],
        portal: { x: 730, y: 310, largura: 46, altura: 70 }
    }
];

let plataformasAtuais = [];
let estrelasAtuais = [];
let inimigosAtuais = [];
let portalAtual = {};
let faseAtiva = fases[0];

function carregarFase(index) {
    if (index >= fases.length) {
        vitoria = true;
        mensagemEl.style.color = "#ffd700";
        mensagemEl.innerText = "✨ Parabéns! A Luna salvou todas as estrelas do céu! ✨";
        restartBtn.style.display = "block";
        return;
    }
    faseAtiva = fases[index];
    plataformasAtuais = JSON.parse(JSON.stringify(faseAtiva.plataformas));
    estrelasAtuais = JSON.parse(JSON.stringify(faseAtiva.estrelas));
    inimigosAtuais = JSON.parse(JSON.stringify(faseAtiva.inimigos));
    portalAtual = Object.assign({}, faseAtiva.portal);

    jogador.x = 40;
    jogador.y = 300;
    jogador.velY = 0;
    jogador.pulosRestantes = 2;
    magias = [];
    ataquesChefe = [];
    particulas = [];
}

function criarParticulas(x, y, cor, quantidade) {
    for (let i = 0; i < quantidade; i++) {
        particulas.push({
            x: x,
            y: y,
            velX: (Math.random() - 0.5) * 5,
            velY: (Math.random() - 0.5) * 5,
            raio: Math.random() * 4 + 2,
            vida: 28,
            cor: cor
        });
    }
}

function atualizar() {
    if (gameOver || vitoria) return;

    tempoGlobal += 0.05;
    if (mana < 100) mana += 0.14;

    // Movimento da Luna
    if (teclas["ArrowLeft"] || teclas["KeyA"]) {
        jogador.velX = -jogador.velocidade;
        jogador.direcao = -1;
        frameAnimacao += 0.18;
    } else if (teclas["ArrowRight"] || teclas["KeyD"]) {
        jogador.velX = jogador.velocidade;
        jogador.direcao = 1;
        frameAnimacao += 0.18;
    } else {
        jogador.velX = 0;
        frameAnimacao = 0;
    }

    jogador.velY += gravidade;
    jogador.x += jogador.velX;
    jogador.y += jogador.velY;

    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x + jogador.largura > canvas.width) jogador.x = canvas.width - jogador.largura;
    if (jogador.y > canvas.height) perderVida();

    // Colisão com Plataformas
    jogador.noChao = false;
    plataformasAtuais.forEach(function(plat) {
        if (jogador.x < plat.x + plat.largura &&
            jogador.x + jogador.largura > plat.x &&
            jogador.y + jogador.altura >= plat.y &&
            jogador.y + jogador.altura <= plat.y + jogador.velY + 5 &&
            jogador.velY >= 0) {
            jogador.noChao = true;
            jogador.pulosRestantes = 2; // Restaura o pulo duplo ao tocar o chão
            jogador.y = plat.y - jogador.altura;
            jogador.velY = 0;
        }
    });

    // Coletar Estrelas
    estrelasAtuais.forEach(function(est) {
        if (!est.coletada &&
            jogador.x < est.x + 16 &&
            jogador.x + jogador.largura > est.x - 16 &&
            jogador.y < est.y + 16 &&
            jogador.y + jogador.altura > est.y - 16) {
            est.coletada = true;
            pontos += 25;
            mana = Math.min(100, mana + 20);
            criarParticulas(est.x, est.y, "#ffd700", 14);
        }
    });

    // Passar pelo Portal Mágico
    if (inimigosAtuais.length === 0) {
        if (jogador.x < portalAtual.x + portalAtual.largura &&
            jogador.x + jogador.largura > portalAtual.x &&
            jogador.y < portalAtual.y + portalAtual.altura &&
            jogador.y + jogador.altura > portalAtual.y) {
            faseAtual++;
            carregarFase(faseAtual);
        }
    }

    // Atualizar Magias da Luna
    for (let i = magias.length - 1; i >= 0; i--) {
        let m = magias[i];
        m.x += m.velX;
        m.y += m.velY;

        if (m.x < 0 || m.x > canvas.width || m.y < 0 || m.y > canvas.height) {
            magias.splice(i, 1);
            continue;
        }

        for (let j = inimigosAtuais.length - 1; j >= 0; j--) {
            let ini = inimigosAtuais[j];
            if (m.x - m.raio < ini.x + ini.largura &&
                m.x + m.raio > ini.x &&
                m.y - m.raio < ini.y + ini.altura &&
                m.y + m.raio > ini.y) {
                ini.hp -= (m.super ? 2 : 1);
                magias.splice(i, 1);
                criarParticulas(ini.x + ini.largura / 2, ini.y + ini.altura / 2, m.super ? "#ff7eb3" : "#ffd700", 12);
                if (ini.hp <= 0) {
                    inimigosAtuais.splice(j, 1);
                    pontos += (ini.tipo === "chefe" ? 500 : 100);
                }
                break;
            }
        }
    }

    // Atualizar Ataques do Chefe
    for (let i = ataquesChefe.length - 1; i >= 0; i--) {
        let atk = ataquesChefe[i];
        atk.x += atk.velX;
        if (atk.x < 0 || atk.x > canvas.width) {
            ataquesChefe.splice(i, 1);
            continue;
        }
        if (!jogador.invulneravel &&
            atk.x - atk.raio < jogador.x + jogador.largura - 4 &&
            atk.x + atk.raio > jogador.x + 4 &&
            atk.y - atk.raio < jogador.y + jogador.altura - 4 &&
            atk.y + atk.raio > jogador.y + 4) {
            ataquesChefe.splice(i, 1);
            perderVida();
        }
    }

    // Atualizar Inimigos
    inimigosAtuais.forEach(function(ini) {
        ini.x += ini.vel * ini.dir;
        if (ini.x <= ini.minX || ini.x + ini.largura >= ini.maxX) {
            ini.dir *= -1;
        }

        // Chefe dispara orbes sombrios de tempos em tempos
        if (ini.tipo === "chefe") {
            ini.cooldownTiro--;
            if (ini.cooldownTiro <= 0) {
                let direcaoParaLuna = jogador.x < ini.x ? -1 : 1;
                ataquesChefe.push({
                    x: ini.x + ini.largura / 2,
                    y: ini.y + 24,
                    velX: 4.2 * direcaoParaLuna,
                    raio: 8
                });
                ini.cooldownTiro = 130;
            }
        }

        if (!jogador.invulneravel &&
            jogador.x + 5 < ini.x + ini.largura - 5 &&
            jogador.x + jogador.largura - 5 > ini.x + 5 &&
            jogador.y + 5 < ini.y + ini.altura &&
            jogador.y + jogador.altura > ini.y + 5) {
            perderVida();
        }
    });

    // Atualizar Partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
        let p = particulas[i];
        p.x += p.velX;
        p.y += p.velY;
        p.vida--;
        if (p.vida <= 0) particulas.splice(i, 1);
    }
}

function perderVida() {
    vidas--;
    criarParticulas(jogador.x + 14, jogador.y + 20, "#ff4d6d", 16);
    if (vidas <= 0) {
        gameOver = true;
        mensagemEl.style.color = "#ff758c";
        mensagemEl.innerText = "A magia acabou! Tente novamente!";
        restartBtn.style.display = "block";
    } else {
        jogador.x = 40;
        jogador.y = 300;
        jogador.velY = 0;
        jogador.pulosRestantes = 2;
        jogador.invulneravel = true;
        setTimeout(function() { jogador.invulneravel = false; }, 1500);
    }
}

function reiniciarJogo() {
    vidas = 3;
    pontos = 0;
    mana = 100;
    faseAtual = 0;
    gameOver = false;
    vitoria = false;
    mensagemEl.innerText = "";
    restartBtn.style.display = "none";
    carregarFase(faseAtual);
    ultimoTempo = performance.now();
    requestAnimationFrame(loop);
}

// DESENHAR CÉU, LUA E ESTRELAS
function desenharCenario() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, faseAtiva.corTopo);
    grad.addColorStop(0.55, faseAtiva.corMeio);
    grad.addColorStop(1, faseAtiva.corBase);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lua Cheia Mágica
    ctx.fillStyle = "rgba(255, 250, 205, 0.9)";
    ctx.beginPath();
    ctx.arc(680, 75, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 250, 205, 0.2)";
    ctx.beginPath();
    ctx.arc(680, 75, 48 + Math.sin(tempoGlobal) * 4, 0, Math.PI * 2);
    ctx.fill();

    // Estrelas piscando
    estrelasFundo.forEach(function(e) {
        let alfa = 0.4 + Math.sin(tempoGlobal * 2 + e.brilho) * 0.5;
        ctx.fillStyle = "rgba(255, 255, 255, " + Math.max(0.1, alfa) + ")";
        ctx.fillRect(e.x, e.y, e.tamanho, e.tamanho);
    });
}

// DESENHAR PORTAL MÁGICO
function desenharPortal() {
    let x = portalAtual.x;
    let y = portalAtual.y;
    let aberto = inimigosAtuais.length === 0;

    // Arco de pedra/ouro
    ctx.fillStyle = aberto ? "#ffd700" : "#5c5470";
    ctx.fillRect(x, y + 10, 8, 60);
    ctx.fillRect(x + 38, y + 10, 8, 60);
    ctx.fillRect(x + 4, y, 38, 10);

    if (aberto) {
        ctx.fillStyle = "rgba(255, 126, 179, " + (0.5 + Math.sin(tempoGlobal * 3) * 0.2) + ")";
        ctx.fillRect(x + 8, y + 10, 30, 60);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 21, y + 15 + Math.sin(tempoGlobal * 4) * 5, 4, 4);
    }
}

// DESENHAR ESTRELA COLETÁVEL
function desenharEstrela(est) {
    if (est.coletada) return;
    let flutuacao = Math.sin(tempoGlobal * 3 + est.x) * 4;
    let x = est.x;
    let y = est.y + flutuacao;

    ctx.fillStyle = "#ffd700";
    ctx.fillRect(x - 2, y - 8, 4, 16);
    ctx.fillRect(x - 8, y - 2, 16, 4);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 2, y - 2, 4, 4);
}

// DESENHAR LUNA (FEITICEIRA EM PIXEL ART)
function desenharLuna(x, y, dir, anim) {
    if (jogador.invulneravel && Math.floor(Date.now() / 100) % 2 === 0) return;

    ctx.save();
    if (dir === -1) {
        ctx.translate(x + 28, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    let passo = Math.sin(anim) * 3.5;
    if (!jogador.noChao) passo = 3;

    // 1. Botinhas e Pernas
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(x + 8 - passo, y + 31, 4, 7);
    ctx.fillRect(x + 16 + passo, y + 31, 4, 7);
    ctx.fillStyle = "#4a154b";
    ctx.fillRect(x + 7 - passo, y + 38, 6, 4);
    ctx.fillRect(x + 15 + passo, y + 38, 6, 4);

    // 2. Cabelo Longo Rosa Pastel (Atrás)
    ctx.fillStyle = "#ff8fab";
    ctx.fillRect(x + 3, y + 10, 8, 18 + Math.sin(tempoGlobal * 3) * 2);

    // 3. Vestido Mágico Roxo com Detalhe Dourado
    ctx.fillStyle = "#7b2cbf";
    ctx.fillRect(x + 7, y + 18, 14, 13);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(x + 7, y + 29, 14, 2);

    // 4. Rosto e Olho Brilhante
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(x + 8, y + 8, 13, 10);
    ctx.fillStyle = "#3a86ff"; // Olho azul
    ctx.fillRect(x + 17, y + 12, 3, 3);
    ctx.fillStyle = "#ff758c"; // Bochecha rosada
    ctx.fillRect(x + 14, y + 15, 2, 2);

    // 5. Chapéu de Bruxa Estelar
    ctx.fillStyle = "#3c096c";
    ctx.fillRect(x + 3, y + 7, 22, 3); // Aba do chapéu
    ctx.fillRect(x + 7, y + 3, 14, 4);
    ctx.fillRect(x + 9, y - 1, 9, 4);
    ctx.fillRect(x + 7, y - 4, 6, 3); // Ponta dobrada
    ctx.fillStyle = "#ffd700"; // Fivela dourada
    ctx.fillRect(x + 14, y + 5, 4, 2);

    // 6. Braço e Cajado Mágico
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(x + 13 - passo, y + 20, 7, 4);
    ctx.fillStyle = "#d4a373"; // Cabo do cajado
    ctx.fillRect(x + 21 - passo, y + 12, 2, 20);
    ctx.fillStyle = "#ffd700"; // Estrela na ponta do cajado
    ctx.fillRect(x + 19 - passo, y + 9, 6, 6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 21 - passo, y + 11, 2, 2);

    ctx.restore();
}

// DESENHAR INIMIGOS E CHEFE
function desenharInimigo(ini) {
    let x = ini.x;
    let y = ini.y;

    if (ini.tipo === "slime") {
        let pulo = Math.abs(Math.sin(tempoGlobal * 3 + x)) * 4;
        ctx.fillStyle = "#9d4edd";
        ctx.fillRect(x + 2, y + 8 - pulo, 24, 22 + pulo);
        ctx.fillStyle = "#e0aaff";
        ctx.fillRect(x + 6, y + 11 - pulo, 6, 4);
        // Olhinhos
        ctx.fillStyle = "#fff";
        let olhoX = ini.dir === 1 ? x + 15 : x + 6;
        ctx.fillRect(olhoX, y + 16 - pulo, 3, 4);
        ctx.fillRect(olhoX + 5, y + 16 - pulo, 3, 4);
    } else if (ini.tipo === "fantasma") {
        let flutua = Math.sin(tempoGlobal * 2.5 + x) * 4;
        ctx.fillStyle = "#2b2d42";
        ctx.fillRect(x + 4, y + 4 + flutua, 20, 26);
        ctx.fillRect(x + 4, y + 30 + flutua, 5, 5);
        ctx.fillRect(x + 12, y + 30 + flutua, 5, 5);
        ctx.fillRect(x + 19, y + 30 + flutua, 5, 5);
        // Olhos brilhantes
        ctx.fillStyle = "#ffd700";
        let olhoX = ini.dir === 1 ? x + 14 : x + 7;
        ctx.fillRect(olhoX, y + 12 + flutua, 3, 3);
        ctx.fillRect(olhoX + 5, y + 12 + flutua, 3, 3);
    } else if (ini.tipo === "chefe") {
        // Lorde Eclipse
        let flutua = Math.sin(tempoGlobal * 2) * 3;
        ctx.fillStyle = "#10002b";
        ctx.fillRect(x + 4, y + 14 + flutua, 26, 32); // Manto
        ctx.fillStyle = "#5a189a";
        ctx.fillRect(x + 8, y + 16 + flutua, 18, 28);
        // Cabeça e Coroa de Lua
        ctx.fillStyle = "#240046";
        ctx.fillRect(x + 9, y + 2 + flutua, 16, 12);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x + 12, y - 4 + flutua, 10, 5);
        // Olhos vermelhos
        ctx.fillStyle = "#ff0055";
        let olhoX = ini.dir === 1 ? x + 17 : x + 11;
        ctx.fillRect(olhoX, y + 6 + flutua, 3, 3);
        ctx.fillRect(olhoX + 5, y + 6 + flutua, 3, 3);
    }

    // Barra de vida
    if (ini.maxHp > 1) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x, y - 10, ini.largura, 4);
        ctx.fillStyle = "#ff4d6d";
        ctx.fillRect(x, y - 10, (ini.hp / ini.maxHp) * ini.largura, 4);
    }
}

function desenhar() {
    desenharCenario();
    desenharPortal();

    // Plataformas Mágicas
    plataformasAtuais.forEach(function(p) {
        ctx.fillStyle = faseAtiva.corTerra;
        ctx.fillRect(p.x, p.y + 6, p.largura, p.altura - 6);
        ctx.fillStyle = faseAtiva.corGrama;
        ctx.fillRect(p.x, p.y, p.largura, 6);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    });

    estrelasAtuais.forEach(function(est) {
        desenharEstrela(est);
    });

    inimigosAtuais.forEach(function(ini) {
        desenharInimigo(ini);
    });

    // Magias da Luna
    magias.forEach(function(m) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.raio, 0, Math.PI * 2);
        ctx.fillStyle = m.super ? "#ff7eb3" : "#ffd700";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.raio * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    });

    // Ataques do Chefe
    ataquesChefe.forEach(function(atk) {
        ctx.beginPath();
        ctx.arc(atk.x, atk.y, atk.raio, 0, Math.PI * 2);
        ctx.fillStyle = "#9d4edd";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(atk.x, atk.y, atk.raio * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff0055";
        ctx.fill();
    });

    // Partículas
    particulas.forEach(function(p) {
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    });

    desenharLuna(jogador.x, jogador.y, jogador.direcao, frameAnimacao);

    // Painel de Status (HUD)
    ctx.fillStyle = "rgba(20, 10, 40, 0.75)";
    ctx.fillRect(10, 10, 225, 102);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 225, 102);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Segoe UI, Arial";
    ctx.fillText(faseAtiva.nome, 20, 30);
    ctx.fillText("Pontos: " + pontos + "   |   Vidas: " + "❤️".repeat(vidas), 20, 52);

    ctx.fillText("Mana Mágica (Tecla R):", 20, 74);
    ctx.fillStyle = "#2b194d";
    ctx.fillRect(20, 80, 195, 12);
    ctx.fillStyle = mana >= 50 ? "#ff7eb3" : "#9d4edd";
    ctx.fillRect(20, 80, (mana / 100) * 195, 12);

    if (inimigosAtuais.length > 0) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 13px Segoe UI, Arial";
        ctx.fillText("Derrote os monstros para abrir o portal ✨", 510, 25);
    }
}

function loop(tempoAtual) {
    if (gameOver || vitoria) return;
    requestAnimationFrame(loop);

    if (!ultimoTempo) ultimoTempo = tempoAtual;
    const decorrido = tempoAtual - ultimoTempo;

    if (decorrido >= fpsIntervalo) {
        ultimoTempo = tempoAtual - (decorrido % fpsIntervalo);
        atualizar();
        desenhar();
    }
}

carregarFase(0);
requestAnimationFrame(loop);
// FIM DO CÓDIGO
