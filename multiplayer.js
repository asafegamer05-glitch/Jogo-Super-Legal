// ============================================================
// MULTIPLAYER.JS — WebRTC P2P via PeerJS CDN
// jogo super legal — GitHub Pages compatible
// ============================================================
// Arquitetura:
//   HOST: calcula todo dano (NPCs → player, PvP), money, loot
//         roda AI dos inimigos, serializa e envia estado completo
//   CLIENT: envia posição real + inputs ao host
//           aplica estados autoritativos recebidos (inimigos, remotePlayer)
//           AI dos inimigos PAUSADA (window._mpSkipEnemyAI = true)
// Cada player tem HP, money, level, weapon SEPARADOS
// Sala ID: 4 chars livres → prefixo "jsl-" no PeerJS
// ============================================================

(function () {
    'use strict';

    // ----------------------------------------------------------
    // ESTADO MULTIPLAYER
    // ----------------------------------------------------------
    const mpState = {
        isHost: false,
        connected: false,
        peer: null,
        conn: null,
        roomCode: '',
        remotePlayer: null,
        // Última posição recebida do client (host usa diretamente, sem simulação)
        lastClientPos: { x: 300, y: 350 }
    };

    window.mpState = mpState;

    // ----------------------------------------------------------
    // DETECÇÃO MOBILE
    // ----------------------------------------------------------
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 1 && window.innerWidth <= 900);
    }

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------
    function setStatus(msg, type) {
        const dot  = document.getElementById('mp-status-dot');
        const msgEl = document.getElementById('mp-status-msg');
        if (!dot || !msgEl) return;
        dot.className = 'mp-status-dot';
        if (type === 'waiting')   dot.classList.add('status-waiting');
        if (type === 'connected') dot.classList.add('status-connected');
        if (type === 'error')     dot.classList.add('status-error');
        msgEl.textContent = msg;
    }

    // ----------------------------------------------------------
    // MODAL BETA MOBILE
    // ----------------------------------------------------------
    function initMobileBetaModal() {
        if (!isMobileDevice()) return;
        const modal = document.getElementById('modal-mobile-beta');
        if (!modal) return;

        function tryShowBeta() {
            const terms = document.getElementById('modal-terms');
            if (terms && terms.classList.contains('active')) {
                setTimeout(tryShowBeta, 500);
                return;
            }
            modal.classList.add('active');
        }
        setTimeout(tryShowBeta, 300);

        document.getElementById('btn-accept-beta')?.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        modal.querySelector('.close-btn[data-close="modal-mobile-beta"]')?.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // ----------------------------------------------------------
    // TOGGLE DO PAINEL MULTIPLAYER
    // ----------------------------------------------------------
    function initMultiplayerToggle() {
        const toggleBtn = document.getElementById('btn-toggle-mp');
        const sidebar   = document.getElementById('multiplayer-sidebar');
        const closeBtn  = document.getElementById('btn-close-mp-sidebar');
        if (!sidebar) return;

        function setSidebarVisible(visible) {
            sidebar.classList.toggle('mp-sidebar-visible', visible);
            if (toggleBtn) toggleBtn.classList.toggle('mp-btn-active', visible);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isCurrentlyVisible = sidebar.classList.contains('mp-sidebar-visible');
                setSidebarVisible(!isCurrentlyVisible);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setSidebarVisible(false);
            });
        }

        sidebar.addEventListener('click', (e) => {
            if (e.target === sidebar) {
                setSidebarVisible(false);
            }
        });
    }

    // ----------------------------------------------------------
    // HOST: CRIAR SALA
    // ----------------------------------------------------------
    function initHostLogic() {
        const createBtn = document.getElementById('btn-create-room');
        if (!createBtn) return;

        createBtn.addEventListener('click', () => {
            const input = document.getElementById('mp-host-code');
            if (!input) return;

            const raw = input.value.trim();
            if (raw.length < 1 || raw.length > 4) {
                setStatus('⚠️ Digite entre 1 e 4 caracteres para o ID!', 'error');
                return;
            }
            const code   = raw.toUpperCase();
            const peerId = `jsl-${code}`;

            if (mpState.peer) { try { mpState.peer.destroy(); } catch (e) {} }

            setStatus('🔄 Criando sala...', 'waiting');
            createBtn.disabled = true;

            const peer = new Peer(peerId, { debug: 0 });
            mpState.peer   = peer;
            mpState.isHost = true;
            mpState.roomCode = code;
            // HOST roda AI — garante que não está pulando
            window._mpSkipEnemyAI = false;

            peer.on('open', () => {
                setStatus(`✅ Sala "${code}" criada! Aguardando amigo...`, 'waiting');
                updateHudBadge();
            });

            peer.on('connection', (conn) => {
                mpState.conn = conn;
                mpState.connected = true;
                mpState.remotePlayer = createRemotePlayerState();
                window.mpRemotePlayer = mpState.remotePlayer;

                conn.on('open', () => {
                    setStatus(`🤝 Amigo conectou! Iniciando...`, 'connected');
                    sendHostInitialState();
                    startGameIfReady();
                });

                conn.on('data', (data) => { handleClientData(data); });

                conn.on('close', () => {
                    setStatus('❌ Amigo desconectou.', 'error');
                    mpState.connected = false;
                    mpState.remotePlayer = null;
                    window.mpRemotePlayer = null;
                    updateHudBadge();
                });

                conn.on('error', (err) => {
                    setStatus(`❌ Erro na conexão: ${err.message || err}`, 'error');
                });
            });

            peer.on('error', (err) => {
                let msg = err.message || String(err);
                if (msg.includes('unavailable-id') || msg.includes('ID')) {
                    msg = `ID "${code}" já em uso. Tente outro.`;
                }
                setStatus(`❌ ${msg}`, 'error');
                createBtn.disabled = false;
                mpState.peer = null;
            });

            peer.on('disconnected', () => {
                setStatus('⚠️ Desconectado do servidor PeerJS.', 'error');
            });
        });
    }

    // ----------------------------------------------------------
    // CLIENT: ENTRAR NA SALA
    // ----------------------------------------------------------
    function initClientLogic() {
        const joinBtn = document.getElementById('btn-join-room');
        if (!joinBtn) return;

        joinBtn.addEventListener('click', () => {
            const input = document.getElementById('mp-join-code');
            if (!input) return;

            const raw = input.value.trim();
            if (raw.length < 1 || raw.length > 4) {
                setStatus('⚠️ Digite entre 1 e 4 caracteres!', 'error');
                return;
            }
            const code   = raw.toUpperCase();
            const peerId = `jsl-${code}`;

            if (mpState.peer) { try { mpState.peer.destroy(); } catch (e) {} }

            setStatus('🔄 Conectando na sala...', 'waiting');
            joinBtn.disabled = true;

            const peer = new Peer({ debug: 0 });
            mpState.peer     = peer;
            mpState.isHost   = false;
            mpState.roomCode = code;
            // CLIENT pausa AI de inimigos — host envia posições
            window._mpSkipEnemyAI = true;

            peer.on('open', () => {
                const conn = peer.connect(peerId, { reliable: true });
                mpState.conn = conn;

                conn.on('open', () => {
                    setStatus(`✅ Conectado na sala "${code}"! Iniciando...`, 'connected');
                    mpState.connected = true;
                    mpState.remotePlayer = createRemotePlayerState();
                    window.mpRemotePlayer = mpState.remotePlayer;
                    updateHudBadge();
                    startGameIfReady();
                });

                conn.on('data', (data)  => { handleHostData(data); });
                conn.on('close', () => {
                    setStatus('❌ Host desconectou.', 'error');
                    mpState.connected    = false;
                    mpState.remotePlayer = null;
                    window.mpRemotePlayer = null;
                    window._mpSkipEnemyAI = false; // restaura AI local
                    updateHudBadge();
                });
                conn.on('error', (err) => {
                    setStatus(`❌ Erro: ${err.message || err}`, 'error');
                    joinBtn.disabled = false;
                });
            });

            peer.on('error', (err) => {
                let msg = err.message || String(err);
                if (msg.includes('peer-unavailable')) {
                    msg = `Sala "${code}" não encontrada. O host precisa criar antes.`;
                }
                setStatus(`❌ ${msg}`, 'error');
                joinBtn.disabled = false;
                window._mpSkipEnemyAI = false;
                mpState.peer = null;
            });
        });
    }

    // ----------------------------------------------------------
    // ESTADO INICIAL DO REMOTE PLAYER
    // ----------------------------------------------------------
    function createRemotePlayerState() {
        const defaultWeapon = window.PREDEFINED_WEAPONS
            ? window.PREDEFINED_WEAPONS['espada espada']
            : { name: 'espada espada', damage: 15, range: 45, icon: '🗡️', color: '#cccccc' };
        return {
            x: 300, y: 350,
            width: 32, height: 32,
            hp: 100, maxHp: 100,
            level: 1, money: 150,
            weapon: defaultWeapon,
            facing: 'down',
            isMoving: false, isAttacking: false, isDashing: false,
            walkFrame: 0,
            name: mpState.isHost ? '🎮 Amigo' : '👑 Host',
            invincibleTimer: 0
        };
    }

    // ----------------------------------------------------------
    // HOST → CLIENT: envia estado inicial
    // ----------------------------------------------------------
    function sendHostInitialState() {
        if (!mpState.conn || !mpState.isHost) return;
        const localPlayer = getLocalPlayer();
        if (!localPlayer) return;
        safeSend({
            type: 'init',
            hostPlayer:   serializePlayer(localPlayer, 'HOST'),
            clientPlayer: serializePlayer(mpState.remotePlayer, 'JOGADOR'),
            island: window._currentIsland || 'ilha inicial'
        });
    }

    // ----------------------------------------------------------
    // HOST: processa dados do CLIENT
    // ----------------------------------------------------------
    function handleClientData(data) {
        if (!data || !data.type) return;

        if (data.type === 'position') {
            // Client manda posição REAL — host aplica diretamente (sem simulação)
            if (mpState.remotePlayer) {
                mpState.remotePlayer.x           = data.x           ?? mpState.remotePlayer.x;
                mpState.remotePlayer.y           = data.y           ?? mpState.remotePlayer.y;
                mpState.remotePlayer.facing      = data.facing      ?? mpState.remotePlayer.facing;
                mpState.remotePlayer.isMoving    = data.isMoving    ?? false;
                mpState.remotePlayer.isAttacking = data.isAttacking ?? false;
                mpState.remotePlayer.isDashing   = data.isDashing   ?? false;
                mpState.remotePlayer.walkFrame   = data.walkFrame   ?? 0;
                mpState.remotePlayer.level       = data.level       ?? mpState.remotePlayer.level;
                mpState.remotePlayer.maxHp       = data.maxHp       ?? mpState.remotePlayer.maxHp;
                if (data.weaponName && window.PREDEFINED_WEAPONS) {
                    mpState.remotePlayer.weapon = window.PREDEFINED_WEAPONS[data.weaponName] || mpState.remotePlayer.weapon;
                }
            }
        }

        if (data.type === 'attack') {
            // Client realizou um golpe — Host calcula o dano no inimigo e PvP
            if (mpState.remotePlayer) {
                mpState.remotePlayer.x           = data.x           ?? mpState.remotePlayer.x;
                mpState.remotePlayer.y           = data.y           ?? mpState.remotePlayer.y;
                mpState.remotePlayer.facing      = data.facing      ?? mpState.remotePlayer.facing;
                mpState.remotePlayer.isAttacking = true;
                if (data.weaponName && window.PREDEFINED_WEAPONS) {
                    mpState.remotePlayer.weapon = window.PREDEFINED_WEAPONS[data.weaponName] || mpState.remotePlayer.weapon;
                }
                if (typeof window._checkRemotePlayerAttack === 'function') {
                    window._checkRemotePlayerAttack(mpState.remotePlayer);
                }
            }
        }
    }

    // ----------------------------------------------------------
    // CLIENT: processa dados do HOST
    // ----------------------------------------------------------
    function handleHostData(data) {
        if (!data || !data.type) return;

        if (data.type === 'init') {
            // Recebe estado inicial — sincroniza stats do client
            const local = getLocalPlayer();
            if (local && data.clientPlayer) {
                local.hp    = data.clientPlayer.hp;
                local.maxHp = data.clientPlayer.maxHp;
                local.level = data.clientPlayer.level;
                local.money = data.clientPlayer.money;
                if (data.clientPlayer.weaponName && window.PREDEFINED_WEAPONS) {
                    local.weapon = window.PREDEFINED_WEAPONS[data.clientPlayer.weaponName] || local.weapon;
                }
            }
            if (mpState.remotePlayer && data.hostPlayer) {
                applyRemotePlayerState(mpState.remotePlayer, data.hostPlayer);
            }
            updateHudBadge();
            if (typeof window._updateHud === 'function') window._updateHud();
        }

        if (data.type === 'state') {
            // Update autoritativo contínuo do host

            // Atualiza o jogador remoto (host visível pelo client)
            if (data.remotePlayer && mpState.remotePlayer) {
                applyRemotePlayerState(mpState.remotePlayer, data.remotePlayer);
            }

            // Aplica estados dos inimigos (puppeted pelo host)
            if (data.enemies && typeof window._applyEnemyStates === 'function') {
                window._applyEnemyStates(data.enemies);
            }
        }

        if (data.type === 'damage_to_client') {
            const local = getLocalPlayer();
            if (local && data.damage > 0) {
                local.hp = Math.max(0, local.hp - data.damage);
                local.invincibleTimer = 30;
                if (typeof window._updateHud === 'function') window._updateHud();
                showDamageFlash();
            }
        }

        if (data.type === 'respawn_client') {
            const local = getLocalPlayer();
            if (local) {
                local.hp = local.maxHp;
                local.x = data.x ?? 980;
                local.y = data.y ?? 200;
                local.invincibleTimer = 60;
                if (typeof window._updateHud === 'function') window._updateHud();
                if (typeof window._showDialog === 'function') {
                    window._showDialog('SISTEMA', 'Você morreu! Renasceu no ponto de spawn.', [
                        { text: 'CONTINUAR', action: () => { if (typeof window._closeDialog === 'function') window._closeDialog(); } }
                    ]);
                }
            }
        }

        if (data.type === 'enemy_kill_reward') {
            const local = getLocalPlayer();
            if (local) {
                local.money = (local.money || 0) + (data.reward || 0);

                if (data.enemyType === 'bandido' && local.questState === 'in_progress') {
                    local.bandidosKilled = (local.bandidosKilled || 0) + 1;
                    if (local.bandidosKilled >= (local.bandidosTarget || 4)) local.questState = 'ready_to_claim';
                }
                if (local.quest2State === 'in_progress' && data.enemyType === local.quest2Type) {
                    local.quest2Killed = (local.quest2Killed || 0) + 1;
                    if (local.quest2Killed >= (local.quest2Target || 4)) local.quest2State = 'ready_to_claim';
                }
                if (window._currentIsland === '3ª ilha' && local.quest3State === 'in_progress') {
                    local.island3Killed = (local.island3Killed || 0) + 1;
                    if (local.island3Killed >= (local.island3Target || 20)) local.quest3State = 'ready_to_claim';
                }

                if (typeof window._updateHud === 'function') window._updateHud();
            }
        }
    }

    // ----------------------------------------------------------
    // HOST TICK — chamado pelo game.js a cada frame
    // ----------------------------------------------------------
    let hostTickCounter = 0;
    window._mpHostTick = function (localPlayer) {
        if (!mpState.isHost || !mpState.connected || !mpState.conn) return;

        hostTickCounter++;

        // Envia estado a ~20Hz (a cada 3 frames a 60fps)
        if (hostTickCounter % 3 !== 0) return;

        // Serializa inimigos
        const enemies = typeof window._getActiveEnemies === 'function'
            ? window._getActiveEnemies().map(e => ({
                x: Math.round(e.x), y: Math.round(e.y),
                hp: e.hp, alive: e.alive,
                facing: e.facing, walkFrame: e.walkFrame,
                dx: e.dx, dy: e.dy
              }))
            : [];

        safeSend({
            type: 'state',
            // Client vê o HOST como o jogador remoto
            remotePlayer: serializePlayer(localPlayer, 'HOST'),
            enemies
        });
    };

    // ----------------------------------------------------------
    // CLIENT TICK — chamado pelo game.js a cada frame
    // ----------------------------------------------------------
    let clientTickCounter = 0;
    window._mpClientTick = function (localPlayer) {
        if (mpState.isHost || !mpState.connected || !mpState.conn) return;

        clientTickCounter++;
        if (clientTickCounter % 2 !== 0) return; // throttle 30Hz

        if (!localPlayer) return;

        // Envia POSIÇÃO REAL e stats do player
        safeSend({
            type: 'position',
            x:           Math.round(localPlayer.x),
            y:           Math.round(localPlayer.y),
            facing:      localPlayer.facing,
            isMoving:    !!localPlayer.isMoving,
            isAttacking: !!localPlayer.isAttacking,
            isDashing:   !!localPlayer.isDashing,
            walkFrame:   localPlayer.walkFrame || 0,
            level:       localPlayer.level,
            maxHp:       localPlayer.maxHp,
            weaponName:  localPlayer.weapon ? localPlayer.weapon.name : 'espada espada'
        });
    };

    // ----------------------------------------------------------
    // DISPARADORES DE EVENTOS AUTORITATIVOS DO HOST
    // ----------------------------------------------------------
    window._sendDamageToClient = function (damage) {
        if (!mpState.isHost || !mpState.connected) return;
        safeSend({ type: 'damage_to_client', damage });
    };

    window._sendRespawnToClient = function (x, y) {
        if (!mpState.isHost || !mpState.connected) return;
        safeSend({ type: 'respawn_client', x, y });
    };

    window._sendEnemyKillReward = function (reward, enemyType) {
        if (!mpState.isHost || !mpState.connected) return;
        safeSend({ type: 'enemy_kill_reward', reward, enemyType });
    };

    window._mpNotifyAttack = function (localPlayer) {
        if (!mpState.connected || !mpState.conn) return;
        safeSend({
            type: 'attack',
            x: Math.round(localPlayer.x),
            y: Math.round(localPlayer.y),
            facing: localPlayer.facing,
            weaponName: localPlayer.weapon ? localPlayer.weapon.name : 'espada espada'
        });
    };

    // ----------------------------------------------------------
    // HELPERS
    // ----------------------------------------------------------
    function safeSend(data) {
        try {
            if (mpState.conn && mpState.conn.open) mpState.conn.send(data);
        } catch (e) { /* silencioso */ }
    }

    function serializePlayer(p, role) {
        if (!p) return null;
        return {
            x: Math.round(p.x), y: Math.round(p.y),
            hp: Math.round(p.hp), maxHp: p.maxHp,
            level: p.level, money: Math.round(p.money),
            weaponName: p.weapon ? p.weapon.name : 'espada espada',
            facing: p.facing || 'down',
            isMoving: !!p.isMoving, isAttacking: !!p.isAttacking,
            isDashing: !!p.isDashing, walkFrame: p.walkFrame || 0,
            name: p.name || role,
            invincibleTimer: p.invincibleTimer || 0
        };
    }

    function applyRemotePlayerState(rp, data) {
        if (!rp || !data) return;
        rp.x = data.x ?? rp.x;
        rp.y = data.y ?? rp.y;
        rp.hp = data.hp ?? rp.hp;
        rp.maxHp = data.maxHp ?? rp.maxHp;
        rp.level = data.level ?? rp.level;
        rp.money = data.money ?? rp.money;
        rp.facing = data.facing ?? rp.facing;
        rp.isMoving = data.isMoving ?? rp.isMoving;
        rp.isAttacking = data.isAttacking ?? rp.isAttacking;
        rp.isDashing = data.isDashing ?? rp.isDashing;
        rp.walkFrame = data.walkFrame ?? rp.walkFrame;
        rp.name = data.name ?? rp.name;
        rp.invincibleTimer = data.invincibleTimer ?? rp.invincibleTimer;
        if (data.weaponName && window.PREDEFINED_WEAPONS) {
            rp.weapon = window.PREDEFINED_WEAPONS[data.weaponName] || rp.weapon;
        }
    }

    function getLocalPlayer() {
        return window._localPlayer || null;
    }

    function showDamageFlash() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        canvas.classList.add('damage-flash');
        setTimeout(() => canvas.classList.remove('damage-flash'), 250);
    }

    function updateHudBadge() {
        const badge  = document.getElementById('hud-mp-badge');
        const codeEl = document.getElementById('hud-mp-code');
        const roleEl = document.getElementById('hud-mp-role');
        if (!badge) return;
        if (mpState.roomCode) {
            badge.style.display = '';
            if (codeEl) codeEl.textContent = mpState.roomCode;
            if (roleEl) roleEl.textContent = mpState.isHost
                ? (mpState.connected ? 'HOST' : 'HOST (aguardando)')
                : (mpState.connected ? 'JOGADOR' : 'JOGADOR (conectando)');
        } else {
            badge.style.display = 'none';
        }
    }

    function startGameIfReady() {
        const gameplayModal = document.getElementById('modal-gameplay');
        if (gameplayModal && !gameplayModal.classList.contains('active')) {
            if (typeof window.startTopDownGame === 'function') {
                gameplayModal.classList.add('active');
                window.startTopDownGame();
            }
        }
        updateHudBadge();
        const sidebar = document.getElementById('multiplayer-sidebar');
        if (sidebar) sidebar.classList.remove('mp-sidebar-visible');
    }

    // ----------------------------------------------------------
    // RENDER DO JOGADOR REMOTO
    // IMPORTANTE: chamado DENTRO do ctx.save()/translate(-camX,-camY)
    // → usa coordenadas de MUNDO (rp.x, rp.y) diretamente, sem subtrair cam
    // ----------------------------------------------------------
    window._renderRemotePlayer = function (ctx, rp, _camX, _camY) {
        // _camX/_camY ignorados — ctx já está no espaço de mundo
        if (!rp || !mpState.connected) return;

        const wx = rp.x; // coordenada de mundo — ctx já está transladado
        const wy = rp.y;

        // Sprite com drawCharacter (mesmo sistema do player local)
        if (typeof window._drawCharacter === 'function') {
            window._drawCharacter(
                wx, wy,
                'player',        // mesmo sprite do player
                '#1a73e8',       // fallback azul se sprite não carregar
                rp.name || '🎮',
                rp.isMoving,
                rp.walkFrame || 0,
                32,
                rp.facing || 'down'
            );
            // Overlay ciano para distinguir do player local
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(Math.floor(wx) - 12, Math.floor(wy) - 14, 24, 28);
            ctx.restore();
        } else {
            // Fallback: quadrado colorido com nome
            ctx.save();
            ctx.fillStyle = '#1a73e8';
            ctx.fillRect(Math.floor(wx) - 12, Math.floor(wy) - 14, 24, 28);
            ctx.fillStyle = '#fff';
            ctx.font = '12px VT323, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(rp.name || '🎮', Math.floor(wx), Math.floor(wy) - 18);
            ctx.restore();
        }

        // Barra de HP (acima do sprite)
        const barW = 36;
        const barH = 5;
        const bx   = Math.floor(wx) - barW / 2;
        const by   = Math.floor(wy) - 34;
        const ratio = Math.max(0, rp.hp / Math.max(1, rp.maxHp));
        ctx.save();
        ctx.fillStyle = '#222';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(bx, by, Math.floor(barW * ratio), barH);
        ctx.restore();

        // Indicador de ataque
        if (rp.isAttacking && rp.weapon) {
            ctx.save();
            ctx.strokeStyle = rp.weapon.color || '#00e5ff';
            ctx.lineWidth   = 3;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.arc(Math.floor(wx), Math.floor(wy), rp.weapon.range || 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Flash de invencibilidade
        if (rp.invincibleTimer > 0) {
            rp.invincibleTimer = Math.max(0, rp.invincibleTimer - 1);
            if (Math.floor(rp.invincibleTimer / 3) % 2 === 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
                ctx.fillRect(Math.floor(wx) - 16, Math.floor(wy) - 16, 32, 32);
                ctx.restore();
            }
        }
    };

    // ----------------------------------------------------------
    // INICIALIZAÇÃO
    // ----------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initMobileBetaModal();
        initMultiplayerToggle();
        initHostLogic();
        initClientLogic();
    });

})();
