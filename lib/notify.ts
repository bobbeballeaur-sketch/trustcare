// Creates an in-app notification (the bell). One table serves every role.
import "server-only";
import { db } from "./db";

export async function notify(userId: string, title: string, message: string, link?: string) {
  await db.notification.create({ data: { userId, title, message, link } });
}
