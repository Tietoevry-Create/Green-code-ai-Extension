// © Tietotevry Corporation (2024)

import * as vscode from "vscode";
import { Hashmap } from "./hashmap";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import OpenAI from "openai";
import path from "path";
import * as fs from "fs";

export class AIIntegration {
  private _completionsDepoName: string;
  private _baseUrl: string;
  private _apiKey: string;
  private _context?: vscode.ExtensionContext;
  private _contextFileName = "context.txt";

  constructor(
    completionsDepoName: string,
    baseUrl: string,
    apiKey: string,
    context: vscode.ExtensionContext | undefined
  ) {
    this._baseUrl = baseUrl;
    this._apiKey = apiKey;
    this._context = context;
    this._completionsDepoName = completionsDepoName;
  }

  public async sendToAIForAnalysis(
    code: string,
    startAt: number,
    regen: boolean
  ): Promise<string> {
    const contextFilePath = path.join(__dirname, "..", this._contextFileName);
    const temperature = 0.9;

    let azureClient = undefined;
    let client = undefined;
    let deployment = "";
    if (this._baseUrl) {
      azureClient = new OpenAIClient(
        this._baseUrl,
        new AzureKeyCredential(this._apiKey)
      );
      deployment = this._completionsDepoName;
    } else {
      client = new OpenAI({ apiKey: this._apiKey });
    }

    const rawDocs = fs.readFileSync(contextFilePath);
    const lnCode = this.addLineNumber(code, startAt);

    let question = "";
    if (code.length < 50) {
      return `{
                "pointer1": {
                    "Error":  "Please provide a larger code snippet."
                }
            }`;
    } else if (code.length > 5000) {
      return `{
                "pointer1": {
                    "Error":  "Code snippet is too large. Please provide a smaller snippet."
                }
            }`;
    }

    let jsonObjNo = 5;
    if (code.length > 3000) {
      jsonObjNo = 10;
    } else if (code.length < 500) {
      jsonObjNo = 3;
    }

    question =
      "How can I make the following code more sustainable and energy-efficient?:\n" +
      lnCode;

    const instructions = `Your answer should be specific to one or more lines in the code snippet. Always mention the line number when referring to 
        specific parts of the code. Only give suggestions that you can attach a line number to. Keep pointers varied, detailed and tailored to the given
        code. Provide examples and code suggestions where applicable. Your suggestions should always be directly relevant to a specific variable, method,
        or a similar element in the code. You must always explain how suggestions could be implemented. Start each pointer text differently to give 
        variation to the text, for example, avoid using 'consider' at the start of every pointer. Always write your answer in JSON format. Keep the 
        number of JSON objects to ${jsonObjNo} or less. Make sure none of the JSON keys are the same. Your response must always follow this JSON format:
        
        {
            "pointer1": {
                "{insert title appropriate to pointer text}": "{insert pointer text (not line number)}",
                "Line number": "{insert relevant line number}"
            },
            "pointer2": {
                "{insert title 2}": "{insert pointer item 2}",
                "Line number": "{relevant line number}"
            }
            etc.
        }
        `;

    const context = `Provide feedback on the user's code based on the given context (as well as your general knowledge):
        
        Context: """
        ${rawDocs}
        """`;

    const messages = [
      {
        role: "system",
        content: context,
      },
      {
        role: "user",
        content: instructions,
      },
      {
        role: "user",
        content: question,
      },
    ];

    let answer;
    let questionHash = "";

    if (!this._context) {
      console.log(
        "Failed to access context. Your responses will not be saved."
      );
      let response = undefined;
      if (this._baseUrl) {
        response = await azureClient?.getChatCompletions(deployment, messages, {
          temperature,
        });
      } else {
        response = await client?.chat.completions.create({
          messages: [
            {
              role: "system",
              content: context,
            },
            {
              role: "system",
              content: instructions,
            },
            {
              role: "user",
              content: question,
            },
          ],
          model: "gpt-3.5-turbo-1106",
          response_format: { type: "json_object" },
          temperature,
        });
      }

      if (response && response.choices) {
        const choices = response.choices;
        if (choices.length > 0) {
          answer = choices[0]?.message?.content;

          if (answer) {
            return answer;
          } else {
            console.log("Not a valid answer");
            return "Error retrieving the answer.";
          }
        } else {
          console.log("No choices found in the response");
          return "Error retrieving the answer.";
        }
      } else {
        console.log("Invalid response");
        return "Invalid response";
      }
    }

    const start = Date.now();

    questionHash = new Hashmap(question).stringHash();
    const storedData = this._context?.globalState.get<string>(
      questionHash.toString()
    );

    if (storedData && !regen) {
      console.log("Fetching saved response...");
      return storedData;
    }

    console.log("Requesting new response...");
    let response = undefined;
    if (this._baseUrl) {
      response = await azureClient?.getChatCompletions(deployment, messages, {
        temperature,
      });
    } else {
      response = await client?.chat.completions.create({
        messages: [
          {
            role: "system",
            content: context,
          },
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: question,
          },
        ],
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        temperature,
      });
    }
    let end = Date.now();
    console.log(`${(end - start) / 1000} seconds`);

    if (response && response.choices) {
      const choices = response.choices;
      if (choices.length > 0) {
        answer = choices[0]?.message?.content;

        if (!answer) {
          console.log("Not a valid answer");
          return "Error retrieving the answer.";
        }
      } else {
        console.log("No choices found in the response");
        return "Error retrieving the answer.";
      }
    } else {
      console.log("Invalid response");
      return "Invalid response";
    }

    this._context?.globalState.update(questionHash.toString(), answer);
    return answer;
  }

  private addLineNumber(code: string, startAt: number): string {
    let lnCode: string[] = [];
    let lnCounter = startAt + 1;

    code.split("\n").forEach((line) => {
      lnCode.push(lnCounter + "   " + line);
      lnCounter++;
    });

    return lnCode.join("\n");
  }
}
