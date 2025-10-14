/**
 * HUD Fixo do Cockpit
 * Fica preso na tela, não segue movimento da cabeça em VR
 */

AFRAME.registerComponent("fixed-cockpit-hud", {
	schema: {
		enabled: { type: "boolean", default: true },
		hudWidth: { type: "number", default: 2.0 },
		hudHeight: { type: "number", default: 1.2 },
		opacity: { type: "number", default: 0.95 },
	},

	init: function () {
		console.log("🖥️ HUD Fixo do Cockpit iniciado");

		this.hudData = {
			speed: 0,
			altitude: 0,
			battery: 100,
			mode: "NORMAL",
			coordinates: { x: 0, y: 0, z: 0 },
			heading: 0,
		};

		this.startTime = Date.now();
		this.drone = null;

		setTimeout(() => {
			this.createFixedHUD();
			this.startUpdateLoop();
		}, 500);
	},

	createFixedHUD: function () {
		console.log("🎨 Criando HUD fixo...");

		const container = this.el;

		// Canvas para o HUD
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		// Criar textura do canvas
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		this.texture = texture;

		// Criar plano para o HUD
		const geometry = new THREE.PlaneGeometry(
			this.data.hudWidth,
			this.data.hudHeight
		);
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: this.data.opacity,
			side: THREE.DoubleSide,
			depthTest: false,
			depthWrite: false,
		});

		const hudMesh = new THREE.Mesh(geometry, material);
		hudMesh.renderOrder = 9999; // Renderizar por último

		container.setObject3D("hud", hudMesh);

		console.log("✅ HUD fixo criado!");
	},

	startUpdateLoop: function () {
		setInterval(() => {
			if (!this.data.enabled) return;
			this.updateHUDData();
			this.drawHUD();
		}, 100); // Atualizar a cada 100ms
	},

	updateHUDData: function () {
		if (!this.drone) {
			this.drone = document.querySelector("#drone");
			if (!this.drone) return;
		}

		const position = this.drone.getAttribute("position");
		const rotation = this.drone.getAttribute("rotation");

		// Calcular velocidade (simplificado)
		if (this.lastPosition) {
			const dx = position.x - this.lastPosition.x;
			const dy = position.y - this.lastPosition.y;
			const dz = position.z - this.lastPosition.z;
			this.hudData.speed = Math.sqrt(dx * dx + dy * dy + dz * dz) * 10;
		}
		this.lastPosition = { ...position };

		this.hudData.altitude = position.y.toFixed(1);
		this.hudData.coordinates = {
			x: position.x.toFixed(1),
			y: position.y.toFixed(1),
			z: position.z.toFixed(1),
		};
		this.hudData.heading = (((rotation.y % 360) + 360) % 360).toFixed(0);
	},

	drawHUD: function () {
		const ctx = this.ctx;
		const w = this.canvas.width;
		const h = this.canvas.height;

		// Limpar canvas
		ctx.clearRect(0, 0, w, h);

		// Estilo futurístico
		ctx.strokeStyle = "#00ffff";
		ctx.fillStyle = "#00ffff";
		ctx.lineWidth = 2;
		ctx.font = 'bold 32px "Courier New"';

		// Fundo semi-transparente
		ctx.fillStyle = "rgba(0, 20, 30, 0.3)";
		ctx.fillRect(0, 0, w, h);

		// Borda
		ctx.strokeStyle = "#00ffff";
		ctx.strokeRect(10, 10, w - 20, h - 20);

		// === DADOS PRINCIPAIS ===
		ctx.fillStyle = "#00ffff";
		ctx.font = 'bold 40px "Courier New"';

		// Velocidade (esquerda superior)
		ctx.fillText(`SPD: ${this.hudData.speed.toFixed(0)} m/s`, 40, 60);

		// Altitude (esquerda)
		ctx.fillText(`ALT: ${this.hudData.altitude} m`, 40, 120);

		// Bateria (esquerda)
		const batteryColor =
			this.hudData.battery > 50
				? "#00ff00"
				: this.hudData.battery > 20
				? "#ffff00"
				: "#ff0000";
		ctx.fillStyle = batteryColor;
		ctx.fillText(`BAT: ${this.hudData.battery}%`, 40, 180);

		// Heading (direita superior)
		ctx.fillStyle = "#00ffff";
		ctx.fillText(`HDG: ${this.hudData.heading}°`, w - 300, 60);

		// Modo (direita)
		ctx.fillText(`MODE: ${this.hudData.mode}`, w - 350, 120);

		// Coordenadas (centro inferior)
		ctx.font = 'bold 28px "Courier New"';
		const coordText = `X:${this.hudData.coordinates.x} Y:${this.hudData.coordinates.y} Z:${this.hudData.coordinates.z}`;
		ctx.fillText(coordText, w / 2 - 200, h - 40);

		// Tempo de missão (centro superior)
		const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
		const minutes = Math.floor(elapsed / 60);
		const seconds = elapsed % 60;
		ctx.fillText(
			`TIME: ${minutes}:${seconds.toString().padStart(2, "0")}`,
			w / 2 - 100,
			60
		);

		// Crosshair central
		ctx.strokeStyle = "#00ff00";
		ctx.lineWidth = 3;
		const cx = w / 2;
		const cy = h / 2;
		ctx.beginPath();
		ctx.moveTo(cx - 30, cy);
		ctx.lineTo(cx - 10, cy);
		ctx.moveTo(cx + 10, cy);
		ctx.lineTo(cx + 30, cy);
		ctx.moveTo(cx, cy - 30);
		ctx.lineTo(cx, cy - 10);
		ctx.moveTo(cx, cy + 10);
		ctx.lineTo(cx, cy + 30);
		ctx.stroke();

		// Círculo central
		ctx.beginPath();
		ctx.arc(cx, cy, 5, 0, Math.PI * 2);
		ctx.stroke();

		// Atualizar textura
		this.texture.needsUpdate = true;
	},

	remove: function () {
		if (this.el.getObject3D("hud")) {
			this.el.removeObject3D("hud");
		}
	},
});

// Controles de teclado para o HUD
document.addEventListener("keydown", (evt) => {
	const hudContainer = document.querySelector("#fixed-hud-container");
	if (!hudContainer) return;

	const hudComponent = hudContainer.components["fixed-cockpit-hud"];
	if (!hudComponent) return;

	switch (evt.key.toLowerCase()) {
		case "h":
			hudComponent.data.enabled = !hudComponent.data.enabled;
			console.log("🖥️ HUD:", hudComponent.data.enabled ? "ON" : "OFF");
			break;
		case "j":
			hudComponent.data.opacity = (hudComponent.data.opacity + 0.2) % 1.2;
			if (hudComponent.data.opacity < 0.3)
				hudComponent.data.opacity = 0.3;
			console.log("🖥️ Opacidade:", hudComponent.data.opacity.toFixed(1));
			break;
	}
});

console.log("📦 HUD Fixo do Cockpit carregado!");
