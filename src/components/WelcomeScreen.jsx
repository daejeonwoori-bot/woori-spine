import { useRef, useState } from 'react'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen({ onFiles, isLoading }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={`${styles.screen} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className={styles.card}>
        <div className={styles.icon}>⬡</div>
        <h1 className={styles.title}>WOORI Spine</h1>
        <p className={styles.sub}>
          대전우리병원 척추 수술 3D 뷰어
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".dcm"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
          webkitdirectory=""
        />

        <button
          className={styles.openBtn}
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? '로딩 중...' : 'DICOM 파일 열기'}
        </button>

        <p className={styles.hint}>
          .dcm 파일 또는 폴더를 여기에 드래그 앤 드롭
        </p>
        <p className={styles.privacy}>
          🔒 모든 데이터는 이 기기에서만 처리됩니다
        </p>
      </div>
    </div>
  )
}
