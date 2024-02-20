import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { readdir } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { $ } from "bun";
import { cron } from "@elysiajs/cron";

const MAIN_DIR = "/Users/thanatpp/.nnn/";

const Status = z.object({
  id: z.string(),
  status: z.string(),
  maxItem: z.number(),
  progress: z.number(),
  avgProcessTime: z.number(),
  lastUpdate: z.date(),
});
const ListStatus = z.array(Status);

const getStatusJson = async () => {
  const file = Bun.file("./src/status.json");
  const json = await file.json();
  return json;
};

const syncStatus = async () => {
  const listStatus: z.infer<typeof ListStatus> = [];
  for await (let line of $`find $HOME/.nnn -type f -name "*.json"`.lines()) {
    if (!line) {
      break;
    }
    const json = await $`cat ${line}`.json();
    const status = Status.parse({
      id: dirname(line).replace(MAIN_DIR, "").split("/").join("_"),
      status: json["status"],
      maxItem: json["maxItem"],
      progress: json["progress"],
      avgProcessTime: json["avgProcessTime"],
      lastUpdate: new Date(json["lastUpdate"]),
    });
    listStatus.push(status);
  }
  await Bun.write("./src/status.json", JSON.stringify(listStatus));
};

const app = new Elysia()
  .use(cors())
  .use(
    cron({
      name: "sync-status",
      pattern: "*/10 * * * * *",
      async run() {
        console.log("Sync status");
        await syncStatus();
      },
    })
  )
  .ws("/status", {
    async message(ws) {
      console.log("client is subscribing to timer with interval ");
      const json = await getStatusJson();
      ws.send(json);

      setInterval(async () => {
        const json = await getStatusJson();
        ws.send(json);
      }, 12000);
    },
  })
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
