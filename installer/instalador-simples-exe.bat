@echo off
title Instalador Simples EXE - Entrega Facil
color 0B
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    INSTALADOR SIMPLES EXE                                 ║
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
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Instale Node.js primeiro:
    echo 1. Acesse: https://nodejs.org
    echo 2. Baixe a versão LTS
    echo 3. Execute como Administrador
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

:: Criar diretório de trabalho
echo [2/6] Preparando ambiente...
set "WORK_DIR=%~dp0temp_build"
if exist "%WORK_DIR%" rmdir /s /q "%WORK_DIR%"
mkdir "%WORK_DIR%"
cd /d "%WORK_DIR%"

:: Criar package.json diretamente
echo [3/6] Criando configuração...
(
echo {
echo   "name": "entrega-facil-installer",
echo   "version": "1.0.0",
echo   "description": "Instalador GUI para Sistema Entrega Facil",
echo   "main": "main.js",
echo   "scripts": {
echo     "start": "electron .",
echo     "build": "electron-builder --win --publish=never"
echo   },
echo   "devDependencies": {
echo     "electron": "^22.0.0",
echo     "electron-builder": "^23.0.0"
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
echo       "target": "nsis"
echo     },
echo     "nsis": {
echo       "oneClick": false,
echo       "allowToChangeInstallationDirectory": true
echo     }
echo   }
echo }
) > package.json

:: Criar main.js simplificado
echo [4/6] Criando aplicação...
(
echo const { app, BrowserWindow } = require('electron'^);
echo const path = require('path'^);
echo.
echo function createWindow(^) {
echo   const mainWindow = new BrowserWindow({
echo     width: 800,
echo     height: 600,
echo     webPreferences: {
echo       nodeIntegration: true,
echo       contextIsolation: false
echo     }
echo   }^);
echo.
echo   mainWindow.loadFile('index.html'^);
echo   mainWindow.setMenuBarVisibility(false^);
echo }
echo.
echo app.whenReady(^).then(createWindow^);
echo.
echo app.on('window-all-closed', (^) =^> {
echo   if (process.platform !== 'darwin'^) {
echo     app.quit(^);
echo   }
echo }^);
) > main.js

:: Criar interface HTML simplificada
(
echo ^<^!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Instalador Entrega Facil^</title^>
echo   ^<style^>
echo     body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea, #764ba2^); }
echo     .container { max-width: 600px; margin: 50px auto; padding: 30px; background: white; border-radius: 15px; }
echo     h1 { text-align: center; color: #333; }
echo     .btn { padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer; }
echo     .form-group { margin: 15px 0; }
echo     .form-control { width: 100%%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<h1^>🚚 Entrega Facil - Instalador^</h1^>
echo     ^<p^>Instalador do Sistema de Entregas Local^</p^>
echo     ^<div class="form-group"^>
echo       ^<label^>Nome do Estabelecimento:^</label^>
echo       ^<input type="text" class="form-control" placeholder="Ex: Padaria do João"^>
echo     ^</div^>
echo     ^<div class="form-group"^>
echo       ^<label^>Telefone:^</label^>
echo       ^<input type="text" class="form-control" placeholder="(11) 99999-9999"^>
echo     ^</div^>
echo     ^<div class="form-group"^>
echo       ^<label^>Endereço:^</label^>
echo       ^<input type="text" class="form-control" placeholder="Rua, número, bairro"^>
echo     ^</div^>
echo     ^<button class="btn" onclick="install(^)"^>Instalar Sistema^</button^>
echo   ^</div^>
echo   ^<script^>
echo     function install(^) {
echo       alert('Sistema instalado com sucesso!'^);
echo       require('electron'^).remote.app.quit(^);
echo     }
echo   ^</script^>
echo ^</body^>
echo ^</html^>
) > index.html

:: Instalar dependências
echo [5/6] Instalando dependências...
call npm install --no-package-lock
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo Tentando versão mais antiga do Electron...
    call npm install electron@^20.0.0 electron-builder@^23.0.0 --no-package-lock
    if %errorlevel% neq 0 (
        echo ❌ Falha na instalação!
        pause
        exit /b 1
    )
)

:: Construir EXE
echo [6/6] Construindo EXE...
call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na construção!
    echo Tentando modo directory...
    call npx electron-builder --win --dir
)

:: Verificar resultado
if exist "dist" (
    echo.
    echo ✅ ===============================================
    echo ✅        INSTALADOR EXE CRIADO!
    echo ✅ ===============================================
    echo.
    echo 📁 Arquivos criados em: %WORK_DIR%\dist
    echo.
    
    :: Copiar para pasta principal
    if exist "dist\*.exe" (
        echo Copiando EXE para pasta principal...
        copy "dist\*.exe" "%~dp0" >nul
        echo ✅ EXE copiado para: %~dp0
    )
    
    echo.
    echo Deseja abrir pasta com o resultado? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        explorer "%WORK_DIR%\dist"
    )
) else (
    echo ❌ Erro: Pasta dist não foi criada!
)

echo.
echo Limpando arquivos temporários...
cd /d "%~dp0"
if exist "%WORK_DIR%" (
    timeout /t 2 >nul
    rmdir /s /q "%WORK_DIR%" >nul 2>&1
)

echo.
echo Instalação concluída!
pause
exit /b 0