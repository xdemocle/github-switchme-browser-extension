/**
 * GitHub SwitchMe - Content Script
 *
 * This script detects the current GitHub user, manages account switching,
 * and injects a dropdown menu for quick account switching.
 */

// Import defineContentScript from WXT's utility module
import { defineContentScript } from 'wxt/utils/define-content-script'
import { type GitHubAccount, STORAGE_KEYS } from '../../web-extension-config'

export default defineContentScript({
  matches: ['https://github.com/*'],
  runAt: 'document_end',
  allFrames: false,
  main() {
    console.log('GitHub SwitchMe - Content script loaded')

    // Storage management
    class AccountStorage {
      static async getAccounts(): Promise<GitHubAccount[]> {
        try {
          const result = await browser.storage.local.get(STORAGE_KEYS.ACCOUNTS)
          return result[STORAGE_KEYS.ACCOUNTS] || []
        } catch (error) {
          console.error('GitHub SwitchMe - Error getting accounts:', error)
          return []
        }
      }

      static async storeAccount(account: GitHubAccount): Promise<void> {
        try {
          const accounts = await this.getAccounts()
          const existingIndex = accounts.findIndex((a) => a.username === account.username)

          if (existingIndex >= 0) {
            accounts[existingIndex] = account
          } else {
            accounts.push(account)
          }

          await browser.storage.local.set({
            [STORAGE_KEYS.ACCOUNTS]: accounts,
          })

          console.log('GitHub SwitchMe - Account stored:', account.username)
        } catch (error) {
          console.error('GitHub SwitchMe - Error storing account:', error)
        }
      }

      static async getCurrentUser(): Promise<string | null> {
        try {
          const result = await browser.storage.local.get(STORAGE_KEYS.CURRENT_USER)
          return result[STORAGE_KEYS.CURRENT_USER] || null
        } catch (error) {
          console.error('GitHub SwitchMe - Error getting current user:', error)
          return null
        }
      }
    }

    // GitHub user detection
    class GitHubUserDetector {
      static detectCurrentUser(): GitHubAccount | null {
        try {
          console.log('GitHub SwitchMe - Detecting current GitHub user...')

          // For testing - create a test account if needed
          // const createTestAccount = (): GitHubAccount => {
          //   console.log('GitHub SwitchMe - CREATING TEST ACCOUNT')
          //   return {
          //     username: 'testuser',
          //     displayName: 'Test User',
          //     avatarUrl: 'https://github.com/identicons/testuser.png',
          //     profileUrl: 'https://github.com/testuser',
          //     lastUsed: new Date(),
          //     isCurrent: true,
          //   }
          // }

          // Try different selectors for GitHub user detection
          let username = ''
          let displayName = ''
          let avatarUrl = ''
          let profileUrl = ''

          // Try to get username from meta tag first (most reliable)
          const userMeta = document.querySelector(
            'meta[name="user-login"]'
          ) as HTMLMetaElement | null
          if (userMeta && userMeta.content) {
            console.log('GitHub SwitchMe - Found username in meta tag:', userMeta.content)
            username = userMeta.content
          }

          // Alternative selectors for username
          if (!username) {
            // Try header dropdown
            const summaryDetail = document.querySelector('details.Header-item summary.Header-link')
            if (summaryDetail) {
              const img = summaryDetail.querySelector('img')
              if (img && img.alt) {
                console.log('GitHub SwitchMe - Found username in header dropdown:', img.alt)
                username = img.alt
                avatarUrl = img.src || ''
              }
            }
          }

          // Try to get user info from profile elements with data-login attribute
          if (!username) {
            const profileElements = document.querySelectorAll('[data-login]')
            if (profileElements.length > 0) {
              const profileElement = profileElements[0] as HTMLElement | null
              username = profileElement?.getAttribute('data-login') || ''
              console.log('GitHub SwitchMe - Found username in data-login attribute:', username)
            }
          }

          // Try from avatar if still not found
          if (!username) {
            const avatarImg = document.querySelector(
              '.Header-link--profile img, .avatar-user, [data-testid="user-avatar"] img'
            ) as HTMLImageElement | null

            if (avatarImg) {
              // Get avatar URL
              avatarUrl = avatarImg.src || ''

              // Try to get username from alt text or title
              if (avatarImg.alt) {
                username = avatarImg.alt
                displayName = avatarImg.alt
                console.log('GitHub SwitchMe - Found username from avatar alt text:', username)
              } else if (avatarImg.title) {
                username = avatarImg.title
                displayName = avatarImg.title
                console.log('GitHub SwitchMe - Found username from avatar title:', username)
              }
            }
          }

          // Build profile URL
          if (username) {
            profileUrl = `https://github.com/${username}`

            // Use display name same as username if not found
            if (!displayName) {
              displayName = username
            }

            console.log('GitHub SwitchMe - Detected user:', {
              username,
              displayName,
              avatarUrl,
              profileUrl,
            })

            return {
              username,
              displayName,
              avatarUrl,
              profileUrl,
              lastUsed: new Date(),
              isCurrent: true,
            }
          }

          // Use a test account if nothing is detected (for development)
          // Uncomment for testing
          // return createTestAccount()

          console.warn('GitHub SwitchMe - No user detected on GitHub')
          return null
        } catch (error) {
          console.error('GitHub SwitchMe - Error detecting user:', error)
          return null
        }
      }
    }

    // Dropdown UI management
    class DropdownManager {
      private dropdown: HTMLElement | null = null
      private isVisible = false

      constructor() {
        this.createDropdown()
        this.setupEventListeners()
      }

      private createDropdown(): void {
        // Remove existing dropdown if any
        const existing = document.getElementById('github-switchme-dropdown')

        if (existing) {
          existing.remove()
        }

        // Create dropdown container
        this.dropdown = document.createElement('div')
        this.dropdown!.id = 'github-switchme-dropdown'
        this.dropdown!.className = 'github-switchme-dropdown'
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
        `

        document.body.appendChild(this.dropdown!)
      }

      private setupEventListeners(): void {
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
          if (this.dropdown && !this.dropdown.contains(event.target as Node)) {
            const profileButton = document.querySelector('.Header-link--profile')
            if (profileButton && !profileButton.contains(event.target as Node)) {
              this.hide()
            }
          }
        })

        // Close dropdown on escape key
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && this.isVisible) {
            this.hide()
          }
        })
      }

      async show(): Promise<void> {
        try {
          // Create dropdown if it doesn't exist
          if (!this.dropdown) {
            this.createDropdown()
          }

          // Get accounts
          const accounts = await AccountStorage.getAccounts()
          console.log('GitHub SwitchMe - Retrieved accounts for dropdown:', accounts)

          if (!accounts || accounts.length === 0) {
            console.warn('GitHub SwitchMe - No accounts found, showing empty state')
            // Still show dropdown with empty state
          }

          // Find profile button for positioning
          const profileButtons = [
            document.querySelector('.Header-link--profile'),
            document.querySelector('summary.Header-link'),
            document.querySelector('[data-target="react-partial-anchor.anchor"]'),
            document.querySelector('[data-testid="user-avatar"]'),
          ]

          // Find the first working selector
          const profileButton = profileButtons.find((button) => button !== null)

          if (profileButton) {
            const rect = profileButton.getBoundingClientRect()
            const dropdownElement = this.dropdown as HTMLElement

            // Position the dropdown correctly
            dropdownElement.style.display = 'block' // Make visible first
            dropdownElement.style.position = 'fixed'
            dropdownElement.style.top = `${rect.bottom + 2}px`
            dropdownElement.style.right = `${window.innerWidth - rect.right}px`
            dropdownElement.style.zIndex = '100'

            // Clear and render accounts
            dropdownElement.innerHTML = ''
            this.renderAccounts(accounts)

            console.log('GitHub SwitchMe - Dropdown positioned and displayed')
          } else {
            console.warn('GitHub SwitchMe - No profile button found for positioning')
            // Position in top right as fallback
            const dropdownElement = this.dropdown as HTMLElement
            dropdownElement.style.cssText = `
              position: fixed;
              top: 60px;
              right: 20px;
              display: block;
              z-index: 100;
            `
            dropdownElement.innerHTML = ''
            this.renderAccounts(accounts)
          }

          this.isVisible = true

          // Close dropdown when clicking outside
          setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick, { once: true })
            console.log('GitHub SwitchMe - Added document click listener')
          }, 100)
        } catch (error) {
          console.error('GitHub SwitchMe - Error showing dropdown:', error)
        }
      }

      private handleOutsideClick = (event: MouseEvent): void => {
        if (this.dropdown && !this.dropdown.contains(event.target as Node)) {
          this.hide()
        }
      }

      hide(): void {
        if (this.dropdown) {
          ;(this.dropdown as HTMLElement).style.display = 'none'
        }

        this.isVisible = false
      }

      private renderAccounts(accounts: GitHubAccount[]): void {
        if (!this.dropdown) return

        console.log('GitHub SwitchMe - Rendering accounts:', accounts)

        // Clear existing content
        this.dropdown!.innerHTML = ''

        // Create header
        const header = document.createElement('div')
        header.style.cssText = `
          padding: 8px 8px 0;
          color: var(--color-fg-muted);
          font-size: 12px;
          font-weight: 500;
        `
        header.textContent = 'Switch account'
        this.dropdown!.appendChild(header)

        if (!accounts || accounts.length === 0) {
          const emptyState = document.createElement('div')
          emptyState.className = 'github-switchme-empty'
          emptyState.style.cssText = `
            padding: 16px;
            text-align: center;
            color: var(--color-fg-muted);
            font-size: 14px;
          `
          emptyState.textContent = 'No other accounts found'
          this.dropdown!.appendChild(emptyState)
          return
        }

        // Add accounts to dropdown
        const currentUser = accounts.find((acc) => acc.isCurrent)
        const otherAccounts = accounts.filter((acc) => !acc.isCurrent)

        console.log('GitHub SwitchMe - Current user:', currentUser)
        console.log('GitHub SwitchMe - Other accounts:', otherAccounts)

        const accountsList = document.createElement('div')
        accountsList.style.cssText = `
          padding: 8px 0;
        `

        // Show current account first if exists
        if (currentUser) {
          this.renderAccountItem(currentUser, true)

          if (otherAccounts.length > 0) {
            const separator = document.createElement('div')
            separator.style.cssText = `
              height: 1px;
              margin: 8px;
              background: var(--color-border-muted);
            `
            accountsList.appendChild(separator)
          }
        }

        // Show other accounts
        otherAccounts.forEach((account) => {
          this.renderAccountItem(account, false)
        })

        this.dropdown!.appendChild(accountsList)
      }

      private renderAccountItem(account: GitHubAccount, isCurrent: boolean): void {
        if (!this.dropdown) return

        const item = document.createElement('div')
        item.className = 'github-switchme-account-item'
        item.style.cssText = `
          display: flex;
          align-items: center;
          padding: 8px;
          margin: 0 8px;
          cursor: ${isCurrent ? 'default' : 'pointer'};
          border-radius: 6px;
          transition: background-color 0.1s ease;
          background: ${isCurrent ? 'var(--color-accent-subtle)' : 'transparent'};
          opacity: ${isCurrent ? '0.8' : '1'};
        `

        if (!isCurrent) {
          item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--color-neutral-muted)'
          })

          item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent'
          })

          item.addEventListener('click', () => {
            this.switchToAccount(account)
          })
        }

        // Avatar
        const avatar = document.createElement('img')
        avatar.src = account.avatarUrl || `https://github.com/${account.username}.png?size=32`
        avatar.alt = account.displayName
        avatar.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 8px;
          flex-shrink: 0;
          border: 1px solid var(--color-border-subtle);
        `

        // Account info
        const info = document.createElement('div')
        info.style.cssText = `
          flex: 1;
          min-width: 0;
          line-height: 1.2;
        `

        const name = document.createElement('div')
        name.textContent = account.displayName
        name.style.cssText = `
          font-weight: 500;
          color: var(--color-fg-default);
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `

        const username = document.createElement('div')
        username.textContent = `@${account.username}`
        username.style.cssText = `
          color: var(--color-fg-muted);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `

        info.appendChild(name)
        info.appendChild(username)

        // Current indicator
        if (isCurrent) {
          const indicator = document.createElement('div')
          indicator.textContent = '✓'
          indicator.style.cssText = `
            color: var(--color-success-fg);
            font-weight: bold;
            margin-left: 8px;
          `
          item.appendChild(avatar)
          item.appendChild(info)
          item.appendChild(indicator)
        } else {
          item.appendChild(avatar)
          item.appendChild(info)
        }

        // Add to accounts list instead of dropdown directly
        const accountsList = this.dropdown!.querySelector('div:last-child')
        if (accountsList) {
          accountsList.appendChild(item)
        }
      }

      private switchToAccount(account: GitHubAccount): void {
        console.log('GitHub SwitchMe - Switching to account:', account.username)

        // Navigate to the account's GitHub profile
        window.location.href = account.profileUrl

        this.hide()
      }
    }

    // Main initialization
    const initializeSwitchMe = async (): Promise<void> => {
      try {
        console.log('GitHub SwitchMe - Initializing...')

        // Create a test account for development
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

        // Verify accounts are stored
        const accounts = await AccountStorage.getAccounts()
        console.log('GitHub SwitchMe - Test accounts stored:', accounts)

        // Detect current user
        const currentUser = GitHubUserDetector.detectCurrentUser()

        if (currentUser) {
          console.log('GitHub SwitchMe - Current user detected:', currentUser.username)

          // Update current user's status
          const updatedCurrentUser = {
            ...currentUser,
            isCurrent: true,
            lastUsed: new Date(),
          }

          // Store the current user
          await AccountStorage.storeAccount(updatedCurrentUser)
        }

        // Initialize dropdown manager
        const dropdownManager = new DropdownManager()

        // Add click handler to profile button for GitHub
        const profileButtons = [
          document.querySelector('.Header-link--profile'),
          document.querySelector('summary.Header-link'),
          document.querySelector('[data-target="react-partial-anchor.anchor"]'),
          document.querySelector('[data-testid="user-avatar"]'),
        ]

        // Find the first working selector
        const profileButton = profileButtons.find((button) => button !== null)

        if (profileButton) {
          // Use click instead of mouseover for better control
          profileButton.addEventListener('click', async (event) => {
            event.preventDefault()
            event.stopPropagation()

            await dropdownManager.show()
            console.log('GitHub SwitchMe - Dropdown shown on click')
          })

          console.log('GitHub SwitchMe - Profile button click handler added')
        } else {
          console.warn('GitHub SwitchMe - Profile button not found')
        }
      } catch (error) {
        console.error('GitHub SwitchMe - Initialization error:', error)
      }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSwitchMe)
    } else {
      // DOM is already ready
      initializeSwitchMe()
    }

    // Re-initialize on GitHub's dynamic navigation
    let lastUrl = location.href
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href
        console.log('GitHub SwitchMe - Page navigation detected, re-initializing...')
        setTimeout(initializeSwitchMe, 500) // Small delay for DOM updates
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    console.log('GitHub SwitchMe - Content script initialization complete')
  },
})
