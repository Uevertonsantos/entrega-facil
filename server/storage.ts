import {
  users,
  merchants,
  deliverers,
  deliveries,
  adminSettings,
  adminUsers,
  clientInstallations,
  clientCustomers,
  clientDeliveries,
  delivererPayments,
  type User,
  type UpsertUser,
  type InsertMerchant,
  type Merchant,
  type InsertDeliverer,
  type Deliverer,
  type InsertDelivery,
  type Delivery,
  type DeliveryWithRelations,
  type InsertAdminSetting,
  type AdminSetting,
  type InsertAdminUser,
  type AdminUser,
  type InsertClientInstallation,
  type ClientInstallation,
  type InsertClientCustomer,
  type ClientCustomer,
  type InsertClientDelivery,
  type ClientDelivery,
  type InsertDelivererPayment,
  type DelivererPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lt, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Merchant operations
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByEmail(email: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant>;
  deleteMerchant(id: number): Promise<void>;
  
  // Deliverer operations
  getDeliverers(): Promise<Deliverer[]>;
  getActiveDeliverers(): Promise<Deliverer[]>;
  getDeliverer(id: number): Promise<Deliverer | undefined>;
  getDelivererByEmail(email: string): Promise<Deliverer | undefined>;
  createDeliverer(deliverer: InsertDeliverer): Promise<Deliverer>;
  updateDeliverer(id: number, deliverer: Partial<InsertDeliverer>): Promise<Deliverer>;
  deleteDeliverer(id: number): Promise<void>;
  
  // Delivery operations
  getDeliveries(): Promise<DeliveryWithRelations[]>;
  getRecentDeliveries(limit?: number): Promise<DeliveryWithRelations[]>;
  getAvailableDeliveries(): Promise<DeliveryWithRelations[]>;
  getDeliveriesByMerchant(merchantId: number): Promise<DeliveryWithRelations[]>;
  getDeliveriesByDeliverer(delivererId: number): Promise<DeliveryWithRelations[]>;
  getDelivery(id: number): Promise<DeliveryWithRelations | undefined>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery>;
  deleteDelivery(id: number): Promise<void>;
  
  // Statistics
  getDashboardStats(): Promise<{
    todayDeliveries: number;
    completed: number;
    pending: number;
    revenue: number;
    activeDeliverers: number;
    activeMerchants: number;
  }>;
  
  // Deliverer statistics
  getDelivererStats(delivererId: number): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    todayDeliveries: number;
    totalEarnings: number;
    todayEarnings: number;
    averageRating: number;
    weeklyEarnings: number[];
  }>;
  
  // Admin user operations
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, adminUser: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: number): Promise<void>;
  setPasswordResetToken(id: number, token: string, expiry: Date): Promise<void>;
  getAdminUserByResetToken(token: string): Promise<AdminUser | undefined>;
  clearResetToken(id: number): Promise<void>;
  
  // Admin settings operations
  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  updateAdminSetting(key: string, value: string): Promise<AdminSetting>;
  createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  
  // Client installations operations
  getClientInstallations(): Promise<ClientInstallation[]>;
  getClientInstallation(installationId: string): Promise<ClientInstallation | undefined>;
  createClientInstallation(installation: InsertClientInstallation): Promise<ClientInstallation>;
  updateClientInstallation(installationId: string, installation: Partial<InsertClientInstallation>): Promise<ClientInstallation>;
  
  // Client customers operations
  getClientCustomers(installationId?: string): Promise<ClientCustomer[]>;
  createClientCustomer(customer: InsertClientCustomer): Promise<ClientCustomer>;
  
  // Client deliveries operations
  getClientDeliveries(installationId?: string): Promise<ClientDelivery[]>;
  createClientDelivery(delivery: InsertClientDelivery): Promise<ClientDelivery>;
  
  // Deliverer payments operations
  getDelivererPayments(): Promise<DelivererPayment[]>;
  getDelivererPaymentsByDeliverer(delivererId: number): Promise<DelivererPayment[]>;
  getDelivererPaymentsByStatus(status: string): Promise<DelivererPayment[]>;
  createDelivererPayment(payment: InsertDelivererPayment): Promise<DelivererPayment>;
  updateDelivererPaymentStatus(id: number, status: string): Promise<DelivererPayment>;
  getDelivererPaymentsSummary(): Promise<{
    totalPending: number;
    totalPaid: number;
    delivererBalances: { delivererId: number; delivererName: string; pendingAmount: number; paidAmount: number; totalAmount: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Merchant operations
  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.email, email));
    return merchant;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [newMerchant] = await db
      .insert(merchants)
      .values(merchant)
      .returning();
    return newMerchant;
  }

  async updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant> {
    const [updatedMerchant] = await db
      .update(merchants)
      .set({ ...merchant, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();
    return updatedMerchant;
  }

  async deleteMerchant(id: number): Promise<void> {
    await db.delete(merchants).where(eq(merchants.id, id));
  }

  // Deliverer operations
  async getDeliverers(): Promise<Deliverer[]> {
    return await db.select().from(deliverers).orderBy(desc(deliverers.createdAt));
  }

  async getActiveDeliverers(): Promise<Deliverer[]> {
    return await db
      .select()
      .from(deliverers)
      .where(and(eq(deliverers.isActive, true), eq(deliverers.isOnline, true)))
      .orderBy(desc(deliverers.createdAt));
  }

  async getDeliverer(id: number): Promise<Deliverer | undefined> {
    const [deliverer] = await db.select().from(deliverers).where(eq(deliverers.id, id));
    return deliverer;
  }

  async getDelivererByEmail(email: string): Promise<Deliverer | undefined> {
    const [deliverer] = await db.select().from(deliverers).where(eq(deliverers.email, email));
    return deliverer;
  }

  async createDeliverer(deliverer: InsertDeliverer): Promise<Deliverer> {
    const [newDeliverer] = await db
      .insert(deliverers)
      .values(deliverer)
      .returning();
    return newDeliverer;
  }

  async updateDeliverer(id: number, deliverer: Partial<InsertDeliverer>): Promise<Deliverer> {
    const [updatedDeliverer] = await db
      .update(deliverers)
      .set({ ...deliverer, updatedAt: new Date() })
      .where(eq(deliverers.id, id))
      .returning();
    return updatedDeliverer;
  }

  async deleteDeliverer(id: number): Promise<void> {
    await db.delete(deliverers).where(eq(deliverers.id, id));
  }

  // Delivery operations
  async getDeliveries(): Promise<DeliveryWithRelations[]> {
    return await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .orderBy(desc(deliveries.createdAt))
      .then(rows => rows.map(row => ({
        ...row.deliveries,
        merchant: row.merchants!,
        deliverer: row.deliverers,
        estimatedValue: row.deliveries.price ? parseFloat(row.deliveries.price.toString()) : 0,
      })));
  }

  async getRecentDeliveries(limit = 10): Promise<DeliveryWithRelations[]> {
    return await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .orderBy(desc(deliveries.createdAt))
      .limit(limit)
      .then(rows => rows.map(row => ({
        ...row.deliveries,
        merchant: row.merchants!,
        deliverer: row.deliverers,
      })));
  }

  async getAvailableDeliveries(): Promise<DeliveryWithRelations[]> {
    return await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .where(eq(deliveries.status, "pending"))
      .orderBy(desc(deliveries.createdAt))
      .then(rows => rows.map(row => ({
        ...row.deliveries,
        merchant: row.merchants!,
        deliverer: row.deliverers,
      })));
  }

  async getDeliveriesByMerchant(merchantId: number): Promise<DeliveryWithRelations[]> {
    return await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .where(eq(deliveries.merchantId, merchantId))
      .orderBy(desc(deliveries.createdAt))
      .then(rows => rows.map(row => ({
        ...row.deliveries,
        merchant: row.merchants!,
        deliverer: row.deliverers,
        estimatedValue: row.deliveries.price ? parseFloat(row.deliveries.price.toString()) : 0,
      })));
  }

  async getDeliveriesByDeliverer(delivererId: number): Promise<DeliveryWithRelations[]> {
    return await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .where(eq(deliveries.delivererId, delivererId))
      .orderBy(desc(deliveries.createdAt))
      .then(rows => rows.map(row => ({
        ...row.deliveries,
        merchant: row.merchants!,
        deliverer: row.deliverers,
      })));
  }

  async getDelivery(id: number): Promise<DeliveryWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(deliveries)
      .leftJoin(merchants, eq(deliveries.merchantId, merchants.id))
      .leftJoin(deliverers, eq(deliveries.delivererId, deliverers.id))
      .where(eq(deliveries.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.deliveries,
      merchant: result.merchants!,
      deliverer: result.deliverers,
    };
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [newDelivery] = await db
      .insert(deliveries)
      .values(delivery)
      .returning();
    return newDelivery;
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery> {
    const [updatedDelivery] = await db
      .update(deliveries)
      .set({ ...delivery, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();

    // Se a entrega foi completada, criar registro de pagamento
    if (delivery.status === 'completed' && updatedDelivery.delivererId) {
      // Buscar informações da entrega com relacionamentos
      const deliveryWithRelations = await this.getDelivery(id);
      
      if (deliveryWithRelations && deliveryWithRelations.deliverer) {
        const totalValue = parseFloat(updatedDelivery.deliveryFee);
        const commissionPercentage = parseFloat(deliveryWithRelations.deliverer.commissionPercentage);
        const commissionAmount = (totalValue * commissionPercentage) / 100;
        const delivererAmount = totalValue - commissionAmount;

        await this.createDelivererPayment({
          deliveryId: updatedDelivery.id,
          delivererId: deliveryWithRelations.deliverer.id,
          merchantId: deliveryWithRelations.merchant.id,
          merchantName: deliveryWithRelations.merchant.name,
          delivererName: deliveryWithRelations.deliverer.name,
          totalValue: totalValue.toString(),
          commissionPercentage: commissionPercentage.toString(),
          commissionAmount: commissionAmount.toString(),
          delivererAmount: delivererAmount.toString(),
          status: 'pending',
          completedAt: new Date(),
        });
      }
    }

    return updatedDelivery;
  }

  async deleteDelivery(id: number): Promise<void> {
    await db.delete(deliveries).where(eq(deliveries.id, id));
  }

  // Statistics
  async getDashboardStats(): Promise<{
    todayDeliveries: number;
    completed: number;
    pending: number;
    revenue: number;
    activeDeliverers: number;
    activeMerchants: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(gte(deliveries.createdAt, today));

    const [completed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(and(
        gte(deliveries.createdAt, today),
        eq(deliveries.status, "completed")
      ));

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(and(
        gte(deliveries.createdAt, today),
        eq(deliveries.status, "pending")
      ));

    const [revenue] = await db
      .select({ sum: sql<number>`coalesce(sum(${deliveries.deliveryFee}), 0)` })
      .from(deliveries)
      .where(and(
        gte(deliveries.createdAt, today),
        eq(deliveries.status, "completed")
      ));

    const [activeDeliverers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliverers)
      .where(and(
        eq(deliverers.isActive, true),
        eq(deliverers.isOnline, true)
      ));

    const [activeMerchants] = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(eq(merchants.isActive, true));

    return {
      todayDeliveries: todayDeliveries.count,
      completed: completed.count,
      pending: pending.count,
      revenue: revenue.sum,
      activeDeliverers: activeDeliverers.count,
      activeMerchants: activeMerchants.count,
    };
  }

  async getDelivererStats(delivererId: number): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    todayDeliveries: number;
    totalEarnings: number;
    todayEarnings: number;
    averageRating: number;
    weeklyEarnings: number[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(eq(deliveries.delivererId, delivererId));

    const [completedDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(and(
        eq(deliveries.delivererId, delivererId),
        eq(deliveries.status, "completed")
      ));

    const [pendingDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(and(
        eq(deliveries.delivererId, delivererId),
        or(eq(deliveries.status, "pending"), eq(deliveries.status, "in_progress"))
      ));

    const [todayDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveries)
      .where(and(
        eq(deliveries.delivererId, delivererId),
        gte(deliveries.createdAt, today)
      ));

    const [totalEarnings] = await db
      .select({ sum: sql<number>`coalesce(sum(${deliveries.delivererPayment}), 0)` })
      .from(deliveries)
      .where(and(
        eq(deliveries.delivererId, delivererId),
        eq(deliveries.status, "completed")
      ));

    const [todayEarnings] = await db
      .select({ sum: sql<number>`coalesce(sum(${deliveries.delivererPayment}), 0)` })
      .from(deliveries)
      .where(and(
        eq(deliveries.delivererId, delivererId),
        eq(deliveries.status, "completed"),
        gte(deliveries.createdAt, today)
      ));

    // Calculate weekly earnings (last 7 days)
    const weeklyEarnings = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const [dayEarnings] = await db
        .select({ sum: sql<number>`coalesce(sum(${deliveries.delivererPayment}), 0)` })
        .from(deliveries)
        .where(and(
          eq(deliveries.delivererId, delivererId),
          eq(deliveries.status, "completed"),
          gte(deliveries.createdAt, date),
          lt(deliveries.createdAt, nextDay)
        ));
      
      weeklyEarnings.push(dayEarnings.sum);
    }

    return {
      totalDeliveries: totalDeliveries.count,
      completedDeliveries: completedDeliveries.count,
      pendingDeliveries: pendingDeliveries.count,
      todayDeliveries: todayDeliveries.count,
      totalEarnings: totalEarnings.sum,
      todayEarnings: todayEarnings.sum,
      averageRating: 4.8, // Mock rating for now
      weeklyEarnings
    };
  }
  
  // Admin user operations
  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(adminUsers.createdAt);
  }
  
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }
  
  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }
  
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user;
  }
  
  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newUser] = await db
      .insert(adminUsers)
      .values(adminUser)
      .returning();
    return newUser;
  }
  
  async updateAdminUser(id: number, adminUser: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [updatedUser] = await db
      .update(adminUsers)
      .set({ 
        ...adminUser, 
        updatedAt: new Date() 
      })
      .where(eq(adminUsers.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteAdminUser(id: number): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }
  
  async setPasswordResetToken(id: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(adminUsers)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, id));
  }
  
  async getAdminUserByResetToken(token: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.resetToken, token),
        sql`${adminUsers.resetTokenExpiry} > NOW()`
      ));
    return user;
  }
  
  async clearResetToken(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ 
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, id));
  }
  
  // Admin settings operations
  async getAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings).orderBy(adminSettings.settingKey);
  }
  
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key));
    return setting;
  }
  
  async updateAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const [setting] = await db
      .update(adminSettings)
      .set({ 
        settingValue: value,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.settingKey, key))
      .returning();
    return setting;
  }
  
  async createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const [newSetting] = await db
      .insert(adminSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  // Client installations operations
  async getClientInstallations(): Promise<ClientInstallation[]> {
    return await db.select().from(clientInstallations).orderBy(desc(clientInstallations.createdAt));
  }

  async getClientInstallation(installationId: string): Promise<ClientInstallation | undefined> {
    const [installation] = await db.select().from(clientInstallations).where(eq(clientInstallations.installationId, installationId));
    return installation;
  }

  async createClientInstallation(installation: InsertClientInstallation): Promise<ClientInstallation> {
    const [newInstallation] = await db.insert(clientInstallations).values({
      ...installation,
      lastSync: new Date(),
    }).returning();
    return newInstallation;
  }

  async updateClientInstallation(installationId: string, installation: Partial<InsertClientInstallation>): Promise<ClientInstallation> {
    const [updatedInstallation] = await db.update(clientInstallations)
      .set({ ...installation, lastSync: new Date() })
      .where(eq(clientInstallations.installationId, installationId))
      .returning();
    return updatedInstallation;
  }

  // Client customers operations
  async getClientCustomers(installationId?: string): Promise<ClientCustomer[]> {
    const query = db.select().from(clientCustomers).orderBy(desc(clientCustomers.createdAt));
    
    if (installationId) {
      return await query.where(eq(clientCustomers.installationId, installationId));
    }
    
    return await query;
  }

  async createClientCustomer(customer: InsertClientCustomer): Promise<ClientCustomer> {
    const [newCustomer] = await db.insert(clientCustomers).values(customer).returning();
    return newCustomer;
  }

  // Client deliveries operations
  async getClientDeliveries(installationId?: string): Promise<ClientDelivery[]> {
    const query = db.select().from(clientDeliveries).orderBy(desc(clientDeliveries.createdAt));
    
    if (installationId) {
      return await query.where(eq(clientDeliveries.installationId, installationId));
    }
    
    return await query;
  }

  async createClientDelivery(delivery: InsertClientDelivery): Promise<ClientDelivery> {
    const [newDelivery] = await db.insert(clientDeliveries).values(delivery).returning();
    return newDelivery;
  }

  // Deliverer payments operations
  async getDelivererPayments(): Promise<DelivererPayment[]> {
    return await db.select().from(delivererPayments).orderBy(desc(delivererPayments.createdAt));
  }

  async getDelivererPaymentsByDeliverer(delivererId: number): Promise<DelivererPayment[]> {
    return await db.select().from(delivererPayments)
      .where(eq(delivererPayments.delivererId, delivererId))
      .orderBy(desc(delivererPayments.createdAt));
  }

  async getDelivererPaymentsByStatus(status: string): Promise<DelivererPayment[]> {
    return await db.select().from(delivererPayments)
      .where(eq(delivererPayments.status, status))
      .orderBy(desc(delivererPayments.createdAt));
  }

  async createDelivererPayment(payment: InsertDelivererPayment): Promise<DelivererPayment> {
    const [newPayment] = await db.insert(delivererPayments).values(payment).returning();
    return newPayment;
  }

  async updateDelivererPaymentStatus(id: number, status: string): Promise<DelivererPayment> {
    const [updatedPayment] = await db
      .update(delivererPayments)
      .set({ 
        status,
        paidAt: status === 'paid' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(delivererPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async getDelivererPaymentsSummary(): Promise<{
    totalPending: number;
    totalPaid: number;
    delivererBalances: { delivererId: number; delivererName: string; pendingAmount: number; paidAmount: number; totalAmount: number }[];
  }> {
    const payments = await db.select().from(delivererPayments);
    
    const totalPending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.delivererAmount), 0);
    
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.delivererAmount), 0);
    
    // Group by deliverer
    const delivererMap = new Map<number, { delivererId: number; delivererName: string; pendingAmount: number; paidAmount: number; totalAmount: number }>();
    
    payments.forEach(payment => {
      const delivererId = payment.delivererId;
      const delivererName = payment.delivererName;
      const amount = parseFloat(payment.delivererAmount);
      
      if (!delivererMap.has(delivererId)) {
        delivererMap.set(delivererId, {
          delivererId,
          delivererName,
          pendingAmount: 0,
          paidAmount: 0,
          totalAmount: 0
        });
      }
      
      const delivererData = delivererMap.get(delivererId)!;
      delivererData.totalAmount += amount;
      
      if (payment.status === 'pending') {
        delivererData.pendingAmount += amount;
      } else if (payment.status === 'paid') {
        delivererData.paidAmount += amount;
      }
    });
    
    return {
      totalPending,
      totalPaid,
      delivererBalances: Array.from(delivererMap.values())
    };
  }
}

export const storage = new DatabaseStorage();