# Sorteio-Malha-fina
Aplicação visual de sorteio aleatório ("Malha Fina" vs "Liberado") desenvolvida com Python e Flask. Possui interface animada, feedback sonoro e painel administrativo para personalização de botões. Funciona como Desktop ou Web App.<img width="1916" height="926" alt="image" src="https://github.com/user-attachments/assets/3d773749-fe21-4693-93c8-8a63e498803d" />

# 🎲 Sorteio Visual - Malha Fina

Uma aplicação interativa desenvolvida em **Python (Flask)** para realizar sorteios aleatórios visuais. O sistema simula uma dinâmica de "Malha Fina", indicando se o usuário foi **"Liberado"** (Verde) ou se deve **"Seguir para Malha"** (Vermelho).

Ideal para controle de fluxo, auditorias aleatórias, brincadeiras ou dinâmicas de grupo.

## 🚀 Funcionalidades

*   **Roleta 3D Interativa:** Nova animação tridimensional que gira e para na cor sorteada, criando suspense antes do resultado.
*   **Sorteio Aleatório:** Algoritmo que define aleatoriamente o resultado com feedback visual imediato.
*   **Interface Animada:** Uso de animações CSS e GIFs para tornar a experiência visualmente agradável.
*   **Feedback Sonoro:** Utiliza a API de síntese de voz do navegador para falar o resultado e o nome do botão clicado.
*   **Painel Administrativo:** Área restrita (login) para adicionar, editar ou remover os botões de sorteio.
*   **Persistência de Dados:** As configurações dos botões são salvas automaticamente em um arquivo JSON.
*   **Híbrido:** Pode rodar como um site na web ou como um aplicativo Desktop (executável Windows).

## 🛠️ Tecnologias Utilizadas

*   **Backend:** Python 3, Flask
*   **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
*   **Deploy/Build:** Gunicorn (Web), PyInstaller (Desktop)

## 📸 Screenshots

*<img width="1239" height="790" alt="image" src="https://github.com/user-attachments/assets/27b75ea7-dabf-476e-8cb5-07e28da0f7dc" />
*<img width="1206" height="809" alt="image" src="https://github.com/user-attachments/assets/b386df4b-efbf-4aa8-9b62-82a0c54d022b" />


## ⚙️ Como Rodar Localmente

1.  **Clone o repositório:**
    ```bash
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


python -m PyInstaller --noconsole --onefile --icon=icon.ico --hidden-import=flask --add-data "templates;templates" --add-data "static;static" app.py

