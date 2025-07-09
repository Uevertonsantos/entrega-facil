const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Configuração básica
const config = {
  name: "Entrega Fácil",
  version: "1.0.0",
  port: 3000,
  installDir: path.join(os.homedir(), 'EntregaFacil')
};

async function install() {
  console.log('🚚 Instalando Entrega Fácil...');
  console.log('================================');
  
  // Criar diretório de instalação
  if (!fs.existsSync(config.installDir)) {
    fs.mkdirSync(config.installDir, { recursive: true });
    console.log('✅ Diretório de instalação criado:', config.installDir);
  }
  
  // Criar arquivo de configuração
  const configPath = path.join(config.installDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Arquivo de configuração criado');
  
  // Criar arquivo HTML básico
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrega Fácil - Instalação Concluída</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .success {
            color: #10b981;
            font-weight: bold;
        }
        .button {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        .button:hover {
            background: #5a67d8;
        }
        .info {
            background: #e1f5fe;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚚 Entrega Fácil</h1>
        <p>Sistema de Gerenciamento de Entregas</p>
    </div>
    
    <div class="card">
        <h2 class="success">✅ Instalação Concluída!</h2>
        <p>O sistema Entrega Fácil foi instalado com sucesso em seu computador.</p>
        
        <div class="info">
            <strong>Informações da Instalação:</strong><br>
            • Versão: ${config.version}<br>
            • Diretório: ${config.installDir}<br>
            • Porta: ${config.port}<br>
            • Status: Sistema Local Instalado
        </div>
        
        <h3>Próximos Passos:</h3>
        <ol>
            <li>Configure seu negócio no painel administrativo</li>
            <li>Cadastre comerciantes e entregadores</li>
            <li>Comece a gerenciar suas entregas</li>
        </ol>
        
        <div style="margin-top: 20px;">
            <a href="http://localhost:${config.port}" class="button">🏠 Acessar Sistema</a>
            <a href="http://localhost:${config.port}/admin" class="button">⚙️ Painel Admin</a>
        </div>
    </div>
    
    <div class="card">
        <h3>Suporte</h3>
        <p>Precisa de ajuda? Entre em contato:</p>
        <p>📧 Email: suporte@entregafacil.com<br>
        📞 Telefone: (11) 9999-9999<br>
        🌐 Site: https://entregafacil.com</p>
    </div>
</body>
</html>
`;
  
  const htmlPath = path.join(config.installDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('✅ Página de instalação criada');
  
  console.log('\n🎉 Instalação concluída!');
  console.log('================================');
  console.log('Sistema instalado em:', config.installDir);
  console.log('Acesse:', `http://localhost:${config.port}`);
  console.log('\nPara iniciar o sistema, execute:');
  console.log('node ' + path.join(config.installDir, 'server.js'));
  
  // Tentar abrir o navegador
  try {
    const url = `file://${htmlPath}`;
    const start = (process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open');
    spawn(start, [url], { stdio: 'ignore', detached: true });
    console.log('\n✅ Abrindo página de instalação no navegador...');
  } catch (error) {
    console.log('\n📝 Abra manualmente:', htmlPath);
  }
}

// Executar instalação
install().catch(console.error);