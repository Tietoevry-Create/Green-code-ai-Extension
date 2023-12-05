import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { CloseVectorWeb } from 'langchain/vectorstores/closevector/web';
import { CloseVectorNode } from "langchain/vectorstores/closevector/node";

export class VectorStore {
    private _doc: Document<Record<string, any>>[];
    private _question: string;
    private _apiKey: string;
    private _k = 7;
    private _azureOpenAIApiEmbeddingsDeploymentName = "deployment-04";
    private _azureOpenAIApiDeploymentName = "deployment-02";
    private _azureOpenAIApiInstanceName = "green-code-advisor";
    private _azureOpenAIApiVersion = "2023-07-01-preview";
    private _azureOpenAIBasePath = "https://green-code-advisor.openai.azure.com/openai/deployments";
    private _modelName = "text-embedding-ada-002";

    constructor(document: Document<Record<string, any>>[], question: string, apiKey: string) {
        this._doc = document;
        this._question = question;
        this._apiKey = apiKey;
    }

    public async generate(): Promise<string> {
        // If you want to import the browser version, use the following line instead:
        // const vectorStore = await CloseVectorWeb.fromTexts(
        const openaiEmbeddings = new OpenAIEmbeddings({
            azureOpenAIApiEmbeddingsDeploymentName: this._azureOpenAIApiEmbeddingsDeploymentName,
            azureOpenAIApiDeploymentName: this._azureOpenAIApiDeploymentName,
            azureOpenAIApiInstanceName: this._azureOpenAIApiInstanceName,
            azureOpenAIApiKey: this._apiKey,
            azureOpenAIApiVersion: this._azureOpenAIApiVersion,
            azureOpenAIBasePath: this._azureOpenAIBasePath,
            modelName: this._modelName
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