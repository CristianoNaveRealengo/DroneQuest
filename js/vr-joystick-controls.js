/**
 * Controles VR com Joysticks Virtuais (Thumbsticks)
 * Controllers do Quest funcionam como joysticks de nave
 * CORRIGIDO: Direções corretas + Inclinação visual de 15°
 */

AFRAME.registerComponent("vr-joystick-controls", {
	schema: {
		moveSpeed: { type: "number", default: 3.0 },
		rotationSpeed: { type: "number", default: 1.2 },
		enabled: { type: "boolean", default: true },
	},

	init: function () {
		console.log("🎮 Controles VR Joystick iniciados (CORRIGIDOS)");

		this.leftController = null;
		this.rightController = null;

		// Aguardar controllers carregarem
		setTimeout(() => {
			this.setupControllers();
		}, 1000);
	},

	setupControllers: function () {
		this.leftController = document.querySelector("#leftHand");
		this.rightController = document.querySelector("#rightHand");

		if (this.leftController) {
			console.log("✅ Controller esquerdo conectado");
		}
		if (this.rightController) {
			console.log("✅ Controller direito conectado");
		}
	},

	tick: function (time, deltaTime) {
		if (!this.data.enabled || !deltaTime) return;

		const dt = deltaTime / 1000;
		const drone = this.el;
		const position = drone.getAttribute("position");
		const rotation = drone.getAttribute("rotation");

		// Verificar se está em modo VR
		const isVR = this.el.sceneEl.is("vr-mode");

		if (!isVR) return; // Só funciona em VR

		// Variável para inclinação visual (apenas frontal)
		let targetPitch = 0;

		// === CONTROLLER ESQUERDO - MOVIMENTO (Thumbstick) ===
		if (this.leftController) {
			const leftGamepad =
				this.leftController.components["oculus-touch-controls"];

			if (
				leftGamepad &&
				leftGamepad.controller &&
				leftGamepad.controller.gamepad
			) {
				const axes = leftGamepad.controller.gamepad.axes;

				if (axes && axes.length >= 4) {
					const stickX = axes[2]; // Thumbstick X (esquerda/direita)
					const stickY = axes[3]; // Thumbstick Y (frente/trás)

					// Movimento lateral (strafe) - CORRIGIDO (SEM inclinação lateral)
					if (Math.abs(stickX) > 0.1) {
						const strafe = new THREE.Vector3(stickX, 0, 0);
						strafe.applyAxisAngle(
							new THREE.Vector3(0, 1, 0),
							THREE.MathUtils.degToRad(rotation.y)
						);
						position.x += strafe.x * this.data.moveSpeed * dt;
						position.z += strafe.z * this.data.moveSpeed * dt;
					}

					// Movimento frente/trás - CORRIGIDO
					if (Math.abs(stickY) > 0.1) {
						const forward = new THREE.Vector3(0, 0, -stickY); // Invertido para corrigir
						forward.applyAxisAngle(
							new THREE.Vector3(0, 1, 0),
							THREE.MathUtils.degToRad(rotation.y)
						);
						position.x += forward.x * this.data.moveSpeed * dt;
						position.z += forward.z * this.data.moveSpeed * dt;

						// Inclinação visual de 15° frente/trás
						targetPitch = stickY * 15;
					}
				}

				// Botões para subir/descer
				const buttons = leftGamepad.controller.gamepad.buttons;
				if (buttons) {
					// X button (índice 4) - Subir
					if (buttons[4] && buttons[4].pressed) {
						position.y += this.data.moveSpeed * dt;
					}
					// Y button (índice 5) - Descer
					if (buttons[5] && buttons[5].pressed) {
						position.y -= this.data.moveSpeed * dt;
					}
				}
			}
		}

		// === CONTROLLER DIREITO - ROTAÇÃO (Thumbstick) ===
		if (this.rightController) {
			const rightGamepad =
				this.rightController.components["oculus-touch-controls"];

			if (
				rightGamepad &&
				rightGamepad.controller &&
				rightGamepad.controller.gamepad
			) {
				const axes = rightGamepad.controller.gamepad.axes;

				if (axes && axes.length >= 4) {
					const stickX = axes[2]; // Thumbstick X - Rotação horizontal (yaw)

					// Rotação horizontal
					if (Math.abs(stickX) > 0.1) {
						rotation.y -=
							stickX * this.data.rotationSpeed * 50 * dt;
					}
				}
			}
		}

		// Aplicar inclinação visual suave (apenas frontal)
		const smoothing = 0.1;
		rotation.x = THREE.MathUtils.lerp(rotation.x, targetPitch, smoothing);

		// Limitar altura mínima
		if (position.y < 0.5) {
			position.y = 0.5;
		}

		// Aplicar transformações
		drone.setAttribute("position", position);
		drone.setAttribute("rotation", rotation);
	},
});

console.log("📦 VR Joystick Controls carregado (CORRIGIDO)!");
