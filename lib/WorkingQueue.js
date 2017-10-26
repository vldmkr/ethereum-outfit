function WorkingQueue () {
  const queue = []
  let currentObj = null
  let intervalID = null
  let watchDogTimeoutID = null

  function push (obj) {
    return queue.push(obj)
  }

  function shift () {
    if ( ! currentObj) {
      currentObj = queue.shift() || null
      return currentObj
    }
    return null
  }

  function next () {
    currentObj = null
    console.log('Next')

    clearWatchDog()
  }

  function current () {
    return currentObj;
  }

  function start (callback, interval) {
    if ( ! intervalID) {
      intervalID = setInterval(() => {
        if (shift()) {
          callback && callback(current())
        }
      }, interval || 1000)
    }
  }

  function stop () {
    clearInterval(intervalID)
    intervalID = null
  }

  function watchDogForNext (watchDogTimeout) {
    clearWatchDog()

    if(watchDogTimeout && watchDogTimeout > 0) {
      watchDogTimeoutID = setTimeout(() => {
        watchDogTimeoutID = null
     
        currentObj = null
        console.log('WatchDog')
      }, watchDogTimeout)
    }
  }

  function clearWatchDog () {
    if (watchDogTimeoutID) {
      clearTimeout(watchDogTimeoutID)
      watchDogTimeoutID = null
    }
  }

  return {
    push: push,
    next: next,
    current: current,
    start: start,
    stop: stop,
    watchDogForNext: watchDogForNext
  }
}

module.exports = WorkingQueue
