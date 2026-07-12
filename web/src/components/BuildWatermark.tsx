export function BuildWatermark() {
  return (
    <p className="build-watermark" aria-hidden="true">
      v{__APP_VERSION__} · {__GIT_COMMIT__}
    </p>
  )
}
