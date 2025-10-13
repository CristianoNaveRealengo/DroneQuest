/**
 * Collision Particles - Sistema de Partículas Otimizado
 * Pool de partículas reutilizáveis para performance
 */

AFRAME.registerComponent("collision-particles", {
	schema: {
		poolSize: { type: "number", default: 15 },
		particleDuration: { type: "number", default: 200 },
		particleSize: { type: "number", default: 0.03 },
	},

	init: function () {
		console.log("✨ Inicializando Collision Particles...");

		this.particlePool = [];
		this.activeParticles = [];

		this.createParticlePool();

		console.log(`✅ Pool de ${this.data.poolSize} partículas criado!`);
	},

	createParticlePool: function () {
		for (let i = 0; i < this.data.poolSize; i++) {
			const particle = this.createParticle();
			particle.setAttribute("visible", false);
			this.particlePool.push(particle);
			this.el.appendChild(particle);
		}
	},

	createParticle: function () {
		const particle = document.createElement("a-sphere");
		particle.setAttribute("geometry", {
			radius: this.data.particleSize,
		});
		particle.setAttribute("material", {
			color: "#ff6600",
			emissive: "#ff3300",
			emissiveIntensity: 0.8,
			transparent: true,
			opacity: 1,
		});
		return particle;
	},

	spawnParticles: function (position, count = 3) {
		// Reduzido para 3 partículas por colisão
		for (let i = 0; i < count; i++) {
			const particle = this.getParticle();
			if (!particle) break;

			this.activateParticle(particle, position);
		}
	},

	getParticle: function () {
		// Buscar partícula disponível no pool
		if (this.particlePool.length > 0) {
			return this.particlePool.pop();
		}

		// Se não houver disponível, reusar a mais antiga
		if (this.activeParticles.length > 0) {
			const oldest = this.activeParticles.shift();
			this.resetParticle(oldest);
			return oldest;
		}

		return null;
	},

	activateParticle: function (particle, position) {
		// Posição inicial
		particle.setAttribute("position", {
			x: position.x,
			y: position.y,
			z: position.z,
		});

		// Direção aleatória
		const angle = Math.random() * Math.PI * 2;
		const elevation = (Math.random() - 0.5) * Math.PI;
		const speed = 2 + Math.random() * 3;

		const targetX =
			position.x + Math.cos(angle) * Math.cos(elevation) * speed;
		const targetY = position.y + Math.sin(elevation) * speed;
		const targetZ =
			position.z + Math.sin(angle) * Math.cos(elevation) * speed;

		// Tornar visível
		particle.setAttribute("visible", true);
		particle.setAttribute("material.opacity", 1);

		// Animação de movimento
		particle.setAttribute("animation__move", {
			property: "position",
			to: `${targetX} ${targetY} ${targetZ}`,
			dur: this.data.particleDuration,
			easing: "easeOutQuad",
		});

		// Animação de fade
		particle.setAttribute("animation__fade", {
			property: "material.opacity",
			from: 1,
			to: 0,
			dur: this.data.particleDuration,
			easing: "easeOutQuad",
		});

		// Adicionar à lista de ativas
		this.activeParticles.push(particle);

		// Retornar ao pool após duração
		setTimeout(() => {
			this.returnParticle(particle);
		}, this.data.particleDuration);
	},

	returnParticle: function (particle) {
		// Remover da lista de ativas
		const index = this.activeParticles.indexOf(particle);
		if (index > -1) {
			this.activeParticles.splice(index, 1);
		}

		// Resetar e retornar ao pool
		this.resetParticle(particle);
		this.particlePool.push(particle);
	},

	resetParticle: function (particle) {
		particle.setAttribute("visible", false);
		particle.removeAttribute("animation__move");
		particle.removeAttribute("animation__fade");
		particle.setAttribute("material.opacity", 1);
	},
});

console.log("📦 Collision Particles carregado!");
