
import * as vscode from 'vscode';

const fs = require('fs');
const env = require('dotenv').config()
const path = require('path');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const markedCodeSnippets: Map<vscode.TextEditor, vscode.Range[]> = new Map();
const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 255, 0, 0.5)',
});

const key = process.env["OPENAI-API-KEY"];
const conversationHistory: any[] = [];
const folderpath = path.join(__dirname, '..', 'activities');
const contextFilePath = path.join(__dirname, '..', 'context.txt');


function readFiles() {
  try {
    let context = "";
    let filenames = "";

    //Add all files in folderpath to variable
    const files = fs.readdirSync(folderpath);


    //Loop through all the files and add to context file
    for (const filename of files) {
      const filepath = path.join(folderpath, filename);
      if (fs.statSync(filepath).isFile()) {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        console.log('Read file:', filepath);
        context += '\n' + fileContent;

        if (filenames) {
          filenames += ',';
        }
        filenames += filename;
      }
    }
    fs.writeFileSync(contextFilePath, filenames);
    fs.appendFileSync(contextFilePath, context);
    } catch (error) {
      console.log('Error: ', error);
    }
  }

function checkForNewFiles() {
  if (fs.existsSync(contextFilePath)) {
    console.log('File Exists: ', contextFilePath);
    const existingFileContent = fs.readFileSync(contextFilePath, 'utf8');
    const existingFileName = existingFileContent.split(',');

    const files = fs.readdirSync(folderpath);

    for (const filename of files) {
      const filepath = path.join(folderpath, filename);
      if (fs.statSync(filepath).isFile() && !existingFileName.includes(filename)) {
        console.log('New file found: ', filename);
      }
    }
  }
  else {
    console.log('File does not exist: ', contextFilePath);
  };
}


// Mark code snippets to be processed.
const markCodeSnippet = (editor: vscode.TextEditor) => {
  const selection = editor.selection;

  const range = new vscode.Range(selection.start, selection.end);

  editor.setDecorations(decorationType, [range]);

  if (editor) {
    if (markedCodeSnippets.has(editor)) {
        markedCodeSnippets.get(editor)!.push(range);
    } else {
        markedCodeSnippets.set(editor, [range]);
    }
}

};


vscode.window.onDidChangeTextEditorSelection((e) => {
  const editor = e.textEditor;
  if (editor) {
      const markedRanges = markedCodeSnippets.get(editor);
      if (markedRanges) {
          const selection = editor.selection;

          // Check if the selection intersects with any marked range
          const intersectsMarkedRange = markedRanges.some((range) =>
              range.contains(selection.start) || range.contains(selection.end)
          );

          if (!intersectsMarkedRange) {
              // Remove the decoration and clear the data about the marked code
              editor.setDecorations(decorationType, []);
                markedCodeSnippets.delete(editor);
          }
      }
  }
});


function generatePrompt(question:string, context:string, conversationHistory: any[]) {

  let message = conversationHistory.map(message => {
      return `${message.role}: ${message.content}`
  });

  
  message.push(`User: ${question}`);

  const fullPrompt = message.join('\n');

  return `Fulfill the following request based on the given context:
  Do not complete the code snippets that you are given.
   "${context}"
  
   ${fullPrompt}`;
}

async function sendToAIForAnalysis(code: any) {
  readFiles();
  checkForNewFiles();

  const question = 'How can I make the following code more sustainable and energy-efficient?: ' + code;
  const context = fs.readFileSync(contextFilePath, 'utf8'); 


  if (key) {
    const client = new OpenAIClient(
      "https://green-code-advisor.openai.azure.com/", 
      new AzureKeyCredential(key)
    );

    
    const response = await client.getCompletions("deployment-01", [generatePrompt(question, context, conversationHistory)], {
      max_tokens:500, temperature: 0.6, stop:null});

    const answer = response.choices[0].text;
    const timestamp = new Date().toISOString();
    
    conversationHistory.push({ role: "user", content: question, timestamp });
    conversationHistory.push({ role: "code reviewer", content: answer, timestamp });

    console.log(conversationHistory);

    vscode.window.showInformationMessage(`AI Response: ${answer}`);
    }
};

function AIActivate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('greenCoding.start', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      markCodeSnippet(editor);
      const markedRanges = markedCodeSnippets.get(editor);
      if (markedRanges) {
        markedRanges.forEach((range) => {
          const markedCode = editor.document.getText(range);
          sendToAIForAnalysis(markedCode);
        });
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function activate(context: vscode.ExtensionContext) {
  AIActivate(context);
}

// const conversationHistory: any[] = [];

// function capitalizeFirstLetter(input:string) {
//   return input.charAt(0).toUpperCase() + input.slice(1);
// }


// function generatePrompt(question: string, context: string, conversationHistory: any[]) {
  

//   const capitalizedContext = capitalizeFirstLetter(context);
//   const capitalizedQuestion = capitalizeFirstLetter(question);

//   const messages = conversationHistory.map(message => {
//     return `${message.role}: ${message.content}`;
//   });

//   // Add the user's current question
//   messages.push(`User: ${capitalizedQuestion}`);

//   // Join all the messages into a single string
//   const fullPrompt = messages.join('\n');

//   return `Fulfill the following request based on the given context:

//   "${capitalizedContext}"
  
//   ${fullPrompt}`;
// }

// vscode.commands.registerCommand('greenCoding.start', async () => {
//   while (true) {
//     const question = await vscode.window.showInputBox({ prompt: 'Ask a question' });
//     if (question) { 
//       if (!question) {
//         break; // If the user cancels the input box, exit the loop
//       }
//       if (question.toLowerCase() === 'exit') {
//         break; // If the user types "exit," exit the loop
//       }   
//       try {
//         const context = fs.readFileSync(contextFilePath, 'utf8'); 
//         const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions', {
//             prompt: generatePrompt(question, context, conversationHistory), 
//             max_tokens: 100,
//             temperature: 0.6
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env["OPENAI-API-KEY"]}`
//             }
//         });
  
//         const answer = response.data.choices[0].text;
        
//         const timestamp = new Date().toISOString();

//         conversationHistory.push({ role: "user", content: question, timestamp });
//         conversationHistory.push({ role: "assistant", content: answer, timestamp });

//         console.log(conversationHistory)

//         vscode.window.showInformationMessage(`Answer: ${answer}`);

//       } catch (error: any) {
//         console.error('Error:', error.message); // Improve the error message
//         vscode.window.showErrorMessage(`Error: ${error.message}`);
//       }
//     }
//     }
//   });
  