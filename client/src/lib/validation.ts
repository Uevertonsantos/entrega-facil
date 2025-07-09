/**
 * Valida se um CNPJ é válido
 * @param cnpj CNPJ para validação
 * @returns true se válido, false caso contrário
 */
export function validateCnpj(cnpj: string): boolean {
  // Remove caracteres especiais
  const cleanCnpj = cnpj.replace(/[^\d]+/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCnpj[i]) * weight;
    weight++;
    if (weight > 9) weight = 2;
  }
  
  const remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCnpj[12]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCnpj[i]) * weight;
    weight++;
    if (weight > 9) weight = 2;
  }
  
  const remainder2 = sum % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return parseInt(cleanCnpj[13]) === digit2;
}

/**
 * Valida se um CPF é válido
 * @param cpf CPF para validação
 * @returns true se válido, false caso contrário
 */
export function validateCpf(cpf: string): boolean {
  // Remove caracteres especiais
  const cleanCpf = cpf.replace(/[^\d]+/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCpf[9]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCpf[10]) === digit2;
}

/**
 * Formata CNPJ para exibição
 * @param cnpj CNPJ para formatação
 * @returns CNPJ formatado
 */
export function formatCnpj(cnpj: string): string {
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  return cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF para exibição
 * @param cpf CPF para formatação
 * @returns CPF formatado
 */
export function formatCpf(cpf: string): string {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  return cleanCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}