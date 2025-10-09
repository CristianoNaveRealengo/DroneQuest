/**
 * Sistema de HUD Futurístico para Drone VR
 * Interface de nave espacial com elementos transparentes e dinâmicos
 */

if (!AFRAME.components["futuristic-hud"]) {
	AFRAME.registerComponent("futuristic-hud", {
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
			useCleanHUD: { type: "boolean", default: false },
		},

		init: function () {
			console.log("🚀 Inicializando HUD Futurístico...");

			// Estado do HUD
			this.hudData = {
				speed: 0,
				altitude: 0,
				battery: 100,
				gpsSignal: true,
				mode: "CINEMATOGRÁFICO",
				objective: "CHECKPOINT 1",
				distance: 120,
				temperature: 25,
				flightTime: 0,
				coordinates: { x: 0, y: 0, z: 0 },
			};

			// Referências aos elementos
			this.hudElements = {};
			this.animationFrameId = null;
			this.startTime = Date.now();

			// Configurar controles de teclado
			this.setupKeyboardControls();

			// Criar estrutura do HUD
			this.createHUDStructure();

			// Iniciar atualizações
			this.startUpdates();

			console.log("✅ HUD Futurístico inicializado!");
			console.log("🎮 Controles do HUD:");
			console.log("  H - Alternar HUD Futurístico");
			console.log("  U - Ajustar transparência");
			console.log("  I - Alternar cor do HUD");
			console.log("  K - Alternar HUD Limpo/Completo");
		},

		setupKeyboardControls: function () {
			console.log("🎮 Configurando controles de teclado do HUD...");

			// Controles específicos do HUD
			const self = this;
			document.addEventListener("keydown", (evt) => {
				console.log(`🔑 Tecla pressionada: ${evt.key}`);

				switch (evt.key.toLowerCase()) {
					case "h":
						console.log("🚀 Comando H - Toggle HUD");
						self.toggleHUD();
						break;
					case "u":
						console.log("🔍 Comando U - Transparência");
						self.cycleTransparency();
						break;
					case "i":
						console.log("🎨 Comando I - Cor do HUD");
						self.cycleHUDColor();
						break;
					case "n":
						console.log("📊 Comando N - Grid de Navegação");
						self.toggleNavigationGrid();
						break;
					case "l":
						console.log("📍 Comando L - Linhas de Navegação");
						self.toggleNavigationLines();
						break;
					case "=":
					case "+":
						console.log("🔍 Comando + - Aumentar HUD");
						self.increaseHUDSize();
						break;
					case "-":
					case "_":
						console.log("🔍 Comando - - Diminuir HUD");
						self.decreaseHUDSize();
						break;
					case "0":
						console.log("🔄 Comando 0 - Reset tamanho HUD");
						self.resetHUDSize();
						break;
					case "[":
						console.log("📏 Comando [ - HUD mais próximo");
						self.moveHUDCloser();
						break;
					case "]":
						console.log("📏 Comando ] - HUD mais distante");
						self.moveHUDFarther();
						break;
					case "k":
						console.log("🎯 Comando K - Alternar HUD Limpo");
						self.toggleCleanHUD();
						break;
				}
			});

			console.log("✅ Controles de teclado configurados!");
		},

		toggleHUD: function () {
			console.log("🚀 Executando toggleHUD...");
			this.data.enabled = !this.data.enabled;
			if (this.data.enabled) {
				this.show();
				this.showNotification("🚀 HUD FUTURÍSTICO ATIVADO", "#00ff00");
				console.log("🚀 HUD Futurístico ATIVADO");
			} else {
				this.hide();
				this.showNotification(
					"🚀 HUD FUTURÍSTICO DESATIVADO",
					"#ff4444"
				);
				console.log("🚀 HUD Futurístico DESATIVADO");
			}
		},

		cycleTransparency: function () {
			console.log("🔍 Executando cycleTransparency...");
			const levels = [0.3, 0.5, 0.7, 0.9];
			const currentIndex = levels.indexOf(this.data.transparency);
			const nextIndex = (currentIndex + 1) % levels.length;
			this.setTransparency(levels[nextIndex]);
			const percentage = Math.round(this.data.transparency * 100);
			this.showNotification(
				`🔍 TRANSPARÊNCIA: ${percentage}%`,
				"#ffaa00"
			);
			console.log(`🔍 Transparência do HUD: ${percentage}%`);
		},

		cycleHUDColor: function () {
			console.log("🎨 Executando cycleHUDColor...");
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
			this.setHUDColor(colors[nextIndex]);
			this.showNotification(
				`🎨 COR: ${colorNames[nextIndex]}`,
				colors[nextIndex]
			);
			console.log(`🎨 Cor do HUD: ${colorNames[nextIndex]}`);
		},

		toggleNavigationGrid: function () {
			console.log("📊 Executando toggleNavigationGrid...");
			if (this.hudElements.navigationGrid) {
				const isVisible =
					this.hudElements.navigationGrid.getAttribute("visible");
				this.hudElements.navigationGrid.setAttribute(
					"visible",
					!isVisible
				);
				this.showNotification(
					isVisible ? "📊 GRID DESATIVADO" : "📊 GRID ATIVADO",
					"#ffaa00"
				);
			}
		},

		toggleNavigationLines: function () {
			console.log("📍 Executando toggleNavigationLines...");
			if (this.hudElements.navigationLines) {
				const isVisible =
					this.hudElements.navigationLines.getAttribute("visible");
				this.hudElements.navigationLines.setAttribute(
					"visible",
					!isVisible
				);
				this.showNotification(
					isVisible ? "📍 LINHAS DESATIVADAS" : "📍 LINHAS ATIVADAS",
					"#ffaa00"
				);
			}
		},

		toggleCleanHUD: function () {
			console.log("🎯 Executando toggleCleanHUD...");
			this.data.useCleanHUD = !this.data.useCleanHUD;

			// Atualizar o material do HUD
			if (this.hudElements.hudPlane) {
				const newSrc = this.data.useCleanHUD
					? "assets/hud-overlay-limpo.svg"
					: "assets/hud-overlay.svg";
				this.hudElements.hudPlane.setAttribute("material", {
					src: newSrc,
					transparent: true,
					opacity: this.data.transparency,
					alphaTest: 0.1,
				});
			}

			const hudType = this.data.useCleanHUD ? "LIMPO" : "COMPLETO";
			this.showNotification(`🎯 HUD ${hudType} ATIVADO`, "#00ff00");
			console.log(`🎯 HUD ${hudType} ativado`);
		},

		// === CONTROLES DE DIMENSÃO DO HUD ===

		increaseHUDSize: function () {
			console.log("🔍 Aumentando tamanho do HUD...");
			this.data.hudScale = Math.min(2.0, this.data.hudScale + 0.1);
			this.updateHUDDimensions();
			this.showNotification(
				`📏 TAMANHO: ${Math.round(this.data.hudScale * 100)}%`,
				"#00ff00"
			);
		},

		decreaseHUDSize: function () {
			console.log("🔍 Diminuindo tamanho do HUD...");
			this.data.hudScale = Math.max(0.3, this.data.hudScale - 0.1);
			this.updateHUDDimensions();
			this.showNotification(
				`📏 TAMANHO: ${Math.round(this.data.hudScale * 100)}%`,
				"#ffaa00"
			);
		},

		resetHUDSize: function () {
			console.log("🔄 Resetando tamanho do HUD...");
			this.data.hudScale = 1.0;
			this.data.hudDistance = 2.5;
			this.updateHUDDimensions();
			this.updateHUDPosition();
			this.showNotification("🔄 TAMANHO RESETADO", "#00ffff");
		},

		moveHUDCloser: function () {
			console.log("📏 Movendo HUD para mais perto...");
			this.data.hudDistance = Math.max(1.0, this.data.hudDistance - 0.2);
			this.updateHUDPosition();
			this.showNotification(
				`📏 DISTÂNCIA: ${this.data.hudDistance.toFixed(1)}m`,
				"#ffaa00"
			);
		},

		moveHUDFarther: function () {
			console.log("📏 Movendo HUD para mais longe...");
			this.data.hudDistance = Math.min(5.0, this.data.hudDistance + 0.2);
			this.updateHUDPosition();
			this.showNotification(
				`📏 DISTÂNCIA: ${this.data.hudDistance.toFixed(1)}m`,
				"#ffaa00"
			);
		},

		updateHUDDimensions: function () {
			if (this.hudElements.hudPlane) {
				const newWidth = this.data.hudWidth * this.data.hudScale;
				const newHeight = this.data.hudHeight * this.data.hudScale;

				this.hudElements.hudPlane.setAttribute("width", newWidth);
				this.hudElements.hudPlane.setAttribute("height", newHeight);

				console.log(
					`📏 HUD redimensionado: ${newWidth.toFixed(
						1
					)} x ${newHeight.toFixed(1)}`
				);
			}

			// Atualizar escala dos elementos de texto proporcionalmente
			this.updateTextElementsScale();
		},

		updateHUDPosition: function () {
			if (this.hudContainer) {
				this.hudContainer.setAttribute(
					"position",
					`0 0 -${this.data.hudDistance}`
				);
				console.log(
					`📏 HUD reposicionado: distância ${this.data.hudDistance}m`
				);
			}
		},

		updateTextElementsScale: function () {
			// Ajustar escala dos elementos de texto baseado na escala do HUD
			const textScale = this.data.hudScale;
			const textElements = [
				this.hudElements.speedText,
				this.hudElements.batteryText,
				this.hudElements.altitudeText,
				this.hudElements.modeText,
				this.hudElements.objectiveText,
				this.hudElements.distanceText,
				this.hudElements.coordsText,
			];

			textElements.forEach((element) => {
				if (element) {
					const currentScale = element.getAttribute("scale");
					const baseScale = {
						x:
							currentScale.x / this.lastTextScale ||
							currentScale.x,
						y:
							currentScale.y / this.lastTextScale ||
							currentScale.y,
						z:
							currentScale.z / this.lastTextScale ||
							currentScale.z,
					};

					element.setAttribute("scale", {
						x: baseScale.x * textScale,
						y: baseScale.y * textScale,
						z: baseScale.z * textScale,
					});
				}
			});

			this.lastTextScale = textScale;
		},

		// Função para definir tamanho customizado
		setHUDSize: function (width, height, scale = 1.0) {
			console.log(
				`📏 Definindo tamanho customizado: ${width}x${height} (escala: ${scale})`
			);
			this.data.hudWidth = width;
			this.data.hudHeight = height;
			this.data.hudScale = scale;
			this.updateHUDDimensions();
			this.showNotification(
				`📏 TAMANHO: ${width.toFixed(1)}x${height.toFixed(1)}`,
				"#00ffff"
			);
		},

		// Presets de tamanho
		setHUDPreset: function (preset) {
			switch (preset) {
				case "small":
					this.setHUDSize(3.0, 2.25, 0.8);
					this.showNotification("📏 PRESET: PEQUENO", "#ffaa00");
					break;
				case "medium":
					this.setHUDSize(4.0, 3.0, 1.0);
					this.showNotification("📏 PRESET: MÉDIO", "#00ffff");
					break;
				case "large":
					this.setHUDSize(5.0, 3.75, 1.2);
					this.showNotification("📏 PRESET: GRANDE", "#00ff00");
					break;
				case "fullscreen":
					this.setHUDSize(6.0, 4.5, 1.5);
					this.showNotification("📏 PRESET: TELA CHEIA", "#ff8800");
					break;
			}
		},

		createHUDStructure: function () {
			console.log("🏗️ Criando estrutura do HUD baseada em imagem...");

			// Container principal do HUD (fixo na câmera, usando distância configurável)
			this.hudContainer = document.createElement("a-entity");
			this.hudContainer.setAttribute("id", "futuristic-hud-container");
			this.hudContainer.setAttribute(
				"position",
				`0 0 -${this.data.hudDistance}`
			);

			// Criar HUD baseado em imagem
			this.createImageBasedHUD();

			// Adicionar à câmera
			this.el.appendChild(this.hudContainer);

			console.log(
				`✅ Estrutura do HUD criada! Tamanho: ${this.data.hudWidth}x${this.data.hudHeight}, Distância: ${this.data.hudDistance}m`
			);
		},

		createImageBasedHUD: function () {
			// Plano principal com a imagem do HUD (usando dimensões configuráveis)
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
				src: this.data.useCleanHUD
					? "assets/hud-overlay-limpo.svg"
					: "assets/hud-overlay.svg",
				transparent: true,
				opacity: this.data.transparency,
				alphaTest: 0.1,
			});

			this.hudContainer.appendChild(hudPlane);
			this.hudElements.hudPlane = hudPlane;

			// Inicializar variável de controle de escala de texto
			this.lastTextScale = 1.0;

			// Criar elementos de texto dinâmicos sobrepostos
			this.createDynamicTextElements();
		},

		createDynamicTextElements: function () {
			// Velocímetro (posição ajustada para coincidir com a imagem)
			const speedText = document.createElement("a-text");
			speedText.setAttribute("id", "hud-speed-dynamic");
			speedText.setAttribute("value", "96");
			speedText.setAttribute("position", "-1.4 0.6 0.01");
			speedText.setAttribute("align", "center");
			speedText.setAttribute("color", this.data.hudColor);
			speedText.setAttribute("scale", "0.8 0.8 0.8");
			speedText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(speedText);
			this.hudElements.speedText = speedText;

			// Bateria
			const batteryText = document.createElement("a-text");
			batteryText.setAttribute("id", "hud-battery-dynamic");
			batteryText.setAttribute("value", "87%");
			batteryText.setAttribute("position", "1.4 0.6 0.01");
			batteryText.setAttribute("align", "center");
			batteryText.setAttribute("color", this.data.hudColor);
			batteryText.setAttribute("scale", "0.6 0.6 0.6");
			batteryText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(batteryText);
			this.hudElements.batteryText = batteryText;

			// Altímetro
			const altitudeText = document.createElement("a-text");
			altitudeText.setAttribute("id", "hud-altitude-dynamic");
			altitudeText.setAttribute("value", "450");
			altitudeText.setAttribute("position", "-1.4 -0.6 0.01");
			altitudeText.setAttribute("align", "center");
			altitudeText.setAttribute("color", this.data.hudColor);
			altitudeText.setAttribute("scale", "0.8 0.8 0.8");
			altitudeText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(altitudeText);
			this.hudElements.altitudeText = altitudeText;

			// Modo de voo
			const modeText = document.createElement("a-text");
			modeText.setAttribute("id", "hud-mode-dynamic");
			modeText.setAttribute("value", "CINEMATIC");
			modeText.setAttribute("position", "-0.6 -1.0 0.01");
			modeText.setAttribute("align", "center");
			modeText.setAttribute("color", "#ff8800");
			modeText.setAttribute("scale", "0.5 0.5 0.5");
			modeText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(modeText);
			this.hudElements.modeText = modeText;

			// Objetivo
			const objectiveText = document.createElement("a-text");
			objectiveText.setAttribute("id", "hud-objective-dynamic");
			objectiveText.setAttribute("value", "POINT A");
			objectiveText.setAttribute("position", "0.6 -0.8 0.01");
			objectiveText.setAttribute("align", "center");
			objectiveText.setAttribute("color", "#44ff44");
			objectiveText.setAttribute("scale", "0.5 0.5 0.5");
			objectiveText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(objectiveText);
			this.hudElements.objectiveText = objectiveText;

			// Distância
			const distanceText = document.createElement("a-text");
			distanceText.setAttribute("id", "hud-distance-dynamic");
			distanceText.setAttribute("value", "DISTANCE: 120 M");
			distanceText.setAttribute("position", "0.6 -1.1 0.01");
			distanceText.setAttribute("align", "center");
			distanceText.setAttribute("color", this.data.hudColor);
			distanceText.setAttribute("scale", "0.3 0.3 0.3");
			distanceText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(distanceText);
			this.hudElements.distanceText = distanceText;

			// Coordenadas (superior)
			const coordsText = document.createElement("a-text");
			coordsText.setAttribute("id", "hud-coords-dynamic");
			coordsText.setAttribute("value", "X:0 Y:0 Z:0");
			coordsText.setAttribute("position", "0.6 1.3 0.01");
			coordsText.setAttribute("align", "center");
			coordsText.setAttribute("color", this.data.hudColor);
			coordsText.setAttribute("scale", "0.25 0.25 0.25");
			coordsText.setAttribute("font", "monospace");
			this.hudContainer.appendChild(coordsText);
			this.hudElements.coordsText = coordsText;

			// Indicador de posição dinâmico (ponto amarelo no centro)
			const positionIndicator = document.createElement("a-circle");
			positionIndicator.setAttribute("id", "hud-position-indicator");
			positionIndicator.setAttribute("radius", "0.03");
			positionIndicator.setAttribute("position", "0 0 0.02");
			positionIndicator.setAttribute("material", {
				color: "#ffff00",
				transparent: true,
				opacity: 0.8,
			});
			positionIndicator.setAttribute("animation", {
				property: "scale",
				to: "1.5 1.5 1.5",
				dur: 1000,
				dir: "alternate",
				loop: true,
			});
			this.hudContainer.appendChild(positionIndicator);
			this.hudElements.positionIndicator = positionIndicator;
		},

		startUpdates: function () {
			console.log("🔄 Iniciando atualizações do HUD...");
			// Iniciar loop de atualização
			this.updateHUD();
		},

		updateHUD: function () {
			if (!this.data.enabled) return;

			// Atualizar dados básicos
			this.updateBasicData();

			// Próxima atualização
			this.animationFrameId = requestAnimationFrame(() => {
				this.updateHUD();
			});
		},

		updateBasicData: function () {
			// Atualizar dados básicos do drone
			const drone = document.querySelector("#drone");
			if (drone) {
				const position = drone.getAttribute("position");
				const droneController = drone.components["drone-controller"];

				// Atualizar coordenadas
				this.hudData.coordinates = {
					x: Math.round(position.x),
					y: Math.round(position.y),
					z: Math.round(position.z),
				};

				// Atualizar velocidade se disponível
				if (droneController && droneController.velocity) {
					this.hudData.speed = Math.round(
						droneController.velocity.length() * 3.6
					); // m/s para km/h
				}

				// Atualizar altitude
				this.hudData.altitude = Math.round(position.y);

				// Simular bateria baseada no tempo
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
			}

			// Atualizar elementos visuais
			this.updateVisualElements();
		},

		updateVisualElements: function () {
			// Atualizar velocímetro
			if (this.hudElements.speedText) {
				this.hudElements.speedText.setAttribute(
					"value",
					this.hudData.speed.toString()
				);
			}

			// Atualizar bateria
			if (this.hudElements.batteryText) {
				this.hudElements.batteryText.setAttribute(
					"value",
					`${this.hudData.battery}%`
				);
				// Mudar cor baseada no nível da bateria
				const batteryColor =
					this.hudData.battery < 20
						? "#ff4444"
						: this.hudData.battery < 50
						? "#ffaa00"
						: "#44ff44";
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

			// Atualizar modo
			if (this.hudElements.modeText) {
				this.hudElements.modeText.setAttribute(
					"value",
					this.hudData.mode
				);
			}

			// Atualizar coordenadas
			if (this.hudElements.coordsText) {
				this.hudElements.coordsText.setAttribute(
					"value",
					`X:${this.hudData.coordinates.x} Y:${this.hudData.coordinates.y} Z:${this.hudData.coordinates.z}`
				);
			}

			// Atualizar distância para checkpoint
			this.calculateDistanceToNearestCheckpoint();
			if (this.hudElements.distanceText) {
				this.hudElements.distanceText.setAttribute(
					"value",
					`DISTANCE: ${this.hudData.distance} M`
				);
			}
		},

		calculateDistanceToNearestCheckpoint: function () {
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

		showNotification: function (
			message,
			color = "#00ffff",
			duration = 2000
		) {
			console.log(`📢 Notificação: ${message}`);

			// Criar elemento de notificação
			const notification = document.createElement("a-text");
			notification.setAttribute("value", message);
			notification.setAttribute("color", color);
			notification.setAttribute("position", "0 0.5 -1.5");
			notification.setAttribute("align", "center");
			notification.setAttribute("scale", "1.5 1.5 1.5");
			notification.setAttribute("animation", {
				property: "position",
				to: "0 1.0 -1.5",
				dur: 500,
				easing: "easeOutQuad",
			});
			notification.setAttribute("animation__fade", {
				property: "material.opacity",
				from: 1,
				to: 0,
				dur: duration,
				delay: 500,
			});

			// Adicionar à câmera
			this.el.appendChild(notification);

			// Remover após a animação
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, duration + 1000);
		},

		show: function () {
			this.data.enabled = true;
			if (this.hudContainer) {
				this.hudContainer.setAttribute("visible", true);
			}
		},

		hide: function () {
			this.data.enabled = false;
			if (this.hudContainer) {
				this.hudContainer.setAttribute("visible", false);
			}
		},

		setTransparency: function (value) {
			this.data.transparency = Math.max(0.1, Math.min(1.0, value));
			console.log(
				`🔍 Transparência definida para: ${this.data.transparency}`
			);

			// Atualizar transparência da imagem do HUD
			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute(
					"material.opacity",
					this.data.transparency
				);
			}
		},

		setHUDColor: function (color) {
			this.data.hudColor = color;
			console.log(`🎨 Cor do HUD definida para: ${color}`);

			// Atualizar cor dos elementos de texto dinâmicos
			const textElements = [
				this.hudElements.speedText,
				this.hudElements.batteryText,
				this.hudElements.altitudeText,
				this.hudElements.coordsText,
				this.hudElements.distanceText,
			];

			textElements.forEach((element) => {
				if (element) {
					element.setAttribute("color", color);
				}
			});

			// Atualizar cor da imagem SVG
			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute("material.color", color);
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

	console.log("📦 Módulo futuristic-hud.js carregado com sucesso!");
}
