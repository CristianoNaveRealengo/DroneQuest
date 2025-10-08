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
		ultraLowPoly: { type: "boolean", default: false },
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

	// Calcular distância entre dois pontos
	calculateDistance(pos1, pos2) {
		const dx = pos1.x - pos2.x;
		const dy = pos1.y - pos2.y;
		const dz = pos1.z - pos2.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	},

	// Limpar sistema de LOD VR
	remove() {
		if (this.vrLOD && this.vrLOD.updateInterval) {
			clearInterval(this.vrLOD.updateInterval);
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

	// Gerar sistema de ruas ultra-simplificado
	generateStreets: function () {
		console.log("🛣️ Ruas desabilitadas para cenário limpo");

		// Criar container vazio para compatibilidade
		const streetContainer = document.createElement("a-entity");
		streetContainer.setAttribute("id", "streets");
		this.urbanContainer.appendChild(streetContainer);
	},

	// Quadras removidas para máxima performance VR
	generateCityBlocks: function (streetContainer) {
		console.log("🏘️ Quadras desabilitadas para otimização VR");
		// Função mantida para compatibilidade mas não gera nada
		return;
	},

	// Prédios desabilitados - cenário limpo
	generateBuildings: function () {
		console.log("🏢 Prédios desabilitados para cenário limpo");

		// Criar container vazio para compatibilidade
		const buildingContainer = document.createElement("a-entity");
		buildingContainer.setAttribute("id", "buildings");
		this.urbanContainer.appendChild(buildingContainer);

		// Sistema de LOD simplificado para VR (sem elementos)
		this.setupVROptimizedLOD();
	},

	// Criar prédio futurista otimizado para VR
	createFuturisticBuilding: function () {
		const building = document.createElement("a-entity");
		building.classList.add("futuristic-building");
		building.setAttribute("data-building", "true");

		// Dimensões ainda menores para ultra performance
		const width = this.data.ultraLowPoly
			? 3 + this.random() * 2
			: 4 + this.random() * 3;
		const depth = this.data.ultraLowPoly
			? 3 + this.random() * 2
			: 4 + this.random() * 3;
		const height = this.data.ultraLowPoly
			? 6 + this.random() * 8
			: 8 + this.random() * 12;

		// Estrutura principal ultra-simplificada
		const mainStructure = document.createElement("a-box");
		mainStructure.setAttribute("geometry", {
			width: width,
			height: height,
			depth: depth,
		});

		// Cores futuristas simplificadas para ultra performance
		const futuristicColors = this.data.ultraLowPoly
			? [
					{ color: "#1a1a2e", emissive: "#16213e" },
					{ color: "#0f3460", emissive: "#0e6ba8" },
					{ color: "#2d1b69", emissive: "#3f51b5" },
			  ]
			: [
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

		// Material ultra-simplificado para performance
		const materialConfig = this.data.ultraLowPoly
			? {
					color: colorScheme.color,
					emissive: colorScheme.emissive,
					emissiveIntensity: 0.1,
					roughness: 1,
					metalness: 0,
			  }
			: {
					color: colorScheme.color,
					emissive: colorScheme.emissive,
					emissiveIntensity: 0.2,
					roughness: 0.1,
					metalness: 0.8,
			  };

		mainStructure.setAttribute("material", materialConfig);
		mainStructure.setAttribute("position", `0 ${height / 2} 0`);
		building.appendChild(mainStructure);

		// Janelas apenas se não for ultra low poly
		if (!this.data.ultraLowPoly) {
			this.addFuturisticWindows(building, width, height, depth);
		}

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

	// Obstáculos desabilitados - cenário limpo
	generateObstacles: function () {
		console.log("🚧 Obstáculos desabilitados para cenário limpo");

		// Criar container vazio para compatibilidade
		const obstacleContainer = document.createElement("a-entity");
		obstacleContainer.setAttribute("id", "obstacles");
		this.urbanContainer.appendChild(obstacleContainer);
	},

	// Criar obstáculo futurista ultra-simples
	createFuturisticObstacle: function () {
		const obstacle = document.createElement("a-entity");
		obstacle.setAttribute("class", "futuristic-obstacle");

		if (this.data.ultraLowPoly) {
			// Versão ultra-simplificada - apenas uma caixa
			const simpleObstacle = document.createElement("a-box");
			simpleObstacle.setAttribute("geometry", {
				width: 1,
				height: 6,
				depth: 1,
			});
			simpleObstacle.setAttribute("material", {
				color: "#001122",
				emissive: "#00ffff",
				emissiveIntensity: 0.2,
				roughness: 1,
				metalness: 0,
			});
			simpleObstacle.setAttribute("position", "0 3 0");
			obstacle.appendChild(simpleObstacle);
		} else {
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
		}

		return obstacle;
	},

	// Criar obstáculo individual (manter compatibilidade)
	createObstacle: function () {
		// Sempre usar versão futurista otimizada
		return this.createFuturisticObstacle();
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

	// Postes de luz desabilitados - cenário limpo
	generateLighting: function () {
		console.log("💡 Postes de luz desabilitados para cenário limpo");

		// Criar container vazio para compatibilidade
		const lightingContainer = document.createElement("a-entity");
		lightingContainer.setAttribute("id", "urban-lighting");
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

	// Skybox neutro otimizado
	generateSkybox: function () {
		console.log("🌆 Configurando skybox neutro...");

		// Skybox com cor neutra
		const sky = document.createElement("a-sky");
		sky.setAttribute("color", "#87CEEB");
		this.el.sceneEl.appendChild(sky);

		console.log("✅ Skybox neutro configurado");
	},
});

console.log("📦 Módulo urban-environment.js carregado com sucesso!");
