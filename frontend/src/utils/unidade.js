// Unidade escolhida no seletor do topo. Vazio = todas as unidades.
const CHAVE = 'admstudio_unidade';

export function unidadeAtual() {
  return localStorage.getItem(CHAVE) || '';
}

export function setUnidadeAtual(id) {
  if (id) {
    localStorage.setItem(CHAVE, String(id));
  } else {
    localStorage.removeItem(CHAVE);
  }
}
