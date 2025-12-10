// Menu responsivo
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('show');
  });
}

// Login funcional
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    window.location.href = '../dashboard/dashboard.html';
  } else {
    alert('Usuário ou senha incorretos.');
  }
});

// Esqueceu senha
const forgotLink = document.getElementById('forgotLink');
const forgotModal = document.getElementById('forgotModal');
const closeModal = document.getElementById('closeModal');
const forgotForm = document.getElementById('forgotForm');

forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotModal.classList.add('show');
});

closeModal.addEventListener('click', () => {
  forgotModal.classList.remove('show');
});

forgotForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  if (email) {
    alert(`Um link de redefinição foi enviado para ${email}`);
    forgotModal.classList.remove('show');
    forgotForm.reset();
  }
});
