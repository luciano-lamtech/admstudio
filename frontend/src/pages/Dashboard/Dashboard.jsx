import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/resumo/').then((res) => setResumo(res.data));
  }, []);

  return (
    <div>
      <h3 className="fw-bold mb-4">Dashboard</h3>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                <i className="bi bi-people fs-4"></i>
              </div>
              <div>
                <div className="text-muted small">Total de Clientes</div>
                <div className="fs-4 fw-bold">{resumo?.total_clientes ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
              <div>
                <div className="text-muted small">Agendamentos Hoje</div>
                <div className="fs-4 fw-bold">{resumo?.agendamentos_hoje ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                <i className="bi bi-cash-coin fs-4"></i>
              </div>
              <div>
                <div className="text-muted small">Faturamento do Mês</div>
                <div className="fs-4 fw-bold">R$ {resumo?.faturamento_mes ?? '0,00'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
