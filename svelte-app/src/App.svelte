<!-- © Tietotevry Corporation (2024) -->
<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from 'svelte/easing';
    import { Hashmap } from '../../out/hashmap';
    import { AESEncryption } from '../../out/aes-encryption';
    import CryptoJS from 'crypto-js';
    // @ts-expect-error
    import DiAptana from 'svelte-icons/di/DiAptana.svelte';
    // @ts-expect-error
    import FaRedoAlt from 'svelte-icons/fa/FaRedoAlt.svelte';
    // @ts-expect-error
    import FaRegWindowClose from 'svelte-icons/fa/FaRegWindowClose.svelte';
    
    const placeholder = "Highlight a piece of code and press `Get Feedback`!";
    let text = placeholder;
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 170;
    let regenResponseVal = false;
    let errorMessage = '';
    let isAzure = false;
    let settingsPanelVisible = false;
    let regenPanelVisible = false;
    let tooltipVisible = [false, false, false, false, false, false];
    let showApiKeyPopup = false;
    let showApiPasswordPopup = false;
    let passwordRequired = false;
    let passwordChange = false;
    let editMode = false;
    let longtermPassword = false;
    let longtermPasswordTemp = false;
    let correctPassword = false;
    let loading = false;
    let errorRequiresRegen = false;
    let highlightLines = false;
    let completionsDeployment = "";
    let baseUrl = "";
    let apiKey = "";
    let password = "";
    let newPassword = "";
    
    let isOpen = {passwordType: false, openaiType: false};
    let selectedOption = {passwordType: '', openaiType: ''};
    let passwordSelectOptions = ["Ask every time", "Ask every 7 days"];
    let openaiSelectOptions = ["OpenAI", "Azure OpenAI"];
    
    onMount(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onSelectedText": {
                    text = message.value;
                    textColor = "black";
                    errorRequiresRegen = false;
                    break;
                }
                case "onRegenResponse": {
                    regenResponse();
                    break;
                }
                case "onError": {
                    triggerError(message.value.message || message.value.code || message.value);
                    text = placeholder;
                    errorRequiresRegen = true;
                    break;
                }
                case "onCorrectPassword": {
                    [showApiKeyPopup, showApiPasswordPopup] = [false, false];
                    if (editMode) {
                        correctPassword = true;
                        editValues();
                    }
                    break;
                }
                case "onIncorrectPassword": {
                    triggerError("Incorrect Password!");
                    correctPassword = false;
                    break;
                }
                case "onDataFetched": {
                    [completionsDeployment, baseUrl, password] = message.value;
                    apiKey = 'a'.repeat(30);
                    if (completionsDeployment || baseUrl) {
                        isAzure = true;
                    }
                    passwordRequired = password ? true : false;
                    password = '';
                    showApiKeyPopup = true;
                    loading = false;
                    break;
                }
                case "onApiKeyExists": {
                    let daysSinceCreated = 0;
                    [passwordRequired, daysSinceCreated] = message.value;
                    
                    if (daysSinceCreated != 0) longtermPassword = true;
                    
                    if (passwordRequired) {
                        if ((longtermPassword && daysSinceCreated >= 7) || !longtermPassword) {
                            showApiPasswordPopup = true;
                        }
                    }
                    loading = false;
                    break;
                }
                case "onApiKeyNotFound": {
                    showApiKeyPopup = true;
                    loading = false;
                    break;
                }
                case "onClearedData": {
                    loading = false;
                    break;
                }
                case "onRegistered": {
                    loading = false;
                    break;
                }
                case "onEditComplete": {
                    loading = false;
                    [showApiKeyPopup, showApiPasswordPopup] = [false, false];
                    break;
                }
                case "onHighlightLinesChanged": {
                    loading = false;
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
    
    function updateMaxDivHeight() {
        maxDivHeight = window.innerHeight - 170;
    }
    
    function clearSavedData() {
        loading = true;
        tsvscode.postMessage({ type: "onClearData", value: '' });
        [completionsDeployment, baseUrl, apiKey, password, newPassword] = Array(5).fill('');
        [showApiPasswordPopup, editMode, passwordRequired, isAzure, longtermPassword, longtermPasswordTemp] = Array(6).fill(false);
        showApiKeyPopup = true;
    }
    
    function changeHighlightLines() {
        loading = true;
        tsvscode.postMessage({ type: "onChangeHighlightLines", value: '' });
    }
    
    // @ts-expect-error
    function toggleDropdown(optionType) {
        if (optionType == "openaiType") {
            isOpen.openaiType = !isOpen.openaiType;
        }
        else if (optionType == "passwordType") {
            isOpen.passwordType = !isOpen.passwordType;
        }
        
        if (optionType == "passwordType" && !editMode) {
            passwordRequired = !passwordRequired;
        }
    }
    
    // @ts-expect-error
    function selectOption(option, optionType) {
        if (optionType == "passwordType") {
            selectedOption.passwordType = option;
        }
        else if (optionType == "openaiType") {
            selectedOption.openaiType = option;
        }
        toggleDropdown(optionType);
        
        if (optionType == "passwordType") {
            longtermPasswordTemp = selectedOption.passwordType == passwordSelectOptions[1];
        }
        else if (optionType == "openaiType") {
            isAzure = selectedOption.openaiType == openaiSelectOptions[1];
            if (!isAzure) isAzureChanged();
        }
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
                triggerError(`Fill in all fields!`);
                return;
            }
            
            loading = true;
            passwordRequired = password ? true : false;
            let passwordCreatedDate = longtermPasswordTemp ? Date.now() : 0;
            longtermPassword = longtermPasswordTemp;
            
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
            triggerError(`Error saving API key: ${error}`);
        }
    }
    
    function editValues() {
        if ((passwordRequired || longtermPassword) && !correctPassword) {
            if (password == '') {
                triggerError("Enter Password to Save Changes");
                return;
            }
            checkApiPassword();
            return;
        }
        
        loading = true;
        correctPassword = false;
        let unencryptedKey = '';
        if (apiKey && apiKey != 'a'.repeat(30)) {
            unencryptedKey = apiKey;
        }
        
        let openaiApiPassword = undefined;
        let openaiApiPasswordCreatedDate = undefined;
        
        if (passwordChange) {
            openaiApiPassword = newPassword;
            if (openaiApiPassword == '') {
                passwordRequired = false;
                longtermPassword = false;
                openaiApiPassword = "nopassword";
            } else {
                passwordRequired = true;
                openaiApiPasswordCreatedDate = longtermPasswordTemp ? Date.now() : 0;
                longtermPassword = longtermPasswordTemp;
            }
            
            passwordChange = false;
            newPassword = '';
        }
        tsvscode.postMessage({ type: "onEdit", value: {
            azureOpenaiCompletionsDeploymentName: completionsDeployment,
            azureOpenaiBaseUrl: baseUrl,
            unencryptedApiKey: unencryptedKey,
            openaiApiPassword,
            openaiApiPasswordCreatedDate
        } });
    }
    
    function checkApiKey() {
        loading = true;
        tsvscode.postMessage({type: "onCheckApiKey", value: ''});
    }
    
    function toggleSettings() {
        if (showApiPasswordPopup) return;
        
        editMode = true;
        try {
            if (!showApiKeyPopup && anyEmptyFields()) {
                tsvscode.postMessage({type: "onFetchSavedData", value: ''});
                loading = true;
            } else {
                [showApiKeyPopup, showApiPasswordPopup] = [!showApiKeyPopup, false];
            }
        } catch (error) {
            triggerError(`${error}`);
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
    }
    
    // @ts-expect-error
    function triggerError(error) {
        errorMessage += '\n' + error;
    }
    
    function clearError() {
        errorMessage = '';
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
    
    .custom-select {
        position: relative;
        display: inline-block;
        font-size: small;
        text-align: left;
        color: black;
        z-index: 1001;
        min-width: 130px;
        padding-bottom: 5px;
    }
    
    .custom-select .select-arrow {
        position: absolute;
        top: 50%;
        right: 5px;
        transform: translateY(-60%);
        pointer-events: none;
        
    }
    
    .custom-select .select-button {
        cursor: pointer;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: white;
        padding-left: 5px;
        padding-right: 20px;
        padding-bottom: 3px;
    }
    
    .custom-select .options-list {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        max-height: 150px;
        overflow-y: auto;
        border: 1px solid #ccc;
        border-top: none;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: #fff;
        color: black;
    }
    
    .custom-select .option {
        padding: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .custom-select .option:hover {
        background-color: #f0f0f0;
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
    
    .ui-button {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #04AA6D;
        background-color: #04AA6D;
        color: #fff;
        cursor: pointer;
    }
    
    .label-container button {
        box-sizing: border-box;
        width: 50%;
        border: 1px solid #ff4444;
        background-color: #ff4444;
        color: white;
        cursor: pointer;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
        height: 25px;
        pointer-events: all;
    }
    
    .label-container {
        display: table-cell;
    }
    
    .label-container span {
        width: 50%;
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
        transform: translate(-50%, -50%);
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
    
    .password-label {
        position: relative;
        text-align: center;
        vertical-align: middle;
        background-color: black;
        min-height: 20px;
        border-radius: 5px;
        padding: 5px;
        margin-bottom: 8px;
    }
    
    .password-label span {
        border-radius: 5px;
        padding: 5px;
        font-size: 12px;
        cursor: pointer;
        pointer-events: all;
    }
    
    .button-container {
        display: table-cell;
        vertical-align: middle;
        width: 100%;
        top: 10px;
        margin-bottom: 2px;
        box-sizing: border-box;
        background-color: #04AA6D;
        color: #fff;
        padding: 10px 15px;
        border: none;
        border-radius: 25px;
        cursor: pointer;
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

{#if errorMessage || loading}
<div class="error-message" style={loading ? "background-color: black;" : ""}>
    <p>{!loading ? errorMessage : "Loading..."}</p>
    {#if !loading}
    <button on:click={clearError}>Dismiss</button>
    {/if}
</div>
{/if}

<div style={loading ? "pointer-events: none;" : ''}>
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
            {#if textColor === "black" || errorRequiresRegen}
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
            <div class="settings-icon" on:click={toggleSettings} on:mouseenter={showSettingsPanel} on:mouseleave={hideSettingsPanel}>
                <div style="width: 18px; height: 18px;">
                    <DiAptana />
                </div>
                {#if settingsPanelVisible}
                <div transition:fly={{ duration: 300, delay: 100, x: 25, y: 0, opacity: 0, easing: quintOut }}>
                    Settings
                </div>
                {/if}
            </div>
        </div>
        <button class="ui-button" on:click={fetchText}>Get Feedback</button>
    </div>
    
    {#if showApiKeyPopup && !showApiPasswordPopup}
    <div class="popup" style={loading ? "pointer-events: none;" : ''}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        {#if editMode}
        <span class="close-button" on:click={toggleSettings}>
            <div style="width: 18px; height: 18px; color: black">
                <FaRegWindowClose />
            </div>
        </span>
        {/if}
        {#if !editMode}
        <div class="custom-select">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="select-button" on:click={() => toggleDropdown("openaiType")}>
                {selectedOption.openaiType || openaiSelectOptions[0]}
            </div>
            <div class="select-arrow">&#9660;</div>
            <div class="options-list" style="display: {isOpen.openaiType ? 'block' : 'none'};">
                {#each openaiSelectOptions as option (option)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="option" on:click={() => selectOption(option, "openaiType")}>{option}</div>
                {/each}
            </div>
        </div>
        {/if}
        {#if isAzure}
        <h2>{editMode ? '' : "Enter your "}Completions API information</h2>
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <div class="tooltip-container">
            <input type="text" bind:value={completionsDeployment} placeholder="Deployment Name" />
            <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltipVisible[0] = true} 
                on:mouseleave={() => tooltipVisible[0] = false}>
                {#if tooltipVisible[0]}
                <p transition:fade={{ duration: 200 }}>Name of the resource that corresponds to the deployment of your completions module 
                    (e.g., gpt-3.5-turbo)</p>
                    {/if}
                </div>
            </div>
            
            <h2>{editMode ? '' : "Enter your "}Azure base URL and Azure OpenAI API Key</h2>
            <div class="tooltip-container">
                <input type="text" bind:value={baseUrl} placeholder="Base URL" />
                <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltipVisible[1] = true} 
                    on:mouseleave={() => tooltipVisible[1] = false}>
                    {#if tooltipVisible[1]}
                    <p transition:fade={{ duration: 200 }}>Base URL of your Azure OpenAI deployment should look like this:<br>
                        https://your-resource-name.openai.azure.com</p>
                        {/if}
                    </div>
                </div>
                {/if}
                {#if !isAzure}
                <h2>{editMode ? '' : "Enter your "}OpenAI API Key</h2>
                {/if}
                <div class="tooltip-container">
                    <input type="password" bind:value={apiKey} placeholder="API Key" />
                    <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltipVisible[2] = true} on:mouseleave={() => tooltipVisible[2] = false}>
                        {#if tooltipVisible[2]}
                        <p transition:fade={{ duration: 200 }}>Secret API key that is used to connect to your OpenAI {isAzure ? "resource" : "account"}</p>
                        {/if}
                    </div>
                </div>
                
                {#if !editMode}
                <label class="checkbox-label" style="display: table-cell; vertical-align: middle; pointer-events: none;">
                    <input type="checkbox" style={loading ? "pointer-events: none;" : "pointer-events: all;"} bind:checked={passwordRequired}/>
                    <span style={loading ? "pointer-events: none;" : "pointer-events: all;"}>Set a password</span>
                    <div class="custom-select" style={(passwordRequired && !loading) ? "pointer-events: all;" : "color: darkgray; pointer-events: none;"}>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div class="select-button" on:click={() => toggleDropdown("passwordType")}>
                            {selectedOption.passwordType || passwordSelectOptions[0]}
                        </div>
                        <div class="select-arrow">&#9660;</div>
                        <div class="options-list" style="display: {isOpen.passwordType ? 'block' : 'none'};">
                            {#each passwordSelectOptions as option (option)}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <div class="option" on:click={() => selectOption(option, "passwordType")}>{option}</div>
                            {/each}
                        </div>
                    </div>
                </label>
                {/if}
                {#if editMode}
                <div class="password-label" style="{(passwordChange || loading) ? "pointer-events: none;" : "cursor: pointer;"}">
                    <div class="label-container" style="align-items: center; display: block;">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span style= "{passwordChange ? "color: black; background-color: white; font-weight: bold;" : "color: white; background-color: black;"}" 
                        on:click={() => {if (!loading) passwordChange = !passwordChange;}}>
                        {passwordChange ? "Cancel" : ((passwordRequired || longtermPassword) ? "Change Password" : "Set Password")}
                    </span>
                    {#if passwordChange && passwordRequired}
                    <button on:click={() => {newPassword = ''; showApiPasswordPopup = true; editValues();}}>Delete</button>
                    {/if}
                </div>
                {#if passwordChange}
                {#if passwordRequired || longtermPassword}
                <div class="tooltip-container" style="margin-top: 10px; {loading ? "pointer-events: none;" : "pointer-events: all;"}">
                    <input type="password" bind:value={password} placeholder="Current Password"/>
                    <div class="help-tip" style="top: 15%; right: -24px;" on:mouseenter={() => tooltipVisible[4] = true} on:mouseleave={() => tooltipVisible[4] = false}>
                        {#if tooltipVisible[4]}
                        <p transition:fade={{ duration: 200 }}>
                            Enter your current password
                        </p>
                        {/if}
                    </div>
                </div>
                {/if}
                <div class="tooltip-container" style="{loading ? "pointer-events: none;" : "pointer-events: all;"} {(passwordRequired || longtermPassword) ? "" : "margin-top: 10px;"}">
                    <input type="password" bind:value={newPassword} placeholder="New Password"/>
                    <div class="help-tip" style="top: 15%; right: -24px;" on:mouseenter={() => tooltipVisible[5] = true} on:mouseleave={() => tooltipVisible[5] = false}>
                        {#if tooltipVisible[5]}
                        <p transition:fade={{ duration: 200 }}>
                            {(passwordRequired || longtermPassword) ? "Enter the new password" : "Enter a password"}
                        </p>
                        {/if}
                    </div>
                </div>
                <div class="custom-select" style={loading ? "pointer-events: none;" : "pointer-events: all;"}>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="select-button" on:click={() => toggleDropdown("passwordType")}>
                        {selectedOption.passwordType || passwordSelectOptions[0]}
                    </div>
                    <div class="select-arrow">&#9660;</div>
                    <div class="options-list" style="display: {isOpen.passwordType ? 'block' : 'none'};">
                        {#each passwordSelectOptions as option (option)}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div class="option" on:click={() => selectOption(option, "passwordType")}>{option}</div>
                        {/each}
                    </div>
                </div>
                {/if}
            </div>
            <br />
            <label class="checkbox-label" style="display: flex; align-items: center; background-color: transparent; border-color: black; border: 2px solid black; padding: 5px; border-radius: 5px;">
                <input type="checkbox" bind:checked={highlightLines} on:change={changeHighlightLines} style="margin-right: 8px;">
                <span style="font-size: 12px; color: black;">Highlight lines (beta)</span>
            </label>
            <br />
            {/if}
            {#if passwordRequired || !editMode}
            
            {#if !passwordChange}
            <div class="tooltip-container">
                <input type="password" disabled={!passwordRequired} style={passwordRequired ? "background-color: white;" : "background-color: lightgray;"} 
                bind:value={password} placeholder={editMode ? "Confirm Password" : "Password (optional)"}/>
                <div class="help-tip" style="top: 15%; right: -19px" on:mouseenter={() => tooltipVisible[3] = true} on:mouseleave={() => tooltipVisible[3] = false}>
                    {#if tooltipVisible[3]}
                    <p transition:fade={{ duration: 200 }}>
                        {editMode ? "Enter your password to apply the changes" : 
                        "An optional password that is used to encrypt your API key prior to storage"}
                    </p>
                    {/if}
                </div>
            </div>
            {/if}
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
    
    
    
    