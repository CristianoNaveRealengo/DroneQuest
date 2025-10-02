# Controles VR - Meta Quest 3

## Configuração dos Controles

### 🕹️ Joystick Esquerdo

-   **Eixo X (Horizontal)**: Movimento lateral (strafe esquerda/direita) - equivalente a A/D
-   **Eixo Y (Vertical)**: Movimento frontal (frente/trás) - equivalente a W/S

### 🕹️ Joystick Direito

-   **Eixo X (Horizontal)**: Rotação Yaw (girar esquerda/direita)
-   **Eixo Y (Vertical)**: Altitude (subir/descer)

### 🎯 Gatilhos (Triggers)

-   **Gatilho Esquerdo**: Ativar/Desativar drone
-   **Gatilho Direito**: Modo boost (velocidade aumentada)

### 🤏 Grips

-   **Grip Esquerdo**: Alternar auto-nivelamento ON/OFF
-   **Grip Direito**: (Reservado para futuras funcionalidades)

## Características Técnicas

### Deadzone

-   Aplicado automaticamente para evitar movimentos indesejados
-   Configurado para filtrar pequenos movimentos dos joysticks

### Sensibilidade

-   **Rotação**: Controlada pela propriedade `rotationSpeed`
-   **Movimento**: Controlada pela propriedade `maxSpeed`
-   **Altitude**: 30% da velocidade máxima para controle suave

### Ativação Automática

-   O drone é ativado automaticamente 1 segundo após a inicialização
-   Não é mais necessário pressionar gatilhos para ativar

## Como Usar

1. **Entrar no VR**: Pressione o botão VR no navegador
2. **Ativar Drone**: Pressione o gatilho esquerdo para ligar/desligar
3. **Movimento**: Use o joystick esquerdo como WASD tradicional
4. **Altitude**: Use o joystick direito (eixo Y) para subir/descer
5. **Rotação**: Use o joystick direito (eixo X) para girar esquerda/direita
6. **Boost**: Mantenha o gatilho direito pressionado para velocidade extra
7. **Estabilização**: Pressione grip esquerdo para auto-nivelamento

## Compatibilidade

-   ✅ Meta Quest 3
-   ✅ Meta Quest 2
-   ✅ Outros headsets compatíveis com WebXR

## Notas de Performance

-   Otimizado para VR com geometrias simplificadas
-   Sistema de LOD ativo para manter FPS estável
-   Monitor de performance integrado com ajuste automático de qualidade
