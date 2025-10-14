/**
 * Controlador Simplificado do Drone
 * Apenas controles básicos de movimento
 */

AFRAME.registerComponent("drone-controller", {
	schema: {
		// Velocidades
		moveSpeed: { type: "number", default: 2.0 },
		rotationSpeed: { type: "number", default: 0.6 },

		// Física
		drag: { type: "number", default: 0.85 },
	},

	init: function () {
		console.log("🚁 Controlador simplificado do drone iniciado");

		// Vetores de movimento
		this.velocity = new THREE.Vector3();

		// Controles
		this.keys = {};
		this.setupKeyboardControls();

		// Ativar drone automaticamente
		setTimeout(() => {
			console.log("✅ Drone ativado");
		}, 500);
	},

	setupKeyboardControls: function () {
		window.addEventListener("keydown", (e) => {
			this.keys[e.code] = true;
			console.log(`🎮 Tecla pressionada: ${e.code}`);
		});

		window.addEventListener("keyup", (e) => {
			this.keys[e.code] = false;
		});

		// Mostrar controles
		this.showControls();
	},

	showControls: function () {
		const helpPanel = document.createElement("div");
		helpPanel.style.cssText = `
			position: fixed;
			bottom: 10px;
			left: 10px;
			background: rgba(0, 0, 0, 0.8);
			color: #ffffff;
			padding: 15px;
			border-radius: 8px;
			font-family: Arial, sans-serif;
			font-size: 14px;
			z-index: 1000;
		`;

		helpPanel.innerHTML = `
			<div style="font-weight: bold; margin-bottom: 8px;">🎮 Controles do Drone</div>
			<div>↑ / I - Frente</div>
			<div>↓ / K - Trás</div>
			<div>← / J - Esquerda</div>
			<div>→ / L - Direita</div>
			<div>W - Subir</div>
			<div>S - Descer</div>
			<div>A - Girar Esquerda</div>
			<div>D - Girar Direita</div>
			<div>R - Reset Posição</div>
		`;

		document.body.appendChild(helpPanel);

		// Auto-ocultar após 8 segundos
		setTimeout(() => {
			if (helpPanel.parentNode) {
				helpPanel.style.opacity = "0.3";
			}
		}, 8000);
	},

	tick: function (time, deltaTime) {
		if (!deltaTime) return;

		const dt = deltaTime / 1000;
		const position = this.el.getAttribute("position");
		const rotation = this.el.getAttribute("rotation");

		// Debug: verificar se alguma tecla está pressionada
		const anyKeyPressed = Object.values(this.keys).some((k) => k === true);
		if (anyKeyPressed && Math.random() < 0.01) {
			// Log ocasional
			console.log(
				"🎮 Teclas ativas:",
				Object.keys(this.keys).filter((k) => this.keys[k])
			);
		}

		// Resetar velocidade
		this.velocity.multiplyScalar(this.data.drag);

		// Variável para controlar inclinação visual (apenas frontal)
		let targetPitch = 0;

		// === MOVIMENTO COM SETAS E IJKL ===

		// Frente (setas ↑ ou I)
		if (this.keys["ArrowUp"] || this.keys["KeyI"]) {
			const forward = new THREE.Vector3(0, 0, -1);
			forward.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				THREE.MathUtils.degToRad(rotation.y)
			);
			this.velocity.add(forward.multiplyScalar(this.data.moveSpeed * dt));
			targetPitch = -15;
		}

		// Trás (setas ↓ ou K)
		if (this.keys["ArrowDown"] || this.keys["KeyK"]) {
			const backward = new THREE.Vector3(0, 0, 1);
			backward.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				THREE.MathUtils.degToRad(rotation.y)
			);
			this.velocity.add(
				backward.multiplyScalar(this.data.moveSpeed * dt)
			);
			targetPitch = 15;
		}

		// Esquerda (setas ← ou J)
		if (this.keys["ArrowLeft"] || this.keys["KeyJ"]) {
			const left = new THREE.Vector3(-1, 0, 0);
			left.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				THREE.MathUtils.degToRad(rotation.y)
			);
			this.velocity.add(left.multiplyScalar(this.data.moveSpeed * dt));
		}

		// Direita (setas → ou L)
		if (this.keys["ArrowRight"] || this.keys["KeyL"]) {
			const right = new THREE.Vector3(1, 0, 0);
			right.applyAxisAngle(
				new THREE.Vector3(0, 1, 0),
				THREE.MathUtils.degToRad(rotation.y)
			);
			this.velocity.add(right.multiplyScalar(this.data.moveSpeed * dt));
		}

		// === WASD - SUBIR/DESCER/GIRAR ===

		// Subir (W)
		if (this.keys["KeyW"]) {
			this.velocity.y += this.data.moveSpeed * dt;
		}

		// Descer (S)
		if (this.keys["KeyS"]) {
			this.velocity.y -= this.data.moveSpeed * dt;
		}

		// Girar Esquerda (A)
		if (this.keys["KeyA"]) {
			rotation.y += this.data.rotationSpeed * 50 * dt;
		}

		// Girar Direita (D)
		if (this.keys["KeyD"]) {
			rotation.y -= this.data.rotationSpeed * 50 * dt;
		}

		// Retornar inclinação frontal ao centro quando não há movimento
		if (
			!this.keys["ArrowUp"] &&
			!this.keys["ArrowDown"] &&
			!this.keys["KeyI"] &&
			!this.keys["KeyK"]
		) {
			rotation.x = THREE.MathUtils.lerp(rotation.x, 0, 0.05);
		}

		// Aplicar inclinação visual suave (apenas frontal)
		const smoothing = 0.1;
		rotation.x += (targetPitch - rotation.x) * smoothing;

		// === RESET ===
		if (this.keys["KeyR"]) {
			position.x = 0;
			position.y = 3;
			position.z = 0;
			rotation.x = 0;
			rotation.y = 0;
			rotation.z = 0;
			this.velocity.set(0, 0, 0);
			console.log("🔄 Posição resetada");
		}

		// Aplicar movimento
		position.x += this.velocity.x;
		position.y += this.velocity.y;
		position.z += this.velocity.z;

		// Limitar altura mínima
		if (position.y < 0.5) {
			position.y = 0.5;
			this.velocity.y = 0;
		}

		// Aplicar posição e rotação
		this.el.setAttribute("position", position);
		this.el.setAttribute("rotation", rotation);
	},
});

console.log("📦 Controlador simplificado carregado!");
