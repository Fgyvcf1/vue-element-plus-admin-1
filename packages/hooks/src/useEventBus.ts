/**
 * 事件总线 Hook
 */
import mitt from 'mitt'
import { onBeforeUnmount } from 'vue'

type Fn = (...args: any[]) => any

interface Option {
  name: string
  callback: Fn
}

const emitter = mitt()

export const useEventBus = (option?: Option) => {
  if (option) {
    emitter.on(option.name, option.callback)

    onBeforeUnmount(() => {
      emitter.off(option.name)
    })
  }

  return {
    on: emitter.on,
    off: emitter.off,
    emit: emitter.emit,
    all: emitter.all
  }
}
