import { Cloud } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex items-center justify-between py-8">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ApexCloud. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
