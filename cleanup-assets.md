# Assets Cleanup Report

## Assets Utilizados (Manter):

-   ✅ `AbbyRoupaClara.glb` - Personagem Abby (usado no index.html)

## Assets Não Utilizados (Podem ser removidos):

-   ❌ `Super Drone.glb` - Modelo de drone não utilizado
-   ❌ `scene.gltf` + `scene.bin` - Cena não utilizada
-   ❌ Todos os outros 80+ arquivos .glb não referenciados no código

## Recomendação:

Manter apenas `AbbyRoupaClara.glb` e remover todos os outros assets para:

-   Reduzir tamanho do projeto de ~500MB para ~5MB
-   Melhorar tempo de carregamento
-   Simplificar manutenção

## Assets que podem ser úteis no futuro (backup recomendado):

-   `Super Drone.glb` - Caso queira substituir o drone procedural
-   `Predio.glb`, `Predio em L.glb` - Para cenários urbanos futuros
-   `Carro.glb` - Para adicionar veículos
