# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub SwitchMe is a browser extension built with WXT (Web Extension Toolkit) that reduces GitHub account switching from 3 clicks to 1 click. The extension injects a native-looking dropdown menu into GitHub's profile icon area, allowing instant switching between logged-in accounts without re-authentication.

**Core Problem Solved**: GitHub's current UX requires Profile → Switch Account → Pick User → Wait for reload. This extension simplifies it to: Profile → Pick User (done).

**Visual Reference**: The extension follows an exact prototype design that maintains GitHub's native dark theme, typography, and spacing to feel like a natural extension of GitHub's interface.

## Architecture

### Core Components

- **Background Script** (`entrypoints/background.ts`): Service worker managing account storage and message passing
- **Content Script** (`entrypoints/content/index.ts`): Injected into GitHub pages for user detection and UI manipulation
- **Shared Configuration** (`web-extension-config.ts`): Centralized types, constants, and configuration

### Data Flow

1. Content script detects current GitHub user from DOM profile elements
2. Account data stored via background script's AccountStorageManager using browser.storage.local
3. UI dropdown injected into GitHub's profile button area with native styling
4. Account switching triggers navigation to target user's profile URL

### Message Passing Architecture

Uses enum-based MessageType system for background-content communication:

- `SWITCH_ACCOUNT`, `ADD_ACCOUNT`, `GET_ACCOUNTS`, `DETECT_USER`, `DROPDOWN_TOGGLE`
- Implements class-based storage managers in both background and content scripts

## Development Commands

### Core Development

- `pnpm dev` - Development mode with hot reload (auto-opens Chrome)
- `pnpm build` - Production build (outputs to `dist/chrome-mv3/`)
- `pnpm compile` - TypeScript type checking without emit

### Browser-Specific Development

- `pnpm dev:firefox` / `pnpm dev:chrome` / `pnpm dev:opera` - Browser-specific dev modes
- `pnpm build:firefox` / `pnpm build:chrome` / `pnpm build:opera` - Browser-specific builds
- `pnpm zip:chrome` / `pnpm zip:firefox` / `pnpm zip:opera` - Create distribution packages

### Testing

- `pnpm test` - Run Jest tests with custom browser API mocks
- `pnpm test:watch` - Run tests in watch mode
- Run single test: `pnpm test __tests__/background/state.test.ts`

### Code Quality

- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Testing Setup

- **Framework**: Jest with JSDOM environment
- **Mock Strategy**: Complete browser API mock in `__tests__/setup.ts` with webextension-polyfill compatibility
- **Test Organization**: Tests organized by functionality in `__tests__/` (background/, content/, helpers/)
- **Pattern**: Uses custom `createMockBrowser()` helper for consistent browser API mocking

## Development Features

### Mock Accounts for Testing

Enable test accounts by:

1. Set `debug = true` in `web-extension-config.ts`
2. Uncomment mock account code in `entrypoints/content/index.ts` around line 512
3. Reload extension to see mock accounts in dropdown

This enables testing without multiple real GitHub accounts.

### Debugging

- **Background Script**: Chrome Extensions � Developer mode � "Inspect views: background page"
- **Content Script**: Standard browser DevTools on any GitHub page
- **Console Logs**: All prefixed with "GitHub SwitchMe"

## Key Configuration

### Extension Manifest (via wxt.config.ts)

- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: `https://github.com/*`
- **Content Security Policy**: Restricted script execution
- **Framework**: Uses WXT's `defineBackground` and `defineContentScript` utilities

### TypeScript Configuration

- Extends WXT's base TypeScript config
- Custom type definitions in `types/global.d.ts` for browser APIs
- Includes custom Jest type definitions

## Code Standards & Best Practices

### TypeScript Standards

- Use TypeScript strict mode throughout
- Follow browser extension manifest v3 patterns
- Use async/await for all storage operations
- Implement proper error boundaries and handling

### GitHub Integration Rules

- **Target ONLY** `github.com` domain
- Use GitHub's existing CSS classes when possible (`var(--color-canvas-overlay)`, `var(--color-border-default)`)
- Match dark/light theme automatically
- Don't interfere with existing GitHub functionality
- Inject dropdown near profile icon with proper z-index management
- Store minimal user data (username, avatar, profile URL)

### UI/UX Guidelines

- Follow the prototype image design exactly
- Use GitHub's native styling patterns
- Smooth animations under 200ms
- Mobile responsive design
- Accessible keyboard navigation
- Proper positioning: dropdown should appear below profile icon with right alignment

### Security & Privacy Rules

- **NO password storage ever** - work with GitHub's existing authentication
- Local storage only, no external APIs or network requests
- Minimal permissions request (only `storage` and `activeTab`)
- Respect user privacy and handle expired sessions gracefully

### Performance Targets

- Bundle size < 200KB
- Injection speed < 100ms
- Memory usage < 5MB
- Zero impact on GitHub page load performance

## Critical Implementation Notes

### Core Requirements

- **The extension MUST reduce clicks from 3 to 1**
- Dropdown must feel native to GitHub's interface
- Handle multiple GitHub page layouts (repo, issues, PRs, profile pages)
- Account detection should be automatic when users navigate between accounts
- Switching should preserve current page context when possible

### Common Pitfalls to Avoid

- Don't hardcode GitHub selectors (they change frequently)
- Don't store sensitive authentication data
- Don't interfere with GitHub's existing JavaScript functionality
- Don't make external network requests
- Don't assume specific page structures across different GitHub layouts

### Testing Requirements

- Test on multiple GitHub pages (repositories, issues, PRs, user profiles)
- Verify theme compatibility (dark/light modes)
- Check mobile responsiveness
- Test with 2+ GitHub accounts logged in simultaneously
- Validate extension doesn't break any existing GitHub features

## Account Data Structure

The extension stores minimal account information:

```typescript
interface GitHubAccount {
  username: string // GitHub username
  displayName: string // Full display name
  avatarUrl: string // Profile avatar URL
  profileUrl: string // Link to user's profile
  isCurrent: boolean // Whether this is the active account
  lastUsed: Date // Last time this account was used
}
```

## Implementation Notes

- Account switching works by navigating to profile URLs, not manipulating authentication
- Extension only works with accounts already logged into GitHub
- GitHub DOM selectors target specific profile elements and may need updates if GitHub changes UI
- Storage operations are async with comprehensive error handling
- Uses browser.storage.local for account persistence across sessions
- Extension evolved from a LinkedIn-based codebase with all LinkedIn logic removed
