/**
 * Sistema de Monitoramento de Performance para VR Drone Game
 * Monitora FPS, uso de memória e otimiza automaticamente a qualidade gráfica
 */

// Registrar componente de monitoramento de performance
AFRAME.registerComponent('performance-monitor', {
    schema: {
        targetFPS: { type: 'number', default: 60 },
        minFPS: { type: 'number', default: 45 },
        maxFPS: { type: 'number', default: 90 },
        monitorInterval: { type: 'number', default: 1000 }, // ms
        autoOptimize: { type: 'boolean', default: true },
        showStats: { type: 'boolean', default: true }
    },

    init() {
        console.log('📊 Inicializando monitor de performance...');
        
        this.performanceData = {
            fps: 0,
            frameTime: 0,
            memory: 0,
            drawCalls: 0,
            triangles: 0,
            lastFrameTime: performance.now(),
            frameCount: 0,
            fpsHistory: [],
            qualityLevel: 'high' // high, medium, low
        };

        this.optimizationSettings = {
            high: {
                shadowMapSize: 2048,
                fogFar: 200,
                lodDistance: 80,
                particleCount: 100
            },
            medium: {
                shadowMapSize: 1024,
                fogFar: 150,
                lodDistance: 60,
                particleCount: 50
            },
            low: {
                shadowMapSize: 512,
                fogFar: 100,
                lodDistance: 40,
                particleCount: 25
            }
        };

        this.setupPerformanceMonitoring();
        this.createStatsDisplay();
        this.startMonitoring();
    },

    setupPerformanceMonitoring() {
        // Configurar monitoramento de FPS
        this.fpsCounter = {
            startTime: performance.now(),
            frameCount: 0
        };

        // Hook no loop de renderização
        this.originalRender = this.el.sceneEl.renderer.render;
        this.el.sceneEl.renderer.render = (scene, camera) => {
            this.updatePerformanceMetrics();
            this.originalRender.call(this.el.sceneEl.renderer, scene, camera);
        };
    },

    updatePerformanceMetrics() {
        const now = performance.now();
        const deltaTime = now - this.performanceData.lastFrameTime;
        
        this.performanceData.frameTime = deltaTime;
        this.performanceData.lastFrameTime = now;
        this.fpsCounter.frameCount++;

        // Calcular FPS a cada segundo
        if (now - this.fpsCounter.startTime >= 1000) {
            this.performanceData.fps = Math.round(
                (this.fpsCounter.frameCount * 1000) / (now - this.fpsCounter.startTime)
            );
            
            this.performanceData.fpsHistory.push(this.performanceData.fps);
            if (this.performanceData.fpsHistory.length > 10) {
                this.performanceData.fpsHistory.shift();
            }

            this.fpsCounter.frameCount = 0;
            this.fpsCounter.startTime = now;
        }

        // Obter informações do renderer
        const renderer = this.el.sceneEl.renderer;
        if (renderer.info) {
            this.performanceData.drawCalls = renderer.info.render.calls;
            this.performanceData.triangles = renderer.info.render.triangles;
        }

        // Obter uso de memória (se disponível)
        if (performance.memory) {
            this.performanceData.memory = Math.round(
                performance.memory.usedJSHeapSize / 1024 / 1024
            );
        }
    },

    createStatsDisplay() {
        if (!this.data.showStats) return;

        // Criar painel de estatísticas
        this.statsPanel = document.createElement('div');
        this.statsPanel.id = 'performance-stats';
        this.statsPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 1000;
            min-width: 200px;
        `;

        document.body.appendChild(this.statsPanel);
    },

    updateStatsDisplay() {
        if (!this.statsPanel) return;

        const avgFPS = this.performanceData.fpsHistory.length > 0 
            ? Math.round(this.performanceData.fpsHistory.reduce((a, b) => a + b, 0) / this.performanceData.fpsHistory.length)
            : 0;

        const fpsColor = this.performanceData.fps >= this.data.targetFPS ? '#00ff00' : 
                        this.performanceData.fps >= this.data.minFPS ? '#ffff00' : '#ff0000';

        this.statsPanel.innerHTML = `
            <div style="color: ${fpsColor}; font-weight: bold;">
                FPS: ${this.performanceData.fps} (avg: ${avgFPS})
            </div>
            <div>Frame Time: ${this.performanceData.frameTime.toFixed(2)}ms</div>
            <div>Memory: ${this.performanceData.memory}MB</div>
            <div>Draw Calls: ${this.performanceData.drawCalls}</div>
            <div>Triangles: ${this.performanceData.triangles}</div>
            <div>Quality: ${this.performanceData.qualityLevel.toUpperCase()}</div>
            <div style="margin-top: 5px; font-size: 10px;">
                Target: ${this.data.targetFPS} FPS
            </div>
        `;
    },

    startMonitoring() {
        this.monitorInterval = setInterval(() => {
            this.updateStatsDisplay();
            
            if (this.data.autoOptimize) {
                this.autoOptimizePerformance();
            }
        }, this.data.monitorInterval);
    },

    autoOptimizePerformance() {
        const avgFPS = this.performanceData.fpsHistory.length > 0 
            ? this.performanceData.fpsHistory.reduce((a, b) => a + b, 0) / this.performanceData.fpsHistory.length
            : this.performanceData.fps;

        let newQualityLevel = this.performanceData.qualityLevel;

        // Diminuir qualidade se FPS estiver baixo
        if (avgFPS < this.data.minFPS) {
            if (this.performanceData.qualityLevel === 'high') {
                newQualityLevel = 'medium';
            } else if (this.performanceData.qualityLevel === 'medium') {
                newQualityLevel = 'low';
            }
        }
        // Aumentar qualidade se FPS estiver alto
        else if (avgFPS > this.data.targetFPS + 10) {
            if (this.performanceData.qualityLevel === 'low') {
                newQualityLevel = 'medium';
            } else if (this.performanceData.qualityLevel === 'medium') {
                newQualityLevel = 'high';
            }
        }

        if (newQualityLevel !== this.performanceData.qualityLevel) {
            this.applyQualitySettings(newQualityLevel);
            this.performanceData.qualityLevel = newQualityLevel;
            console.log(`🎮 Qualidade ajustada para: ${newQualityLevel} (FPS: ${avgFPS})`);
        }
    },

    applyQualitySettings(qualityLevel) {
        const settings = this.optimizationSettings[qualityLevel];
        
        // Ajustar fog
        const scene = this.el.sceneEl;
        if (scene.getAttribute('fog')) {
            scene.setAttribute('fog', `far: ${settings.fogFar}`);
        }

        // Ajustar sistema de LOD
        const urbanEnvironment = scene.components['urban-environment'];
        if (urbanEnvironment && urbanEnvironment.lodSystem) {
            urbanEnvironment.lodSystem.maxDistance = settings.lodDistance;
        }

        // Emitir evento para outros sistemas
        this.el.emit('quality-changed', {
            level: qualityLevel,
            settings: settings
        });
    },

    // Métodos públicos para controle manual
    setQuality(level) {
        if (this.optimizationSettings[level]) {
            this.applyQualitySettings(level);
            this.performanceData.qualityLevel = level;
        }
    },

    getPerformanceData() {
        return { ...this.performanceData };
    },

    toggleStats() {
        if (this.statsPanel) {
            this.statsPanel.style.display = 
                this.statsPanel.style.display === 'none' ? 'block' : 'none';
        }
    },

    remove() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        if (this.statsPanel) {
            document.body.removeChild(this.statsPanel);
        }

        // Restaurar render original
        if (this.originalRender) {
            this.el.sceneEl.renderer.render = this.originalRender;
        }
    }
});

// Utilitários de performance
window.PerformanceUtils = {
    // Throttle para funções custosas
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Debounce para eventos frequentes
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Pool de objetos para reutilização
    createObjectPool(createFn, resetFn, initialSize = 10) {
        const pool = [];
        
        // Pré-popular o pool
        for (let i = 0; i < initialSize; i++) {
            pool.push(createFn());
        }
        
        return {
            get() {
                return pool.length > 0 ? pool.pop() : createFn();
            },
            
            release(obj) {
                if (resetFn) resetFn(obj);
                pool.push(obj);
            },
            
            size() {
                return pool.length;
            }
        };
    }
};

console.log('📦 Módulo performance-monitor.js carregado com sucesso!');