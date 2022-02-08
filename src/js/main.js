const splashContainer = document.querySelector('.container')

// Show splash screen until cliq loads
window.addEventListener('load', () => {
  splashContainer.style.display = 'none'
})

// Load Zoho Cliq
window.location.href = 'https://cliq.zoho.com/index.do'
