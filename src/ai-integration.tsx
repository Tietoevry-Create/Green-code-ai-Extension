import * as vscode from 'vscode';
// import { TextLoader } from "langchain/document_loaders/fs/text";
import { TextLoader } from './text-loader';
import { Hashmap } from './hashmap';
import { VectorStore } from './vector-store';
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const path = require('path');


export class AIIntegration {
    private _apiKey: string;
    private _context?: vscode.ExtensionContext;

    constructor(apiKey: string, context: vscode.ExtensionContext | undefined) {
        this._apiKey = apiKey;
        this._context = context;
    }

    public async sendToAIForAnalysis(code: string, regen:boolean): Promise<string> {
        
        const contextFilePath = path.join(__dirname, '..', 'context.txt');

        const client = new OpenAIClient(
            "https://green-code-advisor.openai.azure.com/",
            new AzureKeyCredential(this._apiKey)
        );
        const deployment = "deployment-02";
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

        const question = 'How can I make the following code more sustainable and energy-efficient?:' + code + '. Include the most important points as a pointer list. Make the feedback specific to the codesnippet.';
        const vectorStore = new VectorStore(docs, question, this._apiKey);
        const relevantContext = vectorStore.generate();
        
        const messages = [
            {
                "role": "system", "content": `Fulfill the following request based on the given context:
                Make it as a list of pointers. Do not write any text that is not within the pointers.
                ${relevantContext}
                `
            },
            {
                "role": "user", "content": question
            },
        ];
        
        let answer;
        let questionHash = '';

        if (!this._context) {
            console.log("Failed to access context. Your responses will not be saved.")
            const response = await client.getChatCompletions(deployment, messages, {temperature});

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
        const response = await client.getChatCompletions(deployment, messages, {temperature});
        
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

