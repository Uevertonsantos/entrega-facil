@echo off
echo Testando instalador do Entrega Fácil...
echo.

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado. Por favor, instale o Node.js antes de continuar.
    pause
    exit /b 1
)

echo.
echo Verificando npm...
npm --version
if errorlevel 1 (
    echo ERRO: npm nao encontrado. Por favor, instale o npm antes de continuar.
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
npm install

echo.
echo Executando instalador em modo de teste...
node installer.js --test

echo.
echo Teste concluido!
pause