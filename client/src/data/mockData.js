// Mock data for onboarding form builder demonstration

export const mockUsers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    location: {
      country: "USA",
      city: "New York",
      latitude: 40.7128,
      longitude: -74.0060
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "research",
      "interests": ["technology", "education"],
      "experience": "intermediate",
      "organization": "University"
    }
  },
  {
    id: "user2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    location: {
      country: "India",
      city: "Mumbai",
      latitude: 19.0760,
      longitude: 72.8777
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "learning",
      "interests": ["healthcare", "research"],
      "experience": "beginner",
      "organization": "NGO"
    }
  },
  {
    id: "user3",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    location: {
      country: "Brazil",
      city: "São Paulo",
      latitude: -23.5558,
      longitude: -46.6396
    },
    firstLoginCompleted: false,
    customFormResponses: {}
  },
  {
    id: "user4",
    name: "David Ochieng",
    email: "david.ochieng@example.com",
    location: {
      country: "Kenya",
      city: "Nairobi",
      latitude: -1.2921,
      longitude: 36.8219
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "teaching",
      "interests": ["education", "technology"],
      "experience": "advanced",
      "organization": "School"
    }
  },
  {
    id: "user5",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    location: {
      country: "Canada",
      city: "Toronto",
      latitude: 43.6532,
      longitude: -79.3832
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "research",
      "interests": ["science", "education"],
      "experience": "intermediate",
      "organization": "Research Institute"
    }
  },
  {
    id: "user6",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    location: {
      country: "Egypt",
      city: "Cairo",
      latitude: 30.0444,
      longitude: 31.2357
    },
    firstLoginCompleted: false,
    customFormResponses: {}
  },
  {
    id: "user7",
    name: "Lisa Chen",
    email: "lisa.chen@example.com",
    location: {
      country: "Singapore",
      city: "Singapore",
      latitude: 1.3521,
      longitude: 103.8198
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "learning",
      "interests": ["technology", "business"],
      "experience": "advanced",
      "organization": "Company"
    }
  },
  {
    id: "user8",
    name: "James Wilson",
    email: "james.wilson@example.com",
    location: {
      country: "Australia",
      city: "Sydney",
      latitude: -33.8688,
      longitude: 151.2093
    },
    firstLoginCompleted: true,
    customFormResponses: {
      "purpose": "teaching",
      "interests": ["education", "arts"],
      "experience": "intermediate",
      "organization": "University"
    }
  }
];

export const mockFormConfig = {
  questions: [
    {
      id: "purpose",
      type: "radio",
      label: "What brings you to our platform?",
      options: ["Research", "Learning", "Teaching", "Professional Development"],
      compulsory: true
    },
    {
      id: "interests",
      type: "checkbox",
      label: "What are your areas of interest? (Select all that apply)",
      options: ["Technology", "Healthcare", "Education", "Science", "Arts", "Business", "Environment"],
      compulsory: false
    },
    {
      id: "experience",
      type: "radio",
      label: "How would you describe your experience level?",
      options: ["Beginner", "Intermediate", "Advanced", "Expert"],
      compulsory: true
    },
    {
      id: "organization",
      type: "radio",
      label: "What type of organization are you affiliated with?",
      options: ["University", "School", "NGO", "Company", "Government", "Independent", "Other"],
      compulsory: false
    }
  ]
};

// Helper function to get user statistics by location
export const getUserStatsByLocation = () => {
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

// Helper function to get response statistics
export const getResponseStatistics = () => {
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