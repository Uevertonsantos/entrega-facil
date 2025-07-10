# 🚀 SOLUÇÃO FINAL PARA O RENDER

## 💡 DIAGNÓSTICO DOS ERROS

1. **Erro no login:** O banco não tem as tabelas criadas
2. **Erro na inicialização:** Problema no código de criação das tabelas

## ✅ SOLUÇÃO DEFINITIVA

### 1. **SUBSTITUIR ARQUIVO COMPLETO: `server/db.ts`**

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
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

// Função para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    console.log("Iniciando criação das tabelas...");
    
    // Criar tabela admin_users
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR NOT NULL UNIQUE,
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        role VARCHAR NOT NULL DEFAULT 'admin',
        reset_token VARCHAR,
        reset_token_expiry TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar tabela merchants
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        business_name VARCHAR,
        cnpj_cpf VARCHAR NOT NULL DEFAULT '',
        phone VARCHAR NOT NULL,
        email VARCHAR,
        password VARCHAR,
        address TEXT NOT NULL,
        cep VARCHAR(10),
        city VARCHAR NOT NULL DEFAULT '',
        business_type VARCHAR,
        type VARCHAR NOT NULL,
        plan_type VARCHAR NOT NULL,
        plan_value NUMERIC NOT NULL,
        current_balance NUMERIC DEFAULT 0.00,
        total_owed NUMERIC DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar tabela deliverers
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS deliverers (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        vehicle_type VARCHAR NOT NULL,
        vehicle_model VARCHAR,
        vehicle_plate VARCHAR,
        platform_fee_percentage NUMERIC(5,2) DEFAULT 15.00,
        is_active BOOLEAN DEFAULT true,
        is_online BOOLEAN DEFAULT false,
        current_deliveries INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar tabela deliveries
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL,
        deliverer_id INTEGER,
        customer_name VARCHAR NOT NULL,
        customer_phone VARCHAR,
        customer_cpf VARCHAR(14),
        order_description TEXT NOT NULL,
        pickup_address TEXT NOT NULL,
        pickup_cep VARCHAR(10),
        delivery_address TEXT NOT NULL,
        delivery_cep VARCHAR(10),
        reference_point TEXT,
        payment_method VARCHAR NOT NULL DEFAULT 'dinheiro',
        status VARCHAR NOT NULL,
        priority VARCHAR NOT NULL DEFAULT 'medium',
        price NUMERIC(10,2) NOT NULL,
        delivery_fee NUMERIC(10,2) NOT NULL,
        deliverer_payment NUMERIC(10,2),
        platform_fee NUMERIC(10,2),
        merchant_owes NUMERIC(10,2),
        deliverer_earns NUMERIC(10,2),
        platform_fee_percentage NUMERIC(5,2),
        platform_fee_amount NUMERIC(10,2),
        notes TEXT,
        scheduled_time TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar tabela neighborhoods
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        city VARCHAR NOT NULL,
        state VARCHAR NOT NULL DEFAULT '',
        average_distance NUMERIC(5,2) NOT NULL,
        base_fare NUMERIC(10,2) NOT NULL DEFAULT 5.00,
        delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 8.00,
        platform_fee NUMERIC(10,2) NOT NULL DEFAULT 2.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar tabela admin_settings
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        setting_type VARCHAR NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Todas as tabelas foram criadas com sucesso!");
    
    // Criar usuário admin se não existir
    const adminExists = await db.execute(sql`
      SELECT COUNT(*) as count FROM admin_users WHERE username = 'admin'
    `);
    
    if (adminExists.rows[0].count === '0') {
      await db.execute(sql`
        INSERT INTO admin_users (username, email, password, name, role)
        VALUES ('admin', 'admin@entregafacil.com', 'admin123', 'Administrator', 'admin')
      `);
      console.log("Usuário admin criado com sucesso!");
    } else {
      console.log("Usuário admin já existe!");
    }
    
    return { success: true, message: "Database initialized successfully" };
  } catch (error) {
    console.error("Erro ao inicializar database:", error);
    return { success: false, message: error.message };
  }
}
```

### 2. **SUBSTITUIR ENDPOINT NO `server/routes.ts`**

```typescript
// Database initialization endpoint (for new deployments)
app.post('/api/init-db', async (req, res) => {
  try {
    const { initializeDatabase } = await import('./db');
    const result = await initializeDatabase();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: "Database initialized successfully. Admin user created.",
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.message
      });
    }
  } catch (error) {
    console.error("Erro completo na inicialização:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to initialize database",
      error: error.message
    });
  }
});
```

### 3. **ADICIONAR NO `server/index.ts`**

```typescript
// No início do arquivo, após as importações
import { initializeDatabase } from './db';

// Logo após inicializar o Express
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Tentar inicializar o banco automaticamente
  if (process.env.NODE_ENV === 'production') {
    console.log("Tentando inicializar banco automaticamente...");
    try {
      await initializeDatabase();
      console.log("Banco inicializado automaticamente!");
    } catch (error) {
      console.warn("Falha na inicialização automática:", error);
    }
  }
});
```

### 4. **VARIÁVEIS DE AMBIENTE NO RENDER**

```
DATABASE_URL=sua_url_postgresql_completa
SESSION_SECRET=entregafacil-session-secret-2025
JWT_SECRET=entregafacil-jwt-secret-2025
NODE_ENV=production
```

### 5. **PASSO A PASSO FINAL**

1. **Fazer upload** dos arquivos corrigidos no GitHub
2. **Configurar variáveis** no Render
3. **Aguardar deploy** 
4. **Acessar:** `https://seu-app.onrender.com/init-db` (só para garantir)
5. **Login:** `https://seu-app.onrender.com/admin-login`
6. **Credenciais:** admin / admin123

### 6. **BACKUP - COMANDOS MANUAIS**

Se ainda der problema, execute no terminal do Render:

```bash
# Conectar ao banco
psql $DATABASE_URL

# Criar usuário admin manualmente
INSERT INTO admin_users (username, email, password, name, role)
VALUES ('admin', 'admin@entregafacil.com', 'admin123', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

# Sair do psql
\q
```

## 🎯 RESULTADO ESPERADO

Após seguir estes passos:
- ✅ Banco de dados criado automaticamente
- ✅ Usuário admin criado: admin / admin123
- ✅ Sistema funcionando 100% no Render
- ✅ Login admin funcionando perfeitamente