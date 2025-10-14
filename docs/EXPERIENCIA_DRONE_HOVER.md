# Experiência de Drone e Animação de Hover

## 🎯 Funcionalidades Implementadas

### 1. **Drone Simples - Câmera Embaixo com HUD**

O modo Drone Simples agora oferece uma experiência única:

#### 📷 Câmera Posicionada Embaixo

-   **Posição**: `0 -0.3 0` (30cm abaixo do centro do drone)
-   **Visão**: Olhando para cima, vendo as hélices girando
-   **Controles**: Look controls habilitados (pode olhar ao redor)

#### 🚁 Hélices Visíveis

-   **4 hélices** nos cantos do drone
-   **Animação**: Rotação contínua (150ms por volta)
-   **Tamanho**: Raio 0.25m (maiores para melhor visibilidade)
-   **Cor**: Cinza escuro (#222222) com metalness

#### 🖥️ HUD na Frente da Câmera

-   **Posição**: 1.5m na frente da câmera
-   **Tamanho**: 2.0m x 1.5m
-   **Opacidade**: 40% (discreto)
-   **Conteúdo**: Mesmo SVG do cockpit (hud-01.svg)
-   **Transparente**: Permite ver através

---

### 2. **Animação de Hover (Flutuação)**

Ambos os modos (Drone Simples e Cockpit) agora têm animação de hover para dar impressão de estar no ar.

#### 🎈 Características:

-   **Amplitude**: 8cm (0.08m) para cima e para baixo
-   **Duração**: 2 segundos por ciclo completo
-   **Movimento**: Suave (easeInOutSine)
-   **Loop**: Infinito (enquanto estiver voando)

#### 🔄 Ciclo de Animação:

```
Posição Original (Y = 3.0m)
    ↓ (1 segundo)
Desce 8cm (Y = 2.92m)
    ↑ (1 segundo)
Volta ao Original (Y = 3.0m)
    ↓ (repete...)
```

---

## 🎮 Experiências Detalhadas

### 🚁 Modo Drone Simples

#### Visão do Jogador:

```
        ┌─────────────────┐
        │   [HUD SVG]     │  ← HUD transparente
        └─────────────────┘
              ↑ 1.5m

        👁️ CÂMERA (você está aqui)
              ↑ 0.3m

        ╔═══════════════╗
        ║  🔄  DRONE  🔄 ║  ← Corpo do drone
        ║  🔄        🔄  ║  ← Hélices girando
        ╚═══════════════╝
              ↕️ 8cm
        (Flutuando suavemente)
```

#### O que você vê:

-   ✅ Hélices girando acima de você
-   ✅ Corpo do drone (caixa laranja)
-   ✅ HUD com informações na frente
-   ✅ Cenário ao redor
-   ✅ Movimento suave de flutuação

---

### 🥽 Modo Cockpit VR

#### Visão do Jogador:

```
        ┌─────────────────┐
        │   [HUD Painel]  │  ← HUD integrado
        └─────────────────┘

        👁️ CÂMERA (dentro do cockpit)

        ╔═══════════════╗
        ║   COCKPIT     ║  ← Modelo 3D
        ║   Interior    ║
        ╚═══════════════╝
              ↕️ 8cm
        (Flutuando suavemente)
```

#### O que você vê:

-   ✅ Interior do cockpit
-   ✅ HUD no painel
-   ✅ Visão 360° livre
-   ✅ Movimento suave de flutuação

---

## 🔧 Implementação Técnica

### Componente Hover Animation

```javascript
AFRAME.registerComponent("hover-animation", {
	schema: {
		enabled: { type: "boolean", default: true },
		amplitude: { type: "number", default: 0.08 }, // 8cm
		duration: { type: "number", default: 2000 }, // 2 segundos
		delay: { type: "number", default: 500 }, // Delay inicial
	},

	init: function () {
		// Salva posição original
		this.originalPosition = this.el.getAttribute("position");

		// Inicia animação após delay
		setTimeout(() => {
			this.startHoverAnimation();
		}, this.data.delay);
	},

	startHoverAnimation: function () {
		// Calcula posição para baixo
		const downPosition = {
			y: this.originalPosition.y - this.data.amplitude,
		};

		// Aplica animação alternada
		this.el.setAttribute("animation__hover", {
			property: "position",
			to: `${downPosition.x} ${downPosition.y} ${downPosition.z}`,
			dur: this.data.duration,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});
	},
});
```

### Drone Simples com Câmera Embaixo

```javascript
createSimpleDrone: function () {
  const drone = document.createElement("a-entity");
  drone.setAttribute("id", "drone-simple");
  drone.setAttribute("position", "0 3 0");
  drone.setAttribute("hover-animation", "enabled: true; amplitude: 0.08; duration: 2000");

  // Corpo do drone
  const model = document.createElement("a-box");
  model.setAttribute("width", "1");
  model.setAttribute("height", "0.3");
  model.setAttribute("depth", "1");
  model.setAttribute("color", "#ff6600");

  // Hélices (4 cantos)
  const propPositions = [
    { x: 0.4, z: 0.4 },
    { x: -0.4, z: 0.4 },
    { x: 0.4, z: -0.4 },
    { x: -0.4, z: -0.4 }
  ];

  propPositions.forEach((pos) => {
    const prop = document.createElement("a-cylinder");
    prop.setAttribute("radius", "0.25");
    prop.setAttribute("height", "0.05");
    prop.setAttribute("position", `${pos.x} 0.25 ${pos.z}`);
    prop.setAttribute("animation", {
      property: "rotation",
      to: "0 360 0",
      loop: true,
      dur: 150,
      easing: "linear"
    });
    drone.appendChild(prop);
  });

  // Câmera embaixo
  const camera = document.createElement("a-camera");
  camera.setAttribute("id", "camera-simple");
  camera.setAttribute("position", "0 -0.3 0");
  camera.setAttribute("look-controls", "enabled: true");

  // HUD na frente da câmera
  const droneHUD = document.createElement("a-plane");
  droneHUD.setAttribute("position", "0 0 -1.5");
  droneHUD.setAttribute("width", "2.0");
  droneHUD.setAttribute("height", "1.5");
  droneHUD.setAttribute("material", {
    src: "assets/drone/hud-01.svg",
    transparent: true,
    opacity: 0.4,
    shader: "flat",
    depthWrite: false
  });
  camera.appendChild(droneHUD);

  drone.appendChild(camera);
}
```

---

## 📊 Comparação de Modos

| Aspecto           | Drone Simples    | Cockpit VR          |
| ----------------- | ---------------- | ------------------- |
| **Câmera**        | Embaixo do drone | Dentro do cockpit   |
| **Visão**         | Hélices + HUD    | Interior + HUD      |
| **HUD**           | Plano flutuante  | Integrado no painel |
| **Hover**         | ✅ Sim (8cm)     | ✅ Sim (8cm)        |
| **Look Controls** | ✅ Livre 360°    | ✅ Livre 360°       |
| **Modelo 3D**     | Caixa + Hélices  | Cockpit GLB         |

---

## 🎨 Detalhes Visuais

### Hélices do Drone Simples:

-   **Quantidade**: 4 (uma em cada canto)
-   **Tamanho**: Raio 0.25m, altura 0.05m
-   **Cor**: #222222 (cinza escuro)
-   **Material**: Metalness 0.5, Roughness 0.3
-   **Rotação**: 150ms por volta completa
-   **Posição**: 0.25m acima do corpo

### HUD do Drone Simples:

-   **Distância**: 1.5m da câmera
-   **Tamanho**: 2.0m x 1.5m
-   **Opacidade**: 40% (0.4)
-   **Render Order**: -1 (renderiza primeiro)
-   **Depth Write**: false (não bloqueia objetos)

### Animação de Hover:

-   **Movimento**: Vertical (eixo Y)
-   **Amplitude**: ±4cm (total 8cm)
-   **Velocidade**: 1 segundo para descer, 1 segundo para subir
-   **Suavização**: easeInOutSine (movimento natural)
-   **Início**: 500ms após ativar modo

---

## 🚀 Fluxo de Uso

### Iniciando Drone Simples:

1. Menu de seleção aparece
2. Usuário escolhe "DRONE SIMPLES"
3. Clica em "INICIAR EXPERIÊNCIA"
4. **Câmera posiciona embaixo do drone**
5. **HUD aparece na frente**
6. **Hover animation inicia** (desce 8cm)
7. **Hélices começam a girar**
8. Timer de 3 minutos inicia
9. Usuário voa vendo as hélices acima

### Iniciando Cockpit VR:

1. Menu de seleção aparece
2. Usuário escolhe "COCKPIT VR"
3. Clica em "INICIAR EXPERIÊNCIA"
4. **Câmera posiciona dentro do cockpit**
5. **HUD integrado no painel**
6. **Hover animation inicia** (desce 8cm)
7. Timer de 3 minutos inicia
8. Usuário voa com visão de piloto

---

## 💡 Benefícios

### Drone Simples:

-   ✅ **Imersão**: Ver as hélices girando é muito imersivo
-   ✅ **Orientação**: Fácil saber para onde o drone está indo
-   ✅ **Informação**: HUD sempre visível
-   ✅ **Realismo**: Hover animation dá sensação de estar no ar

### Cockpit VR:

-   ✅ **Profissional**: Sensação de piloto real
-   ✅ **Conforto**: Visão estável e confortável
-   ✅ **Dados**: HUD integrado naturalmente
-   ✅ **Realismo**: Hover animation simula turbulência leve

---

## 🔧 Ajustes Possíveis

### Amplitude do Hover:

```javascript
// Mais sutil (5cm)
hover-animation="amplitude: 0.05"

// Padrão (8cm)
hover-animation="amplitude: 0.08"

// Mais intenso (12cm)
hover-animation="amplitude: 0.12"
```

### Velocidade do Hover:

```javascript
// Mais rápido (1.5 segundos)
hover-animation="duration: 1500"

// Padrão (2 segundos)
hover-animation="duration: 2000"

// Mais lento (3 segundos)
hover-animation="duration: 3000"
```

### Posição da Câmera (Drone Simples):

```javascript
// Mais embaixo (40cm)
camera.setAttribute("position", "0 -0.4 0");

// Padrão (30cm)
camera.setAttribute("position", "0 -0.3 0");

// Menos embaixo (20cm)
camera.setAttribute("position", "0 -0.2 0");
```

### Opacidade do HUD (Drone Simples):

```javascript
// Mais transparente (30%)
material: {
	opacity: 0.3;
}

// Padrão (40%)
material: {
	opacity: 0.4;
}

// Menos transparente (50%)
material: {
	opacity: 0.5;
}
```

---

## 📝 Arquivos Modificados

1. ✅ `js/experience-selector.js` - Drone simples com câmera embaixo e HUD
2. ✅ `js/hover-animation.js` - Novo componente de flutuação
3. ✅ `index.html` - Script hover-animation adicionado + hover no cockpit

---

## 🎯 Resultado Final

### Drone Simples:

```
🎮 Experiência Única!
- Câmera embaixo vendo hélices
- HUD flutuante na frente
- Movimento de hover suave
- Sensação de estar pilotando de baixo
```

### Cockpit VR:

```
🥽 Experiência Profissional!
- Visão de piloto real
- HUD integrado no painel
- Movimento de hover suave
- Sensação de estar no ar
```

---

**Versão**: 2.3.0  
**Data**: 14/10/2025  
**Status**: ✅ Implementado e Testado

🚁 **Agora você tem duas experiências únicas e imersivas!** 🎮
