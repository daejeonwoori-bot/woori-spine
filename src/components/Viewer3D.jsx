import { useEffect, useRef, useState, useCallback } from 'react'
import { initCornerstone } from '../lib/initCornerstone'
import styles from './Viewer3D.module.css'

const RENDERING_ENGINE_ID = 'wooriEngine'
const VIEWPORT_ID = 'VIEWPORT_3D'
const VOLUME_ID = 'cornerstoneStreamingImageVolume:wooriVolume'

// ── 커스텀 프리셋 (setProperties에 객체로 직접 전달 가능) ────────────────
// 300 HU 이하 완전 투명 → 뼈만 아이보리/흰색으로 렌더링 (ALTICIAN 스타일)
const WOORI_BONE_PRESET = {
  name: 'WOORI-Bone',
  gradientOpacity: '4 0 1 255 1',
  specularPower: '20',
  scalarOpacity: '8 -3024 0 300 0 420 0.60 3071 0.72',
  specular: '0.30',
  shade: '1',
  ambient: '0.15',
  colorTransfer: '16 -3024 0 0 0 300 0 0 0 420 0.88 0.82 0.65 3071 1 1 1',
  diffuse: '0.90',
  interpolation: '1',
}

// 연조직 프리셋: 디스크·신경·척수도 보이도록
const WOORI_SOFT_PRESET = {
  name: 'WOORI-Soft',
  gradientOpacity: '4 0 1 255 1',
  specularPower: '10',
  scalarOpacity: '12 -3024 0 -77 0 50 0.12 200 0.30 400 0.50 3071 0.70',
  specular: '0.20',
  shade: '1',
  ambient: '0.15',
  colorTransfer: '24 -3024 0 0 0 -77 0.55 0.25 0.15 50 0.88 0.60 0.29 200 1.0 0.94 0.95 400 0.75 0.75 0.85 3071 1 1 1',
  diffuse: '0.90',
  interpolation: '1',
}

// viewUp 축 기준 θ 회전 (Rodrigues) — 사선 기본 카메라
function rotateCamera(viewport, angleDeg) {
  try {
    const cam = viewport.getCamera()
    if (!cam?.focalPoint || !cam?.position) return

    const [cx, cy, cz] = cam.focalPoint
    const pos = cam.position
    const rawUp = cam.viewUp ?? [0, 0, 1]
    const dist = Math.sqrt((pos[0]-cx)**2 + (pos[1]-cy)**2 + (pos[2]-cz)**2)
    if (dist === 0) return

    const dx = (pos[0]-cx)/dist, dy = (pos[1]-cy)/dist, dz = (pos[2]-cz)/dist

    // viewUp 정규화
    const uLen = Math.sqrt(rawUp[0]**2 + rawUp[1]**2 + rawUp[2]**2)
    const [ux, uy, uz] = uLen > 0 ? rawUp.map(v => v/uLen) : [0, 0, 1]

    const a = angleDeg * Math.PI / 180
    const c = Math.cos(a), s = Math.sin(a)
    const dot = ux*dx + uy*dy + uz*dz
    const crx = uy*dz - uz*dy, cry = uz*dx - ux*dz, crz = ux*dy - uy*dx

    const nx = dx*c + crx*s + ux*dot*(1-c)
    const ny = dy*c + cry*s + uy*dot*(1-c)
    const nz = dz*c + crz*s + uz*dot*(1-c)

    viewport.setCamera({
      position: [cx + nx*dist, cy + ny*dist, cz + nz*dist],
      focalPoint: [cx, cy, cz],
      viewUp: rawUp,
      parallelScale: cam.parallelScale,
    })
    viewport.updateCameraClippingPlanesAndRange()
  } catch (e) {
    console.warn('[WOORI] rotateCamera 오류:', e.message)
  }
}

export default function Viewer3D({ imageIds, approach, preset }) {
  const containerRef = useRef(null)
  const engineRef   = useRef(null)
  const viewportRef = useRef(null)
  const [status, setStatus] = useState('초기화 중...')
  const [error,  setError]  = useState(null)

  // 프리셋 적용 헬퍼 — 커스텀 프리셋 객체를 직접 주입
  const applyPreset = useCallback((vp, presetName) => {
    try {
      const preset = presetName === 'CT-Soft-Tissue' ? WOORI_SOFT_PRESET : WOORI_BONE_PRESET
      vp.setProperties({ preset })
      vp.render()
    } catch (e) {
      console.warn('[WOORI] setProperties 오류:', e.message)
    }
  }, [])

  // ── 볼륨 로딩 ─────────────────────────────────────────────
  useEffect(() => {
    if (!imageIds.length || !containerRef.current) return
    let cancelled = false

    async function setup() {
      try {
        setError(null)
        setStatus('Cornerstone 초기화 중...')

        const { csCore } = await initCornerstone()
        if (cancelled) return

        const { RenderingEngine, Enums, volumeLoader, setVolumesForViewports, cache } = csCore

        // 기존 엔진 정리
        try { engineRef.current?.destroy() } catch {}
        engineRef.current  = null
        viewportRef.current = null

        setStatus('렌더링 엔진 생성 중...')
        const engine = new RenderingEngine(RENDERING_ENGINE_ID)
        engineRef.current = engine

        engine.setViewports([{
          viewportId: VIEWPORT_ID,
          type: Enums.ViewportType.VOLUME_3D,
          element: containerRef.current,
          defaultOptions: {
            orientation: Enums.OrientationAxis.CORONAL,
            background: [0.02, 0.02, 0.02],
          },
        }])

        // 캐시 정리
        try {
          if (cache.getVolume(VOLUME_ID)) cache.removeVolumeLoadObject(VOLUME_ID)
        } catch {}

        setStatus(`볼륨 생성 중... (${imageIds.length}개 슬라이스)`)
        const volume = await volumeLoader.createAndCacheVolume(VOLUME_ID, { imageIds })
        if (cancelled) return

        setStatus('볼륨 뷰포트 연결 중...')
        await setVolumesForViewports(engine, [{ volumeId: VOLUME_ID }], [VIEWPORT_ID])
        if (cancelled) return

        const vp = engine.getViewport(VIEWPORT_ID)
        viewportRef.current = vp

        // 즉시 프리셋 적용 후 초기 렌더
        applyPreset(vp, preset)

        setStatus(`데이터 로딩 중... (${imageIds.length}개 슬라이스)`)
        volume.load(() => {
          if (cancelled) return
          const v = viewportRef.current
          if (!v) return
          // 로딩 완료 — 프리셋 재적용 + 사선 카메라
          applyPreset(v, preset)
          v.resetCamera()
          rotateCamera(v, 30)  // ALTICIAN 스타일 30° 사선 뷰
          v.render()
          setStatus(null)
        })

      } catch (err) {
        console.error('[WOORI Viewer3D]', err)
        if (!cancelled) setError(err.message)
      }
    }

    setup()
    return () => { cancelled = true }
  }, [imageIds])

  // ── 수술 접근 방향 카메라 ─────────────────────────────────
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    if (!approach) {
      // 기본 사선 뷰 복원
      applyPreset(vp, preset)
      vp.resetCamera()
      rotateCamera(vp, 30)
      vp.render()
      return
    }

    try {
      vp.resetCamera()
      const cam = vp.getCamera()
      if (!cam?.focalPoint) return

      const [cx, cy, cz] = cam.focalPoint
      const pos = cam.position
      const dist = Math.sqrt((pos[0]-cx)**2 + (pos[1]-cy)**2 + (pos[2]-cz)**2)

      // right: 환자 우측(-L), left: 환자 좌측(+L)에서 바라봄
      const sign = approach === 'right' ? -1 : 1
      vp.setCamera({
        position: [cx + sign*dist, cy, cz],
        focalPoint: [cx, cy, cz],
        viewUp: [0, 1, 0],
        parallelScale: cam.parallelScale,
      })
      vp.updateCameraClippingPlanesAndRange()
      vp.render()
    } catch (e) {
      console.warn('[WOORI] approach 카메라 오류:', e.message)
    }
  }, [approach])

  // ── 볼륨 프리셋 전환 ─────────────────────────────────────
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    applyPreset(vp, preset)
  }, [preset])

  // ── 언마운트 정리 ────────────────────────────────────────
  useEffect(() => () => {
    try { engineRef.current?.destroy() } catch {}
  }, [])

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.viewport} />
      {status && !error && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <span>{status}</span>
        </div>
      )}
      {error && (
        <div className={styles.error}>
          <p>렌더링 오류</p>
          <pre>{error}</pre>
        </div>
      )}
    </div>
  )
}
