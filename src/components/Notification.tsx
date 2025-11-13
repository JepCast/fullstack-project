import React from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  if (!message) return null;

  let bgColor, borderColor;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 border-green-400 text-green-700';
      borderColor = 'border-green-400';
      break;
    case 'error':
      bgColor = 'bg-red-100 border-red-400 text-red-700';
      borderColor = 'border-red-400';
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-100 border-blue-400 text-blue-700';
      borderColor = 'border-blue-400';
      break;
  }

  return (
    <div className={`p-3 rounded-lg border-l-4 ${bgColor} ${borderColor} shadow-md my-4 transition-all duration-300`}>
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
};

export default Notification;