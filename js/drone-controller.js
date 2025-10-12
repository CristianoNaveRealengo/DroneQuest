/**
 * Controlador do Drone para Meta Quest 3
 * Sistema avançado de controle com física realista e suporte a VR
 */

// Registrar o componente no A-Frame apenas se não estiver registrado
if (!AFRAME.components["drone-controller"]) {
	AFRAME.registerComponent("drone-controller", {
		schema: {
			// Configurações de movimento (valores padronizados para todos os controles)
			maxSpeed: { type: "number", default: 10.0 }, // 10 m/s (~36 km/h) - velocidade padrão unificada
			acceleration: { type: "number", default: 5.0 }, // 5.0 m/s² - aceleração padrão unificada
			rotationSpeed: { type: "number", default: 0.8 }, // 0.8 rad/s - rotação padrão unificada

			// Configurações de física (ajustadas para realismo)
			mass: { type: "number", default: 0.5 }, // Massa mais leve
			drag: { type: "number", default: 0.95 }, // Resistência aumentada para reduzir oscilações
			angularDrag: { type: "number", default: 0.92 }, // Mais resistência angular para estabilidade

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

			// Sistema de pouso
			this.isLanding = false;
			this.isLanded = false;
			this.landingSpeed = 2.0; // Velocidade de descida para pouso
			this.landingHeight = 0.5; // Altura considerada como "pousado"

			// Sistema de filmagem panorâmica cinematográfica (PADRÃO ATIVO)
			this.cinematicMode = {
				enabled: true, // ATIVO POR PADRÃO
				speedMultiplier: 0.5, // 50% da velocidade (5 m/s = 18 km/h) - suavidade cinematográfica
				rotationMultiplier: 0.5, // 50% da rotação - movimentos suaves
				smoothingFactor: 0.8, // Suavização adicional dos movimentos
				lastToggleTime: 0, // Controle de debounce para ativação
				activationDelay: 500, // 500ms de delay entre ativações
				stabilizationTolerance: 0.1, // ±10cm para modo cinematográfico
			};

			// Sistema FPV/Sport (modo manual de alta performance - drone FPV)
			this.fpvMode = {
				enabled: false,
				maxSpeed: 20.0, // 20 m/s (72 km/h) - velocidade máxima unificada
				speedMultiplier: 2.0, // 200% da velocidade base (20 m/s)
				rotationMultiplier: 2.0, // 200% da rotação para maior responsividade
				smoothingFactor: 0.2, // Menor suavização para resposta rápida
				bankingEnabled: true, // Inclinação nas curvas
				maxBankAngle: 45, // Ângulo máximo de inclinação em graus (mais agressivo)
				stabilizationDisabled: true, // Controle manual total
				// Configurações de drone FPV
				acceleration: 10.0, // 10.0 m/s² - aceleração FPV unificada (2x mais rápida)
				agility: 1.5, // Agilidade aumentada
				responsiveness: 0.1, // Resposta mais rápida
			};

			// Sistema de Filmagem Panorâmica Automática 360°
			this.panoramicMode = {
				enabled: false, // Ativado com tecla P
				speed: 0.15, // Velocidade de rotação (rad/s) - 1 volta completa em ~42 segundos
				direction: 1, // 1 = horário, -1 = anti-horário
				startAngle: 0, // Ângulo inicial
				currentAngle: 0, // Ângulo atual
				targetAngle: Math.PI * 2, // 360° em radianos
				completed: false, // Se completou a volta
				loop: false, // Se deve repetir continuamente
				pauseAtEnd: true, // Pausar ao completar 360°
				smoothStart: true, // Início suave
				smoothEnd: true, // Fim suave
				startTime: 0, // Tempo de início
				// Velocidades predefinidas
				speeds: {
					verySlow: 0.05, // ~2 minutos para 360°
					slow: 0.1, // ~1 minuto para 360°
					normal: 0.15, // ~42 segundos para 360°
					fast: 0.3, // ~21 segundos para 360°
					veryFast: 0.5, // ~12 segundos para 360°
				},
			};

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

			// Sistema de estabilização automática restritiva (ativada por padrão)
			this.autoStabilizationActive = true; // Ativada por padrão
			this.stabilizationTolerance = 0.1; // ±10cm de tolerância para oscilações naturais
			this.lastStabilizationCheck = 0; // Controle de tempo para logs
			this.lastToleranceChangeLog = 0; // Controle de tempo para logs de mudança de tolerância
			this.wasManuallyControllingAltitude = false; // Controle de transição manual->automático

			// Sistema de controle de altitude com empuxo aumentado
			this.altitudeThreshold = 20.0; // 20 metros - limite para empuxo aumentado
			this.lowAltitudeMinThrust = 0.4; // 40% empuxo mínimo abaixo de 20m
			this.lowAltitudeMaxThrust = 1.23; // 123% empuxo máximo abaixo de 20m (acima de 100%)
			this.normalThrust = 0.6; // 60% empuxo normal acima de 20m
			this.isInLowAltitudeMode = false; // Estado atual do modo baixa altitude
			this.lastAltitudeCheck = 0; // Controle de tempo para verificação de altitude

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
				oscillationAmplitude: 0.08, // ±8cm de oscilação natural
				oscillationSpeed: 0.0012, // Velocidade mais natural das oscilações
				baseAltitude: 3.0, // Altitude base para manter
				lastOscillationUpdate: 0,
				stabilizationStrength: 0.15, // Força mais suave para movimento natural
				// Novos parâmetros para voo mais realista
				windEffect: true, // Simular efeito do vento
				windStrength: 0.03, // Força do vento (±3cm)
				windSpeed: 0.0005, // Velocidade do vento
				microAdjustments: true, // Micro ajustes constantes
				microAmplitude: 0.02, // ±2cm de micro movimentos
				microSpeed: 0.003, // Velocidade dos micro movimentos
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
			console.log(
				`🎯 Estabilização automática: ${
					this.autoStabilizationActive ? "ATIVA" : "INATIVA"
				} por padrão (±${(this.stabilizationTolerance * 100).toFixed(
					0
				)}cm - oscilações naturais)`
			);
			console.log(
				`🔺 Sistema de altitude: Empuxo aumentado abaixo de ${this.altitudeThreshold}m`
			);
			console.log(
				`⚡ Empuxo baixa altitude: ${
					this.lowAltitudeMinThrust * 100
				}% - ${this.lowAltitudeMaxThrust * 100}%`
			);
			console.log(
				`⚡ Empuxo normal: ${this.normalThrust * 100}% (acima de ${
					this.altitudeThreshold
				}m)`
			);
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
            <div style="color: #ffff00; font-weight: bold; margin-bottom: 3px;">⌨️ Controles Principais:</div>
            <div>WASD - Altitude e giro (W=subir, S=descer, A=giro esq, D=giro dir)</div>
            <div>↑↓←→ - Movimento (frente/trás/esquerda/direita)</div>
            <div style="color: #00ff00; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">🥽 VR Simulado (Alternativo):</div>
            <div>Z/X - Descer/Subir (Alavanca Esquerda Y) ⚠️ INVERTIDO</div>
            <div>Q/E - Giro esquerda/direita (Alavanca Esquerda X)</div>
            <div>I/K - Frente/Trás (Alavanca Direita Y)</div>
            <div>J/L - Esquerda/Direita (Alavanca Direita X)</div>
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
            <div>H - Redefinir altitude base (estabilização ±8cm SEMPRE ativa)</div>
            <div style="color: #ff8800; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">🎬 Modos de Voo:</div>
            <div>C - Alternar CINEMATOGRÁFICO ⇄ FPV/SPORT</div>
            <div>• 🎬 Cinematográfico: 50% velocidade, ±8cm estabilização SEMPRE</div>
            <div>• 🚁 FPV/Sport: 72km/h máx, drone FPV, ultra responsivo</div>
            <div>Grip Esquerdo (VR) - Alternar modos de voo</div>
            <div style="color: #8a2be2; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">🎥 Filmagem Panorâmica 360°:</div>
            <div>P - Iniciar/Pausar panorâmica automática</div>
            <div>[ / ] - Diminuir/Aumentar velocidade panorâmica</div>
            <div>\\ - Inverter direção (horário ⇄ anti-horário)</div>
            <div>O - Reiniciar panorâmica do início</div>
            <div>• Velocidades: Muito Lenta (2min) → Lenta (1min) → Normal (42s) → Rápida (21s) → Muito Rápida (12s)</div>
            <div style="color: #00ff88; font-weight: bold; margin-top: 5px; margin-bottom: 3px;">🛬 Sistema de Pouso:</div>
            <div>Y - Pousar/Decolar (teclado)</div>
            <div>Botão Y (VR) - Pousar/Decolar em superfícies sólidas</div>
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
				`🎯 Nova altitude base definida: ${newBaseAltitude.toFixed(
					2
				)}m (±${(this.stabilizationTolerance * 100).toFixed(0)}cm)`
			);

			// Mostrar feedback visual
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 120, 255, 0.9);
				color: white;
				padding: 20px;
				border-radius: 10px;
				font-size: 18px;
				z-index: 1000;
				pointer-events: none;
			`;
			indicator.innerHTML = `🎯 NOVA ALTITUDE BASE<br>Altitude: ${newBaseAltitude.toFixed(
				1
			)}m<br>📏 Tolerância: ±${(
				this.stabilizationTolerance * 100
			).toFixed(0)}cm<br><small>Estabilização sempre ativa</small>`;
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 3000);
		},

		toggleFlightMode: function () {
			const currentTime = Date.now();

			// Debounce para evitar ativações acidentais
			if (
				currentTime - this.cinematicMode.lastToggleTime <
				this.cinematicMode.activationDelay
			) {
				return;
			}

			// Alternar entre modo cinematográfico e FPV
			if (this.cinematicMode.enabled) {
				// Ativar modo FPV/Sport
				this.cinematicMode.enabled = false;
				this.fpvMode.enabled = true;
				this.stabilizationTolerance = 999; // Desabilitar estabilização automática
				this.autoStabilizationActive = false;
				console.log(
					"🏎️ Modo FPV/SPORT ativado - Controle manual total!"
				);
			} else {
				// Ativar modo cinematográfico
				this.cinematicMode.enabled = true;
				this.fpvMode.enabled = false;
				this.stabilizationTolerance = 0.08; // SEMPRE ±8cm, conforme solicitado
				this.autoStabilizationActive = true;
				console.log(
					"🎬 Modo CINEMATOGRÁFICO ativado - Estabilidade ±8cm!"
				);
			}

			this.cinematicMode.lastToggleTime = currentTime;

			// Mostrar feedback visual
			this.showFlightModeIndicator();
		},

		// Manter compatibilidade com função antiga
		toggleCinematicMode: function () {
			this.toggleFlightMode();
		},

		// === SISTEMA DE FILMAGEM PANORÂMICA 360° ===

		togglePanoramicMode: function () {
			this.panoramicMode.enabled = !this.panoramicMode.enabled;

			if (this.panoramicMode.enabled) {
				// Ativar modo panorâmico
				this.panoramicMode.startAngle = this.el.object3D.rotation.y;
				this.panoramicMode.currentAngle = 0;
				this.panoramicMode.completed = false;
				this.panoramicMode.startTime = Date.now();

				// Forçar modo cinematográfico para suavidade
				if (!this.cinematicMode.enabled) {
					this.cinematicMode.enabled = true;
					this.fpvMode.enabled = false;
				}

				console.log("🎥 Filmagem Panorâmica 360° INICIADA");
				console.log(
					`⏱️ Tempo estimado: ${Math.round(
						(Math.PI * 2) / this.panoramicMode.speed
					)} segundos`
				);
			} else {
				console.log("🎥 Filmagem Panorâmica PAUSADA");
			}

			this.showPanoramicIndicator();
		},

		setPanoramicSpeed: function (speedName) {
			if (this.panoramicMode.speeds[speedName]) {
				this.panoramicMode.speed = this.panoramicMode.speeds[speedName];
				const timeSeconds = Math.round(
					(Math.PI * 2) / this.panoramicMode.speed
				);
				console.log(
					`🎥 Velocidade panorâmica: ${speedName} (${timeSeconds}s para 360°)`
				);
				this.showPanoramicSpeedIndicator(speedName, timeSeconds);
			}
		},

		togglePanoramicDirection: function () {
			this.panoramicMode.direction *= -1;
			const direction =
				this.panoramicMode.direction === 1
					? "Horário ⟳"
					: "Anti-horário ⟲";
			console.log(`🎥 Direção panorâmica: ${direction}`);
			this.showPanoramicDirectionIndicator(direction);
		},

		resetPanoramic: function () {
			this.panoramicMode.currentAngle = 0;
			this.panoramicMode.completed = false;
			this.panoramicMode.startTime = Date.now();
			console.log("🎥 Panorâmica reiniciada");
		},

		showPanoramicIndicator: function () {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(138, 43, 226, 0.95);
				color: white;
				padding: 25px;
				border-radius: 15px;
				font-size: 20px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
				text-align: center;
				box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			`;

			const timeSeconds = Math.round(
				(Math.PI * 2) / this.panoramicMode.speed
			);
			const direction =
				this.panoramicMode.direction === 1
					? "⟳ Horário"
					: "⟲ Anti-horário";

			if (this.panoramicMode.enabled) {
				indicator.innerHTML = `
					🎥 FILMAGEM PANORÂMICA 360°<br>
					<div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
						• Direção: ${direction}<br>
						• Tempo: ${timeSeconds}s para volta completa<br>
						• Velocidade: ${(this.panoramicMode.speed * 100).toFixed(0)}%<br>
						• Modo: ${this.panoramicMode.loop ? "Loop contínuo" : "Uma volta"}
					</div>
					<div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
						Pressione P para pausar/retomar<br>
						Pressione [ ou ] para ajustar velocidade<br>
						Pressione \\ para inverter direção
					</div>
				`;
			} else {
				indicator.innerHTML = `
					⏸️ PANORÂMICA PAUSADA<br>
					<div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
						Progresso: ${Math.round(
							(this.panoramicMode.currentAngle / (Math.PI * 2)) *
								100
						)}%<br>
						Pressione P para retomar
					</div>
				`;
			}

			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 3000);
		},

		showPanoramicSpeedIndicator: function (speedName, timeSeconds) {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 20%;
				left: 50%;
				transform: translateX(-50%);
				background: rgba(138, 43, 226, 0.9);
				color: white;
				padding: 15px 25px;
				border-radius: 10px;
				font-size: 16px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
			`;

			indicator.innerHTML = `⚡ Velocidade: ${speedName.toUpperCase()}<br><small>${timeSeconds}s para 360°</small>`;
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 2000);
		},

		showPanoramicDirectionIndicator: function (direction) {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 20%;
				left: 50%;
				transform: translateX(-50%);
				background: rgba(138, 43, 226, 0.9);
				color: white;
				padding: 15px 25px;
				border-radius: 10px;
				font-size: 16px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
			`;

			indicator.innerHTML = `🔄 Direção: ${direction}`;
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 2000);
		},

		updatePanoramicRotation: function (deltaTime) {
			if (!this.panoramicMode.enabled || this.panoramicMode.completed) {
				return;
			}

			// Calcular incremento de rotação baseado na velocidade e deltaTime
			const rotationIncrement =
				this.panoramicMode.speed *
				this.panoramicMode.direction *
				(deltaTime / 1000);

			// Atualizar ângulo atual
			this.panoramicMode.currentAngle += Math.abs(rotationIncrement);

			// Aplicar rotação suave
			const currentRotation = this.el.object3D.rotation;
			currentRotation.y += rotationIncrement;

			// Verificar se completou 360°
			if (this.panoramicMode.currentAngle >= Math.PI * 2) {
				if (this.panoramicMode.loop) {
					// Reiniciar para loop contínuo
					this.panoramicMode.currentAngle = 0;
				} else {
					// Pausar ao completar
					this.panoramicMode.completed = true;
					this.panoramicMode.enabled = false;
					console.log("🎥 Filmagem Panorâmica 360° CONCLUÍDA!");
					this.showPanoramicCompletedIndicator();
				}
			}

			// Atualizar indicador de progresso (a cada 2 segundos)
			const now = Date.now();
			if (
				!this.lastPanoramicUpdate ||
				now - this.lastPanoramicUpdate > 2000
			) {
				this.lastPanoramicUpdate = now;
				const progress = Math.round(
					(this.panoramicMode.currentAngle / (Math.PI * 2)) * 100
				);
				console.log(`🎥 Progresso panorâmico: ${progress}%`);
			}
		},

		showPanoramicCompletedIndicator: function () {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(34, 139, 34, 0.95);
				color: white;
				padding: 30px;
				border-radius: 15px;
				font-size: 24px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
				text-align: center;
				box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			`;

			const totalTime = Math.round(
				(Date.now() - this.panoramicMode.startTime) / 1000
			);

			indicator.innerHTML = `
				✅ PANORÂMICA 360° CONCLUÍDA!<br>
				<div style="font-size: 16px; margin-top: 10px; opacity: 0.9;">
					Tempo total: ${totalTime}s<br>
					Pressione O para reiniciar<br>
					Pressione P para nova filmagem
				</div>
			`;

			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 5000);
		},

		showFlightModeIndicator: function () {
			const indicator = document.createElement("div");
			const isCinematic = this.cinematicMode.enabled;
			const isFPV = this.fpvMode.enabled;

			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: ${
					isCinematic
						? "rgba(255, 140, 0, 0.95)"
						: "rgba(255, 50, 50, 0.95)"
				};
				color: white;
				padding: 25px;
				border-radius: 15px;
				font-size: 20px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
				text-align: center;
				box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			`;

			if (isCinematic) {
				indicator.innerHTML = `
					🎬 MODO CINEMATOGRÁFICO<br>
					<div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
						• Velocidade: ${Math.round(
							this.cinematicMode.speedMultiplier * 100
						)}% (suave)<br>
						• Estabilização: ±${Math.round(this.stabilizationTolerance * 100)}cm<br>
						• Inclinação: Suave nas curvas<br>
						• Controles: Cinematográficos
					</div>
				`;
			} else if (isFPV) {
				indicator.innerHTML = `
					🚁 MODO FPV/SPORT<br>
					<div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
						• Velocidade: ${Math.round(this.fpvMode.maxSpeed * 3.6)}km/h (máxima)<br>
						• Física: Drone FPV de alta performance<br>
						• Aceleração: ${this.fpvMode.acceleration}m/s² (2x mais rápida)<br>
						• Inclinação: Até ${this.fpvMode.maxBankAngle}° nas curvas<br>
						• Controles: Ultra responsivos
					</div>
				`;
			}

			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					document.body.removeChild(indicator);
				}
			}, 4000);
		},

		// Manter compatibilidade
		showCinematicModeIndicator: function (enabled) {
			this.showFlightModeIndicator();
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
				// INICIAR NO CHÃO (0m) conforme solicitado
				const groundPosition = { x: 0, y: 0, z: 0 };
				this.el.setAttribute("position", groundPosition);

				// Definir a altura de hover como altura do chão
				this.hoverHeight = 0;

				// Atualizar altitude base da simulação para o chão
				this.flightSimulation.baseAltitude = 0;
				this.data.targetAltitude = 0;

				// Zerar velocidades para evitar movimento inicial
				this.velocity.set(0, 0, 0);
				this.angularVelocity.set(0, 0, 0);

				// Definir empuxo inicial para manter posição (60% - meio termo entre 50-70%)
				this.thrustPower = 0.6; // Empuxo em 60% como ponto médio entre 50-70%
				this.targetThrust = 0.6;

				// Ativar modo hover para estabilidade
				this.isHovering = true;

				console.log(
					`🎯 Drone posicionado no CHÃO: ${this.hoverHeight.toFixed(
						2
					)}m - Modo CINEMATOGRÁFICO ativo por padrão (±${(
						this.stabilizationTolerance * 100
					).toFixed(0)}cm)`
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

			// ZERAR valores quando alavanca está no centro
			if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
				this.targetAltitudeChange = 0;
				this.targetYawRotation = 0;
				return;
			}

			// Determinar multiplicadores baseados no modo ativo
			let altitudeMultiplier, rotationMultiplier, maxSpeed;

			if (this.cinematicMode.enabled) {
				altitudeMultiplier = this.cinematicMode.speedMultiplier;
				rotationMultiplier = this.cinematicMode.rotationMultiplier;
				maxSpeed = this.data.maxSpeed;
			} else if (this.fpvMode.enabled) {
				altitudeMultiplier = this.fpvMode.speedMultiplier;
				rotationMultiplier = this.fpvMode.rotationMultiplier;
				maxSpeed = this.fpvMode.maxSpeed;
			} else {
				altitudeMultiplier = 1.0;
				rotationMultiplier = 1.0;
				maxSpeed = this.data.maxSpeed;
			}

			// Alavanca Esquerda: Altitude (Y) e Giro no próprio eixo/Yaw (X) - INVERTIDO
			this.targetAltitudeChange =
				-y * maxSpeed * 1.0 * altitudeMultiplier; // Velocidade normal de altitude
			this.targetYawRotation =
				-x * this.data.rotationSpeed * rotationMultiplier;

			// Log com indicação do modo
			const modeIcon = this.cinematicMode.enabled
				? "🎬"
				: this.fpvMode.enabled
				? "🏎️"
				: "🚁";
			const modeName = this.cinematicMode.enabled
				? "CINEMATOGRÁFICO"
				: this.fpvMode.enabled
				? "FPV/SPORT"
				: "NORMAL";

			console.log(
				`${modeIcon} Alavanca Esquerda (${modeName}): x=${x.toFixed(
					2
				)}, y=${y.toFixed(
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

			// ZERAR valores quando alavanca está no centro
			if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
				this.targetForwardSpeed = 0;
				this.targetStrafeSpeed = 0;
				return;
			}

			// Determinar multiplicadores baseados no modo ativo
			let speedMultiplier, maxSpeed;

			if (this.cinematicMode.enabled) {
				speedMultiplier = this.cinematicMode.speedMultiplier;
				maxSpeed = this.data.maxSpeed;
			} else if (this.fpvMode.enabled) {
				speedMultiplier = this.fpvMode.speedMultiplier;
				maxSpeed = this.fpvMode.maxSpeed;
			} else {
				speedMultiplier = 1.0;
				maxSpeed = this.data.maxSpeed;
			}

			// Alavanca Direita: Movimento frente/trás (Y) e direita/esquerda (X)
			this.targetForwardSpeed = -y * maxSpeed * speedMultiplier;
			this.targetStrafeSpeed = x * maxSpeed * speedMultiplier;

			// Log com indicação do modo
			const modeIcon = this.cinematicMode.enabled
				? "🎬"
				: this.fpvMode.enabled
				? "🏎️"
				: "🚁";
			const modeName = this.cinematicMode.enabled
				? "CINEMATOGRÁFICO"
				: this.fpvMode.enabled
				? "FPV/SPORT"
				: "NORMAL";

			console.log(
				`${modeIcon} Alavanca Direita (${modeName}): x=${x.toFixed(
					2
				)}, y=${y.toFixed(
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
			// Grip esquerdo: Toggle entre modo cinematográfico e FPV/Sport
			this.toggleFlightMode();
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
			} else if (evt.detail.id === 3) {
				// Botão Y - Sistema de pouso
				this.toggleLandingMode();
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
						// Redefinir altitude base para a posição atual
						this.setNewBaseAltitude();
						break;
					case "KeyC":
						// Toggle entre modo cinematográfico e FPV/Sport
						this.toggleFlightMode();
						break;
					case "KeyP":
						// Toggle filmagem panorâmica 360°
						this.togglePanoramicMode();
						break;
					case "BracketLeft":
						// Diminuir velocidade panorâmica
						const currentSpeedIndex = Object.values(
							this.panoramicMode.speeds
						).indexOf(this.panoramicMode.speed);
						const speedNames = Object.keys(
							this.panoramicMode.speeds
						);
						if (currentSpeedIndex > 0) {
							this.setPanoramicSpeed(
								speedNames[currentSpeedIndex - 1]
							);
						}
						break;
					case "BracketRight":
						// Aumentar velocidade panorâmica
						const currentSpeedIdx = Object.values(
							this.panoramicMode.speeds
						).indexOf(this.panoramicMode.speed);
						const speedNms = Object.keys(this.panoramicMode.speeds);
						if (currentSpeedIdx < speedNms.length - 1) {
							this.setPanoramicSpeed(
								speedNms[currentSpeedIdx + 1]
							);
						}
						break;
					case "Backslash":
						// Inverter direção panorâmica
						this.togglePanoramicDirection();
						break;
					case "KeyO":
						// Reiniciar panorâmica
						this.resetPanoramic();
						break;
					case "KeyY":
						// Sistema de pouso (teclado)
						this.toggleLandingMode();
						break;

					// === CONTROLES VR SIMULADOS (MANTIDOS PARA COMPATIBILIDADE) ===
					// Alavanca Esquerda: Altitude e Giro - INVERTIDO
					case "KeyZ": // Descer (altitude negativa) - INVERTIDO
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.y = -0.8;
							this.targetAltitudeChange =
								-0.8 * this.data.maxSpeed * 1.0; // Velocidade normal
						}
						break;
					case "KeyX": // Subir (altitude positiva) - INVERTIDO
						if (this.VR_SIMULATOR) {
							this.VR_SIMULATOR.leftStick.y = 0.8;
							this.targetAltitudeChange =
								0.8 * this.data.maxSpeed * 1.0; // Velocidade normal
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

			// Sistema de hover natural com oscilações realistas de drone
			if (this.flightSimulation.naturalHover) {
				const currentTime = time;
				const position = this.el.getAttribute("position");

				// === OSCILAÇÃO PRINCIPAL (movimento natural do drone) ===
				const oscillationPhase =
					currentTime * this.flightSimulation.oscillationSpeed;
				const primaryOscillation =
					Math.sin(oscillationPhase) *
					this.flightSimulation.oscillationAmplitude;

				// === OSCILAÇÃO SECUNDÁRIA (correções do sistema de estabilização) ===
				const secondaryPhase = oscillationPhase * 1.3 + 0.5;
				const secondaryOscillation =
					Math.sin(secondaryPhase) *
					(this.flightSimulation.oscillationAmplitude * 0.3);

				// === EFEITO DO VENTO (variações irregulares) ===
				let windEffect = 0;
				if (this.flightSimulation.windEffect) {
					const windPhase =
						currentTime * this.flightSimulation.windSpeed;
					windEffect =
						Math.sin(windPhase) *
							this.flightSimulation.windStrength +
						Math.sin(windPhase * 2.1 + 1.2) *
							(this.flightSimulation.windStrength * 0.5);
				}

				// === MICRO AJUSTES (pequenos movimentos constantes) ===
				let microAdjustments = 0;
				if (this.flightSimulation.microAdjustments) {
					const microPhase =
						currentTime * this.flightSimulation.microSpeed;
					microAdjustments =
						Math.sin(microPhase) *
							this.flightSimulation.microAmplitude +
						Math.sin(microPhase * 3.7 + 0.8) *
							(this.flightSimulation.microAmplitude * 0.6);
				}

				// === AJUSTAR INTENSIDADE BASEADA NA ALTITUDE ===
				// Drones em baixa altitude têm oscilações mais pronunciadas (efeito solo)
				let altitudeMultiplier = 1.0;
				if (this.isInLowAltitudeMode) {
					// Abaixo de 20m: oscilações mais intensas (efeito solo)
					altitudeMultiplier = 1.3;
				} else {
					// Acima de 20m: oscilações mais suaves
					altitudeMultiplier = 0.8;
				}

				// === COMBINAR TODOS OS EFEITOS ===
				const totalOscillation =
					(primaryOscillation +
						secondaryOscillation +
						windEffect +
						microAdjustments) *
					altitudeMultiplier;

				// Calcular altitude alvo com oscilações naturais
				const targetAltitudeWithOscillation =
					this.flightSimulation.baseAltitude + totalOscillation;
				const altitudeDifference =
					targetAltitudeWithOscillation - position.y;

				// Aplicar força de estabilização muito suave para movimento natural
				const stabilizationForce =
					altitudeDifference *
					this.flightSimulation.stabilizationStrength;

				// Limitar força para manter oscilações naturais
				const maxForce = 0.06; // Força ligeiramente maior para movimento mais natural
				const limitedForce = Math.max(
					-maxForce,
					Math.min(maxForce, stabilizationForce)
				);

				// Aplicar a força de estabilização natural
				this.targetAltitudeChange += limitedForce;

				// Log ocasional para debug (a cada 4 segundos)
				if (
					currentTime -
						(this.flightSimulation.lastOscillationUpdate || 0) >
					4000
				) {
					const oscillationCm = Math.abs(totalOscillation * 100);
					console.log(
						`🌊 Voo natural: altitude=${position.y.toFixed(2)}m, ` +
							`alvo=${targetAltitudeWithOscillation.toFixed(
								2
							)}m, ` +
							`oscilação=${oscillationCm.toFixed(1)}cm, ` +
							`força=${limitedForce.toFixed(3)}`
					);
					this.flightSimulation.lastOscillationUpdate = currentTime;
				}
			}
		},

		checkAltitudeAndAdjustThrust: function () {
			const position = this.el.getAttribute("position");
			const currentAltitude = position.y;
			const currentTime = Date.now();

			// Verificar se está abaixo do limite de 20 metros
			const wasInLowAltitudeMode = this.isInLowAltitudeMode;
			this.isInLowAltitudeMode = currentAltitude < this.altitudeThreshold;

			// Log quando muda de modo (com throttling de 2 segundos)
			if (
				wasInLowAltitudeMode !== this.isInLowAltitudeMode &&
				currentTime - this.lastAltitudeCheck > 2000
			) {
				if (this.isInLowAltitudeMode) {
					console.log(
						`🔺 ALTITUDE BAIXA DETECTADA: ${currentAltitude.toFixed(
							2
						)}m < ${this.altitudeThreshold}m`
					);
					console.log(
						`⚡ Empuxo aumentado: ${
							this.lowAltitudeMinThrust * 100
						}% - ${this.lowAltitudeMaxThrust * 100}%`
					);
					console.log(`📏 Estabilização ±8cm ATIVA`);
				} else {
					console.log(
						`🔻 ALTITUDE NORMAL: ${currentAltitude.toFixed(
							2
						)}m >= ${this.altitudeThreshold}m`
					);
					console.log(
						`⚡ Empuxo normal: ${this.normalThrust * 100}%`
					);
				}
				this.lastAltitudeCheck = currentTime;
			}

			// Ajustar empuxo baseado na altitude
			if (this.isInLowAltitudeMode) {
				// Abaixo de 20m: empuxo entre 40% e 123%
				// Calcular empuxo baseado na proximidade do chão (mais baixo = mais empuxo)
				const altitudeRatio = Math.max(
					0,
					Math.min(1, currentAltitude / this.altitudeThreshold)
				);
				const thrustRange =
					this.lowAltitudeMaxThrust - this.lowAltitudeMinThrust;

				// Empuxo inversamente proporcional à altitude (mais baixo = mais empuxo)
				this.targetThrust =
					this.lowAltitudeMaxThrust - altitudeRatio * thrustRange;

				// Garantir que está dentro dos limites
				this.targetThrust = Math.max(
					this.lowAltitudeMinThrust,
					Math.min(this.lowAltitudeMaxThrust, this.targetThrust)
				);
			} else {
				// Acima de 20m: empuxo normal
				this.targetThrust = this.normalThrust;
			}

			// Suavizar transição do empuxo
			const thrustDifference = this.targetThrust - this.thrustPower;
			this.thrustPower += thrustDifference * 0.1; // Transição suave de 10% por frame
		},

		tick: function (time, timeDelta) {
			// Simular voo realista com descidas e subidas automáticas
			this.simulateRealisticFlight(time);

			// Verificar altitude e ajustar empuxo conforme necessário
			this.checkAltitudeAndAdjustThrust();

			// Verificar se o drone está parado e ajustar estabilidade para 8cm
			this.isDroneStopped();

			// Processar sistema de pouso
			this.processLanding(timeDelta);

			// Processar filmagem panorâmica 360° (se ativo)
			if (this.panoramicMode.enabled && !this.isLanded) {
				this.updatePanoramicRotation(timeDelta);
			}

			// Processar entrada de controles (apenas se não estiver pousado e não em modo panorâmico)
			if (!this.isLanded && !this.panoramicMode.enabled) {
				this.processControlInput();
			}

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
			const threshold = 0.05; // Limiar mais baixo para detectar entrada
			return (
				Math.abs(this.leftStick.x) > threshold ||
				Math.abs(this.leftStick.y) > threshold ||
				Math.abs(this.rightStick.x) > threshold ||
				Math.abs(this.rightStick.y) > threshold
			);
		},

		processKeyboardInput: function () {
			// Determinar velocidade baseada no modo ativo
			let speed, rotationSpeed;

			if (this.cinematicMode.enabled) {
				speed =
					this.data.maxSpeed *
					this.cinematicMode.speedMultiplier *
					this.data.sensitivity;
				rotationSpeed =
					this.data.rotationSpeed *
					this.cinematicMode.rotationMultiplier;
			} else if (this.fpvMode.enabled) {
				speed =
					this.fpvMode.maxSpeed *
					this.fpvMode.speedMultiplier *
					this.data.sensitivity;
				rotationSpeed =
					this.data.rotationSpeed * this.fpvMode.rotationMultiplier;
			} else {
				speed = this.data.maxSpeed * this.data.sensitivity;
				rotationSpeed = this.data.rotationSpeed;
			}

			// WASD: Altitude e giro no eixo - MESMA VELOCIDADE
			if (this.keys["KeyW"]) this.targetAltitudeChange = speed; // W = SUBIR
			if (this.keys["KeyS"]) this.targetAltitudeChange = -speed; // S = DESCER
			if (this.keys["KeyA"]) this.targetYawRotation = rotationSpeed; // A = GIRAR ESQUERDA
			if (this.keys["KeyD"]) this.targetYawRotation = -rotationSpeed; // D = GIRAR DIREITA

			// SETAS: Frente, trás, direita e esquerda - MESMA VELOCIDADE
			if (this.keys["ArrowUp"]) this.targetForwardSpeed = speed; // ↑ = FRENTE
			if (this.keys["ArrowDown"]) this.targetForwardSpeed = -speed; // ↓ = TRÁS
			if (this.keys["ArrowLeft"]) this.targetStrafeSpeed = -speed; // ← = ESQUERDA
			if (this.keys["ArrowRight"]) this.targetStrafeSpeed = speed; // → = DIREITA
		},

		applyMovement: function (timeDelta) {
			// MODO CINEMATOGRÁFICO/NORMAL/FPV: Comportamento de drone
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
			let acceleration = this.data.acceleration * deltaTime;

			// Configurações específicas por modo
			if (this.cinematicMode.enabled) {
				// Suavização adicional no modo cinematográfico
				acceleration *= this.cinematicMode.smoothingFactor;
			} else if (this.fpvMode.enabled) {
				// Modo FPV: Mais aceleração e responsividade
				acceleration *=
					this.fpvMode.acceleration / this.data.acceleration; // Usar aceleração do FPV
				acceleration *=
					this.fpvMode.responsiveness /
					this.cinematicMode.smoothingFactor; // Mais responsivo
			}

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

			// Sistema de estabilização automática restritiva (sempre ativo)
			if (this.autoStabilizationActive) {
				// Verificar se há entrada manual de altitude (prioridade máxima)
				const hasManualAltitudeInput =
					Math.abs(this.targetAltitudeChange) > 0.05; // Mais sensível para detectar entrada manual

				// Detectar transição de controle manual para automático
				if (
					!hasManualAltitudeInput &&
					this.wasManuallyControllingAltitude
				) {
					// Acabou de soltar o controle - atualizar altitude base para posição atual
					this.flightSimulation.baseAltitude = position.y;
					this.data.targetAltitude = position.y;
					this.hoverHeight = position.y;
					console.log(
						`🎯 Controle solto - Estabilizando na altitude atual: ${position.y.toFixed(
							2
						)}m (±${(this.stabilizationTolerance * 100).toFixed(
							0
						)}cm - oscilações naturais permitidas)`
					);
				}

				// Atualizar estado de controle manual
				this.wasManuallyControllingAltitude = hasManualAltitudeInput;

				// Só aplicar estabilização automática se não há entrada manual
				if (!hasManualAltitudeInput) {
					const targetAltitude =
						this.flightSimulation.baseAltitude ||
						this.data.targetAltitude;
					const altitudeDifference = targetAltitude - position.y;
					const absAltitudeDifference = Math.abs(altitudeDifference);

					// Aplicar estabilização restritiva apenas se estiver fora da tolerância
					if (absAltitudeDifference > this.stabilizationTolerance) {
						// Força de estabilização MUITO suave para evitar subida indesejada
						let stabilizationMultiplier = 0.03; // Força drasticamente reduzida

						// Se está abaixo de 20m, usar estabilização ligeiramente mais forte
						if (this.isInLowAltitudeMode) {
							stabilizationMultiplier = 0.05; // Apenas um pouco mais forte
						}

						const stabilizationForce =
							altitudeDifference * stabilizationMultiplier;
						altitudeForce += stabilizationForce;

						// Log para debug
						if (
							Date.now() - (this.lastStabilizationCheck || 0) >
							2000
						) {
							const modeText = this.isInLowAltitudeMode
								? "BAIXA ALTITUDE"
								: "NORMAL";
							console.log(
								`🎯 Estabilização ${modeText}: atual=${position.y.toFixed(
									2
								)}m, alvo=${targetAltitude.toFixed(
									2
								)}m, diferença=${altitudeDifference.toFixed(
									2
								)}m, força=${stabilizationForce.toFixed(
									2
								)} (mult: ${stabilizationMultiplier})`
							);
							this.lastStabilizationCheck = Date.now();
						}
					} else {
						// Dentro da tolerância - NÃO aplicar estabilização (deixar livre)
						// Força zerada para evitar subida indesejada
						// altitudeForce += 0;
					}
				}
			} else if (this.data.altitudeStabilization) {
				// Sistema de estabilização original (mais suave)
				const hasManualAltitudeInput =
					Math.abs(this.targetAltitudeChange) > 0.15;

				if (!hasManualAltitudeInput && !this.stabilizationActive) {
					const targetAltitude =
						this.flightSimulation.baseAltitude ||
						this.data.targetAltitude;
					const altitudeDifference = targetAltitude - position.y;

					// Aplicar força de estabilização muito mais suave
					const stabilizationForce =
						altitudeDifference *
						this.data.altitudeStabilizationForce *
						0.1;
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

			// Aplicar amortecimento apenas quando não há entrada manual (para reduzir oscilações)
			const hasManualInput = Math.abs(this.targetAltitudeChange) > 0.05;

			if (!hasManualInput) {
				// Sem entrada manual - aplicar amortecimento para reduzir oscilações
				const verticalDamping = this.isInLowAltitudeMode ? 0.85 : 0.9;
				this.velocity.y *= verticalDamping;

				// Limitar velocidade apenas para estabilização (não durante controle manual)
				const maxStabilizationSpeed = this.isInLowAltitudeMode
					? 1.5
					: 2.0;
				this.velocity.y = Math.max(
					-maxStabilizationSpeed,
					Math.min(maxStabilizationSpeed, this.velocity.y)
				);
			}
			// Durante controle manual, manter velocidade normal sem limitações extras

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
			let deltaTime = timeDelta / 1000;

			// Suavização adicional no modo cinematográfico
			if (this.cinematicMode.enabled) {
				deltaTime *= this.cinematicMode.smoothingFactor;
			}

			// Aplicar rotação Yaw
			if (this.targetYawRotation) {
				this.angularVelocity.y += this.targetYawRotation * deltaTime;
			} else {
				// AMORTECIMENTO: Parar rotação gradualmente quando não há entrada
				this.angularVelocity.y *= 0.85; // Reduz 15% da velocidade angular a cada frame
			}

			// Aplicar rotação Pitch (se usando teclado)
			if (this.targetPitchRotation) {
				this.angularVelocity.x += this.targetPitchRotation * deltaTime;
			}

			// NOVO: Inclinação para frente ao acelerar (sutil e suave)
			let pitchTilt = 0;
			if (Math.abs(this.targetForwardSpeed) > 0.1) {
				// Calcular intensidade do movimento para frente (0 a 1)
				const maxSpeed = this.fpvMode.enabled
					? this.fpvMode.maxSpeed
					: this.data.maxSpeed;
				const forwardIntensity =
					Math.abs(this.targetForwardSpeed) / maxSpeed;

				// Ângulo máximo de inclinação SUTIL baseado no modo
				const maxPitchAngle = this.fpvMode.enabled ? 12 : 8; // FPV: 12°, Normal: 8° (bem sutil)

				// Calcular inclinação (negativo = para frente, positivo = para trás)
				pitchTilt =
					-forwardIntensity *
					maxPitchAngle *
					Math.sign(this.targetForwardSpeed);
			}

			// Auto-nivelamento inteligente com transição suave e sem oscilações
			if (this.data.autoLevel) {
				// Calcular rotação alvo considerando a inclinação de movimento
				const targetPitch = pitchTilt;
				const pitchDifference = targetPitch - rotation.x;

				// Força de correção balanceada (reduzida para evitar cambalhotas)
				const correctionForce = this.fpvMode.enabled ? 3.0 : 2.0;

				// Aplicar correção suave e progressiva
				this.angularVelocity.x +=
					pitchDifference * correctionForce * deltaTime;

				// Limitar velocidade angular máxima para evitar cambalhotas
				const maxAngularVelocity = 2.0; // rad/s
				this.angularVelocity.x = Math.max(
					-maxAngularVelocity,
					Math.min(maxAngularVelocity, this.angularVelocity.x)
				);

				// Amortecimento para parar suavemente
				if (Math.abs(pitchDifference) < 1.0) {
					// Quando próximo do alvo, amortecer mais
					this.angularVelocity.x *= 0.85;
				} else {
					// Amortecimento normal
					this.angularVelocity.x *= 0.92;
				}

				// Roll (inclinação lateral) - SEMPRE manter nivelado (sem inclinação lateral)
				// Força de correção mais forte para manter sempre reto
				this.angularVelocity.z = -rotation.z * 5.0 * deltaTime;

				// Limitar velocidade
				this.angularVelocity.z = Math.max(
					-maxAngularVelocity,
					Math.min(maxAngularVelocity, this.angularVelocity.z)
				);

				// Amortecimento forte para zerar rapidamente
				this.angularVelocity.z *= 0.7;
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

			// Inclinação nas curvas (banking) DESABILITADA - apenas pitch (frente/trás)
			// this.applyBankingEffect(deltaTime);
		},

		applyBankingEffect: function (deltaTime) {
			// APENAS modo FPV/Sport deve inclinar - modo cinematográfico NÃO inclina
			if (!this.fpvMode.enabled || !this.fpvMode.bankingEnabled) {
				return;
			}

			const rotation = this.el.getAttribute("rotation");
			let targetBankAngle = 0;

			// Calcular ângulo de inclinação baseado na velocidade de giro e movimento lateral
			if (this.targetYawRotation !== 0 || this.targetStrafeSpeed !== 0) {
				// Usar velocidade de giro como base para inclinação
				const yawIntensity =
					Math.abs(this.targetYawRotation) / this.data.rotationSpeed;
				const strafeIntensity =
					Math.abs(this.targetStrafeSpeed) /
					(this.fpvMode.enabled
						? this.fpvMode.maxSpeed
						: this.data.maxSpeed);

				// Combinar intensidades para calcular inclinação
				const combinedIntensity = Math.max(
					yawIntensity,
					strafeIntensity
				);

				// Determinar ângulo máximo baseado no modo
				const maxAngle = this.fpvMode.enabled
					? this.fpvMode.maxBankAngle
					: 15; // 15° para cinematográfico

				// Calcular ângulo alvo
				targetBankAngle = combinedIntensity * maxAngle;

				// CORRIGIR direção da inclinação
				if (this.targetYawRotation < 0 || this.targetStrafeSpeed < 0) {
					targetBankAngle = -targetBankAngle; // Inclinar para a esquerda
				}
			}

			// Suavizar transição para o ângulo alvo
			const bankingSpeed = this.fpvMode.enabled ? 3.0 : 1.5; // FPV mais responsivo
			const currentBank = rotation.z;
			const bankDifference = targetBankAngle - currentBank;
			const bankingForce = bankDifference * bankingSpeed * deltaTime;

			// Aplicar inclinação suavizada
			const newRotation = {
				x: rotation.x,
				y: rotation.y,
				z: currentBank + bankingForce,
			};

			this.el.setAttribute("rotation", newRotation);

			// Log para debug (apenas quando há inclinação significativa)
			if (Math.abs(targetBankAngle) > 1) {
				const modeIcon = this.fpvMode.enabled ? "🏎️" : "🎬";
				console.log(
					`${modeIcon} Inclinação: ${targetBankAngle.toFixed(
						1
					)}° (atual: ${currentBank.toFixed(1)}°)`
				);
			}
		},

		applyRealisticPhysics: function (timeDelta) {
			const deltaTime = timeDelta / 1000;
			const position = this.el.getAttribute("position");

			if (this.isFlying) {
				// === SISTEMA DE HOVER REALISTA ===

				// Calcular empuxo necessário para hover
				const gravity = 9.8 * this.data.mass;

				// Se não há entrada manual significativa de altitude, ativar hover automático
				if (Math.abs(this.targetAltitudeChange) < 0.1) {
					this.isHovering = true;

					// Usar a altitude base da simulação como referência para hover
					const targetHoverHeight =
						this.flightSimulation.baseAltitude || this.hoverHeight;
					const heightDifference = targetHoverHeight - position.y;

					// Se estabilização automática está ativa, usar força mais intensa e responsiva
					let hoverStabilityMultiplier = 0.3; // Padrão
					if (this.autoStabilizationActive) {
						if (
							Math.abs(heightDifference) >
							this.stabilizationTolerance
						) {
							hoverStabilityMultiplier = 1.2; // Muito mais forte para correção rápida
						} else {
							hoverStabilityMultiplier = 0.6; // Força moderada dentro da tolerância
						}
					}

					// Ajustar empuxo baseado na diferença de altura
					const hoverAdjustment =
						heightDifference *
						this.data.hoverStability *
						hoverStabilityMultiplier;
					this.targetThrust =
						(gravity + hoverAdjustment) / this.data.hoverThrust;
				} else {
					// Controle manual de altitude
					this.isHovering = false;
					this.targetThrust =
						(gravity + this.targetAltitudeChange * this.data.mass) /
						this.data.hoverThrust;
				}

				// Suavizar mudanças de empuxo - mais responsivo com estabilização automática
				let thrustResponseSpeed = 1.5; // Padrão
				if (this.autoStabilizationActive && this.isHovering) {
					const targetHoverHeight =
						this.flightSimulation.baseAltitude || this.hoverHeight;
					const heightDifference = Math.abs(
						targetHoverHeight - position.y
					);
					if (heightDifference > this.stabilizationTolerance) {
						thrustResponseSpeed = 3.0; // Mais rápido para correções grandes
					} else {
						thrustResponseSpeed = 2.0; // Moderadamente rápido dentro da tolerância
					}
				}

				this.thrustPower +=
					(this.targetThrust - this.thrustPower) *
					thrustResponseSpeed *
					deltaTime;

				// Limitar empuxo baseado na altitude
				if (this.isFlying && this.isActive) {
					if (this.isInLowAltitudeMode) {
						// Abaixo de 20m: empuxo entre 40% e 123%
						this.thrustPower = Math.max(
							this.lowAltitudeMinThrust,
							Math.min(
								this.lowAltitudeMaxThrust,
								this.thrustPower
							)
						);
					} else {
						// Acima de 20m: empuxo normal entre 50% e 70%
						this.thrustPower = Math.max(
							0.5,
							Math.min(0.7, this.thrustPower)
						);
					}
				} else {
					this.thrustPower = Math.max(
						0,
						Math.min(1.5, this.thrustPower)
					); // Limite normal quando não voando
				}

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

		isDroneStopped: function () {
			// Verificar se o drone está parado (sem entrada manual e velocidade baixa)
			const hasManualInput = this.hasKeyboardInput() || this.hasVRInput();
			const hasManualAltitudeInput =
				Math.abs(this.targetAltitudeChange) > 0.1;
			const isMovingSlowly = this.velocity.length() < 0.5; // Velocidade menor que 0.5 m/s

			const isStopped =
				!hasManualInput && !hasManualAltitudeInput && isMovingSlowly;

			// SEMPRE manter tolerância de 8cm, em qualquer altitude e situação
			if (this.autoStabilizationActive) {
				const targetTolerance = 0.08; // SEMPRE 8cm, conforme solicitado
				if (
					Math.abs(this.stabilizationTolerance - targetTolerance) >
					0.001
				) {
					// Transição gradual para 8cm
					const transitionSpeed = 0.002; // 2mm por frame
					if (this.stabilizationTolerance > targetTolerance) {
						this.stabilizationTolerance = Math.max(
							targetTolerance,
							this.stabilizationTolerance - transitionSpeed
						);
					} else {
						this.stabilizationTolerance = Math.min(
							targetTolerance,
							this.stabilizationTolerance + transitionSpeed
						);
					}

					// Log apenas quando a mudança é significativa
					if (
						Date.now() - (this.lastToleranceChangeLog || 0) >
						1000
					) {
						console.log(
							`🎯 Auto estabilidade: mantendo ±${(
								this.stabilizationTolerance * 100
							).toFixed(1)}cm em qualquer altitude`
						);
						this.lastToleranceChangeLog = Date.now();
					}
				}
			}

			return isStopped;
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

				// Aplicar força de estabilização muito suave para oscilações de 8cm
				const stabilizationForce =
					this.data.stabilizationLift *
					this.data.stabilizationSmoothing *
					0.2; // Reduzido para oscilações de 8cm

				// Adicionar pequena oscilação natural para simular ajustes constantes
				const timeOffset =
					(currentTime - this.stabilizationStartTime) * 0.001;
				const naturalOscillation = Math.sin(timeOffset * 2) * 0.08; // Oscilação de ±8cm conforme solicitado

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
							radius = 0.3 + (thrustFactor - 0.7) * 0.8; // Até 0.84
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

					// Mostrar modo de altitude
					if (this.isInLowAltitudeMode) {
						statusText += ` | 🔺BAIXA ALT`;
					} else {
						statusText += ` | 🔻NORMAL`;
					}

					if (this.isHovering) {
						statusText += ` | HOVER`;
					}
					if (this.autoStabilizationActive) {
						const targetAltitude =
							this.flightSimulation.baseAltitude ||
							this.data.targetAltitude;
						const altitudeDifference = Math.abs(
							targetAltitude - position.y
						);
						const withinTolerance =
							altitudeDifference <= this.stabilizationTolerance;
						const toleranceCm = Math.round(
							this.stabilizationTolerance * 100
						);
						statusText += ` | AUTO-ESTAB (±${toleranceCm}cm)`;
						if (withinTolerance) {
							statusText += ` ✅`;
						} else {
							statusText += ` ⚠️`;
						}
					} else if (this.stabilizationActive) {
						statusText += ` | ESTABILIZANDO`;
					}
					if (this.isGrounded) {
						statusText += ` | SOLO`;
					}
					if (this.boostMode) {
						statusText += ` | BOOST`;
					}
					// Indicador de modo de voo
					if (this.cinematicMode.enabled) {
						statusText += ` | 🎬 CINEMATOGRÁFICO (${Math.round(
							this.cinematicMode.speedMultiplier * 100
						)}%)`;
					} else if (this.fpvMode.enabled) {
						statusText += ` | 🏎️ FPV/SPORT (${Math.round(
							this.fpvMode.maxSpeed * 3.6
						)}km/h)`;
					} else {
						statusText += ` | 🚁 NORMAL`;
					}
				} else {
					statusText += ` | DESLIGADO`;
				}

				speedElement.setAttribute("value", statusText);
			}

			// Atualizar indicador de modo de voo
			const modeElement = document.querySelector(
				"#flight-mode-indicator"
			);
			if (modeElement) {
				let modeText, modeColor;

				if (this.cinematicMode.enabled) {
					modeText = `🎬 CINEMATOGRÁFICO (${Math.round(
						this.cinematicMode.speedMultiplier * 100
					)}%)`;
					modeColor = "#ff8800";
				} else if (this.fpvMode.enabled) {
					modeText = `🚁 FPV/SPORT (${Math.round(
						this.fpvMode.maxSpeed * 3.6
					)}km/h)`;
					modeColor = "#ff5050";
				} else {
					modeText = "🚁 NORMAL";
					modeColor = "#00ff00";
				}

				modeElement.setAttribute("value", modeText);
				modeElement.setAttribute("color", modeColor);
			}

			// Mostrar indicador visual da estabilização automática
			this.updateStabilizationIndicator();
		},

		updateStabilizationIndicator: function () {
			// Estabilização sempre ativa - sempre mostrar indicador

			// Criar ou atualizar indicador
			let indicator = document.querySelector("#stabilization-indicator");
			if (!indicator) {
				indicator = document.createElement("div");
				indicator.id = "stabilization-indicator";
				indicator.style.cssText = `
					position: fixed;
					top: 20px;
					right: 20px;
					background: rgba(0, 0, 0, 0.8);
					color: white;
					padding: 10px 15px;
					border-radius: 8px;
					font-family: Arial, sans-serif;
					font-size: 14px;
					z-index: 1000;
					border-left: 4px solid #00ff00;
				`;
				document.body.appendChild(indicator);
			}

			// Criar ou atualizar indicador do modo cinematográfico
			this.updateCinematicIndicator();

			const position = this.el.getAttribute("position");
			const targetAltitude =
				this.flightSimulation.baseAltitude || this.data.targetAltitude;
			const altitudeDifference = targetAltitude - position.y;
			const absAltitudeDifference = Math.abs(altitudeDifference);
			const withinTolerance =
				absAltitudeDifference <= this.stabilizationTolerance;

			// Atualizar cor baseada no status
			const borderColor = withinTolerance ? "#00ff00" : "#ffaa00";
			indicator.style.borderLeftColor = borderColor;

			// Atualizar conteúdo
			const toleranceCm = Math.round(this.stabilizationTolerance * 100);
			const differenceCm = Math.round(absAltitudeDifference * 100);
			const status = withinTolerance ? "✅ ESTÁVEL" : "⚠️ AJUSTANDO";

			indicator.innerHTML = `
				<div style="font-weight: bold; color: ${borderColor};">🎯 ESTABILIZAÇÃO ATIVA</div>
				<div>Alvo: ${targetAltitude.toFixed(1)}m (±${toleranceCm}cm)</div>
				<div>Atual: ${position.y.toFixed(1)}m</div>
				<div>Diferença: ${differenceCm}cm</div>
				<div style="color: ${borderColor}; font-weight: bold;">${status}</div>
			`;
		},

		updateCinematicIndicator: function () {
			let cinematicIndicator = document.querySelector(
				"#cinematic-indicator"
			);

			if (this.cinematicMode.enabled) {
				// Criar indicador se não existir
				if (!cinematicIndicator) {
					cinematicIndicator = document.createElement("div");
					cinematicIndicator.id = "cinematic-indicator";
					cinematicIndicator.style.cssText = `
						position: fixed;
						top: 20px;
						left: 20px;
						background: rgba(255, 140, 0, 0.9);
						color: white;
						padding: 10px 15px;
						border-radius: 8px;
						font-family: Arial, sans-serif;
						font-size: 14px;
						font-weight: bold;
						z-index: 1000;
						border-left: 4px solid #ff8c00;
						box-shadow: 0 2px 10px rgba(255, 140, 0, 0.3);
					`;
					document.body.appendChild(cinematicIndicator);
				}

				// Atualizar conteúdo
				cinematicIndicator.innerHTML = `
					<div style="color: #fff; font-weight: bold;">🎬 MODO CINEMATOGRÁFICO</div>
					<div style="font-size: 12px; margin-top: 3px; opacity: 0.9;">
						Velocidade: ${Math.round(this.cinematicMode.speedMultiplier * 100)}% | 
						Rotação: ${Math.round(this.cinematicMode.rotationMultiplier * 100)}%
					</div>
					<div style="font-size: 11px; margin-top: 2px; opacity: 0.8;">
						Grip Esquerdo (VR) ou C (Teclado) para desativar
					</div>
				`;
			} else {
				// Remover indicador se existir
				if (cinematicIndicator && cinematicIndicator.parentNode) {
					cinematicIndicator.parentNode.removeChild(
						cinematicIndicator
					);
				}
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
			this.isLanding = false;
			this.velocity.set(0, 0, 0);
			this.angularVelocity.set(0, 0, 0);
			this.updatePropellerEffects(false);
			this.updateAudioFeedback(new THREE.Vector3(0, 0, 0));
		},

		// Sistema de pouso com botão Y
		toggleLandingMode: function () {
			if (this.isLanded) {
				// Decolar
				this.takeOff();
			} else if (this.isLanding) {
				// Cancelar pouso
				this.cancelLanding();
			} else {
				// Iniciar pouso
				this.startLanding();
			}
		},

		startLanding: function () {
			if (!this.isActive || !this.isFlying) {
				console.log("⚠️ Drone deve estar ativo e voando para pousar");
				return;
			}

			// Verificar se pode pousar na posição atual
			if (!this.canLandHere()) {
				console.log(
					"⚠️ Não é possível pousar aqui - procure uma superfície adequada"
				);
				this.showLandingWarning("Superfície inadequada para pouso!");
				return;
			}

			this.isLanding = true;
			console.log("🛬 Iniciando sequência de pouso automático...");

			// Mostrar indicador visual
			this.showLandingIndicator(true);

			// Emitir som de pouso
			this.el.sceneEl.emit("drone-landing-start");
		},

		cancelLanding: function () {
			this.isLanding = false;
			console.log("❌ Pouso cancelado");

			// Esconder indicador visual
			this.showLandingIndicator(false);
		},

		takeOff: function () {
			if (!this.isLanded) return;

			this.isLanded = false;
			this.isLanding = false;
			this.isActive = true;
			this.isFlying = true;

			// Subir automaticamente
			this.velocity.y = 3.0;

			console.log("🚁 Decolando...");
			this.showTakeOffIndicator();
		},

		// Verificar se pode pousar na posição atual
		canLandHere: function () {
			const currentPosition = this.el.getAttribute("position");

			// Verificar se há uma superfície sólida abaixo
			const surfaceBelow = this.detectSurfaceBelow(currentPosition);

			return surfaceBelow !== null;
		},

		// Detectar superfície sólida abaixo do drone
		detectSurfaceBelow: function (dronePosition) {
			const rayDistance = 10; // Distância máxima para detectar superfície

			// Verificar chão
			if (dronePosition.y <= this.landingHeight + 0.5) {
				return { type: "ground", height: 0 };
			}

			// Verificar telhados de prédios
			const buildings = document.querySelectorAll(".building");
			for (let building of buildings) {
				const buildingPos = building.getAttribute("position");
				const buildingGeom = building.getAttribute("geometry");

				if (!buildingPos || !buildingGeom) continue;

				const width = buildingGeom.width || 10;
				const depth = buildingGeom.depth || 10;
				const height = buildingGeom.height || 20;

				// Verificar se está acima do prédio
				const dx = Math.abs(dronePosition.x - buildingPos.x);
				const dz = Math.abs(dronePosition.z - buildingPos.z);

				if (dx < width / 2 && dz < depth / 2) {
					const roofHeight = buildingPos.y + height / 2;
					if (
						dronePosition.y > roofHeight &&
						dronePosition.y - roofHeight < rayDistance
					) {
						return {
							type: "building",
							height: roofHeight,
							object: building,
						};
					}
				}
			}

			return null;
		},

		// Processar lógica de pouso no tick
		processLanding: function (deltaTime) {
			if (!this.isLanding) return;

			const currentPosition = this.el.getAttribute("position");
			const surface = this.detectSurfaceBelow(currentPosition);

			if (!surface) {
				console.log("⚠️ Nenhuma superfície detectada para pouso");
				this.cancelLanding();
				return;
			}

			// Descer suavemente
			const targetHeight = surface.height + this.landingHeight;

			if (currentPosition.y > targetHeight) {
				// Continuar descendo
				this.velocity.y = -this.landingSpeed;

				// Estabilizar horizontalmente durante o pouso
				this.velocity.x *= 0.9;
				this.velocity.z *= 0.9;
			} else {
				// Pousou com sucesso
				this.completeLanding(surface);
			}
		},

		// Completar o pouso
		completeLanding: function (surface) {
			this.isLanding = false;
			this.isLanded = true;
			this.isFlying = false;

			// Parar completamente
			this.velocity.set(0, 0, 0);
			this.angularVelocity.set(0, 0, 0);

			// Ajustar posição final
			const currentPosition = this.el.getAttribute("position");
			currentPosition.y = surface.height + this.landingHeight;
			this.el.setAttribute("position", currentPosition);

			console.log(
				`✅ Pouso concluído em ${
					surface.type
				} na altura ${surface.height.toFixed(2)}m`
			);

			// Mostrar indicador de pouso concluído
			this.showLandedIndicator();
			this.showLandingIndicator(false);
		},

		// Mostrar aviso de pouso
		showLandingWarning: function (message) {
			const warning = document.createElement("div");
			warning.style.cssText = `
				position: fixed;
				top: 30%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(255, 100, 100, 0.95);
				color: white;
				padding: 20px;
				border-radius: 10px;
				font-size: 18px;
				font-weight: bold;
				z-index: 1000;
				pointer-events: none;
				text-align: center;
			`;
			warning.innerHTML = `⚠️ ${message}`;
			document.body.appendChild(warning);

			setTimeout(() => {
				if (warning.parentNode) {
					document.body.removeChild(warning);
				}
			}, 3000);
		},

		// Indicadores visuais para o sistema de pouso
		showLandingIndicator: function (show) {
			let indicator = document.getElementById("landing-indicator");

			if (show && !indicator) {
				indicator = document.createElement("div");
				indicator.id = "landing-indicator";
				indicator.style.cssText = `
					position: fixed;
					top: 20px;
					left: 50%;
					transform: translateX(-50%);
					background: rgba(255, 165, 0, 0.9);
					color: white;
					padding: 10px 20px;
					border-radius: 5px;
					font-size: 16px;
					font-weight: bold;
					z-index: 1000;
					animation: pulse 1s infinite;
				`;
				indicator.innerHTML =
					"🛬 MODO POUSO ATIVO<br><small>Descendo suavemente...</small>";
				document.body.appendChild(indicator);
			} else if (!show && indicator) {
				indicator.remove();
			}
		},

		showTakeOffIndicator: function () {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 255, 0, 0.9);
				color: white;
				padding: 20px;
				border-radius: 10px;
				font-size: 18px;
				font-weight: bold;
				z-index: 1000;
			`;
			indicator.innerHTML = "🚁 DECOLANDO!";
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					indicator.remove();
				}
			}, 2000);
		},

		showLandedIndicator: function () {
			const indicator = document.createElement("div");
			indicator.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 150, 0, 0.9);
				color: white;
				padding: 20px;
				border-radius: 10px;
				font-size: 18px;
				font-weight: bold;
				z-index: 1000;
			`;
			indicator.innerHTML =
				"✅ POUSADO COM SUCESSO!<br><small>Pressione Y novamente para decolar</small>";
			document.body.appendChild(indicator);

			setTimeout(() => {
				if (indicator.parentNode) {
					indicator.remove();
				}
			}, 3000);
		},
	});
} // fecha o registerComponent

console.log("📦 Módulo drone-controller.js carregado com sucesso!");
