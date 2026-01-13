import { Header } from '@/components/landing-page/header';
import { Hero } from '@/components/landing-page/hero';
import { Products } from '@/components/landing-page/products';
import { Testimonials } from '@/components/landing-page/testimonials';
import { Footer } from '@/components/landing-page/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Products />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
