import { Selector } from '@dans-dv/selector'

function App() {
  return (
    <Selector config={{
      swh: true,
      fileUpload: true,
      keywords: {
        wikidata: true,
        gettyAat: true,
        elsst: true,
      },
      geo: {
        geonames: true,
        map: {
          draw: {
            point: true,
            line: false,
            polygon: false,
            rectangle: true,
          },
        },
      },
    }} />
  )
}

export default App
