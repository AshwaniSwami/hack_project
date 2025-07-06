import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { tempProjects, tempEpisodes, tempScripts, tempRadioStations, tempUsers, tempFiles } from "./tempData";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Temporary hardcoded admin user for testing
const TEMP_ADMIN = {
  id: "temp-admin-001",
  email: "admin@example.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  isActive: true,
  loginCount: 0,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).userId) {
    // For temp auth, if logged in as temp admin, they are admin
    if ((req.session as any).userId === TEMP_ADMIN.id) {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check against temporary admin user
    if (email === TEMP_ADMIN.email) {
      const isValid = await bcrypt.compare(password, TEMP_ADMIN.password);
      
      if (isValid) {
        // Store user ID in session
        (req.session as any).userId = TEMP_ADMIN.id;
        
        return res.json({
          success: true,
          user: {
            id: TEMP_ADMIN.id,
            email: TEMP_ADMIN.email,
            firstName: TEMP_ADMIN.firstName,
            lastName: TEMP_ADMIN.lastName,
            role: TEMP_ADMIN.role,
          }
        });
      }
    }

    res.status(401).json({ message: "Invalid credentials. Use admin@example.com / password for demo" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// Register handler (disabled for temp auth)
export const register = async (req: Request, res: Response) => {
  res.status(400).json({ 
    message: "Registration disabled in demo mode. Use admin@example.com / password to login" 
  });
};

// Logout handler
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ success: true });
  });
};

// Get current user
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (userId === TEMP_ADMIN.id) {
      return res.json({
        id: TEMP_ADMIN.id,
        email: TEMP_ADMIN.email,
        firstName: TEMP_ADMIN.firstName,
        lastName: TEMP_ADMIN.lastName,
        role: TEMP_ADMIN.role,
      });
    }

    res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};