export const ERR_FAILED_UPLOAD = 'Failed to upload script!'
export const ERR_FAILED_OBFUSCATE = 'Failed to obfuscate script!'
export const ERR_DEFAULT = "Something went wrong, try again later!"

export const failedToObfuscate = (msg?:string|number) => `${ERR_FAILED_OBFUSCATE}${msg?`(Error: ${msg} )`:''}`
export const failedToUpload = (msg?:string|number) => `${ERR_FAILED_UPLOAD}${msg?`(Error: ${msg} )`:''}`
