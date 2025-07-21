import Header from '@/components/app/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-headline">Contact Grug</CardTitle>
            <CardDescription>Find us on big internet rock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <a href="https://www.instagram.com/cavemansoftware/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2" />
                Instagram
              </a>
            </Button>
            <Button asChild className="w-full" size="lg" variant="secondary">
              <a href="https://www.cavemansoftware.org" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2" />
                cavemansoftware.org
              </a>
            </Button>
            <Button asChild className="w-full" size="lg" variant="outline">
              <Link href="/">
                <HomeIcon className="mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
