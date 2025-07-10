# Configuração do Render - Entrega Fácil

## Passo 1: Atualize o GitHub

### Arquivos para remover:
- `server/replitAuth.ts` (deletar completamente)

### Arquivos para criar/atualizar:

**1. server/auth.ts** (criar novo arquivo):
```typescript
import jwt from "jsonwebtoken";
import type { Express, RequestHandler } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

**2. server/db.ts** (substituir conteúdo):
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

**3. server/routes.ts** (atualizar import):
```typescript
// Substituir a linha:
import { setupAuth, isAuthenticated as replitIsAuthenticated } from "./replitAuth";

// Por:
import { isAdmin, isMerchant, isDeliverer, isAuthenticated, generateToken, verifyToken } from "./auth";

// Remover a linha:
await setupAuth(app);

// Substituir todas as chamadas jwt.sign(...) por generateToken(...)
```

## Passo 2: Variáveis de Ambiente no Render

Configure essas variáveis no Render:

```
DATABASE_URL=postgresql://sua_conexao_postgresql
SESSION_SECRET=sua_chave_secreta_aleatoria_32_caracteres
JWT_SECRET=sua_chave_jwt_secreta_32_caracteres
NODE_ENV=production
```

## Passo 3: Após Deploy

1. Acesse: `https://seu-app.onrender.com/init-db`
2. Clique em "Inicializar Database"
3. Aguarde a criação do usuário admin

## Passo 4: Login Admin

**Credenciais:**
- Username: admin
- Password: admin123

## Comandos para gerar chaves secretas:

```bash
# Para SESSION_SECRET
openssl rand -base64 32

# Para JWT_SECRET
openssl rand -base64 32
```

## Troubleshooting

Se der erro "relation does not exist":
1. Execute: `npm run db:push` no terminal do Render
2. Ou acesse `/init-db` para inicializar automaticamente