import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const SESSAO_VAZIA = { data: '', profissional: '', procedimento: '', descricao: '', observacoes: '' };
const ANAMNESE_VAZIA = {
  alergias: '', medicamentos: '', condicoes_saude: '', gestante: false, tipo_pele: '',
  historico_procedimentos: '', observacoes: '', consentimento_lgpd: false, consentimento_em: null,
};

function hojeISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatarData(iso) {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

function extrairErro(err) {
  const d = err.response?.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return Object.entries(d).map(([c, m]) => `${c}: ${Array.isArray(m) ? m.join(', ') : m}`).join(' | ');
  }
  if (err.response?.status === 403) return 'Seu perfil não tem acesso ao prontuário.';
  return 'Não foi possível salvar. Tente novamente.';
}

// Reduz a foto no navegador (máx. 1280 px) antes de enviar, para não pesar no banco
function redimensionarImagem(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, 1280 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}

function ModalBase({ titulo, onFechar, children, rodape }) {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onFechar}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{titulo}</h5>
            <button className="btn-close" onClick={onFechar}></button>
          </div>
          {children}
          {rodape && <div className="modal-footer">{rodape}</div>}
        </div>
      </div>
    </div>
  );
}

function CampoTexto({ rotulo, valor, onChange, linhas = 2 }) {
  return (
    <div className="mb-2">
      <label className="form-label small">{rotulo}</label>
      <textarea className="form-control" rows={linhas} value={valor || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AbaAnamnese({ clienteId, onAviso, onErro }) {
  const [form, setForm] = useState(ANAMNESE_VAZIA);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    axiosClient.get(`/prontuario/clientes/${clienteId}/anamnese/`)
      .then((r) => setForm({ ...ANAMNESE_VAZIA, ...r.data }))
      .catch((e) => onErro(extrairErro(e)));
  }, [clienteId]); // eslint-disable-line

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    onErro('');
    try {
      const r = await axiosClient.put(`/prontuario/clientes/${clienteId}/anamnese/`, form);
      setForm({ ...ANAMNESE_VAZIA, ...r.data });
      onAviso('Anamnese salva.');
    } catch (err) {
      onErro(extrairErro(err));
    } finally {
      setSalvando(false);
    }
  }

  const set = (campo) => (valor) => setForm({ ...form, [campo]: valor });

  return (
    <form onSubmit={salvar} className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2">
          <div className="col-md-6"><CampoTexto rotulo="Alergias" valor={form.alergias} onChange={set('alergias')} /></div>
          <div className="col-md-6"><CampoTexto rotulo="Medicamentos em uso" valor={form.medicamentos} onChange={set('medicamentos')} /></div>
          <div className="col-md-6"><CampoTexto rotulo="Condições de saúde" valor={form.condicoes_saude} onChange={set('condicoes_saude')} /></div>
          <div className="col-md-6"><CampoTexto rotulo="Histórico de procedimentos" valor={form.historico_procedimentos} onChange={set('historico_procedimentos')} /></div>
          <div className="col-md-6">
            <label className="form-label small">Tipo de pele / cabelo</label>
            <input className="form-control" value={form.tipo_pele || ''} onChange={(e) => set('tipo_pele')(e.target.value)} />
          </div>
          <div className="col-md-6 d-flex align-items-end">
            <div className="form-check mb-2">
              <input className="form-check-input" type="checkbox" id="gestante" checked={!!form.gestante}
                onChange={(e) => set('gestante')(e.target.checked)} />
              <label className="form-check-label small" htmlFor="gestante">Gestante</label>
            </div>
          </div>
          <div className="col-12"><CampoTexto rotulo="Observações gerais" valor={form.observacoes} onChange={set('observacoes')} /></div>
        </div>

        <div className="border rounded p-3 mt-2 bg-light">
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="lgpd" checked={!!form.consentimento_lgpd}
              onChange={(e) => set('consentimento_lgpd')(e.target.checked)} />
            <label className="form-check-label small" htmlFor="lgpd">
              O cliente autorizou o registro dos seus dados de saúde (LGPD).
            </label>
          </div>
          {form.consentimento_em && (
            <div className="small text-muted mt-1">
              Consentimento registrado em {new Date(form.consentimento_em).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        <div className="text-end mt-3">
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar anamnese'}
          </button>
        </div>
      </div>
    </form>
  );
}

function ModalNovaSessao({ clienteId, onFechar, onSalvo }) {
  const [form, setForm] = useState({ ...SESSAO_VAZIA, data: hojeISO() });
  const [profissionais, setProfissionais] = useState([]);
  const [fotoAntes, setFotoAntes] = useState(null);
  const [fotoDepois, setFotoDepois] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    axiosClient.get('/profissionais/', { params: { ativo: 'true' } })
      .then((r) => setProfissionais(r.data.results || r.data))
      .catch(() => {});
  }, []);

  async function escolherFoto(e, definir) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    try {
      definir(await redimensionarImagem(arquivo));
    } catch {
      setErro('Não foi possível ler a imagem.');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const r = await axiosClient.post(`/prontuario/clientes/${clienteId}/sessoes/`, {
        ...form,
        profissional: form.profissional || null,
      });
      const sessaoId = r.data.id;
      for (const [tipo, imagem] of [['antes', fotoAntes], ['depois', fotoDepois]]) {
        if (imagem) {
          await axiosClient.post(`/prontuario/sessoes/${sessaoId}/fotos/`, { tipo, imagem });
        }
      }
      onSalvo();
    } catch (err) {
      setErro(extrairErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalBase titulo="Novo atendimento" onFechar={onFechar}
      rodape={<>
        <button type="button" className="btn btn-outline-secondary" onClick={onFechar}>Cancelar</button>
        <button type="submit" form="form-sessao" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Registrar atendimento'}
        </button>
      </>}>
      <form id="form-sessao" onSubmit={salvar}>
        <div className="modal-body">
          {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
          <div className="row g-2 mb-2">
            <div className="col-md-4">
              <label className="form-label small">Data</label>
              <input type="date" className="form-control" required value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="col-md-8">
              <label className="form-label small">Profissional</label>
              <select className="form-select" value={form.profissional || ''}
                onChange={(e) => setForm({ ...form, profissional: e.target.value })}>
                <option value="">Não informado</option>
                {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label small">Procedimento realizado</label>
            <input className="form-control" required value={form.procedimento}
              onChange={(e) => setForm({ ...form, procedimento: e.target.value })} />
          </div>
          <CampoTexto rotulo="Descrição do atendimento" valor={form.descricao}
            onChange={(v) => setForm({ ...form, descricao: v })} linhas={3} />
          <CampoTexto rotulo="Observações da sessão" valor={form.observacoes}
            onChange={(v) => setForm({ ...form, observacoes: v })} />

          <div className="row g-2 mt-1">
            <div className="col-md-6">
              <label className="form-label small">Foto antes</label>
              <input type="file" accept="image/*" className="form-control form-control-sm"
                onChange={(e) => escolherFoto(e, setFotoAntes)} />
              {fotoAntes && <img src={fotoAntes} alt="Antes" className="img-fluid rounded mt-2" style={{ maxHeight: 140 }} />}
            </div>
            <div className="col-md-6">
              <label className="form-label small">Foto depois</label>
              <input type="file" accept="image/*" className="form-control form-control-sm"
                onChange={(e) => escolherFoto(e, setFotoDepois)} />
              {fotoDepois && <img src={fotoDepois} alt="Depois" className="img-fluid rounded mt-2" style={{ maxHeight: 140 }} />}
            </div>
          </div>
        </div>
      </form>
    </ModalBase>
  );
}

function ModalVerSessao({ sessao, onFechar, onExcluido, onErro }) {
  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    Promise.all(sessao.fotos.map((f) => axiosClient.get(`/prontuario/fotos/${f.id}/`).then((r) => r.data)))
      .then(setFotos)
      .catch((e) => onErro(extrairErro(e)));
  }, [sessao]); // eslint-disable-line

  async function excluir() {
    if (!window.confirm('Excluir este atendimento e suas fotos?')) return;
    try {
      await axiosClient.delete(`/prontuario/sessoes/${sessao.id}/`);
      onExcluido();
    } catch (e) {
      onErro(extrairErro(e));
    }
  }

  return (
    <ModalBase titulo={`${sessao.procedimento} — ${formatarData(sessao.data)}`} onFechar={onFechar}
      rodape={<>
        <button type="button" className="btn btn-outline-danger me-auto" onClick={excluir}>
          <i className="bi bi-trash me-1"></i> Excluir atendimento
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onFechar}>Fechar</button>
      </>}>
      <div className="modal-body">
        <div className="small text-muted mb-2">Profissional: {sessao.profissional_nome || 'Não informado'}</div>
        {sessao.descricao && <div className="mb-2"><strong className="small">Descrição:</strong><div>{sessao.descricao}</div></div>}
        {sessao.observacoes && <div className="mb-3"><strong className="small">Observações:</strong><div>{sessao.observacoes}</div></div>}
        {fotos.length > 0 && (
          <div className="row g-2">
            {fotos.map((f) => (
              <div className="col-md-6" key={f.id}>
                <div className="small fw-semibold text-muted mb-1">{f.tipo === 'antes' ? 'Antes' : 'Depois'}</div>
                <img src={f.imagem} alt={f.tipo} className="img-fluid rounded w-100" />
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalBase>
  );
}

function AbaAtendimentos({ clienteId, onErro }) {
  const [sessoes, setSessoes] = useState([]);
  const [novaAberta, setNovaAberta] = useState(false);
  const [sessaoAberta, setSessaoAberta] = useState(null);

  async function carregar() {
    try {
      const r = await axiosClient.get(`/prontuario/clientes/${clienteId}/sessoes/`);
      setSessoes(r.data.results || r.data);
    } catch (e) {
      onErro(extrairErro(e));
    }
  }

  useEffect(() => { carregar(); }, [clienteId]); // eslint-disable-line

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small">{sessoes.length} atendimento(s) registrado(s)</span>
        <button className="btn btn-primary btn-sm" onClick={() => setNovaAberta(true)}>
          <i className="bi bi-plus-lg me-1"></i> Novo atendimento
        </button>
      </div>

      {sessoes.length === 0 && (
        <div className="card border-0 shadow-sm text-center text-muted py-4">Nenhum atendimento registrado.</div>
      )}

      <div className="d-flex flex-column gap-2">
        {sessoes.map((s) => (
          <div key={s.id} className="card border-0 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setSessaoAberta(s)}>
            <div className="card-body py-3 d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{s.procedimento}</div>
                <div className="small text-muted">{formatarData(s.data)} · {s.profissional_nome || 'Sem profissional'}</div>
              </div>
              {s.fotos.length > 0 && (
                <span className="badge text-bg-info"><i className="bi bi-camera me-1"></i>{s.fotos.length}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {novaAberta && (
        <ModalNovaSessao clienteId={clienteId} onFechar={() => setNovaAberta(false)}
          onSalvo={() => { setNovaAberta(false); carregar(); }} />
      )}
      {sessaoAberta && (
        <ModalVerSessao sessao={sessaoAberta} onErro={onErro} onFechar={() => setSessaoAberta(null)}
          onExcluido={() => { setSessaoAberta(null); carregar(); }} />
      )}
    </div>
  );
}

export default function ProntuarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [aba, setAba] = useState('atendimentos');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    axiosClient.get(`/clientes/${id}/`)
      .then((r) => setCliente(r.data))
      .catch(() => setErro('Cliente não encontrado.'));
  }, [id]);

  return (
    <div>
      <button className="btn btn-link text-decoration-none ps-0 mb-2" onClick={() => navigate('/clientes')}>
        <i className="bi bi-arrow-left me-1"></i> Clientes
      </button>

      <h3 className="fw-bold mb-0">Prontuário</h3>
      <div className="text-muted mb-3">{cliente?.nome}</div>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}
      {aviso && <div className="alert alert-success py-2 small">{aviso}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${aba === 'atendimentos' ? 'active' : ''}`} onClick={() => setAba('atendimentos')}>
            Atendimentos
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${aba === 'anamnese' ? 'active' : ''}`} onClick={() => setAba('anamnese')}>
            Anamnese
          </button>
        </li>
      </ul>

      {aba === 'atendimentos'
        ? <AbaAtendimentos clienteId={id} onErro={setErro} />
        : <AbaAnamnese clienteId={id} onAviso={setAviso} onErro={setErro} />}
    </div>
  );
}
