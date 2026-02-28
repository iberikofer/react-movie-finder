import { NavLink, Outlet } from 'react-router-dom';
import css from './Header.module.css';

export const Header = () => {
  return (
    <div>
      <header>
        <nav className={css.navigation}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/movies">Search</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
};

export default Header;
