import { useRef } from 'react'
import styles from './Toolbar.module.css'

export default function Toolbar({ onOpen, hasData, approach, onApproach, preset, onPreset }) {
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files?.length) onOpen(e.target.files)
    e.target.value = ''
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <span className={styles.logo}>WOORI Spine</span>
      </div>

      <div className={styles.center}>
        <input
          ref={inputRef}
          type="file"
          accept=".dcm"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
          webkitdirectory=""
        />
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => inputRef.current?.click()}
          title="DICOM 파일 열기"
        >
          Open
        </button>

        {hasData && (
          <>
            <div className={styles.divider} />

            {/* 수술 접근 방향 */}
            <button
              className={`${styles.btn} ${approach === 'right' ? styles.btnActive : ''}`}
              onClick={() => onApproach(approach === 'right' ? null : 'right')}
              title="Right side approach — cranial 90°"
            >
              R 접근
            </button>
            <button
              className={`${styles.btn} ${approach === 'left' ? styles.btnActive : ''}`}
              onClick={() => onApproach(approach === 'left' ? null : 'left')}
              title="Left side approach — cranial 270°"
            >
              L 접근
            </button>

            <div className={styles.divider} />

            {/* 볼륨 프리셋 */}
            <button
              className={`${styles.btn} ${preset === 'CT-Bone' ? styles.btnActive : ''}`}
              onClick={() => onPreset('CT-Bone')}
              title="뼈 프리셋"
            >
              Bone
            </button>
            <button
              className={`${styles.btn} ${preset === 'CT-Soft-Tissue' ? styles.btnActive : ''}`}
              onClick={() => onPreset('CT-Soft-Tissue')}
              title="연부조직 프리셋 (디스크/근육)"
            >
              Tissue
            </button>
          </>
        )}
      </div>

      <div className={styles.right}>
        <span className={styles.tag}>연구·교육용 — 의료기기 아님</span>
      </div>
    </div>
  )
}
