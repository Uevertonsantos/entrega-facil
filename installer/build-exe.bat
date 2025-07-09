@echo off
title Construir Instalador EXE - Entrega Facil
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    CONSTRUIR INSTALADOR EXE                               ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo Instale Node.js primeiro: https://nodejs.org
    pause
    exit /b 1
)

:: Verificar se já existe package.json
if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo Criando package.json...
    copy package-installer.json package.json
)

:: Instalar dependências
echo [1/4] Instalando dependências...
call npm install

:: Verificar se Electron está instalado
echo [2/4] Verificando Electron...
call npx electron --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando Electron...
    call npm install --save-dev electron electron-builder
)

:: Criar diretório de assets se não existir
if not exist "assets" mkdir assets

:: Criar um ícone simples se não existir
if not exist "assets\icon.ico" (
    echo [3/4] Criando ícone padrão...
    :: Aqui você pode adicionar um ícone real ou usar um padrão
    echo Ícone padrão criado > assets\icon.ico
)

:: Construir o executável
echo [4/4] Construindo executável...
call npx electron-builder --win

if %errorlevel% equ 0 (
    echo.
    echo ✅ ========================================
    echo ✅        INSTALADOR EXE CRIADO!
    echo ✅ ========================================
    echo.
    echo 📁 Arquivo criado em: dist\
    echo 🚀 Execute o instalador EXE para testar
    echo.
    
    if exist "dist" (
        echo Abrindo pasta de destino...
        explorer dist
    )
) else (
    echo.
    echo ❌ ========================================
    echo ❌        ERRO AO CRIAR EXE!
    echo ❌ ========================================
    echo.
    echo Verifique os erros acima
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul

exit /b 0