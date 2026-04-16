import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Supabase query error for saved workouts
content = content.replace('profiles ( full_name )', 'profiles!workout_sheets_user_id_fkey ( full_name )')

# 2. Update renderExercises HTML card in app.js
# Find the card.innerHTML section
old_card_html = """
        card.innerHTML = `
            <div class="h-56 bg-gray-800 flex items-center justify-center border-b border-gray-700 p-2 relative group">
                <img src="${imgSrc}" alt="${displayName}" class="max-h-full max-w-full object-contain mix-blend-multiply" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=GIF+Indisponível'">
                <div class="absolute inset-0 bg-orange-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
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
                <h2 class="text-lg font-bold text-gray-100 mb-2 line-clamp-2 pr-12">${displayName}</h2>
                <div class="mt-auto flex flex-wrap gap-2">
                    <span class="inline-block bg-orange-950 border border-orange-700 text-orange-400 text-xs px-2 py-1 rounded-md uppercase font-semibold">${bodyParts}</span>
                    <span class="inline-block bg-red-950 border border-red-700 text-red-400 text-xs px-2 py-1 rounded-md uppercase font-semibold">${targetMuscles}</span>
                </div>
            </div>
        `;
"""

new_card_html = """
        card.innerHTML = `
            <div class="h-56 bg-white flex items-center justify-center border-b border-gray-700 p-2 relative group rounded-t-xl">
                <img src="${imgSrc}" alt="${displayName}" class="max-h-full max-w-full object-contain mix-blend-multiply" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=GIF+Indisponível'">
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
"""

content = content.replace(old_card_html.strip(), new_card_html.strip())

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('app.js updated successfully!')
