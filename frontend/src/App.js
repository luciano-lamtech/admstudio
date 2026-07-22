import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientesList from './pages/Clientes/ClientesList';
import ServicosProdutosList from './pages/ServicosProdutos/ServicosProdutosList';
import PrivateRoute from './routes/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />

      <Route path="/clientes" element={
        <PrivateRoute><ClientesList /></PrivateRoute>
      } />

      <Route path="/servicos-produtos" element={
        <PrivateRoute><ServicosProdutosList /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
