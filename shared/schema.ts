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
  currentBalance: numeric("current_balance").default("0.00"), // Saldo atual do comerciante (negativo = deve)
  totalOwed: numeric("total_owed").default("0.00"), // Total devido à plataforma
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Neighborhoods table - valores fixos de distância por bairro
export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  city: varchar("city").notNull().default("Conde"),
  averageDistance: decimal("average_distance", { precision: 5, scale: 2 }).notNull(), // distância média em km
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }).notNull().default("5.00"), // tarifa base
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
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).default("15.00"),
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
  paymentMethod: varchar("payment_method").notNull().default("dinheiro"), // "dinheiro", "cartao_credito", "cartao_debito", "pix", "cartao_refeicao", "vale_alimentacao"
  status: varchar("status").notNull(), // "pending", "accepted", "in_transit", "delivered", "cancelled"
  priority: varchar("priority").notNull().default("medium"), // "low", "medium", "high"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  delivererPayment: decimal("deliverer_payment", { precision: 10, scale: 2 }),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }), // Taxa da plataforma (você recebe)
  merchantOwes: decimal("merchant_owes", { precision: 10, scale: 2 }), // Valor que comerciante deve pagar
  delivererEarns: decimal("deliverer_earns", { precision: 10, scale: 2 }), // Valor que entregador recebe
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }),
  platformFeeAmount: decimal("platform_fee_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  scheduledTime: timestamp("scheduled_time"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().default("admin"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  isActive: boolean("is_active").default(true),
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

// Deliverer payments table - controle de pagamentos dos entregadores
export const delivererPayments = pgTable("deliverer_payments", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").notNull(),
  delivererId: integer("deliverer_id").notNull(),
  merchantId: integer("merchant_id").notNull(),
  merchantName: varchar("merchant_name").notNull(),
  delivererName: varchar("deliverer_name").notNull(),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(), // Valor total da entrega
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).notNull(), // Percentual da taxa de plataforma
  platformFeeAmount: decimal("platform_fee_amount", { precision: 10, scale: 2 }).notNull(), // Valor da taxa de plataforma
  delivererAmount: decimal("deliverer_amount", { precision: 10, scale: 2 }).notNull(), // Valor líquido para o entregador
  status: varchar("status").notNull().default("pending"), // "pending", "paid"
  paidAt: timestamp("paid_at"),
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchant payments table - controle de pagamentos dos comerciantes
export const merchantPayments = pgTable("merchant_payments", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull(),
  merchantName: varchar("merchant_name").notNull(),
  totalDeliveries: integer("total_deliveries").notNull().default(0), // Total de entregas no período
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(), // Valor total repassado à plataforma
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).notNull(), // Percentual da taxa de plataforma
  platformFeeAmount: decimal("platform_fee_amount", { precision: 10, scale: 2 }).notNull(), // Valor da taxa de plataforma
  delivererAmount: decimal("deliverer_amount", { precision: 10, scale: 2 }).notNull(), // Valor repassado aos entregadores
  status: varchar("status").notNull().default("pending"), // "pending", "paid"
  paidAt: timestamp("paid_at"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
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

export const delivererPaymentsRelations = relations(delivererPayments, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [delivererPayments.deliveryId],
    references: [deliveries.id],
  }),
  deliverer: one(deliverers, {
    fields: [delivererPayments.delivererId],
    references: [deliverers.id],
  }),
  merchant: one(merchants, {
    fields: [delivererPayments.merchantId],
    references: [merchants.id],
  }),
}));

export const merchantPaymentsRelations = relations(merchantPayments, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantPayments.merchantId],
    references: [merchants.id],
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

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDelivererPaymentSchema = createInsertSchema(delivererPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMerchantPaymentSchema = createInsertSchema(merchantPayments).omit({
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

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type Neighborhood = typeof neighborhoods.$inferSelect;

export type InsertDelivererPayment = z.infer<typeof insertDelivererPaymentSchema>;
export type DelivererPayment = typeof delivererPayments.$inferSelect;

export type InsertMerchantPayment = z.infer<typeof insertMerchantPaymentSchema>;
export type MerchantPayment = typeof merchantPayments.$inferSelect;

// Client installations table for tracking remote installations
export const clientInstallations = pgTable("client_installations", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessPhone: varchar("business_phone", { length: 20 }),
  businessEmail: varchar("business_email", { length: 255 }),
  businessAddress: text("business_address"),
  installationId: varchar("installation_id", { length: 100 }).unique().notNull(),
  lastSync: timestamp("last_sync").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client customers table for customers from remote installations
export const clientCustomers = pgTable("client_customers", {
  id: serial("id").primaryKey(),
  installationId: varchar("installation_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client deliveries table for deliveries from remote installations
export const clientDeliveries = pgTable("client_deliveries", {
  id: serial("id").primaryKey(),
  installationId: varchar("installation_id", { length: 100 }).notNull(),
  customerId: integer("customer_id"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  deliveryAddress: text("delivery_address").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("7.00"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("dinheiro"),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for client tables
export const clientInstallationsRelations = relations(clientInstallations, ({ many }) => ({
  customers: many(clientCustomers),
  deliveries: many(clientDeliveries),
}));

export const clientCustomersRelations = relations(clientCustomers, ({ one, many }) => ({
  installation: one(clientInstallations, {
    fields: [clientCustomers.installationId],
    references: [clientInstallations.installationId],
  }),
  deliveries: many(clientDeliveries),
}));

export const clientDeliveriesRelations = relations(clientDeliveries, ({ one }) => ({
  installation: one(clientInstallations, {
    fields: [clientDeliveries.installationId],
    references: [clientInstallations.installationId],
  }),
  customer: one(clientCustomers, {
    fields: [clientDeliveries.customerId],
    references: [clientCustomers.id],
  }),
}));

// Insert schemas for client tables
export const insertClientInstallationSchema = createInsertSchema(clientInstallations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientCustomerSchema = createInsertSchema(clientCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientDeliverySchema = createInsertSchema(clientDeliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for client tables
export type InsertClientInstallation = z.infer<typeof insertClientInstallationSchema>;
export type ClientInstallation = typeof clientInstallations.$inferSelect;

export type InsertClientCustomer = z.infer<typeof insertClientCustomerSchema>;
export type ClientCustomer = typeof clientCustomers.$inferSelect;

export type InsertClientDelivery = z.infer<typeof insertClientDeliverySchema>;
export type ClientDelivery = typeof clientDeliveries.$inferSelect;
