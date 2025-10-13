/**
 * Fix para Rotação do Drone
 * Previne o drone de virar de cabeça para baixo
 */

AFRAME.registerComponent("drone-rotation-limiter", {
	schema: {
		maxPitch: { type: "number", default: 45 }, // Máximo 45° para frente/trás
		maxRoll: { type: "number", default: 30 }, // Máximo 30° para os lados
		autoCorrect: { type: "boolean", default: true },
		correctionSpeed: { type: "number", default: 2.0 },
	},

	init: function () {
		console.log("🔒 Limitador de rotação do drone ativado");
		console.log(
			`📐 Limites: Pitch ±${this.data.maxPitch}°, Roll ±${this.data.maxRoll}°`
		);

		this.lastValidRotation = { x: 0, y: 0, z: 0 };
		this.correctionActive = false;
	},

	tick: function (time, deltaTime) {
		if (!deltaTime) return;

		const rotation = this.el.getAttribute("rotation");
		const dt = deltaTime / 1000;

		// Normalizar ângulos para -180 a 180
		const normalizedX = this.normalizeAngle(rotation.x);
		const normalizedZ = this.normalizeAngle(rotation.z);

		let needsCorrection = false;
		let correctedRotation = {
			x: normalizedX,
			y: rotation.y,
			z: normalizedZ,
		};

		// Verificar se está de cabeça para baixo (pitch > 90° ou < -90°)
		if (Math.abs(normalizedX) > 90) {
			console.warn("⚠️ DRONE DE CABEÇA PARA BAIXO! Corrigindo...");
			correctedRotation.x = this.lastValidRotation.x;
			needsCorrection = true;
			this.correctionActive = true;
		}
		// Limitar pitch (inclinação frente/trás)
		else if (Math.abs(normalizedX) > this.data.maxPitch) {
			correctedRotation.x = Math.sign(normalizedX) * this.data.maxPitch;
			needsCorrection = true;
		}

		// Limitar roll (inclinação lateral)
		if (Math.abs(normalizedZ) > this.data.maxRoll) {
			correctedRotation.x = Math.sign(normalizedZ) * this.data.maxRoll;
			needsCorrection = true;
		}

		// Aplicar correção automática se ativada
		if (this.data.autoCorrect && this.correctionActive) {
			// Suavizar correção para 0° (nivelado)
			correctedRotation.x = this.lerp(
				correctedRotation.x,
				0,
				this.data.correctionSpeed * dt
			);
			correctedRotation.z = this.lerp(
				correctedRotation.z,
				0,
				this.data.correctionSpeed * dt
			);

			// Desativar correção quando estiver próximo de nivelado
			if (
				Math.abs(correctedRotation.x) < 1 &&
				Math.abs(correctedRotation.z) < 1
			) {
				this.correctionActive = false;
				console.log("✅ Drone nivelado com sucesso");
			}
		}

		// Aplicar rotação corrigida se necessário
		if (needsCorrection || this.correctionActive) {
			this.el.setAttribute("rotation", correctedRotation);
		}

		// Salvar última rotação válida
		if (!needsCorrection && !this.correctionActive) {
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

console.log("📦 Módulo drone-rotation-fix.js carregado com sucesso!");
