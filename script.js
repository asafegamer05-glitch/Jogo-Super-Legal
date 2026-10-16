// JavaScript para Jogo Super Legal

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. CANVAS DE PARTÍCULAS DO MENU PRINCIPAL
    // ==========================================
    (function initMenuParticles() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const PARTICLE_COUNT = 70;
        const particles = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 1.4 + 0.3,
                alpha: Math.random() * 0.5 + 0.1,
                speedY: -(Math.random() * 0.35 + 0.08),
                speedX: (Math.random() - 0.5) * 0.12,
                hue: Math.random() < 0.6 ? 42 : Math.random() < 0.5 ? 0 : 45,
                sat: Math.random() < 0.6 ? 70 : 10,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }

        const beams = Array.from({ length: 3 }, () => ({
            y: Math.random() * window.innerHeight,
            alpha: Math.random() * 0.035 + 0.008,
            speed: (Math.random() - 0.5) * 0.3,
            width: Math.random() * 200 + 100,
        }));

        let frame = 0;

        function draw() {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const grad = ctx.createRadialGradient(
                canvas.width * 0.5, canvas.height * 0.35, 0,
                canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.7
            );
            grad.addColorStop(0, 'rgba(38,18,58,0.55)');
            grad.addColorStop(0.5, 'rgba(20,8,35,0.4)');
            grad.addColorStop(1, 'rgba(4,3,10,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            beams.forEach(b => {
                b.y += b.speed;
                if (b.y < -b.width) b.y = canvas.height + b.width;
                if (b.y > canvas.height + b.width) b.y = -b.width;
                const bg = ctx.createLinearGradient(0, b.y - b.width, 0, b.y + b.width);
                bg.addColorStop(0, 'transparent');
                bg.addColorStop(0.5, `rgba(201,168,76,${b.alpha})`);
                bg.addColorStop(1, 'transparent');
                ctx.fillStyle = bg;
                ctx.fillRect(0, b.y - b.width, canvas.width, b.width * 2);
            });

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.y < -5) p.y = canvas.height + 5;
                if (p.x < -5) p.x = canvas.width + 5;
                if (p.x > canvas.width + 5) p.x = -5;

                const twinkle = Math.sin(frame * p.twinkleSpeed + p.twinkleOffset) * 0.3 + 0.7;
                const finalAlpha = p.alpha * twinkle;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, 80%, ${finalAlpha})`;
                ctx.fill();

                if (p.radius > 1) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, 70%, ${finalAlpha * 0.15})`;
                    ctx.fill();
                }
            });

            requestAnimationFrame(draw);
        }

        draw();
    })();

    // ==========================================
    // 1. GERADOR DE EFEITOS SONOROS (WEB AUDIO)
    // ==========================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playBeep(freq = 440, type = 'square', duration = 0.08) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context safely ignored
        }
    }

    function soundHover() { playBeep(320, 'square', 0.04); }
    function soundClick() { playBeep(580, 'triangle', 0.08); }

    document.querySelectorAll('.menu-btn, .modal-btn, .close-btn, .loc-btn, .attack-btn').forEach(btn => {
        btn.addEventListener('mouseenter', soundHover);
        btn.addEventListener('click', soundClick);
    });


    // ==========================================
    // 2. EXATAS 250 LINHAS DE TERMOS E CONDIÇÕES
    // ==========================================
    function generate250TermsLines() {
        const lines = [];

        lines.push("TERMOS DE SERVIÇO, CONTRATO DE ADESÃO E POLÍTICA DE PRIVACIDADE DO JOGO SUPER LEGAL");
        lines.push("ÚLTIMA ATUALIZAÇÃO: 31 DE AGOSTO DE 2026 - BOSTA LIQUIDA PRODUCTIONS INC.");
        lines.push("==========================================================================================");
        lines.push("PREÂMBULO E ACEITAÇÃO DOS TERMOS");
        lines.push("Ao executar, instalar, visualizar, pensar sobre ou clicar no software intitulado 'jogo super legal',");
        lines.push("você (doravante denominado 'Usuário' ou 'Jogador da Ilha Inicial') concorda irrevogavelmente com");
        lines.push("todos os termos, cláusulas, subcláusulas, parágrafos e observações dispostas neste documento.");
        lines.push("Se você não concordar com qualquer um destes termos, feche os olhos e aceite assim mesmo.");
        lines.push("");
        lines.push("CLÁUSULA 1 - DO OBJETO E ESCOPO DO JOGO");
        lines.push("Artigo 1º. O software 'jogo super legal' é uma obra digital desenvolvida pela Bosta Liquida Productions.");
        lines.push("Artigo 2º. O objetivo do jogo é jogar o jogo até que o jogo não seja mais jogado.");
        lines.push("Artigo 3º. Todos os itens contidos no jogo pertencem exclusivamente ao estúdio e a asafgamery.");
        lines.push("Artigo 4º. O item denominado 'espada espada' é classificado formalmente como uma espada que é uma espada.");
        lines.push("Artigo 5º. O item denominado 'espada melhor' possui qualidade superior à 'espada espada'.");
        lines.push("Artigo 6º. O item denominado 'espada mais melhor' possui qualidade superior à 'espada melhor'.");
        lines.push("Artigo 7º. O item denominado 'espada muito mais melhor' é a espada máxima absoluta do sistema.");

        let currentArt = 8;
        const funnyFacts = [
            "E você também concorda formalmente que pizza de calabresa é o melhor sabor de pizza do mundo.",
            "O Usuário concorda que pizza de calabresa com borda recheada supera qualquer outra opção gastronômica.",
            "Fica expressamente vedado discordar da supremacia da pizza de calabresa sob pena de perda da espada espada.",
            "O Usuário cede os direitos morais sobre sua própria sombra em dias ensolarados para a Bosta Liquida Productions.",
            "A Bosta Liquida Productions não se responsabiliza por perda de tempo, vida ou felicidade ao jogar este jogo.",
            "O Ray Tracing foi oficialmente adicionado no Update 55 e acidentalmente excluído no Update 56 por asafgamery.",
            "Qualquer reclamação judicial deverá ser efetuada presencialmente no topo da ilha dps da dps da inicial.",
            "O Usuário declara que possui capacidade mental para diferenciar uma espada de uma espada melhor.",
            "Fica proibido pisar na grama verde da ilha inicial sem permissão por escrito emitida por asafgamery.",
            "O Usuário autoriza o envio de 0 (zero) e-mails de marketing pois não temos servidor de e-mail.",
            "Caso o jogo apresente lag, o Usuário concorda em culpar sua própria conexão de internet ou o destino.",
            "Fica estabelecido que o sabor de coxinha de frango com catupiry é o segundo melhor sabor de salgado.",
            "O Usuário reconhece que a ilha dps da inicial fica geograficamente localizada exatamente depois da inicial.",
            "A Bosta Liquida Productions reserva-se o direito de alterar estes termos sem aviso prévio porque nós queremos.",
            "Todos os 80 cargos de desenvolvimento listados nos créditos pertencem exclusivamente ao desenvolvedor asafgamery."
        ];

        while (lines.length < 246) {
            const fact = funnyFacts[(lines.length) % funnyFacts.length];
            lines.push(`Artigo ${currentArt}º. Parágrafo único: ${fact}`);
            currentArt++;
        }

        lines.push("");
        lines.push("CLÁUSULA 250 - DA ASSINATURA E ACEITE FINAL");
        lines.push("Artigo 250º. Ao clicar no botão 'ACEITAR E CONCORDAR', o Usuário ratifica todos os 250 itens deste contrato.");
        lines.push("DECLARO QUE LI TODAS AS 250 LINHAS DESTE TERMO E CONCORDO INTEGRALMENTE QUE PIZZA DE CALABRESA É A MELHOR.");
        lines.push("BOSTA LIQUIDA PRODUCTIONS © 2026 - TODOS OS DIREITOS RESERVADOS POR QUE NÓS QUEREMOS.");

        while (lines.length < 250) {
            lines.splice(lines.length - 3, 0, `Artigo ${currentArt}º. O Usuário ratifica a observância plena do disposto no artigo anterior.`);
            currentArt++;
        }
        if (lines.length > 250) {
            lines.length = 250;
        }

        return lines;
    }

    const termsLines = generate250TermsLines();
    const termsContainer = document.getElementById('terms-container');
    if (termsContainer) {
        termsLines.forEach((lineText) => {
            const div = document.createElement('div');
            div.className = 'terms-line';
            if (lineText.startsWith('TERMOS') || lineText.startsWith('CLÁUSULA') || lineText.startsWith('PREÂMBULO')) {
                div.classList.add('header-line');
            } else if (lineText.includes('pizza de calabresa')) {
                div.classList.add('clause-line');
            }
            div.innerText = lineText;
            termsContainer.appendChild(div);
        });
    }

    // Terms Buttons
    const modalTerms = document.getElementById('modal-terms');
    document.getElementById('btn-accept-terms')?.addEventListener('click', () => {
        if (modalTerms) modalTerms.classList.remove('active');
    });

    document.getElementById('btn-decline-terms')?.addEventListener('click', () => {
        alert("Você é obrigado a aceitar e concordar com os Termos de Serviço (e com a pizza de calabresa) para acessar o menu de jogo super legal!");
    });


    // ==========================================
    // 3. EXPANSÃO DAS OPÇÕES DO JOGO (40 OPÇÕES)
    // ==========================================
    const optionsData = [
        { label: "Volume Geral", options: ["100%", "80%", "50%", "0%"] },
        { label: "Volume da Música", options: ["Música", "Mais Música", "Sem Música"] },
        { label: "Volume dos Efeitos", options: ["Efeitos", "Mais Efeitos", "Sem Efeitos"] },
        { label: "Volume da Espada", options: ["Normal", "Alto", "Super Alto"] },
        { label: "Ray Tracing", options: ["Desligado", "Ligado", "Ultra", "Deletado no Update 56"] },
        { label: "Path Tracing", options: ["Desligado", "Baixo", "Médio", "Alto"] },
        { label: "Ray-Traced Reflections", options: ["Desligado", "Ligado"] },
        { label: "Ray-Traced Shadows", options: ["Desligado", "Ligado"] },
        { label: "Anti-Aliasing (AA)", options: ["FXAA", "SMAA", "TAA", "MSAA 4x", "MSAA 8x"] },
        { label: "Nvidia DLSS", options: ["Desligado", "Desempenho", "Equilibrado", "Qualidade", "Ultra Qualidade"] },
        { label: "AMD FSR", options: ["Desligado", "FSR 1.0", "FSR 2.0", "FSR 3.0 (Frame Gen)"] },
        { label: "Intel XeSS", options: ["Desligado", "Desempenho", "Qualidade"] },
        { label: "Resolução", options: ["1920x1080", "2560x1440", "3840x2160 (4K)", "800x600"] },
        { label: "Modo de Exibição", options: ["Tela Cheia", "Janela Sem Bordas", "Janela"] },
        { label: "Taxa de Atualização", options: ["60 Hz", "144 Hz", "240 Hz", "Infinito FPS"] },
        { label: "V-Sync", options: ["Ligado", "Desligado", "Fast Sync"] },
        { label: "Triple Buffering", options: ["Ligado", "Desligado"] },
        { label: "Filtragem Anisotrópica", options: ["2x", "4x", "8x", "16x"] },
        { label: "Qualidade de Texturas", options: ["Baixa", "Média", "Alta", "Ultra"] },
        { label: "Qualidade de Sombras", options: ["Baixa", "Média", "Alta", "Ultra"] },
        { label: "Oclusão Ambiental", options: ["Desligado", "SSAO", "HBAO+", "VXAO"] },
        { label: "Reflexos de Tela (SSR)", options: ["Baixo", "Médio", "Alto"] },
        { label: "Névoa Volumétrica", options: ["Desligado", "Baixo", "Alto"] },
        { label: "Iluminação Volumétrica", options: ["Desligado", "Ligado"] },
        { label: "Profundidade de Campo", options: ["Ligado", "Desligado"] },
        { label: "Desfoque de Movimento", options: ["Ligado", "Desligado"] },
        { label: "Aberração Cromática", options: ["Ligado", "Desligado"] },
        { label: "Efeito Bloom", options: ["Ligado", "Desligado"] },
        { label: "Efeito Vinheta", options: ["Ligado", "Desligado"] },
        { label: "Grão de Filme", options: ["0%", "50%", "100%"] },
        { label: "Efeito Lens Flare", options: ["Ligado", "Desligado"] },
        { label: "Física das Pedras", options: ["Simples", "Complexa", "Ultra Realista"] },
        { label: "Grama da Ilha Inicial", options: ["Pouca Grama", "Muita Grama", "Grama Verde"] },
        { label: "Densidade de Inimigos", options: ["Poucos", "Normais", "Muitos Inimigos Inimigos"] },
        { label: "Multiplayer", options: ["Ativado", "Desativado", "Somente Amigos"] },
        { label: "Servidor Dedicado", options: ["Localhost", "Nuvem", "Servidor da Bosta Liquida"] },
        { label: "Crossplay", options: ["Ativado", "Desativado"] },
        { label: "Chat de Voz", options: ["Ativado", "Desativado"] },
        { label: "Tickrate do Servidor", options: ["64 Tick", "128 Tick"] },
        { label: "Campo de Visão (FOV)", options: ["70", "90", "110", "120"] }
    ];

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsData.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'option-item';

            const optsHtml = opt.options.map(o => `<option>${o}</option>`).join('');
            item.innerHTML = `
                <label>${opt.label}:</label>
                <select class="dummy-option">${optsHtml}</select>
            `;
            optionsContainer.appendChild(item);
        });
    }


    // ==========================================
    // 4. EXATOS 80 CARGOS DOS CRÉDITOS
    // ==========================================
    const creditsList = [
        "CEO",
        "Vice-Presidente Executivo de Coisas",
        "Diretor Criativo",
        "Designer de Ilhas",
        "Designer da Ilha Inicial",
        "Designer da Ilha dps da Inicial",
        "Designer da Ilha dps da dps da Inicial",
        "Designer do Lugar",
        "Criador da Espada Espada",
        "Criador da Espada Melhor",
        "Criador da Espada Mais Melhor",
        "Criador da Espada Muito Mais Melhor",
        "Gerente de Nomes Literais",
        "Líder de Planejamento",
        "Programador Principal",
        "Programador Secundário",
        "Programador de Botões",
        "Programador do Botão de Opções",
        "Programador do Botão de Créditos",
        "Programador de Erros e Bugs",
        "Artista 2D",
        "Artista 3D",
        "Artista 1D",
        "Artista 4D",
        "Compositor das Músicas",
        "Sonoplasta do Som",
        "Sonoplasta da Espada Batendo",
        "Roteirista da História",
        "Revisor do Roteiro",
        "Revisor do Revisor",
        "Testador de Ilhas",
        "Quality Assurance",
        "Coordenador de Café",
        "Tomador de Café",
        "Limpador de Teclado",
        "Especialista em Ray Tracing",
        "Pessoa que Deletou o Ray Tracing por Querer",
        "Designer de UI",
        "Designer de UX",
        "Designer de Menu",
        "Chefe do Departamento de Nomes de Comida",
        "Criador da Comida Comida",
        "Criador da Comida Melhor",
        "Criador do Inimigo Inimigo",
        "Criador do Inimigo Forte",
        "Criador do Boss Boss",
        "Tradutor para Português",
        "Tradutor para Idioma",
        "Diretor de Marketing",
        "Estagiário de Marketing",
        "Gerente de Comunidade",
        "Moderador do Discord",
        "Administrador do Servidor Localhost",
        "Engenheiro de Física de Coisas Cadentes",
        "Engenheiro de Textura de Grama",
        "Engenheiro de Iluminação",
        "Engenheiro de Sombra da Iluminação",
        "Consultor de RPG",
        "Consultor de Microtransações",
        "Designer de Pay-to-Win",
        "Modelador de Espadas",
        "Modelador de Pedras",
        "Modelador de Arrvores",
        "Controlador de FPS",
        "Otimizador de Lag",
        "Criador do Log de Updates",
        "Escritor das 80 Funções dos Créditos",
        "Diretor Financeiro",
        "Contador",
        "Advogado dos Direitos Reservados",
        "Dono da Bosta Liquida Productions",
        "Faxineiro do Studio",
        "Suporte Técnico",
        "Atendimento ao Cliente",
        "Criador de Memes",
        "Sommelier de Bugs",
        "Guru Espiritual do Projeto",
        "Espectador da Própria Conquista",
        "Fã nº 1 do Jogo",
        "Deus do Jogo Super Legal"
    ];

    const creditsContainer = document.getElementById('credits-container');
    if (creditsContainer) {
        creditsList.forEach((role, index) => {
            const card = document.createElement('div');
            card.className = 'credit-card';
            card.innerHTML = `
                <span class="credit-role">${index + 1}. ${role}</span>
                <span class="credit-author">asafgamery</span>
            `;
            creditsContainer.appendChild(card);
        });
    }


    // ==========================================
    // 5. EXATOS 60 UPDATES DO LOG
    // ==========================================
    const updatesList = [
        "update 1: primeiro update",
        "update 2: update depois do primeiro",
        "update 3: update depois do update depois do primeiro",
        "update 4: adicionado o jogo",
        "update 5: corrigido o bug onde o jogo funcionava demais",
        "update 6: adicionada a espada espada",
        "update 7: adicionada a espada melhor",
        "update 8: balanceamento da espada melhor",
        "update 9: adicionada a espada mais melhor",
        "update 10: adicionada a espada muito mais melhor",
        "update 11: renomeado o menu para menu",
        "update 12: adicionado o botão de clicar",
        "update 13: removido o botão de clicar pois clicava muito",
        "update 14: recolocado o botão de clicar",
        "update 15: ilha inicial adicionada",
        "update 16: ilha dps da inicial adicionada",
        "update 17: ilha dps da dps da inicial adicionada",
        "update 18: adicionado o lugar",
        "update 19: adicionada a ilha",
        "update 20: adicionado inimigo inimigo",
        "update 21: inimigo inimigo agora dá dano",
        "update 22: adicionada comida comida",
        "update 23: alterado o preço das coisas",
        "update 24: adicionada opção de opções",
        "update 25: otimização no carregamento",
        "update 26: adicionado o estagiário asafgamery",
        "update 27: promovido asafgamery para CEO",
        "update 28: mudado nome do estúdio para bosta liquida productions",
        "update 29: adicionado efeito sonoro de som",
        "update 30: adicionada cor amarela no título",
        "update 31: adicionado bug novo",
        "update 32: corrigido o bug do update 31",
        "update 33: re-adicionado o bug do update 31",
        "update 34: adicionada grama verde na ilha inicial",
        "update 35: adicionada pedra cinza no lugar",
        "update 36: agua agora molha",
        "update 37: adicionado boss supremo",
        "update 38: nerf no boss supremo",
        "update 39: adicionado sistema de nivel",
        "update 40: xp agora se chama xp",
        "update 41: adicionada loja da loja",
        "update 42: adicionada potion potion",
        "update 43: ajustado a gravidade",
        "update 44: adicionado o sol no céu",
        "update 45: adicionada a lua na noite",
        "update 46: adicionado dia e noite alternando",
        "update 47: tiramos a noite",
        "update 48: voltamos com a noite",
        "update 49: adicionado botão de sair",
        "update 50: comemoração de 50 updates",
        "update 51: suporte a monitores de tela",
        "update 52: adicionado som de passos ao andar",
        "update 53: removido lag",
        "update 54: testando se o log de updates funciona",
        "update 55: adicionado ray tracing",
        "update 56: apaguei o ray tracing querer kkkkkkkkkkkkkkkkkkkkkkkkkkkk",
        "update 57: tentando recuperar o ray tracing na lixeira",
        "update 58: desisti do ray tracing",
        "update 59: pré-update do update 60",
        "update 60: update final do menu"
    ];

    const updatesContainer = document.getElementById('updates-container');
    if (updatesContainer) {
        updatesList.forEach((updText, idx) => {
            const row = document.createElement('div');
            row.className = 'update-row';
            row.innerHTML = `
                <span class="update-num">#${idx + 1}</span>
                <span class="update-text">${updText}</span>
            `;
            updatesContainer.appendChild(row);
        });
    }


    // ==========================================
    // 6. LÓGICA DOS MODAIS (ABRIR E FECHAR)
    // ==========================================
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    document.getElementById('btn-start')?.addEventListener('click', () => {
        openModal('modal-gameplay');
        if (typeof window.startTopDownGame === 'function') {
            window.startTopDownGame();
        }
    });

    document.getElementById('btn-options')?.addEventListener('click', () => openModal('modal-options'));
    document.getElementById('btn-credits')?.addEventListener('click', () => openModal('modal-credits'));
    document.getElementById('btn-updates')?.addEventListener('click', () => openModal('modal-updates'));

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close');
            closeModal(targetId);
        });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop && backdrop.id !== 'modal-terms') {
                backdrop.classList.remove('active');
            }
        });
    });

    // ==========================================
    // 7. BOTÃO DE TELA CHEIA (CANTO SUPERIOR DIREITO)
    // ==========================================
    // 7. BOTÕES DE TELA CHEIA (MENU, GAMEPLAY E PAINEL)
    // ==========================================
    function toggleFullScreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(() => {});
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    ['btn-fullscreen', 'btn-gameplay-fs', 'btn-drawer-fs'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullScreen();
        });
    });

    function updateAllFullscreenButtons() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        ['btn-fullscreen', 'btn-gameplay-fs'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const icon = btn.querySelector('.fs-icon');
            const text = btn.querySelector('.fs-text');
            if (icon) icon.innerText = isFs ? '🗗' : '⛶';
            if (text) text.innerText = isFs ? 'SAIR TELA CHEIA' : 'TELA CHEIA';
        });
        const drawerFsBtn = document.getElementById('btn-drawer-fs');
        if (drawerFsBtn) {
            const lb = drawerFsBtn.querySelector('.btn-lb');
            if (lb) lb.innerText = isFs ? 'SAIR DA TELA CHEIA' : 'ALTERNAR TELA CHEIA';
        }
    }

    document.addEventListener('fullscreenchange', updateAllFullscreenButtons);
    document.addEventListener('webkitfullscreenchange', updateAllFullscreenButtons);

    // ==========================================
    // 8. PAINEL LATERAL RETRÁTIL DO HUD (GAMEPLAY)
    // ==========================================
    const hudDrawer = document.getElementById('hud-side-panel');
    const hudDrawerBackdrop = document.getElementById('hud-drawer-backdrop');
    const btnToggleHud = document.getElementById('btn-toggle-hud-panel');
    const btnCloseHud = document.getElementById('btn-close-hud-panel');
    const hudTopRightGroup = document.getElementById('hud-top-right-group');

    function toggleHudDrawer(open) {
        if (!hudDrawer) return;
        const willOpen = typeof open === 'boolean' ? open : !hudDrawer.classList.contains('active');
        hudDrawer.classList.toggle('active', willOpen);
        if (hudDrawerBackdrop) hudDrawerBackdrop.classList.toggle('active', willOpen);
        if (btnToggleHud) btnToggleHud.classList.toggle('active', willOpen);
        if (hudTopRightGroup) hudTopRightGroup.classList.toggle('drawer-open', willOpen);
    }

    btnToggleHud?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleHudDrawer();
    });

    btnCloseHud?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleHudDrawer(false);
    });

    hudDrawerBackdrop?.addEventListener('click', () => toggleHudDrawer(false));

    document.querySelectorAll('#hud-side-panel .drawer-action-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleHudDrawer(false));
    });

});
