// Inicialização Supabase
const SUPABASE_URL = "https://nxtcetqtnmqpamhfpjdm.supabase.co";
// Mudamos para a anon_key, que é o padrão correto para operações no frontend (login, queries seguras)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dGNldHF0bm1xcGFtaGZwamRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTY1NjAsImV4cCI6MjA5MTkzMjU2MH0.NfJG6_yoeFHbfzIvRodomolI40lgSNUUgBG9YGYYXGA";

// Garantir que a variável global não gere erro de conflito caso o arquivo seja carregado multiplas vezes
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
const supabaseClient = window.supabaseClient;

let currentUser = null;
let currentAuthMode = 'login'; // 'login' ou 'signup'

// Elementos Globais
const grid = document.getElementById('exercisesGrid');
const searchInput = document.getElementById('searchInput');
const stats = document.getElementById('stats');
const modal = document.getElementById('exerciseModal');
const modalContent = modal.querySelector('.modal-content');

// Mapeamento local de imagens de anatomia
const localAnatomyImages = {
    'abductors': 'anatomy/abductors.jpeg',
    'abs': 'anatomy/abs.jpeg',
    'adductors': 'anatomy/adductors.jpeg',
    'biceps': 'anatomy/biceps.jpeg',
    'calves': 'anatomy/calves.jpeg',
    'delts': 'anatomy/delts.jpeg',
    'forearms': 'anatomy/forearms.jpeg',
    'glutes': 'anatomy/glutes.jpeg',
    'hamstrings': 'anatomy/hamstrings.jpeg',
    'lats': 'anatomy/lats.jpeg',
    'levator scapulae': 'anatomy/levator_scapulae.jpeg',
    'pectorals': 'anatomy/pectorals.jpeg',
    'quads': 'anatomy/quads.jpeg',
    'serratus anterior': 'anatomy/serratus_anterior.jpeg',
    'spine': 'anatomy/spine.jpeg',
    'traps': 'anatomy/traps.jpeg',
    'triceps': 'anatomy/triceps.jpeg',
    'upper back': 'anatomy/upper_back.jpeg',
    
    // Fallbacks
    'chest': 'anatomy/pectorals.jpeg',
    'back': 'anatomy/lats.jpeg',
    'upper arms': 'anatomy/biceps.jpeg',
    'lower arms': 'anatomy/forearms.jpeg',
    'upper legs': 'anatomy/quads.jpeg',
    'lower legs': 'anatomy/calves.jpeg',
    'shoulders': 'anatomy/delts.jpeg',
    'waist': 'anatomy/abs.jpeg',
    'neck': 'anatomy/traps.jpeg'
};

// Funções de Tab
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-orange-600', 'text-white');
        btn.classList.add('text-gray-200');
    });
    
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-200');
        activeBtn.classList.add('active', 'bg-orange-600', 'text-white');
    }
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const activeContent = document.getElementById(`content-${tabId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// Dicionário de tradução de músculos para Português
const muscleTranslationPt = {
    'abductors': 'Abdutores',
    'abs': 'Abdômen',
    'adductors': 'Adutores',
    'biceps': 'Bíceps',
    'calves': 'Panturrilhas',
    'cardio': 'Cardio',
    'chest': 'Peito',
    'delts': 'Deltóides (Ombros)',
    'forearms': 'Antebraços',
    'glutes': 'Glúteos',
    'hamstrings': 'Posterior de Coxa',
    'lats': 'Dorsais (Costas)',
    'levator scapulae': 'Elevador da Escápula',
    'lower arms': 'Antebraços',
    'lower legs': 'Panturrilhas',
    'neck': 'Pescoço',
    'pectorals': 'Peitoral',
    'quads': 'Quadríceps',
    'serratus anterior': 'Serrátil Anterior',
    'shoulders': 'Ombros',
    'spine': 'Coluna (Lombar)',
    'traps': 'Trapézio',
    'triceps': 'Tríceps',
    'upper arms': 'Braços',
    'upper back': 'Parte Superior das Costas',
    'upper legs': 'Coxas',
    'waist': 'Cintura/Core',
    'back': 'Costas'
};

function translateMuscle(muscleName) {
    if (!muscleName) return '';
    const cleanName = muscleName.toLowerCase().trim();
    return muscleTranslationPt[cleanName] || muscleName;
}

// Utilitários
function getDisplayName(ex) {
    if (ex.localGif) {
        const filename = ex.localGif.split('/').pop();
        const namePart = filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.'));
        return namePart.replace(/_/g, ' ').toUpperCase();
    }
    return ex.name.toUpperCase();
}

// Modal
function openModal(exId) {
    const ex = exercisesData.find(e => e.exerciseId === exId);
    if (!ex) return;

    const imgSrc = ex.localGif ? ex.localGif : ex.gifUrl;
    document.getElementById('modalTitle').innerText = getDisplayName(ex);
    document.getElementById('modalGif').src = imgSrc;
    
    const bodyPartsStr = ex.bodyParts ? ex.bodyParts.map(m => translateMuscle(m)).join(', ') : 'N/A';
    document.getElementById('modalBodyPartText').innerText = bodyPartsStr;
    
    const anatomyContainer = document.getElementById('modalAnatomyContainer');
    if (!anatomyContainer) {
        // Fallback caso o html antigo ainda esteja lá
        const anatomyImg = document.getElementById('modalBodyPartImg');
        if (anatomyImg) {
            const firstTargetMuscle = ex.targetMuscles && ex.targetMuscles.length > 0 ? ex.targetMuscles[0].toLowerCase().trim() : null;
            if (ex.localAnatomy) {
                anatomyImg.src = ex.localAnatomy;
                anatomyImg.style.display = 'block';
            } else if (firstTargetMuscle && localAnatomyImages[firstTargetMuscle]) {
                anatomyImg.src = localAnatomyImages[firstTargetMuscle];
                anatomyImg.style.display = 'block';
            } else {
                anatomyImg.style.display = 'none';
            }
        }
    } else {
        // Lógica de visualização. Mostraremos as imagens geradas localmente apenas como um "preview em lista"
        anatomyContainer.innerHTML = '';
        const musclesToRender = (ex.targetMuscles && ex.targetMuscles.length > 0) ? ex.targetMuscles : (ex.bodyParts || []);
        let hasImages = false;
        
        // Se houver uma localAnatomy pré-gerada no banco, a gente usa ela.
        if (ex.localAnatomy) {
             const img = document.createElement('img');
             img.src = ex.localAnatomy;
             img.className = 'w-full h-full object-contain relative mix-blend-multiply';
             anatomyContainer.appendChild(img);
             hasImages = true;
        } else {
            // Se não tiver, não fazemos sobreposição para evitar confusão.
            // Apenas exibimos a primeira que encontrar como fallback.
            musclesToRender.forEach((muscle, index) => {
                const cleanMuscle = muscle.toLowerCase().trim();
                if (localAnatomyImages[cleanMuscle] && !hasImages) {
                    hasImages = true;
                    const img = document.createElement('img');
                    img.src = localAnatomyImages[cleanMuscle];
                    img.className = 'w-full h-full object-contain relative mix-blend-multiply';
                    anatomyContainer.appendChild(img);
                }
            });
        }
        
        anatomyContainer.parentElement.style.display = hasImages ? 'flex' : 'none';
    }

    document.getElementById('modalTargetMuscle').innerText = ex.targetMuscles ? ex.targetMuscles.map(m => translateMuscle(m)).join(', ') : 'N/A';
    document.getElementById('modalEquipment').innerText = ex.equipments ? ex.equipments.join(', ') : 'N/A';

    let instructionsHtml = '';
    if (ex.instructions && ex.instructions.length > 0) {
        instructionsHtml = '<ol class="instructions-list space-y-3">';
        ex.instructions.forEach(inst => {
            instructionsHtml += `<li>${inst}</li>`;
        });
        instructionsHtml += '</ol>';
    } else {
        instructionsHtml = '<p class="text-gray-400 italic">Sem instruções disponíveis.</p>';
    }
    document.getElementById('modalInstructions').innerHTML = instructionsHtml;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
        closeModal();
    }
});

// Aba Catálogo - Paginação
let currentPage = 1;
const itemsPerPage = 21; // 21 fica bem alinhado com grid de 3 colunas
let currentFilteredExercises = [];
let dbExercisesLoaded = false;

function renderExercises() {
    grid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const exercisesToShow = currentFilteredExercises.slice(startIndex, endIndex);
    
    exercisesToShow.forEach(ex => {
        const imgSrc = ex.localGif ? ex.localGif : ex.gifUrl;
        const targetMuscles = ex.targetMuscles ? ex.targetMuscles.map(translateMuscle).join(', ') : 'N/A';
        const bodyParts = ex.bodyParts ? ex.bodyParts.map(translateMuscle).join(', ') : 'N/A';
        const displayName = getDisplayName(ex);

        const card = document.createElement('div');
        card.className = 'card bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-800 hover:border-orange-500 transition-colors';
        card.onclick = () => openModal(ex.exerciseId);
        
        card.innerHTML = `
            <div class="h-56 bg-white flex items-center justify-center border-b border-gray-700 p-2 relative group rounded-t-xl">
                <img src="${imgSrc}" alt="${displayName}" class="max-h-full max-w-full object-contain mix-blend-multiply" loading="lazy" onerror="this.src='logo.jpeg'">
                <div class="absolute inset-0 bg-orange-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center rounded-t-xl">
                    <span class="bg-orange-600 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-semibold transform scale-95 group-hover:scale-100 shadow-lg">Ver Detalhes</span>
                </div>
            </div>
            <div class="p-4 flex-grow flex flex-col relative bg-gray-900">
                ${isAdminGlobal ? `
                <div class="absolute top-2 right-2 flex gap-1 z-20">
                    <button onclick="event.stopPropagation(); editExercise('${ex.exerciseId}')" class="p-1.5 bg-gray-800 text-yellow-500 hover:bg-gray-700 rounded-full shadow-sm border border-gray-700" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onclick="event.stopPropagation(); deleteExercise('${ex.exerciseId}')" class="p-1.5 bg-gray-800 text-red-500 hover:bg-gray-700 rounded-full shadow-sm border border-gray-700" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                ` : ''}
                <h2 class="text-lg font-bold text-gray-100 mb-2 line-clamp-2 text-center flex-grow flex items-center justify-center">${displayName}</h2>
            </div>
        `;
        grid.appendChild(card);
    });
    
    renderPaginationControls();
    
    // Atualiza texto de status
    const totalItems = currentFilteredExercises.length;
    if (totalItems === 0) {
        stats.innerText = `Nenhum exercício encontrado`;
    } else {
        stats.innerText = `Mostrando ${startIndex + 1} a ${Math.min(endIndex, totalItems)} de ${totalItems} exercícios`;
    }
}

function renderPaginationControls() {
    const controlsContainer = document.getElementById('paginationControls');
    if (!controlsContainer) return;
    
    controlsContainer.innerHTML = '';
    
    const totalItems = currentFilteredExercises.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return; // Não precisa de paginação
    
    // Botão Anterior
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo; Anterior';
    prevBtn.className = `px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-orange-500 border border-orange-700 hover:bg-orange-900'}`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderExercises(); window.scrollTo({top: 0, behavior: 'smooth'}); } };
    controlsContainer.appendChild(prevBtn);
    
    // Lógica para mostrar apenas algumas páginas próximas para não quebrar o layout
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        const firstPage = document.createElement('button');
        firstPage.textContent = '1';
        firstPage.className = 'px-4 py-2 rounded-lg font-medium bg-gray-900 text-gray-200 border border-gray-700 hover:bg-gray-800 transition-colors hidden sm:block';
        firstPage.onclick = () => { currentPage = 1; renderExercises(); window.scrollTo({top: 0, behavior: 'smooth'}); };
        controlsContainer.appendChild(firstPage);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.innerHTML = '&hellip;';
            ellipsis.className = 'px-2 text-gray-400 hidden sm:block';
            controlsContainer.appendChild(ellipsis);
        }
    }
    
    // Números de Página
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.className = 'px-4 py-2 rounded-lg font-bold bg-orange-600 text-white shadow-md transition-colors';
        } else {
            pageBtn.className = 'px-4 py-2 rounded-lg font-medium bg-gray-900 text-gray-200 border border-gray-700 hover:bg-gray-800 transition-colors hidden sm:block';
        }
        pageBtn.onclick = () => { currentPage = i; renderExercises(); window.scrollTo({top: 0, behavior: 'smooth'}); };
        controlsContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.innerHTML = '&hellip;';
            ellipsis.className = 'px-2 text-gray-400 hidden sm:block';
            controlsContainer.appendChild(ellipsis);
        }
        
        const lastPage = document.createElement('button');
        lastPage.textContent = totalPages;
        lastPage.className = 'px-4 py-2 rounded-lg font-medium bg-gray-900 text-gray-200 border border-gray-700 hover:bg-gray-800 transition-colors hidden sm:block';
        lastPage.onclick = () => { currentPage = totalPages; renderExercises(); window.scrollTo({top: 0, behavior: 'smooth'}); };
        controlsContainer.appendChild(lastPage);
    }
    
    // Botão Próximo
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Próximo &raquo;';
    nextBtn.className = `px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-orange-500 border border-orange-700 hover:bg-orange-900'}`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderExercises(); window.scrollTo({top: 0, behavior: 'smooth'}); } };
    controlsContainer.appendChild(nextBtn);
}

function filterExercises() {
    const query = searchInput.value.toLowerCase();
    
    currentFilteredExercises = exercisesData.filter(ex => {
        const nameMatch = ex.name.toLowerCase().includes(query);
        const localNameMatch = getDisplayName(ex).toLowerCase().includes(query);
        const muscleMatch = ex.targetMuscles && ex.targetMuscles.some(m => m.toLowerCase().includes(query));
        const equipMatch = ex.equipments && ex.equipments.some(e => e.toLowerCase().includes(query));
        const bodyPartMatch = ex.bodyParts && ex.bodyParts.some(b => b.toLowerCase().includes(query));
        
        return nameMatch || localNameMatch || muscleMatch || equipMatch || bodyPartMatch;
    });
    
    currentPage = 1; // Reseta para a primeira página na busca
    renderExercises();
}

searchInput.addEventListener('input', filterExercises);

// Aba Montar Treino
let currentWorkout = [];
let currentSelectedMuscle = null;
let currentMuscleExercises = [];

function initWorkoutTab() {
    showCategoriesView();
    document.getElementById('workoutSearchInput').addEventListener('input', filterCategoryExercises);
}

function showCategoriesView() {
    currentSelectedMuscle = null;
    
    document.getElementById('btnBackToCategories').classList.add('hidden');
    document.getElementById('workoutSearchContainer').classList.add('hidden');
    document.getElementById('workoutSelectionTitle').innerText = 'Categorias Musculares';
    document.getElementById('workoutSearchInput').value = '';
    
    const container = document.getElementById('workoutSelectionContent');
    container.innerHTML = '';
    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar';
    
    // Contar exercícios por músculo alvo principal
    const muscleCounts = {};
    exercisesData.forEach(ex => {
        const mainMuscle = (ex.targetMuscles && ex.targetMuscles.length > 0) ? ex.targetMuscles[0].toLowerCase().trim() : 'outros';
        if (!muscleCounts[mainMuscle]) {
            muscleCounts[mainMuscle] = {
                count: 0,
                img: localAnatomyImages[mainMuscle] || 'logo.jpeg'
            };
        }
        muscleCounts[mainMuscle].count++;
    });
    
    // Renderizar cards de categorias
    Object.keys(muscleCounts).sort().forEach(muscle => {
        const info = muscleCounts[muscle];
        const card = document.createElement('div');
        card.className = 'bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group';
        card.onclick = () => showCategoryExercises(muscle);
        
        card.innerHTML = `
            <div class="w-16 h-16 mb-3 rounded-full bg-orange-900 flex items-center justify-center border border-orange-800 group-hover:bg-orange-800 transition-colors overflow-hidden p-1">
                <img src="${info.img}" alt="${muscle}" class="max-w-full max-h-full object-contain" onerror="this.src='logo.jpeg'">
            </div>
            <h3 class="font-bold text-gray-100 text-center text-sm uppercase">${translateMuscle(muscle)}</h3>
            <span class="text-xs text-gray-400 mt-1 bg-black px-2 py-0.5 rounded-full">${info.count} ex.</span>
        `;
        
        container.appendChild(card);
    });
}

function showCategoryExercises(muscle) {
    currentSelectedMuscle = muscle;
    
    document.getElementById('btnBackToCategories').classList.remove('hidden');
    document.getElementById('workoutSearchContainer').classList.remove('hidden');
    document.getElementById('workoutSelectionTitle').innerText = muscle.toUpperCase();
    
    // Filtrar todos os exercícios que têm esse músculo como alvo
    currentMuscleExercises = exercisesData.filter(ex => {
        return ex.targetMuscles && ex.targetMuscles.some(m => m.toLowerCase().trim() === muscle);
    });
    
    renderCategoryExercisesList(currentMuscleExercises);
}

function filterCategoryExercises() {
    if (!currentSelectedMuscle) return;
    
    const query = document.getElementById('workoutSearchInput').value.toLowerCase();
    
    const filtered = currentMuscleExercises.filter(ex => {
        const nameMatch = ex.name.toLowerCase().includes(query);
        const localNameMatch = getDisplayName(ex).toLowerCase().includes(query);
        const equipMatch = ex.equipments && ex.equipments.some(e => e.toLowerCase().includes(query));
        
        return nameMatch || localNameMatch || equipMatch;
    });
    
    renderCategoryExercisesList(filtered);
}

function renderCategoryExercisesList(exercises) {
    const container = document.getElementById('workoutSelectionContent');
    container.innerHTML = '';
    container.className = 'space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'; // Volta pra visual de lista
    
    if (exercises.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Nenhum exercício encontrado nesta categoria com este filtro.</p>';
        return;
    }
    
    exercises.forEach(ex => {
        const name = getDisplayName(ex);
        const isAdded = currentWorkout.some(w => w.exerciseId === ex.exerciseId);
        
        const item = document.createElement('div');
        item.className = 'workout-item flex justify-between items-center p-3 border border-gray-700 rounded-lg bg-gray-900 shadow-sm hover:border-blue-300';
        
        const btnClass = isAdded ? 'bg-red-900 text-white border border-red-700 hover:bg-red-800' : 'bg-orange-600 text-white border border-orange-500 hover:bg-orange-500';
        const btnText = isAdded ? 'Remover' : 'Adicionar';
        const btnAction = isAdded ? `removeFromWorkout('${ex.exerciseId}')` : `addToWorkout('${ex.exerciseId}')`;
        
        item.innerHTML = `
            <div class="flex items-center gap-3 cursor-pointer flex-grow" onclick="openModal('${ex.exerciseId}')">
                <div class="bg-white p-1 rounded-md border border-gray-700 flex-shrink-0"><img src="${ex.localGif || ex.gifUrl}" class="w-12 h-12 object-contain mix-blend-multiply"></div>
                <div>
                    <p class="font-bold text-gray-100 text-sm sm:text-base leading-tight">${name}</p>
                    <div class="flex gap-2 mt-1">
                        <span class="text-xs text-gray-400 bg-black px-1.5 rounded">${ex.equipments ? ex.equipments[0] : 'Body weight'}</span>
                    </div>
                </div>
            </div>
            <button onclick="${btnAction}" class="ml-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${btnClass} whitespace-nowrap">
                ${btnText}
            </button>
        `;
        container.appendChild(item);
    });
}

function addToWorkout(id) {
    const ex = exercisesData.find(e => e.exerciseId === id);
    if (ex && !currentWorkout.some(w => w.exerciseId === id)) {
        currentWorkout.push({ 
            ...ex, 
            blocks: [
                {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    sets: 3,
                    reps: '10',
                    setType: 'Série de Trabalho',
                    restTime: '60s'
                }
            ],
            notes: '' // Observações gerais do exercício
        });
        updateWorkoutUI();
    }
}

function removeFromWorkout(id) {
    currentWorkout = currentWorkout.filter(w => w.exerciseId !== id);
    updateWorkoutUI();
}

function addBlockToExercise(exerciseId) {
    const ex = currentWorkout.find(w => w.exerciseId === exerciseId);
    if (ex) {
        ex.blocks.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            sets: 1,
            reps: '8-12',
            setType: 'Back Off Set',
            restTime: '60s'
        });
        updateWorkoutUI();
    }
}

function removeBlockFromExercise(exerciseId, blockId) {
    const ex = currentWorkout.find(w => w.exerciseId === exerciseId);
    if (ex) {
        ex.blocks = ex.blocks.filter(b => b.id !== blockId);
        // Se remover todos os blocos, remove o exercício
        if (ex.blocks.length === 0) {
            removeFromWorkout(exerciseId);
        } else {
            updateWorkoutUI();
        }
    }
}

function updateBlock(exerciseId, blockId, field, value) {
    const ex = currentWorkout.find(w => w.exerciseId === exerciseId);
    if (ex) {
        const block = ex.blocks.find(b => b.id === blockId);
        if (block) {
            block[field] = field === 'sets' ? (parseInt(value) || 1) : value;
        }
    }
}

function updateNotes(id, value) {
    const item = currentWorkout.find(w => w.exerciseId === id);
    if (item) item.notes = value;
}

function clearWorkout() {
    if (confirm('Tem certeza que deseja limpar seu treino atual?')) {
        currentWorkout = [];
        updateWorkoutUI();
    }
}

function updateWorkoutUI() {
    document.getElementById('workout-count').innerText = currentWorkout.length;
    const list = document.getElementById('currentWorkoutList');
    const emptyMsg = document.getElementById('emptyWorkoutMsg');
    
    list.innerHTML = '';
    
    if (currentWorkout.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        
        currentWorkout.forEach((ex, index) => {
            const name = getDisplayName(ex);
            const item = document.createElement('div');
            item.className = 'bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-col gap-2';
            
            // Header do Exercício
            let html = `
                <div class="flex justify-between items-start">
                    <div class="flex gap-2 items-center cursor-pointer flex-grow" onclick="openModal('${ex.exerciseId}')">
                        <span class="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">${index + 1}</span>
                        <span class="font-bold text-gray-100 text-sm leading-tight line-clamp-2">${name}</span>
                    </div>
                    <button onclick="removeFromWorkout('${ex.exerciseId}')" class="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2" title="Remover Exercício">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                <div class="space-y-3 mt-2 border-l-2 border-orange-700 pl-3 ml-2">
            `;
            
            // Renderiza os blocos do exercício
            ex.blocks.forEach((block, bIndex) => {
                html += `
                    <div class="flex flex-wrap sm:flex-nowrap items-end gap-2 bg-gray-900 p-2 rounded border border-gray-800 relative group">
                        ${ex.blocks.length > 1 ? `
                        <button onclick="removeBlockFromExercise('${ex.exerciseId}', '${block.id}')" class="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Remover Bloco">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                        ` : ''}
                        
                        <div class="flex flex-col flex-grow sm:w-1/3">
                            <label class="text-[10px] text-gray-400 uppercase font-semibold">Técnica</label>
                            <select onchange="updateBlock('${ex.exerciseId}', '${block.id}', 'setType', this.value)" class="w-full border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500">
                                <option value="Série de Trabalho" ${block.setType === 'Série de Trabalho' ? 'selected' : ''}>Série Trabalho</option>
                                <option value="Top Set" ${block.setType === 'Top Set' ? 'selected' : ''}>Top Set</option>
                                <option value="Back Off Set" ${block.setType === 'Back Off Set' ? 'selected' : ''}>Back Off Set</option>
                                <option value="Drop Set" ${block.setType === 'Drop Set' ? 'selected' : ''}>Drop Set</option>
                                <option value="Feeder Set" ${block.setType === 'Feeder Set' ? 'selected' : ''}>Feeder Set</option>
                                <option value="Aquecimento" ${block.setType === 'Aquecimento' ? 'selected' : ''}>Aquecimento</option>
                                <option value="Rest Pause" ${block.setType === 'Rest Pause' ? 'selected' : ''}>Rest Pause</option>
                                <option value="Falha" ${block.setType === 'Falha' ? 'selected' : ''}>Até a Falha</option>
                            </select>
                        </div>
                        
                        <div class="flex flex-col">
                            <label class="text-[10px] text-gray-400 uppercase font-semibold">Séries x Reps</label>
                            <div class="flex items-center gap-1">
                                <input type="text" value="${block.sets}" onchange="updateBlock('${ex.exerciseId}', '${block.id}', 'sets', this.value)" class="w-8 border border-gray-700 rounded px-1 py-1 text-xs text-center bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500">
                                <span class="text-gray-400 text-xs">x</span>
                                <input type="text" value="${block.reps}" onchange="updateBlock('${ex.exerciseId}', '${block.id}', 'reps', this.value)" class="w-12 border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500">
                            </div>
                        </div>
                        
                        <div class="flex flex-col">
                            <label class="text-[10px] text-gray-400 uppercase font-semibold">Descanso</label>
                            <input type="text" value="${block.restTime || '60s'}" onchange="updateBlock('${ex.exerciseId}', '${block.id}', 'restTime', this.value)" class="w-full border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500">
                        </div>
                    </div>
                `;
            });
            
            html += `
                </div>
                
                <div class="flex justify-between items-center mt-2 pl-2">
                    <button onclick="addBlockToExercise('${ex.exerciseId}')" class="text-xs text-white hover:bg-gray-700 font-semibold flex items-center gap-1 bg-gray-800 border border-gray-600 px-3 py-1.5 rounded transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                        Adicionar Bloco (ex: Back off)
                    </button>
                </div>
                
                <div class="flex flex-col mt-2">
                    <label class="text-[10px] text-gray-400 uppercase font-semibold">Observações Gerais</label>
                    <input type="text" value="${ex.notes || ''}" placeholder="Ex: Focar na excêntrica, 2s pausa..." onchange="updateNotes('${ex.exerciseId}', this.value)" class="w-full border border-gray-700 bg-gray-800 text-white rounded px-2 py-1 text-sm focus:ring-1 focus:ring-orange-500">
                </div>
            `;
            
            item.innerHTML = html;
            list.appendChild(item);
        });
    }
    
    // Atualiza a visualização caso esteja na lista de exercícios de alguma categoria
    if (currentSelectedMuscle) {
        filterCategoryExercises(); 
    }
}

// Fichas de Treino Salvas
let savedWorkouts = [];
let weightHistory = {};

async function saveWorkout() {
    if (!currentUser) {
        alert("Você precisa estar logado para salvar treinos!");
        return;
    }

    if (currentWorkout.length === 0) {
        alert("Seu treino está vazio! Adicione exercícios antes de salvar.");
        return;
    }
    
    const nameInput = document.getElementById('workoutName');
    const workoutName = nameInput.value.trim() || `Meu Treino - ${new Date().toLocaleDateString()}`;
    
    // Determina o dono da ficha (Pode ser o admin mesmo, ou um aluno selecionado)
    let targetUserId = currentUser.id;
    if (isAdminGlobal) {
        const studentSelect = document.getElementById('adminStudentSelect');
        if (studentSelect && studentSelect.value !== 'me') {
            targetUserId = studentSelect.value;
        }
    }
    
    const btn = document.querySelector('button[onclick="saveWorkout()"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Salvando na Nuvem...';
    
    try {
        const client = supabaseClient;
        
        // 1. Criar a Planilha de Treino (workout_sheets)
        const { data: sheetData, error: sheetError } = await client
            .from('workout_sheets')
            .insert([{
                user_id: targetUserId, // O ID do aluno que vai receber a ficha (ou o próprio admin)
                created_by: currentUser.id, // O Admin que criou a ficha
                name: workoutName,
                is_active: true
            }])
            .select()
            .single();
            
        if (sheetError) throw sheetError;
        
        // 2. Criar um Dia de Treino Padrão (workout_days)
        const { data: dayData, error: dayError } = await supabaseClient
            .from('workout_days')
            .insert([{
                sheet_id: sheetData.id,
                name: 'Dia 1',
                day_order: 1
            }])
            .select()
            .single();
            
        if (dayError) throw dayError;
        
        // 3. Buscar os IDs numéricos corretos da tabela exercises
        // Como o currentWorkout tem exerciseId (string '123ABCD'), precisamos do id (integer)
        const currentExerciseIdsStr = currentWorkout.map(w => w.exerciseId);
        const { data: dbExercises, error: exError } = await supabaseClient
            .from('exercises')
            .select('id, exercise_id')
            .in('exercise_id', currentExerciseIdsStr);
            
        if (exError) throw exError;
        
        // 4. Inserir os exercícios na tabela workout_day_exercises
        const dayExercisesToInsert = [];
        currentWorkout.forEach((ex, index) => {
            const dbEx = dbExercises.find(e => e.exercise_id === ex.exerciseId);
            if (!dbEx) return; // Ignora se não achar no DB
            
            // Para simplificar, vamos salvar a estrutura complexa de blocks no campo "notes"
            // como JSON, já que a tabela workout_day_exercises tem campos simples para sets/reps
            const blocksJson = JSON.stringify(ex.blocks || []);
            
            dayExercisesToInsert.push({
                day_id: dayData.id,
                exercise_id: dbEx.id,
                sets: ex.blocks ? ex.blocks.length : 1, // Total de blocos
                reps: 'Vários', // Como tem múltiplos blocos, indicamos vários
                rest_seconds: 60,
                notes: `[BLOCKS_DATA]:${blocksJson}\n[USER_NOTES]:${ex.notes || ''}`,
                exercise_order: index + 1
            });
        });
        
        if (dayExercisesToInsert.length > 0) {
            const { error: dayExError } = await supabaseClient
                .from('workout_day_exercises')
                .insert(dayExercisesToInsert);
                
            if (dayExError) throw dayExError;
        }
        
        alert(`Ficha "${workoutName}" salva com sucesso na nuvem!`);
        
        // Limpa estado
        currentWorkout = [];
        nameInput.value = '';
        updateWorkoutUI();
        
        // Atualiza as fichas na tela
        await fetchSavedWorkouts();
        switchTab('saved');
        
    } catch (err) {
        console.error("Erro ao salvar treino:", err);
        alert("Erro ao salvar treino: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function fetchSavedWorkouts() {
    if (!currentUser) return;
    
    let targetUserId = currentUser.id;
    let queryAll = false;
    
    if (isAdminGlobal) {
        const filterSelect = document.getElementById('adminViewFilterSelect');
        if (filterSelect && filterSelect.value !== 'me') {
            if (filterSelect.value === 'all') {
                queryAll = true;
            } else {
                targetUserId = filterSelect.value;
            }
        }
    }
    
    try {
        // Usa o client de admin se for admin para ignorar RLS, senão usa o padrão
        const client = supabaseClient;
        
        // Busca as fichas, os dias e os exercícios de uma vez (usando a relação)
        let query = client
            .from('workout_sheets')
            .select(`
                id, name, created_at, user_id, created_by,
                profiles!workout_sheets_user_id_fkey ( full_name ),
                workout_days (
                    id, name,
                    workout_day_exercises (
                        id, sets, reps, notes, exercise_order,
                        exercises (exercise_id, name, name_pt, gif_url, anatomy_url, target_muscles)
                    )
                )
            `);
            
        if (queryAll) {
            query = query.eq('created_by', currentUser.id);
        } else {
            query = query.eq('user_id', targetUserId);
        }
        
        const { data: sheets, error } = await query.order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Formatar para o padrão que o frontend já espera
        savedWorkouts = sheets.map(sheet => {
            // Pegar os exercícios do primeiro dia (simplificando por enquanto)
            const day1 = sheet.workout_days && sheet.workout_days.length > 0 ? sheet.workout_days[0] : null;
            let formattedExercises = [];
            
            if (day1 && day1.workout_day_exercises) {
                // Ordenar pela ordem do exercício
                const sortedEx = day1.workout_day_exercises.sort((a, b) => a.exercise_order - b.exercise_order);
                
                formattedExercises = sortedEx.map(dEx => {
                    let blocks = [];
                    let notes = '';
                    
                    // Extrair blocks do campo notes
                    if (dEx.notes && dEx.notes.includes('[BLOCKS_DATA]:')) {
                        try {
                            const parts = dEx.notes.split('\n[USER_NOTES]:');
                            const blocksJson = parts[0].replace('[BLOCKS_DATA]:', '');
                            blocks = JSON.parse(blocksJson);
                            notes = parts[1] || '';
                        } catch (e) { console.error("Erro ao parsear blocks", e); }
                    } else {
                        // Fallback se não tiver blocos complexos
                        blocks = [{
                            id: 'default',
                            sets: dEx.sets,
                            reps: dEx.reps,
                            setType: 'Série de Trabalho',
                            restTime: '60s'
                        }];
                        notes = dEx.notes;
                    }
                    
                    return {
                        ...dEx.exercises,
                        exerciseId: dEx.exercises.exercise_id,
                        localGif: dEx.exercises.gif_url,
                        localAnatomy: dEx.exercises.anatomy_url,
                        blocks: blocks,
                        notes: notes,
                        dayExId: dEx.id // Precisamos desse ID para salvar os logs
                    };
                });
            }
            
            return {
                id: sheet.id,
                day_id: day1 ? day1.id : null,
                name: sheet.name,
                date: sheet.created_at,
                studentName: sheet.profiles ? sheet.profiles.full_name : null,
                user_id: sheet.user_id,
                exercises: formattedExercises
            };
        });
        
        // Agora vamos buscar todo o histórico de logs do usuário
        await fetchWeightHistory();
        
        renderSavedWorkouts();
    } catch (err) {
        console.error("Erro ao buscar fichas:", err);
    }
}

async function fetchWeightHistory() {
    if (!currentUser) return;
    weightHistory = {};
    
    let targetUserId = currentUser.id;
    let queryAll = false;
    
    if (isAdminGlobal) {
        const filterSelect = document.getElementById('adminViewFilterSelect');
        if (filterSelect && filterSelect.value !== 'me') {
            if (filterSelect.value === 'all') {
                queryAll = true;
            } else {
                targetUserId = filterSelect.value;
            }
        }
    }
    
    try {
        const client = supabaseClient;
        
        let query = client
            .from('workout_logs')
            .select(`
                id, created_at, day_id, user_id,
                exercise_logs (
                    id, exercise_id, sets_data
                )
            `);
            
        if (!queryAll) {
            query = query.eq('user_id', targetUserId);
        }
            
        const { data: logs, error } = await query.order('created_at', { ascending: true }); // Mais antigos primeiro, para construir o histórico
            
        if (error) throw error;
        
        logs.forEach(log => {
            if (log.exercise_logs) {
                log.exercise_logs.forEach(exLog => {
                    // sets_data vai ser um array de objetos: { blockId: '123', weight: '20kg' }
                    if (exLog.sets_data && Array.isArray(exLog.sets_data)) {
                        exLog.sets_data.forEach(setInfo => {
                            // Encontra a qual ficha esse log pertence através do day_id
                            const sheet = savedWorkouts.find(w => w.day_id === log.day_id);
                            if (sheet) {
                                // historyKey antigo era: workoutId_exerciseId_blockId
                                const historyKey = `${sheet.id}_${exLog.exercise_id}_${setInfo.blockId}`;
                                
                                if (!weightHistory[historyKey]) {
                                    weightHistory[historyKey] = [];
                                }
                                
                                weightHistory[historyKey].push({
                                    date: log.created_at,
                                    weight: setInfo.weight
                                });
                            }
                        });
                    }
                });
            }
        });
        
    } catch (err) {
        console.error("Erro ao buscar histórico de cargas:", err);
    }
}

function renderSavedWorkouts() {
    const listContainer = document.getElementById('savedWorkoutsList');
    const emptyMsg = document.getElementById('emptySavedMsg');
    
    if (savedWorkouts.length === 0) {
        listContainer.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }
    
    emptyMsg.classList.add('hidden');
    listContainer.innerHTML = '';
    
    // Inverter array para os mais recentes primeiro
    [...savedWorkouts].reverse().forEach(workout => {
        const dateStr = new Date(workout.date).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const card = document.createElement('div');
        card.className = 'border border-gray-700 rounded-xl overflow-hidden bg-gray-800';
        
        let exListHtml = '<ul class="mt-4 space-y-3">';
        workout.exercises.forEach((ex, i) => {
            let blocksHtml = '';
            // Suporte para exercícios antigos (sem blocks) e novos
            const blocks = ex.blocks || [{
                sets: ex.sets,
                reps: ex.reps,
                setType: ex.setType || 'Normal',
                restTime: ex.restTime || '60s'
            }];
            
            blocks.forEach((block, bIdx) => {
                const historyKey = `${workout.id}_${ex.exerciseId}_${block.id}`;
                
                // Normaliza o histórico para array, se já existir como string
                let history = weightHistory[historyKey] || [];
                if (!Array.isArray(history)) {
                    if (typeof history === 'string' && history.trim() !== '') {
                        history = [{ date: workout.date, weight: history }];
                    } else {
                        history = [];
                    }
                }
                
                const latestWeight = history.length > 0 ? history[history.length - 1].weight : '';
                
                let historyHtml = '';
                if (history.length > 0) {
                    historyHtml = `
                        <div class="w-full mt-2 hidden" id="history_${historyKey}">
                            <div class="text-xs bg-gray-900 border border-gray-700 rounded p-2 max-h-32 overflow-y-auto">
                                <div class="font-bold mb-1 text-gray-300">Histórico de Cargas:</div>
                                ${[...history].reverse().map(entry => `
                                    <div class="flex justify-between border-b border-gray-800 last:border-0 py-1">
                                        <span class="text-gray-400">${new Date(entry.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                                        <span class="font-semibold text-gray-100">${entry.weight}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                blocksHtml += `
                    <div class="flex flex-col text-xs mt-2 pl-2 py-1 border-l-2 ${block.setType === 'Aquecimento' ? 'border-yellow-300' : (block.setType === 'Série de Trabalho' ? 'border-blue-400' : 'border-purple-400')} hover:bg-gray-800 transition-colors rounded-r">
                        <div class="flex flex-wrap gap-2 items-center justify-between w-full">
                            <div class="flex flex-wrap gap-2 items-center">
                                <span class="text-gray-200 font-bold w-12 text-center">${block.sets} x ${block.reps}</span>
                                <span class="bg-black text-gray-300 px-1.5 py-0.5 rounded">⏱ ${block.restTime}</span>
                                <span class="bg-black text-gray-100 px-1.5 py-0.5 rounded font-medium">${block.setType}</span>
                            </div>
                            <div class="flex items-center gap-1 mt-1 sm:mt-0">
                                ${history.length > 0 ? `
                                <button onclick="toggleHistory('${historyKey}')" class="text-blue-500 hover:text-blue-700 hover:bg-orange-900 px-1.5 py-1 rounded transition-colors mr-1" title="Ver Histórico">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                ` : ''}
                                <input type="text" id="weight_${historyKey}" value="${latestWeight}" placeholder="Ex: 20kg" class="w-20 text-xs border border-gray-700 rounded px-2 py-1 text-center focus:ring-1 focus:ring-green-500">
                                <button onclick="saveWeight('${historyKey}')" class="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors" title="Adicionar Nova Carga">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>
                        ${historyHtml}
                    </div>
                `;
            });
            
            exListHtml += `
                <li class="bg-gray-900 p-3 rounded border border-gray-800 shadow-sm">
                    <div class="flex items-center justify-between mb-1 cursor-pointer hover:text-orange-500 transition-colors" onclick="openModal('${ex.exerciseId}')">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-gray-100">${i+1}. ${getDisplayName(ex)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    ${blocksHtml}
                    ${ex.notes ? `<p class="mt-3 text-xs text-black font-semibold bg-yellow-50 p-2 rounded border border-yellow-200 shadow-sm italic">📝 ${ex.notes}</p>` : ''}
                </li>
            `;
        });
        exListHtml += '</ul>';
        
        card.innerHTML = `
            <div class="p-4 bg-gray-900 border-b flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-lg text-gray-100">${workout.name}</h3>
                    <p class="text-xs text-gray-400">Salvo em: ${dateStr} • ${workout.exercises.length} exercícios</p>
                    ${workout.studentName && isAdminGlobal ? '<p class="text-xs font-semibold text-purple-600 mt-1">Aluno: ' + workout.studentName + '</p>' : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="loadWorkout('${workout.id}')" class="text-orange-500 hover:bg-orange-900 px-3 py-1 rounded text-sm font-semibold border border-orange-700 transition-colors">
                        Carregar
                    </button>
                    <button onclick="deleteWorkout('${workout.id}')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-semibold border border-red-200 transition-colors">
                        Excluir
                    </button>
                </div>
            </div>
            <div class="p-4">
                ${exListHtml}
            </div>
        `;
        
        listContainer.appendChild(card);
    });
}

async function deleteWorkout(id) {
    if (confirm("Tem certeza que deseja excluir esta ficha de treino? (Isso também excluirá o histórico de cargas associado a ela)")) {
        try {
            const client = supabaseClient;
            
            // Como temos chaves estrangeiras (fkey), precisamos apagar em ordem
            const workout = savedWorkouts.find(w => w.id === id);
            if (!workout) return;
            
            // Apaga logs (histórico de carga) associados ao dia
            if (workout.day_id) {
                const { error: logsError } = await client
                    .from('workout_logs')
                    .delete()
                    .eq('day_id', workout.day_id);
                if (logsError) throw logsError;
                
                // Apaga os exercícios do dia
                const { error: dayExError } = await client
                    .from('workout_day_exercises')
                    .delete()
                    .eq('day_id', workout.day_id);
                if (dayExError) throw dayExError;
                
                // Apaga o dia
                const { error: dayError } = await client
                    .from('workout_days')
                    .delete()
                    .eq('id', workout.day_id);
                if (dayError) throw dayError;
            }
            
            // Apaga a ficha principal
            const { error: sheetError } = await client
                .from('workout_sheets')
                .delete()
                .eq('id', id);
            if (sheetError) throw sheetError;
            
            // Atualiza a tela
            await fetchSavedWorkouts();
        } catch (err) {
            console.error("Erro ao excluir:", err);
            alert("Erro ao excluir ficha: " + err.message);
        }
    }
}

async function loadSelectedStudentWorkout() {
    const selectEl = document.getElementById('adminStudentSelect');
    if (!selectEl || selectEl.value === 'me' || !selectEl.value) {
        alert("Selecione um aluno primeiro.");
        return;
    }
    const targetUserId = selectEl.value;
    
    try {
        const client = supabaseClient;
        
        // Fetch the latest sheet for this user
        const { data: sheets, error } = await client
            .from('workout_sheets')
            .select(`
                id, name, created_at, user_id, created_by,
                workout_days (
                    id, name,
                    workout_day_exercises (
                        id, sets, reps, notes, exercise_order,
                        exercises (exercise_id, name, name_pt, gif_url, anatomy_url, target_muscles)
                    )
                )
            `)
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (error) throw error;
        
        if (!sheets || sheets.length === 0) {
            alert("Este aluno ainda não possui nenhuma ficha salva.");
            return;
        }
        
        const sheet = sheets[0];
        
        // format it similar to fetchSavedWorkouts
        const day1 = sheet.workout_days && sheet.workout_days.length > 0 ? sheet.workout_days[0] : null;
        let formattedExercises = [];
        
        if (day1 && day1.workout_day_exercises) {
            const sortedEx = day1.workout_day_exercises.sort((a, b) => a.exercise_order - b.exercise_order);
            formattedExercises = sortedEx.map(dEx => {
                let blocks = [];
                let notes = '';
                if (dEx.notes && dEx.notes.includes('[BLOCKS_DATA]:')) {
                    try {
                        const parts = dEx.notes.split('\n[USER_NOTES]:');
                        blocks = JSON.parse(parts[0].replace('[BLOCKS_DATA]:', ''));
                        notes = parts[1] || '';
                    } catch (e) { }
                } else {
                    blocks = [{ id: 'default', sets: dEx.sets, reps: dEx.reps, setType: 'Série de Trabalho', restTime: '60s' }];
                    notes = dEx.notes;
                }
                
                return {
                    ...dEx.exercises,
                    exerciseId: dEx.exercises.exercise_id,
                    localGif: dEx.exercises.gif_url,
                    localAnatomy: dEx.exercises.anatomy_url,
                    blocks: blocks,
                    notes: notes,
                    dayExId: dEx.id
                };
            });
        }
        
        if (currentWorkout.length > 0) {
            if (!confirm("Isso irá substituir o treino que você está montando agora pela última ficha do aluno. Continuar?")) {
                return;
            }
        }
        
        currentWorkout = formattedExercises;
        document.getElementById('workoutName').value = sheet.name;
        updateWorkoutUI();
        
        alert("Última ficha do aluno carregada com sucesso!");
        
    } catch (err) {
        console.error("Erro ao carregar ficha do aluno:", err);
        alert("Erro ao carregar: " + err.message);
    }
}

function loadWorkout(id) {
    const workoutToLoad = savedWorkouts.find(w => w.id === id);
    if (workoutToLoad) {
        if (currentWorkout.length > 0) {
            if (!confirm("Isso irá substituir o treino que você está montando agora. Continuar?")) {
                return;
            }
        }
        
        currentWorkout = JSON.parse(JSON.stringify(workoutToLoad.exercises));
        document.getElementById('workoutName').value = workoutToLoad.name;
        
        if (isAdminGlobal && workoutToLoad.user_id) {
            const selectEl = document.getElementById('adminStudentSelect');
            if (selectEl) {
                let optionExists = false;
                for (let i = 0; i < selectEl.options.length; i++) {
                    if (selectEl.options[i].value === workoutToLoad.user_id) {
                        optionExists = true;
                        break;
                    }
                }
                
                if (optionExists) {
                    selectEl.value = workoutToLoad.user_id;
                } else if (workoutToLoad.user_id === currentUser.id) {
                    selectEl.value = 'me';
                }
            }
        }
        
        updateWorkoutUI();
        switchTab('workout');
    }
}

function toggleHistory(historyKey) {
    const el = document.getElementById(`history_${historyKey}`);
    if (el) {
        el.classList.toggle('hidden');
    }
}

async function saveWeight(historyKey) {
    if (!currentUser) return;
    
    const input = document.getElementById(`weight_${historyKey}`);
    if (input) {
        const weightValue = input.value.trim();
        if (!weightValue) return;
        
        const btn = input.nextElementSibling;
        const originalHtml = btn.innerHTML;
        const originalClass = btn.className;
        btn.innerHTML = '...';
        btn.disabled = true;

        try {
            const client = supabaseClient;
            
            // Extrair IDs do historyKey (formato: sheetId_exerciseIdString_blockId)
            const parts = historyKey.split('_');
            const sheetId = parts[0];
            const exerciseIdString = parts[1]; // Ex: '123ABCD'
            const blockId = parts.slice(2).join('_'); // O resto é o blockId
            
            // Encontrar o day_id e o id numérico do exercício
            const sheet = savedWorkouts.find(w => w.id === sheetId);
            if (!sheet || !sheet.day_id) throw new Error("Ficha não encontrada");
            
            const targetUserId = sheet.user_id || currentUser.id;
            
            const { data: dbEx, error: exErr } = await client
                .from('exercises')
                .select('id')
                .eq('exercise_id', exerciseIdString)
                .single();
            if (exErr) throw exErr;

            // 1. Criar um registro no workout_logs
            const { data: logData, error: logErr } = await client
                .from('workout_logs')
                .insert([{
                    user_id: targetUserId,
                    day_id: sheet.day_id,
                    notes: 'Registro manual via botão salvar'
                }])
                .select()
                .single();
            if (logErr) throw logErr;

            // 2. Criar um registro no exercise_logs
            const { error: exLogErr } = await client
                .from('exercise_logs')
                .insert([{
                    workout_log_id: logData.id,
                    exercise_id: dbEx.id,
                    // Salvamos qual bloco e qual peso no formato jsonb
                    sets_data: [{ blockId: blockId, weight: weightValue }]
                }]);
            if (exLogErr) throw exLogErr;

            // Atualiza a interface
            let history = weightHistory[historyKey] || [];
            history.push({ date: new Date().toISOString(), weight: weightValue });
            weightHistory[historyKey] = history;
            
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
            btn.className = 'bg-orange-600 text-white hover:bg-orange-700 px-2 py-1 rounded transition-colors';
            
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.className = originalClass;
                btn.disabled = false;
                renderSavedWorkouts(); // Re-renderiza para atualizar o histórico visualmente
            }, 1000);
            
        } catch (err) {
            console.error("Erro ao salvar carga:", err);
            alert("Erro ao salvar carga: " + err.message);
            btn.innerHTML = originalHtml;
            btn.className = originalClass;
            btn.disabled = false;
        }
    }
}

// ----- SISTEMA DE AUTENTICAÇÃO (SUPABASE) -----
async function checkSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

let isAdminGlobal = false;
let allUsersList = []; // Lista de alunos para o Admin

async function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    if (currentUser) {
        document.getElementById('userEmailDisplay').innerText = currentUser.email;
        
        // Checar se o usuário é Admin
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .maybeSingle();
                
            if (data && data.role === 'admin') {
                isAdminGlobal = true;
                document.getElementById('tab-admin').classList.remove('hidden');
                
                // Admin pode ver o seletor de alunos
                document.getElementById('adminStudentSelectContainer').classList.remove('hidden');
                document.getElementById('adminViewFilterContainer').classList.remove('hidden');
                await fetchAllUsersForAdmin();
                
            } else {
                isAdminGlobal = false;
                document.getElementById('tab-admin').classList.add('hidden');
                document.getElementById('adminStudentSelectContainer').classList.add('hidden');
                document.getElementById('adminViewFilterContainer').classList.add('hidden');
            }
        } catch (err) {
            console.error("Erro ao buscar role de admin:", err);
            isAdminGlobal = false;
        }

        // Carregar treinos do usuário assim que ele logar
        await fetchSavedWorkouts();
        
        // Carregar exercícios novos do banco de dados (que não estão no data.js)
        await fetchDatabaseExercises();
    }
}

async function fetchDatabaseExercises() {
    if (dbExercisesLoaded) return;
    
    try {
        // Busca todos os exercícios do banco de dados
        const { data: dbExs, error } = await supabaseClient
            .from('exercises')
            .select('*');
            
        if (error) throw error;
        
        if (dbExs && dbExs.length > 0) {
            // Cria um Set com os IDs que já temos localmente no data.js
            const localIds = new Set(exercisesData.map(e => e.exerciseId));
            
            // Filtra apenas os que são novos (foram adicionados via painel admin recentemente)
            const newExercises = dbExs.filter(dbEx => !localIds.has(dbEx.exercise_id));
            
            if (newExercises.length > 0) {
                // Formata do jeito que o frontend espera e adiciona no início do array
                const formattedNewExs = newExercises.map(dbEx => ({
                    exerciseId: dbEx.exercise_id,
                    name: dbEx.name_pt || dbEx.name, // Prefere o nome em português
                    gifUrl: dbEx.gif_url,
                    localGif: dbEx.gif_url,
                    localAnatomy: dbEx.anatomy_url,
                    targetMuscles: dbEx.target_muscles,
                    bodyParts: dbEx.body_parts,
                    equipments: dbEx.equipments,
                    secondaryMuscles: dbEx.secondary_muscles,
                    instructions: dbEx.instructions
                }));
                
                // Adiciona no início da lista global
                exercisesData.unshift(...formattedNewExs);
                
                // Se o usuário estiver vendo "Todos", atualiza a lista filtrada
                if (!document.getElementById('searchInput').value && !document.querySelector('.tab-btn.active').id.includes('workout')) {
                    currentFilteredExercises = [...exercisesData];
                    renderExercises();
                }
            }
        }
        
        dbExercisesLoaded = true;
    } catch (err) {
        console.error("Erro ao buscar exercícios do banco:", err);
    }
}

async function fetchAllUsersForAdmin() {
    if (!isAdminGlobal) return;
    
    try {
        const client = supabaseClient;
        
        // Busca todos os usuários cadastrados na tabela profiles. 
        // Usamos select('*') para garantir que puxa tudo o que estiver lá.
        const { data: profiles, error } = await client
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id); // Remove o próprio admin da lista
            
        if (error) {
            console.error("Erro na query de perfis:", error);
            throw error;
        }
        
        allUsersList = profiles || [];
        console.log("Alunos encontrados:", allUsersList); // Debug
        
        const selectEl = document.getElementById('adminStudentSelect');
         const filterEl = document.getElementById('adminViewFilterSelect');
         
         // Mantém a opção "me" original e adiciona o resto
         selectEl.innerHTML = '<option value="me">Para Mim Mesmo</option>';
         
         // Atualiza também o filtro da aba Fichas Salvas
         filterEl.innerHTML = `
             <option value="me">Minhas Fichas</option>
             <option value="all">Todos os Alunos</option>
         `;
         
         if (allUsersList.length === 0) {
             selectEl.innerHTML += '<option value="" disabled>Nenhum aluno encontrado</option>';
         } else {
             allUsersList.forEach(user => {
                 // Tenta pegar o nome de onde for possível
                 const displayName = user.full_name || user.email || user.name || `Usuário (${user.id.substring(0,6)})`;
                 selectEl.innerHTML += `<option value="${user.id}">Aluno: ${displayName}</option>`;
                 filterEl.innerHTML += `<option value="${user.id}">Fichas de: ${displayName}</option>`;
             });
         }
        
    } catch (err) {
        console.error("Erro ao buscar lista de alunos:", err);
    }
}

function toggleAuthMode() {
    const isLogin = currentAuthMode === 'login';
    currentAuthMode = isLogin ? 'signup' : 'login';
    
    document.getElementById('nameFieldContainer').classList.toggle('hidden', !isLogin);
    document.getElementById('authName').required = isLogin;
    
    document.getElementById('btnSubmitAuth').innerText = isLogin ? 'Criar Conta' : 'Entrar';
    document.getElementById('btnToggleAuthMode').innerText = isLogin ? 'Já tem uma conta? Faça login' : 'Ainda não tem conta? Crie uma aqui';
    document.getElementById('authSubtitle').innerText = isLogin ? 'Preencha os dados abaixo para se cadastrar.' : 'Faça login para salvar seus treinos e histórico na nuvem.';
    
    document.getElementById('authError').classList.add('hidden');
    document.getElementById('authSuccess').classList.add('hidden');
}

async function handleAuth(event) {
    event.preventDefault();
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const btnSubmit = document.getElementById('btnSubmitAuth');
    const originalBtnText = btnSubmit.innerText;
    btnSubmit.innerText = 'Aguarde...';
    btnSubmit.disabled = true;

    try {
        if (currentAuthMode === 'signup') {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            if (error) throw error;
            
            // Se o Supabase já retornar a sessão (Confirmação de Email desativada no painel)
            if (data.session) {
                currentUser = data.session.user;
                showApp();
            } else {
                // Tenta fazer o login forçado logo após o cadastro, 
                // caso o Supabase permita login sem confirmação de e-mail.
                const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });
                
                if (signInError) {
                    successEl.innerText = "Conta criada! Verifique seu e-mail para confirmar o cadastro.";
                    successEl.classList.remove('hidden');
                    setTimeout(() => toggleAuthMode(), 2000);
                } else if (signInData.session) {
                    currentUser = signInData.session.user;
                    showApp();
                }
            }
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            // Se logar com sucesso, o listener do onAuthStateChange chamará o showApp()
        }
    } catch (error) {
        console.error("Erro na autenticação:", error);
        errorEl.innerText = error.message === 'Invalid login credentials' 
            ? 'Email ou senha inválidos.' 
            : error.message;
        errorEl.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = originalBtnText;
        btnSubmit.disabled = false;
    }
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert("Erro ao sair: " + error.message);
    }
}
// ----- FUNÇÕES DE ADMIN PARA EDITAR E EXCLUIR EXERCÍCIOS -----
async function deleteExercise(exerciseId) {
    if (!isAdminGlobal) return;
    
    if (!confirm("Tem certeza que deseja excluir este exercício DEFINITIVAMENTE do banco de dados?")) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('exercises')
            .delete()
            .eq('exercise_id', exerciseId);
            
        if (error) throw error;
        
        // Remove do array local
        const index = exercisesData.findIndex(e => e.exerciseId === exerciseId);
        if (index > -1) {
            exercisesData.splice(index, 1);
        }
        
        // Remove da lista filtrada se estiver nela
        const filteredIndex = currentFilteredExercises.findIndex(e => e.exerciseId === exerciseId);
        if (filteredIndex > -1) {
            currentFilteredExercises.splice(filteredIndex, 1);
        }
        
        alert("Exercício excluído com sucesso!");
        renderExercises();
        
    } catch (err) {
        console.error("Erro ao excluir:", err);
        alert("Erro ao excluir exercício: " + err.message);
    }
}

function cancelEditMode() {
    document.getElementById('adminAddExerciseForm').reset();
    document.getElementById('editExerciseId').value = '';
    document.getElementById('adminFormTitle').innerText = 'Painel Administrativo: Adicionar Exercício';
    document.getElementById('btnSaveText').innerText = 'Adicionar Exercício ao Banco';
    document.getElementById('btnSaveIcon').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />';
    document.getElementById('btnSaveNewExercise').className = 'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors text-lg flex items-center justify-center gap-2';
    document.getElementById('btnCancelEdit').classList.add('hidden');
    
    updateAdminAnatomyPreview();
    document.getElementById('adminGifPreview').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='16'>Sem Vídeo</text></svg>";
}

function editExercise(exerciseId) {
    if (!isAdminGlobal) return;
    
    const ex = exercisesData.find(e => e.exerciseId === exerciseId);
    if (!ex) return;
    
    // Preenche o formulário
    document.getElementById('editExerciseId').value = ex.exerciseId;
    document.getElementById('addNamePt').value = ex.name;
    document.getElementById('addGifUrl').value = ex.localGif || ex.gifUrl || '';
    
    // Atualiza preview de vídeo
    document.getElementById('adminGifPreview').src = ex.localGif || ex.gifUrl || '';
    
    // Preenche as instruções
    if (ex.instructions && ex.instructions.length > 0) {
        const instText = ex.instructions.map(inst => inst.replace(/Step:\d+\s*/g, '')).join('\n');
        document.getElementById('addInstructions').value = instText;
    } else {
        document.getElementById('addInstructions').value = '';
    }
    
    // Limpa os checkboxes e marca os correspondentes
    document.querySelectorAll('.muscle-cb').forEach(cb => cb.checked = false);
    const musclesToCheck = ex.targetMuscles || ex.bodyParts || [];
    musclesToCheck.forEach(m => {
        const cb = document.getElementById(`muscle_${m.toLowerCase().trim()}`);
        if (cb) cb.checked = true;
    });
    
    // Altera interface para Modo Edição
    document.getElementById('adminFormTitle').innerText = 'Painel Administrativo: Editar Exercício';
    document.getElementById('btnSaveText').innerText = 'Salvar Alterações';
    document.getElementById('btnSaveIcon').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />';
    document.getElementById('btnSaveNewExercise').className = 'w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors text-lg flex items-center justify-center gap-2';
    document.getElementById('btnCancelEdit').classList.remove('hidden');
    
    // Atualiza preview da anatomia
    updateAdminAnatomyPreview();
    
    // Muda pra aba admin
    switchTab('admin');
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// ----------------------------------------------

// ----- SISTEMA DE ADMINISTRAÇÃO -----
function initAdminPanel() {
    const container = document.getElementById('adminMuscleCheckboxes');
    if (!container) return;
    
    // Categorias de agrupamento
    const muscleCategories = {
        'Peito': ['chest', 'pectorals', 'serratus anterior'],
        'Costas': ['back', 'lats', 'spine', 'upper back', 'lower back', 'traps', 'levator scapulae'],
        'Ombros': ['shoulders', 'delts'],
        'Braços': ['biceps', 'triceps', 'forearms', 'upper arms', 'lower arms'],
        'Pernas': ['upper legs', 'lower legs', 'quads', 'hamstrings', 'calves', 'glutes', 'abductors', 'adductors'],
        'Core/Abdômen': ['abs', 'waist'],
        'Outros': ['neck', 'cardio']
    };

    // Mapear qual músculo pertence a qual categoria
    const allMuscles = Object.keys(localAnatomyImages).sort();
    const categorizedMuscles = {};
    
    // Inicializa os arrays das categorias
    Object.keys(muscleCategories).forEach(cat => categorizedMuscles[cat] = []);
    
    // Distribui os músculos nas categorias
    allMuscles.forEach(muscle => {
        let foundCategory = 'Outros';
        for (const [category, keywords] of Object.entries(muscleCategories)) {
            if (keywords.includes(muscle.toLowerCase())) {
                foundCategory = category;
                break;
            }
        }
        categorizedMuscles[foundCategory].push(muscle);
    });

    // Renderiza o HTML agrupado
    Object.keys(categorizedMuscles).forEach(category => {
        const musclesInCategory = categorizedMuscles[category];
        if (musclesInCategory.length === 0) return; // Pula se não tiver nenhum músculo na categoria
        
        const catDiv = document.createElement('div');
        catDiv.className = 'border border-gray-700 rounded bg-gray-900 overflow-hidden';
        
        catDiv.innerHTML = `
            <div class="bg-black px-3 py-2 font-bold text-gray-200 border-b border-gray-700 text-sm">
                ${category}
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 text-sm">
                ${musclesInCategory.map(muscle => `
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="muscle_${muscle}" value="${muscle}" class="muscle-cb w-4 h-4 text-purple-600 rounded focus:ring-red-500 cursor-pointer">
                        <label for="muscle_${muscle}" class="capitalize text-gray-200 cursor-pointer font-medium truncate" title="${translateMuscle(muscle)}">${translateMuscle(muscle)}</label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(catDiv);
    });
}

// Chave da API RapidAPI para o Muscle Visualizer
const RAPIDAPI_KEY = "5bbb34e02bmsh31702cc2e71fe84p1a89eajsn4bc8077f4446";

async function generateAnatomyImage(muscles) {
    if (muscles.length === 0) return null;
    
    // Mapeamento dos nossos nomes locais para os IDs exatos que a API espera
    // A API só aceita: ABS, BACK, BICEPS, CALVES, CHEST, FOREARMS, GLUTES, HAMSTRINGS, LATS, NECK, QUADS, SHOULDERS, TRICEPS, TRAPS, OBLIQUES, ADDUCTORS, ABDUCTORS
    const apiMuscleMap = {
        'abductors': 'ABDUCTORS',
        'abs': 'ABS',
        'adductors': 'ADDUCTORS',
        'biceps': 'BICEPS',
        'calves': 'CALVES',
        'cardio': 'ABS', // Sem mapeamento direto
        'chest': 'CHEST',
        'forearms': 'FOREARMS',
        'glutes': 'GLUTES',
        'hamstrings': 'HAMSTRINGS',
        'lats': 'LATS',
        'neck': 'NECK',
        'quads': 'QUADS',
        'shoulders': 'SHOULDERS',
        'spine': 'BACK',
        'traps': 'TRAPS',
        'triceps': 'TRICEPS',
        'upper back': 'BACK',
        'lower back': 'BACK'
    };

    // Converte os nossos músculos para os nomes da API
    const mappedMuscles = muscles.map(m => apiMuscleMap[m.toLowerCase().trim()]).filter(m => m);
    
    if (mappedMuscles.length === 0) {
        console.warn("Nenhum músculo mapeado válido para a API.");
        return null;
    }
    
    const musclesParam = mappedMuscles.join(',');
    console.log("Enviando para API: ", musclesParam);
    
    try {
        const response = await fetch(`https://muscle-visualizer-api.p.rapidapi.com/api/v1/visualize?muscles=${encodeURIComponent(musclesParam)}&color=%23D20A2E&gender=male&background=transparent&size=small&format=jpeg`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'muscle-visualizer-api.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Resposta de erro da API:", errorText);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // Base64 da imagem
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error("Erro ao gerar imagem na API:", err);
        return null;
    }
}

// Variável para guardar a imagem gerada (base64)
let currentGeneratedAnatomyBase64 = null;

async function updateAdminAnatomyPreview() {
    const checked = Array.from(document.querySelectorAll('.muscle-cb:checked')).map(cb => cb.value);
    const container = document.getElementById('adminAnatomyContainer');
    
    if (checked.length === 0) {
        container.innerHTML = '<p id="adminAnatomyPlaceholder" class="text-gray-400 text-sm">Selecione as regiões primeiro</p>';
        return;
    }

    // Limpa o container e mostra carregamento
    container.innerHTML = '<div class="flex flex-col items-center"><svg class="animate-spin h-6 w-6 text-purple-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg><p class="text-gray-400 text-sm">Gerando imagem na API...</p></div>';
    currentGeneratedAnatomyBase64 = null;
    
    // Tenta chamar a API
    const base64Image = await generateAnatomyImage(checked);
    
    container.innerHTML = '';
    if (base64Image) {
        currentGeneratedAnatomyBase64 = base64Image;
        const img = document.createElement('img');
        img.src = base64Image;
        img.className = 'max-h-48 object-contain rounded relative';
        container.appendChild(img);
    } else {
        container.innerHTML = `
            <div class="text-center p-2 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-red-500 font-bold text-sm mb-1">Falha ao gerar imagem na API.</p>
                <p class="text-gray-400 text-xs">Verifique sua chave da RapidAPI ou tente novamente.</p>
            </div>`;
    }
}

async function handleAddExercise(e) {
    e.preventDefault();
    
    const isEditMode = document.getElementById('editExerciseId').value !== '';
    const editId = document.getElementById('editExerciseId').value;
    
    const namePt = document.getElementById('addNamePt').value.trim();
    const gifUrl = document.getElementById('addGifUrl').value.trim();
    const checkedMuscles = Array.from(document.querySelectorAll('.muscle-cb:checked')).map(cb => cb.value);
    const instructionsRaw = document.getElementById('addInstructions').value.trim();
    
    const msgEl = document.getElementById('adminAddMsg');
    const btn = document.getElementById('btnSaveNewExercise');
    
    if (checkedMuscles.length === 0) {
        alert('Selecione pelo menos um músculo alvo!');
        return;
    }

    // Formata as instruções para o array
    const instructionsArray = instructionsRaw 
        ? instructionsRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0).map((line, idx) => `Step:${idx + 1} ${line}`)
        : [];

    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Salvando...';
    
    // Se não for edição, gera um ID novo. Se for edição, mantém o editId
    const exercise_id = isEditMode ? editId : (namePt.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) + '_' + Math.random().toString(36).substr(2, 5));
    
    // Fazemos o upload do base64 gerado para o Supabase Storage (se tiver gerado um novo)
    let finalAnatomyUrl = null;
    
    if (currentGeneratedAnatomyBase64) {
        try {
            // Converter base64 para Blob
            const res = await fetch(currentGeneratedAnatomyBase64);
            const blob = await res.blob();
            
            // Fazer upload para o bucket anatomy-images/anatomy_combined/
            const filename = `anatomy_combined/${exercise_id}.jpeg`;
            const { data: storageData, error: storageError } = await supabaseClient.storage
                .from('anatomy-images')
                .upload(filename, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });
                
            if (storageError) {
                console.warn("Erro ao fazer upload da imagem para o Storage, usando nulo:", storageError);
            } else {
                // Pegar URL pública
                const { data: publicUrlData } = supabaseClient.storage
                    .from('anatomy-images')
                    .getPublicUrl(filename);
                    
                finalAnatomyUrl = publicUrlData.publicUrl;
            }
        } catch (uploadErr) {
            console.warn("Falha no processo de upload da imagem:", uploadErr);
        }
    } else if (isEditMode) {
        // Se estiver editando e NÃO gerou imagem nova, mantém a antiga
        const exOld = exercisesData.find(e => e.exerciseId === editId);
        finalAnatomyUrl = exOld ? (exOld.localAnatomy || null) : null;
    } else {
        // Se for criação nova e não gerou, usa a fallback simples
        finalAnatomyUrl = localAnatomyImages[checkedMuscles[0]] || null;
    }

    const payload = {
        name: namePt,
        name_pt: namePt,
        gif_url: gifUrl,
        anatomy_url: finalAnatomyUrl,
        target_muscles: checkedMuscles,
        body_parts: checkedMuscles,
        equipments: ['body weight'],
        secondary_muscles: [],
        instructions: instructionsArray
    };

    try {
        let dbError = null;
        
        if (isEditMode) {
            const { error } = await supabaseClient
                .from('exercises')
                .update(payload)
                .eq('exercise_id', exercise_id);
            dbError = error;
        } else {
            payload.exercise_id = exercise_id;
            const { error } = await supabaseClient
                .from('exercises')
                .insert([payload]);
            dbError = error;
        }

        if (dbError) throw dbError;
        
        msgEl.innerText = isEditMode ? '✅ Exercício atualizado com sucesso!' : '✅ Exercício adicionado com sucesso!';
        msgEl.className = 'mt-3 text-center text-sm font-semibold text-green-600';
        msgEl.classList.remove('hidden');
        
        // Atualiza a lista local
        const newExObj = {
            exerciseId: exercise_id,
            name: namePt,
            localGif: gifUrl,
            localAnatomy: finalAnatomyUrl,
            targetMuscles: checkedMuscles,
            bodyParts: checkedMuscles,
            equipments: ['body weight'],
            instructions: instructionsArray
        };
        
        if (isEditMode) {
            const index = exercisesData.findIndex(e => e.exerciseId === exercise_id);
            if (index > -1) exercisesData[index] = newExObj;
        } else {
            exercisesData.unshift(newExObj);
        }
        
        currentFilteredExercises = [...exercisesData];
        renderExercises();
        
        // Sai do modo de edição
        cancelEditMode();
        
    } catch (err) {
        console.error(err);
        msgEl.innerText = '❌ Erro ao salvar: ' + err.message;
        msgEl.className = 'mt-3 text-center text-sm font-semibold text-red-600';
        msgEl.classList.remove('hidden');
    } finally {
        if (!isEditMode) {
            btn.innerHTML = `<svg id="btnSaveIcon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg> <span id="btnSaveText">Adicionar Exercício ao Banco</span>`;
        }
        btn.disabled = false;
        setTimeout(() => msgEl.classList.add('hidden'), 5000);
    }
}
// ----------------------------------------------

// Inicialização da Página
document.addEventListener("DOMContentLoaded", () => {
    // Configura Auth via Supabase
    checkSession();
    
    // Ouve mudanças na autenticação
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuth();
        }
    });

    // Torna currentUser acessível globalmente para verificar se é admin em qualquer lugar
    window.checkIsAdmin = async function() {
        if (!currentUser) return false;
        try {
            const { data } = await supabaseClient.from('profiles').select('role').eq('id', currentUser.id).maybeSingle();
            return data && data.role === 'admin';
        } catch(e) { return false; }
    };

    // Inicializa o painel de admin (cria os checkboxes)
    initAdminPanel();

    // Inicializa o catálogo
    if (typeof exercisesData !== 'undefined') {
        currentFilteredExercises = [...exercisesData]; // Copia todos os dados inicialmente
        renderExercises();
        
        // Inicializa a aba de treino
        initWorkoutTab();
        
        // Não renderiza os salvos aqui. Será feito após o login do usuário.
    } else {
        console.error("Erro: exercisesData não foi carregado corretamente a partir do data.js");
    }
});
