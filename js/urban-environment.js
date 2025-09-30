/**
 * Sistema de Ambiente Urbano 3D
 * Gera prédios, obstáculos e cenário urbano de forma procedural
 */

// Componente principal do ambiente urbano
AFRAME.registerComponent('urban-environment', {
    schema: {
        citySize: { type: 'number', default: 200 },
        buildingCount: { type: 'number', default: 50 },
        obstacleCount: { type: 'number', default: 30 },
        treeCount: { type: 'number', default: 20 },
        streetWidth: { type: 'number', default: 8 },
        seed: { type: 'number', default: 12345 },
        vrOptimized: { type: 'boolean', default: false }
    },

    init: function () {
        console.log('🏙️ Inicializando ambiente urbano...');
        
        // Configurar gerador de números aleatórios com seed
        this.random = this.createSeededRandom(this.data.seed);
        
        // Criar container para todos os elementos urbanos
        this.urbanContainer = document.createElement('a-entity');
        this.urbanContainer.setAttribute('id', 'urban-container');
        this.el.appendChild(this.urbanContainer);
        
        // Gerar elementos do ambiente
        this.generateStreets();
        this.generateBuildings();
        this.generateObstacles();
        this.generateVegetation();
        this.generateLighting();
        this.generateSkybox();
        
        console.log('✅ Ambiente urbano criado com sucesso!');
    },

    // Sistema de LOD (Level of Detail) para otimização
    setupLODSystem() {
        console.log('🔧 Configurando sistema de LOD...');
        
        this.lodSystem = {
            camera: null,
            buildings: [],
            updateInterval: null,
            lastUpdate: 0,
            updateFrequency: 100 // ms
        };
        
        // Encontrar câmera do drone
        setTimeout(() => {
            this.lodSystem.camera = document.querySelector('#drone-camera');
            if (this.lodSystem.camera) {
                this.collectBuildingsForLOD();
                this.startLODUpdates();
            }
        }, 1000);
    },

    // Coletar todos os prédios para o sistema de LOD
    collectBuildingsForLOD() {
        const buildings = this.el.querySelectorAll('[data-building="true"]');
        this.lodSystem.buildings = Array.from(buildings).map(building => ({
            element: building,
            position: building.getAttribute('position'),
            highDetail: building.querySelector('.building-details'),
            lowDetail: building.querySelector('.building-simple')
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
        if (now - this.lodSystem.lastUpdate < this.lodSystem.updateFrequency) return;
        
        const cameraPosition = this.lodSystem.camera.getAttribute('position');
        if (!cameraPosition) return;
        
        this.lodSystem.buildings.forEach(building => {
            const distance = this.calculateDistance(cameraPosition, building.position);
            
            // Definir níveis de LOD
            if (distance > 80) {
                // Muito distante - ocultar completamente
                building.element.setAttribute('visible', false);
            } else if (distance > 50) {
                // Distante - baixo detalhe
                building.element.setAttribute('visible', true);
                if (building.highDetail) building.highDetail.setAttribute('visible', false);
                if (building.lowDetail) building.lowDetail.setAttribute('visible', true);
            } else {
                // Próximo - alto detalhe
                building.element.setAttribute('visible', true);
                if (building.highDetail) building.highDetail.setAttribute('visible', true);
                if (building.lowDetail) building.lowDetail.setAttribute('visible', false);
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
        console.log('🛣️ Gerando sistema de ruas...');
        
        const streetContainer = document.createElement('a-entity');
        streetContainer.setAttribute('id', 'streets');
        
        const citySize = this.data.citySize;
        const streetWidth = this.data.streetWidth;
        
        // Ruas principais (norte-sul)
        for (let x = -citySize; x <= citySize; x += 40) {
            const street = document.createElement('a-plane');
            street.setAttribute('geometry', {
                primitive: 'plane',
                width: streetWidth,
                height: citySize * 2
            });
            street.setAttribute('material', {
                color: '#333333',
                roughness: 0.9,
                metalness: 0.1
            });
            street.setAttribute('position', `${x} 0.1 0`);
            street.setAttribute('rotation', '-90 0 0');
            streetContainer.appendChild(street);
            
            // Linhas da rua
            const centerLine = document.createElement('a-plane');
            centerLine.setAttribute('geometry', {
                primitive: 'plane',
                width: 0.5,
                height: citySize * 2
            });
            centerLine.setAttribute('material', {
                color: '#ffff00',
                emissive: '#ffff00',
                emissiveIntensity: 0.3
            });
            centerLine.setAttribute('position', `${x} 0.11 0`);
            centerLine.setAttribute('rotation', '-90 0 0');
            streetContainer.appendChild(centerLine);
        }
        
        // Ruas secundárias (leste-oeste)
        for (let z = -citySize; z <= citySize; z += 50) {
            const street = document.createElement('a-plane');
            street.setAttribute('geometry', {
                primitive: 'plane',
                width: citySize * 2,
                height: streetWidth
            });
            street.setAttribute('material', {
                color: '#333333',
                roughness: 0.9,
                metalness: 0.1
            });
            street.setAttribute('position', `0 0.1 ${z}`);
            street.setAttribute('rotation', '-90 0 0');
            streetContainer.appendChild(street);
        }
        
        this.urbanContainer.appendChild(streetContainer);
    },

    // Gerar prédios proceduralmente
    generateBuildings: function () {
        console.log('🏢 Gerando prédios...');
        
        const buildingContainer = document.createElement('a-entity');
        buildingContainer.setAttribute('id', 'buildings');
        
        const citySize = this.data.citySize;
        const buildingCount = this.data.buildingCount;
        
        for (let i = 0; i < buildingCount; i++) {
            const building = this.createBuilding();
            
            // Posicionar aleatoriamente, evitando ruas
            let x, z;
            do {
                x = (this.random() - 0.5) * citySize * 1.8;
                z = (this.random() - 0.5) * citySize * 1.8;
            } while (this.isOnStreet(x, z));
            
            building.setAttribute('position', `${x} 0 ${z}`);
            buildingContainer.appendChild(building);
        }
        
        this.urbanContainer.appendChild(buildingContainer);
        
        // Configurar sistema de LOD
        this.setupLODSystem();
    },

    // Criar um prédio individual
    createBuilding: function () {
        const building = document.createElement('a-entity');
        building.classList.add('building');
        building.setAttribute('data-building', 'true');
        
        // Dimensões aleatórias (menores para VR)
        const baseWidth = this.data.vrOptimized ? 6 : 8;
        const baseDepth = this.data.vrOptimized ? 6 : 8;
        const baseHeight = this.data.vrOptimized ? 12 : 15;
        const maxWidth = this.data.vrOptimized ? 8 : 12;
        const maxDepth = this.data.vrOptimized ? 8 : 12;
        const maxHeight = this.data.vrOptimized ? 25 : 40;
        
        const width = baseWidth + this.random() * maxWidth;
        const depth = baseDepth + this.random() * maxDepth;
        const height = baseHeight + this.random() * maxHeight;
        
        // Estrutura principal simplificada
        const mainStructure = document.createElement('a-box');
        mainStructure.setAttribute('geometry', {
            width: width,
            height: height,
            depth: depth
        });
        
        // Material do prédio (simplificado para VR)
        const buildingColors = ['#666666', '#888888', '#555555', '#777777', '#999999'];
        const color = buildingColors[Math.floor(this.random() * buildingColors.length)];
        
        const materialConfig = {
            color: color,
            roughness: this.data.vrOptimized ? 1.0 : 0.8,
            metalness: this.data.vrOptimized ? 0.0 : 0.2
        };
        
        mainStructure.setAttribute('material', materialConfig);
        mainStructure.setAttribute('position', `0 ${height / 2} 0`);
        building.appendChild(mainStructure);
        
        // Adicionar detalhes apenas se não for otimizado para VR
        if (!this.data.vrOptimized) {
            // Adicionar janelas (apenas na versão de alto detalhe)
            this.addWindows(building, width, height, depth);
            
            // Adicionar telhado ocasionalmente
            if (this.random() > 0.7) {
                this.addRoof(building, width, height, depth);
            }
            
            // Adicionar antenas/equipamentos no topo
             if (this.random() > 0.6) {
                 this.addRooftopEquipment(building, width, height, depth);
             }
         }
        
        return building;
    },

    // Adicionar janelas aos prédios
    addWindows: function (building, width, height, depth) {
        const windowSize = 1.5;
        const windowSpacing = 3;
        
        // Janelas na frente e atrás
        for (let y = windowSpacing; y < height - windowSpacing; y += windowSpacing) {
            for (let x = -width/2 + windowSpacing; x < width/2 - windowSpacing; x += windowSpacing) {
                // Frente
                const frontWindow = document.createElement('a-plane');
                frontWindow.setAttribute('geometry', {
                    width: windowSize,
                    height: windowSize
                });
                frontWindow.setAttribute('material', {
                    color: this.random() > 0.8 ? '#ffff88' : '#4488ff',
                    emissive: this.random() > 0.8 ? '#ffff88' : '#4488ff',
                    emissiveIntensity: this.random() > 0.8 ? 0.3 : 0.1,
                    transparent: true,
                    opacity: 0.8
                });
                frontWindow.setAttribute('position', `${x} ${y} ${depth/2 + 0.01}`);
                building.appendChild(frontWindow);
                
                // Atrás
                const backWindow = frontWindow.cloneNode(true);
                backWindow.setAttribute('position', `${x} ${y} ${-depth/2 - 0.01}`);
                backWindow.setAttribute('rotation', '0 180 0');
                building.appendChild(backWindow);
            }
        }
        
        // Janelas nas laterais
        for (let y = windowSpacing; y < height - windowSpacing; y += windowSpacing) {
            for (let z = -depth/2 + windowSpacing; z < depth/2 - windowSpacing; z += windowSpacing) {
                // Lateral direita
                const rightWindow = document.createElement('a-plane');
                rightWindow.setAttribute('geometry', {
                    width: windowSize,
                    height: windowSize
                });
                rightWindow.setAttribute('material', {
                    color: this.random() > 0.8 ? '#ffff88' : '#4488ff',
                    emissive: this.random() > 0.8 ? '#ffff88' : '#4488ff',
                    emissiveIntensity: this.random() > 0.8 ? 0.3 : 0.1,
                    transparent: true,
                    opacity: 0.8
                });
                rightWindow.setAttribute('position', `${width/2 + 0.01} ${y} ${z}`);
                rightWindow.setAttribute('rotation', '0 90 0');
                building.appendChild(rightWindow);
                
                // Lateral esquerda
                const leftWindow = rightWindow.cloneNode(true);
                leftWindow.setAttribute('position', `${-width/2 - 0.01} ${y} ${z}`);
                leftWindow.setAttribute('rotation', '0 -90 0');
                building.appendChild(leftWindow);
            }
        }
    },

    // Adicionar telhado
    addRoof: function (building, width, height, depth) {
        const roof = document.createElement('a-box');
        roof.setAttribute('geometry', {
            width: width + 1,
            height: 2,
            depth: depth + 1
        });
        roof.setAttribute('material', {
            color: '#444444',
            roughness: 0.9,
            metalness: 0.1
        });
        roof.setAttribute('position', `0 ${height + 1} 0`);
        building.appendChild(roof);
    },

    // Adicionar equipamentos no telhado
    addRooftopEquipment: function (building, width, height, depth) {
        const equipmentCount = 1 + Math.floor(this.random() * 3);
        
        for (let i = 0; i < equipmentCount; i++) {
            const equipment = document.createElement('a-cylinder');
            equipment.setAttribute('geometry', {
                radius: 0.5 + this.random() * 1,
                height: 2 + this.random() * 4
            });
            equipment.setAttribute('material', {
                color: '#333333',
                metalness: 0.8,
                roughness: 0.2
            });
            
            const x = (this.random() - 0.5) * width * 0.6;
            const z = (this.random() - 0.5) * depth * 0.6;
            equipment.setAttribute('position', `${x} ${height + 3} ${z}`);
            building.appendChild(equipment);
        }
    },

    // Verificar se uma posição está em uma rua
    isOnStreet: function (x, z) {
        const streetWidth = this.data.streetWidth;
        
        // Verificar ruas norte-sul
        for (let streetX = -this.data.citySize; streetX <= this.data.citySize; streetX += 40) {
            if (Math.abs(x - streetX) < streetWidth) {
                return true;
            }
        }
        
        // Verificar ruas leste-oeste
        for (let streetZ = -this.data.citySize; streetZ <= this.data.citySize; streetZ += 50) {
            if (Math.abs(z - streetZ) < streetWidth) {
                return true;
            }
        }
        
        return false;
    },

    // Gerar obstáculos urbanos
    generateObstacles: function () {
        console.log('🚧 Gerando obstáculos...');
        
        const obstacleContainer = document.createElement('a-entity');
        obstacleContainer.setAttribute('id', 'obstacles');
        
        // Reduzir obstáculos para VR
        const obstacleCount = this.data.vrOptimized ? Math.min(this.data.obstacleCount, 5) : this.data.obstacleCount;
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = this.createObstacle();
            
            // Posicionar aleatoriamente
            const x = (this.random() - 0.5) * this.data.citySize * 1.5;
            const z = (this.random() - 0.5) * this.data.citySize * 1.5;
            
            obstacle.setAttribute('position', `${x} 0 ${z}`);
            obstacleContainer.appendChild(obstacle);
        }
        
        this.urbanContainer.appendChild(obstacleContainer);
    },

    // Criar obstáculo individual
    createObstacle: function () {
        if (this.data.vrOptimized) {
            // Versão simplificada para VR - apenas obstáculos básicos
            const obstacle = document.createElement('a-entity');
            obstacle.setAttribute('class', 'obstacle');
            
            const obstacleGeometry = document.createElement('a-box');
            obstacleGeometry.setAttribute('geometry', {
                width: 1,
                height: 2,
                depth: 1
            });
            obstacleGeometry.setAttribute('material', {
                color: '#666666'
            });
            obstacle.appendChild(obstacleGeometry);
            return obstacle;
        } else {
            // Versão detalhada
            const obstacleTypes = ['tower', 'crane', 'billboard', 'antenna'];
            const type = obstacleTypes[Math.floor(this.random() * obstacleTypes.length)];
            
            switch (type) {
                case 'tower':
                    return this.createTower();
                case 'crane':
                    return this.createCrane();
                case 'billboard':
                    return this.createBillboard();
                case 'antenna':
                    return this.createAntenna();
                default:
                    return this.createTower();
            }
        }
    },

    // Criar torre de comunicação
    createTower: function () {
        const tower = document.createElement('a-entity');
        tower.classList.add('tower');
        
        const height = 30 + this.random() * 50;
        
        // Base da torre
        const base = document.createElement('a-cylinder');
        base.setAttribute('geometry', {
            radius: 2,
            height: 5
        });
        base.setAttribute('material', {
            color: '#666666',
            metalness: 0.8,
            roughness: 0.2
        });
        base.setAttribute('position', '0 2.5 0');
        tower.appendChild(base);
        
        // Torre principal
        const mainTower = document.createElement('a-cylinder');
        mainTower.setAttribute('geometry', {
            radius: 0.5,
            height: height
        });
        mainTower.setAttribute('material', {
            color: '#ff4444',
            metalness: 0.7,
            roughness: 0.3
        });
        mainTower.setAttribute('position', `0 ${height/2 + 5} 0`);
        tower.appendChild(mainTower);
        
        // Luzes de aviso
        for (let i = 0; i < 3; i++) {
            const light = document.createElement('a-sphere');
            light.setAttribute('geometry', { radius: 0.3 });
            light.setAttribute('material', {
                color: '#ff0000',
                emissive: '#ff0000',
                emissiveIntensity: 0.5
            });
            light.setAttribute('position', `0 ${height * 0.3 + i * height * 0.3} 0`);
            light.setAttribute('animation', {
                property: 'material.emissiveIntensity',
                from: 0.5,
                to: 1,
                dur: 1000,
                dir: 'alternate',
                loop: true
            });
            tower.appendChild(light);
        }
        
        return tower;
    },

    // Criar guindaste
    createCrane: function () {
        const crane = document.createElement('a-entity');
        crane.classList.add('crane');
        
        const height = 40 + this.random() * 30;
        
        // Base do guindaste
        const base = document.createElement('a-box');
        base.setAttribute('geometry', {
            width: 4,
            height: 3,
            depth: 4
        });
        base.setAttribute('material', {
            color: '#ffff00',
            metalness: 0.6,
            roughness: 0.4
        });
        base.setAttribute('position', '0 1.5 0');
        crane.appendChild(base);
        
        // Torre do guindaste
        const tower = document.createElement('a-cylinder');
        tower.setAttribute('geometry', {
            radius: 0.8,
            height: height
        });
        tower.setAttribute('material', {
            color: '#ffff00',
            metalness: 0.6,
            roughness: 0.4
        });
        tower.setAttribute('position', `0 ${height/2 + 3} 0`);
        crane.appendChild(tower);
        
        // Braço do guindaste
        const arm = document.createElement('a-box');
        arm.setAttribute('geometry', {
            width: 25,
            height: 1,
            depth: 1
        });
        arm.setAttribute('material', {
            color: '#ffff00',
            metalness: 0.6,
            roughness: 0.4
        });
        arm.setAttribute('position', `12.5 ${height + 3} 0`);
        crane.appendChild(arm);
        
        return crane;
    },

    // Criar outdoor/billboard
    createBillboard: function () {
        const billboard = document.createElement('a-entity');
        billboard.classList.add('billboard');
        
        // Poste
        const pole = document.createElement('a-cylinder');
        pole.setAttribute('geometry', {
            radius: 0.3,
            height: 15
        });
        pole.setAttribute('material', {
            color: '#333333',
            metalness: 0.8,
            roughness: 0.2
        });
        pole.setAttribute('position', '0 7.5 0');
        billboard.appendChild(pole);
        
        // Painel do outdoor
        const panel = document.createElement('a-plane');
        panel.setAttribute('geometry', {
            width: 12,
            height: 6
        });
        panel.setAttribute('material', {
            color: '#ffffff',
            emissive: '#4488ff',
            emissiveIntensity: 0.2
        });
        panel.setAttribute('position', '0 18 0');
        billboard.appendChild(panel);
        
        // Texto do outdoor
        const text = document.createElement('a-text');
        text.setAttribute('value', 'DRONE RACING');
        text.setAttribute('position', '0 18 0.01');
        text.setAttribute('color', '#000000');
        text.setAttribute('scale', '8 8 8');
        text.setAttribute('align', 'center');
        billboard.appendChild(text);
        
        return billboard;
    },

    // Criar antena
    createAntenna: function () {
        const antenna = document.createElement('a-entity');
        antenna.classList.add('antenna');
        
        const height = 20 + this.random() * 25;
        
        // Base
        const base = document.createElement('a-cylinder');
        base.setAttribute('geometry', {
            radius: 1.5,
            height: 3
        });
        base.setAttribute('material', {
            color: '#888888',
            metalness: 0.7,
            roughness: 0.3
        });
        base.setAttribute('position', '0 1.5 0');
        antenna.appendChild(base);
        
        // Antena principal
        const mainAntenna = document.createElement('a-cylinder');
        mainAntenna.setAttribute('geometry', {
            radius: 0.2,
            height: height
        });
        mainAntenna.setAttribute('material', {
            color: '#cccccc',
            metalness: 0.9,
            roughness: 0.1
        });
        mainAntenna.setAttribute('position', `0 ${height/2 + 3} 0`);
        antenna.appendChild(mainAntenna);
        
        // Pratos/antenas parabólicas
        for (let i = 0; i < 2; i++) {
            const dish = document.createElement('a-cylinder');
            dish.setAttribute('geometry', {
                radius: 2,
                height: 0.2
            });
            dish.setAttribute('material', {
                color: '#ffffff',
                metalness: 0.8,
                roughness: 0.2
            });
            dish.setAttribute('position', `0 ${height * 0.7 + i * 5} 2`);
            dish.setAttribute('rotation', '90 0 0');
            antenna.appendChild(dish);
        }
        
        return antenna;
    },

    // Gerar vegetação urbana
    generateVegetation: function () {
        console.log('🌳 Gerando vegetação...');
        
        const vegetationContainer = document.createElement('a-entity');
        vegetationContainer.setAttribute('id', 'vegetation');
        
        // Reduzir vegetação para VR
        const treeCount = this.data.vrOptimized ? Math.min(this.data.treeCount, 3) : this.data.treeCount;
        
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree();
            
            // Posicionar aleatoriamente
            const x = (this.random() - 0.5) * this.data.citySize * 1.5;
            const z = (this.random() - 0.5) * this.data.citySize * 1.5;
            
            tree.setAttribute('position', `${x} 0 ${z}`);
            vegetationContainer.appendChild(tree);
        }
        
        this.urbanContainer.appendChild(vegetationContainer);
    },

    // Criar árvore
    createTree: function () {
        const tree = document.createElement('a-entity');
        tree.classList.add('tree');
        
        if (this.data.vrOptimized) {
            // Versão simplificada para VR
            const simpleTree = document.createElement('a-cylinder');
            simpleTree.setAttribute('geometry', {
                radius: 1,
                height: 4
            });
            simpleTree.setAttribute('material', {
                color: '#228B22'
            });
            simpleTree.setAttribute('position', '0 2 0');
            tree.appendChild(simpleTree);
        } else {
            // Versão detalhada
            // Tronco
            const trunk = document.createElement('a-cylinder');
            const trunkHeight = 3 + this.random() * 2;
            trunk.setAttribute('geometry', {
                radius: 0.3,
                height: trunkHeight
            });
            trunk.setAttribute('material', {
                color: '#8B4513'
            });
            trunk.setAttribute('position', `0 ${trunkHeight / 2} 0`);
            
            // Copa da árvore
            const foliage = document.createElement('a-sphere');
            const foliageRadius = 2 + this.random() * 1.5;
            foliage.setAttribute('geometry', {
                radius: foliageRadius
            });
            foliage.setAttribute('material', {
                color: '#228B22'
            });
            foliage.setAttribute('position', `0 ${trunkHeight + foliageRadius * 0.7} 0`);
            
            tree.appendChild(trunk);
            tree.appendChild(foliage);
        }
        
        return tree;
    },

    // Configurar iluminação urbana
    generateLighting: function () {
        console.log('💡 Configurando iluminação urbana...');
        
        const lightingContainer = document.createElement('a-entity');
        lightingContainer.setAttribute('id', 'urban-lighting');
        
        // Postes de luz ao longo das ruas
        for (let x = -this.data.citySize; x <= this.data.citySize; x += 20) {
            for (let z = -this.data.citySize; z <= this.data.citySize; z += 25) {
                if (this.isOnStreet(x, z)) {
                    const streetLight = this.createStreetLight();
                    streetLight.setAttribute('position', `${x + (this.random() - 0.5) * 4} 0 ${z + (this.random() - 0.5) * 4}`);
                    lightingContainer.appendChild(streetLight);
                }
            }
        }
        
        this.urbanContainer.appendChild(lightingContainer);
    },

    // Criar poste de luz
    createStreetLight: function () {
        const streetLight = document.createElement('a-entity');
        streetLight.classList.add('street-light');
        
        // Poste
        const pole = document.createElement('a-cylinder');
        pole.setAttribute('geometry', {
            radius: 0.2,
            height: 8
        });
        pole.setAttribute('material', {
            color: '#333333',
            metalness: 0.8,
            roughness: 0.2
        });
        pole.setAttribute('position', '0 4 0');
        streetLight.appendChild(pole);
        
        // Luminária
        const lamp = document.createElement('a-sphere');
        lamp.setAttribute('geometry', { radius: 0.8 });
        lamp.setAttribute('material', {
            color: '#ffff88',
            emissive: '#ffff88',
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        lamp.setAttribute('position', '0 8.5 0');
        streetLight.appendChild(lamp);
        
        // Luz pontual
        const light = document.createElement('a-light');
        light.setAttribute('type', 'point');
        light.setAttribute('color', '#ffff88');
        light.setAttribute('intensity', 0.5);
        light.setAttribute('distance', 15);
        light.setAttribute('position', '0 8.5 0');
        streetLight.appendChild(light);
        
        return streetLight;
    },

    // Configurar skybox urbano
    generateSkybox: function () {
        console.log('🌆 Configurando skybox urbano...');
        
        // Skybox com cor urbana
        const sky = document.createElement('a-sky');
        sky.setAttribute('color', '#87CEEB');
        this.el.sceneEl.appendChild(sky);
        
        // Nuvens distantes
        for (let i = 0; i < 10; i++) {
            const cloud = document.createElement('a-sphere');
            cloud.setAttribute('geometry', {
                radius: 20 + this.random() * 30
            });
            cloud.setAttribute('material', {
                color: '#ffffff',
                transparent: true,
                opacity: 0.6
            });
            
            const x = (this.random() - 0.5) * 800;
            const y = 100 + this.random() * 50;
            const z = (this.random() - 0.5) * 800;
            
            cloud.setAttribute('position', `${x} ${y} ${z}`);
            cloud.setAttribute('animation', {
                property: 'position',
                to: `${x + 50} ${y} ${z}`,
                dur: 60000 + this.random() * 30000,
                loop: true
            });
            
            this.el.sceneEl.appendChild(cloud);
        }
    }
});

console.log('📦 Módulo urban-environment.js carregado com sucesso!');