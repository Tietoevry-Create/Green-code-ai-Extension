// ai-integration.ts
import * as vscode from 'vscode';
import { RetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAI } from 'langchain/llms/openai';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const path = require('path');


export class AIIntegration {
    private apiKey: string;
    

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        
    }

    public async sendToAIForAnalysis(code: string): Promise<string> {
        
        const contextFilePath = path.join(__dirname, '..', 'context.txt');

        const llm = new OpenAI({
            temperature: 0.9,
            azureOpenAIApiKey: this.apiKey,
            azureOpenAIApiVersion: "2023-07-01-preview",
            azureOpenAIApiInstanceName: "gpt-35-turbo-instruct",
            azureOpenAIApiDeploymentName: "deployment-01",
            azureOpenAIBasePath: "https://green-code-advisor.openai.azure.com/openai/deployments"
        })
        
        const embeddings = new OpenAIEmbeddings({
            azureOpenAIApiDeploymentName: 'deployment-04',
            azureOpenAIApiVersion: '2022-12-01',
            azureOpenAIApiKey: this.apiKey,
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
        return await qaDocument(question, vectorStore);
     }   
}

