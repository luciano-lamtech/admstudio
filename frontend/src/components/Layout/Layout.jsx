import AvisoAssinatura from '../AvisoAssinatura/AvisoAssinatura';
import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

export default function Layout({ children }) {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
        <Header />
        <AvisoAssinatura />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
