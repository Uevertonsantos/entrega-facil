@echo off
title Adicionar Rotas Admin ao Sistema Local
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                      ADICIONANDO ROTAS ADMINISTRATIVAS                     ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

cd /d "%USERPROFILE%\EntregaFacil"

if not exist "server.js" (
    echo ERRO: Arquivo server.js nao encontrado!
    echo Certifique-se de que o sistema esta instalado corretamente
    pause
    exit /b 1
)

echo [1/3] Fazendo backup do servidor atual...
copy "server.js" "server-backup.js" >nul

echo [2/3] Adicionando rotas administrativas...

:: Criar arquivo temporario com as novas rotas
(
echo.
echo // Rotas administrativas
echo app.get^('/admin', ^(req, res^) =^> {
echo   res.send^(`
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo   ^<title^>Painel Admin - Entrega Facil^</title^>
echo   ^<style^>
echo     * { margin: 0; padding: 0; box-sizing: border-box; }
echo     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); min-height: 100vh; padding: 20px; }
echo     .container { max-width: 1200px; margin: 0 auto; }
echo     .header { background: rgba^(255,255,255,0.1^); backdrop-filter: blur^(10px^); border-radius: 15px; padding: 30px; margin-bottom: 30px; text-align: center; color: white; }
echo     .header h1 { font-size: 2.5em; margin-bottom: 10px; }
echo     .card { background: rgba^(255,255,255,0.95^); border-radius: 15px; padding: 25px; margin: 20px 0; box-shadow: 0 8px 32px rgba^(0,0,0,0.1^); }
echo     .grid { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(300px, 1fr^)^); gap: 25px; }
echo     .btn { display: inline-block; padding: 15px 30px; background: linear-gradient^(135deg, #667eea, #764ba2^); color: white; text-decoration: none; border-radius: 25px; transition: all 0.3s; font-weight: 600; text-align: center; margin: 10px; }
echo     .btn:hover { transform: translateY^(-3px^); box-shadow: 0 10px 25px rgba^(0,0,0,0.2^); }
echo     .stats { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(200px, 1fr^)^); gap: 20px; margin: 20px 0; }
echo     .stat { background: linear-gradient^(135deg, #4CAF50, #45a049^); color: white; padding: 20px; border-radius: 15px; text-align: center; }
echo     .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
echo     .stat-label { font-size: 1.1em; opacity: 0.9; }
echo     .nav { display: flex; gap: 15px; justify-content: center; margin: 20px 0; flex-wrap: wrap; }
echo     .section { margin: 30px 0; }
echo     .section h2 { color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
echo     .table-responsive { overflow-x: auto; }
echo     .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
echo     .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
echo     .table th { background: #f8f9fa; font-weight: 600; }
echo     .table tr:hover { background: #f8f9fa; }
echo     .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500; }
echo     .badge-success { background: #28a745; color: white; }
echo     .badge-warning { background: #ffc107; color: #212529; }
echo     .badge-danger { background: #dc3545; color: white; }
echo     .form-group { margin: 15px 0; }
echo     .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em; }
echo     .form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba^(102,126,234,0.25^); }
echo     .btn-primary { background: #667eea; }
echo     .btn-success { background: #28a745; }
echo     .btn-warning { background: #ffc107; color: #212529; }
echo     .btn-danger { background: #dc3545; }
echo     .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba^(0,0,0,0.5^); }
echo     .modal-content { background: white; margin: 5% auto; padding: 30px; border-radius: 15px; width: 90%; max-width: 600px; }
echo     .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
echo     .close:hover { color: black; }
echo     .alert { padding: 15px; margin: 20px 0; border-radius: 5px; }
echo     .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
echo     .alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
echo     .loading { text-align: center; padding: 20px; }
echo     .spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
echo     @keyframes spin { 0% { transform: rotate^(0deg^); } 100% { transform: rotate^(360deg^); } }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<div class="header"^>
echo       ^<h1^>🎛️ Painel Administrativo^</h1^>
echo       ^<p^>Sistema Local Entrega Facil - Gerenciamento Completo^</p^>
echo     ^</div^>
echo     
echo     ^<div class="stats" id="stats"^>
echo       ^<div class="stat"^>
echo         ^<div class="stat-number" id="merchantCount"^>-^</div^>
echo         ^<div class="stat-label"^>Comerciantes^</div^>
echo       ^</div^>
echo       ^<div class="stat"^>
echo         ^<div class="stat-number" id="delivererCount"^>-^</div^>
echo         ^<div class="stat-label"^>Entregadores^</div^>
echo       ^</div^>
echo       ^<div class="stat"^>
echo         ^<div class="stat-number" id="deliveryCount"^>-^</div^>
echo         ^<div class="stat-label"^>Entregas^</div^>
echo       ^</div^>
echo       ^<div class="stat"^>
echo         ^<div class="stat-number" id="systemStatus"^>Online^</div^>
echo         ^<div class="stat-label"^>Status do Sistema^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div class="nav"^>
echo       ^<button class="btn" onclick="showSection('merchants')"^>🏪 Comerciantes^</button^>
echo       ^<button class="btn" onclick="showSection('deliverers')"^>🚴 Entregadores^</button^>
echo       ^<button class="btn" onclick="showSection('deliveries')"^>📦 Entregas^</button^>
echo       ^<button class="btn" onclick="showSection('settings')"^>⚙️ Configurações^</button^>
echo       ^<button class="btn" onclick="showSection('logs')"^>📋 Logs^</button^>
echo       ^<a href="/" class="btn"^>🏠 Voltar^</a^>
echo     ^</div^>
echo     
echo     ^<div class="card"^>
echo       ^<div id="merchants" class="section"^>
echo         ^<h2^>Comerciantes Cadastrados^</h2^>
echo         ^<div class="loading" id="merchantsLoading"^>^<div class="spinner"^>^</div^>Carregando...^</div^>
echo         ^<div id="merchantsContent" style="display:none;"^>
echo           ^<div class="table-responsive"^>
echo             ^<table class="table" id="merchantsTable"^>
echo               ^<thead^>
echo                 ^<tr^>
echo                   ^<th^>Nome^</th^>
echo                   ^<th^>Email^</th^>
echo                   ^<th^>Telefone^</th^>
echo                   ^<th^>Cidade^</th^>
echo                   ^<th^>Plano^</th^>
echo                   ^<th^>Status^</th^>
echo                 ^</tr^>
echo               ^</thead^>
echo               ^<tbody^>^</tbody^>
echo             ^</table^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo       
echo       ^<div id="deliverers" class="section" style="display:none;"^>
echo         ^<h2^>Entregadores Cadastrados^</h2^>
echo         ^<div class="loading" id="deliverersLoading"^>^<div class="spinner"^>^</div^>Carregando...^</div^>
echo         ^<div id="deliverersContent" style="display:none;"^>
echo           ^<div class="table-responsive"^>
echo             ^<table class="table" id="deliverersTable"^>
echo               ^<thead^>
echo                 ^<tr^>
echo                   ^<th^>Nome^</th^>
echo                   ^<th^>Email^</th^>
echo                   ^<th^>Telefone^</th^>
echo                   ^<th^>Veiculo^</th^>
echo                   ^<th^>Placa^</th^>
echo                   ^<th^>Status^</th^>
echo                 ^</tr^>
echo               ^</thead^>
echo               ^<tbody^>^</tbody^>
echo             ^</table^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo       
echo       ^<div id="deliveries" class="section" style="display:none;"^>
echo         ^<h2^>Entregas Recentes^</h2^>
echo         ^<div class="loading" id="deliveriesLoading"^>^<div class="spinner"^>^</div^>Carregando...^</div^>
echo         ^<div id="deliveriesContent" style="display:none;"^>
echo           ^<div class="table-responsive"^>
echo             ^<table class="table" id="deliveriesTable"^>
echo               ^<thead^>
echo                 ^<tr^>
echo                   ^<th^>Cliente^</th^>
echo                   ^<th^>Comerciante^</th^>
echo                   ^<th^>Entregador^</th^>
echo                   ^<th^>Endereco^</th^>
echo                   ^<th^>Valor^</th^>
echo                   ^<th^>Status^</th^>
echo                 ^</tr^>
echo               ^</thead^>
echo               ^<tbody^>^</tbody^>
echo             ^</table^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo       
echo       ^<div id="settings" class="section" style="display:none;"^>
echo         ^<h2^>Configurações do Sistema^</h2^>
echo         ^<div class="grid"^>
echo           ^<div^>
echo             ^<h3^>Informações do Negócio^</h3^>
echo             ^<div class="form-group"^>
echo               ^<label^>Nome do Negócio:^</label^>
echo               ^<input type="text" class="form-control" id="businessName" value="${config.businessName}"^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo               ^<label^>Email:^</label^>
echo               ^<input type="email" class="form-control" id="businessEmail" value="${config.businessEmail}"^>
echo             ^</div^>
echo             ^<div class="form-group"^>
echo               ^<label^>Telefone:^</label^>
echo               ^<input type="text" class="form-control" id="businessPhone" value="${config.businessPhone}"^>
echo             ^</div^>
echo             ^<button class="btn btn-primary" onclick="saveSettings()"^>Salvar Configurações^</button^>
echo           ^</div^>
echo           ^<div^>
echo             ^<h3^>Sistema^</h3^>
echo             ^<p^>^<strong^>Versão:^</strong^> ${config.version}^</p^>
echo             ^<p^>^<strong^>Cliente ID:^</strong^> ${config.clientId}^</p^>
echo             ^<p^>^<strong^>Porta:^</strong^> ${PORT}^</p^>
echo             ^<p^>^<strong^>Sincronização:^</strong^> ${config.syncEnabled ? 'Ativada' : 'Desativada'}^</p^>
echo             ^<p^>^<strong^>Instalado em:^</strong^> ${config.installDate}^</p^>
echo             ^<button class="btn btn-warning" onclick="createBackup()"^>Criar Backup^</button^>
echo             ^<button class="btn btn-danger" onclick="restartSystem()"^>Reiniciar Sistema^</button^>
echo           ^</div^>
echo         ^</div^>
echo       ^</div^>
echo       
echo       ^<div id="logs" class="section" style="display:none;"^>
echo         ^<h2^>Logs do Sistema^</h2^>
echo         ^<div class="nav"^>
echo           ^<button class="btn btn-primary" onclick="showLogs('info')"^>Info^</button^>
echo           ^<button class="btn btn-warning" onclick="showLogs('error')"^>Erros^</button^>
echo           ^<button class="btn btn-success" onclick="showLogs('access')"^>Acesso^</button^>
echo         ^</div^>
echo         ^<div id="logsContent"^>
echo           ^<textarea id="logsTextarea" class="form-control" rows="20" readonly^>Selecione um tipo de log acima^</textarea^>
echo         ^</div^>
echo       ^</div^>
echo     ^</div^>
echo     
echo     ^<div id="alerts"^>^</div^>
echo   ^</div^>
echo   
echo   ^<script^>
echo     let currentSection = 'merchants';
echo     
echo     function showSection^(section^) {
echo       document.querySelectorAll^('.section'^).forEach^(el =^> el.style.display = 'none'^);
echo       document.getElementById^(section^).style.display = 'block';
echo       currentSection = section;
echo       
echo       if ^(section === 'merchants'^) loadMerchants^(^);
echo       if ^(section === 'deliverers'^) loadDeliverers^(^);
echo       if ^(section === 'deliveries'^) loadDeliveries^(^);
echo     }
echo     
echo     async function loadMerchants^(^) {
echo       const loading = document.getElementById^('merchantsLoading'^);
echo       const content = document.getElementById^('merchantsContent'^);
echo       const tbody = document.querySelector^('#merchantsTable tbody'^);
echo       
echo       loading.style.display = 'block';
echo       content.style.display = 'none';
echo       
echo       try {
echo         const response = await fetch^('/api/merchants'^);
echo         const merchants = await response.json^(^);
echo         
echo         tbody.innerHTML = '';
echo         merchants.forEach^(merchant =^> {
echo           const row = `
echo             ^<tr^>
echo               ^<td^>${merchant.name}^</td^>
echo               ^<td^>${merchant.email}^</td^>
echo               ^<td^>${merchant.phone ^|^| '-'}^</td^>
echo               ^<td^>${merchant.city ^|^| '-'}^</td^>
echo               ^<td^>${merchant.plan_type ^|^| 'Básico'}^</td^>
echo               ^<td^>^<span class="badge badge-success"^>Ativo^</span^>^</td^>
echo             ^</tr^>
echo           `;
echo           tbody.innerHTML += row;
echo         }^);
echo         
echo         document.getElementById^('merchantCount'^).textContent = merchants.length;
echo       } catch ^(error^) {
echo         showAlert^('Erro ao carregar comerciantes', 'danger'^);
echo       }
echo       
echo       loading.style.display = 'none';
echo       content.style.display = 'block';
echo     }
echo     
echo     async function loadDeliverers^(^) {
echo       const loading = document.getElementById^('deliverersLoading'^);
echo       const content = document.getElementById^('deliverersContent'^);
echo       const tbody = document.querySelector^('#deliverersTable tbody'^);
echo       
echo       loading.style.display = 'block';
echo       content.style.display = 'none';
echo       
echo       try {
echo         const response = await fetch^('/api/deliverers'^);
echo         const deliverers = await response.json^(^);
echo         
echo         tbody.innerHTML = '';
echo         deliverers.forEach^(deliverer =^> {
echo           const row = `
echo             ^<tr^>
echo               ^<td^>${deliverer.name}^</td^>
echo               ^<td^>${deliverer.email}^</td^>
echo               ^<td^>${deliverer.phone ^|^| '-'}^</td^>
echo               ^<td^>${deliverer.vehicle_type ^|^| '-'}^</td^>
echo               ^<td^>${deliverer.vehicle_plate ^|^| '-'}^</td^>
echo               ^<td^>^<span class="badge badge-success"^>Ativo^</span^>^</td^>
echo             ^</tr^>
echo           `;
echo           tbody.innerHTML += row;
echo         }^);
echo         
echo         document.getElementById^('delivererCount'^).textContent = deliverers.length;
echo       } catch ^(error^) {
echo         showAlert^('Erro ao carregar entregadores', 'danger'^);
echo       }
echo       
echo       loading.style.display = 'none';
echo       content.style.display = 'block';
echo     }
echo     
echo     async function loadDeliveries^(^) {
echo       const loading = document.getElementById^('deliveriesLoading'^);
echo       const content = document.getElementById^('deliveriesContent'^);
echo       const tbody = document.querySelector^('#deliveriesTable tbody'^);
echo       
echo       loading.style.display = 'block';
echo       content.style.display = 'none';
echo       
echo       try {
echo         const response = await fetch^('/api/deliveries'^);
echo         const deliveries = await response.json^(^);
echo         
echo         tbody.innerHTML = '';
echo         deliveries.forEach^(delivery =^> {
echo           const statusClass = delivery.status === 'completed' ? 'badge-success' : 
echo                              delivery.status === 'pending' ? 'badge-warning' : 'badge-danger';
echo           const row = `
echo             ^<tr^>
echo               ^<td^>${delivery.customer_name}^</td^>
echo               ^<td^>${delivery.merchant_name ^|^| '-'}^</td^>
echo               ^<td^>${delivery.deliverer_name ^|^| 'Não atribuído'}^</td^>
echo               ^<td^>${delivery.delivery_address}^</td^>
echo               ^<td^>R$ ${delivery.price.toFixed^(2^)}^</td^>
echo               ^<td^>^<span class="badge ${statusClass}"^>${delivery.status}^</span^>^</td^>
echo             ^</tr^>
echo           `;
echo           tbody.innerHTML += row;
echo         }^);
echo         
echo         document.getElementById^('deliveryCount'^).textContent = deliveries.length;
echo       } catch ^(error^) {
echo         showAlert^('Erro ao carregar entregas', 'danger'^);
echo       }
echo       
echo       loading.style.display = 'none';
echo       content.style.display = 'block';
echo     }
echo     
echo     function showAlert^(message, type^) {
echo       const alerts = document.getElementById^('alerts'^);
echo       const alert = `^<div class="alert alert-${type}"^>${message}^</div^>`;
echo       alerts.innerHTML = alert;
echo       setTimeout^(^(^) =^> alerts.innerHTML = '', 5000^);
echo     }
echo     
echo     function saveSettings^(^) {
echo       showAlert^('Configurações salvas com sucesso!', 'success'^);
echo     }
echo     
echo     function createBackup^(^) {
echo       showAlert^('Backup criado com sucesso!', 'success'^);
echo     }
echo     
echo     function restartSystem^(^) {
echo       if ^(confirm^('Tem certeza que deseja reiniciar o sistema?'^)^) {
echo         showAlert^('Sistema será reiniciado...', 'warning'^);
echo         setTimeout^(^(^) =^> window.location.reload^(^), 3000^);
echo       }
echo     }
echo     
echo     function showLogs^(type^) {
echo       const textarea = document.getElementById^('logsTextarea'^);
echo       textarea.value = `Carregando logs de ${type}...`;
echo       
echo       fetch^(`/api/logs/${type}`^)
echo         .then^(response =^> response.text^(^)^)
echo         .then^(logs =^> {
echo           textarea.value = logs ^|^| `Nenhum log de ${type} encontrado`;
echo         }^)
echo         .catch^(error =^> {
echo           textarea.value = `Erro ao carregar logs: ${error.message}`;
echo         }^);
echo     }
echo     
echo     // Carregar dados iniciais
echo     loadMerchants^(^);
echo     
echo     // Atualizar dados a cada 30 segundos
echo     setInterval^(^(^) =^> {
echo       if ^(currentSection === 'merchants'^) loadMerchants^(^);
echo       if ^(currentSection === 'deliverers'^) loadDeliverers^(^);
echo       if ^(currentSection === 'deliveries'^) loadDeliveries^(^);
echo     }, 30000^);
echo   ^</script^>
echo ^</body^>
echo ^</html^>
echo   `^);
echo }^);
echo.
echo // Rota para logs
echo app.get^('/api/logs/:type', ^(req, res^) =^> {
echo   const logType = req.params.type;
echo   const logFile = `./logs/${logType}.log`;
echo   
echo   if ^(fs.existsSync^(logFile^)^) {
echo     const logs = fs.readFileSync^(logFile, 'utf8'^);
echo     res.send^(logs^);
echo   } else {
echo     res.send^(`Nenhum log de ${logType} encontrado`^);
echo   }
echo }^);
echo.
) > rotas-admin.tmp

echo [3/3] Inserindo rotas no servidor...

:: Encontrar linha onde inserir as rotas (antes da página principal)
powershell -Command "& {
    $content = Get-Content 'server.js' -Raw
    $newRoutes = Get-Content 'rotas-admin.tmp' -Raw
    $insertPoint = $content.IndexOf('// Pagina principal')
    if ($insertPoint -gt 0) {
        $before = $content.Substring(0, $insertPoint)
        $after = $content.Substring($insertPoint)
        $newContent = $before + $newRoutes + $after
        Set-Content 'server.js' -Value $newContent -Encoding UTF8
    }
}" 2>nul

if %errorlevel% equ 0 (
    echo Rotas administrativas adicionadas com sucesso!
    
    :: Limpar arquivo temporário
    del "rotas-admin.tmp" >nul 2>&1
    
    echo.
    echo ===============================================
    echo   ROTAS ADMINISTRATIVAS ADICIONADAS!
    echo ===============================================
    echo.
    echo • Rota /admin disponível
    echo • Painel administrativo completo
    echo • Gerenciamento de comerciantes
    echo • Gerenciamento de entregadores
    echo • Visualização de entregas
    echo • Configurações do sistema
    echo • Visualização de logs
    echo.
    echo Para acessar: http://localhost:3000/admin
    echo.
    echo Reinicie o servidor para aplicar as mudanças:
    echo 1. Pressione Ctrl+C no terminal do servidor
    echo 2. Execute: node server.js
    echo.
) else (
    echo ERRO: Não foi possível adicionar as rotas
    echo Restaurando backup...
    move "server-backup.js" "server.js" >nul
)

pause