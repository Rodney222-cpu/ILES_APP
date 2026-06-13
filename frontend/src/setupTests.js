import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', null, children),
    Routes: ({ children }) => React.createElement('div', null, children),
    Route: ({ element }) => element,
    Navigate: ({ to }) => React.createElement('div', null, `Navigate to ${to}`),
    Link: ({ to, children }) => React.createElement('a', { href: to }, children),
    NavLink: ({ to, children }) => React.createElement('a', { href: to }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});
