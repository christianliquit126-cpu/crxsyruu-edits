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
