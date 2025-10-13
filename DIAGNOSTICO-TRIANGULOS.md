# 🔍 Diagnóstico de Triângulos em Vermelho

## Problema

Os triângulos continuam em VERMELHO mesmo após múltiplas otimizações.

## Testes Realizados

### ✅ Otimizações Aplicadas

1. ❌ Removido chão gigante (10000×10000 → 500×500)
2. ❌ Removido sky gigante (5000m → comentado)
3. ❌ Removidos NPCs (Abby models)
4. ❌ Removidos morros (3 cones)
5. ❌ Removidas casas 2D (15 planos com look-at)
6. ❌ Removida Casa-e-Lojinha.glb
7. ❌ Removidos Árvore, Prédio, Escada
8. ❌ Substituídos gols GLB por primitivas
9. ❌ Reduzidos segmentos de todos os cilindros
10. ❌ Reduzidos segmentos dos checkpoints
11. ❌ Removidos checkpoints

## 🎯 Possíveis Causas Restantes

### 1. Textura do Chão

```html
<a-plane material="src: #ground-texture"></a-plane>
```

**Problema**: A textura pode estar gerando muitos polígonos internamente.
**Solução**: Remover textura, usar apenas cor sólida.

### 2. Cilindros dos Gols

```html
<a-cylinder segments-radial="6"></a-cylinder>
```

**Problema**: Ainda temos 6 cilindros (3 por gol × 2 gols).
**Solução**: Remover completamente ou usar boxes.

### 3. Hélices do Drone

```html
<a-entity id="prop1-4" geometry="primitive: cylinder"></a-entity>
```

**Problema**: 4 cilindros girando constantemente.
**Solução**: Simplificar ou remover.

### 4. HUD Controller

```html
hud-controller="enabled: true"
```

**Problema**: Pode estar gerando geometria invisível.
**Solução**: Desativar completamente.

### 5. Sistema de Colisão

```html
model-collision="visible: false"
```

**Problema**: Caixas de colisão invisíveis ainda são geometrias.
**Solução**: Verificar se estão sendo contadas.

## 📊 Contagem Estimada Atual

| Elemento                       | Triângulos Estimados |
| ------------------------------ | -------------------- |
| Chão (500×500, 1×1 seg)        | 2                    |
| Drone corpo                    | 12                   |
| Drone hélices (4×)             | ~200                 |
| Gol esquerdo (3 cil + 1 plane) | ~60                  |
| Gol direito (3 cil + 1 plane)  | ~60                  |
| Luzes (2 point)                | 0                    |
| **TOTAL**                      | **~334**             |

## ❓ Por que ainda está vermelho?

### Hipóteses:

1. **Limite muito baixo**: O A-Frame pode considerar >300 triângulos como "alto" para VR.

2. **Geometrias ocultas**: Pode haver geometrias sendo geradas por componentes que não vemos.

3. **Instanciamento**: O sistema de instanciamento pode estar duplicando geometrias.

4. **Textura**: A textura do chão pode estar sendo subdividida internamente.

5. **Colisão**: As caixas de colisão invisíveis podem estar sendo contadas.

## 🧪 Teste Definitivo

Criei `index-minimal.html` com:

-   ✅ Apenas 1 box (drone)
-   ✅ Apenas 1 plane (chão)
-   ✅ Sem texturas
-   ✅ Sem gols
-   ✅ Sem checkpoints
-   ✅ Sem colisão
-   ✅ Sem HUD

**Triângulos esperados**: ~14 (12 box + 2 plane)

## 🎯 Próximos Passos

1. **Testar index-minimal.html**

    - Se ficar verde → problema está nos elementos removidos
    - Se ficar vermelho → problema é no A-Frame ou configuração

2. **Se minimal ficar verde**, adicionar elementos um por um:

    - Adicionar texturas
    - Adicionar hélices
    - Adicionar gols
    - Adicionar checkpoints
    - Identificar qual elemento causa o vermelho

3. **Se minimal ficar vermelho**, verificar:
    - Configuração do renderer
    - Versão do A-Frame
    - Configuração do stats
    - Limite de triângulos do sistema

## 💡 Soluções Alternativas

### Se o problema persistir:

1. **Aceitar o vermelho**: Se FPS está bom (>60), o vermelho pode ser apenas um aviso conservador.

2. **Desativar stats**: Remover `stats` da a-scene se não for necessário.

3. **Usar LOD**: Implementar Level of Detail para reduzir geometria à distância.

4. **Usar Impostors**: Substituir objetos distantes por sprites 2D.

## 📝 Comandos para Teste

```bash
# Abrir versão minimal
start index-minimal.html

# Verificar triângulos
# Olhar stats no canto superior esquerdo
```

---

**Data**: 2025-10-12  
**Status**: Investigando  
**FPS Atual**: 166+ (excelente)  
**Triângulos**: ~300-500 (deveria estar verde)
