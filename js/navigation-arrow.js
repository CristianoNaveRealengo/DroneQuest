/**
 * Sistema de Seta Indicativa para Navegação
 * Mostra o caminho até o próximo checkpoint
 */

AFRAME.registerComponent('navigation-arrow', {
    schema: {
        targetCheckpoint: { type: 'number', default: 1 },
        distance: { type: 'number', default: 4 }, // Aumentada para melhor visibilidade
        size: { type: 'number', default: 0.8 }, // Aumentada para melhor visibilidade
        color: { type: 'color', default: '#00ff88' }, // Verde mais vibrante
        showDistance: { type: 'boolean', default: true },
        showPhase: { type: 'boolean', default: true } // Nova opção para mostrar fase
    },

    init: function () {
        console.log('🧭 Inicializando sistema de navegação aprimorado...');
        
        // Estado da navegação
        this.currentTarget = null;
        this.checkpoints = [];
        this.dronePosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.totalCheckpoints = 0;
        
        // Criar elementos visuais da seta
        this.createArrowElements();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Aguardar carregamento da cena para encontrar checkpoints
        setTimeout(() => {
            this.findCheckpoints();
            this.updateTarget();
        }, 500);
        
        console.log('✅ Sistema de navegação aprimorado inicializado!');
    },

    createArrowElements: function () {
        // Container principal da seta
        this.arrowContainer = document.createElement('a-entity');
        this.arrowContainer.setAttribute('id', 'navigation-arrow-container');
        this.el.appendChild(this.arrowContainer);
        
        // Seta principal (cone) - Maior e mais visível
        this.arrowMesh = document.createElement('a-entity');
        this.arrowMesh.setAttribute('geometry', {
            primitive: 'cone',
            radiusBottom: this.data.size * 0.4, // Mais larga
            radiusTop: 0,
            height: this.data.size * 2 // Mais alta
        });
        this.arrowMesh.setAttribute('material', {
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.5, // Mais brilhante
            transparent: true,
            opacity: 0.9 // Mais opaca
        });
        this.arrowMesh.setAttribute('position', `0 0 -${this.data.distance}`);
        this.arrowMesh.setAttribute('rotation', '90 0 0'); // Apontar para frente
        
        // Animação de pulsação mais intensa
        this.arrowMesh.setAttribute('animation__pulse', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 800,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
        
        // Animação de rotação para chamar atenção
        this.arrowMesh.setAttribute('animation__spin', {
            property: 'rotation',
            to: '90 360 0',
            dur: 3000,
            loop: true,
            easing: 'linear'
        });
        
        this.arrowContainer.appendChild(this.arrowMesh);
        
        // Anel de destaque ao redor da seta
        this.highlightRing = document.createElement('a-entity');
        this.highlightRing.setAttribute('geometry', {
            primitive: 'torus',
            radius: this.data.size * 0.8,
            radiusTubular: 0.05
        });
        this.highlightRing.setAttribute('material', {
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        this.highlightRing.setAttribute('position', `0 0 -${this.data.distance}`);
        this.highlightRing.setAttribute('rotation', '0 0 0');
        
        // Animação do anel
        this.highlightRing.setAttribute('animation__ring', {
            property: 'rotation',
            to: '0 0 360',
            dur: 2000,
            loop: true,
            easing: 'linear'
        });
        
        this.arrowContainer.appendChild(this.highlightRing);
        
        // Texto de distância melhorado
        if (this.data.showDistance) {
            this.distanceText = document.createElement('a-text');
            this.distanceText.setAttribute('value', '0m');
            this.distanceText.setAttribute('position', `0 -${this.data.size * 1.2} -${this.data.distance}`);
            this.distanceText.setAttribute('align', 'center');
            this.distanceText.setAttribute('color', this.data.color);
            this.distanceText.setAttribute('scale', '1.2 1.2 1.2'); // Maior
            this.distanceText.setAttribute('font', 'roboto');
            this.arrowContainer.appendChild(this.distanceText);
        }
        
        // Texto de fase/checkpoint
        if (this.data.showPhase) {
            this.phaseText = document.createElement('a-text');
            this.phaseText.setAttribute('value', 'FASE 1');
            this.phaseText.setAttribute('position', `0 ${this.data.size * 1.2} -${this.data.distance}`);
            this.phaseText.setAttribute('align', 'center');
            this.phaseText.setAttribute('color', '#ffffff');
            this.phaseText.setAttribute('scale', '1.0 1.0 1.0');
            this.phaseText.setAttribute('font', 'roboto');
            
            // Fundo para o texto da fase
            this.phaseBackground = document.createElement('a-entity');
            this.phaseBackground.setAttribute('geometry', {
                primitive: 'plane',
                width: 2,
                height: 0.5
            });
            this.phaseBackground.setAttribute('material', {
                color: '#000000',
                transparent: true,
                opacity: 0.7
            });
            this.phaseBackground.setAttribute('position', `0 ${this.data.size * 1.2} -${this.data.distance + 0.01}`);
            
            this.arrowContainer.appendChild(this.phaseBackground);
            this.arrowContainer.appendChild(this.phaseText);
        }
        
        // Linha de conexão melhorada
        this.connectionLine = document.createElement('a-entity');
        this.connectionLine.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: 0.03, // Mais espessa
            height: 1
        });
        this.connectionLine.setAttribute('material', {
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        this.connectionLine.setAttribute('position', `0 0 -${this.data.distance * 0.5}`);
        this.connectionLine.setAttribute('rotation', '90 0 0');
        
        // Animação da linha
        this.connectionLine.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: '0.8',
            dur: 1500,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
        
        this.arrowContainer.appendChild(this.connectionLine);
    },

    setupEventListeners: function () {
        // Escutar eventos de checkpoint
        this.el.sceneEl.addEventListener('checkpoint-reached', this.onCheckpointReached.bind(this));
        this.el.sceneEl.addEventListener('game-reset', this.onGameReset.bind(this));
    },

    findCheckpoints: function () {
        // Encontrar todos os checkpoints na cena
        const checkpointElements = document.querySelectorAll('[checkpoint]');
        this.checkpoints = [];
        
        checkpointElements.forEach(element => {
            const checkpointData = element.getAttribute('checkpoint');
            const position = element.getAttribute('position');
            
            this.checkpoints.push({
                id: checkpointData.id,
                element: element,
                position: new THREE.Vector3(position.x, position.y, position.z),
                reached: false
            });
        });
        
        // Ordenar checkpoints por ID
        this.checkpoints.sort((a, b) => a.id - b.id);
        
        console.log(`🎯 Encontrados ${this.checkpoints.length} checkpoints`);
    },

    updateTarget: function () {
         // Encontrar próximo checkpoint não alcançado
         this.currentTarget = this.checkpoints.find(cp => !cp.reached);
         
         if (this.currentTarget) {
             console.log(`🧭 Navegando para checkpoint ${this.currentTarget.id}`);
             this.arrowContainer.setAttribute('visible', true);
             
             // Atualizar texto da fase
             if (this.phaseText) {
                 const currentPhase = this.currentTarget.id;
                 const totalPhases = this.checkpoints.length;
                 this.phaseText.setAttribute('value', `FASE ${currentPhase}/${totalPhases}`);
             }
         } else {
             console.log('🏁 Todos os checkpoints alcançados!');
             this.arrowContainer.setAttribute('visible', false);
         }
     },

    tick: function (time, timeDelta) {
        if (!this.currentTarget) return;
        
        // Obter posição atual do drone
        const droneElement = document.querySelector('#drone');
        if (!droneElement) return;
        
        const dronePos = droneElement.getAttribute('position');
        this.dronePosition.set(dronePos.x, dronePos.y, dronePos.z);
        
        // Calcular direção para o checkpoint
        this.targetPosition.copy(this.currentTarget.position);
        const direction = this.targetPosition.clone().sub(this.dronePosition);
        const distance = direction.length();
        
        // Normalizar direção
        direction.normalize();
        
        // Calcular rotação da seta para apontar para o checkpoint
        const angle = Math.atan2(direction.x, direction.z);
        this.arrowContainer.setAttribute('rotation', `0 ${THREE.MathUtils.radToDeg(angle)} 0`);
        
        // Atualizar texto de distância
        if (this.distanceText) {
            this.distanceText.setAttribute('value', `${distance.toFixed(0)}m`);
        }
        
        // Ajustar cor baseada na distância
        const intensity = Math.max(0.3, Math.min(1.0, 50 / distance));
        this.arrowMesh.setAttribute('material', 'emissiveIntensity', intensity);
        
        // Ajustar tamanho da linha de conexão baseado na distância
        const lineHeight = Math.min(this.data.distance, distance * 0.1);
        this.connectionLine.setAttribute('geometry', 'height', lineHeight);
        this.connectionLine.setAttribute('position', `0 0 -${lineHeight * 0.5}`);
    },

    onCheckpointReached: function (evt) {
        const checkpointId = evt.detail.id;
        
        // Marcar checkpoint como alcançado
        const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
        if (checkpoint) {
            checkpoint.reached = true;
            console.log(`✅ Checkpoint ${checkpointId} marcado como alcançado`);
        }
        
        // Atualizar alvo
        this.updateTarget();
    },

    onGameReset: function () {
        // Resetar todos os checkpoints
        this.checkpoints.forEach(cp => {
            cp.reached = false;
        });
        
        // Atualizar alvo
        this.updateTarget();
    },

    remove: function () {
        if (this.arrowContainer) {
            this.arrowContainer.remove();
        }
    }
});

console.log('📦 Módulo navigation-arrow.js carregado com sucesso!');