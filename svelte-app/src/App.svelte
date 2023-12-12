<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { quintOut } from 'svelte/easing';
    import { Hashmap } from '../../out/hashmap';
    import { AESEncryption } from '../../out/aes-encryption';
    import CryptoJS from 'crypto-js';
  import { isatty } from "tty";
    
    let text = "Highlight a piece of code and press `Get Feedback`!";
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 150;
    let regenResponse = false;
    let errorMessage = '';
    let showError = false;
    let isAzure = false;
    let settingsPanelVisible = false;
    let showApiKeyPopup = false;
    let showApiPasswordPopup = false;
    let passwordRequired = false;
    let value = '';
    let embeddingsDeployment = "";
    let apiVersion = "";
    let completionsDeployment = "";
    let baseUrl = "";
    let apiKey = "";
    let password = "";
    

    onMount(() => {
    // Listen for messages from the extension
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onSelectedText": {
                    text = message.value;
                    textColor = "black";
                    break;
                }
            }
        });
        window.addEventListener("resize", updateMaxDivHeight);
        checkApiKey();
    });

    onDestroy(() => {
        window.removeEventListener("resize", updateMaxDivHeight);
    });

    function clearSavedData() {
        tsvscode.postMessage({ type: "onClearData", value: '' });
        showApiKeyPopup = true;
        showApiPasswordPopup = false;
    }

    function fetchText() {
        tsvscode.postMessage({ type: "onFetchText", value: regenResponse });
        text = "Loading...";
        textColor = "gray";
    }

    function anyEmptyFields() {
        return embeddingsDeployment == '' || apiVersion == '' || completionsDeployment == '' || baseUrl == '';
    }

    function saveApiKey() {
        try {
            if ((isAzure && (!baseUrl || !embeddingsDeployment || !apiVersion || !completionsDeployment)) || !apiKey) {
            errorMessage = `Fill in all fields!`;
            showError = true;
            return;
            }

            passwordRequired = password ? true : false;

            var salt = CryptoJS.lib.WordArray.random(128/8);
            var passwordHash = new Hashmap(password).stringHash();
            var key256Bits = CryptoJS.PBKDF2(password, salt, { keySize: 256/32 }).toString();
            var encryptedKey = new AESEncryption(apiKey, key256Bits).encrypt();

            tsvscode.postMessage({ type: "onRegister", value: {
            azureOpenaiEmbeddingsDeploymentName: embeddingsDeployment,
            openaiApiVersion: apiVersion,
            azureOpenaiCompletionsDeploymentName: completionsDeployment,
            azureOpenaiBaseUrl: baseUrl,
            openaiApiEncryptionSalt: salt,
            openaiApiPassword: password,
            openaiApiPasswordHash: passwordHash,
            openaiApiKey: encryptedKey
            } });
            
            errorMessage = 'API Key saved!';
            showError = true;
            [showApiKeyPopup, showApiPasswordPopup] = [false, false];
        } catch (error) {
            errorMessage = `Error saving API key: ${error}`;
            showError = true;
        }
    }

    function updateMaxDivHeight() {
        maxDivHeight = window.innerHeight - 150;
    }

    function checkApiKey() {
        tsvscode.postMessage({type: "onCheckApiKey", value: ''});
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onApiKeyExists": {
                    showApiPasswordPopup = true;
                    break;
                }
                case "onApiKeyNotFound": {
                    showApiKeyPopup = true;
                    break;
                }
            }
        });
    }

    function showSettingsPanel() {
        settingsPanelVisible = true;
    }

    function hideSettingsPanel() {
        settingsPanelVisible = false;
    }

    function toggleApiKeyPopup() {
        try {
            errorMessage = `showApiKeyPopup: ${showApiKeyPopup}
            showApiPasswordPopup: ${showApiPasswordPopup}`;
            showError = true;
            if (!showApiKeyPopup && anyEmptyFields()) {
                tsvscode.postMessage({type: "onFetchSavedData", value: ''});
                errorMessage = "Fetching Saved data...";
                showError = true;

                window.addEventListener("message", (event) => {
                    const message = event.data;
                    switch (message.type) {
                        case "onDataFetched": {
                            [embeddingsDeployment, apiVersion, completionsDeployment, baseUrl, password] = message.value;
                            if (embeddingsDeployment || apiVersion || completionsDeployment || baseUrl) {
                                isAzure = true;
                            }
                            passwordRequired = password ? true : false;
                            password = '';
                            break;
                        }
                    }
                });
                showApiKeyPopup = true;
            } else {
                showApiKeyPopup = !showApiKeyPopup;
            }
        } catch (error) {
            errorMessage = `${error}`;
            showError = true;
        }
    }

    function isAzureChanged() {
        if (!isAzure) {
            embeddingsDeployment = '';
            apiVersion = '';
            completionsDeployment = '';
            baseUrl = '';
            apiKey = '';
            password = '';
        }
    }

    function checkApiPassword() {
        let passwordHash = new Hashmap(password).stringHash();
        password = '';
        tsvscode.postMessage({ type: "onCheckPassword", value: passwordHash });
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
            case "onCorrectPassword":
                errorMessage = 'Logging in!';
                showError = true;
                showApiKeyPopup = false;
                showApiPasswordPopup = false;
                break;
            case "onIncorrectPassword":
                errorMessage = 'Incorrect Password';
                showError = true;
                break;
            }
        });
    }

    function clearError() {
        errorMessage = '';
        showError = false;
    }
</script>


<style>
    @font-face {
        font-family: DroidSerif;
        src: url(../../static/DroidSerif-Regular-webfont.woff);
    }

    @font-face {
        font-family: DroidSerif;
        src: url(../../static/DroidSerif-Bold-webfont.woff);
        font-weight: bold;
    }

    h1 {
        text-align: center;
    }

    label {
        display: block;
        margin-bottom: 8px;
    }

    label.checkbox-label {
        position: absolute;
        bottom: 0;
        left: 0;
        margin: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: smaller;
        background-color: black;
        border-radius: 8px;
        padding: 8px;
        color: #fff;
    }

    button {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #04AA6D;
        background-color: #04AA6D;
        color: #fff;
        cursor: pointer;
    }

    .container {
        display: flex;
        flex-direction: column;
    }

    .disabled-container {
        display: flex;
        flex-direction: column;
        pointer-events: none;
    }

    .editable-div-container {
        position: relative;
        width: 100%;
    }

    .editable-div {
        width: 100%;
        resize: vertical;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #ccc;
        background-color: #fff;
        font-family: DroidSerif;
        min-height: 100px;
        white-space: pre-wrap;
		overflow-y: auto;
        max-height: 800px;
    }

    .error-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #ff4444;
      color: #fff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      text-align: center;
      z-index: 1003;
      pointer-events: auto;
  }

  .error-message button {
      background-color: #fff;
      color: #ff4444;
      border: 1px solid #ff4444;
      padding: 5px 10px;
      margin-top: 5px;
      cursor: pointer;
      border-radius: 3px;
  }

  .gear-icon {
    position: absolute;
    bottom: 10px;
    right: 10px;
    cursor: pointer;
    font-size: 18px;
    pointer-events: all;
    z-index: 1001;
  }

  .settings-panel {
    position: absolute;
    bottom: 0px;
    right: 25px;
    background-color: #000;
    color: #fff;
    font-size: 10px;
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
  }

  .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 10px; /* Rounded borders */
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        pointer-events: auto;
        text-align: center;
        max-height: 500px;
        overflow-y: auto;
        z-index: 1002;
    }

    .popup h2 {
        font-size: 1.2em; /* Smaller font size */
        color: #333; /* Darker font color */
    }

    .popup input {
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        box-sizing: border-box;
    }

    .button-container {
        display: table-cell;
        vertical-align: middle;
        width: 100%;
        top: 10px;
    }

    .popup button {
        background-color: #04AA6D; /* Green background */
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        box-sizing: border-box;
        max-width: 150px;
        min-width: 120px;
    }

    .popup button:last-child {
        margin-right: 0; /* Remove right margin for the last button */
    }

    .popup .close-button {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        font-size: 16px;
    }

  .help-tip {
    position: absolute;
    top: 18px;
    right: 18px;
    text-align: center;
    background-color: #BCDBEA;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 14px;
    line-height: 26px;
    cursor: default;
  }

  .help-tip:before {
    content: '?';
    font-weight: bold;
    color: #fff;
  }

  .help-tip:hover p {
    display: block;
    transform-origin: 100% 0%;

    -webkit-animation: fadeIn 0.3s ease-in-out;
    animation: fadeIn 0.3s ease-in-out;
  }

  .help-tip p {
    /* The tooltip */
    display: none;
    text-align: left;
    background-color: #1E2021;
    padding: 20px;
    width: 300px;
    position: absolute;
    border-radius: 3px;
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
    right: -4px;
    color: #FFF;
    font-size: 13px;
    line-height: 1.4;
  }

  .help-tip p:before {
    /* The pointer of the tooltip */
    position: absolute;
    content: '';
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-bottom-color: #1E2021;
    right: 10px;
    top: -12px;
  }

  .help-tip p:after {
    /* Prevents the tooltip from being hidden */
    width: 100%;
    height: 40px;
    content: '';
    position: absolute;
    top: -40px;
    left: 0;
  }

  /* CSS animation */
  @-webkit-keyframes fadeIn {
    0% {
      opacity: 0;
      transform: scale(0.6);
    }

    100% {
      opacity: 100%;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 100%;
    }
  }
</style>

{#if showError}
  <div class="error-message">
      <p>{errorMessage}</p>
      <button on:click={clearError}>Dismiss</button>
  </div>
{/if}

<div>
    <div class={showApiKeyPopup || showApiPasswordPopup ? "disabled-container":"container"}>
        <h1>Green Coding</h1>
        <div class="editable-div-container">
            <label for="text"><b>Code Review</b></label>
            <div
                bind:innerHTML={text}
                class="editable-div"
                contenteditable="false"
                style="color: {textColor}; max-height: {maxDivHeight}px;"
                on:input={() => {
                    text = text.replace(/<\/?span[^>]*>/g, "");
                }}
            ></div>
            {#if textColor === "black"}
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={regenResponse} />
                    Regenerate response
                </label>
            {/if}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <div class="gear-icon" on:click={toggleApiKeyPopup} on:mouseenter={showSettingsPanel} on:mouseleave={hideSettingsPanel}>⚙️
                {#if settingsPanelVisible}
                    <div class="settings-panel" transition:fly={{ duration: 300, x: 25, y:0, opacity: 0, easing: quintOut}}>
                        Settings
                    </div>
                {/if}
            </div>
        </div>
        <button on:click={fetchText}>Get Feedback</button>
    </div>

    {#if showApiKeyPopup}
        <div class="popup">
            <select bind:value={isAzure} on:change={() => isAzureChanged()}>
                <option value={true}>Azure OpenAI</option>
                <option value={false}>OpenAI</option>
            </select>
            {#if isAzure}
                <h2>Enter your Embeddings API information</h2>
                <div class="input-container">
                    <input type="text" bind:value={value} on:change={() => embeddingsDeployment} placeholder="Deployment Name" />
                    <div class="help-tip">
                    <p>Helpful tooltip content</p>
                    </div>
                </div>
                <input type="text" bind:value={apiVersion} placeholder="API Version" />
                
                <h2>Enter your Completions API information</h2>
                <input type="text" bind:value={completionsDeployment} placeholder="Deployment Name" />

                <h2>Enter your Azure base URL, Azure OpenAI API Key and a password</h2>
                <input type="text" bind:value={baseUrl} placeholder="Base URL" />
            {/if}
            {#if !isAzure}
                <h2>Enter your OpenAI API Key and a password</h2>
            {/if}
            <input type="password" bind:value={apiKey} placeholder="API Key" />
            <input type="password" bind:value={password} placeholder="Password (optional)"/>
            <button on:click={saveApiKey}>Save</button>
            <button on:click={clearSavedData}>Clear Saved Data</button>
        </div>
    {/if}

    {#if showApiPasswordPopup && passwordRequired}
        <div class="popup">
            <h2>Enter your password</h2>
            <input type="password" bind:value={password} placeholder="Password"/>
            <button class = "button-container" on:click={checkApiPassword}>Proceed</button>
            <button class = "button-container" on:click={clearSavedData}>Clear Saved Data</button>
        </div>
    {/if}
</div>



