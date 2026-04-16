import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the image background in Montar Treino list
old_img = '<img src="${ex.localGif || ex.gifUrl}" class="w-14 h-14 object-contain rounded-md border bg-white mix-blend-multiply">'
new_img = '<div class="bg-white p-1 rounded-md border border-gray-700 flex-shrink-0"><img src="${ex.localGif || ex.gifUrl}" class="w-12 h-12 object-contain mix-blend-multiply"></div>'
content = content.replace(old_img, new_img)

# 2. Fix the alignment of Técnica, Séries x Reps, Descanso
old_grid = '''                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-900 p-2 rounded border border-gray-800 relative group">
                        ${ex.blocks.length > 1 ? `
                        <button onclick="removeBlockFromExercise('${ex.exerciseId}', '${block.id}')" class="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Remover Bloco">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                        ` : ''}
                        
                        <div class="flex flex-col col-span-2 sm:col-span-1">'''

new_grid = '''                    <div class="flex flex-wrap sm:flex-nowrap items-end gap-2 bg-gray-900 p-2 rounded border border-gray-800 relative group">
                        ${ex.blocks.length > 1 ? `
                        <button onclick="removeBlockFromExercise('${ex.exerciseId}', '${block.id}')" class="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Remover Bloco">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                        ` : ''}
                        
                        <div class="flex flex-col flex-grow sm:w-1/3">'''

content = content.replace(old_grid, new_grid)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated app.js!')
