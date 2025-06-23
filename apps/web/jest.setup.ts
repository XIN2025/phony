import '@testing-library/jest-dom';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock('jose', () => ({
  compactDecrypt: jest.fn(),
  compactEncrypt: jest.fn(),
  jwtDecrypt: jest.fn(),
  jwtEncrypt: jest.fn(),
}));

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
  Client: jest.fn(),
}));

const mockAxios: any = {
  create: jest.fn(() => mockAxios),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  isAxiosError: (err: any): boolean => err.isAxiosError === true,
};

jest.mock('axios', () => mockAxios);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return props;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => {
    return props;
  },
}));

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: componentWillReceiveProps has been renamed')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
