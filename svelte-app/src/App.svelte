<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from 'svelte/easing';
    import { Hashmap } from '../../out/hashmap';
    import { AESEncryption } from '../../out/aes-encryption';
    import CryptoJS from 'crypto-js';
    import DiAptana from 'svelte-icons/di/DiAptana.svelte';
    import FaRedoAlt from 'svelte-icons/fa/FaRedoAlt.svelte';
    import FaRegWindowClose from 'svelte-icons/fa/FaRegWindowClose.svelte'
    
    const placeholder = "Highlight a piece of code and press `Get Feedback`!";
    let text = placeholder;
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 170;
    let regenResponseVal = false;
    let errorMessage = '';
    let showError = false;
    let isAzure = false;
    let settingsPanelVisible = false;
    let regenPanelVisible = false;
    let [tooltip1visible, tooltip2visible, tooltip3visible, tooltip4visible] = [false, false, false, false];
    let showApiKeyPopup = false;
    let showApiPasswordPopup = false;
    let passwordRequired = false;
    let editMode = false;
    let longtermStorage = false;
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
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onError": {
                    errorMessage = message.value.message || message.value.code;
                    showError = true;
                    text = placeholder;
                }
            }
        })
        window.addEventListener("resize", updateMaxDivHeight);
        checkApiKey();
    });

    onDestroy(() => {
        window.removeEventListener("resize", updateMaxDivHeight);
    });

    function updateMaxDivHeight() {
        maxDivHeight = window.innerHeight - 170;
    }

    function clearSavedData() {
        tsvscode.postMessage({ type: "onClearData", value: '' });
        [completionsDeployment, baseUrl, apiKey, password] = ['', '', '', ''];
        showApiKeyPopup = true;
        showApiPasswordPopup = false;
        editMode = false;
        passwordRequired = false;
    }

    function fetchText() {
        tsvscode.postMessage({ type: "onFetchText", value: regenResponseVal });
        text = "Loading...";
        textColor = "gray";
    }

    function anyEmptyFields() {
        return completionsDeployment == '' || baseUrl == '';
    }

    function saveApiKey() {
        try {
            if ((isAzure && (!baseUrl || !completionsDeployment)) || !apiKey) {
                errorMessage = `Fill in all fields!`;
                showError = true;
                return;
            }

            passwordRequired = password ? true : false;
            let passwordCreatedDate = longtermStorage ? Date.now() : 0;

            var salt = CryptoJS.lib.WordArray.random(128/8);
            var passwordHash = new Hashmap(password).stringHash();
            var key256Bits = CryptoJS.PBKDF2(password, salt, { keySize: 256/32 }).toString();
            var encryptedKey = new AESEncryption(apiKey, key256Bits).encrypt();

            tsvscode.postMessage({ type: "onRegister", value: {
                azureOpenaiCompletionsDeploymentName: completionsDeployment,
                azureOpenaiBaseUrl: baseUrl,
                openaiApiEncryptionSalt: salt,
                openaiApiPassword: password,
                openaiApiPasswordHash: passwordHash,
                openaiApiKey: encryptedKey,
                openaiApiPasswordCreatedDate: passwordCreatedDate
            } });
            
            [showApiKeyPopup, showApiPasswordPopup] = [false, false];
        } catch (error) {
            errorMessage = `Error saving API key: ${error}`;
            showError = true;
        }
    }

    function editValues() {
        let unencryptedKey = '';
        
        if (passwordRequired) {
            if (password == '') {
                errorMessage = "Enter Password to Save Changes";
                showError = true;
                return;
            }
            if (!checkApiPassword()) {
                showApiKeyPopup = true;
                return;
            }
        }

        tsvscode.postMessage({ type: "onEdit", value: {
            azureOpenaiCompletionsDeploymentName: completionsDeployment,
            azureOpenaiBaseUrl: baseUrl,
            openaiApiKey: unencryptedKey
        } });
        showApiKeyPopup = false;
    }

    function checkApiKey() {
        tsvscode.postMessage({type: "onCheckApiKey", value: ''});
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onApiKeyExists": {
                    let daysSinceCreated = 0;
                    [passwordRequired, daysSinceCreated] = message.value;
                    
                    if (daysSinceCreated != 0) longtermStorage = true;
                    
                    if (passwordRequired) {
                        if ((longtermStorage && daysSinceCreated >= 7) || !longtermStorage) {
                            showApiPasswordPopup = true;
                        }
                    }
                    break;
                }
                case "onApiKeyNotFound": {
                    showApiKeyPopup = true;
                    break;
                }
            }
        });
    }

    function toggleApiKeyPopup() {
        if (showApiPasswordPopup) return;
        editMode = true;
        try {
            if (!showApiKeyPopup && anyEmptyFields()) {
                tsvscode.postMessage({type: "onFetchSavedData", value: ''});

                window.addEventListener("message", (event) => {
                    const message = event.data;
                    switch (message.type) {
                        case "onDataFetched": {
                            [completionsDeployment, baseUrl, password] = message.value;
                            apiKey = 'a'.repeat(30);
                            if (completionsDeployment || baseUrl) {
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
                [showApiKeyPopup, showApiPasswordPopup] = [!showApiKeyPopup, false];
            }
        } catch (error) {
            errorMessage = `${error}`;
            showError = true;
        }
    }

    function isAzureChanged() {
        if (!isAzure) {
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
                [showApiKeyPopup, showApiPasswordPopup] = [false, false];
                return true;
            case "onIncorrectPassword":
                errorMessage = 'Incorrect Password';
                showError = true;
                return false;
            }
        });
        return false;
    }

    function clearError() {
        errorMessage = '';
        showError = false;
    }

    function regenResponse() {
        regenResponseVal = true;
        fetchText();
        regenResponseVal = false;
    }

    function showSettingsPanel() {
        settingsPanelVisible = true;
    }

    function hideSettingsPanel() {
        settingsPanelVisible = false;
    }

    function showRegenPanel() {
        regenPanelVisible = true;
    }

    function hideRegenPanel() {
        regenPanelVisible = false;
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

    .retry-icon {
        position: absolute;
        cursor: pointer;
        bottom: 0;
        left: 0;
        margin: 8px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: smaller;
        background-color: black;
        border-radius: 8px;
        padding: 8px;
        color: #fff;
    }

    .settings-icon {
        position: absolute;
        cursor: pointer;
        bottom: 0px;
        right: 0px;
        margin: 8px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        direction: rtl;
        gap: 4px;
        font-size: 12px;
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
        z-index: 1004;
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

    .popup {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%);
        background-color: white;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 10px; /* Rounded borders */
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        pointer-events: auto;
        text-align: center;
        max-height: 500px;
        overflow-y: auto;
        z-index: 1003;
    }

    .popup h2 {
        font-size: 1.2em;
        color: #333;
    }

    .popup input {
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        width: 100%;
        box-sizing: border-box;
    }

    .popup label.checkbox-label {
        position: relative;
        cursor: auto;
        display: table-cell;
        vertical-align: middle;
        text-align: left;
        font-size: small;
        background-color: transparent;
        color: black;
    }

    label.checkbox-label input {
        margin-right: 8px; /* Adjust the margin between the checkbox and the text */
        width: 12px;
        height: 12px;
    }

    label.checkbox-label span {
        flex-grow: 1; /* Allow the text to take up remaining space */
        min-width: fit-content;
        margin-right: 8px;
    }

    label.checkbox-label select {
        font-size: small;
        margin-bottom: 5px;
    }

    .button-container {
        display: table-cell;
        vertical-align: middle;
        width: 100%;
        top: 10px;
        margin-bottom: 2px;
    }

    .popup button {
        background-color: #04AA6D;
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
        font-weight: bold;
    }

    .help-tip {
        position: absolute;
        top: 18px;
        right: 18px;
        text-align: center;
        background-color: #BCDBEA;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 12px;
        line-height: 16px;
        cursor: default;
    }

    .help-tip:before {
        content: '?';
        font-weight: bold;
        color: #fff;
    }

    .help-tip p {
        /* The tooltip */
        display: block;
        text-align: center;
        background-color: #1E2021;
        padding: 20px;
        min-width: 130px;
        position: absolute;
        border-radius: 3px;
        box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
        right: -4px;
        color: #FFF;
        font-size: 12px;
        line-height: 1.4;
        z-index: 1002;
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

    .tooltip-container {
        position: relative;
    }
</style>

{#if showError}
  <div class="error-message">
      <p>{errorMessage}</p>
      <button on:click={clearError}>Dismiss</button>
  </div>
{/if}

<div style="min-width: 165px;">
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
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="retry-icon" on:click={regenResponse} on:mouseenter={showRegenPanel} on:mouseleave={hideRegenPanel}>
                    <div style="width: 13px; height: 13px; margin: 3px;">
                        <FaRedoAlt />
                    </div>
                    {#if regenPanelVisible}
                        <div transition:fly={{ duration: 300, delay: 100, x: -25, y:0, opacity: 0, easing: quintOut}}>
                            Regenerate response
                        </div>
                    {/if}
                </div>
            {/if}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <div class="settings-icon" on:click={toggleApiKeyPopup} on:mouseenter={showSettingsPanel} on:mouseleave={hideSettingsPanel}>
                <div style="width: 18px; height: 18px;">
                    <DiAptana />
                </div>
                {#if settingsPanelVisible}
                    <div transition:fly={{ duration: 300, delay: 100, x: 25, y:0, opacity: 0, easing: quintOut}}>
                        Settings
                    </div>
                {/if}
            </div>
        </div>
        <button on:click={fetchText}>Get Feedback</button>
    </div>

    {#if showApiKeyPopup && !showApiPasswordPopup}
        <div class="popup">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#if editMode}
            <span class="close-button" on:click={toggleApiKeyPopup}>
                <div style="width: 18px; height: 18px; color: black">
                    <FaRegWindowClose />
                </div>
            </span>
            {/if}
            {#if !editMode}
                <select bind:value={isAzure} on:change={() => isAzureChanged()}>
                    <option value={true}>Azure OpenAI</option>
                    <option value={false}>OpenAI</option>
                </select>
            {/if}
            {#if isAzure}
                <h2>Enter your Completions API information</h2>
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <div class="tooltip-container">
                    <input type="text" bind:value={completionsDeployment} placeholder="Deployment Name" />
                    <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltip1visible = true} 
                        on:mouseleave={() => tooltip1visible = false}>
                        {#if tooltip1visible}
                            <p transition:fade={{ duration: 200 }}>Name of the resource that corresponds to the deployment of your completions module 
                                (e.g., gpt-3.5-turbo)</p>
                        {/if}
                    </div>
                </div>

                <h2>Enter your Azure base URL and Azure OpenAI API Key</h2>
                <div class="tooltip-container">
                    <input type="text" bind:value={baseUrl} placeholder="Base URL" />
                    <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltip2visible = true} 
                        on:mouseleave={() => tooltip2visible = false}>
                        {#if tooltip2visible}
                            <p transition:fade={{ duration: 200 }}>Base URL of your Azure OpenAI deployment should look like this:<br>
                                https://your-resource-name.openai.azure.com</p>
                        {/if}
                    </div>
                </div>
            {/if}
            {#if !isAzure}
                <h2>Enter your OpenAI API Key</h2>
            {/if}
            <div class="tooltip-container">
                <input type="password" bind:value={apiKey} placeholder="API Key" />
                <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltip3visible = true} on:mouseleave={() => tooltip3visible = false}>
                    {#if tooltip3visible}
                        <p transition:fade={{ duration: 200 }}>Secret API key that is used to connect to your OpenAI {isAzure ? "resource" : "account"}</p>
                    {/if}
                </div>
            </div>

            {#if !editMode}
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={passwordRequired}/>
                    <span>Set a password</span>
                    <select bind:value={longtermStorage}>
                        <option value={true}>Ask every 7 days</option>
                        <option value={false}>Ask on startup</option>
                    </select>
                </label>
            {/if}
            {#if passwordRequired || !editMode}
                <div class="tooltip-container">
                    <input type="password" disabled={!passwordRequired} style={passwordRequired ? "background-color: white;" : "background-color: lightgray;"} bind:value={password} placeholder={editMode ? "Confirm Password" : "Password (optional)"}/>
                    <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltip4visible = true} on:mouseleave={() => tooltip4visible = false}>
                        {#if tooltip4visible}
                            <p transition:fade={{ duration: 200 }}>
                                {editMode ? "Enter your password to apply the changes" : 
                                "An optional password that is used to encrypt your API key prior to storage"}
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}

            <button class="button-container" on:click={editMode ? editValues : saveApiKey}>Save</button>
            <button class="button-container" on:click={clearSavedData}>Clear Saved Data</button>
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



