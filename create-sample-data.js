import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { 
  themes, 
  projects, 
  episodes, 
  scripts, 
  onboardingFormConfig, 
  onboardingFormResponses 
} from "./shared/schema.js";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function createSampleData() {
  try {
    console.log("Creating sample data for SMART Radio Content Hub...");
    
    // Create themes
    const themeData = [
      { id: nanoid(), name: "News & Current Affairs", description: "News programs and current events", colorHex: "#dc2626" },
      { id: nanoid(), name: "Music & Entertainment", description: "Music shows and entertainment content", colorHex: "#059669" },
      { id: nanoid(), name: "Educational", description: "Educational and learning content", colorHex: "#2563eb" },
      { id: nanoid(), name: "Community", description: "Community focused programs", colorHex: "#7c3aed" },
      { id: nanoid(), name: "Sports", description: "Sports commentary and analysis", colorHex: "#ea580c" }
    ];
    
    await db.insert(themes).values(themeData);
    console.log("✅ Created sample themes");
    
    // Create projects
    const projectData = [
      { 
        id: nanoid(), 
        name: "Morning News Update", 
        description: "Daily morning news and current affairs program",
        themeId: themeData[0].id,
        projectType: "main"
      },
      { 
        id: nanoid(), 
        name: "Community Voices", 
        description: "Weekly community discussion program",
        themeId: themeData[3].id,
        projectType: "main"
      },
      { 
        id: nanoid(), 
        name: "Educational Hour", 
        description: "Educational content for all ages",
        themeId: themeData[2].id,
        projectType: "main"
      }
    ];
    
    await db.insert(projects).values(projectData);
    console.log("✅ Created sample projects");
    
    // Create episodes
    const episodeData = [
      {
        id: nanoid(),
        projectId: projectData[0].id,
        title: "Local Elections Coverage",
        episodeNumber: 1,
        description: "Complete coverage of local election results",
        broadcastDate: new Date("2025-01-15"),
        isPremium: false
      },
      {
        id: nanoid(),
        projectId: projectData[1].id,
        title: "Youth in Our Community",
        episodeNumber: 1,
        description: "Discussion about youth programs and initiatives",
        broadcastDate: new Date("2025-01-20"),
        isPremium: false
      }
    ];
    
    await db.insert(episodes).values(episodeData);
    console.log("✅ Created sample episodes");
    
    // Create scripts
    const scriptData = [
      {
        id: nanoid(),
        projectId: projectData[0].id,
        authorId: "rjen7tw3u_HPnmJ2CiJ38", // Current admin user
        title: "Election Results Analysis",
        content: "<h2>Election Results Analysis Script</h2><p>Good morning, listeners. Today we're covering the results of yesterday's local elections...</p>",
        status: "Published"
      },
      {
        id: nanoid(),
        projectId: projectData[1].id,
        authorId: "rjen7tw3u_HPnmJ2CiJ38",
        title: "Youth Programs Interview",
        content: "<h2>Youth Programs Interview Script</h2><p>Welcome to Community Voices. Today we're speaking with local youth program coordinators...</p>",
        status: "Draft"
      }
    ];
    
    await db.insert(scripts).values(scriptData);
    console.log("✅ Created sample scripts");
    
    // Create onboarding form configuration
    const formConfig = {
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
      createdBy: "rjen7tw3u_HPnmJ2CiJ38",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(onboardingFormConfig).values(formConfig);
    console.log("✅ Created onboarding form configuration");
    
    // Create sample onboarding responses
    const responseData = [
      {
        id: nanoid(),
        userId: "rjen7tw3u_HPnmJ2CiJ38",
        formVersion: 1,
        responses: {
          role: "Content Creator",
          experience: "Advanced (5+ years)",
          interests: ["Talk Shows", "Educational Content", "Community Programs"],
          station_type: "Community Radio",
          goals: ["Share content", "Collaborate with others", "Network with professionals"],
          feedback: "Would love to see more collaboration tools and content sharing features"
        },
        location: {
          country: "India",
          city: "Mumbai",
          latitude: 19.0760,
          longitude: 72.8777
        },
        submittedAt: new Date()
      }
    ];
    
    await db.insert(onboardingFormResponses).values(responseData);
    console.log("✅ Created sample onboarding responses");
    
    console.log("\n🎉 Sample data creation completed successfully!");
    console.log("📊 Created:");
    console.log("   - 5 themes");
    console.log("   - 3 projects");
    console.log("   - 2 episodes");
    console.log("   - 2 scripts");
    console.log("   - 1 onboarding form with 6 questions");
    console.log("   - 1 sample response");
    
    console.log("\n🚀 Your SMART Radio Content Hub is now ready for deployment!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
    process.exit(1);
  }
}

createSampleData();