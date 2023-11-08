const path = require('path');
const fs = require('fs');

export class FileManager {
  private folderpath: string;
  private contextFilePath: string;
  private documents: Document[] = [];
  
  constructor() {
    this.folderpath = path.join(__dirname, '..', 'activities');
    this.contextFilePath = path.join(__dirname, '..', 'context.txt');
  }

  getDocuments(): Document[] {
    return this.documents;
}

  readFiles() {
    try {
      let context = '';
      let filenames = '';

      const files = fs.readdirSync(this.folderpath);

      for (const filename of files) {
        const filepath = path.join(this.folderpath, filename);
        if (fs.statSync(filepath).isFile()) {
          const fileContent = fs.readFileSync(filepath, 'utf8');
          context += '\n' + fileContent;

          if (filenames) {
            filenames += ',';
          }
          filenames += filename;
        }
      }

      fs.writeFileSync(this.contextFilePath, filenames);
      fs.appendFileSync(this.contextFilePath, context);
    } catch (error) {
      console.log('Error:', error);
    }
  }

  checkForNewFiles() {
    if (fs.existsSync(this.contextFilePath)) {
      const existingFileContent = fs.readFileSync(this.contextFilePath, 'utf8');
      const existingFileName = existingFileContent.split(',');

      const files = fs.readdirSync(this.folderpath);

      for (const filename of files) {
        const filepath = path.join(this.folderpath, filename);
        if (fs.statSync(filepath).isFile() && !existingFileName.includes(filename)) {
          console.log('New file found:', filename);
        }
      }
    } else {
      console.log('File does not exist:', this.contextFilePath);
    }
  }
}
