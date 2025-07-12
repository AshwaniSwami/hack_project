// Enhanced color system for consistent theming across the application
export const colors = {
  // Primary brand colors
  primary: {
    sky: 'sky-500',
    rose: 'rose-500',
    blue: 'blue-600',
    red: 'red-500',
  },
  
  // Background gradients
  gradients: {
    main: 'bg-gradient-to-br from-sky-50 via-blue-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    header: 'bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-rose-500/10 dark:from-sky-500/5 dark:via-blue-500/5 dark:to-rose-500/5',
    text: 'bg-gradient-to-r from-sky-500 to-red-500 bg-clip-text text-transparent',
    button: 'bg-gradient-to-r from-sky-500 to-rose-500',
    card: 'bg-gradient-to-r from-sky-400 to-rose-400',
    dashboard: 'bg-gradient-to-br from-sky-100 to-rose-100',
  },
  
  // Card styles
  card: {
    primary: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg',
    secondary: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-xl',
    accent: 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-sky-200/30 dark:border-gray-700/50',
  },
  
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    accent: 'text-sky-600 dark:text-sky-400',
  },
  
  // Input and form styles
  input: {
    primary: 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100',
    icon: 'text-gray-400 dark:text-gray-500',
  },
  
  // Button styles
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-105 border-0',
    secondary: 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg',
    accent: 'bg-gradient-to-r from-sky-500 to-rose-500 hover:from-sky-600 hover:to-rose-600 text-white',
  },
  
  // Tab styles
  tab: {
    list: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50',
    trigger: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300',
  },
  
  // Status colors for scripts
  status: {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    review: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600',
    approved: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-600',
    published: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-600',
  },
  
  // Borders
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-200/50 dark:border-gray-700/50',
    accent: 'border-sky-200/30 dark:border-gray-700/50',
  },
} as const;

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return colors.status.draft;
    case 'Under Review':
      return colors.status.review;
    case 'Approved':
      return colors.status.approved;
    case 'Published':
      return colors.status.published;
    default:
      return colors.status.draft;
  }
};

// Helper function to get consistent card styling
export const getCardStyle = (variant: 'primary' | 'secondary' | 'accent' = 'primary'): string => {
  return colors.card[variant];
};

// Helper function to get consistent gradient backgrounds
export const getGradientStyle = (variant: keyof typeof colors.gradients): string => {
  return colors.gradients[variant];
};