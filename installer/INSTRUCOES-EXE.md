# 🚀 Instruções Rápidas - Instalador EXE

## 📋 Para Criar o Instalador EXE

### **1. Preparar**
```bash
cd installer
npm install
```

### **2. Construir**
```bash
# Opção Fácil
build-exe.bat

# Opção Manual
npx electron-builder --win
```

### **3. Resultado**
- Arquivo EXE em `dist/`
- Pronto para distribuição

## 📋 Para Usar o Instalador

### **1. Executar**
- Clique duplo no arquivo EXE
- Execute como Administrador

### **2. Seguir Passos**
1. **Verificação**: Aguarde check automático
2. **Configuração**: Preencha dados do negócio
3. **Instalação**: Aguarde processo completo

### **3. Finalizar**
- Teste o sistema
- Abra automaticamente
- Use o atalho criado

## ⚡ Requisitos Mínimos

- Windows 10+
- Node.js 16+
- 500MB espaço livre
- Conexão internet

## 🔧 Solução Rápida

### **Node.js não encontrado?**
1. Baixe: https://nodejs.org
2. Instale versão LTS
3. Reinicie PC
4. Execute instalador novamente

### **Porta ocupada?**
- Automático: Sistema detecta porta livre
- Manual: Escolha porta diferente na configuração

### **Permissão negada?**
- Clique direito no EXE
- "Executar como Administrador"

## 📞 Suporte

### **Ferramentas Incluídas:**
- Verificação automática de requisitos
- Teste de instalação integrado
- Logs detalhados de erro
- Diagnóstico completo

### **Arquivos de Log:**
- `logs/info.log` - Informações gerais
- `logs/error.log` - Erros do sistema

---

**Pronto para usar!** O instalador EXE torna a distribuição do sistema muito mais profissional e fácil para seus clientes.