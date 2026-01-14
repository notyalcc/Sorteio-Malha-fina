let escolhaForcada = null; // Variável para guardar o clique oculto
let rotacaoAtual = 0; // Para controlar a rotação da roleta

// Mapeamento das frases para os segmentos da roleta (0 a 5)
// A ordem deve bater com as cores do CSS: Verde, Vermelho, Verde, Vermelho...
const opcoesRoleta = [
    'CARRO LIBERADO',    // 0: 0-60 graus (Verde)
    'VAI PARA MALHA',    // 1: 60-120 graus (Vermelho)
    'PODE SEGUIR',       // 2: 120-180 graus (Verde)
    'SEGUIR PARA MALHA', // 3: 180-240 graus (Vermelho)
    'AUTORIZADO',        // 4: 240-300 graus (Verde)
    'VOCÊ MALHOU'        // 5: 300-360 graus (Vermelho)
];

document.addEventListener("DOMContentLoaded", function () {
    const resultado = document.getElementById("resultado");
    const ponteiroEl = document.getElementById("ponteiro");
    const todosBotoesSorteio = document.querySelectorAll(".botao-personalizado, #sortear-btn");
    let sorteando = false; // Flag para evitar cliques duplos
    let tickTimeout = null; // Variável para controlar o loop do som com desaceleração

    // --- Configuração de Áudio (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function tocarTick() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'triangle'; // Tipo de onda (som suave)
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Frequência inicial
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1); // Efeito de queda (tick)

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume baixo
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    function tickSlowingDown(startTime) {
        const elapsedTime = Date.now() - startTime;
        
        // Condição de parada: para um pouco antes do final para dar espaço ao "clique" final
        if (elapsedTime >= 3900) {
            return;
        }
    
        tocarTick();
    
        // Calcula o próximo intervalo. Começa rápido (intervalo curto) e fica lento (intervalo longo)
        const progress = elapsedTime / 4000; // Progresso da animação (0.0 a ~1.0)
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
        const agora = new Date();
        document.getElementById("datetime").innerText =
            agora.toLocaleDateString() + " - " + agora.toLocaleTimeString();
    }
    setInterval(atualizarDataHora, 1000);
    atualizarDataHora();

    function falar(texto) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = "pt-BR";
        synth.speak(utterance);
    }

    // Listener para o clique "oculto" no corpo da página
    document.body.addEventListener("click", function (event) {
        // Ignora o clique se ele acontecer dentro de qualquer botão
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            return;
        }

        // Define a escolha baseada no lado da tela que foi clicado
        const larguraTela = window.innerWidth;
        escolhaForcada = event.clientX < larguraTela / 2 ? "esquerda" : "direita";
        // Opcional: um log no console para confirmar que o clique foi registrado
        console.log("Próximo sorteio será forçado para:", escolhaForcada);
    });

    async function realizarSorteio(botaoClicado) {
        if (sorteando) return; // Se já estiver sorteando, não faz nada
        sorteando = true;
        
        // Inicia o som de "tick" que desacelera com o tempo
        if (tickTimeout) clearTimeout(tickTimeout);
        tickSlowingDown(Date.now());

        // Limpa o resultado anterior enquanto gira
        resultado.innerText = "";
        resultado.classList.remove("resultado-final"); // Remove a classe de animação
        todosBotoesSorteio.forEach(b => b.disabled = true); // Desabilita botões
        
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
        let indiceAlvo = opcoesRoleta.indexOf(data.palavra);
        
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
        rotacaoAtual += (360 * 5) + (anguloAlvo - (rotacaoAtual % 360));
        
        ponteiroEl.style.transform = `rotate(${rotacaoAtual}deg)`;

        // 3. Aguarda o fim da animação (4 segundos definidos no CSS) para mostrar o resultado
        setTimeout(() => {
            // Garante que o loop de som parou e toca o "clique" final de travamento
            if (tickTimeout) {
                clearTimeout(tickTimeout);
                tickTimeout = null;
            }
            tocarTick();

            resultado.innerText = data.palavra;
            resultado.style.color = data.cor;
            resultado.classList.add("resultado-final"); // Adiciona classe para animar
            falar(`${data.botao} - ${data.palavra}`);
            
            sorteando = false; // Libera para novo sorteio
            todosBotoesSorteio.forEach(b => b.disabled = false); // Reabilita botões
        }, 4000); // Tempo igual ao transition do CSS
    }

    // Adiciona o evento de clique para TODOS os botões de sorteio
    todosBotoesSorteio.forEach(botao => {
        botao.addEventListener("click", () => {
            // Se o botão for o principal, usa um nome genérico. Senão, usa o texto do botão.
            let nomeBotao = "SORTEIO";
            if (botao.classList.contains('botao-personalizado')) {
                nomeBotao = botao.innerText;
            }
            realizarSorteio(nomeBotao);
        });
    });
});
