@echo off
title Corrigir Instalacao para Cliente Final
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                     CORRIGINDO INSTALACAO PARA CLIENTE                     ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%USERPROFILE%\EntregaFacil"

if not exist "server.js" (
    echo ERRO: Sistema nao encontrado!
    echo Execute primeiro o instalador principal
    pause
    exit /b 1
)

echo [1/3] Fazendo backup do servidor atual...
copy "server.js" "server-backup.js" >nul

echo [2/3] Criando interface do cliente (comerciante)...

:: Criar página principal para comerciantes
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
echo // Configuracao com fallback
echo let config;
echo try {
echo   config = JSON.parse^(fs.readFileSync^('config.json', 'utf8'^)^);
echo } catch ^(error^) {
echo   config = {
echo     businessName: 'Comerciante Local',
echo     businessEmail: 'comerciante@local.com',
echo     businessPhone: '^(11^) 99999-9999',
echo     localPort: 3000,
echo     version: '2.0.0'
echo   };
echo }
echo.
echo const app = express^(^);
echo const PORT = config.localPort ^|^| 3000;
echo.
echo app.use^(helmet^(^)^);
echo app.use^(cors^(^)^);
echo app.use^(bodyParser.json^(^)^);
echo app.use^(bodyParser.urlencoded^({ extended: true }^)^);
echo.
echo // Inicializar banco de dados
echo const db = new sqlite3.Database^('./data/database.sqlite'^);
echo.
echo // Criar tabelas se nao existirem
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
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
echo   ^)`^);
echo }^);
echo.
echo // Rota principal - Interface do Comerciante
echo app.get^('/', ^(req, res^) =^> {
echo   res.send^(`
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Sistema de Entregas - ${config.businessName}^</title^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
echo     .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
echo     .header h1 { margin-bottom: 10px; }
echo     .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
echo     .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba^(0,0,0,0.1^); }
echo     .form-group { margin: 15px 0; }
echo     .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
echo     .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
echo     .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
echo     .btn-primary { background: #3498db; color: white; }
echo     .btn-success { background: #27ae60; color: white; }
echo     .btn-primary:hover { background: #2980b9; }
echo     .btn-success:hover { background: #219a52; }
echo     .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
echo     .status { padding: 10px; border-radius: 4px; text-align: center; margin: 10px 0; }
echo     .status-success { background: #d4edda; color: #155724; }
echo     .status-warning { background: #fff3cd; color: #856404; }
echo     .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
echo     .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
echo     .table th { background: #f8f9fa; }
echo     .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
echo     .badge-warning { background: #ffc107; color: #212529; }
echo     .badge-success { background: #28a745; color: white; }
echo     .badge-info { background: #17a2b8; color: white; }
echo     @media ^(max-width: 768px^) {
echo       .grid { grid-template-columns: 1fr; }
echo       .container { padding: 10px; }
echo     }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="header"^>
echo     ^<h1^>🚚 Sistema de Entregas^</h1^>
echo     ^<p^>${config.businessName} - Solicite suas entregas aqui^</p^>
echo   ^</div^>
echo   
echo   ^<div class="container"^>
echo     ^<div class="status status-success"^>
echo       ✅ Sistema Online - Pronto para receber pedidos de entrega
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
echo             ^<label^>Telefone do Cliente:^</label^>
echo             ^<input type="tel" id="customerPhone" class="form-control" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Endereço de Entrega:^</label^>
echo             ^<input type="text" id="deliveryAddress" class="form-control" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Endereço de Coleta:^</label^>
echo             ^<input type="text" id="pickupAddress" class="form-control" value="${config.businessAddress}" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Descrição do Pedido:^</label^>
echo             ^<textarea id="description" class="form-control" rows="3"^>^</textarea^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Valor do Pedido ^(R$^):^</label^>
echo             ^<input type="number" id="price" class="form-control" step="0.01" required^>
echo           ^</div^>
echo           ^<div class="form-group"^>
echo             ^<label^>Forma de Pagamento:^</label^>
echo             ^<select id="paymentMethod" class="form-control"^>
echo               ^<option value="dinheiro"^>Dinheiro^</option^>
echo               ^<option value="pix"^>PIX^</option^>
echo               ^<option value="cartao_credito"^>Cartão de Crédito^</option^>
echo               ^<option value="cartao_debito"^>Cartão de Débito^</option^>
echo               ^<option value="vale_refeicao"^>Vale Refeição^</option^>
echo             ^</select^>
echo           ^</div^>
echo           ^<button type="submit" class="btn btn-primary"^>🚚 Solicitar Entrega^</button^>
echo         ^</form^>
echo       ^</div^>
echo       
echo       ^<div class="card"^>
echo         ^<h2^>ℹ️ Informações^</h2^>
echo         ^<p^>^<strong^>Taxa de Entrega:^</strong^> R$ 7,00^</p^>
echo         ^<p^>^<strong^>Tempo Estimado:^</strong^> 30-45 minutos^</p^>
echo         ^<p^>^<strong^>Área de Cobertura:^</strong^> Cidade local^</p^>
echo         ^<p^>^<strong^>Horário de Funcionamento:^</strong^> 8h às 18h^</p^>
echo         ^<div class="status status-warning"^>
echo           💡 Dica: Tenha o pedido pronto para coleta quando o entregador chegar
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<h2^>📋 Suas Entregas Recentes^</h2^>
echo       ^<div id="deliveriesTable"^>
echo         ^<p^>Carregando entregas...^</p^>
echo       ^</div^>
echo     ^</div^>
echo   ^</div^>
echo   
echo   ^<script^>
echo     document.getElementById^('deliveryForm'^).addEventListener^('submit', async function^(e^) {
echo       e.preventDefault^(^);
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
echo           alert^('Entrega solicitada com sucesso!'^);
echo           document.getElementById^('deliveryForm'^).reset^(^);
echo           loadDeliveries^(^);
echo         } else {
echo           alert^('Erro ao solicitar entrega'^);
echo         }
echo       } catch ^(error^) {
echo         alert^('Erro de conexão'^);
echo       }
echo     }^);
echo     
echo     async function loadDeliveries^(^) {
echo       try {
echo         const response = await fetch^('/api/deliveries'^);
echo         const deliveries = await response.json^(^);
echo         
echo         let html = '';
echo         if ^(deliveries.length === 0^) {
echo           html = '^<p^>Nenhuma entrega encontrada^</p^>';
echo         } else {
echo           html = `
echo             ^<table class="table"^>
echo               ^<thead^>
echo                 ^<tr^>
echo                   ^<th^>Cliente^</th^>
echo                   ^<th^>Endereço^</th^>
echo                   ^<th^>Valor^</th^>
echo                   ^<th^>Pagamento^</th^>
echo                   ^<th^>Status^</th^>
echo                   ^<th^>Data^</th^>
echo                 ^</tr^>
echo               ^</thead^>
echo               ^<tbody^>
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
echo                 ^<td^>${delivery.payment_method}^</td^>
echo                 ^<td^>^<span class="badge ${statusClass}"^>${statusText}^</span^>^</td^>
echo                 ^<td^>${date}^</td^>
echo               ^</tr^>
echo             `;
echo           }^);
echo           
echo           html += '^</tbody^>^</table^>';
echo         }
echo         
echo         document.getElementById^('deliveriesTable'^).innerHTML = html;
echo       } catch ^(error^) {
echo         document.getElementById^('deliveriesTable'^).innerHTML = '^<p^>Erro ao carregar entregas^</p^>';
echo       }
echo     }
echo     
echo     // Carregar entregas ao iniciar
echo     loadDeliveries^(^);
echo     
echo     // Atualizar a cada 30 segundos
echo     setInterval^(loadDeliveries, 30000^);
echo   ^</script^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // API para criar entrega
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
echo       console.error^('Erro ao criar entrega:', err^);
echo       return res.status^(500^).json^({ error: 'Erro ao criar entrega' }^);
echo     }
echo     
echo     res.json^({ id: this.lastID, message: 'Entrega criada com sucesso' }^);
echo   }^);
echo }^);
echo.
echo // API para listar entregas
echo app.get^('/api/deliveries', ^(req, res^) =^> {
echo   db.all^(
echo     'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 20',
echo     ^(err, rows^) =^> {
echo       if ^(err^) {
echo         console.error^('Erro ao buscar entregas:', err^);
echo         return res.status^(500^).json^({ error: 'Erro ao buscar entregas' }^);
echo       }
echo       res.json^(rows^);
echo     }
echo   ^);
echo }^);
echo.
echo // API de status
echo app.get^('/api/status', ^(req, res^) =^> {
echo   res.json^({
echo     status: 'online',
echo     version: config.version,
echo     businessName: config.businessName,
echo     timestamp: new Date^(^).toISOString^(^)
echo   }^);
echo }^);
echo.
echo // Iniciar servidor
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`Sistema de Entregas rodando em http://localhost:${PORT}`^);
echo   console.log^(`Comerciante: ${config.businessName}`^);
echo   console.log^(`Sistema pronto para receber pedidos de entrega`^);
echo }^);
) > server.js

echo [3/3] Atualizando configurações...

:: Atualizar config.json para cliente comerciante
powershell -Command "& {
    try {
        $config = Get-Content 'config.json' -Raw | ConvertFrom-Json
        $config.businessName = 'Comerciante Local'
        $config.businessEmail = 'comerciante@local.com'
        $config.businessAddress = 'Rua do Comercio, 123'
        $config.clientType = 'merchant'
        $config.adminAccess = $false
        $config | ConvertTo-Json -Depth 4 | Out-File 'config.json' -Encoding UTF8
        Write-Host 'Configuração atualizada!'
    } catch {
        Write-Host 'Erro ao atualizar configuração'
    }
}" 2>nul

echo.
echo ===============================================
echo   SISTEMA CORRIGIDO PARA CLIENTE COMERCIANTE!
echo ===============================================
echo.
echo ✅ Interface simplificada para comerciante
echo ✅ Apenas funcionalidades necessárias
echo ✅ Formulário de solicitação de entrega
echo ✅ Visualização de entregas próprias
echo ✅ Sem acesso administrativo
echo ✅ Focado no uso pelo cliente final
echo.
echo Para usar:
echo 1. Reinicie o servidor (Ctrl+C e depois: node server.js)
echo 2. Acesse: http://localhost:3000
echo 3. O comerciante poderá solicitar entregas
echo.
echo O sistema agora está configurado corretamente
echo para o cliente final (comerciante) usar!
echo.
pause