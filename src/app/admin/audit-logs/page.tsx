'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuditLogsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Denetim Kayıtları</h1>
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Yönetici Aktiviteleri</CardTitle>
            <CardDescription>
              Yöneticilerin ve moderatörlerin yaptığı tüm işlemleri buradan takip edebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Bu özellik yakında eklenecektir.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
