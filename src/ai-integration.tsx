import * as vscode from 'vscode';
import { Hashmap } from './hashmap';
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import OpenAI from "openai";
import path from 'path';
import * as fs from 'fs';


export class AIIntegration {
    private _embeddingsDepoName: string;
    private _apiVersion: string;
    private _completionsDepoName: string;
    private _baseUrl: string;
    private _apiKey: string;
    private _context?: vscode.ExtensionContext;
    private _contextFileName = 'context.txt';

    constructor(embeddingsDepoName: string, apiVersion: string, completionsDepoName: string, baseUrl: string, apiKey: string,
         context: vscode.ExtensionContext | undefined) {
        this._baseUrl = baseUrl;
        this._apiKey = apiKey;
        this._context = context;
        this._embeddingsDepoName = embeddingsDepoName;
        this._apiVersion = apiVersion;
        this._completionsDepoName = completionsDepoName;
    }

    public async sendToAIForAnalysis(code: string, regen:boolean): Promise<string> {
        
        const contextFilePath = path.join(__dirname, '..', this._contextFileName);
        const temperature = 0.1;

        let azureClient = undefined;
        let client = undefined;
        let deployment = "";
        if (this._baseUrl) {
            azureClient = new OpenAIClient(
                this._baseUrl,
                new AzureKeyCredential(this._apiKey)
            );
            deployment = this._completionsDepoName;
        }
        else {
            client = new OpenAI({apiKey: this._apiKey});
        }

        const rawDocs = fs.readFileSync(contextFilePath);

        let question = '';
        if (code.length < 50) {
            return "Please provide a larger code snippet.";
        }
        else if (code.length > 5000) {
            return "Code snippet is too large. Please provide a smaller snippet.";
        }

        let pointerNumber = 5;
        if (code.length > 3000) {
            pointerNumber = 10;
        }
        else if (code.length < 500) {
            pointerNumber = 3;
        }

        question = 'How can I make the following code more sustainable and energy-efficient?:\n' + code;
        
        const content = `Fulfill requests based on the given context. Write your answer as a list of pointers. 
        Do not write any text that is not part of a pointer. Include the most important points as a pointer list. Make the feedback specific to the code snippet. 
        Keep general feedback to a minimum. Keep the number of pointers to ${pointerNumber} or less.
        
        ${rawDocs}
        `;
        console.log(content);
        const messages = [
            {
                "role": "system", "content": content
            },
            {
                "role": "user", "content": question
            },        
        ];
        
        let answer;
        let questionHash = '';

        if (!this._context) {
            console.log("Failed to access context. Your responses will not be saved.")
            let response = undefined;
            if (this._baseUrl) {
                response = await azureClient?.getChatCompletions(deployment, messages, {temperature});
            }
            else {
                response = await client?.chat.completions.create({
                    messages: [
                        {
                            "role": "system", "content": content
                        },
                        {
                            "role": "user", "content": question
                        },
                      ],
                    model: "gpt-3.5-turbo"
                })
            }

            if (response && response.choices) {
                const choices = response.choices;
                if (choices.length > 0) {
                    answer = choices[0]?.message?.content;
                
                    if (answer) {
                        return answer;
                    } else {
                        console.log('Not a valid answer');
                        return 'Error retrieving the answer.';
                    }
                } else {
                    console.log('No choices found in the response');
                    return 'Error retrieving the answer.';
                }
            } else {
                console.log('Invalid response');
                return 'Invalid response';
            }
        }

        questionHash = new Hashmap(question).stringHash();
        const storedData = this._context?.globalState.get<string>(questionHash.toString());

        if (storedData && !regen) {
            console.log("Fetching saved response...");
            return storedData;
        }

        console.log("Requesting new response...");
        let response = undefined;
        if (this._baseUrl) {
            response = await azureClient?.getChatCompletions(deployment, messages, {temperature});
        }
        else {
            response = await client?.chat.completions.create({
                messages: [
                    {
                        "role": "system", "content": content
                    },
                    {
                        "role": "user", "content": question
                    },
                  ],
                model: "gpt-3.5-turbo"
            })
        }
        
        if (response && response.choices) {
            const choices = response.choices;
            if (choices.length > 0) {
                answer = choices[0]?.message?.content;
            
                if (!answer) {
                    console.log('Not a valid answer');
                    return 'Error retrieving the answer.';
                }
            } else {
                console.log('No choices found in the response');
                return 'Error retrieving the answer.';
            }
        } else {
            console.log('Invalid response');
            return 'Invalid response';
        } 

        this._context?.globalState.update(questionHash.toString(), answer);
        return answer;
     }
}

