# github-switchme-browser-extension

**Quick switch between your GitHub accounts with zero hassle.**

## What it does

Tired of GitHub's clunky account switching? Currently takes 3 clicks + page reload just to switch users. This extension cuts that down to 1 click with a clean dropdown right from your profile icon.

## The problem

GitHub's current UX: Profile → Switch Account → Pick User → Wait for reload
Our solution: Profile → Pick User (done)

## Features

- **One-click switching** between logged-in GitHub accounts
- **Native GitHub styling** - looks like it belongs there
- **Auto-detects accounts** when you log in from different tabs
- **Secure & private** - no passwords stored, works with GitHub's existing auth
- **Cross-browser support** - Chrome, Firefox, Edge

## Technical stack

Built with TypeScript, Manifest v3, and modern browser APIs. Injects seamlessly into GitHub's interface without breaking anything.

## Installation

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/xdemocle/github-switchme-browser-extension.git
   cd github-switchme-browser-extension
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Development mode** (with hot reload)

   ```bash
   pnpm dev
   ```

   This opens Chrome with the extension automatically loaded.

4. **Build for production**

   ```bash
   pnpm build
   ```

   Extension files will be in `dist/chrome-mv3/`

### Manual Installation

1. Build the extension using the steps above
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist/chrome-mv3` folder
5. The extension is now active on GitHub!

### Store Installation

(Coming to Chrome Web Store soon)

## Why build this?

Because switching GitHub accounts shouldn't feel like filing taxes. Simple problems deserve simple solutions.

---

_This extension respects GitHub's terms of service and only works with accounts you're already logged into._

## How to use

1. Log into multiple GitHub accounts in different tabs
2. Click your profile icon on any GitHub page
3. See all your accounts in the dropdown
4. Click any account to instantly switch to it

## Development

- **Framework**: WXT (Web Extension Toolkit)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build Tool**: Vite + Rollup
- **Manifest**: Version 3

### Project Structure

```text
entrypoints/
├── background.ts          # Service worker for account management
├── content/
│   ├── index.ts          # Content script for GitHub integration
│   └── content.css       # GitHub-native styling
├── web-extension-config.ts # Shared configuration and types
└── wxt.config.ts         # WXT framework configuration
```

### Mock Accounts for Development

To enable mock accounts for development:

1. Uncomment the mock account code in `entrypoints/content/index.ts` line 512. (See the code block below at end of this readme, for backup)
2. Reload the extension
3. Visit GitHub to see the mock accounts in the dropdown

This allows testing without requiring multiple real GitHub accounts.

### Debugging

To debug the extension:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Inspect views: background page"

This opens the background page in a new tab, where you can use the browser's developer tools to debug the extension.

### Building for Production

To build the extension for production:

1. Run `pnpm build`
2. The extension files will be in `dist/chrome-mv3/`

## Mock Accounts Code Block (backup mock code)

```typescript
// Create a test account for development
/*
 * Test code for debugging/mock accounts
 * See README.md for instructions on how to use this for development
 *
 * To enable mock accounts:
 * 1. Uncomment this code block
 * 2. Reload the extension
 * 3. Visit GitHub to see the mock accounts in the dropdown
 *
 * This allows testing without requiring multiple real GitHub accounts
 */
/*
  const testAccount1 = {
    username: 'github-user',
    displayName: 'GitHub User',
    avatarUrl: 'https://github.com/identicons/github-user.png',
    profileUrl: 'https://github.com/github-user',
    lastUsed: new Date(),
    isCurrent: true,
  }

  const testAccount2 = {
    username: 'octocat',
    displayName: 'Octocat',
    avatarUrl: 'https://github.com/identicons/octocat.png',
    profileUrl: 'https://github.com/octocat',
    lastUsed: new Date(Date.now() - 86400000),
    isCurrent: false,
  }

  // Force store the test accounts for development
  await AccountStorage.storeAccount(testAccount1)
  await AccountStorage.storeAccount(testAccount2)
  */
```
