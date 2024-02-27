// © Tietotevry Corporation (2024)

import CryptoJS from "crypto-js";

export class Hashmap {
  private input = "";

  constructor(input: string) {
    this.input = input;
  }

  public stringHash(): string {
    const hash = CryptoJS.SHA256(this.input);
    return hash.toString(CryptoJS.enc.Hex);
  }
}
