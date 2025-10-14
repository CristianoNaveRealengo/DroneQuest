/**
 * Collision Feedback - VERSÃO OTIMIZADA
 * Apenas alertas HUD e sons - SEM geometria extra
 */

AFRAME.registerComponent("collision-feedback", {
	schema: {
		enabled: { type: "boolean", default: true },
		visualFeedback: { type: "boolean", default: false },
		audioFeedback: { type: "boolean", default: true },
		hudFeedback: { type: "boolean", default: true },
	},

	init: function () {
		console.log("🎨 Collision Feedback OTIMIZADO inicializado");

		this.audioContext = null;
		this.lastWarningTime = 0;
		this.lastCollisionTime = 0;

		this.setupAudio();
		this.setupEventListeners();
	},

	setupAudio: function () {
		try {
			this.audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
		} catch (e) {
			console.warn("⚠️ Audio Context não disponível");
		}
	},

	setupEventListeners: function () {
		this.el.addEventListener("collision-danger", (evt) => {
			this.onCollisionDanger(evt.detail);
		});

		this.el.addEventListener("collision-warning", (evt) => {
			this.onCollisionWarning(evt.detail);
		});
	},

	onCollisionDanger: function (detail) {
		const now = Date.now();
		if (now - this.lastCollisionTime < 200) return;
		this.lastCollisionTime = now;

		// Som
		if (this.data.audioFeedback) {
			this.playCollisionSound("hard");
		}

		// HUD
		if (this.data.hudFeedback) {
			this.showHUDAlert("⚠️ COLISÃO!", "#ff0000");
		}

		// Vibração VR
		this.triggerHapticFeedback(0.8, 200);
	},

	onCollisionWarning: function (detail) {
		const now = Date.now();
		if (now - this.lastWarningTime < 1000) return;
		this.lastWarningTime = now;

		// Som suave apenas se muito próximo
		if (this.data.audioFeedback && detail.distance < 2) {
			this.playCollisionSound("soft");
		}
	},

	playCollisionSound: function (type) {
		if (!this.audioContext) return;

		const now = this.audioContext.currentTime;
		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);

		// Iniciar oscilador ANTES de configurar stop
		oscillator.start(now);

		if (type === "hard") {
			oscillator.frequency.setValueAtTime(200, now);
			oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
			gainNode.gain.setValueAtTime(0.2, now);
			gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
			oscillator.stop(now + 0.15);
		} else {
			oscillator.frequency.setValueAtTime(400, now);
			oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.08);
			gainNode.gain.setValueAtTime(0.08, now);
			gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
			oscillator.stop(now + 0.1);
		}
	},

	showHUDAlert: function (message, color) {
		this.el.emit("hud-alert", {
			message: message,
			color: color,
			duration: 1500,
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

console.log("📦 Collision Feedback OTIMIZADO carregado!");
