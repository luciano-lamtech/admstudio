import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function EspecialidadesList() {
  const [especialidades, setEspecialidades] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await axiosClient.get('/profissionais/especialidades/');
    setEspecialidades(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, []);

  async function adicionar(e) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setErro('');
    setSalvando(true);
    try {
      await axiosClient.post('/profissionais/especialidades/', { nome: novoNome.trim() });
      setNovoNome('');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.nome?.[0] || 'Não foi possível cadastrar. Verifique os dados.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(esp) {
    await axiosClient.patch(`/profissionais/especialidades/${esp.id}/`, { ativo: !esp.ativo });
    carregar();
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir esta especialidade?')) return;
    await axiosClient.delete(`/profissionais/especialidades/${id}/`);
    carregar();
  }

  return (
    <div>
      <h3 className="fw-bold mb-3">Cadastro de Especialidades</h3>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
          <form onSubmit={adicionar} className="d-flex gap-2">
            <input
              className="form-control"
              placeholder="Ex: Cabeleireiro, Manicure, Esteticista..."
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={salvando}>
              <i className="bi bi-plus-lg me-1"></i> Adicionar
            </button>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {especialidades.map((esp) => (
                <tr key={esp.id}>
                  <td className="ps-3 fw-semibold">{esp.nome}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${esp.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => alternarAtivo(esp)}
                      title="Clique para alternar"
                    >
                      {esp.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(esp.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {especialidades.length === 0 && (
                <tr><td colSpan="3" className="text-center text-muted py-4">Nenhuma especialidade cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
