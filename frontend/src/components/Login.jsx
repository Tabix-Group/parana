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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
      <Paper sx={{ p: 4, minWidth: 340, maxWidth: 380, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">Iniciar Sesión</Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="Mail" value={mail} onChange={e => setMail(e.target.value)} fullWidth margin="normal" autoFocus required />
          <TextField label="Clave" value={clave} onChange={e => setClave(e.target.value)} fullWidth margin="normal" type="password" required />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
