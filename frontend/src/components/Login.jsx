import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import API from '../api';

export default function Login({ onLogin }) {
  const [mail, setMail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/login', { mail, clave });
      onLogin(res.data);
    } catch (err) {
      setError('Usuario o clave incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8f0fe 0%, #f4f6fb 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1300
    }}>
      <Paper elevation={6} sx={{
        p: { xs: 3, sm: 5 },
        minWidth: 340,
        maxWidth: 400,
        width: '100%',
        borderRadius: 4,
        boxShadow: '0 8px 32px 0 rgba(34,51,107,0.16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ width: '100%', mb: 2, display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '80%', maxWidth: 220, height: 'auto', objectFit: 'contain', display: 'block' }} />
        </Box>
        <Typography variant="h5" fontWeight={700} mb={1} align="center" color="#22336b">Iniciar Sesión</Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField label="Mail" value={mail} onChange={e => setMail(e.target.value)} fullWidth margin="normal" autoFocus required sx={{ background: '#f8fafc', borderRadius: 2 }} />
          <TextField label="Clave" value={clave} onChange={e => setClave(e.target.value)} fullWidth margin="normal" type="password" required sx={{ background: '#f8fafc', borderRadius: 2 }} />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, fontWeight: 700, fontSize: 17, py: 1.2, borderRadius: 2 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2, fontSize: 14 }}>
          Usuario demo: <b>hernan@tabix.app</b><br />Clave: <b>12345678</b>
        </Typography>
      </Paper>
      <Box component="footer" sx={{
        width: '100vw',
        py: 0.7,
        px: 2,
        background: '#f6f8fa',
        borderTop: '1.5px solid #e0e3e7',
        textAlign: 'center',
        color: '#22336b',
        fontWeight: 500,
        fontSize: 15,
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 1201
      }}>
        © {new Date().getFullYear()} <a href="https://www.tabix.app" target="_blank" rel="noopener noreferrer" style={{ color: '#22336b', textDecoration: 'none', fontWeight: 600, transition: 'text-decoration 0.2s' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Tabix Group</a>. Todos los derechos reservados.
      </Box>
    </Box>
  );
}
