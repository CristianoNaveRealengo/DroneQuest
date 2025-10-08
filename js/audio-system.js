/**
 * Sistema de Áudio para Jogo VR de Drone
 *
 * Este sistema gerencia todos os aspectos de áudio do jogo:
 * - Música ambiente
 * - Efeitos sonoros do drone
 * - Sons de ambiente urbano
 * - Feedback sonoro de interações
 * - Controle de volume e mixagem
 */

AFRAME.registerComponent("audio-system", {
	schema: {
		masterVolume: { type: "number", default: 0.7 },
		musicVolume: { type: "number", default: 0.4 },
		sfxVolume: { type: "number", default: 0.8 },
		ambientVolume: { type: "number", default: 0.3 },
		enableAudio: { type: "boolean", default: true },
		enable3D: { type: "boolean", default: true },
	},

	init: function () {
		console.log("🎵 Inicializando sistema de áudio...");

		// Contexto de áudio
		this.audioContext = null;
		this.audioSources = {};
		this.audioBuffers = {};
		this.currentMusic = null;
		this.ambientSounds = [];

		// Estado do sistema
		this.isInitialized = false;
		this.isMuted = false; // Iniciar com áudio ativo

		// Configurar sistema de áudio
		this.setupAudioSystem();
		this.createAudioSources();
		this.setupEventListeners();

		console.log("✅ Sistema de áudio inicializado!");
		console.log("🔊 Áudio iniciado ativo - Pressione M para mutar");

		// Mostrar indicação visual de áudio ativo
		this.showAudioActiveIndicator();
	},

	setupAudioSystem: function () {
		if (!this.data.enableAudio) {
			console.log("ℹ️ Áudio desabilitado");
			return;
		}

		try {
			// Criar contexto de áudio
			this.audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();

			// Configurar nós de áudio
			this.masterGain = this.audioContext.createGain();
			this.musicGain = this.audioContext.createGain();
			this.sfxGain = this.audioContext.createGain();
			this.ambientGain = this.audioContext.createGain();

			// Conectar nós
			this.musicGain.connect(this.masterGain);
			this.sfxGain.connect(this.masterGain);
			this.ambientGain.connect(this.masterGain);
			this.masterGain.connect(this.audioContext.destination);

			// Configurar volumes iniciais
			this.updateVolumes();

			this.isInitialized = true;
			console.log("🎛️ Contexto de áudio configurado");

			// Garantir que o áudio não está mudo
			if (this.isMuted) {
				this.isMuted = false;
				console.log("🔊 Forçando áudio ativo na inicialização");
				this.updateVolumes();
			}
		} catch (error) {
			console.warn("⚠️ Erro ao inicializar contexto de áudio:", error);
		}
	},

	createAudioSources: function () {
		console.log("🎼 Criando fontes de áudio...");

		// Música ambiente
		this.createBackgroundMusic();

		// Efeitos sonoros do drone
		this.createDroneSounds();

		// Sons ambiente urbano
		this.createAmbientSounds();

		// Sons de interface
		this.createUISounds();
	},

	createBackgroundMusic: function () {
		// Música ambiente usando Web Audio API com osciladores
		this.backgroundMusic = {
			isPlaying: false,
			oscillators: [],
			gainNodes: [],
		};

		// Criar música procedural ambiente
		this.startBackgroundMusic();
	},

	startBackgroundMusic: function () {
		if (!this.isInitialized || this.backgroundMusic.isPlaying) return;

		console.log("🎵 Iniciando música ambiente...");

		// Criar acordes ambientes
		const frequencies = [
			[220, 277, 330], // Acorde Am
			[196, 247, 294], // Acorde G
			[262, 330, 392], // Acorde C
			[233, 294, 349], // Acorde Bb
		];

		frequencies.forEach((chord, index) => {
			setTimeout(() => {
				this.playChord(chord, 4000); // 4 segundos por acorde
			}, index * 4000);
		});

		// Repetir música
		this.musicInterval = setInterval(() => {
			this.startBackgroundMusic();
		}, 16000); // 16 segundos total

		this.backgroundMusic.isPlaying = true;
	},

	playChord: function (frequencies, duration) {
		if (!this.isInitialized) return;

		const oscillators = [];
		const gainNodes = [];

		frequencies.forEach((freq, index) => {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(
				freq,
				this.audioContext.currentTime
			);

			// Envelope ADSR suave
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				0.1,
				this.audioContext.currentTime + 0.5
			);
			gainNode.gain.setValueAtTime(
				0.1,
				this.audioContext.currentTime + duration / 1000 - 0.5
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration / 1000
			);

			oscillator.connect(gainNode);
			gainNode.connect(this.musicGain);

			oscillator.start(this.audioContext.currentTime);
			oscillator.stop(this.audioContext.currentTime + duration / 1000);

			oscillators.push(oscillator);
			gainNodes.push(gainNode);
		});
	},

	createDroneSounds: function () {
		console.log("🚁 Configurando sons do drone...");

		this.droneSounds = {
			propellers: null,
			engine: null,
			boost: null,
			landing: null,
		};

		// Som das hélices (ruído branco filtrado)
		this.createPropellerSound();
	},

	createPropellerSound: function () {
		if (!this.isInitialized) return;

		// Criar ruído branco para simular hélices
		const bufferSize = this.audioContext.sampleRate * 2; // 2 segundos
		const buffer = this.audioContext.createBuffer(
			1,
			bufferSize,
			this.audioContext.sampleRate
		);
		const data = buffer.getChannelData(0);

		// Gerar ruído branco
		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		this.propellerBuffer = buffer;
	},

	playPropellerSound: function (intensity = 1.0) {
		if (!this.isInitialized || !this.propellerBuffer) return;

		// Parar som anterior se existir
		if (this.droneSounds.propellers) {
			this.droneSounds.propellers.source.stop();
		}

		const source = this.audioContext.createBufferSource();
		const gainNode = this.audioContext.createGain();
		const filter = this.audioContext.createBiquadFilter();

		source.buffer = this.propellerBuffer;
		source.loop = true;

		// Filtro passa-baixa para suavizar
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(
			800 + intensity * 400,
			this.audioContext.currentTime
		);

		// Volume baseado na intensidade; sfx/master volumes são aplicados nos nós sfxGain/masterGain
		const effectiveVolume = this.isMuted ? 0 : intensity * 0.3;
		gainNode.gain.setValueAtTime(
			effectiveVolume,
			this.audioContext.currentTime
		);

		source.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(this.sfxGain);

		source.start();
		// Armazenar referências para controle posterior
		this.droneSounds.propellers = {
			source: source,
			gain: gainNode,
			filter: filter,
			intensity: intensity,
		};
	},

	stopPropellerSound: function () {
		if (this.droneSounds.propellers) {
			this.droneSounds.propellers.source.stop();
			this.droneSounds.propellers = null;
		}
	},

	createAmbientSounds: function () {
		console.log("🏙️ Configurando sons ambiente urbanos...");

		this.ambientSounds = [];

		// Criar sons de vento urbano
		this.createWindSound();

		// Criar sons de tráfego distante
		this.createTrafficSound();
	},

	createWindSound: function () {
		if (!this.isInitialized) return;

		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();
		const filter = this.audioContext.createBiquadFilter();

		oscillator.type = "sawtooth";
		oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);

		filter.type = "lowpass";
		filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
		filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

		gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

		// Modulação suave do volume para simular rajadas de vento
		const lfo = this.audioContext.createOscillator();
		const lfoGain = this.audioContext.createGain();

		lfo.type = "sine";
		lfo.frequency.setValueAtTime(0.1, this.audioContext.currentTime);
		lfoGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);

		lfo.connect(lfoGain);
		lfoGain.connect(gainNode.gain);

		oscillator.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(this.ambientGain);

		oscillator.start();
		lfo.start();

		this.ambientSounds.push({ oscillator, gainNode, lfo });
	},

	createTrafficSound: function () {
		if (!this.isInitialized) return;

		// Som de tráfego distante usando ruído filtrado
		const bufferSize = this.audioContext.sampleRate * 5; // 5 segundos
		const buffer = this.audioContext.createBuffer(
			1,
			bufferSize,
			this.audioContext.sampleRate
		);
		const data = buffer.getChannelData(0);

		// Gerar ruído rosa (mais grave que branco)
		let b0 = 0,
			b1 = 0,
			b2 = 0,
			b3 = 0,
			b4 = 0,
			b5 = 0,
			b6 = 0;
		for (let i = 0; i < bufferSize; i++) {
			const white = Math.random() * 2 - 1;
			b0 = 0.99886 * b0 + white * 0.0555179;
			b1 = 0.99332 * b1 + white * 0.0750759;
			b2 = 0.969 * b2 + white * 0.153852;
			b3 = 0.8665 * b3 + white * 0.3104856;
			b4 = 0.55 * b4 + white * 0.5329522;
			b5 = -0.7616 * b5 - white * 0.016898;
			data[i] =
				(b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
			b6 = white * 0.115926;
		}

		const source = this.audioContext.createBufferSource();
		const gainNode = this.audioContext.createGain();
		const filter = this.audioContext.createBiquadFilter();

		source.buffer = buffer;
		source.loop = true;

		filter.type = "lowpass";
		filter.frequency.setValueAtTime(300, this.audioContext.currentTime);

		gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

		source.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(this.ambientGain);

		source.start();
		this.ambientSounds.push({ source, gainNode });
	},

	createUISounds: function () {
		console.log("🔊 Configurando sons de interface...");

		this.uiSounds = {
			checkpoint: this.createBeepSound(800, 0.1, 0.2),
			finish: this.createBeepSound(1200, 0.3, 0.5),
			error: this.createBeepSound(300, 0.2, 0.3),
		};
	},

	createBeepSound: function (frequency, duration, volume) {
		return () => {
			if (!this.isInitialized) return;

			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(
				frequency,
				this.audioContext.currentTime
			);

			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				volume,
				this.audioContext.currentTime + 0.01
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration
			);

			oscillator.connect(gainNode);
			gainNode.connect(this.sfxGain);

			oscillator.start();
			oscillator.stop(this.audioContext.currentTime + duration);
		};
	},

	setupEventListeners: function () {
		// Escutar eventos do jogo
		this.el.addEventListener("checkpoint-reached", () => {
			this.playCheckpointSound();
		});

		this.el.addEventListener("race-finished", () => {
			this.playFinishSound();
		});

		this.el.addEventListener("drone-crash", () => {
			this.playErrorSound();
		});

		// Escutar mudanças no drone
		this.el.addEventListener("drone-throttle-change", (evt) => {
			this.updatePropellerSound(evt.detail.intensity);
		});

		// Ativar contexto de áudio na primeira interação do usuário
		this.setupUserInteractionHandler();
	},

	setupUserInteractionHandler: function () {
		const activateAudio = () => {
			if (this.audioContext && this.audioContext.state === "suspended") {
				this.audioContext.resume().then(() => {
					console.log(
						"🔊 Contexto de áudio ativado pela interação do usuário"
					);
				});
			}
		};

		// Eventos de interação para ativar o áudio
		const interactionEvents = ["click", "keydown", "touchstart"];
		interactionEvents.forEach((event) => {
			document.addEventListener(event, activateAudio, { once: true });
		});

		// Também ativar quando entrar em VR
		this.el.sceneEl.addEventListener("enter-vr", activateAudio, {
			once: true,
		});
	},

	// Métodos públicos para controle de áudio
	playCheckpointSound: function () {
		if (this.uiSounds && this.uiSounds.checkpoint) {
			this.uiSounds.checkpoint();
		}
	},

	playFinishSound: function () {
		if (this.uiSounds && this.uiSounds.finish) {
			this.uiSounds.finish();
		}
	},

	playErrorSound: function () {
		if (this.uiSounds && this.uiSounds.error) {
			this.uiSounds.error();
		}
	},

	updatePropellerSound: function (intensity) {
		if (intensity > 0.1) {
			this.playPropellerSound(intensity);
		} else {
			this.stopPropellerSound();
		}
	},

	updateVolumes: function () {
		if (!this.isInitialized) return;

		// Debug: verificar estado do áudio
		console.log(
			`🔍 Estado do áudio: isMuted=${this.isMuted}, masterVolume=${this.data.masterVolume}`
		);

		const masterVolume = this.isMuted ? 0 : this.data.masterVolume;
		console.log(
			`🎛️ Atualizando volumes - Master: ${masterVolume.toFixed(
				2
			)}, SFX: ${this.data.sfxVolume.toFixed(2)}, Muted: ${this.isMuted}`
		);

		this.masterGain.gain.setValueAtTime(
			masterVolume,
			this.audioContext.currentTime
		);
		this.musicGain.gain.setValueAtTime(
			this.data.musicVolume,
			this.audioContext.currentTime
		);
		this.sfxGain.gain.setValueAtTime(
			this.data.sfxVolume,
			this.audioContext.currentTime
		);
		this.ambientGain.gain.setValueAtTime(
			this.data.ambientVolume,
			this.audioContext.currentTime
		);

		// Atualizar também o volume do drone
		this.updateDroneVolume();
	},

	toggleMute: function () {
		this.isMuted = !this.isMuted;
		this.updateVolumes();
		console.log(this.isMuted ? "🔇 Áudio mutado" : "🔊 Áudio ativado");

		// Atualizar volume do drone se estiver tocando
		this.updateDroneVolume();

		// Atualizar indicação visual
		if (this.isMuted) {
			this.showMuteIndicator();
		} else {
			this.hideMuteIndicator();
		}
	},

	updateDroneVolume: function () {
		// Atualizar volume do som das hélices se estiver tocando
		if (this.droneSounds.propellers) {
			const intensity = this.droneSounds.propellers.intensity;
			// Aplicar apenas intensidade aqui; sfx/master volumes são aplicados nos nós de mixagem
			const effectiveVolume = this.isMuted ? 0 : intensity * 0.3;
			console.log(
				`🚁 Atualizando volume do drone - Intensidade: ${intensity.toFixed(
					2
				)}, Volume efetivo: ${effectiveVolume.toFixed(2)}`
			);
			this.droneSounds.propellers.gain.gain.setValueAtTime(
				effectiveVolume,
				this.audioContext.currentTime
			);
		}
	},

	showMuteIndicator: function () {
		// Remover indicador existente se houver
		this.hideMuteIndicator();

		const indicator = document.createElement("div");
		indicator.id = "mute-indicator";
		indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
        `;
		indicator.innerHTML =
			"🔇 ÁUDIO MUDO<br><small>Pressione M para ativar</small>";

		// Adicionar animação CSS
		const style = document.createElement("style");
		style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
		document.head.appendChild(style);

		document.body.appendChild(indicator);
		this.muteIndicatorElement = indicator;
	},

	hideMuteIndicator: function () {
		if (this.muteIndicatorElement && this.muteIndicatorElement.parentNode) {
			this.muteIndicatorElement.parentNode.removeChild(
				this.muteIndicatorElement
			);
			this.muteIndicatorElement = null;
		}
	},

	showAudioActiveIndicator: function () {
		const indicator = document.createElement("div");
		indicator.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: rgba(0, 255, 0, 0.8);
			color: white;
			padding: 10px 15px;
			border-radius: 5px;
			font-family: Arial, sans-serif;
			font-size: 14px;
			font-weight: bold;
			z-index: 1000;
			pointer-events: none;
			box-shadow: 0 2px 10px rgba(0,0,0,0.3);
		`;
		indicator.innerHTML =
			"🔊 ÁUDIO ATIVO<br><small>Pressione M para mutar</small>";
		document.body.appendChild(indicator);

		// Remover após 3 segundos
		setTimeout(() => {
			if (indicator.parentNode) {
				indicator.parentNode.removeChild(indicator);
			}
		}, 3000);
	},

	setMasterVolume: function (volume) {
		this.data.masterVolume = Math.max(0, Math.min(1, volume));
		console.log(
			`🔊 Master volume ajustado para: ${this.data.masterVolume.toFixed(
				2
			)}`
		);
		this.updateVolumes();
	},

	setMusicVolume: function (volume) {
		this.data.musicVolume = Math.max(0, Math.min(1, volume));
		this.updateVolumes();
	},

	setSFXVolume: function (volume) {
		this.data.sfxVolume = Math.max(0, Math.min(1, volume));
		this.updateVolumes();
	},

	setAmbientVolume: function (volume) {
		this.data.ambientVolume = Math.max(0, Math.min(1, volume));
		this.updateVolumes();
	},

	// Limpeza
	remove: function () {
		console.log("🧹 Limpando sistema de áudio...");

		// Parar música
		if (this.musicInterval) {
			clearInterval(this.musicInterval);
		}

		// Parar sons do drone
		this.stopPropellerSound();

		// Parar sons ambiente
		this.ambientSounds.forEach((sound) => {
			if (sound.oscillator) sound.oscillator.stop();
			if (sound.source) sound.source.stop();
			if (sound.lfo) sound.lfo.stop();
		});

		// Remover indicador de mute
		this.hideMuteIndicator();

		// Fechar contexto de áudio
		if (this.audioContext && this.audioContext.state !== "closed") {
			this.audioContext.close();
		}
	},

	// Criar tom sintético para efeitos sonoros
	createTone: function (frequency, duration, volume) {
		if (!this.isInitialized) return;

		// Valor padrão para volume
		volume = volume || 0.3;

		try {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(
				frequency,
				this.audioContext.currentTime
			);

			// Envelope ADSR simples
			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				volume,
				this.audioContext.currentTime + 0.01
			);
			gainNode.gain.exponentialRampToValueAtTime(
				0.001,
				this.audioContext.currentTime + duration / 1000
			);

			oscillator.connect(gainNode);
			gainNode.connect(this.sfxGain);

			oscillator.start(this.audioContext.currentTime);
			oscillator.stop(this.audioContext.currentTime + duration / 1000);
		} catch (error) {
			console.warn("⚠️ Erro ao criar tom:", error);
		}
	},
});

// Utilitários de áudio globais
window.AudioUtils = {
	// Converter decibéis para ganho linear
	dbToGain: function (db) {
		return Math.pow(10, db / 20);
	},

	// Converter ganho linear para decibéis
	gainToDb: function (gain) {
		return 20 * Math.log10(gain);
	},

	// Interpolação suave entre valores
	smoothStep: function (edge0, edge1, x) {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	},
};

console.log("📦 Módulo audio-system.js carregado com sucesso!");
