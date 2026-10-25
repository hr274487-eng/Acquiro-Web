package com.acquiro.manager;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

  public static volatile boolean isAppInForeground = false;

  @Override
  protected String getMainComponentName() {
    return "AcquiroManager";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    // Fabric disabled (new arch off) — pass false explicitly; do NOT call
    // DefaultNewArchitectureEntryPoint.getFabricEnabled() which throws when
    // new-arch codegen has not run.
    return new DefaultReactActivityDelegate(this, getMainComponentName(), false);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    startBackgroundService();
  }

  @Override
  protected void onResume() {
    super.onResume();
    isAppInForeground = true;
    startBackgroundService();
  }

  @Override
  protected void onPause() {
    super.onPause();
    isAppInForeground = false;
  }

  @Override
  protected void onStop() {
    super.onStop();
    isAppInForeground = false;
  }

  private void startBackgroundService() {
    try {
      Intent intent = new Intent(this, BackgroundOrderService.class);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForegroundService(intent);
      } else {
        startService(intent);
      }
    } catch (Throwable t) {
      t.printStackTrace();
    }
  }
}
