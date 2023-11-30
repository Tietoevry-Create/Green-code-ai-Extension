import CryptoJS from 'crypto-js';

function splitEncryptedText( encryptedText: string ) {
    return {
        ivString: encryptedText.slice( 0, 32 ),
        encryptedDataString: encryptedText.slice( 32 ),
    }
}

export class AESEncryption {

    constructor(private text: string, private key: string) { }
    
    private generateRandomIV() {
        // Generate a random IV (Initialization Vector) using CryptoJS
        const randomWords = CryptoJS.lib.WordArray.random(16);
        const iv = CryptoJS.enc.Hex.stringify(randomWords);
        return iv;
    }

    encrypt() {
        try {
            const iv = this.generateRandomIV();
            const textUtf8 = CryptoJS.enc.Utf8.parse(this.text);
            const keyUtf8 = CryptoJS.enc.Utf8.parse(this.key);
            const ivUtf8 = CryptoJS.enc.Utf8.parse(iv);

            const encrypted = CryptoJS.AES.encrypt(textUtf8, keyUtf8, 
                {iv: ivUtf8} );

            return iv + encrypted.toString();
        } catch (e) {
            throw e;
        }
    };

    decrypt() {
        try {
            const { encryptedDataString, ivString } = splitEncryptedText( this.text );
            const keyUtf8 = CryptoJS.enc.Utf8.parse(this.key);
            const ivUtf8 = CryptoJS.enc.Utf8.parse(ivString);

            const decrypted = CryptoJS.AES.decrypt(encryptedDataString, keyUtf8, { iv: ivUtf8 });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error( e );
            return '';
        }
    }
}