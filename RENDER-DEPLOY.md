# DEPLOY PARA RENDER - PASSO A PASSO

## 1. ARQUIVOS PARA SUBSTITUIR NO GITHUB

### Arquivo: `server/auth.ts` (CRIAR NOVO)
```typescript
import jwt from "jsonwebtoken";
import type { Express, RequestHandler } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "entregafacil-secret-key-2025";

export const isAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isMerchant = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'merchant') {
      return res.status(403).json({ message: "Merchant access required" });
    }
    req.merchant = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isDeliverer = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'deliverer') {
      return res.status(403).json({ message: "Deliverer access required" });
    }
    req.deliverer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAuthenticated = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
```

### Arquivo: `server/db.ts` (SUBSTITUIR)
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
```

### Arquivo: `package.json` (ADICIONAR DEPENDÊNCIAS)
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "@types/pg": "^8.10.9",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

## 2. ARQUIVOS PARA DELETAR NO GITHUB

- `server/replitAuth.ts` (DELETAR COMPLETAMENTE)

## 3. VARIÁVEIS DE AMBIENTE NO RENDER

```
DATABASE_URL=sua_url_postgresql_do_render
SESSION_SECRET=entregafacil-session-secret-2025
JWT_SECRET=entregafacil-jwt-secret-2025
NODE_ENV=production
```

## 4. COMANDOS PARA GERAR SECRETS SEGUROS

```bash
# Gerar SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar JWT_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 5. APÓS DEPLOY NO RENDER

1. **Inicializar Database:**
   - Acesse: `https://seu-app.onrender.com/init-db`
   - Clique em "Inicializar Database"

2. **Credenciais Admin:**
   - **Username:** admin
   - **Password:** admin123

## 6. TROUBLESHOOTING

### Se der erro "relation does not exist":
```bash
# No terminal do Render:
npm run db:push
```

### Se der erro "JWT_SECRET not defined":
- Verifique se a variável JWT_SECRET está configurada no Render
- Use o valor: `entregafacil-jwt-secret-2025` ou gere um novo

### Se der erro "Cannot connect to database":
- Verifique se DATABASE_URL está correto
- Certifique-se de que o banco PostgreSQL está ativo no Render

## 7. VERIFICAR SE FUNCIONOU

1. **Teste de saúde:** `https://seu-app.onrender.com/api/health`
2. **Login admin:** `https://seu-app.onrender.com/admin-login`
3. **Credenciais:** admin / admin123