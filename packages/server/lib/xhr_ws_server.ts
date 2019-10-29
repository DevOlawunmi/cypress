import _ from 'lodash'
import Bluebird from 'bluebird'
import debugModule from 'debug'

const debug = debugModule('cypress:server:xhr_ws_server')

function trunc (str) {
  return _.truncate(str, {
    length: 100,
    omission: '... [truncated to 100 chars]',
  })
}

export function create () {
  let incomingXhrs: any[] = []

  function onIncomingXhr (id, data) {
    debug('onIncomingXhr %o', { id, res: trunc(data) })
    const resolve = incomingXhrs[id]

    if (resolve) {
      return resolve({
        data,
      })
    }

    incomingXhrs[id] = data
  }

  function getDeferredResponse (id) {
    debug('getDeferredResponse %o', { id })
    // if we already have it, send it
    const res = incomingXhrs[id]

    if (res) {
      if (res.then) {
        debug('returning existing deferred promise for %o', { id })
      }

      debug('already have deferred response %o', { id, res: trunc(res) })
      delete incomingXhrs[id]

      return res
    }

    return new Bluebird((resolve) => {
      debug('do not have response, waiting %o', { id })
      incomingXhrs[id] = resolve
    })
    .tap((res) => {
      debug('deferred response found %o', { id, res: trunc(res) })
    })
  }

  function onBeforeTestRun () {

  }

  return {
    onIncomingXhr,
    getDeferredResponse,
    onBeforeTestRun,
  }
}