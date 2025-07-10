# Instruções para Setup do Banco no Render

## Problema
O erro "relação 'bairros' não existe" indica que as tabelas do banco não foram criadas no PostgreSQL do Render.

## Solução Criada
Adicionei um endpoint especial para aplicar o schema do banco de dados remotamente.

## Como Usar

### 1. Fazer Deploy no Render
- Faça o deploy normalmente no Render
- Aguarde o build completar

### 2. Executar Setup do Banco
Faça uma requisição POST para o endpoint especial:

```bash
curl -X POST https://sua-app.render.com/api/setup-database \
  -H "Content-Type: application/json" \
  -d '{"secret": "setup-entrega-facil-2025"}'
```

**Ou usando um cliente HTTP como Postman:**
- URL: `https://sua-app.render.com/api/setup-database`
- Method: `POST`
- Body (JSON):
```json
{
  "secret": "setup-entrega-facil-2025"
}
```

### 3. Verificar Resultado
O endpoint retornará:
- **Sucesso**: `{"success": true, "message": "Database schema applied successfully"}`
- **Erro**: Detalhes do erro para debugging

### 4. Testar Criação de Cidade
Após o setup bem-sucedido, tente criar uma cidade novamente no painel admin.

## Segurança
- O endpoint requer uma chave secreta: `setup-entrega-facil-2025`
- Só deve ser usado uma vez para configurar o banco
- Pode ser removido após o setup inicial

## Tabelas que Serão Criadas
- `sessions` - Sessões de usuário
- `users` - Usuários do sistema  
- `merchants` - Comerciantes
- `neighborhoods` - Bairros/Cidades
- `deliverers` - Entregadores
- `deliveries` - Entregas
- `admin_users` - Usuários administrativos
- `admin_settings` - Configurações do sistema
- `deliverer_payments` - Pagamentos dos entregadores
- `merchant_payments` - Pagamentos dos comerciantes
- `client_installations` - Instalações cliente
- `client_customers` - Clientes das instalações
- `client_deliveries` - Entregas das instalações

## Próximos Passos
1. Execute o setup do banco
2. Teste a criação de cidade
3. Se funcionar, o sistema estará 100% operacional no Render