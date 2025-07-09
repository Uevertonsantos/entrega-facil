# 🔧 Solução para Erro de Conexão "localhost:3000"

## 🚨 Problema Identificado
O cliente está vendo erro "ERR_CONNECTION_REFUSED" ao acessar localhost:3000.

## 🔍 Causa Provável
O servidor Node.js não está rodando ou foi encerrado.

## ✅ Soluções Criadas

### 1. **Ferramentas de Diagnóstico**
- **`diagnostico.bat`** - Verifica toda a instalação
- **`testar-instalacao.bat`** - Testa se o servidor funciona
- **`instalador-comerciante-corrigido.bat`** - Instalador principal

### 2. **Como Resolver**

#### **Passo 1: Executar Diagnóstico**
```
1. Baixe: entrega-facil-comerciante-FINAL-v3.0.zip
2. Execute: diagnostico.bat como Administrador
3. Siga as instruções na tela
```

#### **Passo 2: Se Servidor Não Inicia**
```
1. Verifique se Node.js está instalado
2. Execute como Administrador
3. Verifique firewall do Windows
4. Tente alterar porta no config.json
```

#### **Passo 3: Iniciar Servidor Manualmente**
```
1. Abra CMD como Administrador
2. Navegue até: C:\Users\[Usuario]\EntregaFacil
3. Execute: node server.js
4. Acesse: http://localhost:3000
```

### 3. **Verificações Importantes**

#### **Porta Ocupada?**
- O instalador detecta porta livre automaticamente
- Se 3000 estiver ocupada, tenta: 3001, 3002, 8080, 8000, 5000, 4000, 9000

#### **Firewall Bloqueando?**
- Permitir Node.js no firewall
- Executar sempre como Administrador

#### **Antivírus Interferindo?**
- Adicionar pasta EntregaFacil às exceções
- Permitir execução de node.exe

## 📋 Arquivos no Pacote Final

### `entrega-facil-comerciante-FINAL-v3.0.zip` contém:
- ✅ **instalador-comerciante-corrigido.bat** - Instalador principal
- ✅ **diagnostico.bat** - Ferramenta de diagnóstico completo
- ✅ **testar-instalacao.bat** - Teste rápido do sistema
- ✅ **README-INSTALADOR.md** - Documentação completa
- ✅ **INSTRUCOES-RAPIDAS.md** - Instruções resumidas

## 🎯 Instruções para o Cliente

### **Se o sistema não abrir:**
1. Execute **diagnostico.bat** como Administrador
2. Siga as instruções na tela
3. Se ainda não funcionar, execute **testar-instalacao.bat**
4. Entre em contato com suporte se persistir

### **Para iniciar o sistema:**
1. Clique no atalho "Entrega Fácil" na área de trabalho
2. OU execute "Iniciar Sistema.bat"
3. Aguarde alguns segundos
4. Acesse http://localhost:3000 (ou porta mostrada)

## 📞 Suporte Técnico
- **Email**: suporte@entregafacil.com
- **Diagnóstico**: Use as ferramentas incluídas
- **Reinstalação**: Execute o instalador novamente se necessário