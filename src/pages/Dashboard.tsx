
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DocumentsPage } from '@/components/dashboard/DocumentsPage';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <DocumentsPage />
    </DashboardLayout>
  );
};

export default Dashboard;
