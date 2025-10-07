# Requirements Document

## Introduction

Esta especificação define os requisitos para implementar inclinação estilo FPV (First Person View) no drone do simulador VR. O objetivo é tornar o comportamento do drone mais realista, fazendo com que ele se incline fisicamente durante movimentos de aceleração, desaceleração e mudanças de direção, similar aos drones FPV reais.

## Requirements

### Requirement 1

**User Story:** Como um piloto de drone VR, eu quero que o drone se incline fisicamente durante movimentos para frente/trás, para que a experiência seja mais realista e imersiva como um drone FPV real.

#### Acceptance Criteria

1. WHEN o usuário move a alavanca direita para frente THEN o drone SHALL inclinar para frente (pitch negativo) proporcionalmente à intensidade do movimento
2. WHEN o usuário move a alavanca direita para trás THEN o drone SHALL inclinar para trás (pitch positivo) proporcionalmente à intensidade do movimento
3. WHEN o usuário para de aplicar entrada de movimento THEN o drone SHALL retornar gradualmente à posição nivelada
4. WHEN a intensidade do movimento for máxima THEN a inclinação máxima SHALL ser limitada a 30 graus para manter controle

### Requirement 2

**User Story:** Como um piloto de drone VR, eu quero que o drone se incline lateralmente durante movimentos para os lados, para que simule o comportamento real de um drone FPV.

#### Acceptance Criteria

1. WHEN o usuário move a alavanca direita para a direita THEN o drone SHALL inclinar para a direita (roll positivo) proporcionalmente à intensidade do movimento
2. WHEN o usuário move a alavanca direita para a esquerda THEN o drone SHALL inclinar para a esquerda (roll negativo) proporcionalmente à intensidade do movimento
3. WHEN há movimento diagonal (frente+direita) THEN o drone SHALL combinar inclinações de pitch e roll apropriadamente
4. WHEN a inclinação lateral for aplicada THEN a inclinação máxima SHALL ser limitada a 25 graus para os lados

### Requirement 3

**User Story:** Como um piloto de drone VR, eu quero que a inclinação seja suave e responsiva, para que não cause desconforto ou movimentos bruscos durante o voo.

#### Acceptance Criteria

1. WHEN a inclinação for aplicada THEN a transição SHALL ser suave usando interpolação
2. WHEN o modo cinematográfico estiver ativo THEN as inclinações SHALL ser reduzidas em 50% para movimentos mais suaves
3. WHEN o drone estiver em modo boost THEN as inclinações SHALL ser aumentadas em 20% para maior dramaticidade
4. WHEN o sistema de auto-nivelamento estiver ativo THEN ele SHALL trabalhar em conjunto com as inclinações FPV sem conflito

### Requirement 4

**User Story:** Como um piloto de drone VR, eu quero que as inclinações sejam configuráveis, para que possa ajustar a intensidade conforme minha preferência.

#### Acceptance Criteria

1. WHEN o sistema for inicializado THEN SHALL haver parâmetros configuráveis para intensidade máxima de pitch e roll
2. WHEN o usuário pressionar uma tecla específica THEN SHALL poder alternar entre modo FPV ativo/inativo
3. WHEN o modo FPV estiver desativado THEN o drone SHALL manter comportamento atual sem inclinações
4. WHEN as configurações forem alteradas THEN SHALL mostrar feedback visual da mudança

### Requirement 5

**User Story:** Como um piloto de drone VR, eu quero que as inclinações sejam visualmente realistas, para que as hélices e efeitos visuais acompanhem o movimento.

#### Acceptance Criteria

1. WHEN o drone inclinar THEN as hélices SHALL manter suas animações corretas na nova orientação
2. WHEN houver inclinação significativa THEN os efeitos de empuxo das hélices SHALL ser ajustados visualmente
3. WHEN o drone estiver inclinado THEN o HUD SHALL mostrar os ângulos de pitch e roll atuais
4. WHEN a inclinação for extrema THEN SHALL haver indicação visual de alerta para o piloto