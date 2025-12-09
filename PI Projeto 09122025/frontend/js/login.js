document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const senha = form.senha.value;

    if (!email || !senha) return alert('Preencha email e senha.');

    try {
      const resp = await MundoAPI.apiPost('/login', { email, senha });

      if (resp?.token) {
        MundoAPI.saveToken(resp.token);
        alert(`Bem-vindo(a), ${resp.nome || email}!`);
        window.location.href = 'dashboard.html';
      } else if (resp?.erro) {
        alert(`Erro: ${resp.erro}`);
      } else {
        alert('Resposta inesperada do servidor.');
      }
    } catch (err) {
      alert('Erro ao fazer login: ' + (err.message || 'desconhecido'));
      console.error(err);
    }
  });
});
