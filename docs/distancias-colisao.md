# 📏 Distâncias de Detecção de Colisão

## Configurações Atuais

### 🎯 Distâncias de Alerta

| Nível          | Distância | Cor      | Comportamento                  |
| -------------- | --------- | -------- | ------------------------------ |
| 🟢 **Seguro**  | > 8m      | Verde    | Pulso lento, tamanho normal    |
| 🟡 **Atenção** | 4m - 8m   | Amarelo  | Pulso médio, tamanho aumentado |
| 🔴 **Perigo**  | < 4m      | Vermelho | Pulso rápido, tamanho máximo   |

### 🔍 Raios de Detecção

-   **Raio de Proximidade (Desktop)**: 30m
-   **Raio de Proximidade (VR)**: 25m
-   **Intervalo de Verificação (Desktop)**: 50ms
-   **Intervalo de Verificação (VR)**: 100ms

## 🎨 Detalhes Visuais

### Verde - Seguro (> 8m)

```
Círculo: 9px
Brilho: Suave (opacidade 0.3)
Pulso: 2 segundos
Círculos externos: Invisíveis
```

### Amarelo - Atenção (4m - 8m)

```
Círculo: 10px
Brilho: Médio (opacidade 0.4)
Pulso: 0.8 segundos
Círculos externos: Parcialmente visíveis
```

### Vermelho - Perigo (< 4m)

```
Círculo: 11px
Brilho: Intenso (opacidade 0.5)
Pulso: 0.3 segundos
Círculos externos: Totalmente visíveis
```

## 🔧 Como Ajustar

### Modificar Distâncias

Edite `js/collision-manager.js`:

```javascript
schema: {
    warningDistance: { type: "number", default: 8 },    // Amarelo
    dangerDistance: { type: "number", default: 4 },     // Vermelho
    proximityRadius: { type: "number", default: 30 },   // Raio de busca
}
```

### Modificar Cores no HUD

Edite `js/hud-advanced-controller.js`:

```javascript
updateCollisionIndicator: function (level, distance) {
    let newLevel = "safe";
    if (distance < 4) {
        newLevel = "danger";    // Vermelho
    } else if (distance < 8) {
        newLevel = "warning";   // Amarelo
    }
    // ...
}
```

## 📊 Logs de Debug

O sistema emite logs no console a cada 2 segundos:

```
📍 Distância mais próxima: 5.2m | Objetos próximos: 1
🎯 Indicador de colisão: WARNING (5.20m)
```

Para ver os logs:

1. Pressione **F12** para abrir o console
2. Voe próximo à Quadra
3. Observe as mensagens de distância

## 🎮 Teste Rápido

### Console do Navegador

Cole no console para simular estados:

```javascript
// Simular perigo (vermelho)
document.querySelector("a-scene").emit("collision-danger", { distance: 3 });

// Simular atenção (amarelo)
document.querySelector("a-scene").emit("collision-warning", { distance: 6 });

// Simular seguro (verde)
document.querySelector("a-scene").emit("collision-safe", { distance: 10 });
```

## 💡 Dicas

### Por que aumentamos as distâncias?

1. **Objetos grandes**: A Quadra tem 20m de largura, então a distância do centro pode ser enganosa
2. **Tempo de reação**: Distâncias maiores dão mais tempo para o piloto reagir
3. **VR**: Em VR, a percepção de profundidade é diferente

### Ajuste para seu caso

-   **Drone rápido**: Aumente as distâncias
-   **Obstáculos pequenos**: Diminua as distâncias
-   **Iniciantes**: Use distâncias maiores
-   **Experts**: Use distâncias menores para desafio

## 🚀 Performance

-   ✅ Verificação otimizada (50-100ms)
-   ✅ Máximo de 20 objetos verificados simultaneamente
-   ✅ Cooldown de 100ms entre alertas do mesmo objeto
-   ✅ Sem impacto perceptível no FPS

---

**Última atualização**: 2025-10-13  
**Versão**: 2.0 (distâncias aumentadas)
