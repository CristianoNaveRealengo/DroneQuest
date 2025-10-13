# Sistema de Setas de Navegação para Checkpoints

## 📋 Visão Geral

Sistema de setas 3D estilo GPS que apontam dinamicamente para o próximo checkpoint, facilitando a navegação do jogador no percurso de corrida VR.

## 🎯 Funcionalidades

### Setas Direcionais

-   **Estilo GPS**: Setas 3D compostas por cilindro (corpo) + cone (ponta)
-   **Direcionamento Dinâmico**: Atualiza rotação em tempo real apontando para o próximo checkpoint
-   **Sempre Visível**: Setas permanecem visíveis durante toda a corrida
-   **Animação Sutil**: Pulso suave e variação de brilho para chamar atenção sem distrair

### Configuração por Checkpoint

Cada checkpoint pode ter sua própria seta configurada via atributos:

```html
<a-entity
	mixin="checkpoint"
	position="15 8 -15"
	checkpoint="id: 1"
	checkpoint-arrow="
        targetCheckpointId: 2; 
        arrowColor: #00ff00; 
        arrowSize: 1.5; 
        offsetY: 0
    "
>
</a-entity>
```

## 🔧 Parâmetros do Componente

| Parâmetro            | Tipo   | Padrão  | Descrição                                              |
| -------------------- | ------ | ------- | ------------------------------------------------------ |
| `targetCheckpointId` | number | 2       | ID do checkpoint para onde a seta aponta               |
| `arrowColor`         | color  | #00ff00 | Cor da seta (verde por padrão)                         |
| `arrowSize`          | number | 1.5     | Escala da seta (multiplicador)                         |
| `offsetY`            | number | 0       | Deslocamento vertical da seta em relação ao checkpoint |

## 🎨 Estrutura Visual

### Componentes da Seta

1. **Corpo (Cilindro)**

    - Raio: 0.15 × arrowSize
    - Altura: 2 × arrowSize
    - Material com emissão de luz

2. **Ponta (Cone)**
    - Raio base: 0.4 × arrowSize
    - Altura: 0.8 × arrowSize
    - Posicionada no topo do corpo

### Animações

-   **Pulso**: Escala vertical sutil (1.0 → 1.1) em 1.5s
-   **Brilho**: Variação de emissiveIntensity (0.5 → 0.8) em 2s

## 📐 Sistema de Rotação

### Cálculo de Direção

A seta calcula automaticamente dois ângulos:

1. **Yaw (Rotação Y)**: Direção horizontal

    ```javascript
    angleY = Math.atan2(dx, dz) * (180 / Math.PI);
    ```

2. **Pitch (Rotação X)**: Inclinação vertical
    ```javascript
    angleX = Math.atan2(dy, horizontalDistance) * (180 / Math.PI);
    ```

### Atualização em Tempo Real

O método `tick()` atualiza a direção da seta a cada frame, garantindo que sempre aponte para o checkpoint alvo.

## 🚀 Implementação no Projeto

### Estrutura de Checkpoints

```
Checkpoint 1 (15, 8, -15)
    ↓ [Seta aponta para Checkpoint 2]
Checkpoint 2 (-20, 12, -30)
    ↓ [Seta aponta para Checkpoint 3]
Checkpoint 3 (0, 10, -45)
    [Checkpoint final - sem seta]
```

### Carregamento

O script é carregado após o sistema de checkpoints:

```html
<script src="js/checkpoint-system.js?v=1.0.2"></script>
<script src="js/checkpoint-arrow.js?v=1.0.0"></script>
```

## 🎮 Comportamento em Jogo

1. **Inicialização**: Setas são criadas quando a cena carrega
2. **Busca de Alvo**: Cada seta localiza seu checkpoint alvo pelo ID
3. **Atualização Contínua**: Direção é recalculada a cada frame
4. **Feedback Visual**: Animações sutis mantêm a seta visível sem distrair

## 🔄 Integração com Sistema de Checkpoints

O sistema de setas funciona de forma independente mas complementar ao `checkpoint-system.js`:

-   **Não interfere** na detecção de colisão dos checkpoints
-   **Não modifica** a lógica de ativação
-   **Apenas adiciona** feedback visual de navegação

## 🛠️ Personalização

### Alterar Cor da Seta

```html
checkpoint-arrow="arrowColor: #ff0000"
<!-- Vermelho -->
checkpoint-arrow="arrowColor: #0000ff"
<!-- Azul -->
```

### Ajustar Tamanho

```html
checkpoint-arrow="arrowSize: 2.0"
<!-- Maior -->
checkpoint-arrow="arrowSize: 1.0"
<!-- Menor -->
```

### Posicionar Verticalmente

```html
checkpoint-arrow="offsetY: 5"
<!-- 5 metros acima -->
checkpoint-arrow="offsetY: -2"
<!-- 2 metros abaixo -->
```

## 📊 Performance

### Otimizações Implementadas

-   Geometrias simples (cilindro + cone)
-   Apenas 2 animações por seta
-   Cálculos matemáticos leves
-   Sem física ou colisões

### Impacto

-   **Drawcalls**: +2 por seta (corpo + ponta)
-   **Polígonos**: ~50 por seta
-   **CPU**: Mínimo (apenas cálculos de rotação)

## 🐛 Troubleshooting

### Seta não aparece

-   Verificar se o script foi carregado
-   Confirmar que o `targetCheckpointId` existe
-   Checar console para erros

### Seta não aponta corretamente

-   Verificar posições dos checkpoints
-   Confirmar que o checkpoint alvo foi encontrado
-   Revisar logs no console

### Performance baixa

-   Reduzir `arrowSize` para geometrias menores
-   Considerar remover animações se necessário

## 📝 Logs do Sistema

O sistema gera logs informativos:

```
🎯 Criando seta para checkpoint 2...
🎯 Checkpoint alvo encontrado: 2
✅ Seta criada apontando para checkpoint 2
```

## 🔮 Melhorias Futuras

Possíveis expansões do sistema:

-   [ ] Setas que desaparecem após checkpoint ativado
-   [ ] Cores diferentes por checkpoint
-   [ ] Distância numérica até o alvo
-   [ ] Efeito de trilha/rastro
-   [ ] Integração com minimapa

---

**Versão**: 1.0.0  
**Autor**: Sistema de Navegação VR  
**Última Atualização**: 2025-10-12
