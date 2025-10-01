// Importar A-Frame e componentes
import 'aframe';
import 'aframe-environment-component';
import 'aframe-extras';

// Importar estilos
import './style.css';

// ===== SISTEMA AVANÇADO DE SUPRESSÃO DE ERROS =====
// Interceptação ultra-robusta para eliminar completamente o erro de message channel

// 1. Interceptar console.error para filtrar mensagens específicas
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  // Lista expandida de padrões de erro para ignorar
  const ignoredPatterns = [
    'A listener indicated an asynchronous response by returning true',
    'message channel closed before a response was received',
    'Extension context invalidated',
    'Could not establish connection',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'edge-extension://',
    'The message port closed before a response was received',
    'Receiving end does not exist'
  ];
  
  const shouldSuppress = ignoredPatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (shouldSuppress) {
    // Completamente silencioso - não mostra nem warning
    return;
  }
  
  // Chamar console.error original para erros legítimos
  originalConsoleError.apply(console, args);
};

// 2. Interceptar window.addEventListener para capturar erros antes que apareçam
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
  if (type === 'error' || type === 'unhandledrejection') {
    // Wrapper que filtra erros antes de passar para o listener original
    const wrappedListener = function(event) {
      const errorMessage = event.message || event.reason?.toString() || '';
      
      const shouldSuppress = [
        'listener indicated an asynchronous response',
        'message channel closed',
        'Extension context invalidated'
      ].some(pattern => errorMessage.includes(pattern));
      
      if (shouldSuppress) {
        event.preventDefault?.();
        event.stopPropagation?.();
        return false;
      }
      
      return listener.call(this, event);
    };
    
    return originalAddEventListener.call(this, type, wrappedListener, options);
  }
  
  return originalAddEventListener.call(this, type, listener, options);
};

// 3. Sistema de tratamento de erros global mais robusto
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';
  const errorStack = event.error?.stack || '';
  
  // Padrões mais específicos para detectar erros de extensão
  const extensionErrorPatterns = [
    'A listener indicated an asynchronous response by returning true',
    'message channel closed before a response was received',
    'Extension context invalidated',
    'chrome-extension',
    'moz-extension',
    'safari-extension',
    'edge-extension'
  ];
  
  const isExtensionError = extensionErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorStack.includes(pattern)
  );
  
  if (isExtensionError) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  
  // Log apenas erros legítimos da aplicação
  console.error('❌ Erro da aplicação:', event.error);
}, true); // Usar capture phase

// 4. Tratamento específico para promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  
  const extensionPromisePatterns = [
    'message channel closed',
    'Extension context invalidated',
    'listener indicated an asynchronous response',
    'Could not establish connection',
    'chrome-extension',
    'moz-extension'
  ];
  
  const isExtensionPromiseError = extensionPromisePatterns.some(pattern => 
    reason.includes(pattern)
  );
  
  if (isExtensionPromiseError) {
    event.preventDefault();
    return false;
  }
  
  console.error('❌ Promise rejeitada da aplicação:', event.reason);
}, true); // Usar capture phase

// 5. Interceptar erros do Chrome Runtime (se existir)
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const originalSendMessage = chrome.runtime.sendMessage;
  chrome.runtime.sendMessage = function(...args) {
    try {
      return originalSendMessage.apply(this, args);
    } catch (error) {
      // Silenciar erros de runtime do Chrome
      return;
    }
  };
}

// 6. Isolamento de contexto para proteger contra extensões
(function() {
  'use strict';
  
  // Criar namespace isolado para a aplicação
  window.FusionReality = window.FusionReality || {};
  
  // Proteger objetos globais críticos
  const protectedGlobals = ['AFRAME', 'THREE'];
  protectedGlobals.forEach(globalName => {
    if (window[globalName]) {
      // Criar referência protegida
      window.FusionReality[globalName] = window[globalName];
      
      // Interceptar tentativas de modificação
      Object.defineProperty(window, globalName, {
        get: () => window.FusionReality[globalName],
        set: (value) => {
          // Permitir apenas se for uma inicialização legítima
          if (!window.FusionReality[globalName]) {
            window.FusionReality[globalName] = value;
          }
        },
        configurable: false
      });
    }
  });
  
  // Proteger contra modificação de protótipos críticos
  const protectedPrototypes = [
    Promise.prototype,
    EventTarget.prototype,
    HTMLElement.prototype
  ];
  
  protectedPrototypes.forEach(proto => {
    if (proto) {
      Object.freeze(proto);
    }
  });
  
  // Detectar e neutralizar extensões problemáticas
  const detectProblematicExtensions = () => {
    const suspiciousGlobals = [
      'chrome',
      'browser',
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__VUE_DEVTOOLS_GLOBAL_HOOK__'
    ];
    
    suspiciousGlobals.forEach(globalName => {
      if (window[globalName] && window[globalName].runtime) {
        // Interceptar métodos problemáticos
        const runtime = window[globalName].runtime;
        if (runtime.sendMessage) {
          const originalMethod = runtime.sendMessage;
          runtime.sendMessage = function(...args) {
            try {
              return originalMethod.apply(this, args);
            } catch (error) {
              // Silenciar completamente
              return Promise.resolve();
            }
          };
        }
      }
    });
  };
  
  // Executar detecção após carregamento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectProblematicExtensions);
  } else {
    detectProblematicExtensions();
  }
  
})();

// 7. Monkey patch para MessageChannel e MessagePort
if (typeof MessageChannel !== 'undefined') {
  const OriginalMessageChannel = MessageChannel;
  window.MessageChannel = function(...args) {
    const channel = new OriginalMessageChannel(...args);
    
    // Interceptar erros nos ports
    ['port1', 'port2'].forEach(portName => {
      const port = channel[portName];
      const originalPostMessage = port.postMessage;
      
      port.postMessage = function(...messageArgs) {
        try {
          return originalPostMessage.apply(this, messageArgs);
        } catch (error) {
          // Silenciar erros de message channel
          return;
        }
      };
    });
    
    return channel;
  };
}

// Registrar componente de teleporte nativo para Meta Quest 3
AFRAME.registerComponent('quest-teleport', {
  schema: {
    cameraRig: { type: 'selector' },
    teleportOrigin: { type: 'selector' },
    button: { type: 'string', default: 'trigger' },
    curveShootingSpeed: { type: 'number', default: 18 },
    landingMaxAngle: { type: 'number', default: 60 },
    collisionEntities: { type: 'string', default: '' }
  },

  init: function () {
    const el = this.el;
    const data = this.data;
    
    this.teleporting = false;
    this.curve = null;
    this.hit = null;
    
    // Criar curva de teleporte
    this.createTeleportCurve();
    
    // Event listeners
    el.addEventListener(data.button + 'down', this.onButtonDown.bind(this));
    el.addEventListener(data.button + 'up', this.onButtonUp.bind(this));
  },

  createTeleportCurve: function () {
    const curveEl = document.createElement('a-entity');
    curveEl.setAttribute('id', 'teleport-curve-' + this.el.id);
    curveEl.setAttribute('line', {
      start: '0 0 0',
      end: '0 0 -5',
      color: '#00ff00',
      opacity: 0.6,
      visible: false
    });
    this.el.appendChild(curveEl);
    this.curve = curveEl;
  },

  onButtonDown: function () {
    if (!this.curve) return;
    this.teleporting = true;
    this.curve.setAttribute('line', 'visible', true);
    this.updateTeleportCurve();
  },

  onButtonUp: function () {
    if (!this.teleporting) return;
    
    this.teleporting = false;
    this.curve.setAttribute('line', 'visible', false);
    
    if (this.hit) {
      this.teleportToPosition(this.hit.point);
    }
  },

  updateTeleportCurve: function () {
    if (!this.teleporting) return;
    
    const el = this.el;
    const data = this.data;
    const direction = new THREE.Vector3(0, 0, -1);
    const raycaster = new THREE.Raycaster();
    
    // Configurar raycaster
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    el.object3D.getWorldPosition(worldPosition);
    el.object3D.getWorldQuaternion(worldQuaternion);
    
    direction.applyQuaternion(worldQuaternion);
    raycaster.set(worldPosition, direction);
    
    // Verificar colisão com o chão
    const scene = el.sceneEl;
    const intersects = raycaster.intersectObjects(scene.object3D.children, true);
    
    if (intersects.length > 0) {
      this.hit = intersects[0];
      const endPoint = this.hit.point;
      
      // Atualizar curva
      this.curve.setAttribute('line', {
        start: '0 0 0',
        end: el.object3D.worldToLocal(endPoint.clone()),
        color: '#00ff00'
      });
    }
    
    if (this.teleporting) {
      requestAnimationFrame(this.updateTeleportCurve.bind(this));
    }
  },

  teleportToPosition: function (position) {
    const data = this.data;
    if (data.cameraRig) {
      const rig = data.cameraRig;
      const currentPosition = rig.getAttribute('position');
      rig.setAttribute('position', {
        x: position.x,
        y: currentPosition.y,
        z: position.z
      });
    }
  }
});

// Registrar componentes customizados para Meta Quest 3
AFRAME.registerComponent('quest-controls', {
  schema: {
    speed: { type: 'number', default: 2.0 },
    fly: { type: 'boolean', default: false },
    rotationSpeed: { type: 'number', default: 1.0 }
  },
  
  init: function () {
    const el = this.el;
    const data = this.data;
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    
    // Configurar movement-controls como fallback para desktop
    el.setAttribute('movement-controls', {
      speed: data.speed,
      fly: data.fly,
      constrainToNavMesh: false,
      camera: '#camera'
    });
    
    // Adicionar controles nativos para VR
    this.setupVRControls();
  },
  
  setupVRControls: function () {
    const el = this.el;
    const camera = el.querySelector('#camera');
    
    if (!camera) return;
    
    // Listener para controles VR
    this.tick = this.tick.bind(this);
    this.debugCounter = 0;
    
    el.sceneEl.addEventListener('enter-vr', () => {
      console.log('🥽 Entrando em VR - Ativando controles Quest 3');
      this.vrMode = true;
      this.debugVRSetup();
    });
    
    el.sceneEl.addEventListener('exit-vr', () => {
      console.log('🖥️ Saindo de VR - Desativando controles Quest 3');
      this.vrMode = false;
    });
  },
   
   debugVRSetup: function () {
     console.log('🔧 Debug VR Setup:');
     console.log('- Left Controller:', document.querySelector('#leftController'));
     console.log('- Right Controller:', document.querySelector('#rightController'));
     
     setTimeout(() => {
       const leftController = document.querySelector('#leftController');
       const rightController = document.querySelector('#rightController');
       
       if (leftController && rightController) {
         console.log('✅ Controles encontrados');
         console.log('- Left Gamepad:', leftController.components['oculus-touch-controls']);
         console.log('- Right Gamepad:', rightController.components['oculus-touch-controls']);
       } else {
         console.log('❌ Controles não encontrados');
       }
     }, 1000);
   },
   
   tick: function (time, timeDelta) {
    if (!this.vrMode) return;
    
    const el = this.el;
    const data = this.data;
    const camera = el.querySelector('#camera');
    
    if (!camera) return;
    
    // Obter controles VR
    const leftController = document.querySelector('#leftController');
    const rightController = document.querySelector('#rightController');
    
    if (!leftController || !rightController) return;
    
    // Verificar se os controles estão conectados
    const leftGamepad = leftController.components['oculus-touch-controls'];
    const rightGamepad = rightController.components['oculus-touch-controls'];
    
    if (!leftGamepad || !rightGamepad) return;
    
    // Obter dados do joystick esquerdo (movimentação)
    const leftThumbstick = this.getThumbstickValue(leftGamepad, 'left');
    // Obter dados do joystick direito (rotação)
    const rightThumbstick = this.getThumbstickValue(rightGamepad, 'right');
    
    if (leftThumbstick) {
      this.handleMovement(leftThumbstick, camera, timeDelta);
    }
    
    if (rightThumbstick) {
      this.handleRotation(rightThumbstick, camera, timeDelta);
    }
  },
  
  getThumbstickValue: function (controllerComponent, hand) {
    if (!controllerComponent || !controllerComponent.gamepad) return null;
    
    const gamepad = controllerComponent.gamepad;
    
    // Índices dos eixos do thumbstick para Quest 3
    const xAxisIndex = hand === 'left' ? 2 : 0;
    const yAxisIndex = hand === 'left' ? 3 : 1;
    
    if (gamepad.axes && gamepad.axes.length > Math.max(xAxisIndex, yAxisIndex)) {
      const x = gamepad.axes[xAxisIndex];
      const y = gamepad.axes[yAxisIndex];
      
      // Aplicar deadzone
      const deadzone = 0.1;
      const magnitude = Math.sqrt(x * x + y * y);
      
      if (magnitude > deadzone) {
        return { x: x, y: y, magnitude: magnitude };
      }
    }
    
    return null;
  },
  
  handleMovement: function (thumbstick, camera, timeDelta) {
    const data = this.data;
    const speed = data.speed * (timeDelta / 1000);
    
    // Obter direção da câmera
    const cameraRotation = camera.getAttribute('rotation');
    const yRotation = THREE.MathUtils.degToRad(cameraRotation.y);
    
    // Calcular direção de movimento baseada na rotação da câmera
    const forward = new THREE.Vector3(
      Math.sin(yRotation),
      0,
      Math.cos(yRotation)
    );
    
    const right = new THREE.Vector3(
      Math.cos(yRotation),
      0,
      -Math.sin(yRotation)
    );
    
    // Aplicar movimento
    this.velocity.set(0, 0, 0);
    this.velocity.addScaledVector(right, thumbstick.x * speed);
    this.velocity.addScaledVector(forward, -thumbstick.y * speed);
    
    // Aplicar movimento ao rig
    const currentPosition = this.el.getAttribute('position');
    const newPosition = {
      x: currentPosition.x + this.velocity.x,
      y: currentPosition.y + (data.fly ? this.velocity.y : 0),
      z: currentPosition.z + this.velocity.z
    };
    
    this.el.setAttribute('position', newPosition);
    
    // Log para debug (apenas a cada 60 frames para não spam)
     this.debugCounter++;
     if (this.debugCounter % 60 === 0) {
       console.log('🎮 Quest 3 Movement:', {
         thumbstick: { x: thumbstick.x.toFixed(2), y: thumbstick.y.toFixed(2) },
         velocity: { x: this.velocity.x.toFixed(2), z: this.velocity.z.toFixed(2) },
         position: { x: newPosition.x.toFixed(2), z: newPosition.z.toFixed(2) }
       });
     }
  },
  
  handleRotation: function (thumbstick, camera, timeDelta) {
    const data = this.data;
    const rotationSpeed = data.rotationSpeed * (timeDelta / 1000) * 30; // 30 graus por segundo
    
    // Rotação snap (comum em VR)
    if (Math.abs(thumbstick.x) > 0.7) {
      const currentRotation = this.el.getAttribute('rotation');
      const snapAngle = thumbstick.x > 0 ? 30 : -30;
      
      this.el.setAttribute('rotation', {
        x: currentRotation.x,
        y: currentRotation.y + snapAngle,
        z: currentRotation.z
      });
      
      // Prevenir rotação contínua
      setTimeout(() => {
        this.rotationCooldown = false;
      }, 300);
      
      if (!this.rotationCooldown) {
         this.rotationCooldown = true;
         console.log('🔄 Quest 3 Snap Rotation:', snapAngle + '°');
       }
    }
  }
});

// Componente para configuração WebXR otimizada para Quest 3
AFRAME.registerComponent('webxr-setup', {
  init: function () {
    const sceneEl = this.el;
    
    // Configurar WebXR com recursos necessários
    sceneEl.setAttribute('webxr', {
      requiredFeatures: 'local-floor,hand-tracking',
      optionalFeatures: 'bounded-floor,layers,depth-sensing',
      referenceSpaceType: 'local-floor'
    });
    
    // Otimizações de renderização para Quest 3
    sceneEl.setAttribute('renderer', {
      antialias: false,
      physicallyCorrectLights: true,
      colorManagement: true,
      sortObjects: true,
      foveationLevel: 1 // Foveated rendering para Quest 3
    });
    
    // Configurar VR mode UI
    sceneEl.setAttribute('vr-mode-ui', {
      enabled: true,
      enterVRButton: '#vr-toggle'
    });
  }
});

// Função principal para inicializar a aplicação
function initApp() {
  console.log('🚀 Inicializando aplicação Fusion Reality...');
  
  // Verificar compatibilidade WebXR antes de inicializar
  checkWebXRCompatibility();
  
  // Aguardar carregamento completo do A-Frame
  waitForAFrameReady().then(() => {
    console.log('✅ A-Frame carregado com sucesso');
    setupVRControls();
    setupUIControls();
  }).catch((error) => {
    console.error('❌ Erro ao carregar A-Frame:', error);
    showNotification('Erro ao inicializar VR. Recarregue a página.', 'error');
  });
}

// Verificar compatibilidade WebXR
function checkWebXRCompatibility() {
  if (!navigator.xr) {
    console.warn('⚠️ WebXR não disponível - usando fallback WebVR');
    return false;
  }
  
  navigator.xr.isSessionSupported('immersive-vr')
    .then((supported) => {
      if (supported) {
        console.log('✅ WebXR VR suportado');
      } else {
        console.warn('⚠️ WebXR VR não suportado neste dispositivo');
      }
    })
    .catch((error) => {
      console.warn('⚠️ Erro ao verificar suporte WebXR:', error);
    });
  
  return true;
}

// Aguardar carregamento completo do A-Frame com verificações robustas
function waitForAFrameReady() {
  return new Promise((resolve, reject) => {
    // Verificar se A-Frame está disponível globalmente
    if (typeof AFRAME === 'undefined') {
      reject(new Error('A-Frame não carregado'));
      return;
    }
    
    const scene = document.querySelector('a-scene');
    
    if (!scene) {
      reject(new Error('Cena A-Frame não encontrada'));
      return;
    }
    
    // Verificar se a cena já está carregada
    if (scene.hasLoaded && scene.systems && scene.systems.renderer) {
      console.log('✅ A-Frame já estava carregado');
      resolve(scene);
      return;
    }
    
    // Sistema de verificação em múltiplas etapas
    let checksCompleted = 0;
    const requiredChecks = 3;
    
    const checkCompletion = () => {
      checksCompleted++;
      if (checksCompleted >= requiredChecks) {
        clearTimeout(timeout);
        console.log('✅ A-Frame carregado após verificações múltiplas');
        resolve(scene);
      }
    };
    
    // Timeout de segurança aumentado
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout ao carregar A-Frame, mas continuando...');
      resolve(scene); // Resolver mesmo com timeout para não travar
    }, 15000);
    
    // 1. Aguardar evento 'loaded' da cena
    scene.addEventListener('loaded', () => {
      console.log('🎬 Evento loaded da cena disparado');
      checkCompletion();
    }, { once: true });
    
    // 2. Aguardar sistemas do A-Frame estarem prontos
    const waitForSystems = () => {
      if (scene.systems && scene.systems.renderer && scene.systems.renderer.el) {
        console.log('🎨 Sistemas do A-Frame prontos');
        checkCompletion();
      } else {
        setTimeout(waitForSystems, 100);
      }
    };
    waitForSystems();
    
    // 3. Aguardar renderização inicial
    const waitForFirstRender = () => {
      if (scene.renderer && scene.renderer.domElement) {
        console.log('🖼️ Primeira renderização concluída');
        checkCompletion();
      } else {
        setTimeout(waitForFirstRender, 100);
      }
    };
    waitForFirstRender();
  });
}

// Configurar controles VR
function setupVRControls() {
  const vrToggleBtn = document.getElementById('vr-toggle');
  if (!vrToggleBtn) return;
  
  vrToggleBtn.addEventListener('click', async () => {
    const scene = document.querySelector('a-scene');
    if (!scene || !scene.hasLoaded) {
      showNotification('Aguarde o carregamento da cena...', 'warning');
      return;
    }
    
    try {
      // Verificar se WebXR está disponível
      if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-vr');
        if (supported) {
          console.log('🥽 Entrando em modo VR...');
          scene.enterVR();
        } else {
          showNotification('WebXR não suportado neste dispositivo', 'error');
        }
      } else {
        // Fallback para WebVR
        console.log('🥽 Usando fallback WebVR...');
        scene.enterVR();
      }
    } catch (error) {
      console.error('❌ Erro ao entrar em VR:', error);
      showNotification('Erro ao ativar VR. Verifique seu dispositivo.', 'error');
    }
  });
}

// Configurar controles da UI
function setupUIControls() {
  // Toggle side panel
  const togglePanelBtn = document.getElementById('toggle-panel');
  const sidePanel = document.getElementById('side-panel');
  
  if (togglePanelBtn && sidePanel) {
    togglePanelBtn.addEventListener('click', () => {
      sidePanel.classList.toggle('hidden');
      sidePanel.classList.toggle('w-80');
      sidePanel.classList.toggle('w-0');
    });
  }
  
  // Help modal
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const closeHelp = document.getElementById('close-help');
  const closeHelpBtn = document.getElementById('close-help-btn');
  
  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
    });
  }
  
  if (closeHelp && helpModal) {
    closeHelp.addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });
  }
  
  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });
  }
  
  // Scene selection com ambientes dinâmicos
  const sceneCards = document.querySelectorAll('.scene-card');
  sceneCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active class from all cards
      sceneCards.forEach(c => c.classList.remove('border-purple-500', 'ring-2', 'ring-purple-500'));
      
      // Add active class to clicked card
      card.classList.add('border-purple-500', 'ring-2', 'ring-purple-500');
      
      // Carregar ambiente selecionado
      const env = document.querySelector('[environment]');
      if (env) {
        const presets = ['default', 'contact', 'egypt', 'checkerboard', 'forest', 'goaland', 'yavapai', 'goldmine', 'threetowers', 'poison', 'arches', 'tron', 'japan', 'dream', 'volcano', 'starry', 'osiris'];
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        
        env.setAttribute('environment', 'preset', randomPreset);
        showNotification(`Ambiente ${randomPreset} carregado`, 'success');
      }
    });
  });
  
  // Ativar primeira cena por padrão
  if (sceneCards.length > 0) {
    sceneCards[0].classList.add('border-purple-500', 'ring-2', 'ring-purple-500');
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
      scene.resize();
    }
  });
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg fade-in z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Inicializar quando DOM estiver carregado
// Sistema de debug avançado
const DEBUG_MODE = true; // Altere para false em produção

function debugLog(message, data = null) {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`🔍 [${timestamp}] ${message}`, data || '');
}

// Monitorar carregamento de recursos
window.addEventListener('load', () => {
  debugLog('✅ Página completamente carregada');
});

// Monitorar eventos A-Frame
document.addEventListener('DOMContentLoaded', () => {
  debugLog('📄 DOM carregado, iniciando aplicação...');
  
  // Monitorar carregamento da cena A-Frame
  const scene = document.querySelector('a-scene');
  if (scene) {
    debugLog('🎬 Cena A-Frame encontrada');
    
    scene.addEventListener('loaded', () => {
      debugLog('✅ Cena A-Frame carregada com sucesso');
    });
    
    scene.addEventListener('enter-vr', () => {
      debugLog('🥽 Modo VR ativado');
    });
    
    scene.addEventListener('exit-vr', () => {
      debugLog('👁️ Modo VR desativado');
    });
    
    scene.addEventListener('renderstart', () => {
      debugLog('🎨 Renderização iniciada');
    });
  } else {
    debugLog('❌ Cena A-Frame não encontrada no DOM');
  }
  
  initApp();
});

// Monitorar performance
if (DEBUG_MODE) {
  setInterval(() => {
    const memory = performance.memory;
    if (memory) {
      debugLog('📊 Memória:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      });
    }
  }, 30000); // A cada 30 segundos
}
