import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <a href="#" className="flex items-center">
            <Cloud className="mr-2 h-6 w-6 text-primary" />
            <span className="font-headline font-bold">ApexCloud</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button>Request a Consultation</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
