import { apiRequest } from '../client';
import type { ApiBeneficiario, ApiItemResponse, ApiListResponse } from '../types';

export type BeneficiariosQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type BeneficiarioPayload = {
  id_beneficiario?: string;
  nombre: string;
};

function mapBeneficiariosList(res: ApiListResponse<ApiBeneficiario>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchBeneficiarios(query: BeneficiariosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiBeneficiario>>('/beneficiarios', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });

  return mapBeneficiariosList(res);
}

export async function fetchBeneficiarioById(id: string) {
  const res = await apiRequest<ApiItemResponse<ApiBeneficiario>>(
    `/beneficiarios/${encodeURIComponent(id)}`,
  );
  if (!res.data) throw new Error('Beneficiario no encontrado');

  return res.data;
}

export async function createBeneficiario(body: BeneficiarioPayload) {
  const res = await apiRequest<ApiItemResponse<ApiBeneficiario>>('/beneficiarios', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}
