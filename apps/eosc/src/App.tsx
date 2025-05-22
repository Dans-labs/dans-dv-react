import { Selector } from '@dans-dv/selector'

function App() {
  return (
    <Selector config={{
      swh: true,
      fileUpload: true,
    }} />
  )
}

export default App
