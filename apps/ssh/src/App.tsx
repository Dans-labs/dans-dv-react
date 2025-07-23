import { Selector } from '@dans-dv/selector'

function App() {
  return (
    <Selector config={{
      fileUpload: true,
      keywords: {
        wikidata: true,
        gettyAat: true,
        elsst: true,
      },
    }} />
  )
}

export default App
