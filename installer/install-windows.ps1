# Entrega Fácil - Instalador Automático para Windows
# Execute como Administrador para melhor funcionamento

param(
    [string]$BusinessName = "Meu Negócio",
    [string]$BusinessEmail = "contato@meunegocio.com",
    [string]$BusinessPhone = "(11) 99999-9999",
    [string]$BusinessAddress = "Rua Principal, 123",
    [string]$BusinessCity = "Minha Cidade",
    [string]$BusinessState = "SP",
    [int]$LocalPort = 3000,
    [switch]$Silent = $false
)

# Configurar codificação para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Função para escrever mensagens coloridas
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewLine
    )
    
    $oldColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    if ($NoNewLine) {
        Write-Host $Message -NoNewline
    } else {
        Write-Host $Message
    }
    $Host.UI.RawUI.ForegroundColor = $oldColor
}

# Função para verificar se está rodando como administrador
function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Função para criar arquivos de configuração
function New-ConfigFile {
    param([string]$Path)
    
    $config = @{
        businessName = $BusinessName
        businessEmail = $BusinessEmail
        businessPhone = $BusinessPhone
        businessAddress = $BusinessAddress
        businessCity = $BusinessCity
        businessState = $BusinessState
        clientId = "client_$(Get-Random -Minimum 100000 -Maximum 999999)_$(Get-Random -Minimum 100000 -Maximum 999999)"
        licenseKey = "trial_license_key"
        adminApiUrl = "https://admin.entregafacil.com/api"
        localPort = $LocalPort
        syncEnabled = $true
        syncInterval = 300000
        autoStart = $true
        installDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $config | ConvertTo-Json -Depth 4 | Out-File -FilePath $Path -Encoding UTF8
}

# Função para criar servidor Node.js
function New-ServerFile {
    param([string]$Path)
    
    $serverCode = @"
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Ler configuração
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const app = express();
const PORT = config.localPort;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar banco de dados
const db = new sqlite3.Database('./database.sqlite');

// Criar tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS merchants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS deliverers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        vehicle_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS deliveries (
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
        synced_at DATETIME
    )`);
});

// Rotas da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        config: config,
        uptime: process.uptime()
    });
});

app.get('/api/merchants', (req, res) => {
    db.all('SELECT * FROM merchants ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/deliverers', (req, res) => {
    db.all('SELECT * FROM deliverers ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/deliveries', (req, res) => {
    db.all('SELECT * FROM deliveries ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Servir página principal
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Entrega Fácil - `+config.businessName+`</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .online { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .nav { margin: 20px 0; }
        .nav a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .nav a:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚚 Entrega Fácil</h1>
        <div class="status online">✅ Sistema Online</div>
        <div class="info">
            <strong>Negócio:</strong> `+config.businessName+`<br>
            <strong>Email:</strong> `+config.businessEmail+`<br>
            <strong>Telefone:</strong> `+config.businessPhone+`<br>
            <strong>Endereço:</strong> `+config.businessAddress+`<br>
            <strong>Cliente ID:</strong> `+config.clientId+`
        </div>
        <div class="info">
            <strong>Porta:</strong> `+PORT+`<br>
            <strong>Sincronização:</strong> `+(config.syncEnabled ? 'Ativada' : 'Desativada')+`<br>
            <strong>Instalado em:</strong> `+config.installDate+`
        </div>
        <div class="nav">
            <a href="/api/merchants">Ver Comerciantes</a>
            <a href="/api/deliverers">Ver Entregadores</a>
            <a href="/api/deliveries">Ver Entregas</a>
            <a href="/api/status">Status do Sistema</a>
        </div>
    </div>
</body>
</html>`);
});

// Sincronização automática
if (config.syncEnabled) {
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('Sincronizando dados...');
            
            // Sincronizar com servidor central
            const response = await axios.post(`+config.adminApiUrl+`/sync`, {
                clientId: config.clientId,
                businessName: config.businessName,
                data: {
                    merchants: await new Promise(resolve => db.all('SELECT * FROM merchants WHERE synced_at IS NULL', (err, rows) => resolve(rows || []))),
                    deliverers: await new Promise(resolve => db.all('SELECT * FROM deliverers WHERE synced_at IS NULL', (err, rows) => resolve(rows || []))),
                    deliveries: await new Promise(resolve => db.all('SELECT * FROM deliveries WHERE synced_at IS NULL', (err, rows) => resolve(rows || [])))
                }
            });
            
            console.log('Sincronização concluída!');
        } catch (error) {
            console.error('Erro na sincronização:', error.message);
        }
    });
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Entrega Fácil rodando em http://localhost:`+PORT+``);
    console.log(`Negócio: `+config.businessName+``);
    console.log(`Cliente ID: `+config.clientId+``);
});
"@
    
    $serverCode | Out-File -FilePath $Path -Encoding UTF8
}

# Função para criar package.json
function New-PackageJson {
    param([string]$Path)
    
    $packageJson = @{
        name = "entrega-facil-local"
        version = "1.0.0"
        description = "Sistema Local Entrega Fácil"
        main = "server.js"
        scripts = @{
            start = "node server.js"
            "install-service" = "node install-service.js"
        }
        dependencies = @{
            express = "^4.18.2"
            sqlite3 = "^5.1.6"
            cors = "^2.8.5"
            "body-parser" = "^1.20.2"
            axios = "^1.6.0"
            "node-cron" = "^3.0.3"
            "node-windows" = "^1.0.0-beta.8"
        }
    }
    
    $packageJson | ConvertTo-Json -Depth 4 | Out-File -FilePath $Path -Encoding UTF8
}

# Função para criar serviço do Windows
function New-ServiceInstaller {
    param([string]$Path)
    
    $serviceCode = @"
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'EntregaFacilService',
    description: 'Serviço do Sistema Entrega Fácil',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ]
});

svc.on('install', () => {
    console.log('Serviço instalado com sucesso!');
    svc.start();
});

svc.on('start', () => {
    console.log('Serviço iniciado com sucesso!');
    process.exit(0);
});

svc.install();
"@
    
    $serviceCode | Out-File -FilePath $Path -Encoding UTF8
}

# Função principal
function Install-EntregaFacil {
    Write-ColorOutput "===========================================" "Cyan"
    Write-ColorOutput "    ENTREGA FÁCIL - INSTALADOR AUTOMÁTICO" "Cyan"
    Write-ColorOutput "===========================================" "Cyan"
    Write-ColorOutput ""
    
    # Definir diretórios
    $InstallDir = Join-Path $env:USERPROFILE "EntregaFacil"
    $DesktopDir = Join-Path $env:USERPROFILE "Desktop"
    
    try {
        # Verificar Node.js
        Write-ColorOutput "[1/8] Verificando Node.js..." "Yellow"
        try {
            $nodeVersion = node --version
            Write-ColorOutput "Node.js encontrado: $nodeVersion" "Green"
        } catch {
            Write-ColorOutput "ERRO: Node.js não encontrado!" "Red"
            Write-ColorOutput "Instalando Node.js automaticamente..." "Yellow"
            
            # Baixar e instalar Node.js automaticamente
            $nodeUrl = "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi"
            $nodeInstaller = Join-Path $env:TEMP "node-installer.msi"
            
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet" -Wait
            
            # Atualizar PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
            
            Remove-Item $nodeInstaller -Force
            Write-ColorOutput "Node.js instalado com sucesso!" "Green"
        }
        
        # Criar diretórios
        Write-ColorOutput "[2/8] Criando diretórios..." "Yellow"
        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
            New-Item -ItemType Directory -Path "$InstallDir\logs" -Force | Out-Null
        }
        Write-ColorOutput "Diretórios criados!" "Green"
        
        # Criar arquivos de configuração
        Write-ColorOutput "[3/8] Criando arquivos de configuração..." "Yellow"
        Set-Location $InstallDir
        
        New-PackageJson -Path "package.json"
        New-ConfigFile -Path "config.json"
        New-ServerFile -Path "server.js"
        New-ServiceInstaller -Path "install-service.js"
        
        Write-ColorOutput "Arquivos criados!" "Green"
        
        # Instalar dependências
        Write-ColorOutput "[4/8] Instalando dependências..." "Yellow"
        $installProcess = Start-Process -FilePath "npm" -ArgumentList "install", "--silent" -Wait -PassThru
        if ($installProcess.ExitCode -eq 0) {
            Write-ColorOutput "Dependências instaladas!" "Green"
        } else {
            throw "Falha na instalação das dependências"
        }
        
        # Configurar serviço do Windows
        Write-ColorOutput "[5/8] Configurando serviço do Windows..." "Yellow"
        if (Test-IsAdmin) {
            Start-Process -FilePath "node" -ArgumentList "install-service.js" -Wait
            Write-ColorOutput "Serviço configurado!" "Green"
        } else {
            Write-ColorOutput "Pulando configuração do serviço (requer privilégios de administrador)" "Yellow"
        }
        
        # Criar atalho na área de trabalho
        Write-ColorOutput "[6/8] Criando atalho na área de trabalho..." "Yellow"
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$DesktopDir\Entrega Fácil.lnk")
        $Shortcut.TargetPath = "http://localhost:$LocalPort"
        $Shortcut.IconLocation = "shell32.dll,13"
        $Shortcut.Save()
        Write-ColorOutput "Atalho criado!" "Green"
        
        # Configurar inicialização automática
        Write-ColorOutput "[7/8] Configurando inicialização automática..." "Yellow"
        $StartupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
        $StartupScript = Join-Path $StartupDir "EntregaFacil.bat"
        
        "@echo off`ncd /d `"$InstallDir`"`nstart /min node server.js" | Out-File -FilePath $StartupScript -Encoding ASCII
        Write-ColorOutput "Inicialização automática configurada!" "Green"
        
        # Iniciar aplicação
        Write-ColorOutput "[8/8] Iniciando aplicação..." "Yellow"
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Start-Process "http://localhost:$LocalPort"
        Write-ColorOutput "Aplicação iniciada!" "Green"
        
        # Mensagem de sucesso
        Write-ColorOutput ""
        Write-ColorOutput "===========================================" "Green"
        Write-ColorOutput "    INSTALAÇÃO CONCLUÍDA COM SUCESSO!" "Green"
        Write-ColorOutput "===========================================" "Green"
        Write-ColorOutput ""
        Write-ColorOutput "🌐 Sistema: http://localhost:$LocalPort" "White"
        Write-ColorOutput "📁 Pasta: $InstallDir" "White"
        Write-ColorOutput "🚀 Atalho: Criado na área de trabalho" "White"
        Write-ColorOutput "🔄 Inicialização: Automática" "White"
        Write-ColorOutput ""
        Write-ColorOutput "O sistema já está rodando e será iniciado" "White"
        Write-ColorOutput "automaticamente sempre que o Windows iniciar." "White"
        Write-ColorOutput ""
        
    } catch {
        Write-ColorOutput "ERRO: $_" "Red"
        Write-ColorOutput "Instalação interrompida." "Red"
        exit 1
    }
}

# Executar instalação
Install-EntregaFacil

if (-not $Silent) {
    Write-ColorOutput "Pressione qualquer tecla para continuar..." "Gray"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}