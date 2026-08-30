import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const UNIDADE_VAZIA = {
  nome_empresa: '', cnpj_cpf: '', nome_contato: '', telefone_contato: '',
  email: '', telegram_id: '', cep: '', pais: 'Brasil', endereco: '', numero: '',
  bairro: '', cidade: '', estado: '', status: 'em_analise',
};

const STATUS_INFO = {
  em_analise: { label: 'Em Análise', cor: 'text-bg-warning' },
  ativo: { label: 'Ativo', cor: 'text-bg-success' },
  inativo: { label: 'Inativo', cor: 'text-bg-secondary' },
};

export default function DadosNegocioList() {
  const [unidades, setUnidades] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(UNIDADE_VAZIA);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  async function carregar() {
    const res = await axiosClient.get('/negocio/');
    setUnidades(res.data.results || res.data);
  }

  useEffect(() => { carregar(); }, []);

  async function buscarEnderecoPorCep(cepDigitado) {
    const cepLimpo = cepDigitado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await res.json();
      if (!dados.erro) {
        setForm((f) => ({
          ...f,
          endereco: dados.logradouro || f.endereco,
          bairro: dados.bairro || f.bairro,
          cidade: dados.localidade || f.cidade,
          estado: dados.uf || f.estado,
        }));
      }
    } catch {
      // Falha na busca não impede o preenchimento manual — segue normal.
    } finally {
      setBuscandoCep(false);
    }
  }

  function handleCepChange(valorDigitado) {
    const digitos = valorDigitado.replace(/\D/g, '').slice(0, 8);
    const formatado = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    setForm({ ...form, cep: formatado });
    if (digitos.length === 8) buscarEnderecoPorCep(digitos);
  }

  function abrirNovo() {
    setForm(UNIDADE_VAZIA);
    setEditandoId(null);
    setErro('');
    setMostrarForm(true);
  }

  function editar(u) {
    setForm({ ...UNIDADE_VAZIA, ...u });
    setEditandoId(u.id);
    setErro('');
    setMostrarForm(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      if (editandoId) {
        await axiosClient.put(`/negocio/${editandoId}/`, form);
      } else {
        await axiosClient.post('/negocio/', form);
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
    if (!window.confirm('Deseja realmente excluir esta unidade?')) return;
    await axiosClient.delete(`/negocio/${id}/`);
    carregar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Dados do Negócio</h3>
        <button className="btn btn-primary" onClick={abrirNovo}>
          <i className="bi bi-plus-lg me-1"></i> Nova Unidade
        </button>
      </div>

      <div className="bg-dark text-white rounded-3 px-4 py-3 mb-3 d-flex align-items-center gap-2">
        <i className="bi bi-shop fs-5"></i>
        <span className="fw-bold fs-5">{unidades.length}</span>
        <span className="text-white-50">UNIDADE(S) CADASTRADA(S)</span>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#1e2a5e' }}>
              <tr className="text-white">
                <th className="py-3 ps-3">EMPRESA</th>
                <th className="py-3">CNPJ/CPF</th>
                <th className="py-3">CONTATO</th>
                <th className="py-3">CIDADE/UF</th>
                <th className="py-3">STATUS</th>
                <th className="py-3 text-end pe-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id}>
                  <td className="ps-3 fw-semibold">{u.nome_empresa}</td>
                  <td>{u.cnpj_cpf || '—'}</td>
                  <td>
                    {u.nome_contato || '—'}
                    {u.telefone_contato && <div className="small text-muted">{u.telefone_contato}</div>}
                  </td>
                  <td>{u.cidade ? `${u.cidade}/${u.estado}` : '—'}</td>
                  <td>
                    <span className={`badge rounded-pill ${STATUS_INFO[u.status]?.cor || 'text-bg-secondary'}`}>
                      {u.status_display || STATUS_INFO[u.status]?.label || u.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm btn-primary me-1" title="Editar" onClick={() => editar(u)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" title="Excluir" onClick={() => excluir(u.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-4">Nenhuma unidade cadastrada.</td></tr>
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
                <h5 className="modal-title fw-bold">{editandoId ? 'Editar Unidade' : 'Nova Unidade'}</h5>
                <button className="btn-close" onClick={() => setMostrarForm(false)}></button>
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body">
                  {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

                  <div className="row g-2 mb-2">
                    <div className="col-md-8">
                      <label className="form-label small">Nome da Empresa</label>
                      <input className="form-control" required value={form.nome_empresa}
                        onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">CNPJ ou CPF</label>
                      <input className="form-control" value={form.cnpj_cpf}
                        onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value.replace(/\D/g, '').slice(0, 14) })} />
                    </div>
                  </div>

                  <hr className="my-3" />
                  <div className="small fw-semibold text-muted mb-2">CONTATO</div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Nome do Contato</label>
                      <input className="form-control" value={form.nome_contato}
                        onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">Telefone / WhatsApp</label>
                      <input className="form-control" value={form.telefone_contato}
                        onChange={(e) => setForm({ ...form, telefone_contato: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">E-mail</label>
                      <input type="email" className="form-control" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small">ID Telegram (Notificações)</label>
                      <input className="form-control" value={form.telegram_id}
                        onChange={(e) => setForm({ ...form, telegram_id: e.target.value })} />
                    </div>
                  </div>

                  <hr className="my-3" />
                  <div className="small fw-semibold text-muted mb-2">ENDEREÇO</div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-warning-emphasis">
                        CEP {buscandoCep && <span className="spinner-border spinner-border-sm ms-1"></span>}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-warning-subtle border-warning text-warning-emphasis">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          className="form-control border-warning bg-warning-subtle"
                          placeholder="00000-000"
                          value={form.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                        />
                      </div>
                      <div className="form-text">Digite o CEP para preencher o endereço automaticamente.</div>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small">País</label>
                      <input className="form-control" value={form.pais}
                        onChange={(e) => setForm({ ...form, pais: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-9">
                      <label className="form-label small">Endereço</label>
                      <input className="form-control" value={form.endereco}
                        onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Número</label>
                      <input className="form-control" value={form.numero}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label small">Bairro</label>
                      <input className="form-control" value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Cidade</label>
                      <input className="form-control" value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">UF</label>
                      <input className="form-control" maxLength={2} value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} />
                    </div>
                  </div>

                  <hr className="my-3" />
                  <div className="mb-2">
                    <label className="form-label small">Status</label>
                    <div>
                      <span className={`badge rounded-pill ${STATUS_INFO[form.status]?.cor || 'text-bg-secondary'}`}>
                        {STATUS_INFO[form.status]?.label || form.status}
                      </span>
                      {!editandoId && (
                        <span className="text-muted small ms-2">
                          Novas unidades iniciam em análise até a mensalidade ser ajustada.
                        </span>
                      )}
                    </div>
                    {editandoId && (
                      <select className="form-select mt-2" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        {Object.entries(STATUS_INFO).map(([valor, { label }]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </select>
                    )}
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
