
export const apiRequest = async (endpoint: string, method: string = 'GET', body: any = null) => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Falha na requisição da API');
  }

  return response.json();
};

export const dbService = {
  from: (table: string) => ({
    select: (filter?: any, order?: { column: string, ascending: boolean }) => 
      apiRequest('/api/data', 'POST', { table, action: 'select', filter, order }),
    
    insert: (data: any) => 
      apiRequest('/api/data', 'POST', { table, action: 'insert', data }),
    
    update: (data: any, filter: any) => 
      apiRequest('/api/data', 'POST', { table, action: 'update', data, filter }),
    
    upsert: (data: any, conflictKeys: string[]) => 
      apiRequest('/api/data', 'POST', { table, action: 'upsert', data, conflictKeys }),
    
    delete: (filter: any) => 
      apiRequest('/api/data', 'POST', { table, action: 'delete', filter }),
  })
};

export const authService = {
  login: (cpf: string, password?: string, role?: string) => 
    apiRequest('/api/auth/login', 'POST', { cpf, password, role }),
  
  register: (data: { cpf: string, name: string, role: string, sus_number?: string, email?: string, phone?: string, password?: string }) => 
    apiRequest('/api/auth/register', 'POST', data),
  
  updatePassword: (password: string) => 
    apiRequest('/api/auth/update-password', 'POST', { password }),
  
  resetByCpf: (cpf: string, role: string) => 
    apiRequest('/api/auth/reset-by-cpf', 'POST', { cpf, role }),
};
