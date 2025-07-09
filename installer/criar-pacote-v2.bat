@echo off
setlocal enabledelayedexpansion
title Criar Pacote Instalador v2.0
color 0B

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    CRIANDO PACOTE INSTALADOR V2.0                         ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.

set "SOURCE_DIR=%~dp0"
set "DIST_DIR=%SOURCE_DIR%dist"
set "PACKAGE_NAME=entrega-facil-installer-v2.0.0"
set "PACKAGE_DIR=%DIST_DIR%\%PACKAGE_NAME%"

:: Criar diretório do pacote
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
mkdir "%PACKAGE_DIR%"

echo [1/6] Copiando arquivos principais...
copy "%SOURCE_DIR%install-completo-v2.bat" "%PACKAGE_DIR%\"
copy "%SOURCE_DIR%install-powershell-v2.ps1" "%PACKAGE_DIR%\"
copy "%SOURCE_DIR%..\configurar-porta.bat" "%PACKAGE_DIR%\"
copy "%SOURCE_DIR%..\resolver-porta.bat" "%PACKAGE_DIR%\"
copy "%SOURCE_DIR%..\fix-config.bat" "%PACKAGE_DIR%\"

echo [2/6] Criando documentação...
(
echo # ENTREGA FÁCIL - INSTALADOR V2.0
echo.
echo ## NOVIDADES DA VERSÃO 2.0
echo.
echo ✅ **Detecção automática de porta livre**
echo ✅ **Correção automática de erros**
echo ✅ **Sistema de backup robusto**
echo ✅ **Logging avançado**
echo ✅ **Retry automático em falhas**
echo ✅ **Interface web melhorada**
echo ✅ **Recuperação automática de falhas**
echo ✅ **Painel de controle avançado**
echo.
echo ## OPÇÕES DE INSTALAÇÃO
echo.
echo ### 1. Instalação Automática ^(Recomendada^)
echo ```
echo install-completo-v2.bat
echo ```
echo - Instalação completamente automática
echo - Detecta porta livre automaticamente
echo - Instala Node.js se necessário
echo - Cria backup automático
echo - Configura inicialização automática
echo.
echo ### 2. Instalação PowerShell ^(Avançada^)
echo ```
echo install-powershell-v2.ps1
echo ```
echo - Instalação via PowerShell
echo - Mais opções de personalização
echo - Melhor tratamento de erros
echo - Suporte a parâmetros
echo.
echo ### 3. Utilitários de Suporte
echo - `configurar-porta.bat` - Alterar porta do sistema
echo - `resolver-porta.bat` - Resolver conflitos de porta
echo - `fix-config.bat` - Corrigir arquivos de configuração
echo.
echo ## REQUISITOS DO SISTEMA
echo.
echo - Windows 10/11 ^(64-bit^)
echo - 4GB RAM mínimo
echo - 1GB espaço livre
echo - Conexão com internet ^(para instalação^)
echo.
echo ## INSTALAÇÃO RÁPIDA
echo.
echo 1. **Descompacte** o arquivo ZIP
echo 2. **Execute** `install-completo-v2.bat` como Administrador
echo 3. **Aguarde** a instalação automática
echo 4. **Acesse** o sistema no navegador
echo.
echo ## PORTAS SUPORTADAS
echo.
echo O sistema detecta automaticamente uma porta livre:
echo - 3000 ^(padrão^)
echo - 3001, 3002
echo - 8080, 8081
echo - 8000, 5000, 5001
echo - 9000, 9001
echo.
echo ## SOLUÇÃO DE PROBLEMAS
echo.
echo ### Erro "EADDRINUSE"
echo ```
echo resolver-porta.bat
echo ```
echo.
echo ### Arquivo config.json inválido
echo ```
echo fix-config.bat
echo ```
echo.
echo ### Mudar porta do sistema
echo ```
echo configurar-porta.bat
echo ```
echo.
echo ## RECURSOS AVANÇADOS V2.0
echo.
echo ### Sistema de Backup
echo - Backup automático diário
echo - Backup manual via painel
echo - Pasta: `backups\`
echo.
echo ### Logging Completo
echo - Logs de acesso: `logs\access.log`
echo - Logs de erro: `logs\error.log`
echo - Logs de info: `logs\info.log`
echo.
echo ### Sincronização
echo - Sincronização automática a cada 5 minutos
echo - Envio para painel administrativo
echo - Configurável via `config.json`
echo.
echo ### Painel de Controle
echo Execute: `Entrega Fácil - Controle v2.bat`
echo - Iniciar/Parar sistema
echo - Ver logs
echo - Criar backup
echo - Configurações
echo.
echo ## SUPORTE
echo.
echo Para suporte técnico, entre em contato:
echo - Email: suporte@entregafacil.com
echo - Documentação: https://docs.entregafacil.com
echo.
echo ## CHANGELOG V2.0
echo.
echo - ✅ Detecção automática de porta livre
echo - ✅ Correção automática de erros EADDRINUSE
echo - ✅ Sistema de backup robusto
echo - ✅ Logging avançado
echo - ✅ Retry automático em falhas
echo - ✅ Interface web melhorada
echo - ✅ Painel de controle avançado
echo - ✅ Utilitários de manutenção
echo - ✅ Suporte a PowerShell
echo - ✅ Documentação completa
echo.
echo ---
echo **Entrega Fácil v2.0** - Sistema de Gerenciamento de Entregas
echo Desenvolvido para pequenos comércios e cidades do interior
) > "%PACKAGE_DIR%\README.md"

echo [3/6] Criando instalador principal...
(
echo @echo off
echo title Entrega Fácil - Instalador Principal v2.0
echo color 0A
echo cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FÁCIL - INSTALADOR PRINCIPAL V2.0              ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  Bem-vindo ao instalador do Entrega Fácil v2.0!
echo  Sistema completo de gerenciamento de entregas para pequenos comércios.
echo.
echo  NOVIDADES V2.0:
echo  • Detecção automática de porta livre
echo  • Correção automática de erros
echo  • Sistema de backup robusto
echo  • Logging avançado
echo  • Painel de controle melhorado
echo.
echo  Escolha o método de instalação:
echo.
echo  [1] Instalação Automática ^(Recomendada^)
echo  [2] Instalação PowerShell ^(Avançada^)
echo  [3] Utilitários de Manutenção
echo  [4] Ler Documentação
echo  [0] Sair
echo.
set /p opcao="Digite sua opção: "
echo.
if "%%opcao%%"=="1" (
    echo Iniciando instalação automática...
    echo.
    call install-completo-v2.bat
)
if "%%opcao%%"=="2" (
    echo Iniciando instalação PowerShell...
    echo.
    powershell -ExecutionPolicy Bypass -File install-powershell-v2.ps1
)
if "%%opcao%%"=="3" goto utilitarios
if "%%opcao%%"=="4" (
    start notepad README.md
    goto menu
)
if "%%opcao%%"=="0" exit
echo Opção inválida!
timeout /t 2 /nobreak ^>nul
goto menu
echo.
:utilitarios
cls
echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                         UTILITÁRIOS DE MANUTENÇÃO                         ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  [1] Configurar Porta do Sistema
echo  [2] Resolver Conflitos de Porta
echo  [3] Corrigir Arquivos de Configuração
echo  [4] Voltar ao Menu Principal
echo.
set /p util="Digite sua opção: "
echo.
if "%%util%%"=="1" call configurar-porta.bat
if "%%util%%"=="2" call resolver-porta.bat
if "%%util%%"=="3" call fix-config.bat
if "%%util%%"=="4" goto menu
echo.
goto utilitarios
echo.
:menu
goto inicio
) > "%PACKAGE_DIR%\INSTALAR.bat"

echo [4/6] Criando arquivo de versão...
(
echo Entrega Fácil v2.0.0
echo Data: %DATE% %TIME%
echo Versão do Instalador: 2.0.0
echo.
echo Novidades desta versão:
echo - Detecção automática de porta livre
echo - Correção automática de erros
echo - Sistema de backup robusto
echo - Logging avançado
echo - Retry automático em falhas
echo - Interface web melhorada
echo - Painel de controle avançado
echo.
echo Arquivos incluídos:
echo - install-completo-v2.bat
echo - install-powershell-v2.ps1
echo - configurar-porta.bat
echo - resolver-porta.bat
echo - fix-config.bat
echo - README.md
echo - INSTALAR.bat
echo.
echo Testado em Windows 10/11 x64
) > "%PACKAGE_DIR%\VERSION.txt"

echo [5/6] Criando arquivo de configuração rápida...
(
echo @echo off
echo title Configuração Rápida - Entrega Fácil
echo.
echo Este arquivo permite configurar rapidamente seu negócio
echo antes de executar a instalação principal.
echo.
echo Informações do seu negócio:
echo.
set /p nome="Nome do negócio: "
set /p email="Email de contato: "
set /p telefone="Telefone: "
set /p endereco="Endereço: "
set /p cidade="Cidade: "
set /p estado="Estado: "
echo.
echo Configuração salva! Execute agora INSTALAR.bat
echo.
^(
echo BUSINESS_NAME=%%nome%%
echo BUSINESS_EMAIL=%%email%%
echo BUSINESS_PHONE=%%telefone%%
echo BUSINESS_ADDRESS=%%endereco%%
echo BUSINESS_CITY=%%cidade%%
echo BUSINESS_STATE=%%estado%%
^) ^> business-config.txt
echo.
echo Configuração salva em business-config.txt
echo Execute agora INSTALAR.bat para continuar
echo.
pause
) > "%PACKAGE_DIR%\configurar-negocio.bat"

echo [6/6] Criando arquivo ZIP...
cd /d "%DIST_DIR%"

:: Tentar PowerShell primeiro
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force" >nul 2>&1
if %errorlevel% equ 0 (
    echo Pacote criado com PowerShell: %PACKAGE_NAME%.zip
    goto success
)

:: Tentar com 7-Zip se disponível
7z a -tzip "%PACKAGE_NAME%.zip" "%PACKAGE_NAME%\*" >nul 2>&1
if %errorlevel% equ 0 (
    echo Pacote criado com 7-Zip: %PACKAGE_NAME%.zip
    goto success
)

:: Fallback: manter pasta
echo Pacote criado na pasta: %PACKAGE_NAME%
echo ^(ZIP não foi criado - instale 7-Zip ou use PowerShell 5.0+^)

:success
echo.
echo ===============================================
echo   PACOTE INSTALADOR V2.0 CRIADO COM SUCESSO!
echo ===============================================
echo.
echo Localização: %DIST_DIR%\%PACKAGE_NAME%
echo.
echo Arquivos incluídos:
echo • INSTALAR.bat ^(Menu principal^)
echo • install-completo-v2.bat ^(Instalação automática^)
echo • install-powershell-v2.ps1 ^(Instalação PowerShell^)
echo • configurar-porta.bat ^(Configurar porta^)
echo • resolver-porta.bat ^(Resolver conflitos^)
echo • fix-config.bat ^(Corrigir configuração^)
echo • README.md ^(Documentação completa^)
echo • VERSION.txt ^(Informações da versão^)
echo • configurar-negocio.bat ^(Configuração rápida^)
echo.
echo Para distribuir: Envie o arquivo ZIP ou a pasta completa
echo Para instalar: Execute INSTALAR.bat e siga as instruções
echo.
echo Pronto para distribuição!
echo.
pause