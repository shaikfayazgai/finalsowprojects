export type DeviceType = 'smartphone' | 'laptop' | 'desktop' | 'tablet'
export type InternetStability = 'stable' | 'intermittent' | 'limited'

export interface DeviceInfo {
  userId: string
  primaryDevice: DeviceType
  internetStability: InternetStability
  hasBackupDevice: boolean
  updatedAt: string
}
