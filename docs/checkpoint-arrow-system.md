# Sistema de Seta de Navegação GPS para Drone

## 📋 Visão Geral

Sistema de navegação inteligente com **seta única estilo GPS** que segue o drone e aponta dinamicamente para o próximo checkpoint ativo. A seta atualiza automaticamente quando o jogador passa por cada checkpoint.

## 🎯 Funcionalidades Principais

### Seta Inteligente

-   **Segue o Drone**: Posicionada sempre à frente do drone
-   **Aponta para o Próximo**: Direciona automaticamente para o checkpoint ativo
-   **Atualização Automática**: Muda de alvo quando um checkpoint é completado
-   **Sempre Visível**: Permanece visível durante toda a corrida
-   **Animação Sutil**: Pulso suave e variação de brilho

### Comportamento Dinâmico

1. Inicia apontando para o **Checkpoint 1**
2. Quando passa pelo Checkpoint 1 → aponta para o **Checkpoint 2**
3. Quando passa pelo Checkpoint 2 → aponta para o **Checkpoint 3**
4. Quando todos completados → **seta desaparece**

## 🔧 Configuração

### Aplicar no Drone

O componente é adicionado diretamente ao drone:

```html
<a-entity
	id="drone"
	position="0 0 0"
	drone-controller
	drone-navigation-arrow="
        arrowColor: #00ff00; 
        arrowSize: 1.2; 
        offsetDistance: 3; 
        offsetHeight: 1.5
    "
>
</a-entity>
```

### Parâmetros Disponíveis

| Parâmetro        | Tipo   | Padrão  | Descrição                                    |
| ---------------- | ------ | ------- | -------------------------------------------- |
| `arrowColor`     | color  | #00ff00 | Cor da seta (verde por padrão)               |
| `arrowSize`      | number | 1.2     | Escala da seta                               |
| `offsetDistance` | number | 3       | Distância da seta à frente do drone (metros) |
| `offsetHeight`   | number | 1.5     | Altura da seta acima do drone (metros)       |

## 🎨 Estrutura Visual

### Componentes da Seta

1. **Corpo (Cilindro)**

    - Raio: 0.12 × arrowSize
    - Altura: 1.8 × arrowSize
    - Material com emissão de luz (0.6)

2. **Ponta (Cone)**
    - Raio base: 0.35 × arrowSize
    - Altura: 0.7 × arrowSize
    - Emissão de luz mais intensa (0.7)

### Animações

-   **Pulso**: Escala vertical (1.0 → 1.08) em 1.2s
-   **Brilho Corpo**: EmissiveIntensity (0.6 → 0.9) em 1.8s
-   **Brilho Ponta**: EmissiveIntensity (0.7 → 1.0) em 1.8s

## 🧭 Sistema de Navegação

### Posicionamento Relativo ao Drone

A seta é posicionada dinamicamente:

```javascript
// Posição à frente do drone
offsetX = sin(droneRotationY) × offsetDistance
offsetZ = cos(droneRotationY) × offsetDistance

arrowPosition = {
    x: droneX + offsetX,
    y: droneY + offsetHeight,
    z: droneZ + offsetZ
}
```

### Cálculo de Direção

A seta calcula dois ângulos para apontar corretamente:

1. **Yaw (Rotação Horizontal)**

    ```javascript
    angleY = atan2(dx, dz);
    ```

2. **Pitch (Inclinação Vertical)**
    ```javascript
    angleX = atan2(dy, horizontalDistance);
    ```

### Atualização em Tempo Real

-   Executado a cada frame via `tick()`
-   Posição atualizada baseada no drone
-   Rotação recalculada para o checkpoint alvo

## 🔄 Sistema de Checkpoints

### Detecção Automática

O sistema:

1. Busca todos os checkpoints na cena
2. Ordena por ID (1, 2, 3...)
3. Mantém lista de checkpoints ativados

### Eventos Integrados

Escuta o evento `checkpoint-reached`:

```javascript
this.el.sceneEl.addEventListener("checkpoint-reached", (evt) => {
	// Marca checkpoint como ativado
	// Atualiza para próximo alvo
});
```

### Progressão

```
Estado Inicial:
  Checkpoint 1 [ATIVO] ← Seta aponta aqui
  Checkpoint 2 [INATIVO]
  Checkpoint 3 [INATIVO]

Após passar pelo 1:
  Checkpoint 1 [✓ COMPLETO]
  Checkpoint 2 [ATIVO] ← Seta aponta aqui
  Checkpoint 3 [INATIVO]

Após passar pelo 2:
  Checkpoint 1 [✓ COMPLETO]
  Checkpoint 2 [✓ COMPLETO]
  Checkpoint 3 [ATIVO] ← Seta aponta aqui

Após passar pelo 3:
  Checkpoint 1 [✓ COMPLETO]
  Checkpoint 2 [✓ COMPLETO]
  Checkpoint 3 [✓ COMPLETO]
  Seta: [OCULTA]
```

## 🚀 Implementação

### Estrutura de Arquivos

```
js/
├── checkpoint-system.js      # Sistema de checkpoints
└── checkpoint-arrow.js        # Sistema de seta GPS (NOVO)

index.html                     # Configuração da cena
```

### Carregamento

```html
<script src="js/checkpoint-system.js?v=1.0.2"></script>
<script src="js/checkpoint-arrow.js?v=1.0.0"></script>
```

### Ordem de Inicialização

1. Cena carrega
2. Checkpoints são criados
3. Drone é inicializado
4. Seta GPS é criada
5. Seta busca checkpoints
6. Primeiro alvo é definido

## 🎮 Experiência do Jogador

### Feedback Visual

-   **Seta sempre visível** à frente do drone
-   **Aponta claramente** para onde ir
-   **Animação sutil** chama atenção sem distrair
-   **Atualização instantânea** ao completar checkpoint

### Vantagens

-   ✅ Não precisa procurar próximo checkpoint
-   ✅ Navegação intuitiva estilo GPS
-   ✅ Foco na pilotagem, não na orientação
-   ✅ Progressão clara e visual

## 🛠️ Personalização

### Alterar Cor

```html
drone-navigation-arrow="arrowColor: #ff0000"
<!-- Vermelho -->
drone-navigation-arrow="arrowColor: #0000ff"
<!-- Azul -->
drone-navigation-arrow="arrowColor: #ffff00"
<!-- Amarelo -->
```

### Ajustar Posição

```html
<!-- Mais próxima -->
drone-navigation-arrow="offsetDistance: 2; offsetHeight: 1"

<!-- Mais distante -->
drone-navigation-arrow="offsetDistance: 5; offsetHeight: 2"

<!-- Mais alta -->
drone-navigation-arrow="offsetDistance: 3; offsetHeight: 3"
```

### Modificar Tamanho

```html
<!-- Menor -->
drone-navigation-arrow="arrowSize: 0.8"

<!-- Maior -->
drone-navigation-arrow="arrowSize: 1.8"
```

## 📊 Performance

### Otimizações

-   Geometrias simples (cilindro + cone)
-   Apenas 2 animações CSS
-   Cálculos matemáticos leves
-   Sem física ou colisões
-   Atualização eficiente via `tick()`

### Impacto

-   **Drawcalls**: +2 (corpo + ponta)
-   **Polígonos**: ~40 total
-   **CPU**: Mínimo (cálculos trigonométricos simples)
-   **Memória**: Desprezível

## 🐛 Troubleshooting

### Seta não aparece

-   ✓ Verificar se componente está no drone
-   ✓ Confirmar que checkpoints têm IDs corretos
-   ✓ Checar console para erros

### Seta não aponta corretamente

-   ✓ Verificar posições dos checkpoints
-   ✓ Confirmar que eventos estão sendo emitidos
-   ✓ Revisar logs de atualização de alvo

### Seta não atualiza após checkpoint

-   ✓ Verificar se evento `checkpoint-reached` é emitido
-   ✓ Confirmar que `detail.id` está correto
-   ✓ Checar lista de checkpoints no console

## 📝 Logs do Sistema

O sistema gera logs informativos:

```
🧭 Inicializando seta de navegação GPS...
📍 3 checkpoints encontrados
🎯 Seta GPS criada
✅ Seta de navegação GPS configurada!
🎯 Novo alvo: Checkpoint 1

[Jogador passa pelo checkpoint 1]
✅ Checkpoint 1 alcançado!
🎯 Novo alvo: Checkpoint 2

[Jogador passa pelo checkpoint 2]
✅ Checkpoint 2 alcançado!
🎯 Novo alvo: Checkpoint 3

[Jogador passa pelo checkpoint 3]
✅ Checkpoint 3 alcançado!
🏁 Todos os checkpoints completados!
```

## 🔮 Melhorias Futuras

Possíveis expansões:

-   [ ] Distância numérica até o alvo
-   [ ] Mudança de cor por proximidade
-   [ ] Efeito de trilha/rastro
-   [ ] Som ao mudar de alvo
-   [ ] Indicador de progresso (1/3, 2/3, 3/3)
-   [ ] Minimapa integrado

## 🔄 Diferenças da Versão Anterior

### Versão Antiga (checkpoint-arrow)

-   ❌ Múltiplas setas (uma por checkpoint)
-   ❌ Setas fixas nos checkpoints
-   ❌ Não seguia o drone
-   ❌ Não atualizava automaticamente

### Versão Nova (drone-navigation-arrow)

-   ✅ Seta única e inteligente
-   ✅ Segue o drone
-   ✅ Atualiza automaticamente
-   ✅ Experiência GPS real

---

**Versão**: 2.0.0  
**Tipo**: Sistema de Navegação Inteligente  
**Última Atualização**: 2025-10-12
