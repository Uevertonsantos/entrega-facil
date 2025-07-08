import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMerchantSchema, insertDelivererSchema, insertDeliverySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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

  app.get('/api/merchants/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.get('/api/deliverers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.get('/api/deliveries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.post('/api/deliveries', isAuthenticated, async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
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

  // Deliverer app routes
  app.get('/api/deliverers/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }
      const deliverer = await storage.getDelivererByEmail(user.email);
      res.json(deliverer);
    } catch (error) {
      console.error("Error fetching current deliverer:", error);
      res.status(500).json({ message: "Failed to fetch current deliverer" });
    }
  });

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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }
      const deliverer = await storage.getDelivererByEmail(user.email);
      if (!deliverer) {
        return res.status(404).json({ message: "Deliverer not found" });
      }
      const deliveries = await storage.getDeliveriesByDeliverer(deliverer.id);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching my deliveries:", error);
      res.status(500).json({ message: "Failed to fetch my deliveries" });
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

  // Merchant app routes
  app.get('/api/merchants/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }
      const merchant = await storage.getMerchantByEmail(user.email);
      res.json(merchant);
    } catch (error) {
      console.error("Error fetching current merchant:", error);
      res.status(500).json({ message: "Failed to fetch current merchant" });
    }
  });

  app.get('/api/deliveries/my-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }
      const merchant = await storage.getMerchantByEmail(user.email);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      const deliveries = await storage.getDeliveriesByMerchant(merchant.id);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching my delivery requests:", error);
      res.status(500).json({ message: "Failed to fetch my delivery requests" });
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
