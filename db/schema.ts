import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
  decimal,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type {
  PaymentMethod,
  OrderStatus,
  UserRole,
  DealerStatus,
  AnnouncementSeverity,
  AnnouncementAudience,
  AnnouncementScheduleMode,
} from "@/lib/types";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "dealer",
  "admin",
]);
export const dealerStatusEnum = pgEnum("dealer_status", [
  "pending",
  "approved",
  "rejected",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "paypal",
  "bank_transfer",
  "cod",
  "stripe",
  "satispay",
]);
export const announcementSeverityEnum = pgEnum("announcement_severity", [
  "info",
  "warning",
  "critical",
]);
export const announcementAudienceEnum = pgEnum("announcement_audience", [
  "users",
  "admin",
  "both",
]);
export const announcementScheduleModeEnum = pgEnum("announcement_schedule_mode", [
  "always",
  "range",
]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").notNull().default("customer").$type<UserRole>(),
  company: text("company"),
  vatNumber: text("vat_number"),
  phone: text("phone"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  country: text("country").notNull().default("IT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en"),
  nameFr: text("name_fr"),
  nameEs: text("name_es"),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    sku: text("sku"),
    ean13: text("ean13"),
    nameIt: text("name_it").notNull(),
    nameEn: text("name_en"),
    nameFr: text("name_fr"),
    nameEs: text("name_es"),
    descriptionIt: text("description_it"),
    descriptionEn: text("description_en"),
    descriptionFr: text("description_fr"),
    descriptionEs: text("description_es"),
    descriptionShortIt: text("description_short_it"),
    descriptionShortEn: text("description_short_en"),
    descriptionShortFr: text("description_short_fr"),
    descriptionShortEs: text("description_short_es"),
    slug: text("slug").notNull().unique(),
    /** Prezzo vetrina (catalogo × ricarico). */
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
    /** Listino catalogo fornitore, base del ricarico proporzionale. */
    catalogPrice: decimal("catalog_price", { precision: 10, scale: 2 }),
    wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
    weight: decimal("weight", { precision: 8, scale: 3 }),
    width: decimal("width", { precision: 8, scale: 3 }),
    height: decimal("height", { precision: 8, scale: 3 }),
    depth: decimal("depth", { precision: 8, scale: 3 }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    active: boolean("active").notNull().default(true),
    brand: text("brand"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    imageUrl: text("image_url"),
    fragileShipping: boolean("fragile_shipping").notNull().default(false),
    fragileShippingCost: decimal("fragile_shipping_cost", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const dealerProfiles = pgTable("dealer_profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  vatNumber: text("vat_number").notNull(),
  status: dealerStatusEnum("status").notNull().default("pending").$type<DealerStatus>(),
  discountPercent: integer("discount_percent").notNull().default(50),
  rejectionReason: text("rejection_reason"),
  approvedBy: uuid("approved_by").references(() => profiles.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => profiles.id),
    guestEmail: text("guest_email"),
    status: orderStatusEnum("status").notNull().default("pending").$type<OrderStatus>(),
    paymentMethod: paymentMethodEnum("payment_method").$type<PaymentMethod | null>(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    shippingAddress: jsonb("shipping_address")
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    billingAddress: jsonb("billing_address")
      .notNull()
      .default(sql`'{}'`)
      .$type<Record<string, unknown>>(),
    trackingNumber: text("tracking_number"),
    bankTransferReceiptUrl: text("bank_transfer_receipt_url"),
    notes: text("notes"),
    daneaExported: boolean("danea_exported").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_orders_user_vps").on(t.userId)]
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: integer("discount_percent").notNull().default(0),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stoves = pgTable("stoves", {
  id: serial("id").primaryKey(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en"),
  nameFr: text("name_fr"),
  nameEs: text("name_es"),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  categoria: text("categoria"),
  potenza: text("potenza"),
  dimensioni: text("dimensioni"),
  peso: text("peso"),
});

export const productStoves = pgTable("product_stoves", {
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  stoveId: integer("stove_id")
    .notNull()
    .references(() => stoves.id, { onDelete: "cascade" }),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Log export ordini Easyfatt (GET /api/danea/orders). */
export const daneaOrdersExportLogs = pgTable(
  "danea_orders_export_logs",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    success: boolean("success").notNull(),
    orderCount: integer("order_count").notNull().default(0),
    orderIds: jsonb("order_ids").$type<number[]>(),
    firstdate: text("firstdate"),
    lastdate: text("lastdate"),
    message: text("message"),
  },
  (t) => [index("idx_danea_orders_export_logs_created").on(t.createdAt)]
);

/** Log import catalogo Easyfatt (POST /api/danea/products). */
export const daneaImportLogs = pgTable(
  "danea_import_logs",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    success: boolean("success").notNull(),
    source: text("source").notNull().default("catalog"),
    mode: text("mode"),
    message: text("message"),
    stats: jsonb("stats").$type<{
      created: number;
      updated: number;
      deactivatedFull: number;
      deactivatedDeleted: number;
      skipped: number;
    } | null>(),
    xmlBytes: integer("xml_bytes"),
  },
  (t) => [index("idx_danea_import_logs_created").on(t.createdAt)]
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    messageIt: text("message_it").notNull(),
    messageEn: text("message_en"),
    messageFr: text("message_fr"),
    messageEs: text("message_es"),
    severity: announcementSeverityEnum("severity")
      .notNull()
      .default("info")
      .$type<AnnouncementSeverity>(),
    audience: announcementAudienceEnum("audience")
      .notNull()
      .default("users")
      .$type<AnnouncementAudience>(),
    scheduleMode: announcementScheduleModeEnum("schedule_mode")
      .notNull()
      .default("always")
      .$type<AnnouncementScheduleMode>(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_announcements_active").on(t.active)]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  compatibleStoves: many(productStoves),
}));

export const stovesRelations = relations(stoves, ({ many }) => ({
  products: many(productStoves),
}));

export const productStovesRelations = relations(productStoves, ({ one }) => ({
  product: one(products, { fields: [productStoves.productId], references: [products.id] }),
  stove: one(stoves, { fields: [productStoves.stoveId], references: [stoves.id] }),
}));

export const appUsersRelations = relations(appUsers, ({ one }) => ({
  profile: one(profiles, { fields: [appUsers.id], references: [profiles.id] }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  appUser: one(appUsers, { fields: [profiles.id], references: [appUsers.id] }),
  dealer: one(dealerProfiles, { fields: [profiles.id], references: [dealerProfiles.id] }),
  cartItems: many(cartItems),
  orders: many(orders),
}));
