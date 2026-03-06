package com.bematch.bematch;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

/**
 * BroadcastReceiver for handling inline message reply actions
 * in Android notifications.
 */
public class NotificationReplyReceiver extends BroadcastReceiver {

    private static final String KEY_REPLY = "key_text_reply";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null)
            return;

        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput == null)
            return;

        CharSequence replyText = remoteInput.getCharSequence(KEY_REPLY);
        if (replyText == null || replyText.length() == 0)
            return;

        // Get notification ID and chat link from intent
        int notifId = intent.getIntExtra("notif_id", -1);
        String link = intent.getStringExtra("link");

        // Dismiss the notification
        if (notifId >= 0) {
            NotificationManagerCompat.from(context).cancel(notifId);
        }

        // Launch app with the reply pre-filled and navigate to the chat
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.putExtra("link", link);
        openIntent.putExtra("reply_text", replyText.toString());
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        context.startActivity(openIntent);
    }
}
