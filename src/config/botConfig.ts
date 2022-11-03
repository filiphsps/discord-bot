/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

export type BotConfig = {
    production: boolean;
    excludedRepositories: string[];
};

const config: BotConfig = {
    production: process.env.NODE_ENV === "production",
    excludedRepositories: ["serenity-fuzz-corpora", "user-map"],
};

export default config;
