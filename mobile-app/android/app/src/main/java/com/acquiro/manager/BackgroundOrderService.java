package com.acquiro.manager;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class BackgroundOrderService extends Service {
    private static final String SERVICE_CHANNEL_ID = "acquiro_service_channel";
    private static final String SERVICE_CHANNEL_NAME = "Background Order Monitor";
    private static final int SERVICE_NOTIFICATION_ID = 1002;

    public static final String ALERTS_CHANNEL_ID = "acquiro_orders_channel";
    public static final String ALERTS_CHANNEL_NAME = "Incoming Order Alerts";

    private static final String SUPABASE_URL = "https://tpvqnghvvlsqowpklkav.supabase.co/rest/v1/orders?select=id,customer_name,service_type,order_ref,status,created_at&order=created_at.desc&limit=15";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnFuZ2h2dmxzcW93cGtsa2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTg4MjcsImV4cCI6MjEwODQ5NDgyN30.fCENMp7E7otno_XLfx-eqaAB7tKRT_IhTnd2Bs4FsMM";

    private static final String PREFS_NAME = "acquiro_background_prefs";
    private static final String KEY_SEEN_IDS = "seen_order_ids";

    private ScheduledExecutorService scheduler;
    private final Set<String> seenOrderIds = Collections.synchronizedSet(new HashSet<>());
    private volatile boolean isInitialRun = true;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        loadPersistedSeenIds();
        startInForeground();
        startPolling();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // 1. Silent channel for ongoing background service status
            NotificationChannel serviceChannel = new NotificationChannel(
                SERVICE_CHANNEL_ID,
                SERVICE_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps Acquiro order reception active in background");
            serviceChannel.setShowBadge(false);
            manager.createNotificationChannel(serviceChannel);

            // 2. High-priority alert channel for incoming orders
            NotificationChannel alertChannel = new NotificationChannel(
                ALERTS_CHANNEL_ID,
                ALERTS_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("High priority order reception alerts with Modern Tech Ping tone");
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 250, 100, 250, 100, 350});
            alertChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.tech_ping);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_REQUEST)
                .build();
            alertChannel.setSound(soundUri, audioAttributes);

            manager.createNotificationChannel(alertChannel);
        }
    }

    private void startInForeground() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, flags);

        Notification notification = new NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
            .setContentTitle("Acquiro Live Reception")
            .setContentText("Monitoring new website orders in real-time")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(SERVICE_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(SERVICE_NOTIFICATION_ID, notification);
            }
        } catch (Throwable t) {
            try {
                startForeground(SERVICE_NOTIFICATION_ID, notification);
            } catch (Throwable ignored) {}
        }
    }

    private void loadPersistedSeenIds() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> saved = prefs.getStringSet(KEY_SEEN_IDS, null);
            if (saved != null) {
                seenOrderIds.addAll(saved);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    private void savePersistedSeenIds() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putStringSet(KEY_SEEN_IDS, new HashSet<>(seenOrderIds)).apply();
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    private void startPolling() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
        // Poll every 10 seconds for real-time order notifications
        scheduler.scheduleWithFixedDelay(this::pollSupabaseOrders, 2, 10, TimeUnit.SECONDS);
    }

    private void pollSupabaseOrders() {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(SUPABASE_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();

                JSONArray orders = new JSONArray(sb.toString());

                // On first run, record all existing order IDs so we never alert on historical orders
                if (isInitialRun) {
                    for (int i = 0; i < orders.length(); i++) {
                        JSONObject o = orders.optJSONObject(i);
                        if (o != null) {
                            String id = o.optString("id");
                            if (!id.isEmpty()) {
                                seenOrderIds.add(id);
                            }
                        }
                    }
                    savePersistedSeenIds();
                    isInitialRun = false;
                    return;
                }

                // Check for new incoming orders
                for (int i = 0; i < orders.length(); i++) {
                    JSONObject o = orders.optJSONObject(i);
                    if (o == null) continue;

                    String id = o.optString("id");
                    String status = o.optString("status", "new").toLowerCase();

                    if (!id.isEmpty() && !seenOrderIds.contains(id)) {
                        seenOrderIds.add(id);
                        savePersistedSeenIds();

                        if (status.equals("new") || status.isEmpty()) {
                            // Only trigger system heads-up notification when app is in the background
                            if (!MainActivity.isAppInForeground) {
                                String customerName = o.optString("customer_name", "Client");
                                String serviceType = o.optString("service_type", "New Project");
                                String orderRef = o.optString("order_ref", "Order #" + id);

                                triggerBackgroundAlert(customerName, serviceType, orderRef);
                            }
                        }
                    }
                }
            }
        } catch (Throwable t) {
            // Network hiccups are ignored silently; next poll will retry
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private void triggerBackgroundAlert(String customerName, String serviceType, String orderRef) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("orderRef", orderRef);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) System.currentTimeMillis(), intent, flags);

            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.tech_ping);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ALERTS_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🔔 New Order: " + customerName)
                .setContentText(serviceType + " • " + orderRef)
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

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
