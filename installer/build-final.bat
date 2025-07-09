@echo off
title Instalador Final - Entrega Facil
color 0B
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                      INSTALADOR FINAL CORRIGIDO                          ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Execute como Administrador!
    pause
    exit /b 1
)

:: Verificar Node.js
echo [1/7] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

:: Criar diretório limpo
echo [2/7] Preparando ambiente...
set "BUILD_DIR=%~dp0build_final"
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

:: Criar package.json otimizado
echo [3/7] Criando configuração...
(
echo {
echo   "name": "entrega-facil-installer",
echo   "version": "1.0.0",
echo   "description": "Instalador Sistema Entrega Facil",
echo   "main": "main.js",
echo   "scripts": {
echo     "start": "electron .",
echo     "build": "electron-builder --win --publish=never"
echo   },
echo   "devDependencies": {
echo     "electron": "22.0.0",
echo     "electron-builder": "23.0.0"
echo   },
echo   "build": {
echo     "appId": "com.entregafacil.installer",
echo     "productName": "Entrega Facil Instalador",
echo     "directories": {
echo       "output": "dist"
echo     },
echo     "files": [
echo       "main.js",
echo       "index.html"
echo     ],
echo     "win": {
echo       "target": "nsis",
echo       "icon": "icon.ico"
echo     },
echo     "nsis": {
echo       "oneClick": false,
echo       "allowToChangeInstallationDirectory": true,
echo       "createDesktopShortcut": true,
echo       "createStartMenuShortcut": true,
echo       "installerIcon": "icon.ico",
echo       "uninstallerIcon": "icon.ico"
echo     }
echo   }
echo }
) > package.json

:: Criar main.js simplificado
echo [4/7] Criando aplicação...
(
echo const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron'^);
echo const path = require('path'^);
echo const fs = require('fs'^);
echo const { spawn, exec } = require('child_process'^);
echo const os = require('os'^);
echo.
echo let mainWindow;
echo.
echo function createWindow(^) {
echo   mainWindow = new BrowserWindow({
echo     width: 800,
echo     height: 600,
echo     webPreferences: {
echo       nodeIntegration: true,
echo       contextIsolation: false
echo     },
echo     title: 'Instalador Entrega Fácil',
echo     resizable: false,
echo     center: true
echo   }^);
echo.
echo   mainWindow.loadFile('index.html'^);
echo   mainWindow.setMenuBarVisibility(false^);
echo }
echo.
echo app.whenReady(^).then(createWindow^);
echo.
echo app.on('window-all-closed', (^) =^> {
echo   if (process.platform !== 'darwin'^) app.quit(^);
echo }^);
echo.
echo ipcMain.handle('install-system', async (event, config^) =^> {
echo   try {
echo     const installPath = path.join(os.homedir(^), 'EntregaFacil'^);
echo     
echo     if (^!fs.existsSync(installPath^)^) {
echo       fs.mkdirSync(installPath, { recursive: true }^);
echo     }
echo     
echo     const serverCode = \`const express = require('express'^);
echo const app = express(^);
echo const PORT = 3000;
echo app.use(express.static('public'^)^);
echo app.get('/', (req, res^) =^> res.send('Sistema Entrega Facil Online!'^)^);
echo app.listen(PORT, (^) =^> console.log(\\\`Servidor rodando em http://localhost:\\\${PORT}\\\`^)^);\`;
echo     
echo     fs.writeFileSync(path.join(installPath, 'server.js'^), serverCode^);
echo     
echo     const packageJson = {
echo       name: 'entrega-facil-client',
echo       version: '1.0.0',
echo       dependencies: { express: '^4.18.2' }
echo     };
echo     
echo     fs.writeFileSync(path.join(installPath, 'package.json'^), JSON.stringify(packageJson, null, 2^)^);
echo     
echo     return { success: true, path: installPath };
echo   } catch (error^) {
echo     return { success: false, error: error.message };
echo   }
echo }^);
echo.
echo ipcMain.handle('close-app', (^) =^> app.quit(^)^);
) > main.js

:: Criar interface HTML
echo [5/7] Criando interface...
(
echo ^<^!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Instalador Entrega Fácil^</title^>
echo   ^<style^>
echo     body { font-family: Arial; background: linear-gradient(135deg, #667eea, #764ba2^); margin: 0; padding: 50px; }
echo     .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; }
echo     h1 { text-align: center; color: #333; }
echo     .form-group { margin: 20px 0; }
echo     label { display: block; margin-bottom: 5px; font-weight: bold; }
echo     input { width: 100%%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
echo     button { padding: 15px 30px; background: linear-gradient(135deg, #667eea, #764ba2^); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; }
echo     button:hover { opacity: 0.9; }
echo     .status { padding: 15px; margin: 20px 0; border-radius: 10px; text-align: center; display: none; }
echo     .success { background: #d4edda; color: #155724; }
echo     .error { background: #f8d7da; color: #721c24; }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<h1^>🚚 Entrega Fácil - Instalador^</h1^>
echo     ^<p^>Configure seu sistema de entregas local^</p^>
echo     
echo     ^<div class="form-group"^>
echo       ^<label^>Nome do Estabelecimento:^</label^>
echo       ^<input type="text" id="businessName" placeholder="Ex: Padaria do João" required^>
echo     ^</div^>
echo     
echo     ^<div class="form-group"^>
echo       ^<label^>Telefone:^</label^>
echo       ^<input type="text" id="businessPhone" placeholder="(11) 99999-9999" required^>
echo     ^</div^>
echo     
echo     ^<div class="form-group"^>
echo       ^<label^>Endereço:^</label^>
echo       ^<input type="text" id="businessAddress" placeholder="Rua, número, bairro" required^>
echo     ^</div^>
echo     
echo     ^<button onclick="installSystem(^)"^>Instalar Sistema^</button^>
echo     ^<button onclick="closeApp(^)" style="background: #6c757d;"^>Fechar^</button^>
echo     
echo     ^<div id="status" class="status"^>^</div^>
echo   ^</div^>
echo   
echo   ^<script^>
echo     const { ipcRenderer } = require('electron'^);
echo     
echo     async function installSystem(^) {
echo       const config = {
echo         businessName: document.getElementById('businessName'^).value,
echo         businessPhone: document.getElementById('businessPhone'^).value,
echo         businessAddress: document.getElementById('businessAddress'^).value
echo       };
echo       
echo       if (^!config.businessName ^|^| ^!config.businessPhone ^|^| ^!config.businessAddress^) {
echo         showStatus('Preencha todos os campos!', 'error'^);
echo         return;
echo       }
echo       
echo       showStatus('Instalando sistema...', 'success'^);
echo       
echo       try {
echo         const result = await ipcRenderer.invoke('install-system', config^);
echo         
echo         if (result.success^) {
echo           showStatus(\`Sistema instalado com sucesso em: \${result.path}\`, 'success'^);
echo         } else {
echo           showStatus(\`Erro na instalação: \${result.error}\`, 'error'^);
echo         }
echo       } catch (error^) {
echo         showStatus(\`Erro: \${error.message}\`, 'error'^);
echo       }
echo     }
echo     
echo     function showStatus(message, type^) {
echo       const status = document.getElementById('status'^);
echo       status.textContent = message;
echo       status.className = \`status \${type}\`;
echo       status.style.display = 'block';
echo     }
echo     
echo     async function closeApp(^) {
echo       await ipcRenderer.invoke('close-app'^);
echo     }
echo   ^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

:: Criar ícone simples
echo [6/7] Criando ícone...
echo. > icon.ico

:: Instalar e construir
echo [7/7] Instalando e construindo...
call npm install --no-package-lock
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na construção!
    pause
    exit /b 1
)

:: Copiar resultado
if exist "dist\*.exe" (
    echo.
    echo ✅ ===============================================
    echo ✅          INSTALADOR CRIADO!
    echo ✅ ===============================================
    echo.
    
    copy "dist\*.exe" "%~dp0" >nul
    echo ✅ EXE copiado para: %~dp0
    
    echo.
    echo Deseja testar o instalador? (S/N)
    set /p test=
    if /i "%test%"=="S" (
        start "" "%~dp0\*.exe"
    )
) else (
    echo ❌ Erro: EXE não foi criado!
)

:: Limpar
echo.
echo Limpando arquivos temporários...
cd /d "%~dp0"
timeout /t 2 >nul
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%" >nul 2>&1

echo.
echo Concluído!
pause
exit /b 0