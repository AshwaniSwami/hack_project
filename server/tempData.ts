// Temporary demo data for when database is not available
export const tempProjects = [
  {
    id: "demo-project-1",
    name: "Morning Radio Show",
    description: "Daily morning show content and scripts",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "demo-project-2", 
    name: "Evening News Segment",
    description: "Evening news updates and analysis",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "demo-project-3",
    name: "Weekend Special Features",
    description: "Special weekend programming content",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-18"),
  }
];

export const tempEpisodes = [
  {
    id: "demo-episode-1",
    projectId: "demo-project-1",
    title: "Morning Show - January 15th",
    episodeNumber: 15,
    description: "Weather updates, traffic reports, and local news",
    broadcastDate: new Date("2024-01-15"),
    isPremium: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "demo-episode-2",
    projectId: "demo-project-1", 
    title: "Morning Show - January 16th",
    episodeNumber: 16,
    description: "Community events and guest interviews",
    broadcastDate: new Date("2024-01-16"),
    isPremium: false,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "demo-episode-3",
    projectId: "demo-project-2",
    title: "Evening News - Week 3",
    episodeNumber: 3,
    description: "Weekly news roundup and analysis",
    broadcastDate: new Date("2024-01-20"),
    isPremium: true,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  }
];

export const tempScripts = [
  {
    id: "demo-script-1",
    projectId: "demo-project-1",
    episodeId: "demo-episode-1",
    title: "Morning Weather Report",
    content: "<p>Good morning! Today's weather forecast shows sunny skies with temperatures reaching 75°F. Perfect weather for outdoor activities!</p>",
    status: "published",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "demo-script-2", 
    projectId: "demo-project-1",
    episodeId: "demo-episode-1",
    title: "Traffic Update Script",
    content: "<p>Current traffic conditions: Main Street is flowing smoothly, but expect delays on Highway 101 due to construction work.</p>",
    status: "draft",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "demo-script-3",
    projectId: "demo-project-2",
    episodeId: "demo-episode-3",
    title: "News Analysis Script",
    content: "<p>This week's major developments include local government decisions and community initiatives that will impact residents.</p>",
    status: "review",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  }
];

export const tempRadioStations = [
  {
    id: "demo-station-1",
    name: "KDEM 101.5 FM",
    frequency: "101.5 FM",
    contactEmail: "contact@kdem.com",
    contactPhone: "(555) 123-4567",
    location: "Demo City, CA",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "demo-station-2",
    name: "Demo Radio Network",
    frequency: "95.3 FM", 
    contactEmail: "info@demoradio.com",
    contactPhone: "(555) 987-6543",
    location: "Demo Valley, CA",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }
];

export const tempUsers = [
  {
    id: "temp-admin-001",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isActive: true,
    loginCount: 5,
    lastLoginAt: new Date(),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "demo-user-1",
    email: "editor@example.com",
    firstName: "Demo",
    lastName: "Editor",
    role: "editor",
    isActive: true,
    loginCount: 12,
    lastLoginAt: new Date("2024-01-19"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-19"),
  },
  {
    id: "demo-user-2",
    email: "member@example.com",
    firstName: "Demo",
    lastName: "Member", 
    role: "member",
    isActive: true,
    loginCount: 3,
    lastLoginAt: new Date("2024-01-18"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
  }
];

export const tempFiles = [
  {
    id: "demo-file-1",
    entityType: "project",
    entityId: "demo-project-1",
    filename: "morning_show_intro.mp3",
    originalName: "morning_show_intro.mp3",
    mimetype: "audio/mpeg",
    size: 2048576,
    data: "", // Empty for demo
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "demo-file-2",
    entityType: "episode", 
    entityId: "demo-episode-1",
    filename: "episode_15_notes.pdf",
    originalName: "episode_15_notes.pdf",
    mimetype: "application/pdf",
    size: 1024000,
    data: "", // Empty for demo
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  }
];