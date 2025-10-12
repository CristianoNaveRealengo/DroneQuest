# 🔧 Correção do Tremor no Parallax do Sky

## 🐛 Problema Identificado

Quando o drone se movia para frente, a imagem de fundo (sky 360) apresentava tremores visíveis, causando uma experiência visual desagradável.

## 🔍 Causa Raiz

O componente `sky-parallax` estava aplicando a rotação do sky diretamente baseado na posição do drone, sem nenhuma suavização. Isso causava:

1. **Mudanças bruscas**: Cada frame aplicava a rotação instantaneamente
2. **Intensidade alta**: Valor de 0.08 era muito sensível ao movimento
3. **Sem interpolação**: Não havia transição suave entre as rotações

## ✅ Solução Implementada

### 1. **Sistema de Suavização (Lerp)**

Implementado interpolação linear (lerp) para suavizar as transições:

```javascript
// Rotação atual e alvo separadas
this.currentRotation = { x: 0, y: 0 };
this.targetRotation = { x: 0, y: 0 };

// Aplicar suavização no tick
this.currentRotation.x +=
	(this.targetRotation.x - this.currentRotation.x) * this.data.smoothing;
this.currentRotation.y +=
	(this.targetRotation.y - this.currentRotation.y) * this.data.smoothing;
```

### 2. **Redução da Intensidade**

| Parâmetro          | Valor Anterior | Valor Novo | Redução |
| ------------------ | -------------- | ---------- | ------- |
| Intensidade base   | 0.05           | 0.02       | 60%     |
| Intensidade X      | 0.5            | 0.3        | 40%     |
| Intensidade no sky | 0.08           | 0.015      | 81%     |

### 3. **Novo Parâmetro de Smoothing**

Adicionado parâmetro `smoothing` com valor padrão de 0.1:

-   Valores menores = mais suave (mais lento)
-   Valores maiores = mais responsivo (mais rápido)
-   Valor configurado no sky: 0.08 (bem suave)

## 📊 Comparação Antes/Depois

### Antes

-   ❌ Tremores visíveis ao mover
-   ❌ Mudanças bruscas de rotação
-   ❌ Intensidade muito alta
-   ❌ Experiência visual desconfortável

### Depois

-   ✅ Movimento suave e fluido
-   ✅ Transições interpoladas
-   ✅ Intensidade sutil e agradável
-   ✅ Experiência visual confortável

## 🎯 Configuração Final

```html
<a-sky
	id="main-sky"
	src="assets/cenario/bg-upscaler.jpg"
	sky-parallax="intensity: 0.015; smoothing: 0.08"
>
</a-sky>
```

### Parâmetros Ajustáveis

-   **intensity**: Controla quanto o sky rotaciona (0.015 = muito sutil)
-   **smoothing**: Controla a suavização (0.08 = bem suave)

## 🔧 Ajustes Futuros

Se necessário ajustar o comportamento:

1. **Mais parallax**: Aumentar `intensity` (ex: 0.02 - 0.03)
2. **Menos parallax**: Diminuir `intensity` (ex: 0.01 - 0.005)
3. **Mais suave**: Diminuir `smoothing` (ex: 0.05 - 0.06)
4. **Mais responsivo**: Aumentar `smoothing` (ex: 0.1 - 0.15)

## 🎮 Testes Recomendados

1. Mover o drone para frente rapidamente
2. Fazer movimentos laterais
3. Combinar movimentos (diagonal)
4. Testar em VR e desktop
5. Verificar se não há tremores visíveis

## 📝 Notas Técnicas

-   A suavização usa interpolação linear (lerp) a cada frame
-   O sistema mantém estado entre frames para continuidade
-   A intensidade foi reduzida drasticamente para evitar enjoo em VR
-   O eixo X tem intensidade ainda menor (0.3) para evitar rotação excessiva

---

**Data**: 10/12/2025  
**Arquivo Modificado**: `index.html`  
**Componente**: `sky-parallax`  
**Tipo**: Correção de bug visual
