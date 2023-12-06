import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { CloseVectorNode } from "langchain/vectorstores/closevector/node";

export class VectorStore {
    private _doc: Document<Record<string, any>>[];
    private _question: string;
    private _apiKey: string;
    private _azureOpenAIApiEmbeddingsDeploymentName: string;
    private _azureOpenAIApiVersion: string;
    private _azureOpenAIBasePath: string;

    private _k = 7;

    constructor(document: Document<Record<string, any>>[], question: string, embeddingsDepoName: string, apiVersion: string, apiKey: string, baseUrl: string) {
        this._doc = document;
        this._question = question;
        this._azureOpenAIApiEmbeddingsDeploymentName = embeddingsDepoName;
        this._azureOpenAIApiVersion = apiVersion;
        this._apiKey = apiKey;
        this._azureOpenAIBasePath = baseUrl.endsWith('/') ? baseUrl + "openai/deployments" : baseUrl + "/openai/deployments";
    }

    public async generate(): Promise<string> {
        // If you want to import the browser version, use the following line instead:
        // const vectorStore = await CloseVectorWeb.fromTexts(
        const openaiEmbeddings = new OpenAIEmbeddings({
            azureOpenAIApiEmbeddingsDeploymentName: this._azureOpenAIApiEmbeddingsDeploymentName,
            azureOpenAIApiKey: this._apiKey,
            azureOpenAIApiVersion: this._azureOpenAIApiVersion,
            azureOpenAIBasePath: this._azureOpenAIBasePath
        });
    
        const vectorStore = await CloseVectorNode.fromDocuments(
            this._doc,
            openaiEmbeddings
        );

        const resultOne = await vectorStore.similaritySearch(this._question, this._k);
        
        const res = resultOne.map((element) => {
            return element.pageContent
        }).join('\n');
        
        return res;
    }
};