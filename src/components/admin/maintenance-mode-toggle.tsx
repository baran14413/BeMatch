'use client';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function MaintenanceModeToggle() {
  const [isChecked, setIsChecked] = useState(false);
  const { toast } = useToast();

  const handleChange = async (checked: boolean) => {
    setIsChecked(checked);
    // Here you would typically call a server action to update the setting in a database
    try {
      // await setMaintenanceMode(checked);
      toast({
        title: `Bakım Modu ${checked ? 'Aktif' : 'Devre Dışı'}`,
        description: `Uygulama başarıyla ${checked ? 'bakım moduna alındı' : 'bakım modundan çıkarıldı'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Ayar güncellenirken bir sorun oluştu.',
      });
      setIsChecked(!checked); // Revert on error
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch id="maintenance-mode" checked={isChecked} onCheckedChange={handleChange} />
      <Label htmlFor="maintenance-mode" className="font-medium">
        {isChecked ? 'Bakım Modu Aktif' : 'Bakım Modu Devre Dışı'}
      </Label>
    </div>
  );
}
