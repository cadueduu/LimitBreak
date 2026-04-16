import os
import concurrent.futures
from deep_translator import GoogleTranslator
import time
import re
import unicodedata

FOLDER = "gifs"

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def sanitize_filename(name):
    # Transforma espaços e caracteres especiais em underscore
    name = remove_accents(name)
    name = re.sub(r'[^a-zA-Z0-9]', '_', name)
    # Remove underscores duplicados
    name = re.sub(r'_+', '_', name)
    return name.strip('_').lower()

def process_file(filename):
    if not filename.endswith(".gif"):
        return False
        
    parts = filename.split('_', 1)
    if len(parts) < 2:
        return False
        
    ex_id = parts[0]
    english_name_with_ext = parts[1]
    
    english_name = english_name_with_ext.rsplit('.', 1)[0].replace('_', ' ')
    
    try:
        pt_name = GoogleTranslator(source='en', target='pt').translate(english_name)
        safe_pt_name = sanitize_filename(pt_name)
        
        new_filename = f"{ex_id}_{safe_pt_name}.gif"
        old_path = os.path.join(FOLDER, filename)
        new_path = os.path.join(FOLDER, new_filename)
        
        if old_path != new_path:
            if old_path.lower() != new_path.lower():
                if os.path.exists(new_path):
                    os.remove(new_path)
                os.rename(old_path, new_path)
            return True
    except Exception as e:
        pass
        
    return False

def main():
    if not os.path.exists(FOLDER):
        print("Pasta 'gifs' não encontrada.")
        return
        
    files = [f for f in os.listdir(FOLDER) if f.endswith(".gif")]
    print(f"Iniciando tradução de {len(files)} nomes de arquivos...")
    start_time = time.time()
    
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_file, f): f for f in files}
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            if future.result():
                success += 1
            if i % 100 == 0 or i == len(files):
                print(f"Progresso: {i}/{len(files)} processados...")
                
    end_time = time.time()
    print(f"\nConcluído em {end_time - start_time:.2f} segundos!")
    print(f"Total renomeados para o português: {success}/{len(files)}")

if __name__ == '__main__':
    main()
