export function errorToString(error: any): string {
  if (error === undefined || error === null) {
    return 'Unknown error'
  }
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  let reason: string = error

  if (
    typeof error === 'object' ||
    error.message ||
    error.data ||
    error.error ||
    error.reason
  ) {
    // axios error
    if (error.response?.data) {
      error = error.response.data.error
      if (!error) {
        error = error.response?.data
      } else {
        if (error.message) {
          error = error.message
        }
      }
      return error
    }

    while (Boolean(error)) {
      reason = error.reason ?? error.message ?? reason
      error = error.error ?? error.data?.originalError
    }
  }

  return reason
}
