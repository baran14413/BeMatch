'use client';
import ReportsTable from '@/components/admin/reports-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Report } from '@/lib/data';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const ReportsTableSkeleton = () => (
     <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
                 <Skeleton className="h-8 w-20 rounded-full" />
            </div>
        ))}
    </div>
)

export default function AdminSafetyPage() {
  const firestore = useFirestore();
  
  const reportsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'reports'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: reports, isLoading } = useCollection<Report>(reportsQuery);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Güvenlik Raporları</h1>
       {isLoading ? <ReportsTableSkeleton /> : <ReportsTable reports={reports || []} />}
    </div>
  );
}
