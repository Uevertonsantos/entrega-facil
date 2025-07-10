# Render Deployment Debug Guide

## Status Check URLs

Use these URLs to test your Render deployment:

### 1. Health Check
```
https://your-render-app.onrender.com/api/health
```

### 2. Database Status
```
https://your-render-app.onrender.com/api/db-status
```

### 3. Complete System Check
```
https://your-render-app.onrender.com/api/render-check
```

## Admin Login Test

Test admin login with curl:

```bash
curl -X POST https://your-render-app.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Common Issues and Solutions

### 1. Database Connection Issues
- Verify DATABASE_URL environment variable is set in Render
- Check PostgreSQL addon is properly connected
- Ensure SSL configuration is correct for production

### 2. Admin User Missing
- The system will auto-create admin user on first login attempt with admin/admin123
- Check logs for user creation process

### 3. JWT Token Issues
- Verify JWT_SECRET environment variable is set
- Check token generation in logs

### 4. CORS Issues
- System includes comprehensive CORS headers
- Check browser network tab for CORS errors

## Log Analysis

Look for these patterns in Render logs:

### Success Patterns:
```
✓ Database connection successful
✓ Admin user found
✓ Password correct, generating token
✓ Token generated successfully
```

### Error Patterns:
```
❌ Database connection failed
❌ Admin user not found
❌ Password incorrect
❌ Error generating token
```

## Environment Variables Required

Ensure these are set in Render:

1. `DATABASE_URL` - PostgreSQL connection string
2. `JWT_SECRET` - Secret for JWT token generation (optional, will use default)
3. `NODE_ENV` - Should be set to "production"
4. `PORT` - Automatically set by Render

## Troubleshooting Steps

1. **First, check system status:**
   - Visit `/api/render-check` endpoint
   - Verify all checks pass

2. **If database fails:**
   - Check DATABASE_URL in Render dashboard
   - Verify PostgreSQL service is running
   - Check connection limits

3. **If admin login fails:**
   - Check Render logs for detailed error messages
   - Verify username/password (admin/admin123)
   - Try admin creation endpoint manually

4. **If frontend can't reach backend:**
   - Check CORS configuration
   - Verify API endpoint URLs in frontend
   - Check Render service is deployed and running

## Manual Admin User Creation

If auto-creation fails, use this endpoint to create admin manually:

```bash
curl -X POST https://your-render-app.onrender.com/api/init-db \
  -H "Content-Type: application/json" \
  -d '{}'
```

This will initialize the database and create the default admin user.