export const formatQuantity = (valor) => {
  const n = Number(valor);
  if (!isFinite(n)) return '0';
  return parseFloat(n.toFixed(3)).toString();
};

export const formatBs = (valor) => {
  const n = Number(valor);
  if (!isFinite(n)) return '0.00';
  return n.toFixed(2);
};