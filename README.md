# Sorteio-Malha-fina
Aplicação visual de sorteio ("Malha Fina" vs "Liberado") desenvolvida com Python e Flask. Possui interface animada, temas visuais, efeitos sonoros e painel administrativo. Funciona como Desktop ou Web App.<img width="1732" height="899" alt="image" src="https://github.com/user-attachments/assets/5c0378df-29ea-4b23-90f0-88fc093c7192" />

# 🎲 Sorteio Visual - Malha Fina

Uma aplicação interativa desenvolvida em **Python (Flask)** para realizar sorteios aleatórios visuais. O sistema simula uma dinâmica de "Malha Fina", indicando se o usuário foi **"Liberado"** (Verde) ou se deve **"Seguir para Malha"** (Vermelho).

Ideal para controle de fluxo, auditorias aleatórias, dinâmicas de grupo ou qualquer cenário que precise de um sorteio visual e divertido.

## 🚀 Funcionalidades

*   **Roleta com Ponteiro Giratório:** Animação de um ponteiro que gira sobre uma roleta estática, criando suspense.
*   **Temas Visuais:** Alterne com um clique entre o tema **Futurista** (neon, escuro) e o tema **Clássico** (padrão). A escolha é salva no navegador.
*   **Feedback Sonoro Avançado:**
    *   Efeitos de "tick" que desaceleram junto com o ponteiro.
    *   Síntese de voz (Web Speech API) que anuncia o resultado sorteado.
*   **Painel Administrativo:** Área restrita (login) para adicionar, editar ou remover os botões de sorteio.
*   **Persistência de Dados:** As configurações dos botões são salvas automaticamente em um arquivo JSON.
*   **Sorteio Direcionado (Easter Egg):** Clique na metade esquerda da tela para forçar o próximo resultado como "Liberado" ou na metade direita para "Malha Fina".
*   **Híbrido:** Pode rodar como um site na web ou como um aplicativo Desktop (executável Windows).

## 🛠️ Tecnologias Utilizadas

*   **Backend:** Python 3, Flask
*   **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
*   **Deploy/Build:** Gunicorn (Web), PyInstaller (Desktop)
*   **Áudio:** Web Audio API (para efeitos sonoros), Web Speech API (para síntese de voz)

## 📸 Screenshots

*(Adicione aqui prints da tela inicial e do painel de admin)*

## ⚙️ Como Rodar Localmente

1.  **Clone o repositório:**
    ```sh
    git clone https://github.com/SEU-USUARIO/NOME-DO-REPO.git
    cd NOME-DO-REPO
    ```

2.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Execute a aplicação:**
    ```bash
    python app.py
    ```
    O sistema estará acessível em `http://localhost:5000`.

## 🖥️ Como Gerar Executável (Windows)

Para criar um arquivo `.exe` standalone que não precisa de Python instalado na máquina cliente:
```bash
pip install pyinstaller
pyinstaller --noconsole --onefile --icon=static/img/icon.ico --add-data "templates;templates" --add-data "static;static" app.py
