# 🚚 Instalador EXE Entrega Fácil

## 📋 Visão Geral

Este é um instalador com interface gráfica (GUI) profissional para o sistema Entrega Fácil, desenvolvido com Electron para proporcionar uma experiência de instalação moderna e intuitiva.

## ✨ Características

### 🎯 **Interface Gráfica Moderna**
- Design responsivo e atrativo
- Processo de instalação passo a passo
- Verificação automática de requisitos
- Progress bar visual
- Mensagens de status em tempo real

### 🔧 **Funcionalidades Avançadas**
- **Verificação Automática**: Detecta Node.js e portas disponíveis
- **Configuração Personalizada**: Permite configurar dados do negócio
- **Seleção de Pasta**: Escolher local de instalação
- **Detecção de Porta**: Encontra automaticamente porta livre
- **Teste Integrado**: Testa a instalação antes de finalizar
- **Abertura Automática**: Abre o sistema após instalação

### 🛡️ **Segurança e Confiabilidade**
- Validação completa de requisitos
- Tratamento robusto de erros
- Logs detalhados de instalação
- Verificação de integridade do sistema

## 🚀 Como Criar o Instalador EXE

### **Pré-requisitos:**
1. Node.js instalado (versão 16+)
2. Windows 10 ou superior
3. Conexão com internet

### **Passos para Criar:**

#### **1. Preparar Ambiente**
```bash
# Navegar para a pasta installer
cd installer

# Instalar dependências
npm install
```

#### **2. Construir o EXE**
```bash
# Opção 1: Usar o script automático
build-exe.bat

# Opção 2: Comando manual
npx electron-builder --win
```

#### **3. Resultado**
- Arquivo EXE criado em `dist/`
- Instalador completo com interface gráfica
- Pronto para distribuição

## 📁 Estrutura de Arquivos

```
installer/
├── installer-gui.js        # Código principal do Electron
├── installer-ui.html       # Interface HTML
├── package-installer.json  # Configuração do projeto
├── build-exe.bat          # Script de construção
├── assets/                # Recursos (ícones, imagens)
└── dist/                  # Arquivos compilados
```

## 🎨 Interface do Instalador

### **Passo 1: Verificação de Requisitos**
- ✅ Verificação automática do Node.js
- ✅ Detecção de portas disponíveis
- ✅ Validação do sistema operacional
- ✅ Verificação de permissões

### **Passo 2: Configuração do Negócio**
- 📝 Nome do estabelecimento
- 📞 Telefone de contato
- 📍 Endereço completo
- 📧 Email (opcional)
- 📁 Pasta de instalação
- 🌐 Porta do sistema

### **Passo 3: Instalação**
- ⚙️ Criação de diretórios
- 📦 Instalação de dependências
- 🔧 Configuração do sistema
- 🔗 Criação de atalhos
- ✅ Teste de funcionamento

## 🔧 Configurações Técnicas

### **Electron Builder**
```json
{
  "appId": "com.entregafacil.installer",
  "productName": "Entrega Fácil - Instalador",
  "target": "nsis",
  "oneClick": false,
  "allowElevation": true,
  "createDesktopShortcut": true
}
```

### **Funcionalidades IPC**
- `check-requirements`: Verifica requisitos do sistema
- `select-install-path`: Seleção de pasta de instalação
- `start-installation`: Inicia processo de instalação
- `test-installation`: Testa instalação concluída
- `open-system`: Abre sistema após instalação

## 🎯 Arquitetura do Sistema Instalado

### **Para o Cliente (Comerciante):**
```
EntregaFacil/
├── server.js              # Servidor local
├── config.json            # Configurações
├── package.json           # Dependências
├── data/
│   └── database.sqlite    # Banco SQLite
├── logs/
│   ├── info.log          # Logs de informação
│   └── error.log         # Logs de erro
└── Iniciar Sistema.bat   # Script de inicialização
```

### **Funcionalidades do Sistema:**
- ✅ **Interface Simples**: Apenas solicitação de entregas
- ✅ **Banco Local**: SQLite para armazenamento
- ✅ **Sincronização**: Dados enviados ao admin central
- ✅ **Logs**: Auditoria completa
- ✅ **Responsivo**: Funciona em qualquer dispositivo

## 📊 Dados Coletados

### **Informações do Negócio:**
- Nome do estabelecimento
- Endereço completo
- Telefone de contato
- Email (opcional)

### **Configurações Técnicas:**
- Porta do sistema
- Pasta de instalação
- Data de instalação
- Versão do sistema

## 🛠️ Solução de Problemas

### **Problemas Comuns:**

#### **1. Node.js não encontrado**
```
Solução: Instalar Node.js
1. Acesse: https://nodejs.org
2. Baixe versão LTS
3. Execute como Administrador
4. Reinicie o computador
```

#### **2. Porta em uso**
```
Solução: Automática
- O instalador detecta automaticamente portas livres
- Testa múltiplas portas: 3000, 3001, 3002, etc.
```

#### **3. Permissões insuficientes**
```
Solução: Executar como Administrador
- Clique com botão direito no instalador
- Selecione "Executar como Administrador"
```

## 🔄 Processo de Atualização

### **Para Futuras Versões:**
1. Modificar `installer-gui.js` ou `installer-ui.html`
2. Atualizar versão em `package-installer.json`
3. Executar `build-exe.bat`
4. Distribuir novo instalador

## 📈 Vantagens do Instalador EXE

### **Para o Proprietário:**
- ✅ Distribuição profissional
- ✅ Instalação padronizada
- ✅ Redução de suporte técnico
- ✅ Melhor experiência do cliente

### **Para o Cliente:**
- ✅ Instalação simples e rápida
- ✅ Interface intuitiva
- ✅ Verificação automática
- ✅ Teste integrado

## 🎯 Resultado Final

Após a instalação, o cliente terá:
- ✅ Sistema funcionando em `http://localhost:PORTA`
- ✅ Atalho na área de trabalho
- ✅ Interface para solicitar entregas
- ✅ Sincronização automática com admin
- ✅ Logs de auditoria completos

---

**Versão**: 1.0.0 - Instalador EXE Completo  
**Data**: Janeiro 2025  
**Tecnologia**: Electron + Node.js  
**Compatibilidade**: Windows 10+