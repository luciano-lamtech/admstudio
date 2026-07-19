import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const CLIENTE_VAZIO = { nome: '', cpf_cnpj: '', telefone: '', email: '', observacoes: '' };

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(CLIENTE_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const res = await axiosClient.get('/clientes/', { params: { search: busca || undefined } });
    setClientes(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, [busca]); // eslint-disable-line

  function abrirNovo() {
    setForm(CLIENTE_VAZIO);
    setEditandoId(null);
  }

  function editar(cliente) {
    setForm(cliente);
    setEditandoId(cliente.id);
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editandoId) {
        await axiosClient.put(`/clientes/${editandoId}/`, form);
      } else {
        await axiosClient.post('/clientes/', form);
      }
      abrirNovo();
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir este cliente?')) return;
    await axiosClient.delete(`/clientes/${id}/`);
    carregar();
  }

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0">Clientes</h3>
          <input
            className="form-control w-auto"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.telefone}</td>
                    <td>{c.email}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editar(c)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => excluir(c.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted py-4">Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">{editandoId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
            <form onSubmit={salvar}>
              <div className="mb-2">
                <label className="form-label small">Nome</label>
                <input className="form-control" required value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="form-label small">CPF/CNPJ</label>
                <input className="form-control" value={form.cpf_cnpj || ''}
                  onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="form-label small">Telefone</label>
                <input className="form-control" required value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div className="mb-2">
                <label className="form-label small">E-mail</label>
                <input type="email" className="form-control" value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label small">Observações</label>
                <textarea className="form-control" rows="2" value={form.observacoes || ''}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={salvando}>
                  {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editandoId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={abrirNovo}>Cancelar</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
