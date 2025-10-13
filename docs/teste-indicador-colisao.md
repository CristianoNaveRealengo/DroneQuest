# 🧪 Teste do Indicador de Colisão

## Como Testar

### 1. Verificação Visual Rápida

Abra o console do navegador (F12) e procure por:

```
🎯 Indicador de colisão: SAFE (999.00m)
🎯 Indicador de colisão: WARNING (2.50m)
🎯 Indicador de colisão: DANGER (1.20m)
```

### 2. Teste Manual no Jogo

1. **Inicie o jogo** e aguarde o HUD carregar
2. **Observe o ponto central** (deve estar verde inicialmente)
3. **Voe em direção à Quadra** (objeto grande no centro)
4. **Observe as mudanças de cor**:
    - 🟢 **Verde**: Longe (> 3m)
    - 🟡 **Amarelo**: Aproximando (1.5m - 3m)
    - 🔴 **Vermelho**: Muito perto (< 1.5m) - pulsando rápido!

### 3. Teste com Console

Cole no console do navegador para simular eventos:

```javascript
// Simular proximidade moderada (amarelo)
document.querySelector("a-scene").emit("collision-warning", {
	distance: 2.5,
});

// Simular perigo (vermelho)
document.querySelector("a-scene").emit("collision-danger", {
	distance: 1.0,
});

// Voltar para seguro (verde)
document.querySelector("a-scene").emit("collision-safe", {
	distance: 999,
});
```

### 4. Verificar Estado do Sistema

Cole no console:

```javascript
// Ver estado atual do indicador
const camera = document.querySelector("#drone-camera");
const hud = camera.components["hud-advanced"];
console.log("Estado atual:", hud.collisionState);
```

## Comportamento Esperado

### 🟢 Estado Seguro (Verde)

-   **Cor**: Verde brilhante (#00ff00)
-   **Tamanho**: 6px de raio
-   **Pulso**: Lento (2 segundos)
-   **Círculos externos**: Invisíveis
-   **Console**: `🎯 Indicador de colisão: SAFE`

### 🟡 Estado de Aviso (Amarelo)

-   **Cor**: Amarelo (#ffff00)
-   **Tamanho**: 7px de raio
-   **Pulso**: Médio (0.8 segundos)
-   **Círculos externos**: Parcialmente visíveis
-   **Console**: `🎯 Indicador de colisão: WARNING (2.XXm)`

### 🔴 Estado de Perigo (Vermelho)

-   **Cor**: Vermelho (#ff0000)
-   **Tamanho**: 8px de raio
-   **Pulso**: Rápido (0.3 segundos)
-   **Círculos externos**: Totalmente visíveis e pulsantes
-   **Console**: `🎯 Indicador de colisão: DANGER (1.XXm)`

## Troubleshooting

### Ponto não muda de cor?

1. **Verifique se o HUD está carregado**:

```javascript
console.log(document.querySelector("#hud-advanced-plane"));
```

2. **Verifique se o collision-manager está ativo**:

```javascript
const scene = document.querySelector("a-scene");
console.log(scene.components["collision-manager"]);
```

3. **Force um reload do HUD** (pressione **K** no teclado)

### Ponto fica travado em uma cor?

-   O sistema tem timeout de 500ms
-   Se não receber atualizações, volta automaticamente para verde
-   Verifique se há objetos com `model-collision` na cena

### Console mostra erros?

Procure por:

-   `❌` - Erros críticos
-   `⚠️` - Avisos
-   `🎯` - Logs do indicador de colisão

## Objetos com Colisão na Cena

Atualmente apenas a **Quadra** tem colisão ativa:

```html
<a-gltf-model
	id="Quadra"
	model-collision="type: box; width: 20; height: 5; depth: 30"
	...
></a-gltf-model>
```

Para adicionar mais objetos com colisão, adicione o atributo `model-collision` a qualquer elemento.

## Ajustes de Distância

Para modificar as distâncias de aviso, edite em `js/collision-manager.js`:

```javascript
schema: {
    warningDistance: { type: "number", default: 3 },    // Amarelo
    dangerDistance: { type: "number", default: 1.5 },   // Vermelho
}
```

## Performance

-   ✅ Sistema otimizado para VR
-   ✅ Verificação a cada 50ms (Desktop) ou 100ms (VR)
-   ✅ Máximo de 20 objetos verificados simultaneamente
-   ✅ Sem impacto visual perceptível

---

**Última atualização**: 2025-10-13  
**Status**: ✅ Funcionando
