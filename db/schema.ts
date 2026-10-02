import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const progress = sqliteTable("progress", {
 userId: text("user_id").notNull(), topicId: text("topic_id").notNull(),
 status: integer("status").notNull().default(0), updatedAt: text("updated_at").notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.topicId] })]);
