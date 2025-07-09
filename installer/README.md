# Entrega Fácil - Instalador do Sistema

## Descrição

Este é o instalador oficial do sistema Entrega Fácil para clientes. O instalador configura uma versão local do sistema no computador do cliente, mantendo os dados localmente mas sincronizando com o painel administrativo central.

## Características

- **Instalação Local**: Sistema roda completamente no computador do cliente
- **Banco de Dados SQLite**: Dados armazenados localmente para máxima velocidade
- **Sincronização Automática**: Dados são enviados para o painel admin a cada 15 minutos
- **Auto-inicialização**: Sistema inicia automaticamente com o Windows
- **Interface Web**: Acesso via navegador em `http://localhost:3000`

## Requisitos do Sistema

- Windows 10 ou superior
- Node.js 18 ou superior
- 500MB de espaço livre em disco
- Conexão com internet para sincronização

## Como Usar

### 1. Preparação do Instalador

```bash
# Instalar dependências
npm install

# Construir executável para Windows
npm run build-win

# Construir para Linux
npm run build-linux

# Construir para macOS
npm run build-mac
```

### 2. Execução do Instalador

```bash
# Executar diretamente (desenvolvimento)
npm start

# Ou usar o executável gerado
./dist/installer.exe
```

### 3. Processo de Instalação

O instalador irá:

1. **Verificar Requisitos**: Confirmar que Node.js está instalado
2. **Coletar Informações**: Solicitar dados do negócio e configurações
3. **Criar Diretórios**: Estrutura de pastas em `~/EntregaFacil`
4. **Configurar Banco**: Criar banco SQLite local
5. **Instalar Aplicação**: Baixar e configurar sistema
6. **Configurar Sincronização**: Serviço automático de envio de dados
7. **Iniciar Sistema**: Aplicação rodando em `http://localhost:3000`

## Configuração de Sincronização

### Fluxo de Dados

```
Cliente Local (SQLite) → Sincronização → Painel Admin (PostgreSQL)
```

### Tabelas Sincronizadas

- **merchants**: Dados dos comerciantes
- **deliverers**: Dados dos entregadores  
- **deliveries**: Informações das entregas

### Campos de Controle

Cada tabela possui campos para controle de sincronização:

- `synced_at`: Data/hora da última sincronização
- `sync_status`: Status (`pending`, `synced`, `error`)

## Estrutura de Arquivos

```
~/EntregaFacil/
├── app/                    # Aplicação principal
│   ├── server.js          # Servidor Express
│   ├── package.json       # Dependências
│   ├── .env              # Variáveis de ambiente
│   └── public/           # Arquivos estáticos
├── config.json           # Configurações do cliente
├── database.sqlite       # Banco de dados local
├── sync-service.js       # Serviço de sincronização
├── logs/                 # Logs do sistema
└── backup/               # Backups automáticos
```

## API de Sincronização

### Endpoints do Painel Admin

- `POST /api/clients/{clientId}/merchants` - Receber comerciantes
- `POST /api/clients/{clientId}/deliverers` - Receber entregadores
- `POST /api/clients/{clientId}/deliveries` - Receber entregas

### Autenticação

- Header: `Authorization: Bearer {adminKey}`
- Chave fornecida durante instalação

## Configurações Personalizáveis

### Frequência de Sincronização

Padrão: 15 minutos
Editável em: `sync-service.js`

```javascript
// Alterar cron pattern
cron.schedule('*/15 * * * *', syncFunction);
```

### Porta Local

Padrão: 3000
Editável em: `.env`

```env
PORT=3000
```

## Solução de Problemas

### Sistema não inicia

1. Verificar se Node.js está instalado
2. Conferir se porta 3000 está livre
3. Verificar logs em `~/EntregaFacil/logs/`

### Sincronização falhando

1. Verificar conexão com internet
2. Confirmar chave de licença válida
3. Verificar status em `sync_log` do banco

### Banco corrompido

1. Parar aplicação
2. Restaurar backup de `~/EntregaFacil/backup/`
3. Reiniciar sistema

## Comandos Úteis

```bash
# Verificar status do sistema
curl http://localhost:3000/api/status

# Forçar sincronização
curl -X POST http://localhost:3000/api/sync

# Backup manual
curl -X POST http://localhost:3000/api/backup
```

## Desinstalação

Para remover completamente o sistema:

1. Parar aplicação
2. Remover pasta `~/EntregaFacil`
3. Remover entrada do startup do Windows
4. Remover atalho da área de trabalho

## Suporte

- Email: suporte@entregafacil.com
- Telefone: (11) 9999-9999
- Documentação: https://docs.entregafacil.com

## Licença

Este software é licenciado apenas para uso com chave válida fornecida pela Entrega Fácil.