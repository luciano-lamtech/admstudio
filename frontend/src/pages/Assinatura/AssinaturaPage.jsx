import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const STATUS = {
  teste: { label: 'Período de teste', cor: 'text-bg-info' },
  vencido: { label: 'Período de teste - vencido', cor: 'text-bg-danger' },
  ativo: { label: 'Em dia', cor: 'text-bg-success' },
  devedor: { label: 'Devedor', cor: 'text-bg-warning' },
  inativo: { label: 'Inativo - falta de pagamento', cor: 'text-bg-danger' },
};

const FORMAS = { boleto: 'Boleto (com Pix)', cartao: 'Cartão de crédito' };

function reais(valor) {
  return `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarData(iso) {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

const INTERVALO_CONFERENCIA_MS = 20000;

export default function AssinaturaPage() {
  const { assinatura, atualizarAssinatura } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const liberouRef = useRef(false);

  // Atualiza a tela com a resposta do servidor. Se o pagamento foi confirmado, libera o
  // sistema na hora (sem precisar sair e entrar de novo).
  const aplicar = useCallback((novo) => {
    setDados(novo);
    if (!novo.sem_assinatura) {
      atualizarAssinatura({ bloqueado: novo.bloqueado, status: novo.status_cobranca });
      if (assinatura?.bloqueado && !novo.bloqueado && !liberouRef.current) {
        liberouRef.current = true;
        setAviso('Pagamento confirmado! Seu acesso foi liberado.');
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    }
  }, [assinatura?.bloqueado, atualizarAssinatura, navigate]);

  useEffect(() => {
    axiosClient.get('/assinatura/')
      .then((r) => aplicar(r.data))
      .catch(() => setErro('Não foi possível carregar a assinatura.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Com o acesso restrito e um boleto em aberto, confere o pagamento de tempos em tempos.
  const aguardandoPagamento = !!dados && !dados.sem_assinatura && dados.bloqueado && dados.tem_boleto;
  useEffect(() => {
    if (!aguardandoPagamento) return undefined;
    const timer = setInterval(() => {
      axiosClient.get('/assinatura/').then((r) => aplicar(r.data)).catch(() => {});
    }, INTERVALO_CONFERENCIA_MS);
    return () => clearInterval(timer);
  }, [aguardandoPagamento, aplicar]);

  async function chamar(caminho, mensagemErro) {
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      const r = await axiosClient.post(caminho);
      aplicar(r.data);
      return r.data;
    } catch (err) {
      setErro(err.response?.data?.detail || mensagemErro);
      return null;
    } finally {
      setOcupado(false);
    }
  }

  const gerarBoleto = () => chamar('/assinatura/gerar-boleto/', 'Não foi possível gerar o boleto agora.');

  async function verificarPagamento() {
    const novo = await chamar('/assinatura/verificar/', 'Não foi possível consultar o pagamento agora.');
    if (novo && novo.bloqueado) {
      setAviso('Ainda não identificamos o pagamento. O boleto pode levar até 3 dias úteis para compensar; o Pix cai em instantes.');
    }
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(dados.linha_digitavel);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o código do boleto:', dados.linha_digitavel);
    }
  }

  // Usuário sem permissão (não é gerente) com o acesso restrito: orienta em vez de mostrar erro.
  if (erro && !dados && assinatura?.bloqueado) {
    return (
      <div>
        <h3 className="fw-bold mb-3">Minha Assinatura</h3>
        <div className="alert alert-warning">
          O acesso ao sistema está suspenso: o período de teste terminou ou a assinatura está sem pagamento.
          Peça ao gerente ou responsável pela conta para abrir esta tela e regularizar o pagamento.
        </div>
      </div>
    );
  }

  if (erro && !dados) return <div className="alert alert-danger py-2 small">{erro}</div>;
  if (!dados) return <div className="text-muted">Carregando...</div>;

  if (dados.sem_assinatura) {
    return (
      <div>
        <h3 className="fw-bold mb-3">Minha Assinatura</h3>
        <div className="alert alert-light">Nenhuma assinatura vinculada a este estabelecimento.</div>
      </div>
    );
  }

  const status = STATUS[dados.status_cobranca] || { label: dados.status_cobranca, cor: 'text-bg-secondary' };

  return (
    <div>
      <h3 className="fw-bold mb-3">Minha Assinatura</h3>

      {aviso && <div className={`alert py-2 small ${dados.bloqueado ? 'alert-info' : 'alert-success'}`}>{aviso}</div>}
      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

      {dados.bloqueado && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderLeft: '5px solid #dc3545' }}>
          <div className="card-body">
            <div className="fw-bold fs-5 mb-1">
              <i className="bi bi-lock me-2 text-danger"></i>
              {dados.status_cobranca === 'vencido' ? 'Seu período de teste terminou' : 'Sua assinatura está inativa'}
            </div>
            <p className="text-muted mb-3">
              Pague o boleto abaixo para continuar usando o sistema. Assim que o pagamento for confirmado,
              o acesso é liberado automaticamente com mais um mês de uso. Seus dados estão guardados.
            </p>

            {dados.tem_boleto ? (
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  <a href={dados.link_boleto} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <i className="bi bi-file-earmark-text me-2"></i>Abrir boleto
                  </a>
                  {dados.linha_digitavel && (
                    <button type="button" className="btn btn-outline-secondary" onClick={copiarCodigo}>
                      <i className="bi bi-clipboard me-2"></i>{copiado ? 'Código copiado!' : 'Copiar código do boleto'}
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-success" onClick={verificarPagamento} disabled={ocupado}>
                    <i className="bi bi-arrow-repeat me-2"></i>{ocupado ? 'Verificando...' : 'Já paguei, verificar'}
                  </button>
                </div>
                <div className="small text-muted">
                  Valor: <strong>{reais(dados.valor_atual)}</strong> · Vence em <strong>{formatarData(dados.data_vencimento)}</strong>.
                  Esta tela confere o pagamento automaticamente.
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-primary" onClick={gerarBoleto} disabled={ocupado}>
                <i className="bi bi-receipt me-2"></i>{ocupado ? 'Gerando boleto...' : `Gerar boleto de ${reais(dados.valor_total)}`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d6eaf8', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Valor mensal total</div>
              <div className="fs-3 fw-bold">{reais(dados.valor_total)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#fdf3d0', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Forma de pagamento</div>
              <div className="fs-5 fw-bold">{FORMAS[dados.forma_pagamento] || dados.forma_pagamento}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#d5f2df', borderRadius: '10px' }}>
            <div className="card-body text-center">
              <div className="text-uppercase small fw-semibold mb-1 opacity-75">Situação</div>
              <div className="mb-1"><span className={`badge rounded-pill ${status.cor}`}>{status.label}</span></div>
              {dados.status_cobranca === 'teste' && (
                <div className="small">Teste grátis até {formatarData(dados.teste_ate)}</div>
              )}
              {dados.status_cobranca === 'vencido' && (
                <div className="small">Teste encerrado em {formatarData(dados.teste_ate)}</div>
              )}
              {dados.status_cobranca === 'ativo' && dados.data_vencimento && (
                <div className="small">Próximo vencimento: {formatarData(dados.data_vencimento)}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="fw-bold mb-2">Estabelecimentos nesta assinatura</div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>ESTABELECIMENTO</th>
                  <th>CPF/CNPJ</th>
                  <th>UNIDADES ATIVAS</th>
                  <th className="text-end">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {dados.contas.map((c) => (
                  <tr key={c.cnpj_cpf}>
                    <td className="fw-semibold">{c.nome}</td>
                    <td>{c.cnpj_cpf}</td>
                    <td>{c.unidades_ativas}</td>
                    <td className="text-end">{reais(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="small text-muted mt-3">
            Cada estabelecimento paga {reais(dados.precos?.assinatura_base)}, que inclui uma unidade, mais {reais(dados.precos?.unidade_adicional)} por unidade adicional.
            Ao criar ou ativar uma unidade, o valor total é atualizado.
          </div>
        </div>
      </div>
    </div>
  );
}
