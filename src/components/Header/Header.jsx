import { NavLink, Outlet } from 'react-router-dom';
import css from './Header.module.css';

export const Header = () => {
  return (
    <>
      <header>
        <nav className={css.navigation} aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/movies">Search</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Header;
