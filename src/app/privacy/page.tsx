
'use client';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/context/language-context";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-primary">{title}</h2>
        <div className="space-y-3 text-muted-foreground">{children}</div>
    </div>
);

export default function PrivacyPage() {
    const { t } = useLanguage();

    return (
        <ScrollArea className="h-full bg-background">
             <div className="h-full">
                <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 p-4 py-6 md:p-8 flex items-center gap-4 border-b pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                    <Link href="/" passHref>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('legal.privacy.title')}</h1>
                    </div>
                </header>
                 <div className="p-4 md:p-8 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Section title={t('legal.privacy.section1.title')}>
                        <p>{t('legal.privacy.section1.content')}</p>
                    </Section>
                    <Section title={t('legal.privacy.section2.title')}>
                        <p>{t('legal.privacy.section2.content')}</p>
                    </Section>
                    <Section title={t('legal.privacy.section3.title')}>
                        <p>{t('legal.privacy.section3.content')}</p>
                    </Section>
                 </div>
            </div>
        </ScrollArea>
    );
}
