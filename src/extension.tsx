
const vscode = require('vscode');
const axios = require('axios');
const openai = require('openai');
const fs = require('fs');
const env = require('dotenv').config()
const path = require('path');

const sessionContext = {
  questions: [],
  answers: [] 
};




// Set your OpenAI API key
const openaiApiKey = process.env["OPENAI-API-KEY"];

// Set the OpenAI API key
openai.apiKey = openaiApiKey;

// const filepath = "../context.txt";

// fs.accessSync(filepath)
// console.log('hei')

const folderpath = path.join(__dirname, '..', 'activities');
const contextFilePath = path.join(__dirname, '..', 'context.txt');

if (fs.existsSync(folderpath)) {
  console.log('File exists')
}
else {
  console.log('does not exist')
};

function readFiles() {
  try {
    let context = "";
    let filenames = "";

    const files = fs.readdirSync(folderpath);

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
  }
}



function capitalizeFirstLetter(input:string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}


function generatePrompt(question: string, context: string) {
  

  const capitalizedContext = capitalizeFirstLetter(context);
  const capitalizedQuestion = capitalizeFirstLetter(question);

  return `Fulfill the following request based on the given context:

  "${capitalizedContext}"
  
  ${capitalizedQuestion}`
}

vscode.commands.registerCommand('greenCoding.start', async () => {
  while (true) {
    const question = await vscode.window.showInputBox({ prompt: 'Ask a question' });
    if (question) { 
      if (!question) {
        break; // If the user cancels the input box, exit the loop
      }
      if (question.toLowerCase() === 'exit') {
        break; // If the user types "exit," exit the loop
      }   
      try {
        const context = fs.readFileSync(contextFilePath, 'utf8'); 
        const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions', {
            prompt: generatePrompt(question, context), 
            max_tokens: 100,
            temperature: 0.6
        }, {
            headers: {
                'Authorization': `Bearer ${process.env["OPENAI-API-KEY"]}`
            }
        });
  
        const answer = response.data.choices[0].text;
        vscode.window.showInformationMessage(`Answer: ${answer}`);
      } catch (error: any) {
        console.error('Error:', error.message); // Improve the error message
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
    }
  });
  