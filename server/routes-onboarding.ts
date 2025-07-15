// src/server/routes-onboarding.ts
import { eq, sql } from "drizzle-orm";
import { isDatabaseAvailable } from "./db";
import { storage } from "./storage";
import { onboardingFormResponses, users } from "../shared/schema";

export async function getCurrentFormConfig(req: any, res: any) {
  try {
    // Enhanced form configuration with proper structure for the onboarding wizard
    const formConfig = {
      questions: [
        { 
          id: "name", 
          label: "What's your name?", 
          type: "text",
          required: true,
          placeholder: "Enter your full name"
        },
        { 
          id: "experience", 
          label: "What's your experience level with radio content?", 
          type: "select",
          required: true,
          options: [
            { value: "beginner", label: "Beginner - New to radio content" },
            { value: "intermediate", label: "Intermediate - Some experience" },
            { value: "advanced", label: "Advanced - Experienced professional" },
            { value: "expert", label: "Expert - Industry veteran" }
          ]
        },
        { 
          id: "role", 
          label: "What's your primary role?", 
          type: "select",
          required: true,
          options: [
            { value: "host", label: "Radio Host" },
            { value: "producer", label: "Producer" },
            { value: "editor", label: "Content Editor" },
            { value: "manager", label: "Station Manager" },
            { value: "volunteer", label: "Volunteer" },
            { value: "other", label: "Other" }
          ]
        }
      ]
    };
    res.json(formConfig);
  } catch (error) {
    console.error("Error getting current form config:", error);
    res.status(500).json({ error: "Failed to get form config" });
  }
}

export async function updateFormConfig(req: any, res: any) {
  try {
    const newConfig = req.body;
    // Placeholder for updating form configuration logic in the database
    console.log("Updating form config with:", newConfig);
    res.json({ message: "Form config updated successfully" });
  } catch (error) {
    console.error("Error updating form config:", error);
    res.status(500).json({ error: "Failed to update form config" });
  }
}

export async function submitOnboardingForm(req: any, res: any) {
  try {
    const formData = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract common fields and form responses
    const { name, experience, role, location } = formData;

    // Update user with onboarding information
    await storage.updateUser(req.user.id, {
      firstName: name,
      location: location ? (typeof location === 'string' ? { country: location } : location) : null,
      firstLoginCompleted: true,
      onboardingResponses: formData
    });

    console.log(`User ${req.user.id} completed onboarding:`, formData);
    res.json({ message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Error submitting onboarding form:", error);
    res.status(500).json({ error: "Failed to submit onboarding form" });
  }
}

export async function getOnboardingAnalytics(req: any, res: any) {
  try {
    console.log("Getting onboarding analytics...");

    if (!isDatabaseAvailable()) {
      return res.json({
        totalResponses: 0,
        responsesByQuestion: {},
        completionRate: 0,
        demographics: {
          byLocation: {},
          totalUsers: 0
        }
      });
    }

    try {
      // Get completed users from storage
      const allUsers = await storage.getAllUsers();
      const usersList = allUsers.filter(user => user.firstLoginCompleted);
      const responses: any[] = []; // Placeholder for form responses

      console.log("Raw responses:", responses);
      console.log("Completed users:", usersList);

      // Group responses by question
      const responsesByQuestion: Record<string, any[]> = {};
      (responses || []).forEach(response => {
        if (!responsesByQuestion[response.questionId]) {
          responsesByQuestion[response.questionId] = [];
        }
        responsesByQuestion[response.questionId].push(response);
      });

      // Calculate demographics from user data
      const demographics = {
        byLocation: {} as Record<string, number>,
        totalUsers: usersList?.length || 0
      };

      (usersList || []).forEach(user => {
        if (user.location) {
          demographics.byLocation[user.location] = (demographics.byLocation[user.location] || 0) + 1;
        }
      });

      const completedUsers = usersList?.length || 0;
      const completionRate = allUsers.length > 0 ? (completedUsers / allUsers.length) * 100 : 0;

      const analytics = {
        totalResponses: responses?.length || 0,
        responsesByQuestion,
        completionRate,
        demographics
      };

      console.log("Final analytics:", analytics);
      res.json(analytics);
    } catch (dbError) {
      console.error("Database error in analytics:", dbError);
      // Return empty analytics if database tables don't exist yet
      res.json({
        totalResponses: 0,
        responsesByQuestion: {},
        completionRate: 0,
        demographics: {
          byLocation: {},
          totalUsers: 0
        }
      });
    }
  } catch (error) {
    console.error("Error getting onboarding analytics:", error);
    res.status(500).json({ error: "Failed to get onboarding analytics" });
  }
}

export async function checkOnboardingStatus(req: any, res: any) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user information from storage
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user needs onboarding (first login not completed)
    const needsOnboarding = !user.firstLoginCompleted;

    res.json({ 
      needsOnboarding,
      completed: user.firstLoginCompleted || false,
      location: user.location 
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ error: "Failed to check onboarding status" });
  }
}

// Functions are already exported above, no need for duplicate exports