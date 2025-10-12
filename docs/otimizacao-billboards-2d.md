# 🚀 Otimização: Billboards 2D para Favela VR

## 📊 Comparação de Performance

### **Antes (Geometrias 3D):**

```
- Cada casa: 12-24 polígonos (box 3D)
- 20 casas: ~300-500 polígonos
- Morros: 4 camadas de cilindros = ~200 polígonos
- TOTAL: ~500-700 polígonos
```

### **Depois (Billboards 2D):**

```
- Cada casa: 1 plano (2 triângulos)
- 15 casas: 30 polígonos
- Morros: 3 cones simples = ~50 polígonos
- TOTAL: ~80 polígonos
```

### **Resultado:**

✅ **85-90% de redução de polígonos!**
✅ **Muito mais leve para VR**
✅ **FPS mais estável no Quest**

---

## 🎨 Técnica: Billboard (Look-At Camera)

### **O que é Billboard?**

Um plano 2D que sempre olha para a câmera, criando ilusão de 3D.

### **Implementação:**

```html
<a-plane
	position="25 6 -35"
	width="4"
	height="3"
	material="color: #d4a574; side: double"
	look-at="#drone-camera"
>
</a-plane>
```

### **Vantagens:**

-   ✅ Ultra leve (2 triângulos por casa)
-   ✅ Sempre visível de qualquer ângulo
-   ✅ Perfeito para objetos distantes
-   ✅ Fácil de texturizar com imagens

### **Desvantagens:**

-   ❌ Não tem profundidade real
-   ❌ Pode "girar" quando você passa perto
-   ❌ Melhor para objetos distantes

---

## 🏔️ Morros Simplificados

### **Antes:**

```html
<!-- 4 camadas de cilindros -->
<a-cylinder radius="35" height="5"></a-cylinder>
<a-cylinder radius="28" height="7"></a-cylinder>
<a-cylinder radius="20" height="8"></a-cylinder>
<a-cylinder radius="12" height="8"></a-cylinder>
```

### **Depois:**

```html
<!-- 1 cone simples -->
<a-cone
	radius-bottom="35"
	radius-top="8"
	height="28"
	segments-radial="8"
	segments-height="4"
>
</a-cone>
```

**Redução:** 4 objetos → 1 objeto = **75% menos geometria**

---

## 🎯 Próximos Passos (Opcional)

### **1. Adicionar Texturas de Casas:**

```html
<a-assets>
	<img id="casa-1" src="assets/casas/casa-favela-1.png" />
	<img id="casa-2" src="assets/casas/casa-favela-2.png" />
</a-assets>

<a-plane
	position="25 6 -35"
	width="4"
	height="3"
	material="src: #casa-1; transparent: true; alphaTest: 0.5"
	look-at="#drone-camera"
>
</a-plane>
```

### **2. Usar Sprite Sheets:**

Múltiplas casas em uma única imagem para reduzir requisições HTTP.

### **3. LOD (Level of Detail):**

-   Casas próximas: 3D detalhado
-   Casas médias: Billboards com textura
-   Casas distantes: Billboards simples (cor sólida)

---

## 📝 Notas Técnicas

### **Look-At Component:**

O `look-at="#drone-camera"` faz o plano sempre olhar para a câmera do drone, criando a ilusão de volume.

### **Side: Double:**

Renderiza os dois lados do plano, garantindo visibilidade de qualquer ângulo.

### **Cores Variadas:**

Usamos 3 tons diferentes (#d4a574, #c49564, #b48554) para criar variedade visual sem usar texturas.

---

## 🎮 Testando

1. Voe em direção aos morros (posição ~30, 0, -40)
2. Observe as casas sempre olhando para você
3. Compare o FPS com a versão anterior
4. Note a suavidade do movimento

---

**Data:** 10/12/2025  
**Tipo:** Otimização de Performance VR  
**Impacto:** Alto (85-90% redução de polígonos)
