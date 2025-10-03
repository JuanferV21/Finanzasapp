-- Script para crear la base de datos MySQL
-- Ejecuta este script en tu cliente MySQL

CREATE DATABASE IF NOT EXISTS finanzas_dashboard;
USE finanzas_dashboard;

-- Las tablas se crearán automáticamente cuando ejecutes el servidor
-- gracias a Sequelize sync()

-- Opcional: Crear usuario específico para la aplicación
-- CREATE USER 'finanzas_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON finanzas_dashboard.* TO 'finanzas_user'@'localhost';
-- FLUSH PRIVILEGES;