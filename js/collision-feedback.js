/**
 * Collision Feedback - Sistema de Feedback Visual e Sonoro
 * Alertas no HUD, efeitos visuais e sons de impacto
 */

AFRAME.registerComponent("collision-feedback", {
	schema: {
		enabled: { type: "boolean", default: true },
		visualFeedback: { type: "boolean", default: true },
		audioFeedback: { type: "boolean", default: true },
		hudFeedback: { type: "boolean", default: true },
	},

	init: function () {
		console.log("🎨 Inicializando Collision Feedback...");

		this.audioContext = null;
		this.lastWarningTime = 0;
		this.lastCollisionTime = 0;
		this.proximityIndicator = null;

		this.setupAudio();
		this.setupEventListeners();
		this.createProximityIndicator();

		console.log("✅ Collision Feedback inicializado!");
	},

	setupAudio: function () {
		try {
			this.audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			console.log("🔊 Audio Context criado");
		} catch (e) {
			console.warn("⚠️ Audio Context não disponível");
		}
	},

	setupEventListeners: function () {
		// Escutar eventos de colisão
		this.el.addEventListener("collision-danger", (evt) => {
			this.onCollisionDanger(evt.detail);
		});

		this.el.addEventListener("collision-warning", (evt) => {
			this.onCollisionWarning(evt.detail);
		});
	},

	createProximityIndicator: function () {
		if (!this.data.visualFeedback) return;

		// Criar indicador de proximidade na câmera
		const camera = document.querySelector("#drone-camera");
		if (!camera) return;

		this.proximityIndicator = document.createElement("a-ring");
		this.proximityIndicator.setAttribute("id", "proximity-indicator");
		this.proximityIndicator.setAttribute("radius-inner", "0.8");
		this.proximityIndicator.setAttribute("radius-outer", "1.0");
		this.proximityIndicator.setAttribute("position", "0 0 -2");
		this.proximityIndicator.setAttribute("material", {
			color: "#ff0000",
			transparent: true,
			opacity: 0,
			shader: "flat",
		});

		camera.appendChild(this.proximityIndicator);
		console.log("🎯 Indicador de proximidade criado");
	},

	onCollisionDanger: function (detail) {
		const now = Date.now();
		if (now - this.lastCollisionTime < 100) return;
		this.lastCollisionTime = now;

		console.log("💥 Feedback de colisão perigosa");

		// Feedback visual
		if (this.data.visualFeedback) {
			this.showDangerFlash();
			this.createImpactParticles(detail.position);
		}

		// Feedback sonoro
		if (this.data.audioFeedback) {
			this.playCollisionSound("hard");
		}

		// Feedback no HUD
		if (this.data.hudFeedback) {
			this.showHUDAlert("⚠️ COLISÃO!", "#ff0000");
		}

		// Vibração VR
		this.triggerHapticFeedback(0.8, 200);
	},

	onCollisionWarning: function (detail) {
		const now = Date.now();
		if (now - this.lastWarningTime < 500) return;
		this.lastWarningTime = now;

		// Feedback visual suave
		if (this.data.visualFeedback) {
			this.showProximityWarning(detail.distance);
		}

		// Som suave
		if (this.data.audioFeedback && detail.distance < 2) {
			this.playCollisionSound("soft");
		}
	},

	showDangerFlash: function () {
		if (!this.proximityIndicator) return;

		// Flash vermelho intenso
		this.proximityIndicator.setAttribute("material", {
			opacity: 0.8,
			color: "#ff0000",
		});

		this.proximityIndicator.setAttribute("animation__flash", {
			property: "material.opacity",
			from: 0.8,
			to: 0,
			dur: 300,
			easing: "easeOutQuad",
		});
	},

	showProximityWarning: function (distance) {
		if (!this.proximityIndicator) return;

		// Calcular intensidade baseada na distância
		const intensity = Math.max(0, 1 - distance / 3);
		const color = distance < 2 ? "#ff0000" : "#ffaa00";

		this.proximityIndicator.setAttribute("material", {
			opacity: intensity * 0.4,
			color: color,
		});
	},

	createImpactParticles: function (position) {
		// Criar partículas de impacto
		const particleSystem = this.el.components["collision-particles"];
		if (particleSystem) {
			particleSystem.spawnParticles(position, 8);
		}
	},

	playCollisionSound: function (type) {
		if (!this.audioContext) return;

		const now = this.audioContext.currentTime;
		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);

		if (type === "hard") {
			// Som de impacto forte
			oscillator.frequency.setValueAtTime(200, now);
			oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
			gainNode.gain.setValueAtTime(0.3, now);
			gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
			oscillator.stop(now + 0.2);
		} else {
			// Som de aviso suave
			oscillator.frequency.setValueAtTime(400, now);
			oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
			gainNode.gain.setValueAtTime(0.1, now);
			gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
			oscillator.stop(now + 0.15);
		}

		oscillator.start(now);
	},

	showHUDAlert: function (message, color) {
		// Emitir evento para o HUD
		this.el.emit("hud-alert", {
			message: message,
			color: color,
			duration: 2000,
		});
	},

	triggerHapticFeedback: function (intensity, duration) {
		const leftController = document.querySelector("#leftHand");
		const rightController = document.querySelector("#rightHand");

		if (leftController && leftController.components["haptics"]) {
			leftController.components.haptics.pulse(intensity, duration);
		}

		if (rightController && rightController.components["haptics"]) {
			rightController.components.haptics.pulse(intensity, duration);
		}
	},
});

console.log("📦 Collision Feedback carregado!");
