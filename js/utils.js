/**
 * Utilitários para o Jogo de Corrida de Drone VR
 * Funções auxiliares, helpers e constantes compartilhadas
 */

// === CONSTANTES ===
// Usando window para garantir que a constante seja global e não seja redeclarada
if (typeof window.GAME_CONSTANTS === "undefined") {
	window.GAME_CONSTANTS = {
		// Física
		GRAVITY: -9.81,
		AIR_DENSITY: 1.225,
		DRAG_COEFFICIENT: 0.47,

		// Drone
		DRONE_MASS: 1.5, // kg
		MAX_THRUST: 18, // N
		MAX_ANGULAR_VELOCITY: 5, // rad/s

		// Controles
		DEADZONE: 0.1,
		SENSITIVITY: 1.0,

		// Performance
		TARGET_FPS: 90,
		MAX_PARTICLES: 100,

		// Audio
		MASTER_VOLUME: 0.7,
		SFX_VOLUME: 0.5,

		// VR
		IPD: 0.064, // Distância interpupilar média
		COMFORT_SETTINGS: {
			VIGNETTE: true,
			SNAP_TURN: false,
			TELEPORT: false,
		},
	};
	console.log("✅ GAME_CONSTANTS definidas com sucesso!");
}

// === UTILITÁRIOS MATEMÁTICOS ===
const MathUtils = {
	/**
	 * Converte graus para radianos
	 */
	degToRad: function (degrees) {
		return degrees * (Math.PI / 180);
	},

	/**
	 * Converte radianos para graus
	 */
	radToDeg: function (radians) {
		return radians * (180 / Math.PI);
	},

	/**
	 * Interpola linearmente entre dois valores
	 */
	lerp: function (a, b, t) {
		return a + (b - a) * Math.max(0, Math.min(1, t));
	},

	/**
	 * Interpola suavemente (smooth step)
	 */
	smoothStep: function (edge0, edge1, x) {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	},

	/**
	 * Aplica deadzone a um valor de entrada
	 */
	applyDeadzone: function (value, deadzone = GAME_CONSTANTS.DEADZONE) {
		const absValue = Math.abs(value);
		if (absValue < deadzone) return 0;

		const sign = Math.sign(value);
		const adjustedValue = (absValue - deadzone) / (1 - deadzone);
		return sign * adjustedValue;
	},

	/**
	 * Limita um valor entre min e max
	 */
	clamp: function (value, min, max) {
		return Math.max(min, Math.min(max, value));
	},

	/**
	 * Mapeia um valor de um range para outro
	 */
	map: function (value, inMin, inMax, outMin, outMax) {
		return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	},

	/**
	 * Calcula distância entre dois pontos 3D
	 */
	distance3D: function (pos1, pos2) {
		const dx = pos1.x - pos2.x;
		const dy = pos1.y - pos2.y;
		const dz = pos1.z - pos2.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	},

	/**
	 * Normaliza um vetor 3D
	 */
	normalize3D: function (vector) {
		const length = Math.sqrt(
			vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
		);
		if (length === 0) return { x: 0, y: 0, z: 0 };

		return {
			x: vector.x / length,
			y: vector.y / length,
			z: vector.z / length,
		};
	},

	/**
	 * Produto escalar de dois vetores 3D
	 */
	dot3D: function (v1, v2) {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	},

	/**
	 * Produto vetorial de dois vetores 3D
	 */
	cross3D: function (v1, v2) {
		return {
			x: v1.y * v2.z - v1.z * v2.y,
			y: v1.z * v2.x - v1.x * v2.z,
			z: v1.x * v2.y - v1.y * v2.x,
		};
	},

	/**
	 * Gera número aleatório entre min e max
	 */
	random: function (min, max) {
		return Math.random() * (max - min) + min;
	},

	/**
	 * Gera número inteiro aleatório entre min e max (inclusive)
	 */
	randomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
};

// === UTILITÁRIOS DE PERFORMANCE ===
const PerformanceUtils = {
	/**
	 * Monitor de FPS
	 */
	fpsMonitor: {
		frames: 0,
		lastTime: 0,
		fps: 0,

		update: function () {
			this.frames++;
			const now = performance.now();

			if (now - this.lastTime >= 1000) {
				this.fps = Math.round(
					(this.frames * 1000) / (now - this.lastTime)
				);
				this.frames = 0;
				this.lastTime = now;
			}

			return this.fps;
		},
	},

	/**
	 * Throttle para limitar execução de funções
	 */
	throttle: function (func, delay) {
		let timeoutId;
		let lastExecTime = 0;

		return function (...args) {
			const currentTime = Date.now();

			if (currentTime - lastExecTime > delay) {
				func.apply(this, args);
				lastExecTime = currentTime;
			} else {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					func.apply(this, args);
					lastExecTime = Date.now();
				}, delay - (currentTime - lastExecTime));
			}
		};
	},

	/**
	 * Debounce para atrasar execução de funções
	 */
	debounce: function (func, delay) {
		let timeoutId;

		return function (...args) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(this, args), delay);
		};
	},

	/**
	 * Pool de objetos para reutilização
	 */
	ObjectPool: function (createFn, resetFn, initialSize = 10) {
		this.createFn = createFn;
		this.resetFn = resetFn;
		this.pool = [];

		// Pré-popular o pool
		for (let i = 0; i < initialSize; i++) {
			this.pool.push(this.createFn());
		}

		this.get = function () {
			if (this.pool.length > 0) {
				return this.pool.pop();
			}
			return this.createFn();
		};

		this.release = function (obj) {
			this.resetFn(obj);
			this.pool.push(obj);
		};
	},
};

// === UTILITÁRIOS DE ÁUDIO ===
// Removido - já existe implementação no audio-system.js

// === UTILITÁRIOS VR ===
const VRUtils = {
	/**
	 * Verifica se VR está disponível
	 */
	isVRAvailable: function () {
		return "xr" in navigator && "isSessionSupported" in navigator.xr;
	},

	/**
	 * Verifica se está em modo VR
	 */
	isInVR: function () {
		const scene = document.querySelector("a-scene");
		return scene && scene.is("vr-mode");
	},

	/**
	 * Obtém controladores VR
	 */
	getVRControllers: function () {
		return {
			left: document.querySelector("#leftHand"),
			right: document.querySelector("#rightHand"),
		};
	},

	/**
	 * Trigger feedback háptico
	 */
	triggerHaptic: function (controller, intensity = 0.5, duration = 100) {
		if (controller && controller.components.haptics) {
			controller.components.haptics.pulse(intensity, duration);
		}
	},

	/**
	 * Obtém posição do headset
	 */
	getHeadsetPosition: function () {
		const camera = document.querySelector("#camera");
		return camera ? camera.getAttribute("position") : { x: 0, y: 0, z: 0 };
	},

	/**
	 * Obtém rotação do headset
	 */
	getHeadsetRotation: function () {
		const camera = document.querySelector("#camera");
		return camera ? camera.getAttribute("rotation") : { x: 0, y: 0, z: 0 };
	},
};

// === UTILITÁRIOS DE DEBUG ===
const DebugUtils = {
	/**
	 * Log com timestamp
	 */
	log: function (message, type = "info") {
		const timestamp = new Date().toISOString().substr(11, 12);
		const prefix = `[${timestamp}] [${type.toUpperCase()}]`;

		switch (type) {
			case "error":
				console.error(prefix, message);
				break;
			case "warn":
				console.warn(prefix, message);
				break;
			case "debug":
				console.debug(prefix, message);
				break;
			default:
				console.log(prefix, message);
		}
	},

	/**
	 * Mostra informações de performance
	 */
	showPerformanceInfo: function () {
		const info = {
			fps: PerformanceUtils.fpsMonitor.fps,
			memory: performance.memory
				? {
						used:
							Math.round(
								performance.memory.usedJSHeapSize / 1048576
							) + " MB",
						total:
							Math.round(
								performance.memory.totalJSHeapSize / 1048576
							) + " MB",
				  }
				: "N/A",
			entities: document.querySelectorAll("a-entity").length,
			isVR: VRUtils.isInVR(),
		};

		console.table(info);
		return info;
	},

	/**
	 * Cria painel de debug visual
	 */
	createDebugPanel: function () {
		const panel = document.createElement("a-entity");
		panel.setAttribute("id", "debug-panel");
		panel.setAttribute("position", "2 2 -3");

		const background = document.createElement("a-plane");
		background.setAttribute("width", "3");
		background.setAttribute("height", "2");
		background.setAttribute("color", "#000000");
		background.setAttribute("opacity", "0.7");

		const text = document.createElement("a-text");
		text.setAttribute("id", "debug-text");
		text.setAttribute("value", "Debug Info");
		text.setAttribute("color", "#00ff00");
		text.setAttribute("position", "-1.4 0.8 0.01");
		text.setAttribute("scale", "0.5 0.5 0.5");

		panel.appendChild(background);
		panel.appendChild(text);

		const camera = document.querySelector("#camera");
		if (camera) {
			camera.appendChild(panel);
		}

		return panel;
	},

	/**
	 * Atualiza painel de debug
	 */
	updateDebugPanel: function () {
		const debugText = document.querySelector("#debug-text");
		if (!debugText) return;

		const info = this.showPerformanceInfo();
		const drone = document.querySelector("#drone");
		const dronePos = drone
			? drone.getAttribute("position")
			: { x: 0, y: 0, z: 0 };

		const debugInfo = [
			`FPS: ${info.fps}`,
			`Entidades: ${info.entities}`,
			`VR: ${info.isVR ? "Sim" : "Não"}`,
			`Drone: ${dronePos.x.toFixed(1)}, ${dronePos.y.toFixed(
				1
			)}, ${dronePos.z.toFixed(1)}`,
			`Memória: ${info.memory.used || "N/A"}`,
		].join("\n");

		debugText.setAttribute("value", debugInfo);
	},
};

// === UTILITÁRIOS DE VALIDAÇÃO ===
const ValidationUtils = {
	/**
	 * Verifica se um valor é um número válido
	 */
	isValidNumber: function (value) {
		return typeof value === "number" && !isNaN(value) && isFinite(value);
	},

	/**
	 * Verifica se uma posição 3D é válida
	 */
	isValidPosition: function (position) {
		return (
			position &&
			this.isValidNumber(position.x) &&
			this.isValidNumber(position.y) &&
			this.isValidNumber(position.z)
		);
	},

	/**
	 * Sanitiza entrada do usuário
	 */
	sanitizeInput: function (input, type = "string") {
		switch (type) {
			case "number":
				const num = parseFloat(input);
				return this.isValidNumber(num) ? num : 0;
			case "string":
				return String(input).trim();
			case "boolean":
				return Boolean(input);
			default:
				return input;
		}
	},
};

// === EXPORTAR UTILITÁRIOS ===
window.GameUtils = {
	CONSTANTS: GAME_CONSTANTS,
	Math: MathUtils,
	Performance: PerformanceUtils,
	VR: VRUtils,
	Debug: DebugUtils,
	Validation: ValidationUtils,
};

// === INICIALIZAÇÃO ===
document.addEventListener("DOMContentLoaded", function () {
	console.log("🔧 Utilitários do jogo carregados!");

	// Contexto de áudio gerenciado pelo audio-system.js

	// Inicializar monitor de FPS
	setInterval(() => {
		PerformanceUtils.fpsMonitor.update();
	}, 100);

	// Debug mode (ativar com ?debug=true na URL)
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get("debug") === "true") {
		console.log("🐛 Modo debug ativado!");

		// Criar painel de debug
		setTimeout(() => {
			DebugUtils.createDebugPanel();

			// Atualizar painel a cada segundo
			setInterval(() => {
				DebugUtils.updateDebugPanel();
			}, 1000);
		}, 2000);

		// Atalhos de teclado para debug
		document.addEventListener("keydown", function (evt) {
			if (evt.ctrlKey) {
				switch (evt.key) {
					case "p": // Ctrl+P: Performance info
						DebugUtils.showPerformanceInfo();
						evt.preventDefault();
						break;
					case "r": // Ctrl+R: Reload sem cache
						location.reload(true);
						evt.preventDefault();
						break;
				}
			}
		});
	}
});

console.log("📦 Módulo utils.js carregado com sucesso!");
