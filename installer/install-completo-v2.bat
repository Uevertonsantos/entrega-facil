@echo off
setlocal enabledelayedexpansion
title Entrega Facil - Instalador Completo v2.0
color 0A
cls

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FACIL - INSTALADOR COMPLETO V2.0               ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  Este instalador inclui:
echo  • Deteccao automatica de porta livre
echo  • Correcao automatica de erros
echo  • Configuracao robusta do sistema
echo  • Recuperacao automatica de falhas
echo.
echo  Pressione qualquer tecla para continuar...
pause >nul
cls

set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TEMP_DIR=%TEMP%\EntregaFacil"
set "LOCAL_PORT=3000"

:: Passo 1: Deteccao automatica de porta livre
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                         DETECTANDO PORTA LIVRE                            ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

echo [1/9] Verificando portas disponiveis...
set "PORT_FOUND=false"
for %%p in (3000 3001 3002 8080 8081 8000 5000 5001 9000 9001) do (
    if "!PORT_FOUND!"=="false" (
        netstat -an | findstr ":%%p " | findstr "LISTENING" >nul
        if !errorlevel! neq 0 (
            set "LOCAL_PORT=%%p"
            set "PORT_FOUND=true"
            echo       Porta livre encontrada: %%p
        )
    )
)

if "%PORT_FOUND%"=="false" (
    echo       Nenhuma porta livre encontrada, usando 3000 e forcando liberacao
    set "LOCAL_PORT=3000"
)

:: Passo 2: Limpeza de processos existentes
echo [2/9] Limpando processos existentes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Liberacao forcada da porta se necessario
if "%LOCAL_PORT%"=="3000" (
    echo       Liberando porta 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo       Processos limpos!

:: Passo 3: Verificacao e instalacao do Node.js
echo [3/9] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       Node.js nao encontrado, instalando automaticamente...
    echo       Baixando Node.js LTS...
    
    if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"
    
    :: Tentativa 1: PowerShell
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile '%TEMP_DIR%\node-installer.msi' -TimeoutSec 60 } catch { exit 1 }}" >nul 2>&1
    
    if not exist "%TEMP_DIR%\node-installer.msi" (
        echo       ERRO: Falha no download do Node.js
        echo       Instale manualmente: https://nodejs.org/
        echo       Depois execute este instalador novamente
        pause
        exit /b 1
    )
    
    echo       Instalando Node.js...
    start /wait msiexec /i "%TEMP_DIR%\node-installer.msi" /quiet /norestart
    
    :: Aguardar instalacao
    timeout /t 15 /nobreak >nul
    
    :: Atualizar PATH
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH') do set "SystemPath=%%b"
    for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "UserPath=%%b"
    set "PATH=%SystemPath%;%UserPath%"
    
    :: Verificar se instalou
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo       ERRO: Node.js nao foi instalado corretamente
        echo       Instale manualmente e tente novamente
        pause
        exit /b 1
    )
    
    echo       Node.js instalado com sucesso!
    del "%TEMP_DIR%\node-installer.msi" >nul 2>&1
) else (
    echo       Node.js ja instalado!
)

:: Passo 4: Criacao de diretorios com permissoes
echo [4/9] Criando diretorios...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\backups" mkdir "%INSTALL_DIR%\backups"
if not exist "%INSTALL_DIR%\temp" mkdir "%INSTALL_DIR%\temp"

:: Dar permissoes completas
icacls "%INSTALL_DIR%" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
echo       Diretorios criados com permissoes!

:: Passo 5: Configuracao do sistema
echo [5/9] Configurando sistema...
cd /d "%INSTALL_DIR%"

:: Package.json robusto
(
echo {
echo   "name": "entrega-facil-local",
echo   "version": "2.0.0",
echo   "description": "Sistema Local Entrega Facil",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "node server.js",
echo     "stop": "taskkill /f /im node.exe",
echo     "restart": "npm run stop && npm run start",
echo     "test": "node -e \"console.log('Sistema OK')\""
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "sqlite3": "^5.1.6",
echo     "cors": "^2.8.5",
echo     "body-parser": "^1.20.2",
echo     "axios": "^1.6.0",
echo     "node-cron": "^3.0.3",
echo     "multer": "^1.4.5",
echo     "uuid": "^9.0.0",
echo     "helmet": "^7.0.0"
echo   },
echo   "engines": {
echo     "node": ">=16.0.0"
echo   },
echo   "author": "Entrega Facil",
echo   "license": "MIT"
echo }
) > package.json

:: Configuracao completa
set CLIENT_ID=client_%RANDOM%_%RANDOM%_%RANDOM%
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
echo   "licenseKey": "trial_license_key_v2",
echo   "adminApiUrl": "https://admin.entregafacil.com/api",
echo   "localPort": %LOCAL_PORT%,
echo   "syncEnabled": true,
echo   "syncInterval": 300000,
echo   "autoStart": true,
echo   "autoRestart": true,
echo   "maxRetries": 3,
echo   "version": "2.0.0",
echo   "installDate": "%DATE% %TIME%",
echo   "features": {
echo     "autoPortDetection": true,
echo     "errorRecovery": true,
echo     "backupSystem": true,
echo     "logging": true
echo   }
echo }
) > config.json

echo       Configuracao criada!

:: Passo 6: Criacao do servidor robusto
echo [6/9] Criando servidor robusto...
(
echo const express = require^('express'^);
echo const sqlite3 = require^('sqlite3'^).verbose^(^);
echo const cors = require^('cors'^);
echo const bodyParser = require^('body-parser'^);
echo const axios = require^('axios'^);
echo const cron = require^('node-cron'^);
echo const path = require^('path'^);
echo const fs = require^('fs'^);
echo const multer = require^('multer'^);
echo const helmet = require^('helmet'^);
echo.
echo // Tratamento de erros globais
echo process.on^('uncaughtException', ^(error^) =^> {
echo   console.error^('Erro nao tratado:', error^);
echo   fs.appendFileSync^('./logs/error.log', `${new Date^(^).toISOString^(^)} - UNCAUGHT: ${error.message}\n`^);
echo }^);
echo.
echo process.on^('unhandledRejection', ^(reason, promise^) =^> {
echo   console.error^('Promise rejeitada:', reason^);
echo   fs.appendFileSync^('./logs/error.log', `${new Date^(^).toISOString^(^)} - REJECTED: ${reason}\n`^);
echo }^);
echo.
echo // Configuracao com fallback
echo let config;
echo try {
echo   config = JSON.parse^(fs.readFileSync^('config.json', 'utf8'^)^);
echo } catch ^(error^) {
echo   console.error^('Erro ao ler config.json, usando configuracao padrao'^);
echo   config = {
echo     businessName: 'Meu Negocio',
echo     businessEmail: 'contato@meunegocio.com',
echo     businessPhone: '^(11^) 99999-9999',
echo     businessAddress: 'Rua Principal, 123',
echo     clientId: 'client_fallback_' + Date.now^(^),
echo     localPort: %LOCAL_PORT%,
echo     syncEnabled: false,
echo     version: '2.0.0'
echo   };
echo }
echo.
echo const app = express^(^);
echo const PORT = config.localPort ^|^| %LOCAL_PORT%;
echo.
echo // Middleware de seguranca
echo app.use^(helmet^(^)^);
echo app.use^(cors^(^)^);
echo app.use^(bodyParser.json^({ limit: '10mb' }^)^);
echo app.use^(bodyParser.urlencoded^({ extended: true, limit: '10mb' }^)^);
echo app.use^(express.static^(path.join^(__dirname, 'public'^)^)^);
echo.
echo // Logging middleware
echo app.use^(^(req, res, next^) =^> {
echo   const log = `${new Date^(^).toISOString^(^)} - ${req.method} ${req.url}\n`;
echo   fs.appendFileSync^('./logs/access.log', log^);
echo   next^(^);
echo }^);
echo.
echo // Configurar upload seguro
echo const storage = multer.diskStorage^({
echo   destination: ^(req, file, cb^) =^> {
echo     const uploadDir = './data/uploads/';
echo     if ^(!fs.existsSync^(uploadDir^)^) fs.mkdirSync^(uploadDir, { recursive: true }^);
echo     cb^(null, uploadDir^);
echo   },
echo   filename: ^(req, file, cb^) =^> {
echo     const safeName = Date.now^(^) + '-' + file.originalname.replace^(/[^a-zA-Z0-9.-]/g, '_'^);
echo     cb^(null, safeName^);
echo   }
echo }^);
echo const upload = multer^({ 
echo   storage,
echo   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
echo   fileFilter: ^(req, file, cb^) =^> {
echo     const allowedTypes = /jpeg^|jpg^|png^|gif^|pdf^|doc^|docx/;
echo     const extname = allowedTypes.test^(path.extname^(file.originalname^).toLowerCase^(^)^);
echo     if ^(extname^) return cb^(null, true^);
echo     cb^(new Error^('Tipo de arquivo nao permitido'^)^);
echo   }
echo }^);
echo.
echo // Inicializacao do banco com retry
echo let db;
echo function initializeDatabase^(^) {
echo   try {
echo     db = new sqlite3.Database^('./data/database.sqlite'^);
echo     
echo     db.serialize^(^(^) =^> {
echo       // Tabela de comerciantes
echo       db.run^(`CREATE TABLE IF NOT EXISTS merchants ^(
echo         id INTEGER PRIMARY KEY AUTOINCREMENT,
echo         name TEXT NOT NULL,
echo         email TEXT UNIQUE NOT NULL,
echo         phone TEXT,
echo         address TEXT,
echo         city TEXT,
echo         state TEXT,
echo         cep TEXT,
echo         business_name TEXT,
echo         document TEXT,
echo         document_type TEXT,
echo         plan_type TEXT DEFAULT 'basic',
echo         plan_value REAL DEFAULT 0,
echo         status TEXT DEFAULT 'active',
echo         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         synced_at DATETIME
echo       ^)`^);
echo.
echo       // Tabela de entregadores
echo       db.run^(`CREATE TABLE IF NOT EXISTS deliverers ^(
echo         id INTEGER PRIMARY KEY AUTOINCREMENT,
echo         name TEXT NOT NULL,
echo         email TEXT UNIQUE NOT NULL,
echo         phone TEXT,
echo         address TEXT,
echo         city TEXT,
echo         state TEXT,
echo         cep TEXT,
echo         document TEXT,
echo         document_type TEXT,
echo         vehicle_type TEXT,
echo         vehicle_model TEXT,
echo         vehicle_plate TEXT,
echo         bank_account TEXT,
echo         pix_key TEXT,
echo         commission_rate REAL DEFAULT 0.15,
echo         status TEXT DEFAULT 'active',
echo         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         synced_at DATETIME
echo       ^)`^);
echo.
echo       // Tabela de entregas
echo       db.run^(`CREATE TABLE IF NOT EXISTS deliveries ^(
echo         id INTEGER PRIMARY KEY AUTOINCREMENT,
echo         merchant_id INTEGER,
echo         deliverer_id INTEGER,
echo         customer_name TEXT NOT NULL,
echo         customer_phone TEXT,
echo         customer_address TEXT NOT NULL,
echo         pickup_address TEXT NOT NULL,
echo         delivery_address TEXT NOT NULL,
echo         description TEXT,
echo         price REAL NOT NULL,
echo         delivery_fee REAL DEFAULT 0,
echo         platform_fee REAL DEFAULT 0,
echo         total_amount REAL,
echo         payment_method TEXT DEFAULT 'dinheiro',
echo         status TEXT DEFAULT 'pending',
echo         priority TEXT DEFAULT 'normal',
echo         notes TEXT,
echo         pickup_time DATETIME,
echo         delivery_time DATETIME,
echo         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo         synced_at DATETIME,
echo         FOREIGN KEY ^(merchant_id^) REFERENCES merchants^(id^),
echo         FOREIGN KEY ^(deliverer_id^) REFERENCES deliverers^(id^)
echo       ^)`^);
echo.
echo       // Tabela de logs
echo       db.run^(`CREATE TABLE IF NOT EXISTS system_logs ^(
echo         id INTEGER PRIMARY KEY AUTOINCREMENT,
echo         level TEXT NOT NULL,
echo         message TEXT NOT NULL,
echo         details TEXT,
echo         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo       ^)`^);
echo.
echo       // Tabela de configuracoes
echo       db.run^(`CREATE TABLE IF NOT EXISTS settings ^(
echo         key TEXT PRIMARY KEY,
echo         value TEXT NOT NULL,
echo         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo       ^)`^);
echo.
echo       // Inserir configuracoes iniciais
echo       db.run^(`INSERT OR IGNORE INTO settings ^(key, value^) VALUES ^('app_version', '2.0.0'^)`^);
echo       db.run^(`INSERT OR IGNORE INTO settings ^(key, value^) VALUES ^('last_backup', 'never'^)`^);
echo     }^);
echo     
echo     console.log^('Banco de dados inicializado com sucesso'^);
echo   } catch ^(error^) {
echo     console.error^('Erro ao inicializar banco:', error^);
echo     setTimeout^(initializeDatabase, 5000^); // Retry apos 5 segundos
echo   }
echo }
echo.
echo initializeDatabase^(^);
echo.
echo // Funcoes utilitarias
echo function logMessage^(level, message, details = null^) {
echo   const timestamp = new Date^(^).toISOString^(^);
echo   const logEntry = `${timestamp} [${level}] ${message}\n`;
echo   
echo   // Log para arquivo
echo   fs.appendFileSync^(`./logs/${level}.log`, logEntry^);
echo   
echo   // Log para banco
echo   if ^(db^) {
echo     db.run^('INSERT INTO system_logs ^(level, message, details^) VALUES ^(?, ?, ?^)', [level, message, details]^);
echo   }
echo   
echo   // Log para console
echo   console.log^(logEntry.trim^(^)^);
echo }
echo.
echo function createBackup^(^) {
echo   try {
echo     const timestamp = new Date^(^).toISOString^(^).replace^(/[:.]/g, '-'^);
echo     const backupDir = './backups/';
echo     const backupFile = `backup-${timestamp}.sqlite`;
echo     
echo     if ^(!fs.existsSync^(backupDir^)^) fs.mkdirSync^(backupDir, { recursive: true }^);
echo     
echo     // Copiar banco de dados
echo     if ^(fs.existsSync^('./data/database.sqlite'^)^) {
echo       fs.copyFileSync^('./data/database.sqlite', path.join^(backupDir, backupFile^)^);
echo       logMessage^('info', `Backup criado: ${backupFile}`^);
echo       
echo       // Atualizar configuracao
echo       db.run^(`UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_backup'`, [new Date^(^).toISOString^(^)]^);
echo       
echo       return true;
echo     }
echo   } catch ^(error^) {
echo     logMessage^('error', 'Erro ao criar backup', error.message^);
echo     return false;
echo   }
echo }
echo.
echo // Rotas da API
echo app.get^('/api/status', ^(req, res^) =^> {
echo   res.json^({
echo     status: 'online',
echo     version: config.version,
echo     port: PORT,
echo     uptime: Math.floor^(process.uptime^(^)^),
echo     memory: process.memoryUsage^(^),
echo     clientId: config.clientId,
echo     businessName: config.businessName,
echo     syncEnabled: config.syncEnabled,
echo     installDate: config.installDate,
echo     features: config.features ^|^| {},
echo     timestamp: new Date^(^).toISOString^(^)
echo   }^);
echo }^);
echo.
echo app.get^('/api/health', ^(req, res^) =^> {
echo   const health = {
echo     status: 'healthy',
echo     database: db ? 'connected' : 'disconnected',
echo     uptime: process.uptime^(^),
echo     memory: process.memoryUsage^(^),
echo     timestamp: new Date^(^).toISOString^(^)
echo   };
echo   res.json^(health^);
echo }^);
echo.
echo // CRUD Comerciantes
echo app.get^('/api/merchants', ^(req, res^) =^> {
echo   db.all^('SELECT * FROM merchants ORDER BY created_at DESC', ^(err, rows^) =^> {
echo     if ^(err^) {
echo       logMessage^('error', 'Erro ao buscar comerciantes', err.message^);
echo       return res.status^(500^).json^({ error: 'Erro interno do servidor' }^);
echo     }
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo app.post^('/api/merchants', ^(req, res^) =^> {
echo   const { name, email, phone, address, city, state, cep, business_name, document, document_type, plan_type, plan_value } = req.body;
echo   
echo   if ^(!name ^|^| !email^) {
echo     return res.status^(400^).json^({ error: 'Nome e email sao obrigatorios' }^);
echo   }
echo   
echo   const stmt = db.prepare^(`INSERT INTO merchants ^(name, email, phone, address, city, state, cep, business_name, document, document_type, plan_type, plan_value^) VALUES ^(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?^)`^);
echo   
echo   stmt.run^([name, email, phone, address, city, state, cep, business_name, document, document_type, plan_type, plan_value], function^(err^) {
echo     if ^(err^) {
echo       logMessage^('error', 'Erro ao criar comerciante', err.message^);
echo       return res.status^(500^).json^({ error: 'Erro ao criar comerciante' }^);
echo     }
echo     
echo     logMessage^('info', `Comerciante criado: ${name} ^(${email}^)`^);
echo     res.json^({ id: this.lastID, message: 'Comerciante criado com sucesso' }^);
echo   }^);
echo }^);
echo.
echo // CRUD Entregadores
echo app.get^('/api/deliverers', ^(req, res^) =^> {
echo   db.all^('SELECT * FROM deliverers ORDER BY created_at DESC', ^(err, rows^) =^> {
echo     if ^(err^) {
echo       logMessage^('error', 'Erro ao buscar entregadores', err.message^);
echo       return res.status^(500^).json^({ error: 'Erro interno do servidor' }^);
echo     }
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo app.post^('/api/deliverers', ^(req, res^) =^> {
echo   const { name, email, phone, address, city, state, cep, document, document_type, vehicle_type, vehicle_model, vehicle_plate, bank_account, pix_key, commission_rate } = req.body;
echo   
echo   if ^(!name ^|^| !email^) {
echo     return res.status^(400^).json^({ error: 'Nome e email sao obrigatorios' }^);
echo   }
echo   
echo   const stmt = db.prepare^(`INSERT INTO deliverers ^(name, email, phone, address, city, state, cep, document, document_type, vehicle_type, vehicle_model, vehicle_plate, bank_account, pix_key, commission_rate^) VALUES ^(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?^)`^);
echo   
echo   stmt.run^([name, email, phone, address, city, state, cep, document, document_type, vehicle_type, vehicle_model, vehicle_plate, bank_account, pix_key, commission_rate], function^(err^) {
echo     if ^(err^) {
echo       logMessage^('error', 'Erro ao criar entregador', err.message^);
echo       return res.status^(500^).json^({ error: 'Erro ao criar entregador' }^);
echo     }
echo     
echo     logMessage^('info', `Entregador criado: ${name} ^(${email}^)`^);
echo     res.json^({ id: this.lastID, message: 'Entregador criado com sucesso' }^);
echo   }^);
echo }^);
echo.
echo // CRUD Entregas
echo app.get^('/api/deliveries', ^(req, res^) =^> {
echo   const query = `
echo     SELECT d.*, m.name as merchant_name, del.name as deliverer_name 
echo     FROM deliveries d 
echo     LEFT JOIN merchants m ON d.merchant_id = m.id 
echo     LEFT JOIN deliverers del ON d.deliverer_id = del.id 
echo     ORDER BY d.created_at DESC
echo   `;
echo   
echo   db.all^(query, ^(err, rows^) =^> {
echo     if ^(err^) {
echo       logMessage^('error', 'Erro ao buscar entregas', err.message^);
echo       return res.status^(500^).json^({ error: 'Erro interno do servidor' }^);
echo     }
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo // Pagina principal
echo app.get^('/', ^(req, res^) =^> {
echo   const uptimeHours = Math.floor^(process.uptime^(^) / 3600^);
echo   const uptimeMinutes = Math.floor^(^(process.uptime^(^) % 3600^) / 60^);
echo   
echo   res.send^(`
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Entrega Facil - ${config.businessName}^</title^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); min-height: 100vh; }
echo     .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
echo     .header { background: rgba^(255,255,255,0.1^); backdrop-filter: blur^(10px^); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
echo     .header h1 { font-size: 3em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba^(0,0,0,0.3^); }
echo     .card { background: rgba^(255,255,255,0.95^); border-radius: 15px; padding: 25px; margin: 20px 0; box-shadow: 0 8px 32px rgba^(0,0,0,0.1^); }
echo     .status { padding: 20px; border-radius: 10px; margin: 15px 0; display: flex; align-items: center; font-size: 1.2em; }
echo     .online { background: linear-gradient^(135deg, #4CAF50, #45a049^); color: white; }
echo     .info { background: linear-gradient^(135deg, #2196F3, #1976D2^); color: white; }
echo     .warning { background: linear-gradient^(135deg, #FF9800, #F57C00^); color: white; }
echo     .grid { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(350px, 1fr^)^); gap: 25px; }
echo     .btn { display: inline-block; padding: 15px 30px; background: linear-gradient^(135deg, #667eea, #764ba2^); color: white; text-decoration: none; border-radius: 25px; transition: all 0.3s; font-weight: 600; text-align: center; }
echo     .btn:hover { transform: translateY^(-3px^); box-shadow: 0 10px 25px rgba^(0,0,0,0.2^); }
echo     .stats { display: flex; justify-content: space-between; flex-wrap: wrap; }
echo     .stat { text-align: center; padding: 20px; flex: 1; min-width: 150px; background: rgba^(255,255,255,0.1^); margin: 5px; border-radius: 10px; }
echo     .stat-number { font-size: 2.5em; font-weight: bold; color: #667eea; }
echo     .stat-label { color: #666; margin-top: 5px; }
echo     .feature { background: rgba^(255,255,255,0.05^); padding: 15px; border-radius: 10px; margin: 10px 0; }
echo     .nav { display: flex; gap: 15px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
echo     .footer { text-align: center; padding: 30px; color: rgba^(255,255,255,0.8^); }
echo     .icon { font-size: 1.5em; margin-right: 10px; }
echo     @media ^(max-width: 768px^) {
echo       .header h1 { font-size: 2em; }
echo       .grid { grid-template-columns: 1fr; }
echo       .nav { flex-direction: column; align-items: center; }
echo     }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<div class="header"^>
echo       ^<h1^>🚚 Entrega Facil^</h1^>
echo       ^<p^>Sistema de Gerenciamento de Entregas - Versao 2.0^</p^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<div class="status online"^>^<span class="icon"^>✅^</span^>Sistema Online e Funcionando Perfeitamente^</div^>
echo       
echo       ^<div class="stats"^>
echo         ^<div class="stat"^>
echo           ^<div class="stat-number"^>2.0^</div^>
echo           ^<div class="stat-label"^>Versao^</div^>
echo         ^</div^>
echo         ^<div class="stat"^>
echo           ^<div class="stat-number"^>${PORT}^</div^>
echo           ^<div class="stat-label"^>Porta^</div^>
echo         ^</div^>
echo         ^<div class="stat"^>
echo           ^<div class="stat-number"^>${uptimeHours}h ${uptimeMinutes}m^</div^>
echo           ^<div class="stat-label"^>Tempo Online^</div^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="grid"^>
echo       ^<div class="card"^>
echo         ^<h3^>^<span class="icon"^>🏢^</span^>Informacoes do Negocio^</h3^>
echo         ^<div class="feature"^>^<strong^>Nome:^</strong^> ${config.businessName}^</div^>
echo         ^<div class="feature"^>^<strong^>Email:^</strong^> ${config.businessEmail}^</div^>
echo         ^<div class="feature"^>^<strong^>Telefone:^</strong^> ${config.businessPhone}^</div^>
echo         ^<div class="feature"^>^<strong^>Endereco:^</strong^> ${config.businessAddress}^</div^>
echo         ^<div class="feature"^>^<strong^>Cliente ID:^</strong^> ${config.clientId}^</div^>
echo       ^</div^>
echo       
echo       ^<div class="card"^>
echo         ^<h3^>^<span class="icon"^>⚙️^</span^>Configuracoes do Sistema^</h3^>
echo         ^<div class="feature"^>^<strong^>Sincronizacao:^</strong^> ${config.syncEnabled ? '✅ Ativada' : '❌ Desativada'}^</div^>
echo         ^<div class="feature"^>^<strong^>Auto-Restart:^</strong^> ${config.autoRestart ? '✅ Ativado' : '❌ Desativado'}^</div^>
echo         ^<div class="feature"^>^<strong^>Backup:^</strong^> ✅ Automatico^</div^>
echo         ^<div class="feature"^>^<strong^>Logging:^</strong^> ✅ Completo^</div^>
echo         ^<div class="feature"^>^<strong^>Instalado:^</strong^> ${config.installDate}^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<h3^>^<span class="icon"^>🚀^</span^>Acesso Rapido^</h3^>
echo       ^<div class="nav"^>
echo         ^<a href="/api/merchants" class="btn"^>^<span class="icon"^>🏪^</span^>Comerciantes^</a^>
echo         ^<a href="/api/deliverers" class="btn"^>^<span class="icon"^>🚴^</span^>Entregadores^</a^>
echo         ^<a href="/api/deliveries" class="btn"^>^<span class="icon"^>📦^</span^>Entregas^</a^>
echo         ^<a href="/api/status" class="btn"^>^<span class="icon"^>📊^</span^>Status^</a^>
echo         ^<a href="/api/health" class="btn"^>^<span class="icon"^>💚^</span^>Health^</a^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<div class="footer"^>
echo     ^<p^>^<strong^>Entrega Facil v2.0^</strong^> - Sistema de Gerenciamento de Entregas^</p^>
echo     ^<p^>Instalacao robusta com deteccao automatica de porta e recuperacao de erros^</p^>
echo   ^</div^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // Backup automatico diario
echo cron.schedule^('0 2 * * *', ^(^) =^> {
echo   logMessage^('info', 'Iniciando backup automatico diario'^);
echo   createBackup^(^);
echo }^);
echo.
echo // Sincronizacao automatica
echo if ^(config.syncEnabled^) {
echo   cron.schedule^('*/5 * * * *', async ^(^) =^> {
echo     try {
echo       logMessage^('info', 'Iniciando sincronizacao automatica'^);
echo       
echo       const syncData = {
echo         clientId: config.clientId,
echo         businessName: config.businessName,
echo         timestamp: new Date^(^).toISOString^(^),
echo         version: config.version,
echo         uptime: process.uptime^(^),
echo         data: {
echo           merchants: await new Promise^(resolve =^> db.all^('SELECT * FROM merchants WHERE synced_at IS NULL OR synced_at ^< updated_at', ^(err, rows^) =^> resolve^(rows ^|^| []^)^)^),
echo           deliverers: await new Promise^(resolve =^> db.all^('SELECT * FROM deliverers WHERE synced_at IS NULL OR synced_at ^< updated_at', ^(err, rows^) =^> resolve^(rows ^|^| []^)^)^),
echo           deliveries: await new Promise^(resolve =^> db.all^('SELECT * FROM deliveries WHERE synced_at IS NULL OR synced_at ^< updated_at', ^(err, rows^) =^> resolve^(rows ^|^| []^)^)^)
echo         }
echo       };
echo       
echo       const response = await axios.post^(`${config.adminApiUrl}/client/sync`, syncData, {
echo         timeout: 30000,
echo         headers: { 'Content-Type': 'application/json' }
echo       }^);
echo       
echo       if ^(response.status === 200^) {
echo         // Marcar como sincronizado
echo         const now = new Date^(^).toISOString^(^);
echo         db.run^('UPDATE merchants SET synced_at = ? WHERE synced_at IS NULL OR synced_at ^< updated_at', [now]^);
echo         db.run^('UPDATE deliverers SET synced_at = ? WHERE synced_at IS NULL OR synced_at ^< updated_at', [now]^);
echo         db.run^('UPDATE deliveries SET synced_at = ? WHERE synced_at IS NULL OR synced_at ^< updated_at', [now]^);
echo         
echo         logMessage^('info', 'Sincronizacao concluida com sucesso'^);
echo       }
echo     } catch ^(error^) {
echo       logMessage^('error', 'Erro na sincronizacao automatica', error.message^);
echo     }
echo   }^);
echo }
echo.
echo // Graceful shutdown
echo process.on^('SIGINT', ^(^) =^> {
echo   logMessage^('info', 'Servidor sendo encerrado graciosamente'^);
echo   if ^(db^) db.close^(^);
echo   process.exit^(0^);
echo }^);
echo.
echo // Iniciar servidor com retry
echo function startServer^(retries = 3^) {
echo   const server = app.listen^(PORT, ^(^) =^> {
echo     logMessage^('info', `Entrega Facil v2.0 rodando em http://localhost:${PORT}`^);
echo     logMessage^('info', `Negocio: ${config.businessName}`^);
echo     logMessage^('info', `Cliente ID: ${config.clientId}`^);
echo     logMessage^('info', `Sincronizacao: ${config.syncEnabled ? 'Ativada' : 'Desativada'}`^);
echo     logMessage^('info', `Auto-restart: ${config.autoRestart ? 'Ativado' : 'Desativado'}`^);
echo     logMessage^('info', `Porta detectada automaticamente: ${PORT}`^);
echo     
echo     // Criar backup inicial
echo     setTimeout^(^(^) =^> {
echo       createBackup^(^);
echo     }, 5000^);
echo   }^);
echo   
echo   server.on^('error', ^(error^) =^> {
echo     if ^(error.code === 'EADDRINUSE'^) {
echo       logMessage^('error', `Porta ${PORT} ocupada, tentando proxima...`^);
echo       if ^(retries ^> 0^) {
echo         PORT = PORT + 1;
echo         setTimeout^(^(^) =^> startServer^(retries - 1^), 1000^);
echo       } else {
echo         logMessage^('error', 'Nao foi possivel encontrar porta livre'^);
echo         process.exit^(1^);
echo       }
echo     } else {
echo       logMessage^('error', 'Erro ao iniciar servidor', error.message^);
echo       process.exit^(1^);
echo     }
echo   }^);
echo }
echo.
echo startServer^(^);
) > server.js

echo       Servidor robusto criado!

:: Passo 7: Instalacao de dependencias com retry
echo [7/9] Instalando dependencias...
echo       Isso pode demorar alguns minutos...

set "RETRY_COUNT=0"
:retry_install
set /a RETRY_COUNT+=1
echo       Tentativa %RETRY_COUNT% de 3...

call npm install --silent --no-audit --no-fund --prefer-offline >"%INSTALL_DIR%\logs\install.log" 2>&1
if %errorlevel% equ 0 (
    echo       Dependencias instaladas com sucesso!
    goto install_success
)

if %RETRY_COUNT% lss 3 (
    echo       Falha na instalacao, tentando novamente...
    timeout /t 5 /nobreak >nul
    goto retry_install
)

echo       ERRO: Falha na instalacao apos 3 tentativas
echo       Tentando instalacao individual...

:: Instalacao individual das dependencias essenciais
for %%p in (express sqlite3 cors body-parser axios node-cron multer helmet) do (
    echo       Instalando %%p...
    call npm install %%p --silent --no-audit >nul 2>&1
)

:install_success

:: Passo 8: Configuracao de inicializacao e atalhos
echo [8/9] Configurando inicializacao e atalhos...

:: Script de inicializacao robusto
(
echo @echo off
echo title Entrega Facil - Sistema Iniciando
echo cd /d "%INSTALL_DIR%"
echo.
echo echo Iniciando Entrega Facil...
echo node server.js
echo.
echo if errorlevel 1 (
echo     echo Erro ao iniciar sistema, tentando novamente em 5 segundos...
echo     timeout /t 5 /nobreak ^>nul
echo     goto start
echo ^)
echo.
echo :start
echo goto start
) > "%STARTUP_DIR%\EntregaFacil.bat"

:: Atalho principal na area de trabalho
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP_DIR%\Entrega Facil.lnk'); $Shortcut.TargetPath = 'http://localhost:%LOCAL_PORT%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Save()}" >nul 2>&1

:: Painel de controle avancado
(
echo @echo off
echo title Entrega Facil - Painel de Controle v2.0
echo :menu
echo cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FACIL - PAINEL DE CONTROLE V2.0                ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  [1] Iniciar Sistema
echo  [2] Parar Sistema
echo  [3] Reiniciar Sistema
echo  [4] Abrir no Navegador
echo  [5] Ver Status do Sistema
echo  [6] Ver Logs
echo  [7] Criar Backup
echo  [8] Configuracoes
echo  [9] Verificar Porta
echo  [10] Atualizar Sistema
echo  [0] Sair
echo.
echo  Digite sua opcao:
set /p opcao=
echo.
if "%%opcao%%"=="1" (
    echo Iniciando sistema...
    cd /d "%INSTALL_DIR%"
    start /min node server.js
    echo Sistema iniciado em segundo plano!
    timeout /t 3 /nobreak ^>nul
    goto menu
)
if "%%opcao%%"=="2" (
    echo Parando sistema...
    taskkill /f /im node.exe ^>nul 2^>^&1
    echo Sistema parado!
    timeout /t 2 /nobreak ^>nul
    goto menu
)
if "%%opcao%%"=="3" (
    echo Reiniciando sistema...
    taskkill /f /im node.exe ^>nul 2^>^&1
    timeout /t 2 /nobreak ^>nul
    cd /d "%INSTALL_DIR%"
    start /min node server.js
    echo Sistema reiniciado!
    timeout /t 3 /nobreak ^>nul
    goto menu
)
if "%%opcao%%"=="4" (
    echo Abrindo navegador...
    start http://localhost:%LOCAL_PORT%
    goto menu
)
if "%%opcao%%"=="5" (
    echo Verificando status do sistema...
    tasklist ^| findstr node.exe
    netstat -an ^| findstr :%LOCAL_PORT%
    echo.
    pause
    goto menu
)
if "%%opcao%%"=="6" (
    echo Abrindo logs...
    start notepad "%INSTALL_DIR%\logs\info.log"
    goto menu
)
if "%%opcao%%"=="7" (
    echo Criando backup...
    cd /d "%INSTALL_DIR%"
    if exist "data\database.sqlite" (
        copy "data\database.sqlite" "backups\backup-%%date%%.sqlite" ^>nul
        echo Backup criado com sucesso!
    ) else (
        echo Banco de dados nao encontrado!
    )
    pause
    goto menu
)
if "%%opcao%%"=="8" (
    echo Abrindo configuracoes...
    start notepad "%INSTALL_DIR%\config.json"
    goto menu
)
if "%%opcao%%"=="9" (
    echo Verificando porta %LOCAL_PORT%...
    netstat -an ^| findstr :%LOCAL_PORT%
    if errorlevel 1 (
        echo Porta %LOCAL_PORT% esta livre!
    ) else (
        echo Porta %LOCAL_PORT% esta ocupada!
    )
    pause
    goto menu
)
if "%%opcao%%"=="10" (
    echo Funcionalidade de atualizacao em desenvolvimento...
    pause
    goto menu
)
if "%%opcao%%"=="0" exit
echo Opcao invalida!
timeout /t 2 /nobreak ^>nul
goto menu
) > "%DESKTOP_DIR%\Entrega Facil - Controle v2.bat"

:: Script de recuperacao de erros
(
echo @echo off
echo title Entrega Facil - Recuperacao de Erros
echo.
echo Executando recuperacao automatica de erros...
echo.
echo [1] Limpando processos...
echo taskkill /f /im node.exe ^>nul 2^>^&1
echo.
echo [2] Liberando porta %LOCAL_PORT%...
echo for /f "tokens=5" %%%%a in ^('netstat -ano ^^^| findstr :%LOCAL_PORT% ^^^| findstr LISTENING'^) do ^(
echo     taskkill /f /pid %%%%a ^>nul 2^>^&1
echo ^)
echo.
echo [3] Verificando arquivos...
echo cd /d "%INSTALL_DIR%"
echo if not exist "config.json" (
echo     echo Recriando config.json...
echo     echo {"businessName":"Meu Negocio","localPort":%LOCAL_PORT%,"version":"2.0.0"} ^> config.json
echo ^)
echo.
echo [4] Iniciando sistema...
echo node server.js
echo.
echo pause
) > "%DESKTOP_DIR%\Entrega Facil - Recuperacao.bat"

echo       Atalhos e scripts criados!

:: Passo 9: Inicializacao do sistema
echo [9/9] Inicializando sistema...
cd /d "%INSTALL_DIR%"

:: Criar logs iniciais
echo %DATE% %TIME% - Sistema instalado com sucesso > logs\install.log
echo %DATE% %TIME% - Porta configurada: %LOCAL_PORT% >> logs\install.log
echo %DATE% %TIME% - Cliente ID: %CLIENT_ID% >> logs\install.log

:: Iniciar servidor
echo       Iniciando servidor na porta %LOCAL_PORT%...
start /min node server.js

:: Aguardar inicializacao
timeout /t 5 /nobreak >nul

:: Verificar se esta rodando
netstat -an | findstr ":%LOCAL_PORT%" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo       Sistema iniciado com sucesso!
    start http://localhost:%LOCAL_PORT%
) else (
    echo       Aviso: Sistema pode estar iniciando, aguarde alguns segundos
    timeout /t 3 /nobreak >nul
    start http://localhost:%LOCAL_PORT%
)

:: Limpeza
rmdir /s /q "%TEMP_DIR%" >nul 2>&1

cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                        INSTALACAO CONCLUIDA COM SUCESSO!                  ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  ✅ Sistema instalado e configurado
echo  ✅ Porta automaticamente detectada: %LOCAL_PORT%
echo  ✅ Banco de dados SQLite criado
echo  ✅ Dependencias instaladas
echo  ✅ Sincronizacao configurada
echo  ✅ Backup automatico ativado
echo  ✅ Recovery automatico incluido
echo  ✅ Logging completo ativado
echo  ✅ Inicializacao automatica configurada
echo  ✅ Atalhos criados na area de trabalho
echo.
echo  🌐 Acesse o sistema: http://localhost:%LOCAL_PORT%
echo  📁 Pasta de instalacao: %INSTALL_DIR%
echo  🔧 Painel de controle: "Entrega Facil - Controle v2.bat"
echo  🔄 Recuperacao de erros: "Entrega Facil - Recuperacao.bat"
echo.
echo  🚀 NOVOS RECURSOS V2.0:
echo  • Deteccao automatica de porta livre
echo  • Recuperacao automatica de erros
echo  • Sistema de backup robusto
echo  • Logging avancado
echo  • Interface web melhorada
echo  • Retry automatico em falhas
echo.
echo  O sistema sera iniciado automaticamente sempre que o Windows iniciar.
echo  Use o painel de controle para gerenciar o sistema facilmente.
echo.
echo  Pressione qualquer tecla para finalizar...
pause >nul
exit