import { defineConfig } from 'wxt'
import { targetWebsite, extensionName, extensionDescription } from './web-extension-config'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/webextension-polyfill', '@wxt-dev/auto-icons'],
  outDir: 'dist',
  imports: {
    eslintrc: {
      enabled: true,
    },
  },
  manifest: {
    name: extensionName,
    description: extensionDescription,
    permissions: ['storage', 'activeTab'],
    host_permissions: [`${targetWebsite}/*`],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
    },
  },
})
