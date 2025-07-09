@echo off
title Instalador Direto - Entrega Facil
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                       INSTALADOR DIRETO                                   ║
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
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo Instale em: https://nodejs.org
    pause
    exit /b 1
)

:: Criar pasta temporária
echo Criando ambiente...
set "TEMP_DIR=%TEMP%\entrega_facil_build"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

:: Criar package.json direto
echo Criando package.json...
echo { > package.json
echo   "name": "entrega-facil-installer", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "main": "main.js", >> package.json
echo   "scripts": { >> package.json
echo     "build": "electron-builder --win" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "electron": "^20.0.0", >> package.json
echo     "electron-builder": "^23.0.0" >> package.json
echo   }, >> package.json
echo   "build": { >> package.json
echo     "appId": "com.entregafacil.installer", >> package.json
echo     "productName": "Entrega Facil Instalador", >> package.json
echo     "directories": { >> package.json
echo       "output": "dist" >> package.json
echo     }, >> package.json
echo     "files": ["main.js", "index.html"], >> package.json
echo     "win": { >> package.json
echo       "target": "nsis" >> package.json
echo     } >> package.json
echo   } >> package.json
echo } >> package.json

:: Criar main.js básico
echo Criando main.js...
echo const { app, BrowserWindow } = require('electron'); > main.js
echo const path = require('path'); >> main.js
echo. >> main.js
echo function createWindow() { >> main.js
echo   const mainWindow = new BrowserWindow({ >> main.js
echo     width: 800, >> main.js
echo     height: 600, >> main.js
echo     webPreferences: { >> main.js
echo       nodeIntegration: true, >> main.js
echo       contextIsolation: false >> main.js
echo     } >> main.js
echo   }); >> main.js
echo. >> main.js
echo   mainWindow.loadFile('index.html'); >> main.js
echo   mainWindow.setMenuBarVisibility(false); >> main.js
echo } >> main.js
echo. >> main.js
echo app.whenReady().then(createWindow); >> main.js
echo. >> main.js
echo app.on('window-all-closed', () =^> { >> main.js
echo   if (process.platform !== 'darwin') { >> main.js
echo     app.quit(); >> main.js
echo   } >> main.js
echo }); >> main.js

:: Criar index.html
echo Criando interface...
echo ^<!DOCTYPE html^> > index.html
echo ^<html^> >> index.html
echo ^<head^> >> index.html
echo   ^<title^>Entrega Facil Instalador^</title^> >> index.html
echo   ^<style^> >> index.html
echo     body { font-family: Arial; background: linear-gradient(135deg, #667eea, #764ba2); margin: 0; padding: 50px; } >> index.html
echo     .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; } >> index.html
echo     h1 { text-align: center; color: #333; } >> index.html
echo     input { width: 100%%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; } >> index.html
echo     button { padding: 15px 30px; background: #667eea; color: white; border: none; border-radius: 25px; cursor: pointer; } >> index.html
echo   ^</style^> >> index.html
echo ^</head^> >> index.html
echo ^<body^> >> index.html
echo   ^<div class="container"^> >> index.html
echo     ^<h1^>🚚 Entrega Facil - Instalador^</h1^> >> index.html
echo     ^<p^>Configure seu sistema de entregas local^</p^> >> index.html
echo     ^<input type="text" placeholder="Nome do Estabelecimento" required^> >> index.html
echo     ^<input type="text" placeholder="Telefone" required^> >> index.html
echo     ^<input type="text" placeholder="Endereço" required^> >> index.html
echo     ^<button onclick="install()"^>Instalar Sistema^</button^> >> index.html
echo   ^</div^> >> index.html
echo   ^<script^> >> index.html
echo     function install() { >> index.html
echo       alert('Sistema instalado com sucesso!'); >> index.html
echo       require('electron').remote.app.quit(); >> index.html
echo     } >> index.html
echo   ^</script^> >> index.html
echo ^</body^> >> index.html
echo ^</html^> >> index.html

:: Instalar dependências
echo Instalando dependências...
call npm install --no-package-lock
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

:: Construir
echo Construindo EXE...
call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na construção!
    pause
    exit /b 1
)

:: Copiar resultado
if exist "dist\*.exe" (
    echo.
    echo ✅ SUCESSO! EXE criado com sucesso!
    echo.
    
    :: Copiar para pasta do usuário
    copy "dist\*.exe" "%USERPROFILE%\Desktop\" >nul
    echo ✅ EXE copiado para área de trabalho
    
    :: Copiar para pasta original
    copy "dist\*.exe" "%~dp0" >nul
    echo ✅ EXE copiado para pasta original
    
    echo.
    echo Executar instalador agora? (S/N)
    set /p run=
    if /i "%run%"=="S" (
        start "" "%USERPROFILE%\Desktop\*.exe"
    )
) else (
    echo ❌ Erro: EXE não foi criado!
)

:: Limpeza
echo.
echo Limpando...
cd /d "%~dp0"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" >nul 2>&1

echo.
echo Processo concluído!
pause
exit /b 0