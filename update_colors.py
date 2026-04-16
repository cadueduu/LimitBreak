import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# sets input
content = content.replace(
    'class="w-8 border border-gray-700 rounded px-1 py-1 text-xs text-center focus:ring-1 focus:ring-orange-500"',
    'class="w-8 border border-gray-700 rounded px-1 py-1 text-xs text-center bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500"'
)

# reps input
content = content.replace(
    'class="w-12 border border-gray-700 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-orange-500"',
    'class="w-12 border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500"'
)

# restTime input
content = content.replace(
    'class="w-full border border-gray-700 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-orange-500"',
    'class="w-full border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500"'
)

# select text color just in case
content = content.replace(
    'class="w-full border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 focus:ring-1 focus:ring-orange-500"',
    'class="w-full border border-gray-700 rounded px-1 py-1 text-xs bg-gray-800 text-gray-400 focus:ring-1 focus:ring-orange-500"'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated app.js text colors!')
