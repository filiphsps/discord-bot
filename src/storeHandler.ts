/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import Store from "./stores/store";
import { Stores } from "./stores";

export default class StoreHandler {
    private readonly stores: Map<typeof Store, Store>;

    constructor() {
        this.stores = new Map(
            Stores.map(Store => {
                return [Store, new Store()];
            })
        );
    }

    public async initialize() {
        for (const [, store] of this.stores) {
            await store.initialize();
        }
    }

    public get<T extends new () => Store>(key: T): InstanceType<T> {
        if (!this.stores.has(key)) throw Error("Invalid store");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.stores.get(key)! as InstanceType<T>;
    }
}
