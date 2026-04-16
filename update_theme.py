import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'bg-gray-100': 'bg-black',
    'bg-white': 'bg-gray-900',
    'text-gray-800': 'text-gray-100',
    'text-gray-700': 'text-gray-200',
    'text-gray-600': 'text-gray-300',
    'text-gray-500': 'text-gray-400',
    'bg-gray-50': 'bg-gray-800',
    'bg-gray-200': 'bg-gray-800',
    'border-gray-200': 'border-gray-700',
    'border-gray-300': 'border-gray-700',
    'border-gray-100': 'border-gray-800',
    
    'text-blue-600': 'text-orange-500',
    'text-blue-800': 'text-orange-600',
    'bg-blue-600': 'bg-orange-600',
    'bg-blue-700': 'bg-orange-700',
    'bg-blue-50': 'bg-orange-900',
    'bg-blue-100': 'bg-orange-800',
    'border-blue-100': 'border-orange-800',
    'border-blue-200': 'border-orange-700',
    'focus:ring-blue-500': 'focus:ring-orange-500',
    'focus:border-blue-500': 'focus:border-orange-500',
    
    'text-purple-700': 'text-red-500',
    'text-purple-800': 'text-red-500',
    'bg-purple-600': 'bg-red-600',
    'bg-purple-700': 'bg-red-700',
    'bg-purple-100': 'bg-red-900',
    'bg-purple-50': 'bg-red-950',
    'border-purple-200': 'border-red-800',
    'border-purple-100': 'border-red-900',
    'border-purple-500': 'border-red-500',
    'focus:ring-purple-500': 'focus:ring-red-500',
    
    # Text changes
    'text-black': 'text-white',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Logo logic
logo_html = '<img src="logo.jpeg" alt="LimitBreak Logo" class="h-12 w-auto inline-block mr-2 rounded-lg shadow-sm">'
content = content.replace('>LimitBreak 💪<', f'>{logo_html}LimitBreak 💪<')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('index.html updated')

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('#2563eb', '#ea580c') # blue-600 to orange-600
css = css.replace('background-color: #f8fafc', 'background-color: #1f2937') # hover workout-item
css = css.replace('background: white', 'background: #111827') # body-part-img

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('style.css updated')
