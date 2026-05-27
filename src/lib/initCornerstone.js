let modules = null

export async function initCornerstone() {
  if (modules) return modules

  // 동일한 인스턴스를 캐싱해서 반환 — Viewer3D도 여기서 가져다 씀
  const csCore = await import('@cornerstonejs/core')
  const csTools = await import('@cornerstonejs/tools')

  await csCore.init()
  await csTools.init()

  try {
    const dicomLoader = await import('@cornerstonejs/dicom-image-loader')
    dicomLoader.init({
      maxWebWorkers: Math.max(1, (navigator.hardwareConcurrency ?? 2) - 1),
    })
  } catch (e) {
    console.warn('[WOORI] DICOM loader 초기화 실패:', e.message)
  }

  modules = { csCore, csTools }
  return modules
}
