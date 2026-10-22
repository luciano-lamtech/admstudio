import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function SenhaOperacaoPage() {
  const [codigo, setCodigo] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState('');

  const buscar = useCallback(() => {
    axiosClient.get('/usuarios/senha-operacao/')
      .then((r) => {
        setCodigo(r.data.codigo);
        setSegundos(r.data.segundos_restantes);
        setErro('');
      })
      .catch(() => setErro('Não foi possível obter a senha de operação.'));
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Contagem regressiva: ao chegar a zero, busca a nova senha do minuto seguinte
  useEffect(() => {
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          buscar();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [buscar]);

  const formatado = codigo ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : '—';

  return (
    <div>
      <h3 className="fw-bold mb-3">Senha de Operação</h3>

      {erro && <div className="alert alert-danger py-2 small">{erro}</div>}

      <div className="card border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 420, borderRadius: 12 }}>
        <div className="card-body py-5">
          <div className="text-uppercase small fw-semibold text-muted mb-2" style={{ letterSpacing: '0.5px' }}>
            Senha do momento
          </div>
          <div className="display-4 fw-bold font-monospace" style={{ letterSpacing: '4px' }}>{formatado}</div>
          <div className="progress mx-auto mt-4" style={{ height: 6, maxWidth: 260 }}>
            <div className="progress-bar" style={{ width: `${(segundos / 60) * 100}%`, transition: 'width 1s linear' }}></div>
          </div>
          <div className="small text-muted mt-2">Muda em {segundos} segundo(s)</div>
          <div className="small text-muted mt-4">
            Informe esta senha ao atendente que precisar zerar o cashback de um cliente.
          </div>
        </div>
      </div>
    </div>
  );
}
