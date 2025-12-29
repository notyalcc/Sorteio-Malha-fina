from flask import Flask, render_template, request, jsonify, session, redirect, url_for, render_template_string
import random, json, os

# Define o diretório base como o local deste script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)

app.secret_key = "chave_secreta_segura" # Necessário para o login funcionar
SENHA_ADMIN = "82465123"#DFINA SUA SENHA DE ADMIN AQUI
SENHA_USUARIO = "via@clayton" # Senha para acessar o sorteio (Operadores)

PALAVRAS_MALHA = ['VAI PARA MALHA', 'SEGUIR PARA MALHA', 'VOCÊ MALHOU']
PALAVRAS_LIBERADO = ['CARRO LIBERADO', 'PODE SEGUIR', 'AUTORIZADO']
PALAVRAS = PALAVRAS_MALHA + PALAVRAS_LIBERADO
CORES = {
    "CARRO LIBERADO": "#45fd00",  
    "PODE SEGUIR": "#45fd00",
    "AUTORIZADO": "#45fd00",
    "VAI PARA MALHA": "#ff0d06",
    "SEGUIR PARA MALHA": "#ff0d06",
    "VOCÊ MALHOU": "#ff0d06",
}

# Garante que o JSON seja salvo no mesmo local do executável/script
BOTAO_JSON = os.path.join(BASE_DIR, "button_names.json")

def carregar_botoes():
    if os.path.exists(BOTAO_JSON):
        try:
            with open(BOTAO_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass # Retorna o padrão se houver erro
    return [f"Botão {i+1}" for i in range(8)]

def salvar_botoes(lista):
    with open(BOTAO_JSON, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=4)

@app.route("/")
def index():
    if not session.get("usuario_logado"):
        return redirect(url_for("login_usuario"))
    botoes = carregar_botoes()
    return render_template("index.html", botoes=botoes)

@app.route("/sortear", methods=["POST"])
def sortear():
    escolha = request.json.get("escolha")
    botao_nome = request.json.get("botao_nome", "Botão")
    if escolha == "direita":
        palavra = random.choice(PALAVRAS_MALHA)
    elif escolha == "esquerda":
        palavra = random.choice(PALAVRAS_LIBERADO)
    else:
        palavra = random.choice(PALAVRAS)
    cor = CORES.get(palavra, "#f3f3f3")
    return jsonify({"palavra": palavra, "cor": cor, "botao": botao_nome})

@app.route("/botoes", methods=["POST"])
def atualizar_botoes():
    botoes = request.json.get("botoes")
    salvar_botoes(botoes)
    return jsonify({"status": "salvo"})

@app.route("/entrar", methods=["GET", "POST"])
def login_usuario():
    erro = None
    if request.method == "POST":
        if request.form.get("senha") == SENHA_USUARIO:
            session["usuario_logado"] = True
            return redirect(url_for("index"))
        erro = "Senha incorreta!"
    return render_template_string(LOGIN_USUARIO_HTML, erro=erro)

# --- ÁREA ADMINISTRATIVA (NOVO) ---

@app.route("/login", methods=["GET", "POST"])
def login():
    erro = None
    if request.method == "POST":
        if request.form.get("senha") == SENHA_ADMIN:
            session["admin_logado"] = True
            return redirect(url_for("configuracao"))
        erro = "Senha incorreta!"
    
    return render_template_string(LOGIN_HTML, erro=erro)

@app.route("/logout")
def logout():
    session.pop("admin_logado", None)
    return redirect(url_for("index"))

@app.route("/config", methods=["GET", "POST"])
def configuracao():
    if not session.get("admin_logado"):
        return redirect(url_for("login"))
    
    botoes = carregar_botoes()
    
    if request.method == "POST":
        acao = request.form.get("acao")
        if acao == "adicionar":
            nome = request.form.get("nome")
            if nome: botoes.append(nome)
        elif acao == "editar":
            idx = int(request.form.get("indice"))
            nome = request.form.get("nome")
            if 0 <= idx < len(botoes) and nome: botoes[idx] = nome
        elif acao == "excluir":
            idx = int(request.form.get("indice"))
            if 0 <= idx < len(botoes): botoes.pop(idx)
        
        salvar_botoes(botoes)
        return redirect(url_for("configuracao"))

    return render_template_string(CONFIG_HTML, botoes=botoes)

# --- TEMPLATES HTML (Movidos para o final para limpeza do código) ---

LOGIN_USUARIO_HTML = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Acesso ao Sorteio</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-white d-flex align-items-center justify-content-center vh-100">
    <div class="card bg-secondary text-white p-4" style="max-width: 500px; width: 100%;">
        <h2 class="text-center mb-3">Acesso ao Sorteio</h2>
        <div class="alert alert-info text-dark">
            <strong>Instruções:</strong><br>
            1. Insira a senha de acesso abaixo para entrar.<br>
            2. Na tela principal, clique em um dos botões.<br>
            3. O sistema indicará o destino (Liberado ou Malha Fina).
        </div>
        {% if erro %}<div class="alert alert-danger">{{ erro }}</div>{% endif %}
        <form method="post">
            <input type="password" name="senha" class="form-control mb-3" placeholder="Senha de Acesso" required>
            <button type="submit" class="btn btn-success w-100">Entrar</button>
        </form>
    </div>
</body>
</html>
"""

LOGIN_HTML = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-white d-flex align-items-center justify-content-center vh-100">
    <div class="card bg-secondary text-white p-4" style="max-width: 400px; width: 100%;">
        <h2 class="text-center mb-3">Login Admin</h2>
        {% if erro %}<div class="alert alert-danger">{{ erro }}</div>{% endif %}
        <form method="post">
            <input type="password" name="senha" class="form-control mb-3" placeholder="Senha" required>
            <button type="submit" class="btn btn-primary w-100">Entrar</button>
        </form>
        <div class="text-center mt-3"><a href="/" class="text-light text-decoration-none">← Voltar</a></div>
    </div>
</body>
</html>
"""

CONFIG_HTML = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Configurar Botões</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-white">
    <div class="container py-5" style="max-width: 800px;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Configurar Botões</h1>
            <a href="/logout" class="btn btn-danger btn-sm">Sair</a>
        </div>
        <a href="/" class="btn btn-outline-light mb-4">← Voltar ao Sorteio</a>
        
        <div class="card bg-secondary text-white mb-4">
            <div class="card-body">
                <h5 class="card-title">Adicionar Novo Botão</h5>
                <form method="post" class="d-flex gap-2">
                    <input type="hidden" name="acao" value="adicionar">
                    <input type="text" name="nome" class="form-control" placeholder="Nome do botão" required>
                    <button class="btn btn-success">Adicionar</button>
                </form>
            </div>
        </div>

        <h3>Lista Atual</h3>
        <div class="list-group">
            {% for i in range(botoes|length) %}
            <div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                <form method="post" class="d-flex gap-2 flex-grow-1 me-2">
                    <input type="hidden" name="acao" value="editar">
                    <input type="hidden" name="indice" value="{{i}}">
                    <input type="text" name="nome" value="{{botoes[i]}}" class="form-control bg-secondary text-white border-0">
                    <button class="btn btn-primary btn-sm">Salvar</button>
                </form>
                <form method="post">
                    <input type="hidden" name="acao" value="excluir">
                    <input type="hidden" name="indice" value="{{i}}">
                    <button class="btn btn-danger btn-sm" onclick="return confirm('Excluir?')">X</button>
                </form>
            </div>
            {% endfor %}
        </div>
    </div>
</body>
</html>
"""

if __name__ == "__main__":
    # Em produção, o servidor (Gunicorn/Waitress) gerencia a porta, mas para teste local:
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
