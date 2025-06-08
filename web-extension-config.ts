/**
 * GitHub SwitchMe - Shared Configuration
 *
 * This file contains shared configuration values used across the extension.
 * Centralizing these values makes maintenance easier and reduces duplication.
 */

// The target website URL (without trailing slash)
export const targetWebsite = 'https://github.com'

// The website URL pattern used for matching in content scripts and permissions
export const targetWebsitePattern = `${targetWebsite}/*`

// Development flags
export const debug = false // Set to true to enable test accounts and development features

// Extension name and description
export const extensionName = 'GitHub SwitchMe'
export const extensionDescription = 'Quick switch between your GitHub accounts with zero hassle.'

// GitHub Account Interface
export interface GitHubAccount {
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  isCurrent: boolean
  lastUsed: Date
}

// Message Types for Background-Content Communication
export interface Message {
  type: MessageType
  payload?: any
}

export enum MessageType {
  SWITCH_ACCOUNT = 'SWITCH_ACCOUNT',
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  GET_ACCOUNTS = 'GET_ACCOUNTS',
  DETECT_USER = 'DETECT_USER',
  DROPDOWN_TOGGLE = 'DROPDOWN_TOGGLE',
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCOUNTS: 'github_accounts',
  CURRENT_USER: 'current_user',
} as const
