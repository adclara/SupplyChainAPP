/**
 * Vitest Setup
 * @description Global test configuration and mocks
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
    vi.restoreAllMocks();
});

// =============================================================================
// SUPABASE MOCK
// =============================================================================

const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
});

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => createMockQueryBuilder()),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    createServerClient: vi.fn(() => ({
        from: vi.fn(() => createMockQueryBuilder()),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
    })),
    getCurrentSession: vi.fn().mockResolvedValue(null),
    getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// =============================================================================
// ZUSTAND STORE MOCKS
// =============================================================================

vi.mock('@/store/userStore', () => ({
    useUserStore: vi.fn(() => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        setUser: vi.fn(),
        clearUser: vi.fn(),
        fetchUser: vi.fn(),
    })),
}));

vi.mock('@/store/warehouseStore', () => ({
    useWarehouseStore: vi.fn(() => ({
        warehouse: null,
        setWarehouse: vi.fn(),
    })),
}));

// =============================================================================
// NEXT.JS MOCKS
// =============================================================================

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

vi.mock('next/link', () => ({
    default: ({ children }: { children: unknown; href: string }) => children,
}));

// =============================================================================
// BROWSER API MOCKS
// =============================================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// =============================================================================
// CONSOLE MOCKS (to suppress expected errors in tests)
// =============================================================================

// Optionally suppress console.error during tests
// Uncomment if needed:
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
