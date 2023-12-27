import { parseCredentials } from "./credentials-parser";
import { google } from "googleapis";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { OAuth2Client } from "google-auth-library";
import { createInterface } from "readline";
import { schedule } from "node-cron";

let lastOrderMessageId: string | undefined;

async function main() {
  const auth = await authorize();

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
  const { client_secret, client_id, redirect_uris } =
    parseCredentials().installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (existsSync("token.json")) {
    const token = readFileSync("token.json");

    oAuth2Client.setCredentials(JSON.parse(token.toString()));

    return oAuth2Client;
  } else {
    await getNewToken(oAuth2Client);

    return oAuth2Client;
  }
}

async function getNewToken(oAuth2Client: OAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter the token from that page here: ", (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("There was an error parsing that token");

        oAuth2Client.setCredentials(token!);

        writeFileSync("token.json", JSON.stringify(token));

        resolve(oAuth2Client);
      });
    });
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

function onNewOrder() {}

main();
