import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated as replitIsAuthenticated } from "./replitAuth";
import { fetchCnpjInfo, validateCnpj, validateCpf } from "./services/cnpjService";
import { emailService } from "./services/emailService";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { insertMerchantSchema, insertDelivererSchema, insertDeliverySchema } from "@shared/schema";
import { z } from "zod";
import { calculateDeliveryDistance, applySurgePricing, getDeliveryZone } from "./services/distanceService";

// Admin credentials (in production, these should be in environment variables)
const ADMIN_CREDENTIALS = {
  email: "admin@deliveryexpress.com",
  password: "admin123", // This will be hashed
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify admin token
const isAdmin = (req: any, res: any, next: any) => {
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

// Middleware to verify merchant token
const isMerchant = (req: any, res: any, next: any) => {
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

// Middleware to verify deliverer token
const isDeliverer = (req: any, res: any, next: any) => {
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

// Middleware to verify any authenticated user (admin, merchant, or deliverer)
const isAuthenticated = (req: any, res: any, next: any) => {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Public endpoints (no authentication required)
  
  // Public endpoint for getting merchants (for client setup)
  app.get('/api/merchants/list', async (req, res) => {
    try {
      const merchants = await storage.getMerchants();
      // Return only basic info for selection
      const merchantsForSelection = merchants.map(merchant => ({
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        phone: merchant.phone,
        address: merchant.address,
        cep: merchant.cep,
        cnpj: merchant.cnpj,
        type: merchant.type,
        planValue: merchant.planValue,
        platformFee: merchant.platformFee
      }));
      res.json(merchantsForSelection);
    } catch (error) {
      console.error("Error fetching merchants for selection:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  });

  // Public endpoint for getting active plans (used in client setup)
  app.get('/api/plans/active', async (req, res) => {
    try {
      const plans = await storage.getAdminSettings();
      const planSettings = plans.filter(setting => setting.settingKey.startsWith('plan_') && setting.settingType === 'plan');
      
      if (planSettings.length === 0) {
        // Create default plans if none exist
        const defaultPlans = [
          {
            id: 'basic',
            name: 'Plano Básico',
            price: 99.00,
            period: 'monthly',
            deliveryLimit: 50,
            features: ['Até 50 entregas por mês', 'Suporte por email', 'Painel básico'],
            description: 'Ideal para pequenos negócios que estão começando',
            isActive: true,
            priority: 1,
            color: '#3b82f6'
          },
          {
            id: 'standard',
            name: 'Plano Padrão',
            price: 149.00,
            period: 'monthly',
            deliveryLimit: 150,
            features: ['Até 150 entregas por mês', 'Suporte prioritário', 'Relatórios avançados', 'Integração com WhatsApp'],
            description: 'Perfeito para negócios em crescimento',
            isActive: true,
            priority: 2,
            color: '#10b981'
          },
          {
            id: 'premium',
            name: 'Plano Premium',
            price: 299.00,
            period: 'monthly',
            deliveryLimit: null,
            features: ['Entregas ilimitadas', 'Suporte 24/7', 'API personalizada', 'Múltiplos usuários', 'Relatórios em tempo real'],
            description: 'Para negócios que precisam de máxima flexibilidade',
            isActive: true,
            priority: 3,
            color: '#f59e0b'
          }
        ];
        
        // Create default plans
        for (const plan of defaultPlans) {
          await storage.createAdminSetting({
            settingKey: `plan_${plan.id}`,
            settingValue: JSON.stringify(plan),
            settingType: 'plan',
            description: `Configuração do ${plan.name}`
          });
        }
        
        // Return only active plans
        res.json(defaultPlans.filter(plan => plan.isActive));
      } else {
        const parsedPlans = planSettings.map(setting => {
          try {
            return JSON.parse(setting.settingValue);
          } catch (e) {
            console.error("Error parsing plan setting:", setting.settingKey, e);
            return null;
          }
        }).filter(plan => plan !== null && plan.isActive);
        
        res.json(parsedPlans);
      }
    } catch (error) {
      console.error("Error fetching active plans:", error);
      res.status(500).json({ message: "Failed to fetch active plans" });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Get current admin credentials endpoint
  app.get('/api/data/admin-credentials', async (req, res) => {
    try {
      const adminUser = await storage.getAdminUser(1);
      if (!adminUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário administrativo não encontrado" 
        });
      }
      
      res.json({ 
        success: true, 
        credentials: {
          username: adminUser.username,
          email: adminUser.email,
          // Não retornar senha por segurança
          hasPassword: !!adminUser.password
        }
      });
    } catch (error) {
      console.error("Error getting admin credentials:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Admin login endpoint (with username support)
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Get admin user by username
      const adminUser = await storage.getAdminUserByUsername(username);
      
      if (!adminUser) {
        return res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
      
      // Check password (using direct comparison for now)
      if (adminUser.password === password) {
        const token = jwt.sign(
          { id: adminUser.id, username: adminUser.username, email: adminUser.email, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          success: true, 
          token,
          admin: adminUser,
          message: "Login realizado com sucesso" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Get current admin credentials endpoint
  app.get('/api/get-admin-credentials', async (req, res) => {
    try {
      const adminUser = await storage.getAdminUser(1);
      if (!adminUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário administrativo não encontrado" 
        });
      }
      
      res.json({ 
        success: true, 
        credentials: {
          username: adminUser.username,
          email: adminUser.email,
          password: adminUser.password // Em produção, nunca retorne a senha
        }
      });
    } catch (error) {
      console.error("Error getting admin credentials:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Update admin credentials endpoint
  app.put('/api/admin-update-credentials', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Todos os campos são obrigatórios" 
        });
      }
      
      // Update admin user (ID 1 is the default admin)
      await storage.updateAdminUser(1, { 
        username, 
        email, 
        password 
      });
      
      res.json({ 
        success: true, 
        message: "Credenciais administrativas atualizadas com sucesso" 
      });
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Password reset request endpoint
  app.post('/api/admin/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email é obrigatório" 
        });
      }
      
      // Get admin user by email
      const adminUser = await storage.getAdminUserByEmail(email);
      
      if (!adminUser) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: "Se o email existir, você receberá as instruções para redefinir a senha" 
        });
      }
      
      // Generate reset token
      const resetToken = emailService.generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Save reset token to database
      await storage.setPasswordResetToken(adminUser.id, resetToken, resetTokenExpiry);
      
      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, adminUser.name);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Instruções enviadas para o email" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Erro ao enviar email. Verifique a configuração do serviço de email." 
        });
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Password reset endpoint
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Token e nova senha são obrigatórios" 
        });
      }
      
      // Get admin user by reset token
      const adminUser = await storage.getAdminUserByResetToken(token);
      
      if (!adminUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Token inválido ou expirado" 
        });
      }
      
      // Update password and clear reset token
      await storage.updateAdminUser(adminUser.id, { password: newPassword });
      await storage.clearResetToken(adminUser.id);
      
      res.json({ 
        success: true, 
        message: "Senha redefinida com sucesso" 
      });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Email configuration endpoints (without authentication for now)
  app.get('/api/email-status', async (req, res) => {
    try {
      res.json({
        configured: emailService.isConfigured(),
        message: emailService.isConfigured() ? "Email configurado" : "Email não configurado"
      });
    } catch (error) {
      console.error("Error checking email status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  app.post('/api/email-settings', async (req, res) => {
    try {
      const { gmailUser, gmailAppPassword } = req.body;
      
      if (!gmailUser || !gmailAppPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Email e senha de app são obrigatórios" 
        });
      }
      
      // Save to environment variables (in production, use secure storage)
      process.env.GMAIL_USER = gmailUser;
      process.env.GMAIL_APP_PASSWORD = gmailAppPassword;
      
      // Reinitialize email service
      emailService.setupTransporter();
      
      res.json({ 
        success: true, 
        message: "Configurações de email salvas com sucesso" 
      });
    } catch (error) {
      console.error("Error saving email settings:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  app.post('/api/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email é obrigatório" 
        });
      }
      
      const emailSent = await emailService.sendEmail({
        to: email,
        subject: "Teste de Email - Delivery Express",
        html: `
          <h2>Teste de Email</h2>
          <p>Este é um email de teste do sistema Delivery Express.</p>
          <p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
          <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
        `,
      });
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Email de teste enviado com sucesso" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Erro ao enviar email de teste. Verifique as configurações." 
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Merchant login endpoint
  app.post('/api/merchant/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get merchant by email
      const merchant = await storage.getMerchantByEmail(email);
      
      if (!merchant) {
        return res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
      
      // For simplicity, using password field (in production, use bcrypt)
      if (merchant.email === email && merchant.password === password) {
        const token = jwt.sign(
          { id: merchant.id, email: merchant.email, role: 'merchant' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          success: true, 
          token,
          merchant,
          message: "Login realizado com sucesso" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
    } catch (error) {
      console.error("Error in merchant login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // CNPJ lookup route
  app.post("/api/cnpj/lookup", async (req, res) => {
    try {
      const { cnpj } = req.body;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }
      
      // Valida CNPJ
      if (!validateCnpj(cnpj)) {
        return res.status(400).json({ message: "CNPJ inválido" });
      }
      
      const cnpjInfo = await fetchCnpjInfo(cnpj);
      
      if (!cnpjInfo) {
        return res.status(404).json({ message: "CNPJ não encontrado" });
      }
      
      res.json(cnpjInfo);
    } catch (error) {
      console.error("CNPJ lookup error:", error);
      res.status(500).json({ message: "Erro ao buscar informações do CNPJ" });
    }
  });

  // Merchant register endpoint
  app.post('/api/merchant/register', async (req, res) => {
    try {
      const { name, email, phone, password, businessName, cnpjCpf, type, address, cep, city, state, planType, planInterval } = req.body;
      
      // Check if email already exists
      const existingMerchant = await storage.getMerchantByEmail(email);
      if (existingMerchant) {
        return res.status(400).json({ 
          success: false, 
          message: "Email já cadastrado" 
        });
      }
      
      // Create new merchant
      const merchant = await storage.createMerchant({
        name,
        email,
        phone,
        password,
        businessName,
        cnpjCpf,
        type,
        address,
        cep,
        city,
        state,
        planType,
        planInterval
      });
      
      res.json({ 
        success: true, 
        merchant,
        message: "Cadastro realizado com sucesso" 
      });
    } catch (error) {
      console.error("Error in merchant register:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Deliverer register endpoint
  app.post('/api/deliverer/register', async (req, res) => {
    try {
      const { name, email, phone, password, cpf, address, city, state, vehicleType, vehicleModel, vehiclePlate, bankAccount, pixKey } = req.body;
      
      // Check if email already exists
      const existingDeliverer = await storage.getDelivererByEmail(email);
      if (existingDeliverer) {
        return res.status(400).json({ 
          success: false, 
          message: "Email já cadastrado" 
        });
      }
      
      // Create new deliverer
      const deliverer = await storage.createDeliverer({
        name,
        email,
        phone,
        password,
        cpf,
        address,
        city,
        state,
        vehicleType,
        vehicleModel,
        vehiclePlate,
        bankAccount,
        pixKey
      });
      
      res.json({ 
        success: true, 
        deliverer,
        message: "Cadastro realizado com sucesso" 
      });
    } catch (error) {
      console.error("Error in deliverer register:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Deliverer login endpoint
  app.post('/api/deliverer/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get deliverer by email
      const deliverer = await storage.getDelivererByEmail(email);
      
      if (!deliverer) {
        return res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
      
      // For simplicity, using password field (in production, use bcrypt)
      if (deliverer.email === email && deliverer.password === password) {
        const token = jwt.sign(
          { id: deliverer.id, email: deliverer.email, role: 'deliverer' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          success: true, 
          token,
          deliverer,
          message: "Login realizado com sucesso" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Credenciais inválidas" 
        });
      }
    } catch (error) {
      console.error("Error in deliverer login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Auth routes - return current user info based on token
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For local auth system, we return the user info from the token
      const userInfo = req.user;
      
      // If it's a merchant, get full merchant data
      if (userInfo.role === 'merchant') {
        const merchant = await storage.getMerchant(Number(userInfo.id));
        res.json({ ...userInfo, merchant });
      }
      // If it's a deliverer, get full deliverer data  
      else if (userInfo.role === 'deliverer') {
        const deliverer = await storage.getDeliverer(Number(userInfo.id));
        res.json({ ...userInfo, deliverer });
      }
      // If it's admin, return admin info
      else if (userInfo.role === 'admin') {
        res.json({ ...userInfo, admin: true });
      }
      else {
        res.json(userInfo);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Merchant routes
  app.get('/api/merchants', isAuthenticated, async (req, res) => {
    try {
      const merchants = await storage.getMerchants();
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  });

  // Merchant app route - must come before /api/merchants/:id
  app.get('/api/merchants/current', isAuthenticated, async (req: any, res) => {
    const userInfo = req.user;
    
    // For local JWT auth, check if user is a merchant
    if (userInfo.role === 'merchant') {
      const merchant = await storage.getMerchant(Number(userInfo.id));
      if (!merchant) {
        return res.json({ isMerchant: false, message: "Merchant not found" });
      }
      res.json({ isMerchant: true, ...merchant });
    } else {
      return res.json({ isMerchant: false, message: "User is not registered as a merchant" });
    }
  });

  app.get('/api/merchants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid merchant ID" });
      }
      const merchant = await storage.getMerchant(id);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      res.json(merchant);
    } catch (error) {
      console.error("Error fetching merchant:", error);
      res.status(500).json({ message: "Failed to fetch merchant" });
    }
  });

  app.post('/api/merchants', isAuthenticated, async (req, res) => {
    try {
      console.log("Received merchant data:", req.body);
      
      const merchantData = insertMerchantSchema.parse(req.body);
      console.log("Parsed merchant data:", merchantData);
      
      const merchant = await storage.createMerchant(merchantData);
      console.log("Created merchant:", merchant);
      
      res.status(201).json(merchant);
    } catch (error) {
      console.error("Detailed error creating merchant:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid merchant data", errors: error.errors });
      }
      
      // Check for duplicate email error
      if (error.code === '23505' && error.constraint === 'merchants_email_key') {
        return res.status(400).json({ message: "Este email já está cadastrado no sistema" });
      }
      
      // Check for database connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(500).json({ message: "Erro de conexão com o banco de dados" });
      }
      
      console.error("Error creating merchant:", error);
      res.status(500).json({ message: "Failed to create merchant" });
    }
  });

  app.put('/api/merchants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const merchantData = insertMerchantSchema.partial().parse(req.body);
      const merchant = await storage.updateMerchant(id, merchantData);
      res.json(merchant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid merchant data", errors: error.errors });
      }
      console.error("Error updating merchant:", error);
      res.status(500).json({ message: "Failed to update merchant" });
    }
  });

  app.delete('/api/merchants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMerchant(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting merchant:", error);
      res.status(500).json({ message: "Failed to delete merchant" });
    }
  });

  // Record merchant payment endpoint
  app.post('/api/merchants/record-payment', isAuthenticated, async (req, res) => {
    try {
      const { merchantId, amount } = req.body;
      
      if (!merchantId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Merchant ID and valid amount are required" });
      }
      
      const merchant = await storage.getMerchant(merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      // Update merchant balance (add payment)
      const currentBalance = parseFloat(merchant.currentBalance?.toString() || "0");
      const newBalance = currentBalance + amount;
      
      await storage.updateMerchant(merchantId, {
        currentBalance: newBalance.toString(),
        updatedAt: new Date()
      });
      
      res.json({ 
        message: "Payment recorded successfully",
        newBalance: newBalance.toFixed(2)
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Deliverer routes
  app.get('/api/deliverers', isAuthenticated, async (req, res) => {
    try {
      const deliverers = await storage.getDeliverers();
      res.json(deliverers);
    } catch (error) {
      console.error("Error fetching deliverers:", error);
      res.status(500).json({ message: "Failed to fetch deliverers" });
    }
  });

  app.get('/api/deliverers/active', isAuthenticated, async (req, res) => {
    try {
      const deliverers = await storage.getActiveDeliverers();
      res.json(deliverers);
    } catch (error) {
      console.error("Error fetching active deliverers:", error);
      res.status(500).json({ message: "Failed to fetch active deliverers" });
    }
  });

  // Deliverer app route - must come before /api/deliverers/:id
  app.get('/api/deliverers/current', isAuthenticated, async (req: any, res) => {
    const userInfo = req.user;
    
    // For local JWT auth, we need to check if user is a deliverer
    if (userInfo.role === 'deliverer') {
      const deliverer = await storage.getDeliverer(Number(userInfo.id));
      if (!deliverer) {
        return res.json({ isDeliverer: false, message: "Deliverer not found" });
      }
      res.json({ isDeliverer: true, ...deliverer });
    } else {
      return res.json({ isDeliverer: false, message: "User is not registered as a deliverer" });
    }
  });

  app.get('/api/deliverers/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role === 'deliverer') {
        const stats = await storage.getDelivererStats(Number(userInfo.id));
        res.json(stats);
      } else {
        return res.status(403).json({ message: "Only deliverers can access this endpoint" });
      }
    } catch (error) {
      console.error("Error fetching deliverer stats:", error);
      res.status(500).json({ message: "Failed to fetch deliverer stats" });
    }
  });

  // Commission report for deliverers
  app.get('/api/deliverers/commission-report', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role !== 'deliverer') {
        return res.status(403).json({ message: "Only deliverers can access this endpoint" });
      }
      
      const delivererId = Number(userInfo.id);
      
      const deliveries = await storage.getDeliveriesByDeliverer(delivererId);
      const completedDeliveries = deliveries.filter(d => d.status === 'completed');
      
      const commissionReport = completedDeliveries.map(delivery => ({
        id: delivery.id,
        customerName: delivery.customerName,
        deliveryAddress: delivery.deliveryAddress,
        deliveryFee: parseFloat(delivery.deliveryFee),
        commissionPercentage: parseFloat(delivery.commissionPercentage || "20.00"),
        commissionAmount: parseFloat(delivery.commissionAmount || "0.00"),
        delivererPayment: parseFloat(delivery.delivererPayment || "0.00"),
        completedAt: delivery.completedAt,
        createdAt: delivery.createdAt
      }));
      
      const totals = commissionReport.reduce((acc, delivery) => ({
        totalDeliveryFee: acc.totalDeliveryFee + delivery.deliveryFee,
        totalCommission: acc.totalCommission + delivery.commissionAmount,
        totalPayment: acc.totalPayment + delivery.delivererPayment
      }), {
        totalDeliveryFee: 0,
        totalCommission: 0,
        totalPayment: 0
      });
      
      res.json({
        deliveries: commissionReport,
        totals
      });
    } catch (error) {
      console.error("Error fetching commission report:", error);
      res.status(500).json({ message: "Failed to fetch commission report" });
    }
  });

  app.get('/api/deliverers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deliverer ID" });
      }
      const deliverer = await storage.getDeliverer(id);
      if (!deliverer) {
        return res.status(404).json({ message: "Deliverer not found" });
      }
      res.json(deliverer);
    } catch (error) {
      console.error("Error fetching deliverer:", error);
      res.status(500).json({ message: "Failed to fetch deliverer" });
    }
  });

  app.post('/api/deliverers', isAuthenticated, async (req, res) => {
    try {
      const delivererData = insertDelivererSchema.parse(req.body);
      const deliverer = await storage.createDeliverer(delivererData);
      res.status(201).json(deliverer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deliverer data", errors: error.errors });
      }
      
      // Check for duplicate email error
      if (error.code === '23505' && error.constraint === 'deliverers_email_key') {
        return res.status(400).json({ message: "Este email já está cadastrado no sistema" });
      }
      
      console.error("Error creating deliverer:", error);
      res.status(500).json({ message: "Failed to create deliverer" });
    }
  });

  app.put('/api/deliverers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const delivererData = insertDelivererSchema.partial().parse(req.body);
      const deliverer = await storage.updateDeliverer(id, delivererData);
      res.json(deliverer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deliverer data", errors: error.errors });
      }
      console.error("Error updating deliverer:", error);
      res.status(500).json({ message: "Failed to update deliverer" });
    }
  });

  app.delete('/api/deliverers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliverer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deliverer:", error);
      res.status(500).json({ message: "Failed to delete deliverer" });
    }
  });

  // Delivery routes
  app.get('/api/deliveries', isAuthenticated, async (req, res) => {
    try {
      const deliveries = await storage.getDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get('/api/deliveries/recent', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const deliveries = await storage.getRecentDeliveries(limit);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching recent deliveries:", error);
      res.status(500).json({ message: "Failed to fetch recent deliveries" });
    }
  });

  // Specific routes MUST come before parameterized routes
  app.get('/api/deliveries/available', isAuthenticated, async (req, res) => {
    try {
      const deliveries = await storage.getAvailableDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching available deliveries:", error);
      res.status(500).json({ message: "Failed to fetch available deliveries" });
    }
  });

  app.get('/api/deliveries/my-deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role === 'deliverer') {
        const deliveries = await storage.getDeliveriesByDeliverer(Number(userInfo.id));
        res.json(deliveries);
      } else {
        return res.status(403).json({ message: "Only deliverers can access this endpoint" });
      }
    } catch (error) {
      console.error("Error fetching my deliveries:", error);
      res.status(500).json({ message: "Failed to fetch my deliveries" });
    }
  });



  app.get('/api/deliveries/my-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a merchant
      if (userInfo.role === 'merchant') {
        const deliveries = await storage.getDeliveriesByMerchant(Number(userInfo.id));
        res.json(deliveries);
      } else {
        return res.status(403).json({ message: "Only merchants can access this endpoint" });
      }
    } catch (error) {
      console.error("Error fetching my delivery requests:", error);
      res.status(500).json({ message: "Failed to fetch my delivery requests" });
    }
  });

  app.get('/api/deliveries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid delivery ID" });
      }
      const delivery = await storage.getDelivery(id);
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({ message: "Failed to fetch delivery" });
    }
  });

  app.post('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a merchant
      if (userInfo.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can create deliveries" });
      }
      
      // Map frontend fields to database fields
      const deliveryData = {
        merchantId: req.body.merchantId || userInfo.id,
        delivererId: req.body.delivererId || null,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        customerCpf: req.body.customerCpf,
        orderDescription: req.body.orderDescription,
        pickupAddress: req.body.pickupAddress,
        pickupCep: req.body.pickupCep,
        deliveryAddress: req.body.deliveryAddress,
        deliveryCep: req.body.deliveryCep,
        referencePoint: req.body.referencePoint,
        status: 'pending',
        priority: req.body.priority || 'medium',
        price: String(req.body.deliveryFee || req.body.estimatedValue || "0.00"),
        deliveryFee: String(req.body.deliveryFee || "10.00"),
        delivererPayment: req.body.delivererPayment ? String(req.body.delivererPayment) : null,
        notes: req.body.notes || null,
      };
      
      const parsedData = insertDeliverySchema.parse(deliveryData);
      const delivery = await storage.createDelivery(parsedData);
      
      // Send real-time notification to all connected clients
      const broadcastToClients = (app as any).broadcastToClients;
      if (broadcastToClients) {
        broadcastToClients('new_delivery', {
          delivery,
          action: 'created',
          merchantId: userInfo.id
        });
      }
      
      res.status(201).json(delivery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.put('/api/deliveries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveryData = insertDeliverySchema.partial().parse(req.body);
      const delivery = await storage.updateDelivery(id, deliveryData);
      res.json(delivery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete('/api/deliveries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDelivery(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });

  // Patch route for delivery status updates
  app.patch('/api/deliveries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deliveryData = insertDeliverySchema.partial().parse(req.body);
      const delivery = await storage.updateDelivery(id, deliveryData);
      res.json(delivery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });





  app.post('/api/deliveries/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userInfo = req.user;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role !== 'deliverer') {
        return res.status(403).json({ message: "Only deliverers can accept deliveries" });
      }
      
      const delivererId = Number(userInfo.id);
      
      // Get deliverer info to calculate commission
      const deliverer = await storage.getDeliverer(delivererId);
      if (!deliverer) {
        return res.status(404).json({ message: "Deliverer not found" });
      }
      
      // Get delivery info to calculate commission
      const currentDelivery = await storage.getDelivery(id);
      if (!currentDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      // Calculate commission (platform commission from delivery fee)
      const deliveryFee = parseFloat(currentDelivery.deliveryFee);
      const commissionPercentage = parseFloat(deliverer.commissionPercentage || "20.00");
      const commissionAmount = (deliveryFee * commissionPercentage) / 100;
      const delivererPayment = deliveryFee - commissionAmount;
      
      const delivery = await storage.updateDelivery(id, {
        delivererId: delivererId,
        status: "in_progress",
        commissionPercentage: deliverer.commissionPercentage,
        commissionAmount: commissionAmount.toFixed(2),
        delivererPayment: delivererPayment.toFixed(2)
      });
      
      // Send real-time notification
      const broadcastToClients = (app as any).broadcastToClients;
      if (broadcastToClients) {
        broadcastToClients('delivery_accepted', {
          delivery,
          action: 'accepted',
          delivererId: delivererId
        });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error("Error accepting delivery:", error);
      res.status(500).json({ message: "Failed to accept delivery" });
    }
  });

  app.post('/api/deliveries/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userInfo = req.user;
      const { reason } = req.body;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role !== 'deliverer') {
        return res.status(403).json({ message: "Only deliverers can cancel deliveries" });
      }
      
      const delivery = await storage.updateDelivery(id, {
        status: "cancelled",
        notes: reason || "Cancelada pelo entregador"
      });
      res.json(delivery);
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      res.status(500).json({ message: "Failed to cancel delivery" });
    }
  });

  app.post('/api/deliveries/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userInfo = req.user;
      const { notes } = req.body;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role !== 'deliverer') {
        return res.status(403).json({ message: "Only deliverers can complete deliveries" });
      }
      
      // Get delivery info before updating
      const existingDelivery = await storage.getDelivery(id);
      if (!existingDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      const delivery = await storage.updateDelivery(id, {
        status: "completed",
        completedAt: new Date(),
        notes: notes || null
      });
      
      // Atualizar saldo devedor do comerciante
      if (existingDelivery.status !== 'completed') {
        const merchant = await storage.getMerchant(existingDelivery.merchantId);
        if (merchant) {
          const currentBalance = parseFloat(merchant.currentBalance?.toString() || "0");
          const totalOwed = parseFloat(merchant.totalOwed?.toString() || "0");
          const deliveryFee = parseFloat(existingDelivery.deliveryFee?.toString() || "0");
          
          await storage.updateMerchant(existingDelivery.merchantId, {
            currentBalance: (currentBalance - deliveryFee).toString(),
            totalOwed: (totalOwed + deliveryFee).toString(),
            updatedAt: new Date()
          });
        }
      }
      
      // Send real-time notification
      const broadcastToClients = (app as any).broadcastToClients;
      if (broadcastToClients) {
        broadcastToClients('delivery_completed', {
          delivery,
          action: 'completed',
          delivererId: userInfo.id
        });
      }
      
      res.json(delivery);
    } catch (error) {
      console.error("Error completing delivery:", error);
      res.status(500).json({ message: "Failed to complete delivery" });
    }
  });

  app.post('/api/deliveries/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userInfo = req.user;
      const { notes } = req.body;
      
      // For local JWT auth, check if user is a deliverer
      if (userInfo.role !== 'deliverer') {
        return res.status(403).json({ message: "Only deliverers can add notes" });
      }
      
      const delivery = await storage.updateDelivery(id, {
        notes: notes
      });
      res.json(delivery);
    } catch (error) {
      console.error("Error adding notes:", error);
      res.status(500).json({ message: "Failed to add notes" });
    }
  });

  // WhatsApp integration route (simulated)
  app.post('/api/whatsapp/send', isAuthenticated, async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      // Here you would integrate with WhatsApp API
      // For now, we'll just simulate a successful response
      console.log(`Sending WhatsApp message to ${phone}: ${message}`);
      
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ message: "Failed to send WhatsApp message" });
    }
  });

  // Calculate delivery fee endpoint
  app.post('/api/calculate-delivery-fee', async (req, res) => {
    try {
      const { pickupAddress, deliveryAddress, pickupCep, deliveryCep } = req.body;
      
      if (!pickupAddress || !deliveryAddress) {
        return res.status(400).json({ 
          error: 'Endereços de coleta e entrega são obrigatórios' 
        });
      }
      
      const result = await calculateDeliveryDistance(
        pickupAddress, 
        deliveryAddress, 
        pickupCep, 
        deliveryCep
      );
      
      if (!result) {
        return res.status(400).json({ 
          error: 'Não foi possível calcular a distância entre os endereços' 
        });
      }
      
      // Apply surge pricing
      const surgeResult = applySurgePricing(result.deliveryFee);
      
      // Get delivery zone
      const zone = getDeliveryZone(result.distance);
      
      res.json({
        distance: result.distance,
        estimatedTime: result.estimatedTime,
        baseFee: result.deliveryFee,
        finalFee: surgeResult.fee,
        surgeMultiplier: surgeResult.multiplier,
        surgeReason: surgeResult.reason,
        zone: zone.zone,
        zoneDescription: zone.description
      });
      
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      res.status(500).json({ 
        error: 'Erro interno ao calcular taxa de entrega' 
      });
    }
  });

  // Client sync API routes - for receiving data from installed clients
  const CLIENT_API_KEY = process.env.CLIENT_API_KEY || "delivery-express-client-key";
  
  // Middleware to verify client API key
  const isValidClient = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Client API key required" });
    }
    
    const apiKey = authHeader.substring(7);
    if (apiKey !== CLIENT_API_KEY) {
      return res.status(401).json({ message: "Invalid client API key" });
    }
    
    next();
  };

  // Receive merchants from client
  app.post('/api/clients/:clientId/merchants', isValidClient, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const merchantData = req.body;
      
      // Add client identifier to merchant data
      const extendedMerchantData = {
        ...merchantData,
        clientId: clientId,
        syncedAt: new Date(),
        isClientSync: true
      };
      
      // Store in database with client info
      console.log(`Received merchant data from client ${clientId}:`, merchantData.name);
      
      // Here you would typically save to a separate clients table or mark as synced
      // For now, we'll just log and respond
      
      res.json({ 
        success: true, 
        message: "Merchant data received successfully",
        merchantId: merchantData.id,
        clientId: clientId 
      });
    } catch (error) {
      console.error("Error receiving merchant data:", error);
      res.status(500).json({ message: "Failed to process merchant data" });
    }
  });

  // Receive deliverers from client
  app.post('/api/clients/:clientId/deliverers', isValidClient, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const delivererData = req.body;
      
      const extendedDelivererData = {
        ...delivererData,
        clientId: clientId,
        syncedAt: new Date(),
        isClientSync: true
      };
      
      console.log(`Received deliverer data from client ${clientId}:`, delivererData.name);
      
      res.json({ 
        success: true, 
        message: "Deliverer data received successfully",
        delivererId: delivererData.id,
        clientId: clientId 
      });
    } catch (error) {
      console.error("Error receiving deliverer data:", error);
      res.status(500).json({ message: "Failed to process deliverer data" });
    }
  });

  // Receive deliveries from client
  app.post('/api/clients/:clientId/deliveries', isValidClient, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const deliveryData = req.body;
      
      const extendedDeliveryData = {
        ...deliveryData,
        clientId: clientId,
        syncedAt: new Date(),
        isClientSync: true
      };
      
      console.log(`Received delivery data from client ${clientId}:`, deliveryData.id);
      
      // Send real-time notification to admin panel
      const broadcastToClients = (app as any).broadcastToClients;
      if (broadcastToClients) {
        broadcastToClients('client_delivery_sync', {
          delivery: extendedDeliveryData,
          action: 'synced',
          clientId: clientId
        });
      }
      
      res.json({ 
        success: true, 
        message: "Delivery data received successfully",
        deliveryId: deliveryData.id,
        clientId: clientId 
      });
    } catch (error) {
      console.error("Error receiving delivery data:", error);
      res.status(500).json({ message: "Failed to process delivery data" });
    }
  });

  // Platform commission report (admin only)
  app.get('/api/admin/platform-commission-report', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const deliveries = await storage.getDeliveries();
      const completedDeliveries = deliveries.filter(d => d.status === 'completed' && d.deliverer);
      
      const commissionReport = completedDeliveries.map(delivery => ({
        id: delivery.id,
        delivererName: delivery.deliverer?.name || "N/A",
        customerName: delivery.customerName,
        deliveryAddress: delivery.deliveryAddress,
        deliveryFee: parseFloat(delivery.deliveryFee),
        commissionPercentage: parseFloat(delivery.commissionPercentage || "20.00"),
        commissionAmount: parseFloat(delivery.commissionAmount || "0.00"),
        delivererPayment: parseFloat(delivery.delivererPayment || "0.00"),
        completedAt: delivery.completedAt,
        createdAt: delivery.createdAt
      }));
      
      const totals = commissionReport.reduce((acc, delivery) => ({
        totalDeliveryFee: acc.totalDeliveryFee + delivery.deliveryFee,
        totalCommission: acc.totalCommission + delivery.commissionAmount,
        totalDelivererPayment: acc.totalDelivererPayment + delivery.delivererPayment
      }), {
        totalDeliveryFee: 0,
        totalCommission: 0,
        totalDelivererPayment: 0
      });
      
      res.json({
        deliveries: commissionReport,
        totals
      });
    } catch (error) {
      console.error("Error fetching platform commission report:", error);
      res.status(500).json({ message: "Failed to fetch platform commission report" });
    }
  });

  // Deliverer payments routes (admin only)
  app.get('/api/admin/deliverer-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const payments = await storage.getDelivererPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching deliverer payments:", error);
      res.status(500).json({ message: "Failed to fetch deliverer payments" });
    }
  });

  app.get('/api/admin/deliverer-payments/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const summary = await storage.getDelivererPaymentsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching deliverer payments summary:", error);
      res.status(500).json({ message: "Failed to fetch deliverer payments summary" });
    }
  });

  app.get('/api/admin/deliverer-payments/by-deliverer/:delivererId', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const delivererId = parseInt(req.params.delivererId);
      if (isNaN(delivererId)) {
        return res.status(400).json({ message: "Invalid deliverer ID" });
      }
      
      const payments = await storage.getDelivererPaymentsByDeliverer(delivererId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching deliverer payments by deliverer:", error);
      res.status(500).json({ message: "Failed to fetch deliverer payments by deliverer" });
    }
  });

  app.get('/api/admin/deliverer-payments/by-status/:status', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const status = req.params.status;
      if (!['pending', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending' or 'paid'" });
      }
      
      const payments = await storage.getDelivererPaymentsByStatus(status);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching deliverer payments by status:", error);
      res.status(500).json({ message: "Failed to fetch deliverer payments by status" });
    }
  });

  app.put('/api/admin/deliverer-payments/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      if (!['pending', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending' or 'paid'" });
      }
      
      const payment = await storage.updateDelivererPaymentStatus(id, status);
      res.json(payment);
    } catch (error) {
      console.error("Error updating deliverer payment status:", error);
      res.status(500).json({ message: "Failed to update deliverer payment status" });
    }
  });

  // Merchant payments endpoints
  app.get('/api/admin/merchant-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const { merchantId, status } = req.query;
      
      let payments;
      if (merchantId && !isNaN(parseInt(merchantId))) {
        payments = await storage.getMerchantPaymentsByMerchant(parseInt(merchantId));
      } else if (status) {
        payments = await storage.getMerchantPaymentsByStatus(status);
      } else {
        payments = await storage.getMerchantPayments();
      }
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching merchant payments:", error);
      res.status(500).json({ message: "Failed to fetch merchant payments" });
    }
  });

  app.get('/api/admin/merchant-payments/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const summary = await storage.getMerchantPaymentsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching merchant payments summary:", error);
      res.status(500).json({ message: "Failed to fetch merchant payments summary" });
    }
  });

  app.put('/api/admin/merchant-payments/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      if (!['pending', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending' or 'paid'" });
      }
      
      const payment = await storage.updateMerchantPaymentStatus(id, status);
      res.json(payment);
    } catch (error) {
      console.error("Error updating merchant payment status:", error);
      res.status(500).json({ message: "Failed to update merchant payment status" });
    }
  });

  // Financial summary endpoint
  app.get('/api/admin/financial-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const { periodStart, periodEnd } = req.query;
      
      let startDate, endDate;
      if (periodStart && periodEnd) {
        startDate = new Date(periodStart);
        endDate = new Date(periodEnd);
      }
      
      const summary = await storage.getFinancialSummary(startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Get client status
  app.get('/api/clients/:clientId/status', isValidClient, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      
      res.json({
        clientId: clientId,
        status: "active",
        lastSync: new Date(),
        syncEnabled: true
      });
    } catch (error) {
      console.error("Error getting client status:", error);
      res.status(500).json({ message: "Failed to get client status" });
    }
  });

  // List all clients with sync data
  app.get('/api/admin/clients', isAdmin, async (req, res) => {
    try {
      // This would typically query a clients table
      // For now, return mock data
      const clients = [
        {
          id: "client_1234567890_abc123",
          businessName: "Padaria do João",
          businessEmail: "joao@padaria.com",
          lastSync: new Date(),
          status: "active",
          totalMerchants: 1,
          totalDeliverers: 2,
          totalDeliveries: 15
        }
      ];
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Admin settings routes
  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.get('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getAdminSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching admin setting:", error);
      res.status(500).json({ message: "Failed to fetch admin setting" });
    }
  });

  app.put('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateAdminSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating admin setting:", error);
      res.status(500).json({ message: "Failed to update admin setting" });
    }
  });

  app.post('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const { settingKey, settingValue, settingType, description } = req.body;
      
      if (!settingKey || !settingValue || !settingType) {
        return res.status(400).json({ message: "Setting key, value, and type are required" });
      }
      
      const setting = await storage.createAdminSetting({
        settingKey,
        settingValue,
        settingType,
        description
      });
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating admin setting:", error);
      res.status(500).json({ message: "Failed to create admin setting" });
    }
  });

  // Plan management endpoints
  app.get('/api/admin/plans', async (req, res) => {
    try {
      const plans = await storage.getAdminSettings();
      const planSettings = plans.filter(setting => setting.settingKey.startsWith('plan_') && setting.settingType === 'plan');
      
      // If no plans exist, create default plans
      if (planSettings.length === 0) {
        console.log("No plans found, creating default plans...");
        const defaultPlans = [
          {
            id: 'basic',
            name: 'Plano Básico',
            price: 99.00,
            period: 'monthly',
            deliveryLimit: 50,
            features: ['Até 50 entregas por mês', 'Suporte por email', 'Painel básico'],
            description: 'Ideal para pequenos negócios que estão começando',
            isActive: true,
            priority: 1,
            color: '#3b82f6'
          },
          {
            id: 'standard',
            name: 'Plano Padrão',
            price: 149.00,
            period: 'monthly',
            deliveryLimit: 150,
            features: ['Até 150 entregas por mês', 'Suporte prioritário', 'Relatórios avançados', 'Integração com WhatsApp'],
            description: 'Perfeito para negócios em crescimento',
            isActive: true,
            priority: 2,
            color: '#10b981'
          },
          {
            id: 'premium',
            name: 'Plano Premium',
            price: 299.00,
            period: 'monthly',
            deliveryLimit: null,
            features: ['Entregas ilimitadas', 'Suporte 24/7', 'API personalizada', 'Múltiplos usuários', 'Relatórios em tempo real'],
            description: 'Para negócios que precisam de máxima flexibilidade',
            isActive: true,
            priority: 3,
            color: '#f59e0b'
          }
        ];
        
        // Create default plans
        for (const plan of defaultPlans) {
          await storage.createAdminSetting({
            settingKey: `plan_${plan.id}`,
            settingValue: JSON.stringify(plan),
            settingType: 'plan',
            description: `Configuração do ${plan.name}`
          });
        }
        
        console.log("Default plans created successfully");
        res.json(defaultPlans);
      } else {
        try {
          const parsedPlans = planSettings.map(setting => {
            try {
              return JSON.parse(setting.settingValue);
            } catch (e) {
              console.error("Error parsing plan setting:", setting.settingKey, e);
              return null;
            }
          }).filter(plan => plan !== null);
          
          console.log("Returning parsed plans:", parsedPlans.length);
          res.json(parsedPlans);
        } catch (parseError) {
          console.error("Error parsing plans:", parseError);
          res.status(500).json({ message: "Failed to parse plans" });
        }
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post('/api/admin/plans', isAdmin, async (req, res) => {
    try {
      const plan = req.body;
      
      if (!plan.id || !plan.name || !plan.price) {
        return res.status(400).json({ message: "Plan ID, name, and price are required" });
      }
      
      const planKey = `plan_${plan.id}`;
      
      // Check if plan already exists
      const existingPlan = await storage.getAdminSetting(planKey);
      
      if (existingPlan) {
        // Update existing plan
        await storage.updateAdminSetting(planKey, JSON.stringify(plan));
      } else {
        // Create new plan
        await storage.createAdminSetting({
          settingKey: planKey,
          settingValue: JSON.stringify(plan),
          settingType: 'plan',
          description: `Configuração do ${plan.name}`
        });
      }
      
      res.json({ success: true, plan });
    } catch (error) {
      console.error("Error saving plan:", error);
      res.status(500).json({ message: "Failed to save plan" });
    }
  });

  app.put('/api/admin/plans/:planId', isAdmin, async (req, res) => {
    try {
      const planId = req.params.planId;
      const plan = req.body;
      
      const planKey = `plan_${planId}`;
      
      await storage.updateAdminSetting(planKey, JSON.stringify(plan));
      
      res.json({ success: true, plan });
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  app.delete('/api/admin/plans/:planId', isAdmin, async (req, res) => {
    try {
      const planId = req.params.planId;
      const planKey = `plan_${planId}`;
      
      // Get current plans
      const plans = await storage.getAdminSettings();
      const planSettings = plans.filter(setting => setting.settingKey.startsWith('plan_'));
      
      // Find and remove the plan
      const planToDelete = planSettings.find(setting => setting.settingKey === planKey);
      
      if (planToDelete) {
        // Delete from database by updating to inactive
        const planData = JSON.parse(planToDelete.settingValue);
        planData.isActive = false;
        await storage.updateAdminSetting(planKey, JSON.stringify(planData));
      }
      
      res.json({ success: true, message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // Client setup endpoint for creating new client installations
  app.post('/api/admin/setup-client', isAuthenticated, async (req: any, res) => {
    try {
      const userInfo = req.user;
      
      // Check if user is admin
      if (userInfo.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can setup clients" });
      }
      
      const { businessName, businessEmail, businessPhone, businessAddress, contactPerson, planType, installationType } = req.body;
      
      // Generate unique installation ID
      const installationId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Generate API key
      const apiKey = `entrega_facil_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Create installation record
      const installation = await storage.createClientInstallation({
        installationId,
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
      });
      
      // Generate access URL based on installation type
      let accessUrl;
      if (installationType === 'online') {
        accessUrl = `${req.protocol}://${req.get('host')}/merchant-portal?installation=${installationId}`;
      } else {
        accessUrl = `http://localhost:3000/merchant-portal?installation=${installationId}`;
      }
      
      // Log the setup
      console.log(`New client setup: ${businessName} (${installationId})`);
      
      res.json({
        success: true,
        installationId,
        apiKey,
        accessUrl,
        installation,
        message: "Cliente configurado com sucesso"
      });
    } catch (error) {
      console.error("Error setting up client:", error);
      res.status(500).json({ message: "Failed to setup client" });
    }
  });

  // Client sync routes for online database
  app.post('/api/sync/installation', async (req, res) => {
    try {
      const { businessName, businessPhone, businessEmail, businessAddress, installationId } = req.body;
      
      const existing = await storage.getClientInstallation(installationId);
      
      if (existing) {
        const updated = await storage.updateClientInstallation(installationId, {
          businessName,
          businessPhone,
          businessEmail,
          businessAddress,
          lastSync: new Date(),
        });
        res.json({ success: true, installation: updated });
      } else {
        const created = await storage.createClientInstallation({
          businessName,
          businessPhone,
          businessEmail,
          businessAddress,
          installationId,
        });
        res.json({ success: true, installation: created });
      }
    } catch (error) {
      console.error('Error syncing installation:', error);
      res.status(500).json({ error: 'Failed to sync installation' });
    }
  });

  app.post('/api/sync/customer', async (req, res) => {
    try {
      const { installationId, name, phone, address } = req.body;
      
      const customer = await storage.createClientCustomer({
        installationId,
        name,
        phone,
        address,
      });
      
      res.json({ success: true, customer });
    } catch (error) {
      console.error('Error syncing customer:', error);
      res.status(500).json({ error: 'Failed to sync customer' });
    }
  });

  app.post('/api/sync/delivery', async (req, res) => {
    try {
      const { 
        installationId, 
        customerId, 
        customerName, 
        customerPhone, 
        deliveryAddress, 
        pickupAddress, 
        description, 
        price, 
        deliveryFee, 
        paymentMethod, 
        status 
      } = req.body;
      
      const delivery = await storage.createClientDelivery({
        installationId,
        customerId,
        customerName,
        customerPhone,
        deliveryAddress,
        pickupAddress,
        description,
        price,
        deliveryFee,
        paymentMethod,
        status,
      });
      
      res.json({ success: true, delivery });
    } catch (error) {
      console.error('Error syncing delivery:', error);
      res.status(500).json({ error: 'Failed to sync delivery' });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time sync
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const connectedClients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'client_register') {
          const clientId = data.clientId;
          connectedClients.set(clientId, ws);
          console.log(`Client ${clientId} registered for real-time sync`);
          
          ws.send(JSON.stringify({
            type: 'registration_success',
            clientId: clientId,
            timestamp: new Date().toISOString()
          }));
        }
        
        if (data.type === 'delivery_update') {
          // Broadcast delivery update to all connected clients
          broadcastToClients('delivery_update', data.payload);
        }
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from connected clients
      for (const [clientId, client] of connectedClients) {
        if (client === ws) {
          connectedClients.delete(clientId);
          console.log(`Client ${clientId} disconnected`);
          break;
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Helper function to broadcast to all connected clients
  function broadcastToClients(type: string, payload: any) {
    const message = JSON.stringify({
      type,
      payload,
      timestamp: new Date().toISOString()
    });
    
    connectedClients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  // Helper function to send to specific client
  function sendToClient(clientId: string, type: string, payload: any) {
    const ws = connectedClients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  // Store broadcast function globally for use in other routes
  (app as any).broadcastToClients = broadcastToClients;
  (app as any).sendToClient = sendToClient;
  
  return httpServer;
}
