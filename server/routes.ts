import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { insertMerchantSchema, insertDelivererSchema, insertDeliverySchema } from "@shared/schema";
import { z } from "zod";

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
  // Auth middleware
  await setupAuth(app);

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign(
          { email, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          success: true, 
          token,
          message: "Login successful" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
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
      
      // For simplicity, using email as password check (in production, use bcrypt)
      if (merchant.email === email && merchant.phone === password) {
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
      
      // For simplicity, using phone as password check (in production, use bcrypt)
      if (deliverer.email === email && deliverer.phone === password) {
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
        const merchant = await storage.getMerchant(userInfo.id);
        res.json({ ...userInfo, merchant });
      }
      // If it's a deliverer, get full deliverer data  
      else if (userInfo.role === 'deliverer') {
        const deliverer = await storage.getDeliverer(userInfo.id);
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
      const merchant = await storage.getMerchant(userInfo.id);
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
      const merchantData = insertMerchantSchema.parse(req.body);
      const merchant = await storage.createMerchant(merchantData);
      res.status(201).json(merchant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid merchant data", errors: error.errors });
      }
      
      // Check for duplicate email error
      if (error.code === '23505' && error.constraint === 'merchants_email_key') {
        return res.status(400).json({ message: "Este email já está cadastrado no sistema" });
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
      const deliverer = await storage.getDeliverer(userInfo.id);
      if (!deliverer) {
        return res.json({ isDeliverer: false, message: "Deliverer not found" });
      }
      res.json({ isDeliverer: true, ...deliverer });
    } else {
      return res.json({ isDeliverer: false, message: "User is not registered as a deliverer" });
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
        const deliveries = await storage.getDeliveriesByDeliverer(userInfo.id);
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
        const deliveries = await storage.getDeliveriesByMerchant(userInfo.id);
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
        merchantId: userInfo.id,
        delivererId: null,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        pickupAddress: "A definir", // Default pickup address
        deliveryAddress: req.body.deliveryAddress,
        status: 'pending',
        priority: req.body.priority || 'medium',
        price: String(req.body.estimatedValue || "0.00"),
        deliveryFee: "10.00", // Default delivery fee
        notes: req.body.notes || null,
      };
      
      const parsedData = insertDeliverySchema.parse(deliveryData);
      const delivery = await storage.createDelivery(parsedData);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }
      const deliverer = await storage.getDelivererByEmail(user.email);
      if (!deliverer) {
        return res.status(404).json({ message: "Deliverer not found" });
      }
      const delivery = await storage.updateDelivery(id, { 
        delivererId: deliverer.id, 
        status: 'accepted' 
      });
      res.json(delivery);
    } catch (error) {
      console.error("Error accepting delivery:", error);
      res.status(500).json({ message: "Failed to accept delivery" });
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

  const httpServer = createServer(app);
  return httpServer;
}
