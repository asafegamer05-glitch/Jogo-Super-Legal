// Motor de Jogo 2D Top-Down - "jogo super legal" (ilha inicial, ilha dps da inicial, 3ª ilha)

(function () {
    // ==========================================
    // 1. ESPADAS PRÉ-DEFINIDAS NO CÓDIGO
    // ==========================================
    window.PREDEFINED_WEAPONS = {
        "espada espada": { name: "espada espada", damage: 15, range: 45, icon: "🗡️", color: "#cccccc" },
        "espada melhor": { name: "espada melhor", damage: 30, range: 55, icon: "⚔️", color: "#3498db" },
        "espada mais melhor": { name: "espada mais melhor", damage: 50, range: 65, icon: "🗡️✨", color: "#9b59b6" },
        "espada muito mais melhor": { name: "espada muito mais melhor", damage: 100, range: 85, icon: "🔥🗡️", color: "#f1c40f" },
        "espada ultimate": { name: "espada ultimate", damage: 250, range: 100, icon: "⚡🗡️", color: "#d154ff" }
    };

    // ==========================================
    // 2. LOADER DE SPRITES
    // ==========================================
    const spriteNames = [
        'player_idle', 'player_walk',
        'enemy_idle', 'enemy_walk',
        'enemy_melhor_idle', 'enemy_melhor_walk',
        'enemy_mais_melhor_idle', 'enemy_mais_melhor_walk',
        'enemy_gelo_idle', 'enemy_gelo_walk',
        'enemy_lava_idle', 'enemy_lava_walk',
        'boss_idle', 'boss_walk',
        'quest_npc', 'quest_npc_2', 'troll_npc', 'port_npc', 'npc',
        'shop_npc', 'lootbox_npc', 'island2_npc1', 'island2_npc2', 'npc_importante',
        'ferreiro_npc', 'sense_npc', 'ice_village_npc', 'lava_village_npc'
    ];

    const sprites = {};
    const loadedSprites = {};

    spriteNames.forEach(key => {
        sprites[key] = new Image();
        sprites[key].src = `assets/sprites/${key}.png`;
        sprites[key].onload = () => { loadedSprites[key] = true; };
        sprites[key].onerror = () => { loadedSprites[key] = false; };
    });

    // ==========================================
    // 3. ESTADO DO JOGO E PLAYER
    // ==========================================
    const TILE_SIZE = 40;
    
    let currentIsland = 'ilha inicial';
    let isGodMode = false;
    let animTimeCounter = 0;
    const dodgeEffects = [];

    const player = {
        spawnX: 300,
        spawnY: 350,
        x: 300,
        y: 350,
        width: 32,
        height: 32,
        speed: 4.8,
        facing: 'down',
        isMoving: false,
        animTimer: 0,
        walkFrame: 0,
        
        // Dash
        isDashing: false,
        dashTimer: 0,
        dashCooldown: 0,

        // Senso Super Legal
        hasSenseUnlocked: false,
        senseEnabled: false,
        senseCharges: 5,
        senseMaxCharges: 5,
        senseRechargeTimer: 0,
        
        // Atributos
        hp: 100,
        maxHp: 100,
        level: 1,
        money: 150,
        weapon: window.PREDEFINED_WEAPONS["espada espada"],
        invincibleTimer: 0,
        
        // Quests
        questState: 'not_started',
        questCount: 0,
        bandidosKilled: 0,
        bandidosTarget: 4,

        // Ilha 2 - 3 Quests
        quest2State: 'not_started',
        quest2Type: null,
        quest2Killed: 0,
        quest2Target: 4,

        // Ilha 3 Quest (Senso)
        quest3State: 'not_started',
        island3Killed: 0,
        island3Target: 20,

        // Storyline Item Chain
        storyStep: 0,
        hasSpecialItem: false,
        hasArtefact: false,
        hasKrakenToken: false,

        // Ataque
        isAttacking: false,
        attackTimer: 0
    };
    window._localPlayer = player;

    const keys = {};
    const joystickState = {
        active: false,
        x: 0,
        y: 0
    };
    let joystickTouchId = null;

    // ==========================================
    // 4. MAPAS DAS ILHAS
    // ==========================================
    
    // MAPA 1: ILHA INICIAL (32x24)
    const mapGridIsland1 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,3,0,0],
        [0,0,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,3,0,0],
        [0,0,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,3,0,0],
        [0,0,1,1,1,2,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,0,0],
        [0,0,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];

    // MAPA 2: ILHA DPS DA INICIAL (64x48)
    function generateIsland2Grid() {
        const rows = 48;
        const cols = 64;
        const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

        for (let r = 4; r < rows - 4; r++) {
            for (let c = 4; c < cols - 4; c++) {
                const distFromCenter = Math.hypot((c - 32) / 26, (r - 24) / 18);
                const noise = Math.sin(r / 2.5) * 0.08 + Math.cos(c / 3.5) * 0.08;

                if (distFromCenter + noise < 0.95) {
                    if (c >= 33) grid[r][c] = 4;
                    else grid[r][c] = 1;
                }
            }
        }

        for (let r = 4; r <= 6; r++) {
            for (let c = 2; c <= 5; c++) grid[r][c] = 3;
        }

        for (let c = 5; c <= 33; c++) grid[6][c] = 2;
        for (let r = 6; r <= 24; r++) grid[r][16] = 2;
        for (let c = 16; c <= 33; c++) grid[18][c] = 2;

        for (let c = 33; c <= 56; c++) grid[18][c] = 5;
        for (let r = 10; r <= 38; r++) grid[r][46] = 5;
        for (let c = 33; c <= 46; c++) grid[10][c] = 5;

        for (let r = 6; r <= 14; r++) {
            for (let c = 44; c <= 56; c++) grid[r][c] = 5;
        }

        for (let r = 34; r <= 40; r++) {
            for (let c = 40; c <= 50; c++) grid[r][c] = 5;
        }

        return grid;
    }

    // MAPA 3: 3ª ILHA (64x48)
    function generateIsland3Grid() {
        const rows = 48;
        const cols = 64;
        const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

        for (let r = 4; r < rows - 4; r++) {
            for (let c = 4; c < cols - 4; c++) {
                const distFromCenter = Math.hypot((c - 32) / 25, (r - 24) / 19);
                const noise = Math.cos(r / 3.0) * 0.07 + Math.sin(c / 2.5) * 0.07;

                if (distFromCenter + noise < 0.94) {
                    if (c <= 32) grid[r][c] = 6; // Gelo
                    else grid[r][c] = 7; // Lava
                }
            }
        }

        // Porto de Madeira
        for (let r = 4; r <= 7; r++) {
            for (let c = 2; c <= 10; c++) grid[r][c] = 3;
        }

        for (let r = 4; r <= 14; r++) {
            for (let c = 4; c <= 16; c++) {
                if (grid[r][c] === 0) grid[r][c] = 6;
            }
        }

        // Estradas principais
        for (let c = 5; c <= 60; c++) grid[12][c] = 2;
        for (let r = 6; r <= 36; r++) grid[r][16] = 2;
        for (let r = 12; r <= 36; r++) grid[r][48] = 2;

        return grid;
    }

    const mapGridIsland2 = generateIsland2Grid();
    const mapGridIsland3 = generateIsland3Grid();

    const worldObjectsIsland1 = [
        { type: 'house', x: 180, y: 120, w: 100, h: 80, color: '#8e44ad' },
        { type: 'house', x: 420, y: 120, w: 100, h: 80, color: '#d35400' },
        { type: 'sign', x: 340, y: 220, w: 32, h: 32, label: 'ilha inicial' },
        { type: 'tree', x: 120, y: 280, radius: 24 },
        { type: 'tree', x: 140, y: 400, radius: 24 },
        { type: 'tree', x: 260, y: 640, radius: 24 },
        { type: 'tree', x: 580, y: 220, radius: 24 },
        { type: 'tree', x: 620, y: 480, radius: 24 },
        { type: 'tree', x: 740, y: 160, radius: 24 },
        { type: 'tree', x: 880, y: 380, radius: 24 },
        { type: 'tree', x: 500, y: 720, radius: 24 }
    ];

    const worldObjectsIsland2 = [
        { type: 'house', x: 480, y: 320, w: 120, h: 90, color: '#2980b9' },
        { type: 'house', x: 960, y: 320, w: 120, h: 90, color: '#27ae60' },
        { type: 'house', x: 380, y: 620, w: 100, h: 80, color: '#8e44ad' },
        { type: 'house', x: 780, y: 720, w: 100, h: 80, color: '#d35400' },
        { type: 'house', x: 1420, y: 620, w: 110, h: 85, color: '#e67e22' },
        { type: 'house', x: 1680, y: 920, w: 110, h: 85, color: '#c0392b' },

        { type: 'sign', x: 320, y: 240, w: 32, h: 32, label: 'ilha dps da inicial' },
        { type: 'tree', x: 220, y: 420, radius: 24 },
        { type: 'tree', x: 300, y: 680, radius: 24 },
        { type: 'tree', x: 720, y: 600, radius: 24 },
        { type: 'tree', x: 1100, y: 720, radius: 24 },

        { type: 'cactus', x: 1440, y: 400, radius: 20 },
        { type: 'cactus', x: 1600, y: 640, radius: 20 },
        { type: 'rock', x: 1780, y: 380, radius: 28 },
        { type: 'cactus', x: 1920, y: 800, radius: 20 },
        { type: 'rock', x: 2100, y: 600, radius: 32 },
        { type: 'sign', x: 1800, y: 320, w: 32, h: 32, label: 'ARENA DO BOSS BOSS' },

        { type: 'temple', x: 1800, y: 1500, w: 160, h: 100 }
    ];

    // OBJETOS DA 3ª ILHA (VILA DE LAVA COM MUITO MAIS CASAS!)
    const worldObjectsIsland3 = [
        // Mini Vila de Gelo (Oeste)
        { type: 'house', x: 440, y: 360, w: 110, h: 85, color: '#00bcd4' },
        { type: 'house', x: 680, y: 360, w: 110, h: 85, color: '#03a9f4' },
        { type: 'house', x: 560, y: 620, w: 100, h: 80, color: '#0288d1' },
        { type: 'house', x: 820, y: 620, w: 100, h: 80, color: '#0097a7' },
        { type: 'sign', x: 320, y: 240, w: 32, h: 32, label: '3ª ilha - vila de gelo' },

        // Mini Vila de Lava Expandida (Leste - MUITO MAIS CASAS!)
        { type: 'house', x: 1720, y: 360, w: 110, h: 85, color: '#e74c3c' },
        { type: 'house', x: 1960, y: 360, w: 110, h: 85, color: '#c0392b' },
        { type: 'house', x: 1600, y: 620, w: 110, h: 85, color: '#d35400' },
        { type: 'house', x: 1840, y: 620, w: 110, h: 85, color: '#b71c1c' },
        { type: 'house', x: 2080, y: 620, w: 110, h: 85, color: '#880e4f' },
        { type: 'house', x: 1720, y: 880, w: 110, h: 85, color: '#e65100' },
        { type: 'house', x: 1960, y: 880, w: 110, h: 85, color: '#bf360c' },
        { type: 'sign', x: 1600, y: 240, w: 32, h: 32, label: '3ª ilha - grande vila de lava' },

        // Decorações
        { type: 'rock', x: 300, y: 600, radius: 30 },
        { type: 'rock', x: 800, y: 700, radius: 30 },
        { type: 'rock', x: 1600, y: 700, radius: 30 },
        { type: 'rock', x: 2100, y: 600, radius: 30 }
    ];

    // NPCS DA ILHA INICIAL
    const npcsIsland1 = [
        {
            id: 'npc',
            name: 'npc',
            x: 220,
            y: 280,
            spriteKey: 'npc',
            color: '#3498db',
            facing: 'right',
            interact: () => {
                if (player.level < 13) {
                    showDialog('npc', 'Eu sou um npc. Volte aqui quando alcançar o NÍVEL 13.', [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else if (player.storyStep === 0) {
                    player.storyStep = 1;
                    showDialog('npc', 'Incrível! Você alcançou o NÍVEL 13! Preciso da sua ajuda: viaje até a 3ª ilha, fale com o Ferreiro e pegue o "item especial" para mim.', [
                        { text: 'ACEITAR MISSÃO DE NÍVEL 13', action: closeDialog }
                    ]);
                } else if (player.storyStep === 1) {
                    showDialog('npc', 'Vá até a 3ª ilha e pegue o "item especial" com o Ferreiro!', [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else if (player.storyStep === 2) {
                    player.storyStep = 3;
                    player.hasSpecialItem = false;
                    player.hasArtefact = true;
                    showDialog('npc', 'Você trouxe o item especial! Tome este Artefato Antigo. Leve-o até o templo antigo no sul da 2ª ilha e coloque-o no Altar para liberar o segredo!', [
                        { text: 'RECEBER ARTEFATO ANTIGO', action: closeDialog }
                    ]);
                } else if (player.storyStep === 3) {
                    showDialog('npc', 'Leve o Artefato Antigo até o templo na 2ª ilha e coloque no Altar!', [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else {
                    showDialog('npc', 'Você libertou o segredo do templo! O Token do Kraken é seu.', [{ text: 'FECHAR', action: closeDialog }]);
                }
            }
        },
        {
            id: 'quest_npc',
            name: 'Quest NPC',
            x: 520,
            y: 320,
            spriteKey: 'quest_npc',
            color: '#f1c40f',
            facing: 'left',
            interact: () => {
                if (player.questState === 'not_started') {
                    showDialog('Quest NPC', 'Preciso que você elimine 4 bandidos na área de inimigos. Recompensa: +1 Level e R$ 100!', [
                        { text: 'ACEITAR MISSÃO', action: () => { player.questState = 'in_progress'; closeDialog(); updateHud(); } },
                        { text: 'RECUSAR', action: closeDialog }
                    ]);
                } else if (player.questState === 'in_progress') {
                    showDialog('Quest NPC', `Você derrotou ${player.bandidosKilled}/${player.bandidosTarget} bandidos. Elimine o restante!`, [
                        { text: 'CONTINUAR', action: closeDialog }
                    ]);
                } else if (player.questState === 'ready_to_claim') {
                    player.questCount++;
                    player.level += 1;
                    player.maxHp = 100 + (player.level - 1) * 5;
                    player.hp = player.maxHp;
                    player.questState = 'not_started';
                    player.bandidosKilled = 0;

                    if (player.questCount === 1) {
                        player.money += 100;
                        showDialog('Quest NPC', 'Incrível! Recompensa: +1 Level e R$ 100!', [
                            { text: 'RECEBER RECOMPENSA', action: () => { closeDialog(); updateHud(); } }
                        ]);
                    } else {
                        player.money += 150;
                        showDialog('Quest NPC', `Excelente! Recompensa: +1 Level (Nível ${player.level}) e R$ 150!`, [
                            { text: 'RECEBER RECOMPENSA', action: () => { closeDialog(); updateHud(); } }
                        ]);
                    }
                }
            }
        },
        {
            id: 'troll_npc',
            name: 'npc super realmente muito literalmente util',
            x: 340,
            y: 520,
            spriteKey: 'troll_npc',
            color: '#e67e22',
            facing: 'right',
            interact: () => {
                showDialog('npc super realmente muito literalmente util', 'Me dá 100 reais?', [
                    {
                        text: 'SIM (Dar R$ 100)',
                        action: () => {
                            if (player.money >= 100) {
                                player.money -= 100;
                                updateHud();
                                showDialog('npc super realmente muito literalmente util', 'Você deu 100 reais e não ganhou nada.', [
                                    { text: '...OK', action: closeDialog }
                                ]);
                            } else {
                                showDialog('npc super realmente muito literalmente util', 'Você nem tem 100 reais!', [
                                    { text: 'SAIR', action: closeDialog }
                                ]);
                            }
                        }
                    },
                    { text: 'NÃO', action: () => { showDialog('npc super realmente muito literalmente util', 'Pão duro.', [{ text: 'SAIR', action: closeDialog }]); } }
                ]);
            }
        },
        {
            id: 'port_npc',
            name: 'NPC do Porto',
            x: 1060,
            y: 200,
            spriteKey: 'port_npc',
            color: '#1abc9c',
            facing: 'left',
            interact: () => {
                const options = [];
                if (player.level >= 5) {
                    options.push({ text: "VIAJAR PARA A ILHA DPS DA INICIAL (NÍVEL 5+)", action: () => { closeDialog(); switchIsland('ilha dps da inicial'); } });
                }
                if (player.level >= 20) {
                    options.push({ text: "VIAJAR PARA A 3ª ILHA (NÍVEL 20+)", action: () => { closeDialog(); switchIsland('3ª ilha'); } });
                }

                if (options.length === 0) {
                    showDialog('NPC do Porto', `Você precisa de NÍVEL 5 para a 2ª Ilha e NÍVEL 20 para a 3ª Ilha! Seu nível atual é NÍVEL ${player.level}.`, [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else {
                    options.push({ text: "FICAR AQUI", action: closeDialog });
                    showDialog('NPC do Porto', "Escolha o seu destino de viagem:", options);
                }
            }
        }
    ];

    // NPCS DA 2ª ILHA
    const npcsIsland2 = [
        {
            id: 'port_npc_2',
            name: 'NPC do Porto (Retorno)',
            x: 160,
            y: 240,
            spriteKey: 'port_npc',
            color: '#1abc9c',
            facing: 'right',
            interact: () => {
                showDialog('NPC do Porto', "Deseja retornar para a 'ilha inicial'?", [
                    { text: "VOLTAR PARA A ILHA INICIAL", action: () => { closeDialog(); switchIsland('ilha inicial'); } },
                    { text: "FICAR AQUI", action: closeDialog }
                ]);
            }
        },
        {
            id: 'quest_npc_2',
            name: 'Quest NPC da 2ª Ilha',
            x: 720,
            y: 470,
            spriteKey: 'quest_npc_2',
            color: '#f39c12',
            facing: 'left',
            interact: () => {
                if (player.quest2State === 'ready_to_claim') {
                    let levelGain = 2;
                    let moneyGain = 200;

                    if (player.quest2Type === 'mais_melhor') {
                        levelGain = 3;
                        moneyGain = 350;
                    } else if (player.quest2Type === 'boss') {
                        levelGain = 5;
                        moneyGain = 800;
                    }

                    player.level += levelGain;
                    player.maxHp = 100 + (player.level - 1) * 5;
                    player.hp = player.maxHp;
                    player.money += moneyGain;
                    player.quest2State = 'not_started';
                    player.quest2Killed = 0;

                    showDialog('Quest NPC da 2ª Ilha', `Parabéns pela vitória! Recompensa da Missão: +${levelGain} LEVEIS (Você foi para o Nível ${player.level}) e +R$ ${moneyGain}!`, [
                        { text: 'RECEBER RECOMPENSA SUPREMA', action: () => { closeDialog(); updateHud(); } }
                    ]);
                    return;
                }

                if (player.quest2State === 'in_progress') {
                    showDialog('Quest NPC da 2ª Ilha', `Você eliminou ${player.quest2Killed}/${player.quest2Target} alvos do tipo '${player.quest2Type}'. Continue a caça!`, [
                        { text: 'CONTINUAR', action: closeDialog }
                    ]);
                    return;
                }

                showDialog('Quest NPC da 2ª Ilha', 'Escolha qual missão você deseja realizar (Inimigos mais fortes concedem MAIS LEVEIS!):', [
                    {
                        text: '1. Matar 4 Inimigos Melhores (+2 LEVEIS & R$ 200)',
                        action: () => { player.quest2State = 'in_progress'; player.quest2Type = 'melhor'; player.quest2Killed = 0; player.quest2Target = 4; closeDialog(); updateHud(); }
                    },
                    {
                        text: '2. Matar 4 Inimigos Mais Melhores (+3 LEVEIS & R$ 350)',
                        action: () => { player.quest2State = 'in_progress'; player.quest2Type = 'mais_melhor'; player.quest2Killed = 0; player.quest2Target = 4; closeDialog(); updateHud(); }
                    },
                    {
                        text: '3. Matar 1 Boss Boss (+5 LEVEIS & R$ 800)',
                        action: () => { player.quest2State = 'in_progress'; player.quest2Type = 'boss'; player.quest2Killed = 0; player.quest2Target = 1; closeDialog(); updateHud(); }
                    },
                    { text: 'SAIR', action: closeDialog }
                ]);
            }
        },
        {
            id: 'shop_npc',
            name: 'Vendedor de Espadas',
            x: 540,
            y: 470,
            spriteKey: 'shop_npc',
            color: '#3498db',
            facing: 'down',
            interact: openShopModal
        },
        {
            id: 'lootbox_npc',
            name: 'NPC do Cassino de Lootbox',
            x: 1020,
            y: 470,
            spriteKey: 'lootbox_npc',
            color: '#9b59b6',
            facing: 'down',
            interact: openLootboxModal
        },
        {
            id: 'island2_npc1',
            name: 'Morador da 2ª Ilha',
            x: 640,
            y: 560,
            spriteKey: 'island2_npc1',
            color: '#e74c3c',
            facing: 'right',
            interact: () => { showDialog('Morador da 2ª Ilha', "Esta é a ilha dps da inicial!", [{ text: 'ENTENDIDO', action: closeDialog }]); }
        },
        {
            id: 'island2_npc2',
            name: 'Turista do Deserto',
            x: 1240,
            y: 740,
            spriteKey: 'island2_npc2',
            color: '#16a085',
            facing: 'left',
            interact: () => { showDialog('Turista do Deserto', "Cuidado ao cruzar para o bioma de deserto!", [{ text: 'ENTENDIDO', action: closeDialog }]); }
        },
        {
            id: 'npc_importante',
            name: 'npc importante',
            x: 1800,
            y: 1540,
            spriteKey: 'npc_importante',
            color: '#9b59b6',
            facing: 'down',
            interact: () => {
                if (player.hasArtefact) {
                    player.hasArtefact = false;
                    player.hasKrakenToken = true;
                    player.storyStep = 4;
                    worldObjectsIsland2.push({ type: 'chest', x: 640, y: 500, w: 40, h: 40 });
                    showDialog('npc importante', 'Você colocou o Artefato Antigo no Altar! O Templo brilhou e um BAÚ apareceu no centro da ilha contendo o TOKEN DO KRAKEN!', [
                        { text: 'PEGAR TOKEN DO KRAKEN', action: closeDialog }
                    ]);
                } else if (player.hasKrakenToken) {
                    showDialog('npc importante', 'O Token do Kraken já é seu. Guarde-o para o futuro!', [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else {
                    showDialog('npc importante', "Este é um templo muito antigo. Reza a lenda que um dia algum caba aleatório vai levar um troço doido pra cá.", [{ text: 'ENTENDIDO', action: closeDialog }]);
                }
            }
        }
    ];

    // NPCS DA 3ª ILHA
    const npcsIsland3 = [
        {
            id: 'port_npc_3',
            name: 'NPC do Porto (Retorno)',
            x: 160,
            y: 240,
            spriteKey: 'port_npc',
            color: '#1abc9c',
            facing: 'right',
            interact: () => {
                showDialog('NPC do Porto', "Deseja retornar para a 'ilha inicial'?", [
                    { text: "VOLTAR PARA A ILHA INICIAL", action: () => { closeDialog(); switchIsland('ilha inicial'); } },
                    { text: "FICAR AQUI", action: closeDialog }
                ]);
            }
        },
        {
            id: 'ferreiro_npc',
            name: 'Ferreiro',
            x: 495,
            y: 480,
            spriteKey: 'ferreiro_npc',
            color: '#e67e22',
            facing: 'down',
            interact: () => {
                if (player.storyStep === 1) {
                    player.storyStep = 2;
                    player.hasSpecialItem = true;
                    showDialog('Ferreiro', 'Ah, o npc te enviou! Aqui está o "item especial" (Peça do Templo). Leve de volta para ele na ilha inicial!', [
                        { text: 'PEGAR ITEM ESPECIAL', action: closeDialog }
                    ]);
                } else {
                    showDialog('Ferreiro', 'Eu sou o Ferreiro da vila de gelo. Eu odeio a vila de lava!', [{ text: 'ENTENDIDO', action: closeDialog }]);
                }
            }
        },
        {
            id: 'sense_npc',
            name: 'Mestre do Senso',
            x: 735,
            y: 480,
            spriteKey: 'sense_npc',
            color: '#d154ff',
            facing: 'left',
            interact: () => {
                if (player.hasSenseUnlocked) {
                    showDialog('Mestre do Senso', 'Você já possui a habilidade "Senso Super Legal"! Pressione Y para ativar e desativar.', [{ text: 'ENTENDIDO', action: closeDialog }]);
                } else if (player.quest3State === 'not_started') {
                    showDialog('Mestre do Senso', 'Elimine 20 inimigos na 3ª Ilha (Gelo ou Lava) e te darei +8 LEVEIS, R$ 1.500 e a habilidade "Senso Super Legal"!', [
                        { text: 'ACEITAR MISSÃO DO SENSO (+8 LEVEIS)', action: () => { player.quest3State = 'in_progress'; closeDialog(); updateHud(); } },
                        { text: 'RECUSAR', action: closeDialog }
                    ]);
                } else if (player.quest3State === 'in_progress') {
                    showDialog('Mestre do Senso', `Você eliminou ${player.island3Killed}/${player.island3Target} inimigos na 3ª Ilha. Continue!`, [{ text: 'CONTINUAR', action: closeDialog }]);
                } else if (player.quest3State === 'ready_to_claim') {
                    player.hasSenseUnlocked = true;
                    player.senseEnabled = true;
                    player.quest3State = 'completed';
                    player.level += 8;
                    player.maxHp = 100 + (player.level - 1) * 5;
                    player.hp = player.maxHp;
                    player.money += 1500;

                    showDialog('Mestre do Senso', `Incrível! Recompensa: +8 LEVEIS (Nível ${player.level}), +R$ 1.500 e a habilidade "Senso Super Legal" [Tecla Y]!`, [
                        { text: 'RECEBER RECOMPENSA ÉPICA [Y]', action: () => { closeDialog(); updateHud(); } }
                    ]);
                }
            }
        },
        {
            id: 'ice_village_npc',
            name: 'Habitante do Gelo',
            x: 600,
            y: 580,
            spriteKey: 'ice_village_npc',
            color: '#00bcd4',
            facing: 'right',
            interact: () => { showDialog('Habitante do Gelo', "Nós da vila de gelo somos muito mais legais do que os caras da vila de lava!", [{ text: 'CONCORDAR', action: closeDialog }]); }
        },
        {
            id: 'lava_village_npc',
            name: 'Habitante da Lava',
            x: 1800,
            y: 580,
            spriteKey: 'lava_village_npc',
            color: '#e74c3c',
            facing: 'left',
            interact: () => { showDialog('Habitante da Lava', "Nós da vila de lava odiamos os caras da vila de gelo!", [{ text: 'CONCORDAR', action: closeDialog }]); }
        },
        {
            id: 'ult_lootbox_npc',
            name: 'NPC da Roleta Ultimate',
            x: 1840,
            y: 480,
            spriteKey: 'lootbox_npc',
            color: '#d154ff',
            facing: 'down',
            interact: openUltimateLootboxModal
        }
    ];

    class Enemy {
        constructor(x, y, type, hp, dmg, speed, name, reward, spriteKey, leashRadius = 0) {
            this.homeX = x;
            this.homeY = y;
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = type === 'boss' ? 56 : 32;
            this.height = type === 'boss' ? 56 : 32;
            this.hp = hp;
            this.maxHp = hp;
            this.damage = dmg;
            this.speed = speed;
            this.name = name;
            this.reward = reward;
            this.spriteKey = spriteKey;
            this.leashRadius = leashRadius || (type === 'boss' ? 280 : 0);
            this.alive = true;
            this.respawnTimer = 0;
            this.animTimer = 0;
            this.walkFrame = 0;
            this.facing = 'down';
            this.patrolTimer = Math.random() * 100;
            this.attackCooldown = 0;
            this.dx = 0;
            this.dy = 0;
        }

        update() {
            if (!this.alive) {
                this.respawnTimer--;
                if (this.respawnTimer <= 0) {
                    this.alive = true;
                    this.hp = this.maxHp;
                    this.x = this.homeX;
                    this.y = this.homeY;
                }
                return;
            }

            if (this.attackCooldown > 0) this.attackCooldown--;

            // Seleção de alvo mais próximo: Host (player) ou Amigo Remoto (window.mpRemotePlayer)
            const distToLocal = Math.hypot(player.x - this.x, player.y - this.y);
            let targetPlayer = player;
            let distToTarget = distToLocal;
            let isTargetRemote = false;

            const rp = window.mpRemotePlayer;
            if (rp && window.mpState && window.mpState.connected && rp.hp > 0) {
                const distToRemote = Math.hypot(rp.x - this.x, rp.y - this.y);
                if (distToRemote < distToTarget) {
                    targetPlayer = rp;
                    distToTarget = distToRemote;
                    isTargetRemote = true;
                }
            }

            const distToHome = Math.hypot(this.x - this.homeX, this.y - this.homeY);

            if (this.leashRadius > 0 && distToHome > this.leashRadius) {
                const angle = Math.atan2(this.homeY - this.y, this.homeX - this.x);
                this.dx = Math.cos(angle);
                this.dy = Math.sin(angle);
            } else if (distToTarget < (this.type === 'boss' ? 320 : 220)) {
                const angle = Math.atan2(targetPlayer.y - this.y, targetPlayer.x - this.x);
                this.dx = Math.cos(angle);
                this.dy = Math.sin(angle);

                if (distToTarget < (this.type === 'boss' ? 44 : 30) && this.attackCooldown <= 0) {
                    this.attackCooldown = 50;
                    if (isTargetRemote) {
                        damageRemotePlayer(this.damage);
                    } else {
                        damagePlayer(this.damage);
                    }
                }
            } else {
                this.patrolTimer++;
                if (this.patrolTimer > 100) {
                    this.patrolTimer = 0;
                    const dirs = [[0,0], [1,0], [-1,0], [0,1], [0,-1]];
                    const pick = dirs[Math.floor(Math.random() * dirs.length)];
                    this.dx = pick[0];
                    this.dy = pick[1];
                }
            }

            if (this.dx > 0.1) this.facing = 'right';
            else if (this.dx < -0.1) this.facing = 'left';

            if (this.dx !== 0 || this.dy !== 0) {
                const nextX = this.x + this.dx * this.speed;
                const nextY = this.y + this.dy * this.speed;

                if (!checkWorldCollision(nextX, nextY)) {
                    this.x = nextX;
                    this.y = nextY;
                }

                this.animTimer++;
                if (this.animTimer > 10) {
                    this.animTimer = 0;
                    this.walkFrame = this.walkFrame === 0 ? 1 : 0;
                }
            } else {
                this.walkFrame = 0;
            }
        }

        takeDamage(dmg, attacker = 'host') {
            if (!this.alive) return;
            this.hp -= dmg;
            if (this.hp <= 0) {
                this.alive = false;
                this.respawnTimer = 300;

                if (attacker === 'client') {
                    // Recompensa e quests do CLIENT (amigo)
                    if (window.mpState && window.mpState.remotePlayer) {
                        window.mpState.remotePlayer.money = (window.mpState.remotePlayer.money || 0) + this.reward;
                    }
                    if (typeof window._sendEnemyKillReward === 'function') {
                        window._sendEnemyKillReward(this.reward, this.type);
                    }
                } else {
                    // Recompensa e quests do HOST (local)
                    player.money += this.reward;
                    updateHud();

                    if (this.type === 'bandido' && player.questState === 'in_progress') {
                        player.bandidosKilled++;
                        if (player.bandidosKilled >= player.bandidosTarget) player.questState = 'ready_to_claim';
                        updateHud();
                    }

                    if (player.quest2State === 'in_progress' && this.type === player.quest2Type) {
                        player.quest2Killed++;
                        if (player.quest2Killed >= player.quest2Target) player.quest2State = 'ready_to_claim';
                        updateHud();
                    }

                    if (currentIsland === '3ª ilha' && player.quest3State === 'in_progress') {
                        player.island3Killed++;
                        if (player.island3Killed >= player.island3Target) player.quest3State = 'ready_to_claim';
                        updateHud();
                    }
                }
            }
        }
    }

    const enemiesIsland1 = [
        new Enemy(880, 620, 'bandido', 30, 10, 1.6, 'inimigo inimigo', 10, 'enemy'),
        new Enemy(960, 680, 'bandido', 30, 10, 1.6, 'inimigo inimigo', 10, 'enemy'),
        new Enemy(920, 760, 'bandido', 30, 10, 1.6, 'inimigo inimigo', 10, 'enemy'),
        new Enemy(1020, 720, 'bandido', 30, 10, 1.6, 'inimigo inimigo', 10, 'enemy')
    ];

    const enemiesIsland2 = [
        new Enemy(640, 800, 'melhor', 60, 15, 1.8, 'inimigo melhor', 30, 'enemy_melhor'),
        new Enemy(880, 960, 'melhor', 60, 15, 1.8, 'inimigo melhor', 30, 'enemy_melhor'),
        new Enemy(1500, 700, 'mais_melhor', 100, 25, 2.0, 'inimigo mais melhor', 60, 'enemy_mais_melhor'),
        new Enemy(1750, 1000, 'mais_melhor', 100, 25, 2.0, 'inimigo mais melhor', 60, 'enemy_mais_melhor'),
        new Enemy(2000, 420, 'boss', 300, 40, 2.2, 'boss boss', 300, 'boss', 280)
    ];

    const enemiesIsland3 = [
        new Enemy(500, 700, 'gelo', 150, 35, 2.0, 'inimigo de gelo', 80, 'enemy_gelo'),
        new Enemy(750, 900, 'gelo', 150, 35, 2.0, 'inimigo de gelo', 80, 'enemy_gelo'),
        new Enemy(1700, 700, 'lava', 220, 50, 2.2, 'inimigo de lava', 120, 'enemy_lava'),
        new Enemy(1950, 950, 'lava', 220, 50, 2.2, 'inimigo de lava', 120, 'enemy_lava')
    ];

    function getActiveEnemies() {
        if (currentIsland === 'ilha inicial') return enemiesIsland1;
        if (currentIsland === 'ilha dps da inicial') return enemiesIsland2;
        return enemiesIsland3;
    }

    function getActiveNpcs() {
        if (currentIsland === 'ilha inicial') return npcsIsland1;
        if (currentIsland === 'ilha dps da inicial') return npcsIsland2;
        return npcsIsland3;
    }

    function getActiveMap() {
        if (currentIsland === 'ilha inicial') return mapGridIsland1;
        if (currentIsland === 'ilha dps da inicial') return mapGridIsland2;
        return mapGridIsland3;
    }

    function getActiveObjects() {
        if (currentIsland === 'ilha inicial') return worldObjectsIsland1;
        if (currentIsland === 'ilha dps da inicial') return worldObjectsIsland2;
        return worldObjectsIsland3;
    }

    function getMapCols() { return currentIsland === 'ilha inicial' ? 32 : 64; }
    function getMapRows() { return currentIsland === 'ilha inicial' ? 24 : 48; }
    function getMapWidth() { return getMapCols() * TILE_SIZE; }
    function getMapHeight() { return getMapRows() * TILE_SIZE; }
    // Expõe para multiplayer.js
    window._getMapWidth  = getMapWidth;
    window._getMapHeight = getMapHeight;

    function switchIsland(targetIsland) {
        currentIsland = targetIsland;
        if (targetIsland === 'ilha dps da inicial') { player.x = 240; player.y = 240; }
        else if (targetIsland === '3ª ilha') { player.x = 240; player.y = 240; }
        else { player.x = 980; player.y = 200; }
        updateHud();
    }

    function damagePlayer(amount) {
        if (isGodMode || player.invincibleTimer > 0) return;

        if (player.hasSenseUnlocked && player.senseEnabled && player.senseCharges > 0) {
            player.senseCharges--;
            player.invincibleTimer = 25;
            updateHud();

            dodgeEffects.push({
                x: player.x,
                y: player.y - 30,
                timer: 45,
                maxTimer: 45
            });
            return;
        }

        player.hp -= amount;
        player.invincibleTimer = 30;

        if (player.hp <= 0) {
            player.hp = player.maxHp;
            player.x = player.spawnX;
            player.y = player.spawnY;
            currentIsland = 'ilha inicial';
            showDialog('SISTEMA', 'Você morreu! Renasceu no ponto de spawn da ilha inicial com vida cheia.', [{ text: 'CONTINUAR', action: closeDialog }]);
        }
        updateHud();
    }

    function damageRemotePlayer(amount) {
        const rp = window.mpRemotePlayer;
        if (!rp || rp.invincibleTimer > 0) return;

        rp.hp = Math.max(0, rp.hp - amount);
        rp.invincibleTimer = 30;

        if (typeof window._sendDamageToClient === 'function') {
            window._sendDamageToClient(amount);
        }

        if (rp.hp <= 0) {
            rp.hp = rp.maxHp || 100;
            rp.x = 980;
            rp.y = 200;
            if (typeof window._sendRespawnToClient === 'function') {
                window._sendRespawnToClient(rp.x, rp.y);
            }
        }
    }
    window._damageRemotePlayer = damageRemotePlayer;

    function checkRemotePlayerAttack(rp) {
        if (!rp) return;
        const range = (rp.weapon && rp.weapon.range) ? rp.weapon.range : 45;
        const dmg   = (rp.weapon && rp.weapon.damage) ? rp.weapon.damage : 15;

        let attackX = rp.x;
        let attackY = rp.y;
        if (rp.facing === 'right') attackX += range;
        if (rp.facing === 'left')  attackX -= range;
        if (rp.facing === 'down')  attackY += range;
        if (rp.facing === 'up')    attackY -= range;

        // Amigo causa dano aos inimigos ativos
        getActiveEnemies().forEach(b => {
            if (b.alive) {
                const dist = Math.hypot(b.x - attackX, b.y - attackY);
                if (dist < range + (b.type === 'boss' ? 35 : 20)) {
                    b.takeDamage(dmg, 'client');
                }
            }
        });

        // PvP: Amigo ataca o host se estiver ao alcance
        if (player.invincibleTimer <= 0) {
            const distToHost = Math.hypot(player.x - attackX, player.y - attackY);
            if (distToHost < range + 20) {
                damagePlayer(dmg);
            }
        }
    }
    window._checkRemotePlayerAttack = checkRemotePlayerAttack;

    function triggerDash() {
        if (player.dashCooldown <= 0 && !player.isDashing) {
            player.isDashing = true;
            player.dashTimer = 10;
            player.dashCooldown = 90;
        }
    }

    function toggleSense() {
        if (player.hasSenseUnlocked) {
            player.senseEnabled = !player.senseEnabled;
            updateHud();
        } else {
            alert("Você ainda não desbloqueou o 'Senso Super Legal'! Complete a quest na 3ª Ilha.");
        }
    }


    // PAINEL DE ADMIN
    function openAdminModal() { document.getElementById('modal-admin')?.classList.add('active'); }
    function closeAdminModal() { document.getElementById('modal-admin')?.classList.remove('active'); }

    function setupAdminPanelEvents() {
        document.getElementById('btn-open-admin')?.addEventListener('click', openAdminModal);
        document.getElementById('btn-close-admin')?.addEventListener('click', closeAdminModal);
        document.getElementById('btn-exit-admin')?.addEventListener('click', closeAdminModal);

        document.getElementById('admin-add-100')?.addEventListener('click', () => { player.money += 100; updateHud(); });
        document.getElementById('admin-add-1000')?.addEventListener('click', () => { player.money += 1000; updateHud(); });
        document.getElementById('admin-add-10000')?.addEventListener('click', () => { player.money += 10000; updateHud(); });

        document.getElementById('admin-add-1lvl')?.addEventListener('click', () => { player.level += 1; player.maxHp = 100 + (player.level - 1) * 5; player.hp = player.maxHp; updateHud(); });
        document.getElementById('admin-set-lvl5')?.addEventListener('click', () => { player.level = 5; player.maxHp = 100 + (player.level - 1) * 5; player.hp = player.maxHp; updateHud(); });
        document.getElementById('admin-set-lvl13')?.addEventListener('click', () => { player.level = 13; player.maxHp = 100 + (player.level - 1) * 5; player.hp = player.maxHp; updateHud(); });
        document.getElementById('admin-set-lvl20')?.addEventListener('click', () => { player.level = 20; player.maxHp = 100 + (player.level - 1) * 5; player.hp = player.maxHp; updateHud(); });

        document.getElementById('admin-w1')?.addEventListener('click', () => { player.weapon = window.PREDEFINED_WEAPONS["espada espada"]; updateHud(); });
        document.getElementById('admin-w2')?.addEventListener('click', () => { player.weapon = window.PREDEFINED_WEAPONS["espada melhor"]; updateHud(); });
        document.getElementById('admin-w3')?.addEventListener('click', () => { player.weapon = window.PREDEFINED_WEAPONS["espada mais melhor"]; updateHud(); });
        document.getElementById('admin-w4')?.addEventListener('click', () => { player.weapon = window.PREDEFINED_WEAPONS["espada muito mais melhor"]; updateHud(); });
        document.getElementById('admin-w5')?.addEventListener('click', () => { player.weapon = window.PREDEFINED_WEAPONS["espada ultimate"]; updateHud(); });

        document.getElementById('admin-tp-1')?.addEventListener('click', () => { switchIsland('ilha inicial'); closeAdminModal(); });
        document.getElementById('admin-tp-2')?.addEventListener('click', () => { switchIsland('ilha dps da inicial'); closeAdminModal(); });
        document.getElementById('admin-tp-3')?.addEventListener('click', () => { switchIsland('3ª ilha'); closeAdminModal(); });

        document.getElementById('admin-godmode')?.addEventListener('click', () => { isGodMode = !isGodMode; alert(`Modo Deus: ${isGodMode ? 'ON' : 'OFF'}`); });
        document.getElementById('admin-unlock-sense')?.addEventListener('click', () => { player.hasSenseUnlocked = true; player.senseEnabled = true; updateHud(); alert("Senso Super Legal Desbloqueado! Pressione Y."); });
        document.getElementById('admin-killall')?.addEventListener('click', () => { getActiveEnemies().forEach(e => { if (e.alive) e.takeDamage(9999); }); alert("Inimigos eliminados!"); });
    }


    // CANVAS FULLSCREEN & CONTROLES
    let canvas, ctx;
    let gameLoopId = null;

    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (ctx) ctx.imageSmoothingEnabled = false;
        }
    }

    // ==========================================
    // CONTROLES MOBILE / TOUCH (JOYSTICK & BOTÕES)
    // ==========================================
    let mobileControlsInitialized = false;

    function isMobileDevice() {
        const ua = navigator.userAgent || navigator.vendor || window.opera || '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        return isMobileUA || (hasTouch && isCoarse);
    }

    function setupMobileControls() {
        if (mobileControlsInitialized) return;
        mobileControlsInitialized = true;

        const controlsLayer = document.getElementById('mobile-controls-layer');
        const joystickWrapper = document.getElementById('joystick-wrapper');
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');

        if (!controlsLayer || !joystickWrapper || !joystickBase || !joystickStick) return;

        // VERIFICAÇÃO ESTRITA: Exibir SOMENTE se for dispositivo móvel (celular/tablet)
        const isMobile = isMobileDevice();
        if (!isMobile) {
            document.body.classList.remove('is-mobile');
            controlsLayer.classList.remove('active');
            return; // Em computadores com mouse/teclado, os controles ficam 100% ocultos!
        }

        document.body.classList.add('is-mobile');
        controlsLayer.classList.add('active');

        // LÓGICA DO JOYSTICK ANALÓGICO
        function updateJoystick(clientX, clientY) {
            const rect = joystickBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let dx = clientX - centerX;
            let dy = clientY - centerY;
            const dist = Math.hypot(dx, dy);
            const maxRadius = (rect.width / 2) - 10;

            if (dist > maxRadius) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * maxRadius;
                dy = Math.sin(angle) * maxRadius;
            }

            joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;

            // Zona morta de 8px para evitar drift
            if (dist > 8) {
                joystickState.active = true;
                joystickState.x = dx / maxRadius;
                joystickState.y = dy / maxRadius;
            } else {
                joystickState.active = false;
                joystickState.x = 0;
                joystickState.y = 0;
            }
        }

        function resetJoystick() {
            joystickTouchId = null;
            joystickState.active = false;
            joystickState.x = 0;
            joystickState.y = 0;
            joystickStick.style.transform = 'translate(0px, 0px)';
        }

        // Multi-touch com Touch Identifiers para o Joystick
        joystickWrapper.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (joystickTouchId === null && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                joystickTouchId = touch.identifier;
                updateJoystick(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (joystickTouchId !== null) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joystickTouchId) {
                        e.preventDefault();
                        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                        break;
                    }
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (joystickTouchId !== null) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joystickTouchId) {
                        resetJoystick();
                        break;
                    }
                }
            }
        });

        window.addEventListener('touchcancel', (e) => {
            if (joystickTouchId !== null) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joystickTouchId) {
                        resetJoystick();
                        break;
                    }
                }
            }
        });

        // Suporte a Mouse para testes no PC
        let isMouseDragging = false;
        joystickWrapper.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMouseDragging = true;
                e.stopPropagation();
                updateJoystick(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isMouseDragging) {
                updateJoystick(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDragging) {
                isMouseDragging = false;
                resetJoystick();
            }
        });

        // LÓGICA DOS BOTÕES DE AÇÃO TOUCH
        function bindActionButton(buttonId, actionCallback) {
            const btn = document.getElementById(buttonId);
            if (!btn) return;

            let isTouching = false;

            function handlePress(e) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                btn.classList.add('active-press');
                setTimeout(() => btn.classList.remove('active-press'), 120);

                if (navigator.vibrate) {
                    try { navigator.vibrate(25); } catch (err) {}
                }

                actionCallback();
            }

            btn.addEventListener('touchstart', (e) => {
                isTouching = true;
                handlePress(e);
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => { isTouching = false; }, 300);
            }, { passive: false });

            btn.addEventListener('click', (e) => {
                if (isTouching) return; // Evita disparo duplo touch + click
                handlePress(e);
            });
        }

        bindActionButton('mbtn-attack', () => attackWithWeapon());
        bindActionButton('mbtn-dash', () => triggerDash());
        bindActionButton('mbtn-interact', () => interactWithWorld());
        bindActionButton('mbtn-sense', () => toggleSense());
    }

    function initGame() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        window.addEventListener('keydown', e => {
            keys[e.key.toLowerCase()] = true;
            if (keys['h'] && keys['k']) openAdminModal();
            if (e.key.toLowerCase() === 'q') triggerDash();
            if (e.key.toLowerCase() === 'y') toggleSense();
            if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); attackWithWeapon(); }
            if (e.key.toLowerCase() === 'e') interactWithWorld();
        });

        window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
        canvas.addEventListener('click', () => attackWithWeapon());

        setupAdminPanelEvents();
        setupMobileControls();

        document.getElementById('btn-info-menu')?.addEventListener('click', openInfoModal);
        document.getElementById('btn-close-info')?.addEventListener('click', closeInfoModal);
        document.getElementById('btn-ok-info')?.addEventListener('click', closeInfoModal);

        document.getElementById('btn-close-shop')?.addEventListener('click', closeShopModal);
        document.getElementById('btn-exit-shop')?.addEventListener('click', closeShopModal);
        document.querySelectorAll('.shop-buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const wName = btn.getAttribute('data-buy');
                const price = parseInt(btn.getAttribute('data-price'));
                buyWeapon(wName, price);
            });
        });

        document.getElementById('btn-close-lootbox')?.addEventListener('click', closeLootboxModal);
        document.getElementById('btn-exit-lootbox')?.addEventListener('click', closeLootboxModal);
        document.getElementById('btn-roll-lootbox')?.addEventListener('click', rollLootbox);

        document.getElementById('btn-close-ult-lootbox')?.addEventListener('click', closeUltimateLootboxModal);
        document.getElementById('btn-exit-ult-lootbox')?.addEventListener('click', closeUltimateLootboxModal);
        document.getElementById('btn-roll-ult-lootbox')?.addEventListener('click', rollUltimateLootbox);

        updateHud();

        // Expõe hooks para multiplayer.js
        window._localPlayer  = player;
        window._updateHud    = updateHud;
        window._currentIsland = currentIsland;

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // GAME LOOP
    function gameLoop() {
        animTimeCounter += 0.05;

        if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 0.04);
            updateHud();
        }

        if (player.hasSenseUnlocked && player.senseCharges < player.senseMaxCharges) {
            player.senseRechargeTimer++;
            if (player.senseRechargeTimer >= 300) {
                player.senseRechargeTimer = 0;
                player.senseCharges++;
                updateHud();
            }
        }

        updatePlayer();
        // Atualizar feedback touch do Dash
        const dashCdEl = document.getElementById('mbtn-dash-cd');
        const dashBtn = document.getElementById('mbtn-dash');
        if (dashBtn && dashCdEl) {
            if (player.dashCooldown > 0) {
                dashBtn.classList.add('cooldown');
                dashCdEl.innerText = `${Math.ceil(player.dashCooldown / 60)}s`;
            } else {
                dashBtn.classList.remove('cooldown');
                dashCdEl.innerText = '';
            }
        }

        // Inimigos: no cliente multiplayer, a AI é pausada (host envia posições)
        if (!window._mpSkipEnemyAI) {
            getActiveEnemies().forEach(b => b.update());
        }

        // Hooks de multiplayer (host e client)
        if (typeof window._mpHostTick === 'function')   window._mpHostTick(player);
        if (typeof window._mpClientTick === 'function') window._mpClientTick(player, joystickState, keys);

        render();

        const backdrop = document.getElementById('modal-gameplay');
        if (backdrop && backdrop.classList.contains('active')) {
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    function updatePlayer() {
        let moveX = 0;
        let moveY = 0;

        if (player.invincibleTimer > 0) player.invincibleTimer--;
        if (player.dashCooldown > 0) player.dashCooldown--;

        if (player.isDashing) {
            player.dashTimer--;
            if (player.dashTimer <= 0) player.isDashing = false;
        }

        if (joystickState.active && (joystickState.x !== 0 || joystickState.y !== 0)) {
            moveX = joystickState.x;
            moveY = joystickState.y;

            if (Math.abs(moveX) > Math.abs(moveY)) {
                player.facing = moveX > 0 ? 'right' : 'left';
            } else {
                player.facing = moveY > 0 ? 'down' : 'up';
            }
        } else {
            if (keys['w'] || keys['arrowup']) { moveY -= 1; player.facing = 'up'; }
            if (keys['s'] || keys['arrowdown']) { moveY += 1; player.facing = 'down'; }
            if (keys['a'] || keys['arrowleft']) { moveX -= 1; player.facing = 'left'; }
            if (keys['d'] || keys['arrowright']) { moveX += 1; player.facing = 'right'; }

            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.7071;
                moveY *= 0.7071;
            }
        }

        player.isMoving = (moveX !== 0 || moveY !== 0);
        const currentSpeed = player.isDashing ? player.speed * 2.5 : player.speed;

        if (player.isMoving) {
            player.animTimer++;
            if (player.animTimer > 8) {
                player.animTimer = 0;
                player.walkFrame = player.walkFrame === 0 ? 1 : 0;
            }

            const nextX = player.x + moveX * currentSpeed;
            const nextY = player.y + moveY * currentSpeed;

            if (!checkWorldCollision(nextX, player.y)) player.x = nextX;
            if (!checkWorldCollision(player.x, nextY)) player.y = nextY;
        } else {
            player.walkFrame = 0;
        }

        if (player.isAttacking) {
            player.attackTimer++;
            if (player.attackTimer > 10) {
                player.isAttacking = false;
                player.attackTimer = 0;
            }
        }
    }

    function checkWorldCollision(px, py) {
        const grid = getActiveMap();
        const cols = getMapCols();
        const rows = getMapRows();

        const tileCol = Math.floor(px / TILE_SIZE);
        const tileRow = Math.floor(py / TILE_SIZE);

        if (tileRow < 0 || tileRow >= rows || tileCol < 0 || tileCol >= cols) return true;
        if (grid[tileRow][tileCol] === 0) return true;

        for (let obj of getActiveObjects()) {
            if (obj.type === 'house' || obj.type === 'temple') {
                if (px > obj.x - 16 && px < obj.x + obj.w + 16 && py > obj.y - 16 && py < obj.y + obj.h + 16) {
                    return true;
                }
            } else if (obj.type === 'tree' || obj.type === 'cactus' || obj.type === 'rock') {
                const dist = Math.hypot(px - obj.x, py - obj.y);
                if (dist < obj.radius + 12) return true;
            }
        }

        return false;
    }

    function attackWithWeapon() {
        if (player.isAttacking) return;
        player.isAttacking = true;
        player.attackTimer = 0;

        // Se for cliente multiplayer, avisa o host imediatamente para registrar o golpe
        if (typeof window._mpNotifyAttack === 'function') {
            window._mpNotifyAttack(player);
        }

        let attackX = player.x;
        let attackY = player.y;
        const range = player.weapon.range;

        if (player.facing === 'right') attackX += range;
        if (player.facing === 'left')  attackX -= range;
        if (player.facing === 'down')  attackY += range;
        if (player.facing === 'up')    attackY -= range;

        // Se NÃO for cliente multiplayer (Host ou Singleplayer), calcula dano direto
        if (!window._mpSkipEnemyAI) {
            getActiveEnemies().forEach(b => {
                if (b.alive) {
                    const dist = Math.hypot(b.x - attackX, b.y - attackY);
                    if (dist < range + (b.type === 'boss' ? 35 : 20)) {
                        b.takeDamage(player.weapon.damage, 'host');
                    }
                }
            });

            // PvP: Host ataca o amigo remoto se estiver ao alcance
            if (window.mpState && window.mpState.connected && window.mpRemotePlayer) {
                const rp = window.mpRemotePlayer;
                if (rp.hp > 0 && rp.invincibleTimer <= 0) {
                    const distToRemote = Math.hypot(rp.x - attackX, rp.y - attackY);
                    if (distToRemote < range + 20) {
                        damageRemotePlayer(player.weapon.damage);
                    }
                }
            }
        }
    }

    function interactWithWorld() {
        const sign = getActiveObjects().find(o => o.type === 'sign');
        if (sign && Math.hypot(player.x - sign.x, player.y - sign.y) < 60) {
            showDialog('PLACA', `PLACA: Bem-vindo à ${sign.label}.`, [{ text: 'ENTENDIDO', action: closeDialog }]);
            return;
        }

        for (let npc of getActiveNpcs()) {
            if (Math.hypot(player.x - npc.x, player.y - npc.y) < 60) {
                npc.interact();
                return;
            }
        }
    }


    // RENDERIZAÇÃO
    function render() {
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        const mapW = getMapWidth();
        const mapH = getMapHeight();

        const camX = Math.max(0, Math.min(mapW - canvas.width, player.x - canvas.width / 2));
        const camY = Math.max(0, Math.min(mapH - canvas.height, player.y - canvas.height / 2));

        ctx.save();
        ctx.translate(-camX, -camY);

        ctx.fillStyle = '#1565c0';
        ctx.fillRect(0, 0, mapW, mapH);

        ctx.fillStyle = '#1e88e5';
        for (let r = 0; r < getMapRows(); r += 2) {
            for (let c = 0; c < getMapCols(); c += 2) {
                const waveOffset = Math.sin(animTimeCounter + r + c) * 3;
                ctx.fillRect(c * TILE_SIZE + waveOffset, r * TILE_SIZE + waveOffset, 12, 4);
            }
        }

        const grid = getActiveMap();
        const cols = getMapCols();
        const rows = getMapRows();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tile = grid[r][c];
                const tx = c * TILE_SIZE;
                const ty = r * TILE_SIZE;

                if (tile === 1) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#27ae60' : '#2ecc71';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 2) {
                    ctx.fillStyle = '#d35400';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 3) {
                    ctx.fillStyle = '#8e44ad';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#5b2c6f';
                    ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 4) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#f1c40f' : '#f39c12';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 5) {
                    ctx.fillStyle = '#e67e22';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 6) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#e0f7fa' : '#b2ebf2';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                } else if (tile === 7) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#d35400' : '#e74c3c';
                    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        getActiveObjects().forEach(obj => {
            if (obj.type === 'house') {
                ctx.fillStyle = obj.color;
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.moveTo(obj.x - 10, obj.y);
                ctx.lineTo(obj.x + obj.w / 2, obj.y - 30);
                ctx.lineTo(obj.x + obj.w + 10, obj.y);
                ctx.fill();
                ctx.fillStyle = '#34495e';
                ctx.fillRect(obj.x + obj.w / 2 - 12, obj.y + obj.h - 30, 24, 30);
            } else if (obj.type === 'temple') {
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(obj.x + 20, obj.y + 10, 20, 80);
                ctx.fillRect(obj.x + 120, obj.y + 10, 20, 80);
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(obj.x + obj.w / 2 - 20, obj.y + obj.h / 2 - 10, 40, 20);
            } else if (obj.type === 'chest') {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                ctx.strokeStyle = '#d35400';
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                ctx.fillStyle = '#fff';
                ctx.font = '16px sans-serif';
                ctx.fillText('🎁', obj.x + 8, obj.y + 26);
            } else if (obj.type === 'sign') {
                ctx.fillStyle = '#795548';
                ctx.fillRect(obj.x - 4, obj.y - 4, 8, 20);
                ctx.fillStyle = '#d7ccc8';
                ctx.fillRect(obj.x - 20, obj.y - 20, 40, 16);
                ctx.fillStyle = '#000';
                ctx.font = '10px sans-serif';
                ctx.fillText('PLACA', obj.x - 14, obj.y - 8);
            } else if (obj.type === 'tree') {
                ctx.fillStyle = '#1e8449';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (obj.type === 'cactus') {
                ctx.fillStyle = '#27ae60';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f1c40f';
                ctx.font = '16px sans-serif';
                ctx.fillText('🌵', obj.x - 8, obj.y + 6);
            } else if (obj.type === 'rock') {
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        getActiveNpcs().forEach(npc => {
            drawCharacter(npc.x, npc.y, npc.spriteKey, npc.color, npc.name, false, 0, 32, npc.facing || 'down');
        });

        getActiveEnemies().forEach(b => {
            if (b.alive) {
                const isBoss = b.type === 'boss';
                const size = isBoss ? 56 : 32;
                drawCharacter(b.x, b.y, b.spriteKey, isBoss ? '#8e44ad' : '#e74c3c', b.name, b.dx !== 0 || b.dy !== 0, b.walkFrame, size, b.facing);

                // Barra de HP sobre o mob quando ferido
                if (b.hp < b.maxHp) {
                    const barW = isBoss ? 48 : 32;
                    const barH = 4;
                    const bx = Math.floor(b.x - barW / 2);
                    const by = Math.floor(b.y - size / 2 - 16);
                    const ratio = Math.max(0, b.hp / b.maxHp);
                    ctx.save();
                    ctx.fillStyle = '#111';
                    ctx.fillRect(bx, by, barW, barH);
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(bx, by, Math.floor(barW * ratio), barH);
                    ctx.restore();
                }
            }
        });

        if (player.isDashing) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.fillRect(player.x - 16, player.y - 16, 32, 32);
        }

        drawCharacter(player.x, player.y, 'player', '#3498db', 'asafgamery', player.isMoving, player.walkFrame, 32, player.facing);

        if (player.invincibleTimer > 0 || isGodMode) {
            ctx.fillStyle = isGodMode ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(player.x - 18, player.y - 24, 36, 48);
        }

        if (player.isAttacking) {
            ctx.strokeStyle = player.weapon.color;
            ctx.lineWidth = 4;
            ctx.beginPath();

            let swingX = player.x;
            let swingY = player.y;
            const r = player.weapon.range;

            if (player.facing === 'right') { swingX += r; }
            if (player.facing === 'left') { swingX -= r; }
            if (player.facing === 'down') { swingY += r; }
            if (player.facing === 'up') { swingY -= r; }

            ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '24px sans-serif';
            ctx.fillText(player.weapon.icon || '🗡️', swingX - 12, swingY + 8);
        }

        // RENDERIZAR GFX MANEIRASSO DE DESVIO DO SENSO SUPER LEGAL
        for (let i = dodgeEffects.length - 1; i >= 0; i--) {
            const eff = dodgeEffects[i];
            eff.timer--;
            eff.y -= 0.8;

            const alpha = eff.timer / eff.maxTimer;

            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 28 + (eff.maxTimer - eff.timer) * 0.4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = 'bold 16px VT323, monospace';
            ctx.fillStyle = `rgba(0, 255, 204, ${alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText('⚡ DESVIOU!', eff.x, eff.y);

            if (eff.timer <= 0) {
                dodgeEffects.splice(i, 1);
            }
        }

        // Renderiza jogador remoto (multiplayer)
        if (typeof window._renderRemotePlayer === 'function' && window.mpRemotePlayer) {
            window._renderRemotePlayer(ctx, window.mpRemotePlayer, camX, camY);
        }

        ctx.restore();
    }

    // DIREÇÃO DE FLIP INVERTIDA CONFORME SOLICITADO (facing === 'right' -> INVERTE ESCALA)
    function drawCharacter(x, y, spriteKey, fallbackColor, label, isMoving, walkFrame, size = 32, facing = 'down') {
        const idleKey = `${spriteKey}_idle`;
        const walkKey = `${spriteKey}_walk`;
        const singleKey = spriteKey;

        let activeImg = null;

        if (isMoving && walkFrame === 1) {
            if (loadedSprites[walkKey]) activeImg = sprites[walkKey];
            else if (loadedSprites[idleKey]) activeImg = sprites[idleKey];
            else if (loadedSprites[singleKey]) activeImg = sprites[singleKey];
        } else {
            if (loadedSprites[idleKey]) activeImg = sprites[idleKey];
            else if (loadedSprites[singleKey]) activeImg = sprites[singleKey];
            else if (loadedSprites[walkKey]) activeImg = sprites[walkKey];
        }

        const half = size / 2;

        ctx.save();
        ctx.translate(Math.floor(x), Math.floor(y));

        // INVERTIDA A CONDIÇÃO: facing === 'right' agora aplica a escala (-1, 1)!
        if (facing === 'right') {
            ctx.scale(-1, 1);
        }

        if (activeImg) {
            ctx.drawImage(activeImg, -half, -half, size, size);
        } else {
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(-(half * 0.75), -half, half * 1.5, half * 1.5);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-(half * 0.5), -(half * 1.5), half, half * 0.75);

            ctx.fillStyle = '#000';
            ctx.fillRect(0, -(half * 1.2), 3, 3);

            ctx.fillStyle = '#2c3e50';
            if (isMoving && walkFrame === 1) {
                ctx.fillRect(-(half * 0.6), (half * 0.5), half * 0.5, half * 0.6);
                ctx.fillRect((half * 0.1), (half * 0.4), half * 0.5, half * 0.4);
            } else {
                ctx.fillRect(-(half * 0.6), (half * 0.5), half * 0.5, half * 0.5);
                ctx.fillRect((half * 0.1), (half * 0.5), half * 0.5, half * 0.5);
            }
        }

        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(12, Math.floor(size * 0.45))}px VT323, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - (half + 8));
    }


    // LOJA & LOOTBOX MODALS
    function openShopModal() { document.getElementById('modal-shop')?.classList.add('active'); }
    function closeShopModal() { document.getElementById('modal-shop')?.classList.remove('active'); }

    function buyWeapon(weaponName, price) {
        if (player.money >= price) {
            player.money -= price;
            player.weapon = window.PREDEFINED_WEAPONS[weaponName];
            updateHud();
            alert(`Você comprou a ${weaponName} por R$ ${price}! Ela foi equipada no seu Slot 1.`);
        } else {
            alert(`Você não tem R$ ${price} para comprar a ${weaponName}!`);
        }
    }

    function openLootboxModal() { document.getElementById('modal-lootbox')?.classList.add('active'); }
    function closeLootboxModal() { document.getElementById('modal-lootbox')?.classList.remove('active'); }

    const uselessItems = ["pedra inútil", "meia furada", "vento engarrafado", "poeira de espada", "vento de grama", "papel rasgado"];
    let isRolling = false;

    function rollLootbox() {
        if (isRolling) return;
        if (player.money < 100) { alert("Você precisa de pelo menos R$ 100!"); return; }

        player.money -= 100;
        updateHud();
        isRolling = true;

        const display = document.getElementById('lootbox-display');
        const result = document.getElementById('lootbox-result');
        if (result) result.innerText = "Roletando...";

        let counter = 0;
        const interval = setInterval(() => {
            const randomItem = uselessItems[Math.floor(Math.random() * uselessItems.length)];
            if (display) display.innerText = `🎲 ${randomItem}`;
            counter++;
            if (counter > 20) {
                clearInterval(interval);
                isRolling = false;
                const finalItem = uselessItems[Math.floor(Math.random() * uselessItems.length)];
                if (display) display.innerText = `🎁 ${finalItem}`;
                if (result) result.innerText = `Você tirou '${finalItem}'! (O item é tão ruim que nem foi para o seu inventário).`;
            }
        }, 100);
    }

    function openUltimateLootboxModal() { document.getElementById('modal-ultimate-lootbox')?.classList.add('active'); }
    function closeUltimateLootboxModal() { document.getElementById('modal-ultimate-lootbox')?.classList.remove('active'); }

    function rollUltimateLootbox() {
        if (isRolling) return;
        if (player.money < 300) { alert("Você precisa de pelo menos R$ 300!"); return; }

        player.money -= 300;
        updateHud();
        isRolling = true;

        const display = document.getElementById('ult-lootbox-display');
        const result = document.getElementById('ult-lootbox-result');
        if (result) result.innerText = "Roletando Caixa Suprema...";

        let counter = 0;
        const interval = setInterval(() => {
            const isLucky = Math.random() < 0.10;
            const randomItem = isLucky ? "espada ultimate" : uselessItems[Math.floor(Math.random() * uselessItems.length)];
            if (display) display.innerText = `⚡ ${randomItem}`;
            counter++;
            if (counter > 25) {
                clearInterval(interval);
                isRolling = false;
                const wonUltimate = Math.random() < 0.10;

                if (wonUltimate) {
                    player.weapon = window.PREDEFINED_WEAPONS["espada ultimate"];
                    if (display) display.innerText = `⚡ ESPADA ULTIMATE!`;
                    if (result) result.innerText = `PARABÉNS! Você tirou 10% de sorte e ganhou a ESPADA ULTIMATE (Dano: 250)! Ela foi equipada no seu Slot 1.`;
                    updateHud();
                } else {
                    const finalItem = uselessItems[Math.floor(Math.random() * uselessItems.length)];
                    if (display) display.innerText = `🎁 ${finalItem}`;
                    if (result) result.innerText = `Você não deu sorte de 10% e tirou '${finalItem}'! (O item nem foi para o seu inventário).`;
                }
            }
        }, 90);
    }


    // DIÁLOGOS E HUD
    function updateHud() {
        const hpText = document.getElementById('hud-hp');
        const hpFill = document.getElementById('hp-bar-fill');
        if (hpText) hpText.innerText = `${Math.floor(player.hp)} / ${player.maxHp}`;
        if (hpFill) hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;

        document.getElementById('hud-level').innerText = `${player.level}`;
        document.getElementById('hud-money').innerText = `R$ ${player.money}`;
        document.getElementById('hud-location').innerText = currentIsland;

        const senseBadge = document.getElementById('hud-sense-badge');
        if (senseBadge) {
            if (!player.hasSenseUnlocked) {
                senseBadge.innerHTML = 'SENSO: <span>BLOQUEADO</span>';
                senseBadge.classList.remove('active');
            } else if (player.senseEnabled) {
                senseBadge.innerHTML = `SENSO: <span>${player.senseCharges}/${player.senseMaxCharges} [Y]</span>`;
                senseBadge.classList.add('active');
            } else {
                senseBadge.innerHTML = 'SENSO: <span>OFF [Y]</span>';
                senseBadge.classList.remove('active');
            }
        }

        const hwIcon = document.getElementById('hotbar-weapon-icon');
        const hwName = document.getElementById('hotbar-weapon-name');
        if (hwIcon) hwIcon.innerText = player.weapon.icon || '🗡️';
        if (hwName) hwName.innerText = player.weapon.name;

        const s2Icon = document.getElementById('hotbar-slot2-icon');
        const s2Name = document.getElementById('hotbar-slot2-name');
        if (s2Icon && s2Name) {
            if (player.hasKrakenToken) {
                s2Icon.innerText = '🐙';
                s2Name.innerText = 'Token Kraken';
            } else if (player.hasArtefact) {
                s2Icon.innerText = '🔮';
                s2Name.innerText = 'Artefato';
            } else if (player.hasSpecialItem) {
                s2Icon.innerText = '📦';
                s2Name.innerText = 'Item Especial';
            } else {
                s2Icon.innerText = '---';
                s2Name.innerText = '---';
            }
        }

        const qHud = document.getElementById('hud-quest');
        if (qHud) {
            if (currentIsland === 'ilha inicial') {
                if (player.questState === 'not_started') qHud.innerText = 'Nenhuma (Quest NPC)';
                else if (player.questState === 'in_progress') qHud.innerText = `Matar Bandidos (${player.bandidosKilled}/${player.bandidosTarget})`;
                else if (player.questState === 'ready_to_claim') qHud.innerText = 'Falar com Quest NPC!';
            } else if (currentIsland === 'ilha dps da inicial') {
                if (player.quest2State === 'not_started') qHud.innerText = 'Nenhuma (Quest NPC 2)';
                else if (player.quest2State === 'in_progress') qHud.innerText = `Matar (${player.quest2Killed}/${player.quest2Target})`;
                else if (player.quest2State === 'ready_to_claim') qHud.innerText = 'Falar com Quest NPC 2!';
            } else {
                if (player.quest3State === 'not_started') qHud.innerText = 'Nenhuma (Mestre do Senso)';
                else if (player.quest3State === 'in_progress') qHud.innerText = `Matar Mobs 3ª Ilha (${player.island3Killed}/${player.island3Target})`;
                else if (player.quest3State === 'ready_to_claim') qHud.innerText = 'Falar com Mestre do Senso!';
            }
        }

        const senseBtn = document.getElementById('mbtn-sense');
        if (senseBtn) {
            if (!player.hasSenseUnlocked) {
                senseBtn.classList.add('locked');
            } else {
                senseBtn.classList.remove('locked');
                if (player.senseEnabled) {
                    senseBtn.classList.add('active-sense');
                } else {
                    senseBtn.classList.remove('active-sense');
                }
            }
        }
    }

    function openInfoModal() {
        const modalInfo = document.getElementById('modal-info');
        if (!modalInfo) return;

        document.getElementById('info-level').innerText = player.level;
        document.getElementById('info-money').innerText = `R$ ${player.money}`;
        document.getElementById('info-maxhp').innerText = `${player.maxHp} HP`;
        document.getElementById('info-weapon').innerText = player.weapon.name;

        const infoSense = document.getElementById('info-sense');
        if (infoSense) {
            infoSense.innerText = player.hasSenseUnlocked ? `Desbloqueado (${player.senseCharges}/5 Esquivas) [Tecla Y]` : 'Bloqueado (Quest Mestre do Senso)';
        }

        modalInfo.classList.add('active');
    }

    function closeInfoModal() { document.getElementById('modal-info')?.classList.remove('active'); }

    function showDialog(speaker, text, buttons) {
        const dialogBox = document.getElementById('dialog-box');
        const dialogSpeaker = document.getElementById('dialog-speaker');
        const dialogText = document.getElementById('dialog-text');
        const dialogActions = document.getElementById('dialog-actions');

        if (!dialogBox) return;

        dialogSpeaker.innerText = speaker;
        dialogText.innerText = text;
        dialogActions.innerHTML = '';

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'dialog-btn';
            btn.innerText = b.text;
            btn.addEventListener('click', b.action);
            dialogActions.appendChild(btn);
        });

        dialogBox.classList.add('active');
    }

    function closeDialog() { document.getElementById('dialog-box')?.classList.remove('active'); }

    window.startTopDownGame = initGame;

    // ──────────────────────────────────────────────
    // HOOKS PARA MULTIPLAYER.JS
    // ──────────────────────────────────────────────
    // Expõe drawCharacter para renderizar o jogador remoto com sprite correto
    window._drawCharacter = drawCharacter;
    window._showDialog    = showDialog;
    window._closeDialog   = closeDialog;

    // Expõe getActiveEnemies para multiplayer.js serializar/aplicar estados
    window._getActiveEnemies = getActiveEnemies;

    // Aplica estados de inimigos recebidos do host no cliente
    // Chamado pelo multiplayer.js quando recebe pacote 'state' do host
    window._applyEnemyStates = function (states) {
        if (!states || !Array.isArray(states)) return;
        const enemies = getActiveEnemies();
        states.forEach((s, i) => {
            if (!enemies[i]) return;
            const e = enemies[i];
            e.x    = s.x   ?? e.x;
            e.y    = s.y   ?? e.y;
            e.hp   = s.hp  ?? e.hp;
            e.alive = s.alive ?? e.alive;
            e.facing    = s.facing   ?? e.facing;
            e.walkFrame = s.walkFrame ?? e.walkFrame;
            e.dx = s.dx ?? e.dx;
            e.dy = s.dy ?? e.dy;
            // Se voltou a estar vivo, reseta respawnTimer
            if (s.alive && !e.respawnTimer) e.respawnTimer = 0;
        });
    };

})();
