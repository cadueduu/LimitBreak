import os
import json
import requests
import time
import concurrent.futures

API_KEY = '68e9e3266amsh33bf4e6355a2b56p109dc5jsnce63fd2f70ff'
API_HOST = 'muscle-visualizer-api.p.rapidapi.com'

HEADERS = {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY
}

OUTPUT_FOLDER = "anatomy_combined"

# Cache de suporte para evitar consultar toda hora
SUPPORTED_MUSCLES = [
    'abdominals', 'abs', 'abductors', 'adductors', 'adductor longUS', 'adductor brevis', 'adductor magnus',
    'back', 'biceps', 'biceps brachii', 'brachialis', 'brachioradialis', 'calves', 'chest', 'core',
    'deep hip external rotators', 'deltoids', 'delts', 'anterior deltoid', 'lateral deltoid', 'posterior deltoid',
    'rear deltoids', 'erector spinae', 'forearms', 'gastrocnemius', 'glutes', 'gluteus maximus', 'gluteus medius',
    'gluteus minimus', 'grip muscles', 'groin', 'hamstrings', 'hip flexors', 'iliopsoas', 'infraspinatus',
    'inner thighs', 'latissimus dorsi', 'lats', 'levator scapulae', 'lower back', 'obliques', 'pectineus',
    'pectorals', 'pectoralis major clavicular head', 'pectoralis major sternal head', 'popliteus', 'quadriceps',
    'quads', 'rectus abdominis', 'rhomboids', 'rotator cuff', 'sartorius', 'serratus anterior', 'serratus ante',
    'shins', 'shoulders', 'soleus', 'spine', 'splenius', 'subscapularis', 'tensor fasciae latae', 'teres major',
    'teres minor', 'tibialis anterior', 'transversus abdominis', 'trapezius', 'traps', 'trapezius lower fibers',
    'trapezius middle fibers', 'trapezius upper fibers', 'triceps', 'triceps brachii', 'upper back', 'upper chest',
    'wrist extensors', 'wrist flexors', 'wrists', 'neck', 'legs'
]

def get_valid_muscles_string(ex):
    muscles_to_combine = set()
    
    # 1. Tentar adicionar targetMuscles
    if ex.get('targetMuscles'):
        for m in ex['targetMuscles']:
            m_lower = m.lower().strip()
            # Mapeamento para garantir que a API vai entender
            if m_lower in SUPPORTED_MUSCLES:
                muscles_to_combine.add(m_lower)
            elif m_lower == 'cardiovascular system':
                muscles_to_combine.add('cardio')
            elif m_lower == 'upper arms':
                muscles_to_combine.add('biceps')
                muscles_to_combine.add('triceps')
            elif m_lower == 'lower arms':
                muscles_to_combine.add('forearms')
            elif m_lower == 'lower legs':
                muscles_to_combine.add('calves')
            elif m_lower == 'upper legs':
                muscles_to_combine.add('quads')
                muscles_to_combine.add('hamstrings')

    # 2. Tentar adicionar secondaryMuscles para ter um mapa completo de tudo que o exercício trabalha
    if ex.get('secondaryMuscles'):
        for m in ex['secondaryMuscles']:
            m_lower = m.lower().strip()
            if m_lower in SUPPORTED_MUSCLES:
                muscles_to_combine.add(m_lower)
            elif m_lower == 'cardiovascular system':
                muscles_to_combine.add('cardio')
            elif m_lower == 'upper arms':
                muscles_to_combine.add('biceps')
                muscles_to_combine.add('triceps')
            elif m_lower == 'lower arms':
                muscles_to_combine.add('forearms')
            elif m_lower == 'lower legs':
                muscles_to_combine.add('calves')
            elif m_lower == 'upper legs':
                muscles_to_combine.add('quads')
                muscles_to_combine.add('hamstrings')
                
    # 3. Fallback: Se ainda estiver vazio, tentar usar a categoria geral do corpo (bodyParts)
    if not muscles_to_combine and ex.get('bodyParts'):
        for bp in ex['bodyParts']:
            bp_lower = bp.lower().strip()
            if bp_lower in SUPPORTED_MUSCLES:
                muscles_to_combine.add(bp_lower)
            elif bp_lower == 'chest':
                muscles_to_combine.add('pectorals')
            elif bp_lower == 'back':
                muscles_to_combine.add('lats')
            elif bp_lower == 'upper arms':
                muscles_to_combine.add('biceps')
                muscles_to_combine.add('triceps')
            elif bp_lower == 'lower arms':
                muscles_to_combine.add('forearms')
            elif bp_lower == 'upper legs':
                muscles_to_combine.add('quads')
                muscles_to_combine.add('hamstrings')
            elif bp_lower == 'lower legs':
                muscles_to_combine.add('calves')
            elif bp_lower == 'shoulders':
                muscles_to_combine.add('delts')
            elif bp_lower == 'waist':
                muscles_to_combine.add('abs')
            elif bp_lower == 'neck':
                muscles_to_combine.add('traps')
                
    if not muscles_to_combine:
        return None
        
    return ",".join(muscles_to_combine).upper()

def download_combined_anatomy(exercise):
    ex_id = exercise.get('exerciseId')
    muscles_str = get_valid_muscles_string(exercise)
    
    if not muscles_str:
        return False
        
    filename = f"{ex_id}.jpeg"
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    
    if os.path.exists(filepath):
        return True
        
    url = f"https://{API_HOST}/api/v1/visualize"
    params = {
        'muscles': muscles_str,
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
        elif response.status_code == 429:
            time.sleep(2)
            response = requests.get(url, headers=HEADERS, params=params, stream=True, timeout=15)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                return True
    except Exception as e:
        pass
        
    return False

def main():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        
    print("Carregando lista de exercícios localmente...")
    try:
        with open('data.js', 'r', encoding='utf-8') as f:
            content = f.read().replace('const exercisesData = ', '').replace(';\n', '')
            exercises = json.loads(content)
    except:
        print("data.js não encontrado. Rode build_web.py primeiro.")
        return
        
    # Filtrar apenas os que a gente baixou GIF e que tem no data.js local (são uns 1324)
    local_exercises = [ex for ex in exercises if ex.get('localGif') is not None]
    print(f"Total de exercícios com GIF local para baixar anatomia combinada: {len(local_exercises)}")
    
    start_time = time.time()
    success = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_combined_anatomy, ex): ex for ex in local_exercises}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            if future.result():
                success += 1
            if i % 50 == 0 or i == len(local_exercises):
                print(f"Progresso: {i}/{len(local_exercises)} imagens de anatomia processadas...")
            
    end_time = time.time()
    print(f"\nConcluído em {end_time - start_time:.2f} segundos.")
    print(f"Imagens combinadas baixadas com sucesso: {success}/{len(local_exercises)} na pasta '{OUTPUT_FOLDER}'.")

if __name__ == '__main__':
    main()