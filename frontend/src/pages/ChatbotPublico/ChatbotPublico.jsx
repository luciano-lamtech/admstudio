import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function proximosDias(qtd) {
  const dias = [];
  const hoje = new Date();
  for (let i = 0; i < qtd; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = `${DIAS_SEMANA[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dias.push({ iso, label });
  }
  return dias;
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
        bot(`Olá! 👋 Bem-vindo(a) ao ${res.data.nome}.`);
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
      bot('Beleza! Me informa o telefone que você usou no agendamento:');
      setEtapa('consultar_telefone');
    } else if (opcao === 'cancelar') {
      usuario('❌ Cancelar agendamento');
      bot('Sem problema. Me informa o telefone que você usou no agendamento:');
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
    bot('E o seu telefone/WhatsApp (com DDD):');
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
        cliente_telefone: telefoneInput,
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
      bot(err.response?.data?.detail || 'Não consegui confirmar o agendamento. Tente novamente.');
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
      const res = await axiosClient.post(`/publico/${cnpj}/consultar/`, { telefone: telefoneInput });
      setAgendamentos(res.data);
      if (res.data.length === 0) {
        bot('Não encontrei nenhum agendamento com esse telefone.');
        setEtapa('menu');
      } else {
        bot(`Encontrei ${res.data.length} agendamento(s):`);
        res.data.forEach((ag) => {
          bot(`📌 ${ag.servicos.join(', ')} — ${ag.data_hora} — ${ag.status_display}${ag.profissional_nome ? ' — ' + ag.profissional_nome : ''}`);
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
      const res = await axiosClient.post(`/publico/${cnpj}/consultar/`, { telefone: telefoneInput });
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
    usuario(`Cancelar: ${ag.servicos.join(', ')} — ${ag.data_hora}`);
    setCarregandoOpcoes(true);
    try {
      await axiosClient.post(`/publico/${cnpj}/cancelar/`, { agendamento_id: ag.id, telefone: telefoneInput });
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
    <div className="d-flex flex-column vh-100" style={{ backgroundColor: '#e9edf2', maxWidth: 480, margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div className="bg-dark text-white px-3 py-3 d-flex align-items-center gap-2">
        <i className="bi bi-robot fs-4"></i>
        <div>
          <div className="fw-bold">{nomeNegocio || 'ADMSTUDIO'}</div>
          <div className="small text-white-50">Agendamento online</div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-grow-1 overflow-auto px-3 py-3">
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
      <div className="bg-white border-top p-3">
        {etapa === 'menu' && (
          <div className="d-grid gap-2">
            <button className="btn btn-primary" onClick={() => escolherMenu('agendar')}>📅 Agendar horário</button>
            <button className="btn btn-outline-primary" onClick={() => escolherMenu('consultar')}>🔍 Consultar meus agendamentos</button>
            <button className="btn btn-outline-danger" onClick={() => escolherMenu('cancelar')}>❌ Cancelar agendamento</button>
          </div>
        )}

        {etapa === 'agendar_servico' && (
          <div className="d-flex flex-wrap gap-2">
            {servicos.map((s) => (
              <button key={s.id} className="btn btn-outline-primary btn-sm" onClick={() => escolherServico(s)}>
                {s.nome} — R$ {parseFloat(s.preco).toFixed(2).replace('.', ',')}
              </button>
            ))}
          </div>
        )}

        {etapa === 'agendar_profissional' && (
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => escolherProfissional(null)}>Sem preferência</button>
            {profissionais.map((p) => (
              <button key={p.id} className="btn btn-outline-primary btn-sm" onClick={() => escolherProfissional(p)}>{p.nome}</button>
            ))}
          </div>
        )}

        {etapa === 'agendar_data' && (
          <div className="d-flex flex-wrap gap-2">
            {proximosDias(10).map((d) => (
              <button key={d.iso} className="btn btn-outline-primary btn-sm" onClick={() => escolherData(d)}>{d.label}</button>
            ))}
          </div>
        )}

        {etapa === 'agendar_horario' && (
          <div className="d-flex flex-wrap gap-2">
            {horarios.map((h) => (
              <button key={h} className="btn btn-outline-primary btn-sm" onClick={() => escolherHorario(h)}>{h}</button>
            ))}
          </div>
        )}

        {etapa === 'agendar_nome' && (
          <form onSubmit={confirmarNome} className="d-flex gap-2">
            <input className="form-control" autoFocus placeholder="Seu nome" value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)} />
            <button className="btn btn-primary" type="submit">Enviar</button>
          </form>
        )}

        {etapa === 'agendar_telefone' && (
          <form onSubmit={confirmarTelefone} className="d-flex gap-2">
            <input className="form-control" autoFocus placeholder="(99) 99999-9999" value={telefoneInput}
              onChange={(e) => setTelefoneInput(e.target.value)} />
            <button className="btn btn-primary" type="submit">Confirmar</button>
          </form>
        )}

        {etapa === 'consultar_telefone' && (
          <form onSubmit={consultarComTelefone} className="d-flex gap-2">
            <input className="form-control" autoFocus placeholder="(99) 99999-9999" value={telefoneInput}
              onChange={(e) => setTelefoneInput(e.target.value)} />
            <button className="btn btn-primary" type="submit">Consultar</button>
          </form>
        )}

        {etapa === 'cancelar_telefone' && (
          <form onSubmit={buscarParaCancelar} className="d-flex gap-2">
            <input className="form-control" autoFocus placeholder="(99) 99999-9999" value={telefoneInput}
              onChange={(e) => setTelefoneInput(e.target.value)} />
            <button className="btn btn-danger" type="submit">Buscar</button>
          </form>
        )}

        {etapa === 'cancelar_lista' && (
          <div className="d-grid gap-2">
            {agendamentos.map((ag) => (
              <button key={ag.id} className="btn btn-outline-danger btn-sm text-start" onClick={() => cancelarAgendamento(ag)}>
                {ag.servicos.join(', ')} — {ag.data_hora}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
