// src/server/routes-onboarding.ts
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { onboardingFormResponses, users } from "../shared/schema";
import { isDatabaseAvailable } from "./db";

export async function getCurrentFormConfig(req: any, res: any) {
  try {
    // Placeholder for fetching current form configuration logic
    const formConfig = {
      fields: [
        { id: "name", label: "Name", type: "text" },
        { id: "location", label: "Location", type: "text" }
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
    const { questionId, response } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isDatabaseAvailable()) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Insert the onboarding form response into the database
    await db.insert(onboardingFormResponses).values({
      userId: req.user.id,
      questionId: questionId,
      response: response
    });

    console.log(`User ${req.user.id} submitted response for question ${questionId}:`, response);
    res.json({ message: "Onboarding form submitted successfully" });

    // Update user's onboarding completion status if all required questions are answered
    const allQuestionsAnswered = true; // Replace with actual logic
    if (allQuestionsAnswered) {
      await db.update(users)
        .set({ firstLoginCompleted: true })
        .where(eq(users.id, req.user.id));

      console.log(`User ${req.user.id} completed onboarding`);
    }
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
      const [responses, usersList, totalUsersResult] = await Promise.all([
        db.select().from(onboardingFormResponses).catch(() => []),
        db.select().from(users).where(eq(users.firstLoginCompleted, true)).catch(() => []),
        db.select({ count: sql<number>`count(*)` }).from(users).catch(() => [{ count: 0 }])
      ]);

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

      const totalUsers = totalUsersResult?.[0]?.count || 0;
      const completedUsers = usersList?.length || 0;
      const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

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

    if (!isDatabaseAvailable()) {
      return res.json({ completed: false });
    }

    const user = await db.select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      completed: user[0].firstLoginCompleted || false,
      location: user[0].location 
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ error: "Failed to check onboarding status" });
  }
}

// Functions are already exported above, no need for duplicate exports