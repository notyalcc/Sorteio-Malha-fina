from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import random, json, os, sys, webbrowser
from threading import Timer

# Define o diretório base como o local deste script
if getattr(sys, 'frozen', False):
    # Se for executável (PyInstaller), usa o diretório do .exe
    base_dir = os.path.dirname(sys.executable)
    template_folder = os.path.join(base_dir, 'templates')
    static_folder = os.path.join(base_dir, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    # Se for script Python, usa o diretório do script
    base_dir = os.path.dirname(os.path.abspath(__file__))
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
BOTAO_JSON = os.path.join(base_dir, "button_names.json")

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
    return render_template("login_usuario.html", erro=erro)

# --- ÁREA ADMINISTRATIVA (NOVO) ---

@app.route("/login", methods=["GET", "POST"])
def login():
    erro = None
    if request.method == "POST":
        if request.form.get("senha") == SENHA_ADMIN:
            session["admin_logado"] = True
            return redirect(url_for("configuracao"))
        erro = "Senha incorreta!"
    
    return render_template("login.html", erro=erro)

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

    return render_template("config.html", botoes=botoes)

def abrir_navegador():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == "__main__":
    # Abre o navegador automaticamente após 1 segundo
    Timer(1, abrir_navegador).start()
    app.run(host="0.0.0.0", port=5000)
