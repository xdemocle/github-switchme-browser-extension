// Global type definitions for GitHub SwitchMe browser extension

interface BrowserTab {
  id?: number
  url?: string
  active?: boolean
}

interface BrowserAPI {
  action?: {
    setBadgeText: (details: { text: string }) => void
    onClicked?: {
      addListener: (callback: (tab: BrowserTab) => void) => void
    }
  }
  runtime: {
    id: string
    onInstalled: {
      addListener: (callback: (details: { reason: string }) => void) => void
    }
    onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: (response: any) => void
        ) => boolean | void
      ) => void
    }
    onConnect: {
      addListener: (callback: (port: any) => void) => void
    }
    sendMessage: (message: any) => Promise<any>
    connect: (details: any) => {
      name: string
      onDisconnect: {
        addListener: (callback: Function) => void
      }
    }
  }
  tabs: {
    sendMessage: (tabId: number, message: any) => Promise<any>
    query: (queryInfo: { url?: string | string[]; active?: boolean }) => Promise<BrowserTab[]>
    update: (tabId: number, updateProperties: { url: string }) => Promise<BrowserTab>
    onUpdated: {
      addListener: (
        callback: (tabId: number, changeInfo: { status?: string }, tab: BrowserTab) => void
      ) => void
    }
  }
  storage: {
    local: {
      get: (key: string | string[] | object) => Promise<any>
      set: (data: any) => Promise<void>
    }
    onChanged: {
      addListener: (callback: (changes: any, namespace: string) => void) => void
    }
  }
  management: {
    onEnabled: {
      addListener: (callback: Function) => void
    }
  }
  scripting: {
    executeScript: (details: any) => Promise<any>
  }
}

// WXT Framework function declarations
declare function defineBackground(fn: () => void): void
declare function defineContentScript(config?: {
  matches?: string[]
  runAt?: 'document_start' | 'document_end' | 'document_idle'
  allFrames?: boolean
}): (fn: () => void) => void

// Extend the global namespace to include browser and chrome
declare global {
  var browser: BrowserAPI
  var chrome: BrowserAPI
}

export {}
