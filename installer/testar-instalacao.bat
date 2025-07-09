@echo off
title Entrega Facil - Teste de Instalacao
color 0A
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    TESTE DE INSTALACAO - ENTREGA FACIL                    ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"

echo [1/5] Verificando diretorio de instalacao...
if exist "%INSTALL_DIR%" (
    echo ✅ Diretorio encontrado: %INSTALL_DIR%
) else (
    echo ❌ Diretorio nao encontrado: %INSTALL_DIR%
    echo.
    echo Execute primeiro o instalador-comerciante-corrigido.bat
    pause
    exit /b 1
)

echo.
echo [2/5] Verificando arquivos necessarios...
cd /d "%INSTALL_DIR%"

if exist "server.js" (
    echo ✅ server.js encontrado
) else (
    echo ❌ server.js nao encontrado
    goto :error
)

if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json nao encontrado
    goto :error
)

if exist "config.json" (
    echo ✅ config.json encontrado
) else (
    echo ❌ config.json nao encontrado
    goto :error
)

echo.
echo [3/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js nao encontrado
    goto :error
)

echo.
echo [4/5] Verificando dependencias...
if exist "node_modules" (
    echo ✅ node_modules encontrado
) else (
    echo ❌ node_modules nao encontrado
    echo Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependencias
        goto :error
    )
    echo ✅ Dependencias instaladas
)

echo.
echo [5/5] Testando servidor...
echo Iniciando servidor de teste...

:: Detectar porta do config.json
for /f "tokens=2 delims=:" %%a in ('findstr "localPort" config.json') do (
    set "PORT_LINE=%%a"
    set "PORT=!PORT_LINE:~1,4!"
    set "PORT=!PORT:~0,-1!"
)

if "!PORT!"=="" set "PORT=3000"

echo Testando na porta: !PORT!

:: Iniciar servidor em background
start /b cmd /c "node server.js > logs\startup.log 2>&1"

:: Esperar 5 segundos
echo Aguardando inicializacao do servidor...
timeout /t 5 >nul

:: Testar conexao
echo Testando conexao...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:!PORT!/api/status' -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ✅ ========================================
    echo ✅           TESTE CONCLUIDO!
    echo ✅ ========================================
    echo.
    echo ✅ Sistema funcionando corretamente
    echo ✅ Servidor online na porta: !PORT!
    echo ✅ Acesso em: http://localhost:!PORT!
    echo.
    echo Abrindo sistema no navegador...
    start http://localhost:!PORT!
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
) else (
    echo.
    echo ❌ ========================================
    echo ❌        ERRO NO TESTE!
    echo ❌ ========================================
    echo.
    echo ❌ Servidor nao esta respondendo
    echo.
    echo Verificando logs...
    if exist "logs\startup.log" (
        echo.
        echo === LOGS DE INICIALIZACAO ===
        type "logs\startup.log"
        echo.
    )
    
    echo.
    echo Solucoes possiveis:
    echo 1. Verificar se a porta !PORT! esta livre
    echo 2. Executar como Administrador
    echo 3. Verificar firewall do Windows
    echo 4. Reinstalar o sistema
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
)

:: Parar servidor
taskkill /f /im node.exe >nul 2>&1
exit /b 0

:error
echo.
echo ❌ ========================================
echo ❌        ERRO DE INSTALACAO!
echo ❌ ========================================
echo.
echo ❌ Arquivos necessarios nao encontrados
echo.
echo Execute o instalador novamente:
echo 1. Baixe o arquivo entrega-facil-comerciante-COMPLETO-v3.0.zip
echo 2. Execute instalador-comerciante-corrigido.bat como Administrador
echo 3. Aguarde a instalacao completa
echo.
echo Pressione qualquer tecla para sair...
pause >nul
exit /b 1