import * as vscode from 'vscode';
// import { TextLoader } from "langchain/document_loaders/fs/text";
import { TextLoader } from './text-loader';
import { Hashmap } from './hashmap';
import { VectorStore } from './vector-store';
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from "openai";
import path from 'path';


export class AIIntegration {
    private _embeddingsDepoName: string;
    private _apiVersion: string;
    private _completionsDepoName: string;
    private _baseUrl: string;
    private _apiKey: string;
    private _context?: vscode.ExtensionContext;

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
        
        const contextFilePath = path.join(__dirname, '..', 'context.txt');

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
        const temperature = 0.5;

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 25,
        })

        const rawDocs = await loadData(contextFilePath);
        const docs = await textSplitter.splitDocuments(rawDocs);

        async function loadData(file:any) {
            const loader = new TextLoader(file);
            const rawDocs = await loader.load();
            return rawDocs;
        }

        const question = 'How can I make the following code more sustainable and energy-efficient?:\n' + code + 
        '\nInclude the most important points as a pointer list. Make the feedback specific to the code snippet. Keep general feedback to a minimum.';
        const vectorStore = new VectorStore(docs, question, this._embeddingsDepoName, this._apiVersion, this._apiKey, this._baseUrl);
        const relevantContext = vectorStore.generate();
        
        const content = `Fulfill requests based on the given context. Write your answer as a list of pointers. 
        Do not write any text that is not part of a pointer.
        
        ${relevantContext}
        `;
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

