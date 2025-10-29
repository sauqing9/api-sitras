# --- 1. IMPORT LIBRARY YANG DIBUTUHKAN ---
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import time
import joblib  # <-- TAMBAHKAN INI

print("Memulai skrip pelatihan model...")

# --- 2. MEMBACA DATASET DARI FILE CSV ---
file_path = 'data_deviasi_15-20.csv' # Pastikan file ini ada di folder yang sama
try:
    df = pd.read_csv(file_path)
    print(f"Step 1: Berhasil membaca dataset dari '{file_path}'.\n")
except FileNotFoundError:
    print(f"Error: File '{file_path}' tidak ditemukan.")
    exit()

# --- 3. FEATURE ENGINEERING ---
print("Step 2: Melakukan feature engineering...")
X_source = df[['pH_deviasi', 'Nitrogen_deviasi', 'Phosphorus_deviasi', 'Potassium_deviasi']]
y = df[['pH_aktual', 'Nitrogen_aktual', 'Phosphorus_aktual', 'Potassium_aktual']]

X_engineered = X_source.copy()
X_engineered['N_div_P'] = X_engineered['Nitrogen_deviasi'] / (X_engineered['Phosphorus_deviasi'] + 1e-6)
X_engineered['N_div_K'] = X_engineered['Nitrogen_deviasi'] / (X_engineered['Potassium_deviasi'] + 1e-6)
X_engineered['P_div_K'] = X_engineered['Phosphorus_deviasi'] / (X_engineered['Potassium_deviasi'] + 1e-6)
X_engineered['N_kali_pH'] = X_engineered['Nitrogen_deviasi'] * X_engineered['pH_deviasi']
X_engineered['P_kali_pH'] = X_engineered['Phosphorus_deviasi'] * X_engineered['pH_deviasi']
X_engineered['K_kali_pH'] = X_engineered['Potassium_deviasi'] * X_engineered['pH_deviasi']
print("Feature engineering selesai.\n")

# --- 4. MEMBAGI DATA LATIH & UJI ---
X_train, X_test, y_train, y_test = train_test_split(X_engineered, y, test_size=0.2, random_state=42)

# --- 5. HYPERPARAMETER TUNING ---
print("Step 3: Mencari hyperparameter terbaik...")
param_distributions = {
    'n_estimators': [int(x) for x in np.linspace(start=100, stop=1000, num=10)],
    'max_depth': [int(x) for x in np.linspace(10, 50, num=5)] + [None],
    'min_samples_split': [2, 5, 10], 'min_samples_leaf': [1, 2, 4], 'max_features': ['sqrt', 'log2']
}
rf = RandomForestRegressor(random_state=42)
rf_random = RandomizedSearchCV(estimator=rf, param_distributions=param_distributions, n_iter=50, cv=3, random_state=42, n_jobs=-1)
rf_random.fit(X_train, y_train)
best_model = rf_random.best_estimator_
print("Pencarian hyperparameter selesai.\n")

# --- 6. EVALUASI MODEL PADA DATA UJI ---
print("Step 4: Mengevaluasi model pada data uji (20% data)...")
y_pred_test = best_model.predict(X_test)
r2_test = r2_score(y_test, y_pred_test)
print(f"R-squared (R2) Score: {r2_test:.4f}")
print("---------------------------------\n")

# --- 7. SIMPAN MODEL KE FILE ---
# <-- TAMBAHKAN BAGIAN INI -->
model_filename = 'kalibrasi_npkph_model.joblib'
feature_columns = list(X_engineered.columns)

# Simpan model dan daftar kolom fitur
joblib.dump({
    'model': best_model,
    'feature_columns': feature_columns
}, model_filename)

print(f"Step 5: Model dan kolom fitur berhasil disimpan ke '{model_filename}'")
print("Pelatihan selesai.")
