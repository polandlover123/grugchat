import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { GrugIcon } from '@/components/icons/custom-icon';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <GrugIcon className="h-7 w-7" />
        <h1 className="text-xl font-bold">Grug Chat</h1>
      </Link>
      <div className="flex items-center gap-4">
        <nav>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contact Us
          </Link>
        </nav>
        <Badge variant="outline">Beta 1.0.0</Badge>
      </div>
    </header>
  );
}
