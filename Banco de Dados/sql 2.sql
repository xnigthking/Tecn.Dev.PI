INSERT INTO plans (name, price, description) VALUES
('Gratuito', 0.00, 'Acesso básico com lembretes manuais'),
('Premium', 29.90, 'Treinos personalizados e alertas automáticos');

INSERT INTO users (name, email, password_hash, plan_id) VALUES
('Admin', 'admin@mundofitness.com', '123456', 2);

SELECT * FROM users;
SELECT * FROM habits;

CREATE VIEW v_user_progress AS
SELECT u.id AS user_id,
       COUNT(DISTINCT hl.date) AS dias_ativos,
       SUM(w.duration) AS minutos_treino,
       SUM(m.calories) AS calorias_total,
       SUM(hy.amount_ml) AS agua_total
FROM users u
LEFT JOIN habits h ON h.user_id = u.id
LEFT JOIN habit_logs hl ON hl.habit_id = h.id
LEFT JOIN workouts w ON w.user_id = u.id
LEFT JOIN meals m ON m.user_id = u.id
LEFT JOIN hydrations hy ON hy.user_id = u.id
GROUP BY u.id;
