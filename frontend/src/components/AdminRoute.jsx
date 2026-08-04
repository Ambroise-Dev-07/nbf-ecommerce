import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';

function AdminRoute({ children }) {
  const [statut, setStatut] = useState('chargement');

  useEffect(() => {
    getCurrentUser()
      .then((user) => setStatut(user.role_user === 'admin' ? 'autorise' : 'refuse'))
      .catch(() => setStatut('refuse'));
  }, []);

  if (statut === 'chargement') {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (statut === 'refuse') return <Navigate to="/" replace />;
  return children;
}

export default AdminRoute;