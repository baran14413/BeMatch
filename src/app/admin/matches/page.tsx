'use client';
import { useEffect, useState } from 'react';
import { getAllMatches } from '@/actions/match-actions';
import type { Match } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useLanguage } from '@/context/language-context';
import { tr, enUS } from 'date-fns/locale';

const MatchesTableSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);


export default function MatchHistoryPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { locale } = useLanguage();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedMatches = await getAllMatches();
                setMatches(fetchedMatches);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Match History</CardTitle>
                <CardDescription>A complete log of all matches created in the application.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <MatchesTableSkeleton />
                ) : error ? (
                    <div className="text-center text-destructive py-8">
                        <p>Failed to load match history: {error}</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No matches found.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Match ID</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Last Activity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell className="font-mono text-xs">{match.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary" className="w-fit">{match.users[0]}</Badge>
                                            <Badge variant="secondary" className="w-fit">{match.users[1]}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(match.timestamp), 'PPP p', {
                                            locale: locale === 'tr' ? tr : enUS
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
