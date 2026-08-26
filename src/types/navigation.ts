import type { AppIconName } from './icon'

export interface NavigationItem {
  label: string
  icon: AppIconName
  routeName: 'dashboard' | 'profile' | 'timestamp'
}
