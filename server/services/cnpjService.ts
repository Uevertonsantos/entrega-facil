import fetch from 'node-fetch';

export interface CnpjInfo {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
  cnae_fiscal_descricao: string;
}

/**
 * Busca informações do CNPJ na API da Receita Federal
 * @param cnpj CNPJ para consulta (apenas números)
 * @returns Informações do CNPJ ou null se não encontrado
 */
export async function fetchCnpjInfo(cnpj: string): Promise<CnpjInfo | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    // Valida se tem 14 dígitos
    if (cleanCnpj.length !== 14) {
      return null;
    }
    
    // Usa a API gratuita da Receita Federal via proxy
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as any;
    
    // Verifica se a consulta foi bem-sucedida
    if (data.status === 'ERROR') {
      return null;
    }
    
    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || data.razao_social || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep || '',
      telefone: data.telefone || '',
      email: data.email || '',
      situacao: data.situacao || '',
      cnae_fiscal_descricao: data.cnae_fiscal_descricao || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error);
    return null;
  }
}

/**
 * Valida se um CNPJ é válido
 * @param cnpj CNPJ para validação
 * @returns true se válido, false caso contrário
 */
export function validateCnpj(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const digits = cleanCnpj.split('').map(Number);
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i];
  }
  const remainder1 = sum % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  
  if (digits[12] !== digit1) {
    return false;
  }
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i];
  }
  const remainder2 = sum % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return digits[13] === digit2;
}

/**
 * Valida se um CPF é válido
 * @param cpf CPF para validação
 * @returns true se válido, false caso contrário
 */
export function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }
  
  const digits = cleanCpf.split('').map(Number);
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  const remainder1 = sum % 11;
  const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  
  if (digits[9] !== digit1) {
    return false;
  }
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  const remainder2 = sum % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return digits[10] === digit2;
}

/**
 * Formata CNPJ para exibição
 * @param cnpj CNPJ para formatação
 * @returns CNPJ formatado
 */
export function formatCnpj(cnpj: string): string {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  return cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF para exibição
 * @param cpf CPF para formatação
 * @returns CPF formatado
 */
export function formatCpf(cpf: string): string {
  const cleanCpf = cpf.replace(/\D/g, '');
  return cleanCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}