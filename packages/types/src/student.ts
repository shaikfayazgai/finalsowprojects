export type StudentStatus = 'active' | 'alumni' | 'suspended'
export type AlumniStatus = 'reactivation_pending' | 'active_alumni'

export interface StudentProfile {
  userId: string
  universityEmail: string
  studentId: string
  universityName: string
  academicYear: number
  graduationYear?: number
  status: StudentStatus
}

export interface AlumniProfile {
  userId: string
  universityName: string
  graduationYear: number
  currentEmployment?: string
  previousPoDLCount: number
  status: AlumniStatus
}
