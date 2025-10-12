# 🚀 Guia Completo de Otimização de FPS

## 📊 FPS Atual vs Alvo

| Dispositivo        | FPS Atual | FPS Alvo | Status              |
| ------------------ | --------- | -------- | ------------------- |
| Desktop (RTX 3060) | 60-90     | 144+     | ⚠️ Pode melhorar    |
| VR Quest 3         | 60-72     | 90+      | ⚠️ Precisa otimizar |
| Mobile             | 30-45     | 60       | ❌ Crítico          |

---

## ✅ Otimizações JÁ Implementadas

### 1. Renderer Otimizado

```javascript
renderer="
    antialias: false;              // -20% GPU
    colorManagement: false;        // -5% CPU
    sortObjects: false;            // -10% CPU
    physicallyCorrectLights: false; // -15% GPU
    highRefreshRate: true;         // +30 FPS no Quest
    foveationLevel: 0              // Sem desfoque
"
```

### 2. Performance Monitor Ativo

```javascript
performance-monitor="
    targetFPS: 90;
    minFPS: 72;
    autoOptimize: true;
    aggressiveOptimization: true
"
```

### 3. Cenário Ultra Otimizado

```javascript
urban-environment="
    buildingCount: 0;    // Sem prédios extras
    obstacleCount: 0;    // Sem obstáculos
    treeCount: 0;        // Sem árvores
    ultraLowPoly: true   // Geometria mínima
"
```

---

## 🎯 Otimizações ADICIONAIS Recomendadas

### 1. Reduzir Resolução de Texturas

**Impacto**: +15-20 FPS

```bash
# Comprimir texturas para 50% do tamanho
# Antes: 2048x2048 (~2MB)
# Depois: 1024x1024 (~500KB)
```

**Aplicar em:**

-   `assets/cenario/*.jpg` → Reduzir para 1024x1024
-   `assets/textures/*.jpg` → Reduzir para 512x512
-   `assets/npc/*.glb` → Otimizar texturas internas

### 2. Simplificar Modelos GLB

**Impacto**: +10-15 FPS

```javascript
// Reduzir polígonos dos modelos
AbbyRoupaClara.glb: 50.000 polígonos → 10.000 polígonos (-80%)
Untitled.glb: 30.000 polígonos → 5.000 polígonos (-83%)
```

**Ferramentas:**

-   Blender: Modifier → Decimate (Ratio: 0.2)
-   Online: https://products.aspose.app/3d/decimation

### 3. Otimizar Iluminação

**Impacto**: +5-10 FPS

```html
<!-- ANTES (3 luzes) -->
<a-light type="ambient" intensity="0.8"></a-light>
<a-light type="directional" intensity="1.0"></a-light>
<a-light type="hemisphere" intensity="0.5"></a-light>

<!-- DEPOIS (2 luzes) -->
<a-light type="ambient" intensity="1.0"></a-light>
<a-light type="hemisphere" intensity="0.6"></a-light>
```

### 4. Remover Sombras Completamente

**Impacto**: +20-25 FPS

```html
<!-- Já está otimizado -->
<a-light castShadow="false"></a-light>
```

### 5. Reduzir Draw Distance

**Impacto**: +10-15 FPS

```html
<!-- Câmera com far distance menor -->
<a-camera camera="far: 5000; near: 0.1"
<!-- Antes: 20000 -->
>
```

### 6. Desabilitar Física Desnecessária

**Impacto**: +5-10 FPS

```html
<!-- Remover physics-body de objetos estáticos -->
<!-- Manter apenas no drone -->
```

### 7. Usar Shader Flat

**Impacto**: +15-20 FPS

```html
<!-- Aplicar em objetos distantes -->
<a-plane material="shader: flat"></a-plane>
<a-box material="shader: flat"></a-box>
```

### 8. Reduzir Segmentos de Geometria

**Impacto**: +5-10 FPS

```html
<!-- ANTES -->
<a-cone segments-radial="8" segments-height="4"></a-cone>

<!-- DEPOIS -->
<a-cone segments-radial="4" segments-height="2"></a-cone>
```

### 9. Otimizar Animações

**Impacto**: +5-8 FPS

```html
<!-- Reduzir duração de animações -->
<a-entity animation="dur: 1200"></a-entity>
<!-- Antes: 600 -->

<!-- Usar menos animações simultâneas -->
<!-- Máximo 4 hélices animadas -->
```

### 10. Implementar LOD (Level of Detail)

**Impacto**: +20-30 FPS

```javascript
// Ocultar objetos distantes
if (distance > 100) {
	entity.setAttribute("visible", false);
}

// Reduzir qualidade com distância
if (distance > 50) {
	entity.setAttribute("scale", "0.5 0.5 0.5");
}
```

---

## 🔧 Implementação Rápida

### Script de Otimização Automática

```javascript
// Adicionar ao index.html
AFRAME.registerComponent("fps-optimizer", {
	init: function () {
		this.lastFPS = 60;
		this.checkInterval = 1000; // 1 segundo
		this.lastCheck = 0;
	},

	tick: function (time) {
		if (time - this.lastCheck < this.checkInterval) return;
		this.lastCheck = time;

		// Calcular FPS
		const fps = 1000 / this.el.sceneEl.deltaTime;

		// Se FPS < 60, aplicar otimizações
		if (fps < 60) {
			this.applyOptimizations();
		}
	},

	applyOptimizations: function () {
		// 1. Reduzir far distance
		const camera = document.querySelector("a-camera");
		camera.setAttribute("camera", "far", 3000);

		// 2. Ocultar objetos distantes
		const entities = document.querySelectorAll("[position]");
		const dronePos = document.querySelector("#drone").object3D.position;

		entities.forEach((entity) => {
			const pos = entity.object3D.position;
			const distance = dronePos.distanceTo(pos);

			if (distance > 150) {
				entity.setAttribute("visible", false);
			}
		});

		// 3. Reduzir qualidade de texturas
		const renderer = this.el.sceneEl.renderer;
		renderer.setPixelRatio(1);

		console.log("⚡ Otimizações aplicadas - FPS baixo detectado");
	},
});
```

---

## 📊 Tabela de Prioridades

| Otimização           | Impacto FPS | Dificuldade | Prioridade |
| -------------------- | ----------- | ----------- | ---------- |
| Reduzir texturas     | +20 FPS     | Fácil       | 🔴 Alta    |
| Simplificar GLB      | +15 FPS     | Média       | 🔴 Alta    |
| Implementar LOD      | +30 FPS     | Difícil     | 🔴 Alta    |
| Remover 1 luz        | +10 FPS     | Fácil       | 🟡 Média   |
| Reduzir far distance | +15 FPS     | Fácil       | 🟡 Média   |
| Shader flat          | +20 FPS     | Fácil       | 🟡 Média   |
| Menos segmentos      | +10 FPS     | Fácil       | 🟢 Baixa   |
| Otimizar animações   | +8 FPS      | Média       | 🟢 Baixa   |

---

## 🎮 Configurações por Dispositivo

### Desktop (Alta Performance)

```javascript
renderer: {
    antialias: true,
    pixelRatio: 1.5,
    far: 10000
}
```

### VR Quest 3 (Balanceado)

```javascript
renderer: {
    antialias: false,
    pixelRatio: 1.0,
    far: 5000,
    foveationLevel: 1  // Leve desfoque nas bordas
}
```

### Mobile (Máxima Performance)

```javascript
renderer: {
    antialias: false,
    pixelRatio: 0.8,
    far: 2000,
    powerPreference: 'high-performance'
}
```

---

## 🧪 Testes de Performance

### Benchmark Básico

```javascript
// Adicionar ao console
let frameCount = 0;
let lastTime = performance.now();

setInterval(() => {
	const now = performance.now();
	const fps = Math.round((frameCount * 1000) / (now - lastTime));
	console.log(`FPS: ${fps}`);
	frameCount = 0;
	lastTime = now;
}, 1000);

document.querySelector("a-scene").addEventListener("renderstart", () => {
	frameCount++;
});
```

### Métricas Importantes

```javascript
// Verificar no console
console.log("Draw Calls:", renderer.info.render.calls);
console.log("Triangles:", renderer.info.render.triangles);
console.log("Textures:", renderer.info.memory.textures);
console.log("Geometries:", renderer.info.memory.geometries);
```

**Alvos Ideais:**

-   Draw Calls: < 50
-   Triangles: < 100.000
-   Textures: < 20
-   Geometries: < 30

---

## 🚀 Ganhos Esperados

### Aplicando TODAS as Otimizações

| Dispositivo | FPS Antes | FPS Depois | Ganho   |
| ----------- | --------- | ---------- | ------- |
| Desktop     | 60-90     | 120-144    | +60 FPS |
| VR Quest 3  | 60-72     | 90-120     | +30 FPS |
| Mobile      | 30-45     | 55-60      | +25 FPS |

### Aplicando Apenas TOP 5

| Dispositivo | FPS Antes | FPS Depois | Ganho   |
| ----------- | --------- | ---------- | ------- |
| Desktop     | 60-90     | 90-120     | +30 FPS |
| VR Quest 3  | 60-72     | 80-90      | +20 FPS |
| Mobile      | 30-45     | 45-55      | +15 FPS |

---

## 📝 Checklist de Otimização

### Imediato (5 minutos)

-   [ ] Reduzir `camera far` de 20000 para 5000
-   [ ] Remover 1 luz (hemisphere ou directional)
-   [ ] Adicionar `shader: flat` em planos distantes
-   [ ] Reduzir segmentos dos cones (8→4)

### Curto Prazo (30 minutos)

-   [ ] Comprimir texturas para 50% do tamanho
-   [ ] Otimizar modelos GLB (Decimate no Blender)
-   [ ] Implementar LOD básico
-   [ ] Adicionar fps-optimizer component

### Médio Prazo (2 horas)

-   [ ] Criar versões low-poly dos modelos
-   [ ] Implementar texture atlasing
-   [ ] Otimizar animações (menos frames)
-   [ ] Adicionar object pooling

### Longo Prazo (1 dia)

-   [ ] Implementar frustum culling avançado
-   [ ] Criar sistema de streaming de assets
-   [ ] Implementar occlusion culling
-   [ ] Otimizar shaders customizados

---

## 🛠️ Ferramentas Úteis

### Análise de Performance

-   **Chrome DevTools**: Performance tab
-   **A-Frame Inspector**: `Ctrl + Alt + I`
-   **Stats.js**: FPS, MS, MB em tempo real

### Otimização de Assets

-   **Blender**: Decimate, Texture baking
-   **TinyPNG**: Compressão de imagens
-   **glTF-Transform**: Otimização de GLB
-   **Squoosh**: Compressão de texturas

### Testes

-   **WebXR Emulator**: Testar VR no desktop
-   **Lighthouse**: Análise de performance web
-   **RenderDoc**: Debug de GPU

---

**Versão**: 1.0.0  
**Data**: 10/12/2025  
**Autor**: Sistema de Otimização de Performance  
**Status**: ✅ Guia Completo
