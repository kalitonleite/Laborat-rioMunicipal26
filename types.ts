
export enum UserRole {
  PATIENT = 'PATIENT',
  MEDICAL = 'MEDICAL',
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  sus_number?: string;
  role: UserRole;
  avatar?: string;
  age?: number;
  gender?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'AVISO' | 'CAMPANHA' | 'SAUDE';
  active: boolean;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'PDF' | 'AUDIO' | 'VIDEO' | 'NONE';
}

export interface ExamResult {
  id: string;
  patientId: string;
  patientName: string;
  patientCpf: string;
  examName: string;
  date: string;
  status: 'PENDING' | 'READY' | 'ANALYZED';
  resultData?: string;
  aiAnalysis?: string;
  fileUrl?: string;
  category?: string;
  requestingUnit?: string;
  previousValue?: string;
}

export interface DoctorNote {
  id: string;
  doctorId: string;
  patientCpf: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCpf?: string;
  date: string;
  time: string;
  examType: string;
}
