import {
  users,
  merchants,
  deliverers,
  deliveries,
  adminSettings,
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
  
  // Admin settings operations
  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  updateAdminSetting(key: string, value: string): Promise<AdminSetting>;
  createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
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
}

export const storage = new DatabaseStorage();