/* ==========================================================================
   SAE AQIQAH (B2C) - MAIN JAVASCRIPT
   Features: Navigation toggle, smooth scrolling, 3D center focus slider, WA booking
   ========================================================================== */

const WA_NUMBER = "6282230611299";
const PRICES_FILE = "./data/prices.json";

document.addEventListener('DOMContentLoaded', () => {
    initializeMobileMenu();
    initializeScrollActiveLink();
    initializeWAFloat();
    initialize3DSlider();
    loadPrices();
});

// 1. Mobile Menu Toggle
function initializeMobileMenu() {
    const mobileNavToggle = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('navMenu');

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navMenu.classList.toggle('active');
            mobileNavToggle.classList.toggle('active');
            mobileNavToggle.setAttribute('aria-expanded', isActive);
            
            const icon = mobileNavToggle.querySelector('i');
            if (icon) {
                icon.className = isActive ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileNavToggle.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', false);
                const icon = mobileNavToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when clicking nav link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', false);
                const icon = mobileNavToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }
}

// 2. Active Link on Scroll & Smooth Scroll
function initializeScrollActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 150; // offset header height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll for nav anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// 3. Initialize WhatsApp Floating Button
function initializeWAFloat() {
    const waFloat = document.getElementById('wa-float-btn');
    if (waFloat) {
        waFloat.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamu'alaikum SAE Aqiqah, saya ingin tanya info paket aqiqah/qurban 🙏")}`;
    }
}

// 4. WhatsApp Order Submission
function buildWAMessage() {
    const nama = document.getElementById("f-nama")?.value.trim() || "";
    const alamat = document.getElementById("f-alamat")?.value.trim() || "";
    const produk = document.getElementById("f-produk")?.value || "";

    let msg = "Assalamu'alaikum SAE Aqiqah 🌙\n\n";
    msg += "Saya ingin menanyakan/memesan paket B2C:\n\n";
    if (nama) msg += "👤 *Nama:* " + nama + "\n";
    if (alamat) msg += "📍 *Alamat:* " + alamat + "\n";
    if (produk) msg += "🛒 *Paket/Produk:* " + produk + "\n";
    msg += "\nMohon konfirmasi dan informasi detail selanjutnya. Terima kasih! 🙏";
    return encodeURIComponent(msg);
}

window.sendWA = function(e) {
    if (e) e.preventDefault();
    const msg = buildWAMessage();
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
};

window.submitOrder = function() {
    const nama = document.getElementById("f-nama")?.value.trim();
    const alamat = document.getElementById("f-alamat")?.value.trim();
    const produk = document.getElementById("f-produk")?.value;

    if (!nama) {
        alert("Mohon isi nama lengkap Anda");
        document.getElementById("f-nama")?.focus();
        return;
    }
    if (!alamat) {
        alert("Mohon isi alamat pengiriman Anda");
        document.getElementById("f-alamat")?.focus();
        return;
    }
    if (!produk) {
        alert("Mohon pilih paket yang ingin dipesan");
        document.getElementById("f-produk")?.focus();
        return;
    }

    const msg = buildWAMessage();
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + msg, "_blank");
};

const B2C_API_URL = "https://script.google.com/macros/s/AKfycby_F05MY802tH3lZ1c3aCpXJCGVd9W0r0IRbMZxhtJZcSzdQLWj2y9pnTbx7cHf_Pk/exec";

// 5. Dynamic Price Loading
function loadPrices() {
    const apiURL = localStorage.getItem('sae_b2c_api_url') || B2C_API_URL;
    
    // 1. Try to load from LocalStorage cache first
    const cachedData = localStorage.getItem('sae_b2c_prices_cache');
    const cachedTime = localStorage.getItem('sae_b2c_prices_timestamp');
    const now = new Date().getTime();
    
    if (cachedData && cachedTime && (now - cachedTime < 5 * 60 * 1000)) { // 5 minutes cache
        console.log("Loading B2C prices from local cache...");
        try {
            const data = JSON.parse(cachedData);
            updateB2CPrices(data);
            return;
        } catch (e) {
            console.warn("Failed to parse cached prices, re-fetching...");
        }
    }
    
    // 2. Fetch from Web App URL if configured, otherwise fallback to local prices.json
    if (apiURL) {
        console.log("Fetching B2C prices from Google Sheets API...");
        fetch(`${apiURL}?sheet=aqiqah_prices`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error && Array.isArray(data)) {
                    localStorage.setItem('sae_b2c_prices_cache', JSON.stringify(data));
                    localStorage.setItem('sae_b2c_prices_timestamp', now.toString());
                    updateB2CPrices(data);
                } else {
                    console.warn("API returned error, using local fallback:", data);
                    loadFallbackPrices();
                }
            })
            .catch(err => {
                console.error("API Fetch error, using local fallback:", err);
                loadFallbackPrices();
            });
    } else {
        console.log("No API URL configured, using local fallback prices...");
        loadFallbackPrices();
    }
}

function loadFallbackPrices() {
    fetch(PRICES_FILE)
        .then(res => res.json())
        .then(data => {
            console.log("Local fallback B2C prices loaded:", data);
            
            // Render Aqiqah packages (A-E)
            if (data.aqiqah && data.aqiqah.packages) {
                data.aqiqah.packages.forEach(pkg => {
                    const baseEl = document.getElementById(`price-${pkg.id}-base`);
                    const nasiEl = document.getElementById(`price-${pkg.id}-nasi`);
                    const descEl = document.getElementById(`desc-${pkg.id}`);
                    if (baseEl) baseEl.textContent = formatRupiah(pkg.basePrice);
                    if (nasiEl) nasiEl.textContent = formatRupiah(pkg.priceWithNasi);
                    if (descEl) descEl.textContent = pkg.description;
                });
            }
            
            // Render Qurban packages (kg-jantan, kg-bundle, db-jantan, db-bundle)
            if (data.qurban) {
                if (data.qurban.kambing) {
                    data.qurban.kambing.forEach(item => {
                        const priceEl = document.getElementById(`price-${item.id}`);
                        const descEl = document.getElementById(`desc-${item.id}`);
                        if (priceEl) priceEl.textContent = formatRupiah(item.price);
                        if (descEl) descEl.textContent = item.variant;
                    });
                }
                if (data.qurban.domba) {
                    data.qurban.domba.forEach(item => {
                        const priceEl = document.getElementById(`price-${item.id}`);
                        const descEl = document.getElementById(`desc-${item.id}`);
                        if (priceEl) priceEl.textContent = formatRupiah(item.price);
                        if (descEl) descEl.textContent = item.variant;
                    });
                }
            }
        })
        .catch(err => console.error("Critical: Failed to load fallback prices:", err));
}

function updateB2CPrices(data) {
    console.log("Updating B2C DOM with fetched prices:", data);
    data.forEach(item => {
        // Handle Aqiqah packages (A-E)
        if (['A', 'B', 'C', 'D', 'E'].includes(item.id)) {
            const baseEl = document.getElementById(`price-${item.id}-base`);
            const nasiEl = document.getElementById(`price-${item.id}-nasi`);
            const descEl = document.getElementById(`desc-${item.id}`);
            if (baseEl && item.basePrice) baseEl.textContent = formatRupiah(parseInt(item.basePrice));
            if (nasiEl && item.priceWithNasi) nasiEl.textContent = formatRupiah(parseInt(item.priceWithNasi));
            if (descEl && item.description) descEl.textContent = item.description;
        } 
        // Handle Qurban packages (kg-jantan, kg-bundle, db-jantan, db-bundle)
        else if (['kg-jantan', 'kg-bundle', 'db-jantan', 'db-bundle'].includes(item.id)) {
            const priceEl = document.getElementById(`price-${item.id}`);
            const descEl = document.getElementById(`desc-${item.id}`);
            if (priceEl && item.price) priceEl.textContent = formatRupiah(parseInt(item.price));
            if (descEl && item.description) descEl.textContent = item.description;
        }
    });
}

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(amount).replace("IDR", "Rp");
}

// 6. Premium 3D Gallery Slider
function initialize3DSlider() {
    const slider = document.getElementById('gallerySlider');
    const prevBtn = document.getElementById('sliderPrevBtn');
    const nextBtn = document.getElementById('sliderNextBtn');
    const indicatorsContainer = document.getElementById('sliderIndicators');
    const progressBar = document.getElementById('sliderProgressBar');

    const stories = [
        { title: "Fasilitas Peternakan SAE Aqiqah", desc: "Menjaga kualitas layanan syar'i terbaik dengan mengelola peternakan mandiri sejak tahun 2003." },
        { title: "Kambing Qurban Pilihan", desc: "Seleksi kambing dan domba qurban sehat, cukup umur, dan dirawat secara intensif." },
        { title: "Menu Sate Kambing Lezat", desc: "Sajian katering bercita rasa tinggi khas bintang lima, dimasak bersih tanpa bau prengus." },
        { title: "Penyembelihan Higienis & Syar'i", desc: "Penyembelihan halal 100% mengikuti fiqih Islam dan dapat disaksikan langsung." },
        { title: "Fasilitas Kandang Bersih", desc: "Kandang modern berukuran 11x30 meter yang terawat demi kenyamanan hewan ternak." }
    ];

    if (slider) {
        const slides = slider.querySelectorAll('.gallery-slide');
        const totalSlides = slides.length;
        let currentIndex = 0;
        let progressInterval;
        let progressElapsed = 0;
        const progressDuration = 4000; // 4 seconds auto slide

        function generateIndicators() {
            if (!indicatorsContainer) return;
            indicatorsContainer.innerHTML = '';
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.classList.add('indicator-dot');
                if (i === currentIndex) dot.classList.add('active');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                indicatorsContainer.appendChild(dot);
            }
        }

        function updateSlider() {
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > totalSlides - 1) currentIndex = totalSlides - 1;

            const containerWidth = slider.parentElement.offsetWidth;
            const slideWidth = slides[0].offsetWidth || 450;
            const gap = 20;

            const amountToMove = (containerWidth - slideWidth) / 2 - currentIndex * (slideWidth + gap);
            slider.style.transform = `translateX(${amountToMove}px)`;

            slides.forEach((slide, index) => {
                slide.classList.remove('active', 'prev-slide', 'next-slide');
                if (index === currentIndex) {
                    slide.classList.add('active');
                } else if (index === currentIndex - 1) {
                    slide.classList.add('prev-slide');
                } else if (index === currentIndex + 1) {
                    slide.classList.add('next-slide');
                }
            });

            // Update details
            const card = document.getElementById('sliderContextCard');
            const cardTitle = document.getElementById('contextCardTitle');
            const cardDesc = document.getElementById('contextCardDesc');

            if (card && cardTitle && cardDesc) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(8px)';
                setTimeout(() => {
                    cardTitle.textContent = stories[currentIndex].title;
                    cardDesc.textContent = stories[currentIndex].desc;
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 200);
            }

            // Update indicators active dot
            if (indicatorsContainer) {
                const dots = indicatorsContainer.querySelectorAll('.indicator-dot');
                dots.forEach((dot, idx) => {
                    if (idx === currentIndex) dot.classList.add('active');
                    else dot.classList.remove('active');
                });
            }
        }

        function goToSlide(index) {
            currentIndex = index;
            updateSlider();
            startProgress();
        }

        function nextSlide() {
            currentIndex = (currentIndex >= totalSlides - 1) ? 0 : currentIndex + 1;
            goToSlide(currentIndex);
        }

        function prevSlide() {
            currentIndex = (currentIndex <= 0) ? totalSlides - 1 : currentIndex - 1;
            goToSlide(currentIndex);
        }

        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        function startProgress() {
            progressElapsed = 0;
            if (progressBar) progressBar.style.width = '0%';
            clearInterval(progressInterval);

            const tick = 30;
            progressInterval = setInterval(() => {
                progressElapsed += tick;
                let percent = (progressElapsed / progressDuration) * 100;
                if (percent > 100) percent = 100;
                if (progressBar) progressBar.style.width = `${percent}%`;

                if (progressElapsed >= progressDuration) {
                    nextSlide();
                }
            }, tick);
        }

        function stopProgress() {
            clearInterval(progressInterval);
        }

        // Pause on Hover
        const wrapper = document.querySelector('.gallery-slider-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', stopProgress);
            wrapper.addEventListener('mouseleave', () => {
                progressInterval = setInterval(() => {
                    progressElapsed += 30;
                    let percent = (progressElapsed / progressDuration) * 100;
                    if (percent > 100) percent = 100;
                    if (progressBar) progressBar.style.width = `${percent}%`;

                    if (progressElapsed >= progressDuration) {
                        nextSlide();
                    }
                }, 30);
            });
        }

        generateIndicators();
        setTimeout(() => {
            updateSlider();
            startProgress();
        }, 150);

        window.addEventListener('resize', updateSlider);
    }
}
