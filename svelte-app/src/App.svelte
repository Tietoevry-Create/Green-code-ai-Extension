<script lang="ts">
    import { onMount } from "svelte";

    let text = "";
    let placeholder = "Highlight a piece of code and press `Get Feedback`!";

    function fetchText() {
        tsvscode.postMessage({ type: "onFetchText", value: "" });
        placeholder = "Loading...";
    }
    
    onMount(() => {
        // Listen for messages from the extension
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "onSelectedText": {
                    text = message.value;
                    break;
                }
            }
        });
    });
</script>


<style>
    h1 {
        text-align: center;
    }

    label {
        display: block;
        margin-bottom: 8px;
    }

    textarea {
        width: 100%;
        resize: vertical;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid #ccc;
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

    .container > div {
        background-color: #f1f1f1;
        margin: 10px;
        padding: 20px;
        font-size: 30px;
    }
</style>

<div class="container">
    <h1>Green Coding</h1>
    <label for="text"><b>Code Review</b></label>
    <textarea
        rows="15"
        id="text"
        bind:value={text}
        readonly
        placeholder={placeholder}
    />
    <button on:click={fetchText}>Get Feedback</button>
</div>



