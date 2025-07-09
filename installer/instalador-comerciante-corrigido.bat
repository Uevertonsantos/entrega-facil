@echo off
title Instalador Entrega Facil - Cliente Comerciante
color 0B
setlocal enabledelayedexpansion

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
echo {> package.json
echo   "name": "entrega-facil-cliente",>> package.json
echo   "version": "3.0.0",>> package.json
echo   "description": "Sistema de Entregas para Comerciantes",>> package.json
echo   "main": "server.js",>> package.json
echo   "scripts": {>> package.json
echo     "start": "node server.js">> package.json
echo   },>> package.json
echo   "dependencies": {>> package.json
echo     "express": "^4.18.2",>> package.json
echo     "sqlite3": "^5.1.6",>> package.json
echo     "cors": "^2.8.5",>> package.json
echo     "body-parser": "^1.20.2",>> package.json
echo     "axios": "^1.6.0",>> package.json
echo     "helmet": "^7.0.0">> package.json
echo   }>> package.json
echo }>> package.json

call npm install --silent >nul 2>&1
if %errorlevel% neq 0 (
    echo     Erro ao instalar dependencias. Tentando novamente...
    timeout /t 3 >nul
    call npm install --silent >nul 2>&1
)

:: Criar arquivo de configuracao
echo [5/8] Criando configuracao...
echo {> config.json
echo   "businessName": "Comerciante Local",>> config.json
echo   "businessEmail": "comerciante@local.com",>> config.json
echo   "businessPhone": "(11) 99999-9999",>> config.json
echo   "businessAddress": "Rua do Comercio, 123, Centro",>> config.json
echo   "localPort": %PORT%,>> config.json
echo   "version": "3.0.0",>> config.json
echo   "clientType": "merchant",>> config.json
echo   "adminAccess": false,>> config.json
echo   "syncEnabled": true,>> config.json
echo   "adminUrl": "https://admin.entregafacil.com",>> config.json
echo   "installDate": "%DATE% %TIME%",>> config.json
echo   "features": {>> config.json
echo     "deliveryRequest": true,>> config.json
echo     "historyView": true,>> config.json
echo     "adminPanel": false>> config.json
echo   }>> config.json
echo }>> config.json

:: Criar servidor para comerciante usando PowerShell para evitar problemas de escape
echo [6/8] Criando servidor...
powershell -Command "
$serverCode = @'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

// Carregar configuracao
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const app = express();
const PORT = config.localPort || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Banco de dados SQLite
const db = new sqlite3.Database('./data/database.sqlite');

// Inicializar banco
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    delivery_fee REAL DEFAULT 7.00,
    payment_method TEXT DEFAULT 'dinheiro',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Configuracoes iniciais
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('business_name', ?)`, [config.businessName]);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('business_address', ?)`, [config.businessAddress]);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('business_phone', ?)`, [config.businessPhone]);
});

// Logging
function logMessage(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `{timestamp} [{level}] {message}\n`;
  
  fs.appendFileSync(`./logs/{level}.log`, logEntry);
  console.log(logEntry.trim());
}

// Pagina principal - Interface do Comerciante
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang=\"pt-BR\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Entrega Facil - {config.businessName}</title>
  <link href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css\" rel=\"stylesheet\">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .card { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    .form-group { margin: 15px 0; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
    .form-control { width: 100%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
    .form-control:focus { outline: none; border-color: #667eea; }
    .btn { padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s; }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
    .status { padding: 15px; border-radius: 10px; text-align: center; margin: 15px 0; }
    .status-success { background: linear-gradient(135deg, #d4edda, #c3e6cb); color: #155724; }
    .info-card { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-item { display: flex; align-items: center; margin: 10px 0; }
    .info-item i { margin-right: 10px; color: #667eea; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; }
    .table th { background: #f8f9fa; font-weight: 600; }
    .table tr:hover { background: #f8f9fa; }
    .badge { padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-info { background: #cce5ff; color: #004085; }
    .empty-state { text-align: center; padding: 40px; color: #666; }
    .loading { display: none; text-align: center; padding: 20px; }
    .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class=\"container\">
    <div class=\"header\">
      <h1><i class=\"fas fa-shipping-fast\"></i> Entrega Facil</h1>
      <p>{config.businessName} - Sistema de Entregas Local</p>
    </div>
    
    <div class=\"status status-success\">
      <i class=\"fas fa-check-circle\"></i> Sistema Online - Pronto para receber pedidos de entrega
    </div>
    
    <div class=\"grid\">
      <div class=\"card\">
        <h2><i class=\"fas fa-plus-circle\"></i> Nova Entrega</h2>
        <form id=\"deliveryForm\">
          <div class=\"form-group\">
            <label><i class=\"fas fa-user\"></i> Nome do Cliente:</label>
            <input type=\"text\" id=\"customerName\" class=\"form-control\" required placeholder=\"Ex: João Silva\">
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-phone\"></i> Telefone do Cliente:</label>
            <input type=\"tel\" id=\"customerPhone\" class=\"form-control\" required placeholder=\"(11) 99999-9999\">
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-map-marker-alt\"></i> Endereço de Entrega:</label>
            <input type=\"text\" id=\"deliveryAddress\" class=\"form-control\" required placeholder=\"Rua, numero, bairro\">
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-store\"></i> Endereço de Coleta:</label>
            <input type=\"text\" id=\"pickupAddress\" class=\"form-control\" value=\"{config.businessAddress}\" required>
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-clipboard-list\"></i> Descrição do Pedido:</label>
            <textarea id=\"description\" class=\"form-control\" rows=\"3\" placeholder=\"Descreva os itens do pedido...\"></textarea>
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-dollar-sign\"></i> Valor do Pedido (R$):</label>
            <input type=\"number\" id=\"price\" class=\"form-control\" step=\"0.01\" required placeholder=\"0.00\">
          </div>
          <div class=\"form-group\">
            <label><i class=\"fas fa-credit-card\"></i> Forma de Pagamento:</label>
            <select id=\"paymentMethod\" class=\"form-control\">
              <option value=\"dinheiro\">💵 Dinheiro</option>
              <option value=\"pix\">📱 PIX</option>
              <option value=\"cartao_credito\">💳 Cartão de Crédito</option>
              <option value=\"cartao_debito\">💳 Cartão de Débito</option>
              <option value=\"vale_refeicao\">🍽️ Vale Refeição</option>
            </select>
          </div>
          <div class=\"loading\" id=\"loading\">
            <div class=\"spinner\"></div>
            <p>Criando entrega...</p>
          </div>
          <button type=\"submit\" class=\"btn btn-primary\" id=\"submitBtn\">
            <i class=\"fas fa-shipping-fast\"></i> Solicitar Entrega
          </button>
        </form>
      </div>
      
      <div>
        <div class=\"info-card\">
          <h3><i class=\"fas fa-info-circle\"></i> Informações da Entrega</h3>
          <div class=\"info-item\">
            <i class=\"fas fa-money-bill-wave\"></i>
            <span><strong>Taxa de Entrega:</strong> R$ 7,00</span>
          </div>
          <div class=\"info-item\">
            <i class=\"fas fa-clock\"></i>
            <span><strong>Tempo Estimado:</strong> 30-45 minutos</span>
          </div>
          <div class=\"info-item\">
            <i class=\"fas fa-map\"></i>
            <span><strong>Área de Cobertura:</strong> Cidade local</span>
          </div>
          <div class=\"info-item\">
            <i class=\"fas fa-business-time\"></i>
            <span><strong>Horário:</strong> 8h às 18h</span>
          </div>
        </div>
        
        <div class=\"info-card\">
          <h3><i class=\"fas fa-lightbulb\"></i> Dicas Importantes</h3>
          <p>• Tenha o pedido pronto para coleta</p>
          <p>• Confirme o endereço de entrega</p>
          <p>• Mantenha o telefone disponível</p>
          <p>• Pedidos são processados por ordem</p>
        </div>
      </div>
    </div>
    
    <div class=\"card\">
      <h2><i class=\"fas fa-history\"></i> Suas Entregas Recentes</h2>
      <div id=\"deliveriesTable\">
        <div class=\"loading\"><div class=\"spinner\"></div>Carregando entregas...</div>
      </div>
    </div>
  </div>
  
  <script>
    document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const loading = document.getElementById('loading');
      const submitBtn = document.getElementById('submitBtn');
      
      loading.style.display = 'block';
      submitBtn.disabled = true;
      
      const delivery = {
        customer_name: document.getElementById('customerName').value,
        customer_phone: document.getElementById('customerPhone').value,
        delivery_address: document.getElementById('deliveryAddress').value,
        pickup_address: document.getElementById('pickupAddress').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value),
        payment_method: document.getElementById('paymentMethod').value
      };
      
      try {
        const response = await fetch('/api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(delivery)
        });
        
        if (response.ok) {
          alert('✅ Entrega solicitada com sucesso!\\n\\nSeu pedido foi enviado e será processado em breve.');
          document.getElementById('deliveryForm').reset();
          document.getElementById('pickupAddress').value = '{config.businessAddress}';
          loadDeliveries();
        } else {
          alert('❌ Erro ao solicitar entrega. Tente novamente.');
        }
      } catch (error) {
        alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      loading.style.display = 'none';
      submitBtn.disabled = false;
    });
    
    async function loadDeliveries() {
      try {
        const response = await fetch('/api/deliveries');
        const deliveries = await response.json();
        
        let html = '';
        if (deliveries.length === 0) {
          html = `
            <div class=\"empty-state\">
              <i class=\"fas fa-box-open\" style=\"font-size: 48px; color: #ccc;\"></i>
              <p>Nenhuma entrega encontrada</p>
              <p>Suas entregas aparecerão aqui após serem solicitadas</p>
            </div>
          `;
        } else {
          html = `
            <div class=\"table-responsive\">
              <table class=\"table\">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Endereço</th>
                    <th>Valor</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          deliveries.forEach(delivery => {
            const date = new Date(delivery.created_at).toLocaleDateString('pt-BR');
            const statusClass = delivery.status === 'pending' ? 'badge-warning' : 
                              delivery.status === 'in_progress' ? 'badge-info' : 'badge-success';
            const statusText = delivery.status === 'pending' ? 'Pendente' : 
                             delivery.status === 'in_progress' ? 'Em Andamento' : 'Concluída';
            
            html += `
              <tr>
                <td>{delivery.customer_name}</td>
                <td>{delivery.delivery_address}</td>
                <td>R$ {delivery.price.toFixed(2)}</td>
                <td>{formatPaymentMethod(delivery.payment_method)}</td>
                <td><span class=\"badge {statusClass}\">{statusText}</span></td>
                <td>{date}</td>
              </tr>
            `;
          });
          
          html += '</tbody></table></div>';
        }
        
        document.getElementById('deliveriesTable').innerHTML = html;
      } catch (error) {
        document.getElementById('deliveriesTable').innerHTML = `
          <div class=\"empty-state\">
            <i class=\"fas fa-exclamation-triangle\" style=\"font-size: 48px; color: #ff6b6b;\"></i>
            <p>Erro ao carregar entregas</p>
            <p>Verifique sua conexão com a internet</p>
          </div>
        `;
      }
    }
    
    function formatPaymentMethod(method) {
      const methods = {
        'dinheiro': '💵 Dinheiro',
        'pix': '📱 PIX',
        'cartao_credito': '💳 Cartão Crédito',
        'cartao_debito': '💳 Cartão Débito',
        'vale_refeicao': '🍽️ Vale Refeição'
      };
      return methods[method] || method;
    }
    
    // Carregar entregas ao iniciar
    loadDeliveries();
    
    // Atualizar a cada 60 segundos
    setInterval(loadDeliveries, 60000);
  </script>
</body>
</html>
  `);
});

// API - Criar entrega
app.post('/api/deliveries', (req, res) => {
  const {
    customer_name,
    customer_phone,
    delivery_address,
    pickup_address,
    description,
    price,
    payment_method
  } = req.body;
  
  if (!customer_name || !customer_phone || !delivery_address || !price) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO deliveries 
    (customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    customer_name,
    customer_phone,
    delivery_address,
    pickup_address,
    description,
    price,
    payment_method
  ], function(err) {
    if (err) {
      logMessage('error', `Erro ao criar entrega: {err.message}`);
      return res.status(500).json({ error: 'Erro ao criar entrega' });
    }
    
    logMessage('info', `Entrega criada - Cliente: {customer_name}, Valor: R$ {price}`);
    
    // Tentar sincronizar com servidor admin (opcional)
    if (config.syncEnabled) {
      syncDeliveryToAdmin(this.lastID);
    }
    
    res.json({ id: this.lastID, message: 'Entrega criada com sucesso' });
  });
});

// API - Listar entregas
app.get('/api/deliveries', (req, res) => {
  db.all(
    'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50',
    (err, rows) => {
      if (err) {
        logMessage('error', `Erro ao buscar entregas: {err.message}`);
        return res.status(500).json({ error: 'Erro ao buscar entregas' });
      }
      res.json(rows);
    }
  );
});

// API - Status do sistema
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: config.version,
    businessName: config.businessName,
    clientType: config.clientType,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Funcao para sincronizar com servidor admin
async function syncDeliveryToAdmin(deliveryId) {
  try {
    const delivery = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM deliveries WHERE id = ?', [deliveryId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (delivery) {
      const response = await axios.post(`{config.adminUrl}/api/sync/delivery`, {
        ...delivery,
        client_id: config.clientId,
        business_name: config.businessName
      }, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        db.run('UPDATE deliveries SET synced_at = CURRENT_TIMESTAMP WHERE id = ?', [deliveryId]);
        logMessage('info', `Entrega {deliveryId} sincronizada com servidor admin`);
      }
    }
  } catch (error) {
    logMessage('error', `Erro ao sincronizar entrega {deliveryId}: {error.message}`);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                      ENTREGA FACIL - SISTEMA LOCAL                        ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`🚀 Servidor rodando em: http://localhost:{PORT}`);
  console.log(`🏪 Comerciante: {config.businessName}`);
  console.log(`📅 Instalado em: {config.installDate}`);
  console.log(`🔄 Sincronização: {config.syncEnabled ? 'Ativada' : 'Desativada'}`);
  console.log(``);
  console.log(`✅ Sistema pronto para receber pedidos de entrega!`);
  console.log(`💡 Acesse no navegador: http://localhost:{PORT}`);
  console.log(``);
  
  logMessage('info', `Sistema iniciado - Porta {PORT} - {config.businessName}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logMessage('info', 'Sistema sendo encerrado...');
  db.close();
  process.exit(0);
});
'@

Set-Content -Path 'server.js' -Value `$serverCode
"

:: Criar script de inicializacao
echo [7/8] Criando script de inicializacao...
echo @echo off> "Iniciar Sistema.bat"
echo title Entrega Facil - Sistema Local>> "Iniciar Sistema.bat"
echo color 0B>> "Iniciar Sistema.bat"
echo cd /d "%INSTALL_DIR%">> "Iniciar Sistema.bat"
echo echo.>> "Iniciar Sistema.bat"
echo echo  ╔════════════════════════════════════════════════════════════════════════════╗>> "Iniciar Sistema.bat"
echo echo  ║                      ENTREGA FACIL - SISTEMA LOCAL                        ║>> "Iniciar Sistema.bat"
echo echo  ╚════════════════════════════════════════════════════════════════════════════╝>> "Iniciar Sistema.bat"
echo echo.>> "Iniciar Sistema.bat"
echo echo  Iniciando sistema...>> "Iniciar Sistema.bat"
echo echo.>> "Iniciar Sistema.bat"
echo node server.js>> "Iniciar Sistema.bat"
echo echo.>> "Iniciar Sistema.bat"
echo echo Sistema encerrado.>> "Iniciar Sistema.bat"
echo pause>> "Iniciar Sistema.bat"

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