import { useState } from 'react'
import './App.css'
import Toolbar from './components/Toolbar'
import Viewer3D from './components/Viewer3D'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [imageIds, setImageIds] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [approach, setApproach] = useState(null)
  const [preset, setPreset] = useState('CT-Bone')
  const [resetTrigger, setResetTrigger] = useState(0)
  const [seriesLabel, setSeriesLabel] = useState('')

  const handleFiles = async (files) => {
    const dicomFiles = Array.from(files).filter(f =>
      f.name.endsWith('.dcm') || f.type === 'application/dicom' || !f.type
    )
    if (dicomFiles.length === 0) {
      alert('DICOM 파일(.dcm)을 선택해주세요.')
      return
    }
    setIsLoading(true)
    setApproach(null)

    const firstFile = dicomFiles[0]
    const pathParts = (firstFile.webkitRelativePath || firstFile.name).split('/')
    setSeriesLabel(pathParts.length > 1 ? pathParts[pathParts.length - 2] : firstFile.name)

    const ids = dicomFiles.map(f => `wadouri:${URL.createObjectURL(f)}`)
    setImageIds(ids)
    setIsLoading(false)
  }

  const handleReset = () => {
    setApproach(null)
    setResetTrigger(n => n + 1)
  }

  const hasData = imageIds.length > 0

  return (
    <div className="app">
      <Toolbar
        onOpen={handleFiles}
        hasData={hasData}
        approach={approach}
        onApproach={setApproach}
        preset={preset}
        onPreset={setPreset}
        onReset={handleReset}
        seriesLabel={seriesLabel}
        sliceCount={imageIds.length}
      />
      <div className="main-area">
        {!hasData ? (
          <WelcomeScreen onFiles={handleFiles} isLoading={isLoading} />
        ) : (
          <Viewer3D
            imageIds={imageIds}
            approach={approach}
            preset={preset}
            resetTrigger={resetTrigger}
          />
        )}
      </div>
    </div>
  )
}

export default App
