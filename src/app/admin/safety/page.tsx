'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, User } from 'lucide-react';
import Image from 'next/image';

const reportedContent = [
  { id: 1, type: 'Fotoğraf', user: 'kullanici_a', reason: 'Uygunsuz İçerik', contentUrl: 'https://picsum.photos/seed/report1/300/400' },
  { id: 2, type: 'Profil', user: 'kullanici_b', reason: 'Sahte Profil', contentUrl: 'https://i.pravatar.cc/150?u=user_b' },
  { id: 3, type: 'Fotoğraf', user: 'kullanici_c', reason: 'Spam', contentUrl: 'https://picsum.photos/seed/report2/300/400' },
];

export default function SafetyCenterPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Güvenlik & Denetim Merkezi</h1>
      <div className="grid gap-6">
        {reportedContent.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{item.user} için {item.type} Raporu</span>
                <span className="text-sm font-medium text-muted-foreground">{item.reason}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center">
                {item.type === 'Fotoğraf' ? (
                  <Image src={item.contentUrl} width={128} height={128} alt="Raporlanan içerik" className="rounded-lg object-cover w-full h-full" />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">İçeriği inceleyin ve uygun işlemi yapın.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline"><Check className="mr-2 h-4 w-4" /> Onayla</Button>
                <Button variant="destructive"><X className="mr-2 h-4 w-4" /> Kullanıcıyı Askıya Al</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
