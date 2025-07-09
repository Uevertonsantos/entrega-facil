@echo off
title Entrega Facil - Diagnostico do Sistema
color 0C
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                     DIAGNOSTICO - ENTREGA FACIL                           ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"

echo Verificando instalacao em: %INSTALL_DIR%
echo.

:: Verificar se existe diretorio
if not exist "%INSTALL_DIR%" (
    echo ❌ ERRO: Diretorio nao encontrado
    echo.
    echo O sistema nao foi instalado corretamente.
    echo Execute o instalador-comerciante-corrigido.bat como Administrador
    echo.
    pause
    exit /b 1
)

cd /d "%INSTALL_DIR%"

echo ═══════════════════════════════════════════════════════════════════════════════
echo                              DIAGNOSTICO COMPLETO
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

:: 1. Verificar Node.js
echo [1] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js instalado: %%i
) else (
    echo ❌ Node.js nao encontrado
    echo.
    echo SOLUCAO: Reinstale o Node.js
    echo 1. Baixe em: https://nodejs.org
    echo 2. Execute como Administrador
    echo 3. Reinicie o computador
    echo.
    goto :fim
)

:: 2. Verificar arquivos
echo.
echo [2] Verificando arquivos do sistema...
if exist "server.js" (
    echo ✅ server.js encontrado
) else (
    echo ❌ server.js nao encontrado
    goto :erro_arquivos
)

if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json nao encontrado
    goto :erro_arquivos
)

if exist "config.json" (
    echo ✅ config.json encontrado
) else (
    echo ❌ config.json nao encontrado
    goto :erro_arquivos
)

:: 3. Verificar dependencias
echo.
echo [3] Verificando dependencias...
if exist "node_modules" (
    echo ✅ node_modules encontrado
) else (
    echo ❌ node_modules nao encontrado
    echo.
    echo Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependencias
        echo.
        echo SOLUCAO:
        echo 1. Verifique conexao com internet
        echo 2. Execute como Administrador
        echo 3. Tente: npm cache clean --force
        echo.
        goto :fim
    )
    echo ✅ Dependencias instaladas com sucesso
)

:: 4. Verificar portas
echo.
echo [4] Verificando portas...
for /f "tokens=2 delims=:" %%a in ('findstr "localPort" config.json') do (
    set "PORT_LINE=%%a"
    set "PORT=!PORT_LINE:~1,4!"
    set "PORT=!PORT:~0,-1!"
)

if "!PORT!"=="" set "PORT=3000"

echo Porta configurada: !PORT!

netstat -an | findstr ":!PORT! " >nul
if %errorlevel% equ 0 (
    echo ⚠️  Porta !PORT! esta ocupada
    echo.
    echo SOLUCAO: Alterar porta no config.json
    echo 1. Abra config.json
    echo 2. Altere "localPort": 3000 para outro numero
    echo 3. Tente portas: 3001, 3002, 8080, 8000
    echo.
) else (
    echo ✅ Porta !PORT! livre
)

:: 5. Testar servidor
echo.
echo [5] Testando servidor...
echo Iniciando servidor de teste...

start /b cmd /c "node server.js > logs\test.log 2>&1"

timeout /t 3 >nul

:: Verificar se processo esta rodando
tasklist /fi "imagename eq node.exe" | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Processo Node.js encontrado
) else (
    echo ❌ Processo Node.js nao encontrado
    echo.
    echo Verificando logs de erro...
    if exist "logs\test.log" (
        echo.
        echo === LOGS DE ERRO ===
        type "logs\test.log"
        echo.
    )
    goto :erro_servidor
)

:: Testar conexao HTTP
echo Testando conexao HTTP...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:!PORT!/api/status' -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ Servidor respondendo corretamente
    echo.
    echo ✅ ========================================
    echo ✅        DIAGNOSTICO CONCLUIDO!
    echo ✅ ========================================
    echo.
    echo ✅ Sistema funcionando perfeitamente
    echo ✅ Acesso em: http://localhost:!PORT!
    echo.
    echo Abrindo sistema no navegador...
    start http://localhost:!PORT!
) else (
    echo ❌ Servidor nao esta respondendo
    echo.
    echo Verificando logs...
    if exist "logs\test.log" (
        echo.
        echo === LOGS DE INICIALIZACAO ===
        type "logs\test.log"
        echo.
    )
    goto :erro_servidor
)

:: Parar servidor de teste
taskkill /f /im node.exe >nul 2>&1
goto :fim

:erro_arquivos
echo.
echo ❌ ========================================
echo ❌      ERRO: ARQUIVOS FALTANDO!
echo ❌ ========================================
echo.
echo SOLUCAO: Reinstalar sistema
echo 1. Baixe novamente: entrega-facil-comerciante-COMPLETO-v3.0.zip
echo 2. Execute instalador-comerciante-corrigido.bat como Administrador
echo 3. Aguarde instalacao completa
echo.
goto :fim

:erro_servidor
echo.
echo ❌ ========================================
echo ❌      ERRO: SERVIDOR NAO INICIA!
echo ❌ ========================================
echo.
echo SOLUCOES POSSIVEIS:
echo 1. Verificar firewall do Windows
echo 2. Executar como Administrador
echo 3. Verificar antivirus
echo 4. Alterar porta no config.json
echo 5. Reinstalar sistema
echo.
echo Para alterar porta:
echo 1. Abra config.json
echo 2. Altere "localPort": !PORT! para outro numero
echo 3. Tente portas: 3001, 3002, 8080, 8000
echo.

:fim
echo.
echo Pressione qualquer tecla para sair...
pause >nul

:: Parar todos os processos node se houver
taskkill /f /im node.exe >nul 2>&1

exit /b 0