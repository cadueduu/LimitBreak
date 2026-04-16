import os
import json
import requests
import time
import concurrent.futures

API_KEY = '01beb3ae15mshc83dd24a6998499p13f2f2jsnfef149ed2b0a'
API_HOST = 'muscle-visualizer-api.p.rapidapi.com'

HEADERS = {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY
}

OUTPUT_FOLDER = "anatomy"

def get_available_muscles():
    response = requests.get(f'https://{API_HOST}/api/v1/muscles', headers=HEADERS)
    if response.status_code == 200:
        return [m.lower() for m in response.json().get('data', [])]
    return []

def download_anatomy(muscle):
    filename = f"{muscle.replace(' ', '_')}.jpeg"
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    
    if os.path.exists(filepath):
        return True
        
    url = f"https://{API_HOST}/api/v1/visualize"
    params = {
        'muscles': muscle.upper(),
        'color': '#D20A2E',
        'gender': 'male',
        'background': 'transparent',
        'size': 'small',
        'format': 'jpeg'
    }
    
    try:
        response = requests.get(url, headers=HEADERS, params=params, stream=True, timeout=15)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
        else:
            print(f"Erro {response.status_code} ao baixar anatomia de {muscle}")
    except Exception as e:
        print(f"Exceção ao baixar anatomia de {muscle}: {e}")
        
    return False

def main():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        
    print("Obtendo músculos suportados pela API Muscle Visualizer...")
    supported_muscles = get_available_muscles()
    print(f"Total suportado: {len(supported_muscles)}")
    
    print("Carregando lista de músculos da ExerciseDB localmente...")
    try:
        # Puxa dados que já geramos localmente
        with open('data.js', 'r', encoding='utf-8') as f:
            content = f.read().replace('const exercisesData = ', '').replace(';\n', '')
            exercises = json.loads(content)
    except:
        print("data.js não encontrado. Rode build_web.py primeiro.")
        return
        
    # Extrair todos os targetMuscles e bodyParts
    muscles_to_download = set()
    for ex in exercises:
        if ex.get('targetMuscles'):
            for m in ex['targetMuscles']:
                muscles_to_download.add(m.lower().strip())
        if ex.get('bodyParts'):
            for bp in ex['bodyParts']:
                muscles_to_download.add(bp.lower().strip())
                
    print(f"Músculos totais encontrados nos exercícios: {len(muscles_to_download)}")
    
    # Mapeamento para cruzar o que a ExerciseDB tem e o que a API Visualizer entende
    valid_downloads = set()
    for m in muscles_to_download:
        # Mapeamentos diretos
        if m in supported_muscles:
            valid_downloads.add(m)
        elif m == 'cardiovascular system':
            valid_downloads.add('cardio')
        elif m == 'upper arms':
            valid_downloads.add('biceps')
            valid_downloads.add('triceps')
        elif m == 'lower arms':
            valid_downloads.add('forearms')
        elif m == 'lower legs':
            valid_downloads.add('calves')
        elif m == 'upper legs':
            valid_downloads.add('quads')
            valid_downloads.add('hamstrings')
            
    print(f"Baixando {len(valid_downloads)} imagens válidas...")
    
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_anatomy, m): m for m in valid_downloads}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            if future.result():
                success += 1
            print(f"Progresso: {i}/{len(valid_downloads)}")
            
    print(f"Concluído: {success}/{len(valid_downloads)} imagens baixadas na pasta '{OUTPUT_FOLDER}'.")

if __name__ == '__main__':
    main()