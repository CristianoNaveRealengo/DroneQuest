# 🎯 Como Manipular os Checkpoints (Argolas)

## 📅 Data: 14/10/2025

## ✨ Checkpoints Agora São Formas Básicas

As argolas agora são elementos `<a-torus>` individuais, facilitando a manipulação via JavaScript ou diretamente no HTML.

## 🎯 Estrutura Atual

Cada checkpoint tem:

-   **ID único**: `checkpoint-1`, `checkpoint-2`, etc.
-   **Forma básica**: `<a-torus>` (argola/rosca)
-   **Propriedades individuais**: Posição, cor, tamanho, animação
-   **Componente checkpoint**: Sistema de detecção

### Exemplo de Checkpoint:

```html
<a-torus
	id="checkpoint-1"
	position="0 3 -15"
	rotation="0 0 0"
	radius="3"
	radius-tubular="0.3"
	segments-radial="16"
	segments-tubular="32"
	color="#00ff00"
	material="transparent: true; opacity: 0.6; metalness: 0; roughness: 1; emissive: #00ff00; emissiveIntensity: 0.4"
	animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear"
	checkpoint="id: 1; nextCheckpoint: 2"
>
</a-torus>
```

## 🔧 Propriedades Manipuláveis

### Geometria (Tamanho)

```javascript
// Aumentar tamanho da argola
document.querySelector("#checkpoint-1").setAttribute("radius", 5);

// Aumentar espessura do tubo
document.querySelector("#checkpoint-1").setAttribute("radius-tubular", 0.5);

// Aumentar qualidade (mais segmentos = mais suave)
document.querySelector("#checkpoint-1").setAttribute("segments-radial", 32);
document.querySelector("#checkpoint-1").setAttribute("segments-tubular", 64);
```

### Posição

```javascript
// Mover checkpoint
document.querySelector("#checkpoint-1").setAttribute("position", {
	x: 5,
	y: 10,
	z: -20,
});

// Mover gradualmente
document.querySelector("#checkpoint-1").setAttribute("animation__move", {
	property: "position",
	to: "10 15 -30",
	dur: 2000,
	easing: "easeInOutQuad",
});
```

### Rotação

```javascript
// Rotacionar checkpoint (inclinar)
document.querySelector("#checkpoint-1").setAttribute("rotation", {
	x: 45, // Inclinar para frente
	y: 0,
	z: 0,
});

// Rotação diferente
document.querySelector("#checkpoint-2").setAttribute("rotation", "0 0 90"); // Vertical
```

### Cor e Material

```javascript
// Mudar cor
document.querySelector("#checkpoint-1").setAttribute("color", "#ff0000"); // Vermelho

// Mudar material
document.querySelector("#checkpoint-1").setAttribute("material", {
	color: "#ff6600",
	transparent: true,
	opacity: 0.8,
	emissive: "#ff6600",
	emissiveIntensity: 0.6,
	metalness: 0.5,
	roughness: 0.3,
});
```

### Animação

```javascript
// Mudar velocidade de rotação
document.querySelector("#checkpoint-1").setAttribute("animation", {
	property: "rotation",
	to: "0 360 0",
	loop: true,
	dur: 4000, // Mais rápido (4 segundos)
	easing: "linear",
});

// Adicionar pulsação
document.querySelector("#checkpoint-1").setAttribute("animation__pulse", {
	property: "scale",
	to: "1.2 1.2 1.2",
	dir: "alternate",
	loop: true,
	dur: 1000,
	easing: "easeInOutQuad",
});
```

### Visibilidade

```javascript
// Esconder checkpoint
document.querySelector("#checkpoint-1").setAttribute("visible", false);

// Mostrar checkpoint
document.querySelector("#checkpoint-1").setAttribute("visible", true);

// Fade in/out
document.querySelector("#checkpoint-1").setAttribute("animation__fade", {
	property: "material.opacity",
	from: 0,
	to: 0.6,
	dur: 1000,
});
```

## 🎨 Exemplos Práticos

### 1. Criar Percurso Fácil (Argolas Maiores)

```javascript
const checkpoints = document.querySelectorAll('[id^="checkpoint-"]');
checkpoints.forEach((checkpoint) => {
	checkpoint.setAttribute("radius", 5); // Maior
	checkpoint.setAttribute("radius-tubular", 0.5); // Mais grosso
});
```

### 2. Criar Percurso Difícil (Argolas Menores)

```javascript
const checkpoints = document.querySelectorAll('[id^="checkpoint-"]');
checkpoints.forEach((checkpoint) => {
	checkpoint.setAttribute("radius", 2); // Menor
	checkpoint.setAttribute("radius-tubular", 0.2); // Mais fino
});
```

### 3. Mudar Cor por Nível

```javascript
// Checkpoint 1 - Verde (fácil)
document.querySelector("#checkpoint-1").setAttribute("color", "#00ff00");

// Checkpoint 2 - Amarelo (médio)
document.querySelector("#checkpoint-2").setAttribute("color", "#ffff00");

// Checkpoint 3 - Laranja (difícil)
document.querySelector("#checkpoint-3").setAttribute("color", "#ff8800");

// Checkpoint 4 - Vermelho (muito difícil)
document.querySelector("#checkpoint-4").setAttribute("color", "#ff0000");

// Checkpoint 5 - Roxo (extremo)
document.querySelector("#checkpoint-5").setAttribute("color", "#ff00ff");
```

### 4. Inclinar Argolas (Mais Desafiador)

```javascript
// Checkpoint 2 - Inclinado 45°
document.querySelector("#checkpoint-2").setAttribute("rotation", "45 0 0");

// Checkpoint 3 - Vertical
document.querySelector("#checkpoint-3").setAttribute("rotation", "0 0 90");

// Checkpoint 4 - Diagonal
document.querySelector("#checkpoint-4").setAttribute("rotation", "30 45 0");
```

### 5. Animações Especiais

```javascript
// Checkpoint final com efeito especial
const finalCheckpoint = document.querySelector("#checkpoint-5");

// Pulsação
finalCheckpoint.setAttribute("animation__pulse", {
	property: "scale",
	to: "1.3 1.3 1.3",
	dir: "alternate",
	loop: true,
	dur: 800,
});

// Mudança de cor
finalCheckpoint.setAttribute("animation__color", {
	property: "color",
	from: "#00ff00",
	to: "#ff00ff",
	dir: "alternate",
	loop: true,
	dur: 2000,
});

// Rotação mais rápida
finalCheckpoint.setAttribute("animation", {
	property: "rotation",
	to: "0 360 0",
	loop: true,
	dur: 3000,
	easing: "linear",
});
```

### 6. Criar Checkpoint Dinâmico

```javascript
// Criar novo checkpoint via JavaScript
const newCheckpoint = document.createElement("a-torus");
newCheckpoint.setAttribute("id", "checkpoint-6");
newCheckpoint.setAttribute("position", "0 8 -90");
newCheckpoint.setAttribute("radius", 3);
newCheckpoint.setAttribute("radius-tubular", 0.3);
newCheckpoint.setAttribute("color", "#00ffff");
newCheckpoint.setAttribute("material", {
	transparent: true,
	opacity: 0.6,
	emissive: "#00ffff",
	emissiveIntensity: 0.4,
});
newCheckpoint.setAttribute("animation", {
	property: "rotation",
	to: "0 360 0",
	loop: true,
	dur: 8000,
	easing: "linear",
});
newCheckpoint.setAttribute("checkpoint", {
	id: 6,
	nextCheckpoint: "finish",
});

// Adicionar à cena
document.querySelector("a-scene").appendChild(newCheckpoint);
```

### 7. Sistema de Dificuldade Progressiva

```javascript
function setDifficulty(level) {
	const checkpoints = document.querySelectorAll('[id^="checkpoint-"]');

	switch (level) {
		case "easy":
			checkpoints.forEach((cp) => {
				cp.setAttribute("radius", 5);
				cp.setAttribute("color", "#00ff00");
			});
			break;

		case "medium":
			checkpoints.forEach((cp) => {
				cp.setAttribute("radius", 3);
				cp.setAttribute("color", "#ffff00");
			});
			break;

		case "hard":
			checkpoints.forEach((cp) => {
				cp.setAttribute("radius", 2);
				cp.setAttribute("color", "#ff6600");
				// Inclinar aleatoriamente
				const rx = Math.random() * 60 - 30;
				const rz = Math.random() * 60 - 30;
				cp.setAttribute("rotation", `${rx} 0 ${rz}`);
			});
			break;

		case "extreme":
			checkpoints.forEach((cp) => {
				cp.setAttribute("radius", 1.5);
				cp.setAttribute("radius-tubular", 0.15);
				cp.setAttribute("color", "#ff0000");
				// Rotação complexa
				const rx = Math.random() * 90 - 45;
				const ry = Math.random() * 90 - 45;
				const rz = Math.random() * 90 - 45;
				cp.setAttribute("rotation", `${rx} ${ry} ${rz}`);
			});
			break;
	}
}

// Usar:
setDifficulty("hard");
```

## 📊 Propriedades Disponíveis

### Geometria

| Propriedade        | Tipo   | Descrição                       | Padrão |
| ------------------ | ------ | ------------------------------- | ------ |
| `radius`           | number | Raio da argola                  | 3      |
| `radius-tubular`   | number | Espessura do tubo               | 0.3    |
| `segments-radial`  | number | Segmentos radiais (qualidade)   | 16     |
| `segments-tubular` | number | Segmentos tubulares (qualidade) | 32     |

### Material

| Propriedade         | Tipo    | Descrição             | Padrão  |
| ------------------- | ------- | --------------------- | ------- |
| `color`             | color   | Cor base              | #00ff00 |
| `transparent`       | boolean | Transparência ativa   | true    |
| `opacity`           | number  | Opacidade (0-1)       | 0.6     |
| `emissive`          | color   | Cor emissiva (brilho) | #00ff00 |
| `emissiveIntensity` | number  | Intensidade do brilho | 0.4     |
| `metalness`         | number  | Metalicidade (0-1)    | 0       |
| `roughness`         | number  | Rugosidade (0-1)      | 1       |

### Transformação

| Propriedade | Tipo | Descrição             | Exemplo   |
| ----------- | ---- | --------------------- | --------- |
| `position`  | vec3 | Posição X Y Z         | "0 3 -15" |
| `rotation`  | vec3 | Rotação X Y Z (graus) | "0 0 0"   |
| `scale`     | vec3 | Escala X Y Z          | "1 1 1"   |

## 🎮 Atalhos Úteis

### Console do Navegador (F12)

```javascript
// Listar todos os checkpoints
document.querySelectorAll('[id^="checkpoint-"]');

// Pegar checkpoint específico
const cp1 = document.querySelector("#checkpoint-1");

// Ver propriedades atuais
cp1.getAttribute("position");
cp1.getAttribute("radius");
cp1.getAttribute("color");

// Modificar em tempo real
cp1.setAttribute("color", "#ff0000");
```

## 📝 Notas Importantes

-   ✅ Cada checkpoint tem ID único para fácil acesso
-   ✅ Propriedades podem ser modificadas em tempo real
-   ✅ Animações podem ser adicionadas/removidas dinamicamente
-   ✅ Sistema de checkpoint detecta passagem automaticamente
-   ⚠️ Aumentar `segments-radial` e `segments-tubular` melhora qualidade mas reduz performance
-   ⚠️ Manter `opacity` entre 0.5-0.8 para melhor visibilidade

## 🚀 Próximos Passos

1. Criar sistema de dificuldade com botões
2. Adicionar editor visual de checkpoints
3. Salvar configurações personalizadas
4. Criar percursos pré-definidos
5. Adicionar efeitos de partículas ao passar

---

**Agora você pode manipular cada argola individualmente!** 🎯✨
