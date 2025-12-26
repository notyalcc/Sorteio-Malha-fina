let botoes = [];
let escolhaUsuario = null;
let ultimoBotao = "";

document.addEventListener("DOMContentLoaded", function () {
    const resultado = document.getElementById("resultado");
    const sortearBtn = document.getElementById("sortear-btn");
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
        let animar = ["CARRO LIBERADO", "VAI PARA MALHA", "AUTORIZADO", "PODE SEGUIR", "VOCÊ MALHOU"];
        for (let i = 0; i < 15; i++) {
            const temp = animar[Math.floor(Math.random() * animar.length)];
            resultado.innerText = temp;
            resultado.style.color = "#cccccc";
            resultado.style.transform = "scale(1.2)";
            await new Promise(r => setTimeout(r, 150));
        }

        const res = await fetch("/sortear", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({escolha: escolhaUsuario, botao_nome: ultimoBotao})
        });
        const data = await res.json();
        resultado.innerText = data.palavra;
        resultado.style.color = data.cor;
        resultado.style.transform = "scale(1.5)";
        falar(`${data.botao} - ${data.palavra}`);
        escolhaUsuario = null;
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
