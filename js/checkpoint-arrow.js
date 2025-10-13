/**
 * Sistema de Seta de Navegação GPS para Drone
 * Seta única que segue o drone e aponta para o próximo checkpoint ativo
 */

AFRAME.registerComponent("drone-navigation-arrow", {
	schema: {
		arrowColor: { type: "color", default: "#00ff00" },
		arrowSize: { type: "number", default: 1.2 },
		offsetDistance: { type: "number", default: 3 },
		offsetHeight: { type: "number", default: 1.5 },
	},

	init: function () {
		console.log("🧭 Inicializando seta de navegação GPS...");

		this.arrow = null;
		this.arrowBody = null;
		this.arrowHead = null;
		this.currentTargetCheckpoint = null;
		this.nextCheckpointId = 1;
		this.allCheckpoints = [];

		// Aguardar cena carregar
		if (this.el.sceneEl.hasLoaded) {
			this.setup();
		} else {
			this.el.sceneEl.addEventListener("loaded", () => {
				this.setup();
			});
		}

		// Escutar eventos de checkpoint ativado
		this.el.sceneEl.addEventListener("checkpoint-reached", (evt) => {
			this.onCheckpointReached(evt.detail);
		});
	},

	setup: function () {
		// Buscar todos os checkpoints
		this.findAllCheckpoints();

		// Criar seta
		this.createArrow();

		// Definir primeiro alvo
		this.updateTarget();

		console.log("✅ Seta de navegação GPS configurada!");
	},

	findAllCheckpoints: function () {
		const checkpoints = document.querySelectorAll("[checkpoint]");

		checkpoints.forEach((cp) => {
			const cpComponent = cp.components.checkpoint;
			if (cpComponent) {
				this.allCheckpoints.push({
					id: cpComponent.data.id,
					element: cp,
					activated: false,
				});
			}
		});

		// Ordenar por ID
		this.allCheckpoints.sort((a, b) => a.id - b.id);

		console.log(`📍 ${this.allCheckpoints.length} checkpoints encontrados`);
	},

	createArrow: function () {
		// Container da seta
		this.arrow = document.createElement("a-entity");
		this.arrow.setAttribute("id", "gps-navigation-arrow");

		// Criar corpo da seta (cilindro)
		this.arrowBody = document.createElement("a-cylinder");
		this.arrowBody.setAttribute("geometry", {
			radius: 0.12 * this.data.arrowSize,
			height: 1.8 * this.data.arrowSize,
		});
		this.arrowBody.setAttribute("material", {
			color: this.data.arrowColor,
			emissive: this.data.arrowColor,
			emissiveIntensity: 0.6,
			metalness: 0.4,
			roughness: 0.6,
		});
		this.arrowBody.setAttribute("position", "0 0 0");

		// Criar ponta da seta (cone)
		this.arrowHead = document.createElement("a-cone");
		this.arrowHead.setAttribute("geometry", {
			radiusBottom: 0.35 * this.data.arrowSize,
			radiusTop: 0,
			height: 0.7 * this.data.arrowSize,
		});
		this.arrowHead.setAttribute("material", {
			color: this.data.arrowColor,
			emissive: this.data.arrowColor,
			emissiveIntensity: 0.7,
			metalness: 0.4,
			roughness: 0.6,
		});
		this.arrowHead.setAttribute(
			"position",
			`0 ${1.25 * this.data.arrowSize} 0`
		);

		// Adicionar componentes à seta
		this.arrow.appendChild(this.arrowBody);
		this.arrow.appendChild(this.arrowHead);

		// Adicionar seta à cena
		this.el.sceneEl.appendChild(this.arrow);

		// Animação sutil de pulso
		this.arrow.setAttribute("animation__pulse", {
			property: "scale",
			from: "1 1 1",
			to: "1 1.08 1",
			dur: 1200,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		// Animação sutil de brilho no corpo
		this.arrowBody.setAttribute("animation__glow", {
			property: "material.emissiveIntensity",
			from: 0.6,
			to: 0.9,
			dur: 1800,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		// Animação sutil de brilho na ponta
		this.arrowHead.setAttribute("animation__glow", {
			property: "material.emissiveIntensity",
			from: 0.7,
			to: 1.0,
			dur: 1800,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		console.log("🎯 Seta GPS criada");
	},

	updateTarget: function () {
		// Buscar próximo checkpoint não ativado
		const nextCheckpoint = this.allCheckpoints.find((cp) => !cp.activated);

		if (nextCheckpoint) {
			this.currentTargetCheckpoint = nextCheckpoint.element;
			this.nextCheckpointId = nextCheckpoint.id;
			console.log(`🎯 Novo alvo: Checkpoint ${this.nextCheckpointId}`);
		} else {
			// Todos os checkpoints foram ativados
			this.currentTargetCheckpoint = null;
			console.log("🏁 Todos os checkpoints completados!");

			// Ocultar seta
			if (this.arrow) {
				this.arrow.setAttribute("visible", false);
			}
		}
	},

	onCheckpointReached: function (detail) {
		console.log(`✅ Checkpoint ${detail.id} alcançado!`);

		// Marcar checkpoint como ativado
		const checkpoint = this.allCheckpoints.find(
			(cp) => cp.id === detail.id
		);
		if (checkpoint) {
			checkpoint.activated = true;
		}

		// Atualizar para próximo alvo
		this.updateTarget();
	},

	tick: function () {
		if (!this.arrow || !this.currentTargetCheckpoint) return;

		// Posicionar seta próxima ao drone
		this.updateArrowPosition();

		// Rotacionar seta para apontar ao alvo
		this.updateArrowDirection();
	},

	updateArrowPosition: function () {
		const dronePos = this.el.object3D.position;
		const droneRot = this.el.object3D.rotation;

		// Calcular posição à frente do drone
		const offsetX = Math.sin(droneRot.y) * this.data.offsetDistance;
		const offsetZ = Math.cos(droneRot.y) * this.data.offsetDistance;

		this.arrow.object3D.position.set(
			dronePos.x + offsetX,
			dronePos.y + this.data.offsetHeight,
			dronePos.z + offsetZ
		);
	},

	updateArrowDirection: function () {
		const arrowPos = this.arrow.object3D.position;
		const targetPos = this.currentTargetCheckpoint.object3D.position;

		// Calcular direção
		const dx = targetPos.x - arrowPos.x;
		const dy = targetPos.y - arrowPos.y;
		const dz = targetPos.z - arrowPos.z;

		// Calcular ângulo de rotação (yaw)
		const angleY = Math.atan2(dx, dz);

		// Calcular ângulo de inclinação (pitch)
		const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
		const angleX = Math.atan2(dy, horizontalDistance);

		// Aplicar rotação à seta
		this.arrow.object3D.rotation.set(-angleX, angleY, 0);
	},

	remove: function () {
		if (this.arrow && this.arrow.parentNode) {
			this.arrow.parentNode.removeChild(this.arrow);
		}
	},
});

console.log("📦 Módulo drone-navigation-arrow.js carregado com sucesso!");
