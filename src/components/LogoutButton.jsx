import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

function LogoutButton() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/admin/login'; // redirect to login
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
