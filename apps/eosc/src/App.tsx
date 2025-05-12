import { useState } from 'react'
import { Selector } from '@dans-dv/selector-button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Selector config={{
      swh: true
    }} />
  )
}

export default App
