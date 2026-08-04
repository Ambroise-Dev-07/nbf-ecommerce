import { useNavigate, Link, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../services/auth';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/auth';
import { Home, ShoppingCart, ClipboardList, Package, Tag, Award, LayoutList, LogOut } from 'lucide-react';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const connecte = isAuthenticated();
  const [estAdmin, setEstAdmin] = useState(false);

  useEffect(() => {
    if (connecte) {
      getCurrentUser().then((user) => setEstAdmin(user.role_user === 'admin'));
    }
  }, [connecte]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    ...(connecte ? [
      { path: '/panier', label: 'Panier', icon: ShoppingCart },
      { path: '/mes-commandes', label: 'Commandes', icon: ClipboardList },
    ] : []),
  ];

  const adminItems = [
    { path: '/admin/produits', label: 'Produits', icon: Package },
    { path: '/admin/categories', label: 'Catégories', icon: Tag },
    { path: '/admin/marques', label: 'Marques', icon: Award },
    { path: '/admin/commandes', label: 'Gestion', icon: LayoutList },
  ];

  const NavItem = ({ path, label, icon: Icon }) => {
    const actif = location.pathname === path;
    return (
      <Link
        to={path}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          actif ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <Icon size={16} strokeWidth={actif ? 2.4 : 2} />
        {label}
      </Link>
    );
  };

  return (
    <div className="bg-[#1E1B2E] px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#1E1B2E] font-bold text-xs">
            NBF
          </div>
          <span className="text-amber-400 text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            NEW BRAIN FACTORY
          </span>
        </Link>

        <nav className="bg-white/95 rounded-full shadow-lg shadow-black/10 px-1.5 py-1.5 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => <NavItem key={item.path} {...item} />)}
          {estAdmin && (
            <>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              {adminItems.map((item) => <NavItem key={item.path} {...item} />)}
            </>
          )}
        </nav>

        <div className="shrink-0">
          {connecte ? (
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/15 transition">
              <LogOut size={14} /> Déconnexion
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-gray-200 hover:text-white text-sm font-medium transition">
                Connexion
              </button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-500 transition">
                Inscription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;