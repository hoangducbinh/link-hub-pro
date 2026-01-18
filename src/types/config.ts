export interface WebsiteConfig {
    id: string
    name: string
    url: string
    icon?: string
    group?: string
    requirePassword?: boolean
    sessionType?: 'shared' | 'isolated' | 'grouped'
}

export interface Shortcut {
    id: string
    label: string
    keys: string
    isGlobal: boolean
    enabled: boolean
}

export interface SecurityConfig {
    appLockEnabled: boolean
    passwordHash?: string
    autoLockTimer: number // in minutes, 0 to disable
}

export interface AppConfig {
    version: string
    websites: WebsiteConfig[]
    settings: {
        theme: 'dark' | 'light' | 'system'
        defaultLayout: 'single' | 'split'
    }
    shortcuts: Shortcut[]
    security: SecurityConfig
}
