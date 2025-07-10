# Render Database Setup Guide

## Problema: Erro de Conexão com Banco de Dados

Se você está vendo "Erro de conexão com o banco de dados" no Render, siga estes passos:

## 1. Verificar PostgreSQL Add-on

### No Dashboard do Render:
1. Vá para o seu serviço no Render
2. Clique na aba **"Environment"**
3. Verifique se existe a variável `DATABASE_URL`
4. Se não existir, você precisa adicionar um banco de dados

### Adicionar PostgreSQL:
1. No dashboard do Render, clique em **"New +"**
2. Escolha **"PostgreSQL"**
3. Configure:
   - **Name**: `entrega-facil-db`
   - **Database**: `entrega_facil`
   - **User**: `entrega_facil_user`
   - **Region**: Mesma região do seu serviço
4. Clique em **"Create Database"**

## 2. Conectar Banco ao Serviço

### Após criar o banco:
1. Vá para o seu **Web Service**
2. Clique na aba **"Environment"**
3. Clique em **"Add Environment Variable"**
4. Adicione:
   - **Key**: `DATABASE_URL`
   - **Value**: Use a URL de conexão do PostgreSQL que aparece no dashboard do banco

### URL deve ter este formato:
```
postgresql://username:password@hostname:port/database?sslmode=require
```

## 3. Verificar Variáveis de Ambiente

Certifique-se que estas variáveis estão configuradas no Render:

```
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NODE_ENV=production
PORT=10000
```

## 4. Forçar Redeploy

Após configurar o banco:
1. Vá para **"Manual Deploy"**
2. Clique em **"Deploy latest commit"**
3. Aguarde o deploy finalizar

## 5. Testar Conexão

Use estes endpoints para testar:

### Verificação completa:
```
https://sua-app.onrender.com/api/render-check
```

### Status do banco:
```
https://sua-app.onrender.com/api/db-status
```

## 6. Inicializar Banco (se necessário)

Se o banco estiver vazio, acesse:
```
https://sua-app.onrender.com/api/init-db
```

Isso vai criar todas as tabelas e o usuário admin.

## 7. Logs para Debug

No dashboard do Render:
1. Vá para **"Logs"**
2. Procure por estas mensagens:
   - `✓ Database connection successful`
   - `❌ Database connection failed`
   - `Database info:` (mostra detalhes da conexão)

## Problemas Comuns:

### "Connection refused":
- Banco PostgreSQL não foi criado
- DATABASE_URL incorreta

### "SSL required":
- Adicione `?sslmode=require` na URL

### "Database does not exist":
- Nome do banco incorreto na URL
- Banco não foi inicializado

### "Authentication failed":
- Credenciais incorretas na URL
- Usuario/senha do banco errados

## Alternativa: Banco Externo

Se o PostgreSQL do Render não funcionar, você pode usar:

### Supabase (Grátis):
1. Crie conta em supabase.com
2. Crie novo projeto
3. Vá em Settings → Database
4. Copie a connection string
5. Cole no Render como DATABASE_URL

### Neon (Grátis):
1. Crie conta em neon.tech
2. Crie database
3. Copie connection string
4. Cole no Render como DATABASE_URL

Ambos oferecem PostgreSQL gratuito e são compatíveis com o sistema.