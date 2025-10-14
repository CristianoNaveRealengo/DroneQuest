/**
 * Componente de Animação de Hover (Flutuação)
 * Faz o drone/cockpit flutuar para dar impressão de estar no ar
 */

AFRAME.registerComponent("hover-animation", {
	schema: {
		enabled: { type: "boolean", default: true },
		amplitude: { type: "number", default: 0.08 }, // 8cm em metros
		duration: { type: "number", default: 2000 }, // 2 segundos
		delay: { type: "number", default: 500 }, // Delay inicial
	},

	init: function () {
		console.log("🎈 Hover Animation iniciado");

		this.originalPosition = null;
		this.isAnimating = false;

		// Aguardar um pouco antes de iniciar
		setTimeout(() => {
			if (this.data.enabled) {
				this.startHoverAnimation();
			}
		}, this.data.delay);
	},

	startHoverAnimation: function () {
		if (this.isAnimating) return;

		console.log("🎈 Iniciando animação de hover");

		// Salvar posição original
		this.originalPosition = this.el.getAttribute("position");

		// Posição para descer (8cm = 0.08m)
		const downPosition = {
			x: this.originalPosition.x,
			y: this.originalPosition.y - this.data.amplitude,
			z: this.originalPosition.z,
		};

		// Animação: Desce e depois sobe continuamente
		this.el.setAttribute("animation__hover", {
			property: "position",
			to: `${downPosition.x} ${downPosition.y} ${downPosition.z}`,
			dur: this.data.duration,
			dir: "alternate",
			loop: true,
			easing: "easeInOutSine",
		});

		this.isAnimating = true;
		console.log(
			`✅ Hover ativo: ${this.originalPosition.y} ↔ ${downPosition.y}`
		);
	},

	stopHoverAnimation: function () {
		if (!this.isAnimating) return;

		console.log("🛑 Parando animação de hover");

		// Remover animação
		this.el.removeAttribute("animation__hover");

		// Restaurar posição original
		if (this.originalPosition) {
			this.el.setAttribute("position", this.originalPosition);
		}

		this.isAnimating = false;
	},

	update: function (oldData) {
		// Se enabled mudou
		if (oldData.enabled !== this.data.enabled) {
			if (this.data.enabled) {
				this.startHoverAnimation();
			} else {
				this.stopHoverAnimation();
			}
		}
	},

	remove: function () {
		this.stopHoverAnimation();
	},
});

console.log("📦 Hover Animation carregado!");
