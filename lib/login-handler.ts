
import { db } from "./db";
import { apiKey } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Send login notification email after successful login
 * This should be called from client-side after successful authentication
 */
export async function handleLoginNotification(
  userId: string,
  userEmail: string,
  userName: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // Get user's API usage stats
    const [apiKeyData] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.userId, userId))
      .limit(1);

    const requestCount = apiKeyData?.requestCount || 0;
    const requestQuota = apiKeyData?.requestQuota || 0;

    

    return { success: true };
  } catch (error) {
    console.error('Failed to send login notification:', error);
    // Don't throw error, just log it
    return { success: false, error };
  }
}
