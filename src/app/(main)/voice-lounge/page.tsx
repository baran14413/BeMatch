'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/language-context';
import { Users, Plus, Headphones } from 'lucide-react';
import Image from 'next/image';

// Mock data for the voice chat rooms
const mockRooms = [
  {
    id: '1',
    title: 'Gecenin Geyikleri',
    imageUrl: 'https://picsum.photos/seed/room1/600/400',
    participants: [
      { id: 'u1', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
      { id: 'u2', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e' },
      { id: 'u3', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' },
      { id: 'u4', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' },
    ],
    maxParticipants: 7,
  },
  {
    id: '2',
    title: 'Müzik ve Sohbet',
    imageUrl: 'https://picsum.photos/seed/room2/600/400',
    participants: [
      { id: 'u5', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704b' },
      { id: 'u6', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704c' },
    ],
    maxParticipants: 7,
  },
  {
    id: '3',
    title: 'Hafta Sonu Planları',
    imageUrl: 'https://picsum.photos/seed/room3/600/400',
    participants: [
      { id: 'u7', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
      { id: 'u8', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705e' },
      { id: 'u9', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705f' },
      { id: 'u10', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a' },
      { id: 'u11', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705b' },
      { id: 'u12', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705c' },
      { id: 'u13', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
    ],
    maxParticipants: 7,
  },
   {
    id: '4',
    title: 'Film Gecesi Kritikleri',
    imageUrl: 'https://picsum.photos/seed/room4/600/400',
    participants: [
      { id: 'u14', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706a' },
      { id: 'u15', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706b' },
      { id: 'u16', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706c' },
    ],
    maxParticipants: 7,
  },
];

export default function VoiceLoungePage() {
  const { t } = useLanguage();

  return (
    <ScrollArea className="h-full">
      <div className="h-full bg-gray-50 dark:bg-black">
        <header className="p-4 md:p-8 pt-[calc(env(safe-area-inset-top,0rem)+1rem)]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-primary">LoveSound</h1>
                    <p className="text-muted-foreground">Sesli sohbet odalarında yeni insanlarla tanış.</p>
                 </div>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Oda Oluştur
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden flex flex-col bg-card">
                <CardHeader 
                  className="p-0 relative h-32 flex flex-col justify-end"
                  style={{
                      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url(${room.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                  }}
                >
                  <div className="p-4">
                     <CardTitle className="text-white text-xl">{room.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <div className="flex -space-x-2 overflow-hidden mb-4">
                    {room.participants.slice(0, 8).map((p) => (
                      <Avatar key={p.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-card">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.id}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                   <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {room.participants.length} / {room.maxParticipants} Katılımcı
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" disabled={room.participants.length >= room.maxParticipants}>
                    {room.participants.length >= room.maxParticipants ? 'Oda Dolu' : 'Odaya Katıl'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ScrollArea>
  );
}
