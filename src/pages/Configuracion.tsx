import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import AlmacenResponsableConfigSection from '../components/config/AlmacenResponsableConfigSection';
import {
  hasAlmacenResponsableConfigAccess,
  hasMasterTablesAccess,
  hasUserManagementAccess,
} from '../constants/adminAccess';
import type { RolPayload, RolSistema, UpdateUsuarioPayload, UsuarioPayload, UsuarioSistema } from '../types/auth';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
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
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const canManageUsers = hasUserManagementAccess(usuario?.rol.nombre_rol);
  const canManageMasterTables = hasMasterTablesAccess(usuario?.rol.nombre_rol);
  const canConfigAlmacenResponsable = hasAlmacenResponsableConfigAccess(usuario?.rol.nombre_rol);
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
    canManageMasterTables,
  );
  const usuariosQuery = useApiQuery(
    () => fetchUsuarios({ page: 1, limit: PAGE_LIMIT, search: userSearch || undefined }),
    [userSearch],
    canManageUsers,
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

  const handlePasswordChange = async (e: FormEvent) => {
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

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const idRol = Number(userForm.id_rol);
    const isCreating = !userForm.id;
    if (!Number.isInteger(idRol) || idRol <= 0) {
      const message = 'Selecciona un rol válido';
      toast.error(isCreating ? 'No se pudo crear el usuario' : 'No se pudo actualizar el usuario', {
        description: message,
      });
      setError(message);
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
        toast.success('Usuario actualizado exitosamente');
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
        toast.success('Usuario creado exitosamente');
        setSuccess('Usuario creado exitosamente');
      }
      resetUserForm();
      usuariosQuery.refetch();
    } catch (err) {
      const message = toErrorMessage(err);
      toast.error(isCreating ? 'No se pudo crear el usuario' : 'No se pudo actualizar el usuario', {
        description: message,
      });
      setError(message);
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

  const handleRoleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: RolPayload = {
      nombre_rol: roleForm.nombre_rol.trim(),
      descripcion: roleForm.descripcion.trim(),
    };

    const isCreating = !roleForm.id;

    try {
      if (roleForm.id) {
        await updateRol(roleForm.id, payload);
        toast.success('Rol actualizado exitosamente');
        setSuccess('Rol actualizado exitosamente');
      } else {
        await createRol(payload);
        toast.success('Rol creado exitosamente');
        setSuccess('Rol creado exitosamente');
      }
      resetRoleForm();
      rolesQuery.refetch();
    } catch (err) {
      const message = toErrorMessage(err);
      toast.error(isCreating ? 'No se pudo crear el rol' : 'No se pudo actualizar el rol', {
        description: message,
      });
      setError(message);
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
    <div className="p-4 md:p-6 space-y-8 max-w-[1600px]">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 font-display tracking-tight">Configuración</h1>
          <p className="text-sm text-gray-600 mt-1.5 max-w-2xl">
            Administra tu cuenta, contraseña y —si tienes permisos— usuarios, roles y responsables de almacén.
          </p>
        </div>
        {(canManageUsers || canManageMasterTables) && (
          <div className="flex flex-wrap gap-2">
            {canManageUsers && <StatPill label="Usuarios" value={String(usuarios.length)} />}
            {canManageUsers && <StatPill label="Activos" value={String(usuariosActivos)} />}
            {canManageMasterTables && <StatPill label="Roles" value={String(roles.length)} />}
          </div>
        )}
      </header>

      {(successMsg || errorMsg) && (
        <div
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            successMsg
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {successMsg || errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader
            icon={<User size={20} className="text-navy-700" />}
            iconBg="bg-navy-100"
            title="Mi perfil"
            subtitle="Sesión actual en el sistema"
          />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-50 border border-navy-100 px-4 py-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-navy-900 truncate">{usuario?.nombre_usuario ?? '—'}</p>
                <p className="text-sm text-navy-600 truncate">{usuario?.rol.nombre_rol ?? '—'}</p>
              </div>
              <StatusBadge active={usuario?.activo ?? false} />
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow label="Correo electrónico" value={usuario?.correo ?? '—'} icon={<Mail size={14} />} />
              <InfoRow label="ID de usuario" value={usuario?.id_usuario.toString() ?? '—'} mono />
              <InfoRow label="Perfil de acceso" value={usuario?.rol.nombre_rol ?? '—'} />
              <InfoRow label="Descripción del perfil" value={roleDescription(usuario?.rol)} multiline />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden xl:col-span-2">
          <SectionHeader
            icon={<KeyRound size={20} className="text-amber-700" />}
            iconBg="bg-amber-100"
            title="Cambio de contraseña"
            subtitle="Al guardar se cerrarán todas las sesiones abiertas"
          />
          <form onSubmit={handlePasswordChange} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <SecurePasswordInput
              label="Contraseña actual"
              hint="La que usas para iniciar sesión"
              placeholder="••••••••"
              value={passwordForm.password_actual}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_actual: value }))}
              autoComplete="current-password"
            />
            <SecurePasswordInput
              label="Nueva contraseña"
              hint="Mínimo 8 caracteres"
              placeholder="••••••••"
              value={passwordForm.password_nueva}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_nueva: value }))}
              autoComplete="new-password"
            />
            <SecurePasswordInput
              label="Confirmar contraseña"
              hint="Debe coincidir con la nueva"
              placeholder="••••••••"
              value={passwordForm.password_confirmacion}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, password_confirmacion: value }))}
              autoComplete="new-password"
            />
            <div className="md:col-span-3 flex justify-end pt-1 border-t border-gray-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors"
              >
                <Lock size={16} />
                Actualizar contraseña
              </button>
            </div>
          </form>
        </section>
      </div>

      {canConfigAlmacenResponsable && (
        <AlmacenResponsableConfigSection onSuccess={setSuccess} onError={setError} />
      )}

      {(canManageUsers || canManageMasterTables) && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Administración del sistema</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de cuentas y tablas maestras reservada al perfil Super Administrador (TI).
            </p>
          </div>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {canManageUsers && (
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
            )}
            {canManageMasterTables && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-navy-900">{value}</span>
    </span>
  );
}

function SectionHeader({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/60">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-navy-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      <CheckCircle2 size={12} />
      {active ? 'Activo' : 'Suspendido'}
    </span>
  );
}

function InfoRow({
  label,
  value,
  icon,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-navy-900 wrap-break-word ${
          mono ? 'font-mono' : ''
        } ${multiline ? 'leading-relaxed' : ''}`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

function ConfigField({
  label,
  hint,
  required,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-navy-900">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </p>
      {hint && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{hint}</p>}
      <div className={hint ? 'mt-2' : 'mt-1.5'}>{children}</div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 bg-white"
      />
    </div>
  );
}

function FormPanel({
  editing,
  title,
  subtitle,
  children,
}: {
  editing: boolean;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-4 transition-colors ${
        editing
          ? 'border-blue-200 bg-blue-50/40'
          : 'border-gray-200 bg-gradient-to-b from-gray-50/80 to-white'
      }`}
    >
      <div>
        <p className="text-sm font-bold text-navy-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SecurePasswordInput({
  label,
  hint,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <ConfigField label={label} hint={hint} required>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={8}
        required
        className="input-field"
      />
    </ConfigField>
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
  onSubmit: (e: FormEvent) => void;
  onEdit: (item: UsuarioSistema) => void;
  onToggle: (item: UsuarioSistema) => void;
  onDelete: (item: UsuarioSistema) => void;
  onCancel: () => void;
  usuariosActivos: number;
}) {
  const editingName = form.id ? usuarios.find((u) => u.id_usuario === form.id)?.nombre_usuario : null;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <SectionHeader
        icon={<UserCog size={20} className="text-blue-700" />}
        iconBg="bg-blue-100"
        title="Usuarios"
        subtitle={`${usuariosActivos} activos · ${usuarios.length} registrados`}
      />

      <div className="p-5 space-y-5">
        <form onSubmit={onSubmit}>
          <FormPanel
            editing={Boolean(form.id)}
            title={form.id ? `Editar usuario: ${editingName ?? ''}` : 'Nuevo usuario'}
            subtitle={
              form.id
                ? 'Actualice perfil, correo o estado de acceso'
                : 'Complete los datos para dar de alta una cuenta en el sistema'
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Nombre de usuario"
                hint="Identificador con el que inicia sesión"
                placeholder="Ej. jperez"
                value={form.nombre_usuario}
                onChange={(value) => onFormChange({ ...form, nombre_usuario: value })}
                autoComplete="username"
              />
              <TextInput
                label="Correo electrónico"
                hint="Correo institucional del usuario"
                placeholder="usuario@ferrocasa.gob.ve"
                type="email"
                value={form.correo}
                onChange={(value) => onFormChange({ ...form, correo: value })}
                autoComplete="email"
              />
              {!form.id && (
                <SecurePasswordInput
                  label="Contraseña inicial"
                  hint="Mínimo 8 caracteres; el usuario podrá cambiarla después"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(value) => onFormChange({ ...form, password: value })}
                  autoComplete="new-password"
                />
              )}
              <ConfigField
                label="Perfil de acceso"
                hint="Define qué módulos y acciones puede usar"
                required
                className={form.id ? 'sm:col-span-2' : ''}
              >
                <SearchableSelect
                  value={form.id_rol}
                  onChange={(value) => onFormChange({ ...form, id_rol: value })}
                  options={[
                    { value: '', label: 'Seleccionar perfil…' },
                    ...roles.map((rol) => ({ value: String(rol.id_rol), label: rol.nombre_rol })),
                  ]}
                />
              </ConfigField>
              <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-navy-200 transition-colors">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => onFormChange({ ...form, activo: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-500"
                />
                <span>
                  <span className="text-sm font-medium text-navy-900 block">Usuario activo</span>
                  <span className="text-xs text-gray-500">Si está desmarcado, no podrá iniciar sesión</span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-200/80">
              {form.id && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
                >
                  <X size={15} />
                  Cancelar edición
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
              >
                <Plus size={15} />
                {form.id ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </FormPanel>
        </form>

        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Buscar por nombre de usuario o correo…"
        />

        {queryError && <p className="text-sm text-red-600">{queryError}</p>}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Usuario</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 hidden sm:table-cell">Correo</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Perfil</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5">Estado</th>
                <th className="text-right text-xs font-semibold text-gray-600 px-3 py-2.5 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {queryLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Cargando usuarios…</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">Sin usuarios registrados.</td>
                </tr>
              ) : (
                usuarios.map((item) => (
                  <tr key={item.id_usuario} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-navy-900">{item.nombre_usuario}</p>
                      <p className="text-xs text-gray-500 sm:hidden truncate max-w-[140px]">{item.correo}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-700 hidden sm:table-cell max-w-[180px] truncate">{item.correo}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex text-xs font-medium bg-navy-50 text-navy-800 border border-navy-100 px-2 py-0.5 rounded-md">
                        {item.rol.nombre_rol}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge active={item.activo} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton onClick={() => onEdit(item)} title="Editar usuario" icon={<Pencil size={15} />} />
                        <button
                          type="button"
                          onClick={() => onToggle(item)}
                          title={item.activo ? 'Suspender usuario' : 'Activar usuario'}
                          className="hidden lg:inline-flex px-2 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {item.activo ? 'Suspender' : 'Activar'}
                        </button>
                        <IconButton
                          onClick={() => onDelete(item)}
                          title="Eliminar"
                          icon={<Trash2 size={15} />}
                          danger
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function IconButton({
  onClick,
  title,
  icon,
  danger,
}: {
  onClick: () => void;
  title: string;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg border transition-colors ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
    </button>
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
  onSubmit: (e: FormEvent) => void;
  onEdit: (item: RolSistema) => void;
  onDelete: (item: RolSistema) => void;
  onCancel: () => void;
}) {
  const editingRoleName = form.id ? roles.find((r) => r.id_rol === form.id)?.nombre_rol : null;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <SectionHeader
        icon={<Shield size={20} className="text-purple-700" />}
        iconBg="bg-purple-100"
        title="Roles y perfiles"
        subtitle="Permisos de acceso a módulos del inventario"
      />

      <div className="p-5 space-y-5">
        <form onSubmit={onSubmit}>
          <FormPanel
            editing={Boolean(form.id)}
            title={form.id ? `Editar rol: ${editingRoleName ?? ''}` : 'Nuevo rol'}
            subtitle={
              form.id
                ? 'Modifique el nombre o la descripción del perfil'
                : 'Defina un perfil con nombre claro y descripción de sus permisos'
            }
          >
            <div className="space-y-4">
              <TextInput
                label="Nombre del rol"
                hint="Nombre corto que verán los usuarios al asignar perfiles"
                placeholder="Ej. Analista patrimonial"
                value={form.nombre_rol}
                onChange={(value) => onFormChange({ ...form, nombre_rol: value })}
              />
              <ConfigField
                label="Descripción del perfil"
                hint="Indique qué módulos, reportes o acciones administrativas incluye"
                required
              >
                <textarea
                  value={form.descripcion}
                  onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
                  placeholder="Ej. Registro de bienes, vehículos y exportación de reportes SUDEBIP…"
                  className="input-field min-h-28 resize-y"
                  required
                />
              </ConfigField>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-200/80">
              {form.id && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
                >
                  <X size={15} />
                  Cancelar edición
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
              >
                <Plus size={15} />
                {form.id ? 'Guardar cambios' : 'Crear rol'}
              </button>
            </div>
          </FormPanel>
        </form>

        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Buscar por nombre o descripción…"
        />

        {queryError && <p className="text-sm text-red-600">{queryError}</p>}

        <div className="space-y-3">
          {queryLoading ? (
            <p className="text-sm text-gray-500 text-center py-10">Cargando roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">Sin roles registrados.</p>
          ) : (
            roles.map((item) => (
              <article
                key={item.id_rol}
                className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-purple-200 hover:bg-purple-50/20 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-navy-900">{item.nombre_rol}</h3>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      ID {item.id_rol}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.descripcion}</p>
                </div>
                <div className="flex justify-end gap-1 shrink-0">
                  <IconButton onClick={() => onEdit(item)} title="Editar rol" icon={<Pencil size={15} />} />
                  <IconButton
                    onClick={() => onDelete(item)}
                    title="Eliminar rol"
                    icon={<Trash2 size={15} />}
                    danger
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function TextInput({
  label,
  hint,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <ConfigField label={label} hint={hint} required>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="input-field"
      />
    </ConfigField>
  );
}
