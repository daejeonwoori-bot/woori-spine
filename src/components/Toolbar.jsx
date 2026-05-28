import { useRef } from 'react'
import styles from './Toolbar.module.css'

export default function Toolbar({
  onOpen, hasData, approach, onApproach,
  preset, onPreset, onReset, seriesLabel, sliceCount,
}) {
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files?.length) onOpen(e.target.files)
    e.target.value = ''
  }

  return (
    <div className={styles.toolbar}>

      {/* 좌측: 로고 + 시리즈 정보 */}
      <div className={styles.left}>
        <span className={styles.logo}>WOORI Spine</span>
        {hasData && seriesLabel && (
          <span className={styles.seriesInfo}>
            {seriesLabel}
            {sliceCount > 0 && <span className={styles.sliceCount}>{sliceCount}slices</span>}
          </span>
        )}
      </div>

      {/* 중앙: 도구 */}
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
          title="DICOM 폴더 열기"
        >
          Open
        </button>

        {hasData && (
          <>
            <div className={styles.divider} />

            {/* 뷰 리셋 */}
            <button
              className={styles.btn}
              onClick={onReset}
              title="기본 뷰로 돌아가기"
            >
              Reset
            </button>

            <div className={styles.divider} />

            {/* 수술 접근 방향 */}
            <span className={styles.groupLabel}>접근</span>
            <button
              className={`${styles.btn} ${approach === 'right' ? styles.btnActive : ''}`}
              onClick={() => onApproach(approach === 'right' ? null : 'right')}
              title="우측 접근 — cranial 90°"
            >
              R
            </button>
            <button
              className={`${styles.btn} ${approach === 'left' ? styles.btnActive : ''}`}
              onClick={() => onApproach(approach === 'left' ? null : 'left')}
              title="좌측 접근 — cranial 270°"
            >
              L
            </button>

            <div className={styles.divider} />

            {/* 볼륨 프리셋 */}
            <span className={styles.groupLabel}>프리셋</span>
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
              title="연부조직 프리셋"
            >
              Tissue
            </button>
          </>
        )}
      </div>

      {/* 우측: 면책 */}
      <div className={styles.right}>
        <span className={styles.tag}>연구·교육용 — 의료기기 아님</span>
      </div>

    </div>
  )
}
