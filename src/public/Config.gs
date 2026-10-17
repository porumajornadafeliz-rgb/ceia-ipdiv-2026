/** Configuração inicial da Igreja. Não contém senhas ou credenciais. */
function initialAdminAccounts_() {
  return { 'porumajornadafeliz@gmail.com': 'admin' };
}

/** Lotação inicial e regra atual: toda inscrição ativa ocupa lugares. */
function initialCapacity_() { return { limit: 200, policy: 'REGISTERED' }; }
