<!-- © Tietotevry Corporation (2024) -->
<script lang="ts">
  import { AESEncryption } from '../../out/aes-encryption';
  import CryptoJS from 'crypto-js';
  
  export let showApiKeyPopup = false;
  export let showApiPasswordPopup = false;
  let apiKey = "";
  let password = "";
  
  function saveApiKey() {
    console.log("Saving API key...");
    var salt = CryptoJS.lib.WordArray.random(128/8);
    console.log("generated salt:", salt);
    localStorage.setItem("openaiApiEncryptionSalt", salt.toString());
    console.log("Salt saved!")
    
    var key256Bits = CryptoJS.PBKDF2(password, salt, { keySize: 256/32 }).toString();
    localStorage.setItem("openaiApiPassword", key256Bits);
    
    var encryptedKey = new AESEncryption(apiKey, key256Bits).encrypt();
    localStorage.setItem("openaiApiKey", encryptedKey);
    
    alert("API Key saved!");
    showApiKeyPopup = false;
  }
  
  function saveApiPassword() {
    var salt = localStorage.getItem("openaiApiEncryptionSalt");
    if (!salt) {
      alert("Salt not found!");
      return;
    }
    var key256Bits = CryptoJS.PBKDF2(password, salt, { keySize: 256/32 });
    localStorage.setItem("openaiApiPassword", key256Bits.toString());
    showApiPasswordPopup = false;
  }
</script>

<style>
  /* Add your styling for the pop-up box here */
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border: 1px solid #ccc;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
</style>

{#if showApiKeyPopup}
<div class="popup">
  <h2>Enter your OpenAI API Key and a password</h2>
  <input type="text" bind:value={apiKey} placeholder="API Key" />
  <input type="password" bind:value={password} placeholder="Password"/>
  <button on:click={saveApiKey}>Save</button>
</div>
{/if}

{#if showApiPasswordPopup}
<div class="popup">
  <h2>Enter your password</h2>
  <input type="password" bind:value={password} placeholder="Password"/>
  <button on:click={saveApiPassword}>Proceed</button>
</div>
{/if}
