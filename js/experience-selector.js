/**
 * Seletor de Experiência - Drone vs Cockpit VR
 * Permite usuário escolher entre duas experiências diferentes
 */

AFRAME.registerComponent("experience-selector", {
	schema: {
		defaultExperience: { type: "string", default: "cockpit" }, // 'drone' ou 'cockpit'
	},

	init: function () {
		console.log("🎮 Seletor de Experiência iniciado");

		this.currentExperience = this.data.defaultExperience;
		this.droneSimple = null;
		this.droneCockpit = null;
		this.cameraCockpit = null;
		this.cameraDrone = null;

		// Timer de 3 minutos
		this.flightTimer = null;
		this.flightDuration = 180; // 3 minutos em segundos
		this.flightStartTime = null;
		this.timerDisplay = null;

		// Aguardar cena carregar
		if (this.el.hasLoaded) {
			this.setup();
		} else {
			this.el.addEventListener("loaded", () => {
				this.setup();
			});
		}
	},

	setup: function () {
		// Criar menu de seleção
		this.createSelectionMenu();

		// Criar botão flutuante para reabrir menu
		this.createMenuButton();

		// Criar display do timer
		this.createTimerDisplay();

		// Buscar referências dos drones e câmeras
		this.droneCockpit = document.querySelector("#drone");
		this.droneSimple = document.querySelector("#drone-simple");
		this.cameraCockpit = document.querySelector("#drone-camera");

		// Sempre mostrar menu ao iniciar (não carregar preferência salva)
		setTimeout(() => {
			this.showMenu();
		}, 1000);
	},

	createMenuButton: function () {
		// Criar botão flutuante para reabrir menu
		const button = document.createElement("button");
		button.id = "menu-toggle-btn";
		button.innerHTML = "🎮 TROCAR EXPERIÊNCIA";
		button.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			padding: 12px 24px;
			background: linear-gradient(135deg, #00ff88, #00ffff);
			color: #000;
			border: none;
			border-radius: 8px;
			font-weight: bold;
			font-size: 14px;
			cursor: pointer;
			z-index: 9999;
			box-shadow: 0 5px 15px rgba(0, 255, 200, 0.4);
			transition: all 0.3s;
		`;

		button.addEventListener("mouseenter", function () {
			this.style.transform = "scale(1.05)";
			this.style.boxShadow = "0 8px 20px rgba(0, 255, 200, 0.6)";
		});

		button.addEventListener("mouseleave", function () {
			this.style.transform = "scale(1)";
			this.style.boxShadow = "0 5px 15px rgba(0, 255, 200, 0.4)";
		});

		button.addEventListener("click", () => {
			this.showMenu();
		});

		document.body.appendChild(button);
		this.menuButton = button;
	},

	createSelectionMenu: function () {
		// Criar menu HTML
		const menu = document.createElement("div");
		menu.id = "experience-menu";
		menu.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: rgba(0, 20, 40, 0.95);
			padding: 40px;
			border-radius: 15px;
			border: 3px solid #00ffff;
			box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
			z-index: 10000;
			font-family: 'Arial', sans-serif;
			text-align: center;
			display: none;
		`;

		menu.innerHTML = `
			<h1 style="color: #00ffff; margin-bottom: 30px; font-size: 32px; text-shadow: 0 0 10px #00ffff;">
				🚁 ESCOLHA SUA EXPERIÊNCIA
			</h1>
			
			<div style="display: flex; gap: 30px; margin-bottom: 30px;">
				<!-- Opção Drone Simples -->
				<div id="option-drone" class="experience-option" style="
					flex: 1;
					padding: 30px;
					background: rgba(0, 100, 200, 0.3);
					border: 2px solid #0088ff;
					border-radius: 10px;
					cursor: pointer;
					transition: all 0.3s;
				">
					<div style="font-size: 60px; margin-bottom: 15px;">🚁</div>
					<h2 style="color: #00aaff; margin-bottom: 15px;">DRONE SIMPLES</h2>
					<p style="color: #ffffff; font-size: 14px; line-height: 1.6;">
						• Visão externa do drone<br>
						• Controle arcade<br>
						• Ideal para iniciantes<br>
						• Câmera livre
					</p>
				</div>

				<!-- Opção Cockpit VR -->
				<div id="option-cockpit" class="experience-option" style="
					flex: 1;
					padding: 30px;
					background: rgba(0, 200, 100, 0.3);
					border: 2px solid #00ff88;
					border-radius: 10px;
					cursor: pointer;
					transition: all 0.3s;
				">
					<div style="font-size: 60px; margin-bottom: 15px;">🥽</div>
					<h2 style="color: #00ff88; margin-bottom: 15px;">COCKPIT VR</h2>
					<p style="color: #ffffff; font-size: 14px; line-height: 1.6;">
						• Visão de piloto (1ª pessoa)<br>
						• Cockpit imersivo<br>
						• HUD com dados<br>
						• Compatível com VR
					</p>
				</div>
			</div>

			<button id="start-experience" style="
				padding: 15px 40px;
				font-size: 20px;
				background: linear-gradient(135deg, #00ff88, #00ffff);
				color: #000;
				border: none;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				box-shadow: 0 5px 15px rgba(0, 255, 200, 0.4);
				transition: all 0.3s;
			">
				INICIAR EXPERIÊNCIA
			</button>

			<div style="margin-top: 20px; color: #888; font-size: 12px;">
				<strong style="color: #00ffff;">E</strong> - Trocar rapidamente | 
				<strong style="color: #00ffff;">M</strong> - Abrir este menu
			</div>
		`;

		document.body.appendChild(menu);

		// Adicionar eventos
		const optionDrone = document.getElementById("option-drone");
		const optionCockpit = document.getElementById("option-cockpit");
		const startBtn = document.getElementById("start-experience");

		// Hover effects
		const options = document.querySelectorAll(".experience-option");
		options.forEach((option) => {
			option.addEventListener("mouseenter", function () {
				this.style.transform = "scale(1.05)";
				this.style.boxShadow = "0 10px 30px rgba(0, 255, 255, 0.3)";
			});
			option.addEventListener("mouseleave", function () {
				this.style.transform = "scale(1)";
				this.style.boxShadow = "none";
			});
		});

		// Seleção
		optionDrone.addEventListener("click", () => {
			this.selectOption("drone");
		});

		optionCockpit.addEventListener("click", () => {
			this.selectOption("cockpit");
		});

		// Botão iniciar
		startBtn.addEventListener("click", () => {
			this.startExperience();
		});

		// Atalhos de teclado
		document.addEventListener("keydown", (evt) => {
			// E - Trocar experiência rapidamente
			if (evt.key.toLowerCase() === "e") {
				this.toggleExperience();
			}
			// M - Abrir menu de seleção
			if (evt.key.toLowerCase() === "m") {
				this.showMenu();
			}
		});

		this.menu = menu;

		// Selecionar opção padrão
		this.selectOption(this.currentExperience);
	},

	selectOption: function (experience) {
		this.currentExperience = experience;

		const optionDrone = document.getElementById("option-drone");
		const optionCockpit = document.getElementById("option-cockpit");

		// Reset styles
		optionDrone.style.border = "2px solid #0088ff";
		optionDrone.style.background = "rgba(0, 100, 200, 0.3)";
		optionCockpit.style.border = "2px solid #00ff88";
		optionCockpit.style.background = "rgba(0, 200, 100, 0.3)";

		// Highlight selected
		if (experience === "drone") {
			optionDrone.style.border = "4px solid #00ffff";
			optionDrone.style.background = "rgba(0, 150, 255, 0.5)";
		} else {
			optionCockpit.style.border = "4px solid #00ffff";
			optionCockpit.style.background = "rgba(0, 255, 150, 0.5)";
		}

		console.log(`✅ Experiência selecionada: ${experience}`);
	},

	showMenu: function () {
		if (this.menu) {
			this.menu.style.display = "block";
		}
	},

	hideMenu: function () {
		if (this.menu) {
			this.menu.style.display = "none";
		}
	},

	startExperience: function () {
		console.log(`🚀 Iniciando experiência: ${this.currentExperience}`);

		// Esconder menu
		this.hideMenu();

		// Aplicar experiência
		this.switchExperience(this.currentExperience, true);

		// Esconder tela de loading se existir
		const loading = document.getElementById("loading");
		if (loading) {
			loading.style.display = "none";
		}

		// Iniciar timer de 3 minutos
		this.startFlightTimer();
	},

	switchExperience: function (experience, showNotification = true) {
		console.log(`🔄 Trocando para experiência: ${experience}`);

		if (experience === "drone") {
			this.activateDroneSimple();
		} else {
			this.activateCockpit();
		}

		if (showNotification) {
			this.showNotification(
				experience === "drone"
					? "🚁 MODO DRONE SIMPLES"
					: "🥽 MODO COCKPIT VR"
			);
		}
	},

	activateDroneSimple: function () {
		// Criar drone simples se não existir
		if (!this.droneSimple) {
			this.createSimpleDrone();
		}

		// Ativar drone simples
		if (this.droneSimple) {
			this.droneSimple.setAttribute("visible", true);
			this.droneSimple.setAttribute("drone-controller", "enabled: true");

			// Ativar hover animation no drone simples
			this.droneSimple.setAttribute(
				"hover-animation",
				"enabled: true; amplitude: 0.08; duration: 2000"
			);
		}

		// Desativar cockpit
		if (this.droneCockpit) {
			this.droneCockpit.setAttribute("visible", false);
			this.droneCockpit.setAttribute(
				"drone-controller",
				"enabled: false"
			);
			this.droneCockpit.setAttribute(
				"vr-joystick-controls",
				"enabled: false"
			);

			// Manter hover animation no cockpit (sempre ativo)
			this.droneCockpit.setAttribute("hover-animation", "enabled: true");
		}

		// Gerenciar câmeras: ativar câmera externa, desativar interna
		this.switchToDroneCamera();

		console.log("✅ Drone simples ativado com câmera embaixo e HUD");
	},

	activateCockpit: function () {
		// Ativar cockpit
		if (this.droneCockpit) {
			this.droneCockpit.setAttribute("visible", true);
			this.droneCockpit.setAttribute("drone-controller", "enabled: true");
			this.droneCockpit.setAttribute(
				"vr-joystick-controls",
				"enabled: true"
			);

			// Garantir hover animation ativo
			this.droneCockpit.setAttribute(
				"hover-animation",
				"enabled: true; amplitude: 0.08; duration: 2000"
			);
		}

		// Desativar drone simples
		if (this.droneSimple) {
			this.droneSimple.setAttribute("visible", false);
			this.droneSimple.setAttribute("drone-controller", "enabled: false");

			// Desativar hover do drone simples
			if (this.droneSimple.components["hover-animation"]) {
				this.droneSimple.setAttribute(
					"hover-animation",
					"enabled: false"
				);
			}
		}

		// Gerenciar câmeras: ativar câmera interna, desativar externa
		this.switchToCockpitCamera();

		console.log(
			"✅ Cockpit VR ativado com câmera interna e hover animation"
		);
	},

	createSimpleDrone: function () {
		console.log("🔨 Criando drone simples...");

		const scene = this.el.sceneEl;

		// Criar entidade do drone simples (posição diferente do cockpit)
		const drone = document.createElement("a-entity");
		drone.setAttribute("id", "drone-simple");
		drone.setAttribute("position", "0 3 10"); // 10m à frente do cockpit
		drone.setAttribute(
			"hover-animation",
			"enabled: true; amplitude: 0.08; duration: 2000"
		);

		// Modelo do drone (simples)
		const model = document.createElement("a-box");
		model.setAttribute("width", "1");
		model.setAttribute("height", "0.3");
		model.setAttribute("depth", "1");
		model.setAttribute("color", "#ff6600");
		model.setAttribute("metalness", "0.8");
		model.setAttribute("roughness", "0.2");
		drone.appendChild(model);

		// Hélices (visual) - Mais visíveis e com animação
		const propPositions = [
			{ x: 0.4, z: 0.4 },
			{ x: -0.4, z: 0.4 },
			{ x: 0.4, z: -0.4 },
			{ x: -0.4, z: -0.4 },
		];

		propPositions.forEach((pos, i) => {
			const prop = document.createElement("a-cylinder");
			prop.setAttribute("radius", "0.25");
			prop.setAttribute("height", "0.05");
			prop.setAttribute("color", "#222222");
			prop.setAttribute("position", `${pos.x} 0.25 ${pos.z}`);
			prop.setAttribute("metalness", "0.5");
			prop.setAttribute("roughness", "0.3");
			prop.setAttribute("animation", {
				property: "rotation",
				to: "0 360 0",
				loop: true,
				dur: 150,
				easing: "linear",
			});
			drone.appendChild(prop);
		});

		// Câmera embaixo do drone (vendo as hélices)
		const camera = document.createElement("a-camera");
		camera.setAttribute("id", "camera-simple");
		camera.setAttribute("position", "0 -0.3 0");
		camera.setAttribute("rotation", "0 0 0");
		camera.setAttribute("look-controls", "enabled: true");
		camera.setAttribute("wasd-controls", "enabled: true; acceleration: 20");

		// HUD para o drone simples (na frente da câmera)
		const droneHUD = document.createElement("a-plane");
		droneHUD.setAttribute("id", "drone-simple-hud");
		droneHUD.setAttribute("position", "0 0 -1.5");
		droneHUD.setAttribute("width", "2.0");
		droneHUD.setAttribute("height", "1.5");
		droneHUD.setAttribute("material", {
			src: "assets/drone/hud-01.svg",
			transparent: true,
			opacity: 0.4,
			shader: "flat",
			depthWrite: false,
			depthTest: true,
		});
		droneHUD.setAttribute("render-order", "-1");
		camera.appendChild(droneHUD);

		drone.appendChild(camera);

		scene.appendChild(drone);
		this.droneSimple = drone;

		console.log("✅ Drone simples criado");
	},

	toggleExperience: function () {
		const newExperience =
			this.currentExperience === "drone" ? "cockpit" : "drone";
		this.currentExperience = newExperience;
		this.switchExperience(newExperience, true);
		localStorage.setItem("droneExperience", newExperience);
	},

	showNotification: function (message) {
		const notification = document.createElement("div");
		notification.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 255, 255, 0.9);
			color: #000;
			padding: 20px 40px;
			border-radius: 10px;
			font-size: 24px;
			font-weight: bold;
			z-index: 9999;
			box-shadow: 0 5px 20px rgba(0, 255, 255, 0.5);
			animation: slideDown 0.5s ease-out;
		`;

		notification.textContent = message;
		document.body.appendChild(notification);

		// Remover após 3 segundos
		setTimeout(() => {
			notification.style.animation = "slideUp 0.5s ease-out";
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 500);
		}, 3000);
	},

	// === GERENCIAMENTO DE CÂMERAS ===

	switchToCockpitCamera: function () {
		console.log("📷 Ativando câmera do cockpit (interna)");

		// Ativar câmera interna do cockpit
		if (this.cameraCockpit) {
			this.cameraCockpit.setAttribute("camera", "active: true");
			this.cameraCockpit.setAttribute("look-controls", "enabled: true");
		}

		// Desativar câmera externa do drone (se existir)
		if (this.cameraDrone) {
			this.cameraDrone.setAttribute("camera", "active: false");
			this.cameraDrone.setAttribute("look-controls", "enabled: false");
		}

		console.log("✅ Câmera cockpit ativada");
	},

	switchToDroneCamera: function () {
		console.log("📷 Ativando câmera do drone (externa)");

		// Buscar ou criar câmera externa
		if (!this.cameraDrone && this.droneSimple) {
			this.cameraDrone = this.droneSimple.querySelector("#camera-simple");
		}

		// Ativar câmera externa
		if (this.cameraDrone) {
			this.cameraDrone.setAttribute("camera", "active: true");
			this.cameraDrone.setAttribute("look-controls", "enabled: true");
		}

		// Desativar câmera interna do cockpit
		if (this.cameraCockpit) {
			this.cameraCockpit.setAttribute("camera", "active: false");
			this.cameraCockpit.setAttribute("look-controls", "enabled: false");
		}

		console.log("✅ Câmera drone ativada");
	},

	// === SISTEMA DE TIMER DE 3 MINUTOS ===

	createTimerDisplay: function () {
		this.timerDisplay = document.createElement("div");
		this.timerDisplay.id = "flight-timer";
		this.timerDisplay.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			color: #00ff00;
			font-size: 28px;
			font-weight: bold;
			font-family: 'Courier New', monospace;
			z-index: 8000;
			display: none;
			text-align: center;
			text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
		`;
		document.body.appendChild(this.timerDisplay);
	},

	startFlightTimer: function () {
		console.log("⏱️ Iniciando timer de 3 minutos");

		this.flightStartTime = Date.now();
		this.timerDisplay.style.display = "block";

		// Atualizar timer a cada segundo
		this.flightTimer = setInterval(() => {
			const elapsed = Math.floor(
				(Date.now() - this.flightStartTime) / 1000
			);
			const remaining = Math.max(0, this.flightDuration - elapsed);

			// Formatar tempo MM:SS
			const minutes = Math.floor(remaining / 60);
			const seconds = remaining % 60;
			const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
				.toString()
				.padStart(2, "0")}`;

			this.timerDisplay.textContent = timeString;

			// Mudar cor nos últimos 30 segundos
			if (remaining <= 30 && remaining > 10) {
				this.timerDisplay.style.color = "#ffaa00";
				this.timerDisplay.style.textShadow =
					"0 0 10px rgba(255, 170, 0, 0.5)";
			} else if (remaining <= 10) {
				this.timerDisplay.style.color = "#ff0000";
				this.timerDisplay.style.textShadow =
					"0 0 10px rgba(255, 0, 0, 0.5)";
			}

			// Tempo esgotado
			if (remaining === 0) {
				this.endFlightSession();
			}
		}, 1000);
	},

	endFlightSession: function () {
		console.log("⏰ Tempo de voo esgotado!");

		// Parar timer
		if (this.flightTimer) {
			clearInterval(this.flightTimer);
			this.flightTimer = null;
		}

		// Mostrar mensagem de fim (mantém tamanho discreto)
		this.timerDisplay.textContent = "TEMPO ESGOTADO!";
		this.timerDisplay.style.fontSize = "32px";

		// Aguardar 3 segundos e voltar ao menu
		setTimeout(() => {
			this.returnToMenu();
		}, 3000);
	},

	returnToMenu: function () {
		console.log("🔄 Retornando ao menu inicial");

		// Esconder timer e resetar estilo
		this.timerDisplay.style.display = "none";
		this.timerDisplay.style.fontSize = "28px";
		this.timerDisplay.style.color = "#00ff00";
		this.timerDisplay.style.textShadow = "0 0 10px rgba(0, 255, 0, 0.5)";

		// Parar drones
		if (this.droneCockpit) {
			this.droneCockpit.setAttribute(
				"drone-controller",
				"enabled: false"
			);
			this.droneCockpit.setAttribute(
				"vr-joystick-controls",
				"enabled: false"
			);
		}
		if (this.droneSimple) {
			this.droneSimple.setAttribute("drone-controller", "enabled: false");
		}

		// Resetar posição dos drones
		if (this.droneCockpit) {
			this.droneCockpit.setAttribute("position", "0 3 0");
			this.droneCockpit.setAttribute("rotation", "0 0 0");
		}
		if (this.droneSimple) {
			this.droneSimple.setAttribute("position", "0 3 0");
			this.droneSimple.setAttribute("rotation", "0 0 0");
		}

		// Mostrar menu novamente
		setTimeout(() => {
			this.showMenu();
		}, 500);
	},
});

// Adicionar animações CSS
const style = document.createElement("style");
style.textContent = `
	@keyframes slideDown {
		from {
			transform: translateX(-50%) translateY(-100px);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
		to {
			transform: translateX(-50%) translateY(-100px);
			opacity: 0;
		}
	}
`;
document.head.appendChild(style);

console.log("📦 Experience Selector carregado!");
