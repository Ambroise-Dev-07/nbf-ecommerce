import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Catalogue from './pages/Catalogue';
import Login from './pages/Login';
import Register from './pages/Register';
import Panier from './pages/Panier';
import Paiement from './pages/Paiement';
import MesCommandes from './pages/MesCommandes';
import AdminRoute from './components/AdminRoute';
import AdminProduits from './pages/AdminProduits';
import AdminCategories from './pages/AdminCategories';
import AdminMarques from './pages/AdminMarques';
import AdminCommandes from './pages/AdminCommandes';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-[#F6F7F9]">
          <Routes>
            <Route path="/" element={<Catalogue />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/panier" element={<Panier />} />
            <Route path="/paiement/:commandeId" element={<Paiement />} />
            <Route path="/mes-commandes" element={<MesCommandes />} />
            <Route path="/admin/produits" element={<AdminRoute><AdminProduits /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/marques" element={<AdminRoute><AdminMarques /></AdminRoute>} />
            <Route path="/admin/commandes" element={<AdminRoute><AdminCommandes /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;