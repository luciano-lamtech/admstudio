import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../../api/axiosClient';

function CardMetrica({ titulo, valor, subtitulo, cor }) {
  return (
    <div className="col">
      <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: cor, borderRadius: '10px' }}>
        <div className="card-body text-white">
          <div className="text-uppercase small fw-semibold mb-2 opacity-75" style={{ letterSpacing: '0.5px' }}>
            {titulo}
          </div>
          <div className="fs-1 fw-bold">{valor}</div>
          <div className="small opacity-75">{subtitulo}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/resumo/').then((res) => setResumo(res.data));
  }, []);

  const dadosStatus = resumo ? [
    { nome: 'Ativos', total: resumo.clientes_ativos },
    { nome: 'Inativos', total: resumo.clientes_inativos },
  ] : [];

  return (
    <div>
      {/* Cards */}
      <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
        <CardMetrica titulo="Clientes Ativos" valor={resumo?.clientes_ativos ?? '—'} subtitulo="Ativos" cor="#3498db" />
        <CardMetrica titulo="Agendamentos Hoje" valor={resumo?.agendamentos_hoje ?? '—'} subtitulo="Em breve" cor="#f1c40f" />
        <CardMetrica titulo="Faturamento do Mês" valor={`R$ ${resumo?.faturamento_mes ?? '0,00'}`} subtitulo="Em breve" cor="#2ecc71" />
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
