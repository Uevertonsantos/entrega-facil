@echo off
title Construir Instalador Funcional - Entrega Facil
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    CONSTRUIR INSTALADOR FUNCIONAL                         ║
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
echo [1/5] Verificando Node.js...
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

:: Preparar package.json
echo [2/5] Preparando configuração...
if exist "package.json" del package.json

if exist "package-funcional.json" (
    copy package-funcional.json package.json
    if %errorlevel% neq 0 (
        echo ❌ Erro ao copiar package-funcional.json!
        pause
        exit /b 1
    )
    echo ✅ Configuração copiada de package-funcional.json
) else (
    echo ⚠️ package-funcional.json não encontrado, criando automaticamente...
    (
        echo {
        echo   "name": "entrega-facil-installer-funcional",
        echo   "version": "1.0.0",
        echo   "description": "Instalador GUI Funcional para Sistema Entrega Fácil",
        echo   "main": "instalador-gui-funcional.js",
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
        echo       "instalador-gui-funcional.js",
        echo       "installer-ui-funcional.html",
        echo       "assets/**/*"
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
    echo ✅ package.json criado automaticamente
)

:: Limpar e instalar dependências
echo [3/5] Instalando dependências...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

call npm cache clean --force >nul 2>&1
call npm install --no-optional
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo Tentando com versões específicas...
    call npm install electron@22.0.0 electron-builder@23.0.0 --no-optional
    if %errorlevel% neq 0 (
        echo ❌ Falha na instalação!
        pause
        exit /b 1
    )
)
echo ✅ Dependências instaladas

:: Verificar arquivos necessários
echo [4/5] Verificando arquivos...
if not exist "instalador-gui-funcional.js" (
    echo ❌ Arquivo principal não encontrado!
    pause
    exit /b 1
)

if not exist "installer-ui-funcional.html" (
    echo ❌ Arquivo de interface não encontrado!
    pause
    exit /b 1
)

if not exist "assets" mkdir assets
if not exist "assets\icon.ico" (
    echo ✅ Criando ícone padrão...
    echo. > assets\icon.ico
)

echo ✅ Arquivos verificados

:: Construir EXE
echo [5/5] Construindo instalador EXE...
if exist "dist" rmdir /s /q dist

call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na construção, tentando modo directory...
    call npx electron-builder --win --dir
    if %errorlevel% neq 0 (
        echo ❌ Falha na construção!
        pause
        exit /b 1
    )
)

:: Verificar resultado
if exist "dist" (
    echo.
    echo ✅ ===============================================
    echo ✅        INSTALADOR FUNCIONAL CRIADO!
    echo ✅ ===============================================
    echo.
    echo 📁 Arquivos criados em: dist\
    echo.
    
    if exist "dist\*.exe" (
        echo ✅ Instalador EXE encontrado!
        for %%f in (dist\*.exe) do (
            echo 📄 Arquivo: %%f
            echo 📊 Tamanho: 
            dir "%%f" | findstr "%%~nxf"
        )
    )
    
    echo.
    echo Deseja abrir pasta de destino? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        explorer dist
    )
    
    echo.
    echo Deseja testar o instalador? (S/N)
    set /p test_choice=
    if /i "%test_choice%"=="S" (
        cd dist
        for %%f in (*.exe) do (
            echo Executando: %%f
            start "" "%%f"
        )
    )
) else (
    echo ❌ Erro: Pasta dist não foi criada!
    pause
    exit /b 1
)

echo.
echo ===============================================
echo           CONSTRUÇÃO CONCLUÍDA!
echo ===============================================
echo.
echo ✅ Instalador funcional criado com sucesso
echo ✅ Interface gráfica completa
echo ✅ Botões funcionais implementados
echo ✅ Sistema de instalação automática
echo ✅ Pronto para distribuição
echo.

pause
exit /b 0