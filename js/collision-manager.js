/**
 * Collision Manager - Gerenciador Central de Colisões
 * Sistema otimizado com detecção por proximidade
 * Diferenciação VR vs Desktop
 */

AFRAME.registerComponent("collision-manager", {
	schema: {
		enabled: { type: "boolean", default: true },
		proximityRadius: { type: "number", default: 30 },
		checkInterval: { type: "number", default: 50 },
		vrProximityRadius: { type: "number", default: 25 },
		vrCheckInterval: { type: "number", default: 100 },
		maxCollisionObjects: { type: "number", default: 20 },
		warningDistance: { type: "number", default: 8 },
		dangerDistance: { type: "number", default: 4 },
	},

	init: function () {
		console.log("🛡️ Inicializando Collision Manager...");

		this.drone = null;
		this.collisionObjects = [];
		this.nearbyObjects = [];
		this.isVRMode = false;
		this.lastCheckTime = 0;
		this.collisionCooldown = {};

		this.setupVRDetection();
		this.registerCollisionObjects();

		console.log("✅ Collision Manager inicializado!");
	},

	setupVRDetection: function () {
		this.el.addEventListener("enter-vr", () => {
			this.isVRMode = true;
			console.log("🥽 Modo VR ativado - Ajustando colisões");
		});

		this.el.addEventListener("exit-vr", () => {
			this.isVRMode = false;
			console.log("🖥️ Modo Desktop ativado - Ajustando colisões");
		});
	},

	registerCollisionObjects: function () {
		setTimeout(() => {
			// Buscar todos os objetos com colisão
			const models = document.querySelectorAll("[model-collision]");
			const checkpoints = document.querySelectorAll("[checkpoint]");

			models.forEach((model) => {
				this.addCollisionObject(model, "solid");
			});

			checkpoints.forEach((checkpoint) => {
				this.addCollisionObject(checkpoint, "checkpoint");
			});

			console.log(
				`📦 ${this.collisionObjects.length} objetos registrados para colisão`
			);
		}, 1000);
	},

	addCollisionObject: function (element, type) {
		if (!element) return;

		const obj = {
			element: element,
			type: type,
			position: element.getAttribute("position"),
			lastCollisionTime: 0,
			isNearby: false,
		};

		this.collisionObjects.push(obj);
	},

	tick: function (time, deltaTime) {
		if (!this.data.enabled) return;

		// Buscar drone
		if (!this.drone) {
			this.drone = document.querySelector("#drone");
			if (!this.drone) return;
		}

		// Verificar intervalo baseado em VR/Desktop
		const checkInterval = this.isVRMode
			? this.data.vrCheckInterval
			: this.data.checkInterval;

		if (time - this.lastCheckTime < checkInterval) return;
		this.lastCheckTime = time;

		// Atualizar objetos próximos
		this.updateNearbyObjects();

		// Verificar colisões apenas com objetos próximos
		this.checkCollisions();
	},

	updateNearbyObjects: function () {
		const dronePos = this.drone.getAttribute("position");
		const proximityRadius = this.isVRMode
			? this.data.vrProximityRadius
			: this.data.proximityRadius;

		this.nearbyObjects = [];

		this.collisionObjects.forEach((obj) => {
			const objPos = obj.element.getAttribute("position");
			const distance = this.calculateDistance(dronePos, objPos);

			obj.distance = distance;
			obj.isNearby = distance < proximityRadius;

			if (obj.isNearby) {
				this.nearbyObjects.push(obj);
			}
		});

		// Limitar número de objetos verificados
		this.nearbyObjects.sort((a, b) => a.distance - b.distance);
		this.nearbyObjects = this.nearbyObjects.slice(
			0,
			this.data.maxCollisionObjects
		);
	},

	checkCollisions: function () {
		let closestDistance = 999;
		let hasWarning = false;
		let hasDanger = false;

		this.nearbyObjects.forEach((obj) => {
			const distance = obj.distance;

			if (distance < closestDistance) {
				closestDistance = distance;
			}

			// Verificar zona de perigo
			if (distance < this.data.dangerDistance) {
				hasDanger = true;
				this.handleDangerZone(obj);
			}
			// Verificar zona de aviso
			else if (distance < this.data.warningDistance) {
				hasWarning = true;
				this.handleWarningZone(obj);
			}
		});

		// Log de debug a cada 2 segundos
		const now = Date.now();
		if (!this.lastDebugLog || now - this.lastDebugLog > 2000) {
			if (this.nearbyObjects.length > 0) {
				console.log(
					`📍 Distância mais próxima: ${closestDistance.toFixed(
						1
					)}m | Objetos próximos: ${this.nearbyObjects.length}`
				);
			}
			this.lastDebugLog = now;
		}

		// Emitir estado baseado na distância mais próxima
		if (hasDanger) {
			// Já emitido em handleDangerZone
		} else if (hasWarning) {
			// Já emitido em handleWarningZone
		} else {
			// Estado seguro - emitir sempre
			this.el.emit("collision-safe", {
				distance: closestDistance,
			});
		}
	},

	handleDangerZone: function (obj) {
		const now = Date.now();
		const cooldownKey = obj.element.id || "unknown";

		// Cooldown de 100ms entre colisões do mesmo objeto
		if (
			this.collisionCooldown[cooldownKey] &&
			now - this.collisionCooldown[cooldownKey] < 100
		) {
			return;
		}

		this.collisionCooldown[cooldownKey] = now;

		// Emitir evento de colisão
		this.el.emit("collision-danger", {
			object: obj.element,
			type: obj.type,
			distance: obj.distance,
			position: obj.element.getAttribute("position"),
		});

		console.log(`💥 Colisão perigosa com ${obj.element.id || "objeto"}`);
	},

	handleWarningZone: function (obj) {
		// Emitir evento de proximidade
		this.el.emit("collision-warning", {
			object: obj.element,
			type: obj.type,
			distance: obj.distance,
			position: obj.element.getAttribute("position"),
		});
	},

	calculateDistance: function (pos1, pos2) {
		const dx = pos1.x - pos2.x;
		const dy = pos1.y - pos2.y;
		const dz = pos1.z - pos2.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	},

	getNearbyObjects: function () {
		return this.nearbyObjects;
	},

	getCollisionObjects: function () {
		return this.collisionObjects;
	},
});

console.log("📦 Collision Manager carregado!");
