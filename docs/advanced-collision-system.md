# Sistema de Colisão Avançado

## 📋 Visão Geral

Sistema completo de colisão com detecção otimizada por proximidade, feedback visual/sonoro/háptico e integração com HUD. Diferenciação automática entre modo VR e Desktop para melhor performance.

## 🎯 Funcionalidades

### Detecção de Colisão

-   ✅ Detecção por proximidade (raio configurável)
-   ✅ Verificação apenas de objetos próximos (otimizado)
-   ✅ Diferenciação VR vs Desktop
-   ✅ Sistema de cooldown para evitar spam
-   ✅ Zonas de perigo e aviso

### Feedback ao Jogador

-   ✅ Alertas no HUD futurístico
-   ✅ Efeitos visuais (flash vermelho, indicador de proximidade)
-   ✅ Sons de impacto (forte e suave)
-   ✅ Partículas de impacto (pool otimizado)
-   ✅ Feedback háptico em VR
-   ✅ Redução de velocidade ao colidir

### Performance

-   ✅ Pool de partículas reutilizáveis
-   ✅ Verificação apenas de objetos próximos
-   ✅ Intervalo de verificação ajustável
-   ✅ Limite de objetos verificados por frame
-   ✅ Otimizações específicas para VR

## 🔧 Componentes

### 1. Collision Manager (`collision-manager.js`)

Gerenciador central que coordena todas as colisões.

**Parâmetros:**

```javascript
{
    enabled: true,                  // Ativar/desativar sistema
    proximityRadius: 15,            // Raio de verificação (Desktop)
    checkInterval: 50,              // Intervalo de verificação em ms (Desktop)
    vrProximityRadius: 10,          // Raio de verificação (VR)
    vrCheckInterval: 100,           // Intervalo de verificação em ms (VR)
    maxCollisionObjects: 20,        // Máximo de objetos verificados por frame
    warningDistance: 3,             // Distância para aviso
    dangerDistance: 1.5             // Distância para perigo
}
```

**Eventos Emitidos:**

-   `collision-danger`: Colisão perigosa detectada
-   `collision-warning`: Proximidade detectada

### 2. Collision Feedback (`collision-feedback.js`)

Sistema de feedback visual, sonoro e háptico.

**Parâmetros:**

```javascript
{
    enabled: true,                  // Ativar/desativar feedback
    visualFeedback: true,           // Efeitos visuais
    audioFeedback: true,            // Sons de impacto
    hudFeedback: true               // Alertas no HUD
}
```

**Recursos:**

-   Flash vermelho na tela
-   Indicador de proximidade (anel)
-   Sons sintéticos (Web Audio API)
-   Integração com HUD
-   Vibração em controles VR

### 3. Collision Particles (`collision-particles.js`)

Sistema de partículas otimizado com pool.

**Parâmetros:**

```javascript
{
    poolSize: 50,                   // Tamanho do pool
    particleDuration: 300,          // Duração em ms
    particleSize: 0.05              // Tamanho das partículas
}
```

**Otimizações:**

-   Pool de partículas reutilizáveis
-   Sem criação/destruição dinâmica
-   Animações curtas e eficientes

### 4. Model Collision (ATUALIZADO)

Sistema base de colisão para modelos 3D.

**Novos Recursos:**

-   Redução automática de velocidade (70%)
-   Integração com Collision Manager
-   Eventos padronizados

## 📐 Uso Básico

### Configurar na Cena

```html
<a-scene
	collision-manager="enabled: true; proximityRadius: 15"
	collision-feedback="enabled: true"
	collision-particles="poolSize: 50"
>
</a-scene>
```

### Adicionar Colisão a Objetos

```html
<!-- Modelo com colisão -->
<a-gltf-model
	id="casa-model"
	src="#casa"
	model-collision="
        type: box; 
        width: 8; 
        height: 4; 
        depth: 6; 
        bounceForce: 0.8
    "
>
</a-gltf-model>

<!-- Checkpoint com colisão -->
<a-entity checkpoint="id: 1" position="0 5 -20"> </a-entity>
```

## 🎮 Comportamento

### Zonas de Detecção

1. **Zona de Proximidade** (< 15m Desktop / 10m VR)

    - Objeto entra na lista de verificação
    - Performance otimizada

2. **Zona de Aviso** (< 3m)

    - Indicador visual de proximidade
    - Som suave (se < 2m)
    - Cor laranja/amarela

3. **Zona de Perigo** (< 1.5m)
    - Flash vermelho intenso
    - Som de impacto forte
    - Partículas de colisão
    - Alerta no HUD
    - Vibração VR
    - Redução de velocidade

### Redução de Velocidade

Ao colidir, a velocidade do drone é reduzida para 30% da velocidade atual:

```javascript
velocidadeNova = velocidadeAtual × 0.3
```

Isso cria um efeito de "parede sólida" sem parar completamente o drone.

## 🎨 Feedback Visual

### Indicador de Proximidade

-   Anel vermelho/laranja ao redor da visão
-   Opacidade baseada na distância
-   Sempre visível na câmera

### Flash de Colisão

-   Flash vermelho intenso (0.8 opacity)
-   Fade out em 300ms
-   Não bloqueia visão

### Partículas de Impacto

-   8 partículas por impacto
-   Direções aleatórias
-   Fade out em 300ms
-   Reutilizadas do pool

## 🔊 Feedback Sonoro

### Som de Impacto Forte

-   Frequência: 200Hz → 50Hz
-   Duração: 200ms
-   Volume: 0.3

### Som de Aviso Suave

-   Frequência: 400Hz → 300Hz
-   Duração: 150ms
-   Volume: 0.1

## 📊 Performance

### Desktop

-   Raio de verificação: 15m
-   Intervalo: 50ms (20 verificações/segundo)
-   Objetos máximos: 20

### VR (Quest)

-   Raio de verificação: 10m
-   Intervalo: 100ms (10 verificações/segundo)
-   Objetos máximos: 20

### Otimizações

-   Apenas objetos próximos são verificados
-   Pool de partículas (sem alocação dinâmica)
-   Cooldown entre colisões (100ms)
-   Detecção simples (bounding boxes)

## 🐛 Troubleshooting

### Colisões não detectadas

-   ✓ Verificar se `collision-manager` está na cena
-   ✓ Verificar se objeto tem `model-collision`
-   ✓ Aumentar `proximityRadius`
-   ✓ Verificar console para erros

### Performance baixa

-   ✓ Reduzir `proximityRadius`
-   ✓ Aumentar `checkInterval`
-   ✓ Reduzir `maxCollisionObjects`
-   ✓ Reduzir `poolSize` de partículas

### Sons não tocam

-   ✓ Verificar se navegador permite Web Audio
-   ✓ Interagir com página antes (requisito do navegador)
-   ✓ Verificar `audioFeedback: true`

### Partículas não aparecem

-   ✓ Verificar `visualFeedback: true`
-   ✓ Verificar se `collision-particles` está na cena
-   ✓ Aumentar `poolSize`

## 🔮 Configurações Recomendadas

### Desktop (Alta Performance)

```html
<a-scene
	collision-manager="proximityRadius: 20; checkInterval: 30"
	collision-particles="poolSize: 100"
>
</a-scene>
```

### VR (Otimizado)

```html
<a-scene
	collision-manager="proximityRadius: 10; checkInterval: 100"
	collision-particles="poolSize: 30"
>
</a-scene>
```

### Debug (Visualizar Colisões)

```html
<a-scene show-collision-boxes>
	<a-gltf-model model-collision="visible: true"> </a-gltf-model>
</a-scene>
```

## 📝 Eventos Disponíveis

### Escutar Colisões

```javascript
// Colisão perigosa
scene.addEventListener("collision-danger", (evt) => {
	console.log("Colidiu com:", evt.detail.object);
	console.log("Tipo:", evt.detail.type);
	console.log("Distância:", evt.detail.distance);
});

// Proximidade
scene.addEventListener("collision-warning", (evt) => {
	console.log("Próximo de:", evt.detail.object);
	console.log("Distância:", evt.detail.distance);
});

// Alerta no HUD
scene.addEventListener("hud-alert", (evt) => {
	console.log("Alerta:", evt.detail.message);
});
```

## 🎯 Integração com Outros Sistemas

### Com Sistema de Dano

```javascript
scene.addEventListener("collision-danger", (evt) => {
	droneHealth -= 10;
	updateHealthBar();
});
```

### Com Sistema de Pontuação

```javascript
scene.addEventListener("collision-danger", (evt) => {
	score -= 50;
	showPenalty("-50 PONTOS");
});
```

### Com Sistema de Câmera

```javascript
scene.addEventListener("collision-danger", (evt) => {
	// Shake da câmera
	camera.setAttribute("animation", {
		property: "rotation",
		to: "0 0 5",
		dur: 100,
		dir: "alternate",
		loop: 2,
	});
});
```

## 📈 Melhorias Futuras

-   [ ] Colisão mesh-based (mais precisa)
-   [ ] Diferentes tipos de superfície (metal, madeira, etc)
-   [ ] Sons customizáveis por objeto
-   [ ] Dano baseado em velocidade de impacto
-   [ ] Replay de colisões
-   [ ] Estatísticas de colisões
-   [ ] Modo ghost (atravessar paredes)

---

**Versão**: 1.0.0  
**Tipo**: Sistema de Física e Feedback  
**Última Atualização**: 2025-10-13
**Compatibilidade**: Desktop e VR (Quest)
