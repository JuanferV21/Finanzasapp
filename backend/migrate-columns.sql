-- Migración para renombrar columnas de español a inglés

USE finanzas_dashboard;

-- Tabla goals: renombrar columnas de español a inglés
ALTER TABLE goals
  CHANGE COLUMN nombre name VARCHAR(255) NOT NULL,
  CHANGE COLUMN monto_objetivo target_amount DECIMAL(10,2) NOT NULL,
  CHANGE COLUMN monto_ahorrado saved_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CHANGE COLUMN fecha_limite deadline DATETIME NULL,
  CHANGE COLUMN notas notes TEXT NULL;

-- Tabla contributions: renombrar columnas de español a inglés
ALTER TABLE contributions
  CHANGE COLUMN monto amount DECIMAL(10,2) NOT NULL,
  CHANGE COLUMN fecha date DATETIME NULL,
  CHANGE COLUMN nota note TEXT NULL;

-- Verificar cambios
DESCRIBE goals;
DESCRIBE contributions;
