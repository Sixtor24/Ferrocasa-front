import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  activarUsuario,
  createUsuario,
  deleteUsuario,
  fetchUsuarios,
  updateUsuario,
} from '../api/services/usuarios.service';
import {
  createRol,
  deleteRol,
  fetchRoles,
  updateRol,
} from '../api/services/roles.service';
import { changePassword } from '../api/services/auth.service';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/forms/SearchableSelect';
import type { RolPayload, RolSistema, UpdateUsuarioPayload, UsuarioPayload, UsuarioSistema } from '../types/auth';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCog,
  X,
} from 'lucide-react';

const PAGE_LIMIT = 100;

type UserFormState = {
  id?: number;
  nombre_usuario: string;
  correo: string;
  password: string;
  id_rol: string;
  activo: boolean;
};

type RoleFormState = {
  id?: number;
  nombre_rol: string;
  descripcion: string;
};

const emptyUserForm: UserFormState = {
  nombre_usuario: '',
  correo: '',
  password: '',
  id_rol: '',
  activo: true,
};

const emptyRoleForm: RoleFormState = {
  nombre_rol: '',
  descripcion: '',
};

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'No se pudo completar la operación';
}

function roleDescription(rol?: RolSistema) {
  return rol?.descripcion || 'Sin descripción';
}

export default function Configuracion() {
  const { usuario, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole('Administrador');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmacion: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);

  const rolesQuery = useApiQuery(
    () => fetchRoles({ page: 1, limit: PAGE_LIMIT, search: roleSearch || undefined }),
    [roleSearch],
    isAdmin,
  );
  const usuariosQuery = useApiQuery(
    () => fetchUsuarios({ page: 1, limit: PAGE_LIMIT, search: userSearch || undefined }),
    [userSearch],
    isAdmin,
  );

  const roles = rolesQuery.data?.data ?? [];
  const usuarios = usuariosQuery.data?.data ?? [];

  const usuariosActivos = useMemo(
    () => usuarios.filter((item) => item.activo).length,
    [usuarios],
  );

  const setSuccess = (message: string) => {
    setSuccessMsg(message);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const setError = (message: string) => {
    setErrorMsg(message);
    setSuccessMsg('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password_nueva !== passwordForm.password_confirmacion) {
      setError('La confirmación de contraseña no coincide');
      return;
    }

    try {
      await changePassword(passwordForm);
      await logout();
      navigate('/');
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const resetUserForm = () => setUserForm(emptyUserForm);

  const editUser = (item: UsuarioSistema) => {
    setUserForm({
      id: item.id_usuario,
      nombre_usuario: item.nombre_usuario,
      correo: item.correo,
      password: '',
      id_rol: String(item.id_rol),
      activo: item.activo,
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idRol = Number(userForm.id_rol);
    if (!Number.isInteger(idRol) || idRol <= 0) {
      setError('Selecciona un rol válido');
      return;
    }

    try {
      if (userForm.id) {
        const payload: UpdateUsuarioPayload = {
          nombre_usuario: userForm.nombre_usuario.trim(),
          correo: userForm.correo.trim(),
          id_rol: idRol,
          activo: userForm.activo,
        };
        await updateUsuario(userForm.id, payload);
        setSuccess('Usuario actualizado exitosamente');
      } else {
        const payload: UsuarioPayload = {
          nombre_usuario: userForm.nombre_usuario.trim(),
          correo: userForm.correo.trim(),
          password: userForm.password,
          id_rol: idRol,
          activo: userForm.activo,
        };
        await createUsuario(payload);
        setSuccess('Usuario creado exitosamente');
      }
      resetUserForm();
      usuariosQuery.refetch();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const handleToggleUser = async (item: UsuarioSistema) => {
    try {
      await activarUsuario(item.id_usuario, { activo: !item.activo });
      setSuccess(item.activo ? 'Usuario suspendido exitosamente' : 'Usuario activado exitosamente');
      usuariosQuery.refetch();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const handleDeleteUser = async (item: UsuarioSistema) => {
    if (!window.confirm(`¿Eliminar el usuario ${item.nombre_usuario}?`)) return;
    try {
      await deleteUsuario(item.id_usuario);
      setSuccess('Usuario eliminado exitosamente');
      usuariosQuery.refetch();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const resetRoleForm = () => setRoleForm(emptyRoleForm);

  const editRole = (item: RolSistema) => {
    setRoleForm({
      id: item.id_rol,
      nombre_rol: item.nombre_rol,
      descripcion: item.descripcion,
    });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: RolPayload = {
      nombre_rol: roleForm.nombre_rol.trim(),
      descripcion: roleForm.descripcion.trim(),
    };

    try {
      if (roleForm.id) {
        await updateRol(roleForm.id, payload);
        setSuccess('Rol actualizado exitosamente');
      } else {
        await createRol(payload);
        setSuccess('Rol creado exitosamente');
      }
      resetRoleForm();
      rolesQuery.refetch();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const handleDeleteRole = async (item: RolSistema) => {
    if (!window.confirm(`¿Eliminar el rol ${item.nombre_rol}?`)) return;
    try {
      await deleteRol(item.id_rol);
      setSuccess('Rol eliminado exitosamente');
      rolesQuery.refetch();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 font-display tracking-tight">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seguridad de sesión, usuarios y perfiles de acceso del sistema.
        </p>
      </div>

      {(successMsg || errorMsg) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            successMsg
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {successMsg || errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center">
              <Shield size={22} className="text-navy-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Perfil autenticado</h2>
              <p className="text-xs text-gray-500">Datos leídos desde `/auth/perfil`</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 text-sm">
            <InfoRow label="ID Usuario" value={usuario?.id_usuario.toString() ?? '—'} />
            <InfoRow label="Nombre de usuario" value={usuario?.nombre_usuario ?? '—'} />
            <InfoRow label="Correo" value={usuario?.correo ?? '—'} />
            <InfoRow label="ID Rol" value={usuario?.id_rol.toString() ?? '—'} />
            <InfoRow label="Rol" value={usuario?.rol.nombre_rol ?? '—'} />
            <InfoRow label="Descripción del rol" value={roleDescription(usuario?.rol)} />
            <InfoRow label="Estado" value={usuario?.activo ? 'Activo' : 'Suspendido'} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
              <KeyRound size={22} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Cambio de contraseña</h2>
              <p className="text-xs text-gray-500">Invalida todas las sesiones activas del usuario.</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SecurePasswordInput
              label="Contraseña actual"
              value={passwordForm.password_actual}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_actual: value }))}
              autoComplete="current-password"
            />
            <SecurePasswordInput
              label="Nueva contraseña"
              value={passwordForm.password_nueva}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_nueva: value }))}
              autoComplete="new-password"
            />
            <SecurePasswordInput
              label="Confirmación"
              value={passwordForm.password_confirmacion}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_confirmacion: value }))}
              autoComplete="new-password"
            />
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800">
                <Lock size={16} />
                Actualizar contraseña
              </button>
            </div>
          </form>
        </section>
      </div>

      {!isAdmin ? (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
          <p className="text-sm text-gray-600">
            La gestión de usuarios y roles está disponible solo para usuarios con rol Administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          <AdminUsersSection
            usuarios={usuarios}
            roles={roles}
            queryLoading={usuariosQuery.loading}
            queryError={usuariosQuery.error}
            search={userSearch}
            onSearch={setUserSearch}
            form={userForm}
            onFormChange={setUserForm}
            onSubmit={handleUserSubmit}
            onEdit={editUser}
            onToggle={handleToggleUser}
            onDelete={handleDeleteUser}
            onCancel={resetUserForm}
            usuariosActivos={usuariosActivos}
          />
          <AdminRolesSection
            roles={roles}
            queryLoading={rolesQuery.loading}
            queryError={rolesQuery.error}
            search={roleSearch}
            onSearch={setRoleSearch}
            form={roleForm}
            onFormChange={setRoleForm}
            onSubmit={handleRoleSubmit}
            onEdit={editRole}
            onDelete={handleDeleteRole}
            onCancel={resetRoleForm}
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-navy-900 wrap-break-word">{value || '—'}</p>
    </div>
  );
}

function SecurePasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5 block">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={8}
        required
        className="input-field"
      />
    </label>
  );
}

function AdminUsersSection({
  usuarios,
  roles,
  queryLoading,
  queryError,
  search,
  onSearch,
  form,
  onFormChange,
  onSubmit,
  onEdit,
  onToggle,
  onDelete,
  onCancel,
  usuariosActivos,
}: {
  usuarios: UsuarioSistema[];
  roles: RolSistema[];
  queryLoading: boolean;
  queryError: string | null;
  search: string;
  onSearch: (value: string) => void;
  form: UserFormState;
  onFormChange: (value: UserFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (item: UsuarioSistema) => void;
  onToggle: (item: UsuarioSistema) => void;
  onDelete: (item: UsuarioSistema) => void;
  onCancel: () => void;
  usuariosActivos: number;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <UserCog size={21} className="text-blue-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Usuarios</h2>
            <p className="text-xs text-gray-500">{usuariosActivos} activos de {usuarios.length} cargados</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <TextInput
            label="Nombre de usuario"
            value={form.nombre_usuario}
            onChange={(value) => onFormChange({ ...form, nombre_usuario: value })}
            autoComplete="username"
          />
          <TextInput
            label="Correo"
            type="email"
            value={form.correo}
            onChange={(value) => onFormChange({ ...form, correo: value })}
            autoComplete="email"
          />
          {!form.id && (
            <SecurePasswordInput
              label="Contraseña inicial"
              value={form.password}
              onChange={(value) => onFormChange({ ...form, password: value })}
              autoComplete="new-password"
            />
          )}
          <label className="block">
            <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5 block">Rol</span>
            <SearchableSelect
              value={form.id_rol}
              onChange={(value) => onFormChange({ ...form, id_rol: value })}
              options={[
                { value: '', label: 'Seleccionar rol' },
                ...roles.map((rol) => ({ value: String(rol.id_rol), label: rol.nombre_rol })),
              ]}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-800 md:col-span-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => onFormChange({ ...form, activo: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-500"
            />
            Usuario activo
          </label>
          <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
            {form.id && (
              <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white">
                <X size={15} />
                Cancelar
              </button>
            )}
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800">
              <Plus size={15} />
              {form.id ? 'Actualizar usuario' : 'Crear usuario'}
            </button>
          </div>
        </form>

        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por usuario o correo..."
          className="input-field"
        />

        {queryError && <p className="text-sm text-red-600">{queryError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Correo</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Rol</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {queryLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Cargando usuarios...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Sin usuarios registrados.</td></tr>
              ) : usuarios.map((item) => (
                <tr key={item.id_usuario} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-navy-900">{item.nombre_usuario}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.correo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.rol.nombre_rol}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full ${item.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <CheckCircle2 size={12} />
                      {item.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(item)} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => onToggle(item)} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        {item.activo ? 'Suspender' : 'Activar'}
                      </button>
                      <button type="button" onClick={() => onDelete(item)} className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AdminRolesSection({
  roles,
  queryLoading,
  queryError,
  search,
  onSearch,
  form,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancel,
}: {
  roles: RolSistema[];
  queryLoading: boolean;
  queryError: string | null;
  search: string;
  onSearch: (value: string) => void;
  form: RoleFormState;
  onFormChange: (value: RoleFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (item: RolSistema) => void;
  onDelete: (item: RolSistema) => void;
  onCancel: () => void;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield size={21} className="text-purple-700" />
        </div>
        <div>
          <h2 className="text-base font-bold text-navy-900">Roles</h2>
          <p className="text-xs text-gray-500">Perfiles de acceso y descripciones.</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <TextInput
            label="Nombre del rol"
            value={form.nombre_rol}
            onChange={(value) => onFormChange({ ...form, nombre_rol: value })}
          />
          <label className="block">
            <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5 block">Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
              className="input-field min-h-24"
              required
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            {form.id && (
              <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white">
                <X size={15} />
                Cancelar
              </button>
            )}
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800">
              <Plus size={15} />
              {form.id ? 'Actualizar rol' : 'Crear rol'}
            </button>
          </div>
        </form>

        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="input-field"
        />

        {queryError && <p className="text-sm text-red-600">{queryError}</p>}
        <div className="space-y-3">
          {queryLoading ? (
            <p className="text-sm text-gray-500 text-center py-8">Cargando roles...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Sin roles registrados.</p>
          ) : roles.map((item) => (
            <div key={item.id_rol} className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy-900">{item.nombre_rol}</p>
                <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                <p className="text-xs text-gray-400 mt-2">ID rol: {item.id_rol}</p>
              </div>
              <div className="flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => onEdit(item)} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" title="Editar">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => onDelete(item)} className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="input-field"
      />
    </label>
  );
}
