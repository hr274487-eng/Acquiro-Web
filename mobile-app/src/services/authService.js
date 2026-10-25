import { NativeModules, Platform } from 'react-native';

const { NativeAlertModule } = NativeModules;

let inMemoryAuth = false;

export async function checkAuthSession() {
  if (Platform.OS === 'android' && NativeAlertModule?.isSessionAuthenticated) {
    try {
      const isAuth = await NativeAlertModule.isSessionAuthenticated();
      inMemoryAuth = !!isAuth;
      return !!isAuth;
    } catch (e) {
      console.warn('Failed to check auth session:', e);
    }
  }
  return inMemoryAuth;
}

export async function saveAuthSession(isAuthenticated) {
  inMemoryAuth = !!isAuthenticated;
  if (Platform.OS === 'android' && NativeAlertModule?.setSessionAuthenticated) {
    try {
      await NativeAlertModule.setSessionAuthenticated(!!isAuthenticated);
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  }
}
