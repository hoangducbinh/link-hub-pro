export interface WebsiteConfig {
    id: string
    name: string
    url: string
    icon?: string
    group?: string
    requirePassword?: boolean
    sessionType?: 'shared' | 'isolated' | 'grouped'
}

export interface AppConfig {
    version: string
    websites: WebsiteConfig[]
    settings: {
        theme: 'dark' | 'light' | 'system'
        defaultLayout: 'single' | 'split'
    }
}
