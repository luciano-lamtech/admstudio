import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admstudio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tenant, setTenant] = useState(() => {
    const saved = localStorage.getItem('admstudio_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('admstudio_menu');
    return saved ? JSON.parse(saved) : [];
  });

  // Ao abrir o sistema (ou recarregar a página), busca o menu atual do servidor.
  // Assim, itens novos aparecem sem precisar sair e entrar de novo.
  useEffect(() => {
    if (!localStorage.getItem('admstudio_access')) return;
    axiosClient.get('/usuarios/menu/')
      .then((r) => {
        setMenu(r.data);
        localStorage.setItem('admstudio_menu', JSON.stringify(r.data));
      })
      .catch(() => {});
  }, []);

  async function login(email, senha, id) {
    const response = await axiosClient.post('/auth/login/', { email, senha, id });
    const { access, refresh, usuario, tenant: tenantData, menu: menuData } = response.data;

    localStorage.setItem('admstudio_access', access);
    localStorage.setItem('admstudio_refresh', refresh);
    localStorage.setItem('admstudio_user', JSON.stringify(usuario));
    localStorage.setItem('admstudio_tenant', JSON.stringify(tenantData));
    localStorage.setItem('admstudio_menu', JSON.stringify(menuData));

    setUser(usuario);
    setTenant(tenantData);
    setMenu(menuData);

    return usuario;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setTenant(null);
    setMenu([]);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, menu, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
