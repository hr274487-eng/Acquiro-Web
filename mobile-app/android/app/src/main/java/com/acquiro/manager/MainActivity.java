package com.acquiro.manager;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

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
}
