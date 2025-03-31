import { 
  users, 
  hotel, 
  subcro,
  User, 
  InsertUser, 
  Hotel, 
  InsertHotel, 
  Subcro, 
  InsertSubcro,
  HotelMaincroSubcroView,
  UserMaincroSubcroView,
  SqlQueryResult
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, like, sql } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Initialize the session store
const PgSessionStore = connectPgSimple(session);

// Modify the interface with CRUD methods
export interface IStorage {
  // Authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Hotel
  getAllHotels(): Promise<Hotel[]>;
  getHotel(codeHotel: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(codeHotel: string, hotel: InsertHotel): Promise<Hotel | undefined>;
  deleteHotel(codeHotel: string): Promise<boolean>;
  
  // Subcro
  getAllSubcros(): Promise<Subcro[]>;
  getSubcro(id: number): Promise<Subcro | undefined>;
  createSubcro(subcro: InsertSubcro): Promise<Subcro>;
  updateSubcro(id: number, subcro: InsertSubcro): Promise<Subcro | undefined>;
  deleteSubcro(id: number): Promise<boolean>;
  
  // Views
  getHotelMaincroSubcroView(maincro?: string, subcroName?: string): Promise<HotelMaincroSubcroView[]>;
  getUserMaincroSubcroView(maincro?: string, subcroName?: string): Promise<UserMaincroSubcroView[]>;
  
  // Utilities
  executeQuery(query: string): Promise<SqlQueryResult>;
  getDistinctMaincros(): Promise<string[]>;
  getSubcrosByMaincro(maincro: string): Promise<{ id: number; subcro: string }[]>;
  getAvailableHotelCodes(): Promise<string[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    return deleted.length > 0;
  }
  
  // Hotel methods
  async getAllHotels(): Promise<Hotel[]> {
    return await db.select().from(hotel);
  }
  
  async getHotel(codeHotel: string): Promise<Hotel | undefined> {
    const [hotelResult] = await db.select().from(hotel).where(eq(hotel.codeHotel, codeHotel));
    return hotelResult;
  }
  
  async createHotel(hotelData: InsertHotel): Promise<Hotel> {
    const [newHotel] = await db.insert(hotel).values(hotelData).returning();
    return newHotel;
  }
  
  async updateHotel(codeHotel: string, hotelData: InsertHotel): Promise<Hotel | undefined> {
    const [updatedHotel] = await db
      .update(hotel)
      .set(hotelData)
      .where(eq(hotel.codeHotel, codeHotel))
      .returning();
    return updatedHotel;
  }
  
  async deleteHotel(codeHotel: string): Promise<boolean> {
    const deleted = await db.delete(hotel).where(eq(hotel.codeHotel, codeHotel)).returning();
    return deleted.length > 0;
  }
  
  // Subcro methods
  async getAllSubcros(): Promise<Subcro[]> {
    return await db.select().from(subcro);
  }
  
  async getSubcro(id: number): Promise<Subcro | undefined> {
    const [subcroResult] = await db.select().from(subcro).where(eq(subcro.id, id));
    return subcroResult;
  }
  
  async createSubcro(subcroData: InsertSubcro): Promise<Subcro> {
    // Get the max ID to generate a new one (since ID is required by the table but excluded from InsertSubcro)
    const result = await pool.query('SELECT MAX(id) as max_id FROM subcro');
    const maxId = parseInt(result.rows[0]?.max_id || '0', 10);
    const newId = maxId + 1;
    
    // Insert with generated ID
    const [newSubcro] = await db.insert(subcro).values({
      id: newId,
      ...subcroData
    }).returning();
    
    return newSubcro;
  }
  
  async updateSubcro(id: number, subcroData: InsertSubcro): Promise<Subcro | undefined> {
    const [updatedSubcro] = await db
      .update(subcro)
      .set(subcroData)
      .where(eq(subcro.id, id))
      .returning();
    return updatedSubcro;
  }
  
  async deleteSubcro(id: number): Promise<boolean> {
    const deleted = await db.delete(subcro).where(eq(subcro.id, id)).returning();
    return deleted.length > 0;
  }
  
  // View methods - using raw SQL because these are database views
  async getHotelMaincroSubcroView(maincro?: string, subcroName?: string): Promise<HotelMaincroSubcroView[]> {
    let query = 'SELECT * FROM hotel_maincro_subcro';
    const params: any[] = [];
    
    if (maincro || subcroName) {
      query += ' WHERE';
      
      if (maincro) {
        query += ' maincro = $1';
        params.push(maincro);
      }
      
      if (subcroName) {
        if (maincro) query += ' AND';
        query += ` subcro = $${params.length + 1}`;
        params.push(subcroName);
      }
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  async getUserMaincroSubcroView(maincro?: string, subcroName?: string): Promise<UserMaincroSubcroView[]> {
    let query = 'SELECT * FROM user_maincro_subcro';
    const params: any[] = [];
    
    if (maincro || subcroName) {
      query += ' WHERE';
      
      if (maincro) {
        // Support multiple MainCROs per user by using the LIKE operator with pattern matching
        query += ' maincro LIKE $1';
        params.push(`%${maincro}%`); // This allows filtering when maincro is part of a comma-separated list
      }
      
      if (subcroName) {
        if (maincro) query += ' AND';
        query += ` subcro = $${params.length + 1}`;
        params.push(subcroName);
      }
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  // Utility methods
  async executeQuery(query: string): Promise<SqlQueryResult> {
    const startTime = Date.now();
    
    try {
      const result = await pool.query(query);
      const executionTime = (Date.now() - startTime) / 1000;
      
      const columns = result.fields.map(field => field.name);
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
  
  async getDistinctMaincros(): Promise<string[]> {
    const result = await pool.query('SELECT DISTINCT maincro FROM subcro ORDER BY maincro');
    return result.rows.map(row => row.maincro);
  }
  
  async getSubcrosByMaincro(maincro: string): Promise<{ id: number; subcro: string }[]> {
    const result = await pool.query(
      'SELECT id, subcro FROM subcro WHERE maincro = $1 ORDER BY subcro',
      [maincro]
    );
    return result.rows;
  }
  
  async getAvailableHotelCodes(): Promise<string[]> {
    try {
      // Approach: Generate unique 3-digit codes for hotels
      // This creates a list of unused hotel codes for new hotels
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
      
      return result.rows.map(row => row.code);
    } catch (error) {
      console.error("Error fetching available hotel codes:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
