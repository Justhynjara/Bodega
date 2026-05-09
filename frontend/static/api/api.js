// api.js — El Gran Poeta
const API_URL = 'http://localhost:3000/api';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function guardarSesion(data) {
  localStorage.setItem('token',   data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
}

function obtenerToken() {
  return localStorage.getItem('token');
}

function obtenerUsuario() {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '../html/login.html';
}

function requiereAuth() {
  if (!obtenerToken()) {
    window.location.href = '../html/login.html';
  }
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch(endpoint, options = {}) {
  const token = obtenerToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);

  if (res.status === 401) {
    cerrarSesion();
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error en la solicitud');
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  guardarSesion(data);
  return data;
}

// ─── Productos ────────────────────────────────────────────────────────────────

const Productos = {
  listar:     ()          => apiFetch('/productos'),
  obtener:    (id)        => apiFetch(`/productos/${id}`),
  crear:      (data)      => apiFetch('/productos', { method: 'POST', body: data }),
  actualizar: (id, data)  => apiFetch(`/productos/${id}`, { method: 'PUT', body: data }),
  eliminar:   (id)        => apiFetch(`/productos/${id}`, { method: 'DELETE' })
};

// ─── Bodegas ──────────────────────────────────────────────────────────────────

const Bodegas = {
  listar:     ()          => apiFetch('/bodegas'),
  obtener:    (id)        => apiFetch(`/bodegas/${id}`),
  crear:      (data)      => apiFetch('/bodegas', { method: 'POST', body: data }),
  actualizar: (id, data)  => apiFetch(`/bodegas/${id}`, { method: 'PUT', body: data }),
  eliminar:   (id)        => apiFetch(`/bodegas/${id}`, { method: 'DELETE' })
};

// ─── Inventario ───────────────────────────────────────────────────────────────

const Inventario = {
  listar:    ()    => apiFetch('/inventario'),
  porBodega: (id)  => apiFetch(`/inventario/bodega/${id}`)
};

// ─── Movimientos ──────────────────────────────────────────────────────────────

const Movimientos = {
  listar:    ()      => apiFetch('/movimientos'),
  obtener:   (id)    => apiFetch(`/movimientos/${id}`),
  registrar: (data)  => apiFetch('/movimientos', { method: 'POST', body: data })
};

// ─── Topbar dinámico ──────────────────────────────────────────────────────────

function initTopbar() {
  const usuario = obtenerUsuario();
  if (!usuario) {
    cerrarSesion();
    return;
  }

  const spanNombre = document.getElementById('topbar-nombre');
  if (spanNombre) spanNombre.textContent = usuario.nombre;

  const spanRol = document.getElementById('topbar-rol');
  if (spanRol) {
    spanRol.textContent = usuario.perfil === 'jefe_bodega' ? 'Jefe de Bodega' : 'Bodeguero';
    spanRol.className   = 'role ' + (usuario.perfil === 'jefe_bodega' ? 'role-jefe' : 'role-bod');
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.onclick = (e) => {
      e.preventDefault();
      cerrarSesion();
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('topbar-nombre')) {
    requiereAuth();
    initTopbar();
  }
});