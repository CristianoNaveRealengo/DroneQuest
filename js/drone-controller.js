/**
 * Controlador do Drone para Meta Quest 3
 * Sistema avançado de controle com física realista e suporte a VR
 */

AFRAME.registerComponent('drone-controller', {
    schema: {
        // Configurações de movimento
        maxSpeed: { type: 'number', default: 15 },
        acceleration: { type: 'number', default: 8 },
        rotationSpeed: { type: 'number', default: 2 },
        
        // Configurações de física
        mass: { type: 'number', default: 2 },
        drag: { type: 'number', default: 0.98 },
        angularDrag: { type: 'number', default: 0.95 },
        
        // Configurações de estabilização
        stabilization: { type: 'number', default: 0.1 },
        autoLevel: { type: 'boolean', default: true },
        
        // Configurações de controle
        deadzone: { type: 'number', default: 0.1 },
        sensitivity: { type: 'number', default: 1.0 }
    },

    init: function () {
        console.log('🚁 Inicializando controlador do drone...');
        
        // Vetores de movimento e rotação
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.targetRotation = new THREE.Euler();
        
        // Estado do drone
        this.isFlying = false;
        this.currentSpeed = 0;
        this.batteryLevel = 100;
        
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
            <div>WASD - Movimento</div>
            <div>QE - Subir/Descer</div>
            <div>Setas - Rotação</div>
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
        // Sistema de áudio para feedback do drone
        this.audioContext = null;
        this.motorSound = null;
        this.lastMovementIntensity = 0;
        
        // Configurar áudio se disponível
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
            this.setupMotorSound();
        }
    },

    setupMotorSound: function () {
        // Criar oscilador para som do motor
        if (this.audioContext) {
            this.motorOscillator = this.audioContext.createOscillator();
            this.motorGain = this.audioContext.createGain();
            
            this.motorOscillator.type = 'sawtooth';
            this.motorOscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            this.motorGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            
            this.motorOscillator.connect(this.motorGain);
            this.motorGain.connect(this.audioContext.destination);
            
            this.motorOscillator.start();
        }
    },

    updateAudioFeedback: function (movementVector) {
        if (!this.audioContext || !this.motorGain) return;
        
        const movementIntensity = movementVector.length();
        const baseFrequency = this.isFlying ? 150 : 50;
        const maxFrequency = this.boostMode ? 300 : 200;
        
        // Calcular frequência baseada na intensidade do movimento
        const targetFrequency = baseFrequency + (movementIntensity * 50);
        const clampedFrequency = Math.min(targetFrequency, maxFrequency);
        
        // Calcular volume baseado no estado do drone
        const targetVolume = this.isFlying ? Math.min(0.3, movementIntensity * 0.1 + 0.1) : 0;
        
        // Aplicar mudanças suaves
        const currentTime = this.audioContext.currentTime;
        this.motorOscillator.frequency.linearRampToValueAtTime(clampedFrequency, currentTime + 0.1);
        this.motorGain.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.1);
        
        this.lastMovementIntensity = movementIntensity;
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
                case 'KeyR':
                    this.resetDronePosition();
                    break;
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
        if (!this.isFlying && !this.hasKeyboardInput()) {
            this.applyGravityAndDrag();
            return;
        }

        // Processar entrada de controles
        this.processControlInput();
        
        // Aplicar movimento
        this.applyMovement(timeDelta);
        
        // Aplicar rotação
        this.applyRotation(timeDelta);
        
        // Atualizar efeitos visuais
        this.updateVisualEffects();
        
        // Atualizar HUD
        this.updateHUD();
        
        // Aplicar arrasto
        this.applyDrag();
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
        
        // Movimento WASD
        if (this.keys['KeyW']) this.targetForwardSpeed = speed;
        if (this.keys['KeyS']) this.targetForwardSpeed = -speed;
        if (this.keys['KeyA']) this.targetStrafeSpeed = -speed;
        if (this.keys['KeyD']) this.targetStrafeSpeed = speed;
        
        // Altitude QE
        if (this.keys['KeyQ']) this.targetAltitudeChange = -speed * 0.3;
        if (this.keys['KeyE']) this.targetAltitudeChange = speed * 0.3;
        
        // Rotação com setas
        if (this.keys['ArrowLeft']) this.targetYawRotation = this.data.rotationSpeed;
        if (this.keys['ArrowRight']) this.targetYawRotation = -this.data.rotationSpeed;
        if (this.keys['ArrowUp']) this.targetPitchRotation = this.data.rotationSpeed;
        if (this.keys['ArrowDown']) this.targetPitchRotation = -this.data.rotationSpeed;
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
        
        // Auto-nivelamento
        if (this.data.autoLevel) {
            this.angularVelocity.x -= rotation.x * this.data.stabilization * deltaTime;
            this.angularVelocity.z -= rotation.z * this.data.stabilization * deltaTime;
        }
        
        // Aplicar rotação
        const newRotation = {
            x: rotation.x + THREE.MathUtils.radToDeg(this.angularVelocity.x * deltaTime),
            y: rotation.y + THREE.MathUtils.radToDeg(this.angularVelocity.y * deltaTime),
            z: rotation.z + THREE.MathUtils.radToDeg(this.angularVelocity.z * deltaTime)
        };
        
        this.el.setAttribute('rotation', newRotation);
    },

    applyGravityAndDrag: function () {
        // Aplicar gravidade quando não está voando
        this.velocity.y -= 9.8 * 0.016; // Gravidade
        this.velocity.multiplyScalar(0.95); // Arrasto
        this.angularVelocity.multiplyScalar(0.9); // Arrasto angular
        
        // Aplicar movimento gravitacional
        const position = this.el.getAttribute('position');
        const newY = Math.max(0.5, position.y + this.velocity.y * 0.016);
        
        if (newY <= 0.5) {
            this.velocity.y = 0; // Parar no chão
        }
        
        this.el.setAttribute('position', {
            x: position.x + this.velocity.x * 0.016,
            y: newY,
            z: position.z + this.velocity.z * 0.016
        });
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
                const speed = isActive ? (this.boostMode ? 50 : 100) : 1000;
                const direction = (index % 2 === 0) ? '3600' : '-3600';
                
                prop.setAttribute('animation', {
                    property: 'rotation',
                    to: `0 ${direction} 0`,
                    loop: true,
                    dur: speed
                });
                
                // Ajustar opacidade baseada na velocidade
                const opacity = isActive ? (this.boostMode ? 0.6 : 0.4) : 0.1;
                prop.setAttribute('material', 'opacity', opacity);
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
            speedElement.setAttribute('value', `Velocidade: ${speedKmh} km/h`);
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

console.log('📦 Módulo drone-controller.js carregado com sucesso!');