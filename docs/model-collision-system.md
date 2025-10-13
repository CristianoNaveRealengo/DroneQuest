# Sistema de Colisão para Modelos 3D

## 📋 Visão Geral

Sistema de colisão física para modelos GLB que impede o drone de passar através dos objetos 3D. Cria barreiras invisíveis ao redor dos modelos com detecção de colisão em tempo real.

## 🎯 Funcionalidades

### Tipos de Colisão Suportados

-   **Box (Caixa)**: Para objetos retangulares (quadra, casas, gols)
-   **Sphere (Esfera)**: Para objetos redondos
-   **Cylinder (Cilindro)**: Para objetos cilíndricos

### Características

-   ✅ Detecção de colisão em tempo real
-   ✅ Empurra o drone de volta ao colidir
-   ✅ Barreiras invisíveis (ou visíveis para debug)
-   ✅ Configurável por modelo
-   ✅ Performance otimizada para VR

## 🔧 Uso Básico

### Aplicar Colisão a um Modelo

```html
<a-gltf-model
	id="quadra-model"
	src="#quadra"
	position="-0.997 -2.20319 -0.264"
	scale="0.8 0.8 0.8"
	model-collision="
        type: box; 
        width: 12; 
        height: 0.5; 
        depth: 18; 
        offsetY: 0.25; 
        visible: false; 
        bounceForce: 0.8
    "
>
</a-gltf-model>
```

## 📊 Parâmetros

### Parâmetros Gerais

| Parâmetro     | Tipo    | Padrão | Descrição                                    |
| ------------- | ------- | ------ | -------------------------------------------- |
| `type`        | string  | 'box'  | Tipo de colisão: 'box', 'sphere', 'cylinder' |
| `visible`     | boolean | false  | Mostrar caixa de colisão (debug)             |
| `bounceForce` | number  | 0.5    | Força do empurrão ao colidir (0-1)           |
| `offsetX`     | number  | 0      | Deslocamento horizontal X                    |
| `offsetY`     | number  | 0      | Deslocamento vertical Y                      |
| `offsetZ`     | number  | 0      | Deslocamento horizontal Z                    |

### Parâmetros para Box

| Parâmetro | Tipo   | Padrão | Descrição                      |
| --------- | ------ | ------ | ------------------------------ |
| `width`   | number | 5      | Largura da caixa (eixo X)      |
| `height`  | number | 3      | Altura da caixa (eixo Y)       |
| `depth`   | number | 5      | Profundidade da caixa (eixo Z) |

### Parâmetros para Sphere e Cylinder

| Parâmetro | Tipo   | Padrão | Descrição                            |
| --------- | ------ | ------ | ------------------------------------ |
| `radius`  | number | 3      | Raio da esfera/cilindro              |
| `height`  | number | 3      | Altura do cilindro (apenas cylinder) |

## 🎮 Exemplos de Uso

### Quadra de Futebol

```html
<a-gltf-model
	id="quadra-model"
	src="#quadra"
	model-collision="
        type: box; 
        width: 12; 
        height: 0.5; 
        depth: 18; 
        offsetY: 0.25
    "
>
</a-gltf-model>
```

### Gol

```html
<a-gltf-model
	id="gol-model"
	src="#gol"
	model-collision="
        type: box; 
        width: 3; 
        height: 2.5; 
        depth: 1.5; 
        offsetY: 1.25
    "
>
</a-gltf-model>
```

### Casa

```html
<a-gltf-model
	id="casa-model"
	src="#casa"
	model-collision="
        type: box; 
        width: 8; 
        height: 4; 
        depth: 6; 
        offsetY: 2
    "
>
</a-gltf-model>
```

### Objeto Redondo

```html
<a-gltf-model
	id="bola-model"
	src="#bola"
	model-collision="
        type: sphere; 
        radius: 2
    "
>
</a-gltf-model>
```

### Poste/Coluna

```html
<a-gltf-model
	id="poste-model"
	src="#poste"
	model-collision="
        type: cylinder; 
        radius: 0.5; 
        height: 5; 
        offsetY: 2.5
    "
>
</a-gltf-model>
```

## 🔍 Modo Debug

### Ativar Visualização das Caixas de Colisão

**Opção 1**: Por modelo individual

```html
<a-gltf-model model-collision="visible: true"> </a-gltf-model>
```

**Opção 2**: Ativar globalmente na cena

```html
<a-scene show-collision-boxes> </a-scene>
```

Isso mostrará todas as caixas de colisão em vermelho semi-transparente com wireframe.

## 🛠️ Como Funciona

### 1. Criação da Barreira

Quando o modelo carrega, o sistema:

1. Cria uma entidade invisível (caixa de colisão)
2. Posiciona como filho do modelo
3. Aplica geometria baseada no tipo

### 2. Detecção de Colisão

A cada frame (`tick`):

1. Calcula distância entre drone e barreira
2. Verifica se há interseção baseada no tipo
3. Se colidir, empurra o drone de volta

### 3. Resposta à Colisão

Quando detecta colisão:

```javascript
// Empurra drone para posição anterior
pushBackX = lastX + (lastX - currentX) × bounceForce
pushBackY = lastY + (lastY - currentY) × bounceForce
pushBackZ = lastZ + (lastZ - currentZ) × bounceForce
```

## 📐 Ajustando Dimensões

### Como Descobrir Dimensões Corretas

1. **Ativar modo debug**:

    ```html
    model-collision="visible: true"
    ```

2. **Testar no jogo**: Voe ao redor do objeto

3. **Ajustar valores**: Modifique width, height, depth até cobrir o modelo

4. **Desativar debug**:
    ```html
    model-collision="visible: false"
    ```

### Dicas de Dimensionamento

-   **Quadra**: width e depth devem cobrir toda área
-   **Gols**: height deve cobrir as traves
-   **Casas**: adicione margem de segurança (10-20%)
-   **Objetos pequenos**: use sphere para simplicidade

## 🎯 Configurações Recomendadas

### Por Tipo de Objeto

| Objeto       | Type     | Width | Height | Depth | OffsetY |
| ------------ | -------- | ----- | ------ | ----- | ------- |
| Quadra       | box      | 12    | 0.5    | 18    | 0.25    |
| Gol          | box      | 3     | 2.5    | 1.5   | 1.25    |
| Casa Pequena | box      | 5     | 3      | 5     | 1.5     |
| Casa Grande  | box      | 8     | 4      | 6     | 2       |
| Árvore       | cylinder | 1     | 5      | -     | 2.5     |
| Bola         | sphere   | 1     | -      | -     | 0       |

### BounceForce Recomendado

-   **0.3-0.5**: Colisão suave (objetos leves)
-   **0.6-0.8**: Colisão média (padrão)
-   **0.9-1.0**: Colisão forte (paredes sólidas)

## 📊 Performance

### Otimizações Implementadas

-   Cálculos matemáticos simples
-   Sem física complexa
-   Detecção por proximidade
-   Apenas modelos com componente são verificados

### Impacto

-   **CPU**: Baixo (~0.1ms por modelo)
-   **Memória**: Mínima (apenas geometria invisível)
-   **Drawcalls**: +1 por modelo (se visible: true)

### Recomendações

-   Use `visible: false` em produção
-   Prefira `box` para objetos retangulares
-   Use `sphere` para objetos pequenos/redondos
-   Evite colisão em objetos decorativos distantes

## 🐛 Troubleshooting

### Drone passa através do objeto

-   ✓ Verificar se `model-collision` está aplicado
-   ✓ Aumentar dimensões (width, height, depth)
-   ✓ Ativar `visible: true` para ver caixa
-   ✓ Verificar se modelo carregou (`model-loaded`)

### Colisão muito agressiva

-   ✓ Reduzir `bounceForce`
-   ✓ Diminuir dimensões da caixa
-   ✓ Ajustar offsets (X, Y, Z)

### Caixa de colisão desalinhada

-   ✓ Ajustar `offsetX`, `offsetY`, `offsetZ`
-   ✓ Verificar escala do modelo
-   ✓ Verificar rotação do modelo

### Performance baixa

-   ✓ Desativar `visible` em todos os modelos
-   ✓ Reduzir número de modelos com colisão
-   ✓ Usar tipos mais simples (sphere vs box)

## 🔄 Eventos

### Evento de Colisão

O sistema emite evento quando detecta colisão:

```javascript
this.el.sceneEl.addEventListener("model-collision", (evt) => {
	console.log("Colidiu com:", evt.detail.model);
	console.log("Posição:", evt.detail.position);
});
```

## 🎨 Integração com Outros Sistemas

### Com Sistema de Áudio

```javascript
this.el.sceneEl.addEventListener("model-collision", (evt) => {
	// Tocar som de colisão
	audioSystem.playSFX("collision");
});
```

### Com Sistema de Dano

```javascript
this.el.sceneEl.addEventListener("model-collision", (evt) => {
	// Reduzir vida do drone
	droneHealth -= 10;
});
```

### Com Sistema de Partículas

```javascript
this.el.sceneEl.addEventListener("model-collision", (evt) => {
	// Criar efeito de impacto
	createImpactParticles(evt.detail.position);
});
```

## 📝 Logs do Sistema

```
🛡️ Criando colisão para modelo: quadra-model
✅ Colisão criada: box (12x0.5x18)
💥 Colisão detectada!
```

## 🔮 Melhorias Futuras

-   [ ] Colisão com múltiplas formas por modelo
-   [ ] Detecção de colisão mais precisa (mesh-based)
-   [ ] Som automático ao colidir
-   [ ] Efeito visual de impacto
-   [ ] Dano ao drone baseado em velocidade
-   [ ] Colisão entre objetos (não só drone)

---

**Versão**: 1.0.0  
**Tipo**: Sistema de Física Simplificada  
**Última Atualização**: 2025-10-12
