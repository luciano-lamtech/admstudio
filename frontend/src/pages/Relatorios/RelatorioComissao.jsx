import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

function primeiroDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RelatorioComissao() {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await axiosClient.get('/agendamentos/relatorio-comissao/', {
        params: { data_inicio: dataInicio, data_fim: dataFim },
      });
      setRelatorio(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [dataInicio, dataFim]); // eslint-disable-line

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate('/gestao/relatorios')}>
        <i className="bi bi-arrow-left me-1"></i> Relatórios
      </button>

      <h3 className="fw-bold mb-3">Relatório de Comissão</h3>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div>
          <label className="form-label small d-block">De</label>
          <input type="date" className="form-control" value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="form-label small d-block">Até</label>
          <input type="date" className="form-control" value={dataFim}
            onChange={(e) => setDataFim(e.target.value)} />
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 g-3 mb-3">
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d6eaf8', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Total Faturado no Período</div>
              <div className="fs-3 fw-bold">
                R$ {parseFloat(relatorio?.total_geral_faturado || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#fdebd0', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Total de Comissões</div>
              <div className="fs-3 fw-bold">
                R$ {parseFloat(relatorio?.total_geral_comissao || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">PROFISSIONAL</th>
                <th className="py-3">ATENDIMENTOS</th>
                <th className="py-3">FATURADO</th>
                <th className="py-3">% COMISSÃO</th>
                <th className="py-3 pe-3">VALOR DA COMISSÃO</th>
              </tr>
            </thead>
            <tbody>
              {(relatorio?.linhas || []).map((l) => (
                <tr key={l.profissional_id}>
                  <td className="ps-3 fw-semibold">{l.profissional_nome}</td>
                  <td>{l.total_atendimentos}</td>
                  <td>R$ {parseFloat(l.total_faturado).toFixed(2).replace('.', ',')}</td>
                  <td>{parseFloat(l.comissao_percentual).toFixed(1)}%</td>
                  <td className="pe-3 fw-bold text-success">
                    R$ {parseFloat(l.valor_comissao).toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
              {!carregando && (relatorio?.linhas || []).length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted py-4">
                  Nenhum atendimento concluído com profissional atribuído nesse período.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
