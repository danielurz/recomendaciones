-- Cambia reputation_score a NUMERIC para soportar decimales (e.g. 1.5 * 0.15 = 0.225)
ALTER TABLE users ALTER COLUMN reputation_score TYPE NUMERIC(10,4) USING reputation_score::NUMERIC;

-- Rastrea la última vez que el usuario publicó una reseña o comentario
-- Se usa para aplicar la decadencia por inactividad (90 días sin actividad → baja 0.5%/semana)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
