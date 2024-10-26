export interface User {
  id: number;
  username: string;
  password: string;
  mfa_enabled: boolean;
  mfa_secret: string;
  mfa_backup_codes?: string;
}