import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { dataLocalISO } from '../../utils/datas';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Deixa só dígitos (sem espaço, traço, parênteses) e remove o zero inicial
// do DDD (ex: 016991234567 vira 16991234567). Máximo de 11 dígitos
// (DDD + 9 dígitos do celular).
function normalizarTelefone(texto) {
  const somenteDigitos = (texto || '').replace(/\D/g, '');
  return somenteDigitos.replace(/^0+/, '').slice(0, 11);
}

const ESTILO_BOTAO = {
  border: '1px solid #d6e0ee',
  background: '#ffffff',
  color: '#1e2a38',
  borderRadius: 999,
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 500,
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
  cursor: 'pointer',
  transition: 'transform 0.1s, box-shadow 0.1s',
};
const ESTILO_BOTAO_PRIMARIO = {
  ...ESTILO_BOTAO,
  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  color: '#ffffff',
  border: 'none',
  boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
};
const ESTILO_BOTAO_PERIGO = {
  ...ESTILO_BOTAO,
  color: '#dc2626',
  borderColor: '#fecaca',
};

function Opcao({ children, onClick, estilo = ESTILO_BOTAO, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={estilo}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}

// Próximos dias usando a data LOCAL (não UTC), e com exibição dd/mm/aaaa
function proximosDias(qtd) {
  const dias = [];
  const hoje = new Date();
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const iso = dataLocalISO(d);
    const label = `${DIAS_SEMANA[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dias.push({ iso, label });
  }
  return dias;
}

// 'aaaa-mm-dd' ou 'aaaa-mm-dd hh:mm' -> 'dd/mm/aaaa hh:mm'
function formatarDataHora(texto) {
  if (!texto) return '';
  const [data, hora] = texto.split(' ');
  const [ano, mes, dia] = data.split('-');
  return hora ? `${dia}/${mes}/${ano} ${hora}` : `${dia}/${mes}/${ano}`;
}

export default function ChatbotPublico() {
  const { cnpj } = useParams();
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [etapa, setEtapa] = useState('carregando');
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  // dados acumulados durante o fluxo de agendamento
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [escolha, setEscolha] = useState({});
  const [nomeInput, setNomeInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');

  const fimRef = useRef(null);

  function bot(texto) {
    setMensagens((msgs) => [...msgs, { autor: 'bot', texto }]);
  }
  function usuario(texto) {
    setMensagens((msgs) => [...msgs, { autor: 'usuario', texto }]);
  }

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, etapa]);

  useEffect(() => {
    async function iniciar() {
      try {
        const res = await axiosClient.get(`/publico/${cnpj}/info/`);
        setNomeNegocio(res.data.nome);
        bot(`Olá! 👋 Bem-vindo(a) ao ${res.data.nome}. Responda com os botões abaixo!`);
        bot('O que você gostaria de fazer?');
        setEtapa('menu');
      } catch {
        bot('Não foi possível encontrar esse estabelecimento. Verifique o link e tente novamente.');
        setEtapa('erro');
      }
    }
    iniciar();
  }, [cnpj]); // eslint-disable-line

  // ----- MENU PRINCIPAL -----
  function escolherMenu(opcao) {
    if (opcao === 'agendar') {
      usuario('📅 Agendar horário');
      iniciarAgendamento();
    } else if (opcao === 'consultar') {
      usuario('🔍 Consultar meus agendamentos');
      bot('Beleza! Me informa o telefone que você usou no agendamento, somente números com DDD (ex: 16991234567):');
      setEtapa('consultar_telefone');
    } else if (opcao === 'cancelar') {
      usuario('❌ Cancelar agendamento');
      bot('Sem problema. Me informa o telefone que você usou no agendamento, somente números com DDD (ex: 16991234567):');
      setEtapa('cancelar_telefone');
    }
  }

  // ----- FLUXO: AGENDAR -----
  async function iniciarAgendamento() {
    setCarregandoOpcoes(true);
    try {
      const res = await axiosClient.get(`/publico/${cnpj}/servicos/`);
      setServicos(res.data);
      if (res.data.length === 0) {
        bot('No momento não há serviços disponíveis para agendamento online. Entre em contato diretamente com o estabelecimento.');
        setEtapa('menu');
        return;
      }
      bot('Qual serviço você gostaria de agendar?');
      setEtapa('agendar_servico');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  async function escolherServico(servico) {
    usuario(servico.nome);
    setEscolha((e) => ({ ...e, servico }));
    setCarregandoOpcoes(true);
    try {
      const res = await axiosClient.get(`/publico/${cnpj}/profissionais/`);
      setProfissionais(res.data);
      bot('Com qual profissional você prefere?');
      setEtapa('agendar_profissional');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  function escolherProfissional(prof) {
    usuario(prof ? prof.nome : 'Sem preferência');
    const profissionalEscolhido = prof || profissionais[0] || null;
    setEscolha((e) => ({ ...e, profissional: profissionalEscolhido }));
    bot('Para qual dia você quer agendar?');
    setEtapa('agendar_data');
  }

  async function escolherData(dia) {
    usuario(dia.label);
    setEscolha((e) => ({ ...e, data: dia }));
    setCarregandoOpcoes(true);
    try {
      const prof = escolha.profissional;
      const res = await axiosClient.get(`/publico/${cnpj}/horarios/`, {
        params: { profissional: prof?.id, data: dia.iso, duracao: escolha.servico?.duracao_minutos || 30 },
      });
      setHorarios(res.data);
      if (res.data.length === 0) {
        bot('Não há horários livres nesse dia com esse profissional. Escolha outro dia:');
        setEtapa('agendar_data');
        return;
      }
      bot('Escolha um horário:');
      setEtapa('agendar_horario');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  function escolherHorario(hora) {
    usuario(hora);
    setEscolha((e) => ({ ...e, hora }));
    bot('Perfeito! Pra finalizar, me diz seu nome:');
    setEtapa('agendar_nome');
  }

  function confirmarNome(e) {
    e.preventDefault();
    if (!nomeInput.trim()) return;
    usuario(nomeInput);
    bot('E o seu telefone/WhatsApp? Digite somente números, com DDD (ex: 16991234567):');
    setEtapa('agendar_telefone');
  }

  async function confirmarTelefone(e) {
    e.preventDefault();
    if (!telefoneInput.trim()) return;
    usuario(telefoneInput);
    setCarregandoOpcoes(true);
    try {
      const resumo = `${escolha.servico.nome} com ${escolha.profissional?.nome || 'profissional disponível'}, ${escolha.data.label} às ${escolha.hora}.`;
      bot(`Confirmando: ${resumo}`);
      const payload = {
        cliente_nome: nomeInput,
        cliente_telefone: normalizarTelefone(telefoneInput),
        servico_id: escolha.servico.id,
        profissional_id: escolha.profissional?.id || null,
        data_hora: `${escolha.data.iso} ${escolha.hora}`,
      };
      await axiosClient.post(`/publico/${cnpj}/agendar/`, payload);
      bot('✅ Agendamento confirmado! Guarde o telefone que você usou — ele serve pra consultar ou cancelar depois.');
      bot('Posso ajudar em mais alguma coisa?');
      setEtapa('menu');
      setNomeInput('');
      setTelefoneInput('');
      setEscolha({});
    } catch (err) {
      // Cancela o processo: mostra o motivo, limpa os dados e volta ao menu
      bot(err.response?.data?.detail || 'Não consegui confirmar o agendamento. Tente novamente.');
      setNomeInput('');
      setTelefoneInput('');
      setEscolha({});
      setEtapa('menu');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  // ----- FLUXO: CONSULTAR -----
  async function consultarComTelefone(e) {
    e.preventDefault();
    if (!telefoneInput.trim()) return;
    usuario(telefoneInput);
    setCarregandoOpcoes(true);
    try {
      const res = await axiosClient.post(`/publico/${cnpj}/consultar/`, { telefone: normalizarTelefone(telefoneInput) });
      setAgendamentos(res.data);
      if (res.data.length === 0) {
        bot('Não encontrei nenhum agendamento com esse telefone.');
        setEtapa('menu');
      } else {
        bot(`Encontrei ${res.data.length} agendamento(s):`);
        res.data.forEach((ag) => {
          bot(`📌 ${ag.servicos.join(', ')} — ${formatarDataHora(ag.data_hora)} — ${ag.status_display}${ag.profissional_nome ? ' — ' + ag.profissional_nome : ''}`);
        });
        bot('Posso ajudar em mais alguma coisa?');
        setEtapa('menu');
      }
      setTelefoneInput('');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  // ----- FLUXO: CANCELAR -----
  async function buscarParaCancelar(e) {
    e.preventDefault();
    if (!telefoneInput.trim()) return;
    usuario(telefoneInput);
    setCarregandoOpcoes(true);
    try {
      const res = await axiosClient.post(`/publico/${cnpj}/consultar/`, { telefone: normalizarTelefone(telefoneInput) });
      setAgendamentos(res.data);
      if (res.data.length === 0) {
        bot('Não encontrei nenhum agendamento ativo com esse telefone.');
        setEtapa('menu');
      } else {
        bot('Qual agendamento você quer cancelar?');
        setEtapa('cancelar_lista');
      }
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  async function cancelarAgendamento(ag) {
    usuario(`Cancelar: ${ag.servicos.join(', ')} — ${formatarDataHora(ag.data_hora)}`);
    setCarregandoOpcoes(true);
    try {
      await axiosClient.post(`/publico/${cnpj}/cancelar/`, { agendamento_id: ag.id, telefone: normalizarTelefone(telefoneInput) });
      bot('Agendamento cancelado com sucesso. Posso ajudar em mais alguma coisa?');
      setEtapa('menu');
      setTelefoneInput('');
    } catch (err) {
      bot(err.response?.data?.detail || 'Não consegui cancelar. Tente novamente.');
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  return (
    <div className="d-flex flex-column" style={{ height: '100dvh', backgroundColor: '#e9edf2', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
      {/* Cabeçalho fixo (não rola junto com as mensagens) */}
      <div className="px-3 py-3 d-flex align-items-center gap-2" style={{ flex: '0 0 auto', position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#4b5563', color: '#ffffff', borderBottom: '1px solid #374151' }}>
        <i className="bi bi-robot fs-4"></i>
        <div>
          <div className="fw-bold">{nomeNegocio || 'ADMSTUDIO'}</div>
          <div className="small" style={{ color: '#ffffff', opacity: 0.85 }}>Agendamento online</div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="px-3 py-3" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        {mensagens.map((m, i) => (
          <div key={i} className={`d-flex mb-2 ${m.autor === 'usuario' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div
              className={`px-3 py-2 ${m.autor === 'usuario' ? 'bg-primary text-white' : 'bg-white'}`}
              style={{ borderRadius: 14, maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {carregandoOpcoes && (
          <div className="d-flex justify-content-start mb-2">
            <div className="px-3 py-2 bg-white" style={{ borderRadius: 14 }}>
              <span className="spinner-border spinner-border-sm text-secondary"></span>
            </div>
          </div>
        )}
        <div ref={fimRef}></div>
      </div>

      {/* Área de interação, muda conforme a etapa */}
      <div className="bg-white border-top p-3" style={{ flex: '0 0 auto', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {etapa === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Opcao estilo={ESTILO_BOTAO_PRIMARIO} onClick={() => escolherMenu('agendar')}>📅 Agendar horário</Opcao>
            <Opcao onClick={() => escolherMenu('consultar')}>🔍 Consultar meus agendamentos</Opcao>
            <Opcao estilo={ESTILO_BOTAO_PERIGO} onClick={() => escolherMenu('cancelar')}>❌ Cancelar agendamento</Opcao>
          </div>
        )}

        {etapa === 'agendar_servico' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {servicos.map((s) => (
              <Opcao key={s.id} onClick={() => escolherServico(s)}>
                {s.nome} — R$ {parseFloat(s.preco).toFixed(2).replace('.', ',')}
              </Opcao>
            ))}
          </div>
        )}

        {etapa === 'agendar_profissional' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Opcao onClick={() => escolherProfissional(null)}>Sem preferência</Opcao>
            {profissionais.map((p) => (
              <Opcao key={p.id} onClick={() => escolherProfissional(p)}>{p.nome}</Opcao>
            ))}
          </div>
        )}

        {etapa === 'agendar_data' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {proximosDias(10).map((d) => (
              <Opcao key={d.iso} onClick={() => escolherData(d)}>{d.label}</Opcao>
            ))}
          </div>
        )}

        {etapa === 'agendar_horario' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {horarios.map((h) => (
              <Opcao key={h} onClick={() => escolherHorario(h)}>{h}</Opcao>
            ))}
          </div>
        )}

        {etapa === 'agendar_nome' && (
          <form onSubmit={confirmarNome} className="d-flex gap-2">
            <input className="form-control" style={{ borderRadius: 999, padding: '8px 14px' }} autoFocus placeholder="Seu nome" value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)} />
            <button type="submit" style={ESTILO_BOTAO_PRIMARIO}>Enviar</button>
          </form>
        )}

        {etapa === 'agendar_telefone' && (
          <form onSubmit={confirmarTelefone} className="d-flex gap-2">
            <input className="form-control" style={{ borderRadius: 999, padding: '8px 14px' }} autoFocus inputMode="numeric" placeholder="Ex: 16991234567" value={telefoneInput}
              onChange={(e) => setTelefoneInput(normalizarTelefone(e.target.value))} />
            <button type="submit" style={ESTILO_BOTAO_PRIMARIO}>Confirmar</button>
          </form>
        )}

        {etapa === 'consultar_telefone' && (
          <form onSubmit={consultarComTelefone} className="d-flex gap-2">
            <input className="form-control" style={{ borderRadius: 999, padding: '8px 14px' }} autoFocus inputMode="numeric" placeholder="Ex: 16991234567" value={telefoneInput}
              onChange={(e) => setTelefoneInput(normalizarTelefone(e.target.value))} />
            <button type="submit" style={ESTILO_BOTAO_PRIMARIO}>Consultar</button>
          </form>
        )}

        {etapa === 'cancelar_telefone' && (
          <form onSubmit={buscarParaCancelar} className="d-flex gap-2">
            <input className="form-control" style={{ borderRadius: 999, padding: '8px 14px' }} autoFocus inputMode="numeric" placeholder="Ex: 16991234567" value={telefoneInput}
              onChange={(e) => setTelefoneInput(normalizarTelefone(e.target.value))} />
            <button type="submit" style={ESTILO_BOTAO_PERIGO}>Buscar</button>
          </form>
        )}

        {etapa === 'cancelar_lista' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agendamentos.map((ag) => (
              <Opcao key={ag.id} estilo={{ ...ESTILO_BOTAO_PERIGO, borderRadius: 14, textAlign: 'left' }} onClick={() => cancelarAgendamento(ag)}>
                {ag.servicos.join(', ')} — {formatarDataHora(ag.data_hora)}
              </Opcao>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
