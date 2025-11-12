// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/admin/login" replace />;

  return children;
}
