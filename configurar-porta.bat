@echo off
setlocal enabledelayedexpansion
title Configurar Porta - Entrega Facil

cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FACIL - CONFIGURAR PORTA                       ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  A porta padrao e 3000, mas voce pode escolher outra porta livre.
echo  Portas recomendadas: 3001, 3002, 8080, 8081, 8000, 5000
echo.
echo  Portas ocupadas atualmente:
netstat -an | findstr ":300" | findstr "LISTENING"
netstat -an | findstr ":800" | findstr "LISTENING"
netstat -an | findstr ":500" | findstr "LISTENING"
echo.
set /p nova_porta="Digite a nova porta (exemplo: 3001): "

:: Validar porta
if "%nova_porta%"=="" (
    echo Porta nao informada, usando porta padrao 3000
    set nova_porta=3000
)

:: Verificar se a porta esta livre
echo.
echo Verificando se a porta %nova_porta% esta livre...
netstat -an | findstr ":%nova_porta% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo AVISO: Porta %nova_porta% parece estar ocupada, mas tentaremos usar mesmo assim.
    echo.
    pause
) else (
    echo Porta %nova_porta% esta livre!
)

:: Parar processos existentes
echo.
echo Parando processos Node.js existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Navegar para pasta
cd /d "%USERPROFILE%\EntregaFacil"

:: Criar/atualizar config.json com nova porta
echo.
echo Atualizando configuracao com porta %nova_porta%...
set CLIENT_ID=client_%RANDOM%_%RANDOM%
(
echo {
echo   "businessName": "Meu Negocio",
echo   "businessEmail": "contato@meunegocio.com",
echo   "businessPhone": "^(11^) 99999-9999",
echo   "businessAddress": "Rua Principal, 123",
echo   "businessCity": "Minha Cidade",
echo   "businessState": "SP",
echo   "clientId": "%CLIENT_ID%",
echo   "localPort": %nova_porta%,
echo   "syncEnabled": true,
echo   "version": "1.0.0",
echo   "installDate": "%DATE% %TIME%"
echo }
) > config.json

:: Criar atalho atualizado na area de trabalho
echo.
echo Criando atalho atualizado...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Entrega Facil.lnk'); $Shortcut.TargetPath = 'http://localhost:%nova_porta%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Save()}" >nul 2>&1

:: Iniciar servidor
echo.
echo ===============================================
echo   SISTEMA ENTREGA FACIL INICIANDO...
echo   NOVA PORTA: %nova_porta%
echo ===============================================
echo.
echo Acesse: http://localhost:%nova_porta%
echo.

node server.js