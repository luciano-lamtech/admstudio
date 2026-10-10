import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const TIPOS = {
  agendamento_criado: { label: 'Agendamento criado', cor: 'text-bg-primary' },
  agendamento_excluido: { label: 'Agendamento excluído', cor: 'text-bg-dark' },
  status_alterado: { label: 'Status', cor: 'text-bg-info' },
  profissional_alterado: { label: 'Profissional', cor: 'text-bg-secondary' },
  data_alterada: { label: 'Horário', cor: 'text-bg-warning' },
  observacao_alterada: { label: 'Observação', cor: 'text-bg-light border' },
  item_adicionado: { label: 'Item adicionado', cor: 'text-bg-success' },
  item_removido: { label: 'Item removido', cor: 'text-bg-danger' },
  item_alterado: { label: 'Item alterado', cor: 'text-bg-warning' },
};

export default function HistoricoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [erro, setErro] = useState('');

  useEffect(() => {
    axiosClient.get(`/clientes/${id}/`)
      .then((r) => setCliente(r.data))
      .catch(() => setErro('Cliente não encontrado.'));
    axiosClient.get(`/historico/clientes/${id}/`)
      .then((r) => setEventos(r.data))
      .catch(() => setErro('Não foi possível carregar o histórico.'));
  }, [id]);

  const visiveis = filtroTipo === 'todos' ? eventos : eventos.filter((e) => e.tipo === filtroTipo);

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate('/clientes')}>
        <i className="bi bi-arrow-left me-1"></i> Clientes
      </button>

      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h3 className="fw-bold mb-0">Histórico</h3>
          <div className="text-muted">{cliente?.nome}</div>
        </div>
        <button className="btn btn-outline-primary" onClick={() => navigate(`/clientes/${id}/perfil`)}>
          <i className="bi bi-person-vcard me-1"></i> Perfil do Cliente
        </button>
      </div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-clock-history fs-5"></i>
        <span className="fw-bold fs-5">{visiveis.length}</span>
        <span className="text-white-50">REGISTRO(S)</span>
      </div>

      <div className="d-flex gap-2 mb-3">
        <select className="form-select w-auto" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os eventos</option>
          {Object.entries(TIPOS).map(([valor, { label }]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">DATA / HORA</th>
                <th className="py-3">EVENTO</th>
                <th className="py-3">DETALHE</th>
                <th className="py-3 pe-3">USUÁRIO</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((e) => (
                <tr key={e.id}>
                  <td className="ps-3 small text-nowrap">{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className={`badge rounded-pill ${TIPOS[e.tipo]?.cor || 'text-bg-secondary'}`}>
                      {TIPOS[e.tipo]?.label || e.tipo}
                    </span>
                  </td>
                  <td>{e.descricao}</td>
                  <td className="pe-3 small">{e.usuario_nome}</td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr><td colSpan="4" className="text-center text-muted py-4">Nenhum registro ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
