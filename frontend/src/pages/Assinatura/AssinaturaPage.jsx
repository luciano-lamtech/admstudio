import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const STATUS = {
  teste: { label: 'Período de teste', cor: 'text-bg-info' },
  ativo: { label: 'Em dia', cor: 'text-bg-success' },
  devedor: { label: 'Devedor', cor: 'text-bg-warning' },
  inativo: { label: 'Inativo', cor: 'text-bg-secondary' },
};

const FORMAS = { boleto: 'Boleto (com Pix)', cartao: 'Cartão de crédito' };

function reais(valor) {
  return `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarData(iso) {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
}

export default function AssinaturaPage() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    axiosClient.get('/assinatura/')
      .then((r) => setDados(r.data))
      .catch(() => setErro('Não foi possível carregar a assinatura.'));
  }, []);

  if (erro) return <div className="alert alert-danger py-2 small">{erro}</div>;
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
            Cada estabelecimento paga R$ 49,90, mais R$ 19,90 por unidade ativa além da primeira.
            Ao adicionar um novo CPF/CNPJ, o valor total é atualizado.
          </div>
        </div>
      </div>
    </div>
  );
}
