# 🚁 Guia Rápido - Sistema de Experiência VR

## 🎮 Como Usar

### 1️⃣ Iniciar o Sistema

```bash
npm start
# ou
npm run dev
```

### 2️⃣ Abrir no Navegador

-   **Desktop**: `http://localhost:8080`
-   **Meta Quest**: Usar navegador VR e acessar IP local

### 3️⃣ Escolher Experiência

Ao carregar, você verá o menu com duas opções:

#### 🚁 DRONE SIMPLES

-   Visão externa (terceira pessoa)
-   Câmera segue o drone
-   Controle arcade
-   Ideal para iniciantes

#### 🥽 COCKPIT VR

-   Visão interna (primeira pessoa)
-   Dentro do cockpit
-   HUD com dados em tempo real
-   Compatível com VR

### 4️⃣ Voar por 3 Minutos

**Timer no centro da tela:**

-   🟢 Verde: Tempo normal (> 30s)
-   🟡 Laranja: Atenção (30s - 10s)
-   🔴 Vermelho: Crítico (< 10s)

**Controles Desktop:**

-   `↑/I` - Frente
-   `↓/K` - Trás
-   `←/J` - Esquerda
-   `→/L` - Direita
-   `W` - Subir
-   `S` - Descer
-   `A/D` - Girar
-   `R` - Reset posição

**Controles VR:**

-   🕹️ Stick Esquerdo - Movimento
-   🕹️ Stick Direito - Rotação
-   🔘 X - Subir
-   🔘 Y - Descer

### 5️⃣ Fim da Sessão

Quando o timer chegar a **00:00**:

1. Mensagem "TEMPO ESGOTADO!" aparece
2. Aguarda 3 segundos
3. Retorna automaticamente ao menu
4. Escolha nova experiência ou feche

---

## ⌨️ Atalhos de Teclado

| Tecla | Função                         |
| ----- | ------------------------------ |
| `E`   | Trocar experiência rapidamente |
| `M`   | Abrir menu de seleção          |
| `H`   | Alternar HUD (apenas Cockpit)  |
| `R`   | Reset posição do drone         |

---

## 🎯 Objetivos Durante o Voo

1. **Passar pelos Checkpoints** (argolas verdes)
2. **Explorar o cenário**
3. **Testar diferentes manobras**
4. **Aproveitar os 3 minutos!**

---

## 🐛 Problemas Comuns

### Timer não aparece

**Solução**: Aguarde 1 segundo após escolher experiência

### Câmera não troca

**Solução**: Verifique console (F12) para erros

### Controles não respondem

**Solução**: Clique na tela para dar foco ao navegador

### FPS baixo

**Solução**: Feche outras abas do navegador

---

## 📱 Uso em VR (Meta Quest)

### Conectar ao PC:

1. Ativar modo desenvolvedor no Quest
2. Conectar via USB ou Wi-Fi
3. Acessar `http://[IP-DO-PC]:8080` no navegador VR

### Dicas VR:

-   Use modo sentado para conforto
-   Ajuste IPD (distância entre lentes)
-   Calibre controles antes de iniciar
-   Faça pausas a cada 15-20 minutos

---

## 🎨 Personalização

### Alterar Duração do Voo:

Edite `js/experience-selector.js`:

```javascript
this.flightDuration = 180; // Altere para segundos desejados
// 120 = 2 minutos
// 180 = 3 minutos (padrão)
// 300 = 5 minutos
```

### Alterar Cores do Timer:

Edite `js/experience-selector.js`:

```javascript
// Verde (normal)
this.timerDisplay.style.color = "#00ff00";

// Laranja (aviso)
this.timerDisplay.style.color = "#ffaa00";

// Vermelho (crítico)
this.timerDisplay.style.color = "#ff0000";
```

---

## 📊 Arquivos Essenciais

```
drone-racing-vr/
├── index.html                    # Página principal
├── js/
│   ├── experience-selector.js    # Sistema de seleção e timer
│   ├── drone-controller.js       # Controles do drone
│   ├── vr-joystick-controls.js   # Controles VR
│   ├── cockpit-hud-data.js       # HUD do cockpit
│   ├── checkpoint-system.js      # Sistema de checkpoints
│   └── model-collision.js        # Sistema de colisão
├── assets/
│   ├── drone/                    # Modelos 3D
│   └── cenario/                  # Texturas e cenário
└── docs/                         # Documentação
```

---

## 🚀 Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm start

# Iniciar com live reload
npm run dev

# Build para produção
npm run build

# Deploy
npm run deploy
```

---

## 💡 Dicas Pro

1. **Modo Cockpit**: Olhe ao redor livremente (360°)
2. **Modo Drone**: Use mouse para controlar câmera
3. **Checkpoints**: Passe pelo centro das argolas
4. **Velocidade**: Controle suave = voo mais estável
5. **Colisões**: Evite bater na quadra (reduz velocidade)

---

## 📞 Suporte

**Problemas?** Verifique:

1. Console do navegador (F12)
2. Documentação completa em `docs/`
3. Logs no terminal do servidor

**Logs Importantes:**

-   `🎮 Seletor de Experiência iniciado` - Sistema OK
-   `📷 Ativando câmera...` - Troca de câmera
-   `⏱️ Iniciando timer...` - Timer iniciado
-   `⏰ Tempo de voo esgotado!` - Fim da sessão

---

**Versão**: 2.0.0  
**Última Atualização**: 14/10/2025  
**Status**: ✅ Pronto para Uso

🎮 **Bom voo!** 🚁
