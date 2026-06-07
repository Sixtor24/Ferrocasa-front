import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiCategoriaEspecifica,
  ApiCategoriaGeneral,
  ApiItemResponse,
  ApiListResponse,
  ApiSubcategoria,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import { fetchAllPages, listParams } from '../pagination';

export type CategoriasGeneralesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type SubcategoriasQuery = CategoriasGeneralesQuery & {
  id_categoria_general?: number;
};

export type CategoriasEspecificasQuery = CategoriasGeneralesQuery & {
  id_subcategoria?: number;
};

export type CategoriaGeneralPayload = {
  nombre: string;
};

export type SubcategoriaPayload = {
  nombre: string;
  id_categoria_general: number;
};

export type CategoriaEspecificaPayload = {
  nombre: string;
  id_subcategoria: number;
};

function mapCategoriasGeneralesList(res: ApiListResponse<ApiCategoriaGeneral>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapSubcategoriasList(res: ApiListResponse<ApiSubcategoria>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapCategoriasEspecificasList(res: ApiListResponse<ApiCategoriaEspecifica>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchCategoriasGenerales(query: CategoriasGeneralesQuery = {}) {
  const paging = listParams(query.page, query.limit, 10);
  const res = await apiRequest<ApiListResponse<ApiCategoriaGeneral>>('/categorias/general', {
    params: {
      ...paging,
      search: query.search,
    },
  });

  return mapCategoriasGeneralesList(res);
}

export async function fetchAllCategoriasGenerales(query: Omit<CategoriasGeneralesQuery, 'page' | 'limit'> = {}) {
  return fetchAllPages(async (page, limit) => fetchCategoriasGenerales({ ...query, page, limit }));
}

export async function fetchCategoriaGeneralById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaGeneral>>(`/categorias/general/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchSubcategoriasByCategoriaGeneral(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiSubcategoria[]> | ApiListResponse<ApiSubcategoria>>(
    `/categorias/general/${id}/subcategorias`
  );

  return res.data ?? [];
}

export async function createCategoriaGeneral(body: CategoriaGeneralPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaGeneral>>('/categorias/general', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateCategoriaGeneral(id: number, body: CategoriaGeneralPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaGeneral>>(`/categorias/general/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteCategoriaGeneral(id: number) {
  await apiRequest(`/categorias/general/${id}`, { method: 'DELETE' });
}

export async function fetchSubcategorias(query: SubcategoriasQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiSubcategoria>>('/categorias/subcategoria', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      id_categoria_general: query.id_categoria_general,
    },
  });

  return mapSubcategoriasList(res);
}

export async function fetchSubcategoriaById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiSubcategoria>>(`/categorias/subcategoria/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchSubcategoriasByGeneral(idGeneral: number) {
  const res = await apiRequest<ApiItemResponse<ApiSubcategoria[]> | ApiListResponse<ApiSubcategoria>>(
    `/categorias/subcategoria/general/${idGeneral}`
  );

  return res.data ?? [];
}

export async function fetchCategoriasEspecificasBySubcategoria(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaEspecifica[]> | ApiListResponse<ApiCategoriaEspecifica>>(
    `/categorias/subcategoria/${id}/especificas`
  );

  return res.data ?? [];
}

export async function createSubcategoria(body: SubcategoriaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiSubcategoria>>('/categorias/subcategoria', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateSubcategoria(id: number, body: SubcategoriaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiSubcategoria>>(`/categorias/subcategoria/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteSubcategoria(id: number) {
  await apiRequest(`/categorias/subcategoria/${id}`, { method: 'DELETE' });
}

export async function fetchCategoriasEspecificas(query: CategoriasEspecificasQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiCategoriaEspecifica>>('/categorias/especifica', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      id_subcategoria: query.id_subcategoria,
    },
  });

  return mapCategoriasEspecificasList(res);
}

export async function fetchCategoriaEspecificaById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaEspecifica>>(`/categorias/especifica/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchCategoriasEspecificasBySubcategoriaId(idSubcategoria: number) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaEspecifica[]> | ApiListResponse<ApiCategoriaEspecifica>>(
    `/categorias/especifica/subcategoria/${idSubcategoria}`
  );

  return res.data ?? [];
}

export async function fetchCategoriaEspecificaBienes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/categorias/especifica/${id}/bienes`
  );

  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchCategoriaEspecificaVehiculos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/categorias/especifica/${id}/vehiculos`
  );

  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function createCategoriaEspecifica(body: CategoriaEspecificaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaEspecifica>>('/categorias/especifica', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateCategoriaEspecifica(id: number, body: CategoriaEspecificaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCategoriaEspecifica>>(`/categorias/especifica/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteCategoriaEspecifica(id: number) {
  await apiRequest(`/categorias/especifica/${id}`, { method: 'DELETE' });
}
