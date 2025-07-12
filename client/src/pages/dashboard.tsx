import { AdminDashboard } from "@/components/dashboard-admin";
import { EditorDashboard } from "@/components/dashboard-editor";
import { ContributorDashboard } from "@/components/dashboard-contributor";
import { MemberDashboard } from "@/components/dashboard-member";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  // Show loading if user data is not available yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'editor':
        return <EditorDashboard />;
      case 'contributor':
        return <ContributorDashboard />;
      case 'member':
      default:
        return <MemberDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 relative">
      <div className="floating-bg"></div>
      <div className="max-w-7xl mx-auto relative">
        {renderDashboard()}
      </div>
    </div>
  );
}