import { existsSync, copyFileSync, readFileSync, rmSync } from "fs";
import { z } from "zod";
import yaml from "yaml";
import { warn, info } from "./logger.js";

export const schema = z.object({
  order_check_interval: z.number(),
  alarm_interval: z.number(),
  button_pin: z.number(),
  alarm_relay_pin: z.number(),
  alarm_on_duration: z.number(),
});

export function parseConfig() {
  if (!existsSync("config.yml")) {
    // If config.yml doesn't exist, create it off of default-config.yml
    info("No configuration file found, creating one");
    copyFileSync("default-config.yml", "config.yml");
  }

  // Read the contents of config.yml and parse to json
  const configJson = yaml.parse(readFileSync("config.yml").toString());

  try {
    // Attempt to parse the config
    return schema.parse(configJson);
  } catch {
    // If the parse fails, delete the file and try again
    warn("Malformed configuration file found, creating a new copy");
    rmSync("config.yml", { force: true });

    return parseConfig();
  }
}
