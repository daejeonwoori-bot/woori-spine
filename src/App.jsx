import { useState } from 'react'
import './App.css'
import Toolbar from './components/Toolbar'
import Viewer3D from './components/Viewer3D'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [imageIds, setImageIds] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [approach, setApproach] = useState(null)      // null | 'right' | 'left'
  const [preset, setPreset] = useState('CT-Bone')     // 'CT-Bone' | 'CT-Soft-Tissue'

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
    const ids = dicomFiles.map(f => `wadouri:${URL.createObjectURL(f)}`)
    setImageIds(ids)
    setIsLoading(false)
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
      />
      <div className="main-area">
        {!hasData ? (
          <WelcomeScreen onFiles={handleFiles} isLoading={isLoading} />
        ) : (
          <Viewer3D imageIds={imageIds} approach={approach} preset={preset} />
        )}
      </div>
    </div>
  )
}

export default App
