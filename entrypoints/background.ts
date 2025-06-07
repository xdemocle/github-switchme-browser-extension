/**
 * GitHub SwitchMe - Background Script
 *
 * This script manages GitHub account storage and handles communication with content scripts.
 * It provides persistent storage for GitHub accounts and facilitates account switching.
 */

// Import defineBackground from WXT's utility module
import { defineBackground } from 'wxt/utils/define-background'
import {
  type GitHubAccount,
  MessageType,
  type Message,
  STORAGE_KEYS,
} from '../web-extension-config'

export default defineBackground(() => {
  console.log('GitHub SwitchMe - Background script loaded')

  /**
   * Account Storage Manager
   * Handles all storage operations for GitHub accounts
   */
  class AccountStorageManager {
    /**
     * Gets all stored GitHub accounts
     */
    async getAccounts(): Promise<GitHubAccount[]> {
      try {
        const result = await browser.storage.local.get(STORAGE_KEYS.ACCOUNTS)
        return result[STORAGE_KEYS.ACCOUNTS] || []
      } catch (error) {
        console.error('GitHub SwitchMe - Error getting accounts:', error)
        return []
      }
    }

    /**
     * Stores a GitHub account
     */
    async storeAccount(account: GitHubAccount): Promise<void> {
      try {
        const accounts = await this.getAccounts()
        const existingIndex = accounts.findIndex((a) => a.username === account.username)

        if (existingIndex >= 0) {
          // Update existing account
          accounts[existingIndex] = account
        } else {
          // Add new account
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

    /**
     * Removes a GitHub account
     */
    async removeAccount(username: string): Promise<void> {
      try {
        const accounts = await this.getAccounts()
        const filteredAccounts = accounts.filter((a) => a.username !== username)

        await browser.storage.local.set({
          [STORAGE_KEYS.ACCOUNTS]: filteredAccounts,
        })

        console.log('GitHub SwitchMe - Account removed:', username)
      } catch (error) {
        console.error('GitHub SwitchMe - Error removing account:', error)
      }
    }

    /**
     * Sets the current active account
     */
    async setCurrentAccount(username: string): Promise<void> {
      try {
        const accounts = await this.getAccounts()
        const updatedAccounts = accounts.map((account) => ({
          ...account,
          isCurrent: account.username === username,
          lastUsed: account.username === username ? new Date() : account.lastUsed,
        }))

        await browser.storage.local.set({
          [STORAGE_KEYS.ACCOUNTS]: updatedAccounts,
          [STORAGE_KEYS.CURRENT_USER]: username,
        })

        console.log('GitHub SwitchMe - Current account set:', username)
      } catch (error) {
        console.error('GitHub SwitchMe - Error setting current account:', error)
      }
    }

    /**
     * Gets the current active account
     */
    async getCurrentAccount(): Promise<GitHubAccount | null> {
      try {
        const accounts = await this.getAccounts()
        return accounts.find((a) => a.isCurrent) || null
      } catch (error) {
        console.error('GitHub SwitchMe - Error getting current account:', error)
        return null
      }
    }
  }

  const accountManager = new AccountStorageManager()

  /**
   * Handles messages from content scripts
   */
  browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    console.log('GitHub SwitchMe - Background received message:', message)

    switch (message.type) {
      case MessageType.GET_ACCOUNTS:
        accountManager
          .getAccounts()
          .then((accounts) => {
            sendResponse({ success: true, accounts })
          })
          .catch((error) => {
            console.error('GitHub SwitchMe - Error getting accounts:', error)
            sendResponse({ success: false, error: error.message })
          })
        return true // Indicates async response

      case MessageType.ADD_ACCOUNT:
        if (message.payload && message.payload.account) {
          accountManager
            .storeAccount(message.payload.account)
            .then(() => {
              sendResponse({ success: true })
            })
            .catch((error) => {
              console.error('GitHub SwitchMe - Error adding account:', error)
              sendResponse({ success: false, error: error.message })
            })
        } else {
          sendResponse({ success: false, error: 'No account data provided' })
        }
        return true

      case MessageType.SWITCH_ACCOUNT:
        if (message.payload && message.payload.username) {
          accountManager
            .setCurrentAccount(message.payload.username)
            .then(() => {
              sendResponse({ success: true })
            })
            .catch((error) => {
              console.error('GitHub SwitchMe - Error switching account:', error)
              sendResponse({ success: false, error: error.message })
            })
        } else {
          sendResponse({ success: false, error: 'No username provided' })
        }
        return true

      case MessageType.DETECT_USER:
        // Content script is notifying us of a detected user
        if (message.payload && message.payload.account) {
          accountManager
            .storeAccount(message.payload.account)
            .then(() => {
              accountManager.setCurrentAccount(message.payload.account.username).then(() => {
                sendResponse({ success: true })
              })
            })
            .catch((error) => {
              console.error('GitHub SwitchMe - Error handling detected user:', error)
              sendResponse({ success: false, error: error.message })
            })
        } else {
          sendResponse({ success: false, error: 'No user data provided' })
        }
        return true

      default:
        console.warn('GitHub SwitchMe - Unhandled message type:', message.type)
        sendResponse({ success: false, error: 'Unhandled message type' })
        return false
    }
  })

  /**
   * Handle browser action clicks (if popup is not defined)
   * This could be used to show a simple account list in the future
   */
  browser.action?.onClicked?.addListener(async (tab) => {
    console.log('GitHub SwitchMe - Browser action clicked')

    // For now, just log the current accounts
    const accounts = await accountManager.getAccounts()
    console.log('GitHub SwitchMe - Current accounts:', accounts)

    // In the future, we could open a popup or navigate to GitHub
    if (tab.url?.includes('github.com')) {
      // Already on GitHub, could refresh or show notification
      console.log('GitHub SwitchMe - Already on GitHub')
    } else {
      // Navigate to GitHub
      browser.tabs.update(tab.id!, { url: 'https://github.com' })
    }
  })

  /**
   * Handle tab updates to detect GitHub navigation
   */
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only act on GitHub URLs when page is completely loaded
    if (changeInfo.status === 'complete' && tab.url?.includes('github.com')) {
      console.log('GitHub SwitchMe - GitHub page loaded:', tab.url)

      // Send a message to the content script to refresh account detection
      browser.tabs
        .sendMessage(tabId, {
          type: MessageType.DETECT_USER,
        })
        .catch((error) => {
          // Content script might not be ready yet, which is normal
          console.debug('GitHub SwitchMe - Could not send message to tab:', error.message)
        })
    }
  })

  /**
   * Storage change listener to sync accounts across tabs
   */
  browser.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[STORAGE_KEYS.ACCOUNTS]) {
      console.log('GitHub SwitchMe - Accounts storage changed')

      // Notify all GitHub tabs about the account changes
      browser.tabs.query({ url: 'https://github.com/*' }).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            browser.tabs
              .sendMessage(tab.id, {
                type: MessageType.GET_ACCOUNTS,
              })
              .catch((error) => {
                console.debug('GitHub SwitchMe - Could not notify tab:', error.message)
              })
          }
        })
      })
    }
  })

  /**
   * Extension installation/update handler
   */
  browser.runtime.onInstalled.addListener((details) => {
    console.log('GitHub SwitchMe - Extension installed/updated:', details.reason)

    if (details.reason === 'install') {
      console.log('GitHub SwitchMe - First time installation')
      // Could show welcome message or open GitHub
    } else if (details.reason === 'update') {
      console.log('GitHub SwitchMe - Extension updated')
      // Could show changelog or migrate storage if needed
    }
  })

  console.log('GitHub SwitchMe - Background script initialization complete')
})
