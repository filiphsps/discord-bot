/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import githubAPI from "../apis/githubAPI";
import openaiAPI from "../apis/openaiAPI";
import Command from "./command";

export class SummarizeCommand extends Command {
    override data() {
        return [
            new SlashCommandBuilder()
                .setName("summarize")
                .setDescription("Explain a specific commit")
                .addStringOption(query =>
                    query
                        .setName("query")
                        .setDescription(
                            "The commit hash or a GitHub link to a range of selected code"
                        )
                        .setMinLength(7)
                        .setRequired(true)
                )
                .addStringOption(repo =>
                    repo
                        .setName("repo")
                        .setDescription("A repository (SerenityOS/serenity)")
                        .setRequired(false)
                )
                .addStringOption(branch =>
                    branch
                        .setName("branch")
                        .setDescription("The branch (not available when using a commit hash)")
                        .setRequired(false)
                )
                .toJSON(),
        ];
    }

    override async handleCommand(interaction: ChatInputCommandInteraction): Promise<void | any> {
        if (!interaction.isCommand()) return;

        const startTime = Date.now();

        await interaction.deferReply({ ephemeral: false });

        const query = interaction.options.getString("query", true) || "";
        if (!query) return await interaction.editReply({ content: "Invalid query!" });

        const repo = interaction.options.getString("repo", false) || "SerenityOS/serenity";
        const branch = interaction.options.getString("branch", false) || "master";

        const location = {
            owner: repo.split("/")[0],
            name: repo.split("/")[1],
            branch: branch,
        };

        let gptData!: { result: string; tokens: number }, title!: string, url!: string;
        if (query.includes("https://")) {
            const range = query.includes("#")
                ? ((query.split("#")?.at(-1) || "")
                      .replaceAll("L", "")
                      .split("-")
                      .map(i => Number.parseInt(i)) as [number, number])
                : null;
            // TODO(maybe): allow other branches?
            const path = query
                .replace(`https://github.com/${repo}/blob/${branch}`, "")
                .split("#")[0]
                .split("/")
                .slice(1)
                .join("/");

            title = `${path} \`${range && range.join("-")}\``;
            url = query;

            const body = (await githubAPI.fetchSerenityFile(path, location))
                .split("\n")
                .map((l, i) => `${i + 1}. ${l}`);

            let file = body.join("\n");
            if (file.length > 10 * 1000 && range) {
                const contextPadding = 85;
                const start = range[0] - contextPadding > 0 ? range[0] - contextPadding : 0;
                const end =
                    range[1] + contextPadding < body.length
                        ? range[1] + contextPadding
                        : body.length;

                file = body.slice(start, end).join("\n");
            } else if (file.length > 10 * 1000) {
                file = file.substring(0, 10 * 1000);
            }

            gptData = await openaiAPI.explainSelectedCode(file, range, path, location);
        } else {
            const commit = await githubAPI.getCommit(query.substring(0, 7), location);
            if (!commit) return await interaction.editReply({ content: "Invalid commit hash!" });

            let patch = "";
            let commitMessage = "";
            try {
                patch = await (
                    await fetch(`https://github.com/${repo}/commit/${commit.sha}.patch`)
                ).text();
            } catch {
                patch = (commit.files?.map(i => i.patch) || []).join("\n");

                // Only set this here as it's included in the patch file.
                commitMessage = commit.commit.message;
            }

            if (patch.length > 20 * 1000)
                throw new Error(
                    "Commit is a bit too big to process right now, sorry about that :("
                ); // FIXME: figure out how to handle this.

            title = `${commit.commit.message.split("\n")[0]} \`#${commit.sha.substring(0, 7)}\``;
            url = commit.html_url;

            gptData = await openaiAPI.explainPatch(
                commitMessage,
                patch.substring(0, 10 * 1000),
                location
            );
        }
        if (!gptData) throw new Error("Failed to get data from ChatGPT");

        const card = new EmbedBuilder()
            .setTitle(`${title} - Summarization by ChatGPT`)
            .setURL(url)
            .setDescription(gptData.result)
            .setFooter({
                text: `took ${Date.now() - startTime}ms, ${gptData.tokens}/4096 used tokens`,
                iconURL: "https://github.com/SerenityOS.png",
            });

        await interaction.editReply({
            embeds: [card],
        });
        return;
    }
}
