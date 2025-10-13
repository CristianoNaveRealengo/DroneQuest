/**
 * Sistema de Colisão para Modelos 3D
 * Adiciona barreiras invisíveis ao redor de modelos GLB
 */

AFRAME.registerComponent("model-collision", {
	schema: {
		type: { type: "string", default: "box" }, // box, sphere, cylinder
		width: { type: "number", default: 5 },
		height: { type: "number", default: 3 },
		depth: { type: "number", default: 5 },
		radius: { type: "number", default: 3 },
		offsetX: { type: "number", default: 0 },
		offsetY: { type: "number", default: 0 },
		offsetZ: { type: "number", default: 0 },
		visible: { type: "boolean", default: false }, // Para debug
		bounceForce: { type: "number", default: 0.5 },
	},

	init: function () {
		console.log(
			`🛡️ Criando colisão para modelo: ${this.el.id || "sem-id"}`
		);

		this.collisionBox = null;
		this.drone = null;
		this.lastDronePosition = { x: 0, y: 0, z: 0 };

		// Aguardar modelo carregar
		if (this.el.hasLoaded) {
			this.createCollisionBox();
		} else {
			this.el.addEventListener("model-loaded", () => {
				this.createCollisionBox();
			});
		}
	},

	createCollisionBox: function () {
		// Criar entidade de colisão
		this.collisionBox = document.createElement("a-entity");
		this.collisionBox.setAttribute(
			"id",
			`collision-${this.el.id || "model"}`
		);

		// Definir geometria baseada no tipo
		let geometry = {};
		switch (this.data.type) {
			case "box":
				geometry = {
					primitive: "box",
					width: this.data.width,
					height: this.data.height,
					depth: this.data.depth,
				};
				break;
			case "sphere":
				geometry = {
					primitive: "sphere",
					radius: this.data.radius,
				};
				break;
			case "cylinder":
				geometry = {
					primitive: "cylinder",
					radius: this.data.radius,
					height: this.data.height,
				};
				break;
		}

		this.collisionBox.setAttribute("geometry", geometry);

		// Material invisível (ou visível para debug)
		this.collisionBox.setAttribute("material", {
			color: "#ff0000",
			transparent: true,
			opacity: this.data.visible ? 0.3 : 0,
			wireframe: this.data.visible,
		});

		// Posicionar com offset
		this.collisionBox.setAttribute("position", {
			x: this.data.offsetX,
			y: this.data.offsetY,
			z: this.data.offsetZ,
		});

		// Adicionar como filho do modelo
		this.el.appendChild(this.collisionBox);

		console.log(
			`✅ Colisão criada: ${this.data.type} (${this.data.width}x${this.data.height}x${this.data.depth})`
		);
	},

	tick: function () {
		if (!this.collisionBox) return;

		// Buscar drone
		if (!this.drone) {
			this.drone = document.querySelector("#drone");
			if (!this.drone) return;
		}

		// Otimização: verificar apenas a cada 3 frames
		if (!this.frameCount) this.frameCount = 0;
		this.frameCount++;
		if (this.frameCount % 3 !== 0) return;

		// Verificar colisão
		this.checkCollision();
	},

	checkCollision: function () {
		const dronePos = this.drone.object3D.position;
		const collisionPos = this.collisionBox.object3D.getWorldPosition(
			new THREE.Vector3()
		);

		// Salvar posição anterior
		if (!this.lastDronePosition.x) {
			this.lastDronePosition = {
				x: dronePos.x,
				y: dronePos.y,
				z: dronePos.z,
			};
		}

		// Calcular distância
		const dx = dronePos.x - collisionPos.x;
		const dy = dronePos.y - collisionPos.y;
		const dz = dronePos.z - collisionPos.z;
		const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

		let isColliding = false;

		// Verificar colisão baseada no tipo
		switch (this.data.type) {
			case "box":
				isColliding = this.checkBoxCollision(dx, dy, dz);
				break;
			case "sphere":
				isColliding = this.checkSphereCollision(dx, dy, dz);
				break;
			case "cylinder":
				isColliding = this.checkCylinderCollision(dx, dy, dz);
				break;
		}

		// DEBUG TEMPORÁRIO
		if (distance < 15 && this.el.id === "Quadra") {
			console.log(
				`🔍 Quadra - Dist: ${distance.toFixed(
					1
				)}m | Colidindo: ${isColliding}`,
				{
					drone: `(${dronePos.x.toFixed(1)}, ${dronePos.y.toFixed(
						1
					)}, ${dronePos.z.toFixed(1)})`,
					collision: `(${collisionPos.x.toFixed(
						1
					)}, ${collisionPos.y.toFixed(1)}, ${collisionPos.z.toFixed(
						1
					)})`,
					delta: `(${dx.toFixed(1)}, ${dy.toFixed(1)}, ${dz.toFixed(
						1
					)})`,
					box: `${this.data.width}x${this.data.height}x${this.data.depth}`,
				}
			);
		}

		if (isColliding) {
			this.handleCollision(dronePos);
		}

		// Atualizar posição anterior
		this.lastDronePosition = {
			x: dronePos.x,
			y: dronePos.y,
			z: dronePos.z,
		};
	},

	checkBoxCollision: function (dx, dy, dz) {
		const halfWidth = this.data.width / 2;
		const halfHeight = this.data.height / 2;
		const halfDepth = this.data.depth / 2;

		return (
			Math.abs(dx) < halfWidth &&
			Math.abs(dy) < halfHeight &&
			Math.abs(dz) < halfDepth
		);
	},

	checkSphereCollision: function (dx, dy, dz) {
		const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
		return distance < this.data.radius + 0.5; // 0.5 = raio aproximado do drone
	},

	checkCylinderCollision: function (dx, dy, dz) {
		const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
		const halfHeight = this.data.height / 2;

		return (
			horizontalDistance < this.data.radius && Math.abs(dy) < halfHeight
		);
	},

	handleCollision: function (dronePos) {
		console.log("💥 Colisão detectada!");

		// Empurrar drone de volta para posição anterior
		const pushBackX =
			this.lastDronePosition.x +
			(this.lastDronePosition.x - dronePos.x) * this.data.bounceForce;
		const pushBackY =
			this.lastDronePosition.y +
			(this.lastDronePosition.y - dronePos.y) * this.data.bounceForce;
		const pushBackZ =
			this.lastDronePosition.z +
			(this.lastDronePosition.z - dronePos.z) * this.data.bounceForce;

		dronePos.set(pushBackX, pushBackY, pushBackZ);

		// Reduzir velocidade do drone
		this.reduceVelocity();

		// Emitir evento de colisão
		this.el.sceneEl.emit("model-collision", {
			model: this.el.id,
			position: dronePos,
		});

		// Emitir evento para collision manager
		this.el.sceneEl.emit("collision-danger", {
			object: this.el,
			type: "solid",
			distance: 0,
			position: this.el.getAttribute("position"),
		});

		// Feedback visual (piscar vermelho)
		if (this.data.visible) {
			this.collisionBox.setAttribute("material", "opacity", 0.6);
			setTimeout(() => {
				this.collisionBox.setAttribute("material", "opacity", 0.3);
			}, 100);
		}
	},

	reduceVelocity: function () {
		// Reduzir velocidade do drone controller
		const drone = document.querySelector("#drone");
		if (!drone) return;

		const droneController = drone.components["drone-controller"];
		if (!droneController || !droneController.velocity) return;

		// Reduzir velocidade em 70%
		droneController.velocity.multiplyScalar(0.3);

		console.log("🐌 Velocidade reduzida por colisão");
	},

	remove: function () {
		if (this.collisionBox && this.collisionBox.parentNode) {
			this.collisionBox.parentNode.removeChild(this.collisionBox);
		}
	},
});

// Componente auxiliar para debug de colisões
AFRAME.registerComponent("show-collision-boxes", {
	init: function () {
		console.log("🔍 Modo debug de colisões ativado");

		// Tornar todas as caixas de colisão visíveis
		setTimeout(() => {
			const collisionModels =
				document.querySelectorAll("[model-collision]");
			collisionModels.forEach((model) => {
				const component = model.components["model-collision"];
				if (component && component.collisionBox) {
					component.collisionBox.setAttribute("material", {
						opacity: 0.3,
						wireframe: true,
					});
				}
			});
			console.log(
				`✅ ${collisionModels.length} caixas de colisão visíveis`
			);
		}, 2000);
	},
});

// Componente de debug simples
AFRAME.registerComponent("collision-status", {
	init: function () {
		this.statusDiv = document.createElement("div");
		this.statusDiv.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: rgba(0, 0, 0, 0.8);
			color: #00ff00;
			padding: 20px;
			border-radius: 10px;
			font-family: monospace;
			font-size: 16px;
			z-index: 3000;
			text-align: center;
			border: 2px solid #00ff00;
		`;
		document.body.appendChild(this.statusDiv);
	},

	tick: function () {
		const drone = document.querySelector("#drone");
		if (!drone) return;

		const dronePos = drone.getAttribute("position");
		const quadra = document.querySelector("#Quadra");

		if (quadra) {
			const quadraCollision = quadra.components["model-collision"];
			if (quadraCollision && quadraCollision.collisionBox) {
				const collisionPos =
					quadraCollision.collisionBox.object3D.getWorldPosition(
						new THREE.Vector3()
					);
				const distance = Math.sqrt(
					Math.pow(dronePos.x - collisionPos.x, 2) +
						Math.pow(dronePos.y - collisionPos.y, 2) +
						Math.pow(dronePos.z - collisionPos.z, 2)
				);

				const color =
					distance < 5
						? "#ff0000"
						: distance < 10
						? "#ffaa00"
						: "#00ff00";
				this.statusDiv.style.borderColor = color;
				this.statusDiv.style.color = color;

				this.statusDiv.innerHTML = `
					<div style="font-size: 20px; font-weight: bold;">SISTEMA DE COLISÃO</div>
					<div style="margin: 10px 0;">Distância da Quadra: <strong>${distance.toFixed(
						1
					)}m</strong></div>
					<div>Drone: (${dronePos.x.toFixed(1)}, ${dronePos.y.toFixed(
					1
				)}, ${dronePos.z.toFixed(1)})</div>
					<div>Caixa: (${collisionPos.x.toFixed(1)}, ${collisionPos.y.toFixed(
					1
				)}, ${collisionPos.z.toFixed(1)})</div>
					<div style="margin-top: 10px; font-size: 12px;">Voe em direção à parede vermelha (-10Z)</div>
				`;
			}
		}
	},
});

console.log("📦 Módulo model-collision.js carregado com sucesso!");
