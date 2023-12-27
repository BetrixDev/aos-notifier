import { parseCredentials } from "./credentials-parser.js";
import { google } from "googleapis";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { OAuth2Client } from "google-auth-library";
import { createInterface } from "readline";
import { schedule } from "node-cron";
import cfonts from "cfonts";
import chalk from "chalk";
import { error, info } from "./logger.js";

cfonts.say("AOS NOTIFIER", {
  font: "block",
  colors: ["red", "black"],
});

let lastOrderMessageId: string | undefined;

async function main() {
  const auth = await authorize();

  info("Watching for new orders...");

  schedule("* * * * *", async () => {
    const message = await getMostRecentMessage(auth);

    if (message.data.snippet?.startsWith("Order Assigned")) {
      if (
        lastOrderMessageId !== message.data.id &&
        message.data.id !== undefined &&
        message.data.id !== null
      ) {
        lastOrderMessageId = message.data.id;

        onNewOrder();
      }
    }
  });
}

async function authorize() {
  info("Connecting to google authentication servers");

  const { client_secret, client_id, redirect_uris } =
    parseCredentials().installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (existsSync("token.json")) {
    info("Found existing login session... using that");

    const token = readFileSync("token.json");

    oAuth2Client.setCredentials(JSON.parse(token.toString()));

    return oAuth2Client;
  } else {
    await getNewToken(oAuth2Client);

    return oAuth2Client;
  }
}

async function getNewToken(oAuth2Client: OAuth2Client) {
  info("No existing login session found...");

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  console.log(
    "\n",
    chalk.green("Authorize this app by visiting this url:"),
    chalk.blue(authUrl),
    "\n"
  );

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.green("Ender the URL you were redirected to here: "),
      (url) => {
        rl.close();
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get("code");

        if (!code) {
          return error(
            "No code was present in that URL. Please run the program again to try again"
          );
        }

        oAuth2Client.getToken(code, (err, token) => {
          if (err) return error("There was an error parsing that token");

          oAuth2Client.setCredentials(token!);

          writeFileSync("token.json", JSON.stringify(token));

          info("Successfully authenticated with google servers");

          resolve(oAuth2Client);
        });
      }
    );
  });
}

async function getMostRecentMessage(auth: OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth });

  const recentMessageId = await gmail.users.messages
    .list({
      userId: "me",
      maxResults: 1,
    })
    .then(({ data }) => {
      return data.messages?.at(0)?.id;
    });

  const recentMessageData = await gmail.users.messages.get({
    userId: "me",
    id: recentMessageId!,
    format: "full",
  });

  return recentMessageData;
}

function onNewOrder() {
  info("A new order has been found, triggering alarm");
}

main();
