const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = !!(CLOUD_NAME && UPLOAD_PRESET && CLOUD_NAME !== 'undefined')

export const uploadToCloudinary = async (file, onProgress) => {
  if (!isCloudinaryConfigured) {
    await new Promise(r => setTimeout(r, 2000))
    return {
      url: `https://res.cloudinary.com/demo/video/upload/sample`,
      publicId: `demo_${Date.now()}`,
      resourceType: file.type.startsWith('video') ? 'video' : 'image',
      format: file.name.split('.').pop(),
      demo: true,
    }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const resourceType = file.type.startsWith('video') ? 'video' : 'image'
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          resourceType: data.resource_type,
          format: data.format,
          width: data.width,
          height: data.height,
          duration: data.duration,
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export const getCloudinaryUrl = (publicId, options = {}) => {
  if (!CLOUD_NAME) return ''
  const { width, height, quality = 'auto', format = 'auto' } = options
  const transforms = [
    `q_${quality}`,
    `f_${format}`,
    width && `w_${width}`,
    height && `h_${height}`,
    'c_fill',
  ].filter(Boolean).join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

export const getThumbnailUrl = (publicId, cloudName = CLOUD_NAME) => {
  if (!cloudName) return ''
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_640,h_360,c_fill,q_auto/${publicId}.jpg`
}

const HEIGHT_MAP = {
  '1080': 'h_1080',
  '720': 'h_720',
  '480': 'h_480',
}

const CLOUDINARY_VIDEO_BASE_PARAMS = 'f_auto,q_auto:good,vc_auto'

export const getVideoQualityUrl = (url, quality) => {
  if (!url) return url
  if (!url.includes('res.cloudinary.com')) return url

  const uploadIdx = url.indexOf('/upload/')
  if (uploadIdx === -1) return url
  const after = uploadIdx + 8

  const existingTransforms = url.slice(after)
  const alreadyOptimized = existingTransforms.startsWith('f_') || existingTransforms.startsWith('q_') || existingTransforms.startsWith('vc_')

  if (quality === 'auto') {
    if (alreadyOptimized) return url
    return `${url.slice(0, after)}${CLOUDINARY_VIDEO_BASE_PARAMS}/${existingTransforms}`
  }

  const h = HEIGHT_MAP[quality]
  if (!h) return url

  const qualityParams = `${h},c_limit,${CLOUDINARY_VIDEO_BASE_PARAMS}`
  return `${url.slice(0, after)}${qualityParams}/${existingTransforms}`
}

export const getVideoThumbnailFromUrl = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('res.cloudinary.com')) return null
  const uploadIdx = videoUrl.indexOf('/upload/')
  if (uploadIdx === -1) return null
  const after = uploadIdx + 8
  const rest = videoUrl.slice(after)
  const noExtRest = rest.replace(/\.[^/.]+$/, '')
  const baseUrl = videoUrl.slice(0, after)
  return `${baseUrl}so_0,w_640,h_360,c_fill,q_auto/${noExtRest}.jpg`
}
