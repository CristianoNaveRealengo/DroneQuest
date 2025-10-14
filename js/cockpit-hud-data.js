/**
 * Componente para HUD do Cockpit usando imagem hud-01.png
 * HUD fica fixo no painel do cockpit (não segue movimento da cabeça)
 */

AFRAME.registerComponent("cockpit-hud-data", {
	schema: {
		enabled: { type: "boolean", default: true },
	},

	init: function () {
		console.log("🖥️ HUD do Cockpit (hud-01.png) iniciado");

		this.drone = null;
		this.hudData = {
			speed: 0,
			altitude: 0,
			battery: 100,
		};

		// Criar canvas para overlay de dados (opcional)
		this.createDataOverlay();

		// Atualizar dados
		setInterval(() => {
			if (this.data.enabled) {
				this.updateData();
			}
		}, 100);

		// Controles de teclado
		this.setupControls();
	},

	createDataOverlay: function () {
		// Canvas para sobrepor dados dinâmicos na imagem do HUD
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 576;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		// Criar textura do canvas
		const texture = new THREE.CanvasTexture(canvas);
		this.texture = texture;

		// Criar plano para overlay de dados
		const geometry = new THREE.PlaneGeometry(1.6, 0.9);
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: 1.0,
			side: THREE.DoubleSide,
			depthTest: false,
			depthWrite: false,
		});

		const overlayMesh = new THREE.Mesh(geometry, material);
		overlayMesh.position.z = 0.001; // Ligeiramente na frente do HUD
		overlayMesh.renderOrder = 10000;

		this.el.setObject3D("data-overlay", overlayMesh);

		console.log("✅ Overlay de dados criado");
	},

	updateData: function () {
		if (!this.drone) {
			this.drone = document.querySelector("#drone");
			if (!this.drone) return;
		}

		const position = this.drone.getAttribute("position");
		const rotation = this.drone.getAttribute("rotation");

		// Calcular velocidade
		if (this.lastPosition) {
			const dx = position.x - this.lastPosition.x;
			const dy = position.y - this.lastPosition.y;
			const dz = position.z - this.lastPosition.z;
			this.hudData.speed = Math.sqrt(dx * dx + dy * dy + dz * dz) * 10;
		}
		this.lastPosition = { ...position };

		this.hudData.altitude = position.y;
		this.hudData.heading = ((rotation.y % 360) + 360) % 360;

		// Desenhar dados
		this.drawData();
	},

	drawData: function () {
		const ctx = this.ctx;
		const w = this.canvas.width;
		const h = this.canvas.height;

		// Limpar
		ctx.clearRect(0, 0, w, h);

		// Estilo
		ctx.fillStyle = "#00ffff";
		ctx.strokeStyle = "#00ffff";
		ctx.font = 'bold 48px "Courier New"';
		ctx.textAlign = "left";

		// Velocidade (esquerda superior)
		ctx.fillText(`${this.hudData.speed.toFixed(0)}`, 120, 120);

		// Altitude (esquerda meio)
		ctx.fillText(`${this.hudData.altitude.toFixed(1)}`, 120, 280);

		// Bateria (esquerda inferior)
		const batteryColor =
			this.hudData.battery > 50
				? "#00ff00"
				: this.hudData.battery > 20
				? "#ffff00"
				: "#ff0000";
		ctx.fillStyle = batteryColor;
		ctx.fillText(`${this.hudData.battery}`, 120, 440);

		// Heading (direita superior)
		ctx.fillStyle = "#00ffff";
		ctx.textAlign = "right";
		ctx.fillText(`${this.hudData.heading.toFixed(0)}°`, w - 120, 120);

		// Atualizar textura
		this.texture.needsUpdate = true;
	},

	setupControls: function () {
		document.addEventListener("keydown", (evt) => {
			switch (evt.key.toLowerCase()) {
				case "h":
					// Toggle visibilidade do HUD
					const visible = this.el.getAttribute("visible");
					this.el.setAttribute("visible", !visible);
					console.log("🖥️ HUD Cockpit:", !visible ? "ON" : "OFF");
					break;
				case "j":
					// Ajustar opacidade
					const material = this.el.getAttribute("material");
					let opacity = material.opacity || 0.9;
					opacity = (opacity + 0.2) % 1.2;
					if (opacity < 0.3) opacity = 0.3;
					this.el.setAttribute("material", "opacity", opacity);
					console.log("🖥️ Opacidade HUD:", opacity.toFixed(1));
					break;
			}
		});
	},
});

console.log("📦 Cockpit HUD Data carregado!");
