import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { CanvasProvider } from './contexts/CanvasContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      setIsReady(true)
    }
  }, [loading])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return user ? <ChatPage /> : <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <CanvasProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </CanvasProvider>
    </AuthProvider>
  )
}

export default App
