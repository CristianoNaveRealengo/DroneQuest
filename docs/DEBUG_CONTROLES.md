# Debug de Controles - Guia de Teste

## 🐛 Problema Reportado

-   Cockpit preso, não responde a setas nem WASD
-   Drone não sobe com W/S
-   Não gira no próprio eixo com A/D
-   Mesmo problema em ambos os modos

---

## 🔧 Correções Aplicadas

### 1. **Logs de Debug Adicionados**

```javascript
// Log quando tecla é pressionada
window.addEventListener("keydown", (e) => {
	this.keys[e.code] = true;
	console.log(`🎮 Tecla pressionada: ${e.code}`);
});

// Log ocasional das teclas ativas
if (anyKeyPressed && Math.random() < 0.01) {
	console.log(
		"🎮 Teclas ativas:",
		Object.keys(this.keys).filter((k) => this.keys[k])
	);
}
```

### 2. **Suporte para IJKL Adicionado**

Agora aceita tanto setas quanto IJKL:

```javascript
// Frente: ↑ ou I
if (this.keys["ArrowUp"] || this.keys["KeyI"]) { ... }

// Trás: ↓ ou K
if (this.keys["ArrowDown"] || this.keys["KeyK"]) { ... }

// Esquerda: ← ou J
if (this.keys["ArrowLeft"] || this.keys["KeyJ"]) { ... }

// Direita: → ou L
if (this.keys["ArrowRight"] || this.keys["KeyL"]) { ... }
```

---

## 🧪 Como Testar

### Passo 1: Abrir Console do Navegador

1. Pressione `F12` no navegador
2. Vá para a aba "Console"
3. Deixe aberto durante os testes

### Passo 2: Iniciar o Jogo

1. Escolha "COCKPIT VR" ou "DRONE SIMPLES"
2. Clique em "INICIAR EXPERIÊNCIA"

### Passo 3: Testar Teclas

Pressione cada tecla e verifique os logs:

#### Teste de Detecção:

```
Pressione: ↑
Esperado no console: 🎮 Tecla pressionada: ArrowUp

Pressione: W
Esperado no console: 🎮 Tecla pressionada: KeyW

Pressione: A
Esperado no console: 🎮 Tecla pressionada: KeyA
```

#### Teste de Movimento:

```
Pressione: ↑ (ou I)
Esperado: Drone move para frente

Pressione: W
Esperado: Drone sobe

Pressione: A
Esperado: Drone gira para esquerda
```

---

## 🔍 Diagnóstico de Problemas

### Problema 1: Nenhum log aparece ao pressionar teclas

**Causa Provável**: Foco não está na janela do jogo

**Solução**:

1. Clique na tela do jogo
2. Tente pressionar as teclas novamente
3. Verifique se o console mostra os logs

---

### Problema 2: Logs aparecem mas drone não se move

**Causa Provável**: `drone-controller` não está ativo

**Solução**:

1. Verifique no console se aparece: `🚁 Controlador simplificado do drone iniciado`
2. Verifique se aparece: `✅ Drone ativado`
3. Se não aparecer, o componente não foi carregado

**Verificação**:

```javascript
// No console do navegador, digite:
document.querySelector("#drone").components["drone-controller"];

// Deve retornar um objeto, não undefined
```

---

### Problema 3: Drone se move mas muito devagar

**Causa Provável**: Velocidade muito baixa

**Solução**: Aumentar velocidade no HTML

```html
<a-entity
	id="drone"
	drone-controller="moveSpeed: 5.0; rotationSpeed: 1.5"
></a-entity>
```

---

### Problema 4: Drone gira mas não se move

**Causa Provável**: Apenas rotação funcionando

**Verificação**:

1. Pressione ↑ e observe o console
2. Deve aparecer: `🎮 Teclas ativas: ["ArrowUp"]`
3. Se aparecer mas não mover, há problema no cálculo de movimento

---

## 📊 Tabela de Controles

| Tecla | Código     | Função         | Status |
| ----- | ---------- | -------------- | ------ |
| ↑     | ArrowUp    | Frente         | ✅     |
| ↓     | ArrowDown  | Trás           | ✅     |
| ←     | ArrowLeft  | Esquerda       | ✅     |
| →     | ArrowRight | Direita        | ✅     |
| W     | KeyW       | Subir          | ✅     |
| S     | KeyS       | Descer         | ✅     |
| A     | KeyA       | Girar Esquerda | ✅     |
| D     | KeyD       | Girar Direita  | ✅     |
| I     | KeyI       | Frente (alt)   | ✅     |
| K     | KeyK       | Trás (alt)     | ✅     |
| J     | KeyJ       | Esquerda (alt) | ✅     |
| L     | KeyL       | Direita (alt)  | ✅     |
| R     | KeyR       | Reset          | ✅     |

---

## 🎮 Teste Completo

### Teste 1: Movimento Básico

```
1. Pressione ↑ por 2 segundos
   ✅ Drone deve mover para frente
   ✅ Console: "🎮 Tecla pressionada: ArrowUp"

2. Pressione ↓ por 2 segundos
   ✅ Drone deve mover para trás
   ✅ Console: "🎮 Tecla pressionada: ArrowDown"

3. Pressione ← por 2 segundos
   ✅ Drone deve mover para esquerda
   ✅ Console: "🎮 Tecla pressionada: ArrowLeft"

4. Pressione → por 2 segundos
   ✅ Drone deve mover para direita
   ✅ Console: "🎮 Tecla pressionada: ArrowRight"
```

### Teste 2: Subir/Descer

```
1. Pressione W por 2 segundos
   ✅ Drone deve subir
   ✅ Console: "🎮 Tecla pressionada: KeyW"
   ✅ Posição Y deve aumentar

2. Pressione S por 2 segundos
   ✅ Drone deve descer
   ✅ Console: "🎮 Tecla pressionada: KeyS"
   ✅ Posição Y deve diminuir
```

### Teste 3: Rotação

```
1. Pressione A por 2 segundos
   ✅ Drone deve girar para esquerda
   ✅ Console: "🎮 Tecla pressionada: KeyA"
   ✅ Rotação Y deve aumentar

2. Pressione D por 2 segundos
   ✅ Drone deve girar para direita
   ✅ Console: "🎮 Tecla pressionada: KeyD"
   ✅ Rotação Y deve diminuir
```

### Teste 4: Teclas Alternativas (IJKL)

```
1. Pressione I
   ✅ Mesmo efeito que ↑

2. Pressione K
   ✅ Mesmo efeito que ↓

3. Pressione J
   ✅ Mesmo efeito que ←

4. Pressione L
   ✅ Mesmo efeito que →
```

### Teste 5: Reset

```
1. Mova o drone para longe
2. Pressione R
   ✅ Drone deve voltar para (0, 3, 0)
   ✅ Console: "🔄 Posição resetada"
```

---

## 🔧 Comandos de Debug no Console

### Ver posição atual:

```javascript
document.querySelector("#drone").getAttribute("position");
```

### Ver rotação atual:

```javascript
document.querySelector("#drone").getAttribute("rotation");
```

### Ver velocidade atual:

```javascript
document.querySelector("#drone").components["drone-controller"].velocity;
```

### Ver teclas pressionadas:

```javascript
document.querySelector("#drone").components["drone-controller"].keys;
```

### Forçar movimento (teste):

```javascript
const drone = document.querySelector("#drone");
const pos = drone.getAttribute("position");
pos.z -= 1; // Move 1m para frente
drone.setAttribute("position", pos);
```

---

## 📝 Checklist de Verificação

Antes de reportar problema, verifique:

-   [ ] Console aberto (F12)
-   [ ] Foco na janela do jogo (clicou na tela)
-   [ ] Experiência iniciada (não está no menu)
-   [ ] Logs aparecem ao pressionar teclas
-   [ ] `drone-controller` está carregado
-   [ ] Nenhum erro no console
-   [ ] Timer de 3 minutos está rodando
-   [ ] Hover animation está ativa

---

## 🚨 Erros Comuns

### Erro: "Cannot read property 'getAttribute' of null"

**Causa**: Elemento #drone não existe  
**Solução**: Verificar se HTML está correto

### Erro: "this.keys is undefined"

**Causa**: `setupKeyboardControls` não foi chamado  
**Solução**: Verificar se `init()` está sendo executado

### Erro: "THREE is not defined"

**Causa**: A-Frame não carregou  
**Solução**: Verificar se `aframe.min.js` está carregado

---

## 📞 Informações para Suporte

Se o problema persistir, forneça:

1. **Logs do Console** (copie tudo)
2. **Navegador e Versão** (Chrome 120, Firefox 121, etc)
3. **Sistema Operacional** (Windows 11, macOS, etc)
4. **Modo Testado** (Cockpit VR ou Drone Simples)
5. **Teclas Testadas** (quais funcionam, quais não)

---

**Versão**: 2.5.0  
**Data**: 14/10/2025  
**Status**: 🔧 Debug Ativo

🎮 **Teste e reporte os resultados!** 🐛
