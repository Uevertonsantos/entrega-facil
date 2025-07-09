@echo off
title Instalador Direto - Entrega Facil
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                       INSTALADOR DIRETO                                   ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Execute como Administrador!
    pause
    exit /b 1
)

:: Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo Instale em: https://nodejs.org
    pause
    exit /b 1
)

:: Criar pasta temporária
echo Criando ambiente...
set "TEMP_DIR=%TEMP%\entrega_facil_build"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

:: Criar package.json direto
echo Criando package.json...
echo { > package.json
echo   "name": "entrega-facil-installer", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "main": "main.js", >> package.json
echo   "scripts": { >> package.json
echo     "build": "electron-builder --win" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "electron": "^20.0.0", >> package.json
echo     "electron-builder": "^23.0.0" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "express": "^4.18.2", >> package.json
echo     "sqlite3": "^5.1.6", >> package.json
echo     "cors": "^2.8.5" >> package.json
echo   }, >> package.json
echo   "build": { >> package.json
echo     "appId": "com.entregafacil.installer", >> package.json
echo     "productName": "Entrega Facil Instalador", >> package.json
echo     "directories": { >> package.json
echo       "output": "dist" >> package.json
echo     }, >> package.json
echo     "files": ["main.js", "index.html"], >> package.json
echo     "win": { >> package.json
echo       "target": "nsis" >> package.json
echo     } >> package.json
echo   } >> package.json
echo } >> package.json

:: Criar main.js com funcionalidade completa
echo Criando main.js...
echo const { app, BrowserWindow, ipcMain, dialog } = require('electron'); > main.js
echo const path = require('path'); >> main.js
echo const fs = require('fs'); >> main.js
echo const { exec } = require('child_process'); >> main.js
echo const os = require('os'); >> main.js
echo. >> main.js
echo let mainWindow; >> main.js
echo. >> main.js
echo function createWindow() { >> main.js
echo   mainWindow = new BrowserWindow({ >> main.js
echo     width: 900, >> main.js
echo     height: 700, >> main.js
echo     webPreferences: { >> main.js
echo       nodeIntegration: true, >> main.js
echo       contextIsolation: false >> main.js
echo     }, >> main.js
echo     title: 'Instalador Entrega Fácil', >> main.js
echo     resizable: false, >> main.js
echo     center: true >> main.js
echo   }); >> main.js
echo. >> main.js
echo   mainWindow.loadFile('index.html'); >> main.js
echo   mainWindow.setMenuBarVisibility(false); >> main.js
echo } >> main.js
echo. >> main.js
echo app.whenReady().then(createWindow); >> main.js
echo. >> main.js
echo app.on('window-all-closed', () =^> { >> main.js
echo   if (process.platform !== 'darwin') app.quit(); >> main.js
echo }); >> main.js
echo. >> main.js
echo ipcMain.handle('install-system', async (event, config) =^> { >> main.js
echo   try { >> main.js
echo     const installPath = path.join(os.homedir(), 'EntregaFacil'); >> main.js
echo     if (!fs.existsSync(installPath)) { >> main.js
echo       fs.mkdirSync(installPath, { recursive: true }); >> main.js
echo     } >> main.js
echo     ['data', 'logs', 'public'].forEach(dir =^> { >> main.js
echo       const dirPath = path.join(installPath, dir); >> main.js
echo       if (!fs.existsSync(dirPath)) { >> main.js
echo         fs.mkdirSync(dirPath, { recursive: true }); >> main.js
echo       } >> main.js
echo     }); >> main.js
echo     const serverCode = \`const express = require('express'); >> main.js
echo const sqlite3 = require('sqlite3').verbose(); >> main.js
echo const cors = require('cors'); >> main.js
echo const fs = require('fs'); >> main.js
echo const app = express(); >> main.js
echo const PORT = 3000; >> main.js
echo const config = {\${JSON.stringify(config)}}; >> main.js
echo app.use(cors()); >> main.js
echo app.use(express.json()); >> main.js
echo app.use(express.urlencoded({ extended: true })); >> main.js
echo const db = new sqlite3.Database('./data/database.sqlite'); >> main.js
echo db.serialize(() =^> { >> main.js
echo   db.run(\\\`CREATE TABLE IF NOT EXISTS customers ( >> main.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT, >> main.js
echo     name TEXT NOT NULL, >> main.js
echo     phone TEXT, >> main.js
echo     address TEXT, >> main.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP >> main.js
echo   )\\\`); >> main.js
echo   db.run(\\\`CREATE TABLE IF NOT EXISTS deliveries ( >> main.js
echo     id INTEGER PRIMARY KEY AUTOINCREMENT, >> main.js
echo     customer_id INTEGER, >> main.js
echo     customer_name TEXT NOT NULL, >> main.js
echo     customer_phone TEXT, >> main.js
echo     delivery_address TEXT NOT NULL, >> main.js
echo     pickup_address TEXT NOT NULL, >> main.js
echo     description TEXT, >> main.js
echo     price REAL NOT NULL, >> main.js
echo     delivery_fee REAL DEFAULT 7.00, >> main.js
echo     payment_method TEXT DEFAULT 'dinheiro', >> main.js
echo     status TEXT DEFAULT 'pending', >> main.js
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP, >> main.js
echo     FOREIGN KEY (customer_id) REFERENCES customers (id) >> main.js
echo   )\\\`); >> main.js
echo }); >> main.js
echo app.post('/api/deliveries', (req, res) =^> { >> main.js
echo   const { customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method } = req.body; >> main.js
echo   if (!customer_name ^|^| !customer_phone ^|^| !delivery_address ^|^| !price) { >> main.js
echo     return res.status(400).json({ error: 'Dados obrigatórios faltando' }); >> main.js
echo   } >> main.js
echo   db.get('SELECT id FROM customers WHERE phone = ?', [customer_phone], (err, existingCustomer) =^> { >> main.js
echo     if (err) { >> main.js
echo       console.error('Erro ao buscar cliente:', err); >> main.js
echo       return res.status(500).json({ error: 'Erro interno' }); >> main.js
echo     } >> main.js
echo     let customerId = existingCustomer ? existingCustomer.id : null; >> main.js
echo     const insertCustomer = () =^> { >> main.js
echo       if (!customerId) { >> main.js
echo         const stmt = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)'); >> main.js
echo         stmt.run([customer_name, customer_phone, delivery_address], function(err) { >> main.js
echo           if (err) { >> main.js
echo             console.error('Erro ao criar cliente:', err); >> main.js
echo             return res.status(500).json({ error: 'Erro ao criar cliente' }); >> main.js
echo           } >> main.js
echo           customerId = this.lastID; >> main.js
echo           insertDelivery(); >> main.js
echo         }); >> main.js
echo       } else { >> main.js
echo         insertDelivery(); >> main.js
echo       } >> main.js
echo     }; >> main.js
echo     const insertDelivery = () =^> { >> main.js
echo       const stmt = db.prepare('INSERT INTO deliveries (customer_id, customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'); >> main.js
echo       stmt.run([customerId, customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method], function(err) { >> main.js
echo         if (err) { >> main.js
echo           console.error('Erro ao criar entrega:', err); >> main.js
echo           return res.status(500).json({ error: 'Erro ao criar entrega' }); >> main.js
echo         } >> main.js
echo         console.log(\\\`Entrega criada - Cliente: \\\${customer_name}, Valor: R$ \\\${price}\\\`); >> main.js
echo         res.json({ id: this.lastID, customer_id: customerId, message: 'Entrega criada com sucesso' }); >> main.js
echo       }); >> main.js
echo     }; >> main.js
echo     insertCustomer(); >> main.js
echo   }); >> main.js
echo }); >> main.js
echo app.get('/api/deliveries', (req, res) =^> { >> main.js
echo   db.all('SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50', (err, rows) =^> { >> main.js
echo     if (err) { >> main.js
echo       console.error('Erro ao buscar entregas:', err); >> main.js
echo       return res.status(500).json({ error: 'Erro ao buscar entregas' }); >> main.js
echo     } >> main.js
echo     res.json(rows); >> main.js
echo   }); >> main.js
echo }); >> main.js
echo app.get('/api/customers', (req, res) =^> { >> main.js
echo   db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) =^> { >> main.js
echo     if (err) { >> main.js
echo       console.error('Erro ao buscar clientes:', err); >> main.js
echo       return res.status(500).json({ error: 'Erro ao buscar clientes' }); >> main.js
echo     } >> main.js
echo     res.json(rows); >> main.js
echo   }); >> main.js
echo }); >> main.js
echo app.get('/', (req, res) =^> { >> main.js
echo   res.send(\\\`^<!DOCTYPE html^> >> main.js
echo ^<html lang="pt-BR"^> >> main.js
echo ^<head^> >> main.js
echo   ^<meta charset="UTF-8"^> >> main.js
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> main.js
echo   ^<title^>Entrega Fácil - \\\${config.businessName}^</title^> >> main.js
echo   ^<style^> >> main.js
echo     * { margin: 0; padding: 0; box-sizing: border-box; } >> main.js
echo     body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; } >> main.js
echo     .container { max-width: 1200px; margin: 0 auto; padding: 20px; } >> main.js
echo     .header { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; } >> main.js
echo     .card { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px; margin: 20px 0; } >> main.js
echo     .form-group { margin: 15px 0; } >> main.js
echo     .form-group label { display: block; margin-bottom: 8px; font-weight: 600; } >> main.js
echo     .form-control { width: 100%%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; } >> main.js
echo     .btn { padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; background: linear-gradient(135deg, #667eea, #764ba2); color: white; } >> main.js
echo     .btn:hover { transform: translateY(-2px); } >> main.js
echo     .table { width: 100%%; border-collapse: collapse; margin: 20px 0; } >> main.js
echo     .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; } >> main.js
echo     .table th { background: #f8f9fa; font-weight: 600; } >> main.js
echo     .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; } >> main.js
echo     @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } } >> main.js
echo   ^</style^> >> main.js
echo ^</head^> >> main.js
echo ^<body^> >> main.js
echo   ^<div class="container"^> >> main.js
echo     ^<div class="header"^> >> main.js
echo       ^<h1^>🚚 Entrega Fácil^</h1^> >> main.js
echo       ^<p^>\\\${config.businessName}^</p^> >> main.js
echo     ^</div^> >> main.js
echo     ^<div class="grid"^> >> main.js
echo       ^<div class="card"^> >> main.js
echo         ^<h2^>📝 Nova Entrega^</h2^> >> main.js
echo         ^<form id="deliveryForm"^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Nome do Cliente:^</label^> >> main.js
echo             ^<input type="text" id="customerName" class="form-control" required^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Telefone:^</label^> >> main.js
echo             ^<input type="tel" id="customerPhone" class="form-control" required^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Endereço de Entrega:^</label^> >> main.js
echo             ^<input type="text" id="deliveryAddress" class="form-control" required^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Endereço de Coleta:^</label^> >> main.js
echo             ^<input type="text" id="pickupAddress" class="form-control" value="\\\${config.businessAddress}" required^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Descrição:^</label^> >> main.js
echo             ^<textarea id="description" class="form-control" rows="3"^>^</textarea^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Valor (R$):^</label^> >> main.js
echo             ^<input type="number" id="price" class="form-control" step="0.01" required^> >> main.js
echo           ^</div^> >> main.js
echo           ^<div class="form-group"^> >> main.js
echo             ^<label^>Pagamento:^</label^> >> main.js
echo             ^<select id="paymentMethod" class="form-control"^> >> main.js
echo               ^<option value="dinheiro"^>💵 Dinheiro^</option^> >> main.js
echo               ^<option value="pix"^>📱 PIX^</option^> >> main.js
echo               ^<option value="cartao"^>💳 Cartão^</option^> >> main.js
echo             ^</select^> >> main.js
echo           ^</div^> >> main.js
echo           ^<button type="submit" class="btn"^>🚚 Solicitar Entrega^</button^> >> main.js
echo         ^</form^> >> main.js
echo       ^</div^> >> main.js
echo       ^<div class="card"^> >> main.js
echo         ^<h3^>ℹ️ Informações^</h3^> >> main.js
echo         ^<p^>^<strong^>Taxa:^</strong^> R$ 7,00^</p^> >> main.js
echo         ^<p^>^<strong^>Tempo:^</strong^> 30-45 min^</p^> >> main.js
echo         ^<p^>^<strong^>Horário:^</strong^> 8h às 18h^</p^> >> main.js
echo         ^<h3^>📋 Clientes Cadastrados^</h3^> >> main.js
echo         ^<div id="customersList"^>Carregando...^</div^> >> main.js
echo       ^</div^> >> main.js
echo     ^</div^> >> main.js
echo     ^<div class="card"^> >> main.js
echo       ^<h2^>📋 Entregas Recentes^</h2^> >> main.js
echo       ^<div id="deliveriesTable"^>Carregando...^</div^> >> main.js
echo     ^</div^> >> main.js
echo   ^</div^> >> main.js
echo   ^<script^> >> main.js
echo     document.getElementById('deliveryForm').addEventListener('submit', async function(e) { >> main.js
echo       e.preventDefault(); >> main.js
echo       const delivery = { >> main.js
echo         customer_name: document.getElementById('customerName').value, >> main.js
echo         customer_phone: document.getElementById('customerPhone').value, >> main.js
echo         delivery_address: document.getElementById('deliveryAddress').value, >> main.js
echo         pickup_address: document.getElementById('pickupAddress').value, >> main.js
echo         description: document.getElementById('description').value, >> main.js
echo         price: parseFloat(document.getElementById('price').value), >> main.js
echo         payment_method: document.getElementById('paymentMethod').value >> main.js
echo       }; >> main.js
echo       try { >> main.js
echo         const response = await fetch('/api/deliveries', { >> main.js
echo           method: 'POST', >> main.js
echo           headers: { 'Content-Type': 'application/json' }, >> main.js
echo           body: JSON.stringify(delivery) >> main.js
echo         }); >> main.js
echo         if (response.ok) { >> main.js
echo           alert('✅ Entrega solicitada com sucesso! Cliente salvo no banco de dados.'); >> main.js
echo           document.getElementById('deliveryForm').reset(); >> main.js
echo           document.getElementById('pickupAddress').value = '\\\${config.businessAddress}'; >> main.js
echo           loadDeliveries(); >> main.js
echo           loadCustomers(); >> main.js
echo         } else { >> main.js
echo           alert('❌ Erro ao solicitar entrega.'); >> main.js
echo         } >> main.js
echo       } catch (error) { >> main.js
echo         alert('❌ Erro de conexão.'); >> main.js
echo       } >> main.js
echo     }); >> main.js
echo     async function loadDeliveries() { >> main.js
echo       try { >> main.js
echo         const response = await fetch('/api/deliveries'); >> main.js
echo         const deliveries = await response.json(); >> main.js
echo         let html = ''; >> main.js
echo         if (deliveries.length === 0) { >> main.js
echo           html = '^<p^>Nenhuma entrega encontrada^</p^>'; >> main.js
echo         } else { >> main.js
echo           html = '^<table class="table"^>^<thead^>^<tr^>^<th^>Cliente^</th^>^<th^>Telefone^</th^>^<th^>Endereço^</th^>^<th^>Valor^</th^>^<th^>Pagamento^</th^>^<th^>Data^</th^>^</tr^>^</thead^>^<tbody^>'; >> main.js
echo           deliveries.forEach(delivery =^> { >> main.js
echo             const date = new Date(delivery.created_at).toLocaleDateString('pt-BR'); >> main.js
echo             html += \\\`^<tr^> >> main.js
echo               ^<td^>\\\${delivery.customer_name}^</td^> >> main.js
echo               ^<td^>\\\${delivery.customer_phone}^</td^> >> main.js
echo               ^<td^>\\\${delivery.delivery_address}^</td^> >> main.js
echo               ^<td^>R$ \\\${delivery.price.toFixed(2)}^</td^> >> main.js
echo               ^<td^>\\\${delivery.payment_method}^</td^> >> main.js
echo               ^<td^>\\\${date}^</td^> >> main.js
echo             ^</tr^>\\\`; >> main.js
echo           }); >> main.js
echo           html += '^</tbody^>^</table^>'; >> main.js
echo         } >> main.js
echo         document.getElementById('deliveriesTable').innerHTML = html; >> main.js
echo       } catch (error) { >> main.js
echo         document.getElementById('deliveriesTable').innerHTML = '^<p^>Erro ao carregar entregas^</p^>'; >> main.js
echo       } >> main.js
echo     } >> main.js
echo     async function loadCustomers() { >> main.js
echo       try { >> main.js
echo         const response = await fetch('/api/customers'); >> main.js
echo         const customers = await response.json(); >> main.js
echo         let html = ''; >> main.js
echo         if (customers.length === 0) { >> main.js
echo           html = '^<p^>Nenhum cliente cadastrado^</p^>'; >> main.js
echo         } else { >> main.js
echo           html = '^<ul^>'; >> main.js
echo           customers.forEach(customer =^> { >> main.js
echo             html += \\\`^<li^>^<strong^>\\\${customer.name}^</strong^> - \\\${customer.phone}^</li^>\\\`; >> main.js
echo           }); >> main.js
echo           html += '^</ul^>'; >> main.js
echo         } >> main.js
echo         document.getElementById('customersList').innerHTML = html; >> main.js
echo       } catch (error) { >> main.js
echo         document.getElementById('customersList').innerHTML = '^<p^>Erro ao carregar clientes^</p^>'; >> main.js
echo       } >> main.js
echo     } >> main.js
echo     loadDeliveries(); >> main.js
echo     loadCustomers(); >> main.js
echo     setInterval(loadDeliveries, 60000); >> main.js
echo     setInterval(loadCustomers, 60000); >> main.js
echo   ^</script^> >> main.js
echo ^</body^> >> main.js
echo ^</html^> >> main.js
echo   \\\`); >> main.js
echo }); >> main.js
echo app.listen(PORT, () =^> { >> main.js
echo   console.log(\\\`🚀 Servidor rodando em: http://localhost:\\\${PORT}\\\`); >> main.js
echo   console.log(\\\`🏪 Comerciante: \\\${config.businessName}\\\`); >> main.js
echo   console.log(\\\`✅ Sistema pronto para receber pedidos!\\\`); >> main.js
echo }); >> main.js
echo \`; >> main.js
echo     fs.writeFileSync(path.join(installPath, 'server.js'), serverCode); >> main.js
echo     const packageJson = { >> main.js
echo       name: 'entrega-facil-client', >> main.js
echo       version: '1.0.0', >> main.js
echo       dependencies: { >> main.js
echo         express: '^4.18.2', >> main.js
echo         sqlite3: '^5.1.6', >> main.js
echo         cors: '^2.8.5' >> main.js
echo       } >> main.js
echo     }; >> main.js
echo     fs.writeFileSync(path.join(installPath, 'package.json'), JSON.stringify(packageJson, null, 2)); >> main.js
echo     const configFile = { >> main.js
echo       ...config, >> main.js
echo       version: '1.0.0', >> main.js
echo       installDate: new Date().toISOString() >> main.js
echo     }; >> main.js
echo     fs.writeFileSync(path.join(installPath, 'config.json'), JSON.stringify(configFile, null, 2)); >> main.js
echo     const startScript = \`@echo off >> main.js
echo title Entrega Facil - \${config.businessName} >> main.js
echo color 0B >> main.js
echo cd /d "\${installPath}" >> main.js
echo echo Iniciando sistema... >> main.js
echo node server.js >> main.js
echo pause\`; >> main.js
echo     fs.writeFileSync(path.join(installPath, 'Iniciar Sistema.bat'), startScript); >> main.js
echo     return { success: true, path: installPath }; >> main.js
echo   } catch (error) { >> main.js
echo     return { success: false, error: error.message }; >> main.js
echo   } >> main.js
echo }); >> main.js
echo. >> main.js
echo ipcMain.handle('close-app', () =^> app.quit()); >> main.js

:: Criar index.html completo
echo Criando interface...
echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="pt-BR"^> >> index.html
echo ^<head^> >> index.html
echo   ^<meta charset="UTF-8"^> >> index.html
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> index.html
echo   ^<title^>Instalador Entrega Fácil^</title^> >> index.html
echo   ^<style^> >> index.html
echo     * { margin: 0; padding: 0; box-sizing: border-box; } >> index.html
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; align-items: center; justify-content: center; } >> index.html
echo     .container { max-width: 700px; width: 90%%; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); } >> index.html
echo     .header { text-align: center; margin-bottom: 30px; } >> index.html
echo     .header h1 { color: #333; font-size: 2.5em; margin-bottom: 10px; } >> index.html
echo     .header .icon { font-size: 3em; margin-bottom: 10px; } >> index.html
echo     .form-group { margin: 20px 0; } >> index.html
echo     .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; } >> index.html
echo     .form-control { width: 100%%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; } >> index.html
echo     .form-control:focus { outline: none; border-color: #667eea; } >> index.html
echo     .btn { padding: 12px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; margin: 10px 5px; } >> index.html
echo     .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; } >> index.html
echo     .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); } >> index.html
echo     .btn-secondary { background: #f8f9fa; color: #333; border: 2px solid #e1e1e1; } >> index.html
echo     .status { padding: 15px; border-radius: 10px; margin: 15px 0; text-align: center; display: none; } >> index.html
echo     .status-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; } >> index.html
echo     .status-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; } >> index.html
echo     .actions { text-align: center; margin-top: 30px; } >> index.html
echo     .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; } >> index.html
echo     @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } } >> index.html
echo   ^</style^> >> index.html
echo ^</head^> >> index.html
echo ^<body^> >> index.html
echo   ^<div class="container"^> >> index.html
echo     ^<div class="header"^> >> index.html
echo       ^<div class="icon"^>🚚^</div^> >> index.html
echo       ^<h1^>Entrega Fácil^</h1^> >> index.html
echo       ^<p^>Instalador do Sistema de Entregas Local^</p^> >> index.html
echo     ^</div^> >> index.html
echo     ^<form id="configForm"^> >> index.html
echo       ^<div class="form-group"^> >> index.html
echo         ^<label^>Nome do Estabelecimento:^</label^> >> index.html
echo         ^<input type="text" id="businessName" class="form-control" placeholder="Ex: Padaria do João" required^> >> index.html
echo       ^</div^> >> index.html
echo       ^<div class="grid"^> >> index.html
echo         ^<div class="form-group"^> >> index.html
echo           ^<label^>Telefone:^</label^> >> index.html
echo           ^<input type="tel" id="businessPhone" class="form-control" placeholder="(11) 99999-9999" required^> >> index.html
echo         ^</div^> >> index.html
echo         ^<div class="form-group"^> >> index.html
echo           ^<label^>Email (opcional):^</label^> >> index.html
echo           ^<input type="email" id="businessEmail" class="form-control" placeholder="contato@estabelecimento.com"^> >> index.html
echo         ^</div^> >> index.html
echo       ^</div^> >> index.html
echo       ^<div class="form-group"^> >> index.html
echo         ^<label^>Endereço Completo:^</label^> >> index.html
echo         ^<input type="text" id="businessAddress" class="form-control" placeholder="Rua, número, bairro, cidade" required^> >> index.html
echo       ^</div^> >> index.html
echo       ^<div class="actions"^> >> index.html
echo         ^<button type="button" class="btn btn-primary" onclick="installSystem()"^>Instalar Sistema^</button^> >> index.html
echo         ^<button type="button" class="btn btn-secondary" onclick="closeApp()"^>Cancelar^</button^> >> index.html
echo       ^</div^> >> index.html
echo     ^</form^> >> index.html
echo     ^<div id="status" class="status"^>^</div^> >> index.html
echo   ^</div^> >> index.html
echo   ^<script^> >> index.html
echo     const { ipcRenderer } = require('electron'); >> index.html
echo     function validateForm() { >> index.html
echo       const required = ['businessName', 'businessPhone', 'businessAddress']; >> index.html
echo       let valid = true; >> index.html
echo       required.forEach(field =^> { >> index.html
echo         const input = document.getElementById(field); >> index.html
echo         if (!input.value.trim()) { >> index.html
echo           input.style.borderColor = '#dc3545'; >> index.html
echo           valid = false; >> index.html
echo         } else { >> index.html
echo           input.style.borderColor = '#e1e1e1'; >> index.html
echo         } >> index.html
echo       }); >> index.html
echo       return valid; >> index.html
echo     } >> index.html
echo     async function installSystem() { >> index.html
echo       if (!validateForm()) { >> index.html
echo         showStatus('Por favor, preencha todos os campos obrigatórios.', 'error'); >> index.html
echo         return; >> index.html
echo       } >> index.html
echo       const config = { >> index.html
echo         businessName: document.getElementById('businessName').value, >> index.html
echo         businessPhone: document.getElementById('businessPhone').value, >> index.html
echo         businessAddress: document.getElementById('businessAddress').value, >> index.html
echo         businessEmail: document.getElementById('businessEmail').value >> index.html
echo       }; >> index.html
echo       showStatus('Instalando sistema...', 'success'); >> index.html
echo       try { >> index.html
echo         const result = await ipcRenderer.invoke('install-system', config); >> index.html
echo         if (result.success) { >> index.html
echo           showStatus(\`Sistema instalado com sucesso!\\nPasta: \${result.path}\\nSistema pronto para uso com banco de dados de clientes integrado.\`, 'success'); >> index.html
echo         } else { >> index.html
echo           showStatus(\`Erro na instalação: \${result.error}\`, 'error'); >> index.html
echo         } >> index.html
echo       } catch (error) { >> index.html
echo         showStatus(\`Erro na instalação: \${error.message}\`, 'error'); >> index.html
echo       } >> index.html
echo     } >> index.html
echo     function showStatus(message, type) { >> index.html
echo       const status = document.getElementById('status'); >> index.html
echo       status.style.display = 'block'; >> index.html
echo       status.className = \`status status-\${type}\`; >> index.html
echo       status.innerHTML = message.replace(/\\n/g, '^<br^>'); >> index.html
echo     } >> index.html
echo     async function closeApp() { >> index.html
echo       await ipcRenderer.invoke('close-app'); >> index.html
echo     } >> index.html
echo   ^</script^> >> index.html
echo ^</body^> >> index.html
echo ^</html^> >> index.html

:: Instalar dependências
echo Instalando dependências...
call npm install --no-package-lock
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

:: Construir
echo Construindo EXE...
call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na construção!
    pause
    exit /b 1
)

:: Copiar resultado
if exist "dist\*.exe" (
    echo.
    echo ✅ SUCESSO! EXE criado com sucesso!
    echo.
    
    :: Copiar para pasta do usuário
    copy "dist\*.exe" "%USERPROFILE%\Desktop\" >nul
    echo ✅ EXE copiado para área de trabalho
    
    :: Copiar para pasta original
    copy "dist\*.exe" "%~dp0" >nul
    echo ✅ EXE copiado para pasta original
    
    echo.
    echo Executar instalador agora? (S/N)
    set /p run=
    if /i "%run%"=="S" (
        start "" "%USERPROFILE%\Desktop\*.exe"
    )
) else (
    echo ❌ Erro: EXE não foi criado!
)

:: Limpeza
echo.
echo Limpando...
cd /d "%~dp0"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" >nul 2>&1

echo.
echo Processo concluído!
pause
exit /b 0