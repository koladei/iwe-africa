import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connection: Promise<void> | undefined;

export async function redis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (error) => console.error(JSON.stringify({ event: "redis_error", message: error.message })));
    connection = client.connect()
      .then(() => undefined)
      .catch((error) => {
        console.error(JSON.stringify({ event: "redis_connection_failed", message: error instanceof Error ? error.message : "unknown" }));
      });
  }
  await connection;
  return client.isReady ? client : null;
}
