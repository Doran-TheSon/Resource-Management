import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../common/Toast';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMenuToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div style={styles.container}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleMenuToggle} />

      <main
        style={{
          ...styles.main,
          marginLeft: sidebarCollapsed
            ? 'var(--sidebar-collapsed-width)'
            : 'var(--sidebar-width)',
        }}
      >
        <Header onMenuToggle={handleMenuToggle} />

        <div style={styles.content}>
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left var(--transition-normal)',
    minHeight: '100vh',
  },
  content: {
    flex: 1,
    padding: 'var(--space-6)',
    maxWidth: 1280,
    width: '100%',
    margin: '0 auto',
  },
};
