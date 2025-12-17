import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '../types/api';

interface UserState {
  // 用户信息
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 子用户管理（家长模式）
  children: User[];
  activeChildId: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setChildren: (children: User[]) => void;
  setActiveChild: (childId: string | null) => void;
  addChild: (child: User) => void;
  removeChild: (childId: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;

  // Getters
  currentUser: () => User | null;
  isParent: () => boolean;
  activeChild: () => User | null;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        children: [],
        activeChildId: null,

        // Actions
        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user
          });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setChildren: (children) => {
          set({ children });
        },

        setActiveChild: (childId) => {
          set({ activeChildId: childId });
        },

        addChild: (child) => {
          set((state) => ({
            children: [...state.children, child]
          }));
        },

        removeChild: (childId) => {
          set((state) => {
            const newChildren = state.children.filter(child => child.id !== childId);
            const activeChildId = state.activeChildId === childId ? null : state.activeChildId;
            return {
              children: newChildren,
              activeChildId
            };
          });
        },

        updateUser: (updates) => {
          set((state) => {
            if (!state.user) return state;

            const updatedUser = { ...state.user, ...updates };

            // 如果更新的是子用户，也要在 children 数组中更新
            const updatedChildren = state.children.map(child =>
              child.id === updatedUser.id ? updatedUser : child
            );

            return {
              user: updatedUser,
              children: updatedChildren
            };
          });
        },

        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            children: [],
            activeChildId: null
          });
        },

        // Getters
        currentUser: () => {
          const { user, activeChildId, children } = get();

          // 如果是家长模式且有活跃的子用户，返回子用户信息
          if (user?.role === 'PARENT' && activeChildId) {
            return children.find(child => child.id === activeChildId) || user;
          }

          return user;
        },

        isParent: () => {
          const { user } = get();
          return user?.role === 'PARENT';
        },

        activeChild: () => {
          const { activeChildId, children } = get();
          return children.find(child => child.id === activeChildId) || null;
        }
      }),
      {
        name: 'starship-user-store',
        // 只持久化必要的数据，不包括 loading 状态
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          children: state.children,
          activeChildId: state.activeChildId,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
);

// 便捷 hooks
export const useCurrentUser = () => useUserStore((state) => state.currentUser());
export const useIsParent = () => useUserStore((state) => state.isParent());
export const useActiveChild = () => useUserStore((state) => state.activeChild());
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useUserLoading = () => useUserStore((state) => state.isLoading);