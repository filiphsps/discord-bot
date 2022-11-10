/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client, Events } from "discord.js";
import Service from "./service";

export class GithubEmbedService extends Service {
    override async initialize({ client }: { client: Client }) {
        client.on(Events.MessageCreate, async message => {
            if (message.author.bot) return;

            message = await message.fetch();

            for (const embed of message.embeds) {
                if (!embed.url) continue;

                const url = new URL(embed.url);
                if (url.host !== "github.com") continue;

                // eg.: embed.url: "https://github.com/SerenityOS/serenity/blob/master/AK/AllOf.h"
                //      url.pathname: "/SerenityOS/serenity/blob/master/AK/AllOf.h"
                //      segments: ["", "SerenityOS", "serenity", "blob", "master", "AK", "AllOf.h"]
                //      githubUrlType: "blob"
                const segments = url.pathname.split("/");
                const githubUrlType: string | undefined = segments[3];
                if (githubUrlType === "tree" || githubUrlType === "blob") {
                    await message.suppressEmbeds();
                    return;
                }
            }
        });
    }
}
