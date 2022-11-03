/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import {
    ApplicationCommandOptionData,
    ChatInputApplicationCommandData,
    CommandInteraction,
} from "discord.js";
import githubAPI, { Commit, Repository } from "../apis/githubAPI";
import config from "../config/botConfig";
import Command from "./command";

export class CommitStatsCommand extends Command {
    override data(): ChatInputApplicationCommandData | ChatInputApplicationCommandData[] {
        const description = "Show user's total amount of commits";
        const options: ApplicationCommandOptionData[] = [
            {
                name: "author",
                description: "Username or email of the commit author",
                type: "STRING",
                required: true,
            },
            {
                name: "broadcast",
                type: "BOOLEAN",
                description: "Publicly share the commit statistics",
                required: false,
            },
        ];

        return [
            {
                name: "commit-stats",
                description,
                options,
            },
        ];
    }

    override async handleCommand(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const author = interaction.options.getString("author");
        if (!author) return;

        const broadcast = interaction.options.getBoolean("broadcast") ?? false;
        const isEmail = author.includes("@");

        interface RepoInfo {
            repo: Repository;
            commits: Commit[];
            totalCount?: number;
        }

        await interaction.deferReply({ ephemeral: !broadcast });

        try {
            // TODO: If author isn't an email validate that the GitHub
            //        account actually exists before making all these
            //        expensive API calls.

            const repos = await githubAPI.fetchSerenityRepos();
            const userCommits = (
                (
                    await Promise.all(
                        repos.map(async repo => ({
                            repo,
                            commits: await githubAPI.getCommits(author, 5, repo),
                            totalCount: await githubAPI.getCommitsCount(author, repo),
                        }))
                    )
                ).flat() as Array<RepoInfo>
            )
                .filter(item => !config.excludedRepositories.includes(item.repo.name))
                .sort((a, b) => (b.totalCount ?? 0) - (a.totalCount ?? 0));

            const totalCommits = userCommits.reduce(
                (n, { totalCount }) => (totalCount ?? 0) + n,
                0
            );

            if (totalCommits <= 0) {
                await interaction.editReply({
                    content: `No contributions by ${author} were found :^(`,
                });
                return;
            }

            const withoutActivity: Repository[] = [];
            const formatSection = (item: RepoInfo): string[] | null => {
                const { repo, commits, totalCount } = item;

                if (commits.length <= 0) {
                    withoutActivity.push(repo);
                    return null;
                }
                const { owner, name } = repo;

                const content = [
                    `**[${owner}/${name}](<https://github.com/${owner}/${name}>)** - **${
                        totalCount ?? "unknown"
                    } commits**`,
                ];

                for (let i = 0; i < commits.length; i++) {
                    if (i >= 3) {
                        content.push(
                            `    - [*and more...*](<https://github.com/${owner}/${name}/commits?author=${author}>)`
                        );
                        break;
                    }

                    const { commit, html_url: url, sha } = commits[i];
                    content.push(
                        `    - ${commit.message.split("\n")[0]} ([${sha.slice(0, 7)}](${url})).`
                    );
                }

                return [content.join("\n"), ""];
            };

            const header = `**__${
                isEmail ? author : `[${author}](<https://github.com/${author}>)`
            }__ have landed a total of ${totalCommits} commit${
                totalCommits == 1 ? "" : "s"
            } across the SerenityOS project <:catdog:1037719954214092840>**\n`;

            const content = userCommits.map(formatSection).filter(i => i);
            const footer =
                withoutActivity.length > 0
                    ? `> Repositories without any activity: ${withoutActivity
                          .map(
                              ({ owner, name }) =>
                                  `[${owner}/${name}](<https://github.com/${owner}/${name}>)`
                          )
                          .join(", ")}`
                    : "";

            const blocks = [[header], ...content, [footer]].flat();
            const complete = blocks.join("\n");

            // Discord messages currently have a hard limit
            // on 2000 characters per message. even for bots.
            // The following is to kind of hack around that.
            if (complete.length <= 2000) {
                await interaction.editReply({
                    content: complete,
                });
                return;
            }

            // If we need to split up the content into multiple
            // meesages they'll all have the initial one as the
            // parent. So let's keep it short and to the point.
            await interaction.editReply({
                content: blocks.shift(),
            });

            const messages: string[] = [];
            let message = "";

            // The most stupidly simple way to split up a list
            // of string into max 2000 characters long messages.
            // FIXME: Maybe turn this into a utility function?
            for (let i = 0; i < blocks.length; i++) {
                const line = blocks[i];

                if ((message + line + "\n").length > 2000) {
                    messages.push(message);
                    message = "";
                }

                message += line + "\n";
            }
            if (message != "") messages.push(message);

            for (let i = 0; i < messages.length; i++) {
                const content = messages[i];

                await interaction.followUp({
                    ephemeral: !broadcast,
                    content,
                });
            }
        } catch (e) {
            console.trace(e);
            await interaction.editReply({
                content: `Something went really wrong. Here's the error:\n\`\`\`${
                    (e as Error)?.stack ?? e ?? ""
                }\`\`\``,
            });
        }
    }
}
