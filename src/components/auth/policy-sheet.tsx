
'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/language-context';

interface PolicySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'terms' | 'privacy';
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="space-y-3 text-muted-foreground text-sm">{children}</div>
    </div>
);

export default function PolicySheet({ isOpen, onOpenChange, initialTab = 'terms' }: PolicySheetProps) {
  const { t } = useLanguage();
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
          <SheetTitle className="text-center text-xl">{t('legal.title')}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
            <Tabs defaultValue={initialTab} className="h-full flex flex-col">
            <div className="px-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="terms">{t('legal.terms.title')}</TabsTrigger>
                    <TabsTrigger value="privacy">{t('legal.privacy.title')}</TabsTrigger>
                    <TabsTrigger value="faq">{t('legal.faq.title')}</TabsTrigger>
                </TabsList>
            </div>
            <ScrollArea className="flex-1 mt-4">
                <div className="px-6 pb-6">
                <TabsContent value="terms" className="mt-0">
                    <div className="space-y-6">
                        <Section title={t('legal.terms.section1.title')}>
                            <p>{t('legal.terms.section1.content')}</p>
                        </Section>
                        <Section title={t('legal.terms.section2.title')}>
                            <p>{t('legal.terms.section2.content')}</p>
                        </Section>
                        <Section title={t('legal.terms.section3.title')}>
                            <p>{t('legal.terms.section3.content')}</p>
                        </Section>
                         <Section title={t('legal.terms.section4.title')}>
                            <p>{t('legal.terms.section4.content')}</p>
                        </Section>
                    </div>
                </TabsContent>
                <TabsContent value="privacy">
                    <div className="space-y-6">
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
                </TabsContent>
                <TabsContent value="faq">
                     <div className="space-y-6">
                        <Section title={t('legal.faq.q1.title')}>
                            <p>{t('legal.faq.q1.content')}</p>
                        </Section>
                         <Section title={t('legal.faq.q2.title')}>
                            <p>{t('legal.faq.q2.content')}</p>
                        </Section>
                        <Section title={t('legal.faq.q3.title')}>
                            <p>{t('legal.faq.q3.content')}</p>
                        </Section>
                    </div>
                </TabsContent>
                </div>
            </ScrollArea>
            </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
