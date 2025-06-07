/**
 * GitHub SwitchMe - Content Script
 *
 * This script detects the current GitHub user, manages account switching,
 * and injects a dropdown menu for quick account switching.
 */

// Import defineContentScript from WXT's utility module
import { defineContentScript } from 'wxt/utils/define-content-script';
import { type GitHubAccount, MessageType, type Message, STORAGE_KEYS } from '../../web-extension-config';

export default defineContentScript({
  matches: ['https://github.com/*'],
  runAt: 'document_end',
  allFrames: false,
  main() {

  console.log('GitHub SwitchMe - Content script loaded');

  // Storage management
  class AccountStorage {
    static async getAccounts(): Promise<GitHubAccount[]> {
      try {
        const result = await browser.storage.local.get(STORAGE_KEYS.ACCOUNTS);
        return result[STORAGE_KEYS.ACCOUNTS] || [];
      } catch (error) {
        console.error('GitHub SwitchMe - Error getting accounts:', error);
        return [];
      }
    }

    static async storeAccount(account: GitHubAccount): Promise<void> {
      try {
        const accounts = await this.getAccounts();
        const existingIndex = accounts.findIndex(a => a.username === account.username);

        if (existingIndex >= 0) {
          accounts[existingIndex] = account;
        } else {
          accounts.push(account);
        }

        await browser.storage.local.set({
          [STORAGE_KEYS.ACCOUNTS]: accounts
        });

        console.log('GitHub SwitchMe - Account stored:', account.username);
      } catch (error) {
        console.error('GitHub SwitchMe - Error storing account:', error);
      }
    }

    static async getCurrentUser(): Promise<string | null> {
      try {
        const result = await browser.storage.local.get(STORAGE_KEYS.CURRENT_USER);
        return result[STORAGE_KEYS.CURRENT_USER] || null;
      } catch (error) {
        console.error('GitHub SwitchMe - Error getting current user:', error);
        return null;
      }
    }
  }

  // GitHub user detection
  class GitHubUserDetector {
    static detectCurrentUser(): GitHubAccount | null {
      try {
        // Try different selectors for GitHub user detection
        const selectors = [
          'meta[name="user-login"]',
          '[data-login]',
          '.Header-link--profile img',
          '.avatar-user',
          '[aria-label="View profile and more"]'
        ];

        let username = '';
        let displayName = '';
        let avatarUrl = '';
        let profileUrl = '';

        // Try to get username from meta tag first
        const userMeta = document.querySelector('meta[name="user-login"]') as HTMLMetaElement | null;
        if (userMeta && userMeta.content) {
          username = userMeta.content;
        }

        // Try to get user info from profile elements
        if (!username) {
          const profileElements = document.querySelectorAll('[data-login]');
          if (profileElements.length > 0) {
            const profileElement = profileElements[0] as HTMLElement | null;
            username = profileElement?.getAttribute('data-login') || '';
          }
        }

        // Try to get avatar and profile URL
        const avatarImg = document.querySelector('.Header-link--profile img, .avatar-user') as HTMLImageElement | null;
        if (avatarImg) {
          avatarUrl = avatarImg.src || '';

          // Try to get display name from alt text
          if (avatarImg.alt && avatarImg.alt !== username) {
            displayName = avatarImg.alt;
          }
        }

        // Build profile URL
        if (username) {
          profileUrl = `https://github.com/${username}`;

          // Use display name same as username if not found
          if (!displayName) {
            displayName = username;
          }

          return {
            username,
            displayName,
            avatarUrl,
            profileUrl,
            lastUsed: new Date(),
            isCurrent: true
          };
        }

        return null;
      } catch (error) {
        console.error('GitHub SwitchMe - Error detecting user:', error);
        return null;
      }
    }
  }

  // Dropdown UI management
  class DropdownManager {
    private dropdown: HTMLElement | null = null;
    private isVisible = false;

    constructor() {
      this.createDropdown();
      this.setupEventListeners();
    }

    private createDropdown(): void {
      // Remove existing dropdown if any
      const existing = document.getElementById('github-switchme-dropdown');
      if (existing) {
        existing.remove();
      }

      // Create dropdown container
      this.dropdown = document.createElement('div');
      this.dropdown!.id = 'github-switchme-dropdown';
      this.dropdown!.className = 'github-switchme-dropdown';
      this.dropdown!.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 10000;
        display: none;
        min-width: 200px;
        max-width: 300px;
        background: var(--color-canvas-overlay, #ffffff);
        border: 1px solid var(--color-border-default, #d0d7de);
        border-radius: 6px;
        box-shadow: var(--color-shadow-large, 0 8px 24px rgba(140, 149, 159, 0.2));
        padding: 8px 0;
        margin-top: 2px;
      `;

      document.body.appendChild(this.dropdown!);
    }

    private setupEventListeners(): void {
      // Close dropdown when clicking outside
      document.addEventListener('click', (event) => {
        if (this.dropdown && !this.dropdown.contains(event.target as Node)) {
          const profileButton = document.querySelector('.Header-link--profile');
          if (profileButton && !profileButton.contains(event.target as Node)) {
            this.hide();
          }
        }
      });

      // Close dropdown on escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isVisible) {
          this.hide();
        }
      });
    }

    async show(): Promise<void> {
      if (!this.dropdown) return;

      try {
        const accounts = await AccountStorage.getAccounts();
        this.renderAccounts(accounts);

        // Position dropdown near profile button
        const profileButton = document.querySelector('.Header-link--profile');
        if (profileButton) {
          const rect = profileButton.getBoundingClientRect();
          const dropdownElement = this.dropdown as HTMLElement;
          dropdownElement.style.cssText += `
            position: fixed;
            top: ${rect.bottom + 2}px;
            right: ${window.innerWidth - rect.right}px;
            display: block;
          `;
        } else {
          (this.dropdown as HTMLElement).style.display = 'block';
        }

        this.isVisible = true;
      } catch (error) {
        console.error('GitHub SwitchMe - Error showing dropdown:', error);
      }
    }

    hide(): void {
      if (this.dropdown) {
        (this.dropdown as HTMLElement).style.display = 'none';
      }
      this.isVisible = false;
    }

    private renderAccounts(accounts: GitHubAccount[]): void {
      if (!this.dropdown) return;

      // Clear existing content
      this.dropdown!.innerHTML = '';

      if (accounts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'github-switchme-empty';
        emptyState.style.cssText = `
          padding: 16px;
          text-align: center;
          color: var(--color-fg-muted, #656d76);
          font-size: 12px;
        `;
        emptyState.textContent = 'No other accounts found';
        this.dropdown!.appendChild(emptyState);
        return;
      }

      // Add accounts to dropdown
      const currentUser = accounts.find(acc => acc.isCurrent);
      const otherAccounts = accounts.filter(acc => !acc.isCurrent);

      // Show current account first if exists
      if (currentUser) {
        this.renderAccountItem(currentUser, true);

        if (otherAccounts.length > 0) {
          const separator = document.createElement('div');
          separator.style.cssText = `
            height: 1px;
            background: var(--color-border-muted, #d8dee4);
            margin: 8px 0;
          `;
          this.dropdown!.appendChild(separator);
        }
      }

      // Show other accounts
      otherAccounts.forEach(account => {
        this.renderAccountItem(account, false);
      });
    }

    private renderAccountItem(account: GitHubAccount, isCurrent: boolean): void {
      if (!this.dropdown) return;

      const item = document.createElement('div');
      item.className = 'github-switchme-account-item';
      item.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: ${isCurrent ? 'default' : 'pointer'};
        transition: background-color 0.1s ease;
        background: ${isCurrent ? 'var(--color-accent-subtle, #ddf4ff)' : 'transparent'};
        opacity: ${isCurrent ? '0.7' : '1'};
      `;

      if (!isCurrent) {
        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--color-neutral-muted, #f6f8fa)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent';
        });

        item.addEventListener('click', () => {
          this.switchToAccount(account);
        });
      }

      // Avatar
      const avatar = document.createElement('img');
      avatar.src = account.avatarUrl || `https://github.com/${account.username}.png?size=32`;
      avatar.alt = account.displayName;
      avatar.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 8px;
        flex-shrink: 0;
      `;

      // Account info
      const info = document.createElement('div');
      info.style.cssText = `
        flex: 1;
        min-width: 0;
      `;

      const name = document.createElement('div');
      name.textContent = account.displayName;
      name.style.cssText = `
        font-weight: 500;
        color: var(--color-fg-default, #24292f);
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      const username = document.createElement('div');
      username.textContent = `@${account.username}`;
      username.style.cssText = `
        color: var(--color-fg-muted, #656d76);
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      info.appendChild(name);
      info.appendChild(username);

      // Current indicator
      if (isCurrent) {
        const indicator = document.createElement('div');
        indicator.textContent = '✓';
        indicator.style.cssText = `
          color: var(--color-success-fg, #1a7f37);
          font-weight: bold;
          margin-left: 8px;
        `;
        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(indicator);
      } else {
        item.appendChild(avatar);
        item.appendChild(info);
      }

      this.dropdown!.appendChild(item);
    }

    private switchToAccount(account: GitHubAccount): void {
      console.log('GitHub SwitchMe - Switching to account:', account.username);

      // Navigate to the account's GitHub profile
      window.location.href = account.profileUrl;

      this.hide();
    }
  }

  // Main initialization
  const initializeSwitchMe = async (): Promise<void> => {
    try {
      console.log('GitHub SwitchMe - Initializing...');

      // Detect current user
      const currentUser = GitHubUserDetector.detectCurrentUser();

      if (currentUser) {
        console.log('GitHub SwitchMe - Current user detected:', currentUser.username);

        // Store the current user
        await AccountStorage.storeAccount(currentUser);

        // Initialize dropdown manager
        const dropdownManager = new DropdownManager();

        // Add click handler to profile button
        const profileButton = document.querySelector('.Header-link--profile');

        if (profileButton) {
          profileButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            await dropdownManager.show();
          });

          console.log('GitHub SwitchMe - Profile button click handler added');
        } else {
          console.warn('GitHub SwitchMe - Profile button not found');
        }
      } else {
        console.log('GitHub SwitchMe - No user detected, user might not be logged in');
      }

    } catch (error) {
      console.error('GitHub SwitchMe - Initialization error:', error);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSwitchMe);
  } else {
    // DOM is already ready
    initializeSwitchMe();
  }

  // Re-initialize on GitHub's dynamic navigation
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('GitHub SwitchMe - Page navigation detected, re-initializing...');
      setTimeout(initializeSwitchMe, 500); // Small delay for DOM updates
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

    console.log('GitHub SwitchMe - Content script initialization complete');
  }
});
