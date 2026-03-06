package com.bematch.bematch;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * BeMatch FCM Messaging Service
 *
 * Handles push notifications when app is in background or killed.
 * - Creates notification channels
 * - Shows rich notification with inline reply for "message" type
 * - Uses ic_stat_notify (white vector) to fix the "i box" in status bar
 */
public class BeMatchFirebaseMessagingService extends FirebaseMessagingService {

        public static final String CHANNEL_ID_MESSAGES = "bematch_messages";
        public static final String CHANNEL_ID_APP = "bematch_app";
        public static final String KEY_REPLY = "key_text_reply";
        public static final String ACTION_REPLY = "com.bematch.bematch.ACTION_REPLY";

        private static final AtomicInteger notifCounter = new AtomicInteger(2000);

        @Override
        public void onNewToken(String token) {
                super.onNewToken(token);
                // Token is stored by JS side via AuthContext > initFCM
                // Nothing needed here — token is fetched fresh on each app launch
        }

        @Override
        public void onMessageReceived(RemoteMessage remoteMessage) {
                super.onMessageReceived(remoteMessage);

                Map<String, String> data = remoteMessage.getData();

                // If no data payload, use notification payload
                String title = data.getOrDefault("title",
                                remoteMessage.getNotification() != null ? remoteMessage.getNotification().getTitle()
                                                : "BeMatch");
                String body = data.getOrDefault("body",
                                remoteMessage.getNotification() != null ? remoteMessage.getNotification().getBody()
                                                : "");
                String type = data.getOrDefault("type", "app");
                String link = data.getOrDefault("link", "/");

                ensureChannels();

                if ("message".equals(type)) {
                        showMessageNotification(title, body, link);
                } else {
                        showGeneralNotification(title, body, link);
                }
        }

        private void ensureChannels() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        NotificationManager nm = getSystemService(NotificationManager.class);

                        NotificationChannel msgChannel = new NotificationChannel(
                                        CHANNEL_ID_MESSAGES, "BeMatch Mesajlar", NotificationManager.IMPORTANCE_HIGH);
                        msgChannel.setDescription("Yeni mesaj bildirimleri");
                        msgChannel.enableLights(true);
                        msgChannel.setLightColor(Color.RED);
                        msgChannel.enableVibration(true);
                        nm.createNotificationChannel(msgChannel);

                        NotificationChannel appChannel = new NotificationChannel(
                                        CHANNEL_ID_APP, "BeMatch Bildirimleri", NotificationManager.IMPORTANCE_DEFAULT);
                        appChannel.setDescription("Eşleşme ve beğeni bildirimleri");
                        nm.createNotificationChannel(appChannel);
                }
        }

        private void showMessageNotification(String title, String body, String link) {
                int notifId = notifCounter.getAndIncrement();

                // ── Inline Reply action ──────────────────────────────────────────────
                RemoteInput remoteInput = new RemoteInput.Builder(KEY_REPLY)
                                .setLabel("Yanıtla...")
                                .build();

                Intent replyIntent = new Intent(this, NotificationReplyReceiver.class);
                replyIntent.setAction(ACTION_REPLY);
                replyIntent.putExtra("notif_id", notifId);
                replyIntent.putExtra("link", link);

                int replyFlags = PendingIntent.FLAG_UPDATE_CURRENT |
                                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0);
                PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                                this, notifId, replyIntent, replyFlags);

                NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
                                R.drawable.ic_stat_notify, "Yanıtla", replyPendingIntent)
                                .addRemoteInput(remoteInput)
                                .setAllowGeneratedReplies(true)
                                .build();

                // ── Open action ──────────────────────────────────────────────────────
                Intent openIntent = new Intent(this, MainActivity.class);
                openIntent.putExtra("link", link);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int openFlags = PendingIntent.FLAG_UPDATE_CURRENT |
                                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);
                PendingIntent openPending = PendingIntent.getActivity(
                                this, notifId + 1, openIntent, openFlags);

                // ── Notification ─────────────────────────────────────────────────────
                NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_MESSAGES)
                                .setSmallIcon(R.drawable.ic_stat_notify) // white vector — no "i box"
                                .setContentTitle(title)
                                .setContentText(body)
                                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                                .setPriority(NotificationCompat.PRIORITY_HIGH)
                                .setAutoCancel(true)
                                .setContentIntent(openPending)
                                .addAction(replyAction)
                                .setColor(0xFFE63946);

                try {
                        NotificationManagerCompat.from(this).notify(notifId, builder.build());
                } catch (SecurityException e) {
                        // Permission not granted — user hasn't approved notifications
                }
        }

        private void showGeneralNotification(String title, String body, String link) {
                int notifId = notifCounter.getAndIncrement();

                Intent openIntent = new Intent(this, MainActivity.class);
                openIntent.putExtra("link", link);
                openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
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

                try {
                        NotificationManagerCompat.from(this).notify(notifId, builder.build());
                } catch (SecurityException e) {
                        // Permission not granted
                }
        }
}
