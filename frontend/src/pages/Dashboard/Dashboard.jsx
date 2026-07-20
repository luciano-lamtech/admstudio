import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const hoje = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});

function CardMetrica({ titulo, valor, subtitulo, cor }) {
  return (
    <div className="col">
      <div className="card border-0 shadow-sm h-100" style={{ borderTop: `4px solid ${cor}`, borderRadius: '10px' }}>
        <div className="card-body">
          <div className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>
            {titulo}
          </div>
          <div className="fs-2 fw-bold">{valor}</div>
          <div className="text-muted small">{subtitulo}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const { user, tenant } = useAuth();

  useEffect(() => {
    axiosClient.get('/dashboard/resumo/').then((res) => setResumo(res.data));
  }, []);

  const dadosStatus = resumo ? [
    { nome: 'Ativos', total: resumo.clientes_ativos },
    { nome: 'Inativos', total: resumo.clientes_inativos },
  ] : [];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="text-uppercase text-primary small fw-bold" style={{ letterSpacing: '1px' }}>Visão Geral</div>
          <h3 className="fw-bold mb-0">{tenant?.nome || 'ADMSTUDIO'}</h3>
        </div>
        <div className="text-muted small text-capitalize">{hoje}</div>
      </div>

      <div className="mb-4">
        <div className="text-uppercase text-muted small fw-bold" style={{ letterSpacing: '1px' }}>Bem-vindo de volta</div>
        <div className="fs-5 fw-bold text-uppercase">{user?.nome}</div>
      </div>

      {/* Cards */}
      <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 g-3 mb-4">
        <CardMetrica titulo="Clientes Ativos" valor={resumo?.clientes_ativos ?? '—'} subtitulo="Ativos" cor="#2ecc71" />
        <CardMetrica titulo="Total de Clientes" valor={resumo?.total_clientes ?? '—'} subtitulo="Cadastrados" cor="#3498db" />
        <CardMetrica titulo="Clientes Inativos" valor={resumo?.clientes_inativos ?? '—'} subtitulo="Inativos" cor="#95a5a6" />
        <CardMetrica titulo="Agendamentos Hoje" valor={resumo?.agendamentos_hoje ?? '—'} subtitulo="Em breve" cor="#9b59b6" />
        <CardMetrica titulo="Faturamento do Mês" valor={`R$ ${resumo?.faturamento_mes ?? '0,00'}`} subtitulo="Em breve" cor="#e67e22" />
      </div>

      {/* Gráficos */}
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-uppercase small fw-bold text-muted mb-3" style={{ letterSpacing: '0.5px' }}>
                Novos Clientes — Últimos 14 dias
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={resumo?.serie_clientes_por_dia || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name="Novos clientes" stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-uppercase small fw-bold text-muted mb-3" style={{ letterSpacing: '0.5px' }}>
                Clientes por Status
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dadosStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#e74c3c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
