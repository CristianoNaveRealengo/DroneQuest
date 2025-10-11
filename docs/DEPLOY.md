# 🚀 Guia de Deploy - InfinityFree

## Configuração Inicial

### 1. Arquivo de Configuração

O arquivo `.ftpconfig.json` já está configurado com suas credenciais do InfinityFree e **não será commitado** no Git (protegido pelo `.gitignore`).

### 2. Estrutura de Deploy

-   **Pasta local**: `dist/` (somente o conteúdo desta pasta será enviado)
-   **Servidor FTP**: ftpupload.net (porta 21)
-   **Pasta remota**: `/htdocs` (raiz do site)
-   **Domínio**: ram4org1.infinityfree.com

## Como Fazer Deploy

### Deploy Completo (Build + Upload)

```bash
npm run deploy
```

Este comando:

1. Executa `npm run build` (gera a pasta dist otimizada)
2. Faz upload de todo conteúdo da pasta `dist` para o servidor

### Deploy Rápido (Somente Upload)

```bash
npm run deploy:only
```

Envia a pasta `dist` atual sem fazer novo build (útil para deploys rápidos).

## Informações do Servidor

-   **FTP Hostname**: ftpupload.net
-   **FTP Username**: if0_40059158
-   **MySQL Hostname**: sql302.infinityfree.com
-   **MySQL Username**: if0_40059158
-   **Domínio Principal**: ram4org1.infinityfree.com
-   **Domínio Alternativo**: dronequest.free.nf

## Segurança

⚠️ **IMPORTANTE**:

-   O arquivo `.ftpconfig.json` contém credenciais sensíveis
-   Este arquivo está no `.gitignore` e **nunca** será commitado
-   Use `.ftpconfig.example.json` como referência para novos ambientes

## Troubleshooting

### Erro: "Arquivo .ftpconfig.json não encontrado"

Certifique-se de que o arquivo `.ftpconfig.json` existe na raiz do projeto.

### Erro de Conexão FTP

-   Verifique se as credenciais estão corretas
-   Confirme que a porta 21 está acessível
-   InfinityFree pode ter limitações de conexões simultâneas

### Pasta dist vazia

Execute `npm run build` antes de fazer deploy.

## Observações

-   O deploy **não deleta** arquivos remotos, apenas adiciona/atualiza
-   Arquivos são enviados via FTP padrão (não SFTP/SSH)
-   O progresso do upload é exibido no terminal
