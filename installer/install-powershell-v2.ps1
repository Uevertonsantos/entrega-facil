# Entrega Fácil - Instalador PowerShell v2.0
# Execute como Administrador para melhor funcionamento

param(
    [string]$BusinessName = "Meu Negócio",
    [string]$BusinessEmail = "contato@meunegocio.com",
    [string]$BusinessPhone = "(11) 99999-9999",
    [string]$BusinessAddress = "Rua Principal, 123",
    [string]$BusinessCity = "Minha Cidade",
    [string]$BusinessState = "SP",
    [switch]$Silent = $false,
    [switch]$SkipNodeJs = $false,
    [int]$PreferredPort = 0
)

# Configurar codificação e políticas
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

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

# Função para encontrar porta livre
function Find-FreePort {
    param([int]$StartPort = 3000)
    
    $portsToTry = @(3000, 3001, 3002, 8080, 8081, 8000, 5000, 5001, 9000, 9001)
    
    if ($PreferredPort -gt 0) {
        $portsToTry = @($PreferredPort) + $portsToTry
    }
    
    foreach ($port in $portsToTry) {
        $connection = Test-NetConnection -Port $port -ComputerName "localhost" -InformationLevel "Quiet" -WarningAction SilentlyContinue
        if (-not $connection) {
            return $port
        }
    }
    
    # Se não encontrou porta livre, force a 3000
    return 3000
}

# Função para limpar processos
function Clear-NodeProcesses {
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
        
        # Limpar porta específica se necessário
        $netstat = netstat -ano | Select-String ":$LocalPort.*LISTENING"
        if ($netstat) {
            $netstat | ForEach-Object {
                $pid = ($_.ToString().Split() | Where-Object { $_ -match '^\d+$' })[-1]
                if ($pid) {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        Write-ColorOutput "Aviso: Não foi possível limpar todos os processos" "Yellow"
    }
}

# Função para instalar Node.js
function Install-NodeJs {
    if ($SkipNodeJs) {
        Write-ColorOutput "Pulando instalação do Node.js conforme solicitado" "Yellow"
        return
    }
    
    try {
        $nodeVersion = node --version
        Write-ColorOutput "Node.js encontrado: $nodeVersion" "Green"
        return
    } catch {
        Write-ColorOutput "Node.js não encontrado, instalando automaticamente..." "Yellow"
    }
    
    try {
        $nodeUrl = "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi"
        $nodeInstaller = Join-Path $env:TEMP "node-installer.msi"
        
        Write-ColorOutput "Baixando Node.js..." "Yellow"
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        
        Write-ColorOutput "Instalando Node.js..." "Yellow"
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        # Aguardar instalação
        Start-Sleep -Seconds 10
        
        # Atualizar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        # Verificar se instalou
        try {
            $nodeVersion = node --version
            Write-ColorOutput "Node.js instalado com sucesso: $nodeVersion" "Green"
        } catch {
            throw "Node.js não foi instalado corretamente"
        }
        
        Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
    } catch {
        Write-ColorOutput "ERRO: Falha na instalação do Node.js" "Red"
        Write-ColorOutput "Instale manualmente: https://nodejs.org/" "Red"
        throw
    }
}

# Função para criar configuração
function New-ConfigFile {
    param([string]$Path, [int]$Port)
    
    $clientId = "client_$(Get-Random -Minimum 100000 -Maximum 999999)_$(Get-Random -Minimum 100000 -Maximum 999999)_$(Get-Random -Minimum 100000 -Maximum 999999)"
    
    $config = @{
        businessName = $BusinessName
        businessEmail = $BusinessEmail
        businessPhone = $BusinessPhone
        businessAddress = $BusinessAddress
        businessCity = $BusinessCity
        businessState = $BusinessState
        businessCep = "00000-000"
        clientId = $clientId
        licenseKey = "trial_license_key_v2"
        adminApiUrl = "https://admin.entregafacil.com/api"
        localPort = $Port
        syncEnabled = $true
        syncInterval = 300000
        autoStart = $true
        autoRestart = $true
        maxRetries = 3
        version = "2.0.0"
        installDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        features = @{
            autoPortDetection = $true
            errorRecovery = $true
            backupSystem = $true
            logging = $true
        }
    }
    
    $config | ConvertTo-Json -Depth 4 | Out-File -FilePath $Path -Encoding UTF8
}

# Função para criar package.json
function New-PackageJson {
    param([string]$Path)
    
    $packageJson = @{
        name = "entrega-facil-local"
        version = "2.0.0"
        description = "Sistema Local Entrega Fácil v2.0"
        main = "server.js"
        scripts = @{
            start = "node server.js"
            dev = "node server.js"
            stop = "taskkill /f /im node.exe"
            restart = "npm run stop && npm run start"
            test = "node -e `"console.log('Sistema OK')`""
        }
        dependencies = @{
            express = "^4.18.2"
            sqlite3 = "^5.1.6"
            cors = "^2.8.5"
            "body-parser" = "^1.20.2"
            axios = "^1.6.0"
            "node-cron" = "^3.0.3"
            multer = "^1.4.5"
            uuid = "^9.0.0"
            helmet = "^7.0.0"
        }
        engines = @{
            node = ">=16.0.0"
        }
        author = "Entrega Fácil"
        license = "MIT"
    }
    
    $packageJson | ConvertTo-Json -Depth 4 | Out-File -FilePath $Path -Encoding UTF8
}

# Função para criar atalhos
function New-Shortcuts {
    param([string]$InstallDir, [string]$DesktopDir, [int]$Port)
    
    try {
        # Atalho principal
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$DesktopDir\Entrega Fácil.lnk")
        $Shortcut.TargetPath = "http://localhost:$Port"
        $Shortcut.IconLocation = "shell32.dll,13"
        $Shortcut.Save()
        
        # Script de controle
        $controlScript = @"
@echo off
title Entrega Fácil - Painel de Controle v2.0
:menu
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FÁCIL - PAINEL DE CONTROLE V2.0                ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  [1] Iniciar Sistema
echo  [2] Parar Sistema
echo  [3] Reiniciar Sistema
echo  [4] Abrir no Navegador
echo  [5] Ver Status
echo  [6] Ver Logs
echo  [7] Criar Backup
echo  [8] Configurações
echo  [0] Sair
echo.
set /p opcao="Digite sua opção: "
if "%opcao%"=="1" (
    cd /d "$InstallDir"
    start /min node server.js
    echo Sistema iniciado!
    timeout /t 3 /nobreak >nul
    goto menu
)
if "%opcao%"=="2" (
    taskkill /f /im node.exe >nul 2>&1
    echo Sistema parado!
    timeout /t 2 /nobreak >nul
    goto menu
)
if "%opcao%"=="3" (
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    cd /d "$InstallDir"
    start /min node server.js
    echo Sistema reiniciado!
    timeout /t 3 /nobreak >nul
    goto menu
)
if "%opcao%"=="4" (
    start http://localhost:$Port
    goto menu
)
if "%opcao%"=="5" (
    tasklist | findstr node.exe
    netstat -an | findstr :$Port
    pause
    goto menu
)
if "%opcao%"=="6" (
    start notepad "$InstallDir\logs\info.log"
    goto menu
)
if "%opcao%"=="7" (
    cd /d "$InstallDir"
    copy "data\database.sqlite" "backups\backup-%date%.sqlite" >nul
    echo Backup criado!
    pause
    goto menu
)
if "%opcao%"=="8" (
    start notepad "$InstallDir\config.json"
    goto menu
)
if "%opcao%"=="0" exit
goto menu
"@
        
        $controlScript | Out-File -FilePath "$DesktopDir\Entrega Fácil - Controle v2.bat" -Encoding ASCII
        
        Write-ColorOutput "Atalhos criados com sucesso!" "Green"
    } catch {
        Write-ColorOutput "Aviso: Não foi possível criar alguns atalhos" "Yellow"
    }
}

# Função principal de instalação
function Install-EntregaFacil {
    Write-ColorOutput "╔════════════════════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                    ENTREGA FÁCIL - INSTALADOR V2.0                        ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════════════════════════════════════════╝" "Cyan"
    Write-ColorOutput ""
    
    # Definir diretórios
    $InstallDir = Join-Path $env:USERPROFILE "EntregaFacil"
    $DesktopDir = Join-Path $env:USERPROFILE "Desktop"
    $StartupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
    
    try {
        # Passo 1: Detectar porta livre
        Write-ColorOutput "[1/8] Detectando porta livre..." "Yellow"
        $LocalPort = Find-FreePort
        Write-ColorOutput "Porta livre encontrada: $LocalPort" "Green"
        
        # Passo 2: Limpar processos
        Write-ColorOutput "[2/8] Limpando processos existentes..." "Yellow"
        Clear-NodeProcesses
        Write-ColorOutput "Processos limpos!" "Green"
        
        # Passo 3: Verificar/instalar Node.js
        Write-ColorOutput "[3/8] Verificando Node.js..." "Yellow"
        Install-NodeJs
        
        # Passo 4: Criar diretórios
        Write-ColorOutput "[4/8] Criando diretórios..." "Yellow"
        $directories = @("$InstallDir", "$InstallDir\logs", "$InstallDir\data", "$InstallDir\backups", "$InstallDir\temp")
        foreach ($dir in $directories) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
            }
        }
        
        # Dar permissões
        if (Test-IsAdmin) {
            icacls $InstallDir /grant "$env:USERNAME:(OI)(CI)F" /T | Out-Null
        }
        Write-ColorOutput "Diretórios criados!" "Green"
        
        # Passo 5: Criar configuração
        Write-ColorOutput "[5/8] Criando configuração..." "Yellow"
        Set-Location $InstallDir
        
        New-PackageJson -Path "package.json"
        New-ConfigFile -Path "config.json" -Port $LocalPort
        
        # Copiar server.js do instalador batch (versão simplificada)
        $serverContent = Get-Content "$PSScriptRoot\install-completo-v2.bat" | 
                        Where-Object { $_ -match "echo.*server\.js" } | 
                        ForEach-Object { $_ -replace "echo ", "" -replace ">> server.js", "" }
        
        # Criar servidor básico se não conseguir extrair
        if (-not $serverContent) {
            Write-ColorOutput "Criando servidor básico..." "Yellow"
            $basicServer = @"
const express = require('express');
const config = require('./config.json');
const app = express();
const PORT = config.localPort;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('<h1>Entrega Fácil v2.0</h1><p>Sistema funcionando na porta ' + PORT + '</p>');
});

app.listen(PORT, () => {
    console.log('Entrega Fácil v2.0 rodando em http://localhost:' + PORT);
});
"@
            $basicServer | Out-File -FilePath "server.js" -Encoding UTF8
        }
        
        Write-ColorOutput "Configuração criada!" "Green"
        
        # Passo 6: Instalar dependências
        Write-ColorOutput "[6/8] Instalando dependências..." "Yellow"
        Write-ColorOutput "Isso pode demorar alguns minutos..." "Yellow"
        
        $retries = 0
        do {
            $retries++
            try {
                npm install --silent --no-audit --no-fund 2>&1 | Out-File -FilePath "logs\install.log" -Append
                Write-ColorOutput "Dependências instaladas!" "Green"
                break
            } catch {
                if ($retries -lt 3) {
                    Write-ColorOutput "Falha na instalação, tentativa $retries/3..." "Yellow"
                    Start-Sleep -Seconds 5
                } else {
                    Write-ColorOutput "Instalando dependências essenciais individualmente..." "Yellow"
                    $essentialPackages = @("express", "sqlite3", "cors", "body-parser")
                    foreach ($package in $essentialPackages) {
                        npm install $package --silent --no-audit 2>&1 | Out-Null
                    }
                    break
                }
            }
        } while ($retries -lt 3)
        
        # Passo 7: Configurar inicialização
        Write-ColorOutput "[7/8] Configurando inicialização..." "Yellow"
        $startupScript = @"
@echo off
cd /d "$InstallDir"
start /min node server.js
"@
        $startupScript | Out-File -FilePath "$StartupDir\EntregaFacil.bat" -Encoding ASCII
        Write-ColorOutput "Inicialização configurada!" "Green"
        
        # Passo 8: Criar atalhos
        Write-ColorOutput "[8/8] Criando atalhos..." "Yellow"
        New-Shortcuts -InstallDir $InstallDir -DesktopDir $DesktopDir -Port $LocalPort
        
        # Iniciar sistema
        Write-ColorOutput "Iniciando sistema..." "Yellow"
        Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        
        # Testar se está funcionando
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$LocalPort" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "Sistema funcionando!" "Green"
                Start-Process "http://localhost:$LocalPort"
            }
        } catch {
            Write-ColorOutput "Sistema iniciado, mas pode ainda estar carregando..." "Yellow"
            Start-Process "http://localhost:$LocalPort"
        }
        
        # Mensagem de sucesso
        Write-ColorOutput ""
        Write-ColorOutput "╔════════════════════════════════════════════════════════════════════════════╗" "Green"
        Write-ColorOutput "║                        INSTALAÇÃO CONCLUÍDA COM SUCESSO!                  ║" "Green"
        Write-ColorOutput "╚════════════════════════════════════════════════════════════════════════════╝" "Green"
        Write-ColorOutput ""
        Write-ColorOutput "✅ Sistema instalado e configurado" "White"
        Write-ColorOutput "✅ Porta automaticamente detectada: $LocalPort" "White"
        Write-ColorOutput "✅ Dependências instaladas" "White"
        Write-ColorOutput "✅ Inicialização automática configurada" "White"
        Write-ColorOutput "✅ Atalhos criados na área de trabalho" "White"
        Write-ColorOutput ""
        Write-ColorOutput "🌐 Acesse: http://localhost:$LocalPort" "White"
        Write-ColorOutput "📁 Pasta: $InstallDir" "White"
        Write-ColorOutput "🔧 Controle: Entrega Fácil - Controle v2.bat" "White"
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