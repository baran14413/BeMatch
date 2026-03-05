package com.bematch.bematch;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * BeMatch FCM Messaging Service
 * Handles push notifications when app is in background or killed.
 * - Creates "BeMatch Mesajlar" notification channel
 * - Shows rich notification with inline reply action for message type
 * - Fixes "i" box in status bar by using ic_stat_notify (white vector drawable)
 */
public class BeMatchFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID_MESSAGES = "bematch_messages";
    private static final String CHANNEL_ID_APP = "bematch_app";
    private static final String KEY_REPLY = "key_text_reply";
    private static int notifId = 1000;

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Token renewal is handled on the JS side via saveFcmToken()
        // Nothing needed here for now
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        String title = data.getOrDefault("title", "BeMatch");
        String body = data.getOrDefault("body", "");
        String type = data.getOrDefault("type", "app");
        String link = data.getOrDefault("link", "");

        // If the app is in foreground, Capacitor handles it — skip
        // We only need to handle background/killed state

        ensureChannels();

        if ("message".equals(type)) {
            showMessageNotification(title, body, link);
        } else {
            showGeneralNotification(title, body, link, type);
        }
    }

    private void ensureChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);

            // Messages channel — high importance for heads-up display
            NotificationChannel msgChannel = new NotificationChannel(
                    CHANNEL_ID_MESSAGES,
                    "BeMatch Mesajlar",
                    NotificationManager.IMPORTANCE_HIGH
            );
            msgChannel.setDescription("Yeni mesaj bildirimleri");
            msgChannel.enableLights(true);
            msgChannel.setLightColor(Color.RED);
            msgChannel.enableVibration(true);
            nm.createNotificationChannel(msgChannel);

            // App notifications channel — default importance
            NotificationChannel appChannel = new NotificationChannel(
                    CHANNEL_ID_APP,
                    "BeMatch Bildirimleri",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            appChannel.setDescription("Eşleşme ve beğeni bildirimleri");
            nm.createNotificationChannel(appChannel);
        }
    }

    private void showMessageNotification(String title, String body, String link) {
        // Inline reply action
        RemoteInput remoteInput = new RemoteInput.Builder(KEY_REPLY)
                .setLabel("Cevapla...")
                .build();

        Intent replyIntent = new Intent(this, MainActivity.class);
        replyIntent.setAction("ACTION_REPLY");
        replyIntent.putExtra("link", link);
        replyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;

        PendingIntent replyPendingIntent = PendingIntent.getActivity(
                this, notifId, replyIntent, flags);

        NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
                R.drawable.ic_stat_notify,
                "Cevapla",
                replyPendingIntent)
                .addRemoteInput(remoteInput)
                .build();

        // Tap to open
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.putExtra("link", link);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
                this, notifId + 1, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0));

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_MESSAGES)
                .setSmallIcon(R.drawable.ic_stat_notify)  // White vector — no "i" box
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openPending)
                .addAction(replyAction)
                .setColor(0xFFE63946);  // BeMatch red

        NotificationManagerCompat.from(this).notify(notifId++, builder.build());
    }

    private void showGeneralNotification(String title, String body, String link, String type) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.putExtra("link", link);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT |
                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);

        PendingIntent openPending = PendingIntent.getActivity(this, notifId, openIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_APP)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(openPending)
                .setColor(0xFFE63946);

        NotificationManagerCompat.from(this).notify(notifId++, builder.build());
    }
}
