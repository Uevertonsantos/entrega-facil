import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchants table
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  businessName: varchar("business_name"),
  cnpjCpf: varchar("cnpj_cpf").notNull().default(""),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  password: varchar("password"),
  address: text("address").notNull(),
  cep: varchar("cep", { length: 10 }),
  businessType: varchar("business_type"),
  type: varchar("type").notNull(),
  planType: varchar("plan_type").notNull(),
  planValue: numeric("plan_value").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deliverers table
export const deliverers = pgTable("deliverers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  vehicleType: varchar("vehicle_type").notNull(), // bicicleta, moto, carro, a_pe
  vehicleModel: varchar("vehicle_model"),
  vehiclePlate: varchar("vehicle_plate"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("15.00"),
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  currentDeliveries: integer("current_deliveries").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deliveries table
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  delivererId: integer("deliverer_id"),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  customerCpf: varchar("customer_cpf", { length: 14 }),
  orderDescription: text("order_description").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupCep: varchar("pickup_cep", { length: 10 }),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCep: varchar("delivery_cep", { length: 10 }),
  referencePoint: text("reference_point"),
  status: varchar("status").notNull(), // "pending", "accepted", "in_transit", "delivered", "cancelled"
  priority: varchar("priority").notNull().default("medium"), // "low", "medium", "high"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  delivererPayment: decimal("deliverer_payment", { precision: 10, scale: 2 }),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  scheduledTime: timestamp("scheduled_time"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  settingType: varchar("setting_type").notNull(), // "string", "number", "boolean", "json"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const merchantsRelations = relations(merchants, ({ many }) => ({
  deliveries: many(deliveries),
}));

export const deliverersRelations = relations(deliverers, ({ many }) => ({
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  merchant: one(merchants, {
    fields: [deliveries.merchantId],
    references: [merchants.id],
  }),
  deliverer: one(deliverers, {
    fields: [deliveries.delivererId],
    references: [deliverers.id],
  }),
}));

// Insert schemas
export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.string().default("comerciante"),
  planValue: z.number().default(0),
});

export const insertDelivererSchema = createInsertSchema(deliverers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  price: true,
  deliveryFee: true,
  delivererId: true,
  customerPhone: true,
  customerCpf: true,
  pickupCep: true,
  deliveryCep: true,
  referencePoint: true,
  notes: true,
  scheduledTime: true,
  completedAt: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export type InsertDeliverer = z.infer<typeof insertDelivererSchema>;
export type Deliverer = typeof deliverers.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type DeliveryWithRelations = Delivery & {
  merchant: Merchant;
  deliverer: Deliverer | null;
  estimatedValue?: number; // Alias for price for frontend compatibility
};

export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
