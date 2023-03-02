/*
 * Copyright (c) 2022, Filiph Sandström <filiph.sandstrom@filfatstudios.com>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { OPENAI_TOKEN } from "../config/secrets";
import { Configuration, OpenAIApi } from "openai";
import { Repository } from "./githubAPI";

class OpenAIAPI {
    private readonly openai: OpenAIApi;
    public rules = `All of this is for an open source,
x86, Unix-like modern technology operating system with a 90s UI look called SerenityOS built in C++.
SerenityOS is completely dependency free so never suggest a library or dependency.

You must ALWAYS end the response with a complete sentence, never under any circumstance mid-sentence.
You must keep your responses to at least 600 characters, preferably more but never more than 4096 characters.
You must break your response into easy to digest blocks of text using proper line breaks.
You must use markdown code formatting especially for variables and code blocks (\`variable\`/\`\`\`code\`\`\`) also include syntax highlighting.
You must always specify the code's line number when talking about specific section of code.
You must ALWAYS link to files you mention in the response.

Do not mention that the name of the operating system is called SerenityOS,
the people who will use you are already aware of such details.`;

    constructor() {
        this.openai = new OpenAIApi(
            new Configuration({
                apiKey: OPENAI_TOKEN,
            })
        );
    }

    async explainPatch(commit: string, patch: string, repo: Repository) {
        try {
            const setup = `You're a code summarizer and explainer bot.
Your job is to summarize, explain bug fixes and feature implementations,
at a level an average to advanced programmer would understand based on one git commit.
${this.rules}

The GitHub repository for the project is located at https://github.com/${repo.owner}/${repo.name}/,
the current branch is "${repo.branch}" and the commit is "${commit}".

The next message is the commit message used for the code change,
Afterwards all of the following messages are just simply the code in the commit to be analyzed, summarized and explained:
            `;

            const completion = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "user", content: setup },
                    commit ? { role: "user", content: commit } : null,
                    { role: "user", content: patch },
                    // TODO: If there are some tokens left over include the full source file here
                ].filter(i => i) as any,
            });

            return {
                result: completion.data.choices[0].message?.content || "",
                tokens: completion.data.usage?.prompt_tokens || 0,
            };
        } catch (e) {
            const error = e as any;
            if (error.response) {
                console.error(error.response.status);
                console.error(error.response.data);
            } else {
                console.error(error.message);
            }

            throw e;
        }
    }

    async explainSelectedCode(
        file: string,
        range: [number, number] | null,
        path: string,
        repo: Repository
    ) {
        try {
            const setup = `You're a code summarizer and explainer bot.
Your job is to fully explain what the lines of code ${
                range ? `from line ${range[0]} to ${range[1]}` : "in the file"
            } does,
at a level an average to advanced programmer would understand from one source file that has been stripped.
${this.rules}

The GitHub repository for the project is located at https://github.com/${repo.owner}/${
                repo.name
            }/, and the current branch is "${repo.branch}".

The path and name of the file is "${path}". Do not mention this in your response.
From here on out all messages is the code/source file to be analyzed:`;

            // TODO: try https://platform.openai.com/docs/api-reference/files/upload
            const completion = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "user", content: setup },
                    { role: "user", content: file },
                ],
            });

            return {
                result: completion.data.choices[0].message?.content || "",
                tokens: completion.data.usage?.prompt_tokens || 0,
            };
        } catch (e) {
            const error = e as any;
            if (error.response) {
                console.error(error.response.status);
                console.error(error.response.data);
            } else {
                console.error(error.message);
            }

            throw e;
        }
    }
}

const api = new OpenAIAPI();
export default api;
