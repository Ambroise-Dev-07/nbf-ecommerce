import { useNavigate, Link, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../services/auth';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/auth';
import { Home, ShoppingCart, ClipboardList, LayoutDashboard, Package, Tag, Award, LayoutList, FileText, LogOut, Menu, X } from 'lucide-react';




function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const connecte = isAuthenticated();
  const [estAdmin, setEstAdmin] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    if (!connecte) {
      setEstAdmin(false);
      return;
    }
    let annule = false;
    getCurrentUser()
      .then((user) => {
        if (!annule) setEstAdmin(user?.role_user === 'admin');
      })
      .catch(() => {
        if (!annule) setEstAdmin(false);
      });
    return () => {
      annule = true;
    };
  }, [connecte]);

  useEffect(() => {
    setMenuOuvert(false);
  }, [location.pathname]);

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
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/produits', label: 'Produits', icon: Package },
    { path: '/admin/categories', label: 'Catégories', icon: Tag },
    { path: '/admin/marques', label: 'Marques', icon: Award },
    { path: '/admin/commandes', label: 'Gestion', icon: LayoutList },
    { path: '/admin/etats', label: 'États', icon: FileText },
  ];

  const tousLesItems = [...navItems, ...(estAdmin ? adminItems : [])];

  const NavItem = ({ path, label, icon: Icon }) => {
    const actif = location.pathname === path;
    return (
      <Link
        to={path}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          actif ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <Icon size={16} strokeWidth={actif ? 2.4 : 2} />
        {label}
      </Link>
    );
  };

  return (
    <div className="bg-[#1E1B2E] px-4 sm:px-6 py-3.5 no-print">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#1E1B2E] font-bold text-xs">
            NBF
          </div>
          <span className="text-amber-400 text-lg font-bold tracking-tight hidden xs:inline" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            NEW BRAIN FACTORY
          </span>
        </Link>

        <nav className="hidden md:flex bg-white/95 rounded-full shadow-lg shadow-black/10 px-1.5 py-1.5 items-center gap-1">
          {navItems.map((item) => <NavItem key={item.path} {...item} />)}
          {estAdmin && (
            <>
              <span className="w-px h-5 bg-gray-200 mx-1" />
              {adminItems.map((item) => <NavItem key={item.path} {...item} />)}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            {connecte ? (
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/15 transition">
                <LogOut size={14} /> Déconnexion
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-gray-200 hover:text-white text-sm font-medium transition">
                  Connexion
                </button>
                <button onClick={() => navigate('/register')} className="px-4 py-2 bg-amber-500 text-[#1E1B2E] rounded-full text-sm font-medium hover:bg-amber-400 transition">
                  Inscription
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMenuOuvert(!menuOuvert)} className="md:hidden p-2 text-white">
            {menuOuvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <div className="md:hidden mt-3 bg-white rounded-xl shadow-lg p-2 flex flex-col gap-1">
          {tousLesItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                location.pathname === item.path ? 'bg-amber-50 text-amber-700' : 'text-gray-600'
              }`}
            >
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-2">
            {connecte ? (
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600">
                <LogOut size={16} /> Déconnexion
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <button onClick={() => navigate('/login')} className="text-left px-3 py-2.5 text-sm font-medium text-gray-600">
                  Connexion
                </button>
                <button onClick={() => navigate('/register')} className="text-left px-3 py-2.5 text-sm font-medium text-amber-600">
                  Inscription
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;