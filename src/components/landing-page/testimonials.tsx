'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getPersonalizedTestimonial } from '@/app/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const testimonialData = [
  {
    baseTestimonial:
      "ApexCloud's infrastructure has been a game-changer for our platform. The uptime is fantastic, and their support team is always responsive. We've scaled our services seamlessly without any hiccups.",
    customerPersona:
      'A CTO of a fast-growing SaaS startup that requires reliable infrastructure and scalable resources to support a rapidly expanding user base.',
    author: 'Jane Doe',
    title: 'CTO, QuantumLeap Inc.',
    logoId: 'logo-quantum',
    avatarId: 'avatar-1',
  },
  {
    baseTestimonial:
      'Migrating our enterprise applications to ApexCloud was surprisingly smooth. The performance gains were immediate, and their managed database services have freed up our DevOps team to focus on innovation.',
    customerPersona:
      'An IT Director at a large financial services corporation concerned with security, compliance, and minimizing operational overhead during a cloud migration.',
    author: 'John Smith',
    title: 'IT Director, Stellar Solutions',
    logoId: 'logo-stellar',
    avatarId: 'avatar-2',
  },
  {
    baseTestimonial:
      "The global reach of ApexCloud's CDN is incredible. We can now deliver our e-commerce site to customers worldwide with lightning-fast speed, which has directly boosted our conversion rates.",
    customerPersona:
      'A Head of E-commerce for a global retail brand focused on providing a fast and seamless online shopping experience to customers in different regions.',
    author: 'Sam Wilson',
    title: 'Head of E-commerce, Nexus Dynamics',
    logoId: 'logo-nexus',
    avatarId: 'avatar-3',
  },
];

type PersonalizedTestimonial = (typeof testimonialData)[0] & {
  personalized: string;
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<PersonalizedTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateTestimonials = async () => {
      setIsLoading(true);
      const generated = await Promise.all(
        testimonialData.map(async (data) => {
          const personalized = await getPersonalizedTestimonial({
            baseTestimonial: data.baseTestimonial,
            customerPersona: data.customerPersona,
          });
          return { ...data, personalized };
        })
      );
      setTestimonials(generated);
      setIsLoading(false);
    };

    generateTestimonials();
  }, []);

  const itemsToDisplay = isLoading ? testimonialData.map((d) => ({ ...d, personalized: '' })) : testimonials;

  return (
    <section id="testimonials" className="bg-primary/5 py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold md:text-4xl">Trusted by Industry Leaders</h2>
          <p className="mt-4 text-lg text-muted-foreground">Hear what our customers have to say about ApexCloud.</p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="mx-auto mt-12 w-full max-w-4xl"
        >
          <CarouselContent>
            {itemsToDisplay.map((item, index) => {
              const logo = PlaceHolderImages.find((p) => p.id === item.logoId);
              const avatar = PlaceHolderImages.find((p) => p.id === item.avatarId);
              return (
                <CarouselItem key={index}>
                  <div className="p-4">
                    <Card className="overflow-hidden">
                      <CardContent className="flex flex-col items-center p-8 text-center md:p-12">
                        {logo && (
                          <Image
                            src={logo.imageUrl}
                            alt={logo.description}
                            width={140}
                            height={40}
                            className="mb-6 object-contain"
                            data-ai-hint={logo.imageHint}
                          />
                        )}
                        <blockquote className="mt-4 border-none p-0 text-xl font-light italic text-foreground md:text-2xl">
                          {isLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-6 w-3/4" />
                            </div>
                          ) : (
                            `"${item.personalized}"`
                          )}
                        </blockquote>

                        <div className="mt-8 flex items-center gap-4">
                          {avatar && (
                            <Avatar>
                              <AvatarImage src={avatar.imageUrl} alt={item.author} />
                              <AvatarFallback>{item.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="text-left">
                            <p className="font-semibold">{item.author}</p>
                            <p className="text-sm text-muted-foreground">{item.title}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
