/**
 * Sistema de HUD Futurístico Melhorado para Drone VR
 * Com dados em M/S, bateria baseada no tempo, seta GPS dinâmica
 */

if (!AFRAME.components["futuristic-hud-melhorado"]) {
	AFRAME.registerComponent("futuristic-hud-melhorado", {
		schema: {
			transparency: { type: "number", default: 0.7 },
			hudColor: { type: "color", default: "#00ffff" },
			warningColor: { type: "color", default: "#ff4444" },
			successColor: { type: "color", default: "#44ff44" },
			enabled: { type: "boolean", default: true },
			hudWidth: { type: "number", default: 4.0 },
			hudHeight: { type: "number", default: 3.0 },
			hudScale: { type: "number", default: 1.0 },
			hudDistance: { type: "number", default: 2.5 },
		},

		init: function () {
			console.log("🚀 Inicializando HUD Futurístico Melhorado...");

			// Estado do HUD
			this.hudData = {
				speedMS: 0, // Velocidade em m/s
				speedKMH: 0, // Velocidade em km/h (para cálculo)
				altitude: 0,
				batteryPercent: 100, // Baseado no tempo da missão
				gpsSignal: true,
				mode: "CINEMATOGRÁFICO",
				objective: "CHECKPOINT A",
				distanceToObjective: 120,
				temperature: 25,
				missionTime: 0, // Tempo da missão em segundos
				coordinates: { x: 0, y: 0, z: 0 },
				objectiveDirection: 0, // Ângulo para o próximo objetivo
			};

			// Referências aos elementos
			this.hudElements = {};
			this.animationFrameId = null;
			this.startTime = Date.now();
			this.missionStartTime = Date.now();

			// Configurar controles de teclado
			this.setupKeyboardControls();

			// Criar estrutura do HUD
			this.createHUDStructure();

			// Iniciar atualizações
			this.startUpdates();

			console.log("✅ HUD Futurístico Melhorado inicializado!");
			console.log("📊 Novos recursos:");
			console.log("  • Velocidade em M/S");
			console.log("  • Bateria baseada no tempo da missão");
			console.log("  • Seta GPS dinâmica para próximo objetivo");
			console.log("  • Distância para objetivo destacada");
		},

		setupKeyboardControls: function () {
			console.log("🎮 Configurando controles do HUD melhorado...");

			const self = this;
			document.addEventListener("keydown", (evt) => {
				switch (evt.key.toLowerCase()) {
					case "h":
						self.toggleHUD();
						break;
					case "u":
						self.cycleTransparency();
						break;
					case "i":
						self.cycleHUDColor();
						break;
					case "+":
					case "=":
						self.increaseHUDSize();
						break;
					case "-":
					case "_":
						self.decreaseHUDSize();
						break;
					case "0":
						self.resetHUDSize();
						break;
				}
			});
		},

		createHUDStructure: function () {
			console.log("🏗️ Criando HUD melhorado com imagem...");

			// Container principal do HUD
			this.hudContainer = document.createElement("a-entity");
			this.hudContainer.setAttribute(
				"id",
				"futuristic-hud-melhorado-container"
			);
			this.hudContainer.setAttribute(
				"position",
				`0 0 -${this.data.hudDistance}`
			);

			// Criar HUD baseado em imagem melhorada
			this.createImageBasedHUD();

			// Adicionar à câmera
			this.el.appendChild(this.hudContainer);

			console.log("✅ HUD melhorado criado!");
		},

		createImageBasedHUD: function () {
			// Plano principal com a imagem do HUD melhorado
			const hudPlane = document.createElement("a-plane");
			hudPlane.setAttribute(
				"width",
				this.data.hudWidth * this.data.hudScale
			);
			hudPlane.setAttribute(
				"height",
				this.data.hudHeight * this.data.hudScale
			);
			hudPlane.setAttribute("position", "0 0 0");
			hudPlane.setAttribute("material", {
				src: "assets/hud-overlay-melhorado.svg",
				transparent: true,
				opacity: this.data.transparency,
				alphaTest: 0.1,
			});

			this.hudContainer.appendChild(hudPlane);
			this.hudElements.hudPlane = hudPlane;

			// Criar elementos de texto dinâmicos sobrepostos
			this.createDynamicTextElements();
		},

		createDynamicTextElements: function () {
			// Velocímetro em M/S (superior esquerdo)
			const speedText = document.createElement("a-text");
			speedText.setAttribute("id", "hud-speed-ms");
			speedText.setAttribute("value", "12.5");
			speedText.setAttribute("position", "-1.4 0.6 0.01");
			speedText.setAttribute("align", "center");
			speedText.setAttribute("color", this.data.hudColor);
			speedText.setAttribute("scale", "0.8 0.8 0.8");
			// speedText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(speedText);
			this.hudElements.speedText = speedText;

			// Bateria baseada no tempo (superior direito)
			const batteryText = document.createElement("a-text");
			batteryText.setAttribute("id", "hud-battery-time");
			batteryText.setAttribute("value", "100%");
			batteryText.setAttribute("position", "1.4 0.6 0.01");
			batteryText.setAttribute("align", "center");
			batteryText.setAttribute("color", this.data.successColor);
			batteryText.setAttribute("scale", "0.6 0.6 0.6");
			// batteryText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(batteryText);
			this.hudElements.batteryText = batteryText;

			// Altímetro em metros (inferior esquerdo)
			const altitudeText = document.createElement("a-text");
			altitudeText.setAttribute("id", "hud-altitude-metros");
			altitudeText.setAttribute("value", "450");
			altitudeText.setAttribute("position", "-1.4 -0.6 0.01");
			altitudeText.setAttribute("align", "center");
			altitudeText.setAttribute("color", this.data.hudColor);
			altitudeText.setAttribute("scale", "0.8 0.8 0.8");
			// altitudeText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(altitudeText);
			this.hudElements.altitudeText = altitudeText;

			// Distância para objetivo (centro inferior esquerda)
			const distanceText = document.createElement("a-text");
			distanceText.setAttribute("id", "hud-distance-objetivo");
			distanceText.setAttribute("value", "120M");
			distanceText.setAttribute("position", "-0.6 -0.8 0.01");
			distanceText.setAttribute("align", "center");
			distanceText.setAttribute("color", "#ffaa00");
			distanceText.setAttribute("scale", "0.6 0.6 0.6");
			// distanceText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(distanceText);
			this.hudElements.distanceText = distanceText;

			// Modo de voo (centro inferior direita)
			const modeText = document.createElement("a-text");
			modeText.setAttribute("id", "hud-mode-voo");
			modeText.setAttribute("value", "CINEMATOGRÁFICO");
			modeText.setAttribute("position", "0.6 -0.8 0.01");
			modeText.setAttribute("align", "center");
			modeText.setAttribute("color", "#ff8800");
			modeText.setAttribute("scale", "0.5 0.5 0.5");
			// modeText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(modeText);
			this.hudElements.modeText = modeText;

			// Tempo da missão (superior centro)
			const missionTimeText = document.createElement("a-text");
			missionTimeText.setAttribute("id", "hud-mission-time");
			missionTimeText.setAttribute("value", "MISSÃO: 00:00");
			missionTimeText.setAttribute("position", "0 1.3 0.01");
			missionTimeText.setAttribute("align", "center");
			missionTimeText.setAttribute("color", this.data.hudColor);
			missionTimeText.setAttribute("scale", "0.25 0.25 0.25");
			// missionTimeText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(missionTimeText);
			this.hudElements.missionTimeText = missionTimeText;

			// Coordenadas (superior direita)
			const coordsText = document.createElement("a-text");
			coordsText.setAttribute("id", "hud-coords-melhorado");
			coordsText.setAttribute("value", "X:0 Y:0 Z:0");
			coordsText.setAttribute("position", "0.8 1.3 0.01");
			coordsText.setAttribute("align", "center");
			coordsText.setAttribute("color", this.data.hudColor);
			coordsText.setAttribute("scale", "0.25 0.25 0.25");
			// coordsText.setAttribute("font", "monospace"); // Removido para evitar erro 404
			this.hudContainer.appendChild(coordsText);
			this.hudElements.coordsText = coordsText;

			// Seta GPS dinâmica (será criada como elemento 3D)
			this.createGPSArrow();
		},

		createGPSArrow: function () {
			// Criar seta 3D que aponta para o próximo objetivo
			const arrowContainer = document.createElement("a-entity");
			arrowContainer.setAttribute("id", "gps-arrow-3d");
			arrowContainer.setAttribute("position", "1.4 -0.6 0.02");

			// Seta usando geometria simples
			const arrow = document.createElement("a-cone");
			arrow.setAttribute("radius-bottom", "0.03");
			arrow.setAttribute("radius-top", "0");
			arrow.setAttribute("height", "0.08");
			arrow.setAttribute("rotation", "0 0 -90");
			arrow.setAttribute("material", {
				color: this.data.successColor,
				transparent: true,
				opacity: 0.8,
			});

			arrowContainer.appendChild(arrow);
			this.hudContainer.appendChild(arrowContainer);
			this.hudElements.gpsArrow = arrowContainer;
		},

		startUpdates: function () {
			console.log("🔄 Iniciando atualizações do HUD melhorado...");
			this.updateHUD();
		},

		updateHUD: function () {
			if (!this.data.enabled) return;

			// Atualizar dados do drone
			this.updateDroneData();

			// Atualizar elementos visuais
			this.updateVisualElements();

			// Próxima atualização
			this.animationFrameId = requestAnimationFrame(() => {
				this.updateHUD();
			});
		},

		updateDroneData: function () {
			const drone = document.querySelector("#drone");
			const gameManager = document.querySelector("[game-manager]");

			if (!drone) return;

			const position = drone.getAttribute("position");
			const droneController = drone.components["drone-controller"];
			const gameComponent = gameManager?.components["game-manager"];

			// Atualizar coordenadas REAIS
			this.hudData.coordinates = {
				x: Math.round(position.x),
				y: Math.round(position.y),
				z: Math.round(position.z),
			};

			// Atualizar velocidade REAL do drone
			if (droneController && droneController.velocity) {
				const velocityVector = droneController.velocity;
				this.hudData.speedMS = velocityVector.length(); // m/s real
				this.hudData.speedKMH = this.hudData.speedMS * 3.6; // km/h para referência
			} else {
				// Fallback: calcular velocidade baseada no movimento
				if (!this.lastPosition) {
					this.lastPosition = { ...position };
					this.lastTime = Date.now();
					this.hudData.speedMS = 0;
				} else {
					const currentTime = Date.now();
					const deltaTime = (currentTime - this.lastTime) / 1000; // segundos

					if (deltaTime > 0.1) {
						// Atualizar a cada 100ms
						const deltaX = position.x - this.lastPosition.x;
						const deltaY = position.y - this.lastPosition.y;
						const deltaZ = position.z - this.lastPosition.z;

						const distance = Math.sqrt(
							deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
						);
						this.hudData.speedMS = distance / deltaTime; // m/s
						this.hudData.speedKMH = this.hudData.speedMS * 3.6;

						this.lastPosition = { ...position };
						this.lastTime = currentTime;
					}
				}
			}

			// Atualizar altitude REAL
			this.hudData.altitude = Math.round(position.y);

			// Usar tempo REAL do game manager se disponível
			if (
				gameComponent &&
				gameComponent.gameState &&
				gameComponent.gameState.isPlaying
			) {
				this.hudData.missionTime =
					gameComponent.gameState.elapsedTime / 1000; // converter ms para s

				// Calcular bateria baseada no tempo REAL da prova
				const maxMissionTime = gameComponent.data.timeLimit || 300; // usar timeLimit do jogo
				this.hudData.batteryPercent = Math.max(
					5,
					100 - (this.hudData.missionTime / maxMissionTime) * 100
				);
			} else {
				// Fallback: usar tempo próprio
				this.hudData.missionTime =
					(Date.now() - this.missionStartTime) / 1000;
				const maxMissionTime = 300;
				this.hudData.batteryPercent = Math.max(
					5,
					100 - (this.hudData.missionTime / maxMissionTime) * 100
				);
			}

			// Atualizar modo de voo REAL
			if (droneController) {
				if (droneController.cinematicMode?.enabled) {
					this.hudData.mode = "CINEMATOGRÁFICO";
				} else if (droneController.fpvMode?.enabled) {
					this.hudData.mode = "FPV/SPORT";
				} else {
					this.hudData.mode = "NORMAL";
				}
			}

			// Calcular distância e direção para próximo objetivo REAL
			this.calculateObjectiveData();
		},

		calculateObjectiveData: function () {
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const dronePos = drone.getAttribute("position");
			const checkpoints = document.querySelectorAll("[checkpoint]");

			let nearestDistance = 999;
			let nearestCheckpoint = null;

			checkpoints.forEach((checkpoint, index) => {
				const checkpointPos = checkpoint.getAttribute("position");
				const distance = Math.sqrt(
					Math.pow(dronePos.x - checkpointPos.x, 2) +
						Math.pow(dronePos.y - checkpointPos.y, 2) +
						Math.pow(dronePos.z - checkpointPos.z, 2)
				);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestCheckpoint = checkpoint;
				}
			});

			this.hudData.distanceToObjective = Math.round(nearestDistance);

			// Calcular direção para o objetivo (para a seta GPS)
			if (nearestCheckpoint) {
				const checkpointPos =
					nearestCheckpoint.getAttribute("position");
				const deltaX = checkpointPos.x - dronePos.x;
				const deltaZ = checkpointPos.z - dronePos.z;
				this.hudData.objectiveDirection =
					Math.atan2(deltaX, deltaZ) * (180 / Math.PI);
			}
		},

		updateVisualElements: function () {
			// Atualizar velocímetro em M/S
			if (this.hudElements.speedText) {
				this.hudElements.speedText.setAttribute(
					"value",
					this.hudData.speedMS.toFixed(1)
				);
			}

			// Atualizar bateria baseada no tempo
			if (this.hudElements.batteryText) {
				const batteryPercent = Math.round(this.hudData.batteryPercent);
				this.hudElements.batteryText.setAttribute(
					"value",
					`${batteryPercent}%`
				);

				// Mudar cor baseada no nível da bateria
				let batteryColor = this.data.successColor;
				if (batteryPercent < 20) {
					batteryColor = this.data.warningColor;
				} else if (batteryPercent < 50) {
					batteryColor = "#ffaa00";
				}
				this.hudElements.batteryText.setAttribute(
					"color",
					batteryColor
				);
			}

			// Atualizar altímetro
			if (this.hudElements.altitudeText) {
				this.hudElements.altitudeText.setAttribute(
					"value",
					this.hudData.altitude.toString()
				);
			}

			// Atualizar distância para objetivo
			if (this.hudElements.distanceText) {
				this.hudElements.distanceText.setAttribute(
					"value",
					`${this.hudData.distanceToObjective}M`
				);
			}

			// Atualizar modo
			if (this.hudElements.modeText) {
				this.hudElements.modeText.setAttribute(
					"value",
					this.hudData.mode
				);
			}

			// Atualizar tempo da missão
			if (this.hudElements.missionTimeText) {
				const minutes = Math.floor(this.hudData.missionTime / 60);
				const seconds = Math.floor(this.hudData.missionTime % 60);
				this.hudElements.missionTimeText.setAttribute(
					"value",
					`MISSÃO: ${minutes.toString().padStart(2, "0")}:${seconds
						.toString()
						.padStart(2, "0")}`
				);
			}

			// Atualizar coordenadas
			if (this.hudElements.coordsText) {
				this.hudElements.coordsText.setAttribute(
					"value",
					`X:${this.hudData.coordinates.x} Y:${this.hudData.coordinates.y} Z:${this.hudData.coordinates.z}`
				);
			}

			// Atualizar seta GPS
			this.updateGPSArrow();
		},

		updateGPSArrow: function () {
			if (this.hudElements.gpsArrow) {
				// Rotacionar a seta para apontar para o próximo objetivo
				this.hudElements.gpsArrow.setAttribute(
					"rotation",
					`0 0 ${-this.hudData.objectiveDirection}`
				);

				// Animação de pulsação quando próximo do objetivo
				if (this.hudData.distanceToObjective < 50) {
					this.hudElements.gpsArrow.setAttribute("animation", {
						property: "scale",
						to: "1.2 1.2 1.2",
						dur: 500,
						dir: "alternate",
						loop: true,
					});
				} else {
					this.hudElements.gpsArrow.removeAttribute("animation");
				}
			}
		},

		// Funções de controle (simplificadas para o teste)
		toggleHUD: function () {
			this.data.enabled = !this.data.enabled;
			if (this.hudContainer) {
				this.hudContainer.setAttribute("visible", this.data.enabled);
			}
			console.log(
				`🚀 HUD Melhorado: ${
					this.data.enabled ? "ATIVADO" : "DESATIVADO"
				}`
			);
		},

		cycleTransparency: function () {
			const levels = [0.3, 0.5, 0.7, 0.9];
			const currentIndex = levels.indexOf(this.data.transparency);
			const nextIndex = (currentIndex + 1) % levels.length;
			this.data.transparency = levels[nextIndex];

			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute(
					"material.opacity",
					this.data.transparency
				);
			}
			console.log(
				`🔍 Transparência: ${Math.round(this.data.transparency * 100)}%`
			);
		},

		cycleHUDColor: function () {
			const colors = [
				"#00ffff",
				"#00ff00",
				"#ffff00",
				"#ff8800",
				"#ff4444",
			];
			const colorNames = [
				"CIANO",
				"VERDE",
				"AMARELO",
				"LARANJA",
				"VERMELHO",
			];
			const currentIndex = colors.indexOf(this.data.hudColor);
			const nextIndex = (currentIndex + 1) % colors.length;
			this.data.hudColor = colors[nextIndex];

			// Atualizar cor dos elementos de texto
			const textElements = [
				this.hudElements.speedText,
				this.hudElements.altitudeText,
				this.hudElements.missionTimeText,
				this.hudElements.coordsText,
			];

			textElements.forEach((element) => {
				if (element) {
					element.setAttribute("color", this.data.hudColor);
				}
			});

			console.log(`🎨 Cor do HUD: ${colorNames[nextIndex]}`);
		},

		increaseHUDSize: function () {
			this.data.hudScale = Math.min(2.0, this.data.hudScale + 0.1);
			this.updateHUDDimensions();
			console.log(`📏 Tamanho: ${Math.round(this.data.hudScale * 100)}%`);
		},

		decreaseHUDSize: function () {
			this.data.hudScale = Math.max(0.3, this.data.hudScale - 0.1);
			this.updateHUDDimensions();
			console.log(`📏 Tamanho: ${Math.round(this.data.hudScale * 100)}%`);
		},

		resetHUDSize: function () {
			this.data.hudScale = 1.0;
			this.updateHUDDimensions();
			console.log("🔄 Tamanho resetado para 100%");
		},

		updateHUDDimensions: function () {
			if (this.hudElements.hudPlane) {
				const newWidth = this.data.hudWidth * this.data.hudScale;
				const newHeight = this.data.hudHeight * this.data.hudScale;

				this.hudElements.hudPlane.setAttribute("width", newWidth);
				this.hudElements.hudPlane.setAttribute("height", newHeight);
			}
		},

		remove: function () {
			if (this.animationFrameId) {
				cancelAnimationFrame(this.animationFrameId);
			}
			if (this.hudContainer && this.hudContainer.parentNode) {
				this.hudContainer.parentNode.removeChild(this.hudContainer);
			}
		},
	});

	console.log("📦 Módulo futuristic-hud-melhorado.js carregado com sucesso!");
}
