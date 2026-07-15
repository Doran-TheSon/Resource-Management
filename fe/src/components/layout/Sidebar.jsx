import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const handleNav = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
    >
      {/* Logo */}
      <div style={styles.logo} onClick={() => navigate('/')}>
        <div style={styles.logoIcon}>R</div>
        {!collapsed && <span style={styles.logoText}>Resource MGMT</span>}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            const isOpen = expandedMenus[item.label];
            const hasActiveChild = item.children.some(c => isActive(c.path));
            return (
              <div key={item.label}>
                <button
                  style={{
                    ...styles.navItem,
                    backgroundColor: hasActiveChild ? 'var(--color-primary-light)' : 'transparent',
                    color: hasActiveChild ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                  onClick={() => !collapsed && toggleMenu(item.label)}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={styles.navLabel}>{item.label}</span>
                      <span style={{
                        ...styles.chevron,
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>
                        ›
                      </span>
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div style={styles.submenu}>
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => handleNav(child.path)}
                        style={{
                          ...styles.subItem,
                          backgroundColor: isActive(child.path)
                            ? 'var(--color-primary-light)'
                            : 'transparent',
                          color: isActive(child.path)
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                ...styles.navItem,
                backgroundColor: isActive(item.path)
                  ? 'var(--color-primary-light)'
                  : 'transparent',
                color: isActive(item.path)
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'width var(--transition-normal)',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 'var(--z-sidebar)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
    height: 'var(--header-height)',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-bold)',
    fontSize: 'var(--text-lg)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    width: '100%',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    position: 'relative',
  },
  navIcon: {
    fontSize: 'var(--text-lg)',
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  navLabel: {
    flex: 1,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: {
    fontSize: 'var(--text-lg)',
    transition: 'transform var(--transition-fast)',
    flexShrink: 0,
  },
  submenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    paddingLeft: 'var(--space-8)',
    marginTop: 2,
    animation: 'fadeIn 0.2s ease-out',
  },
  subItem: {
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
    display: 'block',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
  },
};
