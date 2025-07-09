@echo off
title Corrigindo Configuracao do Entrega Facil

echo Corrigindo arquivo de configuracao...

cd /d "%USERPROFILE%\EntregaFacil"

:: Criar configuracao correta
set CLIENT_ID=client_%RANDOM%_%RANDOM%
(
echo {
echo   "businessName": "Meu Negocio",
echo   "businessEmail": "contato@meunegocio.com",
echo   "businessPhone": "^(11^) 99999-9999",
echo   "businessAddress": "Rua Principal, 123",
echo   "businessCity": "Minha Cidade",
echo   "businessState": "SP",
echo   "businessCep": "12345-678",
echo   "clientId": "%CLIENT_ID%",
echo   "licenseKey": "trial_license_key",
echo   "adminApiUrl": "https://admin.entregafacil.com/api",
echo   "localPort": 3000,
echo   "syncEnabled": true,
echo   "syncInterval": 300000,
echo   "autoStart": true,
echo   "version": "1.0.0",
echo   "installDate": "%DATE% %TIME%"
echo }
) > config.json

echo Configuracao corrigida!
echo.
echo Agora execute: node server.js
echo.
pause