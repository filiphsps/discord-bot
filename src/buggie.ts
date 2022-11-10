/*
 * Copyright (c) 2022, the SerenityOS developers.
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import * as Handlers from "./handlers";

import Discord, { ActivityType, Client, Events, GatewayIntentBits, Partials } from "discord.js";

import { DISCORD_TOKEN } from "./config/secrets";
import Handler from "./handlers/handler";

enum BuggieState {
    Stopped,
    Initializing,
    Initialized,
    Starting,
    Running,
    Stopping,
}
export class Buggie {
    private state: BuggieState = BuggieState.Stopped;
    private client!: Client;

    private handlers!: Map<string, Handler>;

    constructor() {
        this.handlers = new Map(
            Object.values(Handlers).map(handler => {
                return [handler.name, new handler()];
            })
        );
    }

    public async initialize() {
        if (this.state !== BuggieState.Stopped)
            throw new Error(`Invalid state: ${BuggieState[this.state]}`);
        this.state = BuggieState.Initializing;

        this.client = new Discord.Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildEmojisAndStickers,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
        });

        for (const [, handler] of this.handlers.entries()) {
            await handler.initialize({ client: this.client });
        }

        this.client.once(Events.ClientReady, () => {
            if (this.client?.user != null) {
                console.log(`Logged in as ${this.client.user.tag}.`);
                this.client.user.setPresence({
                    status: "online",
                    activities: [
                        {
                            type: ActivityType.Playing,
                            name: "Type /help to list commands.",
                        },
                    ],
                });
            }
        });
        this.client.on(Events.Error, e => {
            console.error("Discord client error!", e);
        });

        this.state = BuggieState.Initialized;
    }

    public async start(): Promise<void> {
        if (this.state !== BuggieState.Initialized)
            throw new Error(`Invalid state: ${BuggieState[this.state]}`);

        return new Promise((resolve, reject) => {
            this.client.once(Events.ClientReady, () =>
                this.client?.user != null ? resolve() : reject("")
            );
            this.client.login(DISCORD_TOKEN);
        });
    }

    public async stop() {
        if (this.state !== BuggieState.Running)
            throw new Error(`Invalid state: ${BuggieState[this.state]}`);

        this.client.destroy();
        this.state = BuggieState.Stopped;
    }
}
