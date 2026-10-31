package com.acquiro.manager;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NativeAlertModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "acquiro_orders_channel";
    private static final String CHANNEL_NAME = "Incoming Order Alerts";
    private static final int NOTIFICATION_ID = 1001;

    private final ReactApplicationContext reactContext;

    public NativeAlertModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "NativeAlertModule";
    }

    public static void createNotificationChannel(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("High priority order reception alerts with Modern Tech Ping tone");
                    channel.enableVibration(true);
                    channel.setVibrationPattern(new long[]{0, 250, 100, 250, 100, 350});
                    channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

                    Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/tech_ping");
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_REQUEST)
                        .build();
                    channel.setSound(soundUri, audioAttributes);

                    manager.createNotificationChannel(channel);
                }
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @ReactMethod
    public void triggerHeadsUpNotification(String title, String body, String orderRef) {
        try {
            Context context = getReactApplicationContext();
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            createNotificationChannel(context);

            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            intent.putExtra("orderRef", orderRef);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);

            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/tech_ping");

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 250, 100, 250, 100, 350})
                .setSound(soundUri)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            manager.notify((int) System.currentTimeMillis(), builder.build());
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @ReactMethod
    public void playTechPingSound() {
        try {
            Context context = getReactApplicationContext();
            MediaPlayer mediaPlayer = MediaPlayer.create(context, R.raw.tech_ping);
            if (mediaPlayer != null) {
                mediaPlayer.setOnCompletionListener(MediaPlayer::release);
                mediaPlayer.start();
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @ReactMethod
    public void triggerVibration() {
        try {
            Context context = getReactApplicationContext();
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(new long[]{0, 220, 80, 220, 80, 360}, -1);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    @ReactMethod
    public void setSessionAuthenticated(boolean authenticated, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("is_authenticated", authenticated).apply();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("AUTH_SAVE_ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void isSessionAuthenticated(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            boolean authenticated = prefs.getBoolean("is_authenticated", false);
            promise.resolve(authenticated);
        } catch (Throwable t) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void getStoredPassword(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            String pwd = prefs.getString("manager_password", "acquiro2026");
            promise.resolve(pwd != null ? pwd : "acquiro2026");
        } catch (Throwable t) {
            promise.resolve("acquiro2026");
        }
    }

    @ReactMethod
    public void setStoredPassword(String newPassword, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("manager_password", newPassword).apply();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("PASSWORD_SAVE_ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void resetToDefaultPassword(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("manager_password", "acquiro2026").apply();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("PASSWORD_RESET_ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void getStoredTheme(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            String theme = prefs.getString("app_theme", "dark");
            promise.resolve(theme != null ? theme : "dark");
        } catch (Throwable t) {
            promise.resolve("dark");
        }
    }

    @ReactMethod
    public void setStoredTheme(String theme, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("acquiro_auth_prefs", Context.MODE_PRIVATE);
            prefs.edit().putString("app_theme", theme).apply();
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("THEME_SAVE_ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void stopBackgroundMonitoring(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(context, BackgroundOrderService.class);
            context.stopService(intent);

            // Post a logout notification to notify the user that background monitoring stopped
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                createNotificationChannel(context);
                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle("Manager Signed Out")
                    .setContentText("Background order monitoring has been stopped.")
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setAutoCancel(true);
                manager.notify(1099, builder.build());
            }

            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("SERVICE_STOP_ERROR", t.getMessage());
        }
    }

    @ReactMethod
    public void startBackgroundMonitoring(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(context, BackgroundOrderService.class);
            context.startService(intent);
            promise.resolve(true);
        } catch (Throwable t) {
            promise.reject("SERVICE_START_ERROR", t.getMessage());
        }
    }
}
