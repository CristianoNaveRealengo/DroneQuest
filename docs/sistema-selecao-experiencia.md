# 🎮 Sistema de Seleção de Experiência - Drone Racing VR

## 📅 Data: 14/10/2025

## ✨ Novas Funcionalidades

### 1. **Seletor de Experiência**

Permite ao usuário escolher entre duas experiências diferentes ao iniciar o jogo:

#### 🚁 **Modo Drone Simples**

-   Visão externa do drone (terceira pessoa)
-   Controle arcade simplificado
-   Câmera livre que segue o drone
-   Ideal para iniciantes
-   Modelo visual simples com hélices animadas

#### 🥽 **Modo Cockpit VR**

-   Visão de piloto (primeira pessoa)
-   Cockpit imersivo com modelo 3D
-   HUD com dados em tempo real
-   Compatível com VR (Quest)
-   Experiência completa de pilotagem

### 2. **Checkpoints Reativados**

-   ✅ 5 argolas (checkpoints) adicionadas ao percurso
-   ✅ Piloto deve passar por dentro das argolas
-   ✅ Sistema de progressão checkpoint por checkpoint
-   ✅ Feedback visual ao passar pelos checkpoints

### 3. **Debugger de Controles**

-   ✅ Ferramenta para identificar inversões de controle
-   ✅ Mostra teclas pressionadas em tempo real
-   ✅ Indica direção do movimento (X, Y, Z)
-   ✅ Detecta automaticamente inversões
-   ✅ Ativar/desativar com **Ctrl+D**

## 🎮 Como Usar

### Ao Iniciar o Jogo

1. **Menu de Seleção** aparece automaticamente
2. Escolha entre:
    - 🚁 **Drone Simples** (visão externa)
    - 🥽 **Cockpit VR** (visão de piloto)
3. Clique em **"INICIAR EXPERIÊNCIA"**
4. Sua escolha é salva automaticamente

### Durante o Jogo

-   Pressione **E** para trocar de experiência
-   Pressione **Ctrl+D** para ativar o debugger de controles
-   Passe pelas argolas verdes para completar o percurso

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

#### `js/experience-selector.js`

```javascript
// Gerencia seleção e troca de experiências
- Menu visual de seleção
- Criação dinâmica do drone simples
- Alternância entre modos
- Salvamento de preferência
- Notificações visuais
```

#### `js/control-debugger.js`

```javascript
// Ferramenta de debug para controles
- Monitora teclas pressionadas
- Calcula direção do movimento
- Detecta inversões automaticamente
- Painel visual em tempo real
```

#### `docs/sistema-selecao-experiencia.md`

```markdown
// Documentação completa do sistema
```

### Arquivos Modificados

#### `index.html`

```html
<!-- Alterações:
- Adicionado experience-selector na <a-scene>
- Adicionado control-debugger no drone
- Scripts carregados (experience-selector.js, control-debugger.js)
- 5 checkpoints reativados
-->
```

## 🎯 Checkpoints Adicionados

| ID  | Posição       | Descrição             |
| --- | ------------- | --------------------- |
| 1   | (0, 3, -15)   | Checkpoint inicial    |
| 2   | (10, 4, -30)  | Checkpoint à direita  |
| 3   | (-10, 5, -45) | Checkpoint à esquerda |
| 4   | (15, 3, -60)  | Checkpoint à direita  |
| 5   | (-5, 6, -75)  | Checkpoint final      |

## 🔧 Configuração

### Experiência Padrão

Edite no `index.html`:

```html
<a-scene experience-selector="defaultExperience: cockpit"></a-scene>
```

Opções:

-   `cockpit` - Modo Cockpit VR (padrão)
-   `drone` - Modo Drone Simples

### Ativar Debugger por Padrão

Edite no `index.html`:

```html
<a-entity id="drone" control-debugger="enabled: true"></a-entity>
```

## 🐛 Debugger de Controles

### Como Usar

1. Pressione **Ctrl+D** durante o jogo
2. Painel aparece no canto inferior esquerdo
3. Pressione teclas de movimento
4. Observe:
    - **Teclas**: Quais teclas estão pressionadas
    - **Movimento**: Direção real do movimento
    - **Posição**: Coordenadas X, Y, Z
    - **Rotação**: Pitch, Yaw, Roll

### Detecção de Inversões

O debugger detecta automaticamente:

-   ↑ movendo para trás (Z positivo) ❌
-   ↓ movendo para frente (Z negativo) ❌
-   ← movendo para direita (X positivo) ❌
-   → movendo para esquerda (X negativo) ❌
-   W movendo para baixo (Y negativo) ❌
-   S movendo para cima (Y positivo) ❌

### Cores do Movimento

-   🟡 **Amarelo**: Movimento para FRENTE (Z negativo)
-   🟣 **Magenta**: Movimento para TRÁS (Z positivo)
-   🔵 **Azul**: Movimento para ESQUERDA (X negativo)
-   🟠 **Laranja**: Movimento para DIREITA (X positivo)
-   🟢 **Verde**: Movimento para CIMA (Y positivo)
-   🔴 **Vermelho**: Movimento para BAIXO (Y negativo)

## 🎨 Personalização

### Menu de Seleção

Edite `js/experience-selector.js` para personalizar:

-   Cores do menu
-   Descrições das experiências
-   Ícones
-   Animações

### Drone Simples

O drone simples é criado dinamicamente com:

-   Corpo: Caixa laranja (1x0.3x1)
-   4 hélices rotativas
-   Câmera em terceira pessoa (0, 2, 5)

Para personalizar, edite a função `createSimpleDrone()` em `experience-selector.js`.

## 📊 Armazenamento Local

O sistema salva automaticamente:

-   **Chave**: `droneExperience`
-   **Valores**: `"drone"` ou `"cockpit"`
-   **Localização**: localStorage do navegador

## 🧪 Testes Recomendados

### Seleção de Experiência

1. ✅ Abrir jogo e ver menu de seleção
2. ✅ Selecionar Drone Simples
3. ✅ Verificar visão externa
4. ✅ Pressionar E para trocar
5. ✅ Verificar mudança para Cockpit
6. ✅ Recarregar página e verificar preferência salva

### Checkpoints

1. ✅ Voar até primeiro checkpoint
2. ✅ Passar por dentro da argola
3. ✅ Verificar feedback visual
4. ✅ Continuar para próximos checkpoints
5. ✅ Completar todos os 5 checkpoints

### Debugger de Controles

1. ✅ Pressionar Ctrl+D
2. ✅ Ver painel de debug
3. ✅ Pressionar ↑ e verificar movimento FRENTE
4. ✅ Pressionar ↓ e verificar movimento TRÁS
5. ✅ Pressionar ← e verificar movimento ESQUERDA
6. ✅ Pressionar → e verificar movimento DIREITA
7. ✅ Pressionar W e verificar movimento CIMA
8. ✅ Pressionar S e verificar movimento BAIXO
9. ✅ Verificar se há avisos de inversão no console

## 🔍 Solução de Problemas

### Controles Ainda Invertidos?

1. Ative o debugger (Ctrl+D)
2. Teste cada tecla individualmente
3. Observe a direção do movimento
4. Se houver inversão, verifique:
    - Console do navegador (F12)
    - Avisos de inversão detectados
    - Arquivo `js/drone-controller.js`

### Menu Não Aparece?

1. Verifique console (F12)
2. Procure por erros de JavaScript
3. Confirme que `experience-selector.js` está carregado
4. Verifique se `<a-scene>` tem o componente `experience-selector`

### Checkpoints Não Funcionam?

1. Verifique se `checkpoint-system.js` está carregado
2. Confirme que checkpoints têm o componente `checkpoint`
3. Verifique posições dos checkpoints no console
4. Teste passar bem no centro da argola

## 📝 Notas Importantes

-   ✅ Sistema de seleção funciona em Desktop e VR
-   ✅ Preferência é salva automaticamente
-   ✅ Troca de experiência em tempo real (tecla E)
-   ✅ Debugger não afeta performance quando desativado
-   ✅ Checkpoints seguem ordem sequencial
-   ⚠️ Drone simples é criado dinamicamente (não existe no HTML)

## 🚀 Próximos Passos Sugeridos

1. **Adicionar mais checkpoints** para percurso mais longo
2. **Criar sistema de tempo** para cada checkpoint
3. **Adicionar efeitos visuais** ao passar pelos checkpoints
4. **Implementar placar** de melhores tempos
5. **Adicionar sons** para feedback de checkpoint
6. **Criar tutorial** interativo para novos jogadores

---

## ✅ Status: IMPLEMENTADO

Todas as funcionalidades foram implementadas e testadas com sucesso!

**Use Ctrl+D para debugar controles e identificar inversões!**
