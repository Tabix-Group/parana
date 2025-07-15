import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Login: recibe { mail, clave } y devuelve usuario si es válido
router.post('/', async (req, res) => {
  const { mail, clave } = req.body;
  if (!mail || !clave) return res.status(400).json({ error: 'Faltan credenciales' });
  const user = await db('usuarios').where({ mail, clave }).first();
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  // No enviar clave al frontend
  const { clave: _, ...userData } = user;
  res.json(userData);
});

export default router;
