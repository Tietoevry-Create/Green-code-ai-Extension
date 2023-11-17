// ai-integration.ts
import * as vscode from 'vscode';
import { RetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAI } from 'langchain/llms/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Hashmap } from './hashmap';

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

        const llm = new OpenAI({
            temperature: 0.9,
            azureOpenAIApiKey: this._apiKey,
            azureOpenAIApiVersion: "2023-07-01-preview",
            azureOpenAIApiInstanceName: "gpt-35-turbo-instruct",
            azureOpenAIApiDeploymentName: "deployment-01",
            azureOpenAIBasePath: "https://green-code-advisor.openai.azure.com/openai/deployments"
        })
        
        const embeddings = new OpenAIEmbeddings({
            azureOpenAIApiDeploymentName: 'deployment-04',
            azureOpenAIApiVersion: '2022-12-01',
            azureOpenAIApiKey: this._apiKey,
            azureOpenAIBasePath: "https://green-code-advisor.openai.azure.com/openai/deployments"
        })
        
        
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

        const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
        const startTime = Date.now();

        async function qaDocument(question:any, vectorstores:any): Promise<string> {
            const retriever = vectorstores.asRetriever({ k: 10 });
            const chain = RetrievalQAChain.fromLLM(llm, retriever, {
                returnSourceDocuments: true
            });
            const response = await chain.call({
                query:question,
            });

            const endTime = Date.now();     
            const timeTaken = endTime - startTime;
            console.log(timeTaken/1000 + " seconds.");
            
            vscode.window.showInformationMessage(response.text);
            return response.text;
        }
            
        const question = 'How can I make the following code more sustainable and energy-efficient?:' + code + '. Include the most important points as a pointer list. Make the feedback specific to the codesnippet.';
        
        if (!this._context) {
            console.log("Failed to access context. Your responses will not be saved.")
            return await qaDocument(question, vectorStore);
        }
        
        let questionHash = new Hashmap(question).stringHash();
        const storedData = this._context?.globalState.get<string>(questionHash.toString());

        if (storedData && !regen) {
            return storedData;
        }

        const result = await qaDocument(question, vectorStore);
        this._context?.globalState.update(questionHash.toString(), result);

        return result;
     }
}

