import { BskyAgent } from "@atproto/api";
import dotenv from "dotenv";
import {
  OutputSchema as RepoEvent,
  isCommit,
} from "../lexicon/types/com/atproto/sync/subscribeRepos";
import { FirehoseSubscriptionBase, getOpsByType } from "./firehose";

dotenv.config();

const agent = new BskyAgent({
  service: "https://bsky.social",
});

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return;
    const ops = await getOpsByType(evt);

    const postsToDelete = ops.posts.deletes.map((del) => del.uri);
    const postsToCreate = ops.posts.creates.map((create) => {
      return {
        uri: create.uri,
        cid: create.cid,
        replyParent: create.record?.reply?.parent.uri ?? null,
        replyRoot: create.record?.reply?.root.uri ?? null,
        indexedAt: new Date().toISOString(),
      };
    });

    if (postsToDelete.length > 0) {
      // Process deletes
    }

    if (postsToCreate.length > 0) {
      for (const post of ops.posts.creates) {
        // This logs the text of every post off the firehose.
        // Just for fun :)
        // Delete before actually using
        console.log(post.record.text);

        // Bot does something every time it sees a post with #hack-bluesky
        if (post.record.text.toLowerCase().includes("#hack-bluesky")) {
          console.log("Processing post!");
        }
      }
    }
  }
}

const main = async () => {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });

  const firehose = new FirehoseSubscription("wss://bsky.network");
  firehose.run(1000);
};

main();
