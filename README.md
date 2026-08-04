# NEW BRAIN FACTORY — Plateforme E-commerce

Plateforme e-commerce de vente de matériel informatique, développée dans le cadre du projet de fin d'études (PFE) à l'IAI-TOGO, en partenariat avec New Brain Factory.

## Fonctionnalités

- Catalogue produits avec recherche et filtres (catégorie, marque)
- Authentification JWT (inscription, connexion)
- Panier et gestion des commandes
- Paiement mobile money (Flooz, Mixx by Yas) via PayGateGlobal
- Interface d'administration (produits, catégories, marques, commandes)
- Suivi des commandes côté client

## Stack technique

**Backend**
- Django 6 + Django REST Framework
- PostgreSQL
- JWT (djangorestframework-simplejwt)

**Frontend**
- React (Vite)
- Tailwind CSS
- Axios, React Router

## Installation

### Prérequis
- Python 3.13+
- Node.js 22+
- PostgreSQL 18+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Crée un fichier `.env` dans `backend/` avec :
```
SECRET_KEY=ta_cle_secrete
DB_NAME=nom_de_ta_base
DB_USER=ton_user_postgres
DB_PASSWORD=ton_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
PAYGATE_ID=ton_identifiant_paygate
PAYGATE_SECRET=ta_cle_paygate
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Auteur

Ambroise — Étudiant en Génie Logiciel et Systèmes d'Information/ ambroisengrou332@gmail.com, IAI-TOGO