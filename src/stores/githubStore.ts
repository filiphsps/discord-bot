/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import type { RepositoryData } from "../apis/githubAPI";
import Store from "./store";
import githubAPI from "../apis/githubAPI";

export class GitHubStore extends Store {
    private repositories!: RepositoryData[];

    override async initialize(): Promise<void> {
        await this.updateRepositories();
    }

    public getRepositories() {
        return this.repositories;
    }
    public async updateRepositories() {
        this.repositories = await githubAPI.fetchSerenityRepos();
    }
}
