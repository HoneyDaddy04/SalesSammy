import { useEffect, useRef, useCallback } from "react";

/**
 * Browser notification + optional sound for real-time events.
 * Requests permission on first call, then fires native notifications.
 */
export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      permissionRef.current = Notification.permission;
      if (Notification.permission === "default") {
        Notification.requestPermission().then(p => { permissionRef.current = p; });
      }
    }
  }, []);

  const notify = useCallback((title: string, body: string, options?: { sound?: boolean; onClick?: () => void }) => {
    // Browser notification
    if ("Notification" in window && permissionRef.current === "granted") {
      const n = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "vaigence-" + Date.now(), // Unique tag to avoid stacking
      });

      if (options?.onClick) {
        n.onclick = () => {
          window.focus();
          options.onClick?.();
          n.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => n.close(), 5000);
    }

    // Play notification sound
    if (options?.sound !== false) {
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Silently fail if autoplay blocked
      } catch {
        // No audio support
      }
    }
  }, []);

  return { notify };
}
