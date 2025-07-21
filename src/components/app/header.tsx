import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GrugIcon } from '@/components/icons/custom-icon';
import { Badge } from '@/components/ui/badge';
import { Contact } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2">
        <GrugIcon className="h-7 w-7" />
        <h1 className="text-xl font-bold">Grug</h1>
      </Link>
      <div className="flex items-center gap-4">
        <Badge variant="outline">Beta 1.0.0</Badge>
        <nav>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Contact Us
          </Link>
        </nav>
      </div>
    </header>
  );
}
