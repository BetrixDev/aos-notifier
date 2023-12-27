import { z } from "zod";
import { readFileSync } from "fs";

export const schema = z.object({
  installed: z.object({
    client_id: z.string(),
    project_id: z.string(),
    auth_uri: z.string(),
    token_uri: z.string(),
    auth_provider_x509_cert_url: z.string(),
    client_secret: z.string(),
    redirect_uris: z.array(z.string()),
  }),
});

export function parseCredentials() {
  return schema.parse(JSON.parse(readFileSync("credentials.json").toString()));
}
