@echo off
title Instalador Entrega Facil - Cliente Comerciante
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                      INSTALADOR ENTREGA FACIL v3.0                        ║
echo  ║                           CLIENTE COMERCIANTE                             ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  Sistema de Entregas Local para Comerciantes
echo  Versao: 3.0.0 - Especifica para Cliente Final
echo.

:: Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ⚠️  ERRO: Execute como Administrador!
    echo.
    echo  Clique com o botao direito no arquivo e selecione:
    echo  "Executar como administrador"
    echo.
    pause
    exit /b 1
)

:: Detectar porta livre automaticamente
echo [1/8] Detectando porta livre...
set "PORT=3000"
for %%p in (3000 3001 3002 8080 8000 5000 4000 9000) do (
    netstat -an | findstr ":%%p " >nul
    if !errorlevel! neq 0 (
        set "PORT=%%p"
        goto :port_found
    )
)
:port_found
echo     Porta detectada: %PORT%

:: Criar diretorio de instalacao
echo [2/8] Criando diretorio de instalacao...
set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

cd /d "%INSTALL_DIR%"

:: Verificar/Instalar Node.js
echo [3/8] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     Node.js nao encontrado. Instalando...
    powershell -Command "& {
        $url = 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi'
        $output = 'nodejs-installer.msi'
        Invoke-WebRequest -Uri $url -OutFile $output
        Start-Process -FilePath $output -ArgumentList '/quiet' -Wait
        Remove-Item $output
    }" 2>nul
    
    :: Adicionar Node.js ao PATH
    setx PATH "%PATH%;C:\Program Files\nodejs" >nul 2>&1
    set "PATH=%PATH%;C:\Program Files\nodejs"
    
    echo     Node.js instalado com sucesso!
) else (
    echo     Node.js ja instalado
)

:: Instalar dependencias
echo [4/8] Instalando dependencias...
(
echo {
echo   "name": "entrega-facil-cliente",
echo   "version": "3.0.0",
echo   "description": "Sistema de Entregas para Comerciantes",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "sqlite3": "^5.1.6",
echo     "cors": "^2.8.5",
echo     "body-parser": "^1.20.2",
echo     "axios": "^1.6.0",
echo     "helmet": "^7.0.0"
echo   }
echo }
) > package.json

call npm install --silent >nul 2>&1
if %errorlevel% neq 0 (
    echo     Erro ao instalar dependencias. Tentando novamente...
    timeout /t 3 >nul
    call npm install --silent >nul 2>&1
)

:: Criar arquivo de configuracao
echo [5/8] Criando configuracao...
(
echo {
echo   "businessName": "Comerciante Local",
echo   "businessEmail": "comerciante@local.com",
echo   "businessPhone": "(11) 99999-9999",
echo   "businessAddress": "Rua do Comercio, 123, Centro",
echo   "localPort": %PORT%,
echo   "version": "3.0.0",
echo   "clientType": "merchant",
echo   "adminAccess": false,
echo   "syncEnabled": true,
echo   "adminUrl": "https://admin.entregafacil.com",
echo   "installDate": "%DATE% %TIME%",
echo   "features": {
echo     "deliveryRequest": true,
echo     "historyView": true,
echo     "adminPanel": false
echo   }
echo }
) > config.json

:: Criar servidor para comerciante
echo [6/8] Criando servidor...
(
echo const express = require^('express'^);
echo const sqlite3 = require^('sqlite3'^).verbose^(^);
echo const cors = require^('cors'^);
echo const bodyParser = require^('body-parser'^);
echo const axios = require^('axios'^);
echo const path = require^('path'^);
echo const fs = require^('fs'^);
echo const helmet = require^('helmet'^);
echo.
echo // Carregar configuracao
echo const config = JSON.parse^(fs.readFileSync^('config.json', 'utf8'^)^);
echo const app = express^(^);
echo const PORT = config.localPort ^|^| 3000;
echo.
echo // Middleware
echo app.use^(helmet^(^)^);
echo app.use^(cors^(^)^);
echo app.use^(bodyParser.json^(^)^);
echo app.use^(bodyParser.urlencoded^({ extended: true }^)^);
echo.
echo // Banco de dados SQLite
echo const db = new sqlite3.Database^('./data/database.sqlite'^);
echo.
echo // Inicializar banco
echo db.serialize^(^(^) =^> {
echo   db.run^(`CREATE TABLE IF NOT EXISTS deliveries ^(
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     customer_name TEXT NOT NULL,
echo     customer_phone TEXT,
echo     customer_address TEXT NOT NULL,
echo     pickup_address TEXT NOT NULL,
echo     delivery_address TEXT NOT NULL,
echo     description TEXT,
echo     price REAL NOT NULL,
echo     delivery_fee REAL DEFAULT 7.00,
echo     payment_method TEXT DEFAULT 'dinheiro',
echo     status TEXT DEFAULT 'pending',
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
echo     synced_at DATETIME
echo   ^)`^);
echo.
echo   db.run^(`CREATE TABLE IF NOT EXISTS settings ^(
echo     key TEXT PRIMARY KEY,
echo     value TEXT NOT NULL,
echo     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo   ^)`^);
echo.
echo   // Configuracoes iniciais
echo   db.run^(`INSERT OR IGNORE INTO settings ^(key, value^) VALUES ^('business_name', ?^)`, [config.businessName]^);
echo   db.run^(`INSERT OR IGNORE INTO settings ^(key, value^) VALUES ^('business_address', ?^)`, [config.businessAddress]^);
echo   db.run^(`INSERT OR IGNORE INTO settings ^(key, value^) VALUES ^('business_phone', ?^)`, [config.businessPhone]^);
echo }^);
echo.
echo // Logging
echo function logMessage^(level, message^) {
echo   const timestamp = new Date^(^).toISOString^(^);
echo   const logEntry = `${timestamp} [${level}] ${message}\n`;
echo   
echo   fs.appendFileSync^(`./logs/${level}.log`, logEntry^);
echo   console.log^(logEntry.trim^(^)^);
echo }
echo.
echo // Pagina principal - Interface do Comerciante
echo app.get^('/', ^(req, res^) =^> {
echo   res.send^(`
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Entrega Facil - ${config.businessName}^</title^>
echo   ^<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); min-height: 100vh; }
echo     .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
echo     .header { background: rgba^(255,255,255,0.1^); backdrop-filter: blur^(10px^); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
echo     .header h1 { font-size: 2.5em; margin-bottom: 10px; }
echo     .header p { opacity: 0.9; }
echo     .card { background: rgba^(255,255,255,0.95^); border-radius: 15px; padding: 25px; margin: 20px 0; box-shadow: 0 8px 32px rgba^(0,0,0,0.1^); }
echo     .form-group { margin: 15px 0; }
echo     .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
echo     .form-control { width: 100%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
echo     .form-control:focus { outline: none; border-color: #667eea; }
echo     .btn { padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; }
echo     .btn-primary { background: linear-gradient^(135deg, #667eea, #764ba2^); color: white; }
echo     .btn-primary:hover { transform: translateY^(-2px^); box-shadow: 0 10px 25px rgba^(0,0,0,0.2^); }
echo     .btn-success { background: linear-gradient^(135deg, #4CAF50, #45a049^); color: white; }
echo     .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
echo     .status { padding: 15px; border-radius: 10px; text-align: center; margin: 15px 0; }
echo     .status-success { background: linear-gradient^(135deg, #d4edda, #c3e6cb^); color: #155724; }
echo     .info-card { background: linear-gradient^(135deg, #e3f2fd, #bbdefb^); border-radius: 10px; padding: 20px; margin: 20px 0; }
echo     .info-item { display: flex; align-items: center; margin: 10px 0; }
echo     .info-item i { margin-right: 10px; color: #667eea; }
echo     .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
echo     .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; }
echo     .table th { background: #f8f9fa; font-weight: 600; }
echo     .table tr:hover { background: #f8f9fa; }
echo     .badge { padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; }
echo     .badge-warning { background: #fff3cd; color: #856404; }
echo     .badge-success { background: #d4edda; color: #155724; }
echo     .badge-info { background: #cce5ff; color: #004085; }
echo     .empty-state { text-align: center; padding: 40px; color: #666; }
echo     .loading { display: none; text-align: center; padding: 20px; }
echo     .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
echo     @keyframes spin { 0% { transform: rotate^(0deg^); } 100% { transform: rotate^(360deg^); } }
echo     @media ^(max-width: 768px^) { .grid { grid-template-columns: 1fr; } }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<div class="header"^>
echo       ^<h1^>^<i class="fas fa-shipping-fast"^>^</i^> Entrega Facil^</h1^>
echo       ^<p^>${config.businessName} - Sistema de Entregas Local^</p^>
echo     ^</div^>
echo     
echo     ^<div class="status status-success"^>
echo       ^<i class="fas fa-check-circle"^>^</i^> Sistema Online - Pronto para receber pedidos de entrega
echo     ^</div^>
echo     
echo     ^<div class="grid"^>
echo       ^<div class="card"^>
echo         ^<h2^>^<i class="fas fa-plus-circle"^>^</i^> Nova Entrega^</h2^>
echo         ^<form id="deliveryForm"^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-user"^>^</i^> Nome do Cliente:^</label^>
echo             ^<input type="text" id="customerName" class="form-control" required placeholder="Ex: João Silva"^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-phone"^>^</i^> Telefone do Cliente:^</label^>
echo             ^<input type="tel" id="customerPhone" class="form-control" required placeholder="(11) 99999-9999"^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-map-marker-alt"^>^</i^> Endereço de Entrega:^</label^>
echo             ^<input type="text" id="deliveryAddress" class="form-control" required placeholder="Rua, numero, bairro"^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-store"^>^</i^> Endereço de Coleta:^</label^>
echo             ^<input type="text" id="pickupAddress" class="form-control" value="${config.businessAddress}" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-clipboard-list"^>^</i^> Descrição do Pedido:^</label^>
echo             ^<textarea id="description" class="form-control" rows="3" placeholder="Descreva os itens do pedido..."^>^</textarea^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-dollar-sign"^>^</i^> Valor do Pedido ^(R$^):^</label^>
echo             ^<input type="number" id="price" class="form-control" step="0.01" required placeholder="0.00"^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>^<i class="fas fa-credit-card"^>^</i^> Forma de Pagamento:^</label^>
echo             ^<select id="paymentMethod" class="form-control"^>
echo               ^<option value="dinheiro"^>💵 Dinheiro^</option^>
echo               ^<option value="pix"^>📱 PIX^</option^>
echo               ^<option value="cartao_credito"^>💳 Cartão de Crédito^</option^>
echo               ^<option value="cartao_debito"^>💳 Cartão de Débito^</option^>
echo               ^<option value="vale_refeicao"^>🍽️ Vale Refeição^</option^>
echo             ^</select^>
echo           ^</div^>
echo           ^<div class="loading" id="loading"^>
echo             ^<div class="spinner"^>^</div^>
echo             ^<p^>Criando entrega...^</p^>
echo           ^</div^>
echo           ^<button type="submit" class="btn btn-primary" id="submitBtn"^>
echo             ^<i class="fas fa-shipping-fast"^>^</i^> Solicitar Entrega
echo           ^</button^>
echo         ^</form^>
echo       ^</div^>
echo       
echo       ^<div^>
echo         ^<div class="info-card"^>
echo           ^<h3^>^<i class="fas fa-info-circle"^>^</i^> Informações da Entrega^</h3^>
echo           ^<div class="info-item"^>
echo             ^<i class="fas fa-money-bill-wave"^>^</i^>
echo             ^<span^>^<strong^>Taxa de Entrega:^</strong^> R$ 7,00^</span^>
echo           ^</div^>
echo           ^<div class="info-item"^>
echo             ^<i class="fas fa-clock"^>^</i^>
echo             ^<span^>^<strong^>Tempo Estimado:^</strong^> 30-45 minutos^</span^>
echo           ^</div^>
echo           ^<div class="info-item"^>
echo             ^<i class="fas fa-map"^>^</i^>
echo             ^<span^>^<strong^>Área de Cobertura:^</strong^> Cidade local^</span^>
echo           ^</div^>
echo           ^<div class="info-item"^>
echo             ^<i class="fas fa-business-time"^>^</i^>
echo             ^<span^>^<strong^>Horário:^</strong^> 8h às 18h^</span^>
echo           ^</div^>
echo         ^</div^>
echo         
echo         ^<div class="info-card"^>
echo           ^<h3^>^<i class="fas fa-lightbulb"^>^</i^> Dicas Importantes^</h3^>
echo           ^<p^>• Tenha o pedido pronto para coleta^</p^>
echo           ^<p^>• Confirme o endereço de entrega^</p^>
echo           ^<p^>• Mantenha o telefone disponível^</p^>
echo           ^<p^>• Pedidos são processados por ordem^</p^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<h2^>^<i class="fas fa-history"^>^</i^> Suas Entregas Recentes^</h2^>
echo       ^<div id="deliveriesTable"^>
echo         ^<div class="loading"^>^<div class="spinner"^>^</div^>Carregando entregas...^</div^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<script^>
echo     document.getElementById^('deliveryForm'^).addEventListener^('submit', async function^(e^) {
echo       e.preventDefault^(^);
echo       
echo       const loading = document.getElementById^('loading'^);
echo       const submitBtn = document.getElementById^('submitBtn'^);
echo       
echo       loading.style.display = 'block';
echo       submitBtn.disabled = true;
echo       
echo       const delivery = {
echo         customer_name: document.getElementById^('customerName'^).value,
echo         customer_phone: document.getElementById^('customerPhone'^).value,
echo         delivery_address: document.getElementById^('deliveryAddress'^).value,
echo         pickup_address: document.getElementById^('pickupAddress'^).value,
echo         description: document.getElementById^('description'^).value,
echo         price: parseFloat^(document.getElementById^('price'^).value^),
echo         payment_method: document.getElementById^('paymentMethod'^).value
echo       };
echo       
echo       try {
echo         const response = await fetch^('/api/deliveries', {
echo           method: 'POST',
echo           headers: { 'Content-Type': 'application/json' },
echo           body: JSON.stringify^(delivery^)
echo         }^);
echo         
echo         if ^(response.ok^) {
echo           alert^('✅ Entrega solicitada com sucesso!\n\nSeu pedido foi enviado e será processado em breve.'^);
echo           document.getElementById^('deliveryForm'^).reset^(^);
echo           document.getElementById^('pickupAddress'^).value = '${config.businessAddress}';
echo           loadDeliveries^(^);
echo         } else {
echo           alert^('❌ Erro ao solicitar entrega. Tente novamente.'^);
echo         }
echo       } catch ^(error^) {
echo         alert^('❌ Erro de conexão. Verifique sua internet e tente novamente.'^);
echo       }
echo       
echo       loading.style.display = 'none';
echo       submitBtn.disabled = false;
echo     }^);
echo     
echo     async function loadDeliveries^(^) {
echo       try {
echo         const response = await fetch^('/api/deliveries'^);
echo         const deliveries = await response.json^(^);
echo         
echo         let html = '';
echo         if ^(deliveries.length === 0^) {
echo           html = `
echo             ^<div class="empty-state"^>
echo               ^<i class="fas fa-box-open" style="font-size: 48px; color: #ccc;"^>^</i^>
echo               ^<p^>Nenhuma entrega encontrada^</p^>
echo               ^<p^>Suas entregas aparecerão aqui após serem solicitadas^</p^>
echo             ^</div^>
echo           `;
echo         } else {
echo           html = `
echo             ^<div class="table-responsive"^>
echo               ^<table class="table"^>
echo                 ^<thead^>
echo                   ^<tr^>
echo                     ^<th^>Cliente^</th^>
echo                     ^<th^>Endereço^</th^>
echo                     ^<th^>Valor^</th^>
echo                     ^<th^>Pagamento^</th^>
echo                     ^<th^>Status^</th^>
echo                     ^<th^>Data^</th^>
echo                   ^</tr^>
echo                 ^</thead^>
echo                 ^<tbody^>
echo           `;
echo           
echo           deliveries.forEach^(delivery =^> {
echo             const date = new Date^(delivery.created_at^).toLocaleDateString^('pt-BR'^);
echo             const statusClass = delivery.status === 'pending' ? 'badge-warning' : 
echo                               delivery.status === 'in_progress' ? 'badge-info' : 'badge-success';
echo             const statusText = delivery.status === 'pending' ? 'Pendente' : 
echo                              delivery.status === 'in_progress' ? 'Em Andamento' : 'Concluída';
echo             
echo             html += `
echo               ^<tr^>
echo                 ^<td^>${delivery.customer_name}^</td^>
echo                 ^<td^>${delivery.delivery_address}^</td^>
echo                 ^<td^>R$ ${delivery.price.toFixed^(2^)}^</td^>
echo                 ^<td^>${formatPaymentMethod^(delivery.payment_method^)}^</td^>
echo                 ^<td^>^<span class="badge ${statusClass}"^>${statusText}^</span^>^</td^>
echo                 ^<td^>${date}^</td^>
echo               ^</tr^>
echo             `;
echo           }^);
echo           
echo           html += '^</tbody^>^</table^>^</div^>';
echo         }
echo         
echo         document.getElementById^('deliveriesTable'^).innerHTML = html;
echo       } catch ^(error^) {
echo         document.getElementById^('deliveriesTable'^).innerHTML = `
echo           ^<div class="empty-state"^>
echo             ^<i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b;"^>^</i^>
echo             ^<p^>Erro ao carregar entregas^</p^>
echo             ^<p^>Verifique sua conexão com a internet^</p^>
echo           ^</div^>
echo         `;
echo       }
echo     }
echo     
echo     function formatPaymentMethod^(method^) {
echo       const methods = {
echo         'dinheiro': '💵 Dinheiro',
echo         'pix': '📱 PIX',
echo         'cartao_credito': '💳 Cartão Crédito',
echo         'cartao_debito': '💳 Cartão Débito',
echo         'vale_refeicao': '🍽️ Vale Refeição'
echo       };
echo       return methods[method] ^|^| method;
echo     }
echo     
echo     // Carregar entregas ao iniciar
echo     loadDeliveries^(^);
echo     
echo     // Atualizar a cada 60 segundos
echo     setInterval^(loadDeliveries, 60000^);
echo   ^</script^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // API - Criar entrega
echo app.post^('/api/deliveries', ^(req, res^) =^> {
echo   const {
echo     customer_name,
echo     customer_phone,
echo     delivery_address,
echo     pickup_address,
echo     description,
echo     price,
echo     payment_method
echo   } = req.body;
echo   
echo   if ^(!customer_name ^|^| !customer_phone ^|^| !delivery_address ^|^| !price^) {
echo     return res.status^(400^).json^({ error: 'Dados obrigatórios faltando' }^);
echo   }
echo   
echo   const stmt = db.prepare^(`
echo     INSERT INTO deliveries 
echo     ^(customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method^) 
echo     VALUES ^(?, ?, ?, ?, ?, ?, ?^)
echo   `^);
echo   
echo   stmt.run^([
echo     customer_name,
echo     customer_phone,
echo     delivery_address,
echo     pickup_address,
echo     description,
echo     price,
echo     payment_method
echo   ], function^(err^) {
echo     if ^(err^) {
echo       logMessage^('error', `Erro ao criar entrega: ${err.message}`^);
echo       return res.status^(500^).json^({ error: 'Erro ao criar entrega' }^);
echo     }
echo     
echo     logMessage^('info', `Entrega criada - Cliente: ${customer_name}, Valor: R$ ${price}`^);
echo     
echo     // Tentar sincronizar com servidor admin ^(opcional^)
echo     if ^(config.syncEnabled^) {
echo       syncDeliveryToAdmin^(this.lastID^);
echo     }
echo     
echo     res.json^({ id: this.lastID, message: 'Entrega criada com sucesso' }^);
echo   }^);
echo }^);
echo.
echo // API - Listar entregas
echo app.get^('/api/deliveries', ^(req, res^) =^> {
echo   db.all^(
echo     'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50',
echo     ^(err, rows^) =^> {
echo       if ^(err^) {
echo         logMessage^('error', `Erro ao buscar entregas: ${err.message}`^);
echo         return res.status^(500^).json^({ error: 'Erro ao buscar entregas' }^);
echo       }
echo       res.json^(rows^);
echo     }
echo   ^);
echo }^);
echo.
echo // API - Status do sistema
echo app.get^('/api/status', ^(req, res^) =^> {
echo   res.json^({
echo     status: 'online',
echo     version: config.version,
echo     businessName: config.businessName,
echo     clientType: config.clientType,
echo     timestamp: new Date^(^).toISOString^(^),
echo     uptime: process.uptime^(^)
echo   }^);
echo }^);
echo.
echo // Funcao para sincronizar com servidor admin
echo async function syncDeliveryToAdmin^(deliveryId^) {
echo   try {
echo     const delivery = await new Promise^(^(resolve, reject^) =^> {
echo       db.get^('SELECT * FROM deliveries WHERE id = ?', [deliveryId], ^(err, row^) =^> {
echo         if ^(err^) reject^(err^);
echo         else resolve^(row^);
echo       }^);
echo     }^);
echo     
echo     if ^(delivery^) {
echo       const response = await axios.post^(`${config.adminUrl}/api/sync/delivery`, {
echo         ...delivery,
echo         client_id: config.clientId,
echo         business_name: config.businessName
echo       }, {
echo         timeout: 5000
echo       }^);
echo       
echo       if ^(response.status === 200^) {
echo         db.run^('UPDATE deliveries SET synced_at = CURRENT_TIMESTAMP WHERE id = ?', [deliveryId]^);
echo         logMessage^('info', `Entrega ${deliveryId} sincronizada com servidor admin`^);
echo       }
echo     }
echo   } catch ^(error^) {
echo     logMessage^('error', `Erro ao sincronizar entrega ${deliveryId}: ${error.message}`^);
echo   }
echo }
echo.
echo // Iniciar servidor
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`╔════════════════════════════════════════════════════════════════════════════╗`^);
echo   console.log^(`║                      ENTREGA FACIL - SISTEMA LOCAL                        ║`^);
echo   console.log^(`╚════════════════════════════════════════════════════════════════════════════╝`^);
echo   console.log^(``^);
echo   console.log^(`🚀 Servidor rodando em: http://localhost:${PORT}`^);
echo   console.log^(`🏪 Comerciante: ${config.businessName}`^);
echo   console.log^(`📅 Instalado em: ${config.installDate}`^);
echo   console.log^(`🔄 Sincronização: ${config.syncEnabled ? 'Ativada' : 'Desativada'}`^);
echo   console.log^(``^);
echo   console.log^(`✅ Sistema pronto para receber pedidos de entrega!`^);
echo   console.log^(`💡 Acesse no navegador: http://localhost:${PORT}`^);
echo   console.log^(``^);
echo   
echo   logMessage^('info', `Sistema iniciado - Porta ${PORT} - ${config.businessName}`^);
echo }^);
echo.
echo // Graceful shutdown
echo process.on^('SIGTERM', ^(^) =^> {
echo   logMessage^('info', 'Sistema sendo encerrado...'^);
echo   db.close^(^);
echo   process.exit^(0^);
echo }^);
) > server.js

:: Criar script de inicializacao
echo [7/8] Criando script de inicializacao...
(
echo @echo off
echo title Entrega Facil - Sistema Local
echo color 0B
echo cd /d "%INSTALL_DIR%"
echo echo.
echo echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo echo  ║                      ENTREGA FACIL - SISTEMA LOCAL                        ║
echo echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo echo.
echo echo  Iniciando sistema...
echo echo.
echo node server.js
echo echo.
echo echo Sistema encerrado.
echo pause
) > "Iniciar Sistema.bat"

:: Criar atalho na area de trabalho
echo [8/8] Criando atalho na area de trabalho...
powershell -Command "& {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Entrega Facil.lnk')
    $Shortcut.TargetPath = '%INSTALL_DIR%\Iniciar Sistema.bat'
    $Shortcut.WorkingDirectory = '%INSTALL_DIR%'
    $Shortcut.Description = 'Sistema de Entregas Local'
    $Shortcut.IconLocation = 'shell32.dll,43'
    $Shortcut.Save()
}" 2>nul

:: Sucesso
echo.
echo ===============================================
echo           INSTALACAO CONCLUIDA!
echo ===============================================
echo.
echo ✅ Sistema instalado com sucesso!
echo ✅ Banco de dados configurado
echo ✅ Servidor pronto para uso
echo ✅ Atalho criado na area de trabalho
echo.
echo 📁 Instalado em: %INSTALL_DIR%
echo 🌐 Acesso em: http://localhost:%PORT%
echo.
echo Para usar o sistema:
echo 1. Clique duas vezes no atalho "Entrega Facil" na area de trabalho
echo 2. OU execute o arquivo "Iniciar Sistema.bat"
echo 3. Acesse no navegador: http://localhost:%PORT%
echo.
echo O sistema esta pronto para receber pedidos de entrega!
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul

:: Perguntar se quer iniciar agora
echo.
echo Deseja iniciar o sistema agora? (S/N)
set /p choice=
if /i "%choice%"=="S" (
    echo.
    echo Iniciando sistema...
    start "Entrega Facil" "%INSTALL_DIR%\Iniciar Sistema.bat"
    timeout /t 2 >nul
    start http://localhost:%PORT%
)

exit /b 0