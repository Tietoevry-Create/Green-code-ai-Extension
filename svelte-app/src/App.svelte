<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    let text = "Highlight a piece of code and press `Get Feedback`!";
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 150;
    let regenResponse = false;

    function updateMaxDivHeight() {
        maxDivHeight = window.innerHeight - 150;
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
</style>

<div class="container">
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



