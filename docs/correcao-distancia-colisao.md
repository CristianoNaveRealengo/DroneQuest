# 🔧 Correção: Cálculo de Distância para Colisão

## 🐛 Problema Identificado

O sistema estava calculando a distância do **centro do drone** até o **centro do objeto**, o que causava:

-   ✗ Drone **dentro** da Quadra mas indicador **verde** (seguro)
-   ✗ Distância reportada como 10m mesmo estando no meio do objeto
-   ✗ Detecção imprecisa para objetos grandes

### Exemplo do Problema:

```
Quadra: 20m (largura) x 30m (profundidade)
Centro da Quadra: (0, 0, 0)
Drone dentro: (5, 2, 10)

Distância calculada (centro a centro): 11.2m ❌
Distância real (até superfície): 0m (DENTRO!) ✅
```

## ✅ Solução Implementada

### Novo Método: `calculateDistanceToBox()`

Calcula a distância até a **superfície** da caixa de colisão (AABB - Axis-Aligned Bounding Box):

```javascript
calculateDistanceToBox: function (dronePos, boxPos, dimensions) {
    // 1. Obter metade das dimensões
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;
    const halfDepth = dimensions.depth / 2;

    // 2. Ajustar posição Y com offset
    const adjustedBoxY = boxPos.y + dimensions.offsetY;

    // 3. Encontrar ponto mais próximo na superfície
    const closestX = Math.max(
        boxPos.x - halfWidth,
        Math.min(dronePos.x, boxPos.x + halfWidth)
    );
    const closestY = Math.max(
        adjustedBoxY - halfHeight,
        Math.min(dronePos.y, adjustedBoxY + halfHeight)
    );
    const closestZ = Math.max(
        boxPos.z - halfDepth,
        Math.min(dronePos.z, boxPos.z + halfDepth)
    );

    // 4. Calcular distância até esse ponto
    const dx = dronePos.x - closestX;
    const dy = dronePos.y - closestY;
    const dz = dronePos.z - closestZ;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
```

### Como Funciona:

1. **Encontra o ponto mais próximo** na superfície da caixa
2. **Calcula a distância** do drone até esse ponto
3. **Retorna 0** se o drone estiver dentro da caixa

## 📊 Comparação

### Antes (Centro a Centro):

| Posição do Drone          | Distância Calculada | Indicador       |
| ------------------------- | ------------------- | --------------- |
| Fora (20m)                | 20m                 | 🟢 Verde        |
| Borda (10m)               | 10m                 | 🟢 Verde        |
| **Dentro (5m do centro)** | **5m**              | **🟢 Verde** ❌ |

### Depois (Até Superfície):

| Posição do Drone | Distância Calculada | Indicador          |
| ---------------- | ------------------- | ------------------ |
| Fora (20m)       | 20m                 | 🟢 Verde           |
| Borda (10m)      | 10m                 | 🟡 Amarelo         |
| **Dentro**       | **0m**              | **🔴 Vermelho** ✅ |

## 🎯 Comportamento Atual

### Quadra (20m x 5m x 30m)

```
Drone fora (>8m da superfície): 🟢 Verde
Drone aproximando (4-8m): 🟡 Amarelo
Drone perto (<4m): 🔴 Vermelho
Drone DENTRO (0m): 🔴 Vermelho (pulsando rápido!)
```

## 🧪 Como Testar

### 1. Console do Navegador (F12)

Observe os logs:

```
📍 Distância mais próxima: 0.0m | Objetos próximos: 1
🎯 Indicador de colisão: DANGER (0.00m)
```

### 2. Teste Visual

1. Voe **longe** da Quadra → 🟢 Verde
2. Voe **em direção** à Quadra → 🟡 Amarelo
3. Voe **para dentro** da Quadra → 🔴 Vermelho
4. Voe **através** da Quadra → 🔴 Vermelho (sempre)

### 3. Teste de Precisão

Cole no console:

```javascript
// Ver distância atual
const manager =
	document.querySelector("a-scene").components["collision-manager"];
console.log("Objetos próximos:", manager.nearbyObjects);
```

## 🔍 Detalhes Técnicos

### AABB (Axis-Aligned Bounding Box)

-   **Eixos alinhados**: Caixa não rotaciona
-   **Rápido**: Cálculo simples e eficiente
-   **Preciso**: Para objetos retangulares como a Quadra

### Fórmula do Ponto Mais Próximo:

```
closestX = clamp(droneX, boxMinX, boxMaxX)
closestY = clamp(droneY, boxMinY, boxMaxY)
closestZ = clamp(droneZ, boxMinZ, boxMaxZ)

distance = sqrt(
    (droneX - closestX)² +
    (droneY - closestY)² +
    (droneZ - closestZ)²
)
```

### Casos Especiais:

1. **Drone dentro**: Todos os eixos clamped → distância = 0
2. **Drone fora**: Pelo menos um eixo não clamped → distância > 0
3. **Drone na borda**: Um ou mais eixos clamped → distância pequena

## 📈 Performance

-   ✅ **Sem impacto**: Cálculo adicional é mínimo
-   ✅ **Otimizado**: Apenas para objetos com `model-collision`
-   ✅ **Escalável**: Funciona com múltiplos objetos

## 🚀 Próximos Passos

### Melhorias Futuras:

1. **OBB (Oriented Bounding Box)**: Para objetos rotacionados
2. **Mesh Collision**: Para formas complexas
3. **Spatial Partitioning**: Para muitos objetos

### Limitações Atuais:

-   ⚠️ Não considera rotação do objeto
-   ⚠️ Apenas caixas retangulares
-   ⚠️ Não funciona com formas irregulares

## 💡 Dicas

### Para Desenvolvedores:

-   Use `model-collision` em todos os objetos sólidos
-   Defina `width`, `height`, `depth` corretamente
-   Ajuste `offsetY` se necessário

### Para Ajustar Sensibilidade:

```javascript
// Em collision-manager.js
schema: {
    warningDistance: 8,  // Amarelo
    dangerDistance: 4,   // Vermelho
}
```

---

**Versão**: 3.0  
**Data**: 2025-10-13  
**Status**: ✅ Funcionando corretamente
