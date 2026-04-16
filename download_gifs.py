import requests
import os
import time
import concurrent.futures
from deep_translator import GoogleTranslator
import re
import unicodedata

API_URL = "https://raw.githubusercontent.com/bradbelcher/exercisedb-api/main/src/data/exercises.json"
OUTPUT_FOLDER = "gifs"

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sanitize_filename(name):
    name = remove_accents(name)
    name = re.sub(r'[^a-zA-Z0-9]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_').lower()

def fetch_exercises():
    print("Baixando a base de dados de exercícios diretamente do repositório (1500 exercícios)...")
    start_time = time.time()
    
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            exercises = response.json()
            end_time = time.time()
            print(f"Tempo total de requisição: {end_time - start_time:.2f} segundos")
            print(f"Total de exercícios encontrados: {len(exercises)}")
            return exercises
        else:
            print(f"Erro ao acessar JSON: {response.status_code}")
    except Exception as e:
        print(f"Erro na requisição: {e}")
        
    return []

def download_gif(exercise):
    gif_url = exercise.get("gifUrl")
    exercise_id = exercise.get("exerciseId")
    english_name = exercise.get("name", "sem_nome")
    
    if not gif_url:
        return False
        
    try:
        pt_name = GoogleTranslator(source='en', target='pt').translate(english_name)
    except:
        pt_name = english_name # fallback
        
    name = sanitize_filename(pt_name)
        
    filename = f"{exercise_id}_{name}.gif"
    filepath = os.path.join(OUTPUT_FOLDER, filename)
    
    if os.path.exists(filepath):
        # Já baixado
        return True
        
    try:
        response = requests.get(gif_url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
        elif response.status_code == 429:
            # Se a CDN bloquear por 429, espera e tenta mais uma vez
            time.sleep(5)
            response = requests.get(gif_url, stream=True, timeout=10)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                return True
            else:
                pass # Silenciar para não poluir terminal
        else:
            pass # Silenciar 404s para não poluir
    except Exception as e:
        pass # Silenciar erros para não crachar
        
    return False

def main():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        
    exercises = fetch_exercises()
    
    if not exercises:
        print("Nenhum exercício encontrado.")
        return
        
    print(f"Iniciando o download de {len(exercises)} GIFs para a pasta '{OUTPUT_FOLDER}'...")
    start_download_time = time.time()
    
    success_count = 0
    
    # Usando ThreadPoolExecutor para baixar de forma concorrente e mais rápida
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(download_gif, ex): ex for ex in exercises}
        
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            if future.result():
                success_count += 1
            if i % 50 == 0 or i == len(exercises):
                print(f"Progresso: {i}/{len(exercises)} baixados...")
                
    end_download_time = time.time()
    print(f"\nDownload concluído!")
    print(f"Tempo total de download: {end_download_time - start_download_time:.2f} segundos")
    print(f"GIFs baixados com sucesso: {success_count}/{len(exercises)}")

if __name__ == "__main__":
    main()
