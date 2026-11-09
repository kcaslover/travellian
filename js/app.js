const detailsBtn = document.querySelectorAll('.btn--details')
const tripBtn = document.querySelector('.trip__btn')
const overlay = document.querySelector('.overlay')
const closeBtn = document.querySelector('.closeBtn')
const body = document.querySelector('body')


function openModal() {
  overlay.style.display = 'flex'
  body.classList.add('modal-open')
}

function closeModal() {
  overlay.style.display = 'none'
  body.classList.remove('modal-open')
}

detailsBtn.forEach(btn => {
  btn.addEventListener('click', openModal)
})

tripBtn.addEventListener('click', openModal)


closeBtn.addEventListener('click', closeModal)


// slider

const sliders = document.querySelectorAll('.slider')

sliders.forEach((s) => {
  const nextBtn = s.querySelector('.slider-btn--next')
  const prevBtn = s.querySelector('.slider-btn--prev')
  const track = s.querySelector('.slider-track')
  const cards = s.querySelectorAll('.slider-card')

  let currentIndex = 0

  function getStep() {
    const cardWidth = cards[0].getBoundingClientRect().width
    const gap = parseFloat(getComputedStyle(track).gap)

    return cardWidth + gap
  }

  function getMaxOffset() {
    return Math.max(0, track.scrollWidth - s.clientWidth)
  }

  function getMaxIndex() {
    return Math.ceil(getMaxOffset() / getStep())
  }

  console.log(getMaxIndex())

  function updateSlider() {
    const maxOffset = getMaxOffset()
    const offset = Math.min(currentIndex * getStep(), maxOffset)

    track.style.transform = `translateX(-${offset}px)`

    nextBtn.disabled = currentIndex === getMaxIndex()
    prevBtn.disabled = currentIndex <= 0
  }

  nextBtn.addEventListener('click', () => {
    if (currentIndex < getMaxIndex()) {
      currentIndex++
      updateSlider()
    }
  })

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--
      updateSlider()
    }
  })

  window.addEventListener('resize', () => {
    currentIndex = Math.min(currentIndex, getMaxIndex())
    updateSlider()
  })

  updateSlider()
})


// checkin

const checkin = document.querySelector('#checkin')
const checkout = document.querySelector('#checkout')


const date = new Date()
const formattedDate = date.toISOString().split('T')[0];

const checkoutDate = new Date(date);
checkoutDate.setMonth(checkoutDate.getMonth() + 1);

const formattedCheckout = checkoutDate.toISOString().split('T')[0];


checkin.setAttribute('value', formattedDate)
checkout.setAttribute('value', formattedCheckout )



