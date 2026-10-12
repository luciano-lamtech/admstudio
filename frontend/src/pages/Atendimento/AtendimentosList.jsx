import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const STATUS_LABELS = {
  agendado: { label: 'Agendado', cor: 'text-bg-secondary' },
  confirmado: { label: 'Confirmado', cor: 'text-bg-info' },
  em_atendimento: { label: 'Em Atendimento', cor: 'text-bg-warning' },
  concluido: { label: 'Concluído', cor: 'text-bg-success' },
  cancelado: { label: 'Cancelado', cor: 'text-bg-danger' },
};

function hojeISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function extrairErro(err) {
  const d = err.response?.data;
  if (d && typeof d === 'object') {
    return Object.values(d).flat().join(' ') || 'Não foi possível alterar o status.';
  }
  return 'Não foi possível alterar o status. Tente novamente.';
}

export default function AtendimentosList() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [dataFiltro, setDataFiltro] = useState(hojeISO());
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [ocupado, setOcupado] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const params = { data: dataFiltro || undefined };
    if (statusFiltro !== 'todos') params.status = statusFiltro;
    try {
      const res = await axiosClient.get('/agendamentos/', { params });
      setAgendamentos(res.data.results || res.data);
    } catch (e) {
      setErro(extrairErro(e));
    }
  }

  useEffect(() => { carregar(); }, [dataFiltro, statusFiltro]); // eslint-disable-line

  async function mudarStatus(ag, novoStatus, confirmacao) {
    if (confirmacao && !window.confirm(confirmacao)) return;
    setErro('');
    setOcupado(ag.id);
    try {
      await axiosClient.patch(`/agendamentos/${ag.id}/`, { status: novoStatus });
      carregar();
    } catch (e) {
      setErro(extrairErro(e));
    } finally {
      setOcupado(null);
    }
  }

  // Botões exibidos conforme o status atual do atendimento
  function botoesDe(ag) {
    const { status } = ag;
    const finalizado = status === 'concluido' || status === 'cancelado';
    if (finalizado) return null;
    return (
      <>
        {(status === 'agendado' || status === 'confirmado') && (
          <button className="btn btn-sm btn-warning me-1" disabled={ocupado === ag.id}
            onClick={() => mudarStatus(ag, 'em_atendimento')}>
            <i className="bi bi-play-fill me-1"></i>Iniciar
          </button>
        )}
        {status === 'em_atendimento' && (
          <button className="btn btn-sm btn-success me-1" disabled={ocupado === ag.id}
            onClick={() => mudarStatus(ag, 'concluido')}>
            <i className="bi bi-check-lg me-1"></i>Concluir
          </button>
        )}
        <button className="btn btn-sm btn-outline-danger" disabled={ocupado === ag.id}
          onClick={() => mudarStatus(ag, 'cancelado', 'Cancelar este atendimento?')}>
          <i className="bi bi-x-lg me-1"></i>Cancelar
        </button>
      </>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Atendimento</h3>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-play-circle-fill fs-5"></i>
        <span className="fw-bold fs-5">{agendamentos.length}</span>
        <span className="text-white-50">ATENDIMENTOS NO DIA</span>
      </div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

      <div className="d-flex gap-2 mb-3">
        <input type="date" className="form-control w-auto" value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)} />
        <select className="form-select w-auto" value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([valor, { label }]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">HORÁRIO</th>
                <th className="py-3">CLIENTE</th>
                <th className="py-3">PROFISSIONAL</th>
                <th className="py-3">ITENS</th>
                <th className="py-3">TOTAL</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((ag) => (
                <tr key={ag.id}>
                  <td className="ps-3 fw-semibold">
                    {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{ag.cliente_nome}</td>
                  <td>{ag.profissional_nome || '—'}</td>
                  <td className="small text-muted">
                    {ag.itens.map((i) => i.item_catalogo_nome).join(', ') || '—'}
                  </td>
                  <td>R$ {parseFloat(ag.valor_total).toFixed(2).replace('.', ',')}</td>
                  <td>
                    <span className={`badge rounded-pill ${STATUS_LABELS[ag.status]?.cor || 'text-bg-secondary'}`}>
                      {STATUS_LABELS[ag.status]?.label || ag.status}
                    </span>
                  </td>
                  <td className="text-end pe-3 text-nowrap">
                    {botoesDe(ag) || <span className="text-muted small">—</span>}
                  </td>
                </tr>
              ))}
              {agendamentos.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted py-4">Nenhum atendimento nesse dia.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
