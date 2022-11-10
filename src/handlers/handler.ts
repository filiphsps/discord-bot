/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Client } from "discord.js";

export default abstract class Handler {
    abstract initialize({ client }: { client: Client }): Promise<void>;
}
