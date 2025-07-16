import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { onboardingFormConfig } from "./shared/schema.ts";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function createSampleOnboardingForm() {
  try {
    console.log("Creating sample onboarding form...");
    
    const formData = {
      id: nanoid(),
      version: 1,
      isActive: true,
      questions: [
        {
          id: "role",
          type: "radio",
          label: "What is your role in radio content?",
          options: ["Host/DJ", "Content Creator", "Producer", "Station Manager", "Volunteer", "Other"],
          compulsory: true
        },
        {
          id: "experience",
          type: "radio",
          label: "How much experience do you have with radio production?",
          options: ["Complete beginner", "Some experience (1-2 years)", "Intermediate (3-5 years)", "Advanced (5+ years)", "Expert (10+ years)"],
          compulsory: true
        },
        {
          id: "interests",
          type: "checkbox",
          label: "What types of radio content interest you? (Select all that apply)",
          options: ["Music Shows", "Talk Shows", "News", "Educational Content", "Community Programs", "Sports", "Cultural Programs", "Youth Programs"],
          compulsory: true
        },
        {
          id: "station_type",
          type: "radio",
          label: "What type of radio station are you involved with?",
          options: ["Community Radio", "Commercial Radio", "Educational Radio", "Online Radio", "Podcast Platform", "Not affiliated with any station"],
          compulsory: false
        },
        {
          id: "goals",
          type: "checkbox",
          label: "What are your main goals with this platform? (Select all that apply)",
          options: ["Learn radio production", "Share content", "Collaborate with others", "Access educational resources", "Build a portfolio", "Network with professionals"],
          compulsory: true
        },
        {
          id: "feedback",
          type: "text",
          label: "What features would you like to see on this platform?",
          compulsory: false
        }
      ],
      createdBy: "rjen7tw3u_HPnmJ2CiJ38", // Current admin user
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.insert(onboardingFormConfig).values(formData).returning();
    
    console.log("✅ Sample onboarding form created successfully!");
    console.log("Form ID:", result[0].id);
    console.log("Number of questions:", result[0].questions.length);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating sample onboarding form:", error);
    process.exit(1);
  }
}

createSampleOnboardingForm();