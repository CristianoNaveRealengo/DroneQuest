/**
 * Gerenciador Principal do Jogo de Corrida de Drone VR
 * Controla timer, pontuação, UI, estado do jogo e progressão
 */

AFRAME.registerComponent('game-manager', {
    schema: {
        totalCheckpoints: { type: 'number', default: 5 },
        timeLimit: { type: 'number', default: 300 }, // 5 minutos em segundos
        bestTime: { type: 'number', default: 0 }
    },

    init: function () {
        console.log('🎮 Inicializando Game Manager...');
        
        // Estado do jogo
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            isFinished: false,
            startTime: 0,
            currentTime: 0,
            elapsedTime: 0,
            score: 0,
            checkpointsReached: 0,
            currentLap: 1,
            totalLaps: 3,
            bestLapTime: 0,
            currentLapStartTime: 0
        };
        
        // Elementos da UI
        this.uiElements = {};
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Configurar UI
        this.setupUI();
        
        // Configurar controles de debug
        this.setupDebugControls();
        
        // Inicializar sistema de save/load
        this.setupPersistence();
        
        console.log('✅ Game Manager inicializado!');
    },

    setupEventListeners: function () {
        // Eventos de checkpoint
        this.el.addEventListener('checkpoint-reached', this.onCheckpointReached.bind(this));
        
        // Evento de linha de chegada
        this.el.addEventListener('race-finished', this.onRaceFinished.bind(this));
        
        // Eventos de controle
        this.el.addEventListener('game-start', this.startGame.bind(this));
        this.el.addEventListener('game-pause', this.pauseGame.bind(this));
        this.el.addEventListener('game-reset', this.resetGame.bind(this));
        
        // Eventos de VR
        this.el.addEventListener('enter-vr', this.onEnterVR.bind(this));
        this.el.addEventListener('exit-vr', this.onExitVR.bind(this));
        
        // Eventos de teclado para debug
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    },

    setupUI: function () {
        console.log('🖥️ Configurando interface do usuário...');
        
        // Encontrar elementos da UI
        this.uiElements = {
            timer: document.querySelector('#timer'),
            checkpointCounter: document.querySelector('#checkpoint-counter'),
            speedometer: document.querySelector('#speedometer'),
            score: document.querySelector('#score'),
            lapCounter: document.querySelector('#lap-counter'),
            bestTime: document.querySelector('#best-time')
        };
        
        // Criar elementos de UI se não existirem
        this.createMissingUIElements();
        
        // Configurar UI inicial
        this.updateUI();
        
        // Criar menu principal
        this.createMainMenu();
    },

    createMissingUIElements: function () {
        const hudContainer = document.querySelector('#hud-container') || this.createHUDContainer();
        
        // Criar elementos que não existem
        if (!this.uiElements.score) {
            this.uiElements.score = this.createElement('a-text', {
                id: 'score',
                value: 'PONTOS: 0',
                position: '-2 1.5 -3',
                color: '#00ff00',
                scale: '0.8 0.8 0.8'
            });
            hudContainer.appendChild(this.uiElements.score);
        }
        
        if (!this.uiElements.lapCounter) {
            this.uiElements.lapCounter = this.createElement('a-text', {
                id: 'lap-counter',
                value: 'VOLTA: 1/3',
                position: '2 1.5 -3',
                color: '#ffff00',
                scale: '0.8 0.8 0.8'
            });
            hudContainer.appendChild(this.uiElements.lapCounter);
        }
        
        if (!this.uiElements.bestTime) {
            this.uiElements.bestTime = this.createElement('a-text', {
                id: 'best-time',
                value: 'MELHOR: --:--',
                position: '0 -1.5 -3',
                color: '#ff6600',
                scale: '0.6 0.6 0.6'
            });
            hudContainer.appendChild(this.uiElements.bestTime);
        }
    },

    createHUDContainer: function () {
        const camera = document.querySelector('#drone-camera');
        if (!camera) {
            console.error('❌ Câmera não encontrada! Verificando seletor...');
            return null;
        }
        const hudContainer = this.createElement('a-entity', {
            id: 'hud-container'
        });
        camera.appendChild(hudContainer);
        return hudContainer;
    },

    createElement: function (tagName, attributes) {
        const element = document.createElement(tagName);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    },

    createMainMenu: function () {
        // Menu principal para VR
        const menuContainer = this.createElement('a-entity', {
            id: 'main-menu',
            position: '0 2 -4',
            visible: true
        });
        
        // Título do jogo
        const title = this.createElement('a-text', {
            value: 'DRONE RACING VR',
            position: '0 1 0',
            color: '#00ffff',
            scale: '2 2 2',
            align: 'center'
        });
        
        // Botão iniciar
        const startButton = this.createElement('a-box', {
            id: 'start-button',
            position: '0 0 0',
            width: '2',
            height: '0.5',
            depth: '0.1',
            color: '#00ff00',
            class: 'clickable'
        });
        
        const startText = this.createElement('a-text', {
            value: 'INICIAR CORRIDA',
            position: '0 0 0.06',
            color: '#000000',
            scale: '0.8 0.8 0.8',
            align: 'center'
        });
        
        // Botão configurações
        const settingsButton = this.createElement('a-box', {
            id: 'settings-button',
            position: '0 -0.8 0',
            width: '2',
            height: '0.5',
            depth: '0.1',
            color: '#ffaa00',
            class: 'clickable'
        });
        
        const settingsText = this.createElement('a-text', {
            value: 'CONFIGURAÇÕES',
            position: '0 0 0.06',
            color: '#000000',
            scale: '0.8 0.8 0.8',
            align: 'center'
        });
        
        // Montar menu
        startButton.appendChild(startText);
        settingsButton.appendChild(settingsText);
        menuContainer.appendChild(title);
        menuContainer.appendChild(startButton);
        menuContainer.appendChild(settingsButton);
        
        // Adicionar eventos de clique
        startButton.addEventListener('click', () => {
            this.hideMainMenu();
            this.startGame();
        });
        
        this.el.appendChild(menuContainer);
        this.mainMenu = menuContainer;
    },

    setupDebugControls: function () {
        // Controles de debug para desenvolvimento
        this.debugMode = false;
        this.debugPanel = null;
    },

    setupPersistence: function () {
        // Carregar dados salvos
        this.loadGameData();
    },

    // === CONTROLE DO JOGO ===
    
    startGame: function () {
        console.log('🚀 Iniciando corrida...');
        
        if (this.gameState.isPlaying) return;
        
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        this.gameState.isFinished = false;
        this.gameState.startTime = Date.now();
        this.gameState.currentLapStartTime = Date.now();
        this.gameState.elapsedTime = 0;
        this.gameState.score = 0;
        this.gameState.checkpointsReached = 0;
        this.gameState.currentLap = 1;
        
        // Resetar checkpoints
        this.resetAllCheckpoints();
        
        // Iniciar timer
        this.startTimer();
        
        // Habilitar controles do drone
        this.enableDroneControls();
        
        // Atualizar UI
        this.updateUI();
        
        // Emitir evento
        this.el.emit('game-started');
        
        console.log('✅ Corrida iniciada!');
    },

    pauseGame: function () {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        console.log('⏸️ Pausando jogo...');
        
        this.gameState.isPaused = true;
        this.stopTimer();
        this.disableDroneControls();
        
        // Mostrar menu de pausa
        this.showPauseMenu();
        
        this.el.emit('game-paused');
    },

    resumeGame: function () {
        if (!this.gameState.isPaused) return;
        
        console.log('▶️ Retomando jogo...');
        
        this.gameState.isPaused = false;
        this.gameState.startTime = Date.now() - this.gameState.elapsedTime;
        this.startTimer();
        this.enableDroneControls();
        
        // Esconder menu de pausa
        this.hidePauseMenu();
        
        this.el.emit('game-resumed');
    },

    resetGame: function () {
        console.log('🔄 Resetando jogo...');
        
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;
        this.gameState.isFinished = false;
        this.gameState.elapsedTime = 0;
        this.gameState.score = 0;
        this.gameState.checkpointsReached = 0;
        this.gameState.currentLap = 1;
        
        this.stopTimer();
        this.resetAllCheckpoints();
        this.resetDrone();
        this.updateUI();
        this.showMainMenu();
        
        this.el.emit('game-reset');
    },

    finishGame: function () {
        console.log('🏁 Finalizando corrida...');
        
        this.gameState.isPlaying = false;
        this.gameState.isFinished = true;
        
        this.stopTimer();
        this.disableDroneControls();
        
        // Calcular pontuação final
        this.calculateFinalScore();
        
        // Salvar melhor tempo
        this.saveBestTime();
        
        // Salvar high score
        const isNewRecord = this.isNewHighScore();
        this.saveHighScore();
        
        if (isNewRecord) {
            console.log('🎉 NOVO RECORDE! Parabéns!');
        }
        
        // Mostrar ranking
        this.showHighScores();
        
        // Mostrar tela de resultados
        this.showResultsScreen();
        
        this.el.emit('game-finished', {
            finalScore: this.gameState.score,
            finalTime: this.gameState.elapsedTime,
            checkpointsReached: this.gameState.checkpointsReached
        });
    },

    // === EVENTOS ===
    
    onCheckpointReached: function (evt) {
        const checkpointData = evt.detail;
        
        console.log(`🎯 Checkpoint ${checkpointData.id} alcançado!`);
        
        this.gameState.checkpointsReached++;
        this.gameState.score += checkpointData.points;
        
        // Bônus de tempo
        if (checkpointData.timeBonus) {
            this.gameState.elapsedTime -= checkpointData.timeBonus * 1000;
        }
        
        // Verificar se completou uma volta
        if (this.gameState.checkpointsReached >= this.data.totalCheckpoints) {
            this.completeLap();
        }
        
        this.updateUI();
        this.saveGameData();
    },

    onCollision: function (type, object) {
        console.log(`💥 Colisão registrada: ${type}`);
        
        // Registrar estatísticas de colisão
        if (!this.gameState.collisions) {
            this.gameState.collisions = 0;
        }
        this.gameState.collisions++;
        
        // Penalidade de pontos por colisão (opcional)
        const penalty = this.getCollisionPenalty(type);
        if (penalty > 0) {
            this.gameState.score = Math.max(0, this.gameState.score - penalty);
            console.log(`⚠️ Penalidade de ${penalty} pontos por colisão!`);
        }
        
        // Atualizar UI
        this.updateUI();
        
        // Emitir evento para outros sistemas
        this.el.emit('collision-registered', {
            type: type,
            object: object,
            totalCollisions: this.gameState.collisions,
            penalty: penalty
        });
    },

    getCollisionPenalty: function (type) {
        // Definir penalidades por tipo de colisão
        switch (type) {
            case 'building': return 50;
            case 'obstacle': return 30;
            case 'boundary': return 20;
            case 'ceiling': return 10;
            case 'ground': return 15;
            default: return 0;
        }
    },

    onRaceFinished: function (evt) {
        // Emitir evento de áudio para vitória
        this.el.sceneEl.emit('race-finished', { result: 'victory' });
        this.finishGame();
    },

    finishRace: function (result) {
        if (result === 'timeout') {
            console.log('⏰ Tempo esgotado!');
            // Emitir evento de áudio para timeout
            this.el.sceneEl.emit('race-finished', { result: 'timeout' });
        }
        this.finishGame();
    },

    completeLap: function () {
        const lapTime = Date.now() - this.gameState.currentLapStartTime;
        
        console.log(`🏁 Volta ${this.gameState.currentLap} completada em ${this.formatTime(lapTime)}!`);
        
        // Verificar melhor tempo da volta
        if (this.gameState.bestLapTime === 0 || lapTime < this.gameState.bestLapTime) {
            this.gameState.bestLapTime = lapTime;
            console.log('🏆 Novo recorde de volta!');
        }
        
        // Próxima volta ou fim da corrida
        if (this.gameState.currentLap < this.gameState.totalLaps) {
            this.gameState.currentLap++;
            this.gameState.currentLapStartTime = Date.now();
            this.gameState.checkpointsReached = 0;
            this.resetAllCheckpoints();
            
            // Mostrar notificação de nova volta
            this.showLapNotification();
        } else {
            // Corrida finalizada
            this.finishGame();
        }
    },

    // === TIMER ===
    
    startTimer: function () {
        this.timerInterval = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.gameState.currentTime = Date.now();
                this.gameState.elapsedTime = this.gameState.currentTime - this.gameState.startTime;
                this.updateTimer();
            }
        }, 100);
    },

    stopTimer: function () {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateTimer: function () {
        if (this.uiElements.timer) {
            this.uiElements.timer.setAttribute('value', this.formatTime(this.gameState.elapsedTime));
        }
    },

    formatTime: function (milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    },

    // === UI ===
    
    updateUI: function () {
        // Atualizar timer
        this.updateTimer();
        
        // Atualizar contador de checkpoints
        if (this.uiElements.checkpointCounter) {
            this.uiElements.checkpointCounter.setAttribute('value', 
                `CHECKPOINT: ${this.gameState.checkpointsReached}/${this.data.totalCheckpoints}`);
        }
        
        // Atualizar pontuação
        if (this.uiElements.score) {
            this.uiElements.score.setAttribute('value', `PONTOS: ${this.gameState.score}`);
        }
        
        // Atualizar contador de voltas
        if (this.uiElements.lapCounter) {
            this.uiElements.lapCounter.setAttribute('value', 
                `VOLTA: ${this.gameState.currentLap}/${this.gameState.totalLaps}`);
        }
        
        // Atualizar melhor tempo
        if (this.uiElements.bestTime && this.data.bestTime > 0) {
            this.uiElements.bestTime.setAttribute('value', 
                `MELHOR: ${this.formatTime(this.data.bestTime)}`);
        }
    },

    hideMainMenu: function () {
        if (this.mainMenu) {
            this.mainMenu.setAttribute('visible', false);
        }
    },

    showMainMenu: function () {
        if (this.mainMenu) {
            this.mainMenu.setAttribute('visible', true);
        }
    },

    // === CONTROLES ===
    
    onKeyDown: function (evt) {
        switch (evt.key.toLowerCase()) {
            case ' ': // Espaço
                if (this.gameState.isPlaying && !this.gameState.isPaused) {
                    this.pauseGame();
                } else if (this.gameState.isPaused) {
                    this.resumeGame();
                }
                break;
            case 'r':
                this.resetGame();
                break;
            case 'enter':
                if (!this.gameState.isPlaying) {
                    this.startGame();
                }
                break;
        }
    },

    // === UTILITÁRIOS ===
    
    resetAllCheckpoints: function () {
        const checkpoints = document.querySelectorAll('[checkpoint]');
        checkpoints.forEach(checkpoint => {
            if (checkpoint.components.checkpoint) {
                checkpoint.components.checkpoint.reset();
            }
        });
    },

    enableDroneControls: function () {
        const drone = document.querySelector('#drone');
        if (drone && drone.components['drone-controller']) {
            drone.components['drone-controller'].enabled = true;
        }
    },

    disableDroneControls: function () {
        const drone = document.querySelector('#drone');
        if (drone && drone.components['drone-controller']) {
            drone.components['drone-controller'].enabled = false;
        }
    },

    resetDrone: function () {
        const drone = document.querySelector('#drone');
        if (drone && drone.components['drone-controller']) {
            drone.components['drone-controller'].resetDrone();
        }
    },

    addScore: function (points) {
        this.gameState.score += points;
        this.updateUI();
        console.log(`💰 Score atualizado: ${this.gameState.score} pontos`);
    },

    calculateFinalScore: function () {
        // Bônus por tempo
        const timeBonus = Math.max(0, (this.data.timeLimit * 1000 - this.gameState.elapsedTime) / 1000);
        this.gameState.score += Math.floor(timeBonus * 10);
        
        // Bônus por voltas completadas
        this.gameState.score += (this.gameState.currentLap - 1) * 1000;
    },

    saveBestTime: function () {
        if (this.gameState.currentLap >= this.gameState.totalLaps) {
            if (this.data.bestTime === 0 || this.gameState.elapsedTime < this.data.bestTime) {
                this.data.bestTime = this.gameState.elapsedTime;
                this.saveGameData();
                console.log('🏆 Novo recorde geral!');
            }
        }
    },

    // === PERSISTÊNCIA ===
    
    saveGameData: function () {
        const gameData = {
            bestTime: this.data.bestTime,
            bestLapTime: this.gameState.bestLapTime,
            totalGames: (this.loadedData?.totalGames || 0) + (this.gameState.isFinished ? 1 : 0)
        };
        
        localStorage.setItem('droneRacingVR', JSON.stringify(gameData));
    },

    loadGameData: function () {
        try {
            const saved = localStorage.getItem('droneRacingVR');
            if (saved) {
                this.loadedData = JSON.parse(saved);
                this.data.bestTime = this.loadedData.bestTime || 0;
                this.gameState.bestLapTime = this.loadedData.bestLapTime || 0;
            }
        } catch (error) {
            console.warn('Erro ao carregar dados salvos:', error);
        }
    },

    // === SISTEMA DE RANKING ===
    
    saveHighScore: function () {
        try {
            // Carregar ranking existente
            let highScores = JSON.parse(localStorage.getItem('droneRacingHighScores') || '[]');
            
            // Adicionar nova pontuação
            const newScore = {
                score: this.gameState.score,
                time: this.gameState.elapsedTime,
                date: new Date().toISOString(),
                checkpoints: this.gameState.checkpointsReached,
                laps: this.gameState.currentLap - 1
            };
            
            highScores.push(newScore);
            
            // Ordenar por pontuação (maior primeiro)
            highScores.sort((a, b) => b.score - a.score);
            
            // Manter apenas top 10
            highScores = highScores.slice(0, 10);
            
            // Salvar ranking atualizado
            localStorage.setItem('droneRacingHighScores', JSON.stringify(highScores));
            
            console.log('🏆 Pontuação salva no ranking!');
            return highScores;
        } catch (error) {
            console.warn('Erro ao salvar ranking:', error);
            return [];
        }
    },

    getHighScores: function () {
        try {
            return JSON.parse(localStorage.getItem('droneRacingHighScores') || '[]');
        } catch (error) {
            console.warn('Erro ao carregar ranking:', error);
            return [];
        }
    },

    showHighScores: function () {
        const highScores = this.getHighScores();
        
        console.log('🏆 === RANKING DE MAIORES PONTUAÇÕES ===');
        highScores.forEach((score, index) => {
            const timeFormatted = this.formatTime(score.time);
            const dateFormatted = new Date(score.date).toLocaleDateString('pt-BR');
            console.log(`${index + 1}º - ${score.score} pts | ${timeFormatted} | ${dateFormatted}`);
        });
        
        return highScores;
    },

    isNewHighScore: function () {
        const highScores = this.getHighScores();
        return highScores.length < 10 || this.gameState.score > highScores[highScores.length - 1].score;
    },

    // === VR ===
    
    onEnterVR: function () {
        console.log('🥽 Entrando no modo VR...');
        // Ajustar UI para VR
    },

    onExitVR: function () {
        console.log('🖥️ Saindo do modo VR...');
        // Ajustar UI para desktop
    }
});

console.log('📦 Módulo game-manager.js carregado com sucesso!');