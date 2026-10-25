package com.acquiro.manager;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          // Always return false so the standalone APK loads bundled JS from assets without Metro server
          return false;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new NativeAlertPackage()
          );
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected String getBundleAssetName() {
          return "index.android.bundle";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    try {
      SoLoader.init(this, false);
    } catch (Throwable t) {
      t.printStackTrace();
    }
    try {
      NativeAlertModule.createNotificationChannel(this);
    } catch (Throwable t) {
      t.printStackTrace();
    }
  }
}
