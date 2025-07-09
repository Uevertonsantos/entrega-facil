@echo off
setlocal enabledelayedexpansion
title Entrega Facil - Instalador Automatico
color 0A
cls

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                      ENTREGA FACIL - INSTALADOR AUTOMATICO                ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  Este instalador ira:
echo  • Instalar Node.js automaticamente (se necessario)
echo  • Configurar o sistema Entrega Facil
echo  • Criar banco de dados local
echo  • Configurar inicializacao automatica
echo  • Criar atalho na area de trabalho
echo.
echo  Pressione qualquer tecla para continuar ou feche esta janela para cancelar...
pause >nul
cls

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                             INSTALANDO SISTEMA                            ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TEMP_DIR=%TEMP%\EntregaFacil"
set "LOCAL_PORT=3000"

:: Criar diretorio temporario
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Passo 1: Verificar e instalar Node.js
echo [1/7] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       Node.js nao encontrado, instalando automaticamente...
    echo       Baixando Node.js LTS...
    
    :: Baixar Node.js usando PowerShell
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile '%TEMP_DIR%\node-installer.msi'}"
    
    if exist "%TEMP_DIR%\node-installer.msi" (
        echo       Instalando Node.js...
        start /wait msiexec /i "%TEMP_DIR%\node-installer.msi" /quiet /norestart
        
        :: Aguardar instalacao
        timeout /t 10 /nobreak >nul
        
        :: Atualizar PATH
        call refreshenv.cmd >nul 2>&1
        
        echo       Node.js instalado com sucesso!
        del "%TEMP_DIR%\node-installer.msi" >nul 2>&1
    ) else (
        echo       ERRO: Nao foi possivel baixar Node.js
        echo       Instale manualmente: https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo       Node.js ja instalado!
)

:: Passo 2: Criar diretorios
echo [2/7] Criando diretorios...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
echo       Diretorios criados!

:: Passo 3: Configurar sistema
echo [3/7] Configurando sistema...
cd /d "%INSTALL_DIR%"

:: Criar package.json
(
echo {
echo   "name": "entrega-facil-local",
echo   "version": "1.0.0",
echo   "description": "Sistema Local Entrega Facil",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "node server.js",
echo     "stop": "taskkill /f /im node.exe"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "sqlite3": "^5.1.6",
echo     "cors": "^2.8.5",
echo     "body-parser": "^1.20.2",
echo     "axios": "^1.6.0",
echo     "node-cron": "^3.0.3",
echo     "multer": "^1.4.5"
echo   },
echo   "author": "Entrega Facil",
echo   "license": "MIT"
echo }
) > package.json

:: Criar configuracao
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
echo   "localPort": %LOCAL_PORT%,
echo   "syncEnabled": true,
echo   "syncInterval": 300000,
echo   "autoStart": true,
echo   "version": "1.0.0",
echo   "installDate": "%DATE% %TIME%"
echo }
) > config.json

:: Criar servidor completo
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
echo.
echo // Configuracao
echo const config = JSON.parse^(fs.readFileSync^('config.json', 'utf8'^)^);
echo const app = express^(^);
echo const PORT = config.localPort;
echo.
echo // Middleware
echo app.use^(cors^(^)^);
echo app.use^(bodyParser.json^(^)^);
echo app.use^(bodyParser.urlencoded^({ extended: true }^)^);
echo app.use^(express.static^(path.join^(__dirname, 'public'^)^)^);
echo.
echo // Configurar upload
echo const storage = multer.diskStorage^({
echo   destination: ^(req, file, cb^) =^> cb^(null, './data/'^),
echo   filename: ^(req, file, cb^) =^> cb^(null, Date.now^(^) + '-' + file.originalname^)
echo }^);
echo const upload = multer^({ storage }^);
echo.
echo // Banco de dados
echo const db = new sqlite3.Database^('./data/database.sqlite'^);
echo.
echo // Criar tabelas
echo db.serialize^(^(^) =^> {
echo   db.run^(`CREATE TABLE IF NOT EXISTS merchants ^(
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     name TEXT NOT NULL,
echo     email TEXT UNIQUE NOT NULL,
echo     phone TEXT,
echo     address TEXT,
echo     city TEXT,
echo     state TEXT,
echo     business_name TEXT,
echo     document TEXT,
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     synced_at DATETIME
echo   ^)`^);
echo.
echo   db.run^(`CREATE TABLE IF NOT EXISTS deliverers ^(
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     name TEXT NOT NULL,
echo     email TEXT UNIQUE NOT NULL,
echo     phone TEXT,
echo     address TEXT,
echo     vehicle_type TEXT,
echo     vehicle_model TEXT,
echo     vehicle_plate TEXT,
echo     document TEXT,
echo     bank_account TEXT,
echo     pix_key TEXT,
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     synced_at DATETIME
echo   ^)`^);
echo.
echo   db.run^(`CREATE TABLE IF NOT EXISTS deliveries ^(
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     merchant_id INTEGER,
echo     deliverer_id INTEGER,
echo     customer_name TEXT NOT NULL,
echo     customer_phone TEXT,
echo     customer_address TEXT NOT NULL,
echo     pickup_address TEXT NOT NULL,
echo     delivery_address TEXT NOT NULL,
echo     description TEXT,
echo     price REAL NOT NULL,
echo     delivery_fee REAL DEFAULT 0,
echo     total_amount REAL,
echo     payment_method TEXT DEFAULT 'money',
echo     status TEXT DEFAULT 'pending',
echo     notes TEXT,
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     synced_at DATETIME
echo   ^)`^);
echo.
echo   db.run^(`CREATE TABLE IF NOT EXISTS sync_log ^(
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     type TEXT NOT NULL,
echo     status TEXT NOT NULL,
echo     message TEXT,
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo   ^)`^);
echo }^);
echo.
echo // Funcoes auxiliares
echo function logSync^(type, status, message^) {
echo   db.run^('INSERT INTO sync_log ^(type, status, message^) VALUES ^(?, ?, ?^)', [type, status, message]^);
echo }
echo.
echo // Rotas da API
echo app.get^('/api/status', ^(req, res^) =^> {
echo   res.json^({
echo     status: 'online',
echo     version: config.version,
echo     uptime: process.uptime^(^),
echo     clientId: config.clientId,
echo     businessName: config.businessName,
echo     syncEnabled: config.syncEnabled,
echo     installDate: config.installDate
echo   }^);
echo }^);
echo.
echo // Rotas CRUD
echo app.get^('/api/merchants', ^(req, res^) =^> {
echo   db.all^('SELECT * FROM merchants ORDER BY created_at DESC', ^(err, rows^) =^> {
echo     if ^(err^) return res.status^(500^).json^({ error: err.message }^);
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo app.get^('/api/deliverers', ^(req, res^) =^> {
echo   db.all^('SELECT * FROM deliverers ORDER BY created_at DESC', ^(err, rows^) =^> {
echo     if ^(err^) return res.status^(500^).json^({ error: err.message }^);
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo app.get^('/api/deliveries', ^(req, res^) =^> {
echo   db.all^(`SELECT d.*, m.name as merchant_name, del.name as deliverer_name 
echo            FROM deliveries d 
echo            LEFT JOIN merchants m ON d.merchant_id = m.id 
echo            LEFT JOIN deliverers del ON d.deliverer_id = del.id 
echo            ORDER BY d.created_at DESC`, ^(err, rows^) =^> {
echo     if ^(err^) return res.status^(500^).json^({ error: err.message }^);
echo     res.json^(rows^);
echo   }^);
echo }^);
echo.
echo // Pagina principal
echo app.get^('/', ^(req, res^) =^> {
echo   res.send^(`
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Entrega Facil - ${config.businessName}^</title^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; }
echo     .header { background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); color: white; padding: 20px; text-align: center; }
echo     .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
echo     .card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba^(0,0,0,0.1^); }
echo     .status { padding: 15px; border-radius: 8px; margin: 10px 0; }
echo     .online { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
echo     .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
echo     .grid { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(300px, 1fr^)^); gap: 20px; }
echo     .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; transition: all 0.3s; }
echo     .btn:hover { background: #0056b3; transform: translateY^(-2px^); }
echo     .stats { display: flex; justify-content: space-between; flex-wrap: wrap; }
echo     .stat { text-align: center; padding: 15px; flex: 1; min-width: 120px; }
echo     .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
echo     .footer { text-align: center; padding: 20px; color: #6c757d; }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="header"^>
echo     ^<h1^>🚚 Entrega Facil^</h1^>
echo     ^<p^>Sistema de Gerenciamento de Entregas^</p^>
echo   ^</div^>
echo   
echo   ^<div class="container"^>
echo     ^<div class="card"^>
echo       ^<div class="status online"^>✅ Sistema Online e Funcionando^</div^>
echo       
echo       ^<div class="info"^>
echo         ^<h3^>Informacoes do Negocio^</h3^>
echo         ^<p^>^<strong^>Nome:^</strong^> ${config.businessName}^</p^>
echo         ^<p^>^<strong^>Email:^</strong^> ${config.businessEmail}^</p^>
echo         ^<p^>^<strong^>Telefone:^</strong^> ${config.businessPhone}^</p^>
echo         ^<p^>^<strong^>Endereco:^</strong^> ${config.businessAddress}^</p^>
echo         ^<p^>^<strong^>Cliente ID:^</strong^> ${config.clientId}^</p^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="grid"^>
echo       ^<div class="card"^>
echo         ^<h3^>Acesso Rapido^</h3^>
echo         ^<div style="margin: 20px 0;"^>
echo           ^<a href="/api/merchants" class="btn"^>Ver Comerciantes^</a^>
echo           ^<a href="/api/deliverers" class="btn"^>Ver Entregadores^</a^>
echo           ^<a href="/api/deliveries" class="btn"^>Ver Entregas^</a^>
echo         ^</div^>
echo       ^</div^>
echo       
echo       ^<div class="card"^>
echo         ^<h3^>Sistema^</h3^>
echo         ^<p^>^<strong^>Versao:^</strong^> ${config.version}^</p^>
echo         ^<p^>^<strong^>Porta:^</strong^> ${PORT}^</p^>
echo         ^<p^>^<strong^>Sincronizacao:^</strong^> ${config.syncEnabled ? 'Ativada' : 'Desativada'}^</p^>
echo         ^<p^>^<strong^>Instalado em:^</strong^> ${config.installDate}^</p^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<div class="footer"^>
echo     ^<p^>Entrega Facil - Sistema de Gerenciamento de Entregas^</p^>
echo     ^<p^>Para suporte, acesse o painel administrativo^</p^>
echo   ^</div^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // Sincronizacao automatica
echo if ^(config.syncEnabled^) {
echo   cron.schedule^('*/5 * * * *', async ^(^) =^> {
echo     try {
echo       console.log^('Sincronizando dados...'^);
echo       logSync^('auto', 'started', 'Iniciando sincronizacao automatica'^);
echo       
echo       const response = await axios.post^(`${config.adminApiUrl}/client/sync`, {
echo         clientId: config.clientId,
echo         businessName: config.businessName,
echo         timestamp: new Date^(^).toISOString^(^)
echo       }, { timeout: 30000 }^);
echo       
echo       logSync^('auto', 'success', 'Sincronizacao concluida com sucesso'^);
echo       console.log^('Sincronizacao concluida!'^);
echo     } catch ^(error^) {
echo       logSync^('auto', 'error', error.message^);
echo       console.error^('Erro na sincronizacao:', error.message^);
echo     }
echo   }^);
echo }
echo.
echo // Tratamento de erros
echo process.on^('uncaughtException', ^(err^) =^> {
echo   console.error^('Erro nao tratado:', err^);
echo   logSync^('system', 'error', 'Erro nao tratado: ' + err.message^);
echo }^);
echo.
echo // Iniciar servidor
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`Entrega Facil rodando em http://localhost:${PORT}`^);
echo   console.log^(`Negocio: ${config.businessName}`^);
echo   console.log^(`Cliente ID: ${config.clientId}`^);
echo   console.log^(`Sincronizacao: ${config.syncEnabled ? 'Ativada' : 'Desativada'}`^);
echo   console.log^(`Instalado em: ${config.installDate}`^);
echo }^);
) > server.js

echo       Sistema configurado!

:: Passo 4: Instalar dependencias
echo [4/7] Instalando dependencias...
echo       Aguarde, isso pode demorar alguns minutos...
call npm install --silent --no-audit --no-fund >"%INSTALL_DIR%\logs\install.log" 2>&1
if %errorlevel% neq 0 (
    echo       ERRO: Falha na instalacao das dependencias
    echo       Verifique o arquivo de log: %INSTALL_DIR%\logs\install.log
    pause
    exit /b 1
)
echo       Dependencias instaladas!

:: Passo 5: Configurar inicializacao automatica
echo [5/7] Configurando inicializacao automatica...
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo start /min node server.js
echo exit
) > "%STARTUP_DIR%\EntregaFacil.bat"

echo       Inicializacao configurada!

:: Passo 6: Criar atalhos
echo [6/7] Criando atalhos...

:: Atalho na area de trabalho
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP_DIR%\Entrega Facil.lnk'); $Shortcut.TargetPath = 'http://localhost:%LOCAL_PORT%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Save()}" >nul 2>&1

:: Script de controle
(
echo @echo off
echo title Entrega Facil - Controle do Sistema
echo :menu
echo cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                         ENTREGA FACIL - CONTROLE                          ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  [1] Iniciar Sistema
echo  [2] Parar Sistema
echo  [3] Reiniciar Sistema
echo  [4] Abrir no Navegador
echo  [5] Ver Logs
echo  [6] Configuracoes
echo  [7] Sair
echo.
echo  Digite sua opcao:
echo.
set /p opcao=
if "%%opcao%%"=="1" (
    cd /d "%INSTALL_DIR%"
    start /min node server.js
    echo Sistema iniciado!
    timeout /t 3 /nobreak >nul
    goto menu
)
if "%%opcao%%"=="2" (
    taskkill /f /im node.exe >nul 2>&1
    echo Sistema parado!
    timeout /t 3 /nobreak >nul
    goto menu
)
if "%%opcao%%"=="3" (
    taskkill /f /im node.exe >nul 2>&1
    cd /d "%INSTALL_DIR%"
    start /min node server.js
    echo Sistema reiniciado!
    timeout /t 3 /nobreak >nul
    goto menu
)
if "%%opcao%%"=="4" (
    start http://localhost:%LOCAL_PORT%
    goto menu
)
if "%%opcao%%"=="5" (
    start notepad "%INSTALL_DIR%\logs\install.log"
    goto menu
)
if "%%opcao%%"=="6" (
    start notepad "%INSTALL_DIR%\config.json"
    goto menu
)
if "%%opcao%%"=="7" exit
goto menu
) > "%DESKTOP_DIR%\Entrega Facil - Controle.bat"

echo       Atalhos criados!

:: Passo 7: Iniciar sistema
echo [7/7] Iniciando sistema...
cd /d "%INSTALL_DIR%"
start /min node server.js
timeout /t 3 /nobreak >nul
start http://localhost:%LOCAL_PORT%
echo       Sistema iniciado!

:: Limpar arquivos temporarios
rmdir /s /q "%TEMP_DIR%" >nul 2>&1

cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                        INSTALACAO CONCLUIDA!                              ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  ✅ Sistema instalado e funcionando
echo  ✅ Banco de dados criado
echo  ✅ Sincronizacao configurada
echo  ✅ Inicializacao automatica ativada
echo  ✅ Atalhos criados na area de trabalho
echo.
echo  🌐 Acesse o sistema: http://localhost:%LOCAL_PORT%
echo  📁 Pasta de instalacao: %INSTALL_DIR%
echo  🔧 Controle do sistema: Entrega Facil - Controle.bat
echo.
echo  O sistema sera iniciado automaticamente sempre que o Windows iniciar.
echo  Use o arquivo "Entrega Facil - Controle.bat" para gerenciar o sistema.
echo.
echo  Pressione qualquer tecla para finalizar...
pause >nul
exit