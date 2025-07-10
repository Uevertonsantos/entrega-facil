# Fix: Erro "relação 'bairros' não existe" no Render

## Problema Identificado

O erro nos logs do Render mostra:
```
Pilha de erro: erro: relação 'bairros' não existe
```

Isso significa que a tabela `neighborhoods` (bairros) não foi criada no banco PostgreSQL do Render.

## Causa Raiz

O esquema do banco de dados não foi aplicado corretamente no ambiente Render. O Drizzle ORM precisa fazer o "push" das tabelas para o banco.

## Solução

### 1. Configurar DATABASE_URL no Render
Certifique-se de que a variável `DATABASE_URL` está configurada corretamente no Render com a string de conexão PostgreSQL.

### 2. Executar Push do Esquema
No ambiente Render, execute o comando:
```bash
npm run db:push
```

### 3. Verificar Tabelas Criadas
Após o push, as seguintes tabelas devem existir:
- `sessions`
- `users` 
- `merchants`
- `neighborhoods` (bairros)
- `deliverers`
- `deliveries`
- `admin_users`
- `admin_settings`
- `deliverer_payments`
- `merchant_payments`
- `client_installations`
- `client_customers`
- `client_deliveries`

## Script de Verificação

Adicione este endpoint temporário para verificar se as tabelas existem:

```typescript
// Endpoint para verificar tabelas (temporário)
app.get('/api/check-tables', async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({ 
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Comandos para Render

### Via Dashboard Render
1. Acesse o dashboard do Render
2. Vá para o projeto
3. Acesse o terminal/console
4. Execute: `npm run db:push`

### Via CLI Local (se configurado)
```bash
# Exportar DATABASE_URL do Render
export DATABASE_URL="postgresql://user:password@host:port/database"

# Executar push
npm run db:push
```

## Validação

Após aplicar o esquema:
1. Teste criar uma cidade novamente
2. Verifique se o erro "relação 'bairros' não existe" desaparece
3. Confirm que a cidade é criada com sucesso

## Status

- ✅ **Problema**: Identificado - tabela `neighborhoods` não existe
- ✅ **Solução**: Executar `npm run db:push` no Render
- ⏳ **Próximo passo**: Aplicar esquema no banco do Render