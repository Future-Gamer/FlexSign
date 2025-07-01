
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DocumentsPage } from '@/components/dashboard/DocumentsPage';
import { PDFTools } from '@/components/dashboard/PDFTools';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DocumentsPage />
        <PDFTools />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
