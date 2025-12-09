document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('usuariosList');
  const btnLogout = document.getElementById('btnLogout');

  const token = MundoAPI.getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  async function carregarUsuarios() {
    if (!listEl) return;
    listEl.innerHTML = '<li>Carregando...</li>';

    try {
      const usuarios = await MundoAPI.apiAuthGet('/usuarios');
      if (!Array.isArray(usuarios)) {
        listEl.innerHTML = '<li>Nenhum usuário encontrado</li>';
        return;
      }
      listEl.innerHTML = usuarios.map(u =>
        `<li>${escapeHtml(u.nome)} — ${escapeHtml(u.email)}</li>`
      ).join('');
    } catch (err) {
      listEl.innerHTML = `<li>Erro: ${escapeHtml(err.message)}</li>`;
    }
  }

  function escapeHtml(t) {
    return String(t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      MundoAPI.removeToken();
      window.location.href = 'login.html';
    });
  }

  carregarUsuarios();
});