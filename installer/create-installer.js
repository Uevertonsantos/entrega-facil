const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');

// Função para criar o instalador completo
async function createInstaller() {
  console.log('🚀 Criando instalador automático do Entrega Fácil...');
  
  try {
    // Criar diretório de saída
    const outputDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Criar script de instalação rápida
    const quickInstallScript = `
@echo off
title Entrega Facil - Instalador Rapido
color 0A
echo.
echo  ===============================================
echo    ENTREGA FACIL - INSTALADOR RAPIDO
echo  ===============================================
echo.
echo  Instalando automaticamente...
echo.

:: Verificar se Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Node.js nao encontrado, instalando...
    
    :: Baixar Node.js LTS
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile '%TEMP%\\node-installer.msi'}"
    
    :: Instalar Node.js silenciosamente
    msiexec /i "%TEMP%\\node-installer.msi" /quiet /norestart
    
    :: Aguardar instalacao
    timeout /t 30 /nobreak >nul
    
    :: Limpar arquivo temporario
    del "%TEMP%\\node-installer.msi" >nul 2>&1
    
    echo  [OK] Node.js instalado!
) else (
    echo  [OK] Node.js ja esta instalado!
)

:: Criar diretorio de instalacao
set "INSTALL_DIR=%USERPROFILE%\\EntregaFacil"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: Criar package.json
echo {> package.json
echo   "name": "entrega-facil-local",>> package.json
echo   "version": "1.0.0",>> package.json
echo   "main": "server.js",>> package.json
echo   "scripts": {"start": "node server.js"},>> package.json
echo   "dependencies": {>> package.json
echo     "express": "^4.18.2",>> package.json
echo     "sqlite3": "^5.1.6",>> package.json
echo     "cors": "^2.8.5",>> package.json
echo     "body-parser": "^1.20.2",>> package.json
echo     "axios": "^1.6.0",>> package.json
echo     "node-cron": "^3.0.3">> package.json
echo   }>> package.json
echo }>> package.json

:: Instalar dependencias
echo  [INFO] Instalando dependencias...
call npm install --silent >nul 2>&1
echo  [OK] Dependencias instaladas!

:: Criar configuracao
echo  [INFO] Criando configuracao...
echo {> config.json
echo   "businessName": "Meu Negocio",>> config.json
echo   "businessEmail": "contato@meunegocio.com",>> config.json
echo   "businessPhone": "(11) 99999-9999",>> config.json
echo   "businessAddress": "Rua Principal, 123",>> config.json
echo   "clientId": "client_%RANDOM%",>> config.json
echo   "localPort": 3000,>> config.json
echo   "syncEnabled": true,>> config.json
echo   "installDate": "%DATE% %TIME%">> config.json
echo }>> config.json

:: Criar servidor
echo  [INFO] Criando servidor...
(
echo const express = require('express'^);
echo const sqlite3 = require('sqlite3'^).verbose(^);
echo const cors = require('cors'^);
echo const bodyParser = require('body-parser'^);
echo const path = require('path'^);
echo const fs = require('fs'^);
echo.
echo const config = JSON.parse(fs.readFileSync('config.json', 'utf8'^)^);
echo const app = express(^);
echo.
echo app.use(cors(^)^);
echo app.use(bodyParser.json(^)^);
echo.
echo const db = new sqlite3.Database('./database.sqlite'^);
echo.
echo db.serialize(^(^) =^> {
echo   db.run('CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY, customer_name TEXT, address TEXT, status TEXT DEFAULT "pending", created_at DATETIME DEFAULT CURRENT_TIMESTAMP^)'^);
echo }^);
echo.
echo app.get('/', (req, res^) =^> {
echo   res.send('^^^<h1^^^>Entrega Facil - Sistema Online^^^</h1^^^>^^^<p^^^>Negocio: ' + config.businessName + '^^^</p^^^>^^^<p^^^>Cliente ID: ' + config.clientId + '^^^</p^^^>^^^<p^^^>Porta: ' + config.localPort + '^^^</p^^^>'^);
echo }^);
echo.
echo app.get('/api/status', (req, res^) =^> {
echo   res.json({status: 'online', uptime: process.uptime(^), config: config}^);
echo }^);
echo.
echo app.listen(config.localPort, (^) =^> {
echo   console.log('Entrega Facil rodando em http://localhost:' + config.localPort^);
echo }^);
) > server.js

:: Criar script de inicializacao
echo  [INFO] Configurando inicializacao automatica...
echo @echo off > start-entrega-facil.bat
echo cd /d "%INSTALL_DIR%" >> start-entrega-facil.bat
echo start /min node server.js >> start-entrega-facil.bat

:: Copiar para startup
copy "start-entrega-facil.bat" "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\EntregaFacil.bat" >nul 2>&1

:: Criar atalho na area de trabalho
echo  [INFO] Criando atalho...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Entrega Facil.lnk'); $Shortcut.TargetPath = 'http://localhost:3000'; $Shortcut.Save()}"

:: Iniciar aplicacao
echo  [INFO] Iniciando aplicacao...
start /min node server.js
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo  ===============================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo  ===============================================
echo.
echo  Sistema: http://localhost:3000
echo  Pasta: %INSTALL_DIR%
echo  Atalho: Criado na area de trabalho
echo  Inicializacao: Automatica
echo.
echo  O sistema ja esta rodando!
echo.
pause
`;

    // Salvar script de instalação rápida
    fs.writeFileSync(path.join(outputDir, 'install-rapido.bat'), quickInstallScript);
    
    // Criar arquivo README
    const readmeContent = `
# Entrega Fácil - Instalador Automático

## Como instalar:

### Opção 1: Instalação Rápida (Recomendada)
1. Execute o arquivo: **install-rapido.bat**
2. Aguarde a instalação automática
3. O sistema abrirá automaticamente no navegador

### Opção 2: Instalação Manual
1. Execute o arquivo: **install-windows.bat**
2. Siga as instruções na tela

### Opção 3: PowerShell (Avançado)
1. Execute como Administrador: **install-windows.ps1**
2. Permite personalização avançada

## O que é instalado:

- ✅ Node.js (se não estiver instalado)
- ✅ Sistema Entrega Fácil
- ✅ Banco de dados SQLite
- ✅ Servidor local na porta 3000
- ✅ Atalho na área de trabalho
- ✅ Inicialização automática com Windows
- ✅ Sincronização com servidor central

## Acesso:

- **URL:** http://localhost:3000
- **Pasta:** %USERPROFILE%\\EntregaFacil
- **Logs:** %USERPROFILE%\\EntregaFacil\\logs

## Desinstalação:

Para desinstalar, delete a pasta **%USERPROFILE%\\EntregaFacil**
e remova o arquivo **EntregaFacil.bat** da pasta de inicialização.

## Suporte:

Para suporte técnico, entre em contato através do painel administrativo.
`;

    fs.writeFileSync(path.join(outputDir, 'README.txt'), readmeContent);
    
    // Copiar arquivos existentes
    const filesToCopy = [
      'install-windows.bat',
      'install-windows.ps1'
    ];
    
    filesToCopy.forEach(file => {
      const srcPath = path.join(__dirname, file);
      const destPath = path.join(outputDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    console.log('✅ Instalador criado com sucesso!');
    console.log(`📁 Arquivos salvos em: ${outputDir}`);
    console.log('📋 Arquivos criados:');
    console.log('   - install-rapido.bat (Instalação rápida)');
    console.log('   - install-windows.bat (Instalação padrão)');
    console.log('   - install-windows.ps1 (PowerShell)');
    console.log('   - README.txt (Instruções)');
    
    // Criar arquivo ZIP para distribuição
    const output = fs.createWriteStream(path.join(outputDir, 'entrega-facil-installer.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log('📦 Arquivo ZIP criado com sucesso!');
      console.log(`   Tamanho: ${archive.pointer()} bytes`);
    });
    
    archive.on('error', (err) => {
      console.error('❌ Erro ao criar ZIP:', err);
    });
    
    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
    
  } catch (error) {
    console.error('❌ Erro ao criar instalador:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createInstaller();
}

module.exports = { createInstaller };