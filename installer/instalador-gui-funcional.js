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
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Instalador Entrega Fácil',
    resizable: false,
    center: true,
    show: false
  });

  mainWindow.loadFile('installer-ui-funcional.html');
  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
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

// Função para executar comandos
function execCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

// Função para encontrar porta livre
function findFreePort() {
  return new Promise((resolve) => {
    const testPorts = [3000, 3001, 3002, 8080, 8000, 5000, 4000, 9000];
    let availablePort = 3000;
    
    for (let port of testPorts) {
      try {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
          server.close(() => {
            availablePort = port;
            resolve(port);
          });
        });
        
        server.on('error', () => {
          // Porta ocupada, tenta próxima
        });
        
        break;
      } catch (e) {
        continue;
      }
    }
    
    resolve(availablePort);
  });
}

// IPC Handlers
ipcMain.handle('check-system', async () => {
  try {
    // Verificar Node.js
    const nodeVersion = await execCommand('node --version');
    const npmVersion = await execCommand('npm --version');
    
    // Encontrar porta livre
    const freePort = await findFreePort();
    
    return {
      success: true,
      nodeVersion: nodeVersion.trim(),
      npmVersion: npmVersion.trim(),
      freePort,
      installPath,
      isWindows: process.platform === 'win32'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Node.js não encontrado. Por favor, instale o Node.js primeiro.',
      installPath,
      isWindows: process.platform === 'win32'
    };
  }
});

ipcMain.handle('select-folder', async () => {
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

ipcMain.handle('install-system', async (event, config) => {
  try {
    const { businessName, businessPhone, businessAddress, businessEmail, port } = config;
    
    // Criar diretórios
    mainWindow.webContents.send('install-progress', 'Criando diretórios...');
    
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
    mainWindow.webContents.send('install-progress', 'Criando configuração do projeto...');
    
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
        cors: '^2.8.5'
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
      localPort: port,
      version: '1.0.0',
      installDate: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(installPath, 'config.json'),
      JSON.stringify(configJson, null, 2)
    );
    
    // Criar server.js
    mainWindow.webContents.send('install-progress', 'Criando servidor...');
    
    const serverCode = `const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = ${port};
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('./data/database.sqlite');

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )\`);
});

app.get('/', (req, res) => {
  res.send(\`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entrega Fácil - \${config.businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; }
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
    .header { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
    .card { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 25px; margin: 20px 0; }
    .form-group { margin: 15px 0; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
    .form-control { width: 100%; padding: 12px; border: 2px solid #e1e1e1; border-radius: 8px; font-size: 16px; }
    .btn { padding: 15px 30px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .btn:hover { transform: translateY(-2px); }
    .status { padding: 15px; border-radius: 10px; text-align: center; margin: 15px 0; background: #d4edda; color: #155724; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e1; }
    .table th { background: #f8f9fa; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Entrega Fácil</h1>
      <p>\${config.businessName}</p>
    </div>
    
    <div class="status">
      ✅ Sistema Online - Pronto para receber pedidos
    </div>
    
    <div class="grid">
      <div class="card">
        <h2>📝 Nova Entrega</h2>
        <form id="deliveryForm">
          <div class="form-group">
            <label>Nome do Cliente:</label>
            <input type="text" id="customerName" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Telefone:</label>
            <input type="tel" id="customerPhone" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Endereço de Entrega:</label>
            <input type="text" id="deliveryAddress" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Endereço de Coleta:</label>
            <input type="text" id="pickupAddress" class="form-control" value="\${config.businessAddress}" required>
          </div>
          <div class="form-group">
            <label>Descrição:</label>
            <textarea id="description" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Valor (R$):</label>
            <input type="number" id="price" class="form-control" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Pagamento:</label>
            <select id="paymentMethod" class="form-control">
              <option value="dinheiro">💵 Dinheiro</option>
              <option value="pix">📱 PIX</option>
              <option value="cartao">💳 Cartão</option>
            </select>
          </div>
          <button type="submit" class="btn">🚚 Solicitar Entrega</button>
        </form>
      </div>
      
      <div class="card">
        <h3>ℹ️ Informações</h3>
        <p><strong>Taxa:</strong> R$ 7,00</p>
        <p><strong>Tempo:</strong> 30-45 min</p>
        <p><strong>Horário:</strong> 8h às 18h</p>
        <br>
        <h3>💡 Dicas</h3>
        <p>• Tenha o pedido pronto</p>
        <p>• Confirme o endereço</p>
        <p>• Mantenha telefone disponível</p>
      </div>
    </div>
    
    <div class="card">
      <h2>📋 Entregas Recentes</h2>
      <div id="deliveriesTable">Carregando...</div>
    </div>
  </div>
  
  <script>
    document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
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
    });
    
    async function loadDeliveries() {
      try {
        const response = await fetch('/api/deliveries');
        const deliveries = await response.json();
        
        let html = '';
        if (deliveries.length === 0) {
          html = '<p>Nenhuma entrega encontrada</p>';
        } else {
          html = '<table class="table"><thead><tr><th>Cliente</th><th>Endereço</th><th>Valor</th><th>Status</th><th>Data</th></tr></thead><tbody>';
          
          deliveries.forEach(delivery => {
            const date = new Date(delivery.created_at).toLocaleDateString('pt-BR');
            html += \`<tr>
              <td>\${delivery.customer_name}</td>
              <td>\${delivery.delivery_address}</td>
              <td>R$ \${delivery.price.toFixed(2)}</td>
              <td>Pendente</td>
              <td>\${date}</td>
            </tr>\`;
          });
          
          html += '</tbody></table>';
        }
        
        document.getElementById('deliveriesTable').innerHTML = html;
      } catch (error) {
        document.getElementById('deliveriesTable').innerHTML = '<p>Erro ao carregar entregas</p>';
      }
    }
    
    loadDeliveries();
    setInterval(loadDeliveries, 60000);
  </script>
</body>
</html>
  \`);
});

app.post('/api/deliveries', (req, res) => {
  const { customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method } = req.body;
  
  if (!customer_name || !customer_phone || !delivery_address || !price) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }
  
  const stmt = db.prepare('INSERT INTO deliveries (customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  stmt.run([customer_name, customer_phone, delivery_address, pickup_address, description, price, payment_method], function(err) {
    if (err) {
      console.error('Erro ao criar entrega:', err);
      return res.status(500).json({ error: 'Erro ao criar entrega' });
    }
    
    console.log(\`Entrega criada - Cliente: \${customer_name}, Valor: R$ \${price}\`);
    res.json({ id: this.lastID, message: 'Entrega criada com sucesso' });
  });
});

app.get('/api/deliveries', (req, res) => {
  db.all('SELECT * FROM deliveries ORDER BY created_at DESC LIMIT 50', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar entregas:', err);
      return res.status(500).json({ error: 'Erro ao buscar entregas' });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Servidor rodando em: http://localhost:\${PORT}\`);
  console.log(\`🏪 Comerciante: \${config.businessName}\`);
  console.log(\`✅ Sistema pronto para receber pedidos!\`);
});

process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
});`;
    
    fs.writeFileSync(path.join(installPath, 'server.js'), serverCode);
    
    // Instalar dependências
    mainWindow.webContents.send('install-progress', 'Instalando dependências...');
    
    await execCommand('npm install', installPath);
    
    // Criar script de inicialização
    mainWindow.webContents.send('install-progress', 'Criando atalhos...');
    
    const startScript = `@echo off
title Entrega Facil - ${businessName}
color 0B
cd /d "${installPath}"
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                    ENTREGA FACIL - SISTEMA LOCAL                          ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo Negócio: ${businessName}
echo Porta: ${port}
echo.
echo Iniciando sistema...
node server.js
echo.
echo Sistema encerrado.
pause`;

    fs.writeFileSync(path.join(installPath, 'Iniciar Sistema.bat'), startScript);
    
    // Criar atalho na área de trabalho
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutScript = `
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${path.join(desktopPath, 'Entrega Facil.lnk')}')
$Shortcut.TargetPath = '${path.join(installPath, 'Iniciar Sistema.bat')}'
$Shortcut.WorkingDirectory = '${installPath}'
$Shortcut.Description = 'Sistema de Entregas Local'
$Shortcut.Save()
"`;
    
    fs.writeFileSync(path.join(installPath, 'create-shortcut.bat'), shortcutScript);
    await execCommand(`"${path.join(installPath, 'create-shortcut.bat')}"`, installPath);
    
    // Limpar arquivo temporário
    try {
      fs.unlinkSync(path.join(installPath, 'create-shortcut.bat'));
    } catch (e) {}
    
    mainWindow.webContents.send('install-progress', 'Instalação concluída!');
    
    return {
      success: true,
      installPath,
      port,
      businessName
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('test-system', async () => {
  try {
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
    
    return new Promise((resolve) => {
      setTimeout(() => {
        serverProcess.kill();
        const success = output.includes('Servidor rodando') || output.includes('listening');
        resolve({ success, output });
      }, 3000);
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-system', async () => {
  try {
    const startScript = path.join(installPath, 'Iniciar Sistema.bat');
    shell.openPath(startScript);
    
    setTimeout(() => {
      shell.openExternal(`http://localhost:${selectedPort}`);
    }, 2000);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('close-app', () => {
  app.quit();
});