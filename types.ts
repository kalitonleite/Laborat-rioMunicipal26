
export enum UserRole {
  PATIENT = 'PATIENT',
  MEDICAL = 'MEDICAL',
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN',
  PENDING_MEDICAL = 'PENDING_MEDICAL',
  PENDING_RECEPTION = 'PENDING_RECEPTION'
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
  email?: string;
  phone?: string;
  mother_name?: string;
  father_name?: string;
  birth_date?: string;
  resides_in_uarini?: boolean;
  civil_status?: string;
  naturalness?: string;
  race_color?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
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
  patientAge?: number;
  patientGender?: string;
  patientSusNumber?: string;
  patientBirthDate?: string;
  patientAddress?: string;
  patientPhone?: string;
  patientAddressNumber?: string;
  date: string;
  time: string;
  status?: string;
  setor?: string;
  codigo_atendimento?: string;
  patientMotherName?: string;
  patientFatherName?: string;
  residesInUarini?: boolean;
  patientCivilStatus?: string;
  patientNaturalness?: string;
  patientRaceColor?: string;
  patientNeighborhood?: string;
  patientResponsibleName?: string;
  patientResponsibleRelationship?: string;
  isUrgency?: boolean;
}

export interface QrCode {
  id: string;
  token: string;
  atendimento_id?: string;
  status: 'active' | 'used';
  created_at: string;
}
