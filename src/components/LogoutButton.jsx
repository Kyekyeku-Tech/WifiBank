import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login'); // SPA navigation without reload
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}

export default LogoutButton;
