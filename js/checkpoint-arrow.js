/**
 * Sistema de Setas de Navegação para Checkpoints
 * Setas estilo GPS que apontam para o próximo objetivo
 */

AFRAME.registerComponent("checkpoint-arrow", {
	schema: {
		targetCheckpointId: { type: "number", default: 2 },
		arrowColor: { type: "color", default: "#00ff00" },
		arrowSize: { type: "number", default: 1.5 },
		offsetY: { type: "number", default: 0 },
	},

	init: function () {
		console.log(
			`🎯 Criando seta para checkpoint ${this.data.targetCheckpointId}...`
		);

		this.arrow = null;
		this.targetCheckpoint = null;

		// Aguardar cena carregar
		if (this.el.sceneEl.hasLoaded) {
			this.createArrow();
		} else {
			this.el.sceneEl.addEventListener("loaded", () => {
				this.createArrow();
			});
		}
	},

	createArrow: function () {
		// Criar container da seta
		this.arrow = document.createElement("a-entity");
		this.arrow.setAttribute(
			"id",
			`arrow-to-${this.data.targetCheckpointId}`
		);

		const checkpointPos = this.el.getAttribute("position");

		// Posicionar seta acima do checkpoint
		this.arrow.setAttribute("position", {
			x: checkpointPos.x,
			y: checkpointPos.y + this.data.offsetY,
			z: checkpointPos.z,
		});

		// Criar corpo da seta (cilindro)
		const arrowBody = document.createElement("a-cylinder");
		arrowBody.setAttribute("geometry", {
			radius: 0.15 * this.data.arrowSize,
			height: 2 * this.data.arrowSize,
		});
		arrowBody.setAttribute("material", {
			color: this.data.arrowColor,
			emissive: this.data.arrowColor,
			emissiveIntensity: 0.5,
			metalness: 0.3,
			roughness: 0.7,
		});
		arrowBody.setAttribute("position", "0 0 0");
		arrowBody.setAttribute("rotation", "0 0 0");

		// Criar ponta da seta (cone)
		const arrowHead = document.createElement("a-cone");
		arrowHead.setAttribute("geometry", {
			radiusBottom: 0.4 * this.data.arrowSize,
			radiusTop: 0,
			height: 0.8 * this.data.arrowSize,
		});
		arrowHead.setAttribute("material", {
			color: this.data.arrowColor,
			emissive: this.data.arrowColor,
			emissiveIntensity: 0.6,
			metalness: 0.3,
			roughness: 0.7,
		});
		arrowHead.setAttribute("position", `0 ${1.4 * this.data.arrowSize} 0`);
		arrowHead.setAttribute("rotation", "0 0 0");

		// Adicionar componentes à seta
		this.arrow.appendChild(arrowBody);
		this.arrow.appendChild(arrowHead);

		// Adicionar seta à cena
		this.el.sceneEl.appendChild(this.arrow);

		// Buscar checkpoint alvo
		this.findTargetCheckpoint();

		// Animação sutil de pulso
		this.arrow.setAttribute("animation__pulse", {
			property: "scale",
			from: "1 1 1",
			to: "1 1.1 1",
			dur: 1500,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		// Animação sutil de brilho
		arrowBody.setAttribute("animation__glow", {
			property: "material.emissiveIntensity",
			from: 0.5,
			to: 0.8,
			dur: 2000,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		arrowHead.setAttribute("animation__glow", {
			property: "material.emissiveIntensity",
			from: 0.6,
			to: 0.9,
			dur: 2000,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		console.log(
			`✅ Seta criada apontando para checkpoint ${this.data.targetCheckpointId}`
		);
	},

	findTargetCheckpoint: function () {
		// Buscar checkpoint alvo
		const checkpoints = document.querySelectorAll("[checkpoint]");

		checkpoints.forEach((cp) => {
			const cpComponent = cp.components.checkpoint;
			if (
				cpComponent &&
				cpComponent.data.id === this.data.targetCheckpointId
			) {
				this.targetCheckpoint = cp;
				console.log(
					`🎯 Checkpoint alvo encontrado: ${this.data.targetCheckpointId}`
				);
			}
		});

		if (this.targetCheckpoint) {
			this.updateArrowDirection();
		}
	},

	tick: function () {
		if (this.arrow && this.targetCheckpoint) {
			this.updateArrowDirection();
		}
	},

	updateArrowDirection: function () {
		const currentPos = this.el.getAttribute("position");
		const targetPos = this.targetCheckpoint.getAttribute("position");

		// Calcular direção
		const dx = targetPos.x - currentPos.x;
		const dy = targetPos.y - currentPos.y;
		const dz = targetPos.z - currentPos.z;

		// Calcular ângulo de rotação (yaw)
		const angleY = Math.atan2(dx, dz) * (180 / Math.PI);

		// Calcular ângulo de inclinação (pitch)
		const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
		const angleX = Math.atan2(dy, horizontalDistance) * (180 / Math.PI);

		// Aplicar rotação à seta
		this.arrow.setAttribute("rotation", {
			x: -angleX,
			y: angleY,
			z: 0,
		});
	},

	remove: function () {
		if (this.arrow && this.arrow.parentNode) {
			this.arrow.parentNode.removeChild(this.arrow);
		}
	},
});

console.log("📦 Módulo checkpoint-arrow.js carregado com sucesso!");
