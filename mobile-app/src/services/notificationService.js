import { NativeModules, Platform, Vibration } from 'react-native';

const { NativeAlertModule } = NativeModules;

export function triggerHeadsUpAlert(title, body, orderRef) {
  if (Platform.OS === 'android' && NativeAlertModule?.triggerHeadsUpNotification) {
    NativeAlertModule.triggerHeadsUpNotification(title, body, orderRef || '');
  } else {
    // Cross-platform fallback
    Vibration.vibrate([0, 220, 80, 220, 80, 360]);
  }
}

export function playTechPing() {
  if (Platform.OS === 'android' && NativeAlertModule?.playTechPingSound) {
    NativeAlertModule.playTechPingSound();
  }
}

export function pulseVibration() {
  if (Platform.OS === 'android' && NativeAlertModule?.triggerVibration) {
    NativeAlertModule.triggerVibration();
  } else {
    Vibration.vibrate([0, 220, 80, 220, 80, 360]);
  }
}
