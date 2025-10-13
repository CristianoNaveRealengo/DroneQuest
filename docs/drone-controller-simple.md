# Controlador Simplificado do Drone

## 📋 Visão Geral

Controlador de drone **ultra simplificado** com apenas **150 linhas** (antes tinha 2000+). Mantém apenas o essencial: movimento básico em 6 direções e rotação.

## 🎮 Controles

### Movimento Horizontal

-   **↑ ou I**: Frente
-   **↓ ou K**: Trás
-   **← ou J**: Esquerda
-   **→ ou L**: Direita

### Movimento Vertical

-   **W**: Subir
-   **S**: Descer

### Rotação

-   **A**: Girar para esquerda
-   **D**: Girar para direita

### Utilitários

-   **R**: Reset posição (volta para 0, 3, 0)

## 🔧 Parâmetros

| Parâmetro       | Tipo   | Padrão | Descrição                     |
| --------------- | ------ | ------ | ----------------------------- |
| `moveSpeed`     | number | 5.0    | Velocidade de movimento (m/s) |
| `rotationSpeed` | number | 1.0    | Velocidade de rotação         |
| `drag`          | number | 0.9    | Resistência do ar (0-1)       |

## 📊 Configuração

```html
<a-entity
	id="drone"
	drone-controller="
        moveSpeed: 5.0; 
        rotationSpeed: 1.0; 
        drag: 0.9
    "
>
</a-entity>
```

## 🎯 O que foi REMOVIDO

Para simplificar, foram removidos:

-   ❌ Modos de voo (Cinematográfico, FPV, Panorâmico)
-   ❌ Sistema de hover automático
-   ❌ Estabilização complexa
-   ❌ Sistema de pouso
-   ❌ Controles VR
-   ❌ Sistema de bateria
-   ❌ Efeitos visuais complexos
-   ❌ Sistema de áudio
-   ❌ Física avançada
-   ❌ Auto-nivelamento
-   ❌ Estatísticas de voo
-   ❌ Qualidade gráfica dinâmica

## ✅ O que foi MANTIDO

Apenas o essencial:

-   ✅ Movimento em 6 direções (frente, trás, esquerda, direita, cima, baixo)
-   ✅ Rotação (yaw - girar esquerda/direita)
-   ✅ Física básica (velocidade + drag)
-   ✅ Limite de altura mínima (0.5m)
-   ✅ Reset de posição
-   ✅ Controles de teclado
-   ✅ Compatível com sistema de colisão

## 🚁 Como Funciona

### 1. Movimento Direcional

```javascript
// Frente: aplica força na direção que o drone está olhando
forward = (0, 0, -1) rotacionado pelo yaw
velocity += forward × moveSpeed × deltaTime
```

### 2. Física Simples

```javascript
// A cada frame:
velocity × drag  // Reduz velocidade gradualmente
position += velocity  // Aplica movimento
```

### 3. Rotação

```javascript
// Girar:
rotation.y += rotationSpeed × 50 × deltaTime
```

## 📐 Sistema de Coordenadas

```
        Y (Cima)
        |
        |
        |_________ X (Direita)
       /
      /
     Z (Frente)
```

## 🔄 Integração com Outros Sistemas

### Com Limitador de Rotação

O `drone-rotation-limiter` continua funcionando:

```html
<a-entity drone-controller drone-rotation-limiter="maxPitch: 35; maxRoll: 25">
</a-entity>
```

### Com Sistema de Colisão

O `model-collision` continua detectando colisões:

```html
<a-gltf-model model-collision="type: box; width: 5; height: 3"> </a-gltf-model>
```

### Com Seta de Navegação

O `drone-navigation-arrow` continua apontando:

```html
<a-entity drone-controller drone-navigation-arrow> </a-entity>
```

## 📊 Performance

### Antes (Controlador Complexo)

-   📄 **2000+ linhas** de código
-   🧠 **~50 variáveis** de estado
-   ⚙️ **15+ sistemas** integrados
-   🐌 **Complexo** de manter

### Agora (Controlador Simples)

-   📄 **150 linhas** de código (93% menor!)
-   🧠 **3 variáveis** de estado
-   ⚙️ **1 sistema** (movimento básico)
-   ⚡ **Fácil** de entender e modificar

## 🎯 Casos de Uso

### Ideal Para:

-   ✅ Protótipos rápidos
-   ✅ Testes de cenário
-   ✅ Aprendizado de A-Frame
-   ✅ Jogos simples
-   ✅ Demonstrações

### Não Ideal Para:

-   ❌ Simulação realista
-   ❌ Controles VR complexos
-   ❌ Modos de voo avançados
-   ❌ Competições de corrida

## 🔧 Personalização

### Aumentar Velocidade

```html
drone-controller="moveSpeed: 10.0"
```

### Rotação Mais Rápida

```html
drone-controller="rotationSpeed: 2.0"
```

### Menos Resistência (mais deslizamento)

```html
drone-controller="drag: 0.95"
```

### Mais Resistência (parada rápida)

```html
drone-controller="drag: 0.8"
```

## 🐛 Troubleshooting

### Drone não se move

-   ✓ Verificar se `drone-controller` está aplicado
-   ✓ Testar com teclas alternativas (setas E I/J/K/L)
-   ✓ Verificar console para erros

### Movimento muito lento

-   ✓ Aumentar `moveSpeed`
-   ✓ Reduzir `drag`

### Movimento muito rápido

-   ✓ Reduzir `moveSpeed`
-   ✓ Aumentar `drag`

### Drone atravessa objetos

-   ✓ Adicionar `model-collision` aos objetos
-   ✓ Verificar se colisões estão ativadas

## 🔮 Expansões Futuras

Se precisar adicionar funcionalidades:

### Adicionar Inclinação

```javascript
// No movimento frente/trás:
rotation.x = velocity.z × -5; // Inclina baseado na velocidade
```

### Adicionar Boost

```javascript
if (this.keys["ShiftLeft"]) {
    moveSpeed × 2; // Dobra velocidade
}
```

### Adicionar Freio

```javascript
if (this.keys["Space"]) {
	this.velocity.multiplyScalar(0.5); // Reduz velocidade pela metade
}
```

## 📝 Código Completo

O controlador completo tem apenas **150 linhas**:

-   30 linhas: Schema e init
-   40 linhas: Setup de controles
-   80 linhas: Lógica de movimento (tick)

## 🎓 Aprendizado

Este controlador é perfeito para:

-   Entender física básica de movimento
-   Aprender sistema de coordenadas 3D
-   Praticar manipulação de vetores
-   Estudar controles de teclado

---

**Versão**: 2.0.0 (Simplificada)  
**Linhas de Código**: ~150 (antes: 2000+)  
**Complexidade**: Baixa  
**Última Atualização**: 2025-10-12
