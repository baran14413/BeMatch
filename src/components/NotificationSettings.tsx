'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNativeNotifications } from '@/hooks/use-native-notifications';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettings() {
  const { hasPermission, requestPermission, isNative } = useNativeNotifications();
  const { toast } = useToast();

  const handleToggle = (value: boolean) => {
    if (value && !hasPermission) {
      requestPermission();
    } else if (!value) {
      toast({
        variant: "destructive",
        title: "Disabling Notifications",
        description: "To turn off notifications, you must go to your phone's system settings.",
      });
    }
  };

  if (!isNative) {
    return null; // Don't show this component on the web
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Receive alerts for new messages and matches directly on your device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="notifications-switch" className="flex-grow">
            Enable Notifications
          </Label>
          <Switch
            id="notifications-switch"
            checked={hasPermission}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
