export type AppIconName =
  | 'close'
  | 'dashboard'
  | 'menu'
  | 'profile'
  | 'timestamp'

export interface NavigationItem {
  label: string
  icon: AppIconName
  routeName: 'dashboard' | 'profile' | 'timestamp'
}

