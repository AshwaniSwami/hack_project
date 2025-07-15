import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { createAdminNotification } from "./routes-notifications";
import { isDatabaseAvailable } from "./db";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Temporary hardcoded admin user for testing when database is not available
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
export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log("isAuthenticated middleware - session:", req.session);
  console.log("isAuthenticated middleware - sessionId:", req.sessionID);
  console.log("isAuthenticated middleware - userId:", (req.session as any)?.userId);
  
  if (req.session && (req.session as any).userId) {
    try {
      // Check if database is available
      if (!isDatabaseAvailable()) {
        // Use temporary authentication when database is not available
        const userId = (req.session as any).userId;
        console.log("Temp auth - checking userId:", userId, "against", TEMP_ADMIN.id);
        if (userId === TEMP_ADMIN.id) {
          req.user = {
            id: TEMP_ADMIN.id,
            email: TEMP_ADMIN.email,
            role: TEMP_ADMIN.role,
            firstName: TEMP_ADMIN.firstName,
            lastName: TEMP_ADMIN.lastName,
          };
          console.log("Temp auth - user set:", req.user);
          next();
        } else {
          console.log("Temp auth - user not found");
          res.status(401).json({ message: "User not found" });
        }
        return;
      }

      // Use database authentication when available
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        next();
      } else {
        res.status(401).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  } else {
    console.log("No session or userId found");
    res.status(401).json({ message: "Not authenticated" });
  }
};

// Middleware to check if user is admin
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).userId) {
    try {
      // Check if database is available
      if (!isDatabaseAvailable()) {
        // Use temporary authentication when database is not available
        const userId = (req.session as any).userId;
        if (userId === TEMP_ADMIN.id) {
          req.user = {
            id: TEMP_ADMIN.id,
            email: TEMP_ADMIN.email,
            role: TEMP_ADMIN.role,
            firstName: TEMP_ADMIN.firstName,
            lastName: TEMP_ADMIN.lastName,
          };
          next();
        } else {
          res.status(403).json({ message: "Admin access required" });
        }
        return;
      }

      // Use database authentication when available
      const user = await storage.getUser((req.session as any).userId);
      if (user && user.role === 'admin') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        next();
      } else {
        res.status(403).json({ message: "Admin access required" });
      }
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Error checking user permissions" });
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

    // Check if database is available
    if (!isDatabaseAvailable()) {
      // Use temporary authentication when database is not available
      if (email === TEMP_ADMIN.email) {
        const isValid = await bcrypt.compare(password, TEMP_ADMIN.password);
        if (isValid) {
          (req.session as any).userId = TEMP_ADMIN.id;
          return res.json({
            message: "Login successful",
            user: {
              id: TEMP_ADMIN.id,
              email: TEMP_ADMIN.email,
              role: TEMP_ADMIN.role,
              firstName: TEMP_ADMIN.firstName,
              lastName: TEMP_ADMIN.lastName,
            }
          });
        }
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get all users and find by email (since we don't have email-specific query)
    const users = await storage.getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been suspended. Please contact an administrator." });
    }

    // Check if user is verified (except for admin who is auto-verified)
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({ message: "Account pending verification. Please wait for admin approval." });
    }

    // Check password
    const isValid = user.password ? await bcrypt.compare(password, user.password) : false;
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update login stats
    await storage.updateUser(user.id, {
      loginCount: (user.loginCount || 0) + 1,
      lastLoginAt: new Date(),
    });

    // Store user ID in session
    (req.session as any).userId = user.id;
    console.log("Login successful - stored userId in session:", user.id, "sessionID:", req.sessionID);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// Register handler
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    const users = await storage.getAllUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine role - first user is admin, rest are members
    const isFirstUser = users.length === 0;
    const role = isFirstUser ? 'admin' : 'member';
    
    // First user (admin) is auto-verified, others need verification
    const isVerified = isFirstUser;

    // Create user
    const newUser = await storage.createUser({
      id: nanoid(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: isFirstUser, // Only admin is active by default
      isVerified,
      loginCount: isFirstUser ? 1 : 0,
      lastLoginAt: isFirstUser ? new Date() : undefined,
    });

    // Only log in admin users immediately, others need verification
    if (isFirstUser) {
      (req.session as any).userId = newUser.id;
    } else {
      // Create notification for admin users about new user registration
      await createAdminNotification(
        "user_verification_request",
        "User Verification Required",
        `${email} needs approval to access the platform`,
        newUser.id,
        newUser.email,
        `${firstName} ${lastName}`,
        "/users",
        "high"
      );
    }
    
    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      message: isFirstUser 
        ? "Welcome! Your admin account has been created successfully." 
        : "Account created successfully! Please wait for admin verification before you can log in."
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
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
    console.log("Session check - userId:", userId, "sessionID:", req.sessionID);
    
    if (!userId) {
      console.log("No userId in session");
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if database is available
    if (!isDatabaseAvailable()) {
      // Use temporary authentication when database is not available
      if (userId === TEMP_ADMIN.id) {
        console.log("Successfully retrieved temp admin user");
        return res.json({
          id: TEMP_ADMIN.id,
          email: TEMP_ADMIN.email,
          firstName: TEMP_ADMIN.firstName,
          lastName: TEMP_ADMIN.lastName,
          role: TEMP_ADMIN.role,
        });
      } else {
        console.log("User not found for userId:", userId);
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Use database authentication when available
    const user = await storage.getUser(userId);
    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Successfully retrieved user:", user.email);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};