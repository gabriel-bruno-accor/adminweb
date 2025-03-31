var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  hotel: () => hotel,
  hotelRelations: () => hotelRelations,
  insertHotelSchema: () => insertHotelSchema,
  insertSubcroSchema: () => insertSubcroSchema,
  insertUserSchema: () => insertUserSchema,
  subcro: () => subcro,
  subcroRelations: () => subcroRelations,
  users: () => users
});
import { pgTable, text, serial, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email").notNull(),
  maincro: varchar("maincro").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  maincro: true
});
var subcro = pgTable("subcro", {
  id: integer("id").primaryKey(),
  maincro: varchar("maincro").notNull(),
  subcro: varchar("subcro").notNull(),
  label: varchar("label"),
  flagcro: integer("flagcro"),
  webcallback: integer("webcallback")
});
var subcroRelations = relations(subcro, ({ many }) => ({
  hotels: many(hotel)
}));
var insertSubcroSchema = createInsertSchema(subcro).omit({ id: true });
var hotel = pgTable("hotel", {
  codeHotel: varchar("codeHotel").notNull().primaryKey(),
  subcroId: integer("subcroId").notNull().references(() => subcro.id)
});
var hotelRelations = relations(hotel, ({ one }) => ({
  subcro: one(subcro, {
    fields: [hotel.subcroId],
    references: [subcro.id]
  })
}));
var insertHotelSchema = createInsertSchema(hotel);

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : void 0,
  max: 10,
  idleTimeoutMillis: 3e4
});
pool.connect().then((client) => {
  console.log("PostgreSQL database connection has been established successfully.");
  client.release();
}).catch((err) => {
  console.error("Unable to connect to the database:", err);
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
var PgSessionStore = connectPgSimple(session);
var DatabaseStorage = class {
  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async updateUser(id, userData) {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async deleteUser(id) {
    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    return deleted.length > 0;
  }
  // Hotel methods
  async getAllHotels() {
    return await db.select().from(hotel);
  }
  async getHotel(codeHotel) {
    const [hotelResult] = await db.select().from(hotel).where(eq(hotel.codeHotel, codeHotel));
    return hotelResult;
  }
  async createHotel(hotelData) {
    const [newHotel] = await db.insert(hotel).values(hotelData).returning();
    return newHotel;
  }
  async updateHotel(codeHotel, hotelData) {
    const [updatedHotel] = await db.update(hotel).set(hotelData).where(eq(hotel.codeHotel, codeHotel)).returning();
    return updatedHotel;
  }
  async deleteHotel(codeHotel) {
    const deleted = await db.delete(hotel).where(eq(hotel.codeHotel, codeHotel)).returning();
    return deleted.length > 0;
  }
  // Subcro methods
  async getAllSubcros() {
    return await db.select().from(subcro);
  }
  async getSubcro(id) {
    const [subcroResult] = await db.select().from(subcro).where(eq(subcro.id, id));
    return subcroResult;
  }
  async createSubcro(subcroData) {
    const result = await pool.query("SELECT MAX(id) as max_id FROM subcro");
    const maxId = parseInt(result.rows[0]?.max_id || "0", 10);
    const newId = maxId + 1;
    const [newSubcro] = await db.insert(subcro).values({
      id: newId,
      ...subcroData
    }).returning();
    return newSubcro;
  }
  async updateSubcro(id, subcroData) {
    const [updatedSubcro] = await db.update(subcro).set(subcroData).where(eq(subcro.id, id)).returning();
    return updatedSubcro;
  }
  async deleteSubcro(id) {
    const deleted = await db.delete(subcro).where(eq(subcro.id, id)).returning();
    return deleted.length > 0;
  }
  // View methods - using raw SQL because these are database views
  async getHotelMaincroSubcroView(maincro, subcroName) {
    let query = "SELECT * FROM hotel_maincro_subcro";
    const params = [];
    if (maincro || subcroName) {
      query += " WHERE";
      if (maincro) {
        query += " maincro = $1";
        params.push(maincro);
      }
      if (subcroName) {
        if (maincro) query += " AND";
        query += ` subcro = $${params.length + 1}`;
        params.push(subcroName);
      }
    }
    const result = await pool.query(query, params);
    return result.rows;
  }
  async getUserMaincroSubcroView(maincro, subcroName) {
    let query = "SELECT * FROM user_maincro_subcro";
    const params = [];
    if (maincro || subcroName) {
      query += " WHERE";
      if (maincro) {
        query += " maincro LIKE $1";
        params.push(`%${maincro}%`);
      }
      if (subcroName) {
        if (maincro) query += " AND";
        query += ` subcro = $${params.length + 1}`;
        params.push(subcroName);
      }
    }
    const result = await pool.query(query, params);
    return result.rows;
  }
  // Utility methods
  async executeQuery(query) {
    const startTime = Date.now();
    try {
      const result = await pool.query(query);
      const executionTime = (Date.now() - startTime) / 1e3;
      const columns = result.fields.map((field) => field.name);
      return {
        columns,
        rows: result.rows,
        message: `Query executed successfully. ${result.rowCount} rows returned.`,
        executionTime
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }
  async getDistinctMaincros() {
    const result = await pool.query("SELECT DISTINCT maincro FROM subcro ORDER BY maincro");
    return result.rows.map((row) => row.maincro);
  }
  async getSubcrosByMaincro(maincro) {
    const result = await pool.query(
      "SELECT id, subcro FROM subcro WHERE maincro = $1 ORDER BY subcro",
      [maincro]
    );
    return result.rows;
  }
  async getAvailableHotelCodes() {
    try {
      const result = await pool.query(`
        WITH all_codes AS (
          SELECT lpad(n::text, 3, '0') AS code 
          FROM generate_series(0, 999) n
        )
        SELECT code FROM all_codes
        WHERE code NOT IN (SELECT "codeHotel" FROM hotel)
        ORDER BY code
        LIMIT 100
      `);
      return result.rows.map((row) => row.code);
    } catch (error) {
      console.error("Error fetching available hotel codes:", error);
      return [];
    }
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const PostgresSessionStore = connectPg(session2);
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1e3
      // 30 days
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/hotel", async (req, res) => {
    try {
      const hotels = await storage.getAllHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ message: `Error fetching hotels: ${error}` });
    }
  });
  app2.get("/api/hotel/:codeHotel", async (req, res) => {
    try {
      const hotel2 = await storage.getHotel(req.params.codeHotel);
      if (!hotel2) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel2);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      res.status(500).json({ message: `Error fetching hotel: ${error}` });
    }
  });
  app2.post("/api/hotel", async (req, res) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel2 = await storage.createHotel(hotelData);
      res.status(201).json(hotel2);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating hotel:", error);
      res.status(500).json({ message: `Error creating hotel: ${error}` });
    }
  });
  app2.put("/api/hotel/:codeHotel", async (req, res) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel2 = await storage.updateHotel(req.params.codeHotel, hotelData);
      if (!hotel2) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel2);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating hotel:", error);
      res.status(500).json({ message: `Error updating hotel: ${error}` });
    }
  });
  app2.delete("/api/hotel/:codeHotel", async (req, res) => {
    try {
      const success = await storage.deleteHotel(req.params.codeHotel);
      if (!success) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ message: `Error deleting hotel: ${error}` });
    }
  });
  app2.get("/api/subcro", async (req, res) => {
    try {
      const subcros = await storage.getAllSubcros();
      res.json(subcros);
    } catch (error) {
      console.error("Error fetching subcros:", error);
      res.status(500).json({ message: `Error fetching subcros: ${error}` });
    }
  });
  app2.get("/api/subcro/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const subcroData = await storage.getSubcro(id);
      if (!subcroData) {
        return res.status(404).json({ message: "Subcro not found" });
      }
      res.json(subcroData);
    } catch (error) {
      console.error("Error fetching subcro:", error);
      res.status(500).json({ message: `Error fetching subcro: ${error}` });
    }
  });
  app2.post("/api/subcro", async (req, res) => {
    try {
      const subcroData = insertSubcroSchema.parse(req.body);
      const subcro2 = await storage.createSubcro(subcroData);
      res.status(201).json(subcro2);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating subcro:", error);
      res.status(500).json({ message: `Error creating subcro: ${error}` });
    }
  });
  app2.put("/api/subcro/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const subcroData = insertSubcroSchema.parse(req.body);
      const subcro2 = await storage.updateSubcro(id, subcroData);
      if (!subcro2) {
        return res.status(404).json({ message: "Subcro not found" });
      }
      res.json(subcro2);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating subcro:", error);
      res.status(500).json({ message: `Error updating subcro: ${error}` });
    }
  });
  app2.delete("/api/subcro/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const success = await storage.deleteSubcro(id);
      if (!success) {
        return res.status(404).json({ message: "Subcro not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subcro:", error);
      res.status(500).json({ message: `Error deleting subcro: ${error}` });
    }
  });
  app2.get("/api/hotel-view", async (req, res) => {
    try {
      const maincro = req.query.maincro;
      const subcro2 = req.query.subcro;
      const view = await storage.getHotelMaincroSubcroView(maincro, subcro2);
      res.json(view);
    } catch (error) {
      console.error("Error fetching hotel view:", error);
      res.status(500).json({ message: `Error fetching hotel view: ${error}` });
    }
  });
  app2.get("/api/user-view", async (req, res) => {
    try {
      const maincro = req.query.maincro;
      const subcro2 = req.query.subcro;
      const view = await storage.getUserMaincroSubcroView(maincro, subcro2);
      res.json(view);
    } catch (error) {
      console.error("Error fetching user view:", error);
      res.status(500).json({ message: `Error fetching user view: ${error}` });
    }
  });
  app2.post("/api/query", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const querySchema = z.object({
        sql: z.string().min(1).max(1e4)
      });
      const { sql: sql2 } = querySchema.parse(req.body);
      const result = await storage.executeQuery(sql2);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error executing query:", error);
      res.status(500).json({ message: `Error executing query: ${error}` });
    }
  });
  app2.get("/api/maincro", async (req, res) => {
    try {
      const maincros = await storage.getDistinctMaincros();
      res.json(maincros);
    } catch (error) {
      console.error("Error fetching maincros:", error);
      res.status(500).json({ message: `Error fetching maincros: ${error}` });
    }
  });
  app2.get("/api/subcro/list", async (req, res) => {
    try {
      const maincro = req.query.maincro;
      if (!maincro) {
        return res.status(400).json({ message: "MainCRO parameter is required" });
      }
      const subcros = await storage.getSubcrosByMaincro(maincro);
      res.json(subcros);
    } catch (error) {
      console.error("Error fetching subcros by maincro:", error);
      res.status(500).json({ message: `Error fetching subcros: ${error}` });
    }
  });
  app2.get("/api/hotel/codes", async (req, res) => {
    try {
      const hotelCodes = await storage.getAvailableHotelCodes();
      res.json(hotelCodes);
    } catch (error) {
      console.error("Error fetching available hotel codes:", error);
      res.status(500).json({ message: `Error fetching hotel codes: ${error}` });
    }
  });
  app2.get("/api/user/all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: `Error fetching all users: ${error}` });
    }
  });
  app2.put("/api/user/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const { password, ...userData } = req.body;
      if (!userData.username || !userData.email || !userData.maincro) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: `Error updating user: ${error}` });
    }
  });
  app2.delete("/api/user/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: `Error deleting user: ${error}` });
    }
  });
  app2.post("/api/user/bulk", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const usersArray = req.body;
      if (!Array.isArray(usersArray) || usersArray.length === 0) {
        return res.status(400).json({ message: "Request must contain an array of users" });
      }
      const bulkUserSchema = z.array(
        z.object({
          username: z.string().min(3).max(50),
          password: z.string().min(6),
          email: z.string().email(),
          maincro: z.string().min(1).max(10)
        })
      );
      const validUsers = bulkUserSchema.parse(usersArray);
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      for (const userData of validUsers) {
        try {
          await storage.createUser(userData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to create user ${userData.username}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error processing bulk user upload:", error);
      res.status(500).json({ message: `Error processing bulk user upload: ${error}` });
    }
  });
  app2.post("/api/subcro/bulk", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const subcrosArray = req.body;
      if (!Array.isArray(subcrosArray) || subcrosArray.length === 0) {
        return res.status(400).json({ message: "Request must contain an array of subcros" });
      }
      const bulkSubcroSchema = z.array(
        z.object({
          maincro: z.string().min(1).max(10),
          subcro: z.string().min(1).max(10),
          label: z.string().max(100).optional(),
          flagcro: z.number().optional(),
          webcallback: z.number().optional()
        })
      );
      const validSubcros = bulkSubcroSchema.parse(subcrosArray);
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      for (const subcroData of validSubcros) {
        try {
          await storage.createSubcro(subcroData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to create subcro ${subcroData.subcro}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error processing bulk subcro upload:", error);
      res.status(500).json({ message: `Error processing bulk subcro upload: ${error}` });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
