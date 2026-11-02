import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';

export const ROTA_ASSINATURA = '/configuracoes/assinatura';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, assinatura } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Teste vencido (ou assinatura inativa): só a tela "Minha assinatura" fica liberada.
  if (assinatura?.bloqueado && location.pathname !== ROTA_ASSINATURA) {
    return <Navigate to={ROTA_ASSINATURA} replace />;
  }

  return <Layout>{children}</Layout>;
}
