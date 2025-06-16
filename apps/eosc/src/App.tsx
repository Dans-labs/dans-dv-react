import { Selector } from '@dans-dv/selector'

function App() {
  return (
    <Selector config={{
      swh: true,
      fileUpload: true,
      keywords: {
        wikidata: true,
        gettyAat: true,
      }
    }} />
  )
}

export default App
