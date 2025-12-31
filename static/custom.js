let botoes = [];
let escolhaUsuario = null;
let ultimoBotao = "";
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
    const sortearBtn = document.getElementById("sortear-btn");
    const roletaEl = document.getElementById("roleta");
    botoes = document.querySelectorAll(".botao-personalizado");

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

    async function sortear() {
        // Limpa o resultado anterior enquanto gira
        resultado.innerText = "";
        
        // 1. Busca o resultado no servidor
        const res = await fetch("/sortear", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({escolha: escolhaUsuario, botao_nome: ultimoBotao})
        });
        const data = await res.json();
        
        // 2. Calcula onde a roleta deve parar
        // Encontra o índice da frase sorteada na nossa lista de opções
        let indiceAlvo = opcoesRoleta.indexOf(data.palavra);
        
        // Se a frase do servidor não estiver na lista (segurança), pega uma aleatória da cor certa
        if (indiceAlvo === -1) {
            // Se for verde (liberado), usa índice 0, se vermelho, usa 1
            indiceAlvo = (data.cor === "#45fd00") ? 0 : 1;
        }

        // Cada fatia tem 60 graus. O centro da fatia é (indice * 60) + 30.
        // Como a seta está no topo (0 graus), precisamos girar a roleta para que o ângulo alvo fique no topo.
        // A rotação é no sentido horário, então subtraímos o ângulo alvo de 360 (ou invertemos o sinal).
        // Adicionamos voltas extras (360 * 5) para dar o efeito de giro rápido.
        
        const anguloFatia = 60;
        const anguloAlvo = 360 - ((indiceAlvo * anguloFatia) + (anguloFatia / 2)); 
        
        // Atualiza a rotação global acumulando para sempre girar para frente
        rotacaoAtual += (360 * 5) + (anguloAlvo - (rotacaoAtual % 360));
        
        roletaEl.style.transform = `rotate(${rotacaoAtual}deg)`;

        // 3. Aguarda o fim da animação (4 segundos definidos no CSS) para mostrar o resultado
        setTimeout(() => {
            resultado.innerText = data.palavra;
            resultado.style.color = data.cor;
            resultado.style.transform = "scale(1.5)";
            falar(`${data.botao} - ${data.palavra}`);
            escolhaUsuario = null;
        }, 4000); // Tempo igual ao transition do CSS
    }

    sortearBtn.addEventListener("click", () => {
        ultimoBotao = "SORTEIO";
        sortear();
    });

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            ultimoBotao = botao.innerText;
            sortear();
        });
    });

    document.body.addEventListener("click", function (event) {
        const largura = window.innerWidth;
        const target = event.target;
        if (target.classList.contains("botao-personalizado") ||
            target.id === "sortear-btn" ||
            target.tagName === "BUTTON") {
            return;
        }
        escolhaUsuario = event.clientX < largura / 2 ? "esquerda" : "direita";
    });
});

function adicionarBotao() {
    const nome = prompt("Nome do novo botão:");
    if (!nome) return;
    const novos = Array.from(document.querySelectorAll(".botao-personalizado")).map(b => b.textContent);
    novos.push(nome);
    atualizarBotoes(novos);
}

function removerBotao() {
    const botoesAtuais = Array.from(document.querySelectorAll(".botao-personalizado")).map(b => b.textContent);
    const nome = prompt("Digite o nome do botão para remover:");
    if (!nome || !botoesAtuais.includes(nome)) return alert("Nome inválido");
    const novos = botoesAtuais.filter(b => b !== nome);
    atualizarBotoes(novos);
}

function renomearBotoes() {
    const novos = [];
    document.querySelectorAll(".botao-personalizado").forEach((b) => {
        const novo = prompt(`Renomear "${b.textContent}" para:`, b.textContent);
        if (novo) novos.push(novo);
        else novos.push(b.textContent);
    });
    atualizarBotoes(novos);
}

async function atualizarBotoes(lista) {
    await fetch("/botoes", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({botoes: lista})
    });
    location.reload();
}
