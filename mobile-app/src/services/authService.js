import { NativeModules, Platform } from 'react-native';

const { NativeAlertModule } = NativeModules;

let inMemoryAuth = false;
let inMemoryPassword = 'acquiro2026';
let inMemoryTheme = 'dark';

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

export async function getManagerPassword() {
  if (Platform.OS === 'android' && NativeAlertModule?.getStoredPassword) {
    try {
      const pwd = await NativeAlertModule.getStoredPassword();
      if (pwd) {
        inMemoryPassword = pwd;
        return pwd;
      }
    } catch (e) {
      console.warn('Failed to get stored password:', e);
    }
  }
  return inMemoryPassword;
}

export async function updateManagerPassword(newPassword) {
  inMemoryPassword = newPassword;
  if (Platform.OS === 'android' && NativeAlertModule?.setStoredPassword) {
    try {
      await NativeAlertModule.setStoredPassword(newPassword);
      return true;
    } catch (e) {
      console.warn('Failed to set stored password:', e);
      throw e;
    }
  }
  return true;
}

export async function resetDefaultPassword() {
  inMemoryPassword = 'acquiro2026';
  if (Platform.OS === 'android' && NativeAlertModule?.resetToDefaultPassword) {
    try {
      await NativeAlertModule.resetToDefaultPassword();
      return true;
    } catch (e) {
      console.warn('Failed to reset default password:', e);
      throw e;
    }
  }
  return true;
}

export async function getSavedTheme() {
  if (Platform.OS === 'android' && NativeAlertModule?.getStoredTheme) {
    try {
      const theme = await NativeAlertModule.getStoredTheme();
      if (theme) {
        inMemoryTheme = theme;
        return theme;
      }
    } catch (e) {
      console.warn('Failed to get stored theme:', e);
    }
  }
  return inMemoryTheme;
}

export async function saveThemePreference(theme) {
  inMemoryTheme = theme;
  if (Platform.OS === 'android' && NativeAlertModule?.setStoredTheme) {
    try {
      await NativeAlertModule.setStoredTheme(theme);
      return true;
    } catch (e) {
      console.warn('Failed to save stored theme:', e);
    }
  }
  return true;
}

export async function stopBackgroundService() {
  if (Platform.OS === 'android' && NativeAlertModule?.stopBackgroundMonitoring) {
    try {
      await NativeAlertModule.stopBackgroundMonitoring();
      return true;
    } catch (e) {
      console.warn('Failed to stop background service:', e);
    }
  }
  return false;
}

export async function startBackgroundService() {
  if (Platform.OS === 'android' && NativeAlertModule?.startBackgroundMonitoring) {
    try {
      await NativeAlertModule.startBackgroundMonitoring();
      return true;
    } catch (e) {
      console.warn('Failed to start background service:', e);
    }
  }
  return false;
}
