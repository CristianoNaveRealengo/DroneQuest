/**
 * Controlador do Drone para Meta Quest 3
 * Sistema avançado de controle com física realista e suporte a VR
 */

// Registrar o componente no A-Frame apenas se não estiver registrado
if (!AFRAME.components["drone-controller"]) {
	AFRAME.registerComponent("drone-controller", {
		schema: {
			// Configurações de movimento (valores realistas para drone)
			maxSpeed: { type: "number", default: 3 }, // Reduzido de 6 para 3 m/s (~11 km/h)
			acceleration: { type: "number", default: 1.5 }, // Reduzido de 3 para 1.5 m/s²
			rotationSpeed: { type: "number", default: 0.6 }, // Reduzido de 1.2 para 0.6 rad/s

			// Configurações de física (ajustadas para realismo)
			mass: { type: "number", default: 0.5 }, // Massa mais leve
			drag: { type: "number", default: 0.92 }, // Mais resistência ao ar
			angularDrag: { type: "number", default: 0.88 }, // Mais resistência angular

			// Configurações de estabilização (melhor estabilidade)
			stabilization: { type: "number", default: 0.25 }, // Maior estabilização
			autoLevel: { type: "boolean", default: true },

			// Configurações de estabilização de altitude
			minAltitude: { type: "number", default: 0.5 }, // Altitude mínima de 0.5m
			targetAltitude: { type: "number", default: 0.5 }, // Altitude alvo inicial
			altitudeStabilization: { type: "boolean", default: true }, // Ativar estabilização de altitude
			altitudeStabilizationForce: { type: "number", default: 1.0 }, // Força da estabilização reduzida

			// Configurações de estabilização automática quando não toca o solo
			groundStabilization: { type: "boolean", default: true }, // Ativar estabilização quando não toca o solo
			groundDetectionHeight: { type: "number", default: 0.6 }, // Altura para detectar se está "tocando" o solo
			stabilizationLift: { type: "number", default: 2.0 }, // Força de subida para estabilização (mais forte)
			stabilizationSmoothing: { type: "number", default: 0.5 }, // Suavização da estabilização (mais responsiva)

			// Configurações de controle
			deadzone: { type: "number", default: 0.1 },
			sensitivity: { type: "number", default: 1.0 },

			// Configurações de hover realista
			hoverThrust: { type: "number", default: 6.0 }, // Empuxo aumentado para melhor sustentação
			hoverStability: { type: "number", default: 0.4 }, // Estabilidade do hover reduzida
			windResistance: { type: "number", default: 0.02 }, // Resistência ao vento
		},

		init: function () {
			console.log("🚁 Inicializando controlador do drone...");

			// Vetores de movimento e rotação
			this.velocity = new THREE.Vector3();
			this.angularVelocity = new THREE.Vector3();
			this.targetRotation = new THREE.Euler();

			// Estado do drone
			this.isActive = false; // Corrigido: adicionado estado de ativação
			this.isFlying = false;
			this.currentSpeed = 0;
			this.batteryLevel = 100;

			// Sistema de hover realista
			this.thrustPower = 0; // Potência atual das hélices (0-1)
			this.targetThrust = 0; // Potência alvo das hélices
			this.hoverHeight = 3; // Altura preferida para hover
			this.isHovering = false; // Estado de hover automático

			// Sistema de estabilização quando não toca o solo
			this.isGrounded = false; // Se está tocando o solo
			this.lastGroundCheck = 0; // Último tempo de verificação do solo
			this.stabilizationActive = false; // Se a estabilização automática está ativa
			this.stabilizationStartTime = 0; // Quando a estabilização começou

			// Iniciar o drone automaticamente após 1 segundo
			setTimeout(() => {
				console.log("🚁 Ativando drone automaticamente...");
				this.activateDrone();

				// Garantir que está voando
				setTimeout(() => {
					if (!this.isFlying) {
						console.log("🚁 Forçando ativação do voo...");
						this.isFlying = true;
						this.isActive = true;
					}
				}, 500);
			}, 1000);

			// Inicializar animações das hélices
			setTimeout(() => {
				this.initPropellerAnimations();
			}, 100);

			// Controles VR
			this.leftController = null;
			this.rightController = null;
			this.leftStick = { x: 0, y: 0 };
			this.rightStick = { x: 0, y: 0 };
			this.leftTriggerPressed = false;
			this.rightTriggerPressed = false;

			// Simulador VR para testes com teclado
			this.VR_SIMULATOR = {
				leftStick: { x: 0, y: 0 },
				rightStick: { x: 0, y: 0 },
				leftTrigger: false,
				rightTrigger: false,
			};

			// Inicializar variáveis de controle de movimento
			this.targetForwardSpeed = 0;
			this.targetStrafeSpeed = 0;
			this.targetAltitudeChange = 0;
			this.targetYawRotation = 0;
			this.targetPitchRotation = 0;

			// Variáveis para simulação de voo realista estabilizado
			this.flightSimulation = {
				enabled: true,
				naturalHover: true, // Ativar hover natural com oscilações
				oscillationAmplitude: 0.05, // Amplitude das oscilações reduzida (±5cm)
				oscillationSpeed: 0.001, // Velocidade das oscilações mais lenta
				baseAltitude: 3.0, // Altitude base para manter
				lastOscillationUpdate: 0,
				stabilizationStrength: 0.3, // Força da estabilização reduzida
			};

			// Controles de teclado (fallback)
			this.keys = {};
			this.setupKeyboardControls();

			// Configurar controles VR quando a cena carregar
			this.el.sceneEl.addEventListener("loaded", () => {
				this.setupVRControls();
			});

			// Configurar física
			this.setupPhysics();

			// Efeitos visuais
			this.setupVisualEffects();

			// Sistema de som (placeholder)
			this.setupAudioSystem();

			// Estabilizar drone na posição inicial
			this.stabilizeInitialPosition();

			console.log("✅ Controlador do drone inicializado com sucesso!");
		},

		setupVRControls: function () {
			console.log("🎮 Configurando controles VR...");

			// Salvar referência ao contexto this
			const self = this;

			// Aguardar carregamento dos controles VR
			setTimeout(function () {
				self.leftController = document.querySelector("#leftHand");
				self.rightController = document.querySelector("#rightHand");

				// Configurar controle esquerdo se disponível
				if (self.leftController) {
					console.log(
						"🔍 Debug: Verificando funções do controle esquerdo..."
					);
					console.log(
						"onLeftStickMove:",
						typeof self.onLeftStickMove,
						self.onLeftStickMove
					);
					console.log(
						"onLeftTriggerDown:",
						typeof self.onLeftTriggerDown,
						self.onLeftTriggerDown
					);
					console.log(
						"onLeftTriggerUp:",
						typeof self.onLeftTriggerUp,
						self.onLeftTriggerUp
					);
					console.log(
						"onLeftGripDown:",
						typeof self.onLeftGripDown,
						self.onLeftGripDown
					);
					console.log(
						"onLeftGripUp:",
						typeof self.onLeftGripUp,
						self.onLeftGripUp
					);

					// Verificar e configurar cada evento individualmente
					if (typeof self.onLeftStickMove === "function") {
						self.leftController.addEventListener(
							"thumbstickmoved",
							self.onLeftStickMove.bind(self)
						);
					} else {
						console.warn(
							"⚠️ onLeftStickMove não é uma função:",
							typeof self.onLeftStickMove
						);
					}
					if (typeof self.onLeftTriggerDown === "function") {
						self.leftController.addEventListener(
							"triggerdown",
							self.onLeftTriggerDown.bind(self)
						);
					} else {
						console.warn(
							"⚠️ onLeftTriggerDown não é uma função:",
							typeof self.onLeftTriggerDown
						);
					}
					if (typeof self.onLeftTriggerUp === "function") {
						self.leftController.addEventListener(
							"triggerup",
							self.onLeftTriggerUp.bind(self)
						);
					} else {
						console.warn(
							"⚠️ onLeftTriggerUp não é uma função:",
							typeof self.onLeftTriggerUp
						);
					}
					if (typeof self.onLeftGripDown === "function") {
						self.leftController.addEventListener(
							"gripdown",
							self.onLeftGripDown.bind(self)
						);
					} else {
						console.warn(
							"⚠️ onLeftGripDown não é uma função:",
							typeof self.onLeftGripDown
						);
					}
					if (typeof self.onLeftGripUp === "function") {
						self.leftController.addEventListener(
							"gripup",
							self.onLeftGripUp.bind(self)
						);
					} else {
						console.warn(
							"⚠️ onLeftGripUp não é uma função:",
							typeof self.onLeftGripUp
						);
					}

					console.log("✅ Controle esquerdo configurado");
				}

				// Configurar controle direito se disponível
				if (self.rightController) {
					// Verificar e configurar cada evento individualmente
					if (typeof self.onRightStickMove === "function") {
						self.rightController.addEventListener(
							"thumbstickmoved",
							self.onRightStickMove.bind(self)
						);
					}
					if (typeof self.onRightTriggerDown === "function") {
						self.rightController.addEventListener(
							"triggerdown",
							self.onRightTriggerDown.bind(self)
						);
					}
					if (typeof self.onRightTriggerUp === "function") {
						self.rightController.addEventListener(
							"triggerup",
							self.onRightTriggerUp.bind(self)
						);
					}
					if (typeof self.onRightButtonDown === "function") {
						self.rightController.addEventListener(
							"buttondown",
							self.onRightButtonDown.bind(self)
						);
					}

					console.log("✅ Controle direito configurado");
				}

				// Se não há controladores VR, usar apenas teclado
				if (!self.leftController && !self.rightController) {
					console.log(
						"ℹ️ Controladores VR não encontrados, usando apenas teclado"
					);
				}
			}, 1000);
		},

		setupKeyboardControls: function () {
			// Controles de teclado para teste em desktop
			window.addEventListener("keydown", (e) => {
				this.keys[e.code] = true;
				this.handleKeyboardSpecialActions(e.code, true);
			});

			window.addEventListener("keyup", (e) => {
				this.keys[e.code] = false;
				this.handleKeyboardSpecialActions(e.code, false);
			});

			// Mostrar controles na tela
			this.showKeyboardHelp();
		},

		showKeyboardHelp: function () {
			const helpPanel = document.createElement("div");
			helpPanel.id = "keyboard-help";
			helpPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
        `;

			helpPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🎮 Controles:</div>
            <div style="color: #00ff00; font-weight: bold; margin-bottom: 3px;">🥽 VR Simulado (Alavancas):</div>
            <div>Z/X - Descer/Subir (Alavanca Esquerda Y) ⚠️ INVERTIDO</div>
            <div>Q/E - Giro esquerda/direita (Alavanca Esquerda X)</div>
            <div>I/K - Frente/Trás (Alavanca Direita Y)</div>
            <div>J/L - Esquerda/Direita (Alavanca Direita X)</div>
            <div style="color: #ffff00; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">⌨️ Teclado Tradicional:</div>
            <div>WASD - Movimento (frente/trás/esquerda/direita)</div>
            <div>↑↓ - Subir/Descer</div>
            <div>←→ - Rotação (esquerda/direita)</div>
            <div style="color: #ff8800; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">🔧 Comandos Gerais:</div>
            <div>Space - Ligar/Desligar drone</div>
            <div>Shift - Modo boost</div>
            <div>R - Reset posição</div>
            <div>T - Toggle auto-nivelamento</div>
            <div>G - Toggle estabilização de solo</div>
            <div>F - Toggle estatísticas</div>
            <div>M - Mutar/Desmutar áudio</div>
            <div>+/- - Aumentar/Diminuir volume</div>
            <div>1/2/3 - Qualidade baixa/média/alta</div>
            <div>H - Definir altitude atual como base</div>
        `;

			document.body.appendChild(helpPanel);

			// Auto-ocultar após 10 segundos
			setTimeout(() => {
				if (helpPanel.parentNode) {
					helpPanel.style.opacity = "0.3";
				}
			}, 10000);
		},

		setQuality: function (level) {
			const scene = this.el.sceneEl;
			if (scene.components["performance-monitor"]) {
				scene.components["performance-monitor"].setQuality(level);
				console.log(`🎮 Qualidade definida para: ${level}`);
			}
		},

		setNewBaseAltitude: function () {
			const currentPosition = this.el.getAttribute("position");
			const newBaseAltitude = currentPosition.y;

			// Atualizar altitude base da simulação
			this.flightSimulation.baseAltitude = newBaseAltitude;
			this.hoverHeight = newBaseAltitude;
			this.data.targetAltitude = newBaseAltitude;

			console.log(
				`🎯 Nova altitude base definida: ${newBaseAltitude.toFixed(2)}m`
			);

			// Mostrar feedback visual
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 100, 0, 0.9);
				color: white;
				padding: 20px;
				border-radius: 10px;
				font-size: 18px;
				z-index: 1000;
				pointer-events: none;
			`;
			indicator.textContent = `🎯 Altitude base: ${newBaseAltitude.toFixed(
				1
			)}m`;
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 2000);
		},

		adjustMasterVolume: function (delta) {
			const audioSystem = this.el.sceneEl.components["audio-system"];
			if (audioSystem) {
				const currentVolume = audioSystem.data.masterVolume;
				const newVolume = Math.max(
					0,
					Math.min(1, currentVolume + delta)
				);
				audioSystem.setMasterVolume(newVolume);

				// Mostrar feedback visual
				this.showVolumeIndicator(newVolume);
			}
		},

		showVolumeIndicator: function (volume) {
			const percentage = Math.round(volume * 100);
			const indicator = document.createElement("div");
			indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            z-index: 1000;
            pointer-events: none;
        `;
			indicator.textContent = `🔊 Volume: ${percentage}%`;
			document.body.appendChild(indicator);

			setTimeout(() => {
				document.body.removeChild(indicator);
			}, 1500);
		},

		setupPhysics: function () {
			// Configurar propriedades físicas do drone
			const physicsBody = this.el.getAttribute("physics-body");
			if (physicsBody) {
				this.el.setAttribute("physics-body", {
					type: "dynamic",
					mass: this.data.mass,
					linearDamping: 0.1,
					angularDamping: 0.1,
					shape: "box",
				});
			}
		},

		setupVisualEffects: function () {
			// Configurar efeitos visuais das hélices
			this.propellers = [
				this.el.querySelector("#prop1"),
				this.el.querySelector("#prop2"),
				this.el.querySelector("#prop3"),
				this.el.querySelector("#prop4"),
			];

			// Configurar luzes LED
			this.setupDroneLights();
		},

		setupDroneLights: function () {
			// Sistema de luzes LED do drone baseado no estado
			this.ledElements = this.el.querySelectorAll(
				'[material*="emissive"]'
			);
		},

		setupAudioSystem: function () {
			// Integração com o sistema de áudio global
			// O audio-system gerencia os sons do drone, respeitando masterVolume e mute
			this.lastMovementIntensity = 0;
			this.audioSystem = this.el.sceneEl.components["audio-system"];
		},

		setupMotorSound: function () {
			// Som do motor agora é gerenciado pelo audio-system.
			// Esta função permanece por compatibilidade, mas não cria áudio próprio.
		},

		stabilizeInitialPosition: function () {
			// Aguardar um frame para garantir que a posição inicial foi definida
			setTimeout(() => {
				const currentPosition = this.el.getAttribute("position");

				// Definir a altura de hover como a altura atual do drone
				this.hoverHeight = currentPosition.y;

				// Atualizar altitude base da simulação para a posição atual
				this.flightSimulation.baseAltitude = currentPosition.y;

				// Zerar velocidades para evitar movimento inicial
				this.velocity.set(0, 0, 0);
				this.angularVelocity.set(0, 0, 0);

				// Definir empuxo inicial para manter posição (70%)
				this.thrustPower = 0.7; // Empuxo em 70% para melhor sustentação
				this.targetThrust = 0.7;

				// Ativar modo hover para estabilidade
				this.isHovering = true;

				console.log(
					`🎯 Drone estabilizado na altura: ${this.hoverHeight.toFixed(
						2
					)}m (base: ${this.flightSimulation.baseAltitude.toFixed(
						2
					)}m)`
				);
			}, 100);
		},

		updateAudioFeedback: function (movementVector) {
			// Enviar intensidade de movimento para o sistema de áudio
			const movementIntensity = movementVector.length();
			this.lastMovementIntensity = movementIntensity;

			const audioSystem = this.el.sceneEl.components["audio-system"];
			if (audioSystem) {
				audioSystem.updatePropellerSound(movementIntensity);
			}

			// Emitir evento para compatibilidade com listeners existentes
			if (this.el.sceneEl) {
				this.el.sceneEl.emit("drone-throttle-change", {
					intensity: movementIntensity,
				});
			}
		},

		// === EVENTOS DOS CONTROLES VR ===

		onLeftStickMove: function (evt) {
			const x = this.applyDeadzone(evt.detail.x);
			const y = this.applyDeadzone(evt.detail.y);

			this.leftStick.x = x;
			this.leftStick.y = y;

			// Alavanca Esquerda: Altitude (Y) e Giro no próprio eixo/Yaw (X) - INVERTIDO
			this.targetAltitudeChange = -y * this.data.maxSpeed * 0.6; // Cima/Baixo (Y) - INVERTIDO
			this.targetYawRotation = -x * this.data.rotationSpeed; // Giro no próprio eixo (X)

			console.log(
				`🕹️ Alavanca Esquerda: x=${x.toFixed(2)}, y=${y.toFixed(
					2
				)} | Altitude=${this.targetAltitudeChange.toFixed(
					2
				)}, Yaw=${this.targetYawRotation.toFixed(2)}`
			);
		},

		onRightStickMove: function (evt) {
			const x = this.applyDeadzone(evt.detail.x);
			const y = this.applyDeadzone(evt.detail.y);

			this.rightStick.x = x;
			this.rightStick.y = y;

			// Alavanca Direita: Movimento frente/trás (Y) e direita/esquerda (X)
			this.targetForwardSpeed = -y * this.data.maxSpeed; // Frente/Trás (Y)
			this.targetStrafeSpeed = x * this.data.maxSpeed; // Direita/Esquerda (X)

			console.log(
				`🕹️ Alavanca Direita: x=${x.toFixed(2)}, y=${y.toFixed(
					2
				)} | Forward=${this.targetForwardSpeed.toFixed(
					2
				)}, Strafe=${this.targetStrafeSpeed.toFixed(2)}`
			);
		},

		onLeftTriggerDown: function () {
			// Trigger esquerdo: Ativar/Desativar drone
			this.leftTriggerPressed = true;
			this.activateDrone();
			console.log("🎮 Trigger esquerdo pressionado");
		},

		onLeftTriggerUp: function () {
			this.leftTriggerPressed = false;
			console.log("🎮 Trigger esquerdo solto");
		},

		activateDrone: function () {
			if (this.isActive) {
				console.log("🚁 Drone desativado");
				this.isActive = false;
				this.velocity.set(0, 0, 0);
				this.angularVelocity.set(0, 0, 0);

				// Emitir evento de desativação
				this.el.emit("drone-deactivated");
			} else {
				console.log("🚁 Drone ativado");
				this.isActive = true;

				// Iniciar o voo
				this.isFlying = true;

				// Emitir evento de ativação
				this.el.emit("drone-activated");

				// Iniciar o jogo se ainda não estiver iniciado
				const gameManager = document.querySelector("[game-manager]");
				if (gameManager && gameManager.components["game-manager"]) {
					const gameComponent =
						gameManager.components["game-manager"];
					if (!gameComponent.gameState.isPlaying) {
						gameComponent.startGame();
					}
				}
			}
		},

		onLeftGripDown: function () {
			// Grip esquerdo: Modo de estabilização automática
			this.data.autoLevel = !this.data.autoLevel;
			console.log(
				`🎯 Auto-nivelamento: ${this.data.autoLevel ? "ON" : "OFF"}`
			);
		},

		onLeftGripUp: function () {
			// Grip esquerdo solto: Log para debug
			console.log("🎯 Grip esquerdo solto");
		},

		onRightTriggerDown: function () {
			// Trigger direito: Modo boost
			this.rightTriggerPressed = true;
			this.boostMode = true;
			console.log("⚡ Modo boost ativado!");
		},

		onRightTriggerUp: function () {
			this.rightTriggerPressed = false;
			this.boostMode = false;
			console.log("⚡ Modo boost desativado");
		},

		onRightButtonDown: function (evt) {
			// Botões do controle direito para funções especiais
			if (evt.detail.id === 0) {
				// Botão A
				this.resetDronePosition();
			} else if (evt.detail.id === 1) {
				// Botão B
				this.emergencyStop();
			}
		},

		// === CONTROLES DE TECLADO (FALLBACK) ===

		handleKeyboardSpecialActions: function (keyCode, isPressed) {
			if (isPressed) {
				switch (keyCode) {
					case "Space":
						this.isFlying = !this.isFlying;
						this.updatePropellerEffects(this.isFlying);
						console.log(
							`🚁 Drone ${
								this.isFlying ? "ativado" : "desativado"
							}`
						);
						break;
					// KeyR removido - reset é gerenciado pelo game-manager.js
					// case 'KeyR':
					//     this.resetDronePosition();
					//     break;
					case "KeyT":
						this.data.autoLevel = !this.data.autoLevel;
						console.log(
							`🎯 Auto-nivelamento: ${
								this.data.autoLevel ? "ON" : "OFF"
							}`
						);
						break;
					case "KeyG":
						this.data.groundStabilization =
							!this.data.groundStabilization;
						console.log(
							`🌍 Estabilização de solo: ${
								this.data.groundStabilization ? "ON" : "OFF"
							}`
						);
						break;
					case "ShiftLeft":
						this.boostMode = true;
						console.log("⚡ Modo boost ativado!");
						break;
					case "KeyP":
						// Toggle pause
						this.el.emit("toggle-pause");
						break;
					case "KeyF":
						// Toggle stats de performance
						const scene = this.el.sceneEl;
						if (scene.components["performance-monitor"]) {
							scene.components[
								"performance-monitor"
							].toggleStats();
						}
						break;
					case "KeyM":
						// Toggle mute audio
						const audioSystem =
							this.el.sceneEl.components["audio-system"];
						if (audioSystem) {
							audioSystem.toggleMute();
						}
						break;
					case "Minus":
					case "NumpadSubtract":
						// Diminuir volume
						this.adjustMasterVolume(-0.1);
						break;
					case "Equal":
					case "Plus":
					case "NumpadAdd":
						// Aumentar volume
						this.adjustMasterVolume(0.1);
						break;
					case "Digit1":
						// Qualidade baixa
						this.setQuality("low");
						break;
					case "Digit2":
						// Qualidade média
						this.setQuality("medium");
						break;
					case "Digit3":
						// Qualidade alta
						this.setQuality("high");
						break;
					case "KeyH":
						// Definir altitude atual como nova altitude base
						this.setNewBaseAltitude();
						break;

					// === CONTROLES VR SIMULADOS ===
					// Alavanca Esquerda: Altitude e Giro - INVERTIDO
					case "KeyZ": // Descer (altitude negativa) - INVERTIDO
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.y = -0.8;
							this.targetAltitudeChange =
								-0.8 * this.data.maxSpeed * 0.6;
						}
						break;
					case "KeyX": // Subir (altitude positiva) - INVERTIDO
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.y = 0.8;
							this.targetAltitudeChange =
								0.8 * this.data.maxSpeed * 0.6;
						}
						break;
					case "KeyQ": // Giro esquerda (yaw negativo)
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.x = -0.8;
							this.targetYawRotation =
								0.8 * this.data.rotationSpeed;
						}
						break;
					case "KeyE": // Giro direita (yaw positivo)
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.x = 0.8;
							this.targetYawRotation =
								-0.8 * this.data.rotationSpeed;
						}
						break;

					// Alavanca Direita: Movimento frente/trás e direita/esquerda
					case "KeyI": // Frente
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.rightStick.y = 0.8;
							this.targetForwardSpeed = 0.8 * this.data.maxSpeed;
						}
						break;
					case "KeyK": // Trás
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.rightStick.y = -0.8;
							this.targetForwardSpeed = -0.8 * this.data.maxSpeed;
						}
						break;
					case "KeyJ": // Esquerda
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.rightStick.x = -0.8;
							this.targetStrafeSpeed = -0.8 * this.data.maxSpeed;
						}
						break;
					case "KeyL": // Direita
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.rightStick.x = 0.8;
							this.targetStrafeSpeed = 0.8 * this.data.maxSpeed;
						}
						break;
				}
			} else {
				if (keyCode === "ShiftLeft") {
					this.boostMode = false;
					console.log("⚡ Modo boost desativado");
				}

				// Reset dos controles VR simulados quando teclas são soltas
				if (this.VR_SIMULATOR) {
					switch (keyCode) {
						case "KeyZ":
						case "KeyX":
							this.VR_SIMULATOR.leftStick.y = 0;
							this.targetAltitudeChange = 0;
							break;
						case "KeyQ":
						case "KeyE":
							this.VR_SIMULATOR.leftStick.x = 0;
							this.targetYawRotation = 0;
							break;
						case "KeyI":
						case "KeyK":
							this.VR_SIMULATOR.rightStick.y = 0;
							this.targetForwardSpeed = 0;
							break;
						case "KeyJ":
						case "KeyL":
							this.VR_SIMULATOR.rightStick.x = 0;
							this.targetStrafeSpeed = 0;
							break;
					}
				}
			}
		},

		// === SISTEMA DE MOVIMENTO ===

		simulateRealisticFlight: function (time) {
			if (
				!this.flightSimulation.enabled ||
				!this.isActive ||
				!this.isFlying
			)
				return;

			// Verificar se há entrada manual do usuário
			const hasManualInput = this.hasKeyboardInput() || this.hasVRInput();
			const hasManualAltitudeInput =
				Math.abs(this.targetAltitudeChange) > 0.1;

			// Se há entrada manual, não aplicar simulação automática
			if (hasManualInput || hasManualAltitudeInput) {
				return;
			}

			// Sistema de hover natural com oscilações suaves
			if (this.flightSimulation.naturalHover) {
				const currentTime = time;
				const position = this.el.getAttribute("position");

				// Calcular oscilação natural baseada no tempo
				const oscillationPhase =
					currentTime * this.flightSimulation.oscillationSpeed;
				const primaryOscillation =
					Math.sin(oscillationPhase) *
					this.flightSimulation.oscillationAmplitude;

				// Adicionar uma segunda oscilação mais sutil para mais realismo
				const secondaryOscillation =
					Math.sin(oscillationPhase * 1.7 + 0.2) *
					(this.flightSimulation.oscillationAmplitude * 0.3);

				// Combinar oscilações
				const totalOscillation =
					primaryOscillation + secondaryOscillation;

				// Calcular diferença da altitude alvo (incluindo oscilação)
				const targetAltitudeWithOscillation =
					this.flightSimulation.baseAltitude + totalOscillation;
				const altitudeDifference =
					targetAltitudeWithOscillation - position.y;

				// Aplicar força de estabilização suave
				const stabilizationForce =
					altitudeDifference *
					this.flightSimulation.stabilizationStrength;

				// Limitar a força para evitar movimentos bruscos (muito mais restritivo)
				const maxForce = 0.08; // Reduzido de 0.15 para 0.08
				const limitedForce = Math.max(
					-maxForce,
					Math.min(maxForce, stabilizationForce)
				);

				// Aplicar a força de estabilização
				this.targetAltitudeChange += limitedForce;

				// Log ocasional para debug (a cada 3 segundos)
				if (
					currentTime -
						(this.flightSimulation.lastOscillationUpdate || 0) >
					3000
				) {
					console.log(
						`🌊 Hover natural: altitude=${position.y.toFixed(
							2
						)}m, alvo=${targetAltitudeWithOscillation.toFixed(
							2
						)}m, força=${limitedForce.toFixed(3)}`
					);
					this.flightSimulation.lastOscillationUpdate = currentTime;
				}
			}
		},

		tick: function (time, timeDelta) {
			// Simular voo realista com descidas e subidas automáticas
			this.simulateRealisticFlight(time);

			// Processar entrada de controles
			this.processControlInput();

			// Aplicar movimento com física realista
			this.applyMovement(timeDelta);

			// Aplicar rotação
			this.applyRotation(timeDelta);

			// Aplicar física realista (gravidade, hover, arrasto)
			this.applyRealisticPhysics(timeDelta);

			// Atualizar efeitos visuais
			this.updateAdvancedPropellerEffects();
			this.updateVisualEffects();

			// Atualizar HUD
			this.updateHUD();
		},

		processControlInput: function () {
			// Resetar valores de entrada apenas se não há entrada VR ativa
			if (!this.hasVRInput()) {
				this.targetForwardSpeed = 0;
				this.targetStrafeSpeed = 0;
				this.targetAltitudeChange = 0;
				this.targetYawRotation = 0;
			}
			this.targetPitchRotation = 0;

			// Processar controles de teclado (sobrescreve VR se teclado estiver sendo usado)
			this.processKeyboardInput();

			// Aplicar boost se ativo
			if (this.boostMode) {
				this.targetForwardSpeed *= 1.5;
				this.targetStrafeSpeed *= 1.5;
				this.targetAltitudeChange *= 1.5;
			}
		},

		hasVRInput: function () {
			// Verificar se há entrada ativa das alavancas VR
			return (
				Math.abs(this.leftStick.x) > this.data.deadzone ||
				Math.abs(this.leftStick.y) > this.data.deadzone ||
				Math.abs(this.rightStick.x) > this.data.deadzone ||
				Math.abs(this.rightStick.y) > this.data.deadzone
			);
		},

		processKeyboardInput: function () {
			const speed = this.data.maxSpeed * this.data.sensitivity;

			// Movimento WASD (frente/trás/esquerda/direita)
			if (this.keys["KeyW"]) this.targetForwardSpeed = speed;
			if (this.keys["KeyS"]) this.targetForwardSpeed = -speed;
			if (this.keys["KeyA"]) this.targetStrafeSpeed = -speed;
			if (this.keys["KeyD"]) this.targetStrafeSpeed = speed;

			// Altitude com setas verticais (↑/↓)
			if (this.keys["ArrowUp"]) this.targetAltitudeChange = speed * 0.3; // Seta para cima = SOBE
			if (this.keys["ArrowDown"])
				this.targetAltitudeChange = -speed * 0.3; // Seta para baixo = DESCE

			// Rotação yaw com setas horizontais (esquerda/direita)
			if (this.keys["ArrowLeft"])
				this.targetYawRotation = this.data.rotationSpeed;
			if (this.keys["ArrowRight"])
				this.targetYawRotation = -this.data.rotationSpeed;
		},

		applyMovement: function (timeDelta) {
			const position = this.el.getAttribute("position");
			const rotation = this.el.getAttribute("rotation");

			// Converter rotação para quaternion
			const quaternion = new THREE.Quaternion();
			quaternion.setFromEuler(
				new THREE.Euler(
					THREE.MathUtils.degToRad(rotation.x),
					THREE.MathUtils.degToRad(rotation.y),
					THREE.MathUtils.degToRad(rotation.z)
				)
			);

			// Calcular velocidade baseada na entrada
			const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(
				quaternion
			);
			const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(
				quaternion
			);
			const upVector = new THREE.Vector3(0, 1, 0);

			// Aplicar forças
			const deltaTime = timeDelta / 1000;
			const acceleration = this.data.acceleration * deltaTime;

			this.velocity.add(
				forwardVector.multiplyScalar(
					this.targetForwardSpeed * acceleration
				)
			);
			this.velocity.add(
				rightVector.multiplyScalar(
					this.targetStrafeSpeed * acceleration
				)
			);

			// Sistema de estabilização de altitude
			let altitudeForce = this.targetAltitudeChange;

			// NOVA FUNCIONALIDADE: Estabilização quando não toca o solo (temporariamente desabilitada)
			// const groundStabilizationForce = this.applyGroundStabilization(deltaTime);
			// altitudeForce += groundStabilizationForce;

			if (this.data.altitudeStabilization) {
				// Verificar se há entrada manual de altitude (prioridade máxima)
				const hasManualAltitudeInput =
					Math.abs(this.targetAltitudeChange) > 0.15; // Aumentar threshold para permitir oscilações naturais

				if (!hasManualAltitudeInput && !this.stabilizationActive) {
					// Usar a altitude base da simulação como referência
					const targetAltitude =
						this.flightSimulation.baseAltitude ||
						this.data.targetAltitude;
					const altitudeDifference = targetAltitude - position.y;

					// Aplicar força de estabilização muito mais suave
					const stabilizationForce =
						altitudeDifference *
						this.data.altitudeStabilizationForce *
						0.1; // Reduzido de 0.3 para 0.1
					altitudeForce += stabilizationForce;

					// Log ocasional para debug
					if (
						Date.now() - (this.lastAltitudeStabilizationLog || 0) >
						4000
					) {
						console.log(
							`📏 Estabilização altitude: atual=${position.y.toFixed(
								2
							)}m, alvo=${targetAltitude.toFixed(
								2
							)}m, força=${stabilizationForce.toFixed(3)}`
						);
						this.lastAltitudeStabilizationLog = Date.now();
					}
				}
			}

			this.velocity.add(
				upVector.multiplyScalar(altitudeForce * acceleration)
			);

			// Limitar velocidade máxima
			if (this.velocity.length() > this.data.maxSpeed) {
				this.velocity.normalize().multiplyScalar(this.data.maxSpeed);
			}

			// Aplicar movimento
			const newPosition = {
				x: position.x + this.velocity.x * deltaTime,
				y: Math.max(
					this.data.minAltitude,
					position.y + this.velocity.y * deltaTime
				), // Respeitar altitude mínima
				z: position.z + this.velocity.z * deltaTime,
			};

			// Parar velocidade vertical se tocar o chão
			if (newPosition.y <= this.data.minAltitude && this.velocity.y < 0) {
				this.velocity.y = 0;
				newPosition.y = this.data.minAltitude;
			}

			this.el.setAttribute("position", newPosition);

			// Atualizar áudio baseado na intensidade do movimento
			this.updateAudioFeedback(this.velocity);

			// Calcular velocidade atual para HUD
			this.currentSpeed = this.velocity.length();
		},

		applyRotation: function (timeDelta) {
			const rotation = this.el.getAttribute("rotation");
			const deltaTime = timeDelta / 1000;

			// Aplicar rotação Yaw
			if (this.targetYawRotation) {
				this.angularVelocity.y += this.targetYawRotation * deltaTime;
			}

			// Aplicar rotação Pitch (se usando teclado)
			if (this.targetPitchRotation) {
				this.angularVelocity.x += this.targetPitchRotation * deltaTime;
			}

			// Auto-nivelamento inteligente - só aplica se estiver fora da zona morta
			if (this.data.autoLevel) {
				const levelingDeadzone = 2.0; // Zona morta de 2 graus para evitar oscilação

				// Só aplicar auto-nivelamento se a rotação estiver fora da zona morta
				if (Math.abs(rotation.x) > levelingDeadzone) {
					this.angularVelocity.x -=
						rotation.x * this.data.stabilization * deltaTime;
				} else {
					// Dentro da zona morta, aplicar amortecimento suave para parar oscilações
					this.angularVelocity.x *= 0.95;
				}

				if (Math.abs(rotation.z) > levelingDeadzone) {
					this.angularVelocity.z -=
						rotation.z * this.data.stabilization * deltaTime;
				} else {
					// Dentro da zona morta, aplicar amortecimento suave para parar oscilações
					this.angularVelocity.z *= 0.95;
				}
			}

			// Aplicar rotação
			const newRotation = {
				x:
					rotation.x +
					THREE.MathUtils.radToDeg(
						this.angularVelocity.x * deltaTime
					),
				y:
					rotation.y +
					THREE.MathUtils.radToDeg(
						this.angularVelocity.y * deltaTime
					),
				z:
					rotation.z +
					THREE.MathUtils.radToDeg(
						this.angularVelocity.z * deltaTime
					),
			};

			this.el.setAttribute("rotation", newRotation);
		},

		applyRealisticPhysics: function (timeDelta) {
			const deltaTime = timeDelta / 1000;
			const position = this.el.getAttribute("position");

			if (this.isFlying) {
				// === SISTEMA DE HOVER REALISTA ===

				// Calcular empuxo necessário para hover
				const gravity = 9.8 * this.data.mass;

				// Se não há entrada manual significativa de altitude, ativar hover automático
				if (Math.abs(this.targetAltitudeChange) < 0.2) {
					this.isHovering = true;

					// Usar a altitude base da simulação como referência para hover
					const targetHoverHeight =
						this.flightSimulation.baseAltitude || this.hoverHeight;
					const heightDifference = targetHoverHeight - position.y;

					// Ajustar empuxo baseado na diferença de altura (muito mais suave)
					const hoverAdjustment =
						heightDifference * this.data.hoverStability * 0.3; // Reduzido de 0.8 para 0.3
					this.targetThrust =
						(gravity + hoverAdjustment) / this.data.hoverThrust;
				} else {
					// Controle manual de altitude
					this.isHovering = false;
					this.targetThrust =
						(gravity + this.targetAltitudeChange * this.data.mass) /
						this.data.hoverThrust;
				}

				// Suavizar mudanças de empuxo (mais gradual)
				this.thrustPower +=
					(this.targetThrust - this.thrustPower) * 1.5 * deltaTime; // Reduzido de 3.0 para 1.5
				this.thrustPower = Math.max(0, Math.min(1.5, this.thrustPower)); // Limitar entre 0 e 150%

				// Aplicar empuxo vertical
				const thrustForce = this.thrustPower * this.data.hoverThrust;
				this.velocity.y +=
					((thrustForce - gravity) * deltaTime) / this.data.mass;

				// === RESISTÊNCIA AO VENTO E ESTABILIZAÇÃO ===

				// Aplicar resistência ao vento para estabilização horizontal
				if (
					Math.abs(this.targetForwardSpeed) < 0.1 &&
					Math.abs(this.targetStrafeSpeed) < 0.1
				) {
					// Sem entrada de movimento - aplicar estabilização
					this.velocity.x *= Math.pow(
						this.data.windResistance,
						deltaTime
					);
					this.velocity.z *= Math.pow(
						this.data.windResistance,
						deltaTime
					);
				}
			} else {
				// === DRONE DESLIGADO - APLICAR GRAVIDADE ===
				this.thrustPower = 0;
				this.targetThrust = 0;
				this.isHovering = false;

				// Aplicar gravidade
				this.velocity.y -= 9.8 * deltaTime;
			}

			// === APLICAR ARRASTO GERAL ===
			this.velocity.multiplyScalar(Math.pow(this.data.drag, deltaTime));
			this.angularVelocity.multiplyScalar(
				Math.pow(this.data.angularDrag, deltaTime)
			);

			// === MOVIMENTO É APLICADO EM applyMovement() ===
			// Não aplicar movimento aqui para evitar duplicação
			// O movimento já é aplicado na função applyMovement()

			// Atualizar altura de hover se estiver voando
			const currentPosition = this.el.getAttribute("position");
			if (this.isFlying && !this.isHovering) {
				this.hoverHeight = currentPosition.y;
			}
		},

		applyDrag: function () {
			this.velocity.multiplyScalar(this.data.drag);
			this.angularVelocity.multiplyScalar(this.data.angularDrag);
		},

		// === UTILITÁRIOS ===

		applyDeadzone: function (value) {
			return Math.abs(value) < this.data.deadzone ? 0 : value;
		},

		hasKeyboardInput: function () {
			return (
				this.keys["KeyW"] ||
				this.keys["KeyS"] ||
				this.keys["KeyA"] ||
				this.keys["KeyD"] ||
				this.keys["KeyQ"] ||
				this.keys["KeyE"] ||
				this.keys["ArrowUp"] ||
				this.keys["ArrowDown"] ||
				this.keys["ArrowLeft"] ||
				this.keys["ArrowRight"]
			);
		},

		// === SISTEMA DE ESTABILIZAÇÃO QUANDO NÃO TOCA O SOLO ===

		checkGroundContact: function () {
			const position = this.el.getAttribute("position");
			const currentTime = Date.now();

			// Verificar se está próximo ao solo (considerando altura de detecção)
			this.isGrounded = position.y <= this.data.groundDetectionHeight;

			// Log para debug (apenas a cada 2 segundos para não poluir)
			if (currentTime - this.lastGroundCheck > 2000) {
				console.log(
					`🌍 Verificação do solo: altura=${position.y.toFixed(
						2
					)}m, tocando=${this.isGrounded ? "SIM" : "NÃO"}`
				);
				this.lastGroundCheck = currentTime;
			}

			return this.isGrounded;
		},

		applyGroundStabilization: function (deltaTime) {
			// Debug detalhado
			const debugInfo = {
				groundStabilization: this.data.groundStabilization,
				isActive: this.isActive,
				isFlying: this.isFlying,
				position: this.el.getAttribute("position"),
			};

			if (Date.now() - (this.lastDebugLog || 0) > 3000) {
				console.log("🔍 Debug estabilização:", debugInfo);
				this.lastDebugLog = Date.now();
			}

			if (
				!this.data.groundStabilization ||
				!this.isActive ||
				!this.isFlying
			) {
				this.stabilizationActive = false;
				return 0; // Não aplicar estabilização
			}

			const position = this.el.getAttribute("position");
			const currentTime = Date.now();

			// Verificar se há entrada manual de altitude (prioridade máxima)
			const hasManualAltitudeInput =
				Math.abs(this.targetAltitudeChange) > 0.1;

			if (hasManualAltitudeInput) {
				this.stabilizationActive = false;
				return 0; // Não interferir com controle manual
			}

			// Verificar contato com o solo
			this.checkGroundContact();

			if (!this.isGrounded) {
				// Drone não está tocando o solo - ativar estabilização
				if (!this.stabilizationActive) {
					this.stabilizationActive = true;
					this.stabilizationStartTime = currentTime;
					console.log(
						`🚁 Estabilização automática ATIVADA - altura atual: ${position.y.toFixed(
							2
						)}m`
					);
				}

				// Aplicar força de estabilização suave para subir 0.1m
				const stabilizationForce =
					this.data.stabilizationLift *
					this.data.stabilizationSmoothing;

				// Adicionar pequena oscilação natural para simular ajustes constantes
				const timeOffset =
					(currentTime - this.stabilizationStartTime) * 0.001;
				const naturalOscillation = Math.sin(timeOffset * 2) * 0.02; // Oscilação de ±2cm

				const totalForce = stabilizationForce + naturalOscillation;

				// Log ocasional para debug
				if (currentTime - this.lastGroundCheck > 2000) {
					console.log(
						`🔧 Aplicando estabilização: força=${totalForce.toFixed(
							4
						)}, oscilação=${naturalOscillation.toFixed(4)}`
					);
				}

				return totalForce;
			} else {
				// Drone está tocando o solo - desativar estabilização
				if (this.stabilizationActive) {
					this.stabilizationActive = false;
					console.log(
						`🌍 Estabilização automática DESATIVADA - drone tocando o solo`
					);
				}
				return 0;
			}
		},

		updatePropellerEffects: function (isActive) {
			this.propellers.forEach((prop, index) => {
				if (prop) {
					// Calcular velocidade baseada na potência real das hélices
					let rotationSpeed;
					let opacity;

					if (isActive && this.isFlying) {
						// Velocidade baseada na potência das hélices (0-1 -> 150-3000ms)
						const thrustFactor = Math.max(0.1, this.thrustPower);
						rotationSpeed = Math.max(
							150,
							3000 / (thrustFactor * (this.boostMode ? 2 : 1))
						);

						// Opacidade baseada na potência
						opacity = Math.min(0.8, 0.2 + thrustFactor * 0.4);

						// Efeito visual de boost
						if (this.boostMode) {
							opacity = Math.min(0.9, opacity * 1.5);
						}
					} else {
						// Hélices paradas ou em idle
						rotationSpeed = 2000;
						opacity = 0.1;
					}

					const direction = index % 2 === 0 ? "3600" : "-3600";

					prop.setAttribute("animation", {
						property: "rotation",
						to: `0 ${direction} 0`,
						loop: true,
						dur: rotationSpeed,
					});

					prop.setAttribute("material", "opacity", opacity);
				}
			});
		},

		// Sistema avançado de animação das hélices
		initPropellerAnimations: function () {
			const propellers = ["prop1", "prop2", "prop3", "prop4"];

			propellers.forEach((propId, index) => {
				const propeller = document.querySelector(`#${propId}`);
				if (propeller) {
					// Configurar propriedades iniciais
					propeller.setAttribute("material", {
						color: "#ff4444",
						transparent: true,
						opacity: 0.3,
						metalness: 0.1,
						roughness: 0.9,
					});

					// Adicionar efeito de blur quando em alta velocidade
					propeller.setAttribute("geometry", {
						primitive: "cylinder",
						radius: 0.6,
						height: 0.03,
						segmentsRadial: 8,
					});

					// Configurar animação inicial
					const direction = index % 2 === 0 ? 3600 : -3600;
					propeller.setAttribute("animation", {
						property: "rotation",
						to: `0 ${direction} 0`,
						loop: true,
						dur: 300,
					});
				}
			});
		},

		// Efeitos visuais avançados das hélices
		updateAdvancedPropellerEffects: function () {
			const propellers = ["prop1", "prop2", "prop3", "prop4"];

			propellers.forEach((propId, index) => {
				const propeller = document.querySelector(`#${propId}`);
				if (propeller) {
					let speed = 300;
					let opacity = 0.3;
					let radius = 0.6;
					let color = "#ff4444";
					let thrustFactor = 0; // Definir thrustFactor no escopo correto

					if (this.isFlying) {
						// Cálculos baseados no empuxo
						thrustFactor = this.thrustPower;
						speed = Math.max(50, 300 - thrustFactor * 250);
						opacity = Math.min(0.9, 0.3 + thrustFactor * 0.6);

						// Efeito de blur - hélices ficam maiores e mais transparentes em alta velocidade
						if (thrustFactor > 0.7) {
							radius = 0.6 + (thrustFactor - 0.7) * 0.8; // Até 0.84
							opacity = Math.max(
								0.2,
								opacity - (thrustFactor - 0.7) * 0.3
							);
							color = "#ff6666"; // Cor mais clara em alta velocidade
						}

						if (this.boostMode) {
							speed = Math.max(8, speed * 0.4);
							opacity = Math.min(0.95, opacity + 0.15);
							radius += 0.2;
							color = "#ff8888"; // Cor ainda mais clara no boost
						}
					}

					// Direção alternada para realismo
					const direction = index % 2 === 0 ? 3600 : -3600;

					// Atualizar geometria para efeito de blur
					propeller.setAttribute("geometry", {
						primitive: "cylinder",
						radius: radius,
						height: 0.03,
						segmentsRadial: Math.max(
							6,
							Math.min(12, Math.round(8 + thrustFactor * 4))
						),
					});

					// Atualizar material
					propeller.setAttribute("material", {
						color: color,
						transparent: true,
						opacity: opacity,
						metalness: 0.1,
						roughness: 0.9,
					});

					// Atualizar animação
					propeller.setAttribute("animation", {
						property: "rotation",
						to: `0 ${direction} 0`,
						loop: true,
						dur: speed,
						easing: "linear",
					});
				}
			});
		},

		updateVisualEffects: function () {
			// Atualizar luzes LED baseadas no estado
			const intensity = this.isFlying ? 1.0 : 0.3;
			this.ledElements.forEach((led) => {
				if (led) {
					const currentEmissive =
						led.getAttribute("material").emissive;
					led.setAttribute(
						"material",
						"emissiveIntensity",
						intensity
					);
				}
			});
		},

		updateHUD: function () {
			const speedElement = document.querySelector("#speed-indicator");
			if (speedElement) {
				const speedKmh = Math.round(this.currentSpeed * 3.6); // Converter para km/h
				const thrustPercent = Math.round(this.thrustPower * 100);
				const position = this.el.getAttribute("position");
				const altitude = Math.round(position.y * 10) / 10; // Uma casa decimal

				let statusText = `Velocidade: ${speedKmh} km/h | Altitude: ${altitude}m`;

				if (this.isFlying) {
					statusText += ` | Empuxo: ${thrustPercent}%`;
					if (this.isHovering) {
						statusText += ` | HOVER`;
					}
					if (this.stabilizationActive) {
						statusText += ` | ESTABILIZANDO`;
					}
					if (this.isGrounded) {
						statusText += ` | SOLO`;
					}
					if (this.boostMode) {
						statusText += ` | BOOST`;
					}
				} else {
					statusText += ` | DESLIGADO`;
				}

				speedElement.setAttribute("value", statusText);
			}
		},

		resetDronePosition: function () {
			console.log("🔄 Resetando posição do drone...");
			this.el.setAttribute("position", "0 3 0");
			this.el.setAttribute("rotation", "0 0 0");
			this.velocity.set(0, 0, 0);
			this.angularVelocity.set(0, 0, 0);
		},

		emergencyStop: function () {
			console.log("🚨 Parada de emergência!");
			this.isFlying = false;
			this.velocity.set(0, 0, 0);
			this.angularVelocity.set(0, 0, 0);
			this.updatePropellerEffects(false);
			this.updateAudioFeedback(new THREE.Vector3(0, 0, 0));
		},
	});
} // fecha o registerComponent

console.log("📦 Módulo drone-controller.js carregado com sucesso!");
