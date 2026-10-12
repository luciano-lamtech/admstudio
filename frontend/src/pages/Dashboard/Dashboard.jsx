import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';

const CORES_STATUS = { Ativo: '#22c55e', Inativo: '#94a3b8', Bloqueado: '#ef4444', Devedor: '#f59e0b' };
const CORES_PERFIL = ['#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];

function CardMetrica({ titulo, valor, subtitulo, cor }) {
  return (
    <div className="col">
      <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: cor, borderRadius: '10px' }}>
        <div className="card-body text-dark text-center d-flex flex-column align-items-center justify-content-center">
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

function CartaoGrafico({ titulo, children }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="text-uppercase small fw-bold text-muted mb-3" style={{ letterSpacing: '0.5px' }}>{titulo}</div>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/resumo/').then((res) => setResumo(res.data));
  }, []);

  const atendimentos = resumo?.atendimentos_hoje;
  const dadosStatus = (resumo?.por_status || []).filter((s) => s.total > 0);
  const p = resumo?.perfil_clientes;
  const dadosPerfil = p ? [
    { nome: 'Homens', percentual: p.homens },
    { nome: 'Mulheres', percentual: p.mulheres },
    { nome: 'Menores de 18', percentual: p.menores_18 },
    { nome: 'Maiores de 65', percentual: p.maiores_65 },
  ] : [];

  return (
    <div>
      {/* Cards */}
      <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
        <CardMetrica titulo="Clientes" valor={resumo?.total_clientes ?? '—'} subtitulo="Total" cor="#d6eaf8" />
        <CardMetrica titulo="Agendamentos Hoje" valor={resumo?.agendamentos_hoje ?? '—'} subtitulo="Excluindo cancelados" cor="#fdf3d0" />
        <CardMetrica
          titulo="Atendimentos concluídos hoje"
          valor={atendimentos ? `${atendimentos.percentual}%` : '—'}
          subtitulo={atendimentos ? `${atendimentos.finalizados} de ${atendimentos.total} (concluídos + cancelados)` : ''}
          cor="#d5f2df"
        />
      </div>

      {/* Gráficos */}
      <div className="row g-3">
        <div className="col-lg-4">
          <CartaoGrafico titulo="Novos Clientes — Últimos 14 dias">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={resumo?.serie_clientes_por_dia || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" name="Novos clientes" stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CartaoGrafico>
        </div>

        <div className="col-lg-4">
          <CartaoGrafico titulo="Clientes por Status">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dadosStatus} dataKey="total" nameKey="nome" cx="50%" cy="45%" outerRadius={85} label>
                  {dadosStatus.map((s) => (
                    <Cell key={s.nome} fill={CORES_STATUS[s.nome] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CartaoGrafico>
        </div>

        <div className="col-lg-4">
          <CartaoGrafico titulo="Perfil dos Clientes (%)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dadosPerfil} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentual" radius={[0, 6, 6, 0]}>
                  {dadosPerfil.map((_, i) => (
                    <Cell key={i} fill={CORES_PERFIL[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {p && <div className="small text-muted text-center">Base: {p.total} cliente(s) cadastrado(s)</div>}
          </CartaoGrafico>
        </div>
      </div>
    </div>
  );
}
