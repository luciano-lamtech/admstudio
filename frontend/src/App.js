import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientesList from './pages/Clientes/ClientesList';
import ServicosProdutosList from './pages/ServicosProdutos/ServicosProdutosList';
import AgendamentosList from './pages/Agendamentos/AgendamentosList';
import FinanceiroList from './pages/Financeiro/FinanceiroList';
import CaixaList from './pages/Caixa/CaixaList';
import GestaoHub from './pages/Gestao/GestaoHub';
import ProfissionaisList from './pages/Profissionais/ProfissionaisList';
import EspecialidadesList from './pages/Especialidades/EspecialidadesList';
import RelatoriosHub from './pages/Relatorios/RelatoriosHub';
import RelatorioComissao from './pages/Relatorios/RelatorioComissao';
import ConfiguracoesHub from './pages/Configuracoes/ConfiguracoesHub';
import PlaceholderPage from './components/PlaceholderPage/PlaceholderPage';
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

      <Route path="/agendamentos" element={
        <PrivateRoute><AgendamentosList /></PrivateRoute>
      } />

      <Route path="/financeiro" element={
        <PrivateRoute><FinanceiroList /></PrivateRoute>
      } />

      <Route path="/caixa" element={
        <PrivateRoute><CaixaList /></PrivateRoute>
      } />

      <Route path="/gestao" element={
        <PrivateRoute><GestaoHub /></PrivateRoute>
      } />
      <Route path="/gestao/usuarios" element={
        <PrivateRoute><PlaceholderPage titulo="Usuários e Perfis de Acesso" icone="bi-people-fill" /></PrivateRoute>
      } />
      <Route path="/gestao/profissionais" element={
        <PrivateRoute><ProfissionaisList /></PrivateRoute>
      } />
      <Route path="/gestao/especialidades" element={
        <PrivateRoute><EspecialidadesList /></PrivateRoute>
      } />
      <Route path="/gestao/relatorios" element={
        <PrivateRoute><RelatoriosHub /></PrivateRoute>
      } />
      <Route path="/gestao/relatorios/comissao" element={
        <PrivateRoute><RelatorioComissao /></PrivateRoute>
      } />

      <Route path="/configuracoes" element={
        <PrivateRoute><ConfiguracoesHub /></PrivateRoute>
      } />
      <Route path="/configuracoes/negocio" element={
        <PrivateRoute><PlaceholderPage titulo="Dados do Negócio" icone="bi-building" /></PrivateRoute>
      } />
      <Route path="/configuracoes/preferencias" element={
        <PrivateRoute><PlaceholderPage titulo="Preferências do Sistema" icone="bi-sliders" /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
