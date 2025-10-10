/**
 * HUD Controller - Sistema Centralizado de HUD para Drone VR
 * Controle unificado do HUD com hud-01.svg transparente
 */

if (!AFRAME.components["hud-controller"]) {
	AFRAME.registerComponent("hud-controller", {
		schema: {
			enabled: { type: "boolean", default: true },
			transparency: { type: "number", default: 1.0 }, // Totalmente transparente
			hudWidth: { type: "number", default: 3.5 },
			hudHeight: { type: "number", default: 2.5 },
			hudDistance: { type: "number", default: 2.0 },
			parallaxIntensity: { type: "number", default: 0.03 },
			smoothingFactor: { type: "number", default: 0.1 },
		},

		init: function () {
			console.log("🎯 Inicializando HUD Controller Centralizado...");

			this.setupHUDData();
			this.setupParallax();
			this.setupKeyboardControls();

			// Aguardar carregamento da cena
			setTimeout(() => {
				this.createHUD();
				this.startUpdateLoop();
			}, 500);

			console.log("✅ HUD Controller inicializado!");
		},

		setupHUDData: function () {
			this.hudData = {
				speed: 0,
				altitude: 0,
				battery: 100,
				mode: "CINEMATOGRÁFICO",
				objective: "CHECKPOINT 1",
				distance: 120,
				coordinates: { x: 0, y: 0, z: 0 },
			};

			this.hudElements = {};
			this.startTime = Date.now();
		},

		setupParallax: function () {
			this.parallax = {
				lastDronePosition: { x: 0, y: 0, z: 0 },
				currentOffset: { x: 0, y: 0, z: 0 },
				targetOffset: { x: 0, y: 0, z: 0 },
				basePosition: { x: 0, y: 0, z: -this.data.hudDistance },
			};
		},

		setupKeyboardControls: function () {
			console.log("🎮 Configurando controles do HUD...");

			document.addEventListener("keydown", (evt) => {
				switch (evt.key.toLowerCase()) {
					case "h":
						this.toggleHUD();
						break;
					case "u":
						this.cycleTransparency();
						break;
					case "k":
						this.reloadHUD();
						break;
					case "+":
					case "=":
						this.changeHUDSize(0.1);
						break;
					case "-":
					case "_":
						this.changeHUDSize(-0.1);
						break;
					case "0":
						this.resetHUD();
						break;
				}
			});
		},

		createHUD: function () {
			console.log("🏗️ Criando HUD totalmente transparente...");

			// Container principal
			this.hudContainer = document.createElement("a-entity");
			this.hudContainer.setAttribute("id", "hud-container");
			this.hudContainer.setAttribute(
				"position",
				`${this.parallax.basePosition.x} ${this.parallax.basePosition.y} ${this.parallax.basePosition.z}`
			);

			// HUD SVG - SEM FUNDO
			this.createTransparentHUD();

			// Dados dinâmicos
			this.createDataElements();

			// Adicionar à câmera
			this.el.appendChild(this.hudContainer);

			console.log("✅ HUD transparente criado!");
		},

		createTransparentHUD: function () {
			const hudPlane = document.createElement("a-plane");
			hudPlane.setAttribute("width", this.data.hudWidth);
			hudPlane.setAttribute("height", this.data.hudHeight);
			hudPlane.setAttribute("position", "0 0 0");

			// Material totalmente transparente - APENAS as linhas do SVG
			const timestamp = Date.now();
			hudPlane.setAttribute("material", {
				src: `assets/hud-01.svg?v=${timestamp}`,
				transparent: true,
				opacity: this.data.transparency,
				alphaTest: 0.01, // Muito baixo para manter apenas as linhas
				color: "#ffffff",
				shader: "flat",
				side: "front",
			});

			this.hudContainer.appendChild(hudPlane);
			this.hudElements.hudPlane = hudPlane;

			console.log("🎯 HUD SVG carregado sem fundo");
		},

		createDataElements: function () {
			// Velocidade (KM/H)
			this.hudElements.speedText = this.createTextElement({
				id: "speed-text",
				value: "96",
				position: "-1.2 0.4 0.01",
				scale: "0.7 0.7 0.7",
			});

			// Bateria (%)
			this.hudElements.batteryText = this.createTextElement({
				id: "battery-text",
				value: "87%",
				position: "1.2 0.4 0.01",
				scale: "0.6 0.6 0.6",
			});

			// Altitude (metros)
			this.hudElements.altitudeText = this.createTextElement({
				id: "altitude-text",
				value: "450",
				position: "-1.2 -0.4 0.01",
				scale: "0.7 0.7 0.7",
			});

			// Distância para objetivo
			this.hudElements.distanceText = this.createTextElement({
				id: "distance-text",
				value: "120M",
				position: "1.2 -0.2 0.01",
				scale: "0.5 0.5 0.5",
			});

			// Modo de voo
			this.hudElements.modeText = this.createTextElement({
				id: "mode-text",
				value: "CINEMATIC",
				position: "-0.5 -0.8 0.01",
				scale: "0.4 0.4 0.4",
			});

			// Objetivo atual
			this.hudElements.objectiveText = this.createTextElement({
				id: "objective-text",
				value: "CHECKPOINT 1",
				position: "0.5 -0.6 0.01",
				scale: "0.4 0.4 0.4",
			});

			// Coordenadas GPS
			this.hudElements.coordsText = this.createTextElement({
				id: "coords-text",
				value: "X:0 Y:450 Z:0",
				position: "0.5 1.0 0.01",
				scale: "0.3 0.3 0.3",
			});

			// Tempo de missão
			this.hudElements.timeText = this.createTextElement({
				id: "time-text",
				value: "02:34",
				position: "0 1.0 0.01",
				scale: "0.3 0.3 0.3",
			});

			// Indicador central
			this.createCenterIndicator();
		},

		createTextElement: function (config) {
			const textElement = document.createElement("a-text");
			textElement.setAttribute("id", config.id);
			textElement.setAttribute("value", config.value);
			textElement.setAttribute("position", config.position);
			textElement.setAttribute("align", "center");
			textElement.setAttribute("color", "#ffffff");
			textElement.setAttribute("scale", config.scale);
			textElement.setAttribute("font", "monospace");

			this.hudContainer.appendChild(textElement);
			return textElement;
		},

		createCenterIndicator: function () {
			const indicator = document.createElement("a-circle");
			indicator.setAttribute("id", "center-indicator");
			indicator.setAttribute("radius", "0.02");
			indicator.setAttribute("position", "0 0 0.02");
			indicator.setAttribute("material", {
				color: "#ffff00",
				transparent: true,
				opacity: 0.8,
			});
			indicator.setAttribute("animation", {
				property: "material.opacity",
				to: "0.3",
				dur: 2000,
				dir: "alternate",
				loop: true,
			});

			this.hudContainer.appendChild(indicator);
			this.hudElements.centerIndicator = indicator;
		},

		startUpdateLoop: function () {
			this.updateHUD();
		},

		updateHUD: function () {
			if (!this.data.enabled) return;

			this.updateDroneData();
			this.updateParallax();
			this.updateVisualElements();

			requestAnimationFrame(() => this.updateHUD());
		},

		updateDroneData: function () {
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const position = drone.getAttribute("position");
			const droneController = drone.components["drone-controller"];

			// Atualizar coordenadas
			this.hudData.coordinates = {
				x: Math.round(position.x),
				y: Math.round(position.y),
				z: Math.round(position.z),
			};

			// Atualizar velocidade
			if (droneController && droneController.velocity) {
				this.hudData.speed = Math.round(
					droneController.velocity.length() * 3.6
				);
			}

			// Atualizar altitude
			this.hudData.altitude = Math.round(position.y);

			// Simular bateria
			const flightTime = (Date.now() - this.startTime) / 1000;
			this.hudData.battery = Math.max(
				10,
				100 - Math.floor(flightTime / 10)
			);

			// Atualizar modo de voo
			if (droneController) {
				if (droneController.cinematicMode?.enabled) {
					this.hudData.mode = "CINEMATIC";
				} else if (droneController.fpvMode?.enabled) {
					this.hudData.mode = "FPV/SPORT";
				} else {
					this.hudData.mode = "NORMAL";
				}
			}

			// Calcular distância para checkpoint
			this.calculateDistanceToCheckpoint();
		},

		updateParallax: function () {
			const drone = document.querySelector("#drone");
			if (!drone || !this.hudContainer) return;

			const dronePos = drone.getAttribute("position");

			// Calcular movimento do drone
			const deltaX = dronePos.x - this.parallax.lastDronePosition.x;
			const deltaY = dronePos.y - this.parallax.lastDronePosition.y;
			const deltaZ = dronePos.z - this.parallax.lastDronePosition.z;

			// Aplicar paralaxe sutil
			this.parallax.targetOffset.x +=
				deltaX * this.data.parallaxIntensity;
			this.parallax.targetOffset.y +=
				deltaY * this.data.parallaxIntensity * 0.5;
			this.parallax.targetOffset.z +=
				deltaZ * this.data.parallaxIntensity * 0.3;

			// Suavizar movimento
			this.parallax.currentOffset.x +=
				(this.parallax.targetOffset.x - this.parallax.currentOffset.x) *
				this.data.smoothingFactor;
			this.parallax.currentOffset.y +=
				(this.parallax.targetOffset.y - this.parallax.currentOffset.y) *
				this.data.smoothingFactor;
			this.parallax.currentOffset.z +=
				(this.parallax.targetOffset.z - this.parallax.currentOffset.z) *
				this.data.smoothingFactor;

			// Limitar movimento
			const maxOffset = 0.1;
			this.parallax.currentOffset.x = Math.max(
				-maxOffset,
				Math.min(maxOffset, this.parallax.currentOffset.x)
			);
			this.parallax.currentOffset.y = Math.max(
				-maxOffset,
				Math.min(maxOffset, this.parallax.currentOffset.y)
			);
			this.parallax.currentOffset.z = Math.max(
				-maxOffset,
				Math.min(maxOffset, this.parallax.currentOffset.z)
			);

			// Aplicar nova posição
			const newPosition = {
				x: this.parallax.basePosition.x + this.parallax.currentOffset.x,
				y: this.parallax.basePosition.y + this.parallax.currentOffset.y,
				z: this.parallax.basePosition.z + this.parallax.currentOffset.z,
			};

			this.hudContainer.setAttribute("position", newPosition);
			this.parallax.lastDronePosition = { ...dronePos };
		},

		updateVisualElements: function () {
			// Atualizar todos os elementos de texto
			if (this.hudElements.speedText) {
				this.hudElements.speedText.setAttribute(
					"value",
					this.hudData.speed.toString()
				);
			}

			if (this.hudElements.batteryText) {
				this.hudElements.batteryText.setAttribute(
					"value",
					`${this.hudData.battery}%`
				);
				// Cor dinâmica da bateria
				const batteryColor =
					this.hudData.battery < 20
						? "#ff4444"
						: this.hudData.battery < 50
						? "#ffaa00"
						: "#ffffff";
				this.hudElements.batteryText.setAttribute(
					"color",
					batteryColor
				);
			}

			if (this.hudElements.altitudeText) {
				this.hudElements.altitudeText.setAttribute(
					"value",
					this.hudData.altitude.toString()
				);
			}

			if (this.hudElements.distanceText) {
				this.hudElements.distanceText.setAttribute(
					"value",
					`${this.hudData.distance}M`
				);
			}

			if (this.hudElements.modeText) {
				this.hudElements.modeText.setAttribute(
					"value",
					this.hudData.mode
				);
			}

			if (this.hudElements.objectiveText) {
				this.hudElements.objectiveText.setAttribute(
					"value",
					this.hudData.objective
				);
			}

			if (this.hudElements.coordsText) {
				this.hudElements.coordsText.setAttribute(
					"value",
					`X:${this.hudData.coordinates.x} Y:${this.hudData.coordinates.y} Z:${this.hudData.coordinates.z}`
				);
			}

			if (this.hudElements.timeText) {
				const flightTime = Math.floor(
					(Date.now() - this.startTime) / 1000
				);
				const minutes = Math.floor(flightTime / 60);
				const seconds = flightTime % 60;
				this.hudElements.timeText.setAttribute(
					"value",
					`${minutes.toString().padStart(2, "0")}:${seconds
						.toString()
						.padStart(2, "0")}`
				);
			}
		},

		calculateDistanceToCheckpoint: function () {
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const dronePos = drone.getAttribute("position");
			const checkpoints = document.querySelectorAll("[checkpoint]");

			let nearestDistance = 999;
			checkpoints.forEach((checkpoint) => {
				const checkpointPos = checkpoint.getAttribute("position");
				const distance = Math.sqrt(
					Math.pow(dronePos.x - checkpointPos.x, 2) +
						Math.pow(dronePos.y - checkpointPos.y, 2) +
						Math.pow(dronePos.z - checkpointPos.z, 2)
				);
				if (distance < nearestDistance) {
					nearestDistance = distance;
				}
			});

			this.hudData.distance = Math.round(nearestDistance);
		},

		// === CONTROLES ===

		toggleHUD: function () {
			this.data.enabled = !this.data.enabled;
			if (this.hudContainer) {
				this.hudContainer.setAttribute("visible", this.data.enabled);
			}
			this.showNotification(
				this.data.enabled ? "🎯 HUD ATIVADO" : "🎯 HUD DESATIVADO"
			);
			console.log(`HUD ${this.data.enabled ? "ATIVADO" : "DESATIVADO"}`);
		},

		cycleTransparency: function () {
			const levels = [0.3, 0.5, 0.7, 0.9, 1.0];
			const currentIndex = levels.indexOf(this.data.transparency);
			const nextIndex = (currentIndex + 1) % levels.length;
			this.data.transparency = levels[nextIndex];

			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute(
					"material.opacity",
					this.data.transparency
				);
			}

			const percentage = Math.round(this.data.transparency * 100);
			this.showNotification(`🔍 TRANSPARÊNCIA: ${percentage}%`);
			console.log(`Transparência: ${percentage}%`);
		},

		reloadHUD: function () {
			console.log("🔄 Recarregando HUD...");

			if (this.hudContainer) {
				this.hudContainer.parentNode.removeChild(this.hudContainer);
			}

			setTimeout(() => {
				this.createHUD();
				this.showNotification("🎯 HUD RECARREGADO!");
				console.log("✅ HUD recarregado com sucesso!");
			}, 100);
		},

		changeHUDSize: function (delta) {
			this.data.hudWidth = Math.max(
				2.0,
				Math.min(6.0, this.data.hudWidth + delta)
			);
			this.data.hudHeight = Math.max(
				1.5,
				Math.min(4.5, this.data.hudHeight + delta * 0.75)
			);

			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute(
					"width",
					this.data.hudWidth
				);
				this.hudElements.hudPlane.setAttribute(
					"height",
					this.data.hudHeight
				);
			}

			this.showNotification(
				`📏 TAMANHO: ${this.data.hudWidth.toFixed(
					1
				)}x${this.data.hudHeight.toFixed(1)}`
			);
		},

		resetHUD: function () {
			this.data.hudWidth = 3.5;
			this.data.hudHeight = 2.5;
			this.data.transparency = 1.0;
			this.data.hudDistance = 2.0;

			this.reloadHUD();
			this.showNotification("🔄 HUD RESETADO");
		},

		showNotification: function (message, duration = 2000) {
			console.log(`📢 ${message}`);

			const notification = document.createElement("a-text");
			notification.setAttribute("value", message);
			notification.setAttribute("color", "#ffffff");
			notification.setAttribute("position", "0 0.5 -1.5");
			notification.setAttribute("align", "center");
			notification.setAttribute("scale", "1.2 1.2 1.2");
			notification.setAttribute("animation__fade", {
				property: "material.opacity",
				from: 1,
				to: 0,
				dur: duration,
				delay: 500,
			});

			this.el.appendChild(notification);

			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, duration + 1000);
		},

		remove: function () {
			if (this.hudContainer && this.hudContainer.parentNode) {
				this.hudContainer.parentNode.removeChild(this.hudContainer);
			}
		},
	});

	console.log("📦 HUD Controller carregado com sucesso!");
}
