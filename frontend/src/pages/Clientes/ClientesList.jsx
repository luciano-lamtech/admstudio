import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const STATUS_INFO = {
  ativo: { label: 'Ativo', cor: 'text-bg-success' },
  inativo: { label: 'Inativo', cor: 'text-bg-secondary' },
  bloqueado: { label: 'Bloqueado', cor: 'text-bg-danger' },
  devedor: { label: 'Devedor', cor: 'text-bg-warning' },
};

const CLIENTE_VAZIO = {
  nome: '', cpf_cnpj: '', telefone: '', email: '', data_nascimento: '',
  sexo: '', token: '', endereco: '', observacoes: '', status: 'ativo',
};

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(CLIENTE_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await axiosClient.get('/clientes/', { params: { search: busca || undefined } });
    setClientes(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, [busca]); // eslint-disable-line

  const clientesFiltrados = clientes.filter((c) => {
    if (statusFiltro === 'todos') return true;
    return c.status === statusFiltro;
  });

  function abrirNovo() {
    setForm(CLIENTE_VAZIO);
    setEditandoId(null);
    setErro('');
    setMostrarForm(true);
  }

  function editar(cliente) {
    setForm({ ...CLIENTE_VAZIO, ...cliente, data_nascimento: cliente.data_nascimento || '' });
    setEditandoId(cliente.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = { ...form, data_nascimento: form.data_nascimento || null };
      if (editandoId) {
        await axiosClient.put(`/clientes/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/clientes/', payload);
      }
      setMostrarForm(false);
      carregar();
    } catch (err) {
      const dadosErro = err.response?.data;
      let mensagem = 'Não foi possível salvar. Tente novamente.';
      if (dadosErro && typeof dadosErro === 'object' && !Array.isArray(dadosErro)) {
        mensagem = Object.entries(dadosErro)
          .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
      }
      setErro(mensagem);
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Clientes</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Cliente
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-people-fill fs-5"></i>
        <span className="fw-bold fs-5">{clientesFiltrados.length}</span>
        <span className="text-white-50">CLIENTES</span>
      </div>

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="form-select w-auto" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_INFO).map(([valor, { label }]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">TELEFONE</th>
                <th className="py-3">E-MAIL</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.id}>
                  <td className="ps-3 fw-semibold">{c.nome}</td>
                  <td>{c.telefone}</td>
                  <td>{c.email}</td>
                  <td>
                    <span className={`badge rounded-pill ${STATUS_INFO[c.status]?.cor || 'text-bg-secondary'}`}>
                      {STATUS_INFO[c.status]?.label || c.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(c)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(c.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted py-4">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

                  <div className="row g-2 mb-2">
                    <div className="col-md-8">
                      <label className="form-label small">Nome</label>
                      <input className="form-control" required value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Status</label>
                      <select className="form-select" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        {Object.entries(STATUS_INFO).map(([valor, { label }]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">CPF/CNPJ</label>
                      <input className="form-control" value={form.cpf_cnpj || ''}
                        onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Telefone</label>
                      <input className="form-control" required value={form.telefone}
                        onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">E-mail</label>
                      <input type="email" className="form-control" value={form.email || ''}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Data de Nascimento</label>
                      <input type="date" className="form-control" value={form.data_nascimento || ''}
                        onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Sexo</label>
                      <select className="form-select" value={form.sexo || ''}
                        onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                        <option value="">Não informado</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Token</label>
                      <input className="form-control" value={form.token || ''}
                        onChange={(e) => setForm({ ...form, token: e.target.value })} />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small">Endereço</label>
                    <input className="form-control" value={form.endereco || ''}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small">Observações</label>
                    <textarea className="form-control" rows="2" value={form.observacoes || ''}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
