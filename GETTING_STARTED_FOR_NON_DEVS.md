# Getting Started: Local Development for Non-Developers

> **If you are not a developer but want to run Elytro locally, follow this step-by-step guide. No coding experience required!**
> **If you need more help, see this doc [Illustrated Startup Guide for Non-Developers](/DETAILED_STARTED_FOR_NON_DEV.md)**

---

## 1. Install Prerequisites

**You need:**

- [Node.js](https://nodejs.org/en/download/) (version 22.15.x recommended)
- [pnpm](https://pnpm.io/installation) (version 9.15.x recommended)

**How to install:**

1. Download and install Node.js from the official website.
2. Open your terminal (Mac: press `Command + Space`, type "Terminal", press Enter).
3. Install pnpm by running:
   ```bash
   npm install -g pnpm
   ```
4. Check installation:
   ```bash
   node -v
   pnpm -v
   ```
   If you see version numbers, you’re good to go!

---

## 2. Download the Elytro Project

- If you have Git:
  ```bash
  git clone https://github.com/elytro/elytro.git
  cd elytro
  ```
- Or, download as ZIP from GitHub, unzip, and open the folder in your terminal.

---

## 3. Install Project Dependencies

In your terminal, inside the `elytro` folder, run:

```bash
pnpm install
```

This will download everything needed to run the project.

---

## 4. Start the Local Development Servers

### To run the Elytro Wallet Extension:

```bash
pnpm --filter extension dev
```

- This builds the extension into `apps/extension/dist`.

### To run the Recovery Web App:

```bash
pnpm --filter recovery dev
```

- This starts a website at [http://localhost:3000](http://localhost:3000).

---

## 5. Load the Extension in Chrome (for Wallet Extension)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `elytro/apps/extension/dist` folder
5. You should see the Elytro icon appear

---

## 6. Troubleshooting

- **Dependency install fails?**
  - Check your internet connection and try `pnpm install` again.
- **Port 3000 is busy?**
  - Close other apps using that port, or change the port in the recovery app config.
- **Extension won’t load?**
  - Make sure you selected the `dist` folder and that the build finished.

---

## That’s it!

Just follow these steps and you’ll have Elytro running locally, no coding required. If you get stuck, check the documentation or ask for help on GitHub.
