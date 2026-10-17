/** Configuração inicial da Igreja. Não contém senhas ou credenciais. */
function initialAdminAccounts_() {
  return { 'porumajornadafeliz@gmail.com': 'admin' };
}

/** Lotação e regra definidas pela organização. Propriedades já existentes são preservadas. */
function initialCapacity_() { return { limit: 200, policy: 'PAID' }; }
