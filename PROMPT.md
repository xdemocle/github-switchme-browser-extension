# GitHub Account Switcher Browser Extension

## Project Overview

Build a cross-browser extension that simplifies GitHub account switching from 3 clicks to 1 click. Users can quickly switch between logged-in GitHub accounts via a dropdown menu attached to the profile icon.

**Visual References**: Use the attached screenshots to understand the current UX flow and target design:

- **Screenshots 1-3**: Current GitHub account switching UX (the problem we're solving)
- **Prototype image**: Target design showing the improved dropdown interface

## Technical Foundation

- Remove LinkedIn-specific logic but keep the extension structure
- Maintain TypeScript setup and manifest v3 configuration
- Keep build tools and folder organization
- **Package Manager**: Use pnpm exclusively (not npm/yarn)
- **AI Tool**: Optimized for Claude Sonnet 4 in Windsurf AI IDE

## Core Functionality

### Current GitHub UX Problem (Screenshots 1-3)

```text
Click Profile Icon → Switch Account → Select User → Navigate
(3 clicks + page reload)
```

### Target Solution (Prototype Image)

```text
Click Profile Icon → Dropdown appears → Select User
(1 click + instant switch)
```

**Design Requirements**: Follow the prototype image exactly - maintain GitHub's native styling with the same dark theme, typography, and spacing. The dropdown should feel like a natural extension of GitHub's interface.

## Technical Requirements

### Extension Structure

```text
github-switchme-browser-extension/
├── src/
│   ├── content/          # Inject dropdown into GitHub
│   ├── background/       # Handle account storage
│   ├── popup/           # Extension popup (optional)
│   └── types/           # TypeScript definitions
├── assets/              # Icons and images
├── manifest.json        # v3 manifest
├── package.json         # Build configuration
└── pnpm-lock.yaml      # pnpm lockfile
```

### Core Features

#### 1. Account Detection

- Auto-detect current logged-in GitHub user
- Store account data (username, avatar, profile URL)
- Persist accounts across browser sessions

#### 2. UI Injection

- Inject dropdown menu into GitHub's profile icon area
- Match GitHub's native dark/light theme styling
- Smooth animations for dropdown show/hide
- Mobile-responsive design

#### 3. Account Switching

- One-click account switching via stored URLs
- Handle GitHub's session management
- Maintain current page context when possible

### Browser Compatibility

- **Primary**: Chrome (manifest v3)
- **Secondary**: Firefox, Edge support
- Use polyfills for cross-browser API differences

### Permissions Required

```json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://github.com/*"
  ]
}
```

## UI/UX Specifications

### Dropdown Design

```css
/* Match GitHub's styling */
.github-switcher-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 280px;
  background: var(--color-canvas-overlay);
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  box-shadow: var(--color-shadow-large);
  z-index: 1000;
}
```

### Account Item Layout

```text
[Avatar] Username (Real Name)
         @username
         [Current] or [Switch]
```

### States to Handle

- Loading: Show skeleton while detecting accounts
- Empty: "No other accounts found" message
- Error: "Unable to switch accounts" fallback
- Success: Smooth transition indicator

## Implementation Strategy

### Phase 1: Core Structure

```typescript
// Account interface
interface GitHubAccount {
  username: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  isCurrent: boolean;
  lastUsed: Date;
}

// Storage manager
class AccountStorage {
  async getAccounts(): Promise<GitHubAccount[]>
  async addAccount(account: GitHubAccount): Promise<void>
  async removeAccount(username: string): Promise<void>
  async setCurrentAccount(username: string): Promise<void>
}
```

### Phase 2: DOM Injection

```typescript
// Content script logic
class GitHubSwitcher {
  private dropdown: HTMLElement;

  init() {
    this.detectCurrentUser();
    this.injectDropdown();
    this.bindEvents();
  }

  private detectCurrentUser() {
    // Extract user data from GitHub's DOM
    const userMenu = document.querySelector('[data-login]');
    // Parse username, avatar, etc.
  }

  private injectDropdown() {
    // Find GitHub's profile menu trigger
    // Inject custom dropdown
    // Apply GitHub's styling classes
  }
}
```

### Phase 3: Account Management

```typescript
// Background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SWITCH_ACCOUNT':
      handleAccountSwitch(message.username);
      break;
    case 'ADD_ACCOUNT':
      storeNewAccount(message.account);
      break;
  }
});
```

## User Experience Flow

### First Use

1. Extension detects current GitHub user
2. Shows "Add other accounts" prompt
3. User logs into other GitHub accounts in new tabs
4. Extension auto-detects and stores new accounts

### Daily Usage

1. User clicks GitHub profile icon
2. Dropdown shows all stored accounts
3. Click any account to switch instantly
4. Page updates with new user context

## Security Considerations

- **No Password Storage**: Only store public profile data
- **Session Respect**: Work with GitHub's existing auth
- **Privacy First**: All data stored locally only
- **Minimal Permissions**: Request only necessary access

## Error Handling

```typescript
const ErrorStates = {
  NETWORK_ERROR: 'Connection issue, try again',
  SESSION_EXPIRED: 'Please log in to GitHub',
  RATE_LIMITED: 'Too many requests, wait a moment',
  UNKNOWN_ERROR: 'Something went wrong'
};
```

## Development Setup

```bash
# Install dependencies with pnpm
pnpm install

# Start development
pnpm run dev

# Build for production
pnpm run build
```

**IMPORTANT**: Remove all LinkedIn-specific logic from the codebase while keeping the extension structure, TypeScript setup, and build configuration. Clean out content scripts, background scripts, and any LinkedIn DOM manipulation code. Keep only the foundation files needed for a browser extension.

## Testing Strategy

### Manual Testing

- Test on github.com with multiple accounts
- Verify dropdown positioning on different pages
- Check theme compatibility (dark/light)
- Validate mobile responsiveness

### Automated Testing

- Unit tests for storage functions
- Integration tests for DOM injection
- Cross-browser compatibility tests

## Distribution

### Chrome Web Store

- Clean manifest v3 compliance
- Privacy policy for data usage
- Screenshots showing the improvement

### Firefox Add-ons

- Manifest v2 compatibility layer
- Similar store requirements

## Performance Targets

- **Injection Speed**: <100ms to show dropdown
- **Account Switch**: <500ms for navigation
- **Memory Usage**: <5MB total footprint
- **Bundle Size**: <200KB compressed

## Recommended AI Development Tool

**Optimal Choice**: **Claude Sonnet 4 in Windsurf AI IDE** - Perfect combination for this project:

- Claude Sonnet 4 excels at TypeScript/extension development with precise DOM manipulation
- Windsurf AI IDE provides excellent browser extension scaffolding and debugging
- Strong at maintaining consistent styling and following visual prototypes
- Can handle the entire extension build in 1-2 iterations

### Development Approach for Claude Sonnet 4

**Iteration 1**: "Analyze the attached screenshots and prototype. Build the core extension structure with account detection, storage, and basic dropdown injection matching the prototype design exactly."

**Iteration 2**: "Implement account switching logic, error handling, and polish the animations to match GitHub's native feel."

**Optional Iteration 3**: "Add cross-browser compatibility and performance optimizations."

## Success Metrics

- Reduces account switching from 3 clicks to 1 click
- Works seamlessly across all GitHub pages
- Maintains GitHub's native look and feel
- Zero conflicts with GitHub's existing functionality

Start with Windsurf AI IDE and this exact prompt. The extension should be functional after the first prompt and polished after 2-3 iterations.

## Sample Code Structure

```typescript
// manifest.json (cleaned from LinkedIn extension)
{
  "manifest_version": 3,
  "name": "GitHub Account Switcher",
  "version": "1.0.0",
  "description": "Quick switch between GitHub accounts",
  "permissions": ["storage"],
  "host_permissions": ["https://github.com/*"],
  "content_scripts": [{
    "matches": ["https://github.com/*"],
    "js": ["content.js"],
    "css": ["styles.css"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

This prompt is production-ready for Windsurf AI IDE and will generate a working GitHub account switcher extension that solves the exact UX problem you identified.
