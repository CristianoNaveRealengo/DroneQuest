/**
 * Fix para Rotação do Drone - MODO AGRESSIVO
 * Previne o drone de virar de cabeça para baixo com correção forçada
 */

AFRAME.registerComponent("drone-rotation-limiter", {
	schema: {
		maxPitch: { type: "number", default: 20 }, // Reduzido para 20° (muito seguro)
		maxRoll: { type: "number", default: 10 }, // Reduzido para 10° (super estável)
		autoCorrect: { type: "boolean", default: true },
		correctionSpeed: { type: "number", default: 8.0 }, // Aumentado para 8x mais rápido
		forceLevel: { type: "boolean", default: true }, // Forçar nivelamento SEMPRE
	},

	init: function () {
		console.log(
			"🔒 Limitador de rotação do drone ativado (MODO ULTRA AGRESSIVO)"
		);
		console.log(
			`📐 Limites RESTRITOS: Pitch ±${this.data.maxPitch}°, Roll ±${this.data.maxRoll}°`
		);

		this.lastValidRotation = { x: 0, y: 0, z: 0 };
		this.correctionActive = false;
		this.emergencyCorrection = false;
		this.lastWarningTime = 0;
	},

	tick: function (time, deltaTime) {
		if (!deltaTime) return;

		const rotation = this.el.getAttribute("rotation");
		const dt = deltaTime / 1000;

		// Normalizar ângulos para -180 a 180
		const normalizedX = this.normalizeAngle(rotation.x);
		const normalizedZ = this.normalizeAngle(rotation.z);

		let correctedRotation = {
			x: normalizedX,
			y: rotation.y,
			z: normalizedZ,
		};

		// 🚨 EMERGÊNCIA CRÍTICA: Drone virando de cabeça para baixo (> 60°)
		if (Math.abs(normalizedX) > 60 || Math.abs(normalizedZ) > 45) {
			if (Date.now() - this.lastWarningTime > 1000) {
				console.error(
					"🚨 EMERGÊNCIA CRÍTICA! DRONE VIRANDO! Correção FORÇADA!"
				);
				this.lastWarningTime = Date.now();
			}
			// FORÇAR para 0° IMEDIATAMENTE
			correctedRotation.x = 0;
			correctedRotation.z = 0;
			this.emergencyCorrection = true;
			this.correctionActive = true;
		}
		// ⚠️ ALERTA ALTO: Inclinação perigosa (> 35°)
		else if (Math.abs(normalizedX) > 35 || Math.abs(normalizedZ) > 25) {
			if (Date.now() - this.lastWarningTime > 2000) {
				console.warn("⚠️ ALERTA! Inclinação perigosa detectada!");
				this.lastWarningTime = Date.now();
			}
			// Reduzir para limite seguro
			correctedRotation.x =
				Math.sign(normalizedX) *
				Math.min(Math.abs(normalizedX), this.data.maxPitch);
			correctedRotation.z =
				Math.sign(normalizedZ) *
				Math.min(Math.abs(normalizedZ), this.data.maxRoll);
			this.correctionActive = true;
		}
		// Limitar pitch e roll normalmente
		else {
			if (Math.abs(normalizedX) > this.data.maxPitch) {
				correctedRotation.x =
					Math.sign(normalizedX) * this.data.maxPitch;
			}
			if (Math.abs(normalizedZ) > this.data.maxRoll) {
				correctedRotation.z =
					Math.sign(normalizedZ) * this.data.maxRoll;
			}
		}

		// FORÇAR NIVELAMENTO CONTÍNUO (sempre puxando para 0°)
		if (this.data.forceLevel) {
			const levelSpeed = this.emergencyCorrection ? 15.0 : 3.0;
			correctedRotation.x = this.lerp(
				correctedRotation.x,
				0,
				levelSpeed * dt
			);
			correctedRotation.z = this.lerp(
				correctedRotation.z,
				0,
				levelSpeed * dt
			);
		}

		// Aplicar correção automática
		if (
			this.data.autoCorrect &&
			(this.correctionActive || this.emergencyCorrection)
		) {
			const speed = this.emergencyCorrection
				? 20.0
				: this.data.correctionSpeed;
			correctedRotation.x = this.lerp(correctedRotation.x, 0, speed * dt);
			correctedRotation.z = this.lerp(correctedRotation.z, 0, speed * dt);

			// Desativar correção quando nivelado
			if (
				Math.abs(correctedRotation.x) < 3 &&
				Math.abs(correctedRotation.z) < 3
			) {
				if (this.emergencyCorrection) {
					console.log("✅ Emergência resolvida - Drone nivelado!");
				}
				this.correctionActive = false;
				this.emergencyCorrection = false;
			}
		}

		// SEMPRE aplicar rotação corrigida (não apenas quando necessário)
		this.el.setAttribute("rotation", correctedRotation);

		// Salvar última rotação válida
		if (!this.correctionActive && !this.emergencyCorrection) {
			this.lastValidRotation = {
				x: correctedRotation.x,
				y: correctedRotation.y,
				z: correctedRotation.z,
			};
		}
	},

	normalizeAngle: function (angle) {
		// Normalizar ângulo para -180 a 180
		while (angle > 180) angle -= 360;
		while (angle < -180) angle += 360;
		return angle;
	},

	lerp: function (start, end, t) {
		return start + (end - start) * Math.min(t, 1);
	},
});

console.log(
	"📦 Módulo drone-rotation-fix.js carregado (MODO ULTRA AGRESSIVO)!"
);
