import { ref } from 'vue'

export function useMessages() {
  const errorMsg = ref('')
  const successMsg = ref('')

  function setError(msg) {
    errorMsg.value = msg
    successMsg.value = ''
  }

  function setSuccess(msg) {
    successMsg.value = msg
    errorMsg.value = ''
  }

  function clearMessages() {
    errorMsg.value = ''
    successMsg.value = ''
  }

  return {
    errorMsg,
    successMsg,
    setError,
    setSuccess,
    clearMessages
  }
}
