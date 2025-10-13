# Fix de Rotação do Drone

## 📋 Problema Identificado

O drone estava virando de cabeça para baixo durante o voo devido a:

1. Sistema de auto-nivelamento muito agressivo
2. Falta de limites de rotação
3. Física que permitia rotações extremas

## ✅ Solução Implementada

Criado componente `drone-rotation-limiter` que:

-   **Limita rotações** para evitar capotamento
-   **Corrige automaticamente** quando detecta problema
-   **Nivela suavemente** o drone de volta à posição normal

## 🔧 Configuração

### Aplicado ao Drone

```html
<a-entity
	id="drone"
	drone-controller
	drone-rotation-limiter="
        maxPitch: 45; 
        maxRoll: 30; 
        autoCorrect: true; 
        correctionSpeed: 2.0
    "
>
</a-entity>
```

## 📊 Parâmetros

| Parâmetro         | Tipo    | Padrão | Descrição                              |
| ----------------- | ------- | ------ | -------------------------------------- |
| `maxPitch`        | number  | 45     | Máxima inclinação frente/trás (graus)  |
| `maxRoll`         | number  | 30     | Máxima inclinação lateral (graus)      |
| `autoCorrect`     | boolean | true   | Ativar correção automática             |
| `correctionSpeed` | number  | 2.0    | Velocidade da correção (multiplicador) |

## 🎯 Como Funciona

### 1. Detecção de Problema

```javascript
// Verifica se está de cabeça para baixo
if (Math.abs(pitch) > 90°) {
    console.warn('⚠️ DRONE DE CABEÇA PARA BAIXO!');
    // Ativa correção
}
```

### 2. Limitação de Rotação

```javascript
// Limita pitch (frente/trás)
if (Math.abs(pitch) > maxPitch) {
    pitch = sign(pitch) × maxPitch;
}

// Limita roll (lateral)
if (Math.abs(roll) > maxRoll) {
    roll = sign(roll) × maxRoll;
}
```

### 3. Correção Automática

```javascript
// Suaviza rotação para 0° (nivelado)
pitch = lerp(pitch, 0, correctionSpeed × deltaTime);
roll = lerp(roll, 0, correctionSpeed × deltaTime);
```

## 🛡️ Proteções Implementadas

### Limites de Rotação

-   **Pitch (X)**: ±45° máximo
    -   Permite inclinação para frente/trás
    -   Impede capotamento
-   **Roll (Z)**: ±30° máximo
    -   Permite inclinação lateral
    -   Mantém estabilidade

### Detecção de Cabeça para Baixo

-   Detecta quando pitch > 90° ou < -90°
-   Ativa correção imediata
-   Restaura última rotação válida

### Normalização de Ângulos

-   Converte ângulos para -180° a 180°
-   Evita valores acumulados
-   Mantém consistência

## 🎮 Comportamento em Jogo

### Voo Normal

```
Drone inclinado 30° → OK ✅
Drone inclinado 45° → Limite atingido ⚠️
Drone inclinado 50° → Limitado a 45° 🔒
```

### Correção Automática

```
Drone de cabeça para baixo (120°) → Detectado ⚠️
↓
Correção ativada → Nivelando... 🔄
↓
Drone nivelado (0°) → Correção completa ✅
```

### Logs do Sistema

```
🔒 Limitador de rotação do drone ativado
📐 Limites: Pitch ±45°, Roll ±30°
⚠️ DRONE DE CABEÇA PARA BAIXO! Corrigindo...
✅ Drone nivelado com sucesso
```

## 🔍 Debug

### Verificar Rotação Atual

```javascript
const rotation = document.querySelector("#drone").getAttribute("rotation");
console.log("Pitch (X):", rotation.x);
console.log("Yaw (Y):", rotation.y);
console.log("Roll (Z):", rotation.z);
```

### Ajustar Limites

```html
<!-- Mais permissivo -->
drone-rotation-limiter="maxPitch: 60; maxRoll: 45"

<!-- Mais restritivo -->
drone-rotation-limiter="maxPitch: 30; maxRoll: 20"

<!-- Sem correção automática -->
drone-rotation-limiter="autoCorrect: false"
```

## 📊 Performance

### Impacto

-   **CPU**: Mínimo (~0.05ms por frame)
-   **Memória**: Desprezível
-   **Cálculos**: Apenas normalização e lerp

### Otimizações

-   Executa apenas quando necessário
-   Salva última rotação válida
-   Desativa correção quando nivelado

## 🐛 Troubleshooting

### Drone ainda vira de cabeça para baixo

-   ✓ Verificar se componente está aplicado
-   ✓ Aumentar `correctionSpeed`
-   ✓ Reduzir `maxPitch` e `maxRoll`
-   ✓ Verificar conflitos com `drone-controller`

### Correção muito agressiva

-   ✓ Reduzir `correctionSpeed`
-   ✓ Aumentar limites (`maxPitch`, `maxRoll`)
-   ✓ Desativar `autoCorrect` temporariamente

### Drone não inclina o suficiente

-   ✓ Aumentar `maxPitch` para mais inclinação
-   ✓ Aumentar `maxRoll` para curvas mais fechadas
-   ✓ Verificar se `autoCorrect` não está muito rápido

## 🔄 Integração com Outros Sistemas

### Com drone-controller

O limitador trabalha **após** o controlador:

```
drone-controller calcula rotação
↓
drone-rotation-limiter verifica limites
↓
Aplica rotação segura ao drone
```

### Com Física

-   Não interfere com física de movimento
-   Apenas limita rotações
-   Mantém velocidade e aceleração

### Com Modos de Voo

-   Funciona em todos os modos (Cinematográfico, FPV, etc.)
-   Limites são sempre aplicados
-   Garante segurança em qualquer situação

## 🎯 Valores Recomendados

### Por Modo de Voo

| Modo            | maxPitch | maxRoll | correctionSpeed |
| --------------- | -------- | ------- | --------------- |
| Cinematográfico | 30°      | 20°     | 1.5             |
| Normal          | 45°      | 30°     | 2.0             |
| FPV/Sport       | 60°      | 45°     | 2.5             |
| Iniciante       | 20°      | 15°     | 1.0             |

### Por Experiência

| Nível         | maxPitch | maxRoll | autoCorrect |
| ------------- | -------- | ------- | ----------- |
| Iniciante     | 30°      | 20°     | true        |
| Intermediário | 45°      | 30°     | true        |
| Avançado      | 60°      | 45°     | false       |
| Profissional  | 75°      | 60°     | false       |

## 🔮 Melhorias Futuras

-   [ ] Limites dinâmicos baseados no modo de voo
-   [ ] Feedback visual quando atinge limite
-   [ ] Som de alerta ao detectar problema
-   [ ] Estatísticas de correções aplicadas
-   [ ] Modo "acrobático" sem limites
-   [ ] Gravação de rotações problemáticas

## 📝 Notas Técnicas

### Normalização de Ângulos

```javascript
// Converte 270° para -90°
// Converte 450° para 90°
while (angle > 180) angle -= 360;
while (angle < -180) angle += 360;
```

### Interpolação Linear (Lerp)

```javascript
// Suaviza transição de start para end
lerp(start, end, t) {
    return start + (end - start) × min(t, 1);
}
```

### Detecção de Cabeça para Baixo

```javascript
// Pitch entre -90° e 90° = normal
// Pitch > 90° ou < -90° = invertido
isUpsideDown = Math.abs(pitch) > 90;
```

---

**Versão**: 1.0.0  
**Tipo**: Sistema de Segurança  
**Última Atualização**: 2025-10-12
