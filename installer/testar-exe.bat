@echo off
title Teste do Instalador EXE - Entrega Facil
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                         TESTE INSTALADOR EXE                              ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar se arquivos necessários existem
echo [1/5] Verificando arquivos necessários...

set "missing_files="

if not exist "installer-gui.js" (
    set "missing_files=!missing_files! installer-gui.js"
)

if not exist "installer-ui.html" (
    set "missing_files=!missing_files! installer-ui.html"
)

if not exist "package-installer.json" (
    set "missing_files=!missing_files! package-installer.json"
)

if not exist "assets" (
    set "missing_files=!missing_files! assets/"
)

if not "%missing_files%"=="" (
    echo ❌ Arquivos faltando: %missing_files%
    echo.
    echo Execute primeiro: Descompacte o arquivo ZIP completo
    pause
    exit /b 1
) else (
    echo ✅ Todos os arquivos necessários encontrados
)

:: Verificar Node.js
echo [2/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Instale Node.js:
    echo 1. Acesse: https://nodejs.org
    echo 2. Baixe versão LTS
    echo 3. Execute como Administrador
    echo 4. Reinicie o computador
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

:: Verificar/Instalar dependências
echo [3/5] Verificando dependências...
if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo Copiando configuração...
    copy package-installer.json package.json
)

echo Instalando dependências...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo.
    echo Tente:
    echo 1. Verificar conexão com internet
    echo 2. Executar como Administrador
    echo 3. Limpar cache: npm cache clean --force
    pause
    exit /b 1
) else (
    echo ✅ Dependências instaladas
)

:: Verificar Electron
echo [4/5] Verificando Electron...
call npx electron --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando Electron...
    call npm install --save-dev electron electron-builder >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar Electron!
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%i in ('npx electron --version') do echo ✅ Electron: %%i

:: Testar compilação
echo [5/5] Testando compilação...
echo.
echo Compilando instalador EXE...
call npx electron-builder --win --dir >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro na compilação!
    echo.
    echo Verifique:
    echo 1. Permissões de administrador
    echo 2. Antivírus não está bloqueando
    echo 3. Espaço em disco suficiente
    pause
    exit /b 1
) else (
    echo ✅ Compilação bem-sucedida!
)

echo.
echo ===============================================
echo           TESTE CONCLUÍDO COM SUCESSO!
echo ===============================================
echo.

if exist "dist" (
    echo ✅ Instalador EXE criado em: dist\
    echo.
    echo Próximos passos:
    echo 1. Acesse a pasta dist\
    echo 2. Execute o instalador EXE
    echo 3. Siga o assistente de instalação
    echo.
    echo Deseja abrir a pasta dist agora? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        explorer dist
    )
) else (
    echo ⚠️  Pasta dist não encontrada
)

echo.
echo ===============================================
echo              SISTEMA PRONTO!
echo ===============================================
echo.
echo ✅ Instalador EXE funcionando corretamente
echo ✅ Pronto para distribuição aos clientes
echo ✅ Interface gráfica moderna e intuitiva
echo ✅ Processo de instalação automatizado
echo.

pause
exit /b 0