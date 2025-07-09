# 🚚 Entrega Fácil - Instalador Automático

## 📋 Sobre o Sistema

O **Entrega Fácil** é um sistema completo de gerenciamento de entregas desenvolvido especificamente para pequenos e médios negócios. O sistema permite conectar comerciantes com entregadores de forma eficiente e prática.

## 🎯 Instalação Rápida (Recomendada)

### Para usuários comuns:
1. **Baixe** o arquivo `install-automatico.bat`
2. **Execute** o arquivo (duplo clique)
3. **Aguarde** a instalação automática
4. **Pronto!** O sistema abrirá automaticamente no navegador

### Recursos instalados automaticamente:
- ✅ **Node.js** (se necessário)
- ✅ **Sistema Entrega Fácil** completo
- ✅ **Banco de dados** SQLite local
- ✅ **Servidor local** na porta 3000
- ✅ **Atalhos** na área de trabalho
- ✅ **Inicialização automática** com Windows
- ✅ **Sincronização** com servidor central
- ✅ **Painel de controle** do sistema

## 🔧 Opções de Instalação

### 1. Instalação Automática (Mais Fácil)
```batch
install-automatico.bat
```
- **Vantagens**: Completamente automático, instala tudo
- **Ideal para**: Usuários sem conhecimento técnico
- **Tempo**: 5-10 minutos

### 2. Instalação Padrão Windows
```batch
install-windows.bat
```
- **Vantagens**: Instalação passo-a-passo
- **Ideal para**: Usuários que querem acompanhar o processo
- **Tempo**: 10-15 minutos

### 3. Instalação PowerShell (Avançada)
```powershell
install-windows.ps1
```
- **Vantagens**: Personalização avançada, melhor controle
- **Ideal para**: Usuários técnicos e administradores
- **Tempo**: 5-10 minutos

## 🖥️ Requisitos do Sistema

### Mínimos:
- **Sistema**: Windows 7 ou superior
- **RAM**: 2GB ou mais
- **Espaço**: 500MB livres
- **Internet**: Necessária para instalação e sincronização

### Recomendados:
- **Sistema**: Windows 10 ou superior
- **RAM**: 4GB ou mais
- **Espaço**: 1GB livres
- **Internet**: Banda larga para melhor sincronização

## 🚀 Após a Instalação

### Acessos:
- **Sistema Principal**: http://localhost:3000
- **Painel de Controle**: "Entrega Fácil - Controle.bat" (área de trabalho)
- **Pasta de Instalação**: `%USERPROFILE%\EntregaFacil`

### Funcionalidades:
- **Gerenciamento** de comerciantes
- **Cadastro** de entregadores
- **Controle** de entregas
- **Relatórios** completos
- **Sincronização** automática
- **Backup** local dos dados

## 🔄 Gerenciamento do Sistema

### Painel de Controle:
Execute o arquivo **"Entrega Fácil - Controle.bat"** para:
- ▶️ Iniciar o sistema
- ⏹️ Parar o sistema
- 🔄 Reiniciar o sistema
- 🌐 Abrir no navegador
- 📋 Ver logs do sistema
- ⚙️ Editar configurações

### Comandos Manuais:
```batch
# Iniciar sistema
cd %USERPROFILE%\EntregaFacil
node server.js

# Parar sistema
taskkill /f /im node.exe

# Ver status
netstat -an | findstr :3000
```

## 🔧 Configurações

### Arquivo Principal: `config.json`
```json
{
  "businessName": "Seu Negócio",
  "businessEmail": "contato@seunegocio.com",
  "businessPhone": "(11) 99999-9999",
  "businessAddress": "Endereço completo",
  "localPort": 3000,
  "syncEnabled": true,
  "autoStart": true
}
```

### Personalização:
1. Abra o arquivo `config.json`
2. Altere as informações do seu negócio
3. Salve o arquivo
4. Reinicie o sistema

## 🔄 Sincronização

### Automática:
- **Frequência**: A cada 5 minutos
- **Dados**: Comerciantes, entregadores, entregas
- **Destino**: Servidor central do Entrega Fácil

### Manual:
- Acesse: http://localhost:3000/api/sync
- Ou use o painel de controle

## 📊 Monitoramento

### Logs do Sistema:
- **Localização**: `%USERPROFILE%\EntregaFacil\logs\`
- **Arquivos**: 
  - `install.log` - Log de instalação
  - `system.log` - Log do sistema
  - `sync.log` - Log de sincronização

### Status do Sistema:
- **URL**: http://localhost:3000/api/status
- **Informações**: Tempo ativo, configurações, estado

## 🛠️ Solução de Problemas

### Problemas Comuns:

#### Sistema não inicia:
1. Verifique se o Node.js está instalado
2. Execute o painel de controle
3. Verifique os logs
4. Reinicie o computador

#### Porta 3000 ocupada:
1. Altere a porta no `config.json`
2. Reinicie o sistema
3. Ou pare o processo que está usando a porta

#### Sincronização falha:
1. Verifique a conexão com internet
2. Confira as configurações no `config.json`
3. Verifique os logs de sincronização

### Comandos de Diagnóstico:
```batch
# Verificar Node.js
node --version

# Verificar porta
netstat -an | findstr :3000

# Verificar processos
tasklist | findstr node

# Testar conectividade
ping google.com
```

## 🗑️ Desinstalação

### Método Simples:
1. Pare o sistema usando o painel de controle
2. Delete a pasta `%USERPROFILE%\EntregaFacil`
3. Remova o arquivo `EntregaFacil.bat` da pasta:
   `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
4. Delete os atalhos da área de trabalho

### Método Completo:
```batch
# Parar sistema
taskkill /f /im node.exe

# Remover pasta
rmdir /s /q "%USERPROFILE%\EntregaFacil"

# Remover inicialização
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\EntregaFacil.bat"

# Remover atalhos
del "%USERPROFILE%\Desktop\Entrega Facil.lnk"
del "%USERPROFILE%\Desktop\Entrega Facil - Controle.bat"
```

## 🆘 Suporte

### Canais de Suporte:
- **Painel Admin**: https://admin.entregafacil.com
- **Documentação**: Consulte este arquivo
- **Logs**: Verifique os arquivos de log

### Informações Importantes:
- **Client ID**: Encontrado em `config.json`
- **Versão**: Disponível em http://localhost:3000/api/status
- **Logs**: Pasta `logs/` na instalação

## 📝 Notas Importantes

### Segurança:
- O sistema roda apenas localmente
- Dados são sincronizados com servidor central
- Backup local é mantido em SQLite

### Performance:
- Sistema otimizado para pequenos negócios
- Suporta até 1000 entregas simultâneas
- Banco de dados SQLite para máxima compatibilidade

### Atualizações:
- Sistema se atualiza automaticamente
- Configurações são preservadas
- Dados locais são mantidos

---

## 📧 Contato

Para suporte técnico avançado, acesse o painel administrativo do sistema ou consulte a documentação completa.

**Entrega Fácil** - Sistema de Gerenciamento de Entregas
Versão 1.0.0 - 2025