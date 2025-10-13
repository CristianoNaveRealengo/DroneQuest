/**
 * Sistema de Instanciamento de Meshes
 * Reduz drawcalls usando THREE.InstancedMesh para objetos repetidos
 */

AFRAME.registerComponent("mesh-instancing", {
	schema: {
		enabled: { type: "boolean", default: true },
	},

	init: function () {
		if (!this.data.enabled) return;

		console.log("🔧 Sistema de instanciamento iniciado");

		// Aguardar cena carregar
		if (this.el.hasLoaded) {
			this.setupInstancing();
		} else {
			this.el.addEventListener("loaded", () => {
				this.setupInstancing();
			});
		}
	},

	setupInstancing: function () {
		console.log("📦 Configurando instanciamento de meshes...");

		// Aguardar modelos carregarem
		setTimeout(() => {
			this.instanceGols();
			this.mergeCheckpoints();
			console.log("✅ Instanciamento configurado!");
		}, 2000);
	},

	instanceGols: function () {
		// Buscar os dois gols
		const golLeft = document.querySelector("#gol-left");
		const golRight = document.querySelector("#gol-right");

		if (!golLeft || !golRight) {
			console.warn("⚠️ Gols não encontrados para instanciar");
			return;
		}

		// Aguardar modelos carregarem
		golLeft.addEventListener("model-loaded", () => {
			this.createGolInstances(golLeft, golRight);
		});
	},

	createGolInstances: function (golLeft, golRight) {
		try {
			const mesh = golLeft.getObject3D("mesh");
			if (!mesh) return;

			// Clonar geometria e material
			const geometry = mesh.children[0]?.geometry;
			const material = mesh.children[0]?.material;

			if (!geometry || !material) return;

			// Criar instanced mesh para 2 gols
			const instancedMesh = new THREE.InstancedMesh(
				geometry,
				material,
				2
			);

			// Matriz de transformação para gol esquerdo
			const matrix1 = new THREE.Matrix4();
			const pos1 = golLeft.object3D.position;
			const rot1 = golLeft.object3D.rotation;
			const scale1 = golLeft.object3D.scale;
			matrix1.compose(
				pos1,
				new THREE.Quaternion().setFromEuler(rot1),
				scale1
			);
			instancedMesh.setMatrixAt(0, matrix1);

			// Matriz de transformação para gol direito
			const matrix2 = new THREE.Matrix4();
			const pos2 = golRight.object3D.position;
			const rot2 = golRight.object3D.rotation;
			const scale2 = golRight.object3D.scale;
			matrix2.compose(
				pos2,
				new THREE.Quaternion().setFromEuler(rot2),
				scale2
			);
			instancedMesh.setMatrixAt(1, matrix2);

			instancedMesh.instanceMatrix.needsUpdate = true;

			// Adicionar à cena
			this.el.object3D.add(instancedMesh);

			// Ocultar originais
			golLeft.object3D.visible = false;
			golRight.object3D.visible = false;

			console.log("✅ Gols instanciados (2 drawcalls → 1 drawcall)");
		} catch (error) {
			console.warn("⚠️ Erro ao instanciar gols:", error);
		}
	},

	mergeCheckpoints: function () {
		// Buscar todos os checkpoints
		const checkpoints = document.querySelectorAll("[checkpoint]");

		if (checkpoints.length === 0) return;

		try {
			const geometries = [];
			const materials = [];

			checkpoints.forEach((cp) => {
				const mesh = cp.getObject3D("mesh");
				if (mesh) {
					// Clonar e aplicar transformação
					const clonedGeometry = mesh.geometry.clone();
					clonedGeometry.applyMatrix4(mesh.matrixWorld);
					geometries.push(clonedGeometry);
					materials.push(mesh.material);
				}
			});

			if (geometries.length > 0) {
				// Mesclar geometrias
				const mergedGeometry =
					THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
				const mergedMesh = new THREE.Mesh(mergedGeometry, materials[0]);

				// Adicionar à cena
				this.el.object3D.add(mergedMesh);

				// Ocultar originais (mas manter componentes ativos)
				checkpoints.forEach((cp) => {
					const mesh = cp.getObject3D("mesh");
					if (mesh) mesh.visible = false;
				});

				console.log(
					`✅ Checkpoints mesclados (${checkpoints.length} drawcalls → 1 drawcall)`
				);
			}
		} catch (error) {
			console.warn("⚠️ Erro ao mesclar checkpoints:", error);
		}
	},
});

// Componente para combinar meshes estáticos
AFRAME.registerComponent("static-batch", {
	schema: {
		selector: { type: "string", default: ".static" },
	},

	init: function () {
		console.log("🔧 Static batching iniciado");

		setTimeout(() => {
			this.batchStaticMeshes();
		}, 3000);
	},

	batchStaticMeshes: function () {
		const staticObjects = document.querySelectorAll(this.data.selector);

		if (staticObjects.length === 0) return;

		const geometries = [];
		const materials = new Map();

		staticObjects.forEach((obj) => {
			const mesh = obj.getObject3D("mesh");
			if (!mesh) return;

			mesh.traverse((child) => {
				if (child.isMesh) {
					const clonedGeometry = child.geometry.clone();
					clonedGeometry.applyMatrix4(child.matrixWorld);

					// Agrupar por material
					const materialKey = child.material.uuid;
					if (!materials.has(materialKey)) {
						materials.set(materialKey, {
							material: child.material,
							geometries: [],
						});
					}
					materials.get(materialKey).geometries.push(clonedGeometry);
				}
			});
		});

		// Criar meshes mesclados por material
		let batchCount = 0;
		materials.forEach((data, key) => {
			if (data.geometries.length > 0) {
				try {
					const mergedGeometry =
						THREE.BufferGeometryUtils.mergeBufferGeometries(
							data.geometries
						);
					const mergedMesh = new THREE.Mesh(
						mergedGeometry,
						data.material
					);
					this.el.object3D.add(mergedMesh);
					batchCount++;
				} catch (error) {
					console.warn("⚠️ Erro ao mesclar batch:", error);
				}
			}
		});

		// Ocultar originais
		staticObjects.forEach((obj) => {
			obj.object3D.visible = false;
		});

		console.log(
			`✅ Static batching: ${staticObjects.length} objetos → ${batchCount} batches`
		);
	},
});

console.log("📦 Módulo mesh-instancing.js carregado!");
