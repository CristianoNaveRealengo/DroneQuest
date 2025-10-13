# Sistema de Instanciamento de Meshes

## 📋 Visão Geral

Sistema que usa `THREE.InstancedMesh` para reduzir drasticamente o número de drawcalls, combinando objetos repetidos em uma única chamada de renderização.

## 🎯 Objetivo

**Reduzir Drawcalls (Calls)** para melhorar performance:

-   Objetos repetidos → 1 drawcall
-   Checkpoints mesclados → 1 drawcall
-   Menos trabalho para a GPU

## 🔧 Como Funciona

### 1. Instanciamento de Gols

**ANTES**:

```
Gol Esquerdo: 1 drawcall
Gol Direito: 1 drawcall
Total: 2 drawcalls
```

**DEPOIS**:

```
2 Gols Instanciados: 1 drawcall
Total: 1 drawcall
Redução: 50%
```

### 2. Mesclagem de Checkpoints

**ANTES**:

```
Checkpoint 1: 1 drawcall
Checkpoint 2: 1 drawcall
Checkpoint 3: 1 drawcall
Total: 3 drawcalls
```

**DEPOIS**:

```
3 Checkpoints Mesclados: 1 drawcall
Total: 1 drawcall
Redução: 66%
```

## 📊 Técnicas Utilizadas

### THREE.InstancedMesh

Para objetos **idênticos** (mesmo modelo):

```javascript
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// Definir posição de cada instância
const matrix = new THREE.Matrix4();
matrix.compose(position, rotation, scale);
instancedMesh.setMatrixAt(index, matrix);
```

### BufferGeometryUtils.mergeBufferGeometries

Para objetos **similares** (mesma geometria):

```javascript
const geometries = [geo1, geo2, geo3];
const mergedGeometry =
	THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
```

## 🎮 Uso

### Ativar na Cena

```html
<a-scene mesh-instancing="enabled: true"> </a-scene>
```

### Desativar (se necessário)

```html
<a-scene mesh-instancing="enabled: false"> </a-scene>
```

## 📈 Benefícios

### Performance

**Drawcalls Reduzidos**:

-   Menos trabalho para a CPU
-   Menos chamadas de API gráfica
-   Melhor utilização da GPU

**FPS Melhorado**:

-   Menos overhead por frame
-   Renderização mais eficiente
-   Melhor para VR (precisa de 90+ FPS)

### Memória

**Geometria Compartilhada**:

-   Mesma geometria usada múltiplas vezes
-   Menos memória de vídeo
-   Carregamento mais rápido

## 🔍 Logs do Sistema

```
🔧 Sistema de instanciamento iniciado
📦 Configurando instanciamento de meshes...
✅ Gols instanciados (2 drawcalls → 1 drawcall)
✅ Checkpoints mesclados (3 drawcalls → 1 drawcall)
✅ Instanciamento configurado!
```

## ⚠️ Limitações

### Objetos Instanciados

-   **Não podem** ter animações individuais
-   **Não podem** ter materiais diferentes
-   **Não podem** ser movidos individualmente

### Solução

Os objetos originais são **ocultados** mas mantêm:

-   ✅ Componentes ativos (checkpoint, colisão)
-   ✅ Lógica de jogo
-   ✅ Detecção de eventos

Apenas a **renderização** é instanciada!

## 🎯 Objetos Otimizados

### Atualmente Instanciados

1. **Gols** (2 objetos)

    - Modelo idêntico
    - Posições diferentes
    - 2 drawcalls → 1 drawcall

2. **Checkpoints** (3 objetos)
    - Geometria similar
    - Mesclados em 1 mesh
    - 3 drawcalls → 1 drawcall

### Total de Redução

```
Antes: 5 drawcalls (2 gols + 3 checkpoints)
Depois: 2 drawcalls (1 gol instanciado + 1 checkpoint mesclado)
Redução: 60%
```

## 🔮 Expansões Futuras

### Objetos para Instanciar

-   [ ] Casas (se adicionar múltiplas iguais)
-   [ ] Árvores (se adicionar vegetação)
-   [ ] Postes de luz
-   [ ] Obstáculos repetidos
-   [ ] Partículas de efeitos

### Técnicas Avançadas

-   [ ] LOD (Level of Detail) automático
-   [ ] Frustum culling otimizado
-   [ ] Occlusion culling
-   [ ] Texture atlasing

## 📊 Comparação de Performance

### Sem Instanciamento

```
Drawcalls: 31
Triângulos: 894
FPS: 166.7
```

### Com Instanciamento

```
Drawcalls: ~25-28 (redução de 10-20%)
Triângulos: 894 (mesmo)
FPS: 170-180+ (melhoria de 2-8%)
```

## 🐛 Troubleshooting

### Objetos não aparecem

-   ✓ Verificar se modelos carregaram
-   ✓ Aguardar evento 'model-loaded'
-   ✓ Verificar console para erros

### Colisão não funciona

-   ✓ Objetos originais mantêm colisão
-   ✓ Apenas visual é instanciado
-   ✓ Componentes continuam ativos

### Performance piorou

-   ✓ Desativar: `mesh-instancing="enabled: false"`
-   ✓ Verificar se há muitos objetos únicos
-   ✓ Instanciamento funciona melhor com objetos repetidos

## 💡 Dicas de Otimização

### Quando Usar Instanciamento

✅ **Bom para**:

-   Objetos idênticos (árvores, postes)
-   Muitas cópias do mesmo modelo
-   Objetos estáticos

❌ **Não usar para**:

-   Objetos únicos
-   Objetos com animações diferentes
-   Poucos objetos (< 5)

### Maximizar Benefícios

1. **Agrupe por modelo**: Mesmos modelos juntos
2. **Use LOD**: Modelos simples à distância
3. **Texture Atlas**: Combine texturas
4. **Frustum Culling**: Não renderize o que não vê

## 📝 Código Exemplo

### Instanciar Árvores

```javascript
// 10 árvores idênticas
const treeGeometry = tree.geometry;
const treeMaterial = tree.material;
const instancedTrees = new THREE.InstancedMesh(treeGeometry, treeMaterial, 10);

// Posicionar cada árvore
for (let i = 0; i < 10; i++) {
	const matrix = new THREE.Matrix4();
	const position = new THREE.Vector3(i * 5, 0, 0);
	matrix.setPosition(position);
	instancedTrees.setMatrixAt(i, matrix);
}

scene.add(instancedTrees);
```

### Mesclar Objetos Estáticos

```javascript
const geometries = [];
objects.forEach((obj) => {
	const geo = obj.geometry.clone();
	geo.applyMatrix4(obj.matrixWorld);
	geometries.push(geo);
});

const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
const mesh = new THREE.Mesh(merged, material);
scene.add(mesh);
```

---

**Versão**: 1.0.0  
**Tipo**: Otimização de Renderização  
**Última Atualização**: 2025-10-12
