const THROTTLE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const LAST_NOTIFICATION_KEY = 'lastErrorNotificationTime';
const NOTIFICATION_EMAIL = 'nithya@enable.kids';

interface ErrorNotificationPayload {
  errorType: string;
  errorMessage: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

// Track in-flight notifications to prevent race conditions
let pendingNotification: Promise<void> | null = null;

export async function sendErrorNotification(
  errorType: string,
  errorMessage: string
): Promise<void> {
  // If a notification is already being sent, wait for it instead of sending another
  if (pendingNotification) {
    console.log('Error notification already in progress, skipping duplicate');
    return pendingNotification;
  }

  // Check if we should throttle this notification
  const lastNotificationTime = localStorage.getItem(LAST_NOTIFICATION_KEY);
  const now = Date.now();

  if (lastNotificationTime) {
    const timeSinceLastNotification = now - parseInt(lastNotificationTime, 10);
    if (timeSinceLastNotification < THROTTLE_DURATION) {
      console.log('Error notification throttled. Last sent:', new Date(parseInt(lastNotificationTime, 10)));
      return;
    }
  }

  // Create the notification promise and track it
  pendingNotification = (async () => {
    // Prepare notification payload
    const payload: ErrorNotificationPayload = {
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      // Send notification via Web3Forms
      const formData = new FormData();
      formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '');
      formData.append('subject', `Memory Game Error: ${errorType}`);
      formData.append('email', NOTIFICATION_EMAIL);
      formData.append('from_name', 'Memory Game Error Monitor');
      formData.append('message', `
Error Type: ${payload.errorType}
Error Message: ${payload.errorMessage}
Timestamp: ${payload.timestamp}
URL: ${payload.url}
User Agent: ${payload.userAgent}
    `.trim());

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update last notification time
        localStorage.setItem(LAST_NOTIFICATION_KEY, now.toString());
        console.log('Error notification sent successfully');
      } else {
        console.error('Failed to send error notification:', result);
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    } finally {
      // Clear the pending flag
      pendingNotification = null;
    }
  })();

  return pendingNotification;
}
