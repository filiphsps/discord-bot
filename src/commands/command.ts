/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    ButtonInteraction,
    CommandInteraction,
    ContextMenuInteraction,
    SelectMenuInteraction,
} from "discord.js";

import type { Handlers } from "..";

export default abstract class Command {
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    initialize(_handlers: Handlers): Promise<void> | void {}

    /** Execute the command. */
    abstract handleCommand(interaction: CommandInteraction): Promise<void>;

    handleContextMenu?(interaction: ContextMenuInteraction): Promise<void>;

    handleSelectMenu?(interaction: SelectMenuInteraction): Promise<void>;

    handleButton?(interaction: ButtonInteraction): Promise<void>;

    abstract data(): ApplicationCommandData | ApplicationCommandData[];

    buttonData?(): Array<string>;
}
