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

# Recomenda-se usar variáveis de ambiente para senhas em produção
SENHA_ADMIN = os.environ.get("SENHA_ADMIN", "admin")
SENHA_USUARIO = os.environ.get("SENHA_USUARIO", "admin")

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
app.secret_key = os.environ.get("SECRET_KEY", "chave_secreta_padrao_para_dev")

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
    __tablename__ = 'button'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<Button {self.name}>"

# Função para inicializar o banco de dados e migrar do JSON se necessário
def initialize_database():
    try:
        with app.app_context():
            # Força a criação das tabelas se não existirem
            db.create_all()
            db.session.commit()
            print("[*] Tabelas verificadas/criadas com sucesso.")

            # Verifica se já existem dados
            stmt_check = db.select(db.func.count(Button.id))
            if db.session.execute(stmt_check).first() is None:
                print("[*] Banco de dados vazio. Iniciando população inicial...")
                
                # Tenta migrar do JSON existente
                botoos_iniciais = []
                if os.path.exists(BOTAO_JSON):
                    try:
                        with open(BOTAO_JSON, "r", encoding="utf-8") as f:
                            botoos_iniciais = json.load(f)
                            print(f"[+] Lidos {len(botoos_iniciais)} botões do arquivo JSON.")
                    except Exception as e:
                        print(f"[!] Erro ao ler JSON: {e}")

                # Se não houver JSON ou falhar, usa padrão
                if not botoos_iniciais:
                    botoos_iniciais = [f"Botão {i+1}" for i in range(8)]
                    print("[*] Usando botões padrão.")

                # Salva no banco
                for nome in botoos_iniciais:
                    db.session.add(Button(name=nome))
                
                try:
                    db.session.commit()
                    print("[+] Banco de dados populado com sucesso.")
                except Exception as e:
                    db.session.rollback()
                    print(f"[!!!] Erro ao salvar dados iniciais: {e}")
    except Exception as e:
        print(f"[!!!] ERRO CRÍTICO na inicialização do banco: {e}")

# Inicializa o banco de dados assim que o módulo é carregado.
initialize_database()

def carregar_botoes():
    return db.session.scalars(db.select(Button).order_by(Button.id)).all()

def salvar_botoes(lista):
    try:
        db.session.execute(db.delete(Button))
        for name in lista:
            db.session.add(Button(name=name))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar: {e}")

@app.route("/")
def index():
    if not session.get("usuario_logado"):
        return redirect(url_for("login_usuario"))
    botoes = carregar_botoes()
    # Extrai apenas os nomes para o template
    return render_template("index.html", botoes=[b.name for b in botoes])

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
    
    botoes = [b.name for b in carregar_botoes()]
    
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


if __name__ == "__main__":
    # A função initialize_database() já é chamada globalmente para garantir que o DB seja configurado no Render.
    # Apenas abre o navegador se estiver rodando localmente (não no Render)
    if not os.environ.get('RENDER'):
        def abrir_navegador():
            webbrowser.open_new("http://127.0.0.1:5000")
        Timer(1, abrir_navegador).start()

    app.run(host="0.0.0.0", port=5000)
