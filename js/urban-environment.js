/**
 * Sistema de Ambiente Urbano 3D
 * Gera prédios, obstáculos e cenário urbano de forma procedural
 */

// Componente principal do ambiente urbano
AFRAME.registerComponent("urban-environment", {
	schema: {
		citySize: { type: "number", default: 200 },
		buildingCount: { type: "number", default: 50 },
		obstacleCount: { type: "number", default: 30 },
		treeCount: { type: "number", default: 20 },
		streetWidth: { type: "number", default: 8 },
		seed: { type: "number", default: 12345 },
		vrOptimized: { type: "boolean", default: false },
	},

	init: function () {
		console.log("🏙️ Inicializando ambiente urbano...");

		// Configurar gerador de números aleatórios com seed
		this.random = this.createSeededRandom(this.data.seed);

		// Criar container para todos os elementos urbanos
		this.urbanContainer = document.createElement("a-entity");
		this.urbanContainer.setAttribute("id", "urban-container");
		this.el.appendChild(this.urbanContainer);

		// Gerar elementos do ambiente
		this.generateStreets();
		this.generateBuildings();
		this.generateObstacles();
		this.generateVegetation();
		this.generateLighting();
		this.generateSkybox();

		console.log("✅ Ambiente urbano criado com sucesso!");
	},

	// Sistema de LOD ultra-otimizado para VR
	setupVROptimizedLOD() {
		console.log("🔧 Configurando LOD otimizado para VR...");

		this.vrLOD = {
			camera: null,
			buildings: [],
			updateInterval: null,
			updateFrequency: 200, // Menos frequente para economizar performance
		};

		setTimeout(() => {
			this.vrLOD.camera = document.querySelector("#drone-camera");
			if (this.vrLOD.camera) {
				this.collectBuildingsForVRLOD();
				this.startVRLODUpdates();
			}
		}, 1000);
	},

	// Coletar prédios para LOD VR
	collectBuildingsForVRLOD() {
		const buildings = this.el.querySelectorAll('[data-building="true"]');
		this.vrLOD.buildings = Array.from(buildings).map((building) => ({
			element: building,
			position: building.getAttribute("position"),
		}));
	},

	// Iniciar atualizações LOD VR
	startVRLODUpdates() {
		this.vrLOD.updateInterval = setInterval(() => {
			this.updateVRLOD();
		}, this.vrLOD.updateFrequency);
	},

	// Atualizar LOD para VR (mais agressivo)
	updateVRLOD() {
		if (!this.vrLOD.camera) return;

		const cameraPosition = this.vrLOD.camera.getAttribute("position");
		if (!cameraPosition) return;

		this.vrLOD.buildings.forEach((building) => {
			const distance = this.calculateDistance(
				cameraPosition,
				building.position
			);

			// LOD mais agressivo para VR
			if (distance > 40) {
				// Ocultar completamente se muito distante
				building.element.setAttribute("visible", false);
			} else {
				// Mostrar se próximo
				building.element.setAttribute("visible", true);
			}
		});
	},

	// Sistema de LOD (Level of Detail) para otimização (manter compatibilidade)
	setupLODSystem() {
		console.log("🔧 Configurando sistema de LOD...");

		this.lodSystem = {
			camera: null,
			buildings: [],
			updateInterval: null,
			lastUpdate: 0,
			updateFrequency: 100, // ms
		};

		// Encontrar câmera do drone
		setTimeout(() => {
			this.lodSystem.camera = document.querySelector("#drone-camera");
			if (this.lodSystem.camera) {
				this.collectBuildingsForLOD();
				this.startLODUpdates();
			}
		}, 1000);
	},

	// Coletar todos os prédios para o sistema de LOD
	collectBuildingsForLOD() {
		const buildings = this.el.querySelectorAll('[data-building="true"]');
		this.lodSystem.buildings = Array.from(buildings).map((building) => ({
			element: building,
			position: building.getAttribute("position"),
			highDetail: building.querySelector(".building-details"),
			lowDetail: building.querySelector(".building-simple"),
		}));
	},

	// Iniciar atualizações do sistema de LOD
	startLODUpdates() {
		this.lodSystem.updateInterval = setInterval(() => {
			this.updateLOD();
		}, this.lodSystem.updateFrequency);
	},

	// Atualizar LOD baseado na distância da câmera
	updateLOD() {
		if (!this.lodSystem.camera) return;

		const now = Date.now();
		if (now - this.lodSystem.lastUpdate < this.lodSystem.updateFrequency)
			return;

		const cameraPosition = this.lodSystem.camera.getAttribute("position");
		if (!cameraPosition) return;

		this.lodSystem.buildings.forEach((building) => {
			const distance = this.calculateDistance(
				cameraPosition,
				building.position
			);

			// Definir níveis de LOD
			if (distance > 80) {
				// Muito distante - ocultar completamente
				building.element.setAttribute("visible", false);
			} else if (distance > 50) {
				// Distante - baixo detalhe
				building.element.setAttribute("visible", true);
				if (building.highDetail)
					building.highDetail.setAttribute("visible", false);
				if (building.lowDetail)
					building.lowDetail.setAttribute("visible", true);
			} else {
				// Próximo - alto detalhe
				building.element.setAttribute("visible", true);
				if (building.highDetail)
					building.highDetail.setAttribute("visible", true);
				if (building.lowDetail)
					building.lowDetail.setAttribute("visible", false);
			}
		});

		this.lodSystem.lastUpdate = now;
	},

	// Calcular distância entre dois pontos
	calculateDistance(pos1, pos2) {
		const dx = pos1.x - pos2.x;
		const dy = pos1.y - pos2.y;
		const dz = pos1.z - pos2.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	},

	// Limpar sistema de LOD
	remove() {
		if (this.lodSystem && this.lodSystem.updateInterval) {
			clearInterval(this.lodSystem.updateInterval);
		}
	},

	// Gerador de números aleatórios com seed para consistência
	createSeededRandom: function (seed) {
		let m = 0x80000000; // 2^31
		let a = 1103515245;
		let c = 12345;
		let state = seed ? seed : Math.floor(Math.random() * (m - 1));

		return function () {
			state = (a * state + c) % m;
			return state / (m - 1);
		};
	},

	// Gerar sistema de ruas
	generateStreets: function () {
		console.log("🛣️ Gerando sistema de ruas...");
		console.log(
			`📏 Configurações: citySize=${this.data.citySize}, streetWidth=${this.data.streetWidth}`
		);

		const streetContainer = document.createElement("a-entity");
		streetContainer.setAttribute("id", "streets");

		const citySize = this.data.citySize;
		const streetWidth = this.data.streetWidth;

		// Ruas principais (norte-sul)
		for (let x = -citySize; x <= citySize; x += 40) {
			const street = document.createElement("a-plane");
			street.setAttribute("geometry", {
				primitive: "plane",
				width: streetWidth,
				height: citySize * 2,
			});
			street.setAttribute("material", {
				color: "#333333",
				roughness: 0.9,
				metalness: 0.1,
			});
			street.setAttribute("position", `${x} 0.05 0`);
			street.setAttribute("rotation", "-90 0 0");
			streetContainer.appendChild(street);

			// Linhas da rua
			const centerLine = document.createElement("a-plane");
			centerLine.setAttribute("geometry", {
				primitive: "plane",
				width: 0.5,
				height: citySize * 2,
			});
			centerLine.setAttribute("material", {
				color: "#ffff00",
				emissive: "#ffff00",
				emissiveIntensity: 0.3,
			});
			centerLine.setAttribute("position", `${x} 0.06 0`);
			centerLine.setAttribute("rotation", "-90 0 0");
			streetContainer.appendChild(centerLine);
		}

		// Ruas secundárias (leste-oeste)
		for (let z = -citySize; z <= citySize; z += 50) {
			const street = document.createElement("a-plane");
			street.setAttribute("geometry", {
				primitive: "plane",
				width: citySize * 2,
				height: streetWidth,
			});
			street.setAttribute("material", {
				color: "#333333",
				roughness: 0.9,
				metalness: 0.1,
			});
			street.setAttribute("position", `0 0.05 ${z}`);
			street.setAttribute("rotation", "-90 0 0");
			streetContainer.appendChild(street);
		}

		// Adicionar quadras/blocos urbanos para melhor visualização
		this.generateCityBlocks(streetContainer);

		this.urbanContainer.appendChild(streetContainer);
		console.log("✅ Sistema de ruas e quadras criado!");
	},

	// Gerar quadras urbanas visíveis
	generateCityBlocks: function (streetContainer) {
		console.log("🏘️ Gerando quadras urbanas...");

		const citySize = this.data.citySize;
		const blockSize = 35; // Tamanho das quadras

		// Criar quadras entre as ruas
		for (let x = -citySize + 20; x < citySize; x += 40) {
			for (let z = -citySize + 25; z < citySize; z += 50) {
				const block = document.createElement("a-plane");
				block.setAttribute("geometry", {
					primitive: "plane",
					width: blockSize,
					height: blockSize,
				});
				block.setAttribute("material", {
					color: "#4a4a4a",
					roughness: 0.8,
					metalness: 0.2,
				});
				block.setAttribute("position", `${x} 0.02 ${z}`);
				block.setAttribute("rotation", "-90 0 0");
				streetContainer.appendChild(block);

				// Adicionar detalhes nas quadras (calçadas)
				const sidewalk = document.createElement("a-plane");
				sidewalk.setAttribute("geometry", {
					primitive: "plane",
					width: blockSize + 2,
					height: blockSize + 2,
				});
				sidewalk.setAttribute("material", {
					color: "#666666",
					roughness: 0.9,
					metalness: 0.1,
				});
				sidewalk.setAttribute("position", `${x} 0.01 ${z}`);
				sidewalk.setAttribute("rotation", "-90 0 0");
				streetContainer.appendChild(sidewalk);
			}
		}
	},

	// Gerar prédios proceduralmente - OTIMIZADO PARA VR
	generateBuildings: function () {
		console.log("🏢 Gerando cidade futurista otimizada para VR...");

		const buildingContainer = document.createElement("a-entity");
		buildingContainer.setAttribute("id", "buildings");

		const citySize = this.data.citySize;
		const buildingCount = Math.min(this.data.buildingCount, 6); // Máximo 6 prédios para VR

		for (let i = 0; i < buildingCount; i++) {
			const building = this.createFuturisticBuilding();

			// Posicionar estrategicamente para melhor performance
			const angle = (i / buildingCount) * Math.PI * 2;
			const distance = citySize * 0.6;
			const x = Math.cos(angle) * distance;
			const z = Math.sin(angle) * distance;

			building.setAttribute("position", `${x} 0 ${z}`);
			buildingContainer.appendChild(building);
		}

		this.urbanContainer.appendChild(buildingContainer);

		// Sistema de LOD simplificado para VR
		this.setupVROptimizedLOD();
	},

	// Criar prédio futurista otimizado para VR
	createFuturisticBuilding: function () {
		const building = document.createElement("a-entity");
		building.classList.add("futuristic-building");
		building.setAttribute("data-building", "true");

		// Dimensões otimizadas para VR (menores e mais simples)
		const width = 4 + this.random() * 3; // 4-7m
		const depth = 4 + this.random() * 3; // 4-7m
		const height = 8 + this.random() * 12; // 8-20m

		// Estrutura principal ultra-simplificada
		const mainStructure = document.createElement("a-box");
		mainStructure.setAttribute("geometry", {
			width: width,
			height: height,
			depth: depth,
		});

		// Cores futuristas com emissão para efeito cyberpunk
		const futuristicColors = [
			{ color: "#1a1a2e", emissive: "#16213e" },
			{ color: "#0f3460", emissive: "#0e6ba8" },
			{ color: "#16537e", emissive: "#1e88e5" },
			{ color: "#2d1b69", emissive: "#3f51b5" },
			{ color: "#1a1a1a", emissive: "#00ffff" },
		];

		const colorScheme =
			futuristicColors[
				Math.floor(this.random() * futuristicColors.length)
			];

		mainStructure.setAttribute("material", {
			color: colorScheme.color,
			emissive: colorScheme.emissive,
			emissiveIntensity: 0.2,
			roughness: 0.1,
			metalness: 0.8,
		});

		mainStructure.setAttribute("position", `0 ${height / 2} 0`);
		building.appendChild(mainStructure);

		// Adicionar apenas 1-2 janelas brilhantes para efeito futurista
		this.addFuturisticWindows(building, width, height, depth);

		return building;
	},

	// Criar um prédio individual (manter compatibilidade)
	createBuilding: function () {
		// Redirecionar para versão futurista otimizada
		return this.createFuturisticBuilding();
	},

	// Adicionar janelas futuristas otimizadas
	addFuturisticWindows: function (building, width, height, depth) {
		// Apenas 2-3 janelas grandes e brilhantes por prédio
		const windowCount = 2 + Math.floor(this.random() * 2);

		for (let i = 0; i < windowCount; i++) {
			const window = document.createElement("a-plane");
			window.setAttribute("geometry", {
				width: width * 0.6,
				height: 2,
			});

			// Cores neon futuristas
			const neonColors = [
				"#00ffff",
				"#ff00ff",
				"#ffff00",
				"#00ff88",
				"#ff8800",
			];
			const windowColor =
				neonColors[Math.floor(this.random() * neonColors.length)];

			window.setAttribute("material", {
				color: windowColor,
				emissive: windowColor,
				emissiveIntensity: 0.4,
				transparent: true,
				opacity: 0.7,
			});

			// Posicionar na face frontal
			const yPos = height * 0.3 + i * height * 0.3;
			window.setAttribute("position", `0 ${yPos} ${depth / 2 + 0.01}`);
			building.appendChild(window);
		}
	},

	// Adicionar janelas aos prédios (manter compatibilidade)
	addWindows: function (building, width, height, depth) {
		const windowSize = 1.5;
		const windowSpacing = 3;

		// Janelas na frente e atrás
		for (
			let y = windowSpacing;
			y < height - windowSpacing;
			y += windowSpacing
		) {
			for (
				let x = -width / 2 + windowSpacing;
				x < width / 2 - windowSpacing;
				x += windowSpacing
			) {
				// Frente
				const frontWindow = document.createElement("a-plane");
				frontWindow.setAttribute("geometry", {
					width: windowSize,
					height: windowSize,
				});
				frontWindow.setAttribute("material", {
					color: this.random() > 0.8 ? "#ffff88" : "#4488ff",
					emissive: this.random() > 0.8 ? "#ffff88" : "#4488ff",
					emissiveIntensity: this.random() > 0.8 ? 0.3 : 0.1,
					transparent: true,
					opacity: 0.8,
				});
				frontWindow.setAttribute(
					"position",
					`${x} ${y} ${depth / 2 + 0.01}`
				);
				building.appendChild(frontWindow);

				// Atrás
				const backWindow = frontWindow.cloneNode(true);
				backWindow.setAttribute(
					"position",
					`${x} ${y} ${-depth / 2 - 0.01}`
				);
				backWindow.setAttribute("rotation", "0 180 0");
				building.appendChild(backWindow);
			}
		}

		// Janelas nas laterais
		for (
			let y = windowSpacing;
			y < height - windowSpacing;
			y += windowSpacing
		) {
			for (
				let z = -depth / 2 + windowSpacing;
				z < depth / 2 - windowSpacing;
				z += windowSpacing
			) {
				// Lateral direita
				const rightWindow = document.createElement("a-plane");
				rightWindow.setAttribute("geometry", {
					width: windowSize,
					height: windowSize,
				});
				rightWindow.setAttribute("material", {
					color: this.random() > 0.8 ? "#ffff88" : "#4488ff",
					emissive: this.random() > 0.8 ? "#ffff88" : "#4488ff",
					emissiveIntensity: this.random() > 0.8 ? 0.3 : 0.1,
					transparent: true,
					opacity: 0.8,
				});
				rightWindow.setAttribute(
					"position",
					`${width / 2 + 0.01} ${y} ${z}`
				);
				rightWindow.setAttribute("rotation", "0 90 0");
				building.appendChild(rightWindow);

				// Lateral esquerda
				const leftWindow = rightWindow.cloneNode(true);
				leftWindow.setAttribute(
					"position",
					`${-width / 2 - 0.01} ${y} ${z}`
				);
				leftWindow.setAttribute("rotation", "0 -90 0");
				building.appendChild(leftWindow);
			}
		}
	},

	// Adicionar telhado
	addRoof: function (building, width, height, depth) {
		const roof = document.createElement("a-box");
		roof.setAttribute("geometry", {
			width: width + 1,
			height: 2,
			depth: depth + 1,
		});
		roof.setAttribute("material", {
			color: "#444444",
			roughness: 0.9,
			metalness: 0.1,
		});
		roof.setAttribute("position", `0 ${height + 1} 0`);
		building.appendChild(roof);
	},

	// Adicionar equipamentos no telhado
	addRooftopEquipment: function (building, width, height, depth) {
		const equipmentCount = 1 + Math.floor(this.random() * 3);

		for (let i = 0; i < equipmentCount; i++) {
			const equipment = document.createElement("a-cylinder");
			equipment.setAttribute("geometry", {
				radius: 0.5 + this.random() * 1,
				height: 2 + this.random() * 4,
			});
			equipment.setAttribute("material", {
				color: "#333333",
				metalness: 0.8,
				roughness: 0.2,
			});

			const x = (this.random() - 0.5) * width * 0.6;
			const z = (this.random() - 0.5) * depth * 0.6;
			equipment.setAttribute("position", `${x} ${height + 3} ${z}`);
			building.appendChild(equipment);
		}
	},

	// Verificar se uma posição está em uma rua
	isOnStreet: function (x, z) {
		const streetWidth = this.data.streetWidth;

		// Verificar ruas norte-sul
		for (
			let streetX = -this.data.citySize;
			streetX <= this.data.citySize;
			streetX += 40
		) {
			if (Math.abs(x - streetX) < streetWidth) {
				return true;
			}
		}

		// Verificar ruas leste-oeste
		for (
			let streetZ = -this.data.citySize;
			streetZ <= this.data.citySize;
			streetZ += 50
		) {
			if (Math.abs(z - streetZ) < streetWidth) {
				return true;
			}
		}

		return false;
	},

	// Gerar obstáculos futuristas minimalistas
	generateObstacles: function () {
		console.log("🚧 Gerando obstáculos futuristas...");

		const obstacleContainer = document.createElement("a-entity");
		obstacleContainer.setAttribute("id", "obstacles");

		// Máximo 2 obstáculos para VR
		const obstacleCount = Math.min(this.data.obstacleCount, 2);

		for (let i = 0; i < obstacleCount; i++) {
			const obstacle = this.createFuturisticObstacle();

			// Posicionar estrategicamente
			const angle = (i / obstacleCount) * Math.PI * 2;
			const distance = this.data.citySize * 0.4;
			const x = Math.cos(angle) * distance;
			const z = Math.sin(angle) * distance;

			obstacle.setAttribute("position", `${x} 0 ${z}`);
			obstacleContainer.appendChild(obstacle);
		}

		this.urbanContainer.appendChild(obstacleContainer);
	},

	// Criar obstáculo futurista ultra-simples
	createFuturisticObstacle: function () {
		const obstacle = document.createElement("a-entity");
		obstacle.setAttribute("class", "futuristic-obstacle");

		// Torre holográfica simples
		const tower = document.createElement("a-cylinder");
		tower.setAttribute("geometry", {
			radius: 0.5,
			height: 8,
		});
		tower.setAttribute("material", {
			color: "#001122",
			emissive: "#00ffff",
			emissiveIntensity: 0.3,
			transparent: true,
			opacity: 0.8,
		});
		tower.setAttribute("position", "0 4 0");

		// Luz no topo
		const topLight = document.createElement("a-sphere");
		topLight.setAttribute("geometry", { radius: 0.2 });
		topLight.setAttribute("material", {
			color: "#00ffff",
			emissive: "#00ffff",
			emissiveIntensity: 0.8,
		});
		topLight.setAttribute("position", "0 8.5 0");
		topLight.setAttribute("animation", {
			property: "material.emissiveIntensity",
			from: 0.8,
			to: 0.3,
			dur: 2000,
			dir: "alternate",
			loop: true,
		});

		obstacle.appendChild(tower);
		obstacle.appendChild(topLight);
		return obstacle;
	},

	// Criar obstáculo individual (manter compatibilidade)
	createObstacle: function () {
		// Sempre usar versão futurista otimizada
		return this.createFuturisticObstacle();
	},

	// Criar torre de comunicação
	createTower: function () {
		const tower = document.createElement("a-entity");
		tower.classList.add("tower");

		const height = 30 + this.random() * 50;

		// Base da torre
		const base = document.createElement("a-cylinder");
		base.setAttribute("geometry", {
			radius: 2,
			height: 5,
		});
		base.setAttribute("material", {
			color: "#666666",
			metalness: 0.8,
			roughness: 0.2,
		});
		base.setAttribute("position", "0 2.5 0");
		tower.appendChild(base);

		// Torre principal
		const mainTower = document.createElement("a-cylinder");
		mainTower.setAttribute("geometry", {
			radius: 0.5,
			height: height,
		});
		mainTower.setAttribute("material", {
			color: "#ff4444",
			metalness: 0.7,
			roughness: 0.3,
		});
		mainTower.setAttribute("position", `0 ${height / 2 + 5} 0`);
		tower.appendChild(mainTower);

		// Luzes de aviso
		for (let i = 0; i < 3; i++) {
			const light = document.createElement("a-sphere");
			light.setAttribute("geometry", { radius: 0.3 });
			light.setAttribute("material", {
				color: "#ff0000",
				emissive: "#ff0000",
				emissiveIntensity: 0.5,
			});
			light.setAttribute(
				"position",
				`0 ${height * 0.3 + i * height * 0.3} 0`
			);
			light.setAttribute("animation", {
				property: "material.emissiveIntensity",
				from: 0.5,
				to: 1,
				dur: 1000,
				dir: "alternate",
				loop: true,
			});
			tower.appendChild(light);
		}

		return tower;
	},

	// Criar guindaste
	createCrane: function () {
		const crane = document.createElement("a-entity");
		crane.classList.add("crane");

		const height = 40 + this.random() * 30;

		// Base do guindaste
		const base = document.createElement("a-box");
		base.setAttribute("geometry", {
			width: 4,
			height: 3,
			depth: 4,
		});
		base.setAttribute("material", {
			color: "#ffff00",
			metalness: 0.6,
			roughness: 0.4,
		});
		base.setAttribute("position", "0 1.5 0");
		crane.appendChild(base);

		// Torre do guindaste
		const tower = document.createElement("a-cylinder");
		tower.setAttribute("geometry", {
			radius: 0.8,
			height: height,
		});
		tower.setAttribute("material", {
			color: "#ffff00",
			metalness: 0.6,
			roughness: 0.4,
		});
		tower.setAttribute("position", `0 ${height / 2 + 3} 0`);
		crane.appendChild(tower);

		// Braço do guindaste
		const arm = document.createElement("a-box");
		arm.setAttribute("geometry", {
			width: 25,
			height: 1,
			depth: 1,
		});
		arm.setAttribute("material", {
			color: "#ffff00",
			metalness: 0.6,
			roughness: 0.4,
		});
		arm.setAttribute("position", `12.5 ${height + 3} 0`);
		crane.appendChild(arm);

		return crane;
	},

	// Criar outdoor/billboard
	createBillboard: function () {
		const billboard = document.createElement("a-entity");
		billboard.classList.add("billboard");

		// Poste
		const pole = document.createElement("a-cylinder");
		pole.setAttribute("geometry", {
			radius: 0.3,
			height: 15,
		});
		pole.setAttribute("material", {
			color: "#333333",
			metalness: 0.8,
			roughness: 0.2,
		});
		pole.setAttribute("position", "0 7.5 0");
		billboard.appendChild(pole);

		// Painel do outdoor
		const panel = document.createElement("a-plane");
		panel.setAttribute("geometry", {
			width: 12,
			height: 6,
		});
		panel.setAttribute("material", {
			color: "#ffffff",
			emissive: "#4488ff",
			emissiveIntensity: 0.2,
		});
		panel.setAttribute("position", "0 18 0");
		billboard.appendChild(panel);

		// Texto do outdoor
		const text = document.createElement("a-text");
		text.setAttribute("value", "DRONE RACING");
		text.setAttribute("position", "0 18 0.01");
		text.setAttribute("color", "#000000");
		text.setAttribute("scale", "8 8 8");
		text.setAttribute("align", "center");
		billboard.appendChild(text);

		return billboard;
	},

	// Criar antena
	createAntenna: function () {
		const antenna = document.createElement("a-entity");
		antenna.classList.add("antenna");

		const height = 20 + this.random() * 25;

		// Base
		const base = document.createElement("a-cylinder");
		base.setAttribute("geometry", {
			radius: 1.5,
			height: 3,
		});
		base.setAttribute("material", {
			color: "#888888",
			metalness: 0.7,
			roughness: 0.3,
		});
		base.setAttribute("position", "0 1.5 0");
		antenna.appendChild(base);

		// Antena principal
		const mainAntenna = document.createElement("a-cylinder");
		mainAntenna.setAttribute("geometry", {
			radius: 0.2,
			height: height,
		});
		mainAntenna.setAttribute("material", {
			color: "#cccccc",
			metalness: 0.9,
			roughness: 0.1,
		});
		mainAntenna.setAttribute("position", `0 ${height / 2 + 3} 0`);
		antenna.appendChild(mainAntenna);

		// Pratos/antenas parabólicas
		for (let i = 0; i < 2; i++) {
			const dish = document.createElement("a-cylinder");
			dish.setAttribute("geometry", {
				radius: 2,
				height: 0.2,
			});
			dish.setAttribute("material", {
				color: "#ffffff",
				metalness: 0.8,
				roughness: 0.2,
			});
			dish.setAttribute("position", `0 ${height * 0.7 + i * 5} 2`);
			dish.setAttribute("rotation", "90 0 0");
			antenna.appendChild(dish);
		}

		return antenna;
	},

	// Vegetação desabilitada para máxima performance VR
	generateVegetation: function () {
		console.log("🌳 Vegetação desabilitada para otimização VR");

		// Criar container vazio para compatibilidade
		const vegetationContainer = document.createElement("a-entity");
		vegetationContainer.setAttribute("id", "vegetation");
		this.urbanContainer.appendChild(vegetationContainer);

		// Não gerar árvores para economizar performance
		return;
	},

	// Criar árvore
	createTree: function () {
		const tree = document.createElement("a-entity");
		tree.classList.add("tree");

		if (this.data.vrOptimized) {
			// Versão simplificada para VR
			const simpleTree = document.createElement("a-cylinder");
			simpleTree.setAttribute("geometry", {
				radius: 1,
				height: 4,
			});
			simpleTree.setAttribute("material", {
				color: "#228B22",
			});
			simpleTree.setAttribute("position", "0 2 0");
			tree.appendChild(simpleTree);
		} else {
			// Versão detalhada
			// Tronco
			const trunk = document.createElement("a-cylinder");
			const trunkHeight = 3 + this.random() * 2;
			trunk.setAttribute("geometry", {
				radius: 0.3,
				height: trunkHeight,
			});
			trunk.setAttribute("material", {
				color: "#8B4513",
			});
			trunk.setAttribute("position", `0 ${trunkHeight / 2} 0`);

			// Copa da árvore
			const foliage = document.createElement("a-sphere");
			const foliageRadius = 2 + this.random() * 1.5;
			foliage.setAttribute("geometry", {
				radius: foliageRadius,
			});
			foliage.setAttribute("material", {
				color: "#228B22",
			});
			foliage.setAttribute(
				"position",
				`0 ${trunkHeight + foliageRadius * 0.7} 0`
			);

			tree.appendChild(trunk);
			tree.appendChild(foliage);
		}

		return tree;
	},

	// Iluminação futurista minimalista
	generateLighting: function () {
		console.log("💡 Configurando iluminação futurista otimizada...");

		const lightingContainer = document.createElement("a-entity");
		lightingContainer.setAttribute("id", "urban-lighting");

		// Apenas 3-4 postes de luz estratégicos
		const lightPositions = [
			{ x: 15, z: -15 },
			{ x: -15, z: -15 },
			{ x: 0, z: -30 },
		];

		lightPositions.forEach((pos) => {
			const futuristicLight = this.createFuturisticStreetLight();
			futuristicLight.setAttribute("position", `${pos.x} 0 ${pos.z}`);
			lightingContainer.appendChild(futuristicLight);
		});

		this.urbanContainer.appendChild(lightingContainer);
	},

	// Criar poste de luz futurista ultra-simples
	createFuturisticStreetLight: function () {
		const streetLight = document.createElement("a-entity");
		streetLight.classList.add("futuristic-street-light");

		// Poste holográfico
		const pole = document.createElement("a-cylinder");
		pole.setAttribute("geometry", {
			radius: 0.1,
			height: 6,
		});
		pole.setAttribute("material", {
			color: "#001122",
			emissive: "#00ffff",
			emissiveIntensity: 0.2,
			transparent: true,
			opacity: 0.7,
		});
		pole.setAttribute("position", "0 3 0");
		streetLight.appendChild(pole);

		// Luz neon no topo
		const neonLight = document.createElement("a-sphere");
		neonLight.setAttribute("geometry", { radius: 0.3 });
		neonLight.setAttribute("material", {
			color: "#00ffff",
			emissive: "#00ffff",
			emissiveIntensity: 0.6,
		});
		neonLight.setAttribute("position", "0 6.5 0");
		neonLight.setAttribute("animation", {
			property: "material.emissiveIntensity",
			from: 0.6,
			to: 0.2,
			dur: 3000,
			dir: "alternate",
			loop: true,
		});
		streetLight.appendChild(neonLight);

		return streetLight;
	},

	// Criar poste de luz (manter compatibilidade)
	createStreetLight: function () {
		return this.createFuturisticStreetLight();
	},

	// Skybox futurista otimizado
	generateSkybox: function () {
		console.log("🌆 Configurando skybox futurista...");

		// Skybox com gradiente futurista
		const sky = document.createElement("a-sky");
		sky.setAttribute("color", "#0a0a2e");
		this.el.sceneEl.appendChild(sky);

		// Sem nuvens para máxima performance VR
		console.log("☁️ Nuvens desabilitadas para otimização VR");
	},
});

console.log("📦 Módulo urban-environment.js carregado com sucesso!");
