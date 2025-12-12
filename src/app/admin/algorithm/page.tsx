'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AlgorithmSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Algoritma Ayarları</h1>
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Eşleştirme Ağırlıkları</CardTitle>
            <CardDescription>
              Eşleştirme algoritmasının hangi faktörlere ne kadar önem vereceğini ayarlayın.
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
