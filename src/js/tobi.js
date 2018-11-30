/**
 * Tobi
 *
 * @author rqrauhvmra
 * @version 1.8.0
 * @url https://github.com/rqrauhvmra/Tobi
 *
 * MIT License
 */
(((root, factory) => {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    root.Tobi = factory()
  }
})(this, () => {
  const Tobi = function Tobi (userOptions) {
    /**
     * Global variables
     *
     */
    let config = {}

    const browserWindow = window
    let transformProperty = null
    const gallery = []
    let figcaptionId = 0
    let elementsLength = 0
    let lightbox = null
    let slider = null
    const sliderElements = []
    let prevButton = null
    let nextButton = null
    let closeButton = null
    let counter = null
    let currentIndex = 0
    let drag = {}
    let isDraggingX = false
    let isDraggingY = false
    let pointerDown = false
    let lastFocus = null
    let firstFocusableEl = null
    let lastFocusableEl = null
    let offset = null
    let offsetTmp = null
    let resizeTicking = false
    let touchmoveTicking = false
    let mousemoveTicking = false
    let isYouTubeDependencieLoaded = false
    const waitingEls = []
    const player = []
    let playerId = 0
    let x = 0

    /**
     * Merge default options with user options
     *
     * @param {Object} userOptions - Optional user options
     * @returns {Object} - Custom options
     */
    const mergeOptions = function mergeOptions (userOptions) {
      // Default options
      const options = {
        selector: '.lightbox',
        captions: true,
        captionsSelector: 'img',
        captionAttribute: 'alt',
        nav: 'auto',
        navText: ['<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><polyline points="14 18 8 12 14 6 14 6"></polyline></svg>', '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><polyline points="10 6 16 12 10 18 10 18"></polyline></svg>'],
        navLabel: ['Previous', 'Next'],
        close: true,
        closeText: '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewbox="0 0 24 24"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"></path></svg>',
        closeLabel: 'Close',
        loadingIndicatorLabel: 'Image loading',
        counter: true,
        download: false, // TODO
        downloadText: '', // TODO
        downloadLabel: 'Download', // TODO
        keyboard: true,
        zoom: true,
        zoomText: '<svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polyline points="21 16 21 21 16 21"/><polyline points="8 21 3 21 3 16"/><polyline points="16 3 21 3 21 8"/><polyline points="3 8 3 3 8 3"/></svg>',
        docClose: true,
        swipeClose: true,
        hideScrollbar: true,
        draggable: true,
        threshold: 100,
        rtl: false, // TODO
        loop: false, // TODO
        autoplayVideo: false,
        theme: 'dark'
      }

      if (userOptions) {
        Object.keys(userOptions).forEach(key => {
          options[key] = userOptions[key]
        })
      }

      return options
    }

    /**
     * Determine if browser supports unprefixed transform property
     *
     * @returns {string} - Transform property supported by client
     */
    const transformSupport = function transformSupport () {
      return typeof document.documentElement.style.transform === 'string' ? 'transform' : 'WebkitTransform'
    }

    /**
     * Types - you can add new type to support something new
     *
     */
    const supportedElements = {
      image: {
        checkSupport (el) {
          return !el.hasAttribute('data-type') && el.href.match(/\.(png|jpe?g|tiff|tif|gif|bmp|webp|svg|ico)$/)
        },

        init (el, container) {
          const figure = document.createElement('figure')
          const figcaption = document.createElement('figcaption')
          const image = document.createElement('img')
          const thumbnail = el.querySelector('img')
          const loadingIndicator = document.createElement('div')

          image.style.opacity = '0'

          if (thumbnail) {
            image.alt = thumbnail.alt || ''
          }

          image.setAttribute('src', '')
          image.setAttribute('data-src', el.href)

          // Add image to figure
          figure.appendChild(image)

          // Create figcaption
          if (config.captions) {
            figcaption.style.opacity = '0'

            if (config.captionsSelector === 'self' && el.getAttribute(config.captionAttribute)) {
              figcaption.textContent = el.getAttribute(config.captionAttribute)
            } else if (config.captionsSelector === 'img' && thumbnail && thumbnail.getAttribute(config.captionAttribute)) {
              figcaption.textContent = thumbnail.getAttribute(config.captionAttribute)
            }

            if (figcaption.textContent) {
              figcaption.id = `tobi-figcaption-${figcaptionId}`
              figure.appendChild(figcaption)

              image.setAttribute('aria-labelledby', figcaption.id)

              ++figcaptionId
            }
          }

          // Add figure to container
          container.appendChild(figure)

          // Create loading indicator
          loadingIndicator.className = 'tobi-loader'
          loadingIndicator.setAttribute('role', 'progressbar')
          loadingIndicator.setAttribute('aria-label', config.loadingIndicatorLabel)

          // Add loading indicator to container
          container.appendChild(loadingIndicator)

          // Register type
          container.setAttribute('data-type', 'image')
        },

        onPreload (container) {
          // Same as preload
          supportedElements.image.onLoad(container)
        },

        onLoad (container) {
          const image = container.querySelector('img')

          if (!image.hasAttribute('data-src')) {
            return
          }

          const figcaption = container.querySelector('figcaption')
          const loadingIndicator = container.querySelector('.tobi-loader')

          image.onload = () => {
            container.removeChild(loadingIndicator)
            image.style.opacity = '1'

            if (figcaption) {
              figcaption.style.opacity = '1'
            }
          }

          image.setAttribute('src', image.getAttribute('data-src'))
          image.removeAttribute('data-src')
        },

        onLeave (container) {
          // Nothing
        },

        onCleanup (container) {
          // Nothing
        }
      },

      html: {
        checkSupport (el) {
          return checkType(el, 'html')
        },

        init (el, container) {
          const targetSelector = el.hasAttribute('href') ? el.getAttribute('href') : el.getAttribute('data-target')
          const target = document.querySelector(targetSelector)

          if (!target) {
            throw new Error(`Ups, I can't find the target ${targetSelector}.`)
          }

          // Add content to container
          container.appendChild(target)

          // Register type
          container.setAttribute('data-type', 'html')
        },

        onPreload (container) {
          // Nothing
        },

        onLoad (container) {
          const video = container.querySelector('video')

          if (video) {
            if (video.hasAttribute('data-time') && video.readyState > 0) {
              // Continue where video was stopped
              video.currentTime = video.getAttribute('data-time')
            }

            if (config.autoplayVideo) {
              // Start playback (and loading if necessary)
              video.play()
            }
          }
        },

        onLeave (container) {
          const video = container.querySelector('video')

          if (video) {
            if (!video.paused) {
              // Stop if video is playing
              video.pause()
            }

            // Backup currentTime (needed for revisit)
            if (video.readyState > 0) {
              video.setAttribute('data-time', video.currentTime)
            }
          }
        },

        onCleanup (container) {
          const video = container.querySelector('video')

          if (video) {
            if (video.readyState > 0 && video.readyState < 3 && video.duration !== video.currentTime) {
              // Some data has been loaded but not the whole package.
              // In order to save bandwidth, stop downloading as soon as possible.
              const clone = video.cloneNode(true)

              removeSources(video)
              video.load()

              video.parentNode.removeChild(video)

              container.appendChild(clone)
            }
          }
        }
      },

      iframe: {
        checkSupport (el) {
          return checkType(el, 'iframe')
        },

        init (el, container) {
          const iframe = document.createElement('iframe')
          const href = el.hasAttribute('href') ? el.getAttribute('href') : el.getAttribute('data-target')

          iframe.setAttribute('frameborder', '0')
          iframe.setAttribute('src', '')
          iframe.setAttribute('data-src', href)

          // Add iframe to container
          container.appendChild(iframe)

          // Register type
          container.setAttribute('data-type', 'iframe')
        },

        onPreload (container) {
          // Nothing
        },

        onLoad (container) {
          const iframe = container.querySelector('iframe')

          iframe.setAttribute('src', iframe.getAttribute('data-src'))
        },

        onLeave (container) {
          // Nothing
        },

        onCleanup (container) {
          // Nothing
        }
      },

      youtube: {
        checkSupport (el) {
          return checkType(el, 'youtube')
        },

        init (el, container) {
          const iframePlaceholder = document.createElement('div')

          // Add iframePlaceholder to container
          container.appendChild(iframePlaceholder)

          player[playerId] = new window.YT.Player(iframePlaceholder, {
            host: 'https://www.youtube-nocookie.com',
            height: el.getAttribute('data-height') || '360',
            width: el.getAttribute('data-width') || '640',
            videoId: el.getAttribute('data-id'),
            playerVars: {
              'controls': el.getAttribute('data-controls') || 1,
              'rel': 0,
              'playsinline': 1
            }
          })

          // Set player ID
          container.setAttribute('data-player', playerId)

          // Register type
          container.setAttribute('data-type', 'youtube')

          playerId++
        },

        onPreload (container) {
          // Nothing
        },

        onLoad (container) {
          if (config.autoplayVideo) {
            player[container.getAttribute('data-player')].playVideo()
          }
        },

        onLeave (container) {
          if (player[container.getAttribute('data-player')].getPlayerState() === 1) {
            player[container.getAttribute('data-player')].pauseVideo()
          }
        },

        onCleanup (container) {
          if (player[container.getAttribute('data-player')].getPlayerState() === 1) {
            player[container.getAttribute('data-player')].pauseVideo()
          }
        }
      }
    }

    /**
     * Init
     *
     */
    const init = function init (userOptions) {
      // Merge user options into defaults
      config = mergeOptions(userOptions)

      // Transform property supported by client
      transformProperty = transformSupport()

      // Check if the lightbox already exists
      if (!lightbox) {
        // Create the lightbox
        createLightbox()
      }

      // Get a list of all elements within the document
      const els = document.querySelectorAll(config.selector)

      if (!els) {
        throw new Error(`Ups, I can't find the selector ${config.selector}.`)
      }

      // Execute a few things once per element
      Array.prototype.forEach.call(els, el => {
        checkDependencies(el)
      })
    }

    /**
     * Check dependencies
     *
     * @param {HTMLElement} el - Element to add
     */
    var checkDependencies = function checkDependencies (el) {
      // Check if there is a YouTube video and if the YouTube iframe-API is ready
      if (document.querySelector('[data-type="youtube"]') !== null && !isYouTubeDependencieLoaded) {
        if (document.getElementById('iframe_api') === null) {
          const tag = document.createElement('script')
          const firstScriptTag = document.getElementsByTagName('script')[0]

          tag.id = 'iframe_api'
          tag.src = 'https://www.youtube.com/iframe_api'

          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        }

        if (!waitingEls.includes(el)) {
          waitingEls.push(el)
        }

        window.onYouTubePlayerAPIReady = () => {
          Array.prototype.forEach.call(waitingEls, waitingEl => {
            add(waitingEl)
          })

          isYouTubeDependencieLoaded = true
        }
      } else {
        add(el)
      }
    }

    /**
     * Add element
     *
     * @param {HTMLElement} el - Element to add
     * @param {function} callback - Optional callback to call after add
     */
    var add = function add (el, callback) {
      // Check if element already exists
      if (!gallery.includes(el)) {
        gallery.push(el)
        elementsLength++

        // Set zoom icon if necessary
        if (config.zoom && el.querySelector('img')) {
          const tobiZoom = document.createElement('div')

          tobiZoom.className = 'tobi-zoom__icon'
          tobiZoom.innerHTML = config.zoomText

          el.classList.add('tobi-zoom')
          el.appendChild(tobiZoom)
        }

        // Bind click event handler
        el.addEventListener('click', function (event) {
          event.preventDefault()

          open(gallery.indexOf(this))
        })

        // Create the slide
        createLightboxSlide(el)

        if (isOpen()) {
          recheckConfig()
          updateLightbox()
        }

        if (callback) {
          callback.call(this)
        }
      } else {
        throw new Error('Ups, element already added to the lightbox.')
      }
    }

    /**
     * Create the lightbox
     *
     */
    var createLightbox = function createLightbox () {
      // Create lightbox container
      lightbox = document.createElement('div')
      lightbox.setAttribute('role', 'dialog')
      lightbox.setAttribute('aria-hidden', 'true')
      lightbox.className = `tobi tobi--theme-${config.theme}`

      // Create slider container
      slider = document.createElement('div')
      slider.className = 'tobi__slider'
      lightbox.appendChild(slider)

      // Create previous button
      prevButton = document.createElement('button')
      prevButton.className = 'tobi__prev'
      prevButton.setAttribute('type', 'button')
      prevButton.setAttribute('aria-label', config.navLabel[0])
      prevButton.innerHTML = config.navText[0]
      lightbox.appendChild(prevButton)

      // Create next button
      nextButton = document.createElement('button')
      nextButton.className = 'tobi__next'
      nextButton.setAttribute('type', 'button')
      nextButton.setAttribute('aria-label', config.navLabel[1])
      nextButton.innerHTML = config.navText[1]
      lightbox.appendChild(nextButton)

      // Create close button
      closeButton = document.createElement('button')
      closeButton.className = 'tobi__close'
      closeButton.setAttribute('type', 'button')
      closeButton.setAttribute('aria-label', config.closeLabel)
      closeButton.innerHTML = config.closeText
      lightbox.appendChild(closeButton)

      // Create counter
      counter = document.createElement('div')
      counter.className = 'tobi__counter'
      lightbox.appendChild(counter)

      // Resize event using requestAnimationFrame
      browserWindow.addEventListener('resize', () => {
        if (!resizeTicking) {
          resizeTicking = true

          browserWindow.requestAnimationFrame(() => {
            updateOffset()

            resizeTicking = false
          })
        }
      })

      document.body.appendChild(lightbox)
    }

    /**
     * Create a lightbox slide
     *
     */
    var createLightboxSlide = function createLightboxSlide (el) {
      // Detect type
      for (const index in supportedElements) {
        if (supportedElements.hasOwnProperty(index)) {
          if (supportedElements[index].checkSupport(el)) {
            // Create slide elements
            const sliderElement = document.createElement('div')

            const sliderElementContent = document.createElement('div')

            sliderElement.className = 'tobi__slider__slide'
            sliderElement.style.position = 'absolute'
            sliderElement.style.left = `${x * 100}%`
            sliderElementContent.className = 'tobi__slider__slide__content'

            // Create type elements
            supportedElements[index].init(el, sliderElementContent)

            // Add slide content container to slider element
            sliderElement.appendChild(sliderElementContent)

            // Add slider element to slider
            slider.appendChild(sliderElement)
            sliderElements.push(sliderElement)

            ++x

            break
          }
        }
      }
    }

    /**
     * Open the lightbox
     *
     * @param {number} index - Index to load
     * @param {function} callback - Optional callback to call after open
     */
    var open = function open (index, callback) {
      if (!isOpen() && !index) {
        index = 0
      }

      if (isOpen()) {
        if (!index) {
          throw new Error('Ups, Tobi is aleady open.')
        }

        if (index === currentIndex) {
          throw new Error(`Ups, slide ${index} is already selected.`)
        }
      }

      if (index === -1 || index >= elementsLength) {
        throw new Error(`Ups, I can't find slide ${index}.`)
      }

      if (config.hideScrollbar) {
        document.documentElement.classList.add('tobi-is-open')
        document.body.classList.add('tobi-is-open')
      }

      recheckConfig()

      // Hide close if necessary
      if (!config.close) {
        closeButton.disabled = false
        closeButton.setAttribute('aria-hidden', 'true')
      }

      // Save the user’s focus
      lastFocus = document.activeElement

      // Set current index
      currentIndex = index

      // Clear drag
      clearDrag()

      // Bind events
      bindEvents()

      // Load slide
      load(currentIndex)

      // Makes lightbox appear, too
      lightbox.setAttribute('aria-hidden', 'false')

      // Update lightbox
      updateLightbox()

      // Preload late
      preload(currentIndex + 1)
      preload(currentIndex - 1)

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Close the lightbox
     *
     * @param {function} callback - Optional callback to call after close
     */
    const close = function close (callback) {
      if (!isOpen()) {
        throw new Error('Tobi is already closed.')
      }

      if (config.hideScrollbar) {
        document.documentElement.classList.remove('tobi-is-open')
        document.body.classList.remove('tobi-is-open')
      }

      // Unbind events
      unbindEvents()

      // Reenable the user’s focus
      lastFocus.focus()

      // Don't forget to cleanup our current element
      const container = sliderElements[currentIndex].querySelector('.tobi__slider__slide__content')
      const type = container.getAttribute('data-type')
      supportedElements[type].onLeave(container)
      supportedElements[type].onCleanup(container)

      lightbox.setAttribute('aria-hidden', 'true')

      // Reset current index
      currentIndex = 0

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Preload slide
     *
     * @param {number} index - Index to preload
     */
    var preload = function preload (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      const container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      const type = container.getAttribute('data-type')

      supportedElements[type].onPreload(container)
    }

    /**
     * Load slide
     * Will be called when opening the lightbox or moving index
     *
     * @param {number} index - Index to load
     */
    var load = function load (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      const container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      const type = container.getAttribute('data-type')

      supportedElements[type].onLoad(container)
    }

    /**
     * Navigate to the previous slide
     *
     * @param {function} callback - Optional callback function
     */
    const prev = function prev (callback) {
      if (currentIndex > 0) {
        leave(currentIndex)
        load(--currentIndex)
        updateLightbox('left')
        cleanup(currentIndex + 1)
        preload(currentIndex - 1)

        if (callback) {
          callback.call(this)
        }
      }
    }

    /**
     * Navigate to the next slide
     *
     * @param {function} callback - Optional callback function
     */
    const next = function next (callback) {
      if (currentIndex < elementsLength - 1) {
        leave(currentIndex)
        load(++currentIndex)
        updateLightbox('right')
        cleanup(currentIndex - 1)
        preload(currentIndex + 1)

        if (callback) {
          callback.call(this)
        }
      }
    }

    /**
     * Leave slide
     * Will be called before moving index
     *
     * @param {number} index - Index to leave
     */
    var leave = function leave (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      const container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      const type = container.getAttribute('data-type')

      supportedElements[type].onLeave(container)
    }

    /**
     * Cleanup slide
     * Will be called after moving index
     *
     * @param {number} index - Index to cleanup
     */
    var cleanup = function cleanup (index) {
      if (sliderElements[index] === undefined) {
        return
      }

      const container = sliderElements[index].querySelector('.tobi__slider__slide__content')
      const type = container.getAttribute('data-type')

      supportedElements[type].onCleanup(container)
    }

    /**
     * Update the offset
     *
     */
    var updateOffset = function updateOffset () {
      offset = -currentIndex * window.innerWidth

      slider.style[transformProperty] = `translate3d(${offset}px, 0, 0)`
      offsetTmp = offset
    }

    /**
     * Update the counter
     *
     */
    const updateCounter = function updateCounter () {
      counter.textContent = `${currentIndex + 1}/${elementsLength}`
    }

    /**
     * Set the focus to the next element
     *
     * @param {string} dir - Current slide direction
     */
    const updateFocus = function updateFocus (dir) {
      let focusableEls = null

      if (config.nav) {
        // Display the next and previous buttons
        prevButton.disabled = false
        nextButton.disabled = false

        if (elementsLength === 1) {
          // Hide the next and previous buttons if there is only one slide
          prevButton.disabled = true
          nextButton.disabled = true

          if (config.close) {
            closeButton.focus()
          }
        } else if (currentIndex === 0) {
          // Hide the previous button when the first slide is displayed
          prevButton.disabled = true
        } else if (currentIndex === elementsLength - 1) {
          // Hide the next button when the last slide is displayed
          nextButton.disabled = true
        }

        if (!dir && !nextButton.disabled) {
          nextButton.focus()
        } else if (!dir && nextButton.disabled && !prevButton.disabled) {
          prevButton.focus()
        } else if (!nextButton.disabled && dir === 'right') {
          nextButton.focus()
        } else if (nextButton.disabled && dir === 'right' && !prevButton.disabled) {
          prevButton.focus()
        } else if (!prevButton.disabled && dir === 'left') {
          prevButton.focus()
        } else if (prevButton.disabled && dir === 'left' && !nextButton.disabled) {
          nextButton.focus()
        }
      } else if (config.close) {
        closeButton.focus()
      }

      focusableEls = lightbox.querySelectorAll('button:not(:disabled)')
      firstFocusableEl = focusableEls[0]
      lastFocusableEl = focusableEls.length === 1 ? focusableEls[0] : focusableEls[focusableEls.length - 1]
    }

    /**
     * Clear drag after touchend and mousup event
     *
     */
    var clearDrag = function clearDrag () {
      drag = {
        startX: 0,
        endX: 0,
        startY: 0,
        endY: 0
      }
    }

    /**
     * Recalculate drag / swipe event
     *
     */
    const updateAfterDrag = function updateAfterDrag () {
      const movementX = drag.endX - drag.startX
      const movementY = drag.endY - drag.startY
      const movementXDistance = Math.abs(movementX)
      const movementYDistance = Math.abs(movementY)

      if (movementX > 0 && movementXDistance > config.threshold && currentIndex > 0) {
        prev()
      } else if (movementX < 0 && movementXDistance > config.threshold && currentIndex !== elementsLength - 1) {
        next()
      } else if (movementY < 0 && movementYDistance > config.threshold && config.swipeClose) {
        close()
      } else {
        updateOffset()
      }
    }

    /**
     * Click event handler
     *
     */
    const clickHandler = function clickHandler (event) {
      if (event.target === prevButton) {
        prev()
      } else if (event.target === nextButton) {
        next()
      } else if (event.target === closeButton || (event.target.className === 'tobi__slider__slide' && config.docClose)) {
        close()
      }

      event.stopPropagation()
    }

    /**
     * Keydown event handler
     *
     */
    const keydownHandler = function keydownHandler (event) {
      if (event.keyCode === 9) {
        // `TAB` Key: Navigate to the next/previous focusable element
        if (event.shiftKey) {
          // Step backwards in the tab-order
          if (document.activeElement === firstFocusableEl) {
            lastFocusableEl.focus()
            event.preventDefault()
          }
        } else {
          // Step forward in the tab-order
          if (document.activeElement === lastFocusableEl) {
            firstFocusableEl.focus()
            event.preventDefault()
          }
        }
      } else if (event.keyCode === 27) {
        // `ESC` Key: Close the lightbox
        event.preventDefault()
        close()
      } else if (event.keyCode === 37) {
        // `PREV` Key: Navigate to the previous slide
        event.preventDefault()
        prev()
      } else if (event.keyCode === 39) {
        // `NEXT` Key: Navigate to the next slide
        event.preventDefault()
        next()
      }
    }

    /**
     * Touchstart event handler
     *
     */
    const touchstartHandler = function touchstartHandler (event) {
      // Prevent dragging / swiping on textareas inputs and selects
      if (isIgnoreElement(event.target)) {
        return
      }

      event.stopPropagation()

      pointerDown = true

      drag.startX = event.touches[0].pageX
      drag.startY = event.touches[0].pageY

      slider.classList.add('tobi__slider--is-dragging')
    }

    /**
     * Touchmove event handler
     *
     */
    const touchmoveHandler = function touchmoveHandler (event) {
      event.stopPropagation()

      if (pointerDown) {
        event.preventDefault()

        drag.endX = event.touches[0].pageX
        drag.endY = event.touches[0].pageY

        if (!touchmoveTicking) {
          touchmoveTicking = true

          browserWindow.requestAnimationFrame(() => {
            doSwipe()
            touchmoveTicking = false
          })
        }
      }
    }

    /**
     * Touchend event handler
     *
     */
    const touchendHandler = function touchendHandler (event) {
      event.stopPropagation()

      pointerDown = false

      slider.classList.remove('tobi__slider--is-dragging')

      if (drag.endX) {
        isDraggingX = false
        isDraggingY = false

        updateAfterDrag()
      }

      clearDrag()
    }

    /**
     * Mousedown event handler
     *
     */
    const mousedownHandler = function mousedownHandler (event) {
      // Prevent dragging / swiping on textareas inputs and selects
      if (isIgnoreElement(event.target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      pointerDown = true

      drag.startX = event.pageX
      drag.startY = event.pageY

      slider.classList.add('tobi__slider--is-dragging')
    }

    /**
     * Mousemove event handler
     *
     */
    const mousemoveHandler = function mousemoveHandler (event) {
      event.preventDefault()

      if (pointerDown) {
        drag.endX = event.pageX
        drag.endY = event.pageY

        if (!mousemoveTicking) {
          mousemoveTicking = true

          browserWindow.requestAnimationFrame(() => {
            doSwipe()
            mousemoveTicking = false
          })
        }
      }
    }

    /**
     * Mouseup event handler
     *
     */
    const mouseupHandler = function mouseupHandler (event) {
      event.stopPropagation()

      pointerDown = false

      slider.classList.remove('tobi__slider--is-dragging')

      if (drag.endX) {
        isDraggingX = false
        isDraggingY = false

        updateAfterDrag()
      }

      clearDrag()
    }

    /**
     * Decide whether to do horizontal of vertical swipe
     *
     */
    var doSwipe = function doSwipe () {
      if (Math.abs(drag.startX - drag.endX) > 0 && !isDraggingY && config.swipeClose) {
        // Horizontal swipe
        slider.style[transformProperty] = `translate3d(${offsetTmp - Math.round(drag.startX - drag.endX)}px, 0, 0)`

        isDraggingX = true
        isDraggingY = false
      } else if (Math.abs(drag.startY - drag.endY) > 0 && !isDraggingX) {
        // Vertical swipe
        slider.style[transformProperty] = `translate3d(${offsetTmp}px, -${Math.round(drag.startY - drag.endY)}px, 0)`

        isDraggingX = false
        isDraggingY = true
      }
    }

    /**
     * Bind events
     *
     */
    var bindEvents = function bindEvents () {
      if (config.keyboard) {
        document.addEventListener('keydown', keydownHandler)
      }

      // Click event
      lightbox.addEventListener('click', clickHandler)

      if (config.draggable) {
        if (isTouchDevice()) {
          // Touch events
          lightbox.addEventListener('touchstart', touchstartHandler)
          lightbox.addEventListener('touchmove', touchmoveHandler)
          lightbox.addEventListener('touchend', touchendHandler)
        }

        // Mouse events
        lightbox.addEventListener('mousedown', mousedownHandler)
        lightbox.addEventListener('mouseup', mouseupHandler)
        lightbox.addEventListener('mousemove', mousemoveHandler)
      }
    }

    /**
     * Unbind events
     *
     */
    var unbindEvents = function unbindEvents () {
      if (config.keyboard) {
        document.removeEventListener('keydown', keydownHandler)
      }

      // Click event
      lightbox.removeEventListener('click', clickHandler)

      if (config.draggable) {
        if (isTouchDevice()) {
          // Touch events
          lightbox.addEventListener('touchstart', touchstartHandler)
          lightbox.addEventListener('touchmove', touchmoveHandler)
          lightbox.addEventListener('touchend', touchendHandler)
        }
        // Touch events
        lightbox.removeEventListener('touchstart', touchstartHandler)
        lightbox.removeEventListener('touchmove', touchmoveHandler)
        lightbox.removeEventListener('touchend', touchendHandler)

        // Mouse events
        lightbox.removeEventListener('mousedown', mousedownHandler)
        lightbox.removeEventListener('mouseup', mouseupHandler)
        lightbox.removeEventListener('mousemove', mousemoveHandler)
      }
    }

    /**
     * Checks whether element has requested data-type value
     *
     */
    var checkType = function checkType (el, type) {
      return el.getAttribute('data-type') === type
    }

    /**
     * Remove all `src` attributes
     *
     * @param {HTMLElement} el - Element to remove all `src` attributes
     */
    var removeSources = function setVideoSources (el) {
      const sources = el.querySelectorAll('src')

      if (sources) {
        Array.prototype.forEach.call(sources, source => {
          source.setAttribute('src', '')
        })
      }
    }

    /**
     * Update Config
     *
     */
    var recheckConfig = function recheckConfig () {
      if (config.draggable && elementsLength > 1 && !slider.classList.contains('tobi__slider--is-draggable')) {
        slider.classList.add('tobi__slider--is-draggable')
      }

      // Hide buttons if necessary
      if (!config.nav || elementsLength === 1 || (config.nav === 'auto' && isTouchDevice())) {
        prevButton.setAttribute('aria-hidden', 'true')
        nextButton.setAttribute('aria-hidden', 'true')
      } else {
        prevButton.setAttribute('aria-hidden', 'false')
        nextButton.setAttribute('aria-hidden', 'false')
      }

      // Hide counter if necessary
      if (!config.counter || elementsLength === 1) {
        counter.setAttribute('aria-hidden', 'true')
      } else {
        counter.setAttribute('aria-hidden', 'false')
      }
    }

    /**
     * Update lightbox
     *
     * @param {string} dir - Current slide direction
     */
    var updateLightbox = function updateLightbox (dir) {
      updateOffset()
      updateCounter()
      updateFocus(dir)
    }

    /**
     * Reset the lightbox
     *
     * @param {function} callback - Optional callback to call after reset
     */
    const reset = function reset (callback) {
      if (slider) {
        while (slider.firstChild) {
          slider.removeChild(slider.firstChild)
        }
      }

      gallery.length = sliderElements.length = elementsLength = figcaptionId = x = 0

      if (callback) {
        callback.call(this)
      }
    }

    /**
     * Check if the lightbox is open
     *
     */
    var isOpen = function isOpen () {
      return lightbox.getAttribute('aria-hidden') === 'false'
    }

    /**
     * Detect whether device is touch capable
     *
     */
    var isTouchDevice = function isTouchDevice () {
      return 'ontouchstart' in window
    }

    /**
     * Checks whether element's nodeName is part of array
     *
     */
    var isIgnoreElement = function isIgnoreElement (el) {
      return ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'].includes(el.nodeName) || el === prevButton || el === nextButton || el === closeButton || elementsLength === 1
    }

    /**
     * Return current index
     *
     */
    const currentSlide = function currentSlide () {
      return currentIndex
    }

    init(userOptions)

    return {
      open,
      prev,
      next,
      close,
      add: checkDependencies,
      reset,
      isOpen,
      currentSlide
    }
  }

  return Tobi
}))
