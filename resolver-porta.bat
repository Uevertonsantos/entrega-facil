@echo off
title Resolver Conflito de Porta - Entrega Facil

echo Resolvendo conflito de porta...
echo.

:: Parar processos Node.js existentes
echo [1/3] Parando processos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Verificar se a porta 3000 esta livre
echo [2/3] Verificando porta 3000...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo Porta 3000 ainda ocupada, liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: Navegar para pasta e iniciar servidor
echo [3/3] Iniciando servidor...
cd /d "%USERPROFILE%\EntregaFacil"

:: Verificar se config.json existe
if not exist config.json (
    echo Criando arquivo de configuracao...
    set CLIENT_ID=client_%RANDOM%_%RANDOM%
    (
    echo {
    echo   "businessName": "Meu Negocio",
    echo   "businessEmail": "contato@meunegocio.com",
    echo   "businessPhone": "^(11^) 99999-9999",
    echo   "businessAddress": "Rua Principal, 123",
    echo   "businessCity": "Minha Cidade",
    echo   "businessState": "SP",
    echo   "clientId": "!CLIENT_ID!",
    echo   "localPort": 3000,
    echo   "syncEnabled": true,
    echo   "version": "1.0.0",
    echo   "installDate": "%DATE% %TIME%"
    echo }
    ) > config.json
)

echo.
echo ===============================================
echo   SISTEMA ENTREGA FACIL INICIANDO...
echo ===============================================
echo.

:: Iniciar servidor
node server.js