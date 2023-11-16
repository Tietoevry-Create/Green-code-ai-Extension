<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    let text = "Highlight a piece of code and press `Get Feedback`!";
    let textColor = "gray";
    let maxDivHeight = window.innerHeight - 150;

    function updateMaxDivHeight() {
        maxDivHeight = window.innerHeight - 150;
    }

    function fetchText() {
        tsvscode.postMessage({ type: "onFetchText", value: "" });
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
    <button on:click={fetchText}>Get Feedback</button>
</div>



