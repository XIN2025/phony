'use client';

import { useEffect } from 'react';
import { envConfig } from '@/config';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only run in production or localhost
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const isProd = process.env.NODE_ENV === 'production';
    if ((isProd || isLocalhost) && 'serviceWorker' in navigator) {
      // Unregister any old service workers (one-time cleanup)
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          console.log('[SW] Unregistering old service workers...');
          registrations.forEach((reg) => reg.unregister());
        }
        // Register the new service worker after cleanup
        window.addEventListener('load', () => {
          const swUrl = `/sw.js?cb=${Date.now()}`; // cache-busting query param
          console.log(`[SW] Attempting to register service worker at: ${swUrl}`);
          navigator.serviceWorker
            .register(swUrl)
            .then(async (registration) => {
              console.log('[SW] Registration successful:', registration);
              // Wait for the service worker to be active before subscribing to push
              await waitForServiceWorkerActive(registration);
              console.log('[SW] Service worker is active. Proceeding with push registration.');
              // --- Push Notification Registration ---
              if ('Notification' in window && 'PushManager' in window) {
                try {
                  const permission = await Notification.requestPermission();
                  console.log('[Push] Notification permission:', permission);
                  if (permission === 'granted') {
                    const VAPID_PUBLIC_KEY = envConfig.vapidPublicKey;
                    if (!VAPID_PUBLIC_KEY) {
                      throw new Error(
                        'VAPID public key is missing. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your .env file.',
                      );
                    }
                    const subscribeOptions = {
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    };
                    const subscription = await registration.pushManager.subscribe(subscribeOptions);
                    console.log('[Push] Push subscription:', subscription);
                    // Send subscription to backend
                    await fetch('/api/save-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(subscription),
                    });
                  }
                } catch (err) {
                  console.error('[Push] Error during push registration:', err);
                }
              } else {
                console.warn('[Push] Push messaging is not supported in this browser.');
              }
              // --- End Push Notification Registration ---
            })
            .catch((registrationError) => {
              console.error('[SW] Registration failed:', registrationError);
              if (registrationError && registrationError.message) {
                alert('Service Worker registration failed: ' + registrationError.message);
              }
            });
        });
      });
    } else {
      console.warn(
        '[SW] Service worker not supported in this browser/environment, or not running in production/localhost.',
      );
    }
  }, []);
  return null;
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Wait for the service worker to be active before proceeding
async function waitForServiceWorkerActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) {
    return;
  }
  return new Promise((resolve) => {
    if (registration.installing) {
      registration.installing.addEventListener('statechange', function listener(e) {
        if ((e.target as ServiceWorker).state === 'activated') {
          resolve();
        }
      });
    } else if (registration.waiting) {
      registration.waiting.addEventListener('statechange', function listener(e) {
        if ((e.target as ServiceWorker).state === 'activated') {
          resolve();
        }
      });
    } else {
      // Fallback: poll until active
      const interval = setInterval(() => {
        if (registration.active) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
}
