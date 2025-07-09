@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo      ENTREGA FACIL - INSTALADOR AUTOMATICO
echo ==========================================
echo.

:: Definir variaveis
set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LOCAL_PORT=3000"

:: Verificar se o Node.js esta instalado
echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js antes de continuar:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo Node.js encontrado!

:: Criar diretorio de instalacao
echo [2/8] Criando diretorios...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
echo Diretorios criados!

:: Baixar e instalar dependencias
echo [3/8] Instalando dependencias...
cd /d "%INSTALL_DIR%"
echo {> package.json
echo   "name": "entrega-facil-local",>> package.json
echo   "version": "1.0.0",>> package.json
echo   "description": "Sistema Local Entrega Facil",>> package.json
echo   "main": "server.js",>> package.json
echo   "scripts": {>> package.json
echo     "start": "node server.js",>> package.json
echo     "install-service": "node install-service.js">> package.json
echo   },>> package.json
echo   "dependencies": {>> package.json
echo     "express": "^4.18.2",>> package.json
echo     "sqlite3": "^5.1.6",>> package.json
echo     "cors": "^2.8.5",>> package.json
echo     "body-parser": "^1.20.2",>> package.json
echo     "axios": "^1.6.0",>> package.json
echo     "node-cron": "^3.0.3",>> package.json
echo     "node-windows": "^1.0.0-beta.8">> package.json
echo   }>> package.json
echo }>> package.json

call npm install --silent
if %errorlevel% neq 0 (
    echo ERRO: Falha na instalacao das dependencias!
    pause
    exit /b 1
)
echo Dependencias instaladas!

:: Criar arquivo de configuracao
echo [4/8] Criando configuracao...
echo {> config.json
echo   "businessName": "Meu Negocio",>> config.json
echo   "businessEmail": "contato@meunegocio.com",>> config.json
echo   "businessPhone": "(11) 99999-9999",>> config.json
echo   "businessAddress": "Rua Principal, 123",>> config.json
echo   "businessCity": "Minha Cidade",>> config.json
echo   "businessState": "SP",>> config.json
echo   "clientId": "client_%RANDOM%_%RANDOM%",>> config.json
echo   "licenseKey": "trial_license_key",>> config.json
echo   "adminApiUrl": "https://admin.entregafacil.com/api",>> config.json
echo   "localPort": %LOCAL_PORT%,>> config.json
echo   "syncEnabled": true,>> config.json
echo   "syncInterval": 300000,>> config.json
echo   "autoStart": true,>> config.json
echo   "installDate": "%DATE% %TIME%">> config.json
echo }>> config.json
echo Configuracao criada!

:: Criar servidor local
echo [5/8] Criando servidor local...
echo const express = require('express');> server.js
echo const sqlite3 = require('sqlite3').verbose();>> server.js
echo const cors = require('cors');>> server.js
echo const bodyParser = require('body-parser');>> server.js
echo const axios = require('axios');>> server.js
echo const cron = require('node-cron');>> server.js
echo const path = require('path');>> server.js
echo const fs = require('fs');>> server.js
echo.>> server.js
echo // Ler configuracao>> server.js
echo const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));>> server.js
echo.>> server.js
echo const app = express();>> server.js
echo const PORT = config.localPort;>> server.js
echo.>> server.js
echo // Middleware>> server.js
echo app.use(cors());>> server.js
echo app.use(bodyParser.json());>> server.js
echo app.use(express.static(path.join(__dirname, 'public')));>> server.js
echo.>> server.js
echo // Inicializar banco de dados>> server.js
echo const db = new sqlite3.Database('./database.sqlite');>> server.js
echo.>> server.js
echo // Criar tabelas>> server.js
echo db.serialize(() =^> {>> server.js
echo   db.run(`CREATE TABLE IF NOT EXISTS merchants (>> server.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,>> server.js
echo     name TEXT NOT NULL,>> server.js
echo     email TEXT UNIQUE NOT NULL,>> server.js
echo     phone TEXT,>> server.js
echo     address TEXT,>> server.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,>> server.js
echo     synced_at DATETIME>> server.js
echo   )`);>> server.js
echo.>> server.js
echo   db.run(`CREATE TABLE IF NOT EXISTS deliverers (>> server.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,>> server.js
echo     name TEXT NOT NULL,>> server.js
echo     email TEXT UNIQUE NOT NULL,>> server.js
echo     phone TEXT,>> server.js
echo     vehicle_type TEXT,>> server.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,>> server.js
echo     synced_at DATETIME>> server.js
echo   )`);>> server.js
echo.>> server.js
echo   db.run(`CREATE TABLE IF NOT EXISTS deliveries (>> server.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,>> server.js
echo     merchant_id INTEGER,>> server.js
echo     deliverer_id INTEGER,>> server.js
echo     customer_name TEXT NOT NULL,>> server.js
echo     customer_phone TEXT,>> server.js
echo     pickup_address TEXT NOT NULL,>> server.js
echo     delivery_address TEXT NOT NULL,>> server.js
echo     price REAL NOT NULL,>> server.js
echo     status TEXT DEFAULT 'pending',>> server.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,>> server.js
echo     synced_at DATETIME>> server.js
echo   )`);>> server.js
echo });>> server.js
echo.>> server.js
echo // Rotas da API>> server.js
echo app.get('/api/status', (req, res) =^> {>> server.js
echo   res.json({>> server.js
echo     status: 'online',>> server.js
echo     config: config,>> server.js
echo     uptime: process.uptime()>> server.js
echo   });>> server.js
echo });>> server.js
echo.>> server.js
echo // Servir pagina principal>> server.js
echo app.get('/', (req, res) =^> {>> server.js
echo   res.send(`^<!DOCTYPE html^>^<html^>^<head^>^<title^>Entrega Facil - ${config.businessName}^</title^>^<style^>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5;}h1{color:#333;text-align:center;}.container{max-width:800px;margin:0 auto;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}.status{padding:10px;margin:10px 0;border-radius:4px;}.online{background:#d4edda;color:#155724;border:1px solid #c3e6cb;}.info{background:#d1ecf1;color:#0c5460;border:1px solid #bee5eb;}^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🚚 Entrega Facil^</h1^>^<div class="status online"^>✅ Sistema Online^</div^>^<div class="info"^>^<strong^>Negocio:^</strong^> ${config.businessName}^<br^>^<strong^>Email:^</strong^> ${config.businessEmail}^<br^>^<strong^>Telefone:^</strong^> ${config.businessPhone}^<br^>^<strong^>Endereco:^</strong^> ${config.businessAddress}^<br^>^<strong^>Cliente ID:^</strong^> ${config.clientId}^</div^>^<div class="info"^>^<strong^>Porta:^</strong^> ${PORT}^<br^>^<strong^>Sincronizacao:^</strong^> ${config.syncEnabled ? 'Ativada' : 'Desativada'}^<br^>^<strong^>Instalado em:^</strong^> ${config.installDate}^</div^>^</div^>^</body^>^</html^>`);>> server.js
echo });>> server.js
echo.>> server.js
echo // Sincronizacao automatica>> server.js
echo if (config.syncEnabled) {>> server.js
echo   cron.schedule('*/5 * * * *', async () =^> {>> server.js
echo     try {>> server.js
echo       console.log('Sincronizando dados...');>> server.js
echo       // Implementar sincronizacao aqui>> server.js
echo     } catch (error) {>> server.js
echo       console.error('Erro na sincronizacao:', error);>> server.js
echo     }>> server.js
echo   });>> server.js
echo }>> server.js
echo.>> server.js
echo // Iniciar servidor>> server.js
echo app.listen(PORT, () =^> {>> server.js
echo   console.log(`Entrega Facil rodando em http://localhost:${PORT}`);>> server.js
echo   console.log(`Negocio: ${config.businessName}`);>> server.js
echo   console.log(`Cliente ID: ${config.clientId}`);>> server.js
echo });>> server.js
echo Servidor criado!

:: Criar servico do Windows
echo [6/8] Configurando servico do Windows...
echo const Service = require('node-windows').Service;> install-service.js
echo const path = require('path');>> install-service.js
echo.>> install-service.js
echo const svc = new Service({>> install-service.js
echo   name: 'EntregaFacilService',>> install-service.js
echo   description: 'Servico do Sistema Entrega Facil',>> install-service.js
echo   script: path.join(__dirname, 'server.js'),>> install-service.js
echo   nodeOptions: [>> install-service.js
echo     '--harmony',>> install-service.js
echo     '--max_old_space_size=4096'>> install-service.js
echo   ]>> install-service.js
echo });>> install-service.js
echo.>> install-service.js
echo svc.on('install', () =^> {>> install-service.js
echo   console.log('Servico instalado com sucesso!');>> install-service.js
echo   svc.start();>> install-service.js
echo });>> install-service.js
echo.>> install-service.js
echo svc.on('start', () =^> {>> install-service.js
echo   console.log('Servico iniciado com sucesso!');>> install-service.js
echo   process.exit(0);>> install-service.js
echo });>> install-service.js
echo.>> install-service.js
echo svc.install();>> install-service.js

call node install-service.js
echo Servico configurado!

:: Criar atalho na area de trabalho
echo [7/8] Criando atalhos...
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo Set oMyShortcut = WshShell.CreateShortcut("%DESKTOP_DIR%\Entrega Facil.lnk") >> "%TEMP%\create_shortcut.vbs"
echo oMyShortcut.TargetPath = "http://localhost:%LOCAL_PORT%" >> "%TEMP%\create_shortcut.vbs"
echo oMyShortcut.IconLocation = "shell32.dll,13" >> "%TEMP%\create_shortcut.vbs"
echo oMyShortcut.Save >> "%TEMP%\create_shortcut.vbs"
cscript /nologo "%TEMP%\create_shortcut.vbs"
del "%TEMP%\create_shortcut.vbs"
echo Atalho criado na area de trabalho!

:: Iniciar aplicacao
echo [8/8] Iniciando aplicacao...
start http://localhost:%LOCAL_PORT%
echo.
echo ==========================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ==========================================
echo.
echo 🌐 Sistema: http://localhost:%LOCAL_PORT%
echo 📁 Pasta: %INSTALL_DIR%
echo 🔄 Servico: EntregaFacilService (Iniciado)
echo 🚀 Atalho: Criado na area de trabalho
echo.
echo O sistema ja esta rodando e sera iniciado
echo automaticamente sempre que o Windows iniciar.
echo.
pause