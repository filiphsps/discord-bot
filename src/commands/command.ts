/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandData,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    SelectMenuInteraction,
} from "discord.js";

import { Either } from "../util/either";

export default abstract class Command {
    /** Execute the command. */
    abstract handleCommand(interaction: ChatInputCommandInteraction): Promise<Either<Error, void>>;

    handleContextMenu?(interaction: ContextMenuCommandInteraction): Promise<Either<Error, void>>;

    handleSelectMenu?(interaction: SelectMenuInteraction): Promise<Either<Error, void>>;

    handleButton?(interaction: ButtonInteraction): Promise<Either<Error, void>>;

    abstract data(): ApplicationCommandData[];

    buttonData?(): Array<string>;
}
