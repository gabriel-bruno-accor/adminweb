import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertHotelSchema, insertSubcroSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Add API routes
  app.get("/api/hotel", async (req: Request, res: Response) => {
    try {
      const hotels = await storage.getAllHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ message: `Error fetching hotels: ${error}` });
    }
  });

  app.get("/api/hotel/:codeHotel", async (req: Request, res: Response) => {
    try {
      const hotel = await storage.getHotel(req.params.codeHotel);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      res.status(500).json({ message: `Error fetching hotel: ${error}` });
    }
  });

  app.post("/api/hotel", async (req: Request, res: Response) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(hotelData);
      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating hotel:", error);
      res.status(500).json({ message: `Error creating hotel: ${error}` });
    }
  });

  app.put("/api/hotel/:codeHotel", async (req: Request, res: Response) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      const hotel = await storage.updateHotel(req.params.codeHotel, hotelData);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating hotel:", error);
      res.status(500).json({ message: `Error updating hotel: ${error}` });
    }
  });

  app.delete("/api/hotel/:codeHotel", async (req: Request, res: Response) => {
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

  app.get("/api/subcro", async (req: Request, res: Response) => {
    try {
      const subcros = await storage.getAllSubcros();
      res.json(subcros);
    } catch (error) {
      console.error("Error fetching subcros:", error);
      res.status(500).json({ message: `Error fetching subcros: ${error}` });
    }
  });

  app.get("/api/subcro/:id", async (req: Request, res: Response) => {
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

  app.post("/api/subcro", async (req: Request, res: Response) => {
    try {
      const subcroData = insertSubcroSchema.parse(req.body);
      const subcro = await storage.createSubcro(subcroData);
      res.status(201).json(subcro);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating subcro:", error);
      res.status(500).json({ message: `Error creating subcro: ${error}` });
    }
  });

  app.put("/api/subcro/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const subcroData = insertSubcroSchema.parse(req.body);
      const subcro = await storage.updateSubcro(id, subcroData);
      if (!subcro) {
        return res.status(404).json({ message: "Subcro not found" });
      }
      res.json(subcro);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating subcro:", error);
      res.status(500).json({ message: `Error updating subcro: ${error}` });
    }
  });

  app.delete("/api/subcro/:id", async (req: Request, res: Response) => {
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

  app.get("/api/hotel-view", async (req: Request, res: Response) => {
    try {
      const maincro = req.query.maincro as string | undefined;
      const subcro = req.query.subcro as string | undefined;
      
      const view = await storage.getHotelMaincroSubcroView(maincro, subcro);
      res.json(view);
    } catch (error) {
      console.error("Error fetching hotel view:", error);
      res.status(500).json({ message: `Error fetching hotel view: ${error}` });
    }
  });

  app.get("/api/user-view", async (req: Request, res: Response) => {
    try {
      const maincro = req.query.maincro as string | undefined;
      const subcro = req.query.subcro as string | undefined;
      
      const view = await storage.getUserMaincroSubcroView(maincro, subcro);
      res.json(view);
    } catch (error) {
      console.error("Error fetching user view:", error);
      res.status(500).json({ message: `Error fetching user view: ${error}` });
    }
  });

  app.post("/api/query", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const querySchema = z.object({
        sql: z.string().min(1).max(10000),
      });
      
      const { sql } = querySchema.parse(req.body);
      const result = await storage.executeQuery(sql);
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

  app.get("/api/maincro", async (req: Request, res: Response) => {
    try {
      const maincros = await storage.getDistinctMaincros();
      res.json(maincros);
    } catch (error) {
      console.error("Error fetching maincros:", error);
      res.status(500).json({ message: `Error fetching maincros: ${error}` });
    }
  });
  
  // Add endpoint to get subcros filtered by maincro
  app.get("/api/subcro/list", async (req: Request, res: Response) => {
    try {
      const maincro = req.query.maincro as string | undefined;
      
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
  
  // Endpoint to get available hotel codes
  app.get("/api/hotel/codes", async (req: Request, res: Response) => {
    try {
      const hotelCodes = await storage.getAvailableHotelCodes();
      res.json(hotelCodes);
    } catch (error) {
      console.error("Error fetching available hotel codes:", error);
      res.status(500).json({ message: `Error fetching hotel codes: ${error}` });
    }
  });
  
  // Add endpoint to get all users
  app.get("/api/user/all", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: `Error fetching all users: ${error}` });
    }
  });
  
  // Add endpoint to update a user
  app.put("/api/user/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // We don't want to allow password changes through this endpoint
      const { password, ...userData } = req.body;
      
      // Use a simple validation to ensure required fields are present
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
  
  // Add endpoint to delete a user
  app.delete("/api/user/:id", async (req: Request, res: Response) => {
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

  // Add endpoint for bulk user upload
  app.post("/api/user/bulk", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const usersArray = req.body;
      if (!Array.isArray(usersArray) || usersArray.length === 0) {
        return res.status(400).json({ message: "Request must contain an array of users" });
      }
      
      // Create validation schema for bulk users
      const bulkUserSchema = z.array(
        z.object({
          username: z.string().min(3).max(50),
          password: z.string().min(6),
          email: z.string().email(),
          maincro: z.string().min(1).max(10)
        })
      );
      
      // Validate the input
      const validUsers = bulkUserSchema.parse(usersArray);
      
      // Process each user
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
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
  
  // Add endpoint for bulk subcro upload
  app.post("/api/subcro/bulk", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const subcrosArray = req.body;
      if (!Array.isArray(subcrosArray) || subcrosArray.length === 0) {
        return res.status(400).json({ message: "Request must contain an array of subcros" });
      }
      
      // Create validation schema for bulk subcros
      const bulkSubcroSchema = z.array(
        z.object({
          maincro: z.string().min(1).max(10),
          subcro: z.string().min(1).max(10),
          label: z.string().max(100).optional(),
          flagcro: z.number().optional(),
          webcallback: z.number().optional()
        })
      );
      
      // Validate the input
      const validSubcros = bulkSubcroSchema.parse(subcrosArray);
      
      // Process each subcro
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
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

  const httpServer = createServer(app);
  return httpServer;
}
