@echo off
title Instalador Entrega Facil - Simples e Robusto
color 0B
setlocal enabledelayedexpansion

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    INSTALADOR ENTREGA FACIL - SIMPLES                     ║
echo  ║                           CLIENTE COMERCIANTE                             ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Execute como Administrador!
    pause
    exit /b 1
)

:: Detectar porta livre
echo [1/6] Detectando porta livre...
set "PORT=3000"
for %%p in (3000 3001 3002 8080 8000 5000 4000 9000) do (
    netstat -an | findstr ":%%p " >nul
    if !errorlevel! neq 0 (
        set "PORT=%%p"
        goto :port_found
    )
)
:port_found
echo ✅ Porta detectada: %PORT%

:: Criar diretórios
echo [2/6] Criando diretórios...
set "INSTALL_DIR=%USERPROFILE%\EntregaFacil"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\data" mkdir "%INSTALL_DIR%\data"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

cd /d "%INSTALL_DIR%"

:: Verificar Node.js
echo [3/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Instale Node.js primeiro:
    echo 1. Acesse: https://nodejs.org
    echo 2. Baixe a versão LTS
    echo 3. Execute como Administrador
    echo 4. Reinicie o computador
    echo 5. Execute este instalador novamente
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
)

:: Criar package.json
echo [4/6] Criando package.json...
(
echo {
echo   "name": "entrega-facil-cliente",
echo   "version": "1.0.0",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "sqlite3": "^5.1.6",
echo     "cors": "^2.8.5"
echo   }
echo }
) > package.json

:: Instalar dependências
echo [5/6] Instalando dependências...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo.
    echo Verifique:
    echo 1. Conexão com internet
    echo 2. Permissões de administrador
    echo 3. Antivírus não está bloqueando
    echo.
    pause
    exit /b 1
)

:: Criar servidor direto no .bat
echo [6/6] Criando servidor...
(
echo const express = require('express'^);
echo const sqlite3 = require('sqlite3'^).verbose(^);
echo const cors = require('cors'^);
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo const app = express(^);
echo const PORT = %PORT%;
echo.
echo // Middleware
echo app.use(cors(^)^);
echo app.use(express.json(^)^);
echo app.use(express.urlencoded({ extended: true }^)^);
echo.
echo // Banco SQLite
echo const db = new sqlite3.Database('./data/database.sqlite'^);
echo.
echo // Criar tabela
echo db.serialize(^(^) =^> {
echo   db.run(`CREATE TABLE IF NOT EXISTS deliveries (
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     customer_name TEXT NOT NULL,
echo     customer_phone TEXT,
echo     delivery_address TEXT NOT NULL,
echo     pickup_address TEXT NOT NULL,
echo     description TEXT,
echo     price REAL NOT NULL,
echo     payment_method TEXT DEFAULT 'dinheiro',
echo     status TEXT DEFAULT 'pending',
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo   ^)`^);
echo }^);
echo.
echo // Página principal
echo app.get('/', (req, res^) =^> {
echo   res.send(`
echo ^<^!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Entrega Fácil - Sistema Local^</title^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%^); min-height: 100vh; }
echo     .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
echo     .header { background: rgba(255,255,255,0.1^); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
echo     .card { background: rgba(255,255,255,0.95^); border-radius: 15px; padding: 25px; margin: 20px 0; }
echo     .form-group { margin: 15px 0; }
echo     .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
echo     .form-control { width: 100%%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; }
echo     .btn { padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; background: linear-gradient(135deg, #667eea, #764ba2^); color: white; }
echo     .btn:hover { transform: translateY(-2px^); }
echo     .status { padding: 15px; border-radius: 10px; text-align: center; margin: 15px 0; background: #d4edda; color: #155724; }
echo     .table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
echo     .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; }
echo     .table th { background: #f8f9fa; font-weight: 600; }
echo     .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
echo     @media (max-width: 768px^) { .grid { grid-template-columns: 1fr; } }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<div class="header"^>
echo       ^<h1^>🚚 Entrega Fácil^</h1^>
echo       ^<p^>Sistema de Entregas Local^</p^>
echo     ^</div^>
echo     
echo     ^<div class="status"^>
echo       ✅ Sistema Online - Pronto para receber pedidos
echo     ^</div^>
echo     
echo     ^<div class="grid"^>
echo       ^<div class="card"^>
echo         ^<h2^>📝 Nova Entrega^</h2^>
echo         ^<form id="deliveryForm"^>
echo           ^<div class="form-group"^>
echo             ^<label^>Nome do Cliente:^</label^>
echo             ^<input type="text" id="customerName" class="form-control" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Telefone:^</label^>
echo             ^<input type="tel" id="customerPhone" class="form-control" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Endereço de Entrega:^</label^>
echo             ^<input type="text" id="deliveryAddress" class="form-control" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Endereço de Coleta:^</label^>
echo             ^<input type="text" id="pickupAddress" class="form-control" value="Seu Estabelecimento" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Descrição:^</label^>
echo             ^<textarea id="description" class="form-control" rows="3"^>^</textarea^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Valor (R$^):^</label^>
echo             ^<input type="number" id="price" class="form-control" step="0.01" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Pagamento:^</label^>
echo             ^<select id="paymentMethod" class="form-control"^>
echo               ^<option value="dinheiro"^>💵 Dinheiro^</option^>
echo               ^<option value="pix"^>📱 PIX^</option^>
echo               ^<option value="cartao"^>💳 Cartão^</option^>
echo             ^</select^>
echo           ^</div^>
echo           ^<button type="submit" class="btn"^>🚚 Solicitar Entrega^</button^>
echo         ^</form^>
echo       ^</div^>
echo       
echo       ^<div class="card"^>
echo         ^<h3^>ℹ️ Informações^</h3^>
echo         ^<p^>^<strong^>Taxa:^</strong^> R$ 7,00^</p^>
echo         ^<p^>^<strong^>Tempo:^</strong^> 30-45 min^</p^>
echo         ^<p^>^<strong^>Horário:^</strong^> 8h às 18h^</p^>
echo         ^<br^>
echo         ^<h3^>💡 Dicas^</h3^>
echo         ^<p^>• Tenha o pedido pronto^</p^>
echo         ^<p^>• Confirme o endereço^</p^>
echo         ^<p^>• Mantenha telefone disponível^</p^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<h2^>📋 Entregas Recentes^</h2^>
echo       ^<div id="deliveriesTable"^>Carregando...^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<script^>
echo     document.getElementById('deliveryForm'^).addEventListener('submit', async function(e^) {
echo       e.preventDefault(^);
echo       
echo       const delivery = {
echo         customer_name: document.getElementById('customerName'^).value,
echo         customer_phone: document.getElementById('customerPhone'^).value,
echo         delivery_address: document.getElementById('deliveryAddress'^).value,
echo         pickup_address: document.getElementById('pickupAddress'^).value,
echo         description: document.getElementById('description'^).value,
echo         price: parseFloat(document.getElementById('price'^).value^),
echo         payment_method: document.getElementById('paymentMethod'^).value
echo       };
echo       
echo       try {
echo         const response = await fetch('/api/deliveries', {
echo           method: 'POST',
echo           headers: { 'Content-Type': 'application/json' },
echo           body: JSON.stringify(delivery^)
echo         }^);
echo         
echo         if (response.ok^) {
echo           alert('✅ Entrega solicitada com sucesso!'^);
echo           document.getElementById('deliveryForm'^).reset(^);
echo           document.getElementById('pickupAddress'^).value = 'Seu Estabelecimento';
echo           loadDeliveries(^);
echo         } else {
echo           alert('❌ Erro ao solicitar entrega.'^);
echo         }
echo       } catch (error^) {
echo         alert('❌ Erro de conexão.'^);
echo       }
echo     }^);
echo     
echo     async function loadDeliveries(^) {
echo       try {
echo         const response = await fetch('/api/deliveries'^);
echo         const deliveries = await response.json(^);
echo         
echo         let html = '';
echo         if (deliveries.length === 0^) {
echo           html = '^<p^>Nenhuma entrega encontrada^</p^>';
echo         } else {
echo           html = '^<table class="table"^>^<thead^>^<tr^>^<th^>Cliente^</th^>^<th^>Endereço^</th^>^<th^>Valor^</th^>^<th^>Status^</th^>^<th^>Data^</th^>^</tr^>^</thead^>^<tbody^>';
echo           
echo           deliveries.forEach(delivery =^> {
echo             const date = new Date(delivery.created_at^).toLocaleDateString('pt-BR'^);
echo             html += `^<tr^>^<td^>${delivery.customer_name}^</td^>^<td^>${delivery.delivery_address}^</td^>^<td^>R$ ${delivery.price.toFixed(2^)}^</td^>^<td^>Pendente^</td^>^<td^>${date}^</td^>^</tr^>`;
echo           }^);
echo           
echo           html += '^</tbody^>^</table^>';
echo         }
echo         
echo         document.getElementById('deliveriesTable'^).innerHTML = html;
echo       } catch (error^) {
echo         document.getElementById('deliveriesTable'^).innerHTML = '^<p^>Erro ao carregar entregas^</p^>';
echo       }
echo     }
echo     
echo     loadDeliveries(^);
echo     setInterval(loadDeliveries, 60000^);
echo   ^</script^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // API - Criar entrega
echo app.post('/api/deliveries', (req, res^) =^> {
echo   const { customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method } = req.body;
echo   
echo   if (^!customer_name ^|^| ^!customer_phone ^|^| ^!delivery_address ^|^| ^!price^) {
echo     return res.status(400^).json({ error: 'Dados obrigatórios faltando' }^);
echo   }
echo   
echo   const stmt = db.prepare(`INSERT INTO deliveries (customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method^) VALUES (?, ?, ?, ?, ?, ?, ?^)`^);
echo   
echo   stmt.run([customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method], function(err^) {
echo     if (err^) {
echo       console.error('Erro ao criar entrega:', err^);
echo       return res.status(500^).json({ error: 'Erro ao criar entrega' }^);
echo     }
echo     
echo     console.log(`Entrega criada - Cliente: ${customer_name}, Valor: R$ ${price}`^);
echo     res.json({ id: this.lastID, message: 'Entrega criada com sucesso' }^);
echo   }^);
echo }^);
echo.
echo // API - Listar entregas
echo app.get('/api/deliveries', (req, res^) =^> {
echo   db.all('SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50', (err, rows^) =^> {
echo     if (err^) {
echo       console.error('Erro ao buscar entregas:', err^);
echo       return res.status(500^).json({ error: 'Erro ao buscar entregas' }^);
echo     }
echo     res.json(rows^);
echo   }^);
echo }^);
echo.
echo // API - Status
echo app.get('/api/status', (req, res^) =^> {
echo   res.json({ status: 'online', port: PORT, timestamp: new Date(^).toISOString(^) }^);
echo }^);
echo.
echo // Iniciar servidor
echo app.listen(PORT, (^) =^> {
echo   console.log(`════════════════════════════════════════════════════════════════════════════`^);
echo   console.log(`                    ENTREGA FACIL - SISTEMA LOCAL                          `^);
echo   console.log(`════════════════════════════════════════════════════════════════════════════`^);
echo   console.log(``^);
echo   console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`^);
echo   console.log(`📅 Iniciado em: ${new Date(^).toLocaleString('pt-BR'^)}`^);
echo   console.log(``^);
echo   console.log(`✅ Sistema pronto para receber pedidos de entrega!`^);
echo   console.log(`💡 Acesse no navegador: http://localhost:${PORT}`^);
echo   console.log(``^);
echo }^);
echo.
echo // Tratamento de erros
echo process.on('uncaughtException', (err^) =^> {
echo   console.error('Erro não tratado:', err^);
echo }^);
echo.
echo process.on('unhandledRejection', (err^) =^> {
echo   console.error('Promise rejeitada:', err^);
echo }^);
) > server.js

:: Criar script de inicialização
echo.
echo Criando script de inicialização...
(
echo @echo off
echo title Entrega Facil - Sistema Local
echo color 0B
echo cd /d "%INSTALL_DIR%"
echo echo.
echo echo ════════════════════════════════════════════════════════════════════════════
echo echo                    ENTREGA FACIL - SISTEMA LOCAL
echo echo ════════════════════════════════════════════════════════════════════════════
echo echo.
echo echo Iniciando sistema...
echo echo.
echo node server.js
echo echo.
echo echo Sistema encerrado.
echo pause
) > "Iniciar Sistema.bat"

:: Criar atalho
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Entrega Facil.lnk')
$Shortcut.TargetPath = '%INSTALL_DIR%\Iniciar Sistema.bat'
$Shortcut.WorkingDirectory = '%INSTALL_DIR%'
$Shortcut.Description = 'Sistema de Entregas Local'
$Shortcut.Save()
" 2>nul

:: Testar servidor
echo.
echo Testando servidor...
start /b node server.js
timeout /t 3 >nul

tasklist /fi "imagename eq node.exe" | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Servidor funcionando!
    taskkill /f /im node.exe >nul 2>&1
) else (
    echo ❌ Problema no servidor
)

echo.
echo ===============================================
echo           INSTALAÇÃO CONCLUÍDA!
echo ===============================================
echo.
echo ✅ Sistema instalado em: %INSTALL_DIR%
echo ✅ Acesso em: http://localhost:%PORT%
echo ✅ Atalho criado na área de trabalho
echo.
echo Para iniciar:
echo 1. Clique no atalho "Entrega Facil"
echo 2. OU execute "Iniciar Sistema.bat"
echo 3. Acesse http://localhost:%PORT%
echo.
echo Deseja iniciar agora? (S/N)
set /p choice=
if /i "%choice%"=="S" (
    start "Entrega Facil" "%INSTALL_DIR%\Iniciar Sistema.bat"
    timeout /t 2 >nul
    start http://localhost:%PORT%
)

exit /b 0