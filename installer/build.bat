@echo off
echo Construindo instalador do Entrega Fácil...
echo.

echo Instalando dependencias...
npm install

echo.
echo Construindo executavel para Windows...
npm run build-win

echo.
echo Construindo executavel para Linux...
npm run build-linux

echo.
echo Construindo executavel para macOS...
npm run build-mac

echo.
echo Instalador construido com sucesso!
echo Arquivos disponiveis em: ./dist/
echo.
echo Executaveis criados:
echo - Windows: installer.exe
echo - Linux: installer
echo - macOS: installer
echo.
pause