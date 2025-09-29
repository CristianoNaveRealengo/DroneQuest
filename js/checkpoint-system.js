/**
 * Sistema de Checkpoints para Drone Racing VR
 * Gerencia detecção de colisão, feedback visual e progressão do jogo
 */

if (!AFRAME.components.checkpoint) {
    AFRAME.registerComponent('checkpoint', {
    schema: {
        id: { type: 'number', default: 1 },
        activated: { type: 'boolean', default: false },
        required: { type: 'boolean', default: true },
        points: { type: 'number', default: 100 },
        timeBonus: { type: 'number', default: 5 } // segundos de bônus
    },

    init: function () {
        console.log(`🎯 Inicializando checkpoint ${this.data.id}...`);
        
        // Estado do checkpoint
        this.isActivated = false;
        this.glowEffect = null;
        this.particleSystem = null;
        
        // Configurar detecção de colisão
        this.setupCollisionDetection();
        
        // Configurar efeitos visuais
        this.setupVisualEffects();
        
        // Configurar áudio
        this.setupAudio();
        
        // Usar apenas detecção por proximidade (sem física)
        
        console.log(`✅ Checkpoint ${this.data.id} configurado!`);
    },

    setupCollisionDetection: function () {
        // Usar detecção por proximidade
        this.proximityCheck = setInterval(() => {
            this.checkProximity();
        }, 100);
    },

    setupVisualEffects: function () {
        // Efeito de brilho pulsante
        this.el.setAttribute('animation__pulse', {
            property: 'scale',
            to: '1.1 1.1 1.1',
            dur: 2000,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
        
        // Efeito de rotação
        this.el.setAttribute('animation__rotate', {
            property: 'rotation',
            to: '0 360 0',
            dur: 6000,
            loop: true,
            easing: 'linear'
        });
        
        // Adicionar partículas ao redor do checkpoint
        this.createParticleEffect();
    },

    createParticleEffect: function () {
        // Criar sistema de partículas simples
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('a-sphere');
            const angle = (i / 8) * Math.PI * 2;
            const radius = 5;
            
            particle.setAttribute('geometry', {
                radius: 0.1
            });
            
            particle.setAttribute('material', {
                color: '#00ff00',
                emissive: '#004400',
                transparent: true,
                opacity: 0.6
            });
            
            particle.setAttribute('position', {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle * 2) * 2,
                z: Math.sin(angle) * radius
            });
            
            particle.setAttribute('animation', {
                property: 'position',
                to: `${Math.cos(angle + Math.PI) * radius} ${Math.sin((angle + Math.PI) * 2) * 2} ${Math.sin(angle + Math.PI) * radius}`,
                dur: 4000,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });
            
            this.el.appendChild(particle);
        }
    },

    setupAudio: function () {
        // Sistema de áudio será usado via audio-system
        this.audioSystem = null;
    },

    onCollision: function (evt) {
        const collidedEntity = evt.detail.target;
        
        // Verificar se é o drone que colidiu
        if (collidedEntity && collidedEntity.id === 'drone' && !this.isActivated) {
            this.activateCheckpoint();
        }
    },

    checkProximity: function () {
        if (this.isActivated) return;
        
        const drone = document.querySelector('#drone');
        if (!drone) return;
        
        const dronePosition = drone.getAttribute('position');
        const checkpointPosition = this.el.getAttribute('position');
        
        // Calcular distância
        const distance = this.calculateDistance(dronePosition, checkpointPosition);
        
        // Ativar se estiver próximo o suficiente
        if (distance < 4) { // 4 metros de raio
            this.activateCheckpoint();
        }
        
        // Efeito de proximidade
        this.updateProximityEffect(distance);
    },

    calculateDistance: function (pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    updateProximityEffect: function (distance) {
        // Aumentar brilho conforme o drone se aproxima
        const maxDistance = 15;
        const intensity = Math.max(0, 1 - (distance / maxDistance));
        
        this.el.setAttribute('material', {
            emissiveIntensity: intensity * 0.5
        });
    },

    activateCheckpoint: function () {
        if (this.isActivated) return;
        
        console.log(`🎯 Checkpoint ${this.data.id} ativado!`);
        this.isActivated = true;
        this.data.activated = true;
        
        // Parar verificação de proximidade
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
        
        // Efeitos visuais de ativação
        this.playActivationEffects();
        
        // Tocar som
        this.playActivationSound();
        
        // Adicionar pontos ao jogador
        this.addPoints();
        
        // Notificar o sistema de jogo
        this.notifyGameManager();
        
        // Feedback háptico (se disponível)
        this.triggerHapticFeedback();
    },

    playActivationEffects: function () {
        // Mudar cor para dourado
        this.el.setAttribute('material', {
            color: '#ffd700',
            emissive: '#ffaa00',
            emissiveIntensity: 0.8
        });
        
        // Efeito de explosão de escala
        this.el.setAttribute('animation__activation', {
            property: 'scale',
            from: '1 1 1',
            to: '1.5 1.5 1.5',
            dur: 300,
            dir: 'alternate',
            loop: 2,
            easing: 'easeOutElastic'
        });
        
        // Criar efeito de partículas de celebração
        this.createCelebrationParticles();
        
        // Adicionar texto flutuante
        this.createFloatingText();
    },

    createCelebrationParticles: function () {
        const position = this.el.getAttribute('position');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('a-sphere');
            
            particle.setAttribute('geometry', {
                radius: 0.05
            });
            
            particle.setAttribute('material', {
                color: '#ffd700',
                emissive: '#ffaa00'
            });
            
            const randomX = (Math.random() - 0.5) * 10;
            const randomY = Math.random() * 8 + 2;
            const randomZ = (Math.random() - 0.5) * 10;
            
            particle.setAttribute('position', {
                x: position.x,
                y: position.y,
                z: position.z
            });
            
            particle.setAttribute('animation', {
                property: 'position',
                to: `${position.x + randomX} ${position.y + randomY} ${position.z + randomZ}`,
                dur: 2000,
                easing: 'easeOutQuad'
            });
            
            particle.setAttribute('animation__fade', {
                property: 'material.opacity',
                from: 1,
                to: 0,
                dur: 2000,
                easing: 'easeOutQuad'
            });
            
            this.el.sceneEl.appendChild(particle);
            
            // Remover partícula após animação
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2100);
        }
    },

    createFloatingText: function () {
        const position = this.el.getAttribute('position');
        const floatingText = document.createElement('a-text');
        
        floatingText.setAttribute('value', `CHECKPOINT ${this.data.id}\n+${this.data.points} PONTOS`);
        floatingText.setAttribute('color', '#ffd700');
        floatingText.setAttribute('scale', '3 3 3');
        floatingText.setAttribute('align', 'center');
        floatingText.setAttribute('position', {
            x: position.x,
            y: position.y + 2,
            z: position.z
        });
        
        floatingText.setAttribute('animation', {
            property: 'position',
            to: `${position.x} ${position.y + 6} ${position.z}`,
            dur: 3000,
            easing: 'easeOutQuad'
        });
        
        floatingText.setAttribute('animation__fade', {
            property: 'material.opacity',
            from: 1,
            to: 0,
            dur: 3000,
            delay: 1000,
            easing: 'easeOutQuad'
        });
        
        this.el.sceneEl.appendChild(floatingText);
        
        // Remover texto após animação
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 4100);
    },

    playActivationSound: function () {
        // Usar o sistema de áudio principal
        if (!this.audioSystem) {
            this.audioSystem = this.el.sceneEl.components['audio-system'];
        }
        
        if (this.audioSystem && this.audioSystem.createTone) {
            // Som de checkpoint: tom agudo e alegre (800Hz por 300ms)
            this.audioSystem.createTone(800, 300, 0.3);
        } else {
            // Som sintético como fallback
            this.playSyntheticSound();
        }
    },

    playSyntheticSound: function () {
        // Criar som sintético usando Web Audio API
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (AudioContext || webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    },

    notifyGameManager: function () {
        // Emitir evento de áudio
        this.el.sceneEl.emit('checkpoint-reached', {
            id: this.data.id,
            points: this.data.points,
            timeBonus: this.data.timeBonus,
            position: this.el.getAttribute('position')
        });
        
        // Emitir evento para o game manager
        this.el.emit('checkpoint-reached', {
            id: this.data.id,
            points: this.data.points,
            timeBonus: this.data.timeBonus,
            position: this.el.getAttribute('position')
        });
    },

    triggerHapticFeedback: function () {
        // Feedback háptico para controles VR
        const leftController = document.querySelector('#leftHand');
        const rightController = document.querySelector('#rightHand');
        
        if (leftController && leftController.components['haptics']) {
            leftController.components.haptics.pulse(0.8, 200);
        }
        
        if (rightController && rightController.components['haptics']) {
            rightController.components.haptics.pulse(0.8, 200);
        }
    },

    // Método para resetar checkpoint (útil para reiniciar o jogo)
    reset: function () {
        console.log(`🔄 Resetando checkpoint ${this.data.id}...`);
        
        this.isActivated = false;
        this.data.activated = false;
        
        // Restaurar cor original
        this.el.setAttribute('material', {
            color: '#00ff00',
            emissive: '#002200',
            emissiveIntensity: 0.3
        });
        
        // Reiniciar verificação de proximidade
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
        
        this.proximityCheck = setInterval(() => {
            this.checkProximity();
        }, 100);
    },

    remove: function () {
        // Limpeza ao remover componente
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
    }
});
}

// Componente para linha de chegada
if (!AFRAME.components['finish-line']) {
    AFRAME.registerComponent('finish-line', {
    init: function () {
        console.log('🏁 Configurando linha de chegada...');
        
        // Usar detecção por proximidade
        this.proximityCheck = setInterval(() => {
            this.checkFinishProximity();
        }, 100);
        
        // Efeito visual da linha de chegada
        this.el.setAttribute('animation', {
            property: 'material.opacity',
            from: 0.7,
            to: 0.3,
            dur: 1000,
            dir: 'alternate',
            loop: true
        });
    },

    checkFinishProximity: function () {
        const drone = document.querySelector('#drone');
        if (!drone) return;
        
        const dronePosition = drone.getAttribute('position');
        const finishPosition = this.el.getAttribute('position');
        
        // Calcular distância
        const dx = dronePosition.x - finishPosition.x;
        const dy = dronePosition.y - finishPosition.y;
        const dz = dronePosition.z - finishPosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Ativar se estiver próximo o suficiente
        if (distance < 5) { // 5 metros de raio
            this.onFinish();
        }
    },

    onFinish: function () {
        console.log('🏁 Drone cruzou a linha de chegada!');
        
        // Parar verificação
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
        
        this.el.sceneEl.emit('race-finished', {
            position: this.el.getAttribute('position'),
            time: Date.now()
        });
    },

    addPoints: function () {
        // Calcular pontos baseado no checkpoint e tempo
        let points = this.data.points;
        
        // Bônus por velocidade (se passou rapidamente)
        const gameManager = document.querySelector('[game-manager]');
        if (gameManager && gameManager.components['game-manager']) {
            const manager = gameManager.components['game-manager'];
            
            // Adicionar pontos ao score total
            if (manager.addScore) {
                manager.addScore(points);
            }
            
            // Mostrar pontos na tela
            this.showPointsDisplay(points);
        }
        
        console.log(`💰 +${points} pontos pelo checkpoint ${this.data.id}!`);
    },

    showPointsDisplay: function (points) {
        // Criar display de pontos flutuante
        const pointsDisplay = document.createElement('a-text');
        const position = this.el.getAttribute('position');
        
        pointsDisplay.setAttribute('value', `+${points} pts`);
        pointsDisplay.setAttribute('position', {
            x: position.x,
            y: position.y + 2,
            z: position.z
        });
        pointsDisplay.setAttribute('align', 'center');
        pointsDisplay.setAttribute('color', '#00ff00');
        pointsDisplay.setAttribute('scale', '3 3 3');
        
        // Animação de subida e fade
        pointsDisplay.setAttribute('animation', {
            property: 'position',
            to: `${position.x} ${position.y + 8} ${position.z}`,
            dur: 2000,
            easing: 'easeOutQuad'
        });
        
        pointsDisplay.setAttribute('animation__fade', {
            property: 'material.opacity',
            from: 1,
            to: 0,
            dur: 2000,
            delay: 500,
            easing: 'easeOutQuad'
        });
        
        this.el.sceneEl.appendChild(pointsDisplay);
        
        // Remover após animação
        setTimeout(() => {
            if (pointsDisplay.parentNode) {
                pointsDisplay.parentNode.removeChild(pointsDisplay);
            }
        }, 2500);
    },

    reset: function () {
        console.log(`🔄 Resetando checkpoint ${this.data.id}...`);
        
        // Resetar estado
        this.isActivated = false;
        this.data.activated = false;
        
        // Restaurar cor original
        this.el.setAttribute('material', {
            color: '#00ff00',
            emissive: '#004400',
            emissiveIntensity: 0.3
        });
        
        // Remover animação de ativação se existir
        this.el.removeAttribute('animation__activation');
        
        // Reiniciar verificação de proximidade
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
        this.setupCollisionDetection();
        
        console.log(`✅ Checkpoint ${this.data.id} resetado!`);
    },

    remove: function () {
        if (this.proximityCheck) {
            clearInterval(this.proximityCheck);
        }
     }
    });
}

console.log('📦 Módulo checkpoint-system.js carregado com sucesso!');