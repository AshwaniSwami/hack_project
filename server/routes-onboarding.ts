import { Request, Response } from "express";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { getDb, isDatabaseAvailable } from "./db";
import { onboardingFormConfig, onboardingFormResponses, users } from "@shared/schema";
import { AuthenticatedRequest, isAuthenticated, isAdmin } from "./auth";
import { insertOnboardingFormConfigSchema, insertOnboardingFormResponseSchema } from "@shared/schema";
// Mock data for demonstration
const mockUsers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    location: { country: "USA", city: "New York", latitude: 40.7128, longitude: -74.0060 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "research", "interests": ["technology", "education"], "experience": "intermediate", "organization": "University" }
  },
  {
    id: "user2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    location: { country: "India", city: "Mumbai", latitude: 19.0760, longitude: 72.8777 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "learning", "interests": ["healthcare", "research"], "experience": "beginner", "organization": "NGO" }
  },
  {
    id: "user3",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    location: { country: "Brazil", city: "São Paulo", latitude: -23.5558, longitude: -46.6396 },
    firstLoginCompleted: false,
    customFormResponses: {}
  },
  {
    id: "user4",
    name: "David Ochieng",
    email: "david.ochieng@example.com",
    location: { country: "Kenya", city: "Nairobi", latitude: -1.2921, longitude: 36.8219 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "teaching", "interests": ["education", "technology"], "experience": "advanced", "organization": "School" }
  },
  {
    id: "user5",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    location: { country: "Canada", city: "Toronto", latitude: 43.6532, longitude: -79.3832 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "research", "interests": ["science", "education"], "experience": "intermediate", "organization": "Research Institute" }
  },
  {
    id: "user6",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    location: { country: "Egypt", city: "Cairo", latitude: 30.0444, longitude: 31.2357 },
    firstLoginCompleted: false,
    customFormResponses: {}
  },
  {
    id: "user7",
    name: "Lisa Chen",
    email: "lisa.chen@example.com",
    location: { country: "Singapore", city: "Singapore", latitude: 1.3521, longitude: 103.8198 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "learning", "interests": ["technology", "business"], "experience": "advanced", "organization": "Company" }
  },
  {
    id: "user8",
    name: "James Wilson",
    email: "james.wilson@example.com",
    location: { country: "Australia", city: "Sydney", latitude: -33.8688, longitude: 151.2093 },
    firstLoginCompleted: true,
    customFormResponses: { "purpose": "teaching", "interests": ["education", "arts"], "experience": "intermediate", "organization": "University" }
  }
];

const mockFormConfig = {
  questions: [
    { id: "purpose", type: "radio", label: "What brings you to our platform?", options: ["Research", "Learning", "Teaching", "Professional Development"], compulsory: true },
    { id: "interests", type: "checkbox", label: "What are your areas of interest? (Select all that apply)", options: ["Technology", "Healthcare", "Education", "Science", "Arts", "Business", "Environment"], compulsory: false },
    { id: "experience", type: "radio", label: "How would you describe your experience level?", options: ["Beginner", "Intermediate", "Advanced", "Expert"], compulsory: true },
    { id: "organization", type: "radio", label: "What type of organization are you affiliated with?", options: ["University", "School", "NGO", "Company", "Government", "Independent", "Other"], compulsory: false }
  ]
};

const getUserStatsByLocation = () => {
  const countries = {};
  const cities = {};
  mockUsers.forEach(user => {
    const country = user.location.country;
    const city = user.location.city;
    countries[country] = (countries[country] || 0) + 1;
    cities[city] = (cities[city] || 0) + 1;
  });
  return { countries, cities };
};

const getResponseStatistics = () => {
  const completedUsers = mockUsers.filter(user => user.firstLoginCompleted);
  const responseStats = {};
  mockFormConfig.questions.forEach(question => {
    responseStats[question.id] = {};
    if (question.type === 'radio') {
      question.options.forEach(option => {
        responseStats[question.id][option.toLowerCase()] = 0;
      });
      completedUsers.forEach(user => {
        const response = user.customFormResponses[question.id];
        if (response) {
          responseStats[question.id][response] = (responseStats[question.id][response] || 0) + 1;
        }
      });
    } else if (question.type === 'checkbox') {
      question.options.forEach(option => {
        responseStats[question.id][option.toLowerCase()] = 0;
      });
      completedUsers.forEach(user => {
        const responses = user.customFormResponses[question.id];
        if (Array.isArray(responses)) {
          responses.forEach(response => {
            responseStats[question.id][response] = (responseStats[question.id][response] || 0) + 1;
          });
        }
      });
    }
  });
  return responseStats;
};

// Type definitions
interface FormQuestion {
  id: string;
  type: "radio" | "checkbox" | "text";
  label: string;
  options?: string[];
  compulsory: boolean;
}

interface FormConfig {
  questions: FormQuestion[];
}

interface OnboardingSubmission {
  location: {
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  [key: string]: any;
}

// Get current form configuration
export const getCurrentFormConfig = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseAvailable()) {
      // Return mock data when database is not available
      return res.json(mockFormConfig);
    }

    const db = getDb();
    const activeConfig = await db
      .select()
      .from(onboardingFormConfig)
      .where(eq(onboardingFormConfig.isActive, true))
      .orderBy(desc(onboardingFormConfig.version))
      .limit(1);

    if (activeConfig.length === 0) {
      // Create default form configuration if none exists
      console.log("No active form config found, creating default...");
      const defaultConfig = {
        questions: [
          { id: "name", type: "text", label: "What is your name?", compulsory: true },
          { id: "role", type: "radio", label: "What is your primary role?", options: ["Radio Host", "Producer", "Script Writer", "Content Manager", "Technical Director"], compulsory: true },
          { id: "experience", type: "radio", label: "How many years of radio experience do you have?", options: ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "More than 10 years"], compulsory: true },
          { id: "interests", type: "checkbox", label: "What type of content are you most interested in? (Select all that apply)", options: ["News & Current Affairs", "Music Shows", "Talk Shows", "Educational Content", "Community Programs", "Sports Commentary"], compulsory: false },
          { id: "station_type", type: "radio", label: "What type of radio station are you affiliated with?", options: ["Community Radio", "Commercial Radio", "Public Radio", "Internet Radio", "Podcast Network", "Independent"], compulsory: true },
          { id: "goals", type: "text", label: "What are your main goals for using this platform?", compulsory: false }
        ] as FormQuestion[],
        createdBy: "srjJo8pVzsXT0b4O0_-wR", // Use the correct admin user ID
        version: 1,
        isActive: true,
      };
      
      const [newConfig] = await db.insert(onboardingFormConfig).values(defaultConfig).returning();
      console.log("Created default form config:", newConfig);
      return res.json(newConfig.questions);
    }

    res.json(activeConfig[0].questions);
  } catch (error) {
    console.error("Error fetching form config:", error);
    res.status(500).json({ error: "Failed to fetch form configuration" });
  }
};

// Update form configuration (Admin only)
export const updateFormConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const configData = insertOnboardingFormConfigSchema.parse({
      questions: req.body.questions,
      createdBy: req.user.id,
    });

    if (!isDatabaseAvailable()) {
      console.log("Form config would be saved:", configData);
      return res.json({ success: true, message: "Form configuration saved (mock mode)" });
    }

    const db = getDb();
    // Deactivate all previous configurations
    await db
      .update(onboardingFormConfig)
      .set({ isActive: false })
      .where(eq(onboardingFormConfig.isActive, true));

    // Get the next version number
    const latestVersion = await db
      .select({ version: onboardingFormConfig.version })
      .from(onboardingFormConfig)
      .orderBy(desc(onboardingFormConfig.version))
      .limit(1);

    const nextVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

    // Insert new configuration
    await db.insert(onboardingFormConfig).values({
      ...configData,
      version: nextVersion,
      isActive: true,
    });

    res.json({ success: true, message: "Form configuration updated successfully" });
  } catch (error) {
    console.error("Error updating form config:", error);
    res.status(500).json({ error: "Failed to update form configuration" });
  }
};

// Submit onboarding form
export const submitOnboardingForm = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("Onboarding submission - session:", req.session);
    console.log("Onboarding submission - user:", req.user);
    
    // Handle authentication in case middleware failed to set user
    if (!req.user && req.session && (req.session as any).userId) {
      const userId = (req.session as any).userId;
      console.log("Manually setting user from session userId:", userId);
      
      // Set user from session (temp auth mode)
      if (userId === "temp-admin-001") {
        req.user = {
          id: "temp-admin-001",
          email: "admin@example.com",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
        };
        console.log("User set manually:", req.user);
      }
    }
    
    console.log("Final req.user check:", req.user);
    if (!req.user) {
      console.log("Authentication failed - no user found");
      return res.status(401).json({ error: "Authentication required" });
    }

    const submissionData: OnboardingSubmission = req.body;
    console.log("Onboarding submission received:", { userId: req.user.id, data: submissionData });

    if (!isDatabaseAvailable()) {
      // In mock mode, we'll simulate the success but log the data
      console.log("Onboarding submission (mock mode):", {
        userId: req.user.id,
        data: submissionData,
      });
      
      // For testing purposes, we'll add some persistence simulation
      const userMockData = {
        id: req.user.id,
        location: submissionData.location,
        onboardingResponses: submissionData,
        firstLoginCompleted: true,
      };
      
      return res.json({ 
        success: true, 
        message: "Onboarding completed successfully",
        userData: userMockData
      });
    }

    const db = getDb();
    // Get current form configuration
    const activeConfig = await db
      .select()
      .from(onboardingFormConfig)
      .where(eq(onboardingFormConfig.isActive, true))
      .orderBy(desc(onboardingFormConfig.version))
      .limit(1);

    let formConfig;
    
    if (activeConfig.length === 0) {
      // Create default form configuration if none exists
      console.log("No active form config found, creating default...");
      const defaultConfig = {
        questions: [
          { id: "name", type: "text", label: "What is your name?", compulsory: true },
          { id: "role", type: "radio", label: "What is your role?", options: ["Beginner", "Intermediate", "Advanced", "Expert"], compulsory: true },
          { id: "experience", type: "radio", label: "How would you describe your experience level?", options: ["Beginner", "Intermediate", "Advanced", "Expert"], compulsory: true }
        ] as FormQuestion[],
        createdBy: req.user.id,
        version: 1,
        isActive: true,
      };
      
      const [newConfig] = await db.insert(onboardingFormConfig).values(defaultConfig).returning();
      formConfig = newConfig;
      console.log("Created default form config:", formConfig);
    } else {
      formConfig = activeConfig[0];
    }

    // Update user's location and onboarding status
    await db
      .update(users)
      .set({
        location: submissionData.location,
        onboardingResponses: submissionData,
        firstLoginCompleted: true,
      })
      .where(eq(users.id, req.user.id));

    // Save individual responses for analytics
    const { nanoid } = await import("nanoid");
    const responses = [];
    for (const question of formConfig.questions as FormQuestion[]) {
      const response = submissionData[question.id];
      if (response !== undefined) {
        responses.push({
          id: nanoid(),
          userId: req.user.id,
          formConfigId: formConfig.id,
          questionId: question.id,
          questionType: question.type,
          questionLabel: question.label,
          response: response,
          isCompulsory: question.compulsory,
        });
      }
    }

    if (responses.length > 0) {
      await db.insert(onboardingFormResponses).values(responses);
    }

    res.json({ success: true, message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Error submitting onboarding form:", error);
    res.status(500).json({ error: "Failed to submit onboarding form" });
  }
};

// Get onboarding analytics (Admin only)
export const getOnboardingAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Handle authentication in case middleware failed to set user
    if (!req.user && req.session && (req.session as any).userId) {
      const userId = (req.session as any).userId;
      if (userId === "temp-admin-001") {
        req.user = {
          id: "temp-admin-001",
          email: "admin@example.com",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
        };
      }
    }
    
    console.log("Analytics request - user:", req.user);
    console.log("Analytics request - user role:", req.user?.role);
    
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!isDatabaseAvailable()) {
      // Return mock analytics data
      const locationStats = getUserStatsByLocation();
      const responseStats = getResponseStatistics();
      const completedUsers = mockUsers.filter(user => user.firstLoginCompleted);

      return res.json({
        totalUsers: mockUsers.length,
        completedUsers: completedUsers.length,
        completionRate: Math.round((completedUsers.length / mockUsers.length) * 100),
        locationStats,
        responseStats,
        users: mockUsers,
        formConfig: mockFormConfig,
      });
    }

    const db = getDb();
    // Get all users with their onboarding status
    const allUsers = await db.select().from(users);
    const completedUsers = allUsers.filter(user => user.firstLoginCompleted);

    // Get location statistics
    const locationStats = {
      countries: {},
      cities: {},
    };

    allUsers.forEach(user => {
      if (user.location) {
        const location = user.location as any;
        const country = location.country;
        const city = location.city;

        if (country) {
          locationStats.countries[country] = (locationStats.countries[country] || 0) + 1;
        }
        if (city) {
          locationStats.cities[city] = (locationStats.cities[city] || 0) + 1;
        }
      }
    });

    // Get response statistics
    const responses = await db.select().from(onboardingFormResponses);
    const responseStats = {};

    responses.forEach(response => {
      if (!responseStats[response.questionId]) {
        responseStats[response.questionId] = {};
      }

      const responseValue = response.response;
      if (Array.isArray(responseValue)) {
        responseValue.forEach(value => {
          responseStats[response.questionId][value] = 
            (responseStats[response.questionId][value] || 0) + 1;
        });
      } else {
        responseStats[response.questionId][responseValue] = 
          (responseStats[response.questionId][responseValue] || 0) + 1;
      }
    });

    // Get current form config
    const activeConfig = await db
      .select()
      .from(onboardingFormConfig)
      .where(eq(onboardingFormConfig.isActive, true))
      .orderBy(desc(onboardingFormConfig.version))
      .limit(1);

    const formConfig = activeConfig.length > 0 ? activeConfig[0].questions : { questions: [] };

    console.log("Getting onboarding analytics...");
    console.log("Raw responses:", responses);
    console.log("Completed users:", completedUsers.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, location: u.location, onboardingResponses: u.onboardingResponses })));
    
    // If no individual responses exist but we have completed users, migrate their data
    if (responses.length === 0 && completedUsers.length > 0) {
      console.log("Migrating existing user responses to analytics table...");
      
      // Get or create form config
      let migrationFormConfig = await db
        .select()
        .from(onboardingFormConfig)
        .where(eq(onboardingFormConfig.isActive, true))
        .limit(1);
      
      if (migrationFormConfig.length === 0) {
        // Create default form configuration for migration
        const defaultConfig = {
          questions: [
            { id: "name", type: "text", label: "What is your name?", compulsory: true },
            { id: "role", type: "radio", label: "What is your role?", options: ["Beginner", "Intermediate", "Advanced", "Expert"], compulsory: true },
            { id: "experience", type: "radio", label: "How would you describe your experience level?", options: ["Beginner", "Intermediate", "Advanced", "Expert"], compulsory: true }
          ] as FormQuestion[],
          createdBy: "1CsOEJFXS4MSwk2nRWDm9", // Use the admin user ID  
          version: 1,
          isActive: true,
        };
        
        const [newConfig] = await db.insert(onboardingFormConfig).values(defaultConfig).returning();
        migrationFormConfig = [newConfig];
      }
      
      const formConfig = migrationFormConfig[0];
      
      // Migrate existing user responses
      const { nanoid } = await import("nanoid");
      const migrationResponses = [];
      for (const user of completedUsers) {
        if (user.onboardingResponses) {
          const userResponses = user.onboardingResponses as any;
          for (const question of formConfig.questions as FormQuestion[]) {
            const response = userResponses[question.id];
            if (response !== undefined) {
              migrationResponses.push({
                id: nanoid(),
                userId: user.id,
                formConfigId: formConfig.id,
                questionId: question.id,
                questionType: question.type,
                questionLabel: question.label,
                response: response,
                isCompulsory: question.compulsory,
              });
            }
          }
        }
      }
      
      if (migrationResponses.length > 0) {
        await db.insert(onboardingFormResponses).values(migrationResponses);
        console.log(`Migrated ${migrationResponses.length} responses to analytics table`);
        
        // Re-fetch responses after migration
        const newResponses = await db.select().from(onboardingFormResponses);
        
        // Recalculate response statistics
        const newResponseStats = {};
        newResponses.forEach(response => {
          if (!newResponseStats[response.questionId]) {
            newResponseStats[response.questionId] = {};
          }
          
          const responseValue = response.response;
          if (Array.isArray(responseValue)) {
            responseValue.forEach(value => {
              newResponseStats[response.questionId][value] = 
                (newResponseStats[response.questionId][value] || 0) + 1;
            });
          } else {
            newResponseStats[response.questionId][responseValue] = 
              (newResponseStats[response.questionId][responseValue] || 0) + 1;
          }
        });
        
        const finalAnalytics = {
          totalResponses: newResponses.length,
          responsesByQuestion: newResponseStats,
          completionRate: allUsers.length > 0 ? Math.round((completedUsers.length / allUsers.length) * 100) : 0,
          demographics: {
            byLocation: locationStats.countries,
            totalUsers: allUsers.length,
          },
          totalUsers: allUsers.length,
          completedUsers: completedUsers.length,
          locationStats,
          users: allUsers.map(user => ({
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            location: user.location,
            firstLoginCompleted: user.firstLoginCompleted,
            customFormResponses: user.onboardingResponses,
          })),
          formConfig,
        };
        
        console.log("Final analytics after migration:", finalAnalytics);
        return res.json(finalAnalytics);
      }
    }
    
    const finalAnalytics = {
      totalResponses: responses.length,
      responsesByQuestion: responseStats,
      completionRate: allUsers.length > 0 ? Math.round((completedUsers.length / allUsers.length) * 100) : 0,
      demographics: {
        byLocation: locationStats.countries,
        totalUsers: allUsers.length,
      },
      totalUsers: allUsers.length,
      completedUsers: completedUsers.length,
      locationStats,
      users: allUsers.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        location: user.location,
        firstLoginCompleted: user.firstLoginCompleted,
        customFormResponses: user.onboardingResponses,
      })),
      formConfig,
    };
    
    console.log("Final analytics:", finalAnalytics);
    
    res.json(finalAnalytics);
  } catch (error) {
    console.error("Error fetching onboarding analytics:", error);
    res.status(500).json({ error: "Failed to fetch onboarding analytics" });
  }
};

// Check if user needs onboarding
export const checkOnboardingStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Handle authentication in case middleware failed to set user
    if (!req.user && req.session && (req.session as any).userId) {
      const userId = (req.session as any).userId;
      if (userId === "temp-admin-001") {
        req.user = {
          id: "temp-admin-001",
          email: "admin@example.com",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
        };
      }
    }
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin users should skip onboarding
    if (req.user.role === "admin") {
      return res.json({ needsOnboarding: false });
    }

    if (!isDatabaseAvailable()) {
      // In mock mode, non-admin users need onboarding
      const isNewUser = !req.user.firstName || req.user.email === "temp-admin-001@example.com";
      return res.json({ needsOnboarding: isNewUser });
    }

    const db = getDb();
    const user = await db
      .select({ firstLoginCompleted: users.firstLoginCompleted })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ needsOnboarding: !user[0].firstLoginCompleted });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ error: "Failed to check onboarding status" });
  }
};