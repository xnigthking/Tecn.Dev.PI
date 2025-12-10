// Menu mobile toggle
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // Fecha o menu ao clicar fora (melhora UX)
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!menu.contains(target) && !toggle.contains(target)) {
      menu.classList.remove('show');
    }
  });
}

// Simples tratamento do form de inscrição (não envia nada por padrão)
const subscribeForm = document.getElementById('subscribeForm');
if (subscribeForm) {
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = subscribeForm.querySelector('input[type="email"]').value;
    // Aqui você pode chamar sua API ou exibir um feedback ao usuário
    alert('Obrigado! E-mail recebido: ' + (email || '[sem e-mail]'));
    subscribeForm.reset();
  });
}
