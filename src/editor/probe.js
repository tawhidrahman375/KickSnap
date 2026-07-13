/**
 * Probe an uploaded clip entirely client-side. Uses a throwaway <video> element
 * for rock-solid duration/dimension metadata — the file never leaves the device.
 */
export function probeClip(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      reject(new Error("That's not a video file. Drop an MP4, MOV, or WebM clip."))
      return
    }

    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }

    const finish = (duration) => {
      const meta = { url, width: video.videoWidth, height: video.videoHeight, duration }
      cleanup()
      if (!meta.width || !meta.height || !isFinite(meta.duration) || meta.duration <= 0) {
        URL.revokeObjectURL(url)
        reject(new Error("Couldn't read that clip. Try re-exporting it as an MP4."))
        return
      }
      resolve(meta)
    }

    video.onloadedmetadata = () => {
      // MediaRecorder/streamed WebM often reports Infinity until seeked past the
      // end — nudge it so the real duration resolves.
      if (!isFinite(video.duration) || video.duration === 0) {
        video.onseeked = () => {
          video.onseeked = null
          finish(video.duration)
        }
        video.currentTime = 1e101
        return
      }
      finish(video.duration)
    }

    video.onerror = () => {
      cleanup()
      URL.revokeObjectURL(url)
      reject(
        new Error(
          "This clip won't play in the browser. Chrome or Edge with an MP4 (H.264) works best.",
        ),
      )
    }

    video.src = url
  })
}
