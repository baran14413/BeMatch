'use client'; // This directive is for Next.js, but the code logic is for React Native

import React from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Assuming you have RN equivalents

/**
 * A component for toggling native push notification permissions.
 */
export default function NotificationSettings() {
  const { hasPermission, requestPermission } = useNativeNotifications();

  const handleToggle = (value: boolean) => {
    if (value) {
      // User is trying to turn notifications ON
      requestPermission();
    } else {
      // User is trying to turn notifications OFF
      // Apps cannot programmatically revoke permissions. Inform the user.
      Alert.alert(
        "Disable Notifications",
        "To turn off notifications, you need to go to your phone's settings.\n\nSettings > Apps > BeMatch > Notifications",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.title}>Push Notifications</CardTitle>
        <CardDescription style={styles.description}>
          Receive alerts for new messages and matches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={hasPermission ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleToggle}
            value={hasPermission}
          />
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    // Add styling for your Card component if needed
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
  },
});
