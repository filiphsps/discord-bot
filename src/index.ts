/*
 * Copyright (c) 2021, the SerenityOS developers.
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Buggie } from "./buggie";

process.on("unhandledRejection", reason => {
    console.log("Unhandled Rejection:", reason);
});

const buggie = new Buggie();

process.on("SIGINT", () => {
    buggie.stop();
    process.exit(0);
});

buggie.initialize().then(() => buggie.start());
