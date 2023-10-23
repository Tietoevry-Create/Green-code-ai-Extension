// ai-integration.ts
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
const fs = require('fs');
const path = require('path');
import * as vscode from 'vscode';
import { readFiles, checkForNewFiles } from  "./CheckFiles";





export class AIIntegration {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async sendToAIForAnalysis(code: string) {
        readFiles();
        checkForNewFiles();

        const conversationHistory: any[] = [];
        const contextFilePath = path.join(__dirname, '..', 'context.txt');

        // Implement the AI request and response handling here
        try {
            const question = 'How can I make the following code more sustainable and energy-efficient?: ' + code;
            const context = fs.readFileSync(contextFilePath, 'utf8');
        
            const client = new OpenAIClient(
                "https://green-code-advisor.openai.azure.com/",
                new AzureKeyCredential(this.apiKey)
            );
        
            const startTime = Date.now();
        
            const response = await client.getChatCompletions("deployment-03", [
                {
                    "role": "system", "content": `Fulfill the following request based on the given context:
                    Make it as a list of pointers. Do not write any text that is not within the pointers.
                    ${context}
                    `
                },
                {
                    "role": "user", "content": question
                },
            ], {
                maxTokens: 500,
                temperature: 0.6,
            });
        
            const endTime = Date.now();
            
            if (response && response.choices) {
                const choices = response.choices;
                if (choices.length > 0) {
                    const answer = choices[0]?.message?.content;
                
                    if (answer) {
                        conversationHistory.push({ role: 'assistant', content: answer });
        
                        const pointsArray = answer.split(". ");
        
                        // Join the points back together with new lines to create a structured response.
                        const structuredAnswer = pointsArray.join("\n");
                        console.log(structuredAnswer);
                        vscode.window.showInformationMessage(`AI Response: ${structuredAnswer}`);
                        const timeTaken = endTime - startTime;
                        console.log(timeTaken / 1000 + " seconds.");
                    } else {
                        console.log('Not a valid answer');
                    }
                } else {
                    console.log('No choices found in the response');
                }
            } else {
                console.log('Response is undefined or does not contain choices');
            }
        } catch (error) {
            // Handle errors here, you can log the error or take appropriate action.
            console.error("An error occurred:", error);
        }
         
    }   
}
