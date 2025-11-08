import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage'

interface User {
  id: string
  name: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    return getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null)
  })

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      setStorageItem(STORAGE_KEYS.CURRENT_USER, newUser)
    } else {
      setStorageItem(STORAGE_KEYS.CURRENT_USER, null)
    }
  }

  useEffect(() => {
    if (user) {
      setStorageItem(STORAGE_KEYS.CURRENT_USER, user)
    }
  }, [user])

  return (
    <UserContext.Provider value={{ user, setUser, isAuthenticated: !!user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

