// DOM Elements
const hamburger = document.getElementById("hamburger")
const navMenu = document.getElementById("nav-menu")
const navbar = document.getElementById("navbar")
const contactForm = document.getElementById("contact-form")

// Mobile Navigation Toggle
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active")
  navMenu.classList.toggle("active")
})

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-link").forEach((n) =>
  n.addEventListener("click", () => {
    hamburger.classList.remove("active")
    navMenu.classList.remove("active")
  }),
)

// Navbar scroll effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    navbar.classList.add("scrolled")
  } else {
    navbar.classList.remove("scrolled")
  }
})

// Active navigation link
const sections = document.querySelectorAll("section")
const navLinks = document.querySelectorAll(".nav-link")

window.addEventListener("scroll", () => {
  let current = ""
  sections.forEach((section) => {
    const sectionTop = section.offsetTop
    const sectionHeight = section.clientHeight
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id")
    }
  })

  navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href").substring(1) === current) {
      link.classList.add("active")
    }
  })
})

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Animated counters for stats
const animateCounters = () => {
  const counters = document.querySelectorAll(".stat-number")

  counters.forEach((counter) => {
    const target = Number.parseInt(counter.getAttribute("data-target"))
    const increment = target / 100
    let current = 0

    const updateCounter = () => {
      if (current < target) {
        current += increment
        counter.textContent = Math.ceil(current)
        setTimeout(updateCounter, 20)
      } else {
        counter.textContent = target
      }
    }

    updateCounter()
  })
}

// Animate skill bars
const animateSkillBars = () => {
  const skillBars = document.querySelectorAll(".skill-progress")

  skillBars.forEach((bar) => {
    const width = bar.getAttribute("data-width")
    bar.style.width = width + "%"
  })
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.3,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains("about")) {
        animateCounters()
      }
      if (entry.target.classList.contains("skills")) {
        animateSkillBars()
      }

      // Add fade-in animation
      entry.target.style.opacity = "1"
      entry.target.style.transform = "translateY(0)"
    }
  })
}, observerOptions)

// Observe sections for animations
sections.forEach((section) => {
  section.style.opacity = "0"
  section.style.transform = "translateY(50px)"
  section.style.transition = "opacity 0.8s ease, transform 0.8s ease"
  observer.observe(section)
})

// Contact form handling
contactForm.addEventListener("submit", (e) => {
  e.preventDefault()

  // Get form data
  const formData = new FormData(contactForm)
  const name = formData.get("name")
  const email = formData.get("email")
  const subject = formData.get("subject")
  const message = formData.get("message")

  // Simple validation
  if (!name || !email || !subject || !message) {
    showNotification("Please fill in all fields", "error")
    return
  }

  if (!isValidEmail(email)) {
    showNotification("Please enter a valid email address", "error")
    return
  }

  // Simulate form submission
  showNotification("Message sent successfully! I'll get back to you soon.", "success")
  contactForm.reset()
})

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Notification system
const showNotification = (message, type) => {
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message

  // Style the notification
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        ${type === "success" ? "background: linear-gradient(135deg, #00ff88, #00cc66);" : "background: linear-gradient(135deg, #ff4444, #cc0000);"}
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(400px)"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 5000)
}

// Parallax effect for hero section
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset
  const parallaxElements = document.querySelectorAll(".floating-particles")

  parallaxElements.forEach((element) => {
    const speed = 0.5
    element.style.transform = `translateY(${scrolled * speed}px)`
  })
})

// Add typing effect to hero title
const typeWriter = (element, text, speed = 100) => {
  let i = 0
  element.innerHTML = ""

  const type = () => {
    if (i < text.length) {
      element.innerHTML += text.charAt(i)
      i++
      setTimeout(type, speed)
    }
  }

  type()
}

// Initialize typing effect when page loads
window.addEventListener("load", () => {
  const heroTitle = document.querySelector(".hero-title")
  if (heroTitle) {
    const titleLines = heroTitle.querySelectorAll(".title-line")
    titleLines.forEach((line, index) => {
      const originalText = line.textContent
      setTimeout(() => {
        typeWriter(line, originalText, 150)
      }, index * 1000)
    })
  }
})

// Add mouse movement effect to hero section
document.addEventListener("mousemove", (e) => {
  const hero = document.querySelector(".hero")
  if (!hero) return

  const rect = hero.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const deltaX = (x - centerX) / centerX
  const deltaY = (y - centerY) / centerY

  const hologram = document.querySelector(".hologram-container")
  if (hologram) {
    hologram.style.transform = `translate(${deltaX * 10}px, ${deltaY * 10}px)`
  }
})

// Add glitch effect to title on hover
const addGlitchEffect = () => {
  const title = document.querySelector(".hero-title")
  if (!title) return

  title.addEventListener("mouseenter", () => {
    title.style.animation = "glitch 0.3s ease-in-out"
  })

  title.addEventListener("animationend", () => {
    title.style.animation = ""
  })
}

// Add glitch keyframes
const style = document.createElement("style")
style.textContent = `
    @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
    }
`
document.head.appendChild(style)

// Initialize glitch effect
addGlitchEffect()

// Add loading animation
window.addEventListener("load", () => {
  document.body.classList.add("loaded")
})

// Performance optimization: Throttle scroll events
const throttle = (func, limit) => {
  let inThrottle
  return function () {
    const args = arguments
    
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Apply throttling to scroll events
window.addEventListener(
  "scroll",
  throttle(() => {
    // Scroll-based animations here
  }, 16),
) // ~60fps
