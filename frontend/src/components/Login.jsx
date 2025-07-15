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
        <Box sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 60%, #22336b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          boxShadow: '0 2px 12px 0 rgba(34,51,107,0.10)'
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#fff"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
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
