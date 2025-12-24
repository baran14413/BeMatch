import ReportsTable from '@/components/admin/reports-table';
// import { getAllReports } from '@/actions/report-actions';

export default async function AdminSafetyPage() {
  // const reports = await getAllReports();
  const reports: any[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Güvenlik Raporları</h1>
      <ReportsTable reports={reports} />
    </div>
  );
}
