import { Workbox } from 'workbox-window';

export class PWAService {
  private workbox: Workbox | null = null;
  private deferredPrompt: any = null;

  constructor() {
    this.initializeServiceWorker();
    this.setupInstallPrompt();
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js');
      
      this.workbox.addEventListener('installed', (event) => {
        console.log('✅ PWA Service Worker installed');
        if (event.isUpdate) {
          console.log('🔄 PWA Service Worker updated');
        }
      });

      this.workbox.addEventListener('waiting', () => {
        console.log('⏳ PWA Service Worker waiting for update');
        this.showUpdateNotification();
      });

      await this.workbox.register();
    }
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 NFTSol PWA installed successfully!');
      this.deferredPrompt = null;
      this.hideInstallButton();
    });
  }

  public async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA installation');
      this.deferredPrompt = null;
      return true;
    } else {
      console.log('❌ User dismissed PWA installation');
      return false;
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public async sendNotification(title: string, options: NotificationOptions = {}) {
    if (await this.requestNotificationPermission()) {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });
    }
  }

  public async sendCloutRewardNotification(amount: number) {
    await this.sendNotification(
      '🎉 CLOUT Reward Earned!',
      {
        body: `You earned ${amount} CLOUT tokens!`,
        tag: 'clout-reward',
        requireInteraction: true
      }
    );
  }

  public async sendTimeCapsuleNotification(nftName: string) {
    await this.sendNotification(
      '⏰ Time Capsule Unlocked!',
      {
        body: `Your ${nftName} is now available!`,
        tag: 'time-capsule',
        requireInteraction: true
      }
    );
  }

  private showInstallButton() {
    // This will be handled by the InstallButton component
    console.log('📱 PWA install prompt available');
  }

  private hideInstallButton() {
    console.log('📱 PWA install prompt hidden');
  }

  private showUpdateNotification() {
    // This will be handled by the UpdateNotification component
    console.log('🔄 PWA update available');
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }
}

export const pwaService = new PWAService();

