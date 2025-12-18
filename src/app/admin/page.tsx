'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
                Komuta Merkezine Hoş Geldiniz
            </h1>
            <p className="text-muted-foreground">
                Bu alan şu anda yapım aşamasındadır. Çok yakında yeni özelliklerle burada olacağız!
            </p>
        </div>
    </div>
  );
}
