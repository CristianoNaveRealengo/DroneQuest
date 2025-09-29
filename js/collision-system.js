/**
 * Sistema de Colisão para Drone Racing VR
 * Gerencia colisões com paredes, obstáculos e efeitos visuais
 */

if (!AFRAME.components['collision-system']) {
    AFRAME.registerComponent('collision-system', {
        schema: {
            enabled: { type: 'boolean', default: true },
            bounceForce: { type: 'number', default: 0.5 },
            damageOnCollision: { type: 'boolean', default: false },
            showEffects: { type: 'boolean', default: true },
            soundEnabled: { type: 'boolean', default: true }
        },

        init: function () {
            console.log('💥 Inicializando sistema de colisão...');
            
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
            
            console.log('✅ Sistema de colisão configurado!');
        },

        setupCollisionDetection: function () {
            // Encontrar o drone
            this.drone = document.querySelector('#drone');
            if (this.drone) {
                this.droneController = this.drone.components['drone-controller'];
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
            console.log('🔊 Sons de colisão configurados via Web Audio API');
        },

        checkCollisions: function () {
            if (!this.data.enabled || !this.drone || this.isColliding) return;
            
            const now = Date.now();
            if (now - this.lastCollisionTime < this.collisionCooldown) return;
            
            const dronePosition = this.drone.getAttribute('position');
            if (!dronePosition) return;
            
            // Verificar colisões com diferentes tipos de objetos
            this.checkBuildingCollisions(dronePosition);
            this.checkObstacleCollisions(dronePosition);
            this.checkBoundaryCollisions(dronePosition);
        },

        checkBuildingCollisions: function (dronePosition) {
            const buildings = document.querySelectorAll('.building');
            
            buildings.forEach(building => {
                const buildingPosition = building.getAttribute('position');
                const buildingGeometry = building.getAttribute('geometry');
                
                if (this.isInsideBuilding(dronePosition, buildingPosition, buildingGeometry)) {
                    this.handleCollision('building', building, dronePosition);
                }
            });
        },

        checkObstacleCollisions: function (dronePosition) {
            const obstacles = document.querySelectorAll('.tower, .crane, .billboard, .antenna');
            
            obstacles.forEach(obstacle => {
                const obstaclePosition = obstacle.getAttribute('position');
                const distance = this.calculateDistance(dronePosition, obstaclePosition);
                
                // Raio de colisão baseado no tipo de obstáculo
                let collisionRadius = 3; // padrão
                if (obstacle.classList.contains('tower')) collisionRadius = 2;
                if (obstacle.classList.contains('crane')) collisionRadius = 4;
                if (obstacle.classList.contains('billboard')) collisionRadius = 3;
                if (obstacle.classList.contains('antenna')) collisionRadius = 1.5;
                
                if (distance < collisionRadius) {
                    this.handleCollision('obstacle', obstacle, dronePosition);
                }
            });
        },

        checkBoundaryCollisions: function (dronePosition) {
            const citySize = 200; // Tamanho da cidade
            const boundaryHeight = 100; // Altura máxima
            
            // Verificar limites horizontais
            if (Math.abs(dronePosition.x) > citySize || Math.abs(dronePosition.z) > citySize) {
                this.handleCollision('boundary', null, dronePosition);
            }
            
            // Verificar limite de altura
            if (dronePosition.y > boundaryHeight) {
                this.handleCollision('ceiling', null, dronePosition);
            }
            
            // Verificar chão
            if (dronePosition.y < 1) {
                this.handleCollision('ground', null, dronePosition);
            }
        },

        isInsideBuilding: function (dronePos, buildingPos, geometry) {
            if (!geometry) return false;
            
            const width = geometry.width || 10;
            const height = geometry.height || 20;
            const depth = geometry.depth || 10;
            
            const dx = Math.abs(dronePos.x - buildingPos.x);
            const dy = Math.abs(dronePos.y - buildingPos.y);
            const dz = Math.abs(dronePos.z - buildingPos.z);
            
            return dx < width/2 && dy < height/2 && dz < depth/2;
        },

        calculateDistance: function (pos1, pos2) {
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dz = pos1.z - pos2.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        },

        handleCollision: function (type, object, position) {
            console.log(`💥 Colisão detectada: ${type}`);
            
            this.isColliding = true;
            this.lastCollisionTime = Date.now();
            
            // Aplicar efeito de ricochete
            this.applyBounceEffect(type, position);
            
            // Efeitos visuais
            if (this.data.showEffects) {
                this.createCollisionEffect(position, type);
            }
            
            // Efeitos sonoros
            if (this.data.soundEnabled) {
                this.playCollisionSound(type);
            }
            
            // Notificar sistema de jogo
            this.notifyCollision(type, object);
            
            // Resetar estado após cooldown
            setTimeout(() => {
                this.isColliding = false;
            }, this.collisionCooldown);
        },

        applyBounceEffect: function (type, position) {
            if (!this.droneController) return;
            
            const bounceForce = this.data.bounceForce;
            let bounceDirection = { x: 0, y: 0, z: 0 };
            
            // Calcular direção do ricochete baseado no tipo de colisão
            switch (type) {
                case 'building':
                case 'obstacle':
                    // Ricochete para trás
                    const droneVelocity = this.droneController.velocity || { x: 0, y: 0, z: 0 };
                    bounceDirection.x = -droneVelocity.x * bounceForce;
                    bounceDirection.y = Math.abs(droneVelocity.y) * bounceForce;
                    bounceDirection.z = -droneVelocity.z * bounceForce;
                    break;
                    
                case 'boundary':
                    // Empurrar para o centro
                    bounceDirection.x = position.x > 0 ? -bounceForce * 2 : bounceForce * 2;
                    bounceDirection.z = position.z > 0 ? -bounceForce * 2 : bounceForce * 2;
                    break;
                    
                case 'ceiling':
                    bounceDirection.y = -bounceForce * 3;
                    break;
                    
                case 'ground':
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
            const particleCount = type === 'building' ? 15 : 8;
            const particleColor = this.getCollisionColor(type);
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('a-sphere');
                
                particle.setAttribute('geometry', {
                    radius: 0.05 + Math.random() * 0.1
                });
                
                particle.setAttribute('material', {
                    color: particleColor,
                    emissive: particleColor,
                    emissiveIntensity: 0.8
                });
                
                const randomX = (Math.random() - 0.5) * 4;
                const randomY = Math.random() * 3;
                const randomZ = (Math.random() - 0.5) * 4;
                
                particle.setAttribute('position', {
                    x: position.x,
                    y: position.y,
                    z: position.z
                });
                
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${position.x + randomX} ${position.y + randomY} ${position.z + randomZ}`,
                    dur: 1000,
                    easing: 'easeOutQuad'
                });
                
                particle.setAttribute('animation__fade', {
                    property: 'material.opacity',
                    from: 1,
                    to: 0,
                    dur: 1000,
                    easing: 'easeOutQuad'
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
                case 'building': return '#ff6600';
                case 'obstacle': return '#ff3300';
                case 'boundary': return '#ffff00';
                case 'ceiling': return '#00ffff';
                case 'ground': return '#ff0066';
                default: return '#ffffff';
            }
        },

        createScreenFlash: function (type) {
            const flash = document.createElement('a-plane');
            const camera = document.querySelector('[camera]');
            
            if (!camera) return;
            
            flash.setAttribute('geometry', {
                width: 10,
                height: 10
            });
            
            flash.setAttribute('material', {
                color: this.getCollisionColor(type),
                transparent: true,
                opacity: 0.3
            });
            
            flash.setAttribute('position', '0 0 -2');
            camera.appendChild(flash);
            
            // Animação de fade
            flash.setAttribute('animation', {
                property: 'material.opacity',
                from: 0.3,
                to: 0,
                dur: 200,
                easing: 'easeOutQuad'
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
                const audioSystem = this.el.sceneEl.systems['audio-system'];
                if (audioSystem && audioSystem.isInitialized) {
                    const isHeavyCollision = type === 'building' || type === 'obstacle';
                    
                    if (isHeavyCollision) {
                        // Som grave para colisões pesadas
                        audioSystem.createTone(150, 200, 0.3);
                    } else {
                        // Som agudo para colisões leves
                        audioSystem.createTone(400, 100, 0.2);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Erro ao tocar som de colisão:', error);
            }
        },

        notifyCollision: function (type, object) {
            // Emitir evento de colisão
            this.el.sceneEl.emit('drone-collision', {
                type: type,
                object: object,
                timestamp: Date.now()
            });
            
            // Notificar game manager se existir
            const gameManager = document.querySelector('[game-manager]');
            if (gameManager && gameManager.components['game-manager']) {
                gameManager.components['game-manager'].onCollision(type, object);
            }
        },

        remove: function () {
            if (this.collisionCheck) {
                clearInterval(this.collisionCheck);
            }
        }
    });
}

console.log('📦 Módulo collision-system.js carregado com sucesso!');