/*
 * Copyright (c) 2021, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

// This is a temporary bootstrap script till
// top - level await is properly supported
// accross the majority of enviroments.

import { Bot } from ".";

process.on("unhandledRejection", reason => {
    console.log("Unhandled Rejection:", reason);
});

Bot()
    .then(() => {
        console.log("Goodbye");
    })
    .catch(e => {
        console.trace(e);
    });
