let escolhaForcada = null; // Variável para guardar o clique oculto
let rotacaoAtual = 0; // Para controlar a rotação da roleta

// Mapeamento das frases para os segmentos da roleta (0 a 5)
// A ordem deve bater com as cores do CSS: Verde, Vermelho, Verde, Vermelho...
const OPCOES_ROLETA = [
    'CARRO LIBERADO', 'VAI PARA MALHA', 'PODE SEGUIR', 
    'SEGUIR PARA MALHA', 'AUTORIZADO', 'VOCÊ MALHOU'
];

/**
 * Modernização do Script:
 * - Uso de nomes constantes para melhor legibilidade.
 * - Melhoria na formatação de data/hora.
 */
document.addEventListener("DOMContentLoaded", function () {
    const resultado = document.getElementById("resultado");
    const ponteiroEl = document.getElementById("ponteiro");
    const todosBotoesSorteio = document.querySelectorAll(".botao-personalizado, #sortear-btn");
    let sorteando = false; // Flag para evitar cliques duplos
    let tickTimeout = null; // Variável para controlar o loop do som com desaceleração

    // --- Configuração de Áudio (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function tocarTick() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    function criarFaiscas(cor) {
        const container = document.querySelector('.roleta-container');
        const rect = container.getBoundingClientRect();
        const centroX = rect.left + rect.width / 2;
        const centroY = rect.top + rect.height / 2;

        for (let i = 0; i < 40; i++) {
            const faisca = document.createElement('div');
            faisca.className = 'faisca-neon';
            faisca.style.backgroundColor = cor;
            faisca.style.boxShadow = `0 0 10px ${cor}, 0 0 20px ${cor}`;

            const angulo = Math.random() * Math.PI * 2;
            const velocidade = 50 + Math.random() * 150;
            const tx = Math.cos(angulo) * velocidade;
            const ty = Math.sin(angulo) * velocidade;

            faisca.style.setProperty('--tx', `${tx}px`);
            faisca.style.setProperty('--ty', `${ty}px`);
            faisca.style.left = `${centroX}px`;
            faisca.style.top = `${centroY}px`;

            document.body.appendChild(faisca);
            setTimeout(() => faisca.remove(), 800);
        }
    }

    function tickSlowingDown(startTime) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= 3900) return;
    
        tocarTick();
    
        // Progressão não-linear para um efeito de desaceleração mais natural
        const progress = Math.pow(elapsedTime / 4000, 2); 
        // Interpolação linear do intervalo: começa em 60ms e vai até ~400ms
        const delay = 60 + (progress * 340); 
    
        tickTimeout = setTimeout(() => tickSlowingDown(startTime), delay);
    }
    
    // --- Lógica do Tema ---
    const btnTema = document.getElementById("btn-tema");
    // Verifica se o usuário já escolheu o tema clássico anteriormente
    if (localStorage.getItem("tema") === "classico") {
        document.body.classList.add("tema-classico");
    }
    if (btnTema) {
        btnTema.addEventListener("click", () => {
            document.body.classList.toggle("tema-classico");
            // Salva a preferência no navegador
            localStorage.setItem("tema", document.body.classList.contains("tema-classico") ? "classico" : "futurista");
        });
    }
    
    function atualizarDataHora() {
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });
        document.getElementById("datetime").innerText = formatter.format(new Date());
    }
    setInterval(atualizarDataHora, 1000);
    atualizarDataHora();

    // Sintetiza um som de motor de carro acelerando
    function somVeiculo() {
        // Tenta retomar o contexto de áudio se estiver suspenso
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const duration = 3.5;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        // Frequência baixa para simular o ronco do motor
        osc1.frequency.setValueAtTime(60, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration);
        
        osc2.frequency.setValueAtTime(40, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + duration);

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + duration);
        osc2.stop(audioCtx.currentTime + duration);
    }

    function somFreio() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.8);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    }

    function criarFaiscaEscapamento(x, y, tipo = 'sucesso') {
        const faisca = document.createElement('div');
        faisca.className = 'faisca-escapamento';
        if (tipo === 'malha') faisca.classList.add('faisca-smoke');
        
        faisca.style.left = `${x}px`;
        faisca.style.top = `${y}px`;
        document.body.appendChild(faisca);
        setTimeout(() => faisca.remove(), 600);
    }

    function somExplosao() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const gain = audioCtx.createGain();
        const bufferSize = audioCtx.sampleRate * 1.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
    }

    function explodirVeiculo(carro, cor) {
        const rect = carro.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        somExplosao();

        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            p.className = 'particle-explosion';
            p.style.backgroundColor = cor;
            p.style.boxShadow = `0 0 10px ${cor}, 0 0 20px ${cor}`;
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 250;
            p.style.setProperty('--ex', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--ey', `${Math.sin(angle) * dist}px`);
            p.style.left = `${cx}px`;
            p.style.top = `${cy}px`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
        carro.style.opacity = '0';
        setTimeout(() => { carro.style.opacity = '1'; }, 2000);
    }

    function criarRastroPneu(x, y) {
        const rastro = document.createElement('div');
        rastro.className = 'rastro-pneu';
        rastro.style.left = `${x}px`;
        rastro.style.top = `${y}px`;
        rastro.style.width = '35px'; // Comprimento de cada segmento da marca
        document.body.appendChild(rastro);
        setTimeout(() => rastro.remove(), 2000); // Remove após 2 segundos
    }

    function animarVeiculo(tipo = 'sucesso', resultadoTexto = '') {
        console.log(`🚗 [DEBUG] Iniciando animação do veículo (${tipo}) - ${resultadoTexto}...`);
        let carro = document.getElementById('veiculo-animado');
        
        if (!carro) {
            carro = document.createElement('div');
            carro.id = 'veiculo-animado';
            carro.className = 'veiculo';
            document.body.appendChild(carro);
        }

        // Adiciona a sirene se não existir
        let sirene = carro.querySelector('.sirene');
        if (!sirene) {
            sirene = document.createElement('div');
            sirene.className = 'sirene';
            carro.appendChild(sirene);
        }

        // --- CONFIGURAÇÃO DO VEÍCULO ---
        // Se tiver uma imagem em static/img/veiculo_neon.png, coloque o caminho abaixo.
        // Se deixar vazio "", o sistema usará o emoji 🚗 automaticamente.
        const caminhoImagem = ""; // Ex: "/static/img/veiculo_neon.png"

        if (caminhoImagem) {
            carro.style.backgroundImage = `url('${caminhoImagem}')`;
            carro.innerText = ""; // Remove o emoji para não ficar em cima da imagem
        } else {
            carro.style.backgroundImage = "none";
            carro.innerText = "🚗"; // Usa o emoji como fallback
        }

        carro.style.opacity = '1';
        carro.classList.remove('animar-carro', 'animar-carro-malha');
        void carro.offsetWidth; 
        
        carro.classList.add(tipo === 'sucesso' ? 'animar-carro' : 'animar-carro-malha');
        
        // Loop para criar faíscas verdes enquanto o carro corre
        const tempoAnimacao = 3000;
        const intervaloFaiscas = setInterval(() => {
            const rect = carro.getBoundingClientRect();
            // Se o carro sair da tela à direita, paramos de criar faíscas
            if (rect.left > window.innerWidth) return;
            
            // Posição das faíscas (na parte de trás do veículo)
            // rect.left é a traseira se o carro anda para a direita
            const x = rect.left; 
            const y = rect.top + (rect.height * 0.7); // Altura do "escapamento"
            
            criarFaiscaEscapamento(x, y, tipo);

            // Se for Malha, gera o rastro de pneus (frenagem)
            if (tipo === 'malha') {
                const yRastro = rect.bottom - 10; // Posiciona na base do pneu
                criarRastroPneu(x, yRastro);
            }
        }, 50); // Cria uma faísca a cada 50ms

        // Limpa o intervalo após a animação acabar
        setTimeout(() => clearInterval(intervaloFaiscas), tempoAnimacao);

        // Se o resultado for a explosão específica
        if (tipo === 'malha' && resultadoTexto === 'VOCÊ MALHOU') {
            setTimeout(() => {
                clearInterval(intervaloFaiscas);
                explodirVeiculo(carro, "#ff3131");
            }, 1000); // Explode exatamente ao frear
        }

        if (tipo === 'sucesso') {
            somVeiculo();
        } else {
            somFreio();
        }
    }

    // Gera um bipe digital rápido para simular o "início do processamento" da IA
    function somProcessamento() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth'; // Onda dente de serra soa mais eletrônica
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }

    function falar(texto) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = "pt-BR";
        utterance.pitch = 0.5;  // Deixa a voz mais grave e "pesada"
        utterance.rate = 0.85;  // Velocidade levemente reduzida para parecer mecânica

        somProcessamento();
        synth.speak(utterance);
    }

    document.body.addEventListener("click", function (event) {
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            return;
        }

        const larguraTela = window.innerWidth;
        escolhaForcada = event.clientX < larguraTela / 2 ? "esquerda" : "direita";
        // Opcional: um log no console para confirmar que o clique foi registrado
        console.log("Próximo sorteio será forçado para:", escolhaForcada);
    });

    async function realizarSorteio(botaoClicado) {
        if (sorteando) return;
        sorteando = true;
        
        // Inicia o som de "tick" que desacelera com o tempo
        if (tickTimeout) clearTimeout(tickTimeout);
        tickSlowingDown(Date.now());

        // Limpa o resultado anterior enquanto gira
        resultado.innerText = "";
        resultado.classList.remove("resultado-final");
        todosBotoesSorteio.forEach(b => b.disabled = true);

        // Reseta o brilho dos botões para o padrão azul durante o giro
        todosBotoesSorteio.forEach(b => {
            b.style.boxShadow = "";
            b.style.borderColor = "";
        });
        
        // 1. Busca o resultado no servidor
        const res = await fetch("/sortear", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({escolha: escolhaForcada, botao_nome: botaoClicado})
        });
        const data = await res.json();

        // IMPORTANTE: Limpa a escolha forçada para que o próximo sorteio seja aleatório novamente
        escolhaForcada = null;
        
        // 2. Calcula onde a roleta deve parar
        // Encontra o índice da frase sorteada na nossa lista de opções
        let indiceAlvo = OPCOES_ROLETA.indexOf(data.palavra);
        
        // Fallback: se a palavra não for encontrada, escolhe uma da cor certa
        if (indiceAlvo === -1) {
            const opcoesCorreta = data.cor === "#45fd00" ? [0, 2, 4] : [1, 3, 5];
            indiceAlvo = opcoesCorreta[Math.floor(Math.random() * opcoesCorreta.length)];
        }

        // O ponteiro começa apontando para cima (0 graus).
        // Calculamos o ângulo do centro da fatia alvo.
        const anguloFatia = 60;
        const anguloAlvo = (indiceAlvo * anguloFatia) + (anguloFatia / 2);
        
        // Atualiza a rotação global acumulando para sempre girar para frente
        // Adicionamos um multiplicador maior para um giro mais intenso
        rotacaoAtual += (360 * 10) + (anguloAlvo - (rotacaoAtual % 360));
        
        ponteiroEl.style.transform = `rotate(${rotacaoAtual}deg)`;

        setTimeout(() => {
            // Garante que o loop de som parou e toca o "clique" final de travamento
            if (tickTimeout) {
                clearTimeout(tickTimeout);
                tickTimeout = null;
            }
            tocarTick();

            resultado.innerText = data.palavra;
            resultado.style.color = data.cor;
            resultado.classList.add("resultado-final");

            // Verifica se o resultado é "Malha" (vermelho) para tremer a roleta
            if (data.cor === "#ff0d06" || data.cor === "#ff3131") {
                const container = document.querySelector('.roleta-container');
                container.classList.add('roleta-tremor');
                setTimeout(() => container.classList.remove('roleta-tremor'), 450);

                // Faz o fundo da página pulsar em vermelho
                document.body.classList.add('pulsar-malha');
                setTimeout(() => document.body.classList.remove('pulsar-malha'), 1800);
            }
            
            // Log para debug das cores recebidas
            console.log("🎯 [RESULTADO]", data.palavra, "COR:", data.cor);

            // Se for liberado (Verde), o veículo anda
            const coresSucesso = ["#45fd00", "#39ff14"];
            if (data.cor && coresSucesso.some(c => c.toLowerCase() === data.cor.toLowerCase())) {
                animarVeiculo('sucesso', data.palavra);
            } else if (data.cor === "#ff0d06" || data.cor === "#ff3131") {
                // Se for Malha (Vermelho), o veículo freia bruscamente
                animarVeiculo('malha', data.palavra);
            }
            
            // Dispara faíscas neon
            criarFaiscas(data.cor);

            // Sincroniza o brilho dos botões com a cor do resultado
            todosBotoesSorteio.forEach(b => {
                b.style.boxShadow = `0 0 20px ${data.cor}, inset 0 0 10px ${data.cor}`;
                b.style.borderColor = data.cor;
            });

            falar(`${data.botao} - ${data.palavra}`);
            
            sorteando = false;
            todosBotoesSorteio.forEach(b => b.disabled = false);
        }, 4000);
    }

    todosBotoesSorteio.forEach(botao => {
        botao.addEventListener("click", () => {
            let nomeBotao = "SORTEIO";
            if (botao.classList.contains('botao-personalizado')) {
                nomeBotao = botao.innerText;
            }
            realizarSorteio(nomeBotao);
        });
    });
});
