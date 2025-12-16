'use client';

import { useParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MapPin, Calendar, Heart, MessageSquare, Crown, Users, SwatchBook, CircleUser, Eye, KeyRound, Undo, Star } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-muted-foreground mt-1" />
        <div className="text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-semibold">{value || 'Belirtilmemiş'}</p>
        </div>
    </div>
);


const UserDetailSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="aspect-square rounded-lg" />
            </CardContent>
        </Card>
    </div>
)

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const firestore = useFirestore();
    const { locale } = useLanguage();

    const userDocRef = useMemoFirebase(() => {
        if (!userId) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);
    
    const matchesQuery = useMemoFirebase(() => {
        if(!userId) return null;
        return query(collection(firestore, 'matches'), where('users', 'array-contains', userId));
    }, [firestore, userId]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userDocRef);
    const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesQuery);

    const isLoading = isLoadingProfile || isLoadingMatches;
    
    if (isLoading) {
        return <UserDetailSkeleton />;
    }

    if (!userProfile) {
        return <p>Kullanıcı bulunamadı.</p>;
    }
    
    const getGenderText = (gender: string | undefined) => {
        if(gender === 'man') return 'Erkek';
        if(gender === 'woman') return 'Kadın';
        return 'Belirtilmemiş';
    }
    
    const getInterestText = (interest: string | undefined) => {
        if(interest === 'man') return 'Erkekler';
        if(interest === 'woman') return 'Kadınlar';
        if(interest === 'everyone') return 'Herkes';
        return 'Belirtilmemiş';
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/admin/users" passHref>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Profili: {userProfile.name}</h1>
                 {userProfile.premiumTier && <Crown className="w-6 h-6 text-yellow-500" />}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                             <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{userProfile.name}, {userProfile.age}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {userProfile.email}
                            </CardDescription>
                            {userProfile.premiumTier && (
                                <Badge className={
                                    userProfile.premiumTier === 'gold' ? 'bg-yellow-500 text-white' :
                                    userProfile.premiumTier === 'platinum' ? 'bg-gray-800 text-white' : ''
                                }>
                                    {userProfile.premiumTier.toUpperCase()}
                                    {userProfile.premiumExpiresAt && ` - Bitiş: ${format(userProfile.premiumExpiresAt.toDate(), 'dd/MM/yyyy')}`}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <DetailItem icon={CircleUser} label="Cinsiyet" value={getGenderText(userProfile.gender)} />
                             <DetailItem icon={Users} label="İlgilendiği" value={getInterestText(userProfile.interestedIn)} />
                            <DetailItem icon={MapPin} label="Konum" value={userProfile.location} />
                            <DetailItem icon={Eye} label="Son Görülme" value={userProfile.lastSeen ? formatDistanceToNow(userProfile.lastSeen.toDate(), { addSuffix: true, locale: locale === 'tr' ? tr : enUS }) : 'Bilinmiyor'} />
                            <DetailItem icon={Calendar} label="Kayıt Tarihi" value={userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'} />
                            <DetailItem icon={KeyRound} label="Son Şifre Değişikliği" value={userProfile.passwordLastUpdatedAt ? formatDistanceToNow(userProfile.passwordLastUpdatedAt.toDate(), { addSuffix: true, locale: locale === 'tr' ? tr : enUS }) : 'Hiç değiştirmedi'} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">İlgi Alanları</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {userProfile.interests?.map(interest => (
                                <Badge key={interest} variant="secondary">{interest}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Aktivite & Kullanım</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-muted rounded-md text-center">
                                <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xl font-bold">{matches?.length ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Toplam Eşleşme</p>
                            </div>
                             <div className="p-3 bg-muted rounded-md text-center">
                                <Undo className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xl font-bold">{userProfile.rewindCount ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Kullanılan Geri Alma (Bugün)</p>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-center">
                                <Star className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xl font-bold">{userProfile.superLikes ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Kalan Süper Beğeni</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hakkında</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{userProfile.bio}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Fotoğraf Galerisi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userProfile.imageUrls && userProfile.imageUrls.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {userProfile.imageUrls.map((url, index) => (
                                        <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                            <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Kullanıcının hiç fotoğrafı yok.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Profil Cevapları</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userProfile.prompts && userProfile.prompts.length > 0 ? userProfile.prompts.map((p, i) => (
                                <div key={i} className="p-3 bg-muted rounded-md">
                                    <p className="font-semibold text-sm">{p.question}</p>
                                    <p className="text-muted-foreground">{p.answer}</p>
                                </div>
                            )) : <p className="text-muted-foreground">Kullanıcının profil cevabı yok.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
