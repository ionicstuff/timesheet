import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      minWidth: '300px',
      maxWidth: '500px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
    };

    const typeStyles = {
      success: { backgroundColor: '#28a745' },
      error: { backgroundColor: '#dc3545' },
      warning: { backgroundColor: '#ffc107', color: '#212529' },
      info: { backgroundColor: '#17a2b8' },
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  const getIcon = () => {
    const iconMap = {
      success: <CheckCircle className="me-2 h-4 w-4" />,
      error: <AlertCircle className="me-2 h-4 w-4" />,
      warning: <AlertTriangle className="me-2 h-4 w-4" />,
      info: <Info className="me-2 h-4 w-4" />,
    } as const;

    return iconMap[type];
  };

  return (
    <div style={getToastStyle()}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {getIcon()}
          <span>{message}</span>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white ms-3"
          onClick={onClose}
          style={{ fontSize: '12px' }}
        ></button>
      </div>
    </div>
  );
};

export default Toast;
