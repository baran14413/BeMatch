'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const initialInterests = [
  'Müzik', 'Seyahat', 'Oyun', 'Filmler', 'Okuma', 'Yemek Yapma', 'Spor'
];

export default function AppSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Uygulama Ayarları</h1>
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Bakım Modu</CardTitle>
            <CardDescription>
              Kullanıcılar için ana uygulamaya erişimi geçici olarak devre dışı bırakın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch id="maintenance-mode" />
              <Label htmlFor="maintenance-mode">Bakım Modunu Etkinleştir</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Anlık Bildirim</CardTitle>
            <CardDescription>
              Tüm aktif kullanıcılara bir duyuru gönderin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Başlık</Label>
              <Input id="notification-title" placeholder="Örn: Yeni Özellik Uyarısı!" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message">Mesaj</Label>
              <Input id="notification-message" placeholder="Duyuruyu açıklayın..." />
            </div>
            <Button>Bildirim Gönder</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İlgi Alanlarını Yönet</CardTitle>
            <CardDescription>
              Kullanıcılar için mevcut ilgi alanı etiketlerini ekleyin veya kaldırın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {initialInterests.map(interest => (
                <Badge key={interest} variant="secondary" className="text-base py-1 pl-3 pr-1">
                  {interest}
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input placeholder="Yeni ilgi alanı ekle" />
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
