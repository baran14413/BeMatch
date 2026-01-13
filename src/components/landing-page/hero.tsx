import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Hero() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-background');

  return (
    <section className="relative flex h-[60vh] w-full items-center justify-center text-center text-white md:h-[80vh]">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter md:text-6xl lg:text-7xl">
          The Enterprise-Grade Cloud for Modern Business
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80 md:mt-6 md:text-xl">
          ApexCloud provides secure, scalable, and reliable cloud infrastructure to power your most critical applications, with transparent pricing and expert support.
        </p>
        <div className="mt-8 md:mt-10">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Request a Consultation
          </Button>
        </div>
      </div>
    </section>
  );
}
