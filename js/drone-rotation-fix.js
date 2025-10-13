/**
 * Fix para Rotação do Drone - MODO BALANCEADO
 * Previne mortais mas permite movimento normal
 */

AFRAME.registerComponent("drone-rotation-limiter", {
	schema: {
		maxPitch: { type: "number", default: 35 }, // 35° permite movimento
		maxRoll: { type: "number", default: 25 }, // 25° permite curvas
		autoCorrect: { type: "boolean", default: true },
		correctionSpeed: { type: "number", default: 5.0 },
		emergencyThreshold: { type: "number", default: 70 }, // Só corrige acima de 70°
	},

	init: function () {
		console.log("🔒 Limitador de rotação ativado (MODO BALANCEADO)");
		console.log(
			`📐 Limites: Pitch ±${this.data.maxPitch}°, Roll ±${this.data.maxRoll}°`
		);
		console.log(`🚨 Emergência: >${this.data.emergencyThreshold}°`);

		this.lastValidRotation = { x: 0, y: 0, z: 0 };
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

		let needsCorrection = false;
		let correctedRotation = {
			x: normalizedX,
			y: rotation.y,
			z: normalizedZ,
		};

		// 🚨 EMERGÊNCIA: Drone virando perigosamente (> 70°)
		if (
			Math.abs(normalizedX) > this.data.emergencyThreshold ||
			Math.abs(normalizedZ) > this.data.emergencyThreshold - 10
		) {
			if (Date.now() - this.lastWarningTime > 1000) {
				console.error("🚨 EMERGÊNCIA! Correção ativada!");
				this.lastWarningTime = Date.now();
			}
			// Reduzir para zona segura (não para 0°)
			correctedRotation.x = Math.sign(normalizedX) * 30;
			correctedRotation.z = Math.sign(normalizedZ) * 20;
			this.emergencyCorrection = true;
			needsCorrection = true;
		}
		// ⚠️ ALERTA: Inclinação alta mas controlável (> 50°)
		else if (Math.abs(normalizedX) > 50 || Math.abs(normalizedZ) > 40) {
			// Limitar mas permitir movimento
			correctedRotation.x = Math.sign(normalizedX) * 45;
			correctedRotation.z = Math.sign(normalizedZ) * 35;
			needsCorrection = true;
		}
		// Limites normais de operação
		else {
			if (Math.abs(normalizedX) > this.data.maxPitch) {
				correctedRotation.x =
					Math.sign(normalizedX) * this.data.maxPitch;
				needsCorrection = true;
			}
			if (Math.abs(normalizedZ) > this.data.maxRoll) {
				correctedRotation.z =
					Math.sign(normalizedZ) * this.data.maxRoll;
				needsCorrection = true;
			}
		}

		// Correção de emergência (apenas quando crítico)
		if (this.data.autoCorrect && this.emergencyCorrection) {
			const speed = 12.0;
			correctedRotation.x = this.lerp(correctedRotation.x, 0, speed * dt);
			correctedRotation.z = this.lerp(correctedRotation.z, 0, speed * dt);

			// Desativar quando voltar à zona segura
			if (
				Math.abs(correctedRotation.x) < 40 &&
				Math.abs(correctedRotation.z) < 30
			) {
				console.log("✅ Zona segura restaurada");
				this.emergencyCorrection = false;
			}
		}

		// Aplicar correção APENAS quando necessário (não sempre)
		if (needsCorrection || this.emergencyCorrection) {
			this.el.setAttribute("rotation", correctedRotation);
		}

		// Salvar última rotação válida
		if (!this.emergencyCorrection) {
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

console.log("📦 Módulo drone-rotation-fix.js carregado (MODO BALANCEADO)!");
