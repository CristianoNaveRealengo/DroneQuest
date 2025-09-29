/**
 * Controlador do Drone para Meta Quest 3
 * Sistema avançado de controle com física realista e suporte a VR
 */

// Registrar o componente no A-Frame apenas se não estiver registrado
if (!AFRAME.components['drone-controller']) {
AFRAME.registerComponent('drone-controller', {
    schema: {
        // Configurações de movimento (valores realistas para drone)
        maxSpeed: { type: 'number', default: 6 }, // Reduzido de 15 para 6 m/s (~22 km/h)
        acceleration: { type: 'number', default: 3 }, // Reduzido de 8 para 3 m/s²
        rotationSpeed: { type: 'number', default: 1.2 }, // Reduzido de 2 para 1.2 rad/s
        
        // Configurações de física (ajustadas para realismo)
        mass: { type: 'number', default: 1.5 }, // Massa mais leve
        drag: { type: 'number', default: 0.92 }, // Mais resistência ao ar
        angularDrag: { type: 'number', default: 0.88 }, // Mais resistência angular
        
        // Configurações de estabilização (melhor estabilidade)
        stabilization: { type: 'number', default: 0.25 }, // Maior estabilização
        autoLevel: { type: 'boolean', default: true },
        
        // Configurações de controle
        deadzone: { type: 'number', default: 0.1 },
        sensitivity: { type: 'number', default: 1.0 },
        
        // Configurações de hover realista
        hoverThrust: { type: 'number', default: 9.8 }, // Empuxo para contrabalançar gravidade
        hoverStability: { type: 'number', default: 0.8 }, // Estabilidade do hover
        windResistance: { type: 'number', default: 0.02 } // Resistência ao vento
    },

    init: function () {
        console.log('🚁 Inicializando controlador do drone...');
        
        // Vetores de movimento e rotação
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.targetRotation = new THREE.Euler();
        
        // Estado do drone
        this.isActive = false; // Corrigido: adicionado estado de ativação
        this.isFlying = false;
        this.currentSpeed = 0;
        this.batteryLevel = 100;
        
        // Sistema de hover realista
        this.thrustPower = 0; // Potência atual das hélices (0-1)
        this.targetThrust = 0; // Potência alvo das hélices
        this.hoverHeight = 3; // Altura preferida para hover
        this.isHovering = false; // Estado de hover automático
        
        // Iniciar o drone automaticamente após 1 segundo
        setTimeout(() => {
            this.activateDrone();
        }, 1000);
        
        // Inicializar animações das hélices
        setTimeout(() => {
            this.initPropellerAnimations();
        }, 100);
        
        // Controles VR
        this.leftController = null;
        this.rightController = null;
        this.leftStick = { x: 0, y: 0 };
        this.rightStick = { x: 0, y: 0 };
        
        // Controles de teclado (fallback)
        this.keys = {};
        this.setupKeyboardControls();
        
        // Configurar controles VR quando a cena carregar
        this.el.sceneEl.addEventListener('loaded', () => {
            this.setupVRControls();
        });
        
        // Configurar física
        this.setupPhysics();
        
        // Efeitos visuais
        this.setupVisualEffects();
        
        // Sistema de som (placeholder)
        this.setupAudioSystem();
        
        // Estabilizar drone na posição inicial
        this.stabilizeInitialPosition();
        
        console.log('✅ Controlador do drone inicializado com sucesso!');
    },

    setupVRControls: function () {
        console.log('🎮 Configurando controles VR...');
        
        // Salvar referência ao contexto this
        const self = this;
        
        // Aguardar carregamento dos controles VR
        setTimeout(function() {
            self.leftController = document.querySelector('#leftHand');
            self.rightController = document.querySelector('#rightHand');
            
            // Configurar controle esquerdo se disponível
            if (self.leftController) {
                console.log('🔍 Debug: Verificando funções do controle esquerdo...');
                console.log('onLeftStickMove:', typeof self.onLeftStickMove, self.onLeftStickMove);
                console.log('onLeftTriggerDown:', typeof self.onLeftTriggerDown, self.onLeftTriggerDown);
                console.log('onLeftTriggerUp:', typeof self.onLeftTriggerUp, self.onLeftTriggerUp);
                console.log('onLeftGripDown:', typeof self.onLeftGripDown, self.onLeftGripDown);
                console.log('onLeftGripUp:', typeof self.onLeftGripUp, self.onLeftGripUp);
                
                // Verificar e configurar cada evento individualmente
                if (typeof self.onLeftStickMove === 'function') {
                    self.leftController.addEventListener('thumbstickmoved', self.onLeftStickMove.bind(self));
                } else {
                    console.warn('⚠️ onLeftStickMove não é uma função:', typeof self.onLeftStickMove);
                }
                if (typeof self.onLeftTriggerDown === 'function') {
                    self.leftController.addEventListener('triggerdown', self.onLeftTriggerDown.bind(self));
                } else {
                    console.warn('⚠️ onLeftTriggerDown não é uma função:', typeof self.onLeftTriggerDown);
                }
                if (typeof self.onLeftTriggerUp === 'function') {
                    self.leftController.addEventListener('triggerup', self.onLeftTriggerUp.bind(self));
                } else {
                    console.warn('⚠️ onLeftTriggerUp não é uma função:', typeof self.onLeftTriggerUp);
                }
                if (typeof self.onLeftGripDown === 'function') {
                    self.leftController.addEventListener('gripdown', self.onLeftGripDown.bind(self));
                } else {
                    console.warn('⚠️ onLeftGripDown não é uma função:', typeof self.onLeftGripDown);
                }
                if (typeof self.onLeftGripUp === 'function') {
                    self.leftController.addEventListener('gripup', self.onLeftGripUp.bind(self));
                } else {
                    console.warn('⚠️ onLeftGripUp não é uma função:', typeof self.onLeftGripUp);
                }
                
                console.log('✅ Controle esquerdo configurado');
            }
            
            // Configurar controle direito se disponível
            if (self.rightController) {
                // Verificar e configurar cada evento individualmente
                if (typeof self.onRightStickMove === 'function') {
                    self.rightController.addEventListener('thumbstickmoved', self.onRightStickMove.bind(self));
                }
                if (typeof self.onRightTriggerDown === 'function') {
                    self.rightController.addEventListener('triggerdown', self.onRightTriggerDown.bind(self));
                }
                if (typeof self.onRightTriggerUp === 'function') {
                    self.rightController.addEventListener('triggerup', self.onRightTriggerUp.bind(self));
                }
                if (typeof self.onRightButtonDown === 'function') {
                    self.rightController.addEventListener('buttondown', self.onRightButtonDown.bind(self));
                }
                
                console.log('✅ Controle direito configurado');
            }
            
            // Se não há controladores VR, usar apenas teclado
            if (!self.leftController && !self.rightController) {
                console.log('ℹ️ Controladores VR não encontrados, usando apenas teclado');
            }
        }, 1000);
    },

    setupKeyboardControls: function () {
        // Controles de teclado para teste em desktop
        window.addEventListener('keydown', (e) => { 
            this.keys[e.code] = true; 
            this.handleKeyboardSpecialActions(e.code, true);
        });
        
        window.addEventListener('keyup', (e) => { 
            this.keys[e.code] = false; 
            this.handleKeyboardSpecialActions(e.code, false);
        });
        
        // Mostrar controles na tela
        this.showKeyboardHelp();
    },

    showKeyboardHelp: function () {
        const helpPanel = document.createElement('div');
        helpPanel.id = 'keyboard-help';
        helpPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            padding: 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
        `;

        helpPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🎮 Controles:</div>
            <div>WASD - Movimento (frente/trás/esquerda/direita)</div>
            <div>↑↓ - Subir/Descer</div>
            <div>←→ - Rotação (esquerda/direita)</div>
            <div>Space - Ligar/Desligar drone</div>
            <div>Shift - Modo boost</div>
            <div>R - Reset posição</div>
            <div>T - Toggle auto-nivelamento</div>
            <div>F - Toggle estatísticas</div>
            <div>M - Mutar/Desmutar áudio</div>
            <div>+/- - Aumentar/Diminuir volume</div>
            <div>1/2/3 - Qualidade baixa/média/alta</div>
        `;

        document.body.appendChild(helpPanel);

        // Auto-ocultar após 10 segundos
        setTimeout(() => {
            if (helpPanel.parentNode) {
                helpPanel.style.opacity = '0.3';
            }
        }, 10000);
    },

    setQuality: function (level) {
        const scene = this.el.sceneEl;
        if (scene.components['performance-monitor']) {
            scene.components['performance-monitor'].setQuality(level);
            console.log(`🎮 Qualidade definida para: ${level}`);
        }
    },

    adjustMasterVolume: function (delta) {
        const audioSystem = this.el.sceneEl.components['audio-system'];
        if (audioSystem) {
            const currentVolume = audioSystem.data.masterVolume;
            const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
            audioSystem.setMasterVolume(newVolume);
            
            // Mostrar feedback visual
            this.showVolumeIndicator(newVolume);
        }
    },

    showVolumeIndicator: function (volume) {
        const percentage = Math.round(volume * 100);
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            z-index: 1000;
            pointer-events: none;
        `;
        indicator.textContent = `🔊 Volume: ${percentage}%`;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 1500);
    },

    setupPhysics: function () {
        // Configurar propriedades físicas do drone
        const physicsBody = this.el.getAttribute('physics-body');
        if (physicsBody) {
            this.el.setAttribute('physics-body', {
                type: 'dynamic',
                mass: this.data.mass,
                linearDamping: 0.1,
                angularDamping: 0.1,
                shape: 'box'
            });
        }
    },

    setupVisualEffects: function () {
        // Configurar efeitos visuais das hélices
        this.propellers = [
            this.el.querySelector('#prop1'),
            this.el.querySelector('#prop2'),
            this.el.querySelector('#prop3'),
            this.el.querySelector('#prop4')
        ];
        
        // Configurar luzes LED
        this.setupDroneLights();
    },

    setupDroneLights: function () {
        // Sistema de luzes LED do drone baseado no estado
        this.ledElements = this.el.querySelectorAll('[material*="emissive"]');
    },

    setupAudioSystem: function () {
        // Integração com o sistema de áudio global
        // O audio-system gerencia os sons do drone, respeitando masterVolume e mute
        this.lastMovementIntensity = 0;
        this.audioSystem = this.el.sceneEl.components['audio-system'];
    },

    setupMotorSound: function () {
        // Som do motor agora é gerenciado pelo audio-system.
        // Esta função permanece por compatibilidade, mas não cria áudio próprio.
    },

    stabilizeInitialPosition: function () {
        // Aguardar um frame para garantir que a posição inicial foi definida
        setTimeout(() => {
            const currentPosition = this.el.getAttribute('position');
            
            // Definir a altura de hover como a altura atual do drone
            this.hoverHeight = currentPosition.y;
            
            // Zerar velocidades para evitar movimento inicial
            this.velocity.set(0, 0, 0);
            this.angularVelocity.set(0, 0, 0);
            
            // Definir empuxo inicial para manter posição
            this.thrustPower = 1.0; // Empuxo neutro para contrabalançar gravidade
            this.targetThrust = 1.0;
            
            // Ativar modo hover para estabilidade
            this.isHovering = true;
            
            console.log(`🎯 Drone estabilizado na altura: ${this.hoverHeight.toFixed(2)}m`);
        }, 100);
    },

    updateAudioFeedback: function (movementVector) {
        // Enviar intensidade de movimento para o sistema de áudio
        const movementIntensity = movementVector.length();
        this.lastMovementIntensity = movementIntensity;

        const audioSystem = this.el.sceneEl.components['audio-system'];
        if (audioSystem) {
            audioSystem.updatePropellerSound(movementIntensity);
        }

        // Emitir evento para compatibilidade com listeners existentes
        if (this.el.sceneEl) {
            this.el.sceneEl.emit('drone-throttle-change', { intensity: movementIntensity });
        }
    },

    // === EVENTOS DOS CONTROLES VR ===

    onLeftStickMove: function (evt) {
        const x = this.applyDeadzone(evt.detail.x);
        const y = this.applyDeadzone(evt.detail.y);
        
        this.leftStick.x = x;
        this.leftStick.y = y;
        
        // Stick esquerdo: Altitude (Y) e Rotação Yaw (X)
        this.targetAltitudeChange = y * this.data.maxSpeed * 0.3;
        this.targetYawRotation = -x * this.data.rotationSpeed;
    },

    onRightStickMove: function (evt) {
        const x = this.applyDeadzone(evt.detail.x);
        const y = this.applyDeadzone(evt.detail.y);
        
        this.rightStick.x = x;
        this.rightStick.y = y;
        
        // Stick direito: Movimento frente/trás (Y) e lateral (X)
        this.targetForwardSpeed = -y * this.data.maxSpeed;
        this.targetStrafeSpeed = x * this.data.maxSpeed;
    },

    onLeftTriggerDown: function () {
        this.isFlying = true;
        this.updatePropellerEffects(true);
        this.updateAudioFeedback(new THREE.Vector3(0, 0, 0));
        console.log('🚁 Drone ativado - Voando!');
    },

    onLeftTriggerUp: function () {
        this.isFlying = false;
        this.updatePropellerEffects(false);
        this.updateAudioFeedback(new THREE.Vector3(0, 0, 0));
        console.log('🚁 Drone desativado');
    },
    
    activateDrone: function() {
        if (this.isActive) {
            console.log('🚁 Drone desativado');
            this.isActive = false;
            this.velocity.set(0, 0, 0);
            this.angularVelocity.set(0, 0, 0);
            
            // Emitir evento de desativação
            this.el.emit('drone-deactivated');
        } else {
            console.log('🚁 Drone ativado');
            this.isActive = true;
            
            // Iniciar o voo
            this.isFlying = true;
            
            // Emitir evento de ativação
            this.el.emit('drone-activated');
            
            // Iniciar o jogo se ainda não estiver iniciado
            const gameManager = document.querySelector('[game-manager]');
            if (gameManager && gameManager.components['game-manager']) {
                const gameComponent = gameManager.components['game-manager'];
                if (!gameComponent.gameState.isPlaying) {
                    gameComponent.startGame();
                }
            }
        }
    },

    onLeftGripDown: function () {
        // Grip esquerdo: Modo de estabilização automática
        this.data.autoLevel = !this.data.autoLevel;
        console.log(`🎯 Auto-nivelamento: ${this.data.autoLevel ? 'ON' : 'OFF'}`);
    },

    onLeftGripUp: function () {
        // Grip esquerdo solto: Log para debug
        console.log('🎯 Grip esquerdo solto');
    },

    onRightTriggerDown: function () {
        // Trigger direito: Boost de velocidade
        this.boostMode = true;
        console.log('⚡ Modo boost ativado!');
    },

    onRightTriggerUp: function () {
        this.boostMode = false;
        console.log('⚡ Modo boost desativado');
    },

    onRightButtonDown: function (evt) {
        // Botões do controle direito para funções especiais
        if (evt.detail.id === 0) { // Botão A
            this.resetDronePosition();
        } else if (evt.detail.id === 1) { // Botão B
            this.emergencyStop();
        }
    },

    // === CONTROLES DE TECLADO (FALLBACK) ===

    handleKeyboardSpecialActions: function (keyCode, isPressed) {
        if (isPressed) {
            switch (keyCode) {
                case 'Space':
                    this.isFlying = !this.isFlying;
                    this.updatePropellerEffects(this.isFlying);
                    console.log(`🚁 Drone ${this.isFlying ? 'ativado' : 'desativado'}`);
                    break;
                // KeyR removido - reset é gerenciado pelo game-manager.js
                // case 'KeyR':
                //     this.resetDronePosition();
                //     break;
                case 'KeyT':
                    this.data.autoLevel = !this.data.autoLevel;
                    console.log(`🎯 Auto-nivelamento: ${this.data.autoLevel ? 'ON' : 'OFF'}`);
                    break;
                case 'ShiftLeft':
                    this.boostMode = true;
                    console.log('⚡ Modo boost ativado!');
                    break;
                case 'KeyP':
                    // Toggle pause
                    this.el.emit('toggle-pause');
                    break;
                case 'KeyF':
                    // Toggle stats de performance
                    const scene = this.el.sceneEl;
                    if (scene.components['performance-monitor']) {
                        scene.components['performance-monitor'].toggleStats();
                    }
                    break;
                case 'KeyM':
                    // Toggle mute audio
                    const audioSystem = this.el.sceneEl.components['audio-system'];
                    if (audioSystem) {
                        audioSystem.toggleMute();
                    }
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    // Diminuir volume
                    this.adjustMasterVolume(-0.1);
                    break;
                case 'Equal':
                case 'Plus':
                case 'NumpadAdd':
                    // Aumentar volume
                    this.adjustMasterVolume(0.1);
                    break;
                case 'Digit1':
                    // Qualidade baixa
                    this.setQuality('low');
                    break;
                case 'Digit2':
                    // Qualidade média
                    this.setQuality('medium');
                    break;
                case 'Digit3':
                    // Qualidade alta
                    this.setQuality('high');
                    break;
            }
        } else {
            if (keyCode === 'ShiftLeft') {
                this.boostMode = false;
                console.log('⚡ Modo boost desativado');
            }
        }
    },

    // === SISTEMA DE MOVIMENTO ===

    tick: function (time, timeDelta) {
        // Processar entrada de controles
        this.processControlInput();
        
        // Aplicar movimento com física realista
        this.applyMovement(timeDelta);
        
        // Aplicar rotação
        this.applyRotation(timeDelta);
        
        // Aplicar física realista (gravidade, hover, arrasto)
        this.applyRealisticPhysics(timeDelta);
        
        // Atualizar efeitos visuais
        this.updateAdvancedPropellerEffects();
        this.updateVisualEffects();
        
        // Atualizar HUD
        this.updateHUD();
    },

    processControlInput: function () {
        // Resetar valores de entrada
        this.targetForwardSpeed = 0;
        this.targetStrafeSpeed = 0;
        this.targetAltitudeChange = 0;
        this.targetYawRotation = 0;
        
        // Processar controles VR (já processados nos eventos)
        // Processar controles de teclado
        this.processKeyboardInput();
        
        // Aplicar boost se ativo
        if (this.boostMode) {
            this.targetForwardSpeed *= 1.5;
            this.targetStrafeSpeed *= 1.5;
            this.targetAltitudeChange *= 1.5;
        }
    },

    processKeyboardInput: function () {
        const speed = this.data.maxSpeed * this.data.sensitivity;
        
        // Movimento WASD (frente/trás/esquerda/direita)
        if (this.keys['KeyW']) this.targetForwardSpeed = speed;
        if (this.keys['KeyS']) this.targetForwardSpeed = -speed;
        if (this.keys['KeyA']) this.targetStrafeSpeed = -speed;
        if (this.keys['KeyD']) this.targetStrafeSpeed = speed;
        
        // Altitude com setas verticais (↑/↓)
        if (this.keys['ArrowUp']) this.targetAltitudeChange = speed * 0.3;
        if (this.keys['ArrowDown']) this.targetAltitudeChange = -speed * 0.3;
        
        // Rotação yaw com setas horizontais (esquerda/direita)
        if (this.keys['ArrowLeft']) this.targetYawRotation = this.data.rotationSpeed;
        if (this.keys['ArrowRight']) this.targetYawRotation = -this.data.rotationSpeed;
    },

    applyMovement: function (timeDelta) {
        const position = this.el.getAttribute('position');
        const rotation = this.el.getAttribute('rotation');
        
        // Converter rotação para quaternion
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(rotation.x),
            THREE.MathUtils.degToRad(rotation.y),
            THREE.MathUtils.degToRad(rotation.z)
        ));
        
        // Calcular velocidade baseada na entrada
        const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
        const upVector = new THREE.Vector3(0, 1, 0);
        
        // Aplicar forças
        const deltaTime = timeDelta / 1000;
        const acceleration = this.data.acceleration * deltaTime;
        
        this.velocity.add(forwardVector.multiplyScalar(this.targetForwardSpeed * acceleration));
        this.velocity.add(rightVector.multiplyScalar(this.targetStrafeSpeed * acceleration));
        this.velocity.add(upVector.multiplyScalar(this.targetAltitudeChange * acceleration));
        
        // Limitar velocidade máxima
        if (this.velocity.length() > this.data.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.data.maxSpeed);
        }
        
        // Aplicar movimento
        const newPosition = {
            x: position.x + this.velocity.x * deltaTime,
            y: Math.max(0.5, position.y + this.velocity.y * deltaTime), // Evitar ir abaixo do chão
            z: position.z + this.velocity.z * deltaTime
        };
        
        this.el.setAttribute('position', newPosition);
        
        // Atualizar áudio baseado na intensidade do movimento
        this.updateAudioFeedback(this.velocity);
        
        // Calcular velocidade atual para HUD
        this.currentSpeed = this.velocity.length();
    },

    applyRotation: function (timeDelta) {
        const rotation = this.el.getAttribute('rotation');
        const deltaTime = timeDelta / 1000;
        
        // Aplicar rotação Yaw
        if (this.targetYawRotation) {
            this.angularVelocity.y += this.targetYawRotation * deltaTime;
        }
        
        // Aplicar rotação Pitch (se usando teclado)
        if (this.targetPitchRotation) {
            this.angularVelocity.x += this.targetPitchRotation * deltaTime;
        }
        
        // Auto-nivelamento inteligente - só aplica se estiver fora da zona morta
        if (this.data.autoLevel) {
            const levelingDeadzone = 2.0; // Zona morta de 2 graus para evitar oscilação
            
            // Só aplicar auto-nivelamento se a rotação estiver fora da zona morta
            if (Math.abs(rotation.x) > levelingDeadzone) {
                this.angularVelocity.x -= rotation.x * this.data.stabilization * deltaTime;
            } else {
                // Dentro da zona morta, aplicar amortecimento suave para parar oscilações
                this.angularVelocity.x *= 0.95;
            }
            
            if (Math.abs(rotation.z) > levelingDeadzone) {
                this.angularVelocity.z -= rotation.z * this.data.stabilization * deltaTime;
            } else {
                // Dentro da zona morta, aplicar amortecimento suave para parar oscilações
                this.angularVelocity.z *= 0.95;
            }
        }
        
        // Aplicar rotação
        const newRotation = {
            x: rotation.x + THREE.MathUtils.radToDeg(this.angularVelocity.x * deltaTime),
            y: rotation.y + THREE.MathUtils.radToDeg(this.angularVelocity.y * deltaTime),
            z: rotation.z + THREE.MathUtils.radToDeg(this.angularVelocity.z * deltaTime)
        };
        
        this.el.setAttribute('rotation', newRotation);
    },

    applyRealisticPhysics: function (timeDelta) {
        const deltaTime = timeDelta / 1000;
        const position = this.el.getAttribute('position');
        
        if (this.isFlying) {
            // === SISTEMA DE HOVER REALISTA ===
            
            // Calcular empuxo necessário para hover
            const gravity = 9.8 * this.data.mass;
            
            // Se não há entrada de altitude, ativar hover automático
            if (Math.abs(this.targetAltitudeChange) < 0.1) {
                this.isHovering = true;
                
                // Calcular diferença da altura ideal
                const heightDifference = this.hoverHeight - position.y;
                
                // Ajustar empuxo baseado na diferença de altura
                const hoverAdjustment = heightDifference * this.data.hoverStability;
                this.targetThrust = (gravity + hoverAdjustment) / this.data.hoverThrust;
            } else {
                // Controle manual de altitude
                this.isHovering = false;
                this.targetThrust = (gravity + this.targetAltitudeChange * this.data.mass) / this.data.hoverThrust;
            }
            
            // Suavizar mudanças de empuxo
            this.thrustPower += (this.targetThrust - this.thrustPower) * 5.0 * deltaTime;
            this.thrustPower = Math.max(0, Math.min(2.0, this.thrustPower)); // Limitar entre 0 e 200%
            
            // Aplicar empuxo vertical
            const thrustForce = this.thrustPower * this.data.hoverThrust;
            this.velocity.y += (thrustForce - gravity) * deltaTime / this.data.mass;
            
            // === RESISTÊNCIA AO VENTO E ESTABILIZAÇÃO ===
            
            // Aplicar resistência ao vento para estabilização horizontal
            if (Math.abs(this.targetForwardSpeed) < 0.1 && Math.abs(this.targetStrafeSpeed) < 0.1) {
                // Sem entrada de movimento - aplicar estabilização
                this.velocity.x *= Math.pow(this.data.windResistance, deltaTime);
                this.velocity.z *= Math.pow(this.data.windResistance, deltaTime);
            }
            
        } else {
            // === DRONE DESLIGADO - APLICAR GRAVIDADE ===
            this.thrustPower = 0;
            this.targetThrust = 0;
            this.isHovering = false;
            
            // Aplicar gravidade
            this.velocity.y -= 9.8 * deltaTime;
        }
        
        // === APLICAR ARRASTO GERAL ===
        this.velocity.multiplyScalar(Math.pow(this.data.drag, deltaTime));
        this.angularVelocity.multiplyScalar(Math.pow(this.data.angularDrag, deltaTime));
        
        // === APLICAR MOVIMENTO ===
        const newPosition = {
            x: position.x + this.velocity.x * deltaTime,
            y: Math.max(0.5, position.y + this.velocity.y * deltaTime), // Evitar ir abaixo do chão
            z: position.z + this.velocity.z * deltaTime
        };
        
        // Parar no chão se necessário
        if (newPosition.y <= 0.5) {
            this.velocity.y = 0;
            newPosition.y = 0.5;
        }
        
        this.el.setAttribute('position', newPosition);
        
        // Atualizar altura de hover se estiver voando
        if (this.isFlying && !this.isHovering) {
            this.hoverHeight = newPosition.y;
        }
    },

    applyDrag: function () {
        this.velocity.multiplyScalar(this.data.drag);
        this.angularVelocity.multiplyScalar(this.data.angularDrag);
    },

    // === UTILITÁRIOS ===

    applyDeadzone: function (value) {
        return Math.abs(value) < this.data.deadzone ? 0 : value;
    },

    hasKeyboardInput: function () {
        return this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || 
               this.keys['KeyD'] || this.keys['KeyQ'] || this.keys['KeyE'] ||
               this.keys['ArrowUp'] || this.keys['ArrowDown'] || 
               this.keys['ArrowLeft'] || this.keys['ArrowRight'];
    },

    updatePropellerEffects: function (isActive) {
        this.propellers.forEach((prop, index) => {
            if (prop) {
                // Calcular velocidade baseada na potência real das hélices
                let rotationSpeed;
                let opacity;
                
                if (isActive && this.isFlying) {
                    // Velocidade baseada na potência das hélices (0-1 -> 50-1000ms)
                    const thrustFactor = Math.max(0.1, this.thrustPower);
                    rotationSpeed = Math.max(50, 1000 / (thrustFactor * (this.boostMode ? 2 : 1)));
                    
                    // Opacidade baseada na potência
                    opacity = Math.min(0.8, 0.2 + (thrustFactor * 0.4));
                    
                    // Efeito visual de boost
                    if (this.boostMode) {
                        opacity = Math.min(0.9, opacity * 1.5);
                    }
                } else {
                    // Hélices paradas ou em idle
                    rotationSpeed = 2000;
                    opacity = 0.1;
                }
                
                const direction = (index % 2 === 0) ? '3600' : '-3600';
                
                prop.setAttribute('animation', {
                    property: 'rotation',
                    to: `0 ${direction} 0`,
                    loop: true,
                    dur: rotationSpeed
                });
                
                prop.setAttribute('material', 'opacity', opacity);
            }
        });
    },

    // Sistema avançado de animação das hélices
    initPropellerAnimations: function () {
        const propellers = ['prop1', 'prop2', 'prop3', 'prop4'];
        
        propellers.forEach((propId, index) => {
            const propeller = document.querySelector(`#${propId}`);
            if (propeller) {
                // Configurar propriedades iniciais
                propeller.setAttribute('material', {
                    color: '#ff4444',
                    transparent: true,
                    opacity: 0.3,
                    metalness: 0.1,
                    roughness: 0.9
                });
                
                // Adicionar efeito de blur quando em alta velocidade
                propeller.setAttribute('geometry', {
                    primitive: 'cylinder',
                    radius: 0.6,
                    height: 0.03,
                    segmentsRadial: 8
                });
                
                // Configurar animação inicial
                const direction = (index % 2 === 0) ? 3600 : -3600;
                propeller.setAttribute('animation', {
                    property: 'rotation',
                    to: `0 ${direction} 0`,
                    loop: true,
                    dur: 100
                });
            }
        });
    },

    // Efeitos visuais avançados das hélices
    updateAdvancedPropellerEffects: function () {
        const propellers = ['prop1', 'prop2', 'prop3', 'prop4'];
        
        propellers.forEach((propId, index) => {
            const propeller = document.querySelector(`#${propId}`);
            if (propeller) {
                let speed = 100;
                let opacity = 0.3;
                let radius = 0.6;
                let color = '#ff4444';
                let thrustFactor = 0; // Definir thrustFactor no escopo correto
                
                if (this.isFlying) {
                    // Cálculos baseados no empuxo
                    thrustFactor = this.thrustPower;
                    speed = Math.max(15, 100 - (thrustFactor * 85));
                    opacity = Math.min(0.9, 0.3 + (thrustFactor * 0.6));
                    
                    // Efeito de blur - hélices ficam maiores e mais transparentes em alta velocidade
                    if (thrustFactor > 0.7) {
                        radius = 0.6 + (thrustFactor - 0.7) * 0.8; // Até 0.84
                        opacity = Math.max(0.2, opacity - (thrustFactor - 0.7) * 0.3);
                        color = '#ff6666'; // Cor mais clara em alta velocidade
                    }
                    
                    if (this.boostMode) {
                        speed = Math.max(8, speed * 0.4);
                        opacity = Math.min(0.95, opacity + 0.15);
                        radius += 0.2;
                        color = '#ff8888'; // Cor ainda mais clara no boost
                    }
                }
                
                // Direção alternada para realismo
                const direction = (index % 2 === 0) ? 3600 : -3600;
                
                // Atualizar geometria para efeito de blur
                propeller.setAttribute('geometry', {
                    primitive: 'cylinder',
                    radius: radius,
                    height: 0.03,
                    segmentsRadial: Math.max(6, Math.min(12, Math.round(8 + thrustFactor * 4)))
                });
                
                // Atualizar material
                propeller.setAttribute('material', {
                    color: color,
                    transparent: true,
                    opacity: opacity,
                    metalness: 0.1,
                    roughness: 0.9
                });
                
                // Atualizar animação
                propeller.setAttribute('animation', {
                    property: 'rotation',
                    to: `0 ${direction} 0`,
                    loop: true,
                    dur: speed,
                    easing: 'linear'
                });
            }
        });
    },

    updateVisualEffects: function () {
        // Atualizar luzes LED baseadas no estado
        const intensity = this.isFlying ? 1.0 : 0.3;
        this.ledElements.forEach(led => {
            if (led) {
                const currentEmissive = led.getAttribute('material').emissive;
                led.setAttribute('material', 'emissiveIntensity', intensity);
            }
        });
    },

    updateHUD: function () {
        const speedElement = document.querySelector('#speed-indicator');
        if (speedElement) {
            const speedKmh = Math.round(this.currentSpeed * 3.6); // Converter para km/h
            const thrustPercent = Math.round(this.thrustPower * 100);
            const position = this.el.getAttribute('position');
            const altitude = Math.round(position.y * 10) / 10; // Uma casa decimal
            
            let statusText = `Velocidade: ${speedKmh} km/h | Altitude: ${altitude}m`;
            
            if (this.isFlying) {
                statusText += ` | Empuxo: ${thrustPercent}%`;
                if (this.isHovering) {
                    statusText += ` | HOVER`;
                }
                if (this.boostMode) {
                    statusText += ` | BOOST`;
                }
            } else {
                statusText += ` | DESLIGADO`;
            }
            
            speedElement.setAttribute('value', statusText);
        }
    },

    resetDronePosition: function () {
        console.log('🔄 Resetando posição do drone...');
        this.el.setAttribute('position', '0 3 0');
        this.el.setAttribute('rotation', '0 0 0');
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
    },

    emergencyStop: function () {
        console.log('🚨 Parada de emergência!');
        this.isFlying = false;
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.updatePropellerEffects(false);
        this.updateAudioFeedback(new THREE.Vector3(0, 0, 0));
    }
});

} // fecha o registerComponent

console.log('📦 Módulo drone-controller.js carregado com sucesso!');