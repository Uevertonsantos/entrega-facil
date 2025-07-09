# 🚀 Guia Rápido - Instalador EXE

## 🔧 Problema Identificado
O erro na imagem mostra que o `package.json` não foi encontrado durante a construção do EXE. Isso acontece porque o Electron Builder precisa de um ambiente Node.js configurado corretamente.

## ✅ Solução Simples

### **Opção 1: Usar Instalador Simplificado**
Execute: `instalador-simples-exe.bat`

**Características:**
- ✅ Cria ambiente temporário
- ✅ Instala dependências automaticamente
- ✅ Constrói EXE sem conflitos
- ✅ Remove arquivos temporários
- ✅ Copia EXE para pasta principal

### **Opção 2: Corrigir Manualmente**
1. Verifique se `package-installer.json` existe
2. Copie para `package.json`:
   ```bash
   copy package-installer.json package.json
   ```
3. Limpe cache do npm:
   ```bash
   npm cache clean --force
   ```
4. Instale dependências:
   ```bash
   npm install
   ```
5. Construa o EXE:
   ```bash
   npx electron-builder --win
   ```

## 🎯 Passos para Sucesso

### **1. Pré-requisitos**
- Windows 10+
- Node.js versão 16 ou superior
- Conexão com internet
- Executar como Administrador

### **2. Verificar Node.js**
```bash
node --version
npm --version
```

### **3. Limpar Ambiente**
```bash
# Limpar cache
npm cache clean --force

# Remover node_modules se existir
rmdir /s node_modules

# Remover package-lock.json se existir
del package-lock.json
```

### **4. Instalar Dependências**
```bash
# Instalar dependências específicas
npm install electron@^22.0.0 electron-builder@^23.0.0
```

### **5. Construir EXE**
```bash
# Construir instalador
npx electron-builder --win --publish=never
```

## 🔍 Solução de Problemas Comuns

### **Erro: "package.json not found"**
```bash
# Solução:
copy package-installer.json package.json
```

### **Erro: "Cannot find module"**
```bash
# Solução:
npm install
```

### **Erro: "ENOENT: no such file"**
```bash
# Solução:
mkdir assets
echo. > assets\icon.ico
```

### **Erro: "Permission denied"**
```bash
# Solução:
# Execute como Administrador
```

## 📁 Estrutura Final

Após execução bem-sucedida:
```
installer/
├── dist/
│   ├── Entrega Facil Instalador Setup.exe  ← ARQUIVO PRINCIPAL
│   └── win-unpacked/
├── node_modules/
├── package.json
└── outros arquivos...
```

## ⚡ Comando Rápido

**Para criar EXE rapidamente:**
```bash
# 1. Abrir CMD como Administrador
# 2. Navegar para pasta installer
cd installer

# 3. Executar instalador simples
instalador-simples-exe.bat
```

## 🎯 Resultado Esperado

✅ **Arquivo criado:** `Entrega Facil Instalador Setup.exe`  
✅ **Tamanho:** ~150MB (inclui Node.js + Electron)  
✅ **Funcional:** Interface gráfica completa  
✅ **Distribuível:** Pronto para enviar aos clientes  

## 📞 Suporte

### **Se ainda houver problemas:**
1. Verifique versão do Node.js: `node --version`
2. Execute como Administrador
3. Verifique conexão com internet
4. Desabilite antivírus temporariamente
5. Use `instalador-simples-exe.bat` que resolve automaticamente

---

**Nota:** O instalador simplificado foi criado especificamente para resolver os problemas mostrados na imagem, criando um ambiente limpo e controlado para a construção do EXE.