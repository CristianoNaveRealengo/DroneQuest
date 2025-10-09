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
		},

		setupKeyboardControls: function () {
			// Controles específicos do HUD
			document.addEventListener("keydown", (evt) => {
				switch (evt.key.toLowerCase()) {
					case 'h':
						this.toggleHUD();
						break;
					case 'u':
						this.cycleTransparency();
						break;
					case 'i':
						this.cycleHUDColor();
						break;
				}
			});
		},

		toggleHUD: function () {
			this.data.enabled = !this.data.enabled;
			if (this.data.enabled) {
				this.show();
				console.log("🚀 HUD Futurístico ATIVADO");
			} else {
				this.hide();
				console.log("🚀 HUD Futurístico DESATIVADO");
			}
		},

		cycleTransparency: function () {
			const levels = [0.3, 0.5, 0.7, 0.9];
			const currentIndex = levels.indexOf(this.data.transparency);
			const nextIndex = (currentIndex + 1) % levels.length;
			this.setTransparency(levels[nextIndex]);
			console.log(`🔍 Transparência do HUD: ${Math.round(this.data.transparency * 100)}%`);
		},

		cycleHUDColor: function () {
			const colors = ["#00ffff", "#00ff00", "#ffff00", "#ff8800", "#ff4444"];
			const colorNames = ["Ciano", "Verde", "Amarelo", "Laranja", "Vermelho"];
			const currentIndex = colors.indexOf(this.data.hudColor);
			const nextIndex = (currentIndex + 1) % colors.length;
			this.setHUDColor(colors[nextIndex]);
			console.log(`🎨 Cor do HUD: ${colorNames[nextIndex]}`);
		},

		createHUDStructure: function () {
			// Container principal do HUD (fixo na câmera)
			this.hudContainer = document.createElement("a-entity");
			this.hudContainer.setAttribute("id", "futuristic-hud-container");
			this.hudContainer.setAttribute("position", "0 0 -2.5");

			// Criar elementos do HUD
			this.createMainFrame();
			this.createSpeedometer();
			this.createBatteryIndicator();
			this.createAltimeter();
			this.createGPSIndicator();
			this.createCentralRadar();
			this.createModeIndicator();
			this.createObjectivePanel();
			this.createStatusBars();

			// Adicionar à câmera
			this.el.appendChild(this.hudContainer);
		},

		createMainFrame: function () {
			// Frame principal hexagonal
			const mainFrame = document.createElement("a-entity");
			mainFrame.setAttribute("id", "hud-main-frame");

			// Geometria do frame principal
			const frameGeometry = document.createElement("a-ring");
			frameGeometry.setAttribute("radius-inner", "1.8");
			frameGeometry.setAttribute("radius-outer", "2.0");
			frameGeometry.setAttribute("segments-theta", "6");
			frameGeometry.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency * 0.8,
				shader: "flat",
			});

			// Linhas de conexão
			this.createConnectionLines(mainFrame);

			mainFrame.appendChild(frameGeometry);
			this.hudContainer.appendChild(mainFrame);
			this.hudElements.mainFrame = mainFrame;
		},

		createConnectionLines: function (parent) {
			// Linhas conectando os cantos
			const lines = [
				{ start: "-1.5 1.2 0", end: "-0.8 0.6 0" },
				{ start: "1.5 1.2 0", end: "0.8 0.6 0" },
				{ start: "-1.5 -1.2 0", end: "-0.8 -0.6 0" },
				{ start: "1.5 -1.2 0", end: "0.8 -0.6 0" },
			];

			lines.forEach((line, index) => {
				const lineEl = document.createElement("a-entity");
				lineEl.setAttribute("line", {
					start: line.start,
					end: line.end,
					color: this.data.hudColor,
					opacity: this.data.transparency * 0.6,
				});
				parent.appendChild(lineEl);
			});
		},

		createSpeedometer: function () {
			// Painel de velocidade (superior esquerdo)
			const speedPanel = document.createElement("a-entity");
			speedPanel.setAttribute("position", "-1.8 1.0 0");

			// Fundo do painel
			const background = document.createElement("a-plane");
			background.setAttribute("width", "0.8");
			background.setAttribute("height", "0.6");
			background.setAttribute("material", {
				color: "#000000",
				transparent: true,
				opacity: this.data.transparency * 0.5,
			});

			// Bordas do painel
			const border = document.createElement("a-ring");
			border.setAttribute("radius-inner", "0.35");
			border.setAttribute("radius-outer", "0.38");
			border.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency,
			});

			// Texto da velocidade
			const speedValue = document.createElement("a-text");
			speedValue.setAttribute("id", "hud-speed-value");
			speedValue.setAttribute("value", "96");
			speedValue.setAttribute("position", "0 0.1 0.01");
			speedValue.setAttribute("align", "center");
			speedValue.setAttribute("color", this.data.hudColor);
			speedValue.setAttribute("scale", "1.2 1.2 1.2");

			// Label KM/H
			const speedLabel = document.createElement("a-text");
			speedLabel.setAttribute("value", "KM/H");
			speedLabel.setAttribute("position", "0 -0.15 0.01");
			speedLabel.setAttribute("align", "center");
			speedLabel.setAttribute("color", this.data.hudColor);
			speedLabel.setAttribute("scale", "0.6 0.6 0.6");

			speedPanel.appendChild(background);
			speedPanel.appendChild(border);
			speedPanel.appendChild(speedValue);
			speedPanel.appendChild(speedLabel);

			this.hudContainer.appendChild(speedPanel);
			this.hudElements.speedometer = {
				panel: speedPanel,
				value: speedValue,
				label: speedLabel,
			};
		},

		createBatteryIndicator: function () {
			// Indicador de bateria (superior direito)
			const batteryPanel = document.createElement("a-entity");
			batteryPanel.setAttribute("position", "1.8 1.0 0");

			// Fundo
			const background = document.createElement("a-plane");
			background.setAttribute("width", "0.8");
			background.setAttribute("height", "0.6");
			background.setAttribute("material", {
				color: "#000000",
				transparent: true,
				opacity: this.data.transparency * 0.5,
			});

			// Ícone da bateria
			const batteryIcon = document.createElement("a-plane");
			batteryIcon.setAttribute("width", "0.3");
			batteryIcon.setAttribute("height", "0.15");
			batteryIcon.setAttribute("position", "-0.1 0.1 0.01");
			batteryIcon.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency,
			});

			// Nível da bateria
			const batteryLevel = document.createElement("a-plane");
			batteryLevel.setAttribute("id", "hud-battery-level");
			batteryLevel.setAttribute("width", "0.25");
			batteryLevel.setAttribute("height", "0.12");
			batteryLevel.setAttribute("position", "-0.1 0.1 0.02");
			batteryLevel.setAttribute("material", {
				color: this.data.successColor,
				transparent: true,
				opacity: this.data.transparency * 0.8,
			});

			// Texto da porcentagem
			const batteryText = document.createElement("a-text");
			batteryText.setAttribute("id", "hud-battery-text");
			batteryText.setAttribute("value", "87%");
			batteryText.setAttribute("position", "0.15 0.05 0.01");
			batteryText.setAttribute("align", "center");
			batteryText.setAttribute("color", this.data.hudColor);
			batteryText.setAttribute("scale", "1.0 1.0 1.0");

			batteryPanel.appendChild(background);
			batteryPanel.appendChild(batteryIcon);
			batteryPanel.appendChild(batteryLevel);
			batteryPanel.appendChild(batteryText);

			this.hudContainer.appendChild(batteryPanel);
			this.hudElements.battery = {
				panel: batteryPanel,
				level: batteryLevel,
				text: batteryText,
				icon: batteryIcon,
			};
		},

		createAltimeter: function () {
			// Altímetro (inferior esquerdo)
			const altPanel = document.createElement("a-entity");
			altPanel.setAttribute("position", "-1.8 -1.0 0");

			// Fundo
			const background = document.createElement("a-plane");
			background.setAttribute("width", "0.8");
			background.setAttribute("height", "0.6");
			background.setAttribute("material", {
				color: "#000000",
				transparent: true,
				opacity: this.data.transparency * 0.5,
			});

			// Valor da altitude
			const altValue = document.createElement("a-text");
			altValue.setAttribute("id", "hud-altitude-value");
			altValue.setAttribute("value", "450");
			altValue.setAttribute("position", "0 0.1 0.01");
			altValue.setAttribute("align", "center");
			altValue.setAttribute("color", this.data.hudColor);
			altValue.setAttribute("scale", "1.2 1.2 1.2");

			// Label M
			const altLabel = document.createElement("a-text");
			altLabel.setAttribute("value", "M");
			altLabel.setAttribute("position", "0 -0.15 0.01");
			altLabel.setAttribute("align", "center");
			altLabel.setAttribute("color", this.data.hudColor);
			altLabel.setAttribute("scale", "0.6 0.6 0.6");

			altPanel.appendChild(background);
			altPanel.appendChild(altValue);
			altPanel.appendChild(altLabel);

			this.hudContainer.appendChild(altPanel);
			this.hudElements.altimeter = {
				panel: altPanel,
				value: altValue,
				label: altLabel,
			};
		},

		createGPSIndicator: function () {
			// Indicador GPS (inferior direito)
			const gpsPanel = document.createElement("a-entity");
			gpsPanel.setAttribute("position", "1.8 -1.0 0");

			// Fundo
			const background = document.createElement("a-plane");
			background.setAttribute("width", "0.8");
			background.setAttribute("height", "0.6");
			background.setAttribute("material", {
				color: "#000000",
				transparent: true,
				opacity: this.data.transparency * 0.5,
			});

			// Ícone GPS
			const gpsIcon = document.createElement("a-text");
			gpsIcon.setAttribute("value", "📡");
			gpsIcon.setAttribute("position", "0 0.15 0.01");
			gpsIcon.setAttribute("align", "center");
			gpsIcon.setAttribute("scale", "0.8 0.8 0.8");

			// Label GPS
			const gpsLabel = document.createElement("a-text");
			gpsLabel.setAttribute("id", "hud-gps-label");
			gpsLabel.setAttribute("value", "GPS");
			gpsLabel.setAttribute("position", "0 -0.05 0.01");
			gpsLabel.setAttribute("align", "center");
			gpsLabel.setAttribute("color", this.data.successColor);
			gpsLabel.setAttribute("scale", "0.8 0.8 0.8");

			// Status
			const gpsStatus = document.createElement("a-text");
			gpsStatus.setAttribute("id", "hud-gps-status");
			gpsStatus.setAttribute("value", "CONECTADO");
			gpsStatus.setAttribute("position", "0 -0.25 0.01");
			gpsStatus.setAttribute("align", "center");
			gpsStatus.setAttribute("color", this.data.successColor);
			gpsStatus.setAttribute("scale", "0.4 0.4 0.4");

			gpsPanel.appendChild(background);
			gpsPanel.appendChild(gpsIcon);
			gpsPanel.appendChild(gpsLabel);
			gpsPanel.appendChild(gpsStatus);

			this.hudContainer.appendChild(gpsPanel);
			this.hudElements.gps = {
				panel: gpsPanel,
				icon: gpsIcon,
				label: gpsLabel,
				status: gpsStatus,
			};
		},

		createCentralRadar: function () {
			// Radar central com crosshair
			const radarContainer = document.createElement("a-entity");
			radarContainer.setAttribute("position", "0 0 0");

			// Círculos concêntricos do radar
			const circles = [0.3, 0.5, 0.7];
			circles.forEach((radius, index) => {
				const circle = document.createElement("a-ring");
				circle.setAttribute("radius-inner", radius - 0.01);
				circle.setAttribute("radius-outer", radius);
				circle.setAttribute("material", {
					color: this.data.hudColor,
					transparent: true,
					opacity: this.data.transparency * (0.8 - index * 0.2),
				});
				radarContainer.appendChild(circle);
			});

			// Crosshair central
			const crosshair = document.createElement("a-entity");

			// Linha horizontal
			const hLine = document.createElement("a-plane");
			hLine.setAttribute("width", "0.4");
			hLine.setAttribute("height", "0.02");
			hLine.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency,
			});

			// Linha vertical
			const vLine = document.createElement("a-plane");
			vLine.setAttribute("width", "0.02");
			vLine.setAttribute("height", "0.4");
			vLine.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency,
			});

			// Ponto central
			const centerDot = document.createElement("a-circle");
			centerDot.setAttribute("radius", "0.03");
			centerDot.setAttribute("material", {
				color: this.data.hudColor,
				transparent: true,
				opacity: this.data.transparency,
			});

			crosshair.appendChild(hLine);
			crosshair.appendChild(vLine);
			crosshair.appendChild(centerDot);
			radarContainer.appendChild(crosshair);

			// Animação de rotação sutil do radar
			radarContainer.setAttribute("animation", {
				property: "rotation",
				to: "0 0 360",
				loop: true,
				dur: 20000,
			});

			this.hudContainer.appendChild(radarContainer);
			this.hudElements.radar = {
				container: radarContainer,
				crosshair: crosshair,
			};
		},

		createModeIndicator: function () {
			// Indicador de modo (inferior centro-esquerda)
			const modePanel = document.createElement("a-entity");
			modePanel.setAttribute("position", "-0.8 -1.5 0");

			// Label MODE
			const modeLabel = document.createElement("a-text");
			modeLabel.setAttribute("value", "MODE");
			modeLabel.setAttribute("position", "0 0.15 0.01");
			modeLabel.setAttribute("align", "center");
			modeLabel.setAttribute("color", this.data.hudColor);
			modeLabel.setAttribute("scale", "0.5 0.5 0.5");

			// Valor do modo
			const modeValue = document.createElement("a-text");
			modeValue.setAttribute("id", "hud-mode-value");
			modeValue.setAttribute("value", "CINEMATIC");
			modeValue.setAttribute("position", "0 -0.1 0.01");
			modeValue.setAttribute("align", "center");
			modeValue.setAttribute("color", "#ff8800");
			modeValue.setAttribute("scale", "0.8 0.8 0.8");

			modePanel.appendChild(modeLabel);
			modePanel.appendChild(modeValue);

			this.hudContainer.appendChild(modePanel);
			this.hudElements.mode = {
				panel: modePanel,
				label: modeLabel,
				value: modeValue,
			};
		},

		createObjectivePanel: function () {
			// Painel de objetivo (inferior centro-direita)
			const objPanel = document.createElement("a-entity");
			objPanel.setAttribute("position", "0.8 -1.5 0");

			// Label OBJECTIVE
			const objLabel = document.createElement("a-text");
			objLabel.setAttribute("value", "OBJECTIVE");
			objLabel.setAttribute("position", "0 0.2 0.01");
			objLabel.setAttribute("align", "center");
			objLabel.setAttribute("color", this.data.hudColor);
			objLabel.setAttribute("scale", "0.5 0.5 0.5");

			// Nome do objetivo
			const objName = document.createElement("a-text");
			objName.setAttribute("id", "hud-objective-name");
			objName.setAttribute("value", "POINT A");
			objName.setAttribute("position", "0 0 0.01");
			objName.setAttribute("align", "center");
			objName.setAttribute("color", this.data.successColor);
			objName.setAttribute("scale", "0.8 0.8 0.8");

			// Distância
			const objDistance = document.createElement("a-text");
			objDistance.setAttribute("id", "hud-objective-distance");
			objDistance.setAttribute("value", "DISTANCE: 120 M");
			objDistance.setAttribute("position", "0 -0.2 0.01");
			objDistance.setAttribute("align", "center");
			objDistance.setAttribute("color", this.data.hudColor);
			objDistance.setAttribute("scale", "0.4 0.4 0.4");

			objPanel.appendChild(objLabel);
			objPanel.appendChild(objName);
			objPanel.appendChild(objDistance);

			this.hudContainer.appendChild(objPanel);
			this.hudElements.objective = {
				panel: objPanel,
				label: objLabel,
				name: objName,
				distance: objDistance,
			};
		},

		createStatusBars: function () {
			// Barras de status adicionais (temperatura, tempo de voo, etc.)
			const statusContainer = document.createElement("a-entity");
			statusContainer.setAttribute("position", "0 1.8 0");

			// Temperatura
			const tempText = document.createElement("a-text");
			tempText.setAttribute("id", "hud-temperature");
			tempText.setAttribute("value", "TEMP: 25°C");
			tempText.setAttribute("position", "-1.5 0 0.01");
			tempText.setAttribute("align", "center");
			tempText.setAttribute("color", this.data.hudColor);
			tempText.setAttribute("scale", "0.4 0.4 0.4");

			// Tempo de voo
			const flightTimeText = document.createElement("a-text");
			flightTimeText.setAttribute("id", "hud-flight-time");
			flightTimeText.setAttribute("value", "FLIGHT: 02:34");
			flightTimeText.setAttribute("position", "0 0 0.01");
			flightTimeText.setAttribute("align", "center");
			flightTimeText.setAttribute("color", this.data.hudColor);
			flightTimeText.setAttribute("scale", "0.4 0.4 0.4");

			// Coordenadas
			const coordsText = document.createElement("a-text");
			coordsText.setAttribute("id", "hud-coordinates");
			coordsText.setAttribute("value", "X:0 Y:0 Z:0");
			coordsText.setAttribute("position", "1.5 0 0.01");
			coordsText.setAttribute("align", "center");
			coordsText.setAttribute("color", this.data.hudColor);
			coordsText.setAttribute("scale", "0.4 0.4 0.4");

			statusContainer.appendChild(tempText);
			statusContainer.appendChild(flightTimeText);
			statusContainer.appendChild(coordsText);

			this.hudContainer.appendChild(statusContainer);
			this.hudElements.status = {
				container: statusContainer,
				temperature: tempText,
				flightTime: flightTimeText,
				coordinates: coordsText,
			};
		},

		startUpdates: function () {
			// Iniciar loop de atualização
			this.updateHUD();
		},

		updateHUD: function () {
			if (!this.data.enabled) return;

			// Obter dados do drone
			this.updateDroneData();

			// Atualizar elementos visuais
			this.updateSpeedometer();
			this.updateBattery();
			this.updateAltimeter();
			this.updateGPS();
			this.updateMode();
			this.updateObjective();
			this.updateStatus();

			// Próxima atualização
			this.animationFrameId = requestAnimationFrame(() => {
				this.updateHUD();
			});
		},

		updateDroneData: function () {
			// Obter referência do drone
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const droneController = drone.components["drone-controller"];
			const gameManager =
				document.querySelector("[game-manager]")?.components[
					"game-manager"
				];

			if (droneController) {
				// Velocidade
				const velocity =
					droneController.velocity || new THREE.Vector3();
				this.hudData.speed = Math.round(velocity.length() * 3.6); // m/s para km/h

				// Altitude
				const position = drone.getAttribute("position");
				this.hudData.altitude = Math.round(position.y);

				// Coordenadas
				this.hudData.coordinates = {
					x: Math.round(position.x),
					y: Math.round(position.y),
					z: Math.round(position.z),
				};

				// Modo de voo
				if (droneController.cinematicMode?.enabled) {
					this.hudData.mode = "CINEMATIC";
				} else if (droneController.fpvMode?.enabled) {
					this.hudData.mode = "FPV/SPORT";
				} else {
					this.hudData.mode = "NORMAL";
				}

				// Bateria (simulada baseada no tempo)
				const flightTime =
					(Date.now() -
						(droneController.activationTime || Date.now())) /
					1000;
				this.hudData.battery = Math.max(
					10,
					100 - Math.floor(flightTime / 10)
				);
			}

			if (gameManager) {
				// Objetivo atual
				const checkpointsReached =
					gameManager.gameState?.checkpointsReached || 0;
				const totalCheckpoints =
					gameManager.data?.totalCheckpoints || 3;
				this.hudData.objective = `CHECKPOINT ${checkpointsReached + 1}`;

				// Tempo de voo
				const elapsedTime = gameManager.gameState?.elapsedTime || 0;
				const minutes = Math.floor(elapsedTime / 60000);
				const seconds = Math.floor((elapsedTime % 60000) / 1000);
				this.hudData.flightTime = `${minutes
					.toString()
					.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
			}

			// Temperatura simulada
			this.hudData.temperature = 20 + Math.sin(Date.now() / 10000) * 5;
		},
	});

	console.log("📦 Módulo futuristic-hud.js carregado com sucesso!");
}
        updateSpeedometer: function () {
            if (this.hudElements.speedometer) {
                const speedValue = this.hudElements.speedometer.value;
                speedValue.setAttribute("value", this.hudData.speed.toString());

                // Mudar cor baseada na velocidade
                let color = this.data.hudColor;
                if (this.hudData.speed > 80) {
                    color = this.data.warningColor;
                } else if (this.hudData.speed > 50) {
                    color = "#ffaa00";
                }
                speedValue.setAttribute("color", color);
            }
        },

        updateBattery: function () {
            if (this.hudElements.battery) {
                const batteryText = this.hudElements.battery.text;
                const batteryLevel = this.hudElements.battery.level;
                
                batteryText.setAttribute("value", `${this.hudData.battery}%`);

                // Atualizar nível visual da bateria
                const levelWidth = 0.25 * (this.hudData.battery / 100);
                batteryLevel.setAttribute("width", levelWidth);

                // Mudar cor baseada no nível
                let color = this.data.successColor;
                if (this.hudData.battery < 20) {
                    color = this.data.warningColor;
                    // Animação de piscada para bateria crítica
                    batteryLevel.setAttribute("animation", {
                        property: "material.opacity",
                        to: "0.2",
                        dur: 500,
                        dir: "alternate",
                        loop: true
                    });
                } else if (this.hudData.battery < 50) {
                    color = "#ffaa00";
                    batteryLevel.removeAttribute("animation");
                } else {
                    batteryLevel.removeAttribute("animation");
                }

                batteryLevel.setAttribute("material.color", color);
                batteryText.setAttribute("color", color);
            }
        },

        updateAltimeter: function () {
            if (this.hudElements.altimeter) {
                const altValue = this.hudElements.altimeter.value;
                altValue.setAttribute("value", this.hudData.altitude.toString());

                // Mudar cor baseada na altitude
                let color = this.data.hudColor;
                if (this.hudData.altitude < 2) {
                    color = this.data.warningColor;
                } else if (this.hudData.altitude > 100) {
                    color = "#ffaa00";
                }
                altValue.setAttribute("color", color);
            }
        },

        updateGPS: function () {
            if (this.hudElements.gps) {
                const gpsLabel = this.hudElements.gps.label;
                const gpsStatus = this.hudElements.gps.status;

                if (this.hudData.gpsSignal) {
                    gpsLabel.setAttribute("color", this.data.successColor);
                    gpsStatus.setAttribute("value", "CONECTADO");
                    gpsStatus.setAttribute("color", this.data.successColor);
                } else {
                    gpsLabel.setAttribute("color", this.data.warningColor);
                    gpsStatus.setAttribute("value", "SEM SINAL");
                    gpsStatus.setAttribute("color", this.data.warningColor);
                }
            }
        },

        updateMode: function () {
            if (this.hudElements.mode) {
                const modeValue = this.hudElements.mode.value;
                modeValue.setAttribute("value", this.hudData.mode);

                // Cor baseada no modo
                let color = "#ff8800";
                if (this.hudData.mode === "FPV/SPORT") {
                    color = this.data.warningColor;
                } else if (this.hudData.mode === "CINEMATIC") {
                    color = "#ff8800";
                }
                modeValue.setAttribute("color", color);
            }
        },

        updateObjective: function () {
            if (this.hudElements.objective) {
                const objName = this.hudElements.objective.name;
                const objDistance = this.hudElements.objective.distance;

                objName.setAttribute("value", this.hudData.objective);
                objDistance.setAttribute("value", `DISTANCE: ${this.hudData.distance} M`);

                // Calcular distância real ao próximo checkpoint
                this.calculateDistanceToObjective();
            }
        },

        calculateDistanceToObjective: function () {
            const drone = document.querySelector("#drone");
            if (!drone) return;

            const dronePos = drone.getAttribute("position");
            const checkpoints = document.querySelectorAll("[checkpoint]");
            
            let nearestDistance = 999;
            checkpoints.forEach(checkpoint => {
                if (checkpoint.components.checkpoint && !checkpoint.components.checkpoint.isReached) {
                    const checkpointPos = checkpoint.getAttribute("position");
                    const distance = Math.sqrt(
                        Math.pow(dronePos.x - checkpointPos.x, 2) +
                        Math.pow(dronePos.y - checkpointPos.y, 2) +
                        Math.pow(dronePos.z - checkpointPos.z, 2)
                    );
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                    }
                }
            });

            this.hudData.distance = Math.round(nearestDistance);
        },

        updateStatus: function () {
            if (this.hudElements.status) {
                const tempText = this.hudElements.status.temperature;
                const flightTimeText = this.hudElements.status.flightTime;
                const coordsText = this.hudElements.status.coordinates;

                tempText.setAttribute("value", `TEMP: ${Math.round(this.hudData.temperature)}°C`);
                flightTimeText.setAttribute("value", `FLIGHT: ${this.hudData.flightTime}`);
                coordsText.setAttribute("value", 
                    `X:${this.hudData.coordinates.x} Y:${this.hudData.coordinates.y} Z:${this.hudData.coordinates.z}`
                );
            }
        },

        // Métodos de controle
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
            // Atualizar transparência de todos os elementos
            this.updateAllTransparency();
        },

        updateAllTransparency: function () {
            // Atualizar transparência de todos os elementos do HUD
            const elements = this.hudContainer.querySelectorAll("[material]");
            elements.forEach(el => {
                const material = el.getAttribute("material");
                if (material && material.transparent) {
                    el.setAttribute("material.opacity", this.data.transparency);
                }
            });
        },

        setHUDColor: function (color) {
            this.data.hudColor = color;
            // Atualizar cor de todos os elementos principais
            this.updateAllColors();
        },

        updateAllColors: function () {
            // Atualizar cores dos elementos principais
            const hudColorElements = this.hudContainer.querySelectorAll(`[color="${this.data.hudColor}"]`);
            hudColorElements.forEach(el => {
                el.setAttribute("color", this.data.hudColor);
            });
        },

        // Limpeza
        remove: function () {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
            if (this.hudContainer && this.hudContainer.parentNode) {
                this.hudContainer.parentNode.removeChild(this.hudContainer);
            }
        }
    });

    console.log("📦 Módulo futuristic-hud.js carregado completamente!");
}   
     // Sistema de notificações visuais
        showNotification: function (message, color = "#00ffff", duration = 2000) {
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
                easing: "easeOutQuad"
            });
            notification.setAttribute("animation__fade", {
                property: "material.opacity",
                from: 1,
                to: 0,
                dur: duration,
                delay: 500
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

        // Atualizar função toggleHUD para incluir notificação
        toggleHUD: function () {
            this.data.enabled = !this.data.enabled;
            if (this.data.enabled) {
                this.show();
                this.showNotification("🚀 HUD FUTURÍSTICO ATIVADO", "#00ff00");
                console.log("🚀 HUD Futurístico ATIVADO");
            } else {
                this.hide();
                this.showNotification("🚀 HUD FUTURÍSTICO DESATIVADO", "#ff4444");
                console.log("🚀 HUD Futurístico DESATIVADO");
            }
        },

        // Atualizar função cycleTransparency para incluir notificação
        cycleTransparency: function () {
            const levels = [0.3, 0.5, 0.7, 0.9];
            const currentIndex = levels.indexOf(this.data.transparency);
            const nextIndex = (currentIndex + 1) % levels.length;
            this.setTransparency(levels[nextIndex]);
            const percentage = Math.round(this.data.transparency * 100);
            this.showNotification(`🔍 TRANSPARÊNCIA: ${percentage}%`, "#ffaa00");
            console.log(`🔍 Transparência do HUD: ${percentage}%`);
        },

        // Atualizar função cycleHUDColor para incluir notificação
        cycleHUDColor: function () {
            const colors = ["#00ffff", "#00ff00", "#ffff00", "#ff8800", "#ff4444"];
            const colorNames = ["CIANO", "VERDE", "AMARELO", "LARANJA", "VERMELHO"];
            const currentIndex = colors.indexOf(this.data.hudColor);
            const nextIndex = (currentIndex + 1) % colors.length;
            this.setHUDColor(colors[nextIndex]);
            this.showNotification(`🎨 COR: ${colorNames[nextIndex]}`, colors[nextIndex]);
            console.log(`🎨 Cor do HUD: ${colorNames[nextIndex]}`);
        },

        // Função para mostrar informações do sistema
        showSystemInfo: function () {
            const drone = document.querySelector("#drone");
            if (!drone) return;

            const position = drone.getAttribute("position");
            const info = [
                "=== SISTEMA DE NAVEGAÇÃO ===",
                `Posição: X:${position.x.toFixed(1)} Y:${position.y.toFixed(1)} Z:${position.z.toFixed(1)}`,
                `Velocidade: ${this.hudData.speed} km/h`,
                `Altitude: ${this.hudData.altitude} m`,
                `Bateria: ${this.hudData.battery}%`,
                `Modo: ${this.hudData.mode}`,
                `Objetivo: ${this.hudData.objective}`,
                `Distância: ${this.hudData.distance} m`,
                "=========================="
            ].join("\n");

            console.log(info);
            this.showNotification("📊 INFO NO CONSOLE", "#00ffff", 1500);
        }
    });

    // Registrar componente adicional para controles globais do HUD
    AFRAME.registerComponent("hud-controls", {
        init: function () {
            document.addEventListener("keydown", (evt) => {
                const hudComponent = document.querySelector("[futuristic-hud]");
                if (!hudComponent || !hudComponent.components["futuristic-hud"]) return;

                const hud = hudComponent.components["futuristic-hud"];

                switch (evt.key.toLowerCase()) {
                    case 'j':
                        hud.showSystemInfo();
                        break;
                }
            });
        }
    });

    console.log("📦 Módulo futuristic-hud.js carregado completamente com controles!");
}