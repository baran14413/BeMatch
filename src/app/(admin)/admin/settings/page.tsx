import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MaintenanceModeToggle from '@/components/admin/maintenance-mode-toggle';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sistem Ayarları</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bakım Modu</CardTitle>
          <CardDescription>
            Uygulamada genel bir bakım yaparken kullanıcıların erişimini geçici olarak kısıtlamak için bakım modunu etkinleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceModeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
