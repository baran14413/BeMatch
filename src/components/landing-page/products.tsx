import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Server, Database, Globe } from 'lucide-react';

const products = [
  {
    icon: Server,
    title: 'Elastic Compute',
    description: 'Scalable virtual servers with predictable performance and flexible configurations. Perfect for any workload.',
    features: ['99.99% Uptime SLA', 'Pay-as-you-go pricing', 'Root access'],
    price: '$20/mo',
  },
  {
    icon: Database,
    title: 'Managed Databases',
    description: 'Fully managed SQL and NoSQL databases, including PostgreSQL, MySQL, and Redis. We handle the maintenance.',
    features: ['Automated backups', 'High availability', 'Vertical & horizontal scaling'],
    price: '$50/mo',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Deliver your content faster to a global audience with our low-latency Content Delivery Network.',
    features: ['200+ PoPs worldwide', 'DDoS Protection', 'Free SSL certificate'],
    price: '$15/mo',
  },
];

export function Products() {
  return (
    <section id="products" className="bg-background py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold md:text-4xl">Our Top Products</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover our suite of cloud products designed for performance, reliability, and ease of use.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <product.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">{product.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="mb-4 text-muted-foreground">{product.description}</p>
                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <p className="text-xl font-bold">{product.price}</p>
                <Button variant="outline">Learn More</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
