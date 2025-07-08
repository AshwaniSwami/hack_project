import { useState } from 'react';
import { Plus, FileText, Radio, Clapperboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickCreateModals } from '@/components/quick-create-modals';

export function FloatingActionButton() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);

  // Only show for admin and editor roles
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  const actions = [
    {
      label: 'New Project',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        setIsProjectModalOpen(true);
        setIsExpanded(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: 'New Episode',
      icon: <Radio className="h-4 w-4" />,
      onClick: () => {
        setIsEpisodeModalOpen(true);
        setIsExpanded(false);
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: 'New Script',
      icon: <Clapperboard className="h-4 w-4" />,
      onClick: () => {
        setIsScriptModalOpen(true);
        setIsExpanded(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick();
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end space-y-reverse space-y-3">
        {/* Action buttons */}
        <AnimatePresence>
          {isExpanded && actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                onClick={() => handleActionClick(action)}
                className={`${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-200 group relative`}
                size="default"
              >
                {action.icon}
                <span className="ml-2 hidden sm:inline">{action.label}</span>
                
                {/* Tooltip for mobile */}
                <span className="sm:hidden absolute right-full mr-3 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-14 h-14 p-0"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-6 w-6" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Quick Create Modals */}
      <QuickCreateModals
        isProjectOpen={isProjectModalOpen}
        isEpisodeOpen={isEpisodeModalOpen}
        isScriptOpen={isScriptModalOpen}
        onProjectClose={() => setIsProjectModalOpen(false)}
        onEpisodeClose={() => setIsEpisodeModalOpen(false)}
        onScriptClose={() => setIsScriptModalOpen(false)}
      />
    </>
  );
}