import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import os # <-- TAMBAHKAN INI

print("Memulai ML API Service...")

# Inisialisasi aplikasi Flask
app = Flask(__name__)
# Izinkan request dari semua asal (termasuk server Node.js Anda)
CORS(app) 

# Muat model dan kolom fitur dari file
model_filename = 'kalibrasi_npkph_model.joblib'
try:
    # Pastikan file .joblib ada di folder yang sama saat mendeploy
    model_data = joblib.load(model_filename)
    model = model_data['model']
    model_feature_columns = model_data['feature_columns']
    print(f"Model '{model_filename}' berhasil dimuat.")
    print(f"Fitur yang diharapkan oleh model: {model_feature_columns}")
except FileNotFoundError:
    print(f"Error: File model '{model_filename}' tidak ditemukan.")
    print("Pastikan Anda sudah menjalankan 'latih_model.py' terlebih dahulu.")
    model = None # <-- Jangan exit, biarkan server berjalan untuk memberi error
except KeyError:
    print(f"Error: Format file '{model_filename}' salah.")
    print("Pastikan file berisi dictionary {'model': ..., 'feature_columns': ...}")
    model = None

def engineer_features(input_data):
    """
    Fungsi ini WAJIB sama persis dengan feature engineering 
    saat Anda melatih model.
    """
    X_engineered = input_data.copy()
    X_engineered['N_div_P'] = X_engineered['Nitrogen_deviasi'] / (X_engineered['Phosphorus_deviasi'] + 1e-6)
    X_engineered['N_div_K'] = X_engineered['Nitrogen_deviasi'] / (X_engineered['Potassium_deviasi'] + 1e-6)
    X_engineered['P_div_K'] = X_engineered['Phosphorus_deviasi'] / (X_engineered['Potassium_deviasi'] + 1e-6)
    X_engineered['N_kali_pH'] = X_engineered['Nitrogen_deviasi'] * X_engineered['pH_deviasi']
    X_engineered['P_kali_pH'] = X_engineered['Phosphorus_deviasi'] * X_engineered['pH_deviasi']
    X_engineered['K_kali_pH'] = X_engineered['Potassium_deviasi'] * X_engineered['pH_deviasi']
    return X_engineered

# Ini adalah "Health Check" yang diminta Render untuk memastikan server hidup
@app.route('/')
def health_check():
    return jsonify({"status": "ML API Service is Online"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model ML tidak dimuat, periksa log server.'}), 500

    try:
        # 1. Ambil data JSON dari request (dari server Node.js Anda)
        data = request.json
        
        input_df = pd.DataFrame({
            'pH_deviasi': [data['pH']],
            'Nitrogen_deviasi': [data['N']],
            'Phosphorus_deviasi': [data['P']],
            'Potassium_deviasi': [data['K']]
        })

        # 2. Lakukan feature engineering
        input_engineered = engineer_features(input_df)
        
        # Pastikan urutan kolom sama persis dengan saat training
        input_engineered = input_engineered[model_feature_columns]
        
        # 3. Lakukan prediksi
        prediction = model.predict(input_engineered)[0]
        
        # 4. Format output
        output = {
            'pH_calibrated': round(prediction[0], 2),
            'N_calibrated': round(prediction[1], 2),
            'P_calibrated': round(prediction[2], 2),
            'K_calibrated': round(prediction[3], 2)
        }
        
        return jsonify(output)

    except Exception as e:
        print(f"Error saat prediksi: {e}")
        return jsonify({'error': str(e)}), 400

# --- MODIFIKASI BAGIAN INI UNTUK PRODUKSI ---
if __name__ == '__main__':
    # Ambil Port dari Environment Variable yang diberikan Render
    # Default ke 5001 jika dijalankan di lokal
    port = int(os.environ.get('PORT', 5001))
    
    # Jalankan server agar bisa diakses dari luar (bukan hanya localhost)
    print(f"ML API Service akan berjalan di port {port}")
    # 'debug=True' akan otomatis mati di produksi jika tidak di-set secara eksplisit
    app.run(host='0.0.0.0', port=port)