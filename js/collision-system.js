/**
 * Sistema de Colisão para Drone Racing VR
 * Gerencia colisões com paredes, obstáculos e efeitos visuais
 */

if (!AFRAME.components["collision-system"]) {
	AFRAME.registerComponent("collision-system", {
		schema: {
			enabled: { type: "boolean", default: true },
			bounceForce: { type: "number", default: 0.5 },
			damageOnCollision: { type: "boolean", default: false },
			showEffects: { type: "boolean", default: true },
			soundEnabled: { type: "boolean", default: true },
		},

		init: function () {
			console.log("💥 Inicializando sistema de colisão...");

			// Estado do sistema
			this.isColliding = false;
			this.lastCollisionTime = 0;
			this.collisionCooldown = 500; // ms

			// Referências
			this.drone = null;
			this.droneController = null;

			// Configurar sistema
			this.setupCollisionDetection();
			this.setupCollisionEffects();

			console.log("✅ Sistema de colisão configurado!");

			// Ativar automaticamente após inicialização
			setTimeout(() => {
				this.activateCollisionDetection();
			}, 1000);
		},

		activateCollisionDetection: function () {
			console.log("💥 Sistema de colisão ativado");
			this.isActive = true;
		},

		setupCollisionDetection: function () {
			// Encontrar o drone
			this.drone = document.querySelector("#drone");
			if (this.drone) {
				this.droneController =
					this.drone.components["drone-controller"];
			}

			// Configurar detecção contínua
			this.collisionCheck = setInterval(() => {
				this.checkCollisions();
			}, 50); // Verificar a cada 50ms
		},

		setupCollisionEffects: function () {
			// Preparar sons de colisão
			this.setupCollisionSounds();
		},

		setupCollisionSounds: function () {
			// Criar sons sintéticos usando Web Audio API
			this.createSyntheticSounds();
		},

		createSyntheticSounds: function () {
			// Não criar elementos a-sound com URLs inválidas
			// Os sons serão criados dinamicamente via Web Audio API quando necessário
			console.log("🔊 Sons de colisão configurados via Web Audio API");
		},

		checkCollisions: function () {
			if (!this.data.enabled || !this.drone) return;

			const dronePosition = this.drone.getAttribute("position");
			if (!dronePosition) return;

			// Verificar colisões com diferentes tipos de objetos
			const collision = this.detectCollision(dronePosition);

			if (collision) {
				this.handleSolidCollision(collision, dronePosition);
			}
		},

		detectCollision: function (dronePosition) {
			// Verificar colisões com prédios (mais preciso)
			const buildingCollision =
				this.checkBuildingCollisions(dronePosition);
			if (buildingCollision) return buildingCollision;

			// Verificar colisões com obstáculos
			const obstacleCollision =
				this.checkObstacleCollisions(dronePosition);
			if (obstacleCollision) return obstacleCollision;

			// Verificar colisões com árvores
			const treeCollision = this.checkTreeCollisions(dronePosition);
			if (treeCollision) return treeCollision;

			// Verificar limites da cidade
			const boundaryCollision =
				this.checkBoundaryCollisions(dronePosition);
			if (boundaryCollision) return boundaryCollision;

			return null;
		},

		checkBuildingCollisions: function (dronePosition) {
			const buildings = document.querySelectorAll(".building");

			for (let building of buildings) {
				const buildingPosition = building.getAttribute("position");
				const buildingGeometry = building.getAttribute("geometry");

				if (
					this.isInsideBuilding(
						dronePosition,
						buildingPosition,
						buildingGeometry
					)
				) {
					return {
						type: "building",
						object: building,
						position: buildingPosition,
						geometry: buildingGeometry,
						normal: this.calculateBuildingNormal(
							dronePosition,
							buildingPosition,
							buildingGeometry
						),
					};
				}
			}
			return null;
		},

		checkObstacleCollisions: function (dronePosition) {
			const obstacles = document.querySelectorAll(
				".tower, .crane, .billboard, .antenna"
			);

			for (let obstacle of obstacles) {
				const obstaclePosition = obstacle.getAttribute("position");
				const distance = this.calculateDistance(
					dronePosition,
					obstaclePosition
				);

				// Raio de colisão baseado no tipo de obstáculo
				let collisionRadius = 3; // padrão
				if (obstacle.classList.contains("tower")) collisionRadius = 2;
				if (obstacle.classList.contains("crane")) collisionRadius = 4;
				if (obstacle.classList.contains("billboard"))
					collisionRadius = 3;
				if (obstacle.classList.contains("antenna"))
					collisionRadius = 1.5;

				if (distance < collisionRadius) {
					return {
						type: "obstacle",
						object: obstacle,
						position: obstaclePosition,
						radius: collisionRadius,
						normal: this.calculateObstacleNormal(
							dronePosition,
							obstaclePosition
						),
					};
				}
			}
			return null;
		},

		checkTreeCollisions: function (dronePosition) {
			const trees = document.querySelectorAll(".tree");

			for (let tree of trees) {
				const treePosition = tree.getAttribute("position");
				const distance = this.calculateDistance(
					dronePosition,
					treePosition
				);
				const collisionRadius = 2.5; // Raio de colisão para árvores

				if (distance < collisionRadius) {
					return {
						type: "tree",
						object: tree,
						position: treePosition,
						radius: collisionRadius,
						normal: this.calculateObstacleNormal(
							dronePosition,
							treePosition
						),
					};
				}
			}
			return null;
		},

		checkBoundaryCollisions: function (dronePosition) {
			const citySize = 200; // Tamanho da cidade
			const boundaryHeight = 100; // Altura máxima

			// Verificar limites horizontais
			if (
				Math.abs(dronePosition.x) > citySize ||
				Math.abs(dronePosition.z) > citySize
			) {
				return {
					type: "boundary",
					object: null,
					position: dronePosition,
					normal: this.calculateBoundaryNormal(
						dronePosition,
						citySize
					),
				};
			}

			// Verificar limite de altura
			if (dronePosition.y > boundaryHeight) {
				return {
					type: "ceiling",
					object: null,
					position: dronePosition,
					normal: { x: 0, y: -1, z: 0 },
				};
			}

			// Verificar chão - permitir voo baixo mas evitar colisão real
			if (dronePosition.y < 0.3) {
				return {
					type: "ground",
					object: null,
					position: dronePosition,
					normal: { x: 0, y: 1, z: 0 },
				};
			}

			return null;
		},

		isInsideBuilding: function (dronePos, buildingPos, geometry) {
			if (!geometry) return false;

			const width = geometry.width || 10;
			const height = geometry.height || 20;
			const depth = geometry.depth || 10;

			const dx = Math.abs(dronePos.x - buildingPos.x);
			const dy = Math.abs(dronePos.y - buildingPos.y);
			const dz = Math.abs(dronePos.z - buildingPos.z);

			return dx < width / 2 && dy < height / 2 && dz < depth / 2;
		},

		calculateDistance: function (pos1, pos2) {
			const dx = pos1.x - pos2.x;
			const dy = pos1.y - pos2.y;
			const dz = pos1.z - pos2.z;
			return Math.sqrt(dx * dx + dy * dy + dz * dz);
		},

		// Calcular normal de colisão para prédios (face mais próxima)
		calculateBuildingNormal: function (dronePos, buildingPos, geometry) {
			const width = geometry.width || 10;
			const height = geometry.height || 20;
			const depth = geometry.depth || 10;

			const dx = dronePos.x - buildingPos.x;
			const dy = dronePos.y - buildingPos.y;
			const dz = dronePos.z - buildingPos.z;

			// Determinar qual face está mais próxima
			const absX = Math.abs(dx) / (width / 2);
			const absY = Math.abs(dy) / (height / 2);
			const absZ = Math.abs(dz) / (depth / 2);

			if (absX > absY && absX > absZ) {
				return { x: dx > 0 ? 1 : -1, y: 0, z: 0 }; // Face lateral
			} else if (absY > absZ) {
				return { x: 0, y: dy > 0 ? 1 : -1, z: 0 }; // Face superior/inferior
			} else {
				return { x: 0, y: 0, z: dz > 0 ? 1 : -1 }; // Face frontal/traseira
			}
		},

		// Calcular normal de colisão para obstáculos cilíndricos
		calculateObstacleNormal: function (dronePos, obstaclePos) {
			const dx = dronePos.x - obstaclePos.x;
			const dz = dronePos.z - obstaclePos.z;
			const distance = Math.sqrt(dx * dx + dz * dz);

			if (distance === 0) return { x: 1, y: 0, z: 0 };

			return {
				x: dx / distance,
				y: 0,
				z: dz / distance,
			};
		},

		// Calcular normal de colisão para limites da cidade
		calculateBoundaryNormal: function (dronePos, citySize) {
			if (Math.abs(dronePos.x) > citySize) {
				return { x: dronePos.x > 0 ? -1 : 1, y: 0, z: 0 };
			}
			if (Math.abs(dronePos.z) > citySize) {
				return { x: 0, y: 0, z: dronePos.z > 0 ? -1 : 1 };
			}
			return { x: 0, y: 0, z: 0 };
		},

		// Novo sistema de colisão sólida
		handleSolidCollision: function (collision, dronePosition) {
			const now = Date.now();
			if (now - this.lastCollisionTime < 100) return; // Cooldown reduzido para responsividade

			console.log(`💥 Colisão sólida detectada: ${collision.type}`);

			this.isColliding = true;
			this.lastCollisionTime = now;

			// 1. Bloquear movimento - reposicionar drone fora do objeto
			this.repositionDrone(collision, dronePosition);

			// 2. Aplicar ricochete realista
			this.applySolidBounce(collision);

			// 3. Efeitos visuais
			if (this.data.showEffects) {
				this.createCollisionEffect(dronePosition, collision.type);
			}

			// 4. Efeitos sonoros
			if (this.data.soundEnabled) {
				this.playCollisionSound(collision.type);
			}

			// 5. Notificar sistema de jogo
			this.notifyCollision(collision.type, collision.object);

			// Resetar estado após cooldown
			setTimeout(() => {
				this.isColliding = false;
			}, 200);
		},

		// Reposicionar drone fora do objeto sólido
		repositionDrone: function (collision, dronePosition) {
			if (!this.droneController) return;

			const normal = collision.normal;
			const pushDistance = 1.5; // Distância para empurrar o drone para fora

			// Calcular nova posição segura
			const newPosition = {
				x: dronePosition.x + normal.x * pushDistance,
				y: dronePosition.y + normal.y * pushDistance,
				z: dronePosition.z + normal.z * pushDistance,
			};

			// Aplicar nova posição imediatamente
			this.drone.setAttribute("position", newPosition);

			console.log(
				`🔄 Drone reposicionado para: ${newPosition.x.toFixed(
					2
				)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}`
			);
		},

		// Aplicar ricochete realista baseado na normal da superfície
		applySolidBounce: function (collision) {
			if (!this.droneController || !this.droneController.velocity) return;

			const velocity = this.droneController.velocity;
			const normal = collision.normal;
			const bounceForce = this.data.bounceForce * 1.5; // Aumentar força do ricochete

			// Calcular velocidade refletida (ricochete)
			const dotProduct =
				velocity.x * normal.x +
				velocity.y * normal.y +
				velocity.z * normal.z;

			// Aplicar reflexão da velocidade
			velocity.x -= 2 * dotProduct * normal.x * bounceForce;
			velocity.y -= 2 * dotProduct * normal.y * bounceForce;
			velocity.z -= 2 * dotProduct * normal.z * bounceForce;

			// Adicionar amortecimento para evitar ricochetes infinitos
			velocity.x *= 0.7;
			velocity.y *= 0.7;
			velocity.z *= 0.7;

			// Garantir velocidade mínima para evitar travamento
			const minVelocity = 0.1;
			if (
				Math.abs(velocity.x) < minVelocity &&
				Math.abs(velocity.y) < minVelocity &&
				Math.abs(velocity.z) < minVelocity
			) {
				velocity.x = normal.x * minVelocity;
				velocity.y = normal.y * minVelocity;
				velocity.z = normal.z * minVelocity;
			}

			console.log(
				`⚡ Ricochete aplicado: vx=${velocity.x.toFixed(
					2
				)}, vy=${velocity.y.toFixed(2)}, vz=${velocity.z.toFixed(2)}`
			);
		},

		// Função legada mantida para compatibilidade
		handleCollision: function (type, object, position) {
			// Redirecionar para o novo sistema
			const collision = {
				type: type,
				object: object,
				position: position,
				normal: { x: 0, y: 1, z: 0 }, // Normal padrão
			};
			this.handleSolidCollision(collision, position);
		},

		applyBounceEffect: function (type, position) {
			if (!this.droneController) return;

			const bounceForce = this.data.bounceForce;
			let bounceDirection = { x: 0, y: 0, z: 0 };

			// Calcular direção do ricochete baseado no tipo de colisão
			switch (type) {
				case "building":
				case "obstacle":
					// Ricochete para trás
					const droneVelocity = this.droneController.velocity || {
						x: 0,
						y: 0,
						z: 0,
					};
					bounceDirection.x = -droneVelocity.x * bounceForce;
					bounceDirection.y = Math.abs(droneVelocity.y) * bounceForce;
					bounceDirection.z = -droneVelocity.z * bounceForce;
					break;

				case "boundary":
					// Empurrar para o centro
					bounceDirection.x =
						position.x > 0 ? -bounceForce * 2 : bounceForce * 2;
					bounceDirection.z =
						position.z > 0 ? -bounceForce * 2 : bounceForce * 2;
					break;

				case "ceiling":
					bounceDirection.y = -bounceForce * 3;
					break;

				case "ground":
					bounceDirection.y = bounceForce * 3;
					break;
			}

			// Aplicar força de ricochete
			if (this.droneController.velocity) {
				this.droneController.velocity.x += bounceDirection.x;
				this.droneController.velocity.y += bounceDirection.y;
				this.droneController.velocity.z += bounceDirection.z;
			}
		},

		createCollisionEffect: function (position, type) {
			// Criar efeito de partículas de colisão
			const particleCount = type === "building" ? 15 : 8;
			const particleColor = this.getCollisionColor(type);

			for (let i = 0; i < particleCount; i++) {
				const particle = document.createElement("a-sphere");

				particle.setAttribute("geometry", {
					radius: 0.05 + Math.random() * 0.1,
				});

				particle.setAttribute("material", {
					color: particleColor,
					emissive: particleColor,
					emissiveIntensity: 0.8,
				});

				const randomX = (Math.random() - 0.5) * 4;
				const randomY = Math.random() * 3;
				const randomZ = (Math.random() - 0.5) * 4;

				particle.setAttribute("position", {
					x: position.x,
					y: position.y,
					z: position.z,
				});

				particle.setAttribute("animation", {
					property: "position",
					to: `${position.x + randomX} ${position.y + randomY} ${
						position.z + randomZ
					}`,
					dur: 1000,
					easing: "easeOutQuad",
				});

				particle.setAttribute("animation__fade", {
					property: "material.opacity",
					from: 1,
					to: 0,
					dur: 1000,
					easing: "easeOutQuad",
				});

				this.el.sceneEl.appendChild(particle);

				// Remover partícula após animação
				setTimeout(() => {
					if (particle.parentNode) {
						particle.parentNode.removeChild(particle);
					}
				}, 1100);
			}

			// Efeito de flash na tela
			this.createScreenFlash(type);
		},

		getCollisionColor: function (type) {
			switch (type) {
				case "building":
					return "#ff6600";
				case "obstacle":
					return "#ff3300";
				case "boundary":
					return "#ffff00";
				case "ceiling":
					return "#00ffff";
				case "ground":
					return "#ff0066";
				default:
					return "#ffffff";
			}
		},

		createScreenFlash: function (type) {
			const flash = document.createElement("a-plane");
			const camera = document.querySelector("[camera]");

			if (!camera) return;

			flash.setAttribute("geometry", {
				width: 10,
				height: 10,
			});

			flash.setAttribute("material", {
				color: this.getCollisionColor(type),
				transparent: true,
				opacity: 0.3,
			});

			flash.setAttribute("position", "0 0 -2");
			camera.appendChild(flash);

			// Animação de fade
			flash.setAttribute("animation", {
				property: "material.opacity",
				from: 0.3,
				to: 0,
				dur: 200,
				easing: "easeOutQuad",
			});

			// Remover após animação
			setTimeout(() => {
				if (flash.parentNode) {
					flash.parentNode.removeChild(flash);
				}
			}, 250);
		},

		playCollisionSound: function (type) {
			if (!this.data.soundEnabled) return;

			try {
				// Obter o sistema de áudio da cena
				const audioSystem = this.el.sceneEl.systems["audio-system"];
				if (audioSystem && audioSystem.isInitialized) {
					const isHeavyCollision =
						type === "building" || type === "obstacle";

					if (isHeavyCollision) {
						// Som grave para colisões pesadas
						audioSystem.createTone(150, 200, 0.3);
					} else {
						// Som agudo para colisões leves
						audioSystem.createTone(400, 100, 0.2);
					}
				}
			} catch (error) {
				console.warn("⚠️ Erro ao tocar som de colisão:", error);
			}
		},

		notifyCollision: function (type, object) {
			// Emitir evento de colisão
			this.el.sceneEl.emit("drone-collision", {
				type: type,
				object: object,
				timestamp: Date.now(),
			});

			// Notificar game manager se existir
			const gameManager = document.querySelector("[game-manager]");
			if (gameManager && gameManager.components["game-manager"]) {
				gameManager.components["game-manager"].onCollision(
					type,
					object
				);
			}
		},

		remove: function () {
			if (this.collisionCheck) {
				clearInterval(this.collisionCheck);
			}
		},
	});
}

console.log("📦 Módulo collision-system.js carregado com sucesso!");
