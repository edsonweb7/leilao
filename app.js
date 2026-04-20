// ===== AvaliaAI — Premium Landing Page Logic =====

// --- State ---
const state = {
    photos: {
        fachada: null,
        sala: null,
        cozinha: null,
        quarto: null,
        banheiro: null,
        extras: null
    },
    map: null,
    securityData: null,
    get photoCount() {
        return Object.values(this.photos).filter(Boolean).length;
    }
};

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCreciField();
    initInputAnimations();
    // Aguarda Leaflet carregar antes de inicializar o mapa
    if (typeof L !== 'undefined') {
        initSecurityMap();
    } else {
        const leafletScript = document.querySelector('script[src*="leaflet"]');
        if (leafletScript) {
            leafletScript.addEventListener('load', initSecurityMap);
        }
    }
    initIntersectionObserver();
    createToastElement();
});

// ===== PARTICLES BACKGROUND =====
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.05,
            gold: Math.random() > 0.6 // some particles are gold
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            if (p.gold) {
                ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity})`;
            } else {
                ctx.fillStyle = `rgba(245, 240, 232, ${p.opacity * 0.5})`;
            }
            ctx.fill();
        });

        // Draw subtle connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(201, 168, 76, ${0.03 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// ===== CRECI FIELD =====
function initCreciField() {
    const input = document.getElementById('input-creci');
    const container = document.getElementById('creci-input-container');
    const checkIcon = document.getElementById('creci-check');

    if (!input) return;

    input.addEventListener('input', () => {
        const val = input.value.replace(/\D/g, '');
        if (val.length >= 5) {
            checkIcon.style.display = 'flex';
            container.classList.add('validated');
        } else {
            checkIcon.style.display = 'none';
            container.classList.remove('validated');
        }
    });

    input.addEventListener('focus', () => {
        container.style.transform = 'scale(1.005)';
    });

    input.addEventListener('blur', () => {
        container.style.transform = 'scale(1)';
    });
}

// ===== INPUT ANIMATIONS =====
function initInputAnimations() {
    const inputs = document.querySelectorAll('.data-input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const card = input.closest('.data-card');
            if (card) card.style.transform = 'scale(1.01)';
        });
        input.addEventListener('blur', () => {
            const card = input.closest('.data-card');
            if (card) card.style.transform = 'scale(1)';
        });
    });
}

// ===== SECURITY MAP =====
function initSecurityMap() {
    const mapEl = document.getElementById('security-map');
    const loadingEl = document.getElementById('map-loading');

    if (!mapEl || typeof L === 'undefined') {
        console.warn('Leaflet not loaded or map element not found');
        return;
    }

    // Default: São Paulo centro
    const defaultLat = -23.5505;
    const defaultLng = -46.6333;

    const map = L.map('security-map', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
    });

    // Dark map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    state.map = map;

    // Simulated security zones
    const securityZones = [
        {
            center: [-23.545, -46.635],
            radius: 800,
            level: 'baixo',
            color: '#2ECC71',
            fillColor: '#2ECC71',
            ocorrencias: 12,
            label: 'Risco Baixo'
        },
        {
            center: [-23.553, -46.640],
            radius: 600,
            level: 'moderado',
            color: '#F1C40F',
            fillColor: '#F1C40F',
            ocorrencias: 34,
            label: 'Risco Moderado'
        },
        {
            center: [-23.558, -46.625],
            radius: 700,
            level: 'elevado',
            color: '#E67E22',
            fillColor: '#E67E22',
            ocorrencias: 58,
            label: 'Risco Elevado'
        },
        {
            center: [-23.548, -46.650],
            radius: 500,
            level: 'alto',
            color: '#E74C3C',
            fillColor: '#E74C3C',
            ocorrencias: 89,
            label: 'Risco Alto'
        },
        {
            center: [-23.540, -46.620],
            radius: 900,
            level: 'baixo',
            color: '#2ECC71',
            fillColor: '#2ECC71',
            ocorrencias: 8,
            label: 'Risco Baixo'
        },
        {
            center: [-23.560, -46.645],
            radius: 650,
            level: 'moderado',
            color: '#F1C40F',
            fillColor: '#F1C40F',
            ocorrencias: 41,
            label: 'Risco Moderado'
        },
        {
            center: [-23.543, -46.642],
            radius: 550,
            level: 'elevado',
            color: '#E67E22',
            fillColor: '#E67E22',
            ocorrencias: 63,
            label: 'Risco Elevado'
        }
    ];

    // Add zones with delay for visual effect
    setTimeout(() => {
        loadingEl.classList.add('hidden');

        securityZones.forEach((zone, i) => {
            setTimeout(() => {
                const circle = L.circle(zone.center, {
                    radius: zone.radius,
                    color: zone.color,
                    fillColor: zone.fillColor,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    opacity: 0.6
                }).addTo(map);

                circle.bindPopup(`
                    <div style="font-family:'IBM Plex Mono',monospace;padding:4px 0;min-width:160px;">
                        <div style="font-weight:700;font-size:12px;margin-bottom:6px;color:${zone.color};">${zone.label}</div>
                        <div style="font-size:11px;color:rgba(245,240,232,0.7);margin-bottom:3px;">
                            Ocorrências/mês: <strong style="color:#F5F0E8">${zone.ocorrencias}</strong>
                        </div>
                        <div style="font-size:10px;color:rgba(245,240,232,0.5);margin-top:8px;padding-top:6px;border-top:1px solid rgba(201,168,76,0.15);">
                            Impacto estimado no valor do imóvel
                        </div>
                        <div style="font-size:13px;font-weight:700;color:${zone.ocorrencias > 50 ? '#E74C3C' : zone.ocorrencias > 25 ? '#F1C40F' : '#2ECC71'};">
                            ${zone.ocorrencias > 50 ? '−8% a −15%' : zone.ocorrencias > 25 ? '−3% a −7%' : '0% a −2%'}
                        </div>
                    </div>
                `);

                // Add incident markers (small dots)
                const numMarkers = Math.min(zone.ocorrencias, 15);
                for (let m = 0; m < numMarkers; m++) {
                    const angle = (m / numMarkers) * Math.PI * 2 + Math.random() * 0.5;
                    const r = Math.random() * zone.radius * 0.8;
                    const lat = zone.center[0] + (r / 111320) * Math.cos(angle);
                    const lng = zone.center[1] + (r / (111320 * Math.cos(zone.center[0] * Math.PI / 180))) * Math.sin(angle);

                    L.circleMarker([lat, lng], {
                        radius: 2.5,
                        color: zone.color,
                        fillColor: zone.color,
                        fillOpacity: 0.7,
                        weight: 0
                    }).addTo(map);
                }

            }, i * 200);
        });

        // Update security stats
        updateSecurityStats(securityZones);

    }, 1500);

    // Address input geocoding integration
    const addressInput = document.getElementById('input-endereco');
    if (addressInput) {
        let debounceTimer;
        addressInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const address = addressInput.value.trim();
                if (address.length > 5) {
                    geocodeAndCenter(address);
                }
            }, 1000);
        });
    }
}

function geocodeAndCenter(address) {
    // Using Nominatim for geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Brasil')}&limit=1`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                if (state.map) {
                    state.map.setView([lat, lon], 14, { animate: true, duration: 1.5 });

                    // Add a marker for the property
                    const goldIcon = L.divIcon({
                        className: 'property-marker',
                        html: `<div style="
                            width: 20px; height: 20px;
                            background: linear-gradient(135deg, #E8D48B, #C9A84C);
                            border-radius: 50%;
                            border: 2px solid #080806;
                            box-shadow: 0 0 20px rgba(201,168,76,0.4);
                            animation: markerPulse 1.5s ease-in-out infinite;
                        "></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });

                    L.marker([lat, lon], { icon: goldIcon })
                        .addTo(state.map)
                        .bindPopup(`
                            <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#F5F0E8;">
                                <strong style="color:#C9A84C;">📍 Imóvel em avaliação</strong><br>
                                <span style="color:rgba(245,240,232,0.6);">${address}</span>
                            </div>
                        `);
                }
            }
        })
        .catch(err => console.log('Geocoding error:', err));
}

function updateSecurityStats(zones) {
    const totalOcorrencias = zones.reduce((sum, z) => sum + z.ocorrencias, 0);
    const avgOcorrencias = Math.round(totalOcorrencias / zones.length);

    const statOcorrencias = document.getElementById('stat-ocorrencias');
    const statIndice = document.getElementById('stat-indice');
    const statImpacto = document.getElementById('stat-impacto');

    // Animate counter
    animateValue(statOcorrencias, 0, avgOcorrencias, 1200);

    // Security index (inverted - higher is better)
    const indice = Math.max(0, 100 - avgOcorrencias);
    setTimeout(() => {
        animateValue(statIndice, 0, indice, 1000, '/100');
    }, 300);

    // Value impact
    setTimeout(() => {
        const impact = avgOcorrencias > 50 ? '-12%' : avgOcorrencias > 25 ? '-5%' : '-1%';
        statImpacto.textContent = impact;
        statImpacto.style.color = avgOcorrencias > 50 ? '#E74C3C' : avgOcorrencias > 25 ? '#F1C40F' : '#2ECC71';
    }, 600);
}

function animateValue(el, start, end, duration, suffix = '') {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(start + (end - start) * eased);
        el.textContent = current + suffix;
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ===== INTERSECTION OBSERVER (reveal animations) =====
function initIntersectionObserver() {
    const sections = document.querySelectorAll('.security-map-section, .photo-section, .cta-section, .site-footer');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// ===== PHOTO HANDLING =====
function handlePhotoClick(card) {
    // File input click is handled automatically via overlay
}

function onPhotoSelected(event, card) {
    const file = event.target.files[0];
    if (!file) return;

    const label = card.dataset.label.toLowerCase();

    const reader = new FileReader();
    reader.onload = (e) => {
        card.classList.add('selected');
        card.style.backgroundImage = `url(${e.target.result})`;
        // Normaliza a chave para combinar com o state.photos
        const keyMap = {
            'fachada': 'fachada',
            'sala': 'sala',
            'cozinha': 'cozinha',
            'quarto': 'quarto',
            'banheiro': 'banheiro',
            'extras': 'extras'
        };
        const key = keyMap[label] || label;
        state.photos[key] = e.target.result;
        updatePhotoCounter();
        updateProgressBar();

        // Haptic feedback animation
        card.style.transform = 'scale(0.92)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);

        showToast(`📸 ${card.dataset.label} capturada!`);
    };
    reader.readAsDataURL(file);
}

function updatePhotoCounter() {
    const counter = document.getElementById('photo-counter');
    counter.textContent = `${state.photoCount}/6`;
    counter.style.transform = 'scale(1.2)';
    setTimeout(() => {
        counter.style.transform = 'scale(1)';
    }, 200);
}

function updateProgressBar() {
    const bar = document.getElementById('photo-progress');
    const pct = (state.photoCount / 6) * 100;
    bar.style.width = `${pct}%`;
}

// ===== TOAST SYSTEM =====
let toastElement;
let toastTimeout;

function createToastElement() {
    toastElement = document.createElement('div');
    toastElement.className = 'toast';
    document.body.appendChild(toastElement);
}

function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastElement.textContent = message;
    toastElement.classList.add('show');
    toastTimeout = setTimeout(() => {
        toastElement.classList.remove('show');
    }, 2500);
}

// ===== GENERATE REPORT =====
function gerarLaudo() {
    const creci = document.getElementById('input-creci').value;
    const endereco = document.getElementById('input-endereco').value;
    const tamanho = document.getElementById('input-tamanho').value;
    const ano = document.getElementById('input-ano').value;
    const btn = document.getElementById('btn-gerar');
    const loader = document.getElementById('btn-loader');

    // Validation chain
    if (!creci || creci.replace(/\D/g, '').length < 5) {
        showToast('⚠️ Insira seu CRECI para continuar');
        shakeElement(document.getElementById('creci-input-container'));
        document.getElementById('input-creci').focus();
        return;
    }

    if (!endereco) {
        showToast('⚠️ Informe o endereço do imóvel');
        shakeElement(document.getElementById('card-endereco'));
        document.getElementById('input-endereco').focus();
        return;
    }

    if (!tamanho) {
        showToast('⚠️ Informe o tamanho do imóvel');
        shakeElement(document.getElementById('card-tamanho'));
        return;
    }

    if (!ano) {
        showToast('⚠️ Informe o ano de construção');
        shakeElement(document.getElementById('card-ano'));
        return;
    }

    if (state.photoCount < 1) {
        showToast('⚠️ Adicione pelo menos 1 foto');
        shakeElement(document.querySelector('.photo-grid'));
        return;
    }

    // Loading state
    btn.disabled = true;
    loader.classList.add('active');

    // Simulate AI processing
    setTimeout(() => {
        loader.classList.remove('active');
        btn.disabled = false;
        showToast('✅ Laudo preliminar gerado com sucesso!');

        btn.style.boxShadow = '0 0 60px rgba(201, 168, 76, 0.5)';
        setTimeout(() => {
            btn.style.boxShadow = '';
        }, 1200);
    }, 3000);
}

// ===== SHAKE ANIMATION =====
function shakeElement(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        el.style.animation = '';
    }, 500);
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 50%, 90% { transform: translateX(-4px); }
        30%, 70% { transform: translateX(4px); }
    }
    @keyframes markerPulse {
        0%, 100% { box-shadow: 0 0 10px rgba(201,168,76,0.3); transform: scale(1); }
        50% { box-shadow: 0 0 25px rgba(201,168,76,0.6); transform: scale(1.1); }
    }
`;
document.head.appendChild(shakeStyle);
