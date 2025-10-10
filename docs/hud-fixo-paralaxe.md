# HUD Fixo com Paralaxe Sutil

## Visão Geral

Implementação de um HUD (Head-Up Display) fixo com movimento sutil de paralaxe para o drone VR, usando o arquivo `hud-01.svg` com linhas brancas. O HUD mantém a sensação de imersão através de movimento quase imperceptível baseado no movimento do drone.

## Características Principais

### 🎯 Posicionamento Fixo

-   **Distância**: 2.0m da câmera (mais próximo para VR)
-   **Tamanho**: 3.5x2.5m (compacto e centralizado)
-   **Transparência**: 80% (alta visibilidade)
-   **Cor**: Linhas brancas fixas (#ffffff)

### 🌊 Sistema de Paralaxe Sutil

-   **Intensidade**: 0.03 (movimento quase imperceptível)
-   **Suavização**: 0.1 (movimento fluido sem tremulação)
-   **Limitação**: Máximo 0.1m de deslocamento
-   **Eixos**: X (horizontal), Y (vertical reduzido), Z (mínimo)

### 📊 Dados Dinâmicos Exibidos

#### Painéis Principais

1. **Velocímetro** (Superior Esquerdo)

    - Velocidade em KM/H
    - Posição: Painel "KM/H" do SVG

2. **Bateria** (Superior Direito)

    - Percentual com cor dinâmica
    - Verde: >50%, Amarelo: 20-50%, Vermelho: <20%
    - Posição: Painel "ENERGIA" do SVG

3. **Altímetro** (Inferior Esquerdo)

    - Altitude em metros
    - Posição: Painel "METROS" do SVG

4. **Distância** (Inferior Direito)
    - Distância para próximo checkpoint
    - Formato: "120M"
    - Posição: Área do GPS do SVG

#### Informações Complementares

5. **Coordenadas GPS** (Superior Centro)

    - Formato: "X:0 Y:450 Z:0"
    - Posição dinâmica baseada no drone

6. **Tempo de Missão** (Superior Centro Esquerda)

    - Formato: "MM:SS"
    - Contador desde o início da missão

7. **Modo de Voo** (Centro Inferior Esquerda)

    - "CINEMATIC", "FPV/SPORT", "NORMAL"
    - Baseado no estado do drone controller

8. **Objetivo Atual** (Centro Inferior Direita)
    - "CHECKPOINT 1", "CHECKPOINT 2", etc.
    - Próximo objetivo da missão

### 🎮 Controles de Teclado

| Tecla   | Função                                       |
| ------- | -------------------------------------------- |
| **H**   | Alternar HUD ligado/desligado                |
| **U**   | Ciclar transparência (30%, 50%, 70%, 90%)    |
| **I**   | Manter linhas brancas (sem alteração de cor) |
| **+/-** | Aumentar/diminuir tamanho do HUD             |
| **0**   | Reset para tamanho padrão                    |
| **[/]** | Aproximar/afastar HUD da câmera              |

### 🥽 Compatibilidade VR/Desktop

#### Modo VR

-   HUD fixo relativo à câmera
-   Movimento de paralaxe baseado no drone
-   Posicionamento otimizado para headsets
-   Tamanho compacto para não obstruir visão

#### Modo Desktop

-   Mesmo comportamento do VR
-   Controles de teclado funcionais
-   Visualização em navegador

### ⚙️ Configurações Técnicas

```javascript
// Configurações padrão do componente
futuristic-hud="
  transparency: 0.8;
  hudColor: #ffffff;
  hudWidth: 3.5;
  hudHeight: 2.5;
  hudDistance: 2.0;
  useCleanHUD: true;
  parallaxIntensity: 0.03;
  smoothingFactor: 0.1
"
```

### 🔧 Sistema de Paralaxe

#### Algoritmo

1. **Captura** movimento do drone (deltaX, deltaY, deltaZ)
2. **Aplica** intensidade de paralaxe (0.03)
3. **Suaviza** movimento com fator 0.1
4. **Limita** deslocamento máximo (0.1m)
5. **Atualiza** posição do HUD container

#### Fatores de Redução

-   **Vertical (Y)**: 50% do movimento horizontal
-   **Profundidade (Z)**: 30% do movimento horizontal
-   **Máximo**: 0.1m em qualquer direção

### 📱 Otimizações

#### Performance

-   Uso de `requestAnimationFrame` para atualizações
-   Cálculos otimizados de distância
-   Limitação de movimento para evitar cálculos excessivos

#### Memória

-   Reutilização de elementos DOM
-   Cache de referências de elementos
-   Limpeza automática ao remover componente

### 🎨 Design Visual

#### Elementos SVG (hud-01.svg)

-   Frame principal com cantos chanfrados
-   Painéis de dados com bordas definidas
-   Crosshair central minimalista
-   Indicadores direcionais (N, S, L, O)
-   Linhas de referência sutis

#### Elementos Dinâmicos

-   Textos sobrepostos nos painéis
-   Indicador central pulsante (amarelo)
-   Cores dinâmicas para bateria
-   Animações sutis de opacidade

### 🚀 Integração com Sistema

#### Dependências

-   Componente `drone-controller` para dados do drone
-   Sistema de checkpoints para distâncias
-   A-Frame para renderização VR

#### Eventos

-   Atualização contínua via `requestAnimationFrame`
-   Sincronização com movimento do drone
-   Resposta a controles de teclado

## Conclusão

O HUD fixo com paralaxe sutil oferece uma experiência imersiva mantendo informações essenciais sempre visíveis. O movimento quase imperceptível cria sensação de profundidade sem causar enjoo, enquanto os dados dinâmicos fornecem feedback em tempo real sobre o estado do drone e missão.

## 🔧 Correções Implementadas

### Problema Identificado

-   O HUD estava carregando um arquivo SVG diferente (com fundo azul)
-   Cache do navegador estava interferindo no carregamento
-   Falta de contraste com o fundo da cena

### Soluções Aplicadas

#### 1. **Forçar hud-01.svg**

```javascript
// Uso direto do arquivo com timestamp para evitar cache
src: `assets/hud-01.svg?v=${timestamp}`;
```

#### 2. **Fundo de Contraste**

```javascript
// Fundo escuro semi-transparente para melhor visibilidade
const hudBackground = document.createElement("a-plane");
hudBackground.setAttribute("material", {
	color: "#000000",
	transparent: true,
	opacity: 0.3,
});
```

#### 3. **Controle de Reload**

-   **Tecla K**: Força recarregamento do hud-01.svg
-   **Função forceHUD01()**: Remove e recria o HUD completamente

#### 4. **Arquivo de Teste**

-   **test-hud-01.html**: Teste isolado para verificar carregamento do SVG

### Comandos de Correção

| Tecla | Função                              |
| ----- | ----------------------------------- |
| **K** | Força uso do hud-01.svg (recarrega) |
| **H** | Liga/desliga HUD                    |
| **U** | Ajusta transparência                |

### Verificação

1. Abrir `test-hud-01.html` para testar isoladamente
2. Pressionar **K** no jogo principal para forçar hud-01.svg
3. Verificar console para logs de carregamento

O HUD agora **garante** o uso do hud-01.svg com linhas brancas e fundo de contraste para máxima visibilidade.
