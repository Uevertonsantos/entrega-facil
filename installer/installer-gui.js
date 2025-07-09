const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const os = require('os');

let mainWindow;
let installPath = path.join(os.homedir(), 'EntregaFacil');
let selectedPort = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Instalador Entrega Fácil',
    resizable: false,
    center: true
  });

  mainWindow.loadFile('installer-ui.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('check-requirements', async () => {
  return new Promise((resolve) => {
    // Verificar Node.js
    exec('node --version', (error, stdout, stderr) => {
      const nodeInstalled = !error;
      const nodeVersion = nodeInstalled ? stdout.trim() : null;
      
      // Verificar portas disponíveis
      const availablePorts = [];
      const testPorts = [3000, 3001, 3002, 8080, 8000, 5000, 4000, 9000];
      
      let checked = 0;
      testPorts.forEach(port => {
        const { spawn } = require('child_process');
        const netstat = spawn('netstat', ['-an']);
        
        netstat.stdout.on('data', (data) => {
          const output = data.toString();
          if (!output.includes(`:${port} `)) {
            availablePorts.push(port);
          }
        });
        
        netstat.on('close', () => {
          checked++;
          if (checked === testPorts.length) {
            resolve({
              nodeInstalled,
              nodeVersion,
              availablePorts: availablePorts.slice(0, 1), // Primeira porta disponível
              installPath
            });
          }
        });
      });
    });
  });
});

ipcMain.handle('select-install-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Selecionar pasta de instalação'
  });
  
  if (!result.canceled) {
    installPath = path.join(result.filePaths[0], 'EntregaFacil');
    return installPath;
  }
  return null;
});

ipcMain.handle('start-installation', async (event, config) => {
  const { businessName, businessAddress, businessPhone, businessEmail, selectedPort } = config;
  
  try {
    // Criar diretórios
    if (!fs.existsSync(installPath)) {
      fs.mkdirSync(installPath, { recursive: true });
    }
    
    ['data', 'logs', 'public'].forEach(dir => {
      const dirPath = path.join(installPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Criar package.json
    const packageJson = {
      name: 'entrega-facil-cliente',
      version: '1.0.0',
      description: 'Sistema de Entregas Local',
      main: 'server.js',
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        express: '^4.18.2',
        sqlite3: '^5.1.6',
        cors: '^2.8.5',
        helmet: '^7.0.0'
      }
    };
    
    fs.writeFileSync(
      path.join(installPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Criar config.json
    const configJson = {
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      localPort: selectedPort,
      version: '1.0.0',
      clientType: 'merchant',
      adminAccess: false,
      syncEnabled: true,
      installDate: new Date().toISOString(),
      features: {
        deliveryRequest: true,
        historyView: true,
        adminPanel: false
      }
    };
    
    fs.writeFileSync(
      path.join(installPath, 'config.json'),
      JSON.stringify(configJson, null, 2)
    );
    
    // Criar server.js
    const serverCode = createServerCode(configJson);
    fs.writeFileSync(path.join(installPath, 'server.js'), serverCode);
    
    // Instalar dependências
    await installDependencies();
    
    // Criar script de inicialização
    createStartScript();
    
    // Criar atalho na área de trabalho
    createDesktopShortcut();
    
    return { success: true, path: installPath, port: selectedPort };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-installation', async () => {
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server.js'], { 
      cwd: installPath,
      stdio: 'pipe'
    });
    
    let output = '';
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    setTimeout(() => {
      serverProcess.kill();
      const success = output.includes('Servidor rodando') || output.includes('listening');
      resolve({ success, output });
    }, 5000);
  });
});

ipcMain.handle('open-system', async () => {
  const startScript = path.join(installPath, 'Iniciar Sistema.bat');
  shell.openPath(startScript);
  
  setTimeout(() => {
    shell.openExternal(`http://localhost:${selectedPort}`);
  }, 3000);
});

function createServerCode(config) {
  return `const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = ${config.localPort};
const config = ${JSON.stringify(config, null, 2)};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Banco de dados SQLite
const db = new sqlite3.Database('./data/database.sqlite');

// Inicializar banco
db.serialize(() => {
  db.run(\`CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    delivery_fee REAL DEFAULT 7.00,
    payment_method TEXT DEFAULT 'dinheiro',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
  )\`);
});

// Logging
function logMessage(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = \`\${timestamp} [\${level}] \${message}\\n\`;
  
  fs.appendFileSync(\`./logs/\${level}.log\`, logEntry);
  console.log(logEntry.trim());
}

// Página principal
app.get('/', (req, res) => {
  res.send(\`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrega Fácil - \${config.businessName}</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      min-height: 100vh; 
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { 
      background: rgba(255,255,255,0.1); 
      backdrop-filter: blur(10px); 
      border-radius: 15px; 
      padding: 30px; 
      margin-bottom: 30px; 
      text-align: center; 
      color: white; 
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .card { 
      background: rgba(255,255,255,0.95); 
      border-radius: 15px; 
      padding: 25px; 
      margin: 20px 0; 
      box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
    }
    .form-group { margin: 15px 0; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
    .form-control { 
      width: 100%; 
      padding: 12px; 
      border: 2px solid #e1e1e1; 
      border-radius: 8px; 
      font-size: 16px; 
      transition: border-color 0.3s; 
    }
    .form-control:focus { outline: none; border-color: #667eea; }
    .btn { 
      padding: 15px 30px; 
      border: none; 
      border-radius: 25px; 
      cursor: pointer; 
      font-size: 16px; 
      font-weight: 600; 
      transition: all 0.3s; 
    }
    .btn-primary { 
      background: linear-gradient(135deg, #667eea, #764ba2); 
      color: white; 
    }
    .btn-primary:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
    }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
    .status { 
      padding: 15px; 
      border-radius: 10px; 
      text-align: center; 
      margin: 15px 0; 
    }
    .status-success { 
      background: linear-gradient(135deg, #d4edda, #c3e6cb); 
      color: #155724; 
    }
    .info-card { 
      background: linear-gradient(135deg, #e3f2fd, #bbdefb); 
      border-radius: 10px; 
      padding: 20px; 
      margin: 20px 0; 
    }
    .info-item { display: flex; align-items: center; margin: 10px 0; }
    .info-item i { margin-right: 10px; color: #667eea; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; }
    .table th { background: #f8f9fa; font-weight: 600; }
    .table tr:hover { background: #f8f9fa; }
    .badge { padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-success { background: #d4edda; color: #155724; }
    .empty-state { text-align: center; padding: 40px; color: #666; }
    .loading { display: none; text-align: center; padding: 20px; }
    .spinner { 
      display: inline-block; 
      width: 40px; 
      height: 40px; 
      border: 4px solid #f3f3f3; 
      border-top: 4px solid #667eea; 
      border-radius: 50%; 
      animation: spin 1s linear infinite; 
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><i class="fas fa-shipping-fast"></i> Entrega Fácil</h1>
      <p>\${config.businessName} - Sistema de Entregas Local</p>
    </div>
    
    <div class="status status-success">
      <i class="fas fa-check-circle"></i> Sistema Online - Pronto para receber pedidos
    </div>
    
    <div class="grid">
      <div class="card">
        <h2><i class="fas fa-plus-circle"></i> Nova Entrega</h2>
        <form id="deliveryForm">
          <div class="form-group">
            <label><i class="fas fa-user"></i> Nome do Cliente:</label>
            <input type="text" id="customerName" class="form-control" required placeholder="Ex: João Silva">
          </div>
          <div class="form-group">
            <label><i class="fas fa-phone"></i> Telefone:</label>
            <input type="tel" id="customerPhone" class="form-control" required placeholder="(11) 99999-9999">
          </div>
          <div class="form-group">
            <label><i class="fas fa-map-marker-alt"></i> Endereço de Entrega:</label>
            <input type="text" id="deliveryAddress" class="form-control" required placeholder="Rua, numero, bairro">
          </div>
          <div class="form-group">
            <label><i class="fas fa-store"></i> Endereço de Coleta:</label>
            <input type="text" id="pickupAddress" class="form-control" value="\${config.businessAddress}" required>
          </div>
          <div class="form-group">
            <label><i class="fas fa-clipboard-list"></i> Descrição:</label>
            <textarea id="description" class="form-control" rows="3" placeholder="Descreva os itens..."></textarea>
          </div>
          <div class="form-group">
            <label><i class="fas fa-dollar-sign"></i> Valor (R$):</label>
            <input type="number" id="price" class="form-control" step="0.01" required placeholder="0.00">
          </div>
          <div class="form-group">
            <label><i class="fas fa-credit-card"></i> Pagamento:</label>
            <select id="paymentMethod" class="form-control">
              <option value="dinheiro">💵 Dinheiro</option>
              <option value="pix">📱 PIX</option>
              <option value="cartao_credito">💳 Cartão de Crédito</option>
              <option value="cartao_debito">💳 Cartão de Débito</option>
              <option value="vale_refeicao">🍽️ Vale Refeição</option>
            </select>
          </div>
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Criando entrega...</p>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-shipping-fast"></i> Solicitar Entrega
          </button>
        </form>
      </div>
      
      <div>
        <div class="info-card">
          <h3><i class="fas fa-info-circle"></i> Informações</h3>
          <div class="info-item">
            <i class="fas fa-money-bill-wave"></i>
            <span><strong>Taxa:</strong> R$ 7,00</span>
          </div>
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <span><strong>Tempo:</strong> 30-45 min</span>
          </div>
          <div class="info-item">
            <i class="fas fa-business-time"></i>
            <span><strong>Horário:</strong> 8h às 18h</span>
          </div>
        </div>
        
        <div class="info-card">
          <h3><i class="fas fa-lightbulb"></i> Dicas</h3>
          <p>• Tenha o pedido pronto</p>
          <p>• Confirme o endereço</p>
          <p>• Mantenha telefone disponível</p>
          <p>• Pedidos por ordem de chegada</p>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2><i class="fas fa-history"></i> Entregas Recentes</h2>
      <div id="deliveriesTable">
        <div class="loading"><div class="spinner"></div>Carregando...</div>
      </div>
    </div>
  </div>
  
  <script>
    document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const loading = document.getElementById('loading');
      loading.style.display = 'block';
      
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
          alert('✅ Entrega solicitada com sucesso!');
          document.getElementById('deliveryForm').reset();
          document.getElementById('pickupAddress').value = '\${config.businessAddress}';
          loadDeliveries();
        } else {
          alert('❌ Erro ao solicitar entrega.');
        }
      } catch (error) {
        alert('❌ Erro de conexão.');
      }
      
      loading.style.display = 'none';
    });
    
    async function loadDeliveries() {
      try {
        const response = await fetch('/api/deliveries');
        const deliveries = await response.json();
        
        let html = '';
        if (deliveries.length === 0) {
          html = '<div class="empty-state"><p>Nenhuma entrega encontrada</p></div>';
        } else {
          html = '<table class="table"><thead><tr><th>Cliente</th><th>Endereço</th><th>Valor</th><th>Status</th><th>Data</th></tr></thead><tbody>';
          
          deliveries.forEach(delivery => {
            const date = new Date(delivery.created_at).toLocaleDateString('pt-BR');
            html += \`<tr>
              <td>\${delivery.customer_name}</td>
              <td>\${delivery.delivery_address}</td>
              <td>R$ \${delivery.price.toFixed(2)}</td>
              <td><span class="badge badge-warning">Pendente</span></td>
              <td>\${date}</td>
            </tr>\`;
          });
          
          html += '</tbody></table>';
        }
        
        document.getElementById('deliveriesTable').innerHTML = html;
      } catch (error) {
        document.getElementById('deliveriesTable').innerHTML = '<div class="empty-state"><p>Erro ao carregar entregas</p></div>';
      }
    }
    
    loadDeliveries();
    setInterval(loadDeliveries, 60000);
  </script>
</body>
</html>
  \`);
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
  
  const stmt = db.prepare(\`
    INSERT INTO deliveries 
    (customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  \`);
  
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
      logMessage('error', \`Erro ao criar entrega: \${err.message}\`);
      return res.status(500).json({ error: 'Erro ao criar entrega' });
    }
    
    logMessage('info', \`Entrega criada - Cliente: \${customer_name}, Valor: R$ \${price}\`);
    res.json({ id: this.lastID, message: 'Entrega criada com sucesso' });
  });
});

// API - Listar entregas
app.get('/api/deliveries', (req, res) => {
  db.all(
    'SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50',
    (err, rows) => {
      if (err) {
        logMessage('error', \`Erro ao buscar entregas: \${err.message}\`);
        return res.status(500).json({ error: 'Erro ao buscar entregas' });
      }
      res.json(rows);
    }
  );
});

// API - Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: config.version,
    businessName: config.businessName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(\`╔════════════════════════════════════════════════════════════════════════════╗\`);
  console.log(\`║                      ENTREGA FACIL - SISTEMA LOCAL                        ║\`);
  console.log(\`╚════════════════════════════════════════════════════════════════════════════╝\`);
  console.log(\`\`);
  console.log(\`🚀 Servidor rodando em: http://localhost:\${PORT}\`);
  console.log(\`🏪 Comerciante: \${config.businessName}\`);
  console.log(\`📅 Instalado em: \${config.installDate}\`);
  console.log(\`\`);
  console.log(\`✅ Sistema pronto para receber pedidos!\`);
  console.log(\`💡 Acesse: http://localhost:\${PORT}\`);
  console.log(\`\`);
  
  logMessage('info', \`Sistema iniciado - Porta \${PORT} - \${config.businessName}\`);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  logMessage('error', \`Erro não tratado: \${err.message}\`);
});

process.on('unhandledRejection', (err) => {
  logMessage('error', \`Promise rejeitada: \${err.message}\`);
});`;
}

async function installDependencies() {
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install'], { 
      cwd: installPath,
      stdio: 'pipe'
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

function createStartScript() {
  const startScript = `@echo off
title Entrega Facil - Sistema Local
color 0B
cd /d "${installPath}"
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                    ENTREGA FACIL - SISTEMA LOCAL                          ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo Iniciando sistema...
echo.
node server.js
echo.
echo Sistema encerrado.
pause`;

  fs.writeFileSync(path.join(installPath, 'Iniciar Sistema.bat'), startScript);
}

function createDesktopShortcut() {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const shortcutPath = path.join(desktopPath, 'Entrega Facil.lnk');
  
  // Criar arquivo .bat para criar o atalho
  const createShortcutScript = `
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${shortcutPath}')
$Shortcut.TargetPath = '${path.join(installPath, 'Iniciar Sistema.bat')}'
$Shortcut.WorkingDirectory = '${installPath}'
$Shortcut.Description = 'Sistema de Entregas Local'
$Shortcut.Save()
"`;
  
  fs.writeFileSync(path.join(installPath, 'create-shortcut.bat'), createShortcutScript);
  
  // Executar o script
  exec(`"${path.join(installPath, 'create-shortcut.bat')}"`, (error) => {
    if (!error) {
      fs.unlinkSync(path.join(installPath, 'create-shortcut.bat'));
    }
  });
}