import os
import json
import requests

JSON_URL = "https://raw.githubusercontent.com/bradbelcher/exercisedb-api/main/src/data/exercises.json"
GIFS_FOLDER = "gifs"
OUTPUT_JS = "data.js"
OUTPUT_HTML = "index.html"

def main():
    print("Baixando base de dados original...")
    try:
        response = requests.get(JSON_URL)
        exercises = response.json()
    except Exception as e:
        print(f"Erro ao baixar JSON: {e}")
        return

    print("Lendo arquivos locais de GIFs...")
    local_gifs = {}
    if os.path.exists(GIFS_FOLDER):
        for filename in os.listdir(GIFS_FOLDER):
            if filename.endswith(".gif"):
                ex_id = filename.split('_')[0]
                local_gifs[ex_id] = f"{GIFS_FOLDER}/{filename}"
                
    print(f"Encontrados {len(local_gifs)} GIFs locais.")

    print("Verificando imagens combinadas de anatomia...")
    combined_anatomy = {}
    if os.path.exists("anatomy_combined"):
        for filename in os.listdir("anatomy_combined"):
            if filename.endswith(".jpeg"):
                ex_id = filename.split('.')[0]
                combined_anatomy[ex_id] = f"anatomy_combined/{filename}"
                
    print(f"Encontradas {len(combined_anatomy)} imagens de anatomia.")

    # Adicionar o caminho local aos dados
    processed_exercises = []
    for ex in exercises:
        ex_id = ex.get("exerciseId")
        
        # Associar GIF local
        if ex_id in local_gifs:
            ex["localGif"] = local_gifs[ex_id]
        else:
            ex["localGif"] = None 
            
        # Associar anatomia combinada local
        if ex_id in combined_anatomy:
            ex["localAnatomy"] = combined_anatomy[ex_id]
        else:
            ex["localAnatomy"] = None
            
        processed_exercises.append(ex)

    print("Gerando data.js...")
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write("const exercisesData = ")
        json.dump(processed_exercises, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("Gerando index.html...")
    html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo de Exercícios</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .card:hover { transform: translateY(-5px); transition: all 0.3s ease; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .instructions-list { list-style-type: decimal; margin-left: 1.5rem; }
        
        /* Tabs e Layout */
        .tab-btn { transition: all 0.3s; }
        .tab-btn.active { background-color: #2563eb; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* Treino List */
        .workout-item { transition: all 0.2s; }
        .workout-item:hover { background-color: #f8fafc; }
        
        /* Estilos do Modal */
        #exerciseModal { transition: opacity 0.3s ease; }
        .modal-content { transition: transform 0.3s ease; }
        .body-part-img { object-fit: contain; background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 4px; }
    </style>
</head>
<body class="bg-gray-100 text-gray-800 font-sans">
    <div class="container mx-auto px-4 py-8">
        <header class="mb-8 text-center">
            <h1 class="text-4xl font-bold text-blue-600 mb-2">ExerciseDB App 💪</h1>
            <p class="text-gray-600">Explore exercícios e monte seu treino personalizado.</p>
        </header>

        <!-- Navegação -->
        <div class="flex justify-center mb-8">
            <div class="bg-gray-200 p-1 rounded-lg inline-flex">
                <button onclick="switchTab('catalog')" id="tab-catalog" class="tab-btn active px-6 py-2 rounded-md font-semibold text-gray-700">Catálogo</button>
                <button onclick="switchTab('workout')" id="tab-workout" class="tab-btn px-6 py-2 rounded-md font-semibold text-gray-700">Meu Treino (<span id="workout-count">0</span>)</button>
            </div>
        </div>

        <!-- Aba: Catálogo -->
        <div id="content-catalog" class="tab-content active">
            <div class="mb-8 max-w-2xl mx-auto">
                <input type="text" id="searchInput" placeholder="Pesquisar por nome, músculo ou equipamento..." 
                       class="w-full px-4 py-3 rounded-lg shadow-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div id="stats" class="mb-4 text-gray-600 font-semibold text-center"></div>

            <div id="exercisesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Cards serão inseridos aqui pelo JavaScript -->
            </div>
        </div>

        <!-- Aba: Montar Treino -->
        <div id="content-workout" class="tab-content">
            <div class="flex flex-col lg:flex-row gap-8">
                
                <!-- Lista de Seleção Agrupada por Músculo -->
                <div class="lg:w-2/3 bg-white rounded-xl shadow-md p-6">
                    <div class="flex justify-between items-center border-b pb-4 mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Adicionar Exercícios</h2>
                        <select id="muscleFilter" class="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-blue-500 focus:border-blue-500">
                            <option value="all">Todos os Músculos</option>
                            <!-- Options preenchidos via JS -->
                        </select>
                    </div>
                    
                    <div class="mb-4 relative">
                        <input type="text" id="workoutSearchInput" placeholder="Buscar exercício para adicionar..." 
                               class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <!-- Container dos Grupos Musculares -->
                    <div id="muscleGroupsContainer" class="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <!-- Renderizado via JS -->
                    </div>
                </div>

                <!-- Painel do Treino Atual -->
                <div class="lg:w-1/3">
                    <div class="bg-white rounded-xl shadow-md p-6 sticky top-4 flex flex-col max-h-[800px]">
                        <div class="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 class="text-2xl font-bold text-gray-800">Meu Treino</h2>
                            <button onclick="clearWorkout()" class="text-sm text-red-600 hover:text-red-800 font-semibold">Limpar Tudo</button>
                        </div>
                        
                        <div id="emptyWorkoutMsg" class="text-center py-8 text-gray-500 italic">
                            Seu treino está vazio. Adicione exercícios ao lado!
                        </div>
                        
                        <div id="currentWorkoutList" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-4">
                            <!-- Renderizado via JS -->
                        </div>
                        
                        <div class="border-t pt-4 mt-auto">
                            <button onclick="exportWorkout()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Exportar Treino
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>

    <!-- Modal do Exercício -->
    <div id="exerciseModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 opacity-0 pointer-events-none p-4 overflow-y-auto">
        <div class="modal-content bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden transform scale-95 flex flex-col max-h-[90vh]">
            <div class="flex justify-between items-center p-4 border-b bg-gray-50">
                <h2 id="modalTitle" class="text-2xl font-bold text-gray-800 uppercase tracking-wide">Nome do Exercício</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-red-500 transition-colors p-2 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto flex-grow flex flex-col lg:flex-row gap-8">
                <!-- Coluna Esquerda: GIFs e Imagens -->
                <div class="lg:w-1/2 flex flex-col gap-6">
                    <div class="bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-center items-center shadow-inner">
                        <img id="modalGif" src="" alt="GIF do Exercício" class="max-h-96 w-full object-contain rounded-lg">
                    </div>
                    
                    <div class="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col sm:flex-row gap-4 items-center">
                        <div class="flex-grow">
                            <h3 class="text-lg font-bold text-blue-800 mb-1">Região Trabalhada</h3>
                            <p id="modalBodyPartText" class="text-blue-600 font-semibold uppercase text-sm"></p>
                        </div>
                        <img id="modalBodyPartImg" src="" alt="Anatomia" class="body-part-img w-32 h-32">
                    </div>
                </div>

                <!-- Coluna Direita: Informações e Instruções -->
                <div class="lg:w-1/2 flex flex-col gap-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Músculo Alvo</p>
                            <p id="modalTargetMuscle" class="text-gray-800 font-medium"></p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Músculos Secundários</p>
                            <p id="modalSecondaryMuscles" class="text-gray-800 font-medium"></p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2">
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Equipamento</p>
                            <p id="modalEquipment" class="text-gray-800 font-medium"></p>
                        </div>
                    </div>

                    <div class="flex-grow flex flex-col">
                        <h3 class="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Instruções Passo a Passo</h3>
                        <div id="modalInstructions" class="text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100 flex-grow text-lg leading-relaxed">
                            <!-- Instruções inseridas aqui -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="data.js"></script>
    <script>
        const grid = document.getElementById('exercisesGrid');
        const searchInput = document.getElementById('searchInput');
        const stats = document.getElementById('stats');

        // Funções de Tab
        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.add('text-gray-700'));
            
            const activeBtn = document.getElementById(`tab-${tabId}`);
            activeBtn.classList.remove('text-gray-700');
            activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`content-${tabId}`).classList.add('active');
        }

        // Lógica do Treino (Workout)
        let currentWorkout = [];

        function initWorkoutTab() {
            // Extrair grupos musculares (targetMuscles)
            const musclesSet = new Set();
            exercisesData.forEach(ex => {
                if (ex.targetMuscles) {
                    ex.targetMuscles.forEach(m => musclesSet.add(m));
                }
            });
            const musclesList = Array.from(musclesSet).sort();
            
            // Preencher select de filtro
            const filter = document.getElementById('muscleFilter');
            // Limpa para não duplicar se rodar duas vezes
            filter.innerHTML = '<option value="all">Todos os Músculos</option>';
            musclesList.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m.toUpperCase();
                filter.appendChild(opt);
            });
            
            // Limitando para não travar: mostra os 100 primeiros na lista do Treino inicialmente
            renderWorkoutSelection(exercisesData.slice(0, 100));
            
            // Event Listeners de Filtro na aba Treino
            filter.addEventListener('change', filterWorkoutSelection);
            document.getElementById('workoutSearchInput').addEventListener('input', filterWorkoutSelection);
        }

        function getDisplayName(ex) {
            if (ex.localGif) {
                const filename = ex.localGif.split('/').pop();
                const namePart = filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.'));
                return namePart.replace(/_/g, ' ').toUpperCase();
            }
            return ex.name.toUpperCase();
        }

        function filterWorkoutSelection() {
            const muscle = document.getElementById('muscleFilter').value;
            const query = document.getElementById('workoutSearchInput').value.toLowerCase();
            
            const filtered = exercisesData.filter(ex => {
                const matchMuscle = muscle === 'all' || (ex.targetMuscles && ex.targetMuscles.includes(muscle));
                const name = getDisplayName(ex).toLowerCase();
                const matchQuery = name.includes(query);
                return matchMuscle && matchQuery;
            });
            
            // Renderiza apenas os 100 primeiros resultados da busca para não travar a UI
            renderWorkoutSelection(filtered.slice(0, 100));
        }

        function renderWorkoutSelection(exercises) {
            const container = document.getElementById('muscleGroupsContainer');
            container.innerHTML = '';
            
            if (exercises.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum exercício encontrado.</p>';
                return;
            }
            
            // Agrupar por músculo alvo principal
            const grouped = {};
            exercises.forEach(ex => {
                const mainMuscle = (ex.targetMuscles && ex.targetMuscles.length > 0) ? ex.targetMuscles[0] : 'Outros';
                if (!grouped[mainMuscle]) grouped[mainMuscle] = [];
                grouped[mainMuscle].push(ex);
            });
            
            // Ordenar e renderizar
            Object.keys(grouped).sort().forEach(muscle => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'mb-6';
                
                const header = document.createElement('h3');
                header.className = 'text-lg font-bold text-blue-800 border-b pb-2 mb-3 uppercase';
                header.textContent = muscle;
                groupDiv.appendChild(header);
                
                const list = document.createElement('div');
                list.className = 'space-y-2';
                
                grouped[muscle].forEach(ex => {
                    const name = getDisplayName(ex);
                    const isAdded = currentWorkout.some(w => w.exerciseId === ex.exerciseId);
                    
                    const item = document.createElement('div');
                    item.className = 'workout-item flex justify-between items-center p-3 border rounded-lg bg-white';
                    
                    const btnClass = isAdded ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200';
                    const btnText = isAdded ? 'Remover' : 'Adicionar';
                    const btnAction = isAdded ? `removeFromWorkout('${ex.exerciseId}')` : `addToWorkout('${ex.exerciseId}')`;
                    
                    item.innerHTML = `
                        <div class="flex items-center gap-3 cursor-pointer flex-grow" onclick="openModal('${ex.exerciseId}')">
                            <img src="${ex.localGif || ex.gifUrl}" class="w-12 h-12 object-cover rounded border bg-gray-50">
                            <div>
                                <p class="font-bold text-gray-800 text-sm">${name}</p>
                                <p class="text-xs text-gray-500">${ex.equipments ? ex.equipments.join(', ') : 'Body weight'}</p>
                            </div>
                        </div>
                        <button onclick="${btnAction}" class="ml-2 px-3 py-1 text-sm font-semibold rounded transition-colors ${btnClass}">
                            ${btnText}
                        </button>
                    `;
                    list.appendChild(item);
                });
                
                groupDiv.appendChild(list);
                container.appendChild(groupDiv);
            });
        }

        function addToWorkout(id) {
            const ex = exercisesData.find(e => e.exerciseId === id);
            if (ex && !currentWorkout.some(w => w.exerciseId === id)) {
                // Adiciona com 3 séries de 10 reps por padrão
                currentWorkout.push({ ...ex, sets: 3, reps: 10 });
                updateWorkoutUI();
            }
        }

        function removeFromWorkout(id) {
            currentWorkout = currentWorkout.filter(w => w.exerciseId !== id);
            updateWorkoutUI();
        }

        function updateSets(id, value) {
            const item = currentWorkout.find(w => w.exerciseId === id);
            if (item) item.sets = parseInt(value) || 0;
        }

        function updateReps(id, value) {
            const item = currentWorkout.find(w => w.exerciseId === id);
            if (item) item.reps = parseInt(value) || 0;
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
                    item.className = 'bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2';
                    
                    item.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex gap-2 items-center cursor-pointer" onclick="openModal('${ex.exerciseId}')">
                                <span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">${index + 1}</span>
                                <span class="font-bold text-gray-800 text-sm leading-tight">${name}</span>
                            </div>
                            <button onclick="removeFromWorkout('${ex.exerciseId}')" class="text-gray-400 hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">${ex.targetMuscles ? ex.targetMuscles[0].toUpperCase() : 'N/A'}</span>
                            <div class="flex items-center gap-2 text-sm">
                                <input type="number" min="1" value="${ex.sets}" onchange="updateSets('${ex.exerciseId}', this.value)" class="w-12 border rounded px-1 py-0.5 text-center"> séries
                                <span>x</span>
                                <input type="number" min="1" value="${ex.reps}" onchange="updateReps('${ex.exerciseId}', this.value)" class="w-12 border rounded px-1 py-0.5 text-center"> reps
                            </div>
                        </div>
                    `;
                    list.appendChild(item);
                });
            }
            
            // Re-renderizar seleção para atualizar os botões (Adicionar/Remover)
            filterWorkoutSelection();
        }

        function exportWorkout() {
            if (currentWorkout.length === 0) {
                alert("Seu treino está vazio! Adicione exercícios antes de exportar.");
                return;
            }
            
            let text = "💪 MEU TREINO PERSONALIZADO 💪\n\n";
            
            currentWorkout.forEach((ex, index) => {
                const name = getDisplayName(ex);
                const muscle = ex.targetMuscles ? ex.targetMuscles[0].toUpperCase() : 'N/A';
                text += `${index + 1}. ${name}\n`;
                text += `   Alvo: ${muscle} | Equipamento: ${ex.equipments ? ex.equipments.join(', ') : 'N/A'}\n`;
                text += `   Séries: ${ex.sets} | Repetições: ${ex.reps}\n\n`;
            });
            
            text += "Gerado pelo ExerciseDB App";
            
            // Criar um elemento textarea temporário para copiar pro clipboard
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                alert("Treino copiado para a área de transferência! Você pode colar no WhatsApp, Bloco de Notas, etc.");
            } catch (err) {
                alert("Erro ao copiar o treino. O arquivo será baixado.");
                // Fallback de download txt
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'meu_treino.txt';
                a.click();
            } finally {
                document.body.removeChild(textarea);
            }
        }
        
        function clearWorkout() {
            if (confirm('Tem certeza que deseja limpar seu treino atual?')) {
                currentWorkout = [];
                updateWorkoutUI();
            }
        }
        
        // Elementos do Modal
        const modal = document.getElementById('exerciseModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Mapeamento local usando as imagens geradas pela Muscle Visualizer API
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
            
            // Fallbacks de body parts para músculos correspondentes
            'chest': 'anatomy/pectorals.jpeg',
            'back': 'anatomy/lats.jpeg',
            'upper arms': 'anatomy/biceps.jpeg', // ou triceps
            'lower arms': 'anatomy/forearms.jpeg',
            'upper legs': 'anatomy/quads.jpeg',
            'lower legs': 'anatomy/calves.jpeg',
            'shoulders': 'anatomy/delts.jpeg',
            'waist': 'anatomy/abs.jpeg',
            'neck': 'anatomy/traps.jpeg'
        };

        function openModal(exId) {
            const ex = exercisesData.find(e => e.exerciseId === exId);
            if (!ex) return;

            const imgSrc = ex.localGif ? ex.localGif : ex.gifUrl;
            
            let displayName = ex.name;
            if (ex.localGif) {
                const filename = ex.localGif.split('/').pop();
                const namePart = filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.'));
                displayName = namePart.replace(/_/g, ' ');
            }

            document.getElementById('modalTitle').innerText = displayName;
            document.getElementById('modalGif').src = imgSrc;
            
            const bodyPartsStr = ex.bodyParts ? ex.bodyParts.join(', ') : 'N/A';
            document.getElementById('modalBodyPartText').innerText = bodyPartsStr;
            
            // As imagens de anatomia são mapeadas usando a chave targetMuscles (mais específica) ou bodyParts
            const firstBodyPart = ex.bodyParts && ex.bodyParts.length > 0 ? ex.bodyParts[0].toLowerCase().trim() : null;
            const firstTargetMuscle = ex.targetMuscles && ex.targetMuscles.length > 0 ? ex.targetMuscles[0].toLowerCase().trim() : null;
            
            const anatomyImg = document.getElementById('modalBodyPartImg');
            
            // Prioridade: 1. Imagem Combinada do Exercício (localAnatomy), 2. Target Muscle, 3. Body Part
            if (ex.localAnatomy) {
                anatomyImg.src = ex.localAnatomy;
                anatomyImg.style.display = 'block';
            } else if (firstTargetMuscle && localAnatomyImages[firstTargetMuscle]) {
                anatomyImg.src = localAnatomyImages[firstTargetMuscle];
                anatomyImg.style.display = 'block';
            } else if (firstBodyPart && localAnatomyImages[firstBodyPart]) {
                anatomyImg.src = localAnatomyImages[firstBodyPart];
                anatomyImg.style.display = 'block';
            } else {
                anatomyImg.style.display = 'none';
            }

            document.getElementById('modalTargetMuscle').innerText = ex.targetMuscles ? ex.targetMuscles.join(', ') : 'N/A';
            document.getElementById('modalSecondaryMuscles').innerText = ex.secondaryMuscles ? ex.secondaryMuscles.join(', ') : 'N/A';
            document.getElementById('modalEquipment').innerText = ex.equipments ? ex.equipments.join(', ') : 'N/A';

            let instructionsHtml = '';
            if (ex.instructions && ex.instructions.length > 0) {
                instructionsHtml = '<ol class="instructions-list space-y-3">';
                ex.instructions.forEach(inst => {
                    instructionsHtml += `<li>${inst}</li>`;
                });
                instructionsHtml += '</ol>';
            } else {
                instructionsHtml = '<p class="text-gray-500 italic">Sem instruções disponíveis.</p>';
            }
            document.getElementById('modalInstructions').innerHTML = instructionsHtml;

            // Animação de abertura
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
            document.body.style.overflow = 'hidden'; // Evita scroll no fundo
        }

        function closeModal() {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            document.body.style.overflow = '';
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
                closeModal();
            }
        });

        function renderExercises(exercises) {
            grid.innerHTML = '';
            
            exercises.forEach(ex => {
                const imgSrc = ex.localGif ? ex.localGif : ex.gifUrl;
                const targetMuscles = ex.targetMuscles ? ex.targetMuscles.join(', ') : 'N/A';
                const bodyParts = ex.bodyParts ? ex.bodyParts.join(', ') : 'N/A';

                let displayName = ex.name;
                if (ex.localGif) {
                    const filename = ex.localGif.split('/').pop();
                    const namePart = filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.'));
                    displayName = namePart.replace(/_/g, ' ').toUpperCase();
                } else {
                    displayName = displayName.toUpperCase();
                }

                const card = document.createElement('div');
                card.className = 'card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col';
                card.onclick = () => openModal(ex.exerciseId); // Click no card abre modal
                
                card.innerHTML = `
                    <div class="h-64 bg-white flex items-center justify-center border-b p-2 relative group">
                        <img src="${imgSrc}" alt="${displayName}" class="max-h-full max-w-full object-contain" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 300 200\\'><rect width=\\'300\\' height=\\'200\\' fill=\\'%23f3f4f6\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%239ca3af\\' font-family=\\'sans-serif\\' font-size=\\'16\\'>GIF Indisponível</text></svg>'">
                        <div class="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                            <span class="bg-blue-600 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-semibold transform scale-95 group-hover:scale-100">Ver Detalhes</span>
                        </div>
                    </div>
                    <div class="p-5 flex-grow flex flex-col">
                        <h2 class="text-xl font-bold text-gray-800 mb-2 line-clamp-2">${displayName}</h2>
                        <div class="mt-auto">
                            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-semibold mr-1 mb-1">${bodyParts}</span>
                            <span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full uppercase font-semibold mr-1 mb-1">${targetMuscles}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function filterExercises() {
            const query = searchInput.value.toLowerCase();
            const filtered = exercisesData.filter(ex => {
                const nameMatch = ex.name.toLowerCase().includes(query);
                
                // Pega o nome traduzido se tiver localGif
                let localNameMatch = false;
                if (ex.localGif) {
                    const filename = ex.localGif.split('/').pop();
                    const namePart = filename.substring(filename.indexOf('_') + 1, filename.lastIndexOf('.')).replace(/_/g, ' ');
                    localNameMatch = namePart.includes(query);
                }

                const muscleMatch = ex.targetMuscles && ex.targetMuscles.some(m => m.toLowerCase().includes(query));
                const equipMatch = ex.equipments && ex.equipments.some(e => e.toLowerCase().includes(query));
                const bodyPartMatch = ex.bodyParts && ex.bodyParts.some(b => b.toLowerCase().includes(query));
                
                return nameMatch || localNameMatch || muscleMatch || equipMatch || bodyPartMatch;
            });
            
            // Renderiza no máximo 100 para não travar o navegador
            renderExercises(filtered.slice(0, 100));
            
            if(filtered.length > 100) {
                stats.innerText = `Mostrando 100 de ${filtered.length} exercícios encontrados (refine a busca)`;
            } else {
                stats.innerText = `Mostrando ${filtered.length} exercícios encontrados`;
            }
        }

        searchInput.addEventListener('input', filterExercises);

        // Inicializa com os primeiros 100 do Catálogo
        renderExercises(exercisesData.slice(0, 100));
        if(exercisesData.length > 100) {
            stats.innerText = `Mostrando 100 de ${exercisesData.length} exercícios (use a busca)`;
        }
        
        // Inicializa aba de Treinos
        initWorkoutTab();
    </script>
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</body>
</html>
"""
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)

    print("Site gerado com sucesso!")
    print("Para visualizar, inicie um servidor local executando:")
    print("python -m http.server 8000")

if __name__ == "__main__":
    main()