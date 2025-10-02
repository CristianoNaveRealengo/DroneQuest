# Teste dos Controles VR - Instruções

## 🔧 Alterações Implementadas

### ✅ Problemas Corrigidos

1. **Função `processControlInput`**: Modificada para não resetar os valores das alavancas VR
2. **Função `hasVRInput`**: Adicionada para detectar entrada ativa das alavancas
3. **Inicialização**: Variáveis target agora são inicializadas no `init()`
4. **Logs de Debug**: Adicionados para monitorar entrada das alavancas

### 🎮 Nova Configuração Final

**Joystick Esquerdo (leftStick):**

-   **X (Horizontal)**: Movimento lateral (A/D) → `targetStrafeSpeed`
-   **Y (Vertical)**: Movimento frontal (W/S) → `targetForwardSpeed`

**Joystick Direito (rightStick):**

-   **X (Horizontal)**: Rotação Yaw (girar) → `targetYawRotation`
-   **Y (Vertical)**: Altitude (subir/descer) → `targetAltitudeChange`

**Triggers:**

-   **Esquerdo**: Ativar/Desativar drone
-   **Direito**: Modo boost

## 🧪 Como Testar

### Teste com Teclado (Simulação VR)

```
Alavanca Esquerda (Movimento):
- I/K: Frente/Trás
- J/L: Esquerda/Direita

Alavanca Direita (Altitude + Rotação):
- Z/X: Subir/Descer
- Q/E: Girar Esquerda/Direita
```

### Teste em VR Real

1. Entre no modo VR
2. Use as alavancas conforme a configuração acima
3. Verifique os logs no console do navegador

## 🔍 Debug

### Logs Esperados

Quando mover as alavancas, você deve ver no console:

```
🕹️ Alavanca Esquerda: x=0.50, y=-0.80 | Forward=2.40, Strafe=1.50
🕹️ Alavanca Direita: x=-0.30, y=0.60 | Altitude=1.08, Yaw=0.18
```

### Verificações

1. **Console do navegador**: Deve mostrar logs das alavancas
2. **Movimento do drone**: Deve responder às alavancas
3. **HUD**: Deve mostrar mudanças de velocidade e altitude

## 🚀 Para Iniciar o Teste

1. **Iniciar servidor local**:

    ```bash
    npx http-server . -p 8000
    ```

2. **Abrir no navegador**:

    ```
    http://localhost:8000
    ```

3. **Abrir Console do Navegador** (F12)

4. **Testar controles**:
    - Pressione as teclas I/K/J/L/Z/X/Q/E
    - Verifique os logs no console
    - Observe o movimento do drone

## 🔧 Se Ainda Não Funcionar

Possíveis causas:

1. **Eventos VR não conectados**: Verificar se `setupVRControls()` está sendo chamado
2. **Deadzone muito alto**: Verificar se `applyDeadzone()` não está bloqueando entrada
3. **Processamento de entrada**: Verificar se `hasVRInput()` está funcionando corretamente

### Debug Adicional

Adicione este código temporário no console do navegador:

```javascript
// Verificar se as funções existem
console.log("onLeftStickMove:", typeof window.droneController?.onLeftStickMove);
console.log(
	"onRightStickMove:",
	typeof window.droneController?.onRightStickMove
);

// Verificar valores atuais
setInterval(() => {
	const drone = document.querySelector("[drone-controller]");
	if (drone && drone.components["drone-controller"]) {
		const controller = drone.components["drone-controller"];
		console.log("Targets:", {
			forward: controller.targetForwardSpeed,
			strafe: controller.targetStrafeSpeed,
			altitude: controller.targetAltitudeChange,
			yaw: controller.targetYawRotation,
		});
	}
}, 1000);
```
