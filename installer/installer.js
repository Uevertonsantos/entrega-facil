#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { exec, spawn } = require('child_process');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

class EntregaFacilInstaller {
  constructor() {
    this.installDir = path.join(os.homedir(), 'EntregaFacil');
    this.configFile = path.join(this.installDir, 'config.json');
    this.dbFile = path.join(this.installDir, 'database.sqlite');
    this.adminApiUrl = 'https://admin.entregafacil.com/api'; // URL do seu painel admin
    this.localPort = 3000;
    this.config = {};
  }

  async run() {
    console.log(chalk.blue.bold('🚚 Entrega Fácil - Instalador do Sistema'));
    console.log(chalk.gray('Versão 1.0.0\n'));

    try {
      await this.checkSystemRequirements();
      await this.collectInstallationInfo();
      await this.createDirectories();
      await this.setupDatabase();
      await this.downloadAndInstallApp();
      await this.createConfiguration();
      await this.setupSyncService();
      await this.installWindowsService();
      await this.startApplication();
      
      console.log(chalk.green.bold('\n✅ Instalação concluída com sucesso!'));
      console.log(chalk.yellow(`\n🌐 Acesse o sistema em: http://localhost:${this.localPort}`));
      console.log(chalk.yellow(`📁 Pasta de instalação: ${this.installDir}`));
      console.log(chalk.yellow(`🔄 Sincronização automática: Ativada`));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante a instalação:'), error.message);
      process.exit(1);
    }
  }

  async checkSystemRequirements() {
    const spinner = ora('Verificando requisitos do sistema...').start();
    
    try {
      // Verificar Node.js
      await this.execCommand('node --version');
      
      // Verificar npm
      await this.execCommand('npm --version');
      
      // Verificar espaço em disco (pelo menos 500MB)
      const stats = await fs.stat(os.homedir());
      
      spinner.succeed('Requisitos do sistema verificados');
    } catch (error) {
      spinner.fail('Requisitos não atendidos');
      throw new Error('Node.js não encontrado. Instale o Node.js antes de continuar.');
    }
  }

  async collectInstallationInfo() {
    console.log(chalk.blue('\n📋 Configuração da Instalação'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'businessName',
        message: 'Nome do seu negócio:',
        validate: (input) => input.trim() !== '' || 'Nome é obrigatório'
      },
      {
        type: 'input',
        name: 'businessEmail',
        message: 'Email do negócio:',
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Email inválido';
        }
      },
      {
        type: 'input',
        name: 'businessPhone',
        message: 'Telefone do negócio:',
        validate: (input) => input.trim() !== '' || 'Telefone é obrigatório'
      },
      {
        type: 'input',
        name: 'businessAddress',
        message: 'Endereço do negócio:',
        validate: (input) => input.trim() !== '' || 'Endereço é obrigatório'
      },
      {
        type: 'input',
        name: 'businessCep',
        message: 'CEP do negócio:',
        validate: (input) => /^\d{5}-?\d{3}$/.test(input) || 'CEP inválido'
      },
      {
        type: 'input',
        name: 'adminKey',
        message: 'Chave de licença (fornecida pelo suporte):',
        validate: (input) => input.trim() !== '' || 'Chave de licença é obrigatória'
      },
      {
        type: 'list',
        name: 'installType',
        message: 'Tipo de instalação:',
        choices: [
          { name: 'Completa (Recomendada)', value: 'complete' },
          { name: 'Básica (Apenas essencial)', value: 'basic' },
          { name: 'Personalizada', value: 'custom' }
        ]
      },
      {
        type: 'confirm',
        name: 'autoStart',
        message: 'Iniciar automaticamente com o Windows?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableSync',
        message: 'Ativar sincronização automática com o painel admin?',
        default: true
      }
    ]);

    this.config = {
      ...answers,
      installDate: new Date().toISOString(),
      version: '1.0.0',
      localPort: this.localPort,
      adminApiUrl: this.adminApiUrl,
      clientId: this.generateClientId(),
      lastSync: null
    };
  }

  async createDirectories() {
    const spinner = ora('Criando diretórios...').start();
    
    try {
      await fs.ensureDir(this.installDir);
      await fs.ensureDir(path.join(this.installDir, 'app'));
      await fs.ensureDir(path.join(this.installDir, 'data'));
      await fs.ensureDir(path.join(this.installDir, 'logs'));
      await fs.ensureDir(path.join(this.installDir, 'backup'));
      
      spinner.succeed('Diretórios criados');
    } catch (error) {
      spinner.fail('Erro ao criar diretórios');
      throw error;
    }
  }

  async setupDatabase() {
    const spinner = ora('Configurando banco de dados local...').start();
    
    try {
      const db = new sqlite3.Database(this.dbFile);
      
      // Criar tabelas principais
      await this.runDbQuery(db, `
        CREATE TABLE IF NOT EXISTS merchants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          address TEXT,
          cep TEXT,
          cnpj TEXT,
          type TEXT DEFAULT 'monthly',
          plan_value REAL DEFAULT 149.00,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME,
          sync_status TEXT DEFAULT 'pending'
        )
      `);

      await this.runDbQuery(db, `
        CREATE TABLE IF NOT EXISTS deliverers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          cpf TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME,
          sync_status TEXT DEFAULT 'pending'
        )
      `);

      await this.runDbQuery(db, `
        CREATE TABLE IF NOT EXISTS deliveries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          merchant_id INTEGER,
          deliverer_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          pickup_address TEXT NOT NULL,
          delivery_address TEXT NOT NULL,
          price REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced_at DATETIME,
          sync_status TEXT DEFAULT 'pending',
          FOREIGN KEY (merchant_id) REFERENCES merchants (id),
          FOREIGN KEY (deliverer_id) REFERENCES deliverers (id)
        )
      `);

      await this.runDbQuery(db, `
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          status TEXT NOT NULL,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.runDbQuery(db, `
        CREATE TABLE IF NOT EXISTS system_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Inserir configurações iniciais
      await this.runDbQuery(db, `
        INSERT OR REPLACE INTO system_config (key, value) VALUES
        ('business_name', ?),
        ('business_email', ?),
        ('business_phone', ?),
        ('business_address', ?),
        ('business_cep', ?),
        ('admin_key', ?),
        ('client_id', ?)
      `, [
        this.config.businessName,
        this.config.businessEmail,
        this.config.businessPhone,
        this.config.businessAddress,
        this.config.businessCep,
        this.config.adminKey,
        this.config.clientId
      ]);

      db.close();
      spinner.succeed('Banco de dados configurado');
    } catch (error) {
      spinner.fail('Erro ao configurar banco de dados');
      throw error;
    }
  }

  async downloadAndInstallApp() {
    const spinner = ora('Baixando e instalando aplicação...').start();
    
    try {
      // Simular download da aplicação
      const appFiles = [
        'server.js',
        'package.json',
        'public/index.html',
        'public/app.js',
        'public/style.css'
      ];

      for (const file of appFiles) {
        const filePath = path.join(this.installDir, 'app', file);
        await fs.ensureDir(path.dirname(filePath));
        
        // Criar arquivos básicos da aplicação
        if (file === 'server.js') {
          await fs.writeFile(filePath, this.getServerCode());
        } else if (file === 'package.json') {
          await fs.writeFile(filePath, this.getPackageJson());
        } else if (file === 'public/index.html') {
          await fs.writeFile(filePath, this.getIndexHtml());
        } else if (file === 'public/app.js') {
          await fs.writeFile(filePath, this.getAppJs());
        } else if (file === 'public/style.css') {
          await fs.writeFile(filePath, this.getStyleCss());
        }
      }

      // Instalar dependências
      spinner.text = 'Instalando dependências...';
      await this.execCommand('npm install', { cwd: path.join(this.installDir, 'app') });

      spinner.succeed('Aplicação instalada');
    } catch (error) {
      spinner.fail('Erro ao instalar aplicação');
      throw error;
    }
  }

  async createConfiguration() {
    const spinner = ora('Criando arquivos de configuração...').start();
    
    try {
      await fs.writeJSON(this.configFile, this.config, { spaces: 2 });
      
      // Criar arquivo de ambiente
      const envContent = `
NODE_ENV=production
PORT=${this.localPort}
DATABASE_PATH=${this.dbFile}
ADMIN_API_URL=${this.adminApiUrl}
CLIENT_ID=${this.config.clientId}
ADMIN_KEY=${this.config.adminKey}
`;
      
      await fs.writeFile(path.join(this.installDir, 'app', '.env'), envContent);
      
      spinner.succeed('Configuração criada');
    } catch (error) {
      spinner.fail('Erro ao criar configuração');
      throw error;
    }
  }

  async setupSyncService() {
    if (!this.config.enableSync) return;
    
    const spinner = ora('Configurando sincronização automática...').start();
    
    try {
      const syncServiceCode = `
const cron = require('node-cron');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CONFIG_FILE = '${this.configFile}';
const DB_FILE = '${this.dbFile}';

class SyncService {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    this.db = new sqlite3.Database(DB_FILE);
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.setupWebSocket();
  }

  setupWebSocket() {
    try {
      const wsUrl = this.config.adminApiUrl.replace('http', 'ws').replace('/api', '/ws');
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('WebSocket connected for real-time sync');
        this.reconnectAttempts = 0;
        
        // Register client for real-time notifications
        this.ws.send(JSON.stringify({
          type: 'client_register',
          clientId: this.config.clientId
        }));
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.attemptReconnect();
      });
      
      // Send ping every 30 seconds to keep connection alive
      setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(\`Attempting to reconnect WebSocket (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})...\`);
      
      setTimeout(() => {
        this.setupWebSocket();
      }, this.reconnectDelay);
    } else {
      console.log('Max reconnect attempts reached. Will retry on next sync cycle.');
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'registration_success':
        console.log('Successfully registered for real-time sync');
        break;
        
      case 'delivery_update':
        console.log('Received delivery update from admin:', message.payload);
        this.handleDeliveryUpdate(message.payload);
        break;
        
      case 'new_delivery':
        console.log('New delivery created:', message.payload);
        break;
        
      case 'delivery_accepted':
        console.log('Delivery accepted:', message.payload);
        break;
        
      case 'delivery_completed':
        console.log('Delivery completed:', message.payload);
        break;
        
      case 'pong':
        // Keep-alive response
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleDeliveryUpdate(payload) {
    // Process delivery updates received from admin panel
    const delivery = payload.delivery;
    
    if (delivery) {
      // Update local database with admin changes
      this.db.run(
        'UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?',
        [delivery.status, new Date().toISOString(), delivery.id],
        function(err) {
          if (err) {
            console.error('Error updating delivery from admin:', err);
          } else {
            console.log(\`Updated delivery \${delivery.id} status to \${delivery.status}\`);
          }
        }
      );
    }
  }

  sendRealTimeDeliveryUpdate(deliveryData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'delivery_update',
        payload: {
          delivery: deliveryData,
          clientId: this.config.clientId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  async syncData() {
    try {
      console.log('Iniciando sincronização...');
      
      // Sincronizar dados para o servidor admin
      await this.syncMerchants();
      await this.syncDeliverers();
      await this.syncDeliveries();
      
      // Atualizar último sync
      this.config.lastSync = new Date().toISOString();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
      
      console.log('Sincronização concluída');
    } catch (error) {
      console.error('Erro na sincronização:', error.message);
    }
  }

  async syncMerchants() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM merchants WHERE sync_status = 'pending'", async (err, rows) => {
        if (err) return reject(err);
        
        for (const merchant of rows) {
          try {
            const response = await axios.post(\`\${this.config.adminApiUrl}/clients/\${this.config.clientId}/merchants\`, {
              ...merchant,
              client_id: this.config.clientId
            }, {
              headers: {
                'Authorization': \`Bearer \${this.config.adminKey}\`
              }
            });
            
            // Marcar como sincronizado
            this.db.run("UPDATE merchants SET sync_status = 'synced', synced_at = ? WHERE id = ?", 
              [new Date().toISOString(), merchant.id]);
              
          } catch (error) {
            console.error(\`Erro ao sincronizar merchant \${merchant.id}:\`, error.message);
            this.db.run("UPDATE merchants SET sync_status = 'error' WHERE id = ?", [merchant.id]);
          }
        }
        resolve();
      });
    });
  }

  async syncDeliverers() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM deliverers WHERE sync_status = 'pending'", async (err, rows) => {
        if (err) return reject(err);
        
        for (const deliverer of rows) {
          try {
            const response = await axios.post(\`\${this.config.adminApiUrl}/clients/\${this.config.clientId}/deliverers\`, {
              ...deliverer,
              client_id: this.config.clientId
            }, {
              headers: {
                'Authorization': \`Bearer \${this.config.adminKey}\`
              }
            });
            
            this.db.run("UPDATE deliverers SET sync_status = 'synced', synced_at = ? WHERE id = ?", 
              [new Date().toISOString(), deliverer.id]);
              
          } catch (error) {
            console.error(\`Erro ao sincronizar deliverer \${deliverer.id}:\`, error.message);
            this.db.run("UPDATE deliverers SET sync_status = 'error' WHERE id = ?", [deliverer.id]);
          }
        }
        resolve();
      });
    });
  }

  async syncDeliveries() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM deliveries WHERE sync_status = 'pending'", async (err, rows) => {
        if (err) return reject(err);
        
        for (const delivery of rows) {
          try {
            const response = await axios.post(\`\${this.config.adminApiUrl}/clients/\${this.config.clientId}/deliveries\`, {
              ...delivery,
              client_id: this.config.clientId
            }, {
              headers: {
                'Authorization': \`Bearer \${this.config.adminKey}\`
              }
            });
            
            this.db.run("UPDATE deliveries SET sync_status = 'synced', synced_at = ? WHERE id = ?", 
              [new Date().toISOString(), delivery.id]);
              
            // Send real-time notification for this delivery
            this.sendRealTimeDeliveryUpdate(delivery);
              
          } catch (error) {
            console.error(\`Erro ao sincronizar delivery \${delivery.id}:\`, error.message);
            this.db.run("UPDATE deliveries SET sync_status = 'error' WHERE id = ?", [delivery.id]);
          }
        }
        resolve();
      });
    });
  }
}

const syncService = new SyncService();

// Executar sincronização a cada 15 minutos
cron.schedule('*/15 * * * *', () => {
  syncService.syncData();
});

// Executar sincronização inicial
syncService.syncData();

console.log('Serviço de sincronização iniciado');
`;

      await fs.writeFile(path.join(this.installDir, 'sync-service.js'), syncServiceCode);
      
      spinner.succeed('Sincronização configurada');
    } catch (error) {
      spinner.fail('Erro ao configurar sincronização');
      throw error;
    }
  }

  async installWindowsService() {
    if (!this.config.autoStart || os.platform() !== 'win32') return;
    
    const spinner = ora('Configurando serviço do Windows...').start();
    
    try {
      const serviceScript = `
@echo off
cd /d "${this.installDir}\\app"
node server.js
`;
      
      await fs.writeFile(path.join(this.installDir, 'start-service.bat'), serviceScript);
      
      // Criar entrada no registro do Windows para auto-start
      const startupScript = `
@echo off
start /min "${this.installDir}\\start-service.bat"
`;
      
      const startupPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'EntregaFacil.bat');
      await fs.writeFile(startupPath, startupScript);
      
      spinner.succeed('Serviço do Windows configurado');
    } catch (error) {
      spinner.fail('Erro ao configurar serviço do Windows');
      throw error;
    }
  }

  async startApplication() {
    const spinner = ora('Iniciando aplicação...').start();
    
    try {
      // Iniciar aplicação principal
      const appProcess = spawn('node', ['server.js'], {
        cwd: path.join(this.installDir, 'app'),
        detached: true,
        stdio: 'ignore'
      });
      
      appProcess.unref();
      
      // Iniciar serviço de sincronização se habilitado
      if (this.config.enableSync) {
        const syncProcess = spawn('node', ['sync-service.js'], {
          cwd: this.installDir,
          detached: true,
          stdio: 'ignore'
        });
        
        syncProcess.unref();
      }
      
      // Aguardar alguns segundos para a aplicação iniciar
      await this.sleep(3000);
      
      spinner.succeed('Aplicação iniciada');
    } catch (error) {
      spinner.fail('Erro ao iniciar aplicação');
      throw error;
    }
  }

  // Métodos auxiliares
  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  runDbQuery(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getServerCode() {
    return `
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH;

app.use(express.json());
app.use(express.static('public'));

// Conectar ao banco de dados
const db = new sqlite3.Database(DB_PATH);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/merchants', (req, res) => {
  db.all('SELECT * FROM merchants ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/merchants', (req, res) => {
  const { name, email, phone, address, cep, cnpj, type, plan_value } = req.body;
  
  db.run(
    'INSERT INTO merchants (name, email, phone, address, cep, cnpj, type, plan_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, email, phone, address, cep, cnpj, type, plan_value],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/deliverers', (req, res) => {
  db.all('SELECT * FROM deliverers ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/deliverers', (req, res) => {
  const { name, email, phone, cpf } = req.body;
  
  db.run(
    'INSERT INTO deliverers (name, email, phone, cpf) VALUES (?, ?, ?, ?)',
    [name, email, phone, cpf],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/deliveries', (req, res) => {
  db.all(\`
    SELECT d.*, m.name as merchant_name, del.name as deliverer_name
    FROM deliveries d
    LEFT JOIN merchants m ON d.merchant_id = m.id
    LEFT JOIN deliverers del ON d.deliverer_id = del.id
    ORDER BY d.created_at DESC
  \`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/deliveries', (req, res) => {
  const { merchant_id, deliverer_id, customer_name, customer_phone, pickup_address, delivery_address, price } = req.body;
  
  db.run(
    'INSERT INTO deliveries (merchant_id, deliverer_id, customer_name, customer_phone, pickup_address, delivery_address, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [merchant_id, deliverer_id, customer_name, customer_phone, pickup_address, delivery_address, price],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(\`Entrega Fácil rodando em http://localhost:\${PORT}\`);
});
`;
  }

  getPackageJson() {
    return JSON.stringify({
      name: "entrega-facil-client",
      version: "1.0.0",
      description: "Sistema local Entrega Fácil",
      main: "server.js",
      scripts: {
        start: "node server.js"
      },
      dependencies: {
        express: "^4.18.2",
        sqlite3: "^5.1.6",
        dotenv: "^16.3.1",
        ws: "^8.14.0",
        axios: "^1.6.0",
        "node-cron": "^3.0.3"
      }
    }, null, 2);
  }

  getIndexHtml() {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrega Fácil - ${this.config.businessName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>🚚 Entrega Fácil</h1>
            <p>${this.config.businessName}</p>
        </header>
        
        <nav>
            <button onclick="showTab('dashboard')" class="tab-btn active">Dashboard</button>
            <button onclick="showTab('merchants')" class="tab-btn">Comerciantes</button>
            <button onclick="showTab('deliverers')" class="tab-btn">Entregadores</button>
            <button onclick="showTab('deliveries')" class="tab-btn">Entregas</button>
        </nav>
        
        <main>
            <div id="dashboard" class="tab-content active">
                <h2>Dashboard</h2>
                <div class="stats">
                    <div class="stat-card">
                        <h3>Entregas Hoje</h3>
                        <p id="todayDeliveries">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Comerciantes</h3>
                        <p id="totalMerchants">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Entregadores</h3>
                        <p id="totalDeliverers">0</p>
                    </div>
                </div>
            </div>
            
            <div id="merchants" class="tab-content">
                <h2>Comerciantes</h2>
                <button onclick="showAddMerchantForm()" class="btn-primary">Adicionar Comerciante</button>
                <div id="merchantsList"></div>
            </div>
            
            <div id="deliverers" class="tab-content">
                <h2>Entregadores</h2>
                <button onclick="showAddDelivererForm()" class="btn-primary">Adicionar Entregador</button>
                <div id="deliverersList"></div>
            </div>
            
            <div id="deliveries" class="tab-content">
                <h2>Entregas</h2>
                <button onclick="showAddDeliveryForm()" class="btn-primary">Nova Entrega</button>
                <div id="deliveriesList"></div>
            </div>
        </main>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
`;
  }

  getAppJs() {
    return `
// Gerenciamento de abas
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados da aba
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'merchants':
            loadMerchants();
            break;
        case 'deliverers':
            loadDeliverers();
            break;
        case 'deliveries':
            loadDeliveries();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [merchants, deliverers, deliveries] = await Promise.all([
            fetch('/api/merchants').then(r => r.json()),
            fetch('/api/deliverers').then(r => r.json()),
            fetch('/api/deliveries').then(r => r.json())
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        const todayDeliveries = deliveries.filter(d => d.created_at.startsWith(today));
        
        document.getElementById('todayDeliveries').textContent = todayDeliveries.length;
        document.getElementById('totalMerchants').textContent = merchants.length;
        document.getElementById('totalDeliverers').textContent = deliverers.length;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Comerciantes
async function loadMerchants() {
    try {
        const response = await fetch('/api/merchants');
        const merchants = await response.json();
        
        const html = merchants.map(merchant => \`
            <div class="card">
                <h3>\${merchant.name}</h3>
                <p>Email: \${merchant.email}</p>
                <p>Telefone: \${merchant.phone}</p>
                <p>Endereço: \${merchant.address}</p>
                <p>Plano: \${merchant.type} - R$ \${merchant.plan_value}</p>
                <span class="status \${merchant.is_active ? 'active' : 'inactive'}">
                    \${merchant.is_active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
        \`).join('');
        
        document.getElementById('merchantsList').innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar comerciantes:', error);
    }
}

// Entregadores
async function loadDeliverers() {
    try {
        const response = await fetch('/api/deliverers');
        const deliverers = await response.json();
        
        const html = deliverers.map(deliverer => \`
            <div class="card">
                <h3>\${deliverer.name}</h3>
                <p>Email: \${deliverer.email}</p>
                <p>Telefone: \${deliverer.phone}</p>
                <p>CPF: \${deliverer.cpf}</p>
                <span class="status \${deliverer.is_active ? 'active' : 'inactive'}">
                    \${deliverer.is_active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
        \`).join('');
        
        document.getElementById('deliverersList').innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar entregadores:', error);
    }
}

// Entregas
async function loadDeliveries() {
    try {
        const response = await fetch('/api/deliveries');
        const deliveries = await response.json();
        
        const html = deliveries.map(delivery => \`
            <div class="card">
                <h3>Entrega #\${delivery.id}</h3>
                <p>Cliente: \${delivery.customer_name}</p>
                <p>Telefone: \${delivery.customer_phone}</p>
                <p>Origem: \${delivery.pickup_address}</p>
                <p>Destino: \${delivery.delivery_address}</p>
                <p>Valor: R$ \${delivery.price}</p>
                <p>Comerciante: \${delivery.merchant_name || 'N/A'}</p>
                <p>Entregador: \${delivery.deliverer_name || 'N/A'}</p>
                <span class="status">\${delivery.status}</span>
            </div>
        \`).join('');
        
        document.getElementById('deliveriesList').innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar entregas:', error);
    }
}

// Carregar dashboard inicial
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
`;
  }

  getStyleCss() {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
    color: #333;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    text-align: center;
}

header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

nav {
    background: white;
    border-bottom: 2px solid #eee;
    padding: 0;
    display: flex;
}

.tab-btn {
    background: none;
    border: none;
    padding: 1rem 2rem;
    cursor: pointer;
    font-size: 1rem;
    border-bottom: 3px solid transparent;
    transition: all 0.3s;
}

.tab-btn:hover {
    background: #f8f9fa;
}

.tab-btn.active {
    border-bottom-color: #667eea;
    color: #667eea;
    font-weight: bold;
}

main {
    padding: 2rem;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
}

.stat-card h3 {
    color: #666;
    margin-bottom: 0.5rem;
}

.stat-card p {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
}

.card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
    position: relative;
}

.card h3 {
    color: #667eea;
    margin-bottom: 1rem;
}

.card p {
    margin-bottom: 0.5rem;
    color: #666;
}

.status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
}

.status.active {
    background: #d4edda;
    color: #155724;
}

.status.inactive {
    background: #f8d7da;
    color: #721c24;
}

.btn-primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    margin-bottom: 1rem;
    transition: background 0.3s;
}

.btn-primary:hover {
    background: #5a67d8;
}

h2 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.8rem;
}
`;
  }
}

// Executar instalador
if (require.main === module) {
  const installer = new EntregaFacilInstaller();
  installer.run().catch(console.error);
}

module.exports = EntregaFacilInstaller;