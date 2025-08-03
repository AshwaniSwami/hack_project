import { AdminDashboard } from "@/components/dashboard-admin";
import { EditorDashboard } from "@/components/dashboard-editor";
import { ContributorDashboard } from "@/components/dashboard-contributor";
import { MemberDashboard } from "@/components/dashboard-member";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  // For NGO content platform, show public dashboard for non-authenticated users
  // and role-specific dashboards for authenticated users
  const renderDashboard = () => {
    if (!user) {
      // Public NGO content dashboard for visitors
      return <MemberDashboard />;
    }

    // Role-specific dashboards for authenticated users
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 relative">
      <div className="floating-bg"></div>
      <div className="max-w-7xl mx-auto relative">
        {renderDashboard()}
      </div>
    </div>
  );
}