'use client';

import Link from 'next/link';
import { Home, Users, Shield, Settings, Heart, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const navLinks = [
  { href: '/admin', label: 'Gösterge Paneli', icon: Home },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/safety', label: 'Güvenlik Raporları', icon: Shield },
  { href: '/admin/mock-profiles', label: 'Sahte Profiller', icon: Bot },
  { href: '/admin/settings', label: 'Sistem Ayarları', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
     <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <div className='w-8 h-8 bg-white rounded-md flex items-center justify-center text-primary font-bold text-lg'>B</div>
            <span className="text-xl">BeMatch Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
             <h3 className="px-3 py-2 text-primary-foreground/70 text-xs font-semibold uppercase">Yönetim</h3>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/80 transition-all hover:text-primary-foreground hover:bg-white/10',
                    isActive && 'bg-white/10 text-primary-foreground font-bold'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card className="bg-white/10 border-white/20 text-primary-foreground">
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle>BeMatch GOLD</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Uygulama deneyiminizi bir üst seviyeye taşıyın.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" className="w-full bg-yellow-400 text-black hover:bg-yellow-500">
                Yükselt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
