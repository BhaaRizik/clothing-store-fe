import { useState, useEffect } from 'react'

function App() {
  const [greeting, setGreeting] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/greeting`)
      .then((res) => res.json())
      .then((data) => setGreeting(data.message))
      .catch(() => setError('Could not reach backend'))
  }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      {greeting && <h1>{greeting}</h1>}
      {error && <h1 style={{ color: 'red' }}>{error}</h1>}
    </div>
  )
}

export default App
