import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const USUARIO_VAZIO = { nome: '', email: '', senha: '', role: '', is_active: true };
const PERFIL_VAZIO = { nome: '', nivel: '' };

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busca, setBusca] = useState('');

  // Modal de usuário
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(USUARIO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Modal de perfil de acesso
  const [mostrarPerfilForm, setMostrarPerfilForm] = useState(false);
  const [perfilForm, setPerfilForm] = useState(PERFIL_VAZIO);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState('');

  function extrairErro(err) {
    const dadosErro = err.response?.data;
    if (dadosErro && typeof dadosErro === 'object' && !Array.isArray(dadosErro)) {
      return Object.entries(dadosErro)
        .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
    }
    if (err.response?.status) return `Erro ${err.response.status} no servidor. Tente novamente.`;
    return 'Não foi possível salvar. Tente novamente.';
  }

  async function carregarUsuarios() {
    const res = await axiosClient.get('/usuarios/', { params: { search: busca || undefined } });
    setUsuarios(res.data.results || res.data);
  }

  async function carregarRoles() {
    const res = await axiosClient.get('/usuarios/roles/');
    setRoles(res.data.results || res.data);
  }

  useEffect(() => { carregarUsuarios(); }, [busca]); // eslint-disable-line
  useEffect(() => { carregarRoles(); }, []);

  function abrirNovoUsuario() {
    setForm(USUARIO_VAZIO);
    setEditandoId(null);
    setErro('');
    setMostrarForm(true);
  }

  function editarUsuario(u) {
    setForm({ nome: u.nome, email: u.email, senha: '', role: u.role || '', is_active: u.is_active });
    setEditandoId(u.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvarUsuario(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = { ...form };
      if (!payload.senha) delete payload.senha; // não altera senha se deixado em branco na edição
      if (editandoId) {
        await axiosClient.put(`/usuarios/${editandoId}/`, payload);
      } else {
        await axiosClient.post('/usuarios/', payload);
      }
      setMostrarForm(false);
      carregarUsuarios();
    } catch (err) {
      setErro(extrairErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluirUsuario(id) {
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    await axiosClient.delete(`/usuarios/${id}/`);
    carregarUsuarios();
  }

  async function alternarAtivo(u) {
    await axiosClient.patch(`/usuarios/${u.id}/`, { is_active: !u.is_active });
    carregarUsuarios();
  }

  function abrirNovoPerfil() {
    setPerfilForm(PERFIL_VAZIO);
    setErroPerfil('');
    setMostrarPerfilForm(true);
  }

  async function salvarPerfil(e) {
    e.preventDefault();
    setErroPerfil('');
    setSalvandoPerfil(true);
    try {
      await axiosClient.post('/usuarios/roles/', {
        nome: perfilForm.nome,
        nivel: parseInt(perfilForm.nivel, 10) || 0,
      });
      setMostrarPerfilForm(false);
      carregarRoles();
    } catch (err) {
      setErroPerfil(extrairErro(err));
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function excluirPerfil(id) {
    if (!window.confirm('Excluir este perfil? Usuários vinculados a ele podem ficar sem perfil.')) return;
    try {
      await axiosClient.delete(`/usuarios/roles/${id}/`);
      carregarRoles();
    } catch {
      window.alert('Não foi possível excluir — provavelmente existe usuário vinculado a esse perfil.');
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Usuários e Perfis de Acesso</h3>
        <button className="btn btn-primary" onClick={abrirNovoUsuario}>
          <i className="bi bi-plus-lg me-1"></i> Novo Usuário
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-people-fill fs-5"></i>
        <span className="fw-bold fs-5">{usuarios.length}</span>
        <span className="text-white-50">USUÁRIOS</span>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card border-0 shadow-sm mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME</th>
                <th className="py-3">E-MAIL</th>
                <th className="py-3">PERFIL</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="ps-3 fw-semibold">{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.role_nome || '—'}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${u.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}
                      style={{ cursor: 'pointer' }}
                      title="Clique para ativar/desativar"
                      onClick={() => alternarAtivo(u)}
                    >
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editarUsuario(u)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluirUsuario(u.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted py-4">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perfis de Acesso */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold mb-0">Perfis de Acesso</h5>
        <button className="btn btn-outline-primary btn-sm" onClick={abrirNovoPerfil}>
          <i className="bi bi-plus-lg me-1"></i> Novo Perfil
        </button>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">NOME DO PERFIL</th>
                <th className="py-3">NÍVEL</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td className="ps-3 fw-semibold">{r.nome}</td>
                  <td>{r.nivel}</td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluirPerfil(r.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan="3" className="text-center text-muted py-4">Nenhum perfil cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Usuário */}
      {mostrarForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Usuário' : 'Novo Usuário'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvarUsuario}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Nome</label>
                    <input className="form-control" required value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">E-mail</label>
                    <input type="email" className="form-control" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">
                      Senha {editandoId && <span className="text-muted fw-normal">(deixe em branco para manter a atual)</span>}
                    </label>
                    <input type="password" className="form-control" required={!editandoId} value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Perfil de Acesso</label>
                    <select className="form-select" required value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="">Selecione...</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.nome} (nível {r.nivel})</option>)}
                    </select>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="ativoUsuario"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="ativoUsuario">Ativo (permite login)</label>
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

      {/* Modal de Perfil de Acesso */}
      {mostrarPerfilForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMostrarPerfilForm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Novo Perfil de Acesso</h5>
                <button className="btn-close" onClick={() => setMostrarPerfilForm(false)}></button>
              </div>
              <form onSubmit={salvarPerfil}>
                <div className="modal-body">
                  {erroPerfil && <div className="alert alert-danger py-2 small">{erroPerfil}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Nome do Perfil</label>
                    <input className="form-control" required placeholder="Ex: Supervisor" value={perfilForm.nome}
                      onChange={(e) => setPerfilForm({ ...perfilForm, nome: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Nível de Acesso</label>
                    <input type="number" min="1" max="10" className="form-control" required value={perfilForm.nivel}
                      onChange={(e) => setPerfilForm({ ...perfilForm, nivel: e.target.value })} />
                    <div className="form-text">Quanto maior o número, mais acesso o perfil tem (1 = básico, 10 = administrador).</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarPerfilForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvandoPerfil}>
                    {salvandoPerfil ? 'Salvando...' : 'Cadastrar'}
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
