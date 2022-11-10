/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client } from "discord.js";
import * as Services from "../services";
import Service from "../services/service";
import Handler from "./handler";

export class ServiceHandler extends Handler {
    private services: Map<string, Service>;

    constructor() {
        super();
        this.services = new Map(
            Object.values(Services).map(service => {
                return [service.name, new service()];
            })
        );
    }

    override async initialize({ client }: { client: Client }) {
        for (const [, handler] of this.services.entries()) {
            await handler.initialize({ client });
        }
    }
}
