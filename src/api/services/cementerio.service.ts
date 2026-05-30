import {
  fetchParcelaById,
  fetchParcelas,
  fetchParcelasEstadisticas,
  type ParcelasQuery,
} from './parcelas.service';

export type CementerioParcelasQuery = ParcelasQuery;

export function fetchCementerioParcelas(query: CementerioParcelasQuery = {}) {
  return fetchParcelas(query);
}

export function fetchCementerioParcelaById(id: number) {
  return fetchParcelaById(id);
}

export function fetchCementerioParcelasEstadisticas() {
  return fetchParcelasEstadisticas();
}
