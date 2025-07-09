# 🚚 Entrega Fácil - Instalador para Comerciante

## 📋 Descrição
Este é o instalador oficial do sistema **Entrega Fácil** para comerciantes. O sistema é projetado para ser usado por **clientes finais** (comerciantes) que precisam solicitar entregas de forma simples e eficiente.

## 🎯 Funcionalidades

### ✅ Para o Comerciante (Cliente Final):
- **Solicitar entregas** com formulário simples
- **Acompanhar histórico** de entregas próprias
- **Interface amigável** sem complexidade técnica
- **Sistema local** que funciona offline após configuração
- **Sincronização automática** com servidor administrativo

### ❌ NÃO Inclui:
- Painel administrativo
- Gerenciamento de outros comerciantes
- Controle de entregadores
- Relatórios gerenciais
- Configurações avançadas

## 🔧 Instalação

### Pré-requisitos:
- Windows 10 ou superior
- Conexão com internet (apenas para instalação)
- Permissões de administrador

### Passos:
1. **Baixar** o arquivo `entrega-facil-comerciante-v3.0.zip`
2. **Descompactar** em qualquer pasta
3. **Executar** `instalador-comerciante.bat` **como Administrador**
4. **Aguardar** a instalação automática
5. **Acessar** o sistema no navegador

## 🚀 Como Usar

### 1. Iniciar o Sistema:
- Clique no atalho **"Entrega Fácil"** na área de trabalho
- OU execute `Iniciar Sistema.bat` na pasta de instalação

### 2. Acessar no Navegador:
- Abra qualquer navegador
- Acesse: `http://localhost:3000` (ou porta detectada)

### 3. Solicitar Entrega:
- Preencha o formulário com dados do cliente
- Confirme endereço de coleta (seu estabelecimento)
- Informe valor e forma de pagamento
- Clique em "Solicitar Entrega"

### 4. Acompanhar Entregas:
- Visualize o histórico na tabela inferior
- Status será atualizado automaticamente
- Sincronização com sistema administrativo

## 📁 Estrutura de Arquivos

```
C:\Users\[Usuario]\EntregaFacil\
├── server.js              # Servidor principal
├── config.json            # Configurações
├── package.json           # Dependências
├── Iniciar Sistema.bat    # Script de inicialização
├── data/
│   └── database.sqlite    # Banco de dados local
└── logs/
    ├── info.log          # Logs de informação
    └── error.log         # Logs de erro
```

## 🔄 Sincronização

O sistema sincroniza automaticamente com o servidor administrativo:
- **Entregas** são enviadas para o painel do proprietário
- **Status** é atualizado em tempo real
- **Dados** ficam disponíveis para gerenciamento central

## 🛠️ Solução de Problemas

### Porta Ocupada:
- O instalador detecta automaticamente uma porta livre
- Portas testadas: 3000, 3001, 3002, 8080, 8000, 5000, 4000, 9000

### Sistema Não Inicia:
1. Verifique se tem permissões de administrador
2. Execute novamente `Iniciar Sistema.bat`
3. Aguarde alguns segundos para inicialização

### Erro de Conexão:
- Verifique firewall do Windows
- Tente acessar `http://127.0.0.1:3000`
- Reinicie o sistema se necessário

## 📞 Suporte

Para suporte técnico:
- **Email**: suporte@entregafacil.com
- **Telefone**: (11) 9999-9999
- **Site**: https://entregafacil.com

## 📝 Notas Importantes

- ⚠️ **Este sistema é para uso exclusivo do comerciante**
- ⚠️ **Não possui funcionalidades administrativas**
- ⚠️ **Requer conexão inicial para sincronização**
- ⚠️ **Dados são armazenados localmente e sincronizados**

## 🔒 Segurança

- Dados armazenados localmente em SQLite
- Sincronização criptografada com servidor
- Logs de auditoria para todas as ações
- Sem acesso a dados de outros comerciantes

## 📈 Versão

**Versão Atual**: 3.0.0
**Data**: Janeiro 2025
**Compatibilidade**: Windows 10+

---
*Desenvolvido por Entrega Fácil - Soluções em Logística Local*