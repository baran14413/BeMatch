
'use client';
import { mockProfiles } from '@/lib/mock-profiles';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export default function MockProfilesPage() {
  const router = useRouter();

  const handleViewMessages = (profileId: string) => {
    // We can't actually log in as a mock user.
    // Instead, we can navigate to a view that shows their perspective.
    // For now, let's just go to their lounge/chat list.
    // This assumes we have a way to view a specific user's lounge.
    // A simple implementation could be a query param.
    router.push(`/lounge?asUser=${profileId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sahte Profiller Yönetimi</h1>
        <p className="text-muted-foreground">
          Uygulamadaki sahte (bot) profilleri buradan görüntüleyin. Bu profiller, yeni kullanıcılara etkileşim sağlamak için kullanılır.
        </p>
      </div>

      {mockProfiles.length === 0 ? (
        <p className="text-center text-muted-foreground">
          `src/lib/mock-profiles.ts` dosyasında tanımlı sahte profil bulunamadı.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockProfiles.map((profile) => (
            <Card key={profile.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile.name}, {profile.age}</CardTitle>
                  <CardDescription>{profile.location}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground italic line-clamp-3">"{profile.bio}"</p>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" variant="outline" onClick={() => handleViewMessages(profile.id)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mesajları Görüntüle
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
