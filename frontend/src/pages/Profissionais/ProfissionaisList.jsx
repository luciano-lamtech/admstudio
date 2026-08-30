import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const PROFISSIONAL_VAZIO = {
  nome: '', especialidade: '', telefone: '', email: '',
  comissao_percentual: '', cor: '#3b82f6', usuario: '', ativo: true,
};

export default function ProfissionaisList() {
  const [profissionais, setProfissionais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(PROFISSIONAL_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await axiosClient.get('/profissionais/', { params: { search: busca || undefined } });
    setProfissionais(res.data.results || res.data);
  }

  async function carregarUsuarios() {
    const res = await axiosClient.get('/usuarios/');
    setUsuarios(res.data.results || res.data);
  }

  async function carregarEspecialidades() {
    const res = await axiosClient.get('/profissionais/especialidades/', { params: { ativo: 'true' } });
    setEspecialidades(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, [busca]); // eslint-disable-line
  useEffect(() => { carregarUsuarios(); carregarEspecialidades(); }, []);

  function abrirNovo() {
    setForm(PROFISSIONAL_VAZIO);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function editar(p) {
    setForm({
      nome: p.nome, especialidade: p.especialidade || '', telefone: p.telefone || '',
      email: p.email || '', comissao_percentual: p.comissao_percentual, cor: p.cor,
      usuario: p.usuario || '', ativo: p.ativo,
    });
    setEditandoId(p.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = {
        ...form,
        comissao_percentual: parseFloat(form.comissao_percentual) || 0,
        usuario: form.usuario || null,
        especialidade: form.especialidade || null,
      };
      if (editandoId) {
        await axiosClient.put(`/profissionais/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/profissionais/', payload);
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
      } else if (err.response?.status) {
        mensagem = `Erro ${err.response.status} no servidor. Tente novamente ou avise o suporte.`;
      }
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Deseja realmente excluir este profissional?')) return;
    await axiosClient.delete(`/profissionais/${id}/`);
    carregar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Profissionais</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Novo Profissional
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-person-badge-fill fs-5"></i>
        <span className="fw-bold fs-5">{profissionais.length}</span>
        <span className="text-white-50">PROFISSIONAIS</span>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">ESPECIALIDADE</th>
                <th className="py-3">TELEFONE</th>
                <th className="py-3">COMISSÃO</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {profissionais.map((p) => (
                <tr key={p.id}>
                  <td className="ps-3 fw-semibold">
                    <span className="d-inline-block rounded-circle me-2" style={{ width: 10, height: 10, backgroundColor: p.cor }}></span>
                    {p.nome}
                  </td>
                  <td>{p.especialidade_nome || '—'}</td>
                  <td>{p.telefone || '—'}</td>
                  <td>{parseFloat(p.comissao_percentual).toFixed(1)}%</td>
                  <td>
                    <span className={`badge rounded-pill ${p.ativo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(p)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(p.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {profissionais.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">Nenhum profissional cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Profissional' : 'Novo Profissional'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Nome</label>
                    <input className="form-control" required value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Especialidade</label>
                    <select className="form-select" value={form.especialidade}
                      onChange={(e) => setForm({ ...form, especialidade: e.target.value })}>
                      <option value="">Selecione...</option>
                      {especialidades.map((esp) => <option key={esp.id} value={esp.id}>{esp.nome}</option>)}
                    </select>
                    <div className="form-text">
                      Não encontrou? Cadastre em Gestão → Cadastro de Especialidades.
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small">Telefone</label>
                      <input className="form-control" value={form.telefone}
                        onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">E-mail</label>
                      <input type="email" className="form-control" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2 align-items-end">
                    <div className="col-6">
                      <label className="form-label small">Comissão (%)</label>
                      <input type="number" step="0.1" min="0" max="100" className="form-control" value={form.comissao_percentual}
                        onChange={(e) => setForm({ ...form, comissao_percentual: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">Cor na Agenda</label>
                      <input type="color" className="form-control form-control-color w-100" value={form.cor}
                        onChange={(e) => setForm({ ...form, cor: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Vincular a um usuário do sistema (opcional)</label>
                    <select className="form-select" value={form.usuario}
                      onChange={(e) => setForm({ ...form, usuario: e.target.value })}>
                      <option value="">Nenhum (não faz login)</option>
                      {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>)}
                    </select>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="ativoProfissional"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="ativoProfissional">Ativo</label>
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
