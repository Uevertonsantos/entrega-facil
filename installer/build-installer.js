const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Construindo pacote de instalação do Entrega Fácil...');

const buildDir = path.join(__dirname, 'dist');
const packageVersion = '1.0.0';

// Limpar diretório de build
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Lista de arquivos a serem incluídos
const filesToInclude = [
  'install-automatico.bat',
  'install-windows.bat', 
  'install-windows.ps1',
  'LEIA-ME.md'
];

// Copiar arquivos
console.log('📁 Copiando arquivos...');
filesToInclude.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(buildDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (não encontrado)`);
  }
});

// Criar arquivo de versão
const versionInfo = {
  version: packageVersion,
  buildDate: new Date().toISOString(),
  platform: 'windows',
  description: 'Entrega Fácil - Sistema de Gerenciamento de Entregas',
  author: 'Entrega Fácil Team',
  license: 'MIT',
  requirements: {
    os: 'Windows 7 ou superior',
    ram: '2GB mínimo, 4GB recomendado',
    disk: '500MB livres',
    internet: 'Necessária para instalação e sincronização'
  },
  features: [
    'Instalação completamente automática',
    'Node.js instalado automaticamente se necessário',
    'Sistema local com banco SQLite',
    'Sincronização automática com servidor central', 
    'Inicialização automática com Windows',
    'Painel de controle integrado',
    'Atalhos na área de trabalho',
    'Logs detalhados do sistema',
    'Interface web responsiva',
    'Backup local dos dados'
  ],
  installation: {
    methods: [
      {
        name: 'Automática (Recomendada)',
        file: 'install-automatico.bat',
        description: 'Instalação completamente automática sem intervenção do usuário',
        time: '5-10 minutos'
      },
      {
        name: 'Windows Padrão',
        file: 'install-windows.bat', 
        description: 'Instalação passo-a-passo com feedback visual',
        time: '10-15 minutos'
      },
      {
        name: 'PowerShell Avançado',
        file: 'install-windows.ps1',
        description: 'Instalação com opções avançadas de personalização',
        time: '5-10 minutos'
      }
    ]
  },
  urls: {
    system: 'http://localhost:3000',
    admin: 'https://admin.entregafacil.com',
    docs: 'LEIA-ME.md'
  }
};

fs.writeFileSync(
  path.join(buildDir, 'version.json'),
  JSON.stringify(versionInfo, null, 2)
);

// Criar arquivo de instalação única
const masterInstallerContent = `@echo off
setlocal enabledelayedexpansion
title Entrega Facil - Instalador Master v${packageVersion}
color 0A
cls

echo.
echo  ╔════════════════════════════════════════════════════════════════════════════╗
echo  ║                    ENTREGA FACIL - INSTALADOR MASTER                      ║
echo  ║                              Versao ${packageVersion}                              ║
echo  ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo  Bem-vindo ao instalador do Sistema Entrega Facil!
echo.
echo  Este sistema oferece:
echo  • Gestao completa de comerciantes e entregadores
echo  • Controle de entregas em tempo real
echo  • Sincronizacao automatica com servidor central
echo  • Interface web moderna e responsiva
echo  • Instalacao e configuracao automaticas
echo.
echo  Escolha o tipo de instalacao:
echo.
echo  [1] Instalacao Automatica (Recomendada)
echo      - Completamente automatica
echo      - Instala Node.js se necessario
echo      - Tempo: 5-10 minutos
echo.
echo  [2] Instalacao Windows Padrao
echo      - Passo-a-passo com feedback
echo      - Controle total do processo
echo      - Tempo: 10-15 minutos
echo.
echo  [3] Instalacao PowerShell Avancada
echo      - Opcoes de personalizacao
echo      - Para usuarios tecnicos
echo      - Tempo: 5-10 minutos
echo.
echo  [4] Ler Documentacao
echo      - Manual completo do sistema
echo      - Guia de configuracao
echo      - Solucao de problemas
echo.
echo  [5] Verificar Informacoes do Sistema
echo      - Requisitos e compatibilidade
echo      - Versao e recursos
echo.
echo  [0] Sair
echo.
set /p opcao="Digite sua opcao (1-5): "

if "%opcao%"=="1" (
    cls
    echo Iniciando instalacao automatica...
    call install-automatico.bat
    goto end
)

if "%opcao%"=="2" (
    cls
    echo Iniciando instalacao Windows padrao...
    call install-windows.bat
    goto end
)

if "%opcao%"=="3" (
    cls
    echo Iniciando instalacao PowerShell avancada...
    powershell -ExecutionPolicy Bypass -File install-windows.ps1
    goto end
)

if "%opcao%"=="4" (
    cls
    echo Abrindo documentacao...
    start notepad LEIA-ME.md
    goto menu
)

if "%opcao%"=="5" (
    cls
    echo.
    echo  ╔════════════════════════════════════════════════════════════════════════════╗
    echo  ║                        INFORMACOES DO SISTEMA                             ║
    echo  ╚════════════════════════════════════════════════════════════════════════════╝
    echo.
    echo  Versao: ${packageVersion}
    echo  Plataforma: Windows 7 ou superior
    echo  RAM: 2GB minimo, 4GB recomendado
    echo  Espaco: 500MB livres
    echo  Internet: Necessaria para instalacao e sincronizacao
    echo.
    echo  Recursos:
    echo  • Instalacao completamente automatica
    echo  • Node.js instalado automaticamente
    echo  • Sistema local com banco SQLite
    echo  • Sincronizacao automatica
    echo  • Inicializacao com Windows
    echo  • Painel de controle integrado
    echo  • Interface web responsiva
    echo.
    echo  Pressione qualquer tecla para voltar ao menu...
    pause >nul
    goto menu
)

if "%opcao%"=="0" (
    echo.
    echo Instalacao cancelada pelo usuario.
    echo.
    pause
    exit
)

echo.
echo Opcao invalida! Tente novamente.
timeout /t 2 /nobreak >nul
goto menu

:menu
cls
goto start

:end
echo.
echo Instalacao finalizada!
echo.
pause
exit

:start
goto menu
`;

fs.writeFileSync(path.join(buildDir, 'INSTALAR.bat'), masterInstallerContent);

// Criar arquivo README em texto simples
const readmeContent = `ENTREGA FACIL - SISTEMA DE GERENCIAMENTO DE ENTREGAS
====================================================

INSTALACAO RAPIDA:
1. Execute o arquivo: INSTALAR.bat
2. Escolha a opcao 1 (Instalacao Automatica)
3. Aguarde o processo automatico
4. O sistema abrira no navegador

ACESSO APOS INSTALACAO:
- Sistema: http://localhost:3000
- Controle: "Entrega Facil - Controle.bat" (area de trabalho)
- Pasta: %USERPROFILE%\\EntregaFacil

DOCUMENTACAO COMPLETA:
Consulte o arquivo LEIA-ME.md para informacoes detalhadas.

SUPORTE:
Para suporte tecnico, acesse: https://admin.entregafacil.com

Versao: ${packageVersion}
Data: ${new Date().toLocaleDateString('pt-BR')}
`;

fs.writeFileSync(path.join(buildDir, 'README.txt'), readmeContent);

// Criar estrutura de pastas
const folders = ['docs', 'logs', 'backups'];
folders.forEach(folder => {
  const folderPath = path.join(buildDir, folder);
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(path.join(folderPath, '.gitkeep'), '');
});

// Gerar relatório de build
const buildReport = {
  buildDate: new Date().toISOString(),
  version: packageVersion,
  platform: 'windows',
  files: fs.readdirSync(buildDir).map(file => {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      type: stats.isDirectory() ? 'directory' : 'file',
      modified: stats.mtime.toISOString()
    };
  }),
  totalSize: fs.readdirSync(buildDir).reduce((total, file) => {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    return total + (stats.isFile() ? stats.size : 0);
  }, 0)
};

fs.writeFileSync(
  path.join(buildDir, 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log('\n✅ Pacote de instalação criado com sucesso!');
console.log(`📁 Localização: ${buildDir}`);
console.log(`📦 Versão: ${packageVersion}`);
console.log(`📊 Arquivos criados: ${buildReport.files.length}`);
console.log(`💾 Tamanho total: ${(buildReport.totalSize / 1024).toFixed(2)} KB`);
console.log('\n📋 Arquivos incluídos:');
buildReport.files.forEach(file => {
  const sizeKB = file.type === 'file' ? `(${(file.size / 1024).toFixed(2)} KB)` : '(pasta)';
  console.log(`  • ${file.name} ${sizeKB}`);
});

console.log('\n🚀 Para distribuir:');
console.log('1. Comprima a pasta "dist" em um arquivo ZIP');
console.log('2. Distribua o arquivo ZIP para os usuários');
console.log('3. Usuários devem extrair e executar INSTALAR.bat');
console.log('\n✨ Instalação pronta para uso!');