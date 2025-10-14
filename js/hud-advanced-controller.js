/**
 * HUD Advanced Controller - Sistema Completo de HUD Futurística
 * Compatível com Desktop e VR
 * Integrado ao mundo 3D seguindo a câmera
 */

if (!AFRAME.components["hud-advanced"]) {
	AFRAME.registerComponent("hud-advanced", {
		schema: {
			enabled: { type: "boolean", default: true },
			hudWidth: { type: "number", default: 2.4 },
			hudHeight: { type: "number", default: 1.35 },
			hudDistance: { type: "number", default: 1.2 },
			opacity: { type: "number", default: 0.95 },
			parallaxIntensity: { type: "number", default: 0.01 },
			smoothingFactor: { type: "number", default: 0.08 },
			cockpitMode: { type: "boolean", default: true },
		},

		init: function () {
			console.log("🚀 Inicializando HUD Advanced Controller...");

			this.setupData();
			this.setupParallax();
			this.setupKeyboardControls();

			// Aguardar carregamento completo
			setTimeout(() => {
				this.createHUD();
				this.startUpdateLoop();
			}, 800);

			console.log("✅ HUD Advanced Controller inicializado!");
		},

		setupData: function () {
			this.hudData = {
				speed: 0,
				altitude: 0,
				battery: 100,
				mode: "NORMAL",
				objective: "CHECKPOINT 1",
				distance: 0,
				coordinates: { x: 0, y: 0, z: 0 },
				heading: 0,
				pitch: 0,
				roll: 0,
				systems: {
					gps: true,
					imu: true,
					motor: true,
					link: true,
				},
				warnings: [],
			};

			this.hudElements = {};
			this.startTime = Date.now();
			this.lastWarningTime = 0;
		},

		setupParallax: function () {
			// Posição do HUD como display do cockpit
			const hudY = this.data.cockpitMode ? -0.15 : 0; // Ligeiramente abaixo do centro

			this.parallax = {
				lastDronePosition: { x: 0, y: 0, z: 0 },
				lastDroneRotation: { x: 0, y: 0, z: 0 },
				currentOffset: { x: 0, y: 0, z: 0 },
				targetOffset: { x: 0, y: 0, z: 0 },
				basePosition: { x: 0, y: hudY, z: -this.data.hudDistance },
			};
		},

		setupKeyboardControls: function () {
			console.log("🎮 Configurando controles avançados do HUD...");

			document.addEventListener("keydown", (evt) => {
				switch (evt.key.toLowerCase()) {
					case "h":
						this.toggleHUD();
						break;
					case "j":
						this.cycleOpacity();
						break;
					case "k":
						this.reloadHUD();
						break;
					case "+":
					case "=":
						this.changeHUDSize(0.2);
						break;
					case "-":
					case "_":
						this.changeHUDSize(-0.2);
						break;
					case "0":
						this.resetHUD();
						break;
					case "t":
						this.testWarning();
						break;
				}
			});

			// Escutar eventos de colisão
			this.el.sceneEl.addEventListener("hud-alert", (evt) => {
				this.showWarning(evt.detail.message);
			});

			// Escutar eventos de proximidade de colisão
			this.el.sceneEl.addEventListener("collision-danger", (evt) => {
				this.updateCollisionIndicator("danger", evt.detail.distance);
			});

			this.el.sceneEl.addEventListener("collision-warning", (evt) => {
				this.updateCollisionIndicator("warning", evt.detail.distance);
			});

			this.el.sceneEl.addEventListener("collision-safe", (evt) => {
				this.updateCollisionIndicator("safe", evt.detail.distance);
			});

			// Estado padrão do indicador de colisão
			this.collisionState = {
				level: "safe", // safe, warning, danger
				distance: 999,
				lastUpdate: 0,
			};
		},

		createHUD: function () {
			console.log("🏗️ Criando HUD futurística avançada...");

			// Container principal
			this.hudContainer = document.createElement("a-entity");
			this.hudContainer.setAttribute("id", "hud-advanced-container");
			this.hudContainer.setAttribute(
				"position",
				`${this.parallax.basePosition.x} ${this.parallax.basePosition.y} ${this.parallax.basePosition.z}`
			);

			// Plano do HUD SVG
			this.createHUDPlane();

			// Adicionar à câmera
			this.el.appendChild(this.hudContainer);

			console.log("✅ HUD futurística criada!");
		},

		createHUDPlane: function () {
			const hudPlane = document.createElement("a-plane");
			hudPlane.setAttribute("id", "hud-advanced-plane");
			hudPlane.setAttribute("width", this.data.hudWidth);
			hudPlane.setAttribute("height", this.data.hudHeight);
			hudPlane.setAttribute("position", "0 0 0");

			const timestamp = Date.now();
			hudPlane.setAttribute("material", {
				src: `assets/hud-01.svg?v=${timestamp}`,
				transparent: true,
				opacity: this.data.opacity,
				alphaTest: 0.01,
				color: "#ffffff",
				shader: "flat",
				side: "front",
			});

			this.hudContainer.appendChild(hudPlane);
			this.hudElements.hudPlane = hudPlane;

			console.log("🎯 HUD SVG carregado");
		},

		startUpdateLoop: function () {
			this.updateHUD();
		},

		updateHUD: function () {
			if (!this.data.enabled) {
				requestAnimationFrame(() => this.updateHUD());
				return;
			}

			this.updateDroneData();
			this.updateParallax();
			this.updateSVGElements();
			this.checkWarnings();

			requestAnimationFrame(() => this.updateHUD());
		},

		updateDroneData: function () {
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const position = drone.getAttribute("position");
			const rotation = drone.getAttribute("rotation");
			const droneController = drone.components["drone-controller"];

			// Coordenadas
			this.hudData.coordinates = {
				x: Math.round(position.x),
				y: Math.round(position.y),
				z: Math.round(position.z),
			};

			// Velocidade
			if (droneController && droneController.velocity) {
				this.hudData.speed = Math.round(
					droneController.velocity.length() * 3.6
				);
			}

			// Altitude
			this.hudData.altitude = Math.round(position.y);

			// Orientação
			this.hudData.heading = Math.round(((rotation.y % 360) + 360) % 360);
			this.hudData.pitch = Math.round(rotation.x);
			this.hudData.roll = Math.round(rotation.z);

			// Bateria (simulada)
			const flightTime = (Date.now() - this.startTime) / 1000;
			this.hudData.battery = Math.max(
				5,
				100 - Math.floor(flightTime / 12)
			);

			// Modo de voo
			if (droneController) {
				if (droneController.cinematicMode?.enabled) {
					this.hudData.mode = "CINEMATIC";
				} else if (droneController.fpvMode?.enabled) {
					this.hudData.mode = "FPV/SPORT";
				} else {
					this.hudData.mode = "NORMAL";
				}
			}

			// Distância para checkpoint
			this.calculateDistanceToCheckpoint();

			// Status dos sistemas
			this.updateSystemStatus();
		},

		updateParallax: function () {
			const drone = document.querySelector("#drone");
			if (!drone || !this.hudContainer) return;

			const dronePos = drone.getAttribute("position");
			const droneRot = drone.getAttribute("rotation");

			// Calcular movimento
			const deltaX = dronePos.x - this.parallax.lastDronePosition.x;
			const deltaY = dronePos.y - this.parallax.lastDronePosition.y;
			const deltaZ = dronePos.z - this.parallax.lastDronePosition.z;

			// Aplicar paralaxe
			this.parallax.targetOffset.x +=
				deltaX * this.data.parallaxIntensity;
			this.parallax.targetOffset.y +=
				deltaY * this.data.parallaxIntensity * 0.5;
			this.parallax.targetOffset.z +=
				deltaZ * this.data.parallaxIntensity * 0.3;

			// Suavizar
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
			const maxOffset = 0.08;
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

			// Aplicar posição
			const newPosition = {
				x: this.parallax.basePosition.x + this.parallax.currentOffset.x,
				y: this.parallax.basePosition.y + this.parallax.currentOffset.y,
				z: this.parallax.basePosition.z + this.parallax.currentOffset.z,
			};

			this.hudContainer.setAttribute("position", newPosition);

			// Atualizar última posição
			this.parallax.lastDronePosition = { ...dronePos };
			this.parallax.lastDroneRotation = { ...droneRot };
		},

		updateSVGElements: function () {
			if (!this.hudElements.hudPlane) return;

			const svg =
				this.hudElements.hudPlane.components.material.material.map
					?.image;
			if (!svg || !svg.contentDocument) return;

			const doc = svg.contentDocument;

			// Atualizar indicador de colisão
			this.updateCollisionIndicatorVisual(doc);

			// Atualizar velocidade
			this.updateSVGText(doc, "speedValue", this.hudData.speed);
			this.updateSVGBar(
				doc,
				"speedBar",
				(this.hudData.speed / 200) * 260
			);

			// Atualizar altitude
			this.updateSVGText(doc, "altitudeValue", this.hudData.altitude);
			const altMarkerY = 75 - (this.hudData.altitude / 100) * 35;
			this.updateSVGAttribute(doc, "altMarker", "cy", altMarkerY);

			// Atualizar bateria
			this.updateSVGText(doc, "batteryValue", `${this.hudData.battery}%`);
			const batteryWidth = (this.hudData.battery / 100) * 236;
			this.updateSVGAttribute(doc, "batteryFill", "width", batteryWidth);

			// Cor da bateria
			let batteryColor = "#00ff88";
			if (this.hudData.battery < 20) batteryColor = "#ff0000";
			else if (this.hudData.battery < 50) batteryColor = "#ffaa00";
			this.updateSVGAttribute(doc, "batteryFill", "fill", batteryColor);
			this.updateSVGAttribute(doc, "batteryValue", "fill", batteryColor);

			// Atualizar telemetria
			this.updateSVGText(
				doc,
				"distanceValue",
				`DIST: ${this.hudData.distance}M`
			);
			this.updateSVGText(
				doc,
				"coordsValue",
				`GPS: ${this.hudData.coordinates.x},${this.hudData.coordinates.y},${this.hudData.coordinates.z}`
			);

			// Tempo de missão
			const flightTime = Math.floor((Date.now() - this.startTime) / 1000);
			const minutes = Math.floor(flightTime / 60);
			const seconds = flightTime % 60;
			this.updateSVGText(
				doc,
				"timeValue",
				`TEMPO: ${minutes.toString().padStart(2, "0")}:${seconds
					.toString()
					.padStart(2, "0")}`
			);

			// Modo de voo
			this.updateSVGText(doc, "modeValue", `MODO: ${this.hudData.mode}`);

			// Bússola
			this.updateSVGText(doc, "headingValue", `${this.hudData.heading}°`);

			// Horizonte artificial
			const horizonRotation = -this.hudData.roll;
			this.updateSVGTransform(
				doc,
				"horizonLine",
				`rotate(${horizonRotation})`
			);

			// Roll indicator
			this.updateSVGTransform(
				doc,
				"rollLine",
				`rotate(${this.hudData.roll})`
			);

			// Status dos sistemas
			this.updateSystemIndicators(doc);

			// Objetivo
			this.updateSVGText(doc, "objectiveText", this.hudData.objective);
		},

		updateSVGText: function (doc, id, value) {
			const element = doc.getElementById(id);
			if (element) {
				element.textContent = value;
			}
		},

		updateSVGAttribute: function (doc, id, attr, value) {
			const element = doc.getElementById(id);
			if (element) {
				element.setAttribute(attr, value);
			}
		},

		updateSVGBar: function (doc, id, width) {
			const element = doc.getElementById(id);
			if (element) {
				element.setAttribute(
					"width",
					Math.max(0, Math.min(260, width))
				);
			}
		},

		updateSVGTransform: function (doc, id, transform) {
			const element = doc.getElementById(id);
			if (element) {
				element.setAttribute("transform", transform);
			}
		},

		updateSystemIndicators: function (doc) {
			const systems = ["gps", "imu", "motor", "link"];
			systems.forEach((system) => {
				const status = this.hudData.systems[system];
				const color = status ? "#00ff88" : "#ff0000";
				this.updateSVGAttribute(doc, `${system}Status`, "fill", color);
			});
		},

		calculateDistanceToCheckpoint: function () {
			const drone = document.querySelector("#drone");
			if (!drone) return;

			const dronePos = drone.getAttribute("position");
			const checkpoints = document.querySelectorAll("[checkpoint]");

			let nearestDistance = 999;
			let nearestIndex = 1;

			checkpoints.forEach((checkpoint, index) => {
				const checkpointPos = checkpoint.getAttribute("position");
				const distance = Math.sqrt(
					Math.pow(dronePos.x - checkpointPos.x, 2) +
						Math.pow(dronePos.y - checkpointPos.y, 2) +
						Math.pow(dronePos.z - checkpointPos.z, 2)
				);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestIndex = index + 1;
				}
			});

			this.hudData.distance = Math.round(nearestDistance);
			this.hudData.objective = `CHECKPOINT ${nearestIndex}`;
		},

		updateSystemStatus: function () {
			// Simular status dos sistemas
			this.hudData.systems.gps = true;
			this.hudData.systems.imu = true;
			this.hudData.systems.motor = this.hudData.battery > 10;
			this.hudData.systems.link = true;

			// Simular falhas ocasionais
			if (Math.random() < 0.001) {
				const systems = ["gps", "imu", "link"];
				const randomSystem =
					systems[Math.floor(Math.random() * systems.length)];
				this.hudData.systems[randomSystem] = false;
				setTimeout(() => {
					this.hudData.systems[randomSystem] = true;
				}, 2000);
			}
		},

		checkWarnings: function () {
			const now = Date.now();
			if (now - this.lastWarningTime < 3000) return;

			this.hudData.warnings = [];

			// Avisos de bateria
			if (this.hudData.battery < 20) {
				this.hudData.warnings.push("⚠️ BATERIA CRÍTICA");
				this.lastWarningTime = now;
			} else if (this.hudData.battery < 50) {
				this.hudData.warnings.push("⚠️ BATERIA BAIXA");
			}

			// Avisos de altitude
			if (this.hudData.altitude < 2) {
				this.hudData.warnings.push("⚠️ ALTITUDE BAIXA");
				this.lastWarningTime = now;
			} else if (this.hudData.altitude > 500) {
				this.hudData.warnings.push("⚠️ ALTITUDE ALTA");
			}

			// Avisos de velocidade
			if (this.hudData.speed > 150) {
				this.hudData.warnings.push("⚠️ VELOCIDADE ALTA");
			}

			// Avisos de sistemas
			Object.keys(this.hudData.systems).forEach((system) => {
				if (!this.hudData.systems[system]) {
					this.hudData.warnings.push(
						`⚠️ FALHA: ${system.toUpperCase()}`
					);
					this.lastWarningTime = now;
				}
			});

			// Exibir aviso
			if (this.hudData.warnings.length > 0) {
				this.showWarning(this.hudData.warnings[0]);
			}
		},

		showWarning: function (message) {
			if (!this.hudElements.hudPlane) return;

			const svg =
				this.hudElements.hudPlane.components.material.material.map
					?.image;
			if (!svg || !svg.contentDocument) return;

			const doc = svg.contentDocument;
			this.updateSVGText(doc, "warningText", message);
			this.updateSVGAttribute(doc, "warningText", "opacity", "1");
			this.updateSVGAttribute(doc, "warningBox", "opacity", "0.6");

			setTimeout(() => {
				this.updateSVGAttribute(doc, "warningText", "opacity", "0");
				this.updateSVGAttribute(doc, "warningBox", "opacity", "0");
			}, 2500);
		},

		// === CONTROLES ===

		toggleHUD: function () {
			this.data.enabled = !this.data.enabled;
			if (this.hudContainer) {
				this.hudContainer.setAttribute("visible", this.data.enabled);
			}
			console.log(`HUD ${this.data.enabled ? "ATIVADO" : "DESATIVADO"}`);
		},

		cycleOpacity: function () {
			const levels = [0.3, 0.5, 0.7, 0.9, 1.0];
			const currentIndex = levels.indexOf(this.data.opacity);
			const nextIndex = (currentIndex + 1) % levels.length;
			this.data.opacity = levels[nextIndex];

			if (this.hudElements.hudPlane) {
				this.hudElements.hudPlane.setAttribute(
					"material.opacity",
					this.data.opacity
				);
			}

			console.log(`Opacidade: ${Math.round(this.data.opacity * 100)}%`);
		},

		reloadHUD: function () {
			console.log("🔄 Recarregando HUD...");

			if (this.hudContainer) {
				this.hudContainer.parentNode.removeChild(this.hudContainer);
			}

			setTimeout(() => {
				this.createHUD();
				console.log("✅ HUD recarregado!");
			}, 100);
		},

		changeHUDSize: function (delta) {
			this.data.hudWidth = Math.max(
				3.0,
				Math.min(8.0, this.data.hudWidth + delta)
			);
			this.data.hudHeight = Math.max(
				2.0,
				Math.min(5.0, this.data.hudHeight + delta * 0.5625)
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

			console.log(
				`Tamanho: ${this.data.hudWidth.toFixed(
					1
				)}x${this.data.hudHeight.toFixed(1)}`
			);
		},

		resetHUD: function () {
			this.data.hudWidth = 4.8;
			this.data.hudHeight = 2.7;
			this.data.opacity = 0.9;
			this.data.hudDistance = 2.5;

			this.reloadHUD();
			console.log("🔄 HUD resetado");
		},

		testWarning: function () {
			const warnings = [
				"⚠️ TESTE DE AVISO",
				"⚠️ BATERIA CRÍTICA",
				"⚠️ ALTITUDE BAIXA",
				"⚠️ FALHA: GPS",
			];
			const randomWarning =
				warnings[Math.floor(Math.random() * warnings.length)];
			this.showWarning(randomWarning);
		},

		// === SISTEMA DE INDICADOR DE COLISÃO ===

		updateCollisionIndicator: function (level, distance) {
			const now = Date.now();

			// Determinar nível baseado na distância
			let newLevel = "safe";
			if (distance < 4) {
				newLevel = "danger";
			} else if (distance < 8) {
				newLevel = "warning";
			}

			// Log para debug
			if (this.collisionState.level !== newLevel) {
				console.log(
					`🎯 Indicador de colisão: ${newLevel.toUpperCase()} (${distance.toFixed(
						2
					)}m)`
				);
			}

			// Atualizar estado
			this.collisionState.level = newLevel;
			this.collisionState.distance = distance;
			this.collisionState.lastUpdate = now;
		},

		updateCollisionIndicatorVisual: function (doc) {
			if (!doc) return;

			const now = Date.now();
			const timeSinceUpdate = now - this.collisionState.lastUpdate;

			// Se passou mais de 500ms sem atualização, voltar para seguro
			if (timeSinceUpdate > 500) {
				this.collisionState.level = "safe";
				this.collisionState.distance = 999;
			}

			const center = doc.getElementById("collisionWarningCenter");
			const middle = doc.getElementById("collisionWarningMiddle");
			const outer = doc.getElementById("collisionWarningOuter");
			const glow = doc.getElementById("collisionGlowOuter");
			const pulse = doc.getElementById("collisionPulse");

			if (!center || !middle || !outer || !pulse || !glow) return;

			// Configurar cores e animações baseado no nível
			switch (this.collisionState.level) {
				case "danger":
					// VERMELHO - Perigo iminente (< 1.5m)
					center.setAttribute("fill", "#ff0000");
					center.setAttribute("opacity", "1");
					glow.setAttribute("fill", "#ff0000");
					glow.setAttribute("opacity", "0.5");
					middle.setAttribute("stroke", "#ff0000");
					middle.setAttribute("opacity", "0.8");
					outer.setAttribute("stroke", "#ff0000");
					outer.setAttribute("opacity", "0.6");

					// Pulso rápido
					pulse.setAttribute("values", "1;0.3;1");
					pulse.setAttribute("dur", "0.3s");

					// Aumentar tamanho
					center.setAttribute("r", "11");
					glow.setAttribute("r", "16");
					middle.setAttribute("r", "18");
					outer.setAttribute("r", "22");
					break;

				case "warning":
					// AMARELO - Proximidade moderada (1.5m - 3m)
					center.setAttribute("fill", "#ffff00");
					center.setAttribute("opacity", "0.9");
					glow.setAttribute("fill", "#ffff00");
					glow.setAttribute("opacity", "0.4");
					middle.setAttribute("stroke", "#ffff00");
					middle.setAttribute("opacity", "0.6");
					outer.setAttribute("stroke", "#ffff00");
					outer.setAttribute("opacity", "0.3");

					// Pulso médio
					pulse.setAttribute("values", "0.9;0.4;0.9");
					pulse.setAttribute("dur", "0.8s");

					// Tamanho médio
					center.setAttribute("r", "10");
					glow.setAttribute("r", "15");
					middle.setAttribute("r", "17");
					outer.setAttribute("r", "21");
					break;

				case "safe":
				default:
					// VERDE - Distância segura (> 3m)
					center.setAttribute("fill", "#00ff00");
					center.setAttribute("opacity", "0.8");
					glow.setAttribute("fill", "#00ff00");
					glow.setAttribute("opacity", "0.3");
					middle.setAttribute("stroke", "#00ff00");
					middle.setAttribute("opacity", "0");
					outer.setAttribute("stroke", "#00ff00");
					outer.setAttribute("opacity", "0");

					// Pulso suave
					pulse.setAttribute("values", "0.8;0.5;0.8");
					pulse.setAttribute("dur", "2s");

					// Tamanho normal
					center.setAttribute("r", "9");
					glow.setAttribute("r", "14");
					middle.setAttribute("r", "16");
					outer.setAttribute("r", "20");
					break;
			}
		},

		remove: function () {
			if (this.hudContainer && this.hudContainer.parentNode) {
				this.hudContainer.parentNode.removeChild(this.hudContainer);
			}
		},
	});

	console.log("📦 HUD Advanced Controller carregado!");
}
