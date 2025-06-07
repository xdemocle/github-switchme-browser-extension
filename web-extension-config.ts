/**
 * GitHub SwitchMe - Shared Configuration
 *
 * This file contains shared configuration values used across the extension.
 * Centralizing these values makes maintenance easier and reduces duplication.
 */

// The target website URL (without trailing slash)
export const targetWebsite = 'https://www.github.com';

// The website URL pattern used for matching in content scripts and permissions
export const targetWebsitePattern = `${targetWebsite}/*`;

// Extension name and description
export const extensionName = 'GitHub SwitchMe';
export const extensionDescription = 'Quick switch between your GitHub accounts with zero hassle.';
