import React, { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  closeButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeButton = true,
  className = ''
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Size mapping
  const sizeMap = {
    sm: 'min(400px, 95%)',
    md: 'min(500px, 95%)',
    lg: 'min(680px, 95%)',
    xl: 'min(900px, 95%)'
  };

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    },
    dialog: {
      background: 'var(--card-bg)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      width: sizeMap[size],
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
      outline: 'none',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    },
    title: {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: 600,
      color: 'var(--text-primary)'
    },
    closeButton: {
      background: 'transparent',
      border: '1px solid var(--border-color)',
      borderRadius: '50%',
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      fontSize: '16px',
      padding: 0,
      lineHeight: 1
    },
    body: {
      padding: '20px',
      overflow: 'auto',
      flex: 1
    },
    footer: {
      padding: '16px 20px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end',
      flexShrink: 0
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return createPortal(
    <div 
      style={styles.overlay} 
      onClick={handleOverlayClick}
      role="dialog" 
      aria-modal="true"
      className={className}
    >
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {(title || closeButton) && (
          <div style={styles.header}>
            {title && <h5 style={styles.title}>{title}</h5>}
            {closeButton && (
              <button
                style={styles.closeButton}
                onClick={handleCloseClick}
                aria-label="Close modal"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div style={styles.body}>
          {children}
        </div>
        
        {footer && (
          <div style={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
