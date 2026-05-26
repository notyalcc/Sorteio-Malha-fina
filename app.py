from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import random, json, os, sys, webbrowser
from flask_sqlalchemy import SQLAlchemy
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

SENHA_ADMIN = "admin"#DFINA SUA SENHA DE ADMIN AQUI
SENHA_USUARIO = "admin" # Senha para acessar o sorteio (Operadores)

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

# Necessário para o login funcionar
app.secret_key = "chave_secreta_segura" 

# Garante que o JSON seja salvo no mesmo local do executável/script
BOTAO_JSON = os.path.join(base_dir, "button_names.json")

# --- Database Configuration ---
# Tenta pegar a URL do banco de dados das variáveis de ambiente (Render/Supabase)
# Se não encontrar, usa o SQLite local para desenvolvimento
uri = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(base_dir, 'site.db'))
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Model for Buttons ---
class Button(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<Button {self.name}>"

# Função para inicializar o banco de dados e migrar do JSON se necessário
def initialize_database():
    with app.app_context():
        db.create_all() # Garante que as tabelas existem
        # Verifica se já existem botões no banco de dados
        if not Button.query.first():
            # Se o DB estiver vazio, tenta carregar do JSON (passo de migração)
            if os.path.exists(BOTAO_JSON):
                try:
                    with open(BOTAO_JSON, "r", encoding="utf-8") as f:
                        json_buttons = json.load(f)
                        if json_buttons:
                            for name in json_buttons:
                                db.session.add(Button(name=name))
                            db.session.commit()
                            # Não removemos o arquivo no Render para evitar erros de permissão, 
                            # apenas ignoramos nas próximas vezes
                            print(f"Migrated {len(json_buttons)} buttons from JSON to DB.")
                        else:
                            raise ValueError("JSON vazio")
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Error migrating from JSON: {e}")
            
            # Se ainda não houver botões (ou a migração falhou), adiciona os padrões
            if not Button.query.first():
                default_buttons = [f"Botão {i+1}" for i in range(8)]
                for name in default_buttons:
                    db.session.add(Button(name=name))
                db.session.commit()
                print(f"Initialized DB with {len(default_buttons)} default buttons.")

def carregar_botoes():
    with app.app_context():
        return [b.name for b in Button.query.order_by(Button.id).all()]

def salvar_botoes(lista):
    with app.app_context():
        # Limpa os botões existentes
        Button.query.delete()
        # Adiciona os novos botões
        for name in lista:
            db.session.add(Button(name=name))
        db.session.commit()

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
    initialize_database() # Chama a função de inicialização do banco de dados
    # Abre o navegador automaticamente após 1 segundo
    Timer(1, abrir_navegador).start()
    app.run(host="0.0.0.0", port=5000)
