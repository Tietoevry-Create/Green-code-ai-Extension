import * as fs from 'fs';
import { Document } from 'langchain/document';

export class TextLoader {
    private filePathOrBlob: string | Blob;

    constructor(filePathOrBlob: string | Blob) {
        this.filePathOrBlob = filePathOrBlob;
    }

    async load(): Promise<Document[]> {
        let text;
        let metadata: { source: string; blobType?: string; line?: number };

        if (typeof this.filePathOrBlob === "string") {
            text = await this.readTextFile(this.filePathOrBlob);
            metadata = { source: this.filePathOrBlob };
        } else {
            text = await this.readBlobText(this.filePathOrBlob);
            metadata = { source: "blob", blobType: this.filePathOrBlob.type };
        }

        const parsed = await this.parse(text);

        parsed.forEach((pageContent, i) => {
            if (typeof pageContent !== "string") {
                throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`);
            }
        });

        return parsed.map((pageContent, i) => new Document({
            pageContent,
            metadata: parsed.length === 1
                ? metadata
                : {
                    ...metadata,
                    line: i + 1,
                },
        }));
    }

    private async parse(raw: string): Promise<string[]> {
        // Simplified parsing logic
        return [raw];
    }

    private async readBlobText(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob);
        });
    }
    
    private async readTextFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}
