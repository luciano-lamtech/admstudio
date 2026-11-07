import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function PreferenciasSistemaPage() {
  const { tenant } = useAuth();
  const [cfg, setCfg] = useState(null);
  const [fuso, setFuso] = useState('');
  const [link, setLink] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Link padrão do robô: endereço do próprio sistema + /chat/<CPF/CNPJ do assinante>
  const linkPadrao = `${window.location.origin}/chat/${tenant?.cnpj_cpf || ''}`;

  useEffect(() => {
    axiosClient.get('/configuracoes/preferencias/')
      .then((r) => {
        setCfg(r.data);
        setFuso(r.data.fuso_horario);
        setLink(r.data.link_agendamento || '');
      })
      .catch(() => setMsg({ tipo: 'danger', texto: 'Não foi possível carregar as preferências.' }));
  }, []);

  if (!cfg) {
    return (
      <div>
        <h3 className="fw-bold mb-3">Preferências do Sistema</h3>
        {msg ? <div className={`alert alert-${msg.tipo} py-2 small`}>{msg.texto}</div> : <div className="text-muted">Carregando...</div>}
      </div>
    );
  }

  const editar = cfg.pode_editar;
  const linkEmUso = link.trim() || linkPadrao;
  const rotuloFuso = (valor) => cfg.fusos_disponiveis.find((f) => f.valor === valor)?.rotulo || valor;
  const alterado = fuso !== cfg.fuso_horario || link.trim() !== (cfg.link_agendamento || '');

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const { data } = await axiosClient.put('/configuracoes/preferencias/', {
        fuso_horario: fuso,
        link_agendamento: link.trim(),
      });
      setCfg(data);
      setFuso(data.fuso_horario);
      setLink(data.link_agendamento || '');
      setMsg({ tipo: 'success', texto: 'Preferências salvas com sucesso!' });
    } catch (e) {
      const d = e.response?.data;
      let texto = 'Não foi possível salvar as preferências.';
      if (e.response?.status === 403) texto = 'Somente administradores podem alterar as preferências.';
      else if (d?.link_agendamento) texto = `Link inválido: ${[].concat(d.link_agendamento)[0]}`;
      else if (d?.fuso_horario) texto = [].concat(d.fuso_horario)[0];
      setMsg({ tipo: 'danger', texto });
    } finally {
      setSalvando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkEmUso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setMsg({ tipo: 'warning', texto: 'Não foi possível copiar automaticamente. Selecione o link e copie manualmente.' });
    }
  }

  return (
    <div>
      <h3 className="fw-bold mb-3">Preferências do Sistema</h3>

      {!editar && (
        <div className="alert alert-info py-2 small">
          Somente administradores podem alterar estas preferências.
        </div>
      )}
      {msg && <div className={`alert alert-${msg.tipo} py-2 small`}>{msg.texto}</div>}

      <div className="card border-0 shadow-sm mb-3" style={{ maxWidth: 720, borderRadius: 12 }}>
        <div className="card-body">
          <div className="fw-bold mb-1"><i className="bi bi-clock me-2" />Fuso horário</div>
          <div className="small text-muted mb-3">
            Define o horário usado no dashboard, na agenda, no agendamento online e nos lembretes.
            Configurado atualmente: <strong>{rotuloFuso(cfg.fuso_horario)}</strong>
          </div>
          <select
            className="form-select"
            value={fuso}
            disabled={!editar || salvando}
            onChange={(e) => setFuso(e.target.value)}
          >
            {cfg.fusos_disponiveis.map((f) => (
              <option key={f.valor} value={f.valor}>{f.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3" style={{ maxWidth: 720, borderRadius: 12 }}>
        <div className="card-body">
          <div className="fw-bold mb-1"><i className="bi bi-robot me-2" />Link do robô de agendamento online</div>
          <div className="small text-muted mb-3">
            Este é o link que seus clientes usam para agendar, cancelar e consultar horários.
            Deixe em branco para usar o link padrão do sistema.
          </div>

          <label className="form-label small fw-semibold">Link em uso</label>
          <div className="input-group mb-3">
            <input className="form-control" readOnly value={linkEmUso} onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-outline-secondary" onClick={copiar}>
              <i className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />{copiado ? 'Copiado!' : 'Copiar'}
            </button>
            <a className="btn btn-outline-primary" href={linkEmUso} target="_blank" rel="noreferrer" title="Abrir em nova aba">
              <i className="bi bi-box-arrow-up-right" />
            </a>
          </div>

          <label className="form-label small fw-semibold">Alterar link (opcional)</label>
          <div className="input-group">
            <input
              className="form-control"
              type="url"
              placeholder={linkPadrao}
              value={link}
              disabled={!editar || salvando}
              onChange={(e) => setLink(e.target.value)}
            />
            {editar && link && (
              <button type="button" className="btn btn-outline-secondary" disabled={salvando} onClick={() => setLink('')}>
                Usar padrão
              </button>
            )}
          </div>
        </div>
      </div>

      {editar && (
        <button className="btn btn-primary" disabled={salvando || !alterado} onClick={salvar}>
          <i className="bi bi-check-lg me-1" />{salvando ? 'Salvando...' : 'Salvar'}
        </button>
      )}
    </div>
  );
}
