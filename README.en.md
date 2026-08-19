# biaoqingbao · DeepSeek Harness Plugin

Let the assistant in DeepSeek Harness express emotions with stickers.

> ⚠️ This is a third-party community plugin, fully open source (MIT). It reads and writes sticker library data locally on your machine; AI tagging / auto-matching features call the model services you already configured in DSH (the corresponding text and images are sent to the model provider). Installing means you trust this source.
> DeepSeek Harness is in developer preview (v0.1); plugin interfaces may evolve.

## What it does

- 😀 **Emotional sticker matching**: the assistant calls the `express` tool to send a fitting sticker when it feels happy, sad, proud, speechless...
- 🗂️ **Library management**: multi-select upload (PNG/JPG/WebP/GIF), browse, search, edit tags
- 👍 **Feedback tuning**: 👍/👎 buttons on sticker cards — the more you use them, the better the picks
- 🏷️ **AI tagging**: auto-tag images (description / emotion / scene / keywords) with your configured DSH model, single & batch
- 👀 **Auto-match observer** (optional): detects emotional moments in conversation and nudges the assistant to send a sticker
- 🗣️ **Dialects** (optional): 9 dialects — Northeastern, Henan, Shanghai, Cantonese, Taiwanese, Sichuan, Shaanxi, Beijing, Xinjiang
- 🎭 **Mimic my style** (optional): analyzes your chat history and distills your typing style
- ⚙️ **Settings panel**: sidebar "表情包" entry — global switch, observer, vision model, dialect, style mimicry
- 👥 **Per-assistant settings**: when assistant presets exist, each one can get its own dialect, sticker frequency and on/off switch (e.g. one assistant speaks Sichuanese, another speaks Cantonese — they never mix)

## Works great with the memory plugin (recommended)

Install [Hanako Memory](https://github.com/moononnn/DeepSeek-Harness-Hanako-Memory) (brings openhanako's memory system to DSH, including assistant-preset management: create presets, pick personalities, write personas, manage memory) and the per-assistant settings light up automatically:

- Every assistant preset appears in the "每位助手单独设置" list in the settings panel
- Each assistant gets its **own dialect, sticker frequency and 👍/👎 preferences**
- Sticker matching automatically follows the assistant speaking in the current session

It also works standalone: without assistant presets, the global defaults apply and everything keeps working.

## Install

```sh
dsh plugin --profile web add <package-name>
```

Restart `dsh web`, then open the sidebar "表情包" entry:

1. Upload images you have rights to use (multi-select supported)
2. Chat — the assistant will send stickers when it has emotions; or just say "send a sticker for being wronged"
3. Tap 👍/👎 on sticker cards to tune the matching

> Or install from GitHub: `dsh plugin --profile web add github:moononnn/DeepSeek-Harness-biaoqingbao`

## Data & privacy

- Library, preferences and usage logs are stored locally at `${DSH_HOME}/plugin-data/biaoqingbao/`
- No chat logs are uploaded
- AI tagging / observer / style mimicry use the DSH model route you configured
- Uninstalling keeps your library data

## Compatibility

- DeepSeek Harness v0.1 (rc series), Node.js 20+
- Web profile fully supported; headless gets tools without the management panel

## Development

```sh
npm run check   # syntax check (lib + client)
npm test        # unit tests for core logic (node:test, zero deps)
```

Core pure functions (scoring, preferences, tag sanitizing, frequency gating) live in `lib/core.js`.

## Relation to the Hana version

This plugin is a port of [moononnn/hanako-biaoqingbao](https://github.com/moononnn/hanako-biaoqingbao) (a Hana community sticker plugin) for DeepSeek Harness: the original tool registration, library management, feedback tuning, AI tagging, dialects and style mimicry are all preserved, re-implemented on DSH's plugin system (`dsh.bundle` + Cordis).

## Credits

Inspired by the design of the Hana community sticker plugin. Thanks to moononnn for the original work.

## License

MIT © moononnn & 小花
