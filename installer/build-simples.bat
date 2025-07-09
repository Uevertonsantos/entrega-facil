@echo off
title Construir Instalador Simples - Entrega Facil
color 0B
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    CONSTRUIR INSTALADOR SIMPLES                           ║
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
echo [2/6] Criando ambiente...
set "WORK_DIR=%~dp0temp_installer"
if exist "%WORK_DIR%" rmdir /s /q "%WORK_DIR%"
mkdir "%WORK_DIR%"
cd /d "%WORK_DIR%"

:: Criar package.json
echo [3/6] Criando package.json...
(
echo {
echo   "name": "entrega-facil-installer",
echo   "version": "1.0.0",
echo   "description": "Instalador do Sistema Entrega Facil",
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

:: Copiar arquivos funcionais
echo [4/6] Copiando arquivos...
if exist "%~dp0instalador-gui-funcional.js" (
    copy "%~dp0instalador-gui-funcional.js" main.js
    echo ✅ Copiado main.js
) else (
    echo ❌ Arquivo instalador-gui-funcional.js não encontrado!
    pause
    exit /b 1
)

if exist "%~dp0installer-ui-funcional.html" (
    copy "%~dp0installer-ui-funcional.html" index.html
    echo ✅ Copiado index.html
) else (
    echo ❌ Arquivo installer-ui-funcional.html não encontrado!
    pause
    exit /b 1
)

:: Instalar dependências
echo [5/6] Instalando dependências...
call npm install --no-package-lock
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo Tentando versão específica...
    call npm install electron@22.0.0 electron-builder@23.0.0 --no-package-lock
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

:: Verificar e copiar resultado
if exist "dist" (
    echo.
    echo ✅ ===============================================
    echo ✅        INSTALADOR CRIADO COM SUCESSO!
    echo ✅ ===============================================
    echo.
    
    if exist "dist\*.exe" (
        echo Copiando EXE para pasta principal...
        copy "dist\*.exe" "%~dp0"
        echo ✅ EXE copiado para: %~dp0
    )
    
    echo 📁 Arquivos criados em: %WORK_DIR%\dist
    echo.
    echo Deseja abrir pasta? (S/N)
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
timeout /t 3 >nul
if exist "%WORK_DIR%" (
    rmdir /s /q "%WORK_DIR%" >nul 2>&1
)

echo.
echo Instalação concluída!
pause
exit /b 0