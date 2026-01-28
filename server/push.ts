import webPush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@proapp.com';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    // Get all push subscriptions for this user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // Send to all user's subscriptions (multiple devices)
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys),
        };

        await webPush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        
        successCount++;
        console.log(`Push notification sent to ${userId} (subscription ${sub.id})`);
      } catch (error: any) {
        failedCount++;
        console.error(`Failed to send push to subscription ${sub.id}:`, error.message);

        // If subscription is no longer valid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription ${sub.id}`);
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    });

    await Promise.all(promises);

    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  const promises = userIds.map(async (userId) => {
    const result = await sendPushToUser(userId, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  });

  await Promise.all(promises);

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * Save a push subscription to the database
 */
export async function savePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
): Promise<void> {
  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

    if (existing.length > 0) {
      console.log('Push subscription already exists');
      return;
    }

    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      keys: JSON.stringify(subscription.keys),
    });

    console.log(`Push subscription saved for user ${userId}`);
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

/**
 * Remove a push subscription from the database
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  try {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    
    console.log(`Push subscription removed: ${endpoint}`);
  } catch (error) {
    console.error('Error removing push subscription:', error);
    throw error;
  }
}
