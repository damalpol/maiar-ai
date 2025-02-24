import "dotenv/config";

// Suppress deprecation warnings
process.removeAllListeners("warning");

import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from root .env
config({
  path: path.resolve(__dirname, "../../..", ".env")
});

import { createRuntime } from "@maiar-ai/core";

// Import providers
import { SQLiteProvider } from "@maiar-ai/memory-sqlite";
import { OpenAIProvider } from "@maiar-ai/model-openai";

// Import all plugins
import { PluginCharacter } from "@maiar-ai/plugin-character";
import { PluginExpress } from "@maiar-ai/plugin-express";
import { PluginSearch } from "@maiar-ai/plugin-search";
import { PluginTelegram } from "@maiar-ai/plugin-telegram";
import { PluginTerminal } from "@maiar-ai/plugin-terminal";
import { PluginTextGeneration } from "@maiar-ai/plugin-text";
import { PluginTime } from "@maiar-ai/plugin-time";
import { PluginX } from "@maiar-ai/plugin-x";
import appRouter from "./app";
import composer from "./bot";

// Create and start the agent
const runtime = createRuntime({
  model: new OpenAIProvider({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string
  }),
  memory: new SQLiteProvider({
    dbPath: path.join(process.cwd(), "data", "conversations.db")
  }),
  plugins: [
    new PluginExpress({
      port: 3001,
      router: appRouter
    }),
    new PluginTextGeneration(),
    new PluginTime(),
    new PluginCharacter({
      character: fs.readFileSync(
        path.join(process.cwd(), "character.xml"),
        "utf-8"
      )
    }),
    new PluginSearch({
      apiKey: process.env.PERPLEXITY_API_KEY as string
    }),
    new PluginX({
      username: process.env.X_USERNAME as string,
      password: process.env.X_PASSWORD as string,
      email: process.env.X_EMAIL as string,
      mentionsCheckIntervalMins: 10,
      loginRetries: 3
    }),
    new PluginTerminal({
      user: "test",
      agentName: "maiar-starter"
    }),
    new PluginTelegram({
      token: process.env.TELEGRAM_BOT_TOKEN as string,
      composer
    })
  ]
});

// Start the runtime if this file is run directly
if (require.main === module) {
  console.log("Starting agent...");
  runtime.start().catch((error) => {
    console.error("Failed to start agent:", error);
    process.exit(1);
  });

  // Handle shutdown gracefully
  process.on("SIGINT", async () => {
    console.log("Shutting down agent...");
    await runtime.stop();
    process.exit(0);
  });
}
