<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import ApiKeyPopup from "./ApiKeyPopup.svelte";

    let text = "Highlight a piece of code and press `Get Feedback`!";
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 150;
    let regenResponse = false;
    let showApiKeyPopup = false;
    let showApiPasswordPopup = false;
    let errorMessage = '';
    let showError = false;

    function clearError() {
        errorMessage = '';
        showError = false;
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
                }
                case "onApiKeyNotFound": {
                    showApiKeyPopup = true;
                }
            }
        });
    }

    function fetchText() {
        tsvscode.postMessage({ type: "onFetchText", value: regenResponse });
        text = "Loading...";
        textColor = "gray";
    }
    
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
      z-index: 1001;
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
</style>

{#if showError}
  <div class="error-message">
      <p>{errorMessage}</p>
      <button on:click={clearError}>Dismiss</button>
  </div>
{/if}

<div>
    <ApiKeyPopup bind:showApiKeyPopup={showApiKeyPopup} bind:showApiPasswordPopup={showApiPasswordPopup}/>
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
        </div>
        <button on:click={fetchText}>Get Feedback</button>
    </div>
</div>



