// © Tietotevry Corporation (2024)

import App from "./App.svelte";

const app = new App({
  target: document.body,
  // TODO: Remove props
  props: {
    name: "world",
  },
});

export default app;
