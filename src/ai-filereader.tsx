const path = require('path');
const fs = require('fs');

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

export {readFiles, checkForNewFiles}
